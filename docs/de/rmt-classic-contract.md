# RMT-Classic-Compilervertrag

**RMT Classic** ist der neue Name der bisherigen RMT-vNext-Autorensprache. RMTX wird ein eigenes Template-Frontend für dasselbe geprüfte Compiler-Backend. Seine konkrete Syntax bleibt offen.

## Öffentliche API

```js
const { parseRmtClassicSource } = require('@ccslabs/xtend/rmt-language/classic-parser');
const { compileRmtClassicAst } = require('@ccslabs/xtend/rmt-language/classic-compiler');
const parsed = parseRmtClassicSource({ text: 'state count type number initial 0' });
if (!parsed.ok) throw new Error(JSON.stringify(parsed.diagnostics));
const core = compileRmtClassicAst(parsed.ast, { contractVersion: '1.0.0' });
```

Der Compilerexport bietet außerdem `compileRmtClassicSource`, `createRmtClassicCompiler`, `validateRmtClassicAst`, `isRmtClassicAst`, `getRmtClassicAstSchema` und generierte TypeScript-Typen. Das Schema ist auch als `classic-ast.schema.json` exportiert.

## Vertrag und Kompatibilität

`xtend.rmt.classic.compiler-contract.v1`, Version **1.0.0**, definiert geschlossene Felder und Kindkontexte für 122 AST-Knotentypen. Struktur, Referenzen, sichere Schreibziele, bekannte Initialtypen und Abhängigkeitszyklen werden vor der Artefakterzeugung geprüft. Anwendungstypen bleiben nominale Hostverträge. Core und Zielpläne sind unabhängig versionierte Ausgaben.

Bestehende `vnext-*`-APIs, AST-/Core-Wire-IDs und Source-Tags bleiben kompatibel. Eine unbekannte angeforderte Vertragsversion wird abgewiesen. Herkunftsdaten sind optional; vorhandene Pointer und Hilfsknoten müssen konsistent sein. Der Compiler verändert die Eingabe nicht.

## Prüfung

`npm run check:rmt-classic-contract` prüft Schema-/Typ-Drift. Die vollständigen [Feld-, Referenz-, Diagnose- und Versionierungsregeln](../../development/rmtx-a01/compiler-contract.md) beschreiben die Backend-Grenze. Der [Releaseplan 0.9](./release-0-9.md) führt RMTX und XTensions 2.0 als verpflichtenden Umfang.
