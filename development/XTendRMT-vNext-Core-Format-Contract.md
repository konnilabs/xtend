# XTendRMT vNext Core Format Contract

- Status: `accepted by WP-E15-03`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Contract: `xtend.rmt.core-format.vnext.v1`
- Depends on: `xtend.rmt.vnext.grammar.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-core-ast-schema-ready`
- Folgepaket: `WP-E15-04`

## Zweck

Dieses Dokument friert das JSON-kompatible Compiler-Ziel fuer RMT vNext ein. Es uebersetzt den Grammar Contract `xtend.rmt.vnext.grammar.v1` in:

- stabile AST-Node-Typen
- Core-Record-Domains
- Source-Map- und JSON-Pointer-Regeln
- Schema-Deltas zu `xtendrmt/rmt.schema.json`
- minimale und komplexe Core-Fixtures fuer das Parser-/Compiler-Handoff

Die Authoring-Syntax bleibt menschenlesbar. Runtime, Tooling, Adapter und AI-Agenten konsumieren nach der Compilation ausschliesslich Core-Records, AST-Fakten, Diagnostics und Source Maps.

## Core-Dokument

Ein vNext-Core-Dokument bleibt ein RMT-Dokument:

```json
{
  "schema": "xtend.rmt.core-format.vnext.v1",
  "kind": "rmt_document",
  "version": "2.0-vnext",
  "manifest": {
    "documentId": "docs.page",
    "namespace": "docs",
    "sourceSyntax": "rmt-vnext",
    "contracts": [
      "xtend.rmt.vnext.grammar.v1",
      "xtend.rmt.core-format.vnext.v1"
    ]
  },
  "imports": [],
  "templates": [],
  "surfaces": [],
  "lanes": [],
  "operations": [],
  "slots": [],
  "events": [],
  "dataSources": [],
  "securityPolicies": [],
  "sourceMap": []
}
```

Pflichtfelder fuer vNext-Core:

- `schema`
- `kind`
- `version`
- `manifest`
- `templates`
- `surfaces`
- `lanes`
- `operations`
- `sourceMap`

Optionale Domains:

- `imports`
- `slots`
- `events`
- `dataSources`
- `securityPolicies`
- bestehende Domains wie `adapters`, `components`, `routes`, `schedules`

## AST Node Types

| Grammar Form | AST Node Type | Core Domain | Primaerer Pointer |
|--------------|---------------|-------------|-------------------|
| Document | `RmtVNextDocument` | document root | `/` |
| ImportDecl | `RmtImportDeclaration` | `imports[]` | `/imports/{index}` |
| TemplateDecl | `RmtTemplateDeclaration` | `templates[]` | `/templates/{index}` |
| SurfaceDecl | `RmtSurfaceDeclaration` | `surfaces[]` | `/surfaces/{index}` |
| LaneDecl | `RmtLaneDeclaration` | `lanes[]` | `/lanes/{index}` |
| LifecycleStmt | `RmtLifecycleStatement` | `operations[]` | `/operations/{index}` |
| StreamStmt | `RmtStreamStatement` | `operations[]` | `/operations/{index}` |
| SourceClause | `RmtSourceClause` | `dataSources[]` and inline op ref | `/dataSources/{index}` |
| ConditionClause | `RmtConditionClause` | inline condition | `/operations/{index}/condition` |
| Expression | `RmtConditionExpression` | inline expression tree | `/operations/{index}/condition/expression` |
| PolicyBlock | `RmtPolicyBlock` | no own runtime record | owner `policyRefs` |
| SlotDecl | `RmtSlotDeclaration` | `slots[]` | `/slots/{index}` |
| EventBinding | `RmtEventBinding` | `events[]` | `/events/{index}` |
| TrustPolicy | `RmtTrustBoundaryPolicy` | `securityPolicies[]` | `/securityPolicies/{index}` |
| SanitizePolicy | `RmtSanitizePolicy` | `securityPolicies[]` | `/securityPolicies/{index}` |

Policy blocks are AST containers. Their children produce `slots`, `events` or `securityPolicies` and are connected back to the owning operation through `policyRefs`.

## Stable IDs

Core IDs are deterministic strings. They are not host imports and must not imply runtime execution.

Rules:

- named declarations keep their authoring identifier as `name`
- generated `id` values are derived from lexical scope and declaration order
- generated IDs use only lower ASCII, digits, `.`, `-`, `_`, `/` and `:`
- operation order is zero-based within the containing lane or slot
- source maps are the authority for exact text positions

Examples:

| Source | Core ID |
|--------|---------|
| `template docs.page` | `template:docs.page` |
| nested `surface root` in `docs.page` | `surface:docs.page/root` |
| top-level `surface overlay.docs-feed` | `surface:overlay.docs-feed` |
| `lane critical` in `docs.page/root` | `lane:docs.page/root/critical` |
| first operation in that lane | `operation:docs.page/root/critical/0` |
| `slot body` under that operation | `slot:docs.page/root/critical/0/body` |

If a later semantic pass detects duplicate generated IDs, it must emit a diagnostic instead of rewriting IDs silently.

## Core Domains

### Imports

```json
{
  "id": "import:0",
  "path": "./shared/*.rmt",
  "mode": "static_glob",
  "sourceRef": "src:import:0"
}
```

`mode` values:

- `static_file`
- `static_glob`

Dynamic imports are syntax errors and never reach Core.

### Templates

```json
{
  "id": "template:docs.page",
  "name": "docs.page",
  "mode": "orchestration",
  "surfaceRefs": [
    "surface:docs.page/root"
  ],
  "sourceRef": "src:template:docs.page"
}
```

`mode: "orchestration"` is the vNext Core delta for templates produced from Authoring Syntax. Existing `dom_descriptor`, `html_fragment` and `text` templates remain valid legacy/Core records.

### Surfaces

```json
{
  "id": "surface:docs.page/root",
  "name": "root",
  "scope": {
    "template": "template:docs.page"
  },
  "kind": "root",
  "laneRefs": [
    "lane:docs.page/root/critical"
  ],
  "sourceRef": "src:surface:docs.page/root"
}
```

`kind` defaults to:

- `root` when the surface name is `root`
- `named_surface` otherwise

Later runtime packages may map names like `modal.settings` or `overlay.docs-feed` to richer surface kinds. The parser does not infer DOM behavior.

### Lanes

```json
{
  "id": "lane:docs.page/root/critical",
  "name": "critical",
  "scope": {
    "template": "template:docs.page",
    "surface": "surface:docs.page/root"
  },
  "weight": 10,
  "operationRefs": [
    "operation:docs.page/root/critical/0"
  ],
  "sourceRef": "src:lane:docs.page/root/critical"
}
```

`weight` is optional. If absent, the field is omitted. Default scheduler meaning is left to `WP-E15-07`.

### Operations

Lifecycle operation:

```json
{
  "id": "operation:docs.page/root/critical/0",
  "kind": "lifecycle",
  "op": "hydrate",
  "target": {
    "kind": "ref",
    "ref": "docs-header"
  },
  "scope": {
    "template": "template:docs.page",
    "surface": "surface:docs.page/root",
    "lane": "lane:docs.page/root/critical"
  },
  "sourceRef": "src:operation:docs.page/root/critical/0"
}
```

Stream operation:

```json
{
  "id": "operation:overlay.docs-feed/normal/0",
  "kind": "stream",
  "op": "stream",
  "target": {
    "kind": "ref",
    "ref": "docs-content"
  },
  "source": {
    "ref": "dataSource:overlay.docs-feed/normal/0",
    "kind": "sse",
    "id": "docs.feed"
  },
  "policyRefs": [
    "security:overlay.docs-feed/normal/0/trustBoundary/0",
    "security:overlay.docs-feed/normal/0/sanitize/1"
  ],
  "sourceRef": "src:operation:overlay.docs-feed/normal/0"
}
```

Allowed lifecycle `op` values:

- `mount`
- `hydrate`
- `suspend`
- `resume`
- `invalidate`
- `dispose`
- `prewarm`
- `recycle`
- `detach`
- `reattach`

### Data Sources

```json
{
  "id": "dataSource:docs.page/modal.settings/critical/0",
  "kind": "endpoint",
  "target": "settings.load",
  "ownerOperation": "operation:docs.page/modal.settings/critical/0",
  "sourceRef": "src:dataSource:docs.page/modal.settings/critical/0"
}
```

Allowed `kind` values:

- `endpoint`
- `sse`
- `worker`

### Conditions

Conditions compile to small expression trees.

```json
{
  "kind": "condition",
  "expression": {
    "kind": "binary",
    "op": "==",
    "left": {
      "kind": "path",
      "path": [
        "route",
        "visible"
      ]
    },
    "right": {
      "kind": "literal",
      "value": true
    }
  },
  "sourceRef": "src:condition:docs.page/root/critical/1"
}
```

Expression node kinds:

- `literal`
- `path`
- `unary`
- `binary`
- `logical`
- `group`

Function calls, arrays, objects, ternaries and eval-like constructs are not representable in Core.

### Slots

```json
{
  "id": "slot:docs.page/modal.settings/critical/0/body",
  "name": "body",
  "ownerOperation": "operation:docs.page/modal.settings/critical/0",
  "operationRefs": [
    "operation:docs.page/modal.settings/critical/0/body/0"
  ],
  "sourceRef": "src:slot:docs.page/modal.settings/critical/0/body"
}
```

Slot-owned operations use the slot path in their generated ID and keep the nearest lane in `scope.lane`.

### Events

```json
{
  "id": "event:docs.page/modal.settings/critical/0/submit",
  "event": "submit",
  "action": "settings.save",
  "ownerOperation": "operation:docs.page/modal.settings/critical/0",
  "condition": null,
  "sourceRef": "src:event:docs.page/modal.settings/critical/0/submit"
}
```

Events are declarative bindings. The Core record does not call the action.

### Security Policies

Trust boundary:

```json
{
  "id": "security:overlay.docs-feed/normal/0/trustBoundary/0",
  "kind": "trust_boundary",
  "boundary": "xtend.security.sanitizing-boundary.v1",
  "ownerOperation": "operation:overlay.docs-feed/normal/0",
  "sourceRef": "src:security:overlay.docs-feed/normal/0/trustBoundary/0"
}
```

Sanitize policy:

```json
{
  "id": "security:overlay.docs-feed/normal/0/sanitize/1",
  "kind": "sanitize",
  "format": "html",
  "ownerOperation": "operation:overlay.docs-feed/normal/0",
  "sourceRef": "src:security:overlay.docs-feed/normal/0/sanitize/1"
}
```

Security policy records are auditable data. Sanitizing and Trusted DOM sinks remain adapter work.

## Source Maps

Every Core record created from source text has a `sourceRef`. Source maps connect `sourceRef`, AST node type, JSON Pointer and range.

```json
{
  "id": "src:operation:docs.page/root/critical/0",
  "nodeType": "RmtLifecycleStatement",
  "corePointer": "/operations/0",
  "astPointer": "/body/0/body/0/body/0/body/0",
  "range": {
    "start": {
      "line": 4,
      "character": 6
    },
    "end": {
      "line": 4,
      "character": 25
    }
  }
}
```

Rules:

- `corePointer` is a JSON Pointer into the compiled Core document.
- `astPointer` is a JSON Pointer into the parser AST.
- ranges use zero-based line and character positions.
- ranges point to the whole grammar construct, not only the keyword.
- comments and optional semicolons may affect ranges but not Core semantics.

## Minimal Core Fixture

Source:

```rmt
template docs.page {
  surface root {
    lane critical {
      hydrate docs-header
    }
  }
}
```

Core:

```json
{
  "schema": "xtend.rmt.core-format.vnext.v1",
  "kind": "rmt_document",
  "version": "2.0-vnext",
  "manifest": {
    "documentId": "docs.page",
    "namespace": "docs",
    "sourceSyntax": "rmt-vnext",
    "contracts": [
      "xtend.rmt.vnext.grammar.v1",
      "xtend.rmt.core-format.vnext.v1"
    ]
  },
  "imports": [],
  "templates": [
    {
      "id": "template:docs.page",
      "name": "docs.page",
      "mode": "orchestration",
      "surfaceRefs": [
        "surface:docs.page/root"
      ],
      "sourceRef": "src:template:docs.page"
    }
  ],
  "surfaces": [
    {
      "id": "surface:docs.page/root",
      "name": "root",
      "scope": {
        "template": "template:docs.page"
      },
      "kind": "root",
      "laneRefs": [
        "lane:docs.page/root/critical"
      ],
      "sourceRef": "src:surface:docs.page/root"
    }
  ],
  "lanes": [
    {
      "id": "lane:docs.page/root/critical",
      "name": "critical",
      "scope": {
        "template": "template:docs.page",
        "surface": "surface:docs.page/root"
      },
      "operationRefs": [
        "operation:docs.page/root/critical/0"
      ],
      "sourceRef": "src:lane:docs.page/root/critical"
    }
  ],
  "operations": [
    {
      "id": "operation:docs.page/root/critical/0",
      "kind": "lifecycle",
      "op": "hydrate",
      "target": {
        "kind": "ref",
        "ref": "docs-header"
      },
      "scope": {
        "template": "template:docs.page",
        "surface": "surface:docs.page/root",
        "lane": "lane:docs.page/root/critical"
      },
      "sourceRef": "src:operation:docs.page/root/critical/0"
    }
  ],
  "slots": [],
  "events": [],
  "dataSources": [],
  "securityPolicies": [],
  "sourceMap": [
    {
      "id": "src:template:docs.page",
      "nodeType": "RmtTemplateDeclaration",
      "corePointer": "/templates/0",
      "astPointer": "/body/0",
      "range": {
        "start": {
          "line": 0,
          "character": 0
        },
        "end": {
          "line": 6,
          "character": 1
        }
      }
    }
  ]
}
```

## Complex Core Fixture

Source:

```rmt
import "./shared/*.rmt"

template docs.page {
  surface root {
    lane critical weight 10 {
      hydrate docs-header
      hydrate docs-content when route.visible == true
    }

    lane idle weight 1 {
      prewarm search-index
    }
  }

  surface modal.settings {
    lane critical {
      mount settings-card {
        slot body {
          hydrate settings-form from endpoint settings.load
        }

        on submit -> action settings.save
      }
    }
  }
}

surface overlay.docs-feed {
  lane normal {
    stream docs-content from sse docs.feed {
      trust boundary "xtend.security.sanitizing-boundary.v1"
      sanitize html
    }
  }
}
```

Core excerpt:

```json
{
  "schema": "xtend.rmt.core-format.vnext.v1",
  "kind": "rmt_document",
  "version": "2.0-vnext",
  "manifest": {
    "documentId": "docs.page",
    "namespace": "docs",
    "sourceSyntax": "rmt-vnext",
    "contracts": [
      "xtend.rmt.vnext.grammar.v1",
      "xtend.rmt.core-format.vnext.v1"
    ]
  },
  "imports": [
    {
      "id": "import:0",
      "path": "./shared/*.rmt",
      "mode": "static_glob",
      "sourceRef": "src:import:0"
    }
  ],
  "templates": [
    {
      "id": "template:docs.page",
      "name": "docs.page",
      "mode": "orchestration",
      "surfaceRefs": [
        "surface:docs.page/root",
        "surface:docs.page/modal.settings"
      ],
      "sourceRef": "src:template:docs.page"
    }
  ],
  "surfaces": [
    {
      "id": "surface:docs.page/root",
      "name": "root",
      "scope": {
        "template": "template:docs.page"
      },
      "kind": "root",
      "laneRefs": [
        "lane:docs.page/root/critical",
        "lane:docs.page/root/idle"
      ],
      "sourceRef": "src:surface:docs.page/root"
    },
    {
      "id": "surface:docs.page/modal.settings",
      "name": "modal.settings",
      "scope": {
        "template": "template:docs.page"
      },
      "kind": "named_surface",
      "laneRefs": [
        "lane:docs.page/modal.settings/critical"
      ],
      "sourceRef": "src:surface:docs.page/modal.settings"
    },
    {
      "id": "surface:overlay.docs-feed",
      "name": "overlay.docs-feed",
      "kind": "named_surface",
      "laneRefs": [
        "lane:overlay.docs-feed/normal"
      ],
      "sourceRef": "src:surface:overlay.docs-feed"
    }
  ],
  "lanes": [
    {
      "id": "lane:docs.page/root/critical",
      "name": "critical",
      "scope": {
        "template": "template:docs.page",
        "surface": "surface:docs.page/root"
      },
      "weight": 10,
      "operationRefs": [
        "operation:docs.page/root/critical/0",
        "operation:docs.page/root/critical/1"
      ],
      "sourceRef": "src:lane:docs.page/root/critical"
    }
  ],
  "operations": [
    {
      "id": "operation:docs.page/root/critical/0",
      "kind": "lifecycle",
      "op": "hydrate",
      "target": {
        "kind": "ref",
        "ref": "docs-header"
      },
      "scope": {
        "template": "template:docs.page",
        "surface": "surface:docs.page/root",
        "lane": "lane:docs.page/root/critical"
      },
      "sourceRef": "src:operation:docs.page/root/critical/0"
    },
    {
      "id": "operation:docs.page/root/critical/1",
      "kind": "lifecycle",
      "op": "hydrate",
      "target": {
        "kind": "ref",
        "ref": "docs-content"
      },
      "condition": {
        "kind": "condition",
        "expression": {
          "kind": "binary",
          "op": "==",
          "left": {
            "kind": "path",
            "path": [
              "route",
              "visible"
            ]
          },
          "right": {
            "kind": "literal",
            "value": true
          }
        },
        "sourceRef": "src:condition:docs.page/root/critical/1"
      },
      "scope": {
        "template": "template:docs.page",
        "surface": "surface:docs.page/root",
        "lane": "lane:docs.page/root/critical"
      },
      "sourceRef": "src:operation:docs.page/root/critical/1"
    },
    {
      "id": "operation:overlay.docs-feed/normal/0",
      "kind": "stream",
      "op": "stream",
      "target": {
        "kind": "ref",
        "ref": "docs-content"
      },
      "source": {
        "ref": "dataSource:overlay.docs-feed/normal/0",
        "kind": "sse",
        "id": "docs.feed"
      },
      "policyRefs": [
        "security:overlay.docs-feed/normal/0/trustBoundary/0",
        "security:overlay.docs-feed/normal/0/sanitize/1"
      ],
      "sourceRef": "src:operation:overlay.docs-feed/normal/0"
    }
  ],
  "slots": [
    {
      "id": "slot:docs.page/modal.settings/critical/0/body",
      "name": "body",
      "ownerOperation": "operation:docs.page/modal.settings/critical/0",
      "operationRefs": [
        "operation:docs.page/modal.settings/critical/0/body/0"
      ],
      "sourceRef": "src:slot:docs.page/modal.settings/critical/0/body"
    }
  ],
  "events": [
    {
      "id": "event:docs.page/modal.settings/critical/0/submit",
      "event": "submit",
      "action": "settings.save",
      "ownerOperation": "operation:docs.page/modal.settings/critical/0",
      "condition": null,
      "sourceRef": "src:event:docs.page/modal.settings/critical/0/submit"
    }
  ],
  "dataSources": [
    {
      "id": "dataSource:docs.page/modal.settings/critical/0/body/0",
      "kind": "endpoint",
      "target": "settings.load",
      "ownerOperation": "operation:docs.page/modal.settings/critical/0/body/0",
      "sourceRef": "src:dataSource:docs.page/modal.settings/critical/0/body/0"
    },
    {
      "id": "dataSource:overlay.docs-feed/normal/0",
      "kind": "sse",
      "target": "docs.feed",
      "ownerOperation": "operation:overlay.docs-feed/normal/0",
      "sourceRef": "src:dataSource:overlay.docs-feed/normal/0"
    }
  ],
  "securityPolicies": [
    {
      "id": "security:overlay.docs-feed/normal/0/trustBoundary/0",
      "kind": "trust_boundary",
      "boundary": "xtend.security.sanitizing-boundary.v1",
      "ownerOperation": "operation:overlay.docs-feed/normal/0",
      "sourceRef": "src:security:overlay.docs-feed/normal/0/trustBoundary/0"
    },
    {
      "id": "security:overlay.docs-feed/normal/0/sanitize/1",
      "kind": "sanitize",
      "format": "html",
      "ownerOperation": "operation:overlay.docs-feed/normal/0",
      "sourceRef": "src:security:overlay.docs-feed/normal/0/sanitize/1"
    }
  ],
  "sourceMap": []
}
```

The complex fixture is intentionally an excerpt: it demonstrates every Core domain shape, while `WP-E15-05` will define byte-stable full compiler output.

## Schema Delta

Current `xtendrmt/rmt.schema.json` already owns the production RMT document root and the domains `adapters`, `components`, `routes`, `schedules`, `surfaces` and `templates`.

vNext requires these additive schema deltas:

| Area | Delta |
|------|-------|
| Root | allow `schema: "xtend.rmt.core-format.vnext.v1"` |
| Root | allow `version: "2.0-vnext"` |
| Root | add optional `imports`, `lanes`, `operations`, `slots`, `events`, `dataSources`, `securityPolicies`, `sourceMap` |
| `manifest` | add optional `sourceSyntax` and `contracts` |
| `templates[].mode` | add `orchestration` |
| `templates[]` | add optional `surfaceRefs` |
| `surfaces[]` | add optional `scope`, `laneRefs`, `sourceRef` |
| New `lanes[]` | add lane records with `id`, `name`, optional `weight`, `scope`, `operationRefs`, `sourceRef` |
| New `operations[]` | add lifecycle and stream records |
| New `slots[]` | add slot records with owner operation and nested operation refs |
| New `events[]` | add event-to-action records |
| New `dataSources[]` | add endpoint, sse and worker source records |
| New `securityPolicies[]` | add trust boundary and sanitize records |
| New `sourceMap[]` | add sourceRef to AST/Core pointer mapping |

Compatibility rules:

- existing `1.0` documents stay valid
- current `templates[]` records stay valid
- existing `surfaces[]` records stay valid
- vNext-only domains are additive and must not change existing adapter execution
- hosts may ignore unknown vNext domains only when the document is not executed as vNext Core

## Roundtrip Boundaries

Guaranteed:

- vNext Authoring Syntax compiles deterministically to Core
- Core preserves semantic intent, source pointers and stable generated IDs
- Diagnostics can map Core records back to source ranges via `sourceMap`

Not guaranteed:

- exact comments, whitespace or optional semicolons survive Core roundtrip
- Core can always be regenerated into identical Authoring Syntax
- imports are expanded in `WP-E15-03`
- runtime scheduling meaning is finalized in `WP-E15-03`

## Handoff an WP-E15-04

`WP-E15-04` can implement Lexer/Parser MVP against these stable AST node types:

- `RmtVNextDocument`
- `RmtImportDeclaration`
- `RmtTemplateDeclaration`
- `RmtSurfaceDeclaration`
- `RmtLaneDeclaration`
- `RmtLifecycleStatement`
- `RmtStreamStatement`
- `RmtSourceClause`
- `RmtConditionClause`
- `RmtConditionExpression`
- `RmtPolicyBlock`
- `RmtSlotDeclaration`
- `RmtEventBinding`
- `RmtTrustBoundaryPolicy`
- `RmtSanitizePolicy`

`WP-E15-04` should produce AST plus syntax diagnostics only. It should not execute imports, validate adapter refs or emit runtime plans.

`WP-E15-05` will compile AST to the Core domains described here and make the minimal/complex fixtures byte-stable.
