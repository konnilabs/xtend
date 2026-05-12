# XTendRMT vNext Composition and Component Binding Contract

- Status: `accepted by WP-E15-10`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Contract: `xtend.rmt.vnext-composition.v1`
- Slot Binding: `xtend.rmt.vnext-slot-binding.v1`
- Component Binding: `xtend.rmt.vnext-component-binding.v1`
- Depends on: `xtend.rmt.core-format.vnext.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-composition-binding-ready`
- Folgepakete: `WP-E15-11`, `WP-E15-12`, `WP-E15-15`, `WP-E15-17`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-composition.v1"
```

Dieser Contract macht `slot`-Composition aus dem vNext-Core maschinenlesbar, ohne daraus HTML-Markup oder Host-DOM-Strukturen abzuleiten. Composition beschreibt nur, welche Operationen welche Komponenten in welchen Slots orchestrieren. Die konkrete Darstellung bleibt Aufgabe des Component Adapters.

## Eingabe

Composition liest Core-Operationen, Slots und Source Maps:

```json
{
  "schema": "xtend.rmt.core-format.vnext.v1",
  "operations": [
    {
      "id": "operation:composition.page/root/critical/0",
      "op": "mount",
      "target": {
        "kind": "ref",
        "ref": "shell"
      }
    }
  ],
  "slots": [
    {
      "id": "slot:composition.page/root/critical/0/body",
      "name": "body",
      "ownerOperation": "operation:composition.page/root/critical/0",
      "operationRefs": [
        "operation:composition.page/root/critical/0/body/0"
      ]
    }
  ],
  "sourceMap": []
}
```

## Component Catalog

Der Contract akzeptiert einen Component Catalog aus Component Contract v2 oder RMT Component Metadata. Minimal werden diese Felder normalisiert:

```json
{
  "id": "app-shell",
  "tag": "x-app-shell",
  "aliases": ["shell"],
  "adapter": "xtend.component",
  "slots": ["header", "body", "actions"]
}
```

Lokale Aliasnamen werden gegen `aliases` aufgeloest. Im Core bleibt der Authoring-Ref erhalten, waehrend der Composition Graph `resolvedComponentId` fuer Adapter und Host bereitstellt.

## Adapter Contract

Component Binding verlangt einen Adapter mit diesen Capabilities:

| Capability | Bedeutung |
|------------|-----------|
| `component.binding` | Operation-Target kann als Component Ref gebunden werden |
| `component.slot` | Adapter kann deklarative Slots allgemein fuellen |
| `component.slot.<name>` | Adapter kann genau diesen Slot fuellen |

Ein Slot Binding ist nur gueltig, wenn der Owner-Component-Adapter eine allgemeine oder slot-spezifische Slot-Capability bereitstellt.

## Slot Binding Record

```json
{
  "schema": "xtend.rmt.vnext-slot-binding.v1",
  "slotId": "slot:composition.page/root/critical/0/body",
  "name": "body",
  "ownerOperation": "operation:composition.page/root/critical/0",
  "ownerComponentRef": "shell",
  "ownerComponentId": "app-shell",
  "ownerAdapterId": "xtend.component",
  "operationRefs": [
    "operation:composition.page/root/critical/0/body/0"
  ],
  "childComponentRefs": [
    "content-card"
  ],
  "bindingMode": "orchestration",
  "markupMode": "none",
  "status": "ready",
  "diagnostics": []
}
```

## Component Binding Record

```json
{
  "schema": "xtend.rmt.vnext-component-binding.v1",
  "operationId": "operation:composition.page/root/critical/0",
  "operationKind": "lifecycle",
  "lifecycle": "mount",
  "componentRef": "shell",
  "resolvedComponentId": "app-shell",
  "alias": true,
  "adapterId": "xtend.component",
  "adapterContract": {
    "schema": "xtend.rmt.vnext-component-adapter.v1",
    "id": "xtend.component",
    "capabilities": [
      "component.binding",
      "component.slot"
    ]
  },
  "status": "ready",
  "diagnostics": []
}
```

## Composition Graph

```json
{
  "schema": "xtend.rmt.vnext-composition.v1",
  "status": "ready",
  "mode": "component-orchestration",
  "markupCoupled": false,
  "operationCount": 5,
  "slotCount": 4,
  "componentBindingCount": 5,
  "slots": [],
  "componentBindings": [],
  "diagnostics": []
}
```

`markupCoupled: false` ist Teil des Contracts. Hosts duerfen daraus keine direkte DOM-Shape ableiten; sie muessen ueber Component Adapter und deren Slot-Capabilities gehen.

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `rmt.vnext.composition.slot.owner_missing` | Slot verweist auf eine fehlende Owner-Operation |
| `rmt.vnext.composition.slot.operation_ref_missing` | Slot verweist auf eine fehlende Nested Operation |
| `rmt.vnext.composition.slot.operation_scope_mismatch` | Nested Operation verlaesst Template/Surface/Lane-Scope des Owners |
| `rmt.vnext.composition.slot.duplicate` | Ein Owner deklariert denselben Slot mehrfach |
| `rmt.vnext.composition.component.ref_missing` | Operation hat kein Component-Target |
| `rmt.vnext.composition.component.unknown` | Component Ref fehlt im Catalog |
| `rmt.vnext.composition.component.adapter_missing` | Adapter fehlt oder bietet die benoetigte Capability nicht an |
| `rmt.vnext.composition.component.slot_unsupported` | Component Contract deklariert den Slot nicht |
| `rmt.vnext.composition.operation.target_unsupported` | Operation-Target ist kein deklarativer Ref |

Alle Diagnostics behalten `sourceRef`, Core Pointer und Source Range, sofern sie im Core-SourceMap vorhanden sind.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-composition --json
```

Fixture:

- `tests/rmt-language/fixtures/vnext-composition-valid.rmt`

Modul:

- `tools/rmt-language/vnext-composition.js`
