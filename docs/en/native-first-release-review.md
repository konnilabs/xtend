# Native-First Release Review

This guide describes the public review path for Native-First claims. It helps release-facing reviewers connect product, docs and audit evidence without requiring internal planning language.

## Review Goal

A Native-First release claim is reliable when authors and reviewers can answer these questions:

- Which contract ID proves the claim?
- Which local check covers the contract ID?
- Which RMT recipe or owned primitive creates the surface?
- Which budget evidence covers bundle, performance, interaction and visual stability?
- Which browser-lab or visual residuals remain visible?
- Which dependency exceptions include security, supply-chain and exit-plan evidence?

Relevant contracts:

- `xtend.native-first.contract-registry.v1`
- `xtend.native-first.audit-evidence-pack.v1`
- `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1`
- `xtend.native-first.docs-authoring-guides.v1`

## Review Order

| Step | Expected signal |
| --- | --- |
| Registry | Contract ID, status, owner role, local check and docs path are discoverable. |
| Authoring | The guide points to Native-First Authoring or RMT Recipes. |
| Security | Trusted DOM, URL, property, attribute and event boundaries are separated. |
| Budgets | Bundle, render, interaction, complexity and visual claims have thresholds or residuals. |
| Evidence | Audit evidence pack, supply chain and redaction rules cover release-facing evidence. |
| Migration | Non-native, vendor-backed or legacy paths remain visible as controlled follow-up work. |

## Budget And Browser Evidence

Production performance or visual claims need a named local check. When real browser artifacts are not locally available, the claim must remain visible as a residual. A screenshot, viewport correlation or browser-lab report must not be silently simulated.

Minimal relevant checks:

```bash
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js native-first-evidence-pack --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js references --json
```

## Security And Dependency Review

The review blocks claims when a new production runtime dependency is introduced without an exit plan, when an unsafe HTML sink is used, or when URL, property and event boundaries cannot be traced through DOM descriptor records.

Build, test or docs dependencies are acceptable only when they do not become a frontend runtime default and remain visible in audit evidence.

## Review Result

| Result | Meaning |
| --- | --- |
| `accepted` | The claim is covered by contract, local check and evidence. |
| `accepted-with-residuals` | The claim is usable, but browser, visual, migration or dependency residuals stay explicit. |
| `needs-migration-plan` | The claim reveals a vendor-backed, legacy or non-native path that must be planned before broad use. |
| `blocked` | Contract ID, local check, security boundary or budget evidence is missing. |

## Blocked Releases

- Contract claim without a registry entry
- Runtime dependency without an exit plan
- Visual browser claim without artifact or residual
- Unsafe HTML, inline JavaScript, eval or raw-DOM sink
- Framework parity claim without an owned XTend primitive or RMT recipe

Read next:

- [Native-First Authoring Guide](./native-first-authoring-guide.md)
- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
- [Native-First Migration Guide](./native-first-migration-guide.md)
- [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
