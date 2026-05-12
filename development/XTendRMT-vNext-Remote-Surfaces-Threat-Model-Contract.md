# XTendRMT vNext Remote Surfaces Threat Model Contract

- Status: `accepted by WP-E16-01`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Contract: `xtend.rmt.vnext-remote-surfaces-threat-model.v1`
- Epic Contract: `xtend.rmt.vnext-remote-surfaces.v1`
- Depends on:
  - `xtend.rmt.vnext-release-handoff.v1`
  - `xtend.rmt.vnext-surface-registry.v1`
  - `xtend.rmt.vnext-event-action-contract.v1`
  - `xtend.rmt.vnext-security-policy-contract.v1`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Boundary: `no-implicit-global-event-bus`
- Boundary: `remote-surfaces-require-explicit-owner-version-integrity-and-fallback`
- Zielzustand: `rmt-vnext-remote-threat-model-ready`
- Folgepakete: `WP-E16-02`, `WP-E16-03`, `WP-E16-04`, `WP-E16-05`, `WP-E16-06`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-remote-surfaces-threat-model.v1"
```

Dieser Contract friert die Sicherheits- und Stabilitaetsannahmen fuer RMT vNext Remote Surfaces ein. Er verhindert, dass Remote Surfaces als freier Runtime-Loader, impliziter globaler Event Bus oder unkontrollierter MFE-Kopplungsmechanismus in den RMT-Kernel rutschen.

RMT beschreibt Remote Surfaces nur deklarativ. Der Runtime Host darf daraus konkrete Lade-, Mount-, Cache-, Rollback- und Isolation-Entscheidungen ableiten. Der RMT-Kernel laedt, evaluiert oder instanziiert keine Remote-Artefakte.

## Protected Assets

| Asset | Schutzbedarf |
| --- | --- |
| App Shell Integrity | Remote Surfaces duerfen Shell-Zustand, Routing, Session und Layout nicht unkontrolliert veraendern |
| User Data und Session Context | Cross Surface Events duerfen keine impliziten sensiblen Payloads transportieren |
| Surface Registry Snapshot | Discoverability darf keine unsicheren oder ownerlosen Surfaces als `ready` ausweisen |
| Event Protocol | Events brauchen Owner, Richtung, Payload Shape, Version und Scope |
| Remote Manifest | Origin, Version, Integrity und Capabilities muessen pruefbar sein |
| Fallback und Degradation | Ausfaelle muessen kontrolliert auf `degraded` oder `blocked` fallen |
| Tooling Diagnostics | CI, LSP und Agenten muessen unsichere Remote-Fakten eindeutig sehen |

## Trust Boundaries

| Boundary | Beschreibung | Regel |
| --- | --- | --- |
| RMT Kernel Boundary | Parser, Compiler und Registry-Normalisierung | keine Remote Loads, kein Eval, keine Host-Runtime-Imports |
| Remote Manifest Boundary | Manifestquelle, Version und Integrity | nur signierte oder integritaetsgepruefte Manifeste duerfen produktionsfaehig sein |
| Shell Adapter Boundary | Host-spezifisches Laden, Mounting und Isolation | Runtime Host ist verantwortlich, RMT liefert nur Contracts |
| Cross Surface Event Boundary | Events zwischen Surfaces und Shell | keine globalen Wildcards, keine Payloads ohne Schema |
| Degradation Boundary | Fallback, Capability Mismatch und Versionskonflikt | Remote Surface ohne Fallback blockiert im strikten Gate |

## Threat Classes

| Threat | Risiko | Required Control |
| --- | --- | --- |
| Unsigned Remote Manifest | Manipulierte Surface-Quelle wird geladen | `integrity`, `origin`, Manifest Catalog und strict Diagnostic |
| Version Drift | Shell und Remote Surface verstehen unterschiedliche Contracts | `versionRange`, `minShellVersion`, Compatibility Report |
| Capability Escalation | Remote Surface nutzt nicht deklarierte Host-Faehigkeiten | deny-by-default Capability Policy |
| Event Coupling Chaos | Cross Surface Events werden implizit und unowned | `emits`/`consumes` mit Owner, Direction, Scope und Payload |
| Sensitive Payload Leakage | Session- oder Userdaten fliessen unkontrolliert ueber Events | Payload Schema, Sensitivity, Shell Scope und Policy Gate |
| Missing Fallback | Remote-Ausfall bricht Shell-Bereich hart | verpflichtende `fallback` und Degradation Policy |
| Registry Spoofing | ownerlose oder unbekannte Surfaces erscheinen als produktionsbereit | Ownership und Discoverability Checks |
| Runtime Boundary Collapse | RMT-Kernel wird zur Host-Runtime | `no-remote-runtime-execution-in-rmt-kernel` als harte Boundary |

## Mandatory Facts

Ein Remote Surface Record ist nur im strikten Modus gueltig, wenn diese Fakten explizit oder ueber einen validierten Catalog ableitbar sind:

- `owner`
- `version`
- `remote`
- `origin`
- `integrity`
- `trustBoundary`
- `allowedCapabilities`
- `shellTargets`
- `eventEmits`
- `eventConsumes`
- `payloadSchemas`
- `fallback`
- `degradationPolicy`

## Diagnostic Baseline

| Code | Severity | Bedeutung |
| --- | --- | --- |
| `rmt.vnext.remote.owner_missing` | error | Remote Surface besitzt keinen Owner |
| `rmt.vnext.remote.version_missing` | error | Version oder Version Range fehlt |
| `rmt.vnext.remote.origin_missing` | error | Manifest Origin fehlt |
| `rmt.vnext.remote.integrity_missing` | error | Manifest Integrity fehlt |
| `rmt.vnext.remote.trust_boundary_missing` | error | Remote Surface hat keine Remote Trust Boundary |
| `rmt.vnext.remote.capability_implicit` | error | Capability wird genutzt, aber nicht explizit erlaubt |
| `rmt.vnext.remote.fallback_missing` | error | Remote Surface hat keinen Fallback |
| `rmt.vnext.remote.degradation_missing` | error | Degradation Policy fehlt |
| `rmt.vnext.remote.event.owner_missing` | error | Cross Surface Event hat keinen Owner |
| `rmt.vnext.remote.event.payload_missing` | error | Cross Surface Event hat kein Payload Schema |
| `rmt.vnext.remote.event.direction_invalid` | error | Event-Richtung ist unklar oder widerspruechlich |
| `rmt.vnext.remote.registry.owner_unknown` | error | Registry kann Surface-Owner nicht aufloesen |

## Source-of-Truth

| Artefaktklasse | Fuehrende Rolle |
| --- | --- |
| `development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md` | Epic-Plan, Scope, Workpackage-Reihenfolge und Handoff |
| `development/XTendRMT-vNext-Remote-Surfaces-Threat-Model-Contract.md` | Sicherheits- und Stabilitaetsbaseline fuer alle E16-Folgepakete |
| `tools/rmt-language/` | host-neutrale Parser-, Compiler-, Registry-, Diagnostic- und Report-Fakten |
| `tools/rmt-linter/` | CLI-/CI-Diagnostics ohne Remote Runtime Execution |
| `tools/rmt-language-server/` | Editor-Adapter auf denselben Language-Fakten |
| `xtendrmt/` | Reference Demos und stabile Core Outputs ohne produktive Netzwerkpflicht |
| `tests/rmt-language/` | Contract-, Registry-, Event-, Degradation- und Golden-Gates |
| `docs/` | oeffentliche Authoring-, Migration- und Handoff-Dokumentation |

## Handoff Rules

- `WP-E16-02` darf Manifest- und Core-Felder definieren, aber keinen Runtime Loader bauen.
- `WP-E16-03` darf `surface.registry` erweitern, aber keine SurfaceManager-Sonderlogik in den RMT-Kernel ziehen.
- `WP-E16-04` muss Fallback und Degradation als Pflichtmodell behandeln.
- `WP-E16-05` muss Remote Surface Security strenger behandeln als lokale Surface Security.
- `WP-E16-06` muss Cross Surface Events als Protocol Records modellieren, nicht als globalen Bus.

## Gate

`WP-E16-01` ist ein Scope- und Threat-Model-Paket. Der lokale Gate ist ein Dokumentations- und Referenzpfad-Gate:

```bash
node scripts/run_xtend_tests.js references --json
```

Ein Parser-, Compiler- oder Runtime-Gate entsteht erst ab `WP-E16-02`.
