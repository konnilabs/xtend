const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MARACA_PACKAGE_SCHEMA = 'xtend.maraca.package-metadata.v1';
const MARACA_BUILD_PLAN_SCHEMA = 'xtend.maraca.build-plan.v1';
const MARACA_BUNDLE_REPORT_SCHEMA = 'xtend.maraca.bundle-report.v1';
const MARACA_SIZE_BUDGET_REPORT_SCHEMA = 'xtend.maraca.size-budget-report.v1';
const MARACA_ORCHESTRATION_PLAN_SCHEMA = 'xtend.maraca.orchestration-plan.v1';
const MARACA_KERNEL_PLAN_SCHEMA = 'xtend.maraca.kernel-plan.v1';
const MARACA_HYDRATION_PLAN_SCHEMA = 'xtend.maraca.hydration-plan.v1';
const MARACA_VALIDATION_PLAN_SCHEMA = 'xtend.maraca.validation-plan.v1';
const MARACA_TRANSITION_PLAN_SCHEMA = 'xtend.maraca.transition-plan.v1';

const DEFAULT_SOURCE = 'tests/rmt-language/fixtures/maraca-known-components.rmt';
const DEFAULT_OUT_DIR = '.xtend-build/maraca/app';
const VALID_PROFILES = new Set(['debug', 'production', 'max']);
const VALID_LAZY_MODES = new Set(['route', 'component', 'none']);
const VALID_CSS_MODES = new Set(['inline', 'external']);
const VALID_COMPONENT_MODES = new Set(['document', 'all']);
const VALID_STACK_MODES = new Set(['plan', 'runtime', 'full', 'none']);
const VALID_ORCHESTRATION_MODES = new Set(['auto', 'strict', 'off']);
const VALID_KERNEL_MODES = new Set(['auto', 'strict', 'off']);
const VALID_HYDRATION_MODES = new Set(['auto', 'strict', 'off']);
const VALID_VALIDATION_MODES = new Set(['auto', 'strict', 'off']);
const VALID_TRANSITION_MODES = new Set(['auto', 'strict', 'off']);
const VALID_SIZE_BUDGET_MODES = new Set(['strict', 'warn', 'off']);
const COMPONENT_UNKNOWN_CODE = 'xtend.maraca.component_unknown';
const COMPONENT_DYNAMIC_CODE = 'xtend.maraca.dynamic_component_requires_opt_in';
const COMPILER_ERROR_CODE = 'xtend.maraca.rmt_compile_failed';
const ORCHESTRATION_MISSING_CODE = 'xtend.maraca.orchestration_missing';
const ORCHESTRATION_STRICT_CODE = 'xtend.maraca.orchestration_strict_contract';
const KERNEL_MISSING_CODE = 'xtend.maraca.kernel_missing';
const KERNEL_STRICT_CODE = 'xtend.maraca.kernel_strict_contract';
const VALIDATION_MISSING_CODE = 'xtend.maraca.validation_missing';
const VALIDATION_STRICT_CODE = 'xtend.maraca.validation_strict_contract';
const TRANSITION_MISSING_CODE = 'xtend.maraca.transitions_missing';
const TRANSITION_STRICT_CODE = 'xtend.maraca.transitions_strict_contract';
const NATIVE_MARACA_COMPONENT_TAGS = Object.freeze(new Set([
  'a',
  'article',
  'aside',
  'audio',
  'button',
  'canvas',
  'div',
  'figure',
  'figcaption',
  'footer',
  'form',
  'header',
  'img',
  'input',
  'label',
  'li',
  'main',
  'nav',
  'ol',
  'option',
  'p',
  'picture',
  'section',
  'select',
  'span',
  'strong',
  'textarea',
  'ul',
  'video'
]));
const VALIDATION_RUNTIME_MODULES = Object.freeze([
  'xtendrmt/rmt-form-validation-runtime.js'
]);
const TRANSITION_RUNTIME_MODULES = Object.freeze([
  'xtendrmt/rmt-surface-transition-runtime.js',
  'components/xutils.js',
  'components/xstate.js'
]);
const KERNEL_RUNTIME_MODULES = Object.freeze([
  'xtendrmt/rmt-kernel-orchestration-controller.js',
  'xtendrmt/rmt-runtime.esm.js'
]);
const KERNEL_RUNTIME_BUNDLE_FILE = 'runtime/xtendrmt-rmt-runtime.esm.js';
const KERNEL_CONTROLLER_BUNDLE_FILE = 'runtime/xtendrmt-rmt-kernel-orchestration-controller.js';
const ORCHESTRATION_RUNTIME_MODULES = Object.freeze([
  'xtendrmt/rmt-state-selector-runtime.js',
  'xtendrmt/rmt-action-effect-runtime.js',
  'xtendrmt/rmt-event-routing-runtime.js',
  'xtendrmt/rmt-surface-resource-graph-runtime.js',
  'xtendrmt/rmt-dom-descriptor-renderer.js'
]);
const XTEND_VENDOR_STACK_MODULES = Object.freeze([
  'api.js',
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-dom-descriptor-renderer.js',
  'xtendrmt/rmt-action-effect-runtime.js',
  'xtendrmt/rmt-event-routing-runtime.js',
  'xtendrmt/rmt-form-validation-runtime.js',
  'xtendrmt/rmt-surface-transition-runtime.js',
  'xtendrmt/rmt-state-selector-runtime.js',
  'xtendrmt/rmt-surface-resource-graph-runtime.js',
  'xtendrmt/rmt-component-capability-registry.js',
  'xtendrmt/rmt-native-shell-runtime.js',
  'fabric/xtend-fabric.js',
  'fabric/rmt-lane-mapping.js',
  'fabric/hydration-policy.js'
]);
const PUBLIC_NAME_RESERVATIONS = Object.freeze([
  'XTendMaraca',
  'XTendLoader',
  'XTendRMT',
  'XTendFabric',
  'ensureMaracaComponent',
  'bootXtendMaraca',
  'MARACA_COMPONENTS',
  'MARACA_SURFACES',
  'MARACA_EVENTS',
  'MARACA_ORCHESTRATION',
  'MARACA_KERNEL',
  'MARACA_HYDRATION',
  'MARACA_VALIDATION',
  'MARACA_TRANSITIONS',
  'MARACA_PUBLIC_NAMES',
  'MARACA_STACK_MODULES',
  'XTendRmtKernelOrchestrationController',
  'XTendRmtSurfaceTransitionRuntime',
  'customElements',
  'HTMLElement',
  'ShadowRoot',
  'CSSStyleSheet',
  'IntersectionObserver',
  'connectedCallback',
  'disconnectedCallback',
  'attributeChangedCallback',
  'adoptedCallback',
  'observedAttributes',
  'data-maraca-root',
  'data-maraca-surface',
  'data-rmt-component',
  'part',
  'slot',
  'tone',
  'variant',
  'disabled',
  'open',
  'value',
  'change',
  'input',
  'click',
  'submit',
  'xtend.rmt.core-format.vnext.v1',
  MARACA_BUILD_PLAN_SCHEMA,
  MARACA_BUNDLE_REPORT_SCHEMA,
  MARACA_SIZE_BUDGET_REPORT_SCHEMA,
  MARACA_KERNEL_PLAN_SCHEMA,
  MARACA_HYDRATION_PLAN_SCHEMA,
  MARACA_VALIDATION_PLAN_SCHEMA,
  MARACA_TRANSITION_PLAN_SCHEMA,
  MARACA_TRANSITION_PLAN_SCHEMA
]);

function resolveRootDir(rootDir) {
  return path.resolve(rootDir || process.cwd());
}

function toPosix(value) {
  return String(value).split(path.sep).join('/');
}

function repoRelative(filePath, rootDir) {
  const relative = path.relative(rootDir, filePath);
  return toPosix(relative || '.');
}

function ensureRelativeImport(fromDir, targetPath) {
  const relative = toPosix(path.relative(fromDir, targetPath));
  return relative.startsWith('.') ? relative : `./${relative}`;
}

function stableJson(value) {
  return JSON.stringify(value, null, 2);
}

function hashText(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toBoolean(value) {
  if (value === true || value === false) return value;
  if (value === undefined || value === null) return false;
  const normalized = String(value).toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function toVendorBoolean(value) {
  if (value === true) return true;
  if (value === undefined || value === null || value === false) return false;
  return ['1', 'true', 'yes', 'all', 'xtend', 'vendor'].includes(String(value).toLowerCase());
}

function normalizeInput(input) {
  if (typeof input === 'string') return { source: input };
  return input && typeof input === 'object' ? { ...input } : {};
}

function normalizeOptions(input = {}, options = {}) {
  const values = normalizeInput(input);
  const rootDir = resolveRootDir(options.rootDir || values.rootDir);
  const positionalSource = Array.isArray(values._) && values._[0] ? values._[0] : null;
  const hasSourceText = typeof values.sourceText === 'string' || typeof values.sourceContent === 'string';
  const sourceText = hasSourceText
    ? String(typeof values.sourceText === 'string' ? values.sourceText : values.sourceContent)
    : null;
  const source = hasSourceText
    ? (values.virtualSourcePath || values.filePath || values.sourcePath || positionalSource || 'docs/rmt-playground-source.rmt')
    : (values.source || values.src || values.app || positionalSource || DEFAULT_SOURCE);
  const sourcePath = path.resolve(rootDir, source);
  const outDirValue = values.out || values.outDir || values.output || DEFAULT_OUT_DIR;
  const outputDir = path.resolve(rootDir, outDirValue);
  const profile = VALID_PROFILES.has(values.profile) ? values.profile : 'production';
  const lazy = VALID_LAZY_MODES.has(values.lazy) ? values.lazy : 'route';
  const css = VALID_CSS_MODES.has(values.css) ? values.css : 'inline';
  const vendor = toVendorBoolean(values.vendor || values['vendor-version']);
  const requestedComponentMode = values.components || values.componentMode || values['component-mode'];
  const componentMode = VALID_COMPONENT_MODES.has(requestedComponentMode)
    ? requestedComponentMode
    : (vendor ? 'all' : 'document');
  const requestedStackMode = values.stack || values.stackMode || values['stack-mode'];
  const stackMode = VALID_STACK_MODES.has(requestedStackMode)
    ? requestedStackMode
    : (vendor ? 'full' : 'plan');
  const requestedOrchestration = values.orchestration || values.orchestrationMode || values['orchestration-mode'] || values['app-orchestration'];
  const orchestration = VALID_ORCHESTRATION_MODES.has(requestedOrchestration)
    ? requestedOrchestration
    : 'auto';
  const requestedKernel = values.kernel || values.kernelMode || values['kernel-mode'] || values['rmt-kernel'];
  const kernel = VALID_KERNEL_MODES.has(requestedKernel)
    ? requestedKernel
    : 'auto';
  const requestedHydration = values.hydration || values.hydrationMode || values['hydration-mode'] || values['app-hydration'];
  const hydration = VALID_HYDRATION_MODES.has(requestedHydration)
    ? requestedHydration
    : 'auto';
  const requestedValidation = values.validation || values.validationMode || values['validation-mode'] || values['form-validation'];
  const validation = VALID_VALIDATION_MODES.has(requestedValidation)
    ? requestedValidation
    : 'auto';
  const requestedTransitions = values.transitions || values.transitionMode || values['transition-mode'] || values['surface-transitions'];
  const transitions = VALID_TRANSITION_MODES.has(requestedTransitions)
    ? requestedTransitions
    : 'auto';
  const requestedSizeBudget = values.sizeBudget || values.sizeBudgetMode || values['size-budget'] || values['size-budget-mode'];
  const sizeBudget = VALID_SIZE_BUDGET_MODES.has(requestedSizeBudget)
    ? requestedSizeBudget
    : 'strict';
  const allowDynamicComponents = toBoolean(
    values.allowDynamicComponents !== undefined
      ? values.allowDynamicComponents
      : values['allow-dynamic-components']
  );

  return {
    rootDir,
    source,
    sourcePath,
    sourceText,
    outputDir,
    profile,
    lazy,
    css,
    vendor,
    componentMode,
    stackMode,
    orchestration,
    kernel,
    hydration,
    validation,
    transitions,
    sizeBudget,
    json: toBoolean(values.json),
    allowDynamicComponents
  };
}

function requireOptional(request, baseDir) {
  try {
    const resolved = require.resolve(request, { paths: [baseDir || process.cwd(), __dirname] });
    const mod = require(resolved);
    let version = null;
    try {
      const packagePath = require.resolve(`${request}/package.json`, { paths: [baseDir || process.cwd(), __dirname] });
      version = require(packagePath).version || null;
    } catch (_) {}
    return { available: true, module: mod, version, resolved };
  } catch (error) {
    return { available: false, error: error && error.message };
  }
}

function getMaracaToolchainAvailability(rootDir = process.cwd()) {
  const rollup = requireOptional('rollup', rootDir);
  const terser = requireOptional('terser', rootDir);
  return {
    rollup: {
      requested: true,
      available: rollup.available,
      version: rollup.version || null,
      mode: rollup.available ? 'rollup-js-api' : 'local-esm-importgraph-fallback'
    },
    terser: {
      requested: true,
      available: terser.available,
      version: terser.version || null,
      mode: terser.available ? 'terser-js-api' : 'local-minifier-fallback'
    }
  };
}

function loadVNextCompiler(rootDir) {
  const localPaths = [
    path.join(rootDir, 'tools', 'rmt-language', 'vnext-compiler.js'),
    path.join(__dirname, '..', 'tools', 'rmt-language', 'vnext-compiler.js')
  ];
  for (const localPath of localPaths) {
    if (fs.existsSync(localPath)) {
      return require(localPath);
    }
  }
  return require('@ccslabs/xtend-compiler/rmt-language/vnext-compiler');
}

function compileSource(options) {
  const sourceText = typeof options.sourceText === 'string'
    ? options.sourceText
    : fs.readFileSync(options.sourcePath, 'utf8');
  const compiler = loadVNextCompiler(options.rootDir);
  return {
    sourceText,
    compileResult: compiler.compileRmtVNextSource({
      text: sourceText,
      filePath: options.sourcePath
    })
  };
}

function loadComponentManifest(rootDir) {
  const manifestPath = [
    path.join(rootDir, 'components', 'manifest.json'),
    path.join(__dirname, '..', 'components', 'manifest.json')
  ].find((candidate) => fs.existsSync(candidate));
  if (!manifestPath) {
    throw new Error('Maraca component manifest not found in app root or vendored XTend package.');
  }
  const manifest = readJson(manifestPath);
  const entries = Object.keys(manifest).sort().map((tag) => {
    const module = manifest[tag];
    const absolutePath = path.resolve(path.dirname(manifestPath), module);
    return {
      tag,
      module,
      absolutePath,
      source: repoRelative(absolutePath, rootDir)
    };
  });
  return {
    manifestPath,
    entries,
    byTag: new Map(entries.map((entry) => [entry.tag, entry]))
  };
}

function collectSurfaces(coreDocument) {
  const appSurfaces = coreDocument && coreDocument.appPlatform && Array.isArray(coreDocument.appPlatform.surfaces)
    ? coreDocument.appPlatform.surfaces
    : [];
  const coreSurfaces = coreDocument && Array.isArray(coreDocument.surfaces)
    ? coreDocument.surfaces
    : [];
  const merged = new Map();

  coreSurfaces.forEach((surface) => {
    const id = surface.name || surface.id;
    if (!id) return;
    merged.set(id, {
      id,
      coreId: surface.id || id,
      kind: surface.kind || 'surface',
      component: surface.component || null,
      source: surface.source && (surface.source.target || surface.source.ref) || surface.source || null,
      laneRefs: Array.isArray(surface.laneRefs) ? surface.laneRefs : [],
      eventRefs: Array.isArray(surface.eventRefs) ? surface.eventRefs : [],
      bounds: surface.bounds || null,
      portal: surface.portal && (surface.portal.target || surface.portal.ref) || surface.portal || null,
      key: surface.key || null
    });
  });

  appSurfaces.forEach((surface) => {
    const id = surface.id || surface.name;
    if (!id) return;
    const existing = merged.get(id) || {};
    merged.set(id, {
      ...existing,
      id,
      coreId: existing.coreId || id,
      kind: surface.kind || existing.kind || 'surface',
      component: surface.component || existing.component || null,
      source: surface.source || existing.source || null,
      laneRefs: existing.laneRefs || [],
      eventRefs: Array.isArray(surface.events) ? surface.events : existing.eventRefs || [],
      bounds: surface.bounds || existing.bounds || null,
      portal: surface.portal || existing.portal || null,
      key: surface.key || existing.key || null,
      resources: Array.isArray(surface.resources) ? surface.resources : []
    });
  });

  return Array.from(merged.values());
}

function collectInitialState(coreDocument) {
  const map = {};
  const states = Array.isArray(coreDocument && coreDocument.states) ? coreDocument.states : [];
  states.forEach((state) => {
    const key = state.name || state.id;
    if (!key) return;
    map[key] = state.initial && typeof state.initial === 'object' ? state.initial : {};
  });
  return map;
}

function collectEvents(coreDocument, orchestrationPlan = null) {
  const artifactEvents = orchestrationPlan
    && orchestrationPlan.artifact
    && Array.isArray(orchestrationPlan.artifact.events)
    ? orchestrationPlan.artifact.events
    : [];
  const events = artifactEvents.length > 0
    ? artifactEvents
    : Array.isArray(coreDocument && coreDocument.events)
      ? coreDocument.events
      : [];
  return events.map((event) => ({
    id: event.id || null,
    event: event.event || event.type || event.name || null,
    type: event.event || event.type || event.name || null,
    kind: event.kind || 'dom',
    action: event.action || null,
    surface: event.surface || event.scope && event.scope.surface || null,
    selector: event.selector || event.target || null,
    target: event.target || event.selector || null,
    component: event.component || null,
    owner: event.owner || event.ownerOperation || null,
    payload: Object.prototype.hasOwnProperty.call(event, 'payload') ? event.payload : '$detail',
    payloadContract: event.payloadContract || null,
    governance: event.governance || null,
    options: event.options || null
  }));
}

function collectLanes(coreDocument) {
  const lanes = Array.isArray(coreDocument && coreDocument.lanes) ? coreDocument.lanes : [];
  return lanes.map((lane) => ({
    id: lane.id || null,
    name: lane.name || null,
    weight: lane.weight || 0,
    operations: Array.isArray(lane.operationRefs) ? lane.operationRefs : []
  }));
}

function collectRequiredTags(surfaces) {
  const tags = new Set();
  surfaces.forEach((surface) => {
    if (surface.component && typeof surface.component === 'string') {
      tags.add(surface.component);
    }
    if (surface.component === 'x-surface-window' || surface.component === 'x-side-panel' || surface.component === 'x-surface-manager') {
      tags.add('x-icon');
    }
    if (surface.component === 'x-surface-window' && surface.kind === 'player') {
      tags.add('x-player');
    }
  });
  return Array.from(tags).sort();
}

function collectRequestedTags(surfaces, componentManifest, options) {
  if (options.componentMode === 'all') {
    return componentManifest.entries.map((entry) => entry.tag).sort();
  }
  return collectRequiredTags(surfaces);
}

function isPotentialDynamicTag(tag) {
  return typeof tag === 'string' && (tag.includes('{') || tag.includes('*') || tag.includes('$'));
}

function isNativeMaracaComponentTag(tag) {
  return typeof tag === 'string' && NATIVE_MARACA_COMPONENT_TAGS.has(tag.trim().toLowerCase());
}

function createComponentRecords(requiredTags, componentManifest, options) {
  const selected = [];
  const unknown = [];
  const diagnostics = [];

  requiredTags.forEach((tag) => {
    const known = componentManifest.byTag.get(tag);
    if (known) {
      selected.push({
        tag,
        module: known.module,
        absolutePath: known.absolutePath,
        source: known.source,
        known: true
      });
      return;
    }

    if (isNativeMaracaComponentTag(tag)) {
      selected.push({
        tag,
        module: null,
        absolutePath: null,
        source: 'browser-native-element',
        known: true,
        native: true,
        lazy: false,
        sideEffectBoundary: 'browser-native-element'
      });
      return;
    }

    unknown.push(tag);
    diagnostics.push({
      code: isPotentialDynamicTag(tag) ? COMPONENT_DYNAMIC_CODE : COMPONENT_UNKNOWN_CODE,
      severity: options.allowDynamicComponents ? 'warning' : 'error',
      tag,
      message: options.allowDynamicComponents
        ? `Component tag "${tag}" is not in the static XTend component registry and will need a host adapter.`
        : `Component tag "${tag}" is not in components/manifest.json. Pass --allow-dynamic-components only when the host supplies it.`
    });
  });

  return { selected, unknown, diagnostics };
}

function buildRuntimeModuleList(coreDocument) {
  const modules = new Set([
    'xtendrmt/rmt-runtime.esm.js',
    'xtendrmt/rmt-dom-descriptor-renderer.js'
  ]);
  const hasActions = Array.isArray(coreDocument && coreDocument.actions) && coreDocument.actions.length > 0;
  const hasEvents = Array.isArray(coreDocument && coreDocument.events) && coreDocument.events.length > 0;
  const hasSelectors = Array.isArray(coreDocument && coreDocument.selectors) && coreDocument.selectors.length > 0;
  const hasSurfaces = Array.isArray(coreDocument && coreDocument.surfaces) && coreDocument.surfaces.some((surface) => surface.primitive === true);
  if (hasActions) modules.add('xtendrmt/rmt-action-effect-runtime.js');
  if (hasEvents) modules.add('xtendrmt/rmt-event-routing-runtime.js');
  if (hasSelectors) modules.add('xtendrmt/rmt-state-selector-runtime.js');
  if (hasSurfaces || coreDocument && coreDocument.appPlatform) modules.add('xtendrmt/rmt-surface-resource-graph-runtime.js');
  return Array.from(modules).sort();
}

function resolveStackModuleRecords(runtimeModules, options, orchestrationPlan = null, kernelPlan = null, validationPlan = null, transitionPlan = null) {
  let moduleIds = [];
  if (options.stackMode === 'runtime') {
    moduleIds = runtimeModules;
  } else if (options.stackMode === 'full') {
    moduleIds = XTEND_VENDOR_STACK_MODULES;
  }

  if (orchestrationPlan && orchestrationPlan.enabled) {
    moduleIds = moduleIds.concat(ORCHESTRATION_RUNTIME_MODULES);
  }
  if (kernelPlan && kernelPlan.enabled) {
    moduleIds = moduleIds.concat(KERNEL_RUNTIME_MODULES);
  }
  if (validationPlan && validationPlan.enabled) {
    moduleIds = moduleIds.concat(VALIDATION_RUNTIME_MODULES);
  }
  if (transitionPlan && transitionPlan.enabled) {
    moduleIds = moduleIds.concat(TRANSITION_RUNTIME_MODULES);
  }

  const packageRoot = path.dirname(path.dirname(__filename));
  return Array.from(new Set(moduleIds)).sort().map((moduleId) => {
    const candidates = [
      path.resolve(options.rootDir, moduleId),
      path.resolve(packageRoot, moduleId)
    ];
    const absolutePath = candidates.find((candidate) => fs.existsSync(candidate));
    return absolutePath ? {
      id: moduleId,
      source: moduleId,
      absolutePath
    } : null;
  }).filter(Boolean);
}

function createBaseOrchestrationPlan(mode, status, message) {
  const diagnostics = message ? [{
    code: status === 'disabled' ? 'xtend.maraca.orchestration_disabled' : ORCHESTRATION_MISSING_CODE,
    severity: mode === 'strict' && status !== 'disabled' ? 'error' : 'info',
    message
  }] : [];

  return {
    schema: MARACA_ORCHESTRATION_PLAN_SCHEMA,
    mode,
    strict: mode === 'strict',
    enabled: false,
    status,
    supported: false,
    artifact: null,
    runtimeModules: ORCHESTRATION_RUNTIME_MODULES.slice(),
    diagnostics,
    summary: {
      stateCount: 0,
      selectorCount: 0,
      reducerCount: 0,
      actionCount: 0,
      eventCount: 0,
      surfaceCount: 0,
      portalCount: 0,
      overlayCount: 0,
      resourceCount: 0
    }
  };
}

function orchestrationDiagnostic(code, severity, message, details = {}) {
  return {
    ...details,
    code,
    severity,
    message
  };
}

function createBaseKernelPlan(mode, status, message) {
  const diagnostics = message ? [{
    code: status === 'disabled' ? 'xtend.maraca.kernel_disabled' : KERNEL_MISSING_CODE,
    severity: mode === 'strict' && status !== 'disabled' ? 'error' : 'info',
    message
  }] : [];

  return {
    schema: MARACA_KERNEL_PLAN_SCHEMA,
    mode,
    strict: mode === 'strict',
    enabled: false,
    status,
    supported: false,
    artifact: null,
    runtimeModules: KERNEL_RUNTIME_MODULES.slice(),
    diagnostics,
    summary: {
      schema: null,
      recordsSchema: null,
      scheduleCount: 0,
      fiberCount: 0,
      laneCount: 0,
      endpointCount: 0
    }
  };
}

function kernelDiagnostic(code, severity, message, details = {}) {
  return {
    ...details,
    code,
    severity,
    message
  };
}

function createBaseHydrationPlan(mode, status, message) {
  const diagnostics = message ? [{
    code: status === 'disabled' ? 'xtend.maraca.hydration_disabled' : 'xtend.maraca.hydration_missing',
    severity: mode === 'strict' && status !== 'disabled' ? 'error' : 'info',
    message
  }] : [];

  return {
    schema: MARACA_HYDRATION_PLAN_SCHEMA,
    mode,
    strict: mode === 'strict',
    enabled: false,
    status,
    supported: false,
    artifact: null,
    runtimeModules: [],
    diagnostics,
    summary: {
      schema: null,
      recordCount: 0,
      supportedModeCount: 0,
      hydrationPolicyCount: 0,
      insularIslandCount: 0,
      strictViolations: 0
    }
  };
}

function hydrationDiagnostic(code, severity, message, details = {}) {
  return {
    ...details,
    code,
    severity,
    message
  };
}

function createBaseValidationPlan(mode, status, message) {
  const diagnostics = message ? [{
    code: status === 'disabled' ? 'xtend.maraca.validation_disabled' : VALIDATION_MISSING_CODE,
    severity: mode === 'strict' && status !== 'disabled' ? 'error' : 'info',
    message
  }] : [];

  return {
    schema: MARACA_VALIDATION_PLAN_SCHEMA,
    mode,
    strict: mode === 'strict',
    enabled: false,
    status,
    supported: false,
    artifact: null,
    runtimeModules: VALIDATION_RUNTIME_MODULES.slice(),
    diagnostics,
    summary: {
      schema: null,
      groupCount: 0,
      fieldCount: 0,
      actionGateCount: 0,
      statePatchCount: 0,
      strictViolations: 0,
      fallbackCount: 0,
      runtimeExpectedStatus: 'disabled'
    }
  };
}

function validationDiagnostic(code, severity, message, details = {}) {
  return {
    ...details,
    code,
    severity,
    message
  };
}

function createBaseTransitionPlan(mode, status, message) {
  const diagnostics = message ? [{
    code: status === 'disabled' ? 'xtend.maraca.transitions_disabled' : TRANSITION_MISSING_CODE,
    severity: mode === 'strict' && status !== 'disabled' ? 'error' : 'info',
    message
  }] : [];

  return {
    schema: MARACA_TRANSITION_PLAN_SCHEMA,
    mode,
    strict: mode === 'strict',
    enabled: false,
    status,
    supported: false,
    artifact: null,
    runtimeModules: TRANSITION_RUNTIME_MODULES.slice(),
    diagnostics,
    summary: {
      schema: null,
      transitionCount: 0,
      effectCounts: {},
      durationRange: { min: 0, max: 0 },
      scheduledEndpointCount: 0,
      fallbackCount: 0,
      strictViolations: 0,
      runtimeExpectedStatus: 'disabled'
    }
  };
}

function transitionDiagnostic(code, severity, message, details = {}) {
  return {
    ...details,
    code,
    severity,
    message
  };
}

function createMaracaKernelPlan(compileResult, orchestrationPlan, options) {
  const mode = options.kernel || 'auto';
  const strict = mode === 'strict';

  if (mode === 'off') {
    return createBaseKernelPlan(mode, 'disabled', 'Maraca RMT kernel integration is disabled for this build.');
  }

  if (!orchestrationPlan || !orchestrationPlan.enabled) {
    return createBaseKernelPlan(
      mode,
      strict ? 'blocked' : 'fallback',
      'Maraca RMT kernel integration needs enabled app orchestration.'
    );
  }

  const artifact = orchestrationPlan.artifact && orchestrationPlan.artifact.kernel
    || compileResult && compileResult.orchestrationArtifacts && compileResult.orchestrationArtifacts.kernel
    || null;
  const records = artifact && artifact.records || null;
  const scheduler = artifact && artifact.scheduler || null;
  if (!artifact || !records) {
    return createBaseKernelPlan(
      mode,
      strict ? 'blocked' : 'fallback',
      'RMT source did not emit kernel records for Maraca orchestration.'
    );
  }

  const diagnostics = [];
  const schedules = Array.isArray(scheduler && scheduler.schedules) ? scheduler.schedules : [];
  const fibers = Array.isArray(scheduler && scheduler.fibers) ? scheduler.fibers : [];
  const scheduleEndpoints = new Set(schedules.map((schedule) => schedule.endpointName).filter(Boolean));

  if (!records.schema) {
    diagnostics.push(kernelDiagnostic(
      'xtend.maraca.kernel_records_schema_missing',
      strict ? 'error' : 'warning',
      'Kernel records need a schema before they can be bundled into Maraca.',
      {}
    ));
  }

  schedules.forEach((schedule) => {
    if (!schedule.id || !schedule.endpointName || !Array.isArray(schedule.operationRefs) || schedule.operationRefs.length === 0) {
      diagnostics.push(kernelDiagnostic(
        'xtend.maraca.kernel_schedule_unresolved',
        strict ? 'error' : 'warning',
        `Kernel schedule ${schedule && schedule.id || '(unknown)'} cannot be materialized into a scheduler endpoint.`,
        { schedule: schedule && schedule.id || '' }
      ));
    }
  });

  fibers.forEach((fiber) => {
    if (!fiber.id || !fiber.operation || !fiber.endpointName || !scheduleEndpoints.has(fiber.endpointName)) {
      diagnostics.push(kernelDiagnostic(
        'xtend.maraca.kernel_fiber_unresolved',
        strict ? 'error' : 'warning',
        `Kernel fiber ${fiber && fiber.id || '(unknown)'} cannot be attached to a scheduler endpoint.`,
        { fiber: fiber && fiber.id || '' }
      ));
    }
    if (strict && fiber.kind === 'lifecycle' && !fiber.target) {
      diagnostics.push(kernelDiagnostic(
        'xtend.maraca.kernel_fiber_target_missing',
        'error',
        `Kernel lifecycle fiber ${fiber.id} needs a materializable target.`,
        { fiber: fiber.id }
      ));
    }
  });

  (Array.isArray(artifact.diagnostics) ? artifact.diagnostics : []).forEach((diagnostic) => {
    diagnostics.push(kernelDiagnostic(
      diagnostic.code || KERNEL_STRICT_CODE,
      strict && diagnostic.severity !== 'info' ? 'error' : diagnostic.severity || 'warning',
      diagnostic.message || 'RMT kernel orchestration diagnostic.',
      diagnostic
    ));
  });

  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  return {
    schema: MARACA_KERNEL_PLAN_SCHEMA,
    mode,
    strict,
    enabled: !hasErrors,
    status: hasErrors ? (strict ? 'blocked' : 'fallback') : 'planned',
    supported: true,
    artifact,
    runtimeModules: KERNEL_RUNTIME_MODULES.slice(),
    diagnostics,
    summary: {
      schema: artifact.schema || null,
      recordsSchema: records.schema || null,
      boundary: records.boundary || null,
      scheduleCount: schedules.length,
      fiberCount: fibers.length,
      laneCount: Array.isArray(scheduler && scheduler.lanePolicies) ? scheduler.lanePolicies.length : 0,
      endpointCount: scheduleEndpoints.size,
      runtimeModules: KERNEL_RUNTIME_MODULES.slice()
    }
  };
}

function createMaracaHydrationPlan(compileResult, orchestrationPlan, kernelPlan, options) {
  const mode = options.hydration || 'auto';
  const strict = mode === 'strict';

  if (mode === 'off') {
    return createBaseHydrationPlan(mode, 'disabled', 'Maraca app hydration orchestration is disabled for this build.');
  }

  if (!orchestrationPlan || !orchestrationPlan.enabled) {
    return createBaseHydrationPlan(
      mode,
      strict ? 'blocked' : 'fallback',
      'Maraca app hydration needs enabled app orchestration.'
    );
  }

  const artifact = orchestrationPlan.artifact && orchestrationPlan.artifact.hydration
    || compileResult && compileResult.orchestrationArtifacts && compileResult.orchestrationArtifacts.hydration
    || null;
  if (!artifact) {
    return createBaseHydrationPlan(
      mode,
      strict ? 'blocked' : 'fallback',
      'RMT source did not emit a hydration plan for Maraca orchestration.'
    );
  }

  const diagnostics = [];
  const records = Array.isArray(artifact.records) ? artifact.records : [];
  const supportedModes = new Set(Array.isArray(artifact.supportedModes) ? artifact.supportedModes : []);

  records.forEach((record) => {
    if (!record.surface || !record.component || !record.policy || !record.mode) {
      diagnostics.push(hydrationDiagnostic(
        'xtend.maraca.hydration_record_incomplete',
        strict ? 'error' : 'warning',
        `Hydration record ${record && record.id || '(unknown)'} is incomplete.`,
        { hydration: record && record.id || '' }
      ));
    }
    if (record.mode && supportedModes.size > 0 && !supportedModes.has(record.mode)) {
      diagnostics.push(hydrationDiagnostic(
        'xtend.maraca.hydration_mode_unknown',
        strict ? 'error' : 'warning',
        `Hydration mode ${record.mode} is not supported by the compiler hydration plan.`,
        { hydration: record.id || '', mode: record.mode }
      ));
    }
    if (strict && record.insularHydration && (!record.isolation || record.isolation.shadowRootAccess !== false)) {
      diagnostics.push(hydrationDiagnostic(
        'xtend.maraca.hydration_isolation_incomplete',
        'error',
        `Insular hydration record ${record.id} needs a public-contract-only isolation boundary.`,
        { hydration: record.id || '' }
      ));
    }
  });

  if (strict && kernelPlan && kernelPlan.enabled) {
    const fibers = kernelPlan.artifact && kernelPlan.artifact.scheduler && Array.isArray(kernelPlan.artifact.scheduler.fibers)
      ? kernelPlan.artifact.scheduler.fibers
      : [];
    const hasHydrationFiber = fibers.some((fiber) => fiber && (fiber.op === 'hydration' || fiber.kind === 'hydration' || fiber.op === 'hydrate'));
    if (!hasHydrationFiber && records.length > 0) {
      diagnostics.push(hydrationDiagnostic(
        'xtend.maraca.hydration_fiber_missing',
        'error',
        'Strict hydration requires at least one schedulable hydration fiber.',
        {}
      ));
    }
  }

  (Array.isArray(artifact.diagnostics) ? artifact.diagnostics : []).forEach((diagnostic) => {
    diagnostics.push(hydrationDiagnostic(
      diagnostic.code || 'xtend.maraca.hydration_diagnostic',
      strict && diagnostic.severity !== 'info' ? 'error' : diagnostic.severity || 'warning',
      diagnostic.message || 'RMT hydration diagnostic.',
      diagnostic
    ));
  });

  const strictViolations = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const hasErrors = strictViolations > 0;
  return {
    schema: MARACA_HYDRATION_PLAN_SCHEMA,
    mode,
    strict,
    enabled: !hasErrors,
    status: hasErrors ? (strict ? 'blocked' : 'fallback') : 'planned',
    supported: true,
    artifact,
    runtimeModules: [],
    diagnostics,
    summary: {
      schema: artifact.schema || null,
      recordCount: records.length,
      supportedModeCount: supportedModes.size,
      hydrationPolicyCount: new Set(records.map((record) => record.policy).filter(Boolean)).size,
      insularIslandCount: Array.isArray(artifact.insularIslands) ? artifact.insularIslands.length : 0,
      strictViolations,
      kernelRequired: mode === 'strict',
      runtimeExpectedStatus: 'booted'
    }
  };
}

function createMaracaValidationPlan(compileResult, orchestrationPlan, kernelPlan, options) {
  const mode = options.validation || 'auto';
  const strict = mode === 'strict';

  if (mode === 'off') {
    return createBaseValidationPlan(mode, 'disabled', 'Maraca form validation orchestration is disabled for this build.');
  }

  if (!orchestrationPlan || !orchestrationPlan.enabled) {
    return createBaseValidationPlan(
      mode,
      strict ? 'blocked' : 'fallback',
      'Maraca form validation needs enabled app orchestration.'
    );
  }

  const artifact = orchestrationPlan.artifact && orchestrationPlan.artifact.validation
    || compileResult && compileResult.orchestrationArtifacts && compileResult.orchestrationArtifacts.validation
    || null;
  if (!artifact || !Array.isArray(artifact.groups) || artifact.groups.length === 0) {
    return createBaseValidationPlan(
      mode,
      strict ? 'blocked' : 'disabled',
      'RMT source did not emit a form validation plan for Maraca orchestration.'
    );
  }

  const diagnostics = [];
  const groups = Array.isArray(artifact.groups) ? artifact.groups : [];
  const fields = Array.isArray(artifact.fields) ? artifact.fields : [];
  const actionGates = Array.isArray(artifact.actionGates) ? artifact.actionGates : [];
  const statePatches = Array.isArray(artifact.statePatches) ? artifact.statePatches : [];

  groups.forEach((group) => {
    const hasFields = Array.isArray(group && group.fields) && group.fields.length > 0;
    const hasIncludes = Array.isArray(group && group.includes) && group.includes.length > 0;
    if (!group.id || (!hasFields && !hasIncludes)) {
      diagnostics.push(validationDiagnostic(
        'xtend.maraca.validation_group_incomplete',
        strict ? 'error' : 'warning',
        `Validation group ${group && group.id || '(unknown)'} needs fields or included validation groups.`,
        { validation: group && group.id || '' }
      ));
    }
  });

  fields.forEach((field) => {
    if (!field.state || !Array.isArray(field.rules) || field.rules.length === 0) {
      diagnostics.push(validationDiagnostic(
        'xtend.maraca.validation_field_incomplete',
        strict ? 'error' : 'warning',
        `Validation field ${field && field.state || '(unknown)'} needs a state and rules.`,
        { field: field && field.state || '' }
      ));
    }
    if (strict && !field.message) {
      diagnostics.push(validationDiagnostic(
        'xtend.maraca.validation_message_missing',
        'error',
        `Validation field ${field.state} needs a user-safe message.`,
        { field: field.state || '' }
      ));
    }
    if (strict && (!field.surface || !field.component)) {
      diagnostics.push(validationDiagnostic(
        'xtend.maraca.validation_component_capability_missing',
        'error',
        `Validation field ${field.state} needs a public validity-capable component surface.`,
        { field: field.state || '' }
      ));
    }
  });

  actionGates.forEach((gate) => {
    if (!gate.action || !gate.group) {
      diagnostics.push(validationDiagnostic(
        'xtend.maraca.validation_action_gate_incomplete',
        strict ? 'error' : 'warning',
        `Validation action gate ${gate && gate.id || '(unknown)'} is incomplete.`,
        { gate: gate && gate.id || '' }
      ));
    }
    if (strict && !gate.commandState) {
      diagnostics.push(validationDiagnostic(
        'xtend.maraca.validation_command_state_missing',
        'error',
        `Validation action ${gate.action} needs a matching command state for disabled patching.`,
        { action: gate.action || '' }
      ));
    }
  });

  if (strict && kernelPlan && kernelPlan.enabled) {
    const fibers = kernelPlan.artifact && kernelPlan.artifact.scheduler && Array.isArray(kernelPlan.artifact.scheduler.fibers)
      ? kernelPlan.artifact.scheduler.fibers
      : [];
    const validationOperations = new Set(actionGates.map((gate) => gate.operation).filter(Boolean));
    validationOperations.forEach((operation) => {
      const hasFiber = fibers.some((fiber) => fiber && fiber.operation === operation && fiber.endpointName);
      if (!hasFiber) {
        diagnostics.push(validationDiagnostic(
          'xtend.maraca.validation_fiber_missing',
          'error',
          `Strict validation requires a schedulable validation fiber for ${operation}.`,
          { operation }
        ));
      }
    });
  }

  (Array.isArray(artifact.diagnostics) ? artifact.diagnostics : []).forEach((diagnostic) => {
    diagnostics.push(validationDiagnostic(
      diagnostic.code || VALIDATION_STRICT_CODE,
      strict && diagnostic.severity !== 'info' ? 'error' : diagnostic.severity || 'warning',
      diagnostic.message || 'RMT form validation diagnostic.',
      diagnostic
    ));
  });

  const strictViolations = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const hasErrors = strictViolations > 0;
  return {
    schema: MARACA_VALIDATION_PLAN_SCHEMA,
    mode,
    strict,
    enabled: !hasErrors,
    status: hasErrors ? (strict ? 'blocked' : 'fallback') : 'planned',
    supported: true,
    artifact,
    runtimeModules: VALIDATION_RUNTIME_MODULES.slice(),
    diagnostics,
    summary: {
      schema: artifact.schema || null,
      groupCount: groups.length,
      fieldCount: fields.length,
      actionGateCount: actionGates.length,
      statePatchCount: statePatches.length,
      strictViolations,
      fallbackCount: 0,
      runtimeExpectedStatus: 'booted'
    }
  };
}

function createMaracaTransitionPlan(compileResult, orchestrationPlan, kernelPlan, options) {
  const mode = options.transitions || 'auto';
  const strict = mode === 'strict';

  if (mode === 'off') {
    return createBaseTransitionPlan(mode, 'disabled', 'Maraca surface transitions are disabled for this build.');
  }

  if (!orchestrationPlan || !orchestrationPlan.enabled) {
    return createBaseTransitionPlan(
      mode,
      strict ? 'blocked' : 'fallback',
      'Maraca surface transitions need enabled app orchestration.'
    );
  }

  const artifact = orchestrationPlan.artifact && orchestrationPlan.artifact.transitions
    || compileResult && compileResult.orchestrationArtifacts && compileResult.orchestrationArtifacts.transitions
    || null;
  if (!artifact || !Array.isArray(artifact.transitions) || artifact.transitions.length === 0) {
    return createBaseTransitionPlan(
      mode,
      strict ? 'blocked' : 'disabled',
      'RMT source did not emit a surface transition plan for Maraca orchestration.'
    );
  }

  const diagnostics = [];
  const transitions = Array.isArray(artifact.transitions) ? artifact.transitions : [];
  const supportedEffects = new Set(Array.isArray(artifact.supportedEffects) ? artifact.supportedEffects : []);
  const scheduledOperations = new Set(transitions.map((transition) => transition.operation).filter(Boolean));

  transitions.forEach((transition) => {
    if (!transition.id || !transition.trigger || !transition.trigger.id || !Array.isArray(transition.from) || !Array.isArray(transition.to)) {
      diagnostics.push(transitionDiagnostic(
        'xtend.maraca.transitions_record_incomplete',
        strict ? 'error' : 'warning',
        `Surface transition ${transition && transition.id || '(unknown)'} is incomplete.`,
        { transition: transition && transition.id || '' }
      ));
    }
    if (transition.effect && supportedEffects.size > 0 && !supportedEffects.has(transition.effect)) {
      diagnostics.push(transitionDiagnostic(
        'xtend.maraca.transitions_effect_unknown',
        strict ? 'error' : 'warning',
        `Surface transition ${transition.id} uses unknown effect ${transition.effect}.`,
        { transition: transition.id, effect: transition.effect }
      ));
    }
    if (!Number.isFinite(Number(transition.durationMs)) || Number(transition.durationMs) < 0 || Number(transition.durationMs) > 3000) {
      diagnostics.push(transitionDiagnostic(
        'xtend.maraca.transitions_duration_invalid',
        strict ? 'error' : 'warning',
        `Surface transition ${transition.id} needs a valid durationMs between 0 and 3000.`,
        { transition: transition.id, durationMs: transition.durationMs }
      ));
    }
  });

  if (strict && kernelPlan && kernelPlan.enabled) {
    const fibers = kernelPlan.artifact && kernelPlan.artifact.scheduler && Array.isArray(kernelPlan.artifact.scheduler.fibers)
      ? kernelPlan.artifact.scheduler.fibers
      : [];
    scheduledOperations.forEach((operation) => {
      const hasFiber = fibers.some((fiber) => fiber && fiber.operation === operation && fiber.endpointName);
      if (!hasFiber) {
        diagnostics.push(transitionDiagnostic(
          'xtend.maraca.transitions_fiber_missing',
          'error',
          `Strict surface transitions require a schedulable transition fiber for ${operation}.`,
          { operation }
        ));
      }
    });
  }

  (Array.isArray(artifact.diagnostics) ? artifact.diagnostics : []).forEach((diagnostic) => {
    diagnostics.push(transitionDiagnostic(
      diagnostic.code || TRANSITION_STRICT_CODE,
      strict && diagnostic.severity !== 'info' ? 'error' : diagnostic.severity || 'warning',
      diagnostic.message || 'RMT surface transition diagnostic.',
      diagnostic
    ));
  });

  const strictViolations = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const hasErrors = strictViolations > 0;
  return {
    schema: MARACA_TRANSITION_PLAN_SCHEMA,
    mode,
    strict,
    enabled: !hasErrors,
    status: hasErrors ? (strict ? 'blocked' : 'fallback') : 'planned',
    supported: true,
    artifact,
    runtimeModules: TRANSITION_RUNTIME_MODULES.slice(),
    diagnostics,
    summary: {
      schema: artifact.schema || null,
      transitionCount: transitions.length,
      effectCounts: artifact.effectCounts || {},
      durationRange: artifact.durationRange || { min: 0, max: 0 },
      xstateModule: 'components/xstate.js',
      xutilsModule: 'components/xutils.js',
      scheduledEndpointCount: scheduledOperations.size,
      fallbackCount: 0,
      strictViolations,
      runtimeExpectedStatus: 'booted'
    }
  };
}

function isMaterializableTarget(target) {
  const value = String(target || '').trim();
  if (!value) return false;
  if (value.startsWith('#') || value.startsWith('.') || value.startsWith('[data-')) return true;
  if (/^[a-z][a-z0-9.-]*$/u.test(value)) return true;
  if (/^\[data-[a-z0-9_-]+=(?:"[^"]+"|'[^']+')\]$/u.test(value)) return true;
  return false;
}

function createMaracaOrchestrationPlan(compileResult, coreDocument, componentRecords, options) {
  const mode = options.orchestration || 'auto';
  const strict = mode === 'strict';

  if (mode === 'off') {
    return createBaseOrchestrationPlan(mode, 'disabled', 'Maraca orchestration is disabled for this build.');
  }

  const artifact = compileResult && compileResult.orchestrationArtifacts || null;
  if (!artifact) {
    return createBaseOrchestrationPlan(mode, strict ? 'blocked' : 'fallback', 'RMT source did not emit an app orchestration artifact.');
  }

  const diagnostics = [];
  const surfaces = Array.isArray(artifact.surfaces) ? artifact.surfaces : [];
  const portals = Array.isArray(artifact.portals) ? artifact.portals : [];
  const resources = Array.isArray(artifact.resources) ? artifact.resources : [];
  const events = Array.isArray(artifact.events) ? artifact.events : [];
  const portalIds = new Set(portals.map((portal) => portal.id));
  const surfaceIds = new Set(surfaces.map((surface) => surface.id));

  (Array.isArray(artifact.diagnostics) ? artifact.diagnostics : []).forEach((diagnostic) => {
    const severity = strict && diagnostic.severity !== 'info' ? 'error' : diagnostic.severity || 'warning';
    diagnostics.push(orchestrationDiagnostic(
      diagnostic.code || ORCHESTRATION_STRICT_CODE,
      severity,
      diagnostic.message || 'RMT orchestration diagnostic.',
      diagnostic
    ));
  });

  events.forEach((event) => {
    if (!event.payloadContract || !Array.isArray(event.payloadContract.required) || event.payloadContract.required.length === 0) {
      diagnostics.push(orchestrationDiagnostic(
        'xtend.maraca.orchestration_event_contract_missing',
        strict ? 'error' : 'warning',
        `Event ${event.id} needs a payload contract for strict orchestration.`,
        { event: event.id }
      ));
    }
    if (!isMaterializableTarget(event.target)) {
      diagnostics.push(orchestrationDiagnostic(
        'xtend.maraca.orchestration_target_unresolved',
        strict ? 'error' : 'warning',
        `Event ${event.id} target cannot be materialized safely.`,
        { event: event.id, target: event.target || '' }
      ));
    }
  });

  resources.forEach((resource) => {
    if (!resource.owner) {
      diagnostics.push(orchestrationDiagnostic(
        'xtend.maraca.orchestration_resource_owner_missing',
        strict ? 'error' : 'warning',
        `Resource ${resource.id} needs an owner for strict orchestration.`,
        { resource: resource.id }
      ));
    }
  });

  surfaces.forEach((surface) => {
    if (surface.portal && !portalIds.has(surface.portal)) {
      diagnostics.push(orchestrationDiagnostic(
        'xtend.maraca.orchestration_portal_unresolved',
        strict ? 'error' : 'warning',
        `Surface ${surface.id} references unresolved portal ${surface.portal}.`,
        { surface: surface.id, portal: surface.portal }
      ));
    }
    if (strict && surface.id && !surfaceIds.has(surface.id)) {
      diagnostics.push(orchestrationDiagnostic(
        'xtend.maraca.orchestration_surface_unresolved',
        'error',
        `Surface ${surface.id} is not part of the orchestration surface graph.`,
        { surface: surface.id }
      ));
    }
  });

  if (strict && componentRecords.unknown.length > 0) {
    diagnostics.push(orchestrationDiagnostic(
      'xtend.maraca.orchestration_component_unknown',
      'error',
      'Strict orchestration requires all component tags to be known at build time.',
      { tags: componentRecords.unknown.slice() }
    ));
  }

  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  return {
    schema: MARACA_ORCHESTRATION_PLAN_SCHEMA,
    mode,
    strict,
    enabled: !hasErrors,
    status: hasErrors ? (strict ? 'blocked' : 'fallback') : 'planned',
    supported: true,
    artifact,
    runtimeModules: ORCHESTRATION_RUNTIME_MODULES.slice(),
    diagnostics,
    summary: {
      schema: artifact.schema,
      runtimeOrder: Array.isArray(artifact.runtimeOrder) ? artifact.runtimeOrder.slice() : [],
      stateCount: artifact.state && Array.isArray(artifact.state.states) ? artifact.state.states.length : 0,
      selectorCount: artifact.state && Array.isArray(artifact.state.selectors) ? artifact.state.selectors.length : 0,
      reducerCount: artifact.state && Array.isArray(artifact.state.reducers) ? artifact.state.reducers.length : 0,
      actionCount: artifact.actions && Array.isArray(artifact.actions.actions) ? artifact.actions.actions.length : 0,
      eventCount: events.length,
      surfaceCount: surfaces.length,
      portalCount: portals.length,
      overlayCount: Array.isArray(artifact.overlays) ? artifact.overlays.length : 0,
      resourceCount: resources.length
    }
  };
}

function createMaracaBuildPlan(input = {}, options = {}) {
  const normalized = normalizeOptions(input, options);
  const diagnostics = [];

  if (typeof normalized.sourceText !== 'string' && !fs.existsSync(normalized.sourcePath)) {
    return {
      schema: MARACA_BUILD_PLAN_SCHEMA,
      ok: false,
      status: 'source_missing',
      source: normalized.source,
      sourcePath: normalized.sourcePath,
      rootDir: normalized.rootDir,
      profile: normalized.profile,
      lazy: normalized.lazy,
      css: normalized.css,
      vendor: normalized.vendor,
      componentMode: normalized.componentMode,
      stackMode: normalized.stackMode,
      orchestrationMode: normalized.orchestration,
      kernelMode: normalized.kernel,
      hydrationMode: normalized.hydration,
      validationMode: normalized.validation,
      transitionsMode: normalized.transitions,
      sizeBudgetMode: normalized.sizeBudget,
      outputDir: normalized.outputDir,
      diagnostics: [{
        code: 'xtend.maraca.source_missing',
        severity: 'error',
        message: `RMT source not found: ${normalized.sourcePath}`
      }],
      toolchain: getMaracaToolchainAvailability(normalized.rootDir),
      components: { requiredTags: [], selected: [], unknown: [] },
      surfaces: [],
      events: [],
      lanes: [],
      runtimeModules: [],
      stackModules: [],
      orchestration: createBaseOrchestrationPlan(normalized.orchestration, 'unavailable', 'RMT source file is missing.'),
      kernel: createBaseKernelPlan(normalized.kernel, 'unavailable', 'RMT source file is missing.'),
      hydration: createBaseHydrationPlan(normalized.hydration, 'unavailable', 'RMT source file is missing.'),
      validation: createBaseValidationPlan(normalized.validation, 'unavailable', 'RMT source file is missing.'),
      transitions: createBaseTransitionPlan(normalized.transitions, 'unavailable', 'RMT source file is missing.'),
      publicNameReservations: Array.from(PUBLIC_NAME_RESERVATIONS)
    };
  }

  const { sourceText, compileResult } = compileSource(normalized);
  if (!compileResult.ok || !compileResult.coreDocument) {
    const compilerDiagnostics = Array.isArray(compileResult.diagnostics) ? compileResult.diagnostics : [];
    return {
      schema: MARACA_BUILD_PLAN_SCHEMA,
      ok: false,
      status: 'compile_failed',
      source: repoRelative(normalized.sourcePath, normalized.rootDir),
      sourcePath: normalized.sourcePath,
      rootDir: normalized.rootDir,
      sourceHash: hashText(sourceText),
      profile: normalized.profile,
      lazy: normalized.lazy,
      css: normalized.css,
      vendor: normalized.vendor,
      componentMode: normalized.componentMode,
      stackMode: normalized.stackMode,
      orchestrationMode: normalized.orchestration,
      kernelMode: normalized.kernel,
      hydrationMode: normalized.hydration,
      validationMode: normalized.validation,
      transitionsMode: normalized.transitions,
      sizeBudgetMode: normalized.sizeBudget,
      outputDir: normalized.outputDir,
      diagnostics: [{
        code: COMPILER_ERROR_CODE,
        severity: 'error',
        message: 'RMT vNext compiler did not produce a Core document.'
      }].concat(compilerDiagnostics),
      toolchain: getMaracaToolchainAvailability(normalized.rootDir),
      components: { requiredTags: [], selected: [], unknown: [] },
      surfaces: [],
      events: [],
      lanes: [],
      runtimeModules: [],
      stackModules: [],
      orchestration: createBaseOrchestrationPlan(normalized.orchestration, 'unavailable', 'RMT source did not compile.'),
      kernel: createBaseKernelPlan(normalized.kernel, 'unavailable', 'RMT source did not compile.'),
      hydration: createBaseHydrationPlan(normalized.hydration, 'unavailable', 'RMT source did not compile.'),
      validation: createBaseValidationPlan(normalized.validation, 'unavailable', 'RMT source did not compile.'),
      transitions: createBaseTransitionPlan(normalized.transitions, 'unavailable', 'RMT source did not compile.'),
      publicNameReservations: Array.from(PUBLIC_NAME_RESERVATIONS)
    };
  }

  const coreDocument = compileResult.coreDocument;
  const componentManifest = loadComponentManifest(normalized.rootDir);
  const surfaces = collectSurfaces(coreDocument);
  const requiredTags = collectRequestedTags(surfaces, componentManifest, normalized);
  const componentRecords = createComponentRecords(requiredTags, componentManifest, normalized);
  diagnostics.push(...componentRecords.diagnostics);

  let runtimeModules = buildRuntimeModuleList(coreDocument);
  const orchestration = createMaracaOrchestrationPlan(compileResult, coreDocument, componentRecords, normalized);
  if (orchestration.enabled) {
    runtimeModules = Array.from(new Set(runtimeModules.concat(ORCHESTRATION_RUNTIME_MODULES))).sort();
  }
  const kernel = createMaracaKernelPlan(compileResult, orchestration, normalized);
  if (kernel.enabled) {
    runtimeModules = Array.from(new Set(runtimeModules.concat(KERNEL_RUNTIME_MODULES))).sort();
  }
  const hydration = createMaracaHydrationPlan(compileResult, orchestration, kernel, normalized);
  const validation = createMaracaValidationPlan(compileResult, orchestration, kernel, normalized);
  if (validation.enabled) {
    runtimeModules = Array.from(new Set(runtimeModules.concat(VALIDATION_RUNTIME_MODULES))).sort();
  }
  const transitions = createMaracaTransitionPlan(compileResult, orchestration, kernel, normalized);
  if (transitions.enabled) {
    runtimeModules = Array.from(new Set(runtimeModules.concat(TRANSITION_RUNTIME_MODULES))).sort();
  }
  diagnostics.push(...orchestration.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  diagnostics.push(...kernel.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  diagnostics.push(...hydration.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  diagnostics.push(...validation.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  diagnostics.push(...transitions.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  const ok = diagnostics.every((diagnostic) => diagnostic.severity !== 'error');
  const stackModules = resolveStackModuleRecords(runtimeModules, normalized, orchestration, kernel, validation, transitions);
  const selectedWithPolicy = componentRecords.selected.map((entry) => ({
    ...entry,
    lazy: entry.native ? false : normalized.lazy !== 'none',
    sideEffectBoundary: entry.sideEffectBoundary || 'selected-component-module'
  }));

  return {
    schema: MARACA_BUILD_PLAN_SCHEMA,
    ok,
    status: ok ? 'planned' : 'blocked',
    source: repoRelative(normalized.sourcePath, normalized.rootDir),
    sourcePath: normalized.sourcePath,
    rootDir: normalized.rootDir,
    sourceHash: hashText(sourceText),
    profile: normalized.profile,
    lazy: normalized.lazy,
    css: normalized.css,
    vendor: normalized.vendor,
    componentMode: normalized.componentMode,
    stackMode: normalized.stackMode,
    orchestrationMode: normalized.orchestration,
    kernelMode: normalized.kernel,
    hydrationMode: normalized.hydration,
    validationMode: normalized.validation,
    transitionsMode: normalized.transitions,
    sizeBudgetMode: normalized.sizeBudget,
    outputDir: normalized.outputDir,
    diagnostics,
    toolchain: getMaracaToolchainAvailability(normalized.rootDir),
    loader: {
      mode: 'inline-registry',
      usesExternalManifest: false,
      usesXtendLoader: false,
      manifestParseAtRuntime: false
    },
    rmt: {
      compilerSchema: compileResult.schema || null,
      coreSchema: coreDocument.schema || null,
      documentId: coreDocument.manifest && coreDocument.manifest.documentId || null,
      artifactCount: Number(compileResult.artifactCount || 0)
    },
    components: {
      requiredTags,
      selected: selectedWithPolicy,
      unknown: componentRecords.unknown,
      allowDynamicComponents: normalized.allowDynamicComponents
    },
    surfaces,
    events: collectEvents(coreDocument, orchestration),
    lanes: collectLanes(coreDocument),
    state: collectInitialState(coreDocument),
    runtimeModules,
    stackModules,
    orchestration,
    kernel,
    hydration,
    validation,
    transitions,
    stack: {
      mode: normalized.stackMode,
      included: stackModules.map((entry) => entry.source),
      fullStackAvailable: Array.from(XTEND_VENDOR_STACK_MODULES)
    },
    fabric: {
      lanes: collectLanes(coreDocument).map((lane) => lane.name).filter(Boolean),
      laneMapping: 'xtend.fabric.rmt-lane-mapping.v1'
    },
    outputs: {
      entry: path.join(normalized.outputDir, 'xtend.maraca.mjs'),
      css: normalized.css === 'external' ? path.join(normalized.outputDir, 'xtend.maraca.css') : null,
      bundleReport: path.join(normalized.outputDir, 'xtend.maraca.report.json'),
      sizeBudgetReport: path.join(normalized.outputDir, 'xtend.maraca.size.json')
    },
    publicNameReservations: Array.from(PUBLIC_NAME_RESERVATIONS),
    propertyMangling: {
      profile: normalized.profile,
      enabled: normalized.profile === 'max',
      mode: normalized.profile === 'max' ? 'private-only-with-public-reservations' : 'disabled',
      reserved: Array.from(PUBLIC_NAME_RESERVATIONS)
    }
  };
}

function jsValue(value) {
  return JSON.stringify(value, null, 2);
}

function cssAttributeValue(value) {
  return String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function cssLength(value) {
  return Number.isFinite(value) ? `${Math.max(0, value)}px` : null;
}

function createCssText(plan = null) {
  const rules = [
    ':where([data-maraca-root]){display:grid;gap:12px;align-content:start;font-family:system-ui,sans-serif;}',
    ':where([data-maraca-surface]){box-sizing:border-box;}',
    ':where([data-maraca-surface][data-xt-surface-transitioning]){will-change:opacity,transform;}'
  ];
  const cssPlan = plan && plan.orchestration && plan.orchestration.enabled && plan.orchestration.artifact && plan.orchestration.artifact.css;
  const surfaces = cssPlan && Array.isArray(cssPlan.surfaces) ? cssPlan.surfaces : [];
  surfaces.forEach((surface) => {
    const bounds = surface && surface.bounds || {};
    const width = cssLength(bounds.width);
    const height = cssLength(bounds.height);
    const declarations = [
      width ? `inline-size:${width}` : '',
      height ? `min-block-size:${height}` : '',
      Number.isFinite(bounds.x) ? `--xtend-surface-x:${bounds.x}px` : '',
      Number.isFinite(bounds.y) ? `--xtend-surface-y:${bounds.y}px` : ''
    ].filter(Boolean);
    if (surface && surface.id && declarations.length > 0) {
      rules.push(`:where([data-maraca-surface="${cssAttributeValue(surface.id)}"]){${declarations.join(';')};}`);
    }
  });
  return rules.join('');
}

function createBundleSource(plan) {
  const outDir = plan.outputDir;
  const stackEntries = (plan.stackModules || []).map((entry) => ({
    id: entry.id || entry.source,
    module: ensureRelativeImport(outDir, entry.absolutePath)
  }));
  const componentEntries = plan.components.selected.map((entry) => ({
    tag: entry.tag,
    module: entry.native ? null : ensureRelativeImport(outDir, entry.absolutePath),
    native: Boolean(entry.native)
  }));
  const surfaces = plan.surfaces.map((surface) => ({
    id: surface.id,
    kind: surface.kind,
    component: surface.component,
    source: surface.source,
    bounds: surface.bounds,
    portal: surface.portal,
    resources: surface.resources || [],
    events: surface.eventRefs || []
  }));
  const orchestrationBundle = plan.orchestration && plan.orchestration.enabled ? {
    enabled: true,
    mode: plan.orchestration.mode,
    strict: plan.orchestration.strict,
    status: plan.orchestration.status,
    schema: plan.orchestration.artifact && plan.orchestration.artifact.schema,
    artifact: plan.orchestration.artifact,
    diagnostics: plan.orchestration.diagnostics,
    summary: plan.orchestration.summary
  } : {
    enabled: false,
    mode: plan.orchestration && plan.orchestration.mode || 'auto',
    strict: false,
    status: plan.orchestration && plan.orchestration.status || 'disabled',
    schema: null,
    artifact: null,
    diagnostics: plan.orchestration && plan.orchestration.diagnostics || [],
    summary: plan.orchestration && plan.orchestration.summary || {}
  };
  const kernelBundle = plan.kernel && plan.kernel.enabled ? {
    enabled: true,
    mode: plan.kernel.mode,
    strict: plan.kernel.strict,
    status: plan.kernel.status,
    schema: plan.kernel.artifact && plan.kernel.artifact.schema,
    artifact: plan.kernel.artifact,
    diagnostics: plan.kernel.diagnostics,
    summary: plan.kernel.summary,
    runtimeModules: plan.kernel.runtimeModules
  } : {
    enabled: false,
    mode: plan.kernel && plan.kernel.mode || 'auto',
    strict: false,
    status: plan.kernel && plan.kernel.status || 'disabled',
    schema: null,
    artifact: null,
    diagnostics: plan.kernel && plan.kernel.diagnostics || [],
    summary: plan.kernel && plan.kernel.summary || {},
    runtimeModules: plan.kernel && plan.kernel.runtimeModules || []
  };
  const hydrationBundle = plan.hydration && plan.hydration.enabled ? {
    enabled: true,
    mode: plan.hydration.mode,
    strict: plan.hydration.strict,
    status: plan.hydration.status,
    schema: plan.hydration.artifact && plan.hydration.artifact.schema,
    artifact: plan.hydration.artifact,
    diagnostics: plan.hydration.diagnostics,
    summary: plan.hydration.summary
  } : {
    enabled: false,
    mode: plan.hydration && plan.hydration.mode || 'auto',
    strict: false,
    status: plan.hydration && plan.hydration.status || 'disabled',
    schema: null,
    artifact: null,
    diagnostics: plan.hydration && plan.hydration.diagnostics || [],
    summary: plan.hydration && plan.hydration.summary || {}
  };
  const validationBundle = plan.validation && plan.validation.enabled ? {
    enabled: true,
    mode: plan.validation.mode,
    strict: plan.validation.strict,
    status: plan.validation.status,
    schema: plan.validation.artifact && plan.validation.artifact.schema,
    artifact: plan.validation.artifact,
    diagnostics: plan.validation.diagnostics,
    summary: plan.validation.summary
  } : {
    enabled: false,
    mode: plan.validation && plan.validation.mode || 'auto',
    strict: false,
    status: plan.validation && plan.validation.status || 'disabled',
    schema: null,
    artifact: null,
    diagnostics: plan.validation && plan.validation.diagnostics || [],
    summary: plan.validation && plan.validation.summary || {}
  };
  const transitionBundle = plan.transitions && plan.transitions.enabled ? {
    enabled: true,
    mode: plan.transitions.mode,
    strict: plan.transitions.strict,
    status: plan.transitions.status,
    schema: plan.transitions.artifact && plan.transitions.artifact.schema,
    artifact: plan.transitions.artifact,
    diagnostics: plan.transitions.diagnostics,
    summary: plan.transitions.summary
  } : {
    enabled: false,
    mode: plan.transitions && plan.transitions.mode || 'auto',
    strict: false,
    status: plan.transitions && plan.transitions.status || 'disabled',
    schema: null,
    artifact: null,
    diagnostics: plan.transitions && plan.transitions.diagnostics || [],
    summary: plan.transitions && plan.transitions.summary || {}
  };
  const css = createCssText(plan);
  const header = [
    `const MARACA_COMPONENTS = Object.freeze(${jsValue(componentEntries)});`,
    `const MARACA_SURFACES = Object.freeze(${jsValue(surfaces)});`,
    `const MARACA_STATE = Object.freeze(${jsValue(plan.state || {})});`,
    `const MARACA_EVENTS = Object.freeze(${jsValue(plan.events || [])});`,
    `const MARACA_ORCHESTRATION = Object.freeze(${jsValue(orchestrationBundle)});`,
    `const MARACA_KERNEL = Object.freeze(${jsValue(kernelBundle)});`,
    `const MARACA_HYDRATION = Object.freeze(${jsValue(hydrationBundle)});`,
    `const MARACA_VALIDATION = Object.freeze(${jsValue(validationBundle)});`,
    `const MARACA_TRANSITIONS = Object.freeze(${jsValue(transitionBundle)});`,
    `const MARACA_PUBLIC_NAMES = Object.freeze(${jsValue(plan.publicNameReservations)});`,
    `const MARACA_STACK_MODULES = Object.freeze(${jsValue(stackEntries)});`,
    `const MARACA_LAZY_MODE = ${JSON.stringify(plan.lazy)};`
  ];

  stackEntries.forEach((entry) => {
    if (plan.kernel && plan.kernel.enabled && entry.id === 'xtendrmt/rmt-runtime.esm.js') return;
    if (plan.kernel && plan.kernel.enabled && entry.id === 'xtendrmt/rmt-kernel-orchestration-controller.js') return;
    header.unshift(`import "${entry.module}";`);
  });
  if (plan.kernel && plan.kernel.enabled) {
    header.unshift(`import * as XTendMaracaKernelRuntimeModule from "./${KERNEL_RUNTIME_BUNDLE_FILE}";`);
    header.unshift(`import "./${KERNEL_CONTROLLER_BUNDLE_FILE}";`);
  } else {
    header.push('const XTendMaracaKernelRuntimeModule = null;');
  }

  if (plan.lazy === 'none') {
    componentEntries.forEach((entry) => {
      if (entry.native) return;
      header.unshift(`import "${entry.module}";`);
    });
    header.push('const MARACA_IMPORTERS = Object.freeze(Object.fromEntries(MARACA_COMPONENTS.map((entry) => [entry.tag, entry.native ? () => Promise.resolve(entry.tag) : () => Promise.resolve(entry.module)])));');
  } else {
    const importers = componentEntries
      .map((entry) => entry.native
        ? `  ${JSON.stringify(entry.tag)}: () => Promise.resolve(${JSON.stringify(entry.tag)})`
        : `  ${JSON.stringify(entry.tag)}: () => import(${JSON.stringify(entry.module)})`)
      .join(',\n');
    header.push(`const MARACA_IMPORTERS = Object.freeze({\n${importers}\n});`);
  }

  if (plan.css === 'inline') {
    header.push(`const MARACA_CSS_TEXT = ${JSON.stringify(css)};`);
  } else {
    header.push('const MARACA_CSS_HREF = new URL("./xtend.maraca.css", import.meta.url).href;');
  }

  return `${header.join('\n')}

const MARACA_SCHEMA = ${JSON.stringify(MARACA_BUNDLE_REPORT_SCHEMA)};

function attachMaracaCss(root) {
  if (typeof document === "undefined") return;
  if (${JSON.stringify(plan.css)} === "inline") {
    if (document.querySelector("style[data-maraca-style]")) return;
    const style = document.createElement("style");
    style.setAttribute("data-maraca-style", "inline");
    style.textContent = MARACA_CSS_TEXT;
    (document.head || root || document.documentElement).appendChild(style);
    return;
  }
  if (document.querySelector("link[data-maraca-style]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = MARACA_CSS_HREF;
  link.setAttribute("data-maraca-style", "external");
  (document.head || root || document.documentElement).appendChild(link);
}

async function ensureMaracaComponent(tag) {
  const load = MARACA_IMPORTERS[tag];
  if (!load) {
    throw new Error("XTend Maraca has no inline registry entry for " + tag);
  }
  await load();
  return tag;
}

async function ensureMaracaComponents(tags) {
  const uniqueTags = Array.from(new Set((tags || []).filter(Boolean)));
  if (uniqueTags.length === 0) return [];
  const loaded = [];
  for (const tag of uniqueTags) {
    loaded.push(await ensureMaracaComponent(tag));
  }
  return loaded;
}

function requestMaracaComponent(tag, metadata = {}) {
  if (!tag || typeof tag !== "string") return null;
  const load = ensureMaracaComponent(tag)
    .then(() => {
      dispatchMaracaEvent("xtend-maraca:component-load", {
        tag,
        strategy: metadata.strategy || "visibility"
      });
      return tag;
    })
    .catch((error) => {
      dispatchMaracaEvent("xtend-maraca:component-error", {
        tag,
        strategy: metadata.strategy || "visibility",
        message: error && error.message ? error.message : String(error)
      });
      return null;
    });
  return load;
}

function stateForSurface(surface) {
  if (!surface || !surface.source) return {};
  return MARACA_STATE[surface.source] || {};
}

function createSurfaceElement(surface) {
  const tag = surface.component || "section";
  const element = document.createElement(tag);
  element.setAttribute("data-maraca-surface", surface.id || tag);
  element.setAttribute("data-rmt-component", tag);
  const state = stateForSurface(surface);
  syncMaracaStateAttributes(element, state, tag);
  if (state.text) element.textContent = String(state.text);
  if (surface.kind) element.setAttribute("data-maraca-kind", String(surface.kind));
  return element;
}

function syncMaracaStateAttributes(element, state = {}, component = "", context = {}) {
  if (!element || !state || typeof state !== "object") return;
  const setIfPresent = (attribute, stateKey = attribute) => {
    if (Object.prototype.hasOwnProperty.call(state, stateKey)) {
      if (attribute === "hidden" && context.transitionRuntime && typeof context.transitionRuntime.applyVisibilityPatch === "function") {
        const nextHidden = state[stateKey] === true;
        const previousHidden = typeof element.hasAttribute === "function" ? element.hasAttribute("hidden") : false;
        if (!nextHidden) {
          requestMaracaComponent(component || (element.getAttribute && element.getAttribute("data-rmt-component")) || "", {
            strategy: "visibility"
          });
        }
        const transitionResult = context.transitionRuntime.applyVisibilityPatch({
          surface: context.surface && context.surface.id || (element.getAttribute && element.getAttribute("data-maraca-surface")) || "",
          element,
          nextHidden,
          previousHidden,
          action: context.action || "",
          metadata: {
            operation: context.operation || "",
            correlationId: context.correlationId || ""
          }
        });
        if (transitionResult && typeof transitionResult.then === "function") {
          transitionResult.catch((error) => dispatchMaracaEvent("xtend-maraca:surface-transition-error", createMaracaErrorDiagnostic("xtend.maraca.surface_transition_patch_error", error)));
        }
        return;
      }
      setMaracaAttribute(element, attribute, state[stateKey]);
    }
  };
  setIfPresent("id");
  setIfPresent("tone");
  setIfPresent("hidden");
  setIfPresent("name");
  setIfPresent("value");
  setIfPresent("placeholder");
  setIfPresent("label");
  setIfPresent("required");
  setIfPresent("disabled");
  setIfPresent("invalid");
  setIfPresent("rows");
  setIfPresent("density");
  setIfPresent("minlength", "minLength");
  setIfPresent("maxlength", "maxLength");
  setIfPresent("data-field", "field");
  if (Object.prototype.hasOwnProperty.call(state, "inputType")) {
    setMaracaAttribute(element, "type", state.inputType);
  }
  if (Object.prototype.hasOwnProperty.call(state, "mediaType")) {
    setMaracaAttribute(element, "type", state.mediaType);
  }
  [
    "src",
    "poster",
    "title",
    "subtitle",
    "kind",
    "count",
    "selected",
    "controls",
    "open",
    "accept",
    "multiple",
    "active",
    "minimized",
    "maximized",
    "resizable",
    "draggable",
    "modal",
    "pinned",
    "collapsed",
    "placement",
    "mode"
  ].forEach((attribute) => setIfPresent(attribute));
  [
    ["surface-id", "surfaceId"],
    ["manager-id", "managerId"],
    ["state-key", "stateKey"],
    ["data-record-id", "recordId"],
    ["data-media-id", "mediaId"],
    ["restore-key", "restoreKey"],
    ["persistence-mode", "persistenceMode"],
    ["restore-policy", "restorePolicy"],
    ["surface-loading-policy", "surfaceLoadingPolicy"],
    ["surface-skeleton", "surfaceSkeleton"],
    ["surface-hydration-timeout", "surfaceHydrationTimeout"],
    ["route-lifecycle-policy", "routeLifecyclePolicy"],
    ["modal-policy", "modalPolicy"],
    ["layout-engine", "layoutEngine"],
    ["surface-layout-gap", "surfaceLayoutGap"],
    ["surface-layout-snap", "surfaceLayoutSnap"],
    ["initial-x", "initialX"],
    ["initial-y", "initialY"],
    ["initial-width", "initialWidth"],
    ["initial-height", "initialHeight"],
    ["responsive-mode", "responsiveMode"]
  ].forEach(([attribute, stateKey]) => setIfPresent(attribute, stateKey));
  if (component === "x-status") {
    setIfPresent("type", "tone");
    setIfPresent("state", "tone");
    setIfPresent("message", "text");
  }
  if (component === "x-button") {
    setIfPresent("variant", "tone");
    setIfPresent("label", "text");
    setIfPresent("data-label", "text");
  }
}

function collectSurfaceDescriptors(node, target = new Map()) {
  if (!node || typeof node !== "object") return target;
  if (Array.isArray(node)) {
    node.forEach((entry) => collectSurfaceDescriptors(entry, target));
    return target;
  }
  if (typeof node.surface === "string" && node.surface) {
    target.set(node.surface, node);
  }
  [
    "children",
    "nodes",
    "then",
    "else",
    "fallback",
    "template",
    "node",
    "descriptor"
  ].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      collectSurfaceDescriptors(node[key], target);
    }
  });
  Object.values(node.slots || {}).forEach((slot) => collectSurfaceDescriptors(slot, target));
  return target;
}

function surfaceDescriptorNeedsStructuredPatch(descriptor) {
  if (!descriptor || typeof descriptor !== "object") return false;
  return Boolean(
    descriptor.children
    || descriptor.nodes
    || Object.prototype.hasOwnProperty.call(descriptor, "text")
    || descriptor.slots
  );
}

function descriptorHasNestedSurface(descriptor, ownSurfaceId = "") {
  if (!descriptor || typeof descriptor !== "object") return false;
  const stack = [];
  [
    "children",
    "nodes",
    "then",
    "else",
    "fallback",
    "template",
    "node",
    "descriptor"
  ].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(descriptor, key)) stack.push(descriptor[key]);
  });
  Object.values(descriptor.slots || {}).forEach((slot) => stack.push(slot));
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (Array.isArray(node)) {
      stack.push(...node);
      continue;
    }
    if (typeof node.surface === "string" && node.surface && node.surface !== ownSurfaceId) return true;
    [
      "children",
      "nodes",
      "then",
      "else",
      "fallback",
      "template",
      "node",
      "descriptor"
    ].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(node, key)) stack.push(node[key]);
    });
    Object.values(node.slots || {}).forEach((slot) => stack.push(slot));
  }
  return false;
}

function collectDescriptorComponentTags(node, target = new Set()) {
  if (!node || typeof node !== "object") return target;
  if (Array.isArray(node)) {
    node.forEach((entry) => collectDescriptorComponentTags(entry, target));
    return target;
  }
  const tag = String(node.tag || node.component || "").trim().toLowerCase();
  if (tag) target.add(tag);
  [
    "children",
    "nodes",
    "then",
    "else",
    "fallback",
    "template",
    "node",
    "descriptor"
  ].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      collectDescriptorComponentTags(node[key], target);
    }
  });
  Object.values(node.slots || {}).forEach((slot) => collectDescriptorComponentTags(slot, target));
  return target;
}

function shouldPatchSurfaceDescriptorStructure(descriptor, element, metadata = {}) {
  if (!surfaceDescriptorNeedsStructuredPatch(descriptor)) return false;
  const tag = String(
    descriptor && (descriptor.tag || descriptor.component)
    || element && (element.localName || element.tagName)
    || ""
  ).toLowerCase();
  const surfaceId = descriptor && descriptor.surface || "";
  if (tag === "x-surface-manager" || descriptorHasNestedSurface(descriptor, surfaceId)) return false;
  if (metadata.operation === "surface-xstate-projection" && surfaceId !== "media.manager.dock") return false;
  return true;
}

function createMaracaRenderContext(stateRuntime) {
  const componentEntries = MARACA_COMPONENTS.map((entry) => ({ id: entry.tag, tag: entry.tag }));
  return stateRuntime && typeof stateRuntime.createRenderContext === "function"
    ? stateRuntime.createRenderContext({ components: componentEntries })
    : { model: MARACA_STATE, components: componentEntries };
}

function resolveLazyStrategy(options) {
  if (MARACA_LAZY_MODE === "none") return "eager";
  const requested = options.lazyStrategy || options.lazy || "viewport";
  if (requested === "eager" || requested === "immediate") return "eager";
  if (requested === "viewport" && typeof IntersectionObserver === "function") return "viewport";
  return "eager";
}

function dispatchMaracaEvent(name, detail) {
  if (typeof window === "undefined" || typeof CustomEvent !== "function") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function cloneMaracaValue(value, fallback = null) {
  if (typeof value === "undefined") return fallback;
  if (value === null || typeof value !== "object") return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
}

function readMaracaPath(source, path) {
  if (!path) return source;
  const parts = String(path).split(".").filter(Boolean);
  let cursor = source;
  for (const part of parts) {
    if (cursor == null) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function writeMaracaPath(target, path, value) {
  const parts = String(path || "").split(".").filter(Boolean);
  if (parts.length === 0) return value;
  let cursor = target;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value;
      return;
    }
    if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  });
  return target;
}

function setMaracaAttribute(element, name, value) {
  if (!element || !name) return;
  if (value === false || value === null || typeof value === "undefined" || value === "") {
    if (typeof element.removeAttribute === "function") element.removeAttribute(name);
    if (name === "hidden" && element.style && element.getAttribute && element.getAttribute("data-rmt-hidden-display") === "true") {
      element.style.display = "";
      if (typeof element.removeAttribute === "function") element.removeAttribute("data-rmt-hidden-display");
    }
    return;
  }
  if (name === "id") {
    element.id = String(value);
    return;
  }
  if (typeof element.setAttribute === "function") {
    element.setAttribute(name, value === true ? "" : String(value));
    if (name === "hidden" && element.style) {
      element.style.display = "none";
      element.setAttribute("data-rmt-hidden-display", "true");
    }
  }
}

function sanitizeMaracaDiagnostic(value) {
  if (Array.isArray(value)) return value.map(sanitizeMaracaDiagnostic);
  if (!value || typeof value !== "object") return value;
  const result = {};
  Object.entries(value).forEach(([key, entry]) => {
    const normalized = key.toLowerCase();
    if (normalized.includes("payload") || normalized.includes("secret") || normalized.includes("token") || normalized.includes("password") || normalized.includes("html") || normalized === "stack") {
      result[key] = "[redacted]";
      return;
    }
    result[key] = sanitizeMaracaDiagnostic(entry);
  });
  return result;
}

function createMaracaErrorDiagnostic(code, error) {
  return {
    code,
    severity: "error",
    message: error && error.message ? error.message : String(error || "Unknown orchestration error"),
    error: {
      name: error && error.name || "Error",
      code: error && error.code || code
    }
  };
}

function getMaracaRuntimeApi(name) {
  if (typeof globalThis === "undefined") return null;
  return globalThis[name] || null;
}

function getMaracaKernelRuntimeApi() {
  if (XTendMaracaKernelRuntimeModule && typeof XTendMaracaKernelRuntimeModule === "object") {
    return XTendMaracaKernelRuntimeModule;
  }
  if (typeof globalThis !== "undefined" && globalThis.AppModules) {
    return globalThis.AppModules;
  }
  return null;
}

function getMaracaKernelOrchestrationControllerApi() {
  if (typeof globalThis === "undefined") return null;
  return globalThis.XTendRmtKernelOrchestrationController || null;
}

function createMaracaKernelHostAdapter(options = {}) {
  const windowTarget = options.windowTarget || (typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : null));
  const documentTarget = options.documentTarget || (typeof document !== "undefined" ? document : null);
  const target = windowTarget || {};
  const now = () => target.performance && typeof target.performance.now === "function" ? target.performance.now() : Date.now();
  return Object.freeze({
    hostKind: "maraca_browser",
    windowTarget,
    documentTarget,
    now,
    scheduleTimeout(callback, delay = 0) {
      return typeof target.setTimeout === "function" ? target.setTimeout(callback, Math.max(Number(delay) || 0, 0)) : null;
    },
    cancelTimeout(handle) {
      if (typeof target.clearTimeout === "function" && handle != null) target.clearTimeout(handle);
    },
    scheduleAnimationFrame(callback) {
      if (typeof target.requestAnimationFrame === "function") return target.requestAnimationFrame(callback);
      if (typeof target.setTimeout === "function") return target.setTimeout(() => callback(now()), 16);
      callback(now());
      return null;
    },
    cancelAnimationFrame(handle) {
      if (typeof target.cancelAnimationFrame === "function" && handle != null) target.cancelAnimationFrame(handle);
      else if (typeof target.clearTimeout === "function" && handle != null) target.clearTimeout(handle);
    },
    scheduleIdleCallback(callback, idleOptions = {}) {
      if (typeof target.requestIdleCallback === "function") return target.requestIdleCallback(callback, idleOptions);
      if (typeof target.setTimeout === "function") {
        return target.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 0 }), Math.max(Number(idleOptions.timeout) || 1, 1));
      }
      callback({ didTimeout: false, timeRemaining: () => 0 });
      return null;
    },
    cancelIdleCallback(handle) {
      if (typeof target.cancelIdleCallback === "function" && handle != null) target.cancelIdleCallback(handle);
      else if (typeof target.clearTimeout === "function" && handle != null) target.clearTimeout(handle);
    },
    createAbortController() {
      return typeof target.AbortController === "function" ? new target.AbortController() : null;
    },
    createCustomEvent(name, init = {}) {
      if (typeof target.CustomEvent === "function") return new target.CustomEvent(String(name || ""), init);
      return { type: String(name || ""), detail: init.detail || null };
    }
  });
}

function createKernelController(root, options = {}) {
  const diagnostics = (MARACA_KERNEL.diagnostics || []).map(sanitizeMaracaDiagnostic);
  const artifact = MARACA_KERNEL.artifact || null;
  const scheduler = artifact && artifact.scheduler || null;
  const schedules = scheduler && Array.isArray(scheduler.schedules) ? scheduler.schedules : [];
  const fibers = scheduler && Array.isArray(scheduler.fibers) ? scheduler.fibers : [];
  const controllerApi = getMaracaKernelOrchestrationControllerApi();
  if (controllerApi && typeof controllerApi.createRmtKernelOrchestrationController === "function") {
    const externalHostAdapter = options.kernelHostAdapter || options.schedulerAdapter || createMaracaKernelHostAdapter(options);
    const externalController = controllerApi.createRmtKernelOrchestrationController({
      kernelApi: getMaracaKernelRuntimeApi(),
      artifact,
      plan: MARACA_KERNEL,
      strict: MARACA_KERNEL.strict,
      hostAdapter: externalHostAdapter,
      windowTarget: typeof window !== "undefined" ? window : undefined,
      documentTarget: typeof document !== "undefined" ? document : undefined,
      runtimeKind: "maraca-kernel",
      diagnostics,
      dispatchEvent: dispatchMaracaEvent
    });
    externalController.boot();
    return Object.freeze({
      enabled: externalController.enabled,
      mode: MARACA_KERNEL.mode,
      get status() {
        return externalController.status;
      },
      planStatus: MARACA_KERNEL.status,
      get runtime() {
        return externalController.runtime;
      },
      get core() {
        return externalController.core;
      },
      get performanceRuntime() {
        return externalController.performanceRuntime;
      },
      get schedulerBridge() {
        return externalController.schedulerBridge;
      },
      get hostAdapter() {
        return externalController.hostAdapter;
      },
      scheduleWork: externalController.scheduleWork,
      listScheduledEndpoints: externalController.listScheduledEndpoints,
      listDiagnostics: externalController.listDiagnostics,
      snapshot() {
        const snapshot = externalController.snapshot();
        return {
          ...snapshot,
          schema: "xtend.maraca.kernel-snapshot.v1",
          planStatus: MARACA_KERNEL.status
        };
      }
    });
  }
  const scheduleByEndpoint = new Map(schedules.map((schedule) => [schedule.endpointName, schedule]));
  let runtime = null;
  let core = null;
  let performanceRuntime = null;
  let schedulerBridge = null;
  let hostAdapter = null;
  let runtimeStatus = MARACA_KERNEL.enabled && artifact ? "pending" : MARACA_KERNEL.status;
  const fiberHistory = [];
  let fallbackCount = 0;

  function publishDiagnostic(diagnostic) {
    const safeDiagnostic = sanitizeMaracaDiagnostic(diagnostic);
    diagnostics.push(safeDiagnostic);
    return safeDiagnostic;
  }

  function listDiagnostics() {
    return diagnostics.map((entry) => sanitizeMaracaDiagnostic(entry));
  }

  function listScheduledEndpoints() {
    return schedulerBridge && typeof schedulerBridge.listScheduledEndpoints === "function"
      ? schedulerBridge.listScheduledEndpoints()
      : [];
  }

  function snapshot() {
    return {
      schema: "xtend.maraca.kernel-snapshot.v1",
      mode: MARACA_KERNEL.mode,
      status: runtimeStatus,
      planStatus: MARACA_KERNEL.status,
      enabled: Boolean(runtime || core || schedulerBridge),
      summary: MARACA_KERNEL.summary || {},
      scheduledEndpoints: listScheduledEndpoints(),
      fibers: fiberHistory.slice(),
      fallbackCount,
      diagnostics: listDiagnostics()
    };
  }

  function resolveFiber(kind, metadata = {}) {
    if (!fibers.length) return null;
    const requested = String(kind || "").trim();
    if (metadata.fiberId) {
      const exact = fibers.find((fiber) => fiber.id === metadata.fiberId);
      if (exact) return exact;
    }
    if (metadata.operation) {
      const operation = fibers.find((fiber) => fiber.operation === metadata.operation);
      if (operation) return operation;
    }
    if (metadata.action) {
      const action = fibers.find((fiber) => fiber.kind === "action" && fiber.target && fiber.target.ref === metadata.action);
      if (action) return action;
    }
    if (metadata.eventId) {
      const event = fibers.find((fiber) => fiber.kind === "event" && fiber.target && fiber.target.ref === metadata.eventId);
      if (event) return event;
    }
    if (metadata.hydrationId) {
      const hydration = fibers.find((fiber) => fiber.kind === "hydration" && fiber.target && String(fiber.target.ref || "").includes(metadata.hydrationId));
      if (hydration) return hydration;
    }
    return fibers.find((fiber) => fiber.op === requested || fiber.kind === requested)
      || (requested === "render" ? fibers.find((fiber) => fiber.op === "hydrate" || fiber.op === "mount") : null)
      || null;
  }

  function scheduleWork(kind, callback, metadata = {}) {
    if (typeof callback !== "function") return undefined;
    const fiber = resolveFiber(kind, metadata);
    if (!schedulerBridge || !fiber || !fiber.endpointName) {
      fallbackCount += 1;
      const diagnostic = publishDiagnostic({
        code: "xtend.maraca.kernel_orchestration_fallback",
        severity: MARACA_KERNEL.strict ? "error" : "warning",
        message: "Kernel orchestration work could not be scheduled and used fallback execution.",
        kind,
        fiber: fiber && fiber.id || null
      });
      if (MARACA_KERNEL.strict) {
        const error = new Error(diagnostic.message);
        error.code = diagnostic.code;
        error.diagnostic = diagnostic;
        throw error;
      }
      fiberHistory.push({
        fiber: fiber && fiber.id || null,
        kind,
        endpointName: fiber && fiber.endpointName || null,
        status: "fallback"
      });
      return callback({
        schema: "xtend.maraca.kernel-work.v1",
        scheduled: false,
        kind,
        metadata
      });
    }
    const schedule = scheduleByEndpoint.get(fiber.endpointName) || {
      id: fiber.endpointName,
      endpointName: fiber.endpointName,
      scope: fiber.operation || "rmt.maraca",
      lane: "visible"
    };
    dispatchMaracaEvent("xtend-maraca:kernel-schedule", {
      schema: "xtend.maraca.kernel-schedule.v1",
      endpointName: schedule.endpointName,
      scope: schedule.scope,
      fiber: fiber.id,
      kind
    });
    const result = schedulerBridge.scheduleEndpoint(schedule.endpointName, schedule.scope || "rmt.maraca", (jobContext) => callback({
      schema: "xtend.maraca.kernel-work.v1",
      scheduled: true,
      kind,
      fiber,
      schedule,
      jobContext,
      metadata
    }), {
      schedule,
      runInline: true,
      metadata: {
        ...metadata,
        kind,
        fiberId: fiber.id
      }
    });
    const historyEntry = {
      fiber: fiber.id,
      kind,
      endpointName: schedule.endpointName,
      status: result && result.status || "unknown"
    };
    fiberHistory.push(historyEntry);
    dispatchMaracaEvent("xtend-maraca:kernel-fiber", {
      schema: "xtend.maraca.kernel-fiber.v1",
      ...historyEntry
    });
    return result && result.handle && Object.prototype.hasOwnProperty.call(result.handle, "targetResult")
      ? result.handle.targetResult
      : result;
  }

  function activateSchedules() {
    if (!schedulerBridge) return;
    schedules.forEach((schedule) => {
      if (!schedule || !schedule.endpointName) return;
      schedulerBridge.scheduleEndpoint(schedule.endpointName, schedule.scope || "rmt.maraca", () => ({
        schema: "xtend.maraca.kernel-endpoint-activation.v1",
        endpointName: schedule.endpointName
      }), {
        schedule,
        runInline: true,
        metadata: {
          operation: "kernel.activate",
          schedule: schedule.id
        }
      });
    });
  }

  if (!MARACA_KERNEL.enabled || !artifact) {
    return Object.freeze({
      enabled: false,
      mode: MARACA_KERNEL.mode,
      status: MARACA_KERNEL.status,
      runtime,
      core,
      performanceRuntime,
      schedulerBridge,
      hostAdapter,
      scheduleWork,
      listScheduledEndpoints,
      listDiagnostics,
      snapshot
    });
  }

  try {
    const kernelApi = getMaracaKernelRuntimeApi();
    if (!kernelApi || typeof kernelApi.createRmtPerformanceRuntime !== "function" || typeof kernelApi.createRmtStateSchedulerDiagnosticsBridge !== "function") {
      throw new Error("XTend RMT kernel runtime module is not available.");
    }
    hostAdapter = options.kernelHostAdapter || options.schedulerAdapter || createMaracaKernelHostAdapter(options);
    performanceRuntime = kernelApi.createRmtPerformanceRuntime({
      windowTarget: typeof window !== "undefined" ? window : undefined,
      documentTarget: typeof document !== "undefined" ? document : undefined,
      hostAdapter,
      runtimeKind: "maraca-kernel",
      schedules
    });
    schedulerBridge = kernelApi.createRmtStateSchedulerDiagnosticsBridge({
      performanceRuntime,
      schedules
    });
    core = typeof kernelApi.createRmtCore === "function" ? kernelApi.createRmtCore({
      windowTarget: typeof window !== "undefined" ? window : undefined,
      documentTarget: typeof document !== "undefined" ? document : undefined,
      hostAdapter,
      kernelRecords: artifact.records,
      scheduler
    }) : null;
    runtime = typeof kernelApi.createRmtRuntime === "function" ? kernelApi.createRmtRuntime({
      windowTarget: typeof window !== "undefined" ? window : undefined,
      documentTarget: typeof document !== "undefined" ? document : undefined,
      hostAdapter,
      core,
      renderManCore: core,
      performanceRuntime,
      kernelRecords: artifact.records,
      scheduler
    }) : null;
    activateSchedules();
    runtimeStatus = "booted";
    dispatchMaracaEvent("xtend-maraca:kernel-boot", {
      schema: "xtend.maraca.kernel-boot.v1",
      mode: MARACA_KERNEL.mode,
      status: runtimeStatus,
      summary: MARACA_KERNEL.summary,
      scheduledEndpointCount: listScheduledEndpoints().length
    });
  } catch (error) {
    runtimeStatus = "error";
    const diagnostic = publishDiagnostic(createMaracaErrorDiagnostic("xtend.maraca.kernel_runtime_error", error));
    dispatchMaracaEvent("xtend-maraca:kernel-error", diagnostic);
    if (MARACA_KERNEL.strict) throw error;
  }

  return Object.freeze({
    enabled: Boolean(runtime || core || schedulerBridge),
    mode: MARACA_KERNEL.mode,
    status: runtimeStatus,
    planStatus: MARACA_KERNEL.status,
    runtime,
    core,
    performanceRuntime,
    schedulerBridge,
    hostAdapter,
    scheduleWork,
    listScheduledEndpoints,
    listDiagnostics,
    snapshot
  });
}

function resolveMaracaReducerValue(value, context) {
  if (typeof value !== "string") return value;
  if (value === "input" || value === "payload") return context.payload;
  if (value.startsWith("input.")) return readMaracaPath(context.payload, value.slice(6));
  if (value.startsWith("payload.")) return readMaracaPath(context.payload, value.slice(8));
  if (value === "result") {
    return context.result && Object.prototype.hasOwnProperty.call(context.result, "data")
      ? context.result.data
      : context.result;
  }
  if (value.startsWith("result.")) {
    const resultPath = value.slice(7);
    const directValue = readMaracaPath(context.result, resultPath);
    if (typeof directValue !== "undefined") return directValue;
    return readMaracaPath(context.result && context.result.data, resultPath);
  }
  return value;
}

async function runDeferredMaracaEffects(actionResult, context = {}) {
  const effectAdapter = context.effectAdapter || null;
  const effects = Array.isArray(actionResult && actionResult.effects) ? actionResult.effects : [];
  const deferred = effects.filter((entry) => entry && entry.value && entry.value.deferred === true);
  const results = [];
  for (const entry of deferred) {
    const effect = entry.value.effect || { id: entry.id, kind: entry.kind };
    const effectContext = {
      ...(entry.value.context || {}),
      payload: context.payload || entry.value.context && entry.value.context.payload || {},
      result: actionResult && Object.prototype.hasOwnProperty.call(actionResult, "data") ? actionResult.data : actionResult,
      actionResult,
      stateRuntime: context.stateRuntime || null,
      surfaceRuntime: context.surfaceRuntime || null,
      ownerId: entry.value.context && entry.value.context.ownerId || null,
      phase: "after-render"
    };
    const adapterResult = effectAdapter && typeof effectAdapter.invoke === "function"
      ? await effectAdapter.invoke(effect, effectContext)
      : undefined;
    const result = typeof adapterResult === "undefined"
      ? await runDefaultMaracaEffect(effect, effectContext, context)
      : adapterResult;
    entry.value.result = cloneMaracaValue(result, result);
    entry.value.deferred = false;
    results.push({ id: entry.id, kind: entry.kind, result });
  }
  return results;
}

function maracaCssString(value) {
  const raw = String(value || "");
  if (typeof CSS !== "undefined" && CSS && typeof CSS.escape === "function") return CSS.escape(raw);
  return raw.replace(/["\\\\]/gu, "\\\\$&");
}

function waitForMaracaEffectTurn() {
  if (typeof requestAnimationFrame === "function") {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }
  if (typeof setTimeout === "function") {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }
  return Promise.resolve();
}

function nearestMaracaSurfaceManager(element, root = null) {
  let current = element || null;
  while (current) {
    if (current.localName === "x-surface-manager") return current;
    if (typeof current.closest === "function") {
      const manager = current.closest("x-surface-manager");
      if (manager) return manager;
    }
    const owner = typeof current.getRootNode === "function" ? current.getRootNode() : null;
    current = owner && owner.host || current.parentElement || null;
  }
  const documentRoot = typeof document !== "undefined" ? document : null;
  return root && typeof root.querySelector === "function" && root.querySelector("x-surface-manager")
    || documentRoot && documentRoot.querySelector("x-surface-manager")
    || null;
}

function snapshotMaracaSurfaceRecord(manager, surfaceId) {
  if (!manager || !surfaceId) return null;
  try {
    const snapshot = typeof manager.readSnapshot === "function"
      ? manager.readSnapshot()
      : typeof manager.snapshot === "function"
        ? manager.snapshot()
        : null;
    const surfaces = Array.isArray(snapshot && snapshot.surfaces) ? snapshot.surfaces : [];
    return surfaces.find((record) => record && record.id === surfaceId) || null;
  } catch (_) {
    return null;
  }
}

async function materializeMaracaEffectSurface(surfaceId, surface = null, context = {}) {
  if (!surfaceId) return { materialized: false, reason: "missing-surface" };
  const root = context.root || null;
  const targetSurface = surface || resolveMaracaSurfaceElement(root, surfaceId);
  const manager = nearestMaracaSurfaceManager(targetSurface, root);
  if (!manager) return { materialized: false, reason: "no-surface-manager", surfaceId };
  const before = snapshotMaracaSurfaceRecord(manager, surfaceId);
  const needsMaterialization = !before
    || before.status === "closed"
    || before.status === "minimized"
    || before.minimized === true
    || before.active !== true;
  if (!needsMaterialization) return { materialized: false, reason: "already-active", surfaceId };
  const payload = {
    reason: "maraca-effect",
    source: "xtend.maraca.default-media-effect"
  };
  if (typeof manager.materializeSurface === "function") {
    manager.materializeSurface(surfaceId, payload);
  } else if (before && before.status === "closed" && typeof manager.openSurface === "function") {
    manager.openSurface(surfaceId, payload);
  } else if (typeof manager.restoreSurface === "function") {
    manager.restoreSurface(surfaceId);
  } else if (typeof manager.openSurface === "function") {
    manager.openSurface(surfaceId, payload);
  } else if (typeof manager.focusSurface === "function") {
    manager.focusSurface(surfaceId);
  } else {
    return { materialized: false, reason: "unsupported-surface-manager", surfaceId };
  }
  await waitForMaracaEffectTurn();
  const after = snapshotMaracaSurfaceRecord(manager, surfaceId);
  return {
    schema: "xtend.maraca.effect-surface-materialization.v1",
    materialized: true,
    surfaceId,
    beforeStatus: before && before.status || null,
    afterStatus: after && after.status || null
  };
}

async function runDefaultMaracaEffect(effect = {}, effectContext = {}, context = {}) {
  if (effect.kind === "remote-play") return runDefaultRemotePlayEffect(effect, effectContext, context);
  if (effect.kind === "lightbox" || effect.kind === "open-lightbox" || effect.kind === "lightbox-open") {
    return runDefaultLightboxEffect(effect, effectContext, context);
  }
  return undefined;
}

async function runDefaultRemotePlayEffect(effect = {}, effectContext = {}, context = {}) {
  const stateRuntime = effectContext.stateRuntime || context.stateRuntime || null;
  const surfaceRuntime = effectContext.surfaceRuntime || context.surfaceRuntime || null;
  const root = context.root || null;
  const selectorId = effect.source && effect.source.target || effect.target || "";
  const playerState = stateRuntime && typeof stateRuntime.getState === "function"
    ? stateRuntime.getState(selectorId)
    : null;
  const detail = playerState && typeof playerState === "object"
    ? playerState
    : effectContext.result && effectContext.result.player || {};
  if (!detail || detail.hidden === true || detail.open === false || !detail.src) return null;
  if (typeof ensureMaracaComponent === "function") await ensureMaracaComponent("x-player");
  await Promise.resolve();
  const surfaceId = detail.surfaceId || selectorId;
  const escapedSurfaceId = maracaCssString(surfaceId);
  const surfaceSelector = '[data-maraca-surface="' + escapedSurfaceId + '"]';
  const playerSelector = 'x-player[data-maraca-surface="' + escapedSurfaceId + '"]';
  let surface = root && typeof root.querySelector === "function"
    ? root.querySelector(surfaceSelector)
    : null;
  const documentRoot = typeof document !== "undefined" ? document : null;
  const materialization = await materializeMaracaEffectSurface(surfaceId, surface, context);
  if (!surface) surface = resolveMaracaSurfaceElement(root, surfaceId);
  await waitForMaracaEffectTurn();
  const player = surface && surface.localName === "x-player"
    ? surface
    : surface && typeof surface.querySelector === "function" && surface.querySelector("x-player")
      || documentRoot && documentRoot.querySelector(playerSelector);
  if (!player) return null;
  const kind = String(detail.kind || "").trim().toLowerCase();
  const rawMediaType = String(detail.mediaType || detail.type || "").trim();
  const rawMediaTypeKey = rawMediaType.toLowerCase();
  const invalidMediaType = rawMediaTypeKey === "n/a"
    || rawMediaTypeKey === "unknown"
    || rawMediaTypeKey === "null"
    || rawMediaTypeKey === "undefined";
  const normalizedType = rawMediaType && !invalidMediaType
    ? rawMediaType
    : kind === "audio"
      ? "audio"
      : kind === "video"
        ? "video"
        : "video";
  const payload = {
    schema: "xtend.maraca.remote-play.v1",
    src: detail.src,
    source: detail.src,
    type: normalizedType,
    mediaType: detail.mediaType || "",
    poster: detail.poster || "",
    title: detail.title || detail.label || "Media",
    label: detail.title || detail.label || "Media",
    kind: detail.kind || "video",
    requestedBy: "maraca-effect"
  };
  const remotePlayEvent = new CustomEvent("xplayer-remote-play", {
    detail: payload,
    bubbles: true,
    composed: true,
    cancelable: true
  });
  const eventAccepted = player.dispatchEvent(remotePlayEvent);
  if (!eventAccepted || remotePlayEvent.defaultPrevented) return payload;
  if (typeof player.applyRmtPlayerCommand === "function") {
    const result = await player.applyRmtPlayerCommand("remote-play", payload);
    return { payload, result, materialization };
  }
  if (typeof player.remotePlay === "function") {
    const result = await player.remotePlay(payload);
    return { payload, result, materialization };
  }
  return { payload, materialization };
}

function resolveMaracaSurfaceElement(root, surfaceId) {
  const escapedSurfaceId = maracaCssString(surfaceId);
  const surfaceSelector = '[data-maraca-surface="' + escapedSurfaceId + '"]';
  const documentRoot = typeof document !== "undefined" ? document : null;
  return root && typeof root.querySelector === "function" && root.querySelector(surfaceSelector)
    || documentRoot && documentRoot.querySelector(surfaceSelector)
    || null;
}

function syncClosedMaracaLightboxElement(lightbox) {
  if (!lightbox) return;
  if (typeof lightbox.removeAttribute === "function") {
    lightbox.removeAttribute("open");
    lightbox.removeAttribute("src");
    lightbox.setAttribute("hidden", "");
    lightbox.setAttribute("data-rmt-hidden-display", "true");
  }
  try {
    lightbox.hidden = true;
  } catch (_) {}
  if (lightbox.style) {
    lightbox.style.display = "none";
    lightbox.style.visibility = "hidden";
    lightbox.style.pointerEvents = "none";
  }
}

async function runDefaultLightboxEffect(effect = {}, effectContext = {}, context = {}) {
  const stateRuntime = effectContext.stateRuntime || context.stateRuntime || null;
  const surfaceRuntime = effectContext.surfaceRuntime || context.surfaceRuntime || null;
  const root = context.root || null;
  const selectorId = effect.source && effect.source.target || effect.target || "";
  const lightboxState = stateRuntime && typeof stateRuntime.getState === "function"
    ? stateRuntime.getState(selectorId)
    : null;
  const detail = lightboxState && typeof lightboxState === "object"
    ? lightboxState
    : effectContext.result && effectContext.result.lightbox || {};
  const surfaceId = detail && detail.surfaceId || selectorId;
  if (!surfaceId) return null;
  if (typeof ensureMaracaComponent === "function") await ensureMaracaComponent("x-lightbox");
  await Promise.resolve();

  let surface = resolveMaracaSurfaceElement(root, surfaceId);
  const materialization = await materializeMaracaEffectSurface(surfaceId, surface, context);
  if (!surface) surface = resolveMaracaSurfaceElement(root, surfaceId);
  const documentRoot = typeof document !== "undefined" ? document : null;
  const lightbox = surface && surface.localName === "x-lightbox"
    ? surface
    : surface && typeof surface.querySelector === "function" && surface.querySelector("x-lightbox")
      || documentRoot && documentRoot.querySelector('x-lightbox[data-maraca-surface="' + maracaCssString(surfaceId) + '"]');
  if (!lightbox) return null;

  const shouldOpen = Boolean(detail && detail.hidden !== true && detail.open !== false && detail.src);
  if (!shouldOpen) {
    if (surfaceRuntime && typeof surfaceRuntime.listOverlays === "function" && typeof surfaceRuntime.closeOverlay === "function") {
      try {
        surfaceRuntime.listOverlays()
          .filter((overlay) => overlay && (overlay.kind === "lightbox" || overlay.overlayId === "media.manager.lightboxOverlay" || overlay.surface === surfaceId))
          .forEach((overlay) => surfaceRuntime.closeOverlay(overlay.id, { reason: "maraca-lightbox-close" }));
      } catch (_) {}
    }
    if (typeof lightbox.close === "function") {
      lightbox.close({ source: "maraca-effect", immediate: true, silent: true });
    }
    syncClosedMaracaLightboxElement(lightbox);
    await waitForMaracaEffectTurn();
    syncClosedMaracaLightboxElement(lightbox);
    return {
      schema: "xtend.maraca.lightbox-effect.v1",
      open: false,
      surfaceId,
      materialization
    };
  }

  if (typeof lightbox.removeAttribute === "function") {
    lightbox.removeAttribute("hidden");
    lightbox.removeAttribute("data-rmt-hidden-display");
  }
  if (lightbox.style) {
    lightbox.style.display = "";
    lightbox.style.visibility = "";
    lightbox.style.pointerEvents = "";
  }
  if (typeof lightbox.setAttribute === "function") {
    lightbox.setAttribute("src", detail.src);
    if (detail.alt || detail.title || detail.label) lightbox.setAttribute("alt", detail.alt || detail.title || detail.label);
  }
  if (typeof lightbox.open === "function") {
    lightbox.open(detail.src, { source: "maraca-effect", silent: true });
  } else if (typeof lightbox.setAttribute === "function") {
    lightbox.setAttribute("open", "");
  }
  return {
    schema: "xtend.maraca.lightbox-effect.v1",
    open: true,
    surfaceId,
    src: detail.src,
    materialization
  };
}

function createSurfaceEntriesFromRoot(root) {
  if (!root || typeof root.querySelectorAll !== "function") return [];
  return Array.from(root.querySelectorAll("[data-rmt-component], [data-maraca-surface]")).map((element) => {
    const rawId = element.getAttribute("data-maraca-surface") || "";
    const nodeId = element.getAttribute("data-rmt-node") || "";
    const normalizedNodeId = nodeId
      ? nodeId.replace(/^surface:/u, "").split("/").pop()
      : "";
    const component = element.getAttribute("data-rmt-component") || element.localName || "";
    const id = MARACA_SURFACES.some((entry) => entry.id === rawId) ? rawId : normalizedNodeId;
    const surface = MARACA_SURFACES.find((entry) => entry.id === id)
      || MARACA_SURFACES.find((entry) => entry.component === component)
      || { id, component };
    return { surface, element };
  });
}

function createOrchestrationController(root, options = {}, kernelController = null, hydrationController = null) {
  const diagnostics = (MARACA_ORCHESTRATION.diagnostics || []).map(sanitizeMaracaDiagnostic);
  const artifact = MARACA_ORCHESTRATION.artifact || null;
  let stateRuntime = null;
  let actionRuntime = null;
  let eventRuntime = null;
  let surfaceRuntime = null;
  let renderer = null;
  let validationRuntime = null;
  let transitionRuntime = null;
  let attachReport = null;
  let renderReport = null;
  let surfaceReport = null;
  let unsubState = null;
  let surfaceDescriptorById = null;
  let surfaceIdsByStateId = null;
  const surfaceHydrationInflight = new Map();

  function publishDiagnostic(diagnostic) {
    const safeDiagnostic = sanitizeMaracaDiagnostic(diagnostic);
    diagnostics.push(safeDiagnostic);
    return safeDiagnostic;
  }

  function listDiagnostics() {
    return diagnostics.map((entry) => sanitizeMaracaDiagnostic(entry));
  }

  function getSurfaceDescriptor(surfaceId) {
    if (!surfaceDescriptorById) {
      surfaceDescriptorById = collectSurfaceDescriptors(artifact && artifact.render && artifact.render.root);
    }
    return surfaceDescriptorById.get(surfaceId) || null;
  }

  function getSurfaceIdsByStateId() {
    if (!surfaceIdsByStateId) {
      surfaceIdsByStateId = new Map();
      (artifact && artifact.surfaces || []).forEach((surface) => {
        if (!surface || !surface.source || !surface.id) return;
        const ids = surfaceIdsByStateId.get(surface.source) || [];
        ids.push(surface.id);
        surfaceIdsByStateId.set(surface.source, ids);
      });
    }
    return surfaceIdsByStateId;
  }

  function surfacePatchScope(metadata = {}) {
    const explicit = Array.isArray(metadata.surfaceIds) ? metadata.surfaceIds.filter(Boolean) : null;
    if (explicit && explicit.length > 0) return new Set(explicit);
    const changedStates = Array.isArray(metadata.changedStates) ? metadata.changedStates.filter(Boolean) : null;
    if (!changedStates) return null;
    const byState = getSurfaceIdsByStateId();
    const ids = new Set();
    changedStates.forEach((stateId) => {
      (byState.get(stateId) || []).forEach((surfaceId) => ids.add(surfaceId));
    });
    return ids;
  }

  function patchPlanChangedKeys(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value && typeof value === "object") return Object.keys(value).filter(Boolean);
    return [];
  }

  function surfaceStateRequestsHydration(state = {}) {
    if (!state || typeof state !== "object") return true;
    if (state.hidden === true) return false;
    if (state.open === false) return false;
    return true;
  }

  function componentTagsForSurface(surface, descriptor) {
    const tags = collectDescriptorComponentTags(descriptor);
    if (surface && surface.component) tags.add(String(surface.component).trim().toLowerCase());
    return Array.from(tags).filter((tag) => MARACA_COMPONENTS.some((entry) => entry.tag === tag));
  }

  function hydrateSurfaceComponent(tag, surfaceId, metadata = {}) {
    const key = surfaceId + ":" + tag;
    if (surfaceHydrationInflight.has(key)) return surfaceHydrationInflight.get(key);
    const controller = hydrationController || currentMaracaHydration || null;
    const loader = controller && controller.enabled && typeof controller.hydrateComponent === "function"
      ? controller.hydrateComponent(tag, {
          surface: surfaceId,
          correlationId: metadata.correlationId || ""
        })
      : ensureMaracaComponent(tag);
    const promise = Promise.resolve(loader)
      .then((result) => {
        dispatchMaracaEvent("xtend-maraca:component-load", {
          tag,
          surface: surfaceId,
          strategy: "surface-state",
          action: metadata.action || "",
          operation: metadata.operation || "",
          result
        });
        return result;
      })
      .catch((error) => {
        const diagnostic = publishDiagnostic(createMaracaErrorDiagnostic("xtend.maraca.surface_hydration_error", error));
        dispatchMaracaEvent("xtend-maraca:component-error", {
          tag,
          surface: surfaceId,
          strategy: "surface-state",
          action: metadata.action || "",
          operation: metadata.operation || "",
          diagnostic
        });
        if (MARACA_HYDRATION.strict) throw error;
        return null;
      })
      .finally(() => {
        surfaceHydrationInflight.delete(key);
      });
    surfaceHydrationInflight.set(key, promise);
    return promise;
  }

  async function hydrateSurfaceComponents(metadata = {}) {
    if (!artifact) return [];
    const scopedSurfaceIds = surfacePatchScope(metadata);
    const surfaces = scopedSurfaceIds
      ? (artifact.surfaces || []).filter((surface) => surface && scopedSurfaceIds.has(surface.id))
      : (artifact.surfaces || []);
    const hydration = [];
    surfaces.forEach((surface) => {
      if (!surface || !surface.source || !surface.id) return;
      const state = stateRuntime && typeof stateRuntime.getState === "function"
        ? stateRuntime.getState(surface.source) || {}
        : {};
      if (!surfaceStateRequestsHydration(state)) return;
      const descriptor = getSurfaceDescriptor(surface.id);
      componentTagsForSurface(surface, descriptor).forEach((tag) => {
        hydration.push(hydrateSurfaceComponent(tag, surface.id, metadata));
      });
    });
    return Promise.all(hydration);
  }

  function runtimeSnapshot() {
    return {
      schema: "xtend.maraca.orchestration-snapshot.v1",
      mode: MARACA_ORCHESTRATION.mode,
      status: MARACA_ORCHESTRATION.status,
      state: stateRuntime && typeof stateRuntime.snapshot === "function" ? stateRuntime.snapshot() : null,
      actions: actionRuntime && typeof actionRuntime.listHistory === "function" ? actionRuntime.listHistory() : [],
      events: eventRuntime && typeof eventRuntime.listRoutes === "function" ? eventRuntime.listRoutes() : [],
      surfaces: surfaceRuntime && typeof surfaceRuntime.getSnapshot === "function" ? surfaceRuntime.getSnapshot() : null,
      kernel: kernelController && typeof kernelController.snapshot === "function" ? kernelController.snapshot() : null,
      validation: validationRuntime && typeof validationRuntime.snapshot === "function" ? validationRuntime.snapshot() : null,
      transitions: transitionRuntime && typeof transitionRuntime.snapshot === "function" ? transitionRuntime.snapshot() : null,
      diagnostics: listDiagnostics()
    };
  }

  function syncSurfaceAttributes(metadata = {}) {
    if (!stateRuntime || !artifact) return false;
    let missing = 0;
    const scopedSurfaceIds = surfacePatchScope(metadata);
    const surfaces = scopedSurfaceIds
      ? (artifact.surfaces || []).filter((surface) => surface && scopedSurfaceIds.has(surface.id))
      : (artifact.surfaces || []);
    if (scopedSurfaceIds && surfaces.length === 0) return true;
    surfaces.forEach((surface) => {
      if (!surface || !surface.source) return;
      const element = root && typeof root.querySelectorAll === "function"
        ? Array.from(root.querySelectorAll("[data-maraca-surface]")).find((entry) => entry.getAttribute("data-maraca-surface") === surface.id)
        : null;
      if (!element) {
        missing += 1;
        return;
      }
      const state = stateRuntime.getState(surface.source) || {};
      const component = element.getAttribute("data-rmt-component") || surface.component || "";
      syncMaracaStateAttributes(element, state, component, {
        surface,
        transitionRuntime,
        action: metadata.action || "",
        operation: metadata.operation || "",
        correlationId: metadata.correlationId || ""
      });
      const descriptor = getSurfaceDescriptor(surface.id);
      if (renderer && typeof renderer.patchElement === "function" && shouldPatchSurfaceDescriptorStructure(descriptor, element, metadata)) {
        try {
          renderer.patchElement(element, descriptor, createMaracaRenderContext(stateRuntime));
        } catch (error) {
          const diagnostic = publishDiagnostic(createMaracaErrorDiagnostic("xtend.maraca.structured_surface_patch_error", error));
          dispatchMaracaEvent("xtend-maraca:render-patch", diagnostic);
          if (MARACA_ORCHESTRATION.strict) throw error;
        }
      }
      if (Object.prototype.hasOwnProperty.call(state, "text")) {
        element.textContent = String(state.text == null ? "" : state.text);
      }
    });
    return missing === 0;
  }

  function attachEvents() {
    if (!eventRuntime || typeof eventRuntime.attach !== "function") return null;
    if (typeof eventRuntime.detachAll === "function") eventRuntime.detachAll();
    attachReport = eventRuntime.attach(root);
    return attachReport;
  }

  function renderNow() {
    if (!artifact) return null;
    if (surfaceRuntime && typeof surfaceRuntime.materialize === "function" && stateRuntime && typeof stateRuntime.getSelectorValues === "function") {
      surfaceReport = surfaceRuntime.materialize(stateRuntime.getSelectorValues());
      dispatchMaracaEvent("xtend-maraca:surface-change", {
        schema: "xtend.maraca.surface-change.v1",
        report: surfaceReport
      });
    }
    if (!renderer || typeof renderer.render !== "function") {
      syncSurfaceAttributes();
      attachEvents();
      return { schema: "xtend.maraca.orchestration-render.v1", fallback: "attribute-sync" };
    }
    const renderContext = stateRuntime && typeof stateRuntime.createRenderContext === "function"
      ? createMaracaRenderContext(stateRuntime)
      : createMaracaRenderContext(null);
    renderReport = renderer.render(root, artifact.render && artifact.render.root || { type: "fragment", children: [] }, renderContext);
    attachEvents();
    return renderReport;
  }

  function render() {
    return kernelController && kernelController.enabled && typeof kernelController.scheduleWork === "function"
      ? kernelController.scheduleWork("render", renderNow, { operation: "orchestration.render" })
      : renderNow();
  }

  if (!MARACA_ORCHESTRATION.enabled || !artifact) {
    return Object.freeze({
      enabled: false,
      mode: MARACA_ORCHESTRATION.mode,
      status: MARACA_ORCHESTRATION.status,
      stateRuntime,
      actionRuntime,
      eventRuntime,
      surfaceRuntime,
      renderer,
      validationRuntime,
      transitionRuntime,
      render,
      attachEvents,
      listDiagnostics,
      snapshot: runtimeSnapshot
    });
  }

  try {
    const stateApi = getMaracaRuntimeApi("XTendRmtStateSelectorRuntime");
    const actionApi = getMaracaRuntimeApi("XTendRmtActionEffectRuntime");
    const eventApi = getMaracaRuntimeApi("XTendRmtEventRoutingRuntime");
    const surfaceApi = getMaracaRuntimeApi("XTendRmtSurfaceResourceGraphRuntime");
    const rendererApi = getMaracaRuntimeApi("XTendRmtDomDescriptorRenderer");
    if (!stateApi || !actionApi || !eventApi || !surfaceApi || !rendererApi) {
      throw new Error("XTend RMT orchestration runtime modules are not available.");
    }

    stateRuntime = stateApi.createRmtStateSelectorRuntime({
      states: artifact.state && artifact.state.states || [],
      selectors: artifact.state && artifact.state.selectors || [],
      reducers: artifact.state && artifact.state.reducers || [],
      initialState: options.initialState || {},
      xstate: options.xstate || (typeof globalThis !== "undefined" ? globalThis.xstate : null)
    });
    const resourceManager = actionApi.createRmtResourceManager({
      resources: artifact.resources || [],
      resourceAdapters: options.resourceAdapters || {}
    });
    const baseActionRuntime = actionApi.createRmtActionEffectRuntime({
      actions: artifact.actions && artifact.actions.actions || [],
      dataSources: artifact.actions && artifact.actions.dataSources || [],
      effects: artifact.actions && artifact.actions.effects || [],
      resources: artifact.resources || [],
      stateRuntime,
      resourceManager,
      dataSourceAdapters: options.dataSourceAdapters || {},
      feedbackAdapter: options.feedbackAdapter || null,
      navigationAdapter: options.navigationAdapter || null,
      focusAdapter: options.focusAdapter || null,
      effectAdapter: options.effectAdapter || null,
      deferCustomEffects: true
    });
    if (MARACA_VALIDATION.enabled) {
      const validationApi = getMaracaRuntimeApi("XTendRmtFormValidationRuntime");
      if (!validationApi || typeof validationApi.createRmtFormValidationRuntime !== "function") {
        throw new Error("XTend RMT form validation runtime module is not available.");
      }
      validationRuntime = validationApi.createRmtFormValidationRuntime({
        validationPlan: MARACA_VALIDATION.artifact,
        stateRuntime,
        root,
        windowTarget: typeof window !== "undefined" ? window : undefined,
        diagnostics: MARACA_VALIDATION.diagnostics || [],
        publishDiagnostic
      });
    }
    if (MARACA_TRANSITIONS.enabled) {
      const transitionApi = getMaracaRuntimeApi("XTendRmtSurfaceTransitionRuntime");
      if (!transitionApi || typeof transitionApi.createRmtSurfaceTransitionRuntime !== "function") {
        throw new Error("XTend RMT surface transition runtime module is not available.");
      }
      transitionRuntime = transitionApi.createRmtSurfaceTransitionRuntime({
        transitionPlan: MARACA_TRANSITIONS.artifact,
        root,
        kernelController,
        xUtils: typeof globalThis !== "undefined" ? globalThis.XUtils : null,
        xstate: typeof globalThis !== "undefined" ? globalThis.xstate : null,
        windowTarget: typeof window !== "undefined" ? window : undefined,
        diagnostics: MARACA_TRANSITIONS.diagnostics || [],
        strict: MARACA_TRANSITIONS.strict,
        publishDiagnostic
      });
    }

    actionRuntime = Object.freeze({
      schema: baseActionRuntime.schema,
      resourceManager,
      async runAction(actionId, payload = {}, metadata = {}) {
        if (validationRuntime && typeof validationRuntime.validateAction === "function") {
          const validationWork = () => validationRuntime.validateAction(actionId, {
            ...metadata,
            action: actionId,
            report: true
          });
          const validationResult = await (kernelController && kernelController.enabled && typeof kernelController.scheduleWork === "function"
            ? kernelController.scheduleWork("validation", validationWork, {
                operation: typeof validationRuntime.operationForAction === "function" ? validationRuntime.operationForAction(actionId) : "operation:xtend.rmt/validation/action/" + actionId,
                action: actionId,
                correlationId: metadata && metadata.correlationId || ""
              })
            : validationWork());
          if (validationResult && validationResult.valid === false) {
            dispatchMaracaEvent("xtend-maraca:validation-blocked", validationResult);
            return {
              schema: "xtend.maraca.action.v1",
              action: actionId,
              status: "blocked",
              reason: "validation",
              validation: validationResult
            };
          }
        }
        const runActionWork = () => baseActionRuntime.runAction(actionId, payload, metadata);
        const result = await (kernelController && kernelController.enabled && typeof kernelController.scheduleWork === "function"
          ? kernelController.scheduleWork("action", runActionWork, {
              operation: "operation:xtend.rmt/action/" + actionId,
              action: actionId,
              correlationId: metadata && metadata.correlationId || ""
            })
          : runActionWork());
        const reducers = artifact.state && Array.isArray(artifact.state.reducers)
          ? artifact.state.reducers.filter((reducer) => reducer.action === actionId && reducer.state)
          : [];
        reducers.forEach((reducer) => {
          const value = resolveMaracaReducerValue(reducer.value, { payload, result });
          if (!reducer.path) {
            stateRuntime.setState(reducer.state, value, { operation: "orchestration.reducer", action: actionId, reducer: reducer.id });
            return;
          }
          const current = stateRuntime.getState(reducer.state) || {};
          const next = cloneMaracaValue(current, {});
          writeMaracaPath(next, reducer.path, value);
          stateRuntime.setState(reducer.state, next, { operation: "orchestration.reducer", action: actionId, reducer: reducer.id });
        });
        const changedStates = Array.from(new Set(reducers.map((reducer) => reducer.state).filter(Boolean)));
        const synced = syncSurfaceAttributes({
          operation: "orchestration.action-sync",
          action: actionId,
          correlationId: metadata && metadata.correlationId || "",
          changedStates
        });
        if (!synced) await Promise.resolve(render());
        await hydrateSurfaceComponents({
          operation: "orchestration.action-hydration",
          action: actionId,
          correlationId: metadata && metadata.correlationId || "",
          changedStates
        });
        await runDeferredMaracaEffects(result, {
          payload,
          metadata,
          stateRuntime,
          surfaceRuntime,
          effectAdapter: options.effectAdapter || null,
          root
        });
        dispatchMaracaEvent("xtend-maraca:action", {
          schema: "xtend.maraca.action.v1",
          action: actionId,
          status: result && result.status || "unknown"
        });
        return result;
      },
      cancelAction(actionId) {
        return baseActionRuntime.cancelAction(actionId);
      },
      runEffect(effectId, context) {
        return baseActionRuntime.runEffect(effectId, context);
      },
      listActions() {
        return baseActionRuntime.listActions();
      },
      listDataSources() {
        return baseActionRuntime.listDataSources();
      },
      listEffects() {
        return baseActionRuntime.listEffects();
      },
      getActionStatus(id) {
        return baseActionRuntime.getActionStatus(id);
      },
      listHistory() {
        return baseActionRuntime.listHistory();
      },
      listDiagnostics() {
        return baseActionRuntime.listDiagnostics().map(sanitizeMaracaDiagnostic);
      }
    });
    const eventActionRuntime = Object.freeze({
      ...actionRuntime,
      async runAction(actionId, payload = {}, metadata = {}) {
        const routeActionWork = () => actionRuntime.runAction(actionId, payload, metadata);
        return kernelController && kernelController.enabled && typeof kernelController.scheduleWork === "function"
          ? kernelController.scheduleWork("event", routeActionWork, {
              operation: metadata && metadata.eventId ? "operation:xtend.rmt/event/" + metadata.eventId : "orchestration.event",
              action: actionId,
              eventId: metadata && metadata.eventId || "",
              eventName: metadata && metadata.eventName || "",
              correlationId: metadata && metadata.correlationId || ""
            })
          : routeActionWork();
      }
    });

    eventRuntime = eventApi.createRmtEventRoutingRuntime({
      events: artifact.events || [],
      actionRuntime: eventActionRuntime,
      root,
      targetResolver(binding, rootTarget) {
        if (!binding || !binding.target || !rootTarget || typeof rootTarget.querySelector !== "function") return null;
        try {
          return rootTarget.querySelector(binding.target);
        } catch (_) {
          return null;
        }
      }
    });
    surfaceRuntime = surfaceApi.createRmtSurfaceResourceGraphRuntime({
      surfaces: artifact.surfaces || [],
      portals: artifact.portals || [],
      overlays: artifact.overlays || [],
      resourceManager,
      eventRuntime,
      documentTarget: document
    });
    renderer = rendererApi.createRmtDomDescriptorRenderer({ documentTarget: document });
    unsubState = stateRuntime.subscribe((event) => {
      const applyStateChange = () => {
        const operation = event && event.metadata && event.metadata.operation || "state-change";
        const patchPlan = event && event.patchPlan || null;
        const changedStates = patchPlan && patchPlan.changedStates
          ? patchPlanChangedKeys(patchPlan.changedStates)
          : null;
        const synced = syncSurfaceAttributes({
          operation,
          action: event && event.metadata && event.metadata.action || "",
          correlationId: event && event.metadata && event.metadata.correlationId || "",
          changedStates
        });
        if (!synced) render();
        hydrateSurfaceComponents({
          operation: "orchestration.state-hydration",
          action: event && event.metadata && event.metadata.action || "",
          correlationId: event && event.metadata && event.metadata.correlationId || "",
          changedStates
        }).catch((error) => {
          const diagnostic = publishDiagnostic(createMaracaErrorDiagnostic("xtend.maraca.state_hydration_error", error));
          dispatchMaracaEvent("xtend-maraca:hydration-error", diagnostic);
        });
        dispatchMaracaEvent("xtend-maraca:state-change", {
          schema: "xtend.maraca.state-change.v1",
          operation,
          patchPlan: event && event.patchPlan ? {
            changedStates: patchPlanChangedKeys(event.patchPlan.changedStates),
            changedSelectors: patchPlanChangedKeys(event.patchPlan.changedSelectors),
            changedDerived: patchPlanChangedKeys(event.patchPlan.changedDerived)
          } : null
        });
        if (validationRuntime && typeof validationRuntime.refresh === "function" && operation !== "validation.patch") {
          validationRuntime.refresh({ reason: "state-change", operation });
        }
      };
      if (kernelController && kernelController.enabled && typeof kernelController.scheduleWork === "function") {
        kernelController.scheduleWork("state-change", applyStateChange, {
          operation: event && event.metadata && event.metadata.operation || "state-change"
        });
      } else {
        applyStateChange();
      }
    });
    const initialRender = render();
    Promise.resolve(initialRender).then(() => {
      if (validationRuntime && typeof validationRuntime.refresh === "function") {
        validationRuntime.refresh({ reason: "boot" });
      }
    }).catch((error) => {
      publishDiagnostic(createMaracaErrorDiagnostic("xtend.maraca.validation_boot_refresh_error", error));
    });
    dispatchMaracaEvent("xtend-maraca:orchestration-boot", {
      schema: "xtend.maraca.orchestration-boot.v1",
      mode: MARACA_ORCHESTRATION.mode,
      summary: MARACA_ORCHESTRATION.summary,
      attachedCount: attachReport && attachReport.attachedCount || 0
    });
  } catch (error) {
    const diagnostic = publishDiagnostic(createMaracaErrorDiagnostic("xtend.maraca.orchestration_runtime_error", error));
    dispatchMaracaEvent("xtend-maraca:orchestration-error", diagnostic);
    if (MARACA_ORCHESTRATION.strict) throw error;
  }

  return Object.freeze({
    enabled: Boolean(stateRuntime && actionRuntime && eventRuntime && surfaceRuntime && renderer),
    mode: MARACA_ORCHESTRATION.mode,
    status: MARACA_ORCHESTRATION.status,
    stateRuntime,
    actionRuntime,
    eventRuntime,
    surfaceRuntime,
    renderer,
    validationRuntime,
    transitionRuntime,
    render,
    attachEvents,
    dispose() {
      if (typeof unsubState === "function") unsubState();
      if (eventRuntime && typeof eventRuntime.detachAll === "function") eventRuntime.detachAll();
    },
    listDiagnostics,
    snapshot: runtimeSnapshot
  });
}

function createTelemetryBridge(kernelController = null, orchestrationController = null, hydrationController = null, validationController = null, transitionController = null) {
  const history = [];
  function publish(kind, detail = {}) {
    const entry = sanitizeMaracaDiagnostic({
      schema: "xtend.maraca.telemetry-entry.v1",
      kind,
      at: Date.now(),
      detail
    });
    history.push(entry);
    dispatchMaracaEvent("xtend-maraca:telemetry", entry);
    return entry;
  }
  return Object.freeze({
    schema: "xtend.maraca.telemetry-bridge.v1",
    publish,
    listHistory() {
      return history.slice();
    },
    snapshot() {
      return {
        schema: "xtend.maraca.telemetry-snapshot.v1",
        eventCount: history.length,
        kernel: kernelController && typeof kernelController.snapshot === "function" ? kernelController.snapshot() : null,
        orchestration: orchestrationController && typeof orchestrationController.snapshot === "function" ? orchestrationController.snapshot() : null,
        hydration: hydrationController && typeof hydrationController.snapshot === "function" ? hydrationController.snapshot() : null,
        validation: validationController && typeof validationController.snapshot === "function" ? validationController.snapshot() : null,
        transitions: transitionController && typeof transitionController.snapshot === "function" ? transitionController.snapshot() : null,
        history: history.slice(-50)
      };
    }
  });
}

function createHydrationController(root, options = {}, kernelController = null) {
  const diagnostics = (MARACA_HYDRATION.diagnostics || []).map(sanitizeMaracaDiagnostic);
  const artifact = MARACA_HYDRATION.artifact || null;
  const records = artifact && Array.isArray(artifact.records) ? artifact.records : [];
  const history = [];
  const recordsByComponent = new Map();
  records.forEach((record) => {
    if (!record || !record.component) return;
    const entries = recordsByComponent.get(record.component) || [];
    entries.push(record);
    recordsByComponent.set(record.component, entries);
  });

  function publishDiagnostic(diagnostic) {
    const safeDiagnostic = sanitizeMaracaDiagnostic(diagnostic);
    diagnostics.push(safeDiagnostic);
    return safeDiagnostic;
  }

  function listDiagnostics() {
    return diagnostics.map((entry) => sanitizeMaracaDiagnostic(entry));
  }

  function resolveRecord(tag, metadata = {}) {
    if (metadata.hydrationId) {
      const exact = records.find((record) => record.id === metadata.hydrationId);
      if (exact) return exact;
    }
    if (metadata.surface) {
      const surface = records.find((record) => record.surface === metadata.surface);
      if (surface) return surface;
    }
    const entries = recordsByComponent.get(tag) || [];
    return entries[0] || null;
  }

  async function hydrateComponent(tag, metadata = {}) {
    const record = resolveRecord(tag, metadata);
    const correlationId = metadata.correlationId || "xtend-trace:maraca:hydration:" + (history.length + 1);
    const runHydration = () => ensureMaracaComponent(tag);
    const entry = {
      schema: "xtend.maraca.hydration-history-entry.v1",
      tag,
      surface: record && record.surface || metadata.surface || null,
      hydration: record && record.id || null,
      policy: record && record.policy || "component-load",
      mode: record && record.mode || "runtime_render",
      insularHydration: Boolean(record && record.insularHydration),
      correlationId,
      status: "pending"
    };
    history.push(entry);
    dispatchMaracaEvent("xtend-maraca:hydration-start", entry);
    try {
      const result = await (kernelController && kernelController.enabled && typeof kernelController.scheduleWork === "function"
        ? kernelController.scheduleWork("hydration", runHydration, {
            operation: record && record.operation || "operation:xtend.rmt/hydration/document",
            hydrationId: record && record.id || "",
            surface: entry.surface || "",
            component: tag,
            correlationId
          })
        : runHydration());
      entry.status = "hydrated";
      entry.result = result;
      dispatchMaracaEvent(record && record.insularHydration ? "xtend-maraca:insular-hydration" : "xtend-maraca:hydration-complete", {
        ...entry,
        result
      });
      return result;
    } catch (error) {
      entry.status = "error";
      const diagnostic = publishDiagnostic(createMaracaErrorDiagnostic("xtend.maraca.hydration_error", error));
      dispatchMaracaEvent("xtend-maraca:hydration-error", {
        ...entry,
        diagnostic
      });
      if (MARACA_HYDRATION.strict) throw error;
      return null;
    }
  }

  async function hydrateAll(tags, metadata = {}) {
    const loaded = [];
    for (const tag of Array.from(new Set((tags || []).filter(Boolean)))) {
      loaded.push(await hydrateComponent(tag, metadata));
    }
    return loaded;
  }

  function snapshot() {
    return {
      schema: "xtend.maraca.hydration-snapshot.v1",
      mode: MARACA_HYDRATION.mode,
      status: MARACA_HYDRATION.status,
      enabled: MARACA_HYDRATION.enabled,
      summary: MARACA_HYDRATION.summary || {},
      records: records.map((record) => ({
        id: record.id,
        surface: record.surface,
        component: record.component,
        policy: record.policy,
        mode: record.mode,
        insularHydration: Boolean(record.insularHydration)
      })),
      history: history.slice(),
      diagnostics: listDiagnostics()
    };
  }

  return Object.freeze({
    enabled: Boolean(MARACA_HYDRATION.enabled && artifact),
    mode: MARACA_HYDRATION.mode,
    status: MARACA_HYDRATION.status,
    hydrateComponent,
    hydrateAll,
    listDiagnostics,
    snapshot
  });
}

function observeViewportComponents(surfaceEntries, options = {}, hydrationController = null) {
  const observed = [];
  const loadingTags = new Set();
  const observer = new IntersectionObserver((records) => {
    records.forEach((record) => {
      if (!record.isIntersecting && record.intersectionRatio <= 0) return;
      observer.unobserve(record.target);
      const tag = record.target && record.target.getAttribute("data-rmt-component");
      if (!tag || loadingTags.has(tag)) return;
      loadingTags.add(tag);
      const surface = entrySurfaceForElement(surfaceEntries, record.target);
      const loader = hydrationController && hydrationController.enabled && typeof hydrationController.hydrateComponent === "function"
        ? hydrationController.hydrateComponent(tag, { surface: surface && surface.id || "" })
        : ensureMaracaComponent(tag);
      Promise.resolve(loader)
        .then(() => dispatchMaracaEvent("xtend-maraca:component-load", {
          tag,
          strategy: "viewport"
        }))
        .catch((error) => dispatchMaracaEvent("xtend-maraca:component-error", {
          tag,
          message: error && error.message ? error.message : String(error)
        }));
    });
  }, {
    root: options.viewportRoot || null,
    rootMargin: options.rootMargin || "160px",
    threshold: options.threshold === undefined ? 0 : options.threshold
  });

  surfaceEntries.forEach((entry) => {
    if (!entry || !entry.element) return;
    const tag = entry.element.getAttribute("data-rmt-component")
      || entry.surface && entry.surface.component
      || entry.element.localName;
    if (!tag) return;
    observer.observe(entry.element);
    observed.push(tag);
  });

  return {
    strategy: "viewport",
    observedTags: Array.from(new Set(observed)),
    observedCount: observed.length,
    observer
  };
}

function entrySurfaceForElement(surfaceEntries, element) {
  const entry = (surfaceEntries || []).find((candidate) => candidate && candidate.element === element);
  return entry && entry.surface || null;
}

let currentMaracaKernel = null;
let currentMaracaOrchestration = null;
let currentMaracaHydration = null;
let currentMaracaValidation = null;
let currentMaracaTransitions = null;
let currentMaracaTelemetry = null;

async function bootXtendMaraca(options = {}) {
  if (typeof document === "undefined") {
    return { ok: false, status: "no_document", schema: MARACA_SCHEMA };
  }
  const root = options.root || document.querySelector("[data-maraca-root]") || document.getElementById("xtend-maraca-root") || document.body;
  attachMaracaCss(root);
  const fragment = document.createDocumentFragment();
  const surfaceEntries = MARACA_SURFACES.map((surface) => {
    const element = createSurfaceElement(surface);
    fragment.appendChild(element);
    return { surface, element };
  });
  root.appendChild(fragment);
  currentMaracaKernel = createKernelController(root, options);
  currentMaracaHydration = createHydrationController(root, options, currentMaracaKernel);
  currentMaracaOrchestration = createOrchestrationController(root, options, currentMaracaKernel, currentMaracaHydration);
  currentMaracaValidation = currentMaracaOrchestration && currentMaracaOrchestration.validationRuntime || null;
  currentMaracaTransitions = currentMaracaOrchestration && currentMaracaOrchestration.transitionRuntime || null;
  currentMaracaTelemetry = createTelemetryBridge(currentMaracaKernel, currentMaracaOrchestration, currentMaracaHydration, currentMaracaValidation, currentMaracaTransitions);
  const activeSurfaceEntries = currentMaracaOrchestration && currentMaracaOrchestration.enabled
    ? createSurfaceEntriesFromRoot(root)
    : surfaceEntries;
  const lazyStrategy = resolveLazyStrategy(options);
  let lazyController = null;
  if (lazyStrategy === "viewport") {
    lazyController = observeViewportComponents(activeSurfaceEntries, options, currentMaracaHydration);
  } else {
    if (currentMaracaHydration && currentMaracaHydration.enabled) {
      await currentMaracaHydration.hydrateAll(MARACA_COMPONENTS.map((entry) => entry.tag));
    } else {
      await ensureMaracaComponents(MARACA_COMPONENTS.map((entry) => entry.tag));
    }
  }
  const result = {
    ok: true,
    status: lazyStrategy === "viewport" ? "booted_lazy" : "booted",
    schema: MARACA_SCHEMA,
    lazyStrategy,
    componentTags: MARACA_COMPONENTS.map((entry) => entry.tag),
    pendingComponentCount: lazyStrategy === "viewport" ? MARACA_COMPONENTS.length : 0,
    surfaceCount: MARACA_SURFACES.length,
    eventCount: MARACA_EVENTS.length,
    orchestration: {
      enabled: Boolean(currentMaracaOrchestration && currentMaracaOrchestration.enabled),
      mode: MARACA_ORCHESTRATION.mode,
      status: MARACA_ORCHESTRATION.status,
      diagnosticCount: currentMaracaOrchestration ? currentMaracaOrchestration.listDiagnostics().length : 0
    },
    kernel: {
      enabled: Boolean(currentMaracaKernel && currentMaracaKernel.enabled),
      mode: MARACA_KERNEL.mode,
      status: currentMaracaKernel && currentMaracaKernel.status || MARACA_KERNEL.status,
      scheduledEndpointCount: currentMaracaKernel ? currentMaracaKernel.listScheduledEndpoints().length : 0,
      diagnosticCount: currentMaracaKernel ? currentMaracaKernel.listDiagnostics().length : 0
    },
    hydration: {
      enabled: Boolean(currentMaracaHydration && currentMaracaHydration.enabled),
      mode: MARACA_HYDRATION.mode,
      status: MARACA_HYDRATION.status,
      diagnosticCount: currentMaracaHydration ? currentMaracaHydration.listDiagnostics().length : 0
    },
    validation: {
      enabled: Boolean(currentMaracaValidation),
      mode: MARACA_VALIDATION.mode,
      status: currentMaracaValidation ? "booted" : MARACA_VALIDATION.status,
      diagnosticCount: currentMaracaValidation && typeof currentMaracaValidation.listDiagnostics === "function" ? currentMaracaValidation.listDiagnostics().length : 0
    },
    transitions: {
      enabled: Boolean(currentMaracaTransitions),
      mode: MARACA_TRANSITIONS.mode,
      status: currentMaracaTransitions ? "booted" : MARACA_TRANSITIONS.status,
      activeCount: currentMaracaTransitions && typeof currentMaracaTransitions.listActiveTransitions === "function" ? currentMaracaTransitions.listActiveTransitions().length : 0,
      diagnosticCount: currentMaracaTransitions && typeof currentMaracaTransitions.listDiagnostics === "function" ? currentMaracaTransitions.listDiagnostics().length : 0
    },
    lazyObservedCount: lazyController ? lazyController.observedCount : 0,
    publicNameReservations: MARACA_PUBLIC_NAMES
  };
  window.__XTendMaracaResult = result;
  window.__XTendMaracaLazyController = lazyController;
  window.__XTendMaracaKernel = currentMaracaKernel;
  window.__XTendMaracaOrchestration = currentMaracaOrchestration;
  window.__XTendMaracaHydration = currentMaracaHydration;
  window.__XTendMaracaValidation = currentMaracaValidation;
  window.__XTendMaracaTransitions = currentMaracaTransitions;
  window.__XTendMaracaTelemetry = currentMaracaTelemetry;
  if (currentMaracaTelemetry) currentMaracaTelemetry.publish("boot", result);
  dispatchMaracaEvent("xtend-maraca:boot", result);
  return result;
}

const XTendMaraca = Object.freeze({
  schema: MARACA_SCHEMA,
  components: MARACA_COMPONENTS,
  surfaces: MARACA_SURFACES,
  events: MARACA_EVENTS,
  orchestrationPlan: MARACA_ORCHESTRATION,
  kernelPlan: MARACA_KERNEL,
  hydrationPlan: MARACA_HYDRATION,
  validationPlan: MARACA_VALIDATION,
  transitionPlan: MARACA_TRANSITIONS,
  get kernel() {
    return currentMaracaKernel;
  },
  get orchestration() {
    return currentMaracaOrchestration;
  },
  get hydration() {
    return currentMaracaHydration;
  },
  get validation() {
    return currentMaracaValidation;
  },
  get transitions() {
    return currentMaracaTransitions;
  },
  get telemetry() {
    return currentMaracaTelemetry;
  },
  stackModules: MARACA_STACK_MODULES,
  ensureComponent: ensureMaracaComponent,
  boot: bootXtendMaraca
});

function shouldAutoBootXtendMaraca() {
  return window.__XTendMaracaDisableAutoBoot !== true
    && window.XTendMaracaAutoBoot !== false;
}

function resolveAutoBootOptions() {
  const options = window.__XTendMaracaAutoBootOptions;
  if (typeof options === "function") return options();
  return options && typeof options === "object" ? options : {};
}

function scheduleXtendMaracaAutoBoot() {
  const boot = () => {
    if (!shouldAutoBootXtendMaraca()) return;
    Promise.resolve(resolveAutoBootOptions())
      .then((options) => bootXtendMaraca(options))
      .catch((error) => {
        window.__XTendMaracaAutoBootError = error;
        dispatchMaracaEvent("xtend-maraca:boot-error", {
          message: error && error.message ? error.message : String(error)
        });
      });
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}

if (typeof window !== "undefined") {
  window.XTendMaraca = XTendMaraca;
  scheduleXtendMaracaAutoBoot();
}

export { MARACA_COMPONENTS, MARACA_SURFACES, MARACA_EVENTS, MARACA_ORCHESTRATION, MARACA_KERNEL, MARACA_HYDRATION, MARACA_VALIDATION, MARACA_TRANSITIONS, MARACA_PUBLIC_NAMES, MARACA_STACK_MODULES, ensureMaracaComponent, bootXtendMaraca };
export default XTendMaraca;
`;
}

function minifyLocalEsModule(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n\s+/g, '\n')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const ROLLUP_VIRTUAL_ENTRY_ID = 'xtend-maraca:entry';
const ROLLUP_VIRTUAL_ENTRY_RESOLVED = '\0xtend-maraca-entry';

function createRollupVirtualEntryPlugin(plan, source) {
  return {
    name: 'xtend-maraca-virtual-entry',
    resolveId(id, importer) {
      if (id === ROLLUP_VIRTUAL_ENTRY_ID) return ROLLUP_VIRTUAL_ENTRY_RESOLVED;
      if (importer === ROLLUP_VIRTUAL_ENTRY_RESOLVED && isKernelRuntimeExternalImport(plan, id)) {
        return { id, external: true };
      }
      if (importer === ROLLUP_VIRTUAL_ENTRY_RESOLVED && id.startsWith('.')) {
        return path.resolve(plan.outputDir, id);
      }
      return null;
    },
    load(id) {
      if (id === ROLLUP_VIRTUAL_ENTRY_RESOLVED) return source;
      return null;
    }
  };
}

function createRollupManualChunks(plan) {
  if (plan.lazy === 'none') return undefined;
  const componentChunks = new Map(plan.components.selected
    .filter((entry) => !entry.native && entry.absolutePath)
    .map((entry) => [
      path.resolve(entry.absolutePath),
      entry.tag.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'component'
    ]));

  return (id) => componentChunks.get(path.resolve(id)) || null;
}

function isKernelRuntimeExternalImport(plan, id) {
  return Boolean(
    plan && plan.kernel && plan.kernel.enabled
    && (
      id === `./${KERNEL_RUNTIME_BUNDLE_FILE}`
      || id === KERNEL_RUNTIME_BUNDLE_FILE
      || toPosix(id).endsWith(`/${KERNEL_RUNTIME_BUNDLE_FILE}`)
      || id === `./${KERNEL_CONTROLLER_BUNDLE_FILE}`
      || id === KERNEL_CONTROLLER_BUNDLE_FILE
      || toPosix(id).endsWith(`/${KERNEL_CONTROLLER_BUNDLE_FILE}`)
    )
  );
}

function createRollupTreeshakeOptions(plan) {
  if (plan.profile === 'debug') return false;
  return {
    moduleSideEffects: true,
    propertyReadSideEffects: true,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: true
  };
}

function createTerserOptions(plan, nameCache) {
  if (plan.profile === 'debug') return null;
  const reserved = Array.from(new Set(plan.publicNameReservations.concat([
    'XTendMaraca',
    'ensureMaracaComponent',
    'bootXtendMaraca'
  ])));
  const mangle = {
    toplevel: true,
    reserved
  };

  if (plan.profile === 'max') {
    mangle.properties = {
      regex: /^_/,
      reserved
    };
  }

  return {
    ecma: 2020,
    module: true,
    toplevel: true,
    compress: {
      module: true,
      passes: plan.profile === 'max' ? 3 : 2,
      toplevel: true,
      unsafe: false
    },
    mangle,
    format: {
      comments: false
    },
    nameCache
  };
}

async function minifyRollupChunks(plan, output, terserModule) {
  if (plan.profile === 'debug') return { output, nameCache: null };

  const nameCachePath = path.join(plan.outputDir, 'xtend.maraca.name-cache.json');
  const nameCache = plan.profile === 'max' && fs.existsSync(nameCachePath)
    ? readJson(nameCachePath)
    : {};
  const terserOptions = createTerserOptions(plan, nameCache);
  const minifiedOutput = [];

  for (const chunk of output) {
    if (chunk.type !== 'chunk') {
      minifiedOutput.push(chunk);
      continue;
    }

    const result = await terserModule.minify({ [chunk.fileName]: chunk.code }, terserOptions);
    if (!result || typeof result.code !== 'string') {
      throw new Error(`Terser did not return code for ${chunk.fileName}`);
    }
    minifiedOutput.push({
      ...chunk,
      code: result.code,
      map: null
    });
  }

  if (plan.profile === 'max') {
    writeJson(nameCachePath, nameCache);
  }

  return { output: minifiedOutput, nameCache: plan.profile === 'max' ? nameCachePath : null };
}

function writeRollupOutput(plan, output) {
  const files = [];
  output.forEach((item) => {
    const filePath = path.join(plan.outputDir, item.fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    if (item.type === 'asset') {
      fs.writeFileSync(filePath, item.source);
    } else {
      fs.writeFileSync(filePath, `${item.code}\n`);
      if (item.map) {
        fs.writeFileSync(`${filePath}.map`, item.map.toString());
      }
    }

    const bytes = fs.statSync(filePath).size;
    files.push({
      type: item.type,
      fileName: item.fileName,
      path: filePath,
      bytes,
      isEntry: item.type === 'chunk' && item.isEntry === true,
      isDynamicEntry: item.type === 'chunk' && item.isDynamicEntry === true,
      imports: item.type === 'chunk' ? item.imports : [],
      dynamicImports: item.type === 'chunk' ? item.dynamicImports : []
    });
  });
  return files;
}

async function createRollupBundleFiles(plan, rawSource) {
  const rootDir = plan.rootDir || path.dirname(path.dirname(__filename));
  const rollupTool = requireOptional('rollup', rootDir);
  const terserTool = requireOptional('terser', rootDir);

  if (!rollupTool.available || !terserTool.available) {
    return {
      ok: false,
      reason: 'toolchain_unavailable',
      rollup: rollupTool,
      terser: terserTool,
      files: []
    };
  }

  const warnings = [];
  const bundle = await rollupTool.module.rollup({
    input: ROLLUP_VIRTUAL_ENTRY_ID,
    external: (id) => isKernelRuntimeExternalImport(plan, id),
    plugins: [createRollupVirtualEntryPlugin(plan, rawSource)],
    treeshake: createRollupTreeshakeOptions(plan),
    onwarn(warning) {
      warnings.push({
        code: warning && warning.code || 'ROLLUP_WARNING',
        message: warning && warning.message || String(warning)
      });
    }
  });

  try {
    const generated = await bundle.generate({
      format: 'es',
      dir: plan.outputDir,
      entryFileNames: 'xtend.maraca.mjs',
      chunkFileNames: 'chunks/[name]-[hash].mjs',
      paths(id) {
        if (toPosix(id).endsWith(`/${KERNEL_CONTROLLER_BUNDLE_FILE}`) || id === `./${KERNEL_CONTROLLER_BUNDLE_FILE}` || id === KERNEL_CONTROLLER_BUNDLE_FILE) {
          return `./${KERNEL_CONTROLLER_BUNDLE_FILE}`;
        }
        if (toPosix(id).endsWith(`/${KERNEL_RUNTIME_BUNDLE_FILE}`) || id === `./${KERNEL_RUNTIME_BUNDLE_FILE}` || id === KERNEL_RUNTIME_BUNDLE_FILE) {
          return `./${KERNEL_RUNTIME_BUNDLE_FILE}`;
        }
        return id;
      },
      sourcemap: plan.profile === 'debug',
      manualChunks: createRollupManualChunks(plan),
      generatedCode: {
        constBindings: true,
        objectShorthand: true
      }
    });
    const minified = await minifyRollupChunks(plan, generated.output, terserTool.module);
    const files = writeRollupOutput(plan, minified.output);

    return {
      ok: true,
      reason: 'rollup-terser',
      rollup: rollupTool,
      terser: terserTool,
      files,
      warnings,
      nameCache: minified.nameCache
    };
  } finally {
    if (typeof bundle.close === 'function') {
      await bundle.close();
    }
  }
}

function copyKernelRuntimeAsset(plan) {
  if (!plan || !plan.kernel || !plan.kernel.enabled) return null;
  const packageRoot = path.dirname(path.dirname(__filename));
  const candidates = [
    path.resolve(plan.rootDir || packageRoot, 'xtendrmt/rmt-runtime.esm.js'),
    path.resolve(packageRoot, 'xtendrmt/rmt-runtime.esm.js')
  ];
  const sourcePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!sourcePath) return null;
  const targetPath = path.join(plan.outputDir, KERNEL_RUNTIME_BUNDLE_FILE);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  return {
    type: 'asset',
    fileName: KERNEL_RUNTIME_BUNDLE_FILE,
    path: targetPath,
    bytes: fs.statSync(targetPath).size,
    isEntry: false,
    isDynamicEntry: false,
    imports: [],
    dynamicImports: []
  };
}

function copyKernelControllerRuntimeAsset(plan) {
  if (!plan || !plan.kernel || !plan.kernel.enabled) return null;
  const packageRoot = path.dirname(path.dirname(__filename));
  const candidates = [
    path.resolve(plan.rootDir || packageRoot, 'xtendrmt/rmt-kernel-orchestration-controller.js'),
    path.resolve(packageRoot, 'xtendrmt/rmt-kernel-orchestration-controller.js')
  ];
  const sourcePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!sourcePath) return null;
  const targetPath = path.join(plan.outputDir, KERNEL_CONTROLLER_BUNDLE_FILE);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  return {
    type: 'asset',
    fileName: KERNEL_CONTROLLER_BUNDLE_FILE,
    path: targetPath,
    bytes: fs.statSync(targetPath).size,
    isEntry: false,
    isDynamicEntry: false,
    imports: [],
    dynamicImports: []
  };
}

function createBundleReport(plan, bundleFiles, sizeBudgetReport, options = {}) {
  const repoRoot = plan.rootDir || path.dirname(path.dirname(__filename));
  const entryFile = bundleFiles.find((file) => file.isEntry) || {
    path: plan.outputs.entry,
    fileName: path.basename(plan.outputs.entry),
    bytes: fs.existsSync(plan.outputs.entry) ? fs.statSync(plan.outputs.entry).size : 0
  };
  const totalBytes = bundleFiles.reduce((sum, file) => sum + Number(file.bytes || 0), 0) || entryFile.bytes;

  return {
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    ok: true,
    status: 'built',
    source: plan.source,
    outputDir: repoRelative(plan.outputDir, repoRoot),
    profile: plan.profile,
    lazy: plan.lazy,
    css: plan.css,
    vendor: plan.vendor,
    componentMode: plan.componentMode,
    stackMode: plan.stackMode,
    target: 'modern-esm',
    entry: entryFile.path,
    entryRelative: repoRelative(entryFile.path, repoRoot),
    entryBytes: entryFile.bytes,
    bytes: totalBytes,
    bundleFiles: bundleFiles.map((file) => ({
      type: file.type,
      fileName: file.fileName,
      path: repoRelative(file.path, repoRoot),
      bytes: file.bytes,
      isEntry: file.isEntry,
      isDynamicEntry: file.isDynamicEntry,
      imports: file.imports,
      dynamicImports: file.dynamicImports
    })),
    loader: plan.loader,
    components: {
      selected: plan.components.selected.map((entry) => ({
        tag: entry.tag,
        source: entry.source,
        importPath: entry.native ? null : ensureRelativeImport(plan.outputDir, entry.absolutePath),
        native: Boolean(entry.native)
      })),
      unknown: []
    },
    runtimeModules: plan.runtimeModules,
    stackModules: (plan.stackModules || []).map((entry) => ({
      id: entry.id,
      source: entry.source
    })),
    orchestration: plan.orchestration ? {
      schema: plan.orchestration.schema,
      mode: plan.orchestration.mode,
      enabled: plan.orchestration.enabled,
      status: plan.orchestration.status,
      planStatus: plan.orchestration.status,
      runtimeExpectedStatus: plan.orchestration.enabled ? 'booted' : 'disabled',
      supported: plan.orchestration.supported,
      artifactSchema: plan.orchestration.artifact && plan.orchestration.artifact.schema || null,
      runtimeModules: plan.orchestration.runtimeModules,
      summary: plan.orchestration.summary,
      diagnostics: plan.orchestration.diagnostics
    } : null,
    kernel: plan.kernel ? {
      schema: plan.kernel.schema,
      mode: plan.kernel.mode,
      enabled: plan.kernel.enabled,
      status: plan.kernel.status,
      planStatus: plan.kernel.status,
      runtimeExpectedStatus: plan.kernel.enabled ? 'booted' : 'disabled',
      supported: plan.kernel.supported,
      artifactSchema: plan.kernel.artifact && plan.kernel.artifact.schema || null,
      recordsSchema: plan.kernel.artifact && plan.kernel.artifact.records && plan.kernel.artifact.records.schema || null,
      runtimeModules: plan.kernel.runtimeModules,
      summary: plan.kernel.summary,
      diagnostics: plan.kernel.diagnostics
    } : null,
    hydration: plan.hydration ? {
      schema: plan.hydration.schema,
      mode: plan.hydration.mode,
      enabled: plan.hydration.enabled,
      status: plan.hydration.status,
      planStatus: plan.hydration.status,
      runtimeExpectedStatus: plan.hydration.enabled ? 'booted' : 'disabled',
      supported: plan.hydration.supported,
      artifactSchema: plan.hydration.artifact && plan.hydration.artifact.schema || null,
      runtimeModules: plan.hydration.runtimeModules,
      summary: plan.hydration.summary,
      diagnostics: plan.hydration.diagnostics
    } : null,
    validation: plan.validation ? {
      schema: plan.validation.schema,
      mode: plan.validation.mode,
      enabled: plan.validation.enabled,
      status: plan.validation.status,
      planStatus: plan.validation.status,
      runtimeExpectedStatus: plan.validation.enabled ? 'booted' : 'disabled',
      supported: plan.validation.supported,
      artifactSchema: plan.validation.artifact && plan.validation.artifact.schema || null,
      runtimeModules: plan.validation.runtimeModules,
      summary: plan.validation.summary,
      diagnostics: plan.validation.diagnostics
    } : null,
    transitions: plan.transitions ? {
      schema: plan.transitions.schema,
      mode: plan.transitions.mode,
      enabled: plan.transitions.enabled,
      status: plan.transitions.status,
      planStatus: plan.transitions.status,
      runtimeExpectedStatus: plan.transitions.enabled ? 'booted' : 'disabled',
      supported: plan.transitions.supported,
      artifactSchema: plan.transitions.artifact && plan.transitions.artifact.schema || null,
      runtimeModules: plan.transitions.runtimeModules,
      summary: plan.transitions.summary,
      diagnostics: plan.transitions.diagnostics
    } : null,
    publicNameReservations: plan.publicNameReservations,
    toolchain: {
      ...plan.toolchain,
      active: options.activeToolchain || 'local-esm-importgraph-fallback',
      warnings: options.warnings || [],
      nameCache: options.nameCache || null
    },
    sizeBudget: sizeBudgetReport,
    forbiddenRuntimeDependencies: {
      componentManifestJson: false,
      dataManifestAttribute: false,
      xtendLoader: false
    }
  };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${stableJson(value)}\n`);
}

function createMaracaSizeBudgetReport(input) {
  const plan = input.plan;
  const selectedBytes = plan.components.selected.reduce((sum, entry) => {
    try {
      return sum + fs.statSync(entry.absolutePath).size;
    } catch (_) {
      return sum;
    }
  }, 0);
  const stackBytes = (plan.stackModules || []).reduce((sum, entry) => {
    try {
      return sum + fs.statSync(entry.absolutePath).size;
    } catch (_) {
      return sum;
    }
  }, 0);
  let loaderBytes = 0;
  try {
    loaderBytes = fs.statSync(path.join(path.dirname(path.dirname(__filename)), 'xtend-loader.js')).size;
  } catch (_) {}
  const baselineBytes = loaderBytes + selectedBytes + stackBytes;
  const bundleBytes = Number(input.entryBytes || 0);
  const ratio = baselineBytes > 0 ? bundleBytes / baselineBytes : 1;
  const budgetMode = plan.sizeBudgetMode || 'strict';
  const enforced = plan.profile !== 'debug' && budgetMode === 'strict';
  const ok = enforced ? baselineBytes > 0 && bundleBytes < baselineBytes : true;

  return {
    schema: MARACA_SIZE_BUDGET_REPORT_SCHEMA,
    ok,
    status: enforced
      ? (ok ? 'within_budget' : 'over_budget')
      : (budgetMode === 'off' ? 'disabled' : plan.profile === 'debug' ? 'debug_not_enforced' : 'warning_not_enforced'),
    profile: plan.profile,
    mode: budgetMode,
    baseline: {
      mode: stackBytes > 0
        ? 'legacy-loader-plus-selected-component-modules-plus-stack-modules'
        : 'legacy-loader-plus-selected-component-modules',
      loaderBytes,
      selectedComponentBytes: selectedBytes,
      stackModuleBytes: stackBytes,
      bytes: baselineBytes
    },
    baselineBytes,
    bundleBytes,
    ratio,
    budgets: {
      modernEsmEntryMustBeSmallerThanBaseline: enforced,
      enforcement: budgetMode
    }
  };
}

function buildMaracaBundle(input = {}, options = {}) {
  const plan = createMaracaBuildPlan(input, options);
  if (!plan.ok) {
    return {
      schema: MARACA_BUNDLE_REPORT_SCHEMA,
      ok: false,
      status: plan.status,
      plan,
      bundleReport: null,
      sizeBudgetReport: null
    };
  }

  fs.mkdirSync(plan.outputDir, { recursive: true });
  const kernelRuntimeAsset = copyKernelRuntimeAsset(plan);
  const kernelControllerRuntimeAsset = copyKernelControllerRuntimeAsset(plan);
  const entryPath = plan.outputs.entry;
  const rawSource = createBundleSource(plan);
  const source = plan.profile === 'debug' ? rawSource : minifyLocalEsModule(rawSource);
  fs.writeFileSync(entryPath, `${source}\n`);

  if (plan.css === 'external' && plan.outputs.css) {
    fs.writeFileSync(plan.outputs.css, `${createCssText(plan)}\n`);
  }

  const entryBytes = fs.statSync(entryPath).size;
  const sizeBudgetReport = createMaracaSizeBudgetReport({
    plan,
    entryPath,
    entryBytes
  });
  const bundleFiles = [{
    type: 'chunk',
    fileName: path.basename(entryPath),
    path: entryPath,
    bytes: entryBytes,
    isEntry: true,
    isDynamicEntry: false,
    imports: [],
    dynamicImports: []
  }].concat(kernelControllerRuntimeAsset ? [kernelControllerRuntimeAsset] : []).concat(kernelRuntimeAsset ? [kernelRuntimeAsset] : []);
  const bundleReport = createBundleReport(plan, bundleFiles, sizeBudgetReport, {
    activeToolchain: 'local-esm-importgraph-fallback'
  });

  writeJson(plan.outputs.bundleReport, bundleReport);
  writeJson(plan.outputs.sizeBudgetReport, sizeBudgetReport);

  return {
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    ok: bundleReport.ok && sizeBudgetReport.ok,
    status: bundleReport.ok && sizeBudgetReport.ok ? 'built' : 'built_over_budget',
    plan,
    bundleReport,
    sizeBudgetReport
  };
}

async function buildMaracaBundleAsync(input = {}, options = {}) {
  const plan = createMaracaBuildPlan(input, options);
  if (!plan.ok) {
    return {
      schema: MARACA_BUNDLE_REPORT_SCHEMA,
      ok: false,
      status: plan.status,
      plan,
      bundleReport: null,
      sizeBudgetReport: null
    };
  }

  fs.mkdirSync(plan.outputDir, { recursive: true });
  const kernelRuntimeAsset = copyKernelRuntimeAsset(plan);
  const kernelControllerRuntimeAsset = copyKernelControllerRuntimeAsset(plan);
  const rawSource = createBundleSource(plan);
  let rollupResult;

  try {
    rollupResult = await createRollupBundleFiles(plan, rawSource);
  } catch (error) {
    return {
      schema: MARACA_BUNDLE_REPORT_SCHEMA,
      ok: false,
      status: 'build_failed',
      plan: {
        ...plan,
        diagnostics: plan.diagnostics.concat({
          code: 'xtend.maraca.rollup_terser_failed',
          severity: 'error',
          message: error && error.message ? error.message : String(error)
        })
      },
      bundleReport: null,
      sizeBudgetReport: null
    };
  }

  if (!rollupResult.ok) {
    return buildMaracaBundle(input, options);
  }

  if (plan.css === 'external' && plan.outputs.css) {
    fs.writeFileSync(plan.outputs.css, `${createCssText(plan)}\n`);
    const cssFile = {
      type: 'asset',
      fileName: path.basename(plan.outputs.css),
      path: plan.outputs.css,
      bytes: fs.statSync(plan.outputs.css).size,
      isEntry: false,
      isDynamicEntry: false,
      imports: [],
      dynamicImports: []
    };
    rollupResult.files.push(cssFile);
  }
  if (kernelControllerRuntimeAsset) {
    rollupResult.files.push(kernelControllerRuntimeAsset);
  }
  if (kernelRuntimeAsset) {
    rollupResult.files.push(kernelRuntimeAsset);
  }

  const entryFile = rollupResult.files.find((file) => file.isEntry) || {
    path: plan.outputs.entry,
    bytes: fs.existsSync(plan.outputs.entry) ? fs.statSync(plan.outputs.entry).size : 0
  };
  const bundleBytes = rollupResult.files.reduce((sum, file) => sum + Number(file.bytes || 0), 0);
  const sizeBudgetReport = createMaracaSizeBudgetReport({
    plan,
    entryPath: entryFile.path,
    entryBytes: bundleBytes
  });
  const bundleReport = createBundleReport(plan, rollupResult.files, sizeBudgetReport, {
    activeToolchain: 'rollup-terser',
    warnings: rollupResult.warnings,
    nameCache: rollupResult.nameCache
  });

  writeJson(plan.outputs.bundleReport, bundleReport);
  writeJson(plan.outputs.sizeBudgetReport, sizeBudgetReport);

  return {
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    ok: bundleReport.ok && sizeBudgetReport.ok,
    status: bundleReport.ok && sizeBudgetReport.ok ? 'built' : 'built_over_budget',
    plan,
    bundleReport,
    sizeBudgetReport
  };
}

module.exports = {
  MARACA_PACKAGE_SCHEMA,
  MARACA_BUILD_PLAN_SCHEMA,
  MARACA_BUNDLE_REPORT_SCHEMA,
  MARACA_SIZE_BUDGET_REPORT_SCHEMA,
  MARACA_ORCHESTRATION_PLAN_SCHEMA,
  MARACA_KERNEL_PLAN_SCHEMA,
  MARACA_HYDRATION_PLAN_SCHEMA,
  MARACA_VALIDATION_PLAN_SCHEMA,
  MARACA_TRANSITION_PLAN_SCHEMA,
  COMPONENT_UNKNOWN_CODE,
  COMPONENT_DYNAMIC_CODE,
  DEFAULT_SOURCE,
  createMaracaBuildPlan,
  buildMaracaBundle,
  buildMaracaBundleAsync,
  createMaracaSizeBudgetReport,
  getMaracaToolchainAvailability
};
