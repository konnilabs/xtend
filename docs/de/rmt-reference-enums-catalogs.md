# RMT Reference: Enums und Catalogs

Diese Seite listet feste Werte, die in Operatoren verwendet werden.

## Syntax

| Catalog | Values | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="lane-names"></a>Lane names | `critical`, `visible`, `user-blocking`, `transition`, `resource`, `a11y`, `idle`, `background`, `diagnostics` | `lane`, `lane transition`, Remote Events | Identifier | Ordnet Arbeit einer Scheduling-Klasse zu. | Unbekannte Lane-Namen können katalogseitig gemeldet werden. | `lane`, `weight` |
| <a id="source-kinds"></a>Source kinds | `endpoint`, `sse`, `worker`, `selector`, `state`, `datasource`, `fixture`, `resource` | `from`, `fallback`, `source` | Identifier plus Referenz | Beschreibt, wo Daten oder Arbeit herkommen. | Parser meldet nicht erlaubte Source-Kinds. | `from` |
| <a id="overlay-kinds"></a>Overlay kinds | `tooltip`, `toast`, `popover`, `lightbox`, `menu`, `dialog` | `overlay kind` | Identifier | Klassifiziert Overlay-UI. | Unbekannte Overlay-Kinds können semantisch gemeldet werden. | `overlay` |
| <a id="resource-kinds"></a>Resource kinds | `object-url`, `stream`, `observer`, `timer`, `lazy-import` | `resource kind` | Identifier | Klassifiziert Cleanup- und Ownership-Verhalten. | Fehlender Owner kann gemeldet werden. | `resource`, `destroy releases` |
| <a id="transition-effects"></a>Transition effects | `fade`, `crossfade`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `scale`, `none` | `transition effect` | Identifier | Wählt visuelle Surface-Transition. | Unbekannte Effekte können katalogseitig gemeldet werden. | `transition` |
| <a id="trust-boundary-identifiers"></a>Trust boundary identifiers | `xtend.security.sanitizing-boundary.v1`, `xtend.security.streaming-boundary.v1`, `xtend.security.worker-boundary.v1`, `xtend.security.remote-surface.v1` | `trust boundary` | String | Benennt Host-owned Sicherheitsgrenzen. | Boundary muss String sein. | `sanitize`, `remote surface` |

## Allowed contexts

Catalog-Werte stehen in Clauses, die statische Werte erwarten. Sie sind keine JavaScript-Enums und werden nicht importiert.

## Parameters

Alle Werte sind literal im RMT-Quelltext. Trust Boundaries werden als Strings geschrieben, die übrigen Werte meist als Identifier.

## Description

Catalogs halten Authoring stabil und prüfbar. Neue Werte brauchen Tooling-, Docs- und Testabdeckung.

## Examples

```rmt
template reference.catalogs {
  resource preview.file kind object-url owner surface.preview
  overlay notice kind toast portal app.root
  portal app.root root "#app" layer surface

  transition preview.open {
    trigger action preview.show
    from surfaces [preview.closed]
    to surfaces [preview.open]
    effect crossfade
    durationMs 160
    easing "ease-out"
    lane transition
  }

  action preview.show {
    input id string
    reduce state.preview.id = input.id
    emit preview.opened with id input.id
  }

  state preview.id type string initial ""

  surface preview kind page component x-section {
    portal app.root
    lane visible weight 80 {
      mount preview.card from endpoint preview.card {
        trust boundary "xtend.security.sanitizing-boundary.v1"
      }
    }
  }
}
```

## Diagnostics

Parser-Diagnosen prüfen Syntax und Kontext. Katalog- und Semantikprüfungen melden unbekannte oder unvollständige Werte.

## Related operators

`lane`, `from`, `overlay`, `resource`, `transition`, `trust boundary`.
