# XTend Epic 13 Docs RMT Production Hardening Contract

- Schema: `xtend.epic13.docs-rmt-production-hardening.v1`
- Report: `xtend.epic13.docs-rmt-production-hardening-report.v1`
- Workpackage: `WP-E13-10`
- Status: `accepted-docs-rmt-production-hardening`
- Ziel: `docs-rmt-parsedown-shell-prod-hardened`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json`

## Ziel

`WP-E13-10` haertet die offizielle Docs-App als echte Shell-first RMT-App, ohne Parsedown oder PHP in den RMT-Kernel zu ziehen.

Parsedown bleibt orchestrierte Komponente im Docs-Host. RMT beschreibt Shell, Slots, Schedules und Diagnostics. Rich HTML und XPlayer-Tutorials bleiben spaeter ueber RMT schedulbar, ohne eine zweite SPA-Schicht neben dem Host-Adapter aufzubauen.

## Boundary

- Parsedown bleibt `docs.parsedown`
- PHP bleibt `docs/index.php`
- HTML aus Parsedown bleibt `parsedownHtml`
- Trusted DOM bleibt `xtend.security.sanitizing-boundary.v1`
- RMT-Kernel importiert keine Parsedown-, PHP- oder XTend-Typen
- RMT sieht Shell Records, Templates, Schedules, Extension Slots und Diagnostics

## Pflicht-Slots

| Slot | Pflicht | Schedule | Endpoint |
|------|---------|----------|----------|
| `docs.slot.content` | ja | `docs.markdown.parse` | `xtendrmt.docs.parsedown.parse` |
| `docs.slot.rich-content` | nein | `docs.rich-content.prepare` | `xtendrmt.docs.rich-content.prepare` |
| `docs.slot.media` | nein | `docs.media.lazy` | `xtendrmt.docs.media.lazy` |
| `docs.slot.diagnostics` | ja | `docs.diagnostics.snapshot` | `xtendrmt.diagnostics.snapshot` |

## Gates

- `npm run test:docs-rmt-pilot`
- `npm run test:browser`
- `npm run test:epic13-rmt-production-readiness`
- `node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json`

## Handoff

`WP-E13-10` ist abgeschlossen. `WP-E13-11` hat `xtend.epic13.trusted-dom-boundary.v1` mit `trusted-dom-parsedown-rmt-html-boundary-browser-proof` abgeschlossen. `WP-E13-12` hat `xtend.epic13.rc1-migration-notes-semver.v1` abgeschlossen. `WP-E13-13` wird mit `rc1-gate-matrix-ci-handoff` fortgesetzt.
