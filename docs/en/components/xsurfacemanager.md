# x-surface-manager

x-surface-manager is a public XTend component reference for third-party developers who need to embed the component without private project context.

## What it solves

x-surface-manager controls layered UI. Use its open or close API together with focus, Escape handling and stable CSS parts instead of replacing the shadow tree. The component is loaded from `components/xsurfacemanager.js`, declared through `components/manifest.json` and typed through `components/xsurfacemanager.d.ts`. That makes the article a practical contract: a host can see which attributes are safe, which events can be listened to, which methods are callable and which CSS hooks are intended for customization.

Use this page when you are integrating XTend into a product shell, a micro frontend, a CMS-rendered page or an RMT-authored surface. It focuses on the public surface instead of internal implementation details, so it is suitable for teams that only consume the package.

## When to use it

Use `x-surface-manager` when you need the behavior described by its `overlay, stateful` profile and want a local Web Component that follows XTend theming, accessibility and scheduling conventions. It is especially useful when the host must stay framework-neutral, keep component code local and avoid CDN dependencies.

Third-party teams should prefer the documented attributes, slots, events and methods before wrapping the component. Wrappers are fine for product conventions, but the wrapper should pass through the public API instead of reaching into the shadow DOM.

## Avoid when

Avoid `x-surface-manager` when you need behavior that is not represented by the documented API, or when your host cannot load `xtend-loader.js` and `components/manifest.json`. Do not depend on private class names, generated internal nodes or unlisted state keys. If you need a design variant, use tokens, CSS parts or slots before forking the runtime file.

## Load and register

Load the XTend loader once per page. The loader reads the local manifest and resolves `x-surface-manager` to `./xsurfacemanager.js`. Keep the manifest URL same-origin unless your security policy explicitly allows another source.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-surface-manager id="demo-xsurfacemanager"
  layout="demo"
  restore-key="demo"
  route-aware
  modal-policy="demo">
  x-surface-manager content
</x-surface-manager>
```

## Examples

The integration example shows the host-side pattern: query the element, listen to the first public event when one exists and call a public method only after the element has been upgraded. This keeps hydration and RMT materialization predictable.

```js
const component = document.querySelector('x-surface-manager');
component.addEventListener('surface-manager-ready', (event) => {
  console.log('surface-manager-ready', event.detail);
});
if ('registerSurface' in component) {
  component.registerSurface();
}
```

For production screens, keep IDs stable when state keys or diagnostics include `<id>`. Stable IDs make event logs, RMT schedules and browser tests easier to compare across deployments.

## API reference

Attributes:
- `layout`
- `restore-key`
- `route-aware`
- `modal-policy`
- `manager-id`
- `state-key`
- `persistence-mode`
- `restore-policy`
- `surface-loading-policy`
- `surface-skeleton`
- `surface-hydration-timeout`
- `route-lifecycle-policy`
- `layout-engine`
- `surface-layout-gap`
- `surface-layout-snap`
- `remote-surface-policy`
- `remote-origin-allowlist`
- `remote-capabilities`

Events:
- `surface-manager-ready`
- `surface-registered`
- `surface-opened`
- `surface-closed`
- `surface-focused`
- `surface-updated`
- `surface-layout-changed`
- `surface-snapshot-persisted`
- `surface-snapshot-restored`
- `surface-snapshot-cleared`
- `surface-snapshot-reset`
- `surface-restore-skipped`
- `surface-persistence-error`
- `surface-content-loading`
- `surface-content-hydrated`
- `surface-content-hydration-skipped`
- `surface-content-hydration-error`
- `surface-route-lifecycle-applied`
- `surface-route-lifecycle-skipped`
- `surface-stack-policy-applied`
- `surface-stack-policy-escape`
- `surface-stack-policy-focus`
- `surface-stack-policy-focus-restored`
- `surface-stack-policy-error`
- `surface-layout-engine-applied`
- `surface-region-command`
- `surface-portal-policy`
- `remote-surface-mounted`
- `remote-surface-degraded`
- `remote-surface-refused`
- `remote-surface-event-governed`
- `remote-surface-event-refused`

Methods:
- `registerSurface(surface: HTMLElement | Record<string, unknown>)`
- `openSurface(id: string, input?: Record<string, unknown>)`
- `closeSurface(id: string, reason?: string)`
- `focusSurface(id: string)`
- `updateSurface(id: string, patch?: Record<string, unknown>)`
- `moveSurface(id: string, bounds: Record<string, unknown>)`
- `resizeSurface(id: string, bounds: Record<string, unknown>)`
- `minimizeSurface(id: string)`
- `maximizeSurface(id: string)`
- `restoreSurface(id: string)`
- `pinSurface(id: string, pinned?: boolean)`
- `collapseSurface(id: string)`
- `expandSurface(id: string, mode?: string)`
- `dockSurface(id: string, placement?: string, mode?: string)`
- `undockSurface(id: string, bounds?: Record<string, unknown>)`
- `snapshot()`
- `snapshotSurfaceLoading()`
- `hydrateSurfaceContent(surfaceRef: string | HTMLElement | Record<string, unknown>, options?: Record<string, unknown>)`
- `snapshotRouteLifecycle()`
- `applyRouteLifecycle(routeInput?: string | Event | Record<string, unknown> | null, options?: Record<string, unknown>)`
- `snapshotStackPolicy()`
- `applyStackPolicy(options?: Record<string, unknown>)`
- `snapshotSurfaceLayout()`
- `applyLayoutEngine(engine?: XSurfaceManagerLayoutEngine, options?: Record<string, unknown>)`
- `evaluateRemoteSurfacePolicy(surfaceInput?: Record<string, unknown>, options?: Record<string, unknown>)`
- `applyRemoteSurfacePolicy(surfaceInput?: Record<string, unknown>, options?: Record<string, unknown>)`
- `registerRemoteSurface(remoteSurface?: Record<string, unknown>, options?: Record<string, unknown>)`
- `snapshotRemoteSurfacePolicy()`
- `governRemoteSurfaceEvent(eventInput?: Record<string, unknown>, payload?: Record<string, unknown>, options?: Record<string, unknown>)`
- `snapshotPersistence(options?: Record<string, unknown>)`
- `persistSnapshot(snapshot?: XtendSurfaceSnapshot, options?: Record<string, unknown>)`
- `restorePersistedSnapshot(options?: Record<string, unknown>)`
- `clearPersistedSnapshot(options?: Record<string, unknown>)`
- `resetSurfaceLayout(options?: Record<string, unknown>)`

Slots:
- `windows`
- `panels`
- `overlays`
- `default`

CSS parts:
- `root`
- `workspace`
- `panels`
- `overlays`
- `surface-tray`
- `surface-tray-button`
- `surface-tray-popover`

CSS custom properties:
- `--surface-manager-min-height`
- `--surface-manager-color`
- `--xtend-text`
- `--text-color`
- `--surface-manager-bg`
- `--xtend-surface-muted`
- `--surface-muted`
- `--surface-manager-tray-offset`
- `--surface-manager-tray-z`
- `--surface-manager-tray-hover-bridge-width`
- `--surface-manager-tray-hover-bridge-height`
- `--surface-manager-tray-border`
- `--xtend-border-color`
- `--border-color`
- `--surface-manager-tray-radius`
- `--surface-manager-tray-bg`

## Integration notes

- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `surface.visible.render`, `surface.user-blocking.open`, `surface.user-blocking.close`, `surface.transition.layout`, `surface.diagnostics.snapshot`, `surface.eager.hydrate`.

RMT Hosts should treat the component as a Custom Element boundary: pass attributes as component props, bind DOM events to commands and keep scheduling metadata outside the component. Plain HTML hosts can use the same attributes and events without an RMT compiler.

Theming should flow through XTend design tokens first. CSS parts are intended for targeted skinning of exposed controls, while CSS custom properties are better for broader color, spacing, radius and motion changes. Accessibility hooks such as labels, live regions and focus handling should be preserved when composing the component.

## Troubleshooting

- If `x-surface-manager` stays unupgraded, confirm that `xtend-loader.js` loaded and that `components/manifest.json` contains `x-surface-manager`.
- If events are missing, listen after `customElements.whenDefined('x-surface-manager')` and check that the interaction is not disabled or blocked by validation.
- If styling does not apply, prefer documented CSS variables and parts; shadow DOM internals are intentionally not stable.
- If an RMT host renders stale state, check the state key and schedule records listed above before changing component code.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
