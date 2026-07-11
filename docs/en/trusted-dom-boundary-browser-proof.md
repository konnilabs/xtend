# Trusted DOM Boundary Browser Proof

Browser-near proof for Parsedown HTML, RMT `htmlFragment`, and structured DOM descriptors.

## Contract

- Schema: `xtend.epic13.trusted-dom-boundary.v1`
- Fixture Schema: `xtend.epic13.trusted-dom-boundary-browser-smoke.v1`
- Sanitizer: `xtend.security.trusted-dom-sanitizer.v1`
- Boundary: `xtend.security.sanitizing-boundary.v1`
- Local Gate: `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json`
- Fixture: `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html`

## Proof

`parsedownHtml` and RMT `htmlFragment` may only be written through a host-owned Trusted DOM sink. The RMT kernel remains parser- and sanitizer-neutral.

## Check

```bash
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
```

## Browser-Near Flow

The browser proof matters because the Trusted DOM boundary is not only a static policy. Parsedown HTML, RMT `htmlFragment` and structured DOM descriptors meet real DOM sinks only inside the host. The gate therefore checks more than a list of blocked tokens. It verifies that the runtime separates the allowed path from the forbidden path. A host may accept HTML fragments, but only when the sanitizer makes the decision visible and the sink is marked as trusted.

Structured DOM descriptors remain the preferred path because they do not require free HTML execution. They describe elements, attributes, text and children as data. When an `htmlFragment` is still necessary, the evidence must explain why the host needs that path and which policy limits it. This keeps RMT from becoming a parser or sanitizer transport for arbitrary HTML content.

## Reviewer Criteria

Reviewers check four questions. First, is the Sanitizing Boundary executed in the host rather than hidden inside the RMT kernel? Second, do blocked vectors such as `script`, `inline-event-handler`, `javascript-url` and `srcdoc` remain visibly blocked? Third, do allowed fragments flow only into the Trusted DOM sink instead of direct `innerHTML` shortcuts? Fourth, do descriptors still work when HTML fragments are absent?

A fix is accepted when it makes those questions easier to answer. Changes are blocked when they push parser dependencies into the kernel, hide sanitizer decisions or introduce new host sinks without a gate. The browser proof must stay concrete: a visible DOM path, a local report and clear block lists for risky vectors.

## Related reading

The sanitizing concept explains the trust boundary exercised by this browser proof. [Related article](./trusted-dom-sanitizing.md)
