# RMT-Classic-Compilervertrag

**RMT Classic** ist der neue Name der bisherigen deklarativen RMT-vNext-Autorensprache. RMTX ist ein eigenständiges Template-Frontend. Der gemeinsame Backend-Eingang ist ein geprüfter deklarativer Classic-AST; Core und Ausführungspläne bleiben abgeleitete Ausgaben. Damit wird keine RMTX-Tag- oder Ausdruckssyntax festgelegt.

## Öffentliche Einstiege

```js
const {
  compileRmtClassicSource, compileRmtClassicAst, createRmtClassicCompiler,
  validateRmtClassicAst, isRmtClassicAst, getRmtClassicAstSchema,
  RMT_CLASSIC_COMPILER_CONTRACT
} = require('@ccslabs/xtend/rmt-language/classic-compiler');
const { parseRmtClassicSource } = require('@ccslabs/xtend/rmt-language/classic-parser');

const input = { text: 'state count type number initial 0', filePath: 'app.rmt' };
const result = compileRmtClassicSource(input, { contractVersion: '1.0.0' });
const parsed = parseRmtClassicSource(input);
const core = compileRmtClassicAst(parsed.ast, { sourceModel: parsed.sourceModel });
```

`getRmtClassicAstSchema()` liefert eine unabhängige Schemakopie. Dasselbe JSON-Schema ist unter `@ccslabs/xtend/rmt-language/classic-ast.schema.json` exportiert. Generierte TypeScript-Typen umfassen `RmtClassicAst` und die einzelnen Knotenvarianten. `isRmtClassicAst(candidate)` grenzt JSON-Eingaben typisiert ein; `validateRmtClassicAst(candidate)` liefert Struktur-/Kontextdiagnosen. Die Kompilierung prüft zusätzlich Referenzen und ausführbare Semantik.

## Versionen und Kompatibilität

Der Compilervertrag heißt `xtend.rmt.classic.compiler-contract.v1`, Version `1.0.0`. Eine ausdrücklich angeforderte unbekannte `contractVersion` wird mit `rmt.classic.contract.unsupported` abgelehnt. Unbekannte AST-Versionen werden vor dem Lowering diagnostiziert. Der AST-Wire-Discriminator bleibt `xtend.rmt.vnext.ast.v1`, sein Wurzelknoten `RmtVNextDocument`. Die vorhandenen Exporte `vnext-parser`/`vnext-compiler` verwenden dieselbe geprüfte Backend-Pipeline.

Core behält `xtend.rmt.core-format.vnext.v1` und `version: 2.0-vnext`; Source-Syntax-Tags, App-Platform-/Kernel- und Orchestrierungs-IDs bleiben kompatibel. Paketversion 0.9 ist eine eigene Ebene. Geänderte gültige Bedeutungen oder Pflichtfeldformen benötigen eine neue öffentliche AST-Schema-Majorversion und einen ausdrücklichen Adapter. Unbekannte Felder sind keine implizite Vorwärtskompatibilität. Abgeleitete Artefakte nach Compileränderungen neu bauen.

## Feld- und Kontextregeln

Das Schema erfasst alle 122 bestehenden AST-Knotentypen. Knotenfelder sind geschlossen; semantische Pflichtfelder, nullable Alternativen, Kindkontexte und Ausdrucksvarianten sind ausdrücklich festgelegt. Optionale Herkunftshilfen (`range`, `astPointer`, Identifier-Hilfsknoten und Lexer-Tokens) werden von ausführbaren Feldern unterschieden. Eine Block-`body` enthält nur die dort erlaubten Knotenfamilien. Ein Selector kann keine State-Deklaration oder unbekannte Clause in seinem Body verstecken.

Primitive Werte unterscheiden Literal-, Pfad-, Array- und Objektvarianten. Conditions und Selector-Ausdrücke haben geschlossene Operatoren; Selector-Aufrufe erlauben nur `contains` mit zwei Argumenten. Validation-Regeln verlangen boolesche Flags, nichtnegative ganzzahlige Längengrenzen oder String-Patterns/-Meldungen. Hydration-, Resumability- und Isolation-Clauses wählen genau eine Alternative. Singuläre Deklarationen können nicht durch Wiederholung still überschrieben werden; mehrere Where-Clauses, Action-Reducer und Keyframes bleiben erlaubt.

Identifier und ihre Hilfsknoten müssen übereinstimmen. Vorhandene AST-Pointer müssen zur kanonischen Baumposition passen, Ranges müssen geordnet sein, Convenience-Indizes mit `body` übereinstimmen. Initial-Blöcke und Objektwerte weisen doppelte/unsichere Schlüssel ab. Funktionen, Accessors, versteckte Felder, nicht endliche Werte und Zyklen sind keine AST-Daten. Die Eingabe wird nicht verändert.

## Symbole, Typen und Abhängigkeiten

Source-Symbole bleiben case-sensitiv, dokumentweit und nach Domain qualifiziert. Template-/Surface-Metadaten bilden keinen neuen lexikalischen Scope. Referenzen lösen zuerst das längste deklarierte Symbolpräfix und danach den Feldpfad auf. Der bestehende Importresolver ist für Modulgraphen zuständig; ein einzelner Compileraufruf lädt keine Imports oder externen Schemas.

Model-Selektoren benötigen bekannte State-/Selektorquellen. Reducer und Recipes schreiben sichere `state.<symbol>[.<feld>]`-Ziele. Reducerwerte sind skalare Literale oder ausdrückliche State-, Selector-, Input-, Result-, Error- oder Payload-Pfade. Action-Inputs müssen deklariert sein. Statusziele und Validation-Includes müssen auflösbar sein. `status app.status` und `status state.app.status` sind gleichwertige Verweise auf deklarierten State. Mehrere `destroy releases resource`-Clauses ergeben gemeinsam die Cleanup-Ressourcen der Surface; keine wird still verworfen. State-Initialblöcke benötigen kein zusätzliches `preserve` als Trenner. Selektor-/Validation-Zyklen sind Fehler; Selektorpläne werden vor der Model-Auswertung stabil nach Quell- und Prädikatabhängigkeiten geordnet.

Bekannte eingebaute State-Initialtypen und statisch bekannte Root-Zuweisungen werden geprüft. Anwendungstypnamen wie `MediaRecord` bleiben nominale Verträge der Anwendung/des Hosts. Der Compiler leitet keine Objektfeldschemata aus Initialwerten ab. Result-/Error-/Payload-Felder und externe Servicefähigkeiten bleiben ihren ausdrücklichen Hostverträgen zugeordnet. Bestehende beratende Diagnosen für hostbezogene Deklarationen behalten ihre Severity.

## Diagnosen und Ausgabeprofile

Strukturfehler liefern `phase: ast`, semantische Fehler `phase: semantic`. Der Source-Einstieg liefert `ok` und Diagnosen. Der AST-Einstieg liefert bei Erfolg Core und wirft bei Ablehnung einen `RmtAstCompilationError` mit demselben Diagnosebestand. Struktur-/Semantikfehler erzeugen keine Core- oder Orchestrierungsartefakte.

Core-Identitäten, Diagnoseaggregation, LSP-Herkunft und portable Node-/PHP-Fähigkeiten folgen den implementierten [A01-Verträgen](README.md). Ein Renderoperator ist nicht automatisch ein Model-Operator. Das Vertragsmanifest nennt die unabhängig versionierten Ausgabeprofile; dieses AST-Schema validiert kein beliebiges handgeschriebenes Core-/Plan-JSON.

`npm run check:rmt-classic-contract` prüft Schema-/Typ-Drift. Die Feldregeln stehen kuratiert in `tools/rmt-language/classic-ast-rules.js`; Fixture-Häufigkeiten bestimmen keine Pflichtfelder.
