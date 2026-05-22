# RMT Kernel Trusted Output Authoring

- Contract: `xtend.rmt.kernel-migration-authoring-incident-handoff.v1`
- Workpackage: `RKSH-WP-11`
- Package script: `npm run test:rmt-kernel-handoff-docs`

RMT authoring must not assume a string is safe just because it comes from a template, remote surface or adapter. Every output-close authoring path needs a clear trust boundary and a safe fallback.

## Authoring Rules

- Text remains text: author labels, status, user content and error messages as `textContent` or structured text fields.
- Author HTML only intentionally: use `html_fragment` with `sanitize html` and explicit scope.
- Keep attributes small: `data-*` and `aria-*` are preferred; URL attributes go through `commitTrustedAttribute`.
- Use properties only for allowed runtime targets: do not use DOM HTML properties as shortcuts.
- Fallbacks are not privileged: `safeFallbackHtml` itself must be sanitizable and not interactively dangerous.
- Remote surface outputs need scope, capability, origin and integrity context before they enter the kernel.

## Safe Patterns

```js
runtime.commitTrustedHtml(slotTarget, {
  scope: 'slot',
  source: 'slot.html',
  html: model.safeSummaryHtml,
  policy: {
    transform: 'sanitize html',
    output: 'html_fragment'
  },
  safeFallbackHtml: '<p data-rmt-fallback="safe">Content unavailable.</p>'
});
```

```js
runtime.commitTrustedAttribute(linkTarget, {
  scope: 'binding',
  name: 'href',
  value: model.href,
  allowedProtocols: ['https:', 'mailto:']
});
```

```js
runtime.commitTrustedProperty(inputTarget, {
  scope: 'binding',
  name: 'value',
  value: model.value,
  policy: 'form-control-value'
});
```

## Authoring Checklist

| Question | Safe answer |
|----------|-------------|
| Does the output contain markup? | `html_fragment` plus `sanitize html` and `commitTrustedHtml`. |
| Is it only text? | `textContent` or a structured text record. |
| Is it a URL attribute? | `commitTrustedAttribute` with protocol allowlist. |
| Is it `data-*` or `aria-*`? | Structured attribute commit, no HTML interpolation. |
| Is it a fallback? | `safeFallbackHtml` with the same policy as normal HTML outputs. |
| Does it come from remote or adapter code? | Trust scope `remote-surface` or `adapter-output`, capability and diagnostics correlation. |

## No-Go Patterns

- Forward markup from remote sources directly into `slot.html`, `prerender.html` or `fallback.html`.
- Transport event attributes such as `onclick` as data.
- Use `style` or HTML-close properties as an escape hatch.
- Build `safeFallbackHtml` from the same unsafe source as the blocked output.
- Ignore diagnostics when a verdict reports `blocked` or `panic`.
