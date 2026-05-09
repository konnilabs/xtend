# XTend-Scaffold Blueprints

Dieser Bereich enthaelt ab `WP-E03-03` den verbindlichen Komponenten-Blueprint und Artefaktcontract fuer `XTend-Scaffold`.

Der maschinenlesbare Contract liegt in `xtend-builder/blueprints/component-blueprint.contract.js` und nutzt das Schema `xtend.scaffold.component-blueprint.v1`.

## Artefaktmatrix

| Artefakt | Zielpfad | Pflicht | Modus |
|----------|----------|---------|-------|
| `component` | `components/<tag>.js` | ja | `write-new` |
| `docs` | `docs/components/<name>.md` | ja | `write-new` |
| `tests` | `tests/components/<tag>.component_suite.js` | ja | `write-new` |
| `fixtures` | `tests/components/fixtures/<tag>.component.html` | ja | `write-new-or-documented-exception` |
| `types` | `components/<tag>.d.ts` | ja | `write-new-or-documented-exception` |
| `manifest` | `components/manifest.json` | ja | `patch-plan` |
| `demo` | `docs/previews/<name>.preview.md` | bedingt | `reference-plan` |
| `ts-source` | `src/components/<tag>/<tag>.ts` | ja | `write-new` |
| `ts-contract` | `src/components/<tag>/<tag>.contract.ts` | ja | `write-new` |
| `ts-rmt` | `src/components/<tag>/<tag>.rmt.ts` | ja | `write-new` |
| `ts-a11y` | `src/components/<tag>/<tag>.a11y.ts` | ja | `write-new` |
| `ts-performance` | `src/components/<tag>/<tag>.performance.ts` | ja | `write-new` |
| `ts-fixture` | `src/components/<tag>/<tag>.fixture.ts` | ja | `write-new` |

## TypeScript Component Blueprint

Seit `WP-E10-07` enthaelt der Komponenten-Blueprint zusaetzlich den Contract `xtend.scaffold.typescript-component-blueprint.v1`. Neue Komponenten werden damit nicht nur als Legacy-kompatibler Runtime-Plan, sondern als TypeScript-first Source-Buendel vorbereitet.

Pflichtbindungen:

- Source Strategy: `xtend.typescript.component-source-strategy.v1`
- Component Contract: `xtend.component.contract.v2`
- RMT Component Contract: `xtend.rmt.component-contract.v1`
- Fabric/Lane Ingestion: `xtend.component.fabric-lane-ingestion.v2`
- Component Lifecycle Telemetry: `xtend.component.lifecycle-telemetry.v1`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js builder-typescript-blueprint --json
```

## Profilmapping

| Profil | Mindestchecks |
|--------|---------------|
| `display` | Registrierung, Manifest, Attribute, Slots, sichtbarer DOM-Vertrag, Hydration-Basis |
| `interactive` | Display-Basis, Events, Tastatur, Fokus, Labels, Rehydration ohne doppelte Listener |
| `stateful` | kanonische `xstate` Keys, externe State-Aenderung, Cleanup, SSOT-Grenze |
| `feedback` | Live-Region, Dismissal, Event-Contract, Timer-Cleanup, Reduced Motion |
| `overlay` | Open-State, Fokusziel, Escape, Fokus-Rueckgabe, `aria-modal` |
| `routing` | Navigation, Params/Query, `xstate` Bridge, Route-Events, lokaler Link-Contract |
| `theme` | Theme-State, CSS Custom Properties, Theme-Event, Legacy-Fassade |
| `form` | Value, Validation, Labels, Fehlermeldung, Submit-/Change-Events |
| `media` | Ladezustand, Controls, Tastatur, Fallbacks, Reduced Motion |

## A11y-Pflichtprofil

Seit `ER-WP-23` ist A11y Bestandteil des Blueprints und nicht nur ein Dokumentationshinweis. Jede neue Component-Ausgabe muss die folgenden Contracts durchreichen:

- Component Contract: `xtend.a11y.component-contract.v1`
- Profil: `xtend.a11y.profile.v1`
- Test Contract: `xtend.a11y.test-contract.v1`
- Scaffold Plan: `xtend.scaffold.a11y-profile-plan.v1`

Pflichtartefakte:

- Source: `xtendScaffoldA11yProfile`
- Docs: Abschnitt `A11y-Profil`
- Tests: A11y-Profil-, Rollen- und Namensassertions
- Fixture: `aria-label` plus Hydration-Ergebnis fuer Rolle, Name und Profil
- Types: `X<Component>A11yProfile`
- Manifest: `a11yProfile`

## Performance-Pflichtprofil

Seit `ER-WP-21` ist Performance Bestandteil des Blueprints. Jede neue Component-Ausgabe muss die folgenden Contracts durchreichen:

- Scaffold Policy: `xtend.scaffold.performance-policy.v1`
- Component Profile: `xtend.performance.component-profile.v1`
- Budget Matrix: `xtend.performance.budget-matrix.v1`
- Measurement Contract: `xtend.performance.measurement.v1`
- Regression Gate: `xtend.performance.regression-gate.v1`

Pflichtartefakte:

- Source: `xtendScaffoldPerformanceProfile`
- Docs: Abschnitte `Performance-Profil` und `Performance-Regeln`
- Tests: Performance-Profil- und Policy-Assertions
- Types: `X<Component>PerformanceProfile`
- Manifest: `performanceProfile`

## Ausnahmeprozess

Ausnahmen sind nur fuer `fixtures`, `types`, `manifest` und `demo` erlaubt. Jede Ausnahme braucht eine explizite Begruendung im Worklog, in der Komponentendoku oder in der Suite. Leere Testdateien, stillschweigend ausgelassene Manifest-Eintraege und undokumentierte Typ-Luecken sind nicht erlaubt.

## Lokale Contract-Ausgabe

```bash
node xtend-builder/scaffold.js blueprint
node xtend-builder/scaffold.js blueprint --json
```

Grenze in `WP-E03-03`: Der Blueprint definiert den Contract, erzeugt aber noch keine Produktivdateien. Generator-Grundgeruest und Template-Ladepfad folgen in `WP-E03-04`.
