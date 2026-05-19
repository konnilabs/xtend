# WP-E18-13 - Docs, Migration Guide, Vendor Rebuild und Release Handoff

Status: `completed`

## Ziel

Epic 18 wird release-nah abgeschlossen. Die Vendor-Bugfixes sind dokumentiert,
die App-Platform-Migration ist nachvollziehbar, und die lokalen sowie
GitHub-Actions-Gates sind auf den aktuellen Epic-18-Stand gebracht.

## Implementiert

- Release-Handoff-Contract `xtend.epic18.rmt-app-platform-release-handoff.v1`
- Umbrella-Gate `epic18-rmt-app-platform`
- Vendor-Bugfix-Doku fuer Tooltip, Player, Surface Window, Side Panel und
  SurfaceManager Controller
- Migration Guide weg von externen HTML-Hosts hin zu RMT App Platform
  Primitives
- GitHub-Gate-Handoff fuer `npm run test:pr:report` und
  `npm run test:release:full:report`
- Package-/Export-Lock- und Pack-Dry-Run-Evidence als Release-Kommandos

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js epic18-rmt-app-platform --json
```

## Commit-Vorbereitung

Vor dem naechsten GitHub-Commit muessen diese Kommandos gruen sein:

```bash
npm run test:pr:report
npm run test:release:full:report
npm run pack:dry-run
```

## Handoff

Epic 18 hat kein weiteres internes Workpackage. Folgearbeit gehoert in neue
Epics oder projektbezogene Host-Adapter-Slices.
