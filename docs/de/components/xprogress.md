# xprogress - XTend Komponente

> **Siehe auch:** [xstatus](./xstatus.md), [xspinner](./xspinner.md), [xstate](./xstate.md)

## Uebersicht

`<x-progress>` ist das RMT-first Progress-Control aus `WP-E10-10`. Es visualisiert determinate und indeterminate Fortschritte, meldet Fortschrittsereignisse an Fabric/Telemetry und kann in Shell-first RMT-Templates fuer Hydration, Upload, Route- oder Worker-Aufgaben eingesetzt werden.

## Verwendung

```html
<x-progress id="route-progress" value="64" max="100" status="Hydrating route" busy>
  <span slot="label">Route hydration</span>
</x-progress>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `value` | Number | aktueller Wert |
| `max` | Number | Maximalwert |
| `label` | String | Label ohne Slot |
| `status` | String | Statusmeldung fuer Screenreader und UI |
| `indeterminate` | Boolean | aktiviert unbestimmten Fortschritt |
| `busy` | Boolean | setzt `aria-busy` |

## Events

| Event | Detail |
|-------|--------|
| `progress-changed` | `{ value, max, percent, source: 'x-progress' }` |
| `progress-complete` | `{ value, max, percent: 100, source: 'x-progress' }` |

## API

- `element.value`
- `element.max`
- `element.percent`
- `element.setProgress(value)`
- `element.complete()`
- `element.reset()`

## State, RMT und Fabric

`<x-progress>` schreibt nach `xprogress-value-<id>` und ist fuer `feedback.progress.update` vorbereitet. Die RMT-Metadaten nutzen `xtend.rmt.component-contract.v1`, `adapter: 'xtend.component'` und `kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'`. Dadurch kann RMT Progress als scheduled UI-Feedback behandeln, waehrend XTend die Web Component rendert.

## A11y und Performance

Das Control nutzt `role="progressbar"`, `aria-valuenow`, `aria-valuemax`, `aria-valuetext`, `aria-busy` und eine polite Statusregion. Das Performance-Profil ist `xtend.performance.component-profile.v1` mit `budgetClass: 'feedback-small'`, `lane: 'background'` und `hydrationPolicy: 'visible'`.

## Feedback Status UX ab WP-E11-09

`<x-progress>` stellt `xtendFeedbackStatusUxProfile` mit `xtend.component.feedback-status-ux-profile.v1` bereit. Das Profil beschreibt Progress als scheduled Feedback mit `progress-changed`, `progress-complete`, `xprogress-value-<id>`, `feedback.progress.update`, Fabric-Lane `background`, A11y-Lane `a11y` und RMT Shell Authoring.

Determinate und indeterminate Progress-Zustaende duerfen nicht nur ueber Farbe oder Animation vermittelt werden. `aria-valuetext`, die Statusregion und Reduced-Motion-Regeln bleiben deshalb Teil der Public UX-Oberflaeche.
