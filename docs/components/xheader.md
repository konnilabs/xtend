# xheader – XTend Komponente

> **Siehe auch:** [xfooter](./xfooter.md), [xtheme](./xtheme.md)

## Übersicht

`<x-header>` ist eine vielseitige, barrierearme Header-Komponente für Branding, Navigation und flexible Layouts. Sie unterstützt Logo, Titel, Search-, Actions-/Utility- und Navigationsslots, Theming, State-Integration und ein responsives Overlay-Menü.

---

## Features
- Optionales Logo (src-Attribut)
- Slot-System für Titel, Suche, Actions, Legacy-Utility und Navigation
- Sticky-Header
- State-Integration via xstate
- Theming via CSS Custom Properties (voll themefähig)
- **Responsives Verhalten:** Header-Inhalte laufen über ein Slot-Grid. Suche und Actions umbrechen auf kleinen Displays kontrolliert, Navigation bleibt im Drawer.
- **Slot Alignment:** Brand, Actions und Menü-Trigger bleiben bei schmalen Viewports in einer festen Kopfzeile; Search liegt darunter und verhindert dadurch verschobene Action-Buttons.
- **Full-Width-Drawer:** Das Menü rendert als fixed Overlay über die gesamte verfügbare Seitenbreite und verlängert den Dokument-Scrollbereich nicht.
- **Overflow-sichere Navigation:** Direkte `x-link`-Einträge und komplexe `[data-menu-shell]`-Menüs bleiben im Drawer innerhalb ihrer Container.
- **Burger-Menü:** Animierter Button, Farbe per Theme steuerbar
- **Barrierefreiheit:** Landmark-Rollen, ARIA, Keyboard-Navigation, Fokus-Management
- **Events:** Menü geöffnet/geschlossen, Logo geladen

---

## Verwendung

```html
<x-header src="logo.svg" logo-size="40">
  <span slot="title">Meine App</span>
  <x-form slot="search">...</x-form>
  <button slot="actions">Theme</button>
  <x-link slot="nav" href="/docs">Docs</x-link>
</x-header>
```

**Hinweis:** `utility` bleibt als kompatibler Alias erhalten. Neue Apps sollten `search` für Suche und `actions` für Buttons, Toggle oder Status verwenden.

---

## Responsive Slot-Logik
- Desktop: Brand, Search, Actions und Menübutton stehen in einer stabilen Grid-Zeile.
- Tablet: Search belegt eine eigene Grid-Zeile, damit Eingabefelder nicht mit Actions clippen.
- Mobile: Brand, Actions und Menübutton bleiben in der ersten Zeile. Search belegt die zweite Zeile. Navigation bleibt im Drawer.
- Der Drawer wird als `fixed` Overlay positioniert. Dadurch bleibt die App-Shell stabil, und Route-Wechsel von geöffneter Navigation auf kurze Seiten erzeugen keine zusätzliche Dokumenthöhe.
- Slotted Navigation nutzt `max-width: 100%`, `min-width: 0`, `box-sizing: border-box` und `overflow-wrap: anywhere`, damit lange Menüpunkte nicht aus App-Shell-Containern herausragen.
- `header-layout-changed` wird emittiert, wenn der Header in den kompakten Zustand wechselt.

## Slot Alignment

`x-header` nutzt standardmäßig das Alignment `fixed-responsive-slot-grid`.

| Viewport | Slot-Mapping |
|----------|--------------|
| Desktop | `brand search actions trigger` |
| Tablet | `brand actions trigger` + `search search search` |
| Mobile | `brand actions trigger` + `search search search` |

Corporate Designs können dieses Mapping über CSS Custom Properties überschreiben, ohne die Komponente zu forken:

```css
x-header {
  --header-slot-template-areas: "brand search actions trigger";
  --header-tablet-slot-template-areas: "brand actions trigger" "search search search";
  --header-mobile-slot-template-areas: "brand actions trigger" "search search search";
  --header-mobile-actions-justify: flex-end;
  --header-mobile-actions-wrap: nowrap;
}
```

---

## Slots
| Name      | Beschreibung                                 |
|-----------|----------------------------------------------|
| `title`   | Bereich für den Titel/Branding               |
| `search`  | Suchformular oder Filter-Eingabe             |
| `actions` | Buttons, Theme Toggle, Status-Aktionen       |
| `utility` | Kompatibler Alias für Actions                |
| `nav`     | Navigationseinträge (Links, Menüs)           |
| `logo`    | Optional: eigenes Logo-Element               |

---

## Attribute
| Attribut      | Typ     | Beschreibung                        |
|---------------|---------|-------------------------------------|
| `src`         | String  | Logo-URL                            |
| `logo-size`   | String  | Größe des Logos (z.B. 40, 64px)     |
| `sticky`      | Boolean | Header bleibt oben fixiert           |
| `shadow`      | Boolean | Schatten aktivieren                  |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| `header-layout-changed` | Wird bei responsive Layoutwechseln ausgelöst |
| `menu-opened` | Wird mit Snapshot ausgelöst, wenn Menü öffnet |
| `menu-closed` | Wird mit Snapshot ausgelöst, wenn Menü schließt |
| `logo-loaded` | Wird ausgelöst, wenn Logo geladen    |

---

## API
- **Logo dynamisch setzen:** `element.setAttribute('src', 'logo.svg')`
- **Menü direkt steuern:** `header.toggleMenu(false, { source: 'router' })`
- **State-Integration:** Automatisch via xstate (`xheader-state-<id>`, z.B. Menü öffnen/schließen)
- **Menü programmatisch öffnen:**
  ```js
  xstate.set('xheader-state-<id>', { menuOpen: true });
  ```

---

## Beispiel: Dynamisch per JS

```js
const header = document.createElement('x-header');
header.setAttribute('src', 'logo.svg');
document.body.appendChild(header);
```

---

## Styling & Theming

```css
x-header {
  --header-bg: #fff;
  --header-fg: #222;
  --header-title-color: #222; /* Titel im Light Mode */
  --burger-color: #222;       /* Burger-Button-Striche im Light Mode */
  --header-menu-bg: #fff;
  --header-mobile-slot-template-areas: "brand actions trigger" "search search search";
  --header-drawer-inline-offset: 1rem;
  --header-drawer-content-max: none;
}
x-header[theme="dark"] {
  --header-bg: #222;
  --header-fg: #fff;
  --header-title-color: #fff; /* Titel im Dark Mode */
  --burger-color: #fff;       /* Burger-Button-Striche im Dark Mode */
}
```

---

## Accessibility
- Semantisches HTML, Landmark-Rollen (`role="banner"`)
- ARIA-Attribute für Menü, Burger-Button, Navigation
- Keyboard-Navigation (Tab, Escape)
- Fokus-Management im Overlay

---

## Changelog
- **18.07.2025:** Modernisierung, Theme-Variablen für Titel und Burger, Events, Accessibility, API, Doku aktualisiert
- **bis 07/2025:** Diverse Bugfixes, Responsive-Verbesserungen

---

*Letzte Aktualisierung: 18. Juli 2025*

## Layout Display Media UX Profil

`x-header` stellt ab `WP-E11-12` das Profil `xtend.component.layout-display-media-ux-profile.v1` bereit. Die Komponente ist als Docs-/App-Shell-Header RMT-schedulbar und nutzt den State-Key `xheader-state-<id>`.

- Profil-Getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.visible.mount`
- Events: `header-ready`, `menu-opened`, `menu-closed`
- Snapshot: `snapshot()`
- CSS Parts: `root`, `title`, `logo`, `search`, `actions`, `utility`, `trigger`, `drawer`, `nav`
