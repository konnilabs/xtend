# ER-WP-14 - Component Mount/Hydration als Fibers instrumentieren

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.enterprise.er-wp-14.component-fiber-instrumentation.v1`
- Runtime Contract: `xtend.fabric.component-fiber-instrumentation.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Betroffene Artefakte:
  - `fabric/xtend-fabric.js`
  - `tests/fabric/fabric_component_fiber_suite.js`
  - `tests/fabric/README.md`
  - `docs/xtend-fabric.md`
  - `scripts/run_xtend_tests.js`
  - `package.json`
  - `development/XTend-Component-Fiber-Instrumentierung.md`

## Ziel

Component Mount, Adapter-Hydration und Loader-Preload sollen als lokale XTend-Fabric Fibers messbar, korrelierbar und spaeter schedulable werden.

## Umsetzung

- `createComponentFiberInstrumentation(componentRef, options)` in `fabric/xtend-fabric.js` eingefuehrt.
- Operation Profiles fuer `mount`, `hydrate` und `preload` eingefuehrt.
- Mount-Fibers laufen als `component.mount` auf Lane `visible` mit `scheduleRef = component.visible.mount`.
- Hydration-Fibers laufen als `component.hydrate` standardmaessig auf Lane `idle` mit `scheduleRef = component.idle.hydrate`.
- Sichtbare Hydration bleibt durch Metadata-Override auf `component.visible.hydrate` moeglich.
- Preload-Fibers laufen als `loader.module` mit Component-Korrelation.
- Fiber-Metadata wird redigiert, sodass Tokens und DOM Nodes nicht im Fiber Store landen.
- Fehler erzeugen operationsspezifische Diagnostics:
  - `xtend.fabric.component.mount.failed`
  - `xtend.fabric.component.hydrate.failed`
  - `xtend.fabric.component.preload.failed`
- `swallowErrors: true` bleibt explizit opt-in und veraendert die Default-Fehlersemantik nicht.

## Akzeptanzcheck

| Kriterium | Status |
|-----------|--------|
| Component-Fibers enthalten Dauer | erfuellt ueber `durationMs` |
| Component-Fibers enthalten Ergebnis | erfuellt ueber `result` |
| Component-Fibers enthalten Lane | erfuellt ueber `lane` |
| Component-Fibers enthalten Diagnostics | erfuellt ueber `diagnostics` Array und Fehlerdiagnostics |
| Mount ist schedulable | erfuellt ueber `component.visible.mount` und `xtendrmt.component.mount` |
| Hydration ist schedulable | erfuellt ueber `component.idle.hydrate` und `xtendrmt.component.hydrate` |
| RMT bleibt framework-agnostisch | erfuellt: kein RMT-Kernel-Import in Fabric |
| Reporter koennen Fehler konsumieren | erfuellt ueber opt-in Reporter und redigierte Diagnostics |

## Validierung

| Gate | Ergebnis |
|------|----------|
| `node --check fabric/xtend-fabric.js` | passed |
| `node --check tests/fabric/fabric_component_fiber_suite.js` | passed |
| `node --check scripts/run_xtend_tests.js` | passed |
| `node scripts/run_xtend_tests.js fabric-component-fibers --json` | passed, 59 Assertions |
| `node scripts/run_xtend_tests.js references --json` | passed, 3456 Assertions |
| `node scripts/run_xtend_tests.js fabric fabric-lifecycle-boundary fabric-reporters fabric-component-fibers fabric-lane-mapping --json` | passed, 5 Suites |
| `npm test` | passed nach Sandbox-Escalation fuer den lokalen Browser-Smoke |

## Handoff

| Folgepaket | Status | Uebergabe |
|------------|--------|-----------|
| `ER-WP-15` | completed | Route Render und XRouter Navigation koennen Component-Fiber-Korrelation nutzen |
| `ER-WP-16` | completed | fuehrt Component-Fibers, Runtime Diagnostics und Snapshot-/Backpressure-Arbeit zusammen |
| `ER-WP-18` | completed | Loader-/Hydration-Messpunkte nutzen Component-Fiber-Daten |
| `ER-WP-24` | completed | browsernahe Fokus-/Keyboard-Smokes pruefen Routing, Overlay, Form/Input und Tabs |

`ER-WP-14` ist abgeschlossen.
