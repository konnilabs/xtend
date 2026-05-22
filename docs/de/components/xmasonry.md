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

## ECH-WP-07 Token-Tabelle und signatureDesign

`signatureDesign`: Reorderable Enterprise-Masonry mit taktiler Tiefe, icon-only Toggle-Control und themebarem Drag-Feedback. Die Komponente eignet sich fuer Galerien, Dashboards und Knowledge-Layouts ohne Textzeichen-Controls.

| Token | Zweck |
| --- | --- |
| `--xtend-layout-surface` | Masonry-Item-Flaeche |
| `--xtend-layout-text` | Item-Textfarbe |
| `--xtend-layout-border-color` | Item- und Drop-Kanten |
| `--xtend-layout-radius` | Item-Radius |
| `--xtend-layout-elevation` | Item- und Drag-Schatten |
| `--xtend-layout-spacing` | Item-Padding |
| `--xtend-layout-gap` | Grid-Abstand |
| `--xtend-layout-font-family` | Masonry-Typografie |
| `--xtend-layout-font-size` | Item-Textgroesse |
| `--xtend-layout-media-radius` | Toggle-/Medienradius |
| `--xtend-layout-focus-ring` | Toggle-Fokus |
| `--xtend-layout-grid-min` | Grid-Untergrenze |
| `--xtend-layout-content-max` | Masonry-Maximalbreite |

## ECH-WP-07 Fremdtheme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-masonry {
  --xtend-layout-surface: #fbf7f1;
  --xtend-layout-text: #1b2823;
  --xtend-layout-border-color: rgba(27, 40, 35, 0.2);
  --xtend-layout-radius: 0.35rem;
  --xtend-layout-elevation: 0 10px 28px rgba(27, 40, 35, 0.12);
  --xtend-layout-spacing: 1.25rem;
  --xtend-layout-gap: 1rem;
  --xtend-layout-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-layout-font-size: 1rem;
  --xtend-layout-media-radius: 999px;
  --xtend-layout-focus-ring: 3px solid #8f4f2a;
  --xtend-layout-grid-min: minmax(14rem, 1fr);
  --xtend-layout-content-max: 72rem;
}
```
