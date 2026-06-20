# XTensions Diagnostic Trail Contract

Status: `accepted-by-XTN-10`
Backlog: `development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md`
Gate: `node scripts/run_xtend_tests.js xtensions-diagnostic-trail --json`

## Zweck

XTN-10 macht XTension-Aktionen optional auditierbar, ohne Framework-Code in Diagnostics, CI oder DevTools zu tragen. Der Diagnostic Trail verbindet Maraca-Artefakt, Runtime Host, Surface, Lane, Signal/Event und Payload-Fingerprint in serialisierbaren Records.

## Contract Shapes

- Trail Schema: `xtend.xtensions.diagnostic-trail.v1`
- Record Schema: `xtend.xtensions.diagnostic-trail-record.v1`
- Correlation Schema: `xtend.xtensions.diagnostic-trail-correlation.v1`
- Redaction Policy Schema: `xtend.xtensions.diagnostic-redaction-policy.v1`
- Report Schema: `xtend.xtensions.diagnostic-trail-report.v1`

## Aktionen

Der Trail unterstuetzt diese optionalen Aktionen:

- `mount`
- `update`
- `signal.receive`
- `event.emit`
- `suspend`
- `resume`
- `error`
- `unmount`

Die Records veraendern Runtime-Verhalten nicht. Sie beobachten nur HostController-, Signal-Bridge- und Runtime-Ereignisse.

## Korrelation

Jeder Record muss mindestens enthalten:

- `xtensionId`
- `manifestId`
- `artifactId`
- `hostId`
- `surfaceId`
- `lane`

Zusaetzlich empfohlen:

- `artifactFingerprint`
- `buildFingerprint`
- `runtimeHostId`
- `eventId`
- `signalId`
- `routeId`
- `traceId`
- `correlationId`
- `parentRecordId`

Damit kann ein CI- oder DevTools-Report eine Aktion vom Maraca-Artefakt bis zur Surface und Fabric Lane verfolgen.

## Redaction

Payloads werden vor Report-Ausgabe redigiert. Die Redaction ist schema- und policy-basiert:

- `allowlist`: nur erlaubte Top-Level-Felder bleiben erhalten.
- `shape`: Payload wird auf Typ, Keys oder Array-Laenge reduziert.
- `hash`: Payload oder Feld wird durch SHA-256-Fingerprint ersetzt.
- `drop`: Payload oder Feld wird entfernt.
- `pass`: Payload bleibt erhalten, sensitive Felder werden weiter ueber Feldregeln behandelt.

Sensitive Feldnamen wie `password`, `secret`, `token`, `authorization`, `cookie`, `apiKey`, `privateKey` und `email` werden nie roh in CI/DevTools-Reports ausgegeben.

## Diagnostics

Blockierende Diagnostics:

- `xtensions.diagnostic_trail.framework_dependency`
- `xtensions.diagnostic_trail.action_unsupported`
- `xtensions.diagnostic_trail.correlation_missing`
- `xtensions.diagnostic_trail.payload_non_serializable`
- `xtensions.diagnostic_trail.redaction_policy_invalid`
- `xtensions.diagnostic_trail.sequence_invalid`

Informative Diagnostics:

- `xtensions.diagnostic_trail.redaction_required`

## Definition Of Done

- `tools/xtensions/diagnostic-trail.js` stellt Contract, Correlation, Redaction, Record- und Report-Serialisierung bereit.
- `tools/xtensions/diagnostic-trail.d.ts` exportiert die Contract-Oberflaeche fuer Tooling.
- `tests/fixtures/xtensions/diagnostic-trail-valid.json` deckt alle acht Audit-Aktionen ab.
- `tests/xtensions/xtensions_diagnostic_trail_suite.js` prueft Korrelation, Redaction, Unsupported Actions, nicht serialisierbare Payloads, Report-Stabilitaet und Dependency-Grenzen.
- `package.json` exportiert nur die Contract-Helfer, keine Framework-Runtimes.
- Der lokale Gate `node scripts/run_xtend_tests.js xtensions-diagnostic-trail --json` bleibt ohne neue Dependencies gruen.
