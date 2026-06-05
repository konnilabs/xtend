# XTend RMT UI Maximality und Owned Component Surface Hardening Source of Truth Contract

- Status: `accepted by WP-RMO-01`
- Datum: 3. Juni 2026
- Backlog: `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`
- Workpackage: `development/WP-RMO-01-Epic-Scope-Residual-Baseline-und-Source-of-Truth-einfrieren.md`
- Contract: `xtend.rmt-ui-maximality-owned-component-surface-hardening.source-of-truth.v1`
- Residual Matrix: `xtend.rmt-ui-maximality-owned-component-surface-hardening.residual-matrix.v1`
- Residual Schema: `xtend.rmt-ui-maximality-owned-component-surface-hardening.residual.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-component-surface-hardening.residual-fixture.v1`
- Fixture Pack Schema: `xtend.rmt-ui-maximality-owned-component-surface-hardening.residual-fixtures.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-component-surface-hardening.baseline-report.v1`
- Fixture Pack: `tests/fixtures/native-first/rmt-ui-maximality-owned-surface-residual-fixtures.json`
- Source Mission Handoff: `xtend.native-first.mission-handoff.v1`
- Next Epic Boundary: `rmt-ui-maximality-and-owned-component-surface-hardening`
- Local Gate: `node scripts/run_xtend_tests.js rmt-ui-maximality-owned-surface-baseline --json`
- Package Script: `npm run test:rmt-ui-maximality-owned-surface-baseline`
- Boundary: `no-external-ui-framework-default`
- Boundary: `no-new-runtime-dependency-before-adoption-gate`
- Boundary: `no-datagrid-or-command-parity-claim-before-owned-package`
- Boundary: `browser-and-visual-claims-require-evidence`
- Boundary: `rmt-kernel-remains-host-neutral`
- Boundary: `no-second-surface-component-or-command-registry`
- Zielzustand: `rmt-ui-maximality-owned-surface-baseline-accepted`

## Zweck

Dieser Contract friert den Scope des Folge-Backlogs nach `NFM-WP-22` ein. Die Native-First-Mission ist `accepted-with-residuals`; dieses Paket macht daraus eine startbare Baseline fuer RMT UI Maximality und Owned Component Surface Hardening.

WP-RMO-01 implementiert keine Data-Display- oder Command/Search-Runtime. Es ordnet Residuals, Owner, Ziel-Workpackages, Gates, Claim-Grenzen und Source-of-Truth-Artefakte so, dass `WP-RMO-02`, `WP-RMO-03` und `WP-RMO-04` ohne neue Scope-Diskussion starten koennen.

## Residual Schema

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `residualId` | ja | stabile Residual-ID, zum Beispiel `RMO-RES-01` |
| `residual` | ja | Residual aus `NFM-WP-22` oder daraus abgeleiteter Baseline-Eintrag |
| `sourceHandoffs` | ja | Handoff-IDs aus `NFM-HO-01` bis `NFM-HO-06` |
| `residualClass` | ja | Klasse wie `owned-component-gap`, `browser-evidence` oder `docs-gate-residual` |
| `priority` | ja | `P0`, `P1` oder `P2` |
| `owner` | ja | Owner-Rolle fuer Umsetzung oder Handoff |
| `targetWorkpackage` | ja | fuehrendes `WP-RMO-*` Zielpaket |
| `targetStatus` | ja | Baseline-Status fuer das Zielpaket |
| `claimBoundary` | ja | Claim-Grenze, die bis zur Umsetzung aktiv bleibt |
| `requiredGates` | ja | lokale Gates, die die Entscheidung oder Folgearbeit absichern |
| `sourceArtifacts` | ja | fuehrende Dokumente, Fixtures oder Matrices |
| `blockedClaims` | ja | Produktclaims, die bis zur Umsetzung verboten bleiben |
| `nextHandoff` | ja | naechstes Paket, Owner-Review oder Release-Handoff |

## Residual Statusmodell

| Status | Bedeutung | Erlaubte Claims |
|--------|-----------|-----------------|
| `gate-residual-ready` | Residual ist ein Gate-/Docs-/TypeExports-Problem und kann ohne Produktfeature-Arbeit angegangen werden | nur Gate-Hygiene-Claim |
| `implementation-ready` | Residual besitzt genug Scope, Owner und Boundaries fuer ein Implementierungspaket | nur Startbarkeitsclaim, kein Produktvollstaendigkeitsclaim |
| `browser-evidence-planned` | Residual braucht echte Browser- oder Visual-Evidence | nur Handoff-Claim bis Artefakte vorliegen |
| `migration-handoff-planned` | Residual braucht Migration-, Deprecation- oder Docs-Handoff | kein Removal- oder Vollstaendigkeitsclaim |

## Source-of-Truth

| Artefaktklasse | Rolle |
|----------------|-------|
| `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md` | fuehrendes Backlog fuer Workpackages, Status und Handoff |
| `development/XTend-RMT-UI-Maximality-Owned-Component-Surface-Hardening-Source-of-Truth-Contract.md` | fuehrender Scope-, Boundary- und Residual-Contract |
| `development/XTend-RMT-UI-Maximality-Owned-Component-Surface-Hardening-Residual-Matrix.md` | Residual-Matrix fuer Owner, Ziel-WP, Gates und blockierte Claims |
| `tests/fixtures/native-first/rmt-ui-maximality-owned-surface-residual-fixtures.json` | maschinenlesbare Residual-Fixtures fuer lokale Gate-Auswertung |
| `development/XTend-Native-First-Mission-Handoff-Decision-Matrix.md` | Quelle fuer `NFM-HO-*` Handoff-Entscheidungen |
| `development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md` | Quelle fuer RMT UI Maximality Gaps |
| `development/XTend-Native-First-Market-Pattern-Parity-Matrix.md` | Quelle fuer blockierte Data-/Command-Parity-Claims |
| `development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md` | Quelle fuer Complete-UI-Recipe-Coverage und Folge-Recipes |
| `development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Matrix.md` | Quelle fuer Renderer-, Trusted-DOM- und Browser-Lab-Handoffs |
| `development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md` | Quelle fuer Surface Browser Lab und Surface Runtime Handoffs |
| `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md` | Quelle fuer Component Long-Tail und UX-Hardening |
| `development/BACKLOG-XTend-TypeExports-und-Public-Declaration-Hardening.md` | Quelle fuer TypeExports Vendor/Loader Residuals |

## Source Gates

```bash
node scripts/run_xtend_tests.js rmt-ui-maximality-owned-surface-baseline --json
node scripts/run_xtend_tests.js native-first-mission-handoff --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js docs-public-quality --json
node scripts/run_xtend_tests.js component-long-tail-migration --json
node scripts/run_xtend_tests.js type-exports-vendor --json
node scripts/run_xtend_tests.js type-exports-loader --json
node scripts/run_xtend_tests.js native-first-market-pattern-parity --json
node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json
node scripts/run_xtend_tests.js native-first-framework-leverage --json
node scripts/run_xtend_tests.js native-first-overlay-focus --json
node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
node scripts/run_xtend_tests.js rmt-native-shell-migration --json
node scripts/run_xtend_tests.js surface-browser-lab --json
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js references --json
```

## Startbarkeitsentscheidung

| Folgepaket | Entscheidung | Begruendung |
|------------|--------------|-------------|
| `WP-RMO-02` | `ready` | Gate-Residuals sind isoliert und besitzen konkrete lokale Gates |
| `WP-RMO-03` | `implementation-ready-after-gate-hygiene` | Data Display Scope, Owner, blockierte Claims und Ziel-Gates sind eingefroren |
| `WP-RMO-04` | `implementation-ready-after-gate-hygiene` | Command/Search Scope, Owner, blockierte Claims und Ziel-Gates sind eingefroren |

## Nicht-Ziele

- keine Data-Display- oder Command/Search-Runtime in WP-RMO-01
- keine neue Component-, Surface- oder Command-Registry
- keine neue Runtime-Dependency
- kein Vollstaendigkeitsclaim fuer DataGrid, Command Palette, Browser Visuals oder Surface Maximality
- keine Aenderung der RMT-Kernel-Boundary

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Alle `NFM-WP-22` Residuals besitzen Ziel-Workpackage, Owner, Gate und Claim Boundary | erfuellt |
| `WP-RMO-03` und `WP-RMO-04` sind fachlich implementierungsbereit | erfuellt |
| Gate-Hygiene bleibt als `WP-RMO-02` vor Produktclaims geschaltet | erfuellt |
| Keine neue Runtime-Dependency entsteht | erfuellt |
| Runner und Package expose `rmt-ui-maximality-owned-surface-baseline` | erfuellt |
