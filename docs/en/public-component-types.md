# Public Component Types

- Contract: `xtend.docs.public-component-types.v1`
- Type contract: `xtend.enterprise.er-wp-34.public-component-types.v1`
- Workpackage: `ER-WP-34`

XTend ships local TypeScript declaration artifacts next to the respective runtime source for prioritized public components. The files live directly in `components/*.d.ts` and become reachable through the package export `xtend/components/*`.

## Local Contract

```text
components/xtend-public-types.d.ts
components/xalert.d.ts
components/xtoast.d.ts
components/xmodal.d.ts
components/xrouter.d.ts
components/xlink.d.ts
components/xinput.d.ts
components/xselect.d.ts
components/xcheckbox.d.ts
components/xradio.d.ts
components/xtextarea.d.ts
components/xstatus.d.ts
components/xprogress.d.ts
components/xtooltip.d.ts
components/xpopover.d.ts
components/xdrawer.d.ts
components/xform.d.ts
components/xtabs.d.ts
components/xdialog.d.ts
components/xlightbox.d.ts
components/xcalendar.d.ts
components/xwriter.d.ts
components/xtheme.d.ts
components/xbutton.d.ts
components/xspinner.d.ts
components/xmenu.d.ts
components/xsummary.d.ts
components/xplayer.d.ts
components/xsection.d.ts
components/xcards.d.ts
components/xheader.d.ts
components/xfooter.d.ts
components/xhero.d.ts
components/xtype.d.ts
components/xcode.d.ts
components/xmasonry.d.ts
components/xstate.d.ts
components/xutils.d.ts
```

Each component file describes:

- public attribute names
- public property and method surfaces
- event names
- `CustomEvent` detail payloads
- `HTMLElementTagNameMap` for custom elements
- typed `addEventListener` overloads for component-specific events

`x-theme` is not a custom element, but a core module. Its types therefore describe `window.XTend.theme`, `window.XTheme`, a11y preference snapshots, motion/contrast policy, density, theme context, performance snapshot, RMT metadata and the document events `theme-initialized`, `theme-changed`, `theme-variable-changed`, `theme-preference-changed`, `theme-a11y-announcement`, `theme-density-changed`, `theme-context-changed` and `theme-performance-measured`.

## Gate

```bash
node scripts/run_xtend_tests.js components
```

As of `ER-WP-34`, the component suite contains the subgate `component-public-types`. After `RC1TB-WP-03`, it checks the shared type helpers, all 42 prioritized `.d.ts` files, event names, detail types, API methods and element/window mappings.

As of `WP-TypeExports-09`, the component wildcard export is also covered in the productive TypeExports handoff. `./components/*` remains an adjacent-declaration boundary: consumers receive `components/*.d.ts` through neighboring files, while `node scripts/run_xtend_tests.js type-exports --json` prevents new public component exports from entering the package surface without a type decision.

## Coverage Status

After `RC1TB-WP-03`, `types` in the Component Catalog Coverage Matrix are at `42/42`. `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-rmt-lifecycle-demo-build`, `x-textarea`, `x-form`, `x-calendar`, `x-writer`, `x-status`, `x-progress`, `x-tooltip`, `x-popover`, `x-drawer`, `x-surface-manager`, `x-surface-window`, `x-side-panel`, `x-modal`, `x-dialog`, `x-alert`, `x-toast`, `x-spinner`, `x-router`, `x-link`, `x-tabs`, `x-theme`, `x-button`, `x-icon`, `x-menu`, `x-footer`, `x-lightbox`, `x-masonry`, `x-code`, `x-header`, `x-hero`, `x-type`, `x-summary`, `x-section`, `x-cards` and `x-player` are the current `enterprise-ready` reference line with public types, component suite, fixture, a11y and performance profile. `xstate` has public types for boundary contract, RMT state adapter, lifecycle events and diagnostics. `x-utils` has public types for utility contract, import policy, boundary snapshot, UI effects, template API and the events `xutils:import-policy-check` and `xutils:ui-effects-change`.

After `WP-E12-09`, no type gap remains. Since `WP-E13-05`, the earlier boundary residuals are also closed: `xstate` is `closed-as-runtime-boundary`, `x-utils` is `closed-as-utility-boundary`. Both remain public type boundaries, but no open type or performance tasks.

The previous vendor boundaries `components/prism.js` and `components/turndown.js` have narrow facade declarations as of `WP-TypeExports-08`. They are not public XTend UI components, but are checked by the TypeExports release gate against unintended declaration drift.
