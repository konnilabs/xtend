# XTend Native-First Mission Handoff Contract

- Status: `accepted by NFM-WP-22`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-22-Native-First-Mission-Handoff-und-naechste-Epic-Grenze-entscheiden.md`
- Folge-Backlog: `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`
- Contract: `xtend.native-first.mission-handoff.v1`
- Decision Matrix: `xtend.native-first.mission-handoff-decision-matrix.v1`
- Decision Schema: `xtend.native-first.mission-handoff-decision.v1`
- Fixture Schema: `xtend.native-first.mission-handoff-fixture.v1`
- Fixture Pack Schema: `xtend.native-first.mission-handoff-fixtures.v1`
- Report Schema: `xtend.native-first.mission-handoff-report.v1`
- Mission Source Contract: `xtend.native-first.mission-source-of-truth.v1`
- Contract Registry Contract: `xtend.native-first.contract-registry.v1`
- Audit Evidence Pack Contract: `xtend.native-first.audit-evidence-pack.v1`
- Budget Gate Contract: `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- Docs Authoring Contract: `xtend.native-first.docs-authoring-guides.v1`
- Migration Deprecation Plan Contract: `xtend.native-first.migration-deprecation-plan.v1`
- Local Gate: `node scripts/run_xtend_tests.js native-first-mission-handoff --json`
- Package Script: `npm run test:native-first-mission-handoff`
- Boundary: `owner-handoff-before-release-claim`
- Boundary: `accepted-with-residuals-is-explicit`
- Boundary: `next-epic-boundary-is-single-source`
- Boundary: `no-new-runtime-dependency`
- Boundary: `rmt-kernel-remains-host-neutral`
- Zielzustand: `native-first-mission-handoff-accepted-with-residuals`

## Zweck

Dieser Contract schliesst die Native-First-Mission fachlich ab. Er sammelt die Ergebnisse aus Radar, Dependency Diet, owned Component Surface, Contract Registry, Audit Evidence, RMT UI Maximality, Budget Gates, Docs und Migration und fuehrt sie in eine Owner-Entscheidung ueber Release-Status und naechste Epic-Grenze.

WP-22 implementiert keine neue Runtime-Flaeche. Das Paket ist ein Handoff- und Entscheidungsartefakt. Es darf Residuals nur akzeptieren, wenn sie Owner, Gate, Evidence-Artefakt und naechsten Handoff besitzen.

## Decision Schema

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `handoffId` | ja | stabile Handoff-ID, zum Beispiel `NFM-HO-01` |
| `missionPillar` | ja | Mission-Pillar oder Abschlussbereich |
| `sourceWorkpackages` | ja | Workpackages, aus denen die Entscheidung abgeleitet wird |
| `sourceContracts` | ja | fuehrende Contract-IDs fuer die Entscheidung |
| `status` | ja | `accepted`, `accepted-with-residuals` oder `needs-next-mission-epic` |
| `releaseDecision` | ja | Release- oder Owner-Handoff-Entscheidung |
| `nextEpicBoundary` | ja | naechste Epic-Grenze oder Review-Kadenz |
| `residuals` | ja | explizite Restarbeit; `none` nur bei abgeschlossener Flaeche |
| `requiredGates` | ja | lokale Gates, die die Entscheidung absichern |
| `evidenceArtifacts` | ja | Docs, Matrix, Fixture oder Contract-Artefakte |
| `owner` | ja | Owner-Rolle fuer Nachverfolgung |
| `nextHandoff` | ja | naechster Review, Epic oder Release-Handoff |

## Statusmodell

| Status | Bedeutung | Erlaubte Claims |
|--------|-----------|-----------------|
| `accepted` | Missionsteil ist abgeschlossen, gatebar und ohne blockierende Residuals | Release- und Audit-Reports duerfen den Claim ohne Residualhinweis referenzieren |
| `accepted-with-residuals` | Missionsteil ist akzeptiert, besitzt aber dokumentierte und ownerbare Residuals | Reports muessen Residuals, Gate und naechsten Handoff ausgeben |
| `needs-next-mission-epic` | Missionsteil braucht ein eigenes Folge-Epic, bevor der Produktclaim breiter freigegeben wird | nur als Handoff-Claim, kein Vollstaendigkeitsclaim |

## Source Gates

```bash
node scripts/run_xtend_tests.js native-first-mission-handoff --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js native-first-evidence-pack --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
node scripts/run_xtend_tests.js native-first-market-pattern-parity --json
node scripts/run_xtend_tests.js native-first-framework-leverage --json
node scripts/run_xtend_tests.js native-first-form-navigation-media --json
node scripts/run_xtend_tests.js native-first-overlay-focus --json
node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json
node scripts/run_xtend_tests.js rmt-syntax-growth --json
node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives --json
node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js references --json
```

## Mission Decision

Die Mission wird als `accepted-with-residuals` abgeschlossen. Die naechste Epic-Grenze lautet:

```text
rmt-ui-maximality-and-owned-component-surface-hardening
```

Diese Grenze kombiniert die beiden staerksten offenen Achsen:

- RMT UI Maximality: Data Display, Command/Search, Visual Evidence und Surface Browser Lab brauchen ein dediziertes Folge-Epic.
- Owned Component Surface Hardening: Data Display, Command/Search und Docs/Highlighter-Ownership muessen als eigene XTend-Primitives statt Framework- oder Vendor-Default weitergefuehrt werden.

Nicht in die naechste Epic-Grenze verschoben werden die Missionsgrundlagen. Browser Primitive Radar, Adoption Gate, Dependency Diet, Contract Registry, Runtime Parity, Audit Evidence, Budget Gates, Docs Authoring und Migration/Deprecation sind gatebar und bleiben als laufende Governance aktiv.

Das operative Backlog fuer diese Grenze ist `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`.

## Residual-Regeln

- Ein Residual darf keinen Produktclaim blockfrei erscheinen lassen.
- Ein Residual braucht Owner, Gate und naechsten Handoff.
- Bekannte Legacy-Docs-Gates duerfen als Residual benannt werden, duerfen aber nicht als Beleg fuer neue WP-22-Artefakte zaehlen.
- Kein Residual darf eine neue Runtime-Dependency, Framework-Kopplung oder unsichere DOM-Sink-Flaeche oeffnen.
- RMT-Kernel-Neutralitaet bleibt auch im Folge-Epic unveraendert.

## Nicht-Ziele

- keine neue Runtime-Komponente in WP-22
- keine Freigabe externer UI-Framework-Abhaengigkeit
- keine stille Deprecation oder Entfernung bestehender Legacy-Pfade
- kein Ersatz fuer Browser-Lab-, Visual- oder Release-Owner-Ausfuehrung
- keine Kopplung des RMT-Kernels an Host-, Browser-, Component- oder Framework-Typen

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Mission-Handoff besitzt Contract, Matrix, Fixture Pack und lokales Gate | erfuellt |
| jede Pillar-Entscheidung besitzt Source Workpackages, Contracts, Gates, Evidence und Owner | erfuellt |
| Release-Status ist eindeutig `accepted-with-residuals` | erfuellt |
| naechste Epic-Grenze ist eindeutig `rmt-ui-maximality-and-owned-component-surface-hardening` | erfuellt |
| Registry, Package und Runner expose `native-first-mission-handoff` | erfuellt |
| keine neue Runtime-Dependency entsteht | erfuellt |
