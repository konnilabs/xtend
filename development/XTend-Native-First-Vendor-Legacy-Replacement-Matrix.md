# XTend Native-First Vendor and Legacy Replacement Matrix

- Status: `accepted by NFM-WP-05`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.vendor-legacy-replacement-matrix.v1`
- Parent Contract: `xtend.native-first.vendor-legacy-replacement.v1`
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-05-Vendor-und-Legacy-Dependency-Replacement-Kandidaten-priorisieren.md`
- Dependency Policy Status: `mapped-by-nfm-wp-04`
- Dependency Diet Policy: `xtend.native-first.dependency-diet-policy.v1`
- Evidence Source: local manifests, local docs, local grep evidence

## Inventar-Baseline

| Bereich | Ergebnis |
|---------|----------|
| Root Package | kein sichtbarer `dependencies`-Default fuer Core-Runtime; Package enthaelt viele XTend-Metadaten und Scripts |
| `xtendrmt` | keine externen Dependencies im Workspace-Manifest |
| `fabric` | keine externen Dependencies im Workspace-Manifest |
| `tools` | keine externen Dependencies im Workspace-Manifest |
| `xtend-builder` | nur optionale interne Peer Dependencies auf `@ccslabs/xtend` und `@ccslabs/xtend-compiler` |
| `xtend-maraca` | `rollup` und `terser` als externe Build-/Bundling-Dependencies |
| `tools/rmt-editor/vscode` | `vscode-languageclient` als editor-spezifische Extension-Dependency |
| Vendor Facades | `components/prism.js`, `components/turndown.js`, Design Token Facades |
| Vendor Backport | Epic-18-Komponentendeltas sind kontrolliert in main uebernommen |
| Manual HTML | mehrere Runtime-, Docs- und Demo-Pfade besitzen `innerHTML`-Sinks; vorhandene Trusted-DOM-/DOM-Descriptor-Gates begrenzen den Zielpfad |

## Priorisierte Kandidaten

| ID | Prio | Klasse | Kandidat | Aktueller Status | Replacement Outcome | Naechster Schritt |
|----|------|--------|----------|------------------|---------------------|-------------------|
| `NFM-RC-01` | P0 | `manual-html-path` | normale App-UI und Renderer-Pfade mit `innerHTML`/`template.innerHTML` | Security-Contracts und DOM Descriptor Renderer existieren; Restflaechen bleiben sichtbar | `replace-with-native-or-owned` und `harden-with-trust-gate` | `NFM-WP-18` und `NFM-WP-21` muessen DOM Descriptor, Trusted DOM und Migration priorisieren |
| `NFM-RC-02` | P1 | `vendored-utility` | `components/prism.js` als lokaler PrismJS Highlighter | schmale Type-Facade vorhanden; breite Sprach-/HTML-Flaeche lokal vendored | `contain-with-exit-plan` | evaluate RMT semantic-token/docs-highlighter oder kleiner owned highlighter; keine breiteren Re-Exports |
| `NFM-RC-03` | P1 | `vendored-utility` | `components/turndown.js` lokaler Markdown/HTML-to-Markdown Helper | lokale Implementierung, kein externes Package; nutzt `template.innerHTML` fuer Parsing | `harden-with-trust-gate` | Trusted-DOM-/Sanitizing-Grenze oder structured writer pruefen; Exit in `NFM-WP-21` |
| `NFM-RC-04` | P1 | `tooling-dependency` | `xtend-maraca` mit `rollup` und `terser` | Build-/Bundling-Paket, nicht Core-Runtime; lokaler ESM-Importgraph- und Minifier-Fallback vorhanden | `keep-contained` und `allow-tooling-dependency` | `NFM-WP-04` klassifiziert beide als Build-Tooling-Dependencies mit Exit-Plan |
| `NFM-RC-05` | P2 | `tooling-dependency` | VS-Code Extension mit `vscode-languageclient` | editor-spezifisch, ausserhalb Core-Runtime, stdio Server bleibt eigene Source of Truth | `keep-contained` | als Extension-Dependency isolieren; kein Core-/RMT-Runtime-Import |
| `NFM-RC-06` | P2 | `legacy-runtime-surface` | `xtend-dev.js` und `./legacy-loader` Export | Legacy Loader ist bewusst klassifiziert; `xtend-loader.js` ist kanonisch | `defer-to-nfm-wp-21` | Deprecation-/Migration-Fenster spaeter mit SemVer und Docs entscheiden |
| `NFM-RC-07` | P2 | `vendor-backport-residual` | Epic-18 Media-Manager Vendor Component Backport | fuenf Komponenten-Deltas kontrolliert uebernommen, kein Vendor-Verzeichnis kopiert | `closed-as-accepted` | Regression Guards halten; keine weitere Vendor-Kopie |
| `NFM-RC-08` | P2 | `owned-vendor-adapter` | `x-icon` lokaler Lucide-kompatibler Pack-Adapter | owned Component, lokale Packs, kein CDN, RMT-kompatibel | `closed-as-accepted` | als Beispiel fuer owned vendor-compatible adapter in `NFM-WP-06` aufnehmen |

## Kandidaten im Detail

### NFM-RC-01 - Manual HTML und normale App-UI-Sinks

- Prioritaet: `P0`
- Klasse: `manual-html-path`
- Evidence:
  - `rg` findet HTML-Sinks in Components, Docs-App, XTendRMT-Runtime-Artefakten und Demos.
  - `development/WP-E18-05-Sicheren-DOM-Descriptor-Renderer-und-No-Manual-HTML-Gate-bauen.md` und Trusted-DOM-Contracts definieren bereits den Zielpfad.
- Bewertung:
  - nicht jede `innerHTML`-Nutzung ist automatisch unsicher, aber normale App-UI darf nicht auf freie HTML-String-Renderer angewiesen sein.
  - RMT- und Docs-Rich-HTML bleiben nur als explizite Trusted-DOM-Boundary akzeptabel.
- Ziel:
  - DOM Descriptor, strukturierte DOM APIs, Trusted-DOM-Sinks und Kernel Trust als Standardpfad.
- Folge:
  - `NFM-WP-18` fuer Browser-native Renderer-Proofs.
  - `NFM-WP-21` fuer Migration und Deprecation.

### NFM-RC-02 - PrismJS Vendor Highlighter

- Prioritaet: `P1`
- Klasse: `vendored-utility`
- Evidence:
  - `components/prism.js` beginnt mit `PrismJS 1.30.0`.
  - `WP-TypeExports-08` typisiert nur eine schmale Fassade.
  - `docs/xtend-vendor-types.md` dokumentiert Vendor-Fassaden als schmale Public Surface.
- Bewertung:
  - kein Package-Dependency-Risiko, aber vendored Code mit breiter Sprachebene und HTML-Ausgabe.
  - Native Browser-Primitives ersetzen Syntax Highlighting nicht direkt.
  - RMT Semantic Tokens oder ein owned Docs/RMT-Highlighter koennen mittelfristig die Produktflaeche reduzieren.
- Ziel:
  - enthalten, nicht verbreitern, kein Re-Export fremder Interna.

### NFM-RC-03 - Turndown-kompatibler lokaler Helper

- Prioritaet: `P1`
- Klasse: `vendored-utility`
- Evidence:
  - `components/turndown.js` stellt lokal `TurndownService` bereit.
  - `ER-WP-03` dokumentiert, dass `x-writer` den lokalen Helper statt externer CDN-URL nutzt.
  - der Helper nutzt `template.innerHTML` zum Parsen von Input.
- Bewertung:
  - besser als CDN-Fallback, aber weiterhin ein HTML-Eingangspfad.
  - Replacement sollte nicht durch externe Dependency erfolgen, sondern ueber structured writer, Sanitizing oder Trusted-DOM-Policy.
- Ziel:
  - trust-gated halten und spaeter strukturierte Writer-/Markdown-Faehigkeit pruefen.

### NFM-RC-04 - Maraca Rollup/Terser Toolchain

- Prioritaet: `P1`
- Klasse: `tooling-dependency`
- Evidence:
  - `xtend-maraca/package.json` listet `rollup` und `terser`.
  - `xtend-maraca/index.js` nutzt beide optional und besitzt `local-esm-importgraph-fallback` und `local-minifier-fallback`.
- Bewertung:
  - keine Default-Core-Runtime-Dependency.
  - Tooling-Dependency ist produktnah, weil Maraca Bundles erzeugt.
  - Fallbacks reduzieren Lock-in; `NFM-WP-04` setzt die finale Tooling-Dependency-Policy.
- Ziel:
  - als Toolchain-Dependency erlauben oder optionalisieren, aber nie in Core-Runtime ziehen.

### NFM-RC-05 - VS-Code Language Client

- Prioritaet: `P2`
- Klasse: `tooling-dependency`
- Evidence:
  - `tools/rmt-editor/vscode/package.json` nutzt `vscode-languageclient`.
  - Extension startet den eigenen RMT Language Server ueber stdio.
- Bewertung:
  - editor-spezifische Integration, nicht Core-Runtime.
  - Ersatz durch handgerollten Language-Client waere wahrscheinlich mehr Wartung als Nutzen.
- Ziel:
  - isolieren, nicht in CLI, Compiler oder Runtime ziehen.

### NFM-RC-06 - Legacy Loader Surface

- Prioritaet: `P2`
- Klasse: `legacy-runtime-surface`
- Evidence:
  - `xtend-loader.js` ist kanonischer Loader.
  - `xtend-dev.js` und `./legacy-loader` existieren als Legacy-Kompatibilitaet.
- Bewertung:
  - keine Vendor-Dependency, aber eine Legacy-Produktoberflaeche.
  - Replacement ist SemVer-/Migrationsthema, nicht Sofortumbau.
- Ziel:
  - `NFM-WP-21` soll Deprecation, Docs und SemVer-Fenster entscheiden.

### NFM-RC-07 - Epic-18 Vendor Backport Residual

- Prioritaet: `P2`
- Klasse: `vendor-backport-residual`
- Evidence:
  - `WP-E18-01` schnitt fuenf Komponenten-Deltas.
  - `WP-E18-02` uebernahm diese kontrolliert und schloss Vendor-Paritaet.
- Bewertung:
  - kein offener Replacement-Kandidat mehr.
  - bleibt ein Guardrail-Fall gegen unkontrollierte Vendor-Kopien.
- Ziel:
  - geschlossen halten, Regression-Smokes bewahren.

### NFM-RC-08 - x-icon Lucide-kompatibler Adapter

- Prioritaet: `P2`
- Klasse: `owned-vendor-adapter`
- Evidence:
  - `WP-E13-12A` beschreibt den lokalen Lucide-kompatiblen Adapter ohne CDN.
  - `x-icon` ist enterprise-ready und RMT-kompatibel.
- Bewertung:
  - positives Muster: vendor-kompatibel, aber owned, lokal und contract-gated.
  - kein Replacement noetig.
- Ziel:
  - als Vorbild fuer owned adapters in `NFM-WP-06` fuehren.

## P0/P1/P2-Schnitt

| Prioritaet | Kandidaten | Fokus |
|------------|------------|-------|
| `P0` | `NFM-RC-01` | normale UI weg von manuellen HTML-Sinks, hin zu DOM Descriptor und Trusted DOM |
| `P1` | `NFM-RC-02`, `NFM-RC-03`, `NFM-RC-04` | vendored Utility-Flaeche und produktnahe Toolchain kontrollieren |
| `P2` | `NFM-RC-05`, `NFM-RC-06`, `NFM-RC-07`, `NFM-RC-08` | isolierte oder akzeptierte Restflaechen dokumentiert halten |

## Akzeptierte Residuals

| Residual | Status | Begruendung |
|----------|--------|-------------|
| `rollup`/`terser` | `accepted-build-tooling-dependency` | Build Toolchain, Fallbacks vorhanden, finale Policy in `NFM-WP-04` |
| `vscode-languageclient` | `accepted-editor-scope` | editor-spezifisch, nicht Core-Runtime |
| `PrismJS` | `accepted-contained-vendor-utility` | schmale Fassade, kein breiter Public Re-Export |
| `TurndownService` local helper | `accepted-with-trust-follow-up` | kein CDN, aber HTML-Eingangspfad braucht Trust-/Migration-Follow-up |
| `xtend-dev.js` | `accepted-legacy-surface` | SemVer-/Migration-Fenster spaeter |
| Epic-18 Vendor Backport | `closed-as-controlled-backport` | kein offener Vendor-Tree |
| `x-icon` Lucide adapter | `closed-as-owned-adapter` | lokales owned Pattern ohne CDN |

## Handoff

Naechste sinnvolle Schritte:

- `NFM-WP-04` hat Dependency Diet Policy und Tooling-Dependency-Klassifikation finalisiert.
- `NFM-WP-06` hat `owned-vendor-adapter`, `vendor-backed`, `legacy` und `missing` in die UI Primitive Capability Matrix uebernommen.
- `NFM-WP-18` priorisiert DOM Descriptor und Trusted-DOM-Proofs fuer `NFM-RC-01`.
- `NFM-WP-21` plant SemVer-, Docs- und Deprecation-Fenster fuer akzeptierte Residuals.
