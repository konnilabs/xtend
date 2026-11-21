# A06.5 – Implementierung und Ausführungsnachweise

Dokumentationsstand: **21. November 2026**, Revision **1.1.0**. Die hier zusammengeführten Originalausführungen stammen vom 20./21. November; Implementierungsbasis war `6a123f9657b533554a455a8ee44d853b6b77bf6d`. A06.5 ist implementiert und lokal geprüft. Diese Fortschreibung berichtet den abgeschlossenen Stand und führt keine neuen Tests aus.

Der gemeinsame Projektcompiler verknüpft Classic und RMTX tatsächlich zu einem Programm. Session, Watch, CLI, Maraca, Hydrangea, Bridge, MCP und Editor verwenden diesen Einstieg. RMTX erhält ein eigenes semantisches TSX-Modell einschließlich Navigation in importierte Originaldateien. Die Produkt- und Releasegrenzen stehen im [Implementierungsvertrag](implementation.md).

## Originalausführungen zum A06.5-Abschluss

Diese originalen `final-r05`-/`final-r06`-Receipts binden die tatsächlich während jedes Laufs gelesenen Quellen vor und nach der Ausführung einschließlich Dateimodus und Mitgliedschaft. Eigene Verification-Ausgaben sind ausdrücklich aus dem Inputset ausgeschlossen. Sämtliche nachstehenden Läufe haben Exit 0 und keine Quellabweichung. Unterstützte Nodes sind 24.22.2 und 26.5.0; TypeScript ist 5.9.3, npm 11.17.0, Browser Chromium 156.0.8078.4. Große Prozesse liefen seriell mit festem Heap und Timeout; Ressourcenprotokolle liegen jeweils daneben.

| Lauf | Tatsächliches Ergebnis | Dauer | Beleg |
| --- | --- | --- | --- |
| `sdk-node24` | 1455/1455 Checks, 6/6 Suiten | 81.14 s | [Originalreceipt](verification/final-r05/sdk-node24/execution-receipt.json) |
| `sdk-node26` | 1455/1455 Checks, 6/6 Suiten | 79.873 s | [Originalreceipt](verification/final-r05/sdk-node26/execution-receipt.json) |
| `project-runtime-node24` | 5/5 echte CSR-Fälle | 4.676 s | [Originalreceipt](verification/final-r05/project-runtime-node24/execution-receipt.json) |
| `project-runtime-node26` | 5/5 echte CSR-Fälle | 4.664 s | [Originalreceipt](verification/final-r05/project-runtime-node26/execution-receipt.json) |
| `source8-node24` | 12 Runtimefälle + 10 Compilernegative | 17.1 s | [Originalreceipt](verification/final-r05/source8-node24/execution-receipt.json) |
| `source8-node26` | 12 Runtimefälle + 10 Compilernegative | 17.12 s | [Originalreceipt](verification/final-r05/source8-node26/execution-receipt.json) |
| `source8-chromium` | 12 Runtimefälle + 10 Compilernegative | 14.779 s | [Originalreceipt](verification/final-r05/source8-chromium/execution-receipt.json) |
| `source7-node24` | 10 Runtimefälle + 10 Compilernegative + 2 Source8-Ablehnungen; genau 1 Produktivbuild | 14.997 s | [Originalreceipt](verification/final-r05/source7-node24/execution-receipt.json) |
| `source7-node26` | 10 Runtimefälle + 10 Compilernegative + 2 Source8-Ablehnungen; genau 1 Produktivbuild | 14.518 s | [Originalreceipt](verification/final-r05/source7-node26/execution-receipt.json) |
| `source7-chromium` | 10 Runtimefälle + 10 Compilernegative + 2 Source8-Ablehnungen; genau 1 Produktivbuild | 12.754 s | [Originalreceipt](verification/final-r05/source7-chromium/execution-receipt.json) |
| `knowledge-node24` | Knowledge --check: Exit 0 | 0.481 s | [Originalreceipt](verification/final-r05/knowledge-node24/execution-receipt.json) |
| `knowledge-node26` | Knowledge --check: Exit 0 | 0.479 s | [Originalreceipt](verification/final-r06/knowledge-node26/execution-receipt.json) |
| `mcp-node24` | 27/27 Nodefälle, keine Skips | 6.102 s | [Originalreceipt](verification/final-r06/mcp-node24/execution-receipt.json) |
| `mcp-node26` | 27/27 Nodefälle, keine Skips | 5.775 s | [Originalreceipt](verification/final-r06/mcp-node26/execution-receipt.json) |

Die gemischte CSR-Fixture führt den echten Produktionsbuild, ESM-Boot, ein natives Ereignis zur importierten Classic-Action samt Model-/DOM-Update, die öffentliche Action und Kernel-/Fabric-Focusdelegation aus. Source7 und Source8 verwenden tatsächlich installierte React-/Vue-Peers und auf der Browserlane versiegeltes Chromium. Die Größenobergrenzen bleiben unverändert bei 2.200.000 Frameworkbytes, 280.000 Komponentenbytes und 240.000 nativen Runtimebytes.

## Zusätzliche belegte Grenzen

- Die [offizielle Vorbereitung](verification/final-r04/releaseprep-node24/execution-receipt.json) bestand mit 997/997 Nodefällen in 15 Gruppen und ohne Skips. Anschließend wurden zwei veraltete E13-Exportzähler 238 auf 241 berichtigt. Der [exakte Metadatendelta-Beleg](verification/export-metadata-delta.json) weist diese begrenzte Änderung, Prosekorrekturen und fünf reguläre Inspector-Quellenpin-Aktualisierungen aus. Der 997-Lauf wird nicht als erneute Ausführung mit späteren Bytes ausgegeben; die aktuellen SDK- und Runtimeausführungen stehen oben.
- Die [fokussierten Projekt-/Editor-/Consumerfälle](verification/final-r04/focused-node26/execution-receipt.json) bestanden 73/73; [bestehende Compiler-/Maraca-Fälle](verification/final-r04/retained-node26/execution-receipt.json) 400/400, [native Literale](verification/final-r04/literal-node26/execution-receipt.json) 3/3. Die E13-Metadatendelta betrifft deren Produktcode nicht. Neue Fälle decken physische Paketgrenzen, gemeinsame echte Sessions, Providerpins ohne Ausführung, MCP-Workspacegrenzen und Inlinequellen ab.
- Die vollständigen rohen JSON-Ergebnisse aller acht Quellprofile werden mit dem tatsächlichen Git-Ausgangsstand verglichen: [Node24](verification/raw-profile-parity-r04-node24.json) und [Node26](verification/raw-profile-parity-r04-node26.json), je 16/16 Fälle einschließlich Type-Import-Ablehnungen. Die verglichenen Bytes werden nicht zur Vergleichbarkeit beschnitten.
- [Gepackte Root-/Compiler-/Maraca-Kombinationen](verification/packaged-project-r01/) und der [isolierte generierte Scaffold](verification/packaged-scaffold-r01/) laufen aus tatsächlichen npm-Tarballs. Der RMTX-Scaffold deklariert den benötigten Compiler. Ein leerer `NODE_PATH` verhindert einen zufälligen Repositoryfallback.
- Der [PHP-/Node-Transport](verification/php-transport-r01/) prüft echte lokale Fehlerrouten und Prozess-Roundtrips. Beide Transportseiten erhalten ausdrückliche Projekt-/Sprachoptionen.

## VS-Code-Paket

Die installierbare Erweiterung ist `xtend-rmt-language` 0.3.0, MCP 0.2.0, LSP-/Diagnosevertrag 2. Das tatsächliche Paket enthält TypeScript 5.9.3, LanguageClient 9 und seine Compiler-/Resolverclosure. Der [Bytevergleich](verification/editor-r06/pack-source-comparison-r06b.json) bindet 851 gepackte Quellpfade. [Gepackte CLI-/LSP-Closures auf beiden Nodes](verification/editor-r06/RUNS.md) und der [echte VS-Code-Extension-Host](verification/editor-r06/semantic-host-r06b.json) bestanden; letzterer prüft u.a. reale Classic-Definitionen, Rename über beide Dateien, Completion, UTF-16-Diagnosen und Dateiwatcherinvalidierung ohne Autoren-`NODE_PATH`.

Die abschließend getestete Datei ist `.xtend-test-results/rmtx-a065-editor/xtend-rmt-language-0.3.0-r06b.vsix`; SHA-256 `3d65f3c6381fe09f8954739b8a366bdecc04a6452b55668bce61fe5bf60e3485`. Die lokale Installation wurde am 21. November 2026 um 00:31 Uhr (Europe/Berlin) erfolgreich abgeschlossen: VS-Code-CLI Exit 0, registrierte Version 0.3.0 und vier kritische installierte Dateien bytegleich zum geprüften VSIX. Der Originalreceipt unter `.xtend-test-results/rmtx-a065-install/installation-receipt.json` meldet `installed:true` und `activationProven:false`. Installation auf Datenträger, isolierter Extension-Host-Lauf und Aktivierung im bereits laufenden Benutzerfenster sind getrennte Beobachtungen.

## Lokaler Quellenabschluss am 21. November 2026

Der abgeschlossene lokale Quellenabgleich bindet den ursprünglichen A06.5-Stand `1653ce81e263935b926caf5a6c6621b0e598cc03` mit 5189 Mitgliedern. Die unveränderten offiziellen Producer-/Provider-/Scannerquellen lieferten isolierte Captures; die vollständige Strict-Suite verwendete auf Node 24.22.2 und 26.5.0 jeweils einen authentifizierten gemeinsamen Kontext. Beide tatsächlichen Reports bestanden je 28 Checks ohne Fehler oder Skips; 53 historische Inventarwarnungen blieben unverändert. Der separate Konservierungsvergleich bestand 21.898 Checks. Der ursprüngliche Lauf schrieb keine Gitmetadaten, erstellte keinen Commit und pushte nicht; das ist eine historische Ausführungsangabe, keine Aussage über spätere Benutzercommits.

Der finale lokale Abschlussseal liegt unter `.xtend-test-results/rmtx-a065-governance/`; sein `completion-receipt.json`, die Originalreports und Producerreceipts dokumentieren den Erfolg. Der vorherige vollständige Strict-Versuch mit 54 Inventarmetadatenfehlern bleibt dort getrennt erhalten. Korrigiert wurden 31 aktuelle Shape-Policies und 23 individuell dokumentierte Varianten-/Kollisionsentscheidungen; vorhandene Autoritäten, Release-Locks, historische Reviews und geschützte Prüfer blieben erhalten. Weder diese Fehler noch ihre erfolgreichen Folgeläufe werden durch veränderte Quellpins umgedeutet.

Der erste vollständige MCP-Lauf in `final-r05` bestand 25/27 Fälle: Zwei alte Testannahmen betrafen den erweiterten Instruktionstext und das im isolierten Generatorfixture fehlende Paketmanifest. Beide Tests wurden gezielt korrigiert; die echten Vertrags- und Driftnegativen blieben erhalten. Die vollständigen Folgeläufe in `final-r06` bestanden auf beiden Nodes jeweils 27/27 Fälle; ihre Originalbelege stehen oben.

Frühere fehlgeschlagene Paket-, Typ-, Inspector-, E13- und Editorläufe bleiben mit Originalausgaben erhalten; siehe [Verificationverzeichnis](verification/README.md). Neue Quellhashes ersetzen keine historische Ausführung.

A06.5 implementiert Projekt- und Editorintegration und hat den lokalen Abschluss bestanden. Die [A06.6-Arbeitsgliederung](../release-acceptance/implementation.md) trennt die noch offenen Ziele, Implementierungsgrenzen und Nachweise. Beide Features bleiben `preparing`; die vollständige Rollenabnahme und die unterstützten SSR-/Adoptions-/Restore-/Replayprofile sind weiter offen. Für die formale Releasebindung fehlen registrierte Profile und standardisierte ExecutionEvidence auch für A06.5. Die Release-Paketlanes sind auf 24.18.0/26.5.0 gepinnt; diese lokalen 24.22.2-/26.5.0-Reports ersetzen sie nicht. Neue Dokumentbytes und spätere Quellenstände müssen im finalen Releaseabschluss frisch erfasst werden.
