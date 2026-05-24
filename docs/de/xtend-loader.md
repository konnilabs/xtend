# XTend Loader

Der lokale ES-Modul-Loader für manifestbasierte Web Components.

## Worum es geht

Die Core-Schicht hält Hosts bewusst einfach: ein Loader, ein Manifest, öffentliche TypeScript-Oberflächen und lokale Module statt CDN-Abhängigkeiten.

## Öffentliche Bausteine

- `xtend-loader.js` als kanonischer Loader.
- `window.__XTendLoaderBootPromise` für Bootstrapping.
- `window.XTendLoader.ensureComponent(tag)` für spätes Laden.

## Empfohlener Ablauf

Lies den Überblick, kopiere das kleinste passende Beispiel und erweitere erst danach um Host-spezifische Details.

## Nächste Schritte

- [Manifest](./manifest.md)
- [API](./api.md)
- [Design Tokens](./design-tokens.md)
