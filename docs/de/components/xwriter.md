# xwriter – XTend Komponente

> **Siehe auch:** [xcode](./xcode.md), [xinput](./xinput.md)

## Übersicht

`<x-writer>` ist eine Komponente für Rich-Text-Editing und einfache WYSIWYG-Editoren. Sie unterstützt Formatierungen, Theming, State-Integration, Autosave, Export und API-Anbindung.

---

## Features
- Rich-Text-Editing (fett, kursiv, Listen, Links, Farben, Größen)
- State-Integration via xstate
- Theming via CSS Custom Properties
- Autosave (lokal oder API)
- Export als Markdown/HTML
- Drag & Drop für Bilder/Text
- API-Anbindung (Speichern an Server)

---

## Verwendung

```html
<x-writer></x-writer>
```

---

## Attribute
| Attribut      | Typ     | Beschreibung                                              |
|-------------- |---------|----------------------------------------------------------|
| `value`       | String  | Initialer Textinhalt (Property, nicht Attribut)          |
| `api`         | String  | API-Endpunkt für Speichern (z.B. `/api/save` oder `local` für LocalStorage) |
| `method`      | String  | HTTP-Methode für API (Standard: `POST`)                  |
| `autosave`    | Number  | Intervall in ms für Autosave (z.B. `10000` für 10s)      |
| `storage-key` | String  | Key für LocalStorage (Standard: `xwriter-content`)       |

---

## Events
| Event             | Beschreibung                                              |
|-------------------|----------------------------------------------------------|
| `writer:change`   | Bei Textänderung ausgelöst, Detail: `{html, markdown, plain}` |
| `writer:save`     | Nach Speichern (lokal/API), Detail: `{status, response}` |
| `writer:autosave` | Nach Autosave                                            |
| `writer:export`   | Nach Export, Detail: `{filename, success}`               |
| `writer:error`    | Bei Fehlern, Detail: `{error}`                           |

---

## API
- **Text setzen/lesen:** `element.value = 'Text'` (Property, nicht Attribut)
- **State-Integration:** Automatisch via xstate
- **Speichern:**
  - Lokal: `<x-writer api="local"></x-writer>`
  - API: `<x-writer api="/api/save" method="POST"></x-writer>`
- **Export:** Über Export-Button (Markdown/HTML)

## Form Controls UX ab WP-E11-08

`<x-writer>` stellt `xtendFormControlUxProfile` mit `xtend.component.form-control-ux-profile.v1` bereit. Das Profil beschreibt Rich-Text als Form-Control-nahe UX-Flaeche mit `writer:change`, `writer:error`, `xwriter-content`, `component.idle.hydrate`, Fabric-Lane `idle` und RMT Shell Authoring. `x-form` kann `writer:change` aufnehmen und den Wert in `xform-data-<id>` aggregieren.

---

## Beispiel: Dynamisch per JS

```js
const writer = document.createElement('x-writer');
writer.value = 'Hallo Welt!';
document.body.appendChild(writer);
```

---

## Styling & Theming

```css
x-writer {
  --writer-bg: #fff;
  --writer-color: #222;
  /* Weitere Custom Properties siehe CSS */
}
```

---

## Accessibility
- Semantisches HTML, ARIA
- Tastaturbedienung

---

*Letzte Aktualisierung: 16. Juli 2025*
