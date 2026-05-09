# WP-E04-06 - XTend Host Capabilities fuer Manifest, State, Theme, API und Hydration beschreiben

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
- Backlog: `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
- Bezug:
  - `development/WP-E04-03-XTend-Component-Contract-fuer-RMT-Kompatibilitaet-definieren.md`
  - `development/WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md`
  - `development/WP-E04-05-Root-Lifecycle-und-Scheduler-Handshakes-fuer-XTend-Roots-standardisieren.md`
  - `development/XTend-Scaffold-Extension-Points.md`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtend-builder/templates/component/types.template.d.ts`
  - `xtend-builder/scaffold.config.js`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E04-06` beschreibt XTend als RMT Host ueber explizite, optionale und verhandelbare Host Capabilities. RMT darf diese Faehigkeiten als Daten sehen, planen und gegen Dokumentanforderungen pruefen. Der RMT Kernel darf daraus aber keine XTend Runtime-Imports, keine `window.XTend` Aufrufe und keine direkten `xstate` Mutationen ableiten.

Der verbindliche Contract heisst:

```text
xtend.rmt.host-capabilities.v1
```

## Umgesetzte Artefakte

- Workpackage-Dokument fuer XTend Host Capabilities
- maschinenlesbarer Contract `rmtAttachment.hostCapabilities`
- Extension-Contract `hostCapabilities`
- `.d.ts` Interface `{{className}}RmtHostCapabilities`
- Host-Capability-Modell in `xtendrmt/rmt.schema.json`
- Bestcase-RMT-Metadata fuer `manifest.metadata.hostCapabilities`
- Scaffold-Konfiguration fuer Host-Capability-Version und Capability-Liste
- Dokumentationsanschluss in Typing-, Template- und Extension-Docs
- Reference-Gates fuer WP-06, Host Capabilities und Demo-Metadata

## Contract-Entscheidung

Host Capabilities beschreiben, was ein Host Adapter ausfuehren kann. Sie beschreiben nicht, was der RMT Kernel selbst implementieren soll.

| Rolle | Besitzer | Verantwortung |
|-------|----------|----------------|
| Capability Negotiation | RMT Dokument + Host Adapter | Pflicht- und optionale Faehigkeiten abgleichen |
| Planung | RMT Scheduler | Schedule-Auswahl, Endpoint-Hints und Job Context |
| Ausfuehrung | XTend Host Adapter | Manifest Lookup, Custom Elements, State Bridge, Theme/API, Hydration, Router Adapter und Diagnostics |
| Wahrheit | `xstate` und Host Runtime | UI-State, Lifecycle-Snapshots und digitale Zwillinge |
| Kernel-Grenze | RMT Kernel | nur Capability-IDs, Versionen und neutrale Adapterdaten |

Damit wird XTend First-Class Citizen in RMT, ohne dass XTend zum Kernel-Sonderfall wird.

## Host-Capability-Matrix

| Capability | Pflicht | Contract-ID | Besitzer | RMT-Sicht | XTend-Ausfuehrung |
|------------|---------|-------------|----------|-----------|-------------------|
| `manifest` | ja | `xtend.manifest` | XTend Host Adapter | Lookup-Quelle und lokale Importregel | `components/manifest.json` aufloesen |
| `customElements` | ja | `xtend.custom-elements` | XTend Host Adapter | Custom-Element-Host vorhanden | `customElements.define/get/whenDefined`, Lifecycle callbacks |
| `stateBridge` | ja | `xtend.state-bridge.xstate` | XTend Host Adapter / `xstate` | State-Bridge vorhanden | `xstate.get`, `xstate.set`, `xstate.subscribe` |
| `hydration` | ja | `xtend.hydration` | XTend Host Adapter | Hydration-Endpunkt vorhanden | `hydrate`, `render`, `data-xtend-hydrated` |
| `schedulerEndpoints` | ja | `xtend.scheduler-endpoints` | RMT Scheduler + Host Adapter | Endpoint-Hints vorhanden | Host Adapter registriert oder bedient Endpoints |
| `theme` | optional | `xtend.theme` | XTend Host Adapter | Theme-Faehigkeit nutzbar | `window.XTend.theme`, CSS Custom Properties, Theme-State |
| `api` | optional | `xtend.api` | XTend Host Adapter | API-Fassade nutzbar | `window.XTend.*` Namespaces und Compliance API |
| `router` | optional | `xtend.xrouter` | XTend Host Adapter / Epic 05 | Route Records vorbereitbar | XRouter-Konfiguration spaeter im Adapter |
| `diagnostics` | optional | `xtend.diagnostics` | XTend Host Adapter | Diagnose-Snapshots moeglich | State- und Event-Snapshots an RMT melden |

## Pflichtfaehigkeiten

Diese Capabilities sind fuer XTend als produktiven RMT Host erforderlich:

- `manifest`
- `customElements`
- `stateBridge`
- `hydration`
- `schedulerEndpoints`

Fehlt eine Pflichtfaehigkeit, muss der Host Adapter diagnostisch abbrechen, bevor sichtbare UI gemountet wird. Das verhindert halb hydrierte UIs und vermeidet Timeout-, Retry- oder Polling-Kopplungen.

## Optionale Faehigkeiten

Diese Capabilities bleiben optional:

- `theme`
- `api`
- `router`
- `diagnostics`

Fehlt eine optionale Faehigkeit, darf der Host Adapter degradieren, den betroffenen Pfad ueberspringen oder Diagnostics melden. Der RMT Kernel darf daraus keinen Fehler ableiten, solange das RMT Dokument diese Faehigkeit nicht explizit als required markiert.

## Kompatibilitaetsregeln fuer Parallelbetrieb

XTendRMT bleibt framework-agnostischer Scheduler. Die Capability-Regeln muessen deshalb auch in grossen Web Apps mit React, Vue, Vanilla JS oder Custom Hosts funktionieren.

- Capability-IDs muessen host-spezifisch sein, etwa `xtend.manifest` oder spaeter `react.root`.
- Der RMT Kernel darf nur neutrale Records, Capability-IDs, Versionen, Schedule-Policies und Endpoint-Hints sehen.
- Host Adapter duerfen eigene Manifest-, State-, Theme-, API- und Hydration-Mechaniken besitzen.
- XTend-spezifische State-Keys duerfen nicht als Kernel-Pflicht in `.rmt` Dokumente wandern.
- XRouter bleibt optionale Router-Capability und produktive Adapter-Arbeit fuer Epic 05.
- Diagnostics duerfen Host-Zustand spiegeln, aber keine zweite Source of Truth bilden.

## Capability Negotiation

Ein RMT Dokument darf Capabilities anfordern:

```json
{
  "adapterId": "xtend",
  "contractVersion": "xtend.rmt.host-capabilities.v1",
  "requiredCapabilities": ["manifest", "customElements", "stateBridge", "hydration"],
  "optionalCapabilities": ["theme", "api", "router", "diagnostics"]
}
```

Der Host Adapter prueft die Anforderungen gegen seine Faehigkeiten:

| Ergebnis | Verhalten |
|----------|-----------|
| alle Pflichtfaehigkeiten vorhanden | Root-Lifecycle darf geplant und ausgefuehrt werden |
| Pflichtfaehigkeit fehlt | diagnostischer Fail-Fast vor Mount/Hydration |
| optionale Faehigkeit fehlt | Degradation oder Skip mit Diagnostics |
| unbekannte XTend-Faehigkeit | keine Kernel-Ausfuehrung, Handoff an Adapter-Diagnostics |

## Digital-Twin- und SSOT-Regeln

- `stateBridge` nutzt `xstate.subscribe(fn, keyFilter?)` als kanonischen Listener-Contract.
- Der RMT Kernel darf `xstate.set` nicht direkt aufrufen.
- Lokale UI-Felder bleiben abgeleitete Render-Caches.
- Theme- und API-Faehigkeiten duerfen State spiegeln, aber nicht eine zweite UI-Wahrheit erzeugen.
- Hydration muss ueber Custom-Element-Lifecycle und `data-xtend-hydrated` nachvollziehbar sein.
- Diagnostics melden Snapshots und Fehler, ersetzen aber niemals UI-State.

## Scaffold-Anschluss

`xtend-builder/typing/component-types.js` erzeugt ab WP-06:

- `RMT_HOST_CAPABILITIES_CONTRACT_VERSION`
- `rmtAttachment.hostCapabilities.contractVersion`
- Pflicht- und optionale Capability-Listen
- Capability-Records fuer Manifest, Custom Elements, `xstate`, Hydration, Scheduler-Endpoints, Theme, API, Router und Diagnostics
- Negotiation-Regeln fuer Required/Optional-Faehigkeiten
- Grenzen gegen Kernel-Imports und direkte `window.XTend` Aufrufe

`xtend-builder/extensions/component-extension-points.js` spiegelt diese Daten in:

- `hostCapabilities.contractVersion`
- `hostCapabilities.requiredCapabilities`
- `hostCapabilities.optionalCapabilities`
- `hostCapabilities.capabilities`
- `hostCapabilities.negotiation`
- `hostCapabilities.boundaries`

## RMT-Demo- und Schema-Anschluss

`xtendrmt/rmt.schema.json` beschreibt `x-xtendrmt.hostCapabilityModels` additiv. Das fuehrt keine Required Fields ein und macht XTend nicht zur Kernel-Abhaengigkeit.

`xtendrmt/xtendrmt-bestcase-demo.rmt` traegt `manifest.metadata.hostCapabilities` mit `xtend.rmt.host-capabilities.v1`, Pflicht-/Optional-Listen, Capability-Refs und Negotiation-Regeln. Die Demo bleibt Regression-Referenz, nicht Runtime-Source-of-Truth.

## Auswirkungen auf Folgepakete

| Folgepaket | Nutzung des WP-06-Contracts |
|------------|-----------------------------|
| `WP-07` | bindet Scaffold-, Typing-, Extension- und Preview-Contracts gezielt an RMT-Kompatibilitaet an |
| `WP-08` | kann Tests fuer Host-Capability-Listen, Negotiation und Kernel-Grenzen erweitern |
| `WP-09` | kann den Pilot-Flow gegen Required/Optional-Capabilities pruefen |
| `WP-10` | nutzt die Matrix fuer Framework-Agnostik- und Parallelbetriebsregeln |
| Epic 05 | nutzt Capability Negotiation fuer produktive Bridge, native Routes und XRouter Adapter |

## Lokaler Testpfad

```bash
node --check xtend-builder/typing/component-types.js
node --check xtend-builder/extensions/component-extension-points.js
node --check xtend-builder/generators/component-files.js
node --check tests/references/reference_path_suite.js
node xtend-builder/scaffold.js typing --tag x-example --profile routing --feature state --json
node xtend-builder/scaffold.js extensions --tag x-example --profile routing --feature state --json
node xtend-builder/scaffold.js component-files --tag x-example --profile routing --feature state --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-E04-06` ist abgeschlossen. XTend besitzt nun einen expliziten Host-Capability-Contract fuer Manifest, Custom Elements, `xstate`, Theme, API, Hydration, Scheduler-Endpoints, Router und Diagnostics. `WP-E04-07` kann darauf aufbauen und Scaffold-, Typing- und Extension-Contracts gezielt an die RMT-Kompatibilitaet anbinden.
