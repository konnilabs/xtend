# RMT AI Developer Kit Prompts

## Authoring

Load `rmt-ai-kit.compact.md`, then load reference JSONL records for the domains in the user request. Write only declarative RMT. Use one recipe as the shape source. Run `xt rmt lint <file> --agent` before claiming success.

## Repair

Run `xt rmt lint <file> --agent`. Apply only safe workspace-edit repairs in `fixOrder`. Do not rewrite unsafe no-op diagnostics. Re-run lint after each batch and summarize remaining no-ops.

## Migration

Identify whether input is legacy JSON/Core or native `.rmt`. Preserve semantics, migrate toward native `.rmt`, and keep host adapter work outside RMT source. Validate with linter and compiler.

## Maraca Build

Plan before build. Use strict orchestration, kernel, hydration, validation and transitions for production. Treat Maraca diagnostics as build blockers until explicit owner acceptance.
