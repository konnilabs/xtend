# xlink - XTend Komponente

## Uebersicht

`<x-link>` ist die deklarative Link-Komponente fuer XTend-SPAs. Sie arbeitet mit `<x-router>` zusammen, erkennt Hash- und History-Mode und haelt den Active-State auch bei programmatischer Navigation aktuell.

## Verwendung

```html
<x-link href="/docs">Zur Dokumentation</x-link>
<x-link href="https://example.com">Externer Link</x-link>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `href` | string | Zielpfad oder externe URL |
| `active` | boolean | wird gesetzt, wenn der Link aktuell aktiv ist |
| `state` | string | optionales JSON fuer `history.pushState()` |

## Events

| Event | Beschreibung |
|-------|--------------|
| `before-navigate` | cancelable, vor der Navigation |
| `after-navigate` | nach erfolgreicher Navigation |

`before-navigate` und `after-navigate` liefern:

```js
{
  href: '/docs',
  mode: 'history',
  state: { ... },
  source: 'x-link',
  stateKey: 'xlink-active-link-123',
  scheduleRef: 'ui.user-blocking.navigation'
}
```

## Contract

- interne Links werden normalisiert und spa-konform navigiert
- externe Links behalten Standardverhalten und erhalten automatisch `target="_blank"` plus `rel="noopener noreferrer"`
- Active-State wird bei `popstate`, `hashchange`, `x-navigate` und `xrouter-after-navigate` aktualisiert
- aktive Links spiegeln `aria-current="page"` und `xlink-active-<id>`
- Enter und Space aktivieren denselben Navigationspfad
- lange Labels und slotted Icon-/Text-Inhalte bleiben overflow-sicher in engen Menüs, Sidebars und Header-Drawern

## Navigation Routing UX Profil

`<x-link>` stellt `xtendNavigationRoutingUxProfile` mit `xtend.component.navigation-routing-ux-profile.v1` bereit. Das Profil beschreibt `x-link` als Router-Link mit `before-navigate`, `after-navigate`, `x-navigate`, `xlink-active-<id>`, `ui.user-blocking.navigation`, Active State, Keyboard-Aktivierung, Fabric-Lane `user-blocking` und RMT Shell Authoring.

Die Link-Komponente delegated Route Announcements an `x-router`, bleibt aber selbst fuer sichtbaren Active State, Keyboard-Aktivierung und sichere externe Links verantwortlich.

## Overflow-Sicherheit

`x-link` ist fuer App-Shell-Navigation, Menues und Sidebars overflow-sicher. Der Host begrenzt sich auf den verfuegbaren Container, slotted Inhalte erhalten `min-width: 0`, und lange Labels duerfen umbrechen. Fuer bewusst einzeilige Links kann `--xtend-link-white-space: nowrap` gesetzt werden.

## Hinweise

- der Router-Mode wird am ersten gefundenen `<x-router>` erkannt
- gleiche Zielpfade fuehren keinen redundanten URL-Wechsel aus
- `x-link` nutzt denselben Navigationsvertrag wie `x-router`

## ECH-WP-09 Token-Tabelle und Navigation States

`signatureDesign`: `x-link` ist der kompakte Enterprise-Router-Link mit sichtbarem Current-Indikator und tokenisiertem Active/Disabled-Verhalten. Active/Current/Selected, Hover, Focus und Disabled muessen auch in dichten Headern, Sidebars und Menues lesbar bleiben.

| Token | Zweck |
| --- | --- |
| `--xtend-nav-surface` | Link-Surface |
| `--xtend-nav-text` | Link-Text |
| `--xtend-nav-border-color` | geteilte Navigationskante |
| `--xtend-nav-radius` | Link-Radius |
| `--xtend-nav-gap` | Abstand zwischen Icon und Label |
| `--xtend-nav-font-family` | Link-Typografie |
| `--xtend-nav-font-size` | Link-Textgroesse |
| `--xtend-nav-active-surface` | Active/Current/Selected Flaeche |
| `--xtend-nav-active-text` | Active/Current/Selected Text |
| `--xtend-nav-current-indicator` | nicht farb-only Current-Indikator |
| `--xtend-nav-hover-surface` | Hover-Flaeche |
| `--xtend-nav-focus-ring` | Tastaturfokus |
| `--xtend-nav-disabled-opacity` | Disabled-Dimmung |

## ECH-WP-09 Keyboard-Verhalten

`Enter` und `Space` aktivieren interne Links ueber denselben Navigationspfad wie Click. Disabled Links entfernen den internen `href`, setzen `aria-disabled="true"` und sind nicht tastaturaktivierbar. Active/Current wird ueber `aria-current="page"` gespiegelt; Composite-Navigation kann `aria-selected="true"` auf dem Host ergaenzen.

## ECH-WP-09 Fremdtheme

```css
[data-xtend-nav-theme="enterprise-foreign"] x-link {
  --xtend-nav-surface: transparent;
  --xtend-nav-text: #17231f;
  --xtend-nav-border-color: transparent;
  --xtend-nav-radius: 0.3rem;
  --xtend-nav-gap: 0.4rem;
  --xtend-nav-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-nav-font-size: 0.96rem;
  --xtend-nav-active-surface: rgba(181, 107, 53, 0.16);
  --xtend-nav-active-text: #173f35;
  --xtend-nav-current-indicator: #b56b35;
  --xtend-nav-hover-surface: rgba(181, 107, 53, 0.1);
  --xtend-nav-focus-ring: 3px solid #b56b35;
  --xtend-nav-disabled-opacity: 0.44;
}
```
