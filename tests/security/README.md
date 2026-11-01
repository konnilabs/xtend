# XTend Security Tests

This directory contains deterministic security-policy gates and a separately
required real Chromium security test.

## Browser infrastructure and product evidence

`scripts/security-node-tests.cjs` runs every `*.test.cjs`, `*.test.mjs` and
`*.test.js` in this directory except `browser.test.mjs`. The standalone Security
workflow runs that browser test in its own job. Its existing `regression` check
still requires both jobs to succeed under the event-specific policy described below.
The original `npm run test:security-scan-regressions` command still runs all tests.

The browser test records three phases:

| Phase | Evidence and outcomes |
| --- | --- |
| Preflight | Verify the pinned archive/binary, launch with unchanged sandbox flags, connect to local DevTools, and verify actual unprivileged renderer namespaces and seccomp. `passed`, `infrastructure-blocked`, or `failed`. |
| Product | Execute the existing sanitizer, Trusted Types and SSR assertions in that same live process, environment, profile and argv, then verify the sandbox again. `passed`, `failed`, or `not-run`. |
| Cleanup | Record cleanup independently, even when launch or assertions failed. `passed` or `failed`; missing reports remain `not-provided`. |

Only an observed unsuccessful launch containing `No usable sandbox!` is labelled
`infrastructure-blocked`. Unknown crashes, launch timeouts, invalid binary pins,
unsafe configuration and all post-preflight assertion failures remain failures.
A blocked preflight does not run product assertions, produces no product proof,
and the raw test and Core runner suite exit unsuccessfully. Cleanup failure makes the overall result failed while
preserving the original preflight/product outcome.

The Core supervisor additionally records its own process-group cleanup. A lost
PID/start-time identity, unknown surviving group member, or incomplete reaping
remains a separate error. The ownership/signalling implementation is unchanged:
numeric group membership cannot grant permission to signal an unproven group.
Fixture tests exercise these cases without signalling real processes.

The official [Chromium AppArmor/user-namespace documentation](https://chromium.googlesource.com/chromium/src/+/main/docs/security/apparmor-userns-restrictions.md)
describes Linux host-policy restrictions that can prevent downloaded Chromium
builds from creating their sandbox. This is a known runner/binary/policy
compatibility class, not proof of the cause of XTend's observed launches and not a
confirmed Chromium upstream defect. This patch changes no AppArmor, userns,
privilege, sandbox, binary pin or timeout setting.

## Development aggregation versus release acceptance

`Core / Node / RMT development checks` is a PR-only summary of the explicitly
listed source, producer, RMT, packaging, consumer, native-toolchain and VSIX jobs.
Every listed dependency must succeed; failure, cancellation, skipped or missing
evidence fails the summary. It does not depend on the dedicated Core security
browser job, so that job's infrastructure failure cannot hide these development
results. It does not replace existing checks or remove browser assertions from
any existing producer suite. Browser-dependent failures within those suites
remain failures.

For `pull_request` only, the two dedicated browser jobs use a separate policy
wrapper. It can succeed with `infrastructure-not-executed`, explicitly reporting
browser security coverage unavailable and release eligibility false. This permits
PR acceptance without executed browser security coverage; it is a deliberate
project policy, not a security-test pass. Every other required job must still
succeed. Dependency locks, audits and product assertions receive no exception.

The wrapper independently verifies the pinned, configuration-allowed,
unprivileged browser before and after the producer. It invokes only the fixed
browser test or fixed Core browser profile under owned-process supervision. The
exception requires a fresh nonce-bound report, unchanged source and configuration,
the recognized Chromium pre-DevTools fatal sandbox diagnostic with a nonzero exit
or SIGABRT/SIGTRAP, product `not-run`, complete browser and supervisor cleanup,
and exactly the expected raw assertion failure. Extra runner/TAP failures,
unknown crashes, timeouts, cancellation, spawn errors, post-launch sandbox
failures, unsafe configuration, missing/malformed/stale/substituted evidence,
source changes and cleanup failures remain failures. The Core producer checks
source integrity before its strict blocked-startup failure.

Raw reports retain their unsuccessful outcomes. A separate `.policy.json` receipt
records the decision, source/run/attempt/invocation, raw digest, launch and
supervisor evidence. The summary rechecks that receipt against the raw report and
current source/context. Core release artifact contents and names are unchanged;
the PR receipt is retained in a separate artifact. Main pushes, manual workflows,
Nightly and local commands retain their strict behavior. No repository settings,
host policy, binary pins or sandbox flags are changed; no unsandboxed fallback or
blanket error suppression is used.

`release-seal` and `npm-publish-latest` still require the Core browser job to
succeed, and the authenticated release verifier additionally requires all three
browser phases to pass in the same live browser. It retains exact TAP, source,
archive, runtime, sandbox and owned-group cleanup checks. Blocked, missing,
skipped or failed browser coverage still blocks release. Choosing a compatible
runner or changing host policy requires a separate reviewed decision.

Run the deterministic separation tests with:

```bash
node --test tests/security/browser-gate.test.cjs
node scripts/security-node-tests.cjs
```

The real browser test still requires the pinned unprivileged Linux x64 runtime.
Tests of controlled phase and wrapper outcomes are not substitutes for that real
browser evidence. `tests/release/core-contracts.test.cjs` also exercises the real
release verifier with a Git-object-backed source provider and confirms that even
forged passing outer statuses cannot admit blocked browser evidence.

## XSS Pentest

`xss_pentest_suite.js` verifies the local XTend XSS pentest gate:

- `xtend.security.xss-payload-catalog.v1`
- `xtend.security.xss-pentest-plan.v1`
- `xtend.security.xss-pentest-report.v1`
- `xtend.security.xss-pentest-browser-smoke.v1`

Run it locally:

```bash
node scripts/run_xtend_tests.js xss-pentest
node scripts/run_xtend_tests.js xss-pentest --json
npm run test:xss-pentest
```

The suite is local-only. It uses a static sink scan, Fake-DOM RMT artifact probes,
a self-checking browser fixture, and XTend LLM renderer/server probes without
calling external targets.

## Supply Chain

`supply_chain_policy_suite.js` verifies the ER-WP-30 Supply-Chain Gate Plan:

- `xtend.security.supply-chain-gate-plan.v1`
- `xtend.security.dependency-audit-gate.v1`
- `xtend.security.license-policy.v1`
- `xtend.security.vulnerability-policy.v1`
- `xtend.security.release-supply-chain-gate.v1`

Run it locally:

```bash
node scripts/run_xtend_tests.js supply-chain
npm run test:supply-chain
node scripts/verify_supply_chain_policy.js --json
```

The suite does not call external registries. Network-backed audit commands such as `npm audit --audit-level=moderate` and `npm sbom --sbom-format=cyclonedx --json` are planned for CI/release stages, not for the default local test path.
