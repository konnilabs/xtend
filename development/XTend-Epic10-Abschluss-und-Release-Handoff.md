# XTend Epic 10 Abschluss und Release Handoff

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.epic10.release-handoff.v1`
- Report Contract: `xtend.epic10.release-handoff-report.v1`
- Workpackage: `WP-E10-16`
- Modul: `catalog/epic10-release-handoff.js`
- Suite: `tests/platform/epic10_release_handoff_suite.js`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic10-release-handoff --json`
- Package Script: `npm run test:epic10-release-handoff`

## Abschlussentscheidung

Epic 10 ist fachlich abgeschlossen. XTend besitzt nun eine TypeScript-first Component Platform, in der neue Komponenten ueber Component Contract v2, RMT Metadata, Fabric, Telemetry, Lanes, A11y, Performance und lokale Gates beschrieben werden.

Der Abschluss ist kein Publish-Trigger. Die Publish Boundary bleibt:

```text
private-until-release-owner-acceptance
```

`package.json` bleibt `private: true`, bis Release Owner, License-Entscheidung, Changelog, Migration Notes, Network-Gates und Release-Artefakte explizit akzeptiert sind.

## Kanonische Docs-Struktur

| Zweck | Dokument |
|-------|----------|
| Component Platform Gesamtbild | `docs/component-platform.md` |
| TypeScript-first Komponenten | `docs/typescript-components.md` |
| RMT-first XTend Apps | `docs/rmt-first-xtend-apps.md` |
| Component Lab und RMT Inspector | `docs/component-lab.md` |
| RMT-first Demo-App | `docs/rmt-first-demo-app.md` |
| Existing Component Metadata | `docs/existing-component-metadata.md` |
| Browser/A11y/Performance/Visual Gates | `docs/epic10-platform-gates.md` |
| Release Handoff und Migration Notes | `docs/epic10-release-handoff.md` |

Damit ist die offene Dokumentationsstruktur aus `WP-E10-15` entschieden.

## Fabric Boundary Entscheidung

Die kanonische Component-Fabric-Boundary lautet:

```text
adapter-injection-via-xtend-component-resolveFabricContext
```

Das bedeutet:

- Komponenten erhalten Fabric-, Lane- und Fiber-Kontext ueber den `xtend.component` Adapter.
- `resolveFabricContext(...)` bleibt die deterministische Boundary fuer RMT Schedule Records, RMT Component Metadata, Fabric Runtime Overrides, Component Static Contracts und Blueprint Defaults.
- `window.XTendFabric` bleibt Host-Komfort- und Enterprise-Integrationsebene, aber nicht der Component-Contract selbst.
- Modulimporte bleiben fuer lokale Tooling- und Testpfade erlaubt.
- Der RMT Kernel importiert weiterhin keine XTend-Typen.

Die Kernel Boundary bleibt:

```text
no-rmt-kernel-import-of-xtend-types
```

## Release Gates

Vor jedem Release Candidate muessen mindestens diese lokalen Gates gruenden:

```bash
node scripts/run_xtend_tests.js epic10-release-handoff --json
node scripts/run_xtend_tests.js epic10-platform-gates --json
node scripts/run_xtend_tests.js --json
npm run test:release:full
```

Fast PR bleibt:

```bash
npm run test:pr:report
```

Release-nahe Reports bleiben:

```bash
npm run test:release:full:report
npm run release:report
```

Conditional Network Gates bleiben ausserhalb des lokalen Default-Gates:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
```

## Migration Notes

Teams, die aus dem Stand vor Epic 10 migrieren, beachten:

- Neue Komponenten werden TypeScript-first unter `src/components/<tag>/` geplant.
- Browser-Runtime bleibt lokales ESM unter `components/`.
- `xtend-loader.js` bleibt kanonisch; `xtend-dev.js` ist Legacy Boundary.
- Vollstaendige XTend Apps werden ueber RMT-first App Authoring beschrieben.
- Existing JS Components werden zunaechst ueber Metadata Overlays migriert, nicht per Big-Bang-Rewrite.
- Fabric-Kontext laeuft ueber Adapter Injection.
- Performance- und A11y-Profile sind Pflichtbestandteile neuer Komponenten.
- CDN-Pfade sind kein Default-, Demo- oder Testpfad.

## Next-Wave Handoff

Die naechste Produktwelle sollte diese Punkte uebernehmen:

- Long-Tail Component Runtime Migration
- Remaining Performance Profile Authoring
- Component Catalog Completion
- Release Candidate Packaging
- XTendRMT Upstream DSL Polish

Diese Punkte sind bewusst kein Rest von Epic 10. Epic 10 hat die Plattformregeln, erste Komponentenlinie, RMT-first App-Pfade und Gate-Struktur geschaffen.
