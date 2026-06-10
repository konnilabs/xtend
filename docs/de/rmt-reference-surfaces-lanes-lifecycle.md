# RMT Reference: Surfaces, Lanes und Lifecycle

Surfaces beschreiben UI-Flächen. Lanes planen Arbeit. Lifecycle-Operationen beschreiben, welche Arbeit in einer Lane passiert.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="kind"></a>`kind` | `surface shell kind page` | Surface-Header, Overlay, Resource | Katalogwert oder Identifier | Klassifiziert Surface, Overlay oder Resource. | Surface-Header erlaubt nur `kind` und `component`. | `component` |
| <a id="component"></a>`component` | `component x-section` | Surface-Header | Custom-Element-Name oder Identifier | Bindet eine Host-Komponente. | Unerwartete Header-Clauses werden gemeldet. | `surface` |
| <a id="source"></a>`source` | `source selector app.items` | Surface, Resource | Source-Art und Referenz | Bindet einen Primitive-Record als Quelle. | Fehlende Referenzen werden semantisch gemeldet. | `repeat from` |
| <a id="repeat-from"></a>`repeat from` | `repeat from selector app.items` | Surface | Source-Referenz | Erzeugt wiederholte Surface-Instanzen. | Repeater brauchen stabile Keys. | `key` |
| <a id="key"></a>`key` | `key item.id` | Surface | Pfad | Deklariert den stabilen Repeater-Key. | Unkeyed Repeater können blockiert werden. | `repeat from` |
| <a id="bounds"></a>`bounds` | `bounds x 0 y 0 width 640 height 400` | Surface | Schlüssel/Wert-Paare | Setzt initiale Geometrie. | Bounds-Keys brauchen Werte. | `surface` |
| <a id="preserve-on-minimize"></a>`preserve on minimize` | `preserve on minimize` | Surface | Raw-Clause | Erhält Surface-State beim Minimieren. | Nur in Surface erlaubt. | `preserve` |
| <a id="destroy-releases"></a>`destroy releases` | `destroy releases resource app.stream` | Surface | Resource-Referenz | Bindet Surface-Destroy an Resource-Cleanup. | Resource muss existieren. | `resource`, `dispose` |
| <a id="lane"></a>`lane` | `lane visible weight 80 { ... }` | Surface | Lane-Name, optional `weight` | Gruppiert geplante Arbeit. | Lanes dürfen nur Lifecycle oder `stream` enthalten. | `weight`, `mount` |
| <a id="weight"></a>`weight` | `weight 80` | Lane-Header | nichtnegative Ganzzahl | Priorisiert Lane-Arbeit. | Gewicht muss eine nichtnegative Ganzzahl sein. | `lane` |
| <a id="mount"></a>`mount` | `mount card from endpoint app.card` | Lane, Slot | Target, optionale Source, Condition, Policy | Materialisiert neue UI-Arbeit. | Operationen dürfen nicht top-level stehen. | `slot`, `when` |
| <a id="hydrate"></a>`hydrate` | `hydrate card from selector app.card` | Lane, Slot | Target, Source | Füllt vorhandene UI mit Daten. | Source-Art muss erlaubt sein. | `hydration policy` |
| <a id="suspend"></a>`suspend` | `suspend card` | Lane, Slot | Target | Pausiert eine UI- oder Resource-Einheit. | Nur in Lane oder Slot erlaubt. | `resume` |
| <a id="resume"></a>`resume` | `resume card` | Lane, Slot | Target | Setzt pausierte Arbeit fort. | Nur in Lane oder Slot erlaubt. | `suspend` |
| <a id="invalidate"></a>`invalidate` | `invalidate card` | Lane, Slot | Target | Markiert Arbeit als neu zu berechnen. | Nur in Lane oder Slot erlaubt. | `update` |
| <a id="dispose"></a>`dispose` | `dispose card` | Lane, Slot, Resource-Block | Target oder Cleanup-Text | Gibt Arbeit oder Resource frei. | Falscher Kontext wird gemeldet. | `destroy releases` |
| <a id="prewarm"></a>`prewarm` | `prewarm data from worker prepare` | Lane, Slot | Target, Source | Bereitet Daten oder UI vor, bevor sie sichtbar werden. | Source-Art muss statisch sein. | `worker`, `idle` |
| <a id="recycle"></a>`recycle` | `recycle row from resource pool` | Lane, Slot | Target, Source | Verwendet vorhandene Instanzen wieder. | Resource muss existieren. | `resource` |
| <a id="detach"></a>`detach` | `detach panel` | Lane, Slot | Target | Trennt eine Surface-Einheit vom aktuellen Host-Kontext. | Nur in Lane oder Slot erlaubt. | `reattach` |
| <a id="reattach"></a>`reattach` | `reattach panel` | Lane, Slot | Target | Bindet eine getrennte Einheit wieder ein. | Nur in Lane oder Slot erlaubt. | `detach` |
| <a id="stream"></a>`stream` | `stream feed from sse app.feed` | Lane, Slot | Target, Source | Beschreibt inkrementelle Rendering-Daten. | `stream` verlangt eine Datenquelle. | `sse`, `sanitize` |
| <a id="slot"></a>`slot` | `slot header { hydrate title from selector app.title }` | Policy-Block | Slotname | Gruppiert Operationen in einem Composition-Slot. | Slots erlauben nur Lifecycle oder `stream`. | `mount`, `hydrate` |

## Allowed contexts

`lane` steht direkt in `surface`. Lifecycle-Operationen und `stream` stehen in `lane` oder `slot`. `slot`, `on`, `trust`, `hydration`, `isolation` und `sanitize` stehen in Policy-Blöcken von Lifecycle-Operationen.

## Parameters

Targets sind Identifier. Sources folgen `from <kind> <target>`. Conditions folgen `when`. Policy-Blöcke verwenden geschweifte Klammern.

## Description

Lifecycle-Syntax trennt sichtbare Arbeit, user-blocking Interaktion, Hintergrundarbeit und Diagnostics. Der Host kann diese Records auf Scheduler-Lanes abbilden, ohne freie Funktionen aus der RMT-Quelle auszuführen.

## Examples

```rmt
template reference.lifecycle {
  state app.ready type boolean initial true
  state app.status type object preserve {
    initial {
      text "Ready"
    }
  }
  selector app.header from state app.status {
    output HeaderView
  }
  selector app.cardView from state app.status {
    output CardView
  }
  resource app.stream kind stream owner surface.shell
  resource app.pool kind object-url owner surface.shell
  portal app.root root "#app" layer surface

  surface shell kind page component x-section {
    portal app.root
    bounds x 0 y 0 width 640 height 400
    preserve on minimize
    destroy releases resource app.stream
    lane visible weight 90 {
      mount shell.card from endpoint app.card when app.ready == true {
        slot header {
          hydrate header.view from selector app.header
        }
        on click ".save" -> action app.save {
          payload id from target.dataset.id
          preventDefault true
        }
      }
      hydrate shell.card from selector app.cardView
      suspend shell.card
      resume shell.card
      invalidate shell.card
      dispose shell.card
      prewarm shell.data from worker app.prepare
      recycle shell.row from resource app.pool
      detach shell.panel
      reattach shell.panel
      stream shell.feed from sse app.feed
    }
  }

  action app.save {
    input id string
    reduce state.app.status.text = "Saved"
    emit app.saved with id input.id
  }
}
```

## Diagnostics

Lifecycle- und Stream-Statements außerhalb von Lane oder Slot erzeugen Kontextdiagnosen. Fehlende Selector-, Resource- oder Action-Referenzen werden semantisch gemeldet.

## Related operators

`surface`, `portal`, `source`, `when`, `slot`, `on`, `resource`, `trust boundary`.
