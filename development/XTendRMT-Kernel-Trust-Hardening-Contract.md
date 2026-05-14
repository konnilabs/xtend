# XTendRMT Kernel Trust Hardening Contract

- Status: `accepted by RKSH-WP-00`
- Datum: 14. Mai 2026
- Contract: `xtend.rmt.kernel-trust-hardening.v1`
- Threat Model: `xtend.rmt.kernel-trust-threat-model.v1`
- Panic Scope: `xtend.rmt.kernel-panic-scope.v1`
- Depends on:
  - `xtend.rmt.vnext-security-policy-contract.v1`
  - `xtend.rmt.vnext-remote-security-policy-contract.v1`
  - `xtend.rmt.vnext-degradation-policy-contract.v1`
  - `xtend.security.trusted-dom-policy.v1`
- Boundary: `runtime-output-requires-kernel-trust-verdict`
- Boundary: `unsafe-dom-sinks-require-trust-sink-adapter`
- Boundary: `panic-state-is-explicit-and-recoverable`
- Boundary: `compile-time-policy-must-have-runtime-enforcement`
- Zielzustand: `panic-aware-trusted-runtime`
- Folgepakete: `RKSH-WP-01`, `RKSH-WP-02`, `RKSH-WP-03`, `RKSH-WP-04`, `RKSH-WP-05`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.kernel-trust-hardening.v1"
```

Dieser Contract friert die Sicherheits- und Stabilitaetsannahmen fuer die RMT-Kernel-Haertung ein. Der Kernel soll sicherheitsrelevante Runtime-Outputs nicht nur erzeugen, rendern und diagnostizieren, sondern vor dem Commit gegen eine interne Trust-Schicht bewerten.

Die wichtigste Entscheidung:

- Runtime-Output ist erst gueltig, wenn eine Kernel Trust Authority ein Verdict erzeugt hat.
- Unsichere DOM-Sinks duerfen nicht direkt aus Renderer-, Prerender-, Slot- oder Fallback-Pfaden beschrieben werden.
- Panic ist ein expliziter Runtime-State, nicht nur ein Nebeneffekt aus Exceptions, Degradation oder fehlgeschlagenen Command Responses.
- Recovery ist Teil des Kernel-Vertrags und darf keinen zweiten unsicheren Commit-Pfad oeffnen.

## Protected Assets

| Asset | Schutzbedarf |
| --- | --- |
| DOM Integrity | Template-, Slot-, Prerender- und Fallback-Outputs duerfen keine unsicheren DOM-Sinks bypassed erreichen |
| RMT Kernel State | Scheduler, Command Bus, Diagnostics und Reactivity muessen kritische Fehler korrelierbar machen |
| Surface Integrity | Eine kompromittierte Surface darf benachbarte Scopes nicht unkontrolliert beeinflussen |
| Trusted Diagnostics | Security-relevante Fehler duerfen nicht als normale Telemetrie verschwinden |
| Recovery Path | Fallbacks, Rollbacks und Quarantaene duerfen keine neue Injection-Flaeche erzeugen |
| Compile-Time Contracts | vNext Security-, Remote- und Degradation-Policies muessen Runtime-Gegenstuecke haben |
| Generated Artifacts | Core-, Runtime-, Browser-, Types-, Schema- und Manifest-Artefakte muessen synchron bleiben |

## SilentError Definition

Ein SilentError liegt im RMT-Kernel vor, wenn ein sicherheits- oder korrektheitsrelevanter Fehler eintritt und mindestens eine dieser Bedingungen zutrifft:

- der Output wird trotzdem committed
- der Fehler wird nur lokal in `failed`, `degraded`, `skipped` oder `executed` normalisiert
- kein Trust Verdict entsteht
- kein Panic- oder Recovery-Signal entsteht, obwohl der Scope kritisch ist
- Diagnostics enthalten keine Severity, keinen Scope oder keine Correlation
- ein Recovery-Pfad nutzt einen unsicheren Bypass
- Compile-Time-Policy und Runtime-Verhalten widersprechen sich

Nicht jeder normale Fehler ist ein SilentError. Ein validierter, scoped, diagnostizierter und nicht committed Fehler ist kein SilentError, selbst wenn die betroffene Surface degradiert.

## Trust Boundaries

| Boundary | Beschreibung | Regel |
| --- | --- | --- |
| Kernel Trust Boundary | zentrale Runtime-Wahrheitsquelle fuer Outputs | jeder unsichere Output braucht ein Verdict |
| DOM Sink Boundary | HTML-, Attribute-, URL- und Property-Writes | direkte Writes auf unsichere Sinks sind verboten |
| Scheduler Boundary | Job-Ausfuehrung, Callback-Fehler und Backpressure | Fehlerstatus darf Erfolg nicht vortaeuschen |
| Command Bus Boundary | Command-Handler, Envelopes und Adapter Responses | kritische Failures muessen eskalierbar sein |
| Diagnostics Boundary | Pub/Sub, History, Snapshots und Reporter | kritische Diagnostics muessen Severity und Scope behalten |
| Recovery Boundary | Fallback, Rollback, Quarantaene, Kill-Switch | Recovery muss denselben Trust-Regeln folgen |
| Remote Surface Boundary | Remote Records und Surface Adapter Outputs | Remote Runtime Execution bleibt verboten, Outputs bleiben trust-scoped |

## Runtime-Sinks im Scope

Diese Sinks sind fuer die erste Haertungswelle verbindlich im Scope:

| Sink / Pfad | Risiko | Default-Entscheidung |
| --- | --- | --- |
| `innerHTML` aus Slots | HTML-Injection | nur nach Trust Verdict oder Sanitizing |
| `innerHTML` aus Prerender-Chunks | HTML-Injection im inkrementellen Rendering | nur nach Trust Verdict oder Sanitizing |
| Error-Boundary-Fallback-Markup | unsicherer Recovery-Pfad | Fallback ist nicht privilegiert |
| `setAttribute` | URL-, Event- und Style-Injection | Allowlist und URL-Policy |
| Property Writes | Seiteneffekte, DOM-Clobbering | Property-Policy oder Block |
| Remote Surface Adapter Outputs | Boundary Drift | Remote Output Trust Scope |
| Command Bus failed Envelopes | kritische Fehler verschwinden | Severity und Panic Hooks |
| Scheduler Callback Errors | falsche Erfolgsmetriken | failed/aborted/panic-aware Status |

## Panic Scope

Ein Panic-Zustand ist scoped. Der kleinste sichere Scope gewinnt, solange er die Gefahrenausbreitung begrenzt.

| Scope | Wann verwenden | Erwartete Recovery |
| --- | --- | --- |
| `binding` | einzelnes Attribut, URL, Property oder Text Binding verletzt Policy | Binding blockieren, Diagnostic publizieren |
| `slot` | Slot- oder Fragment-Output ist unsicher | Fragment blockieren, sicheren Fallback pruefen |
| `template` | wiederholte oder strukturelle Verletzung in einem Template | Template quarantainen, letzten sicheren Snapshot behalten |
| `surface` | Surface erzeugt wiederholt kritische Outputs | Surface pausieren oder remount-blockieren |
| `remote-surface` | Remote Boundary oder Adapter Output verletzt Policy | Remote Surface blockieren, Degradation anwenden |
| `scheduler-job` | Job erzeugt kritischen Fehler oder Panic-Output | Job abbrechen und Queue neu bewerten |
| `kernel` | Trust Authority, Panic Monitor oder Recovery selbst versagt | Runtime in fatal safe mode versetzen |

## Panic vs. Diagnostics vs. Degradation

| Zustand | Bedeutung | Commit erlaubt? | Recovery noetig? |
| --- | --- | --- | --- |
| `diagnostic` | beobachtbarer, nichtkritischer Fehler | ja, wenn Trust Verdict passt | nein |
| `blocked` | Output wurde sicher verweigert | nein fuer den betroffenen Output | optional |
| `degraded` | Funktion faellt kontrolliert auf geringere Faehigkeit zurueck | ja, nur fuer sicheren Fallback | haeufig |
| `suspected-panic` | kritisches Muster oder Schwelle beginnt | nein fuer riskante Outputs | vorbereiten |
| `active-panic` | kritischer Scope ist unsicher | nein im betroffenen Scope | ja |
| `recovering` | Quarantaene, Rollback oder Fallback laeuft | nur Trust-geprueft | ja |
| `recovered` | Scope ist stabil und diagnostiziert | ja, mit Policy | nein |
| `failed-panic` | Recovery ist gescheitert | nein im betroffenen Scope | Host-Intervention |

## Threat Classes

| Threat | Risiko | Required Control |
| --- | --- | --- |
| HTML Fragment Bypass | unsicheres Markup erreicht DOM | Trust Sink Adapter und Sanitizing Boundary |
| Unsafe Attribute | `javascript:`, `on*`, `srcdoc` oder Style-Injection | Attribute-Allowlist und URL-Policy |
| Property Side Effect | Template schreibt riskante DOM-Properties | Property-Policy und Diagnostics |
| Recovery Injection | Error Fallback rendert unsicheres HTML | Fallback durch Trust Authority |
| Failure Normalization Drift | kritischer Fehler wird als normale Failure Response behandelt | Severity, Scope, Panic Hook |
| Scheduler Success Drift | Callback-Fehler erscheint als `executed` | eindeutige Failure-Semantik |
| Policy Runtime Drift | Compile-Time blockt, Runtime committed trotzdem | Runtime Policy Parity Gate |
| Quarantine Gap | kompromittierte Surface bleibt aktiv | scoped Quarantaene und Kill-Switch |
| Diagnostic Redaction Gap | Security-Daten landen roh in Reporter-Metadaten | redigierte Diagnostics |

## Mandatory Facts

Ein Runtime Trust Verdict ist nur gueltig, wenn diese Fakten gesetzt sind:

- `schema`
- `verdict`
- `scope`
- `sink`
- `sourceRef`
- `severity`
- `reasonCode`
- `commitAllowed`
- `sanitized`
- `panicCandidate`
- `correlationId`
- `diagnosticCode`

Ein Panic Snapshot ist nur gueltig, wenn diese Fakten gesetzt sind:

- `panicId`
- `state`
- `severity`
- `scope`
- `trigger`
- `firstSeenAt`
- `lastSeenAt`
- `correlationId`
- `blockedCommitCount`
- `affectedJobs`
- `recoveryAction`
- `recoveryOutcome`

## Diagnostic Baseline

| Code | Severity | Bedeutung |
| --- | --- | --- |
| `rmt.kernel.trust.verdict_missing` | error | unsicherer Output besitzt kein Trust Verdict |
| `rmt.kernel.trust.sink_refused` | error | Trust Authority verweigert einen Sink |
| `rmt.kernel.trust.html_sanitizer_missing` | error | HTML-Output braucht Sanitizing, aber kein Sanitizer ist verfuegbar |
| `rmt.kernel.trust.attribute_refused` | error | Attribut wurde durch Policy blockiert |
| `rmt.kernel.trust.property_refused` | error | Property Write wurde durch Policy blockiert |
| `rmt.kernel.panic.suspected` | warning | Panic-Schwellwert ist erreicht oder fast erreicht |
| `rmt.kernel.panic.active` | error | Panic-State ist aktiv |
| `rmt.kernel.recovery.started` | info | Recovery fuer Scope wurde gestartet |
| `rmt.kernel.recovery.failed` | error | Recovery fuer Scope ist fehlgeschlagen |
| `rmt.kernel.scheduler.callback_failed` | error | Scheduler-Callback ist fehlgeschlagen |
| `rmt.kernel.command.critical_failure` | error | kritischer Command-Bus-Fehler wurde eskaliert |

## Source-of-Truth

| Artefaktklasse | Fuehrende Rolle |
| --- | --- |
| `development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md` | Backlog, Workpackage-Reihenfolge und Gate-Matrix |
| `development/XTendRMT-Kernel-Trust-Hardening-Contract.md` | Threat Model, SilentError-Definition, Panic Scope und Baseline-Contract |
| `development/WP-RKSH-*.md` | Workpackage-Abnahmen und Handoffs |
| `security/trusted-dom-policy.js` | maschinenlesbare Trusted-DOM- und Sanitizing-Policy |
| `tools/rmt-language/vnext-security.js` | Compile-Time Trust Boundary und Sanitizing Records |
| `tools/rmt-language/vnext-remote-security.js` | Remote Surface Security und Kernel Boundary |
| `tools/rmt-language/vnext-degradation.js` | Degradation-Status und Blocking-Policy |
| `xtendrmt/` | generierte Core-/Runtime-Artefakte und Public API |
| `tests/` | Regression-, Fixture-, Browser- und Artifact-Gates |

## Handoff Rules

- `RKSH-WP-01` definiert die Trust Authority API und darf noch keine breite Runtime-Umschreibung erzwingen.
- `RKSH-WP-02` bindet HTML-/DOM-Sinks an und muss direkten HTML-Commit blockieren.
- `RKSH-WP-03` behandelt Attribute, URLs und Properties separat von HTML.
- `RKSH-WP-04` baut PanicMonitor auf Trust Verdicts und eskalierbaren Runtime-Failures.
- `RKSH-WP-05` darf Recovery nur ueber Trust-gepruefte Commit-Pfade implementieren.
- `RKSH-WP-10` klaert den Build-Handoff, bevor neue Public APIs als fertig gelten.

## Gate

`RKSH-WP-00` ist ein Scope-, Threat-Model- und Contract-Paket. Der lokale Gate ist ein Dokumentations- und Referenzpfad-Gate:

```bash
node scripts/run_xtend_tests.js references --json
```

Runtime-, Parser- oder Browser-Gates entstehen ab `RKSH-WP-01` bis `RKSH-WP-05`.
