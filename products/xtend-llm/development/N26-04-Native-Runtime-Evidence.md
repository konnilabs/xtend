# N26-04 – XTend-LLM Native Runtime Evidence

- Status: `implemented-local-manual`
- Evidence class: lokale/manuelle Desktop-Owner-Evidence; niemals blockierende GitHub-/Publish-Voraussetzung
- Node-24 gate: `npm run test:native:runtime:node24`
- Node-26 gate: `npm run test:native:runtime:node26`
- CI-safe product contract lanes: `npm run test:node24:product` and `npm run test:node26:product`
- Local full product lanes: `npm run test:electron:node24:product` and `npm run test:electron:node26:product`
- Reports: `.xtend-llm-results/native-runtime-node-24-lts.json` and `.xtend-llm-results/native-runtime-node-26-current.json`
- Network policy: offline only; no model or fixture download and no synthetic success result

Both gates start through the portable launcher and execute inside the Electron main process. Their reports keep launcher-host Node/npm evidence separate from Electron's upstream-owned embedded Node runtime. They are intentionally excluded from GitHub Actions, Full Release and publish prerequisites: Electron's SUID sandbox requires host configuration that is not reliably available on GitHub runners, and disabling the sandbox is not accepted as release evidence.

The CI-safe product lanes use `test:n26:contracts` plus `test:catfood:ci` only. The local full product lanes extend the same checks with Electron runtime and native evidence. They provide optional desktop-owner confidence without participating in N26 host-runtime acceptance. Blocking CI uses the Electron-free product lanes and the root `node-native-toolchain-smoke`. `test:catfood` remains the short alias for `test:catfood:ci`; `test:catfood:electron` is the explicit local layout command and `test:catfood:smoke` remains a compatibility alias only.

Electron 42 resolves its binary lazily. Dependency acquisition is therefore an explicit local prerequisite via `npm run runtime:install:electron`; the evidence commands use `--xtend-require-installed` and fail before execution when the pinned binary is absent. This keeps installation/network authority outside the evidence run itself and prevents CI from acquiring or starting Electron implicitly.

## ONNX Runtime

`tests/tiny-onnx-identity.mjs` deterministically encodes a minimal ONNX ModelProto in memory:

- IR version 8;
- default-domain opset 13;
- one float tensor `X` with shape `[1]`;
- one `Identity` node from `X` to `Y`;
- one float tensor `Y` with shape `[1]`.

The native evidence creates an `onnxruntime-node` CPU `InferenceSession` directly from those bytes inside Electron, invokes it with `X = 7`, requires `Y = 7`, releases the session and records the model SHA-256. Missing bindings, ABI/load errors and wrong output fail this explicitly requested local evidence run, but never block GitHub CI/CD or framework publish.

## Sharp

The same Electron process performs a real native Sharp operation from an inline 2×2 RGBA buffer, resizes it through libvips, encodes PNG, decodes its metadata and records the output hash. Missing bindings, ABI/load errors or output-contract drift fail this explicitly requested local evidence run only.
