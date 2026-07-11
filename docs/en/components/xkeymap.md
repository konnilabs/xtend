# x-keymap

`x-keymap` presents the registered keyboard commands of an app shell as an accessible dialog. It groups entries, formats key sequences for the selected platform and returns focus to the previously active element when it closes.

## What it solves

A command palette and keyboard help have different responsibilities: the palette executes commands, while the keymap explains available shortcuts. `x-keymap` owns the explanatory surface and can use models from `XCommand.createXKeymapModel()`. Without the XCommand runtime, it renders supplied entries in a general group.

The runtime lives in `components/xkeymap.js`, public types in `components/xkeymap.d.ts`, and `components/manifest.json` registers the element as `x-keymap`.

## When to use it

Use `x-keymap` when an application offers several shortcuts or key sequences and users need a central, keyboard-accessible overview. Common triggers are a help button or a global shortcut such as `?`.

The component also works in RMT shells. Its events can bind to commands while the keyboard registrations themselves remain in the XCommand layer.

## Avoid when

For one or two local shortcuts, help text next to the affected control is enough. `x-keymap` does not register or dispatch commands and does not replace a command palette. Supply only shortcuts that are active in the current scope or deliberately visible.

## Load and register

XTend Loader resolves the element from the local manifest:

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>

<button id="shortcut-help" type="button">Keyboard help</button>
<x-keymap id="shortcuts" title="Keyboard shortcuts" locale="en" platform="linux"></x-keymap>
```

`open` controls visibility. `title` names the dialog, while `locale` and `platform` affect the model produced by XCommand. The `entries` attribute expects JSON; the `entries` property is less error-prone for dynamic data.

## Examples

Supply structured entries and open the help surface through its public method:

```js
const keymap = document.querySelector('x-keymap');
const trigger = document.querySelector('#shortcut-help');

keymap.entries = [
  { id: 'file.save', label: 'Save', icon: 'save', sequence: ['Mod', 'S'], group: 'File' },
  { id: 'navigation.search', label: 'Search', icon: 'search', sequence: ['Mod', 'K'], group: 'Navigation' }
];

trigger.addEventListener('click', () => keymap.open());
keymap.addEventListener('xkeymap-close', (event) => {
  console.log(event.detail.reason);
});
```

`close(reason)` reports `api`, `escape`, `button` or `backdrop` through `xkeymap-close`. The event uses `bubbles: true` and `composed: true`, allowing a shell host outside the shadow DOM to observe it.

## API reference

Attributes:

- `open`: shows the dialog and backdrop.
- `title`: visible dialog title.
- `entries`: JSON-encoded `XKeymapEntry[]`.
- `locale`: locale for the keymap model, default `en`.
- `platform`: platform hint for key labels.

Properties and methods:

- `entries: XKeymapEntry[]`
- `isOpen(): boolean`
- `open(entries?: XKeymapEntry[]): void`
- `close(reason?: string): void`

Events:

- `xkeymap-close` with `{ reason }`
- `click`
- `keydown`

Slots:

- No public slots. Content is derived from `entries`.

CSS parts:

- `backdrop`, `surface`, `close`, `title`, `empty`
- `group`, `group-title`, `commands`, `command`
- `icon`, `label`, `keys`, `key`

CSS custom properties:

- `--xkeymap-backdrop`, `--xkeymap-z-index`, `--xkeymap-padding`
- `--xkeymap-border`, `--xkeymap-radius`, `--xkeymap-surface`, `--xkeymap-color`, `--xkeymap-shadow`
- `--xkeymap-title-font`, `--xkeymap-group-title-color`, `--xkeymap-group-title-font`
- `--xkeymap-key-bg`, `--xkeymap-key-color`, `--xkeymap-key-font`

## Accessibility and keyboard behavior

The surface uses `role="dialog"`, `aria-modal="true"`, a referenced title and a focusable dialog container. On open it stores `document.activeElement`, focuses the surface and registers Escape in capture mode. On close it removes that listener and restores the previous focus.

Backdrop and close button are pointer paths; Escape is the equivalent keyboard path. Give the external trigger an understandable accessible name and its own shortcut hint.

## Integration notes

RMT metadata uses `xtend.rmt.component-contract.v1`, `dom-event-to-rmt-command` and schedules `component.visible.mount`, `ui.user-blocking.input`, `overlay.dialog.transition` and `diagnostics.snapshot`. Performance measurements are `xtend.x-keymap.open`, `xtend.x-keymap.close` and `xtend.x-keymap.render`.

When a host filters entries by scope, update the `entries` property before `open()`. This prevents the dialog from listing inactive or policy-blocked commands.

## Troubleshooting

If the keymap stays hidden, use `isOpen()` to confirm that `open` is set and check that the manifest loaded `x-keymap`.

If only an empty group appears, validate `entries` as an array with `id` and optional `label`, `icon`, `sequence` and `group`. Invalid JSON in the attribute deliberately becomes an empty list.

If focus does not return, do not remove the trigger while the keymap is open. During a shell transition, close the keymap first with `close('surface-change')`.

## Next steps

- [Component Development](../components.md)
- [A11y Keyboard Smokes](../a11y-keyboard-smokes.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
