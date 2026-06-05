# XTend Native-First Vendor and Legacy Replacement Contract

- Status: `accepted by NFM-WP-05`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-05-Vendor-und-Legacy-Dependency-Replacement-Kandidaten-priorisieren.md`
- Matrix: `development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Adoption Gate: `xtend.native-first.primitive-adoption-gate.v1`
- Contract: `xtend.native-first.vendor-legacy-replacement.v1`
- Matrix Contract: `xtend.native-first.vendor-legacy-replacement-matrix.v1`
- Boundary: `no-unreviewed-runtime-dependency`
- Boundary: `no-unreviewed-vendor-copy`
- Boundary: `normal-ui-prefers-dom-descriptor-over-manual-html`
- Boundary: `tooling-dependencies-remain-outside-core-runtime`
- Zielzustand: `vendor-legacy-replacement-candidates-prioritized`
- Dependency Policy Status: `mapped-by-nfm-wp-04`
- Dependency Diet Policy: `xtend.native-first.dependency-diet-policy.v1`

## Zweck

Dieser Contract definiert, wie XTend Vendor-, Legacy- und Dependency-Replacement-Kandidaten priorisiert. Er ist der operative Schnitt zwischen Native-First-Mission, Adoption Gate, Supply-Chain-Gates und spaeterer Migration.

`NFM-WP-05` wurde vor `NFM-WP-04` umgesetzt. `NFM-WP-04` hat die Runtime-, Build-, Dev-, Test-, Docs-, Editor-, Vendor- und Legacy-Flaechen nachtraeglich final klassifiziert. Dieses Dokument bleibt die Replacement-Priorisierung; die konkrete Dependency Policy liegt in `development/XTend-Native-First-Dependency-Diet-Policy-Contract.md`.

## Kandidatenklassen

| Klasse | Beschreibung | Beispiel |
|--------|--------------|----------|
| `runtime-dependency` | externe Dependency, die in Produkt-Runtime oder Browser-Pfad liegt | aktuell kein Default-Core-Fund |
| `tooling-dependency` | externe Dependency fuer Build, Bundling, Editor oder CLI | `rollup`, `terser`, `vscode-languageclient` |
| `vendored-utility` | lokal mitgelieferte Fremd- oder Utility-Implementierung | `components/prism.js`, `components/turndown.js` |
| `legacy-runtime-surface` | alter Produktpfad, Export oder Loader-Kompatibilitaet | `xtend-dev.js`, `./legacy-loader` |
| `manual-html-path` | UI-Materialisierung ueber HTML-String-Sinks | `innerHTML`, `template.innerHTML`, `insertAdjacentHTML` |
| `vendor-backport-residual` | bereits kontrolliert uebernommene Vendor-Deltas | Epic-18-Komponentenbackport |
| `owned-vendor-adapter` | bewusst lokale, XTend-owned Vendor-kompatible Fassade | `x-icon` Lucide-kompatibler Pack-Adapter |

## Prioritaetsmodell

| Prioritaet | Wann verwenden | Erwartete Folge |
|------------|----------------|-----------------|
| `P0` | Runtime-, Security-, Trusted-DOM-, RMT-Kernel- oder normale App-UI-Risiken | eigene Migration, Gate oder Replacement-Plan vor produktiven Claims |
| `P1` | relevante Tooling-/Vendor-Flaeche mit Bundle-, Maintenance- oder Audit-Risiko | Containment, Exit-Plan, optionaler Ersatz oder schmalere Fassade |
| `P2` | akzeptierte, isolierte oder bereits kontrollierte Restflaeche | dokumentiert halten, Review-Datum setzen, spaeter in NFM-WP-21 aufnehmen |

## Bewertungsachsen

Jeder Kandidat wird gegen diese Achsen bewertet:

| Achse | Frage |
|-------|-------|
| `runtimeExposure` | Erreicht der Kandidat Default-Browser- oder App-Runtime? |
| `securitySink` | Beruehrt er HTML-, URL-, Attribute-, Property-, Event-, Style- oder Import-Sinks? |
| `supplyChainExposure` | Kommt er aus externer Dependency, vendored Code oder lokaler Kopie? |
| `bundleCost` | Erhoeht er Bundle-Groesse, Parser-Kosten oder Ladepfad? |
| `maintenanceRisk` | Muss XTend fremde API-, Syntax- oder Bugfix-Flaeche pflegen? |
| `nativeReplacementFit` | Gibt es Browser-native oder XTend-owned Alternativen? |
| `rmtImpact` | Kann RMT die Faehigkeit als Core Record, Adapter oder DOM Descriptor ausdruecken? |
| `exitFeasibility` | Ist Migration ohne Breaking Change oder Big Bang moeglich? |

## Replacement Outcomes

| Outcome | Bedeutung |
|---------|-----------|
| `replace-with-native-or-owned` | Kandidat soll durch Browser-native oder XTend-owned Primitive ersetzt werden. |
| `contain-with-exit-plan` | Kandidat bleibt vorerst, muss aber isoliert und mit Exit-Plan gefuehrt werden. |
| `keep-contained` | Kandidat ist akzeptiert, solange er ausserhalb Core-Runtime bleibt. |
| `harden-with-trust-gate` | Kandidat bleibt, braucht aber Trusted-DOM-, Security- oder Contract-Parity-Gate. |
| `closed-as-accepted` | Kandidat ist bereits kontrolliert abgeschlossen und braucht nur Regression Guard. |
| `mapped-by-nfm-wp-04` | finale Entscheidung ist durch Dependency Diet Policy klassifiziert. |
| `defer-to-nfm-wp-21` | Migration oder Deprecation ist spaeterer Release-/SemVer-Schnitt. |

## Blocking-Regeln

Ein Kandidat blockiert neue Native-First-Claims, wenn:

- er eine neue Runtime-Dependency ohne `NFM-WP-04`-Policy waere
- er normale App-UI an freie `innerHTML`-Renderer bindet
- er eine unkontrollierte Vendor-Verzeichniskopie voraussetzt
- er CDN, Remote Script oder externe URL als Default braucht
- er den RMT-Kernel an XTend-, DOM-, Browser- oder Vendor-Typen koppeln wuerde
- er Security-Sinks ohne Trusted-DOM- oder Kernel-Trust-Verbindung nutzt
- seine Fassade breiter ist als der oeffentliche XTend-Vertrag

## Source-of-Truth

| Artefakt | Rolle |
|----------|-------|
| `development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md` | priorisierte Kandidatenmatrix |
| `package.json` und Workspace-Manifeste | Dependency- und Package-Fakten |
| `development/XTend-Supply-Chain-Gate-Plan.md` | lokale Supply-Chain- und Audit-Gate-Basis |
| `development/WP-TypeExports-08-Vendor-Utility-Facades-fuer-Prism-Turndown-und-Design-Tokens-ergaenzen.md` | Vendor-Facade-Grenze |
| `development/WP-E18-01-Epic-18-Scope-Vendor-Baseline-und-App-Platform-Leitplanken-finalisieren.md` | Vendor-Baseline und App-Platform-Leitplanken |
| `development/WP-E18-02-Vendor-Component-Bugfix-Backport-in-main.md` | kontrollierter Vendor-Backport |
| `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md` | Trusted-DOM-Grenze fuer HTML-Sinks |
| `development/XTendRMT-Kernel-Trust-Hardening-Contract.md` | Runtime Trust und Panic Boundary |
| `development/XTend-Native-Primitive-Adoption-Gate-Contract.md` | Adoption ADR und Evidence-Struktur |

## Handoff

| Folgepaket | Handoff |
|------------|---------|
| `NFM-WP-04` | hat Dependency Diet Policy auf die Kandidaten `NFM-RC-01`, `NFM-RC-02`, `NFM-RC-03` und `NFM-RC-04` angewendet |
| `NFM-WP-06` | kann UI Primitive Matrix gegen Vendor-/Legacy-Status mappen |
| `NFM-WP-18` | kann Manual-HTML- und DOM-Descriptor-Kandidaten als Renderer-Proofs aufnehmen |
| `NFM-WP-19` | kann Bundle-, Complexity- und Toolchain-Budgets aus der Matrix ableiten |
| `NFM-WP-21` | kann Deprecation und Migration fuer Legacy Loader, Vendor Facades und Manual HTML schneiden |

## Verifikation

Aktuelle lokale Gates:

```bash
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
```

Ziel-Gate fuer spaetere Produktisierung:

```bash
node scripts/run_xtend_tests.js vendor-legacy-replacement --json
```
