# xlightbox – XTend Komponente

> **Siehe auch:** [xplayer](./xplayer.md)

## Übersicht

`<x-lightbox>` ist eine Komponente zur Anzeige von Bildern im viewportweiten Overlay. Sie unterstuetzt Trigger-Slots, API-gesteuertes Oeffnen, Escape Close, Focus Return und viewport-bounded Media-Skalierung.

---

## Features
- Overlay für Bilder und Medien
- Trigger-Slot und globale Helper-API
- Keyboard-Support mit Escape Close
- Viewport-bounded Bildskalierung mit Body-Portal
- Theming via CSS Custom Properties

---

## Verwendung

```html
<x-lightbox id="logo-lightbox" src="/assets/logo.png" alt="XTend Logo">
  <x-button slot="trigger" variant="secondary">Logo ansehen</x-button>
</x-lightbox>

<img src="/assets/preview.jpg" data-xlightbox alt="Preview" />
```

---

## Attribute
| Attribut    | Typ     | Beschreibung                        |
|-------------|---------|-------------------------------------|
| `src`       | String  | Bildquelle fuer Trigger, API und `data-xlightbox` |
| `open`      | Boolean | oeffnet die Lightbox kontrolliert, sofern `src` gesetzt ist |
| `alt`       | String  | Alternativtext fuer das angezeigte Bild |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| `lightbox-opened` | Wird beim Oeffnen ausgelöst, Detail: `{ src }` |
| `lightbox-closed` | Wird beim Schliessen ausgelöst |

---

## API
- **Oeffnen:** `element.open(src)`
- **Schliessen:** `element.close()`
- **Globaler Helper:** `window.showLightbox(src)`
- **State:** `xlightbox-open-<id>`

`src` konfiguriert die Bildquelle, oeffnet die Lightbox aber nicht automatisch. Fuer direkte UI-Nutzung wird ein Element im Slot `trigger` verwendet. Beim Oeffnen portalt sich die Lightbox auf `document.body`, damit Overlay und Bild nicht von App-Shell-Containern, `main`, Cards oder transformierten Demo-Frames abgeschnitten werden.

---

## Beispiel: Dynamisch per JS

```js
const lightbox = document.createElement('x-lightbox');
document.body.appendChild(lightbox);
lightbox.open('/assets/bild.jpg');
```

---

## Styling & Theming

```css
x-lightbox {
  --lightbox-bg: rgba(0,0,0,0.9);
  --lightbox-padding: clamp(0.75rem, 2vw, 2rem);
  --lightbox-radius: 0.75rem;
}
```

---

## Accessibility
- Fokus-Management, Keyboard-Navigation und Focus Return
- `role="dialog"`, `aria-modal="true"` und geschlossener Zustand mit `aria-hidden` und `inert`
- Bildskalierung via `object-fit: contain` und `max-height: calc(100dvh - padding)`

---

*Letzte Aktualisierung: 16. Juli 2025*

## Layout Display Media UX Profil

`x-lightbox` stellt ab `WP-E11-12` das Profil `xtend.component.layout-display-media-ux-profile.v1` bereit. Die Komponente verbindet Overlay- und Media-Reife und nutzt den State-Key `xlightbox-open-<id>`.

- Profil-Getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `media.lazy.load`
- Events: `lightbox-opened`, `lightbox-closed`
- Snapshot: `snapshot()`
- CSS Parts: `overlay`, `content`, `close`, `media`
