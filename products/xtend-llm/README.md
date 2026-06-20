# XTend LLM Product

Local Electron AI chat product for exercising XTendRMT, Maraca, Fabric/kernel orchestration and a Transformers.js WebGPU runtime.

## Commands

```bash
npm install
npm run rmt:plan
npm run rmt:build
npm run rmt:build:debug
npm run model:install
npm run build
npm start
```

`npm test` runs product-local unit checks without requiring Electron or model downloads. `npm run test:real-model` is opt-in and requires Electron, WebGPU and access to the Hugging Face model assets.

## Model Installer

`npm run model:install` installs the app's default local model, `onnx-community/Qwen3-0.6B-ONNX`, into the permanent Electron user data directory instead of a temporary test cache. On macOS this defaults to:

```text
~/Library/Application Support/XTend Local LLM/model-cache
```

The installer writes `installed-models.json` in that cache root. Downloaded files are validated against Hugging Face metadata and recorded with `expectedBytes`; the Electron main process only accepts the manifest when every cached file is present at the expected size. The packaged app can then reuse the installed weights without being launched through a terminal test harness.

Useful installer variants:

```bash
npm run model:install
npm run model:install -- --force
npm run model:install -- --user-data="$PWD/.cache/app-user-data"
npm run model:install:qwen3-8b
```

`npm run model:install:qwen3-8b` intentionally acts as a compatibility gate for `onnx-community/Qwen3-8B-ONNX`. At the moment it reports the same unsupported-browser-loader condition as `npm run test:real-model` when the Qwen3-8B ONNX Runtime WebGPU external-data file exceeds the browser-safe ArrayBuffer limit.

## App Build

`npm run rmt:build` is the production Maraca path for this product. It uses ProductSurface kernel boot, strict orchestration/kernel/validation/transitions, prewarm hydration intent, Prewarm Worker runtime evidence, Template Artifacts, Policy Parity and Production Bundle Closure. Use `npm run rmt:build:debug` only for local bundle inspection with debug sourcemaps.

`npm run build` creates a local macOS Electron app bundle at:

```text
products/xtend-llm/dist/mac/XTend Local LLM.app
```

The bundle contains the Electron runtime, the product app sources, the Maraca build output, the product dependencies except the development Electron package, and the XTendRMT SSR adapter files needed by the Node host. The app still uses Electron `userData` for conversations and installed model weights, so Node orchestration is owned by the app process rather than an external `npm start` session.

When launching the app binary directly from a terminal that has `ELECTRON_RUN_AS_NODE=1`, unset that variable so Electron starts as an app:

```bash
env -u ELECTRON_RUN_AS_NODE "dist/mac/XTend Local LLM.app/Contents/MacOS/XTend Local LLM"
```

## LLM Terminal Suite

The LLM terminal suite exercises the model runtime independently from the visible app shell. It starts a hidden Electron/Chromium page, loads the same Transformers.js worker through the local app server, sends a deterministic prompt, streams the response, and fails when the answer is empty or looks like random character noise.

```bash
npm run test:llm:fake
npm run test:llm
npm run test:real-model
```

- `npm run test:llm:fake` verifies the terminal harness without downloading model assets.
- `npm run test:llm` is the real WebGPU answer smoke for `onnx-community/Qwen3-0.6B-ONNX`.
- `npm run test:real-model` and `npm run test:llm:qwen3-8b` are the target-model compatibility gates for `onnx-community/Qwen3-8B-ONNX`.
- Reports are written to `.xtend-llm-results/llm-terminal-fake.json`, `.xtend-llm-results/llm-terminal-smoke.json`, and `.xtend-llm-results/llm-terminal-qwen3-8b.json`; `.xtend-llm-results/llm-terminal-real.json` mirrors the last non-fake run.
- The real-model cache defaults to `.cache/llm-terminal-user-data`; override it with `XTEND_LLM_TEST_USER_DATA`.
- The real run prints startup details, the WebGPU probe, worker progress and Hugging Face asset cache/download progress to the terminal.
- The current Qwen3-8B ONNX Runtime WebGPU profile contains a single 6GB+ `model.onnx.data` file. The compatibility gate fails early with an explicit report when Transformers.js would otherwise hit Chromium's ArrayBuffer allocation path.

Useful real-smoke overrides:

```bash
XTEND_LLM_TEST_USER_DATA="$HOME/Library/Application Support/XTend Local LLM" npm run test:llm
XTEND_LLM_TEST_PROMPT="Answer in one short English sentence: what is two plus three?" npm run test:llm
npm run test:llm -- --expected="\\b(5|five)\\b" --max-new-tokens=64
npm run test:llm -- --debug-renderer
```

## Runtime Boundary

- Electron main owns persistence, Node SSR, the local app server, model-cache proxying and IPC validation.
- The renderer owns the XTend app shell and a dedicated worker for WebGPU inference.
- The preload bridge exposes bounded app commands plus `window.xtendLlm.telemetry()` for RKFA/Maraca/AppRuntime diagnostics used by tests and the Settings Runtime tab.
- The Settings Runtime tab summarizes ProductSurface, Production Closure, Template Artifacts, Prewarm Worker, Backpressure/Yield and Panic/Recovery telemetry.
- The default app model is `onnx-community/Qwen3-0.6B-ONNX` because it passes the local Transformers.js WebGPU answer smoke. `onnx-community/Qwen3-8B-ONNX` remains the target-model compatibility gate and fails explicitly until its current external-data layout is browser-loadable.
