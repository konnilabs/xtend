# RMT AI Developer Kit Compact

Always load this file before asking an agent to write, repair or ship RMT.

## Mental Model

- RMT is declarative app structure, not JavaScript.
- Humans write `.rmt`; tools compile to Core records, source maps and diagnostics.
- Runtime behavior must be separated into Compiler Record, Host Adapter and Scheduler Signal.
- Maraca is the production path for loaderless RMT-first XTend app bundles.

## Load Order

1. Load this compact file.
2. Load relevant records from `rmt-ai-kit.reference.jsonl`.
3. Load one matching recipe from `rmt-ai-kit.recipes.jsonl`.
4. Run `xt rmt lint app.rmt --agent`.
5. For app bundles, run `xt maraca plan ... --json` before build.

## Non-Negotiable Rules

- Do not author if.
- Do not author else.
- Do not author for.
- Do not author while.
- Do not author switch.
- Do not author try.
- Do not author catch.
- Do not author function.
- Do not author return.
- Do not author await.
- Do not author async.
- Do not author class.
- Do not author new.
- Do not author eval.
- Do not author inline JavaScript.
- Do not author inline HTML.
- Do not author dynamic imports.
- Do not author free function calls in when.

## Core Authoring Pattern

```rmt
template ai.minimal {
  state ai.message type object preserve {
    initial {
      id "message"
      text "Ready"
      tone "info"
    }
  }

  selector ai.messageView from state ai.message {
    output MessageView
  }

  portal ai.root root "#app" layer surface

  surface ai.home kind page component x-section {
    portal ai.root
    lane visible weight 80 {
      hydrate ai.messageCard from selector ai.messageView
    }
  }
}
```

## Operator Context Map

- `template`: document root for declarations.
- `state`: owned app state; always give `type`.
- `selector`: view-model from `state`, `datasource` or another supported source.
- `surface`: UI surface with `kind`, `component`, `portal`, `lane`.
- `bounds`: fixed numbers stay pixel-exact; `mode responsive` accepts quoted CSS lengths.
- `lane`: scheduling block; lifecycle operations belong here.
- `mount`/`hydrate`: render or hydrate targets from static sources.
- `on ... -> action`: event binding; never call action functions.
- `payload`: map `detail`, `target`, `input` or state paths.
- `validation`: blocking rules and action gate for Maraca.
- `transition`: surface change consumed by Maraca transitions.
- `trust boundary` + `sanitize`: required for trusted output flows.

## Repair Loop

```bash
xt rmt lint app.rmt --agent
```

- Apply `safe: true` workspace edits in `fixOrder`.
- Treat `noOps` as handoff items, not automatic edits.
- Re-run the agent report after every applied batch.

## Maraca Flow

```bash
xt maraca plan app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json
xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json
```

Strict mode should fail early when payload contracts, resource ownership, hydration policy, component capabilities, validation messages or transition targets are incomplete.
