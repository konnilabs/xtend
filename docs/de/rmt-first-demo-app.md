# RMT-first Demo App

Eine kleine Beispiel-App als Orientierung für eigene Hosts.

## Worum es geht

Die Demo zeigt den kleinsten vollständigen Weg von einer `.rmt` Source über Core-Records bis zu einer browserfähigen App. Sie ist ein Lern- und Regressionsexemplar, keine fertige Produktschablone.

Die Einheit ist im Demo-Inventar als stabiles Tutorial klassifiziert. Ihr `generated/core.json` ist der einzige Core-Vertrag; ein paralleler Legacy-Core wird nicht mehr gepflegt.

## Öffentliche Bausteine

- `demos/xtendrmt/examples/first-app/source.rmt` ist die bearbeitbare Source.
- `demos/xtendrmt/examples/first-app/generated/core.json` zeigt das vNext Compile-Ergebnis.
- `demos/xtendrmt/examples/first-app/browser-smoke.html` beweist die Host-Materialisierung.

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

Ein grüner Lauf belegt Source, Core-Modell, loaderlose Host-Shell und Browser-Smoke derselben Demo. Bei einem Diff wird zuerst `demos/xtendrmt/examples/first-app/source.rmt` geprüft.
