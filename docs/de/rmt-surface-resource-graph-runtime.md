# RMT Surface Resource Graph Runtime

RMT Surfaces und Resources bilden einen nachvollziehbaren Ownership-Graphen. Eine Surface benennt, wo UI erscheint, eine Resource benennt, welche Daten sie besitzt, und Lifecycle-Regeln definieren, wann diese Daten laden, Fehler melden und freigegeben werden.

## Öffentliche Bausteine

| Record | Rolle |
| --- | --- |
| `surfaces` | Region-, Popover-, Overlay- oder Portal-Ownership plus Template, Focus und Stack Policy |
| `routes` | Route Lifecycle zu Surface Entry |
| `dataSources` | adaptereigene Eingangsdaten |
| `resources` | Query Lifecycle, Cache Policy, Loading/Error State und Release-Verhalten |
| `selectors` | abgeleitete sichtbare Daten für Collections oder Search Results |
| `sourceMap` | Traceability von RMT-Source-Pfaden zu Runtime-IDs |

Surface- und Resource-Ownership wird von Dashboard-Flows, Command/Search-Popovers und Browser-Lab-Nachweisen geteilt.

Compatibility Anchors für ältere Runtime-Checks:

```txt
runtime contract: xtend.epic18.rmt-surface-resource-graph-runtime.v1
Keyed Surface Repeater: surface instances are keyed before resource ownership is resolved
Portal Layer Stack: portal, overlay and surface owners share cleanup diagnostics
next workpackage: WP-E18-11
```

## Region- und Popover-Surfaces

Eine vollständige App Recipe kann eine Region Surface für das Dashboard mit einer Popover Surface für Command/Search kombinieren.

```json
{
  "surfaces": [
    {
      "id": "surface.dashboard",
      "kind": "region",
      "template": "template.dashboard.shell",
      "owner": "rmt-ui-authoring-owner"
    },
    {
      "id": "surface.command-search",
      "kind": "popover",
      "template": "template.command.shell",
      "focusPolicy": "restore-on-close",
      "escape": "event.command.close",
      "stackPolicy": "topmost"
    }
  ]
}
```

Die Popover Surface trägt den Fokus- und Escape-Vertrag. Sie braucht standardmäßig keine Framework-Overlay-Runtime.

## Resource Ownership

Resources verbinden Data Sources mit UI State. Owner-scoped Resources machen Loading und Error State sichtbar und halten Cleanup auditierbar.

```json
{
  "resources": [
    {
      "id": "resource.commands",
      "dataSource": "datasource.commands",
      "lifecycle": "query",
      "cachePolicy": "owner-scoped",
      "loadingState": "state.command.loading",
      "errorState": "state.command.error",
      "release": "on-surface-close"
    }
  ]
}
```

Nutze `release: "on-surface-close"` für Resources, die transienten Overlays wie Command/Search gehören. Langlebige Dashboard Resources können owner-scoped an der Region Surface bleiben und über Actions aktualisiert werden.

## Graph Flow

Ein typischer Graph für ein Dashboard mit Command/Search sieht so aus:

1. `route.dashboard` betritt `surface.dashboard`.
2. `resource.orders` fragt `datasource.orders` ab.
3. `selector.visibleOrders` speist `collection.orders`.
4. `surface.command-search` öffnet als Popover.
5. `resource.commands` fragt `datasource.commands` ab.
6. `selector.visibleCommands` speist `search.commands`.
7. Das Schließen des Popovers gibt `resource.commands` frei und stellt den Fokus wieder her.

Dieser Graph ist öffentliche Dokumentation für Ownership. Er sollte in Source Maps und Diagnostics sichtbar bleiben.

## Grenze für Browser-Nachweise

Surface Browser Lab Checks können DOM-Form, Fokusverhalten und visuelle Baselines für eigene App-Flows belegen. Öffentliche Release Claims sollten begrenzt bleiben, wenn:

- eine physische Component noch Runtime-Nachweis braucht;
- eine visuelle Baseline nur owner-run ist;
- ein Browser-Pixel-Artefakt bedingt ist;
- ein Docs-Quality-Gate noch bekannte Legacy-Befunde trägt.

Der Release-Status für die eigene RMT-Oberfläche ist akzeptiert mit verbleibenden Release-Punkten. Das heißt: Die Record Contracts sind nutzbar, aber physische Paritätsclaims wie `x-table`, `x-tree`, `x-virtual-list`, `x-command-palette`, `x-autocomplete` und `x-combobox` brauchen eigene Nachweise, bevor sie breite Produktversprechen werden.

## Öffentlicher Vertrag

RMT Surface Resource Graph Runtime ist der öffentliche Runtime-Vertrag für `docs/de/rmt-surface-resource-graph-runtime.md`. Ein Host soll Surface Ownership, Resource Cleanup und Traceability ohne internes Projektwissen prüfen können.

Quellen:

- `tests/fixtures/rmt-owned-recipe-extension.rmt`
- `tests/fixtures/rmt-owned-command-search-primitives.rmt`
- `tests/fixtures/native-first/rmt-owned-surface-browser-lab-fixtures.json`
- `tests/browser/fixtures/rmt-owned-surface-browser-lab.html`
- `tests/browser/visual-baselines/rmt-owned-surface-browser-lab.dom-baseline.json`
- `tests/fixtures/native-first/rmt-owned-release-handoff-fixtures.json`

Nachweise:

```bash
node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js rmt-owned-surface-browser-lab rmt-owned-release-handoff --json
node scripts/run_xtend_tests.js rmt-owned-recipe-extension references --json
```

Erwartetes Signal: Surfaces, Resources und Cleanup bleiben owner-scoped, source-map-fähig und klar über Browser-Evidence-Grenzen.

Weiterlesen:

- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
- [RMT Action Effect Runtime](./rmt-action-effect-runtime.md)
- [RMT Component Primitives und XTend UI](./rmt-vnext-component-primitives.md)
