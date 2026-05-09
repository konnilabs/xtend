# Component UX App Authoring

Docs Contract: `xtend.docs.component-ux-app-authoring.v1`

Dieser Guide richtet sich an App-Autorinnen und App-Autoren, die XTend-Komponenten in RMT-first Apps einsetzen. Die App kann vollstaendig in RMT templated werden; XTend liefert lokale Web Components und XTendRMT orchestriert Shell, Routes, Templates, Schedules und Diagnostics.

## Grundregeln

- Die App Shell rendert `shell-first`.
- XTend-Komponenten werden als `xtend.component` Records beschrieben.
- XRouter wird ueber den Router-Adapter angebunden.
- Templates verwenden bevorzugt `dom_descriptor`.
- Events werden als `dom-event-to-rmt-command` gebunden.
- Hydration, Fabric-Lane, Fiber und Diagnostics bleiben schedulebare Metadata.
- Der RMT-Kernel importiert keine XTend-Klassen oder XTend-Typen.

Boundary:

```text
no-rmt-kernel-import-of-xtend-types
```

## Minimaler Component Record

```json
{
  "id": "settings.feedback.status",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-status",
  "props": {
    "type": "success",
    "label": "Scheduler",
    "message": "Ready"
  },
  "a11y": {
    "role": "status",
    "live": "polite"
  },
  "style": {
    "theme": "dark",
    "density": "compact"
  },
  "schedule": "component.visible.mount",
  "fabric": {
    "lane": "visible",
    "fiber": "component.mount"
  }
}
```

## App-Shell-Muster

```json
{
  "manifest": {
    "metadata": {
      "contractVersion": "xtend.rmt.first-class-app-authoring.v1",
      "renderMode": "shell-first"
    }
  },
  "adapters": [
    { "id": "xtend.component", "kind": "component" },
    { "id": "xtend.xrouter", "kind": "router" }
  ],
  "routes": [
    { "id": "dashboard", "path": "/", "template": "dashboard.page" }
  ],
  "templates": [
    {
      "id": "dashboard.page",
      "mode": "dom_descriptor",
      "children": [
        { "component": "settings.feedback.status" }
      ]
    }
  ],
  "schedules": [
    {
      "id": "dashboard.visible.mount",
      "lane": "visible",
      "endpoint": "xtend.component.mount",
      "metadata": {
        "theme": "dark",
        "density": "compact",
        "motion": "reduced-motion"
      }
    }
  ]
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
