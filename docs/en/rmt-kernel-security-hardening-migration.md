# RMT Kernel Security Hardening Migration

- Contract: `xtend.rmt.kernel-migration-authoring-incident-handoff.v1`
- Workpackage: `RKSH-WP-11`
- Status: `completed`
- Local gate: `node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json`

This document describes the migration for hosts and RMT authoring that previously used implicitly allowed runtime outputs. Since the kernel hardening, HTML, attributes, properties and remote outputs are committed only after the trust layer has produced an `RmtKernelRuntimeTrustVerdict`.

## When a Trust Boundary Is Required

| Output | Trust boundary | Migration |
|--------|----------------|-----------|
| `slot.html`, `prerender.html`, `fallback.html` | HTML must be evaluated before every DOM commit. | Use `commitTrustedHtml` with `sanitize html`, `html_fragment` and `safeFallbackHtml`. |
| Direct DOM HTML sinks such as `innerHTML`, `insertAdjacentHTML` and `template.innerHTML` | These sinks remain privileged Trusted DOM sinks. | Remove direct writes and use the runtime trust-sink adapter. |
| Attributes such as `href`, `src`, `srcset`, `action`, `formaction` and `srcdoc` | URL and sandbox policy decides before commit. | Use `commitTrustedAttribute` and block dangerous protocols such as `javascript:`. |
| Event-close attributes such as `onclick`, `onload` or `onerror` | Event attributes are not allowed markup outputs. | Use commands or registered event handlers instead of HTML attributes. |
| Style and DOM property writes such as `style`, `innerHTML`, `outerHTML`, `srcdoc` | Property policy evaluates side effects and DOM-clobbering risk. | Use `commitTrustedProperty` only for explicitly allowed properties. |
| Remote outputs and adapter outputs | Remote surface boundaries need scope, origin, capability and integrity context. | Pass remote outputs as `remote-surface` or `adapter-output` scope into the trust authority. |

## Replace Legacy Paths

1. Remove direct HTML commits from components, adapters and host bridges. The kernel may reach `innerHTML`, `insertAdjacentHTML` or template HTML only through `commitTrustedHtml`.
2. Mark HTML that should remain allowed as `html_fragment` and pass it through `sanitize html`. The sanitizer must remove or block `script`, `iframe`, `srcdoc`, `on*`, `javascript:` and comparable dangerous patterns.
3. Write pure text as text: `textContent` is the preferred path for labels, status, error messages and user content.
4. Separate attributes: `data-*` and `aria-*` remain normal structured attributes, while URL attributes go through `commitTrustedAttribute`.
5. Separate properties: only explicitly allowed properties go through `commitTrustedProperty`; HTML-close properties remain blocked.
6. Do not privilege fallbacks such as `fallback.html`. Recovery fallbacks must satisfy the same policy as normal outputs and must have `safeFallbackHtml`.
7. Check diagnostics and regression: `listTrustVerdicts()`, `rmt.kernel.panic`, `rmt.kernel.recovery` and `node scripts/run_xtend_tests.js rmt-kernel-security-regression --json` must remain green after the migration.

## SemVer Impact

Blocked legacy outputs can be a breaking change if published hosts previously rendered intentionally unsafe markup and this behavior was part of the documented integration surface.

| Change | SemVer |
|--------|--------|
| Unsafe HTML, URL or event attributes are newly blocked and existing apps can lose visible content because of that. | `major` |
| Unsafe paths receive warnings, diagnostics or opt-in fallbacks, but previously safe output remains visible. | `minor` |
| Only docs, tests, report fields or stricter diagnostics are added without output changes. | `patch` |

Release notes for behavior-changing blocks must at least name the affected sinks, the reason code, the recovery path and the recommended migration.

## Verification

```bash
node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json
node scripts/run_xtend_tests.js rmt-kernel-security-regression --json
node scripts/verify_xtendrmt_artifact_parity.js --json
```
