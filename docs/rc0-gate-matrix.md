# RC0 Gate Matrix

`xtend.epic12.rc0-gate-matrix.v1` beschreibt den ersten release-kandidatenfaehigen Gate-Schnitt fuer XTend. RC0 ist ein lokaler Review-Kandidat, kein Publish.

Lokaler Self Check:

```bash
node scripts/run_xtend_tests.js rc0-gate-matrix --json
npm run test:rc0-gate-matrix
```

## Pflichtgates

| Bereich | Command |
|---------|---------|
| PR Fast | `npm run test:pr:report` |
| Full Release | `npm run test:release:full:report` |
| Snapshot Gate | `node scripts/run_xtend_tests.js component-shell-theme-matrix visual-snapshot-automation visual-snapshots design-tokens --json` |
| RMT Authoring Gate | `node scripts/run_xtend_tests.js rmt-shell-authoring-ux rmt-first-class-app rmt-first-demo-app docs-rmt-pilot rmt-dsl-authoring-polish --json` |
| Package Dry Run | `npm run pack:dry-run` |
| Matrix Self Check | `node scripts/run_xtend_tests.js rc0-gate-matrix --json` |

## Snapshot und Design Tokens

Der Snapshot Gate nutzt `visual-snapshots` und `design-tokens`. Pixel-Baselines bleiben optional; die reviewbare RC0-Basis ist die DOM-Baseline unter `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json`.

## RMT Authoring

Der RMT Authoring Gate verbindet Shell Authoring, RMT-first Apps, Docs Parsedown Scheduling und den neuen `rmt-dsl-authoring-polish` Gate. So ist pruefbar, dass XTend UI, XRouter und XTendRMT zusammenarbeiten, ohne XTend-Typen in den RMT Kernel zu importieren.

## Conditional Network Gates

Vor Publish muessen Netzwerk-Gates laufen oder im Handoff bewusst deferred werden:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
```

Diese Gates sind nicht Teil des lokalen Default-Runners.

## Known Residual Policy

RC0 akzeptiert aktuell:

- `xstate` als `contract-gated` nicht-visuelle Boundary-Probe
- `x-utils` als `typed-contract-gated` Utility-Boundary
- die bekannte Performance-Warnung `xtend.component.hydrate`, solange sie unter der Fail-Schwelle bleibt

`private-until-release-owner-approval` bleibt aktiv. Auch ein gruener RC0 Gate Run bedeutet keine Publish-Freigabe.

## Migration und Adoption

Die operative Doku fuer Teams liegt seit `WP-E12-15` im [RC0 Adoption Guide](./rc0-adoption-guide.md). Dort sind Long-Tail Runtime Closure, DOM-first Snapshot-Baseline, Design Token Productization, RMT DSL Authoring Polish, Known Residual Policy und Migration Notes fuer Component Authors und App Authors zusammengefuehrt.

Der finale Owner-Handoff liegt seit `WP-E12-16` unter [Epic 12 RC0 Handoff](./epic12-rc0-handoff.md). Er setzt den Epic-12-Status auf `ready-for-release-owner-review-not-publish` und laesst Publishing bis zur Release Owner Acceptance blockiert.

Kanonischer Pfad: `docs/rc0-adoption-guide.md`.
