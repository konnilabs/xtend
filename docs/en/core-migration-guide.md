# XTend Core Migration Guide

## Overview

This guide summarizes the production Core standards from Epic 01. It serves as a migration aid for legacy call sites and as a reference for new XTend Core changes.

## Verification

The current Core contract can be verified automatically:

```bash
node scripts/verify_xtend_core_contracts.js
```

## Runtime Standards

- `window.XTend.compliance` provides the checklist, contract overview and theme tokens.
- central design tokens are registered per theme through `xtheme` and mirrored onto `document.documentElement`.
- overlay and feedback components respect `prefers-reduced-motion`, focus standards and canonical XTend state keys.

## RMT Templating Migration Starting with Epic 04

RMT templating is additive and opt-in. Existing XTend apps, classic HTML/JS integrations and existing Web Component usage remain valid. An app only uses XTendRMT when it deliberately registers an `.rmt` document, an RMT root handshake, a template record or a host adapter.

The binding migration note is in `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`.
The current product overview is in `docs/xtendrmt-overview.md`. The production native authoring model starting with Epic 05 is in `docs/xtendrmt-native-authoring.md`; the App DSL reference is in `docs/xtendrmt-app-dsl.md`; Runtime Bridge and adapters are described in `docs/xtendrmt-runtime-bridge.md`. The migration from metadata paths to top-level domains is in `docs/xtendrmt-migration-guide.md`.

| Starting Point | Migration Path |
|----------------|----------------|
| XTend-only app | keep running unchanged; activate RMT only for new roots or template pilots |
| XTend with XRouter | prepare route records, production adapter execution in Epic 05 |
| XTend next to React/Vue | use RMT as scheduler or template transport, keep host adapters separate |
| Vanilla or custom host | declare custom scheduler endpoints, assume no XTend capabilities |
| Legacy demo | classify and verify, do not silently turn it into the RMT product contract |

Review rules for RMT-compatible changes:

- no XTend runtime imports in the RMT kernel
- no forced migration for existing apps
- no new XTend template language beside RMT
- `kernelVisible: false` for XTend-specific adapter data
- use production bridge factories instead of private demo bridge logic
- historical scaffold artifacts with `bridgeRuntime: reserved-for-Epic-05` remain readable as the Epic 04 handoff, but are no longer the operative bridge status
- `node scripts/run_xtend_tests.js rmt-compatibility --json` and `node scripts/run_xtend_tests.js references --json` as minimum gates

## Native RMT Routes and Components Starting with Epic 05

New App DSL documents should keep operative routing, component and scheduling data in native top-level domains:

- `manifest.metadata.routes -> routes`
- `manifest.metadata.components -> components`
- `manifest.metadata.schedules -> schedules`
- `xtend.xrouter` remains the router adapter
- `xtend.component` remains the component adapter
- `rmt.state-scheduler-diagnostics` remains the bridge adapter

`manifest.metadata` remains valid for description, handoff and historical demo notes, but should not carry new operative route or component bridges. Template-only documents remain compatible.

Production execution uses:

- `createRmtFormat().normalizeDocument(...)`
- `createRmtFormat().createRuntimeRegistries(...)`
- `createRmtXRouterAdapter(...)`
- `createRmtXtendComponentAdapter(...)`
- `createRmtStateSchedulerDiagnosticsBridge(...)`

The Docs App itself remains Parsedown-based, but now renders its app shell shell-first from RMT. The scheduling and shell path has been described as the official pilot since `ER-WP-40` in `docs/xtendrmt-parsedown-scheduling.md` and `docs/xtendrmt-parsedown-docs.rmt`.

## Legacy to Canonical

| Area | Legacy | Canonical | Status |
|------|--------|-----------|--------|
| Dialog Open | `dialog-open-<id>` | `xtend.component.x-dialog.<id>.open` | Legacy remains compatible |
| Dialog Open | `xdialog-open-<id>` | `xtend.component.x-dialog.<id>.open` | Legacy remains compatible |
| Modal Open | `modal-open-<id>` | `xtend.component.x-modal.<id>.open` | Legacy remains compatible |
| Theme Current | `theme` | `xtend.theme.current` | both are mirrored |
| Theme List | `themes` | `xtend.theme.available` | both are mirrored |
| Router Last Navigation | `router-navigated` | `xtend.router.lastNavigated` | both are mirrored |
| Alert State | `xalert-state-<id>` | `xtend.component.x-alert.<id>` | Legacy remains compatible |

## What New Core Changes Must Consider

- new UI flows need an explicit `xstate` twin
- docs, API, type definitions and runtime must use the same contract
- new components or larger Core changes must run against the compliance checklist and the verification script

## Design Tokens

The central tokens come from `xtheme` and can be adjusted per theme:

- `--xtend-color-primary`
- `--xtend-color-primary-dark`
- `--xtend-color-accent`
- `--xtend-glass-bg`
- `--xtend-glass-blur`
- `--xtend-shadow`
- `--xtend-border`
- `--xtend-radius`
- `--xtend-font-family`
- `--xtend-focus-outline`
- `--xtend-surface`
- `--xtend-surface-muted`
- `--xtend-text`
- `--xtend-overlay-bg`

## Notes for Existing Integrations

- Existing legacy open flags for dialog and modal do not have to be removed immediately, but should no longer be introduced in new code.
- New API-near integrations should prefer `window.XTend.*` over unnamespaced helpers.
- For Core reviews, the checklist in `development/XTend-Core-Compliance-Checklist.md` is the operative source.
