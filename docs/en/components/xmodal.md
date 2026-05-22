# xmodal - XTend Component

## Overview

`<x-modal>` is XTend's state-driven modal component. It is mainly used through
`window.XModal.show()`, but can also be operated directly in the DOM with
attributes and slots.

## Usage

```html
<x-modal title="Notice" open>
  <p>Modal content</p>
</x-modal>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `open` | boolean | modal is open |
| `overlay` | boolean | shows an overlay backdrop |
| `title` | string | modal title |
| `content` | string | textual content |
| `actions` | string | JSON array for action buttons |

## Slots

| Slot | Description |
|------|-------------|
| default | main modal content |
| `actions` | optional action area |

## Events

| Event | Description |
|-------|-------------|
| `modal-opened` | after successful opening |
| `modal-closed` | after successful closing |
| `modal-action` | when a configured action is selected |

## API

- `element.open()`
- `element.close()`

Open state is routed through the same paths:

- `xtend.component.x-modal.<id>.open`
- `modal-open-<id>`

## Runtime Contract

- API-managed modals read title, content, and actions from
  `xstate.get('ui').modals`.
- Escape, overlay click, and close button write open state back.
- API-managed modals remove themselves from `ui.modals` and the DOM after
  closing.
- Directly embedded overlay modals are moved into a `document.body` portal layer
  while `open`, so blur and overlay cover the full viewport.

## Notes

- `modal-action` contains the selected action definition in event detail.
- `window.XModal.show()` is the preferred entry point for API-managed modals.
- Focus return to the last active element is part of the default behavior.

## Overlay Interaction UX Profile

Since `WP-E11-11`, `<x-modal>` declares the runtime profile
`xtend.component.overlay-interaction-ux-profile.v1` through
`xtendOverlayInteractionUxProfile`.

| Field | Value |
|-------|-------|
| Family | `modal-dialog` |
| State Key | `modal-open-<id>` |
| Schedule | `overlay.stack.open` |
| Commands | `open`, `close`, `focus-trap`, `apply-inert`, `lock-scroll`, `snapshot` |

The profile defines focus trap, focus return, Escape topmost rule, background
inert, balanced scroll lock, and a document-wide portal layer. RMT describes
these rules shell-first through `tests/fixtures/rmt-overlay-interaction-ux.rmt`;
the RMT kernel still imports no XTend types.

The portal layer is document-wide: when a modal with `overlay` is opened inside
nested app shells, XRouter routes, or transformed layout containers, the host is
temporarily parked under `document.body` and returned to its original position
after closing. Slot capability remains intact while overlay and blur are no
longer limited to the local `main` or route container.

## ECH-WP-06 Overlay Parity

`x-modal` exposes `surface`, `backdrop`, `close`, and `content` as shared
overlay parts. `overlay` remains as an alias for `backdrop`. Host themes can
control backdrop, surface, text, elevation, radius, z-index, action text, close
surface, and focus ring through `--xtend-overlay-*`, `--modal-*`, or
`--xmodal-*` tokens.

`x-modal` is modal: focus trap, background inert, scroll lock, Escape, and
focus return are part of the default path. A modal without `overlay` keeps the
surface parts but renders no visual backdrop.
