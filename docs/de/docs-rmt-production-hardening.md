# Docs RMT Production Hardening

`WP-E13-10` hebt den bisherigen Docs-App Parsedown/RMT-Pilot auf einen PROD-naeheren RC1-Schnitt.

- Contract: `xtend.epic13.docs-rmt-production-hardening.v1`
- RMT-Dokument: `docs/xtendrmt-parsedown-docs.rmt`
- Host: `docs/index.php`
- Page Loader: `docs/utils/pageloader.js`
- Gate: `node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json`
- Trusted DOM Proof: `xtend.epic13.trusted-dom-boundary.v1`

## Zweck

Die Docs-App bleibt eine XTend-App mit PHP/Parsedown als Parser-Host. RMT rendert Shell-first die App Shell, markiert stabile Slots und scheduled Erweiterungen. Parsedown, PHP-Ausfuehrung und Sanitizing bleiben ausserhalb des RMT-Kernels.

## Extension Slots

| Slot | Content Kind | Schedule | Boundary |
|------|--------------|----------|----------|
| `docs.slot.content` | `parsedownHtml` | `docs.markdown.parse` | `xtend.security.sanitizing-boundary.v1` |
| `docs.slot.rich-content` | `richHtml` | `docs.rich-content.prepare` | `xtend.security.sanitizing-boundary.v1` |
| `docs.slot.media` | `xplayerTutorial` | `docs.media.lazy` | component-managed |
| `docs.slot.diagnostics` | `diagnostics` | `docs.diagnostics.snapshot` | structured-diagnostics |

## Runtime Metadata

`docs/index.php` stellt `window.xtendDocsRmtProductionHardening` bereit. `docs/utils/pageloader.js` spiegelt pro Route `window.xtendDocsRmtProductionLastRender` mit Shell-first-Status, Extension-Slots, Schedules, Diagnostics-Slot und Kernel-Boundary.

## Handoff

`WP-E13-10` ist abgeschlossen. `WP-E13-11` hat Trusted DOM, Parsedown und RMT HTML Boundary browsernah unter [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md) geprueft. `WP-E13-12` hat [RC1 Migration Notes](./rc1-migration-notes.md) und `xtend.epic13.rc1-migration-notes-semver.v1` abgeschlossen. `WP-E13-13` hat [RC1 Gate Matrix und CI-Handoff](./rc1-gate-matrix-ci-handoff.md) und `xtend.epic13.rc1-gate-matrix-ci-handoff.v1` abgeschlossen.
