# Design Tokens

Theme-, Dichte-, Fokus- und Statuswerte als stabile Design-Schnittstelle.

## Worum es geht

Design Tokens sind die stabile Theme-Grenze zwischen Produktdesign und Komponenten-CSS. Semantische Namen beschreiben Surface, Text, Fokus, Status, Dichte und Motion; Komponenten dürfen daraus lokale Custom Properties ableiten.

## Öffentliche Bausteine

- `design-tokens/xtend-design-tokens.js` stellt Registry und Auflösung bereit.
- `design-tokens/xtend-design-tokens.d.ts` typisiert Token Maps und Theme-Daten.
- `design-tokens/themes/enterprise-light.json` und `xtend-signature.json` sind lokale Theme Packs.

## Empfohlener Ablauf

Setze semantische Tokens am Host und lasse Komponenten ihre Fallback-Kette verwenden:

```css
:root {
  --xtend-surface: #ffffff;
  --xtend-text: #172033;
  --xtend-focus-outline: 2px solid #0b6bcb;
}
```

Prüfe danach Fokus, Forced Colors und Reduced Motion. Ein fehlendes Token sollte auf den dokumentierten Default fallen; ein privater Komponentenwert ist kein globaler Theme-Vertrag.

## Nächste Schritte

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Classic](./xtend-classic.md)
