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
