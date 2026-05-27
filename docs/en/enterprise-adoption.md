# Enterprise Adoption

An external adoption path for teams bringing XTend into existing web products.

## What it covers

This article is written for developers who want to use XTend productively without internal project knowledge.

## Public building blocks

- Local development without a CDN.
- Bilingual documentation.
- Stable public entry points.
- Release evidence through Package Export Lock, the acceptance page, network evidence and pack dry run.

```txt
package evidence: xtend.epic13.package-export-lock.v1
owner evidence: xtend.epic13.release-owner-acceptance.v1
network evidence: xtend.epic13.conditional-network-evidence.v1
network docs: ./conditional-network-evidence.md
network mode: network-restricted-local-default
owner docs: ./release-owner-acceptance.md
package docs: ./package-export-lock.md
previous release bridge: Epic 12 RC0 Handoff
automatic-publish-approval
pack:dry-run:report
```

## Recommended workflow

Read the overview, copy the smallest suitable example and add host-specific details only afterwards.

## Next steps

- [Quick Start](./quick-start-guide.md)
- [About XTend](./about.md)

## Public contract

Enterprise Adoption is the public orientation contract for `docs/en/enterprise-adoption.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: entry routes, local docs navigation and the smallest runnable commands.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/enterprise-adoption.md`
- `docs/menu.json`
- `package.json`
- `README.md`
- `docs/de/quick-start-guide.md`
- `docs/en/quick-start-guide.md`
- `components/manifest.json`
- `xtend-loader.js`

Names:
- `docs/en/enterprise-adoption.md`
- `docs/menu.json`
- `docs/de/quick-start-guide.md`
- `docs/en/quick-start-guide.md`
- `components/manifest.json`
- `docs/dev-router.php`
- `package.json`
- `README.md`
- `xtend-loader.js`

Commands:
- `node scripts/verify_docs_public_quality.js`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/verify_docs_public_quality.js
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If entry paths drift, check `docs/menu.json`, local links and the command in the verification block first.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
