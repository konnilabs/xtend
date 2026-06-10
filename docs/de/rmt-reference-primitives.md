# RMT Reference: Primitives

Primitives sind die stabilen App-Platform-Records in RMT vNext.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="state"></a>`state` | `state app.status type object preserve { ... }` | Top-Level, `template`, primitive `surface` | Identifier, `type`, `initial`, `preserve` | Deklariert dauerhaften oder lifecycle-gebundenen App-State. | State-Blöcke dürfen nur `initial` enthalten. | `selector`, `reduce` |
| <a id="selector"></a>`selector` | `selector view from state app.status { ... }` | Top-Level, `template`, primitive `surface` | Identifier, Source-Referenz | Leitet ein View-Modell aus State oder DataSource ab. | Selector-Blöcke erlauben nur `where`, `find`, `sort by`, `output`. | `from state`, `from datasource` |
| <a id="datasource"></a>`datasource` | `datasource list from endpoint "/api" { ... }` | Top-Level, `template`, primitive `surface` | Identifier, Source-Art, Source-Ziel | Beschreibt Datenzugriff ohne freie Runtime-Ausführung. | DataSource-Blöcke erlauben nur `method`, `contract`, `result`, `fallback`. | `endpoint`, `fixture`, `worker` |
| <a id="action"></a>`action` | `action save { ... }` | Top-Level, `template`, primitive `surface` | Identifier | Deklariert typisierte Eingaben, Reducer, Effects und Events. | Action-Blöcke erlauben nur `input`, `status`, `effect`, `reduce`, `emit`, `on`. | `emit`, `reduce`, `on success ->` |
| <a id="portal"></a>`portal` | `portal app.root root "#app" layer surface` | Top-Level, `template` | `root`, `layer`, optional `z` | Bindet Surfaces an einen Host-Root und Layer. | Unerwartete Inline-Attribute werden abgewiesen. | `surface`, `overlay` |
| <a id="overlay"></a>`overlay` | `overlay notice kind toast portal app.root` | Top-Level, `template` | `kind`, `portal` | Deklariert Feedback- oder Interaktions-Overlays. | Overlay-Policy-Zeilen bleiben deklarativ. | `toast`, `dialog`, `on error -> overlay` |
| <a id="resource"></a>`resource` | `resource file kind object-url owner surface.preview` | Top-Level, `template` | `kind`, `owner`, `source` | Deklariert owner-scoped Ressourcen mit Cleanup. | Resource-Blöcke erlauben nur `import`, `source`, `dispose`. | `destroy releases resource` |
| <a id="validation"></a>`validation` | `validation form.contact { ... }` | Top-Level, `template` | Identifier | Deklariert Formularregeln und Action-Gates. | Nur `mode`, `target`, `field`, `include` sind erlaubt. | `field`, `target action` |
| <a id="transition"></a>`transition` | `transition route.next { ... }` | Top-Level, `template` | Identifier | Deklariert Surface-Wechsel mit Effekt, Dauer und Lane. | Nur Transition-Clauses sind im Block erlaubt. | `trigger action`, `from surfaces` |

## Allowed contexts

Primitives dürfen top-level, im `template` und teilweise in primitive-scoped Surfaces stehen. Sie deklarieren Records; sie führen keinen Host-Code aus.

## Parameters

Die wichtigsten Parameter sind Identifier, Source-Referenzen, Typnamen, Katalogwerte und statische Strings.

## Description

Primitives bilden die Brücke zwischen RMT-Authoring und Core-Format. Sie werden zu State-, Selector-, DataSource-, Action-, Portal-, Overlay-, Resource-, Validation-, Transition- und Surface-Records kompiliert.

## Examples

```rmt
template reference.primitives {
  state app.status type object preserve {
    initial {
      text "Ready"
    }
  }

  selector app.statusView from state app.status {
    output StatusView
  }

  datasource app.messages from endpoint "/api/messages" {
    method GET
    result list
    fallback fixture messages.fallback
  }

  action app.refresh {
    input id string
    status app.status
    reduce state.app.status.text = "Loading"
    emit app.refreshed with id input.id
  }

  portal app.root root "#app" layer surface
  overlay app.toast kind toast portal app.root
  resource app.timer kind timer owner surface.home {
    dispose clear
  }

  validation app.form {
    mode blocking
    target action app.refresh
    field app.email required email message "Valid email"
  }

  transition app.next {
    trigger action app.refresh
    from surfaces [home]
    to surfaces [done]
    effect fade
    durationMs 120
    easing "ease-out"
    lane transition
  }

  surface home kind card component x-status {
    portal app.root
    lane visible weight 80 {
      hydrate status.card from selector app.statusView
    }
  }
}
```

## Diagnostics

Fehlende Owner, unbekannte Referenzen, unkeyed Repeater und Actions ohne Reducer oder Payload-Vertrag werden semantisch gemeldet.

## Related operators

`template`, `surface`, `lane`, `from`, `when`, `payload`, `trust boundary`.
