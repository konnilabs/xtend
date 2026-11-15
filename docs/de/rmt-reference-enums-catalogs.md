# RMT Reference: Enums und Catalogs

Diese Seite listet feste Werte, die in Operatoren verwendet werden.

## Syntax

| Catalog | Values | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="lane-names"></a>Lane names | `user-blocking`, `visible`, `transition`, `idle`, `background`, `diagnostics` | `lane`, `lane transition`, Remote Events | Identifier | Ordnet Arbeit einer Scheduling-Klasse zu. | Unbekannte Lane-Namen können katalogseitig gemeldet werden. | `lane`, `weight` |
| <a id="source-kinds"></a>Source kinds | `endpoint`, `sse`, `worker`, `selector`, `state`, `datasource`, `fixture`, `resource` | `from`, `fallback`, `source` | Identifier plus Referenz | Beschreibt, wo Daten oder Arbeit herkommen. | Parser meldet nicht erlaubte Source-Kinds. | `from` |
| <a id="overlay-kinds"></a>Overlay kinds | `tooltip`, `toast`, `popover`, `lightbox`, `menu`, `dialog` | `overlay kind` | Identifier | Klassifiziert Overlay-UI. | Unbekannte Overlay-Kinds können semantisch gemeldet werden. | `overlay` |
| <a id="resource-kinds"></a>Resource kinds | `object-url`, `stream`, `observer`, `timer`, `lazy-import` | `resource kind` | Identifier | Klassifiziert Cleanup- und Ownership-Verhalten. | Fehlender Owner kann gemeldet werden. | `resource`, `destroy releases` |
| <a id="transition-effects"></a>Transition effects | `fade`, `crossfade`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `scale`, `pop`, `zoom`, `flip`, `rotate`, `expand`, `collapse`, `fade-blur`, `shared-element`, `layout-flip`, `none` | `transition effect` | Identifier | Wählt visuelle Surface-Transition. | Unbekannte Effekte können katalogseitig gemeldet werden. | `transition` |
| <a id="trust-boundary-identifiers"></a>Trust boundary identifiers | `xtend.security.sanitizing-boundary.v1`, `xtend.security.streaming-boundary.v1`, `xtend.security.worker-boundary.v1`, `xtend.security.remote-surface.v1` | `trust boundary` | String | Benennt Host-owned Sicherheitsgrenzen. | Boundary muss String sein. | `sanitize`, `remote surface` |

## Allowed contexts

Catalog-Werte stehen in Clauses, die statische Werte erwarten. Sie sind keine JavaScript-Enums und werden nicht importiert.

## Parameters

Alle Werte sind literal im RMT-Quelltext. Trust Boundaries werden als Strings geschrieben, die übrigen Werte meist als Identifier.

## Description

Catalogs halten Authoring stabil und prüfbar. Neue Werte brauchen Tooling-, Docs- und Testabdeckung.

### Kanonische Lanes und Aliase

Die sechs Lane-Namen oben sind die kanonischen Schedulerklassen. `critical`, `urgent` und `input` normalisieren zu `user-blocking`; `interactive`, `normal` und `default` zu `visible`; `route` zu `transition`; `deferred` zu `idle`; `bg` zu `background`; `telemetry` und `debug` zu `diagnostics`.

`resource` und `a11y` sind weder kanonische Lanes noch Aliase des aktuellen Normalisierers. Ein unbekannter Name bleibt als unbekannt markiert und erhält dort den Fallback `visible`; daraus entsteht keine zusätzliche Schedulerfähigkeit. Lane-Namen beschreiben Scheduling, nicht automatisch einen Lade-, Visibility- oder Hydrationstrigger. Maßgeblich ist `tools/rmt-language/scheduler-lanes.js`.

### Tones für Action Result Overlays

Die `tone`-Option eines Result-Overlay-Handlers akzeptiert `info`, `success`, `warning`, `error`, `neutral`, `primary`, `secondary` und `danger`. Statische Werte werden als Strings geschrieben, zum Beispiel `on error -> overlay app.toast tone "danger"`. Ein ausdrücklich referenzierter Wert wird zur Laufzeit geprüft.

Der Host erhält den gewählten Wert als `data-tone`. Die kanonische visuelle Einordnung bildet `neutral`, `primary` und `secondary` auf `info`, `danger` auf `error` ab. Unbekannte statische Tones und unbekannte Overlayoptionen werden vom Compiler abgewiesen; zulässig sind hier nur `message` und `tone`.

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

## Weiterführend

Der RMT-Referenzindex erklärt, wie andere Records Enum- und Catalog-Namen auflösen. [Verwandter Artikel](./rmt-reference.md)
