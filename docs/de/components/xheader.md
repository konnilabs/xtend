# xheader – XTend Komponente

> **Siehe auch:** [xfooter](./xfooter.md), [xtheme](./xtheme.md)

## Übersicht

`<x-header>` ist eine vielseitige, barrierearme Header-Komponente für Branding, Navigation und flexible Layouts. Sie unterstützt Logo, Titel, Search-, Actions-/Utility- und Navigationsslots, Theming, State-Integration und mehrere Menu Presentation Modes für Enterprise App-Shells.

---

## Features
- Optionales Logo (src-Attribut)
- Slot-System für Titel, Suche, Actions, Legacy-Utility und Navigation
- Sticky-Header
- State-Integration via xstate
- Theming via CSS Custom Properties (voll themefähig)
- **Responsives Verhalten:** Header-Inhalte laufen über ein Slot-Grid. Suche und Actions umbrechen auf kleinen Displays kontrolliert, Navigation nutzt den konfigurierten Menu Presentation Mode.
- **Slot Alignment:** Brand, Actions und Menü-Trigger bleiben bei schmalen Viewports in einer festen Kopfzeile; Search liegt darunter und verhindert dadurch verschobene Action-Buttons.
- **Menu Presentation Modes:** `drawer`, `side-panel`, `popover`, `fullscreen` und `inline-main` decken Shell-, App- und Portal-Navigation ab.
- **Full-Width-Drawer:** Der Default `drawer` rendert weiterhin als fixed Overlay über die verfügbare Seitenbreite und verlängert den Dokument-Scrollbereich nicht.
- **Overflow-sichere Navigation:** Direkte `x-link`-Einträge und komplexe `[data-menu-shell]`-Menüs bleiben im Menü-Surface innerhalb ihrer Container.
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

## Menu Presentation Modes

`menu-mode` steuert, wie die Navigation sichtbar wird. Ohne neues Attribut bleibt `drawer` aktiv und damit das bisherige Full-Width-Drawer-Verhalten kompatibel.

| Mode | Verhalten | A11y-Verhalten |
|------|-----------|----------------|
| `drawer` | Fixed Overlay unter dem Header, standardmäßig full-width | Navigation, Escape, Outside Click, Focus Return |
| `side-panel` | Seitliches Panel über `menu-placement="start"` oder `end` | optional modal per `menu-modal`, dann Focus Trap und Backdrop |
| `popover` | Kompaktes Menü nahe Trigger | nicht modal, Escape und Outside Click |
| `fullscreen` | Vollflächige Navigation | modal, Backdrop, Focus Trap, Escape und Focus Return |
| `inline-main` | Menü im Header-Dokumentfluss | keine Overlay-Falle, sauberer Navigation-Landmark |

```html
<x-header
  menu-mode="side-panel"
  menu-placement="end"
  menu-modal
  menu-width="min(32rem, 92vw)"
  menu-max-height="calc(100dvh - 2rem)"
  menu-align="stretch">
  <span slot="title">Enterprise Shell</span>
  <x-link slot="nav" href="/workbench">Workbench</x-link>
</x-header>
```

`menu-open` kann deklarativ gesetzt werden. Programmatisch bleibt `toggleMenu(true | false, { source })` die stabile API. `snapshot()` liefert `menuMode`, `menuPlacement`, `menuModal`, `menuBreakpoint`, `menuWidth`, `menuMaxHeight` und `menuAlign`; `drawerMode: 'fixed-full-width-overlay'` bleibt als Legacy-Alias erhalten.

---

## Responsive Slot-Logik
- Desktop: Brand, Search, Actions und Menübutton stehen in einer stabilen Grid-Zeile.
- Tablet: Search belegt eine eigene Grid-Zeile, damit Eingabefelder nicht mit Actions clippen.
- Mobile: Brand, Actions und Menübutton bleiben in der ersten Zeile. Search belegt die zweite Zeile. Navigation nutzt den konfigurierten Menu Presentation Mode.
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
| `menu-mode`   | `drawer`, `side-panel`, `popover`, `fullscreen`, `inline-main` | Menu Presentation Mode |
| `menu-placement` | `start`, `end`, `top`, `bottom` | bevorzugte Position |
| `menu-modal`  | Boolean | Modalität mit Backdrop und Focus Trap |
| `menu-open`   | Boolean | Menü deklarativ öffnen |
| `menu-breakpoint` | String | Preset (`sm`, `md`, `lg`, `xl`) oder CSS Length |
| `menu-width`  | String | Breite für Panel/Popover |
| `menu-max-height` | String | Höhenbegrenzung des Menü-Surfaces |
| `menu-align`  | `start`, `center`, `end`, `stretch` | Ausrichtung im Menü-Surface |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| `header-layout-changed` | Wird bei responsive Layoutwechseln ausgelöst |
| `menu-before-open` | Cancelable Event vor dem Öffnen |
| `menu-before-close` | Cancelable Event vor dem Schließen |
| `menu-opened` | Wird mit Snapshot ausgelöst, wenn Menü öffnet |
| `menu-closed` | Wird mit Snapshot ausgelöst, wenn Menü schließt |
| `menu-mode-changed` | Wird bei Wechsel von `menu-mode` ausgelöst |
| `menu-placement-changed` | Wird bei Wechsel von `menu-placement` ausgelöst |
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
  --xtend-header-surface: #fff;
  --xtend-header-text: #222;
  --xtend-header-border-color: #d9dde5;
  --xtend-header-menu-surface: #fff;
  --xtend-header-menu-width: min(30rem, 92vw);
  --xtend-header-menu-max-height: min(72dvh, 820px);
  --xtend-header-menu-backdrop: rgba(15, 23, 42, 0.45);
  --header-bg: var(--xtend-header-surface);
  --header-fg: var(--xtend-header-text);
  --header-title-color: #222; /* Titel im Light Mode */
  --burger-color: #222;       /* Burger-Button-Striche im Light Mode */
  --header-menu-bg: var(--xtend-header-menu-surface);
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
- Fokus-Management im Overlay; `fullscreen` und `menu-modal` nutzen Focus Trap, Backdrop und Focus Return

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
- Events: `header-ready`, `menu-before-open`, `menu-before-close`, `menu-opened`, `menu-closed`, `menu-mode-changed`, `menu-placement-changed`
- Snapshot: `snapshot()`
- CSS Parts: `root`, `brand`, `title`, `logo`, `search`, `actions`, `utility`, `trigger`, `trigger-icon`, `menu`, `menu-surface`, `menu-content`, `nav`, `backdrop`
- Legacy CSS Parts: `drawer` und `drawer-surface` bleiben als Alias für `menu` und `menu-surface` erhalten.

## ECH-WP-07 Token-Tabelle und signatureDesign

`signatureDesign`: Praezise Enterprise App-Shell mit ruhiger Flaechenhierarchie, dichter Slot-Rhythmik, hochwertigem Menue-Surface und brand-neutraler Premium-Wirkung. Das Default-Design soll eigenstaendig wirken, ohne eine One-Brand-Optik zu erzwingen.

| Token | Zweck |
| --- | --- |
| `--xtend-layout-surface` | Shell- und Menueflaeche |
| `--xtend-layout-text` | Header-, Brand- und Navigationsfarbe |
| `--xtend-layout-border-color` | Header-, Trigger- und Menuekanten |
| `--xtend-layout-radius` | Header- und Menue-Radius |
| `--xtend-layout-elevation` | Header- und Menue-Schatten |
| `--xtend-layout-spacing` | Header-Padding |
| `--xtend-layout-gap` | Slot- und Menueabstand |
| `--xtend-layout-font-family` | Shell-Typografie |
| `--xtend-layout-font-size` | Brand-/Navigationstypografie |
| `--xtend-layout-media-radius` | Logo- und Medienradius |
| `--xtend-layout-focus-ring` | Tastaturfokus |
| `--xtend-layout-grid-min` | Slot-Grid-Untergrenze |
| `--xtend-layout-content-max` | Menuebreite und Content-Grenze |

## ECH-WP-07 Fremdtheme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-header {
  --xtend-layout-surface: #f6f2ea;
  --xtend-layout-text: #17231f;
  --xtend-layout-border-color: rgba(23, 35, 31, 0.22);
  --xtend-layout-radius: 0.35rem;
  --xtend-layout-elevation: 0 14px 34px rgba(23, 35, 31, 0.14);
  --xtend-layout-spacing: 0.9rem;
  --xtend-layout-gap: 0.7rem;
  --xtend-layout-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-layout-font-size: 1rem;
  --xtend-layout-media-radius: 0.2rem;
  --xtend-layout-focus-ring: 3px solid #8f4f2a;
  --xtend-layout-grid-min: minmax(0, 1fr);
  --xtend-layout-content-max: 24rem;
}
```

## ECH-WP-09 Token-Tabelle und Navigation States

`signatureDesign`: `x-header` verbindet eine hochwertige Enterprise-App-Shell mit sichtbar stabiler Navigation. Active/Current/Selected, Hover, Focus und Disabled gelten fuer slotted `nav`-Eintraege in `drawer`, `side-panel`, `popover`, `fullscreen` und `inline-main`.

| Token | Zweck |
| --- | --- |
| `--xtend-nav-surface` | Menue- und Nav-Surface |
| `--xtend-nav-text` | Nav-Text |
| `--xtend-nav-border-color` | Menue- und Nav-Kante |
| `--xtend-nav-radius` | Nav-Radius |
| `--xtend-nav-gap` | Abstand im Menue |
| `--xtend-nav-font-family` | Navigationstypografie |
| `--xtend-nav-font-size` | Navigationstextgroesse |
| `--xtend-nav-active-surface` | Active/Current/Selected Flaeche |
| `--xtend-nav-active-text` | Active/Current/Selected Text |
| `--xtend-nav-current-indicator` | nicht farb-only Current-Indikator |
| `--xtend-nav-hover-surface` | Hover-Flaeche |
| `--xtend-nav-focus-ring` | Tastaturfokus |
| `--xtend-nav-disabled-opacity` | Disabled-Dimmung |

## ECH-WP-09 Keyboard-Verhalten

Der Menue-Trigger ist ein Icon Control mit `part="trigger-icon control icon"`. Overlay-Modi unterstuetzen Escape, Outside Click, Focus Return und bei `menu-modal` Focus Trap. Slotted Navigation kann `aria-current="page"`, `aria-selected="true"`, `active`, `disabled` oder `aria-disabled="true"` tragen. Verschachtelte Navigation muss Disclosure Icons als Icon Controls, z.B. `part="disclosure-icon control icon"`, auszeichnen.

## ECH-WP-09 Fremdtheme

```css
[data-xtend-nav-theme="enterprise-foreign"] x-header {
  --xtend-nav-surface: #f7f4ee;
  --xtend-nav-text: #17231f;
  --xtend-nav-border-color: rgba(23, 35, 31, 0.22);
  --xtend-nav-radius: 0.35rem;
  --xtend-nav-gap: 0.45rem;
  --xtend-nav-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-nav-font-size: 0.98rem;
  --xtend-nav-active-surface: #173f35;
  --xtend-nav-active-text: #fffaf0;
  --xtend-nav-current-indicator: #b56b35;
  --xtend-nav-hover-surface: rgba(181, 107, 53, 0.14);
  --xtend-nav-focus-ring: 3px solid #b56b35;
  --xtend-nav-disabled-opacity: 0.44;
}
```
