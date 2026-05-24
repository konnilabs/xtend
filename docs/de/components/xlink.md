# x-link

Navigationslinks mit XRouter-Unterstützung.

## Wann einsetzen

x-link ist Teil der öffentlichen XTend Komponentenbibliothek. Nutze die Komponente, wenn du eine lokale, themenfähige Web-Component ohne Framework-Bindung brauchst.

## Basisbeispiel

```html
<x-link></x-link>
```

## Integration

Lade die Komponente über `xtend-loader.js` und `components/manifest.json`. Für RMT Hosts beschreibt ein Component Descriptor Attribute, Slots und Events; der Host Adapter materialisiert daraus das Custom Element.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)

## Öffentlicher Runtime-Vertrag

- UX-Profil: `xtend.component.navigation-routing-ux-profile.v1`.
- State-Key: `xlink-active-<id>`.
- Zweck: Navigation- und Routing-UX-Profil für RMT Hosts, Fabric-Lanes und browsernahe Tests sichtbar machen.
