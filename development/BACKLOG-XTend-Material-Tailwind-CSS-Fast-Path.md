# BACKLOG: XTend Material Design Kit und Tailwind-CSS-Fast-Path

- Status: `follow-up validation planned (supported-opt-in remains unchanged)`
- Datum: 2026-07-16
- Abschlussdatum: 2026-07-16
- Public Support Status: `supported-opt-in`
- Default Decision: `unchanged; separate ADR required`
- Final Gate: `node scripts/run_xtend_tests.js xtend-material-docs docs-public-quality scoped-package-readmes package-exports references --json`
- Final Gate Status: `passed (5/5 suites)`
- Follow-up Ticket: `XTM-14 completed`
- Follow-up Gate: `node scripts/run_xtend_tests.js xtend-material-cli-generated-app --json`
- Follow-up Gate Status: `passed (12/12, CLI-only plus interactive browser matrix)`
- Initiative: `xtend-material-tailwind-fast-path`
- Ticket-Prefix: `XTM`
- NPM Scope Target: `@xtend-material`
- Product Target: `@xtend-material/core`
- Build Adapter Target: `@xtend-material/maraca-tailwind`
- Owner: `CCS Labs (ccslabs)`
- Tailwind Baseline: `4.3.2`
- CSS Provider Contract Target: `xtend.maraca.css-provider.v1`
- Design Kit Contract Target: `xtend.material.design-kit.v1`
- Recipe Contract Target: `xtend.material.recipe.v1`
- Build Evidence Target: `xtend.maraca.css-build-evidence.v1`
- Scaffold Preset Target: `xtend.scaffold.app-preset.material.v1`
- Leitlinie: `xtend-tokens-own-semantics`, `tailwind-is-build-time-only`, `rmt-recipes-over-utility-api`, `existing-components-over-parallel-catalog`, `evidence-before-default`
- Boundary: `no-tailwind-browser-runtime`
- Boundary: `no-tailwind-import-in-rmt-kernel`
- Boundary: `no-tailwind-utility-contract-in-component-public-api`
- Boundary: `no-second-component-registry`
- Boundary: `no-second-design-token-source-of-truth`
- Boundary: `no-cdn-or-network-required-build`
- Boundary: `tailwind-is-not-a-core-or-default-runtime-dependency`
- Boundary: `material-kit-reuses-owned-xtend-components`
- Boundary: `cli-generated-reference-app-must-remain-unpatched`
- Bezug:
  - `README.md`
  - `development/compliance/catfooding-workflow.md`
  - `development/XTend-Component-Styling-Token-und-Part-Contract.md`
  - `development/XTend-Enterprise-Design-System-Token-Contract.md`
  - `development/XTend-XTheme-Token-Alias-Layer.md`
  - `development/XTend-Layout-Display-und-Media-Shell-Reife-Contract.md`
  - `development/XTensions-Maraca-Manifest-and-Build-Provenance-Contract.md`
  - `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`
  - `docs/de/xtend-maraca.md`
  - `xtend-maraca/index.js`
  - `xtend-maraca/index.d.ts`
  - `xtend-builder/lib/cli.js`
  - `xtend-builder/templates/registry.js`
  - `design-tokens/xtend-design-tokens.js`
  - `xtendrmt/rmt-dom-descriptor-renderer.js`

## Zweck

Dieses Backlog fuehrt einen optionalen Fast Path fuer die Erstellung von RMT-first App Shells ein. Ein eigenes XTend Material Design Kit liefert eine opinionated visuelle Sprache, semantische App-Recipes, Theme Packs und Scaffold-Presets. Tailwind CSS wird ausschliesslich als lokales Build-Werkzeug verwendet, das statisches CSS aus den vom Buildplan freigegebenen Quellen erzeugt.

Der Fast Path soll die Zeit von einer neuen `.rmt` App bis zu einer responsiven, barrierearmen und produktionsnahen Maraca Shell reduzieren. Er ersetzt weder XTend-Komponenten noch `x-theme`, CSS Parts, RMT-Orchestrierung oder Maracas Evidence-Modell.

## Architekturentscheidung

### Produktrollen

| Schicht | Besitzt | Besitzt ausdruecklich nicht |
|---------|---------|-----------------------------|
| XTendRMT | semantische App-Struktur, State, Actions, Surfaces, Recipes und Scheduling | Tailwind-Konfiguration, freie Utility-Strings oder CSS-Compiler-Lifecycle |
| XTend Components | Verhalten, A11y, Slots, Parts, Variants und component-scoped Tokens | Tailwind als interne oder oeffentliche Komponentenpflicht |
| `@xtend-material/core` | visuelle Sprache, Token-Mapping, Theme Packs, Recipes und App-Shell-Presets | parallelen Button-/Dialog-/Form-Component-Catalog |
| `@xtend-material/maraca-tailwind` | Tailwind-Kompilierung, Source-Inventar, Diagnostics und CSS-Evidence | Runtime-Orchestrierung oder Designsemantik |
| Maraca | Provider-Planung, Build-Reihenfolge, Artefakt-Provenance, Budget und Output | Tailwind-spezifische Sonderlogik im Kernel oder Component Loader |
| Scaffold | explizite Auswahl des Fast Paths und Erzeugung editierbarer App-Dateien | stilles Aktivieren von Tailwind fuer bestehende Apps |

### Fuehrende Regeln

1. `--xtend-*` bleibt die einzige produktive Design-Token-Source-of-Truth.
2. Tailwind-Theme-Variablen werden aus XTend-Tokens abgeleitet; sie definieren keine konkurrierende Produktpalette.
3. Utility-Klassen sind private Authoring-/Build-Details. Oeffentliche RMT- und Component-Vertraege verwenden semantische Recipes, Props, Variants, Parts und Tokens.
4. Tailwind wird weder im Browser gebootet noch aus einem CDN geladen.
5. Das Material Kit verwendet vorhandene XTend-Komponenten und native Elemente. Neue Komponenten benoetigen den normalen Component-Contract-v2-Prozess und gehoeren nicht automatisch in dieses Backlog.
6. Der Fast Path ist `supported-opt-in`. Ein spaeterer Default-Entscheid benoetigt trotz abgeschlossener Evidence einen separaten akzeptierten Architecture Decision Record.
7. Tailwind Preflight ist im MVP deaktiviert. Eine spaetere Aktivierung braucht einen eigenen Scope- und Regression-Entscheid.
8. Maraca muss einen Build ohne installierten Tailwind-Adapter unveraendert ausfuehren koennen.

## Zielbild

Der gewuenschte Entwicklerpfad ist:

```bash
xt create app customer-portal --runtime maraca --design-kit material
xt maraca plan customer-portal/app.rmt --css-provider tailwind --json
xt maraca build customer-portal/app.rmt --css-provider tailwind --css external --json
xt maraca tune customer-portal/app.rmt --config customer-portal/maraca.config.json --write --json
```

Der Scaffold erzeugt mindestens:

```text
customer-portal/
|-- app.rmt
|-- app.css
|-- maraca.config.json
|-- xtend.material.json
|-- package.json
`-- tests/
    `-- app-shell.smoke.html
```

`app.rmt` referenziert semantische Recipes wie `material.app-shell`, `material.workspace`, `material.form-flow` oder `material.dashboard`. `app.css` importiert das Material Kit und registriert ausschliesslich die freigegebenen App-, RMT- und Kit-Quellen. Der Maraca Report weist Provider, Versionen, Quellen, Fingerprints, Output, Budget und Diagnostics nach.

## Nicht-Ziele

- keine Kopie von Angular Material, Material Web oder deren Component APIs
- kein Claim vollstaendiger Google-Material-Design-Paritaet
- keine neue Tailwind-basierte `x-button`-, Dialog-, Form-, Menu- oder Navigation-Implementierung
- keine Tailwind-Klassen als stabile RMT-Syntax oder Component Metadata
- keine dynamische Konstruktion von Utility-Namen aus Runtime-State
- kein Aufweichen von Trusted-DOM-, Class-Token- oder Style-Property-Pruefungen
- kein Tailwind Play CDN, Remote Theme Bundle oder Netzwerkzugriff in lokalen Gates
- kein automatisches Scannen des gesamten Monorepos oder beliebiger `node_modules`
- kein Tailwind-Zwang fuer XTend Classic, bestehende Maraca Apps oder Dritt-Hosts
- keine Default-Aenderung ohne separaten akzeptierten Architecture Decision Record

## Erfolgsmetriken

| Metrik | MVP-Ziel |
|--------|----------|
| Time-to-first-shell | Referenz-App in hoechstens 10 Minuten aus Scaffold startbar |
| manuelle Shell-Dateien | keine manuell verdrahtete Host-Shell ausser generiertem Root/Boot Host |
| Tailwind Browser Runtime | `0` Bytes |
| Tailwind im Standard-Maraca-Build | keine Dependency und keine Verhaltensaenderung |
| CSS Source Provenance | 100 Prozent der gescannten Sources im Report |
| dynamisch konstruierte Utilities | `0` in Produktfixtures |
| Theme Evidence | light, dark, high-contrast und forced-colors |
| Density Evidence | comfortable, compact und dense |
| A11y | keine neuen kritischen oder schweren Befunde in der Material-Referenz-App |
| CSS Budget | explizites, fixture-basiertes MVP-Budget in `XTM-11`; kein ungedeckter Defaultwert |
| Exit Test | Wechsel auf `css-provider: native` ohne RMT-Kernel- oder Component-API-Aenderung |

## Definition of Ready

Ein XTM-Ticket darf gestartet werden, wenn:

- alle betroffenen Produkt-, Build-, RMT-, Component-, Package- und Testpfade benannt sind;
- Runtime-, Build- und Dev-Dependencies getrennt klassifiziert sind;
- der Tailwind-freie Fallback und die Wirkung auf bestehende Maraca Builds beschrieben sind;
- lokale Tests ohne CDN und ohne unkontrollierten Netzwerkzugriff moeglich sind;
- neue Public Contracts Schema, Validator, Types, Fixture, Report und Gate einplanen;
- Aenderungen an Class- oder Style-Policies eine negative Testmatrix enthalten;
- Visual- oder Performance-Claims konkrete Browser- beziehungsweise Budget-Artefakte benennen.

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `XTM-00` | P0 | completed | WS0 | Scope, ADR, Naming und Dependency Policy einfrieren | - |
| `XTM-01` | P0 | completed | WS1 | Generischen Maraca CSS Provider Contract definieren | `XTM-00` |
| `XTM-02` | P0 | completed | WS1 | CSS Provider Lifecycle in Maraca Plan, Build und Report integrieren | `XTM-01` |
| `XTM-03` | P0 | completed | WS2 | Tailwind Adapter als separates build-time Paket implementieren | `XTM-01`, `XTM-02` |
| `XTM-04` | P0 | completed | WS2 | RMT Source Inventory und sichere Utility Policy bauen | `XTM-03` |
| `XTM-05` | P0/P1 | completed | WS3 | XTend-zu-Tailwind Token Bridge und Theme Packs implementieren | `XTM-00`, `XTM-03` |
| `XTM-06` | P1 | completed | WS3 | Material Design Kit Contract und Package Surface anlegen | `XTM-05` |
| `XTM-07` | P1 | completed | WS4 | App-Shell-, Workspace- und Navigation-Recipes bauen | `XTM-04`, `XTM-06` |
| `XTM-08` | P1 | completed | WS4 | Form-, Feedback-, Dashboard- und Content-Recipes bauen | `XTM-06`, `XTM-07` |
| `XTM-09` | P1 | completed | WS5 | Scaffold- und CLI-Fast-Path produktisieren | `XTM-03`, `XTM-07` |
| `XTM-10` | P1 | completed | WS6 | Browser-, Responsive-, A11y- und Visual-Evidence aufbauen | `XTM-07`, `XTM-08`, `XTM-09` |
| `XTM-11` | P1 | completed | WS7 | Performance, CSS Budget, Supply Chain und Reproduzierbarkeit gaten | `XTM-03`, `XTM-09`, `XTM-10` |
| `XTM-12` | P1/P2 | completed | WS8 | Catfooding-Pilot auf einer XTend-nahen Maraca App durchfuehren | `XTM-09`, `XTM-10`, `XTM-11` |
| `XTM-13` | P2 | completed | WS9 | Docs, Migration, Release Handoff und Default-Entscheid abschliessen | `XTM-10`, `XTM-11`, `XTM-12` |
| `XTM-14` | P1 | completed | WS10 | Unveraenderte CLI-generierte RMT-/Maraca-App mit Kernel-Orchestrierung und XTM-CSS-Strecke validieren | `XTM-09`, `XTM-11`, `XTM-12`, `XTM-13` |

## Lieferphasen

| Phase | Tickets | Ergebnis |
|-------|---------|----------|
| A - Architektur und Build-Seam | `XTM-00` bis `XTM-04` | generischer, auditierbarer CSS Provider plus sicherer Tailwind Adapter |
| B - Design Kit MVP | `XTM-05` bis `XTM-08` | Token Bridge, Package und sieben semantische Recipe-Familien |
| C - Fast Path und Evidence | `XTM-09` bis `XTM-11` | Scaffold, CLI, Browser-Evidence und harte Budgets |
| D - Produktvalidierung | `XTM-12` bis `XTM-13` | Catfooding-Lessons, Release-Entscheid und dokumentierter Supportstatus |
| E - CLI Source-to-Sea Follow-up | `XTM-14` | reproduzierbarer Nachweis einer vollstaendig CLI-generierten, ungepatchten Kernel-/RMT-/XTM-App |

## Workstreams

| Workstream | Zweck |
|------------|-------|
| WS0 | Produktgrenze, Terminologie, Naming, Versionierung und Dependency Diet festlegen |
| WS1 | Tailwind-unabhaengigen CSS Provider als Maraca Build-Seam schaffen |
| WS2 | Tailwind deterministisch, lokal, source-begrenzt und diagnostizierbar anbinden |
| WS3 | bestehende XTend-Tokens und Theme-Vertraege in ein opinionated Design Kit ueberfuehren |
| WS4 | semantische App-Recipes auf vorhandenen XTend-Komponenten aufbauen |
| WS5 | Fast Path in Scaffold, CLI und Build-Konfiguration anbieten |
| WS6 | echte Browser-, Theme-, Density-, A11y- und Visual-Claims belegen |
| WS7 | CSS-Kosten, Supply Chain, Reproduzierbarkeit und Exit Path absichern |
| WS8 | Catfooding-Lessons erfassen und Upstream-Entscheidungen erzwingen |
| WS9 | Adoption, Migration und Supportstatus abschliessen sowie die Default-Grenze festschreiben |
| WS10 | CLI-Erzeugung, Kernel-Orchestrierung und XTM-CSS-Provider als ungepatchte Source-to-Sea-Strecke validieren |

## Tickets im Detail

### XTM-00 - Scope, ADR, Naming und Dependency Policy einfrieren

- Prioritaet: `P0`
- Status: `completed`
- Umgesetzt: 2026-07-16
- Ziel:
  - Tailwind als optionales Build-Werkzeug und XTend Material als eigene Design-Kit-Schicht verbindlich gegen Core, Runtime, XTensions und Component Platform abgrenzen.
- Scope:
  - Paketnamen und Ownership festlegen;
  - Tailwind-Versionierungs- und Upgrade-Policy definieren;
  - direkte Build-Dependency, optional Peer und Dev-Harness unterscheiden;
  - Preflight fuer MVP auf `disabled` festlegen;
  - Tailwind v4 Browser-Baseline gegen die XTend-Supportmatrix dokumentieren;
  - Marken- und Naming-Review fuer den Begriff `Material` als Release-Handoff benennen;
  - Exit Path `tailwind -> native CSS provider` beschreiben.
- Zielartefakte:
  - `development/XTend-Material-Tailwind-Architecture-Decision.md`
  - Dependency- und Package-Matrix im ADR
  - Package-Metadaten `xtend.xtendMaterialArchitecture`
  - `tests/material/xtend_material_architecture_suite.js`
  - Runner- und Package-Script-Anschluss
- Implementierungsentscheidung:
  - `@xtend-material` ist der kanonische npm Scope und die Produktfamilie; npm verlangt fuer installierbare Pakete die vollstaendige Form `@scope/package`.
  - Das initiale Kernpaket heisst deshalb `@xtend-material/core`, der getrennte Maraca Adapter `@xtend-material/maraca-tailwind`.
  - CCS Labs besitzt Produkt-, Architektur- und Publishing-Verantwortung fuer den Scope.
  - `tailwindcss` `4.3.2` ist die verifizierte stabile Baseline und wird im Kernpaket als exakt gepinnte direkte Dependency vorgesehen.
  - Die Upgrade-Policy lautet `latest-stable-reviewed-exact-pin`; bewegliche `latest`-Manifestwerte und Registry-Abfragen in Standard-Gates bleiben blockiert.
  - Tailwind bleibt build-time-only, Preflight bleibt im MVP deaktiviert und der XTend Root erhaelt keine Tailwind Dependency.
- Lokaler Gate:
  - neuer statischer Gate `xtend-material-architecture`
- Definition of Done:
  - keine offene Ownership-Frage zwischen Maraca, Material Kit, Adapter und Scaffold;
  - Tailwind ist als Build-Dependency klassifiziert und als Runtime-Dependency blockiert;
  - Preflight-, Source-, Versionierungs- und Exit-Policy sind reviewbar;
  - `@xtend-material` ist der kanonische Scope und `@xtend-material/core` der kanonische initiale Paketname; Aliasnamen werden nicht parallel eingefuehrt.

### XTM-01 - Generischen Maraca CSS Provider Contract definieren

- Prioritaet: `P0`
- Status: `completed`
- Umgesetzt: 2026-07-16
- Ziel:
  - Maraca um einen provider-neutralen CSS-Build-Vertrag erweitern, ohne Tailwind-Sonderfaelle in den RMT-Kernel oder den bestehenden `createCssText()`-Pfad einzubauen.
- Scope:
  - Provider Lifecycle `inspect`, `plan`, `build`, `report` und `dispose`;
  - serialisierbare Eingaben fuer Source, Output, Mode, Minify, Source Policy und Budget;
  - Artefaktmodell fuer CSS-Datei, Source Map, Diagnostics und Fingerprints;
  - Statuswerte `ready`, `unavailable`, `blocked`, `failed` und `degraded`;
  - Fallback auf den bestehenden nativen Maraca-CSS-Generator;
  - deterministische Fehlercodes und TypeScript-Typen.
- Zielartefakte:
  - `development/XTend-Maraca-CSS-Provider-Contract.md`
  - `xtend-maraca/css-provider.js`
  - `xtend-maraca/css-provider.d.ts`
  - positive und negative Provider-Fixtures
  - `tests/maraca/maraca_css_provider_contract_suite.js`
  - Package Exports fuer den provider-neutralen Contract
- Umsetzung:
  - serialisierbarer Provider Snapshot mit ID, Version, Capabilities, Source Policy und SHA256-Fingerprint;
  - geschlossener Lifecycle `inspect`, `plan`, `build`, `report`, `dispose`;
  - Request-, Inspection-, Plan-, Artifact-, Evidence-, Lifecycle-Result- und Diagnostic-Schemas;
  - nativer Maraca Referenzprovider und deterministischer Dummy Provider;
  - Lifecycle Runner mit garantiertem Dispose im Erfolgs- und Fehlerpfad;
  - Root- und `@ccslabs/xtend-maraca` Subpath Exports;
  - Package Metadata, TypeScript Surface, Runner und isolierter Gate;
- Vorgesehene Diagnostics:
  - `xtend.maraca.css_provider.unavailable`
  - `xtend.maraca.css_provider.invalid`
  - `xtend.maraca.css_provider.source_blocked`
  - `xtend.maraca.css_provider.build_failed`
  - `xtend.maraca.css_provider.output_missing`
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js maraca-css-provider --json`
- Definition of Done:
  - Dummy Provider und nativer Provider bestehen denselben Contract;
  - bestehende `--css inline|external` Builds bleiben ohne Konfigurationsaenderung kompatibel;
  - Provider-Ergebnisse sind JSON-serialisierbar und fingerprint-faehig;
  - kein Tailwind-Paket wird fuer diesen Gate benoetigt.

### XTM-02 - CSS Provider Lifecycle in Maraca Plan, Build und Report integrieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Den Contract aus `XTM-01` durch die produktive Maraca Pipeline fuehren und CSS als erstklassiges Evidence-Artefakt behandeln.
- Scope:
  - Optionen `cssProvider`, `cssInput`, `cssSources`, `cssPreflight` und `cssBudget` normalisieren;
  - Provider Plan vor dem Rollup Build erzeugen;
  - CSS Output kontrolliert in `inline` oder `external` uebernehmen;
  - CSS-, Source- und Config-Fingerprints in Plan, Bundle Report und Size Report schreiben;
  - Provider-Fehler in strict Builds blockierend und in explizit erlaubten Fallback-Modi diagnostisch behandeln;
  - `xt maraca tune` um Provider und CSS-Kosten erweitern;
  - bestehende PWA-Precache-Logik auf das Provider-Artefakt anwenden.
- Betroffene Pfade:
  - `xtend-maraca/index.js`
  - `xtend-maraca/index.d.ts`
  - `xtend-builder/lib/cli.js`
  - Maraca Plan-, Bundle-, Tune-, PWA- und Size-Budget-Suites
- Zielartefakte:
  - Report-Sektion `cssBuild`
  - Schema `xtend.maraca.css-build-evidence.v1`
  - CLI Help und Config-Normalisierung
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js maraca-css-provider maraca-plan maraca-bundle maraca-tune maraca-pwa-service-worker --json`
- Definition of Done:
  - nativer und Dummy Provider laufen durch Plan und Build;
  - Report enthaelt Provider-ID, Version, Config-Fingerprint, Source-Fingerprints, Output-Hash und Bytes;
  - Inline und External Output sind funktional aequivalent;
  - ein Build ohne `cssProvider` bleibt byte- und verhaltenskompatibel zur aktualisierten Baseline.

#### Implementierungsnachweis

- `maraca-native` ist der kompatible Default; weitere Provider werden ueber den XTM-01-Contract injiziert und vor Rollup ausgefuehrt.
- Unbekannte Provider blockieren fail-closed. `cssProviderFallback: native` ist der einzige explizite Fallback und erzeugt eine sichtbare Diagnose.
- Plan, Bundle-, Size- und PWA-Report fuehren Request-, Config-, Source-, Evidence- und Output-Fingerprints sowie CSS-Bytes.
- Inline- und External-Modus verwenden dasselbe Provider-Artefakt; externe CSS-Ausgabe wird in den PWA-Precache aufgenommen.
- Tune-Konfiguration und Kandidatenmetriken enthalten Provider-Konfiguration und `cssBytes`.
- Gate: `node scripts/run_xtend_tests.js maraca-css-provider maraca-plan maraca-bundle maraca-tune maraca-pwa-service-worker maraca-size-budget maraca-package-exports --json`.

### XTM-03 - Tailwind Adapter als separates build-time Paket implementieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Einen lokalen Tailwind-v4-Adapter bereitstellen, der den generischen CSS Provider implementiert und keine Browser-Runtime erzeugt.
- Scope:
  - separates Paket `@xtend-material/maraca-tailwind`;
  - lokal installierte, versionierte Tailwind Toolchain ohne `npx`-Download zur Buildzeit;
  - CSS-first Input mit explizitem Source Root;
  - automatische Monorepo-Suche standardmaessig deaktivieren;
  - Preflight im MVP technisch und vertraglich deaktivieren;
  - deterministische temp-, cache- und cleanup-Policy;
  - Toolchain-Version und Adapter-Version in der Evidence;
  - klare Diagnose, wenn Adapter oder Toolchain fehlt.
- Zielartefakte:
  - Paketverzeichnis `xtend-maraca-css-tailwind/`
  - `index.js`, `index.d.ts`, `README.md`, `package.json`
  - Tailwind Provider Contract Fixture
  - `tests/maraca/maraca_tailwind_css_provider_suite.js`
- Dependency-Entscheid:
  - Tailwind Toolchain-Abhaengigkeiten duerfen nur im Material-Kernpaket, Adapterpaket und deren explizitem Test-Harness liegen;
  - `@ccslabs/xtend`, `@ccslabs/xtend-rmt` und `@ccslabs/xtend-maraca` erhalten keine Tailwind Runtime-Dependency;
  - der konkrete Tailwind API-/CLI-Anschluss wird im Ticket auf eine gepinnte, lokal aufloesbare v4-Toolchain festgelegt und im Report offengelegt.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js maraca-tailwind-css-provider --json`
- Definition of Done:
  - ein Fixture erzeugt ohne Netzwerkzugriff deterministisches CSS;
  - zwei identische Builds erzeugen identische Output-Hashes;
  - kein Tailwind-JavaScript erscheint im Browser Bundle;
  - fehlende Toolchain ergibt `unavailable` oder `blocked`, keinen stillen nativen Fallback;
  - Standard-Maraca-Tests laufen ohne Laden des Adapterpakets.

#### Implementierungsnachweis

- Workspace-Paket `@xtend-material/maraca-tailwind` stellt Provider- und Toolchain-Endpunkte getrennt bereit.
- `tailwindcss` und `@tailwindcss/node` sind auf `4.3.2` exakt gepinnt und mit Registry-Integrity im Root-Lockfile verankert.
- Der Toolchain-Endpunkt `inspect()` prueft lokale Verfuegbarkeit und exakte Versionen; `compile()` kompiliert CSS-first Inputs und explizite Sources; `dispose()` bestaetigt den speicherinternen Temp-/Cache-Vertrag.
- Builds verwenden weder `npx` noch CLI-Subprozesse, Registry, CDN, `fetch`, HTTP oder HTTPS. Nicht gepinnte Imports und ausfuehrbare JavaScript-Plugins/-Configs werden vor der Kompilierung blockiert.
- Preflight und automatische Monorepo-Discovery sind im MVP technisch deaktiviert. Der Adapter akzeptiert explizite Candidates und konservativ gescannte `class`-/`className`-Quellen; RMT-Inventarisierung folgt in XTM-04.
- Maraca loest `cssProvider: tailwind` lazy auf. Native Builds laden das Adapterpaket nicht, und Tailwind-JavaScript gelangt nicht in Browser-Chunks.
- Gate: `node scripts/run_xtend_tests.js maraca-tailwind-css-provider --json`.

### XTM-04 - RMT Source Inventory und sichere Utility Policy bauen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Tailwind die statischen, freigegebenen Klassen aus RMT-/Descriptor-Artefakten zufuehren, ohne Runtime-Dynamik oder unsichere Klassensyntax zuzulassen.
- Scope:
  - statische Klassen aus `.rmt`, kompiliertem Core und DOM Descriptors inventarisieren;
  - bestehende Maraca Descriptor Marker wiederverwenden oder in einen oeffentlichen Source-Inventory-Contract heben;
  - Utility-Klassen in `literal`, `conditional-static`, `dynamic` und `unsupported-syntax` klassifizieren;
  - dynamisch zusammengesetzte Klassennamen blockieren;
  - Tailwind Arbitrary Values, Slash-Modifikatoren und komplexe Selector-Varianten im MVP nicht durch Aufweichen des Renderer-RegEx erlauben;
  - explizite, reviewbare Safelist ueber Material Recipes statt freie App-Strings erzeugen;
  - Diagnostics mit RMT Source Location und Repair Hint liefern.
- Zielartefakte:
  - `xtend.rmt.css-source-inventory.v1`
  - Source Inventory Modul und Types
  - positive und negative `.rmt` Fixtures
  - Reportfelder `staticUtilities`, `recipeUtilities`, `blockedUtilities`, `dynamicCandidates`
  - `tests/rmt/rmt_tailwind_source_inventory_suite.js`
- Vorgesehene Diagnostics:
  - `rmt.css.utility.dynamic_name`
  - `rmt.css.utility.unsupported_syntax`
  - `rmt.css.utility.unowned_safelist`
  - `rmt.css.utility.source_outside_policy`
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js rmt-tailwind-source-inventory maraca-tailwind-css-provider --json`
- Definition of Done:
  - statische RMT-Klassen gelangen reproduzierbar in den Tailwind Build;
  - dynamische Klassennamen scheitern vor dem CSS Build mit Source Location;
  - der Trusted-DOM Renderer akzeptiert keine zuvor blockierte Klassensyntax zusaetzlich;
  - Recipes koennen ihre geschlossene Utility-Menge explizit registrieren.

#### Implementierungsnachweis

- Oeffentlicher Authoring-Vertrag ist `xtm-material-classes-only`: RMT-Apps verwenden strukturierte Klassen wie `xtm-app-shell`, `xtm-page`, `xtm-stack` und `xtm-card` statt Tailwind-Utility-Strings.
- `xtend.rmt.css-source-inventory.v1` inventarisiert RMT-Source und kompilierte DOM Descriptors, klassifiziert Literale und conditional-static Class Maps und fuehrt Source Location sowie Repair Hint.
- Jede `xtm-*`-Klasse wird durch eine reviewbare Recipe mit geschlossener interner Utility-Menge expandiert. Im generierten CSS erscheinen nur semantische `xtm-*`-Selektoren, nicht die internen Utility-Selektoren.
- Dynamische Namen, rohe Utilities, unbekannte Recipes, Arbitrary Values, Slash-Modifikatoren, Varianten und Sources ausserhalb des App-Roots blockieren den Maraca Plan.
- Der Trusted-DOM Renderer wurde nicht erweitert; zuvor unzulaessige Klassensyntax erhaelt keinen Sonderpfad.
- Gate: `node scripts/run_xtend_tests.js rmt-tailwind-source-inventory maraca-tailwind-css-provider --json`.

### XTM-05 - XTend-zu-Tailwind Token Bridge und Theme Packs implementieren

- Prioritaet: `P0/P1`
- Status: `completed`
- Umgesetzt: 2026-07-16
- Ziel:
  - Tailwind Utilities aus den bestehenden XTend Design Tokens ableiten und die vier Theme- sowie drei Density-Packs ohne zweite Token-Source-of-Truth abbilden.
- Scope:
  - Mapping fuer Color, Surface, Text, Border, Focus, Space, Radius, Typography, Motion, Elevation und Density;
  - Tailwind Theme Variables referenzieren `var(--xtend-*)`;
  - keine hart codierte zweite Produktpalette in der Bridge;
  - Light, Dark, High Contrast und Forced Colors;
  - Comfortable, Compact und Dense;
  - Reduced Motion und sichtbare Focus Defaults;
  - Validator gegen unbekannte oder fallback-lose XTend Token References.
- Zielartefakte:
  - `design-tokens/tailwind/xtend-theme.css`
  - `design-tokens/tailwind/xtend-material-theme.css`
  - maschinenlesbare Token-Mapping-Matrix
  - Token Bridge Types/Report
  - `tests/tokens/tailwind_token_bridge_suite.js`
- Umsetzung:
  - versionierte Mapping-Matrix mit 28 semantischen Tailwind Theme Variables fuer Color, Surface, Text, Border, Space, Radius, Typography, Motion, Elevation und Density;
  - jede Tailwind Variable delegiert mit explizitem Fallback an einen bestehenden `--xtend-*` Core- oder Alias-Token;
  - `x-theme` bleibt Runtime-Owner fuer Light, Dark, High Contrast, Forced Colors sowie Comfortable, Compact und Dense;
  - deklarative Experience Packs `enterprise` und `utility` optimieren Hierarchie, Elevation und Dichte fuer langlebige Workflows beziehungsweise schnell deploybare Utility Apps, ohne eine zweite Palette einzufuehren;
  - Maraca Tailwind Provider bindet die validierte Bridge automatisch ein und schreibt Pack-, Capability- und Fingerprint-Evidence in den Build Report;
  - semantische `xtm-*` Recipes lassen theme- und density-sensitive Werte bewusst in der Runtime-Token-Schicht, sodass kein CSS Rebuild fuer Pack-Wechsel notwendig ist;
  - Validator blockiert unbekannte XTend Tokens, fehlende Fallbacks und konkurrierende hart codierte Tailwind Produktwerte;
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js design-tokens xtheme-token-alias-layer tailwind-token-bridge --json`
- Definition of Done:
  - jede neue Tailwind Theme Variable besitzt eine dokumentierte XTend-Token-Quelle;
  - Theme- und Density-Wechsel funktionieren ohne erneuten CSS Build;
  - Forced Colors nutzt Systemfarben und Reduced Motion behaelt Kernfunktion;
  - Gate blockiert konkurrierende Material-/Tailwind-Produktwerte ohne XTend-Referenz.

### XTM-06 - Material Design Kit Contract und Package Surface anlegen

- Prioritaet: `P1`
- Status: `completed`
- Umgesetzt: 2026-07-16
- Ziel:
  - Das Design Kit als versioniertes, eigenstaendiges Produktpaket mit stabiler semantischer Oberflaeche etablieren.
- Scope:
  - Package `@xtend-material/core`;
  - Designprinzipien fuer Surface, Hierarchy, Typography, Shape, Density, Motion und Status;
  - Recipe Contract mit ID, Version, Slots, Components, Tokens, Utilities, responsive Verhalten, A11y und Fallback;
  - Exports fuer CSS, Token Mapping, Recipes, Maraca Preset und Types;
  - keine Component Definition oder zweite Registry;
  - Kompatibilitaetsmatrix fuer XTend- und Tailwind-Versionen.
- Zielartefakte:
  - `development/XTend-Material-Design-Kit-Contract.md`
  - Paketverzeichnis `xtend-material/`
  - `package.json`, `README.md`, `index.js`, `index.d.ts`
  - `styles.css`, `tokens.css`, Recipe Registry und Maraca Preset
  - `tests/material/material_design_kit_contract_suite.js`
- Umsetzung:
  - eigenstaendiges Workspace- und Public Package `@xtend-material/core` mit CSS-, Recipe-, Maraca-Preset- und TypeScript-Exports;
  - Design-Kit-Contract `xtend.material.design-kit.v1` fuer ruhige Surface-Hierarchie, task-first Information Architecture, kompakte Typografie, kontrollierte Shape, adaptive Density, funktionale Motion und semantischen Status;
  - 15 versionierte Foundation-Recipes auf `xtend.material.recipe.v1` mit Slots, bekannten nativen beziehungsweise XTend-Komponenten, XTend-Tokens, geschlossenen Utilities, Responsive-Degradation, A11y und Native-CSS-Fallback;
  - kanonische Recipe Registry im Core Package; der Maraca Tailwind Adapter konsumiert diese Registry und besitzt keine parallele Recipe-Definition mehr;
  - moderne native Styles fuer minimalistische App Shells, intrinsische Grids, elegante Surfaces, Cards, Toolbars, Typografie und Actions ohne hart codierte Produktpalette;
  - Enterprise als komfortabler, langlebiger Default und Utility als kompakter Fast Path; Theme und Density bleiben durch `x-theme` zur Laufzeit steuerbar;
  - Maraca Preset mit Tailwind Build-Time-Provider, deaktiviertem Preflight, externer CSS-Ausgabe und explizitem Native-Fallback;
  - Validator und Gate blockieren unbekannte Komponenten, fremde Tokens, unsichere Utilities, Component-Registry-Drift und Browser-Tailwind-Runtime.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtend-material-contract scoped-package-readmes package-exports --json`
- Definition of Done:
  - Paket kann ohne Browser-Tailwind-Runtime konsumiert werden;
  - jede Recipe referenziert bekannte XTend-Komponenten oder native Tags;
  - Package Export und Pack Dry Run enthalten keine fremde Component Registry;
  - Design Kit kann unabhaengig vom Tailwind Adapter introspektiert und dokumentiert werden.

### XTM-07 - App-Shell-, Workspace- und Navigation-Recipes bauen

- Prioritaet: `P1`
- Status: `completed`
- Umgesetzt: 2026-07-16
- Ziel:
  - Den eigentlichen Fast Path fuer typische Enterprise App Shells mit vorhandenen XTend-Komponenten liefern.
- Recipe Scope:
  - `material.app-shell`
  - `material.workspace`
  - `material.navigation-rail`
  - `material.top-app-bar`
  - `material.detail-pane`
- Bevorzugte Komponenten:
  - `x-header`, `x-drawer`, `x-side-panel`, `x-section`, `x-router`, `x-menu`, `x-icon`, `x-button`, `x-surface-manager`, `x-surface-region`
- Pflichten je Recipe:
  - stabile Slots und Parts;
  - responsive Breakpoints und container-nahe Degradation;
  - Keyboard-, Focus- und Landmark-Plan;
  - Theme-, Density- und Reduced-Motion-Verhalten;
  - statische Utility-Menge und XTend-Token-Referenzen;
  - RMT Fixture und native CSS Fallback.
- Zielartefakte:
  - Recipes im Material Package
  - `tests/fixtures/material/material-app-shell.rmt`
  - Recipe Registry Report
  - Component Capability Validation
- Umsetzung:
  - fuenf kanonische Composite Recipes `material.app-shell`, `material.workspace`, `material.navigation-rail`, `material.top-app-bar` und `material.detail-pane` im Core Package;
  - stabile Root-, Header-, Navigation-, Primary-, Detail-, Content- und Action-Slots mit spiegelnden Public Parts und expliziter Component Composition;
  - ausschliessliche Komposition der vorhandenen Komponenten `x-header`, `x-drawer`, `x-side-panel`, `x-section`, `x-router`, `x-menu`, `x-icon`, `x-button`, `x-surface-manager` und `x-surface-region`;
  - Container-first Responsive Matrix mit Mobile Single Column und Drawer, Tablet Compact Rail und Desktop Rail-Primary-Detail sowie Viewport Fallback;
  - Landmark-, Tab-Order-, Escape-, Initial-Focus-, Restore-Focus- und Route-Change-Plan je Recipe;
  - native CSS-Ausgabe fuer sticky Top App Bar, intrinsischen Workspace, Navigation Rail und Detail Pane inklusive Forced Colors und Reduced Motion;
  - vollstaendig deklarative RMT-Referenz-Shell ohne manuelle HTML- beziehungsweise Host-DOM-Verdrahtung;
  - Capability Gate gegen Manifest, Component Contract v2, RMT Metadata, Public Slots und Parts sowie negative Gates gegen unbekannte Components, fehlende Breakpoints und Shadow-Root-Zugriffe.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtend-material-shell-recipes rmt-component-template-primitives layout-display-media-ux --json`
- Definition of Done:
  - eine komplette Shell entsteht aus RMT ohne manuelle Host-DOM-Verdrahtung;
  - alle Recipes bestehen Capability-, Slot-, Part- und A11y-Pruefungen;
  - mobile, tablet und desktop Layouts besitzen definierte Degradation;
  - kein Recipe greift auf Shadow-Root-Interna zu.

### XTM-08 - Form-, Feedback-, Dashboard- und Content-Recipes bauen

- Prioritaet: `P1`
- Status: `completed`
- Umgesetzt: 2026-07-16
- Ziel:
  - Den Shell Fast Path um die haeufigsten produktiven App-Flows erweitern, ohne Full-Parity-Claims fuer nicht vorhandene Komponenten zu erfinden.
- Recipe Scope:
  - `material.form-flow`
  - `material.feedback-stack`
  - `material.dashboard`
  - `material.content-page`
  - `material.settings-page`
  - `material.empty-state`
  - `material.confirmation-flow`
- Bevorzugte Komponenten:
  - `x-form`, `x-input`, `x-textarea`, `x-select`, `x-checkbox`, `x-radio`, `x-toggle`, `x-button`, `x-status`, `x-alert`, `x-progress`, `x-cards`, `x-summary`, `x-dialog`, `x-toast`
- Scope-Grenzen:
  - keine Behauptung vollstaendiger DataGrid-, Autocomplete- oder Command-Palette-Paritaet;
  - Validation, Error, Busy, Disabled und Success bleiben Component-/RMT-Verhalten;
  - Tailwind besitzt nur Layout und visuelle Composition.
- Zielartefakte:
  - Recipes, `.rmt` Fixtures und Component Capability Matrix
  - negative Fixtures fuer fehlende Components, unbekannte Slots und freie Utilities
  - Recipe Docs Snippets
- Umsetzung:
  - sieben typisierte Flow-Recipes `material.form-flow`, `material.feedback-stack`, `material.dashboard`, `material.content-page`, `material.settings-page`, `material.empty-state` und `material.confirmation-flow` in der kanonischen Registry;
  - stabile Root-, Header-, Field-, Status-, Content-, Aside-, Summary- und Action-Slots mit spiegelnden Public Parts und expliziter Composition aus den 15 vorhandenen Owned Primitives;
  - intrinsische Compact-/Wide-Degradation mit Container Enhancement sowie native CSS-Ausgabe fuer Formulare, Feedback, Dashboards, Content, Settings, Empty State und Confirmation Dialog;
  - explizite Behavior Ownership bei Component und RMT fuer Validation, Error, Busy, Disabled und Success sowie blockierte Paritaetsclaims fuer DataGrid, Autocomplete und Command Palette;
  - deklaratives RMT-Referenzfixture mit Blocking Validation, textuellem Status, Form-to-Confirmation-Action und Maraca-Bundle-Evidence;
  - negative Fixtures fuer fehlende Komponenten, unbekannte Slots und freie Utilities sowie Recipe-Dokumentation mit RMT-Snippets.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtend-material-flow-recipes form-controls-ux feedback-status-ux overlay-interaction-ux --json`
- Definition of Done:
  - mindestens ein durchgaengiger Form-to-Confirmation-Flow ist rein RMT-orchestriert;
  - Validation und Status sind nicht ausschliesslich farbbasiert;
  - Dashboard und Content Page funktionieren mit existierenden Owned Primitives;
  - negative Claims und nicht vorhandene Component-Paritaet bleiben explizit blockiert.

### XTM-09 - Scaffold- und CLI-Fast-Path produktisieren

- Prioritaet: `P1`
- Status: `completed`
- Umgesetzt: 2026-07-16
- Ziel:
  - Das Material Kit als explizit waehlbaren, reproduzierbaren App-Scaffold in den vorhandenen Builder integrieren.
- Scope:
  - `xt create app --runtime maraca --design-kit material` oder aequivalenter bestehender Generator-Einstieg;
  - Template Registry fuer App RMT, CSS, Config, Package und Smoke Test;
  - `--check`, `--write`, Ownership Manifest und kein ungefragtes Ueberschreiben;
  - Maraca Config mit `cssProvider: tailwind` und expliziten Sources;
  - lokale Scripts fuer plan, build, tune und test;
  - Diagnose und Repair Hint bei fehlendem Adapter;
  - kein Tailwind fuer andere Presets installieren oder aktivieren.
- Zielartefakte:
  - Material App Templates unter `xtend-builder/templates/app/`
  - Generator und CLI Help
  - Scaffold Report `xtend.scaffold.app-preset.material-report.v1`
  - Source-to-sea Fixture
  - Ownership- und Re-run-Tests
- Umsetzung:
  - produktiver CLI-Einstieg `xt create app --runtime maraca --design-kit material` mit Dry-run als Default sowie explizitem `--write` und `--check`;
  - registrierte Templates fuer deklaratives App-RMT, air-gapped CSS-Input, Maraca Build Config, Package Manifest und dependency-freien Smoke Test;
  - app-lokales Ownership Manifest ueber den bestehenden zentralen WritePlan, idempotente Wiederholung und blockierende Drift-/Unowned-Target-Diagnostics ohne partielle Writes;
  - Maraca Config mit `cssProvider: tailwind`, deaktiviertem Preflight, fail-closed Provider Policy und ausschliesslich expliziten lokalen Sources;
  - lokale npm Scripts fuer Plan, Build, Tune und Test sowie Tailwind und Adapter ausschliesslich als Dev Dependencies;
  - Diagnose `xtend.scaffold.material_adapter_missing` mit Repair Hint und blockierte Tailwind-Aktivierung fuer Nicht-Material-Presets;
  - Source-to-Sea Gate vom frisch erzeugten Scaffold bis zum Maraca Bundle inklusive Material Style- und Toolchain-Evidence.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtend-material-scaffold maraca-rmt-source-to-bundle scaffold-ownership --json`
- Definition of Done:
  - neuer Scaffold baut ohne manuelle Korrektur;
  - zweiter `--check` Lauf ist sauber und `--write` ist idempotent;
  - erzeugtes Package klassifiziert Tailwind nur als lokale Build-/Dev-Abhaengigkeit;
  - Wechsel des CSS Providers veraendert keine RMT Business Records.

### XTM-10 - Browser-, Responsive-, A11y- und Visual-Evidence aufbauen

- Prioritaet: `P1`
- Status: `completed`
- Umgesetzt: 2026-07-16
- Ziel:
  - Visuelle und funktionale Produktclaims fuer das Material Kit mit dem XTend Browser Hypervisor belegen.
- Matrix:
  - light, dark, high-contrast, forced-colors;
  - comfortable, compact, dense;
  - narrow mobile, tablet, desktop und wide desktop;
  - standard motion und reduced motion;
  - keyboard-only, focus-visible und screen-reader-relevante Semantik;
  - Chromium plus die im Browser Hypervisor verfuegbaren Support-Browser.
- Scope:
  - App Shell, Form Flow, Dashboard und Dialog/Toast Flow;
  - DOM-, screenshot- und Interaction-Baselines;
  - Overflow, Focus Trap/Restore, landmark order und status announcements;
  - kein Testzugriff auf private Shadow Roots ausser ueber bestehende Harness-Vertraege.
- Zielartefakte:
  - Browser-Fixtures und Visual Baselines
  - Evidence Report `xtend.material.browser-evidence.v1`
  - dokumentierte Baseline-Update-Policy
- Umsetzung:
  - vollstaendige Evidence-Matrix mit 384 Zellen fuer vier Flows, vier Theme-Modi, drei Dichten, vier Viewports und zwei Motion-Modi;
  - echter lokaler Chromium-Hypervisor-Lauf mit zellgenauen DOM-, Overflow-, Landmark-, Keyboard-, Focus-, Dialog-Restore- und Status-Checks;
  - vier laufbezogene Screenshot-Artefakte fuer Narrow Mobile, Tablet, Desktop und Wide Desktop sowie stabile JSON-Baseline ohne maschinenabhaengige Pixel-Hashes;
  - fail-closed Evidence Report `xtend.material.browser-evidence.v1` mit Critical-/Severe-A11y-Zaehler und explizitem Residual Owner fuer vorhandene Support-Browser ohne registrierten Adapter;
  - ausschliesslich oeffentliche DOM- und Semantikvertraege ohne Zugriff auf private Shadow Roots;
  - dokumentierte Baseline-Update-Policy mit Reviewpflicht fuer Screenshots, Accessibility, Overflow und Focus-Verhalten.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtend-material-browser-evidence visual-snapshots component-runtime-a11y --json`
- Definition of Done:
  - alle Matrixzellen besitzen einen pass/fail-Nachweis oder benannten Residual Owner;
  - keine kritischen oder schweren neuen A11y-Befunde;
  - kein horizontaler Viewport-Overflow in den Shell-Fixtures;
  - Reduced Motion und Forced Colors bleiben funktional und lesbar.

### XTM-11 - Performance, CSS Budget, Supply Chain und Reproduzierbarkeit gaten

- Prioritaet: `P1`
- Status: `completed`
- Umgesetzt: 2026-07-16
- Ziel:
  - Den Fast Path gegen unkontrolliertes CSS-Wachstum, nicht reproduzierbare Toolchains und versteckte Runtime-Kosten absichern.
- Scope:
  - CSS Bytes raw und komprimiert pro Referenz-App messen;
  - inkrementelle und kalte Buildzeit erfassen;
  - ungenutzte Recipe-/Utility-CSS-Anteile inventarisieren;
  - Tailwind- und Adapter-Version, Lockfile, Lizenz und Provenance reporten;
  - Standard-Maraca-Bundle gegen Runtime-Zuwachs pruefen;
  - deterministischer Doppelbuild und sauberes Temp-/Cache-Cleanup;
  - Exit Test mit nativem CSS Provider;
  - Budget erst aus den gemessenen Fixtures ableiten und dann als Contract einfrieren.
- Zielartefakte:
  - `development/XTend-Material-Performance-und-Supply-Chain-Contract.md`
  - Budget Fixture und Report `xtend.material.performance-report.v1`
  - Supply-Chain-Evidence im Maraca Report
  - Regression Suite fuer Output-Hashes und Bundle Contents
- Umsetzung:
  - oeffentlicher, typisierter Quality Contract `xtend.material.quality-policy.v1` mit blockierenden CSS-, Buildzeit-, Runtime- und Unused-Recipe-Budgets;
  - reale Messlaeufe fuer eine schnell deploybare Utility App und einen volleren Enterprise Workspace mit Raw-/Gzip-CSS, Cold-/Incremental-Build und Recipe-Nutzungsinventur;
  - byte-identischer Doppelbuild, stabile Output-Fingerprints sowie memory-only Dispose-Evidence ohne Temp- oder persistente Cache-Eintraege;
  - Anti-Monkeypatching-Audit fuer Prototype-/Registry-Mutationen, private Shadow Roots, unsichere DOM-Sinks, globale Style-Injection und Tailwind Runtime Imports inklusive sechs negativer Blocking Fixtures;
  - geschuetzte Ownership-Hashes fuer Component Manifest, RMT Browser Runtime und CSS Provider Contract vor und nach dem Build;
  - Supply-Chain-Evidence fuer exakte Toolchain-Versionen, npm Integrity, Lockfile-Hash, Lizenzen und Provenance;
  - lokale Package-Surface-Dry-Runs fuer `@xtend-material/core` und `@xtend-material/maraca-tailwind` gegen explizite File-Contracts ohne Subprozess oder Netzwerk;
  - nativer Provider Exit Test mit semantischem Material CSS, null Tailwind Runtime Bytes und unveraenderten RMT Business Records.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtend-material-performance maraca-size-budget supply-chain pack-dry-run --json`
- Definition of Done:
  - Standard-Maraca- und XTend-Core-Browser-Bundles enthalten keine Tailwind Runtime Bytes;
  - gemessene CSS- und Buildzeit-Budgets sind fixture-basiert, dokumentiert und blockierend;
  - identische Inputs und Toolchain erzeugen identische Hashes;
  - Package Dry Run enthaelt nur beabsichtigte Adapter- und Kit-Artefakte;
  - der native Provider Exit Test bleibt gruen.

### XTM-12 - Catfooding-Pilot auf einer XTend-nahen Maraca App durchfuehren

- Prioritaet: `P1/P2`
- Status: `completed (2026-07-16)`
- Ziel:
  - Den Fast Path in einer echten XTend-nahen Produktflaeche einsetzen und jede Lesson Identified gemaess Catfooding Workflow in eine Upstream-Entscheidung ueberfuehren.
- Pilot-Auswahl:
  - bevorzugt eine bestehende RMT-first Docs-, Dev-Surface- oder interne Workbench-App;
  - keine Migration einer kritischen Produktflaeche ohne vorherige Evidence aus `XTM-10` und `XTM-11`.
- Scope:
  - Baseline fuer Implementierungszeit, Dateien, CSS Bytes, Buildzeit, A11y und Visual Defects aufnehmen;
  - Pilot mit Material Scaffold und Recipes umsetzen;
  - `xt maraca tune` ausfuehren;
  - Lessons als `framework-native`, `design-kit-local`, `app-local` oder `rejected` klassifizieren;
  - framework-native Lessons vor Abschluss upstream ticketen;
  - Dev Surface und Telemetry-Kompatibilitaet pruefen.
- Zielartefakte:
  - `development/XTend-Material-Catfooding-Report.md`
  - Before/After Matrix
  - Lesson Registry mit Owner, Entscheidung und Ziel-Ticket
  - Pilot Browser- und Build-Evidence
- Umsetzung:
  - dedizierte RMT-first Operations-App `products/xtend-material-workbench` als neutrale Catfooding-Flaeche angelegt;
  - XTM-09 Scaffold-Lineage, lokaler Tailwind Provider, strikte Maraca-Orchestrierung und ausschliesslich semantische `xtm-*`-Autorenklassen festgeschrieben;
  - 15 States und 15 Surfaces fuer Shell, Navigation, Dashboard, Form/Validation, Content, Settings, Confirmation/Transition und Feedback umgesetzt;
  - realen Tune-Run ueber 12 Kandidaten ausgefuehrt und `max / route / inline` mit Fingerprints committed;
  - Before/After-, Build-, Browser-, A11y-, Visual-, Dev-Surface-, Telemetry- und Lesson-Evidence im Report `xtend.material.catfooding-report.v1` gebuendelt;
  - Lesson Registry ohne unentschiedene oder unowned Eintraege erstellt; framework-native Lessons werden durch den Gate nur mit `XTM-*`-Upstream-Ticket akzeptiert;
  - Produktquellen gegen Anti-Monkeypatching und Trusted-DOM-Verletzungen abgesichert.
  - QS-Nachlauf vom 2026-07-16: fehlende konkrete Product-Tokens, OS-abhaengiges Dark-Color-Scheme und permanent offenen Evidence-Dialog korrigiert;
  - produktives Enterprise-Light-Theme ueber den oeffentlichen XTend-Token-Contract installiert, Shell-Hierarchie und native Controls fuer Desktop und Mobile geschaerft sowie Confirmation deklarativ ohne App-lokale Event-Listener umgesetzt;
  - Browser-Hypervisor um einen berechneten Visual Contract erweitert, der konkrete Surface-Farbe, Light-Color-Scheme, initial geschlossenen Dialog, Overflow, nutzbare Primary-Breite und effektive Viewport-Breite blockierend prueft; die kompakte Evidence nutzt Chromiums reale 500-CSS-px-Mindestbreite statt eines irrefuehrend als 390 px bezeichneten Crops; Lessons `XTM12-L04` und `XTM12-L05` dokumentieren Ownership und Upstream-Entscheid.
  - separaten direkt erreichbaren Runtime-Host `site/runtime.html` ergaenzt; der Browser-Gate bootet dort das gebaute RMT/Maraca-Artefakt eager und verlangt aktive Orchestrierung sowie alle 15 materialisierten Surfaces, waehrend die visuelle Evidence-Projektion stabil komponiert bleibt.
  - Shell-Kante aus fortgesetzter QS geschlossen: getrackter Hash-Router stellt `aria-current` fuer Evidence, Lessons und Settings nach Transition und Direkt-Reload wieder her; der viewport-gebundene Workspace delegiert Scrollen ausschliesslich an den Primary-Slot, sodass Sidebar und Detail-Pane bei Anchor-Spruengen sichtbar bleiben; Runtime-Diagnostics oeffnen getrennt und tragen selbst die vollstaendige persistente Produktnavigation; Browser-Gate laedt jeden Route-Hash direkt und blockiert fehlende Links, falschen aktiven Zustand oder einen aus dem Viewport gescrollten Navigation-Rect (`XTM12-L06`).
  - DEV-API-Kante aus fortgesetzter QS geschlossen: die reine HTML-Evidence-Projektion exponiert keine `window.__XTEND_DEV_API__` mehr und wird von XTend DevTools ehrlich als nicht instrumentiert erkannt; ausschliesslich der echte Maraca-Runtime-Host installiert den vollstaendigen synchronen v1-Contract mit aktuellen Performance-, Fabric-, Kernel- und Hydration-Snapshots; Browser-Gate blockiert Partial-APIs und nicht serialisierbare Snapshots (`XTM12-L07`).
  - Runtime-Praesentationskante aus fortgesetzter QS geschlossen: der flache Graph aus 15 unabhaengig materialisierten RMT-Surfaces bleibt verbunden in einem inert gekapselten Ein-Pixel-Mount und wird nicht mehr faelschlich als komponierte App Shell dargestellt; eine ruhige Diagnoseflaeche projiziert reale Boot-, Surface- und DEV-API-Werte; Browser-Gate blockiert sichtbare oder layoutwirksame Runtime-Mounts (`XTM12-L08`).
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtend-material-catfooding --json`
- Definition of Done:
  - Pilot laeuft vollstaendig ueber RMT, Maraca und den Browser Hypervisor;
  - keine identifizierte Upstream-Lesson bleibt ohne Entscheidung;
  - Tune-, A11y-, Visual- und Performance-Evidence ist verlinkt;
  - App-lokale Workarounds verletzen weder Monkeypatching- noch Trusted-DOM-Regeln.

### XTM-13 - Docs, Migration, Release Handoff und Default-Entscheid abschliessen

- Prioritaet: `P2`
- Status: `completed (2026-07-16)`
- Ziel:
  - Das Design Kit mit ehrlichen Claims, Supportmatrix, Migration und einem expliziten Entscheid ueber seinen langfristigen Status veroeffentlichungsbereit machen.
- Scope:
  - Quick Start, Recipes, Tokens, Themes, Density, Tailwind Adapter und Troubleshooting;
  - Migration von handgeschriebenem Shell CSS und Rueckmigration auf den nativen Provider;
  - Dokumentation der nicht unterstuetzten Tailwind-Syntax in RMT;
  - Tailwind Upgrade Runbook und Compatibility Matrix;
  - Package Exports, SemVer, Changelog und Release Gates;
  - Entscheidung `experimental`, `supported-opt-in`, `recommended-fast-path` oder `default-for-new-maraca-apps`;
  - Default nur bei vollstaendiger Evidence und eigenem Architecture Review.
- Zielartefakte:
  - `docs/en/xtend-material.md`
  - `docs/de/xtend-material.md`
  - `docs/en/xtend-material-migration.md`
  - `docs/de/xtend-material-migration.md`
  - `development/XTend-Material-Release-Handoff.md`
  - Release Decision Matrix
- Umsetzung:
  - zweisprachige, einsteigerorientierte Developer-Center-Artikel fuer Quick Start, Recipe-Vokabular, Tokens, Themes, Density, Tailwind Adapter, Syntaxgrenzen und Troubleshooting erstellt;
  - bidirektionale Migration von handgeschriebenem Shell CSS zum Material Fast Path und vom Tailwind Adapter zum nativen CSS Provider dokumentiert und gegen dieselbe Catfooding-RMT-Source getestet;
  - Compatibility Matrix, `0.1.x` SemVer Policy, Package Changelogs und `latest-stable-reviewed` Tailwind Upgrade Runbook festgeschrieben;
  - Release Decision Matrix bewertet und `supported-opt-in` durch CCS Labs als oeffentlichen Supportstatus gewaehlt;
  - `recommended-fast-path` bis zu breiter externer Adoption zurueckgestellt und `default-for-new-maraca-apps` ohne separaten akzeptierten ADR blockiert;
  - Package-Surfaces, Developer-Center-Menue und maschinenlesbaren Report `xtend.material.docs-release-report.v1` in den Root Gate integriert;
  - weder Framework-Default noch npm Publish als Teil des Tickets veraendert beziehungsweise ausgefuehrt.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtend-material-docs docs-public-quality scoped-package-readmes package-exports references --json`
- Definition of Done:
  - Public Docs behaupten keine Angular-/Google-Material-Paritaet;
  - Support- und Syntaxgrenzen sind dokumentiert;
  - Migration in beide Richtungen ist beschrieben und getestet;
  - Release Owner hat einen der vier Supportstatus mit Evidence entschieden;
  - ein Default-Wechsel ist kein stiller Teil dieses Tickets, sondern benoetigt einen separaten akzeptierten Architecture Decision Record.

### XTM-14 - Unveraenderte CLI-generierte RMT-/Maraca-App mit Kernel-Orchestrierung und XTM-CSS-Strecke validieren

- Prioritaet: `P1`
- Status: `completed`
- Typ: `post-release validation follow-up`
- Ziel:
  - Die noch offene Source-to-Sea-Aussage belegen, dass eine ausschliesslich ueber die oeffentliche Maraca-/XTend-CLI erzeugte RMT-App den Material Fast Path ohne nachtraegliche Host-, RMT-, CSS-, Config- oder Bundle-Patches planen, bauen, tunen, starten und im Browser betreiben kann.
  - Insbesondere die CLI-generierte CSS-Strecke `Scaffold -> RMT Source Inventory -> Maraca CSS Provider -> lokaler Tailwind Build -> statisches Browser-Artefakt` gemeinsam mit aktiver Kernel-Orchestrierung validieren.
- Abhaengigkeiten:
  - `XTM-09` fuer Scaffold- und CLI-Preset;
  - `XTM-11` fuer Reproduzierbarkeit, Supply Chain und Runtime-Budgets;
  - `XTM-12` fuer Catfooding-, Browser- und DEV-API-Lessons;
  - `XTM-13` fuer den bestehenden Status `supported-opt-in` und die dokumentierten Public Claims.
- Referenz-App:
  - neue kleine, neutrale Fixture-App mit eigener Temp-Workspace-Erzeugung; keine Ableitung oder Kopie der handkomponierten Workbench-Site;
  - mindestens persistente App Shell, Header, Navigation, zwei routbare Content-Surfaces, Dashboard/Card, Form mit Validation, Feedback und Confirmation-Surface;
  - ausschliesslich semantische `xtm-*`-Recipes und vorhandene XTend-Komponenten in der generierten RMT-Quelle;
  - Kernel-Orchestrierung, Hydration, Validation und mindestens eine Action-/Transition-Strecke muessen im generierten Maraca-Plan aktiv sein.
- CLI-only Pflicht:
  - der Gate erzeugt die App in einem frischen Temp-Verzeichnis durch den echten CLI-Entry-Point und dokumentiert argv, cwd, Exit Codes und Tool-Versionen;
  - Scaffold, Plan, Build und Tune werden ueber die oeffentlichen CLI-Kommandos ausgefuehrt; direkte Aufrufe interner Generator-, Compiler- oder Provider-Funktionen gelten nicht als Acceptance Evidence;
  - der Gate darf vor Buildbeginn nur die von der CLI erzeugten Dateien lesen und inventarisieren, nicht veraendern;
  - notwendige App-Optionen muessen als CLI-Flags, offizieller Preset-Input oder CLI-generierte Config entstehen; ein nachtraegliches `apply_patch`, String-Rewrite, Copy-over, HTML-Injection oder CSS-Anhaengen blockiert den Lauf;
  - Tests duerfen erwartete Contracts und Golden-Metadaten enthalten, aber keine vorgefertigten Produktdateien in den Temp-Workspace kopieren.
- Generierungs- und Mutationsevidence:
  - unmittelbar nach Scaffold wird ein kanonisches Inventar aller generierten Source-/Config-Dateien mit SHA-256, Bytes und Rolle erfasst;
  - nach Plan, Build und Tune wird erneut inventarisiert; nur deklarierte Build-, Report-, Tune- und Lock-Artefakte duerfen neu oder veraendert sein;
  - generierte Authoring-Dateien (`.rmt`, App-CSS, Material-Config, Maraca-Config und Browser-Host) muessen zwischen Scaffold und Browserlauf byte-identisch bleiben, sofern Tune nicht fuer eine explizit deklarierte generierte Tune-Config schreiben darf;
  - der Report muss jede erlaubte Mutation benennen; unbekannte, in-place veraenderte oder ausserhalb des Output-Roots erzeugte Datei blockiert.
- CSS-Provider-Pflichten:
  - Plan- und Build-Evidence muessen `xtend.maraca.css-provider.v1`, Provider `tailwind`, die gepinnte Toolchain, Preflight `disabled`, alle freigegebenen Sources und deren Fingerprints ausweisen;
  - das erzeugte CSS muss Material-Recipe-Regeln und die benoetigte XTend-Token-Bridge enthalten;
  - Browser-HTML und JavaScript duerfen weder Tailwind Runtime Imports noch CDN-, Remote-Stylesheet- oder Play-CDN-Referenzen enthalten;
  - der Browserlauf muss `0` Tailwind-Runtime-Bytes und ausschliesslich lokale Build-Assets nachweisen;
  - ein zweiter Build aus identischem Scaffold-Input muss byte-identische CSS-, JS-, Manifest- und Evidence-Fingerprints erzeugen;
  - ein air-gapped Lauf mit gesperrtem Netzwerk muss denselben erfolgreichen Buildpfad verwenden.
- RMT- und Kernel-Pflichten:
  - die kanonische RMT-Quelle enthaelt keine freien Tailwind-Utility-Klassen, dynamisch konstruierten Class Tokens oder Runtime-Imports des Tailwind Adapters;
  - der generierte Plan weist Kernel-Orchestrierung und deren Scheduling-/Fiber-Records explizit aus;
  - der Browser bootet das generierte Maraca-Artefakt selbst, nicht einen separaten handgeschriebenen Runtime-Probe-Host;
  - die sichtbare App Shell muss aus der generierten RMT-/Maraca-Strecke stammen; ein statischer Evidence-Doppelgaenger ist fuer dieses Ticket unzulaessig;
  - die XTend DEV API wird nur akzeptiert, wenn sie vom echten generierten Runtime-Host vollstaendig und synchron bereitgestellt wird; Partial-APIs oder eine DEV API auf einer HTML-only Projektion blockieren.
- Browser- und DX-Pflichten:
  - Desktop- und Compact-Viewport pruefen sichtbare persistente Navigation, aktive Route nach Direkt-Reload, Primary-Scroll-Containment, Dialog-Initialzustand, Validation, Focus und null horizontalen Overflow;
  - Light, Dark und High-Contrast werden mindestens als berechnete Token-/Color-Scheme-Contracts geprueft; Forced Colors bleibt Bestandteil der bestehenden XTM-10-Matrix;
  - Console Errors, fehlgeschlagene lokale Assets, 404/5xx, nicht serialisierbare DEV-API-Snapshots und nicht materialisierte Pflicht-Surfaces blockieren;
  - die dokumentierte CLI-Sequenz muss von leerem Temp-Verzeichnis bis zum laufenden lokalen Browser-Artefakt ohne manuelle Zwischenschritte reproduzierbar sein;
  - gemessene Time-to-first-shell, Scaffold-/Build-/Tune-Dauer und erzeugte Dateianzahl werden berichtet, ohne daraus vorab einen neuen Public Performance Claim abzuleiten.
- Negative Gates:
  - manipulierte generierte Authoring-Datei wird durch den No-Patch-Hashvergleich erkannt;
  - freie Tailwind-Utility in RMT wird durch Source Inventory und Diagnostics abgewiesen;
  - fehlender Tailwind Adapter erzeugt den dokumentierten `unavailable`-/`blocked`-Status und keinen stillen Provider-Fallback;
  - dynamischer Utility-Name, Remote-CSS-Quelle, aktiviertes Preflight oder Tailwind-Browser-Import blockieren;
  - deaktivierte Kernel-Orchestrierung, fehlende CSS-Evidence oder nicht reproduzierbarer Doppelbuild blockieren;
  - ein Test, der interne Generator-APIs statt des CLI-Prozesses verwendet, darf den Acceptance Gate nicht erfuellen.
- Zielartefakte:
  - `tests/products/xtend_material_cli_generated_app_suite.js`
  - `tests/fixtures/material/cli-generated-kernel-app-contract.json`
  - `.xtend-test-results/xtend-material-cli-generated-app-report.json`
  - `.xtend-test-results/xtend-material-cli-generated-app/` mit Plan-, Build-, Tune-, Inventar-, Netzwerk- und Browser-Evidence;
  - `development/XTend-Material-CLI-Generated-Kernel-App-Report.md`
  - Runner-Anschluss `xtend-material-cli-generated-app` und Root-Package-Metadaten fuer Report, lokalen Gate und Ownership.
- Report-Contract:
  - Schema `xtend.material.cli-generated-app-report.v1`;
  - enthaelt CLI-Invocation-Evidence, Toolchain, Scaffold-Inventar, erlaubte Mutationen, Source Inventory, Provider-/CSS-Evidence, Kernel-Plan, Doppelbuild-Fingerprints, Runtime-Bytes, Browserzellen, DEV-API-Status, negative Fixtures und Cleanup;
  - Statuswerte `passed`, `blocked`, `failed`; ein Lauf mit Patches oder Netzwerkzugriff kann nie `passed` sein.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtend-material-cli-generated-app --json`
- Definition of Done:
  - eine frische App wird ausschliesslich ueber die oeffentliche CLI erzeugt, geplant, gebaut und getuned;
  - keine generierte Authoring-/Host-Datei wird nach dem Scaffold gepatcht oder ersetzt;
  - Kernel-Orchestrierung, RMT-Surfaces, XTM-Recipes und lokaler Tailwind CSS Provider sind im selben generierten Browser-Artefakt aktiv;
  - CSS-, JS-, Manifest- und Evidence-Ausgaben sind im Doppelbuild reproduzierbar und der Build bleibt air-gapped;
  - Browser-Evidence belegt eine nutzbare, responsive und navigierbare generierte Shell ohne 404, Console Error, Overflow oder Tailwind Runtime;
  - die echte Runtime stellt eine vollstaendige serialisierbare XTend DEV API bereit oder der Report dokumentiert mit blockierendem Status die noch fehlende CLI-Faehigkeit;
  - alle Negative Gates schlagen mit stabilen Diagnosecodes fehl und Temp-/Cache-Artefakte werden nach dem Lauf vollstaendig bereinigt;
  - die Ergebnisse aendern weder den bestehenden `supported-opt-in`-Status noch einen Framework-Default automatisch; weitergehende Adoption bleibt eine separate Entscheidung.

## Kritischer Pfad

```text
XTM-00
  -> XTM-01
    -> XTM-02
      -> XTM-03
        -> XTM-04
        -> XTM-05
          -> XTM-06
            -> XTM-07
              -> XTM-08
              -> XTM-09
                -> XTM-10
                  -> XTM-11
                    -> XTM-12
                      -> XTM-13
                        -> XTM-14
```

`XTM-04` und `XTM-05` koennen nach `XTM-03` parallel laufen. `XTM-08` und die Scaffold-Vorbereitung aus `XTM-09` koennen nach stabiler Shell Recipe Registry parallelisiert werden. Browser- und Performance-Claims beginnen erst mit einer reproduzierbar scaffoldbaren Referenz-App. `XTM-14` ist ein post-release Source-to-Sea-Follow-up und aendert den abgeschlossenen Supportentscheid aus `XTM-13` nicht still; sein Gate wird vor einer weitergehenden Empfehlung jedoch blockierend.

## Gate-Matrix

| Gate | Ab Ticket | Blockiert |
|------|-----------|-----------|
| `xtend-material-architecture` | `XTM-00` | Boundary-, Naming- und Dependency-Drift |
| `maraca-css-provider` | `XTM-01` | ungueltige Provider und fehlende Evidence |
| `maraca-tailwind-css-provider` | `XTM-03` | nicht deterministische oder netzabhaengige Builds |
| `rmt-tailwind-source-inventory` | `XTM-04` | dynamische, unsichere oder unowned Utilities |
| `tailwind-token-bridge` | `XTM-05` | zweite Token-Wahrheit und fehlende Fallbacks |
| `xtend-material-contract` | `XTM-06` | parallele Components oder unvollstaendige Recipes |
| `xtend-material-shell-recipes` | `XTM-07` | Shell-, Slot-, Part- und Capability-Verletzungen |
| `xtend-material-flow-recipes` | `XTM-08` | Flow-, Form-, Feedback- und Claim-Verletzungen |
| `xtend-material-scaffold` | `XTM-09` | nicht idempotente oder unvollstaendige App-Erzeugung |
| `xtend-material-browser-evidence` | `XTM-10` | Responsive-, Theme-, Visual- und A11y-Regressionen |
| `xtend-material-performance` | `XTM-11` | CSS-, Buildzeit-, Runtime- und Supply-Chain-Budgetverletzungen |
| `xtend-material-catfooding` | `XTM-12` | Lessons ohne Upstream-Entscheid |
| `xtend-material-docs` | `XTM-13` | ungedeckte Claims, fehlende Migration und Release Drift |
| `xtend-material-cli-generated-app` | `XTM-14` | interne Generator-Abkuerzungen, gepatchte Scaffold-Dateien, CSS-Provider-/Kernel-Drift, Netzabhaengigkeit und nicht reproduzierbare CLI-Artefakte |

## Release-Handoff

Der MVP ist technisch implementiert und durch XTM-12 produktstrategisch validiert. XTM-13 vergibt den oeffentlichen Status `supported-opt-in`. Drittentwickler koennen den Fast Path bewusst ueber `--design-kit material` aktivieren; XTend- und Maraca-Defaults bleiben unveraendert. XTM-14 hat den CLI-only Source-to-Sea-Pfad samt interaktiver Route-, Theme-, Validation-, Focus-, Dialog-, DEV-API- und Browser-Fehlertelemetrie bestanden. Der Nachweis aendert den bestehenden Supportstatus weder ab noch erweitert ihn ohne neuen Entscheid.

Folgende Aussagen bleiben auch nach Abschluss der Initiative blockiert:

- Tailwind ist der Default-CSS-Pfad von Maraca.
- XTend Material bietet vollstaendige Material-Design-Paritaet.
- Tailwind Utilities sind eine stabile RMT-API.
- Das Material Kit ersetzt den XTend Component Catalog.

Zulaessig ist die Aussage, dass der explizit aktivierte Fast Path innerhalb der dokumentierten Compatibility-, Syntax-, Browser- und Provider-Grenzen unterstuetzt wird. `recommended-fast-path` bleibt bis zu breiter externer Adoption zurueckgestellt; `default-for-new-maraca-apps` benoetigt einen separaten akzeptierten ADR.

## Abschlussnachweis

Alle Tickets `XTM-00` bis `XTM-14` sind abgeschlossen. Das post-release Validation Ticket belegt den ungepatchten CLI-only Source-to-Sea-Pfad einschließlich interaktiver Browsermatrix. Die Initiative besitzt weiterhin keine offene Migration- oder Supportstatus-Entscheidung.

| Abschlussbereich | Ergebnis |
|------------------|----------|
| Package Surface | `@xtend-material/core` und `@xtend-material/maraca-tailwind` in Version `0.1.0` mit Changelog |
| Public Docs | vier umfangreiche DE-/EN-Artikel, 168 zweisprachige Developer-Center-Routen, null Stub-Artikel |
| Recipes | 26 semantische `xtm-*`-Recipes ohne oeffentliche Tailwind-Utility-API |
| Browser Evidence | 384 Matrixzellen, vier Baseline-Viewports, Catfooding-Screenshots und blockierender Computed-Style-Contract |
| Performance | deterministische Builds, CSS-Budgets und null Tailwind Runtime Bytes |
| Migration | Legacy-zu-Material und Tailwind-zu-Native bei identischem RMT-Fingerprint getestet |
| Catfooding | 15 States, 15 Surfaces, 12/12 Tune-Kandidaten und null unentschiedene Lessons |
| Release | `supported-opt-in`; kein Publish und keine Default-Aenderung durch diese Initiative |
| Abgeschlossenes Follow-up | `XTM-14 completed`: CLI-only Kernel-/RMT-/XTM-/CSS-Pfad und interaktive Browsermatrix bestanden |

Kanonische Abschlussartefakte sind `development/XTend-Material-Release-Handoff.md`, `development/XTend-Material-Catfooding-Report.md`, `docs/de/xtend-material.md`, `docs/en/xtend-material.md` und der Report `.xtend-test-results/xtend-material-docs-release-report.json`.
