# Component UX Gates

- Status: `stable-reference-bridge`
- Docs Contract: `xtend.docs.component-ux-gates.v1`
- Authoring Contract: `xtend.epic11.component-ux-authoring-docs.v1`
- Related Gate: `component-long-tail-migration`

## Purpose

This file is the stable developer-docs bridge for the Component UX gate family. It keeps the legacy suite paths resolvable while the public docs surface continues to move toward localized pages.

## Gate Map

| Gate | Command | Purpose |
|------|---------|---------|
| `component-ux-authoring-docs` | `node scripts/run_xtend_tests.js component-ux-authoring-docs --json` | Validates Component UX authoring docs, app authoring docs and gate references. |
| `component-long-tail-migration` | `node scripts/run_xtend_tests.js component-long-tail-migration --json` | Validates the remaining component long-tail migration plan and docs anchors. |
| `component-ux-browser-smokes` | `node scripts/run_xtend_tests.js component-ux-browser-smokes --json` | Validates browser-near component UX smoke coverage. |
| `component-shell-theme-matrix` | `node scripts/run_xtend_tests.js component-shell-theme-matrix --json` | Validates shell and theme coverage for hardened components. |

## Local Verification

```bash
node scripts/run_xtend_tests.js component-ux-authoring-docs component-long-tail-migration references --json
```

