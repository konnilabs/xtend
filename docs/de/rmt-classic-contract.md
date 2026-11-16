# RMT-Classic-Compilervertrag

**RMT Classic** ist der neue Name der bisherigen RMT-vNext-Autorensprache. RMTX verwendet eine deklarative TSX-Grammatik mit `.rmtx` und qualifizierten `RMT.<Operator>`-Elementen. Das erste geschlossene [Frontendprofil A06.2](../../development/rmtx-a06/frontend/README.md) nutzt dasselbe geprüfte Compiler-Backend; weitere Operatoren, native UI und semantisches Tooling folgen separat.

## Öffentliche API

```js
const { parseRmtClassicSource } = require('@ccslabs/xtend/rmt-language/classic-parser');
const { compileRmtClassicAst } = require('@ccslabs/xtend/rmt-language/classic-compiler');
const parsed = parseRmtClassicSource({ text: 'state count type number initial 0' });
if (!parsed.ok) throw new Error(JSON.stringify(parsed.diagnostics));
const core = compileRmtClassicAst(parsed.ast, { contractVersion: '1.0.0' });
```

Der Compilerexport bietet außerdem `compileRmtClassicSource`, `createRmtClassicCompiler`, `validateRmtClassicAst`, `isRmtClassicAst`, `getRmtClassicAstSchema` und generierte TypeScript-Typen. Das Schema ist auch als `classic-ast.schema.json` exportiert.

Die neue freie Funktion `compileRmtClassicAstResult(ast, options)` liefert das vollständige geprüfte Compilerergebnis einschließlich Diagnosen und abgeleiteter Pläne. Dafür beträgt die Classic-Modul-API inzwischen **4.3.0**, die kompatible vNext-Modul-API **1.4.0**. Die bisherigen Factorymethoden und der Core-only-/Fehlerrückgabevertrag von `compileRmtClassicAst` bleiben erhalten. Nur der neue vollständige AST-Einstieg akzeptiert die geschlossenen RMTX-Quellprofile 1.0.0 und 2.0.0; RMTX-Autorentext wird über `rmt-language/rmtx-compiler` kompiliert.

## Vertrag und Kompatibilität

`xtend.rmt.classic.compiler-contract.v1`, Version **1.0.0**, definiert geschlossene Felder und Kindkontexte für 122 AST-Knotentypen. Struktur, Referenzen, sichere Schreibziele, bekannte Initialtypen und Abhängigkeitszyklen werden vor der Artefakterzeugung geprüft. Anwendungstypen bleiben nominale Hostverträge. Core und Zielpläne sind unabhängig versionierte Ausgaben.

Bestehende `vnext-*`-APIs, AST-/Core-Wire-IDs und Source-Tags bleiben kompatibel. Eine unbekannte angeforderte Vertragsversion wird abgewiesen. Herkunftsdaten sind optional; vorhandene Pointer und Hilfsknoten müssen konsistent sein. Der Compiler verändert die Eingabe nicht.

## Prüfung

`npm run check:rmt-classic-contract` prüft Schema-/Typ-Drift. Die vollständigen [Feld-, Referenz-, Diagnose- und Versionierungsregeln](../../development/rmtx-a01/compiler-contract.md) beschreiben die Backend-Grenze. Der [Releaseplan 0.9](./release-0-9.md) führt RMTX und XTensions 2.0 als verpflichtenden Umfang.

Das [A06.3.1-Selektorprofil](../../development/rmtx-a06/selector-profile/README.md) ergänzt den Operator-/Ausdruckskatalog, boolesche Selectorprädikate und statische Readsets. Parser-/Compiler-Module haben Capability-API **2.0.0**, behalten aber v1 als Default. Das zusätzliche Syntaxprofil **2.0.0** wird ausdrücklich gewählt und liefert eigene v2-Resultate; bisherige v1-Daten bleiben erhalten. Die Readsets verändern keine Runtime-Subscriptions oder Neuberechnung.
