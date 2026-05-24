# Native RMT Authoring

Native RMT Dokumente ohne Legacy-JSON als bevorzugter Authoring-Pfad.

## Worum es geht

RMT beschreibt App-Struktur, Interaktion und Laufzeitabsicht. Der Kernel bleibt host-neutral; Adapter verbinden die Records mit XTend UI, XRouter, Fabric und deiner Umgebung.

## Öffentliche Bausteine

- `.rmt` Quellen.
- Core Records und Source Maps.
- Host Adapter für DOM, Router und Komponenten.

## Empfohlener Ablauf

Modelliere zuerst Shell, State und Interaktion. Prüfe die Quelle mit dem Linter, binde anschließend Adapter an und halte Host-spezifischen Code außerhalb des Kernels.

## Editor-Hilfen

[RMT Linter](./rmt-linter.md) und
[RMT Language Server](./rmt-language-server.md) decken Linter, LSP, Code
Actions und Agent Report ab. Häufige Snippets sind `rmt-component` für
Komponentenrecords und `rmt-template-dom` für DOM Descriptor Templates.
Regressionen im Tooling prüfst du mit
`node scripts/run_xtend_tests.js rmt-language-regression --json`.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
