# TypeScript Components

Wie XTend Komponenten typisiert, dokumentiert und getestet werden.

## Worum es geht

XTend entwickelt stabile Komponenten TypeScript-first. Die bearbeitbare Source liegt unter `src/components/<tag>/`; `tsc` erzeugt die Browser-Runtime und die sibling `.d.ts` Datei unter `components/`.

## Öffentliche Bausteine

- Die Hauptdatei implementiert Element, Properties und Lifecycle.
- `*.contract.ts`, `*.rmt.ts`, `*.a11y.ts` und `*.performance.ts` halten getrennte Verträge.
- `components/manifest.json` registriert nur den erzeugten lokalen Runtime-Pfad.

## Empfohlener Ablauf

Ein Host konsumiert die erzeugte Deklaration, nicht interne Build-Typen:

```ts
import type { XToggleElement } from "@ccslabs/xtend/components/xtoggle";

const toggle = document.querySelector<XToggleElement>("x-toggle");
toggle?.addEventListener("toggle-changed", (event) => {
  console.log(event.detail.checked);
});
```

Ändere Source, Deklaration, Fixture und Komponentenartikel gemeinsam. Ein manueller Patch nur in `components/*.js` wird beim nächsten Build überschrieben.

## Nächste Schritte

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
