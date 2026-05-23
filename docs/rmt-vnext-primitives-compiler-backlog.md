# RMT vNext Primitive Compiler Backlog

- Contract: `xtend.rmt.vnext-primitives-compiler-backlog.v1`
- Status: `in_progress`
- Quelle: Media-Manager-Downstream-Integration, `2026-05-19`
- Transfer-Typ: Lessons Learned / Backlog
- Downstream-Evidence:
  - `/home/konni/Dokumente/net.ccs.cloud/media-manager/src/rmt/media-manager-shell.rmt`
  - `/home/konni/Dokumente/net.ccs.cloud/media-manager/src/rmt/media-manager-shell.orchestration.rmt`
  - `/home/konni/Dokumente/net.ccs.cloud/media-manager/docs/xtend-component-bugfixes.md`

## Problem

Die Media-Manager-Integration zeigt, dass die neuen RMT App-Platform-
Primitives fachlich richtig sind, die Developer Experience aber noch in zwei
Authoring-Modelle zerfaellt.

- RMT vNext ist die verstaendliche, menschenfreundliche Developer-Syntax.
- App-Platform-Primitives liegen aktuell in einer separaten JSON-foermigen
  Quelle.
- Der klassische RMT-Build besitzt weiterhin den Scaffold-/Core-
  Kompatibilitaetspfad.
- Entwickler muessen wissen, welcher Compiler welche Ebene besitzt, bevor sie
  eine koharente App Shell bauen koennen.

Damit verliert RMT einen Teil seines Plattformwertes. Eine Plattform ist nur
dann glaubwuerdig, wenn App-Autoren die komplette Produkt-Shell in einer
einheitlichen, lesbaren und diagnostizierbaren Authoring Experience ausdruecken
koennen.

## Epic-Ziel

Das naechste RMT-Epic muss den vNext-Compiler massiv erweitern: App-Autoren
muessen App-Platform-Primitives direkt in RMT vNext deklarieren koennen.

RMT Legacy und kompatible JSON-Zwischenformate sollen in den Hintergrund
treten. Entwickler sollen fuer normale App-Shell-Arbeit nicht mehr in Legacy-
Formaten arbeiten muessen. Die primaere Authoring-Oberflaeche ist vNext; der
Compiler senkt diese Quelle in alle Runtime-Artefakte ab, die Kernel, Fabric
und UI-Host brauchen.

## Erforderliche vNext-Primitive-Oberflaeche

Grammar, Parser, Semantic Graph und Compiler-Output von vNext muessen
mindestens diese Primitive-Familien tragen:

| Primitive-Familie | Erforderliche vNext-Faehigkeit |
|-------------------|--------------------------------|
| App Shell | template, route, root, Shell Chrome, Slots und stabile Islands |
| Components | Component refs, Attribute, Textknoten, Slots, keyed Lists, Conditions und DOM Descriptoren |
| State | State Records, Selectors, derived Values, Reducers, Persistenz und XState-Bridge-Hints |
| Data | Fixtures, REST-Endpunkte, SSR-Payloads, Streams, Pagination und Schema-Contracts |
| Actions | Action-Deklarationen, async Effects, Loading-/Success-/Error-Status, Retries und Result Routing |
| Events | DOM-/Custom-Event-Bindings, Payload Contracts, Governance, Bubbling-/Capture-Policy und Action-Ziele |
| Surfaces | statische Surfaces, dynamische keyed Surface-Repeater, Bounds, Focus, Close, Minimize, Restore und Persistenz |
| Overlays | Tooltip-, Toast-, Lightbox-, Popover-, Dialog- und Menu-Portal-Semantik |
| Resources | Object URLs, Streams, Observer, Timer, Lazy Imports und owner-scoped Teardown |
| Security | Trust Boundaries, Sanitizer Policies, Import Policy und No-Kernel-Host-Import-Assertions |
| Diagnostics | Source Maps, Source Pointer, Primitive IDs, Schedule Refs und Runtime Correlation IDs |

Das Ergebnis muss erlauben, eine granulare App Shell ausschliesslich in RMT
vNext aufzubauen. Host-Adapter duerfen weiterhin Endpunkte, Component-Imports
und Browser-Ausfuehrung bereitstellen. UI-Struktur, State Graph, Event Routing,
Effects und Lifecycle Ownership muessen aber aus vNext-Source stammen.

## Compiler-Anforderungen

Der Compiler muss zu einer vollstaendigen App-Platform-Lowering-Pipeline
werden:

1. vNext-Primitive-Syntax in eine typisierte AST parsen.
2. Einen Semantic Graph fuer Components, State, Selectors, Actions, Events,
   Surfaces, Portals, Overlays, Resources und DataSources aufbauen.
3. Referenzen und Contracts vor der Runtime validieren.
4. Deterministische RMT-Core-Records fuer Kernel-Ingestion erzeugen.
5. App-Platform-Buildreports, Diagnosen und Source Maps aus derselben vNext-
   Quelle erzeugen.
6. Scaffold- und Runtime-Adapter-Artefakte fuer XTend UI erzeugen, ohne App-
   Autoren in generierte oder Legacy-Zwischenformate zu zwingen.
7. Source-to-Runtime-Korrelation fuer jedes sichtbare Objekt und jedes Event
   erhalten.
8. Die RMT-Kernel-Grenze frameworkneutral halten: keine XTend-Component-
   Imports im Kernel, kein Fabric-Import im Kernel und keine Browser-Annahmen
   in Core Records.

Der alte Kompatibilitaetspfad darf als Compiler-Target weiter existieren, darf
aber nicht der Authoring-Pfad sein.

## Kernel-Retest nach dem Upgrade

Nach dem Compiler-Upgrade muss der neue Output erneut gegen den RMT-Kernel
getestet werden. Es reicht nicht, zu beweisen, dass vNext parsen und JSON
erzeugen kann. Beweisbar sein muss, dass vNext-authorierte Primitives den
Runtime-Stack treiben koennen.

Der Kernel-Gate muss zeigen:

- vNext-Source kann Lanes und Fibers ueber erstklassige Syntax deklarieren.
- Der Compiler senkt diese Deklarationen in kernel-lesbare Schedule- und
  Lifecycle-Records ab.
- Der RMT-Kernel kann diese Records ohne framework-spezifische Imports
  ingestieren.
- Fabric kann die erwarteten Lanes, Fibers und Schedule Refs empfangen oder
  ableiten.
- Der UI-Host kann das angeforderte Objekt oder Event materialisieren.
- Ein Headless-Browser kann das finale Objekt, die State-Aenderung oder das
  Event im sichtbaren Viewport beobachten.

## Source-to-Sea-Fullstack-Gate

Fuer RMT vNext ist ein verpflichtendes "source to sea"-Gate einzufuehren.

Das Gate rekonstruiert den Lifecycle eines UI-Objektes von RMT-Source bis zur
Browser-Evidence:

```text
RMT vNext source
  -> parser AST
  -> semantic primitive graph
  -> compiler core/app artifacts
  -> RMT kernel schedule/lifecycle ingestion
  -> Fabric lane/fiber telemetry
  -> XTend UI host adapter
  -> DOM/custom-element materialization
  -> visible headless-browser viewport assertion
```

Das Gate muss fehlschlagen, wenn ein Korrelationsglied fehlt. Dieselbe
Primitive ID muss ueber Source-Map-Pointer, Compiler-Output, Kernel-Record,
Fabric-Fiber, DOM-Marker und Browser-Assertion nachvollziehbar sein.

### Minimale Fixture

Eine kleine vNext-Fixture soll deklarieren:

- ein sichtbares Component-Objekt, zum Beispiel Status-, Toast- oder Card-
  Surface;
- ein user-facing Event, zum Beispiel Button-Click oder Custom-Component-
  Event;
- eine Action oder einen Effect mit Success-Status;
- ein State Update und einen Selector;
- eine Fabric-Lane- und Fiber-Erwartung;
- eine Resource- oder Surface-Lifecycle-Grenze.

Der Browser-Smoke muss das Event ausloesen und pruefen:

- Das Objekt existiert im Viewport.
- State oder Text aendert sich sichtbar.
- Das Event wird mit der erwarteten RMT Action ID aufgezeichnet.
- Fabric meldet die erwartete Lane-/Fiber-Metadaten.
- Kernel-Diagnosen enthalten den erwarteten Schedule-/Lifecycle-Record.
- Source-Map-Metadaten zeigen auf die vNext-Source-Position zurueck.

## Evidence Contract

Das Fullstack-Gate schreibt eine maschinenlesbare Evidence-Datei. Der
artefaktierte Report nutzt
`xtend.rmt.vnext.source-to-sea-evidence-report.v1` und liegt unter
`.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json`; die
eingebettete Lifecycle-Evidence bleibt
`xtend.rmt.vnext.source-to-sea-evidence.v1`.

Beispiel der eingebetteten Lifecycle-Evidence:

```json
{
  "schema": "xtend.rmt.vnext.source-to-sea-evidence.v1",
  "source": "tests/rmt-language/fixtures/vnext-source-to-sea.rmt",
  "primitiveId": "demo.feedback.status",
  "sourcePointer": "/events/0",
  "compiler": {
    "ok": true,
    "artifactCount": 9
  },
  "kernel": {
    "ingested": true,
    "scheduleRef": "schedule:demo.feedback/demo.feedback.status/visible"
  },
  "fabric": {
    "schema": "xtend.rmt.vnext.fabric-bridge-evidence.v1",
    "workpackage": "RMT-VNEXT-PRIM-05",
    "lane": "visible",
    "fiber": "fiber:demo.feedback/demo.feedback.status/visible/0",
    "scheduleRef": "component.visible.hydrate",
    "endpointName": "xtendrmt.component.hydrate",
    "telemetry": {
      "schema": "xtend.fabric.telemetry-snapshot.v1",
      "fiberCount": 6
    },
    "hostAdapter": {
      "schema": "xtend.component.lifecycle-telemetry.v1",
      "source": "xtend.component-adapter",
      "operation": "hydrate"
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
  }
}
```

## Aktueller Stand am 2026-05-20

Die erste Compiler- und DX-Schiene fuer vNext-Primitives ist release-gated:

- `RMT-VNEXT-PRIM-01` bis `RMT-VNEXT-PRIM-04` sind abgeschlossen. Grammar,
  Parser/AST, Semantic Graph und Lowering erzeugen deterministische Core-,
  App-Platform- und Kernel-Records aus vNext-Source.
- `RMT-VNEXT-PRIM-06` besitzt eine deterministische Source-to-Sea-Scheibe.
  `createRmtVNextSourceToSeaEvidence(...)` korreliert vNext-Source-Maps,
  Kernel-Schedules, ableitbare Fabric-Fiber, UI-Marker und Browser-Probe.
- `RMT-VNEXT-PRIM-06` besitzt ausserdem einen Browser-Execution-Pfad.
  `runRmtVNextSourceToSeaBrowserExecution(...)` kann dieselbe Fixture per
  WebDriver, Firefox/Geckodriver, ChromeDriver oder Safari-Driver oeffnen,
  `window.__xtendRmtVNextSourceToSeaResult` auslesen und das echte Browser-
  Ergebnis gegen Compiler-, Kernel- und Fabric-Evidence vergleichen. Ohne
  lokale Browser-Umgebung bleibt der Standardlauf als Fixture-Contract
  deterministisch.
- `RMT-VNEXT-PRIM-06` schreibt die Source-to-Sea-Evidence nun als Release-
  Artefakt. `node scripts/capture_rmt_vnext_source_to_sea_evidence.js`
  erzeugt `.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json`;
  `npm run test:rmt-vnext-source-to-sea:browser-required` schaltet denselben
  Pfad fuer lokale/CI-Headless-Profile verpflichtend.
- Fuer lokale Headless-Profile kann der gleiche Pfad jetzt auch automatisch
  Firefox ueber Geckodriver starten:
  `npm run test:rmt-vnext-source-to-sea:firefox`.
- `RMT-VNEXT-PRIM-06` ist in GitHub Actions jetzt fuer Browser-Execution
  verpflichtend. Der Job `rmt-vnext-primitive-gates` nutzt
  `npm run test:rmt-vnext-source-to-sea:chromedriver` und uploaded danach das
  gleiche Source-to-Sea-Evidence-Artefakt.
- ChromeDriver-Auto-Cleanup ist fuer lokale Snap-/Chromium-Installationen
  robust. Der automatisch gestartete ChromeDriver wird zuerst ueber den
  WebDriver-Endpunkt `/shutdown` beendet; `process.kill()` bleibt nur Fallback.
  Damit laeuft `npm run test:rmt-vnext-source-to-sea:chromedriver` lokal mit
  Required-Browser-Policy durch und artefaktiert `driver: "chromedriver"`,
  `objectCount: 4`, ein Cross-Primitive-Event, zwei Route-Switches und zwei
  Route-Lifecycle-Cycles.
- `RMT-VNEXT-PRIM-06` besitzt nun eine Multi-Object-Scheibe. Die Fixture
  korreliert `demo.feedback.status` und `demo.feedback.toast` als zwei
  gleichzeitige sichtbare Primitives ueber vNext-Source, Kernel-Schedules,
  Fabric-Fibers, UI-Marker und Browser-Probe.
- Die Multi-Object-Scheibe deckt jetzt getrennte Lanes und ein
  Cross-Primitive-Event ab: `demo.feedback.status` laeuft sichtbar,
  `demo.feedback.toast` laeuft auf `idle`, und `demo.feedback.save` reduziert
  den Toast-State und emittiert `demo.feedback.toast.promoted`.
- Die Cross-Primitive-Matrix deckt nun auch einen mehrstufigen Cross-Route-
  Event ab: Nach dem Route-Mount fuehrt `demo.feedback.detail.ack ->
  demo.feedback.audit` ueber `demo.feedback.audit.escalated` und
  `state.demo.feedback.audit.text` von einem `transition`-Target zum naechsten.
  Das Browser-Result muss zwei Cross-Primitive-Events ausweisen und fuer den
  zweiten Eintrag `stage: "route-target"`, `sourceLane: "transition"` und
  `targetLane: "transition"` melden.
- Die Browser-Matrix fuehrt zusaetzlich einen Route-Switch als PRIM-06-
  Evidence: `demo.feedback.save` wechselt von `/rmt-vnext-source-to-sea` nach
  `/rmt-vnext-source-to-sea/toast`, nutzt `ui.user-blocking.input` fuer
  Navigation, `route.transition.render` fuer Rendering und schreibt diese
  Route-Telemetrie in den Browser-Required-Result.
- Der Route-Switch besitzt jetzt ein echtes Route-Target-Objekt:
  `demo.feedback.detail` wird in vNext als eigenes Surface mit
  `transition`-Lane authoriert, bleibt in der Browser-Fixture initial
  ungemountet und wird erst nach dem Route-Wechsel sichtbar. Die Matrix
  korreliert Source, Kernel-Schedule, Fabric-Fiber, Route-Render-Schedule,
  UI-Marker und Browser-Viewport.
- Der Route-Target-Slice besitzt jetzt auch Remount-/Unmount-Evidence:
  `demo.feedback.detail` wird nach dem ersten Mount wieder ungemountet,
  `demo.feedback.detailTimer` wird ueber `dispose on surface.destroy` als
  Resource-Cleanup nachgewiesen, und das Target wird anschliessend erneut ueber
  `route.transition.render` sichtbar gemountet.
- Der Route-Lifecycle-Slice deckt nun mehrere Targets ab. Zusaetzlich zu
  `demo.feedback.detail` wird `demo.feedback.audit` als zweites vNext-
  authoriertes Route-Target mit eigener `transition`-Lane und
  `demo.feedback.auditTimer` gemountet. Der echte Browser-Required-Lauf muss
  zwei sequenzielle Route-Switches sowie getrennte `unmountCount`-/
  `remountCount`-Paare pro Target mit `countsMatch: true` reporten.
- Die Route-Lifecycle-Matrix deckt jetzt mehrere Cleanup-Resource-Arten pro
  Target ab. `demo.feedback.audit` besitzt neben dem Timer auch
  `demo.feedback.auditSubscription` mit `kind subscription`; die statische
  Object-Matrix und das echte Browser-Result muessen beide Resource IDs,
  `resourceKinds: ["timer", "subscription"]` und `resourceDisposed: true`
  fuer den Audit-Zyklus ausweisen.
- Negative Cleanup-Diagnosen sind im Gate verankert. Die Fixture
  `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-invalid.rmt`
  laesst `demo.feedback.detailTimer` absichtlich ohne
  `dispose on surface.destroy`; die Route-Lifecycle-Matrix muss kontrolliert
  fehlschlagen und
  `rmt.vnext.source_to_sea.cleanup_dispose_policy_missing` melden.
- Owner-Mismatch-Diagnosen sind ebenfalls gatebar. Die Fixture
  `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-owner-invalid.rmt`
  besitzt zwar `dispose on surface.destroy`, bindet
  `demo.feedback.detailTimer` aber absichtlich an
  `surface.demo.feedback.toast`; die Route-Lifecycle-Matrix muss
  `rmt.vnext.source_to_sea.cleanup_owner_mismatch` melden und den falschen
  Owner in der Evidence ausweisen.
- Fehlende Cleanup-Resource-Records sind jetzt ebenfalls gatebar. Die Fixture
  `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-resource-missing.rmt`
  laesst das Route-Target `demo.feedback.audit` bestehen, entfernt aber
  `demo.feedback.auditTimer` vollstaendig aus der vNext-Quelle. Die Matrix muss
  gezielt fuer `demo.feedback.audit` mit
  `rmt.vnext.source_to_sea.cleanup_resource_missing` fehlschlagen, waehrend der
  `demo.feedback.detail`-Lifecycle weiter `passed` bleibt.
- Resource-Kind-Drift ist jetzt ebenfalls gatebar. Die Fixture
  `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-kind-invalid.rmt`
  bindet `demo.feedback.auditSubscription` weiterhin an
  `surface.demo.feedback.audit` und behaelt `dispose on surface.destroy`,
  deklariert sie aber absichtlich als `kind cache`. Die Matrix muss mit
  `rmt.vnext.source_to_sea.cleanup_kind_mismatch` fehlschlagen und zugleich
  `expectedKind: "subscription"` sowie `actualKind: "cache"` ausweisen.
- Der ChromeDriver-Evidence-Report besitzt jetzt eine eigene
  CI-Artefaktvalidierung:
  `xtend.rmt.vnext.source-to-sea-ci-artifact-validation.v1`. Im lokalen
  Browser-Skip-Modus bleibt sie `skipped`; im Required-Browser-Pfad muss sie
  `passed` sein und `objectCount: 4`, zwei Cross-Primitive-Events, zwei
  Route-Switches, zwei Route-Lifecycle-Cycles, `targetMounted`,
  `targetVisible`, `countsMatch` sowie die Audit-Resources
  `demo.feedback.auditTimer` und `demo.feedback.auditSubscription`
  nachweisen.
- `RMT-VNEXT-PRIM-07` besitzt die erste Tooling-Scheibe fuer Completions,
  Hover, Symbols und Docs, damit vNext der Default-Autorenpfad bleibt.
- `RMT-VNEXT-PRIM-07` besitzt nun auch cursor-nahe Primitive-Completions:
  `getRmtVNextToolingCompletions(...)` und der Language Server koennen
  State-Klauseln, Resource-Kinds und Action-Teilwoerter aus Position,
  Source-Map-Pointer und aktueller Zeile ableiten, ohne dass Editoren
  explizit `xtend.context` setzen muessen.
- `RMT-VNEXT-PRIM-07` besitzt die erste Quick-Fix-Scheibe:
  `getRmtVNextToolingCodeActions(...)` und `textDocument/codeAction` erzeugen
  sichere Workspace-Edits fuer `owner-missing`, `unkeyed-repeat` und
  `payload-contract-missing`, sodass vNext-Autoren Primitive-Fehler direkt im
  Editor reparieren koennen.
- `RMT-VNEXT-PRIM-07` besitzt nun eine zweite Quick-Fix-Scheibe:
  `initial-missing`, `resource-kind-missing` sowie `unknown-reference` fuer
  Selector- und Portal-Referenzen bekommen source-erhaltende Reparaturen. Damit
  fuehrt die vNext-DX Autoren von typischen Tipp-/Geruestluecken direkt zur
  gueltigen Primitive-Struktur.
- `RMT-VNEXT-PRIM-07` besitzt die Action-Authoring-Scheibe:
  `action-reducer-missing` und `effect-source-missing` erzeugen sichere
  Textedits fuer Reducer-Ziele und `effect fetch datasource`-Quellen.
  `kernel-boundary` bleibt bewusst ein Command-Handoff ohne Textedit, damit
  Kernel-/Fabric-Imports in Host-Adapter ausgelagert werden.
- `RMT-VNEXT-PRIM-07` besitzt die Preview-/Fix-All-Scheibe:
  jede Primitive-Code-Action traegt eine
  `xtend.rmt.vnext.primitive-code-action-preview.v1` Preview, und
  `source.fixAll.rmt.vnext.primitives` buendelt alle sicheren Textedit-
  Reparaturen eines Dokuments. Manuelle Boundary-Commands bleiben aus der
  Sammelanwendung ausgeschlossen.
- `RMT-VNEXT-PRIM-07` besitzt nun auch den Command-Handoff fuer manuelle
  Boundary-Faelle: der Language Server meldet
  `xtend.rmt.vnext.extractKernelImport` als `workspace/executeCommand` und
  liefert `xtend.rmt.vnext.primitive-command-handoff.v1` ohne WorkspaceEdit
  zurueck. Damit kann ein Editor Kernel-/Fabric-Importverletzungen sichtbar in
  einen Host-Adapter-Pfad ueberfuehren, ohne vNext-Source automatisch
  framework-spezifisch umzuschreiben.
- `RMT-VNEXT-PRIM-07` besitzt jetzt die erste VS-Code-Bridge-Apply-
  Experience: `tools/rmt-editor/vscode/extension.js` klassifiziert
  vNext-Primitive-CodeActions in `workspace-edit`, `fix-all` und
  `manual-command`, exponiert vier VS-Code-Commands und rendert
  `xtend.rmt.editor.vscode-primitive-authoring-experience.v1` im Output
  Channel. Damit ist die DX nicht nur protokolliert, sondern im Editor
  sichtbar.
- `RMT-VNEXT-PRIM-07` ist abgeschlossen. Die VS-Code-Bridge liest nun ohne
  uebergebenen Report das aktive `.rmt`-Dokument, fragt den lokalen RMT
  Language Server in-process per `textDocument/codeAction` ab, bietet
  QuickPick-Pfade fuer Preview/Fix-All/Handoff und wendet nur sichere
  WorkspaceEdits an. `kernel-boundary` bleibt ein sichtbarer manueller
  Handoff ohne `WorkspaceEdit`.
- `RMT-VNEXT-PRIM-08` besitzt die erste Migration-Scheibe:
  App-Platform-Primitive-JSON wird als Legacy-Target erkannt, gespiegelt und
  mit vNext-Migrationsdiagnosen versehen.
- `RMT-VNEXT-PRIM-08` ist abgeschlossen. Der neue
  `xtend.rmt.vnext.primitive-migration-apply-plan.v1` Apply-Plan erzeugt aus
  App-Platform-Primitive-JSON denselben vNext-Draft wie die Preview, weist
  einen `.vnext.rmt`-Zielpfad aus, prueft den Draft gegen den vNext-Compiler
  und setzt `automaticWrite: false`. Die Compatibility-Reports unterscheiden
  nun `report-only`, `preview-ready`, `apply-plan-ready` und `blocked`;
  Legacy bleibt Mirror/Compiler-Target, nicht Authoring-Pfad.
- `RMT-VNEXT-PRIM-05` ist abgeschlossen. Das neue standalone Gate
  `rmt-vnext-fabric-bridge` prueft die Fabric/RMT-Lane-Aufloesung, die
  primaere Fabric-Runtime-Fiber, die Lane-Matrix, Host-Adapter-Telemetrie,
  Route-/Component-Fiber, Telemetry-Snapshot und Browser-Marker als eigenen
  PRIM-05-Contract.
- Die Release-Matrix enthaelt nun das Primitive-Aggregat
  `npm run test:rmt-vnext-primitives:report`; der Report wird unter
  `.xtend-test-results/xtend-rmt-vnext-primitives-gate-report.json`
  geschrieben.
- GitHub Actions fuehren die Primitive-Gates im Job
  `rmt-vnext-primitive-gates` aus. Das Gate umfasst Parser, Compiler,
  Semantic Graph, Source-to-Sea, Tooling, Compatibility und Type-Exports und
  laedt die Source-to-Sea-Evidence als eigenes Artefakt hoch.
- Der Source-to-Sea-Evidence-Report enthaelt jetzt ein maschinenlesbares
  CI-Artefakt-Gate. `createRmtVNextSourceToSeaCiArtifactValidation(...)`
  vergleicht den geschriebenen ChromeDriver-Report gegen die erwartete PRIM-06-
  Matrix und schlaegt bei Objekt-, Route-, Lifecycle- oder Resource-Drift fehl.
- Der CI-Artefakt-Pfad ist nun replaybar:
  `test:rmt-vnext-source-to-sea:validate-artifact` ruft
  `validateRmtVNextSourceToSeaCiArtifactFile(...)` auf, validiert ein bereits
  geschriebenes ChromeDriver-Release-Artefakt ohne neuen Browser-Lauf und
  faellt fuer fehlende, nicht parsebare oder gedriftete Artefakte geschlossen
  durch.
- Cross-Route-Drift ist nun als negativer Runtime-Slice gatebar. Die Browser-
  Probe `tests/browser/fixtures/rmt-vnext-source-to-sea-cross-route-invalid.html`
  verdrahtet `demo.feedback.detail.ack` absichtlich auf das falsche
  Ziel-Primitive und muss ueber
  `cross event route-target state belongs to target primitive`,
  `cross event route-target event belongs to target primitive` sowie
  `cross event route-target stage uses transition lanes` fehlschlagen.
- Browser-Result-Drift ist nun ebenfalls ohne neuen Browserstart pruefbar.
  `xtend.rmt.vnext.source-to-sea-browser-result-validation.v1` und
  `createRmtVNextSourceToSeaBrowserResultValidation(...)` validieren die
  ChromeDriver-Resultstruktur direkt; Route-Switch-Drift muss ueber
  `browser execution route switches pass` und Lifecycle-Zaehler-Drift ueber
  `browser execution route lifecycle cycles pass` fehlschlagen.
  Cross-Primitive-Event-Drift und Viewport-/Objektstatus-Drift muessen
  entsprechend ueber `browser execution cross-primitive events pass` und
  `browser execution object matrix passes` fehlschlagen.
- Der Release-Handoff zieht `npm run test:rmt-semantic-graph`,
  `npm run test:rmt-vnext-source-to-sea`,
  `npm run test:rmt-vnext-source-to-sea:evidence` und
  `npm run test:rmt-vnext-primitives:report` als verpflichtende Gates nach.
- Der vollstaendige Release-Report wurde lokal erneut erfolgreich gefahren.
  Lokale Browser-/Loopback-Skips bleiben akzeptierte Umgebungsresiduen; die
  Primitive-, PR-, Pack- und Release-Reports sind konsistent.

`RMT-VNEXT-PRIM-06`, `RMT-VNEXT-PRIM-07` und `RMT-VNEXT-PRIM-08` sind lokal
abgeschlossen. Paket 6 deckt Source -> Kernel -> Fabric -> UI -> Browser,
ChromeDriver-Required-Evidence, CI-Artefakt-Replay und negative Drift-Faelle
fuer Cross-Route, Route-Switch, Lifecycle, Cross-Primitive-Events und
Viewport-/Objektstatus ab. Paket 7 macht diese Primitive-Diagnosen im Editor
aktiv anwendbar. Paket 8 liefert den deterministischen Legacy-Backgrounding-
und Migration-Apply-Plan. Der echte GitHub-Actions-Artefaktabgleich bleibt ein
Release-Handoff-Schritt fuer den Release-Branch, nicht mehr ein lokaler
Implementierungsblock der Pakete.

## Workpackages

| ID | Prioritaet | Status | Titel | Akzeptanz |
|----|------------|--------|-------|-----------|
| `RMT-VNEXT-PRIM-01` | P0 | completed | vNext Primitive Grammar Design | Syntax deckt State, Selectors, Actions, Events, Data, Surfaces, Overlays, Portals und Resources ab, ohne auf JSON-Authoring auszuweichen. |
| `RMT-VNEXT-PRIM-02` | P0 | completed | Parser- und AST-Upgrade | Parser erzeugt typisierte AST-Nodes mit stabilen Source Ranges fuer jedes Primitive. |
| `RMT-VNEXT-PRIM-03` | P0 | completed | Semantic Graph und Diagnostics | Cross-Reference-, Ownership-, Event-Payload- und Trust-Boundary-Diagnosen laufen vor der Runtime. |
| `RMT-VNEXT-PRIM-04` | P0 | completed | Compiler-Lowering in Kernel Records | vNext-Primitives werden in deterministische Core-/App-Artefakte abgesenkt, die der RMT-Kernel ingestieren kann. |
| `RMT-VNEXT-PRIM-05` | P0 | completed | Fabric Lane/Fiber Bridge Evidence | vNext-authorierte Lanes und Fibers sind in Fabric-Telemetrie sichtbar, ohne Fabric in den Kernel zu importieren. |
| `RMT-VNEXT-PRIM-06` | P0 | completed | Source-to-Sea Browser Gate | Ein Headless-Browser-Test beweist Source -> Kernel -> Fabric -> UI -> Viewport fuer sichtbare Objekt-, Route-, Event- und Lifecycle-Pfade. |
| `RMT-VNEXT-PRIM-07` | P1 | completed | Language Server und Authoring Docs | Completions, Hover, Symbols, CodeActions, Safe-Fix-All und VS-Code-Bridge lehren vNext-Primitive-Syntax als primaere Developer Experience. |
| `RMT-VNEXT-PRIM-08` | P1 | completed | Migration und Legacy-Backgrounding | Bestehende App-Platform-JSON-Fixtures koennen per Preview/Apply-Plan nach vNext konvertiert oder gespiegelt werden; Legacy bleibt Target, nicht Workflow. |

## Akzeptanzkriterien

- App-Autoren koennen eine granulare App Shell nur in RMT vNext deklarieren.
- Der Compiler erzeugt App-Platform-Primitive-Reports aus vNext-Source.
- RMT Legacy oder JSON-Primitive-Dateien sind fuer normales Authoring nicht
  erforderlich.
- Kernel-, Fabric- und UI-Evidence lassen sich ueber Primitive ID und Source
  Pointer korrelieren.
- Fabric-Lane-/Fiber-Evidence wird aus vNext-Source-Maps,
  `kernelRecords.schedules`, `kernelRecords.fibers`, Fabric Runtime Telemetry
  und Browser-Markern rekonstruiert.
- Das Source-to-Sea-Gate ist Teil der RMT-Release-Gate-Matrix.
- Das Primitive-Aggregat laeuft in GitHub Actions und im lokalen Release-
  Report als eigenstaendiges Gate.
- Docs und Language Tooling praesentieren vNext als Default-Pfad und Legacy als
  Kompatibilitaetsziel.

## Gestartete Arbeit

- `RMT-VNEXT-PRIM-01` ist abgeschlossen.
- Syntax-Contract: [RMT vNext Primitive Grammar Design](./rmt-vnext-primitive-grammar-design.md)
- Design-Fixture: `tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt`
- `RMT-VNEXT-PRIM-02` ist abgeschlossen.
- Parser-/AST-Handoff: [RMT vNext Primitive Parser AST](./rmt-vnext-primitive-parser-ast.md)
- `RMT-VNEXT-PRIM-03` ist abgeschlossen.
- Semantic-Graph-Handoff: [RMT vNext Primitive Semantic Graph](./rmt-vnext-primitive-semantic-graph.md)
- Neue API: `buildRmtVNextPrimitiveSemanticGraph(...)` in
  `tools/rmt-language/semantic-graph.js`
- `RMT-VNEXT-PRIM-04` ist abgeschlossen.
- Lowering-Handoff: [RMT vNext Primitive Lowering](./rmt-vnext-primitive-lowering.md)
- Compiler-API: `compileRmtVNextSource(...)` nutzt den PRIM-03 Graph als
  Pre-Lowering-Gate und erzeugt `appPlatform` sowie `kernelRecords`.
- `RMT-VNEXT-PRIM-05` ist abgeschlossen.
- Fabric-Bridge-Handoff: [RMT vNext Fabric Bridge Evidence](./rmt-vnext-fabric-bridge-evidence.md)
- Fabric-Bridge-Evidence:
  `createRmtVNextFabricBridgeEvidence(...)` erzeugt aus PRIM-04
  Kernel-Schedules und Fibers eine echte `xtend.fabric.fiber.v1`, loest sie
  ueber `xtend.fabric.rmt-lane-mapping.v1` auf und korreliert sie mit einem
  `xtend.fabric.telemetry-snapshot.v1`.
- Browser-Marker:
  `tests/browser/fixtures/rmt-vnext-source-to-sea-smoke.html` traegt
  `data-xtend-fabric-lane`, `data-xtend-fabric-fiber` und
  `data-xtend-fabric-schedule`, damit die Fabric-Bruecke bis in den Viewport
  sichtbar bleibt.
- Lane-Matrix:
  `RMT_VNEXT_FABRIC_BRIDGE_LANE_MATRIX` haertet die Bridge fuer
  `user-blocking`, `transition`, `idle`, `background` und `diagnostics`.
  Jede Lane erzeugt eine abgeschlossene `xtend.fabric.fiber.v1`, eine
  `xtend.fabric.rmt-lane-mapping.v1`-Entscheidung und einen
  `xtend.fabric.telemetry-snapshot.v1`-Schedule-Eintrag.
- Host-/Adapter-Telemetrie:
  Die Source-to-Sea-Bridge liest `xtend.component.lifecycle-telemetry.v1` aus
  der Browser-Probe, normalisiert sie ueber `fabric.recordComponentTelemetry(...)`
  und weist sie im Fabric-Telemetry-Snapshot nach. Damit ist die XTend UI Host-
  Adapter-Ebene nicht mehr nur statischer DOM-Marker, sondern Teil der
  PRIM-05-Evidence.
- Route-/Component-Fiber:
  Die Bridge nutzt nun `createComponentFiberInstrumentation(...)` fuer
  `component.mount` und `component.hydrate` sowie
  `createRouteFiberInstrumentation(...)` fuer `route.navigate` und
  `route.render`. Die Evidence prueft die Schedule Refs
  `component.visible.mount`, `component.idle.hydrate`,
  `ui.user-blocking.input` und `route.transition.render` bis in den Fabric-
  Telemetry-Snapshot.
- Standalone Gate:
  `tests/rmt-language/rmt_vnext_fabric_bridge_suite.js` validiert PRIM-05 als
  eigenes Release-Gate. `npm run test:rmt-vnext-primitives:report` enthaelt
  jetzt `rmt-vnext-fabric-bridge` vor dem Source-to-Sea-Gate.
- `RMT-VNEXT-PRIM-06` hat eine erste release-gated Scheibe.
- Source-to-Sea-Handoff: [RMT vNext Source-to-Sea Gate](./rmt-vnext-source-to-sea-gate.md)
- Evidence-API: `createRmtVNextSourceToSeaEvidence(...)` korreliert vNext-
  Source-Maps, PRIM-04 Kernel-Records, Fabric-Fiber-Ableitung, UI-Marker und
  Browser-Fixture-Probe.
- Browser-Execution-Evidence:
  `runRmtVNextSourceToSeaBrowserExecution(...)` liest optional per WebDriver
  den Result-Key `window.__xtendRmtVNextSourceToSeaResult` aus der echten
  Browser-Fixture und vergleicht Primitive ID, Kernel Schedule, Fabric Fiber,
  Fabric Schedule, Host-Adapter-Telemetrie und Action Event mit der
  Source-to-Sea-Evidence. Ohne `RMT_VNEXT_SOURCE_TO_SEA_BROWSER_DRIVER` wird
  dieser Schritt als lokaler Umgebungs-Skip dokumentiert, nicht als
  Release-Blocker.
- Evidence-Report:
  `createRmtVNextSourceToSeaEvidenceReport(...)` und
  `writeRmtVNextSourceToSeaEvidenceReport(...)` kapseln Lifecycle- und Browser-
  Execution-Evidence in
  `xtend.rmt.vnext.source-to-sea-evidence-report.v1`.
- Release-Artefakt:
  `.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json` wird ueber
  `npm run test:rmt-vnext-source-to-sea:evidence` erzeugt. In GitHub Actions
  wird der gleiche Report ueber
  `npm run test:rmt-vnext-source-to-sea:chromedriver` mit Required-Browser-
  Policy geschrieben und im Job `rmt-vnext-primitive-gates` als
  `xtend-rmt-vnext-source-to-sea-evidence-node-26` hochgeladen.
- ChromeDriver-Auto-Cleanup:
  `runWebDriverBrowserProbe(...)` beendet automatisch gestartete ChromeDriver
  nun zuerst ueber `/shutdown` und nutzt Prozess-Signale nur als Fallback. Das
  behebt Snap/AppArmor-Umgebungen, in denen ein direkter `kill()` mit `EACCES`
  fehlschlaegt und zuvor ein erfolgreiches Browser-Result ueberschrieben hat.
  Der lokale Required-Browser-Lauf
  `npm run test:rmt-vnext-source-to-sea:chromedriver` ist jetzt `passed`.
- Object-Matrix:
  `createRmtVNextSourceToSeaObjectMatrix(...)` erzeugt
  `xtend.rmt.vnext.source-to-sea-object-matrix.v1` und beweist vier sichtbare
  Primitive-Lifecycles: `demo.feedback.status`, `demo.feedback.toast`,
  `demo.feedback.detail` und `demo.feedback.audit`. Die Matrix prueft
  getrennte `visible`-/`idle`-/`transition`-Lanes und das Cross-Primitive-
  Event `demo.feedback.status -> demo.feedback.toast`.
- Cross-Route-Event-Matrix:
  Dieselbe Matrix beweist jetzt ein zweites, route-gebundenes
  Cross-Primitive-Event. `demo.feedback.detail.ack -> demo.feedback.audit`
  reduziert `state.demo.feedback.audit.text`, emittiert
  `demo.feedback.audit.escalated` und muss als `stage: "route-target"` mit
  `sourceLane: "transition"` und `targetLane: "transition"` sowohl statisch als
  auch im echten Browser-Result sichtbar sein.
- Route-Switch-Matrix:
  Dieselbe Object-Matrix validiert nun zwei sequenzielle Browser-Route-Wechsel:
  `/rmt-vnext-source-to-sea -> /rmt-vnext-source-to-sea/toast` fuer
  `demo.feedback.detail` und
  `/rmt-vnext-source-to-sea/toast -> /rmt-vnext-source-to-sea/audit` fuer
  `demo.feedback.audit`. Beide nutzen `ui.user-blocking.input`,
  `route.transition.render` und die `transition`-Lane. Der echte Browser-
  Execution-Pfad muss zwei `routeSwitches` mit `status: "passed"`,
  `targetMounted: true` und `targetVisible: true` liefern.
- Route-Lifecycle-Matrix:
  `routeLifecycleCycles` validiert fuer `demo.feedback.detail` und
  `demo.feedback.audit` getrennte wiederholte Route-Zyklen. Die Targets werden
  ungemountet, die Resource-Records `demo.feedback.detailTimer` und
  `demo.feedback.auditTimer` werden gegen `dispose on surface.destroy`
  validiert, und beide Targets werden danach remountet. Der echte Browser-
  Execution-Pfad muss `unmounted`, `remounted`, `resourceDisposed` und
  `countsMatch` als `true` sowie `unmountCount: 1` und `remountCount: 1` pro
  Target reporten.
- Multi-Resource-Cleanup:
  Der Audit-Zyklus traegt jetzt mehrere Cleanup-Records. Neben
  `demo.feedback.auditTimer` muss auch
  `demo.feedback.auditSubscription` als `kind subscription`, Owner
  `surface.demo.feedback.audit` und `dispose on surface.destroy` durch vNext-
  Lowering, Object-Matrix und Browser-Execution nachweisbar sein. Alte
  `resourceId`-Zyklen bleiben kompatibel; neue Zyklen koennen `resources`
  mit mehreren Resource-IDs und erwarteten Kinds angeben.
- Negative Cleanup-Kind-Fixture:
  `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-kind-invalid.rmt`
  beweist, dass Multi-Resource-Cleanup nicht nur Existenz, Owner und Dispose-
  Policy prueft, sondern auch die erwartete Resource-Art. Die Matrix erzeugt
  `rmt.vnext.source_to_sea.cleanup_kind_mismatch` fuer
  `demo.feedback.auditSubscription`, haelt `expectedKind: "subscription"` fest
  und weist `actualKind: "cache"` aus.
- Negative Cleanup-Fixture:
  `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-invalid.rmt`
  beweist, dass derselbe Lifecycle-Cycle ohne Dispose-Policy nicht als
  gueltige Evidence akzeptiert wird. Die Matrix erzeugt den Diagnosecode
  `rmt.vnext.source_to_sea.cleanup_dispose_policy_missing` und haelt die
  fehlende Policy mit `dispose: null` fest.
- Negative Cleanup-Owner-Fixture:
  `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-owner-invalid.rmt`
  beweist, dass ein Cleanup-Resource-Record mit vorhandener Dispose-Policy
  trotzdem ungueltig ist, wenn der Owner nicht zum Route-Target passt. Die
  Matrix erzeugt `rmt.vnext.source_to_sea.cleanup_owner_mismatch` und weist
  `surface.demo.feedback.toast` als falschen Owner aus.
- Negative Cleanup-Resource-Fixture:
  `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-resource-missing.rmt`
  beweist, dass ein Route-Lifecycle-Cycle ohne emittierten Resource-Record
  ungueltig ist. `demo.feedback.audit` bleibt als Route-Target authoriert, aber
  `demo.feedback.auditTimer` fehlt vollstaendig; die Matrix erzeugt
  `rmt.vnext.source_to_sea.cleanup_resource_missing`, haelt `resource: null`
  fest und zeigt zugleich, dass der `demo.feedback.detail`-Cycle weiterhin
  `passed` ist.
- Positive Source-to-Sea-Fixture:
  `tests/rmt-language/fixtures/vnext-source-to-sea.rmt`
- Browser-Smoke-Fixture:
  `tests/browser/fixtures/rmt-vnext-source-to-sea-smoke.html`
- `RMT-VNEXT-PRIM-07` hat eine erste release-gated Tooling-Scheibe.
- Authoring-Tooling-Handoff:
  [RMT vNext Primitive Authoring Tooling](./rmt-vnext-primitive-authoring-tooling.md)
- Tooling-API: `getRmtVNextToolingCompletions(...)`,
  `getRmtVNextToolingHover(...)` und
  `getRmtVNextToolingDocumentSymbols(...)` indexieren Primitive-Domains aus
  PRIM-04 und praesentieren vNext als Default-Autorenpfad.
- Code-Action-Preview:
  `getRmtVNextToolingCodeActions(...)` liefert fuer jede Primitive-Reparatur
  eine `xtend.rmt.vnext.primitive-code-action-preview.v1` Preview sowie
  `source.fixAll.rmt.vnext.primitives` fuer alle sicheren Textedits.
- Command-Handoff:
  `workspace/executeCommand` fuer `xtend.rmt.vnext.extractKernelImport`
  liefert `xtend.rmt.vnext.primitive-command-handoff.v1`, bleibt ohne
  WorkspaceEdit und benennt den Host-Adapter-Pfad fuer manuelle
  Kernel-/Fabric-Boundary-Reparaturen.
- Aktive VS-Code-Bridge:
  `createActiveDocumentPrimitiveAuthoringExperience(...)` liest das aktive
  `.rmt`-Dokument, nutzt den lokalen Language Server in-process und baut aus
  echten LSP-CodeActions die
  `xtend.rmt.editor.vscode-primitive-authoring-experience.v1`. Sichere
  WorkspaceEdits laufen ueber `applyPrimitiveAuthoringWorkspaceEdit(...)`;
  `xtendRmt.rmtVNext.applySafePrimitiveFixAll` wendet nur
  `source.fixAll.rmt.vnext.primitives` an.
- `RMT-VNEXT-PRIM-08` ist abgeschlossen.
- Migration-Handoff:
  [RMT vNext Primitive Migration](./rmt-vnext-primitive-migration.md)
- Migration-API:
  `createAppPlatformPrimitiveMigrationPreview(...)` erzeugt den vNext-Draft
  aus App-Platform-Primitive-JSON; `createAppPlatformPrimitiveMigrationApplyPlan(...)`
  kapselt denselben Draft in
  `xtend.rmt.vnext.primitive-migration-apply-plan.v1`, setzt
  `automaticWrite: false`, liefert den Zielpfad-Hinweis und blockiert bei
  Parse-/Compile-Fehlern.
- VS-Code-Bridge-Apply-Experience:
  `createPrimitiveAuthoringApplyExperience(...)` erzeugt
  `xtend.rmt.editor.vscode-primitive-authoring-experience.v1` und die Commands
  `XTendRMT: Show vNext Primitive Apply Experience`,
  `XTendRMT: Show vNext Primitive Code Action Preview` und
  `XTendRMT: Show vNext Primitive Command Handoff` machen Quick-Fix, Fix-All
  und Handoff im Output Channel unterscheidbar.
- Neues Snippet: `rmt-vnext-primitive-shell`
- Positive Fixture: `tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt`
- Negative Fixture:
  `tests/rmt-language/fixtures/vnext-primitives-semantic-invalid.rmt`
- `RMT-VNEXT-PRIM-08` hat eine erste release-gated Migration-Scheibe.
- Primitive-Migration-Handoff:
  [RMT vNext Primitive Migration](./rmt-vnext-primitive-migration.md)
- Migrations-API:
  `createAppPlatformPrimitiveMigrationPreview(...)` erkennt App-Platform-
  Primitive-JSON, erzeugt einen kompilierbaren vNext-Draft und markiert Legacy
  als `compiler-target`.
- Positive App-Platform-Fixture: `tests/fixtures/rmt-app-platform-tooling.rmt`
- Compatibility-Diagnosen:
  `rmt.vnext.primitive_migration.preview_available` fuer report-only Mode und
  `rmt.vnext.primitive_migration.legacy_backgrounded` fuer den Preview-Pfad.
- Der vNext-Parser erzeugt initiale Primitive-Nodes fuer die Design-Fixture:
  `RmtStateDeclaration`, `RmtSelectorDeclaration`,
  `RmtDataSourceDeclaration`, `RmtActionDeclaration`,
  `RmtPortalDeclaration`, `RmtOverlayDeclaration`,
  `RmtResourceDeclaration`, erweiterte `RmtSurfaceDeclaration` und
  Event-Payload-Nodes.
- Release-Gates nachgezogen:
  `.github/workflows/xtend-default-gates.yml`, `package.json`,
  `scripts/run_xtend_tests.js`, `tools/rmt-language/vnext-release.js`,
  `tests/references/reference_path_suite.js` und
  [RMT vNext Release Handoff](./rmt-vnext-release-handoff.md).

## Naechster Implementierungsschritt

`RMT-VNEXT-PRIM-06` ist abgeschlossen. `RMT-VNEXT-PRIM-05` ist als eigenes
Fabric-Bridge-Paket abgeschlossen: vNext-Source, Kernel-Schedule, Kernel-Fiber,
Fabric-Mapping, Fabric-Runtime-Fiber, Telemetry-Snapshot, Route-/Component-
Fiber und Browser-Marker sind ueber dieselbe Primitive ID korreliert. Der
Browser-Pfad kann lokal optional laufen, ist in CI ueber ChromeDriver
verpflichtend und deckt mehrere sichtbare UI-Objekte sowie negative
Runtime-Drifts ab.

Der naechste Patch sollte:

- Als Release-Handoff die naechste GitHub-Actions-Ausfuehrung gegen
  `ciArtifactValidation.status: "passed"` abgleichen und das hochgeladene
  Artefakt mit `npm run test:rmt-vnext-source-to-sea:validate-artifact` als
  Release-Handoff-Beleg referenzieren.
- Die Implementierung wieder bei `RMT-VNEXT-PRIM-07` oder
  `RMT-VNEXT-PRIM-08` aufnehmen.
- Fuer `RMT-VNEXT-PRIM-07` als naechsten DX-Schritt die VS-Code-Bridge von der
  Output-Channel-Erfahrung zur produktiven aktiven-Dokument-Integration
  ausbauen: echte LSP-CodeActions anfordern, Preview-Auswahl anbieten,
  sichere WorkspaceEdits anwenden und Handoff-Follow-ups sichtbar fuehren.
  Danach pruefen, ob PRIM-07 auf `completed` gesetzt werden kann.
- PRIM-05 nur noch erweitern, wenn neue Fabric-Lanes oder produktive Fiber-
  Instrumentations hinzukommen; die aktuelle Lane/Fiber-Bridge ist gatebar.
- Danach mindestens `npm run test:rmt-vnext-primitives:report`,
  `npm run test:rmt-vnext-source-to-sea:chromedriver` in einer Umgebung mit
  ChromeDriver,
  `npm run test:rmt-vnext-source-to-sea:validate-artifact`,
  `node scripts/run_xtend_tests.js rmt-vnext-source-to-sea --json`,
  `node scripts/run_xtend_tests.js references --json` und vor Release erneut
  `npm run test:release:full:report` fahren.

## Verwandte Dokumente

- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Primitive Grammar Design](./rmt-vnext-primitive-grammar-design.md)
- [RMT vNext Primitive Parser AST](./rmt-vnext-primitive-parser-ast.md)
- [RMT vNext Primitive Semantic Graph](./rmt-vnext-primitive-semantic-graph.md)
- [RMT vNext Primitive Lowering](./rmt-vnext-primitive-lowering.md)
- [RMT vNext Fabric Bridge Evidence](./rmt-vnext-fabric-bridge-evidence.md)
- [RMT vNext Source-to-Sea Gate](./rmt-vnext-source-to-sea-gate.md)
- [RMT vNext Primitive Authoring Tooling](./rmt-vnext-primitive-authoring-tooling.md)
- [RMT vNext Primitive Migration](./rmt-vnext-primitive-migration.md)
- [RMT vNext Release Handoff](./rmt-vnext-release-handoff.md)
- [RMT App Platform Tooling](./rmt-app-platform-tooling.md)
- [RMT App Platform Migration Guide](./rmt-app-platform-migration-guide.md)
- [RMT DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md)
- [RMT State Selector Runtime](./rmt-state-selector-runtime.md)
- [RMT Action Effect Runtime](./rmt-action-effect-runtime.md)
- [RMT Event Routing Runtime](./rmt-event-routing-runtime.md)
- [RMT Surface Resource Graph Runtime](./rmt-surface-resource-graph-runtime.md)
- [XTend-Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md)
