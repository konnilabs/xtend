# RMT Reference: Security und Policies

Security- und Hydration-Policies stehen in Policy-Blöcken von Lifecycle-Operationen.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="trust-boundary"></a>`trust boundary` | `trust boundary "xtend.security.sanitizing-boundary.v1"` | Lifecycle-Policy, Remote Surface | statischer String | Bindet Rendering oder Remote-Surface an eine Trust Boundary. | Boundary muss ein String sein. | `sanitize` |
| <a id="hydration-policy"></a>`hydration policy` | `hydration policy visible-only` | Lifecycle-Policy | Policy-Identifier | Dokumentiert die Hydration-Strategie. | Hydration muss `policy`, `mode` oder `insular` verwenden. | `hydrate` |
| <a id="hydration-mode"></a>`hydration mode` | `hydration mode eager` | Lifecycle-Policy | Mode-Identifier | Setzt den Hydration-Modus. | Falscher Clause-Typ wird gemeldet. | `hydration policy` |
| <a id="hydration-insular"></a>`hydration insular` | `hydration insular true` | Lifecycle-Policy | Boolean oder Identifier | Markiert isolierte Hydration. | Wert muss Boolean oder Identifier sein. | `isolation boundary` |
| <a id="isolation-boundary"></a>`isolation boundary` | `isolation boundary "docs.preview"` | Lifecycle-Policy | String oder Identifier | Setzt eine Isolationsgrenze. | Isolation muss `boundary` oder `mode` verwenden. | `trust boundary` |
| <a id="isolation-mode"></a>`isolation mode` | `isolation mode strict` | Lifecycle-Policy | Mode-Identifier | Setzt Isolationsmodus. | Falscher Clause-Typ wird gemeldet. | `sanitize` |
| <a id="sanitize"></a>`sanitize` | `sanitize html` | Lifecycle-Policy | Format-Identifier | Erzwingt Sanitizing für gerenderte Inhalte. | Format muss Identifier sein. | `trust boundary` |

## Allowed contexts

Diese Operatoren stehen im Policy-Block nach `mount`, `hydrate`, `update`, `stream` oder anderen Lifecycle-Operationen. `trust boundary` steht außerdem in `remote surface`.

## Parameters

Trust Boundaries sind stabile String-Identifier. Hydration-, Isolation- und Sanitize-Werte sind statische Identifier oder Booleans.

## Description

Policies beschreiben Sicherheits- und Hydration-Grenzen, ohne Host-Code in der RMT-Quelle auszuführen.

## Examples

```rmt
template reference.security {
  portal app.root root "#app" layer surface

  surface preview kind page component x-section {
    portal app.root
    lane visible weight 80 {
      mount preview.body from endpoint docs.preview {
        trust boundary "xtend.security.sanitizing-boundary.v1"
        hydration policy visible-only
        hydration mode eager
        hydration insular true
        isolation boundary "docs.preview"
        isolation mode strict
        sanitize html
      }
    }
  }
}
```

## Diagnostics

Policy-Blöcke erlauben nur Slots, Event Bindings, Hydration-, Isolation- und Security-Policies. Andere Tokens werden als Kontextfehler gemeldet.

## Related operators

`mount`, `hydrate`, `stream`, `remote surface`, `origin`, `integrity sha256`.
