# Page resource cache validation — XTend 0.9

Base: `d4912deb30fe8d85d8e442e34d74ec6050f0fe09`, tested on 2026-10-11 with Node 24.19.0 and npm 11.17.0.

- Full `ci-pr`: **189 passed, zero failures/skips**, after the repository-required Native-First evidence preparation and ERP build.
- `ssr-pages`: passed, including cloned JSON resources, bounded TTL/LRU/UTF-8 bytes, invalid JSON rejection, native history, disposal, late-resolution suppression, identity/SSR/CSRF rejection and unchanged protected transport. Rerun after adding the strict RMT example compilation check.
- `ssr-pages-browser`: passed with Chrome for Testing 145.0.7632.6 and matching WebDriver; local Snap WebDriver was unsuitable (`kill EACCES`).
- `maraca-app-services`: all seven groups passed.
- Reviewed package-export lock: passed with the new public export (200 exports).
- Packed TypeScript consumer imports the scoped resource cache and PageClient policy successfully.
- Minified browser cache module: **1,009 gzip bytes**, below the 6 KiB budget.
- The two-view example compiles through strict Maraca and invokes local App Services independently of XTend.search.

The cache is opt-in for public resource routes. It does not persist data, cache SSR/resume envelopes, or change existing prefetch authorization checks. PageClient retains ownership of navigation, generations, abort, head, history and rendering.

XTend.search will dogfood the exact PR head SDK artifact rather than a floating branch. Search-provider policy remains application-owned. No callable XTend MCP connector was exposed in the development session; these are SDK/CLI/build/browser proofs, not claimed MCP tool interactions.

Dogfooding found a 0.9 initial-document transport regression: opt-in compact responses still emitted an uninterned initial envelope. The same bounded response-local codec now supports `xtend.page-initial-wire.v1`, decoded exclusively at the initial-document boundary. No ordinary PageResponse or reduced SSR-chunk validation is relaxed. PHP/Laravel plain initial envelopes remain unchanged. Signed-state equality, descriptor recovery, reference bounds, poisoning rejection and browser resume are covered by the existing gates plus a new contract test.

Final transport rerun: `ci-pr` passed 188/189 groups; the sole schema-inventory failure identified the new transport registration. After adding its formal schema and reviewing the declaration/formal projections, the targeted schema-inventory gate passed (53 existing inventory warnings). SSR/PageClient, compact signed-state/recovery checks, browser lifecycle and AppServices all passed in that rerun. The two reports are retained separately; the repaired inventory is not represented as an untouched full-profile rerun.
