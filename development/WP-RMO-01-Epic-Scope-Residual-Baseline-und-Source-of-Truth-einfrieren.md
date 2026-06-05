# WP-RMO-01 - Epic-Scope, Residual-Baseline und Source-of-Truth einfrieren

- Status: `completed`
- Datum: 3. Juni 2026
- Backlog: `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`
- Contract: `xtend.rmt-ui-maximality-owned-component-surface-hardening.source-of-truth.v1`
- Matrix: `xtend.rmt-ui-maximality-owned-component-surface-hardening.residual-matrix.v1`
- Fixture Pack: `xtend.rmt-ui-maximality-owned-component-surface-hardening.residual-fixtures.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-component-surface-hardening.baseline-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-ui-maximality-owned-surface-baseline --json`
- Package Script: `npm run test:rmt-ui-maximality-owned-surface-baseline`

## Ziel

Die von `NFM-WP-22` entschiedene Epic-Grenze `rmt-ui-maximality-and-owned-component-surface-hardening` ist in eine startbare Source-of-Truth ueberfuehrt. Alle Residuals besitzen Ziel-WP, Owner, Claim Boundary, Required Gates und naechsten Handoff.

## Umgesetzte Artefakte

- `development/XTend-RMT-UI-Maximality-Owned-Component-Surface-Hardening-Source-of-Truth-Contract.md`
- `development/XTend-RMT-UI-Maximality-Owned-Component-Surface-Hardening-Residual-Matrix.md`
- `development/WP-RMO-01-Epic-Scope-Residual-Baseline-und-Source-of-Truth-einfrieren.md`
- `tests/fixtures/native-first/rmt-ui-maximality-owned-surface-residual-fixtures.json`
- `tests/native-first/rmt_ui_maximality_owned_surface_baseline_suite.js`

## Entscheidungen

| Thema | Entscheidung |
|-------|--------------|
| `WP-RMO-02` | bleibt `ready` und schliesst Gate-Hygiene vor neuen Produktclaims |
| `WP-RMO-03` | fachlich `implementation-ready` fuer Data Display, Backlog-Status bleibt `next` bis `WP-RMO-02` |
| `WP-RMO-04` | fachlich `implementation-ready` fuer Command/Search, Backlog-Status bleibt `next` bis `WP-RMO-02` |
| DataGrid-Parity | blockiert bis owned Data Display Package und Evidence |
| Command-Palette-Parity | blockiert bis owned Command/Search Package und Action/Policy-Gates |
| Browser-/Visual-Claims | blockiert bis echte Browser-Lab- oder Visual-Evidence-Artefakte existieren |
| Runtime Dependency | blockiert ohne Adoption Gate, Exit-Plan und Supply-Chain-Evidence |

## Source Gates

```bash
node scripts/run_xtend_tests.js rmt-ui-maximality-owned-surface-baseline --json
node scripts/run_xtend_tests.js native-first-mission-handoff --json
node scripts/run_xtend_tests.js references --json
```

## Akzeptanz

| Kriterium | Entscheidung |
|-----------|--------------|
| alle `NFM-WP-22` Residuals besitzen Ziel-WP, Owner, Gate und Claim Boundary | erfuellt |
| Source-of-Truth-Contract ist vorhanden | erfuellt |
| Residual-Matrix ist vorhanden | erfuellt |
| Fixture Pack ist maschinenlesbar | erfuellt |
| Runner und Package expose `rmt-ui-maximality-owned-surface-baseline` | erfuellt |
| keine neue Runtime-Dependency | erfuellt |

## Handoff

- `WP-RMO-02` kann direkt mit Docs-, TypeExports- und Component-Long-Tail-Gate-Hygiene starten.
- `WP-RMO-03` und `WP-RMO-04` sind fachlich vorbereitet und koennen nach `WP-RMO-02` implementiert werden.
- `WP-RMO-06` und `WP-RMO-08` bleiben geplante Folgepakete fuer Browser-/Visual-Evidence und Migration/Docs-Handoff.
