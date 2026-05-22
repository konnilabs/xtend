# Component UX App Authoring

Docs Contract: `xtend.docs.component-ux-app-authoring.v1`

This guide is for app authors who use XTend components in RMT-first apps. The app can be written completely in RMT vNext; XTend provides local Web Components and XTendRMT orchestrates shell, routes, templates, schedules and diagnostics.

## Ground Rules

- The app shell renders `shell-first`.
- XTend components are described in vNext as `surface ... component x-*` and compiled into `xtend.component` records.
- XRouter is connected through the router adapter.
- Templates preferably use `dom_descriptor` as generated output.
- Events are bound with `on ... -> action ...`.
- Hydration, Fabric lane, fiber and diagnostics remain schedulable metadata.
- The RMT kernel imports no XTend classes or XTend types.

Boundary:

```text
no-rmt-kernel-import-of-xtend-types
```

## Minimal Component Surface

```rmt
template settings.feedback {
  state settings.feedback.status type string initial "ready"

  selector settings.feedback.view from state settings.feedback.status {
    output StatusView
  }

  portal surface.root root "#settings-root" layer surface

  surface settings.feedback.status kind card component x-status {
    source selector settings.feedback.view
    portal surface.root

    lane visible weight 80 {
      mount x-status
      hydrate feedback-status from selector settings.feedback.view
    }
  }
}
```

The output still contains `xtend.component`, accessibility, style, schedule and Fabric metadata. The source you write is the vNext source.

## App Shell Pattern

```rmt
template dashboard.app {
  state dashboard.theme type string initial "dark"
  state dashboard.density type string initial "compact"
  state dashboard.motion type string initial "reduced-motion"

  action dashboard.refresh {
    emit dashboard.refresh.requested with action dashboard.refresh
  }

  portal surface.root root "#app-root" layer surface

  surface dashboard.page kind page component x-section {
    source state dashboard.theme
    portal surface.root

    lane visible weight 80 {
      hydrate dashboard-shell from endpoint xtendrmt.route.render
      hydrate settings-feedback-status from endpoint xtendrmt.component.mount
    }

    on click target refresh-button -> action dashboard.refresh {
      payload theme from state.dashboard.theme
      payload density from state.dashboard.density
      payload motion from state.dashboard.motion
    }
  }
}
```

## UX Rules for Apps

| Dimension | App Rule |
| --- | --- |
| Shell | Host page provides only the root, loader, manifest and RMT runtime |
| Routing | Routes come from RMT and are activated through XRouter |
| Theme | `light`, `dark`, `high-contrast` and `forced-colors` remain app states |
| Motion | `reduced-motion` must be visible all the way into overlays, feedback and media |
| Density | `comfortable`, `compact` and `dense` must not break layout |
| A11y | Route announcements, live regions, error regions and focus restore are part of the app |
| Performance | Hydration policies and Fabric lanes are schedule data, not host-specific logic |

## Gates for App Authors

```bash
node scripts/run_xtend_tests.js rmt-first-class-app --json
node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json
node scripts/run_xtend_tests.js component-ux-browser-smokes --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
node scripts/run_xtend_tests.js browser --json
```

For PRs, the shared fast path is:

```bash
npm run test:pr
```

## When an App Path Is Ready

An RMT-first XTend app path is considered ready when:

- the shell is not assembled manually from static XTend markup,
- components come through `xtend.component` records,
- route, theme, motion, density and hydration are visible in RMT,
- browser smokes cover the core journeys,
- the Component Shell Theme Matrix does not break,
- no external CDN or import-map dependencies are introduced.
