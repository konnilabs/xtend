# XTend Security Tests

This directory contains local, deterministic security-policy gates.

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
