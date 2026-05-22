# Docs RMT Production Hardening

`WP-E13-10` raises the existing Docs app Parsedown/RMT pilot to an RC1 shape that is closer to production.

- Contract: `xtend.epic13.docs-rmt-production-hardening.v1`
- RMT document: `docs/xtendrmt-parsedown-docs.rmt`
- Host: `docs/index.php`
- Page loader: `docs/utils/pageloader.js`
- Gate: `node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json`
- Trusted DOM proof: `xtend.epic13.trusted-dom-boundary.v1`

## Purpose

The Docs app remains an XTend app with PHP/Parsedown as parser host. RMT renders the app shell shell-first, marks stable slots and schedules extensions. Parsedown, PHP execution and sanitizing remain outside the RMT kernel.

## Extension Slots

| Slot | Content kind | Schedule | Boundary |
|------|--------------|----------|----------|
| `docs.slot.content` | `parsedownHtml` | `docs.markdown.parse` | `xtend.security.sanitizing-boundary.v1` |
| `docs.slot.rich-content` | `richHtml` | `docs.rich-content.prepare` | `xtend.security.sanitizing-boundary.v1` |
| `docs.slot.media` | `xplayerTutorial` | `docs.media.lazy` | component-managed |
| `docs.slot.diagnostics` | `diagnostics` | `docs.diagnostics.snapshot` | structured-diagnostics |

## Runtime Metadata

`docs/index.php` exposes `window.xtendDocsRmtProductionHardening`. `docs/utils/pageloader.js` mirrors `window.xtendDocsRmtProductionLastRender` per route with shell-first status, extension slots, schedules, diagnostics slot and kernel boundary.

## Handoff

`WP-E13-10` is complete. `WP-E13-11` verified Trusted DOM, Parsedown and RMT HTML boundary close to the browser in [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md). `WP-E13-12` completed [RC1 Migration Notes](./rc1-migration-notes.md) and `xtend.epic13.rc1-migration-notes-semver.v1`. `WP-E13-13` completed [RC1 Gate Matrix and CI Handoff](./rc1-gate-matrix-ci-handoff.md) and `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`.
