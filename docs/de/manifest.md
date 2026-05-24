# Manifest

Das Komponentenmanifest beschreibt, welche XTend Module ein Host laden darf.

## Worum es geht

Die Core-Schicht hält Hosts bewusst einfach: ein Loader, ein Manifest, öffentliche TypeScript-Oberflächen und lokale Module statt CDN-Abhängigkeiten.

## Öffentliche Bausteine

- `components/manifest.json` als lokale Registry.
- `data-manifest` am Loader.
- `meta name="xtend-preload"` für kritische Komponenten.

## Empfohlener Ablauf

Lies den Überblick, kopiere das kleinste passende Beispiel und erweitere erst danach um Host-spezifische Details.

## Nächste Schritte

- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
