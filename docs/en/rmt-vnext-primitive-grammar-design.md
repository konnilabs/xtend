# RMT vNext Primitive Grammar Design

- Contract: `xtend.rmt.vnext-primitive-grammar-design.v1`
- Workpackage: `RMT-VNEXT-PRIM-01`
- Status: `completed`
- Parent backlog: [RMT vNext Primitive Compiler Backlog](./rmt-vnext-primitives-compiler-backlog.md)
- Design fixture: `tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt`

## Goal

This slice defines the vNext syntax used to author App Platform primitives directly in RMT. It is deliberately a grammar-design contract. Parser/AST implementation is complete in `RMT-VNEXT-PRIM-02`; the first semantic-graph layer started in `RMT-VNEXT-PRIM-03`. Compiler lowering follows in `RMT-VNEXT-PRIM-04`.

The syntax must move app authors out of legacy/JSON authoring. A normal app-shell developer should be able to declare state, selectors, actions, events, data sources, surfaces, overlays, portals and resources in a readable RMT vNext file.

## Design Principles

- **vNext first:** The human-friendly DSL is the primary authoring surface. JSON remains compiler output or migration input.
- **Kernel-neutral:** Syntax can reference XTend components, but the RMT kernel imports no XTend, Fabric or browser modules.
- **App graph before runtime:** References, ownership, payload contracts and trust boundaries must be verifiable from the source graph.
- **Source-map capable:** Every primitive declaration needs a stable source range and a primitive ID.
- **Composable:** App shell, UI templates, state, events and resources may be declared separately, but must connect into one app graph.
- **Legacy in the background:** Classic Core/scaffold artifacts may still be targets, but developers should not have to edit them.

## Top-Level Grammar

A vNext file can still use `import`, `template`, `surface` and `remote`. Primitive declarations are new. They are preferred inside a `template` block, but may also be authored at top level for reusable libraries.

```rmt
template media.manager {
  state media.records type MediaRecord[] initial []

  selector media.filtered from state media.records {
    where record.kind == state.media.filters.kind || state.media.filters.kind == "all"
    sort by record.name asc
  }

  datasource media.index from endpoint "/api/media?pageSize=200" {
    method GET
    contract MediaIndex
    result records
  }

  action media.select {
    input mediaId string
    reduce state.media.selection.activeId = input.mediaId
    emit media.selected with mediaId input.mediaId
  }

  portal surface.root root "#media-manager-root" layer surface
  overlay feedback.toast kind toast portal surface.root
  resource player.stream kind stream owner surface.player source state.media.selection.activeId

  surface media.explorer kind window component x-surface-window {
    source selector media.filtered
    key record.id
    portal surface.root

    lane visible weight 80 {
      hydrate explorer-list from selector media.filtered
    }

    on click "[data-media-id]" -> action media.select {
      payload mediaId from target.dataset.mediaId
    }
  }
}
```

## Primitive Forms

### State

```rmt
state media.filters type object preserve {
  initial {
    query ""
    kind "all"
    collection "all"
  }
}
```

Lowering target:

- `core.state[]`
- source-map entry with `primitiveType: "state"`
- optional XState bridge hint for host adapters

### Selector

```rmt
selector media.filtered from state media.records {
  where record.kind == state.media.filters.kind || state.media.filters.kind == "all"
  where contains(record.name, state.media.filters.query)
  sort by record.name asc
  output MediaRecord[]
}
```

Restriction for PRIM-01: functions such as `contains()` are allowed as declarative selector operators, but not as arbitrary JS calls. PRIM-02 must model them as dedicated AST nodes.

Lowering target:

- `core.selectors[]`
- references to `core.state[]`
- diagnostic for unknown state or record paths

### DataSource

```rmt
datasource media.index from endpoint "/api/media?pageSize=200" {
  method GET
  contract MediaIndex
  result records
  fallback fixture media.fixture
}
```

Lowering target:

- `core.dataSources[]`
- App Platform report domain `dataSources`
- optional SSR/fixture fallback

### Action and Effect

```rmt
action media.reindex {
  status state.actionStatus.reindex
  effect fetch datasource media.reindex
  on success -> reduce state.media.records = result.records
  on success -> emit media.index.loaded with count result.records.length
  on error -> overlay feedback.toast message error.message tone "danger"
}
```

Lowering target:

- `core.actions[]`
- `core.effects[]` or action-scoped `effects`
- event/feedback result routing
- resource ownership for async handles

### Event Binding

```rmt
on click "[data-command='scan']" -> action media.reindex {
  preventDefault true
  payload source from target.dataset.command
}

on xplayer-play target player.surface -> action media.playback.started {
  payload mediaId from detail.mediaId
  payload surfaceId from surface.id
}
```

Lowering target:

- `core.events[]`
- payload contract
- DOM/custom event routing metadata
- source pointer for every payload mapping

### Surface

```rmt
surface media.player kind window component x-surface-window {
  repeat from selector player.instances
  key instance.surfaceId
  portal surface.root
  bounds x 920 y 96 width 760 height 500
  preserve on minimize
  destroy releases resource player.stream

  lane visible weight 90 {
    hydrate player-view from selector media.activeRecord
  }
}
```

Lowering target:

- `core.surfaces[]`
- `core.lanes[]`
- `core.operations[]`
- Surface Graph Runtime records
- keyed repeater diagnostics

### Portal and Overlay

```rmt
portal overlay.root root "body" layer overlay z 1000 {
  focus policy restore
  pointer policy passthrough
  scroll policy lock-when-modal
}

overlay media.lightbox kind lightbox portal overlay.root {
  escape close topmost
  focus trap
  resource lightbox.import
}
```

Lowering target:

- `core.portals[]`
- `core.overlays[]`
- portal reference diagnostics
- overlay stack policy

### Resource

```rmt
resource lightbox.import kind lazy-import owner overlay.media.lightbox {
  import "@ccslabs/xtend/components/xlightbox"
}

resource preview.objectUrl kind object-url owner surface.media.player {
  source selector media.activeRecord
  dispose on surface.destroy
}
```

Lowering target:

- `core.resources[]`
- owner-scoped lifecycle records
- teardown diagnostics for ownerless resources

## AST Node Names

PRIM-02 should produce at least these node types:

| Syntax | AST Node |
|--------|----------|
| `state` | `RmtStateDeclaration` |
| `selector` | `RmtSelectorDeclaration` |
| `datasource` | `RmtDataSourceDeclaration` |
| `action` | `RmtActionDeclaration` |
| `effect` | `RmtEffectStatement` |
| `on ... -> action ...` | `RmtEventBinding` with payload block |
| `surface ... kind ... component ...` | `RmtSurfaceDeclaration` with primitive metadata |
| `portal` | `RmtPortalDeclaration` |
| `overlay` | `RmtOverlayDeclaration` |
| `resource` | `RmtResourceDeclaration` |
| `template` primitive block | `RmtTemplateDeclaration.body[]` |

## Minimum Diagnostic Scope

The grammar slice defines these error classes for PRIM-02/03:

| Code | Meaning |
|------|---------|
| `rmt.vnext.primitive.unknown-reference` | Primitive references an unknown state, selector, action, portal, resource or surface. |
| `rmt.vnext.primitive.owner-missing` | Resource or overlay has no stable owner. |
| `rmt.vnext.primitive.unkeyed-repeat` | Surface or template repeats records without `key`. |
| `rmt.vnext.primitive.payload-contract-missing` | Event binds an action without payload contract or mapping. |
| `rmt.vnext.primitive.unsafe-html` | Template uses HTML without Trusted DOM boundary. |
| `rmt.vnext.primitive.kernel-boundary` | Primitive requires a kernel import from XTend, Fabric or browser runtime. |

## Acceptance for PRIM-01

- This document defines a coherent vNext syntax for all P0 primitive families.
- The fixture `tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt` shows the same syntax scope in a compact app shell.
- The backlog marks `RMT-VNEXT-PRIM-01` as `in_progress`.
- PRIM-02 can start directly with parser/AST work without reopening the syntax question.
