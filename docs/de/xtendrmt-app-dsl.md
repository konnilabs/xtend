# XTendRMT App-DSL Reference

- Status: aktuell nach Epic 05 Abschluss, vNext-first aktualisiert
- Contract: `xtend.docs.xtendrmt-app-dsl.v1`
- Schema-Quelle: `xtendrmt/rmt.schema.json`
- Normalizer: `createRmtFormat().normalizeDocument(...)`

## Zweck

Die App-DSL beschreibt eine renderbare Anwendung als RMT-Dokument. Neue
Authoring-Arbeit nutzt RMT vNext; Legacy-/App-DSL-JSON ist weiterhin der
normalisierte Core-Output, Runtime Registry und Compatibility Surface. XTend UI,
XRouter, Vanilla JS oder andere Hosts werden ueber Adapter Records angebunden,
ohne dass der Kernel Host-Runtime importiert.

Seit `WP-E13-09` buendelt [RMT Production
Readiness](./rmt-production-readiness.md) diese App-DSL unter
`xtend.epic13.rmt-production-readiness.v1` als RC1-Schnitt fuer Shell-first App
Shell, native Routes, Components, Fabric/Lanes, Lifecycle Telemetry,
Diagnostics und Artifact Parity.

## Minimales vNext-Dokument

```rmt
template app.shell {
  state app.ready type boolean initial true

  portal surface.root root "#app-root" layer surface

  surface app.home kind page component x-section {
    source state app.ready
    portal surface.root

    lane visible weight 80 {
      hydrate app-shell from state app.ready
    }
  }
}
```

Der Compiler senkt diese Quelle in Core-Domains wie `adapters`, `components`,
`routes`, `schedules`, `surfaces` und `templates`. Diese Domains sind fuer
Runtime-Adapter stabil, aber nicht mehr die bevorzugte Schreiboberflaeche.

## Native Domains als Compiler-Output

| Domain | Aufgabe |
|--------|---------|
| `adapters` | Host-Faehigkeiten, Runtime Surface, Capability Negotiation |
| `components` | fachliche Component Records, Host Adapter und Hydration-Hinweise |
| `routes` | Navigation, Route-Ziele, Query/Params und Schedule References |
| `schedules` | wiederverwendbare Scheduler Policies |
| `templates` | `dom_descriptor`, Props, Slots, Bindings und Hydration Contracts |
| `surfaces` | SurfaceManager-, Window-, Panel- und Overlay-Handoffs |

`manifest.metadata` bleibt fuer Beschreibung, Handoff, Historie und Demo-Notizen
gueltig. Neue operative Routes, Components und Schedules gehoeren in vNext-
Source und werden daraus in die Registry projiziert.

## Adapter Records

Adapter werden in vNext implizit durch Surface-, Route- und Endpoint-Nutzung
sichtbar. Die Registry enthaelt danach stabile Adapter Records fuer Hosts:

- `xtend.xrouter`
- `xtend.component`
- `xtend.surface`
- `rmt.state-scheduler-diagnostics`
- `vanilla.component`

`kernelVisible: false` ist fuer host-spezifische Adapterdaten der Normalfall.
Der Kernel darf diese Records indizieren, aber keine Host-Runtime laden.

## Component Records

Ein vNext-Surface beschreibt das fachliche Host-Element:

```rmt
template settings.components {
  portal surface.root root "#settings-root" layer surface

  surface settings.card kind card component x-card {
    portal surface.root

    lane visible weight 80 {
      mount x-card
      hydrate settings-card from endpoint xtendrmt.component.hydrate
    }
  }
}
```

Der Normalizer macht daraus Runtime-Registry-Eintraege, die ueber
`componentRegistry.byAdapter["xtend.component"]` und
`componentRegistry.byTag["x-card"]` konsumierbar sind.

## Route Records

Route-Metadaten bleiben deklarativ und koennen an Surfaces gekoppelt werden:

```rmt
template settings.routes {
  state settings.tab type string initial "profile"

  portal surface.root root "#app-root" layer surface

  surface settings.page kind page component x-section {
    source state settings.tab
    portal surface.root

    lane visible weight 80 {
      hydrate route-view from endpoint xtendrmt.route.render
      hydrate settings-shell from state settings.tab
    }
  }
}
```

Der Normalizer erzeugt daraus Route- und Schedule-Indizes fuer
`routeRegistry.byRouter["xtend.xrouter"]`, `routeRegistry.byId[...]` und
`routeRegistry.byPath[...]`. `title`, `documentTitle`, `titleTemplate`,
`metaDescription` und `metaKeywords` bleiben deklarative Route-Metadaten:
XRouter schreibt daraus `document.title` sowie `description`/`keywords`, ohne
dass RMT XTend oder XRouter importiert.

## Schedule Records

Schedules sind in vNext `lane`- und Lifecycle-Klauseln:

```rmt
template scheduler.page {
  portal surface.root root "#app-root" layer surface

  surface app.shell kind page component x-section {
    portal surface.root

    lane visible weight 80 {
      hydrate route-shell from endpoint xtendrmt.route.render
    }

    lane idle weight 20 {
      hydrate help-panel from endpoint xtendrmt.component.hydrate
    }
  }
}
```

Erprobte Endpoint-Namen bleiben:

- `xtendrmt.route.render`
- `xtendrmt.component.mount`
- `xtendrmt.component.hydrate`
- `xtendrmt.vanilla.mount`
- `xtendrmt.diagnostics.snapshot`
- `xtendrmt.template.inspect`

## Template Records und Trusted DOM

Neue Templates werden aus vNext-Surfaces und Slots in `dom_descriptor` Output
gesenkt:

```rmt
template settings.template {
  portal surface.root root "#settings-root" layer surface

  surface settings.shell kind page component x-card {
    portal surface.root

    lane visible weight 80 {
      hydrate settings-card from endpoint xtendrmt.component.hydrate {
        slot header hydrate settings-header
        slot body hydrate settings-body
      }
    }
  }
}
```

`html_fragment` bleibt kompatibel, braucht aber eine explizite
Trusted-DOM-Boundary:

```rmt
template settings.legacyHtml {
  surface settings.legacy kind card component x-card {
    lane visible weight 60 {
      hydrate legacy-fragment from endpoint docs.parse {
        trust boundary "xtend.security.sanitizing-boundary.v1"
        sanitize html_fragment
      }
    }
  }
}
```

Der Kernel darf solche Records normalisieren und schedulen. Sanitizing, Trusted
DOM und konkrete DOM-Sinks bleiben Host-Adapter-Aufgabe. Siehe [Trusted DOM und
Sanitizing](./trusted-dom-sanitizing.md).

## Shell-first Host Apps

Die Docs-App nutzt diesen Pfad produktiv als Shell-first-Pilot.
`docs/xtendrmt-parsedown-docs.rmt` beschreibt `docs.app.shell` als
`dom_descriptor`, `docs.header.search` als Header-Search-Slot-Template und
`docs.media.lazy` als future-ready Slot fuer XPlayer-Tutorials.
`docs/utils/pageloader.js` rendert zuerst die RMT-Shell und setzt
Parsedown-HTML anschliessend nur noch in den `data-rmt-slot="content"` Slot.

Wichtig: Auch in diesem Modus bleibt RMT framework-agnostisch. Parsedown,
Rich-HTML-Sinks, XPlayer-Lazy-Loading und konkrete DOM-Events werden vom
Host-Adapter ausgefuehrt. RMT stellt Shell-Records, Slots, Schedules und
Diagnostics bereit.

## RMT-first XTend Apps

Ab Epic 10 ist das App-Authoring fuer vollstaendige XTend-Apps als Contract
`xtend.rmt.first-class-app-authoring.v1` beschrieben. Das Ziel ist eine App,
deren Shell, Routes, Components, Templates, Events, Commands, Hydration
Policies, Fabric-Lanes und Diagnostics komplett in RMT stehen.

Der Referenzpfad liegt in `tests/fixtures/rmt-first-class-xtend-app.rmt`. Der
Gate ist:

```bash
node scripts/run_xtend_tests.js rmt-first-class-app --json
```

Der Contract bleibt bewusst host-neutral. RMT kennt `xtend.component`,
`xtend.xrouter` und `rmt.state-scheduler-diagnostics` als Adapter-Records,
importiert aber keine XTend-Komponenten und kein XRouter-Modul in den Kernel.
Details stehen in `development/XTend-RMT-First-Class-App-Authoring.md`.

Der kanonische Entwicklerguide fuer komplette XTend Apps liegt in [RMT-first
XTend Apps](./rmt-first-xtend-apps.md). Der Epic-10-Abschluss und die
Release-Gates sind in [Epic 10 Release Handoff](./epic10-release-handoff.md)
dokumentiert.

## Component Fabric Context

XTend Components koennen Fabric-Hints aus vNext-Lanes und Legacy-Metadata
erhalten:

```rmt
template pages.settings {
  portal surface.root root "#app-root" layer surface

  surface pages.settings kind page component x-form {
    portal surface.root

    lane idle weight 40 {
      hydrate settings-form from endpoint xtendrmt.component.hydrate
    }
  }
}
```

Der produktive Adapter loest diese Daten ueber
`xtend.component.fabric-lane-ingestion.v2` auf. RMT Schedule Records haben
Vorrang vor Component Metadata, Runtime Overrides, Static Contracts und
Scaffold Defaults. Der Gate ist
`node scripts/run_xtend_tests.js rmt-component-fabric-ingestion --json`.

## Component Lifecycle Telemetry

Der Adapter erzeugt ab `xtend.component.lifecycle-telemetry.v1` Lifecycle
Records fuer Component-Arbeit. RMT-Dokumente muessen dafuer keinen XTend-Code
importieren; sie liefern nur Component-, Route-, Schedule- und Fabric-Kontext.
Der Host kann `telemetryCollector`, `recordTelemetry` oder eine Fabric-Instanz
uebergeben.

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

`snapshot.componentTelemetry` aggregiert `mount`, `hydrate`, `render`, `update`,
`event`, `unmount` und `error` nach Operation, Component und Lane.
Component-Fehler, Deadline-Ueberschreitungen und explizite
`backpressureSignal` Metadata koennen Backpressure erzeugen. Der Gate ist
`node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json`.

Hosts koennen Fabric Snapshots direkt an die produktive RMT Bridge uebergeben:

```js
bridge.recordTelemetrySnapshot(snapshot, {
  scheduleRef: "diagnostics.snapshot"
});
```

Die Bridge spiegelt daraus `rmt.telemetry.lastSnapshot` und
`rmt.backpressure.*` und plant bei Bedarf den Diagnostics-Snapshot-Endpunkt.

## Runtime Registry

Die Registry ist die konsumierbare Grenze zwischen DSL und Adapter. Adapter
lesen Registry-Eintraege, nicht rohe Demo-Metadaten:

```js
const format = createRmtFormat();
const normalizedDocument = format.normalizeDocument(document);
const registry = format.createRuntimeRegistries(normalizedDocument, {
  requiredRoutes: ["settings", "/settings"],
  requiredComponents: ["settings.card", "x-card"]
});
```

## Diagnostics

Der App-DSL-Normalizer erzeugt Diagnostics, statt Host-Ausfuehrung zu
erzwingen. Wichtige Gruppen:

- `rmt.dsl.reference.*` fuer fehlende oder ungueltige Referenzen
- `rmt.runtime.registry.*` fuer Registry-Konflikte oder fehlende Required-Refs
- `rmt.xrouter.*` fuer Route-Mapping und Navigation
- `rmt.xtend.component.*` fuer Component-Mapping, Mounting und Hydration
- `rmt.bridge.*` fuer State-, Scheduler- und Diagnostics-Bridge

## Review-Checkliste

- App-Shell-Beispiele sind `rmt` und vNext-first.
- Runtime-Registry-JSON ist als generierter Output oder Compatibility Surface
  eingeordnet.
- Routes referenzieren Components und Schedules nur per ID.
- Components referenzieren Host Adapter nur per ID.
- Schedule Policies sind zentral und wiederverwendbar.
- XTend-spezifische Daten bleiben ausserhalb des Kernels.
- Nicht-XTend Hosts erhalten eigene Adapter statt XTend-Fallbacks.
- `node scripts/run_xtend_tests.js rmt-compatibility --json` laeuft.
