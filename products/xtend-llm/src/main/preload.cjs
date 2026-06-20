const { contextBridge, ipcRenderer } = require('electron');

const CHANNELS = Object.freeze({
  status: 'xtend-llm:status',
  createConversation: 'xtend-llm:create-conversation',
  selectConversation: 'xtend-llm:select-conversation',
  deleteConversation: 'xtend-llm:delete-conversation',
  getSettings: 'xtend-llm:get-settings',
  updateSettings: 'xtend-llm:update-settings',
  resetApp: 'xtend-llm:reset-app',
  submitMessage: 'xtend-llm:submit-message',
  copyText: 'xtend-llm:copy-text',
  regenerateAssistantMessage: 'xtend-llm:regenerate-assistant-message',
  cancelGeneration: 'xtend-llm:cancel-generation',
  executeTool: 'xtend-llm:execute-tool',
  openExternal: 'xtend-llm:open-external',
  attachGenerationSources: 'xtend-llm:attach-generation-sources',
  telemetrySnapshot: 'xtend-llm:telemetry-snapshot',
  modelProgress: 'xtend-llm:model-progress',
  conversationPatch: 'xtend-llm:conversation-patch',
  settingsPatch: 'xtend-llm:settings-patch',
  generationDelta: 'xtend-llm:generation-delta',
  generationComplete: 'xtend-llm:generation-complete',
  generationError: 'xtend-llm:generation-error',
  workerModelProgress: 'xtend-llm:worker-model-progress',
  workerGenerationDelta: 'xtend-llm:worker-generation-delta',
  workerGenerationComplete: 'xtend-llm:worker-generation-complete',
  workerGenerationError: 'xtend-llm:worker-generation-error'
});

const PUBLIC_EVENTS = new Set([
  CHANNELS.modelProgress,
  CHANNELS.conversationPatch,
  CHANNELS.settingsPatch,
  CHANNELS.generationDelta,
  CHANNELS.generationComplete,
  CHANNELS.generationError
]);

function clone(value) {
  if (value == null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value));
}

function forwardDomEvent(domEventName, ipcChannel) {
  window.addEventListener(domEventName, (event) => {
    ipcRenderer.send(ipcChannel, clone(event.detail || {}));
  });
}

function safeExternalHref(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw, window.location.href);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return '';
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin === window.location.origin) return '';
    return url.href;
  } catch {
    return '';
  }
}

function anchorFromEvent(event) {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  for (const node of path) {
    if (node && node.nodeType === Node.ELEMENT_NODE && node.localName === 'a' && node.href) {
      return node;
    }
  }
  const target = event.target && event.target.closest ? event.target.closest('a[href]') : null;
  return target && target.href ? target : null;
}

window.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0) return;
  const anchor = anchorFromEvent(event);
  const href = safeExternalHref(anchor && anchor.href);
  if (!href) return;

  event.preventDefault();
  ipcRenderer.invoke(CHANNELS.openExternal, href).catch((error) => {
    console.warn('[xtend-llm] Failed to open external URL.', error);
  });
}, true);

forwardDomEvent(CHANNELS.workerModelProgress, CHANNELS.workerModelProgress);
forwardDomEvent(CHANNELS.workerGenerationDelta, CHANNELS.workerGenerationDelta);
forwardDomEvent(CHANNELS.workerGenerationComplete, CHANNELS.workerGenerationComplete);
forwardDomEvent(CHANNELS.workerGenerationError, CHANNELS.workerGenerationError);

contextBridge.exposeInMainWorld('xtendLlm', {
  status() {
    return ipcRenderer.invoke(CHANNELS.status);
  },
  createConversation() {
    return ipcRenderer.invoke(CHANNELS.createConversation);
  },
  selectConversation(id) {
    return ipcRenderer.invoke(CHANNELS.selectConversation, id);
  },
  deleteConversation(id) {
    return ipcRenderer.invoke(CHANNELS.deleteConversation, id);
  },
  getSettings() {
    return ipcRenderer.invoke(CHANNELS.getSettings);
  },
  updateSettings(payload) {
    return ipcRenderer.invoke(CHANNELS.updateSettings, clone(payload || {}));
  },
  resetApp(payload) {
    return ipcRenderer.invoke(CHANNELS.resetApp, clone(payload || {}));
  },
  submitMessage(payload) {
    return ipcRenderer.invoke(CHANNELS.submitMessage, clone(payload || {}));
  },
  copyText(payload) {
    return ipcRenderer.invoke(CHANNELS.copyText, clone(payload || {}));
  },
  regenerateAssistantMessage(payload) {
    return ipcRenderer.invoke(CHANNELS.regenerateAssistantMessage, clone(payload || {}));
  },
  cancelGeneration(jobId) {
    return ipcRenderer.invoke(CHANNELS.cancelGeneration, clone(typeof jobId === 'string' ? { jobId } : jobId || {}));
  },
  executeTool(payload) {
    return ipcRenderer.invoke(CHANNELS.executeTool, clone(payload || {}));
  },
  openExternal(url) {
    return ipcRenderer.invoke(CHANNELS.openExternal, String(url || ''));
  },
  attachGenerationSources(payload) {
    return ipcRenderer.invoke(CHANNELS.attachGenerationSources, clone(payload || {}));
  },
  telemetry() {
    return ipcRenderer.invoke(CHANNELS.telemetrySnapshot);
  },
  on(eventName, listener) {
    if (!PUBLIC_EVENTS.has(eventName)) throw new Error(`Unsupported XTend LLM event: ${eventName}`);
    if (typeof listener !== 'function') throw new Error('Listener must be a function.');
    const wrapped = (_event, payload) => listener(clone(payload));
    ipcRenderer.on(eventName, wrapped);
    return () => ipcRenderer.removeListener(eventName, wrapped);
  }
});
