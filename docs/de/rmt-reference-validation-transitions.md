# RMT Reference: Validation und Transitions

Validation blockiert deklarativ Actions. Transitions beschreiben den Wechsel zwischen Surface-Gruppen.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="mode-blocking"></a>`mode blocking` | `mode blocking` | `validation` | Modus `blocking` | Blockiert Ziel-Actions bei ungültigen Feldern. | Unbekannte Modi werden gemeldet. | `target action` |
| <a id="target-action"></a>`target action` | `target action submit` | `validation` | Action-Referenz | Bestimmt, welche Action validiert wird. | Target-Kind und Referenz müssen vorhanden sein. | `action` |
| <a id="field"></a>`field` | `field app.email required email` | `validation` | State-Pfad, Regeln | Deklariert ein validiertes Feld. | Nur bekannte Regeln sind erlaubt. | `required`, `message` |
| <a id="required"></a>`required` | `required` | `field` | Flag | Feld muss einen Wert besitzen. | Nur in `field`. | `message` |
| <a id="email"></a>`email` | `email` | `field` | Flag | Feld muss E-Mail-Form haben. | Nur in `field`. | `pattern` |
| <a id="minLength"></a>`minLength` | `minLength 3` | `field` | Zahl | Setzt minimale Zeichenanzahl. | Wert muss folgen. | `maxLength` |
| <a id="maxLength"></a>`maxLength` | `maxLength 80` | `field` | Zahl | Setzt maximale Zeichenanzahl. | Wert muss folgen. | `minLength` |
| <a id="pattern"></a>`pattern` | `pattern "^[a-z]+$"` | `field` | String | Deklariert einen Pattern-Vertrag. | Wert muss folgen. | `email` |
| <a id="message"></a>`message` | `message "Enter email"` | `field` | String | Liefert eine nutzbare Fehlermeldung. | Wert muss folgen. | `field` |
| <a id="include"></a>`include` | `include shared.email` | `validation` | Validation-Referenz | Bezieht eine andere Validation-Gruppe ein. | Referenz muss vorhanden sein. | `validation` |
| <a id="trigger-action"></a>`trigger action` | `trigger action submit` | `transition` | Action-Referenz | Startet den Surface-Wechsel nach einer Action. | Trigger-Kind muss vorhanden sein. | `action` |
| <a id="from-surfaces"></a>`from surfaces` | `from surfaces [form]` | `transition` | Array oder Wert | Deklariert ausgehende Surface-Gruppe. | Wert muss parsebar sein. | `to surfaces` |
| <a id="to-surfaces"></a>`to surfaces` | `to surfaces [done]` | `transition` | Array oder Wert | Deklariert eingehende Surface-Gruppe. | Wert muss parsebar sein. | `from surfaces` |
| <a id="use-animation"></a>`use animation` | `use animation app.motion` | `transition` | Animation-Referenz | Verwendet ein benanntes AnimationEngine-Preset wieder. | Referenz muss einen Animation-Record benennen. | `animation` |
| <a id="transition-effect"></a>`effect` | `effect slide-left` | `transition` | Effektname | Wählt den visuellen Wechsel. | Unbekannte Effekte können katalogseitig gemeldet werden. | `durationMs` |
| <a id="durationMs"></a>`durationMs` | `durationMs 220` | `transition` | Zahl | Setzt Dauer in Millisekunden. | Wert muss folgen. | `easing` |
| <a id="easing"></a>`easing` | `easing "ease-out"` | `transition` | String | Setzt CSS-Easing. | Wert muss folgen. | `effect` |
| <a id="timeline"></a>`timeline` | `timeline enter then exit` | `transition` | Timeline-Modus | Deklariert Enter-/Exit-Sequenzierung. | Unbekannte Timeline-Modi werden gemeldet. | `effect` |
| <a id="layoutKey"></a>`layoutKey` | `layoutKey "card"` | `transition` | stabiler Key | Bindet `shared-element` und `layout-flip` an einen Layout-Key. | Für layoutbewusste Effekte erforderlich. | `shared-element`, `layout-flip` |
| <a id="interrupt"></a>`interrupt` | `interrupt replace` | `transition` | `cancel`, `finish` oder `replace` | Wählt, wie eine laufende Transition unterbrochen wird. | Unbekannte Policies werden gemeldet. | `trigger action` |
| <a id="reducedMotion"></a>`reducedMotion` | `reducedMotion fade` | `transition` | `instant`, `fade` oder `none` | Deklariert den Fallback für Reduced-Motion-Hosts. | Unbekannte Policies werden gemeldet. | `durationMs` |
| <a id="lane-transition"></a>`lane transition` | `lane transition` | `transition` | Lane-Name | Plant den Wechsel auf der Transition-Lane. | Lane muss vorhanden oder katalogisiert sein. | `lane` |

## Allowed contexts

Validation-Clauses stehen nur in `validation`. Transition-Clauses stehen nur in `transition`.

## Parameters

Validation-Felder zeigen auf State-Pfade. Transitions zeigen auf Surface-Identifier und Action-Trigger.

## Description

Validation und Transitions bleiben deklarativ, damit Formularfluss und Surface-Wechsel prüfbar bleiben.

## Examples

```rmt
template reference.validation {
  state contact.email type string initial ""
  state app.status type object preserve {
    initial {
      text "Ready"
    }
  }

  action contact.next {
    input email string
    reduce state.app.status.text = "Next"
    emit contact.nextRequested with email input.email
  }

  validation contact.form {
    mode blocking
    target action contact.next
    field contact.email required email minLength 3 maxLength 80 pattern ".+@.+" message "Enter a valid email."
    include shared.email
  }

  animation contact.motion {
    effect fade
    durationMs 180
    reducedMotion fade
  }

  transition contact.toSummary {
    trigger action contact.next
    from surfaces [contact.form]
    to surfaces [contact.summary]
    use animation contact.motion
    effect slide-left
    durationMs 220
    easing "ease-out"
    timeline enter then exit
    layoutKey "contact-summary"
    interrupt replace
    reducedMotion fade
    lane transition
  }

  portal app.root root "#app" layer surface
  surface contact.form kind form component x-form {
    portal app.root
    lane user-blocking weight 85 {
      mount contact.form from endpoint contact.form
    }
  }
}
```

## Diagnostics

Unbekannte Field-Regeln, fehlende Action-Targets, unvollständige Transition-Targets und fehlende `layoutKey`-Werte bei layoutbewussten Effekten werden gemeldet.

## Related operators

`action`, `field`, `surface`, `lane`, `effect`, `payload`, `animation`, `use animation`.
