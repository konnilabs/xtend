# xtype – XTend Komponente

> **Siehe auch:** [xwriter](./xwriter.md)

## Übersicht

`<x-type>` ist eine Komponente für animierte Texteffekte (z.B. Typing Animation). Sie eignet sich für Hero-Bereiche, Überschriften und interaktive UI-Elemente.

---

## Features
- Animierte Texteffekte (Typing, Loop)
- Anpassbare Geschwindigkeit
- Theming via CSS Custom Properties

---

## Verwendung

```html
<x-type text="XTend rocks!" speed="80"></x-type>
```

---

## Attribute
| Attribut    | Typ     | Beschreibung                        |
|-------------|---------|-------------------------------------|
| `text`      | String  | Anzuzeigender Text                   |
| `speed`     | Number  | Geschwindigkeit in ms pro Zeichen    |
| `loop`      | Boolean | Endlosschleife                       |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| `done`        | Wird nach Animation ausgelöst        |

---

## API
- **Text dynamisch setzen:** `element.setAttribute('text', 'Hallo')`

---

## Beispiel: Dynamisch per JS

```js
const type = document.createElement('x-type');
type.setAttribute('text', 'Hallo Welt!');
document.body.appendChild(type);
```

---

## Styling & Theming

```css
x-type {
  --type-color: #007bff;
}
```

---

## Accessibility
- Semantisches HTML

---

*Letzte Aktualisierung: 16. Juli 2025*

## Layout Display Media UX Profil

`x-type` stellt ab `WP-E11-12` das Profil `xtend.component.layout-display-media-ux-profile.v1` bereit. Die Komponente nutzt eine Shadow-DOM-Shell fuer Text und Cursor, kann idle hydriert werden und schreibt ihren aktuellen Text nach `xtype-current`.

- Profil-Getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.idle.hydrate`
- Events: `typing-started`, `typing-completed`, `text-erased`
- Snapshot: `snapshot()`
- CSS Parts: `root`, `text`, `cursor`
