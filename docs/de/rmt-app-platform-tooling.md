# RMT App Platform Tooling

Build-, Lint- und Editor-Hilfen für RMT App Platform Projekte.

## Worum es geht

App-Platform-Tooling verbindet RMT Source mit Lint-, Compile- und Scaffold-Reports. Es prüft nicht nur Syntax, sondern auch fehlende Referenzen, verbotene DOM-Sinks und unvollständige App-Records, bevor ein Host die Ausgabe lädt.

## Öffentliche Bausteine

- `tools/rmt-language/app-platform-tooling.js` erstellt den öffentlichen Tooling-Report.
- `tests/fixtures/rmt-app-platform-tooling.rmt` ist die ausführbare Eingabe.
- `tests/fixtures/rmt-app-platform-tooling.core.json` hält die erwartete normalisierte Ausgabe.

## Empfohlener Ablauf

Führe Lint und Compile auf derselben Source aus. Behebe Diagnostics an der Quelldatei, aktualisiere den Core-Snapshot nur bei beabsichtigter Semantikänderung und prüfe danach die Host-Fixture.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
- [XTend Maraca](./xtend-maraca.md)

## Tooling für Orchestrierung

Die App-Platform-Tooling-Schicht kennt `validation`, `animation` und `transition` als eigene Records. Completion, Hover, Document Symbols und Snippets erklären Field Rules, Animation-Presets, Transition Effects, `durationMs`, `target action`, `use animation`, `from surfaces`, `to surfaces`, `interrupt`, `reducedMotion` und `lane transition`. Dadurch sieht der Editor dieselben Verträge wie Compiler und Maraca.

Für die präzisen Keyword-Kontexte verweist diese Seite auf die [RMT Reference](./rmt-reference.md).

Neue Snippets:

- `rmt-vnext-validation`
- `rmt-vnext-animation`
- `rmt-vnext-transition`
- `rmt-vnext-maraca-orchestration-app`

Lokale Gates für Änderungen an dieser Schicht:

```bash
node scripts/run_xtend_tests.js rmt-completions rmt-navigation rmt-vnext-tooling rmt-editor-packaging --json
node scripts/run_xtend_tests.js maraca-docs rmt-tooling-docs rmt-reference-docs --json
```
