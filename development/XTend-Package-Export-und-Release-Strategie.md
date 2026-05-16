# XTend Package-Export- und Release-Strategie

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.package-export.release-strategy.v1`
- Workpackage: `ER-WP-06`
- Bezug:
  - `package.json`
  - `README.md`
  - `CHANGELOG.md`
  - `development/ROADMAP-XTend-Enterprise-Reife.md`
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/ADR-XTend-Loader-und-Lokale-Entwicklung.md`
  - `development/ER-WP-05-Demo-und-Fixture-Pfade-auf-neuen-Loader-migrieren.md`
  - `development/ADR-XTend-Security-Trust-Boundaries.md`
  - `development/XTend-Component-Catalog-Coverage-Matrix.md`
  - `development/XTend-CI-Gate-Matrix.md`
  - `development/XTend-Release-Checklist-und-SemVer-Policy.md`

## Entscheidung

XTend erhaelt eine konsumierbare Package-Oberflaeche. In ER-WP-06 blieb der Boundary bewusst privat; fuer RC1-Publish-Prep ist das Root-Package `@ccslabs/xtend` inzwischen auf `private: false` geoeffnet. Das Paket ist damit fuer lokale Enterprise-Gates, `npm pack --dry-run`, Dokumentation und spaetere Release-Automation vorbereitet, ohne den finalen `npm publish` automatisch auszufuehren.

Die Distribution ist browser-first und local-first. `xtend-loader.js` ist der kanonische Loader, `xtend-dev.js` bleibt nur Legacy-Stub, CDN ist kein Default- oder Testpfad. ES6-/ESM-Artefakte bleiben die Basistechnologie fuer Browser- und Runtime-Module; CommonJS bleibt nur fuer bestehende Node-Test-, Scaffold- und Utility-Pfade erlaubt.

## Export-Matrix

Die scoped Release-Matrix trennt Gesamtpaket und installierbare Teilpakete:

| Package | Manifest | Installationszweck |
|---------|----------|--------------------|
| `@ccslabs/xtend` | `package.json` | kompletter XTend Stack |
| `@ccslabs/xtend-rmt` | `xtendrmt/package.json` | XTendRMT Runtime und Browser Bundle |
| `@ccslabs/xtend-fabric` | `fabric/package.json` | Fabric Runtime, Hydration und Lane Mapping |
| `@ccslabs/xtend-cli` | `xtend-builder/package.json` | Scaffold-/Builder-CLI |
| `@ccslabs/xtend-compiler` | `tools/package.json` | RMT Compiler, Parser, Linter und Language Tooling |

| Package Subpath | Artefakt | Stabilitaet | Zweck |
|-----------------|----------|-------------|-------|
| `xtend` | `xtend-loader.js` | canonical-browser | Default Browser Loader |
| `xtend/loader` | `xtend-loader.js` | canonical-browser | expliziter Loader Import |
| `xtend/legacy-loader` | `xtend-dev.js` | legacy | Migrationspfad ohne CDN |
| `xtend/api` | `api.js` | public-beta | UI API Initialisierung |
| `xtend/style.css` | `xtend.css` | public-beta | Basistheme und Layout Styles |
| `xtend/manifest` | `components/manifest.json` | public-beta | Default-Komponentenmanifest |
| `xtend/components/*` | `components/*` | public-beta | einzelne Web Components |
| `xtend/fabric` | `fabric/xtend-fabric.js` | public-beta | Fabric Safety, Telemetry und Boundary Runtime |
| `xtend/fabric/rmt-lane-mapping` | `fabric/rmt-lane-mapping.js` | public-beta | Fabric Lane zu RMT Schedule Mapping |
| `xtend/catalog/component-catalog-coverage` | `catalog/component-catalog-coverage.js` | policy | Component Catalog Coverage Matrix und Gate |
| `xtend/catalog/component-regression-priority` | `catalog/component-regression-priority.js` | policy | Visual-/Browser-Regression-Prioritaetsplan |
| `xtend/rmt` | `xtendrmt/rmt-runtime.esm.js` | public-beta | XTendRMT ESM Runtime |
| `xtend/rmt/browser` | `xtendrmt/rmt-runtime.browser.js` | public-beta | XTendRMT Browser Bundle |
| `xtend/builder` | `xtend-builder/scaffold.js` | tooling | Scaffold CLI Entry |
| `xtend/security/trusted-dom-policy` | `security/trusted-dom-policy.js` | policy | Trusted DOM Policy Modul |
| `xtend/security/supply-chain-gate-policy` | `security/supply-chain-gate-policy.js` | policy | Supply-Chain Gate Policy Modul |

Die Export-Matrix ist eine Produktentscheidung, keine Aufforderung zur automatischen Veroeffentlichung. `private: false` ist erst nach Release Owner Approval fuer RC1-Publish-Prep gesetzt; der eigentliche Publish-Befehl bleibt manuell.

## Browser-Bundle-Policy

- Source-nahe Browser-Artefakte bleiben bis zur finalen Release-Haertung die kanonischen Artefakte.
- `xtend-loader.js` laedt lokal ueber `components/manifest.json` und `meta[name="xtend-preload"]`.
- XTendRMT fuehrt bereits getrennte ESM- und Browser-Runtime-Artefakte; die Paritaet bleibt durch `npm run test:rmt-artifact-parity` gatebar.
- Ein zusaetzliches `dist/`-Bundle wird erst eingefuehrt, wenn Release-Checklist, CI/CD und Supply-Chain-Gates stehen.

## SemVer- und Changelog-Policy

`ER-WP-38` finalisiert die verbindliche Detailpolicy in `development/XTend-Release-Checklist-und-SemVer-Policy.md` unter `xtend.release.checklist-semver-policy.v1`.

- Bis zur ersten stabilen Enterprise-Freigabe bleibt die Version im `0.x`-Bereich.
- Breaking Changes duerfen vor `1.0.0` in Minor-Versionen liegen, muessen aber im `CHANGELOG.md` und in den betroffenen Contracts sichtbar sein.
- Patch-Versionen sind fuer Bugfixes, Testhaertungen und nicht-brechende Doku-/Policy-Ergaenzungen reserviert.
- Nach `1.0.0` gilt SemVer strikt: Major fuer Breaking Changes, Minor fuer neue kompatible Features, Patch fuer kompatible Fixes.
- Jede Release-Kandidatur braucht einen `CHANGELOG.md`-Eintrag mit Loader-, Fabric-, RMT-, Security- und Testauswirkungen.
- Breaking Changes brauchen Migration Notes, Contract Impact, Changelog-Eintrag und Release Owner Signoff.

## Release-Gates

Vor einem echten Publish muessen mindestens folgende Gates laufen:

```bash
npm test
npm run test:release:full:report
npm run test:catalog-coverage
npm run test:regression-priority
npm run test:manifest-policy
npm run test:supply-chain
npm run test:rmt-artifact-parity
npm run release:report
npm run pack:dry-run
```

`package.json` enthaelt bereits `release:check`, `release:report`, `pack:dry-run`, `pack:dry-run:report`, `test:catalog-coverage`, `test:regression-priority`, `test:supply-chain`, `test:report`, `test:pr`, `test:pr:report`, `test:release:full`, `test:release:full:report` und `supply-chain:verify`. Supply-Chain-spezifische Gates fuer Dependency Audit, License Check und Vulnerability Policy sind seit `ER-WP-30` als lokaler Offline-Gate und CI-Handoff geplant. Catalog-Coverage ist seit `ER-WP-31` als lokaler Matrix-Gate sichtbar; Regression-Priorisierung ist seit `ER-WP-35` als lokaler Plan-Gate sichtbar. Der aktive Default-CI-Workflow aus `ER-WP-36` wurde in `ER-WP-37` zur Gate-Matrix erweitert: PRs laufen ueber `npm run test:pr:report`, Push/Manual/Nightly ueber `npm run test:release:full:report`. `ER-WP-38` spiegelt die Release-Kandidatenpflichten unter `xtend.releaseChecklist`. Seit `WP-E13-04` sperrt `xtend.epic13.package-export-lock.v1` die RC1-Package-Oberflaeche; `npm run pack:dry-run:report` erzeugt `.xtend-test-results/xtend-package-export-surface-lock.json`. Seit `WP-E13-05` prueft `xtend.epic13.known-residual-triage.v1`, dass `xstate` und `x-utils` als Boundary-Contracts geschlossen sind. Seit `WP-E13-06` schliesst `xtend.epic13.hydration-performance-closure.v1` den Watchpoint `xtend.component.hydrate` owner-frei.

## Provenance und Publish Boundary

`publishConfig.provenance` ist in Root- und Teilpaket-Manifests auf `true` vorbereitet, damit npm-Releases Herkunftsnachweise erzeugen koennen. `private: false` ist fuer RC1-Publish-Prep gesetzt; der Publish-Pfad wird weiterhin durch Owner-Entscheid, Gate-Artefakte und den manuellen `npm publish`-Befehl kontrolliert. Eine Freigabe darf erst erfolgen, wenn:

- `ER-WP-30` Dependency-, License- und Vulnerability-Gates geplant und lokal gatebar gemacht hat
- `ER-WP-36` CI/CD-Gates produktisiert hat
- `ER-WP-38` Release Checklist und SemVer Policy finalisiert hat und ein Release Owner den Publish Boundary akzeptiert
- `CHANGELOG.md` und Root-`README.md` fuer den konkreten Release-Kandidaten aktualisiert sind

## Architekturgrenzen

- XTend UI exportiert UI-, Loader-, Component-, Fabric- und Builder-Artefakte.
- XTendRMT bleibt framework-agnostischer Scheduler und Templating Kernel.
- Fabric und Adapter verbinden UI-Arbeit, Diagnostics, Lanes und RMT Schedules, ohne XTend-Wissen in den RMT Kernel zu verschieben.
- Package-Exports duerfen diese Grenze sichtbar machen, aber nicht verwischen.

## Handoff

| Paket | Status nach ER-WP-06 | Handoff |
|-------|----------------------|---------|
| `ER-WP-30` | completed | Supply-Chain-Gates setzen auf Export-Matrix und Release-Gates auf |
| `ER-WP-35` | completed | Regression-Priority-Gate setzt auf Catalog Export und Browser-/Performance-Gates auf |
| `ER-WP-36` | completed | Default-CI-Workflow setzt auf `test:report`, JSON-Reports und Artifact Upload |
| `ER-WP-37` | completed | trennt schnelle PR-Gates und volle Release-Gates |
| `ER-WP-38` | completed | setzt Release Checklist und SemVer Policy auf die Gate-Matrix |
| `ER-WP-39` | completed | setzt Enterprise Adoption Guide auf Release-, Fabric-, Performance- und A11y-Abschlussdokumente |
| `ER-WP-40` | completed | Docs-App RMT Parsedown Scheduling innerhalb der Package Boundary pilotiert |

ER-WP-06 schliesst EPIC 06 fachlich ab: Loader, lokaler Server, CDN-Entkopplung, Demo-/Fixture-Migration und Package-/Release-Strategie sind nun als zusammenhaengender Enterprise-Runtime-Strang dokumentiert.
