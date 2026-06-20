import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  CHANNELS,
  PRODUCT_TITLE,
  RMT_KNOWLEDGE_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
  TARGET_MODEL_ID
} from './constants.mjs';
import { ConversationStore } from './conversation-store.mjs';
import { SettingsStore } from './settings-store.mjs';
import {
  createId,
  normalizeAttachGenerationSources,
  normalizeCancelGeneration,
  normalizeCopyText,
  normalizeDeleteConversation,
  normalizeExecuteTool,
  normalizeGenerationComplete,
  normalizeGenerationDelta,
  normalizeGenerationError,
  normalizeModelProgress,
  normalizeRegenerateAssistantMessage,
  normalizeResetApp,
  normalizeSubmitMessage,
  normalizeUpdateSettings
} from './ipc-contract.mjs';
import {
  createModelCachePaths,
  createModelState,
  readInstalledModelManifest,
  validateInstalledModelManifest
} from './model-cache.mjs';
import { createXtendLlmAppServer } from './app-server.mjs';
import { configureElectronWebGpu } from './electron-webgpu.mjs';
import {
  configureExternalNavigation,
  shouldOpenExternalUrl
} from './external-navigation.mjs';
import { executeWebSearch } from './tools/web-search.mjs';
import { executeRmtKnowledge } from './tools/rmt-knowledge.mjs';

const require = createRequire(import.meta.url);
const { app, BrowserWindow, clipboard, ipcMain, shell } = require('electron');
const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dev = process.argv.includes('--dev') || process.argv.includes('--') && process.argv.includes('--dev');
const layoutSmoke = process.argv.includes('--layout-smoke');

configureElectronWebGpu(app);
app.setName(PRODUCT_TITLE);

if (layoutSmoke) {
  app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-layout-')));
}

let mainWindow = null;
let appServer = null;
let serverUrl = '';
let store = null;
let settingsStore = null;
let runtimeModelId = TARGET_MODEL_ID;
let modelState = createModelState({ model: runtimeModelId });
const activeJobs = new Map();
const maracaReportPath = path.join(productRoot, 'site', 'build', 'xtend.maraca.report.json');

function emit(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function conversationPatch(extra = {}) {
  return {
    schema: 'xtend-llm.conversation-patch.v1',
    activeConversationId: store.state.activeConversationId,
    conversations: store.listConversations(),
    activeConversation: store.activeConversation,
    ...extra
  };
}

function settingsPatch(extra = {}) {
  return {
    schema: 'xtend-llm.settings-patch.v1',
    settings: settingsStore.snapshot(),
    ...extra
  };
}

function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return {
      ok: false,
      error: error && error.message ? error.message : String(error)
    };
  }
}

function summarizeTemplateArtifacts(report = {}) {
  const artifacts = report && report.templateArtifacts || null;
  if (!artifacts) return null;
  return {
    ok: artifacts.ok === true,
    status: artifacts.status || 'unknown',
    trusted: artifacts.trusted === true,
    sourceFingerprint: artifacts.sourceFingerprint || '',
    artifactBundleFingerprint: artifacts.artifactBundleFingerprint || '',
    bundleFingerprint: artifacts.bundleFingerprint || '',
    documentIds: Array.isArray(artifacts.documentIds) ? artifacts.documentIds : [],
    templateIds: Array.isArray(artifacts.templateIds) ? artifacts.templateIds : []
  };
}

function summarizeMaracaReport(report = {}) {
  const productionClosure = report && report.productionClosure || null;
  const kernel = report && report.kernel || {};
  const prewarmWorker = kernel && kernel.prewarmWorker || report.prewarmWorker || null;
  const hydration = report && report.hydration || {};
  const workerPrerender = hydration.workerPrerender || hydration.summary?.workerPrerender || null;
  const serverPrerender = hydration.serverPrerender || hydration.summary?.serverPrerender || null;
  const policyParity = report && (report.policyParity || kernel.policyParity) || null;
  const kernelFeatureAdoption = report && (report.kernelFeatureAdoption || kernel.featureAdoption) || null;
  const strictFallbackCount = productionClosure && productionClosure.releaseConstraint
    ? Number(productionClosure.releaseConstraint.strictFallbackCount || 0)
    : 0;
  return {
    schema: 'xtend-llm.maraca-telemetry-summary.v1',
    reportPath: maracaReportPath,
    reportPresent: Boolean(report && report.schema),
    ok: report.ok !== false,
    profile: report.profile || '',
    status: report.status || '',
    productionClosure,
    kernelFeatureAdoption,
    templateArtifacts: summarizeTemplateArtifacts(report),
    policyParity,
    productSurface: kernel && kernel.productSurface || null,
    prewarmWorker,
    workerPrerender,
    serverPrerender,
    warmReentry: report && report.warmReentry || null,
    strictFallbackCount
  };
}

function createMainTelemetrySnapshot() {
  const report = readJsonFile(maracaReportPath);
  const maraca = summarizeMaracaReport(report && report.schema ? report : {});
  const prewarmWorkerStatus = maraca.prewarmWorker && (maraca.prewarmWorker.runtimeExpectedStatus || maraca.prewarmWorker.status) || 'unknown';
  return {
    schema: 'xtend-llm.telemetry-snapshot.v1',
    at: new Date().toISOString(),
    maraca,
    runtime: {
      mainProcess: {
        schema: 'xtend-llm.main-runtime-telemetry.v1',
        activeJobCount: activeJobs.size,
        activeJobs: Array.from(activeJobs.keys()),
        model: modelState
      }
    },
    worker: null,
    summary: {
      ok: maraca.ok !== false && (!maraca.productionClosure || maraca.productionClosure.ok !== false),
      backpressureLevel: 'normal',
      prewarmWorkerStatus,
      strictFallbackCount: maraca.strictFallbackCount || 0
    }
  };
}

function registerIpc() {
  ipcMain.handle(CHANNELS.status, async () => ({
    schema: 'xtend-llm.status.v1',
    serverUrl,
    model: modelState,
    targetModel: runtimeModelId,
    conversation: conversationPatch(),
    settings: settingsStore.snapshot()
  }));

  ipcMain.handle(CHANNELS.createConversation, async () => {
    const conversation = store.createConversation();
    const patch = conversationPatch({ activeConversation: conversation });
    emit(CHANNELS.conversationPatch, patch);
    return patch;
  });

  ipcMain.handle(CHANNELS.selectConversation, async (_event, id) => {
    const conversation = store.selectConversation(String(id || ''));
    const patch = conversationPatch({ activeConversation: conversation });
    emit(CHANNELS.conversationPatch, patch);
    return patch;
  });

  ipcMain.handle(CHANNELS.deleteConversation, async (_event, input) => {
    const request = normalizeDeleteConversation(input);
    for (const [jobId, job] of activeJobs.entries()) {
      if (job.conversationId === request.conversationId) activeJobs.delete(jobId);
    }
    const result = store.deleteConversation(request.conversationId);
    const patch = conversationPatch({
      activeConversation: result.activeConversation,
      deletedConversationId: request.conversationId
    });
    emit(CHANNELS.conversationPatch, patch);
    return patch;
  });

  ipcMain.handle(CHANNELS.getSettings, async () => settingsPatch());

  ipcMain.handle(CHANNELS.updateSettings, async (_event, input) => {
    const update = normalizeUpdateSettings(input);
    const settings = settingsStore.update(update);
    store.setCustomInstructions(settings.customInstructions);
    const patch = settingsPatch({ settings });
    emit(CHANNELS.settingsPatch, patch);
    return patch;
  });

  ipcMain.handle(CHANNELS.resetApp, async (_event, input) => {
    normalizeResetApp(input);
    for (const job of activeJobs.values()) {
      emit(CHANNELS.generationError, {
        schema: 'xtend-llm.generation-error.v1',
        jobId: job.jobId,
        conversationId: job.conversationId,
        code: 'xtend-llm.app_reset',
        message: 'App reset canceled the active generation.'
      });
    }
    activeJobs.clear();
    store.reset();
    const settings = settingsStore.reset();
    store.setCustomInstructions(settings.customInstructions);
    const conversation = conversationPatch({ activeConversation: null, reset: true });
    const settingsResult = settingsPatch({ settings, reset: true });
    emit(CHANNELS.conversationPatch, conversation);
    emit(CHANNELS.settingsPatch, settingsResult);
    return {
      ok: true,
      conversation,
      settings: settingsResult
    };
  });

  ipcMain.handle(CHANNELS.submitMessage, async (_event, input) => {
    const request = normalizeSubmitMessage(input);
    const user = store.addUserMessage(request.conversationId, request.text);
    const jobId = createId('generation');
    store.startAssistantMessage(user.conversation.id, jobId);
    const promptMessages = store.buildPromptMessages(user.conversation.id);
    const job = {
      schema: 'xtend-llm.generation-job.v1',
      jobId,
      conversationId: user.conversation.id,
      messages: promptMessages,
      model: runtimeModelId,
      maxNewTokens: request.maxNewTokens,
      startedAt: new Date().toISOString()
    };
    activeJobs.set(jobId, job);
    const patch = conversationPatch({ job });
    emit(CHANNELS.conversationPatch, patch);
    return patch;
  });

  ipcMain.handle(CHANNELS.copyText, async (_event, input) => {
    const request = normalizeCopyText(input);
    clipboard.writeText(request.text);
    return {
      schema: 'xtend-llm.copy-text-result.v1',
      ok: true,
      messageId: request.messageId
    };
  });

  ipcMain.handle(CHANNELS.regenerateAssistantMessage, async (_event, input) => {
    const request = normalizeRegenerateAssistantMessage(input);
    if (activeJobs.size > 0) throw new Error('A generation is already running.');
    const jobId = createId('generation');
    const result = store.regenerateAssistantMessage(request.conversationId, request.messageId, { jobId });
    const job = {
      schema: 'xtend-llm.generation-job.v1',
      jobId,
      conversationId: request.conversationId,
      regeneratedMessageId: request.messageId,
      messages: result.promptMessages,
      originalPrompt: result.originalPrompt,
      model: runtimeModelId,
      maxNewTokens: request.maxNewTokens,
      startedAt: new Date().toISOString()
    };
    activeJobs.set(jobId, job);
    const patch = conversationPatch({
      activeConversation: result.conversation,
      job,
      regeneratedMessageId: request.messageId
    });
    emit(CHANNELS.conversationPatch, patch);
    return patch;
  });

  ipcMain.handle(CHANNELS.cancelGeneration, async (_event, input) => {
    const request = normalizeCancelGeneration(input);
    const job = activeJobs.get(request.jobId);
    activeJobs.delete(request.jobId);
    if (job) {
      store.completeAssistantMessage(job.conversationId, job.jobId, '', 'canceled');
      emit(CHANNELS.generationError, {
        schema: 'xtend-llm.generation-error.v1',
        jobId: job.jobId,
        conversationId: job.conversationId,
        code: 'xtend-llm.generation_canceled',
        message: 'Generation canceled.'
      });
      emit(CHANNELS.conversationPatch, conversationPatch());
    }
    return { ok: true, jobId: request.jobId };
  });

  ipcMain.handle(CHANNELS.telemetrySnapshot, async () => createMainTelemetrySnapshot());

  ipcMain.handle(CHANNELS.executeTool, async (_event, input) => {
    const request = normalizeExecuteTool(input);
    if (request.name === WEB_SEARCH_TOOL_NAME) {
      return executeWebSearch(request);
    }
    if (request.name === RMT_KNOWLEDGE_TOOL_NAME) {
      return executeRmtKnowledge(request);
    }
    throw new Error(`Unsupported XTend LLM tool: ${request.name}`);
  });

  ipcMain.handle(CHANNELS.openExternal, async (_event, input) => {
    const href = shouldOpenExternalUrl(input, serverUrl);
    if (!href) {
      return {
        schema: 'xtend-llm.external-open-result.v1',
        ok: false,
        reason: 'blocked'
      };
    }
    await shell.openExternal(href);
    return {
      schema: 'xtend-llm.external-open-result.v1',
      ok: true,
      url: href
    };
  });

  ipcMain.handle(CHANNELS.attachGenerationSources, async (_event, input) => {
    const request = normalizeAttachGenerationSources(input);
    if (!activeJobs.has(request.jobId)) {
      return { ok: false, skipped: true, jobId: request.jobId };
    }
    const result = store.attachAssistantSources(request.conversationId, request.jobId, request.sources);
    emit(CHANNELS.conversationPatch, conversationPatch({ activeConversation: result.conversation }));
    return {
      ok: true,
      jobId: request.jobId,
      conversationId: request.conversationId,
      sources: result.message.sources || []
    };
  });

  ipcMain.on(CHANNELS.workerModelProgress, (_event, input) => {
    modelState = {
      ...modelState,
      ...normalizeModelProgress(input),
      model: input && input.model ? String(input.model) : modelState.model
    };
    emit(CHANNELS.modelProgress, {
      schema: 'xtend-llm.model-progress.v1',
      ...modelState
    });
  });

  ipcMain.on(CHANNELS.workerGenerationDelta, (_event, input) => {
    const delta = normalizeGenerationDelta(input);
    if (!activeJobs.has(delta.jobId)) return;
    store.appendAssistantDelta(delta.conversationId, delta.jobId, delta.delta);
    emit(CHANNELS.generationDelta, {
      schema: 'xtend-llm.generation-delta.v1',
      ...delta
    });
    emit(CHANNELS.conversationPatch, conversationPatch());
  });

  ipcMain.on(CHANNELS.workerGenerationComplete, (_event, input) => {
    const complete = normalizeGenerationComplete(input);
    if (!activeJobs.has(complete.jobId)) return;
    activeJobs.delete(complete.jobId);
    store.completeAssistantMessage(complete.conversationId, complete.jobId, complete.text, complete.finishReason);
    emit(CHANNELS.generationComplete, {
      schema: 'xtend-llm.generation-complete.v1',
      ...complete
    });
    emit(CHANNELS.conversationPatch, conversationPatch());
  });

  ipcMain.on(CHANNELS.workerGenerationError, (_event, input) => {
    const error = normalizeGenerationError(input);
    if (error.jobId) activeJobs.delete(error.jobId);
    if (error.conversationId && error.jobId) store.failAssistantMessage(error.conversationId, error.jobId, error.message);
    emit(CHANNELS.generationError, {
      schema: 'xtend-llm.generation-error.v1',
      ...error
    });
    emit(CHANNELS.conversationPatch, conversationPatch());
  });
}

async function createWindow() {
  const preload = path.join(productRoot, 'src', 'main', 'preload.cjs');
  mainWindow = new BrowserWindow({
    width: 1160,
    height: 860,
    minWidth: 960,
    minHeight: 720,
    title: 'XTend Local LLM',
    show: !layoutSmoke,
    backgroundColor: '#f7f7f4',
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });
  configureExternalNavigation(mainWindow.webContents, {
    appOrigin: serverUrl,
    openExternal: (url) => shell.openExternal(url)
  });
  if (layoutSmoke) {
    mainWindow.webContents.on('console-message', (details) => {
      const level = typeof details.level === 'string' ? details.level : String(details.level);
      if (level === 'warning' || level === 'error') {
        console.error(`[renderer ${level}] ${details.message} (${details.sourceId}:${details.lineNumber})`);
      }
    });
    mainWindow.webContents.on('render-process-gone', (_event, details) => {
      console.error(`[renderer gone] ${details.reason}: ${details.exitCode}`);
    });
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      console.error(`[renderer load failed] ${errorCode} ${errorDescription} ${validatedURL}`);
    });
  }
  await mainWindow.loadURL(layoutSmoke ? `${serverUrl}?fakeModel=1&fakeModelLoadDelayMs=1200` : serverUrl);
  if (dev) mainWindow.webContents.openDevTools({ mode: 'detach' });
}

function assertLayout(condition, message) {
  if (!condition) throw new Error(message);
}

async function runSmokeScript(label, source) {
  try {
    return await mainWindow.webContents.executeJavaScript(source);
  } catch (error) {
    const message = error && error.stack ? error.stack : String(error);
    throw new Error(`Renderer smoke step "${label}" failed:\n${message}`);
  }
}

async function runLayoutSmoke() {
  await runSmokeScript('wait for shell', `
    new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (document.querySelector('#chat-transcript') && customElements.get('x-side-panel')) {
          resolve(true);
          return;
        }
        if (Date.now() - started > 8000) {
          reject(new Error('Timed out waiting for XTend LLM shell.'));
          return;
        }
        setTimeout(tick, 50);
      };
      tick();
    });
  `);
  const boxes = await runSmokeScript('measure initial shell', `
    (() => {
      const read = (id) => {
        const node = document.getElementById(id);
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        const shadowButton = node.shadowRoot?.querySelector('button') || null;
        const shadowLabel = node.shadowRoot?.querySelector('.label') || node.shadowRoot?.querySelector('[part~="label"]') || null;
        const shadowControl = node.shadowRoot?.querySelector('textarea') || null;
        const controlRect = shadowControl?.getBoundingClientRect() || null;
        return {
          id,
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          text: node.textContent.trim(),
          label: node.getAttribute('label') || '',
          dataLabel: node.dataset?.label || '',
          shadowText: shadowLabel?.textContent.trim() || '',
          shadowColor: shadowButton ? getComputedStyle(shadowButton).color : '',
          shadowBackground: shadowButton ? getComputedStyle(shadowButton).backgroundColor : '',
          control: controlRect ? {
            left: controlRect.left,
            top: controlRect.top,
            right: controlRect.right,
            bottom: controlRect.bottom,
            width: controlRect.width,
            height: controlRect.height
          } : null,
          display: getComputedStyle(node).display,
          position: getComputedStyle(node).position
        };
      };
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        root: read('xtend-maraca-root'),
        panel: read('conversation-panel'),
        search: read('conversation-search'),
        newConversation: read('new-conversation'),
        settings: read('settings-button'),
        list: read('conversation-list'),
        model: read('model-status'),
        active: read('active-conversation'),
        transcript: read('chat-transcript'),
        prompt: read('prompt-input'),
        tool: read('tool-menu'),
        send: read('send-message'),
        progressExists: Boolean(document.getElementById('generation-progress'))
      };
    })();
  `);
  assertLayout(boxes.root.width >= boxes.viewport.width - 1, 'root spans viewport width');
  assertLayout(boxes.panel.right <= boxes.model.left - 12, 'sidebar does not overlap status row');
  assertLayout(boxes.panel.right <= boxes.transcript.left - 12, 'sidebar does not overlap transcript');
  assertLayout(Math.abs(boxes.model.top - boxes.active.top) < 2, 'status strip entries share a row');
  assertLayout(Math.abs(boxes.model.height - boxes.active.height) < 2, `status strip entries have matched height: ${JSON.stringify(boxes)}`);
  assertLayout(boxes.model.height <= 64 && boxes.active.height <= 64, `status strip should stay compact: ${JSON.stringify(boxes)}`);
  assertLayout(boxes.transcript.top > boxes.model.bottom, 'transcript is below status row');
  assertLayout(boxes.prompt.top > boxes.transcript.top, 'prompt is below transcript');
  assertLayout(boxes.prompt.height >= 156 && boxes.prompt.height <= 174, `composer row should stay stable: ${JSON.stringify(boxes.prompt)}`);
  assertLayout(boxes.prompt.control && boxes.prompt.control.height >= boxes.prompt.height - 2, `visible textarea should fill the composer shell: ${JSON.stringify(boxes.prompt)}`);
  assertLayout(boxes.tool.left >= boxes.prompt.left + 8 && boxes.tool.right < boxes.prompt.right - 100, `tool menu should float inside composer: ${JSON.stringify(boxes)}`);
  assertLayout(boxes.send.right <= boxes.prompt.right - 8 && boxes.send.left > boxes.prompt.left + 100, `send button should float inside composer: ${JSON.stringify(boxes)}`);
  assertLayout(boxes.send.width >= 76 && boxes.send.height >= 40, 'send button has stable compact bounds');
  assertLayout((boxes.send.shadowText || boxes.send.text || boxes.send.label || boxes.send.dataLabel).includes('Send'), `send button label should be visibly rendered: ${JSON.stringify(boxes.send)}`);
  assertLayout(boxes.send.shadowColor !== boxes.send.shadowBackground, `send button text color should differ from its background: ${JSON.stringify(boxes.send)}`);
  assertLayout(boxes.tool.width >= 110 && boxes.tool.height >= 40, `tool menu has stable compact bounds: ${JSON.stringify(boxes.tool)}`);
  assertLayout(boxes.progressExists === false, `generation progress bar should not be rendered: ${JSON.stringify(boxes)}`);
  assertLayout(Math.abs(boxes.tool.top - boxes.send.top) < 2, 'tool menu aligns with send button');
  assertLayout(boxes.send.bottom <= boxes.prompt.control.bottom - 12 && boxes.tool.bottom <= boxes.prompt.control.bottom - 12, `composer controls stay inside visible textarea shell: ${JSON.stringify(boxes)}`);
  assertLayout(boxes.search.top > boxes.newConversation.bottom, 'search field is below new-chat button');
  assertLayout(boxes.list.top > boxes.search.bottom, 'conversation list is below search field');
  assertLayout(boxes.newConversation.position === 'absolute', `new-chat button should use a fixed sidebar slot: ${JSON.stringify(boxes.newConversation)}`);
  assertLayout(boxes.settings.position === 'absolute', `settings button should use a fixed sidebar slot: ${JSON.stringify(boxes.settings)}`);
  assertLayout(boxes.search.position === 'absolute', `search field should use a fixed sidebar slot: ${JSON.stringify(boxes.search)}`);
  assertLayout(boxes.list.position === 'absolute', `conversation list should use a fixed sidebar slot: ${JSON.stringify(boxes.list)}`);
  assertLayout(Math.abs(boxes.newConversation.left - (boxes.panel.left + 20)) <= 2, `new-chat button is not anchored to the sidebar gutter: ${JSON.stringify(boxes)}`);
  assertLayout(boxes.settings.left > boxes.newConversation.right + 8, `settings button is not in the sidebar action row: ${JSON.stringify(boxes)}`);
  assertLayout(Math.abs(boxes.settings.top - boxes.newConversation.top) <= 1, `settings button is not aligned with new-chat button: ${JSON.stringify(boxes)}`);
  assertLayout(boxes.settings.width >= 44 && boxes.settings.width <= 60 && boxes.settings.height >= 44, `settings button does not have stable icon-button bounds: ${JSON.stringify(boxes)}`);
  assertLayout(Math.abs(boxes.search.left - boxes.newConversation.left) <= 1, `search field is not aligned with new-chat button: ${JSON.stringify(boxes)}`);
  assertLayout(Math.abs(boxes.list.left - boxes.newConversation.left) <= 1, `conversation list is not aligned with new-chat button: ${JSON.stringify(boxes)}`);
  assertLayout(Math.abs((boxes.newConversation.width + 12 + boxes.settings.width) - (boxes.panel.width - 40)) <= 3, `sidebar action row does not fill the fixed slot: ${JSON.stringify(boxes)}`);
  assertLayout(Math.abs(boxes.search.width - (boxes.panel.width - 40)) <= 2, `search field width drifted from fixed sidebar slot: ${JSON.stringify(boxes)}`);
  assertLayout(Math.abs(boxes.list.width - boxes.search.width) <= 1, `conversation list width drifted from fixed sidebar slot: ${JSON.stringify(boxes)}`);
  assertLayout(Math.abs(boxes.search.top - (boxes.newConversation.top + 64)) <= 2, `search field slot drifted from new-chat slot: ${JSON.stringify(boxes)}`);
  assertLayout(Math.abs(boxes.list.top - (boxes.search.top + 92)) <= 2, `conversation list slot drifted from search slot: ${JSON.stringify(boxes)}`);
  assertLayout(boxes.list.bottom <= boxes.panel.bottom - 16, `conversation list does not leave a stable sidebar footer gap: ${JSON.stringify(boxes)}`);

  const modelPrepInteractivity = await runSmokeScript('model preparation shell responsiveness', `
    (async () => {
      const prompt = document.getElementById('prompt-input');
      const send = document.getElementById('send-message');
      const settings = document.getElementById('settings-button');
      const search = document.getElementById('conversation-search');
      if (!prompt || !send || !settings || !settings.shadowRoot || !search) {
        throw new Error('Missing model-preparation shell controls.');
      }
      const waitFor = async (predicate, label) => {
        const started = Date.now();
        while (Date.now() - started < 3000) {
          if (predicate()) return true;
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        throw new Error('Timed out waiting for ' + label);
      };
      search.dispatchEvent(new CustomEvent('xtend-command', {
        detail: {
          schema: 'xtend.rmt.command.v1',
          id: 'layout-smoke:prep-search:' + Date.now(),
          source: { kind: 'layout-smoke', id: 'conversation-search', event: 'xtend-command', surfaceId: 'xtend.llm.conversationSearch' },
          command: 'xtend.llm.updateConversationSearch',
          payload: { value: 'prep search' },
          correlationId: 'layout-smoke:' + Date.now(),
          lane: 'test',
          timestamp: new Date().toISOString()
        },
        bubbles: true,
        composed: true,
        cancelable: true
      }));
      await waitFor(() => document.getElementById('conversation-search')?.getAttribute('value') === 'prep search', 'search update during model prep');
      settings.shadowRoot.querySelector('button').click();
      await waitFor(() => document.getElementById('settings-dialog')?.hasAttribute('open') === true, 'settings open during model prep');
      const opened = document.getElementById('settings-dialog')?.hasAttribute('open') === true;
      const tabs = document.getElementById('settings-tabs');
      await waitFor(() => Boolean(tabs?.shadowRoot?.querySelector('[role="tab"]')), 'settings tabs during model prep');
      const instructionsTab = Array.from(tabs.shadowRoot.querySelectorAll('[role="tab"]')).find((tab) => tab.textContent.trim() === 'Instructions (busy)');
      if (!instructionsTab) throw new Error('Busy instructions tab missing during model prep.');
      const instructionsDisabled = instructionsTab.disabled === true || instructionsTab.getAttribute('aria-disabled') === 'true';
      instructionsTab.click();
      await new Promise((resolve) => setTimeout(resolve, 120));
      const instructionsSelectedDuringPrep = tabs.querySelector('x-tab.active')?.getAttribute('label') || '';
      const runtimeTab = Array.from(tabs.shadowRoot.querySelectorAll('[role="tab"]')).find((tab) => tab.textContent.trim() === 'Runtime');
      if (!runtimeTab) throw new Error('Runtime tab missing during model prep.');
      runtimeTab.click();
      await waitFor(() => tabs.querySelector('x-tab.active')?.getAttribute('label') === 'Runtime', 'runtime tab selected during model prep');
      await new Promise((resolve) => setTimeout(resolve, 720));
      const runtimeTabAfterProgress = tabs.querySelector('x-tab.active')?.getAttribute('label') || '';
      document.getElementById('settings-cancel')?.click();
      await waitFor(() => document.getElementById('settings-dialog')?.hasAttribute('open') === false, 'settings close during model prep');
      return {
        promptDisabled: prompt.hasAttribute('disabled'),
        sendDisabled: send.hasAttribute('disabled'),
        settingsOpened: opened,
        instructionsDisabled,
        instructionsSelectedDuringPrep,
        runtimeTabAfterProgress,
        searchValue: search.getAttribute('value') || ''
      };
    })();
  `);
  assertLayout(modelPrepInteractivity.promptDisabled === true, `prompt should be unavailable during model preparation: ${JSON.stringify(modelPrepInteractivity)}`);
  assertLayout(modelPrepInteractivity.sendDisabled === true, `send should be unavailable during model preparation: ${JSON.stringify(modelPrepInteractivity)}`);
  assertLayout(modelPrepInteractivity.settingsOpened === true, `settings should remain responsive during model preparation: ${JSON.stringify(modelPrepInteractivity)}`);
  assertLayout(modelPrepInteractivity.instructionsDisabled === true, `settings instructions tab should be visibly busy during model preparation: ${JSON.stringify(modelPrepInteractivity)}`);
  assertLayout(modelPrepInteractivity.instructionsSelectedDuringPrep !== 'Instructions (busy)', `busy instructions tab should not become active during model preparation: ${JSON.stringify(modelPrepInteractivity)}`);
  assertLayout(modelPrepInteractivity.runtimeTabAfterProgress === 'Runtime', `settings runtime tab should survive model preparation snapshots: ${JSON.stringify(modelPrepInteractivity)}`);
  assertLayout(modelPrepInteractivity.searchValue === 'prep search', `conversation search should remain responsive during model preparation: ${JSON.stringify(modelPrepInteractivity)}`);

  await runSmokeScript('wait for fake model ready', `
    new Promise((resolve, reject) => {
      const started = Date.now();
      const clearSearch = () => {
        const search = document.getElementById('conversation-search');
        search?.dispatchEvent(new CustomEvent('xtend-command', {
          detail: {
            schema: 'xtend.rmt.command.v1',
            id: 'layout-smoke:prep-search-clear:' + Date.now(),
            source: { kind: 'layout-smoke', id: 'conversation-search', event: 'xtend-command', surfaceId: 'xtend.llm.conversationSearch' },
            command: 'xtend.llm.updateConversationSearch',
            payload: { value: '' },
            correlationId: 'layout-smoke:' + Date.now(),
            lane: 'test',
            timestamp: new Date().toISOString()
          },
          bubbles: true,
          composed: true,
          cancelable: true
        }));
      };
      const tick = () => {
        const prompt = document.getElementById('prompt-input');
        const send = document.getElementById('send-message');
        const status = document.getElementById('model-status')?.textContent || '';
        if (prompt && send && !prompt.hasAttribute('disabled')) {
          clearSearch();
          setTimeout(() => resolve(true), 50);
          return;
        }
        if (Date.now() - started > 5000) {
          reject(new Error('Timed out waiting for fake model readiness: ' + JSON.stringify({
            promptDisabled: prompt?.hasAttribute('disabled') || false,
            sendDisabled: send?.hasAttribute('disabled') || false,
            modelStatus: status,
            modelStatusText: document.getElementById('model-status')?.textContent || ''
          })));
          return;
        }
        setTimeout(tick, 50);
      };
      tick();
    });
  `);

  const toolMenuState = await runSmokeScript('tool menu flow', `
    (async () => {
      const button = document.getElementById('tool-menu-button');
      const menu = document.getElementById('tool-menu-options');
      if (!button || !menu) throw new Error('Tool menu missing.');
      const waitFor = async (predicate, label) => {
        const started = Date.now();
        while (Date.now() - started < 3000) {
          if (predicate()) return true;
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        throw new Error('Timed out waiting for ' + label);
      };
      button.click();
      await waitFor(() => menu.hidden === false && button.getAttribute('aria-expanded') === 'true', 'tool menu open');
      const open = menu.hidden === false && button.getAttribute('aria-expanded') === 'true';
      const buttonRect = button.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const search = menu.querySelector('[data-tool-name="web_search"]');
      const rmtKnowledge = menu.querySelector('[data-tool-name="rmt_knowledge"]');
      if (!rmtKnowledge) throw new Error('RMT knowledge tool missing.');
      search.click();
      await waitFor(() => button.dataset.activeTool === 'web_search' && menu.hidden === true, 'tool selection');
      const selected = button.dataset.activeTool === 'web_search'
        && button.textContent.trim() === 'Web search'
        && menu.hidden === true;
      const ariaPressed = button.getAttribute('aria-pressed');
      const checked = search.getAttribute('aria-checked');
      button.click();
      await waitFor(() => menu.hidden === false, 'tool menu reopen');
      menu.querySelector('[data-tool-name="auto"]').click();
      await waitFor(() => button.dataset.activeTool === '' && menu.hidden === true, 'tool reset');
      return {
        open,
        menuAboveButton: menuRect.bottom <= buttonRect.top + 1,
        selected,
        reset: button.dataset.activeTool === '' && button.textContent.trim() === 'Use tool',
        ariaPressed,
        checked
      };
    })();
  `);
  assertLayout(toolMenuState.open === true, `tool menu did not open: ${JSON.stringify(toolMenuState)}`);
  assertLayout(toolMenuState.menuAboveButton === true, `tool menu should open above composer controls: ${JSON.stringify(toolMenuState)}`);
  assertLayout(toolMenuState.selected === true, `web search tool selection did not apply: ${JSON.stringify(toolMenuState)}`);
  assertLayout(toolMenuState.ariaPressed === 'true', `tool menu pressed state is wrong: ${JSON.stringify(toolMenuState)}`);
  assertLayout(toolMenuState.checked === 'true', `web search menu item is not checked: ${JSON.stringify(toolMenuState)}`);
  assertLayout(toolMenuState.reset === true, `tool menu did not reset to auto: ${JSON.stringify(toolMenuState)}`);

  const settingsFlow = await runSmokeScript('settings dialog flow', `
    (async () => {
      const button = document.getElementById('settings-button');
      if (!button || !button.shadowRoot) throw new Error('Settings button missing.');
      const iconName = button.getAttribute('icon-name') || '';
      const iconRendered = Boolean(button.shadowRoot.querySelector('x-icon[name="settings"]'));
      button.shadowRoot.querySelector('button').click();
      const started = Date.now();
      while (Date.now() - started < 5000) {
        const dialog = document.getElementById('settings-dialog');
        const tabs = document.getElementById('settings-tabs');
        const tablist = tabs?.shadowRoot?.querySelector('[role="tablist"]');
        if (dialog?.hasAttribute('open') && tabs?.parentElement === dialog && tablist) {
          const dark = document.querySelector('[data-theme-mode="dark"]');
          const save = document.getElementById('settings-save');
          const close = document.getElementById('settings-cancel');
          const tabButtons = Array.from(tabs.shadowRoot.querySelectorAll('[role="tab"]'));
          const appearanceTab = tabButtons.find((tab) => tab.textContent.trim() === 'Appearance');
          const instructionsTab = tabButtons.find((tab) => tab.textContent.trim() === 'Instructions');
          if (!appearanceTab || !instructionsTab) throw new Error('Settings tab controls missing.');
          const waitForSettings = async (predicate, label) => {
            const waitStarted = Date.now();
            while (Date.now() - waitStarted < 3000) {
              if (predicate()) return true;
              await new Promise((resolve) => setTimeout(resolve, 25));
            }
            throw new Error('Timed out waiting for ' + label);
          };
          await new Promise((resolve) => requestAnimationFrame(resolve));
          const tabsRect = tabs.getBoundingClientRect();
          const surfaceRect = dialog.shadowRoot?.querySelector('.xdialog')?.getBoundingClientRect() || { width: 0 };
          const contentRect = dialog.shadowRoot?.querySelector('.xdialog-content')?.getBoundingClientRect() || { width: 0 };
          const activePanel = tabs.querySelector('x-tab.active') || tabs.querySelector('x-tab');
          const panelRect = activePanel.getBoundingClientRect();
          instructionsTab.click();
          await waitForSettings(() => tabs.querySelector('x-tab.active')?.getAttribute('label') === 'Instructions', 'instructions tab selected');
          await new Promise((resolve) => requestAnimationFrame(resolve));
          const instructionsPanel = tabs.querySelector('x-tab.active') || activePanel;
          const instructionsPanelRect = instructionsPanel.getBoundingClientRect();
          const instructionsScrolls = instructionsPanel.scrollHeight > instructionsPanel.clientHeight + 1;
          appearanceTab.click();
          await waitForSettings(() => tabs.querySelector('x-tab.active')?.getAttribute('label') === 'Appearance', 'appearance tab selected');
          const footerTop = Math.min(
            save.getBoundingClientRect().top,
            close.getBoundingClientRect().top
          );
          const footerGap = footerTop - Math.max(tabsRect.bottom, panelRect.bottom);
          dark.click();
          await waitForSettings(() => document.getElementById('settings-save')?.disabled === false, 'settings save enabled');
          document.getElementById('settings-save').click();
          await waitForSettings(() => document.getElementById('settings-dialog')?.hasAttribute('open') === false, 'settings save close');
          const saved = await window.xtendLlm.getSettings();
          const promptControl = document.getElementById('prompt-input')?.shadowRoot?.querySelector('textarea');
          const promptStyle = promptControl ? getComputedStyle(promptControl) : null;
          const promptControlColor = promptStyle?.color || '';
          const promptControlBackground = promptStyle?.backgroundColor || '';
          button.shadowRoot.querySelector('button').click();
          await waitForSettings(() => document.getElementById('settings-dialog')?.hasAttribute('open') === true, 'settings reopen');
          document.querySelector('[data-theme-mode="automatic"]').click();
          await waitForSettings(() => document.getElementById('settings-save')?.disabled === false, 'settings reset save enabled');
          document.getElementById('settings-save').click();
          await waitForSettings(() => document.getElementById('settings-dialog')?.hasAttribute('open') === false, 'settings reset save close');
          const reset = await window.xtendLlm.getSettings();
          return {
            open: dialog.hasAttribute('open'),
            iconName,
            iconRendered,
            orientation: tabs.getAttribute('orientation'),
            ariaOrientation: tablist.getAttribute('aria-orientation'),
            parentTag: tabs.parentElement?.tagName?.toLowerCase() || '',
            surfaceWidth: surfaceRect.width,
            contentWidth: contentRect.width,
            tabsWidth: tabsRect.width,
            savedTheme: saved.settings.themeMode,
            resetTheme: reset.settings.themeMode,
            documentTheme: document.documentElement.getAttribute('data-theme') || '',
            promptControlColor,
            promptControlBackground,
            footerGap,
            tabsHeight: tabsRect.height,
            panelHeight: panelRect.height,
            instructionsPanelHeight: instructionsPanelRect.height,
            instructionsScrolls
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      throw new Error('Timed out waiting for settings dialog.');
    })();
  `);
  assertLayout(settingsFlow.parentTag === 'x-dialog', `settings tabs are not hosted by the RMT dialog: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.iconName === 'settings', `settings button icon-name was not projected: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.iconRendered === true, `settings button cog icon did not render: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.orientation === 'vertical', `settings tabs are not vertical: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.ariaOrientation === 'vertical', `settings tabs do not expose vertical aria orientation: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.surfaceWidth >= 920, `settings dialog is too narrow: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.contentWidth >= settingsFlow.surfaceWidth - 96, `settings content leaves too much side bezel: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.tabsWidth <= settingsFlow.contentWidth + 2, `settings tabs overflow dialog content: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.tabsWidth >= settingsFlow.contentWidth - 2, `settings tabs do not fill dialog content: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.tabsHeight >= 340, `settings tabs are too short for their content: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.instructionsPanelHeight >= 320, `settings instructions panel is too cramped: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.instructionsScrolls === false, `settings instructions tab scrolls unnecessarily: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.savedTheme === 'dark', `settings theme did not save: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.resetTheme === 'automatic', `settings theme did not reset to automatic: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.promptControlColor && settingsFlow.promptControlColor !== settingsFlow.promptControlBackground, `dark prompt textarea text is not readable: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.promptControlColor !== 'rgb(0, 0, 0)', `dark prompt textarea still uses black text: ${JSON.stringify(settingsFlow)}`);
  assertLayout(settingsFlow.footerGap >= 8, `settings content overlaps dialog actions: ${JSON.stringify(settingsFlow)}`);

  const settingsCloseLifecycle = await runSmokeScript('settings close lifecycle flow', `
    (async () => {
      const button = document.getElementById('settings-button');
      if (!button || !button.shadowRoot) throw new Error('Settings button missing.');
      const waitFor = async (predicate, label) => {
        const started = Date.now();
        while (Date.now() - started < 3000) {
          const value = predicate();
          if (value) return value;
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        throw new Error('Timed out waiting for ' + label);
      };
      button.shadowRoot.querySelector('button').click();
      const dialog = await waitFor(() => {
        const node = document.getElementById('settings-dialog');
        return node && node.hasAttribute('open') ? node : null;
      }, 'settings dialog reopen');
      const closeButton = dialog.shadowRoot?.querySelector('.xdialog-close');
      if (!closeButton) throw new Error('Settings dialog close button missing.');
      closeButton.click();
      await waitFor(() => !dialog.hasAttribute('open'), 'settings dialog close lifecycle');
      return {
        closed: !dialog.hasAttribute('open'),
        openAttribute: dialog.hasAttribute('open')
      };
    })();
  `);
  assertLayout(settingsCloseLifecycle.closed === true, `settings dialog close lifecycle did not reach RMT state: ${JSON.stringify(settingsCloseLifecycle)}`);

  const spinnerState = await runSmokeScript('spinner pause mirroring', `
    (async () => {
      const spinner = document.getElementById('generation-spinner');
      if (!spinner) throw new Error('Generation spinner missing.');
      const errors = [];
      const onError = (event) => {
        errors.push(String(event.error && event.error.stack || event.message || event));
      };
      window.addEventListener('error', onError);
      try {
        const key = 'xspinner-paused-' + spinner.id;
        window.xstate.set(key, false);
        await new Promise((resolve) => requestAnimationFrame(resolve));
        window.xstate.set(key, true);
        await new Promise((resolve) => requestAnimationFrame(resolve));
        spinner.removeAttribute('paused');
        await new Promise((resolve) => requestAnimationFrame(resolve));
        spinner.setAttribute('paused', '');
        await new Promise((resolve) => requestAnimationFrame(resolve));
      } finally {
        window.removeEventListener('error', onError);
      }
      return {
        paused: spinner.hasAttribute('paused'),
        errors
      };
    })();
  `);
  assertLayout(spinnerState.errors.length === 0, `spinner paused mirroring surfaced runtime errors: ${JSON.stringify(spinnerState)}`);
  assertLayout(spinnerState.paused === true, `spinner paused state did not settle after mirroring: ${JSON.stringify(spinnerState)}`);

  const sidePanelCollapse = await runSmokeScript('side panel collapse flow', `
    (async () => {
      const panel = document.getElementById('conversation-panel');
      const root = document.getElementById('xtend-maraca-root');
      if (!panel || !root) throw new Error('Conversation side panel missing.');
      const record = panel.toSurfaceRecord ? panel.toSurfaceRecord('layout-smoke') : null;
      if (!record) throw new Error('Conversation side panel surface record missing.');
      const controlState = (action) => {
        const button = panel.shadowRoot && panel.shadowRoot.querySelector('button[data-action="' + action + '"]');
        if (!button) return { exists: false, hidden: true, displayed: false };
        const style = getComputedStyle(button);
        return {
          exists: true,
          hidden: button.hidden || button.hasAttribute('hidden'),
          displayed: style.display !== 'none' && style.visibility !== 'hidden'
        };
      };
      const collapseIconName = () => (
        panel.shadowRoot?.querySelector('button[data-action="collapse"] x-icon')?.getAttribute('name') || ''
      );
      const expandedIcon = collapseIconName();
      panel.collapsePanel();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const collapsedIcon = collapseIconName();
      const collapsedWidth = panel.getBoundingClientRect().width;
      const columns = getComputedStyle(root).gridTemplateColumns;
      const searchVisible = getComputedStyle(document.getElementById('conversation-search')).display !== 'none';
      const settingsVisible = getComputedStyle(document.getElementById('settings-button')).display !== 'none';
      panel.expandPanel('docked');
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {
        capabilities: record.capabilities || [],
        disabledCapabilities: record.disabledCapabilities || [],
        controls: record.metadata?.controls || {},
        controlVisibility: {
          collapse: controlState('collapse'),
          pin: controlState('pin'),
          close: controlState('close')
        },
        expandedIcon,
        collapsedIcon,
        collapsedWidth,
        columns,
        searchVisible,
        settingsVisible,
        expanded: !panel.hasAttribute('collapsed'),
        expandedWidth: panel.getBoundingClientRect().width
      };
    })();
  `);
  assertLayout(sidePanelCollapse.capabilities.includes('collapse'), `side panel is not collapsible: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(!sidePanelCollapse.capabilities.includes('close'), `side panel should not be closable: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(!sidePanelCollapse.capabilities.includes('pin'), `side panel should not be pinnable: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(sidePanelCollapse.disabledCapabilities.includes('close'), `side panel close capability is not disabled: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(sidePanelCollapse.controls.closable === false && sidePanelCollapse.controls.pinnable === false, `side panel controls are not configured: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(sidePanelCollapse.controlVisibility.collapse.displayed === true, `side panel collapse control should be visible: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(sidePanelCollapse.controlVisibility.pin.displayed === false, `side panel pin control should be hidden: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(sidePanelCollapse.controlVisibility.close.displayed === false, `side panel close control should be hidden: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(sidePanelCollapse.expandedIcon === 'chevron-left', `expanded side panel collapse icon points the wrong way: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(sidePanelCollapse.collapsedIcon === 'chevron-right', `collapsed side panel expand icon points the wrong way: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(sidePanelCollapse.collapsedWidth <= 64, `collapsed side panel is too wide: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(sidePanelCollapse.columns.trim().startsWith('56px'), `collapsed grid did not shrink sidebar column: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(sidePanelCollapse.searchVisible === false, `collapsed sidebar content is still visible: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(sidePanelCollapse.settingsVisible === false, `collapsed settings button is still visible: ${JSON.stringify(sidePanelCollapse)}`);
  assertLayout(sidePanelCollapse.expanded === true && sidePanelCollapse.expandedWidth >= 280, `side panel did not expand again: ${JSON.stringify(sidePanelCollapse)}`);

  const typingStatus = await runSmokeScript('typing status flow', `
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 2800));
      const prompt = document.getElementById('prompt-input');
      const model = document.getElementById('model-status');
      if (!prompt || !model) throw new Error('Prompt or model status missing.');
      const dispatchPromptCommand = (value) => {
        prompt.dispatchEvent(new CustomEvent('xtend-command', {
          detail: {
            schema: 'xtend.rmt.command.v1',
            id: 'layout-smoke:update-prompt:' + Date.now(),
            source: { kind: 'layout-smoke', id: 'prompt-input', event: 'xtend-command', surfaceId: 'xtend.llm.prompt' },
            command: 'xtend.llm.updatePrompt',
            payload: {
              value,
              length: value.length,
              trimmedLength: value.trim().length,
              empty: value.trim().length === 0
            },
            correlationId: 'layout-smoke:' + Date.now(),
            lane: 'test',
            timestamp: new Date().toISOString()
          },
          bubbles: true,
          composed: true,
          cancelable: true
        }));
      };
      prompt.value = 'W';
      dispatchPromptCommand(prompt.value);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const message = model.getAttribute('message') || model.textContent || '';
      const type = model.getAttribute('type') || '';
      prompt.value = '';
      prompt.setAttribute('value', '');
      dispatchPromptCommand('');
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {
        message,
        type,
        promptState: {
          required: prompt.hasAttribute('required'),
          minLength: prompt.hasAttribute('minlength'),
          invalid: prompt.hasAttribute('invalid')
        }
      };
    })();
  `);
  assertLayout(!typingStatus.message.includes('delete-conversation-dialog'), `typing surfaced delete dialog timeout: ${JSON.stringify(typingStatus)}`);
  assertLayout(typingStatus.promptState.required === false, `prompt should not expose required validation: ${JSON.stringify(typingStatus)}`);
  assertLayout(typingStatus.promptState.minLength === false, `prompt should not expose minlength validation: ${JSON.stringify(typingStatus)}`);
  assertLayout(typingStatus.promptState.invalid === false, `empty prompt should not become visibly invalid: ${JSON.stringify(typingStatus)}`);

  const messageCounts = await runSmokeScript('fake generation flow', `
    (async () => {
      const prompt = document.getElementById('prompt-input');
      const send = document.getElementById('send-message');
      if (!prompt || !send || !send.shadowRoot) throw new Error('Prompt or send control missing.');
      const dispatchPromptCommand = (value) => {
        prompt.dispatchEvent(new CustomEvent('xtend-command', {
          detail: {
            schema: 'xtend.rmt.command.v1',
            id: 'layout-smoke:update-prompt:' + Date.now(),
            source: { kind: 'layout-smoke', id: 'prompt-input', event: 'xtend-command', surfaceId: 'xtend.llm.prompt' },
            command: 'xtend.llm.updatePrompt',
            payload: {
              value,
              length: value.length,
              trimmedLength: value.trim().length,
              empty: value.trim().length === 0
            },
            correlationId: 'layout-smoke:' + Date.now(),
            lane: 'test',
            timestamp: new Date().toISOString()
          },
          bubbles: true,
          composed: true,
          cancelable: true
        }));
      };
      const observed = { click: 0, buttonInteraction: 0 };
      let progressSeen = Boolean(document.getElementById('generation-progress'));
      send.addEventListener('click', () => {
        observed.click += 1;
      });
      send.addEventListener('button-interaction', () => {
        observed.buttonInteraction += 1;
      });
      prompt.value = 'Hello from layout smoke';
      dispatchPromptCommand(prompt.value);
      const enableStarted = Date.now();
      while (send.hasAttribute('disabled') && Date.now() - enableStarted < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      send.shadowRoot.querySelector('button').click();
      const started = Date.now();
      while (Date.now() - started < 8000) {
        progressSeen = progressSeen || Boolean(document.getElementById('generation-progress'));
        const status = await window.xtendLlm.status();
        const messages = status?.conversation?.activeConversation?.messages || [];
        if (messages.some((message) => message.role === 'assistant' && message.status === 'complete')) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          await new Promise((resolve) => requestAnimationFrame(resolve));
          progressSeen = progressSeen || Boolean(document.getElementById('generation-progress'));
          const assistantArticle = document.querySelector('.xtend-llm-message-assistant');
          const copyButton = assistantArticle?.querySelector('.xtend-llm-message-action-copy') || null;
          const regenerateButton = assistantArticle?.querySelector('.xtend-llm-message-action-regenerate') || null;
          const copyIconBefore = copyButton?.querySelector('x-icon')?.getAttribute('name') || '';
          const regenerateIcon = regenerateButton?.querySelector('x-icon')?.getAttribute('name') || '';
          if (copyButton) copyButton.click();
          const copyStarted = Date.now();
          const currentCopyButton = () => document.querySelector('.xtend-llm-message-assistant .xtend-llm-message-action-copy');
          while (copyButton && Date.now() - copyStarted < 3000 && currentCopyButton()?.getAttribute('title') !== 'Copied') {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          const copiedButton = currentCopyButton();
          const copyIconAfter = copiedButton?.querySelector('x-icon')?.getAttribute('name') || '';
          return {
            total: messages.length,
            user: messages.filter((message) => message.role === 'user').length,
            assistant: messages.filter((message) => message.role === 'assistant').length,
            actionChrome: {
              row: Boolean(assistantArticle?.querySelector('.xtend-llm-message-actions')),
              copy: Boolean(copyButton),
              regenerate: Boolean(regenerateButton),
              copyDisabled: copyButton?.hasAttribute('disabled') || false,
              regenerateDisabled: regenerateButton?.hasAttribute('disabled') || false,
              copyTitle: copiedButton?.getAttribute('title') || '',
              regenerateTitle: regenerateButton?.getAttribute('title') || '',
              copyIconBefore,
              copyIconAfter,
              regenerateIcon
            },
            observed,
            progressSeen,
            sendDisabled: send.hasAttribute('disabled'),
            sendHidden: send.hasAttribute('hidden'),
            promptDisabled: prompt.hasAttribute('disabled'),
            promptInvalid: prompt.hasAttribute('invalid'),
            settingsOpen: document.getElementById('settings-dialog')?.hasAttribute('open') || false,
            activeConversationId: status?.conversation?.activeConversationId || '',
            conversations: status?.conversation?.conversations || [],
            messages: messages.map((message) => ({
              role: message.role,
              status: message.status || '',
              content: message.content || '',
              conversationId: message.conversationId || '',
              jobId: message.jobId || ''
            }))
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      throw new Error('Timed out waiting for fake generation.');
    })();
  `);
  const codeHydration = await runSmokeScript('code hydration flow', `
    (async () => {
      const started = Date.now();
      while (Date.now() - started < 5000) {
        const block = document.querySelector('x-code.xtend-llm-code-block');
        if (block && customElements.get('x-code')) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          const template = block.querySelector('template');
          return {
            registered: Boolean(customElements.get('x-code')),
            bridgePresent: Boolean(document.getElementById('code-bridge')),
            blockCount: document.querySelectorAll('x-code.xtend-llm-code-block').length,
            lang: block.getAttribute('lang') || '',
            hydration: block.dataset.insularHydration || '',
            templateText: template && template.content ? template.content.textContent : '',
            shadowText: block.shadowRoot ? block.shadowRoot.textContent : ''
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      throw new Error('Timed out waiting for x-code hydrated LLM block.');
    })();
  `);
  const markdownFormatting = await runSmokeScript('markdown formatting flow', `
    (() => {
      const assistant = document.querySelector('.xtend-llm-message-assistant .xtend-llm-message-body');
      return {
        strongText: assistant?.querySelector('strong.xtend-llm-strong')?.textContent || '',
        emphasisText: assistant?.querySelector('em.xtend-llm-emphasis')?.textContent || '',
        inlineCodeText: assistant?.querySelector('code.xtend-llm-inline-code')?.textContent || '',
        listItems: Array.from(assistant?.querySelectorAll('.xtend-llm-message-list li') || []).map((node) => node.textContent || '')
      };
    })();
  `);
  assertLayout(messageCounts.user === 1, `one user message is stored per click: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.assistant === 1, `one assistant message is stored per click: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.total === 2, `fake smoke conversation stores exactly one exchange: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.actionChrome.row === true, `assistant message action row did not render: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.actionChrome.copy === true, `assistant copy action did not render: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.actionChrome.regenerate === true, `assistant regenerate action did not render: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.actionChrome.copyDisabled === false, `assistant copy action is unexpectedly disabled: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.actionChrome.regenerateDisabled === false, `assistant regenerate action is unexpectedly disabled: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.actionChrome.copyTitle === 'Copied', `assistant copy action did not report copied feedback: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.actionChrome.copyIconBefore === 'copy', `assistant copy icon is wrong: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.actionChrome.copyIconAfter === 'check', `assistant copy feedback icon is wrong: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.actionChrome.regenerateIcon === 'refresh', `assistant regenerate icon is wrong: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.sendDisabled === true, `send is disabled after prompt reset: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.sendHidden === false, `send rematerializes after generation completes: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.promptDisabled === false, `prompt is enabled after generation completes: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.promptInvalid === false, `prompt reset is not visibly invalid: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.progressSeen === false, `generation progress bar reappeared during streaming: ${JSON.stringify(messageCounts)}`);
  assertLayout(messageCounts.settingsOpen === false, `settings dialog reopened during streaming: ${JSON.stringify(messageCounts)}`);
  assertLayout(codeHydration.registered === true, `x-code is not registered: ${JSON.stringify(codeHydration)}`);
  assertLayout(codeHydration.bridgePresent === true, `RMT x-code bridge is not present: ${JSON.stringify(codeHydration)}`);
  assertLayout(codeHydration.blockCount >= 1, `LLM code fence did not materialize x-code: ${JSON.stringify(codeHydration)}`);
  assertLayout(codeHydration.lang === 'javascript', `x-code language was not preserved: ${JSON.stringify(codeHydration)}`);
  assertLayout(codeHydration.hydration === 'x-code', `insular hydration marker is missing: ${JSON.stringify(codeHydration)}`);
  assertLayout(/console\.log/u.test(codeHydration.templateText), `x-code template does not contain generated code: ${JSON.stringify(codeHydration)}`);
  assertLayout(markdownFormatting.strongText === 'XTend', `bold Markdown did not render as strong: ${JSON.stringify(markdownFormatting)}`);
  assertLayout(markdownFormatting.emphasisText === 'emphasis', `italic Markdown did not render as emphasis: ${JSON.stringify(markdownFormatting)}`);
  assertLayout(markdownFormatting.inlineCodeText === 'Inline code', `inline code Markdown did not render as code: ${JSON.stringify(markdownFormatting)}`);
  assertLayout(markdownFormatting.listItems.length === 2, `Markdown list items did not render: ${JSON.stringify(markdownFormatting)}`);

  const secondPromptState = await runSmokeScript('second prompt flow', `
    (async () => {
      const prompt = document.getElementById('prompt-input');
      const send = document.getElementById('send-message');
      if (!prompt || !send) throw new Error('Prompt or send control missing.');
      const value = 'Second turn';
      prompt.value = 'Second turn';
      prompt.dispatchEvent(new CustomEvent('xtend-command', {
        detail: {
          schema: 'xtend.rmt.command.v1',
          id: 'layout-smoke:update-prompt:' + Date.now(),
          source: { kind: 'layout-smoke', id: 'prompt-input', event: 'xtend-command', surfaceId: 'xtend.llm.prompt' },
          command: 'xtend.llm.updatePrompt',
          payload: {
            value,
            length: value.length,
            trimmedLength: value.trim().length,
            empty: false
          },
          correlationId: 'layout-smoke:' + Date.now(),
          lane: 'test',
          timestamp: new Date().toISOString()
        },
        bubbles: true,
        composed: true,
        cancelable: true
      }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const sendButton = send.shadowRoot?.querySelector('button') || null;
      const sendLabel = send.shadowRoot?.querySelector('.label') || send.shadowRoot?.querySelector('[part~="label"]') || null;
      const sendRect = send.getBoundingClientRect();
      const sendButtonRect = sendButton ? sendButton.getBoundingClientRect() : null;
      const sendStyle = getComputedStyle(send);
      const sendButtonStyle = sendButton ? getComputedStyle(sendButton) : null;
      return {
        promptDisabled: prompt.hasAttribute('disabled'),
        sendDisabled: send.hasAttribute('disabled'),
        sendHidden: send.hasAttribute('hidden'),
        promptValue: prompt.value,
        sendVisual: {
          text: send.textContent.trim(),
          label: send.getAttribute('label') || '',
          dataLabel: send.dataset?.label || '',
          shadowText: sendLabel?.textContent.trim() || '',
          display: sendStyle.display,
          visibility: sendStyle.visibility,
          opacity: sendStyle.opacity,
          width: sendRect.width,
          height: sendRect.height,
          buttonDisplay: sendButtonStyle?.display || '',
          buttonVisibility: sendButtonStyle?.visibility || '',
          buttonOpacity: sendButtonStyle?.opacity || '',
          buttonColor: sendButtonStyle?.color || '',
          buttonBackground: sendButtonStyle?.backgroundColor || '',
          buttonWidth: sendButtonRect?.width || 0,
          buttonHeight: sendButtonRect?.height || 0
        }
      };
    })();
  `);
  assertLayout(secondPromptState.promptDisabled === false, `prompt stays enabled when typing a follow-up: ${JSON.stringify(secondPromptState)}`);
  assertLayout(secondPromptState.sendHidden === false, `send stays visible when typing a follow-up: ${JSON.stringify(secondPromptState)}`);
  assertLayout(secondPromptState.sendDisabled === false, `send enables for a follow-up prompt: ${JSON.stringify(secondPromptState)}`);
  assertLayout((secondPromptState.sendVisual.shadowText || secondPromptState.sendVisual.text || secondPromptState.sendVisual.label || secondPromptState.sendVisual.dataLabel).includes('Send'), `send label is not rendered for a follow-up prompt: ${JSON.stringify(secondPromptState)}`);
  assertLayout(secondPromptState.sendVisual.display !== 'none' && secondPromptState.sendVisual.visibility !== 'hidden' && Number(secondPromptState.sendVisual.opacity) > 0, `send host is not paintable for a follow-up prompt: ${JSON.stringify(secondPromptState)}`);
  assertLayout(secondPromptState.sendVisual.buttonDisplay !== 'none' && secondPromptState.sendVisual.buttonVisibility !== 'hidden' && Number(secondPromptState.sendVisual.buttonOpacity) > 0, `send shadow button is not paintable for a follow-up prompt: ${JSON.stringify(secondPromptState)}`);
  assertLayout(secondPromptState.sendVisual.buttonWidth >= 44 && secondPromptState.sendVisual.buttonHeight >= 44, `send shadow button collapsed for a follow-up prompt: ${JSON.stringify(secondPromptState)}`);
  assertLayout(secondPromptState.sendVisual.buttonColor !== secondPromptState.sendVisual.buttonBackground, `send text color blends into its background for a follow-up prompt: ${JSON.stringify(secondPromptState)}`);

  const deleteFlow = await runSmokeScript('delete conversation flow', `
    (async () => {
      const waitFor = async (predicate, label) => {
        const started = Date.now();
        while (Date.now() - started < 5000) {
          const value = await predicate();
          if (value) return value;
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        throw new Error('Timed out waiting for ' + label);
      };
      const row = await waitFor(() => document.querySelector('.xtend-llm-conversation-row'), 'conversation row');
      const more = row.querySelector('.xtend-llm-conversation-more');
      if (!more) throw new Error('Conversation actions button missing.');
      const conversationId = row.dataset.conversationId || more.dataset.conversationId || '';
      const currentRow = () => (
        Array.from(document.querySelectorAll('.xtend-llm-conversation-row')).find((node) => (
          conversationId && node.dataset.conversationId === conversationId
        )) || document.querySelector('.xtend-llm-conversation-row')
      );
      more.click();
      const menu = await waitFor(() => {
        const node = currentRow()?.querySelector('.xtend-llm-conversation-menu');
        return node && !node.hasAttribute('hidden') ? node : null;
      }, 'conversation context menu');
      const deleteItem = menu.querySelector('.xtend-llm-conversation-menu-item');
      if (!deleteItem || deleteItem.textContent.trim() !== 'Delete chat') {
        throw new Error('Delete chat menu item missing.');
      }
      deleteItem.click();
      const dialog = await waitFor(() => {
        const node = document.getElementById('delete-conversation-dialog');
        return node && node.hasAttribute('open') ? node : null;
      }, 'delete confirmation dialog');
      const message = document.getElementById('delete-conversation-message')?.textContent || '';
      const confirm = document.getElementById('delete-conversation-confirm');
      if (!confirm) throw new Error('Delete confirmation button missing.');
      confirm.click();
      const status = await waitFor(async () => {
        const next = await window.xtendLlm.status();
        return next?.conversation?.conversations?.length === 0 ? next : null;
      }, 'deleted conversation patch');
      return {
        dialogTag: dialog.tagName.toLowerCase(),
        message,
        remaining: status.conversation.conversations.length,
        activeConversationId: status.conversation.activeConversationId || ''
      };
    })();
  `);
  assertLayout(deleteFlow.dialogTag === 'x-dialog', `delete confirmation uses x-dialog: ${JSON.stringify(deleteFlow)}`);
  assertLayout(/Delete/.test(deleteFlow.message), `delete confirmation copy is present: ${JSON.stringify(deleteFlow)}`);
  assertLayout(deleteFlow.remaining === 0, `conversation is deleted from sidebar: ${JSON.stringify(deleteFlow)}`);
  assertLayout(deleteFlow.activeConversationId === '', `active chat is cleared after deleting final chat: ${JSON.stringify(deleteFlow)}`);

  const resultDir = path.join(productRoot, '.xtend-llm-results');
  fs.mkdirSync(resultDir, { recursive: true });
  const screenshotPath = path.join(resultDir, 'layout-smoke.png');
  const image = await mainWindow.webContents.capturePage();
  fs.writeFileSync(screenshotPath, image.toPNG());
  console.log(`layout smoke ok: ${screenshotPath}`);
}

app.whenReady().then(async () => {
  const userData = app.getPath('userData');
  const installed = readInstalledModelManifest(userData);
  const installedValidation = validateInstalledModelManifest(installed);
  runtimeModelId = installedValidation.ok ? installedValidation.modelId : TARGET_MODEL_ID;
  modelState = createModelState({
    model: runtimeModelId,
    status: installedValidation.ok
      ? `Installed model ${runtimeModelId} is ready to load.`
      : `Default model ${runtimeModelId} is ready to load.`
  });
  const cache = createModelCachePaths(userData, runtimeModelId);
  settingsStore = new SettingsStore({
    filePath: path.join(userData, 'settings.json')
  });
  const settings = settingsStore.load();
  store = new ConversationStore({
    filePath: path.join(userData, 'conversations.json'),
    customInstructions: settings.customInstructions
  });
  store.load();
  registerIpc();
  appServer = createXtendLlmAppServer({
    userData,
    cacheRoot: cache.root,
    dev
  });
  serverUrl = await appServer.listen(0);
  await createWindow();
  if (layoutSmoke) {
    try {
      await runLayoutSmoke();
      app.quit();
    } catch (error) {
      console.error(error && error.stack ? error.stack : error);
      app.exit(1);
    }
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0 && serverUrl) await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  if (appServer) await appServer.close();
});
