# RMT Reference: Conditions and Expressions

`tools/rmt-language/vnext-parser.js` defines RMT Classic source forms. The compiler and the selected evaluator determine their meaning in the chosen execution profile.

Conditions appear after `when` and use a small declarative expression language.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="when"></a>`when` | `when app.ready == true` | Lifecycle, `stream`, event binding | condition expression | Enables work only when the condition passes. | Expression must be complete. | `mount`, `on` |
| <a id="and"></a>`&&` | `a == true && b == false` | Condition | left and right expression | Logical AND. | Right side must be an expression. | `\|\|` |
| <a id="or"></a>`\|\|` | `a == true \|\| b == true` | Condition | left and right expression | Logical OR. | Right side must be an expression. | `&&` |
| <a id="not"></a>`!` | `!app.disabled` | Condition | expression | Negates a boolean path or expression. | Argument must be an expression. | `when` |
| <a id="equal"></a>`==` | `app.status == "ready"` | Condition | two values | Strict equality without type coercion. | Both sides must parse. | `!=` |
| <a id="not-equal"></a>`!=` | `app.status != "error"` | Condition | two values | Strict inequality without type coercion. | Both sides must parse. | `==` |
| <a id="greater-than"></a>`>` | `app.count > 0` | Condition | two values | Greater-than comparison. | Both sides must parse. | `>=` |
| <a id="greater-equal"></a>`>=` | `app.count >= 1` | Condition | two values | Greater-than-or-equal comparison. | Both sides must parse. | `>` |
| <a id="less-than"></a>`<` | `app.count < 10` | Condition | two values | Less-than comparison. | Both sides must parse. | `<=` |
| <a id="less-equal"></a>`<=` | `app.count <= 10` | Condition | two values | Less-than-or-equal comparison. | Both sides must parse. | `<` |
| <a id="grouping"></a>`()` | `(app.ready == true)` | Condition | expression | Groups logic. | Closing parenthesis is required. | `&&`, `\|\|` |
| <a id="literal-true"></a>`true` | `app.ready == true` | Condition, primitive value | literal | Boolean true. | Function calls are not allowed. | `false` |
| <a id="literal-false"></a>`false` | `app.disabled == false` | Condition, primitive value | literal | Boolean false. | Function calls are not allowed. | `true` |
| <a id="literal-null"></a>`null` | `app.value != null` | Condition, primitive value | literal | Null value. | Literal only. | `!=` |
| <a id="strings"></a>Strings | `"ready"` | Condition, primitive value | quoted string | Static text value. | Strings need quotes. | `contract`, `message` |
| <a id="integers"></a>Numbers | `120`, `0.5` | Condition, primitive value | integer or decimal | Finite numeric value. | Decimals are supported; individual clauses such as `weight` still require integers. | `durationMs`, `weight` |
| <a id="paths"></a>Paths | `app.status.text` | Condition, payload, reducer | qualified path | References a Model or event path available in the particular context. | Path must contain identifier segments. | `payload`, `reduce` |

## Allowed contexts

Conditions appear after `when`. Literals and paths also appear in primitive values, payload mappings and reducer expressions.

## Parameters

Conditions allow paths, strings, integers and decimals, `true`, `false`, `null`, comparisons, `!`, `&&`, `||` and parentheses.

## Description

The condition language is intentionally smaller than JavaScript. It allows decisions, but not arbitrary function calls or free execution. The additional `contains(a, b)` form is available only in selector expressions.

### Precedence and comparison

From highest to lowest precedence, Classic uses primary expressions/parentheses, comparisons, `!`, `&&`, and `||`. Therefore `!app.name == null` means **`!(app.name == null)`**. Write `(!app.name) == null` explicitly for JavaScript-style grouping. A textual migration to JavaScript or TSX must account for this difference.

`==` and `!=` use strict equality and inequality: the number `1` is not equal to the string `"1"`. The JavaScript spellings `===` and `!==` are not part of the current Classic grammar. Arithmetic, chained comparisons, optional chaining and arbitrary method calls are not general Classic condition forms either.

Selector lowering maps `a && b` to `a ? b : false` and `a || b` to `a ? true : b`. The event guard preserves these values inside a further comparison; only its overall result decides whether to proceed. This is not a general promise of JavaScript left-operand return semantics. Boolean logical operands make conditions clearer.

In a Model selector, `contains(a, b)` performs string containment after string conversion. For example, `contains(item.tags, "1")` can be true for `tags: ["10"]`. It is not a general alias for `Array.includes`. Model expressions, filter rules, DOM render expressions and portable Node/PHP profiles have separate operator capabilities; a valid selector operator is not automatically a valid render expression.

### Event conditions in the Maraca path

The compiler preserves the condition AST through Core and AppPlatform into the event binding. Event Routing API **3.0.0** validates its closed literal, path, group, unary, comparison and logical nodes without evaluating JavaScript. A false condition blocks payload mapping, event governance and action dispatch, including literal `false`.

Model and selector paths use an injected **read-only `modelReader.snapshot()` port**. One snapshot supplies the entire guard. `state.app.ready` and `selector.appView.name` explicitly select their namespace; unqualified names use the longest unambiguous declared symbol prefix. Event roots such as `detail`, `event`, `target`, `currentTarget`, `source`, `metadata` and `binding` come from the routing context, not arbitrary global variables.

Missing or ambiguous paths, unknown expression forms, unsafe prototype paths and a failing Model port grant no permission. Guards are bounded to 64 nesting levels, 1,024 nodes and 128 path segments. Logical short-circuiting does not read unused event values, but an unselected branch must still be structurally valid. This concrete event evaluator does not establish execution support for every lifecycle or stream adapter.

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

Function calls such as `isReady()` are not allowed and produce parser diagnostics. Missing parentheses or incomplete comparisons are also reported.

## Related operators

`when`, `mount`, `stream`, `on`, `payload`, `reduce`.

## Related reading

The RMT reference index shows which records accept conditions and expressions. [Related article](./rmt-reference.md)
