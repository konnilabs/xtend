# xcards – XTend Komponente

> **Siehe auch:** [xmasonry](./xmasonry.md), [xcalendar](./xcalendar.md), [xstate](./xstate.md)

## Übersicht

`<x-cards>` ist ein flexibles Grid-Layout für beliebige Inhalte. Es unterstützt Responsive Design, Theming und State-Integration.

---

## Features
- Grid-Layout mit variabler Spaltenzahl
- Responsive (1 Spalte auf Mobilgeräten)
- Theming via CSS Custom Properties
- State-Integration via xstate

---

## Verwendung

```html
<x-cards columns="4" gap="2rem">
  <div>Card 1</div>
  <div>Card 2</div>
</x-cards>
```

---

## Attribute
| Attribut    | Typ     | Beschreibung                        |
|-------------|---------|-------------------------------------|
| `columns`   | Number  | Anzahl der Spalten (default: 3)      |
| `gap`       | String  | Abstand zwischen Karten (default: 1.5rem) |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| –             | –                                   |

---

## API
- **Spalten dynamisch setzen:** `element.setAttribute('columns', 2)`
- **State-Integration:** Automatisch via xstate

---

## Beispiel: Dynamisch per JS

```js
const cards = document.createElement('x-cards');
cards.setAttribute('columns', 2);
document.body.appendChild(cards);
```

---

## Styling & Theming

```css
x-cards {
  --card-columns: 4;
  --card-gap: 2rem;
}
```

---

## Accessibility
- Grid-Rolle, semantisches HTML

---

*Letzte Aktualisierung: 16. Juli 2025*

## Layout Display Media UX Profil

`x-cards` stellt ab `WP-E11-12` das Profil `xtend.component.layout-display-media-ux-profile.v1` bereit. Die Komponente beschreibt ein responsive Card-Grid fuer RMT Shell Authoring und nutzt den State-Key `xcards-state-<id>`.

- Profil-Getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `layout.reflow.commit`
- Event: `cards-layout`
- Snapshot: `snapshot()`
- CSS Parts: `root`, `grid`, `item`

## ECH-WP-07 Token-Tabelle und signatureDesign

`signatureDesign`: Eigenstaendiger Enterprise-Card-Rhythmus mit tokenisiertem Glas, Kante, Tiefe und Typografie. Das Default-Grid soll nicht wie ein generisches SaaS-Kartenraster wirken und trotzdem voll themebar bleiben.

| Token | Zweck |
| --- | --- |
| `--xtend-layout-surface` | Card-Flaeche |
| `--xtend-layout-text` | Card-Textfarbe |
| `--xtend-layout-border-color` | Card-Kante |
| `--xtend-layout-radius` | Card-Radius |
| `--xtend-layout-elevation` | Card-Schatten |
| `--xtend-layout-spacing` | Card-Padding |
| `--xtend-layout-gap` | Grid-Abstand |
| `--xtend-layout-font-family` | Card-Typografie |
| `--xtend-layout-font-size` | Card-Textgroesse |
| `--xtend-layout-media-radius` | Bild-/Medienradius |
| `--xtend-layout-focus-ring` | Card-Fokus |
| `--xtend-layout-grid-min` | Grid-Untergrenze |
| `--xtend-layout-content-max` | Grid-Maximalbreite |

## ECH-WP-07 Fremdtheme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-cards,
[data-xtend-layout-theme="enterprise-foreign"] x-card {
  --xtend-layout-surface: #f8f4ef;
  --xtend-layout-text: #1b2823;
  --xtend-layout-border-color: rgba(27, 40, 35, 0.18);
  --xtend-layout-radius: 0.3rem;
  --xtend-layout-elevation: 0 12px 30px rgba(27, 40, 35, 0.12);
  --xtend-layout-spacing: 1.35rem;
  --xtend-layout-gap: 1.1rem;
  --xtend-layout-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-layout-font-size: 1rem;
  --xtend-layout-media-radius: 0.25rem;
  --xtend-layout-focus-ring: 3px solid #8f4f2a;
  --xtend-layout-grid-min: minmax(15rem, 1fr);
  --xtend-layout-content-max: 74rem;
}
```
