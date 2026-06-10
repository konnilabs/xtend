# RMT Reference: Conditions and Expressions

Conditions appear after `when` and use a small declarative expression language.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="when"></a>`when` | `when app.ready == true` | Lifecycle, `stream`, event binding | condition expression | Enables work only when the condition passes. | Expression must be complete. | `mount`, `on` |
| <a id="and"></a>`&&` | `a == true && b == false` | Condition | left and right expression | Logical AND. | Right side must be an expression. | `||` |
| <a id="or"></a>`||` | `a == true || b == true` | Condition | left and right expression | Logical OR. | Right side must be an expression. | `&&` |
| <a id="not"></a>`!` | `!app.disabled` | Condition | expression | Negates a boolean path or expression. | Argument must be an expression. | `when` |
| <a id="equal"></a>`==` | `app.status == "ready"` | Condition | two values | Equality comparison. | Both sides must parse. | `!=` |
| <a id="not-equal"></a>`!=` | `app.status != "error"` | Condition | two values | Inequality comparison. | Both sides must parse. | `==` |
| <a id="greater-than"></a>`>` | `app.count > 0` | Condition | two values | Greater-than comparison. | Both sides must parse. | `>=` |
| <a id="greater-equal"></a>`>=` | `app.count >= 1` | Condition | two values | Greater-than-or-equal comparison. | Both sides must parse. | `>` |
| <a id="less-than"></a>`<` | `app.count < 10` | Condition | two values | Less-than comparison. | Both sides must parse. | `<=` |
| <a id="less-equal"></a>`<=` | `app.count <= 10` | Condition | two values | Less-than-or-equal comparison. | Both sides must parse. | `<` |
| <a id="grouping"></a>`()` | `(app.ready == true)` | Condition | expression | Groups logic. | Closing parenthesis is required. | `&&`, `||` |
| <a id="literal-true"></a>`true` | `app.ready == true` | Condition, primitive value | literal | Boolean true. | Function calls are not allowed. | `false` |
| <a id="literal-false"></a>`false` | `app.disabled == false` | Condition, primitive value | literal | Boolean false. | Function calls are not allowed. | `true` |
| <a id="literal-null"></a>`null` | `app.value != null` | Condition, primitive value | literal | Null value. | Literal only. | `!=` |
| <a id="strings"></a>Strings | `"ready"` | Condition, primitive value | quoted string | Static text value. | Strings need quotes. | `contract`, `message` |
| <a id="integers"></a>Integers | `120` | Condition, primitive value | integer | Numeric value. | Only integers are tokenized. | `durationMs`, `weight` |
| <a id="paths"></a>Paths | `app.status.text` | Condition, payload, reducer | qualified path | References state, input, detail, target or surface context. | Path must contain identifier segments. | `payload`, `reduce` |

## Allowed contexts

Conditions appear after `when`. Literals and paths also appear in primitive values, payload mappings and reducer expressions.

## Parameters

Conditions allow paths, strings, integers, `true`, `false`, `null`, comparisons, `!`, `&&`, `||` and parentheses.

## Description

The condition language is intentionally smaller than JavaScript. It allows decisions, but not function calls or free execution.

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
