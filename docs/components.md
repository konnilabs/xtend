# Komponenten-Entwicklung mit XTend

> **Hinweis:** Siehe auch: [xrouter](./components/xrouter.md), [xlink](./components/xlink.md)

## Übersicht

XTend-Komponenten sind eigenständige, wiederverwendbare Web Components, die als Custom Elements implementiert werden. Sie ermöglichen eine modulare, deklarative und performante Entwicklung moderner Webanwendungen.

---

## Grundprinzipien

- Jede Komponente ist ein ES6-Modul (JavaScript-Datei) und wird per Manifest dynamisch geladen.
- Komponenten verwenden das Custom Elements API (`customElements.define`).
- Der Manifest-Key ist der kanonische Runtime-/Catalog-Name. Fuer Custom Elements ist er zugleich der Tag-Name, z.B. `x-button`, `x-input`, `x-summary`.
- Source- und Docs-Slugs folgen im Bestand dem Modul-Basename ohne Bindestrich, z.B. `xbutton.js` mit `docs/components/xbutton.md` fuer Manifest-Key `x-button`.
- Komponenten sind unabhängig, können aber andere XTend-Komponenten nutzen.

### Naming-Konvention ab ER-WP-32

| Ebene | Regel | Beispiel |
|-------|-------|----------|
| Manifest-Key | kanonischer Runtime- und Catalog-Name | `x-summary` |
| Custom Element Tag | identisch zum Manifest-Key, wenn ein Custom Element registriert wird | `<x-summary>` |
| Source-Datei | Modul-Basename aus dem Manifest-Pfad | `xsummary.js` |
| Component-Doku | Source-Basename plus `.md` | `docs/components/xsummary.md` |
| Docs-Menu-Slug | `components-` plus Source-Basename | `components-xsummary` |

Ausnahmen bleiben explizit dokumentiert: `xstate` ist ein Plattform-State-Modul, `x-utils` ist ein Utility-Modul ohne Custom Element und `x-theme` ist ein Core-Theme-Modul mit Runtime-Fassade unter `window.XTend.theme`. Die vollstaendige Entscheidung liegt in `development/XTend-Component-Catalog-Naming-Konvention.md`.

---

## Struktur einer Komponente

Typischerweise besteht eine Komponente aus:
- **Klasse**: Erbt von `HTMLElement` oder einer anderen Web Component-Basis.
- **Template**: HTML-Struktur, meist als Template-String oder Shadow DOM.
- **Styles**: Inline, als CSS-String oder per Shadow DOM gekapselt.
- **Registrierung**: Über `customElements.define('xname', XName)`.

### Beispiel: Minimal-Komponente

```js
class XButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <button><slot></slot></button>
      <style>button { padding: 8px; }</style>
    `;
  }
}
customElements.define('x-button', XButton);
```

---

## Best Practices

- **Kapselung:** Möglichst Shadow DOM nutzen, um Styles und Markup zu isolieren.
- **Namenskonvention:** Manifest-Key und Custom-Element-Tag sind kanonisch; Source- und Docs-Slugs folgen dem Modul-Basename.
- **Wiederverwendbarkeit:** Komponenten sollten unabhängig und konfigurierbar sein (Attribute, Properties, Events).
- **Lazy Loading:** Komponenten werden nur geladen, wenn sie im DOM verwendet werden.
- **Dokumentation:** Jede Komponente sollte eine eigene MD-Datei mit API, Attributen, Events und Beispielen erhalten.

---

## Erweiterte Features

- **Attribute & Properties:** Überwache Attribute mit `static get observedAttributes()` und reagiere auf Änderungen.
- **Events:** Verwende `this.dispatchEvent(new CustomEvent(...))` für Kommunikation.
- **Slots:** Nutze `<slot>` für flexible Inhalte.
- **Theming:** Nutze CSS Custom Properties für Anpassbarkeit.
- **Ikonographie:** Nutze [`x-icon`](./components/xicon.md) als lokalen, RMT-kompatiblen Icon-Adapter fuer Core-Icons, lokale Lucide-Sets und Corporate-Design-Packs.

---

## Beispiel: Erweiterte Komponente

```js
class XInput extends HTMLElement {
  static get observedAttributes() { return ['value']; }
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <input type="text" />
      <style>input { border: 1px solid #ccc; }</style>
    `;
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'value') {
      this.shadowRoot.querySelector('input').value = newVal;
    }
  }
}
customElements.define('xinput', XInput);
```

---

## Testen & Debugging

- Komponenten können direkt im HTML getestet werden.
- Nutze den lokalen Loader `xtend-loader.js` und den lokalen Dev-Server fuer Browser-Smokes und manuelle Tests.

---

## Weiterführende Themen
- [Manifest-Format](./manifest.md)
- [XTend Loader](./xtend-loader.md)
- [API-Integration](./api.md)

---

*Letzte Aktualisierung: 16. Juli 2025*
