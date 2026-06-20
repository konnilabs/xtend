# XTensions Registry and Package Strategy Contract

- Workpackage: `XTN-13`
- Status: `accepted-by-XTN-13`
- Strategy Schema: `xtend.xtensions.registry-package-strategy.v1`
- Entry Schema: `xtend.xtensions.registry-entry.v1`
- Compatibility Matrix Schema: `xtend.xtensions.registry-compatibility-matrix.v1`
- Release Policy Schema: `xtend.xtensions.registry-release-policy.v1`
- Deprecation Policy Schema: `xtend.xtensions.registry-deprecation-policy.v1`
- Report Schema: `xtend.xtensions.registry-report.v1`
- Diagnostic Schema: `xtend.xtensions.registry-diagnostic.v1`
- Local Gate: `node scripts/run_xtend_tests.js xtensions-registry-package-strategy --json`

## Entscheidung

XTensions starten als projekt-lokale Maraca-Manifeste. Das ist die primaere Distribution fuer XTN-13.

Das Namensschema `@xtend/xtension-*` wird reserviert, aber NPM-Subpackages werden nicht automatisch erzeugt. Sie bleiben `reserved-deferred`, bis Ownership, Security Review, Compatibility Matrix, Deprecation Policy und Release-Handoff spaeter explizit freigegeben sind.

Marketplace-Eintraege sind vorerst `metadata-only`. Sie duerfen Discovery, Owner, Compatibility, Deprecation und Security-Status anzeigen, aber keine zweite Runtime-Quelle und keine eigenstaendige Adapter-Registry erzeugen.

## Source of Truth

Die Registry ist ein Index, keine Runtime-Registry.

- Maraca Manifest und Artefakt-Fingerprint sind die Source of Truth fuer XTension-Identitaet, Contract Snapshot und Build Provenance.
- Die host-lokale Runtime Capability Registry bleibt die Source of Truth fuer Runtime-Entscheidungen, Peer-Verfuegbarkeit und Fallback.
- Ein globales XTension-Registry-Objekt ist verboten.
- Registry-Eintraege duerfen keine direkten Framework-Adapterdefinitionen ausfuehren.

## Package-Strategie

Die Default-Strategie lautet:

- `primaryDistribution: project-local-manifest`
- `packageNamePattern: @xtend/xtension-*`
- `npmSubpackages: reserved-deferred`
- `marketplaceEntries: metadata-only`
- `adapterPackaging: external-opt-in-peer-harness`
- `registryScope: project-local`
- `registrySourceOfTruth: maraca-manifest`
- `runtimeSourceOfTruth: host-local-runtime-capability-registry`
- `allowGlobalRegistry: false`
- `allowRemoteArtifacts: false`
- `allowNpmSubpackagesByDefault: false`

Repo-interne Adapter bleiben kein Default-Distributionsmodell. Sie koennen fuer produktinterne Experimente existieren, muessen aber wie projekt-lokale Manifeste gatebar bleiben und duerfen keine Framework-Runtime in XTend ziehen.

## Compatibility

Jeder Registry-Eintrag braucht eine Compatibility Matrix mit:

- XTend-Version Range
- Maraca Manifest Schema
- Runtime Registry Schema
- Security Gate Schema
- HostController Schema
- Status: `supported`, `deprecated` oder `blocked`

`blocked` blockiert das Gate. `deprecated` bleibt erlaubt, wenn eine Deprecation Policy mit Replacement, Sunset Version oder Sunset Date vorhanden ist.

## Release und Deprecation

Jeder Eintrag braucht:

- Owner
- Security Review
- Compatibility Review
- Deprecation Review
- Provenance-Pflicht
- Release Channel

Deprecation ist gatebar. `deprecated` ohne Replacement oder Sunset-Metadaten blockiert das Gate. `removed` darf spaeter nur mit Migrations- und Compatibility-Handoff in Release-Gates auftauchen.

## Dependency Boundary

Framework-Runtimes bleiben external peer oder optional. Registry- und Package-Strategie duerfen keine React-, Vue-, Chart.js-, Leaflet-, Three.js- oder sonstige Drittframework-Runtimes in XTend-Pakete aufnehmen.

`npm-subpackage`, `remote-artifact`, `globalRegistry`, `frameworkRuntimeIncluded`, `packageIncluded`, `vendored` und `root-runtime` blockieren den Strict Gate, solange XTN-13 keine explizite Folgeentscheidung dafuer freigibt.

## Artefakte

- `tools/xtensions/registry-package-strategy.js`
- `tools/xtensions/registry-package-strategy.d.ts`
- `tests/fixtures/xtensions/registry-package-strategy-valid.json`
- `tests/xtensions/xtensions_registry_package_strategy_suite.js`

## Definition of Done

- Package-Strategie ist dokumentiert.
- Registry erzeugt keine zweite Runtime-Source-of-Truth.
- Compatibility und Deprecation sind gatebar.
- Externe Frameworks bleiben Peer-/Optional-Metadaten und werden nicht in XTend importiert, installiert oder vendored.
