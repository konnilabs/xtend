# XTendRMT Kernel Trust Authority Contract

- Status: `accepted by RKSH-WP-01`
- Datum: 14. Mai 2026
- Contract: `xtend.rmt.kernel-trust-authority.v1`
- Verdict Schema: `xtend.rmt.kernel-trust-verdict.v1`
- Diagnostic Schema: `xtend.rmt.kernel-trust-diagnostic.v1`
- Report Schema: `xtend.rmt.kernel-trust-authority-report.v1`
- Baseline: `xtend.rmt.kernel-trust-hardening.v1`
- Workpackage: `RKSH-WP-01`
- Modul: `tools/rmt-language/kernel-trust-authority.js`
- Types: `tools/rmt-language/kernel-trust-authority.d.ts`
- Gate: `node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json`
- Zielzustand: `kernel-trust-authority-contract-ready`
- Folgepakete: `RKSH-WP-02`, `RKSH-WP-03`, `RKSH-WP-04`, `RKSH-WP-05`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.kernel-trust-authority.v1"
```

Dieser Contract definiert die erste kernel-interne Trust-Schicht als host-neutrale API. Er fuehrt noch keine Renderer-Umschreibung durch. Er legt aber fest, wie Runtime-Outputs bewertet, serialisiert, diagnostiziert und an Folgepakete uebergeben werden.

Die Trust Authority ist die Wahrheitsquelle fuer Output-Commit-Entscheidungen. Jeder riskante Runtime-Output muss spaeter ein `RmtKernelTrustVerdict` besitzen, bevor er an einen Sink weitergereicht wird.

## API-Entscheidung

Das Contract-Modul stellt diese Funktionen bereit:

| Funktion | Zweck |
| --- | --- |
| `createKernelTrustAuthority()` | erzeugt eine host-neutrale Authority-Fassade |
| `createKernelTrustAuthorityContract()` | liefert den serialisierbaren Contract-Snapshot |
| `createKernelTrustVerdict(input)` | normalisiert einen Runtime-Output zu einem Verdict |
| `createKernelTrustDiagnostic(verdict)` | erzeugt strukturierte Diagnostics fuer blockierte oder panic-relevante Outputs |
| `serializeKernelTrustVerdict(verdict)` | stabile JSON-Serialisierung fuer Tests und Reports |
| `serializeKernelTrustAuthorityContract(contract)` | stabile JSON-Serialisierung fuer Contract-Paritaet |

Die TypeScript-Oberflaeche liegt in `tools/rmt-language/kernel-trust-authority.d.ts` und definiert:

- `RmtKernelTrustVerdict`
- `RmtKernelTrustDiagnostic`
- `RmtKernelTrustAuthorityContract`
- `RmtKernelTrustAuthority`
- `RmtKernelTrustVerdictKind`
- `RmtKernelTrustScope`
- `RmtKernelTrustSeverity`

## Verdict Envelope

Ein Verdict ist nur gueltig, wenn diese Fakten vorhanden sind:

| Feld | Bedeutung |
| --- | --- |
| `schema` | immer `xtend.rmt.kernel-trust-verdict.v1` |
| `authoritySchema` | immer `xtend.rmt.kernel-trust-authority.v1` |
| `verdict` | `trusted`, `sanitized`, `blocked` oder `panic` |
| `scope` | betroffener Kernel-Scope |
| `sink` | Ziel-Sink oder Runtime-Pfad |
| `sourceRef` | Template-, Surface-, Operation- oder Adapter-Referenz |
| `ownerRef` | optionaler Owner-Kontext |
| `attributeName` | gesetztes Attribut, falls relevant |
| `propertyName` | gesetzte Property, falls relevant |
| `severity` | `info`, `warning`, `error` oder `fatal` |
| `reasonCode` | maschinenlesbarer Grund |
| `commitAllowed` | finale Commit-Entscheidung |
| `sanitized` | ob ein Sanitizing-Fakt vorliegt |
| `trustBoundary` | verwendete Trust Boundary, falls vorhanden |
| `panicCandidate` | ob der Fall an PanicMonitor eskalieren kann |
| `correlationId` | stabile Korrelation fuer Diagnostics und Recovery |
| `diagnosticCode` | Diagnostic-Code fuer blockierte oder panic-relevante Outputs |
| `metadata` | redigierte Zusatzdaten ohne rohe HTML-/Secret-Payloads |

## Verdicts

| Verdict | Commit | Bedeutung |
| --- | --- | --- |
| `trusted` | ja | Output ist nach Default-Policy sicher |
| `sanitized` | ja | Output ist nur nach Sanitizing/Boundary sicher |
| `blocked` | nein | Output wurde sicher verweigert |
| `panic` | nein | Output oder Runtime-Zustand ist kritisch und panic-relevant |

## Scopes

| Scope | Folgepaket | Bedeutung |
| --- | --- | --- |
| `binding` | `RKSH-WP-03` | Attribute, URL-Attribute, Properties und Text-Bindings |
| `slot` | `RKSH-WP-02` | Slot-Fragmente und HTML-Slots |
| `template` | `RKSH-WP-04`, `RKSH-WP-05` | Template-weite Muster oder Wiederholungen |
| `surface` | `RKSH-WP-05` | Surface-weite Quarantaene oder Rollback |
| `remote-surface` | `RKSH-WP-08` | Remote Surface Output und Boundary Drift |
| `scheduler-job` | `RKSH-WP-07` | Job-Ausfuehrung und Callback-Fehler |
| `adapter-output` | `RKSH-WP-06`, `RKSH-WP-08` | Host-/Surface-Adapter-Ergebnisse |
| `diagnostics` | `RKSH-WP-06` | Diagnostics- und Reporter-Pfade |
| `kernel` | `RKSH-WP-04`, `RKSH-WP-05` | Trust-/Panic-/Recovery-Kernfehler |

## Sinks

Die erste Contract-Version kennt diese Sinks:

- `textContent`
- `attribute`
- `url-attribute`
- `property`
- `innerHTML`
- `insertAdjacentHTML`
- `template.innerHTML`
- `html_fragment`
- `slot.html`
- `prerender.html`
- `fallback.html`
- `remote-surface-output`
- `adapter-output`
- `diagnostic-event`
- `command-response`
- `scheduler-callback`

HTML-Sinks sind per Default nicht commitfaehig, wenn kein Sanitizing-Fakt oder expliziter Trust-Fakt vorliegt.

## Default Policy

Die Default Policy ist host-neutral und restriktiv:

| Policy | Default |
| --- | --- |
| `htmlRequiresSanitizing` | `true` |
| `eventAttributesAllowed` | `false` |
| `inlineStyleAttributesAllowed` | `false` |
| `unsafeUrlProtocolsAllowed` | `false` |
| `unknownPropertyWritesAllowed` | `false` |
| `remoteSurfaceRequiresBoundary` | `true` |
| `redactedDiagnostics` | `true` |

Diese Policy veraendert in `RKSH-WP-01` noch keine Runtime-Sinks. Sie liefert die Quelle fuer WP-02 und WP-03.

## Reason Codes

| Code | Bedeutung |
| --- | --- |
| `rmt.kernel.trust.text_safe` | Textpfad ist sicher |
| `rmt.kernel.trust.explicit_trust` | expliziter Trust-Fakt liegt vor |
| `rmt.kernel.trust.html_sanitized` | HTML wurde sanitized |
| `rmt.kernel.trust.html_sanitizer_missing` | HTML braeuchte Sanitizing, aber kein Sanitizer-Fakt liegt vor |
| `rmt.kernel.trust.attribute_allowed` | Attribut ist erlaubt |
| `rmt.kernel.trust.attribute_refused` | Attribut ist verboten |
| `rmt.kernel.trust.url_protocol_refused` | URL-Protokoll ist verboten |
| `rmt.kernel.trust.property_allowed` | Property ist erlaubt |
| `rmt.kernel.trust.property_refused` | Property ist verboten oder unbekannt |
| `rmt.kernel.trust.remote_boundary_missing` | Remote Surface Output besitzt keine Boundary |
| `rmt.kernel.trust.adapter_output_unscoped` | Adapter Output ist nicht trust-scoped |
| `rmt.kernel.trust.critical_failure` | kritischer Runtime-Fehler |
| `rmt.kernel.trust.panic_requested` | Panic wurde explizit angefordert |

## Diagnostics

Diagnostics nutzen weiter das etablierte Schema `xtend.rmt.linter.diagnostic.v1`, ergaenzen aber `trustDiagnosticSchema: "xtend.rmt.kernel-trust-diagnostic.v1"`.

Pflichtcodes:

- `rmt.kernel.trust.verdict_missing`
- `rmt.kernel.trust.sink_refused`
- `rmt.kernel.trust.html_sanitizer_missing`
- `rmt.kernel.trust.attribute_refused`
- `rmt.kernel.trust.url_protocol_refused`
- `rmt.kernel.trust.property_refused`
- `rmt.kernel.trust.remote_boundary_missing`
- `rmt.kernel.trust.adapter_output_unscoped`
- `rmt.kernel.panic.candidate`

Diagnostics duerfen rohe HTML-Fragmente, Secrets, Header, Cookies oder Query-Strings nicht ungefiltert in `metadata` uebernehmen.

## Host Adapter

Eine Host-Adapter-Erweiterung ist in WP-01 optional. Der Contract reserviert diese Hooks:

- `evaluateTrustOutput`
- `sanitizeHtmlOutput`
- `publishTrustDiagnostic`

Der Default bleibt host-neutral. Host Adapter duerfen spaeter strengere Policies ergaenzen, aber keine unsicheren Kernel-Defaults lockern.

## Handoff

| Folgepaket | Handoff |
| --- | --- |
| `RKSH-WP-02` | HTML-, Slot-, Prerender- und Fallback-Sinks an Trust Authority anbinden |
| `RKSH-WP-03` | Attribute-, URL- und Property-Policies produktiv in Runtime-Bindings fuehren |
| `RKSH-WP-04` | `blocked` und `panic` Verdicts an PanicMonitor koppeln |
| `RKSH-WP-05` | Recovery nur ueber Trust-gepruefte Fallback- und Snapshot-Pfade ausfuehren |

## Gate

```bash
node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json
```

Dieser Gate prueft Modul, Types, Package Export, Contract-Dokument, WP-Handoff, Verdict-Serialisierung, Default-Policy, Diagnostics und Beispielentscheidungen fuer Text, HTML, Attribute, URLs, Properties, Remote Surface und Panic.
