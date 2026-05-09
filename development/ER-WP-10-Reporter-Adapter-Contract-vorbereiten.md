# ER-WP-10 - Reporter Adapter Contract vorbereiten

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.enterprise.er-wp-10.reporter-adapter-contract.v1`
- Reporter Contract: `xtend.fabric.reporter.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Betroffene Artefakte:
  - `fabric/xtend-fabric.js`
  - `tests/fabric/fabric_reporter_adapter_suite.js`
  - `tests/fabric/README.md`
  - `docs/xtend-fabric.md`
  - `scripts/run_xtend_tests.js`
  - `package.json`
  - `development/XTend-Fabric-Reporter-Adapter-Contract.md`

## Ziel

Enterprise-QS- und Error-Reporting-Anschluesse sollen vorbereitet werden, ohne XTend an einen Vendor, ein Backend oder eine implizite Telemetry-Pipeline zu binden.

## Umsetzung

- `createReporterAdapter(options)` als generische Adapterflaeche fuer Custom- und Enterprise-Reporter eingefuehrt.
- `createConsoleReporter(options)` fuer lokale, opt-in Console-Diagnostics eingefuehrt.
- `createTestReporter(options)` fuer Memory-basierte Gates und Test-Reporter eingefuehrt.
- `createNoopReporter()` bleibt Default und sendet nichts extern.
- `createXtendFabric()` stellt Reporter-Factories auch auf Instanzebene bereit.
- `normalizeReporter` bewahrt `delivery`, `external` und `capabilities`.
- Reporter-Severity-Filter ueber `debug`, `info`, `warn`, `error`, `fatal` eingefuehrt.
- Adapter-`mapEvent` wird nach dem Mapping erneut redigiert.
- Reporter-Fehler erzeugen lokale `xtend.fabric.reporter.failed` Diagnostics.

## Akzeptanzcheck

| Kriterium | Status |
|-----------|--------|
| Reporter sind opt-in | erfuellt: nur `registerReporter` aktiviert Ausgabe |
| Default sendet nichts extern | erfuellt: `noop` bleibt einziger Default |
| Console Reporter existiert | erfuellt |
| Test Reporter existiert | erfuellt |
| Enterprise Reporter ist vorbereitbar | erfuellt ueber `createReporterAdapter({ external: true })` |
| Reporter erhalten redigierte Diagnostics | erfuellt |
| Reporter-Fehler brechen Runtime nicht | erfuellt ueber `xtend.fabric.reporter.failed` |

## Validierung

| Gate | Ergebnis |
|------|----------|
| `node --check fabric/xtend-fabric.js` | passed |
| `node --check tests/fabric/fabric_reporter_adapter_suite.js` | passed |
| `node --check tests/references/reference_path_suite.js` | passed |
| `node --check scripts/run_xtend_tests.js` | passed |
| `node scripts/run_xtend_tests.js fabric-reporters --json` | passed, 32 Assertions |
| `node scripts/run_xtend_tests.js references --json` | passed, 3398 Assertions |
| `node scripts/run_xtend_tests.js fabric fabric-lifecycle-boundary fabric-reporters fabric-lane-mapping --json` | passed, 4 Suites |
| `npm test` | passed nach Sandbox-Escalation fuer den lokalen Browser-Smoke |

## Handoff

| Folgepaket | Status | Uebergabe |
|------------|--------|-----------|
| `ER-WP-11` | completed | Fabric ist an `xstate`, API und XTendRMT Diagnostics angebunden |
| `ER-WP-16` | completed | fuehrt Runtime-Diagnostics, Component-Fibers und Route-Fibers als Telemetry Snapshot zusammen |
| `ER-WP-30` | completed | externe Reporter bleiben fuer Security-/Supply-Chain-Gates sichtbar |

`ER-WP-10` ist abgeschlossen.
