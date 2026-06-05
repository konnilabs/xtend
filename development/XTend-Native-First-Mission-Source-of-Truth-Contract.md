# XTend Native-First Mission Source of Truth Contract

- Status: `accepted by NFM-WP-01`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-01-Mission-Source-of-Truth-und-Native-First-Decision-Matrix-einfrieren.md`
- Contract: `xtend.native-first.mission-source-of-truth.v1`
- Decision Matrix: `xtend.native-first.decision-matrix.v1`
- Boundary: `browser-native-first-before-framework-abstraction`
- Boundary: `avoid-runtime-dependency-by-default`
- Boundary: `rmt-kernel-remains-host-neutral`
- Boundary: `contracts-are-auditable-product-surface`
- Zielzustand: `native-first-mission-baseline-accepted`
- Folgepakete: `NFM-WP-02`, `NFM-WP-03`, `NFM-WP-04`, `NFM-WP-05`, `NFM-WP-06`, `NFM-WP-07`, `NFM-WP-08`, `NFM-WP-09`, `NFM-WP-10`, `NFM-WP-11`, `NFM-WP-12`, `NFM-WP-13`, `NFM-WP-14`, `NFM-WP-15`, `NFM-WP-16`, `NFM-WP-17`, `NFM-WP-18`, `NFM-WP-19`, `NFM-WP-20`, `NFM-WP-21`, `NFM-WP-22`
- Browser Primitive Radar: `xtend.native-first.browser-primitive-radar.v1`
- Adoption Gate: `xtend.native-first.primitive-adoption-gate.v1`
- Dependency Diet Policy: `xtend.native-first.dependency-diet-policy.v1`
- Vendor Replacement Contract: `xtend.native-first.vendor-legacy-replacement.v1`
- UI Primitive Capability Contract: `xtend.native-first.ui-primitive-capability.v1`
- Overlay Focus Hardening Contract: `xtend.native-first.overlay-focus-hardening.v1`
- Form Navigation Media Hardening Contract: `xtend.native-first.form-navigation-media-hardening.v1`
- Framework Leverage Layer Contract: `xtend.native-first.framework-leverage-layer.v1`
- Market Pattern Parity Contract: `xtend.native-first.market-pattern-parity.v1`
- Contract Registry Contract: `xtend.native-first.contract-registry.v1`
- Contract Runtime Parity Contract: `xtend.native-first.contract-runtime-parity.v1`
- Audit Evidence Pack Contract: `xtend.native-first.audit-evidence-pack.v1`
- RMT UI Primitive Gap Contract: `xtend.native-first.rmt-ui-primitive-gap.v1`
- RMT Syntax Growth Contract: `xtend.native-first.rmt-syntax-growth.v1`
- RMT Action Effect Data Resource Primitives Contract: `xtend.native-first.rmt-action-effect-data-resource-primitives.v1`
- RMT Complete UI Recipe Fixtures Contract: `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`
- RMT Renderer DOM Descriptor Proofs Contract: `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1`
- Performance Complexity Bundle Budget Gates Contract: `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- Native-First Docs Authoring Guides Contract: `xtend.native-first.docs-authoring-guides.v1`
- Migration Deprecation Plan Contract: `xtend.native-first.migration-deprecation-plan.v1`
- Mission Handoff Contract: `xtend.native-first.mission-handoff.v1`

## Zweck

Dieses Dokument ist die Source of Truth fuer die Native-First-Mission von XTend nach der XTend Developer Conference. Es friert die Produkt- und Architekturentscheidung ein, bevor Browser-Primitive, Dependencies, Komponenten, Contracts oder RMT-Syntax in Folgepaketen bewertet werden.

Die wichtigste Entscheidung:

- XTend optimiert zuerst fuer browser-native Primitives.
- XTend baut eigene Framework-Komponenten und Framework-Hebel, wo native Primitives allein nicht ausreichen.
- XTend vermeidet Runtime-Dependencies als Default.
- XTend macht Security, Auditierbarkeit und Contracts zu sichtbaren Produktoberflaechen.
- XTend erweitert RMT so, dass vollstaendige UIs deklarativ authorbar werden, ohne den RMT-Kernel an Host- oder Framework-Runtimes zu koppeln.

## Mission Statement

XTend ist ein browsernahes, contract-sicheres und RMT-orchestriertes UI-Framework. Der Kernwert liegt nicht in einer moeglichst grossen eigenen Runtime, sondern in der gezielten Orchestrierung nativer Browser-Faehigkeiten, eigener XTend-Primitives, Scheduler-Lanes, Trust Boundaries und auditierbarer Contracts.

XTend soll marktuebliche UI-Framework-Faehigkeiten abbilden koennen, ohne deren Abhaengigkeitsmodell oder Host-Kopplung zum Default zu machen.

## Mission Pillars

| Pillar | Produktentscheidung | Umsetzungspfad |
|--------|---------------------|----------------|
| `native-primitives-first` | Browser-native Primitives werden zuerst geprueft. | Primitive Radar, Adoption ADR, Browser-Lab-Evidence |
| `owned-framework-leverage` | Eigene Komponenten und Adapter sind bevorzugte Framework-Hebel. | Component Contract v2, Fabric, RMT Metadata, Design Tokens |
| `dependency-minimalism` | Runtime-Dependencies sind Ausnahme, nicht Default. | Dependency Diet Policy, Exit-Plaene, Supply-Chain-Evidence |
| `contract-auditability` | Contracts sind Produkt- und Auditoberflaeche. | Contract Registry, Runtime-Parity Gate, Evidence Pack |
| `rmt-ui-maximality` | RMT soll praktisch jede UI deklarativ ausdruecken koennen. | RMT Gap Analysis, Syntax Growth, Complete-UI-Fixtures |
| `kernel-neutrality` | Der RMT-Kernel bleibt host- und framework-neutral. | Adapter-Grenzen, Core Records, Source Maps, Diagnostics |

## Native-First Precedence

Bei neuen UI-, Runtime- oder Authoring-Faehigkeiten gilt diese Reihenfolge:

| Rang | Option | Wann verwenden |
|------|--------|----------------|
| `1` | Browser-native Primitive direkt nutzen | Primitive ist stabil, sicher, performant und ausreichend testbar |
| `2` | Browser-native Primitive als XTend-Primitive wrappen | Primitive braucht Contracts, Fallbacks, Scheduler- oder Security-Anbindung |
| `3` | eigenes XTend-Primitive bauen | Native Primitive fehlt, ist unzureichend oder wuerde XTend-Komplexitaet nicht reduzieren |
| `4` | Build-, Dev- oder Test-Dependency nutzen | Dependency beruehrt nicht den Runtime-Default und ist auditierbar |
| `5` | Runtime-Dependency zulassen | nur mit Capability-Gap, Audit-Nutzen, Owner, Exit-Plan und Review-Datum |

Diese Reihenfolge ist kein starres Verbot. Sie ist eine Beweislastregel: Wer eine spaetere Option waehlt, muss begruenden, warum alle frueheren Optionen nicht reichen.

## Decision Matrix

Jede Primitive-, Dependency-, Component-, Contract- oder RMT-Erweiterung wird gegen diese Fragen geprueft:

| Frage | Erwartung |
|-------|-----------|
| Browser-Native | Gibt es ein natives Primitive oder einen absehbaren Browser-Standard? |
| Evergreen Compatibility | Ist das Primitive fuer den Zielbrowser-Satz stabil genug? |
| Performance | Reduziert oder begrenzt die Entscheidung Mount-, Hydration-, Interaction- oder Bundle-Kosten? |
| Complexity | Entfernt die Entscheidung Framework-Code oder fuehrt sie neue Abstraktionslast ein? |
| Security | Passt die Entscheidung zu Trusted DOM, Kernel Trust und Supply-Chain-Gates? |
| A11y | Kann das Verhalten browsernah, keyboard-sicher und screenreader-sicher geprueft werden? |
| RMT Authoring | Kann die Faehigkeit als RMT Core Record, Syntax oder Adapter-Contract ausgedrueckt werden? |
| Contract Parity | Gibt es Contract-, Runtime-, Test-, Docs- und Report-Gegenstuecke? |
| Exit Plan | Kann die Entscheidung spaeter migriert, ersetzt oder deaktiviert werden? |

## Decision Outcomes

| Outcome | Bedeutung | Erlaubte Folge |
|---------|-----------|----------------|
| `adopt-native` | Native Primitive ist ausreichend und reduziert XTend-Komplexitaet. | direkte Nutzung oder duenne Utility-Schicht |
| `wrap-as-xtend-primitive` | Native Primitive ist wertvoll, braucht aber XTend-Grenzen. | owned Primitive mit Contract, Fallback und Gate |
| `build-owned-primitive` | Es gibt kein passendes natives Primitive. | XTend-eigene Komponente oder Runtime-Faehigkeit |
| `keep-existing-owned-path` | Bestehende XTend-Loesung ist besser als Umstieg. | bestehender Pfad bleibt, Review-Datum setzen |
| `defer-with-watch` | Primitive ist relevant, aber noch nicht produktreif. | Primitive Radar und erneutes Review |
| `allow-runtime-dependency-exception` | Runtime-Dependency ist begruendet unvermeidbar. | Owner-Signoff, Exit-Plan, Audit Evidence |
| `reject-for-now` | Risiko, Kosten oder Kopplung ueberwiegen. | kein Produktpfad, Begruendung dokumentieren |

## Dependency Default

Der Dependency-Default fuer XTend lautet:

```text
avoid-runtime-dependency
```

Eine neue Runtime-Dependency ist nur erlaubt, wenn mindestens diese Fakten dokumentiert sind:

- `dependencyName`
- `runtimeSurface`
- `capabilityGap`
- `whyNativeInsufficient`
- `whyOwnedPrimitiveInsufficient`
- `securityImpact`
- `supplyChainImpact`
- `bundleImpact`
- `owner`
- `reviewDate`
- `exitPlan`

Dev-, Test-, Build- und Docs-Dependencies werden getrennt bewertet. Eine akzeptable Dev-Dependency rechtfertigt keine Runtime-Dependency.

## RMT Maximality Boundary

RMT darf wachsen, wenn die Erweiterung:

- deklarativ bleibt
- deterministisch in Core Records kompiliert
- Source Maps und Diagnostics besitzt
- keine freie Runtime-Ausfuehrung oeffnet
- keine Host-Typen in den Kernel zieht
- Trust Boundaries und Sanitizing-Policies ausdruecken kann
- Migration und Legacy-Kompatibilitaet explizit behandelt

RMT soll UI-Erzeugung, Composition, Layout, Events, State, Actions, Effects, Data Sources, Resources, Surfaces, Scheduling und Degradation authorbar machen. Das Ziel ist maximale Ausdruckskraft, nicht imperative Vollstaendigkeit.

## Contract Surface

Contracts sind in XTend kein internes Beiwerk. Sie sind sichtbare Produktoberflaeche fuer:

- Component-Autoren
- App-Autoren
- Security Reviews
- Release Owner
- AI-Agenten
- CI und lokale Gates
- Enterprise Adoption

Ein Contract ist erst belastbar, wenn er mindestens diese Beziehungen benennen kann:

- Workpackage oder Roadmap
- Status
- Owner oder Owner-Rolle
- Boundary
- Runtime- oder Artefakt-Gegenstueck
- Test- oder Gate-Gegenstueck
- Docs- oder Handoff-Pfad
- Report- oder Evidence-Pfad, wenn release-relevant

## Source-of-Truth

| Artefaktklasse | Rolle |
|----------------|-------|
| `development/ROADMAP-XTend-Native-First-Framework-Mission.md` | Roadmap, Phasen, Workpackages und Mission-Handoff |
| `development/XTend-Native-First-Mission-Source-of-Truth-Contract.md` | fuehrender Mission- und Decision-Matrix-Contract |
| `development/XTend-Native-First-Contract-Registry.md` | maschinenlesbarer Contract-Index fuer Contract-ID, Owner, Workpackage, Gate, Report-Schema und Docs-Pfad |
| `development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md` | Parity-Matrix fuer Contract-, Runtime-, Test-, Docs-, Report- und Residual-Gegenstuecke |
| `development/XTend-Native-First-Audit-Evidence-Pack.md` | Release-Owner-Ansicht auf Contract-, Security-, Dependency-, Conditional-Network- und Redaction-Evidence |
| `development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md` | RMT UI Primitive Gap Matrix fuer App-Authoring ohne manuelle Host-Shell |
| `development/XTend-Native-First-RMT-UI-Primitive-Gap-Contract.md` | Contract fuer Gap-Klassen, Coverage Status, blockierte Claims und Folgepakete |
| `development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md` | RMT Syntax Growth Entscheidungen fuer Layout, Surface, Component Composition, Collection, Command und Bypass-Rejection |
| `development/XTend-Native-First-RMT-Syntax-Growth-Contract.md` | Contract fuer Syntax-Growth-Regeln, Core-Record-, Source-Map-, Diagnostics- und Migration-Fixture-Pflichten |
| `tests/fixtures/native-first/rmt-syntax-growth-migration-fixtures.json` | positive, negative und Handoff-Migration-Fixtures fuer WP-15 |
| `development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md` | RMT Action-, Effect-, DataSource- und Resource-Primitive-Entscheidungen fuer WP-16 |
| `development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Contract.md` | Contract fuer deklarative Action-/Resource-Authoring-Regeln, Side-Effect-Policies und Runtime-Source-Gates |
| `tests/fixtures/native-first/rmt-action-effect-data-resource-fixtures.json` | positive, negative und Handoff-Fixtures fuer WP-16 |
| `development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md` | Complete-UI-Recipe-Fixtures fuer App Shell, Dashboard, Form, Overlay, Navigation, Data Display, Command/Search, Media und Docs Flow |
| `development/XTend-Native-First-RMT-Complete-UI-Recipe-Fixtures-Contract.md` | Contract fuer Recipe-Felder, Smoke-, Golden- und Visual-Evidence-Plaene sowie blocked Claims |
| `tests/fixtures/native-first/rmt-complete-ui-recipe-fixtures.json` | maschinenlesbare Recipe-Fixtures fuer WP-17 |
| `development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Matrix.md` | Renderer-, DOM-Descriptor-, Trusted-DOM-, Attribute-/URL-/Property-, Event- und Browser-Lab-Handoff-Proofs |
| `development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Contract.md` | Contract fuer Proof-Felder, Sink-Refusal, Trust-Boundaries und Browser-Lab-Handoff |
| `tests/fixtures/native-first/rmt-renderer-dom-descriptor-proof-fixtures.json` | maschinenlesbare Renderer-Proof-Fixtures fuer WP-18 |
| `development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Matrix.md` | Performance-, Complexity-, Bundle-, Browser-Smoke- und Visual-Evidence-Budget-Gates fuer WP-19 |
| `development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md` | Contract fuer Budget-Felder, Thresholds, Source Gates, blocked Claims und Browser-Lab-Residuals |
| `tests/fixtures/native-first/native-first-budget-gate-fixtures.json` | maschinenlesbare Budget-Gate-Fixtures fuer WP-19 |
| `development/XTend-Native-First-Docs-Authoring-Guides-Matrix.md` | Docs Authoring Guide Matrix fuer Native-First Leitfaden, RMT Recipes und Release Review |
| `development/XTend-Native-First-Docs-Authoring-Guides-Contract.md` | Contract fuer Guide-Felder, Public-Docs-Regeln, Source Gates und blocked public Claims |
| `docs/de/native-first-authoring-guide.md` | oeffentlicher Native-First Authoring Guide fuer Component- und App-Autoren |
| `docs/en/native-first-authoring-guide.md` | public Native-First Authoring Guide for component and app authors |
| `docs/de/native-first-rmt-recipes.md` | oeffentliche RMT-first Recipe-Anleitung fuer vollstaendige UIs |
| `docs/en/native-first-rmt-recipes.md` | public RMT-first recipe guide for complete UIs |
| `docs/de/native-first-release-review.md` | oeffentliche Native-First Release-Review-Pruefung |
| `docs/en/native-first-release-review.md` | public Native-First release-review check |
| `development/XTend-Native-First-Migration-Deprecation-Plan-Matrix.md` | Migration-, Deprecation-, Containment- und Guardrail-Plan fuer Vendor-, Legacy- und non-native Pfade |
| `development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md` | Contract fuer Migration-Felder, SemVer-Policy, Release-Entscheidung, Source Gates und No-Silent-Deprecation |
| `tests/fixtures/native-first/native-first-migration-deprecation-fixtures.json` | maschinenlesbare Migration- und Deprecation-Fixtures fuer WP-21 |
| `docs/de/native-first-migration-guide.md` | oeffentlicher Migration Guide fuer vendor-backed, legacy und non-native Pfade |
| `docs/en/native-first-migration-guide.md` | public migration guide for vendor-backed, legacy and non-native paths |
| `development/XTend-Native-First-Mission-Handoff-Decision-Matrix.md` | finale Mission-Handoff-Entscheidungen, Residuals und naechste Epic-Grenze `rmt-ui-maximality-and-owned-component-surface-hardening` |
| `development/XTend-Native-First-Mission-Handoff-Contract.md` | Contract fuer Owner-Handoff, Release-Status, Residual-Regeln und Next-Epic-Boundary |
| `tests/fixtures/native-first/native-first-mission-handoff-fixtures.json` | maschinenlesbare Handoff-Fixtures fuer WP-22 |
| `development/NFM-WP-*.md` | einzelne Workpackage-Abnahmen und Folgeentscheidungen |
| `development/XTend-Component-Contract-v2.md` | fuehrender Component-Contract fuer owned Framework-Primitives |
| `development/XTendRMT-vNext-*.md` | fuehrende RMT-vNext-Contracts fuer Syntax, Core, Runtime- und Security-Domains |
| `development/XTendRMT-Kernel-Trust-Hardening-Contract.md` | fuehrender Kernel-Trust- und Runtime-Security-Contract |
| `development/XTend-Supply-Chain-Gate-Plan.md` | fuehrende Supply-Chain- und Dependency-Gate-Basis |
| `tests/rmt/` | RMT Contract-, Fixture-, Golden- und Authoring-Gates |
| `tests/references/` | Referenzpfad- und Dokumentations-Gates |
| `docs/` | produktive Authoring-, Migration- und Adoption-Oberflaeche |

## Non-Goals

Nicht Ziel dieser Mission:

- ein externes UI-Framework als Default-Architektur einfuehren
- fremde Framework-APIs als XTend-Produktvertrag kopieren
- RMT zu einer freien imperativen Programmiersprache machen
- Inline-JavaScript, Eval oder unsichere HTML-Sinks als Authoring-Komfort erlauben
- Runtime-Dependencies ohne Exit-Plan und Supply-Chain-Evidence akzeptieren
- Browser-native Primitives ohne Security-, A11y-, Performance- und RMT-Pruefung uebernehmen
- bestehende Komponenten in einer Big-Bang-Migration ersetzen
- den RMT-Kernel an XTend-Komponenten, Host-Runtimes oder Browser-spezifische Typen koppeln

## Folgepaket-Handoff

| Folgepaket | Startstatus nach NFM-WP-01 | Handoff |
|------------|----------------------------|---------|
| `NFM-WP-02` | completed | `development/XTend-Native-First-Browser-Primitive-Radar.md` fuehrt Radar-Kategorien, Review-Kadenz, Radar-IDs und Entscheidungsergebnisse |
| `NFM-WP-03` | completed | Adoption Gate und ADR-Template konkretisieren die Decision Matrix unter `development/XTend-Native-Primitive-Adoption-Gate-Contract.md` |
| `NFM-WP-04` | completed | `development/XTend-Native-First-Dependency-Diet-Policy-Contract.md` finalisiert `avoid-runtime-dependency` mit Dependency-Klassen und Exit-Plan-Matrix |
| `NFM-WP-05` | completed | `development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md` priorisiert Vendor- und Legacy-Kandidaten und ist durch `NFM-WP-04` final klassifiziert |
| `NFM-WP-06` | completed | `development/XTend-Native-First-UI-Primitive-Capability-Matrix.md` klassifiziert owned, native-backed, vendor-backed, contract-only, legacy und missing Capabilities |
| `NFM-WP-07` | completed | `development/XTend-Native-First-Overlay-Focus-Hardening-Contract.md` und Matrix haerten `NFM-OP-01` fuer Overlay, Focus, Inert, Keyboard und Surface Stack |
| `NFM-WP-08` | completed | `development/XTend-Native-First-Form-Navigation-Media-Hardening-Matrix.md` haertet `NFM-OP-02` und `NFM-OP-04` fuer Forms, Navigation, list-like Display und Media; Data Display sowie Command/Autocomplete bleiben Missing Claims |
| `NFM-WP-09` | completed | `development/XTend-Native-First-Framework-Leverage-Layer-Matrix.md` schneidet `NFM-OP-05` fuer Theme, State, Events, Slots, Scheduler und Diagnostics als owned Framework-Hebel-Layer |
| `NFM-WP-10` | completed | `development/XTend-Native-First-Market-Pattern-Parity-Matrix.md` uebersetzt Marktpatterns in erlaubte XTend-Claims und blockierte Framework-/Data-/Command-Claims |
| `NFM-WP-11` | completed | `development/XTend-Native-First-Contract-Registry.md` inventarisiert Contract-IDs, Owner, Workpackages, Gates, Report-Schemas und Docs-Pfade |
| `NFM-WP-12` | completed | `development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md` mappt Contract-Claims auf Runtime-, Test-, Docs- und Report-Gegenstuecke |
| `NFM-WP-13` | completed | `development/XTend-Native-First-Audit-Evidence-Pack.md` buendelt Registry-Reports, Parity-Residuals, Security, Supply Chain, Dependency Diet, Conditional Network und Redaction |
| `NFM-WP-14` | completed | `development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md` quantifiziert `NFM-MP-01` bis `NFM-MP-12` und trennt authorable, residual, contract-only, syntax-growth und owned-primitive Gaps |
| `NFM-WP-15` | completed | `development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md` entscheidet Syntax Growth, Core-Record-only, Owned-Primitive-Deferrals, WP-16-Handoff und Reject-Bypass-Fixtures |
| `NFM-WP-16` | completed | `development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md` schneidet Action-, Effect-, DataSource- und Resource-Primitives aus `NFM-RSG-05`, `NFM-RSG-06`, `NFM-RUG-03`, `NFM-RUG-05`, `NFM-RUG-06` und `NFM-RUG-12` |
| `NFM-WP-17` | completed | `development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md` beweist Complete-UI-Recipes mit Smoke-, Golden- und Visual-Evidence-Plaenen |
| `NFM-WP-18` | completed | `development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Matrix.md` beweist Renderer-, DOM-Descriptor-, Trusted-DOM-, Portal-, Overlay- und Bypass-Proofs gegen Recipe-Evidence |
| `NFM-WP-19` | completed | `development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Matrix.md` definiert Performance-, Complexity-, Bundle-, Browser-Smoke- und Visual-Evidence-Budgets gegen Recipe- und Renderer-Evidence |
| `NFM-WP-20` | completed | `development/XTend-Native-First-Docs-Authoring-Guides-Matrix.md` und lokalisierte Docs erklaeren DOM Descriptor Default, Trusted-DOM-Boundary, Budget-Pflichten, RMT Recipes und verbotene Sink-Regeln |
| `NFM-WP-21` | completed | `development/XTend-Native-First-Migration-Deprecation-Plan-Matrix.md` plant Migration und Deprecation mit Alternative, Migration Guide, Gate, SemVer-Policy und Release-Entscheidung |
| `NFM-WP-22` | completed | Mission-Handoff setzt Status `accepted-with-residuals` und naechste Epic-Grenze `rmt-ui-maximality-and-owned-component-surface-hardening` |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Mission ist eindeutig formuliert | erfuellt |
| Native-First-Prioritaet ist als Beweislastregel dokumentiert | erfuellt |
| Dependency-Default ist festgelegt | erfuellt: `avoid-runtime-dependency` |
| RMT-Maximalitaet ist von imperativer Sprache abgegrenzt | erfuellt |
| Contracts sind als Produkt- und Auditoberflaeche definiert | erfuellt |
| Non-Goals sind explizit | erfuellt |
| Folgepakete haben klare Handoffs | erfuellt |
