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

Die neue freie Funktion `compileRmtClassicAstResult(ast, options)` liefert das vollständige geprüfte Compilerergebnis einschließlich Diagnosen und abgeleiteter Pläne. Dafür beträgt die Classic-Modul-API inzwischen **4.5.0**, die kompatible vNext-Modul-API **1.6.0**. Die bisherigen Factorymethoden und der Core-only-/Fehlerrückgabevertrag von `compileRmtClassicAst` bleiben erhalten. Nur der neue vollständige AST-Einstieg akzeptiert die geschlossenen RMTX-Quellprofile 1.0.0, 2.0.0, 3.0.0 und 4.0.0; RMTX-Autorentext wird über `rmt-language/rmtx-compiler` kompiliert.

## Vertrag und Kompatibilität

`xtend.rmt.classic.compiler-contract.v1`, Version **1.0.0**, definiert geschlossene Felder und Kindkontexte für 122 AST-Knotentypen. Struktur, Referenzen, sichere Schreibziele, bekannte Initialtypen und Abhängigkeitszyklen werden vor der Artefakterzeugung geprüft. Anwendungstypen bleiben nominale Hostverträge. Core und Zielpläne sind unabhängig versionierte Ausgaben.

Bestehende `vnext-*`-APIs, AST-/Core-Wire-IDs und Source-Tags bleiben kompatibel. Eine unbekannte angeforderte Vertragsversion wird abgewiesen. Herkunftsdaten sind optional; vorhandene Pointer und Hilfsknoten müssen konsistent sein. Der Compiler verändert die Eingabe nicht.

## Prüfung

`npm run check:rmt-classic-contract` prüft Schema-/Typ-Drift. Die vollständigen [Feld-, Referenz-, Diagnose- und Versionierungsregeln](../../development/rmtx-a01/compiler-contract.md) beschreiben die Backend-Grenze. Der [Releaseplan 0.9](./release-0-9.md) führt RMTX und XTensions 2.0 als verpflichtenden Umfang.

Das [A06.3.1-Selektorprofil](../../development/rmtx-a06/selector-profile/README.md) bleibt als explizites Syntaxprofil 2.0.0 erhalten. [A06.3.2](../../development/rmtx-a06/keyed-profile/README.md) ergänzt Syntaxprofil **3.0.0** mit eigenen v3-Resultaten, versioniertem Host-Scope-Vertrag, Repeat/Presence und Eventguards. Das neue [A06.3-Orchestrierungsprofil](../../development/rmtx-a06/orchestration-profile/README.md) ergänzt ausdrücklich Syntax **4.0.0**, 110 Tags, geschlossene Props-Projektionen, gepinnte Inline-Provider und dynamisch geprüfte Actioninputs. Die Modul-Capability-APIs betragen **4.0.0**; v1 bleibt Default und die vollständigen Profile1/2/3 bleiben erhalten. Providerkeys werden weiterhin vom bestehenden Bindingvertrag typisiert materialisiert. Readsets verändern keine Runtime-Recomputation; allgemeine native DOM-Loops und ausführbare Lifecyclebedingungen folgen A06.4. Source4 nutzt eigene Orchestration-/Binding-/Maracaprofile und verweigert bis zur separaten Abnahme SSR/Adoption.
