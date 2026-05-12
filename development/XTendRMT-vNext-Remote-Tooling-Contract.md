# XTend RMT vNext Remote Tooling Contract

- Status: `accepted`
- Workpackage: `WP-E16-09`
- Module: `tools/rmt-language/vnext-remote-tooling.js`
- Suite: `tests/rmt-language/rmt_vnext_remote_tooling_suite.js`
- Local Gate: `node scripts/run_xtend_tests.js rmt-vnext-remote-tooling --json`

## Contract

```js
schema: "xtend.rmt.vnext-remote-tooling.v1"
reportSchema: "xtend.rmt.vnext-remote-tooling-report.v1"
agentReportSchema: "xtend.rmt.vnext-remote-agent-report.v1"
```

The remote tooling layer uses the WP-E16-08 remote compiler as its source of
truth and exposes developer-facing facts for authoring, review and CI.

## Provider Scope

- Linter diagnostics for owner, version, integrity, fallback, event direction and
  payload schema facts.
- Completion items for remote surface clauses, event clauses, shell targets,
  discovered events and snippets.
- Hover and document symbols for remote surfaces, shell targets and cross-surface
  event records.
- Agent reports for Enterprise Registry, Remote Security posture and Degradation
  status.
- Snippets for Remote Surface, Remote Event, Fallback and Degradation authoring.

## Safety

Remote tooling does not load remote code and does not perform network requests.
It only compiles local RMT authoring into the same JSON-compatible reports used
by the remote manifest, registry, event governance and degradation contracts.
