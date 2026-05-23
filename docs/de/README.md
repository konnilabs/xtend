# XTend Dokumentation

Willkommen im XTend Developer Center. Diese Dokumentation ist fuer Entwickler
geschrieben, die XTend kennenlernen, lokal ausprobieren und eigene Apps bauen
wollen. Der empfohlene Pfad ist heute RMT-first: Die App Shell, Routen,
Surfaces, State, Actions, Events und UI-Lifecycle-Regeln werden in RMT vNext
authoriert; XTend Components, XRouter, Fabric und Host-Adapter materialisieren
diese Beschreibung im Browser.

Historische Planungs- und Release-Notizen sind im
[XTend Changelog](./changelog.md) gebuendelt. Die Artikel hier konzentrieren
sich auf produktives Arbeiten.

## Lernpfade

| Ziel | Einstieg |
| --- | --- |
| Erste lokale App starten | [Quick Start Guide](./quick-start-guide.md) |
| UI komplett in RMT schreiben | [RMT vNext Authoring Guide](./rmt-vnext-authoring.md) |
| RMT-Primitives mit XTend UI verbinden | [RMT vNext Component Primitives und XTend UI](./rmt-vnext-component-primitives.md) |
| RMT serverseitig vorhydrieren | [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md) und [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md) |
| RMT Architektur verstehen | [XTendRMT Developer Overview](./xtendrmt-overview.md) |
| Komponenten nutzen oder bauen | [Komponenten-Entwicklung](./components.md) und [Component Platform](./component-platform.md) |
| Loader, Manifest und Runtime anbinden | [XTend Loader](./xtend-loader.md), [Manifest-Format](./manifest.md), [API-Integration](./api.md) |
| Qualitaet, Security und Release-Signale verstehen | [Best Practices](./best-practices.md), [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md), [Supply-Chain Gates](./supply-chain-gates.md) |

## Start

Beginne mit einer lokalen Web-Component-App und erweitere sie dann zu einer
RMT-vNext-App-Shell:

- [Quick Start Guide](./quick-start-guide.md)
- [XTend Loader](./xtend-loader.md)
- [Manifest-Format](./manifest.md)
- [Core Migration Guide](./core-migration-guide.md)
- [Enterprise Adoption Guide](./enterprise-adoption.md)

XTend bleibt framework-neutral. Du kannst eine einfache HTML-Seite starten,
spaeter RMT fuer Shell und Routing ergaenzen und Host-spezifische Details in
Adapter verschieben.

## App Shell in RMT schreiben

RMT vNext ist die primaere Syntax fuer neue XTend Apps. Eine App kann State,
Selectors, DataSources, Actions, Events, Portals, Overlays, Resources,
Surfaces und Fabric-Lanes in einer `.rmt` Quelle beschreiben.

- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Component Primitives und XTend UI](./rmt-vnext-component-primitives.md)
- [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md)
- [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md)
- [XTendRMT Developer Overview](./xtendrmt-overview.md)
- [Native RMT Authoring](./xtendrmt-native-authoring.md)
- [XTendRMT App-DSL Reference](./xtendrmt-app-dsl.md)
- [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md)
- [Native RMT Migration Guide](./xtendrmt-migration-guide.md)
- [RMT-first XTend Apps](./rmt-first-xtend-apps.md)
- [RMT-first Demo-App](./rmt-first-demo-app.md)
- [RMT Lifecycle Demo](./rmt-lifecycle-demo.md)
- [RMT App Platform Migration Guide](./rmt-app-platform-migration-guide.md)
- [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md)
- [RMT vNext Release Handoff](./rmt-vnext-release-handoff.md)
- [RMT vNext Remote Surfaces](./rmt-vnext-remote-surfaces.md)
- [RMT vNext Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md)
- [RMT vNext Cross Surface Events](./rmt-vnext-cross-surface-events.md)
- [RMT vNext Enterprise MFE Handoff](./rmt-vnext-enterprise-mfe-handoff.md)

Die RMT-vNext-Referenzdemo liegt in `xtendrmt/rmt-vnext-reference-demo.rmt`;
der stabile Compiler-Output liegt in
`xtendrmt/rmt-vnext-reference-demo.core.json`.

## Tooling und Editor-DX

Der RMT Language Server ist die Source of Truth fuer Diagnostics, Completion,
Hover, Document Symbols, Definition und Code Actions. VS Code, JetBrains,
Neovim und Helix koennen den Server ueber stdio anbinden.

- [RMT Linter und AI-Agent Repair Report](./rmt-linter.md)
- [RMT Language Server und Editor Setup](./rmt-language-server.md)
- [RMT DSL Authoring Polish](./rmt-dsl-authoring-polish.md)
- [RMT Tooling Release Gates](./rmt-tooling-release-gates.md)

Wichtige lokale Befehle:

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
node tools/rmt-language-server/server.js
```

Der Tooling-Dokumentationscontract bleibt `xtend.rmt.tooling-docs.v1`; der
zugehoerige lokale Check ist
`node scripts/run_xtend_tests.js rmt-tooling-docs --json`.

## XTend Components nutzen

XTend Components sind Web Components, die von RMT-Surfaces gemountet,
hydriert und mit Events verbunden werden koennen. Nutze sie als UI-Bausteine,
waehrend RMT die App-Struktur und den Lifecycle beschreibt.

Die RMT vNext Component Capability Registry macht diese Grenze generisch: alle
42 public Manifest-Eintraege werden als Matrix erfasst, 38 renderbare UI-
Komponenten bekommen Component Contracts, RMT-Metadaten, Slots, Parts,
Attribute, Events und State-Bridges als gemeinsame Runtime-Faehigkeiten. Damit
werden RMT-Primitives stack-ergaenzend statt als zweite UI-Schicht umgesetzt.

- [RMT vNext Component Primitives und XTend UI](./rmt-vnext-component-primitives.md)
- [Komponenten-Entwicklung](./components.md)
- [Component Platform](./component-platform.md)
- [TypeScript Components](./typescript-components.md)
- [Component UX Authoring](./component-ux-authoring.md)
- [Component UX App Authoring](./component-ux-app-authoring.md)
- [Component UX Gates](./component-ux-gates.md)
- [Component Lab](./component-lab.md)
- [Component Long-Tail Migration](./component-long-tail-migration.md)
- [Existing Component Metadata](./existing-component-metadata.md)
- [Public Component Types](./public-component-types.md)
- [Component Catalog Coverage](./component-catalog-coverage.md)

Ausgewaehlte Komponenten:

- [x-router](./components/xrouter.md)
- [x-link](./components/xlink.md)
- [x-modal](./components/xmodal.md)
- [x-summary](./components/xsummary.md)
- [x-utils](./components/xutils.md)
- [x-button](./components/xbutton.md)
- [x-input](./components/xinput.md)
- [x-menu](./components/xmenu.md)

## Runtime, Fabric und Surfaces

Fabric fuehrt Runtime-Arbeit in Lanes und Fibers aus. RMT beschreibt die
Schedule- und Lifecycle-Absicht, der Host-Adapter verbindet diese Records mit
XTend Components, XRouter und Browser-DOM.

- [XTend-Fabric Runtime](./xtend-fabric.md)
- [XTend-Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md)
- [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md)
- [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md)
- [SurfaceManager RMT Authoring](./surface-manager-rmt-authoring.md)
- [SurfaceManager Controller](./surface-manager-controller.md)
- [SurfaceManager Window Runtime](./surface-manager-window-runtime.md)
- [SurfaceManager SidePanel Runtime](./surface-manager-side-panel-runtime.md)
- [SurfaceManager Workbench Fixture](./surface-manager-workbench-fixture.md)
- [SurfaceManager Native RMT Surfaces](./surface-manager-native-rmt-surfaces.md)
- [SurfaceManager Authoring Guide](./surface-manager-authoring-guide.md)
- [SurfaceManager Migration Guide](./surface-manager-migration-guide.md)
- [SurfaceManager Component Lab](./surface-manager-component-lab.md)
- [SurfaceManager Release Handoff](./surface-manager-release-handoff.md)
- [SurfaceManager Overlay Bridge](./surface-manager-overlay-bridge.md)
- [SurfaceManager Quality Gates](./surface-manager-quality-gates.md)
- [SurfaceManager Runtime Release Handoff](./surface-manager-runtime-release-handoff.md)

Die Docs-App selbst ist ein Beispiel fuer Shell-first-Denken:
[XTendRMT Parsedown Scheduling Pilot](./xtendrmt-parsedown-scheduling.md)
beschreibt, wie `docs/xtendrmt-parsedown-docs.rmt` die sichtbare Docs-Shell
fuehrt. Der Contract ist `xtend.docs.parsedown-rmt-pilot.v1`, der lokale Check
ist `npm run test:docs-rmt-pilot`.

## Quality und Security

Diese Artikel helfen, Apps produktionsnaeher zu bauen, ohne die RMT-Kernel-
Grenze zu verletzen:

- [Performance fuer Komponentenautoren](./performance.md)
- [Performance Measurements](./performance-measurements.md)
- [Performance Regression](./performance-regression.md)
- [Hydration Performance Closure](./hydration-performance-closure.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
- [Screenreader Signals](./screenreader-signals.md)
- [Motion und Contrast](./motion-contrast.md)
- [Manifest Import Policy](./manifest-import-policy.md)
- [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md)
- [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
- [Visual Browser Regression](./visual-browser-regression.md)
- [Visual Snapshot Automation](./visual-snapshot-automation.md)
- [Design Tokens](./design-tokens.md)
- [Drittanbieter Design Authoring](./third-party-design-authoring.md)

## Release- und Typing-Referenzen

Release- und Gate-Artikel bleiben verfuegbar, stehen aber nicht mehr im
Vordergrund des Lernpfads. Nutze sie, wenn du Release-Reife, Typing oder
Owner-Akzeptanz pruefst.

CI- und release-nahe Contract-Anker bleiben hier sichtbar:
`xtend.epic12.docs-adoption.v1` unter
[RC0 Adoption Guide](./rc0-adoption-guide.md) mit
`node scripts/run_xtend_tests.js epic12-docs-adoption --json`,
`xtend.epic13.rc1-migration-notes-semver.v1` unter
[RC1 Migration Notes](./rc1-migration-notes.md),
`xtend.epic13.release-report-pack-dry-run-evidence.v1` unter
[Release Report und Pack Dry Run Evidence](./release-report-pack-dry-run-evidence.md),
`xtend.epic13.rc1-gate-matrix-ci-handoff.v1` unter
[RC1 Gate Matrix und CI](./rc1-gate-matrix-ci-handoff.md) und
`xtend.epic13.conditional-network-evidence-ci.v1` unter
[Conditional Network Evidence CI](./conditional-network-evidence-ci.md).
Der Enterprise-Component-Flex-Handoff
`xtend.enterprise.component-flex-release-handoff.v1` bleibt unter
[Enterprise Component Flex Release Notes](./enterprise-component-flex-release-handoff.md)
referenziert. Die RMT-vNext-Enterprise-Linie markiert
`rmt-vnext-enterprise-mfe-ready` ueber
[RMT vNext Remote Surfaces](./rmt-vnext-remote-surfaces.md),
[RMT vNext Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md),
[RMT vNext Cross Surface Events](./rmt-vnext-cross-surface-events.md)
und [RMT vNext Enterprise MFE Handoff](./rmt-vnext-enterprise-mfe-handoff.md).
Surface-Runtime-Reife bleibt ueber
[SurfaceManager Overlay Bridge](./surface-manager-overlay-bridge.md),
[SurfaceManager Quality Gates](./surface-manager-quality-gates.md),
[SurfaceManager Runtime Release Handoff](./surface-manager-runtime-release-handoff.md)
und [Hydration Performance Closure](./hydration-performance-closure.md)
auffindbar.
Der RMT-Kernel-Handoff `xtend.rmt.kernel-migration-authoring-incident-handoff.v1`
bleibt ueber
[RMT Kernel Security Hardening Migration](./rmt-kernel-security-hardening-migration.md),
[RMT Kernel Trusted Output Authoring](./rmt-kernel-trusted-output-authoring.md)
und
[RMT Kernel Panic Recovery Incident Handoff](./rmt-kernel-panic-recovery-incident-handoff.md)
mit `node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json`
auffindbar.

- [XTend Changelog](./changelog.md)
- [RC0 Gate Matrix](./rc0-gate-matrix.md)
- [RC0 Adoption Guide](./rc0-adoption-guide.md)
- [RC0 Abschlussnotizen](./epic12-rc0-handoff.md)
- [RC1 Readiness](./rc1-readiness.md)
- [Release Owner Acceptance](./release-owner-acceptance.md)
- [RC1 Migration Notes](./rc1-migration-notes.md)
- [RC1 Gate Matrix und CI](./rc1-gate-matrix-ci-handoff.md)
- [Release Report und Pack Dry Run Evidence](./release-report-pack-dry-run-evidence.md)
- [Package Export Lock](./package-export-lock.md)
- [TypeExports](./type-exports.md)
- [XTend Loader Types](./xtend-loader-types.md)
- [XTend API Types](./xtend-api-types.md)
- [XTend RMT Types](./xtend-rmt-types.md)
- [XTend Policy Types](./xtend-policy-types.md)
- [XTend Builder Types](./xtend-builder-types.md)
- [XTend Catalog Types](./xtend-catalog-types.md)
- [XTend Vendor and Utility Types](./xtend-vendor-types.md)
- [Known Residual Triage](./known-residual-triage.md)
- [Conditional Network Evidence](./conditional-network-evidence.md)
- [Conditional Network Evidence CI](./conditional-network-evidence-ci.md)
- [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md)
- [Visual Owner Artifacts](./visual-owner-artifacts.md)
- [RMT Production Readiness](./rmt-production-readiness.md)
- [Docs RMT Production Hardening](./docs-rmt-production-hardening.md)
- [Epic 10 Platform Gates](./epic10-platform-gates.md)
- [Platform Release Notes](./epic10-release-handoff.md)
- [Enterprise UX Notes](./epic11-enterprise-ux-handoff.md)
- [Vendor Bugfixes](./epic18-vendor-bugfixes.md)
- [RMT App Platform Release Notes](./epic18-rmt-app-platform-release-handoff.md)
- [Enterprise Component Flex Release Notes](./enterprise-component-flex-release-handoff.md)
- [RMT vNext Enterprise MFE Handoff](./rmt-vnext-enterprise-mfe-handoff.md)
- [SurfaceManager Runtime Release Handoff](./surface-manager-runtime-release-handoff.md)

## Wenn du nur vier Seiten liest

1. [Quick Start Guide](./quick-start-guide.md)
2. [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
3. [RMT vNext Component Primitives und XTend UI](./rmt-vnext-component-primitives.md)
4. [Komponenten-Entwicklung](./components.md)
