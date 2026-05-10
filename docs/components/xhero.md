# xhero – XTend Komponente

> **Siehe auch:** [xsection](./xsection.md), [xbutton](./xbutton.md)

## Übersicht

`<x-hero>` ist eine flexible Hero-Komponente für aufmerksamkeitsstarke Headerbereiche, Landingpages und Einstiege. Sie unterstützt Slots für Titel, Untertitel, Aktionen und Medien.

---

## Features
- Flexibles Layout für Hero-Bereiche
- Slots für Titel, Text, Aktionen, Medien
- Theming via CSS Custom Properties
- Theme-Varianten über `background-light`, `background-dark`, `font-color-light`, `font-color-dark`, `overlay-light` und `overlay-dark`
- Responsive Design

---

## Verwendung

```html
<x-hero>
  <h1 slot="title">Willkommen!</h1>
  <p slot="subtitle">XTend macht Webentwicklung einfach.</p>
  <x-button slot="action">Loslegen</x-button>
</x-hero>
```

---

## Attribute
| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `background` | String | Fester Hintergrund oder CSS-Variable |
| `background-light` | String | Hintergrund für helle Themes |
| `background-dark` | String | Hintergrund für dunkle Themes |
| `background-image` | String | Bildhintergrund |
| `overlay` | Boolean | Aktiviert Overlay-Fläche |
| `overlay-light` | String | Overlay-Farbe für helle Themes |
| `overlay-dark` | String | Overlay-Farbe für dunkle Themes |
| `font-color` | String | Feste Textfarbe |
| `font-color-light` | String | Textfarbe für helle Themes |
| `font-color-dark` | String | Textfarbe für dunkle Themes |
| `animate` | Boolean | Aktiviert Einstiegstransition mit Reduced-Motion-Fallback |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| –             | –                                   |

---

## API
- **Inhalte per Slot einfügen**
- **State-Integration:** Optional via xstate

---

## Beispiel: Dynamisch per JS

```js
const hero = document.createElement('x-hero');
hero.innerHTML = '<h1 slot="title">Hallo XTend!</h1>';
document.body.appendChild(hero);
```

---

## Styling & Theming

```css
x-hero {
  --hero-bg: #f5f5f5;
  --hero-color: #222;
}
```

## Viewport-Sicherheit

`x-hero` begrenzt Host, Root und Content auf `max-width: 100%` und nutzt auf schmalen Viewports keine innere `100vw`-Breite. Dadurch bleibt die Komponente auch in gepaddeten App-Shells oder Docs-Layouts innerhalb des sichtbaren Viewports.

---

## Accessibility
- Semantisches HTML, ARIA

---

*Letzte Aktualisierung: 16. Juli 2025*

## Layout Display Media UX Profil

`x-hero` stellt ab `WP-E11-12` das Profil `xtend.component.layout-display-media-ux-profile.v1` bereit. Die Komponente bleibt Hero-/Display-Shell und kann in RMT mit `component.shell.render` zuerst gerendert werden. Der State-Key lautet `xhero-state-<id>`.

- Profil-Getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.shell.render`
- Events: `hero-rendered`, `hero-animated`
- Snapshot: `snapshot()`
- CSS Parts: `root`, `overlay`, `content`, `scroll-button`
