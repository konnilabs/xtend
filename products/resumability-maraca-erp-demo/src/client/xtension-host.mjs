const controllers = new Map();
const lifecycle = [];
const frameSubscribers = new Map();
let frameHandle = 0;

export const XTENSION_BOOT_STORAGE_KEY = 'xtend.erp.demo.xtension.boot.v1';

export const XTENSION_DEFINITIONS = [
  { key: 'react-ledger-panel', label: 'React Ledger Panel', framework: 'react' },
  { key: 'react-sla-matrix', label: 'React SLA Matrix', framework: 'react' },
  { key: 'vue-process-sidebar', label: 'Vue Process Sidebar', framework: 'vue' },
  { key: 'vue-exception-queue', label: 'Vue Exception Queue', framework: 'vue' },
  { key: 'three-material-flow-scene', label: 'Three Material Flow', framework: 'three' },
  { key: 'vanilla-legacy-lab', label: 'Vanilla Legacy Lab', framework: 'vanilla' },
  { key: 'openui5-procurement-worklist', label: 'OpenUI5 Procurement Worklist', framework: 'openui5' },
  { key: 'angular-risk-workbench', label: 'Angular Risk Workbench', framework: 'angular' }
];

const FRAMEWORK_RUNTIME_PROVIDERS = {
  react: [
    {
      module: '/dist/xtensions/frameworks/react/index.mjs',
      exports: ['default']
    },
    {
      module: '/dist/xtensions/frameworks/react-dom/client.mjs',
      exports: ['createRoot', 'hydrateRoot']
    }
  ],
  vue: [
    {
      module: '/dist/xtensions/frameworks/vue/index.mjs',
      exports: ['createApp', 'createSSRApp', 'h', 'reactive']
    }
  ]
};

const KNOWN_XTENSION_KEYS = new Set(XTENSION_DEFINITIONS.map((entry) => entry.key));
const runtimeProviderCache = new Map();

function record(framework, operation, status, metadata = {}) {
  const entry = {
    schema: 'xtend.local.resumability-maraca-erp-demo.xtension-lifecycle.v1',
    framework,
    operation,
    status,
    metadata,
    timestamp: new Date().toISOString()
  };
  lifecycle.push(entry);
  return entry;
}

function normalizeStatus(status) {
  return status === 'ok' ? 'active' : status;
}

async function ensureFrameworkRuntime(framework) {
  const providers = FRAMEWORK_RUNTIME_PROVIDERS[framework];
  if (!providers) {
    return {
      ok: true,
      status: 'not-required',
      framework,
      modules: []
    };
  }
  if (runtimeProviderCache.has(framework)) return runtimeProviderCache.get(framework);

  const result = {
    schema: 'xtend.local.resumability-maraca-erp-demo.framework-runtime-provider.v1',
    ok: true,
    status: 'ready',
    framework,
    modules: [],
    diagnostics: []
  };

  for (const provider of providers) {
    try {
      const module = await import(provider.module);
      const missingExports = provider.exports.filter((name) => !(name in module));
      result.modules.push({
        module: provider.module,
        ok: missingExports.length === 0,
        missingExports
      });
      if (missingExports.length > 0) {
        result.ok = false;
        result.status = 'missing-export';
        result.diagnostics.push({
          module: provider.module,
          missingExports
        });
      }
    } catch (error) {
      result.ok = false;
      result.status = 'missing-provider';
      result.modules.push({
        module: provider.module,
        ok: false,
        missingExports: provider.exports.slice()
      });
      result.diagnostics.push({
        module: provider.module,
        message: error && error.message ? error.message : String(error)
      });
    }
  }

  runtimeProviderCache.set(framework, result);
  return result;
}

export function normalizeXTensionBootConfig(value = {}) {
  const allKeys = XTENSION_DEFINITIONS.map((entry) => entry.key);
  let enabledKeys = allKeys.slice();
  if (Array.isArray(value.enabledKeys)) {
    enabledKeys = value.enabledKeys.filter((key) => KNOWN_XTENSION_KEYS.has(key));
  } else if (value.enabled && typeof value.enabled === 'object') {
    enabledKeys = allKeys.filter((key) => value.enabled[key] !== false);
  } else if (Array.isArray(value.disabledKeys)) {
    const disabled = new Set(value.disabledKeys.filter((key) => KNOWN_XTENSION_KEYS.has(key)));
    enabledKeys = allKeys.filter((key) => !disabled.has(key));
  }
  const enabled = new Set(enabledKeys);
  const disabledKeys = allKeys.filter((key) => !enabled.has(key));
  return {
    schema: 'xtend.local.resumability-maraca-erp-demo.xtension-boot-config.v1',
    storageKey: XTENSION_BOOT_STORAGE_KEY,
    enabledKeys,
    disabledKeys,
    enabled: Object.fromEntries(allKeys.map((key) => [key, enabled.has(key)])),
    enabledCount: enabledKeys.length,
    disabledCount: disabledKeys.length,
    totalCount: allKeys.length,
    updatedAt: value.updatedAt || ''
  };
}

export function readXTensionBootConfig() {
  if (typeof window === 'undefined' || !window.localStorage) return normalizeXTensionBootConfig();
  try {
    const raw = window.localStorage.getItem(XTENSION_BOOT_STORAGE_KEY);
    return normalizeXTensionBootConfig(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeXTensionBootConfig();
  }
}

export function writeXTensionBootConfig(value = {}) {
  const config = normalizeXTensionBootConfig({
    ...value,
    updatedAt: new Date().toISOString()
  });
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(XTENSION_BOOT_STORAGE_KEY, JSON.stringify(config));
  }
  if (typeof window !== 'undefined' && window.__XTendResumeDemo) {
    window.__XTendResumeDemo.xtensionBootConfig = config;
  }
  return config;
}

function isXTensionEnabled(config, key) {
  return !config || !config.enabled || config.enabled[key] !== false;
}

function cacheSlotPlaceholder(slot) {
  if (!slot || slot.__xtendServerPlaceholderHtml !== undefined) return;
  slot.__xtendServerPlaceholderHtml = slot.innerHTML;
}

function restoreSlotPlaceholder(slot) {
  if (!slot) return;
  if (slot.__xtendServerPlaceholderHtml !== undefined) {
    slot.innerHTML = slot.__xtendServerPlaceholderHtml;
  }
}

function markSlotDisabled(spec, reason = 'local-storage') {
  const slot = document.querySelector(spec.slotSelector);
  if (!slot) {
    record(spec.framework, 'mount', 'missing-slot', { key: spec.key, reason });
    return null;
  }
  cacheSlotPlaceholder(slot);
  restoreSlotPlaceholder(slot);
  slot.dataset.xtensionStatus = 'disabled';
  slot.dataset.xtensionBoot = 'disabled';
  slot.dataset.xtensionFramework = spec.framework;
  slot.dataset.xtensionDisabledReason = reason;
  slot.setAttribute('aria-disabled', 'true');
  record(spec.framework, 'mount', 'disabled', { key: spec.key, reason });
  return null;
}

function dispatchUpdate() {
  document.dispatchEvent(new CustomEvent('erp-demo:xtensions-updated', {
    detail: {
      lifecycle: lifecycle.slice()
    }
  }));
}

function startFrameLoop() {
  if (frameHandle || typeof window.requestAnimationFrame !== 'function') return;
  frameHandle = window.requestAnimationFrame(tickFrameControllers);
}

function stopFrameLoop() {
  if (!frameHandle || typeof window.cancelAnimationFrame !== 'function') return;
  window.cancelAnimationFrame(frameHandle);
  frameHandle = 0;
}

function tickFrameControllers(now) {
  frameHandle = 0;
  if (document.visibilityState === 'hidden') {
    if (frameSubscribers.size) startFrameLoop();
    return;
  }

  for (const [key, entry] of frameSubscribers) {
    if (!entry || !entry.controller || typeof entry.controller.renderFrame !== 'function') continue;
    try {
      entry.controller.renderFrame({
        now,
        frameBudgetMs: entry.frameBudgetMs,
        reason: 'host-frame-scheduler'
      });
    } catch (error) {
      frameSubscribers.delete(key);
      record(entry.framework, 'frame', 'degraded', {
        key,
        message: error && error.message ? error.message : String(error)
      });
    }
  }

  if (frameSubscribers.size) startFrameLoop();
}

function registerFrameController(key, framework, controller, props) {
  if (!controller || typeof controller.renderFrame !== 'function') return;
  frameSubscribers.set(key, {
    framework,
    controller,
    frameBudgetMs: props && props.frameBudget && props.frameBudget.targetMs || 16.67
  });
  startFrameLoop();
}

function updateFrameController(key, props) {
  const entry = frameSubscribers.get(key);
  if (!entry) return;
  entry.frameBudgetMs = props && props.frameBudget && props.frameBudget.targetMs || entry.frameBudgetMs || 16.67;
}

function unregisterFrameController(key) {
  frameSubscribers.delete(key);
  if (!frameSubscribers.size) stopFrameLoop();
}

function propsForReact(snapshot) {
  return {
    seed: snapshot.seed,
    company: snapshot.company,
    fiscalPeriod: snapshot.fiscalPeriod,
    currency: snapshot.currency,
    ledger: snapshot.ledger,
    auditTrail: snapshot.auditTrail,
    selectedLedgerItemId: snapshot.appState && snapshot.appState.selectedLedgerItemId || ''
  };
}

function propsForReactSla(snapshot) {
  return {
    seed: snapshot.seed,
    company: snapshot.company,
    fiscalPeriod: snapshot.fiscalPeriod,
    processes: snapshot.processes,
    systemLoad: snapshot.systemLoad,
    loadLab: snapshot.loadLab,
    selectedKpiId: snapshot.appState && snapshot.appState.selectedKpiId || ''
  };
}

function propsForVue(snapshot) {
  return {
    seed: snapshot.seed,
    activeProcessId: snapshot.activeProcessId,
    processes: snapshot.processes,
    systemLoad: snapshot.systemLoad,
    processLatencyMs: snapshot.processLatencyMs
  };
}

function propsForVueException(snapshot) {
  return {
    seed: snapshot.seed,
    activeProcessId: snapshot.activeProcessId,
    exceptionQueue: snapshot.loadLab && snapshot.loadLab.exceptionQueue || [],
    schedulerLanes: snapshot.loadLab && snapshot.loadLab.schedulerLanes || [],
    selectedExceptionId: snapshot.appState && snapshot.appState.selectedExceptionId || ''
  };
}

function propsForThree(snapshot) {
  return {
    seed: snapshot.seed,
    materialFlow: snapshot.loadLab && snapshot.loadLab.materialFlow || [],
    schedulerLanes: snapshot.loadLab && snapshot.loadLab.schedulerLanes || [],
    frameBudget: snapshot.loadLab && snapshot.loadLab.frameBudget || { targetMs: 16.67 },
    throughput: snapshot.loadLab && snapshot.loadLab.throughput || {},
    systemLoad: snapshot.systemLoad
  };
}

function propsForVanilla(snapshot) {
  return {
    seed: snapshot.seed,
    company: snapshot.company,
    activeProcessId: snapshot.activeProcessId,
    exceptionQueue: snapshot.loadLab && snapshot.loadLab.exceptionQueue || [],
    schedulerLanes: snapshot.loadLab && snapshot.loadLab.schedulerLanes || [],
    throughput: snapshot.loadLab && snapshot.loadLab.throughput || {},
    systemLoad: snapshot.systemLoad
  };
}

function propsForOpenUi5(snapshot) {
  return {
    seed: snapshot.seed,
    company: snapshot.company,
    fiscalPeriod: snapshot.fiscalPeriod,
    currency: snapshot.currency,
    orders: snapshot.loadLab && snapshot.loadLab.openUi5Procurement || [],
    selectedOrderId: snapshot.appState && snapshot.appState.selectedOpenUi5OrderId || ''
  };
}

function propsForAngular(snapshot) {
  return {
    seed: snapshot.seed,
    company: snapshot.company,
    fiscalPeriod: snapshot.fiscalPeriod,
    currency: snapshot.currency,
    risks: snapshot.loadLab && snapshot.loadLab.angularRiskWorkbench || [],
    selectedRiskId: snapshot.appState && snapshot.appState.selectedAngularRiskId || ''
  };
}

function getMountSpecs(snapshot) {
  return [
    {
      key: 'react-ledger-panel',
      framework: 'react',
      slotSelector: '[data-xtension-slot="react-ledger-panel"]',
      moduleUrl: '/dist/xtensions/react-ledger-panel/index.mjs',
      exportName: 'createReactLedgerPanel',
      props: propsForReact(snapshot),
      toProps: propsForReact
    },
    {
      key: 'react-sla-matrix',
      framework: 'react',
      slotSelector: '[data-xtension-slot="react-sla-matrix"]',
      moduleUrl: '/dist/xtensions/react-sla-matrix/index.mjs',
      exportName: 'createReactSlaMatrix',
      props: propsForReactSla(snapshot),
      toProps: propsForReactSla
    },
    {
      key: 'vue-process-sidebar',
      framework: 'vue',
      slotSelector: '[data-xtension-slot="vue-process-sidebar"]',
      moduleUrl: '/dist/xtensions/vue-process-sidebar/index.mjs',
      exportName: 'createVueProcessSidebar',
      props: propsForVue(snapshot),
      toProps: propsForVue
    },
    {
      key: 'vue-exception-queue',
      framework: 'vue',
      slotSelector: '[data-xtension-slot="vue-exception-queue"]',
      moduleUrl: '/dist/xtensions/vue-exception-queue/index.mjs',
      exportName: 'createVueExceptionQueue',
      props: propsForVueException(snapshot),
      toProps: propsForVueException
    },
    {
      key: 'three-material-flow-scene',
      framework: 'three',
      slotSelector: '[data-xtension-slot="three-material-flow-scene"]',
      moduleUrl: '/dist/xtensions/three-material-flow-scene/index.mjs',
      exportName: 'createThreeMaterialFlowScene',
      props: propsForThree(snapshot),
      toProps: propsForThree
    },
    {
      key: 'vanilla-legacy-lab',
      framework: 'vanilla',
      slotSelector: '[data-xtension-slot="vanilla-legacy-lab"]',
      moduleUrl: '/dist/xtensions/vanilla-legacy-lab/index.mjs',
      exportName: 'createVanillaLegacyLab',
      props: propsForVanilla(snapshot),
      toProps: propsForVanilla
    },
    {
      key: 'openui5-procurement-worklist',
      framework: 'openui5',
      slotSelector: '[data-xtension-slot="openui5-procurement-worklist"]',
      moduleUrl: '/dist/xtensions/openui5-procurement-worklist/index.mjs',
      exportName: 'createOpenUi5ProcurementWorklist',
      props: propsForOpenUi5(snapshot),
      toProps: propsForOpenUi5
    },
    {
      key: 'angular-risk-workbench',
      framework: 'angular',
      slotSelector: '[data-xtension-slot="angular-risk-workbench"]',
      moduleUrl: '/dist/xtensions/angular-risk-workbench/index.mjs',
      exportName: 'createAngularRiskWorkbench',
      props: propsForAngular(snapshot),
      toProps: propsForAngular
    }
  ];
}

async function mountOne({ key, framework, slotSelector, moduleUrl, exportName, props }) {
  const slot = document.querySelector(slotSelector);
  if (!slot) {
    record(framework, 'mount', 'missing-slot', { key, slotSelector });
    return null;
  }
  cacheSlotPlaceholder(slot);
  slot.dataset.xtensionBoot = 'enabled';
  slot.removeAttribute('aria-disabled');
  try {
    const runtimeProvider = await ensureFrameworkRuntime(framework);
    slot.dataset.xtensionRuntimeProvider = runtimeProvider.status;
    if (!runtimeProvider.ok) {
      const missing = runtimeProvider.diagnostics
        .map((diagnostic) => diagnostic.module || diagnostic.message)
        .filter(Boolean)
        .join(', ');
      throw new Error(`Missing host-provided ${framework} runtime provider${missing ? `: ${missing}` : ''}`);
    }
    const module = await import(moduleUrl);
    const factory = module[exportName];
    if (typeof factory !== 'function') throw new Error(`Missing export ${exportName}`);
    const controller = factory({
      hostId: 'xtend-local-erp-demo',
      surfaceId: key,
      emit(eventName, detail) {
        document.dispatchEvent(new CustomEvent(eventName, { detail }));
      }
    });
    const result = await Promise.resolve(controller.mount(slot, props, {
      resumeMode: 'server_prerender_resume'
    }));
    controllers.set(key, { framework, controller, props, slot, runtimeProvider });
    registerFrameController(key, framework, controller, props);
    slot.dataset.xtensionStatus = result && result.status || 'mounted';
    record(framework, 'mount', slot.dataset.xtensionStatus, { key, runtimeProvider: runtimeProvider.status });
    dispatchUpdate();
    return controller;
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (!slot.dataset.xtensionRuntimeProvider) slot.dataset.xtensionRuntimeProvider = 'failed';
    slot.dataset.xtensionStatus = 'degraded';
    slot.dataset.xtensionError = message;
    slot.innerHTML = `<div class="erp-native-fallback">${framework} XTension unavailable</div>`;
    record(framework, 'mount', 'degraded', {
      key,
      message
    });
    dispatchUpdate();
    return null;
  }
}

async function adoptOne(spec, generation) {
  const { key, framework, slotSelector, moduleUrl, exportName, props } = spec;
  const slot = document.querySelector(slotSelector);
  if (!slot) return { ok: false, status: 'rejected', xtensionId: `xtension.erp.${key}`, reason: 'missing-slot' };
  const before = slot;
  try {
    const runtimeProvider = await ensureFrameworkRuntime(framework);
    if (!runtimeProvider.ok) throw new Error(`Missing host-provided ${framework} runtime provider`);
    slot.dataset.xtensionRuntimeProvider = runtimeProvider.status || 'ready';
    const module = await import(moduleUrl);
    const factory = module[exportName];
    if (typeof factory !== 'function') throw new Error(`Missing export ${exportName}`);
    const controller = factory({
      hostId: 'xtend-local-erp-demo',
      surfaceId: key,
      emit(eventName, detail) {
        document.dispatchEvent(new CustomEvent(eventName, { detail }));
      }
    });
    if (typeof controller.adopt !== 'function') throw new Error(`XTension ${key} does not implement adopt()`);
    const result = await Promise.resolve(controller.adopt(slot, props, {
      schema: 'xtend.xtensions.resume-adapter.v1',
      generation,
      resumeMode: 'server_prerender_resume'
    }));
    if (!result || !['resumed', 'dom_hydrated', 'host_activated'].includes(result.status)) {
      throw new Error(`XTension ${key} returned invalid adoption status`);
    }
    controllers.set(key, { framework, controller, props, slot, runtimeProvider });
    registerFrameController(key, framework, controller, props);
    slot.dataset.xtensionStatus = 'resumed';
    slot.dataset.xtensionAdoption = result.status;
    slot.dataset.xtensionGeneration = generation;
    record(framework, 'adopt', 'resumed', { key, strategy: result.status, generation });
    return {
      ok: true,
      status: result.status,
      xtensionId: `xtension.erp.${key}`,
      generation,
      nodeIdentityPreserved: before === slot
    };
  } catch (error) {
    slot.dataset.xtensionStatus = 'rejected';
    slot.dataset.xtensionError = error && error.message ? error.message : String(error);
    record(framework, 'adopt', 'rejected', { key, generation, message: error && error.message ? error.message : String(error) });
    return { ok: false, status: 'rejected', xtensionId: `xtension.erp.${key}`, generation };
  }
}

export function createXTensionResumeAdopters(payload) {
  const snapshot = payload && payload.snapshot;
  const adopters = {};
  if (!snapshot) return adopters;
  for (const spec of getMountSpecs(snapshot)) {
    adopters[`xtension.erp.${spec.key}`] = ({ generation }) => adoptOne(spec, generation);
  }
  return adopters;
}

export async function mountXTensions(payload, options = {}) {
  const snapshot = payload && payload.snapshot;
  if (!snapshot) return [];
  const bootConfig = normalizeXTensionBootConfig(options.bootConfig || readXTensionBootConfig());
  if (typeof window !== 'undefined' && window.__XTendResumeDemo) {
    window.__XTendResumeDemo.xtensionBootConfig = bootConfig;
  }
  const specs = getMountSpecs(snapshot);
  const mounts = await Promise.all(specs.map((spec) => (
    isXTensionEnabled(bootConfig, spec.key)
      ? mountOne(spec)
      : Promise.resolve(markSlotDisabled(spec, 'local-storage'))
  )));
  window.__XTendResumeDemoXTensions = {
    controllers,
    lifecycle,
    frameSubscribers,
    mounted: mounts.filter(Boolean).length,
    bootConfig
  };
  dispatchUpdate();
  return mounts;
}

function toKeySet(value) {
  if (!value) return null;
  return new Set(Array.isArray(value) ? value : [value]);
}

export async function updateXTensions(snapshot, options = {}) {
  const specs = getMountSpecs(snapshot).map((spec) => [spec.key, spec.framework, spec.toProps, spec]);
  const bootConfig = normalizeXTensionBootConfig(options.bootConfig || readXTensionBootConfig());
  const only = toKeySet(options.only);
  const except = toKeySet(options.except) || new Set();
  const reason = options.reason || 'resume-intent';
  const updates = specs.map(async ([key, framework, toProps, spec]) => {
    if (only && !only.has(key)) return;
    if (except.has(key)) return;
    if (!isXTensionEnabled(bootConfig, key)) {
      markSlotDisabled(spec, 'local-storage');
      return;
    }
    const entry = controllers.get(key);
    if (!entry) return;
    const props = toProps(snapshot);
    try {
      const result = await Promise.resolve(entry.controller.update({
        props,
        reason,
        intent: options.intent || null
      }));
      entry.props = props;
      updateFrameController(key, props);
      record(framework, 'update', result && result.status || 'ok', { key, seed: snapshot.seed, reason });
    } catch (error) {
      if (entry.slot) entry.slot.dataset.xtensionStatus = 'degraded';
      unregisterFrameController(key);
      record(framework, 'update', 'degraded', {
        key,
        seed: snapshot.seed,
        reason,
        message: error && error.message ? error.message : String(error)
      });
    }
  });
  await Promise.all(updates);
  dispatchUpdate();
}

export async function unmountXTension(key, reason = 'boot-config') {
  const entry = controllers.get(key);
  if (!entry) return { status: 'missing', key };
  unregisterFrameController(key);
  try {
    if (entry.controller && typeof entry.controller.unmount === 'function') {
      await Promise.resolve(entry.controller.unmount(reason));
    }
    controllers.delete(key);
    record(entry.framework, 'unmount', 'ok', { key, reason });
    return { status: 'ok', key };
  } catch (error) {
    controllers.delete(key);
    record(entry.framework, 'unmount', 'degraded', {
      key,
      reason,
      message: error && error.message ? error.message : String(error)
    });
    return { status: 'degraded', key };
  }
}

export async function applyXTensionBootConfig(snapshot, configValue = {}, options = {}) {
  if (!snapshot) return { status: 'skipped', reason: 'missing-snapshot' };
  const bootConfig = normalizeXTensionBootConfig(configValue);
  if (typeof window !== 'undefined' && window.__XTendResumeDemo) {
    window.__XTendResumeDemo.xtensionBootConfig = bootConfig;
  }
  const specs = getMountSpecs(snapshot);
  const results = await Promise.all(specs.map(async (spec) => {
    if (isXTensionEnabled(bootConfig, spec.key)) {
      const entry = controllers.get(spec.key);
      if (entry) {
        await updateXTensions(snapshot, {
          only: [spec.key],
          bootConfig,
          reason: options.reason || 'boot-config-apply',
          intent: options.intent || null
        });
        return { key: spec.key, status: 'updated' };
      }
      await mountOne(spec);
      return { key: spec.key, status: 'mounted' };
    }
    await unmountXTension(spec.key, options.reason || 'boot-config-apply');
    markSlotDisabled(spec, options.reason || 'boot-config-apply');
    return { key: spec.key, status: 'disabled' };
  }));
  dispatchUpdate();
  return {
    schema: 'xtend.local.resumability-maraca-erp-demo.xtension-boot-apply-result.v1',
    status: 'ok',
    bootConfig,
    results
  };
}

export function getLifecycleSummary() {
  const statusFor = (key) => {
    const slot = document.querySelector(`[data-xtension-slot="${key}"]`);
    return normalizeStatus(slot && slot.dataset.xtensionStatus || 'missing');
  };
  const summary = {
    mountedCount: controllers.size,
    frameSubscribers: frameSubscribers.size,
    enabledCount: readXTensionBootConfig().enabledCount,
    disabledCount: readXTensionBootConfig().disabledCount,
    reactLedger: statusFor('react-ledger-panel'),
    reactSla: statusFor('react-sla-matrix'),
    vueProcess: statusFor('vue-process-sidebar'),
    vueException: statusFor('vue-exception-queue'),
    three: statusFor('three-material-flow-scene'),
    vanilla: statusFor('vanilla-legacy-lab'),
    openui5: statusFor('openui5-procurement-worklist'),
    angular: statusFor('angular-risk-workbench')
  };
  const groupStatus = (...statuses) => {
    if (statuses.every((status) => status === 'resumed')) return 'resumed';
    if (statuses.every((status) => status === 'mounted')) return 'mounted';
    if (statuses.every((status) => status === 'disabled')) return 'disabled';
    if (statuses.some((status) => status === 'degraded')) return 'degraded';
    return 'partial';
  };
  summary.react = groupStatus(summary.reactLedger, summary.reactSla);
  summary.vue = groupStatus(summary.vueProcess, summary.vueException);
  const threeSlot = document.querySelector('[data-xtension-slot="three-material-flow-scene"]');
  summary.threeNonblank = threeSlot && threeSlot.dataset.threeNonblank || 'false';
  const vanillaSlot = document.querySelector('[data-xtension-slot="vanilla-legacy-lab"]');
  summary.vanillaStatus = vanillaSlot && vanillaSlot.dataset.vanillaStatus || summary.vanilla || 'missing';
  summary.iwebkitSandbox = vanillaSlot && vanillaSlot.dataset.iwebkitSandbox || 'false';
  summary.iwebkitFrameLoads = vanillaSlot && vanillaSlot.dataset.iwebkitFrameLoads || '0';
  summary.iwebkitMessageCount = vanillaSlot && vanillaSlot.dataset.iwebkitMessageCount || '0';
  const openUi5Slot = document.querySelector('[data-xtension-slot="openui5-procurement-worklist"]');
  summary.openui5Status = openUi5Slot && openUi5Slot.dataset.openui5Status || summary.openui5 || 'missing';
  summary.openui5ModelUpdates = openUi5Slot && openUi5Slot.dataset.openui5ModelUpdates || '0';
  const angularSlot = document.querySelector('[data-xtension-slot="angular-risk-workbench"]');
  summary.angularStatus = angularSlot && angularSlot.dataset.angularStatus || summary.angular || 'missing';
  summary.angularModelUpdates = angularSlot && angularSlot.dataset.angularModelUpdates || '0';
  for (const entry of lifecycle) {
    if (entry.status === 'degraded') {
      summary.degraded = true;
      summary.lastDegraded = entry.metadata && entry.metadata.key || entry.framework;
    }
  }
  return summary;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    for (const [key, entry] of frameSubscribers) {
      if (entry.controller && typeof entry.controller.suspend === 'function') {
        Promise.resolve(entry.controller.suspend('visibility.pause')).catch(() => {});
        record(entry.framework, 'suspend', 'ok', { key, reason: 'visibility.pause' });
      }
    }
    stopFrameLoop();
  } else if (frameSubscribers.size) {
    for (const [key, entry] of frameSubscribers) {
      if (entry.controller && typeof entry.controller.resume === 'function') {
        Promise.resolve(entry.controller.resume('visibility.resume')).catch(() => {});
        record(entry.framework, 'resume', 'resumed', { key, reason: 'visibility.resume' });
      }
    }
    startFrameLoop();
  }
});
