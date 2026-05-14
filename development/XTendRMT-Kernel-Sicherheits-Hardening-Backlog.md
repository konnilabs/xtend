# XTendRMT Kernel Sicherheits-Hardening Backlog

- Status: Active
- Datum: 14. Mai 2026
- Contract: `xtend.rmt.kernel-trust-hardening.v1`
- Zielstatus: `panic-aware-trusted-runtime`
- Scope: RMT-Kernel, Runtime-Sinks, Diagnostics, Scheduler, Command Bus, Recovery
- Bezug:
  - `xtendrmt/rmt-core.esm.js`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `xtendrmt/rmt-core.d.ts`
  - `security/trusted-dom-policy.js`
  - `security/manifest-import-policy.js`
  - `security/supply-chain-gate-policy.js`
  - `tools/rmt-language/vnext-security.js`
  - `tools/rmt-language/vnext-remote-security.js`
  - `tools/rmt-language/vnext-degradation.js`
  - `tools/rmt-language/vnext-streaming.js`
  - `tools/rmt-language/vnext-event-governance.js`
  - `fabric/hydration-policy.js`
  - `fabric/rmt-lane-mapping.js`
  - `development/XTendRMT-Kernel-Trust-Hardening-Contract.md`
  - `development/WP-RKSH-00-Audit-Befund-Threat-Model-und-Panic-Scope-ratifizieren.md`
  - `development/XTendRMT-Kernel-Trust-Authority-Contract.md`
  - `development/WP-RKSH-01-KernelTrustAuthority-Contract-definieren.md`
  - `development/XTendRMT-Kernel-Trusted-DOM-Runtime-Contract.md`
  - `development/WP-RKSH-02-Runtime-Trust-Sink-Adapter-anbinden.md`
  - `development/XTendRMT-Kernel-Binding-Security-Contract.md`
  - `development/WP-RKSH-03-Attribute-URL-und-Property-Policies-haerten.md`
  - `development/XTendRMT-Kernel-Panic-Monitor-Contract.md`
  - `development/WP-RKSH-04-PanicMonitor-State-Machine-bauen.md`
  - `development/XTendRMT-Kernel-Recovery-Contract.md`
  - `development/WP-RKSH-05-Quarantaene-Rollback-und-sicheren-Fallback-modellieren.md`
  - `development/XTendRMT-Kernel-Escalation-Contract.md`
  - `development/WP-RKSH-06-Diagnostics-und-Command-Bus-Eskalation-anbinden.md`
  - `development/XTendRMT-Kernel-Scheduler-Failure-Contract.md`
  - `development/WP-RKSH-07-Scheduler-Failure-Semantik-korrigieren.md`
  - `development/XTendRMT-Kernel-Policy-Parity-Contract.md`
  - `development/WP-RKSH-08-Compile-Time-Runtime-Policy-Paritaet-herstellen.md`
  - `development/XTendRMT-Kernel-Security-Regression-Contract.md`
  - `development/WP-RKSH-09-Negative-Fixtures-Fuzzing-und-Browser-Smokes-erweitern.md`
  - `development/XTendRMT-Kernel-Artifact-Parity-Contract.md`
  - `development/WP-RKSH-10-Buildprozess-und-Artefakt-Paritaet-fuer-neue-Layer-absichern.md`
  - `development/XTendRMT-Kernel-Migration-Authoring-Incident-Handoff-Contract.md`
  - `development/WP-RKSH-11-Migration-Authoring-und-Incident-Handoff-dokumentieren.md`
  - `development/WP-E15-13-Trust-Boundaries-Sanitizing-und-Security-Policies-integrieren.md`
  - `development/XTendRMT-vNext-Security-Policy-Contract.md`
  - `development/XTend-Epic13-Trusted-DOM-Boundary-Contract.md`
  - `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md`

## Zweck

Dieses Backlog ueberfuehrt den RMT-Kernel-Audit vom 14. Mai 2026 in eine konkrete Sicherheits-Haertungswelle. Ziel ist, SilentError-Risiken im Kernel zu reduzieren, Panic-Zustaende aktiv erkennbar zu machen und Recovery-Massnahmen als deterministische Runtime-Faehigkeit zu verankern.

Der Kernel darf sicherheitsrelevante Fehler nicht nur diagnostizieren oder lokal in `failed`, `degraded` oder `skipped` normalisieren. Er braucht eine interne Trust-Schicht als Wahrheitsquelle, die Runtime-Outputs vor dem Commit bewertet, fehlerhafte Outputs blockiert, Panic-Zustaende klassifiziert und Recovery ausloest.

## Audit-Ausgangslage

Der RMT-Kernel ist ein generiertes Runtime-Artefakt mit mehreren vorhandenen Schutz- und Abstraktionsebenen:

- Engine-Komposition mit Scheduler, Priority Queue, Diagnostics Hub, Reactivity, Command Bus und Host Adapter.
- Template-Pipeline mit Registry, Loader, Compiler, Artifacts, Runtime Renderer und Execution Path.
- Runtime-Targets fuer Browser, Detached DOM, Worker-Prerender, Server-Prerender und Product Surface.
- vNext-Security-Contract fuer Trust Boundaries, Sanitizing und Security Postures.
- Remote-Security-Contract mit deny-by-default Capabilities, Origin-, Integrity-, CSP- und Sandbox-Pruefung.
- Degradation-, Streaming-, Lifecycle- und Event-Governance-Contracts.
- Trusted-DOM-Policy und Sanitizer als eigenstaendiges Security-Modul.
- Manifest-, Import- und Supply-Chain-Gates ausserhalb des Kernels.

Die geprueften lokalen Gates sind aktuell gruen:

```bash
node scripts/run_xtend_tests.js rmt-compatibility rmt-vnext-security rmt-vnext-degradation rmt-vnext-remote-security rmt-vnext-streaming rmt-vnext-event-governance --json
node scripts/verify_xtendrmt_artifact_parity.js --json
```

Diese Gates bestaetigen Contract- und Artefaktparitaet, ersetzen aber keine Runtime-Trust-Enforcement-Schicht.

## Leitentscheidung

Runtime-Output ist erst gueltig, wenn der Kernel ihn als vertrauenswuerdig klassifiziert hat.

Ab dieser Haertungswelle gilt:

- Die Trust-Schicht ist eine Kernel-Faehigkeit, kein reines Tooling- oder Docs-Artefakt.
- Alle unsicheren Runtime-Sinks laufen ueber eine zentrale Trust Authority.
- Ein Panic-Zustand ist ein expliziter Runtime-State mit Ursache, Scope, Severity und Recovery-Policy.
- Recovery ist deterministisch, testbar und diagnostisch sichtbar.
- Diagnostics duerfen kritische Fehler nicht verschlucken, ohne Eskalation an die Panic-Schicht zu ermoeglichen.
- Compile-Time-Policies und Runtime-Enforcement muessen nachweisbar dieselben Invarianten schuetzen.
- Der generierte Kernel bleibt host-neutral, aber nicht trust-neutral.

## Audit-Findings

| ID | Schwere | Finding | Evidenz | Risiko |
|----|---------|---------|---------|--------|
| `RKSH-F01` | P0 | Keine zentrale Kernel-Trust-Authority fuer Runtime-Outputs | `xtendrmt/rmt-core.esm.js` Runtime-Sinks schreiben direkt | SilentError, Policy-Drift zwischen Contract und Runtime |
| `RKSH-F02` | P0 | HTML-Slots und Prerender-Chunks koennen direkt `innerHTML` setzen | `applySlotValue`, `applyPrerenderChunk` | XSS-/Markup-Injection, fehlerhafte UI ohne Kernel-Block |
| `RKSH-F03` | P0 | Error-Boundary-Fallback-Markup wird direkt als HTML geschrieben | `applyErrorBoundaryFallback` | Recovery-Pfad kann selbst unsicher sein |
| `RKSH-F04` | P0 | Attribute und Properties werden ohne zentrale Allowlist gesetzt | `applyBindingValue` | gefaehrliche URLs, Event-Attribute, DOM-Clobbering, host-spezifische Nebenwirkungen |
| `RKSH-F05` | P1 | Diagnostics Hub, Command Bus und Lifecycle-Pfade normalisieren Fehler lokal | `createRmtDiagnosticsHub`, `createRmtCommandBus` | kritische Fehler koennen als normale Failure-Envelopes verschwinden |
| `RKSH-F06` | P1 | Scheduler-Callback-Fehler werden als `executed` mit Reason `callback_error` finalisiert | Scheduler-Callback-Pfad | falsche Erfolgsmetriken, fehlende Panic-Eskalation |
| `RKSH-F07` | P1 | Error-Snapshots enthalten nur Name und Message | `createErrorSnapshot` | unzureichende Forensik, keine robuste Recovery-Korrelation |
| `RKSH-F08` | P1 | Trusted-DOM-Policy existiert separat, ist aber nicht sichtbar in Kernel-Sinks verdrahtet | `security/trusted-dom-policy.js` vs. Runtime Renderer | Contract besteht, Runtime kann trotzdem unsicher committen |
| `RKSH-F09` | P2 | Degradation und Backpressure sind vorhanden, aber nicht als Panic-State-Maschine modelliert | Degradation-, Scheduler- und Bridge-Layer | instabile Zustaende bleiben laenger aktiv als noetig |
| `RKSH-F10` | P2 | Kein dokumentierter Quarantaene-, Rollback- oder Kill-Switch fuer kompromittierte Surfaces | Product Surface und Remote Surface Runtime | Recovery bleibt host-spezifisch oder manuell |

## Nicht verhandelbare Regeln

### R1: Kernel Trust Authority ist Source of Truth

Der Kernel braucht eine interne `KernelTrustAuthority` oder aequivalente Abstraktion.

Pflichten:

- bewertet Runtime-Outputs vor dem Commit
- liefert strukturierte Verdicts: `trusted`, `sanitized`, `blocked`, `panic`
- enthaelt Scope: `binding`, `slot`, `prerender`, `fallback`, `remote-surface`, `adapter-output`, `diagnostics`
- enthaelt Reason Codes und Severity
- publiziert Diagnostics ueber den bestehenden Hub
- kann host-neutral betrieben und durch Host Adapter erweitert werden

Nicht ausreichend:

- nur Compile-Time-Policy
- nur Linter-Diagnostic
- nur Error Boundary
- nur Host-seitige Sanitizer-Erwartung

### R2: Alle DOM-Sinks laufen ueber Trust-Sink-Adapter

Direkte Writes auf unsichere DOM-Sinks sind im Kernel nicht mehr erlaubt.

Pflicht-Sinks:

- `innerHTML`
- `insertAdjacentHTML`
- Template-Fragmente aus HTML-Strings
- HTML-Fallbacks aus Error Boundaries
- URL-Attribute wie `href`, `src`, `srcset`, `action`, `formaction`
- Event-nahe Attribute wie `on*`
- DOM-Properties mit Seiteneffekten

Erlaubte Commit-Pfade:

- Text ueber `textContent`
- Attribute nach Allowlist und Protokollpruefung
- Properties nach Property-Policy
- HTML nur nach Trust-Verdict oder Sanitizing
- Fallback-Markup nur nach derselben Policy wie normale Template-Outputs

### R3: Panic ist ein expliziter Kernel-State

Ein Panic-Zustand darf kein impliziter Haufen aus Diagnostics, Exceptions und degradierter UI sein.

Pflichtfelder:

- `panicId`
- `state`: `none`, `suspected`, `active`, `recovering`, `recovered`, `failed`
- `severity`: `warning`, `degraded`, `critical`, `fatal`
- `scope`: Kernel, Surface, Template, Binding, Remote Surface, Adapter
- `trigger`: Trust-Verletzung, Scheduler-Failure, Command-Bus-Fehler, Recovery-Fehler, Policy-Drift
- `firstSeenAt` und `lastSeenAt`
- `correlationId`
- `recoveryAction`
- `blockedCommitCount`
- `affectedJobs`

### R4: Recovery ist deterministisch

Recovery-Massnahmen muessen vorhersagbar sein und duerfen keinen zweiten unsicheren Commit-Pfad erzeugen.

Pflichtaktionen:

- Pending Jobs fuer betroffene Scope abbrechen oder pausieren
- Surface oder Template-Root quarantainen
- unsichere Outputs nicht committen
- letzten sicheren Snapshot behalten oder wiederherstellen
- sicheren Fallback rendern, nur wenn dieser selbst Trust-geprueft ist
- Diagnostics finalisieren
- Host Adapter ueber Recovery-Outcome informieren

### R5: Diagnostics duerfen kritische Fehler nicht entkoppeln

Diagnostics-Subscriber und Command-Handler duerfen die Runtime weiter schuetzen, aber kritische Fehler muessen optional eskalieren koennen.

Pflichten:

- kritische Subscriber-/Handler-Fehler erzeugen Panic-Signale
- normale Telemetriefehler bleiben isoliert
- Escalation Policy ist konfigurierbar, aber Default schuetzt den Kernel
- Failed Envelopes enthalten Severity, Scope und Trust-Relevanz

### R6: Scheduler-Failure-Semantik ist eindeutig

Ein Callback-Fehler darf nicht als normal `executed` erscheinen.

Pflichten:

- neue Status- oder Reason-Semantik fuer `failed`, `aborted`, `panic_blocked`
- Metriken trennen erfolgreiche Ausfuehrung von fehlerhafter Ausfuehrung
- Scheduler propagiert trust-relevante Fehler an PanicMonitor
- Recovery kann Jobs abbrechen, priorisieren oder neu planen

### R7: Tooling-Policy und Runtime-Enforcement muessen Paritaet haben

Jede vNext-Security-Regel, die unsichere Outputs blockiert, braucht eine Runtime-Entsprechung.

Pflichtmatrix:

| Policy | Compile-Time | Runtime |
|--------|--------------|---------|
| Trust Boundary | `vnext-security` | Trust Authority Verdict |
| `sanitize html` | Security Policy Record | Sanitizer vor DOM-Commit |
| Remote Surface Boundary | `vnext-remote-security` | Remote Output Trust Scope |
| Degradation `blocked` | `vnext-degradation` | Panic/Recovery Action |
| Event Governance | `vnext-event-governance` | Delivery Block und Diagnostic |

### R8: Generated Artifacts bleiben pruefbar

Da der Kernel generiert ist, muss jede Haertung gegen Artefakt-Drift abgesichert werden.

Pflichten:

- Source-Modul und generiertes Artefakt bleiben synchron.
- `rmt-core.esm.js`, `rmt-runtime.esm.js`, `rmt-runtime.browser.js` und `rmt-core.d.ts` bleiben export- und typenparitaetisch.
- Neue Public APIs werden in Types und Manifest erfasst.
- `verify_xtendrmt_artifact_parity` bleibt Pflichtgate.

## Backlog-Uebersicht

| ID | Prio | Status | Bereich | Titel | Gate / Ergebnis |
|----|------|--------|---------|-------|-----------------|
| `RKSH-WP-00` | P0 | completed | Baseline | Audit-Befund, Threat Model und Panic-Scope ratifizieren | `xtend.rmt.kernel-trust-hardening.v1` |
| `RKSH-WP-01` | P0 | completed | Trust | `KernelTrustAuthority` Contract definieren | `npm run test:rmt-kernel-trust-authority` |
| `RKSH-WP-02` | P0 | completed | DOM | Runtime Trust-Sink-Adapter anbinden | `npm run test:rmt-kernel-trusted-dom-runtime` |
| `RKSH-WP-03` | P0 | completed | Bindings | Attribute-, URL- und Property-Policies haerten | `npm run test:rmt-kernel-binding-security` |
| `RKSH-WP-04` | P0 | completed | Panic | `PanicMonitor` State Machine bauen | `npm run test:rmt-kernel-panic-monitor` |
| `RKSH-WP-05` | P0 | completed | Recovery | Quarantaene, Rollback und sicheren Fallback modellieren | `npm run test:rmt-kernel-recovery` |
| `RKSH-WP-06` | P1 | completed | Diagnostics | Diagnostics und Command Bus Eskalation anbinden | `npm run test:rmt-kernel-escalation` |
| `RKSH-WP-07` | P1 | completed | Scheduler | Scheduler-Failure-Semantik korrigieren | `npm run test:rmt-kernel-scheduler-failure` |
| `RKSH-WP-08` | P1 | completed | Policy | Compile-Time-/Runtime-Policy-Paritaet herstellen | `npm run test:rmt-kernel-policy-parity` |
| `RKSH-WP-09` | P1 | completed | Tests | Negative Fixtures, Fuzzing und Browser-Smokes erweitern | `npm run test:rmt-kernel-security-regression` |
| `RKSH-WP-10` | P2 | completed | Artifacts | Buildprozess und Artefakt-Paritaet fuer neue Layer absichern | `npm run test:rmt-artifact-parity` |
| `RKSH-WP-11` | P2 | completed | Docs | Migration, Authoring und Incident-Handoff dokumentieren | `npm run test:rmt-kernel-handoff-docs` |

## Workpackages im Detail

### RKSH-WP-00 - Audit-Befund, Threat Model und Panic-Scope ratifizieren

- Status: `completed`
- Prioritaet: `P0`
- Ergebnis: `xtend.rmt.kernel-trust-hardening.v1` als akzeptierter Contract
- Artefakte:
  - `development/XTendRMT-Kernel-Trust-Hardening-Contract.md`
  - `development/WP-RKSH-00-Audit-Befund-Threat-Model-und-Panic-Scope-ratifizieren.md`

Aufgaben:

- Audit-Findings `RKSH-F01` bis `RKSH-F10` bestaetigen.
- Panic-relevante Scopes festlegen.
- SilentError-Definition fuer den Kernel formulieren.
- Abgrenzung zwischen normalen Diagnostics, Degradation und Panic dokumentieren.
- Bestehende vNext-Security-, Remote-Security- und Degradation-Contracts referenzieren.

Akzeptanz:

- Contract benennt Runtime-Sinks, Trust-Grenzen und Recovery-Ziele.
- Jede P0-Luecke ist einem Workpackage zugeordnet.
- Gate-Strategie ist dokumentiert.
- `RKSH-WP-01` ist startbar.

### RKSH-WP-01 - KernelTrustAuthority Contract definieren

- Status: `completed`
- Prioritaet: `P0`
- Zielartefakte:
  - Runtime-Contract fuer Trust Verdicts
  - TypeScript-Definitionen
  - Diagnostics-Schema
  - Host-Adapter-Erweiterung, falls noetig
- Artefakte:
  - `tools/rmt-language/kernel-trust-authority.js`
  - `tools/rmt-language/kernel-trust-authority.d.ts`
  - `development/XTendRMT-Kernel-Trust-Authority-Contract.md`
  - `development/WP-RKSH-01-KernelTrustAuthority-Contract-definieren.md`
  - `tests/rmt-language/rmt_kernel_trust_authority_suite.js`

Aufgaben:

- `KernelTrustAuthority` API entwerfen.
- Verdict-Envelope fuer `trusted`, `sanitized`, `blocked`, `panic` definieren.
- Reason Codes fuer HTML, Attribute, Property, Remote Surface und Adapter Output erfassen.
- Diagnostics-Hub-Integration entwerfen.
- Default-Policy host-neutral halten.

Akzeptanz:

- Jeder Runtime-Output kann einem Trust Scope zugeordnet werden.
- Blockierte Outputs erzeugen strukturierte Diagnostics.
- Trust Verdicts sind serialisierbar und testbar.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json
```

### RKSH-WP-02 - Runtime Trust-Sink-Adapter anbinden

- Status: `completed`
- Prioritaet: `P0`
- Zielartefakte:
  - Trust-Sink-Adapter fuer HTML-Sinks
  - Integration in Template Runtime Renderer
  - Negativtests fuer unsichere HTML-Fragmente
- Artefakte:
  - `xtendrmt/rmt-core.esm.js`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `xtendrmt/rmt-core.d.ts`
  - `tests/rmt-language/rmt_kernel_trusted_dom_runtime_suite.js`
  - `development/XTendRMT-Kernel-Trusted-DOM-Runtime-Contract.md`
  - `development/WP-RKSH-02-Runtime-Trust-Sink-Adapter-anbinden.md`

Aufgaben:

- Direkte `innerHTML`-Writes aus Slot-, Prerender- und Error-Fallback-Pfaden ersetzen.
- `security/trusted-dom-policy.js` oder aequivalente Kernel-Policy als Runtime-Enforcement anbinden.
- HTML-Fallbacks mit derselben Policy wie normale Outputs pruefen.
- Optional sanitized Output als `sanitized` Verdict markieren.

Akzeptanz:

- Kein gepruefter unsicherer HTML-String erreicht einen DOM-Sink ohne Verdict.
- Fallback-Markup ist nicht privilegiert.
- Tests decken `script`, `on*`, `javascript:`, `srcdoc` und `iframe` ab.
- Runtime Evidence ist ueber `listTrustVerdicts()` sichtbar.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js rmt-kernel-trusted-dom-runtime --json
```

Package-Script:

```bash
npm run test:rmt-kernel-trusted-dom-runtime
```

### RKSH-WP-03 - Attribute-, URL- und Property-Policies haerten

- Status: `completed`
- Prioritaet: `P0`
- Zielartefakte:
  - Attribute-Allowlist
  - URL-Protokollpolicy
  - Property-Write-Policy
  - Binding-Security-Fixtures
- Artefakte:
  - `xtendrmt/rmt-core.esm.js`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `tests/rmt-language/rmt_kernel_binding_security_suite.js`
  - `development/XTendRMT-Kernel-Binding-Security-Contract.md`
  - `development/WP-RKSH-03-Attribute-URL-und-Property-Policies-haerten.md`

Aufgaben:

- `setAttribute`-Pfad ueber Trust Authority fuehren.
- URL-Attribute separat klassifizieren.
- `on*` Attribute blockieren.
- `data-*` und `aria-*` kontrolliert erlauben.
- DOM-Properties mit Seiteneffekten blockieren oder allowlisten.
- Diagnostics fuer blockierte Bindings publizieren.

Akzeptanz:

- Gefaehrliche URL-Protokolle werden blockiert.
- Event-Handler-Attribute koennen nicht aus Templates gesetzt werden.
- Property-Writes sind nachvollziehbar begrenzt.
- Blockierte Bindings erzeugen `rmt.kernel.trust` Diagnostics.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js rmt-kernel-binding-security --json
```

Package-Script:

```bash
npm run test:rmt-kernel-binding-security
```

### RKSH-WP-04 - PanicMonitor State Machine bauen

- Status: `completed`
- Prioritaet: `P0`
- Zielartefakte:
  - `PanicMonitor`
  - Panic-State-Snapshot
  - Escalation Policy
  - Diagnostics Events
  - `development/XTendRMT-Kernel-Panic-Monitor-Contract.md`
  - `development/WP-RKSH-04-PanicMonitor-State-Machine-bauen.md`
  - `tools/rmt-language/kernel-panic-monitor.js`
  - `tools/rmt-language/kernel-panic-monitor.d.ts`

Aufgaben:

- Panic-State-Modell mit `none`, `suspected`, `active`, `recovering`, `recovered`, `failed` implementiert.
- Trigger aus Trust Authority, Scheduler, Command Bus, Diagnostics und Adapter Outcomes aufgenommen.
- Schwellwerte fuer wiederholte Blockierungen, kritische Trust-Verletzungen und Recovery-Fehler definiert.
- Panic-Snapshots fuer Tests und Host Adapter bereitgestellt.
- Runtime-Renderer, Binding-Session und Execution-Path liefern `getPanicSnapshot()` und `listPanicEvents()`.

Akzeptanz:

- Kritische Trust-Verletzungen fuehren deterministisch zu `active`.
- Recovery-Start und -Ende sind sichtbar.
- Panic-Signale sind korrelierbar und nicht nur Logausgaben.
- Lokales Gate: `node scripts/run_xtend_tests.js rmt-kernel-panic-monitor --json`.

### RKSH-WP-05 - Quarantaene, Rollback und sicheren Fallback modellieren

- Status: `completed`
- Prioritaet: `P0`
- Zielartefakte:
  - Recovery Policy
  - Surface Quarantine
  - Safe Snapshot Restore
  - Safe Fallback Renderer
  - `development/XTendRMT-Kernel-Recovery-Contract.md`
  - `development/WP-RKSH-05-Quarantaene-Rollback-und-sicheren-Fallback-modellieren.md`
  - `tools/rmt-language/kernel-recovery.js`
  - `tools/rmt-language/kernel-recovery.d.ts`
  - `tests/rmt-language/rmt_kernel_recovery_suite.js`

Aufgaben:

- Betroffene Surface-, Template- oder Binding-Scopes werden quarantained.
- Pending Scheduler Jobs fuer den Scope werden pausiert und im Outcome ausgewiesen.
- Letzter sicherer Snapshot ist als Restore-Ziel modelliert.
- Sicherer Fallback wird ohne HTML-Bypass ueber Trusted-DOM-Sinks gerendert.
- Host Adapter wird ueber `RecoveryOutcome` informiert.
- Runtime-Renderer, Binding-Session und Execution-Path expose `recoverFromPanic()`, `rememberSafeSnapshot()` und `listRecoveryOutcomes()`.

Akzeptanz:

- Recovery erzeugt keinen neuen unsicheren DOM-Commit.
- Nicht betroffene Scopes laufen weiter, sofern sicher.
- Recovery-Failure wird als eigener Panic-Trigger erfasst.
- Lokales Gate: `node scripts/run_xtend_tests.js rmt-kernel-recovery --json`.

### RKSH-WP-06 - Diagnostics und Command Bus Eskalation anbinden

- Status: `completed`
- Prioritaet: `P1`
- Zielartefakte:
  - Eskalierbare Diagnostics-Events
  - Failed Envelope Severity
  - Command Bus Panic Hooks
  - `development/XTendRMT-Kernel-Escalation-Contract.md`
  - `development/WP-RKSH-06-Diagnostics-und-Command-Bus-Eskalation-anbinden.md`
  - `tools/rmt-language/kernel-escalation.js`
  - `tools/rmt-language/kernel-escalation.d.ts`
  - `tests/rmt-language/rmt_kernel_escalation_suite.js`

Aufgaben:

- Diagnostics-Subscriber-Fehler werden nach Severity klassifiziert.
- Command-Handler-Fehler erhalten Scope, Severity und Trust-Relevanz.
- `failed` Responses koennen ueber Escalation Envelope an PanicMonitor melden.
- Existing Verhalten fuer nichtkritische Diagnostics bleibt stabil.
- Diagnostics Hub und Command Bus expose `recordEscalation()`, `listEscalations()` und `getEscalationPolicy()`.

Akzeptanz:

- Kritische Handler-Fehler verschwinden nicht als normale failed Response.
- Telemetriefehler destabilisieren die Runtime nicht.
- Tests unterscheiden non-critical und panic-critical Failures.
- Lokales Gate: `node scripts/run_xtend_tests.js rmt-kernel-escalation --json`.

### RKSH-WP-07 - Scheduler-Failure-Semantik korrigieren

- Status: `completed`
- Prioritaet: `P1`
- Zielartefakte:
  - eindeutige Scheduler-Statuswerte
  - Panic-aware Job Finalization
  - Scheduler Failure Tests
  - `development/XTendRMT-Kernel-Scheduler-Failure-Contract.md`
  - `development/WP-RKSH-07-Scheduler-Failure-Semantik-korrigieren.md`
  - `tools/rmt-language/kernel-scheduler-failure.js`
  - `tools/rmt-language/kernel-scheduler-failure.d.ts`
  - `tests/rmt-language/rmt_kernel_scheduler_failure_suite.js`

Aufgaben:

- Callback-Fehler werden nicht mehr als normaler `executed` Erfolg ausgewiesen.
- Statuswerte fuer `failed`, `aborted` und `panic_blocked` sind definiert und typisiert.
- Scheduler-Backpressure ist mit PanicMonitor gekoppelt, wenn kritische Schwellen erreicht sind.
- Job-Abbruch und Recovery-Neuplanung sind artifact-level getestet.

Akzeptanz:

- Metriken trennen Erfolg, Fehler und Panic-Block sauber.
- Callback-Fehler koennen Recovery ausloesen.
- Bestehende Scheduler-Kompatibilitaet bleibt nachvollziehbar migriert.
- Lokales Gate: `node scripts/run_xtend_tests.js rmt-kernel-scheduler-failure --json`.

### RKSH-WP-08 - Compile-Time-/Runtime-Policy-Paritaet herstellen

- Status: `completed`
- Prioritaet: `P1`
- Zielartefakte:
  - Policy-Paritaetsmatrix
  - Runtime Enforcement Report
  - Security Runtime Parity Gate
  - `development/XTendRMT-Kernel-Policy-Parity-Contract.md`
  - `development/WP-RKSH-08-Compile-Time-Runtime-Policy-Paritaet-herstellen.md`
  - `tools/rmt-language/kernel-policy-parity.js`
  - `tools/rmt-language/kernel-policy-parity.d.ts`
  - `tests/rmt-language/rmt_kernel_policy_parity_suite.js`

Aufgaben:

- vNext-Security-Policies sind auf Runtime-Scopes gemappt.
- Remote-Security-Policy ist mit dem Runtime-Scope `remote-output` verbunden.
- Degradation `blocked` ist mit Panic/Recovery-Semantik verbunden.
- Streaming Error Paths sind in Panic-/Scheduler-Trigger eingeordnet.
- Event Governance Delivery Blocks werden als Runtime-Signale geprueft.

Akzeptanz:

- Jede compile-time blockierende Security-Regel hat einen Runtime-Gegenpart.
- Runtime-Reports zeigen angewendete Policy und Verdict.
- Drift zwischen Contract und Runtime wird im Gate erkannt.
- Lokales Gate: `node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json`.

### RKSH-WP-09 - Negative Fixtures, Fuzzing und Browser-Smokes erweitern

- Status: `completed`
- Prioritaet: `P1`
- Zielartefakte:
  - Kernel Security Regression Suite
  - DOM-Sink Negativfixtures
  - Panic/Recovery Browser Smoke
  - Artifact-level Regression
  - `development/XTendRMT-Kernel-Security-Regression-Contract.md`
  - `development/WP-RKSH-09-Negative-Fixtures-Fuzzing-und-Browser-Smokes-erweitern.md`
  - `tools/rmt-language/kernel-security-regression.js`
  - `tools/rmt-language/kernel-security-regression.d.ts`
  - `tests/rmt-language/fixtures/kernel-security-regression-fixtures.json`
  - `tests/rmt-language/rmt_kernel_security_regression_suite.js`
  - `tests/browser/fixtures/rmt-kernel-security-regression-smoke.html`

Aufgaben:

- Fixtures fuer boesartige HTML-Fragmente, Attribute, URLs und Properties sind angelegt.
- Wiederholte Failure-Sequenzen gegen Panic-Schwellen sind artifact-level getestet.
- Browsernahe Smokes fuer Slot-, Prerender- und Error-Fallback-Pfade sind gebaut.
- Snapshot prueft: kein unsicherer Commit, korrekte Panic-Diagnostics, Recovery-Outcome.

Akzeptanz:

- Tests schlagen fehl, wenn ein Runtime-Sink Trust Authority umgeht.
- Panic- und Recovery-Pfade sind lokal reproduzierbar.
- Fixtures laufen gegen Core- und Browser-Runtime-Artefakte.
- Lokales Gate: `node scripts/run_xtend_tests.js rmt-kernel-security-regression --json`.

Lokales Gate:

```bash
node scripts/run_xtend_tests.js rmt-kernel-security-regression --json
```

### RKSH-WP-10 - Buildprozess und Artefakt-Paritaet absichern

- Status: `completed`
- Prioritaet: `P2`
- Zielartefakte:
  - Build-Handoff fuer Trust-/Panic-Layer
  - Manifest-/Types-Paritaet
  - Artifact Parity Gate Update
  - `development/XTendRMT-Kernel-Artifact-Parity-Contract.md`
  - `development/WP-RKSH-10-Buildprozess-und-Artefakt-Paritaet-fuer-neue-Layer-absichern.md`
  - `scripts/verify_xtendrmt_artifact_parity.js`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-manifest.json`
  - `xtendrmt/rmt-core.d.ts`

Aufgaben:

- Source-of-Truth fuer neue Kernel-Module ist als upstream RMT Source plus lokales RKSH-Handoff geklaert.
- Generierung von `rmt-core.esm.js`, `rmt-runtime.esm.js` und `rmt-runtime.browser.js` ist dokumentiert.
- Types fuer Trust Authority, PanicMonitor und Recovery Outcomes sind im Parity-Gate abgesichert.
- Manifest, Schema und generated Product Manifests kennen die Kernel-Hardening-Contracts.

Akzeptanz:

- Kein manuelles Bundle-Patching ohne Source-Modul-Handoff.
- Artifact-Parity-Gate kennt neue Exports.
- Runtime- und Type-Artefakte bleiben synchron.
- Pflichtgate: `node scripts/verify_xtendrmt_artifact_parity.js --json`.

Pflichtgate:

```bash
node scripts/verify_xtendrmt_artifact_parity.js --json
```

### RKSH-WP-11 - Migration, Authoring und Incident-Handoff dokumentieren

- Status: `completed`
- Prioritaet: `P2`
- Zielartefakte:
  - Security-Hardening-Migration-Guide
  - RMT Authoring Guidelines fuer Trusted Outputs
  - Panic/Recovery Incident Handoff
  - `development/XTendRMT-Kernel-Migration-Authoring-Incident-Handoff-Contract.md`
  - `development/WP-RKSH-11-Migration-Authoring-und-Incident-Handoff-dokumentieren.md`
  - `docs/rmt-kernel-security-hardening-migration.md`
  - `docs/rmt-kernel-trusted-output-authoring.md`
  - `docs/rmt-kernel-panic-recovery-incident-handoff.md`
  - `tests/rmt-language/rmt_kernel_handoff_docs_suite.js`

Aufgaben:

- Autorinnen und Autoren wissen, wann HTML, Attribute und Remote Outputs Trust Boundaries brauchen.
- Migration fuer bisher erlaubte unsichere Markup-Pfade ist beschrieben.
- Incident- und Diagnostics-Auswertung ist dokumentiert.
- SemVer-Impact fuer blockierte Legacy-Outputs ist bewertet.

Akzeptanz:

- Breaking- oder behavior-changing Blocks sind dokumentiert.
- Host-Teams wissen, wie Panic-Diagnostics auszuwerten sind.
- RMT-Authoring zeigt sichere Fallback- und Sanitizing-Muster.
- Lokales Gate: `node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json`.
- Package-Script: `npm run test:rmt-kernel-handoff-docs`.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json
```

## Gate Matrix

Bestehende Gates, die weiter Pflicht bleiben:

```bash
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js rmt-vnext-security --json
node scripts/run_xtend_tests.js rmt-vnext-degradation --json
node scripts/run_xtend_tests.js rmt-vnext-remote-security --json
node scripts/run_xtend_tests.js rmt-vnext-streaming --json
node scripts/run_xtend_tests.js rmt-vnext-event-governance --json
node scripts/verify_xtendrmt_artifact_parity.js --json
```

Neue und geplante Kernel-Gates:

```bash
node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json
node scripts/run_xtend_tests.js rmt-kernel-trusted-dom-runtime --json
node scripts/run_xtend_tests.js rmt-kernel-binding-security --json
node scripts/run_xtend_tests.js rmt-kernel-panic-monitor --json
node scripts/run_xtend_tests.js rmt-kernel-recovery --json
node scripts/run_xtend_tests.js rmt-kernel-escalation --json
node scripts/run_xtend_tests.js rmt-kernel-scheduler-failure --json
node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json
node scripts/run_xtend_tests.js rmt-kernel-security-regression --json
node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json
```

## Definition of Done

Die Sicherheits-Haertung gilt erst als abgeschlossen, wenn:

- alle Runtime-Sinks ueber Trust Authority laufen
- `innerHTML`- und HTML-Fragment-Pfade kein Policy-Bypass mehr sind
- Attribute und Properties zentrale Sicherheitsregeln durchlaufen
- Panic-State und Recovery-Outcome als Runtime-Snapshots sichtbar sind
- Scheduler-, Command-Bus- und Diagnostics-Fehler Eskalationspfade haben
- Compile-Time-Policies und Runtime-Enforcement in einer Paritaetsmatrix abgedeckt sind
- negative Browser-/Runtime-Fixtures die relevanten SilentError-Pfade reproduzierbar blockieren
- Artefakt-Paritaet fuer Core, Runtime, Browser Runtime, Types, Schema und Manifest besteht
- Migration und Incident-Handoff dokumentiert sind

## Residual Policy

Residuals sind nur zulaessig, wenn sie explizit als temporaer, nicht sicherheitskritisch und mit Ablaufdatum markiert sind.

Nicht akzeptable Residuals:

- direkter HTML-Commit ohne Trust Verdict
- direkter Event-Attribute-Commit
- `javascript:` oder vergleichbare gefaehrliche URL-Protokolle
- Panic-Trigger ohne Diagnostics
- Recovery-Fallback mit unsicherem HTML-Bypass
- generierte Artefakte ohne Source-of-Truth-Handoff

Akzeptable temporaere Residuals:

- report-only Trust Verdicts fuer nichtkritische Property-Writes waehrend der Einfuehrungsphase
- Legacy-Kompatibilitaetsalias, wenn er denselben Trust-Pfad nutzt
- Host-Adapter-spezifische Erweiterung, wenn Default-Policy sicher bleibt

## Erste konkrete Umsetzungsempfehlung

1. `RKSH-WP-00` bis `RKSH-WP-11` sind abgeschlossen: Baseline, Trust Authority, Trusted DOM Runtime Gate, Binding Security, PanicMonitor, Recovery, Escalation, Scheduler-Failure-Semantik, Policy-Paritaet, negative Security Regression, Kernel-Artefakt-Paritaet und Handoff-Dokumentation stehen.
2. Migration in Host-Projekten anhand von `docs/rmt-kernel-security-hardening-migration.md` planen.
3. Incident-Auswertung in Host-Runbooks mit `docs/rmt-kernel-panic-recovery-incident-handoff.md` synchronisieren.
