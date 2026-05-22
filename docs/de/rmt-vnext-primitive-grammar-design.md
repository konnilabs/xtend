# RMT vNext Primitive Grammar Design

- Contract: `xtend.rmt.vnext-primitive-grammar-design.v1`
- Workpackage: `RMT-VNEXT-PRIM-01`
- Status: `completed`
- Parent backlog: [RMT vNext Primitive Compiler Backlog](./rmt-vnext-primitives-compiler-backlog.md)
- Design fixture: `tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt`

## Ziel

Dieser Slice definiert die vNext-Syntax, mit der App-Platform-Primitives direkt
in RMT authoriert werden sollen. Er ist bewusst ein Grammar-Design-Contract.
Parser-/AST-Implementierung ist in `RMT-VNEXT-PRIM-02` abgeschlossen; die erste
Semantic-Graph-Schicht ist in `RMT-VNEXT-PRIM-03` gestartet. Compiler-Lowering
folgt in `RMT-VNEXT-PRIM-04`.

Die Syntax muss App-Autoren aus Legacy-/JSON-Authoring herausfuehren. Ein
normaler App-Shell-Entwickler soll State, Selectors, Actions, Events,
DataSources, Surfaces, Overlays, Portals und Resources in einer lesbaren RMT
vNext-Datei deklarieren koennen.

## Design-Prinzipien

- **vNext first:** Die menschenfreundliche DSL ist die primaere Authoring-
  Oberflaeche. JSON bleibt Compiler-Output oder Migrationsinput.
- **Kernel-neutral:** Syntax kann XTend-Komponenten referenzieren, aber der
  RMT-Kernel importiert keine XTend-, Fabric- oder Browser-Module.
- **App-Graph vor Runtime:** Referenzen, Ownership, Payload Contracts und
  Trust Boundaries muessen aus dem Source Graph pruefbar sein.
- **Source-map-faehig:** Jede Primitive-Deklaration braucht einen stabilen
  Source Range und eine Primitive ID.
- **Composable:** App Shell, UI-Templates, State, Events und Resources duerfen
  getrennt deklarierbar sein, muessen aber zu einem App Graph verbunden werden.
- **Legacy im Hintergrund:** Klassische Core-/Scaffold-Artefakte duerfen
  weiterhin Targets sein, aber Entwickler sollen sie nicht bearbeiten muessen.

## Top-Level-Grammatik

Eine vNext-Datei kann weiterhin `import`, `template`, `surface` und `remote`
nutzen. Neu kommen primitive Deklarationen hinzu. Sie sind innerhalb eines
`template`-Blocks bevorzugt, duerfen fuer wiederverwendbare Bibliotheken aber
auch top-level authoriert werden.

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

## Primitive-Formen

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

Lowering-Ziel:

- `core.state[]`
- Source-map entry mit `primitiveType: "state"`
- optionaler XState-Bridge-Hint fuer Host-Adapter

### Selector

```rmt
selector media.filtered from state media.records {
  where record.kind == state.media.filters.kind || state.media.filters.kind == "all"
  where contains(record.name, state.media.filters.query)
  sort by record.name asc
  output MediaRecord[]
}
```

Einschraenkung fuer PRIM-01: Funktionen wie `contains()` sind als deklarative
Selector-Operatoren erlaubt, aber nicht als beliebige JS-Calls. PRIM-02 muss
sie als eigene AST-Nodes modellieren.

Lowering-Ziel:

- `core.selectors[]`
- Referenzen auf `core.state[]`
- Diagnose fuer unbekannte State- oder Record-Pfade

### DataSource

```rmt
datasource media.index from endpoint "/api/media?pageSize=200" {
  method GET
  contract MediaIndex
  result records
  fallback fixture media.fixture
}
```

Lowering-Ziel:

- `core.dataSources[]`
- App-Platform-Report-Domain `dataSources`
- optionaler SSR-/Fixture-Fallback

### Action und Effect

```rmt
action media.reindex {
  status state.actionStatus.reindex
  effect fetch datasource media.reindex
  on success -> reduce state.media.records = result.records
  on success -> emit media.index.loaded with count result.records.length
  on error -> overlay feedback.toast message error.message tone "danger"
}
```

Lowering-Ziel:

- `core.actions[]`
- `core.effects[]` oder action-scoped `effects`
- Event-/Feedback-Result-Routing
- Resource ownership fuer async handles

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

Lowering-Ziel:

- `core.events[]`
- Payload Contract
- DOM/custom event routing metadata
- Source pointer fuer jedes Payload Mapping

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

Lowering-Ziel:

- `core.surfaces[]`
- `core.lanes[]`
- `core.operations[]`
- Surface Graph Runtime records
- keyed repeater diagnostics

### Portal und Overlay

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

Lowering-Ziel:

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

Lowering-Ziel:

- `core.resources[]`
- owner-scoped lifecycle records
- teardown diagnostics fuer ownerless resources

## AST-Node-Namen

PRIM-02 soll mindestens diese Node-Typen erzeugen:

| Syntax | AST Node |
|--------|----------|
| `state` | `RmtStateDeclaration` |
| `selector` | `RmtSelectorDeclaration` |
| `datasource` | `RmtDataSourceDeclaration` |
| `action` | `RmtActionDeclaration` |
| `effect` | `RmtEffectStatement` |
| `on ... -> action ...` | `RmtEventBinding` mit Payload-Block |
| `surface ... kind ... component ...` | `RmtSurfaceDeclaration` mit Primitive-Metadata |
| `portal` | `RmtPortalDeclaration` |
| `overlay` | `RmtOverlayDeclaration` |
| `resource` | `RmtResourceDeclaration` |
| `template` primitive block | `RmtTemplateDeclaration.body[]` |

## Diagnostik-Mindestumfang

Der Grammar-Slice definiert folgende Fehlerklassen fuer PRIM-02/03:

| Code | Bedeutung |
|------|-----------|
| `rmt.vnext.primitive.unknown-reference` | Primitive referenziert unbekannten State, Selector, Action, Portal, Resource oder Surface. |
| `rmt.vnext.primitive.owner-missing` | Resource oder Overlay besitzt keinen stabilen Owner. |
| `rmt.vnext.primitive.unkeyed-repeat` | Surface oder Template wiederholt Records ohne `key`. |
| `rmt.vnext.primitive.payload-contract-missing` | Event bindet eine Action ohne Payload Contract oder Mapping. |
| `rmt.vnext.primitive.unsafe-html` | Template nutzt HTML ohne Trusted-DOM-Boundary. |
| `rmt.vnext.primitive.kernel-boundary` | Primitive verlangt Kernel-Import aus XTend, Fabric oder Browser Runtime. |

## Akzeptanz fuer PRIM-01

- Dieses Dokument definiert eine zusammenhaengende vNext-Syntax fuer alle P0-
  Primitive-Familien.
- Die Fixture `tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt`
  zeigt denselben Syntaxumfang in einer kompakten App-Shell.
- Das Backlog markiert `RMT-VNEXT-PRIM-01` als `in_progress`.
- PRIM-02 kann direkt mit Parser-/AST-Arbeit starten, ohne die Syntaxfrage neu
  zu klaeren.
