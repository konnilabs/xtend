# Component UX App Authoring

Docs Contract: `xtend.docs.component-ux-app-authoring.v1`

Dieser Guide richtet sich an App-Autorinnen und App-Autoren, die
XTend-Komponenten in RMT-first Apps einsetzen. Die App kann vollstaendig in RMT
vNext geschrieben werden; XTend liefert lokale Web Components und XTendRMT
orchestriert Shell, Routes, Templates, Schedules und Diagnostics.

## Grundregeln

- Die App Shell rendert `shell-first`.
- XTend-Komponenten werden in vNext als `surface ... component x-*`
  beschrieben und in `xtend.component` Records kompiliert.
- XRouter wird ueber den Router-Adapter angebunden.
- Templates verwenden bevorzugt `dom_descriptor` als generierten Output.
- Events werden mit `on ... -> action ...` gebunden.
- Hydration, Fabric-Lane, Fiber und Diagnostics bleiben schedulebare Metadata.
- Der RMT-Kernel importiert keine XTend-Klassen oder XTend-Typen.

Boundary:

```text
no-rmt-kernel-import-of-xtend-types
```

## Minimaler Component-Surface

```rmt
template settings.feedback {
  state settings.feedback.status type string initial "ready"

  selector settings.feedback.view from state settings.feedback.status {
    output StatusView
  }

  portal surface.root root "#settings-root" layer surface

  surface settings.feedback.status kind card component x-status {
    source selector settings.feedback.view
    portal surface.root

    lane visible weight 80 {
      mount x-status
      hydrate feedback-status from selector settings.feedback.view
    }
  }
}
```

Der Output enthaelt weiterhin `xtend.component`, A11y-, Style-, Schedule- und
Fabric-Metadaten. Geschrieben wird aber die vNext-Quelle.

## App-Shell-Muster

```rmt
template dashboard.app {
  state dashboard.theme type string initial "dark"
  state dashboard.density type string initial "compact"
  state dashboard.motion type string initial "reduced-motion"

  action dashboard.refresh {
    emit dashboard.refresh.requested with action dashboard.refresh
  }

  portal surface.root root "#app-root" layer surface

  surface dashboard.page kind page component x-section {
    source state dashboard.theme
    portal surface.root

    lane visible weight 80 {
      hydrate dashboard-shell from endpoint xtendrmt.route.render
      hydrate settings-feedback-status from endpoint xtendrmt.component.mount
    }

    on click target refresh-button -> action dashboard.refresh {
      payload theme from state.dashboard.theme
      payload density from state.dashboard.density
      payload motion from state.dashboard.motion
    }
  }
}
```

## UX-Regeln fuer Apps

| Dimension | App-Regel |
| --- | --- |
| Shell | Hostseite stellt nur den Root, Loader, Manifest und RMT Runtime bereit |
| Routing | Routen kommen aus RMT und werden ueber XRouter aktiviert |
| Theme | `light`, `dark`, `high-contrast` und `forced-colors` bleiben App-States |
| Motion | `reduced-motion` muss bis in Overlays, Feedback und Media sichtbar sein |
| Density | `comfortable`, `compact` und `dense` duerfen Layout nicht brechen |
| A11y | Route Announcements, Live Regions, Error Regions und Focus Restore sind Teil der App |
| Performance | Hydration Policies und Fabric-Lanes sind Schedule-Daten, keine Host-Sonderlogik |

## Gates fuer App-Autoren

```bash
node scripts/run_xtend_tests.js rmt-first-class-app --json
node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json
node scripts/run_xtend_tests.js component-ux-browser-smokes --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
node scripts/run_xtend_tests.js browser --json
```

Fuer PRs ist der gemeinsame schnelle Pfad:

```bash
npm run test:pr
```

## Wann ein App-Pfad reif ist

Ein RMT-first XTend App-Pfad gilt als reif, wenn:

- die Shell nicht manuell aus statischem XTend-Markup zusammengesetzt wird,
- Komponenten ueber `xtend.component` Records kommen,
- Route, Theme, Motion, Density und Hydration in RMT sichtbar sind,
- Browser-Smokes die Kernjourneys abdecken,
- die Component Shell Theme Matrix nicht bricht,
- keine externen CDN- oder Importmap-Abhaengigkeiten eingefuehrt werden.
