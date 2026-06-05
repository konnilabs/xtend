# XTend Native-First RMT UI Primitive Gap Contract

- Status: `accepted by NFM-WP-14`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-14-RMT-UI-Primitive-Gap-Analysis-erstellen.md`
- Contract: `xtend.native-first.rmt-ui-primitive-gap.v1`
- Gap Matrix: `xtend.native-first.rmt-ui-primitive-gap-matrix.v1`
- Gap Item Schema: `xtend.native-first.rmt-ui-primitive-gap-item.v1`
- Report Schema: `xtend.native-first.rmt-ui-primitive-gap-report.v1`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Capability Contract: `xtend.native-first.ui-primitive-capability.v1`
- Market Pattern Contract: `xtend.native-first.market-pattern-parity.v1`
- Contract Runtime Parity: `xtend.native-first.contract-runtime-parity.v1`
- Audit Evidence Pack: `xtend.native-first.audit-evidence-pack.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json`
- Boundary: `app-authorable-without-manual-shell`
- Boundary: `gap-analysis-does-not-claim-implemented-primitives`
- Boundary: `rmt-kernel-remains-host-neutral`
- Boundary: `no-inline-javascript-or-unsafe-html-sink`
- Boundary: `no-new-runtime-dependency`
- Boundary: `syntax-growth-requires-core-record-and-source-map`
- Boundary: `missing-owned-primitives-remain-negative-claims`
- Zielzustand: `rmt-ui-primitive-gap-analysis-accepted`

## Zweck

Dieser Contract quantifiziert die RMT-UI-Abdeckung gegen die Native-First-Mission. Er beantwortet nicht, welche neue Syntax sofort implementiert wird. Er benennt, welche UI-Faehigkeiten fuer "praktisch jede App-UI" bereits deklarativ authorbar sind, welche nur mit Adapter-Residuals funktionieren und welche XTend noch als eigene Primitive-Pakete oder RMT-Records schneiden muss.

Die Gap Analysis ist ein Produkt-Gate: Produktclaims duerfen erst dann wachsen, wenn die betroffene Gap-Zeile einen Contract, einen Core-Record- oder Adapter-Pfad, Security-Policy-Grenzen, Tooling und einen Folge-Handoff besitzt.

## Scope

| Quelle | Rolle im WP-14-Gate |
|--------|---------------------|
| `development/XTend-Native-First-UI-Primitive-Capability-Matrix.md` | Capabilities `NFM-CAP-01` bis `NFM-CAP-18`, Owned-Primitive-Pakete und Missing Claims |
| `development/XTend-Native-First-Market-Pattern-Parity-Matrix.md` | Marktpattern `NFM-MP-01` bis `NFM-MP-12` und negative Claims |
| `development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md` | RMT Core-, Surface- und Trusted-DOM-Residuals aus `NFM-CRP-02`, `NFM-CRP-04` und `NFM-CRP-09` |
| `development/XTend-Native-First-Audit-Evidence-Pack.md` | Releasefaehige Eingabe fuer Contract-, Security-, Dependency- und Redaction-Evidence |
| `development/XTendRMT-vNext-Core-Format-Contract.md` | RMT Core Domains fuer Imports, Templates, Surfaces, Lanes, Operations, Slots, Events, DataSources und Security Policies |
| `development/XTendRMT-vNext-Surface-Registry-Contract.md` | Surface-Typen `root`, `modal`, `panel`, `overlay`, `workspace` und `portal` |
| `development/XTendRMT-vNext-Event-Action-DataSource-Contract.md` | Event-, Action-, Effect- und DataSource-Ausdruckskraft |
| Epic18 RMT App Platform Contracts | DOM Descriptor, Component Template, State Selector, Action Effect, Event Routing, Surface Resource Graph und App Platform Fixtures |

## Gap Item Schema

`xtend.native-first.rmt-ui-primitive-gap-item.v1` muss je Gap-Zeile diese Felder besitzen:

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `gapId` | ja | stabile ID `NFM-RUG-xx` |
| `marketPattern` | ja | referenziertes Pattern `NFM-MP-01` bis `NFM-MP-12` |
| `capabilities` | ja | Capability-IDs aus `NFM-CAP-01` bis `NFM-CAP-18` |
| `ownedPrimitivePackage` | ja | betroffene Owned-Package-ID oder `none` |
| `rmtDomains` | ja | RMT Core Domains, Adapter- oder Runtime-Domains |
| `gapClasses` | ja | Klassifikation der fehlenden Schicht |
| `coverageStatus` | ja | aktueller Authoring-Status |
| `priority` | ja | `P0`, `P1` oder `P2` |
| `appAuthorableWithoutManualShell` | ja | `yes`, `partial` oder `no` |
| `blockedClaim` | ja | Produktclaim, der bis zur Umsetzung blockiert bleibt |
| `proposedExtension` | ja | kleinster Contract-, Syntax-, Adapter- oder Primitive-Schnitt |
| `sourceContracts` | ja | fuehrende Contract-IDs oder Docs-Pfade |
| `sourceGates` | ja | lokale Gates, die den Status absichern |
| `nextHandoff` | ja | Folge-WP oder Folgeepic |

## Gap Classes

| Gap Class | Bedeutung |
|-----------|-----------|
| `syntax` | RMT braucht deklarative Syntax oder Authoring-Sugar |
| `core-record` | ein stabiler Core Record fehlt oder ist fuer UI-Maximality zu schmal |
| `adapter` | Host-, Component- oder Browser-Adapter muss getrennt vom Kernel geschnitten werden |
| `component-contract` | owned Component Contract oder Primitive-Paket fehlt |
| `security-policy` | Trusted-DOM-, URL-, Resource- oder Surface-Policy fehlt oder ist noch nicht ausgedrueckt |
| `tooling` | Compiler, Source Map, Diagnostics, Preview oder Fixture-Evidence fehlt |
| `docs` | Authoring Guide, Migration Note oder Produktclaim-Doku fehlt |

## Coverage Status

| Status | Bedeutung | Produktclaim |
|--------|-----------|--------------|
| `authorable-now` | RMT-Records, owned Components und Gates reichen fuer das Pattern | positiver Claim erlaubt, solange Gate gruen bleibt |
| `authorable-with-adapter-residual` | Pattern ist moeglich, aber Adapter-, Docs- oder Radar-Residual bleibt sichtbar | Claim nur mit Residual erlaubt |
| `contract-only-gap` | Contract existiert, aber keine vollstaendige UI-Primitive-Familie | kein Produktclaim ohne Folgepaket |
| `syntax-growth-needed` | RMT braucht zusaetzliche Syntax oder Core-Record-Ausdruckskraft | WP-15 muss entscheiden |
| `owned-primitive-needed` | XTend besitzt noch kein eigenes UI-Primitive-Paket | negativer Claim bleibt aktiv |
| `renderer-proof-deferred-to-wp18` | DOM Descriptor oder Trusted-DOM-Browserproof bleibt Folgearbeit | Renderer-Claim erst nach WP-18 |

## Source Gates

```bash
node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json
node scripts/run_xtend_tests.js native-first-market-pattern-parity --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js native-first-evidence-pack --json
node scripts/run_xtend_tests.js rmt-vnext-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-scheduler --json
node scripts/run_xtend_tests.js rmt-vnext-surfaces --json
node scripts/run_xtend_tests.js rmt-vnext-composition --json
node scripts/run_xtend_tests.js rmt-vnext-events --json
node scripts/run_xtend_tests.js rmt-vnext-security --json
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json
node scripts/run_xtend_tests.js rmt-component-template-primitives --json
node scripts/run_xtend_tests.js rmt-state-selector-runtime --json
node scripts/run_xtend_tests.js rmt-action-effect-runtime --json
node scripts/run_xtend_tests.js rmt-event-routing-runtime --json
node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js rmt-app-platform-tooling --json
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
node scripts/run_xtend_tests.js rmt-native-shell-migration --json
node scripts/run_xtend_tests.js epic18-rmt-app-platform --json
```

## Entscheidungsregeln

- Eine Gap-Zeile mit `owned-primitive-needed` darf keinen positiven Produktclaim fuer fertige DataGrid-, VirtualList-, Combobox-, Autocomplete- oder Command-Palette-Paritaet erzeugen.
- Eine Gap-Zeile mit `syntax-growth-needed` muss einen Core-Record-, Source-Map- und Diagnostics-Pfad fuer `NFM-WP-15` benennen.
- Eine Gap-Zeile mit `contract-only-gap` muss `NFM-WP-16` oder ein vergleichbares Folgepaket fuer Action, Effect, Data oder Resource nennen.
- Eine Gap-Zeile mit `authorable-with-adapter-residual` muss ihren Adapter ausserhalb des RMT-Kernels halten.
- Keine Gap-Zeile darf eine neue Runtime-Dependency als Default einfuehren.
- Keine Gap-Zeile darf Inline-JavaScript, Eval, rohe HTML-Sinks oder Host-Typ-Importe in den RMT-Kernel erlauben.
- `appAuthorableWithoutManualShell` ist das priorisierte Bewertungskriterium: ein Pattern ist erst dann produktiv claimbar, wenn App-Autoren es ohne manuelle Host-Shell oder nicht deklarative Sonderverkabelung erzeugen koennen.

## Nicht-Ziele

- keine direkte Implementierung neuer Syntax in WP-14
- kein fertiger DataGrid-, VirtualList-, Command-Palette-, Autocomplete- oder Combobox-Claim
- keine neue Runtime-Dependency
- keine Kopie von React-, Vue-, Angular-, Svelte-, Next- oder Nuxt-APIs
- kein RMT-Kernel-Import von Component-, Host-, Browser- oder Framework-Typen
- keine Absenkung von Trusted-DOM-, URL-, Resource- oder Supply-Chain-Gates

## Handoff

| Folgepaket | Handoff |
|------------|---------|
| `NFM-WP-15` | entscheidet Syntax Growth fuer Layout, Composition, Surface, Route Shell, Data Display und Command/Search |
| `NFM-WP-16` | erweitert Action-, Effect-, Data- und Resource-Primitives fuer contract-only Gaps |
| `NFM-WP-17` | hat Complete-UI-Recipe-Fixtures gegen die priorisierte Gap-Matrix gebaut |
| `NFM-WP-18` | prueft browsernahe DOM-Descriptor-, Trusted-DOM- und Renderer-Proofs |
| `NFM-WP-19` | macht Budget-, Complexity- und Performance-Gates fuer authorable-now Claims releasefaehig |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Gap-Zeilen fuer `NFM-MP-01` bis `NFM-MP-12` existieren | erfuellt |
| Gap-Klassen `syntax`, `core-record`, `adapter`, `component-contract`, `security-policy`, `tooling` und `docs` sind definiert | erfuellt |
| Data Display und Command/Search bleiben negative Claims bis owned Primitive-Pakete existieren | erfuellt |
| RMT-Kernel bleibt host-neutral und dependency-frei | erfuellt |
| Folgepakete fuer WP-15, WP-16, WP-17, WP-18 und WP-19 sind benannt | erfuellt |
