# WP-E04-04 - RMT Template Authoring Model fuer XTend UI vorbereiten

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
- Backlog: `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
- Bezug:
  - `development/WP-E04-01-Produktmodell-Scope-und-RMT-Templating-Zielbild-festlegen.md`
  - `development/WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md`
  - `development/WP-E04-03-XTend-Component-Contract-fuer-RMT-Kompatibilitaet-definieren.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtend-builder/templates/component/types.template.d.ts`
  - `xtend-builder/templates/component/docs.template.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E04-04` definiert, wie XTend UI durch RMT Templates authorbar wird. Das Paket fuehrt keine neue XTend-eigene Template-Syntax ein. `.rmt` bleibt der kanonische Authoring-Pfad; XTend wird ueber Adapter- und Component-Refs materialisiert.

Das Ziel ist bewusst vorbereitend: Der RMT Kernel darf Templates registrieren, validieren, schedulen und an Host Adapter uebergeben. Er darf aber keine XTend-Komponenten importieren, keine XTend-Manifeststruktur kennen und keine XRouter- oder `xstate`-Details ausfuehren.

## Umgesetzte Artefakte

- Workpackage-Dokument fuer das RMT Template Authoring Model
- maschinenlesbarer Contract `xtend.rmt.template-authoring.v1`
- erweitertes `rmtAttachment.templateAuthoring` in `xtend-builder/typing/component-types.js`
- neues `.d.ts` Interface `{{className}}RmtTemplateAttachment`
- erweiterter Template-Extension-Contract in `xtend-builder/extensions/component-extension-points.js`
- Dokumentationsanschluss im Component-Docs-Template
- additive Authoring-Metadaten in `xtendrmt/rmt.schema.json` und `xtendrmt/xtendrmt-bestcase-demo.rmt`
- Reference-Gates fuer WP-04, Scaffold-Typing, Extension-Points und Bestcase-RMT

## Contract-Entscheidung

Der verbindliche Authoring-Contract heisst:

```text
xtend.rmt.template-authoring.v1
```

Er ergaenzt den Component Contract:

```text
xtend.rmt.component-contract.v1
```

Der Authoring-Contract beschreibt RMT Template Records, nicht die produktive Bridge. Die Bridge bleibt Epic 05.

## Authoring-Prinzip

RMT Templates bauen XTend UI ueber neutrale Records:

| Feld | Besitzer | Zweck |
|------|----------|-------|
| `templateRef` | RMT DSL Record | stabile Template-ID oder Ref |
| `adapter` | RMT DSL Record | fuer XTend Authoring `xtend.template` |
| `componentRef` | RMT DSL Record | Referenz auf einen neutralen Component Record |
| `props` | RMT DSL Record | serialisierbare Property-Werte oder Model-Refs |
| `attributes` | RMT DSL Record | Custom-Element-Attribute als Daten |
| `slots` | RMT DSL Record | Named Slots zu Text-, Template- oder Component-Refs |
| `events` | RMT DSL Record | DOM Events zu RMT Commands oder Root Events |
| `hydration` | RMT DSL Record | Runtime-Render- und Ownership-Hinweise |
| `kernelBoundary` | Contract | verhindert XTend-Importe im Kernel |

XTend-Komponenten sind im Template sichtbar, aber nur als Datenreferenz. Der XTend Host Adapter materialisiert DOM-Fragmente und Custom Elements. Er loest `componentRef`, `tag`, Manifest Lookup, Custom Element Definition, Slot-Projektion und Event Binding auf.

## Einfaches Beispiel

```json
{
  "id": "dashboard.alert.template",
  "mode": "html_fragment",
  "metadata": {
    "authoring": {
      "contractVersion": "xtend.rmt.template-authoring.v1",
      "adapter": "xtend.template",
      "componentRef": "dashboard.alert",
      "slotBindingMode": "named-slot-to-template-ref",
      "eventBindingMode": "dom-event-to-rmt-command",
      "kernelVisible": false
    }
  },
  "markup": "<x-alert type=\"info\"><span data-slot=\"default\"></span></x-alert>",
  "slots": {
    "default": {
      "template": "dashboard.alert.body"
    }
  },
  "events": {
    "alert-dismissed": {
      "target": "x-alert",
      "commandName": "dashboard.alert.dismissed"
    }
  },
  "hydration": {
    "mode": "runtime_render",
    "ownershipMode": "managed_subtree"
  }
}
```

Dieses Template ist fuer Menschen lesbar und fuer den Host Adapter eindeutig. Der Kernel sieht nur einen Template Record mit Markup, Slots, Events und Hydration.

## Verschachteltes Beispiel

```json
{
  "id": "dashboard.shell.template",
  "mode": "dom_descriptor",
  "metadata": {
    "authoring": {
      "contractVersion": "xtend.rmt.template-authoring.v1",
      "adapter": "xtend.template",
      "componentRefs": [
        "dashboard.shell",
        "dashboard.card",
        "dashboard.alert"
      ],
      "kernelVisible": false
    }
  },
  "props": {
    "layout": "dashboard"
  },
  "slots": {
    "header": {
      "template": "dashboard.header.template"
    },
    "content": {
      "template": "dashboard.cards.template"
    },
    "feedback": {
      "component": "dashboard.alert"
    }
  },
  "events": {
    "card-selected": {
      "commandName": "dashboard.card.select"
    }
  },
  "hydration": {
    "mode": "runtime_render",
    "ownershipMode": "managed_subtree"
  }
}
```

Verschachtelung entsteht ueber `slots`, `template` und `component` Refs. Dadurch muss das RMT Format keine XTend-spezifische Kindersyntax besitzen, bis upstream eine bessere DSL-Ergonomie einfuehrt.

## Grenze zwischen Template und Custom Element

| Verantwortung | RMT Kernel | RMT Template Record | XTend Host Adapter |
|----------------|------------|---------------------|--------------------|
| Template-ID verwalten | ja | ja | liest |
| Markup oder DOM Descriptor speichern | ja | ja | materialisiert |
| XTend-Tag verstehen | nein | als String im Markup oder Component Record | ja |
| ComponentRef aufloesen | nein | Ref-Daten | ja |
| Props/Attributes normalisieren | nein | Werte/Refs | ja |
| Named Slots projizieren | nein | Slot-Refs | ja |
| Custom Events an Commands binden | nein | Event-Refs | ja |
| Hydration planen | generischer Schedule | Hydration-Hinweise | ja |
| XRouter-Routen bauen | nein | Route/Template-Refs | Epic 05 Adapter |

## Authoring-Regeln

- `.rmt` ist der XTend-Templating-Pfad.
- RMT Templates duerfen XTend-Tags als Daten enthalten, aber nicht als Kernel-Sonderfall.
- Component-Refs muessen auf neutrale RMT Component Records zeigen.
- Slots werden named und explizit gebunden.
- Events werden als DOM Event zu RMT Command oder Root Event beschrieben.
- Props und Attributes muessen serialisierbar oder explizite Model-Refs sein.
- Hydration beschreibt Ownership und Runtime-Render-Modus, fuehrt aber keinen Custom-Element-Lifecycle im Kernel aus.
- Der Host Adapter materialisiert DOM und Custom Elements.
- XRouter-Routen duerfen Templates referenzieren, werden aber erst in Epic 05 produktiv gebaut.

## Upstream-Syntaxbedarf

`WP-E04-04` trennt vorbereitete Semantik von spaeterer DSL-Ergonomie.

| Bedarf | Status in Epic 04 | Upstream-Ziel |
|--------|-------------------|---------------|
| native Top-Level `components` Domain | vorbereitet ueber Metadata und Scaffold | Schema-Domain statt Metadata-Ausweichpfad |
| `component_ref` Node Shorthand | vorbereitet ueber `componentRef` | kompaktere Authoring-Syntax |
| Named Slot Children Syntax | vorbereitet ueber `slots` | lesbarere verschachtelte `.rmt` Dateien |
| Event Command Shorthand | vorbereitet ueber `events`/`actions` | weniger Boilerplate fuer DOM Events |
| Authoring Diagnostics | vorbereitet ueber `diagnostics` und `kernelBoundary` | bessere Fehler fuer fehlende Adapter/Refs |

## Scaffold-Anschluss

`xtend-builder/typing/component-types.js` erzeugt ab WP-04 in `rmtAttachment.templateAuthoring`:

- `contractVersion: "xtend.rmt.template-authoring.v1"`
- `adapter: "xtend.template"`
- `templateRef`
- `componentRef`
- `allowedModes`
- `slotBindingMode`
- `eventBindingMode`
- `dataBindingMode`
- `hydrationMode`
- `ownershipMode`
- `compositionModel`
- `upstreamDslNeeds`
- `kernelBoundary`

Das `.d.ts` Template rendert `{{className}}RmtTemplateAttachment`, bleibt aber `types-only-no-runtime-imports`.

`xtend-builder/extensions/component-extension-points.js` spiegelt denselben Contract in `templating`, damit Scaffold-Dry-Runs das Authoring-Modell auch ausserhalb der Typdatei sichtbar machen.

## Bestcase-RMT-Anschluss

`xtendrmt/rmt.schema.json` beschreibt den Authoring-Contract additiv unter `x-xtendrmt.templateAuthoringModels`. Das veraendert keine Required Fields und macht keine XTend-Abhaengigkeit im Kernel verpflichtend.

`xtendrmt/xtendrmt-bestcase-demo.rmt` traegt den Contract in `manifest.metadata.templateAuthoring` und pro Template unter `metadata.authoring`. Dadurch ist die Demo ein Regression-Hinweis fuer das Authoring-Modell, ohne die produktive Bridge vorwegzunehmen.

## Auswirkungen auf Folgepakete

| Folgepaket | Nutzung des WP-04-Contracts |
|------------|-----------------------------|
| `WP-05` | koppelt Root-Lifecycle und Scheduler-Handshakes an TemplateRef, ComponentRef, Hydration und Ownership |
| `WP-06` | beschreibt Host Capabilities fuer Template Materialization, Manifest Lookup, State, Theme und API |
| `WP-07` | haertet Scaffold-, Typing- und Extension-Contracts gegen `xtend.rmt.template-authoring.v1` |
| `WP-08` | erweitert Tests fuer Template Authoring und Host Adapter Boundaries |
| Epic 05 | nutzt den Contract fuer produktive Bridge, native RMT Routes und XRouter Adapter |

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

`WP-E04-04` ist abgeschlossen. XTend UI ist ueber RMT Templates authorbar beschrieben, ohne eine zweite XTend-Template-Syntax und ohne XTend-Wissen im RMT Kernel. `WP-E04-05` kann darauf aufbauend Root-Lifecycle und Scheduler-Handshakes fuer XTend Roots standardisieren.
