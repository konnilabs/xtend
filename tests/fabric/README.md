# XTend-Fabric Tests

Diese Suite prueft den produktiven Fabric-Runtime-Kern ab `ER-WP-08`, die Component Lifecycle Error Boundary ab `ER-WP-09`, den Reporter Adapter Contract ab `ER-WP-10`, die Runtime Diagnostics Bridge ab `ER-WP-11`, die Component Mount/Hydration Fiber Instrumentierung ab `ER-WP-14`, die Route Navigation/Render Fiber Instrumentierung ab `ER-WP-15`, Telemetry Snapshots mit Backpressure ab `ER-WP-16` und Loader-/Hydration-Performance-Messpunkte ab `ER-WP-18`.

```bash
node scripts/run_xtend_tests.js fabric
node scripts/run_xtend_tests.js fabric-lifecycle-boundary
node scripts/run_xtend_tests.js fabric-reporters
node scripts/run_xtend_tests.js fabric-runtime-bridge
node scripts/run_xtend_tests.js fabric-component-fibers
node scripts/run_xtend_tests.js fabric-route-fibers
node scripts/run_xtend_tests.js fabric-telemetry-snapshot
node scripts/run_xtend_tests.js fabric-performance-measurements
npm run test:fabric
npm run test:fabric-lifecycle
npm run test:fabric-reporters
npm run test:fabric-runtime-bridge
npm run test:fabric-component-fibers
npm run test:fabric-route-fibers
npm run test:fabric-telemetry
npm run test:fabric-performance
```

Der Gate prueft:

- `fabric/xtend-fabric.js` Syntax und Contract-Surface
- `xtend.fabric.api.v1`, `xtend.fabric.diagnostic.v1`, `xtend.fabric.reporter.v1`, `xtend.fabric.redaction.v1`, `xtend.fabric.fiber.v1` und `xtend.fabric.lane.v1`
- Noop-Default ohne externen Reporter
- opt-in Reporter mit redigierten Diagnostics
- `runFiber`, `createBoundary`, `wrapComponent`, `captureError` und `connectRmtDiagnostics`
- `xtend.fabric.lifecycle-error-boundary.v1`
- `createComponentLifecycleBoundary`, Lifecycle-Phasen, Event-Handler-Wrapping und die defekte Fixture `tests/fabric/fixtures/broken-lifecycle.component.js`
- `createReporterAdapter`, `createConsoleReporter`, `createTestReporter`, Reporter-Severity-Filter und opt-in Enterprise-Reporter-Vorbereitung
- `createRuntimeDiagnosticsBridge`, `connectXState`, `connectApi`, `createRmtDiagnosticsHub`, `xtend.fabric.bridge.ready`, `xtend.fabric.diagnostics.last` und `xtend.fabric.diagnostics.snapshot`
- `createComponentFiberInstrumentation`, `component.visible.mount`, `component.idle.hydrate`, Dauer-/Ergebnis-/Lane-/Diagnostics-Felder und redigierte Fiber-Metadata
- `createRouteFiberInstrumentation`, `ui.user-blocking.input`, `route.transition.render`, `route.visible.render`, `xtendrmt.route.render`, XRouter-Boundaries und redigierte Route-Fiber-Metadata
- `createTelemetrySnapshot`, `createBackpressureSignal`, `publishTelemetrySnapshot`, `xtend.fabric.telemetry-snapshot.v1`, `xtend.fabric.backpressure-signal.v1`, Performance-Runtime-Anschluss und Reporter Export
- `xtend.performance.measurement.v1`, `PERFORMANCE_MEASURE_PHASES`, Loader-/Hydration-/Render-/Route-Messpunkte und `phaseSummary` im Telemetry Snapshot

Die Suite importiert keinen XTendRMT-Kernel. RMT-Signale werden nur als Adapter-/Bridge-Output simuliert.
