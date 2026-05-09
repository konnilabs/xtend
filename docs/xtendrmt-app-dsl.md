# XTendRMT App-DSL Reference

- Status: aktuell nach Epic 05 Abschluss
- Contract: `xtend.docs.xtendrmt-app-dsl.v1`
- Schema-Quelle: `xtendrmt/rmt.schema.json`
- Normalizer: `createRmtFormat().normalizeDocument(...)`

## Zweck

Die App-DSL beschreibt eine renderbare Anwendung als RMT-Dokument. Sie ist kein XTend-spezifisches Format. XTend UI, XRouter, Vanilla JS oder andere Hosts werden ueber Adapter Records angebunden.

Seit `WP-E13-09` buendelt [RMT Production Readiness](./rmt-production-readiness.md) diese App-DSL unter `xtend.epic13.rmt-production-readiness.v1` als RC1-Schnitt fuer Shell-first App Shell, native Routes, Components, Fabric/Lanes, Lifecycle Telemetry, Diagnostics und Artifact Parity.

## Minimales Dokument

```json
{
  "kind": "rmt_document",
  "version": "1.0",
  "documentId": "app.shell",
  "namespace": "app",
  "adapters": [],
  "components": [],
  "routes": [],
  "schedules": [],
  "templates": []
}
```

Template-only-Dokumente bleiben gueltig. Neue App-DSL-Dokumente sollen operative Host-Daten aber in nativen Top-Level-Domains fuehren.

## Native Domains

| Domain | Aufgabe |
|--------|---------|
| `adapters` | Host-Faehigkeiten, Runtime Surface, Capability Negotiation |
| `components` | fachliche Component Records, Host Adapter und Hydration-Hinweise |
| `routes` | Navigation, Route-Ziele, Query/Params und Schedule References |
| `schedules` | wiederverwendbare Scheduler Policies |
| `templates` | Markup, Props, Slots, Bindings und Hydration Contracts |

`manifest.metadata` bleibt fuer Beschreibung, Handoff, Historie und Demo-Notizen gueltig. Neue operative Routes, Components und Schedules gehoeren nicht mehr in `manifest.metadata`.

## Adapter Records

```json
{
  "id": "xtend.xrouter",
  "kind": "router_adapter",
  "runtimeSurface": ["esm", "browser_classic"],
  "providedCapabilities": ["routes", "navigation", "params", "query", "scheduleRefs"],
  "kernelVisible": false
}
```

Stabile Adapter-IDs:

- `xtend.xrouter`
- `xtend.component`
- `rmt.state-scheduler-diagnostics`
- `vanilla.component`

`kernelVisible: false` ist fuer host-spezifische Adapterdaten der Normalfall. Der Kernel darf diese Records indizieren, aber keine Host-Runtime laden.

## Component Records

```json
{
  "id": "settings.card",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-card",
  "schedule": "component.idle.hydrate",
  "props": {
    "label": "Settings"
  },
  "attributes": {
    "data-host": "xtend"
  },
  "hydration": {
    "mode": "runtime_render",
    "ownershipMode": "managed_subtree"
  }
}
```

Der Normalizer macht daraus Runtime-Registry-Eintraege, die ueber `componentRegistry.byAdapter["xtend.component"]` und `componentRegistry.byTag["x-card"]` konsumierbar sind.

## Route Records

```json
{
  "id": "settings",
  "path": "/settings",
  "router": "xtend.xrouter",
  "component": "settings.card",
  "title": "Settings",
  "documentTitle": "Settings | XTend App",
  "metaDescription": "Einstellungen der XTend RMT App",
  "metaKeywords": ["xtend", "rmt", "routing"],
  "template": "settings.shell",
  "schedule": "route.visible.render",
  "metadata": {
    "seo": {
      "titleTemplate": "{{title}} | XTend App"
    }
  }
}
```

Der Normalizer macht daraus Runtime-Registry-Eintraege, die ueber `routeRegistry.byRouter["xtend.xrouter"]`, `routeRegistry.byId["settings"]` und `routeRegistry.byPath["/settings"]` konsumierbar sind. `title`, `documentTitle`, `titleTemplate`, `metaDescription` und `metaKeywords` bleiben deklarative Route-Metadaten: XRouter schreibt daraus `document.title` sowie `description`/`keywords`, ohne dass RMT XTend oder XRouter importiert.

## Schedule Records

```json
{
  "id": "route.visible.render",
  "endpointName": "xtendrmt.route.render",
  "scope": "app.route.render",
  "lane": "visible",
  "priority": 80,
  "deadlineMs": 250,
  "preferIdle": false,
  "budgetClass": "interactive"
}
```

Erprobte Endpoint-Namen:

- `xtendrmt.route.render`
- `xtendrmt.component.mount`
- `xtendrmt.component.hydrate`
- `xtendrmt.vanilla.mount`
- `xtendrmt.diagnostics.snapshot`
- `xtendrmt.template.inspect`

## Template Records und Trusted DOM

Neue Template Records sollen strukturierte Daten mit `dom_descriptor` bevorzugen:

```json
{
  "id": "settings.shell",
  "mode": "dom_descriptor",
  "nodes": [
    { "tag": "x-card", "attributes": { "label": "Settings" } }
  ]
}
```

`html_fragment` bleibt kompatibel, braucht aber eine explizite Trusted-DOM-Boundary:

```json
{
  "id": "settings.shell.legacy",
  "mode": "html_fragment",
  "markup": "<x-card label=\"Settings\"></x-card>",
  "security": {
    "markupClass": "htmlFragment",
    "trustBoundary": "xtend.security.sanitizing-boundary.v1",
    "sink": "trustedDomBoundary"
  }
}
```

Der Kernel darf solche Records normalisieren und schedulen. Sanitizing, Trusted DOM und konkrete DOM-Sinks bleiben Host-Adapter-Aufgabe. Siehe [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md).

## Shell-first Host Apps

Die Docs-App nutzt diesen Pfad produktiv als Shell-first-Pilot. `docs/xtendrmt-parsedown-docs.rmt` beschreibt `docs.app.shell` als `dom_descriptor`, `docs.header.search` als Header-Search-Slot-Template und `docs.media.lazy` als future-ready Slot fuer XPlayer-Tutorials. `docs/utils/pageloader.js` rendert zuerst die RMT-Shell und setzt Parsedown-HTML anschliessend nur noch in den `data-rmt-slot="content"` Slot.

Wichtig: Auch in diesem Modus bleibt RMT framework-agnostisch. Parsedown, Rich-HTML-Sinks, XPlayer-Lazy-Loading und konkrete DOM-Events werden vom Host-Adapter ausgefuehrt. RMT stellt Shell-Records, Slots, Schedules und Diagnostics bereit.

## RMT-first XTend Apps

Ab Epic 10 ist das App-Authoring fuer vollstaendige XTend-Apps als Contract `xtend.rmt.first-class-app-authoring.v1` beschrieben. Das Ziel ist eine App, deren Shell, Routes, Components, Templates, Events, Commands, Hydration Policies, Fabric-Lanes und Diagnostics komplett in RMT stehen.

Der Referenzpfad liegt in `tests/fixtures/rmt-first-class-xtend-app.rmt`. Der Gate ist:

```bash
node scripts/run_xtend_tests.js rmt-first-class-app --json
```

Der Contract bleibt bewusst host-neutral. RMT kennt `xtend.component`, `xtend.xrouter` und `rmt.state-scheduler-diagnostics` als Adapter-Records, importiert aber keine XTend-Komponenten und kein XRouter-Modul in den Kernel. Details stehen in `development/XTend-RMT-First-Class-App-Authoring.md`.

Der kanonische Entwicklerguide fuer komplette XTend Apps liegt in [RMT-first XTend Apps](./rmt-first-xtend-apps.md). Der Epic-10-Abschluss und die Release-Gates sind in [Epic 10 Release Handoff](./epic10-release-handoff.md) dokumentiert.

## Component Fabric Context

XTend Components koennen Fabric-Hints in `metadata.fabric` tragen:

```json
{
  "id": "pages.settings",
  "adapter": "xtend.component",
  "tag": "x-form",
  "schedule": "component.idle.hydrate",
  "metadata": {
    "fabric": {
      "lane": "idle",
      "fiber": "component.hydrate",
      "telemetry": true
    }
  }
}
```

Der produktive Adapter loest diese Daten ueber `xtend.component.fabric-lane-ingestion.v2` auf. RMT Schedule Records haben Vorrang vor Component Metadata, Runtime Overrides, Static Contracts und Scaffold Defaults. Der Gate ist `node scripts/run_xtend_tests.js rmt-component-fabric-ingestion --json`.

## Component Lifecycle Telemetry

Der Adapter erzeugt ab `xtend.component.lifecycle-telemetry.v1` Lifecycle Records fuer Component-Arbeit. RMT-Dokumente muessen dafuer keinen XTend-Code importieren; sie liefern nur Component-, Route-, Schedule- und Fabric-Kontext. Der Host kann `telemetryCollector`, `recordTelemetry` oder eine Fabric-Instanz uebergeben.

```js
const records = [];
adapter.mountComponent(root, 'pages.settings', model, {
  mapping,
  telemetryCollector: records
});

const snapshot = fabric.createTelemetrySnapshot({
  componentTelemetry: records
});
```

`snapshot.componentTelemetry` aggregiert `mount`, `hydrate`, `render`, `update`, `event`, `unmount` und `error` nach Operation, Component und Lane. Component-Fehler, Deadline-Ueberschreitungen und explizite `backpressureSignal` Metadata koennen Backpressure erzeugen. Der Gate ist `node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json`.

## Runtime Registry

```js
const format = createRmtFormat();
const normalizedDocument = format.normalizeDocument(document);
const registry = format.createRuntimeRegistries(normalizedDocument, {
  requiredRoutes: ["settings", "/settings"],
  requiredComponents: ["settings.card", "x-card"]
});
```

Die Registry ist die konsumierbare Grenze zwischen DSL und Adapter. Adapter lesen Registry-Eintraege, nicht rohe Demo-Metadaten.

## Diagnostics

Der App-DSL-Normalizer erzeugt Diagnostics, statt Host-Ausfuehrung zu erzwingen. Wichtige Gruppen:

- `rmt.dsl.reference.*` fuer fehlende oder ungueltige Referenzen
- `rmt.runtime.registry.*` fuer Registry-Konflikte oder fehlende Required-Refs
- `rmt.xrouter.*` fuer Route-Mapping und Navigation
- `rmt.xtend.component.*` fuer Component-Mapping, Mounting und Hydration
- `rmt.bridge.*` fuer State-, Scheduler- und Diagnostics-Bridge

## Review-Checkliste

- `adapters`, `components`, `routes` und `schedules` sind native Top-Level-Domains.
- Routes referenzieren Components und Schedules nur per ID.
- Components referenzieren Host Adapter nur per ID.
- Schedule Policies sind zentral und wiederverwendbar.
- XTend-spezifische Daten bleiben ausserhalb des Kernels.
- Nicht-XTend Hosts erhalten eigene Adapter statt XTend-Fallbacks.
- `node scripts/run_xtend_tests.js rmt-compatibility --json` laeuft.
