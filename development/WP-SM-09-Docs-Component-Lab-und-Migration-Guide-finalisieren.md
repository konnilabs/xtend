# WP-SM-09 - Docs, Component Lab und Migration Guide finalisieren

- Status: completed
- Contract: `xtend.surface.release-handoff.v1`
- Component Lab Fixture: `xtend.surface.component-lab-fixture.v1`
- Local Gate: `node scripts/run_xtend_tests.js surface-release-handoff --json`

## Ziel

`WP-SM-09` schliesst die SurfaceManager-Planlinie ab, ohne eine neue Runtime-Schicht einzufuehren. Die Arbeit macht den SurfaceManager fuer App-Shell-Authoring nutzbar, dokumentiert die Migration von Component-Metadata zu nativen `surfaces[*]` Records und legt eine Surface-spezifische Component-Lab-Fixture ab.

## Erledigt

- `development/XTend-SurfaceManager-Release-Handoff-Contract.md` definiert den Abschlusscontract `xtend.surface.release-handoff.v1`.
- `catalog/surface-manager-release-handoff.js` beschreibt Authoring-Modi, Component-Lab-Panels, Migrationsschritte, Gates und Release Boundary.
- `tests/fixtures/rmt-surface-manager-component-lab.rmt` zeigt eine SurfaceManager-Lab-Shell mit `x-surface-manager`, zwei Windows, zwei SidePanels, einem Dialog und nativen `surfaces[*]` Dual Records.
- `docs/en/surface-manager-authoring-guide.md` erklaert, wann `components[*].metadata.surface` reicht und wann `surfaces[*]` bevorzugt wird.
- `docs/surface-manager-component-lab.md` dokumentiert die Lab-Panels `surface-preview`, `native-rmt-inspector`, `migration-diff`, `quality-gates` und `source-links`.
- `docs/en/surface-manager-migration-guide.md` beschreibt die additive Migration von `components[*].metadata.surface` nach `surfaces[*]`.
- `development/docs-evidence/root/surface-manager-release-handoff.md` buendelt den finalen Gate- und Release-Handoff.
- `tests/rmt/surface_manager_release_handoff_suite.js` registriert den lokalen Gate `surface-release-handoff`.

## Release-Entscheidung

Der SurfaceManager ist nach `WP-SM-09` bereit fuer App-Shell-Authoring und native Surface-Authoring-Experimente. Die produktive `xtend.surface` Adapter-Ausfuehrung bleibt bewusst deferred. Die Boundary lautet weiter:

```text
no-public-runtime-claim-for-xtend.surface-adapter-yet
```

## Lokale Pruefung

```bash
node scripts/run_xtend_tests.js surface-release-handoff --json
npm run test:surface-release-handoff
```

Der Gate ist statisch, lokal, browserfrei und netzwerkfrei. Er prueft Katalog, Fixture, RMT-Normalisierung, Semantic Graph, Docs, Package, Scaffold, Runner und Referenzpfade.
