# x-keymap

x-keymap is the local XTend surface for keyboard shortcut and command help inside an app shell.

## Usage

The component renders a dialog-style keymap overlay from stable entries. It is mapped by `components/manifest.json` from `x-keymap` to `./xkeymap.js`, stays same-origin loadable and uses `components/xkeymap.d.ts` as its public type contract.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-keymap id="shortcuts" title="Keyboard shortcuts"></x-keymap>
```

## API Reference

Attributes:
- `open`
- `title`
- `entries`
- `locale`
- `platform`

Events:
- `xkeymap-close`
- `click`
- `keydown`

Methods:
- `open(entries?)`
- `close(reason?)`
- `isOpen()`

CSS Parts:
- `backdrop`
- `surface`
- `group`
- `command`
- `key`

RMT hosts can consume the `xtend.rmt.component-contract.v1` metadata. The kernel boundary remains `no-rmt-kernel-import-of-xtend-types`.
