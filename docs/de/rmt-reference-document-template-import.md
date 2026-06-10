# RMT Reference: Document, Template und Import

Diese Seite beschreibt die äußere Dokumentform von RMT vNext.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="import"></a>`import` | `import "./shared.rmt"` | Top-Level und innerhalb von `template` | statischer Stringpfad | Bindet statische RMT-Quellen in das Dokumentmodell ein. | Importpfade müssen Strings sein. | `template` |
| <a id="template"></a>`template` | `template app.shell { ... }` | Top-Level | qualifizierter Identifier | Startet einen App- oder Shell-Kontext mit eigenen Deklarationen. | Templates dürfen nur Imports, Surfaces und App-Platform-Primitives enthalten. | `surface`, `state`, `action` |
| <a id="surface-top-level"></a>`surface` | `surface root { ... }` | Top-Level oder innerhalb von `template` | qualifizierter Identifier, optional `kind`, `component` | Deklariert eine host-neutrale UI-Fläche. | Surfaces dürfen nur Surface-Clauses, Lanes und Event Bindings enthalten. | `lane`, `portal` |
| <a id="remote-surface-top-level"></a>`remote surface` | `remote surface cart from remote "@scope/cart" { ... }` | Top-Level | Surface-Identifier, Remote-ID als String | Deklariert eine externe Surface mit Owner-, Version-, Origin- und Fallback-Fakten. | Remote Surfaces verlangen statische Remote- und Security-Fakten. | `fallback surface`, `exposes lane` |

## Allowed contexts

`import`, `template`, `surface` und `remote surface` sind die einzigen normalen Top-Level-Operatoren. Primitive-Deklarationen dürfen ebenfalls top-level stehen, werden für Apps aber meist in einem `template` gruppiert.

## Parameters

- `name`: qualifizierter Identifier wie `docs.shell`.
- `remote`: statischer String für Package-, Manifest- oder Remote-ID.
- `kind` und `component`: Inline-Attribute für Surface-Typ und Host-Komponente.

## Description

Ein RMT-Dokument beschreibt keine imperative Ausführung. Es beschreibt Records, die Parser, Compiler, Scheduler und Host-Adapter verarbeiten können.

## Examples

```rmt
import "./shared.rmt"

template reference.document {
  portal app.root root "#app" layer surface

  surface home kind page component x-section {
    portal app.root
    lane visible weight 80 {
      mount home.content from endpoint app.home
    }
  }
}
```

## Diagnostics

Unerwartete Top-Level-Tokens erzeugen Syntax-Diagnosen. Imperative Wörter wie `if`, `for`, `return` oder `async` werden bewusst abgewiesen.

## Related operators

`portal`, `lane`, `mount`, `remote surface`, `owner team`, `trust boundary`.
