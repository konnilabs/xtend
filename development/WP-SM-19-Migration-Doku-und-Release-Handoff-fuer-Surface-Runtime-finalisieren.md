# WP-SM-19 - Migration, Doku und Release-Handoff fuer Surface Runtime finalisieren

Status: `completed`

## Ziel

Die produktive Surface Runtime ist dokumentiert, migrierbar und releasefaehig. Der Runtime-Claim wird nicht mehr als deferred Adapter-Handoff behandelt, sondern als gatebarer XTend-UI-Pfad fuer App Shells mit nativen `surfaces[*]`.

## Artefakte

| Artefakt | Pfad |
| --- | --- |
| Catalog | `catalog/surface-manager-runtime-release-handoff.js` |
| Contract | `development/XTend-SurfaceManager-Runtime-Release-Handoff-Contract.md` |
| Suite | `tests/rmt/surface_manager_runtime_release_handoff_suite.js` |
| Doku | `development/docs-evidence/root/surface-manager-runtime-release-handoff.md` |
| Authoring Guide Update | `docs/en/surface-manager-authoring-guide.md` |
| Migration Guide Update | `docs/en/surface-manager-migration-guide.md` |
| Release Handoff Update | `development/docs-evidence/root/surface-manager-release-handoff.md` |

## Contract

- Schema: `xtend.surface.runtime-release-handoff.v1`
- Migration Notes: `xtend.surface.runtime-migration-notes.v1`
- Release Gate Matrix: `xtend.surface.runtime-release-gate-matrix.v1`
- Compatibility Notes: `xtend.surface.runtime-compatibility-notes.v1`
- Gate: `node scripts/run_xtend_tests.js surface-runtime-release-handoff --json`

## Definition of Done

- produktiver Runtime-Claim ist dokumentiert und gatebar
- Handoff benennt offene Scopes explizit
- bestehende SurfaceManager-Demos und Fixtures bleiben lauffaehig
- SurfaceController bleibt die einzige Registry
- SurfaceManager ersetzt weder Fabric noch den RMT Kernel

## Offene Scopes

- `project-specific-pixel-artifact-storage`
- `release-owner-signoff-before-public-npm-publish`
- `optional-command-palette-and-workspace-surface-types`
- `remote-runtime-loading-remains-out-of-scope`
- `docs-app-php-parsedown-host-boundary-remains`

## Handoff

Die Surface Runtime geht in Maintenance, Projekt-Hardening oder Release-Owner-Signoff ueber.
