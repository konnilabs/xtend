# xmasonry – XTend Komponente

> **Siehe auch:** [xcards](./xcards.md), [xsection](./xsection.md)

## Übersicht

`<x-masonry>` ist ein flexibles Grid-Layout für kachelartige Anordnungen (Masonry-Layout). Es eignet sich für Galerien, Cards und dynamische Inhalte.

---

## Features
- Masonry-Layout (Pinterest-Style)
- Responsive Design
- Theming via CSS Custom Properties

---

## Verwendung

```html
<x-masonry>
  <div>Item 1</div>
  <div>Item 2</div>
</x-masonry>
```

---

## Attribute
| Attribut    | Typ     | Beschreibung                        |
|-------------|---------|-------------------------------------|
| `columns`   | Number  | Anzahl der Spalten (default: 3)      |
| `gap`       | String  | Abstand zwischen Items (default: 1rem) |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| –             | –                                   |

---

## API
- **Spalten dynamisch setzen:** `element.setAttribute('columns', 4)`

---

## Beispiel: Dynamisch per JS

```js
const masonry = document.createElement('x-masonry');
masonry.setAttribute('columns', 4);
document.body.appendChild(masonry);
```

---

## Styling & Theming

```css
x-masonry {
  --masonry-gap: 2rem;
}
```

---

## Accessibility
- Semantisches HTML

---

*Letzte Aktualisierung: 16. Juli 2025*

## Layout Display Media UX Profil

`x-masonry` stellt ab `WP-E11-12` das Profil `xtend.component.layout-display-media-ux-profile.v1` bereit. Die Komponente ist als responsive Layout-Grid mit deterministischem Reflow-Schedule authorierbar und nutzt den State-Key `xmasonry-state-<id>`.

- Profil-Getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `layout.reflow.commit`
- Event: `masonry-layout`
- Snapshot: `snapshot()`
- CSS Parts: `root`, `grid`, `item`, `toggle`, `content`
