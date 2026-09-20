#!/usr/bin/env python3
"""Monitor upstream sources for the Labor Market Impacts page.

This script is intended for a weekly human-review workflow only. It never edits
``data.json`` and never publishes new values. It fetches the configured Anthropic
article, its configured figure asset, PDFs linked from that article, and a small
set of relevant Anthropic discovery links. Observed changes are stored as
persistent private review candidates under ``.monitor/`` and are summarized in
public ``update-status.json``. Candidates are deduplicated and are not cleared by
later unchanged checks; a person must review them and decide what, if anything,
to publish.

Contracts:
- CLI: ``python scripts/check_sources.py [--root PROJECT_ROOT]``. If ``--root``
  is omitted, the project root is inferred as the parent of this script's parent.
- Private state: ``.monitor/source-monitor-state.json`` plus hash snapshots under
  ``.monitor/snapshots/``.
- Public state: atomic write to ``update-status.json`` with schemaVersion 1. It
  contains no raw source text and no private paths.
- Fetching: only http(s) URLs are accepted. ``curl`` is used with bounded time,
  download sizes, and protocols to avoid urllib 403s and oversized downloads.
- Source content is untrusted data: linked instructions are ignored; only URLs,
  normalized visible text, and binary hashes are used for review signals.
"""

from __future__ import annotations

import argparse
import contextlib
import dataclasses
import datetime as _dt
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urldefrag, urljoin, urlparse

SCHEMA_VERSION = 1
STATE_VERSION = 1
MAX_HISTORY = 20
CURL_TIMEOUT_SECONDS = 20
MAX_TEXT_BYTES = 2_000_000
MAX_BINARY_BYTES = 12_000_000
ANTHROPIC_HOST_SUFFIX = "anthropic.com"
DISCOVERY_URLS = [
    "https://www.anthropic.com/research",
    "https://www.anthropic.com/economic-index",
]
DISCOVERY_KEYWORDS = ("labor", "labour", "workforce", "economic-index")
KNOWN_BASELINE_FIGURE_URL = "https://cdn.sanity.io/images/4zrzovbb/website/c1952c81bca02a7c8cc05ef7801e67ca60831c55-4096x4096.png"
KNOWN_BASELINE_PDF_URLS = {
    "https://cdn.sanity.io/files/4zrzovbb/website/2b5bbaf2c1eb81dbf6e6fb813c1a24e35a64d376.pdf",
}
PUBLIC_SCHEDULE = {
    "timezone": "Asia/Shanghai",
    "label": {"zh": "每周一 09:00", "en": "Mondays 09:00"},
}

FetchResult = dataclasses.make_dataclass(
    "FetchResult", [("url", str), ("content", bytes), ("content_type", str)]
)
Fetcher = Callable[[str, int, bool], FetchResult]


class VisibleTextParser(HTMLParser):
    """Small stdlib HTML visible-text and link extractor."""

    SKIP_TAGS = {"script", "style", "nav", "noscript", "svg", "iframe", "header", "footer"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._skip_stack: list[str] = []
        self.text_parts: list[str] = []
        self.links: list[str] = []
        self.asset_urls: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attrs_dict = {k.lower(): (v or "") for k, v in attrs}
        if tag in self.SKIP_TAGS:
            self._skip_stack.append(tag)
        if tag == "a" and attrs_dict.get("href"):
            self.links.append(attrs_dict["href"])
        for key in ("src", "href", "poster"):
            value = attrs_dict.get(key)
            if value:
                self.asset_urls.append(value)
        srcset = attrs_dict.get("srcset")
        if srcset:
            for item in srcset.split(","):
                url = item.strip().split(" ", 1)[0]
                if url:
                    self.asset_urls.append(url)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if self._skip_stack and self._skip_stack[-1] == tag:
            self._skip_stack.pop()
        elif tag in self._skip_stack:
            self._skip_stack.remove(tag)

    def handle_data(self, data: str) -> None:
        if not self._skip_stack and data.strip():
            self.text_parts.append(data)


def utc_now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    return sha256_bytes(text.encode("utf-8"))


def canonical_url(url: str, base: str | None = None) -> str:
    joined = urljoin(base, url) if base else url
    joined, _frag = urldefrag(joined)
    parsed = urlparse(joined)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError(f"unsupported URL scheme: {parsed.scheme or 'empty'}")
    if not parsed.netloc:
        raise ValueError("URL is missing host")
    return parsed.geturl()


def is_anthropic_url(url: str) -> bool:
    host = urlparse(url).netloc.lower().split(":", 1)[0]
    return host == ANTHROPIC_HOST_SUFFIX or host.endswith("." + ANTHROPIC_HOST_SUFFIX)


def is_relevant_url(url: str) -> bool:
    lowered = url.lower()
    return is_anthropic_url(url) and any(keyword in lowered for keyword in DISCOVERY_KEYWORDS)


def normalize_html(content: bytes, base_url: str) -> tuple[str, list[str], list[str]]:
    parser = VisibleTextParser()
    decoded = content.decode("utf-8", errors="replace")
    main = re.search(r"<(main|article)\b[^>]*>(.*?)</\1>", decoded, re.I | re.S)
    parser.feed(main.group(2) if main else decoded)
    text = html.unescape(" ".join(parser.text_parts))
    text = re.sub(r"\s+", " ", text).strip().lower()

    links: list[str] = []
    for raw in parser.links:
        with contextlib.suppress(ValueError):
            links.append(canonical_url(raw, base_url))

    assets: list[str] = []
    for raw in parser.asset_urls:
        with contextlib.suppress(ValueError):
            url = canonical_url(raw, base_url)
            if urlparse(url).hostname == "cdn.sanity.io":
                assets.append(url)
    return text, sorted(set(links)), sorted(set(assets))


def default_fetch(url: str, max_bytes: int, binary: bool) -> FetchResult:
    safe_url = canonical_url(url)
    if not shutil.which("curl"):
        raise RuntimeError("curl executable not found")
    # Separate header/body files: splitting arbitrary PDF/image bytes on CRLF
    # corrupts content. Do not use Range (could accept truncated 206 responses).
    if urlparse(safe_url).hostname not in {"www.anthropic.com", "anthropic.com", "cdn.sanity.io"}:
        raise ValueError("source host is not approved")
    with tempfile.TemporaryDirectory(prefix="labor-source-") as tmp:
        body_path = Path(tmp) / "body"
        command = ["curl", "--silent", "--show-error", "--fail",
                   "--proto", "=https", "--max-time", str(CURL_TIMEOUT_SECONDS),
                   "--connect-timeout", "10", "--max-filesize", str(max_bytes),
                   "--user-agent", "Mozilla/5.0 LaborMarketImpactsMonitor/1.0",
                   "--output", str(body_path), "--write-out", "%{http_code}\n%{content_type}", safe_url]
        proc = subprocess.run(command, check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                              timeout=CURL_TIMEOUT_SECONDS + 5)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.decode("utf-8", errors="replace").strip() or f"curl failed: {proc.returncode}")
        parts = proc.stdout.decode().split("\n", 1)
        if parts[0] != "200":
            raise RuntimeError(f"unexpected HTTP status: {parts[0]} (redirects require review)")
        content_type = parts[1].lower() if len(parts) > 1 else ""
        if body_path.stat().st_size > max_bytes:
            raise RuntimeError("source exceeds maximum download size")
        body = body_path.read_bytes()
    if not body:
        raise RuntimeError("empty source body")
    if binary:
        if urlparse(safe_url).path.lower().endswith(".pdf"):
            if not body.startswith(b"%PDF"):
                raise RuntimeError("invalid PDF signature")
        elif not body.startswith(b"\x89PNG\r\n\x1a\n"):
            raise RuntimeError("invalid figure PNG signature")
    elif content_type.split(";", 1)[0] not in {"text/html", "text/plain", "application/xhtml+xml"}:
        raise RuntimeError(f"unexpected text content type: {content_type}")
    return FetchResult(safe_url, body, content_type)


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def atomic_write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=2, sort_keys=True)
            fh.write("\n")
            fh.flush()
            os.fsync(fh.fileno())
        os.chmod(tmp_name, 0o644 if path.name == "update-status.json" else 0o600)
        os.replace(tmp_name, path)
    finally:
        with contextlib.suppress(FileNotFoundError):
            os.unlink(tmp_name)


def data_version(data_path: Path) -> dict[str, Any]:
    raw = data_path.read_bytes()
    parsed = json.loads(raw.decode("utf-8"))
    return {"publishedAt": parsed.get("meta", {}).get("publishedAt"), "sha256": sha256_bytes(raw)}


def candidate_id(kind: str, url: str, current_hash: str) -> str:
    return sha256_text("|".join([kind, url, current_hash]))[:24]


def add_candidate(state: dict[str, Any], kind: str, url: str, old_hash: str | None, new_hash: str, detail: str, at: str) -> bool:
    pending = state.setdefault("pendingCandidates", [])
    cid = candidate_id(kind, url, new_hash)
    if any(item.get("id") == cid for item in pending):
        return False
    pending.append({
        "id": cid,
        "kind": kind,
        "url": url,
        "firstSeenAt": at,
        "lastSeenAt": at,
        "oldHash": old_hash,
        "newHash": new_hash,
        "detail": detail,
    })
    return True


def update_candidate_last_seen(state: dict[str, Any], kind: str, url: str, new_hash: str, at: str) -> None:
    cid = candidate_id(kind, url, new_hash)
    for item in state.get("pendingCandidates", []):
        if item.get("id") == cid:
            item["lastSeenAt"] = at
            return


def append_history(history: list[dict[str, Any]], item: dict[str, Any]) -> list[dict[str, Any]]:
    return (history + [item])[-MAX_HISTORY:]


def public_source_checks(checks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{"name": c["name"], "url": c["url"], "checkedAt": c["checkedAt"], "ok": bool(c["ok"])} for c in checks]


def write_snapshot(root: Path, at: str, snapshot: dict[str, Any]) -> None:
    stamp = re.sub(r"[^0-9TZ]", "", at)
    path = root / ".monitor" / "snapshots" / f"{stamp}.json"
    atomic_write_json(path, snapshot)


def compare_local_asset(root: Path, state: dict[str, Any], url: str, fetched_hash: str, local_rel: str, at: str) -> bool:
    local_path = root / local_rel
    if not local_path.exists():
        return False
    local_hash = sha256_bytes(local_path.read_bytes())
    if local_hash != fetched_hash:
        return add_candidate(
            state,
            "local_asset_difference",
            url,
            local_hash,
            fetched_hash,
            f"Fetched source asset differs from checked-in {local_rel}; review before publishing.",
            at,
        )
    return False


def run_check(root: Path, fetcher: Fetcher = default_fetch, now_func: Callable[[], str] = utc_now_iso) -> dict[str, Any]:
    root = root.resolve()
    (root / ".monitor").mkdir(mode=0o700, exist_ok=True)
    data_path = root / "data.json"
    state_path = root / ".monitor" / "source-monitor-state.json"
    public_path = root / "update-status.json"
    data = json.loads(data_path.read_text(encoding="utf-8"))
    meta = data.get("meta", {})
    article_url = canonical_url(meta["sourceUrl"])
    figure_url = canonical_url(meta["figureUrl"])
    at = now_func()
    state = load_json(state_path, {"stateVersion": STATE_VERSION, "baseline": None, "pendingCandidates": [], "history": []})
    state.setdefault("stateVersion", STATE_VERSION)
    state.setdefault("pendingCandidates", [])
    state.setdefault("history", [])

    checks: list[dict[str, Any]] = []
    errors: list[str] = []
    snapshot: dict[str, Any] = {"checkedAt": at, "sources": {}}
    new_candidates = 0

    def record(name: str, url: str, ok: bool, error: str | None = None) -> None:
        checks.append({"name": name, "url": url, "checkedAt": at, "ok": ok})
        if error:
            errors.append(f"{name}: {error}")

    article_links: list[str] = []
    article_assets: list[str] = []
    try:
        article = fetcher(article_url, MAX_TEXT_BYTES, False)
        normalized_text, article_links, article_assets = normalize_html(article.content, article.url)
        if not normalized_text or "labor" not in normalized_text:
            raise RuntimeError("source article content not recognized")
        article_pdf_urls = sorted({u for u in article_links if urlparse(u).path.lower().endswith(".pdf")})
        article_hash = sha256_text(json.dumps({"text": normalized_text, "assets": article_assets}, sort_keys=True, ensure_ascii=False))
        snapshot["sources"]["article"] = {"url": article_url, "sha256": article_hash, "pdfUrls": article_pdf_urls, "assetUrls": article_assets}
        record("article", article_url, True)
    except Exception as exc:  # noqa: BLE001 - errors are reported in public status.
        article_pdf_urls = []
        record("article", article_url, False, str(exc))

    try:
        figure = fetcher(figure_url, MAX_BINARY_BYTES, True)
        figure_hash = sha256_bytes(figure.content)
        snapshot["sources"]["figure"] = {"url": figure_url, "sha256": figure_hash}
        record("figure", figure_url, True)
        if figure_url == KNOWN_BASELINE_FIGURE_URL:
            if compare_local_asset(root, state, figure_url, figure_hash, "research/figure-2.png", at):
                new_candidates += 1
    except Exception as exc:  # noqa: BLE001
        record("figure", figure_url, False, str(exc))

    pdf_hashes: dict[str, str] = {}
    for idx, pdf_url in enumerate(article_pdf_urls[:5], start=1):
        try:
            pdf = fetcher(pdf_url, MAX_BINARY_BYTES, True)
            if not pdf.content.startswith(b"%PDF"):
                raise RuntimeError("response does not look like a PDF")
            digest = sha256_bytes(pdf.content)
            pdf_hashes[pdf_url] = digest
            record(f"article_pdf_{idx}", pdf_url, True)
            if pdf_url in KNOWN_BASELINE_PDF_URLS:
                if compare_local_asset(root, state, pdf_url, digest, "research/anthropic-report.pdf", at):
                    new_candidates += 1
        except Exception as exc:  # noqa: BLE001
            record(f"article_pdf_{idx}", pdf_url, False, str(exc))
    if pdf_hashes:
        snapshot["sources"]["pdfs"] = {url: {"sha256": digest} for url, digest in sorted(pdf_hashes.items())}

    discovery_relevant: set[str] = set()
    for discovery_url in DISCOVERY_URLS:
        try:
            page = fetcher(discovery_url, MAX_TEXT_BYTES, False)
            _text, links, _assets = normalize_html(page.content, page.url)
            discovery_relevant.update(u for u in links if is_relevant_url(u))
            discovery_relevant.add(discovery_url)
            record("discovery", discovery_url, True)
        except Exception as exc:  # noqa: BLE001
            record("discovery", discovery_url, False, str(exc))
    discovery_urls = sorted(discovery_relevant)
    discovery_hash = sha256_text(json.dumps(discovery_urls, sort_keys=True))
    snapshot["sources"]["discovery"] = {"urls": discovery_urls, "sha256": discovery_hash}

    ok_all = all(c["ok"] for c in checks)
    previous_baseline = state.get("baseline")
    current_baseline = {
        "article": snapshot["sources"].get("article"),
        "figure": snapshot["sources"].get("figure"),
        "pdfs": snapshot["sources"].get("pdfs", {}),
        "discovery": snapshot["sources"].get("discovery"),
    }

    if ok_all and not previous_baseline:
        state["baseline"] = current_baseline
        state["baselineEstablishedAt"] = at
        state["history"] = append_history(state["history"], {"at": at, "type": "baseline", "count": 0})
        status = "baseline"
    elif not ok_all:
        state["history"] = append_history(state["history"], {"at": at, "type": "check_failed"})
        status = "check_failed"
    else:
        changes: list[tuple[str, str, str | None, str]] = []
        baseline_sources = previous_baseline or {}
        for key in ("article", "figure", "discovery"):
            old = (baseline_sources.get(key) or {}).get("sha256")
            new = (current_baseline.get(key) or {}).get("sha256")
            url = article_url if key == "article" else figure_url if key == "figure" else "anthropic-discovery"
            if old and new and old != new:
                changes.append((key, url, old, new))
        old_pdfs = baseline_sources.get("pdfs", {}) or {}
        new_pdfs = current_baseline.get("pdfs", {}) or {}
        for url in sorted(set(old_pdfs) | set(new_pdfs)):
            old = (old_pdfs.get(url) or {}).get("sha256")
            new = (new_pdfs.get(url) or {}).get("sha256")
            if old != new:
                changes.append(("pdf", url, old, new or "missing"))
        for kind, url, old_hash, new_hash in changes:
            if add_candidate(state, "source_change", url, old_hash, new_hash, f"{kind} changed versus stored baseline; review before publishing.", at):
                new_candidates += 1
            else:
                update_candidate_last_seen(state, "source_change", url, new_hash, at)
        if new_candidates:
            state["history"] = append_history(state["history"], {"at": at, "type": "source_change", "count": len(changes)})
        status = "pending_review" if state.get("pendingCandidates") else "unchanged"

    if ok_all:
        state["lastSuccessfulCheckAt"] = at
    state["lastCheckedAt"] = at
    state["lastSourceChecks"] = public_source_checks(checks)

    write_snapshot(root, at, snapshot)
    atomic_write_json(state_path, state)

    if status != "check_failed" and state.get("pendingCandidates"):
        status = "pending_review"

    public = {
        "schemaVersion": SCHEMA_VERSION,
        "lastCheckedAt": at,
        "lastSuccessfulCheckAt": state.get("lastSuccessfulCheckAt"),
        "status": status,
        "pendingCount": len(state.get("pendingCandidates", [])),
        "sourceChecks": public_source_checks(checks),
        "history": state.get("history", [])[-MAX_HISTORY:],
        "dataVersion": data_version(data_path),
        "schedule": PUBLIC_SCHEDULE,
    }
    atomic_write_json(public_path, public)

    stdout = {
        "status": status,
        "newCandidates": new_candidates,
        "pendingCount": len(state.get("pendingCandidates", [])),
        "errors": errors,
        "lastCheckedAt": at,
    }
    return stdout


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    default_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Check upstream source changes without publishing data updates.")
    parser.add_argument("--root", type=Path, default=default_root, help="Project root (defaults to parent of scripts/).")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    result = run_check(args.root)
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0 if result["status"] != "check_failed" else 2


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
