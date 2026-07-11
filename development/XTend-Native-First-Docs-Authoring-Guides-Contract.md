# XTend Native-First Docs Authoring Guides Contract

- Status: `accepted by NFM-WP-20`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-20-Docs-und-Authoring-Guides-fuer-Native-First-XTend-aktualisieren.md`
- Contract: `xtend.native-first.docs-authoring-guides.v1`
- Matrix: `xtend.native-first.docs-authoring-guide-matrix.v1`
- Guide Item: `xtend.native-first.docs-authoring-guide.v1`
- Report Schema: `xtend.native-first.docs-authoring-guides-report.v1`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Dependency Diet Policy: `xtend.native-first.dependency-diet-policy.v1`
- Registry Contract: `xtend.native-first.contract-registry.v1`
- Recipe Contract: `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`
- Renderer Proof Contract: `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1`
- Budget Gate Contract: `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- Local Gate: `node scripts/run_xtend_tests.js native-first-docs-authoring --json`
- Package Script: `npm run test:native-first-docs-authoring`
- Boundary: `docs-before-native-first-product-claim`
- Boundary: `registered-contract-id-before-docs-claim`
- Boundary: `rmt-first-recipes-before-host-shell-workaround`
- Boundary: `no-public-docs-internal-planning-vocabulary`
- Boundary: `no-runtime-dependency-from-docs`

## Zweck

Dieser Contract macht die Native-First-Mission fuer Autoren nutzbar. Er bindet oeffentliche Docs, RMT-Rezepte, Contract Registry, Dependency Diet, Trusted-DOM-Boundaries und Budget-Pflichten an eine pruefbare Doku-Oberflaeche.

Docs duerfen Native-First-Claims nur dann als produktiv empfehlen, wenn die zugrunde liegende Contract-ID registriert ist, ein lokaler Gate existiert und die empfohlenen Authoring-Pfade RMT-first, contract-safe und dependency-minimal bleiben.

## Guide Schema

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `guideId` | ja | stabile Guide-ID, zum Beispiel `NFM-DOC-01` |
| `audience` | ja | Zielgruppe: Component Author, App Author oder Release Reviewer |
| `docsPaths` | ja | lokalisierte oeffentliche Markdown-Pfade |
| `sourceContracts` | ja | Contract-IDs, die der Guide erklaert |
| `requiredGates` | ja | lokale Gates, die den Guide absichern |
| `requiredTopics` | ja | Themen, die der Guide abdecken muss |
| `blockedTerms` | ja | Begriffe oder Claims, die im oeffentlichen Guide nicht erscheinen duerfen |
| `status` | ja | Status des Guide-Artefakts |
| `owner` | ja | Pflege-Owner fuer Drift und Review |
| `nextHandoff` | ja | Folgepaket oder Owner-Review |

## Statusmodell

| Status | Bedeutung | Erlaubte Claims |
|--------|-----------|-----------------|
| `guide-accepted` | Guide ist lokalisiert, im Menu verankert und an Registry/Gates gebunden | Native-First-Authoring-Claims duerfen referenziert werden |
| `guide-accepted-with-residuals` | Guide ist nutzbar, aber ein Produkt- oder Browser-Lab-Residual bleibt explizit | Claims muessen Residuals nennen |
| `guide-handoff-to-migration` | Guide benennt blockierte non-native oder vendor-backed Pfade fuer das Migrationspaket | nur Migration- und Deprecation-Planung, kein Produktclaim |

## Pflicht-Guides

| Guide | Audience | Status | Oeffentliche Pfade | Kernpflicht |
|-------|----------|--------|--------------------|-------------|
| `NFM-DOC-01` | `component-author` | `guide-accepted` | `docs/de/native-first-authoring-guide.md`, `docs/en/native-first-authoring-guide.md` | Native-First-Leitentscheidung, Dependency Default, Contract Registry, Trusted DOM und Budget-Pflichten erklaeren |
| `NFM-DOC-02` | `app-author` | `guide-accepted` | `docs/de/native-first-rmt-recipes.md`, `docs/en/native-first-rmt-recipes.md` | RMT-first Recipes fuer App Shell, Dashboard, Form, Overlay, Navigation, Media und Docs Flow beschreiben |
| `NFM-DOC-03` | `release-reviewer` | `guide-accepted-with-residuals` | `docs/de/native-first-release-review.md`, `docs/en/native-first-release-review.md` | Nachweispruefung fuer Registry, Evidence Pack, Budget Gates, Browser Residuals und Supply Chain bereitstellen |

## Required Topics

- `browser-native-first`
- `avoid-runtime-dependency`
- `contract-registry-discoverability`
- `trusted-dom-boundary`
- `dom-descriptor-default`
- `rmt-complete-ui-recipes`
- `rmt-action-effect-data-resource-primitives`
- `performance-complexity-bundle-budget-gates`
- `blocked-non-native-claims`
- `migration-handoff-for-vendor-backed-paths`
- `public-docs-localized-de-en`

## Source Gates

```bash
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js native-first-evidence-pack --json
node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json
node scripts/run_xtend_tests.js docs-public-quality --json
node scripts/run_xtend_tests.js references --json
```

## Oeffentliche Docs-Regeln

- Jeder Guide besitzt `docs/de/*` und `docs/en/*`.
- Jeder Guide ist in `docs/menu.json` eingetragen.
- `docs/de/README.md`, `docs/en/README.md` und `docs/en/README.md` referenzieren die Guide-Familie.
- Oeffentliche Guides nennen keine internen Workpackage-, Handoff-, Gate-Matrix- oder Release-Owner-Planungsbegriffe.
- Oeffentliche Guides verwenden keine Framework-Parity-Claims wie "genau wie React/Vue/Angular".
- Oeffentliche Guides empfehlen keine neue Runtime-Dependency als Komfortpfad.
- Unsichere HTML-, Eval-, Inline-JavaScript- oder Raw-Sink-Patterns bleiben verboten.

## Nicht-Ziele

- keine neue Runtime-Implementierung
- kein neues Browser- oder Visual-Lab
- kein externer Docs-Generator
- keine Framework-API-Emulation als Doku-Komfort
- keine Migration bestehender Vendor-Pfade; das folgt in `NFM-WP-21`

## Handoff

- `NFM-WP-21` plant Migration und Deprecation fuer vendor-backed, legacy und non-native Pfade.
- `NFM-WP-22` nutzt Docs Authoring, blocked public Claims und Docs-Residuals fuer Mission-Handoff und naechste Epic-Grenze.

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Drei lokalisierte Guide-Familien existieren | erfuellt |
| Guides sind im Docs-Menu und in README-Einstiegen verankert | erfuellt |
| Guides referenzieren registrierte Contract-IDs statt freie Produktclaims | erfuellt |
| RMT-first Recipes und DOM Descriptor Default werden erklaert | erfuellt |
| Budget-, Evidence- und Browser-Residual-Pflichten sind sichtbar | erfuellt |
| Keine neue Runtime-Dependency entsteht | erfuellt |
