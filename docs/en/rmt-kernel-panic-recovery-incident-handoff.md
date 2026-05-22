# RMT Kernel Panic Recovery Incident Handoff

- Contract: `xtend.rmt.kernel-migration-authoring-incident-handoff.v1`
- Workpackage: `RKSH-WP-11`
- Local gate: `node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json`

This handoff describes how host teams evaluate panic and recovery diagnostics when the kernel trust layer blocks faulty outputs or starts recovery.

## Diagnostics Channels

| Channel | Purpose |
|---------|---------|
| `rmt.kernel.panic` | panic state, trigger, severity, scope and blocked commits |
| `rmt.kernel.recovery` | recovery outcome, snapshot use, fallback and quarantine |
| `rmt.kernel.escalation` | escalation envelope from diagnostics hub or command bus |
| `rmt.kernel.scheduler_failure` | `failed`, `aborted`, `panic_blocked` and backpressure failure for jobs |

## Minimum Fields for Incident Review

- `panicId`
- `correlationId`
- `state`
- `severity`
- `scope`
- `trigger`
- `blockedCommitCount`
- `recoveryAction`
- `quarantined`
- `hostNotified`
- `affectedJobs`
- `firstSeenAt`
- `lastSeenAt`

## Incident Severity

| Severity | Meaning | Expected response |
|----------|---------|-------------------|
| `warning` | output was corrected or sanitized | observe verdicts, no escalation required |
| `degraded` | output was blocked, UI remains usable with safe fallback | host team checks authoring or remote source |
| `critical` | surface, template or binding was quarantined | open incident, track `correlationId` and `panicId` |
| `fatal` | recovery failed or several kernel-scope errors correlate | stop release/traffic and restore last safe state |

## Recovery Actions

| `recoveryAction` | Meaning | Host handoff |
|------------------|---------|--------------|
| `rollback-last-safe-snapshot` | the kernel restores the last safe snapshot | preserve snapshot ID and surface scope |
| `render-safe-fallback` | a checked fallback replaces unsafe output | check fallback markup and reason code |
| `quarantine-surface` | affected surface accepts no new commits | disable remote source or adapter |
| `abort-scope-jobs` | scheduler jobs in the affected scope are aborted | check `rmt.kernel.scheduler_failure` with `panic_blocked` |
| `notify-host` | host adapter is actively informed about recovery | confirm `hostNotified` and host-log correlation |

## Triage Flow

1. Filter `rmt.kernel.panic` by `panicId`, `correlationId`, `scope`, `trigger` and `blockedCommitCount`.
2. Connect `rmt.kernel.recovery` with the same `correlationId` and evaluate `recoveryAction`, `quarantined` and `hostNotified`.
3. Check `rmt.kernel.escalation` if diagnostics subscribers or command handlers were involved.
4. Check `rmt.kernel.scheduler_failure` if jobs are `failed`, `aborted` or `panic_blocked`.
5. Correct authoring using [RMT Kernel Trusted Output Authoring](./rmt-kernel-trusted-output-authoring.md).
6. Secure migration and regression with [RMT Kernel Security Hardening Migration](./rmt-kernel-security-hardening-migration.md) and `node scripts/run_xtend_tests.js rmt-kernel-security-regression --json`.
