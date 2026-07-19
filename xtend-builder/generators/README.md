# XTend-Scaffold Generators

Dieser Bereich enthaelt ab `WP-E03-04` das Generator-Grundgeruest fuer `XTend-Scaffold`.

## Registry

`xtend-builder/generators/registry.js` stellt die Generator-Registry mit Schema `xtend.scaffold.generator-registry.v1` bereit.

Aktuell registriert:

| Generator | Command | Status | Grenze |
|-----------|---------|--------|--------|
| `component` | `component-plan` | `plan-only` | erzeugt nur einen Dry-Run-Plan |
| `component-files` | `component-files` | `template-render-with-feature-type-preview-and-extension-wiring` | rendert Pflichtartefakt-Inhalte plus Manifest-/Hydrations-/Feature-/Typ-/Preview-/Extension-Wiring ohne Schreibzugriff |
| `component-typing` | `typing` | `type-contract-and-rmt-attachment` | erzeugt den `.d.ts` Contract plus vorbereitete XTendRMT-Anschluss-Metadaten |
| `component-preview` | `preview` | `preview-reference-contract` | erzeugt den Preview-Referenzplan plus Reference-Gate-Metadaten |
| `component-extensions` | `extensions` | `extension-point-contract` | erzeugt Templating-, Rendering- und Root-Lifecycle-Extension-Punkte |
| `rmt-kernel-lab` | `kernel-lab` | `rmt-kernel-analysis-clean-build-and-module-manifest` | analysiert den gebuendelten RMT Kernel und baut das Dashboard-freie `clean` Profil |

## Component-Plan

`xtend-builder/generators/component-plan.js` erstellt einen maschinenlesbaren Plan mit Schema `xtend.scaffold.component-plan.v1`.

```bash
node xtend-builder/scaffold.js component-plan --tag x-example --profile display --json
```

Der Plan validiert Tag, Profile und Features, loest Zielpfade aus dem Blueprint auf und ordnet Template-IDs zu. Er schreibt keine Produktivdateien.

## Component-Files

`xtend-builder/generators/component-files.js` rendert alle Pflichtartefakte aus den Templates und gibt sie als JSON-Vorschau aus.

```bash
node xtend-builder/scaffold.js component-files --tag x-example --profile display --json
```

Gerenderte Pflichtartefakte:

- `component`
- `docs`
- `tests`
- `fixtures`
- `types`
- `manifest`

Das bedingte `demo`-Artefakt wird seit `WP-E03-10` als Preview-Referenzplan gerendert.

Seit `WP-E03-06` enthaelt die Ausgabe zusaetzlich:

- `wiring.manifest` mit Schema `xtend.scaffold.manifest-wiring.v1`
- `wiring.hydration` mit Schema `xtend.scaffold.hydration-wiring.v1`
- lokale Scriptpfade wie `../../../components/x-example.js`
- `cdnAllowed: false` fuer Manifest- und Fixture-Wiring

Seit `WP-E03-07` enthaelt die Ausgabe ausserdem:

- `wiring.features` mit Schema `xtend.scaffold.feature-wiring.v1`
- profilbasierte State-Keys unter `xtend.component.<tag>.<id>.`
- Custom-Event-Namen nach `<domain>-<action>`
- XTend-API-Hinweise unter `window.XTend.*`
- Review-Regeln gegen `xstate.on/off`, lokale UI-Wahrheiten und neue `window.show*` Helper

Seit `WP-E03-09` enthaelt die Ausgabe ausserdem:

- `wiring.typing` mit Schema `xtend.scaffold.component-typing.v1`
- Event-/Detail-Typen fuer oeffentliche Custom Events
- Attribute- und Property-Maps fuer oeffentliche JS-APIs
- vorbereitete RMT-Anschluss-Typen fuer `xtend.component` und `xtend.xrouter`

Seit `WP-E03-10` enthaelt die Ausgabe ausserdem:

- `wiring.preview` mit Schema `xtend.scaffold.component-preview.v1`
- das bedingte `demo` Artefakt als `docs/previews/<name>.preview.md`
- Registry-Metadaten fuer `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
- lokale Verify-Hinweise fuer `references`, Component-/Hydration-Gates und `npm test`

Seit `WP-E03-11` enthaelt die Ausgabe ausserdem:

- `wiring.extensions` mit Schema `xtend.scaffold.component-extension-points.v1`
- Root-Lifecycle-Hooks wie `beforeHydrate`, `afterHydrate`, `beforeRender`, `afterRender` und `onDisconnect`
- Template- und Rendering-Hints fuer Epic 04
- XTendRMT Bridge-Punkte fuer `xtend.component` und `xtend.xrouter`

Seit Epic 04 / `WP-E04-07` enthaelt die Ausgabe ausserdem:

- `rmtCompatibility` mit Schema `xtend.scaffold.rmt-compatibility-binding.v1`
- Contract-Refs fuer Component, Template Authoring, Root Handshake und Host Capabilities
- Binding von Typing, Manifest-Plan, Preview-Plan und Extension-Punkten
- Minimum-Gate `node scripts/run_xtend_tests.js rmt-compatibility --json`

Seit `ER-WP-23` enthaelt die Ausgabe ausserdem:

- `wiring.a11y` mit Profil `xtend.a11y.profile.v1`
- `xtendScaffoldA11yProfile` im Source-Template
- Abschnitt `A11y-Profil` im Docs-Template
- `aria-label` plus Rollen-/Name-/Profil-Hydration-Ergebnis im Fixture-Template
- `X<Component>A11yProfile` im Types-Template
- `a11yProfile` im Manifest-Patch-Plan

Seit `ER-WP-21` enthaelt die Ausgabe ausserdem:

- `wiring.performance` mit Profil `xtend.performance.component-profile.v1`
- `xtendScaffoldPerformanceProfile` im Source-Template
- Abschnitte `Performance-Profil` und `Performance-Regeln` im Docs-Template
- `X<Component>PerformanceProfile` im Types-Template
- `performanceProfile` im Manifest-Patch-Plan

Seit `WP-E10-07` enthaelt die Ausgabe ausserdem:

- `wiring.componentContractV2` mit Schema `xtend.component.contract.v2`
- `wiring.componentContractV2Report` fuer die lokale Contract-v2-Validierung
- `wiring.typescript` mit Schema `xtend.scaffold.typescript-component-blueprint.v1`
- TypeScript Source-Artefakte `ts-source`, `ts-contract`, `ts-rmt`, `ts-a11y`, `ts-performance` und `ts-fixture`
- RMT Component Metadata mit `xtend.rmt.component-contract.v1`, `xtend.component.fabric-lane-ingestion.v2` und `xtend.component.lifecycle-telemetry.v1`
- lokalen Gate `node scripts/run_xtend_tests.js builder-typescript-blueprint --json`

## Component-Typing

`xtend-builder/typing/component-types.js` erstellt einen maschinenlesbaren Typing-Contract.

```bash
node xtend-builder/scaffold.js typing --tag x-example --profile display --json
```

Der Contract bleibt `types-only-no-runtime-imports` und implementiert keine XTendRMT Bridge.

## Component-Preview

`xtend-builder/preview/component-preview.js` erstellt einen maschinenlesbaren Preview-Contract.

```bash
node xtend-builder/scaffold.js preview --tag x-example --profile display --json
```

Der Contract bleibt `dry-run-preview-contract`, nutzt nur repo-lokale Referenzen und patcht die Reference-Registry nicht selbst.

## Component-Extensions

`xtend-builder/extensions/component-extension-points.js` erstellt einen maschinenlesbaren Extension-Point-Contract.

```bash
node xtend-builder/scaffold.js extensions --tag x-example --profile display --json
```

Der Contract bleibt `dry-run-extension-contract` und implementiert keine Templating-, Rendering- oder Bridge-Runtime.

## RMT KernelLab

`xtend-builder/generators/rmt-kernel-lab.js` erstellt Analyse- und Build-Reports fuer den gebuendelten RMT Kernel.

```bash
node xtend-builder/scaffold.js kernel-lab analyze --json
node xtend-builder/scaffold.js kernel-lab build --profile clean --check --json
node xtend-builder/scaffold.js rmt kernel-lab build --profile clean --version 0.5.0 --write --json
```

`analyze` erzeugt das Modul-Inventar nach `xtend.rmt.kernel-module-manifest.v1`, meldet die sichtbaren 25 Bundle-Module gegen die historische Erwartung von 26 Modulen und klassifiziert erhaltene bzw. entfernte Symbolflaechen. `build --profile clean` schreibt die Dashboard-freien Standardartefakte fuer Runtime, Browser, Typen, Produktmanifest und Kernel-Modulmanifest; `--version <semver>` setzt dabei die XTendRMT Release-Version fuer Header, Runtime-API, Typen und Manifest.

## Grenze

`WP-E03-11` rendert Inhalte, Wiring, Typing, Preview- und Extension-Plaene nur in `dry-run`. Produktive Datei-Ausgabe, Runtime-Feature-Code, XTendRMT Bridge-Code und automatische Manifest-Patches folgen in spaeteren Workpackages.
