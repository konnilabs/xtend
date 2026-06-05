# SurfaceManager Quality Gates

Contract: `xtend.surface.quality-gates.v1`

SurfaceManager Quality Gates keep the mixed Surface Stack verifiable across four local quality domains.

## Domains

- Browser
- A11y
- Performance
- Visual

## Evidence

Browser smoke:

```text
tests/browser/fixtures/surface-manager-quality-smoke.html
```

Local gate:

```bash
node scripts/run_xtend_tests.js surface-manager-quality --json
```

