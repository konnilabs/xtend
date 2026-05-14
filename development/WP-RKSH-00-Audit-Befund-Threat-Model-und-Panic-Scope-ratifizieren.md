# WP-RKSH-00 - Audit-Befund, Threat Model und Panic-Scope ratifizieren

- Status: `completed`
- Datum: 14. Mai 2026
- Backlog: `development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md`
- Contract: `xtend.rmt.kernel-trust-hardening.v1`
- Threat Model Contract: `xtend.rmt.kernel-trust-threat-model.v1`
- Panic Scope Contract: `xtend.rmt.kernel-panic-scope.v1`
- Boundary: `runtime-output-requires-kernel-trust-verdict`
- Boundary: `unsafe-dom-sinks-require-trust-sink-adapter`
- Boundary: `panic-state-is-explicit-and-recoverable`
- Zielzustand: `kernel-trust-baseline-accepted`
- Gate: `node scripts/run_xtend_tests.js references --json`

## Ziel

`RKSH-WP-00` macht die RMT-Kernel-Sicherheits-Haertung operativ startbar. Das Paket friert den Audit-Befund, das Threat Model, die SilentError-Definition, die Panic-Scopes und die Source-of-Truth fest, bevor Runtime-Code veraendert wird.

Das Paket implementiert noch keine Trust Authority, keinen DOM-Sink-Adapter und keinen PanicMonitor. Es verhindert Technical Debt, indem es die Begriffe und Grenzen fuer die Folgepakete stabilisiert.

## Umgesetzt

- `development/XTendRMT-Kernel-Trust-Hardening-Contract.md` angelegt
- Contract `xtend.rmt.kernel-trust-hardening.v1` akzeptiert
- Threat Model `xtend.rmt.kernel-trust-threat-model.v1` definiert
- Panic Scope `xtend.rmt.kernel-panic-scope.v1` definiert
- SilentError fuer den RMT-Kernel definiert
- Runtime-Sinks im Scope festgelegt
- Abgrenzung zwischen Diagnostics, Degradation, Block und Panic dokumentiert
- P0-Findings aus dem Audit auf Folgepakete gemappt
- Source-of-Truth fuer Backlog, Contract, Security Policies, Runtime-Artefakte und Tests festgelegt
- `RKSH-WP-01` als naechstes startbares Paket markiert

## Threat-Model-Entscheidung

Der RMT-Kernel behandelt Runtime-Outputs nicht mehr als automatisch gueltig, nur weil Parser, Compiler oder vNext-Security-Contracts erfolgreich waren.

Die neue Grundregel lautet:

- Compile-Time-Policies beschreiben erforderliche Sicherheitsfakten.
- Runtime-Enforcement entscheidet vor dem Commit, ob ein konkreter Output sicher ist.
- Fehlende Runtime-Enforcement-Paritaet ist ein Security Gap.
- Unsichere Outputs werden blockiert, nicht still normalisiert.

## SilentError-Entscheidung

Ein SilentError ist jeder sicherheits- oder korrektheitsrelevante Fehler, der ohne ausreichenden Trust Verdict, Scope, Severity, Correlation oder Panic-/Recovery-Signal in der Runtime weiterlebt.

Damit sind diese Muster explizit nicht mehr ausreichend:

- Fehler nur in `failed` Response Envelopes verstecken
- Callback-Fehler als normal `executed` zaehlen
- HTML-Fallbacks privilegieren
- Degradation ohne Recovery- oder Trust-Kontext verwenden
- Diagnostics ohne Escalation Hook fuer kritische Fehler publizieren

## Panic-Scope-Entscheidung

Panic ist scoped und soll moeglichst klein greifen:

| Scope | Fuehrendes Folgepaket | Entscheidung |
| --- | --- | --- |
| `binding` | `RKSH-WP-03` | einzelne Attribute, URLs oder Properties koennen blockiert werden |
| `slot` | `RKSH-WP-02` | unsichere HTML-Fragmente blockieren Slot-Commit |
| `template` | `RKSH-WP-04`, `RKSH-WP-05` | wiederholte Verletzungen quarantainen Template |
| `surface` | `RKSH-WP-05` | kompromittierte Surface bekommt Rollback oder Quarantaene |
| `remote-surface` | `RKSH-WP-08` | Remote Output bleibt deklarativ und trust-scoped |
| `scheduler-job` | `RKSH-WP-07` | fehlerhafte Jobs bekommen klare Failure-Semantik |
| `kernel` | `RKSH-WP-04`, `RKSH-WP-05` | Trust-/Recovery-Versagen fuehrt in fatal safe mode |

## P0-Finding-Mapping

| Finding | Folgepaket | Ratifizierte Erwartung |
| --- | --- | --- |
| `RKSH-F01` keine zentrale Trust Authority | `RKSH-WP-01` | Trust Verdicts werden Kernel-Source-of-Truth |
| `RKSH-F02` direkte HTML-Slots/Prerender | `RKSH-WP-02` | HTML-Sinks brauchen Trust-Sink-Adapter |
| `RKSH-F03` unsicherer Error-Fallback | `RKSH-WP-02`, `RKSH-WP-05` | Recovery-Fallback ist nicht privilegiert |
| `RKSH-F04` freie Attribute/Properties | `RKSH-WP-03` | Attribute, URLs und Properties bekommen Policy |

## Source-of-Truth

| Artefaktklasse | Rolle |
| --- | --- |
| `development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md` | operative Workpackage-Reihenfolge und Gate-Matrix |
| `development/XTendRMT-Kernel-Trust-Hardening-Contract.md` | akzeptierter Baseline-Contract fuer Trust, SilentError und Panic |
| `development/WP-RKSH-*.md` | Workpackage-Abnahmen |
| `security/trusted-dom-policy.js` | maschinenlesbare DOM-Sink- und Sanitizing-Policy |
| `tools/rmt-language/vnext-security.js` | Compile-Time Trust Boundary und Sanitizing Records |
| `tools/rmt-language/vnext-remote-security.js` | Remote Security und Kernel Boundary |
| `tools/rmt-language/vnext-degradation.js` | Degradation- und Blocking-Modell |
| `xtendrmt/` | generierte Runtime-Artefakte, Types, Schema und Manifest |
| `tests/` | lokale und CI-faehige Gates |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
| --- | --- |
| Audit-Findings sind bestaetigt | erfuellt: `RKSH-F01` bis `RKSH-F10` bleiben Backlog-Baseline |
| SilentError ist definiert | erfuellt |
| Panic-relevante Scopes sind festgelegt | erfuellt |
| Diagnostics, Degradation und Panic sind abgegrenzt | erfuellt |
| Runtime-Sinks sind benannt | erfuellt |
| Recovery-Ziele sind benannt | erfuellt |
| P0-Luecken sind Folgepaketen zugeordnet | erfuellt |
| Gate-Strategie ist dokumentiert | erfuellt |
| `RKSH-WP-01` ist startbar | erfuellt |

## Verifikation

`RKSH-WP-00` ist ein Dokumentations-, Scope- und Contract-Gate. Ein Runtime-Test ist noch nicht erforderlich, weil Trust Authority, Sink Adapter und PanicMonitor erst ab den Folgepaketen entstehen.

Referenzpfad-Gate:

```bash
node scripts/run_xtend_tests.js references --json
```

## Handoff

`RKSH-WP-00` ist abgeschlossen. `RKSH-WP-01` kann den `KernelTrustAuthority` Contract definieren.

Die naechste Umsetzung soll bewusst klein bleiben:

- Trust Verdict Envelope
- Reason Codes
- Scope- und Sink-Typen
- Diagnostics-Anbindung
- host-neutrale Default-Policy
- Fixtures fuer trusted, sanitized, blocked und panic-candidate Verdicts

Noch nicht Teil von `RKSH-WP-01`:

- breite DOM-Renderer-Umschreibung
- PanicMonitor State Machine
- Scheduler-Failure-Migration
- Recovery-, Rollback- oder Quarantaene-Implementierung
