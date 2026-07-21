import {
  mountXTensions,
  createXTensionResumeAdopters,
  updateXTensions,
  getLifecycleSummary,
  readXTensionBootConfig,
  normalizeXTensionBootConfig
} from './xtension-host.mjs';
import { xstate } from '/components/xstate.js';
import { createRmtEventRoutingRuntime } from '/xtendrmt/rmt-event-routing-runtime.js';

const payloadElement = document.getElementById('xtend-erp-resume-payload') || document.querySelector('[data-rmt-ssr-resume]');
const payload = payloadElement ? JSON.parse(payloadElement.textContent || '{}') : null;
const intentQueue = [];
let xtensionsMounted = false;
let maracaBootHandled = false;
let repeatMaracaBootHandled = false;
let surfaceInfoDialogModulePromise = null;
let xtensionControlDialogModulePromise = null;
let xcommandKernelPromise = null;
let shellCommandRuntime = null;
let shellCommandAttachReport = null;
const resumeMetrics = {
  scriptLoadedAt: typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now(),
  scriptLoadedIso: new Date().toISOString(),
  domContentLoadedAt: null,
  maracaBootAt: null,
  xtensionsMountedAt: null,
  surfaceInfoDialogOpenRequestedAt: null,
  surfaceInfoDialogLoadedAt: null,
  surfaceInfoDialogOpenedAt: null,
  xtensionControlDialogOpenRequestedAt: null,
  xtensionControlDialogLoadedAt: null,
  xtensionControlDialogOpenedAt: null
};

function markServerRenderedMaracaCss() {
  const expectedHref = new URL('/dist/maraca/xtend.maraca.css', window.location.href).href;
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link.href === expectedHref) {
      link.setAttribute('data-maraca-style', 'external');
    }
  });
}

markServerRenderedMaracaCss();

window.__XTendResumeDemo = {
  payload,
  intentQueue,
  xtensionsMounted: false,
  surfaceInfoDialogLoaded: false,
  surfaceInfoDialogOpen: false,
  xtensionControlDialogLoaded: false,
  xtensionControlDialogOpen: false,
  xtensionBootConfig: readXTensionBootConfig(),
  xcommandReady: false,
  lastSnapshot: payload && payload.snapshot || null,
  metrics: resumeMetrics,
  commandQueue: intentQueue,
  appRuntimeCommandLog: [],
  shellCommandDiagnostics: [],
  xstate
};

function decodeBase64Url(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const bytes = atob(padded);
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

async function verifyResumeEnvelope(canonicalPayload, integrity) {
  if (!payload || !payload.publicKey || integrity.keyId !== payload.publicKey.keyId) return { verified: false, reason: 'key_id_mismatch' };
  if (integrity.algorithm !== 'ECDSA-P256-SHA256') return { verified: false, reason: 'algorithm_mismatch' };
  const key = await crypto.subtle.importKey(
    'jwk',
    payload.publicKey.jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  );
  const verified = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    decodeBase64Url(integrity.signature),
    new TextEncoder().encode(canonicalPayload)
  );
  return { verified, keyId: integrity.keyId };
}

window.__XTendMaracaAutoBootOptions = () => ({
  root: document.getElementById('xtend-maraca-root'),
  initialState: payload && payload.snapshot && payload.snapshot.rmtState || {},
  appState: payload && payload.snapshot && payload.snapshot.appState || {},
  xstate,
  lazyStrategy: 'viewport',
  verifyResumeEnvelope,
  resumeAdopters: createXTensionResumeAdopters(payload),
  intentQueue: [
    ...(window.__XTendErpPrebootResume && window.__XTendErpPrebootResume.capture.snapshot() || []),
    ...intentQueue
  ]
});

function formatCurrency(value, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function clone(value) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function getAppRuntime() {
  return window.__XTendMaracaOrchestration && window.__XTendMaracaOrchestration.appRuntime || null;
}

function listAppRuntimeCommands() {
  const appRuntime = getAppRuntime();
  if (!appRuntime || typeof appRuntime.listCommands !== 'function') return [];
  try {
    return appRuntime.listCommands();
  } catch {
    return [];
  }
}

async function dispatchAppRuntimeCommand(commandName, commandPayload = {}, metadata = {}) {
  const appRuntime = getAppRuntime();
  const command = String(commandName || '').trim();
  if (!command) return { status: 'skipped', reason: 'missing-command' };
  if (!appRuntime || typeof appRuntime.command !== 'function') {
    const queued = { command, payload: clone(commandPayload), metadata: clone(metadata), status: 'runtime-pending', at: Date.now() };
    window.__XTendResumeDemo.appRuntimeCommandLog.push(queued);
    window.__XTendResumeDemo.appRuntimeCommandLog.splice(0, Math.max(0, window.__XTendResumeDemo.appRuntimeCommandLog.length - 30));
    return { status: 'queued', reason: 'app-runtime-pending', command };
  }
  try {
    const result = await appRuntime.command(command, commandPayload, {
      sourceKind: metadata.sourceKind || 'app-shell',
      sourceId: metadata.sourceId || commandPayload.sourceId || metadata.eventId || 'erp-shell-command',
      event: metadata.eventName || metadata.event || 'xtend-command',
      surfaceId: metadata.surfaceId || commandPayload.surfaceId || 'erp.shell',
      lane: metadata.lane || 'user-blocking',
      metadata
    });
    const entry = {
      command,
      payload: clone(commandPayload),
      result: clone(result),
      status: result && result.status || 'success',
      at: Date.now()
    };
    window.__XTendResumeDemo.lastAppRuntimeCommand = entry;
    window.__XTendResumeDemo.appRuntimeCommandLog.push(entry);
    window.__XTendResumeDemo.appRuntimeCommandLog.splice(0, Math.max(0, window.__XTendResumeDemo.appRuntimeCommandLog.length - 30));
    return result || { status: 'success', command };
  } catch (error) {
    const entry = {
      command,
      payload: clone(commandPayload),
      status: 'error',
      error: error && error.message ? error.message : String(error),
      at: Date.now()
    };
    window.__XTendResumeDemo.lastAppRuntimeCommand = entry;
    window.__XTendResumeDemo.appRuntimeCommandLog.push(entry);
    window.__XTendResumeDemo.appRuntimeCommandLog.splice(0, Math.max(0, window.__XTendResumeDemo.appRuntimeCommandLog.length - 30));
    return entry;
  }
}

function normalizeCommandPayload(rawPayload = {}) {
  const envelopePayload = rawPayload && rawPayload.schema === 'xtend.rmt.command.v1'
    ? rawPayload.payload
    : rawPayload;
  const source = envelopePayload && envelopePayload.payload && envelopePayload.command
    ? envelopePayload.payload
    : envelopePayload;
  const dataset = source && source.dataset || {};
  const envelopeCommand = rawPayload && rawPayload.schema === 'xtend.rmt.command.v1'
    ? rawPayload.command || rawPayload.payload && rawPayload.payload.command || ''
    : '';
  return {
    command: source && (source.command || source.xtendCommand) || envelopeCommand || dataset.xtendCommand || dataset.command || '',
    processId: source && source.processId || dataset.processId || '',
    ledgerId: source && source.ledgerId || dataset.ledgerId || '',
    kpiId: source && source.kpiId || dataset.kpiId || '',
    exceptionId: source && source.exceptionId || dataset.exceptionId || '',
    orderId: source && source.orderId || dataset.orderId || '',
    riskId: source && source.riskId || dataset.riskId || '',
    menuId: source && source.menuId || dataset.menuId || '',
    commandId: source && source.commandId || dataset.commandId || '',
    commandLabel: source && source.commandLabel || dataset.commandLabel || '',
    source: source && source.source || dataset.source || '',
    enabledCount: source && source.enabledCount || dataset.enabledCount || '',
    disabledCount: source && source.disabledCount || dataset.disabledCount || '',
    href: source && source.href || dataset.href || '',
    linkText: source && source.linkText || dataset.linkText || '',
    seed: source && source.seed || dataset.seed || '',
    key: source && source.key || '',
    sourceId: source && source.sourceId || dataset.sourceId || ''
  };
}

function intentFromCommand(commandName, commandPayload = {}) {
  const payload = normalizeCommandPayload({
    ...commandPayload,
    command: commandName || commandPayload.command
  });
  const command = payload.command || commandName;
  const commandTypes = {
    'erp.shell.toggleMenu': 'toggle-menu',
    'erp.shell.selectMenuCommand': 'select-menu-command',
    'erp.shell.selectProcess': 'select-process',
    'erp.shell.selectLedgerItem': 'select-ledger-item',
    'erp.shell.inspectSlaCell': 'inspect-sla-cell',
    'erp.shell.inspectException': 'inspect-exception',
    'erp.shell.inspectOpenUi5Order': 'inspect-openui5-order',
    'erp.shell.inspectAngularRisk': 'inspect-angular-risk',
    'erp.shell.reseedRequested': 'reseed',
    'erp.shell.closeMenu': 'close-menu',
    'erp.shell.legacyNavigationIntent': 'legacy-navigation',
    'erp.shell.openXtensionControl': 'xtension-control',
    'erp.shell.closeXtensionControl': 'close-xtension-control',
    'erp.shell.applyXtensionControl': 'apply-xtension-control',
    'help.rmtSurfaceInfo': 'surface-info',
    'environment.xtensionControl': 'xtension-control'
  };
  const type = commandTypes[command] || '';
  if (!type) return null;
  return {
    type,
    processId: payload.processId,
    ledgerId: payload.ledgerId,
    kpiId: payload.kpiId,
    exceptionId: payload.exceptionId,
    orderId: payload.orderId,
    riskId: payload.riskId,
    menuId: payload.menuId,
    commandId: payload.commandId,
    commandLabel: payload.commandLabel,
    source: payload.source,
    enabledCount: payload.enabledCount,
    disabledCount: payload.disabledCount,
    href: payload.href,
    linkText: payload.linkText,
    seed: payload.seed,
    sourceId: payload.sourceId,
    key: payload.key,
    command,
    capturedAt: Date.now()
  };
}

function appRuntimeCommandForIntent(intent) {
  if (!intent || !intent.type) return null;
  if (intent.type === 'close-menu') return 'erp.shell.toggleMenu';
  if (intent.type === 'surface-info') return 'erp.shell.openSurfaceInfo';
  if (intent.type === 'xtension-control') return 'erp.shell.openXtensionControl';
  if (intent.type === 'close-xtension-control') return 'erp.shell.closeXtensionControl';
  if (intent.type === 'apply-xtension-control') return 'erp.shell.applyXtensionControl';
  return {
    'toggle-menu': 'erp.shell.toggleMenu',
    'select-menu-command': 'erp.shell.selectMenuCommand',
    'select-process': 'erp.shell.selectProcess',
    'select-ledger-item': 'erp.shell.selectLedgerItem',
    'inspect-sla-cell': 'erp.shell.inspectSlaCell',
    'inspect-exception': 'erp.shell.inspectException',
    'inspect-openui5-order': 'erp.shell.inspectOpenUi5Order',
    'inspect-angular-risk': 'erp.shell.inspectAngularRisk',
    reseed: 'erp.shell.reseedRequested'
  }[intent.type] || null;
}

function appRuntimePayloadForIntent(intent) {
  if (!intent) return {};
  if (intent.type === 'select-process') return { process: intent.processId, processId: intent.processId };
  if (intent.type === 'toggle-menu') return { menuId: intent.menuId };
  if (intent.type === 'close-menu') return { menuId: '' };
  if (intent.type === 'select-menu-command') {
    return {
      menuId: intent.menuId,
      commandId: intent.commandId,
      commandLabel: intent.commandLabel
    };
  }
  if (intent.type === 'surface-info') return { source: intent.source || 'xcommand:F1' };
  if (intent.type === 'xtension-control') return { source: intent.source || 'menu:Umfeld/XTension Teststeuerung' };
  if (intent.type === 'close-xtension-control') return { source: intent.source || 'dialog-closed' };
  if (intent.type === 'apply-xtension-control') {
    return {
      source: intent.source || 'button-apply',
      enabledCount: Number(intent.enabledCount || 0),
      disabledCount: Number(intent.disabledCount || 0)
    };
  }
  return {
    processId: intent.processId,
    ledgerId: intent.ledgerId,
    kpiId: intent.kpiId,
    exceptionId: intent.exceptionId,
    orderId: intent.orderId,
    riskId: intent.riskId,
    seed: intent.seed
  };
}

function getMenuBar(snapshot) {
  return snapshot && snapshot.menuBar || {
    id: 'erp-menu-bar-state',
    openMenuId: '',
    selectedCommandId: '',
    selectedCommandLabel: '',
    lastCommand: 'Menüband bereit',
    groups: []
  };
}

function getSurfaceInfoDialog(snapshot) {
  return snapshot && snapshot.surfaceInfoDialog || {
    id: 'erp-surface-info-dialog-state',
    title: 'RMT Surface Info',
    open: false,
    loaded: false,
    telemetryStatus: 'lazy',
    lastOpenedAt: '',
    commandSource: '',
    hidden: true
  };
}

function getXtensionControlDialog(snapshot) {
  return snapshot && snapshot.xtensionControlDialog || {
    id: 'erp-xtension-control-dialog-state',
    title: 'XTension Teststeuerung',
    open: false,
    loaded: false,
    configStatus: 'local-storage',
    storageKey: 'xtend.erp.demo.xtension.boot.v1',
    enabledCount: 8,
    disabledCount: 0,
    totalCount: 8,
    lastAppliedAt: '',
    commandSource: '',
    hidden: true
  };
}

function findMenuCommand(menuBar, commandId) {
  for (const group of menuBar.groups || []) {
    const command = (group.commands || []).find((entry) => entry.id === commandId);
    if (command) return { group, command };
  }
  return null;
}

function createSurfaceInfoRmtState(dialog) {
  return {
    id: dialog.id || 'erp-surface-info-dialog-state',
    title: dialog.title || 'RMT Surface Info',
    open: Boolean(dialog.open),
    loaded: Boolean(dialog.loaded),
    telemetryStatus: dialog.telemetryStatus || 'lazy',
    lastOpenedAt: dialog.lastOpenedAt || '',
    commandSource: dialog.commandSource || '',
    hidden: dialog.hidden !== false
  };
}

function createXtensionControlRmtState(dialog) {
  const bootConfig = normalizeXTensionBootConfig(readXTensionBootConfig());
  return {
    id: dialog.id || 'erp-xtension-control-dialog-state',
    title: dialog.title || 'XTension Teststeuerung',
    open: Boolean(dialog.open),
    loaded: Boolean(dialog.loaded),
    configStatus: dialog.configStatus || 'local-storage',
    storageKey: dialog.storageKey || bootConfig.storageKey,
    enabledCount: Number.isFinite(Number(dialog.enabledCount)) ? Number(dialog.enabledCount) : bootConfig.enabledCount,
    disabledCount: Number.isFinite(Number(dialog.disabledCount)) ? Number(dialog.disabledCount) : bootConfig.disabledCount,
    totalCount: Number.isFinite(Number(dialog.totalCount)) ? Number(dialog.totalCount) : bootConfig.totalCount,
    lastAppliedAt: dialog.lastAppliedAt || '',
    commandSource: dialog.commandSource || '',
    hidden: dialog.hidden !== false
  };
}

function createMenuRmtState(menuBar) {
  const commandCount = (menuBar.groups || []).reduce((total, group) => total + (group.commands || []).length, 0);
  return {
    id: 'erp-menu-bar-state',
    title: 'Menüband',
    menuCount: (menuBar.groups || []).length,
    commandCount,
    openMenuId: menuBar.openMenuId || '',
    selectedCommandId: menuBar.selectedCommandId || '',
    selectedCommandLabel: menuBar.selectedCommandLabel || '',
    lastCommand: menuBar.lastCommand || 'Menüband bereit',
    hidden: false
  };
}

function applySurfaceInfoDialogDom(dialog) {
  const host = document.getElementById('erp-surface-info-dialog-host');
  if (!host || !dialog) return;
  host.dataset.lazyState = dialog.loaded
    ? dialog.open ? 'loaded-open' : 'loaded-closed'
    : 'unloaded';
  if (!dialog.open) host.hidden = true;
}

function applyXtensionControlDialogDom(dialog) {
  const host = document.getElementById('erp-xtension-control-dialog-host');
  if (!host || !dialog) return;
  host.dataset.lazyState = dialog.loaded
    ? dialog.open ? 'loaded-open' : 'loaded-closed'
    : 'unloaded';
  if (!dialog.open) host.hidden = true;
}

function getXStateTargets() {
  const targets = [];
  if (xstate && typeof xstate.set === 'function') targets.push(xstate);
  if (window.xstate && typeof window.xstate.set === 'function' && window.xstate !== xstate) {
    targets.push(window.xstate);
  }
  return targets;
}

function readXState(key) {
  const targets = getXStateTargets();
  for (const target of targets) {
    if (typeof target.get !== 'function') continue;
    const value = target.get(key);
    if (value !== undefined) return value;
  }
  return undefined;
}

function writeXState(target, updates) {
  if (!target || typeof target.set !== 'function') return;
  if (typeof target.batchUpdate === 'function') target.batchUpdate(updates);
  else Object.entries(updates).forEach(([key, value]) => target.set(key, value));
}

function withMenuBar(snapshot, patch) {
  const currentMenuBar = getMenuBar(snapshot);
  const menuBar = {
    ...currentMenuBar,
    ...patch,
    groups: currentMenuBar.groups || []
  };
  const menuState = createMenuRmtState(menuBar);
  return {
    ...snapshot,
    menuBar,
    appState: {
      ...(snapshot.appState || {}),
      menuBar: {
        openMenuId: menuBar.openMenuId || '',
        selectedCommandId: menuBar.selectedCommandId || '',
        selectedCommandLabel: menuBar.selectedCommandLabel || '',
        lastCommand: menuBar.lastCommand || ''
      }
    },
    rmtState: {
      ...(snapshot.rmtState || {}),
      'erp.shell.menuBar': menuState
    }
  };
}

function withSurfaceInfoDialog(snapshot, patch) {
  const currentDialog = getSurfaceInfoDialog(snapshot);
  const surfaceInfoDialog = {
    ...currentDialog,
    ...patch
  };
  const dialogState = createSurfaceInfoRmtState(surfaceInfoDialog);
  return {
    ...snapshot,
    surfaceInfoDialog,
    appState: {
      ...(snapshot.appState || {}),
      surfaceInfoDialog: {
        open: Boolean(surfaceInfoDialog.open),
        loaded: Boolean(surfaceInfoDialog.loaded),
        telemetryStatus: surfaceInfoDialog.telemetryStatus || 'lazy',
        lastOpenedAt: surfaceInfoDialog.lastOpenedAt || '',
        commandSource: surfaceInfoDialog.commandSource || ''
      }
    },
    rmtState: {
      ...(snapshot.rmtState || {}),
      'erp.shell.surfaceInfoDialog': dialogState
    }
  };
}

function withXtensionControlDialog(snapshot, patch) {
  const currentDialog = getXtensionControlDialog(snapshot);
  const xtensionControlDialog = {
    ...currentDialog,
    ...patch
  };
  const dialogState = createXtensionControlRmtState(xtensionControlDialog);
  return {
    ...snapshot,
    xtensionControlDialog,
    appState: {
      ...(snapshot.appState || {}),
      xtensionControlDialog: {
        open: Boolean(xtensionControlDialog.open),
        loaded: Boolean(xtensionControlDialog.loaded),
        configStatus: xtensionControlDialog.configStatus || 'local-storage',
        storageKey: xtensionControlDialog.storageKey || 'xtend.erp.demo.xtension.boot.v1',
        enabledCount: dialogState.enabledCount,
        disabledCount: dialogState.disabledCount,
        totalCount: dialogState.totalCount,
        lastAppliedAt: xtensionControlDialog.lastAppliedAt || '',
        commandSource: xtensionControlDialog.commandSource || ''
      }
    },
    rmtState: {
      ...(snapshot.rmtState || {}),
      'erp.shell.xtensionControlDialog': dialogState
    }
  };
}

function mirrorSnapshotToXState(snapshot, reason = 'snapshot') {
  if (!snapshot) return;
  const menuBar = getMenuBar(snapshot);
  const menuState = createMenuRmtState(menuBar);
  const surfaceInfoDialog = getSurfaceInfoDialog(snapshot);
  const surfaceInfoState = createSurfaceInfoRmtState(surfaceInfoDialog);
  const xtensionControlDialog = getXtensionControlDialog(snapshot);
  const xtensionControlState = createXtensionControlRmtState(xtensionControlDialog);
  const updates = {
    ...(snapshot.rmtState || {}),
    'erp.shell.menuBar': menuState,
    'erp.shell.menuBar.openMenuId': menuState.openMenuId,
    'erp.shell.menuBar.selectedCommandId': menuState.selectedCommandId,
    'erp.shell.menuBar.selectedCommandLabel': menuState.selectedCommandLabel,
    'erp.shell.menuBar.lastCommand': menuState.lastCommand,
    'erp.shell.surfaceInfoDialog': surfaceInfoState,
    'erp.shell.surfaceInfoDialog.open': surfaceInfoState.open,
    'erp.shell.surfaceInfoDialog.loaded': surfaceInfoState.loaded,
    'erp.shell.surfaceInfoDialog.telemetryStatus': surfaceInfoState.telemetryStatus,
    'erp.shell.surfaceInfoDialog.hidden': surfaceInfoState.hidden,
    'erp.shell.xtensionControlDialog': xtensionControlState,
    'erp.shell.xtensionControlDialog.open': xtensionControlState.open,
    'erp.shell.xtensionControlDialog.loaded': xtensionControlState.loaded,
    'erp.shell.xtensionControlDialog.configStatus': xtensionControlState.configStatus,
    'erp.shell.xtensionControlDialog.enabledCount': xtensionControlState.enabledCount,
    'erp.shell.xtensionControlDialog.disabledCount': xtensionControlState.disabledCount,
    'erp.shell.xtensionControlDialog.hidden': xtensionControlState.hidden,
    'erp.shell.appState': clone(snapshot.appState || {}),
    'erp.shell.snapshot': {
      seed: snapshot.seed,
      generatedAt: snapshot.generatedAt,
      activeProcessId: snapshot.activeProcessId
    },
    'erp.shell.xstate.lastReason': reason
  };
  getXStateTargets().forEach((target) => writeXState(target, updates));
  applySurfaceInfoDialogDom(surfaceInfoDialog);
  applyXtensionControlDialogDom(xtensionControlDialog);
}

function applyMenuDom(menuBar) {
  const nav = document.getElementById('erp-menu-bar');
  if (!nav || !menuBar) return;
  nav.dataset.openMenuId = menuBar.openMenuId || '';
  nav.dataset.selectedCommandId = menuBar.selectedCommandId || '';
  for (const groupElement of nav.querySelectorAll('[data-menu-group]')) {
    const groupId = groupElement.dataset.menuGroup || '';
    const open = groupId === (menuBar.openMenuId || '');
    groupElement.classList.toggle('is-open', open);
    const trigger = groupElement.querySelector('[data-erp-menu-trigger]');
    const panel = groupElement.querySelector('.erp-menu-dropdown');
    if (trigger) trigger.setAttribute('aria-expanded', String(open));
    if (panel) panel.hidden = !open;
  }
  for (const item of nav.querySelectorAll('[data-erp-menu-command]')) {
    const found = findMenuCommand(menuBar, item.dataset.commandId || '');
    item.classList.toggle('is-selected', item.dataset.commandId === menuBar.selectedCommandId);
    if (!found) continue;
    const label = item.querySelector('span');
    const shortcut = item.querySelector('kbd');
    const badge = item.querySelector('.erp-menu-badge');
    if (label) label.textContent = found.command.label;
    if (shortcut) shortcut.textContent = found.command.shortcut || '';
    if (badge) badge.textContent = found.command.badge || '';
  }
  setText('#erp-menu-state-line', menuBar.lastCommand || 'Menüband bereit');
}

function updateShell(snapshot) {
  if (!snapshot) return;
  const shell = document.getElementById('erp-shell');
  if (shell) {
    shell.dataset.seed = snapshot.seed;
  }
  setText('#erp-exposure', formatCurrency(snapshot.ledger.exposure, snapshot.currency));
  setText('#erp-credits', formatCurrency(snapshot.ledger.credits, snapshot.currency));
  setText('#erp-variance', formatCurrency(snapshot.ledger.variance, snapshot.currency));
  setText('#erp-load', `${snapshot.systemLoad}%`);
  setText('#erp-resume-status', `Resume ${snapshot.seed} uebernommen`);
  const audit = document.getElementById('erp-audit-list');
  if (audit) {
    audit.replaceChildren(...snapshot.auditTrail.map((entry) => {
      const item = document.createElement('li');
      const code = document.createElement('b');
      const description = document.createElement('span');
      const age = document.createElement('small');
      code.textContent = entry.code;
      description.textContent = `${entry.actor} ${entry.action} ${entry.object}`;
      age.textContent = `${entry.minutesAgo} min`;
      item.append(code, description, age);
      return item;
    }));
  }
  if (snapshot.loadLab) {
    setText('#erp-throughput-docs', snapshot.loadLab.throughput.documentsPerMinute);
    setText('#erp-loadlab-surfaces', snapshot.loadLab.throughput.nativeSurfaces);
    setText('#erp-loadlab-xtensions', snapshot.loadLab.throughput.mountedXtensions);
    setText('#erp-native-exceptions', snapshot.loadLab.exceptionQueue.length);
    const scheduler = document.getElementById('erp-scheduler-native');
    if (scheduler) {
      scheduler.replaceChildren(...snapshot.loadLab.schedulerLanes.map((lane) => {
        const item = document.createElement('li');
        const name = document.createElement('span');
        const fibers = document.createElement('b');
        const frame = document.createElement('small');
        name.textContent = lane.lane;
        fibers.textContent = String(lane.activeFibers);
        frame.textContent = `${lane.lastFrameMs} ms`;
        item.append(name, fibers, frame);
        return item;
      }));
    }
  }
  if (snapshot.menuBar) {
    applyMenuDom(snapshot.menuBar);
  }
  if (snapshot.surfaceInfoDialog) {
    applySurfaceInfoDialogDom(snapshot.surfaceInfoDialog);
  }
  if (snapshot.xtensionControlDialog) {
    applyXtensionControlDialogDom(snapshot.xtensionControlDialog);
  }
}

function updateSmokeMarker() {
  let marker = document.getElementById('erp-demo-smoke-result');
  if (!marker) {
    marker = document.createElement('div');
    marker.id = 'erp-demo-smoke-result';
    marker.hidden = true;
    document.body.appendChild(marker);
  }
  const summary = getLifecycleSummary();
  const currentSnapshot = window.__XTendResumeDemo.lastSnapshot || payload && payload.snapshot || {};
  const nativeSurfaceCount = currentSnapshot.loadLab && currentSnapshot.loadLab.throughput
    ? currentSnapshot.loadLab.throughput.nativeSurfaces
    : 0;
  const surfaceInfoState = readXState('erp.shell.surfaceInfoDialog') || createSurfaceInfoRmtState(getSurfaceInfoDialog(currentSnapshot));
  const xtensionControlState = readXState('erp.shell.xtensionControlDialog') || createXtensionControlRmtState(getXtensionControlDialog(currentSnapshot));
  const bootConfig = normalizeXTensionBootConfig(readXTensionBootConfig());
  marker.dataset.kernelEnabled = String(Boolean(window.__XTendMaracaResult && window.__XTendMaracaResult.kernel && window.__XTendMaracaResult.kernel.enabled));
  marker.dataset.telemetryReady = String(Boolean(window.__XTendMaracaTelemetry && typeof window.__XTendMaracaTelemetry.snapshot === 'function'));
  marker.dataset.devSurfaceReady = String(Boolean(window.XTendMaraca && window.__XTendMaracaResume && window.__XTendResumeDemo));
  marker.dataset.reactStatus = summary.react || 'missing';
  marker.dataset.vueStatus = summary.vue || 'missing';
  marker.dataset.reactLedgerStatus = summary.reactLedger || 'missing';
  marker.dataset.reactSlaStatus = summary.reactSla || 'missing';
  marker.dataset.vueProcessStatus = summary.vueProcess || 'missing';
  marker.dataset.vueExceptionStatus = summary.vueException || 'missing';
  marker.dataset.threeStatus = summary.three || 'missing';
  marker.dataset.vanillaStatus = summary.vanillaStatus || summary.vanilla || 'missing';
  marker.dataset.openui5Status = summary.openui5Status || summary.openui5 || 'missing';
  marker.dataset.openui5ModelUpdates = summary.openui5ModelUpdates || '0';
  marker.dataset.angularStatus = summary.angularStatus || summary.angular || 'missing';
  marker.dataset.angularModelUpdates = summary.angularModelUpdates || '0';
  marker.dataset.iwebkitSandbox = summary.iwebkitSandbox || 'false';
  marker.dataset.iwebkitFrameLoads = summary.iwebkitFrameLoads || '0';
  marker.dataset.iwebkitMessageCount = summary.iwebkitMessageCount || '0';
  marker.dataset.threeNonblank = summary.threeNonblank || 'false';
  marker.dataset.threeRebuilds = document.querySelector('[data-xtension-slot="three-material-flow-scene"]')?.dataset.threeRebuilds || '0';
  marker.dataset.xtensionMounted = String(summary.mountedCount || 0);
  marker.dataset.xtensionBootEnabled = String(bootConfig.enabledCount);
  marker.dataset.xtensionBootDisabled = String(bootConfig.disabledCount);
  marker.dataset.frameSubscribers = String(summary.frameSubscribers || 0);
  marker.dataset.nativeSurfaceCount = String(nativeSurfaceCount);
  marker.dataset.fallbackDegraded = String(Boolean(summary.degraded));
  const resumeResult = window.__XTendResumeDemo.resumeResult || window.__XTendMaracaResult && window.__XTendMaracaResult.resume || null;
  const preboot = window.__XTendErpPrebootResume;
  const identityKeys = ['react-ledger-panel', 'react-sla-matrix', 'vue-process-sidebar', 'vue-exception-queue', 'three-material-flow-scene', 'vanilla-legacy-lab', 'openui5-procurement-worklist', 'angular-risk-workbench'];
  const fullHydrationKeys = ['react-ledger-panel', 'react-sla-matrix', 'vue-process-sidebar', 'vue-exception-queue', 'angular-risk-workbench'];
  marker.dataset.resumeStatus = resumeResult && resumeResult.status || 'pending';
  marker.dataset.resumeVerified = String(Boolean(resumeResult && resumeResult.verified));
  marker.dataset.resumeFallback = String(Boolean(resumeResult && resumeResult.fallbackHydrated));
  marker.dataset.rootIdentity = String(Boolean(preboot && preboot.root === document.getElementById(payload && payload.resume && payload.resume.rootId || 'xtend-maraca-root')));
  marker.dataset.slotIdentity = String(Boolean(preboot && identityKeys.every((key) => preboot.slotNodes.get(key) === document.querySelector(`[data-xtension-slot="${key}"]`))));
  marker.dataset.innerIdentity = String(Boolean(preboot && fullHydrationKeys.every((key) => {
    const slot = document.querySelector(`[data-xtension-slot="${key}"]`);
    const current = key === 'angular-risk-workbench'
      ? slot?.querySelector('xtend-angular-risk-workbench-root > .angular-risk-workbench')
      : slot?.firstElementChild;
    return preboot.innerNodes.get(key) === current;
  })));
  marker.dataset.hostFallbackIdentity = String(Boolean(preboot && ['three-material-flow-scene', 'vanilla-legacy-lab', 'openui5-procurement-worklist'].every((key) => {
    const slot = document.querySelector(`[data-xtension-slot="${key}"]`);
    return preboot.innerNodes.get(key) === slot?.firstElementChild;
  })));
  marker.dataset.intentReplay = String(resumeResult && resumeResult.replayedIntentCount || 0);
  marker.dataset.fallbackAttempted = String(Boolean(resumeResult && resumeResult.fallbackAttempted));
  marker.dataset.resumeEventCount = String(preboot && preboot.resumeEventCount || 0);
  marker.dataset.resumeReasons = (resumeResult && resumeResult.reasons || []).join(',');
  marker.dataset.repeatBootIgnored = String(Boolean(window.__XTendResumeDemo.repeatBootResult && window.__XTendResumeDemo.repeatBootResult.duplicateBootIgnored));
  marker.dataset.angularError = document.querySelector('[data-xtension-slot="angular-risk-workbench"]')?.dataset.xtensionError || '';
  marker.dataset.commandRuntimeAttached = String(Boolean(shellCommandAttachReport && shellCommandAttachReport.attachedCount >= 4));
  marker.dataset.appRuntimeCommands = String(listAppRuntimeCommands().length);
  marker.dataset.appRuntimeLast = window.__XTendResumeDemo.lastAppRuntimeCommand && window.__XTendResumeDemo.lastAppRuntimeCommand.command || '';
  const menuState = readXState('erp.shell.menuBar');
  marker.dataset.menuXstate = String(Boolean(menuState && menuState.id === 'erp-menu-bar-state'));
  marker.dataset.menuOpen = menuState && menuState.openMenuId || '';
  marker.dataset.menuSelected = menuState && menuState.selectedCommandId || '';
  marker.dataset.surfaceInfoLoaded = String(Boolean(window.__XTendResumeDemo.surfaceInfoDialogLoaded || surfaceInfoState.loaded));
  marker.dataset.surfaceInfoOpen = String(Boolean(window.__XTendResumeDemo.surfaceInfoDialogOpen || surfaceInfoState.open));
  marker.dataset.surfaceInfoTelemetry = String(Boolean(window.__XTendResumeDemo.surfaceInfoTelemetry));
  marker.dataset.xtensionControlLoaded = String(Boolean(window.__XTendResumeDemo.xtensionControlDialogLoaded || xtensionControlState.loaded));
  marker.dataset.xtensionControlOpen = String(Boolean(window.__XTendResumeDemo.xtensionControlDialogOpen || xtensionControlState.open));
  marker.dataset.xtensionControlStatus = xtensionControlState.configStatus || 'local-storage';
  marker.dataset.xcommandReady = String(Boolean(window.__XTendResumeDemo.xcommandReady));
  marker.dataset.xcommandLast = window.__XTendResumeDemo.lastXCommandResult && window.__XTendResumeDemo.lastXCommandResult.commandId || '';
}

function markSurfaceInfoState(patch, reason) {
  const current = window.__XTendResumeDemo.lastSnapshot || payload && payload.snapshot;
  if (!current) return null;
  const next = withSurfaceInfoDialog(current, patch);
  window.__XTendResumeDemo.lastSnapshot = next;
  mirrorSnapshotToXState(next, reason);
  updateSmokeMarker();
  return next;
}

function markXtensionControlState(patch, reason) {
  const current = window.__XTendResumeDemo.lastSnapshot || payload && payload.snapshot;
  if (!current) return null;
  const next = withXtensionControlDialog(current, patch);
  window.__XTendResumeDemo.lastSnapshot = next;
  mirrorSnapshotToXState(next, reason);
  updateSmokeMarker();
  return next;
}

async function openSurfaceInfoFromApp(source = 'manual', metadata = {}) {
  const requestedAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
  resumeMetrics.surfaceInfoDialogOpenRequestedAt = requestedAt;
  resumeMetrics.lastSurfaceInfoRequestAt = requestedAt;
  resumeMetrics.surfaceInfoDialogLoadedAt = null;
  resumeMetrics.surfaceInfoDialogOpenedAt = null;

  if (!metadata.skipAppRuntime) {
    await dispatchAppRuntimeCommand('erp.shell.openSurfaceInfo', { source }, {
      ...metadata,
      sourceId: 'help.rmtSurfaceInfo',
      eventName: metadata.eventName || 'xtend-command'
    });
  }

  const openedAt = new Date().toISOString();
  const next = markSurfaceInfoState({
    open: true,
    loaded: true,
    hidden: false,
    telemetryStatus: 'loading',
    lastOpenedAt: openedAt,
    commandSource: source
  }, `surface-info-open:${source}`);
  if (!next) return null;

  window.__XTendResumeDemo.lastSurfaceInfoOpen = {
    source,
    metadata,
    requestedAt: openedAt
  };
  setText('#erp-kernel-status-line', `Kernel: RMT Surface Info wird über ${source} geladen`);

  if (!surfaceInfoDialogModulePromise) {
    surfaceInfoDialogModulePromise = import('./surface-info-dialog.mjs');
  }
  const module = await surfaceInfoDialogModulePromise;
  const telemetry = await module.openSurfaceInfoDialog({
    xstate,
    metrics: resumeMetrics,
    reason: source,
    metadata,
    onClose(closeSource) {
      dispatchAppRuntimeCommand('erp.shell.closeSurfaceInfo', { source: closeSource || 'dialog-closed' }, {
        sourceId: 'erp-surface-info-dialog',
        eventName: 'dialog-close'
      });
      markSurfaceInfoState({
        open: false,
        hidden: true,
        telemetryStatus: 'closed',
        commandSource: closeSource || 'dialog-closed'
      }, 'surface-info-close');
      setText('#erp-kernel-status-line', 'Kernel: RMT Surface Info geschlossen');
    },
    onRefresh(refreshSource, refreshedTelemetry) {
      window.__XTendResumeDemo.surfaceInfoTelemetry = refreshedTelemetry;
      dispatchAppRuntimeCommand('erp.shell.refreshSurfaceInfo', { source: refreshSource || 'button-refresh' }, {
        sourceId: 'erp-surface-info-dialog',
        eventName: 'dialog-refresh'
      });
      markSurfaceInfoState({
        open: true,
        loaded: true,
        hidden: false,
        telemetryStatus: 'refreshed',
        commandSource: refreshSource || 'button-refresh'
      }, 'surface-info-refresh');
      setText('#erp-kernel-status-line', 'Kernel: RMT Surface Info aktualisiert');
    }
  });

  resumeMetrics.surfaceInfoDialogOpenedAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
  markSurfaceInfoState({
    open: true,
    loaded: true,
    hidden: false,
    telemetryStatus: 'ready',
    lastOpenedAt: openedAt,
    commandSource: source
  }, 'surface-info-ready');
  setText('#erp-kernel-status-line', 'Kernel: RMT Surface Info bereit');
  window.__XTendResumeDemo.surfaceInfoTelemetry = telemetry;
  updateSmokeMarker();
  return telemetry;
}

async function openXtensionControlFromApp(source = 'manual', metadata = {}) {
  const requestedAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
  resumeMetrics.xtensionControlDialogOpenRequestedAt = requestedAt;
  resumeMetrics.xtensionControlDialogLoadedAt = null;
  resumeMetrics.xtensionControlDialogOpenedAt = null;

  if (!metadata.skipAppRuntime) {
    await dispatchAppRuntimeCommand('erp.shell.openXtensionControl', { source }, {
      ...metadata,
      sourceId: 'environment.xtensionControl',
      eventName: metadata.eventName || 'xtend-command'
    });
  }

  const bootConfig = normalizeXTensionBootConfig(readXTensionBootConfig());
  const openedAt = new Date().toISOString();
  const next = markXtensionControlState({
    open: true,
    loaded: true,
    hidden: false,
    configStatus: 'loading',
    enabledCount: bootConfig.enabledCount,
    disabledCount: bootConfig.disabledCount,
    totalCount: bootConfig.totalCount,
    lastAppliedAt: openedAt,
    commandSource: source
  }, `xtension-control-open:${source}`);
  if (!next) return null;

  setText('#erp-kernel-status-line', `Kernel: XTension Teststeuerung wird ueber ${source} geladen`);

  if (!xtensionControlDialogModulePromise) {
    xtensionControlDialogModulePromise = import('./xtension-control-dialog.mjs');
  }
  const module = await xtensionControlDialogModulePromise;
  const config = await module.openXTensionControlDialog({
    xstate,
    metrics: resumeMetrics,
    reason: source,
    metadata,
    snapshot: next,
    onClose(closeSource) {
      dispatchAppRuntimeCommand('erp.shell.closeXtensionControl', { source: closeSource || 'dialog-closed' }, {
        sourceId: 'erp-xtension-control-dialog',
        eventName: 'dialog-close'
      });
      markXtensionControlState({
        open: false,
        hidden: true,
        configStatus: 'closed',
        commandSource: closeSource || 'dialog-closed'
      }, 'xtension-control-close');
      setText('#erp-kernel-status-line', 'Kernel: XTension Teststeuerung geschlossen');
    },
    onApply(appliedConfig) {
      const appliedAt = new Date().toISOString();
      window.__XTendResumeDemo.xtensionBootConfig = appliedConfig;
      dispatchAppRuntimeCommand('erp.shell.applyXtensionControl', {
        source: 'button-apply',
        enabledCount: appliedConfig.enabledCount,
        disabledCount: appliedConfig.disabledCount
      }, {
        sourceId: 'erp-xtension-control-dialog',
        eventName: 'dialog-apply'
      });
      markXtensionControlState({
        open: true,
        loaded: true,
        hidden: false,
        configStatus: 'applied',
        enabledCount: appliedConfig.enabledCount,
        disabledCount: appliedConfig.disabledCount,
        totalCount: appliedConfig.totalCount,
        lastAppliedAt: appliedAt,
        commandSource: 'button-apply'
      }, 'xtension-control-apply');
      setText('#erp-kernel-status-line', `Kernel: ${appliedConfig.enabledCount} XTensions aktiv, ${appliedConfig.disabledCount} Placeholder`);
    }
  });

  resumeMetrics.xtensionControlDialogOpenedAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
  markXtensionControlState({
    open: true,
    loaded: true,
    hidden: false,
    configStatus: 'editing',
    enabledCount: config.enabledCount,
    disabledCount: config.disabledCount,
    totalCount: config.totalCount,
    lastAppliedAt: openedAt,
    commandSource: source
  }, 'xtension-control-ready');
  setText('#erp-kernel-status-line', 'Kernel: XTension Teststeuerung bereit');
  updateSmokeMarker();
  return config;
}

function createXCommandXStateBridge() {
  return {
    get: readXState,
    set(key, value) {
      getXStateTargets().forEach((target) => writeXState(target, { [key]: value }));
    }
  };
}

async function ensureXCommandKernel() {
  if (!xcommandKernelPromise) {
    xcommandKernelPromise = import('/xcommand/xcommand.js').then(() => {
      const kernel = window.XCommand.createXCommandKernel({
        xstate: createXCommandXStateBridge(),
        fabric: {
          schedule(record) {
            window.__XTendResumeDemo.lastXCommandFabricRecord = record;
            getXStateTargets().forEach((target) => writeXState(target, {
              'erp.shell.xcommand.lastFabricRecord': clone(record)
            }));
          }
        },
        allowedActionRefs: ['erp.shell.openSurfaceInfo', 'erp.shell.openXtensionControl'],
        actionExecutor(command, dispatchResult) {
          if (command.id === 'help.rmtSurfaceInfo') {
            openSurfaceInfoFromApp('xcommand:F1', { dispatchResult }).catch((error) => {
              window.__XTendResumeDemo.lastXCommandError = error && error.message ? error.message : String(error);
              updateSmokeMarker();
            });
          }
        }
      });
      kernel.register({
        id: 'help.rmtSurfaceInfo',
        keys: 'F1',
        label: {
          i18nKey: 'erp.help.rmtSurfaceInfo',
          fallback: 'RMT Surface Info'
        },
        action: 'erp.shell.openSurfaceInfo',
        scope: 'app-shell',
        lane: 'user-blocking',
        keymap: {
          group: 'help',
          order: 10,
          visible: true
        }
      });
      window.__XTendResumeDemo.xcommandReady = true;
      window.__XTendResumeDemo.xcommandKernel = kernel;
      updateSmokeMarker();
      return kernel;
    });
  }
  return xcommandKernelPromise;
}

function dispatchF1ThroughXCommand(input = {}) {
  if (input.key && input.key !== 'F1') return;
  if (typeof input.preventDefault === 'function') input.preventDefault();
  if (typeof input.stopPropagation === 'function') input.stopPropagation();
  const strokeInput = {
    key: input.key || 'F1',
    code: input.code || 'F1',
    ctrlKey: Boolean(input.ctrlKey),
    metaKey: Boolean(input.metaKey),
    altKey: Boolean(input.altKey),
    shiftKey: Boolean(input.shiftKey),
    repeat: Boolean(input.repeat),
    timeStamp: input.timeStamp || Date.now()
  };
  ensureXCommandKernel().then((kernel) => {
    const stroke = window.XCommand.normalizeKeyboardEvent(strokeInput, { scope: 'app-shell' });
    const result = kernel.dispatch(stroke);
    window.__XTendResumeDemo.lastXCommandResult = result;
    updateSmokeMarker();
  }).catch((error) => {
    window.__XTendResumeDemo.lastXCommandError = error && error.message ? error.message : String(error);
    updateSmokeMarker();
  });
}

async function handleIntent(intent, metadata = {}) {
  if (!intent || !intent.type) return null;
  window.__XTendResumeDemo.lastIntent = intent;
  if (intent.type === 'close-menu') {
    const current = window.__XTendResumeDemo.lastSnapshot;
    const menuBar = getMenuBar(current);
    if (!menuBar.openMenuId) return null;
    if (!metadata.skipAppRuntime) {
      await dispatchAppRuntimeCommand('erp.shell.toggleMenu', { menuId: '' }, {
        ...metadata,
        sourceId: intent.sourceId || metadata.sourceId || 'erp.shell.closeMenu',
        eventName: metadata.eventName || 'xtend-command'
      });
    }
    return closeOpenMenu(intent.key === 'Escape' ? 'escape' : 'outside');
  }

  const selfDispatchingIntent = ['surface-info', 'xtension-control', 'close-xtension-control', 'apply-xtension-control'].includes(intent.type);
  if (!selfDispatchingIntent && !metadata.skipAppRuntime) {
    const runtimeCommand = appRuntimeCommandForIntent(intent);
    if (runtimeCommand) {
      await dispatchAppRuntimeCommand(runtimeCommand, appRuntimePayloadForIntent(intent), {
        ...metadata,
        sourceId: intent.sourceId || metadata.sourceId || runtimeCommand,
        eventName: metadata.eventName || 'xtend-command'
      });
    }
  }

  if (intent.type === 'surface-info') {
    dispatchF1ThroughXCommand({
      key: 'F1',
      code: 'F1',
      timeStamp: Date.now()
    });
    return { status: 'xcommand-dispatched', intent };
  }

  if (intent.type === 'xtension-control') {
    return openXtensionControlFromApp(intent.source || 'menu:Umfeld/XTension Teststeuerung', {
      ...metadata,
      commandId: intent.commandId || 'environment.xtensionControl',
      menuId: intent.menuId || 'environment'
    });
  }

  if (intent.type === 'close-xtension-control') {
    markXtensionControlState({
      open: false,
      hidden: true,
      configStatus: 'closed',
      commandSource: intent.source || 'dialog-closed'
    }, 'xtension-control-close-command');
    setText('#erp-kernel-status-line', 'Kernel: XTension Teststeuerung geschlossen');
    updateSmokeMarker();
    return { status: 'xtension-control-closed', intent };
  }

  if (intent.type === 'apply-xtension-control') {
    const bootConfig = normalizeXTensionBootConfig(readXTensionBootConfig());
    markXtensionControlState({
      open: true,
      loaded: true,
      hidden: false,
      configStatus: 'applied',
      enabledCount: bootConfig.enabledCount,
      disabledCount: bootConfig.disabledCount,
      totalCount: bootConfig.totalCount,
      lastAppliedAt: new Date().toISOString(),
      commandSource: intent.source || 'button-apply'
    }, 'xtension-control-apply-command');
    updateSmokeMarker();
    return { status: 'xtension-control-applied', bootConfig, intent };
  }

  if (intent.type === 'legacy-navigation') {
    window.__XTendResumeDemo.lastLegacyIntent = intent;
    setText('#erp-kernel-status-line', `Kernel: Legacy-Intent ${intent.linkText || intent.href || 'iWebKit'} übernommen`);
    updateSmokeMarker();
    return { status: 'legacy-intent-recorded', intent };
  }

  if (intent.type === 'toggle-menu') {
    const current = window.__XTendResumeDemo.lastSnapshot;
    if (!current) return null;
    const menuBar = getMenuBar(current);
    const nextOpenMenuId = menuBar.openMenuId === intent.menuId ? '' : intent.menuId;
    const group = (menuBar.groups || []).find((entry) => entry.id === intent.menuId);
    const next = withMenuBar(current, {
      openMenuId: nextOpenMenuId,
      lastCommand: nextOpenMenuId && group ? `Menü ${group.label} geöffnet` : 'Menü geschlossen'
    });
    window.__XTendResumeDemo.lastSnapshot = next;
    window.__XTendResumeDemo.lastIntent = intent;
    applyMenuDom(next.menuBar);
    mirrorSnapshotToXState(next, 'toggle-menu');
    setText('#erp-kernel-status-line', nextOpenMenuId && group
      ? `Kernel: Menü ${group.label} in XState gespiegelt`
      : 'Kernel: Menüband geschlossen');
    updateSmokeMarker();
    return next;
  }

  if (intent.type === 'select-menu-command') {
    const current = window.__XTendResumeDemo.lastSnapshot;
    if (!current) return null;
    const menuBar = getMenuBar(current);
    const found = findMenuCommand(menuBar, intent.commandId);
    if (!found) return null;
    const next = withMenuBar(current, {
      openMenuId: '',
      selectedCommandId: found.command.id,
      selectedCommandLabel: found.command.label,
      lastCommand: `${found.group.label}: ${found.command.label}`
    });
    window.__XTendResumeDemo.lastSnapshot = next;
    window.__XTendResumeDemo.lastIntent = intent;
    applyMenuDom(next.menuBar);
    mirrorSnapshotToXState(next, 'select-menu-command');
    setText('#erp-kernel-status-line', `Kernel: Menübefehl ${found.command.label} übernommen`);
    updateSmokeMarker();
    if (found.command.id === 'help.rmtSurfaceInfo') {
      await openSurfaceInfoFromApp('menu:Hilfe/RMT Surface Info', {
        commandId: found.command.id,
        menuId: found.group.id
      });
    }
    if (found.command.id === 'environment.xtensionControl') {
      await openXtensionControlFromApp('menu:Umfeld/XTension Teststeuerung', {
        commandId: found.command.id,
        menuId: found.group.id
      });
    }
    return next;
  }

  if (intent.type === 'select-process') {
    const current = window.__XTendResumeDemo.lastSnapshot;
    if (!current) return null;
    const process = current.processes.find((entry) => entry.id === intent.processId);
    if (!process) return null;
    const next = {
      ...current,
      activeProcessId: process.id,
      appState: {
        ...(current.appState || {}),
        activeProcessId: process.id
      }
    };
    window.__XTendResumeDemo.lastSnapshot = next;
    window.__XTendResumeDemo.lastIntent = intent;
    mirrorSnapshotToXState(next, 'select-process');
    await updateXTensions(next, {
      only: ['vue-process-sidebar'],
      reason: 'select-process',
      intent
    });
    setText('#erp-kernel-status-line', `Kernel: Prozess ${process.name} uebernommen`);
    updateSmokeMarker();
    return next;
  }

  if (intent.type === 'select-ledger-item') {
    const current = window.__XTendResumeDemo.lastSnapshot;
    if (!current) return null;
    const item = current.ledger.items.find((entry) => entry.id === intent.ledgerId);
    if (!item) return null;
    const next = {
      ...current,
      appState: {
        ...(current.appState || {}),
        selectedLedgerItemId: item.id
      }
    };
    window.__XTendResumeDemo.lastSnapshot = next;
    window.__XTendResumeDemo.lastIntent = intent;
    mirrorSnapshotToXState(next, 'select-ledger-item');
    await updateXTensions(next, {
      only: ['react-ledger-panel'],
      reason: 'select-ledger-item',
      intent
    });
    setText('#erp-kernel-status-line', `Kernel: Beleg ${item.id} im React-Surface markiert`);
    updateSmokeMarker();
    return next;
  }

  if (intent.type === 'inspect-sla-cell') {
    const current = window.__XTendResumeDemo.lastSnapshot;
    if (!current || !current.loadLab) return null;
    const cell = current.loadLab.kpiMatrix.find((entry) => entry.id === intent.kpiId);
    if (!cell) return null;
    const next = {
      ...current,
      appState: {
        ...(current.appState || {}),
        selectedKpiId: cell.id
      }
    };
    window.__XTendResumeDemo.lastSnapshot = next;
    window.__XTendResumeDemo.lastIntent = intent;
    mirrorSnapshotToXState(next, 'inspect-sla-cell');
    await updateXTensions(next, {
      only: ['react-sla-matrix'],
      reason: 'inspect-sla-cell',
      intent
    });
    setText('#erp-kernel-status-line', `Kernel: KPI ${cell.metric} fuer ${cell.processName} markiert`);
    updateSmokeMarker();
    return next;
  }

  if (intent.type === 'inspect-exception') {
    const current = window.__XTendResumeDemo.lastSnapshot;
    if (!current || !current.loadLab) return null;
    const exception = current.loadLab.exceptionQueue.find((entry) => entry.id === intent.exceptionId);
    if (!exception) return null;
    const next = {
      ...current,
      appState: {
        ...(current.appState || {}),
        selectedExceptionId: exception.id
      }
    };
    window.__XTendResumeDemo.lastSnapshot = next;
    window.__XTendResumeDemo.lastIntent = intent;
    mirrorSnapshotToXState(next, 'inspect-exception');
    await updateXTensions(next, {
      only: ['vue-exception-queue'],
      reason: 'inspect-exception',
      intent
    });
    setText('#erp-kernel-status-line', `Kernel: Exception ${exception.code} im Vue-Surface markiert`);
    updateSmokeMarker();
    return next;
  }

  if (intent.type === 'inspect-openui5-order') {
    const current = window.__XTendResumeDemo.lastSnapshot;
    if (!current || !current.loadLab) return null;
    const order = (current.loadLab.openUi5Procurement || []).find((entry) => entry.id === intent.orderId);
    if (!order) return null;
    const next = {
      ...current,
      appState: {
        ...(current.appState || {}),
        selectedOpenUi5OrderId: order.id
      }
    };
    window.__XTendResumeDemo.lastSnapshot = next;
    window.__XTendResumeDemo.lastIntent = intent;
    mirrorSnapshotToXState(next, 'inspect-openui5-order');
    await updateXTensions(next, {
      only: ['openui5-procurement-worklist'],
      reason: 'inspect-openui5-order',
      intent
    });
    setText('#erp-kernel-status-line', `Kernel: OpenUI5-Bestellung ${order.id} markiert`);
    updateSmokeMarker();
    return next;
  }

  if (intent.type === 'inspect-angular-risk') {
    const current = window.__XTendResumeDemo.lastSnapshot;
    if (!current || !current.loadLab) return null;
    const risk = (current.loadLab.angularRiskWorkbench || []).find((entry) => entry.id === intent.riskId);
    if (!risk) return null;
    const next = {
      ...current,
      appState: {
        ...(current.appState || {}),
        selectedAngularRiskId: risk.id
      }
    };
    window.__XTendResumeDemo.lastSnapshot = next;
    window.__XTendResumeDemo.lastIntent = intent;
    mirrorSnapshotToXState(next, 'inspect-angular-risk');
    await updateXTensions(next, {
      only: ['angular-risk-workbench'],
      reason: 'inspect-angular-risk',
      intent
    });
    setText('#erp-kernel-status-line', `Kernel: Angular-Risiko ${risk.id} markiert`);
    updateSmokeMarker();
    return next;
  }

  if (intent.type === 'reseed') {
    const response = await fetch('/api/erp/reseed', { method: 'POST' });
    const next = await response.json();
    window.__XTendResumeDemo.lastSnapshot = next;
    window.__XTendResumeDemo.lastIntent = intent;
    updateShell(next);
    mirrorSnapshotToXState(next, 'reseed');
    await updateXTensions(next, {
      reason: 'reseed',
      intent
    });
    setText('#erp-kernel-status-line', `Kernel: ${next.seed} aktualisiert`);
    updateSmokeMarker();
    return next;
  }

  return null;
}

async function handleShellCommand(commandPayload = {}, metadata = {}) {
  const normalizedPayload = normalizeCommandPayload(commandPayload);
  const intent = intentFromCommand(normalizedPayload.command, normalizedPayload);
  if (!intent) return { status: 'skipped', reason: 'unknown-command', payload: normalizedPayload };
  if (!xtensionsMounted && !metadata.replayed) {
    intentQueue.push({ intent, metadata: clone(metadata) });
    window.__XTendResumeDemo.lastQueuedCommand = intent;
    updateSmokeMarker();
    return { status: 'queued', intent };
  }
  const result = await handleIntent(intent, metadata);
  return { status: 'success', intent, result };
}

async function replayIntentQueue() {
  const queued = intentQueue.splice(0, intentQueue.length);
  for (const entry of queued) {
    const intent = entry && entry.intent || entry;
    const metadata = entry && entry.metadata || {};
    await handleIntent(intent, { ...metadata, replayed: true });
  }
}

function attachShellCommandRuntime() {
  if (shellCommandRuntime) return shellCommandAttachReport;
  const shell = document.getElementById('erp-shell');
  if (!shell) return null;
  shellCommandRuntime = createRmtEventRoutingRuntime({
    root: shell,
    targets: {
      '#erp-shell': shell,
      document
    },
    events: [
      {
        id: 'erp.shell.command.click',
        event: 'click',
        target: '#erp-shell',
        closest: '[data-xtend-command]',
        action: 'erp.shell.routeCommand',
        payload: {
          command: '$source.dataset.xtendCommand',
          processId: '$source.dataset.processId',
          ledgerId: '$source.dataset.ledgerId',
          kpiId: '$source.dataset.kpiId',
          exceptionId: '$source.dataset.exceptionId',
          orderId: '$source.dataset.orderId',
          riskId: '$source.dataset.riskId',
          menuId: '$source.dataset.menuId',
          commandId: '$source.dataset.commandId',
          commandLabel: '$source.dataset.commandLabel',
          source: '$source.dataset.source',
          enabledCount: '$source.dataset.enabledCount',
          disabledCount: '$source.dataset.disabledCount',
          seed: '$source.dataset.seed',
          sourceId: '$source.id'
        },
        governance: {
          preventDefault: true,
          stopPropagation: true
        }
      },
      {
        id: 'erp.shell.command.custom',
        event: 'xtend-command',
        target: '#erp-shell',
        action: 'erp.shell.routeCommand',
        payload: '$detail'
      },
      {
        id: 'erp.shell.command.outside-click',
        event: 'click',
        target: 'document',
        action: 'erp.shell.routeCommand',
        payload: {
          command: 'erp.shell.closeMenu',
          sourceId: 'document-click'
        }
      },
      {
        id: 'erp.shell.command.escape',
        event: 'keydown',
        target: 'document',
        action: 'erp.shell.routeCommand',
        condition: {
          left: '$event.key',
          op: 'equals',
          right: 'Escape'
        },
        payload: {
          command: 'erp.shell.closeMenu',
          key: '$event.key',
          sourceId: 'document-keydown'
        }
      },
      {
        id: 'erp.shell.command.f1',
        event: 'keydown',
        target: 'document',
        action: 'erp.shell.routeCommand',
        condition: {
          left: '$event.key',
          op: 'equals',
          right: 'F1'
        },
        payload: {
          command: 'help.rmtSurfaceInfo',
          key: '$event.key',
          sourceId: 'document-keydown'
        },
        governance: {
          preventDefault: true,
          stopPropagation: true
        }
      }
    ],
    actionRuntime: {
      dispatchCommand(commandEnvelope, metadata = {}) {
        return handleShellCommand(commandEnvelope && commandEnvelope.payload || {}, {
          ...metadata,
          commandEnvelope,
          correlationId: commandEnvelope && commandEnvelope.correlationId,
          lane: commandEnvelope && commandEnvelope.lane
        });
      }
    },
    diagnosticsHub: {
      publish(_channel, diagnostic) {
        window.__XTendResumeDemo.shellCommandDiagnostics.push(diagnostic);
        window.__XTendResumeDemo.shellCommandDiagnostics.splice(0, Math.max(0, window.__XTendResumeDemo.shellCommandDiagnostics.length - 30));
      }
    }
  });
  shellCommandAttachReport = shellCommandRuntime.attach(shell);
  window.__XTendResumeDemo.shellCommandRuntime = shellCommandRuntime;
  window.__XTendResumeDemo.shellCommandAttachReport = shellCommandAttachReport;
  updateSmokeMarker();
  return shellCommandAttachReport;
}

async function closeOpenMenu(reason) {
  const current = window.__XTendResumeDemo.lastSnapshot;
  if (!current) return null;
  const menuBar = getMenuBar(current);
  if (!menuBar.openMenuId) return null;
  const next = withMenuBar(current, {
    openMenuId: '',
    lastCommand: reason === 'escape' ? 'Menü über Escape geschlossen' : menuBar.lastCommand
  });
  window.__XTendResumeDemo.lastSnapshot = next;
  applyMenuDom(next.menuBar);
  mirrorSnapshotToXState(next, reason === 'escape' ? 'close-menu-escape' : 'close-menu-outside');
  updateSmokeMarker();
  return next;
}

async function handleMaracaBoot(event) {
  if (maracaBootHandled) return;
  maracaBootHandled = true;
  resumeMetrics.maracaBootAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
  window.__XTendResumeDemo.maracaBoot = event && event.detail || window.__XTendMaracaResult || null;
  setText('#erp-kernel-status-line', 'Kernel: Maraca-Orchestrierung aktiv');
  if (window.__XTendResumeDemo.lastSnapshot) {
    mirrorSnapshotToXState(window.__XTendResumeDemo.lastSnapshot, 'maraca-boot');
  }
  if (payload) {
    const maracaResult = event && event.detail || window.__XTendMaracaResult || {};
    const resumeResult = maracaResult.resume || maracaResult.hydration && maracaResult.hydration.resume;
    if (resumeResult && resumeResult.status === 'resumed') {
      xtensionsMounted = true;
      window.__XTendResumeDemo.xtensionsMounted = true;
      window.__XTendResumeDemo.resumeResult = resumeResult;
    } else if (resumeResult && resumeResult.status === 'fallback_hydrated') {
      await mountXTensions(payload);
      xtensionsMounted = true;
      window.__XTendResumeDemo.xtensionsMounted = true;
      await replayIntentQueue();
    }
    resumeMetrics.xtensionsMountedAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }
  updateSmokeMarker();
  const repeatBootRequested = new URL(window.location.href).searchParams.get('repeat_boot') === '1';
  if (repeatBootRequested && !repeatMaracaBootHandled && window.XTendMaraca && typeof window.XTendMaraca.boot === 'function') {
    repeatMaracaBootHandled = true;
    window.__XTendResumeDemo.repeatBootResult = await window.XTendMaraca.boot(window.__XTendMaracaAutoBootOptions());
    updateSmokeMarker();
  }
}

document.addEventListener('xtend-maraca:boot', handleMaracaBoot, { once: true });
window.addEventListener('xtend-maraca:boot', handleMaracaBoot, { once: true });

document.addEventListener('erp-demo:xtensions-updated', updateSmokeMarker);
document.addEventListener('erp-demo:surface-info-opened', updateSmokeMarker);
document.addEventListener('erp-demo:surface-info-closed', updateSmokeMarker);
document.addEventListener('erp-demo:xtension-control-opened', updateSmokeMarker);
document.addEventListener('erp-demo:xtension-control-closed', updateSmokeMarker);
document.addEventListener('erp-demo:xtension-control-applied', updateSmokeMarker);
document.addEventListener('DOMContentLoaded', () => {
  resumeMetrics.domContentLoadedAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
  attachShellCommandRuntime();
  updateSmokeMarker();
}, { once: true });

attachShellCommandRuntime();

if (window.__XTendResumeDemo.lastSnapshot) {
  mirrorSnapshotToXState(window.__XTendResumeDemo.lastSnapshot, 'server-resume');
  applyMenuDom(window.__XTendResumeDemo.lastSnapshot.menuBar);
}
