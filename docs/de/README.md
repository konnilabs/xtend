# XTend Developer Center

Willkommen im XTend Developer Center. Diese Dokumentation erklärt XTend für Entwickler, die Web Components, RMT App Shells, lokale Module und SSR in eigenen Produkten einsetzen möchten.

## Lernpfade

| Ziel | Start |
| --- | --- |
| Erste lokale Seite | [Quick Start Guide](./quick-start-guide.md) |
| RMT verstehen | [XTendRMT Überblick](./xtendrmt-overview.md) |
| RMT vNext schreiben | [RMT vNext Authoring Guide](./rmt-vnext-authoring.md), [RMT Reference](./rmt-reference.md), [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md), [RMT vNext Releasevertrag](./rmt-vnext-release-handoff.md), [RMT Syntax Basics](./learn-rmt-syntax-basics.md) |
| Native-First XTend schreiben | [Native-First Authoring Guide](./native-first-authoring-guide.md), [Native-First RMT Recipes](./native-first-rmt-recipes.md), [Native-First Migration Guide](./native-first-migration-guide.md), [Native-First Release Review](./native-first-release-review.md) |
| Maraca App-Orchestrierung und PWA-Output bauen | [XTend Maraca](./xtend-maraca.md), [Maraca Orchestrierung](./xtend-maraca-orchestration.md) |
| Enterprise Remote Surfaces prüfen | [RMT vNext Remote Surfaces](./rmt-vnext-remote-surfaces.md), [RMT vNext Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md), [RMT vNext Cross Surface Events](./rmt-vnext-cross-surface-events.md), [RMT vNext Enterprise MFE Vertrag](./rmt-vnext-enterprise-mfe-handoff.md) |
| Komponenten nutzen | [Komponenten-Entwicklung](./components.md) |
| Design Tokens prüfen | [Design Tokens](./design-tokens.md) |
| SSR anbinden | [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md), [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md) |
| Editor, Linting und VS Code | [RMT Linter](./rmt-linter.md), [RMT Language Server](./rmt-language-server.md), [RMT App Platform Tooling](./rmt-app-platform-tooling.md) |
| Release Surface prüfen | [Package Export Lock](./package-export-lock.md), [Type Exports](./type-exports.md), [XTend Loader Types](./xtend-loader-types.md), [XTend API Types](./xtend-api-types.md), [XTend Policy Types](./xtend-policy-types.md), [XTend Builder Types](./xtend-builder-types.md), [XTend Catalog Types](./xtend-catalog-types.md), [XTend Vendor Types](./xtend-vendor-types.md) |
| Release-Nachweise prüfen | [Release Readiness](./rc1-readiness.md), Previous Release Bridge, [Release Acceptance](./release-owner-acceptance.md), [Conditional Network Evidence](./conditional-network-evidence.md), [Conditional Network Evidence CI](./conditional-network-evidence-ci.md), [Release Report Pack Dry Run Evidence](./release-report-pack-dry-run-evidence.md), [Readiness CI Bundle](./rc1-gate-matrix-ci-handoff.md) |

```txt
conditional network ci: xtend.epic13.conditional-network-evidence-ci.v1
release pack evidence: xtend.epic13.release-report-pack-dry-run-evidence.v1
previous release bridge: prior local release bridge
previous release bridge path: ./epic12-rc0-handoff.md
rc1 gate matrix: xtend.epic13.rc1-gate-matrix-ci-handoff.v1
```

## Produktmodell

XTend UI liefert die sichtbaren Web Components. XTendRMT beschreibt App Shells, State, Actions, Events, Resources, Surfaces, Hydration, Validation und Surface Transitions. Fabric koordiniert Runtime-Arbeit; der RMT Kernel ergänzt Scheduler-Lanes, Fibers und Telemetrie. Der Loader verbindet alles lokal und ohne CDN, wenn ein manifestbasierter Host gebraucht wird; Maraca baut aus `.rmt` Quellen loaderlose, kernel-orchestrierte ESM Apps mit Bundle-Report, Browser Bridges, mobilem Web App Manifest, optionalem PWA Service Worker und strikt prüfbaren Contracts.

## Maraca im Hauptpfad

Maraca ist der produktive App-Orchestrator im XTend-Stack. Verwende den Lernpfad, um RMT-Dokumente zu verstehen, und wechsle danach zu [XTend Maraca](./xtend-maraca.md), wenn aus dem Dokument ein ausgeliefertes App-Bundle mit Inline Registry, Kernel Scheduling, Hydration, Validation, Surface Transitions, mobilem Manifest oder generiertem App-Shell-Service-Worker werden soll. Die reale Orchestrierungsfixture liegt unter `products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt`; der Deep-Dive erklärt, welche Contracts der Build im Browser und im Report sichtbar macht.

## RMT vNext Release Surface

Der RMT vNext Authoring Guide, die RMT vNext Migration Notes und der RMT vNext Releasevertrag gehören zusammen. Die Release-Spur verweist auf `xtendrmt/rmt-vnext-reference-demo.rmt` und `xtendrmt/rmt-vnext-reference-demo.core.json`, damit ein Integrator Authoring-Beispiel, Compiler-Output und gate matrix im selben Review prüfen kann.

Für die englischen Prüfsuiten bleiben die öffentlichen Aliasnamen sichtbar: RMT vNext Release contract und RMT vNext Enterprise MFE contract.

## RMT vNext Enterprise Surface

RMT vNext Remote Surfaces, RMT vNext Enterprise Surface Registry, RMT vNext Cross Surface Events und der RMT vNext Enterprise MFE Vertrag beschreiben den Enterprise-MFE-Pfad bis `rmt-vnext-enterprise-mfe-ready`. Dieser Pfad bleibt netzwerkfrei prüfbar: Remote-Manifeste, Surface Registry, Cross-Surface Events und Browser-Smoke-Artefakte liegen als lokale Fixtures vor.

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
- [XTend Maraca](./xtend-maraca.md)
- [Maraca Orchestrierung](./xtend-maraca-orchestration.md)
- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Reference](./rmt-reference.md)
- [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md)
- [RMT vNext Releasevertrag](./rmt-vnext-release-handoff.md)
- [Native-First Authoring Guide](./native-first-authoring-guide.md)
- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
- [Native-First Migration Guide](./native-first-migration-guide.md)
- [Native-First Release Review](./native-first-release-review.md)
- [RMT vNext Remote Surfaces](./rmt-vnext-remote-surfaces.md)
- [RMT vNext Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md)
- [RMT vNext Cross Surface Events](./rmt-vnext-cross-surface-events.md)
- [RMT vNext Enterprise MFE Vertrag](./rmt-vnext-enterprise-mfe-handoff.md)
- [Best Practices](./best-practices.md)
- [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md)
- [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
- [Changelog](./changelog.md)

## Öffentlicher Vertrag

XTend Developer Center ist der öffentliche Orientierung-Vertrag für `docs/de/README.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: Einstiegsrouten, lokale Docs-Navigation und die kleinsten lauffähigen Befehle.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/README.md`
- `docs/menu.json`
- `package.json`
- `README.md`
- `docs/de/quick-start-guide.md`
- `docs/en/quick-start-guide.md`
- `components/manifest.json`
- `xtend-loader.js`

Namen:
- `docs/de/README.md`
- `docs/menu.json`
- `docs/de/quick-start-guide.md`
- `docs/en/quick-start-guide.md`
- `docs/de/xtend-maraca-orchestration.md`
- `docs/en/xtend-maraca-orchestration.md`
- `products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt`
- `components/manifest.json`
- `tools/rmt-language/vnext-compiler.js`
- `xtend-maraca/index.js`

Befehle:
- `npm run dev:local`
- `xt rmt lint app.rmt`
- `xt rmt lint app.rmt --json`
- `xt rmt lint app.rmt --agent`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
npm run dev:local
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn Einstiegspfade auseinanderlaufen, prüfe zuerst `docs/menu.json`, die lokalen Links und den Befehl im Prüfblock.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.

## SurfaceManager Evidence

- SurfaceManager Overlay Bridge: `docs/de/surface-manager-overlay-bridge.md`
- SurfaceManager Quality Gates: `docs/de/surface-manager-quality-gates.md`
- SurfaceManager Stack Policy: `docs/de/surface-manager-stack-policy.md`
