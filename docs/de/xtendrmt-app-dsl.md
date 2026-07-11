# XTendRMT App DSL

Referenz für State, Selectors, Actions, Events, Resources und Surfaces.

## Worum es geht

Die App DSL verbindet State, Selectors, Actions, Events, Resources und Surfaces in einem referenzierbaren Dokumentmodell. Jeder Record besitzt einen klaren Owner und darf nur in den vom Parser erlaubten Kontexten stehen.

## Öffentliche Bausteine

- `tools/rmt-language/vnext-parser.js` definiert die syntaktischen Kontexte.
- `tools/rmt-language/vnext-compiler.js` löst Referenzen und erzeugt Core-Records.
- `docs/de/rmt-reference.md` listet Operatoren, Parameter und Diagnostics.

## Empfohlener Ablauf

Modelliere zuerst Daten und eine sichtbare Surface. Ergänze Nutzeraktionen und Ressourcen mit expliziten Referenzen; verwende Host-Adapter nur für Netzwerk, Storage oder andere Plattformdienste.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
