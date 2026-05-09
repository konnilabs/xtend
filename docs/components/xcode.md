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
