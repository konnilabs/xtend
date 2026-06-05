# XTend Native-First Dependency Exit Plan Matrix

- Status: `accepted by NFM-WP-04`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.dependency-exit-plan-matrix.v1`
- Parent Contract: `xtend.native-first.dependency-diet-policy.v1`
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-04-Dependency-Diet-Policy-und-Runtime-Dependency-Exit-Plaene-erstellen.md`
- Replacement Matrix: `development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md`

## Zweck

Diese Matrix setzt fuer jede bekannte externe Dependency-, Vendor- oder Legacy-Flaeche Owner, Zweck, Risiko, Review-Kadenz und Exit-Strategie. Sie ist die konkrete Runtime-Dependency-Exit-Plan-Baseline fuer `NFM-WP-04`.

## Baseline

| Klasse | Aktueller Stand |
|--------|-----------------|
| `core-runtime-dependency` | keine externe Runtime-Dependency akzeptiert |
| `runtime-peer-dependency` | keine externe Runtime-Peer-Dependency akzeptiert |
| `internal-peer-dependency` | `@ccslabs/xtend`, `@ccslabs/xtend-compiler` als optionale interne Peers in Tooling-Paketen |
| `build-tooling-dependency` | `rollup`, `terser` in `@ccslabs/xtend-maraca` |
| `editor-extension-dependency` | `vscode-languageclient` in `tools/rmt-editor/vscode` |
| `vendored-utility` | `components/prism.js`, `components/turndown.js` |
| `legacy-runtime-surface` | `xtend-dev.js`, `./legacy-loader` |

## Exit-Plan-Matrix

| ID | Flaeche | Klasse | Owner | Zweck | Risiko | Entscheidung | Review-Kadenz | Exit-Strategie |
|----|--------|--------|-------|-------|--------|--------------|---------------|----------------|
| `NFM-DEP-00` | Core Runtime externe Dependencies | `core-runtime-dependency` | Runtime Owner | Browser-, Component-, RMT-, Fabric- und Loader-Runtime | P0 falls eingefuehrt | `reject-runtime-dependency` als Default | jede Aufnahme und jeder Minor Release | native Primitive, owned XTend Primitive oder keine Aufnahme |
| `NFM-DEP-01` | `xtend-maraca` `rollup` | `build-tooling-dependency` | Maraca Tooling Owner | ESM-Bundling und produktive Bundle-Erzeugung | P1 Supply-Chain und Toolchain-Lock-in | `allow-tooling-dependency` | pro Minor Release oder Rollup-Upgrade | `local-esm-importgraph-fallback`, optionalisieren oder eigener Bundle-Planer |
| `NFM-DEP-02` | `xtend-maraca` `terser` | `build-tooling-dependency` | Maraca Tooling Owner | Minification fuer Maraca Bundle-Artefakte | P1 Supply-Chain und Output-Determinismus | `allow-tooling-dependency` | pro Minor Release oder Terser-Upgrade | `local-minifier-fallback`, unminified budget mode oder eigener Minify-Schritt |
| `NFM-DEP-03` | `tools/rmt-editor/vscode` `vscode-languageclient` | `editor-extension-dependency` | Editor Tooling Owner | VS-Code-LSP-Anbindung an eigenen RMT Language Server | P2 Extension-Scope und Update-Pflege | `allow-editor-extension-dependency` | pro Extension-Release | eigener minimaler stdio client nur bei Security- oder Maintenance-Zwang |
| `NFM-DEP-04` | `xtend-builder` interne Peers | `internal-peer-dependency` | CLI Owner | optionale Kopplung an `@ccslabs/xtend` und `@ccslabs/xtend-compiler` | P2 Version Drift | `allow-internal-peer` | pro Version-Sync | Version-Sync-Gate, optionale Peer-Meta beibehalten |
| `NFM-DEP-05` | `xtend-maraca` interne Peers | `internal-peer-dependency` | Maraca Tooling Owner | optionale Kopplung an XTend Runtime und Compiler | P2 Version Drift | `allow-internal-peer` | pro Version-Sync | Version-Sync-Gate, keine harte Runtime-Installation erzwingen |
| `NFM-DEP-06` | `components/prism.js` | `vendored-utility` | Docs/Component Owner | Syntax Highlighting in lokaler Fassade | P1 HTML-Ausgabe und vendored Codeflaeche | `contain-vendored-utility` | pro Minor Release | RMT semantic tokens, owned highlighter oder kleinere docs-only Fassade |
| `NFM-DEP-07` | `components/turndown.js` | `vendored-utility` | Writer/Docs Owner | HTML-to-Markdown Helper ohne CDN | P1 HTML-Eingangspfad | `contain-vendored-utility` | pro Minor Release oder Trusted-DOM-Aenderung | structured writer, Sanitizing Boundary oder trusted parser |
| `NFM-DEP-08` | `xtend-dev.js`, `./legacy-loader` | `legacy-runtime-surface` | Runtime Owner | Legacy-Kompatibilitaet fuer Loader Surface | P2 Migrationslast | `defer-to-migration-plan` | pro Deprecation-Paket | `NFM-WP-21` mit SemVer-, Docs- und Migration-Fenster |
| `NFM-DEP-09` | transitive Lockfile-Pakete aus Tooling | `transitive-tooling-dependency` | jeweiliger Top-Level-Owner | indirekte Abhaengigkeiten aus Rollup/Terser/VS-Code Tooling | P1/P2 Vulnerability- und License-Findings | `inherit-top-level-policy` | pro CI audit oder SBOM | Top-Level-Upgrade, Dependency-Override oder Toolchain-Exit |

## Runtime-Import-Verbot

Diese Pfade duerfen keine externen Tooling- oder Editor-Dependencies importieren:

- `api.js`
- `xtend-loader.js`
- `xtend-dev.js`
- `components/*.js`
- `fabric/*.js`
- `xtendrmt/*.js`
- browserfaehige RMT-Runtime-Artefakte

Ausnahmen sind nur ueber `allow-runtime-dependency-exception` im Parent Contract erlaubt.

## Conditional Network Evidence

| Evidence | Quelle | Pflicht |
|----------|--------|---------|
| Lockfile-Konsistenz | `node scripts/run_xtend_tests.js supply-chain --json` | lokal |
| Referenzpfade | `node scripts/run_xtend_tests.js references --json` | lokal |
| Vulnerability Audit | `npm audit --audit-level=moderate` | CI/release |
| SBOM | `npm sbom --sbom-format=cyclonedx --json` | CI/release |
| Release Report | `npm run release:report` | release |
| Package Surface | `npm run pack:dry-run` | release |

## Offene Folgeentscheidungen

| Folge | Paket | Grund |
|-------|-------|-------|
| Supply-Chain-Gate kann workspace-weite Dependency-Inventur schaerfen | `NFM-WP-13` | lokale Policy ist bereits gatebar, aber Audit Evidence Pack soll Workspace-/SBOM-Reports buendeln |
| Maraca Toolchain-Budget kann Bundle-/Complexity-Evidence bekommen | `NFM-WP-19` | Rollup/Terser sind akzeptiert, aber Budgetwirkung bleibt separat messbar |
| Vendor Utility Migration planen | `NFM-WP-21` | Prism, Turndown und Legacy Loader brauchen SemVer-/Docs-Fenster |

## Akzeptierte Residuals

| Residual | Status nach NFM-WP-04 |
|----------|-----------------------|
| `rollup` | `accepted-build-tooling-dependency` |
| `terser` | `accepted-build-tooling-dependency` |
| `vscode-languageclient` | `accepted-editor-extension-dependency` |
| `PrismJS` local facade | `accepted-contained-vendored-utility` |
| `TurndownService` local helper | `accepted-contained-vendored-utility-with-trust-follow-up` |
| `xtend-dev.js` legacy loader | `accepted-legacy-runtime-surface` |
| Epic-18 controlled backport | `closed-as-controlled-backport` |
| `x-icon` Lucide adapter | `closed-as-owned-adapter` |
