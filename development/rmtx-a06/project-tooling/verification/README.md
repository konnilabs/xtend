# A06.5 – tatsächliche Ausführungsbelege

Die Unterverzeichnisse enthalten Originalausgaben, Befehle, Ressourcenmessungen und Quellbezüge der jeweiligen Ausführung. Ein grüner Zwischenlauf wird nach einer Quelländerung nicht nachträglich als Ausführung des neuen Standes bezeichnet. Laufzeitbelege erteilen keine Paket- oder Featurefreigabe; die gemeinsame Releaseabnahme bleibt A06.6.

## Erhaltene Zwischenstände

| Ausführung | Tatsächliches Ergebnis | Einordnung |
| --- | --- | --- |
| `final-r01/focused-node24` | 69/69 bestanden, keine Skips, Exit0, 19,924s, keine Quellabweichung während des Laufs. | Vor der zusätzlichen Prüfung ursprünglicher Modulbindungen; als Zwischenstand erhalten. |
| `final-r02/focused-node24` | 70/70 bestanden, keine Skips, Exit0, 19,739s, keine Quellabweichung während des Laufs. | Nach der Modulbindungsprüfung, vor den später gefundenen Paketkorrekturen. |
| `final-r02/focused-node26` | 70/70 bestanden, keine Skips, Exit0, 20,286s, keine Quellabweichung während des Laufs. | Derselbe Zwischenstand auf Node26. |
| `final-r02/retained-node24` | 393/398 bestanden, fünf echte Fehler, Exit1, 72,099s, keine Quellabweichung; maximaler gemessener RSS633432KiB. | Drei echte gepackte Maraca-Einstiege konnten `project-build.js` nicht laden; zwei Deklarationsprüfungen wiesen die unbeabsichtigte Pflicht zum Projektergebnis bei bisherigen Compilerports nach. Der Folgelauf wurde angehalten. |
| `final-r03/releaseprep-node24` | Die offizielle Vorbereitung führte151 Nodefälle aus:65+30+56, alle bestanden, keine Skips. Danach Exit1 nach73,993s beim als veraltet erkannten Frontend-Inspectorbeleg; keine Quellabweichung. | Die reparierten tatsächlichen Paket-/Typfälle bestanden. Der reguläre Inspector muss nach den letzten Änderungen erneut geprüft und aktualisiert werden; ein vollständiger grüner Vorbereitungslauf ist damit noch nicht belegt. |
| `final-r04/releaseprep-node24` | Offizielle Vorbereitung Exit0,997/997 Nodefälle in15 Gruppen, keine Skips/Todos,475,645s, keine Quellabweichung. | Einschließlich regulärer Inspector-, Versions- und Featureplanprüfungen; vor der anschließenden E13-Zählerkorrektur ausgeführt. |
| `final-r04/focused-node26`, `retained-node26`, `literal-node26` | Tatsächlich73/73,400/400 und3/3 bestanden, jeweils ohne Skips und Quellabweichung. | Aktueller Stand dieses Zwischenlaufs; keine zusätzliche Node24-Doppelausführung dieser bereits in der offiziellen Vorbereitung enthaltenen Fälle. |
| `final-r04/project-runtime-node24`, `project-runtime-node26` | Tatsächlich je5/5 echte gemischte Projektfälle bestanden, Kernel/Fabric- und Classic-Actionausführung bestätigt. | Originalreports mit ihren tatsächlichen Quellpins erhalten. |
| `final-r04/source8-*`, `source7-*` | Source8: je12 Runtimefälle und10 Compilernegative; Source7: je10 Runtimefälle,10 Compilernegative und2 echte Source8-Abweisungen. Beide Nodes und versiegeltes Chromium156.0.8078.4 bestanden ohne Quellabweichung. | Je Source7-Lauf genau ein beobachteter Produktivbuild. Unveränderte Byteobergrenzen eingehalten; spätere Paketmetadatenänderungen erfordern frische Belege für die gepinnten neuen Bytes. |
| `final-r04/sdk-node24` | Sechs Suiten ausgeführt: fünf bestanden, E13 mit439 bestandenen Checks und zwei Fehlern. Gesamt1453 Checks bestanden, zwei fehlgeschlagen, keine Skips,84,836s, keine Quellabweichung. | Veraltete erwartete Exportzahl238 in Test und E13-Paketmetadaten statt241. Die übrigen Suiten bestanden mit200/26/490/7/291 Checks. Der Folgelauf wurde angehalten. |

Die Fehlerausgabe der Retentionsprüfung bleibt unverändert erhalten. Ihre Reparatur wird durch neue Ausführungen geprüft. Insbesondere ersetzen aktuelle Quellhashes keine frühere Ausführung.

Die übrigen Belegfamilien besitzen eigene Originaldateien: `editor-r01`/`editor-r02` für gepackte Editor- und Hostausführungen, `raw-profile-parity-r01-*`/`raw-profile-parity-r02-*` für den vollständigen JSON-Bytevergleich der acht rohen Quellprofile mit dem Git-Ausgangsstand und `php-transport-r01` für den tatsächlichen PHP-/Node-Transport. Ihre Ergebnisse und Quellbindungen sind in den jeweiligen Reports nachzulesen.

## Umfang der zentralen Prüfungen

Die zentrale Folgeausführung verwendet getrennte Node24-/Node26-Lanes, tatsächlich installierte React-/Vue-/DOM-Peers, TypeScript5.9.3 sowie npm11.17.0. Große Prozesse laufen nacheinander; Node-Testdateien laufen mit `--test-concurrency=1`. Die Befehle besitzen Heap- und Zeitgrenzen. `resources.txt` enthält die tatsächliche Messung von `/usr/bin/time -v`.

Jeder zentrale Schritt schreibt `command.json`, vollständige Standardausgaben und `execution-receipt.json`. Die Quellbelege erfassen vor und nach dem Prozess die aktuelle Mitgliedschaft, Bytes und Modi des Arbeitsbaums; nur die eigenen Ergebnisse unter diesem `verification`-Verzeichnis sind davon ausgenommen. Diese Prüfung belegt unveränderte Quellen während des konkreten Laufs. Der spätere offizielle Governance-Capture erhält seine eigene vollständige Quellenbindung und Strict-Prüfung.

Source7-/Source8-Produktionsrunner besitzen zusätzlich ihre eigenen konkreten Eingangslisten und tatsächliches Delivery-Accounting. Der Source7-Retentionsharness ruft den bestehenden Produktionsrunner genau einmal auf, beobachtet dessen tatsächlichen Build und prüft zwei Abweisungen eines zuvor positiv validierten echten Source8-Programms. Die bestehenden Größenobergrenzen bleiben unverändert. Diese Retention ersetzt den eigenen Nachweis der gemischten A06.5-Projektfixture nicht.

## Abschließender Implementierungsstand

Die aktuellen SDK-, Produktions-, Browser-, Knowledge- und MCP-Ausführungen stehen in [execution-summary.md](../execution-summary.md). Die Serien `final-r05` und `final-r06` sind tatsächliche neue Läufe mit Originalreceipts, Vor-/Nachherquellen und Ressourcenbelegen. Die dort ausgewiesenen 14 Läufe bestanden ohne Skips und ohne Quelldrift während der Ausführung.

Der erste vollständige MCP-Lauf `final-r05/mcp-node24` enthält 25 bestandene und zwei fehlgeschlagene Fälle. Es waren veraltete Instruktionsassertionen beziehungsweise ein im isolierten Driftfixture fehlendes Paketmanifest. `final-r06` prüft beide Reparaturen vollständig auf Node24 und Node26 mit jeweils 27/27 Fällen; die produktiven MCP-Bytes und die Driftnegativen wurden dafür nicht verändert.

Die endgültige gepackte Erweiterung und ihr echter Extension-Host-Nachweis liegen in `editor-r06`, die vollständigen Raw-JSON-Bytevergleiche in `raw-profile-parity-r04-*`. Der nachgelagerte offizielle Quellenabschluss und die lokale Installation besitzen getrennte Receipts außerhalb des eingefrorenen Quellarchivs. A06.6 und die gemeinsame Releasefreigabe bleiben davon getrennt.
