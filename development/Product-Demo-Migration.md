# Product migration and candidate acceptance

This extraction moves seven complete product applications to konnilabs/xtend-demos. XTend MCP, published workspaces, the VSCode extension, knowledge build, deterministic framework/security/compiler/runtime/playground fixtures and runnable Core documentation examples remain in Core. ERP and LLM were already excluded from root npm workspaces; this migration does not claim an automatic consumer installation footprint reduction.

## Commit and merge sequence

1. Core C1 contains the public APIs and reproducible pack workflow. Review it locally; no package publishing is implied.
2. Demo D1 pins exact Core C1 in candidate-source.lock.json and uses candidate locks with verified digest-named tarballs.
3. Core C2 pins exact Demo D1 in product-demos.lock.json. Its independent-checkout canary must test D1 against the exact C2 tarballs as well. C2 changes only required pin/evidence wiring relative to C1.
4. Both sides remain blocked for initial merge until the pinned source commits are independently fetchable through an immutable, durably retained public ref. Local commits and a currently open feature branch do not satisfy this requirement. Squash merge followed by deletion of the original branch may orphan C1 or D1. Retain approved immutable source tags/refs, or choose a merge strategy that keeps the pinned commit in protected main history; verify an exact-SHA fetch from a fresh checkout before approving merge. Creating those remote refs requires a separate authorized push; none is performed here.
5. Package publication/auth/trust repair is separate. Version 0.9.0 is unpublished (registry E404). Do not call ordinary registry npm ci ready and do not substitute @latest or floating main. Candidate testing and source fetching are independent of npm publication.

## Reproducible candidate pack and install

Use Node 24.18.0 or the required Node 26.5.0 lane and npm 11.17.0. Start from a clean committed Core source and an exact 40-character Demo SHA:

```sh
npm ci --ignore-scripts --no-audit --no-fund
node scripts/product-candidate-canary.cjs --pack-only --demo-sha "$DEMO_SHA" --out "$FRESH_CANDIDATE_DIRECTORY"
```

The pack produces root plus all nine published workspaces, with exact versions, SHA256, npm SHA512 integrity and internal dependency/peer metadata. Its deterministic PHP/Laravel tar includes runtime source fingerprints. Preserve the manifest together with every digest-named tarball and PHP archive. In a fresh independent Demo checkout:

```sh
node scripts/install-candidates.cjs "$CANDIDATE_DIRECTORY" "$CORE_SHA" "$DEMO_SHA"
node scripts/prepare-product-runtime.cjs
npm test
```

Set XTEND_CORE_SHA and XTEND_DEMO_SHA to those exact identities before runtime provisioning/tests. Install-candidates places artifacts in each application's own .candidate directory and generates/verifies locks against file:.candidate/<digest-name>.tgz; no sibling/root-source links participate. Original external third-party resolutions are retained. A normal ci primes external locked package bytes, followed by offline ci against the restored versioned manifest. Candidate namespace registry fallbacks, links, missing tarballs, metadata drift and outside-installation resolution are rejected.

## Runtime prerequisites and evidence

PHP 8.4 CLI with mbstring, DOM/XML, curl, zip and SQLite, Composer 2.8.12, Xvfb/xauth, unzip/curl and the pinned Chromium/WebDriver pair are required. The original fake Electron terminal regression covers shell/import/worker capability propagation; product/native/embedded-Electron canaries run on both host Node lanes. Model downloads are not required by the fake lane. Existing test sandbox behavior is preserved; no credentials, trust, proxy or system security settings are changed.

Core's canary clones the pinned Demo commit into an independent temporary checkout, verifies all candidate bytes, provisions runtimes, runs required product reports, copies and verifies npm locks and reports, then checks exact Core/Demo SHAs, package closure, PHP digest and source fingerprints and freshness. Missing, stale, failed, skipped or mismatched evidence is a hard failure. A caught verification exception forces ok=false/status=failed and nonzero exit. Unit and whole-orchestrator tests include runner Exit 0 with invalid/missing/stale evidence and verifier exceptions.

Before any separately authorized release, build and accept the whole package closure. The planned public package order is root, RMT/Fabric, compiler/CLI and Material core, Maraca, Material adapter/XSurface Shard, then MCP; optional peer cycles are checked as a complete pinned candidate set. The existing actual publish workflow is only coupled to mandatory canary acceptance here; changing publishing order/auth/trust or performing publication requires the separate publishing task. Do not publish individual versions until every exact candidate and PHP runtime gate has passed and the release owner has approved the package closure/release sequence.

No workflow is manually triggered, no package is published, and no deployment/merge is performed by this migration. Final review must separate passed, failed and not executed checks. Node 26/Chrome preflight timeout investigations remain separate from migration changes.
