# RMT Component Template Primitives

Template-Primitives für wiederverwendbare komponentennahe UI-Strukturen.

## Worum es geht

RMT beschreibt App-Struktur, Interaktion und Laufzeitabsicht. Der Kernel bleibt host-neutral; Adapter verbinden die Records mit XTend UI, XRouter, Fabric und deiner Umgebung.

## Öffentliche Bausteine

- `.rmt` Quellen.
- Core Records und Source Maps.
- Host Adapter für DOM, Router und Komponenten.

## Empfohlener Ablauf

Modelliere zuerst Shell, State und Interaktion. Prüfe die Quelle mit dem Linter, binde anschließend Adapter an und halte Host-spezifischen Code außerhalb des Kernels.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
