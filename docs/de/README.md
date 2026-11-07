# XTend Developer Center

Willkommen im XTend Developer Center. Diese Dokumentation erklärt XTend für Entwickler, die Web Components, RMT App Shells, lokale Module und SSR in eigenen Produkten einsetzen möchten.

## Releaseziel: 0.9.0 in Vorbereitung

**RMTX und XTensions 2.0 gehören zum verbindlichen Umfang von 0.9.** Der [Releaseplan 0.9](./release-0-9.md) trennt implementierte Grundlagen und noch offene Feature-Abnahmen. Die bisherige RMT-RMT Classic-Sprache heißt [RMT Classic](./rmt-classic-contract.md). Die Paketversion ist bereits 0.9.0; die Freigabe setzt die Abnahme beider neuen Features voraus.

### Vorheriger Funktionsstand: 0.8.0

Der [0.8.0-Changelog](./changelog.md) bündelt Migrationen und neue Funktionen: eine gemeinsame Scheduler-Autorität, [Maraca FastPass und Abort Boundaries](./maraca-fastpass-abort-boundary.md), bedarfsgesteuerte Diagnosen, [Hydrangea JIT](./rmt-jit-hydrangea.md) und die [Seitenlaufzeit für Node und Laravel](./ssr-pages.md). Die Paketvoraussetzung ist Node >=24.

## Lernpfade

| Ziel | Start |
| --- | --- |
| Eine ESM-JavaScript- oder SSR-App bauen | [ESM-Registry](./esm-registry.md), [Quick Start Guide](./quick-start-guide.md) |
| Direkt mit HTML und JavaScript entwickeln | [XTend Classic](./xtend-classic.md), [Quick Start Guide](./quick-start-guide.md) |
| RMT verstehen | [XTendRMT Überblick](./xtendrmt-overview.md) |
| RMT Classic schreiben | [RMT Classic Authoring Guide](./rmt-vnext-authoring.md), [RMT AnimationEngine](./rmt-animation-engine.md), [RMT Reference](./rmt-reference.md), [RMT Classic Migration Notes](./rmt-vnext-migration-notes.md), [RMT Classic Releasevertrag](./rmt-vnext-migration-notes.md), [RMT Syntax Basics](./learn-rmt-syntax-basics.md) |
| Native-First XTend schreiben | [Native-First Authoring Guide](./native-first-authoring-guide.md), [Native-First RMT Recipes](./native-first-rmt-recipes.md), [Native-First Migration Guide](./native-first-migration-guide.md), [Native-First Release Review](./native-first-release-review.md) |
| Maraca App-Orchestrierung und PWA-Output bauen | [XTend Maraca](./xtend-maraca.md), [Maraca Orchestrierung](./xtend-maraca-orchestration.md) |
| Enterprise Remote Surfaces prüfen | [RMT Classic Remote Surfaces](./rmt-vnext-remote-surfaces.md), [RMT Classic Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md), [RMT Classic Cross Surface Events](./rmt-vnext-cross-surface-events.md), [RMT Classic Enterprise MFE Vertrag](./rmt-vnext-remote-surfaces.md) |
| Komponenten nutzen oder migrieren | [Komponenten-Entwicklung](./components.md), [Component Long-Tail Migration](./component-long-tail-migration.md) |
| Verwaltete Workspaces bauen | [SurfaceManager Authoring Guide](./surface-manager-authoring-guide.md), [SurfaceManager Controller](./surface-manager-controller.md), [SurfaceManager Runtime](./surface-manager-runtime.md), [SurfaceManager Migration Guide](./surface-manager-migration-guide.md) |
| Design Tokens prüfen | [Design Tokens](./design-tokens.md) |
| SSR anbinden | [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md), [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md) |
| Seiten, Formulare und Navigation mit SSR | [Gemeinsame Seitenlaufzeit für Node und Laravel](./ssr-pages.md) |
| Editor, Linting und VS Code | [RMT Linter](./rmt-linter.md), [RMT Language Server](./rmt-language-server.md), [RMT App Platform Tooling](./rmt-app-platform-tooling.md), [RMT Tooling Release Gates](./rmt-tooling-release-gates.md) |
| XTend-Apps instrumentieren und im Browser untersuchen | [XTend DEV API](./xtend-dev-api.md), [XTend Dev Surface](./xtend-dev-surface.md) |
| Release Surface prüfen | [Package Export Lock](./package-export-lock.md), [Type Exports](./type-exports.md), [XTend Loader Types](./xtend-loader-types.md), [XTend API Types](./xtend-api-types.md), [XTend Policy Types](./xtend-policy-types.md), [XTend Builder Types](./xtend-builder-types.md), [XTend Catalog Types](./xtend-catalog-types.md), [XTend Vendor Types](./xtend-vendor-types.md) |
| Release-Nachweise prüfen | [Release Readiness](./release-verification.md), Previous Release Bridge, [Release Acceptance](./release-verification.md), [Conditional Network Evidence](./conditional-network-evidence.md), [Conditional Network Evidence CI](./conditional-network-evidence-ci.md), [Release Report Pack Dry Run Evidence](./release-report-pack-dry-run-evidence.md), [Readiness CI Bundle](./release-verification.md) |

```txt
conditional network ci: xtend.epic13.conditional-network-evidence-ci.v1
release pack evidence: xtend.epic13.release-report-pack-dry-run-evidence.v1
previous release bridge: prior local release bridge
previous release bridge path: ./release-verification.md
```

## Produktmodell

XTend UI liefert die sichtbaren Web Components. XTendRMT beschreibt App Shells, State, Actions, Events, Resources, Surfaces, Hydration, Validation und Surface Transitions. Der RMT-Microkernel ist die gemeinsame Scheduler-Autorität. Fabric liefert Lane-Zuordnung, Work-Intents, Backpressure und Telemetrie ohne eigene Ausführungsqueue. Die [ESM-Registry](./esm-registry.md) stellt komfortable JavaScript-Aliase am Paket-Root für Browser-, Bundler- und SSR-Apps bereit. [XTend Classic](./xtend-classic.md) liefert direkt gepflegtes HTML und JavaScript über ein lokales Runtime-Manifest und `xtend-loader.js` aus. Maraca baut aus `.rmt`-Quellen loaderlose, kernel-orchestrierte ESM Apps mit Bundle-Report, Browser Bridges, mobilem Web App Manifest, optionalem PWA Service Worker und strikt prüfbaren Contracts. Alle Pfade teilen dieselben öffentlichen Runtime-Verträge.

## Delivery-Pfad wählen

Wähle die [ESM-Registry](./esm-registry.md) für vertraute Named Imports in einer JavaScript-, TypeScript-, Bundler- oder SSR-App. Wähle XTend Classic für buildlose HTML-first-Seiten, dynamische Kataloge und Progressive Enhancement. Wähle [XTend Maraca](./xtend-maraca.md), wenn RMT-Quelltext zu einem ausgelieferten App-Bundle mit Inline Registry, Kernel Scheduling, SSR/Hydration, Validation, Surface Transitions, mobilem Manifest, generiertem App-Shell-Service-Worker oder Build-Nachweisen werden soll. Die Projektgröße allein entscheidet nicht zwischen den Pfaden.

## RMT Classic Release Surface

Der RMT Classic Authoring Guide, die RMT Classic Migration Notes und der RMT Classic Releasevertrag gehören zusammen. Die Release-Spur verweist auf `demos/xtendrmt/fixtures/vnext-reference/source.rmt` und `demos/xtendrmt/fixtures/vnext-reference/generated/core.json`, damit ein Integrator Authoring-Beispiel, Compiler-Output und gate matrix im selben Review prüfen kann.

Für die englischen Prüfsuiten bleiben die öffentlichen Aliasnamen sichtbar: RMT Classic Release contract und RMT Classic Enterprise MFE contract.

## RMT Classic Enterprise Surface

RMT Classic Remote Surfaces, RMT Classic Enterprise Surface Registry, RMT Classic Cross Surface Events und der RMT Classic Enterprise MFE Vertrag beschreiben den Enterprise-MFE-Pfad bis `rmt-vnext-enterprise-mfe-ready`. Dieser Pfad bleibt netzwerkfrei prüfbar: Remote-Manifeste, Surface Registry, Cross-Surface Events und Browser-Smoke-Artefakte liegen als lokale Fixtures vor.

## Tooling

```bash
npm run dev:local
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json
xt maraca build app.rmt --out dist --web-app-manifest --json
xt maraca build app.rmt --out dist --pwa --json
node tools/rmt-language-server/server.js
node scripts/run_xtend_tests.js rmt-tooling-docs --json
node scripts/run_xtend_tests.js maraca-docs rmt-vnext-tooling rmt-editor-packaging type-exports-rmt --json
```

Der Tooling-Pfad verwendet das öffentliche Schema `xtend.rmt.tooling-docs.v1`. Für orchestrierte Maraca Apps sind außerdem `xtend.rmt.app-orchestration.v1`, `xtend.rmt.form-validation.v1` und `xtend.rmt.surface-transitions.v1` relevant.

## Nächste Schritte

- [Quick Start Guide](./quick-start-guide.md)
- [ESM-Registry](./esm-registry.md)
- [XTend Classic](./xtend-classic.md)
- [XTend Dev Surface](./xtend-dev-surface.md)
- [XTend DEV API](./xtend-dev-api.md)
- [XTend Maraca](./xtend-maraca.md)
- [Maraca Orchestrierung](./xtend-maraca-orchestration.md)
- [RMT Classic Authoring Guide](./rmt-vnext-authoring.md)
- [RMT AnimationEngine](./rmt-animation-engine.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Classic Migration Notes](./rmt-vnext-migration-notes.md)
- [RMT Classic Releasevertrag](./rmt-vnext-migration-notes.md)
- [Native-First Authoring Guide](./native-first-authoring-guide.md)
- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
- [Native-First Migration Guide](./native-first-migration-guide.md)
- [Native-First Release Review](./native-first-release-review.md)
- [RMT Classic Remote Surfaces](./rmt-vnext-remote-surfaces.md)
- [RMT Classic Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md)
- [RMT Classic Cross Surface Events](./rmt-vnext-cross-surface-events.md)
- [RMT Classic Enterprise MFE Vertrag](./rmt-vnext-remote-surfaces.md)
- [Best Practices](./best-practices.md)
- [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md)
- [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
- [Visual Snapshot Automation](./visual-snapshot-automation.md)
- [Parsedown mit RMT koordinieren](./xtendrmt-parsedown-scheduling.md)
- [Changelog](./changelog.md)
