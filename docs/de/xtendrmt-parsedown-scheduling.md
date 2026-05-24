# Parsedown RMT Scheduling

Wie die Docs-App Markdown sicher rendert und die Shell über RMT koordiniert.

## Worum es geht

RMT beschreibt App-Struktur, Interaktion und Laufzeitabsicht. Der Kernel bleibt host-neutral; Adapter verbinden die Records mit XTend UI, XRouter, Fabric und deiner Umgebung.

## Öffentliche Bausteine

- `docs/xtendrmt-parsedown-docs.rmt`.
- `xtend.docs.parsedown-rmt-pilot.v1`.
- `docs.app.shell` und Shell-first Rendering.
- `node scripts/run_xtend_tests.js docs-rmt-pilot --json`.

## Empfohlener Ablauf

Modelliere zuerst Shell, State und Interaktion. Prüfe die Quelle mit dem Linter, binde anschließend Adapter an und halte Host-spezifischen Code außerhalb des Kernels.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
