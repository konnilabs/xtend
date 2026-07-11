# XTendRMT Überblick

Das mentale Modell für deklarative App Shells, State, Actions und Surfaces.

## Worum es geht

XTendRMT ist die deklarative Anwendungsschicht von XTend. Eine Source beschreibt Daten, Nutzerabsicht, Ressourcen, sichtbare Surfaces und Scheduling; Compiler und Runtime setzen diese Records um, ohne UI-Frameworks in den Kernel zu ziehen.

## Öffentliche Bausteine

- `tools/rmt-language/vnext-parser.js` erzeugt das Source-Modell.
- `tools/rmt-language/vnext-compiler.js` erstellt hostneutrale Core-Records.
- `xtendrmt/rmt-app-runtime.js` verbindet Core-Daten mit expliziten Host-Adaptern.

## Empfohlener Ablauf

Lerne zuerst Template, State, Action und Surface. Prüfe eine kleine Source im Playground, lies danach das Core-Ergebnis und binde erst dann Browser-, SSR- oder Komponentenadapter an.

## Nächste Schritte

- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
