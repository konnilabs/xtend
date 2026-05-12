# XTendRMT vNext Surface Registry Contract

- Status: `accepted by WP-E15-08`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Contract: `xtend.rmt.vnext-surface-registry.v1`
- Surface Contract: `xtend.rmt.vnext-surface.v1`
- Depends on: `xtend.rmt.core-format.vnext.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-surface-registry-ready`
- Folgepakete: `WP-E15-09`, `WP-E15-10`, `WP-E15-15`, `WP-E15-17`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-surface-registry.v1"
```

Dieser Contract normalisiert vNext-Core-Surfaces in einen host-neutralen Registry-Snapshot. Runtime-Hosts koennen damit Surface-Typen, Lane-Beziehungen und Operation-Zuordnung lesen, ohne Authoring-DSL zu parsen oder DOM-spezifische Annahmen zu treffen.

## Eingabe

Surface-Validation liest Core-Surfaces, Lanes, Operations, Templates und Source Maps:

```json
{
  "schema": "xtend.rmt.core-format.vnext.v1",
  "surfaces": [
    {
      "id": "surface:surfaces.page/root",
      "name": "root",
      "kind": "root",
      "laneRefs": [
        "lane:surfaces.page/root/critical"
      ],
      "sourceRef": "src:surface:surfaces.page/root"
    }
  ],
  "lanes": [],
  "operations": [],
  "sourceMap": []
}
```

## Surface Types

| Authoring Prefix | Surface Type | Host Role | Stack | Modal | Portal |
|------------------|--------------|-----------|-------|-------|--------|
| `root`, `app` | `root` | `root-container` | `base` | `false` | `false` |
| `modal`, `dialog` | `modal` | `overlay-container` | `modal` | `true` | `true` |
| `panel`, `side-panel`, `drawer` | `panel` | `panel-container` | `panel` | `false` | `false` |
| `overlay`, `popover`, `tooltip`, `toast` | `overlay` | `overlay-container` | `overlay` | `false` | `true` |
| `workspace`, `workbench` | `workspace` | `workspace-container` | `workspace` | `false` | `false` |
| `portal` | `portal` | `portal-container` | `portal` | `false` | `true` |

Unknown Surface-Typen blockieren den Registry-Snapshot, weil der Host sonst keine eindeutige Surface-Semantik ableiten kann.

## Surface Record

Eine normalisierte Surface hat diese Shape:

```json
{
  "schema": "xtend.rmt.vnext-surface.v1",
  "surfaceId": "surface:surfaces.page/modal.settings",
  "name": "modal.settings",
  "type": "modal",
  "knownType": true,
  "hostBinding": {
    "mode": "host-neutral",
    "domCoupled": false,
    "hostRole": "overlay-container",
    "stack": "modal",
    "modal": true,
    "portal": true
  },
  "laneRefs": [
    "lane:surfaces.page/modal.settings/critical"
  ],
  "operationRefs": [
    "operation:surfaces.page/modal.settings/critical/0"
  ],
  "status": "ready",
  "diagnostics": []
}
```

## Registry Snapshot

```json
{
  "schema": "xtend.rmt.vnext-surface-registry.v1",
  "status": "ready",
  "surfaceCount": 6,
  "laneCount": 6,
  "operationCount": 7,
  "allowedTypes": [
    "root",
    "modal",
    "panel",
    "overlay",
    "workspace",
    "portal"
  ],
  "byType": {
    "root": [
      "surface:surfaces.page/root"
    ]
  },
  "surfaces": [],
  "diagnostics": []
}
```

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `rmt.vnext.surface.kind.unknown` | Surface-Name/Kennung passt zu keinem bekannten Surface-Typ |
| `rmt.vnext.surface.id.duplicate` | Core enthaelt doppelte Surface-IDs |
| `rmt.vnext.surface.lane_ref.missing` | Surface referenziert eine fehlende Lane |
| `rmt.vnext.surface.lane_ref.scope_mismatch` | Lane zeigt nicht auf die Surface zurueck |
| `rmt.vnext.surface.operation_ref.missing` | Lane referenziert eine fehlende Operation |
| `rmt.vnext.surface.operation_ref.scope_mismatch` | Operation zeigt nicht auf die Surface zurueck |
| `rmt.vnext.surface.template_ref.missing` | Surface referenziert ein fehlendes Template |

Alle Diagnostics behalten `sourceRef`, Core Pointer und Source Range, sofern sie im Core-SourceMap vorhanden sind.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-surfaces --json
```

Fixture:

- `tests/rmt-language/fixtures/vnext-surfaces-valid.rmt`

Modul:

- `tools/rmt-language/vnext-surfaces.js`
