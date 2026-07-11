# XTendRMT Kernel Migration Authoring Incident Handoff Contract

- Schema: `xtend.rmt.kernel-migration-authoring-incident-handoff.v1`
- Report Schema: `xtend.rmt.kernel-migration-authoring-incident-handoff-report.v1`
- Workpackage: `RKSH-WP-11`
- Status: `completed`
- Local gate: `node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json`
- Package script: `npm run test:rmt-kernel-handoff-docs`

## Zweck

Der Contract macht die Sicherheits-Haertung des RMT-Kernels fuer Migration, Authoring und Incident-Auswertung konsumierbar. Nach `RKSH-WP-00` bis `RKSH-WP-10` sind Trust Authority, Trusted DOM Runtime, Binding Security, PanicMonitor, Recovery, Escalation, Scheduler-Failure, Policy-Parity, Security Regression und Artifact-Parity technisch abgesichert. `RKSH-WP-11` ist die dokumentierte Handoff-Schicht fuer Host-Teams.

## Artefakte

| Artefakt | Rolle |
|----------|-------|
| `docs/rmt-kernel-security-hardening-migration.md` | Migration fuer bisher erlaubte unsichere Markup-, Attribute-, Property- und Remote-Output-Pfade. |
| `docs/rmt-kernel-trusted-output-authoring.md` | Authoring-Regeln fuer `html_fragment`, `sanitize html`, `textContent`, `data-*`, `aria-*`, `safeFallbackHtml` und Trusted Commits. |
| `docs/rmt-kernel-panic-recovery-incident-handoff.md` | Panic-/Recovery-Diagnostics, Incident Severity, Recovery Actions und Host-Handoff. |
| `tests/rmt-language/rmt_kernel_handoff_docs_suite.js` | Statischer Gate fuer Contract-, Docs-, Package-, Runner- und Backlog-Verdrahtung. |

## Muss-Inhalte

- HTML-, Attribute-, Property- und Remote Outputs nennen explizit, wann eine Trust Boundary erforderlich ist.
- Legacy-Pfade wie `innerHTML`, `insertAdjacentHTML`, `slot.html`, `prerender.html`, `fallback.html`, `onclick`, `style`, `srcdoc` und `javascript:` sind als migrationspflichtig dokumentiert.
- Sichere Muster nutzen `commitTrustedHtml`, `commitTrustedAttribute`, `commitTrustedProperty`, `sanitize html`, `html_fragment`, `textContent`, `data-*`, `aria-*` und `safeFallbackHtml`.
- Incident-Handoff nennt `rmt.kernel.panic`, `rmt.kernel.recovery`, `rmt.kernel.escalation`, `rmt.kernel.scheduler_failure`, `panicId`, `correlationId`, `blockedCommitCount`, `recoveryAction`, `quarantined` und `hostNotified`.
- SemVer fuer blockierte Legacy Outputs unterscheidet `major`, `minor` und `patch`.

## Akzeptanz

- `node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json` ist gruen.
- `package.json` enthaelt `xtend.rmtKernelHandoffDocs` mit Schema, Docs, Gate und Handoff-Quellen.
- `docs/en/README.md` und `docs/menu.json` verlinken die drei Guides.
- Das Backlog markiert `RKSH-WP-11` als completed und nennt das Package-Script.

