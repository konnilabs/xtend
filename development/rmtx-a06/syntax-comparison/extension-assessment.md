# Dateiendung für RMTX: experimenteller Vergleich

Stand: **15. November 2026**. Dieser Teil des Two-Host-Versuchs prüft Dateierkennung, Importgrenzen und Typprüfung mit **TypeScript 5.9.3**. Die Entscheidung über die Sourceform bleibt von der Dateiendung getrennt. Das Experiment implementiert weder einen produktiven RMTX-Compiler noch eine Editor-Erweiterung.

**Empfehlung für ein eigenständiges deklaratives RMTX-Profil: `.rmtx` als öffentliche Sourceendung, TSX-kompatible Grammatik.** Klassische Orchestrierung bleibt `.rmt`; ausführbare TSX-Views und Framework-Provider bleiben `.tsx`. Das macht die unterschiedliche Bedeutung der Dateien sichtbar, verlangt aber eine echte Compiler-/Editorintegration. Die Empfehlung ist eine Architekturabwägung, kein Ergebnis eines gemessenen DX-/AX-Benchmarks.

Wenn kurzfristig unveränderte TypeScript-Werkzeuge Voraussetzung sind, ist **`.rmtx.tsx`** eine erprobte Übergangsoption. Eine reine `.tsx`-Endung ist technisch ebenfalls möglich, benötigt dann aber eine andere eindeutige Profilzuordnung. Keine der drei Schreibweisen validiert allein die deklarative Semantik.

## Beobachtungen am Compiler

Die [21 ausführbaren Probes](extension-probes.cjs) binden ihre tatsächlichen Resultate und Quellen im [Nachweis](extension-evidence.json). Die gleichen gültigen Fixture-Bytes werden unter mehreren Namen geprüft; außerdem wird der bestehende [Two-Host-Candidate](../two-host.candidate.tsx) jeweils ausdrücklich als TSX geparst.

| Prüfung mit TypeScript 5.9.3 | `.tsx` | `.rmtx` | `.rmtx.tsx` |
| --- | --- | --- | --- |
| `createSourceFile(..., ScriptKind.TSX)` | Erfolgreich | Erfolgreich | Erfolgreich |
| Identische TSX-Fixture, gleiche AST-Kindfolge | Ja | Ja | Ja |
| Gewöhnlicher `createProgram`-Root mit `jsx: preserve` | Typprüfung erfolgreich | **TS6054**, nicht unterstützte Sourceendung | Typprüfung erfolgreich |
| `.rmtx`-Root zusätzlich mit `allowArbitraryExtensions: true` | — | Weiterhin **TS6054** | — |
| Automatische ScriptKind-Erkennung | TSX | TS, JSX-Fixture mit Parsefehlern | TSX |
| Standardmäßige Projekt-Discovery | Standardendung | Beide erprobten Include-Globs finden keinen Sourceinput | Standardendung |

Die Globs `**/*` und `**/*.rmtx` werden für einen Ordner geprüft, der ausschließlich die `.rmtx`-Fixture enthält: beide liefern eine leere Rootliste und **TS18003**. Ein expliziter Import eines Customformats ersetzt diese Root-Discovery nicht.

TypeScript unterstützt JSX-Typprüfung und verschiedene JSX-Emitmodi. Ein besonderer Parsername oder die Wahl `jsx: preserve` erzeugt noch keine RMT-Operatoren. Im Experiment ist auch ein gewöhnlicher, typkorrekter Funktionsaufruf im JSX-Attribut gültiges TSX; es wird ausdrücklich kein Funktionswert ausgeführt und keine deklarative RMT-Zulässigkeit behauptet. [TypeScript JSX](https://www.typescriptlang.org/docs/handbook/jsx.html).

### `allowArbitraryExtensions` ist keine Sprachregistrierung

Ohne Declaration schlägt `import view from "./view.rmtx"` mit **TS2307** fehl, sowohl mit als auch ohne `allowArbitraryExtensions`. Mit einer passenden `view.d.rmtx.ts` meldet der Compiler ohne Option **TS6263**; mit aktivierter Option ist der Consumer typkorrekt.

Dabei enthält die eigentliche `view.rmtx` absichtlich ungültige Bytes. Sie wird nicht als SourceFile geladen. Ein unbekanntes Consumerfeld erzeugt zwar **TS2339**, aber die `.rmtx`-Source bleibt ungeprüft. Generierte Declarations eignen sich somit für die Importgrenze nach einer echten RMTX-Compilation, nicht als Ersatz dafür. Dieses Verhalten entspricht der dokumentierten Suche nach `{basename}.d.{extension}.ts`. [TypeScript `allowArbitraryExtensions`](https://www.typescriptlang.org/tsconfig/allowArbitraryExtensions.html).

### Eine eigene Endung kann echte TypeScript-Prüfung erhalten

Der Probe-CompilerHost zeigt die `.rmtx`-Bytes einem gewöhnlichen TypeScript-Program als virtuelle `view.rmtx.tsx`. Er erzeugt keine Datei und führt die Source nicht aus. Das gültige Programm besteht die Typprüfung. Ein bewusst falsches `model.product.missing` erzeugt **TS2339**. Die Diagnose verweist zunächst auf die virtuelle Datei; die Probe ordnet sie der Originaldatei zu und prüft, dass Start, Länge und der Text `missing` unverändert passen.

Damit ist nur die **Identitätsabbildung für unveränderte Quellbytes** belegt. Ein künftiger Compiler mit synthetischen Imports, aufgelösten Callbackscopes oder erzeugten Hilfstypen benötigt vollständige Mappingdaten und Projektzustand. Die Probe implementiert keine allgemeine Source-Map, Completion, Rename oder Go-to-definition. Die Compiler-API erlaubt Programme und angepasste Hosts; deren Integration bleibt XTend-Arbeit. [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API).

## Konsequenzen für die beiden Two-Host-Architekturen

| Frage | Deklaratives TSX-Orchestrierungsmodul | RMT Classic plus TSX-View |
| --- | --- | --- |
| Sprachgrenze | Die Datei definiert Model-/Action-/Surface-/Host-Semantik; zugelassenes TSX wird statisch abgesenkt. | `.rmt` definiert die Orchestrierung; die View verwendet eine gesondert begrenzte TSX-Schnittstelle. |
| Verständlicher Dateiname | `product-details.rmtx` zeigt das native Authoringprofil. | `product-details.rmt` und `product-details.view.tsx` zeigen die Aufteilung. |
| Standard-TypeScript allein ausreichend? | Nein: importierte Intrinsics, Symbolidentität, Expressiongrenzen und Backendsemantik erfordern den RMTX-Compiler. | Nein: Typen sind nützlich, die View muss zusätzlich an Classic-Symbole und den nativen Render-/Bindingvertrag gebunden sein. |
| Risiko bei bloßem Standard-Emit | JSX wird als JavaScript behandelt; Pfadidentität und statische Orchestrierung sind nicht automatisch erhalten. | Ebenfalls abhängig vom Viewvertrag; „TSX-View“ sagt für sich noch nicht, ob Source statisch abgesenkt oder als vertrauenswürdiges Modul ausgeführt wird. |
| Provider-TSX | Bleibt getrenntes ausführbares Provider-Modul über die bestehenden Schnittstellen. | Gleiches Provider-Modul und gleicher Schnittstellenvertrag. |

Eine `.view.tsx`-Datei wird durch ihren Namen nicht automatisch eine React-Komponente. Ein statischer Viewcompiler ist ebenso möglich wie ein ausdrücklich gewählter ausführbarer Viewadapter. Die Architekturentscheidung muss diese Semantik benennen; ein Suffix allein löst sie nicht.

## Tooling, DX und AX

**`.tsx`** erhält die erprobte normale Parser-/Projektintegration. Providerdateien und native deklarative Dateien teilen dann dieselbe Standardendung. Der Build muss das Profil über einen expliziten Entry-/Projektvertrag bestimmen, und der Editor muss RMTX-Diagnosen zusätzlich anbieten. Eine Importkonvention wie ein bestimmter `RMT`-Bezeichner ist allein keine vertrauenswürdige Profil- oder Symbolerkennung. Für Agenten helfen Beispiele und harte Compilerdiagnosen; volle TypeScript-Gültigkeit bedeutet weiterhin nicht RMTX-Gültigkeit.

**`.rmtx`** kennzeichnet die eigene Authoringsprache, verhindert aber weder falsche API-Nutzung noch unerwünschte Sourceeffekte durch den Namen. XTend müsste File-Discovery, Caching, Build-/MCP-Entrypoints und LSP für diese Endung registrieren. Die echte Source muss zusätzlich zur Typprüfung die statische RMTX-Zulässigkeitsprüfung durchlaufen. Der gezeigte virtuelle TSX-Weg erlaubt dabei Wiederverwendung der TS-Grammatik und des Typcheckers.

**`.rmtx.tsx`** bleibt für TypeScript eine normale `.tsx`-Datei und kann durch einen projektspezifischen Glob ausgewählt werden. Sie signalisiert die Domäne, ohne zunächst Custom-Extension-Rootsupport zu benötigen. Der Preis sind doppelte Endung, eine weitere Konvention und dieselbe Pflicht zum besonderen Compilerpfad. Als dauerhaftes zusätzliches Sprachprofil neben `.rmtx` und `.tsx` würde sie unnötige Auswahl schaffen. Für den Spike oder eine bewusst zeitlich begrenzte Migration ist sie nützlich.

VS Code kann Customendungen per `files.associations` einer Sprach-ID zuordnen; `typescriptreact` bezeichnet TypeScript mit JSX. Das konfiguriert den Sprachmodus, registriert aber keine neue `tsc`-Rootendung und implementiert keine RMTX-Semantik. Im Versuch wurde keine reale Editor-Session für diese Endungen automatisiert. [VS Code Sprachkennungen](https://code.visualstudio.com/docs/languages/identifiers), [Dateizuordnung](https://code.visualstudio.com/docs/languages/overview#_add-a-file-extension-to-a-language).

Eine Language-Service-Erweiterung allein genügt ebenfalls nicht für CI: TypeScript dokumentiert seine Plugins als Editorfunktion; sie werden im normalen `tsc`-Lauf nicht geladen. Native RMTX-Validierung muss deshalb in einem eigenen, auch im Build aufgerufenen Prüfer liegen. [TypeScript Language-Service-Plugins](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin).

Für `.rmtx` sollte eine LSP-Integration TypeScript-Services mit dem Projektzustand und den RMT-Diagnosen verbinden und die Ergebnisse auf die Original-URI abbilden. Die VS-Code-Dokumentation beschreibt virtuelle Inhalte und eingebettete Sprachservices sowie den zusätzlichen Aufwand für Rename und Formatierung. Ein Produktionsnachweis dafür ist noch offen; die Identitätsmapping-Probe begründet nur die Machbarkeit des kleinen Anfangsschritts. [VS Code eingebettete Sprachen](https://code.visualstudio.com/api/language-extensions/embedded-languages).

## Entscheidungsregel und verbleibende Abnahme

Für ein eigenständiges **statisches, deklaratives RMTX-Frontend** ist `.rmtx` die hier bevorzugte öffentliche Endung. Für einen möglichst unveränderten **TypeScript-Modulworkflow** kann `.tsx` sinnvoller sein, sofern das deklarative Profil klar und zwingend am Buildentry festgelegt ist. Der Versuchsaufbau entscheidet deshalb zuerst die Semantik; der nachgewiesene `.rmtx`-Toolingaufwand ist in die DX-Bewertung einzubeziehen.

Vor einer verbindlichen Plattformfestlegung fehlen insbesondere: ein echter Editorlauf mit Typen/Rename/Diagnoseranges, Export-/Importgraphen mit mehreren Dateien und kollidierenden Provider-TSX-Modulen, Watch-/Cacheinvalidierung nach Umbenennung sowie identische Fehlerfälle im MCP und im CLI. DX-/AX-Aufgaben mit gleichen Ausgangsbedingungen wurden hier nicht gemessen. Die eigene Endung ist somit eine begründete Empfehlung, keine vorweggenommene Release-Abnahme.

## Reproduktion

Mit installiertem Projekt-TypeScript und der unterstützten Node-Lane:

```sh
node development/rmtx-a06/syntax-comparison/extension-probes.cjs --check
```

`--write` ersetzt den beobachteten Nachweis bewusst; ohne Flag läuft die Probe ohne Repoänderung. Der eingecheckte Nachweis bindet Node **24.18.0** und TypeScript **5.9.3**. Unter einer anderen Node-Lane ist der Aufruf ohne `--check` zu verwenden, damit der eingebettete Umgebungsstand nicht als Source-Drift interpretiert wird. Bei externer Toolchain kann `NODE_PATH` auf deren `node_modules` zeigen. Tempdateien werden nach dem Lauf entfernt. Kein Import und kein JSX-Attribut der untersuchten Quellen wird ausgeführt.
