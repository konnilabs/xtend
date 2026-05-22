# XTend Scaffold Previews

- Status: scaffold preview convention
- Reference gate: `node scripts/run_xtend_tests.js references`
- Generator: `node xtend-builder/scaffold.js preview --tag x-example --profile display --feature state --json`

## Purpose

This directory is reserved for scaffolded component preview plans. A preview plan is a local Markdown reference that connects generated component source, docs, fixture, types and manifest patch output to the documentation and demo reference registry.

## Minimum Contract

- Preview paths follow `docs/previews/<name>.preview.md`.
- Preview plans must be listed in `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` before they become automated references.
- Preview plans must use repo-local component, fixture and manifest paths.
- External network dependencies are not allowed for automated scaffold previews.
- Productive preview writes remain review-first until a later package introduces a write mode.
