import {
  createModelLoadPlan,
  createQwen3WebGpuRuntimePlan,
  DTYPE_PREFERENCE,
  formatUnsupportedModelReport,
  TARGET_MODEL_ID
} from './model-profile.mjs';
import { createThinkMarkupDeltaFilter } from './thinking-markup.mjs';

let generator = null;
let tokenizer = null;
let currentModel = TARGET_MODEL_ID;
let currentDtype = '';
let currentPlan = null;
let fakeMode = false;
const canceled = new Set();

function post(type, payload = {}) {
  self.postMessage({ type, payload });
}

function choosePreferredDtype(available = DTYPE_PREFERENCE) {
  const set = new Set((available || []).map((entry) => String(entry).trim()).filter(Boolean));
  return DTYPE_PREFERENCE.find((dtype) => set.has(dtype)) || 'fp32';
}

function encodeModelPath(modelId) {
  return String(modelId || '').split('/').map((part) => encodeURIComponent(part)).join('/');
}

async function fetchModelTree(modelId, origin) {
  const base = origin || self.location.origin;
  const response = await fetch(`${base}/hf-api/models/${encodeModelPath(modelId)}/tree/main?recursive=true`, {
    headers: { accept: 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`Hugging Face tree lookup failed for ${modelId}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function resolveModelLoadPlan(modelId, origin) {
  try {
    const tree = await fetchModelTree(modelId, origin);
    return createModelLoadPlan(modelId, tree);
  } catch (error) {
    if (modelId === TARGET_MODEL_ID) {
      post('model-progress', {
        phase: 'loading',
        status: `Could not inspect Hugging Face tree; trying known Qwen3 WebGPU layout. ${error.message || error}`,
        progress: 0.04,
        model: modelId,
        webgpu: typeof navigator !== 'undefined' && Boolean(navigator.gpu)
      });
      return createQwen3WebGpuRuntimePlan(modelId);
    }
    throw error;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

async function loadFakeModel(model, delayMs = 0) {
  fakeMode = true;
  currentModel = model || TARGET_MODEL_ID;
  currentDtype = 'fake';
  if (delayMs > 0) {
    post('model-progress', {
      phase: 'loading',
      status: 'Preparing fake model runtime...',
      progress: 0.25,
      model: currentModel,
      dtype: currentDtype,
      webgpu: typeof navigator !== 'undefined' && Boolean(navigator.gpu)
    });
    await sleep(delayMs);
  }
  post('model-progress', {
    phase: 'ready',
    status: 'Fake model ready for renderer smoke.',
    progress: 1,
    model: currentModel,
    dtype: currentDtype,
    webgpu: typeof navigator !== 'undefined' && Boolean(navigator.gpu)
  });
}

async function loadRealModel(payload = {}) {
  currentModel = payload.model || TARGET_MODEL_ID;
  post('model-progress', {
    phase: 'loading',
    status: 'Loading Transformers.js runtime...',
    progress: 0.02,
    model: currentModel,
    webgpu: typeof navigator !== 'undefined' && Boolean(navigator.gpu)
  });
  if (typeof navigator === 'undefined' || !navigator.gpu) {
    throw new Error('WebGPU is unavailable in this Electron renderer.');
  }
  const transformers = await import('/vendor/transformers/transformers.min.js');
  const { pipeline, env, TextStreamer } = transformers;
  self.TextStreamer = TextStreamer;
  env.allowRemoteModels = true;
  env.useBrowserCache = true;
  env.backends.onnx.wasm ??= {};
  env.backends.onnx.wasm.wasmPaths = '/vendor/transformers/';
  env.remoteHost = payload.origin || self.location.origin;
  currentPlan = await resolveModelLoadPlan(currentModel, payload.origin);
  if (currentPlan.kind === 'unsupported-layout') {
    throw new Error(formatUnsupportedModelReport(currentPlan));
  }
  env.remotePathTemplate = currentPlan.remotePathTemplate;
  currentDtype = currentPlan.selectedDtype || choosePreferredDtype(currentPlan.availableDtypes);
  post('model-progress', {
    phase: 'loading',
    status: `Loading ${currentModel} (${currentDtype}) via ${currentPlan.kind}...`,
    progress: 0.08,
    model: currentModel,
    dtype: currentDtype,
    webgpu: true
  });
  try {
    generator = await pipeline('text-generation', currentModel, {
      device: 'webgpu',
      ...currentPlan.pipelineOptions,
      progress_callback(progress) {
        post('model-progress', {
          phase: 'loading',
          status: progress && progress.status || 'Downloading model asset',
          loaded: progress && progress.loaded || 0,
          total: progress && progress.total || 0,
          progress: progress && Number.isFinite(progress.progress) ? progress.progress / 100 : 0.1,
          model: currentModel,
          dtype: currentDtype,
          webgpu: true
        });
      }
    });
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (/Array buffer allocation failed|ArrayBuffer|allocation/i.test(message) && currentPlan?.kind === 'onnxruntime-webgpu-layout') {
      throw new Error([
        `Model ${currentModel} is not compatible with the current Transformers.js browser WebGPU loader.`,
        `The product Qwen3 ONNX Runtime layout uses a large external data file (${currentPlan.externalDataSize || 'unknown'} bytes) that Transformers.js attempts to materialize as one ArrayBuffer.`,
        `Original loader error: ${message}`
      ].join(' '));
    }
    throw new Error(`Model load failed for ${currentModel} using ${currentPlan.kind}: ${message}`);
  }
  tokenizer = generator.tokenizer;
  post('model-progress', {
    phase: 'ready',
    status: `${currentModel} ready on WebGPU.`,
    progress: 1,
    model: currentModel,
    dtype: currentDtype,
    webgpu: true
  });
}

async function ensureLoaded(payload = {}) {
  if (fakeMode || generator) return;
  if (payload.fake) return loadFakeModel(payload.model, payload.fakeLoadDelayMs);
  await loadRealModel(payload);
}

function lastUserMessage(job) {
  return (job.messages || []).filter((message) => message && message.role === 'user').at(-1)?.content || '';
}

function fakeToolDecision(job) {
  const prompt = lastUserMessage(job);
  if (/\b(today|current|latest|news|weather|stock|price|search|web|internet|recent|2026|heute|aktuell|nachrichten|suche)\b/iu.test(prompt)) {
    const query = prompt.replace(/\/no_think/giu, '').trim().slice(0, 180) || 'current web search';
    const language = /[äöüß]|\b(heute|aktuell|nachrichten|suche)\b/iu.test(prompt) ? 'de-DE' : 'en-US';
    return `<tool_call>{"name":"web_search","arguments":{"query":${JSON.stringify(query)},"maxResults":3,"language":"${language}"}}</tool_call>`;
  }
  return '<no_tool/>';
}

function fakeCompletionText(job) {
  const promptText = (job.messages || []).map((message) => message && message.content || '').join('\n');
  if (/XTEND_TOOL_DECISION/u.test(promptText)) return fakeToolDecision(job);
  if (/XTEND_WEB_SEARCH_RESULTS/u.test(promptText)) {
    return [
      'I checked the available web results and grounded the answer in the returned sources. ',
      'The most relevant result indicates the requested current fact should be cited from the search context [1]. ',
      'If you need a deeper answer, I can refine the search query.'
    ].join('');
  }
  const text = [
    'This is the XTend local smoke response. ',
    '**XTend** formatting is still rendered through the markdown bridge. ',
    'The renderer worker streamed it through the Electron preload bridge, ',
    'while the RMT Maraca shell stayed in charge of the app surface.\n\n',
    '- **Bold** and *emphasis* are materialized as DOM nodes.\n',
    '- `Inline code` stays separate from generated code blocks.\n\n',
    "'''javascript\n",
    "console.log('XTend code block hydrated by x-code');\n",
    "'''\n\n",
    'The code block above is rendered as an XTend x-code component.'
  ].join('');
  return text;
}

async function generateFake(job, options = {}) {
  const text = fakeCompletionText(job);
  if (options.stream === false) {
    return {
      text,
      finishReason: 'stop',
      metrics: { fake: true, tokens: text.split(/\s+/u).filter(Boolean).length }
    };
  }
  let written = '';
  for (const chunk of text.match(/[\s\S]{1,18}/gu) || []) {
    if (canceled.has(job.jobId)) return;
    written += chunk;
    post('generation-delta', {
      jobId: job.jobId,
      conversationId: job.conversationId,
      delta: chunk,
      tokenCount: written.split(/\s+/u).filter(Boolean).length,
      at: Date.now()
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  return {
    text: written,
    finishReason: 'stop',
    metrics: { fake: true, tokens: written.split(/\s+/u).filter(Boolean).length }
  };
}

function extractGeneratedText(output) {
  const generated = output?.[0]?.generated_text;
  if (Array.isArray(generated)) return generated.at(-1)?.content || '';
  if (typeof generated === 'string') return generated;
  return '';
}

async function generateReal(job, options = {}) {
  await ensureLoaded(job);
  const started = performance.now();
  let text = '';
  let tokenCount = 0;
  const thinkFilter = createThinkMarkupDeltaFilter();
  const generationOptions = {
    max_new_tokens: job.maxNewTokens || 512,
    do_sample: false
  };
  if (options.stream !== false) {
    const Streamer = self.TextStreamer;
    generationOptions.streamer = new Streamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function(chunk) {
        if (canceled.has(job.jobId)) return;
        text += chunk;
        tokenCount += 1;
        const visibleDelta = thinkFilter.push(chunk);
        if (!visibleDelta) return;
        post('generation-delta', {
          jobId: job.jobId,
          conversationId: job.conversationId,
          delta: visibleDelta,
          tokenCount,
          at: Date.now()
        });
      }
    });
  }
  const output = await generator(job.messages || [], generationOptions);
  if (canceled.has(job.jobId)) return;
  const rawText = text || extractGeneratedText(output);
  const finalText = thinkFilter.complete(rawText);
  const elapsedMs = performance.now() - started;
  return {
    text: finalText,
    finishReason: 'stop',
    metrics: {
      elapsedMs,
      tokens: tokenCount,
      tokensPerSecond: tokenCount > 0 ? tokenCount / (elapsedMs / 1000) : 0,
      model: currentModel,
      dtype: currentDtype
    }
  };
}

self.addEventListener('message', (event) => {
  const message = event.data || {};
  const payload = message.payload || {};
  if (message.type === 'load') {
    ensureLoaded(payload).catch((error) => {
      post('model-progress', {
        phase: 'error',
        code: /not compatible|not loadable|external data|ArrayBuffer|Array buffer allocation failed/i.test(error && error.message ? error.message : String(error))
          ? 'xtend-llm.model_unsupported'
          : 'xtend-llm.model_load_failed',
        status: error && error.message ? error.message : String(error),
        model: payload.model || currentModel,
        dtype: currentDtype,
        webgpu: typeof navigator !== 'undefined' && Boolean(navigator.gpu)
      });
    });
    return;
  }
  if (message.type === 'cancel') {
    if (payload.jobId) canceled.add(payload.jobId);
    return;
  }
  if (message.type === 'generate') {
    const job = payload;
    const run = job.fake || fakeMode ? generateFake(job) : generateReal(job);
    run.then((complete) => {
      if (!complete || canceled.has(job.jobId)) return;
      post('generation-complete', {
        jobId: job.jobId,
        conversationId: job.conversationId,
        text: complete.text,
        finishReason: complete.finishReason || 'stop',
        metrics: complete.metrics || {}
      });
    }).catch((error) => {
      post('generation-error', {
        jobId: job.jobId,
        conversationId: job.conversationId,
        code: 'xtend-llm.generation_failed',
        message: error && error.message ? error.message : String(error)
      });
    });
    return;
  }
  if (message.type === 'generate-once') {
    const job = payload;
    const requestId = job.requestId || '';
    const run = job.fake || fakeMode ? generateFake(job, { stream: false }) : generateReal(job, { stream: false });
    run.catch((error) => {
      post('generation-once-error', {
        requestId,
        jobId: job.jobId,
        conversationId: job.conversationId,
        code: 'xtend-llm.generation_failed',
        message: error && error.message ? error.message : String(error)
      });
    }).then((complete) => {
      if (!complete || canceled.has(job.jobId)) return;
      post('generation-once-complete', {
        requestId,
        jobId: job.jobId,
        conversationId: job.conversationId,
        text: complete.text,
        finishReason: complete.finishReason || 'stop',
        metrics: complete.metrics || {}
      });
    });
  }
});
