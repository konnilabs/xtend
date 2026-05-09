# XTend RMT First-Class App Authoring

- Status: Accepted
- Datum: 7. Mai 2026
- Typ: App Authoring Contract
- Contract: `xtend.rmt.first-class-app-authoring.v1`
- Report Contract: `xtend.rmt.first-class-app-authoring-report.v1`
- Workpackage: `development/WP-E10-04-RMT-App-Authoring-Contract-fuer-vollstaendige-XTend-Apps-spezifizieren.md`
- Epic: `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Fixture: `tests/fixtures/rmt-first-class-xtend-app.rmt`
- Bezug:
  - `development/XTend-Component-Contract-v2.md`
  - `development/XTend-TypeScript-Component-Source-Strategie.md`
  - `docs/xtendrmt-app-dsl.md`
  - `docs/xtendrmt-native-authoring.md`
  - `docs/xtendrmt-parsedown-docs.rmt`
  - `xtendrmt/rmt.schema.json`
  - `tests/rmt/rmt_first_class_app_authoring_suite.js`

## Zweck

Dieser Contract beschreibt, wie eine vollstaendige XTend-App als RMT-Dokument authored wird. Vollstaendig bedeutet:

- App Shell
- Header, Navigation und Router Host
- Routes
- XTend Component Records
- Templates und Slots
- Props, Attribute, Events und Commands
- Hydration Policies
- Schedules, Lanes und Budgets
- Fabric-, Telemetry-, A11y- und Performance-Metadaten
- Diagnostics- und State/Scheduler-Handoff

RMT wird dadurch zum App-Authoring-Modell. XTend UI bleibt das Web-Component-Produkt und XTendRMT bleibt der framework-agnostische Scheduler und Templating-Kernel.

## Leitentscheidung

Eine RMT-first XTend-App besteht aus nativen Top-Level-Domains:

```json
{
  "kind": "rmt_document",
  "version": "1.0",
  "manifest": {},
  "adapters": [],
  "components": [],
  "routes": [],
  "schedules": [],
  "templates": []
}
```

Manuelle Shell-Sonderlogik ist fuer neue XTend-Apps kein Zielpfad mehr. Die App Shell wird als `template` und/oder `component` Record beschrieben und vor Route-Content gerendert. Der Host-Adapter materialisiert diese Records.

## Required Domains

| Domain | Pflicht | Aufgabe |
|--------|---------|---------|
| `manifest` | ja | Dokument-ID, Namespace, Contract, Workpackage und Kernel Boundary |
| `adapters` | ja | Host-Faehigkeiten fuer XTend Components, XRouter und Scheduler/Diagnostics |
| `components` | ja | XTend Custom Elements und Component Metadata |
| `routes` | ja | XRouter Routes, Shell-, Component-, Template- und Schedule-Refs |
| `schedules` | ja | zentrale Scheduler Policies fuer Shell, Route, Component, Media, Input und Diagnostics |
| `templates` | ja | App Shell, Page Templates, Slots, Events und DOM Descriptor |

Template-only-Dokumente bleiben RMT-kompatibel. First-Class XTend Apps muessen diese Domains jedoch explizit fuehren.

## Required Adapters

| Adapter | Kind | Rolle |
|---------|------|-------|
| `xtend.component` | `component_adapter` | Manifest Lookup, Custom Elements, Props, Attributes, Slots, Events, Hydration und Fabric Context |
| `xtend.xrouter` | `router_adapter` | Route Registry, Navigation, Params, Query, Schedule Refs und Route Diagnostics |
| `rmt.state-scheduler-diagnostics` | `scheduler_adapter` | State Bridge, Scheduler Endpoints, Adapter Results, Performance Budgets und Diagnostics |

Alle Adapter sind `kernelVisible: false`. Der Kernel darf Records normalisieren und indizieren, aber keine XTend-Komponente, kein XRouter-Modul, kein `xstate` und keine Fabric Runtime importieren.

## Shell-First Rendering

RMT-first Apps rendern Shell-first; der maschinenlesbare Render-Mode bleibt `shell-first`:

1. `app.shell` Template normalisieren.
2. `app.shell` Component Record gegen `xtend.component` aufloesen.
3. `app.shell.render` Schedule planen.
4. Header, Navigation und Router Host in Shell-Slots materialisieren.
5. Route Content ueber XRouter und Component Adapter nachladen oder hydrieren.

Das erlaubt spaeter Rich HTML, Markdown, XPlayer-Tutorials oder andere Inhalte als scheduled Slots zu betreiben, ohne die Shell neu zu bauen.

## Component Records

XTend Component Records folgen `xtend.component.contract.v2` und dem bestehenden RMT Component Contract:

```json
{
  "id": "pages.settings",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-form",
  "schedule": "component.idle.hydrate",
  "props": {
    "label": "Settings"
  },
  "events": {
    "submit": {
      "command": "settings.save"
    }
  },
  "metadata": {
    "fabric": {
      "lane": "idle",
      "fiber": "component.hydrate",
      "telemetry": true
    }
  }
}
```

Authoring-Regeln:

- `adapter` referenziert einen Adapter Record.
- `tag` referenziert ein XTend Custom Element, bleibt aber Datenfeld.
- `props`, `attributes`, `slots` und `events` sind explizit.
- `events` binden DOM Custom Events an RMT Commands, nicht an Inline-JS.
- `schedule` referenziert eine zentrale Schedule Policy.
- Fabric-, Telemetry-, A11y- und Performance-Hints liegen in Metadata oder Contract-v2-Ableitungen.

## Route Records

Routes beschreiben Navigation und Render-Ziel, nicht DOM-Ausfuehrung:

```json
{
  "id": "settings",
  "path": "/settings",
  "router": "xtend.xrouter",
  "component": "pages.settings",
  "template": "pages.settings.template",
  "shell": "app.shell",
  "schedule": "route.transition.render"
}
```

Authoring-Regeln:

- `router` ist ein Adapter-Ref.
- `component` ist ein Component-Ref.
- `template` ist ein Template-Ref.
- `shell` ist der Shell-Template-Ref.
- `schedule` ist ein Schedule-Ref.
- XRouter-Registration bleibt Adapterarbeit.

## Template Records

Neue RMT-first XTend Apps bevorzugen `dom_descriptor`:

```json
{
  "id": "pages.settings.template",
  "mode": "dom_descriptor",
  "nodes": [
    {
      "tag": "x-form",
      "events": {
        "submit": "settings.save"
      },
      "slots": {
        "default": {
          "component": "settings.email"
        }
      }
    }
  ]
}
```

`html_fragment` bleibt fuer Migration erlaubt, braucht aber eine Trusted-DOM-Boundary. Neue First-Class Apps sollen DOM Descriptor nutzen, damit Slots, Components, Events und Commands strukturiert analysierbar bleiben.

## Schedule Policies

Mindest-Schedules fuer First-Class XTend Apps:

| Schedule | Endpoint | Lane | Zweck |
|----------|----------|------|-------|
| `app.shell.render` | `xtendrmt.shell.render` | `visible` | Shell-first Rendering |
| `route.visible.render` | `xtendrmt.route.render` | `visible` | Erstes Route Rendering |
| `route.transition.render` | `xtendrmt.route.render` | `transition` | Navigation und Route-Wechsel |
| `component.visible.mount` | `xtendrmt.component.mount` | `visible` | sichtbare Komponenten mounten |
| `component.idle.hydrate` | `xtendrmt.component.hydrate` | `idle` | nicht-kritische Hydration |
| `ui.user-blocking.input` | `xtendrmt.ui.user-blocking` | `user-blocking` | Eingabe- und Form-Events |
| `diagnostics.snapshot` | `xtendrmt.diagnostics.snapshot` | `diagnostics` | Diagnostics und Telemetry Snapshot |

Weitere Schedules wie `media.lazy.hydrate` sind erlaubt, wenn sie zentrale Policies bleiben und nicht in einzelne Komponenten dupliziert werden.

## Kernel Boundary

Verbindliche Boundary:

```text
no-rmt-kernel-import-of-xtend-types
```

Der RMT Kernel darf:

- Dokumente normalisieren
- Referenzen pruefen
- Runtime Registries erzeugen
- Schedules beschreiben
- Diagnostics erzeugen

Der RMT Kernel darf nicht:

- XTend Komponenten importieren
- XRouter registrieren
- `xstate` lesen oder schreiben
- Fabric ausfuehren
- DOM materialisieren
- HTML sanitizen
- Event Handler als Inline-JS ausfuehren

## Runtime-Handoff

Der produktive Handoff fuer eine RMT-first XTend-App lautet:

1. `createRmtFormat().normalizeDocument(document)`
2. `createRmtFormat().createRuntimeRegistries(normalizedDocument)`
3. XRouter Adapter konsumiert `routeRegistry.byRouter["xtend.xrouter"]`
4. XTend Component Adapter konsumiert `componentRegistry.byAdapter["xtend.component"]`
5. State/Scheduler/Diagnostics Bridge spiegelt Adapter Results und Scheduler-Endpoint-Signale
6. Fabric konsumiert Lane/Fiber/Telemetry-Kontext aus Component Contract v2 und RMT Metadata

## Abnahmefixture

Die Referenz liegt in:

```text
tests/fixtures/rmt-first-class-xtend-app.rmt
```

Sie deckt ab:

- `app.shell` als Shell-first Template
- `xtend.component` und `xtend.xrouter`
- Dashboard-, Settings- und Tutorial-Route
- `x-section`, `x-header`, `x-router`, `x-link`, `x-alert`, `x-form`, `x-input` und `x-player`
- Event-to-command Bindings
- Fabric Lane/Fiber Metadata
- User-blocking, visible, transition, idle, background und diagnostics Schedules

## Gate

```bash
node scripts/run_xtend_tests.js rmt-first-class-app --json
```

Der Gate prueft Fixture, Runtime-Registries, Referenzauflösung, Package-Metadaten, Scaffold-Metadaten und Dokumentationsanker.

## Handoff

| Paket | Handoff |
|-------|---------|
| `WP-E10-05` | Adapter/Fabric/Lane-Ingestion kann gegen vollstaendige App Records arbeiten |
| `WP-E10-07` | Builder kann App-Fixture- und Component-Contract-Blueprints ableiten |
| `WP-E10-12` | Component Lab und RMT Inspector koennen App-Dokumente inspizieren |
| `WP-E10-13` | RMT-first Demo-App kann ohne manuelle Shell-Sonderlogik gebaut werden |
| `WP-E10-15` | Browser-, A11y-, Performance- und Visual-Gates koennen App-Level-Pfade pruefen |

## Akzeptanzkriterien

- `xtend.rmt.first-class-app-authoring.v1` ist dokumentiert
- ein vollstaendiges RMT-first XTend-App-Fixture liegt vor
- Adapter, Components, Routes, Templates und Schedules sind native Domains
- Shell-first Rendering ist beschrieben und gatebar
- Event-to-command Binding ist strukturiert beschrieben
- XTend Component Contract v2 ist referenziert
- RMT Kernel Boundary bleibt frei von XTend-Imports
- lokaler Gate `rmt-first-class-app` ist vorhanden
