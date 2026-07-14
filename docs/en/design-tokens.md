# Design Tokens

Theme, density, focus and status values as a stable design interface.

## What it covers

Design tokens are the stable theme boundary between product design and component CSS. Semantic names describe surfaces, text, focus, status, density, and motion; components may derive local custom properties from them.

## Public building blocks

- `design-tokens/xtend-design-tokens.js` provides registry and resolution.
- `design-tokens/xtend-design-tokens.d.ts` types token maps and theme data.
- `design-tokens/themes/enterprise-light.json` and `xtend-signature.json` are local theme packs.

## Recommended workflow

Set semantic tokens on the host and let components follow their fallback chain:

```css
:root {
  --xtend-surface: #ffffff;
  --xtend-text: #172033;
  --xtend-focus-outline: 2px solid #0b6bcb;
}
```

Then verify focus, forced colors, and reduced motion. A missing token should fall back to its documented default; a private component value is not a global theme contract.

## Next steps

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Classic](./xtend-classic.md)
