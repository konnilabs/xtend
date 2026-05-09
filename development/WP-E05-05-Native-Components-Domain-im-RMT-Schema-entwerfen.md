# WP-E05-05 - Native `components` Domain im RMT Schema entwerfen

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-02-Host-Adapter-Contract-und-Adapter-Lifecycle-definieren.md`
  - `development/WP-E05-03-Adapter-Registry-und-Capability-Negotiation-modellieren.md`
  - `development/WP-E05-04-Native-Adapters-Domain-im-RMT-Schema-entwerfen.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-core.d.ts`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E05-05` macht `components` zu einer nativen, optionalen Top-Level-Domain in `.rmt` Dokumenten. Die Domain beschreibt XTend Custom Elements und andere Component Hosts als neutrale Component Records, ohne dass der RMT Kernel XTend, XRouter, Manifest-Dateien oder konkrete Web-Component-Implementierungen kennen muss.

Damit wird XTend UI als First-Class Host vorbereitbar, waehrend RMT framework-agnostischer Scheduler und DSL-Kernel bleibt.

## Leitentscheidung

`components` ist eine deklarative Domain, keine DOM- oder Runtime-Instanzliste.

RMT darf Component Records parsen, normalisieren, gegen Adapter- und Capability-Requirements pruefen und Scheduler-Hints weiterreichen. Die Materialisierung bleibt Aufgabe eines Component Adapters aus `WP-E05-02`; Auswahl und Pruefung folgen dem Registry-/Negotiation-Contract aus `WP-E05-03`.

Der Kernel darf nicht:

- aus `component.tag` XTend ableiten
- `x-*` Tags als XTend-Sonderfall behandeln
- XTend Manifest Lookup oder Custom-Element-Registrierung ausfuehren
- Slots, Events oder Hydration als DOM-Arbeit selbst materialisieren
- `xtend.component` als Pflicht-Adapter voraussetzen

## Native Domain Shape

Die Domain ist ein optionales Array auf Dokumentebene:

```json
{
  "kind": "rmt_document",
  "version": "1.0",
  "manifest": {
    "documentId": "app.shell"
  },
  "adapters": [],
  "components": [],
  "templates": []
}
```

Ein Component Record besitzt mindestens:

| Feld | Pflicht | Bedeutung |
|------|---------|-----------|
| `id` | ja | stabile Component-ID fuer Routes, Schedules, Diagnostics und Adapterarbeit |
| `kind` | ja | `custom_element`, `web_component`, `host_component`, `template_component` oder `fragment` |
| `adapter` | ja | Adapter-ID, z. B. `xtend.component` oder `custom.element` |
| `tag` / `renderer` | bedingt | Custom-Element-Tag oder host-neutraler Renderer-Ref |
| `props` | nein | deklarative Properties fuer den Adapter |
| `attributes` | nein | serialisierbare Attribute fuer DOM-nahe Hosts |
| `slots` | nein | benannte Slots mit Text-, HTML- oder Template-Refs |
| `events` | nein | DOM-/Host-Events, die auf RMT Commands gemappt werden |
| `hydration` | nein | Hydration- und Ownership-Contract |
| `schedule` | nein | Scheduler-Endpoint oder Policy-Ref fuer Mount/Hydration/Update |
| `requiredCapabilities` | nein | harte Capability-Anforderungen |
| `preferredCapabilities` | nein | weiche Capability-Anforderungen |
| `diagnostics` | nein | strukturierte Diagnostics |
| `metadata` | nein | host-neutrale Zusatzdaten |

## XTend-Beispiel

```json
{
  "id": "pages.overview",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-section",
  "props": {
    "layout": "column",
    "label": "RMT Kernel Overview"
  },
  "attributes": {
    "data-route": "overview"
  },
  "slots": {
    "header": {
      "template": "pages.overview.header"
    },
    "default": {
      "template": "pages.overview.body"
    }
  },
  "events": {
    "section-ready": {
      "commandName": "demo.section.ready"
    }
  },
  "hydration": {
    "mode": "runtime_render",
    "ownershipMode": "managed_subtree",
    "metadata": {
      "endpointHint": "component.visible.mount"
    }
  },
  "schedule": "component.visible.mount",
  "requiredCapabilities": [
    "customElements",
    "hydration"
  ],
  "preferredCapabilities": [
    "slots",
    "events",
    "diagnostics"
  ]
}
```

## Nicht-XTend-Beispiel

`custom.element` steht hier exemplarisch fuer einen generischen Custom-Element-Adapter.

```json
{
  "id": "shared.badge",
  "kind": "web_component",
  "adapter": "custom.element",
  "tag": "status-badge",
  "attributes": {
    "tone": "neutral"
  },
  "props": {
    "label": "Ready"
  },
  "events": {
    "badge-click": {
      "commandName": "shared.badge.click"
    }
  },
  "schedule": {
    "endpointName": "component.idle.hydrate",
    "priority": "background"
  }
}
```

## Backward Compatibility

Die Domain ist additiv:

- Dokumente ohne `components` bleiben gueltig.
- `templates` bleibt weiterhin die stabile Inhaltsdomain fuer bestehende Template-only-Dokumente.
- Component-Daten in `manifest.metadata` koennen als Legacy-/Pilotdaten bestehen bleiben, sollen aber bei produktiver DSL-Arbeit in `components` migriert werden.
- Ein leeres `components: []` ist gueltig und bedeutet: keine expliziten Component-Anforderungen.

## Schema-Entscheidung

`xtendrmt/rmt.schema.json` wird bewusst synchronisiert:

- Top-Level-Property `components` referenziert `#/$defs/components`.
- `#/$defs/component` beschreibt native Component Records.
- `#/$defs/componentKind`, `#/$defs/attributes`, `#/$defs/componentSchedule`, `#/$defs/props`, `#/$defs/slots`, `#/$defs/bindings`, `#/$defs/hydration`, `#/$defs/capabilityList` und `#/$defs/diagnostic` bilden die wiederverwendbaren Bausteine.
- `x-xtendrmt.nativeDomainContracts` dokumentiert `xtend.rmt.components-domain.v1` als WP-05-Artefakt-Referenz.

## Anschluss fuer Folgepakete

- `WP-06` kann `routes[*].component` gegen `components[*].id` referenzieren.
- `WP-09` kann eine Component Registry auf `RmtComponentDomainRecord` aufbauen.
- `WP-11` kann den produktiven XTend Component Adapter auf `adapter: "xtend.component"` und `kind: "custom_element"` abstuetzen.
- `WP-14` kann die Bestcase-Demo von `manifest.metadata.components` auf native `components` migrieren.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `components` ist native Domain, nicht nur `manifest.metadata` | erfuellt: Top-Level-Property ist optional und defaultet auf `[]` |
| XTend Component Records bleiben host-neutral interpretierbar | erfuellt: XTend steckt nur in `adapter: "xtend.component"` und adapterseitigen Capabilities |
| `WP-11` kann produktiven XTend Adapter darauf aufbauen | erfuellt: `RmtComponentDomainRecord` beschreibt `tag`, `props`, `attributes`, `slots`, `events`, `hydration`, `schedule` und Diagnostics |

## Verifikation

Mindestgate fuer diese Entscheidung:

```bash
node -e "JSON.parse(require('fs').readFileSync('xtendrmt/rmt.schema.json','utf8'))"
node --check tests/rmt/rmt_compatibility_suite.js
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-E05-05` ist abgeschlossen. Die native `components` Domain ist im RMT Schema additiv modelliert, in den Typ-Artefakten sichtbar und bereitet native `routes`, Component Registry, XTend Component Adapter und die spaetere Demo-Migration auf host-neutrale Component Records vor.
