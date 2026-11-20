# TypeScript Components

Wie XTend Komponenten typisiert, dokumentiert und getestet werden.

## Worum es geht

XTend entwickelt stabile Komponenten TypeScript-first. Der aktuelle produktive TypeScript-Build umfasst `src/components/x-toggle/x-toggle.ts`. Der Finalizer erzeugt daraus die gemeinsame Klasse in `components/xtoggle.definition.js`, den Classic-Bootstrap in `components/xtoggle.js` und die öffentliche Deklaration in `components/xtoggle.d.ts`. Der Bootstrap registriert dieselbe Klasse, die der verwaltete Source8-Loader vorbereitet.

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

Ändere Source, Deklaration, Fixture und Komponentenartikel gemeinsam. Für `x-toggle` wird die gemeinsame Definition beim TypeScript-Build erneut erzeugt; die Änderungen gehören deshalb in die TypeScript-Quelle. Bei den übrigen aktuellen Katalogeinträgen ist die ausgelieferte `*.definition.js` für die Implementierungsprüfung maßgeblich. Der Classic-Einstieg importiert diese Definition und übernimmt den bisherigen Bootstrap. Die nebenwirkungsfreie Definition registriert beim Import keine CustomElements und installiert keine globalen Dienste.

Für Änderungen an der nativen Schnittstelle müssen zusätzlich der kuratierte [Source8-Katalog](../../development/rmtx-a06/native-component-catalog/catalog.cjs), seine generierten Typen und die funktionalen Komponentenprüfungen nachgezogen werden. Der aktuelle Ausbau und seine Grenzen stehen im [Implementierungsvertrag](../../development/rmtx-a06/native-component-catalog/implementation.md).

## Nächste Schritte

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Classic](./xtend-classic.md)
- [Design Tokens](./design-tokens.md)
