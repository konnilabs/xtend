# Public Component Types

TypeScript-Oberflächen für Attribute, Events und Component Contracts.

## Worum es geht

Jede öffentliche Komponente besitzt eine Deklaration neben ihrer Browser-Runtime. Diese Types spiegeln Attribute, Properties, Methoden und Event-Detail-Maps und erlauben Wrappern, den Web-Component-Vertrag ohne Shadow-DOM-Wissen weiterzugeben.

## Öffentliche Bausteine

- `components/xtend-public-types.d.ts` enthält gemeinsame Event- und Contract-Helfer.
- `components/<name>.d.ts` beschreibt jeweils das konkrete Element.
- `components/manifest.json` verbindet denselben Tag mit seiner Runtime-Datei.

## Empfohlener Ablauf

Lies zuerst die komponentennahe Deklaration und importiere nur den benötigten Element- oder Event-Typ. Prüfe Wrapper mit `npm run test:component-public-types`; ein Typ darf keine Methode versprechen, die die erzeugte Runtime nicht besitzt.

```ts
import type { XToggleElement, XToggleEventMap } from '../components/xtoggle';

const toggle = document.querySelector<XToggleElement>('x-toggle');
toggle?.addEventListener('toggle-changed', (event: XToggleEventMap['toggle-changed']) => {
  console.log(event.detail.checked);
});
```

## Fehlerbehebung

- Wenn TypeScript einen Component-Typ nicht findet, prüfe die sibling `.d.ts` Datei und den Package Export auf das lokale Modul.
- Wenn ein Event Detail als `unknown` erscheint, nutze die komponentenspezifische Event Map oder den gemeinsamen Helper aus `components/xtend-public-types.d.ts`.
- Wenn ein Wrapper Attribute verdeckt, spiegle die öffentlichen HTML-Attributnamen statt privater Prop-Namen.

## Nächste Schritte

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Classic](./xtend-classic.md)
- [Design Tokens](./design-tokens.md)
