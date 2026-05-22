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

## ECH-WP-07 Token-Tabelle und signatureDesign

`signatureDesign`: Editoriale Enterprise-Section mit kontrollierter Flaechenhierarchie, optionaler Kante und overflow-sicheren Inhaltsbahnen. Sie kann plain, framed oder dichtes Dashboard-Layout sein, ohne neue Attribute zu brauchen.

| Token | Zweck |
| --- | --- |
| `--xtend-layout-surface` | Section-Flaeche |
| `--xtend-layout-text` | Haupttextfarbe |
| `--xtend-layout-border-color` | Optionale Section-Kante |
| `--xtend-layout-radius` | Section-Radius |
| `--xtend-layout-elevation` | Optionaler Section-Schatten |
| `--xtend-layout-spacing` | Section- und Content-Padding |
| `--xtend-layout-gap` | Slot-Abstand |
| `--xtend-layout-font-family` | Section-Typografie |
| `--xtend-layout-font-size` | Content-Schriftgroesse |
| `--xtend-layout-media-radius` | Medienradius fuer slotted Content |
| `--xtend-layout-focus-ring` | Fokus innerhalb der Section |
| `--xtend-layout-grid-min` | Responsive Inhaltsbasis |
| `--xtend-layout-content-max` | Section-Maximalbreite |

## ECH-WP-07 Fremdtheme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-section {
  --xtend-layout-surface: #fffaf2;
  --xtend-layout-text: #1d2722;
  --xtend-layout-border-color: rgba(29, 39, 34, 0.18);
  --xtend-layout-radius: 0.4rem;
  --xtend-layout-elevation: none;
  --xtend-layout-spacing: 1.6rem;
  --xtend-layout-gap: 1.2rem;
  --xtend-layout-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-layout-font-size: 1rem;
  --xtend-layout-media-radius: 0.35rem;
  --xtend-layout-focus-ring: 3px solid #8f4f2a;
  --xtend-layout-grid-min: minmax(14rem, 1fr);
  --xtend-layout-content-max: 76rem;
}
```
