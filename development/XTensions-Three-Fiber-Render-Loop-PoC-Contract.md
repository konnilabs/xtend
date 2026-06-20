# XTensions Three.js Fiber Render Loop PoC Contract

Status: `accepted-by-XTN-09`
Backlog: `development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md`
Gate: `node scripts/run_xtend_tests.js xtensions-three-render-loop-poc --json`

## Zweck

XTN-09 validiert render-loop-getriebene XTensions am Beispiel Three.js. Three.js bleibt eine externe opt-in Peer-Runtime; XTend importiert, installiert und vendort keine Three.js- oder WebGL-Framework-Runtime. Lokal wird nur ein frameworkloser Contract-Stub getestet.

## Contract Shapes

- PoC Schema: `xtend.xtensions.three-render-loop-poc.v1`
- Contract Schema: `xtend.xtensions.three-render-loop-contract.v1`
- Fiber Record: `xtend.xtensions.three-fiber-record.v1`
- Frame Record: `xtend.xtensions.three-frame-record.v1`
- Context Loss Record: `xtend.xtensions.three-context-loss-record.v1`
- Browser Smoke Record: `xtend.xtensions.three-browser-smoke-record.v1`
- Report Schema: `xtend.xtensions.three-render-loop-report.v1`

## Host Boundary

- Three.js ist nur eine deklarierte `external-peer` Dependency.
- Ein freier permanenter `requestAnimationFrame` Loop ist kein XTensions-Vertrag.
- Der Render Loop wird als host-registrierter Fabric/Fiber Endpoint modelliert.
- Frame Budget, Backpressure, Visibility Pause und Low-Power-Degradation liegen unter Host-Policy.
- WebGL Context Loss wird diagnostiziert und suspendiert Render-Arbeit.
- Three.js Renderer, Scene, Camera, Meshes, Geometry, Materials, Textures, WebGL Context und native Events verlassen den HostController nicht.

## Fiber Record

`xtend.xtensions.three-fiber-record.v1` beschreibt den registrierten Render Endpoint:

- `hostRegistered: true`
- `schedulerAuthority: host-fiber`
- `freeRunningLoopAllowed: false`
- `lane` als Fabric Lane, typischerweise `fabric.render`
- `frameBudgetMs` und `lowPowerFrameBudgetMs`
- `backpressureStrategy`, `visibilityPolicy`, `contextLossPolicy`

## Frame Record

`xtend.xtensions.three-frame-record.v1` beschreibt jeden Host-Tick:

- `rendered`: Frame innerhalb des Budgets, nichtblanke Szene kann belegt werden.
- `dropped-over-budget`: Frame ueberschreitet Budget und erzeugt Backpressure-Diagnostics.
- `skipped-hidden`: Surface ist hidden, Render Loop pausiert.
- `skipped-suspended`: Host hat die Fiber suspendiert.
- `skipped-context-lost`: WebGL Context ist verloren.

Frame Records sind serialisierbar und enthalten keine WebGL-Objekte.

## Browser Smoke

Der lokale Gate nutzt einen frameworklosen Pixel-Probe-Record statt einer echten Three.js-Szene:

- `browserRuntimeRequired: false`
- `threeRuntimeImported: false`
- `nonBlankPixels > 0`
- `interactionCount > 0`
- `cleanupVerified: true`

Ein spaeterer produktiver Browser-Smoke darf echte Browser- und Three.js-Runtimes nur in einem externen opt-in Harness nutzen.

## Diagnostics

Blockierende Diagnostics:

- `xtensions.three_poc.framework_dependency`
- `xtensions.three_poc.free_raf_loop`
- `xtensions.three_poc.non_serializable_payload`
- `xtensions.three_poc.api_leak`
- `xtensions.three_poc.not_mounted`
- `xtensions.three_poc.already_destroyed`
- `xtensions.three_poc.fiber_unregistered`
- `xtensions.three_poc.frame_budget_invalid`
- `xtensions.three_poc.browser_smoke_blank`
- `xtensions.three_poc.cleanup_incomplete`

Warnende Diagnostics:

- `xtensions.three_poc.backpressure`
- `xtensions.three_poc.context_lost`

## Definition Of Done

- `tools/xtensions/three-render-loop-poc.js` stellt Contract, Adapter Record, HostController-Stub und Report-Serialisierung bereit.
- `tools/xtensions/three-render-loop-poc.d.ts` exportiert die Contract-Oberflaeche fuer Tooling.
- `tests/fixtures/xtensions/three-render-loop-poc-valid.json` beschreibt Three.js nur als externen Peer.
- `tests/xtensions/xtensions_three_render_loop_poc_suite.js` prueft Dependency-Grenze, Fiber-Registrierung, Frame Budget, Backpressure, Visibility Pause, Low-Power-Degradation, Context Loss, Browser-Smoke-Evidence und Cleanup.
- `package.json` exportiert nur die Contract-Helfer, nicht Three.js.
- Der lokale Gate `node scripts/run_xtend_tests.js xtensions-three-render-loop-poc --json` bleibt ohne neue Dependencies gruen.
