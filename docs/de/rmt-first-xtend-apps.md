# RMT-first XTend Apps

Docs Contract: `xtend.docs.rmt-first-xtend-apps.v1`

Dieser Guide beschreibt den Zielpfad aus Epic 10: Eine vollstaendige XTend App
wird als RMT-vNext-Dokument beschrieben. XTend liefert lokale Web Components,
RMT liefert Shell, Routes, Templates, Components, Schedules, Hydration
Policies, Fabric-Lanes und Diagnostics.

Der zugrunde liegende Authoring Contract ist:

```text
xtend.rmt.first-class-app-authoring.v1
```

## Grundregeln

- RMT vNext ist App-Authoring-Modell.
- XTend-Komponenten werden ueber Surfaces mit `component x-*` beschrieben und
  in `xtend.component` Records kompiliert.
- XRouter wird ueber `xtend.xrouter` angebunden.
- Templates nutzen bevorzugt `dom_descriptor` als generierten Output.
- Event Bindings laufen als `on ... -> action ...`.
- Fabric-, Lane- und Fiber-Hints kommen aus `lane`- und Lifecycle-Klauseln.
- Der RMT Kernel importiert keine XTend-Klassen oder XTend-Typen.

Die Boundary bleibt:

```text
no-rmt-kernel-import-of-xtend-types
```

## Minimalstruktur

```rmt
template settings.app {
  state settings.status type string initial "ready"

  selector settings.feedback from state settings.status {
    output StatusView
  }

  action settings.refresh {
    reduce state.settings.status = "refreshing"
    emit settings.refresh.requested with action settings.refresh
  }

  portal surface.root root "#app-root" layer surface

  surface settings.status kind card component x-status {
    source selector settings.feedback
    portal surface.root

    lane visible weight 80 {
      mount x-status
      hydrate settings-status from selector settings.feedback
    }

    on click target refresh-button -> action settings.refresh {
      payload source from target.dataset.action
    }
  }
}
```

Der Compiler erzeugt daraus `xtend.component`, `xtend.xrouter`,
`rmt.state-scheduler-diagnostics`, `dom_descriptor` Templates und
Schedule-/Lane-Records. Diese JSON-Records sind Runtime-Mirror, nicht der
primaere Authoring-Pfad.

## Referenzpfade

- Contract: `development/XTend-RMT-First-Class-App-Authoring.md`
- Fixture: `tests/fixtures/rmt-first-class-xtend-app.rmt`
- Demo-App: `xtendrmt/rmt-first-demo-app.rmt`
- Browser-Smoke: `tests/browser/fixtures/rmt-first-demo-app-smoke.html`
- Gate: `node scripts/run_xtend_tests.js rmt-first-class-app --json`
- Demo-Gate: `node scripts/run_xtend_tests.js rmt-first-demo-app --json`

## Fabric und Telemetry

Komponenten erhalten Fabric-Kontext ueber Adapter Injection. Die kanonische
Boundary ist:

```text
adapter-injection-via-xtend-component-resolveFabricContext
```

`window.XTendFabric` kann durch Hosts genutzt werden, ist aber nicht die
Contract-Oberflaeche einer Komponente.

## Release-Handoff

Der Abschluss von Epic 10 wird in [Epic 10 Release
Handoff](./epic10-release-handoff.md) dokumentiert. Die dortige Gate-Kette
entscheidet, ob ein RMT-first XTend App-Pfad releasefaehig genug fuer einen
Kandidaten ist.

Seit `WP-E13-09` buendelt [RMT Production
Readiness](./rmt-production-readiness.md) diesen Pfad unter
`xtend.epic13.rmt-production-readiness.v1`: Shell-first App Shell, Routing,
Components, Fabric/Lanes, Lifecycle Telemetry, Diagnostics und Artifact Parity
sind als RC1-Gate verbunden. `WP-E13-10` hat [Docs RMT Production
Hardening](./docs-rmt-production-hardening.md) abgeschlossen; `WP-E13-11` hat
[Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
und `xtend.epic13.trusted-dom-boundary.v1` abgeschlossen. `WP-E13-12` hat [RC1
Migration Notes](./rc1-migration-notes.md) und
`xtend.epic13.rc1-migration-notes-semver.v1` abgeschlossen. `WP-E13-13` hat
[RC1 Gate Matrix und CI-Handoff](./rc1-gate-matrix-ci-handoff.md) und
`xtend.epic13.rc1-gate-matrix-ci-handoff.v1` abgeschlossen.

## Component UX Authoring

Seit `WP-E11-16` ergaenzt [Component UX App Authoring](./component-ux-app-authoring.md)
diesen Guide um sichtbare UX-Regeln fuer RMT-first Apps. Dazu gehoeren Theme,
Motion, Density, Viewports, Browser-Smokes und die Component Shell Theme Matrix
`xtend.epic11.component-shell-theme-matrix.v1`.

Seit `WP-E11-17` beschreibt [Component Long-Tail
Migration](./component-long-tail-migration.md), welche Legacy- und
Infrastrukturkomponenten zuerst fuer RMT-first App-Kompatibilitaet
nachgehaertet werden.

Der lokale Docs-Gate lautet:

```bash
node scripts/run_xtend_tests.js component-ux-authoring-docs --json
node scripts/run_xtend_tests.js component-long-tail-migration --json
```
