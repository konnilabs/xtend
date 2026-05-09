# XTendRMT Pilot-Flow - RMT-basiertes XTend-Templating

- Status: Referenz-Flow fuer Epic 04 ab `WP-E04-09`
- Bezug:
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md`
  - `development/WP-E04-05-Root-Lifecycle-und-Scheduler-Handshakes-fuer-XTend-Roots-standardisieren.md`
  - `development/WP-E04-08-Test-und-Referenzgates-fuer-RMT-kompatible-XTend-Artefakte-erweitern.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `xtendrmt/xtendrmt-bestcase-demo.js`
  - `xtendrmt-bestcase.html`
  - `tests/rmt/rmt_compatibility_suite.js`

## Zweck

Dieses Dokument beschreibt den kontrollierten Pilot-Flow fuer RMT-basiertes XTend-Templating. Der Flow zeigt, wie ein `.rmt` Dokument XTend UI als Template-Record mit Component Attachment ausdrueckt, ohne XTend in den RMT Kernel einzubetten.

Der Pilot ist bewusst referenziell:

- RMT beschreibt Template, Slots, Events, Hydration und Scheduler-Hints als Daten.
- XTend Component Attachment bleibt Adapter-Daten unter `xtend.template` und `xtend.component`.
- XRouter- und Bridge-Materialisierung bleiben Epic 05.
- Der lokale Nachweis laeuft ueber `node scripts/run_xtend_tests.js rmt-compatibility --json`.

## Flow-Contract

Der Pilot-Contract heisst:

```text
xtend.rmt.template-pilot-flow.v1
```

Er verbindet die vorhandenen Contracts:

| Contract | Rolle im Pilot |
|----------|----------------|
| `xtend.rmt.component-contract.v1` | beschreibt XTend Component Records als adapterneutrale Daten |
| `xtend.rmt.template-authoring.v1` | beschreibt Template-Refs, Slots, Events und Hydration |
| `xtend.rmt.root-handshake.v1` | beschreibt Scheduler- und Root-Lifecycle-Handshakes |
| `xtend.rmt.host-capabilities.v1` | beschreibt die XTend Host-Adapter-Capabilities |
| `xtend.scaffold.rmt-compatibility-binding.v1` | prueft den lokalen Dry-Run- und Handoff-Pfad |

## Pilot-Record

Die Bestcase-Demo fuehrt `manifest.metadata.pilotFlow` ein:

```json
{
  "contractVersion": "xtend.rmt.template-pilot-flow.v1",
  "status": "reference-only",
  "templateRef": "demo.templating.pilot",
  "routeRef": "templating",
  "componentAttachment": {
    "adapter": "xtend.template",
    "componentAdapter": "xtend.component",
    "componentRefs": ["pilot.shell", "kernel.cards", "feedback.status"]
  },
  "minimumGate": "node scripts/run_xtend_tests.js rmt-compatibility --json",
  "bridgeRuntime": "reserved-for-Epic-05",
  "kernelVisible": false
}
```

Der zugehoerige Template-Record ist `demo.templating.pilot`. Er nutzt `mode: "dom_descriptor"`, explizite Slots, ein DOM-Event zu einem RMT Command und `runtime_render` Hydration. Das ist absichtlich ausfuehrungsnah genug fuer Review und Tests, aber noch keine produktive Bridge.

## Ablauf

| Schritt | Besitzer | Ergebnis |
|---------|----------|----------|
| `.rmt` Dokument laden | RMT Template API | Dokument, Templates und Metadata liegen als RMT Records vor |
| Pilot-Metadata lesen | XTend Demo Host | `pilotFlow` wird als Referenz-Contract angezeigt |
| Template inspizieren | RMT Scheduler | `template.visible.inspect` plant eine sichtbare Inspektion |
| ComponentRefs aufloesen | XTend Host Adapter | `pilot.shell`, `kernel.cards` und `feedback.status` bleiben Adapter-Daten |
| Diagnostics spiegeln | `xstate` | `xtend.rmt.templating.pilot` enthaelt den Inspect-Snapshot |

## Grenzen

Der Pilot darf:

- RMT Template Records mit XTend Component Attachment zeigen
- Scheduler-Hints und Inspect-Jobs sichtbar machen
- XRouter-Routen weiterhin aus Metadata demonstrieren
- den `rmt-compatibility` Gate als Mindestpruefung verwenden

Der Pilot darf nicht:

- XTend Runtime in den RMT Kernel importieren
- einen produktiven Template-Parser implementieren
- Routes produktiv in einer nativen RMT Routing-Domain registrieren
- die Epic-05-Bridge ersetzen
- React, Vue, Vanilla JS oder Custom Hosts ausschliessen

## Upstream-Handoff

Fuer upstream XTendRMT bleiben folgende Punkte offen:

- native `component_ref` Node Shorthand
- native Template-Pilot-Diagnostics
- native Route-Template-Binding-Domain
- produktiver XTend Host Adapter
- produktiver XRouter Adapter fuer native RMT Routes

## Lokaler Gate

```bash
node --check xtendrmt/xtendrmt-bestcase-demo.js
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
```

Der Pilot bleibt damit ein pruefbarer, framework-agnostischer Referenzpfad fuer die spaetere Epic-05-Bridge.
