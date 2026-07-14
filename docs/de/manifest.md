# Manifest

Das Komponentenmanifest beschreibt, welche XTend Module ein Host laden darf.

## Worum es geht

Das Komponentenmanifest ist eine statische Zuordnung von Custom-Element-Namen zu lokalen ES-Modulen. Der Loader akzeptiert nur gültige Custom-Element-Tags und `.js`- oder `.mjs`-Ziele; reservierte Bootstrap-Module wie `xstate` bleiben ausdrücklich benannt.

## Öffentliche Bausteine

- `components/manifest.json` ist die ausgelieferte Registry.
- `xtend-loader.js` validiert Namen, URL, Protokoll und Dateiendung.
- `xtend-loader.d.ts` beschreibt Manifest, Diagnostics und Boot-Result.

## Empfohlener Ablauf

Ein minimales Manifest enthält relative, hostkontrollierte Pfade:

```json
{
  "x-button": "./xbutton.js",
  "x-status": "./xstatus.js"
}
```

Lade es mit `data-manifest="/components/manifest.json"`. Ein unbekannter Tag bleibt unregistriert; eine verbotene URL erzeugt eine Import- oder Manifest-Diagnose statt eines Remote-Fallbacks.

## Nächste Schritte

- [API](./api.md)
- [XTend Classic](./xtend-classic.md)
- [Design Tokens](./design-tokens.md)
