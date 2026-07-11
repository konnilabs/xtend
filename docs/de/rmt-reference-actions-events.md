# RMT Reference: Actions und Events

Actions beschreiben State-Änderungen, Effects und emittierte Events. Event Bindings verbinden DOM- oder Surface-Ereignisse mit Actions.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="input"></a>`input` | `input id string` | `action` | Name, Typ | Deklariert Action-Payload-Felder. | Fehlende Typen werden gemeldet. | `payload` |
| <a id="status"></a>`status` | `status app.request` | `action` | State-Pfad | Bindet Loading-, Success- und Error-Status. | Unbekannter State wird semantisch gemeldet. | `effect` |
| <a id="effect"></a>`effect` | `effect fetch datasource tickets` | `action` | Effect-Art, optionale Quelle | Deklariert host-owned asynchrone Arbeit. | Effect-Quelle muss `datasource`, `resource` oder `selector` sein. | `on success ->` |
| <a id="reduce"></a>`reduce` | `reduce state.app.status.text = "Saved"` | `action` | Zielpfad, Ausdruck | Schreibt deklarativ in State. | Actions ohne Reducer können blockiert werden. | `state`, `status` |
| <a id="emit"></a>`emit` | `emit app.saved with id input.id` | `action` | Eventname, optionale Payload | Veröffentlicht ein typisiertes RMT-Event. | Fehlende Payload-Contracts können semantisch gemeldet werden. | `with`, `emits` |
| <a id="with"></a>`with` | `with id input.id` | `emit` | Schlüssel/Wert-Paare | Mappt Event-Payload direkt aus Action-Input oder State. | Ungültige Payload-Werte erzeugen Syntaxfehler. | `payload` |
| <a id="on"></a>`on` | `on click -> action save` | `surface`, Policy-Block, Action-Result | Event oder Phase | Bindet Ereignisse oder Action-Ergebnisse. | `->` und `action` sind bei Event Bindings erforderlich. | `target`, `payload` |
| <a id="target"></a>`target` | `on input target email -> action save` | Event Binding | Ziel-Identifier | Schränkt das Event Binding auf ein Ziel ein. | Ziel muss ein Identifier sein. | `on` |
| <a id="arrow-action"></a>`-> action` | `on click -> action save` | Event Binding | Action-Identifier | Verknüpft Ereignis und Action. | Das Keyword `action` ist Pflicht. | `on`, `payload` |
| <a id="payload"></a>`payload` | `payload id from target.dataset.id` | Event-Payload-Block | Name und Source-Pfad | Mappt DOM-, Detail- oder Surface-Kontext in Action-Input. | Payload-Blöcke erlauben nur `payload` und `preventDefault`. | `from`, `input` |
| <a id="prevent-default"></a>`preventDefault` | `preventDefault true` | Event-Payload-Block | Boolean | Dokumentiert, dass der Host das native Default-Verhalten verhindert. | Nur im Event-Payload-Block erlaubt. | `payload` |
| <a id="on-success-reduce"></a>`on success -> reduce` | `on success -> reduce state.app.status.text = result.text` | `action` | Phase, Effekttext | Beschreibt Result-Handling nach erfolgreichem Effect. | Result-Handler brauchen `->`. | `effect`, `reduce` |
| <a id="on-success-emit"></a>`on success -> emit` | `on success -> emit app.loaded` | `action` | Phase, Effekttext | Emittiert ein Event nach Erfolg. | Payload-Shape kann separat geprüft werden. | `emit` |
| <a id="on-error-overlay"></a>`on error -> overlay` | `on error -> overlay app.toast` | `action` | Phase, Overlay-Referenz | Bindet Fehlerfeedback an ein Overlay. | Overlay-Referenz muss existieren. | `overlay` |

## Allowed contexts

`input`, `status`, `effect`, `reduce`, `emit` und Action-Result-Handler stehen in `action`. Event Bindings stehen in `surface` oder in Policy-Blöcken von Lifecycle-Operationen.

## Parameters

Eventnamen, Actionnamen und Payload-Schlüssel sind Identifier. Payload-Werte sind Pfade wie `input.id`, `detail.value`, `target.dataset.id` oder `surface.id`.

## Description

Actions sind deklarative Übergänge. Sie beschreiben, was geändert oder veröffentlicht werden soll; der Host entscheidet, wie konkrete Adapter ausgeführt werden.

## Examples

```rmt
template reference.actions {
  state app.status type object preserve {
    initial {
      text "Idle"
    }
  }

  datasource tickets from endpoint "/api/tickets" {
    method GET
  }

  action saveTicket {
    input id string
    status app.status
    effect fetch datasource tickets
    reduce state.app.status.text = "Saving"
    on success -> reduce state.app.status.text = "Saved"
    on success -> emit ticket.saved
    on error -> overlay app.toast
    emit ticket.requested with id input.id
  }

  portal app.root root "#app" layer surface
  overlay app.toast kind toast portal app.root

  surface editor kind form component x-form {
    portal app.root
    lane user-blocking weight 88 {
      mount editor.form from endpoint ticket.editor {
        on submit target editor -> action saveTicket {
          payload id from target.dataset.ticketId
          preventDefault true
        }
      }
    }
  }
}
```

## Diagnostics

Falsche Action-Clauses, fehlende Reducer, unbekannte Overlay-Referenzen und fehlende Payload-Contracts werden vom Parser, Linter oder Semantic Graph gemeldet.

## Related operators

`action`, `state`, `datasource`, `overlay`, `surface`, `on`, `emit`.

## Weiterführend

Der RMT-Referenzindex ordnet Action- und Event-Records in das vollständige Sprachmodell ein. [Verwandter Artikel](./rmt-reference.md)
