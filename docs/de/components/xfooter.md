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

## ECH-WP-07 Token-Tabelle und signatureDesign

`signatureDesign`: Ruhiger Enterprise-Footer mit praeziser Navigation, logo-sicherem Medienbereich und dezenter Signature-Tiefe. Das Default-Design bleibt hochwertig, laesst sich aber durch Corporate-Themes vollstaendig ueberschreiben.

| Token | Zweck |
| --- | --- |
| `--xtend-layout-surface` | Footer-Flaeche |
| `--xtend-layout-text` | Text- und Linkfarbe |
| `--xtend-layout-border-color` | Footer- und Linkkante |
| `--xtend-layout-radius` | Footer- und Linkradius |
| `--xtend-layout-elevation` | Footer-Schatten |
| `--xtend-layout-spacing` | Footer-Padding |
| `--xtend-layout-gap` | Titel-, Nav- und Inhaltsabstand |
| `--xtend-layout-font-family` | Footer-Typografie |
| `--xtend-layout-font-size` | Footer-Schriftgroesse |
| `--xtend-layout-media-radius` | Logo-Radius |
| `--xtend-layout-focus-ring` | Link-Fokus |
| `--xtend-layout-grid-min` | Responsive Footer-Zellbreite |
| `--xtend-layout-content-max` | Footer-Maximalbreite |

## ECH-WP-07 Fremdtheme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-footer {
  --xtend-layout-surface: #f8f4ef;
  --xtend-layout-text: #1e2420;
  --xtend-layout-border-color: rgba(30, 36, 32, 0.2);
  --xtend-layout-radius: 0.25rem;
  --xtend-layout-elevation: 0 8px 24px rgba(30, 36, 32, 0.1);
  --xtend-layout-spacing: 1.15rem;
  --xtend-layout-gap: 0.85rem;
  --xtend-layout-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-layout-font-size: 0.95rem;
  --xtend-layout-media-radius: 0.15rem;
  --xtend-layout-focus-ring: 3px solid #8f4f2a;
  --xtend-layout-grid-min: minmax(11rem, 1fr);
  --xtend-layout-content-max: 72rem;
}
```
