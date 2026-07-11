# XTend Fabric

Fabric koordiniert Lanes, Telemetrie und Runtime-Diagnostik.

## Worum es geht

XTend Fabric führt kleine Arbeitseinheiten als Fibers in benannten Lanes aus. Es sammelt Lifecycle-, Performance- und Fehlerdiagnosen und erzeugt Backpressure-Signale, ohne kanonischen App-State oder DOM-Besitz zu übernehmen.

## Öffentliche Bausteine

- `fabric/xtend-fabric.js` stellt `createXtendFabric()` bereit.
- `fabric/xtend-fabric.d.ts` beschreibt Lanes, Reporter, Fibers und Telemetrie.
- `fabric/xtend-policy-public-types.d.ts` enthält gemeinsame Result- und Diagnostic-Typen.

## Empfohlener Ablauf

Erzeuge eine Fabric-Instanz pro kontrollierter Runtime-Grenze, registriere optionale Reporter und dispose sie mit dem Host:

```js
const fabric = window.XTendFabric.createXtendFabric();
const result = await fabric.runFiber({ kind: "component.mount", lane: "visible" });
const snapshot = fabric.createTelemetrySnapshot();
fabric.dispose();
```

Ein blockierter Fiber bleibt als Diagnostic sichtbar. Wiederhole Arbeit nicht blind, wenn Backpressure bereits `defer`, `shed` oder `block` signalisiert.

## Nächste Schritte

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
