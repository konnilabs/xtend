# RMT vNext Authoring Guide

- Contract: `xtend.rmt.vnext-release-handoff.v1`
- Syntax Contract: `xtend.rmt.vnext.grammar.v1`
- Core Output: `xtend.rmt.core-format.vnext.v1`
- Reference Demo: `xtendrmt/rmt-vnext-reference-demo.rmt`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-release --json`

RMT vNext ist die neue deklarative Authoring-Syntax fuer XTendRMT. Sie bleibt JSON-nah im Ergebnis, ist aber als menschenfreundliche DSL geschrieben und kompiliert deterministisch in das vNext Core Format.

## Grundform

```rmt
template xtend.vnext.reference {
  surface root {
    lane critical weight 10 {
      hydrate app-shell
      hydrate hero-panel when route.visible == true
    }
  }
}
```

Die wichtigsten Bausteine:

| Syntax | Zweck |
| --- | --- |
| `template` | gruppiert eine orchestrierte App- oder Dokument-Shell |
| `surface` | beschreibt Zielbereiche wie `root`, Dialoge, Overlays oder Panels |
| `lane` | steuert Prioritaet, Scheduling und Backpressure |
| `mount`, `hydrate`, `prewarm`, `dispose` | Lifecycle-Operationen |
| `when` | deklarative Conditions ohne Funktionsaufrufe oder Eval |
| `slot` | Composition innerhalb einer Operation |
| `on ... -> action ...` | Event zu Action-Referenz |
| `from endpoint/sse/worker` | Data-Source-Referenz |
| `trust boundary` und `sanitize` | Security-Policy fuer unsichere Daten |
| `stream` | inkrementelle Streaming-Operation |

## Reference Demo

Die vollstaendige Referenz liegt in `xtendrmt/rmt-vnext-reference-demo.rmt`. Sie deckt Templates, Surfaces, gewichtete Lanes, Conditions, Slots, Events, Endpoint/SSE/Worker Sources, Security Policies und Streaming ab.

Der stabile Compiler-Output liegt in `xtendrmt/rmt-vnext-reference-demo.core.json`. Eine absichtliche Aenderung am Compiler oder an der Syntax muss beide Dateien und die Release-Gates bewusst aktualisieren.

## Lokal pruefen

```bash
node scripts/run_xtend_tests.js rmt-vnext-release --json
node scripts/run_xtend_tests.js rmt-vnext-parser rmt-vnext-compiler rmt-vnext-regression --json
```

Der Release-Gate prueft Docs, Reference Demo, Core-Output, Release-Matrix, Handoff und Referenzpfade. Fuer schnelle Authoring-Checks reichen Parser, Compiler und Regression-Gate.

## Grenzen

- RMT vNext fuehrt keine Host-Runtime im Kernel aus.
- Conditions sind deklarativ und erlauben keine Funktionsaufrufe.
- Imports sind statisch und bleiben package-root-gebunden.
- Legacy JSON bleibt lesbar, Migration bleibt opt-in.
- Produktive Runtime-Adapter fuer vNext Core sind Folgearbeit, nicht Teil dieses Syntax-Epics.
