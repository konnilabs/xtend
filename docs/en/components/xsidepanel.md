# x-side-panel

x-side-panel is a public XTend component reference for third-party developers who need to embed the component without private project context.

## What it solves

x-side-panel controls layered UI. Use its open or close API together with focus, Escape handling and stable CSS parts instead of replacing the shadow tree. The component is loaded from `components/xsidepanel.js`, declared through `components/manifest.json` and typed through `components/xsidepanel.d.ts`. That makes the article a practical contract: a host can see which attributes are safe, which events can be listened to, which methods are callable and which CSS hooks are intended for customization.

Use this page when you are integrating XTend into a product shell, a micro frontend, a CMS-rendered page or an RMT-authored surface. It focuses on the public surface instead of internal implementation details, so it is suitable for teams that only consume the package.

## When to use it

Use `x-side-panel` when you need the behavior described by its `overlay, stateful, interactive` profile and want a local Web Component that follows XTend theming, accessibility and scheduling conventions. It is especially useful when the host must stay framework-neutral, keep component code local and avoid CDN dependencies.

Third-party teams should prefer the documented attributes, slots, events and methods before wrapping the component. Wrappers are fine for product conventions, but the wrapper should pass through the public API instead of reaching into the shadow DOM.

## Avoid when

Avoid `x-side-panel` when you need behavior that is not represented by the documented API, or when your host cannot load `xtend-loader.js` and `components/manifest.json`. Do not depend on private class names, generated internal nodes or unlisted state keys. If you need a design variant, use tokens, CSS parts or slots before forking the runtime file.

## Load and register

Load the XTend loader once per page. The loader reads the local manifest and resolves `x-side-panel` to `./xsidepanel.js`. Keep the manifest URL same-origin unless your security policy explicitly allows another source.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-side-panel id="demo-xsidepanel"
  surface-id="demo"
  label="Demo"
  open
  active>
  x-side-panel content
</x-side-panel>
```

## Examples

The integration example shows the host-side pattern: query the element, listen to the first public event when one exists and call a public method only after the element has been upgraded. This keeps hydration and RMT materialization predictable.

```js
const component = document.querySelector('x-side-panel');
component.addEventListener('surface-panel-command', (event) => {
  console.log('surface-panel-command', event.detail);
});
if ('toSurfaceRecord' in component) {
  component.toSurfaceRecord();
}
```

For production screens, keep IDs stable when state keys or diagnostics include `<id>`. Stable IDs make event logs, RMT schedules and browser tests easier to compare across deployments.

## API reference

Attributes:
- `surface-id`
- `label`
- `open`
- `active`
- `collapsed`
- `pinned`
- `mode`
- `placement`
- `responsive-mode`
- `resizable`
- `route-aware`
- `modal`
- `initial-width`
- `initial-height`

Events:
- `surface-panel-command`

Methods:
- `toSurfaceRecord(managerId: string)`
- `applySurfaceSnapshot(record: XtendSurfaceRecord)`
- `openPanel()`
- `closePanel(reason?: string)`
- `focusPanel()`
- `pinPanel()`
- `collapsePanel()`
- `expandPanel(mode?: XSidePanelMode)`
- `setPanelMode(mode: XSidePanelMode, placement?: XSidePanelPlacement)`
- `resizePanel(bounds: Partial<XtendSurfaceRecord['bounds']>)`
- `restorePanel()`

Slots:
- `default`

CSS parts:
- `backdrop`
- `scrim`
- `root`
- `surface`
- `overlay-surface`
- `header`
- `title`
- `actions`
- `pin`
- `control`
- `pin-icon`
- `icon`
- `collapse`
- `collapse-icon`
- `close`
- `close-icon`

CSS custom properties:
- `--xtend-overlay-surface`
- `--xtend-surface`
- `--section-bg`
- `--xtend-overlay-text`
- `--xtend-text`
- `--text-color`
- `--xtend-overlay-border-color`
- `--xtend-border-color`
- `--border-color`
- `--xtend-overlay-elevation`
- `--xtend-shadow-overlay`
- `--xtend-elevation-2`
- `--xtend-overlay-backdrop`
- `--xtend-overlay-bg`
- `--xtend-overlay-focus-ring`
- `--xtend-focus-color`

## Integration notes

- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `surface.visible.render`, `surface.user-blocking.open`, `surface.user-blocking.close`, `surface.transition.layout`, `surface.diagnostics.snapshot`.

RMT Hosts should treat the component as a Custom Element boundary: pass attributes as component props, bind DOM events to commands and keep scheduling metadata outside the component. Plain HTML hosts can use the same attributes and events without an RMT compiler.

Theming should flow through XTend design tokens first. CSS parts are intended for targeted skinning of exposed controls, while CSS custom properties are better for broader color, spacing, radius and motion changes. Accessibility hooks such as labels, live regions and focus handling should be preserved when composing the component.

## Troubleshooting

- If `x-side-panel` stays unupgraded, confirm that `xtend-loader.js` loaded and that `components/manifest.json` contains `x-side-panel`.
- If events are missing, listen after `customElements.whenDefined('x-side-panel')` and check that the interaction is not disabled or blocked by validation.
- If styling does not apply, prefer documented CSS variables and parts; shadow DOM internals are intentionally not stable.
- If an RMT host renders stale state, check the state key and schedule records listed above before changing component code.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
