# RMT Lifecycle Demo

Lifecycle- und Hydration-Abläufe in einer nachvollziehbaren Demo.

## Worum es geht

Die Lifecycle-Demo macht Mount, Hydrate, Update und Unmount als getrennte Records sichtbar. Sie zeigt außerdem, wann Resources freigegeben und Event-Listener entfernt werden müssen.

Sie ist im zentralen Demo-Inventar als stabiles Tutorial registriert und verwendet ausschließlich den generischen, manifestgesteuerten `rmt-build`-Pfad.

## Öffentliche Bausteine

- `demos/xtendrmt/examples/lifecycle/source.rmt` beschreibt den Ablauf.
- `demos/xtendrmt/examples/lifecycle/generated/core.json` hält die erwarteten Core-Records.
- `demos/xtendrmt/examples/lifecycle/demo.json` definiert Rolle, Outputs, Gate und Buildkommando.
- `demos/xtendrmt/examples/lifecycle/browser-smoke.html` beobachtet den Browser-Lifecycle.

## Empfohlener Ablauf

Führe die Demo einmal vollständig aus und prüfe die Reihenfolge der Records. Wiederhole anschließend Mount und Unmount; Zähler, Listener oder Resource Handles dürfen dabei nicht anwachsen.

Mit `npm run demos:rmt:check` lassen sich Inventar, Source-Hash und alle eingecheckten Compiler-Ausgaben ohne Schreibzugriff prüfen.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
