# RMT Lifecycle Demo

Lifecycle- und Hydration-Abläufe in einer nachvollziehbaren Demo.

## Worum es geht

Die Lifecycle-Demo macht Mount, Hydrate, Update und Unmount als getrennte Records sichtbar. Sie zeigt außerdem, wann Resources freigegeben und Event-Listener entfernt werden müssen.

## Öffentliche Bausteine

- `xtendrmt/rmt-lifecycle-demo.rmt` beschreibt den Ablauf.
- `xtendrmt/rmt-lifecycle-demo.core.json` hält die erwarteten Core-Records.
- `tests/browser/fixtures/rmt-lifecycle-demo-smoke.html` beobachtet den Browser-Lifecycle.

## Empfohlener Ablauf

Führe die Demo einmal vollständig aus und prüfe die Reihenfolge der Records. Wiederhole anschließend Mount und Unmount; Zähler, Listener oder Resource Handles dürfen dabei nicht anwachsen.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
