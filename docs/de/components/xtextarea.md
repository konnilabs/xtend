# x-textarea

Mehrzeilige Eingaben.

## Wann einsetzen

x-textarea ist Teil der öffentlichen XTend Komponentenbibliothek. Nutze die Komponente, wenn du eine lokale, themenfähige Web-Component ohne Framework-Bindung brauchst.

## Basisbeispiel

```html
<x-textarea></x-textarea>
```

## RMT-Editor mit Highlighting

Für Code-Eingaben kann `x-textarea` Prism.js nutzen. Die Tokenfarben entsprechen `x-code`, damit Editor- und Read-only-Codeflächen im Dev Center gleich aussehen.

```html
<x-textarea syntax-highlight lang="rmt" rows="18">
template demo.playground {
  surface preview.card kind card component x-status {
    lane visible weight 80 {
      hydrate preview-card
    }
  }
}
</x-textarea>
```

## Integration

Lade die Komponente über `xtend-loader.js` und `components/manifest.json`. Für RMT Hosts beschreibt ein Component Descriptor Attribute, Slots und Events; der Host Adapter materialisiert daraus das Custom Element.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)

## Öffentlicher Runtime-Vertrag

- UX-Profil: `xtend.component.form-control-ux-profile.v1`.
- State-Key: `xtextarea-value-<id>`.
- Zweck: Form-Control UX-Profil für RMT Hosts, Fabric-Lanes und browsernahe Tests sichtbar machen.
