# x-keymap

x-keymap ist die lokale XTend Oberflaeche fuer Tastaturkuerzel und Command-Paletten-Hilfe in einer App-Shell.

## Einsatz

Die Komponente rendert ein dialogartiges Keymap-Overlay aus stabilen Eintraegen. Sie wird ueber `components/manifest.json` als `x-keymap` auf `./xkeymap.js` gemappt, bleibt same-origin ladbar und nutzt `components/xkeymap.d.ts` als Public-Type-Vertrag.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-keymap id="shortcuts" title="Tastaturkuerzel"></x-keymap>
```

## API-Referenz

Attribute:
- `open`
- `title`
- `entries`
- `locale`
- `platform`

Events:
- `xkeymap-close`
- `click`
- `keydown`

Methoden:
- `open(entries?)`
- `close(reason?)`
- `isOpen()`

CSS Parts:
- `backdrop`
- `surface`
- `group`
- `command`
- `key`

RMT Hosts koennen die Metadaten `xtend.rmt.component-contract.v1` nutzen. Der Kernel-Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.
