# RMT Reference: Conditions und Expressions

`tools/rmt-language/vnext-parser.js` definiert die Quellformen von RMT Classic. Compiler und jeweiliger Auswerter bestimmen deren Bedeutung im gewählten Ausführungsprofil.

Conditions stehen nach `when` und verwenden eine kleine, deklarative Ausdruckssprache.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="when"></a>`when` | `when app.ready == true` | Lifecycle, `stream`, Event Binding | Condition-Ausdruck | Aktiviert Arbeit nur bei erfüllter Bedingung. | Ausdruck muss vollständig sein. | `mount`, `on` |
| <a id="and"></a>`&&` | `a == true && b == false` | Condition | linker und rechter Ausdruck | Logisches UND. | Rechte Seite muss Ausdruck sein. | `\|\|` |
| <a id="or"></a>`\|\|` | `a == true \|\| b == true` | Condition | linker und rechter Ausdruck | Logisches ODER. | Rechte Seite muss Ausdruck sein. | `&&` |
| <a id="not"></a>`!` | `!app.disabled` | Condition | Ausdruck | Negiert einen Boolean-Pfad oder Ausdruck. | Argument muss Ausdruck sein. | `when` |
| <a id="equal"></a>`==` | `app.status == "ready"` | Condition | zwei Werte | Strikter Gleichheitsvergleich ohne Typkonversion. | Beide Seiten müssen parsebar sein. | `!=` |
| <a id="not-equal"></a>`!=` | `app.status != "error"` | Condition | zwei Werte | Strikter Ungleichheitsvergleich ohne Typkonversion. | Beide Seiten müssen parsebar sein. | `==` |
| <a id="greater-than"></a>`>` | `app.count > 0` | Condition | zwei Werte | Größer-als-Vergleich. | Beide Seiten müssen parsebar sein. | `>=` |
| <a id="greater-equal"></a>`>=` | `app.count >= 1` | Condition | zwei Werte | Größer-gleich-Vergleich. | Beide Seiten müssen parsebar sein. | `>` |
| <a id="less-than"></a>`<` | `app.count < 10` | Condition | zwei Werte | Kleiner-als-Vergleich. | Beide Seiten müssen parsebar sein. | `<=` |
| <a id="less-equal"></a>`<=` | `app.count <= 10` | Condition | zwei Werte | Kleiner-gleich-Vergleich. | Beide Seiten müssen parsebar sein. | `<` |
| <a id="grouping"></a>`()` | `(app.ready == true)` | Condition | Ausdruck | Gruppiert Logik. | Schließende Klammer ist Pflicht. | `&&`, `\|\|` |
| <a id="literal-true"></a>`true` | `app.ready == true` | Condition, Primitive-Wert | Literal | Boolean wahr. | Funktionsaufrufe sind nicht erlaubt. | `false` |
| <a id="literal-false"></a>`false` | `app.disabled == false` | Condition, Primitive-Wert | Literal | Boolean falsch. | Funktionsaufrufe sind nicht erlaubt. | `true` |
| <a id="literal-null"></a>`null` | `app.value != null` | Condition, Primitive-Wert | Literal | Nullwert. | Nur als Literal. | `!=` |
| <a id="strings"></a>Strings | `"ready"` | Condition, Primitive-Wert | quoted string | Statischer Textwert. | Strings brauchen Anführungszeichen. | `contract`, `message` |
| <a id="integers"></a>Zahlen | `120`, `0.5` | Condition, Primitive-Wert | Ganz- oder Dezimalzahl | Endlicher numerischer Wert. | Dezimalzahlen sind erlaubt; einzelne Clauses wie `weight` verlangen weiterhin Ganzzahlen. | `durationMs`, `weight` |
| <a id="paths"></a>Paths | `app.status.text` | Condition, Payload, Reducer | qualifizierter Pfad | Referenziert einen im jeweiligen Kontext verfügbaren Model- oder Eventpfad. | Pfad muss Identifier-Segmente enthalten. | `payload`, `reduce` |

## Allowed contexts

Conditions stehen nach `when`. Literale und Pfade erscheinen außerdem in Primitive-Werten, Payload-Mappings und Reducer-Ausdrücken.

## Parameters

Conditions erlauben Pfade, Strings, Ganz- und Dezimalzahlen, `true`, `false`, `null`, Vergleiche, `!`, `&&`, `||` und Klammern.

## Description

Die Condition-Sprache ist bewusst kleiner als JavaScript. Sie erlaubt Entscheidungen, aber keine freien Funktionsaufrufe und keine freie Ausführung. Das zusätzliche `contains(a, b)` ist ausschließlich eine Selector-Ausdrucksform.

### Präzedenz und Vergleich

Classic bindet von stark nach schwach: Primärausdruck/Klammern, Vergleich, `!`, `&&`, `||`. Daher bedeutet `!app.name == null` **`!(app.name == null)`**. Für die JavaScript-artige Gruppierung schreibe ausdrücklich `(!app.name) == null`. Ein Texttransfer in JavaScript oder TSX muss diese unterschiedliche Präzedenz berücksichtigen.

`==` und `!=` werden als strikte Gleichheit beziehungsweise Ungleichheit ausgewertet: Zahl `1` ist nicht gleich String `"1"`. Die JavaScript-Schreibweisen `===` und `!==` gehören nicht zur heutigen Classic-Grammatik. Arithmetik, Kettenvergleiche, Optional Chaining und beliebige Methodenaufrufe sind ebenfalls keine allgemeinen Classic-Conditionformen.

Das Selector-Lowering bildet `a && b` auf `a ? b : false` und `a || b` auf `a ? true : b` ab. Der Eventguard erhält diese Werte auch innerhalb eines weiteren Vergleichs; erst sein Gesamtergebnis entscheidet über die Freigabe. Das ist kein allgemeiner Vertrag für JavaScripts Rückgabe des linken Operanden. Für klare Conditions sollten logische Operanden boolesch sein.

Im Model-Selector bedeutet `contains(a, b)` String-Containment nach Stringkonversion. Beispielsweise kann `contains(item.tags, "1")` für `tags: ["10"]` wahr sein. Das ist kein allgemeiner Alias für `Array.includes`. Modelausdruck, Filterregel, DOM-Renderausdruck und portable Node-/PHP-Profile haben getrennte Operatorfähigkeiten; ein gültiger Selectoroperator ist nicht automatisch ein gültiger Renderausdruck.

### Eventbedingungen im Maraca-Pfad

Der Compiler erhält den Condition-AST über Core und AppPlatform bis zum Eventbinding. Event Routing API **3.0.0** prüft dessen geschlossene Literal-, Pfad-, Gruppen-, Unary-, Vergleichs- und Logikknoten ohne JavaScript-Auswertung. Eine falsche Bedingung verhindert Payloadmapping, Event-Governance und Actiondispatch; das gilt auch für Literal-`false`.

Model- und Selectorpfade werden aus einem injizierten **read-only `modelReader.snapshot()`-Port** gelesen. Ein Snapshot versorgt den gesamten Guard. `state.app.ready` und `selector.appView.name` wählen ihren Namensraum ausdrücklich; unqualifizierte Namen verwenden das längste eindeutige deklarierte Symbolpräfix. Eventwurzeln wie `detail`, `event`, `target`, `currentTarget`, `source`, `metadata` und `binding` stammen aus dem Routingkontext, nicht aus beliebigen globalen Variablen.

Fehlende oder mehrdeutige Pfade, unbekannte Ausdrucksformen, unsichere Prototypepfade und ein fehlgeschlagener Modelport geben keine Freigabe. Der Guard begrenzt Ausdrücke auf 64 Verschachtelungsebenen, 1.024 Knoten und 128 Pfadsegmente. Logische Kurzschlussauswertung liest keine unbenötigten Eventwerte; auch ein nicht gewählter Zweig muss jedoch strukturell gültig sein. Diese konkrete Eventauswertung ist kein pauschaler Ausführungsnachweis für jeden Lifecycle- oder Streamadapter.

Integers (Ganzzahlen) und Dezimalzahlen sind numerische Literale; `weight` verlangt weiterhin eine nichtnegative Ganzzahl.

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
