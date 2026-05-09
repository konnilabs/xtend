# XTend Screenreader Signal Contract

- Status: Accepted
- Contract: `xtend.a11y.screenreader-signals.v1`
- Signal Record: `xtend.a11y.screenreader-signal.v1`
- Umsetzung: `a11y/screenreader-signals.js`
- Gate: `node scripts/run_xtend_tests.js screenreader-signals --json`
- Roadmap: `ER-WP-25`

## Entscheidung

XTend fuehrt Screenreader-relevante UI-Signale als eigenen Contract ein. Der Contract sitzt oberhalb einzelner Komponenten und unterhalb manueller A11y-Abnahme: Er macht `aria-live`, Statusregionen, Errorregionen und Announcements statisch und generatorseitig pruefbar.

Der Contract ist framework-neutral. XTend-Komponenten koennen ihn deklarieren, XTend-Scaffold kann ihn generieren und XTendRMT kann die entstehende A11y-Arbeit ueber Fabric/RMT-Schedules einordnen, ohne XTend in den Kernel einzubetten.

## Contract-Mindestform

```js
{
  schema: 'xtend.a11y.screenreader-signals.v1',
  componentRef: 'x-component',
  liveRegion: 'none' | 'polite' | 'assertive',
  signals: [
    {
      schema: 'xtend.a11y.screenreader-signal.v1',
      signal: 'status-announcement',
      kind: 'status',
      region: 'status',
      role: 'status',
      liveRegion: 'polite',
      fabric: {
        lane: 'a11y',
        fiberKind: 'a11y.announce',
        scheduleRef: 'a11y.user-blocking.announce'
      }
    }
  ],
  statusRegions: [],
  errorRegions: [],
  requiredAssertions: []
}
```

## Signalprofile

| Profil | Pflichtsignale | Region |
|--------|----------------|--------|
| `feedback` | `status-announcement`, `dismissal-announcement` | Statusregion, optional Errorregion |
| `form` | `validation-error-summary`, `submit-status` | Errorregion und Statusregion |
| `overlay` | `dialog-context`, `focus-return` | Dialogsemantik und Fokuskontext |
| `routing` | `route-change-announcement` | Statusregion |
| `stateful` | `state-change-summary` | Statusregion |

## Fabric/RMT Mapping

Screenreader-Announcements sind user-facing und laufen nicht als Hintergrundarbeit.

- Fabric-Lane: `a11y`
- Fiber-Kind: `a11y.announce`
- RMT-Schedule: `a11y.user-blocking.announce`
- Mapping-Contract: `xtend.fabric.rmt-lane-mapping.v1`

Die Kernel-Grenze bleibt erhalten: XTendRMT schedult Arbeit, XTend/Fabric fuehrt UI- und Announcement-Arbeit aus.

## Akzeptanz

- Feedback-, Form- und Overlay-Komponenten deklarieren `xtendScreenreaderSignals`.
- Scaffold-A11y-Profile enthalten `screenreader.signalContract`.
- Manifest-Plan enthaelt `screenreaderSignals`.
- Type-, Docs- und Fixture-Templates legen den Contract offen.
- `npm run test:screenreader-signals` ist der lokale Gate.

## Handoff

`ER-WP-26` hat Reduced-Motion und High-Contrast auf derselben A11y-by-design-Sprache gatebar gemacht.
