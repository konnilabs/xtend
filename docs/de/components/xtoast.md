# xtoast - XTend Komponente

## Uebersicht

`<x-toast>` ist die kompakte Feedback-Komponente fuer temporaere Hinweise. Toasts sind nicht blockierend, leben kurz und werden im XTend-Core bevorzugt ueber `window.XToast` erzeugt.

## Verwendung

```html
<x-toast type="success" duration="3000">Gespeichert</x-toast>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `type` | string | `info`, `success`, `warning`, `error` |
| `duration` | number | Dauer in Millisekunden, `0` deaktiviert Auto-Close |

## Events

| Event | Beschreibung |
|-------|--------------|
| `toast-shown` | nach dem Einfuegen des Toasts |
| `toast-dismissed` | nach dem Schliessen des Toasts |

Die Events liefern:

```js
{
  id: 'toast-abc123',
  message: 'Gespeichert',
  type: 'success',
  duration: 3000,
  reason: 'timeout'
}
```

## Runtime-Contract

- API-gemanagte Toasts werden aggregiert in `xstate.get('ui').toasts`
- die Komponente selbst stellt den Lifecycle ueber Events bereit
- der versteckte globale Helper-Pfad lebt in `api.js`, nicht mehr in der Komponente
- der API-Toast-Stack nutzt `#xtoast-container` als viewport-sichere Surface mit `width: min(24rem, calc(100vw - 2rem))`

## Layout

`window.XToast.show()` legt API-gemanagte Toasts in einem frameworkeigenen Stack ab. Dieser Stack bleibt rechts unten im Viewport, nutzt Safe-Area-Abstaende und dehnt Toasts innerhalb der verfuegbaren Breite, statt sie ueber den rechten Viewport-Rand hinauslaufen zu lassen.

Direkt platzierte `<x-toast>` Elemente sind ebenfalls containerfreundlich: die Komponente nutzt `max-width: 100%`, bricht lange Inhalte um und reserviert Platz fuer den Close-Button.

## Feedback Status UX ab WP-E11-09

`<x-toast>` stellt `xtendFeedbackStatusUxProfile` mit `xtend.component.feedback-status-ux-profile.v1` bereit. Das Profil beschreibt `x-toast` als kurzlebige Feedback-Shell mit `toast-shown`, `toast-dismissed`, `xtoast-state-<id>`, `a11y.announce`, Fabric-Lane `a11y` und RMT Shell Authoring.

Timeouts liefern `reason: 'timeout'`; manuelle Dismiss-Pfade liefern `reason: 'button'` oder `manual`. Event-Details enthalten `source: 'x-toast'`, `stateKey` und `dismissed`, damit Status- und Diagnostik-Lanes Toast-Lifecycles eindeutig zuordnen koennen.

## Hinweise

- Toasts sind semantisch fuer kurzlebige, nicht blockierende Hinweise gedacht
- fuer laenger sichtbare oder inhaltlich wichtigere Meldungen ist `x-alert` die richtige Komponente
- `window.XToast.show()` ist der bevorzugte Einstieg fuer API-gemanagte Toasts
