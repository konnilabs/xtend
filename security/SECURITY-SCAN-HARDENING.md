# Security scan hardening

This change addresses nine findings from the scan of `konnilabs/xtend` at
`0be8b17290fb17dd18d8bf3f6a641bf655505a8a`. The original scan reported partial
coverage: secondary products/components, generated assets and deployment topology
were not exhaustively audited. Passing regressions do not establish complete
repository or deployment coverage. DNS rebinding reachability remains dependent
on the consuming browser and deployment; HTTP and Electron fixtures validate the
new defenses locally.

| Finding | Fix | Regression |
| --- | --- | --- |
| `csf_a96be56cbf384238939d8951` | Pinned DOMPurify with a shared HTML-only allowlist and pinned jsdom for SSR; failed/missing sanitizer blocks commits | `sanitizer.test.mjs`, Chromium `browser.test.mjs`, Trusted DOM and SSR gates |
| `csf_1e84f759699fec8ea5bf83f1` | Bounded verified root fetch; Acorn rejects every static import, dependency re-export and dynamic import before script attachment; external SRI retained | `xscaler.test.cjs`, XScaler gates including cancellation, sessions, registration and PHP parity |
| `csf_4344282c61b4f04e25bd42ac` | 256-bit tokens, exact Host/extension Origin, private token file, single-use stream tickets | `http.test.mjs`, Dev Surface gate and extension build |
| `csf_cf691bd13df040c959a65ca1` | Process capability in a dedicated Electron session; exact Host/Origin; restricted repo access; bounded and deduplicated proxies | `http.test.mjs` including local upstream timeout/concurrency fixture; real Electron shell/import/worker smoke |
| `csf_8f265910264560c727110477` | Canonical root, symlink rejection, exclusive temporary files, identity rechecks and atomic replacement | `filesystem.test.cjs`, Scaffold gates |
| `csf_01590c67bdd3a17add61a800` | Resolve decoded route suffix under its own canonical public root; require a regular file | `filesystem.test.cjs`, live demo HTTP traversal checks |
| `csf_927d8bcd5e6ca691dbe85ae7` | Resume TTL/count/byte quotas and consumption; cached compilation; four concurrent renders | `http.test.mjs`: expiry, consumption, bounded store and deterministic overload |
| `csf_8837fe1f41a398a0c4da1ff9` | JSON media type and provenance policy before body reading/service dispatch; local host defaults to exact bound authority | `http.test.mjs`: rejected writes leave SQLite unchanged; AppService and type gates |
| `csf_9449701667a23fc6d6b7a0de` | Open regular files only; attach stream error and client-close handlers | Live ERP/animation directory HTTP regression |

## Compatibility and configuration

HTML fragments exclude SVG, MathML, scripts, templates, forms, inline styles,
`srcdoc`, `srcset`, data attributes and unrecognized URL schemes. Safe semantic
HTML, ARIA attributes and HTTP(S)/mailto/tel links remain supported. Host sanitizer
callbacks are trusted application code and must uphold the same boundary. Browser
results preserve TrustedHTML through the final sink. With Trusted Types enabled,
allow DOMPurify's `dompurify` policy and use one sanitizer instance per window.
The generated adapters cache instances per window. SSR still requires an explicit
sanitizing boundary and serializes its parser-sanitized output as HTML.

Remote XScaler adapters must be self-contained bundles. Bundle dependencies before
publication and update their SRI digest. Default verification limits are 1 MiB
and 15 seconds; `maxAdapterBytes` and `verificationTimeoutMs` configure them.
Custom external loaders must also attest `closedGraphIntegrity: true` and enforce
it, in addition to the existing CSP/SRI/external-script contract.

The Dev Surface companion no longer accepts the `dev` token or persistent query
bearers. It generates 32 random bytes by default; supplied tokens must be 64 hex
characters or 43 base64url characters and must come from a CSPRNG. Configure exact
Chromium extension origins with `XTEND_DEV_SURFACE_ALLOWED_ORIGINS`. The CLI emits
only the path to a token file (directory mode 0700, file mode 0600); copy its value
into the extension's token setting. The panel obtains a 30-second, one-use ticket
for each EventSource connection. Ticket retention is capped at 256.

Electron injects `x-xtend-llm-capability` only for its private app-server origin.
Every route, including static imports and worker files, requires it. `/repo/` is
closed unless `dev: true` and a file is explicitly listed in `publicRepoFiles`.
Default proxy limits are two concurrent upstream jobs, 15 minutes per job, 8 GiB
per model object, 32 GiB/4096 entries in cache and 4 MiB per API response. Set `proxyLimits` on
`createXtendLlmAppServer` for deployment-specific budgets. In-flight downloads of
the same object share a job; failed temporary files are removed.

Resume tokens expire after ten minutes, with at most 128 retained entries and
8 MiB of serialized payloads. Successful retrieval consumes the token. The
previous tokenless latest-entry lookup is removed; send the page's token explicitly.

Node AppService clients must send `application/json`, optionally with UTF-8
charset. Other media types return 415. `allowedOrigins` and `requestPolicy` run
before body processing; the policy must explicitly return true. `listenNodeAppHost`
checks the bound Host (including port) and same Origin by default. Configure a
capability policy for alternative deployments. Identity and tenant authorization
remain the responsibility of `createContext` and the service layer.

## Filesystem guarantees

`--force` cannot bypass root containment or symlink checks. Where supported,
`O_NOFOLLOW` prevents final-component symlink following. The writer checks parent
and target identities before atomic rename. Node does not provide a portable
`openat`/`renameat` descriptor-relative API: a malicious process concurrently
renaming ancestor directories in the final syscall interval remains outside this
guarantee. Use a project directory whose ancestors are controlled by the caller.
On platforms without `O_NOFOLLOW`, protection relies on canonicalization and
repeated `lstat`/identity checks. Static streaming opens a descriptor, validates
its regular-file type and handles asynchronous read errors and client disconnects.

## Reproduce

Supply-chain policy retains the general ban on new runtime dependencies and adds
exact-version, lockfile-required exceptions for DOMPurify/jsdom. Acorn is approved
only as pinned build tooling; its checked vendor copies ship to browsers. The
legacy PHP documentation sanitizer has a separate policy and still permits its
documented data-image URLs. Its shared HTML fixture is compared after real parsing;
the new browser/Node policy explicitly rejects those URLs. This does not extend the
scan's claimed coverage to the legacy PHP sanitizer.

Use the repository's pinned Node/npm versions. Install root workspace, ERP and LLM
product dependencies. Run `npm run test:security-scan-regressions` with
`CHROMIUM_PATH` pointing to Chrome/Chromium. This command fails if the browser is
unavailable; it does not silently skip. The dedicated CI workflow also runs the
Electron shell/import/worker smoke under Xvfb. Generate sanitizer artifacts with
`npm run build:html-sanitizer`, then KernelLab, `xscaler/generate-esm.js`,
`xtend-maraca/sync-app-services-esm.js` and the Dev Surface extension build.
