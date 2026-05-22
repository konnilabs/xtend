# xalert - XTend Komponente

## Uebersicht

`<x-alert>` ist die prominente Feedback-Komponente fuer laenger sichtbare Hinweise, Warnungen und Fehler. Im Unterschied zu Toasts kann ein Alert blockierend oder explizit schliessbar auftreten.

## Verwendung

```html
<x-alert type="error" closable overlay aria-label="Fehlerhinweis">
  Ein Fehler ist aufgetreten
</x-alert>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `type` | string | `info`, `success`, `warning`, `error` |
| `closable` | boolean | zeigt einen Schliessen-Button |
| `duration` | number | optionale Auto-Close-Dauer |
| `overlay` | boolean | zeigt den Alert als zentriertes Overlay |
| `aria-label` | string | Screenreader-Label |

## Events

| Event | Beschreibung |
|-------|--------------|
| `alert-shown` | nach dem Anzeigen des Alerts |
| `alert-dismissed` | nach dem Schliessen des Alerts |

## State-Contract

Die Instanz spiegelt ihren Zustand kompatibel in `xstate`:

- `xtend.component.x-alert.<id>`
- `xalert-state-<id>`

Das Event-Detail enthaelt unter anderem:

```js
{
  id: 'alert-abc123',
  type: 'error',
  closable: true,
  overlay: true,
  dismissed: false,
  reason: 'connected'
}
```

## Runtime-Contract

- API-gemanagte Alerts werden aggregiert in `xstate.get('ui').alerts`
- die Instanz selbst fuehrt ihren Lifecycle ueber `alert-shown` und `alert-dismissed`
- API und Komponente sprechen keine separaten Close-Pfade mehr

## Feedback Status UX ab WP-E11-09

`<x-alert>` stellt `xtendFeedbackStatusUxProfile` mit `xtend.component.feedback-status-ux-profile.v1` bereit. Das Profil beschreibt `x-alert` als laenger sichtbare Feedback-Shell mit `alert-shown`, `alert-dismissed`, `xalert-state-<id>`, `a11y.announce`, Fabric-Lane `a11y` und RMT Shell Authoring.

Fehler und Warnungen nutzen assertive Live Regions; neutrale und erfolgreiche Hinweise bleiben polite. Event-Details enthalten `source: 'x-alert'` und `stateKey`, sodass Form-, Router- oder RMT-Adapter Alerts konsistent schedulen und diagnostizieren koennen.

## Kontrastfarben

`<x-alert>` nutzt solide Kontrastfarben ohne Farbverlaeufe. Die Varianten `info`, `success`, `warning` und `error` setzen jeweils eigene Tokens fuer Hintergrund, Text, Border und Accent, damit Alerts in Light- und Dark-Mode lesbar bleiben und ihre Signalwirkung behalten.

Die wichtigsten Theme-Tokens sind:

- `--xtend-alert-info-bg`, `--xtend-alert-info-fg`, `--xtend-alert-info-border`, `--xtend-alert-info-accent`
- `--xtend-alert-success-bg`, `--xtend-alert-success-fg`, `--xtend-alert-success-border`, `--xtend-alert-success-accent`
- `--xtend-alert-warning-bg`, `--xtend-alert-warning-fg`, `--xtend-alert-warning-border`, `--xtend-alert-warning-accent`
- `--xtend-alert-error-bg`, `--xtend-alert-error-fg`, `--xtend-alert-error-border`, `--xtend-alert-error-accent`

Fuer Dark-Mode koennen dieselben Tokens mit dem Suffix `-dark` ueberschrieben werden, etwa `--xtend-alert-error-bg-dark`.

## Hinweise

- Alerts sind fuer inhaltlich wichtigere, laenger sichtbare oder blockierende Rueckmeldungen gedacht
- `window.XAlert.show()` ist der bevorzugte Einstieg fuer API-gemanagte Alerts
- fuer kurze, nicht blockierende Hinweise ist `x-toast` die passendere Komponente
