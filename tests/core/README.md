# Core Tests

Scope:

- manifest and loader contracts
- `xstate`, `xtheme`, API, router and overlay contracts
- static syntax checks for core modules
- Node-based regression checks that do not require a browser

Current entry point:

```bash
node scripts/run_xtend_tests.js core
```

Architecture gate entry point:

```bash
node scripts/run_xtend_tests.js architecture
```

Compatibility entry point:

```bash
node scripts/verify_xtend_core_contracts.js
```

`core_contract_suite.js` contains the structured core contract suite. `architecture_gate_suite.js` contains the SSOT, Digital Twin and anti-technical-debt gates. The legacy verify script delegates to the core suite so Epic 01 workflows keep working while Epic 02 grows the harness.
