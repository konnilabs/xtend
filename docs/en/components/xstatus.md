# x-status

x-status is a public XTend component reference for third-party developers who need to embed the component without private project context.

## What it solves

x-status reports status to users. Wire events and live-region behavior carefully so automated hosts and assistive technology receive the same signal. The component is loaded from `components/xstatus.js`, declared through `components/manifest.json` and typed through `components/xstatus.d.ts`. That makes the article a practical contract: a host can see which attributes are safe, which events can be listened to, which methods are callable and which CSS hooks are intended for customization.

Use this page when you are integrating XTend into a product shell, a micro frontend, a CMS-rendered page or an RMT-authored surface. It focuses on the public surface instead of internal implementation details, so it is suitable for teams that only consume the package.

## When to use it

Use `x-status` when you need the behavior described by its `feedback, stateful` profile and want a local Web Component that follows XTend theming, accessibility and scheduling conventions. It is especially useful when the host must stay framework-neutral, keep component code local and avoid CDN dependencies.

Third-party teams should prefer the documented attributes, slots, events and methods before wrapping the component. Wrappers are fine for product conventions, but the wrapper should pass through the public API instead of reaching into the shadow DOM.

## Avoid when

Avoid `x-status` when you need behavior that is not represented by the documented API, or when your host cannot load `xtend-loader.js` and `components/manifest.json`. Do not depend on private class names, generated internal nodes or unlisted state keys. If you need a design variant, use tokens, CSS parts or slots before forking the runtime file.

## Load and register

Load the XTend loader once per page. The loader reads the local manifest and resolves `x-status` to `./xstatus.js`. Keep the manifest URL same-origin unless your security policy explicitly allows another source.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-status id="demo-xstatus"
  type="info"
  state="demo"
  message="demo"
  dismissible="demo">
  <span slot="label">Demo label</span>
</x-status>
```

## Examples

The integration example shows the host-side pattern: query the element, listen to the first public event when one exists and call a public method only after the element has been upgraded. This keeps hydration and RMT materialization predictable.

```js
const component = document.querySelector('x-status');
component.addEventListener('status-changed', (event) => {
  console.log('status-changed', event.detail);
});
if ('setStatus' in component) {
  component.setStatus();
}
```

For production screens, keep IDs stable when state keys or diagnostics include `<id>`. Stable IDs make event logs, RMT schedules and browser tests easier to compare across deployments.

## API reference

Attributes:
- `type`
- `state`
- `message`
- `dismissible`
- `busy`
- `polite`
- `label`

Events:
- `status-changed`
- `status-dismissed`

Methods:
- `setStatus(nextState?: Partial<XStatusState>)`
- `announce(message?: string)`
- `dismiss()`

Slots:
- `label`
- `default`

CSS parts:
- `root`
- `content`
- `status-icon`
- `icon`
- `label`
- `message`
- `close`
- `control`
- `close-icon`

CSS custom properties:
- `--text-color`
- `--status-border`
- `--xtend-feedback-border`
- `--status-bg`
- `--xtend-feedback-bg`
- `--status-color`
- `--xtend-feedback-color`
- `--status-padding`
- `--xtend-feedback-radius`
- `--border-radius`
- `--xtend-feedback-focus`

## Integration notes

- UX profile: `xtend.component.feedback-status-ux-profile.v1`.
- State key: `xstatus-state-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `component.idle.hydrate`, `feedback.status.update`, `diagnostics.snapshot`.

RMT Hosts should treat the component as a Custom Element boundary: pass attributes as component props, bind DOM events to commands and keep scheduling metadata outside the component. Plain HTML hosts can use the same attributes and events without an RMT compiler.

Theming should flow through XTend design tokens first. CSS parts are intended for targeted skinning of exposed controls, while CSS custom properties are better for broader color, spacing, radius and motion changes. Accessibility hooks such as labels, live regions and focus handling should be preserved when composing the component.

## Troubleshooting

- If `x-status` stays unupgraded, confirm that `xtend-loader.js` loaded and that `components/manifest.json` contains `x-status`.
- If events are missing, listen after `customElements.whenDefined('x-status')` and check that the interaction is not disabled or blocked by validation.
- If styling does not apply, prefer documented CSS variables and parts; shadow DOM internals are intentionally not stable.
- If an RMT host renders stale state, check the state key and schedule records listed above before changing component code.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
