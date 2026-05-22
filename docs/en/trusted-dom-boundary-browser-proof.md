# Trusted DOM Boundary Browser Proof

- Contract: `xtend.epic13.trusted-dom-boundary.v1`
- Fixture: `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html`
- Gate: `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json`

## Goal

This RC1 gate proves that Parsedown HTML and RMT `htmlFragment` do not flow unchecked into the Docs app DOM sinks. The app still renders shell-first through RMT, but the host adapter sanitizes content before writing it into the content slot.

## Rules

- `parsedownHtml` requires `xtend.security.trusted-dom-sanitizer.v1`.
- RMT `htmlFragment` requires `xtend.security.sanitizing-boundary.v1`.
- RMT `dom_descriptor` remains the preferred path for structured templates.
- The RMT kernel imports no sanitizer, no PHP/Parsedown and no XTend types.

Blocked content includes `script`, `iframe`, inline event handlers, `javascript:` URLs and `srcdoc`.

## Browser-Close Smoke

The fixture intentionally places hostile content in `window.xtendDocsPages` and then loads `docs/utils/pageloader.js`. The smoke verifies that:

- the content slot carries `data-rmt-sanitized="true"`
- `data-rmt-trusted-dom-proof="xtend.epic13.trusted-dom-boundary.v1"` is set
- script elements, event handlers, JavaScript URLs and `srcdoc` are removed
- safe Parsedown text remains intact
- the shell continues to render shell-first

## Handoff

`WP-E13-11` is complete. `WP-E13-12` is complete with [RC1 Migration Notes](./rc1-migration-notes.md) and `xtend.epic13.rc1-migration-notes-semver.v1`. `WP-E13-13` is complete with [RC1 Gate Matrix and CI Handoff](./rc1-gate-matrix-ci-handoff.md) and `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`.
