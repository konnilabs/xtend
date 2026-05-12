# XTendRMT vNext Condition Expression Contract

- Status: `accepted by WP-E15-09`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Contract: `xtend.rmt.vnext-condition-contract.v1`
- Condition Contract: `xtend.rmt.vnext-condition.v1`
- Expression Contract: `xtend.rmt.vnext-expression.v1`
- Depends on: `xtend.rmt.core-format.vnext.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-condition-expression-ready`
- Folgepakete: `WP-E15-10`, `WP-E15-12`, `WP-E15-15`, `WP-E15-17`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-condition-contract.v1"
```

Dieser Contract haertet `when` Conditions nach der Compilation in das vNext Core-Format. Er definiert das erlaubte deklarative Expression-Subset, typisiert bekannte Pfade und erzeugt Diagnostics fuer unbekannte Pfade, ungueltige Operatoren und semantisch unzulaessige Core-Ausdruecke.

Conditions bleiben deklarativ. Es gibt keine Funktionsaufrufe, kein Eval, keine Arrays, keine Objekte, keine Ternaries und keine Seiteneffekte.

## Expression Subset

| Kind | Bedeutung | Result Type |
|------|-----------|-------------|
| `literal` | JSON-nahe Literale `string`, `number`, `boolean`, `null` | Literal-Typ |
| `path` | deklarativer Pfad aus dem Path Catalog | Katalog-Typ |
| `unary` | `!` | `boolean` |
| `binary` | `==`, `!=`, `>`, `>=`, `<`, `<=` | `boolean` |
| `logical` | `&&`, `||` | `boolean` |
| `group` | Klammerung | Innerer Typ |

Erlaubte Typen:

- `boolean`
- `number`
- `string`
- `null`
- `unknown`

`unknown` ist nur ein Analysezustand. Ein unbekannter Pfad erzeugt eine Diagnostic und blockiert den Contract.

## Default Path Catalog

| Pfad | Typ |
|------|-----|
| `route.visible` | `boolean` |
| `route.name` | `string` |
| `route.params.id` | `string` |
| `user.role` | `string` |
| `user.blocked` | `boolean` |
| `feature.enabled` | `boolean` |
| `settings.dirty` | `boolean` |
| `viewport.width` | `number` |
| `data.ready` | `boolean` |

Hosts duerfen den Katalog erweitern, muessen Erweiterungen aber explizit als Path-Type-Map uebergeben.

## Core Condition Record

Eine validierte Condition hat diese Shape:

```json
{
  "schema": "xtend.rmt.vnext-condition.v1",
  "operationId": "operation:conditions.page/root/critical/0",
  "sourceRef": "src:condition:conditions.page/root/critical/0",
  "resultType": "boolean",
  "pathRefs": [
    "route.visible",
    "user.blocked"
  ],
  "expression": {
    "schema": "xtend.rmt.vnext-expression.v1",
    "kind": "logical",
    "op": "&&",
    "type": "boolean"
  },
  "status": "ready",
  "diagnostics": []
}
```

## Typregeln

- Condition-Root muss `boolean` sein.
- `!` akzeptiert nur `boolean`.
- `&&` und `||` akzeptieren nur `boolean` Operanden.
- `>`, `>=`, `<`, `<=` akzeptieren nur `number` Operanden.
- `==` und `!=` akzeptieren gleiche Typen oder `null`-Vergleiche.
- Unbekannte Pfade blockieren.
- Nicht repraesentierbare Core-Kinds wie `call`, `array`, `object` oder `eval` blockieren.

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `rmt.vnext.condition.expression.kind.unsupported` | Core enthaelt eine Expression-Kind ausserhalb des Subsets |
| `rmt.vnext.condition.operator.unsupported` | Operator ist nicht Teil des erlaubten Subsets |
| `rmt.vnext.condition.path.unknown` | Pfad ist nicht im Path Catalog typisiert |
| `rmt.vnext.condition.type.mismatch` | Operator und Operandentypen passen nicht zusammen |
| `rmt.vnext.condition.root.not_boolean` | Condition-Root loest nicht zu `boolean` auf |
| `rmt.vnext.condition.expression.missing` | Condition enthaelt keine Expression |

Alle Diagnostics behalten `sourceRef`, Core Pointer und Source Range, sofern sie im Core-SourceMap vorhanden sind.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-conditions --json
```

Fixtures:

- `tests/rmt-language/fixtures/vnext-conditions-valid.rmt`
- `tests/rmt-language/fixtures/vnext-invalid-condition-call.rmt`

Modul:

- `tools/rmt-language/vnext-conditions.js`
