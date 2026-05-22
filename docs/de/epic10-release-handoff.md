# Epic 10 Release Handoff

Contract: `xtend.epic10.release-handoff.v1`

Dieses Dokument ist der offizielle Abschluss- und Handoff-Punkt fuer Epic 10.

## Status

Epic 10 ist abgeschlossen. Alle 16 Workpackages sind `completed`.

Der lokale Gate lautet:

```bash
node scripts/run_xtend_tests.js epic10-release-handoff --json
npm run test:epic10-release-handoff
```

## Kanonische Guides

| Thema | Guide |
|-------|-------|
| Component Platform | [Component Platform](./component-platform.md) |
| TypeScript-first Komponenten | [TypeScript Components](./typescript-components.md) |
| RMT-first XTend Apps | [RMT-first XTend Apps](./rmt-first-xtend-apps.md) |
| Component Lab | [Component Lab](./component-lab.md) |
| Existing Component Metadata | [Existing Component Metadata](./existing-component-metadata.md) |
| Platform Gates | [Epic 10 Platform Gates](./epic10-platform-gates.md) |
| Enterprise Adoption | [Enterprise Adoption](./enterprise-adoption.md) |

## Fabric Boundary

Die kanonische Component-Fabric-Boundary ist:

```text
adapter-injection-via-xtend-component-resolveFabricContext
```

Komponenten erhalten Fabric-, Lane- und Fiber-Kontext ueber den `xtend.component` Adapter. `window.XTendFabric` bleibt fuer Hosts und Enterprise-Integration nutzbar, ist aber nicht der Component-Contract. Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Migration Notes

Fuer Apps und Komponenten aus dem Stand vor Epic 10 gilt:

- Neue Komponenten werden TypeScript-first unter `src/components/<tag>/` geplant.
- Runtime-Artefakte bleiben lokale ES Modules unter `components/`.
- `xtend-loader.js` ist kanonisch; `xtend-dev.js` bleibt Legacy Boundary.
- Vollstaendige XTend Apps werden in RMT beschrieben.
- Existing JS Components werden zuerst ueber RMT/Fabric Metadata Overlays angebunden.
- Big-Bang-TypeScript-Migrationen sind nicht Teil des Zielpfads.
- Performance-, A11y- und Visual-Gates sind Teil der Component-Definition.
- CDN-Pfade bleiben aus Default-, Demo- und Testpfaden entfernt.

## Release Candidate Gate

Vor einem Release Candidate:

```bash
npm run test:pr:report
npm run test:release:full:report
npm run release:report
npm run pack:dry-run
```

Conditional Network Gates:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
```

Publishing bleibt blockiert, bis ein Release Owner `private-until-release-owner-acceptance` explizit freigibt.

## Next-Wave Handoff

Die naechste Produktwelle sollte folgende Themen aufnehmen:

- Long-Tail Component Runtime Migration
- Remaining Performance Profile Authoring
- Component Catalog Completion
- Release Candidate Packaging
- XTendRMT Upstream DSL Polish
