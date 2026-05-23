# RMT vNext Source-to-Sea Gate

- Contract: `xtend.rmt.vnext.source-to-sea-gate.v1`
- Evidence: `xtend.rmt.vnext.source-to-sea-evidence.v1`
- Evidence Report: `xtend.rmt.vnext.source-to-sea-evidence-report.v1`
- Object Matrix: `xtend.rmt.vnext.source-to-sea-object-matrix.v1`
- CI Artifact Validation: `xtend.rmt.vnext.source-to-sea-ci-artifact-validation.v1`
- Fabric Bridge Evidence: `xtend.rmt.vnext.fabric-bridge-evidence.v1`
- Workpackage: `RMT-VNEXT-PRIM-06`
- Active Bridge Workpackage: `RMT-VNEXT-PRIM-05`
- Status: `in_progress`
- Fabric Bridge Handoff: [RMT vNext Fabric Bridge Evidence](./rmt-vnext-fabric-bridge-evidence.md)
- Quelle: Media-Manager-Downstream-Transfer, `2026-05-19`

## Ziel

`RMT-VNEXT-PRIM-06` startet das Fullstack-Gate fuer vNext-authorierte
Primitives. Das Gate beweist nicht nur Parser- oder JSON-Output, sondern
rekonstruiert denselben sichtbaren Objekt-Lifecycle ueber alle Runtime-Grenzen:

```text
source -> kernel -> Fabric -> UI -> Browser
```

Die erste PRIM-06-Scheibe bleibt im Standardlauf deterministisch und laeuft
ohne externen Browser-Treiber. Sie verbindet eine vNext-Fixture mit einer
selbstpruefenden Browser-Smoke-Fixture und erzeugt daraus maschinenlesbare
Evidence. Seit dem aktuellen Ausbau kann ein WebDriver-, ChromeDriver- oder
Safari-Driver-Pfad dieselbe Browser-Fixture oeffnen, den gleichen Result-Key
auslesen und das echte Browser-Ergebnis gegen Compiler-, Kernel- und Fabric-
Evidence vergleichen. Die Browser-Execution-Evidence ist jetzt auch als
Release-Artefakt unter
`.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json`
schreibbar. In GitHub Actions laeuft dieser Pfad verpflichtend ueber
`chromedriver`.

## Fixture

Die vNext-Fixture liegt unter:

```text
tests/rmt-language/fixtures/vnext-source-to-sea.rmt
```

Sie deklariert ausschliesslich in RMT vNext:

- `state demo.feedback.status`
- `state demo.feedback.toast`
- `state demo.feedback.detail`
- `state demo.feedback.audit`
- `selector demo.feedback.status`
- `selector demo.feedback.toast`
- `selector demo.feedback.detail`
- `selector demo.feedback.audit`
- `action demo.feedback.save`
- `action demo.feedback.dismiss`
- `action demo.feedback.detail.ack`
- `action demo.feedback.audit.review`
- `portal surface.root`
- `resource demo.feedback.timer`
- `resource demo.feedback.toastTimer`
- `resource demo.feedback.detailTimer`
- `resource demo.feedback.auditTimer`
- `surface demo.feedback.status`
- `surface demo.feedback.toast`
- `surface demo.feedback.detail`
- `surface demo.feedback.audit`
- eine `visible` Lane mit `hydrate feedback-status`
- eine zweite `idle` Lane mit `hydrate feedback-toast`
- eine `transition` Lane mit `mount feedback-detail`
- eine zweite `transition` Lane mit `mount feedback-audit`
- ein Click-Event auf `[data-action='save']`
- ein Click-Event auf `[data-action='dismiss']`
- ein Click-Event auf `[data-action='ack-detail']`
- ein Click-Event auf `[data-action='review-audit']`
- ein Cross-Primitive-Reducer von `demo.feedback.save` nach
  `state.demo.feedback.toast.text`

Damit sind State, Selector, Action, Event, Surface, Lane/Fiber und
Lifecycle-Owner in derselben Authoring-Sprache vorhanden.

## Browser Probe

Die Browser-Fixture liegt unter:

```text
tests/browser/fixtures/rmt-vnext-source-to-sea-smoke.html
```

Sie enthaelt einen sichtbaren DOM-Marker:

```html
data-rmt-primitive-id="demo.feedback.status"
data-rmt-primitive-id="demo.feedback.toast"
data-rmt-primitive-id="demo.feedback.detail"
data-rmt-primitive-id="demo.feedback.audit"
```

und einen stabilen Result-Key:

```js
window.__xtendRmtVNextSourceToSeaResult
```

Die Fixture prueft lokal, dass das Objekt sichtbar ist, die erwartete
Schedule-/Fiber-Metadaten traegt, der Click das RMT-Action-Event aufzeichnet
und der sichtbare Text von `Ready` auf `Saved` wechselt.

Seit `RMT-VNEXT-PRIM-05` traegt dieselbe DOM-Probe zusaetzlich sichtbare
Fabric-Brueckenmarker:

```html
data-xtend-fabric-lane="visible"
data-xtend-fabric-fiber="fiber:demo.feedback/demo.feedback.status/visible/0"
data-xtend-fabric-schedule="component.visible.hydrate"
data-xtend-host-adapter-telemetry="xtend.component.lifecycle-telemetry.v1"
```

Die Bridge haertet ausserdem eine Lane-Matrix fuer `user-blocking`,
`transition`, `idle`, `background` und `diagnostics`. Jede Matrix-Lane erzeugt
eine echte Fabric-Fiber, eine Fabric/RMT-Mapping-Entscheidung und einen
Telemetry-Snapshot-Eintrag.

Die Browser-Probe enthaelt zusaetzlich einen Host-Adapter-Telemetry-Record mit
`xtend.component.lifecycle-telemetry.v1`. Das Gate normalisiert diesen Record
ueber `fabric.recordComponentTelemetry(...)`, damit PRIM-05 die XTend UI Host-
Adapter-Ebene im Fabric-Snapshot nachweisen kann.

Seit dem Multi-Object-Ausbau projiziert das Gate die Host-Adapter-Telemetrie
pro Primitive. `demo.feedback.status` bleibt auf `visible` und
`component.visible.hydrate`, waehrend `demo.feedback.toast` ueber `idle` und
`component.idle.hydrate` validiert wird. `demo.feedback.detail` und
`demo.feedback.audit` sind getrennte Route-Targets auf der `transition`-Lane.

Zusaetzlich bindet PRIM-05 die produktiven Fiber-Instrumentations an:

- `createComponentFiberInstrumentation(...)` erzeugt `component.mount` und
  `component.hydrate`.
- `createRouteFiberInstrumentation(...)` erzeugt `route.navigate` und
  `route.render`.
- Die Schedule Refs `component.visible.mount`, `component.idle.hydrate`,
  `ui.user-blocking.input` und `route.transition.render` muessen im Fabric-
  Telemetry-Snapshot auftauchen.

## Evidence API

Das Gate wird von `tools/rmt-language/vnext-source-to-sea.js` erzeugt:

```js
const {
  createRmtVNextFabricBridgeEvidence,
  createRmtVNextSourceToSeaEvidenceReport,
  createRmtVNextSourceToSeaEvidence,
  runRmtVNextSourceToSeaBrowserExecution,
  writeRmtVNextSourceToSeaEvidenceReport
} = require('./tools/rmt-language/vnext-source-to-sea');

const evidence = createRmtVNextSourceToSeaEvidence({
  text,
  filePath
}, {
  browserFixtureText,
  browserFixturePath: 'tests/browser/fixtures/rmt-vnext-source-to-sea-smoke.html'
});

const browserExecution = await runRmtVNextSourceToSeaBrowserExecution(evidence, {
  rootDir: process.cwd(),
  browserFixturePath: 'tests/browser/fixtures/rmt-vnext-source-to-sea-smoke.html',
  browserDriver: process.env.RMT_VNEXT_SOURCE_TO_SEA_BROWSER_DRIVER || 'chromedriver',
  requireBrowserExecution: true
});

const evidenceReport = await createRmtVNextSourceToSeaEvidenceReport({
  rootDir: process.cwd(),
  evidence,
  browserExecution
});

await writeRmtVNextSourceToSeaEvidenceReport({
  rootDir: process.cwd()
});
```

Die Evidence muss unter derselben Primitive-ID korrelieren:

```json
{
  "schema": "xtend.rmt.vnext.source-to-sea-evidence.v1",
  "primitiveId": "demo.feedback.status",
  "sourcePointer": "/events/0",
  "kernel": {
    "scheduleRef": "schedule:demo.feedback/demo.feedback.status/visible"
  },
  "fabric": {
    "schema": "xtend.rmt.vnext.fabric-bridge-evidence.v1",
    "workpackage": "RMT-VNEXT-PRIM-05",
    "lane": "visible",
    "fiber": "fiber:demo.feedback/demo.feedback.status/visible/0",
    "scheduleRef": "component.visible.hydrate",
    "endpointName": "xtendrmt.component.hydrate",
    "hostAdapter": {
      "schema": "xtend.component.lifecycle-telemetry.v1",
      "source": "xtend.component-adapter",
      "operation": "hydrate"
    },
    "routeComponentFibers": {
      "schema": "xtend.rmt.vnext.route-component-fiber-evidence.v1",
      "component": ["component.visible.mount", "component.idle.hydrate"],
      "route": ["ui.user-blocking.input", "route.transition.render"]
    }
  },
  "ui": {
    "selector": "[data-rmt-primitive-id=\"demo.feedback.status\"]",
    "visible": true,
    "text": "Saved"
  },
  "browser": {
    "viewportAsserted": true,
    "eventObserved": true
  },
  "browserExecution": {
    "schema": "xtend.rmt.vnext.browser-execution-evidence.v1",
    "status": "skipped",
    "driver": null,
    "resultKey": "__xtendRmtVNextSourceToSeaResult"
  }
}
```

Der artefaktierte Report kapselt diese Evidence plus Browser-Execution-
Policy:

```json
{
  "schema": "xtend.rmt.vnext.source-to-sea-evidence-report.v1",
  "workpackage": "RMT-VNEXT-PRIM-06",
  "status": "passed",
  "artifact": {
    "path": ".xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json",
    "browserExecutionRequired": false,
    "browserExecutionStatus": "skipped"
  },
  "ciArtifactValidation": {
    "schema": "xtend.rmt.vnext.source-to-sea-ci-artifact-validation.v1",
    "status": "skipped"
  }
}
```

Seit dem Multi-Object-Ausbau enthaelt derselbe Report zusaetzlich eine
Object-Matrix:

```json
{
  "schema": "xtend.rmt.vnext.source-to-sea-object-matrix.v1",
  "objectCount": 4,
  "primitiveIds": [
    "demo.feedback.status",
    "demo.feedback.toast",
    "demo.feedback.detail",
    "demo.feedback.audit"
  ],
  "crossPrimitiveEvents": [
    {
      "sourcePrimitiveId": "demo.feedback.status",
      "targetPrimitiveId": "demo.feedback.toast",
      "actionId": "demo.feedback.save",
      "eventId": "demo.feedback.toast.promoted",
      "targetState": "state.demo.feedback.toast.text",
      "lane": "idle"
    }
  ],
  "routeSwitches": [
    {
      "sourcePrimitiveId": "demo.feedback.status",
      "targetPrimitiveId": "demo.feedback.detail",
      "actionId": "demo.feedback.save",
      "from": "/rmt-vnext-source-to-sea",
      "to": "/rmt-vnext-source-to-sea/toast",
      "scheduleRef": "ui.user-blocking.input",
      "renderScheduleRef": "route.transition.render",
      "lane": "transition",
      "targetScheduleRef": "schedule:demo.feedback/demo.feedback.detail/transition",
      "targetFiberRef": "fiber:demo.feedback/demo.feedback.detail/transition/0",
      "targetExpectedText": "Detail mounted"
    },
    {
      "sourcePrimitiveId": "demo.feedback.status",
      "targetPrimitiveId": "demo.feedback.audit",
      "actionId": "demo.feedback.save",
      "from": "/rmt-vnext-source-to-sea/toast",
      "to": "/rmt-vnext-source-to-sea/audit",
      "scheduleRef": "ui.user-blocking.input",
      "renderScheduleRef": "route.transition.render",
      "lane": "transition",
      "targetScheduleRef": "schedule:demo.feedback/demo.feedback.audit/transition",
      "targetFiberRef": "fiber:demo.feedback/demo.feedback.audit/transition/0",
      "targetExpectedText": "Audit mounted"
    }
  ],
  "routeLifecycleCycles": [
    {
      "targetPrimitiveId": "demo.feedback.detail",
      "from": "/rmt-vnext-source-to-sea/toast",
      "to": "/rmt-vnext-source-to-sea",
      "unmountScheduleRef": "ui.background.work",
      "remountScheduleRef": "route.transition.render",
      "resourceId": "demo.feedback.detailTimer",
      "expectedUnmountCount": 1,
      "expectedRemountCount": 1
    },
    {
      "targetPrimitiveId": "demo.feedback.audit",
      "from": "/rmt-vnext-source-to-sea/audit",
      "to": "/rmt-vnext-source-to-sea",
      "unmountScheduleRef": "ui.background.work",
      "remountScheduleRef": "route.transition.render",
      "resourceId": "demo.feedback.auditTimer",
      "expectedUnmountCount": 1,
      "expectedRemountCount": 1
    }
  ]
}
```

## Gate-Regeln

Das Gate schlaegt fehl, wenn eines dieser Korrelationsglieder fehlt:

- Compiler-Result ist nicht erfolgreich.
- PRIM-03 Semantic Graph meldet Fehler.
- PRIM-04 App-Platform- oder Kernel-Records fehlen.
- Kernel-Boundary ist nicht `no-rmt-kernel-import-of-host-runtime-types`.
- Schedule oder Lifecycle-Record fehlt.
- Aus Schedule und Operation laesst sich keine Fabric-Fiber ableiten.
- Die Fabric-Bruecke kann keine `xtend.fabric.fiber.v1` erzeugen.
- Die Fabric/RMT-Lane-Aufloesung liefert kein
  `xtend.fabric.rmt-lane-mapping.v1`.
- Der Fabric-Telemetry-Snapshot enthaelt die erwartete Lane oder Schedule Ref
  nicht.
- Die PRIM-05-Lane-Matrix enthaelt nicht alle erwarteten Fabric-Lanes.
- Die Host-Adapter-Telemetrie fehlt im Fabric-Snapshot.
- Route- oder Component-Fiber fehlen im Fabric-Snapshot.
- Die Browser-Fixture enthaelt keine sichtbaren Fabric-Lane-/Fiber-Marker.
- Der Fiber-Source-Kind ist nicht `selector`.
- Source-Map-Pointer zum Event fehlt.
- Browser-Fixture deklariert keinen Probe-Contract.
- DOM-Marker, Viewport-Assertion oder Event-Result-Key fehlen.
- Die Object-Matrix enthaelt weniger als vier sichtbare Primitives, keine
  getrennten Lanes oder kein Cross-Primitive-Event.
- Die Object-Matrix enthaelt nicht mindestens zwei valide Route-Switches mit
  Navigation- und Render-Schedule.
- Der Route-Switch mountet kein Target-Objekt oder das Target ist im echten
  Browser-Result nicht sichtbar.
- Ein Route-Lifecycle-Cycle unmountet oder remountet das Target nicht, die
  erwarteten Unmount-/Remount-Zaehler pro Target fehlen, der deklarierte
  Resource-Cleanup ist nicht in vNext/Core nachweisbar, oder der Resource-Owner
  passt nicht zum Route-Target.
- Eines der Matrix-Objekte korreliert nicht durch Source, Kernel, Fabric, UI
  und Browser.
- Der optionale Browser-Execution-Pfad liefert bei aktivem Driver keinen
  `passed`-Result-Key oder weicht bei Primitive ID, Schedule, Fiber, Fabric
  Schedule, Host-Adapter-Telemetrie oder Event von der Evidence ab.
- ChromeDriver-Auto-Cleanup kann einen automatisch gestarteten Driver nach
  erfolgreichem Browser-Result nicht ueber `/shutdown` oder Prozess-Fallback
  beenden.
- Kernel-Records enthalten XTend-Host-Imports.

## Lokale Gates

Gezielte PRIM-06-Gates:

```bash
node --check tools/rmt-language/vnext-source-to-sea.js
node --check tests/rmt-language/rmt_vnext_source_to_sea_suite.js
node --check scripts/capture_rmt_vnext_source_to_sea_evidence.js
node -e "const suite=require('./tests/rmt-language/rmt_vnext_source_to_sea_suite'); suite.runRmtVNextSourceToSeaSuite({rootDir:process.cwd()}).then((result)=>process.exit(result.ok ? 0 : 1));"
node scripts/capture_rmt_vnext_source_to_sea_evidence.js
node scripts/run_xtend_tests.js fabric-lane-mapping fabric-component-fibers fabric-runtime-bridge --json
```

Echter Browser-Lauf mit externem WebDriver:

```bash
RMT_VNEXT_SOURCE_TO_SEA_BROWSER_DRIVER=webdriver \
RMT_VNEXT_SOURCE_TO_SEA_WEBDRIVER_URL=http://127.0.0.1:9515 \
node scripts/capture_rmt_vnext_source_to_sea_evidence.js --require-browser
```

Echter Browser-Lauf mit automatisch gestartetem ChromeDriver:

```bash
npm run test:rmt-vnext-source-to-sea:chromedriver
```

Echter Browser-Lauf mit automatisch gestartetem Firefox/Geckodriver:

```bash
npm run test:rmt-vnext-source-to-sea:firefox
```

Alternativ kann derselbe Gate gegen einen beliebigen W3C-WebDriver-Endpunkt
laufen. `--browser-name` bzw. `RMT_VNEXT_SOURCE_TO_SEA_BROWSER_NAME` waehlt
dann z. B. `firefox`, `chrome`, `MicrosoftEdge` oder `safari`:

```bash
RMT_VNEXT_SOURCE_TO_SEA_BROWSER_DRIVER=webdriver \
RMT_VNEXT_SOURCE_TO_SEA_BROWSER_NAME=firefox \
RMT_VNEXT_SOURCE_TO_SEA_WEBDRIVER_URL=http://127.0.0.1:4444 \
node scripts/capture_rmt_vnext_source_to_sea_evidence.js --require-browser
```

Der GitHub-Actions-Job `rmt-vnext-primitive-gates` nutzt diesen ChromeDriver-
Pfad als Required Gate und uploaded danach dasselbe Evidence-Artefakt.
Der Report enthaelt zusaetzlich eine CI-Artefaktvalidierung. Im lokalen
Browser-Skip-Modus bleibt sie `skipped`; im ChromeDriver-Required-Pfad muss sie
`passed` sein und `objectCount: 4`, zwei Cross-Primitive-Events, zwei
Route-Switches, zwei Route-Lifecycle-Cycles, `targetMounted`, `targetVisible`,
`countsMatch` und die Audit-Resources `demo.feedback.auditTimer` sowie
`demo.feedback.auditSubscription` nachweisen.

Ein bereits geschriebenes CI-Artefakt kann ohne neuen Browser-Lauf erneut gegen
denselben Contract geprueft werden:

```bash
npm run test:rmt-vnext-source-to-sea:validate-artifact
node scripts/capture_rmt_vnext_source_to_sea_evidence.js --validate-artifact .xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json
```

Firefox-Artefakte koennen mit dem erwarteten Driver replayed werden:

```bash
npm run test:rmt-vnext-source-to-sea:validate-artifact:firefox
```

Der Replay-Pfad nutzt
`validateRmtVNextSourceToSeaCiArtifactFile(...)`, setzt Browser-Evidence als
verpflichtend voraus und faellt fuer fehlende, nicht parsebare oder gedriftete
Artefakte geschlossen mit `status: "failed"` aus.

ChromeDriver-Auto-Cleanup nutzt fuer automatisch gestartete ChromeDriver zuerst
den lokalen WebDriver-Endpunkt `/shutdown`. Erst wenn dieser Pfad den Prozess
nicht beendet, faellt das Gate auf Prozess-Signale zurueck. Das ist wichtig fuer
Snap-/Chromium-Installationen, bei denen ein direkter `kill()` mit `EACCES`
scheitern kann.

## Naechster Handoff

`RMT-VNEXT-PRIM-06` liefert nun die erste Source-to-Sea-Evidence.
`RMT-VNEXT-PRIM-05` ist als eigenes Fabric-Bridge-Paket abgeschlossen: echte
Fabric-Runtime-Fiber, Host-Adapter-Telemetrie, Route-/Component-Fiber, ein
Telemetry-Snapshot und eine Lane-Matrix fuer nicht sichtbare Scheduling-
Klassen sind ueber `rmt-vnext-fabric-bridge` gatebar. Der aktuelle PRIM-06-
Ausbau schaltet den Browser-Execution-Pfad in GitHub Actions verpflichtend auf
ChromeDriver. Das Release-Artefakt ist als
`.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json` angebunden.
Die Browser-Result-Matrix fuehrt jetzt vier Objekte, Cross-Primitive-Events
und zwei sequenzielle Route-Switches. Der aktuelle Runtime-Slice mountet
`demo.feedback.detail` und `demo.feedback.audit` erst nach Route-Wechseln und
verlangt im Browser-Result jeweils `targetMounted: true` sowie
`targetVisible: true`. Zusaetzlich fuehrt `routeLifecycleCycles` getrennte
Unmount-/Remount-Zyklen fuer beide Targets:
`demo.feedback.detailTimer` und `demo.feedback.auditTimer` muessen ueber
`dispose on surface.destroy` als Resource-Cleanup-Evidence vorliegen; die
Browser-Evidence muss pro Target `unmountCount: 1`, `remountCount: 1` und
`countsMatch: true` liefern. Der Audit-Zyklus prueft nun mehrere Resource-
Records: Neben `demo.feedback.auditTimer` muss auch
`demo.feedback.auditSubscription` mit `kind subscription`,
`owner surface.demo.feedback.audit` und `dispose on surface.destroy`
artefaktiert werden. Eine negative Fixture ohne Dispose-Policy muss
kontrolliert mit
`rmt.vnext.source_to_sea.cleanup_dispose_policy_missing` fehlschlagen. Eine
zweite negative Fixture besitzt zwar eine Dispose-Policy, bindet
`demo.feedback.detailTimer` aber an `surface.demo.feedback.toast`; sie muss mit
`rmt.vnext.source_to_sea.cleanup_owner_mismatch` fehlschlagen. Eine dritte
negative Fixture entfernt `demo.feedback.auditTimer` vollstaendig aus vNext,
laesst `demo.feedback.audit` aber als Route-Target bestehen; sie muss mit
`rmt.vnext.source_to_sea.cleanup_resource_missing` fehlschlagen. Der naechste
Schritt ist der Abgleich der lokalen `chromedriver`-Evidence mit echten
CI-Artefakten.

Die Cross-Primitive-Evidence ist nun zweistufig: Neben
`demo.feedback.save -> demo.feedback.toast` muss auch
`demo.feedback.detail.ack -> demo.feedback.audit` nach dem Route-Mount
nachgewiesen werden. Der zweite Eintrag reduziert
`state.demo.feedback.audit.text`, emittiert `demo.feedback.audit.escalated`
und muss als `stage: "route-target"` mit `sourceLane: "transition"` und
`targetLane: "transition"` im Browser-Result erscheinen.

Der negative Browser-Probe
`tests/browser/fixtures/rmt-vnext-source-to-sea-cross-route-invalid.html`
verschiebt den `stage: "route-target"`-Eintrag absichtlich auf
`targetPrimitiveId: "demo.feedback.toast"`, waehrend Event und Target-State
weiter auf `demo.feedback.audit` zeigen. Die Object-Matrix muss dadurch
geschlossen fehlschlagen und mindestens diese Guards als `false` ausweisen:
`cross event route-target state belongs to target primitive`,
`cross event route-target event belongs to target primitive` und
`cross event route-target stage uses transition lanes`.

## Browser Result Drift

Der WebDriver-Result-Pfad wird zusaetzlich durch
`xtend.rmt.vnext.source-to-sea-browser-result-validation.v1` abgesichert.
`createRmtVNextSourceToSeaBrowserResultValidation(...)` kapselt dieselben
Checks, die der echte ChromeDriver-Lauf nach dem Headless-Browser auswertet.
Damit koennen Route-Switch- und Lifecycle-Drifts ohne neuen Browserstart
deterministisch rekonstruiert werden:

- `browser execution route switches pass` muss fehlschlagen, wenn ein
  Route-Switch zwar im Result steht, aber `status: "failed"`,
  `targetMounted: false` oder `targetVisible: false` liefert.
- `browser execution route lifecycle cycles pass` muss fehlschlagen, wenn ein
  Lifecycle-Zyklus `countsMatch: false` oder abweichende Unmount-/Remount-
  Zaehler ausweist.
- `browser execution cross-primitive events pass` muss fehlschlagen, wenn ein
  Cross-Primitive-Event im Browser-Result nicht `status: "passed"` liefert.
- `browser execution object matrix passes` muss fehlschlagen, wenn ein
  sichtbares Objekt im Browser-Result nicht `status: "passed"` liefert.

## Cross-Route Event Evidence

Das positive Browser-Result muss zwei Cross-Primitive-Events enthalten:

```json
{
  "sourcePrimitiveId": "demo.feedback.status",
  "targetPrimitiveId": "demo.feedback.toast",
  "eventId": "demo.feedback.toast.promoted",
  "targetLane": "idle"
}
```

```json
{
  "sourcePrimitiveId": "demo.feedback.detail",
  "targetPrimitiveId": "demo.feedback.audit",
  "eventId": "demo.feedback.audit.escalated",
  "stage": "route-target",
  "sourceLane": "transition",
  "targetLane": "transition"
}
```

## Multi-Resource Cleanup Evidence

Der positive Audit-Lifecycle muss mehrere Cleanup-Resources ausweisen:

```json
{
  "targetPrimitiveId": "demo.feedback.audit",
  "resourceIds": [
    "demo.feedback.auditTimer",
    "demo.feedback.auditSubscription"
  ],
  "resourceKinds": [
    "timer",
    "subscription"
  ],
  "resourceDisposed": true
}
```

Die Object-Matrix muss fuer `demo.feedback.auditSubscription` denselben Owner
und dieselbe Dispose-Policy wie fuer den Timer pruefen. Zyklen mit nur
`resourceId` bleiben kompatibel; produktive Zyklen koennen `resources` mit
mehreren Resource IDs und erwarteten Kinds deklarieren.

## Negative Cleanup Fixtures

Die negativen Fixtures liegen unter:

```text
tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-invalid.rmt
tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-owner-invalid.rmt
tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-resource-missing.rmt
tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-kind-invalid.rmt
```

Die erste Fixture laesst `demo.feedback.detailTimer` absichtlich ohne
`dispose on surface.destroy`. Die zweite Fixture behaelt die Dispose-Policy,
bindet den Resource-Owner aber absichtlich an `surface.demo.feedback.toast`.
Die dritte Fixture laesst `demo.feedback.audit` als Route-Target bestehen,
entfernt aber `demo.feedback.auditTimer` vollstaendig aus der vNext-Quelle.
Die vierte Fixture behaelt `demo.feedback.auditSubscription` als Cleanup-
Resource, deklariert sie aber absichtlich mit `kind cache` statt
`kind subscription`.
Das positive Source-to-Sea-Gate bleibt erfolgreich, aber die negativen
Matrizen muessen fehlschlagen und folgende Evidence liefern:

```json
{
  "code": "rmt.vnext.source_to_sea.cleanup_dispose_policy_missing",
  "targetPrimitiveId": "demo.feedback.detail",
  "resourceId": "demo.feedback.detailTimer",
  "dispose": null
}
```

```json
{
  "code": "rmt.vnext.source_to_sea.cleanup_owner_mismatch",
  "targetPrimitiveId": "demo.feedback.detail",
  "resourceId": "demo.feedback.detailTimer",
  "owner": {
    "id": "demo.feedback.toast"
  }
}
```

```json
{
  "code": "rmt.vnext.source_to_sea.cleanup_resource_missing",
  "targetPrimitiveId": "demo.feedback.audit",
  "resourceId": "demo.feedback.auditTimer",
  "resource": null
}
```

```json
{
  "code": "rmt.vnext.source_to_sea.cleanup_kind_mismatch",
  "targetPrimitiveId": "demo.feedback.audit",
  "resourceId": "demo.feedback.auditSubscription",
  "expectedKind": "subscription",
  "actualKind": "cache"
}
```
