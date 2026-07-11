# Release Report Pack Dry Run Evidence

Release Report Pack Dry Run Evidence verbindet den Paketbericht mit den Dateien, die ein Dry Run in ein Archiv aufnehmen würde. Die Seite ist für Teams gedacht, die prüfen möchten, ob eine neue öffentliche Oberfläche nicht nur im Source Tree existiert, sondern auch im Paket ankommt und mit den Release-Reports verknüpft ist.

## Zweck

Ein Package Export kann in `package.json` korrekt aussehen und trotzdem beim Packen fehlen, wenn der Root nicht in `files` enthalten ist oder ein Workspace-Artefakt nicht geschrieben wurde. Der Dry Run schließt diese Lücke. Er erzeugt ein maschinenlesbares Bild des Pakets und macht sichtbar, ob Deklarationen, Runtime-Dateien, Docs, Maraca-Artefakte oder Design Tokens wirklich enthalten wären.

Für `xtend-i18n` ist das besonders hilfreich, weil das Modul nicht als Custom Element registriert wird. Es muss trotzdem als lokales ESM-Modul, Typdatei und Manifest-Infrastruktur im Paket erkennbar sein. Für Maraca gilt dasselbe mit Workspace-Dry-Runs und Bundle-Reports.

## Nachweisblock

Die folgenden Tokens bleiben im Dokument, damit die CI-Suite die Verbindung zwischen Release-Report, Netzwerk-Evidenz und Pack Dry Run findet.

```txt
schema: xtend.epic13.release-report-pack-dry-run-evidence.v1
network ci schema: xtend.epic13.conditional-network-evidence-ci.v1
release report: .xtend-test-results/xtend-release-report.json
pack command: npm run pack:dry-run:report
raw pack command: npm run pack:dry-run:raw
package report: .xtend-test-results/xtend-pack-dry-run.json
surface report: .xtend-test-results/xtend-package-export-surface-lock.json
```

Erzeuge den normalisierten Pack-Report ohne Veröffentlichung:

```bash
npm run pack:dry-run:report
```

## CI-Bezug

Der Default-Gate sammelt die statischen Reports und Workspace-Dry-Runs. Der Nightly-Lauf ergänzt breitere Artefakte, darunter Maraca-Report, Größenreport und optionale Netzwerk-Evidenz. Dadurch sieht ein Reviewer, ob alle Paketebenen dieselbe Oberfläche kennen. Wenn ein Artefakt fehlt, sollte zuerst der Pack Root geprüft werden, danach der Export Key und danach die Deklaration.

Der Dry Run bleibt ein reproduzierbarer lokaler Befehl. Er veröffentlicht nichts, schreibt kein echtes Archiv für den Release und benötigt keinen Registry-Zugang. Genau deshalb eignet er sich als frühe Grenze für CI/CD.

## Pflegehinweise

Ergänze neue Package Roots gemeinsam mit TypeExports, Package Export Lock und Docs. Wenn ein Workspace-Paket einen eigenen Dry Run braucht, muss der Workflow das JSON-Artefakt hochladen. Wenn ein Report nur lokal existiert und nicht in CI auftaucht, ist die Evidenz unvollständig.

## Weiterführend

Der Release-Ablauf ordnet die Pack-Dry-Run-Evidence in die abschließende Abnahmereihenfolge ein. [Verwandter Artikel](./release-verification.md)
