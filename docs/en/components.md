# Component Development with XTend

XTend components are reusable Web Components. In RMT-first apps they are not
the app architecture itself: RMT describes the shell, state, actions, events,
surfaces, and scheduling; XTend Components materialize the visible UI.

See also [x-router](./components/xrouter.md), [x-link](./components/xlink.md),
and the [RMT vNext Authoring Guide](./rmt-vnext-authoring.md).

## Core Principles

- Every visual component is an ES module and is loaded through the manifest.
- The manifest key is the canonical runtime and catalog name.
- For Custom Elements, the tag name matches the manifest key, for example
  `x-button`, `x-input`, `x-summary`.
- Existing source files follow the module basename without the hyphen, for
  example `xbutton.js` for `x-button`.
- Components remain independent, configurable, and host-neutral.
- RMT can reference, mount, hydrate, and connect components to events, but it
  does not import them into the kernel.

## Role in RMT-Authored Apps

| Layer | Responsibility |
| --- | --- |
| RMT vNext | describes app shell, surfaces, state, actions, events, and lanes |
| XTend Component | renders UI and encapsulates Shadow DOM, attributes, properties, and events |
| Host Adapter | connects RMT records to real Custom Elements and browser DOM |
| Fabric | runs hydration, render, user-blocking, and idle work as fibers |

An RMT surface can, for example, declare `component x-cards`. The host adapter
loads `x-cards` through the manifest, mounts the Custom Element, and wires event
payloads into RMT actions.

The RMT vNext Component Capability Registry makes this adapter path generic. It
reads the manifest, Component Contracts, `xtendRmtMetadata`,
`observedAttributes`, events, slots, parts, form association, accessibility
profiles, and performance profiles, then exposes capabilities for every public
manifest component. New components remain normal Web Components; RMT
compatibility depends on stable public contracts instead of host monkeypatching.

## Component Structure

A typical component contains:

- a class that extends `HTMLElement` or a local base class
- Shadow DOM or controlled Light DOM
- styles through CSS custom properties, parts, or local Shadow DOM rules
- attributes and properties for configuration
- custom events for communication
- registration through `customElements.define(...)`

### Minimal Example

```js
class XButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <button part="button"><slot></slot></button>
      <style>
        :host { display: inline-flex; }
        button { padding: 0.5rem 0.75rem; }
      </style>
    `;
  }
}

customElements.define('x-button', XButton);
```

## Naming Rules

| Layer | Rule | Example |
| --- | --- | --- |
| Manifest key | canonical runtime and catalog name | `x-summary` |
| Custom Element tag | identical to the manifest key | `<x-summary>` |
| Source file | module basename from the manifest path | `xsummary.js` |
| Component docs | source basename plus `.md` | `docs/components/xsummary.md` |
| Docs menu slug | `components-` plus source basename | `components-xsummary` |

Exceptions stay intentionally small: `xstate` is a platform state module,
`x-utils` is a utility module without a Custom Element, and `x-theme` provides
the theme facade.

## Best Practices

- Use Shadow DOM, parts, and CSS custom properties for encapsulation and
  theming.
- Keep attributes, properties, and events stable and documented.
- Dispatch events with clear `detail` payloads so RMT actions can consume them
  safely.
- Avoid global DOM assumptions in components; app structure belongs in RMT.
- Use `x-icon` for local icons, icon packs, and controlled URL sources.
- Plan hydration deliberately: visible UI belongs in visible lanes, less urgent
  work belongs in idle or lazy paths.

## Example with Attribute and Event

```js
class XCounterButton extends HTMLElement {
  static get observedAttributes() {
    return ['value'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <button part="button" type="button"></button>
    `;
    this.shadowRoot.querySelector('button').addEventListener('click', () => {
      const value = Number(this.getAttribute('value') || 0) + 1;
      this.setAttribute('value', String(value));
      this.dispatchEvent(new CustomEvent('counter-change', {
        bubbles: true,
        detail: { value }
      }));
    });
  }

  attributeChangedCallback() {
    const button = this.shadowRoot && this.shadowRoot.querySelector('button');
    if (button) button.textContent = `Counter ${this.getAttribute('value') || 0}`;
  }
}

customElements.define('x-counter-button', XCounterButton);
```

In RMT, this event can be bound to an action as
`on counter-change -> action ...`.

## Testing and Debugging

- Components can be tested directly in HTML.
- Use `xtend-loader.js` and the local dev server for manual tests.
- Use RMT surfaces when you want to test component behavior in the app
  lifecycle.
- For API and typing questions, see [Public Component Types](./public-component-types.md).

## Related Topics

- [Manifest Format](./manifest.md)
- [XTend Loader](./xtend-loader.md)
- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Component Primitives and XTend UI](./rmt-vnext-component-primitives.md)
- [Component Platform](./component-platform.md)
- [Component UX Authoring](./component-ux-authoring.md)
- [API Integration](./api.md)
