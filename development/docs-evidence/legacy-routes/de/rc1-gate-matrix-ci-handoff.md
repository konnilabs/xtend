# Readiness CI Bundle

Readiness CI Bundle beschreibt, wie die schnellen lokalen Prüfungen, Paket-Artefakte, Browser-Smokes und optionalen Netzwerkberichte in CI zusammengeführt werden. Der sichtbare Vertrag ist bewusst produktnah: Ein Entwickler soll erkennen, welche Jobs dieselben Package- und Runtime-Grenzen prüfen und welche Artefakte im Fehlerfall zu lesen sind.

## Zweck

Der CI-Bundle-Pfad verhindert, dass jede Suite ihre eigene Vorstellung von Release-Bereitschaft hat. Komponenten, Manifest-Policy, TypeExports, Package Export Lock, Maraca und Docs-Qualität werden als zusammenhängende Signale betrachtet. Wenn `xtend-i18n` als neues Infrastrukturmodul erscheint, muss es in diesen Signalen auftauchen: im Manifest, im Loader, in Typen, in Docs und in den Paketgrenzen.

Nightly erweitert diese Sicht mit längeren Jobs. Dazu gehören Workspace-Dry-Runs, Maraca-Berichte und optionale Netzwerk-Evidenz. Pull Requests bleiben schnell, während der nächtliche Lauf die breitere Oberfläche absichert.

## Nachweisblock

Die folgenden maschinenlesbaren Werte werden von CI-Suiten geprüft.

```txt
schema: xtend.epic13.rc1-gate-matrix-ci-handoff.v1
release evidence schema: xtend.epic13.release-report-pack-dry-run-evidence.v1
release evidence docs: release-report-pack-dry-run-evidence
network ci schema: xtend.epic13.conditional-network-evidence-ci.v1
network ci report: .xtend-test-results/xtend-epic13-conditional-network-evidence-ci-report.json
readiness bundle: rc1-gate-matrix-ci-handoff
owner-handoff: release-owner-review
local gate: npm run test:epic13-rc1-gate-matrix-ci-handoff
next workpackage: WP-E13-14
```

## Artefaktpfad

Ein grüner Lauf sollte die lokalen Reports und die CI-Artefakte gemeinsam sichtbar machen. Für Package Exports sind das der TypeExports-Report, der Package Export Lock und die Pack-Dry-Run-Datei. Für Maraca sind es Plan-, Bundle-, Source-to-Bundle- und Größenberichte. Für i18n sind es Komponentenfixture, Manifest-Import-Policy, Public Types und Docs-Eintrag.

Wenn eine neue Datei nur in einem dieser Pfade auftaucht, ist das ein Hinweis auf Drift. Der schnellste Fix ist meistens nicht ein Test-Bypass, sondern das Nachziehen des fehlenden Package Roots, Typziels, Menü-Slugs oder Workflow-Artifacts.

## Pflegehinweise

Halte die CI-Beschreibung synchron mit den Workflow-Dateien. Wenn ein neues Artefakt hochgeladen wird, sollte es hier und in der Release-Checkliste auftauchen. Wenn ein Artefakt aus einem Job entfernt wird, muss klar sein, welcher andere Report dieselbe Aussage übernimmt. So bleiben Default-Gates und Nightly nachvollziehbar, auch wenn die Plattform wächst.
