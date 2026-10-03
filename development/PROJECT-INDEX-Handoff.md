# Gemeinsamer Projektindex: IDX-01 bis IDX-06

Arbeitsstrang zu `DPF-WP-11-rmt-project-index`, Stand 2026-09-05.

Der gemeinsame Kern liegt unter `tools/project-index/`. Das RMT-Profil bedient
Workspace-Suche, Definitionen, Referenzen und Importnavigation. Das zusätzliche
Repository-Profil erfasst JS-/TS-Modulbeziehungen, Paketexports, das kuratierte
Schema-Inventar und statische Suite-Registrierungen. Öffentliche Nutzung und
CLI-Beispiele stehen in den [DE-](../docs/de/rmt-language-server.md) und
[EN-Anleitungen](../docs/en/rmt-language-server.md).

## Umsetzung und Grenzen

| Paket | Umsetzung |
| --- | --- |
| IDX-01 | Gemeinsame Dateierfassung mit optionalem Git, Paketgrenzen, Buffer-Vorrang, Versionsschutz, deterministische Snapshots und Inhalts-/Konfigurationsfingerprints. |
| IDX-02 | Legacy Semantic Graph sowie vNext Compiler, Primitive Graph und Source Map liefern die Analysefakten. Namenspositionen stammen aus dem bestehenden AST. Importresolver behält seine Grenzen; Kandidaten verändern keine Compilerdiagnostik. |
| IDX-03 | TypeScript wird nur im Repository-Profil geladen. Statische Imports, Exports, Paketbedingungen und Dateizugriffe liefern Beziehungen mit Herkunft. Schema-Scanner und Index teilen Dateierfassung und Exportanalyse. |
| IDX-04 | Language Server verwendet gemeinsame Dokumentanalysen; ergänzt Workspace-Symbole, Referenzen, Dateiänderungen und mehrere Roots. Bestehende Provider erhalten den aktuellen Graph über ihre bisherigen Optionen. |
| IDX-05 | Der Runner wird ausschließlich statisch gelesen. Beide Snapshots tragen zum Auswirkungsbericht bei. Suite-Implementierungen, Argumente und mögliche doppelte Ausführungen bleiben sichtbar. |
| IDX-06 | Paketexports, konkrete Typen, CLI, zweisprachige Anleitung und ein fokussierter Testeinstieg. Bestehende Prüfungen bleiben bestehen. |

Der Index arbeitet synchron; eine eingehende ältere Bufferversion wird vor der
Analyse verworfen. Unveränderte Dokumente verwenden ihren bisherigen Graph.
Veränderte Dokumente werden neu analysiert, danach werden die Beziehungen aus
den zwischengespeicherten Fakten erneut verbunden. Zeilenverschiebungen ändern
Symbolidentitäten nicht. Dateiumzüge ändern die Dokumentidentität und werden
über Basis- und aktuellen Snapshot nachvollzogen.

Semantisch bewiesene RMT-Referenzen, deklarierte Dateibeziehungen und mögliche
Importkandidaten sind getrennte Datensätze. Syntaxfehler liefern nur Deklarationen,
die der vorhandene Parser positionsgültig erhalten hat. Es gibt keinen eigenen
Indexparser und keine dateiübergreifende Compilerauflösung.

Die statische Dateianalyse versteht Literale, eindeutige Konstanten und bekannte
Pfadhelfer. Gemeinsame Suite-Module werden konservativ allen zugehörigen Suites
zugeordnet; dynamische Zugriffe bleiben Erfassungslücken. Package-Exportbedingungen
werden pro Browser-, Node-/Require- und Typziel berichtet. Nicht unterstützte
Auflösungen werden nicht als erfolgreich ausgegeben. Bekannte erzeugte Dateien
werden über `canonicalSources`, `sourceArtifacts` und `sourceManifest` verbunden.

Das RMT-Profil lädt weder TypeScript noch das Schema-Gesamtinventar oder Suites.
Der optionale CLI-Cache liegt ignoriert unter `.project-index-cache/`, enthält
keine Editorbuffer und wird bei Fingerprint-/Versionsabweichungen verworfen.
Auslieferbare Pakete enthalten keinen Repository-Gesamtindex.

## Prüfung und Messung

`npm run test:project-index` ist der einzige neue Suite-Einstieg. Er prüft
Projekt-/Scope-Identität, genaue Positionen, gültige und ungültige Quellen,
Bufferwechsel, Schließen, Löschen, Umbenennen, Imports/Globs/Zyklen und physische
Root-Grenzen. Hinzu kommen statische Modul-/Fixture-/Suite-Beziehungen,
Paketbedingungen, beide Impact-Snapshots, CLI-Cache sowie die Wiederverwendung
von Analysen an 1.000 RMT-Dokumenten.

Die Laufzeitmessungen dienen als Ausgangspunkt. Verbindlich sind die
Wiederverwendungsregeln: Abfragen parsen nicht neu und eine Textänderung parst
nur das geänderte Dokument. Messungen mit Node 24.19.0 am 2026-09-05:

| Messung | Repository-Profil | 1.000 synthetische RMT-Dokumente |
| --- | --- | --- |
| Kalter Aufbau inklusive Snapshot | 8.097 ms | 606 ms |
| 100 warme Symbolabfragen | 34 ms | 17 ms |
| Inkrementelle Textänderung inklusive Snapshot | 2.101 ms | 81 ms |
| Neu analysierte RMT-Dokumente je Änderung | 1 | 1 |
| Zusätzlicher gehaltener Heap nach GC | 181,5 MiB | 58,7 MiB |
| Prozess-RSS nach Aufbau | 498,0 MiB | 229,9 MiB |

Der Repository-Messlauf enthält 2.959 Dokumente, 3.311 Symbole, 4.241 Referenzen,
35.419 Beziehungen, 340 Suite-Registrierungen und 2.156 Verträge. Seine 2.415
Erfassungslücken enthalten unter anderem dynamische Dateizugriffe,
auflösungsabhängige Modulziele und gemeinsame Suite-Module. Diese Zähler sind
eine Momentaufnahme; zusätzliche Quell- und Testdateien verändern sie.

Die 14 fokussierten Index-Prüfgruppen sind grün. Sie schließen inzwischen auch
UTF-16-Positionen, bytegleich deterministische Snapshots nach erneutem Aufbau,
fehlendes TypeScript, unveränderte Dateiereignisse und nicht mehr lesbare
Textquellen ein. Explizite Globs verwenden die unveränderte Dateierfassung des
Importresolvers, auch für normalerweise ausgeschlossene Dateien; erneut
erreichbare unveränderte Importe werden nicht neu geparst. Relative Importroots
und das Entfernen des letzten Workspace-Roots sind ebenfalls geprüft.
Ungespeicherte Dokument-URIs bleiben bei Änderungen und Navigation erhalten;
ohne Dateipfad wird eine fehlende Importbasis ausdrücklich gemeldet.
Die abschließenden Index-/Import-/LSP-/Code-Action-Regressionstests
sind ebenfalls grün. 13 ergänzende Source-Model-, Parser-, Semantik-, Compiler-,
Import-, Navigations-, LSP-, Export- und Typprüfungen bestehen. Die bisherigen
und die gemeinsamen Schema-Scanner liefern bei identischer Git-Dateiliste
identische Analysefakten. Ein zusätzlicher Vergleichstest sichert kanonische
Paketexports und kuratierte Migrationsentscheidungen ab.

Root- und Compiler-Pack-Dry-Runs enthalten alle neun Index-Dateien mit ihren
Deklarationen und keine Snapshots oder Caches. Ein separater Prozess bestätigt,
dass das RMT-Profil weder TypeScript noch Suites lädt. Die vier neuen
Index-Verträge sind gezielt im Schema-Inventar registriert. Die initialen
Bewertungen der neuen Verträge unterscheiden
Runtime-Beobachtungen von ihren TypeScript-Deklarationen; CLI-Teilberichte
verwenden eigene Schema-IDs.

Die nachgelagerte Observatory-Inventarkorrektur ergänzt die drei fehlenden
Quellenzuordnungen des Laufs vom 2026-08-31 in den beiden Intake-/Review-Einträgen.
Die zusätzliche Review-Form verwendet bereits vorhandene optionale Felder und
wird durch die Entscheidung `OBS-2026-08-31-compatible-review-evidence` ausdrücklich
an ihren Fingerprint gebunden. Die Vertragsprüfung bestätigt alle fünf Läufe.
Bestehende Review-Fingerprints, Schemaversionen, Migrationsentscheidungen und die
übrigen 2.154 Inventareinträge bleiben unverändert. Die beiden zugehörigen
Review-Begründungen beschreiben jetzt die tatsächlich erfassten Varianten.

Die gezielten Prüfungen `schema-inventory`, `browser-primitive-radar`,
`contract-registry` und `project-index` bestehen. Der vollständige PR-Lauf nach
der Korrektur besteht mit 155 von 155 Suites in 259 Sekunden; keine Suite wird
übersprungen. Auch `maraca-app-services-build` besteht innerhalb dieses Laufs.
Der Inventarvalidator meldet null Fehler. Die 54 bereits vorhandenen offenen
Inventar-Reviews bleiben als Warnungen sichtbar; die Drift-Prüfungen sind
unverändert aktiv.

Lokale Evidence liegt ignoriert unter `.xtend-test-results/project-index/`:
`repository-snapshot.json`, `repository-impact.json`, `measurements.json`,
`synthetic-measurements.json`, `final-regression-report.json`,
`integration-report.json`, `pr-summary.json`, `pr.log` und `schema-check.json`.
Die dortigen PR- und Schema-Berichte dokumentieren den Stand vor der
Observatory-Korrektur. Die aktuelle Abnahme liegt unter
`.xtend-test-results/observatory-inventory/`: `fix-validation.json`,
`focused-report.json`, `pr-report.json` und `pr.log`.
Diese Dateien sind rekonstruierbare Arbeitsartefakte und werden nicht ausgeliefert.

## Übergabe an die Gate-Überarbeitung

Einen Repository-Snapshot mit `xt index build --root <repo> --profile repository
--out /tmp/project-index.json --json` erzeugen. Nach Änderungen liefert
`xt index impact --root <repo> --base /tmp/project-index.json --changed <pfad>
--json` die betroffenen Dateien, Pakete, Verträge und möglichen Suites samt
Begründungspfaden und Erfassungslücken. Der Bericht kann unter einem ignorierten
Testresultat-Verzeichnis archiviert werden.

Der erste Repository-Bericht erkennt beispielsweise `maraca-bundle` und
`maraca-bundle-report` als Aufrufe derselben Implementierung mit denselben
Argumenten. Diese Feststellung autorisiert keine Zusammenlegung. Das Folgeprojekt
muss Laufzeitkosten, gemeinsame Abhängigkeiten, dynamische Eingaben und tatsächliche
Regressionsabdeckung prüfen, bevor es Gates verschiebt oder auswählt.

Rename, Formatter, Semantic Tokens, HMR, vollständige JS-/TS-Referenzanalyse und
automatische Testauswahl bleiben außerhalb dieses Arbeitsstrangs.

## Anschluss: gemeinsame PR-Gates

Der Folgearbeitsstrang [PR-Gates](./PR-Gates-Handoff.md) überführt Suite-Registrierungen in `scripts/test-runner/catalog.json`. Der Repository-Index liest Implementierungen, Argumente und Aliasse daraus statisch; das ursprüngliche Runner-AST-Profil bleibt für externe Projekte kompatibel. Die Gate-Auswahl verwendet deklarierte Profile. Impact-Berichte wählen weiterhin keine Tests automatisch aus.
