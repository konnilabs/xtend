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
