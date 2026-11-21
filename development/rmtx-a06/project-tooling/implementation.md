# A06.5 – Projekt- und Editorintegration für RMTX

Aktueller Dokumentationsstand: **21. November 2026**, Dokumentrevision **1.1.0**. Implementierungsbasis: `6a123f9657b533554a455a8ee44d853b6b77bf6d`. A06.5 ist implementiert und lokal geprüft; der getrennte lokale Quellenabschluss und die Installation von VSIX 0.3.0 sind erfolgt. Die Originalausführungen vom 20./21. November binden ihre jeweiligen damaligen Quellen. Diese Dokumentationsfortschreibung ist keine erneute Ausführung oder formale 0.9-Freigabe.

A06.5 verbindet die vorhandenen RMT-Classic- und RMTX-Compiler mit einem gemeinsamen Projektgraphen, den bestehenden Build- und Serviceeinstiegen sowie semantischem Editorwerkzeug. A06.6 bleibt die gemeinsame Releaseabnahme von RMTX und XTensions 2.0. Der Featurestatus `preparing` und die bestehenden SSR-/Adoptionsgrenzen werden durch diesen Abschnitt nicht aufgehoben.

## Projektvertrag

Der neue Einstieg `tools/rmt-language/rmt-project.js` erhält einen eigenen Projektvertrag1. Er wählt die Quellsprache ausdrücklich und führt bestehende Importdeklarationen aus `.rmt` und `.rmtx` durch dieselbe begrenzte Auflösung. Die unveränderten rohen RMTX-Quellprofile1–8 behalten ihren jeweiligen Syntax- und Wirevertrag. Dieses Paket führt keine beliebigen JavaScript-Modulimporte oder neuen `import type`-Formen in RMTX ein. Normale `.tsx`-Provider bleiben Providerquellen.

Der Projektcompiler muss importierte Deklarationen tatsächlich zu einem ausführbaren gemeinsamen Core zusammenführen. Ein Graph mit einer erfolgreichen Topologiesortierung genügt dafür nicht. Doppelte Deklarationen, nicht auflösbare Referenzen, Importzyklen und unerlaubte Grenzen liefern Fehler; der Resolver erfindet keine Umbenennung oder zusätzliche Runtimeautorität. Parser-/Compiler-APIs werden bei geänderten Fähigkeiten ausdrücklich versioniert. Bestehende profilabhängige Resultatschemata werden dadurch nicht still erweitert.

Die zusätzliche Projektinformation bindet mindestens den gewählten Compiler-/Sprachvertrag, die Einstiegsidentität, die tatsächlichen transitiven Eingänge und die Herkunft der zusammengesetzten Deklarationen. Quelldiagnosen behalten die ursprüngliche Datei und deren Range. Zusammengesetzte ASTs oder virtuelle TypeScript-Dateien dürfen keine fremde Datei als Fehlerursprung ausgeben.

Auflösung und Discovery bleiben deterministisch und an die zugelassenen Paket-/Projektwurzeln gebunden. Die Prüfung umfasst reale Dateipfade, damit ein Symlink keine zusätzliche Wurzel erzeugt. Gleichnamige `.rmt`-, `.rmtx`- und `.tsx`-Dateien sind unterschiedliche Eingänge. Unterstützte Import-/Globformen werden ausdrücklich ausgewiesen; fehlende und nicht zugelassene Eingänge bleiben Fehler.

## Wiederverwendung und Invalidierung

Compilation Session, CLI, Maraca, Hydrangea und MCP verwenden denselben Projektcompiler beziehungsweise dessen gebundene Ergebnisse. Sprache und Profil werden übergeben und nicht aus einer beliebigen JSX-Datei erraten. Der vorhandene Classic-Einstieg bleibt erhalten.

Die Cacheidentität berücksichtigt Inhalt, Dateiname, Sprache, Profil, Compilervertrag, relevante Konfiguration und tatsächliche transitive Abhängigkeiten. Eine Änderung nur einer importierten Datei muss das betroffene Ergebnis invalidieren. Das gilt auch für Umbenennung, Löschung und einen inzwischen fehlenden Import. Nicht cachebare Optionen dürfen nicht auf einen gemeinsamen Ersatzschlüssel fallen. Der Editor muss ungespeicherte Dokumentstände berücksichtigen.

Watch aktualisiert die beobachtete Abhängigkeitsmenge nach einer erfolgreichen oder fehlgeschlagenen Auflösung. Alte Resultate dürfen einen aktuellen Fehler nicht verdecken. Unabhängige Einstiege dürfen ihre gültigen Ergebnisse weiterverwenden, sofern deren tatsächliche Abhängigkeiten unverändert sind.

## Implementierte Consumerverträge

Der äußere Projektgraph und sein Quellenbericht verwenden jeweils Vertrag1. `sourceSyntax` bezeichnet den Einstieg (`rmt-vnext` oder `rmtx`); `effectiveSourceProfile` bezeichnet den tatsächlich verknüpften Compilervertrag. Auch ein Classic-Einstieg mit importierter RMTX-View verwendet deshalb das echte RMTX-Profil8, während der Einstieg weiterhin Classic bleibt. Die ursprünglichen Compilerresultate bleiben unter dem zusätzlichen Feld `project` erhalten.

Compilation Session verwendet API2 beziehungsweise `xtend.rmt.compilation-session.v2`. Der neue Einstieg `compileProjectSource` liest vor einem Cachetreffer den aktuellen transitiven Graphen. Nicht cachebare Optionen erzeugen keine Treffer. Ein zwischen Snapshot und Compile geänderter Eingang wird nicht unter dem älteren Graphschlüssel gespeichert. Der neue optionale Parameter `maxEntries` begrenzt gespeicherte Generationen; ohne ihn bleibt das bisherige Sitzungsverhalten erhalten. `createRmtProjectWatcher` (API1, `xtend.rmt.project-watch.v1`) hält höchstens ein vollständiges Compilergebnis, behält unveränderte Polls als Cachetreffer und gibt überholte AST-/Core-/Programmgenerationen frei. Fehlende Imports und umbenannte Dateien werden weiter gelesen und diagnostiziert.

Maraca erhält die separaten äußeren Verträge `xtend.maraca.project-config.v1`, `xtend.maraca.project-build-plan.v1` und `xtend.maraca.project-build-result.v1` mit API1. Der native Plan12, das Program6 und die vorhandenen Runtimeverträge werden dadurch nicht geändert. `createMaracaProjectBuildPlan` und `buildMaracaProjectBundle[Async]` halten den Projektcompiler auch im zweiten Durchlauf mit gepinnten Providermetadaten fest. Eine geteilte `compileSource`-Funktion muss die echte `compileProjectSource` einer Compilation Session derselben Wurzel sein; ein privater WeakMap-Nachweis lässt keine Registrierung fremder Callbacks zu. Der Wrapper entsorgt nur eine selbst erzeugte Sitzung. Dadurch verwenden auch JIT/Hydrangea dieselben Fakten und ihre Sitzungsmetriken erfassen die tatsächlichen Compileraufrufe.

Das Tooling-Bridge-API2 verwendet für ausdrückliche Projektaufrufe Request-/Response-/Diagnose-v2. Ein ausdrücklicher v1-Aufruf mit RMTX-/Projektoptionen wird abgewiesen; normale Classic-Aufrufe behalten v1. CLI und MCP verwenden die kanonische Projektkompilierung einschließlich semantischer TypeScript-Prüfung. Ein übergebenes `semanticCheck:false` schaltet die Prüfung an diesen Benutzereinstiegen nicht aus. Klassische Diagnosen mit dem Feld `file` werden ebenfalls als Quelldatei übernommen. Die VS-Code-Aufgaben rufen diese tatsächlichen CLI-Einstiege auf:

```sh
xt rmt check src/app.rmtx --project --source-syntax rmtx --rmtx-syntax-version 8.0.0 --json
xt rmt watch src/app.rmtx --project --source-syntax rmtx --rmtx-syntax-version 8.0.0 --json
xt maraca build src/app.rmtx --project --source-syntax rmtx --out dist --json
xt create app --runtime maraca --design-kit none --source-syntax rmtx --out rmtx-app --write --json
```

Der neue RMTX-Scaffoldvertrag2 schreibt eine native `src/app.rmtx`, eine ausdrücklich importierte Classic-Datei für Host-Service-Deklarationen sowie die äußere Projektkonfiguration1. Seine tatsächlichen Check-/Watch-Skripte binden Profil8 ausdrücklich. Die lexikalische Buttonereignisbindung verwendet den tatsächlich emittierten JSON-DTO `button-interaction` und dessen Feld `detail.type`. Unveränderte Classic-Scaffolds behalten Vertrag1. Der Material-Preset bleibt Classic; seine Auswahl zusammen mit RMTX wird ausdrücklich abgewiesen.

Providerkonfiguration kommt aus der optionalen `rmtx.providers.json` an der Projektwurzel oder ausdrücklich aus `rmtxProvidersFile` (`--rmtx-providers-file` an der CLI). Das bestehende Schema `xtend.maraca.rmtx-providers.v1` wird wiederverwendet. Der Root-Resolver liefert `rmtxProviders`, `rmtxProvidersFile` und den vertrauenswürdigen `componentInterfaceCatalog`; Register-, Schnittstellen- und Modulbytes gehören zu seinen Abhängigkeiten. Maraca übernimmt genau diesen Pinsdescriptor in seinen vorhandenen nativen Plan, ohne eine zweite Defaultdateiauflösung zu erfinden. Der Consumerfall prüft echte CLI-/MCP-/Maraca-Identitäten, Konfigurationsinvalidierung und ein absichtlich bereits auf Modulebene werfendes Providermodul: Tooling darf dieses Modul nicht ausführen.

MCP verwendet Server-API0.2 und für Projektquellen die jeweiligen Diagnose-/Compile-Check-/Maraca-Plan-v2-Ergebnisse. Die physische Workspacewurzel bleibt redigiert. Eine Projektdiagnose enthält dafür `workspacePath` sowie eine gültige URI wie `xtend-workspace:///src/view.rmtx`; Pfadsegmente sind prozentkodiert. Der Client löst diese URI gegen den für den Aufruf gewählten Workspace auf. Sie ist keine `file:`-URI. Der ursprüngliche Bereich bleibt identisch zur CLI-Diagnose. V1 behält seinen bisherigen Redaktionsvertrag; virtuelle TypeScript-Dateien sind kein Navigationsziel. Classic-Reparaturen und der Portable-Page-SSR-Einstieg weisen RMTX weiterhin ausdrücklich ab.

Die vollständigen aktuellen Consumerfälle prüfen zusätzlich Providerdurchleitung, explizite MCP-Workspacegrenzen, beide Inline-Quellparameter und getrennt gepackte Compiler-/Maraca-Eigentümer. Die gemischte CSR-Fixture unter `runtime/` besteht auf Node24 und Node26 jeweils fünf echte Fälle: Produktionsbuild, ESM-Boot nativer Header-/Buttonklassen, Buttoninteraktion zur importierten Classic-Action mit Model-/DOM-Update, öffentliche Actionausführung und Kernel-/Fabric-Delegation einer nativen Focus-Operation. Maßgeblich sind die unveränderten Originalberichte und ihre tatsächlichen Quellenpins im [Ausführungsbericht](execution-summary.md). Frühere Fehlversuche bleiben dort unterscheidbar erhalten.

## Semantischer Editorvertrag

RMTX erhält seine eigene semantische Verarbeitung. Sein Text wird nicht an den Classic-Parser oder dessen Codeaktionen weitergereicht. Syntaxhighlighting, Sprachkennung, Icons und bestehende Classic-Funktionen bleiben erhalten.

Die virtuelle TSX-Abbildung verwendet belegbare Typinformationen aus literalem `State.initial`, vorhandenen Typdeklarationen, Selektoren, lexikalischen Wiederholungen und Actioneingaben. Nicht belegbare Formen erhalten keine erfundene Typgewissheit. Die vorhandenen geschlossenen Ausdrucks-, DTO- und Providerregeln bleiben zusätzlich zur TypeScript-Prüfung verbindlich.

Fehler, Completion, Definitionen, Referenzen und Rename werden auf die echten RMTX- beziehungsweise referenzierten Quelldateien zurückgeführt. Generierte Hilfsnamen und virtuelle Dateinamen sind kein Benutzerziel. Positionsabbildung verwendet dieselben UTF-16-Offsets wie TypeScript und LSP und muss mehrzeilige Eingänge, CRLF sowie Zeichen außerhalb der BMP korrekt behandeln. Fehlerhafte und noch unvollständige JSX-Eingaben bleiben diagnostizierbar; die letzte erfolgreiche Fassung ersetzt keinen aktuellen Editorstand.

## Überprüfbare Abnahme

| Kennung | Erforderlicher Nachweis | Status |
| --- | --- | --- |
| P01 | Gemischter `.rmt`-/`.rmtx`-Importgraph mit deterministischen Modulidentitäten und Reihenfolge; normale `.tsx`-Provider werden nicht als deklarative Quelle kompiliert. | belegt: Projekt- und Consumerfälle |
| P02 | Ein tatsächlicher Build verwendet eine importierte Action beziehungsweise Surface aus der jeweils anderen Quellsprache; ein Importgraph allein genügt nicht. | belegt: gemischter CSR-Produktionslauf, beide Nodes |
| P03 | Fehlender Import, Zyklus, doppelte Deklaration, nicht zugelassene Endung und Symlink außerhalb einer Wurzel scheitern mit ursprünglicher Quelldatei und Range. | belegt: Resolvernegative und ursprüngliche Ranges |
| C01 | Wiederholung unveränderter Eingänge trifft den Cache; Änderung, Löschung oder Umbenennung einer transitiven Abhängigkeit invalidiert das betroffene Ergebnis. | belegt: Session-/Watch- und Overlayfälle |
| C02 | Sprache, Profil, Dateipfad und relevante Konfiguration unterscheiden Cacheeinträge; nicht cachebare Optionen erzeugen keine falschen Treffer. | belegt: Cacheidentitäts- und Portfälle |
| E01 | Typfehler und unbekannte Modelpfade werden in der echten `.rmtx`-Range gemeldet; literale Attribute allein sind kein Modeltypnachweis. | belegt: semantischer Service und echter LSP |
| E02 | Selector-, Repeat-/Item- und Actioninput-Kontexte behalten ihre jeweilige lexikalische Bedeutung; ungesicherte Formen werden nicht als sicher typisiert ausgegeben. | belegt: Selector-/Repeat-/Inputfälle |
| E03 | Completion, Definition, Referenzen und Rename erreichen reale Deklarationen und Verwendungen einschließlich importierter Quellen. | belegt: importierte Classic-Quelle im echten Extension Host |
| E04 | Unvollständiges JSX, mehrzeilige Ausdrücke, CRLF und UTF-16-Zeichen behalten korrekte Diagnosen und Editranges. | belegt: Recovery-/CRLF-/UTF-16-Fälle |
| E05 | Ungespeicherte Änderungen importierter Editorquellen werden berücksichtigt; RMTX erhält keine Classic-Codeaktion oder Classic-Parsefehler. | belegt: LSP-Overlays, Workspacewurzeln und echter Dateiwatcher |
| T01 | CLI und MCP liefern für denselben Eingang dieselben fachlichen Compilerdiagnosen mit ursprünglichen Dateien und Ranges. | belegt: tatsächliche CLI-/MCP-Diagnoseparität |
| T02 | Scaffold erzeugt ein ausdrücklich ausgewähltes, tatsächlich kompilierbares RMTX-Projekt; bestehende Classic-Projekte bleiben nutzbar. | belegt: erzeugtes Projekt und isoliert gepackter CLI-Einstieg |
| T03 | Compilation Session und Hydrangea verwenden Projektidentität und Abhängigkeiten; es entsteht kein zusätzlicher ungeprüfter Compilerpfad. | belegt: authentische gemeinsame Session und gepackte Eigentümer |
| V01 | Die tatsächlich gepackte VS-Code-Erweiterung enthält alle benötigten Compiler-, Resolver-, Typ- und Sprachserviceabhängigkeiten. | belegt: finaler VSIX r06b, beide Nodes und echter VS Code Host |
| L01 | Vorhandene Classic-Funktionen und rohe RMTX-Profile1–8 bestehen ihre relevanten Kompatibilitätsprüfungen. | belegt: Retentionssuite und vollständiger Raw-JSON-Bytevergleich |
| G01 | Öffentliche Exporte und Typen, neue Vertragsversionen, vollständige Quellenmitgliedschaft und bestehende Governancebindungen sind aktuell; alte Autoritäten, Release-Locks und historische Reviews bleiben erhalten. | lokal belegt: ursprünglicher A06.5-Capture mit 5189 Mitgliedern, je 28 Strict-Checks auf beiden Nodes; 53 historische Warnungen erhalten |

Die Nachweise und ihre Grenzen sind im [Ausführungsbericht](execution-summary.md) mit konkreten Originaldateien verknüpft. Die zentrale Vorbereitung, SDK-Suiten, gepackten Consumer-/Editorläufe, Raw-Kompatibilität und Produktionsrunner wurden tatsächlich ausgeführt. Ein Inspector oder neuer Hash ersetzt keinen Runtime- oder Browserlauf.

## Grenzen und Quellenabschluss

Graphdiscovery ist auf 256 Module und 8 MiB Eingangsbytes begrenzt. Der bestehende Parser für den zusammengesetzten Quelltext behält zusätzlich seine 1 MiB-Grenze. Die Discoverygrenze verspricht deshalb keinen 8 MiB-Produktionsbuild. RMTX bleibt deklarativ; normale Provider-TSX-Dateien werden über den Providervertrag eingebunden.

Der unveränderte offizielle Producer hat den damaligen eingefrorenen A06.5-Stand in einer isolierten lokalen Gitkopie erfasst. Die tatsächlichen Strict-Reports auf Node 24.22.2 und 26.5.0 bestanden jeweils 28 Checks ohne Fehler oder Skips; 53 bereits vorhandene Inventarwarnungen blieben erhalten. Der Capture bindet 5189 Mitglieder und den isolierten Quellenstand `1653ce81e263935b926caf5a6c6621b0e598cc03`. Der lokale Abschlussseal liegt außerhalb seines eigenen Archivs unter `.xtend-test-results/rmtx-a065-governance/`. Inventar, Authority-Decision und Projection-Policy wurden gegen den Ausgangscommit geprüft; vorherige Autoritäten, Release-Locks, historische Reviews, Tombstones und die geschlossenen Quellprofilfamilien blieben erhalten. Die spätere Dokumentationsfortschreibung erweitert diesen historischen Quellenbeleg nicht.

Die lokale Installation von VSIX 0.3.0 wurde anhand der registrierten Version und der tatsächlichen installierten Dateien bestätigt. Der echte isolierte Extension-Host-Lauf ist ein eigener Nachweis; die Aktivierung der aktualisierten Erweiterung im bereits laufenden Benutzerfenster ist durch die Installation nicht bewiesen.

[A06.6](../release-acceptance/implementation.md) bleibt offen. Beide Features behalten `preparing`; vollständige Katalog-, SSR-/Adoptions-, Restore- und Replayabnahmen sowie die gemeinsame 0.9-Releasefreigabe werden durch A06.5 nicht ersetzt. Für A06.5 selbst fehlen weiterhin das vom Releasegate verlangte registrierte Testprofil und die standardisierte, zum finalen Freigabestand passende ExecutionEvidence. Das ist ausstehende formale Releasebindung einer vorhandenen Implementierung.
