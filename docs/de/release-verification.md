# Release-Verifikation

Eine XTend-Änderung ist veröffentlichungsreif, wenn Quellcode, Paketinhalt, öffentliche Typen, Dokumentation und maschinenlesbare Reports dieselbe Oberfläche beschreiben. Diese Seite führt durch die lokalen Prüfungen, die ein Integrator vor einem Merge oder Release nachvollziehen kann.

Die Verifikation veröffentlicht kein Paket und benötigt für ihren Kernpfad keinen Registry-Zugriff. Netzwerkabhängige Audit- und SBOM-Evidence bleibt ein eigener, ausdrücklich aktivierter Schritt.

## Schneller Pull-Request-Pfad

Führe für einen normalen Pull Request den Report-Gate aus:

```bash
npm run test:pr:report
```

Der Befehl schreibt `.xtend-test-results/xtend-pr-gate-report.json`. Ein erfolgreicher Prozess-Exit allein genügt nicht: Prüfe im Report, ob jede Suite `passed` meldet, keine unerwarteten `skips` enthält und die erwarteten Teilreports registriert sind.

Wenn du nur Dokumentation oder die DevTools-Extension änderst, kannst du den betroffenen Pfad zuerst gezielt ausführen:

```bash
node scripts/run_xtend_tests.js xtend-dev-surface docs-public-quality docs-content-depth references --json
```

Der vollständige Pull-Request-Report bleibt anschließend die Integrationsprüfung.

## Vollständige Release-Prüfung

Vor einem Release werden die breitere Suite und der Paketinhalt getrennt geprüft:

```bash
npm run test:release:full:report
npm run release:report
npm run pack:dry-run
```

`test:release:full:report` erzeugt `.xtend-test-results/xtend-release-gate-report.json`. `release:report` schreibt `.xtend-test-results/xtend-release-report.json`. Der Pack-Dry-Run erzeugt ein Archivinventar, ohne auf eine Registry zu veröffentlichen.

Vergleiche dabei drei Ebenen:

1. Die Gate-Reports müssen alle erforderlichen Suiten und Artefakte enthalten.
2. Das Paketinventar darf keine privaten Fixtures, Build-Caches, Secrets oder nicht freigegebenen Framework-Runtimes enthalten.
3. Öffentliche Exports, `.d.ts`-Dateien und Dokumentationspfade müssen auf tatsächlich ausgelieferte Dateien zeigen.

## Reports lesen

Ein XTend-Runner-Report enthält pro Suite mindestens Status, Exit-Code, Pass-, Fehler-, Skip- und Warning-Anzahl. Bei `failed` ist die erste Fehlermeldung der Startpunkt, nicht zwingend die Ursache. Folge den genannten Dateien und führe die betroffene Suite einzeln mit `--json` aus.

`blocked` bedeutet, dass eine notwendige Voraussetzung bewusst nicht erfüllt wurde, etwa eine fehlende lokale Runtime, eine Policy-Entscheidung oder ein nicht erlaubter Netzwerkpfad. Ändere in diesem Fall nicht die Gate-Schwelle. Stelle die Voraussetzung her oder dokumentiere, warum die betreffende Operation nicht Teil dieses Release-Pfads ist.

Warnings sind nur dann akzeptabel, wenn der Report sie ausdrücklich als nicht blockierend klassifiziert. Eine wachsende Warning-Anzahl ist ein Drift-Signal und gehört vor dem Release untersucht.

## Offline- und Netzwerk-Evidence

Die lokalen Kern-Gates bleiben offlinefähig. `npm audit`, Registry-Abfragen und SBOM-Erzeugung gehören zu bedingter Netzwerk-Evidence und dürfen einen Entwickler ohne Netzwerk nicht daran hindern, Quell-, Typ-, Manifest- und Paketverträge zu prüfen.

Wenn deine Release-Umgebung Netzwerk-Evidence verlangt, führe sie in einem dafür freigegebenen Job aus und bewahre Report und Paketfingerprint gemeinsam auf. Mehr dazu steht unter [Conditional Network Evidence](./conditional-network-evidence.md) und [Supply Chain Checks](./supply-chain-gates.md).

## Häufige Fehler beheben

Fehlt ein Export, vergleiche `package.json`, das tatsächlich gepackte Archiv und die zugehörige `.d.ts`-Datei. Ergänze nicht nur einen Testmarker: Der Export muss im installierten Paket auflösbar sein.

Scheitert `references`, ist meist ein Pfad, Schema oder Befehl zwischen Source of Truth und Dokumentation auseinander gelaufen. Aktualisiere den veralteten Verbraucher und behalte den öffentlichen Namen stabil, sofern keine angekündigte Migration vorliegt.

Scheitert ein Docs-Gate, korrigiere Inhalt, Locale-Paar, Menüeintrag oder Link. Interne Statusberichte gehören nach `development/` und nicht als Ausnahme in die öffentliche Navigation.

Scheitert der Pack-Dry-Run, prüfe zuerst `files`, Exports und generierte Artefakte in `package.json`. Ein grüner Testlauf beweist nicht, dass das veröffentlichte Archiv vollständig oder frei von internen Dateien ist.

## Nächste Schritte

- [Package Export Lock](./package-export-lock.md)
- [Type Exports](./type-exports.md)
- [Conditional Network Evidence](./conditional-network-evidence.md)
- [Supply Chain Checks](./supply-chain-gates.md)
- [Changelog](./changelog.md)
