# Security and Preview

RMT is declarative, but the playground accepts arbitrary text input. The Developer Center therefore compiles source, reports diagnostics and renders only structured output through a narrow preview path.

## Playground Safety Rules

The playground does not execute user-authored JavaScript, does not return raw HTML from the compile endpoint and resets the preview surface between compilations. Inline handler strings, HTML fragment rendering, remote imports and unsafe URL protocols are blocked or diagnosed.

```rmt
template learn.rmt.safePreview {
  state preview.message type object preserve {
    initial {
      id "safe"
      text "Rendered from structured RMT output"
    }
  }

  selector preview.message from state preview.message {
    output PreviewMessage
  }

  surface preview.card kind card component x-status {
    source selector preview.message
    key message.id

    lane visible weight 80 {
      hydrate preview-card from selector preview.message
    }
  }
}
```

## Related Reference

For production rendering, read [Trusted DOM Sanitizing](./trusted-dom-sanitizing.md) and the [DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md).

## Maraca Strict Mode

The playground is intentionally interactive; Maraca is intentionally strict. For shipped apps, build the same source type with `--orchestration strict`, `--validation strict` and `--transitions strict` so unsafe HTML sinks, missing targets and incomplete validation messages surface during the build. The Maraca pages explain which browser bridges remain public and which internals stay outside the contract.

## Next Step

Open the [RMT Playground](./learn-rmt-playground.md).

## Public contract

Security and Preview is the public learning path contract for `docs/en/learn-rmt-security-preview.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT sources, parser behavior, linter diagnostics and playground output.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/learn-rmt-security-preview.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/learn-rmt-security-preview.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `x-status`

Commands:
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json`
- `node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If an example does not compile, check token order, record names and linter output first.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
