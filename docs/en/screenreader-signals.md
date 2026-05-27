# Screenreader Signals

Signal live regions, status messages and overlay context cleanly.

## What it covers

This page describes checkable rules for robust user experiences. The recommendations fit local hosts, RMT app shells and classic Web Component pages.

## Public building blocks

- Local test commands.
- Browsernahe Fixtures.
- Dokumentierte Akzeptanzkriterien.

## Recommended workflow

Define budgets, check keyboard and screenreader signals and keep screenshots reproducible.

## Next steps

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)

## Public contract

Screenreader Signals is the public quality and security contract for `docs/en/screenreader-signals.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: local gates, policy files, report schemas, accessibility and security signals.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/screenreader-signals.md`
- `docs/menu.json`
- `package.json`
- `scripts/verify_docs_public_quality.js`
- `scripts/verify_docs_content_depth.js`
- `security/manifest-import-policy.js`
- `security/trusted-dom-policy.js`
- `security/supply-chain-gate-policy.js`

Names:
- `docs/en/screenreader-signals.md`
- `docs/menu.json`
- `scripts/verify_docs_public_quality.js`
- `scripts/verify_docs_content_depth.js`
- `security/manifest-import-policy.js`
- `security/trusted-dom-policy.js`
- `security/supply-chain-gate-policy.js`
- `docs/dev-router.php`
- `package.json`
- `node scripts/verify_docs_public_quality.js`

Commands:
- `node scripts/verify_docs_public_quality.js`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/verify_docs_public_quality.js
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If a gate fails, fix the example, policy source or report expectation before changing the threshold.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
