# WP-E05-02 - Host Adapter Contract und Adapter Lifecycle definieren

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-01-Epic-04-Handoff-akzeptieren-und-Upstream-Source-of-Truth-festlegen.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-core.d.ts`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E05-02` definiert den generischen Host Adapter Contract fuer RMT. Der Contract beschreibt, wie RMT Host-Arbeit registriert, plant, ausfuehren laesst und diagnostiziert, ohne den Kernel an XTend, XRouter, React, Vue, Vanilla JS oder Custom Hosts zu koppeln.

Das Paket ist der direkte Nachfolger von `WP-E05-01`: upstream RMT Source bleibt Source-of-Truth, `xtendrmt/` wird nur bewusst synchronisiert. Deshalb wird der Contract in diesem Dokument fuehrend beschrieben und in `xtendrmt/rmt.schema.json` sowie `xtendrmt/rmt-core.d.ts` als Artefakt-Referenz gespiegelt.

## Leitentscheidung

Der Host Adapter Contract ist host-neutral.

RMT darf Adapter registrieren, Capabilities verhandeln, Lifecycle-Operationen planen und Diagnostics entgegennehmen. Die Ausfuehrung konkreter Host-Arbeit liegt immer beim Adapter.

Erlaubt im RMT Kernel:

- neutrale Adapter Definitionen
- Capability Requirements und Preferences
- Component-, Route-, State-, Scheduler- und Diagnostics-Operationen als abstrakte Requests
- strukturierte Operation Results und Diagnostics Events

Nicht erlaubt im RMT Kernel:

- XTend Runtime Imports
- XRouter Runtime Imports
- direkte `xstate` Writes
- Annahmen ueber `x-*` Custom Elements
- React-, Vue- oder Custom-Host-Sonderlogik

## Adapter-Klassen

Der Contract unterscheidet Adapter nach Rolle, nicht nach Framework:

| Adapter-Kind | Verantwortung | Beispiele |
|--------------|---------------|-----------|
| `host_adapter` | Host Runtime, Root, State Bridge, Scheduler Endpoint Binding, Diagnostics | `xtend`, `react-host`, `vue-host`, `custom-host` |
| `component_adapter` | Component Registrierung, Mounting, Hydration, Update und Dispose | `xtend.component`, `web-component`, `react.component` |
| `router_adapter` | Route Registrierung, Navigation, Params, Query und Lifecycle Events | `xtend.xrouter`, `react-router`, `vue-router`, `custom-router` |
| `state_adapter` | optionale State Bridge, Snapshot, Subscribe und Dispatch | `xtend.state-bridge.xstate`, `redux`, `custom-state` |
| `scheduler_adapter` | optionale Host-spezifische Scheduler Endpoints | `xtend.scheduler-endpoints`, `browser-idle`, `worker-scheduler` |

## Lifecycle-Phasen

Jede Adapter-Operation wird einer Lifecycle-Phase zugeordnet. Phasen sind fachliche Einordnung und Diagnostics-Anker, keine Framework-Vorschrift.

| Phase | Zweck | Kernel-Sicht |
|-------|-------|--------------|
| `register` | Adapter Definition registrieren | Record pruefen und Registry aktualisieren |
| `negotiate` | Capabilities verhandeln | Requirements gegen Adapterdaten pruefen |
| `prepare` | Ziel, Model, Route oder Component normalisieren | generische Records und Referenzen aufloesen |
| `mount` | Component oder Root sichtbar erzeugen | Operation planen, Adapter ausfuehren lassen |
| `hydrate` | vorhandenes Markup oder Host-Zustand aktivieren | Hydration Request planen |
| `route` | Routes registrieren und Navigation ausloesen | Route Records an Router Adapter geben |
| `state` | State Bridge erzeugen oder anbinden | optionale Host Capability nutzen |
| `schedule` | Host-spezifische Endpoints binden | Policy und Endpoint koppeln |
| `diagnose` | Diagnostics emittieren | strukturierte Events sammeln |
| `dispose` | Ressourcen, Routen oder Components aufraeumen | Adapter dispose ausfuehren lassen |

## Operations-Matrix

Die folgenden Operationen bilden die erste verbindliche Contract-Flaeche. Implementierungen duerfen konkrete Funktionsnamen anpassen, muessen aber dieselbe fachliche Semantik abdecken.

| Operation | Phase | Input | Output | Pflicht fuer |
|-----------|-------|-------|--------|--------------|
| `registerAdapter(definition, options)` | `register` | Adapter Definition mit `id`, `kind`, `version`, `capabilities`, `runtimeSurface` | Operation Result mit Adapter-ID und Status | alle Adapter |
| `negotiateCapabilities(requirements, options)` | `negotiate` | Required/Preferred Capabilities, Host Context | Negotiation Result mit accepted/missing/degraded Capabilities | alle Adapter |
| `registerComponent(definition, options)` | `prepare` | Component Record, Adapter Ref, Props, Slots, Events, Hydration | Component Registry Result | `component_adapter` |
| `mountComponent(target, componentRef, model, options)` | `mount` | Render Target, Component Ref, Model, Schedule Context | Mount Result mit Handle/Diagnostics | `component_adapter` |
| `hydrateComponent(target, componentRef, model, options)` | `hydrate` | Hydration Target, Component Ref, Model, Boundary | Hydration Result mit Handle/Diagnostics | `component_adapter` |
| `registerRoutes(routes, options)` | `route` | normalisierte Route Records, Router Ref, Lifecycle Hooks | Route Registry Result | `router_adapter` |
| `navigate(to, options)` | `route` | Route Target, Params, Query, Metadata, Schedule Context | Navigation Result | `router_adapter` |
| `createStateBridge(options)` | `state` | State Capability Ref, Scope, Read/Write Policy | State Bridge Handle oder degraded Result | `host_adapter`/`state_adapter` |
| `scheduleEndpoint(endpointName, scope, callback, options)` | `schedule` | Endpoint, Scope, Callback, Policy | Scheduled Work Handle | `host_adapter`/`scheduler_adapter` |
| `emitDiagnostic(event, payload)` | `diagnose` | Diagnostic Event und serialisierbares Payload | Diagnostic Result | alle Adapter |
| `disposeAdapter(adapterId, options)` | `dispose` | Adapter ID, Scope, Reason | Dispose Result | alle Adapter |

## Runtime-Surfaces

Der Contract muss in ESM- und Browser-Classic-Oberflaechen gleich beschrieben sein:

| Surface | Erwartung |
|---------|-----------|
| `esm` | Adapter werden als Module exportiert oder registrierbar gemacht |
| `browser_classic` | Adapter koennen ueber die installierte globale RMT Surface registriert werden |
| `worker` | nur scheduler-, template- oder data-nahe Adapter ohne DOM-Pflicht |
| `server` | prerender-, template- oder diagnostics-nahe Adapter ohne Browser-Pflicht |

Ein Adapter muss seine `runtimeSurface` deklarieren. Fehlt eine benoetigte Surface, muss `WP-03` daraus eine Capability-Diagnostic ableiten koennen.

## Result- und Diagnostics-Contract

Jede Operation liefert ein strukturiertes Result:

| Feld | Bedeutung |
|------|-----------|
| `ok` | Operation erfolgreich oder bewusst degraded |
| `status` | `ok`, `degraded`, `skipped`, `failed` oder host-spezifischer Status |
| `adapterId` | ausfuehrender Adapter |
| `operation` | fachliche Operation |
| `phase` | Lifecycle-Phase |
| `handle` | optionaler Host-Handle |
| `diagnostics` | Liste strukturierter Diagnostic Events |
| `metadata` | host-neutrale Zusatzdaten |

Diagnostics muessen mindestens `level`, `code`, `message`, `adapterId`, `operation`, `phase` und `metadata` tragen. XTend-spezifische Details duerfen nur in Adapterdaten oder Diagnostics-Payloads erscheinen, nicht als Kernelpflicht.

## Capability-Vorbereitung fuer WP-03

`WP-02` implementiert noch keine vollstaendige Capability Negotiation. Es legt aber die benoetigten Begriffe fest:

- `requiredCapabilities`: muss vorhanden sein, sonst `failed`
- `preferredCapabilities`: darf fehlen, erzeugt aber `degraded` oder `diagnostics`
- `providedCapabilities`: vom Adapter deklarierte Faehigkeiten
- `runtimeSurface`: `esm`, `browser_classic`, `worker`, `server` oder Custom Surface
- `kernelVisible`: fuer Host-spezifische Adapterdaten standardmaessig `false`

`WP-03` kann darauf Adapter Registry und Capability Negotiation modellieren.

## Synchronisierte Artefakte

Diese WP-02-Entscheidung wird bewusst in Build-Artefakte gespiegelt:

- `xtendrmt/rmt.schema.json` fuehrt `xtend.rmt.host-adapter-lifecycle.v1` als `hostAdapterLifecycleContracts` unter `x-xtendrmt`.
- `xtendrmt/rmt-core.d.ts` deklariert host-neutrale Adapter-, Operation-, Lifecycle-, Result- und Diagnostics-Typen.

Diese Spiegelung aendert nicht die Source-of-Truth-Regel: Die produktive Quelle bleibt upstream RMT Source beziehungsweise dieser Workpackage-Contract, bis `WP-13` Build-Pipeline und Artefakt-Paritaet absichert.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Host Adapter Contract ist host-neutral dokumentiert | erfuellt: Operationen, Phasen und Results enthalten keine XTend- oder XRouter-Pflicht |
| XTend, XRouter und weitere Hosts koennen denselben Contract nutzen | erfuellt: Adapter-Klassen und Runtime-Surfaces sind framework-agnostisch |
| `WP-03` kann Capability Negotiation darauf aufbauen | erfuellt: Required/Preferred/Provided Capabilities, Runtime Surfaces und Diagnostics sind vorbereitet |

## Verifikation

Mindestgate fuer diese Entscheidung:

```bash
node --check tests/rmt/rmt_compatibility_suite.js
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-E05-02` ist abgeschlossen. Der Host Adapter Contract und Adapter Lifecycle sind definiert, in Schema- und Typ-Artefakte gespiegelt und machen `WP-03` fuer Adapter Registry und Capability Negotiation startbereit.
