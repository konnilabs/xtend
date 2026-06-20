import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createXtendLlmAppServer } from '../src/main/app-server.mjs';
import { configureElectronWebGpu } from '../src/main/electron-webgpu.mjs';
import {
  DEFAULT_SYSTEM_PROMPT,
  QWEN3_8B_MODEL_ID,
  SMOKE_MODEL_ID,
} from '../src/main/constants.mjs';
import { createModelCachePaths } from '../src/main/model-cache.mjs';

const require = createRequire(import.meta.url);
const { app, BrowserWindow } = require('electron');
const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resultDir = path.join(productRoot, '.xtend-llm-results');
const args = process.argv.slice(2).filter((arg) => arg !== '--');
const argMap = new Map();
for (const arg of args) {
  const [key, ...rest] = arg.split('=');
  argMap.set(key, rest.length ? rest.join('=') : 'true');
}

function intArg(name, fallback) {
  const value = Number.parseInt(argMap.get(name) || '', 10);
  return Number.isFinite(value) ? value : fallback;
}

function reportFileName(report) {
  if (report.fake) return 'llm-terminal-fake.json';
  if (report.targetGate) return 'llm-terminal-qwen3-8b.json';
  return 'llm-terminal-smoke.json';
}

function writeReport(report) {
  fs.mkdirSync(resultDir, { recursive: true });
  const body = `${JSON.stringify(report, null, 2)}\n`;
  const reportPath = path.join(resultDir, reportFileName(report));
  fs.writeFileSync(reportPath, body);
  if (!report.fake) {
    fs.writeFileSync(path.join(resultDir, 'llm-terminal-real.json'), body);
  }
  return reportPath;
}

const fake = argMap.has('--fake') || process.env.XTEND_LLM_TEST_FAKE === '1';
const target = argMap.has('--target') || process.env.XTEND_LLM_TEST_TARGET === '1';
const model = argMap.get('--model') || process.env.XTEND_LLM_TEST_MODEL || (target ? QWEN3_8B_MODEL_ID : SMOKE_MODEL_ID);
const targetGate = target || model === QWEN3_8B_MODEL_ID;
const userData = process.env.XTEND_LLM_TEST_USER_DATA
  || path.join(productRoot, '.cache', fake ? 'llm-terminal-fake-user-data' : 'llm-terminal-user-data');
const prompt = argMap.get('--prompt') || process.env.XTEND_LLM_TEST_PROMPT || 'Answer in one short English sentence: what is two plus three?';
const expectedPattern = fake
  ? 'XTend local smoke response'
  : (argMap.get('--expected') || process.env.XTEND_LLM_TEST_EXPECTED || '\\b(5|five)\\b');
const quiet = argMap.has('--quiet') || process.env.XTEND_LLM_TEST_QUIET === '1';
const debugRenderer = argMap.has('--debug-renderer') || process.env.XTEND_LLM_TEST_DEBUG_RENDERER === '1';

configureElectronWebGpu(app);
app.setPath('userData', userData);

let server = null;
let window = null;

function log(message) {
  if (!quiet) console.log(`[xtend-llm] ${message}`);
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GiB`;
}

function logAssetProgress(event) {
  if (quiet) return;
  const asset = String(event.asset || '').split('/').pop() || event.asset || 'asset';
  if (event.phase === 'cache-hit') {
    log(`model asset cache hit: ${asset} (${formatBytes(event.loaded)})`);
    return;
  }
  if (event.phase === 'download-start') {
    log(`model asset download started: ${asset}`);
    return;
  }
  if (event.phase === 'download-progress') {
    const percent = event.total ? `${Math.floor(event.progress * 100)}%` : 'unknown total';
    log(`model asset downloading: ${asset} ${formatBytes(event.loaded)} / ${event.total ? formatBytes(event.total) : '?'} (${percent})`);
    return;
  }
  if (event.phase === 'download-complete') {
    log(`model asset cached: ${asset} (${formatBytes(event.loaded)})`);
    return;
  }
  if (event.phase === 'download-error') {
    log(`model asset download failed: ${asset} ${event.status || ''}`.trim());
  }
}

async function probeWebGpu() {
  return window.webContents.executeJavaScript(`
    Promise.race([
      (async () => {
        const hasNavigatorGpu = typeof navigator !== 'undefined' && Boolean(navigator.gpu);
        if (!hasNavigatorGpu) return { hasNavigatorGpu, hasAdapter: false };
        const adapter = await navigator.gpu.requestAdapter();
        return {
          hasNavigatorGpu,
          hasAdapter: Boolean(adapter),
          features: adapter ? Array.from(adapter.features || []) : [],
          limits: adapter ? {
            maxBufferSize: adapter.limits.maxBufferSize,
            maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize
          } : null
        };
      })(),
      new Promise((resolve) => setTimeout(() => resolve({ hasNavigatorGpu: Boolean(navigator.gpu), hasAdapter: false, timeout: true }), 5000))
    ])
  `);
}

async function run() {
  const cache = createModelCachePaths(userData, model);
  log(`starting terminal suite for ${model}${fake ? ' (fake mode)' : ''}`);
  log(`userData: ${userData}`);
  log(`model cache: ${cache.root}`);
  server = createXtendLlmAppServer({
    userData,
    cacheRoot: cache.root,
    onModelAssetProgress: logAssetProgress
  });
  const serverUrl = await server.listen(0);
  log(`local app server: ${serverUrl}`);
  window = new BrowserWindow({
    width: 960,
    height: 640,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });
  window.webContents.on('console-message', (details) => {
    const message = String(details.message || '');
    if (message.startsWith('[xtend-llm-terminal]')) {
      log(message.replace('[xtend-llm-terminal] ', ''));
      return;
    }
    if (debugRenderer) {
      log(`renderer console ${details.level}: ${message} (${details.sourceId}:${details.lineNumber})`);
    }
  });
  window.webContents.on('unresponsive', () => {
    log('renderer became unresponsive while running the LLM terminal suite');
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    log(`renderer process gone: ${JSON.stringify(details)}`);
  });
  await window.loadURL(new URL('/llm-harness', serverUrl).href);
  if (!fake) {
    const webgpu = await probeWebGpu();
    log(`webgpu probe: ${JSON.stringify(webgpu)}`);
    if (!webgpu.hasNavigatorGpu || !webgpu.hasAdapter) {
      const reportPath = writeReport({
        schema: 'xtend-llm.terminal-suite-result.v1',
        ok: false,
        status: 'webgpu-unavailable',
        error: `WebGPU unavailable in Electron terminal renderer: ${JSON.stringify(webgpu)}`,
        fake,
        targetGate,
        model,
        cacheRoot: cache.root,
        userData,
        createdAt: new Date().toISOString()
      });
      console.error(`LLM terminal suite failed: webgpu-unavailable`);
      console.error(`Report: ${reportPath}`);
      app.exit(1);
      return;
    }
  }
  await window.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (typeof window.__xtendLlmTerminalRun === 'function') {
          resolve(true);
          return;
        }
        if (Date.now() - started > 8000) {
          reject(new Error('Timed out waiting for LLM terminal harness.'));
          return;
        }
        setTimeout(tick, 50);
      };
      tick();
    })
  `);
  const options = {
    fake,
    model,
    prompt,
    expectedPattern,
    maxNewTokens: intArg('--max-new-tokens', Number.parseInt(process.env.XTEND_LLM_TEST_MAX_NEW_TOKENS || '64', 10)),
    loadTimeoutMs: intArg('--load-timeout-ms', Number.parseInt(process.env.XTEND_LLM_TEST_LOAD_TIMEOUT_MS || `${45 * 60 * 1000}`, 10)),
    generationTimeoutMs: intArg('--generation-timeout-ms', Number.parseInt(process.env.XTEND_LLM_TEST_GENERATION_TIMEOUT_MS || `${5 * 60 * 1000}`, 10)),
    minChars: intArg('--min-chars', 12),
    minWords: intArg('--min-words', 3),
    messages: [
      {
        role: 'system',
        content: DEFAULT_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `${prompt}\n/no_think`
      }
    ]
  };
  const result = await window.webContents.executeJavaScript(
    `window.__xtendLlmTerminalRun(${JSON.stringify(options)})`,
    true
  );
  const report = {
    ...result,
    targetGate,
    command: targetGate
      ? 'npm run test:real-model --prefix products/xtend-llm'
      : 'npm run test:llm --prefix products/xtend-llm',
    cacheRoot: cache.root,
    userData,
    platform: process.platform,
    arch: process.arch,
    node: process.versions.node,
    electron: process.versions.electron,
    createdAt: new Date().toISOString()
  };
  const reportPath = writeReport(report);
  if (!report.ok) {
    console.error(`LLM terminal suite failed: ${report.status}`);
    if (report.error) console.error(report.error);
    if (report.quality?.reasons?.length) console.error(report.quality.reasons.join('\n'));
    console.error(`Report: ${reportPath}`);
    app.exit(1);
    return;
  }
  console.log(`LLM terminal suite passed: ${report.response}`);
  console.log(`Report: ${reportPath}`);
  app.quit();
}

app.whenReady().then(run).catch((error) => {
  const reportPath = writeReport({
    schema: 'xtend-llm.terminal-suite-result.v1',
    ok: false,
    status: 'runner-error',
    error: error && error.stack ? error.stack : String(error),
    fake,
    targetGate,
    model,
    createdAt: new Date().toISOString()
  });
  console.error(`LLM terminal suite runner failed. Report: ${reportPath}`);
  app.exit(1);
});

app.on('before-quit', async () => {
  if (window && !window.isDestroyed()) window.destroy();
  if (server) await server.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
