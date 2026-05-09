# xfooter – XTend Komponente

> **Siehe auch:** [xheader](./xheader.md), [xtheme](./xtheme.md)

## Übersicht

`<x-footer>` ist eine anpassbare Footer-Komponente mit Logo, Sticky-Option und State-Integration. Sie eignet sich für Branding und Navigation am Seitenende.

---

## Features
- Optionales Logo (src-Attribut)
- Sticky-Funktion (bleibt am unteren Rand)
- State-Integration via xstate
- Theming via CSS Custom Properties

---

## Verwendung

```html
<x-footer src="logo.svg" logo-size="48" sticky></x-footer>
```

---

## Attribute
| Attribut    | Typ     | Beschreibung                        |
|-------------|---------|-------------------------------------|
| `src`       | String  | Logo-URL                            |
| `logo-size` | String  | Größe des Logos (z.B. 48, 64px)      |
| `sticky`    | Boolean | Footer bleibt am unteren Rand        |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| –             | –                                   |

---

## API
- **Logo dynamisch setzen:** `element.setAttribute('src', 'logo.svg')`
- **Sticky aktivieren:** `element.setAttribute('sticky', '')`
- **State-Integration:** Automatisch via xstate

---

## Beispiel: Dynamisch per JS

```js
const footer = document.createElement('x-footer');
footer.setAttribute('src', 'logo.svg');
document.body.appendChild(footer);
```

---

## Styling & Theming

```css
x-footer {
  --header-bg: #222;
  --header-fg: #fff;
}
```

---

## Accessibility
- Semantisches HTML, ARIA

---

*Letzte Aktualisierung: 16. Juli 2025*

## Layout Display Media UX Profil

`x-footer` stellt ab `WP-E11-12` das Profil `xtend.component.layout-display-media-ux-profile.v1` bereit. Die Komponente kann als RMT Shell Footer sichtbar gemountet werden und nutzt den State-Key `xfooter-state-<id>`.

- Profil-Getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.visible.mount`
- Events: `footer-ready`, `theme-applied`, `logo-loaded`
- Snapshot: `snapshot()`
- CSS Parts: `root`, `title`, `logo`, `nav`, `extra`
