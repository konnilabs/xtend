# RMT Reference

Diese Rubrik ist die alphabetisch und thematisch geordnete Referenz für RMT vNext. Der Lernpfad erklärt den Einstieg; die Referenz erklärt die genaue Bedeutung jedes Operators, jedes Schlüsselworts und der festen Katalogwerte.

JSON-RMT ist kein normaler Authoring-Pfad mehr. Es bleibt nur als Compatibility-Testmaterial erhalten.

## Syntax

RMT vNext ist blockbasiert. Ein Dokument besteht aus Top-Level-Deklarationen wie `import`, `template`, `surface`, `remote surface`, `state`, `selector`, `datasource`, `action`, `portal`, `overlay`, `resource`, `validation` und `transition`.

## Allowed contexts

Operatoren sind kontextabhängig. `lane` ist nur in `surface` erlaubt, Lifecycle-Operationen wie `mount` und `hydrate` sind nur in `lane` oder `slot` erlaubt, und Event-Payloads stehen nur in `on ... -> action` Blöcken.

## Parameters

Parameter sind statische Werte, Identifier, Pfade, Strings, Zahlen, Booleans, Arrays oder einfache Condition-Ausdrücke. RMT vNext erlaubt keine Funktionsaufrufe in `when`.

## Description

- [Document, Template und Import](./rmt-reference-document-template-import.md)
- [Primitives](./rmt-reference-primitives.md)
- [State, Selectors und Data](./rmt-reference-state-selectors-data.md)
- [Actions und Events](./rmt-reference-actions-events.md)
- [Surfaces, Lanes und Lifecycle](./rmt-reference-surfaces-lanes-lifecycle.md)
- [Validation und Transitions](./rmt-reference-validation-transitions.md)
- [Security und Policies](./rmt-reference-security-policies.md)
- [Remote Surfaces](./rmt-reference-remote-surfaces.md)
- [Conditions und Expressions](./rmt-reference-conditions-expressions.md)
- [Enums und Catalogs](./rmt-reference-enums-catalogs.md)

## Examples

```rmt
template reference.overview {
  state app.status type object preserve {
    initial {
      text "Ready"
    }
  }

  selector app.statusView from state app.status {
    output StatusView
  }

  portal app.root root "#app" layer surface

  surface dashboard kind page component x-section {
    portal app.root
    lane visible weight 80 {
      hydrate status.card from selector app.statusView
    }
  }
}
```

## Diagnostics

Der Parser meldet Kontextfehler, wenn ein Operator an der falschen Stelle steht. Der Compiler ergänzt semantische Fehler, wenn ein referenzierter Primitive-Record fehlt oder ein Action-Pfad unvollständig ist.

## Related operators

Beginne mit `template`, `surface`, `state`, `selector`, `action`, `lane`, `mount`, `hydrate`, `on`, `emit` und `when`.
