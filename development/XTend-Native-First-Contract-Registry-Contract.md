# XTend Native-First Contract Registry Contract

- Status: `accepted by NFM-WP-11`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-11-Contract-Registry-und-Contract-Discoverability-produktisieren.md`
- Contract: `xtend.native-first.contract-registry.v1`
- Contract Registry Entry Contract: `xtend.native-first.contract-registry-entry.v1`
- Registry Index: `xtend.native-first.contract-registry-index.v1`
- Drift Report: `xtend.native-first.contract-registry-drift-report.v1`
- Report Schema: `xtend.native-first.contract-registry-report.v1`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Boundary: `contracts-are-auditable-product-surface`
- Boundary: `registry-is-index-not-runtime-manager`
- Boundary: `registry-records-require-owner-workpackage-gate-docs`
- Boundary: `drift-report-before-release-evidence`
- Boundary: `rmt-kernel-remains-host-neutral`
- Zielzustand: `contract-registry-discoverability-ready`

## Zweck

Dieser Contract produktisiert Contracts als sichtbare Audit- und Produktoberflaeche der Native-First-Mission. Die Registry ist der maschinenlesbare Index fuer Contract-ID, Status, Owner, Workpackage, Report-Schema, Gate und Docs-Pfad. Sie ersetzt keine Runtime-Registry und keine Produkt-API, sondern macht vorhandene Contract-Oberflaechen auffindbar, pruefbar und releasefaehig referenzierbar.

Ein Release-, Audit- oder AI-Agent-Report darf Contract-Claims nur dann als belegt referenzieren, wenn die Contract-ID in `xtend.native-first.contract-registry-index.v1` existiert und der Eintrag mindestens Status, Owner, Workpackage, Report-Schema, Gate, Docs-Pfad und Source-of-Truth benennt.

## Registry Entry Schema

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `contractId` | ja | stabile Contract-ID, zum Beispiel `xtend.native-first.market-pattern-parity.v1` |
| `status` | ja | `accepted`, `accepted-with-residuals`, `accepted-with-prioritized-gaps`, `accepted-with-migration-fixtures`, `accepted-with-runtime-source-gates`, `accepted-with-recipe-fixtures`, `accepted-with-renderer-proof-fixtures`, `accepted-with-budget-gates`, `accepted-with-authoring-guides`, `accepted-with-migration-deprecation-plan`, `accepted-with-mission-handoff`, `ready`, `runtime-parity-pending`, `draft` oder `deprecated` |
| `owner` | ja | Owner-Rolle fuer Pflege, Audit und Release-Handoff |
| `workpackage` | ja | fuehrendes Workpackage oder `external-contract` fuer nicht-NFM-Artefakte |
| `phase` | ja | Roadmap-Phase oder Domain-Phase |
| `reportSchema` | ja | maschinenlesbares Report-Schema fuer Gate- oder Release-Ausgabe |
| `localGate` | ja | lokaler deterministischer Gate oder `docs-reference-gate` fuer reine Dokumentoberflaechen |
| `docsPath` | ja | stabiler Pfad zur fuehrenden Contract-Dokumentation |
| `sourceOfTruth` | ja | Mission-, Component-, RMT-, Kernel-, Security-, Supply-Chain- oder Release-Source |
| `domain` | ja | `native-first`, `component`, `rmt`, `kernel`, `security`, `supply-chain` oder `release-evidence` |
| `evidenceRole` | ja | `source-contract`, `runtime-contract`, `gate-plan`, `docs-surface`, `migration-plan`, `release-pack`, `final-handoff` oder `handoff` |
| `runtimeSurface` | nein | Runtime-, Component-, RMT-, Fabric- oder Tooling-Flaeche, falls vorhanden |
| `residual` | nein | expliziter Residual, falls Runtime-Parity, Docs oder Release-Evidence noch folgen |

## Statusmodell

| Status | Bedeutung | Erlaubte Claims |
|--------|-----------|-----------------|
| `accepted` | Contract ist abgeschlossen, gatebar und in der Registry inventarisiert | Release- und Audit-Reports duerfen ihn referenzieren |
| `accepted-with-residuals` | Contract ist akzeptiert, aber besitzt dokumentierte offene Runtime-, Docs- oder Evidence-Residuals | Reports muessen Residuals mit ausgeben |
| `accepted-with-prioritized-gaps` | Contract ist akzeptiert und priorisiert Product-/Runtime-Gaps statt sie als Produktclaims freizugeben | Reports duerfen Gap-Status und negative Claims referenzieren |
| `accepted-with-migration-fixtures` | Contract ist akzeptiert und besitzt positive, negative oder Handoff-Fixtures fuer spaetere Migration | Reports duerfen Decisions und Fixture-IDs referenzieren |
| `accepted-with-runtime-source-gates` | Contract ist akzeptiert und bindet Decisions an vorhandene Runtime-, Security- und Contract-Parity-Gates | Reports duerfen Decision- und Source-Gate-Abdeckung referenzieren |
| `accepted-with-recipe-fixtures` | Contract ist akzeptiert und besitzt Complete-UI-Recipe-Fixtures mit Smoke-, Golden- und Visual-Evidence-Plaenen | Reports duerfen Recipe-Abdeckung, Residuals und blocked Claims referenzieren |
| `accepted-with-renderer-proof-fixtures` | Contract ist akzeptiert und besitzt Renderer-, DOM-Descriptor-, Trusted-DOM-, Sink-Refusal- und Browser-Lab-Handoff-Proof-Fixtures | Reports duerfen Proof-Abdeckung, Sink-Refusal und Handoff-Residuals referenzieren |
| `accepted-with-budget-gates` | Contract ist akzeptiert und besitzt Performance-, Complexity-, Bundle-, Browser-Smoke- und Visual-Evidence-Budget-Gates | Reports duerfen Budget-Abdeckung, blocked Claims und Browser-Lab-Residuals referenzieren |
| `accepted-with-authoring-guides` | Contract ist akzeptiert und besitzt lokalisierte Docs-, Authoring-, RMT-Recipe- und Release-Review-Guides | Reports duerfen Docs-Discoverability, public Docs Coverage und blocked public Claims referenzieren |
| `accepted-with-migration-deprecation-plan` | Contract ist akzeptiert und besitzt Migration-, Deprecation-, Containment- und Guardrail-Entscheidungen fuer Vendor-, Legacy- und non-native Pfade | Reports duerfen SemVer-, Migration-Guide-, Gate- und Release-Entscheidungen referenzieren |
| `accepted-with-mission-handoff` | Contract ist akzeptiert und entscheidet Mission-Status, Residuals und naechste Epic-Grenze | Reports duerfen finalen Handoff-Status, Residuals und Next-Epic-Boundary referenzieren |
| `ready` | Contract ist startbar oder als Folgepaket vorbereitet | kein Produktclaim ohne Handoff |
| `runtime-parity-pending` | Contract existiert, aber WP-12 muss Runtime-Gegenstuecke pruefen | nur Contract-Claim, kein Runtime-Parity-Claim |
| `draft` | Contract ist noch nicht angenommen | nur Planungsreferenz |
| `deprecated` | Contract wird ersetzt oder abgeloest | Release-Handoff muss Nachfolger nennen |

## Discoverability-Regeln

- Jede Native-First-Contract-ID aus `NFM-WP-01` bis `NFM-WP-13` muss in der Registry existieren.
- `NFM-WP-14` ergaenzt die Registry mit `xtend.native-first.rmt-ui-primitive-gap.v1` und Gate `rmt-ui-primitive-gap`.
- `NFM-WP-15` ergaenzt die Registry mit `xtend.native-first.rmt-syntax-growth.v1` und Gate `rmt-syntax-growth`.
- `NFM-WP-16` ergaenzt die Registry mit `xtend.native-first.rmt-action-effect-data-resource-primitives.v1` und Gate `rmt-action-effect-data-resource-primitives`.
- `NFM-WP-17` ergaenzt die Registry mit `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1` und Gate `rmt-complete-ui-recipes`.
- `NFM-WP-18` ergaenzt die Registry mit `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1` und Gate `rmt-renderer-dom-descriptor-proofs`.
- `NFM-WP-19` ergaenzt die Registry mit `xtend.native-first.performance-complexity-bundle-budget-gates.v1` und Gate `native-first-budget-gates`.
- `NFM-WP-20` ergaenzt die Registry mit `xtend.native-first.docs-authoring-guides.v1` und Gate `native-first-docs-authoring`.
- `NFM-WP-21` ergaenzt die Registry mit `xtend.native-first.migration-deprecation-plan.v1` und Gate `native-first-migration-deprecation`.
- `NFM-WP-22` ergaenzt die Registry mit `xtend.native-first.mission-handoff.v1` und Gate `native-first-mission-handoff`.
- Jeder Registry-Eintrag muss einen stabilen Docs-Pfad besitzen, der im Repository existiert.
- Jeder `accepted`-Eintrag braucht Owner, Workpackage, Report-Schema und lokalen Gate.
- Component-, RMT-, Kernel-, Security-, Supply-Chain- und Release-Evidence-Contracts duerfen als `sourceOfTruth` verbunden werden, auch wenn sie ausserhalb der Native-First-Roadmap entstanden sind.
- Ein Registry-Eintrag darf keine Runtime-Manager-Rolle behaupten. Runtime-Discovery bleibt bei Component Manifest, RMT Surface Registry, Fabric oder spezifischen Runtime-Contracts.
- Release-Reports duerfen Contract-IDs referenzieren, aber keine nicht registrierten Contract-Claims synthetisieren.
- AI-Agenten duerfen Registry-Eintraege fuer Orientierung und Drift-Hinweise nutzen, muessen aber weiterhin die fuehrenden Contract-Dokumente lesen.

## Drift Report

`xtend.native-first.contract-registry-drift-report.v1` muss mindestens diese Drift-Klassen pruefbar machen:

| Drift-ID | Bedeutung | Pflichtreaktion |
|----------|-----------|-----------------|
| `drift-missing-contract-reference` | Contract wird in Mission, Roadmap, Package-Metadaten oder Gate genannt, fehlt aber in der Registry | Registry oder Referenz korrigieren |
| `drift-missing-required-field` | Registry-Eintrag hat kein Pflichtfeld | Gate blockiert |
| `drift-missing-docs-path` | `docsPath` zeigt auf kein Repository-Artefakt | Docs-Pfad oder Eintrag korrigieren |
| `drift-stale-workpackage-status` | Roadmap, Workpackage und Registry widersprechen sich | Owner-Handoff aktualisieren |
| `drift-stale-report-schema` | Report-Schema fehlt oder passt nicht zum Gate | Report-Schema aktualisieren |
| `drift-runtime-manager-claim` | Registry behauptet Runtime-Orchestrierung statt Indexrolle | Claim entfernen |

## Verbundene Contract-Domains

| Domain | Fuehrende Beispiele | Registry-Rolle |
|--------|---------------------|----------------|
| `native-first` | Mission, Radar, Adoption Gate, Dependency Diet, UI Capability, Overlay/Form/Framework/Market/Registry Contracts | fuehrende Mission- und Native-First-Governance |
| `component` | `development/XTend-Component-Contract-v2.md`, Component UX Contracts | owned Component Surface und Authoring-Regeln |
| `rmt` | `development/XTendRMT-vNext-*.md`, RMT Runtime- und Authoring-Contracts | RMT Syntax, Core Records, Scheduler und UI-Maximality |
| `kernel` | `development/XTendRMT-Kernel-Trust-Hardening-Contract.md` | Trust Boundary, Panic/Recovery, Policy-Parity |
| `security` | `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md` | DOM-, Sanitizing-, URL- und Import-Grenzen |
| `supply-chain` | `development/XTend-Supply-Chain-Gate-Plan.md`, Dependency Diet Policy | Dependency-, License-, Vulnerability- und Audit-Gates |
| `release-evidence` | RC1 Gate Matrix, release reports, dry-run evidence | Release Owner Evidence und Residual-Handoff |

## Source Gates

```bash
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json
node scripts/run_xtend_tests.js rmt-syntax-growth --json
node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives --json
node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
node scripts/run_xtend_tests.js native-first-mission-handoff --json
node scripts/run_xtend_tests.js native-first-evidence-pack --json
node scripts/run_xtend_tests.js native-first-market-pattern-parity --json
node scripts/run_xtend_tests.js native-first-framework-leverage --json
node scripts/run_xtend_tests.js native-first-form-navigation-media --json
node scripts/run_xtend_tests.js native-first-overlay-focus --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
```

## Nicht-Ziele

- keine neue Runtime-Registry fuer Components, RMT Surfaces, Routes oder Fabric Lanes
- keine automatische Freigabe von Produktclaims ohne Source-of-Truth-Contract
- keine externe Registry-Dependency
- kein Ersatz fuer WP-12 Contract-to-Runtime-Parity
- kein Import von Host-, Component- oder Browser-Typen in den RMT-Kernel

## Handoff

- `NFM-WP-12` hat `xtend.native-first.contract-registry-index.v1` genutzt, um Contract-to-Runtime-Parity gegen Kernel, Components, RMT und Supply Chain zu pruefen.
- `NFM-WP-13` hat `xtend.native-first.contract-registry-report.v1` als Grundlage fuer Audit Evidence Packs genutzt.
- `NFM-WP-14` hat `xtend.native-first.rmt-ui-primitive-gap.v1` in die Registry aufgenommen und RMT UI Primitive Gaps gatebar gemacht.
- `NFM-WP-15` hat `xtend.native-first.rmt-syntax-growth.v1` in die Registry aufgenommen und Syntax-Growth-Decisions gatebar gemacht.
- `NFM-WP-16` hat `xtend.native-first.rmt-action-effect-data-resource-primitives.v1` in die Registry aufgenommen und Action-/Effect-/DataSource-/Resource-Decisions gatebar gemacht.
- `NFM-WP-17` hat `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1` in die Registry aufgenommen und Complete-UI-Recipes gatebar gemacht.
- `NFM-WP-18` hat `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1` in die Registry aufgenommen und Renderer-/Trusted-DOM-Proofs gatebar gemacht.
- `NFM-WP-19` hat `xtend.native-first.performance-complexity-bundle-budget-gates.v1` in die Registry aufgenommen und Performance-, Complexity-, Bundle-, Browser-Smoke- und Visual-Evidence-Budgets gatebar gemacht.
- `NFM-WP-20` hat `xtend.native-first.docs-authoring-guides.v1` in die Registry aufgenommen und Native-First Authoring Guides gatebar gemacht.
- `NFM-WP-21` hat `xtend.native-first.migration-deprecation-plan.v1` in die Registry aufgenommen und Migration-/Deprecation-Entscheidungen gatebar gemacht.
- `NFM-WP-22` hat `xtend.native-first.mission-handoff.v1` in die Registry aufgenommen und Mission-Handoff, Residuals sowie naechste Epic-Grenze gatebar gemacht.

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Contract-ID, Status, Owner, Workpackage, Report-Schema, Gate und Docs-Pfad sind Pflichtfelder | erfuellt |
| Native-First-Contracts bis `NFM-WP-13` sind inventarisierbar | erfuellt |
| `NFM-WP-14` ist als RMT UI Primitive Gap Contract inventarisierbar | erfuellt |
| `NFM-WP-15` ist als RMT Syntax Growth Contract inventarisierbar | erfuellt |
| `NFM-WP-16` ist als RMT Action Effect Data Resource Primitives Contract inventarisierbar | erfuellt |
| `NFM-WP-17` ist als RMT Complete UI Recipe Fixtures Contract inventarisierbar | erfuellt |
| `NFM-WP-18` ist als RMT Renderer DOM Descriptor Proofs Contract inventarisierbar | erfuellt |
| `NFM-WP-19` ist als Native-First Budget Gates Contract inventarisierbar | erfuellt |
| `NFM-WP-20` ist als Native-First Docs Authoring Guides Contract inventarisierbar | erfuellt |
| `NFM-WP-21` ist als Native-First Migration Deprecation Plan Contract inventarisierbar | erfuellt |
| `NFM-WP-22` ist als Native-First Mission Handoff Contract inventarisierbar | erfuellt |
| Component, RMT, Kernel, Security, Supply Chain und Release Evidence sind angebunden | erfuellt |
| Drift-Klassen fuer fehlende und veraltete Referenzen sind definiert | erfuellt |
| Registry bleibt Index und keine Runtime-Manager-Flaeche | erfuellt |
