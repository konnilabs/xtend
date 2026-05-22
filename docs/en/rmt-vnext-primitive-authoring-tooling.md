# RMT vNext Primitive Authoring Tooling

- Contract: `xtend.rmt.vnext.primitive-authoring-tooling.v1`
- Workpackage: `RMT-VNEXT-PRIM-07`
- Status: `completed`
- Source: Media Manager downstream transfer, `2026-05-19`

## Goal

`RMT-VNEXT-PRIM-07` makes the new primitive syntax visible in the developer experience. App authors should not have to search legacy JSON for state, selectors, actions, events, surfaces, portals, overlays and resources: completions, hover, document symbols and snippets lead directly through RMT vNext.

## Tooling Surface

The first PRIM-07 slice extends `tools/rmt-language/vnext-tooling.js`. The module now also indexes primitive domains from PRIM-04:

- `states`
- `selectors`
- `actions`
- `effects`
- `portals`
- `overlays`
- `resources`

Existing domains such as `surfaces`, `events` and `dataSources` remain available and are enriched for primitive records.

## Completions

New completion contexts:

| Context | Purpose |
| --- | --- |
| `vnext-primitive-keywords` | top-level primitive keywords such as `state`, `selector`, `action`, `surface`, `resource` |
| `vnext-primitive-state-clauses` | `type`, `preserve`, `initial` |
| `vnext-primitive-selector-clauses` | `from state`, `where`, `find`, `sort by`, `output` |
| `vnext-primitive-action-clauses` | `input`, `reduce`, `effect fetch datasource`, `on success`, `on error`, `emit` |
| `vnext-primitive-surface-clauses` | `source selector`, `repeat from selector`, `key`, `portal`, `bounds`, `lane visible`, event and lifecycle clauses |
| `vnext-primitive-resource-kinds` | `object-url`, `stream`, `observer`, `timer`, `lazy-import` |
| `vnext-primitive-overlay-kinds` | `tooltip`, `toast`, `popover`, `lightbox`, `menu`, `dialog` |

When a pointer is inside a primitive domain, the tooling automatically chooses the matching context.

### Cursor-Near Completion

The second PRIM-07 slice makes completion usable without an explicit `xtend.context`. `getRmtVNextToolingCompletions(...)` now accepts an LSP position, resolves the source-map pointer from it when possible, and evaluates the current line plus the partial word before the cursor.

Covered authoring cases:

- `state ... {` directly returns state clauses such as `initial`.
- `resource ... kind ` returns resource kinds such as `lazy-import`.
- Partial words in action blocks, for example `red`, prioritize action clauses such as `reduce`.

The language server forwards `textDocument/completion.position` to the vNext tooling. This gives editors primitive completions even when they do not set XTend-specific additional parameters.

## Hover

Hover uses the PRIM-04 Core records and source maps. Examples:

- `State: media.records`
- `Action: media.select`
- `Resource: lightbox.import`

The hover output still contains Core pointers so editor, compiler and runtime evidence can trace the same primitive ID.

## Document Symbols

Document symbols now contain primitive namespaces:

```text
states
selectors
actions
portals
overlays
resources
surfaces
events
```

This lets an editor navigate a granular app shell from the outline without opening legacy records.

## Code Actions

The third PRIM-07 slice provides safe quick fixes for primitive diagnostics from `getRmtVNextToolingCodeActions(...)` and through `textDocument/codeAction` in the language server.

Supported first repairs:

- `rmt.vnext.primitive.owner-missing`: adds `owner surface.<id>` to a resource declaration when a surface exists in the document.
- `rmt.vnext.primitive.unkeyed-repeat`: adds `key instance.id` after a `repeat from selector` clause.
- `rmt.vnext.primitive.payload-contract-missing`: adds a payload contract for event bindings or `emit` statements.

The next slice extends these repairs for the most common authoring gaps:

- `rmt.vnext.primitive.initial-missing`: adds a safe initial value or a small `initial {}` block.
- `rmt.vnext.primitive.resource-kind-missing`: adds `kind object-url` as a conservative resource default.
- `rmt.vnext.primitive.unknown-reference` for selector references: creates a source-preserving selector stub from the first available state.
- `rmt.vnext.primitive.unknown-reference` for portal references: creates a portal stub with stable `root` and `layer surface`.

The action-authoring slice also adds:

- `rmt.vnext.primitive.action-reducer-missing`: adds a `reduce state.<id> = input.<name>` target before the action end.
- `rmt.vnext.primitive.effect-source-missing`: adds `datasource <id>` to an `effect fetch`.
- `rmt.vnext.primitive.kernel-boundary`: deliberately creates no text edit, but a command-action handoff so Kernel/Fabric imports are moved into a host adapter.

The actions are intentionally source-preserving text edits. They fix the obvious authoring gap and leave further semantic problems visible instead of synthetically rewriting whole primitive blocks.

### Code-Action Previews and Fix-All

The next PRIM-07 slice makes the quick fixes more editor-friendly:

- Every code action carries an `xtend.rmt.vnext.primitive-code-action-preview.v1` preview with affected URIs, edit count, first changed source-line excerpt and before/after lines.
- Safe text-edit actions are additionally grouped into `source.fixAll.rmt.vnext.primitives`.
- Fix-All remains limited to actions with `safe: true` and `edit`.
  Manual command handoffs such as `kernel-boundary` are not applied automatically.
- The language server forwards the preview in the `CodeAction.data.preview` field so editors can show a repair before applying the WorkspaceEdit.

### Command Handoff

Manual boundary cases now also get a stable editor experience:

- The language server reports `executeCommandProvider.commands` with `xtend.rmt.vnext.extractKernelImport`.
- `workspace/executeCommand` creates an `xtend.rmt.vnext.primitive-command-handoff.v1` result for this command.
- The result remains `safe: false`, `edit: null` and `status: "manual_handoff"` because Kernel/Fabric imports must not be written automatically into RMT vNext source.
- The handoff names the boundary `no-kernel-fabric-imports-in-vnext-source` and lists the target location `xtend-rmt-host-adapter` so editors can show a clear manual apply path.

### VS Code Bridge Apply Experience

The VS Code bridge now offers the first visible authoring experience for the three apply paths:

- `XTendRMT: Show vNext Primitive Apply Experience` renders an `xtend.rmt.editor.vscode-primitive-authoring-experience.v1` report in the Output Channel.
- `XTendRMT: Show vNext Primitive Code Action Preview` shows the preview excerpt of a single code action.
- `XTendRMT: Show vNext Primitive Command Handoff` shows manual boundary handoffs without WorkspaceEdit.

The bridge deliberately stays thin: it classifies actions already provided by the language server into `workspace-edit`, `fix-all` and `manual-command`, and makes these paths visible. The LSP remains the source of truth for diagnostics, preview and command handoff.

### Active VS Code Document Integration

The final PRIM-07 slice connects the bridge to the active `.rmt` document:

- `createActiveDocumentPrimitiveAuthoringExperience(...)` reads the active document, starts the local RMT Language Server in-process and calls `textDocument/codeAction` against real LSP diagnostics.
- `XTendRMT: Show vNext Primitive Apply Experience` can build a QuickPick selection for preview, Fix-All and manual handoffs directly from the active document when no report is passed in.
- `applyPrimitiveAuthoringWorkspaceEdit(...)` applies only safe WorkspaceEdits. `kernel-boundary` actions remain blocked because they carry `edit: null` and must be moved into a host adapter.
- `XTendRMT: Apply Safe vNext Primitive Fix-All` applies only `source.fixAll.rmt.vnext.primitives`. If no safe Fix-All is available, the bridge renders the current apply report instead of blindly applying individual edits.

PRIM-07 is therefore no longer only an LSP/docs package: the editor bridge can select, preview and safely apply vNext primitive repairs from real source context, while boundary handoffs remain visible and manual.

## Snippet

New snippet:

```text
RMT vNext Primitive Shell
```

Prefix:

```text
rmt-vnext-primitive-shell
```

The snippet creates a small app shell with state, selector, action, portal, surface, visible lane and event payload contract.

## Local Gates

```bash
node --check tools/rmt-language/vnext-tooling.js
node --check tests/rmt-language/rmt_vnext_tooling_suite.js
node -e "const suite=require('./tests/rmt-language/rmt_vnext_tooling_suite'); const result=suite.runRmtVNextToolingSuite({rootDir:process.cwd()}); process.exit(result.ok ? 0 : 1);"
```

The global runner executes `rmt-vnext-tooling` and `rmt-editor-packaging` as release gates. The VS Code bridge is checked through `node scripts/run_xtend_tests.js rmt-editor-packaging --json` against active-document CodeActions, Safe Fix-All and blocked Kernel Boundary handoffs.

## Next Handoff

`RMT-VNEXT-PRIM-07` is complete. Further editor work can build on this bridge, for example real LanguageClient packaging or UI-specific preview panels; the vNext primitive authoring path itself is release-gated.
