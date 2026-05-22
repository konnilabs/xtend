# xstatus - XTend Komponente

> **Siehe auch:** [xalert](./xalert.md), [xtoast](./xtoast.md), [xprogress](./xprogress.md), [xstate](./xstate.md)

## Uebersicht

`<x-status>` ist ein Fabric- und RMT-faehiges Status-Control aus `WP-E10-10`. Es stellt Scheduler-, Validierungs- und Systemrueckmeldungen als Live Region dar und bleibt bewusst klein genug, um in RMT-Shells als Feedback-Baustein genutzt zu werden.

## Verwendung

```html
<x-status id="route-status" type="warning" state="validating" message="Validation is running" dismissible busy>
  <span slot="label">Scheduler status</span>
</x-status>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `type` | String | `info`, `success`, `warning` oder `error` |
| `state` | String | fachlicher Status-Key |
| `message` | String | sichtbare Meldung |
| `dismissible` | Boolean | zeigt Schliessen-Aktion |
| `busy` | Boolean | setzt `aria-busy` |
| `polite` | Boolean | erzwingt polite Live Region |
| `label` | String | Label ohne Slot |

## Events

| Event | Detail |
|-------|--------|
| `status-changed` | `{ type, status, message, busy, source: 'x-status' }` |
| `status-dismissed` | `{ type, status, message, busy, source: 'x-status' }` |

## API

- `element.state`
- `element.setStatus(nextState)`
- `element.announce(message?)`
- `element.dismiss()`

## State, RMT und Fabric

`<x-status>` schreibt nach `xstatus-state-<id>`. RMT kann ueber `xtend.rmt.component-contract.v1` Status-Updates auf `feedback.status.update` schedulen, ohne XTend intern zu importieren. Der Kernel Boundary bleibt `no-rmt-kernel-import-of-xtend-types`; die UI-Komponente ist der Adapter nach aussen.

## A11y und Performance

Das Control nutzt `role="status"` fuer polite Meldungen und `role=alert` fuer kritische Warn-/Fehlerpfade. `scheduler-feedback`, `status-update` und `validation-feedback` sind als Screenreader-Signale dokumentiert. Das Performance-Profil ist `xtend.performance.component-profile.v1` mit `budgetClass: 'feedback-small'`, `lane: 'feedback'` und `hydrationPolicy: 'visible'`.

## Feedback Status UX ab WP-E11-09

`<x-status>` stellt `xtendFeedbackStatusUxProfile` mit `xtend.component.feedback-status-ux-profile.v1` bereit. Das Profil verbindet `status-changed`, `status-dismissed`, `xstatus-state-<id>`, `feedback.status.update`, Fabric-Lane `feedback`, A11y-Lane `a11y` und RMT Shell Authoring.

Die Komponente ist der gemeinsame Inline-Status fuer Forms, Scheduler, Route-Feedback und Diagnostics. Sie vermeidet reine Farbkommunikation, bleibt forced-colors-safe und kann per `announce()` explizit als Live-Region aktualisiert werden.
