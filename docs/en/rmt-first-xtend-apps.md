# RMT-first XTend Apps

An architecture path for apps whose shell comes from RMT.

## What it covers

An RMT-first application owns its shell, state, and actions in RMT source. HTML provides mount targets and local modules only; imperative host JavaScript remains limited to adapters and real platform services.

## Public building blocks

- `xtendrmt/rmt-first-demo-app.rmt` is the minimal shell.
- `xtendrmt/rmt-app-runtime.js` accepts core records into the runtime.
- `components/manifest.json` supplies locally allowed UI tags.

## Recommended workflow

Start with one surface and one state record. Add actions and resources only after the first core snapshot is stable, and keep network, storage, or browser APIs behind an explicit host adapter.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Verify the shell contract

```bash
node scripts/run_xtend_tests.js rmt-first-class-app --json
```

The gate checks source, registry, and host boundary together. Parser success is insufficient if the shell still needs manual UI creation or a second state owner.
