# RMT Language Server

Editor integration for completion, hover, definition and code actions.

## What it covers

RMT describes app structure, interaction and runtime intent. The kernel stays host-neutral; adapters connect records to XTend UI, XRouter, Fabric and your environment.

## Public building blocks

- `node tools/rmt-language-server/server.js`.
- Completion, hover, definition and Code Actions.
- Snippets for app, component and route structures.
## Editor setup

```bash
node tools/rmt-language-server/server.js
```

The server supports VS Code, JetBrains, Neovim and Helix through stdio. Snippets such as `rmt-app`, `rmt-component`, `rmt-route` and `rmt-template-dom` speed up new files. The relevant schemas are `xtend.rmt.language-server.v1`, `xtend.rmt.editor-packaging.v1` and `xtend.rmt.snippet-catalog.v1`.

## Recommended workflow

Model shell, state and interaction first. Validate the source with the linter, connect adapters afterwards and keep host-specific code outside the kernel.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
