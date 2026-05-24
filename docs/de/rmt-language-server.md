# RMT Language Server

Editor-Integration für Completion, Hover, Definition und Code Actions.

## Worum es geht

RMT beschreibt App-Struktur, Interaktion und Laufzeitabsicht. Der Kernel bleibt host-neutral; Adapter verbinden die Records mit XTend UI, XRouter, Fabric und deiner Umgebung.

## Öffentliche Bausteine

- `node tools/rmt-language-server/server.js`.
- Completion, Hover, Definition und Code Actions.
- Snippets für App-, Component- und Route-Strukturen.
## Editor Setup

```bash
node tools/rmt-language-server/server.js
```

Der Server unterstützt VS Code, JetBrains, Neovim und Helix über stdio. Snippets wie `rmt-app`, `rmt-component`, `rmt-route` und `rmt-template-dom` beschleunigen neue Dateien. Die relevanten Schemas sind `xtend.rmt.language-server.v1`, `xtend.rmt.editor-packaging.v1` und `xtend.rmt.snippet-catalog.v1`.

## Empfohlener Ablauf

Modelliere zuerst Shell, State und Interaktion. Prüfe die Quelle mit dem Linter, binde anschließend Adapter an und halte Host-spezifischen Code außerhalb des Kernels.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
