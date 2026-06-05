# XTend RMT Owned Release Handoff Contract

- Status: `accepted-with-residuals`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-release-handoff.v1`
- Decision Matrix: `xtend.rmt-ui-maximality-owned-release-handoff-decision-matrix.v1`
- Decision Schema: `xtend.rmt-ui-maximality-owned-release-handoff-decision.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-release-handoff-fixture.v1`
- Fixture Pack Schema: `xtend.rmt-ui-maximality-owned-release-handoff-fixtures.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-release-handoff-report.v1`
- Workpackage: `WP-RMO-09`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-release-handoff --json`
- Package Script: `npm run test:rmt-owned-release-handoff`
- Backlog: `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`
- Next Epic Boundary: `rmt-owned-runtime-components-and-docs-quality-hardening`

## Zweck

`WP-RMO-09` schliesst das Folge-Epic `rmt-ui-maximality-and-owned-component-surface-hardening` fachlich ab. Das Epic ist nicht leergeraeumt, sondern als `accepted-with-residuals` akzeptiert: RMT kann die neuen UI-Flaechen ueber Contracts, Recipes, Browser-Lab-Artefakte und Budget-Handoffs beschreiben, waehrend physische Runtime-Komponenten, echte Pixel-Owner-Runs und bekannte Public-Docs-Altbefunde sichtbar bleiben.

Der Contract ist ein Release-Owner-Artefakt. Er fuehrt keine Runtime-Flaeche ein, erlaubt keine neue Dependency und hebt keine blockierten Claims auf.

## Decision Schema

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `handoffId` | ja | stabile Handoff-ID, zum Beispiel `RMO-HO-01` |
| `releaseArea` | ja | Abschlussbereich innerhalb des RMO-Epics |
| `sourceWorkpackages` | ja | Workpackages, aus denen die Entscheidung abgeleitet wird |
| `sourceContracts` | ja | fuehrende Contract-IDs fuer die Entscheidung |
| `status` | ja | `accepted`, `accepted-with-residuals` oder `needs-next-epic` |
| `releaseDecision` | ja | Release-Owner-Entscheidung |
| `nextEpicBoundary` | ja | Folgegrenze, Cadence oder Owner-Review |
| `residuals` | ja | explizite Restarbeit; `none` nur bei abgeschlossener Flaeche |
| `blockedClaims` | ja | Claims, die trotz Handoff nicht freigegeben sind |
| `requiredGates` | ja | lokale Gates, die die Entscheidung absichern |
| `evidenceArtifacts` | ja | Docs, Matrix, Fixture oder Contract-Artefakte |
| `owner` | ja | Owner-Rolle fuer Nachverfolgung |
| `nextHandoff` | ja | naechster Review, Epic oder Release-Handoff |

## Statusmodell

| Status | Bedeutung | Erlaubte Claims |
|--------|-----------|-----------------|
| `accepted` | Abschlussbereich ist gatebar und ohne blockierende Residuals | Release-Reports duerfen den Claim ohne Residualhinweis referenzieren |
| `accepted-with-residuals` | Abschlussbereich ist akzeptiert, besitzt aber dokumentierte Residuals | Reports muessen Residuals, Blocked Claims, Gates und Owner ausgeben |
| `needs-next-epic` | Bereich braucht eine eigene Folgegrenze vor breiteren Produktclaims | nur als Handoff-Claim, kein Vollstaendigkeitsclaim |

## Source Gates

```bash
node scripts/run_xtend_tests.js rmt-owned-release-handoff --json
node scripts/run_xtend_tests.js rmt-ui-maximality-owned-surface-baseline --json
node scripts/run_xtend_tests.js rmt-ui-maximality-owned-surface-gate-hygiene --json
node scripts/run_xtend_tests.js rmt-owned-data-display-primitives --json
node scripts/run_xtend_tests.js rmt-owned-command-search-primitives --json
node scripts/run_xtend_tests.js rmt-owned-recipe-extension --json
node scripts/run_xtend_tests.js rmt-owned-surface-browser-lab --json
node scripts/run_xtend_tests.js rmt-owned-contract-budget-runtime-parity --json
node scripts/run_xtend_tests.js rmt-owned-migration-deprecation-docs-handoff --json
node scripts/run_xtend_tests.js native-first-mission-handoff --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js native-first-evidence-pack --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
node scripts/run_xtend_tests.js docs-public-quality --json
node scripts/run_xtend_tests.js type-exports-vendor --json
node scripts/run_xtend_tests.js type-exports-loader --json
node scripts/run_xtend_tests.js component-long-tail-migration --json
node scripts/run_xtend_tests.js references --json
```

`docs-public-quality` bleibt ein expliziter Owner-Handoff, solange die bekannten Legacy-Befunde bestehen. Der WP-RMO-09-Claim darf diesen Gate nicht als gruenen Public-Docs-Claim ausgeben.

## Final Owner Decision

| Entscheidung | Wert |
|--------------|------|
| Epic Status | `accepted-with-residuals` |
| Release Decision | `accepted-with-residuals` |
| Next Epic Boundary | `rmt-owned-runtime-components-and-docs-quality-hardening` |
| No Runtime Dependency Added | `true` |
| External UI Framework Default | `blocked` |
| Unsafe Manual DOM Sink Claim | `blocked` |
| RMT Kernel Boundary | `no-rmt-kernel-import-of-xtend-types` |

## Residual-Regeln

- Ein Residual darf keinen Produktclaim ohne Owner-Hinweis freigeben.
- Ein Residual braucht Owner, Gate, Evidence-Artefakt und naechsten Handoff.
- Bekannte Legacy-Docs-Gates duerfen als Residual benannt werden, duerfen aber nicht als Beleg fuer neue Public-Docs-Vollstaendigkeitsclaims zaehlen.
- Conditional Browser Evidence bleibt conditional, bis ein Owner reale Pixel-/Browser-Artefakte akzeptiert.
- Kein Residual darf eine neue Runtime-Dependency, Framework-Kopplung oder unsichere DOM-Sink-Flaeche oeffnen.
- RMT-Kernel-Neutralitaet bleibt auch in der Folgegrenze unveraendert.

## Nicht-Ziele

- keine produktive Implementierung von `x-table`, `x-virtual-list`, `x-command-palette`, `x-autocomplete` oder `x-combobox` in WP-RMO-09
- keine Freigabe von DataGrid- oder Command-Palette-Vollparitaet
- keine neue Runtime-Dependency fuer Virtualisierung, Search, Highlighter oder Docs-Konvertierung
- keine breite Prism-, Turndown- oder Vendor-Fassade
- keine stille Loader-Entfernung
- kein Import von XTend-Komponenten oder Host-Typen in den RMT-Kernel

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Release-Handoff besitzt Contract, Matrix, Fixture Pack und lokales Gate | erfuellt |
| alle `WP-RMO-*` besitzen einen Abschlussstatus | erfuellt |
| blockierte Claims bleiben maschinenlesbar sichtbar | erfuellt |
| Release-Status ist eindeutig `accepted-with-residuals` | erfuellt |
| Folgegrenze ist eindeutig `rmt-owned-runtime-components-and-docs-quality-hardening` | erfuellt |
| Package und Runner expose `rmt-owned-release-handoff` | erfuellt |
| keine neue Runtime-Dependency entsteht | erfuellt |

