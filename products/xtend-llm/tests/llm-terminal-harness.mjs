import { assessLlmResponseQuality } from '/src/llm/response-quality.mjs';

function timeout(ms, message) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

function terminalLog(event, payload = {}) {
  console.info(`[xtend-llm-terminal] ${JSON.stringify({
    event,
    at: new Date().toISOString(),
    ...payload
  })}`);
}

function createJob(options) {
  return {
    schema: 'xtend-llm.terminal-generation-job.v1',
    jobId: `terminal-${Date.now().toString(36)}`,
    conversationId: 'terminal-conversation',
    model: options.model,
    maxNewTokens: options.maxNewTokens || 64,
    messages: options.messages || [
      {
        role: 'system',
        content: 'You are a precise assistant. Answer with one short, meaningful English sentence.'
      },
      {
        role: 'user',
        content: `${options.prompt || 'What is two plus three?'}\n/no_think`
      }
    ]
  };
}

function terminalRun(options = {}) {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const worker = new Worker('/src/llm/transformers-worker.mjs', { type: 'module' });
    const events = [];
    let loaded = false;
    let response = '';
    let tokenCount = 0;
    let loadReadyAt = 0;
    let generationStartedAt = 0;
    let firstTokenAt = 0;
    let settled = false;
    const job = createJob(options);
    let lastProgressLogAt = 0;
    let lastProgressPercent = -1;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearInterval(heartbeat);
      worker.terminate();
      terminalLog('finish', {
        ok: result.ok === true,
        status: result.status || 'unknown',
        responseChars: String(result.response || '').length
      });
      resolve({
        schema: 'xtend-llm.terminal-suite-result.v1',
        ...result,
        model: options.model,
        fake: options.fake === true,
        prompt: job.messages.at(-1)?.content || '',
        events,
        timings: {
          totalMs: performance.now() - startedAt,
          loadMs: loadReadyAt ? loadReadyAt - startedAt : 0,
          firstTokenMs: firstTokenAt && generationStartedAt ? firstTokenAt - generationStartedAt : 0,
          generationMs: generationStartedAt ? performance.now() - generationStartedAt : 0
        }
      });
    };

    const loadTimer = timeout(options.loadTimeoutMs || 45 * 60 * 1000, 'Timed out while loading model.');
    const generationTimer = () => timeout(options.generationTimeoutMs || 5 * 60 * 1000, 'Timed out while waiting for model response.');
    const heartbeat = setInterval(() => {
      if (!settled) {
        terminalLog('heartbeat', {
          elapsedMs: performance.now() - startedAt,
          modelReady: loaded,
          responseChars: response.length,
          tokenCount
        });
      }
    }, 15000);

    loadTimer.catch((error) => finish({ ok: false, status: 'load-timeout', error: error.message }));

    worker.addEventListener('error', (event) => {
      finish({
        ok: false,
        status: 'worker-error',
        error: event.message || 'Worker failed before it posted a result.'
      });
    });

    worker.addEventListener('messageerror', () => {
      finish({
        ok: false,
        status: 'worker-message-error',
        error: 'Worker posted a message that could not be deserialized.'
      });
    });

    worker.addEventListener('message', (event) => {
      const message = event.data || {};
      const payload = message.payload || {};
      if (message.type === 'model-progress') {
        events.push({ type: message.type, payload });
        const progress = Number.isFinite(payload.progress) ? payload.progress : 0;
        const percent = Math.floor(progress * 100);
        const now = performance.now();
        if (now - lastProgressLogAt > 1500 || percent >= lastProgressPercent + 5 || payload.phase === 'ready' || payload.phase === 'error') {
          lastProgressLogAt = now;
          lastProgressPercent = percent;
          terminalLog('model-progress', {
            phase: payload.phase || '',
            status: payload.status || '',
            model: payload.model || '',
            dtype: payload.dtype || '',
            webgpu: payload.webgpu === true,
            loaded: payload.loaded || 0,
            total: payload.total || 0,
            progress
          });
        }
        if (payload.phase === 'error') {
          finish({ ok: false, status: payload.code || 'model-error', error: payload.status || 'Model load failed.' });
          return;
        }
        if (payload.phase === 'ready' && !loaded) {
          loaded = true;
          loadReadyAt = performance.now();
          generationStartedAt = performance.now();
          terminalLog('generation-start', {
            maxNewTokens: job.maxNewTokens,
            promptChars: job.messages.at(-1)?.content?.length || 0
          });
          generationTimer().catch((error) => finish({ ok: false, status: 'generation-timeout', error: error.message }));
          worker.postMessage({
            type: 'generate',
            payload: {
              ...job,
              fake: options.fake === true
            }
          });
        }
        return;
      }

      if (message.type === 'generation-delta') {
        if (!firstTokenAt) firstTokenAt = performance.now();
        tokenCount = payload.tokenCount || tokenCount + 1;
        response += payload.delta || '';
        if (tokenCount === 1 || tokenCount % 8 === 0) {
          terminalLog('generation-delta', {
            tokenCount,
            responseChars: response.length
          });
        }
        return;
      }

      if (message.type === 'generation-error') {
        finish({
          ok: false,
          status: 'generation-error',
          error: payload.message || 'Generation failed.',
          response
        });
        return;
      }

      if (message.type === 'generation-complete') {
        response = payload.text || response;
        const quality = assessLlmResponseQuality(response, {
          expectedPattern: options.expectedPattern,
          minChars: options.minChars,
          minWords: options.minWords
        });
        finish({
          ok: quality.ok,
          status: quality.ok ? 'passed' : 'quality-failed',
          response: quality.text,
          quality,
          metrics: {
            ...payload.metrics,
            observedTokens: tokenCount
          }
        });
      }
    });

    terminalLog('load-start', {
      model: options.model,
      fake: options.fake === true
    });
    worker.postMessage({
      type: 'load',
      payload: {
        origin: window.location.origin,
        model: options.model,
        fake: options.fake === true
      }
    });
  });
}

window.__xtendLlmTerminalRun = terminalRun;
