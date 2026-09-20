"""Tests for scripts/check_sources.py source-monitor contracts.

The tests mock all network fetches. They verify baseline creation, unchanged
checks, change candidate persistence, failure preservation, public status shape,
and that data.json is never modified by the monitor.
"""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
SCRIPT = PROJECT / "scripts" / "check_sources.py"

spec = importlib.util.spec_from_file_location("check_sources", SCRIPT)
check_sources = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(check_sources)

ARTICLE_URL = "https://www.anthropic.com/research/labor-market-impacts"
FIGURE_URL = "https://cdn.sanity.io/images/4zrzovbb/website/c1952c81bca02a7c8cc05ef7801e67ca60831c55-4096x4096.png"
PDF_URL = "https://cdn.sanity.io/files/4zrzovbb/website/2b5bbaf2c1eb81dbf6e6fb813c1a24e35a64d376.pdf"
RESEARCH_URL = "https://www.anthropic.com/research"
INDEX_URL = "https://www.anthropic.com/economic-index"
FIGURE_BYTES = b"figure image bytes v1"
PDF_BYTES = b"%PDF-1.7\nreport bytes v1\n%%EOF"


def article_html(text: str = "original article text", pdf_url: str = PDF_URL, asset: str = FIGURE_URL) -> bytes:
    return f"""
    <html>
      <head><style>.x{{display:none}}</style><script>ignore()</script></head>
      <body>
        <nav>navigation labor noise</nav>
        <main>
          <h1>Labor market impacts</h1>
          <p>{text}</p>
          <img src="{asset}" />
          <a href="{pdf_url}">Download PDF</a>
        </main>
        <footer>footer noise</footer>
      </body>
    </html>
    """.encode()


DISCOVERY_HTML = b"""
<html><body>
<a href="/research/labor-market-impacts">Labor market impacts</a>
<a href="/news/company">Company news</a>
<a href="https://www.anthropic.com/economic-index">Economic index</a>
<a href="file:///etc/passwd">Bad local file</a>
</body></html>
"""


class FakeFetcher:
    def __init__(self, mapping: dict[str, bytes | Exception]):
        self.mapping = mapping
        self.calls: list[tuple[str, int, bool]] = []

    def __call__(self, url: str, max_bytes: int, binary: bool):
        self.calls.append((url, max_bytes, binary))
        value = self.mapping[url]
        if isinstance(value, Exception):
            raise value
        if url.endswith(".pdf"):
            content_type = "application/pdf"
        elif binary:
            content_type = "image/png"
        else:
            content_type = "text/html; charset=utf-8"
        return check_sources.FetchResult(url, value, content_type)


class SourceMonitorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="source-monitor-test-"))
        (self.tmp / "research").mkdir()
        (self.tmp / "data.json").write_text(
            json.dumps(
                {
                    "meta": {
                        "sourceUrl": ARTICLE_URL,
                        "figureUrl": FIGURE_URL,
                        "publishedAt": "2026-03-05",
                    },
                    "categories": [],
                },
                sort_keys=True,
            ),
            encoding="utf-8",
        )
        (self.tmp / "research" / "figure-2.png").write_bytes(FIGURE_BYTES)
        (self.tmp / "research" / "anthropic-report.pdf").write_bytes(PDF_BYTES)
        self.now_counter = 0

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp)

    def now(self) -> str:
        self.now_counter += 1
        return f"2026-09-20T15:34:{self.now_counter:02d}Z"

    def fetcher(self, article: bytes | None = None, figure: bytes | Exception = FIGURE_BYTES, pdf: bytes | Exception = PDF_BYTES):
        return FakeFetcher(
            {
                ARTICLE_URL: article if article is not None else article_html(),
                FIGURE_URL: figure,
                PDF_URL: pdf,
                RESEARCH_URL: DISCOVERY_HTML,
                INDEX_URL: DISCOVERY_HTML,
            }
        )

    def read_public(self) -> dict:
        return json.loads((self.tmp / "update-status.json").read_text(encoding="utf-8"))

    def read_state(self) -> dict:
        return json.loads((self.tmp / ".monitor" / "source-monitor-state.json").read_text(encoding="utf-8"))

    def test_first_run_establishes_baseline_without_claiming_new_report(self) -> None:
        before = (self.tmp / "data.json").read_bytes()
        result = check_sources.run_check(self.tmp, self.fetcher(), self.now)

        self.assertEqual(result["status"], "baseline")
        self.assertEqual(result["newCandidates"], 0)
        self.assertEqual(result["pendingCount"], 0)
        self.assertEqual(result["errors"], [])
        public = self.read_public()
        self.assertEqual(public["schemaVersion"], 1)
        self.assertEqual(public["status"], "baseline")
        self.assertEqual(public["pendingCount"], 0)
        self.assertEqual(public["history"], [{"at": result["lastCheckedAt"], "type": "baseline", "count": 0}])
        self.assertEqual(public["dataVersion"]["publishedAt"], "2026-03-05")
        self.assertEqual(public["schedule"]["timezone"], "Asia/Shanghai")
        self.assertTrue(all(item["ok"] for item in public["sourceChecks"]))
        self.assertNotIn(".monitor", json.dumps(public))
        self.assertEqual((self.tmp / "data.json").read_bytes(), before)

    def test_unchanged_after_baseline(self) -> None:
        check_sources.run_check(self.tmp, self.fetcher(), self.now)
        result = check_sources.run_check(self.tmp, self.fetcher(), self.now)

        self.assertEqual(result["status"], "unchanged")
        self.assertEqual(result["newCandidates"], 0)
        self.assertEqual(result["pendingCount"], 0)
        self.assertEqual(self.read_public()["status"], "unchanged")

    def test_article_change_creates_review_candidate_not_publication(self) -> None:
        check_sources.run_check(self.tmp, self.fetcher(), self.now)
        result = check_sources.run_check(self.tmp, self.fetcher(article_html("changed article text")), self.now)

        self.assertEqual(result["status"], "pending_review")
        self.assertEqual(result["newCandidates"], 1)
        state = self.read_state()
        self.assertEqual(len(state["pendingCandidates"]), 1)
        self.assertEqual(state["pendingCandidates"][0]["kind"], "source_change")
        self.assertIn("review before publishing", state["pendingCandidates"][0]["detail"])
        self.assertEqual(self.read_public()["pendingCount"], 1)

    def test_pending_candidate_persists_and_dedupes_on_later_runs(self) -> None:
        check_sources.run_check(self.tmp, self.fetcher(), self.now)
        changed = self.fetcher(article_html("changed article text"))
        first = check_sources.run_check(self.tmp, changed, self.now)
        second = check_sources.run_check(self.tmp, changed, self.now)
        reverted = check_sources.run_check(self.tmp, self.fetcher(), self.now)

        self.assertEqual(first["newCandidates"], 1)
        self.assertEqual(second["newCandidates"], 0)
        self.assertEqual(second["pendingCount"], 1)
        self.assertEqual(reverted["status"], "pending_review")
        self.assertEqual(reverted["pendingCount"], 1)
        self.assertEqual(len(self.read_state()["pendingCandidates"]), 1)

    def test_partial_failure_preserves_prior_baseline_and_does_not_claim_unchanged(self) -> None:
        check_sources.run_check(self.tmp, self.fetcher(), self.now)
        baseline = self.read_state()["baseline"]
        result = check_sources.run_check(
            self.tmp,
            self.fetcher(article_html("changed during partial outage"), figure=RuntimeError("figure timeout")),
            self.now,
        )

        self.assertEqual(result["status"], "check_failed")
        self.assertTrue(result["errors"])
        public = self.read_public()
        self.assertEqual(public["status"], "check_failed")
        self.assertTrue(any(not item["ok"] for item in public["sourceChecks"]))
        self.assertEqual(self.read_state()["baseline"], baseline)
        self.assertEqual(self.read_state()["pendingCandidates"], [])

    def test_public_status_readable_private_state_private(self) -> None:
        check_sources.run_check(self.tmp, self.fetcher(), self.now)
        self.assertEqual((self.tmp / "update-status.json").stat().st_mode & 0o777, 0o644)
        self.assertEqual((self.tmp / ".monitor/source-monitor-state.json").stat().st_mode & 0o777, 0o600)

    def test_first_run_difference_not_mislabelled_as_baseline(self) -> None:
        result = check_sources.run_check(self.tmp, self.fetcher(figure=b"changed"), self.now)
        self.assertEqual(result["status"], "pending_review")

    def test_html_ignores_unrelated_build_assets(self) -> None:
        a = b'<head><link href="/build-A.css"></head><main>labor research</main>'
        b = b'<head><link href="/build-B.css"></head><main>labor research</main>'
        self.assertEqual(check_sources.normalize_html(a, ARTICLE_URL), check_sources.normalize_html(b, ARTICLE_URL))

    def test_local_asset_difference_is_retained_as_candidate(self) -> None:
        result = check_sources.run_check(self.tmp, self.fetcher(figure=b"new figure bytes"), self.now)

        self.assertEqual(result["status"], "pending_review")
        self.assertEqual(result["newCandidates"], 1)
        self.assertEqual(result["pendingCount"], 1)
        candidate = self.read_state()["pendingCandidates"][0]
        self.assertEqual(candidate["kind"], "local_asset_difference")
        self.assertIn("research/figure-2.png", candidate["detail"])

    def test_public_state_is_atomic_valid_json_and_bounded_history(self) -> None:
        check_sources.run_check(self.tmp, self.fetcher(), self.now)
        for index in range(25):
            check_sources.run_check(self.tmp, self.fetcher(article_html(f"changed {index}")), self.now)

        public_path = self.tmp / "update-status.json"
        public = json.loads(public_path.read_text(encoding="utf-8"))
        self.assertLessEqual(len(public["history"]), 20)
        self.assertFalse(list(self.tmp.glob(".update-status.json.*.tmp")))
        self.assertEqual(set(public), {"schemaVersion", "lastCheckedAt", "lastSuccessfulCheckAt", "status", "pendingCount", "sourceChecks", "history", "dataVersion", "schedule"})
        self.assertNotIn("source-monitor-state", json.dumps(public))

    def test_discovery_hash_uses_sorted_relevant_url_set_not_page_text(self) -> None:
        check_sources.run_check(self.tmp, self.fetcher(), self.now)
        noisy_discovery = b"""
        <html><body>new marketing copy that should not matter
        <a href="https://www.anthropic.com/economic-index">Economic index</a>
        <a href="/news/company">Company news</a>
        <a href="/research/labor-market-impacts">Labor market impacts</a>
        </body></html>
        """
        fake = FakeFetcher(
            {
                ARTICLE_URL: article_html(),
                FIGURE_URL: FIGURE_BYTES,
                PDF_URL: PDF_BYTES,
                RESEARCH_URL: noisy_discovery,
                INDEX_URL: noisy_discovery,
            }
        )
        result = check_sources.run_check(self.tmp, fake, self.now)

        self.assertEqual(result["status"], "unchanged")
        self.assertEqual(result["newCandidates"], 0)


if __name__ == "__main__":
    unittest.main()
