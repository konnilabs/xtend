# SurfaceManager Quality Gates

Contract: `xtend.surface.quality-gates.v1`

Die SurfaceManager Quality Gates halten den gemischten Surface Stack in vier lokalen Qualitaetsdomaenen pruefbar.

## Domains

- Browser
- A11y
- Performance
- Visual

## Evidence

Browser-Smoke:

```text
tests/browser/fixtures/surface-manager-quality-smoke.html
```

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js surface-manager-quality --json
```

