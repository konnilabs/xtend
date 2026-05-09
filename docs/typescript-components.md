# TypeScript Components

XTend fuehrt neue Komponenten TypeScript-first ein. Runtime-Artefakte bleiben weiter lokale ES Modules unter `components/`, waehrend die Source-of-Truth unter `src/components/<tag>/` liegt.

Contract: `xtend.scaffold.typescript-component-blueprint.v1`

Seit `WP-E10-16` ist dieser Guide Teil des Epic-10-Release-Handoffs `xtend.epic10.release-handoff.v1`. Neue Komponenten muessen nicht nur TypeScript Source besitzen, sondern auch RMT Metadata, Fabric Boundary, A11y, Performance, Fixture, Docs und lokale Gates nachweisen.

## Source Layout

| Datei | Zweck |
|-------|-------|
| `<tag>.ts` | Custom Element Source mit statischen RMT-, Fabric-, A11y- und Performance-Metadaten |
| `<tag>.contract.ts` | Component Contract v2 |
| `<tag>.rmt.ts` | RMT Component Metadata fuer `xtend.component` |
| `<tag>.a11y.ts` | A11y Profil |
| `<tag>.performance.ts` | Performance Profil |
| `<tag>.fixture.ts` | typed Fixture Data |

## Builder

Der Builder rendert die neue Artefaktgruppe im Dry-Run:

```bash
node xtend-builder/scaffold.js component-files --tag x-example --profile display --feature state --json
```

Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js builder-typescript-blueprint --json
```

## Pflicht-Gates ab WP-E10-16

```bash
node scripts/run_xtend_tests.js component-contract-v2 --json
node scripts/run_xtend_tests.js epic10-platform-gates --json
node scripts/run_xtend_tests.js epic10-release-handoff --json
```

Neue Komponenten durchlaufen zusaetzlich ihre Component-Level-Suite, Catalog Coverage, A11y-, Performance- und Visual-Regression-Gates.

## RMT und Fabric

Jede neue Komponente braucht einen `xtend.component` RMT Record und eine Fabric Boundary. Die kanonische Laufzeitgrenze fuer Fabric-Kontext ist `adapter-injection-via-xtend-component-resolveFabricContext`; `window.XTendFabric` ist Host-Komfortflaeche und nicht der Component-Contract.

## Boundaries

- keine CDN-Imports
- keine neuen Runtime Dependencies fuer Core-Komponenten
- kein produktiver TypeScript Compiler im Blueprint-Paket
- keine automatische Datei-Ausgabe ohne Review
- RMT Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`
