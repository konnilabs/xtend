# WP-E10-15 - Browser-, A11y-, Performance- und Visual-Gates erweitern

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Contract: `xtend.epic10.wp15.platform-gates.v1`
- Plattform-Contract: `xtend.epic10.platform-gates.v1`
- Modul: `catalog/epic10-platform-gates.js`
- Suite: `tests/platform/epic10_platform_gates_suite.js`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic10-platform-gates --json`
- Package Script: `npm run test:epic10-platform-gates`

## Ziel

Dieses Paket macht die Plattformregeln aus Epic 10 lokal gatebar. Die neue Gate-Kette verbindet Component Contract v2, Existing Component Metadata, RMT-first Demo-App, Browser-Smokes, A11y, Performance und Visual Regression in einem maschinenlesbaren Plan.

## Umgesetzte Artefakte

- `catalog/epic10-platform-gates.js`
- `tests/platform/epic10_platform_gates_suite.js`
- `development/XTend-Epic10-Platform-Gates.md`
- `docs/epic10-platform-gates.md`
- Package Export `./catalog/epic10-platform-gates`
- Package Script `test:epic10-platform-gates`
- Runner-Suite `epic10-platform-gates`
- Scaffold-Config `epic10PlatformGates`
- Dokumentations- und Referenzpfad-Updates

## Abnahmepunkte

- `WP-E10-15` ist in Epic und Backlog als `completed` markiert.
- `WP-E10-16` ist als Abschluss- und Release-Handoff-Paket vorgesehen.
- Fast PR Gates enthalten Browser-, A11y-, Existing-Metadata-, RMT-first Demo- und Visual-Prioritaetsgates.
- Release Gates enthalten zusaetzlich Performance Regression, Fabric Measurements und Hydration Policies.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.
- Die Gate-Kette arbeitet lokal und ohne CDN.

## Fast PR Gate

```bash
node scripts/run_xtend_tests.js component-contract-v2 epic10-p0-component-wave component-lab-rmt-inspector rmt-first-demo-app existing-component-metadata browser a11y-hydration screenreader-signals motion-contrast regression-priority references --json
```

## Release Gate

```bash
node scripts/run_xtend_tests.js --json
npm run test:release:full
```

## Handoff

`WP-E10-16` finalisiert Entwicklerdokumentation, Guides und Release-Handoff. Die offene Runtime-Frage zur kanonischen Component-Fabric-Boundary bleibt dort als Architekturentscheidung sichtbar.
