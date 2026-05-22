# XTendRMT Developer Overview

- Contract: `xtend.docs.xtendrmt-overview.v1`
- Produktversion: `XTendRMT 0.2.0`

XTendRMT ist die deklarative App-Schicht von XTend. Entwickler schreiben eine
lesbare `.rmt` Quelle; der Compiler erzeugt daraus Core Records, Kernel-
Artefakte, Source Maps und Adapter-Uebergaben. XTend UI bleibt das
Web-Component-System, XTendRMT beschreibt App-Struktur und Lifecycle.

## Produktgrenze

| Ebene | Verantwortung |
| --- | --- |
| RMT vNext | App Shell, Surfaces, State, Selectors, Actions, Events, Resources, Lanes |
| RMT Kernel | Normalisierung, Scheduling, Diagnostics, Source Maps, Kernel Records |
| Host Adapter | XTend Components, XRouter, DOM, Browser APIs, Framework-Bridges |
| XTend UI | Web Components, Styling, A11y, Interaktion, sichtbare UI |
| Fabric | Lanes, Fibers, Telemetry, Backpressure und Runtime-Diagnostics |

Der Kernel bleibt framework-agnostisch. Er importiert keine XTend Components,
kein XRouter-Modul, keine Browser-APIs und keine Host-Runtime. Alles, was DOM,
Routing, Component-Importe oder Browser-Zustaende braucht, gehoert in Adapter.

## Warum RMT vNext?

RMT vNext ist die bevorzugte Syntax fuer neue Apps:

- Eine App Shell entsteht aus einer Quelle statt aus verstreutem HTML,
  Legacy-JSON und Host-Code.
- UI-Objekte bleiben ueber Primitive IDs, Source Maps, Kernel Records, Fabric
  Fibers und DOM-Marker korrelierbar.
- State, Selectors, Actions, DataSources, Events, Portals, Overlays,
  Resources und Surfaces sind erstklassige Authoring-Primitive.
- Editor-DX kommt direkt aus dem Language Server: Completion, Hover, Document
  Symbols, Definition und Code Actions.
- Legacy- und App-Platform-JSON bleiben kompatible Targets, aber nicht der
  normale Authoring-Pfad.

## Kleines mentales Modell

```text
app.rmt
  -> vNext parser
  -> semantic primitive graph
  -> core document + kernel records
  -> host adapter
  -> XTend Components / XRouter / Fabric
  -> sichtbare App im Browser
```

Ein Surface beschreibt einen sichtbaren Bereich. Eine Lane beschreibt, wann
und mit welcher Prioritaet Arbeit ausgefuehrt wird. Actions und Events
beschreiben Interaktion. Resources beschreiben Besitz und Cleanup. Adapter
setzen diese Beschreibung in echte Komponenten und Browser-Arbeit um.

## Kernartefakte

- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `xtendrmt/rmt.schema.json`
- `xtendrmt/rmt-manifest.json`

## Wichtige APIs und Adapter

- Runtime Registry fuer Route- und Component-Indizes
- XRouter Adapter `createRmtXRouterAdapter`
- XTend Component Adapter `createRmtXtendComponentAdapter`
- State-/Scheduler-/Diagnostics Bridge `createRmtStateSchedulerDiagnosticsBridge`
- RMT Language Server fuer Editor-Integrationen
- Compiler-Ausgaben fuer Core, App-Platform und Kernel Records

## Offizielle Entwicklerdokumente

| Thema | Dokument |
| --- | --- |
| Erste App | [Quick Start Guide](./quick-start-guide.md) |
| vNext App Authoring | [RMT vNext Authoring Guide](./rmt-vnext-authoring.md) |
| Native Authoring | [XTendRMT Native Authoring Guide](./xtendrmt-native-authoring.md) |
| App-DSL Referenz | [XTendRMT App-DSL Reference](./xtendrmt-app-dsl.md) |
| Runtime Bridge und Adapter | [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md) |
| Migration aus alten Metadatenpfaden | [XTendRMT Native Migration Guide](./xtendrmt-migration-guide.md) |
| Editor Setup | [RMT Language Server und Editor Setup](./rmt-language-server.md) |
| Historie | [XTend Changelog](./changelog.md) |

## Lokaler Check fuer RMT-Arbeit

```bash
xt rmt lint app.rmt
node tools/rmt-language-server/server.js
node scripts/run_xtend_tests.js rmt-vnext-parser rmt-vnext-compiler rmt-vnext-tooling --json
```

Fuer Runtime- und Adapter-Paritaet bleiben zwei repo-lokale Gates wichtig:

- `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html` prueft, dass RMT,
  XRouter, XTend Components und Vanilla-Host zusammen sichtbar rendern.
- `node scripts/verify_xtendrmt_artifact_parity.js --json` prueft, dass
  Schema, Manifest, Typen, ESM-Bundles und Browser-Bundle zusammenpassen.

Neue RMT-nahe Arbeit soll zuerst klaeren, ob sie Kernel-, Syntax-, Adapter-,
Host- oder Dokumentationsverantwortung ist. XTend-spezifisches Verhalten wird
ueber Adapter modelliert, nicht als Kernel-Sonderfall.
