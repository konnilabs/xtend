# N26-04 – XTend-LLM Native Runtime Evidence

- Status: `implemented-offline`
- Node-24 gate: `npm run test:native:runtime:node24`
- Node-26 gate: `npm run test:native:runtime:node26`
- Full product lanes: `npm run test:node24:product` and `npm run test:node26:product`
- Reports: `.xtend-llm-results/native-runtime-node-24-lts.json` and `.xtend-llm-results/native-runtime-node-26-current.json`
- Network policy: offline only; no model or fixture download and no synthetic success result

Both gates start through the portable launcher and execute inside the Electron main process. Their reports keep launcher-host Node/npm evidence separate from Electron's upstream-owned embedded Node runtime.

The full product lanes deliberately use `test:n26:contracts`, then `test:catfood`, then Electron runtime and native evidence. This keeps N26 acceptance independent of unrelated product fixtures while still requiring the AppServices build and layout source-to-sea smoke before the native ABI gates.

Electron 42 resolves its binary lazily. Dependency acquisition is therefore an explicit prerequisite via `npm run runtime:install:electron`; the evidence commands use `--xtend-require-installed` and fail before execution when the pinned binary is absent. This keeps installation/network authority outside the evidence run itself.

## ONNX Runtime

`tests/tiny-onnx-identity.mjs` deterministically encodes a minimal ONNX ModelProto in memory:

- IR version 8;
- default-domain opset 13;
- one float tensor `X` with shape `[1]`;
- one `Identity` node from `X` to `Y`;
- one float tensor `Y` with shape `[1]`.

The native gate creates an `onnxruntime-node` CPU `InferenceSession` directly from those bytes inside Electron, invokes it with `X = 7`, requires `Y = 7`, releases the session and records the model SHA-256. Missing bindings, ABI/load errors and wrong output remain blocking.

## Sharp

The same Electron process performs a real native Sharp operation from an inline 2×2 RGBA buffer, resizes it through libvips, encodes PNG, decodes its metadata and records the output hash. Missing bindings, ABI/load errors or output-contract drift remain blocking.
