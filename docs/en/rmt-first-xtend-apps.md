# RMT-First XTend Apps

Docs Contract: `xtend.docs.rmt-first-xtend-apps.v1`

This guide describes the Epic 10 target path: a complete XTend app is described
as an RMT vNext document. XTend provides local Web Components; RMT provides the
shell, routes, templates, components, schedules, hydration policies, Fabric
lanes, and diagnostics.

The underlying authoring contract is:

```text
xtend.rmt.first-class-app-authoring.v1
```

## Core Rules

- RMT vNext is the app authoring model.
- XTend components are described through surfaces with `component x-*` and
  compiled into `xtend.component` records.
- XRouter is connected through `xtend.xrouter`.
- Templates preferably use `dom_descriptor` as generated output.
- Event bindings use `on ... -> action ...`.
- Fabric, lane, and fiber hints come from `lane` and lifecycle clauses.
- The RMT kernel imports no XTend classes or XTend types.

The boundary remains:

```text
no-rmt-kernel-import-of-xtend-types
```

## Minimal Structure

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

The compiler turns this into `xtend.component`, `xtend.xrouter`,
`rmt.state-scheduler-diagnostics`, `dom_descriptor` templates, and
schedule/lane records. These JSON records are runtime mirrors, not the primary
authoring path.

## Reference Paths

- Contract: `development/XTend-RMT-First-Class-App-Authoring.md`
- Fixture: `tests/fixtures/rmt-first-class-xtend-app.rmt`
- Demo app: `xtendrmt/rmt-first-demo-app.rmt`
- Browser smoke: `tests/browser/fixtures/rmt-first-demo-app-smoke.html`
- Gate: `node scripts/run_xtend_tests.js rmt-first-class-app --json`
- Demo gate: `node scripts/run_xtend_tests.js rmt-first-demo-app --json`

## Fabric and Telemetry

Components receive Fabric context through adapter injection. The canonical
boundary is:

```text
adapter-injection-via-xtend-component-resolveFabricContext
```

`window.XTendFabric` can be used by hosts, but it is not the contract surface
of a component.

## Release Handoff

The completion of Epic 10 is documented in
[Epic 10 Release Handoff](./epic10-release-handoff.md). That gate chain decides
whether an RMT-first XTend app path is release-ready enough for a candidate.

Since `WP-E13-09`, [RMT Production Readiness](./rmt-production-readiness.md)
bundles this path under `xtend.epic13.rmt-production-readiness.v1`:
shell-first app shell, routing, components, Fabric/lanes, lifecycle telemetry,
diagnostics, and artifact parity are connected as an RC1 gate. `WP-E13-10`
completed [Docs RMT Production Hardening](./docs-rmt-production-hardening.md);
`WP-E13-11` completed
[Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
and `xtend.epic13.trusted-dom-boundary.v1`. `WP-E13-12` completed
[RC1 Migration Notes](./rc1-migration-notes.md) and
`xtend.epic13.rc1-migration-notes-semver.v1`. `WP-E13-13` completed
[RC1 Gate Matrix and CI Handoff](./rc1-gate-matrix-ci-handoff.md) and
`xtend.epic13.rc1-gate-matrix-ci-handoff.v1`.

## Component UX Authoring

Since `WP-E11-16`, [Component UX App Authoring](./component-ux-app-authoring.md)
extends this guide with visible UX rules for RMT-first apps. This includes
theme, motion, density, viewports, browser smokes, and the Component Shell
Theme Matrix `xtend.epic11.component-shell-theme-matrix.v1`.

Since `WP-E11-17`, [Component Long-Tail Migration](./component-long-tail-migration.md)
describes which legacy and infrastructure components are hardened first for
RMT-first app compatibility.

The local docs gate is:

```bash
node scripts/run_xtend_tests.js component-ux-authoring-docs --json
node scripts/run_xtend_tests.js component-long-tail-migration --json
```
