# WP-RKSH-11 - Migration, Authoring und Incident-Handoff dokumentieren

- Status: `completed`
- Prioritaet: `P2`
- Contract: `xtend.rmt.kernel-migration-authoring-incident-handoff.v1`
- Report Schema: `xtend.rmt.kernel-migration-authoring-incident-handoff-report.v1`
- Local gate: `node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json`
- Package script: `npm run test:rmt-kernel-handoff-docs`

## Ergebnis

`RKSH-WP-11` schliesst die Kernel-Sicherheits-Haertung mit einer Handoff-Schicht fuer Migration, sicheres RMT-Authoring und Incident-Auswertung. Die technischen Gates aus `RKSH-WP-00` bis `RKSH-WP-10` bleiben die Runtime-Quelle; diese WP macht die Nutzung und Bewertung fuer Host-Teams reproduzierbar.

## Artefakte

- `development/XTendRMT-Kernel-Migration-Authoring-Incident-Handoff-Contract.md`
- `docs/rmt-kernel-security-hardening-migration.md`
- `docs/rmt-kernel-trusted-output-authoring.md`
- `docs/rmt-kernel-panic-recovery-incident-handoff.md`
- `tests/rmt-language/rmt_kernel_handoff_docs_suite.js`
- `package.json` Metadaten unter `xtend.rmtKernelHandoffDocs`

## Umsetzung

- Migration fuer bisher erlaubte unsichere Markup-Pfade dokumentiert: `innerHTML`, `insertAdjacentHTML`, `slot.html`, `prerender.html`, `fallback.html`, Event-Attribute, URL-Attribute und Property-Writes.
- RMT Authoring Guidelines beschreiben Trust Boundaries, `sanitize html`, `html_fragment`, `textContent`, `data-*`, `aria-*`, `safeFallbackHtml`, `commitTrustedHtml`, `commitTrustedAttribute` und `commitTrustedProperty`.
- Panic/Recovery Handoff beschreibt `rmt.kernel.panic`, `rmt.kernel.recovery`, `rmt.kernel.escalation`, `rmt.kernel.scheduler_failure`, `panicId`, `correlationId`, `blockedCommitCount`, `recoveryAction`, `quarantined` und `hostNotified`.
- SemVer-Impact fuer blockierte Legacy Outputs ist in `major`, `minor` und `patch` klassifiziert.
- Runner, Package Script, Docs-Menue und Backlog sind auf den neuen Gate verdrahtet.

## Akzeptanz

- Breaking- oder behavior-changing Blocks sind dokumentiert.
- Host-Teams wissen, wie Panic-Diagnostics auszuwerten sind.
- RMT-Authoring zeigt sichere Fallback- und Sanitizing-Muster.
- Lokaler Gate:

```bash
node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json
```

