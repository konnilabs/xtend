# RMT vNext Source-to-Sea

The Source-to-Sea check connects an `.rmt` source file with compiler Core, kernel schedules, Fabric fibers, host adapters, XTend UI and browser evidence. It is intentionally outside default CI because the browser driver needs its own local or GitHub Actions environment. For release candidates it is still the strongest evidence chain: a third-party developer can see that the compiler output, route switches, cross-primitive events and resource cleanup all correlate in the browser.

## Public Contract

The contract lives in `tools/rmt-language/vnext-source-to-sea.js` and uses `tests/rmt-language/fixtures/vnext-source-to-sea.rmt` as the copyable reference. The expected chain is `source -> kernel -> Fabric -> UI -> Browser`. Browser evidence is written to `.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json` and carries these schemas:

```text
xtend.rmt.vnext.source-to-sea-evidence.v1
xtend.rmt.vnext.source-to-sea-evidence-report.v1
xtend.rmt.vnext.source-to-sea-object-matrix.v1
xtend.rmt.vnext.source-to-sea-ci-artifact-validation.v1
xtend.rmt.vnext.source-to-sea-browser-result-validation.v1
```

The fixture covers four visible objects: `demo.feedback.panel`, `demo.feedback.toast`, `demo.feedback.detail` and `demo.feedback.audit`. The evidence therefore contains `"objectCount": 4`; when that number drifts, the `.rmt` source, browser HTML or object mapper no longer agree.

## Minimal Local Run

Use the runner suite for a fast Node pass without an external browser. Use the capture helper when the release candidate needs browser evidence from ChromeDriver, Firefox or an existing WebDriver session.

```bash
node scripts/run_xtend_tests.js rmt-vnext-source-to-sea --json
npm run test:rmt-vnext-source-to-sea:evidence
npm run test:rmt-vnext-source-to-sea:chromedriver
npm run test:rmt-vnext-source-to-sea:validate-artifact
```

The replay step is deliberately separate: `test:rmt-vnext-source-to-sea:validate-artifact` calls the same validator with `--validate-artifact` that CI runs after artifact upload. That lets a failed browser run be inspected without opening a new browser session.

## Event And Lifecycle Evidence

The core path checks cross-primitive events, route targets and cleanup as one connected workflow. The important event slice is `demo.feedback.detail.ack -> demo.feedback.audit`: an event from `demo.feedback.detail` reaches `demo.feedback.audit`, updates target state and stays bound to the transition lane. The browser drift guards are named exactly `browser execution cross-primitive events pass`, `browser execution route switches pass`, `browser execution route lifecycle cycles pass` and `browser execution object matrix passes`.

The audit branch also contains `demo.feedback.auditSubscription`. Lifecycle evidence requires `countsMatch`, so unmount and remount are not merely visible; they must release and rebind the same resource count. The guard `cross event route-target state belongs to target primitive` prevents false positives when multiple route targets are present in the smoke HTML.

## Failure Fixtures

The negative fixture `vnext-source-to-sea-cleanup-owner-invalid.rmt` emits `rmt.vnext.source_to_sea.cleanup_owner_mismatch` when a cleanup resource belongs to the wrong surface owner. `vnext-source-to-sea-cleanup-resource-missing.rmt` emits `rmt.vnext.source_to_sea.cleanup_resource_missing` when `demo.feedback.audit` is validated without the expected timer resource. `vnext-source-to-sea-cleanup-kind-invalid.rmt` emits `rmt.vnext.source_to_sea.cleanup_kind_mismatch` when `demo.feedback.auditSubscription` is not modeled as a `subscription`.

Browser drift is covered by `rmt-vnext-source-to-sea-cross-route-invalid.html`. That fixture proves that cross-route events are not evaluated by event name alone; the validator checks target primitive, lane and visible DOM state together.

## Status And Operations

| Slice | Priority | Status | Evidence |
| --- | --- | --- | --- |
| `RMT-VNEXT-PRIM-05` | P0 | completed | Primitive compiler, Core JSON and kernel records |
| `RMT-VNEXT-PRIM-06` | P0 | completed | Source-to-Sea browser evidence |

In GitHub Actions the browser path is enabled manually through `run_source_to_sea`. The default pull-request gate stays fast and runs `npm run test:rmt-vnext-primitives:report`; Source-to-Sea adds browser evidence when needed. The capture helper records `ChromeDriver-Auto-Cleanup` so WebDriver processes do not remain after the run.
