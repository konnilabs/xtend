# XTensions Maraca Manifest and Build Provenance Contract

- Status: `accepted-by-XTN-03`
- Datum: 2026-06-20
- Workpackage: `XTN-03`
- Manifest Schema: `xtend.maraca.xtension-manifest.v1`
- Contract Snapshot Schema: `xtend.maraca.xtension-contract-snapshot.v1`
- Artifact Schema: `xtend.maraca.xtension-artifact.v1`
- Build Provenance Schema: `xtend.maraca.xtension-build-provenance.v1`
- Build Plan Schema: `xtend.maraca.xtension-build-plan.v1`
- Bundle Report Schema: `xtend.maraca.xtensions-bundle-report.v1`
- Bundle Section Schema: `xtend.maraca.xtensions-bundle-section.v1`
- Dependency Classification Schema: `xtend.maraca.xtension-dependency-classification.v1`
- Diagnostic Schema: `xtend.maraca.xtension-diagnostic.v1`
- Module: `tools/xtensions/maraca-xtension-manifest.js`
- Types: `tools/xtensions/maraca-xtension-manifest.d.ts`
- Valid Fixture: `tests/fixtures/xtensions/maraca-xtension-manifest-valid.json`
- Missing Fixture: `tests/fixtures/xtensions/maraca-xtension-manifest-missing.json`
- Policy Blocked Fixture: `tests/fixtures/xtensions/maraca-xtension-manifest-policy-blocked.json`
- Local Gate: `node scripts/run_xtend_tests.js maraca-xtensions --json`
- Depends on: `xtend.xtensions.host-controller.v1`
- Depends on: `xtend.xtensions.signal-bridge.v1`
- Boundary: `no-rmt-kernel-import-of-framework-runtime-types`
- Boundary: `no-framework-test-fixture-dependencies-in-xtend-package`
- Boundary: `no-vendored-third-party-frameworks-in-repo-or-npm-package`
- Boundary: `dynamic-import-requires-manifest-policy-and-integrity`
- Boundary: `lazy-loading-remains-explicit-opt-in`

## Zweck

Dieser Contract beschreibt, wie XTensions in Maraca als eigene Build-Artefakte erscheinen. Maraca liest XTension-Manifeste, erzeugt stabile Fingerprints, erstellt Contract Snapshots und schreibt eine eigene `xtensions`-Sektion fuer Bundle Reports. Das ist kein produktiver Framework-Adapter und kein Framework-Bundle.

## Manifest Shape

Ein `xtend.maraca.xtension-manifest.v1` Manifest muss diese Felder enthalten:

| Feld | Regel |
|------|-------|
| `id` | stabile XTension-ID |
| `framework` | deklarierte Zielklasse wie `react`, `vue`, `leaflet`, `chart.js`, `three` oder `custom` |
| `version` | Manifest-/Adapter-Version |
| `entry.module` | Entry-Referenz; fuer XTN-03 typischerweise `external-peer://...` |
| `entry.exportName` | HostController Factory Export |
| `entry.dynamicImport` | explizit, default `true` |
| `lazy` | Lazy Policy mit opt-in |
| `contract` | Snapshot von HostController- und Signal-Bridge-Vertraegen |
| `capabilities` | deklarierte Host-/Signal-/Event-Faehigkeiten |
| `integrity.sha256` | deklarierter SHA256-Integrity-Wert |
| `csp` | Script-, Connect- und optionale Worker-/Style-/Image-Anforderungen |
| `fallback` | native Degradation bei fehlendem oder blockiertem Adapter |
| `dependencies` | nur Klassifikation, keine Root-Dependency |

## Lazy Policy

Gueltige Lazy Modes:

- `none`
- `explicit`
- `route`
- `visible`
- `idle`

Jeder Mode ausser `none` muss `optIn: true` und eine `policy` deklarieren. Dadurch bleibt Lazy Loading explizit und policy-gatebar.

## Fingerprints

Maraca erzeugt drei stabile Fingerprints:

- `contractSnapshot.fingerprint`: HostController-, SignalBridge-, Accepts-, Emits- und Capability-Snapshot
- `manifestFingerprint`: Manifest-Inhalt ohne volatile Laufzeitdaten
- `artifactFingerprint`: Manifest-Fingerprint plus Entry und Integrity

Eine Aenderung an `entry.module`, `contract.accepts`, `contract.emits`, `capabilities`, `csp`, `fallback` oder Dependency-Klassifikation muss den Manifest- oder Artefakt-Fingerprint aendern.

## Build Provenance

Jedes XTension-Artefakt bekommt `xtend.maraca.xtension-build-provenance.v1`:

- `buildId`
- `manifestFingerprint`
- `contractFingerprint`
- `artifactFingerprint`
- `integrity`
- `dependencyClassification`
- `packageIncluded: false`
- `vendoredFrameworksAllowed: false`
- `frameworkDependenciesAllowed: false`

Damit kann ein Bundle Report belegen, dass ein Framework als externer Peer klassifiziert wurde, ohne es in XTend zu packen.

## Bundle Report Sektion

`xtend.maraca.xtensions-bundle-report.v1` enthaelt eine `xtensions`-Sektion mit:

- Artefakten
- Manifest-Fingerprints
- Artefakt-Fingerprints
- Lazy Policies
- Dependency-Klassifikationen
- Diagnostics
- ready/blocked Counts

Fehlende, inkompatible oder policy-blockierte XTensions bleiben im Report sichtbar und verschwinden nicht still aus dem Bundle.

## Dependency Policy

XTN-03 erlaubt Frameworknamen in Manifests als deklarative Zielklasse oder externe Peer-Klassifikation. Es erlaubt keine Root-, Workspace-, vendored-, bundled- oder packageIncluded Framework-Dependency.

Erlaubt:

```json
{
  "name": "react",
  "classification": "external-peer",
  "bundled": false,
  "packageIncluded": false
}
```

Blockiert:

```json
{
  "name": "react",
  "classification": "vendored",
  "bundled": true,
  "packageIncluded": true
}
```

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `xtensions.maraca.manifest_missing` | Manifest fehlt |
| `xtensions.maraca.id_missing` | Manifest-ID fehlt |
| `xtensions.maraca.entry_missing` | Entry fehlt |
| `xtensions.maraca.framework_missing` | Framework-Zielklasse fehlt |
| `xtensions.maraca.version_missing` | Version fehlt |
| `xtensions.maraca.contract_missing` | HostController- oder SignalBridge-Contract fehlt |
| `xtensions.maraca.lazy_policy_missing` | Lazy ist nicht opt-in oder hat keine Policy |
| `xtensions.maraca.lazy_mode_invalid` | Lazy Mode ist unbekannt |
| `xtensions.maraca.integrity_missing` | SHA256 Integrity fehlt |
| `xtensions.maraca.csp_missing` | CSP-Anforderungen fehlen |
| `xtensions.maraca.fallback_missing` | Fallback fehlt oder ist ungueltig |
| `xtensions.maraca.policy_blocked` | Manifest ist durch Policy blockiert |
| `xtensions.maraca.framework_dependency` | Root-/Source-Dependency-Guard hat Framework-Code gefunden |
| `xtensions.maraca.vendored_framework` | Manifest versucht Framework zu vendorn oder ins Paket zu ziehen |

## Source of Truth

- Manifest Normalizer: `normalizeXTensionManifest()`
- Build Plan: `createMaracaXTensionBuildPlan()`
- Bundle Report: `createMaracaXTensionsBundleReport()`
- Artifact: `createXTensionArtifact()`
- Provenance: `createXTensionBuildProvenance()`
- Dependency Guard: `assertMaracaXTensionDependencyBoundary()`
- Backlog: `development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md`

## Verification

Auszufuehren nach Aenderungen:

```bash
node scripts/run_xtend_tests.js maraca-xtensions --json
node scripts/run_xtend_tests.js xtensions-host-controller --json
node scripts/run_xtend_tests.js xtensions-signal-bridge --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
```
