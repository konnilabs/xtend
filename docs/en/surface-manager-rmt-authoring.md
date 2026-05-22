# SurfaceManager RMT Authoring

Docs contract: `xtend.docs.surface-manager-rmt-authoring.v1`

The SurfaceManager is the XTend app-shell building block for multi-window UIs, side panels and later surface types in an SPA. `WP-SM-01` first defines the RMT authoring model; runtime components follow in the next packages.

## Decision

SurfaceManager is built as an RMT-native component family:

- `x-surface-manager`
- `x-surface-window`
- `x-side-panel`

Fabric remains underneath for lanes, fibers, diagnostics and telemetry. SurfaceManager does not replace Fabric.

## MVP Authoring

New SurfaceManager examples are written vNext-first. The compiler can still generate existing RMT `components` records with `metadata.surfaceManager` and `metadata.surface` from them:

```rmt
template workbench.surfaces {
  state workbench.selection type object initial null

  portal surface.root root "#workbench-root" layer surface

  surface workbench.manager kind workspace component x-surface-manager {
    portal surface.root

    lane visible weight 90 {
      mount x-surface-manager
      hydrate surface-manager from endpoint surface.visible.render
    }
  }

  surface workbench.inspector kind window component x-surface-window {
    source state workbench.selection
    portal surface.root

    lane user-blocking weight 95 {
      hydrate inspector-window from endpoint surface.user-blocking.open
    }

    lane transition weight 55 {
      hydrate inspector-layout from endpoint surface.transition.layout
    }
  }

  surface workbench.details kind panel component x-side-panel {
    portal surface.root

    lane visible weight 70 {
      hydrate details-panel from state workbench.selection
    }
  }
}
```

`xtend.surface` and a native RMT `surfaces` domain remain the runtime projection of this vNext path. Legacy `components[*].metadata.surface` is migration source and mirror, but no longer the preferred authoring form.

## Schedules

| Schedule | Lane | Purpose |
|----------|------|---------|
| `surface.visible.render` | `visible` | render manager and visible surface shell |
| `surface.user-blocking.open` | `user-blocking` | open surface and set focus |
| `surface.user-blocking.close` | `user-blocking` | close surface and restore focus |
| `surface.transition.layout` | `transition` | commit move, resize, docking and snap |
| `surface.background.persist` | `background` | persist layout snapshot |
| `surface.diagnostics.snapshot` | `diagnostics` | snapshot registry, stack and telemetry |
| `a11y.user-blocking.announce` | `user-blocking` | announce surface status for screenreaders |

## Fixture

The reference document is located at:

```text
tests/fixtures/rmt-surface-manager-workbench.rmt
```

It describes a shell-first workbench with two `x-surface-window` records and one `x-side-panel` record. The next documentation line should show the same workbench as an RMT vNext draft and keep the records only as compiler/compatibility output.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-surface-authoring --json
```

The gate checks `xtend.rmt.surface-authoring.v1`, the fixture, package/scaffold hooks, runner registration, docs and RMT core normalization without browser or network requirements.
