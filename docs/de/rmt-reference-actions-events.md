# RMT Reference: Actions und Events

Actions beschreiben State-Änderungen, Effects und emittierte Events. Event Bindings verbinden DOM- oder Surface-Ereignisse mit Actions.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="execution-fastpass"></a>`execution fastpass` | `execution fastpass` | `action` | `fastpass` | Navigation, Fokus oder Close auf `user-blocking` ohne Model-Transaktion. | Reducer, Fetch, Service, Stream, Custom-Effects und Command-Ketten sind verboten. | `effect navigation`, `effect close surface`, `effect focus surface` |
| <a id="input"></a>`input` | `input id string` | `action` | Name, Typ | Deklariert Action-Payload-Felder. | Fehlende Typen werden gemeldet. | `payload` |
| <a id="status"></a>`status` | `status app.request` | `action` | State-Pfad | Bindet Loading-, Success- und Error-Status. | Unbekannter State wird semantisch gemeldet. | `effect` |
| <a id="effect"></a>`effect` | `effect fetch datasource tickets` | `action` | Effect-Art, optionale Quelle | Deklariert host-owned asynchrone Arbeit oder einen festen Component-Command. | Fetch nutzt `datasource`, andere Effects ihre definierte Quelle. FastPass unterstützt Navigation sowie `close surface` und `focus surface`; Component-Commands nur `focus`, `reset` und `snapshot`. | `on success ->` |
| <a id="reduce"></a>`reduce` | `reduce state.app.status.text = "Saved"` | `action` | Zielpfad, Ausdruck | Schreibt deklarativ in State. | Fachliche Actions benötigen einen gültigen Reducer-Vertrag; FastPass verbietet Reducer. | `state`, `status` |
| <a id="emit"></a>`emit` | `emit app.saved with id input.id` | `action` | Eventname, optionale Payload | Veröffentlicht ein deklariertes RMT-Ereignis nach erfolgreichem Commit. | Fehlende Payload-Contracts können semantisch gemeldet werden. | `with`, `emits` |
| <a id="with"></a>`with` | `with id input.id` | `emit` | Schlüssel/Wert-Paare | Mappt Event-Payload direkt aus Action-Input oder State. | Ungültige Payload-Werte erzeugen Syntaxfehler. | `payload` |
| <a id="on"></a>`on` | `on click -> action save` | `surface`, Policy-Block, Action-Result | Event oder Phase | Bindet Ereignisse oder Action-Ergebnisse. | `->` und `action` sind bei Event Bindings erforderlich. | `target`, `payload` |
| <a id="target"></a>`target` | `on input target email -> action save` | Event Binding | Ziel-Identifier | Schränkt das Event Binding auf ein Ziel ein. | Ziel muss ein Identifier sein. | `on` |
| <a id="arrow-action"></a>`-> action` | `on click -> action save` | Event Binding | Action-Identifier | Verknüpft Ereignis und Action. | Das Keyword `action` ist Pflicht. | `on`, `payload` |
| <a id="payload"></a>`payload` | `payload id from target.dataset.id` | Event-Payload-Block | Name und Source-Pfad | Mappt DOM-, Detail- oder Surface-Kontext in Action-Input. | Payload-Blöcke erlauben nur `payload` und `preventDefault`. | `from`, `input` |
| <a id="prevent-default"></a>`preventDefault` | `preventDefault true` | Event-Payload-Block | Boolean | Dokumentiert, dass der Host das native Default-Verhalten verhindert. | Nur im Event-Payload-Block erlaubt. | `payload` |
| <a id="on-success-reduce"></a>`on success -> reduce` | `on success -> reduce state.app.status.text = result.text` | `action` | Phase, deklarative Operation | Führt den Success-Reducer im verwalteten Modelcommit aus. | Result-Handler brauchen `->`. | `effect`, `reduce` |
| <a id="on-success-emit"></a>`on success -> emit` | `on success -> emit app.loaded` | `action` | Phase, deklarative Operation | Plant ein Ereignis für die erfolgreiche Phase. | Payload-Shape kann separat geprüft werden. | `emit` |
| <a id="on-error-overlay"></a>`on error -> overlay` | `on error -> overlay app.toast` | `action` | Phase, Overlay-Referenz | Bindet Fehlerfeedback an ein Overlay. | Overlay-Referenz muss existieren. | `overlay` |

## Allowed contexts

`execution fastpass`, `input`, `status`, `effect`, `reduce`, `emit` und Action-Result-Handler stehen in `action`. Event Bindings stehen in `surface` oder in Policy-Blöcken von Lifecycle-Operationen.

## Parameters

Eventnamen, Actionnamen und Payload-Schlüssel sind Identifier. DOM-Payload-Mappings verwenden Eventkontextpfade wie `detail.value` oder `target.dataset.id`. Actionwerte verwenden ausdrücklich qualifizierte `state`-, `selector`-, `input`-, `payload`-, `result`- oder `error`-Referenzen. Literale bleiben von diesen Referenzen getrennt.

## Description

Actions sind deklarative Übergänge. Sie beschreiben, was geändert oder veröffentlicht werden soll; der Host entscheidet, wie konkrete Adapter ausgeführt werden.

### Werte, Referenzen und Result-Handler

Der Compiler normalisiert `on success -> ...` und `on error -> ...` zu geschlossenen Handlerrecords. Unterstützt sind genau `reduce`, `emit` und `overlay`. Phase, Operation, Payloadnamen und Referenzen bleiben Daten; Handlertext wird nicht als JavaScript ausgeführt. Unbekannte Phasen, Handlerarten, unsichere Pfade oder Overlayoptionen werden diagnostiziert.

Reducer akzeptieren skalare Literale oder ausdrücklich qualifizierte Referenzen. `reduce state.copied = state.original` liest den deklarierten Model-State; `reduce state.copied = "state.original"` schreibt dagegen den wörtlichen String. Selectorwerte werden über den Model-Reader aufgelöst. Dieselbe Literal-/Referenztrennung gilt für Emit-Payloads und Overlayoptionen, auch für deklarative Werte mit verschachtelten Referenzen. Ein gleich aussehender String erhält dadurch keine zusätzliche Ausführungsbedeutung.

`on error -> overlay app.toast message error.message tone "danger"` verwendet ein deklariertes Overlay. Erlaubte Optionen sind `message` und `tone`. Die Message wird als Text gerendert. Die acht Tones und ihre kanonische visuelle Abbildung stehen im [Katalog](./rmt-reference-enums-catalogs.md#tones-für-action-result-overlays).

### Ausführungsphasen und Ereignispublikation

Actiontext ist keine imperative Befehlsfolge. Der direkte Executor gruppiert Datenbezug, Reducer und Effekte. Managed Maraca ergänzt Precommit-, Model-/Viewcommit- und Präsentationsphasen. Bestimmte Service-, Stream- und Lazy-Importeffekte laufen vor dem Commit; Präsentation läuft nach dem Rendern. Ein vor einem Reducer geschriebener Navigationseffekt ist deshalb nicht automatisch eine vorher ausgeführte JavaScriptanweisung.

Im verwalteten Maraca-Pfad werden normale `emit`-Deklarationen und Success-Handler-Emits erst nach einem erfolgreichen Model-/Viewcommit publiziert. In der Errorphase kommen nur passende Error-Handler-Emits hinzu, ebenfalls nach dem erfolgreichen Commit dieser Phase. Abgebrochene oder zurückgerollte Commits und ungültige Präsentations-/Lifetime-Tokens publizieren keine entsprechenden Ereignisse. Die Publikation ist ein Runtimeereignis, kein implizites DOM-`CustomEvent` und kein globaler Eventbus.

```js
const unsubscribe = runtime.subscribeEvents(entry => {
  if (entry.type === 'emit') {
    console.log(entry.event, entry.payload, entry.action, entry.correlationId);
  }
});
// Bei Ende des eigenen Abonnements:
unsubscribe();
```

Bei direkter Verwendung von `createRmtActionEffectRuntime` benötigt die Publikation einen ausdrücklich injizierten `effectAdapter.invoke(effect, context)`. Er erhält für `effect.kind === "emit"` den statischen Ereignisnamen und die aufgelöste Payload. Ohne diesen Port entsteht ein strukturiertes Actionfehlergebnis; ein fehlender Publikationsweg ist kein stiller Erfolg. Auch Result-Overlays benötigen einen ausdrücklich bereitgestellten Hostpfad. Ein erfolgreicher Compile-Check belegt die Quell-/Datenform, nicht die Verfügbarkeit aller Hostadapter.

### Eventguards und API-Stände

Ein `when` am Eventbinding bleibt als Condition-AST bis zum Eventrouter erhalten. Falsche Guards verhindern Payloadmapping, Event-Governance und Dispatch. Model-/Selectorwerte kommen aus einem read-only Snapshot; unbekannte oder nicht auflösbare Guards geben keine Freigabe. Details einschließlich Classic-Präzedenz stehen unter [Conditions und Expressions](./rmt-reference-conditions-expressions.md#eventbedingungen-im-maraca-pfad).

Dieser Stand verwendet Classic Compiler API **4.1.0**, den kompatiblen vNext-Compiler-Einstieg **1.2.0**, Event Routing API **3.0.0**, Action Effect API **2.0.0**, Surface Resource Graph API **2.2.1** und DOM Descriptor Renderer API **2.2.0**. Bestehende Classic-AST-/Wire-IDs bleiben erhalten. Damit wird keine neue RMTX-Syntax festgelegt.

Result-Overlays werden innerhalb des deklarierten, eindeutig auflösbaren App-Portals geöffnet. Der Shared Renderer erhält native Portal-Roots auch über weitere View-Commits und nutzt dafür intern die Besitzinformation tatsächlicher Create-Node-Aufträge. HTML-Attribute und Deskriptormarker verleihen diese Reservierung nicht. Die Portalauflösung bleibt im View-/Resource-Graph-Adapter; der Controller liest kein DOM.


Der native Maraca-View-Lifecycle verwendet den View Projection Adapter **2.0.0** mit Schema `.v2`; ein ausdrücklich gewählter `.v1`-Port bleibt unterstützt. Close verbirgt die native Ansicht, Resume erhält ihre Identität und vorhandene Sichtbarkeitswerte. Destroy beendet alte Presentation-Tokens und entfernt die native Ansicht, ohne aktive fremde Roots über ihre Eltern indirekt zu entfernen. Ein normaler Model-/Viewcommit belebt zerstörte Owner nicht wieder: Der Managed-Pfad setzt `materialize(..., { preserveDestroyed: true })`; eine neue Generation erfordert einen ausdrücklichen Lifecycle-Recreate. DOM-Projektion bleibt Viewarbeit, und die existierenden Kernel-/Fabric-/Modelgrenzen bleiben erhalten.

### Component-Commands

Eine Action darf die öffentlichen Methoden einer geeigneten, statisch bekannten Surface über genau diese Formen aufrufen:

```rmt
template reference.componentCommands {
  state editor.command type object preserve {
    initial {
      last "idle"
    }
  }

  action editor.focus {
    effect focus selector maraca.testbench.editor
    reduce state.editor.command.last = "focus"
  }

  action editor.reset {
    effect reset selector maraca.testbench.editor
    reduce state.editor.command.last = "reset"
  }

  action editor.capture {
    effect snapshot selector maraca.testbench.editor
    reduce state.editor.command.last = "snapshot"
  }

  surface maraca.testbench.editor kind field component x-textarea {
  }
}
```

`selector` ist hier die Autorisierungsform für eine statische Surface-ID; der Compiler löst sie auf ein `surface`-Ziel mit Component-Typ auf. Derzeit ist dieser Vertrag für `x-textarea` und ausschließlich für `focus()`, `reset()` und `snapshot()` freigegeben. Unbekannte Surfaces, ungeeignete Components, andere Source-Arten und beliebige Methodennamen sind harte Compilerfehler mit Source-Range.

Maraca führt den Command nach Rendern und Hydration innerhalb des Orchestrierungs-Roots aus. Es gibt keinen Document-Fallback und keinen Zugriff auf Shadow Roots. Das Action-Ergebnis bleibt in `XTendMaraca.orchestration.snapshot().actions[]` sichtbar. `effects[].value.result` hat den Vertrag `xtend.maraca.component-command-result.v1` mit `command`, `surfaceId`, `component` und `result`; bei `focus` und `reset` ist `result` `null`, bei `snapshot` enthält es den öffentlichen XTextarea-Snapshot. Ein Component-Command verändert nicht automatisch RMT-State.

### FastPass (0.8.0)

```rmt
template reference.fastpass {
  action showReports {
    execution fastpass
    effect navigation "#reports"
  }
  action dismissPanel {
    execution fastpass
    effect close surface panel
  }
  action focusNavigation {
    execution fastpass
    effect focus surface navigation
  }
  surface panel kind panel component x-section {}
  surface navigation kind panel component x-section {}
}
```

Navigation akzeptiert einen literalen Pfad oder einen deklarierten Input wie `input path string` mit `effect navigation input.path`. Close und Fokus beziehen sich auf benannte Surfaces. FastPass-Fokus verwendet den Fokus-Port; die Beschränkung des separaten `selector`-Component-Command-Vertrags auf `x-textarea` gilt hier nicht. Event-Bindings und `dispatchCommand()` wählen für deklarierte FastPass-Actions denselben Executor; `dispatchFastPass()` liefert einen abbrechbaren Job. Navigation und Fokus werden pro Scope zusammengeführt. Die fachliche Command-Reihenfolge bleibt erhalten.

Details zu Grenzen, Ports und Präsentationsepochen: [FastPass und Abort Boundary](./maraca-fastpass-abort-boundary.md).

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
    emit ticket.completed with id input.id
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

Falsche Action-Clauses, fehlende Reducer, unbekannte Overlay-Referenzen, ungültige Component-Commands und fehlende Payload-Contracts werden vom Parser, Linter, Compiler oder Semantic Graph gemeldet.

## Related operators

`action`, `state`, `datasource`, `overlay`, `surface`, `on`, `emit`.

## Weiterführend

Der RMT-Referenzindex ordnet Action- und Event-Records in das vollständige Sprachmodell ein. [Verwandter Artikel](./rmt-reference.md)
