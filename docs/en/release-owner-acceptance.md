# Release Acceptance

Release Acceptance describes which machine-readable evidence must be visible before publication can move forward. The public text focuses on decision criteria: which local checks are green, which artifacts were written, which package boundaries remain closed and which evidence can be understood by an external developer?

## Decision Signals

The important states are accepted, deferred and blocked. Accepted items have concrete evidence such as successful browser smokes, a current Package Export Lock or a consistent TypeExports result. Deferred items are known but not critical for the next package state. Blocked items prevent automatic publication, especially when an artifact is missing or a package boundary must deliberately remain closed.

This classification is not a replacement for human ownership. It does make clear why a build may continue or why a publication path stops. External teams can read the same artifacts without needing private meetings or tracking systems.

## Public Package Boundary

XTend treats publication as an explicit boundary. A new export is not enough when declarations, pack dry run and documentation do not also know it. Likewise, a new document is not enough when the package does not contain the matching entry point. This acceptance page connects those signals and points at Package Export Lock, Conditional Network Evidence and hydration evidence.

```txt
schema: xtend.epic13.release-owner-acceptance.v1
local gate: node scripts/run_xtend_tests.js epic13-release-owner-acceptance --json
source: xtend.epic13.rc1-production-readiness.v1
Release Owner Acceptance
accepted
deferred
blocked
automatic-publish-approval
publish boundary: private-until-release-owner-acceptance
browser evidence: xtend.epic13.prod-browser-csp-smoke.v1
package evidence: xtend.epic13.package-export-lock.v1
network evidence: xtend.epic13.conditional-network-evidence.v1
WP-E13-03
WP-E13-09
./prod-browser-csp-smokes.md
./package-export-lock.md
./hydration-performance-closure.md
```

## Local Use

Use this page when a build is technically successful but still needs a publication decision. First check whether local gates report the same package surface. Then verify that nightly artifacts, workspace dry runs and optional network evidence are current. Only then is it clear whether a status should be accepted, deferred or blocked.

For `xtend-i18n`, this means the module must be recognized as non-visual infrastructure, XState and XRouter adapters must be tested, and existing components must not overwrite explicit host labels. For Maraca, it means workspace pack dry run, Maraca report and size report must be visible in nightly artifacts.

## Maintenance Notes

Keep visible text focused on user and package decisions. Internal identifiers stay in the machine-readable block so suites can verify them. When a new artifact becomes required, add the local command, report path and the GitHub Actions upload location.
