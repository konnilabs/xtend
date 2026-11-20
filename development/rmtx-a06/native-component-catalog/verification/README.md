# Ausführungsbelege für den nativen Source8-Katalog

Stand: 20. November 2026. Die aktuellen Produktionsberichte wurden nach den finalen SDK-/Typkorrekturen und der gemeinsamen Source7-/Source8-Literalemission neu ausgeführt. Alle JSON-Reports und Ressourcenlogs wurden unverändert aus den tatsächlichen Läufen kopiert; ältere erfolgreiche und fehlgeschlagene Belege bleiben unter ihren ursprünglichen Namen erhalten.

| Aktueller Produktionsbeleg | Tatsächliche Ausführung |
| --- | --- |
| [Source8 Node24 r03](native-managed-node24-r03.json) | Node24.22.2: zwölf Runtimefälle und zehn Compilernegative; 563 Quellhashes vor/nach identisch |
| [Source8 Node26 r03](native-managed-node26-r03.json) | Node26.5.0: zwölf Runtimefälle und zehn Compilernegative; 563 Quellhashes vor/nach identisch |
| [Source8 Chromium r03](native-managed-chromium-r03.json) | Chromium156.0.8078.4: zwölf Runtimefälle und zehn Compilernegative; versiegelte native ESM-Dateien, keine Page Errors |
| [Source7 Node24 r02](source7-retention-node24-r02.json) | Zehn echte Runtimefälle, zehn Compilernegative und zwei Abweisungen von Source8-Verträgen; 576 unveränderte Quellhashes |
| [Source7 Node26 r02](source7-retention-node26-r02.json) | Derselbe vollständige Source7-Umfang auf Node26.5.0 |
| [Source7 Chromium r02](source7-retention-chromium-r02.json) | Derselbe vollständige Source7-Umfang in echtem versiegeltem Chromium156.0.8078.4 |

Die drei Source8-Lanes binden exakt denselben Satz von 563 Quellhashes; die drei Source7-Lanes exakt denselben Satz von 576. Beide Mischfixtures verwenden tatsächliche React18.3.1-/Vue3.5.43-Provider, typisierte numerische und textuelle Schlüssel, die vorhandenen Controller-/Graph-/Kernel-/Fabric-Instanzen, Slots und behaltene beziehungsweise terminale Lifetimes. Die Source8-Fixture prüft zusätzlich echte Komponenten-Effects und URL-/State-Restore.

| Aktuell gemessener Scope | Source8 | Source7 | Feste Vergleichsgrenze |
| --- | ---: | ---: | ---: |
| Framework, alle tatsächlich budgetierten Dateien | 2195511 B | 2098682 B | 2200000 B |
| Aggregierte XTension-Komponentenruntime einschließlich Companion | 270515 B | 268439 B | 280000 B |
| Separates NativeView-Asset, Port4 beziehungsweise Port3 | 178535 B | 128977 B | 240000 B |

Diese Größen stammen aus den tatsächlich gebauten Dateien und deren unveränderter Accounting-Mitgliedschaft; Bytes und SHA-256 werden gegen die Outputs geprüft. Die Source8-Frameworkreserve beträgt 4489 Bytes. Die zugehörigen `*-r03-resource.log`- und `*-r02-resource.log`-Dateien enthalten die tatsächlichen `/usr/bin/time -v`-Messungen und Exitstatus0. Heaplimit: 1024 MiB; externer Timeout: 300 Sekunden. Source8 misst für Node24/Node26/Chromium 612340/496328/636092 KiB Prozess-RSS, Source7 596364/471768/632908 KiB. Dies ist keine aggregierte Chromium-Prozessgruppenmessung.

Die zusätzliche [Source7-Literalintegration auf Node24](source7-literal-integration-node24.tap) und [Node26](source7-literal-integration-node26.tap) besteht mit je drei Fällen. Ihr neuer tatsächlicher nativer Regular-Build importiert und bootet ohne Companion oder TDZ, vergleicht das vollständige Program5/Header2 sowie Kernel-/Hydration-/Validation-/Transitionartefakte mit den kompilierten Werten und hält sie eingefroren. Zwei nachweislich DAG-geteilte gleiche Initialobjekte bleiben im tatsächlichen Model unabhängig: Eine echte Action verändert nur den linken verschachtelten Wert und dessen DOM-Ausgabe; der rechte Zustand und das kompilierte Program bleiben unverändert. Die `*.resource.log`-Dateien dokumentieren diese kleinen Prüfläufe mit 512 MiB Heaplimit und 120 Sekunden Timeout.

Die getrennten [aktuellen Komponentenbelege](../README.md) bestehen mit 86 Browserfällen und 38 Originalfällen in 36 neuen Cold-Registry-Kontexten. Die historische 82-Fall-Ausführung unter [catalog-browser.json](catalog-browser.json) bleibt erhalten. Die aktuellen Funktionsreports unterscheiden die unabhängig reproduzierten, blockierten CSP-Diagnosen des inert geparsten Sanitizer-Negativfalls von unerwarteten Fehlern, Requests und Ausführungen; letztere bleiben Fehler.

| Aktuelle SDK-Abnahme nach Trennung der Port-Kennungen | Ergebnis |
| --- | --- |
| [SDK Node24](sdk-node24-state-port.json) / [SDK Node26](sdk-node26-state-port.json) | Je sechs tatsächliche Suiten und 1452 bestandene Checks: Typen200, Export-Lock438, TypeScript-Komponentenbuild26, RMT-Typen490, isolierter Tarball-Consumer7 und Kernel-Artefaktparität291 |
| [Strikte Importmodusprüfung](import-mode-types-node24.json) | TypeScript5.9.3, Node16-Modulauflösung, `.cts` und `.mts`, `skipLibCheck:false`: keine Diagnosen |

Die SDK-Läufe entpacken die tatsächlichen Root-/Compiler-/Maraca-Tarballs und stellen ausschließlich deren deklarierte Abhängigkeiten samt Transitives bereit. Die Kanten und Versionen werden gegen die tatsächliche Consumer-Auflösung geprüft. `NODE_PATH` bleibt im Consumer leer; React und Vue werden ausschließlich über explizite Peerports eingebracht. Der neutrale Browserbundle enthält sie nicht. Die `sdk-node*-state-port-resource.log`-Dateien binden die abschließenden Läufe. Die vorherigen `sdk-node*-current.json`-Dateien nach der Source7-Optimierung bleiben ebenso erhalten wie die noch früheren SDK-Dateien.

Der [vollständige Vorbereitungslauf](preparation-final/index.json) enthält 94 erfolgreiche Kommandos und die Konservation seiner 2833 Eingänge. Die anschließend gefundene gemeinsame Schema-ID von State-Port und Service-Aggregat wurde in genau drei Code-/Testdateien getrennt. Der [eigene Nachweis](state-port-fix/index.json) bindet diese Dateien vor/nach den erneut ausgeführten 134 Fällen je Node24/26 und dem frischen [86-Fall-Browserlauf](catalog-browser-state-port.json). Die 1196 unveränderten Cold-Eingangsbindungen bleiben aktuell. Ältere Komplett- und Browserberichte behalten ihre ursprünglichen Hashes und werden nicht als vollständig erneut ausgeführter Stand dieser Korrektur bezeichnet.

| Frühere und ergänzende Belege | Ergebnis |
| --- | --- |
| [SDK Node24, vorheriger Stand](sdk-node24.json) / [SDK Node26, vorheriger Stand](sdk-node26.json) | Je sechs tatsächliche Suiten mit 1452 bestandenen Checks, vor der Source7-Emissionsoptimierung; die aktuellen Läufe sind oben getrennt verlinkt |
| [Release-Units Node24](release-node24.tap) / [Node26](release-node26.tap) | Je sechs ausgeführte Fälle |
| [Legacy-Delivery](legacy-delivery-node24.json) | 18 bestehende A04-Prüfungen mit unveränderten 240000-/2200000-Byte-Grenzen |
| [Plattformprofile](legacy-platform-profiles-node24.log) | Fünf tatsächliche Legacy-/Source7-/Source8-Emissions- und Profilprüfungen |
| [Private Cores](private-cores-node24.log) | Drei Prüfungen zu Legacy-Exportmenge und Build-Datenliteral vor der neuen nativen Integration |

Der [unabhängige Eingangsvergleich](source7-incoming-baseline-node24.json) baut den eingefrorenen Stand39907c7 in einer eigenen Kopie mit eigenen Workspace-Bindungen, identischem Source7-Fixture und denselben Optionen. Alle 4231 Quellhashes der Kopie und des eingefrorenen Originals bleiben unverändert. Der damals vorhandene Source7-Runtime-Runner hatte keine festen 2,2M-/280k-Grenzen behauptet. Deshalb ist die neue Retentionsprüfung ausdrücklich ein aktueller Scopevergleich, keine rückwirkend erfundene historische Budgetabnahme. Die historische 240000-Byte-Grenze für separate Legacy-Delivery-/SSR-Runtimes bleibt ein anderer Scope.

| Tatsächlicher Source7-Stand | Framework | Komponentenruntime | NativePort3 |
| --- | ---: | ---: | ---: |
| Eingehender unveränderter Stand39907c7 | 2220910 B | 308624 B | 122402 B |
| [Erste aktuelle Messung vor der Literaloptimierung](source7-retention-node24-budget.json) | 2302122 B | 316242 B | 128977 B |
| Aktuelle ausgeführte Retention nach der Optimierung | 2098682 B | 268439 B | 128977 B |

Der Eingangsstand überschritt bereits die neu verglichenen Framework-/Komponentengrenzen. Die gesamte frühere Überschreitung war daher keine neue Regression; das tatsächlich hinzugekommene Gewicht betrug 81212/7618/6575 Bytes. Die begrenzte Optimierung teilt nur nach vollständiger JSON-Gleichheit unveränderliche Program-/Subplan-/Bindingdaten in den emittierten Plan11-/Plan12-Artefakten. Sie ändert weder Schemas noch Ports, SSR-Zulassung oder den vollständigen SDK-Katalog. Gegenüber dem Eingang sind es jetzt 122228 weniger Frameworkbytes und 40185 weniger Komponentenbytes. Der frühere fehlgeschlagene Grenzlauf und sein [Ressourcenreceipt](source7-retention-node24-budget-resource.log) bleiben als Messbefund erhalten; seine Runtimefälle wurden wegen des frühen Budgetabbruchs nicht ausgeführt.

Frühere Source8-Produktionsbelege bleiben unter [runtime-node24.json](runtime-node24.json), [runtime-node26.json](runtime-node26.json), [runtime-browser.json](runtime-browser.json), [native-managed-node24.json](native-managed-node24.json) und den drei `native-managed-*-r02.json`-Dateien erhalten. Die ersten drei binden 562 Quellen und messen 2195739/270515/178535 Bytes; spätere Zwischenstände binden 563 Quellen, wurden aber durch nachfolgende Source7-Test-, DTS- beziehungsweise Builderkorrekturen überholt. Ihre Hashes und Zahlen wurden nicht umgepinnt. Die Source1–6-Emissionszweige bleiben im Code unverändert; eine zusätzliche unabhängige Messung ihrer vollständigen Ausgabebytes wird hier nicht behauptet.

Produktionsberichte behalten `acceptedForRelease: false`, `completeA064Implemented: false` und `ssrAcceptancePerformed: false`. Diese CSR-/Retentionsbelege ersetzen die gesonderten SDK-, Legacy- und Release-Gates nicht und erteilen keine neue SSR-Freigabe. Die lokalen Buildverzeichnisse unter `/tmp/xtend-native-catalog-v2/source*-build-*` beziehungsweise `source7-retention-build-*` bleiben zusätzliche Diagnoseartefakte außerhalb des Repositorys.
