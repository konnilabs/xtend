# Component UX Authoring

Docs contract: `xtend.docs.component-ux-authoring.v1`

This guide is the canonical working guide for XTend component authors after `WP-E11-16`. It turns the Epic 11 contracts into concrete rules for new and modernized web components.

## Principle

An XTend component is UX-ready only when its visible shell, styling, a11y, performance, component network, RMT authorability and browser-close smokes fit together. Individual components may stay small, but their contracts must be complete.

The technical boundary remains:

```text
no-rmt-kernel-import-of-xtend-types
```

RMT may schedule, render and configure XTend components. The RMT kernel, however, imports no XTend classes or XTend types.

## Required Contracts

| Contract | Purpose | Gate |
| --- | --- | --- |
| `xtend.component.shell.v1` | root, DOM mode, states, slots, parts, focus and lifecycle | `component-shell-contract` |
| `xtend.component.styling.v1` | tokens, CSS parts, variants, size, density and theme bridges | `component-styling-contract` |
| `xtend.component.runtime-a11y.v1` | keyboard, focus, ARIA, screenreader and high contrast | `runtime-a11y-contract` |
| `xtend.component.ux-performance.v1` | shell, hydration, render, event and interaction budgets | `component-ux-performance` |
| `xtend.component.network.v1` | events, commands, form association, router context and feedback | `component-network-contract` |
| `xtend.rmt.shell-authoring.v1` | shell, style, a11y, variants, commands and events in RMT | `rmt-shell-authoring-ux` |
| `xtend.epic11.component-lab-ux-inspector.v1` | preview, RMT inspector, state, a11y, performance and source links | `component-lab-ux-inspector` |
| `xtend.epic11.component-ux-browser-smokes.v1` | real UX journeys for prioritized families | `component-ux-browser-smokes` |
| `xtend.epic11.component-shell-theme-matrix.v1` | theme, motion, density, viewport and visual states | `component-shell-theme-matrix` |

## Authoring Order

1. Choose a family: `form-controls`, `feedback-status`, `navigation-routing`, `overlay-interaction` or `layout-display-media`.
2. Define the shell contract: root, slots, states, parts, focus and lifecycle.
3. Treat styling as API: document tokens, parts, variants, size and density.
4. Model a11y first: define keyboard, labels, ARIA, live regions, focus restore and screenreader signals.
5. Set the performance profile: lane, hydration policy, critical measurement points and budget class.
6. Describe the component network: define events, commands, form association, router context or feedback channels.
7. Add RMT authoring: maintain `xtend.component` record, `dom_descriptor`, schedules, commands and events.
8. Accept Fabric context: ingest lane, fiber and telemetry through adapter data.
9. Make Component Lab visible: link preview, docs, types, fixture, state, a11y and performance.
10. Check browser and theme matrix: run local smokes and shell matrix.

## Family Rules

| Family | Minimum |
| --- | --- |
| Form controls | label, help text, error region, required/invalid, form association, value event, keyboard entry |
| Feedback/status | live region, role, tone, dismiss/timeout, non-color status, reduced motion |
| Navigation/routing | active state, `aria-current`, keyboard activation, route announcement, focus restore, tablist ARIA and roving `tabindex` |
| Overlay/interaction | initial focus, focus trap, Escape, focus restore, scroll lock, reduced motion |
| Layout/display/media | responsive slots, stable layout, lazy/visible hydration, media shell, code/display semantics |

## Theme Matrix

Every prioritized shell must remain representable in the Component Shell Theme Matrix:

- Themes: `light`, `dark`, `high-contrast`, `forced-colors`
- Motion: `default-motion`, `reduced-motion`
- Density: `comfortable`, `compact`, `dense`
- Viewports: `desktop-1280`, `tablet-768`, `mobile-390`

The gate currently checks `360` shell combinations:

Since `WP-E12-03`, `x-tabs` is part of the navigation/routing matrix and must preserve arrow key, `Home`, `End`, `aria-controls`, `role=tabpanel`, `aria-selected` and visible focus in browser smokes and theme matrix.

```bash
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
```

## Local Gates

```bash
node scripts/run_xtend_tests.js component-shell-contract --json
node scripts/run_xtend_tests.js component-styling-contract --json
node scripts/run_xtend_tests.js runtime-a11y-contract --json
node scripts/run_xtend_tests.js component-ux-performance --json
node scripts/run_xtend_tests.js component-network-contract --json
node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json
node scripts/run_xtend_tests.js component-lab-ux-inspector --json
node scripts/run_xtend_tests.js component-ux-browser-smokes --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
node scripts/run_xtend_tests.js references --json
```

## Definition of Done

- Docs, `.d.ts`, fixture, component suite and RMT metadata exist.
- Shell, styling, a11y, performance and network contracts are visible.
- Events are `bubbles: true` and `composed: true` when hosts or RMT should consume them.
- Commands are declarable and not only private methods.
- Theme, density and motion are not hard-hidden in Shadow DOM.
- Browser smoke or theme matrix covers the relevant visible path.
- No new path introduces a hard XTend dependency into the RMT kernel.
