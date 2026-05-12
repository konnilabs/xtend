# WP-E16-01 - Epic-Identity, Threat Model und Source-of-Truth einfrieren

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Epic Contract: `xtend.rmt.vnext-remote-surfaces.v1`
- WP Contract: `xtend.epic16.wp01.remote-surfaces-threat-model.v1`
- Threat Model Contract: `xtend.rmt.vnext-remote-surfaces-threat-model.v1`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Boundary: `no-implicit-global-event-bus`
- Boundary: `remote-surfaces-require-explicit-owner-version-integrity-and-fallback`
- Zielzustand: `rmt-vnext-remote-threat-model-ready`
- Gate: Dokumentationsreview gegen E15 Release Handoff, Surface Registry, Event Action und Security Policy Contracts

## Ziel

`WP-E16-01` macht Epic 16 operativ startbar. Das Paket friert fest, dass Remote Surfaces in RMT vNext als deklarative Enterprise-MFE-Contracts modelliert werden, nicht als Runtime-Loader im RMT-Kernel.

Die wichtigste Entscheidung:

- RMT beschreibt Remote Surfaces, Registry-Fakten, Event-Protokolle und Degradation.
- Parser, Compiler, Linter, LSP und Agenten arbeiten gegen host-neutrale Records.
- Der Runtime Host entscheidet ueber Laden, Mounting, Isolation, Rollback und Telemetrie.
- Cross Surface Events sind typisierte Protocol Records, kein impliziter globaler Event Bus.

## Umgesetzt

- Epic 16 als eigenstaendiges Enterprise-MFE-Epic mit Contract `xtend.rmt.vnext-remote-surfaces.v1` bestaetigt
- Threat Model Contract `xtend.rmt.vnext-remote-surfaces-threat-model.v1` angelegt
- Kernel-Boundary `no-remote-runtime-execution-in-rmt-kernel` als harte Schutzregel festgelegt
- Cross-Surface-Boundary `no-implicit-global-event-bus` festgelegt
- Pflichtprinzip `remote-surfaces-require-explicit-owner-version-integrity-and-fallback` eingefroren
- Source-of-Truth fuer Epic, Workpackages, Language Layer, Tooling, Demos, Tests und Docs stabilisiert
- `WP-E16-02` als naechstes startbares Paket markiert

## Threat-Model-Entscheidung

Remote Surfaces sind per Default nicht vertrauenswuerdig. Ein produktionsfaehiger Remote Surface Record braucht mindestens:

- Owner
- Version oder Version Range
- Remote Manifest ID
- erlaubte Origin
- Integrity-Fakten
- Remote Trust Boundary
- deny-by-default Capabilities
- Shell Targets und Lanes
- typisierte `emits` und `consumes`
- Payload Schemas
- Fallback
- Degradation Policy

Fehlende Fakten werden im strikten Gate als Hard Error behandelt. Hosts duerfen unvollstaendige Remote Surface Records nicht still laden.

## Source-of-Truth

| Artefaktklasse | Rolle |
|----------------|-------|
| `development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md` | Epic-Plan, Workpackage-Backlog, Scope und Handoff |
| `development/WP-E16-*.md` | Workpackage-Contracts und Abnahmen |
| `development/XTendRMT-vNext-Remote-Surfaces-Threat-Model-Contract.md` | Sicherheits- und Stabilitaetsbaseline fuer E16 |
| `tools/rmt-language/` | host-neutrale Parser-, Compiler-, Registry-, Event-, Degradation- und Diagnostic-Fakten |
| `tools/rmt-linter/` | CLI-/CI-Adapter fuer Diagnostics und Reports |
| `tools/rmt-language-server/` | LSP-Adapter auf derselben Sprachebene |
| `xtendrmt/` | Reference Demos und stabile Core Outputs |
| `tests/rmt-language/` | Contract-, Registry-, Event-, Degradation- und Golden-Gates |
| `tests/browser/fixtures/` | offlinefaehige Browser-Smoke-Probes |
| `docs/` | oeffentliche Authoring-, Migration- und Handoff-Dokumentation |

## Dokumentationsreview

| Referenz | Ergebnis fuer Epic 16 |
|----------|-----------------------|
| E15 Release Handoff | E16 baut auf `rmt-vnext-release-ready` auf und bleibt additiv |
| E15 Surface Registry | Enterprise Registry erweitert lokale Surface-Fakten um Owner, Version, Remote Status, Shell Targets, Events und Fallbacks |
| E15 Event Action Contract | Cross Surface Events werden als typisierte `emits`/`consumes` Records modelliert |
| E15 Security Policy | Remote Security nutzt Trust Boundaries, CSP, Sandbox und Deny-by-default Capabilities |
| E15 Compatibility Contract | Migration bleibt opt-in und report-only per Default |
| SurfaceManager Native RMT Surfaces | SurfaceManager bleibt Runtime-/Host-Kontext, nicht Kernel-Abhaengigkeit |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Epic-Nummer ist eindeutig | erfuellt: Epic 16 |
| Epic Contract ist benannt | erfuellt: `xtend.rmt.vnext-remote-surfaces.v1` |
| Threat Model Contract ist angelegt | erfuellt |
| Kernel-Boundary ist bestaetigt | erfuellt: keine Remote Runtime Execution im RMT-Kernel |
| Event-Boundary ist bestaetigt | erfuellt: kein impliziter globaler Event Bus |
| Security-Pflichtfakten sind benannt | erfuellt |
| Source-of-Truth ist festgelegt | erfuellt |
| `WP-E16-02` ist startbar | erfuellt |

## Verifikation

Das WP-Gate ist ein Dokumentationsreview. Ein Runtime-, Parser- oder Compiler-Test ist fuer dieses Paket noch nicht erforderlich, weil Manifest-, Registry-, Event- und Compiler-Artefakte erst ab `WP-E16-02` entstehen.

Referenzpfad-Gate:

```bash
node scripts/run_xtend_tests.js references --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `7496`
- Failures: `0`
- Warnings: `0`

## Handoff

`WP-E16-01` ist abgeschlossen. `WP-E16-02` kann den Remote Surface Manifest und Core Contract definieren.

Die naechste Umsetzung soll bewusst kernel-neutral bleiben:

- Manifest Schema
- Remote Surface Core Record
- Owner-, Version-, Origin- und Integrity-Fakten
- Capability Boundary
- positive und negative Manifest-Fixtures

Noch nicht Teil von `WP-E16-02`:

- produktiver Remote Runtime Loader
- Shell-spezifisches Mounting
- Cross Surface Event Governance
- Degradation-Resolver
- Browser- oder Netzwerk-E2E
