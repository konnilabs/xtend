# NFM-WP-04 - Dependency Diet Policy und Runtime-Dependency-Exit-Plaene erstellen

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Contract: `xtend.native-first.dependency-diet-policy.v1`
- Exit Plan Matrix: `xtend.native-first.dependency-exit-plan-matrix.v1`
- Contract-Dokument: `development/XTend-Native-First-Dependency-Diet-Policy-Contract.md`
- Matrix: `development/XTend-Native-First-Dependency-Exit-Plan-Matrix.md`
- Supply Chain Gate Plan: `xtend.security.supply-chain-gate-plan.v1`
- Vendor Replacement Contract: `xtend.native-first.vendor-legacy-replacement.v1`
- Boundary: `avoid-runtime-dependency-by-default`
- Boundary: `dependency-classification-precedes-adoption`
- Boundary: `tooling-dependencies-remain-outside-core-runtime`
- Zielzustand: `dependency-diet-policy-accepted`
- Gate: lokale Supply-Chain-, Referenzpfad- und ASCII-Pruefung

## Ziel

`NFM-WP-04` finalisiert die Dependency Diet Policy fuer die Native-First-Mission. Das Paket trennt Runtime-, Build-, Dev-, Test-, Docs-, Editor-, Vendor- und interne Peer-Flaechen, blockt neue Runtime-Dependencies als Default und legt Exit-Plaene fuer bekannte Dependency- und Legacy-Flaechen fest.

## Umgesetzt

- `development/XTend-Native-First-Dependency-Diet-Policy-Contract.md` angelegt
- Contract `xtend.native-first.dependency-diet-policy.v1` akzeptiert
- `development/XTend-Native-First-Dependency-Exit-Plan-Matrix.md` angelegt
- Matrix Contract `xtend.native-first.dependency-exit-plan-matrix.v1` akzeptiert
- Dependency-Klassen fuer Core Runtime, Runtime Peer, interne Peers, Build Tooling, Dev/Test, Docs/Demo, Editor Extension, Vendored Utility und Legacy Surface definiert
- Blocking-Regeln fuer neue Runtime-Dependencies festgelegt
- aktuelle Baseline fuer Root, RMT, Fabric, CLI, Compiler, Maraca, VS-Code Extension, Prism, Turndown und Legacy Loader klassifiziert
- `rollup`, `terser` und `vscode-languageclient` als nicht-Core-Runtime klassifiziert
- Exit-Plaene fuer `NFM-DEP-00` bis `NFM-DEP-09` festgelegt
- lokale Gates und conditional network evidence getrennt dokumentiert
- `NFM-WP-05` vom vorlaeufigen Zustand auf die finale Policy gemappt

## Lokale Faktenbasis

| Quelle | Ergebnis |
|--------|----------|
| `package.json` | Root Runtime hat keine externe `dependencies`-Section; Workspaces sind lokal |
| `xtendrmt/package.json` | keine externen Dependencies |
| `fabric/package.json` | keine externen Dependencies |
| `tools/package.json` | keine externen Dependencies |
| `xtend-builder/package.json` | optionale interne Peer Dependencies |
| `xtend-maraca/package.json` | `rollup` und `terser` als externe Build-/Bundling-Dependencies |
| `tools/rmt-editor/vscode/package.json` | `vscode-languageclient` als editor-spezifische Dependency |
| `security/supply-chain-gate-policy.js` | lokaler Offline-Gate fuer Policy, Lockfile, License und Release-Boundary |
| `package-lock.json` | enthaelt workspace- und toolchain-bezogene Lockfile-Evidence |

## Policy-Entscheidung

Neue externe Runtime-Dependencies bleiben default-blocked. Eine Aufnahme in Browser-, Component-, RMT-, Fabric- oder Loader-Runtime ist nur als explizite Ausnahme erlaubt, wenn Capability-Gap, native/owned Alternativen, Security Impact, Supply-Chain Impact, Bundle Impact, Owner, Review-Kadenz und Exit-Plan dokumentiert sind.

Build-, Editor- und Vendor-Flaechen sind nicht automatisch schlecht; sie muessen aber klar ausserhalb der Core Runtime bleiben. Maraca darf `rollup` und `terser` als Toolchain-Dependencies nutzen, weil lokale Fallbacks vorhanden sind und die Dependencies nicht in den Browser-Runtime-Pfad importiert werden. Die VS-Code Extension darf `vscode-languageclient` in ihrem Extension-Scope nutzen.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Runtime-, Dev-, Test-, Build- und Docs-Dependencies sind getrennt bewertet | erfuellt |
| neue Runtime-Dependencies sind default-blocked | erfuellt |
| jede bekannte Runtime- oder runtime-nahe Dependency-Flaeche besitzt Owner, Zweck, Risiko, Exit-Strategie und Review-Frequenz | erfuellt ueber Exit-Plan-Matrix |
| Vendor-Utility-Fassaden und Replacement-Kandidaten sind erfasst | erfuellt |
| Supply-Chain-Gates und Conditional Network Evidence sind angebunden | erfuellt |
| WP-05-Replacement-Matrix ist final klassifiziert | erfuellt |

## Verifikation

`NFM-WP-04` ist ein Dokumentations-, Scope- und Policy-Gate. Es nutzt lokale Manifest-, Supply-Chain- und Referenzpfad-Evidence.

Lokale Gates:

```bash
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js references --json
```

Ergebnis am 3. Juni 2026:

- `supply-chain`: `passed` mit 67 Checks, 0 Failures, 0 Warnings
- `references`: `passed` mit 2073 Referenzpfad-Checks, 0 Failures, 0 Warnings
- ASCII-Check fuer WP-04-, Roadmap-, Mission-, WP-05- und Supply-Chain-Dateien: sauber

## Handoff

`NFM-WP-04` ist abgeschlossen. Die Dependency Diet Policy und die Exit-Plan-Matrix sind akzeptiert.

Naechste Folgearbeit:

- `NFM-WP-05` ist bereits abgeschlossen und wird durch diese Policy finalisiert.
- `NFM-WP-06` kann Capability-Klassen um `vendor-backed`, `tooling-only`, `editor-only`, `legacy` und `owned` erweitern.
- `NFM-WP-13` kann workspace-weite SBOM-, Audit- und Release-Evidence buendeln.
- `NFM-WP-19` kann Bundle-, Complexity- und Performance-Budgets fuer Dependency-Impact definieren.
- `NFM-WP-21` kann Migration und Deprecation fuer Vendor Utilities und Legacy Runtime Surfaces planen.
