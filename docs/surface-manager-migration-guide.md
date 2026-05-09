# SurfaceManager Migration Guide

- Contract: `xtend.surface.release-handoff.v1`
- Native Domain: `xtend.rmt.surfaces-domain.v1`
- Adapter Handoff: `xtend.surface.adapter.v1`
- Gate: `node scripts/run_xtend_tests.js surface-release-handoff --json`

## Ziel

Dieser Guide beschreibt die additive Migration von Surface-Metadata in Component Records zu nativen RMT Surface Records. Die Migration ist bewusst ohne Big Bang: bestehende `components[*].metadata.surface` Records bleiben gueltig, waehrend neue App Shells `surfaces[*]` bevorzugen.

## Migrationsschritte

| Schritt | Ergebnis |
|---------|----------|
| `inventory-component-metadata-surfaces` | alle bestehenden `metadata.surface` Records und State Keys erfassen |
| `stabilize-surface-ids-and-state-keys` | IDs, `type`, `manager` und `stateKey` einfrieren |
| `add-native-surfaces-records` | parallele `surfaces[*]` Records mit gleicher Identitaet anlegen |
| `keep-dual-records-during-handoff` | Component-Metadata und native Records im Gate vergleichen |
| `switch-authoring-default-to-surfaces-domain` | neue komplexe Shells direkt in `surfaces[*]` schreiben |
| `defer-xtend-surface-runtime-until-adapter-implementation` | `xtend.surface` als Adapter-Handoff sichtbar lassen |

## Vorher

```json
{
  "id": "workbench.properties",
  "tag": "x-side-panel",
  "metadata": {
    "surface": {
      "schema": "xtend.surface.record.v1",
      "id": "surface.properties",
      "type": "side-panel",
      "manager": "workbench.manager",
      "stateKey": "xtend.surface.properties.state"
    }
  }
}
```

## Nachher als Dual Record

```json
{
  "surfaces": [
    {
      "id": "surface.properties",
      "schema": "xtend.surface.record.v1",
      "type": "side-panel",
      "adapter": "xtend.surface",
      "manager": "workbench.manager",
      "component": "workbench.properties",
      "route": "workbench",
      "schedule": "surface.visible.render",
      "stateKey": "xtend.surface.properties.state"
    }
  ]
}
```

Die Component-Metadata bleibt waehrend des Handoffs im Component Record und verweist optional mit `nativeRecord` auf den nativen Record.

## Review-Checkliste

- Jede native Surface besitzt einen stabilen `id`.
- `component` zeigt auf genau einen Component Record.
- `manager` zeigt auf den `x-surface-manager` Record.
- `route` und `schedule` loesen auf native RMT Records auf.
- `stateKey` ist identisch zwischen `components[*].metadata.surface` und `surfaces[*]`.
- `xtend.surface` ist als `surface_adapter` deklariert, aber nicht als produktive Runtime beworben.
- Die Gates `surface-native-rmt` und `surface-release-handoff` sind gruen.

Details zur generischen RMT-Migration stehen in [XTendRMT Native Migration Guide](./xtendrmt-migration-guide.md). Details zum Surface-Authoring stehen in [SurfaceManager Authoring Guide](./surface-manager-authoring-guide.md).
