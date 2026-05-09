# WP-E04-03 - XTend Component Contract fuer RMT-Kompatibilitaet definieren

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
- Backlog: `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
- Bezug:
  - `development/WP-E04-01-Produktmodell-Scope-und-RMT-Templating-Zielbild-festlegen.md`
  - `development/WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/templates/component/types.template.d.ts`
  - `xtend-builder/templates/component/docs.template.md`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E04-03` definiert den XTend Component Contract fuer RMT-Kompatibilitaet. Das Paket beschreibt, wie XTend-Komponenten als neutrale RMT Component Records authorbar werden, ohne dass der RMT Kernel XTend-Tags, XTend-Manifeststruktur, `xstate`-Keys oder XRouter-Klassen kennen muss.

## Umgesetzte Artefakte

- Workpackage-Dokument fuer den XTend/RMT Component Contract
- maschinenlesbarer Scaffold-Anschluss ueber `xtend.rmt.component-contract.v1`
- erweitertes RMT Attachment in `xtend-builder/typing/component-types.js`
- erweitertes `.d.ts` Template fuer Manifest Lookup, Attributes, Hydration und Diagnostics
- erweiterte Komponentendoku fuer RMT Component Contract, Manifest Lookup und Hydration
- Reference-Gates fuer WP-03, Component Attachment und generierte Type-Ausgabe

## Contract-Entscheidung

XTend-Komponenten werden in RMT als generische Component Records beschrieben. Der Record darf XTend als Adapter referenzieren, aber nicht den RMT Kernel an XTend binden.

Der verbindliche Contract heisst:

```text
xtend.rmt.component-contract.v1
```

Der Scaffold-Typing-Anschluss bleibt:

```text
xtend.scaffold.rmt-attachment.v1
```

## Neutraler RMT Component Record

Ein XTend-kompatibler Component Record besteht fachlich aus:

| Feld | Pflicht | Besitzer | Zweck |
|------|---------|----------|-------|
| `id` | ja | DSL Record | stabile Component-ID im RMT-Dokument |
| `kind` | ja | DSL Record | generische Komponentenkategorie, fuer XTend `custom_element` |
| `adapter` | ja | DSL Record | Adapter-ID, fuer XTend `xtend.component` |
| `tag` | ja | DSL Record | Custom-Element-Tag, bleibt Datenfeld, kein Kernel-Import |
| `props` | optional | DSL Record | Property-Werte oder Model-Refs |
| `attributes` | optional | DSL Record | serialisierbare Attribute fuer Custom Elements |
| `slots` | optional | DSL Record | Slot-Namen zu Template-, Text- oder Component-Refs |
| `events` | optional | DSL Record | DOM/Event-Signale zu RMT Commands oder Root Events |
| `hydration` | optional | DSL Record | Hydration-Modus und Ownership-Hinweise |
| `schedule` | optional | DSL Record | referenzierte Scheduler Policy |
| `diagnostics` | optional | DSL Record | Diagnose-Namespace und Snapshot-Hinweise |

## Beispiel

```json
{
  "id": "dashboard.alert",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-alert",
  "props": {
    "type": "info"
  },
  "attributes": {
    "closable": true
  },
  "slots": {
    "default": {
      "template": "dashboard.alert.body"
    }
  },
  "events": {
    "alert-dismissed": {
      "commandName": "dashboard.alert.dismissed"
    }
  },
  "hydration": {
    "mode": "custom-element",
    "ownershipMode": "managed_subtree"
  },
  "schedule": "component.visible.mount",
  "diagnostics": {
    "eventNamespace": "xtend.rmt.component.alert",
    "reportToRmt": true
  }
}
```

Dieser Record ist XTend-faehig, aber nicht XTend-intern. Ein anderer Host Adapter kann einen gleichartigen Record fuer andere Component-Systeme interpretieren.

## Verantwortungsgrenze

| Verantwortung | RMT Kernel | RMT DSL Record | XTend Host Adapter |
|----------------|------------|----------------|--------------------|
| Component-ID speichern | ja | ja | liest |
| Adapter-ID speichern | ja | ja | matched |
| XTend-Tag kennen | nein | als String | ja |
| XTend Manifest lesen | nein | Manifest Lookup Hinweis | ja |
| Custom Element laden | nein | nein | ja |
| Attribute/Props normalisieren | nein | Werte/Refs | ja |
| Slots fuellen | nein | Slot-Refs | ja |
| Events bridgen | nein | Event/Command-Refs | ja |
| `xstate` spiegeln | nein | optionaler State-Hinweis | ja |
| Theme/API nutzen | nein | Capability-Ref | ja |
| Scheduler Policy auswaehlen | Policy-Ref planen | Schedule-Ref | fuehrt Host-Arbeit aus |
| Diagnostics sammeln | generische Events | Namespace/Flags | meldet Host-Details |

## Kernel-Grenze

Verboten fuer den RMT Kernel:

- Import von XTend-Komponententypen
- Import oder Annahme der XTend-Manifeststruktur
- direkte Nutzung von `xstate`-Keys
- direkte Nutzung von XRouter-Klassen oder `x-route` DOM-Strukturen
- Sonderlogik fuer `x-*` Tags

Erlaubt fuer den RMT Kernel:

- generische Component Records speichern
- Adapter-ID und Capability-Record auswerten
- Schedule-Policies referenzieren
- Root-, Template-, Hydration- und Diagnostics-Events neutral verwalten

## Manifest Lookup

Manifest Lookup ist Host-Adapter-Arbeit:

```json
{
  "source": "xtend.manifest",
  "lookupBy": ["tag", "id"],
  "localImportOnly": true,
  "kernelVisible": false
}
```

Der DSL Record darf diesen Lookup beschreiben. Der Kernel darf ihn nicht ausfuehren und darf nicht wissen, wie das XTend Manifest aufgebaut ist.

## Hydration Contract

XTend Custom Elements bleiben fuer ihre lokale Hydration verantwortlich. RMT darf Hydration planen und Ownership beschreiben.

Minimaler Hydration Record:

```json
{
  "mode": "custom-element",
  "ownershipMode": "managed_subtree",
  "stateAttribute": "data-xtend-hydrated",
  "lifecycle": [
    "connectedCallback",
    "hydrate",
    "attributeChangedCallback",
    "disconnectedCallback"
  ]
}
```

Diese Felder beschreiben Host-Arbeit. Sie sind keine Aufforderung an den RMT Kernel, Custom-Element-Lifecycle selbst zu implementieren.

## Event- und Command-Bridge

Event Records verbinden XTend Custom Events mit RMT Commands oder Root Events:

```json
{
  "alert-dismissed": {
    "commandName": "dashboard.alert.dismissed"
  }
}
```

Der XTend Host Adapter entscheidet:

- ob ein DOM Event Listener registriert wird
- ob `preventDefault`, `stopPropagation`, `capture`, `once` oder `passive` genutzt werden
- ob Event Details normalisiert werden
- ob ein RMT Command, Root Event oder Host Callback ausgeloest wird

## Diagnostics Contract

Diagnostics bleiben zweistufig:

- Der DSL Record benennt Namespace, Snapshot-Key oder Report-Flag.
- Der Host Adapter sammelt konkrete XTend-Daten und meldet sie als generisches RMT Diagnostics Event.

Beispiel:

```json
{
  "eventNamespace": "xtend.rmt.component.alert",
  "stateSnapshotKey": "xtend.component.x-alert.<id>.diagnostics",
  "reportToRmt": true
}
```

Der Kernel kennt den Namespace als Datenwert, nicht als XTend-Semantik.

## Scaffold-Anschluss

`xtend-builder/typing/component-types.js` erzeugt ab WP-03 in `rmtAttachment`:

- `contractVersion: "xtend.rmt.component-contract.v1"`
- `componentDefinition.manifestLookup`
- `componentDefinition.attributes`
- `componentDefinition.hydration`
- `componentDefinition.diagnostics`
- `boundaries.kernelForbidden`
- `boundaries.dslRecordOwns`
- `boundaries.hostAdapterOwns`

Das `.d.ts` Template rendert diese Felder in `{{className}}RmtComponentAttachment`, bleibt aber `types-only-no-runtime-imports`.

## Auswirkungen auf Folgepakete

| Folgepaket | Nutzung des WP-03-Contracts |
|------------|-----------------------------|
| `WP-04` | nutzt `slots`, `props`, `attributes`, `events` und `template`-Refs fuer das Template Authoring Model |
| `WP-05` | nutzt `hydration`, `schedule` und `diagnostics` fuer Lifecycle- und Scheduler-Handshakes |
| `WP-06` | nutzt `manifestLookup`, State-, Theme- und API-Grenzen fuer Host Capabilities |
| `WP-07` | kann Scaffold-, Typing- und Extension-Contracts gegen `xtend.rmt.component-contract.v1` haerten |
| Epic 05 | kann daraus produktiven XTend Host Adapter und native RMT `components` Domain ableiten |

## Lokaler Testpfad

```bash
node --check xtend-builder/typing/component-types.js
node --check xtend-builder/generators/component-files.js
node --check tests/references/reference_path_suite.js
node xtend-builder/scaffold.js typing --tag x-example --profile routing --feature state --json
node xtend-builder/scaffold.js component-files --tag x-example --profile routing --feature state --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-E04-03` ist abgeschlossen. XTend-Komponenten sind als RMT-kompatible Component Records definiert, ohne den RMT Kernel an XTend zu koppeln. `WP-E04-04` kann darauf aufbauend das RMT Template Authoring Model fuer XTend UI vorbereiten.
