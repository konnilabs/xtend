# xspinner – XTend Komponente

> **Siehe auch:** [xtoast](./xtoast.md), [xalert](./xalert.md)

## Übersicht

`<x-spinner>` ist eine animierte, barrierearme Ladeanzeige für asynchrone Prozesse, Ladezustände und Feedback. Sie ist vielseitig, themable und unterstützt verschiedene Varianten, Overlay-Modus sowie State- und Accessibility-Integration.

---

## Features
- Animierte Ladeanzeige (Kreis, Dots)
- Größe, Farbe, Geschwindigkeit, Typ per Attribut
- Overlay-Modus (zentriert, halbtransparent)
- Slot für eigenen Inhalt
- State-Integration via xstate
- Events für Pause/Resume
- Theming via CSS Custom Properties & XTheme
- Accessibility: ARIA, aria-busy, aria-label, aria-valuetext
- prefers-reduced-motion Support

---

## Verwendung

```html
<x-spinner size="32" color="#C70039" speed="0.7s" type="dots"></x-spinner>
```

---

## Attribute
| Attribut        | Typ     | Beschreibung                                      |
|-----------------|---------|---------------------------------------------------|
| `size`          | String  | Größe des Spinners (z.B. 32, 48, 64)              |
| `color`         | String  | Farbe (CSS-Farbwert, z.B. #007bff)                |
| `speed`         | String  | Animationsdauer (z.B. 1s, 0.7s)                   |
| `type`          | String  | "circle" (Standard), "dots"                      |
| `paused`        | Boolean | Animation pausieren                               |
| `overlay`       | Boolean | Spinner als Overlay über die Seite                |
| `aria-label`    | String  | Zugänglicher Text für Screenreader                |
| `aria-busy`     | String  | ARIA-Status (true/false)                          |
| `aria-valuetext`| String  | Fortschrittstext für Screenreader                 |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| `spinner-started` | Wird beim Einfügen ausgelöst     |
| `spinner-stopped` | Wird beim Entfernen ausgelöst    |
| `paused`          | Animation wurde pausiert         |
| `resumed`         | Animation wurde fortgesetzt      |

---

## API
- **Größe setzen:** `element.setAttribute('size', '48')`
- **Typ ändern:** `element.setAttribute('type', 'dots')`
- **Pause/Resume:** `element.setAttribute('paused', '')` / `element.removeAttribute('paused')`
- **Imperative Pause/Resume:** `element.pause()` / `element.resume()`
- **Snapshot:** `element.snapshot()`
- **Overlay aktivieren:** `element.setAttribute('overlay', '')`
- **State-Integration:** `xstate.set('xspinner-paused-'+element.id, true)`

## Feedback Status UX ab WP-E11-09

`<x-spinner>` stellt `xtendFeedbackStatusUxProfile` mit `xtend.component.feedback-status-ux-profile.v1` bereit. Das Profil beschreibt Spinner als Busy-Status mit `spinner-started`, `spinner-stopped`, `paused`, `resumed`, `xspinner-paused-<id>`, `component.visible.mount`, Fabric-Lane `feedback`, A11y-Lane `a11y` und RMT Shell Authoring.

Die Komponente meldet Pause/Resume ueber Events mit `source: 'x-spinner'` und `stateKey`. Animationen sind reduced-motion-safe; Busy-Status und `aria-valuetext` bleiben fuer Screenreader auch ohne sichtbare Bewegung erhalten.

---

## Beispiel: Dynamisch per JS

```js
const spinner = document.createElement('x-spinner');
spinner.setAttribute('size', '48');
spinner.setAttribute('type', 'dots');
document.body.appendChild(spinner);
```

---

## Styling & Theming

```css
x-spinner {
  --spinner-color: #007bff;
  --spinner-size: 40px;
}
```

---

## Accessibility
- ARIA-Rolle, aria-busy, aria-label, aria-valuetext
- prefers-reduced-motion wird beachtet

---

*Letzte Aktualisierung: 18. Juli 2025*
