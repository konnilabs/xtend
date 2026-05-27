# RMT Syntax Basics

This page introduces the shape of a valid RMT-vNext source file. You only need basic HTML and JavaScript knowledge before you start.

## Document Shape

An RMT document starts with a `template`. The template contains declarations such as `state`, `selector`, `action`, `portal`, `resource` and `surface`. Blocks use braces, strings use quotes and nested declarations describe ownership.

```rmt
template learn.rmt.syntax {
  state app.message type object preserve {
    initial {
      id "welcome"
      text "Hello RMT"
      tone "info"
    }
  }

  selector app.message from state app.message {
    output MessageView
  }

  surface root {
    lane visible weight 80 {
      hydrate message-card from selector app.message
    }
  }
}
```

## Reading The Example

The template owns one state record, exposes it through one selector and hydrates one surface lane from that selector. This is the basic RMT rhythm: describe data, expose the view model, then schedule rendering work.

## Next Step

Continue with [Templates and Surfaces](./learn-rmt-templates-surfaces.md).

## Validation And Transitions

Form logic does not have to live as host JavaScript next to the RMT file. Use `validation` to declare field rules and action gates; use `transition` to declare the visual change between surface groups.

```rmt
validation demo.contact {
  mode blocking
  target action demo.nextContact
  field demo.email required email message "Enter a valid email address."
}

transition demo.contactToIssue {
  trigger action demo.nextContact
  from surfaces [demo.email demo.nextContact]
  to surfaces [demo.subject demo.nextIssue]
  effect slide-left
  durationMs 220
  easing "ease-out"
  lane transition
}
```

`required`, `email`, `minLength`, `maxLength`, `pattern`, `message`, `target action`, `from surfaces`, `to surfaces`, `effect` and `durationMs` are part of the vNext syntax. `lane transition` lets the kernel scheduler plan the change.

## Maraca Relevance

Maraca reads these records from the `.rmt` source and, in strict mode, decides whether validation, transition and kernel layers are complete enough. When you later run `xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json`, missing targets, unknown components and incomplete messages become build diagnostics instead of silent runtime fallbacks. The next production context is [Maraca Orchestration](./xtend-maraca-orchestration.md).

## Public contract

RMT Syntax Basics is the public learning path contract for `docs/en/learn-rmt-syntax-basics.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT sources, parser behavior, linter diagnostics and playground output.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/learn-rmt-syntax-basics.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/learn-rmt-syntax-basics.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json`

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
