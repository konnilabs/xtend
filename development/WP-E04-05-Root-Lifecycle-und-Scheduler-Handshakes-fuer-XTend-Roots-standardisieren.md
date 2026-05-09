# WP-E04-05 - Root-Lifecycle- und Scheduler-Handshakes fuer XTend Roots standardisieren

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
- Backlog: `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
- Bezug:
  - `development/WP-E04-01-Produktmodell-Scope-und-RMT-Templating-Zielbild-festlegen.md`
  - `development/WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md`
  - `development/WP-E04-03-XTend-Component-Contract-fuer-RMT-Kompatibilitaet-definieren.md`
  - `development/WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md`
  - `development/XTend-Scaffold-Extension-Points.md`
  - `compliance/digital-twin-principle.md`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtend-builder/templates/component/types.template.d.ts`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E04-05` standardisiert, wie RMT XTend Root-Arbeit planen kann, ohne XTend-Lifecycle selbst auszufuehren. Der RMT Scheduler darf Root-Phasen ueber neutrale Endpoint-Hints planen. Der XTend Host Adapter bleibt Besitzer von Root-Aufloesung, Custom-Element-Lifecycle, Template-Materialisierung, `xstate`-Bridge, Cleanup und Diagnostics.

Der verbindliche Contract heisst:

```text
xtend.rmt.root-handshake.v1
```

## Umgesetzte Artefakte

- Workpackage-Dokument fuer Root-Lifecycle und Scheduler-Handshakes
- maschinenlesbarer Root-Handschlag in `rmtAttachment.rootLifecycle`
- erweiterter Extension-Contract `schedulerHandshake`
- `.d.ts` Interface `{{className}}RmtRootAttachment`
- Root-Handshake-Hinweise in `xtendrmt/rmt.schema.json`
- Bestcase-RMT-Metadata fuer `manifest.metadata.rootLifecycle`
- Aktualisierung der Scaffold-Extension-Dokumentation
- Digital-Twin-Regeln fuer RMT Scheduler-Handshakes
- Reference-Gates fuer WP-05 und Root-Handshake-Dry-Runs

## Contract-Entscheidung

RMT und XTend teilen sich Root-Arbeit entlang einer klaren Grenze:

| Rolle | Besitzer | Verantwortung |
|-------|----------|----------------|
| Planung | RMT Scheduler | Schedule-Auswahl, Lane, Prioritaet, Budget, Coalescing, Job Context |
| Ausfuehrung | XTend Host Adapter | Manifest Lookup, Root-Aufloesung, Custom Element Lifecycle, Hydration, Render, Cleanup |
| Wahrheit | `xstate` / Host State Bridge | digitale Zwillinge, Lifecycle-Snapshots, Diagnostics |
| DSL | RMT Records | `rootRef`, `componentRef`, `templateRef`, `phase`, `schedule`, `endpointName` |

Der Kernel kennt nur Endpoint-Hints und Job Context. Er importiert keine XTend-Komponenten, ruft keine Custom-Element-Callbacks auf und mutiert keine `xstate`-Keys direkt.

## Root-Lifecycle-Phasen

| Phase | Bedeutung | Besitzer |
|-------|-----------|----------|
| `create` | Root-Record und Zielcontainer werden vorbereitet | XTend Host Adapter |
| `mount` | Custom Element oder Root-Subtree wird in den Host eingehangen | XTend Host Adapter |
| `hydrate` | bestehender oder erzeugter Subtree wird hydriert | XTend Host Adapter |
| `activate` | sichtbare Route oder Komponente wird freigegeben | XTend Host Adapter |
| `update` | Props, Attributes, Slots oder State-Aenderungen werden angewendet | XTend Host Adapter |
| `unmount` | Root wird geloest, Listener und lokale Caches werden bereinigt | XTend Host Adapter |
| `diagnostics` | Snapshot und Lifecycle-Metriken werden gemeldet | XTend Host Adapter |

Die bestehende Scaffold-Hook-Sequenz `beforeHydrate`, `afterHydrate`, `beforeRender`, `afterRender`, `onDisconnect` bleibt no-op und wird den Phasen zugeordnet. Hooks duerfen Signale vorbereiten, aber keine RMT Scheduler Jobs ausfuehren.

## Scheduler-Endpoint-Hint-Matrix

| Phase | Schedule-Hint | Endpoint-Hint | Lane | Idle | Zweck |
|-------|---------------|---------------|------|------|-------|
| `create` | `component.visible.mount` | `xtendrmt.root.create` | `visible` | nein | Root-Record und Host-Ziel vorbereiten |
| `mount` | `component.visible.mount` | `xtendrmt.component.mount` | `visible` | nein | sichtbare Custom Elements mounten |
| `hydrate` | `component.idle.hydrate` | `xtendrmt.component.hydrate` | `idle` | ja | nicht-blockierende Hydration |
| `activate` | `route.visible.render` | `xtendrmt.route.render` | `visible` | nein | Route oder sichtbare UI aktivieren |
| `update` | aktuelle Schedule Policy | `xtendrmt.component.update` | `visible` | nein | geaenderte Props, Slots oder State anwenden |
| `unmount` | `component.visible.mount` | `xtendrmt.component.unmount` | `visible` | nein | Cleanup ohne zweite Wahrheit |
| `diagnostics` | `diagnostics.snapshot` | `xtendrmt.diagnostics.snapshot` | `diagnostics` | ja | Scheduler- und Host-Snapshots melden |

Die Matrix ist ein Authoring- und Adapter-Contract. Sie ist keine produktive Scheduler-Implementierung in `XTend-Scaffold`.

## Job Context

Ein RMT Scheduler Job fuer XTend Root-Arbeit soll mindestens diese Daten transportieren:

```json
{
  "rootRef": "example.root.<id>",
  "componentRef": "example.<id>",
  "templateRef": "example.template",
  "phase": "hydrate",
  "schedule": "component.idle.hydrate",
  "endpointName": "xtendrmt.component.hydrate"
}
```

Der XTend Host Adapter darf daraus Manifest Lookup, Custom Element Definition, Slot-Projektion, Event Binding, Hydration und Diagnostics ableiten. Der RMT Scheduler darf diese Werte planen und weiterreichen, aber nicht interpretieren wie XTend-Laufzeitdetails.

## Digital-Twin- und SSOT-Regeln

- Lifecycle-Status muss als State- oder Diagnostics-Signal spiegelbar sein.
- Sichtbare Aktivierung darf nicht per Timeout-, Polling- oder Retry-Kopplung hergestellt werden.
- Scheduler-Jobs duerfen keine zweite Source of Truth erzeugen.
- UI-Aenderungen muessen ueber kanonische XTend-State-Keys oder dokumentierte Host-Adapter-Signale nachvollziehbar sein.
- Diagnostics duerfen Snapshots melden, aber niemals die UI-Wahrheit ersetzen.

Diese Regeln sind in `compliance/digital-twin-principle.md` fuer RMT Scheduler-Handshakes ergaenzt.

## Scaffold-Anschluss

`xtend-builder/typing/component-types.js` erzeugt ab WP-05:

- `RMT_ROOT_HANDSHAKE_CONTRACT_VERSION`
- `rmtAttachment.rootLifecycle.contractVersion`
- `rootRef`, `componentRef`, `templateRef`
- `phaseSequence`
- `schedulerEndpointHints`
- `handoff`
- `boundaries.schedulerOwns`
- `boundaries.hostAdapterOwns`
- `boundaries.forbidden`

`xtend-builder/extensions/component-extension-points.js` spiegelt diese Daten in:

- `rootLifecycle.contractVersion`
- `rootLifecycle.phaseSequence`
- `rootLifecycle.schedulerEndpointHints`
- `schedulerHandshake`
- `reviewRules`

Das `.d.ts` Template rendert `{{className}}RmtRootAttachment`, bleibt aber weiterhin `types-only-no-runtime-imports`.

## RMT-Demo- und Schema-Anschluss

`xtendrmt/rmt.schema.json` beschreibt `x-xtendrmt.rootLifecycleModels` additiv. Das veraendert keine Required Fields und fuehrt keine XTend-Pflicht in den Kernel ein.

`xtendrmt/xtendrmt-bestcase-demo.rmt` traegt `manifest.metadata.rootLifecycle` mit `xtend.rmt.root-handshake.v1`, Planner/Executor-Grenze, Phasenfolge und Endpoint-Hints. Die Demo bleibt Regression-Referenz, nicht Runtime-Source-of-Truth.

## Auswirkungen auf Folgepakete

| Folgepaket | Nutzung des WP-05-Contracts |
|------------|-----------------------------|
| `WP-06` | beschreibt Host Capabilities fuer Manifest, State, Theme, API und Hydration entlang der Root-Phasen |
| `WP-07` | haertet Scaffold-, Typing-, Extension- und Preview-Contracts gegen Root-Handshakes |
| `WP-08` | erweitert Tests fuer Endpoint-Hints, Digital-Twin-Regeln und Host Adapter Boundaries |
| `WP-09` | kann einen Pilot-Flow mit geplanter Route-, Component- und Hydration-Arbeit vorbereiten |
| Epic 05 | nutzt den Contract fuer produktive Bridge, native Routes und XRouter Adapter |

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

`WP-E04-05` ist abgeschlossen. RMT kann XTend Root-Arbeit ueber neutrale Scheduler-Endpoint-Hints planen, waehrend der XTend Host Adapter Lifecycle, Hydration, State-Bridge, Cleanup und Diagnostics ausfuehrt. `WP-E04-06` kann nun die XTend Host Capabilities fuer Manifest, State, Theme, API und Hydration beschreiben.
