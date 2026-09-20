# Labor Market Observatory / AI 职业影响观察站

Bilingual interactive visualization of theoretical and observed AI task coverage across 22 US occupational categories, inspired by Anthropic Figure 2. Independent Gray Mammoth project, not an Anthropic product.

- Public: https://market-impact.graymammoth.com/
- Directory: `/home/Labor-Market-Impacts`
- Homepage card: https://www.graymammoth.com/
- Stack: static HTML, CSS, vanilla JavaScript and SVG; no runtime API keys or CDN dependencies.

## Local preview

```sh
cd /home/Labor-Market-Impacts
python3 -m http.server 8097 --bind 127.0.0.1
```

Open http://127.0.0.1:8097. Serving HTTP is required because the app fetches `data.json`.

## Data and limitations

Source: [Anthropic, Labor market impacts of AI: A new measure and early evidence](https://www.anthropic.com/research/labor-market-impacts), published March 5, 2026.

- Theoretical and observed coverage measure tasks, NOT percentages of people who will lose jobs.
- US occupational categories, not global/Chinese industry employment predictions.
- Observed coverage reflects the paper's Claude usage sample, not the entire AI market.
- Most values are approximate readings of Figure 2, rounded to integers. This is not an official machine-readable exact dataset. Small near-zero values are particularly uncertain.
- The paper explicitly gives Computer & math theoretical 94% / observed 33% and Office & admin theoretical 90%; those values override approximate plotted readings. The computer category visibly differs slightly between figure and prose; the application prioritizes the prose and discloses this.
- Category descriptions are editorial context, not direct findings quoted from the research.
- Each published version is a research snapshot, not a real-time forecast. Compatible source revisions can be published automatically after validation.

Data lives in `data.json`. `scripts/build_data.py` (stdlib only) rebuilds the **original March 2026 snapshot**, not newer source data. Do not run it on a deployment with automatic updates: it would overwrite newer versions. `research/figure-2.png` and `research/anthropic-report.pdf` are source reference materials; original rights remain with their owners.

## Deployment

Nginx serves this directory via `/etc/nginx/sites-available/market-impact`, linked from `sites-enabled`. Template in `deploy/nginx.conf`. Cloudflare Tunnel `cda48668-c535-4d31-be1f-d4b66c3e98bb` maps `market-impact.graymammoth.com` to `http://127.0.0.1` in `/etc/cloudflared/config.yml`. Existing routes were preserved. DNS is a proxied tunnel CNAME. HTTPS terminates at Cloudflare.

Deploy directory and scripts/tests/artifacts/dotfiles are not publicly served. Before/after tunnel configuration and homepage backup are retained under `deploy/`. Never commit credentials. Repository: https://github.com/hydavinci/labor-market-impacts. Runtime status, private monitor state, deployment backups and test screenshots are excluded from Git.

Updating static assets needs no service restart. Nginx location uses revalidation. For configuration changes, inspect the current state first, preserve unrelated sites and tunnel rules, run `sudo nginx -t` and `cloudflared --config /etc/cloudflared/config.yml tunnel ingress validate` before applying/reloading.

## Rollback

Remove only the market-impact ingress entry from current tunnel config, validate, and restart cloudflared. Remove the market-impact Nginx symlink, validate Nginx, and reload. Remove only the new card from the current GrayMammoth homepage, preserving other changes. Backups are reference copies, not instructions to overwrite later edits. Remove the new DNS record through Cloudflare if decommissioning.

## Features and verification

- Persisted Chinese/English switch; responsive SVG radar with selectable axes and keyboard navigation.
- Occupational selector, searchable rankings, three sorting modes, series toggles, and CSV download with provenance.
- Reported versus approximate metrics are marked individually; gaps use percentage points. Summary means are unweighted across categories, not employment-weighted estimates.
- User-facing failure state for unavailable/invalid data; reduced-motion support.

```sh
python3 tests/data.test.py
node --check app.js
node tests/smoke.cjs
node tests/interactions.cjs
```

Browser tests require Playwright (`npm install --no-save playwright && npx playwright install chromium`). To reuse an existing installation, set `PLAYWRIGHT_MODULE` to its module path and `CHROMIUM_EXECUTABLE` to the browser executable. Set `TEST_URL` for a local preview; tests otherwise target the public site. Screenshots and smoke report are saved under `artifacts/`. Acceptance passed at 1440px, 390px and 320px, with no JavaScript errors or horizontal overflow; language persistence, selection, search, sorting, series controls, export, fetch errors and homepage links were verified against the public deployment. Internal paths return HTTP 403.

## Project-owned automatic updates

The project checks sources and publishes compatible, validated changes **without
OpenClaw, an AI API, notifications, or human approval**. The server-side updater
is separate from the static frontend; opening the website does not run a check.

- Schedule: **Mondays 09:00 Asia/Shanghai**, using the project's systemd timer.
- Entry point: `python3 scripts/project_update.py`.
- Dependencies: Python 3, curl, Pillow (installed on this server). On a new Ubuntu server use distribution packages `python3-pil` and `curl`, or install `Pillow>=10,<12` into your own virtual environment and adjust the service interpreter.
- `deploy/systemd/labor-market-update.service` and `.timer` are the deployment
  templates. The service runs as `OpenClaw` (the existing Linux account name only;
  this is not a dependency on the OpenClaw application).
- The old OpenClaw schedule is disabled after the new timer is verified.
- New sources are untrusted data. Automatic extraction is restricted to compatible
  revisions of the supported Anthropic Figure 2 format: the same 4096px PNG, unchanged labels/order/legend/radial scale and the pinned methodology paragraphs in `research/extraction-contract.json` (reported percentages may change). `scripts/figure_adapter.py` digitizes the blue/red marker edges; reported prose values override approximate pixels (~2pp reading uncertainty). No numerical changes are made on an unchanged source merely to adjust rounding. A webpage change or a new
  research link alone is **not** enough to replace chart values. This is not an
  unrestricted research-discovery or arbitrary-paper interpretation system.
- Unsupported formats, incompatible methodology, extraction/validation errors and
  network failures leave the previous chart intact. They are shown on the page and
  retried on subsequent runs, **not queued for human approval**.
- Successful publications archive the previous data privately and replace the
  public data atomically. `update-status.json` contains the current research
  date/hash, last check and automatic publication history. Research dates and check
  times are kept distinct. No notification recipient is configured or required.
- `.monitor/` contains private updater state, source hash snapshots and version
  archives and accepted source PNG/HTML evidence; Nginx blocks it. It must be included in server backups, not published.
- `scripts/check_sources.py` remains an internal read-only source-diff component.
  Do not schedule it separately: use `project_update.py` for the complete workflow.

### Operations

```sh
# Inspect before installing; do not overwrite unrelated units.
sudo systemctl cat labor-market-update.service labor-market-update.timer
# After reviewing templates:
sudo install -m 644 deploy/systemd/labor-market-update.service /etc/systemd/system/
sudo install -m 644 deploy/systemd/labor-market-update.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now labor-market-update.timer
# Check now (runs the same non-AI updater)
sudo systemctl start labor-market-update.service
systemctl status labor-market-update.timer labor-market-update.service
journalctl -u labor-market-update.service -n 30 --no-pager
```

`Persistent=true` catches a missed check after server downtime. The update runner
uses a lock to avoid overlapping publication. To pause automatic updates, stop the
timer; the static website continues to work. For rollback, stop the timer and
restore the required archived JSON atomically with mode 0644, then verify its
provenance. Do not regenerate the original snapshot as an implicit rollback.

### Tests

```sh
python3 -m unittest discover -s tests -p 'test_check_sources.py' -v
python3 -m unittest discover -s tests -p 'test_auto_update.py' -v
python3 tests/data.test.py
node tests/updates.cjs
node tests/compact-style.cjs
```
