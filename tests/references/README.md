# Documentation And Demo Reference Tests

Scope:

- documentation menu targets
- prioritized documentation contracts
- demo HTML reference paths
- XTendRMT bestcase demo native domains and metadata
- explicit classification of manual legacy references
- XTend-Scaffold layout, CLI, blueprint, generator, template-rendering and WP status contracts
- cross-link to the dedicated `rmt-compatibility` gate introduced in Epic 04 / WP-08
- cross-link to the `xtend.rmt.template-pilot-flow.v1` pilot introduced in Epic 04 / WP-09
- cross-link to the XTendRMT migration and framework-agnostic guardrails introduced in Epic 04 / WP-10
- cross-link to the `xtend.rmt.upstream-handoff.v1` handoff introduced in Epic 04 / WP-11
- cross-link to the Epic 04 closure review introduced in Epic 04 / WP-12
- cross-link to the Epic 05 bridge and native routing backlog
- cross-link to the Epic 05 / WP-01 upstream Source-of-Truth decision
- cross-link to the Epic 05 / WP-02 Host Adapter Lifecycle Contract
- cross-link to the Epic 05 / WP-03 Adapter Registry and Capability Negotiation Contract
- cross-link to the Epic 05 / WP-04 native `adapters` domain
- cross-link to the Epic 05 / WP-05 native `components` domain
- cross-link to the Epic 05 / WP-06 native `routes` domain
- cross-link to the Epic 05 / WP-07 native `schedules` policy domain
- cross-link to the Epic 05 / WP-08 DSL normalization contract
- cross-link to the Epic 05 / WP-09 runtime registry contract
- cross-link to the Epic 05 / WP-10 productive XRouter adapter contract
- cross-link to the Epic 05 / WP-11 productive XTend component adapter contract
- cross-link to the Epic 05 / WP-12 productive State/Scheduler/Diagnostics bridge contract
- cross-link to the Epic 05 / WP-13 artifact parity contract
- cross-link to the Epic 05 / WP-14 native bestcase-demo migration
- cross-link to the ER-WP-30 Supply-Chain Gate Plan and offline policy gate

Current entry point:

```bash
node scripts/run_xtend_tests.js references
```

The suite is static and deterministic. It does not execute demos in a browser. It verifies that selected docs, demos, native RMT domains, RMT metadata and scaffold contracts remain usable as reference paths and that legacy/manual demos are consciously classified in `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`.

RMT-compatible XTend artifacts have a narrower gate:

```bash
node scripts/run_xtend_tests.js rmt-compatibility
node scripts/verify_xtendrmt_artifact_parity.js --json
```
