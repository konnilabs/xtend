# XTensions Docs, Migration and Enterprise Adoption Handoff Contract

- Workpackage: `XTN-14`
- Schema: `xtend.xtensions.adoption-handoff.v1`
- Report Schema: `xtend.xtensions.adoption-report.v1`
- Diagnostic Schema: `xtend.xtensions.adoption-diagnostic.v1`
- Local Gate: `node scripts/run_xtend_tests.js xtensions-adoption-handoff --json`
- Package Script: `npm run test:xtensions-adoption-handoff`

## Zweck

XTN-14 macht XTensions fuer Enterprise-Adoption startbar, ohne eine Migration bestehender Apps zu erzwingen. Das Handoff dokumentiert Authoring, Migration/Coexistence, Security und Release-Risiken als pruefbare Artefakte.

## Dokumente

- `docs/de/xtensions-authoring-guide.md`
- `docs/de/xtensions-migration-coexistence-guide.md`
- `docs/de/xtensions-security-checklist.md`
- `docs/de/xtensions-enterprise-adoption-handoff.md`

## Boundaries

- `opt-in-coexistence-not-forced-migration`
- `native-first-authoring-remains-default`
- `rmt-kernel-stays-framework-agnostic`
- `hostcontroller-is-the-framework-boundary`
- `fabric-signals-route-cross-surface-events`
- `project-local-manifests-are-primary-distribution`
- `framework-runtimes-remain-external-peer-or-optional`
- `no-vendored-third-party-frameworks-in-repo-or-package`
- `security-gate-before-runtime-loading`
- `degraded-xtension-does-not-block-shell`

## Startpakete

- `external-peer-harness-template`
- `enterprise-policy-pilot`
- `registry-metadata-publisher`
- `browser-smoke-harness`
- `remote-artifact-policy`

## Dependency-Policy

XTN-14 fuehrt keine Framework-Dependency ein. React, Vue, Three, Leaflet, Chart.js und aehnliche Runtimes bleiben externe Peer- oder Optional-Metadaten. Testkomponenten fuer echte Frameworks gehoeren in externe opt-in Peer-Harnesses und nicht in XTend-Root-Dependencies, Workspace-Dependencies, NPM-Files oder vendored Repo-Artefakte.

## Definition of Done

- Authoring Guide, Migration/Coexistence Guide, Security Checklist und Enterprise Handoff sind vorhanden.
- Das opt-in Coexistence-Modell und no forced migration sind dokumentiert.
- Native-First und framework-agnostische Kernel-Boundaries bleiben klar.
- Startpakete fuer Folge-Epics sind priorisiert.
- Der lokale Gate laeuft ohne Netzwerk, ohne Runtime-Ausfuehrung externer Frameworks und ohne neue Package-Dependencies.
