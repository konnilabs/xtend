# Epic 18 RMT App Platform and Media Manager Vendor Upstream

- Contract: `xtend.epic18.rmt-app-platform-vendor-upstream.v1`
- Status: `planned`
- Backlog: `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`
- Initial Workpackage: `development/WP-E18-01-Epic-18-Scope-Vendor-Baseline-und-App-Platform-Leitplanken-finalisieren.md`
- Source vendor snapshot: `@ccslabs/xtend@0.1.0-rc.1`
- Vendor source commit: `fab0e2d1281336d1b6813217e61ee2453ede09e7`
- Vendor package date: `2026-05-17`
- Source docs:
  - `/home/konni/Dokumente/net.ccs.cloud/media-manager/docs/xtend-component-bugfixes.md`
  - `/home/konni/Dokumente/net.ccs.cloud/media-manager/docs/vendor-build.md`
  - `/home/konni/Dokumente/net.ccs.cloud/media-manager/docs/architecture.md`
- Target: XTend main branch, source components, tests, docs, RMT/App Shell runtime and vendor build.

## Goal

Epic 18 brings the Media Manager vendor fixes back into XTend main in a controlled way and uses the Media Manager lessons learned as proof of need for a much more capable RMT App Platform. The short-term scope is vendor parity for the diverging XTend components. The strategic scope is more generic: developers should be able to model app shells, components, state, events, actions, data sources, resources, overlays and dynamic layouts natively in XTend/RMT without product-side `innerHTML` renderers, manual event delegation or custom mini-frameworks.

The Media Manager is not a product template to copy. Its surfaces and records remain example material. The target API is flexible App Platform primitives that can also build admin, content, dashboard, editor or media apps.

## Vendor Parity Finding

The comparison of XTend main against `/home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend` shows:

| Area | Finding |
|------|---------|
| `components/` | 5 diverging files, 241 insertions, 41 deletions |
| `xtend-builder/` | no functional divergence, only local `.DS_Store` |
| `tools/` | no functional divergence, only local `.DS_Store` |
| `xtendrmt/` | no functional divergence, only local `.DS_Store` |
| `fabric/` | identical |
| `a11y/` | identical |
| `security/` | identical |
| `design-tokens/` | identical |
| `catalog/` | identical |
| Top-level Loader/API/CSS | identical |

The bugfix wave can therefore stay tightly scoped: no unfocused vendor copy, but a targeted adoption of the five component deltas plus tests, documentation and release/pack gates.

## P0 Bugfix Wave

| Module | Vendor Delta | Upstream Target |
|--------|--------------|-----------------|
| `components/xtooltip.js` | Tooltip surface is positioned as `viewport-fixed-layer` instead of as a local anchor layer. Resize/scroll schedule a position update through `requestAnimationFrame`. | Tooltips in shells and surfaces must no longer be clipped by `overflow: hidden` and must not change toolbar height. |
| `components/xplayer.js` | Removes module-scope `this.shadowRoot`, guards `customElements.define`, introduces host/player containment, `ResizeObserver`, long-title ellipsis, visible volume overflow and canonical media events. | `x-player` stays bounded in resizable surfaces, imports cleanly as an ES module and dispatches `xplayer-play`/`xplayer-pause` from native media state transitions. |
| `components/xsurfacewindow.js` | Content scrolls vertically; horizontal scrolling is suppressed at the surface boundary. | Long content creates no horizontal surface scrollbars. |
| `components/xsidepanel.js` | Content scrolls vertically and horizontal scrolling is suppressed; collapse icon follows `placement` and `collapsed`. | Side panels keep stable bounds and correctly readable collapse signals for left, right, inline and bottom. |
| `components/xsurfacemanager-controller.js` | `registerSurface` preserves `bounds`, `previousBounds`, `minimized`, `maximized`, `pinned`, `collapsed`, `placement` and `mode` when re-registering. | Dynamically added surfaces must not reset runtime bounds, z-order or persistence state of existing surfaces. |

## P0 Acceptance Tests

- Open `x-tooltip` in a toolbar inside a resizable `x-surface-window`. Expected: tooltip is above the shell, not clipped and causes no layout shift.
- Import `x-player` as an ES module and mount an instance. Expected: no module-scope error, `customElements.define` is idempotent, native `title` attributes are removed only after Shadow DOM setup.
- Test `x-player` with `width="100%" height="100%"` in a resizable `x-surface-window`. Expected: host, `.player`, media element, title line, controls and volume slider stay inside the surface.
- Start `x-player` by button, keyboard and `xstate.set("xplayer-state-<id>", { playing: true })`. Expected: exactly one `xplayer-play` after real media start; `xplayer-pause` comes from the native `pause` event.
- Render long unbroken content in `x-surface-window` and `x-side-panel`. Expected: no horizontal surface scrollbar; content must wrap, truncate or clip itself.
- Move/resize a surface, then dynamically slot a second surface into `x-surface-manager`. Expected: the first surface keeps bounds, status, `active/zIndex`, minimize/maximize state and side-panel attributes.

## Blind Spots from the Media Manager

The Media Manager already starts shell-first through an RMT host adapter, but still has to render its actual UI imperatively in `media-manager-shell.js`. Epic 18 closes this gap not by a 1:1 port of the Media Manager surface, but through generic RMT App Platform capabilities.

### BS1 RMT Template Runtime

RMT must be able to express normal UI: components, attributes, text nodes, conditional regions, keyed lists, empty states, slots, tooltips, icons and form controls. Product code should no longer have to build HTML strings for normal app UI.

Acceptance: lists, detail areas, toolbars, feedback zones and arbitrary custom-element compositions can be described as RMT templates and executed as render units.

### BS2 Safe DOM Descriptor Renderer

The compiler needs DOM descriptors or generated render functions that work with `createElement`, `replaceChildren`, keyed diffing and safe attribute setters. Direct HTML sinks remain an explicit Trusted HTML boundary of the framework.

Acceptance: normal RMT shell templates use no product-side `root.innerHTML`, `element.innerHTML` or `template.innerHTML` writes.

### BS3 Typed State and XState Bridge

App state such as collection, filters, sorting, active selection, form values, panel states or dynamic instances becomes modelable as an RMT state graph with selectors, derived values, reducers and XState bindings.

Acceptance: selection changes can synchronize attributes/ARIA state incrementally without rehydrating lists or losing scroll/focus.

### BS4 Actions, Effects and Feedback

Async flows such as load data, reindex, upload, delete, lazy imports, navigation, preview open or external component commands run through declarative RMT actions and effects with loading, success, error and feedback results.

Acceptance: `x-toast` can be preloaded as an RMT feedback surface and controlled through action results; product code no longer calls ad-hoc toast handlers for standard flows.

### BS5 DataSources and Contracts

RMT needs data sources for fixture, REST, SSR and later Electron/Node, including schema validation, normalization and pagination.

Acceptance: freely definable record contracts flow into template, selector and action types; backend endpoints remain pure data, stream and mutation adapters.

### BS6 Surface Graph Runtime

Dynamic surface instances must be expressible framework-natively as keyed surface repeaters. Minimize, restore, close, destroy, focus, persistence, bounds, placement and layout modes belong in the Surface Graph.

Acceptance: developers can create custom surface models from arbitrary records without writing product-side registry repaints or bounds recovery.

### BS7 Island Diffing and Preserve Rules

Island hydration needs structural patches. Selection changes must not rewrite lists, scroll/focus must not be lost and component Shadow DOM must not be recreated unnecessarily.

Acceptance: hydration keys distinguish structural changes from pure selection/state sync; browser smokes verify scroll and focus preservation.

### BS8 Event Routing

DOM events such as `click`, `change`, `input`, `drop`, `surface-closed`, `xplayer-play` and `lightbox-closed` run into actions through declarative RMT event bindings. Product-side `event.target.closest(...)` chains are now only host-adapter fallback.

Acceptance: RMT build diagnostics can show event source, action target and payload contract.

### BS9 Overlay and Portal Layer

`x-tooltip`, `x-toast`, `x-lightbox`, popovers, menus, dialogs and other overlays need a shared portal layer for z-index, focus, escape, pointer, scroll and clipping. This layer must be addressable through RMT.

Acceptance: the tooltip fix is the first slice; other overlays then share portal/layer policy instead of app-shell workarounds.

### BS10 Resource Lifecycle Manager

Custom Elements, Object URLs, ResizeObserver, idle handles, streams, timers and dynamic imports need declarative ownership. Destroying a surface or render unit cleans up only the resources for that instance.

Acceptance: close destroys surface DOM and instance-bound resources; minimize preserves DOM, Shadow DOM and runtime state.

### BS11 SSR and Prehydration Contract

Backend adapters should be able to provide initial records, surface snapshots and optionally prehydrated data as RMT data payloads. The client initializes the same state graph from them.

Acceptance: a generic App Platform fixture can start with fixture or SSR payload without duplicate product-side boot state.

### BS12 Diagnostics and Gates

The build must detect when product shells introduce direct `innerHTML` sinks, manual full-root repaints or non-keyed lists.

Acceptance: a gate marks normal app UI `innerHTML` writes outside the Trusted DOM boundary as regression.

## Workpackages

The operative order is in the backlog `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`. The backlog line is intentionally split in two: first concrete vendor stabilization, then RMT as a generic App Platform.

| ID | Priority | Status | Workstream | Title |
|----|----------|--------|------------|-------|
| `WP-E18-01` | P0 | completed | WS0 | Finalize Epic 18 scope, vendor baseline and App Platform guardrails |
| `WP-E18-02` | P0 | completed | WS1 | Vendor component bugfix backport into main |
| `WP-E18-03` | P0 | completed | WS1 | Build bugfix contract and browser smokes |
| `WP-E18-04` | P0 | completed | WS2 | Extend RMT App Platform authoring model |
| `WP-E18-05` | P0 | completed | WS2 | Build safe DOM descriptor renderer and no-manual-HTML gate |
| `WP-E18-06` | P0 | completed | WS3 | Implement component-native template primitives for RMT |
| `WP-E18-07` | P0 | completed | WS4 | Build typed state, selectors and XState bridge for apps |
| `WP-E18-08` | P1 | completed | WS5 | Connect actions, effects, data sources and resource runtime |
| `WP-E18-09` | P1 | completed | WS6 | Build declarative event routing and component interaction contracts |
| `WP-E18-10` | P1 | completed | WS7 | Harden surface, overlay, portal and resource graph generically |
| `WP-E18-11` | P1 | completed | WS8 | Extend scaffold, linter, LSP and diagnostics for RMT apps |
| `WP-E18-12` | P1 | completed | WS9 | Build generic RMT App Platform fixture |
| `WP-E18-13` | P2 | completed | WS10 | Docs, migration guide, vendor rebuild and release handoff |

Next startable packages:

- No internal Epic 18 workpackage is open.

Completed WP-E18-12 fixture gate:
`node scripts/run_xtend_tests.js rmt-app-platform-fixture --json`.

Completed WP-E18-11 tooling gate:
`node scripts/run_xtend_tests.js rmt-app-platform-tooling --json`.

Completed WP-E18-13 handoff gate:
`node scripts/run_xtend_tests.js epic18-rmt-app-platform --json`.

Release handoff schema:
`xtend.epic18.rmt-app-platform-release-handoff.v1`.

`WP-E18-12` does not copy a 1:1 Media Manager surface structure. The fixture proves with `generic-catalog`, `admin-queue` and `content-board` that the same RMT primitives can flexibly carry different app domains.

## Module Upgrade Matrix

| XTend Module | Upgrade in Epic 18 |
|--------------|--------------------|
| `components/` | P0 backports for Tooltip, Player, Surface Window, Side Panel and Surface Controller. |
| `tests/components/` | contract tests for re-register preserve, SidePanel placement icons and component-level regressions. |
| `tests/browser/` | browser-near fixtures for tooltip clipping, player resize, volume hover, long title, XState playback and surface scrollbar boundaries. |
| `docs/components/` | user-facing documentation of the new behavior guarantees and acceptance examples. |
| `docs/epic18-vendor-bugfixes.md` | central bugfix docs for Tooltip, Player, Surface Window, Side Panel and SurfaceManager Controller. |
| `docs/rmt-app-platform-migration-guide.md` | migration away from external HTML hosts toward DOM Descriptor, Actions, DataSources, Surfaces, Overlays and Resource Cleanup. |
| `docs/epic18-rmt-app-platform-release-handoff.md` | Epic 18 handoff with gate matrix, GitHub Actions and pack/export-lock evidence. |
| `xtendrmt/` | App Platform authoring model, shell render units, DOM Descriptor Renderer (`xtendrmt/rmt-dom-descriptor-renderer.js`), component-native template primitives, State Selector Runtime (`xtendrmt/rmt-state-selector-runtime.js`), Action Effect Runtime (`xtendrmt/rmt-action-effect-runtime.js`), Event Routing Runtime (`xtendrmt/rmt-event-routing-runtime.js`), Surface Resource Graph Runtime (`xtendrmt/rmt-surface-resource-graph-runtime.js`), DataSources, Events, Surfaces, Overlays, Portals and Resources; the WP12 fixture connects these building blocks end to end. |
| `tools/rmt-language/` | linter, diagnostics, completion and hover support for `state`, `derive`, `repeat`, `when`, `bind`, `effect`, `datasource`, `resource`, `portal`, `overlay`, component bindings and no-manual-shell gates; `tools/rmt-language/app-platform-tooling.js` provides analyzer, source maps and scaffold plan. |
| `fabric/` | diagnostics, lane mapping, resource lifecycle and runtime signals for render units, component instances and surface graphs. |
| `xtend-builder/` | use of the Epic 17 build pipeline for generic RMT app artifacts, fixture generation, browser smokes and vendor rebuild; `rmt-app-platform` produces diagnostics, source maps and build reports. |
| `catalog/` | Epic 18 App Platform authoring, DOM Descriptor Renderer, Component Template Primitives, State Selector, Action Effect, Event Routing, Surface Resource Graph Runtime, App Platform Tooling, App Platform Fixture and Release Handoff contracts for runtime and tooling slices. |
| `package.json` | add new test scripts only with implemented suites; `test:rmt-app-platform-authoring`, `test:rmt-dom-descriptor-renderer`, `test:rmt-component-template-primitives`, `test:rmt-state-selector-runtime`, `test:rmt-action-effect-runtime`, `test:rmt-event-routing-runtime`, `test:rmt-surface-resource-graph-runtime`, `test:rmt-app-platform-tooling`, `test:rmt-app-platform-fixture` and `test:epic18-rmt-app-platform` are available. |

## Planned Gate Chain

Short-term for the bugfix wave:

```bash
node scripts/run_xtend_tests.js components surface-controller surface-manager-browser overlay-interaction-ux layout-display-media-ux epic18-vendor-bugfix-smokes browser references --json
```

For the RMT/App Shell slice:

```bash
node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-event-routing-runtime rmt-surface-resource-graph-runtime rmt-app-platform-tooling rmt-app-platform-fixture rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json
```

For the Epic handoff:

```bash
node scripts/run_xtend_tests.js epic18-rmt-app-platform --json
npm run test:pr:report
npm run test:release:full:report
npm run pack:dry-run
```

The Epic 18 umbrella gate is created in `WP-E18-13`. It verifies docs, migration, GitHub gate handoff, package metadata and pack/export-lock evidence.

## Definition of Done

- All five vendor component deltas have been adopted into main or deliberately rejected with technical rationale.
- The backports are protected by component and browser smokes.
- The Media Manager lessons learned have been translated into concrete workpackages as generic RMT App Platform scope.
- RMT can execute at least one flexible app-shell island without product-side HTML-string renderer.
- Dynamic surfaces, component bindings, feedback, lazy resources, data sources, event routing and resource cleanup are proven as repo-native, domain-neutral fixture or demo.
- Vendor build, package export lock and release handoff are updated.

## Non-Goals

- No unverified full copy from `vendor/xtend` into main.
- No 1:1 rebuild of the Media Manager surfaces as the XTend default app.
- No adoption of Media Manager-specific theme or Shadow DOM monkeypatches as global XTend defaults.
- No break of the boundary `no-rmt-kernel-import-of-xtend-types`.
- No production Electron/Node backend adapter in the XTend framework; backend remains fixture or host-adapter responsibility.
