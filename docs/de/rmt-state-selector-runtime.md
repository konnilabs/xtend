# RMT State Selector Runtime

Typed State, Selectoren und Reducer als Runtime-Basis.

## Worum es geht

Die State Selector Runtime hält kanonischen RMT State und abgeleitete View-Modelle getrennt. Selectors lesen bekannte Pfade; Reducer ändern State über Actions, während Renderer ausschließlich das Ergebnis konsumieren.

## Öffentliche Bausteine

- `xtendrmt/rmt-state-selector-runtime.js` implementiert State, Selector und Reducer.
- `xtendrmt/rmt-state-selector-runtime.d.ts` beschreibt die öffentliche Runtime-Oberfläche.
- `tests/fixtures/rmt-state-selector-runtime.rmt` deckt Compile- und Host-Integration ab.

```txt
runtime contract: xtend.epic18.rmt-state-selector-runtime.v1
xstateBridge: injected-host-adapter
preservePatchPlan: selection updates keep the existing DOM patch plan
next workpackage: WP-E18-08
```

## Empfohlener Ablauf

Definiere State und Selector in der Source, kompiliere Referenzen und injiziere erst dann den Host-State-Adapter. Ein Selector darf keine DOM-Arbeit oder Seiteneffekte auslösen; fehlende Pfade erzeugen Diagnostics.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
