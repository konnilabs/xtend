# RMT Reference: Conditions und Expressions

`tools/rmt-language/vnext-parser.js` ist die Source of Truth für Operatoren und Operandenformen.

Conditions stehen nach `when` und verwenden eine kleine, deklarative Ausdruckssprache.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="when"></a>`when` | `when app.ready == true` | Lifecycle, `stream`, Event Binding | Condition-Ausdruck | Aktiviert Arbeit nur bei erfüllter Bedingung. | Ausdruck muss vollständig sein. | `mount`, `on` |
| <a id="and"></a>`&&` | `a == true && b == false` | Condition | linker und rechter Ausdruck | Logisches UND. | Rechte Seite muss Ausdruck sein. | `||` |
| <a id="or"></a>`||` | `a == true || b == true` | Condition | linker und rechter Ausdruck | Logisches ODER. | Rechte Seite muss Ausdruck sein. | `&&` |
| <a id="not"></a>`!` | `!app.disabled` | Condition | Ausdruck | Negiert einen Boolean-Pfad oder Ausdruck. | Argument muss Ausdruck sein. | `when` |
| <a id="equal"></a>`==` | `app.status == "ready"` | Condition | zwei Werte | Gleichheitsvergleich. | Beide Seiten müssen parsebar sein. | `!=` |
| <a id="not-equal"></a>`!=` | `app.status != "error"` | Condition | zwei Werte | Ungleichheitsvergleich. | Beide Seiten müssen parsebar sein. | `==` |
| <a id="greater-than"></a>`>` | `app.count > 0` | Condition | zwei Werte | Größer-als-Vergleich. | Beide Seiten müssen parsebar sein. | `>=` |
| <a id="greater-equal"></a>`>=` | `app.count >= 1` | Condition | zwei Werte | Größer-gleich-Vergleich. | Beide Seiten müssen parsebar sein. | `>` |
| <a id="less-than"></a>`<` | `app.count < 10` | Condition | zwei Werte | Kleiner-als-Vergleich. | Beide Seiten müssen parsebar sein. | `<=` |
| <a id="less-equal"></a>`<=` | `app.count <= 10` | Condition | zwei Werte | Kleiner-gleich-Vergleich. | Beide Seiten müssen parsebar sein. | `<` |
| <a id="grouping"></a>`()` | `(app.ready == true)` | Condition | Ausdruck | Gruppiert Logik. | Schließende Klammer ist Pflicht. | `&&`, `||` |
| <a id="literal-true"></a>`true` | `app.ready == true` | Condition, Primitive-Wert | Literal | Boolean wahr. | Funktionsaufrufe sind nicht erlaubt. | `false` |
| <a id="literal-false"></a>`false` | `app.disabled == false` | Condition, Primitive-Wert | Literal | Boolean falsch. | Funktionsaufrufe sind nicht erlaubt. | `true` |
| <a id="literal-null"></a>`null` | `app.value != null` | Condition, Primitive-Wert | Literal | Nullwert. | Nur als Literal. | `!=` |
| <a id="strings"></a>Strings | `"ready"` | Condition, Primitive-Wert | quoted string | Statischer Textwert. | Strings brauchen Anführungszeichen. | `contract`, `message` |
| <a id="integers"></a>Integers | `120` | Condition, Primitive-Wert | Ganzzahl | Numerischer Wert. | Nur Ganzzahlen werden tokenisiert. | `durationMs`, `weight` |
| <a id="paths"></a>Paths | `app.status.text` | Condition, Payload, Reducer | qualifizierter Pfad | Referenziert State, Input, Detail, Target oder Surface-Kontext. | Pfad muss Identifier-Segmente enthalten. | `payload`, `reduce` |

## Allowed contexts

Conditions stehen nach `when`. Literale und Pfade erscheinen außerdem in Primitive-Werten, Payload-Mappings und Reducer-Ausdrücken.

## Parameters

Conditions erlauben Pfade, Strings, Integers, `true`, `false`, `null`, Vergleiche, `!`, `&&`, `||` und Klammern.

## Description

Die Condition-Sprache ist bewusst kleiner als JavaScript. Sie erlaubt Entscheidungen, aber keine Funktionsaufrufe und keine freie Ausführung.

## Examples

```rmt
template reference.conditions {
  state app.ready type boolean initial true
  state app.disabled type boolean initial false
  state app.count type number initial 2
  portal app.root root "#app" layer surface

  surface shell kind page component x-section {
    portal app.root
    lane visible weight 80 {
      mount shell.card from endpoint app.card when (app.ready == true && !app.disabled) || app.count >= 1
    }
  }
}
```

## Diagnostics

Funktionsaufrufe wie `isReady()` sind nicht erlaubt und erzeugen Parser-Diagnosen. Fehlende Klammern oder unvollständige Vergleiche werden ebenfalls gemeldet.

## Related operators

`when`, `mount`, `stream`, `on`, `payload`, `reduce`.

## Weiterführend

Der RMT-Referenzindex zeigt, welche Records Conditions und Expressions akzeptieren. [Verwandter Artikel](./rmt-reference.md)
