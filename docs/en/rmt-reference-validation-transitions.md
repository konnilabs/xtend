# RMT Reference: Validation and Transitions

Validation declaratively blocks actions. Transitions describe the change between surface groups.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="mode-blocking"></a>`mode blocking` | `mode blocking` | `validation` | mode `blocking` | Blocks target actions while fields are invalid. | Unknown modes are reported. | `target action` |
| <a id="target-action"></a>`target action` | `target action submit` | `validation` | action reference | Selects which action is validated. | Target kind and reference must be present. | `action` |
| <a id="field"></a>`field` | `field app.email required email` | `validation` | state path, rules | Declares a validated field. | Only known rules are allowed. | `required`, `message` |
| <a id="required"></a>`required` | `required` | `field` | flag | Field must have a value. | Only valid in `field`. | `message` |
| <a id="email"></a>`email` | `email` | `field` | flag | Field must have email shape. | Only valid in `field`. | `pattern` |
| <a id="minLength"></a>`minLength` | `minLength 3` | `field` | number | Sets minimum length. | Value must follow. | `maxLength` |
| <a id="maxLength"></a>`maxLength` | `maxLength 80` | `field` | number | Sets maximum length. | Value must follow. | `minLength` |
| <a id="pattern"></a>`pattern` | `pattern "^[a-z]+$"` | `field` | string | Declares a pattern contract. | Value must follow. | `email` |
| <a id="message"></a>`message` | `message "Enter email"` | `field` | string | Provides a usable validation message. | Value must follow. | `field` |
| <a id="include"></a>`include` | `include shared.email` | `validation` | validation reference | Includes another validation group. | Reference must exist. | `validation` |
| <a id="trigger-action"></a>`trigger action` | `trigger action submit` | `transition` | action reference | Starts the surface change after an action. | Trigger kind must be present. | `action` |
| <a id="from-surfaces"></a>`from surfaces` | `from surfaces [form]` | `transition` | array or value | Declares outgoing surface group. | Value must parse. | `to surfaces` |
| <a id="to-surfaces"></a>`to surfaces` | `to surfaces [done]` | `transition` | array or value | Declares incoming surface group. | Value must parse. | `from surfaces` |
| <a id="use-animation"></a>`use animation` | `use animation app.motion` | `transition` | animation reference | Reuses a named AnimationEngine preset. | Reference must name an animation record. | `animation` |
| <a id="transition-effect"></a>`effect` | `effect slide-left` | `transition` | effect name | Selects the visual change. | Unknown effects can be catalog diagnostics. | `durationMs` |
| <a id="durationMs"></a>`durationMs` | `durationMs 220` | `transition` | number | Sets duration in milliseconds. | Value must follow. | `easing` |
| <a id="easing"></a>`easing` | `easing "ease-out"` | `transition` | string | Sets CSS easing. | Value must follow. | `effect` |
| <a id="timeline"></a>`timeline` | `timeline enter then exit` | `transition` | timeline mode | Declares enter/exit sequencing. | Unknown timeline modes are reported. | `effect` |
| <a id="layoutKey"></a>`layoutKey` | `layoutKey "card"` | `transition` | stable key | Binds `shared-element` and `layout-flip` motion to a layout key. | Required for layout-aware effects. | `shared-element`, `layout-flip` |
| <a id="interrupt"></a>`interrupt` | `interrupt replace` | `transition` | `cancel`, `finish` or `replace` | Selects how a running transition is interrupted. | Unknown policies are reported. | `trigger action` |
| <a id="reducedMotion"></a>`reducedMotion` | `reducedMotion fade` | `transition` | `instant`, `fade` or `none` | Declares the fallback for reduced-motion hosts. | Unknown policies are reported. | `durationMs` |
| <a id="lane-transition"></a>`lane transition` | `lane transition` | `transition` | lane name | Schedules the change on the transition lane. | Lane must exist or be cataloged. | `lane` |

## Allowed contexts

Validation clauses belong only in `validation`. Transition clauses belong only in `transition`.

## Parameters

Validation fields point to state paths. Transitions point to surface identifiers and action triggers.

## Description

Validation and transitions stay declarative so form flow and surface changes remain inspectable.

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

Unknown field rules, missing action targets, incomplete transition targets and missing `layoutKey` values for layout-aware effects are reported.

## Related operators

`action`, `field`, `surface`, `lane`, `effect`, `payload`, `animation`, `use animation`.
