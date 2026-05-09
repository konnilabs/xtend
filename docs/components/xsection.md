# xsection – XTend Komponente

> **Siehe auch:** [xhero](./xhero.md), [xmasonry](./xmasonry.md)

## Übersicht

`<x-section>` ist eine flexible Layout-Komponente für Seitenabschnitte, Container und strukturierte Bereiche. Sie unterstützt Slots, Theming und Responsive Design.

---

## Features
- Container für beliebige Inhalte
- Slots für flexible Struktur
- Theming via CSS Custom Properties
- Responsive Design

---

## Verwendung

```html
<x-section>
  <h2>Abschnitt</h2>
  <p>Inhalt…</p>
</x-section>
```

---

## Attribute
| Attribut    | Typ     | Beschreibung                        |
|-------------|---------|-------------------------------------|
| `variant`   | String  | Layout-Variante (z.B. primary, secondary) |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| –             | –                                   |

---

## API
- **Variante setzen:** `element.setAttribute('variant', 'primary')`

---

## Beispiel: Dynamisch per JS

```js
const section = document.createElement('x-section');
section.setAttribute('variant', 'primary');
document.body.appendChild(section);
```

---

## Styling & Theming

```css
x-section {
  --section-bg: #f9f9f9;
  --section-color: #222;
}
```

---

## Accessibility
- Semantisches HTML

---

*Letzte Aktualisierung: 16. Juli 2025*

## Layout Display Media UX Profil

`x-section` stellt ab `WP-E11-12` das Profil `xtend.component.layout-display-media-ux-profile.v1` bereit. Die Komponente ist als Shell-first Layout-Surface fuer RMT geeignet und nutzt den State-Key `xsection-state-<id>`.

- Profil-Getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `layout.measure`
- Event: `section-rendered`
- Snapshot: `snapshot()`
- CSS Parts: `root`, `container`, `header`, `aside`, `content`, `footer`
