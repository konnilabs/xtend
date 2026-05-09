# WP-E05-06 - Native `routes` Domain im RMT Schema entwerfen

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-02-Host-Adapter-Contract-und-Adapter-Lifecycle-definieren.md`
  - `development/WP-E05-03-Adapter-Registry-und-Capability-Negotiation-modellieren.md`
  - `development/WP-E05-04-Native-Adapters-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-core.d.ts`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E05-06` macht `routes` zu einer nativen, optionalen Top-Level-Domain in `.rmt` Dokumenten. Die Domain beschreibt Navigationszustand, Route-Ziele, Router-Adapter-Refs, Scheduling und Lifecycle-Ereignisse, ohne XRouter-DOM-Strukturen oder konkrete Router-Runtimes in den RMT Kernel einzubauen.

Damit kann XRouter als erster produktiver Router Adapter auf RMT Routes gemappt werden. Dieselbe Domain bleibt aber offen fuer React Router, Vue Router, Vanilla Router oder komplett individuelle Host-Router.

## Leitentscheidung

`routes` ist eine deklarative Navigationsdomain, keine XRouter-Konfiguration.

RMT darf Route Records parsen, normalisieren, gegen Adapter- und Capability-Requirements pruefen und an einen Router Adapter uebergeben. Die Erzeugung von `x-route` Elementen, Router-Konfigurationen, Runtime-Registrierungen, Navigation Side Effects und URL-State-Synchronisation bleibt Aufgabe des jeweiligen Router Adapters.

Der Kernel darf nicht:

- XRouter-Klassen importieren
- aus `router: "xtend.xrouter"` eine Pflicht-Runtime ableiten
- `x-route` DOM-Strukturen erzeugen
- URL-Parameter oder Query State in `xstate` schreiben
- Route Lifecycle Hooks selbst ausfuehren

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
  "routes": [],
  "templates": []
}
```

Ein Route Record besitzt mindestens:

| Feld | Pflicht | Bedeutung |
|------|---------|-----------|
| `id` | ja | stabile Route-ID fuer Navigation, Diagnostics, Schedules und Links |
| `path` | ja | Router-unabhaengiges Pfadmuster, z. B. `/`, `/users/:id` oder `*` |
| `router` | ja | Router Adapter-ID, z. B. `xtend.xrouter` oder `custom.router` |
| `title` | nein | menschenlesbarer Route-Titel |
| `component` | nein | Referenz auf `components[*].id` oder adapterlesbarer Component Ref |
| `template` | nein | Referenz auf `templates[*].id` |
| `schedule` | nein | Scheduler-Endpoint oder Policy-Ref fuer Route-Aktivierung |
| `params` | nein | deklarative Param-Definitionen fuer Path-Parameter |
| `query` | nein | deklarative Query-Definitionen |
| `lifecycle` | nein | Lifecycle-Bindings wie `beforeEnter`, `enter`, `leave` und `error` |
| `requiredCapabilities` | nein | harte Capability-Anforderungen |
| `preferredCapabilities` | nein | weiche Capability-Anforderungen |
| `diagnostics` | nein | strukturierte Diagnostics |
| `metadata` | nein | host-neutrale Zusatzdaten |

Eine Route muss fachlich mindestens ein Ziel ueber `component`, `template` oder `redirect` beschreiben. Das Schema haelt diese Zielauswahl als `anyOf` sichtbar, ohne XRouter-spezifische Details vorzugeben.

## XRouter-Beispiel

```json
{
  "id": "overview",
  "path": "/",
  "title": "Overview",
  "router": "xtend.xrouter",
  "component": "pages.overview",
  "template": "pages.overview.content",
  "schedule": "route.visible.render",
  "params": {},
  "query": {},
  "lifecycle": {
    "enter": {
      "commandName": "route.overview.enter"
    },
    "leave": {
      "commandName": "route.overview.leave"
    }
  },
  "preferredCapabilities": [
    "navigation",
    "params",
    "query",
    "diagnostics"
  ]
}
```

## Nicht-XTend-Beispiel

`custom.router` steht hier exemplarisch fuer einen beliebigen nicht-XTend Router Adapter.

```json
{
  "id": "search",
  "path": "/search/:term",
  "title": "Search",
  "router": "custom.router",
  "component": "shared.badge",
  "schedule": {
    "endpointName": "route.visible.render",
    "priority": "visible"
  },
  "params": {
    "term": {
      "source": "path",
      "required": true
    }
  },
  "query": {
    "filter": {
      "source": "query",
      "default": "all"
    }
  },
  "lifecycle": {
    "beforeEnter": {
      "commandName": "search.beforeEnter"
    }
  }
}
```

## Backward Compatibility

Die Domain ist additiv:

- Dokumente ohne `routes` bleiben gueltig.
- Bestehende Route-Metadaten in `manifest.metadata.routes` koennen als Legacy-/Pilotdaten bestehen bleiben.
- Produktive DSL-Arbeit soll Route Records in `routes` fuehren und `manifest.metadata.routes` spaeter nur noch als Migrationsquelle lesen.
- Ein leeres `routes: []` ist gueltig und bedeutet: keine expliziten Route-Anforderungen.

## Schema-Entscheidung

`xtendrmt/rmt.schema.json` wird bewusst synchronisiert:

- Top-Level-Property `routes` referenziert `#/$defs/routes`.
- `#/$defs/route` beschreibt native Route Records.
- `#/$defs/routeParams`, `#/$defs/routeParam`, `#/$defs/routeLifecycle`, `#/$defs/componentSchedule`, `#/$defs/templateRef`, `#/$defs/bindings`, `#/$defs/capabilityList` und `#/$defs/diagnostic` bilden wiederverwendbare Bausteine.
- `x-xtendrmt.nativeDomainContracts` dokumentiert `xtend.rmt.routes-domain.v1` als WP-06-Artefakt-Referenz.

## Anschluss fuer Folgepakete

- `WP-07` kann `routes[*].schedule` gegen referenzierbare Schedule Policies haerten.
- `WP-09` kann eine Route Registry auf `RmtRouteDomainRecord` aufbauen.
- `WP-10` kann den produktiven XRouter Adapter auf `router: "xtend.xrouter"` und generische Route Records mappen.
- `WP-14` kann die Bestcase-Demo von `manifest.metadata.routes` auf native `routes` migrieren.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `routes` ist native Domain | erfuellt: Top-Level-Property ist optional und defaultet auf `[]` |
| Route Records sind router-unabhaengig | erfuellt: `router` ist Adapter-ID, nicht Kernelmodell oder XRouter-DOM-Struktur |
| `WP-10` kann XRouter darauf produktiv mappen | erfuellt: `RmtRouteDomainRecord` beschreibt `path`, `component`, `template`, `schedule`, `params`, `query`, `lifecycle` und Diagnostics |

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

`WP-E05-06` ist abgeschlossen. Die native `routes` Domain ist im RMT Schema additiv modelliert, in den Typ-Artefakten sichtbar und bereitet Schedule Policies, Route Registry, XRouter Adapter und die spaetere Bestcase-Demo-Migration auf router-neutrale Route Records vor.
