# Temporary AppArmor lifecycle and isolated experiment

This experiment addresses the `No usable sandbox!` failure on the Ubuntu 24.04
GitHub runner after merge `681228cee924d2c519cc615f1fd73c095648a0ee`. The observed
`userns_create` AppArmor transition is a strong lead, not conclusive attribution
of every failed syscall. The isolated experiment passed both actual browser jobs
on commit `9508eac45072750d724adb683b8a21f63b4e0bbb` in
[run 41831385474](https://github.com/konnilabs/xtend/actions/runs/41831385474).

Both regular browser jobs now invoke the same lifecycle with `regular-gate` or
`regular-execution`. These modes require the exact regular workflow/job, accept
its push, manual or `pull_request` context (never `pull_request_target`), and use
the existing pinned `$RUNNER_TEMP/xtend-security-browser/chrome-linux64/chrome`.
The maintained producer, PR-only coverage policy, report paths and release
verifier are unchanged. AppArmor receipts are separate diagnostic artifacts;
the authenticated Core security artifact retains its original contents/name.
PR infrastructure acceptance remains explicitly unavailable coverage, never a
passing product test or release acceptance. Setup or cleanup failures still fail.

The separate
`xtend-apparmor-experiment.yml` runs on the scratch branch
`experiment/apparmor-userns`, or by manual dispatch once GitHub knows the workflow.
Publishing the branch / starting a workflow requires separate authorization.
The two matrix jobs exercise the maintained standalone browser test and the strict
`core-security-browser` runner profile on separate disposable Ubuntu 24.04 VMs.
These diagnostic artifacts are not authenticated release evidence.

The wrapper verifies the committed Chrome 151.0.7922.173 archive and executable
using the existing launcher. Its sole profile attachment is the exact canonical
`$RUNNER_TEMP/xtend-apparmor-browser/chrome-linux64/chrome` path. It rejects pattern
characters and symlink aliases. No browser override, setuid helper, sandbox flag,
global sysctl change, profile replacement or service reload is used.

The profile follows Chromium's documented `flags=(unconfined) { userns, }`
approach. This is a selective exception to Ubuntu's user namespace restriction;
it is not an AppArmor confinement policy. Chrome's own sandbox must still pass.
The file path is an attachment rule, not a hash-based kernel policy: another
executable replacing that exact file could receive the exception while loaded.
Consequently the lifecycle is limited to disposable GitHub-hosted runners, uses
the verified pin, and verifies its bytes again after testing. The isolated
experiment itself retains its separate triggers and never accepts PR events.

`apparmor_parser --add --skip-cache` receives the profile through stdin. Nothing
is installed in `/etc/apparmor.d` or the policy cache. A `finally` block removes
the profile even after load/test failure; an independent `always()` workflow
step checks/removes it again after cancellation. Only the unique run/attempt/mode
profile is removed. Cleanup failure remains a failure. SIGKILL or runner loss
cannot be handled by a process trap; the final job step and disposable VM are
the remaining cleanup boundaries.

The experiment additionally requires the exact AppArmor attachment on the live
browser and renderer processes, plus separate renderer user namespaces. Existing
PID/network namespace, Seccomp-BPF, NoNewPrivs, UID/GID, binary identity,
same-process sanitizer/Trusted Types/SSR assertions and owned-group cleanup checks
remain mandatory. These checks run before and after product assertions. Both
producer exit status and profile cleanup must pass; blocked coverage is never
accepted as success in the experiment or non-PR gates. The regular PR jobs retain
their existing explicit unavailable-coverage policy described above. Host
userns/AppArmor settings are compared before and after.

Evidence is retained under `.xtend-test-results/apparmor-{gate,execution}/`:
the exact profile, experiment report, raw gate/TAP or execution report, browser
proof, and an independent final cleanup receipt. Failed launches retain the
existing restricted host/audit diagnostics. No publish job or publish credentials
are involved.

Regular lifecycle diagnostics use `.xtend-test-results/apparmor-regular-gate/`
and `.xtend-test-results/apparmor-regular-execution/`, with `lifecycle.json`,
the exact profile and `final-cleanup.json`. The raw regular reports remain
`.xtend-test-results/security-browser-gate.json` and
`.xtend-test-results/core-security/security-execution.json` respectively.

Local checks (no privileged host changes):

```sh
node --test tests/security/apparmor-experiment.test.cjs
node scripts/security-node-tests.cjs
```

Sources:

- [Chromium: AppArmor user namespace restrictions](https://chromium.googlesource.com/chromium/src/+/main/docs/security/apparmor-userns-restrictions.md)
- [Ubuntu: apparmor_parser add/remove, skip-cache and skip-kernel-load](https://manpages.ubuntu.com/manpages/noble/man8/apparmor_parser.8.html)
