# WP-SM-08 - Native RMT `surfaces` Domain und `xtend.surface` Adapter entwerfen

Status: completed
Local Gate: `node scripts/run_xtend_tests.js surface-native-rmt --json`
Contract: `development/XTend-SurfaceManager-Native-RMT-Surfaces-Domain-Contract.md`

## Ziel

`WP-SM-08` verschiebt Surface Authoring aus dem reinen Component-Metadata-MVP in ein natives RMT-Zielbild. `surfaces` wird als optionale Top-Level-Domain beschrieben, und `xtend.surface` wird als Adapter-Handoff formalisiert.

## Umsetzung

- `xtendrmt/rmt.schema.json` enthaelt `surfaces`, `surface`, `surfaceType`, `surfaceBounds`, den Native-Domain-Contract `xtend.rmt.surfaces-domain.v1` und den Adapter-Handoff `xtend.surface.adapter.v1`.
- `xtendrmt/rmt-core.d.ts` enthaelt `RmtSurfaceDomainRecord` und die optionale Dokument-Domain `surfaces?: RmtSurfaceDomainRecord[]`.
- `xtendrmt/rmt-core.esm.js`, `xtendrmt/rmt-runtime.esm.js` und `xtendrmt/rmt-runtime.browser.js` normalisieren, validieren und serialisieren `surfaces`.
- `tools/rmt-language/semantic-graph.js`, `tools/rmt-language/completions.js` und `tools/rmt-language/diagnostics.js` kennen `surfaces` als native RMT-Domain.
- `tests/fixtures/rmt-surface-native-domain.rmt` beweist Dual Records: native `surfaces[*]` plus kompatible `components[*].metadata.surface`.
- `catalog/surface-manager-native-rmt-surfaces.js` beschreibt Contract, Adapter-Handoff, Migration, Feature Flags und Artefakte.
- `tests/rmt/surface_manager_native_rmt_surfaces_suite.js` prueft Schema, Typen, Normalisierung, Semantic Graph, Completion Provider, Linter, Package, Scaffold, Runner und Docs.

## Done Criteria

- `surfaces` ist eine optionale native Top-Level-Domain im RMT Schema.
- `surface_adapter` ist als Adapterkind fuer `xtend.surface` sichtbar.
- `xtend.surface.adapter.v1` beschreibt Operationen und Abgrenzung, aber behauptet keine produktive Runtime.
- Component-Record-Kompatibilitaet bleibt erhalten.
- RMT Normalisierung und Serialisierung verlieren `surfaces[*]` nicht.
- Semantic Graph, Completion Provider und Linter behandeln `surfaces` als bekannte Domain.
- Der lokale Gate `node scripts/run_xtend_tests.js surface-native-rmt --json` ist gruen.

## Handoff

`WP-SM-09` sollte jetzt Docs, Component Lab und Migration Guide finalisieren. Dabei sollten Authoring-Beispiele zeigen, wann `components[*].metadata.surface` weiterreicht und wann native `surfaces[*]` genutzt wird.

