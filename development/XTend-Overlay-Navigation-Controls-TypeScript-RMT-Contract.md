# XTend Overlay Navigation Controls TypeScript RMT Contract

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.epic10.overlay-navigation-controls.v1`
- Workpackage: `WP-E10-11`
- Komponenten: `x-tooltip`, `x-popover`, `x-drawer`

## Zweck

Dieser Contract beschreibt die dritte Epic-10-Komponentenwelle. Die Komponenten ergaenzen die TypeScript-first Component Platform um leichte Hilfe-Overlays, interaktive Popover und App-Shell-Drawer, ohne XTend-Logik in den RMT Kernel einzubetten.

## Gemeinsame Regeln

- Source-of-Truth liegt unter `src/components/<tag>/`.
- Runtime liegt als lokales ESM-Artefakt unter `components/`.
- Public Types liegen als `.d.ts` Dateien unter `components/`.
- RMT Authoring nutzt `xtend.rmt.component-contract.v1`, `adapter: xtend.component`, `templateMode: dom_descriptor` und `eventBindingMode: dom-event-to-rmt-command`.
- Fabric Boundary ist `@xtend-fabric` mit Lifecycle Telemetry fuer `mount`, `hydrate`, `render`, `update`, `event`, `error` und `unmount`.
- Kernel Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Komponentenmatrix

| Komponente | Profil | Lane | Hydration | Events | A11y-Kern |
|------------|--------|------|-----------|--------|-----------|
| `x-tooltip` | `overlay`, `feedback` | `visible` | `idle` | `tooltip-opened`, `tooltip-closed` | `role=tooltip`, `aria-describedby`, Escape |
| `x-popover` | `overlay`, `interactive` | `user-blocking` | `visible` | `popover-opened`, `popover-closed` | `role=dialog`, `aria-modal`, Focus Return |
| `x-drawer` | `overlay`, `routing` | `visible` | `lazy` | `drawer-opened`, `drawer-closed`, `drawer-route-selected` | `role=dialog`, Focus Trap, route-change-announcement |

## RMT Authoring Beispiel

```json
{
  "id": "shell.navigation",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-drawer",
  "attributes": {
    "placement": "left",
    "modal": true,
    "label": "App navigation",
    "route-aware": true
  },
  "slots": {
    "header": "Navigation",
    "default": [
      { "tag": "x-link", "attributes": { "href": "/dashboard" }, "slots": { "default": "Dashboard" } }
    ]
  },
  "events": {
    "drawer-route-selected": {
      "command": "navigation.routeSelected"
    }
  },
  "schedule": "component.lazy.hydrate",
  "fabric": {
    "lane": "visible",
    "fiber": "component.hydrate",
    "telemetry": true
  }
}
```

## Abnahme

- `components/manifest.json` enthaelt `x-tooltip`, `x-popover` und `x-drawer`.
- Alle drei Komponenten besitzen Runtime, TypeScript Source, Public Types, Docs, Fixture und Component-Suite.
- `tests/components/component_suite.js` aggregiert die drei Suites.
- `catalog/component-catalog-coverage.js` klassifiziert alle drei als `enterprise-ready`.
- `tests/catalog/component_regression_priority_suite.js` nimmt die drei Komponenten in die P0 browserkritische Overlay-/Routing-Welle auf.
