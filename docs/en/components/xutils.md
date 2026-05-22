# xutils - XTend Utility Module

## Overview

`x-utils` is a manifest-managed utility module, not its own Custom Element
surface. The module exports `XUtils` and additionally exposes `window.XUtils`
in the browser. It collects small DOM, event, a11y, format, and low-code
helpers for XTend components and demos.

## Import

```js
import { XUtils } from './components/xutils.js';

const button = XUtils.create('button', {
  textContent: 'Save'
});
```

In the browser, after loading the module:

```js
window.XUtils.find('[data-action="save"]');
```

## DOM and Event API

| Method | Description |
|--------|-------------|
| `find(selector, root?)` | returns the first matching element |
| `findAll(selector, root?)` | returns all matching elements as an array |
| `create(tag, props?)` | creates an element and assigns properties |
| `on(el, type, handler, opts?)` | registers a listener and returns a cleanup function |
| `delegate(root, selector, type, handler)` | delegates events within a container |

## A11y and UI Helpers

| Method | Description |
|--------|-------------|
| `setAria(el, attrs)` | sets `aria-*` attributes from an object |
| `focusTrap(container)` | focuses the first focusable element in the container |
| `fadeIn(el, duration?)` | simple opacity animation |
| `fadeOut(el, duration?)` | simple opacity animation |
| `resolveUiEffects(input?)` | normalizes opt-in UI effects from body attribute, loader option, or RMT |
| `prepareUiEffects(input?)` | prepares an opt-in UI effect, for example body fade |
| `releaseUiEffects(input?)` | releases a prepared UI effect |
| `isMobile()` | checks the local mobile breakpoint |

## Format and Data Helpers

| Method | Description |
|--------|-------------|
| `hexToRgb(hex)` | converts hex colors to RGB values |
| `contrastColor(hex)` | returns black or white as contrast color |
| `formatDate(date, locale?)` | formats a date |
| `formatNumber(num, locale?)` | formats a number |
| `uniqueId(prefix?)` | creates a simple runtime ID |
| `deepClone(obj)` | creates a JSON-based copy |

## XTemplate Recipes

`XUtils.XTemplate` contains small low-code recipes for simple DOM fragments:

```js
const card = XUtils.XTemplate.card({
  title: 'Status',
  content: 'All systems ready'
});

const action = XUtils.XTemplate.button({
  label: 'Refresh',
  onClick: () => window.location.reload()
});
```

Current recipes:

| Recipe | Description |
|--------|-------------|
| `card(opts)` | creates a simple card structure |
| `button(opts)` | creates a button |
| `modal(opts)` | creates a simple modal structure |

## Contract

- `x-utils` exists as a manifest entry, but remains a utility module.
- It does not register `customElements.define()`.
- `docs/components/xutils.md` is the canonical docs slug for the source
  basename `xutils.js`.
- Runtime tag and manifest key remain `x-utils` for the Catalog Matrix.

## Utility Boundary Contract

Since `WP-E12-09`, `x-utils` is gateable as a non-visual utility boundary:

- Utility Schema: `xtend.utility.module-contract.v1`
- Import Policy Schema: `xtend.utility.import-policy.v1`
- Import Policy Result Schema: `xtend.utility.import-policy-result.v1`
- Boundary Probe Schema: `xtend.utility.boundary-probe.v1`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

The runtime provides three explicit contract APIs:

| Method | Description |
|--------|-------------|
| `getUtilityContract()` | returns categories, exports, globals, and methods of the utility surface |
| `snapshotUtilityContract()` | returns a stable boundary snapshot for fixtures and catalog gates |
| `assertLocalImport(specifier)` | checks whether an import specifier is local and policy-compliant |

```js
const local = XUtils.assertLocalImport('/components/xbutton.js');
const blocked = XUtils.assertLocalImport('https://cdn.ccs-networks.de/xtend/components/xstate.js');

console.log(local.allowed);   // true
console.log(blocked.allowed); // false
```

`assertLocalImport()` also dispatches `xutils:import-policy-check` in the
browser. The event is intended for test, Fabric, and security harnesses; the
RMT kernel still does not import `x-utils`.

## UI Effects Boundary

Since `xtend.utility.ui-effects.v1`, `x-utils` encapsulates opt-in effects that
can influence the app shell. The global loader no longer hides the body by
default. Fade-in must be explicitly enabled:

```html
<body xt-ui-effects="fade-in">
```

RMT hosts can describe the same effect as a non-visual intent:

```json
{
  "id": "app.ui-effects",
  "kind": "ui_effects",
  "tag": "ui-effects",
  "props": {
    "effect": "fade-in"
  }
}
```

The host side remains the place of execution. RMT describes only the intent;
`XUtils.prepareUiEffects()` and `XUtils.releaseUiEffects()` set the DOM
attributes `data-xt-ui-effects`, `data-xt-ui-effects-state`, and
`data-xt-ui-effects-ready`. For environments without RMT, the body attribute is
enough. For shell-first apps that want no effect, no attribute is needed, or
`xt-ui-effects="none"` can be set explicitly.

## Notes

- New components should prefer their own component APIs and XTend-Fabric gates
  for productive UI contracts.
- `x-utils` remains a small helper-module path for existing code, demos, and
  simple DOM work.
- Suite, fixture, and utility typing have existed since `WP-E12-09`.
- Since `WP-E13-05`, `x-utils` is classified as `closed-as-utility-boundary`.
  A separate visual performance profile is not an open RC1 task for this
  utility boundary.
