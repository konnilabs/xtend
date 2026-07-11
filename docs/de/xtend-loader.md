# XTend Loader

Der lokale ES-Modul-Loader für manifestbasierte Web Components.

## Worum es geht

`xtend-loader.js` lädt das lokale Manifest, registriert benötigte Custom Elements und erfasst Load-/Define-Messwerte. Die API bleibt unter `window.XTendLoader`; der Boot-Vorgang ist über `window.__XTendLoaderBootPromise` beobachtbar.

## Öffentliche Bausteine

- `window.XTendLoader.ensureComponent(tag)` lädt einen bekannten Tag gezielt.
- `window.XTendLoader.hydrateTree(root)` entdeckt nicht definierte Tags in einem Teilbaum.
- `xtend-loader.d.ts` dokumentiert Loader-, Style-Registry- und Skeleton-APIs.

## Empfohlener Ablauf

Binde den Loader einmal ein und verwende einen expliziten Manifest-Pfad:

```html
<script src="/xtend-loader.js"
  data-manifest="/components/manifest.json"></script>
<x-button label="Continue"></x-button>
<script type="module">
  await window.__XTendLoaderBootPromise;
  await window.XTendLoader.ensureComponent("x-button");
</script>
```

Bei `xtend.loader.import.refused` sind Protokoll, Origin oder Dateiendung nicht erlaubt. Ändere die Manifestquelle; umgehe die Policy nicht mit einem zweiten dynamischen Import.

## Nächste Schritte

- [Manifest](./manifest.md)
- [API](./api.md)
- [Design Tokens](./design-tokens.md)
