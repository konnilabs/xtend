# xdialog - XTend Component

## Overview

`<x-dialog>` is XTend's state-driven dialog component. It combines attribute
control, `xstate` open flags, and aggregated `ui.dialogs` state into a shared
overlay contract.

## Usage

```html
<x-dialog overlay title="Example dialog" width="400px">
  <p>Content</p>
  <div slot="actions">
    <button onclick="this.closest('x-dialog').close()">Close</button>
  </div>
</x-dialog>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `open` | boolean | dialog is open |
| `overlay` | boolean | shows an overlay background |
| `title` | string | dialog title line |
| `width` | string | target width of the dialog |
| `height` | string | target height of the dialog |

## Slots

| Slot | Description |
|------|-------------|
| default | main dialog content |
| `actions` | actions in the footer |

## Events

| Event | Description |
|-------|-------------|
| `dialog-opened` | after successful opening |
| `dialog-closed` | after successful closing |

Events provide:

```js
{
  id: 'dialog-abc123',
  open: false,
  source: 'button'
}
```

## API

- `element.open()`
- `element.close()`

API- and XState-controlled dialogs use the same open flags:

- `xtend.component.x-dialog.<id>.open`
- `dialog-open-<id>`
- `xdialog-open-<id>`

## Runtime Contract

- API-managed dialogs read title, content, and actions from
  `xstate.get('ui').dialogs`.
- User interactions such as Escape, overlay click, and close button write open
  state back.
- API-managed dialogs remove themselves from `ui.dialogs` and the DOM after
  closing.

## Notes

- Direct DOM usage through slots remains supported.
- `window.XDialog.show()` is the preferred entry point for API-managed dialogs.
- Focus trap, focus return, and ARIA roles are part of the default behavior.

## Overlay Interaction UX Profile

Since `WP-E11-11`, `<x-dialog>` declares the runtime profile
`xtend.component.overlay-interaction-ux-profile.v1` through
`xtendOverlayInteractionUxProfile`.

| Field | Value |
|-------|-------|
| Family | `dialog` |
| State Key | `dialog-open-<id>` |
| Schedule | `overlay.stack.open` |
| Commands | `open`, `close`, `focus-trap`, `apply-inert`, `lock-scroll`, `snapshot` |

The profile standardizes focus trap, focus return, Escape topmost rule,
background inert, balanced scroll lock, and host-local portal semantics. RMT
can plan the dialog in shell-first templates while the RMT kernel remains
framework-agnostic through `no-rmt-kernel-import-of-xtend-types`.

## ECH-WP-06 Overlay Parity

`x-dialog` exposes `surface`, `backdrop`, `close`, and `content` as shared
overlay parts. `overlay` remains as an alias for `backdrop`. Surface, text,
backdrop, elevation, radius, z-index, action colors, close surface, and focus
ring can be overridden through `--xtend-overlay-*`, `--dialog-*`, or
`--xdialog-*` tokens.

`x-dialog` is modal: focus trap, background inert, scroll lock, Escape, and
focus return remain active in the default path. Dialogs without `overlay` keep
the surface parts but omit the visual backdrop.
