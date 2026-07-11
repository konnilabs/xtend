# RMT-first Demo App

Eine kleine Beispiel-App als Orientierung für eigene Hosts.

## Worum es geht

Die Demo zeigt den kleinsten vollständigen Weg von einer `.rmt` Source über Core-Records bis zu einer browserfähigen App. Sie ist ein Lern- und Regressionsexemplar, keine fertige Produktschablone.

## Öffentliche Bausteine

- `xtendrmt/rmt-first-demo-app.rmt` ist die bearbeitbare Source.
- `xtendrmt/rmt-first-demo-app.vnext.core.json` zeigt das vNext Compile-Ergebnis.
- `tests/browser/fixtures/rmt-first-demo-app-smoke.html` beweist die Host-Materialisierung.

## Empfohlener Ablauf

Ändere zuerst die RMT Source, kompiliere neu und vergleiche den Core-Diff. Öffne danach das Browser-Fixture und prüfe Inhalt, Eventfluss und Cleanup; bearbeite generierte JSON-Dateien nie als primäre Quelle.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Demo ausführen

```bash
node scripts/run_xtend_tests.js rmt-first-demo-app --json
```

Ein grüner Lauf belegt Source, Core-Modell, loaderlose Host-Shell und Browser-Smoke derselben Demo. Bei einem Diff wird zuerst `xtendrmt/rmt-first-demo-app.rmt` geprüft.
