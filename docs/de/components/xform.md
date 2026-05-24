# x-form

Formularlayout, Validierung und Submission-Kontext.

## Wann einsetzen

x-form ist Teil der öffentlichen XTend Komponentenbibliothek. Nutze die Komponente, wenn du eine lokale, themenfähige Web-Component ohne Framework-Bindung brauchst.

## Basisbeispiel

```html
<x-form></x-form>
```

## Integration

Lade die Komponente über `xtend-loader.js` und `components/manifest.json`. Für RMT Hosts beschreibt ein Component Descriptor Attribute, Slots und Events; der Host Adapter materialisiert daraus das Custom Element.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)

## Öffentlicher Runtime-Vertrag

- UX-Profil: `xtend.component.form-control-ux-profile.v1`.
- State-Key: `xform-data-<id>`.
- Zweck: Form-Control UX-Profil für RMT Hosts, Fabric-Lanes und browsernahe Tests sichtbar machen.
