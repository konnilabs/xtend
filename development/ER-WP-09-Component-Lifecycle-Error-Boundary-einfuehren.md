# ER-WP-09 - Component Lifecycle Error Boundary einfuehren

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.enterprise.er-wp-09.lifecycle-error-boundary.v1`
- Runtime Contract: `xtend.fabric.lifecycle-error-boundary.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Betroffene Artefakte:
  - `fabric/xtend-fabric.js`
  - `tests/fabric/fabric_lifecycle_boundary_suite.js`
  - `tests/fabric/fixtures/broken-lifecycle.component.js`
  - `tests/fabric/README.md`
  - `docs/xtend-fabric.md`
  - `scripts/run_xtend_tests.js`
  - `package.json`
  - `development/XTend-Component-Lifecycle-Error-Boundary.md`

## Ziel

Component-Lifecycle-Fehler duerfen nicht mehr unstrukturiert verloren gehen. Fabric muss sie als klar korrelierbare Diagnostics mit Component, Phase, Fiber, Lane, Severity und Cause erfassen.

## Umsetzung

- `CONTRACTS.lifecycleBoundary` mit `xtend.fabric.lifecycle-error-boundary.v1` eingefuehrt.
- `createComponentLifecycleBoundary(componentRef, options)` in `fabric/xtend-fabric.js` umgesetzt.
- `wrapComponent` nutzt nun die Lifecycle-Boundary fuer `connectedCallback`, `attributeChangedCallback`, `render`, `hydrate`, `disconnectedCallback` und optionale `eventHandlers`.
- `wrapEventHandler` deckt Event-Handler-Fehler als `event.handler` Fiber auf `user-blocking` ab.
- `normalizeDiagnostic` fuehrt `severity` und `component` als explizite Felder ein, behält `level` und `componentRef` kompatibel bei.
- `runFiber` kann paketierte Diagnostic Codes und Severity aus dem Fiber-Kontext uebernehmen.
- `tests/fabric/fixtures/broken-lifecycle.component.js` bildet die absichtlich defekte Component-Fixture.
- `tests/fabric/fabric_lifecycle_boundary_suite.js` prueft Sync-, Async-, Disconnect- und Event-Handler-Fehler.
- `scripts/run_xtend_tests.js` und `package.json` enthalten den neuen Gate `fabric-lifecycle-boundary` beziehungsweise `npm run test:fabric-lifecycle`.

## Akzeptanzcheck

| Kriterium | Status |
|-----------|--------|
| Fehler enthalten Component | erfuellt ueber `component` und `componentRef` |
| Fehler enthalten Phase | erfuellt ueber `phase` |
| Fehler enthalten Fiber | erfuellt ueber `fiberId` und failed Fiber Store |
| Fehler enthalten Lane | erfuellt ueber Phase-zu-Fiber-Mapping |
| Fehler enthalten Severity | erfuellt ueber `severity` und kompatibles `level` |
| Fehler enthalten Cause | erfuellt ueber normalisierte `cause` |
| Defekte Lifecycle-Fixture vorhanden | erfuellt |

## Handoff

| Folgepaket | Status | Uebergabe |
|------------|--------|-----------|
| `ER-WP-10` | completed | Reporter Adapter Contract kann Lifecycle-Diagnostics konsumieren |
| `ER-WP-14` | completed | Component Mount/Hydration Fibers nutzen Lifecycle-Mapping |
| `ER-WP-11` | completed | bindet Lifecycle-Diagnostics ueber Reporter Adapter, xstate/API und XTendRMT Diagnostics an |

## Validierung

| Gate | Ergebnis |
|------|----------|
| `node --check fabric/xtend-fabric.js` | passed |
| `node --check tests/fabric/fabric_lifecycle_boundary_suite.js` | passed |
| `node --check tests/references/reference_path_suite.js` | passed |
| `node scripts/run_xtend_tests.js fabric-lifecycle-boundary --json` | passed |
| `node scripts/run_xtend_tests.js references --json` | passed |
| `node scripts/run_xtend_tests.js fabric fabric-lifecycle-boundary fabric-lane-mapping --json` | passed |
| `npm test` | passed nach Sandbox-Escalation fuer Browser-Smoke |

`ER-WP-09` ist abgeschlossen.
