# xcode – XTend Komponente

> **Siehe auch:** [xwriter](./xwriter.md), [xstate](./xstate.md)

## Übersicht

`<x-code>` ist eine Komponente zur Anzeige und Bearbeitung von Quellcode mit Syntax-Highlighting, State-Integration und Theming.

---

## Features
- Syntax-Highlighting (z.B. via Prism.js)
- Sprache wählbar (`lang`-Attribut)
- State-Integration via xstate
- Theming via CSS Custom Properties

---

## Verwendung

```html
<x-code lang="js">
  console.log('Hallo XTend!');
</x-code>
```

---

## Attribute
| Attribut    | Typ     | Beschreibung                        |
|-------------|---------|-------------------------------------|
| `lang`      | String  | Programmiersprache (default: text)   |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| –             | –                                   |

---

## API
- **Sprache setzen:** `element.setAttribute('lang', 'css')`
- **State-Integration:** Automatisch via xstate

---

## Beispiel: Dynamisch per JS

```js
const code = document.createElement('x-code');
code.setAttribute('lang', 'html');
code.textContent = '<h1>Hallo</h1>';
document.body.appendChild(code);
```

---

## Styling & Theming

```css
x-code {
  --background: #222;
  --color: #fff;
}
```

---

## Accessibility
- Semantisches HTML, Copy-Support

---

*Letzte Aktualisierung: 16. Juli 2025*

## Layout Display Media UX Profil

`x-code` stellt ab `WP-E11-12` das Profil `xtend.component.layout-display-media-ux-profile.v1` bereit. Code-Bloecke koennen damit als idle hydrierbare Display-Shell in RMT authoriert werden und nutzen den State-Key `xcode-state-<id>`.

- Profil-Getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.idle.hydrate`
- Event: `code-copied`
- Snapshot: `snapshot()`
- CSS Parts: `root`, `copy`, `pre`, `code`

## ECH-WP-07 Token-Tabelle und signatureDesign

`signatureDesign`: Lesbare Enterprise-Codeflaeche mit klarem Copy-Control, internem Overflow und eigenstaendiger, themebarer Monospace-Persoenlichkeit. Docs-, IDE- und Corporate-Themes sollen ohne DOM-Aenderung funktionieren.

| Token | Zweck |
| --- | --- |
| `--xtend-layout-surface` | Code-Flaeche |
| `--xtend-layout-text` | Code-Textfarbe |
| `--xtend-layout-border-color` | Code- und Copy-Kante |
| `--xtend-layout-radius` | Code- und Copy-Radius |
| `--xtend-layout-elevation` | Code-Schatten |
| `--xtend-layout-spacing` | Code-Padding |
| `--xtend-layout-gap` | Theme-Abstand fuer Tooling |
| `--xtend-layout-font-family` | Monospace-/Code-Typografie |
| `--xtend-layout-font-size` | Code-Schriftgroesse |
| `--xtend-layout-media-radius` | Copy-Control-Radius |
| `--xtend-layout-focus-ring` | Copy-Control-Fokus |
| `--xtend-layout-grid-min` | Code-Layout-Untergrenze |
| `--xtend-layout-content-max` | Code-Maximalbreite |

## ECH-WP-07 Fremdtheme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-code {
  --xtend-layout-surface: #151b19;
  --xtend-layout-text: #f7f1e7;
  --xtend-layout-border-color: rgba(247, 241, 231, 0.18);
  --xtend-layout-radius: 0.35rem;
  --xtend-layout-elevation: 0 16px 40px rgba(21, 27, 25, 0.22);
  --xtend-layout-spacing: 1.25rem 1.4rem;
  --xtend-layout-gap: 0.75rem;
  --xtend-layout-font-family: "Cascadia Code", "Fira Mono", monospace;
  --xtend-layout-font-size: 0.95rem;
  --xtend-layout-media-radius: 999px;
  --xtend-layout-focus-ring: 3px solid #d48b57;
  --xtend-layout-grid-min: minmax(0, 1fr);
  --xtend-layout-content-max: 68rem;
}
```
