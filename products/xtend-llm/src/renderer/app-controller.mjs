import { LlmWorkerClient } from './llm-worker-client.mjs';
import {
  DEFAULT_PREWARM_TARGETS,
  UiComputeWorkerClient
} from './ui-compute-client.mjs';
import {
  createCitationSourceMap,
  safeExternalUrl,
  sourceHostname,
  splitCitationReferences
} from './citation-source-bridge.mjs';
import { parseCodeFenceSegments } from './code-block-bridge.mjs';
import {
  parseInlineMarkdown,
  parseMarkdownBlocks
} from './markdown-format-bridge.mjs';
import { installRmtCodeHighlighter } from './rmt-code-highlighter.mjs';
import {
  RMT_KNOWLEDGE_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
  buildForcedRmtKnowledgeToolCall,
  buildForcedWebSearchToolCall,
  buildRmtKnowledgeAugmentedMessages,
  buildRmtKnowledgeFailureMessages,
  buildSearchAugmentedMessages,
  buildSearchFailureMessages,
  buildToolDecisionMessages,
  inferSearchLanguage,
  parseToolDecision,
  resolveDeterministicToolCall
} from './tool-usage-bridge.mjs';
import { stripThinkMarkup } from '../llm/thinking-markup.mjs';

installRmtCodeHighlighter();

const CHANNELS = Object.freeze({
  modelProgress: 'xtend-llm:model-progress',
  conversationPatch: 'xtend-llm:conversation-patch',
  settingsPatch: 'xtend-llm:settings-patch',
  generationDelta: 'xtend-llm:generation-delta',
  generationComplete: 'xtend-llm:generation-complete',
  generationError: 'xtend-llm:generation-error'
});

const state = {
  activeConversationId: '',
  activeJobId: '',
  promptDraft: '',
  submitting: false,
  conversations: [],
  activeConversation: null,
  worker: null,
  openConversationMenuId: '',
  pendingDeleteConversationId: '',
  conversationSearchDraft: '',
  retryVisible: false,
  modelPreparing: false,
  progressActive: false,
  progressStatus: 'Waiting',
  modelStatusText: 'Qwen3 WebGPU runtime is idle.',
  modelStatusTone: 'neutral',
  errorText: 'No runtime error.',
  errorHidden: true,
  messageActionFeedback: {},
  regeneratingMessageId: '',
  runtimeDiagnostics: {
    id: 'runtime-diagnostics',
    label: 'Runtime diagnostics',
    status: 'Runtime telemetry pending',
    ok: true,
    backpressureLevel: 'normal',
    prewarmWorkerStatus: 'unknown',
    strictFallbackCount: 0,
    capabilitySummary: 'RKFA capabilities pending.',
    closureSummary: 'Production closure pending.',
    workerSummary: 'Worker telemetry pending.',
    streamSummary: 'No stream pressure records.',
    panicSummary: 'No panic or recovery records.',
    hidden: true
  },
  settings: {
    themeMode: 'automatic',
    customInstructions: ''
  },
  settingsDraft: {
    themeMode: 'automatic',
    customInstructions: ''
  },
  settingsDirty: false,
  settingsOpen: false,
  settingsSelectedTab: 0,
  settingsResetConfirm: false,
  deleteDialogOpen: false,
  targetModel: ''
};

let appRuntime = null;
let maracaBootResult = null;
let uiCompute = null;
let activeGenerationStream = null;
let subscriptionsBound = false;
let scheduledSnapshotTimer = null;
let lastTelemetrySnapshot = null;
let lastStreamPressureLevel = 'normal';
let lastUiComputePrewarm = null;
const streamPressureWindow = [];
const messageActionFeedbackTimers = new Map();
const generationFrameChannels = new Map();

const STREAM_PRESSURE_WINDOW_MS = 1000;
const STREAM_PRESSURE_HIGH_DELTAS = 20;
const STREAM_PRESSURE_CRITICAL_DELTAS = 40;
const STREAM_PRESSURE_HIGH_BYTES = 16 * 1024;
const STREAM_PRESSURE_CRITICAL_BYTES = 32 * 1024;

function validThemeMode(value) {
  return ['automatic', 'light', 'dark'].includes(value) ? value : 'automatic';
}

function validSettingsTabIndex(value) {
  const index = Number(value);
  if (!Number.isInteger(index)) return 0;
  if (state.modelPreparing && index === 1) return 0;
  return Math.min(Math.max(index, 0), 2);
}

function currentOsTheme() {
  if (typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeMode(themeMode = 'automatic') {
  const mode = validThemeMode(themeMode);
  const targetTheme = mode === 'automatic' ? currentOsTheme() : mode;
  document.documentElement.setAttribute('data-theme', targetTheme);
  document.documentElement.dataset.xtendLlmThemeMode = mode;
}

function normalizedSearchText(value = '') {
  return String(value || '').trim().toLocaleLowerCase();
}

function conversationTitle(id) {
  const conversation = state.conversations.find((entry) => entry.id === id)
    || (state.activeConversation && state.activeConversation.id === id ? state.activeConversation : null);
  return conversation?.title || 'this chat';
}

function clone(value) {
  if (value == null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value));
}

function pressureRank(level = 'normal') {
  return {
    none: 0,
    normal: 1,
    medium: 2,
    high: 3,
    critical: 4
  }[String(level || 'normal')] || 1;
}

function maxPressureLevel(...levels) {
  return levels.reduce((highest, level) => (
    pressureRank(level) > pressureRank(highest) ? level : highest
  ), 'normal');
}

function recordDeltaPressure(delta = '') {
  const now = performance.now();
  const bytes = new TextEncoder().encode(String(delta || '')).byteLength;
  streamPressureWindow.push({ at: now, bytes });
  while (streamPressureWindow.length && now - streamPressureWindow[0].at > STREAM_PRESSURE_WINDOW_MS) {
    streamPressureWindow.shift();
  }
  const bytesPerSecond = streamPressureWindow.reduce((total, sample) => total + sample.bytes, 0);
  const deltasPerSecond = streamPressureWindow.length;
  const level = deltasPerSecond >= STREAM_PRESSURE_CRITICAL_DELTAS || bytesPerSecond >= STREAM_PRESSURE_CRITICAL_BYTES
    ? 'critical'
    : deltasPerSecond >= STREAM_PRESSURE_HIGH_DELTAS || bytesPerSecond >= STREAM_PRESSURE_HIGH_BYTES
      ? 'high'
      : 'normal';
  lastStreamPressureLevel = level;
  return {
    schema: 'xtend-llm.renderer-stream-pressure.v1',
    level,
    deltasPerSecond,
    bytesPerSecond,
    windowMs: STREAM_PRESSURE_WINDOW_MS
  };
}

function resetDeltaPressure() {
  streamPressureWindow.length = 0;
  lastStreamPressureLevel = 'normal';
  return {
    schema: 'xtend-llm.renderer-stream-pressure.v1',
    level: 'normal',
    deltasPerSecond: 0,
    bytesPerSecond: 0,
    windowMs: STREAM_PRESSURE_WINDOW_MS
  };
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function summarizeMaracaTelemetry(mainMaraca = {}) {
  const result = maracaBootResult || {};
  const api = window.XTendMaraca || {};
  const kernelPlan = api.kernelPlan || result.kernel || {};
  const templateArtifacts = mainMaraca.templateArtifacts
    || api.templateArtifacts
    || result.templateArtifacts
    || null;
  const productionClosure = mainMaraca.productionClosure
    || api.productionClosure
    || result.productionClosure
    || null;
  const kernelFeatureAdoption = mainMaraca.kernelFeatureAdoption
    || kernelPlan.featureAdoption
    || result.kernelFeatureAdoption
    || null;
  const prewarmWorker = mainMaraca.prewarmWorker
    || kernelPlan.prewarmWorker
    || result.kernel?.prewarmWorker
    || null;
  const policyParity = mainMaraca.policyParity
    || kernelPlan.policyParity
    || result.policyParity
    || null;
  const serverPrerenderShell = mainMaraca.serverPrerenderShell
    || result.serverPrerenderShell
    || null;
  return {
    schema: 'xtend-llm.maraca-telemetry-summary.v1',
    ...mainMaraca,
    profile: mainMaraca.profile || result.profile || '',
    productionClosure,
    kernelFeatureAdoption,
    templateArtifacts,
    policyParity,
    productSurface: mainMaraca.productSurface || kernelPlan.productSurface || result.kernel?.productSurface || null,
    prewarmWorker,
    serverPrerenderShell,
    warmReentry: mainMaraca.warmReentry || api.warmReentry || result.warmReentry || null,
    strictFallbackCount: Number(mainMaraca.strictFallbackCount
      || productionClosure?.releaseConstraint?.strictFallbackCount
      || 0)
  };
}

function readRuntimeTelemetry() {
  const performanceTelemetry = appRuntime && typeof appRuntime.getPerformanceTelemetrySnapshot === 'function'
    ? appRuntime.getPerformanceTelemetrySnapshot()
    : null;
  const streamPressureRecords = appRuntime && typeof appRuntime.listStreamPressureRecords === 'function'
    ? appRuntime.listStreamPressureRecords()
    : safeArray(performanceTelemetry?.streamPressureRecords);
  const yieldActions = appRuntime && typeof appRuntime.listYieldActions === 'function'
    ? appRuntime.listYieldActions()
    : safeArray(performanceTelemetry?.yieldActions);
  const panicRecovery = appRuntime && typeof appRuntime.getPanicRecoverySnapshot === 'function'
    ? appRuntime.getPanicRecoverySnapshot()
    : null;
  return {
    performanceTelemetry,
    streamPressureRecords,
    yieldActions,
    panicRecovery
  };
}

function createTelemetrySnapshot(mainSnapshot = null) {
  const maraca = summarizeMaracaTelemetry(mainSnapshot?.maraca || {});
  const runtime = {
    ...(mainSnapshot?.runtime || {}),
    ...readRuntimeTelemetry()
  };
  const worker = state.worker && typeof state.worker.snapshot === 'function'
    ? state.worker.snapshot()
    : { schema: 'xtend-llm.worker-client-snapshot.v1', pendingJobs: [], oncePendingJobs: [], disposed: true };
  const uiComputeSnapshot = uiCompute && typeof uiCompute.snapshot === 'function'
    ? uiCompute.snapshot()
    : { schema: 'xtend-llm.ui-compute-worker-snapshot.v1', disposed: true, pendingJobs: 0 };
  const runtimeLevel = runtime.performanceTelemetry?.highestStreamPressureLevel || 'normal';
  const backpressureLevel = maxPressureLevel(
    mainSnapshot?.summary?.backpressureLevel,
    runtimeLevel === 'none' ? 'normal' : runtimeLevel,
    lastStreamPressureLevel
  );
  const prewarmWorkerStatus = maraca.prewarmWorker && (maraca.prewarmWorker.runtimeExpectedStatus || maraca.prewarmWorker.status)
    || mainSnapshot?.summary?.prewarmWorkerStatus
    || 'unknown';
  const strictFallbackCount = Number(maraca.strictFallbackCount || mainSnapshot?.summary?.strictFallbackCount || 0);
  const blockedCount = Number(maraca.kernelFeatureAdoption?.blockedCount || maraca.productionClosure?.blockedCount || 0);
  return {
    schema: 'xtend-llm.telemetry-snapshot.v1',
    at: new Date().toISOString(),
    maraca,
    runtime,
    worker,
    uiCompute: uiComputeSnapshot,
    summary: {
      ok: blockedCount === 0 && strictFallbackCount === 0 && maraca.policyParity?.ok !== false && maraca.productionClosure?.ok !== false,
      backpressureLevel,
      prewarmWorkerStatus,
      strictFallbackCount
    }
  };
}

async function refreshRuntimeDiagnostics(options = {}) {
  let mainSnapshot = null;
  if (options.includeMain !== false && window.xtendLlm && typeof window.xtendLlm.telemetry === 'function') {
    try {
      mainSnapshot = await window.xtendLlm.telemetry();
    } catch (error) {
      mainSnapshot = {
        schema: 'xtend-llm.telemetry-snapshot.v1',
        maraca: {},
        runtime: {},
        summary: {
          ok: false,
          backpressureLevel: 'normal',
          prewarmWorkerStatus: 'unknown',
          strictFallbackCount: 0,
          error: error && error.message ? error.message : String(error)
        }
      };
    }
  }
  lastTelemetrySnapshot = createTelemetrySnapshot(mainSnapshot);
  state.runtimeDiagnostics = createRuntimeDiagnosticsState(lastTelemetrySnapshot);
  return lastTelemetrySnapshot;
}

function createRuntimeDiagnosticsState(snapshot = null) {
  const telemetry = snapshot || lastTelemetrySnapshot || {};
  const maraca = telemetry.maraca || {};
  const runtime = telemetry.runtime || {};
  const worker = telemetry.worker || {};
  const uiComputeSnapshot = telemetry.uiCompute || {};
  const featureAdoption = maraca.kernelFeatureAdoption || {};
  const productionClosure = maraca.productionClosure || {};
  const streamPressureRecords = safeArray(runtime.streamPressureRecords);
  const yieldActions = safeArray(runtime.yieldActions);
  const panicRecovery = runtime.panicRecovery || {};
  const counters = panicRecovery.counters || {};
  const capabilityCount = Number(featureAdoption.capabilityCount || 0);
  const activeCount = Number(featureAdoption.activeCount || 0);
  const blockedCount = Number(featureAdoption.blockedCount || 0);
  const strictFallbackCount = Number(telemetry.summary?.strictFallbackCount || 0);
  const backpressureLevel = telemetry.summary?.backpressureLevel || 'normal';
  const prewarmWorkerStatus = telemetry.summary?.prewarmWorkerStatus || 'unknown';
  return {
    id: 'runtime-diagnostics',
    label: 'Runtime diagnostics',
    status: telemetry.summary?.ok === false ? 'Runtime diagnostics need attention' : 'Runtime diagnostics ready',
    ok: telemetry.summary?.ok !== false,
    backpressureLevel,
    prewarmWorkerStatus,
    strictFallbackCount,
    capabilitySummary: capabilityCount
      ? `${activeCount}/${capabilityCount} capabilities active, ${blockedCount} blocked`
      : 'RKFA capability report pending.',
    closureSummary: productionClosure.status
      ? `${productionClosure.status}; strict fallbacks ${strictFallbackCount}`
      : 'Production closure pending.',
    workerSummary: `prewarm ${prewarmWorkerStatus}; LLM pending ${worker.pendingJobCount || 0}; UI compute ${uiComputeSnapshot.completedJobs || 0}/${uiComputeSnapshot.submittedJobs || 0}; disposed ${worker.disposed === true ? 'yes' : 'no'}`,
    streamSummary: `${backpressureLevel}; ${streamPressureRecords.length} pressure records; ${yieldActions.length} yield actions`,
    panicSummary: `${counters.panicEventCount || panicRecovery.panicEventCount || 0} panic, ${counters.recoveryOutcomeCount || panicRecovery.recoveryOutcomeCount || 0} recovery`,
    hidden: true
  };
}

function readServerPrewarmTargets() {
  const result = maracaBootResult || {};
  const shellTargets = result.serverPrerenderShell && Array.isArray(result.serverPrerenderShell.workerPrewarmTargets)
    ? result.serverPrerenderShell.workerPrewarmTargets
    : [];
  const payloadTargets = result.serverPrerenderShell?.payload && Array.isArray(result.serverPrerenderShell.payload.workerPrewarmTargets)
    ? result.serverPrerenderShell.payload.workerPrewarmTargets
    : [];
  return Array.from(new Set([...shellTargets, ...payloadTargets, ...DEFAULT_PREWARM_TARGETS]))
    .map((entry) => String(entry || '').trim())
    .filter(Boolean);
}

async function prewarmUiComputeTargets() {
  if (!uiCompute) return null;
  const targets = readServerPrewarmTargets();
  lastUiComputePrewarm = await uiCompute.prewarmSurfaces(targets, {
    backpressureLevel: lastStreamPressureLevel,
    source: 'xtend-llm.maraca-ssr-shell'
  });
  return lastUiComputePrewarm;
}

function setRuntimeStatus(text, tone = 'info', options = {}) {
  state.modelStatusText = text;
  state.modelStatusTone = tone;
  if (Object.hasOwn(options, 'progressActive')) state.progressActive = Boolean(options.progressActive);
  if (options.progressStatus) state.progressStatus = options.progressStatus;
}

function setRuntimeError(message, hidden = false) {
  state.errorText = message || 'Generation failed.';
  state.errorHidden = hidden;
}

function promptUnavailable() {
  return Boolean(state.modelPreparing || state.activeJobId || state.submitting);
}

function applyConversationPatch(patch = {}) {
  if (Object.hasOwn(patch, 'activeConversationId')) state.activeConversationId = patch.activeConversationId || '';
  if (Array.isArray(patch.conversations)) state.conversations = patch.conversations;
  if (Object.hasOwn(patch, 'activeConversation')) state.activeConversation = patch.activeConversation || null;
  if (patch.deletedConversationId === state.openConversationMenuId) state.openConversationMenuId = '';
  if (state.activeConversation) {
    state.activeConversationId = state.activeConversation.id || state.activeConversationId;
  }
}

function findActiveMessage(messageId) {
  const messages = Array.isArray(state.activeConversation?.messages) ? state.activeConversation.messages : [];
  return messages.find((message) => message.id === messageId) || null;
}

function setMessageActionFeedback(messageId, action, feedback, durationMs = 1400) {
  const key = `${messageId}:${action}`;
  state.messageActionFeedback = {
    ...state.messageActionFeedback,
    [key]: feedback
  };
  if (messageActionFeedbackTimers.has(key)) clearTimeout(messageActionFeedbackTimers.get(key));
  const timer = setTimeout(() => {
    messageActionFeedbackTimers.delete(key);
    if (state.messageActionFeedback[key] !== feedback) return;
    const next = { ...state.messageActionFeedback };
    delete next[key];
    state.messageActionFeedback = next;
    dispatchSnapshot();
  }, durationMs);
  messageActionFeedbackTimers.set(key, timer);
}

function applySettingsPatch(settings = {}) {
  state.settings = {
    themeMode: validThemeMode(settings.themeMode),
    customInstructions: String(settings.customInstructions || '')
  };
  state.settingsDraft = { ...state.settings };
  state.settingsDirty = false;
  state.settingsResetConfirm = false;
  applyThemeMode(state.settings.themeMode);
}

function formatConversationList() {
  const search = normalizedSearchText(state.conversationSearchDraft);
  const filtered = search
    ? state.conversations.filter((conversation) => normalizedSearchText(conversation.title || 'New chat').includes(search))
    : state.conversations;
  return filtered.map((conversation) => ({
    id: conversation.id,
    title: conversation.title || 'New chat',
    active: conversation.id === state.activeConversationId,
    menuOpen: conversation.id === state.openConversationMenuId,
    menuLabel: `Open actions for ${conversation.title || 'New chat'}`
  }));
}

function textToCitationSegments(text, sourceMap) {
  return splitCitationReferences(text, sourceMap).map((token) => {
    if (token.type === 'text') return { kind: 'text', text: token.text };
    const href = safeExternalUrl(token.source?.url) || '#';
    return {
      kind: 'citation',
      class: 'xtend-llm-citation',
      href,
      label: token.text,
      title: token.source?.title || `Source ${token.index}`,
      index: token.index
    };
  });
}

function inlineMarkdownSegments(text, sourceMap) {
  return parseInlineMarkdown(text).flatMap((token) => inlineTokenSegments(token, sourceMap));
}

function inlineChildrenSegments(children = [], sourceMap) {
  return children.flatMap((token) => inlineTokenSegments(token, sourceMap));
}

function inlineTokenSegments(token, sourceMap) {
  if (!token || typeof token !== 'object') return [];
  if (token.type === 'text') return textToCitationSegments(token.text, sourceMap);
  if (token.type === 'code') {
    return [{
      kind: 'inline-code',
      class: 'xtend-llm-inline-code',
      text: token.text
    }];
  }
  if (token.type === 'link') {
    return [{
      kind: 'link',
      class: 'xtend-llm-link',
      href: safeExternalUrl(token.href) || '#',
      children: inlineChildrenSegments(token.children || [], sourceMap)
    }];
  }
  const className = token.type === 'strong'
    ? 'xtend-llm-strong'
    : token.type === 'emphasis'
      ? 'xtend-llm-emphasis'
      : `xtend-llm-${token.type}`;
  return [{
    kind: token.type,
    class: className,
    children: inlineChildrenSegments(token.children || [], sourceMap)
  }];
}

function markdownBlockSegment(block, sourceMap) {
  if (block.type === 'heading') {
    return {
      kind: 'heading',
      depth: Math.min(block.depth + 2, 6),
      class: 'xtend-llm-message-heading',
      children: inlineMarkdownSegments(block.text, sourceMap)
    };
  }
  if (block.type === 'list') {
    return {
      kind: 'list',
      ordered: block.ordered,
      class: 'xtend-llm-message-list',
      items: block.items.map((item) => inlineMarkdownSegments(item, sourceMap))
    };
  }
  if (block.type === 'quote') {
    return {
      kind: 'quote',
      class: 'xtend-llm-message-quote',
      children: inlineMarkdownSegments(block.text, sourceMap)
    };
  }
  return {
    kind: 'paragraph',
    class: 'xtend-llm-message-text',
    children: inlineMarkdownSegments(block.text || '', sourceMap)
  };
}

function textSegments(text, sourceMap) {
  const blocks = parseMarkdownBlocks(text);
  if (!blocks.length) {
    return [{
      kind: 'paragraph',
      class: 'xtend-llm-message-text',
      children: textToCitationSegments(text, sourceMap)
    }];
  }
  return blocks.map((block) => markdownBlockSegment(block, sourceMap));
}

function sourcePanelSegment(message, sourceMap) {
  if (!sourceMap || !sourceMap.size) return null;
  const sources = [...sourceMap.values()].sort((a, b) => a.index - b.index).map((source) => {
    const href = safeExternalUrl(source.url);
    if (!href) return null;
    const host = sourceHostname(href);
    return {
      id: `${message.id || 'message'}-source-${source.index}`,
      class: 'xtend-llm-source-link',
      markerClass: 'xtend-llm-source-marker',
      copyClass: 'xtend-llm-source-copy',
      titleClass: 'xtend-llm-source-title',
      metaClass: 'xtend-llm-source-meta',
      snippetClass: 'xtend-llm-source-snippet',
      index: source.index,
      marker: `[${source.index}]`,
      href,
      title: source.title || host || href,
      meta: [host, source.publishedDate].filter(Boolean).join(' - '),
      snippet: source.snippet || ''
    };
  }).filter(Boolean);
  if (!sources.length) return null;
  return {
    kind: 'sources',
    class: 'xtend-llm-sources',
    summaryClass: 'xtend-llm-sources-summary',
    listClass: 'xtend-llm-source-list',
    itemClass: 'xtend-llm-source-link',
    markerClass: 'xtend-llm-source-marker',
    copyClass: 'xtend-llm-source-copy',
    titleClass: 'xtend-llm-source-title',
    metaClass: 'xtend-llm-source-meta',
    snippetClass: 'xtend-llm-source-snippet',
    summary: `Sources (${sources.length})`,
    sources
  };
}

function messageSegments(message) {
  const visibleContent = stripThinkMarkup(message.content || '', {
    streaming: message.status === 'streaming'
  });
  const sourceMap = createCitationSourceMap(message.role === 'assistant' ? message.sources : []);
  const segments = parseCodeFenceSegments(visibleContent);
  const output = [];
  if (!segments.length) {
    output.push({
      kind: 'paragraph',
      class: 'xtend-llm-message-text',
      text: message.status === 'streaming' ? '...' : ''
    });
  }
  segments.forEach((segment, index) => {
    if (segment.type === 'code') {
      output.push({
        kind: 'code',
        id: `${message.id || 'message'}-code-${index}`,
        class: 'xtend-llm-code-block',
        fallbackClass: 'xtend-llm-code-fallback',
        insularHydration: 'x-code',
        codeBlock: true,
        streaming: segment.closed === false,
        language: segment.language || 'text',
        code: segment.code || ''
      });
      return;
    }
    output.push(...textSegments(segment.text, sourceMap));
  });
  const sources = sourcePanelSegment(message, sourceMap);
  if (sources) output.push(sources);
  return output;
}

function assistantMessageActions(message, messageId) {
  if ((message.role || 'assistant') !== 'assistant') return [];
  const visibleText = stripThinkMarkup(message.content || '', {
    streaming: message.status === 'streaming'
  });
  const copyFeedback = state.messageActionFeedback[`${messageId}:copy`] || '';
  const isRegenerating = Boolean(
    state.regeneratingMessageId === messageId
    || (state.activeJobId && message.jobId === state.activeJobId && message.status === 'streaming')
  );
  const copyDisabled = !visibleText.trim();
  const regenerateDisabled = Boolean(state.modelPreparing || state.activeJobId || state.submitting || message.status === 'streaming');
  return [
    {
      id: `${messageId}:copy`,
      action: 'copy',
      className: 'xtend-llm-message-action xtend-llm-message-action-copy',
      icon: copyFeedback === 'copied' ? 'check' : 'copy',
      iconPack: 'core',
      label: copyFeedback === 'copied' ? 'Copied' : 'Copy response',
      command: 'xtend.llm.copyAssistantMessage',
      disabled: copyDisabled,
      busy: false,
      feedback: copyFeedback,
      conversationId: state.activeConversationId,
      messageId
    },
    {
      id: `${messageId}:regenerate`,
      action: 'regenerate',
      className: 'xtend-llm-message-action xtend-llm-message-action-regenerate',
      icon: 'refresh',
      iconPack: 'core',
      label: isRegenerating ? 'Regenerating response' : 'Regenerate response',
      command: 'xtend.llm.regenerateAssistantMessage',
      disabled: regenerateDisabled,
      busy: isRegenerating,
      feedback: state.messageActionFeedback[`${messageId}:regenerate`] || '',
      conversationId: state.activeConversationId,
      messageId
    }
  ];
}

function formatMessages() {
  const messages = Array.isArray(state.activeConversation?.messages) ? state.activeConversation.messages : [];
  return messages.map((message) => {
    const id = message.id || `${message.role}-${message.createdAt || Math.random().toString(36).slice(2)}`;
    const actions = assistantMessageActions(message, id);
    return {
      id,
      role: message.role || 'assistant',
      roleClass: `xtend-llm-message-${message.role || 'assistant'}`,
      roleLabel: message.role === 'assistant' ? 'Qwen3' : 'You',
      isAssistant: (message.role || 'assistant') === 'assistant',
      streaming: message.status === 'streaming',
      regenerating: Boolean(state.regeneratingMessageId === id),
      actionRowId: `${id}-actions`,
      hasActions: actions.length > 0,
      actions,
      copyAction: actions.find((action) => action.action === 'copy') || null,
      regenerateAction: actions.find((action) => action.action === 'regenerate') || null,
      segments: messageSegments(message)
    };
  });
}

function modelStatusState() {
  return {
    id: 'model-status',
    text: state.modelStatusText,
    tone: state.modelStatusTone,
    label: 'Model'
  };
}

function conversationSearchState() {
  return {
    id: 'conversation-search',
    field: 'conversationSearch',
    label: 'Search chats',
    placeholder: 'Search chats',
    value: state.conversationSearchDraft,
    inputType: 'search',
    command: 'xtend.llm.updateConversationSearch',
    required: false,
    hidden: false
  };
}

function conversationListState() {
  const conversations = formatConversationList();
  const hasConversations = state.conversations.length > 0;
  return {
    id: 'conversation-list',
    label: 'Conversation history',
    empty: conversations.length === 0,
    emptyText: hasConversations ? 'No matching chats.' : 'No chats yet.',
    conversations,
    hidden: false
  };
}

function activeConversationState() {
  return {
    id: 'active-conversation',
    text: state.activeConversation ? state.activeConversation.title || 'Local XTend LLM' : 'No active chat',
    tone: state.activeConversation ? 'info' : 'neutral',
    label: 'Active chat'
  };
}

function transcriptState() {
  const messages = formatMessages();
  return {
    id: 'chat-transcript',
    label: 'Conversation transcript',
    empty: messages.length === 0,
    emptyText: 'Start a local conversation. The first generation will load and cache the installed Qwen3 model.',
    messages,
    hidden: false
  };
}

function promptState() {
  const unavailable = promptUnavailable();
  return {
    id: 'prompt-input',
    field: 'prompt',
    label: 'Message',
    placeholder: 'Ask Qwen3 something...',
    value: state.promptDraft,
    rows: 4,
    command: 'xtend.llm.updatePrompt',
    submitCommand: 'xtend.llm.send',
    submitOnEnter: true,
    required: false,
    disabled: unavailable,
    hidden: false
  };
}

function commandState(id, text, tone, hidden, disabled = false, command = '') {
  return { id, text, tone, command, disabled, hidden };
}

function progressState() {
  return {
    id: 'generation-progress',
    label: 'Generation',
    status: state.progressStatus,
    value: 0,
    max: 100,
    indeterminate: true,
    busy: Boolean(state.progressActive),
    hidden: !state.progressActive
  };
}

function spinnerState() {
  return {
    id: 'generation-spinner',
    size: 'small',
    type: 'ring',
    paused: !state.progressActive,
    ariaLabel: state.progressActive ? 'Generating response' : 'Generation idle',
    ariaBusy: Boolean(state.progressActive),
    hidden: !state.progressActive
  };
}

function errorState() {
  return {
    id: 'runtime-error',
    text: state.errorText,
    tone: 'error',
    label: 'Runtime',
    hidden: state.errorHidden
  };
}

function deleteConversationDialogState() {
  const title = conversationTitle(state.pendingDeleteConversationId);
  return {
    id: 'delete-conversation-dialog',
    title: 'Delete chat?',
    overlay: true,
    open: Boolean(state.deleteDialogOpen),
    width: 'min(92vw, 420px)',
    height: 'auto',
    message: `Delete "${title}"? This chat history will be permanently removed.`,
    hidden: false
  };
}

function settingsDialogState() {
  return {
    id: 'settings-dialog',
    title: 'Settings',
    overlay: true,
    open: Boolean(state.settingsOpen),
    width: 'min(90vw, 960px)',
    height: 'auto',
    selected: validSettingsTabIndex(state.settingsSelectedTab),
    themeMode: state.settings.themeMode,
    draftThemeMode: state.settingsDraft.themeMode,
    customInstructions: state.settingsDraft.customInstructions,
    instructionsBusy: Boolean(state.modelPreparing),
    instructionsTabLabel: state.modelPreparing ? 'Instructions (busy)' : 'Instructions',
    dirty: Boolean(state.settingsDirty),
    resetConfirm: Boolean(state.settingsResetConfirm),
    hidden: false
  };
}

function createSnapshot() {
  const hasPrompt = state.promptDraft.trim().length > 0;
  const unavailable = promptUnavailable();
  return {
    modelStatus: modelStatusState(),
    conversationSearch: conversationSearchState(),
    conversationList: conversationListState(),
    activeConversation: activeConversationState(),
    transcript: transcriptState(),
    prompt: promptState(),
    send: commandState('send-message', 'Send', 'primary', Boolean(state.activeJobId), !hasPrompt || unavailable, 'xtend.llm.send'),
    cancel: commandState('cancel-generation', 'Cancel', 'secondary', !state.activeJobId, false, 'xtend.llm.cancelGeneration'),
    retry: commandState('retry-generation', 'Retry', 'secondary', !state.retryVisible, false, 'xtend.llm.retryGeneration'),
    progress: progressState(),
    spinner: spinnerState(),
    error: errorState(),
    deleteConversationDialog: deleteConversationDialogState(),
    settingsDialog: settingsDialogState(),
    runtimeDiagnostics: state.runtimeDiagnostics
  };
}

async function dispatchCommand(command, payload = {}, lane = 'user-blocking') {
  if (!appRuntime || typeof appRuntime.command !== 'function') return null;
  return appRuntime.command(command, payload, {
    lane,
    sourceKind: 'business-adapter',
    sourceId: 'products.xtend-llm.renderer',
    event: 'host',
    metadata: {
      ownerId: 'products.xtend-llm.renderer'
    }
  });
}

function dispatchSnapshot() {
  if (scheduledSnapshotTimer) {
    clearTimeout(scheduledSnapshotTimer);
    scheduledSnapshotTimer = null;
  }
  const dispatch = appRuntime && typeof appRuntime.refreshSnapshot === 'function'
    ? appRuntime.refreshSnapshot('xtend.llm.applySnapshot', { reason: 'business-adapter-update' }, {
        lane: 'render',
        sourceKind: 'business-adapter',
        sourceId: 'products.xtend-llm.renderer'
      })
    : dispatchCommand('xtend.llm.applySnapshot', { reason: 'business-adapter-update' }, 'render');
  dispatch?.catch((error) => {
    console.warn('[xtend-llm] Could not dispatch RMT snapshot.', error);
  });
}

function scheduleSnapshot(delayMs = 180) {
  if (scheduledSnapshotTimer) return;
  scheduledSnapshotTimer = setTimeout(() => {
    scheduledSnapshotTimer = null;
    dispatchSnapshot();
  }, Math.max(0, Number(delayMs) || 0));
}

function createGenerationFrameChannel(jobId) {
  const frames = [];
  let wake = null;
  return Object.freeze({
    jobId,
    push(frame) {
      frames.push(frame);
      if (wake) wake();
    },
    async next(signal) {
      while (frames.length === 0 && !signal.aborted) {
        await new Promise((resolve) => {
          const resume = () => {
            signal.removeEventListener('abort', resume);
            if (wake === resume) wake = null;
            resolve();
          };
          wake = resume;
          signal.addEventListener('abort', resume, { once: true });
        });
      }
      return signal.aborted ? null : (frames.shift() || null);
    },
    wake() {
      if (wake) wake();
    }
  });
}

export async function* streamGenerationService(payload = {}, context = {}) {
  const jobId = String(payload.jobId || '');
  const channel = generationFrameChannels.get(jobId);
  if (!jobId || !channel) throw new Error(`Generation frame channel is unavailable for ${jobId || 'unknown job'}.`);
  try {
    while (!context.signal.aborted) {
      const frame = await channel.next(context.signal);
      if (!frame) return;
      yield frame;
    }
  } finally {
    if (generationFrameChannels.get(jobId) === channel) generationFrameChannels.delete(jobId);
  }
}

function forwardGenerationServiceFrame(frame, target = 'generation.streamText') {
  if (!appRuntime || typeof appRuntime.handleStreamPatch !== 'function') return;
  const type = frame.type || 'delta';
  const pressure = type === 'delta'
    ? recordDeltaPressure(frame.delta)
    : (type === 'start' ? resetDeltaPressure() : {
        schema: 'xtend-llm.renderer-stream-pressure.v1',
        level: lastStreamPressureLevel,
        deltasPerSecond: streamPressureWindow.length,
        bytesPerSecond: streamPressureWindow.reduce((total, sample) => total + sample.bytes, 0),
        windowMs: STREAM_PRESSURE_WINDOW_MS
      });
  appRuntime.handleStreamPatch({
    ...frame,
    target
  }, {
    target,
    streamPressureLevel: pressure.level,
    backpressureLevel: pressure.level,
    backpressureSignal: {
      schema: 'xtend-llm.renderer-backpressure-signal.v1',
      level: pressure.level,
      reason: 'llm-generation-stream',
      deltasPerSecond: pressure.deltasPerSecond,
      bytesPerSecond: pressure.bytesPerSecond
    }
  }).catch((error) => {
    console.warn('[xtend-llm] Could not record RMT stream patch.', error);
  }).finally(() => {
    refreshRuntimeDiagnostics({ includeMain: false }).then(() => dispatchSnapshot()).catch(() => {});
  });
}

function startGenerationServiceStream(jobId, context = {}, target = 'generation.streamText') {
  const registry = window.XTendMaraca?.appServices?.registry;
  if (!registry || typeof registry.stream !== 'function') {
    throw new Error('The public Maraca AppServices registry is unavailable.');
  }
  if (activeGenerationStream && typeof activeGenerationStream.cancel === 'function') {
    activeGenerationStream.cancel('Generation superseded by a newer job.');
  }
  const channel = createGenerationFrameChannel(jobId);
  generationFrameChannels.set(jobId, channel);
  const stream = registry.stream('xtend.llm.generationStream', { jobId }, {
    onFrame(frame) {
      forwardGenerationServiceFrame(frame, target);
    }
  }, {
    correlationId: context.correlationId,
    signal: context.signal
  });
  activeGenerationStream = stream;
  stream.done.finally(() => {
    channel.wake();
    if (generationFrameChannels.get(jobId) === channel) generationFrameChannels.delete(jobId);
    if (activeGenerationStream === stream) activeGenerationStream = null;
  });
  return stream;
}

function emitGenerationServiceFrame(frame) {
  const channel = generationFrameChannels.get(state.activeJobId);
  if (channel) channel.push(frame);
}

function cancelGenerationServiceStream(reason) {
  if (!activeGenerationStream || typeof activeGenerationStream.cancel !== 'function') return false;
  return activeGenerationStream.cancel(reason);
}

function isActiveJob(jobId) {
  return Boolean(jobId && state.activeJobId === jobId);
}

function cloneJobForToolDecision(job, originalText) {
  const messages = buildToolDecisionMessages(job.messages || []);
  const last = messages.at(-1);
  if (last && last.role === 'user') last.content = last.content.replace(/\/no_think/giu, '').trim();
  const language = inferSearchLanguage(originalText);
  messages[0].content = [
    messages[0].content,
    `Default search language for this prompt: ${language}.`
  ].join('\n');
  return {
    ...job,
    messages,
    maxNewTokens: 180
  };
}

function normalizeToolLanguage(toolCall, originalText) {
  const language = inferSearchLanguage(originalText);
  return {
    ...toolCall,
    arguments: {
      ...(toolCall.arguments || {}),
      language: toolCall.arguments && toolCall.arguments.language && toolCall.arguments.language !== 'auto'
        ? toolCall.arguments.language
        : language
    }
  };
}

async function runVisibleGeneration(job) {
  setRuntimeStatus('Generating with Qwen3 on WebGPU...', 'info', {
    progressActive: true,
    progressStatus: 'Streaming tokens'
  });
  dispatchSnapshot();
  state.worker.generate(job);
}

async function attachGenerationSources(job, toolResult) {
  if (!toolResult || !Array.isArray(toolResult.results) || !toolResult.results.length) return;
  if (!window.xtendLlm || typeof window.xtendLlm.attachGenerationSources !== 'function') return;
  try {
    await window.xtendLlm.attachGenerationSources({
      jobId: job.jobId,
      conversationId: job.conversationId,
      sources: toolResult.results
    });
  } catch (error) {
    console.warn('[xtend-llm] Could not attach web search sources to assistant message.', error);
  }
}

async function runToolAwareGeneration(job, originalText, options = {}) {
  const forcedToolName = options.forcedToolName || '';
  setRuntimeStatus(
    forcedToolName === WEB_SEARCH_TOOL_NAME
      ? 'Preparing web search...'
      : forcedToolName === RMT_KNOWLEDGE_TOOL_NAME
        ? 'Preparing RMT knowledge...'
        : 'Checking whether a tool is needed...',
    'info',
    {
      progressActive: true,
      progressStatus: forcedToolName === WEB_SEARCH_TOOL_NAME
        ? 'Preparing web search'
        : forcedToolName === RMT_KNOWLEDGE_TOOL_NAME
          ? 'Preparing RMT knowledge'
          : 'Checking tools'
    }
  );
  dispatchSnapshot();

  let parsed = forcedToolName === WEB_SEARCH_TOOL_NAME
    ? buildForcedWebSearchToolCall(originalText)
    : forcedToolName === RMT_KNOWLEDGE_TOOL_NAME
      ? buildForcedRmtKnowledgeToolCall(originalText)
      : resolveDeterministicToolCall(job.messages || [], originalText);
  if (parsed.type !== 'tool_call') {
    try {
      const decision = await state.worker.generateOnce(cloneJobForToolDecision(job, originalText), {
        requestId: `${job.jobId}-tool-decision`,
        timeoutMs: 60000
      });
      if (!isActiveJob(job.jobId)) return;
      parsed = parseToolDecision(decision.text || '');
    } catch (error) {
      console.warn('[xtend-llm] Tool decision failed; falling back to normal generation.', error);
      if (isActiveJob(job.jobId)) await runVisibleGeneration(job);
      return;
    }
  }
  if (parsed.type !== 'tool_call') {
    await runVisibleGeneration(job);
    return;
  }

  const toolCall = normalizeToolLanguage(parsed.toolCall, originalText);
  const isRmtKnowledge = toolCall.name === RMT_KNOWLEDGE_TOOL_NAME;
  setRuntimeStatus(isRmtKnowledge ? 'Reading RMT knowledge...' : 'Searching web...', 'info', {
    progressActive: true,
    progressStatus: isRmtKnowledge ? 'Reading RMT knowledge' : 'Searching web'
  });
  dispatchSnapshot();

  let finalJob = job;
  try {
    const toolResult = await window.xtendLlm.executeTool({
      jobId: job.jobId,
      conversationId: job.conversationId,
      toolCall
    });
    if (!isActiveJob(job.jobId)) return;
    if (!isRmtKnowledge) {
      await attachGenerationSources(job, toolResult);
      if (!isActiveJob(job.jobId)) return;
    }
    finalJob = {
      ...job,
      messages: isRmtKnowledge
        ? buildRmtKnowledgeAugmentedMessages(job.messages || [], toolResult)
        : buildSearchAugmentedMessages(job.messages || [], toolResult)
    };
    setRuntimeStatus(isRmtKnowledge ? 'Generating with RMT knowledge...' : 'Generating with web results...', 'info', {
      progressActive: true,
      progressStatus: isRmtKnowledge ? 'Generating with RMT knowledge' : 'Generating with web results'
    });
  } catch (error) {
    if (!isActiveJob(job.jobId)) return;
    console.warn(`[xtend-llm] ${isRmtKnowledge ? 'RMT knowledge' : 'Web search'} failed; asking model to answer with failure context.`, error);
    finalJob = {
      ...job,
      messages: isRmtKnowledge
        ? buildRmtKnowledgeFailureMessages(job.messages || [], toolCall, error)
        : buildSearchFailureMessages(job.messages || [], toolCall, error)
    };
    setRuntimeStatus(isRmtKnowledge ? 'RMT knowledge unavailable; generating from local context...' : 'Web search unavailable; generating from local context...', 'warning', {
      progressActive: true,
      progressStatus: isRmtKnowledge ? 'RMT knowledge unavailable' : 'Search unavailable'
    });
  }

  if (isActiveJob(job.jobId)) await runVisibleGeneration(finalJob);
}

function settleGenerationComplete() {
  emitGenerationServiceFrame({ type: 'complete', value: { jobId: state.activeJobId } });
  state.activeJobId = '';
  state.regeneratingMessageId = '';
  state.submitting = false;
  state.promptDraft = '';
  state.retryVisible = false;
  state.progressActive = false;
  state.progressStatus = 'Waiting';
  setRuntimeStatus('Ready.', 'success');
  setRuntimeError('No runtime error.', true);
  dispatchSnapshot();
}

function settleGenerationError(error = {}) {
  if (error && error.code === 'xtend-llm.app_reset') return;
  emitGenerationServiceFrame({ type: 'error', error });
  state.activeJobId = '';
  state.regeneratingMessageId = '';
  state.submitting = false;
  state.progressActive = false;
  state.progressStatus = 'Waiting';
  state.retryVisible = true;
  setRuntimeStatus('Generation failed.', 'error');
  setRuntimeError(error.message || 'Generation failed.', false);
  dispatchSnapshot();
}

function selectedToolName(context = {}) {
  const stateRuntime = context && context.stateRuntime
    || window.XTendMaraca?.orchestration?.stateRuntime
    || null;
  const toolMenu = stateRuntime && typeof stateRuntime.getState === 'function'
    ? stateRuntime.getState('xtend.llm.toolMenu')
    : null;
  return toolMenu && [WEB_SEARCH_TOOL_NAME, RMT_KNOWLEDGE_TOOL_NAME].includes(toolMenu.activeTool) ? toolMenu.activeTool : '';
}

async function submitPrompt(payload = {}, context = {}) {
  if (promptUnavailable()) return createSnapshot();
  const text = String(Object.hasOwn(payload, 'value') ? payload.value : state.promptDraft || '');
  if (!text.trim()) return createSnapshot();
  const forcedToolName = [WEB_SEARCH_TOOL_NAME, RMT_KNOWLEDGE_TOOL_NAME].includes(payload.toolName) ? payload.toolName : selectedToolName(context);
  state.submitting = true;
  state.retryVisible = false;
  setRuntimeStatus('Preparing prompt...', 'info', {
    progressActive: true,
    progressStatus: 'Preparing prompt'
  });
  setRuntimeError('No runtime error.', true);
  try {
    const result = await window.xtendLlm.submitMessage({
      conversationId: state.activeConversationId,
      text
    });
    applyConversationPatch(result);
    if (result.job) {
      state.activeJobId = result.job.jobId;
      startGenerationServiceStream(state.activeJobId, context);
      state.promptDraft = '';
      state.submitting = false;
      runToolAwareGeneration(result.job, text, { forcedToolName }).catch(settleGenerationError);
    }
  } catch (error) {
    settleGenerationError({ message: error && error.message ? error.message : String(error) });
  } finally {
    state.submitting = false;
  }
  return createSnapshot();
}

async function copyAssistantMessage(payload = {}) {
  const messageId = String(payload.messageId || '');
  const message = findActiveMessage(messageId);
  if (!message || message.role !== 'assistant') return createSnapshot();
  const text = stripThinkMarkup(message.content || '').trim();
  if (!text) return createSnapshot();
  try {
    if (!window.xtendLlm || typeof window.xtendLlm.copyText !== 'function') {
      throw new Error('Electron clipboard bridge is unavailable.');
    }
    await window.xtendLlm.copyText({ text, messageId });
    setMessageActionFeedback(messageId, 'copy', 'copied');
    setRuntimeStatus('Response copied.', 'success');
  } catch (error) {
    setRuntimeStatus('Copy failed.', 'error');
    setRuntimeError(error && error.message ? error.message : String(error), false);
  }
  return createSnapshot();
}

async function regenerateAssistantMessage(payload = {}, context = {}) {
  const messageId = String(payload.messageId || '');
  const conversationId = String(payload.conversationId || state.activeConversationId || '');
  if (!messageId || !conversationId || promptUnavailable()) return createSnapshot();
  const forcedToolName = [WEB_SEARCH_TOOL_NAME, RMT_KNOWLEDGE_TOOL_NAME].includes(payload.toolName) ? payload.toolName : selectedToolName(context);
  state.regeneratingMessageId = messageId;
  state.submitting = true;
  state.retryVisible = false;
  setMessageActionFeedback(messageId, 'regenerate', 'running', 4000);
  setRuntimeStatus('Regenerating response...', 'info', {
    progressActive: true,
    progressStatus: 'Regenerating response'
  });
  setRuntimeError('No runtime error.', true);
  dispatchSnapshot();
  try {
    if (!window.xtendLlm || typeof window.xtendLlm.regenerateAssistantMessage !== 'function') {
      throw new Error('Electron regeneration bridge is unavailable.');
    }
    const result = await window.xtendLlm.regenerateAssistantMessage({ conversationId, messageId });
    applyConversationPatch(result);
    if (result.job) {
      state.activeJobId = result.job.jobId;
      startGenerationServiceStream(state.activeJobId, context, 'generation.regenerate');
      state.submitting = false;
      const originalText = result.job.originalPrompt || (result.job.messages || []).filter((entry) => entry.role === 'user').at(-1)?.content || '';
      runToolAwareGeneration(result.job, originalText, { forcedToolName }).catch(settleGenerationError);
    }
  } catch (error) {
    state.regeneratingMessageId = '';
    settleGenerationError({ message: error && error.message ? error.message : String(error) });
  } finally {
    state.submitting = false;
  }
  return createSnapshot();
}

async function cancelGeneration() {
  const jobId = state.activeJobId;
  if (!jobId) return createSnapshot();
  cancelGenerationServiceStream('Generation cancelled by the user.');
  state.activeJobId = '';
  state.regeneratingMessageId = '';
  state.submitting = false;
  state.progressActive = false;
  state.progressStatus = 'Waiting';
  state.retryVisible = false;
  if (state.worker) state.worker.cancel(jobId);
  await window.xtendLlm.cancelGeneration({
    jobId,
    conversationId: state.activeConversationId
  });
  setRuntimeStatus('Generation canceled.', 'warning');
  return createSnapshot();
}

async function bootstrap() {
  if (!window.xtendLlm) {
    setRuntimeStatus('Electron preload bridge is unavailable.', 'error');
    setRuntimeError('Electron preload bridge is unavailable.', false);
    return createSnapshot();
  }
  const url = new URL(window.location.href);
  state.worker = new LlmWorkerClient({ fake: url.searchParams.get('fakeModel') === '1' });
  uiCompute = new UiComputeWorkerClient({ fake: url.searchParams.get('fakeUiCompute') === '1' });
  const status = await window.xtendLlm.status();
  state.targetModel = status.targetModel || '';
  applySettingsPatch(status.settings || {});
  applyConversationPatch(status.conversation || {});
  bindBridgeEvents();
  state.modelPreparing = true;
  setRuntimeStatus('Preparing Qwen3 WebGPU runtime...', 'info', {
    progressActive: true,
    progressStatus: 'Preparing model'
  });
  const fakeLoadDelayMs = Number(url.searchParams.get('fakeModelLoadDelayMs'));
  state.worker.loadModel({
    model: status.targetModel,
    fakeLoadDelayMs: Number.isFinite(fakeLoadDelayMs) ? fakeLoadDelayMs : 0
  });
  prewarmUiComputeTargets().then(() => refreshRuntimeDiagnostics({ includeMain: false }).then(() => dispatchSnapshot())).catch(() => {});
  await refreshRuntimeDiagnostics();
  return createSnapshot();
}

function bindBridgeEvents() {
  if (subscriptionsBound || !window.xtendLlm || typeof window.xtendLlm.on !== 'function') return;
  subscriptionsBound = true;
  window.xtendLlm.on(CHANNELS.conversationPatch, (patch) => {
    applyConversationPatch(patch);
    dispatchSnapshot();
  });
  window.xtendLlm.on(CHANNELS.settingsPatch, (patch) => {
    applySettingsPatch(patch.settings || {});
    dispatchSnapshot();
  });
  window.xtendLlm.on(CHANNELS.modelProgress, (progress) => {
    const text = progress.status || progress.phase || 'Model loading';
    const tone = progress.phase === 'error' ? 'error' : progress.phase === 'ready' ? 'success' : 'info';
    state.modelPreparing = progress.phase === 'loading';
    setRuntimeStatus(text, tone, {
      progressActive: progress.phase === 'loading' || Boolean(state.activeJobId),
      progressStatus: text
    });
    if (progress.phase === 'error') {
      state.modelPreparing = false;
      setRuntimeError(text, false);
      dispatchSnapshot();
      return;
    }
    if (progress.phase === 'ready') {
      state.modelPreparing = false;
      dispatchSnapshot();
      return;
    }
    scheduleSnapshot(220);
  });
  window.xtendLlm.on(CHANNELS.generationDelta, (delta) => {
    const jobId = typeof delta === 'object' && delta ? String(delta.jobId || '') : state.activeJobId;
    if (!isActiveJob(jobId)) return;
    setRuntimeStatus('Streaming response...', 'info', {
      progressActive: true,
      progressStatus: 'Streaming tokens'
    });
    emitGenerationServiceFrame({
      type: 'delta',
      delta: typeof delta === 'string' ? delta : String(delta.delta || '')
    });
    dispatchSnapshot();
  });
  window.xtendLlm.on(CHANNELS.generationComplete, (complete) => {
    if (!isActiveJob(complete && complete.jobId)) return;
    settleGenerationComplete();
  });
  window.xtendLlm.on(CHANNELS.generationError, (error) => {
    if (error && error.jobId && !isActiveJob(error.jobId)) return;
    settleGenerationError(error);
  });
}

export function bootstrapService() {
  return bootstrap();
}

export function applySnapshotService() {
  return createSnapshot();
}

export function updatePromptService(payload = {}) {
  state.promptDraft = String(payload.value || '');
  return createSnapshot();
}

export function routePromptCommandService(payload = {}, context = {}) {
  state.promptDraft = String(payload.value || '');
  return payload.command === 'xtend.llm.send' ? submitPrompt(payload, context) : createSnapshot();
}

export function updateConversationSearchService(payload = {}) {
  state.conversationSearchDraft = String(payload.value || '');
  return createSnapshot();
}

export function sendPromptService(payload = {}, context = {}) {
  return submitPrompt(payload, context);
}

export function copyAssistantMessageService(payload = {}) {
  return copyAssistantMessage(payload);
}

export function regenerateAssistantMessageService(payload = {}, context = {}) {
  return regenerateAssistantMessage(payload, context);
}

export function cancelGenerationService() {
  return cancelGeneration();
}

export async function newConversationService() {
  const patch = await window.xtendLlm.createConversation();
  state.openConversationMenuId = '';
  applyConversationPatch(patch);
  setRuntimeError('No runtime error.', true);
  return createSnapshot();
}

export async function selectConversationService(payload = {}) {
  const patch = await window.xtendLlm.selectConversation(payload.conversationId);
  state.openConversationMenuId = '';
  applyConversationPatch(patch);
  setRuntimeError('No runtime error.', true);
  return createSnapshot();
}

export function openConversationMenuService(payload = {}) {
  state.openConversationMenuId = state.openConversationMenuId === payload.conversationId ? '' : String(payload.conversationId || '');
  return createSnapshot();
}

export function requestDeleteConversationService(payload = {}) {
  state.pendingDeleteConversationId = String(payload.conversationId || '');
  state.deleteDialogOpen = Boolean(state.pendingDeleteConversationId);
  state.openConversationMenuId = '';
  return createSnapshot();
}

export function closeDeleteConversationService() {
  state.pendingDeleteConversationId = '';
  state.deleteDialogOpen = false;
  return createSnapshot();
}

export async function confirmDeleteConversationService() {
  const conversationId = state.pendingDeleteConversationId;
  if (conversationId && conversationId === state.activeConversationId && state.activeJobId) {
    cancelGenerationServiceStream('Active conversation deleted.');
    state.worker.cancel(state.activeJobId);
    state.activeJobId = '';
    state.regeneratingMessageId = '';
  }
  state.pendingDeleteConversationId = '';
  state.deleteDialogOpen = false;
  if (conversationId) {
    const patch = await window.xtendLlm.deleteConversation(conversationId);
    applyConversationPatch(patch);
  }
  return createSnapshot();
}

export async function openSettingsService() {
  await refreshRuntimeDiagnostics();
  state.settingsDraft = { ...state.settings };
  state.settingsDirty = false;
  state.settingsSelectedTab = 0;
  state.settingsResetConfirm = false;
  state.settingsOpen = true;
  return createSnapshot();
}

export function closeSettingsService() {
  state.settingsDraft = { ...state.settings };
  state.settingsDirty = false;
  state.settingsResetConfirm = false;
  state.settingsOpen = false;
  applyThemeMode(state.settings.themeMode);
  return createSnapshot();
}

export function selectSettingsTabService(payload = {}) {
  state.settingsSelectedTab = validSettingsTabIndex(payload.selected ?? payload.index);
  return createSnapshot();
}

export function updateSettingsThemeService(payload = {}) {
  state.settingsDraft.themeMode = validThemeMode(payload.mode);
  state.settingsDirty = true;
  applyThemeMode(state.settingsDraft.themeMode);
  return createSnapshot();
}

export function updateSettingsInstructionsService(payload = {}) {
  state.settingsDraft.customInstructions = String(payload.value || '');
  state.settingsDirty = true;
  return createSnapshot();
}

export async function saveSettingsService() {
  const patch = await window.xtendLlm.updateSettings(state.settingsDraft);
  applySettingsPatch(patch.settings || {});
  state.settingsOpen = false;
  setRuntimeStatus('Settings saved.', 'success');
  return createSnapshot();
}

export function beginSettingsResetService() {
  state.settingsResetConfirm = true;
  return createSnapshot();
}

export function cancelSettingsResetService() {
  state.settingsResetConfirm = false;
  return createSnapshot();
}

export async function confirmSettingsResetService() {
  if (state.activeJobId) {
    cancelGenerationServiceStream('Application reset.');
    state.worker.cancel(state.activeJobId);
    state.activeJobId = '';
    state.regeneratingMessageId = '';
  }
  const result = await window.xtendLlm.resetApp({ confirm: true });
  applySettingsPatch(result.settings?.settings || result.settings || {});
  applyConversationPatch(result.conversation || {});
  state.promptDraft = '';
  state.conversationSearchDraft = '';
  state.settingsOpen = false;
  state.settingsResetConfirm = false;
  setRuntimeStatus('Ready.', 'success');
  await refreshRuntimeDiagnostics();
  return createSnapshot();
}

export async function readRuntimeDiagnosticsService() {
  await refreshRuntimeDiagnostics();
  return createSnapshot();
}

function disposeProductRuntime(reason = 'XTend LLM page hidden.') {
  cancelGenerationServiceStream(reason);
  generationFrameChannels.forEach((channel) => channel.wake());
  generationFrameChannels.clear();
  if (state.worker && typeof state.worker.dispose === 'function') state.worker.dispose(reason);
  if (uiCompute && typeof uiCompute.dispose === 'function') uiCompute.dispose(reason);
}

window.addEventListener('xtend-maraca:boot', (event) => {
  maracaBootResult = event.detail || null;
  appRuntime = window.XTendMaraca?.orchestration?.appRuntime || null;
  dispatchCommand('xtend.llm.bootstrap', { label: 'Bootstrap' }, 'bootstrap').catch((error) => {
    console.error('[xtend-llm] Bootstrap action failed.', error);
  });
}, { once: true });

window.addEventListener('pagehide', () => disposeProductRuntime(), { once: true });
