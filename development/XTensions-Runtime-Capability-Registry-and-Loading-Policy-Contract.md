# XTensions Runtime Capability Registry and Loading Policy Contract

- Status: `accepted-by-XTN-05`
- Datum: 2026-06-20
- Workpackage: `XTN-05`
- Registry Schema: `xtend.xtensions.runtime-capability-registry.v1`
- Host Capabilities Schema: `xtend.xtensions.runtime-host-capabilities.v1`
- Adapter Record Schema: `xtend.xtensions.runtime-adapter-record.v1`
- Loading Policy Schema: `xtend.xtensions.runtime-loading-policy.v1`
- Negotiation Schema: `xtend.xtensions.runtime-capability-negotiation.v1`
- Load Decision Schema: `xtend.xtensions.runtime-load-decision.v1`
- Runtime Report Schema: `xtend.xtensions.runtime-report.v1`
- Diagnostic Schema: `xtend.xtensions.runtime-diagnostic.v1`
- Module: `tools/xtensions/runtime-capability-registry.js`
- Types: `tools/xtensions/runtime-capability-registry.d.ts`
- Fixture: `tests/fixtures/xtensions/runtime-capability-registry-valid.json`
- Local Gate: `node scripts/run_xtend_tests.js xtensions-runtime-capability-registry --json`
- Boundary: `host-local-registry-only`
- Boundary: `no-second-global-surface-registry`
- Boundary: `capability-negotiation-before-mount`
- Boundary: `adapter-loading-policy-before-dynamic-import`
- Boundary: `missing-framework-runtime-degrades-not-shell-blocks`
- Boundary: `framework-dependencies-remain-external-peer-or-host-provided`

## Zweck

XTN-05 definiert die runtime-nahe Entscheidungsschicht, ueber die ein Host XTensions registriert, Capability Negotiation ausfuehrt, Adapter-Loading erlaubt oder ablehnt und strukturierte Degradation erzeugt.

Die Registry ist ausdruecklich host-lokal. Sie ist kein Ersatz fuer Surface Registry, Enterprise Surface Registry oder Maraca Manifest. Sie ist ein abgeleiteter Runtime-Snapshot aus Host-Capabilities, Maraca-Artefakten, statischen Contracts und Host-Policy.

## Host-Lokale Registry

Eine host-lokale Registry enthaelt:

- `hostId`
- `surfaceRegistryRef`
- Host-Capabilities
- bereitgestellte Peer-Runtimes als Daten
- Loading Policy
- Adapter Records
- Indexe nach `xtensionId` und `framework`
- Diagnostics
- stabilen Fingerprint

Die Registry darf keine globale Mutation einfuehren. Adapter registrieren sich ueber bestehende Surface-/Adapter-Pfade und werden dort als host-eigene Records gehalten.

## Adapter Record

Ein Adapter Record beschreibt:

- `xtensionId`
- `framework`
- `version`
- HostController-Schema
- Entry Point als Datenrecord
- Integrity
- Fallback
- Dependency-Klassifikation
- erforderliche Host-Capabilities
- statischen Contract Snapshot
- Manifest-/Artefakt-Fingerprints

Frameworknamen sind Daten. XTN-05 importiert keine Framework-Runtime und fuehrt keine Adapter-Module aus.

## Capability Negotiation

Vor jedem Mount muss der Host pruefen:

- alle `requiredHostCapabilities` sind vorhanden
- externe Peer-Runtimes sind verfuegbar
- Peer-Versionen erfuellen deklarierte Ranges
- Framework-Dependencies sind nicht vendored, gebundled oder Root-Package-Dependencies

Fehlende Host-Capabilities blockieren die Adapter-Entscheidung. Fehlende Peer-Runtimes koennen degradieren, wenn ein Fallback vorhanden ist.

## Loading Policy

Die Default-Policy lautet:

```json
{
  "scope": "host-local",
  "allowGlobalRegistry": false,
  "dynamicImportRequiresIntegrity": true,
  "capabilityNegotiationRequired": true,
  "fallbackRequired": true,
  "missingRuntimeStrategy": "degrade-with-fallback",
  "packageFrameworkDependenciesAllowed": false,
  "vendoredFrameworksAllowed": false
}
```

Dynamic Import wird in XTN-05 nicht ausgefuehrt. Der Runtime-Record entscheidet nur, ob ein spaeterer Host-Adapter-Ladevorgang policy-seitig erlaubt waere.

## Load Decision

Ein Load Decision kann folgende Stati besitzen:

| Status | Bedeutung |
|--------|-----------|
| `loaded` | Adapter darf ueber den Host geladen werden |
| `skipped` | Adapter wurde bewusst nicht angefordert oder deaktiviert |
| `degraded` | Adapter wird durch Fallback ersetzt, App Shell bleibt aktiv |
| `failed` | angeforderter Adapter kann nicht sicher geladen oder ersetzt werden |
| `policy-blocked` | Host- oder Manifest-Policy verbietet den Adapter |

Jede Entscheidung enthaelt `runtimeExecutionRequired: false`, ein `loadToken` und Diagnostics.

## Runtime Report

Der Runtime Report fasst zusammen:

- Registry Snapshot
- Load Decisions
- Counts fuer `loaded`, `skipped`, `failed`, `degraded`, `policy-blocked`
- `appShellBlocked`
- Diagnostics

Eine fehlende Framework-Runtime darf die gesamte App Shell nicht blockieren, solange ein Fallback vorhanden ist. Der Report wird in diesem Fall `degraded`, bleibt aber `ok: true`.

## Dependency Boundary

XTN-05 bleibt frameworkless:

- keine React-, Vue-, Three.js-, Leaflet- oder Chart.js-Imports
- keine Root-/Dev-/Peer-/Optional-Dependencies fuer Framework-Fixtures im XTend-Paket
- keine vendored Dritt-Frameworks im Repo oder NPM-Paket
- Testadapter sind Contract-Stubs oder externe opt-in Peer-Harnesses

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `xtensions.runtime.adapter_missing` | angeforderter Adapter ist nicht registriert |
| `xtensions.runtime.capability_missing` | Host-Capability fehlt |
| `xtensions.runtime.peer_missing` | externe Peer-Runtime fehlt |
| `xtensions.runtime.version_incompatible` | Peer-Version passt nicht |
| `xtensions.runtime.policy_blocked` | Host- oder Manifest-Policy blockiert |
| `xtensions.runtime.integrity_missing` | Dynamic Import haette keine SHA256-Integrity |
| `xtensions.runtime.fallback_missing` | Degradation haette keinen Fallback |
| `xtensions.runtime.global_registry_forbidden` | globale Registry wurde versucht |
| `xtensions.runtime.framework_dependency` | Framework wurde vendored/gepackaged/importiert |

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js xtensions-runtime-capability-registry --json
```

Der Gate prueft Contract, Typen, Fixture, Package-Export, Runner-Integration, Dependency-Boundary, Capability Negotiation, Loading-Policy, Idempotenz, Degradation und Runtime Report.
