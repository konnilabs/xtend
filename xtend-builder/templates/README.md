# XTend-Scaffold Templates

Dieser Bereich enthaelt ab `WP-E03-04` den Template-Ladepfad fuer `XTend-Scaffold`.

`xtend-builder/templates/registry.js` stellt die Template-Registry mit Schema `xtend.scaffold.template-registry.v1` bereit.

```bash
node xtend-builder/scaffold.js templates --json
```

Die Registry fuehrt Template-IDs fuer `component`, `docs`, `tests`, `fixtures`, `types`, `manifest` und `demo`. Seit `WP-E03-05` sind die Pflichtartefakt-Templates fuer `component`, `docs`, `tests`, `fixtures`, `types` und `manifest` konkret vorhanden. Seit `WP-E03-06` werden Manifest- und Hydration-Werte aus `xtend-builder/wiring/` in diese Templates eingespeist. Seit `WP-E03-07` werden profilbasierte State-, Event- und API-Patterns ebenfalls ueber `xtend-builder/wiring/` gerendert. Seit `WP-E03-09` enthaelt das Types-Template den Typing-Contract und die vorbereitete XTendRMT-Adapter-Anbindung aus `xtend-builder/typing/`. Seit `WP-E03-10` ist das `demo` Template als Preview-Reference-Plan implementiert. Seit `WP-E03-11` tragen Source-, Docs-, Types- und Manifest-Templates die Extension-Point-Metadaten aus `xtend-builder/extensions/`. Seit Epic 04 / `WP-E04-08` muessen RMT-kompatible Template-Ausgaben den Gate `node scripts/run_xtend_tests.js rmt-compatibility --json` referenzieren. Seit `ER-WP-21` tragen neue Component-Dry-Runs das Performance-Profil `xtend.performance.component-profile.v1` in Source, Docs, Tests, Types und Manifest. Seit `ER-WP-23` tragen neue Component-Dry-Runs das A11y-Profil `xtend.a11y.profile.v1` in Source, Docs, Tests, Fixtures, Types und Manifest. Seit `WP-E10-07` gibt es zusaetzliche TypeScript-first Templates fuer `ts-source`, `ts-contract`, `ts-rmt`, `ts-a11y`, `ts-performance` und `ts-fixture`.

Spaetere Templates muessen die Epic-02-Testpflicht und die in `xtend-builder/scaffold.config.js` definierten Pflichtartefakte respektieren.

## Pflichtartefakt-Templates

| Artefakt | Template |
|----------|----------|
| `component` | `xtend-builder/templates/component/source.template.js` |
| `docs` | `xtend-builder/templates/component/docs.template.md` |
| `tests` | `xtend-builder/templates/component/component-suite.template.js` |
| `fixtures` | `xtend-builder/templates/component/fixture.template.html` |
| `types` | `xtend-builder/templates/component/types.template.d.ts` |
| `manifest` | `xtend-builder/templates/component/manifest-plan.template.json` |
| `demo` | `xtend-builder/templates/component/demo-plan.template.md` |
| `ts-source` | `xtend-builder/templates/component/source.template.ts` |
| `ts-contract` | `xtend-builder/templates/component/contract.template.ts` |
| `ts-rmt` | `xtend-builder/templates/component/rmt.template.ts` |
| `ts-a11y` | `xtend-builder/templates/component/a11y.template.ts` |
| `ts-performance` | `xtend-builder/templates/component/performance.template.ts` |
| `ts-fixture` | `xtend-builder/templates/component/fixture-data.template.ts` |

Der Template-Loader `xtend-builder/templates/loader.js` rendert Platzhalter wie `{{tag}}`, `{{name}}`, `{{className}}`, `{{profilesCsv}}`, `{{stateKeyPrefix}}`, `{{manifestSource}}`, `{{fixtureScriptPath}}`, `{{hydrationStateAttribute}}`, `{{featureStatePrefix}}`, `{{featureEventRows}}`, `{{featureReviewRules}}`, `{{typeContractSchema}}`, `{{typeRmtAdapter}}`, `{{typeRmtComponentContractVersion}}`, `{{typeRmtTemplateAuthoringContractVersion}}`, `{{typeRmtTemplateAdapter}}`, `{{typeRmtTemplateRef}}`, `{{typeRmtRootHandshakeContractVersion}}`, `{{typeRmtRootRef}}`, `{{typeRmtHostCapabilitiesContractVersion}}`, `{{typeRmtHostCapabilityNameUnion}}`, `{{rmtCompatibilitySchema}}`, `{{rmtCompatibilityContractRefsCsv}}`, `{{typeRmtRouterAdapter}}`, `{{previewContractSchema}}`, `{{previewTargetPath}}`, `{{extensionContractSchema}}`, `{{extensionSourceGetter}}`, `{{extensionScheduleHint}}`, `{{performanceProfileSchema}}`, `{{performancePolicySchema}}`, `{{performanceBudgetClass}}`, `{{performanceLane}}`, `{{performanceHydrationPolicy}}`, `{{performanceReviewRules}}`, `{{performanceProfileJson}}`, `{{a11yProfileSchema}}`, `{{a11yRole}}`, `{{a11yAccessibleNameDefault}}`, `{{a11yKeyboardRows}}`, `{{a11yAriaStateRows}}`, `{{a11yProfileJson}}`, `{{componentContractV2Json}}`, `{{rmtComponentMetadataJson}}`, `{{componentLifecycleTelemetrySchema}}`, `{{componentFabricLaneIngestionSchema}}`, `{{tsSourcePath}}` und `{{tsRuntimeArtifactPath}}`.
