# NFM-WP-05 - Vendor- und Legacy-Dependency-Replacement-Kandidaten priorisieren

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.vendor-legacy-replacement.v1`
- Matrix Contract: `xtend.native-first.vendor-legacy-replacement-matrix.v1`
- Contract-Dokument: `development/XTend-Native-First-Vendor-Legacy-Replacement-Contract.md`
- Matrix: `development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Adoption Gate: `xtend.native-first.primitive-adoption-gate.v1`
- Boundary: `no-unreviewed-runtime-dependency`
- Boundary: `no-unreviewed-vendor-copy`
- Boundary: `normal-ui-prefers-dom-descriptor-over-manual-html`
- Boundary: `tooling-dependencies-remain-outside-core-runtime`
- Zielzustand: `vendor-legacy-replacement-candidates-prioritized`
- Dependency Policy Status: `mapped-by-nfm-wp-04`
- Dependency Diet Policy: `xtend.native-first.dependency-diet-policy.v1`
- Gate: lokale Manifest-, Supply-Chain- und Referenzpfad-Pruefung

## Ziel

`NFM-WP-05` priorisiert bekannte Vendor-, Legacy- und Dependency-Replacement-Kandidaten. Das Paket erzeugt keine Migration und entfernt keine Dependency. Es schafft die Entscheidungsgrundlage fuer `NFM-WP-04`, `NFM-WP-06`, `NFM-WP-18`, `NFM-WP-19` und `NFM-WP-21`.

`NFM-WP-05` wurde vor dem formal abhaengigen `NFM-WP-04` umgesetzt. `NFM-WP-04` hat die Tooling- und Dependency-Kandidaten nachtraeglich final klassifiziert.

## Umgesetzt

- `development/XTend-Native-First-Vendor-Legacy-Replacement-Contract.md` angelegt
- Contract `xtend.native-first.vendor-legacy-replacement.v1` akzeptiert
- `development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md` angelegt
- Matrix Contract `xtend.native-first.vendor-legacy-replacement-matrix.v1` akzeptiert
- Kandidatenklassen fuer Runtime Dependencies, Tooling Dependencies, Vendored Utilities, Legacy Runtime Surfaces, Manual HTML, Vendor Backports und Owned Vendor Adapter definiert
- P0/P1/P2-Priorisierungsmodell festgelegt
- Kandidaten `NFM-RC-01` bis `NFM-RC-08` priorisiert
- akzeptierte Residuals fuer Maraca Toolchain, VS-Code Extension, Prism, Turndown, Legacy Loader, Epic-18 Backport und x-icon Lucide Adapter dokumentiert
- Handoff an `NFM-WP-04`, `NFM-WP-06`, `NFM-WP-18`, `NFM-WP-19` und `NFM-WP-21` beschrieben

## Lokale Faktenbasis

| Quelle | Ergebnis |
|--------|----------|
| `package.json` | Core Package besitzt keine sichtbare Runtime-Dependency-Section im Manifest-Schnitt; viele XTend-Metadaten und Scripts sind lokal |
| `xtendrmt/package.json` | keine externen Dependencies |
| `fabric/package.json` | keine externen Dependencies |
| `tools/package.json` | keine externen Dependencies |
| `xtend-builder/package.json` | nur optionale interne Peer Dependencies |
| `xtend-maraca/package.json` | `rollup` und `terser` als externe Build-/Bundling-Dependencies |
| `tools/rmt-editor/vscode/package.json` | `vscode-languageclient` als editor-spezifische Dependency |
| `components/prism.js` | lokale PrismJS-Flaeche mit schmaler Type-Facade |
| `components/turndown.js` | lokaler Turndown-kompatibler Helper, kein CDN, aber `template.innerHTML`-Parsing |
| `WP-E18-01`/`WP-E18-02` | Vendor-Backport kontrolliert abgeschlossen |

## Priorisierung

| Prioritaet | Kandidaten | Entscheidung |
|------------|------------|--------------|
| `P0` | `NFM-RC-01` Manual HTML und normale App-UI-Sinks | DOM Descriptor und Trusted DOM priorisieren |
| `P1` | `NFM-RC-02` Prism, `NFM-RC-03` Turndown, `NFM-RC-04` Maraca Rollup/Terser | contain, harden oder NFM-WP-04-Policy anwenden |
| `P2` | `NFM-RC-05` VS-Code Language Client, `NFM-RC-06` Legacy Loader, `NFM-RC-07` Epic-18 Backport, `NFM-RC-08` x-icon Lucide Adapter | isoliert, akzeptiert oder spaeter migrieren |

## Scope-Entscheidung

In Scope fuer `NFM-WP-05`:

- Kandidatenliste aus Components, Builder, Docs, Security, Tooling und RMT
- Priorisierung nach Risiko, Bundle-Kosten, Pflegeaufwand und Native-First-Fit
- P0/P1/P2-Schnitt
- akzeptierte Residuals
- Handoff an Dependency Diet, Capability Matrix, DOM Descriptor Proofs und Migration

Out of Scope fuer `NFM-WP-05`:

- konkrete Entfernung von Dependencies
- Package-Manifest-Aenderungen
- neue Runtime- oder Component-Implementierung
- Audit/SBOM-Netzwerkgates
- finale Dependency Diet Policy
- Deprecation-Fenster oder SemVer-Entscheidung

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Kandidatenliste aus Components, Builder, Docs, Security, Tooling und RMT liegt vor | erfuellt |
| Replacement-Score nach Risiko, Bundle-Kosten, Pflegeaufwand und Browser-/Native-Fit ist dokumentiert | erfuellt ueber Bewertungsachsen und P0/P1/P2-Schnitt |
| keine Big-Bang-Migration | erfuellt |
| P0/P1/P2-Schnitt ist vorhanden | erfuellt |
| akzeptierte Residuals sind dokumentiert | erfuellt |
| Abhaengigkeit zu `NFM-WP-04` ist ehrlich markiert | erfuellt: `mapped-by-nfm-wp-04` |

## Verifikation

`NFM-WP-05` ist ein Dokumentations-, Scope- und Priorisierungs-Gate. Es nutzt lokale Manifest- und Referenzpfad-Evidence.

Lokale Gates:

```bash
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js references --json
```

Ergebnis am 3. Juni 2026:

- `supply-chain`: `passed` mit 67 Checks, 0 Failures, 0 Warnings
- `references`: `passed` mit 2073 Referenzpfad-Checks, 0 Failures, 0 Warnings
- ASCII-Check fuer WP-05-, Roadmap- und Mission-Dateien: sauber

## Handoff

`NFM-WP-05` ist abgeschlossen. Die Replacement-Kandidaten sind priorisiert.

Naechste Folgearbeit:

- `NFM-WP-04` hat Runtime-, Tooling-, Editor- und Vendored-Utility-Dependencies final klassifiziert.
- `NFM-WP-06` hat die UI Primitive Capability Matrix um `vendor-backed`, `legacy`, `owned-vendor-adapter` und `manual-html-risk` erweitert.
- `NFM-WP-18` kann DOM Descriptor und Trusted-DOM-Proofs fuer `NFM-RC-01` priorisieren.
- `NFM-WP-19` kann Bundle-, Complexity- und Toolchain-Budgets aus `NFM-RC-02` bis `NFM-RC-04` ableiten.
- `NFM-WP-21` kann Migration und Deprecation fuer Legacy Loader, Vendor Facades und Manual-HTML-Restflaechen planen.
