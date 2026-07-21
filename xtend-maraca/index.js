const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const vm = require('vm');
const {
  CSS_PROVIDER_SOURCE_BLOCKED_CODE,
  CSS_PROVIDER_UNAVAILABLE_CODE,
  MARACA_CSS_BUILD_PLAN_SCHEMA,
  createCssArtifact,
  createCssBuildEvidence,
  createCssBuildRequest,
  createNativeMaracaCssProvider,
  runCssProviderLifecycle,
  validateCssBuildRequest,
  validateCssProvider
} = require('./css-provider');
const {
  MARACA_APP_SERVICE_MANIFEST_SCHEMA,
  MARACA_SERVICE_BUILD_PLAN_SCHEMA,
  MARACA_SERVICE_BUILD_REPORT_SCHEMA,
  buildMaracaServiceArtifacts,
  createMaracaServiceBuildPlan,
  createTypeScriptRollupPlugin,
  normalizeServiceBuildOptions
} = require('./service-build-provider');

const MARACA_PACKAGE_SCHEMA = 'xtend.maraca.package-metadata.v1';
const MARACA_BUILD_PLAN_SCHEMA = 'xtend.maraca.build-plan.v1';
const MARACA_BUNDLE_REPORT_SCHEMA = 'xtend.maraca.bundle-report.v1';
const MARACA_SIZE_BUDGET_REPORT_SCHEMA = 'xtend.maraca.size-budget-report.v1';
const MARACA_PERFORMANCE_REPORT_SCHEMA = 'xtend.maraca.performance-report.v1';
const MARACA_ORCHESTRATION_PLAN_SCHEMA = 'xtend.maraca.orchestration-plan.v1';
const MARACA_KERNEL_PLAN_SCHEMA = 'xtend.maraca.kernel-plan.v1';
const MARACA_HYDRATION_PLAN_SCHEMA = 'xtend.maraca.hydration-plan.v1';
const MARACA_WARM_REENTRY_REPORT_SCHEMA = 'xtend.maraca.warm-reentry-report.v1';
const MARACA_PREWARM_WORKER_RUNTIME_SCHEMA = 'xtend.maraca.prewarm-worker-runtime.v1';
const MARACA_SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA = 'xtend.maraca.super-prewarm-worker-experiment.v1';
const MARACA_UI_COPROCESSOR_PLAN_SCHEMA = 'xtend.maraca.ui-coprocessor-plan.v1';
const MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA = 'xtend.maraca.web-app-manifest-plan.v1';
const MARACA_WEB_APP_MANIFEST_REPORT_SCHEMA = 'xtend.maraca.web-app-manifest-report.v1';
const MARACA_PWA_SERVICE_WORKER_PLAN_SCHEMA = 'xtend.maraca.pwa-service-worker-plan.v1';
const MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA = 'xtend.maraca.pwa-service-worker-report.v1';
const MARACA_LIFECYCLE_REPORT_SCHEMA = 'xtend.maraca.lifecycle-report.v1';
const MARACA_TEMPLATE_ARTIFACTS_REPORT_SCHEMA = 'xtend.maraca.template-artifacts-report.v1';
const MARACA_VALIDATION_PLAN_SCHEMA = 'xtend.maraca.validation-plan.v1';
const MARACA_TRANSITION_PLAN_SCHEMA = 'xtend.maraca.transition-plan.v1';
const MARACA_PRODUCTION_BUNDLE_CLOSURE_SCHEMA = 'xtend.maraca.production-bundle-closure.v1';
const MARACA_BUILD_CONFIG_SCHEMA = 'xtend.maraca.build-config.v1';
const MARACA_TUNE_REPORT_SCHEMA = 'xtend.maraca.tune-report.v1';
const MARACA_COMPONENT_COMMAND_SCHEMA = 'xtend.rmt.component-command.v1';
const MARACA_COMPONENT_COMMAND_RESULT_SCHEMA = 'xtend.maraca.component-command-result.v1';

const DEFAULT_SOURCE = 'tests/rmt-language/fixtures/maraca-known-components.rmt';
const DEFAULT_OUT_DIR = '.xtend-build/maraca/app';
const VALID_PROFILES = new Set(['debug', 'production', 'max']);
const VALID_LAZY_MODES = new Set(['route', 'component', 'none']);
const VALID_CSS_MODES = new Set(['inline', 'external']);
const VALID_CSS_PREFLIGHT_MODES = new Set(['disabled', 'scoped', 'enabled']);
const VALID_CSS_PROVIDER_FALLBACKS = new Set(['none', 'native']);
const DEFAULT_CSS_PROVIDER = 'maraca-native';
const VALID_COMPONENT_MODES = new Set(['document', 'all']);
const VALID_STACK_MODES = new Set(['plan', 'runtime', 'full', 'none']);
const VALID_ORCHESTRATION_MODES = new Set(['auto', 'strict', 'off']);
const VALID_KERNEL_MODES = new Set(['auto', 'strict', 'off']);
const VALID_KERNEL_BOOT_MODES = new Set(['direct', 'productSurface']);
const VALID_HYDRATION_MODES = new Set(['auto', 'strict', 'off', 'warm', 'prewarm']);
const VALID_VALIDATION_MODES = new Set(['auto', 'strict', 'off']);
const VALID_TRANSITION_MODES = new Set(['auto', 'strict', 'off']);
const VALID_SIZE_BUDGET_MODES = new Set(['strict', 'warn', 'off']);
const TEMPLATE_ARTIFACT_DOCUMENT_KIND = 'rmt_template_artifact_document';
const TEMPLATE_ARTIFACT_BUNDLE_KIND = 'rmt_template_artifact_bundle';
const TEMPLATE_ARTIFACT_VERSION = '1.0';
const DEFAULT_TEMPLATE_RUNTIME_PROFILE_HINTS = Object.freeze([
  'browser',
  'detached_dom',
  'worker_prerender',
  'server_prerender'
]);
const MARACA_PERFORMANCE_BUDGET_CLASSES = Object.freeze([
  'visible_commit',
  'command_turnaround',
  'hydration_followup',
  'retained_warm_reuse'
]);
const COMPONENT_UNKNOWN_CODE = 'xtend.maraca.component_unknown';
const COMPONENT_DYNAMIC_CODE = 'xtend.maraca.dynamic_component_requires_opt_in';
const COMPONENT_UNSAFE_DYNAMIC_CODE = 'xtend.maraca.dynamic_component_unsafe_tag';
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
const SAFE_DYNAMIC_COMPONENT_TAG_PATTERN = /^[a-z][.0-9_a-z]*-[\-.0-9_a-z]*$/;
const UNSAFE_DYNAMIC_COMPONENT_TAGS = Object.freeze(new Set([
  'applet',
  'base',
  'body',
  'embed',
  'frame',
  'frameset',
  'head',
  'html',
  'iframe',
  'link',
  'meta',
  'noscript',
  'object',
  'script',
  'style',
  'template',
  'title'
]));
const VALIDATION_RUNTIME_MODULES = Object.freeze([
  'xtendrmt/rmt-form-validation-runtime.js'
]);
const TRANSITION_RUNTIME_MODULES = Object.freeze([
  'xtendrmt/rmt-animation-engine-runtime.js',
  'xtendrmt/rmt-surface-transition-runtime.js',
  'components/xutils.js',
  'components/xstate.js'
]);
const KERNEL_RUNTIME_MODULES = Object.freeze([
  'xtendrmt/rmt-kernel-orchestration-controller.js',
  'xtendrmt/rmt-runtime.esm.js'
]);
const KERNEL_FEATURE_ADOPTION_REGISTRY_MODULE = 'xtendrmt/rmt-kernel-feature-adoption-registry.js';
const KERNEL_POLICY_PARITY_MODULE = 'tools/rmt-language/kernel-policy-parity.js';
const KERNEL_POLICY_PARITY_SCHEMA = 'xtend.rmt.kernel-policy-parity.v1';
const KERNEL_POLICY_PARITY_REPORT_SCHEMA = 'xtend.rmt.kernel-policy-parity-report.v1';
const KERNEL_POLICY_PARITY_DRIFT_SCHEMA = 'xtend.rmt.kernel-policy-parity-drift.v1';
const KERNEL_RUNTIME_BUNDLE_FILE = 'runtime/xtendrmt-runtime.esm.js';
const KERNEL_CONTROLLER_BUNDLE_FILE = 'runtime/xtendrmt-kernel-orchestration-controller.js';
const KERNEL_RESUME_RUNTIME_BUNDLE_FILE = 'runtime/rmt-resume-runtime.js';
const ORCHESTRATION_RUNTIME_MODULES = Object.freeze([
  'xtendrmt/rmt-resume-runtime.js',
  'xtendrmt/rmt-state-selector-runtime.js',
  'xtendrmt/rmt-action-effect-runtime.js',
  'xtendrmt/rmt-event-routing-runtime.js',
  'xtendrmt/rmt-app-runtime.js',
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
  'xtendrmt/rmt-app-runtime.js',
  'xtendrmt/rmt-form-validation-runtime.js',
  'xtendrmt/rmt-animation-engine-runtime.js',
  'xtendrmt/rmt-surface-transition-runtime.js',
  'xtendrmt/rmt-state-selector-runtime.js',
  'xtendrmt/rmt-surface-resource-graph-runtime.js',
  'xtendrmt/rmt-component-capability-registry.js',
  'xtendrmt/rmt-native-shell-runtime.js',
  'xtendrmt/rmt-resume-runtime.js',
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
  'invokeMaracaComponentCommand',
  'bootXtendMaraca',
  'MARACA_COMPONENTS',
  'MARACA_SURFACES',
  'MARACA_EVENTS',
  'MARACA_ORCHESTRATION',
  'MARACA_KERNEL',
  'MARACA_HYDRATION',
  'MARACA_WARM_REENTRY',
  'MARACA_UI_COPROCESSOR',
  'MARACA_WEB_APP_MANIFEST',
  'MARACA_PWA',
  'MARACA_VALIDATION',
  'MARACA_TRANSITIONS',
  'MARACA_COMPONENT_COMMAND_SCHEMA',
  'MARACA_COMPONENT_COMMAND_RESULT_SCHEMA',
  'MARACA_PUBLIC_NAMES',
  'MARACA_STACK_MODULES',
  'XTendRmtKernelOrchestrationController',
  'XTendRmtAnimationEngineRuntime',
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
  MARACA_PERFORMANCE_REPORT_SCHEMA,
  MARACA_KERNEL_PLAN_SCHEMA,
  MARACA_HYDRATION_PLAN_SCHEMA,
  MARACA_WARM_REENTRY_REPORT_SCHEMA,
  MARACA_PREWARM_WORKER_RUNTIME_SCHEMA,
  MARACA_SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA,
  MARACA_UI_COPROCESSOR_PLAN_SCHEMA,
  MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA,
  MARACA_WEB_APP_MANIFEST_REPORT_SCHEMA,
  MARACA_PWA_SERVICE_WORKER_PLAN_SCHEMA,
  MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA,
  MARACA_TEMPLATE_ARTIFACTS_REPORT_SCHEMA,
  MARACA_VALIDATION_PLAN_SCHEMA,
  MARACA_TRANSITION_PLAN_SCHEMA,
  MARACA_PRODUCTION_BUNDLE_CLOSURE_SCHEMA,
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

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }
  if (!value || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function hashArtifactValue(value) {
  const source = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

let rmtKernelFeatureAdoptionRegistryModule = null;
let rmtKernelFeatureAdoptionRegistryModuleError = null;
let rmtKernelPolicyParityModule = null;
let rmtKernelPolicyParityModuleError = null;
let rmtManifestCache = null;
let rmtPerformanceRuntimeFactory = null;
let rmtPerformanceRuntimeFactoryError = null;

function loadRmtManifest(rootDir) {
  if (rmtManifestCache) return rmtManifestCache;
  const packageRoot = path.dirname(path.dirname(__filename));
  const candidates = [
    path.resolve(rootDir || process.cwd(), 'xtendrmt/rmt-manifest.json'),
    path.resolve(packageRoot, 'xtendrmt/rmt-manifest.json')
  ];
  const manifestPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!manifestPath) return null;
  try {
    rmtManifestCache = readJson(manifestPath);
    return rmtManifestCache;
  } catch (_) {
    return null;
  }
}

function loadRmtPerformanceRuntimeFactory(rootDir) {
  if (rmtPerformanceRuntimeFactory || rmtPerformanceRuntimeFactoryError) return rmtPerformanceRuntimeFactory;
  const packageRoot = path.dirname(path.dirname(__filename));
  const candidates = [
    path.resolve(rootDir || process.cwd(), 'xtendrmt/rmt-runtime.browser.js'),
    path.resolve(packageRoot, 'xtendrmt/rmt-runtime.browser.js')
  ];
  const runtimePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!runtimePath) {
    rmtPerformanceRuntimeFactoryError = new Error('XTendRMT browser runtime bundle was not found.');
    return null;
  }
  try {
    const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
    const sandbox = {
      console,
      setTimeout,
      clearTimeout,
      performance: {
        now: () => 0,
        getEntries: () => [],
        getEntriesByType: () => []
      }
    };
    sandbox.globalThis = sandbox;
    vm.runInNewContext(runtimeSource, sandbox, {
      filename: runtimePath,
      timeout: 1000
    });
    rmtPerformanceRuntimeFactory = sandbox.AppModules && sandbox.AppModules.createRmtPerformanceRuntime || null;
  } catch (error) {
    rmtPerformanceRuntimeFactoryError = error;
    rmtPerformanceRuntimeFactory = null;
  }
  return rmtPerformanceRuntimeFactory;
}

function loadUmdEsmHybridModule(modulePath, globalName) {
  const source = fs.readFileSync(modulePath, 'utf8');
  const exportBridgeStart = source.indexOf('\nconst __XTEND_RMT_KERNEL_FEATURE_ADOPTION_REGISTRY_API__ = globalThis.');
  const executableSource = exportBridgeStart >= 0 ? source.slice(0, exportBridgeStart) : source;
  const sandbox = {
    console,
    module: { exports: {} }
  };
  sandbox.exports = sandbox.module.exports;
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.runInNewContext(executableSource, sandbox, {
    filename: modulePath,
    timeout: 1000
  });
  if (sandbox.module.exports && Object.keys(sandbox.module.exports).length > 0) {
    return sandbox.module.exports;
  }
  return sandbox[globalName] || null;
}

function loadRmtKernelFeatureAdoptionRegistry(rootDir) {
  if (rmtKernelFeatureAdoptionRegistryModule || rmtKernelFeatureAdoptionRegistryModuleError) return rmtKernelFeatureAdoptionRegistryModule;
  const packageRoot = path.dirname(path.dirname(__filename));
  const candidates = [
    path.resolve(rootDir || process.cwd(), KERNEL_FEATURE_ADOPTION_REGISTRY_MODULE),
    path.resolve(packageRoot, KERNEL_FEATURE_ADOPTION_REGISTRY_MODULE)
  ];
  const registryPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!registryPath) return null;
  try {
    rmtKernelFeatureAdoptionRegistryModule = require(registryPath);
    return rmtKernelFeatureAdoptionRegistryModule;
  } catch (_) {}
  try {
    rmtKernelFeatureAdoptionRegistryModule = loadUmdEsmHybridModule(
      registryPath,
      'XTendRmtKernelFeatureAdoptionRegistry'
    );
    return rmtKernelFeatureAdoptionRegistryModule;
  } catch (error) {
    rmtKernelFeatureAdoptionRegistryModuleError = error;
    rmtKernelFeatureAdoptionRegistryModule = null;
    return null;
  }
}

function loadRmtKernelPolicyParityModule(rootDir) {
  if (rmtKernelPolicyParityModule || rmtKernelPolicyParityModuleError) return rmtKernelPolicyParityModule;
  const packageRoot = path.dirname(path.dirname(__filename));
  const candidates = [
    path.resolve(rootDir || process.cwd(), KERNEL_POLICY_PARITY_MODULE),
    path.resolve(packageRoot, KERNEL_POLICY_PARITY_MODULE)
  ];
  const modulePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!modulePath) {
    rmtKernelPolicyParityModuleError = new Error('RMT kernel policy parity module was not found.');
    return null;
  }
  try {
    rmtKernelPolicyParityModule = require(modulePath);
    return rmtKernelPolicyParityModule;
  } catch (error) {
    rmtKernelPolicyParityModuleError = error;
    rmtKernelPolicyParityModule = null;
    return null;
  }
}

function createFallbackKernelFeatureAdoptionReport() {
  return {
    schema: 'xtend.rmt-kernel-feature-adoption-report.v1',
    contract: 'xtend.rmt-kernel-feature-adoption.v1',
    status: 'unavailable',
    ok: false,
    capabilityKeys: [],
    capabilityCount: 0,
    supportedCount: 0,
    activeCount: 0,
    degradedCount: 0,
    blockedCount: 0,
    capabilities: [],
    diagnostics: [{
      schema: 'xtend.rmt-kernel-feature-adoption-diagnostic.v1',
      code: 'xtend.rmt.kernel_feature_adoption.registry_missing',
      severity: 'warning',
      message: 'RMT kernel feature adoption registry is not available.'
    }]
  };
}

function createMaracaKernelFeatureAdoptionReport(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const registryModule = loadRmtKernelFeatureAdoptionRegistry(rootDir);
  if (!registryModule || typeof registryModule.createRmtKernelFeatureAdoptionRegistry !== 'function') {
    return createFallbackKernelFeatureAdoptionReport();
  }
  const enabled = Boolean(options.enabled);
  const activeInput = options.activeCapabilities || {};
  const activeCapabilities = {
    ...activeInput,
    performanceAdvancedReports: Object.prototype.hasOwnProperty.call(activeInput, 'performanceAdvancedReports')
      ? Boolean(activeInput.performanceAdvancedReports)
      : enabled,
    prewarmWorker: Object.prototype.hasOwnProperty.call(activeInput, 'prewarmWorker')
      ? Boolean(activeInput.prewarmWorker)
      : false,
    uiCoprocessor: Object.prototype.hasOwnProperty.call(activeInput, 'uiCoprocessor')
      ? Boolean(activeInput.uiCoprocessor)
      : false,
    warmReentry: Object.prototype.hasOwnProperty.call(activeInput, 'warmReentry')
      ? Boolean(activeInput.warmReentry)
      : false,
    panicRecovery: Object.prototype.hasOwnProperty.call(activeInput, 'panicRecovery')
      ? Boolean(activeInput.panicRecovery)
      : enabled,
    policyParity: Object.prototype.hasOwnProperty.call(activeInput, 'policyParity')
      ? Boolean(activeInput.policyParity)
      : enabled
  };
  const registry = registryModule.createRmtKernelFeatureAdoptionRegistry({
    manifest: options.manifest || loadRmtManifest(rootDir),
    kernelApi: options.kernelApi || null,
    runtimeModules: options.runtimeModules || [],
    planFeatureAdoption: options.planFeatureAdoption || null,
    activeCapabilities
  });
  return registry.snapshot();
}

function createFallbackOptionalCompat() {
  return {
    browserHostAdapter: null
  };
}

function createMaracaKernelProductSurfaceReport(options = {}) {
  const bootMode = VALID_KERNEL_BOOT_MODES.has(options.bootMode) ? options.bootMode : 'direct';
  const diagnostics = [];
  const manifest = options.manifest || loadRmtManifest(options.rootDir);
  const productSurface = options.productSurface || null;
  let entryPoints = [];
  let optionalCompat = createFallbackOptionalCompat();
  let runtimeFactories = {};
  let supported = false;

  if (productSurface && typeof productSurface === 'object') {
    supported = true;
    if (typeof productSurface.listEntryPoints === 'function') {
      entryPoints = productSurface.listEntryPoints();
    }
    if (typeof productSurface.listOptionalCompat === 'function') {
      optionalCompat = productSurface.listOptionalCompat();
    }
    runtimeFactories = {
      createRuntime: typeof productSurface.createRuntime === 'function',
      createCore: typeof productSurface.createCore === 'function',
      createPerformanceRuntime: typeof productSurface.createPerformanceRuntime === 'function',
      createTemplateArtifacts: typeof productSurface.createTemplateArtifacts === 'function',
      createWorkerRuntime: typeof productSurface.createWorkerRuntime === 'function',
      createServerRuntime: typeof productSurface.createServerRuntime === 'function',
      createDetachedDomRuntime: typeof productSurface.createDetachedDomRuntime === 'function'
    };
  } else {
    const factories = manifest && manifest.entryPoints && manifest.entryPoints.appModulesFactories || {};
    const classicSurface = manifest && manifest.entryPoints && manifest.entryPoints.classicSurface || {};
    entryPoints = Object.values(factories)
      .filter(Boolean)
      .map((name) => ({ kind: 'appmodules_factory', name: String(name) }));
    if (classicSurface.globalName) {
      entryPoints.push({ kind: 'classic_global', name: String(classicSurface.globalName) });
    }
    supported = Boolean(factories.productSurface || classicSurface.createSurfaceFactory || factories.core);
    runtimeFactories = {
      createRuntime: Boolean(factories.browserRuntime),
      createCore: Boolean(factories.core),
      createPerformanceRuntime: Boolean(factories.performanceRuntime),
      createTemplateArtifacts: Boolean(factories.templateArtifacts),
      createWorkerRuntime: Boolean(factories.workerPrerenderRuntime),
      createServerRuntime: Boolean(factories.serverPrerenderRuntime),
      createDetachedDomRuntime: Boolean(factories.detachedDomRuntime)
    };
  }

  if (bootMode === 'productSurface' && !supported) {
    diagnostics.push({
      code: 'xtend.maraca.kernel_product_surface_missing',
      severity: 'error',
      message: 'Product Surface boot was requested, but createRmtProductSurface is not available.'
    });
  }

  const entryPointNames = entryPoints.map((entry) => entry && entry.name).filter(Boolean);
  return {
    schema: 'xtend.maraca.kernel-product-surface-bootstrap.v1',
    bootMode,
    supported,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : (bootMode === 'productSurface' ? 'selected' : 'available'),
    entryPoints,
    entryPointCount: entryPoints.length,
    entryPointNames,
    optionalCompat,
    runtimeFactories,
    diagnostics
  };
}

function normalizeMaracaUiCoprocessorOptions(options = {}) {
  const source = options.uiCoprocessor && typeof options.uiCoprocessor === 'object' ? options.uiCoprocessor : {};
  const mode = source.mode || options.uiCoprocessorMode || 'opportunistic';
  const lifecycle = source.lifecycle || options.uiCoprocessorLifecycle || 'runtime';
  return {
    enabled: options.enableUiCoprocessor === true || source.enabled === true,
    mode: mode === 'alwaysOn' ? 'alwaysOn' : 'opportunistic',
    maxQueueDepth: Math.max(Math.trunc(Number(source.maxQueueDepth || options.uiCoprocessorMaxQueueDepth) || 8), 1),
    stalePolicy: 'discard',
    lifecycle: lifecycle === 'app' ? 'app' : 'runtime'
  };
}

function normalizeMaracaWebAppManifestOptions(options = {}) {
  const source = options.webAppManifest && typeof options.webAppManifest === 'object' ? options.webAppManifest : {};
  const pwaSource = options.pwa && typeof options.pwa === 'object' ? options.pwa : {};
  const pwaManifest = pwaSource.manifest && typeof pwaSource.manifest === 'object' ? pwaSource.manifest : {};
  const rootManifest = options.manifest && typeof options.manifest === 'object' ? options.manifest : {};
  const manifestSource = source.manifest && typeof source.manifest === 'object'
    ? source.manifest
    : (Object.keys(source).length > 0 ? source : rootManifest);
  const enabled = options.enableWebAppManifest === true
    || options.webAppManifest === true
    || source.enabled === true
    || Object.keys(rootManifest).length > 0
    || options.pwa === true
    || pwaSource.enabled === true
    || (pwaSource.serviceWorker && pwaSource.serviceWorker.enabled === true);
  const merged = {
    ...pwaManifest,
    ...manifestSource
  };
  return {
    enabled,
    fileName: source.fileName || merged.fileName || pwaSource.manifestFileName || 'xtend.webmanifest',
    reportFileName: source.reportFileName || 'xtend.webmanifest.report.json',
    iconDirectory: source.iconDirectory || 'icons',
    name: merged.name || pwaSource.name || 'XTend Maraca App',
    shortName: merged.short_name || merged.shortName || pwaSource.shortName || 'XTend',
    startUrl: merged.start_url || merged.startUrl || pwaSource.startUrl || './',
    scope: merged.scope || pwaSource.scope || './',
    display: merged.display || 'standalone',
    backgroundColor: merged.background_color || merged.backgroundColor || '#ffffff',
    themeColor: merged.theme_color || merged.themeColor || '#1f6f78',
    description: merged.description || 'Generated XTend Maraca PWA manifest.',
    icons: Array.isArray(merged.icons) ? merged.icons : []
  };
}

function createDefaultWebAppManifestAssets(iconDirectory = 'icons') {
  const iconDir = String(iconDirectory || 'icons').replace(/^\/+|\/+$/g, '') || 'icons';
  return [
    {
      role: 'manifest-icon',
      source: 'icons/android-chrome-192x192.png',
      output: `${iconDir}/android-chrome-192x192.png`,
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
      manifestIcon: true
    },
    {
      role: 'manifest-icon',
      source: 'icons/android-chrome-512x512.png',
      output: `${iconDir}/android-chrome-512x512.png`,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
      manifestIcon: true
    },
    {
      role: 'apple-touch-icon',
      source: 'icons/apple-touch-icon.png',
      output: `${iconDir}/apple-touch-icon.png`,
      sizes: '180x180',
      type: 'image/png',
      htmlLink: { rel: 'apple-touch-icon', sizes: '180x180' }
    },
    {
      role: 'favicon',
      source: 'icons/favicon-32x32.png',
      output: `${iconDir}/favicon-32x32.png`,
      sizes: '32x32',
      type: 'image/png',
      htmlLink: { rel: 'icon', sizes: '32x32', type: 'image/png' }
    },
    {
      role: 'favicon',
      source: 'icons/favicon-16x16.png',
      output: `${iconDir}/favicon-16x16.png`,
      sizes: '16x16',
      type: 'image/png',
      htmlLink: { rel: 'icon', sizes: '16x16', type: 'image/png' }
    },
    {
      role: 'favicon',
      source: 'icons/favicon.ico',
      output: `${iconDir}/favicon.ico`,
      sizes: '16x16 32x32',
      type: 'image/x-icon',
      htmlLink: { rel: 'icon', type: 'image/x-icon' }
    },
    {
      role: 'branding-source',
      source: 'logo.svg',
      output: `${iconDir}/logo.svg`,
      type: 'image/svg+xml'
    },
    {
      role: 'branding-source',
      source: 'XTend-Logo.png',
      output: `${iconDir}/XTend-Logo.png`,
      sizes: '1024x1024',
      type: 'image/png'
    }
  ];
}

function createMaracaWebAppManifestPlan(options = {}) {
  const config = normalizeMaracaWebAppManifestOptions(options);
  const outputDir = options.outputDir || process.cwd();
  const rootDir = options.rootDir || process.cwd();
  const assets = createDefaultWebAppManifestAssets(config.iconDirectory).map((asset) => {
    const sourcePath = path.join(rootDir, asset.source);
    const outputPath = path.join(outputDir, asset.output);
    return {
      ...asset,
      sourcePath,
      outputPath,
      sourceExists: fs.existsSync(sourcePath),
      fileName: asset.output,
      replacementPath: asset.output
    };
  });
  const manifestIcons = assets
    .filter((asset) => asset.manifestIcon === true)
    .map((asset) => ({
      src: asset.output,
      sizes: asset.sizes,
      type: asset.type,
      purpose: asset.purpose || 'any'
    }));
  const htmlLinkHints = assets
    .filter((asset) => asset.htmlLink)
    .map((asset) => ({
      ...asset.htmlLink,
      href: asset.output
    }));
  const diagnostics = assets
    .filter((asset) => !asset.sourceExists)
    .map((asset) => ({
      code: 'xtend.maraca.web_app_manifest.asset_missing',
      severity: 'warning',
      message: `Web App Manifest default asset is missing: ${asset.source}`,
      source: asset.source
    }));
  const manifestRef = `./${config.fileName}`;
  const outputs = {
    manifest: path.join(outputDir, config.fileName),
    iconDirectory: path.join(outputDir, config.iconDirectory),
    report: path.join(outputDir, config.reportFileName)
  };
  return {
    schema: MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA,
    enabled: config.enabled,
    supported: true,
    optional: true,
    status: config.enabled ? 'planned' : 'disabled',
    runtimeExpectedStatus: config.enabled ? 'available' : 'disabled',
    manifestRef,
    iconDirectory: config.iconDirectory,
    brandingMode: 'default-xtend-assets',
    manifest: {
      fileName: config.fileName,
      ref: manifestRef,
      name: config.name,
      short_name: config.shortName,
      start_url: config.startUrl,
      scope: config.scope,
      display: config.display,
      background_color: config.backgroundColor,
      theme_color: config.themeColor,
      description: config.description,
      icons: config.icons.length > 0 ? config.icons : manifestIcons
    },
    assets,
    manifestIcons,
    htmlLinkHints,
    replacementPaths: assets.map((asset) => asset.replacementPath),
    files: {
      manifest: repoRelative(outputs.manifest, rootDir),
      iconDirectory: repoRelative(outputs.iconDirectory, rootDir),
      report: repoRelative(outputs.report, rootDir)
    },
    outputs,
    diagnostics,
    summary: {
      enabled: config.enabled,
      assetCount: assets.length,
      manifestIconCount: manifestIcons.length,
      htmlLinkHintCount: htmlLinkHints.length,
      brandingMode: 'default-xtend-assets'
    }
  };
}

function normalizeMaracaPwaOptions(options = {}) {
  const source = options.pwa && typeof options.pwa === 'object' ? options.pwa : {};
  const serviceWorker = source.serviceWorker && typeof source.serviceWorker === 'object' ? source.serviceWorker : {};
  const manifest = source.manifest && typeof source.manifest === 'object' ? source.manifest : {};
  const enabled = options.enableServiceWorker === true
    || options.enablePwa === true
    || options.pwa === true
    || source.enabled === true
    || serviceWorker.enabled === true;
  const strategy = source.strategy || serviceWorker.strategy || options.pwaStrategy || 'app-shell';
  const updateMode = source.updateMode || serviceWorker.updateMode || options.pwaUpdateMode || 'prompt';
  const businessLogicImport = serviceWorker.businessLogicImport || source.businessLogicImport || '';
  const scope = manifest.scope || source.scope || './';
  const startUrl = manifest.start_url || manifest.startUrl || source.startUrl || './';
  const manifestFileName = source.manifestFileName || manifest.fileName || 'xtend.webmanifest';
  const serviceWorkerFileName = serviceWorker.fileName || source.serviceWorkerFileName || 'xtend.service-worker.js';
  const offlineFallbackFileName = source.offlineFallbackFileName || serviceWorker.offlineFallbackFileName || 'xtend.offline.html';
  const offlineFallback = source.offlineFallback === false || serviceWorker.offlineFallback === false ? false : true;
  return {
    enabled,
    strategy: strategy === 'app-shell' ? 'app-shell' : 'app-shell',
    cacheMode: source.cacheMode || serviceWorker.cacheMode || 'generated-app-shell',
    updateMode: updateMode === 'auto' || updateMode === 'manual' ? updateMode : 'prompt',
    businessLogicHook: 'import-script',
    businessLogicImport: businessLogicImport ? String(businessLogicImport) : '',
    manifest: {
      name: manifest.name || source.name || 'XTend Maraca App',
      shortName: manifest.short_name || manifest.shortName || source.shortName || 'XTend',
      startUrl,
      scope,
      display: manifest.display || 'standalone',
      backgroundColor: manifest.background_color || manifest.backgroundColor || '#ffffff',
      themeColor: manifest.theme_color || manifest.themeColor || '#1f6f78',
      description: manifest.description || 'Generated XTend Maraca PWA manifest.',
      icons: Array.isArray(manifest.icons) ? manifest.icons : []
    },
    serviceWorker: {
      enabled,
      fileName: serviceWorkerFileName,
      registrationUrl: serviceWorker.registrationUrl || `./${serviceWorkerFileName}`,
      scope,
      type: serviceWorker.type || 'classic'
    },
    files: {
      manifest: manifestFileName,
      serviceWorker: serviceWorkerFileName,
      offlineFallback: offlineFallback ? offlineFallbackFileName : null,
      report: 'xtend.pwa.report.json'
    },
    offlineEligible: Boolean(enabled && offlineFallback),
    diagnostics: []
  };
}

function createMaracaPrewarmWorkerRuntimeReport(kernelPlan = null, options = {}) {
  const coprocessor = normalizeMaracaUiCoprocessorOptions(options);
  const enabled = options.enablePrewarmWorker === true || coprocessor.enabled;
  const enabledBy = options.enablePrewarmWorker === true ? 'prewarmWorker' : (coprocessor.enabled ? 'uiCoprocessor' : 'none');
  const kernelEnabled = Boolean(kernelPlan && kernelPlan.enabled);
  const runtimeModules = Array.isArray(kernelPlan && kernelPlan.runtimeModules)
    ? kernelPlan.runtimeModules
    : KERNEL_RUNTIME_MODULES.slice();
  const hasKernelRuntime = runtimeModules.includes('xtendrmt/rmt-runtime.esm.js')
    || runtimeModules.includes('xtendrmt/rmt-core.esm.js');
  const supported = hasKernelRuntime;
  const diagnostics = [];

  if (enabled && !kernelEnabled) {
    diagnostics.push(kernelDiagnostic(
      'xtend.maraca.prewarm_worker.kernel_disabled',
      options.kernel === 'strict' ? 'error' : 'warning',
      'Prewarm Worker requires enabled RMT kernel orchestration.',
      { requiredBy: 'enablePrewarmWorker' }
    ));
  }
  if (enabled && !hasKernelRuntime) {
    diagnostics.push(kernelDiagnostic(
      'xtend.maraca.prewarm_worker.runtime_missing',
      options.kernel === 'strict' ? 'error' : 'warning',
      'Prewarm Worker requires the RMT runtime module in the bundle graph.',
      { requiredModule: 'xtendrmt/rmt-runtime.esm.js' }
    ));
  }

  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  return {
    schema: MARACA_PREWARM_WORKER_RUNTIME_SCHEMA,
    enabled,
    enabledBy,
    supported,
    optional: true,
    status: !enabled ? 'disabled' : (hasErrors ? 'blocked' : (kernelEnabled && hasKernelRuntime ? 'planned' : 'degraded')),
    runtimeExpectedStatus: enabled && kernelEnabled && hasKernelRuntime ? 'booted' : 'disabled',
    workerName: options.prewarmWorkerName || 'XTendRMTPrewarmWorker',
    workerType: options.prewarmWorkerType || 'classic',
    topologySchema: 'xtend.rmt.prewarm-worker-topology.v1',
    requiredHostApis: ['Worker', 'Blob', 'URL.createObjectURL'],
    topologyFields: ['health', 'pendingJobs', 'submittedJobs', 'templatesSynced', 'missingApis', 'lastError', 'coprocessor'],
    responsibilities: ['template_prerender_compute', 'chunk_serialization', 'ui_compute', 'layout_precompute', 'analytics_precompute'],
    supportedSignals: ['start', 'continue', 'rebatch', 'compute', 'ui_compute', 'prerender', 'invalidate'],
    ownership: {
      dom: false,
      events: false,
      state: false
    },
    fallbackPolicy: {
      missingApis: 'degrade-to-main-thread-prewarm',
      bootFailure: 'report-diagnostic-and-disable-worker',
      visibleWorkPriority: 'preserve-visible-and-user-blocking-work'
    },
    coprocessor: {
      ...coprocessor,
      queueDepthMax: 0,
      status: coprocessor.enabled ? (enabled ? 'planned' : 'disabled') : 'disabled',
      pendingJobs: 0,
      submittedJobs: 0,
      transferBytes: 0,
      staleResponses: 0,
      supersededResponses: 0,
      stateOwnership: 'main-thread',
      trustedDomCommit: 'main-thread',
      clientDetermined: true,
      ssrRoundtripCount: 0
    },
    diagnostics,
    summary: {
      enabled,
      enabledBy,
      supported,
      kernelEnabled,
      hasKernelRuntime,
      requiresHostApis: enabled,
      uiCoprocessorEnabled: coprocessor.enabled
    }
  };
}

function createMaracaUiCoprocessorPlan(compileResult, kernelPlan, hydrationPlan, warmReentryReport, options = {}) {
  const config = normalizeMaracaUiCoprocessorOptions(options);
  const pwaPlan = options.pwaPlan && typeof options.pwaPlan === 'object' ? options.pwaPlan : null;
  const hydrationArtifact = hydrationPlan && hydrationPlan.artifact || compileResult && compileResult.orchestrationArtifacts && compileResult.orchestrationArtifacts.hydration || null;
  const records = Array.isArray(hydrationArtifact && hydrationArtifact.records) ? hydrationArtifact.records : [];
  const eligibleRecords = records.filter((record) => record && record.uiCoprocessorEligible === true);
  const activeRecords = config.enabled ? eligibleRecords : [];
  const diagnostics = [];
  const kernelEnabled = Boolean(kernelPlan && kernelPlan.enabled);

  if (config.enabled && !kernelEnabled) {
    diagnostics.push(kernelDiagnostic(
      'xtend.maraca.ui_coprocessor.kernel_disabled',
      options.kernel === 'strict' ? 'error' : 'warning',
      'UI Coprocessor requires enabled RMT kernel orchestration.',
      { requiredBy: 'enableUiCoprocessor' }
    ));
  }

  if (config.enabled && eligibleRecords.length === 0) {
    diagnostics.push(kernelDiagnostic(
      'xtend.maraca.ui_coprocessor.no_eligible_records',
      'warning',
      'UI Coprocessor is enabled, but no client-determined prewarm or worker hydration records are eligible.',
      { eligibleRecordCount: 0 }
    ));
  }

  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  return {
    schema: MARACA_UI_COPROCESSOR_PLAN_SCHEMA,
    enabled: config.enabled,
    supported: true,
    optional: true,
    status: !config.enabled ? 'disabled' : (hasErrors ? 'blocked' : (kernelEnabled ? 'planned' : 'degraded')),
    runtimeExpectedStatus: config.enabled && kernelEnabled && !hasErrors ? 'booted' : 'disabled',
    mode: config.mode,
    lifecycle: config.lifecycle,
    maxQueueDepth: config.maxQueueDepth,
    stalePolicy: config.stalePolicy,
    evidenceMode: 'non-blocking',
    eligibility: {
      recordCount: records.length,
      eligibleRecordCount: eligibleRecords.length,
      activeRecordCount: activeRecords.length,
      activeRecordIds: activeRecords.map((record) => record.id).filter(Boolean)
    },
    ownership: {
      dom: false,
      events: false,
      state: false,
      stateOwnership: 'main-thread',
      trustedDomCommit: 'main-thread',
      hostServices: 'blocked-in-worker-path',
      ssrRoundtripCount: 0
    },
    lanes: {
      workerHydrate: 'component.worker_prerender_hydrate',
      prewarm: 'component.prewarm.prepare',
      warmReentry: 'component.warm.reentry',
      diagnostics: 'diagnostics.snapshot'
    },
    pwaAttachment: {
      engineImplemented: Boolean(pwaPlan && pwaPlan.enabled),
      manifestRef: pwaPlan && pwaPlan.manifestRef || options.manifestRef || null,
      cacheMode: pwaPlan && pwaPlan.cacheMode || options.cacheMode || 'attachment-point-only',
      serviceWorkerControlled: options.serviceWorkerControlled === true,
      offlineEligible: pwaPlan && pwaPlan.offlineEligible === true || options.offlineEligible === true,
      cacheVersion: pwaPlan && pwaPlan.cacheVersion || '',
      hooks: ['cache-management', 'xstate-state-management', 'ssr-metadata', 'prewarm-warm-reentry-policy']
    },
    state: {
      stateSnapshotHash: options.stateSnapshotHash || '',
      xstateBridgeMode: options.xstateBridgeMode || 'main-thread-snapshot',
      stateOwnership: 'main-thread'
    },
    ssr: {
      ssrRoundtripCount: 0,
      serverPrerenderUsed: false,
      clientDetermined: true
    },
    warmReentry: {
      enabled: Boolean(warmReentryReport && warmReentryReport.enabled),
      runtimeExpectedStatus: warmReentryReport && warmReentryReport.runtimeExpectedStatus || 'idle'
    },
    diagnostics,
    summary: {
      enabled: config.enabled,
      status: !config.enabled ? 'disabled' : (hasErrors ? 'blocked' : (kernelEnabled ? 'planned' : 'degraded')),
      eligibleRecordCount: eligibleRecords.length,
      activeRecordCount: activeRecords.length,
      releaseBlocking: false
    }
  };
}

function createMaracaPwaServiceWorkerPlan(options = {}) {
  const config = normalizeMaracaPwaOptions(options);
  const webAppManifest = options.webAppManifestPlan && typeof options.webAppManifestPlan === 'object'
    ? options.webAppManifestPlan
    : createMaracaWebAppManifestPlan(options);
  const outputDir = options.outputDir || process.cwd();
  const rootDir = options.rootDir || process.cwd();
  const outputs = {
    manifest: webAppManifest.outputs && webAppManifest.outputs.manifest || path.join(outputDir, config.files.manifest),
    serviceWorker: path.join(outputDir, config.files.serviceWorker),
    offlineFallback: config.files.offlineFallback ? path.join(outputDir, config.files.offlineFallback) : null,
    report: path.join(outputDir, config.files.report)
  };
  const manifestRef = webAppManifest.manifestRef || `./${config.files.manifest}`;
  const serviceWorkerRef = `./${config.files.serviceWorker}`;
  const cacheVersion = `xtend-maraca-pwa-${hashText(stableStringify({
    source: options.source || '',
    strategy: config.strategy,
    cacheMode: config.cacheMode,
    manifest: webAppManifest.manifest || config.manifest,
    serviceWorker: config.serviceWorker.fileName
  })).slice(0, 12)}`;
  const diagnostics = [];
  if (config.enabled && config.businessLogicImport && !String(config.businessLogicImport).startsWith('/')) {
    diagnostics.push({
      code: 'xtend.maraca.pwa.business_logic_import_relative',
      severity: 'info',
      message: 'PWA Service Worker business logic import is relative to the generated Service Worker file.',
      importPath: config.businessLogicImport
    });
  }
  return {
    schema: MARACA_PWA_SERVICE_WORKER_PLAN_SCHEMA,
    enabled: config.enabled,
    supported: true,
    optional: true,
    status: config.enabled ? 'planned' : 'disabled',
    runtimeExpectedStatus: config.enabled ? 'registered' : 'disabled',
    strategy: config.strategy,
    cacheMode: config.cacheMode,
    updateMode: config.updateMode,
    businessLogicHook: config.businessLogicHook,
    businessLogicImport: config.businessLogicImport,
    cacheVersion,
    manifestRef,
    serviceWorkerRef,
    offlineEligible: config.offlineEligible,
    manifest: {
      fileName: webAppManifest.manifest && webAppManifest.manifest.fileName || config.files.manifest,
      ref: manifestRef,
      name: webAppManifest.manifest && webAppManifest.manifest.name || config.manifest.name,
      short_name: webAppManifest.manifest && webAppManifest.manifest.short_name || config.manifest.shortName,
      start_url: webAppManifest.manifest && webAppManifest.manifest.start_url || config.manifest.startUrl,
      scope: webAppManifest.manifest && webAppManifest.manifest.scope || config.manifest.scope,
      display: webAppManifest.manifest && webAppManifest.manifest.display || config.manifest.display,
      background_color: webAppManifest.manifest && webAppManifest.manifest.background_color || config.manifest.backgroundColor,
      theme_color: webAppManifest.manifest && webAppManifest.manifest.theme_color || config.manifest.themeColor,
      description: webAppManifest.manifest && webAppManifest.manifest.description || config.manifest.description,
      icons: webAppManifest.manifest && Array.isArray(webAppManifest.manifest.icons) ? webAppManifest.manifest.icons : config.manifest.icons
    },
    webAppManifest,
    serviceWorker: {
      enabled: config.serviceWorker.enabled,
      fileName: config.files.serviceWorker,
      ref: serviceWorkerRef,
      registrationUrl: config.serviceWorker.registrationUrl,
      scope: config.serviceWorker.scope,
      type: config.serviceWorker.type,
      businessLogicHook: config.businessLogicHook,
      businessLogicImport: config.businessLogicImport
    },
    files: {
      manifest: repoRelative(outputs.manifest, rootDir),
      serviceWorker: repoRelative(outputs.serviceWorker, rootDir),
      offlineFallback: outputs.offlineFallback ? repoRelative(outputs.offlineFallback, rootDir) : null,
      report: repoRelative(outputs.report, rootDir)
    },
    outputs,
    precache: {
      mode: 'bundle-graph-derived',
      urls: [],
      includeRuntimeAssets: true,
      includeChunks: true,
      includeCss: true,
      includeManifest: true,
      includeIcons: true,
      includeOfflineFallback: config.offlineEligible
    },
    runtimeCaching: {
      allowed: [
        { kind: 'static-assets', strategy: 'cache-first', sameOriginOnly: true, methods: ['GET'] },
        { kind: 'navigation', strategy: 'network-first', fallback: config.files.offlineFallback || null, methods: ['GET'] },
        { kind: 'images-fonts', strategy: 'stale-while-revalidate', sameOriginOnly: true, explicitOptIn: true, methods: ['GET'] }
      ],
      blockedByDefault: [
        'non-get-requests',
        'auth-or-cookie-sensitive-requests',
        'ssr-personalized-html-fragments',
        'api-responses-without-explicit-app-policy',
        'background-sync',
        'push-notifications',
        'offline-mutations'
      ]
    },
    boundaries: {
      replacesSsr: false,
      replacesUiCoprocessor: false,
      uiCompute: false,
      networkAndCacheOnly: true
    },
    diagnostics,
    summary: {
      enabled: config.enabled,
      serviceWorkerEnabled: config.serviceWorker.enabled,
      offlineEligible: config.offlineEligible,
      businessLogicHook: config.businessLogicHook,
      releaseBlocking: false
    }
  };
}

function cloneJson(value, fallbackValue = null) {
  if (value === undefined) return fallbackValue;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallbackValue;
  }
}

function templateDocumentId(coreDocument) {
  return coreDocument && coreDocument.manifest && coreDocument.manifest.documentId
    ? String(coreDocument.manifest.documentId)
    : 'xtend.maraca.document';
}

function templateNamespace(coreDocument) {
  return coreDocument && coreDocument.manifest && coreDocument.manifest.namespace
    ? String(coreDocument.manifest.namespace)
    : templateDocumentId(coreDocument).split('.')[0] || 'xtend';
}

function createMaracaTemplateSourceDocument(coreDocument, sourceText, options = {}) {
  const documentId = templateDocumentId(coreDocument);
  const namespace = templateNamespace(coreDocument);
  const templates = Array.isArray(coreDocument && coreDocument.templates)
    ? coreDocument.templates
    : [];
  return {
    kind: 'rmt_document',
    version: '1.0',
    manifest: {
      documentId,
      namespace,
      sourceUrl: options.sourcePath ? repoRelative(options.sourcePath, options.rootDir || process.cwd()) : '',
      contentType: 'text/x-rmt',
      metadata: {
        maraca: true,
        sourceHash: hashText(sourceText || ''),
        sourceFingerprint: `sha256:${hashText(sourceText || '')}`,
        compilerSchema: options.compileResult && options.compileResult.schema || null
      },
      reactivityHints: {}
    },
    templates: templates.map((template, index) => {
      const templateId = String(template && template.id || template && template.name || `template:${index}`);
      const templateName = String(template && template.name || templateId.replace(/^template:/, ''));
      return {
        id: templateId,
        qualifiedId: templateId,
        namespace,
        documentId,
        mode: String(template && template.mode || 'orchestration'),
        markup: '',
        bindings: [],
        slots: [],
        metadata: {
          name: templateName,
          surfaceRefs: Array.isArray(template && template.surfaceRefs) ? template.surfaceRefs.slice() : [],
          sourceRef: template && template.sourceRef || null
        },
        reactivityHints: {},
        sourceUrl: options.sourcePath ? repoRelative(options.sourcePath, options.rootDir || process.cwd()) : '',
        loaderHint: 'xtend-maraca'
      };
    })
  };
}

function createMaracaPreparedTemplate(templateRecord) {
  const sourceFingerprint = hashArtifactValue({
    id: templateRecord.id,
    qualifiedId: templateRecord.qualifiedId || templateRecord.id,
    namespace: templateRecord.namespace,
    documentId: templateRecord.documentId,
    mode: templateRecord.mode,
    markup: templateRecord.markup || '',
    bindings: templateRecord.bindings || [],
    slots: templateRecord.slots || [],
    metadata: templateRecord.metadata || {},
    reactivityHints: templateRecord.reactivityHints || {}
  });
  const structureSignature = hashArtifactValue({
    templateMode: templateRecord.mode || 'orchestration',
    bindings: templateRecord.bindings || [],
    slots: templateRecord.slots || []
  });
  return {
    kind: 'rmt_prepared_template',
    version: TEMPLATE_ARTIFACT_VERSION,
    preparedAt: 0,
    id: templateRecord.id,
    qualifiedId: templateRecord.qualifiedId || templateRecord.id,
    namespace: templateRecord.namespace,
    documentId: templateRecord.documentId,
    sourceUrl: templateRecord.sourceUrl || '',
    loaderHint: templateRecord.loaderHint || 'xtend-maraca',
    mode: templateRecord.mode || 'orchestration',
    markup: templateRecord.markup || '',
    props: [],
    bindings: cloneJson(templateRecord.bindings, []),
    slots: cloneJson(templateRecord.slots, []),
    hydration: {},
    errorBoundary: {},
    metadata: cloneJson(templateRecord.metadata, {}),
    reactivityHints: cloneJson(templateRecord.reactivityHints, {}),
    dependencyRefs: [],
    structureSignature,
    fingerprint: hashArtifactValue({
      sourceFingerprint,
      structureSignature,
      dependencies: []
    }),
    sourceFingerprint
  };
}

function createMaracaTemplateDocumentArtifact(sourceDocument, runtimeProfileHints) {
  const manifest = sourceDocument.manifest || {};
  const preparedTemplates = (Array.isArray(sourceDocument.templates) ? sourceDocument.templates : [])
    .map(createMaracaPreparedTemplate);
  const documentSourceFingerprint = hashArtifactValue({
    manifest,
    templates: preparedTemplates.map((entry) => ({
      qualifiedId: entry.qualifiedId,
      fingerprint: entry.fingerprint
    }))
  });
  const fingerprint = hashArtifactValue({
    documentSourceFingerprint,
    templates: preparedTemplates.map((entry) => entry.fingerprint)
  });
  const documentId = String(manifest.documentId || 'xtend.maraca.document');
  return {
    kind: TEMPLATE_ARTIFACT_DOCUMENT_KIND,
    version: TEMPLATE_ARTIFACT_VERSION,
    artifactId: `artifact:${documentId}:${fingerprint.replace(/[^a-zA-Z0-9:_-]/g, '').slice(-12) || 'document'}`,
    documentId,
    namespace: String(manifest.namespace || ''),
    sourceUrl: String(manifest.sourceUrl || ''),
    contentType: String(manifest.contentType || 'text/x-rmt'),
    templateCount: preparedTemplates.length,
    templateIds: preparedTemplates.map((entry) => entry.qualifiedId),
    metadata: cloneJson(manifest.metadata, {}),
    reactivityHints: cloneJson(manifest.reactivityHints, {}),
    fingerprint,
    sourceFingerprint: documentSourceFingerprint,
    templates: preparedTemplates,
    runtimeProfileHints: runtimeProfileHints.slice(),
    createdAt: 0
  };
}

function createMaracaTemplateArtifactBundle(documentArtifacts, options = {}) {
  const runtimeProfileHints = Array.isArray(options.runtimeProfileHints)
    ? options.runtimeProfileHints.slice()
    : DEFAULT_TEMPLATE_RUNTIME_PROFILE_HINTS.slice();
  const documentIds = documentArtifacts.map((documentArtifact) => documentArtifact.documentId).filter(Boolean);
  const templateIds = documentArtifacts.flatMap((documentArtifact) => documentArtifact.templateIds || []);
  const manifest = {
    artifactVersion: TEMPLATE_ARTIFACT_VERSION,
    bundleId: options.bundleId || `xtend.maraca.templates.${documentIds.join('.') || 'document'}`,
    createdAt: 0,
    releaseStage: options.releaseStage || 'build-plan',
    runtimeProfileHints,
    metadata: cloneJson(options.metadata, {}),
    documentCount: documentArtifacts.length,
    templateCount: templateIds.length,
    fingerprint: ''
  };
  manifest.fingerprint = hashArtifactValue({
    manifest: {
      ...manifest,
      fingerprint: ''
    },
    documents: documentArtifacts.map((documentArtifact) => ({
      artifactId: documentArtifact.artifactId,
      documentId: documentArtifact.documentId,
      fingerprint: documentArtifact.fingerprint
    }))
  });
  return {
    kind: TEMPLATE_ARTIFACT_BUNDLE_KIND,
    version: TEMPLATE_ARTIFACT_VERSION,
    manifest,
    documents: documentArtifacts.map((entry) => cloneJson(entry, null)),
    templateIds
  };
}

function createMaracaTemplateArtifactsReport(input = {}) {
  const manifest = input.manifest || loadRmtManifest(input.rootDir);
  const factories = manifest && manifest.entryPoints && manifest.entryPoints.appModulesFactories || {};
  const diagnostics = [];
  const runtimeProfileHints = DEFAULT_TEMPLATE_RUNTIME_PROFILE_HINTS.slice();
  const coreDocument = input.coreDocument || input.compileResult && input.compileResult.coreDocument || null;
  const sourceText = typeof input.sourceText === 'string' ? input.sourceText : '';
  const supported = Boolean(factories.templateArtifacts);

  if (!supported) {
    diagnostics.push({
      code: 'xtend.maraca.template_artifacts_factory_missing',
      severity: 'warning',
      message: 'RMT Template Artifacts factory is not available in the kernel manifest.'
    });
  }

  if (!coreDocument) {
    return {
      schema: MARACA_TEMPLATE_ARTIFACTS_REPORT_SCHEMA,
      ok: false,
      status: input.status || 'unavailable',
      supported,
      trusted: false,
      factory: {
        name: factories.templateArtifacts || 'createRmtTemplateArtifacts',
        supported,
        source: supported ? 'rmt-manifest' : 'missing'
      },
      documentIds: [],
      templateIds: [],
      sourceFingerprint: sourceText ? `sha256:${hashText(sourceText)}` : '',
      artifactBundleFingerprint: '',
      bundleFingerprint: null,
      runtimeProfileHints,
      artifactBundle: null,
      registration: {
        eligible: false,
        enabled: false,
        status: 'unavailable',
        reason: input.status || 'no_core_document'
      },
      sourceToSea: {
        compilerDocumentId: null,
        artifactDocumentIds: [],
        documentIdsMatchCompiler: false
      },
      diagnostics
    };
  }

  const sourceDocument = createMaracaTemplateSourceDocument(coreDocument, sourceText, input);
  const documentArtifact = createMaracaTemplateDocumentArtifact(sourceDocument, runtimeProfileHints);
  const artifactBundle = createMaracaTemplateArtifactBundle([documentArtifact], {
    runtimeProfileHints,
    bundleId: `xtend.maraca.templates.${documentArtifact.documentId}`,
    releaseStage: input.profile === 'debug' ? 'debug' : 'build-plan',
    metadata: {
      source: input.sourcePath ? repoRelative(input.sourcePath, input.rootDir || process.cwd()) : '',
      sourceHash: hashText(sourceText),
      compilerSchema: input.compileResult && input.compileResult.schema || null
    }
  });
  const documentIds = [documentArtifact.documentId];
  const compilerDocumentId = templateDocumentId(coreDocument);
  const trusted = supported && documentArtifact.templateCount > 0;
  return {
    schema: MARACA_TEMPLATE_ARTIFACTS_REPORT_SCHEMA,
    ok: supported,
    status: documentArtifact.templateCount > 0 ? (supported ? 'prepared' : 'degraded') : 'empty',
    supported,
    trusted,
    factory: {
      name: factories.templateArtifacts || 'createRmtTemplateArtifacts',
      supported,
      source: supported ? 'rmt-manifest' : 'missing'
    },
    documentIds,
    templateIds: documentArtifact.templateIds.slice(),
    documentCount: documentIds.length,
    templateCount: documentArtifact.templateCount,
    sourceFingerprint: `sha256:${hashText(sourceText)}`,
    artifactBundleFingerprint: artifactBundle.manifest.fingerprint,
    bundleFingerprint: null,
    runtimeProfileHints,
    documents: [documentArtifact],
    artifactBundle,
    registration: {
      eligible: trusted,
      enabled: trusted,
      status: trusted ? 'ready' : 'deferred',
      reason: trusted ? 'trusted_bundle' : 'no_trusted_template_artifacts'
    },
    sourceToSea: {
      compilerDocumentId,
      artifactDocumentIds: documentIds,
      documentIdsMatchCompiler: documentIds.includes(compilerDocumentId),
      compilerTemplateIds: (Array.isArray(coreDocument.templates) ? coreDocument.templates : [])
        .map((template) => String(template && template.id || ''))
        .filter(Boolean),
      artifactTemplateIds: documentArtifact.templateIds.slice()
    },
    diagnostics
  };
}

function finalizeMaracaTemplateArtifactsReport(planReport, bundleFiles = [], repoRoot = process.cwd()) {
  if (!planReport || typeof planReport !== 'object') return null;
  const bundleFileFingerprints = (Array.isArray(bundleFiles) ? bundleFiles : []).map((file) => ({
    fileName: file.fileName,
    path: repoRelative(file.path, repoRoot),
    bytes: Number(file.bytes || 0),
    isEntry: Boolean(file.isEntry)
  }));
  const bundleFingerprint = bundleFileFingerprints.length > 0
    ? `sha256:${hashText(stableStringify(bundleFileFingerprints))}`
    : null;
  return {
    ...planReport,
    bundleFingerprint,
    registration: {
      ...(planReport.registration || {}),
      enabled: Boolean(planReport.registration && planReport.registration.eligible && planReport.artifactBundle),
      status: planReport.registration && planReport.registration.eligible ? 'bundle_embedded' : (planReport.registration && planReport.registration.status || 'deferred')
    },
    sourceToSea: {
      ...(planReport.sourceToSea || {}),
      bundleFileCount: bundleFileFingerprints.length,
      bundleFingerprint
    }
  };
}

function createMaracaPerformanceHistoryEntry(runtime, budgetId, index, options = {}) {
  const durationMs = budgetId === 'command_turnaround' ? 64 : (budgetId === 'retained_warm_reuse' ? 4 : 8 + index);
  const waitMs = budgetId === 'hydration_followup' ? 2 : 1;
  const measurementPhase = budgetId === 'retained_warm_reuse'
    ? 'retained'
    : (budgetId === 'hydration_followup' ? 'warm' : 'cold');
  const evaluation = runtime.evaluateBudget(budgetId, {
    durationMs,
    waitMs,
    totalMs: durationMs + waitMs,
    longTaskMs: durationMs,
    status: 'ok'
  }, {
    budgetId,
    budgetClass: budgetId,
    endpointGroup: budgetId,
    rootId: options.documentId || 'xtend.maraca',
    renderPackageId: options.renderPackageId || 'xtend-maraca',
    metadata: {
      source: 'xtend-maraca',
      workpackage: 'RKFA-03'
    }
  });
  return {
    at: index + 1,
    endpointName: budgetId,
    endpointGroup: budgetId,
    budgetId: evaluation.budgetId || budgetId,
    budgetClass: budgetId,
    budgetStatus: evaluation.status || 'within_budget',
    budgetViolations: Array.isArray(evaluation.violations) ? evaluation.violations.slice() : [],
    budgetThresholds: cloneJson(evaluation.thresholds, {}),
    durationMs: evaluation.durationMs || durationMs,
    waitMs: evaluation.waitMs || waitMs,
    totalMs: evaluation.totalMs || durationMs + waitMs,
    measurementPhase,
    renderPackageId: options.renderPackageId || 'xtend-maraca',
    rootId: options.documentId || 'xtend.maraca',
    status: 'ok',
    scheduled: true,
    async: false,
    metadata: {
      source: 'xtend-maraca',
      workpackage: 'RKFA-03'
    }
  };
}

function summarizePerformanceFileArtifact(fileArtifact) {
  if (!fileArtifact || typeof fileArtifact !== 'object') return null;
  return {
    kind: fileArtifact.kind || 'rmt_performance_file_artifact',
    artifactId: fileArtifact.artifactId || '',
    artifactType: fileArtifact.artifactType || '',
    fileName: fileArtifact.fileName || '',
    contentType: fileArtifact.contentType || 'application/json',
    bytes: typeof fileArtifact.text === 'string' ? Buffer.byteLength(fileArtifact.text) : 0,
    payloadKind: fileArtifact.payload && fileArtifact.payload.kind || ''
  };
}

function createMaracaPerformanceReport(input = {}) {
  const diagnostics = [];
  const rootDir = input.rootDir || process.cwd();
  const manifest = input.manifest || loadRmtManifest(rootDir);
  const factories = manifest && manifest.entryPoints && manifest.entryPoints.appModulesFactories || {};
  const factory = loadRmtPerformanceRuntimeFactory(rootDir);
  const supported = typeof factory === 'function';
  const documentId = input.coreDocument && input.coreDocument.manifest && input.coreDocument.manifest.documentId
    ? String(input.coreDocument.manifest.documentId)
    : 'xtend.maraca';
  const factoryName = factories.performanceRuntime || 'createRmtPerformanceRuntime';

  if (!supported) {
    diagnostics.push({
      code: 'xtend.maraca.performance_runtime_unavailable',
      severity: 'warning',
      message: rmtPerformanceRuntimeFactoryError && rmtPerformanceRuntimeFactoryError.message
        ? rmtPerformanceRuntimeFactoryError.message
        : 'RMT Performance Runtime factory is not available.'
    });
    return {
      schema: MARACA_PERFORMANCE_REPORT_SCHEMA,
      ok: false,
      status: input.status || 'unavailable',
      supported: false,
      runtimeExpectedStatus: 'unavailable',
      factory: {
        name: factoryName,
        supported: false,
        source: 'missing'
      },
      budgetClasses: MARACA_PERFORMANCE_BUDGET_CLASSES.slice(),
      budgetSnapshot: null,
      budgetMissDiagnostics: [],
      backpressureProfile: null,
      runReport: null,
      ciSummary: null,
      fileArtifact: null,
      baselineComparison: null,
      diagnostics
    };
  }

  let runtime = null;
  try {
    runtime = factory({
      collectBrowserSignals: false,
      now: () => 0,
      runtimeKind: 'maraca-build-performance'
    });
  } catch (error) {
    diagnostics.push({
      code: 'xtend.maraca.performance_runtime_create_failed',
      severity: 'warning',
      message: error && error.message ? error.message : String(error)
    });
  }

  if (!runtime || typeof runtime.evaluateBudgets !== 'function') {
    return {
      schema: MARACA_PERFORMANCE_REPORT_SCHEMA,
      ok: false,
      status: 'degraded',
      supported: false,
      runtimeExpectedStatus: 'unavailable',
      factory: {
        name: factoryName,
        supported: false,
        source: 'rmt-runtime'
      },
      budgetClasses: MARACA_PERFORMANCE_BUDGET_CLASSES.slice(),
      budgetSnapshot: null,
      budgetMissDiagnostics: [],
      backpressureProfile: null,
      runReport: null,
      ciSummary: null,
      fileArtifact: null,
      baselineComparison: null,
      diagnostics
    };
  }

  const history = MARACA_PERFORMANCE_BUDGET_CLASSES.map((budgetId, index) => (
    createMaracaPerformanceHistoryEntry(runtime, budgetId, index, {
      documentId,
      renderPackageId: 'xtend-maraca'
    })
  ));
  const budgetSnapshot = runtime.evaluateBudgets('maraca-build-plan', { history });
  const runReport = typeof runtime.exportRunReport === 'function'
    ? runtime.exportRunReport('maraca-build-plan', {
        runId: `maraca:${documentId}`,
        label: 'XTend Maraca Build Plan',
        history,
        metadata: {
          source: input.sourcePath ? repoRelative(input.sourcePath, rootDir) : '',
          documentId,
          workpackage: 'RKFA-03'
        }
      })
    : null;
  const baseline = runReport && typeof runtime.createRunBaseline === 'function'
    ? runtime.createRunBaseline([runReport], {
        baselineId: `baseline:${documentId}`,
        label: 'XTend Maraca deterministic baseline'
      })
    : null;
  const baselineComparison = runReport && baseline && typeof runtime.compareRunReportToBaseline === 'function'
    ? runtime.compareRunReportToBaseline(runReport, baseline, {
        label: 'XTend Maraca deterministic baseline comparison'
      })
    : null;
  const ciSummary = runReport && typeof runtime.createCiSummary === 'function'
    ? runtime.createCiSummary(runReport, {
        summaryId: `summary:${documentId}`,
        title: 'XTend Maraca Performance Summary',
        metadata: {
          workpackage: 'RKFA-03'
        }
      })
    : null;
  const rawFileArtifact = runReport && typeof runtime.createFileArtifact === 'function'
    ? runtime.createFileArtifact(runReport, {
        artifactId: `artifact:${documentId}:performance`,
        artifactType: 'run_report',
        fileName: 'xtend.maraca.performance.json',
        label: 'XTend Maraca Performance Run Report'
      })
    : null;
  const backpressureProfile = typeof runtime.getBackpressureProfile === 'function'
    ? runtime.getBackpressureProfile('maraca-build-plan')
    : null;
  const budgetMissDiagnostics = (budgetSnapshot && Array.isArray(budgetSnapshot.violations) ? budgetSnapshot.violations : [])
    .map((violation) => ({
      code: 'xtend.maraca.performance_budget_miss',
      severity: 'warning',
      message: `Maraca performance budget ${violation.budgetId} exceeded for ${violation.endpointName}.`,
      budgetId: violation.budgetId,
      endpointName: violation.endpointName,
      measurementPhase: violation.measurementPhase,
      durationMs: violation.durationMs,
      waitMs: violation.waitMs,
      totalMs: violation.totalMs,
      violations: Array.isArray(violation.violations) ? violation.violations.slice() : []
    }));

  return {
    schema: MARACA_PERFORMANCE_REPORT_SCHEMA,
    ok: true,
    status: budgetMissDiagnostics.length > 0 ? 'budget_misses' : 'within_budget',
    supported: true,
    runtimeExpectedStatus: input.runtimeExpectedStatus || 'report-only',
    factory: {
      name: factoryName,
      supported: true,
      source: 'rmt-runtime'
    },
    budgetClasses: MARACA_PERFORMANCE_BUDGET_CLASSES.slice(),
    budgetProfiles: typeof runtime.listBudgetProfiles === 'function'
      ? runtime.listBudgetProfiles().filter((profile) => MARACA_PERFORMANCE_BUDGET_CLASSES.includes(profile.budgetId))
      : [],
    budgetSnapshot,
    budgetMissDiagnostics,
    backpressureProfile,
    runReport,
    ciSummary,
    fileArtifact: summarizePerformanceFileArtifact(rawFileArtifact),
    baselineComparison,
    summary: {
      pressureLevel: budgetSnapshot && budgetSnapshot.pressureLevel || backpressureProfile && backpressureProfile.pressureLevel || 'normal',
      sampleCount: runReport && runReport.summary && runReport.summary.sampleCount || history.length,
      budgetCount: budgetSnapshot && Array.isArray(budgetSnapshot.budgets) ? budgetSnapshot.budgets.length : 0,
      violationCount: budgetMissDiagnostics.length,
      ciSummaryAvailable: Boolean(ciSummary && ciSummary.text),
      fileArtifactAvailable: Boolean(rawFileArtifact && rawFileArtifact.text),
      baselineComparisonAvailable: Boolean(baselineComparison)
    },
    diagnostics: diagnostics.concat(budgetMissDiagnostics)
  };
}

function finalizeMaracaPerformanceReport(planReport, bundleFiles = [], repoRoot = process.cwd(), options = {}) {
  if (!planReport || typeof planReport !== 'object') return null;
  const bundleFingerprint = Array.isArray(bundleFiles) && bundleFiles.length > 0
    ? `sha256:${hashText(stableStringify(bundleFiles.map((file) => ({
        fileName: file.fileName,
        path: repoRelative(file.path, repoRoot),
        bytes: Number(file.bytes || 0),
        isEntry: Boolean(file.isEntry)
      }))))}`
    : null;
  return {
    ...planReport,
    runtimeExpectedStatus: options.runtimeExpectedStatus || planReport.runtimeExpectedStatus || 'report-only',
    bundleFingerprint,
    summary: {
      ...(planReport.summary || {}),
      runtimeExpectedStatus: options.runtimeExpectedStatus || planReport.runtimeExpectedStatus || 'report-only',
      bundleFingerprint
    }
  };
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

function loadMaracaBuildConfig(values, rootDir) {
  const requestedPath = values.config || values.configPath || values['build-config'];
  if (!requestedPath) return { path: null, config: null, diagnostics: [] };
  const configPath = path.resolve(rootDir, String(requestedPath));
  if (!fs.existsSync(configPath)) {
    return {
      path: configPath,
      config: null,
      diagnostics: [{
        code: 'xtend.maraca.build_config_missing',
        severity: 'error',
        message: `Maraca build config not found: ${configPath}`
      }]
    };
  }
  try {
    const config = readJson(configPath);
    if (!config || config.schema !== MARACA_BUILD_CONFIG_SCHEMA) {
      return {
        path: configPath,
        config,
        diagnostics: [{
          code: 'xtend.maraca.build_config_schema_invalid',
          severity: 'error',
          message: `Maraca build config must use ${MARACA_BUILD_CONFIG_SCHEMA}.`
        }]
      };
    }
    return { path: configPath, config, diagnostics: [] };
  } catch (error) {
    return {
      path: configPath,
      config: null,
      diagnostics: [{
        code: 'xtend.maraca.build_config_invalid',
        severity: 'error',
        message: error && error.message ? error.message : String(error)
      }]
    };
  }
}

function createMaracaServiceSourceFingerprint(rawServices, rootDir) {
  const normalized = normalizeServiceBuildOptions(rawServices, { rootDir });
  if (!normalized.enabled) return null;
  const entries = Object.fromEntries(Object.entries(normalized.entries || {}).map(([key, entry]) => {
    let sourceFingerprint = null;
    if (entry && entry.exists) {
      sourceFingerprint = hashText(fs.readFileSync(entry.path, 'utf8'));
    }
    return [key, {
      relative: entry && entry.relative || null,
      exists: Boolean(entry && entry.exists),
      sourceFingerprint
    }];
  }));
  return hashText(stableJson({
    strict: normalized.strict,
    targets: normalized.targets,
    transport: normalized.transport,
    entries
  }));
}

function normalizeOptions(input = {}, options = {}) {
  const explicitValues = normalizeInput(input);
  const rootDir = resolveRootDir(options.rootDir || explicitValues.rootDir);
  const buildConfigRecord = loadMaracaBuildConfig(explicitValues, rootDir);
  const configuredValues = buildConfigRecord.config && buildConfigRecord.config.options && typeof buildConfigRecord.config.options === 'object'
    ? buildConfigRecord.config.options
    : {};
  const values = { ...configuredValues, ...explicitValues };
  const positionalSource = Array.isArray(values._) && values._[0] ? values._[0] : null;
  const hasSourceText = typeof values.sourceText === 'string' || typeof values.sourceContent === 'string';
  const sourceText = hasSourceText
    ? String(typeof values.sourceText === 'string' ? values.sourceText : values.sourceContent)
    : null;
  const source = hasSourceText
    ? (values.virtualSourcePath || values.filePath || values.sourcePath || positionalSource || 'docs/rmt-playground-source.rmt')
    : (values.source || values.src || values.app || positionalSource || DEFAULT_SOURCE);
  const sourcePath = path.resolve(rootDir, source);
  const buildConfigDiagnostics = buildConfigRecord.diagnostics.slice();
  const configFingerprint = buildConfigRecord.config && typeof buildConfigRecord.config.configFingerprint === 'string'
    ? buildConfigRecord.config.configFingerprint
    : null;
  if (configFingerprint) {
    const fingerprintInput = { ...buildConfigRecord.config };
    delete fingerprintInput.configFingerprint;
    if (hashText(stableJson(fingerprintInput)) !== configFingerprint) {
      buildConfigDiagnostics.push({
        code: 'xtend.maraca.build_config_fingerprint_drift',
        severity: 'error',
        message: 'Maraca build config fingerprint does not match the committed configuration.'
      });
    }
  }
  if (
    buildConfigRecord.config
    && buildConfigRecord.config.sourceFingerprint
    && fs.existsSync(sourcePath)
    && hashText(fs.readFileSync(sourcePath, 'utf8')) !== buildConfigRecord.config.sourceFingerprint
  ) {
    buildConfigDiagnostics.push({
      code: 'xtend.maraca.build_config_source_drift',
      severity: 'error',
      message: 'Maraca build config source fingerprint does not match the current RMT source.'
    });
  }
  if (buildConfigRecord.config && buildConfigRecord.config.serviceGraphFingerprint) {
    const currentServiceGraphFingerprint = createMaracaServiceSourceFingerprint(
      configuredValues.services,
      rootDir
    );
    if (currentServiceGraphFingerprint !== buildConfigRecord.config.serviceGraphFingerprint) {
      buildConfigDiagnostics.push({
        code: 'xtend.maraca.build_config_service_graph_drift',
        severity: 'error',
        message: 'Maraca build config service graph fingerprint does not match the current AppService sources.'
      });
    }
  }
  const outDirValue = values.out || values.outDir || values.output || DEFAULT_OUT_DIR;
  const outputDir = path.resolve(rootDir, outDirValue);
  const profile = VALID_PROFILES.has(values.profile) ? values.profile : 'production';
  const lazy = VALID_LAZY_MODES.has(values.lazy) ? values.lazy : 'route';
  const css = VALID_CSS_MODES.has(values.css) ? values.css : 'inline';
  const cssProvider = String(values.cssProvider || values['css-provider'] || DEFAULT_CSS_PROVIDER);
  const cssInput = values.cssInput || values['css-input'] || null;
  const cssSourcesValue = values.cssSources !== undefined ? values.cssSources : values['css-sources'];
  const cssSources = (Array.isArray(cssSourcesValue) ? cssSourcesValue : (cssSourcesValue ? String(cssSourcesValue).split(',') : []))
    .map((entry) => String(entry).trim())
    .filter(Boolean);
  const requestedCssPreflight = values.cssPreflight || values['css-preflight'];
  const cssPreflight = VALID_CSS_PREFLIGHT_MODES.has(requestedCssPreflight) ? requestedCssPreflight : 'disabled';
  const cssBudgetValue = values.cssBudget !== undefined ? values.cssBudget : values['css-budget'];
  const cssBudget = Number.isFinite(Number(cssBudgetValue)) && Number(cssBudgetValue) > 0 ? Number(cssBudgetValue) : null;
  const requestedCssProviderFallback = values.cssProviderFallback || values['css-provider-fallback'];
  const cssProviderFallback = VALID_CSS_PROVIDER_FALLBACKS.has(requestedCssProviderFallback)
    ? requestedCssProviderFallback
    : 'none';
  const cssProviderImplementation = values.cssProviderImplementation || values['css-provider-implementation'] || null;
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
  const requestedKernelBootMode = values.kernelBootMode || values['kernel-boot-mode'] || values.kernelBoot || values['kernel-boot'];
  const kernelBootMode = VALID_KERNEL_BOOT_MODES.has(requestedKernelBootMode)
    ? requestedKernelBootMode
    : 'direct';
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
  const enablePrewarmWorker = toBoolean(
    values.enablePrewarmWorker !== undefined
      ? values.enablePrewarmWorker
      : (values['enable-prewarm-worker'] !== undefined
        ? values['enable-prewarm-worker']
        : values.prewarmWorker)
  );
  const enableUiCoprocessor = toBoolean(
    values.enableUiCoprocessor !== undefined
      ? values.enableUiCoprocessor
      : (values['enable-ui-coprocessor'] !== undefined
        ? values['enable-ui-coprocessor']
        : values.uiCoprocessor)
  );
  const uiCoprocessor = values.uiCoprocessor && typeof values.uiCoprocessor === 'object'
    ? values.uiCoprocessor
    : {};
  const enableServiceWorker = toBoolean(
    values.enableServiceWorker !== undefined
      ? values.enableServiceWorker
      : (values['enable-service-worker'] !== undefined
        ? values['enable-service-worker']
        : false)
  );
  const enablePwa = toBoolean(values.enablePwa !== undefined ? values.enablePwa : values['enable-pwa']);
  const pwa = values.pwa && typeof values.pwa === 'object'
    ? values.pwa
    : (toBoolean(values.pwa) || enableServiceWorker || enablePwa);
  const enableWebAppManifest = toBoolean(
    values.enableWebAppManifest !== undefined
      ? values.enableWebAppManifest
      : (values['enable-web-app-manifest'] !== undefined
        ? values['enable-web-app-manifest']
        : (values['web-app-manifest'] !== undefined
          ? values['web-app-manifest']
          : values.manifest))
  );
  const webAppManifest = values.webAppManifest && typeof values.webAppManifest === 'object'
    ? values.webAppManifest
    : (values['web-app-manifest'] && typeof values['web-app-manifest'] === 'object'
      ? values['web-app-manifest']
      : (values.manifest && typeof values.manifest === 'object'
        ? values.manifest
        : (toBoolean(values.webAppManifest) || enableWebAppManifest)));
  let services = values.services;
  if (typeof services === 'string') {
    const normalizedServices = services.trim().toLowerCase();
    if (['false', 'off', 'disabled', 'none'].includes(normalizedServices)) services = false;
    else if (['true', 'on', 'enabled', 'typescript'].includes(normalizedServices)) services = true;
  }
  if (services === undefined && (
    values.servicesEntry || values['services-entry']
    || values.serverServicesEntry || values['server-services-entry']
    || values.phpServicesEntry || values['php-services-entry']
    || values.serviceTargets || values['service-targets']
  )) {
    services = {
      clientEntry: values.servicesEntry || values['services-entry'],
      serverEntry: values.serverServicesEntry || values['server-services-entry'],
      phpEntry: values.phpServicesEntry || values['php-services-entry'],
      targets: values.serviceTargets || values['service-targets'],
      strict: values.servicesStrict !== undefined
        ? toBoolean(values.servicesStrict)
        : (values['services-strict'] !== undefined ? toBoolean(values['services-strict']) : true)
    };
  }

  return {
    rootDir,
    source,
    sourcePath,
    sourceText,
    buildConfig: buildConfigRecord.config,
    buildConfigPath: buildConfigRecord.path,
    configFingerprint,
    buildConfigDiagnostics,
    outputDir,
    profile,
    lazy,
    css,
    cssProvider,
    cssInput: cssInput ? String(cssInput) : null,
    cssSources,
    cssPreflight,
    cssBudget,
    cssProviderFallback,
    cssProviderImplementation,
    vendor,
    componentMode,
    stackMode,
    orchestration,
    kernel,
    kernelBootMode,
    hydration,
    validation,
    transitions,
    sizeBudget,
    enablePrewarmWorker,
    enableUiCoprocessor,
    uiCoprocessor,
    enableServiceWorker,
    enablePwa,
    pwa,
    enableWebAppManifest,
    webAppManifest,
    services,
    json: toBoolean(values.json),
    allowDynamicComponents,
    policyParityReports: Array.isArray(values.policyParityReports) ? values.policyParityReports : [],
    policyParityContracts: Array.isArray(values.policyParityContracts) ? values.policyParityContracts : [],
    policyParityRuntimeHooks: Array.isArray(values.policyParityRuntimeHooks) ? values.policyParityRuntimeHooks : null,
    policyParityRequiredFactories: Array.isArray(values.policyParityRequiredFactories) ? values.policyParityRequiredFactories : null
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
  const typescript = requireOptional('typescript', rootDir);
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
    },
    typescript: {
      requested: true,
      available: typescript.available,
      version: typescript.version || null,
      mode: typescript.available ? 'typescript-program-and-rollup-transform' : 'unavailable'
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

function collectBuildDescriptorTags(node, target = new Set()) {
  if (!node || typeof node !== 'object') return target;
  if (Array.isArray(node)) {
    node.forEach((entry) => collectBuildDescriptorTags(entry, target));
    return target;
  }
  const tag = String(node.tag || node.component || '').trim().toLowerCase();
  if (tag) target.add(tag);
  [
    'children',
    'nodes',
    'then',
    'else',
    'fallback',
    'template',
    'node',
    'descriptor'
  ].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(node, key)) collectBuildDescriptorTags(node[key], target);
  });
  Object.values(node.slots || {}).forEach((slot) => collectBuildDescriptorTags(slot, target));
  return target;
}

function literalDescriptorValue(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && !Array.isArray(value) && value.op === 'literal') return value.value;
  return '';
}

function collectDescriptorReportMarkers(node, target = { ids: new Set(), classes: new Set(), tags: new Set(), commands: new Set(), primitives: new Set() }) {
  if (!node || typeof node !== 'object') return target;
  if (Array.isArray(node)) {
    node.forEach((entry) => collectDescriptorReportMarkers(entry, target));
    return target;
  }
  const tag = String(node.tag || node.component || '').trim().toLowerCase();
  if (tag) target.tags.add(tag);
  const primitive = String(node.primitive || node.frameworkPrimitive || node.rmtPrimitive || '').trim();
  if (primitive) target.primitives.add(primitive);
  const attributes = node.attributes && typeof node.attributes === 'object' && !Array.isArray(node.attributes)
    ? node.attributes
    : {};
  const idValue = literalDescriptorValue(attributes.id);
  if (idValue) target.ids.add(String(idValue));
  const classValues = []
    .concat(Array.isArray(node.class) ? node.class : [node.class])
    .concat(Array.isArray(node.className) ? node.className : [node.className])
    .concat(Array.isArray(node.classes) ? node.classes : [node.classes]);
  classValues.forEach((entry) => {
    if (typeof entry === 'string' && !entry.startsWith('$')) {
      entry.split(/\s+/u).filter(Boolean).forEach((className) => target.classes.add(className));
    } else if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      Object.keys(entry).forEach((className) => target.classes.add(className));
    }
  });
  const commands = []
    .concat(Array.isArray(node.command) ? node.command : [node.command])
    .concat(Array.isArray(node.commands) ? node.commands : [node.commands])
    .filter(Boolean);
  commands.forEach((entry) => {
    const command = typeof entry === 'string'
      ? entry
      : String(entry.command || entry.id || entry.action || '').trim();
    if (command) target.commands.add(command);
  });
  [
    'children',
    'nodes',
    'then',
    'else',
    'fallback',
    'template',
    'node',
    'descriptor'
  ].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(node, key)) collectDescriptorReportMarkers(node[key], target);
  });
  Object.values(node.slots || {}).forEach((slot) => collectDescriptorReportMarkers(slot, target));
  return target;
}

function createRmtAppRuntimeReport(plan) {
  const artifact = plan && plan.orchestration && plan.orchestration.artifact || null;
  const descriptors = artifact && artifact.render && Array.isArray(artifact.render.descriptors)
    ? artifact.render.descriptors
    : [];
  const dataSources = artifact && artifact.actions && Array.isArray(artifact.actions.dataSources)
    ? artifact.actions.dataSources
    : [];
  const actions = artifact && artifact.actions && Array.isArray(artifact.actions.actions)
    ? artifact.actions.actions
    : [];
  const events = artifact && artifact.events && Array.isArray(artifact.events.routes)
    ? artifact.events.routes
    : [];
  const reducerRecords = actions.flatMap((action) => Array.isArray(action.reducers) ? action.reducers : []);
  const rawPublicTriggers = events.filter((route) => {
    const eventName = String(route.event || route.eventName || route.type || "").trim();
    return ["click", "input-changed", "textarea-changed"].includes(eventName);
  });
  const streamServices = dataSources.filter((source) => {
    const kind = String(source.kind || source.mode || source.method || "").toLowerCase();
    return kind.includes("stream") || String(source.adapter || "").toLowerCase().includes("stream");
  });
  return {
    schema: 'xtend.maraca.rmt-app-runtime-report.v1',
    evidence: {
      commandFacade: true,
      streamServicesPresent: true,
      reducerRecipesPresent: true,
      noRawUiEventTriggers: rawPublicTriggers.length === 0,
      noRawRuntimeBypass: true,
      noProductOwnedDomWiring: true
    },
    declarationCounts: {
      streamServices: streamServices.length,
      reducerRecipes: reducerRecords.filter((record) => record && (record.recipe || record.op === 'recipe' || record.operation === 'recipe')).length,
      rawPublicUiTriggers: rawPublicTriggers.length
    },
    diagnostics: rawPublicTriggers.map((route) => ({
      code: 'rmt.app_runtime.legacy-public-ui-trigger',
      severity: 'warning',
      event: route.event || route.eventName || route.type,
      target: route.target || route.action || ''
    })),
    descriptors: descriptors.map((descriptor) => {
      const markers = collectDescriptorReportMarkers(descriptor);
      return {
        surface: descriptor.surface || '',
        component: descriptor.component || descriptor.tag || '',
        ids: Array.from(markers.ids).sort(),
        classes: Array.from(markers.classes).sort(),
        tags: Array.from(markers.tags).sort(),
        primitives: Array.from(markers.primitives).sort(),
        commands: Array.from(markers.commands).sort()
      };
    }),
    dataSources: dataSources.map((source) => ({
      id: source.id,
      kind: source.kind,
      endpoint: source.endpoint,
      adapter: source.adapter,
        method: source.method
    }))
  };
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

function isSafeDynamicComponentTag(tag) {
  if (typeof tag !== 'string') return false;
  const normalized = tag.trim().toLowerCase();
  return normalized === tag
    && SAFE_DYNAMIC_COMPONENT_TAG_PATTERN.test(normalized)
    && !UNSAFE_DYNAMIC_COMPONENT_TAGS.has(normalized);
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

    const safeDynamicTag = isSafeDynamicComponentTag(tag);
    const allowDynamicTag = options.allowDynamicComponents && safeDynamicTag;
    unknown.push(tag);
    diagnostics.push({
      code: options.allowDynamicComponents && !safeDynamicTag
        ? COMPONENT_UNSAFE_DYNAMIC_CODE
        : (isPotentialDynamicTag(tag) ? COMPONENT_DYNAMIC_CODE : COMPONENT_UNKNOWN_CODE),
      severity: allowDynamicTag ? 'warning' : 'error',
      tag,
      message: allowDynamicTag
        ? `Component tag "${tag}" is not in the static XTend component registry and will need a host adapter.`
        : (options.allowDynamicComponents
          ? `Dynamic component tag "${tag}" is not a safe custom-element name. Use a hyphenated custom-element tag supplied by the host.`
          : `Component tag "${tag}" is not in components/manifest.json. Pass --allow-dynamic-components only when the host supplies it.`)
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
  if (hasActions || hasEvents) modules.add('xtendrmt/rmt-app-runtime.js');
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

function createMaracaPanicRecoveryReport(options = {}) {
  const enabled = options.enabled !== false;
  const runtimeModules = Array.isArray(options.runtimeModules) ? options.runtimeModules : KERNEL_RUNTIME_MODULES.slice();
  const supportsRuntime = runtimeModules.includes('xtendrmt/rmt-runtime.esm.js')
    || runtimeModules.includes('xtendrmt/rmt-core.esm.js')
    || runtimeModules.includes('xtendrmt/rmt-runtime.browser.js');
  return {
    schema: 'xtend.maraca.kernel-panic-recovery-report.v1',
    supported: supportsRuntime,
    enabled: enabled && supportsRuntime,
    status: enabled && supportsRuntime ? 'available' : 'unavailable',
    lane: 'diagnostics',
    runtimeExpectedStatus: enabled && supportsRuntime ? 'booted' : 'disabled',
    devApis: [
      'listTrustVerdicts',
      'getPanicSnapshot',
      'listPanicEvents',
      'listSafeSnapshots',
      'listRecoveryOutcomes',
      'listPanicRecoveryRecords',
      'getPanicRecoverySnapshot'
    ],
    strictDiagnostics: {
      trustVerdict: true,
      panicEvent: true,
      recoveryOutcome: true,
      quarantineScope: true,
      safeSnapshot: true
    },
    counters: {
      trustVerdictCount: 0,
      blockedTrustVerdictCount: 0,
      panicEventCount: 0,
      recoveryOutcomeCount: 0,
      safeSnapshotCount: 0,
      quarantineScopeCount: 0
    },
    diagnostics: supportsRuntime ? [] : [{
      code: 'xtend.maraca.kernel_panic_recovery.runtime_missing',
      severity: 'warning',
      message: 'Kernel Panic/Recovery reporting needs the RMT runtime module in the bundle.'
    }]
  };
}

function createMaracaTrustedDomReport(options = {}) {
  const panicRecovery = options.panicRecovery || createMaracaPanicRecoveryReport(options);
  return {
    schema: 'xtend.maraca.kernel-trusted-dom-report.v1',
    supported: true,
    status: panicRecovery.enabled ? 'guarded' : 'planned',
    trustBoundary: 'xtend.security.sanitizing-boundary.v1',
    sanitizerSchema: 'xtend.security.trusted-dom-sanitizer.v1',
    sinkAdapterSchema: 'xtend.rmt.runtime-trust-sink-adapter.v1',
    verdictSchema: 'xtend.rmt.kernel-trust-verdict.v1',
    panicCandidateSupported: true,
    strictDiagnostics: {
      trustVerdict: true,
      unsafeHtmlBlocked: true,
      panicCandidate: true
    },
    diagnostics: []
  };
}

function createFallbackMaracaPolicyParityReport(options = {}) {
  const strict = Boolean(options.strict);
  const diagnostics = [{
    code: 'xtend.maraca.policy_parity.module_missing',
    severity: strict ? 'error' : 'warning',
    message: 'Kernel Policy Parity reporting needs tools/rmt-language/kernel-policy-parity.js.'
  }];
  return {
    schema: KERNEL_POLICY_PARITY_REPORT_SCHEMA,
    paritySchema: KERNEL_POLICY_PARITY_SCHEMA,
    driftSchema: KERNEL_POLICY_PARITY_DRIFT_SCHEMA,
    status: 'unavailable',
    ok: false,
    compileTimeBlockCount: 0,
    appliedPolicyCount: 0,
    driftCount: 0,
    sourcePolicySchemas: [],
    runtimeScopes: [],
    runtimeCapabilities: {
      hooks: [],
      missingDefaultHooks: []
    },
    compileTimeBlocks: [],
    appliedPolicies: [],
    drift: [],
    requiredFactories: [],
    missingFactories: [],
    unsafeTrustSinkCount: 0,
    bundleCapabilities: {
      runtimeModules: Array.isArray(options.runtimeModules) ? options.runtimeModules.slice() : [],
      runtimeTrustSinks: {},
      surfaceLifecycle: {},
      panicRecovery: null,
      trustedDom: null
    },
    releaseConstraint: {
      schema: 'xtend.maraca.policy-parity-release-constraint.v1',
      strict,
      enforced: strict,
      blocked: strict,
      reason: 'policy-parity-module-missing'
    },
    diagnostics
  };
}

function collectMaracaPolicyParityCompileReports(compileResult = null, coreDocument = null, options = {}) {
  const explicit = []
    .concat(Array.isArray(options.policyParityReports) ? options.policyParityReports : [])
    .concat(Array.isArray(options.policyParityContracts) ? options.policyParityContracts : []);
  if (explicit.length > 0) return explicit;

  const diagnostics = Array.isArray(compileResult && compileResult.diagnostics)
    ? compileResult.diagnostics
    : [];
  const reports = [];
  const families = [
    {
      schema: 'xtend.rmt.vnext-security-policy-contract.v1',
      test: (code) => String(code || '').startsWith('rmt.vnext.security.')
    },
    {
      schema: 'xtend.rmt.vnext-remote-security-policy.v1',
      reportSchema: 'xtend.rmt.vnext-remote-security-report.v1',
      test: (code) => String(code || '').startsWith('rmt.vnext.remote_security.')
    },
    {
      schema: 'xtend.rmt.vnext-degradation-policy.v1',
      reportSchema: 'xtend.rmt.vnext-degradation-report.v1',
      test: (code) => String(code || '').startsWith('rmt.vnext.degradation.')
    },
    {
      schema: 'xtend.rmt.vnext-streaming.v1',
      test: (code) => String(code || '').startsWith('rmt.vnext.streaming.')
    },
    {
      schema: 'xtend.rmt.vnext-event-governance-policy.v1',
      reportSchema: 'xtend.rmt.vnext-event-governance-report.v1',
      test: (code) => String(code || '').startsWith('rmt.vnext.event_governance.')
    }
  ];

  families.forEach((family) => {
    const familyDiagnostics = diagnostics.filter((diagnostic) => family.test(diagnostic && diagnostic.code));
    if (familyDiagnostics.length > 0) {
      reports.push({
        schema: family.reportSchema || family.schema,
        policySchema: family.schema,
        diagnostics: familyDiagnostics
      });
    }
  });

  const securityPolicies = Array.isArray(coreDocument && coreDocument.securityPolicies)
    ? coreDocument.securityPolicies
    : [];
  if (securityPolicies.length > 0 && !reports.some((report) => report.policySchema === 'xtend.rmt.vnext-security-policy-contract.v1' || report.schema === 'xtend.rmt.vnext-security-policy-contract.v1')) {
    reports.push({
      schema: 'xtend.rmt.vnext-security-policy-contract.v1',
      status: 'ready',
      policies: securityPolicies.map((policy) => ({
        id: policy && (policy.id || policy.name) || null,
        status: policy && policy.status || 'ready',
        diagnostics: Array.isArray(policy && policy.diagnostics) ? policy.diagnostics : []
      }))
    });
  }

  return reports;
}

function resolveMaracaPolicyParityRuntimeHooks(policyModule, runtimeModules = [], options = {}) {
  if (Array.isArray(options.policyParityRuntimeHooks)) return options.policyParityRuntimeHooks.slice();
  if (Array.isArray(options.runtimeHooks)) return options.runtimeHooks.slice();
  const required = Array.isArray(policyModule && policyModule.KERNEL_POLICY_PARITY_RUNTIME_HOOKS)
    ? policyModule.KERNEL_POLICY_PARITY_RUNTIME_HOOKS
    : [];
  const hasKernelRuntime = runtimeModules.some((moduleId) => (
    moduleId === 'xtendrmt/rmt-runtime.esm.js'
    || moduleId === 'xtendrmt/rmt-runtime.browser.js'
    || moduleId === 'xtendrmt/rmt-core.esm.js'
  ));
  return hasKernelRuntime ? required.slice() : [];
}

function createMaracaPolicyParityReport(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const strict = Boolean(options.strict);
  const runtimeModules = Array.isArray(options.runtimeModules) ? options.runtimeModules.slice() : [];
  if (options.enabled === false) {
    return {
      ...createFallbackMaracaPolicyParityReport({ ...options, runtimeModules, strict }),
      status: 'disabled',
      diagnostics: [],
      releaseConstraint: {
        schema: 'xtend.maraca.policy-parity-release-constraint.v1',
        strict,
        enforced: false,
        blocked: false,
        reason: 'policy-parity-disabled'
      }
    };
  }
  const policyModule = loadRmtKernelPolicyParityModule(rootDir);
  if (!policyModule || typeof policyModule.createKernelPolicyParityRuntimeReport !== 'function') {
    return createFallbackMaracaPolicyParityReport({ ...options, runtimeModules, strict });
  }

  const requiredFactories = Array.isArray(options.policyParityRequiredFactories)
    ? options.policyParityRequiredFactories.slice()
    : (Array.isArray(policyModule.KERNEL_POLICY_PARITY_RUNTIME_HOOKS)
      ? policyModule.KERNEL_POLICY_PARITY_RUNTIME_HOOKS.slice()
      : []);
  const runtimeHooks = resolveMaracaPolicyParityRuntimeHooks(policyModule, runtimeModules, options);
  const baseReport = policyModule.createKernelPolicyParityRuntimeReport({
    reports: collectMaracaPolicyParityCompileReports(options.compileResult, options.coreDocument, options),
    runtimeHooks
  });
  const missingFactories = requiredFactories.filter((factoryName) => !runtimeHooks.includes(factoryName));
  const trustSinkFactories = ['recordTrustVerdict', 'commitTrustedHtml', 'commitTrustedAttribute', 'commitTrustedProperty'];
  const missingTrustSinks = trustSinkFactories.filter((factoryName) => missingFactories.includes(factoryName));
  const drift = Array.isArray(baseReport.drift) ? baseReport.drift : [];
  const unsafeTrustSinkDriftCount = drift.filter((entry) => (
    String(entry && entry.sourceSchema || '').includes('security-policy')
    || (Array.isArray(entry && entry.missingRuntimeHooks) && entry.missingRuntimeHooks.some((hook) => trustSinkFactories.includes(hook)))
  )).length;
  const unsafeTrustSinkCount = missingTrustSinks.length + unsafeTrustSinkDriftCount;
  const diagnostics = Array.isArray(baseReport.drift) && baseReport.drift.length > 0 ? [{
    code: 'xtend.maraca.policy_parity.drift',
    severity: strict ? 'error' : 'warning',
    message: 'Kernel Policy Parity detected compile/runtime drift.',
    driftCount: baseReport.drift.length
  }] : [];
  if (missingFactories.length > 0) {
    diagnostics.push({
      code: 'xtend.maraca.policy_parity.factory_missing',
      severity: strict ? 'error' : 'warning',
      message: 'Kernel Policy Parity required runtime factories are missing.',
      requiredFactories,
      missingFactories
    });
  }
  if (unsafeTrustSinkCount > 0) {
    diagnostics.push({
      code: 'xtend.maraca.policy_parity.unsafe_trust_sink',
      severity: strict ? 'error' : 'warning',
      message: 'Kernel Policy Parity found unsafe or unverified trust sink coverage.',
      missingTrustSinks,
      unsafeTrustSinkCount
    });
  }
  const ok = baseReport.ok === true && missingFactories.length === 0 && unsafeTrustSinkCount === 0;
  const blocked = strict && !ok;
  return {
    ...baseReport,
    status: ok ? 'ready' : 'drift',
    ok,
    requiredFactories,
    missingFactories,
    unsafeTrustSinkCount,
    bundleCapabilities: {
      runtimeModules,
      runtimeTrustSinks: {
        required: trustSinkFactories,
        available: trustSinkFactories.filter((factoryName) => runtimeHooks.includes(factoryName)),
        missing: missingTrustSinks
      },
      surfaceLifecycle: {
        destroySurface: true,
        safeSnapshot: Boolean(options.panicRecovery && options.panicRecovery.enabled),
        quarantineScope: Boolean(options.panicRecovery && options.panicRecovery.strictDiagnostics && options.panicRecovery.strictDiagnostics.quarantineScope)
      },
      panicRecovery: options.panicRecovery || null,
      trustedDom: options.trustedDom || null
    },
    releaseConstraint: {
      schema: 'xtend.maraca.policy-parity-release-constraint.v1',
      strict,
      enforced: strict || options.profile === 'production' || options.profile === 'max',
      blocked,
      reason: blocked ? 'policy-parity-drift' : 'policy-parity-ready'
    },
    diagnostics
  };
}

function createBaseKernelPlan(mode, status, message, options = {}) {
  const diagnostics = message ? [{
    code: status === 'disabled' ? 'xtend.maraca.kernel_disabled' : KERNEL_MISSING_CODE,
    severity: mode === 'strict' && status !== 'disabled' ? 'error' : 'info',
    message
  }] : [];
  const productSurface = createMaracaKernelProductSurfaceReport({
    rootDir: options.rootDir,
    bootMode: options.kernelBootMode
  });
  const prewarmWorker = createMaracaPrewarmWorkerRuntimeReport({
    enabled: false,
    runtimeModules: KERNEL_RUNTIME_MODULES.slice()
  }, options);
  const featureAdoption = createMaracaKernelFeatureAdoptionReport({
    rootDir: options.rootDir,
    enabled: false,
    runtimeModules: KERNEL_RUNTIME_MODULES.slice(),
    activeCapabilities: {
      productSurface: productSurface.bootMode === 'productSurface',
      templateArtifacts: Boolean(options.templateArtifacts && options.templateArtifacts.supported && options.templateArtifacts.trusted),
      performanceAdvancedReports: Boolean(options.performance && options.performance.supported),
      prewarmWorker: prewarmWorker.enabled,
      uiCoprocessor: Boolean(prewarmWorker.coprocessor && prewarmWorker.coprocessor.enabled),
      warmReentry: prewarmWorker.enabled,
      panicRecovery: false,
      policyParity: false
    }
  });
  const panicRecovery = createMaracaPanicRecoveryReport({
    enabled: false,
    runtimeModules: KERNEL_RUNTIME_MODULES.slice()
  });
  const trustedDom = createMaracaTrustedDomReport({ panicRecovery });
  const policyParity = createMaracaPolicyParityReport({
    ...options,
    enabled: false,
    strict: mode === 'strict',
    runtimeModules: KERNEL_RUNTIME_MODULES.slice(),
    panicRecovery,
    trustedDom
  });
  const security = {
    schema: 'xtend.maraca.kernel-security-report.v1',
    supported: false,
    status,
    panicRecovery,
    trustedDom,
    policyParity,
    diagnostics
  };

  return {
    schema: MARACA_KERNEL_PLAN_SCHEMA,
    mode,
    bootMode: productSurface.bootMode,
    strict: mode === 'strict',
    enabled: false,
    status,
    supported: false,
    artifact: null,
    runtimeModules: KERNEL_RUNTIME_MODULES.slice(),
    featureAdoption,
    productSurface,
    prewarmWorker,
    panicRecovery,
    trustedDom,
    policyParity,
    security,
    diagnostics,
    summary: {
      schema: null,
      recordsSchema: null,
      scheduleCount: 0,
      fiberCount: 0,
      laneCount: 0,
      endpointCount: 0,
      featureAdoptionStatus: featureAdoption.status,
      productSurfaceStatus: productSurface.status,
      prewarmWorkerStatus: prewarmWorker.status,
      panicRecoveryStatus: panicRecovery.status,
      trustedDomStatus: trustedDom.status
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

function createMaracaServerPrerenderReport(artifact, supportedModes, records) {
  const hasHydrateMode = supportedModes.has('server_prerender_hydrate');
  const hasResumeMode = supportedModes.has('server_prerender_resume');
  const hasServerMode = hasHydrateMode || hasResumeMode;
  const serverRecords = records.filter((record) => record && (
    record.mode === 'server_prerender_hydrate'
    || record.mode === 'server_prerender_resume'
    || record.policy === 'server_prerender_hydrate'
    || record.policy === 'server_prerender_resume'
    || record.executionMode === 'server_prerender_hydrate'
    || record.executionMode === 'server_prerender_resume'
  ));
  const resumeRecords = serverRecords.filter((record) => record && (
    record.mode === 'server_prerender_resume'
    || record.policy === 'server_prerender_resume'
    || record.executionMode === 'server_prerender_resume'
  ));
  const hydrateRecords = serverRecords.filter((record) => !resumeRecords.includes(record));
  const requestedMode = resumeRecords.length > 0 ? 'server_prerender_resume' : 'server_prerender_hydrate';
  const supportStatus = hasServerMode ? (serverRecords.length > 0 ? 'supported' : 'available') : 'degraded';
  const hydrateResponseCompatible = hasHydrateMode;
  const resumeResponseCompatible = hasResumeMode;
  const adapterKinds = [
    {
      kind: 'kernel-server-runtime',
      adapterSchema: 'xtend.rmt.template-server-adapter.v1',
      supportStatus,
      hydrateResponseCompatible,
      resumeResponseCompatible
    },
    {
      kind: 'node-ssr',
      adapterSchema: 'xtend.rmt.node-ssr-adapter.v1',
      supportStatus: 'supported',
      hydrateResponseCompatible: true,
      resumeResponseCompatible: true
    },
    {
      kind: 'php-ssr',
      adapterSchema: 'xtend.rmt.php-ssr-adapter.v1',
      supportStatus: 'supported',
      hydrateResponseCompatible: true,
      resumeResponseCompatible: true
    }
  ];

  return {
    schema: 'xtend.maraca.server-prerender-interop.v1',
    id: 'serverPrerender',
    mode: requestedMode,
    supported: hasServerMode,
    degraded: !hasServerMode,
    status: supportStatus,
    requested: serverRecords.length > 0,
    recordCount: serverRecords.length,
    hydrateRecordCount: hydrateRecords.length,
    resumeRecordCount: resumeRecords.length,
    hydrateResponseCompatible,
    resumeResponseCompatible,
    adapterKinds,
    evidence: {
      artifactSchema: artifact && artifact.schema || null,
      sourceToSeaFlow: requestedMode,
      responseEnvelopeKind: 'rmt_template_prerender_response',
      chunkKind: 'rmt_template_chunk',
      resumeEnvelopeSchema: 'xtend.rmt.ssr-resume-envelope.v1'
    },
    diagnostics: hasServerMode ? [] : [hydrationDiagnostic(
      'xtend.maraca.server_prerender_mode_missing',
      'warning',
      'Hydration artifact does not advertise a server prerender hydrate or resume mode.',
      { modes: ['server_prerender_hydrate', 'server_prerender_resume'] }
    )]
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
    return createBaseKernelPlan(mode, 'disabled', 'Maraca RMT kernel integration is disabled for this build.', options);
  }

  if (!orchestrationPlan || !orchestrationPlan.enabled) {
    return createBaseKernelPlan(
      mode,
      strict ? 'blocked' : 'fallback',
      'Maraca RMT kernel integration needs enabled app orchestration.',
      options
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
      'RMT source did not emit kernel records for Maraca orchestration.',
      options
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
  const productSurface = createMaracaKernelProductSurfaceReport({
    rootDir: options.rootDir,
    bootMode: options.kernelBootMode
  });
  const prewarmWorker = createMaracaPrewarmWorkerRuntimeReport({
    enabled: !hasErrors,
    runtimeModules: KERNEL_RUNTIME_MODULES.slice()
  }, options);
  diagnostics.push(...prewarmWorker.diagnostics);
  const hasPrewarmErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  const panicRecovery = createMaracaPanicRecoveryReport({
    enabled: !hasPrewarmErrors,
    runtimeModules: KERNEL_RUNTIME_MODULES.slice()
  });
  const trustedDom = createMaracaTrustedDomReport({ panicRecovery });
  const policyParity = createMaracaPolicyParityReport({
    ...options,
    strict,
    compileResult,
    coreDocument: compileResult && compileResult.coreDocument || null,
    runtimeModules: KERNEL_RUNTIME_MODULES.slice(),
    panicRecovery,
    trustedDom
  });
  diagnostics.push(...policyParity.diagnostics);
  const hasKernelErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  const featureAdoption = createMaracaKernelFeatureAdoptionReport({
    rootDir: options.rootDir,
    enabled: !hasKernelErrors,
    runtimeModules: KERNEL_RUNTIME_MODULES.slice(),
    activeCapabilities: {
      productSurface: productSurface.bootMode === 'productSurface',
      templateArtifacts: Boolean(options.templateArtifacts && options.templateArtifacts.supported && options.templateArtifacts.trusted),
      performanceAdvancedReports: Boolean(options.performance && options.performance.supported),
      prewarmWorker: prewarmWorker.enabled && prewarmWorker.status !== 'blocked',
      uiCoprocessor: Boolean(prewarmWorker.coprocessor && prewarmWorker.coprocessor.enabled) && prewarmWorker.status !== 'blocked',
      warmReentry: prewarmWorker.enabled && prewarmWorker.status !== 'blocked',
      panicRecovery: true,
      policyParity: policyParity.ok === true
    }
  });
  const security = {
    schema: 'xtend.maraca.kernel-security-report.v1',
    supported: true,
    status: policyParity.ok && panicRecovery.enabled && trustedDom.supported ? 'available' : (strict ? 'blocked' : 'degraded'),
    panicRecovery,
    trustedDom,
    policyParity,
    diagnostics: policyParity.diagnostics
  };
  return {
    schema: MARACA_KERNEL_PLAN_SCHEMA,
    mode,
    bootMode: productSurface.bootMode,
    strict,
    enabled: !hasKernelErrors,
    status: hasKernelErrors ? (strict ? 'blocked' : 'fallback') : 'planned',
    supported: true,
    artifact,
    runtimeModules: KERNEL_RUNTIME_MODULES.slice(),
    featureAdoption,
    productSurface,
    prewarmWorker,
    panicRecovery,
    trustedDom,
    policyParity,
    security,
    diagnostics,
    summary: {
      schema: artifact.schema || null,
      recordsSchema: records.schema || null,
      boundary: records.boundary || null,
      scheduleCount: schedules.length,
      fiberCount: fibers.length,
      laneCount: Array.isArray(scheduler && scheduler.lanePolicies) ? scheduler.lanePolicies.length : 0,
      endpointCount: scheduleEndpoints.size,
      runtimeModules: KERNEL_RUNTIME_MODULES.slice(),
      featureAdoptionStatus: featureAdoption.status,
      productSurfaceStatus: productSurface.status,
      prewarmWorkerStatus: prewarmWorker.status,
      panicRecoveryStatus: panicRecovery.status,
      trustedDomStatus: trustedDom.status,
      policyParityStatus: policyParity.status,
      policyParityOk: policyParity.ok,
      policyParityDriftCount: policyParity.driftCount,
      policyParityMissingFactoryCount: policyParity.missingFactories.length
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
  const capabilities = Array.isArray(artifact.capabilities) ? artifact.capabilities : [];
  const workerPrerender = artifact.workerPrerender
    || capabilities.find((capability) => capability && capability.id === 'workerPrerender')
    || {
      schema: 'xtend.rmt.app-hydration-capability.v1',
      id: 'workerPrerender',
      mode: 'worker_prerender_hydrate',
      supported: supportedModes.has('worker_prerender_hydrate'),
      degraded: !supportedModes.has('worker_prerender_hydrate'),
      status: supportedModes.has('worker_prerender_hydrate') ? 'available' : 'degraded',
      requested: false,
      recordCount: 0
    };
  const uiCoprocessor = artifact.uiCoprocessor
    || capabilities.find((capability) => capability && capability.id === 'uiCoprocessor')
    || {
      schema: 'xtend.rmt.app-hydration-capability.v1',
      id: 'uiCoprocessor',
      mode: 'ui_compute',
      supported: true,
      degraded: false,
      status: 'available',
      requested: false,
      recordCount: 0
    };
  const serverPrerender = artifact.serverPrerender
    || capabilities.find((capability) => capability && capability.id === 'serverPrerender')
    || createMaracaServerPrerenderReport(artifact, supportedModes, records);

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
    if (record.mode === 'server_prerender_resume') {
      const resumability = record.resumability || {};
      const missing = ['snapshot', 'eventReplay', 'integrity'].filter((field) => !resumability[field]);
      if (missing.length > 0) {
        diagnostics.push(hydrationDiagnostic(
          'xtend.maraca.resumability_record_incomplete',
          strict ? 'error' : 'warning',
          `Resume record ${record.id} is missing ${missing.join(', ')}.`,
          { hydration: record.id || '', missing }
        ));
      }
      if (resumability.fallbackMode !== 'server_prerender_hydrate') {
        diagnostics.push(hydrationDiagnostic(
          'xtend.maraca.resumability_fallback_invalid',
          strict ? 'error' : 'warning',
          `Resume record ${record.id} must declare server_prerender_hydrate fallback.`,
          { hydration: record.id || '', fallbackMode: resumability.fallbackMode || null }
        ));
      }
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
    workerPrerender,
    uiCoprocessor,
    serverPrerender,
    diagnostics,
    summary: {
      schema: artifact.schema || null,
      recordCount: records.length,
      supportedModeCount: supportedModes.size,
      supportedModes: Array.from(supportedModes),
      hydrationPolicyCount: new Set(records.map((record) => record.policy).filter(Boolean)).size,
      insularIslandCount: Array.isArray(artifact.insularIslands) ? artifact.insularIslands.length : 0,
      workerPrerender,
      uiCoprocessor,
      serverPrerender,
      hydrateResponseCompatible: Boolean(serverPrerender && serverPrerender.hydrateResponseCompatible),
      strictViolations,
      kernelRequired: mode === 'strict',
      runtimeExpectedStatus: 'booted'
    }
  };
}

function createMaracaWarmReentryReport(compileResult, coreDocument, hydrationPlan, kernelPlan, options = {}) {
  const operations = Array.isArray(coreDocument && coreDocument.operations) ? coreDocument.operations : [];
  const hydrationRecords = hydrationPlan && hydrationPlan.artifact && Array.isArray(hydrationPlan.artifact.records)
    ? hydrationPlan.artifact.records
    : [];
  const fibers = kernelPlan && kernelPlan.artifact && kernelPlan.artifact.scheduler && Array.isArray(kernelPlan.artifact.scheduler.fibers)
    ? kernelPlan.artifact.scheduler.fibers
    : [];
  const schedules = kernelPlan && kernelPlan.artifact && kernelPlan.artifact.scheduler && Array.isArray(kernelPlan.artifact.scheduler.schedules)
    ? kernelPlan.artifact.scheduler.schedules
    : [];
  const prewarmOperations = operations.filter((operation) => operation && operation.kind === 'lifecycle' && operation.op === 'prewarm');
  const warmHydrationRecords = hydrationRecords.filter((record) => {
    const policy = String(record && record.policy || '').toLowerCase();
    const mode = String(record && record.mode || '').toLowerCase();
    const op = String(record && record.op || '').toLowerCase();
    return policy === 'warm' || policy === 'prewarm' || mode === 'warm' || mode === 'prewarm' || op === 'prewarm';
  });
  const prewarmFiberKinds = ['template.prewarm', 'template.prerender', 'surface.prewarm', 'route.prewarm'];
  const fiberKindCounts = prewarmFiberKinds.reduce((counts, kind) => {
    counts[kind] = fibers.filter((fiber) => fiber && fiber.kind === kind).length;
    return counts;
  }, {});
  const inferredFiberKinds = prewarmFiberKinds.filter((kind) => fiberKindCounts[kind] > 0);
  const prewarmScheduleCount = schedules.filter((schedule) => {
    const id = String(schedule && schedule.id || '');
    const endpoint = String(schedule && schedule.endpointName || '');
    return id.includes('prewarm') || id.includes('prerender') || endpoint.includes('prewarm') || endpoint.includes('prerender');
  }).length;
  const sourceToSea = prewarmOperations.map((operation) => ({
    operation: operation.id || '',
    op: operation.op || '',
    target: operation.target && operation.target.ref || '',
    sourceRef: operation.sourceRef || null,
    schedulerEndpoint: fibers.find((fiber) => fiber && fiber.operation === operation.id) && fibers.find((fiber) => fiber && fiber.operation === operation.id).endpointName || null
  }));
  const active = prewarmOperations.length > 0 || warmHydrationRecords.length > 0 || inferredFiberKinds.length > 0 || prewarmScheduleCount > 0;

  return {
    schema: MARACA_WARM_REENTRY_REPORT_SCHEMA,
    ok: true,
    status: active ? 'planned' : 'available',
    enabled: active,
    supported: true,
    optional: true,
    runtimeExpectedStatus: active ? 'opportunistic' : 'idle',
    operationCount: prewarmOperations.length,
    hydrationRecordCount: warmHydrationRecords.length,
    scheduleCount: prewarmScheduleCount,
    fiberKindCounts,
    supportedFiberKinds: prewarmFiberKinds,
    observedFiberKinds: inferredFiberKinds,
    backpressurePolicy: {
      high: 'reduce-prewarm',
      critical: 'pause-prewarm',
      visibleWorkPriority: 'preserve-visible-and-user-blocking-work'
    },
    destroyInvalidation: {
      destroySurfaceInvalidatesPrewarm: true,
      destroySurfaceInvalidatesChunks: true,
      surfaceManagerMethods: ['registerSurfacePrewarmHandle', 'registerSurfaceChunkHandle'],
      cleanupSchema: 'xtend.surface.warm-reentry-invalidation.v1'
    },
    sourceToSea,
    diagnostics: [],
    summary: {
      active,
      operationCount: prewarmOperations.length,
      hydrationRecordCount: warmHydrationRecords.length,
      scheduleCount: prewarmScheduleCount,
      observedFiberKindCount: inferredFiberKinds.length,
      backpressureCriticalAction: 'pause-prewarm',
      destroyInvalidation: true
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
  const animationEngine = artifact && artifact.animationEngine
    || orchestrationPlan.artifact && orchestrationPlan.artifact.animationEngine
    || compileResult && compileResult.orchestrationArtifacts && compileResult.orchestrationArtifacts.animationEngine
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
  (Array.isArray(animationEngine && animationEngine.diagnostics) ? animationEngine.diagnostics : []).forEach((diagnostic) => {
    diagnostics.push(transitionDiagnostic(
      diagnostic.code || TRANSITION_STRICT_CODE,
      strict && diagnostic.severity !== 'info' ? 'error' : diagnostic.severity || 'warning',
      diagnostic.message || 'RMT animation engine diagnostic.',
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
    artifact: {
      ...artifact,
      animationEngine
    },
    runtimeModules: TRANSITION_RUNTIME_MODULES.slice(),
    diagnostics,
    summary: {
      schema: artifact.schema || null,
      animationEngineSchema: animationEngine && animationEngine.schema || null,
      animationCount: animationEngine && Array.isArray(animationEngine.animations) ? animationEngine.animations.length : 0,
      animationTransitionCount: animationEngine && Array.isArray(animationEngine.transitions) ? animationEngine.transitions.length : 0,
      timelineCount: animationEngine && Array.isArray(animationEngine.timelines) ? animationEngine.timelines.length : 0,
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

function resourceDisposesOnSurfaceDestroy(resource = {}) {
  const dispose = resource && resource.dispose;
  if (typeof dispose === 'string') return dispose === 'on surface.destroy';
  if (dispose && typeof dispose === 'object') {
    return dispose.text === 'on surface.destroy'
      || dispose.event === 'surface.destroy'
      || dispose.on === 'surface.destroy';
  }
  return false;
}

function createMaracaLifecycleReport(orchestrationPlan, kernelPlan, runtimeModules = [], options = {}) {
  const artifact = orchestrationPlan && orchestrationPlan.artifact || null;
  const surfaces = Array.isArray(artifact && artifact.surfaces) ? artifact.surfaces : [];
  const resources = Array.isArray(artifact && artifact.resources) ? artifact.resources : [];
  const diagnostics = [];
  const strict = Boolean(
    options && (options.orchestration === 'strict' || options.kernel === 'strict')
    || orchestrationPlan && orchestrationPlan.strict
    || kernelPlan && kernelPlan.strict
  );
  const surfaceDestroyReleaseRefs = surfaces.flatMap((surface) => (
    Array.isArray(surface && surface.resources) && surface.resources.length > 0
      ? surface.resources.map((resourceId) => ({ surfaceId: surface.id, resourceId }))
      : []
  ));
  const destroyOnCloseSurfaces = surfaces.filter((surface) => surface && (surface.destroyOnClose === true || surface.closeReleasesResources === true));
  const disposeOnDestroyResources = resources.filter(resourceDisposesOnSurfaceDestroy);
  const requiresDestroyChain = surfaceDestroyReleaseRefs.length > 0
    || destroyOnCloseSurfaces.length > 0
    || disposeOnDestroyResources.length > 0;
  const runtimeModuleSet = new Set(runtimeModules);
  const hasSurfaceRuntime = runtimeModuleSet.has('xtendrmt/rmt-surface-resource-graph-runtime.js');
  const hasKernelRuntime = Boolean(kernelPlan && kernelPlan.enabled && runtimeModuleSet.has('xtendrmt/rmt-runtime.esm.js'));
  const hasSurfaceAdapterDestroy = runtimeModuleSet.has('xtendrmt/rmt-runtime.esm.js')
    || runtimeModuleSet.has('xtendrmt/rmt-core.esm.js');
  const supportedOperations = [
    'closeSurface',
    'destroySurface',
    'snapshotSurfaces(includeDestroyed)',
    'surface.destroy',
    'resource.release',
    'disposeRoot'
  ];

  if (requiresDestroyChain && !hasSurfaceRuntime) {
    diagnostics.push(orchestrationDiagnostic(
      'xtend.maraca.lifecycle_surface_runtime_missing',
      strict ? 'error' : 'warning',
      'Maraca lifecycle destroy/release contracts require the surface resource graph runtime.',
      { requiredBy: 'surface.destroy' }
    ));
  }
  if (requiresDestroyChain && !hasSurfaceAdapterDestroy) {
    diagnostics.push(orchestrationDiagnostic(
      'xtend.maraca.lifecycle_destroy_adapter_missing',
      strict ? 'error' : 'warning',
      'Maraca lifecycle destroy/release contracts require an RMT surface adapter with destroySurface().',
      { requiredBy: 'destroySurface' }
    ));
  }

  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  return {
    schema: MARACA_LIFECYCLE_REPORT_SCHEMA,
    ok: !hasErrors,
    status: hasErrors ? 'blocked' : (requiresDestroyChain ? 'enforced' : 'ready'),
    strict,
    runtimeExpectedStatus: requiresDestroyChain ? 'booted' : 'optional',
    supportedOperations,
    requiresDestroyChain,
    surfaceDestroyReleaseCount: surfaceDestroyReleaseRefs.length,
    disposeOnSurfaceDestroyResourceCount: disposeOnDestroyResources.length,
    destroyOnCloseSurfaceCount: destroyOnCloseSurfaces.length,
    sourceToSea: {
      surfaceCount: surfaces.length,
      resourceCount: resources.length,
      kernelScheduled: Boolean(kernelPlan && kernelPlan.enabled),
      hasKernelRuntime,
      hasSurfaceRuntime,
      hasSurfaceAdapterDestroy
    },
    diagnostics
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

function cssSourceRecord(sourcePath, rootDir, kind = 'content') {
  const absolutePath = path.resolve(rootDir, sourcePath);
  const relative = path.relative(rootDir, absolutePath);
  const insideRoot = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  let sourceFingerprint = null;
  if (insideRoot && fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
    sourceFingerprint = hashText(fs.readFileSync(absolutePath));
  }
  return {
    path: repoRelative(absolutePath, rootDir),
    kind,
    fingerprint: sourceFingerprint
  };
}

function resolveCssProvider(normalized) {
  const diagnostics = [];
  let requestedProvider = normalized.cssProvider;
  let resolvedProvider = requestedProvider;
  let implementation = normalized.cssProviderImplementation;
  if (requestedProvider === 'tailwind' && !implementation) {
    const localAdapterPath = path.join(normalized.rootDir, 'xtend-maraca-css-tailwind');
    try {
      const adapter = fs.existsSync(path.join(localAdapterPath, 'index.js'))
        ? require(localAdapterPath)
        : require('@xtend-material/maraca-tailwind');
      implementation = adapter.createTailwindCssProvider({ rootDir: normalized.rootDir });
    } catch (error) {
      diagnostics.push({
        code: CSS_PROVIDER_UNAVAILABLE_CODE,
        severity: 'error',
        message: `Tailwind CSS provider could not load its local toolchain: ${error && error.message || 'unknown error'}`,
        requestedProvider
      });
    }
  }
  if (requestedProvider === DEFAULT_CSS_PROVIDER) {
    implementation = createNativeMaracaCssProvider();
  } else if (!implementation || !implementation.contract || implementation.contract.id !== requestedProvider) {
    if (normalized.cssProviderFallback === 'native') {
      diagnostics.splice(0, diagnostics.length);
      resolvedProvider = DEFAULT_CSS_PROVIDER;
      implementation = createNativeMaracaCssProvider();
      diagnostics.push({
        code: 'xtend.maraca.css_provider.fallback',
        severity: 'warning',
        message: `CSS provider ${requestedProvider} is unavailable; explicit fallback maraca-native is active.`,
        requestedProvider,
        resolvedProvider
      });
    } else {
      implementation = null;
      if (!diagnostics.some((entry) => entry.code === CSS_PROVIDER_UNAVAILABLE_CODE)) diagnostics.push({
        code: CSS_PROVIDER_UNAVAILABLE_CODE,
        severity: 'error',
        message: `CSS provider ${requestedProvider} is unavailable and no explicit fallback is configured.`,
        requestedProvider
      });
    }
  }
  const validation = implementation ? validateCssProvider(implementation) : null;
  if (validation && !validation.ok) diagnostics.push(...validation.diagnostics);
  return {
    requestedProvider,
    resolvedProvider,
    implementation,
    contract: validation && validation.contract || null,
    diagnostics
  };
}

function createMaracaCssBuildPlan(normalized, sourceText = null) {
  const resolution = resolveCssProvider(normalized);
  const sourceRecords = [];
  const seen = new Set();
  const addSource = (record) => {
    if (!record || !record.path || seen.has(record.path)) return;
    seen.add(record.path);
    sourceRecords.push(record);
  };
  addSource({
    path: repoRelative(normalized.sourcePath, normalized.rootDir),
    kind: 'rmt',
    fingerprint: typeof sourceText === 'string'
      ? hashText(sourceText)
      : (fs.existsSync(normalized.sourcePath) ? hashText(fs.readFileSync(normalized.sourcePath)) : null)
  });
  normalized.cssSources.forEach((entry) => addSource(cssSourceRecord(entry, normalized.rootDir)));
  if (normalized.cssInput) addSource(cssSourceRecord(normalized.cssInput, normalized.rootDir, 'css-input'));
  const request = createCssBuildRequest({
    provider: resolution.resolvedProvider,
    mode: normalized.css,
    input: normalized.cssInput,
    output: normalized.css === 'external' ? 'xtend.maraca.css' : null,
    profile: normalized.profile,
    minify: normalized.profile !== 'debug',
    strict: normalized.cssProviderFallback === 'none',
    sources: sourceRecords,
    sourcePolicy: {
      root: repoRelative(normalized.rootDir, normalized.rootDir),
      allow: sourceRecords.map((entry) => entry.path),
      deny: [],
      automaticDiscovery: normalized.cssPreflight === 'enabled'
    },
    metadata: {
      requestedProvider: resolution.requestedProvider,
      preflight: normalized.cssPreflight,
      cssBudget: normalized.cssBudget
    }
  });
  const requestValidation = validateCssBuildRequest(request);
  const diagnostics = resolution.diagnostics.concat(requestValidation.diagnostics);
  return {
    schema: MARACA_CSS_BUILD_PLAN_SCHEMA,
    status: diagnostics.some((entry) => entry.severity === 'error') ? 'blocked' : 'ready',
    requestedProvider: resolution.requestedProvider,
    resolvedProvider: resolution.resolvedProvider,
    fallback: normalized.cssProviderFallback,
    preflight: normalized.cssPreflight,
    budgetBytes: normalized.cssBudget,
    contract: resolution.contract,
    request,
    requestFingerprint: request.fingerprint,
    configFingerprint: hashText(stableJson({
      provider: resolution.resolvedProvider,
      fallback: normalized.cssProviderFallback,
      input: normalized.cssInput,
      sources: sourceRecords,
      preflight: normalized.cssPreflight,
      budgetBytes: normalized.cssBudget,
      mode: normalized.css
    })),
    evidence: null,
    diagnostics
  };
}

function enrichTailwindCssBuildPlan(cssBuild, normalized, sourceText, descriptors) {
  if (!cssBuild || cssBuild.resolvedProvider !== 'tailwind') return cssBuild;
  try {
    const localAdapterPath = path.join(normalized.rootDir, 'xtend-maraca-css-tailwind');
    const inventoryApi = fs.existsSync(path.join(localAdapterPath, 'source-inventory.js'))
      ? require(path.join(localAdapterPath, 'source-inventory.js'))
      : require('@xtend-material/maraca-tailwind/source-inventory');
    const sourceDiagnostics = [];
    if (normalized.cssPreflight !== 'disabled') sourceDiagnostics.push({
      code: CSS_PROVIDER_SOURCE_BLOCKED_CODE,
      severity: 'error',
      message: `XTend Material Tailwind requires disabled Preflight; received ${normalized.cssPreflight}.`,
      repairHint: 'Set cssPreflight to disabled and author only semantic xtm-* recipes.'
    });
    const sources = normalized.cssSources.map((sourcePath) => {
      const absolutePath = path.resolve(normalized.rootDir, sourcePath);
      const relative = path.relative(normalized.rootDir, absolutePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        sourceDiagnostics.push({
          code: 'rmt.css.utility.source_outside_policy',
          severity: 'error',
          message: `CSS source is outside the explicit Maraca root: ${sourcePath}`,
          source: { file: sourcePath, line: null, column: null },
          repairHint: 'Move the source below the application root and reference it explicitly with cssSources.'
        });
        return null;
      }
      return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()
        ? { path: repoRelative(absolutePath, normalized.rootDir), content: fs.readFileSync(absolutePath, 'utf8') }
        : null;
    }).filter(Boolean);
    const inventory = inventoryApi.createRmtCssSourceInventory({
      sourceText,
      filePath: repoRelative(normalized.sourcePath, normalized.rootDir),
      sources,
      descriptors,
      diagnostics: sourceDiagnostics
    });
    const request = createCssBuildRequest({
      ...cssBuild.request,
      metadata: {
        ...cssBuild.request.metadata,
        candidates: inventory.candidates,
        cssInventory: inventory
      }
    });
    return {
      ...cssBuild,
      status: inventory.ok ? cssBuild.status : 'blocked',
      request,
      requestFingerprint: request.fingerprint,
      configFingerprint: hashText(stableJson({ base: cssBuild.configFingerprint, inventoryFingerprint: inventory.fingerprint })),
      inventory,
      diagnostics: cssBuild.diagnostics.concat(inventory.diagnostics)
    };
  } catch (error) {
    const diagnostic = {
      code: CSS_PROVIDER_UNAVAILABLE_CODE,
      severity: 'error',
      message: `Tailwind source inventory is unavailable: ${error && error.message || 'unknown error'}`
    };
    return { ...cssBuild, status: 'blocked', diagnostics: cssBuild.diagnostics.concat(diagnostic) };
  }
}

function createMaracaBuildPlan(input = {}, options = {}) {
  const normalized = normalizeOptions(input, options);
  const diagnostics = normalized.buildConfigDiagnostics.slice();
  const initialCssBuild = createMaracaCssBuildPlan(normalized, normalized.sourceText);
  diagnostics.push(...initialCssBuild.diagnostics);

  if (typeof normalized.sourceText !== 'string' && !fs.existsSync(normalized.sourcePath)) {
    const templateArtifacts = createMaracaTemplateArtifactsReport({
      rootDir: normalized.rootDir,
      status: 'source_missing'
    });
    const performance = createMaracaPerformanceReport({
      rootDir: normalized.rootDir,
      status: 'source_missing'
    });
    const webAppManifest = createMaracaWebAppManifestPlan(normalized);
    const pwa = createMaracaPwaServiceWorkerPlan({
      ...normalized,
      webAppManifestPlan: webAppManifest
    });
    return {
      schema: MARACA_BUILD_PLAN_SCHEMA,
      ok: false,
      status: 'source_missing',
      configFingerprint: normalized.configFingerprint,
      source: normalized.source,
      sourcePath: normalized.sourcePath,
      rootDir: normalized.rootDir,
      profile: normalized.profile,
      lazy: normalized.lazy,
      css: normalized.css,
      cssBuild: initialCssBuild,
      vendor: normalized.vendor,
      componentMode: normalized.componentMode,
      stackMode: normalized.stackMode,
      orchestrationMode: normalized.orchestration,
      kernelMode: normalized.kernel,
      kernelBootMode: normalized.kernelBootMode,
      hydrationMode: normalized.hydration,
      validationMode: normalized.validation,
      transitionsMode: normalized.transitions,
      sizeBudgetMode: normalized.sizeBudget,
      enablePrewarmWorker: normalized.enablePrewarmWorker,
      enableUiCoprocessor: normalized.enableUiCoprocessor,
      webAppManifest,
      pwa,
      outputDir: normalized.outputDir,
      diagnostics: diagnostics.concat({
        code: 'xtend.maraca.source_missing',
        severity: 'error',
        message: `RMT source not found: ${normalized.sourcePath}`
      }),
      toolchain: getMaracaToolchainAvailability(normalized.rootDir),
      components: { requiredTags: [], selected: [], unknown: [] },
      surfaces: [],
      events: [],
      lanes: [],
      runtimeModules: [],
      stackModules: [],
      orchestration: createBaseOrchestrationPlan(normalized.orchestration, 'unavailable', 'RMT source file is missing.'),
      templateArtifacts,
      performance,
      kernel: createBaseKernelPlan(normalized.kernel, 'unavailable', 'RMT source file is missing.', {
        ...normalized,
        templateArtifacts,
        performance
      }),
      hydration: createBaseHydrationPlan(normalized.hydration, 'unavailable', 'RMT source file is missing.'),
      warmReentry: createMaracaWarmReentryReport(null, null, null, null, normalized),
      uiCoprocessor: createMaracaUiCoprocessorPlan(null, null, createBaseHydrationPlan(normalized.hydration, 'unavailable', 'RMT source file is missing.'), createMaracaWarmReentryReport(null, null, null, null, normalized), {
        ...normalized,
        pwaPlan: pwa
      }),
      validation: createBaseValidationPlan(normalized.validation, 'unavailable', 'RMT source file is missing.'),
      transitions: createBaseTransitionPlan(normalized.transitions, 'unavailable', 'RMT source file is missing.'),
      lifecycle: createMaracaLifecycleReport(null, null, [], normalized),
      publicNameReservations: Array.from(PUBLIC_NAME_RESERVATIONS)
    };
  }

  const { sourceText, compileResult } = compileSource(normalized);
  if (!compileResult.ok || !compileResult.coreDocument) {
    const compilerDiagnostics = Array.isArray(compileResult.diagnostics) ? compileResult.diagnostics : [];
    const templateArtifacts = createMaracaTemplateArtifactsReport({
      ...normalized,
      sourceText,
      compileResult,
      status: 'compile_failed'
    });
    const performance = createMaracaPerformanceReport({
      ...normalized,
      sourceText,
      compileResult,
      status: 'compile_failed'
    });
    const webAppManifest = createMaracaWebAppManifestPlan(normalized);
    const pwa = createMaracaPwaServiceWorkerPlan({
      ...normalized,
      webAppManifestPlan: webAppManifest
    });
    return {
      schema: MARACA_BUILD_PLAN_SCHEMA,
      ok: false,
      status: 'compile_failed',
      configFingerprint: normalized.configFingerprint,
      source: repoRelative(normalized.sourcePath, normalized.rootDir),
      sourcePath: normalized.sourcePath,
      rootDir: normalized.rootDir,
      sourceHash: hashText(sourceText),
      profile: normalized.profile,
      lazy: normalized.lazy,
      css: normalized.css,
      cssBuild: initialCssBuild,
      vendor: normalized.vendor,
      componentMode: normalized.componentMode,
      stackMode: normalized.stackMode,
      orchestrationMode: normalized.orchestration,
      kernelMode: normalized.kernel,
      kernelBootMode: normalized.kernelBootMode,
      hydrationMode: normalized.hydration,
      validationMode: normalized.validation,
      transitionsMode: normalized.transitions,
      sizeBudgetMode: normalized.sizeBudget,
      enablePrewarmWorker: normalized.enablePrewarmWorker,
      enableUiCoprocessor: normalized.enableUiCoprocessor,
      webAppManifest,
      pwa,
      outputDir: normalized.outputDir,
      diagnostics: diagnostics.concat({
        code: COMPILER_ERROR_CODE,
        severity: 'error',
        message: 'RMT vNext compiler did not produce a Core document.'
      }, compilerDiagnostics),
      toolchain: getMaracaToolchainAvailability(normalized.rootDir),
      components: { requiredTags: [], selected: [], unknown: [] },
      surfaces: [],
      events: [],
      lanes: [],
      runtimeModules: [],
      stackModules: [],
      orchestration: createBaseOrchestrationPlan(normalized.orchestration, 'unavailable', 'RMT source did not compile.'),
      templateArtifacts,
      performance,
      kernel: createBaseKernelPlan(normalized.kernel, 'unavailable', 'RMT source did not compile.', {
        ...normalized,
        templateArtifacts,
        performance
      }),
      hydration: createBaseHydrationPlan(normalized.hydration, 'unavailable', 'RMT source did not compile.'),
      warmReentry: createMaracaWarmReentryReport(compileResult, null, null, null, normalized),
      uiCoprocessor: createMaracaUiCoprocessorPlan(compileResult, null, createBaseHydrationPlan(normalized.hydration, 'unavailable', 'RMT source did not compile.'), createMaracaWarmReentryReport(compileResult, null, null, null, normalized), {
        ...normalized,
        pwaPlan: pwa
      }),
      validation: createBaseValidationPlan(normalized.validation, 'unavailable', 'RMT source did not compile.'),
      transitions: createBaseTransitionPlan(normalized.transitions, 'unavailable', 'RMT source did not compile.'),
      lifecycle: createMaracaLifecycleReport(null, null, [], normalized),
      publicNameReservations: Array.from(PUBLIC_NAME_RESERVATIONS)
    };
  }

  const coreDocument = compileResult.coreDocument;
  const templateArtifacts = createMaracaTemplateArtifactsReport({
    ...normalized,
    sourceText,
    compileResult,
    coreDocument
  });
  const performance = createMaracaPerformanceReport({
    ...normalized,
    sourceText,
    compileResult,
    coreDocument
  });
  const componentManifest = loadComponentManifest(normalized.rootDir);
  const surfaces = collectSurfaces(coreDocument);
  const renderDescriptors = compileResult.orchestrationArtifacts
    && compileResult.orchestrationArtifacts.render
    && compileResult.orchestrationArtifacts.render.descriptors || [];
  const cssBuild = enrichTailwindCssBuildPlan(initialCssBuild, normalized, sourceText, renderDescriptors);
  diagnostics.push(...cssBuild.diagnostics.filter((entry) => !initialCssBuild.diagnostics.includes(entry)));
  const descriptorTags = Array.from(collectBuildDescriptorTags(renderDescriptors))
    .filter((tag) => componentManifest.byTag.has(tag) || isNativeMaracaComponentTag(tag));
  const requiredTags = Array.from(new Set(collectRequestedTags(surfaces, componentManifest, normalized).concat(descriptorTags))).sort();
  const componentRecords = createComponentRecords(requiredTags, componentManifest, normalized);
  diagnostics.push(...componentRecords.diagnostics);

  let runtimeModules = buildRuntimeModuleList(coreDocument);
  const orchestration = createMaracaOrchestrationPlan(compileResult, coreDocument, componentRecords, normalized);
  if (orchestration.enabled) {
    runtimeModules = Array.from(new Set(runtimeModules.concat(ORCHESTRATION_RUNTIME_MODULES))).sort();
  }
  const kernel = createMaracaKernelPlan(compileResult, orchestration, {
    ...normalized,
    templateArtifacts,
    performance
  });
  if (kernel.enabled) {
    runtimeModules = Array.from(new Set(runtimeModules.concat(KERNEL_RUNTIME_MODULES))).sort();
  }
  const hydration = createMaracaHydrationPlan(compileResult, orchestration, kernel, normalized);
  const warmReentry = createMaracaWarmReentryReport(compileResult, coreDocument, hydration, kernel, normalized);
  const webAppManifest = createMaracaWebAppManifestPlan(normalized);
  const pwa = createMaracaPwaServiceWorkerPlan({
    ...normalized,
    webAppManifestPlan: webAppManifest
  });
  const uiCoprocessor = createMaracaUiCoprocessorPlan(compileResult, kernel, hydration, warmReentry, {
    ...normalized,
    pwaPlan: pwa
  });
  const validation = createMaracaValidationPlan(compileResult, orchestration, kernel, normalized);
  if (validation.enabled) {
    runtimeModules = Array.from(new Set(runtimeModules.concat(VALIDATION_RUNTIME_MODULES))).sort();
  }
  const transitions = createMaracaTransitionPlan(compileResult, orchestration, kernel, normalized);
  if (transitions.enabled) {
    runtimeModules = Array.from(new Set(runtimeModules.concat(TRANSITION_RUNTIME_MODULES))).sort();
  }
  const lifecycle = createMaracaLifecycleReport(orchestration, kernel, runtimeModules, normalized);
  const services = createMaracaServiceBuildPlan({
    services: normalized.services,
    demands: compileResult.appServiceDemands || null,
    rootDir: normalized.rootDir,
    outputDir: normalized.outputDir
  });
  diagnostics.push(...orchestration.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  diagnostics.push(...kernel.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  diagnostics.push(...hydration.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  diagnostics.push(...uiCoprocessor.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  diagnostics.push(...validation.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  diagnostics.push(...transitions.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  diagnostics.push(...lifecycle.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  diagnostics.push(...services.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
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
    configFingerprint: normalized.configFingerprint,
    source: repoRelative(normalized.sourcePath, normalized.rootDir),
    sourcePath: normalized.sourcePath,
    rootDir: normalized.rootDir,
    sourceHash: hashText(sourceText),
    profile: normalized.profile,
    lazy: normalized.lazy,
    css: normalized.css,
    cssBuild,
    vendor: normalized.vendor,
    componentMode: normalized.componentMode,
    stackMode: normalized.stackMode,
    orchestrationMode: normalized.orchestration,
    kernelMode: normalized.kernel,
    kernelBootMode: normalized.kernelBootMode,
    hydrationMode: normalized.hydration,
    validationMode: normalized.validation,
    transitionsMode: normalized.transitions,
    sizeBudgetMode: normalized.sizeBudget,
    enablePrewarmWorker: normalized.enablePrewarmWorker,
    enableUiCoprocessor: normalized.enableUiCoprocessor,
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
    templateArtifacts,
    performance,
    kernelFeatureAdoption: kernel.featureAdoption,
    policyParity: kernel.policyParity,
    panicRecovery: kernel.panicRecovery,
    kernel,
    hydration,
    warmReentry,
    uiCoprocessor,
    webAppManifest,
    pwa,
    validation,
    transitions,
    lifecycle,
    services,
    serviceGraphFingerprint: services.fingerprint || services.demands && services.demands.fingerprint || null,
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
      host: path.join(normalized.outputDir, 'index.html'),
      entry: path.join(normalized.outputDir, 'xtend.maraca.mjs'),
      css: normalized.css === 'external' ? path.join(normalized.outputDir, 'xtend.maraca.css') : null,
      bundleReport: path.join(normalized.outputDir, 'xtend.maraca.report.json'),
      sizeBudgetReport: path.join(normalized.outputDir, 'xtend.maraca.size.json'),
      webAppManifestReport: webAppManifest.outputs.report,
      webAppManifest: webAppManifest.outputs.manifest,
      webAppManifestIconDirectory: webAppManifest.outputs.iconDirectory,
      pwaReport: pwa.outputs.report,
      pwaManifest: pwa.outputs.manifest,
      serviceWorker: pwa.outputs.serviceWorker,
      offlineFallback: pwa.outputs.offlineFallback,
      serviceManifest: services.outputs.manifest || null,
      serviceDeclarations: services.outputs.declarations || null,
      serverServices: services.outputs.serverEntry || null,
      phpServicesReport: services.outputs.phpReport || null
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

function escapeMaracaHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;');
}

function createMaracaHtmlHost(plan) {
  const documentId = plan && plan.rmt && plan.rmt.documentId;
  const title = escapeMaracaHtml(documentId || 'XTend Maraca App');
  const cssLink = plan.css === 'external'
    ? '  <link rel="stylesheet" data-maraca-style="external" href="./xtend.maraca.css">\n'
    : '';
  const manifestLink = plan.webAppManifest && plan.webAppManifest.enabled
    ? `  <link rel="manifest" href="${escapeMaracaHtml(plan.webAppManifest.manifestRef || './xtend.webmanifest')}">\n`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
${manifestLink}${cssLink}</head>
<body data-xtend-maraca-host>
  <main id="xtend-maraca-root" data-maraca-root aria-label="${title}"></main>
  <noscript>This XTend Maraca application requires JavaScript.</noscript>
  <script type="module" src="./xtend.maraca.mjs"></script>
</body>
</html>`;
}

function writeMaracaHtmlHost(plan) {
  const content = `${createMaracaHtmlHost(plan)}\n`;
  fs.writeFileSync(plan.outputs.host, content, 'utf8');
  return {
    type: 'asset',
    fileName: path.basename(plan.outputs.host),
    path: plan.outputs.host,
    bytes: Buffer.byteLength(content),
    isEntry: false,
    isDynamicEntry: false,
    imports: [],
    dynamicImports: []
  };
}

function cssLength(value) {
  return Number.isFinite(value) ? `${Math.max(0, value)}px` : null;
}

function createCssText(plan = null) {
  const rules = [
    ':where([data-maraca-root]){display:grid;gap:12px;align-content:start;font-family:system-ui,sans-serif;}',
    ':where([data-maraca-surface]){box-sizing:border-box;}',
    ':where([data-maraca-surface][data-xt-surface-transitioning]){will-change:opacity,transform,filter;}'
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
  const cssInput = plan && plan.cssBuild && plan.cssBuild.request && plan.cssBuild.request.input;
  if (cssInput && plan.rootDir) {
    const inputPath = path.resolve(plan.rootDir, cssInput);
    const relative = path.relative(plan.rootDir, inputPath);
    const insideRoot = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
    if (insideRoot && fs.existsSync(inputPath) && fs.statSync(inputPath).isFile()) {
      rules.push(fs.readFileSync(inputPath, 'utf8'));
    }
  }
  return rules.join('');
}

async function invokeMaracaComponentCommand(root, commandRecord, options = {}) {
  const commandSchema = 'xtend.rmt.component-command.v1';
  const resultSchema = 'xtend.maraca.component-command-result.v1';
  if (!commandRecord || commandRecord.schema !== commandSchema) {
    throw new Error(`XTend Maraca component command requires schema ${commandSchema}.`);
  }
  const command = String(commandRecord.command || '').trim();
  if (command !== 'focus' && command !== 'reset' && command !== 'snapshot') {
    throw new Error(`XTend Maraca component command ${command || '(missing)'} is not allowed.`);
  }
  const target = commandRecord.target && typeof commandRecord.target === 'object'
    ? commandRecord.target
    : null;
  const surfaceId = target && String(target.id || '').trim();
  const component = target && String(target.component || '').trim().toLowerCase();
  if (!target || target.kind !== 'surface' || !surfaceId || !component) {
    throw new Error('XTend Maraca component command requires a statically compiled surface target.');
  }
  if (typeof options.ensureComponent === 'function') {
    await options.ensureComponent(component);
  }
  const matchesSurface = (candidate) => Boolean(
    candidate
      && typeof candidate.getAttribute === 'function'
      && candidate.getAttribute('data-maraca-surface') === surfaceId
  );
  let element = matchesSurface(root) ? root : null;
  if (!element && root && typeof root.querySelectorAll === 'function') {
    const candidates = Array.from(root.querySelectorAll('[data-maraca-surface]') || []);
    element = candidates.find(matchesSurface) || null;
  }
  if (!element) {
    throw new Error(`XTend Maraca component command surface ${surfaceId} is not materialized inside the orchestration root.`);
  }
  const localName = String(element.localName || '').trim().toLowerCase();
  const declaredComponent = typeof element.getAttribute === 'function'
    ? String(element.getAttribute('data-rmt-component') || '').trim().toLowerCase()
    : '';
  if (localName !== component && declaredComponent !== component) {
    throw new Error(`XTend Maraca component command surface ${surfaceId} is not the compiled ${component} component.`);
  }
  let result = null;
  if (command === 'focus') {
    if (typeof element.focus !== 'function') throw new Error(`XTend Maraca component ${component} does not expose focus().`);
    element.focus();
  } else if (command === 'reset') {
    if (typeof element.reset !== 'function') throw new Error(`XTend Maraca component ${component} does not expose reset().`);
    element.reset();
  } else {
    if (typeof element.snapshot !== 'function') throw new Error(`XTend Maraca component ${component} does not expose snapshot().`);
    result = await element.snapshot();
    if (result && typeof result === 'object') result = JSON.parse(JSON.stringify(result));
  }
  return {
    schema: resultSchema,
    command,
    surfaceId,
    component,
    result
  };
}

function createBundleSource(plan, providerCssText = null) {
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
    bootMode: plan.kernel.bootMode || 'direct',
    strict: plan.kernel.strict,
    status: plan.kernel.status,
    schema: plan.kernel.artifact && plan.kernel.artifact.schema,
    artifact: plan.kernel.artifact,
    diagnostics: plan.kernel.diagnostics,
    summary: plan.kernel.summary,
    runtimeModules: plan.kernel.runtimeModules,
    featureAdoption: plan.kernel.featureAdoption,
    productSurface: plan.kernel.productSurface,
    prewarmWorker: plan.kernel.prewarmWorker,
    panicRecovery: plan.kernel.panicRecovery,
    trustedDom: plan.kernel.trustedDom,
    policyParity: plan.kernel.policyParity,
    security: plan.kernel.security,
    performance: plan.performance || null
  } : {
    enabled: false,
    mode: plan.kernel && plan.kernel.mode || 'auto',
    bootMode: plan.kernel && plan.kernel.bootMode || 'direct',
    strict: false,
    status: plan.kernel && plan.kernel.status || 'disabled',
    schema: null,
    artifact: null,
    diagnostics: plan.kernel && plan.kernel.diagnostics || [],
    summary: plan.kernel && plan.kernel.summary || {},
    runtimeModules: plan.kernel && plan.kernel.runtimeModules || [],
    featureAdoption: plan.kernel && plan.kernel.featureAdoption || createMaracaKernelFeatureAdoptionReport({
      rootDir: plan.rootDir,
      enabled: false,
      runtimeModules: plan.kernel && plan.kernel.runtimeModules || []
    }),
    productSurface: plan.kernel && plan.kernel.productSurface || createMaracaKernelProductSurfaceReport({
      rootDir: plan.rootDir,
      bootMode: plan.kernel && plan.kernel.bootMode || 'direct'
    }),
    prewarmWorker: plan.kernel && plan.kernel.prewarmWorker || createMaracaPrewarmWorkerRuntimeReport(plan.kernel, plan),
    panicRecovery: plan.kernel && plan.kernel.panicRecovery || createMaracaPanicRecoveryReport({
      rootDir: plan.rootDir,
      enabled: false,
      runtimeModules: plan.kernel && plan.kernel.runtimeModules || []
    }),
    trustedDom: plan.kernel && plan.kernel.trustedDom || createMaracaTrustedDomReport({
      panicRecovery: plan.kernel && plan.kernel.panicRecovery || createMaracaPanicRecoveryReport({
        rootDir: plan.rootDir,
        enabled: false,
        runtimeModules: plan.kernel && plan.kernel.runtimeModules || []
      })
    }),
    policyParity: plan.kernel && plan.kernel.policyParity || createMaracaPolicyParityReport({
      rootDir: plan.rootDir,
      enabled: false,
      strict: false,
      runtimeModules: plan.kernel && plan.kernel.runtimeModules || []
    }),
    security: plan.kernel && plan.kernel.security || {
      schema: 'xtend.maraca.kernel-security-report.v1',
      supported: false,
      status: 'disabled',
      panicRecovery: plan.kernel && plan.kernel.panicRecovery || null,
      trustedDom: plan.kernel && plan.kernel.trustedDom || null,
      policyParity: plan.kernel && plan.kernel.policyParity || null,
      diagnostics: []
    },
    performance: plan.performance || null
  };
  const hydrationBundle = plan.hydration && plan.hydration.enabled ? {
    enabled: true,
    mode: plan.hydration.mode,
    strict: plan.hydration.strict,
    status: plan.hydration.status,
    schema: plan.hydration.artifact && plan.hydration.artifact.schema,
    artifact: plan.hydration.artifact,
    diagnostics: plan.hydration.diagnostics,
    workerPrerender: plan.hydration.workerPrerender || plan.hydration.summary && plan.hydration.summary.workerPrerender || null,
    uiCoprocessor: plan.hydration.uiCoprocessor || plan.hydration.summary && plan.hydration.summary.uiCoprocessor || null,
    serverPrerender: plan.hydration.serverPrerender || plan.hydration.summary && plan.hydration.summary.serverPrerender || null,
    summary: plan.hydration.summary
  } : {
    enabled: false,
    mode: plan.hydration && plan.hydration.mode || 'auto',
    strict: false,
    status: plan.hydration && plan.hydration.status || 'disabled',
    schema: null,
    artifact: null,
    diagnostics: plan.hydration && plan.hydration.diagnostics || [],
    workerPrerender: plan.hydration && (plan.hydration.workerPrerender || plan.hydration.summary && plan.hydration.summary.workerPrerender) || null,
    uiCoprocessor: plan.hydration && (plan.hydration.uiCoprocessor || plan.hydration.summary && plan.hydration.summary.uiCoprocessor) || null,
    serverPrerender: plan.hydration && (plan.hydration.serverPrerender || plan.hydration.summary && plan.hydration.summary.serverPrerender) || null,
    summary: plan.hydration && plan.hydration.summary || {}
  };
  const warmReentryBundle = plan.warmReentry || {
    schema: MARACA_WARM_REENTRY_REPORT_SCHEMA,
    ok: true,
    status: 'available',
    enabled: false,
    supported: true,
    optional: true,
    runtimeExpectedStatus: 'idle',
    diagnostics: [],
    summary: {}
  };
  const uiCoprocessorBundle = plan.uiCoprocessor || createMaracaUiCoprocessorPlan(null, kernelBundle, hydrationBundle, warmReentryBundle, plan);
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
  const lifecycleBundle = plan.lifecycle || {
    schema: MARACA_LIFECYCLE_REPORT_SCHEMA,
    ok: true,
    status: 'ready',
    strict: false,
    runtimeExpectedStatus: 'optional',
    supportedOperations: [],
    requiresDestroyChain: false,
    diagnostics: []
  };
  const webAppManifestBundle = plan.webAppManifest || createMaracaWebAppManifestPlan(plan);
  const pwaBundle = plan.pwa || createMaracaPwaServiceWorkerPlan({
    ...plan,
    webAppManifestPlan: webAppManifestBundle
  });
  const productionClosureBundle = createMaracaProductionBundleClosure(plan, null, {
    bundleFiles: [],
    repoRoot: plan.rootDir || path.dirname(path.dirname(__filename))
  });
  const appServicesBundle = plan.services && plan.services.enabled ? {
    enabled: true,
    strict: plan.services.strict !== false,
    status: plan.services.status,
    targets: plan.services.targets || [],
    transport: plan.services.transport || null,
    manifest: plan.services.manifest || null,
    fingerprint: plan.services.fingerprint || null
  } : {
    enabled: false,
    strict: false,
    status: 'disabled',
    targets: [],
    transport: null,
    manifest: null,
    fingerprint: null
  };
  const css = typeof providerCssText === 'string' ? providerCssText : createCssText(plan);
  const header = [
    `const MARACA_COMPONENTS = Object.freeze(${jsValue(componentEntries)});`,
    `const MARACA_SURFACES = Object.freeze(${jsValue(surfaces)});`,
    `const MARACA_STATE = Object.freeze(${jsValue(plan.state || {})});`,
    `const MARACA_EVENTS = Object.freeze(${jsValue(plan.events || [])});`,
    `const MARACA_ORCHESTRATION = Object.freeze(${jsValue(orchestrationBundle)});`,
    `const MARACA_KERNEL = Object.freeze(${jsValue(kernelBundle)});`,
    `const MARACA_HYDRATION = Object.freeze(${jsValue(hydrationBundle)});`,
    `const MARACA_WARM_REENTRY = Object.freeze(${jsValue(warmReentryBundle)});`,
    `const MARACA_UI_COPROCESSOR = Object.freeze(${jsValue(uiCoprocessorBundle)});`,
    `const MARACA_WEB_APP_MANIFEST = Object.freeze(${jsValue(webAppManifestBundle)});`,
    `const MARACA_PWA = Object.freeze(${jsValue(pwaBundle)});`,
    `const MARACA_VALIDATION = Object.freeze(${jsValue(validationBundle)});`,
    `const MARACA_TRANSITIONS = Object.freeze(${jsValue(transitionBundle)});`,
    `const MARACA_APP_SERVICES = Object.freeze(${jsValue(appServicesBundle)});`,
    `const MARACA_LIFECYCLE = Object.freeze(${jsValue(lifecycleBundle)});`,
    `const MARACA_PRODUCTION_CLOSURE = Object.freeze(${jsValue(productionClosureBundle)});`,
    `const MARACA_TEMPLATE_ARTIFACTS = Object.freeze(${jsValue(plan.templateArtifacts || null)});`,
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

  if (appServicesBundle.enabled && plan.services.entries && plan.services.entries.client && plan.services.entries.client.exists) {
    const runtimeModule = ensureRelativeImport(outDir, path.join(__dirname, 'app-services.mjs'));
    const clientModule = ensureRelativeImport(outDir, plan.services.entries.client.path);
    header.unshift(`import XTendMaracaAppServiceDefinition from ${JSON.stringify(clientModule)};`);
    header.unshift(`import { createAppServiceRegistry, createHttpAppServiceTransport } from ${JSON.stringify(runtimeModule)};`);
  } else {
    header.push('const XTendMaracaAppServiceDefinition = null;');
    header.push('const createAppServiceRegistry = null;');
    header.push('const createHttpAppServiceTransport = null;');
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
const MARACA_COMPONENT_COMMAND_SCHEMA = ${JSON.stringify(MARACA_COMPONENT_COMMAND_SCHEMA)};
const MARACA_COMPONENT_COMMAND_RESULT_SCHEMA = ${JSON.stringify(MARACA_COMPONENT_COMMAND_RESULT_SCHEMA)};

${invokeMaracaComponentCommand.toString()}

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
  setIfPresent("command");
  setIfPresent("required");
  setIfPresent("disabled");
  setIfPresent("readonly");
  setIfPresent("busy");
  setIfPresent("invalid");
  setIfPresent("rows");
  setIfPresent("density");
  setIfPresent("fill");
  setIfPresent("highlight");
  setIfPresent("lang");
  setIfPresent("language");
  setIfPresent("width");
  setIfPresent("height");
  setIfPresent("minlength", "minLength");
  setIfPresent("maxlength", "maxLength");
  setIfPresent("aria-label", "ariaLabel");
  setIfPresent("aria-busy", "ariaBusy");
  setIfPresent("icon-name", "iconName");
  setIfPresent("icon-pack", "iconPack");
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
    "collapsible",
    "collapsable",
    "closable",
    "pinnable",
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
    ["responsive-mode", "responsiveMode"],
    ["submit-command", "submitCommand"],
    ["submit-on-enter", "submitOnEnter"],
    ["syntax-highlight", "syntaxHighlight"],
    ["line-numbering", "lineNumbering"]
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

function collectElementComponentTags(element, target = new Set()) {
  if (!element || typeof element !== "object") return target;
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    const tag = String(node.localName || node.tagName || "").trim().toLowerCase();
    if (tag && tag.includes("-")) target.add(tag);
  };
  visit(element);
  if (typeof element.querySelectorAll === "function") {
    Array.from(element.querySelectorAll("*")).forEach(visit);
  }
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

function readServerPrerenderShellPayload() {
  if (typeof document === "undefined") return null;
  const payloadElement = document.getElementById("xtend-llm-ssr-hydration")
    || document.querySelector("[data-rmt-ssr-resume]")
    || document.querySelector("[data-rmt-ssr-hydration]");
  if (!payloadElement || typeof payloadElement.textContent !== "string") return null;
  try {
    return JSON.parse(payloadElement.textContent);
  } catch (error) {
    return {
      schema: "xtend.maraca.server-prerender-shell.v1",
      ok: false,
      status: "parse_failed",
      message: error && error.message ? error.message : String(error)
    };
  }
}

function adoptServerPrerenderShell(root) {
  if (!root || typeof root.querySelector !== "function") {
    return {
      schema: "xtend.maraca.server-prerender-shell.v1",
      active: false,
      status: "absent"
    };
  }
  const shell = root.getAttribute && root.getAttribute("data-rmt-resume-root") === "true"
    ? root
    : root.querySelector('[data-rmt-resume-root="true"], [data-maraca-ssr-shell]');
  const payload = readServerPrerenderShellPayload();
  if (!shell) {
    return {
      schema: "xtend.maraca.server-prerender-shell.v1",
      active: false,
      status: payload ? "payload_only" : "absent",
      payload
    };
  }
  const surfaceCount = typeof shell.querySelectorAll === "function"
    ? shell.querySelectorAll("[data-rmt-ssr-surface]").length
    : 0;
  const targets = String(shell.getAttribute("data-rmt-worker-prewarm-targets") || root.getAttribute("data-rmt-worker-prewarm-targets") || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const resumeEnvelope = payload && (payload.resume || payload.response && payload.response.resume || payload.schema === "xtend.rmt.ssr-resume-envelope.v1" && payload) || null;
  const executionMode = resumeEnvelope && resumeEnvelope.executionMode || payload && payload.executionMode || "server_prerender_hydrate";
  if (typeof root.setAttribute === "function") {
    root.setAttribute("data-rmt-ssr-preserved", "true");
    root.setAttribute("data-rmt-hydration-mode", executionMode);
  }
  return {
    schema: "xtend.maraca.server-prerender-shell.v1",
    active: true,
    status: "preserved",
    transport: "node-ssr",
    executionMode,
    resumeEnvelopeSchema: resumeEnvelope && resumeEnvelope.schema || null,
    resumeRootId: shell.getAttribute && shell.getAttribute("id") || null,
    surfaceCount,
    workerPrewarmTargets: targets,
    payload
  };
}

function dispatchMaracaEvent(name, detail) {
  if (typeof window === "undefined" || typeof CustomEvent !== "function") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function createMaracaAppServiceController(options = {}) {
  if (!MARACA_APP_SERVICES.enabled || !XTendMaracaAppServiceDefinition || typeof createAppServiceRegistry !== "function") {
    return Object.freeze({
      enabled: false,
      status: MARACA_APP_SERVICES.status,
      registry: null,
      hostServiceAdapters: options.hostServiceAdapters || options.serviceAdapters || {},
      dataSourceAdapters: options.dataSourceAdapters || {},
      diagnostics: [],
      dispose() { return false; },
      snapshot() {
        return { schema: "xtend.maraca.app-services-runtime.v1", enabled: false, status: MARACA_APP_SERVICES.status };
      }
    });
  }

  const diagnostics = [];
  const manifestServices = MARACA_APP_SERVICES.manifest && Array.isArray(MARACA_APP_SERVICES.manifest.services)
    ? MARACA_APP_SERVICES.manifest.services
    : [];
  const hasServerServices = manifestServices.some((entry) => entry && entry.target === "server");
  const transportConfig = MARACA_APP_SERVICES.transport || {};
  const httpTransport = hasServerServices && typeof createHttpAppServiceTransport === "function"
    ? createHttpAppServiceTransport({
        baseUrl: options.appServiceBaseUrl || options.serviceBaseUrl || "",
        pathPrefix: options.appServicePath || transportConfig.basePath || "/api/xtend/services",
        credentials: options.appServiceCredentials || transportConfig.credentials || "same-origin",
        headers: options.appServiceHeaders || options.serviceHeaders || {}
      })
    : null;
  const remoteSurfaceTransport = options.remoteSurfaceTransport || null;
  const transport = Object.freeze({
    async invoke(request) {
      if (request && request.target === "remote-surface") {
        if (!remoteSurfaceTransport || typeof remoteSurfaceTransport.invoke !== "function") {
          throw new Error("Remote-surface AppService requires an accepted XScaler transport.");
        }
        return remoteSurfaceTransport.invoke(request);
      }
      if (!httpTransport) throw new Error("HTTP AppService transport is not configured.");
      return httpTransport.invoke(request);
    },
    stream(request) {
      if (request && request.target === "remote-surface") {
        if (!remoteSurfaceTransport || typeof remoteSurfaceTransport.stream !== "function") {
          throw new Error("Remote-surface stream requires an accepted XScaler transport.");
        }
        return remoteSurfaceTransport.stream(request);
      }
      if (!httpTransport) throw new Error("HTTP AppService stream transport is not configured.");
      return httpTransport.stream(request);
    },
    dispose(reason) {
      if (httpTransport && typeof httpTransport.dispose === "function") httpTransport.dispose(reason);
      if (remoteSurfaceTransport && typeof remoteSurfaceTransport.dispose === "function") remoteSurfaceTransport.dispose(reason);
    }
  });
  const registry = createAppServiceRegistry(XTendMaracaAppServiceDefinition, {
    transport,
    disposeTransport: true,
    manifest: MARACA_APP_SERVICES.manifest,
    inputPolicyPhase: "browser"
  });

  function invocationContext(context = {}) {
    return {
      signal: context.signal || null,
      correlationId: context.correlationId || context.commandEnvelope && context.commandEnvelope.correlationId || null,
      action: context.action || null,
      effect: context.effect || null,
      dataSource: context.dataSource || null
    };
  }

  function adapterFor(serviceId) {
    return Object.freeze({
      invoke(request = {}) {
        return registry.invoke(serviceId, request.payload, invocationContext(request.context || {}));
      },
      stream(request = {}, handlers = {}) {
        return registry.stream(serviceId, request.payload, handlers, invocationContext(request.context || {}));
      },
      subscribe(request = {}, handlers = {}) {
        const stream = registry.stream(serviceId, request.payload, handlers, invocationContext(request.context || {}));
        return Object.freeze({
          id: stream.id,
          cancel: stream.cancel,
          unsubscribe: stream.cancel
        });
      }
    });
  }

  const generatedHostServiceAdapters = {};
  manifestServices.forEach((entry) => {
    if (entry && entry.id) generatedHostServiceAdapters[entry.id] = adapterFor(entry.id);
  });
  const generatedDataSourceAdapter = Object.freeze({
    invoke(request = {}) {
      const source = request.source || {};
      const serviceId = source.endpoint || source.service || (source.adapter && source.adapter !== "host" ? source.adapter : "") || source.id;
      return registry.invoke(serviceId, request.payload, invocationContext(request.context || {}));
    }
  });

  function reportCollision(kind, id) {
    const diagnostic = {
      schema: "xtend.maraca.diagnostic.v1",
      code: "xtend.maraca.app_services.manual_adapter_collision",
      severity: MARACA_APP_SERVICES.strict ? "error" : "warning",
      message: "Manual " + kind + " adapter collides with generated AppService " + id + ".",
      details: { kind, id, winner: MARACA_APP_SERVICES.strict ? "none" : "manual" }
    };
    diagnostics.push(diagnostic);
    dispatchMaracaEvent("xtend-maraca:diagnostic", diagnostic);
    if (MARACA_APP_SERVICES.strict) throw new Error(diagnostic.message);
  }

  const manualHostServiceAdapters = options.hostServiceAdapters || options.serviceAdapters || {};
  Object.keys(manualHostServiceAdapters).forEach((id) => {
    if (Object.prototype.hasOwnProperty.call(generatedHostServiceAdapters, id)) reportCollision("host-service", id);
  });
  const manualDataSourceAdapters = options.dataSourceAdapters || {};
  if (manualDataSourceAdapters.host && manifestServices.length > 0) reportCollision("host-datasource", "host");

  const hostServiceAdapters = Object.freeze({ ...generatedHostServiceAdapters, ...manualHostServiceAdapters });
  const dataSourceAdapters = Object.freeze({ host: generatedDataSourceAdapter, ...manualDataSourceAdapters });
  return Object.freeze({
    enabled: true,
    status: "ready",
    registry,
    hostServiceAdapters,
    dataSourceAdapters,
    diagnostics,
    dispose(reason = "XTend Maraca app disposed.") {
      return registry.dispose(reason);
    },
    snapshot() {
      return {
        schema: "xtend.maraca.app-services-runtime.v1",
        enabled: true,
        status: registry.disposed ? "disposed" : "ready",
        serviceCount: registry.listServices().length,
        activeCount: registry.listActive().length,
        inputPolicyVerdicts: typeof registry.listInputPolicyVerdicts === "function" ? registry.listInputPolicyVerdicts() : [],
        diagnostics: diagnostics.slice(),
        manifestFingerprint: MARACA_APP_SERVICES.manifest && MARACA_APP_SERVICES.manifest.fingerprint || null
      };
    }
  });
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

const MARACA_UNSAFE_PATH_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);

function maracaPathParts(path) {
  return String(path || "").split(".").filter(Boolean);
}

function hasUnsafeMaracaPathSegment(parts) {
  return parts.some((part) => MARACA_UNSAFE_PATH_SEGMENTS.has(part));
}

function readMaracaPath(source, path) {
  if (!path) return source;
  const parts = maracaPathParts(path);
  if (hasUnsafeMaracaPathSegment(parts)) return undefined;
  let cursor = source;
  for (const part of parts) {
    if (cursor == null || typeof cursor !== "object" || !Object.prototype.hasOwnProperty.call(cursor, part)) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function writeMaracaPath(target, path, value) {
  const parts = maracaPathParts(path);
  if (hasUnsafeMaracaPathSegment(parts)) return target;
  if (parts.length === 0) return target;
  let cursor = target;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value;
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(cursor, part) || !cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) {
      cursor[part] = Object.create(null);
    }
    cursor = cursor[part];
  });
  return target;
}

function setMaracaAttribute(element, name, value) {
  if (!element || !name) return;
  if (value === false && ["collapsible", "collapsable", "closable", "pinnable"].includes(String(name).toLowerCase())) {
    if (typeof element.setAttribute === "function") element.setAttribute(name, "false");
    return;
  }
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
      enablePrewarmWorker: Boolean(MARACA_KERNEL.prewarmWorker && MARACA_KERNEL.prewarmWorker.enabled),
      enableUiCoprocessor: Boolean(MARACA_UI_COPROCESSOR && MARACA_UI_COPROCESSOR.enabled),
      uiCoprocessor: MARACA_UI_COPROCESSOR,
      prewarmWorkerName: MARACA_KERNEL.prewarmWorker && MARACA_KERNEL.prewarmWorker.workerName || "XTendRMTPrewarmWorker",
      prewarmWorkerType: MARACA_KERNEL.prewarmWorker && MARACA_KERNEL.prewarmWorker.workerType || "classic",
      diagnostics,
      dispatchEvent: dispatchMaracaEvent
    });
    externalController.boot();
    return Object.freeze({
      enabled: externalController.enabled,
      mode: MARACA_KERNEL.mode,
      bootMode: MARACA_KERNEL.bootMode || "direct",
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
  let productSurface = null;
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

  function readPrewarmWorkerSnapshot() {
    if (runtime && typeof runtime.getPrewarmWorkerTopology === "function") {
      const topology = runtime.getPrewarmWorkerTopology();
      if (topology && typeof topology === "object") {
        return {
          ...(MARACA_KERNEL.prewarmWorker || {}),
          ...topology,
          runtimeExpectedStatus: MARACA_KERNEL.prewarmWorker && MARACA_KERNEL.prewarmWorker.enabled ? "booted" : "disabled"
        };
      }
    }
    return MARACA_KERNEL.prewarmWorker || {
      schema: "xtend.maraca.prewarm-worker-runtime.v1",
      enabled: false,
      status: "disabled",
      runtimeExpectedStatus: "disabled"
    };
  }

  function readUiCoprocessorSnapshot() {
    if (runtime && typeof runtime.getUiCoprocessorSnapshot === "function") {
      const snapshot = runtime.getUiCoprocessorSnapshot();
      if (snapshot && typeof snapshot === "object") {
        return {
          ...(MARACA_UI_COPROCESSOR || {}),
          ...snapshot,
          runtimeExpectedStatus: MARACA_UI_COPROCESSOR && MARACA_UI_COPROCESSOR.enabled ? "booted" : "disabled"
        };
      }
    }
    return MARACA_UI_COPROCESSOR || {
      schema: "xtend.maraca.ui-coprocessor-plan.v1",
      enabled: false,
      status: "disabled",
      runtimeExpectedStatus: "disabled"
    };
  }

  function snapshot() {
    return {
      schema: "xtend.maraca.kernel-snapshot.v1",
      mode: MARACA_KERNEL.mode,
      bootMode: MARACA_KERNEL.bootMode || "direct",
      status: runtimeStatus,
      planStatus: MARACA_KERNEL.status,
      enabled: Boolean(runtime || core || schedulerBridge),
      summary: MARACA_KERNEL.summary || {},
      featureAdoption: MARACA_KERNEL.featureAdoption || null,
      productSurface: productSurface && typeof productSurface.listEntryPoints === "function" ? {
        ...(MARACA_KERNEL.productSurface || {}),
        status: MARACA_KERNEL.bootMode === "productSurface" ? "active" : "available",
        entryPoints: productSurface.listEntryPoints(),
        entryPointCount: productSurface.listEntryPoints().length,
        entryPointNames: productSurface.listEntryPoints().map((entry) => entry && entry.name).filter(Boolean),
        optionalCompat: typeof productSurface.listOptionalCompat === "function" ? productSurface.listOptionalCompat() : (MARACA_KERNEL.productSurface && MARACA_KERNEL.productSurface.optionalCompat || {})
      } : (MARACA_KERNEL.productSurface || null),
      prewarmWorker: readPrewarmWorkerSnapshot(),
      uiCoprocessor: readUiCoprocessorSnapshot(),
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
    if (requested === "destroy" || requested === "dispose" || metadata.lifecycleOperation === "destroy" || metadata.lifecycleOperation === "dispose") {
      const lifecycle = fibers.find((fiber) => (
        fiber.kind === "lifecycle"
        && (
          fiber.op === "dispose"
          || fiber.op === "destroy"
          || String(fiber.operation || "").includes("/dispose")
          || String(fiber.operation || "").includes("/destroy")
        )
        && (!metadata.targetRef || fiber.target && String(fiber.target.ref || "").includes(metadata.targetRef))
      ));
      if (lifecycle) return lifecycle;
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
    if (MARACA_KERNEL.bootMode === "productSurface") {
      if (typeof kernelApi.createRmtProductSurface !== "function") {
        throw new Error("XTend RMT Product Surface is not available.");
      }
      productSurface = kernelApi.createRmtProductSurface();
      performanceRuntime = productSurface.createPerformanceRuntime({
        windowTarget: typeof window !== "undefined" ? window : undefined,
        documentTarget: typeof document !== "undefined" ? document : undefined,
        hostAdapter,
        runtimeKind: "maraca-kernel",
        schedules
      });
    } else {
      performanceRuntime = kernelApi.createRmtPerformanceRuntime({
        windowTarget: typeof window !== "undefined" ? window : undefined,
        documentTarget: typeof document !== "undefined" ? document : undefined,
        hostAdapter,
        runtimeKind: "maraca-kernel",
        schedules
      });
    }
    schedulerBridge = kernelApi.createRmtStateSchedulerDiagnosticsBridge({
      performanceRuntime,
      schedules
    });
    core = MARACA_KERNEL.bootMode === "productSurface"
      ? productSurface.createCore({
          windowTarget: typeof window !== "undefined" ? window : undefined,
          documentTarget: typeof document !== "undefined" ? document : undefined,
          hostAdapter,
          kernelRecords: artifact.records,
          scheduler
        })
      : typeof kernelApi.createRmtCore === "function" ? kernelApi.createRmtCore({
          windowTarget: typeof window !== "undefined" ? window : undefined,
          documentTarget: typeof document !== "undefined" ? document : undefined,
          hostAdapter,
          kernelRecords: artifact.records,
          scheduler
        }) : null;
    runtime = MARACA_KERNEL.bootMode === "productSurface"
      ? productSurface.createRuntime({
          windowTarget: typeof window !== "undefined" ? window : undefined,
          documentTarget: typeof document !== "undefined" ? document : undefined,
          hostAdapter,
          core,
          rmtCore: core,
          performanceRuntime,
          kernelRecords: artifact.records,
          scheduler,
          enablePrewarmWorker: Boolean(MARACA_KERNEL.prewarmWorker && MARACA_KERNEL.prewarmWorker.enabled),
          enableUiCoprocessor: Boolean(MARACA_UI_COPROCESSOR && MARACA_UI_COPROCESSOR.enabled),
          uiCoprocessor: MARACA_UI_COPROCESSOR,
          prewarmWorkerName: MARACA_KERNEL.prewarmWorker && MARACA_KERNEL.prewarmWorker.workerName || "XTendRMTPrewarmWorker",
          prewarmWorkerType: MARACA_KERNEL.prewarmWorker && MARACA_KERNEL.prewarmWorker.workerType || "classic"
        })
      : typeof kernelApi.createRmtRuntime === "function" ? kernelApi.createRmtRuntime({
          windowTarget: typeof window !== "undefined" ? window : undefined,
          documentTarget: typeof document !== "undefined" ? document : undefined,
          hostAdapter,
          core,
          rmtCore: core,
          performanceRuntime,
          kernelRecords: artifact.records,
          scheduler,
          enablePrewarmWorker: Boolean(MARACA_KERNEL.prewarmWorker && MARACA_KERNEL.prewarmWorker.enabled),
          enableUiCoprocessor: Boolean(MARACA_UI_COPROCESSOR && MARACA_UI_COPROCESSOR.enabled),
          uiCoprocessor: MARACA_UI_COPROCESSOR,
          prewarmWorkerName: MARACA_KERNEL.prewarmWorker && MARACA_KERNEL.prewarmWorker.workerName || "XTendRMTPrewarmWorker",
          prewarmWorkerType: MARACA_KERNEL.prewarmWorker && MARACA_KERNEL.prewarmWorker.workerType || "classic"
        }) : null;
    activateSchedules();
    runtimeStatus = "booted";
    dispatchMaracaEvent("xtend-maraca:kernel-boot", {
      schema: "xtend.maraca.kernel-boot.v1",
      mode: MARACA_KERNEL.mode,
      bootMode: MARACA_KERNEL.bootMode || "direct",
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
  if (effect.componentCommand) {
    return invokeMaracaComponentCommand(context.root || null, effect.componentCommand, {
      ensureComponent: typeof ensureMaracaComponent === "function" ? ensureMaracaComponent : null
    });
  }
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
  let appRuntime = null;
  let scheduledAppRuntime = null;
  let hostServiceRegistry = null;
  let surfaceRuntime = null;
  let renderer = null;
  let validationRuntime = null;
  let animationEngineRuntime = null;
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

  function componentTagsForSurface(surface, descriptor, element = null) {
    const tags = collectDescriptorComponentTags(descriptor);
    if (surface && surface.component) tags.add(String(surface.component).trim().toLowerCase());
    collectElementComponentTags(element, tags);
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
      const element = root && typeof root.querySelectorAll === "function"
        ? Array.from(root.querySelectorAll("[data-maraca-surface]")).find((entry) => entry.getAttribute("data-maraca-surface") === surface.id)
        : null;
      componentTagsForSurface(surface, descriptor, element).forEach((tag) => {
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
      appRuntime: appRuntime && typeof appRuntime.listCommands === "function" ? {
        schema: scheduledAppRuntime && scheduledAppRuntime.schema || appRuntime.schema,
        rawSchema: appRuntime.schema,
        facade: scheduledAppRuntime && scheduledAppRuntime.facade || null,
        capabilities: {
          commandFacade: !!(scheduledAppRuntime && typeof scheduledAppRuntime.command === "function"),
          streamLifecycle: !!(scheduledAppRuntime && typeof scheduledAppRuntime.handleStreamPatch === "function"),
          reducerRecipes: !!(scheduledAppRuntime && typeof scheduledAppRuntime.applyRecipe === "function")
        },
        commands: appRuntime.listCommands(),
        streamPatches: typeof appRuntime.listStreamPatches === "function" ? appRuntime.listStreamPatches() : [],
        streams: typeof appRuntime.listStreams === "function" ? appRuntime.listStreams() : [],
        diagnostics: typeof appRuntime.listDiagnostics === "function" ? appRuntime.listDiagnostics() : []
      } : null,
      surfaces: surfaceRuntime && typeof surfaceRuntime.getSnapshot === "function" ? surfaceRuntime.getSnapshot() : null,
      kernel: kernelController && typeof kernelController.snapshot === "function" ? kernelController.snapshot() : null,
      validation: validationRuntime && typeof validationRuntime.snapshot === "function" ? validationRuntime.snapshot() : null,
      animationEngine: animationEngineRuntime && typeof animationEngineRuntime.snapshot === "function" ? animationEngineRuntime.snapshot() : null,
      transitions: transitionRuntime && typeof transitionRuntime.snapshot === "function" ? transitionRuntime.snapshot() : null,
      diagnostics: listDiagnostics()
    };
  }

  function syncSurfaceAttributes(metadata = {}) {
    if (!stateRuntime || !artifact) return false;
    let missing = 0;
    let structuredPatchApplied = false;
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
      const structuredDescriptor = surfaceDescriptorNeedsStructuredPatch(descriptor);
      if (renderer && typeof renderer.patchElement === "function" && shouldPatchSurfaceDescriptorStructure(descriptor, element, metadata)) {
        try {
          renderer.patchElement(element, descriptor, createMaracaRenderContext(stateRuntime));
          structuredPatchApplied = true;
        } catch (error) {
          const diagnostic = publishDiagnostic(createMaracaErrorDiagnostic("xtend.maraca.structured_surface_patch_error", error));
          dispatchMaracaEvent("xtend-maraca:render-patch", diagnostic);
          if (MARACA_ORCHESTRATION.strict) throw error;
        }
      }
      if (!structuredDescriptor && Object.prototype.hasOwnProperty.call(state, "text")) {
        element.textContent = String(state.text == null ? "" : state.text);
      }
    });
    if (structuredPatchApplied) attachEvents();
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
    const appApi = getMaracaRuntimeApi("XTendRmtAppRuntime");
    const surfaceApi = getMaracaRuntimeApi("XTendRmtSurfaceResourceGraphRuntime");
    const rendererApi = getMaracaRuntimeApi("XTendRmtDomDescriptorRenderer");
    if (!stateApi || !actionApi || !eventApi || !appApi || !surfaceApi || !rendererApi) {
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
    hostServiceRegistry = appApi.createRmtHostServiceRegistry({
      services: artifact.hostServices || artifact.services || [],
      adapters: options.hostServiceAdapters || options.serviceAdapters || {}
    });
    const baseActionRuntime = actionApi.createRmtActionEffectRuntime({
      actions: artifact.actions && artifact.actions.actions || [],
      dataSources: artifact.actions && artifact.actions.dataSources || [],
      effects: artifact.actions && artifact.actions.effects || [],
      resources: artifact.resources || [],
      stateRuntime,
      resourceManager,
      hostServiceRegistry,
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
      const animationApi = getMaracaRuntimeApi("XTendRmtAnimationEngineRuntime");
      const transitionApi = getMaracaRuntimeApi("XTendRmtSurfaceTransitionRuntime");
      if (!animationApi || typeof animationApi.createRmtAnimationEngineRuntime !== "function") {
        throw new Error("XTend RMT animation engine runtime module is not available.");
      }
      if (!transitionApi || typeof transitionApi.createRmtSurfaceTransitionRuntime !== "function") {
        throw new Error("XTend RMT surface transition runtime module is not available.");
      }
      animationEngineRuntime = animationApi.createRmtAnimationEngineRuntime({
        animationPlan: MARACA_TRANSITIONS.artifact && MARACA_TRANSITIONS.artifact.animationEngine || MARACA_TRANSITIONS.artifact,
        xUtils: typeof globalThis !== "undefined" ? globalThis.XUtils : null,
        windowTarget: typeof window !== "undefined" ? window : undefined,
        diagnostics: MARACA_TRANSITIONS.diagnostics || [],
        strict: MARACA_TRANSITIONS.strict,
        publishDiagnostic
      });
      transitionRuntime = transitionApi.createRmtSurfaceTransitionRuntime({
        transitionPlan: MARACA_TRANSITIONS.artifact,
        animationEngine: animationEngineRuntime,
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
          if (reducer.recipe) {
            if (!appApi || typeof appApi.applyRmtReducerRecipe !== "function") {
              throw new Error("XTend RMT app runtime does not expose reducer recipe support.");
            }
            const current = stateRuntime.getState(reducer.state) || {};
            const next = appApi.applyRmtReducerRecipe(current, {
              recipe: reducer.recipe,
              path: reducer.path || "",
              value
            }, {
              payload,
              result,
              correlationId: metadata && metadata.correlationId || "",
              publishDiagnostic
            });
            stateRuntime.setState(reducer.state, next, { operation: "orchestration.reducer.recipe", action: actionId, reducer: reducer.id });
            return;
          }
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
    appRuntime = appApi.createRmtAppRuntime({
      actionRuntime,
      hostServices: hostServiceRegistry,
      initialState: options.appState || {},
      fabric: options.fabric || null,
      streamLifecycleActions: options.streamLifecycleActions || {}
    });
    function scheduleMaracaAppRuntimeWork(kind, work, metadata = {}) {
      return kernelController && kernelController.enabled && typeof kernelController.scheduleWork === "function"
        ? kernelController.scheduleWork(kind, work, metadata)
        : work();
    }
    function commandDispatchOperation(metadata = {}) {
      return metadata && metadata.eventId
        ? "operation:xtend.rmt/event/" + metadata.eventId
        : "operation:xtend.maraca/orchestration/event";
    }
    scheduledAppRuntime = Object.freeze({
      schema: appRuntime.schema,
      rawSchema: appRuntime.schema,
      facade: "xtend.maraca.scheduled-app-runtime.v1",
      hostServices: appRuntime.hostServices,
      createCommandEnvelope: appRuntime.createCommandEnvelope,
      command(commandName, payload = {}, options = {}) {
        const command = commandName && commandName.schema === "xtend.rmt.command.v1"
          ? commandName
          : appRuntime.createCommandEnvelope({
              command: commandName,
              payload,
              target: Object.prototype.hasOwnProperty.call(options || {}, "target") ? options.target : null
            }, {
              source: {
                kind: options.sourceKind || "app-runtime",
                id: options.sourceId || "scheduledAppRuntime.command",
                event: options.event || "command",
                surfaceId: options.surfaceId || ""
              },
              lane: options.lane || "user-blocking",
              correlationId: options.correlationId || "",
              runId: options.runId || ""
            });
        return scheduledAppRuntime.dispatchCommand(command, options.metadata || options);
      },
      refreshSnapshot(commandName = "xtend.app.applySnapshot", payload = {}, options = {}) {
        return scheduledAppRuntime.command(commandName, {
          reason: options.reason || "app-runtime-refresh",
          ...(payload && typeof payload === "object" && !Array.isArray(payload) ? payload : { value: payload })
        }, {
          ...options,
          lane: options.lane || "visible",
          sourceId: options.sourceId || "scheduledAppRuntime.refreshSnapshot",
          event: options.event || "snapshot-refresh"
        });
      },
      async dispatchCommand(commandEnvelope, metadata = {}) {
        const command = commandEnvelope && commandEnvelope.schema === "xtend.rmt.command.v1"
          ? commandEnvelope
          : appRuntime.createCommandEnvelope(commandEnvelope, metadata);
        const routeCommandWork = () => appRuntime.dispatchCommand(command, metadata);
        return scheduleMaracaAppRuntimeWork("event", routeCommandWork, {
          operation: commandDispatchOperation(metadata),
          action: command && command.command || "",
          eventId: metadata && metadata.eventId || "",
          eventName: metadata && metadata.eventName || "",
          correlationId: command && command.correlationId || metadata && metadata.correlationId || ""
        });
      },
      invokeService(serviceId, payload = {}, context = {}) {
        const invokeWork = () => appRuntime.invokeService(serviceId, payload, context);
        return scheduleMaracaAppRuntimeWork("action", invokeWork, {
          operation: "operation:xtend.maraca/orchestration/action",
          serviceId,
          correlationId: context && context.correlationId || context && context.command && context.command.correlationId || ""
        });
      },
      streamService(serviceId, payload = {}, options = {}) {
        const streamWork = () => appRuntime.streamService(serviceId, payload, options);
        return scheduleMaracaAppRuntimeWork("action", streamWork, {
          operation: "operation:xtend.maraca/orchestration/action",
          serviceId,
          correlationId: options && options.correlationId || options && options.command && options.command.correlationId || ""
        });
      },
      applyStreamPatch(patchInput, reducerOptions = {}) {
        const patchWork = () => appRuntime.applyStreamPatch(patchInput, reducerOptions);
        return scheduleMaracaAppRuntimeWork("state-change", patchWork, {
          operation: "operation:xtend.maraca/orchestration/state-change",
          correlationId: patchInput && patchInput.correlationId || reducerOptions && reducerOptions.correlationId || ""
        });
      },
      handleStreamPatch(patchInput, reducerOptions = {}) {
        const patchWork = () => appRuntime.handleStreamPatch(patchInput, reducerOptions);
        return scheduleMaracaAppRuntimeWork("state-change", patchWork, {
          operation: "operation:xtend.maraca/orchestration/state-change",
          correlationId: patchInput && patchInput.correlationId || reducerOptions && reducerOptions.correlationId || ""
        });
      },
      applyReducer(reducer, context = {}) {
        const reducerWork = () => appRuntime.applyReducer(reducer, context);
        return scheduleMaracaAppRuntimeWork("state-change", reducerWork, {
          operation: "operation:xtend.maraca/orchestration/state-change",
          correlationId: context && context.correlationId || ""
        });
      },
      applyRecipe(recipe, context = {}) {
        const recipeWork = () => appRuntime.applyRecipe(recipe, context);
        return scheduleMaracaAppRuntimeWork("state-change", recipeWork, {
          operation: "operation:xtend.maraca/orchestration/state-change",
          correlationId: context && context.correlationId || ""
        });
      },
      getState() {
        return appRuntime.getState();
      },
      setState(value) {
        const setStateWork = () => appRuntime.setState(value);
        return scheduleMaracaAppRuntimeWork("state-change", setStateWork, {
          operation: "operation:xtend.maraca/orchestration/state-change"
        });
      },
      listCommands() {
        return appRuntime.listCommands();
      },
      listStreamPatches() {
        return appRuntime.listStreamPatches();
      },
      listStreams() {
        return appRuntime.listStreams();
      },
      listDiagnostics() {
        return appRuntime.listDiagnostics();
      }
    });
    const eventActionRuntime = Object.freeze({
      ...actionRuntime,
      async dispatchCommand(commandEnvelope, metadata = {}) {
        return scheduledAppRuntime.dispatchCommand(commandEnvelope, metadata);
      },
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
    const initialRender = options.adoptExisting === true ? null : render();
    Promise.resolve(initialRender).then(() => {
      if (validationRuntime && typeof validationRuntime.refresh === "function") {
        validationRuntime.refresh({ reason: options.adoptExisting === true ? "resume" : "boot" });
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
    enabled: Boolean(stateRuntime && actionRuntime && appRuntime && scheduledAppRuntime && eventRuntime && surfaceRuntime && renderer),
    mode: MARACA_ORCHESTRATION.mode,
    status: MARACA_ORCHESTRATION.status,
    stateRuntime,
    actionRuntime,
    appRuntime: scheduledAppRuntime,
    hostServiceRegistry,
    eventRuntime,
    surfaceRuntime,
    renderer,
      validationRuntime,
      animationEngineRuntime,
      transitionRuntime,
    render,
    attachEvents,
    dispose() {
      if (typeof unsubState === "function") unsubState();
      if (eventRuntime && typeof eventRuntime.detachAll === "function") eventRuntime.detachAll();
      if (actionRuntime && typeof actionRuntime.dispose === "function") actionRuntime.dispose("XTend Maraca orchestration disposed.");
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
        lifecycle: MARACA_LIFECYCLE,
        warmReentry: MARACA_WARM_REENTRY,
        uiCoprocessor: MARACA_UI_COPROCESSOR,
        webAppManifest: MARACA_WEB_APP_MANIFEST,
        pwa: {
          plan: MARACA_PWA,
          registration: currentMaracaPwaRegistration
        },
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

function registerMaracaTemplateArtifacts(options = {}) {
  const report = MARACA_TEMPLATE_ARTIFACTS;
  const bundle = report && report.artifactBundle;
  const base = {
    schema: "xtend.maraca.template-artifacts-registration.v1",
    ok: false,
    status: "skipped",
    documentIds: report && Array.isArray(report.documentIds) ? report.documentIds.slice() : [],
    templateIds: report && Array.isArray(report.templateIds) ? report.templateIds.slice() : [],
    artifactBundleFingerprint: report && report.artifactBundleFingerprint || ""
  };
  if (!report || !bundle || !report.registration || report.registration.eligible !== true || report.trusted !== true) {
    return {
      ...base,
      status: "not_eligible",
      reason: report && report.registration && report.registration.reason || "no_trusted_artifact_bundle"
    };
  }
  if (!XTendMaracaKernelRuntimeModule || typeof XTendMaracaKernelRuntimeModule.createRmtTemplateArtifacts !== "function") {
    return {
      ...base,
      status: "runtime_factory_unavailable",
      reason: "createRmtTemplateArtifacts is not bundled"
    };
  }
  try {
    const artifactApi = XTendMaracaKernelRuntimeModule.createRmtTemplateArtifacts({
      now: () => 0,
      ...(options.templateArtifactsOptions || {})
    });
    if (!artifactApi || typeof artifactApi.registerArtifactBundle !== "function") {
      return {
        ...base,
        status: "runtime_register_unavailable",
        reason: "registerArtifactBundle is not available"
      };
    }
    const registered = artifactApi.registerArtifactBundle(bundle, {
      replace: true,
      trusted: true
    });
    const result = {
      ...base,
      ok: Boolean(registered && registered.ok),
      status: registered && registered.ok ? "registered" : "failed",
      documentCount: registered && registered.documentCount || 0,
      templateCount: registered && registered.templateCount || 0,
      documentIds: registered && Array.isArray(registered.documentIds) ? registered.documentIds.slice() : base.documentIds
    };
    dispatchMaracaEvent("xtend-maraca:template-artifacts", result);
    return result;
  } catch (error) {
    return {
      ...base,
      status: "failed",
      reason: error && error.message ? error.message : String(error)
    };
  }
}

async function registerMaracaPwaServiceWorker(options = {}) {
  const base = {
    schema: "xtend.maraca.pwa-service-worker-registration.v1",
    ok: false,
    status: "disabled",
    enabled: Boolean(MARACA_PWA && MARACA_PWA.enabled),
    serviceWorkerControlled: false,
    manifestRef: MARACA_PWA && MARACA_PWA.manifestRef || null,
    cacheMode: MARACA_PWA && MARACA_PWA.cacheMode || "disabled",
    cacheVersion: MARACA_PWA && MARACA_PWA.cacheVersion || "",
    offlineEligible: Boolean(MARACA_PWA && MARACA_PWA.offlineEligible)
  };
  if (!MARACA_PWA || !MARACA_PWA.enabled || !MARACA_PWA.serviceWorker || MARACA_PWA.serviceWorker.enabled !== true) {
    return base;
  }
  if (typeof navigator === "undefined" || !navigator.serviceWorker || typeof navigator.serviceWorker.register !== "function") {
    return {
      ...base,
      status: "unsupported",
      reason: "navigator.serviceWorker is unavailable"
    };
  }
  const registrationUrl = options.serviceWorkerUrl || MARACA_PWA.serviceWorker.registrationUrl || MARACA_PWA.serviceWorker.ref || "./xtend.service-worker.js";
  const scope = options.serviceWorkerScope || MARACA_PWA.serviceWorker.scope || "./";
  try {
    const registration = await navigator.serviceWorker.register(registrationUrl, { scope });
    const controlled = Boolean(navigator.serviceWorker.controller || registration.active);
    const result = {
      ...base,
      ok: true,
      status: controlled ? "controlled" : "registered",
      registrationUrl,
      scope,
      serviceWorkerControlled: controlled,
      updateMode: MARACA_PWA.updateMode || "prompt"
    };
    dispatchMaracaEvent("xtend-maraca:pwa-service-worker", result);
    return result;
  } catch (error) {
    return {
      ...base,
      status: "registration_failed",
      registrationUrl,
      scope,
      reason: error && error.message ? error.message : String(error)
    };
  }
}

let currentMaracaKernel = null;
let currentMaracaOrchestration = null;
let currentMaracaHydration = null;
let currentMaracaValidation = null;
let currentMaracaAnimationEngine = null;
let currentMaracaTransitions = null;
let currentMaracaTelemetry = null;
let currentMaracaTemplateArtifactsRegistration = null;
let currentMaracaPwaRegistration = null;
let currentMaracaAppServices = null;
let currentMaracaResume = null;
let currentMaracaBootResult = null;
let currentMaracaResumeIdentity = "";

function resolveMaracaResumeIdentity(payload) {
  const envelope = payload && (payload.resume || payload.response && payload.response.resume || payload.schema === "xtend.rmt.ssr-resume-envelope.v1" && payload) || null;
  if (!envelope || !envelope.generation) return "";
  const integrity = envelope.integrity || {};
  return [envelope.generation, integrity.keyId || "", integrity.digest || "", integrity.signature || ""].join(":");
}

function disposeXtendMaraca(reason = "XTend Maraca app disposed.") {
  const disposed = {
    orchestration: false,
    appServices: false
  };
  if (currentMaracaOrchestration && typeof currentMaracaOrchestration.dispose === "function") {
    currentMaracaOrchestration.dispose();
    disposed.orchestration = true;
  }
  if (currentMaracaAppServices && typeof currentMaracaAppServices.dispose === "function") {
    disposed.appServices = currentMaracaAppServices.dispose(reason);
  }
  dispatchMaracaEvent("xtend-maraca:dispose", {
    schema: "xtend.maraca.dispose.v1",
    reason,
    ...disposed
  });
  currentMaracaBootResult = null;
  currentMaracaResumeIdentity = "";
  return disposed;
}

async function bootXtendMaraca(options = {}) {
  if (typeof document === "undefined") {
    return { ok: false, status: "no_document", schema: MARACA_SCHEMA };
  }
  const root = options.root || document.querySelector("[data-maraca-root]") || document.getElementById("xtend-maraca-root") || document.body;
  const pendingResumeIdentity = resolveMaracaResumeIdentity(readServerPrerenderShellPayload());
  if (pendingResumeIdentity && pendingResumeIdentity === currentMaracaResumeIdentity && currentMaracaBootResult) {
    const duplicateResult = Object.freeze({
      ...currentMaracaBootResult,
      duplicateBootIgnored: true
    });
    window.__XTendMaracaResult = duplicateResult;
    return duplicateResult;
  }
  if (currentMaracaAppServices) disposeXtendMaraca("XTend Maraca app restarted.");
  currentMaracaAppServices = createMaracaAppServiceController(options);
  const runtimeOptions = {
    ...options,
    hostServiceAdapters: currentMaracaAppServices.hostServiceAdapters,
    dataSourceAdapters: currentMaracaAppServices.dataSourceAdapters
  };
  attachMaracaCss(root);
  const serverPrerenderShell = adoptServerPrerenderShell(root);
  const resumeRequested = serverPrerenderShell.active === true
    && serverPrerenderShell.executionMode === "server_prerender_resume"
    && serverPrerenderShell.payload;
  const surfaceEntries = [];
  if (!serverPrerenderShell.active) {
    const fragment = document.createDocumentFragment();
    MARACA_SURFACES.forEach((surface) => {
      const element = createSurfaceElement(surface);
      fragment.appendChild(element);
      surfaceEntries.push({ surface, element });
    });
    root.appendChild(fragment);
  } else {
    surfaceEntries.push(...createSurfaceEntriesFromRoot(root));
  }
  runtimeOptions.adoptExisting = Boolean(resumeRequested);
  currentMaracaKernel = createKernelController(root, runtimeOptions);
  currentMaracaHydration = createHydrationController(root, runtimeOptions, currentMaracaKernel);
  currentMaracaOrchestration = createOrchestrationController(root, runtimeOptions, currentMaracaKernel, currentMaracaHydration);
  currentMaracaValidation = currentMaracaOrchestration && currentMaracaOrchestration.validationRuntime || null;
  currentMaracaAnimationEngine = currentMaracaOrchestration && currentMaracaOrchestration.animationEngineRuntime || null;
  currentMaracaTransitions = currentMaracaOrchestration && currentMaracaOrchestration.transitionRuntime || null;
  currentMaracaTelemetry = createTelemetryBridge(currentMaracaKernel, currentMaracaOrchestration, currentMaracaHydration, currentMaracaValidation, currentMaracaTransitions);
  let resumeResult = null;
  if (resumeRequested) {
    const resumeApi = getMaracaRuntimeApi("XTendRmtResumeRuntime");
    if (resumeApi && typeof resumeApi.createRmtResumeRuntime === "function") {
      const resumeEnvelope = serverPrerenderShell.payload.resume
        || serverPrerenderShell.payload.response && serverPrerenderShell.payload.response.resume
        || serverPrerenderShell.payload;
      const resumeRoot = resumeEnvelope && resumeEnvelope.rootId && document.getElementById(resumeEnvelope.rootId) || root;
      currentMaracaResume = resumeApi.createRmtResumeRuntime({
        root: resumeRoot,
        verifyResumeEnvelope: runtimeOptions.verifyResumeEnvelope || runtimeOptions.verify,
        stateRuntime: currentMaracaOrchestration && currentMaracaOrchestration.stateRuntime,
        adopters: runtimeOptions.resumeAdopters || runtimeOptions.adopters || {},
        restoreState(state) {
          const stateRuntime = currentMaracaOrchestration && currentMaracaOrchestration.stateRuntime;
          if (!stateRuntime || typeof stateRuntime.setState !== "function") return null;
          const known = new Set((stateRuntime.stateDefinitions || []).map((entry) => entry && entry.id).filter(Boolean));
          Object.entries(state || {}).forEach(([id, value]) => {
            if (known.size === 0 || known.has(id)) stateRuntime.setState(id, value, { operation: "server-resume", generation: resumeEnvelope.generation });
          });
          return stateRuntime.snapshot && stateRuntime.snapshot();
        },
        adoptRoot() {
          return currentMaracaOrchestration && typeof currentMaracaOrchestration.attachEvents === "function"
            ? currentMaracaOrchestration.attachEvents()
            : null;
        },
        replayIntent(intent) {
          const actionRuntime = currentMaracaOrchestration && currentMaracaOrchestration.actionRuntime;
          return actionRuntime && typeof actionRuntime.runAction === "function"
            ? actionRuntime.runAction(intent.action, intent.payload || {}, { operation: "resume-replay", eventId: intent.eventId })
            : null;
        },
        hydrateResponse() {
          const renderResult = currentMaracaOrchestration && typeof currentMaracaOrchestration.render === "function"
            ? currentMaracaOrchestration.render()
            : null;
          const hydrateResult = currentMaracaHydration && currentMaracaHydration.enabled
            ? currentMaracaHydration.hydrateAll(MARACA_COMPONENTS.map((entry) => entry.tag), { reason: "resume-fallback" })
            : null;
          return Promise.all([Promise.resolve(renderResult), Promise.resolve(hydrateResult)]).then(() => ({ ok: true, status: "hydrated" }));
        },
        publishDiagnostic(diagnostic) {
          dispatchMaracaEvent("xtend-maraca:resume-diagnostic", diagnostic);
        }
      });
      resumeResult = await currentMaracaResume.resumeResponse(serverPrerenderShell.payload.response || serverPrerenderShell.payload, {}, {
        root: resumeRoot,
        intentQueue: runtimeOptions.intentQueue || []
      });
      if (typeof root.setAttribute === "function") root.setAttribute("data-rmt-resume-status", resumeResult.status);
      dispatchMaracaEvent("xtend-maraca:resume", resumeResult);
    } else {
      resumeResult = {
        schema: "xtend.rmt.resume-result.v1",
        ok: false,
        status: "rejected",
        reasons: ["resume_runtime_missing"]
      };
    }
  }
  currentMaracaTemplateArtifactsRegistration = registerMaracaTemplateArtifacts(runtimeOptions);
  currentMaracaPwaRegistration = await registerMaracaPwaServiceWorker(runtimeOptions);
  const activeSurfaceEntries = currentMaracaOrchestration && currentMaracaOrchestration.enabled
    ? createSurfaceEntriesFromRoot(root)
    : surfaceEntries;
  const lazyStrategy = resolveLazyStrategy(runtimeOptions);
  let lazyController = null;
  if (lazyStrategy === "viewport") {
    lazyController = observeViewportComponents(activeSurfaceEntries, runtimeOptions, currentMaracaHydration);
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
    appServices: currentMaracaAppServices.snapshot(),
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
      prewarmWorker: currentMaracaKernel && typeof currentMaracaKernel.snapshot === "function" ? currentMaracaKernel.snapshot().prewarmWorker : MARACA_KERNEL.prewarmWorker,
      uiCoprocessor: currentMaracaKernel && typeof currentMaracaKernel.snapshot === "function" ? currentMaracaKernel.snapshot().uiCoprocessor : MARACA_UI_COPROCESSOR,
      diagnosticCount: currentMaracaKernel ? currentMaracaKernel.listDiagnostics().length : 0
    },
    hydration: {
      enabled: Boolean(currentMaracaHydration && currentMaracaHydration.enabled),
      mode: MARACA_HYDRATION.mode,
      status: MARACA_HYDRATION.status,
      diagnosticCount: currentMaracaHydration ? currentMaracaHydration.listDiagnostics().length : 0,
      resume: resumeResult
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
      animationEngineStatus: currentMaracaAnimationEngine ? "booted" : (MARACA_TRANSITIONS.summary && MARACA_TRANSITIONS.summary.animationEngineSchema ? "planned" : "disabled"),
      activeCount: currentMaracaTransitions && typeof currentMaracaTransitions.listActiveTransitions === "function" ? currentMaracaTransitions.listActiveTransitions().length : 0,
      diagnosticCount: currentMaracaTransitions && typeof currentMaracaTransitions.listDiagnostics === "function" ? currentMaracaTransitions.listDiagnostics().length : 0
    },
    templateArtifacts: {
      enabled: Boolean(MARACA_TEMPLATE_ARTIFACTS && MARACA_TEMPLATE_ARTIFACTS.trusted),
      status: MARACA_TEMPLATE_ARTIFACTS && MARACA_TEMPLATE_ARTIFACTS.status || "unavailable",
      documentIds: MARACA_TEMPLATE_ARTIFACTS && Array.isArray(MARACA_TEMPLATE_ARTIFACTS.documentIds) ? MARACA_TEMPLATE_ARTIFACTS.documentIds.slice() : [],
      templateIds: MARACA_TEMPLATE_ARTIFACTS && Array.isArray(MARACA_TEMPLATE_ARTIFACTS.templateIds) ? MARACA_TEMPLATE_ARTIFACTS.templateIds.slice() : [],
      artifactBundleFingerprint: MARACA_TEMPLATE_ARTIFACTS && MARACA_TEMPLATE_ARTIFACTS.artifactBundleFingerprint || "",
      registration: currentMaracaTemplateArtifactsRegistration
    },
    serverPrerenderShell,
    resume: resumeResult,
    uiCoprocessor: MARACA_UI_COPROCESSOR,
    webAppManifest: MARACA_WEB_APP_MANIFEST,
    pwa: {
      plan: MARACA_PWA,
      registration: currentMaracaPwaRegistration
    },
    productionClosure: MARACA_PRODUCTION_CLOSURE,
    lazyObservedCount: lazyController ? lazyController.observedCount : 0,
    publicNameReservations: MARACA_PUBLIC_NAMES,
    dispose: disposeXtendMaraca
  };
  currentMaracaBootResult = result;
  currentMaracaResumeIdentity = pendingResumeIdentity;
  window.__XTendMaracaResult = result;
  window.__XTendMaracaLazyController = lazyController;
  window.__XTendMaracaKernel = currentMaracaKernel;
  window.__XTendMaracaOrchestration = currentMaracaOrchestration;
  window.__XTendMaracaHydration = currentMaracaHydration;
  window.__XTendMaracaResume = currentMaracaResume;
  window.__XTendMaracaValidation = currentMaracaValidation;
  window.__XTendMaracaAnimationEngine = currentMaracaAnimationEngine;
  window.__XTendMaracaTransitions = currentMaracaTransitions;
  window.__XTendMaracaTelemetry = currentMaracaTelemetry;
  window.__XTendMaracaTemplateArtifactsRegistration = currentMaracaTemplateArtifactsRegistration;
  window.__XTendMaracaPwaRegistration = currentMaracaPwaRegistration;
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
  warmReentry: MARACA_WARM_REENTRY,
  uiCoprocessor: MARACA_UI_COPROCESSOR,
  webAppManifest: MARACA_WEB_APP_MANIFEST,
  pwa: MARACA_PWA,
  validationPlan: MARACA_VALIDATION,
  transitionPlan: MARACA_TRANSITIONS,
  productionClosure: MARACA_PRODUCTION_CLOSURE,
  templateArtifacts: MARACA_TEMPLATE_ARTIFACTS,
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
  get animationEngine() {
    return currentMaracaAnimationEngine;
  },
  get transitions() {
    return currentMaracaTransitions;
  },
  get telemetry() {
    return currentMaracaTelemetry;
  },
  get templateArtifactsRegistration() {
    return currentMaracaTemplateArtifactsRegistration;
  },
  get pwaRegistration() {
    return currentMaracaPwaRegistration;
  },
  get appServices() {
    return currentMaracaAppServices;
  },
  stackModules: MARACA_STACK_MODULES,
  ensureComponent: ensureMaracaComponent,
  boot: bootXtendMaraca,
  dispose: disposeXtendMaraca
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
  window.addEventListener("pagehide", () => disposeXtendMaraca("XTend Maraca page hidden."), { once: true });
  scheduleXtendMaracaAutoBoot();
}

export { MARACA_COMPONENTS, MARACA_SURFACES, MARACA_EVENTS, MARACA_ORCHESTRATION, MARACA_KERNEL, MARACA_HYDRATION, MARACA_WARM_REENTRY, MARACA_UI_COPROCESSOR, MARACA_WEB_APP_MANIFEST, MARACA_PWA, MARACA_VALIDATION, MARACA_TRANSITIONS, MARACA_APP_SERVICES, MARACA_TEMPLATE_ARTIFACTS, MARACA_PUBLIC_NAMES, MARACA_STACK_MODULES, MARACA_COMPONENT_COMMAND_SCHEMA, MARACA_COMPONENT_COMMAND_RESULT_SCHEMA, invokeMaracaComponentCommand, ensureMaracaComponent, bootXtendMaraca, disposeXtendMaraca };
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
  const clientEntry = plan.services && plan.services.entries && plan.services.entries.client && plan.services.entries.client.path
    ? path.resolve(plan.services.entries.client.path)
    : null;
  const clientSourceDir = clientEntry ? path.dirname(clientEntry) : null;
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
    const modules = item.type === 'chunk' && item.modules ? Object.entries(item.modules).map(([id, metadata]) => ({
      id: toPosix(id),
      renderedLength: Number(metadata && metadata.renderedLength || 0),
      appService: Boolean(clientEntry && (
        path.resolve(id) === clientEntry
        || (clientSourceDir && path.resolve(id).startsWith(`${clientSourceDir}${path.sep}`) && !path.resolve(id).includes(`${path.sep}node_modules${path.sep}`))
      ))
    })) : [];
    const renderedBytes = modules.reduce((sum, module) => sum + module.renderedLength, 0);
    const appServiceRenderedBytes = modules.filter((module) => module.appService).reduce((sum, module) => sum + module.renderedLength, 0);
    const appServiceBytes = item.type === 'chunk' && renderedBytes > 0
      ? Math.min(bytes, Math.round(bytes * appServiceRenderedBytes / renderedBytes))
      : 0;
    files.push({
      type: item.type,
      fileName: item.fileName,
      path: filePath,
      bytes,
      isEntry: item.type === 'chunk' && item.isEntry === true,
      isDynamicEntry: item.type === 'chunk' && item.isDynamicEntry === true,
      imports: item.type === 'chunk' ? item.imports : [],
      dynamicImports: item.type === 'chunk' ? item.dynamicImports : [],
      modules,
      appServiceBytes,
      frameworkBytes: Math.max(0, bytes - appServiceBytes)
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
  const plugins = [createRollupVirtualEntryPlugin(plan, rawSource)];
  if (plan.services && plan.services.enabled && plan.services.entries && plan.services.entries.client && plan.services.entries.client.exists) {
    plugins.push(createTypeScriptRollupPlugin(plan.services, { target: 'browser' }));
  }
  const bundle = await rollupTool.module.rollup({
    input: ROLLUP_VIRTUAL_ENTRY_ID,
    external: (id) => isKernelRuntimeExternalImport(plan, id),
    plugins,
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

function copyKernelResumeRuntimeAsset(plan) {
  if (!plan || !plan.kernel || !plan.kernel.enabled) return null;
  const packageRoot = path.dirname(path.dirname(__filename));
  const candidates = [
    path.resolve(plan.rootDir || packageRoot, 'xtendrmt/rmt-resume-runtime.js'),
    path.resolve(packageRoot, 'xtendrmt/rmt-resume-runtime.js')
  ];
  const sourcePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!sourcePath) return null;
  const targetPath = path.join(plan.outputDir, KERNEL_RESUME_RUNTIME_BUNDLE_FILE);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  return {
    type: 'asset',
    fileName: KERNEL_RESUME_RUNTIME_BUNDLE_FILE,
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

function sourceFingerprintForPlan(plan, repoRoot) {
  const sourcePath = plan && (plan.sourcePath || plan.source);
  if (!sourcePath) return '';
  const absolutePath = path.isAbsolute(sourcePath) ? sourcePath : path.resolve(repoRoot, sourcePath);
  try {
    if (fs.existsSync(absolutePath)) return `sha256:${hashText(fs.readFileSync(absolutePath, 'utf8'))}`;
  } catch (_) {}
  return '';
}

function closureRuntimeExpectedStatus(section, fallback = 'optional') {
  if (!section || typeof section !== 'object') return fallback;
  if (section.runtimeExpectedStatus) return section.runtimeExpectedStatus;
  if (section.summary && section.summary.runtimeExpectedStatus) return section.summary.runtimeExpectedStatus;
  if (section.enabled === true) return 'booted';
  if (section.active === true) return 'booted';
  return fallback;
}

function closureStatusFor(section, fallback = 'unavailable') {
  if (!section || typeof section !== 'object') return fallback;
  return section.status || section.planStatus || (section.ok === false ? 'blocked' : (section.enabled === true ? 'planned' : fallback));
}

function closureDiagnosticsFor(section) {
  return Array.isArray(section && section.diagnostics) ? section.diagnostics : [];
}

function createProductionCapability(input = {}) {
  const status = input.status || 'unavailable';
  const diagnostics = closureDiagnosticsFor(input);
  const supported = Boolean(input.supported);
  const active = Boolean(input.active);
  const runtimeExpectedStatus = input.runtimeExpectedStatus || (active ? 'booted' : 'optional');
  const degraded = Boolean(input.degraded) || status === 'degraded' || status === 'fallback';
  const blocked = Boolean(input.blocked) || status === 'blocked' || input.ok === false;
  return {
    schema: 'xtend.maraca.production-bundle-capability.v1',
    key: input.key || 'unknown',
    label: input.label || input.key || 'unknown',
    supported,
    active,
    optional: input.optional === true,
    requiredInProd: input.requiredInProd === true,
    status,
    runtimeExpectedStatus,
    degraded,
    blocked,
    diagnostics,
    sourceToSea: input.sourceToSea || {},
    evidence: input.evidence || {}
  };
}

function createMaracaProductionBundleClosure(plan, sizeBudgetReport = null, options = {}) {
  const repoRoot = plan.rootDir || path.dirname(path.dirname(__filename));
  const profile = plan.profile || 'production';
  const prodEnforced = profile === 'production' || profile === 'max';
  const bundleFiles = Array.isArray(options.bundleFiles) ? options.bundleFiles : [];
  const kernel = plan.kernel || null;
  const orchestration = plan.orchestration || null;
  const hydration = plan.hydration || null;
  const lifecycle = plan.lifecycle || null;
  const warmReentry = plan.warmReentry || null;
  const performance = plan.performance || null;
  const templateArtifacts = plan.templateArtifacts || null;
  const prewarmWorker = kernel && kernel.prewarmWorker || null;
  const uiCoprocessor = plan.uiCoprocessor || null;
  const policyParity = kernel && kernel.policyParity || null;
  const workerPrerender = hydration && (hydration.workerPrerender || hydration.summary && hydration.summary.workerPrerender) || null;
  const serverPrerender = hydration && (hydration.serverPrerender || hydration.summary && hydration.summary.serverPrerender) || null;
  const runtimeModules = Array.isArray(plan.runtimeModules) ? plan.runtimeModules : [];
  const stackModules = Array.isArray(plan.stackModules) ? plan.stackModules.map((entry) => entry.source).filter(Boolean) : [];
  const sourceFingerprint = sourceFingerprintForPlan(plan, repoRoot);
  const bundleFingerprint = performance && performance.bundleFingerprint
    || templateArtifacts && templateArtifacts.bundleFingerprint
    || null;
  const sourceRef = repoRelative(plan.sourcePath || plan.source || '', repoRoot);
  const diagnostics = [];

  const capabilities = [
    createProductionCapability({
      key: 'orchestration',
      label: 'App Orchestration',
      supported: Boolean(orchestration),
      active: Boolean(orchestration && orchestration.enabled),
      requiredInProd: Boolean(orchestration && orchestration.enabled),
      status: closureStatusFor(orchestration, 'disabled'),
      runtimeExpectedStatus: closureRuntimeExpectedStatus(orchestration, 'disabled'),
      diagnostics: closureDiagnosticsFor(orchestration),
      sourceToSea: {
        source: sourceRef,
        artifactSchema: orchestration && orchestration.artifact && orchestration.artifact.schema || null,
        runtimeModules: orchestration && orchestration.runtimeModules || []
      }
    }),
    createProductionCapability({
      key: 'kernel',
      label: 'RMT Kernel',
      supported: Boolean(kernel && kernel.supported),
      active: Boolean(kernel && kernel.enabled),
      requiredInProd: Boolean(kernel && kernel.enabled),
      status: closureStatusFor(kernel, 'disabled'),
      runtimeExpectedStatus: closureRuntimeExpectedStatus(kernel, 'disabled'),
      diagnostics: closureDiagnosticsFor(kernel),
      sourceToSea: {
        source: sourceRef,
        artifactSchema: kernel && kernel.artifact && kernel.artifact.schema || null,
        recordsSchema: kernel && kernel.artifact && kernel.artifact.records && kernel.artifact.records.schema || null,
        runtimeModules: kernel && kernel.runtimeModules || []
      }
    }),
    createProductionCapability({
      key: 'lifecycle',
      label: 'Lifecycle Engine',
      supported: Boolean(lifecycle),
      active: Boolean(lifecycle && lifecycle.requiresDestroyChain),
      requiredInProd: Boolean(lifecycle && lifecycle.requiresDestroyChain),
      status: closureStatusFor(lifecycle, 'ready'),
      runtimeExpectedStatus: closureRuntimeExpectedStatus(lifecycle, 'optional'),
      ok: lifecycle ? lifecycle.ok : true,
      diagnostics: closureDiagnosticsFor(lifecycle),
      sourceToSea: lifecycle && lifecycle.sourceToSea || {}
    }),
    createProductionCapability({
      key: 'telemetry',
      label: 'Telemetry',
      supported: runtimeModules.includes('fabric/xtend-fabric.js') || stackModules.includes('fabric/xtend-fabric.js') || runtimeModules.includes('xtendrmt/rmt-app-runtime.js'),
      active: Boolean(orchestration && orchestration.enabled || kernel && kernel.enabled),
      requiredInProd: Boolean(orchestration && orchestration.enabled || kernel && kernel.enabled),
      status: orchestration && orchestration.enabled || kernel && kernel.enabled ? 'available' : 'idle',
      runtimeExpectedStatus: orchestration && orchestration.enabled || kernel && kernel.enabled ? 'booted' : 'idle',
      diagnostics: [],
      evidence: {
        devApis: ['createTelemetrySnapshot', 'getPerformanceTelemetrySnapshot', 'listStreamPressureRecords', 'listYieldActions'],
        runtimeModules: runtimeModules.filter((entry) => entry.includes('rmt-app-runtime') || entry.includes('xtend-fabric'))
      }
    }),
    createProductionCapability({
      key: 'performance',
      label: 'Performance',
      supported: Boolean(performance && performance.supported),
      active: Boolean(performance && performance.runtimeExpectedStatus === 'booted'),
      requiredInProd: Boolean(kernel && kernel.enabled),
      status: closureStatusFor(performance, 'unavailable'),
      runtimeExpectedStatus: closureRuntimeExpectedStatus(performance, kernel && kernel.enabled ? 'booted' : 'report-only'),
      ok: performance ? performance.ok : false,
      diagnostics: closureDiagnosticsFor(performance),
      evidence: {
        budgetClasses: performance && performance.budgetClasses || [],
        bundleFingerprint: performance && performance.bundleFingerprint || null
      }
    }),
    createProductionCapability({
      key: 'policyParity',
      label: 'Kernel Policy Parity',
      supported: Boolean(policyParity),
      active: Boolean(kernel && kernel.enabled),
      requiredInProd: Boolean(kernel && kernel.enabled),
      status: closureStatusFor(policyParity, 'unavailable'),
      runtimeExpectedStatus: kernel && kernel.enabled ? 'booted' : 'disabled',
      ok: policyParity ? policyParity.ok : !kernel || !kernel.enabled,
      diagnostics: closureDiagnosticsFor(policyParity),
      evidence: {
        driftCount: policyParity && policyParity.driftCount || 0,
        missingFactories: policyParity && policyParity.missingFactories || []
      }
    }),
    createProductionCapability({
      key: 'prewarmWorker',
      label: 'Prewarm Worker',
      supported: Boolean(prewarmWorker && prewarmWorker.supported),
      active: Boolean(prewarmWorker && prewarmWorker.enabled),
      optional: true,
      requiredInProd: Boolean(prewarmWorker && prewarmWorker.enabled),
      status: closureStatusFor(prewarmWorker, 'disabled'),
      runtimeExpectedStatus: closureRuntimeExpectedStatus(prewarmWorker, 'disabled'),
      diagnostics: closureDiagnosticsFor(prewarmWorker),
      sourceToSea: {
        topologySchema: prewarmWorker && prewarmWorker.topologySchema || null,
        ownership: prewarmWorker && prewarmWorker.ownership || {}
      }
    }),
    createProductionCapability({
      key: 'uiCoprocessor',
      label: 'UI Coprocessor',
      supported: Boolean(uiCoprocessor && uiCoprocessor.supported),
      active: Boolean(uiCoprocessor && uiCoprocessor.enabled),
      optional: true,
      requiredInProd: false,
      status: closureStatusFor(uiCoprocessor, 'disabled'),
      runtimeExpectedStatus: closureRuntimeExpectedStatus(uiCoprocessor, 'disabled'),
      diagnostics: closureDiagnosticsFor(uiCoprocessor),
      sourceToSea: {
        eligibleRecordCount: uiCoprocessor && uiCoprocessor.eligibility && uiCoprocessor.eligibility.eligibleRecordCount || 0,
        lanes: uiCoprocessor && uiCoprocessor.lanes || {},
        ownership: uiCoprocessor && uiCoprocessor.ownership || {}
      },
      evidence: {
        releaseBlocking: false,
        pwaAttachment: uiCoprocessor && uiCoprocessor.pwaAttachment || null
      }
    }),
    createProductionCapability({
      key: 'warmReentry',
      label: 'Warm Reentry',
      supported: Boolean(warmReentry && warmReentry.supported !== false),
      active: Boolean(warmReentry && warmReentry.enabled),
      optional: true,
      requiredInProd: Boolean(warmReentry && warmReentry.enabled),
      status: closureStatusFor(warmReentry, 'available'),
      runtimeExpectedStatus: closureRuntimeExpectedStatus(warmReentry, 'idle'),
      ok: warmReentry ? warmReentry.ok : true,
      diagnostics: closureDiagnosticsFor(warmReentry),
      sourceToSea: {
        supportedFiberKinds: warmReentry && warmReentry.supportedFiberKinds || [],
        observedFiberKinds: warmReentry && warmReentry.observedFiberKinds || [],
        sourceToSea: warmReentry && warmReentry.sourceToSea || []
      }
    }),
    createProductionCapability({
      key: 'prerender',
      label: 'Prerender Interop',
      supported: Boolean(workerPrerender || serverPrerender),
      active: Boolean(workerPrerender && workerPrerender.requested || serverPrerender && serverPrerender.requested),
      optional: true,
      requiredInProd: Boolean(workerPrerender && workerPrerender.requested || serverPrerender && serverPrerender.requested),
      status: serverPrerender && serverPrerender.status || workerPrerender && workerPrerender.status || 'available',
      runtimeExpectedStatus: hydration && hydration.enabled ? 'booted' : 'idle',
      diagnostics: []
    }),
    createProductionCapability({
      key: 'templateArtifacts',
      label: 'Template Artifacts',
      supported: Boolean(templateArtifacts && templateArtifacts.supported),
      active: Boolean(templateArtifacts && templateArtifacts.trusted),
      requiredInProd: Boolean(templateArtifacts && templateArtifacts.trusted),
      status: closureStatusFor(templateArtifacts, 'unavailable'),
      runtimeExpectedStatus: templateArtifacts && templateArtifacts.trusted ? 'booted' : 'report-only',
      ok: templateArtifacts ? templateArtifacts.ok : false,
      diagnostics: closureDiagnosticsFor(templateArtifacts),
      evidence: {
        sourceFingerprint: templateArtifacts && templateArtifacts.sourceFingerprint || null,
        artifactBundleFingerprint: templateArtifacts && templateArtifacts.artifactBundleFingerprint || null,
        bundleFingerprint: templateArtifacts && templateArtifacts.bundleFingerprint || null
      }
    })
  ];

  const blockingCapabilities = capabilities.filter((capability) => (
    capability.requiredInProd
    && (
      capability.blocked
      || capability.status === 'fallback'
      || capability.status === 'unavailable'
      || (capability.runtimeExpectedStatus === 'booted' && capability.supported === false)
    )
  ));
  blockingCapabilities.forEach((capability) => {
    diagnostics.push({
      code: 'xtend.maraca.production_closure.capability_blocked',
      severity: prodEnforced ? 'error' : 'warning',
      message: `Production bundle capability ${capability.key} is required but not ready.`,
      capabilityKey: capability.key,
      status: capability.status,
      runtimeExpectedStatus: capability.runtimeExpectedStatus
    });
  });
  if (sizeBudgetReport && sizeBudgetReport.ok === false) {
    diagnostics.push({
      code: 'xtend.maraca.production_closure.size_budget_failed',
      severity: prodEnforced ? 'error' : 'warning',
      message: 'Production bundle closure requires the size budget gate to pass.',
      status: sizeBudgetReport.status,
      bundleBytes: sizeBudgetReport.bundleBytes,
      baselineBytes: sizeBudgetReport.baselineBytes
    });
  }

  const activeCount = capabilities.filter((capability) => capability.active).length;
  const degradedCount = capabilities.filter((capability) => capability.degraded).length;
  const blockedCount = capabilities.filter((capability) => capability.blocked).length;
  const strictFallbackCount = capabilities.filter((capability) => capability.status === 'fallback').length;
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const ok = errorCount === 0 && (!sizeBudgetReport || sizeBudgetReport.ok !== false);

  return {
    schema: MARACA_PRODUCTION_BUNDLE_CLOSURE_SCHEMA,
    ok,
    status: ok ? (degradedCount > 0 ? 'degraded' : 'ready') : 'blocked',
    profile,
    enforced: prodEnforced,
    runtimeExpectedStatus: kernel && kernel.enabled ? 'booted' : 'report-only',
    capabilityCount: capabilities.length,
    activeCount,
    degradedCount,
    blockedCount,
    strictFallbackCount,
    capabilities,
    capabilityKeys: capabilities.map((capability) => capability.key),
    bundleBudget: sizeBudgetReport ? {
      schema: sizeBudgetReport.schema,
      ok: sizeBudgetReport.ok,
      status: sizeBudgetReport.status,
      mode: sizeBudgetReport.mode,
      profile: sizeBudgetReport.profile,
      baselineBytes: sizeBudgetReport.baselineBytes,
      bundleBytes: sizeBudgetReport.bundleBytes,
      runtimeExpectedStatus: kernel && kernel.enabled ? 'booted' : 'report-only'
    } : {
      ok: true,
      status: 'pending',
      runtimeExpectedStatus: kernel && kernel.enabled ? 'booted' : 'report-only'
    },
    releaseConstraint: {
      schema: 'xtend.maraca.production-bundle-release-constraint.v1',
      enforced: prodEnforced,
      blocked: !ok,
      reason: ok ? 'production-bundle-ready' : 'production-bundle-closure-blocked',
      sizeBudgetPass: !sizeBudgetReport || sizeBudgetReport.ok !== false,
      strictFallbackCount,
      blockedCapabilityKeys: blockingCapabilities.map((capability) => capability.key)
    },
    sourceToSea: {
      source: sourceRef,
      sourceFingerprint,
      artifactFingerprints: {
        templateSource: templateArtifacts && templateArtifacts.sourceFingerprint || null,
        templateBundle: templateArtifacts && templateArtifacts.artifactBundleFingerprint || null,
        bundle: bundleFingerprint
      },
      bundle: {
        fileCount: bundleFiles.length,
        entry: options.entryFile && options.entryFile.fileName || null,
        bytes: bundleFiles.reduce((sum, file) => sum + Number(file.bytes || 0), 0)
      },
      runtimeFeatureStatus: capabilities.map((capability) => ({
        key: capability.key,
        supported: capability.supported,
        active: capability.active,
        status: capability.status,
        runtimeExpectedStatus: capability.runtimeExpectedStatus
      })),
      tests: [
        'node scripts/run_xtend_tests.js maraca-bundle-report rmt-stack-docs epic14-rmt-tooling-release-gates --json',
        'node scripts/run_xtend_tests.js maraca-bundle maraca-kernel-orchestration --json'
      ],
      links: capabilities.map((capability) => ({
        capability: capability.key,
        source: sourceRef,
        sourceFingerprint,
        runtimeStatus: capability.status,
        runtimeExpectedStatus: capability.runtimeExpectedStatus,
        bundleFingerprint,
        tests: ['maraca-bundle-report', 'rmt-stack-docs', 'epic14-rmt-tooling-release-gates']
      }))
    },
    diagnostics
  };
}

function createMaracaPwaUrl(fileName) {
  const normalized = toPosix(fileName || '').replace(/^\/+/, '');
  return normalized ? `./${normalized}` : './';
}

function deriveMaracaPwaPrecacheUrls(plan, bundleFiles = []) {
  const pwa = plan && plan.pwa;
  if (!pwa || !pwa.enabled) return [];
  const urls = [];
  bundleFiles.forEach((file) => {
    if (!file || !file.fileName) return;
    urls.push(createMaracaPwaUrl(file.fileName));
  });
  urls.push(createMaracaPwaUrl(pwa.manifest && pwa.manifest.fileName || 'xtend.webmanifest'));
  if (pwa.files && pwa.files.offlineFallback) {
    urls.push(createMaracaPwaUrl(path.basename(pwa.files.offlineFallback)));
  }
  return Array.from(new Set(urls)).sort();
}

function createMaracaWebManifest(plan) {
  const manifest = plan && plan.webAppManifest && plan.webAppManifest.manifest
    || plan && plan.pwa && plan.pwa.manifest
    || {};
  return {
    name: manifest.name || 'XTend Maraca App',
    short_name: manifest.short_name || 'XTend',
    start_url: manifest.start_url || './',
    scope: manifest.scope || './',
    display: manifest.display || 'standalone',
    background_color: manifest.background_color || '#ffffff',
    theme_color: manifest.theme_color || '#1f6f78',
    description: manifest.description || 'Generated XTend Maraca PWA manifest.',
    icons: Array.isArray(manifest.icons) ? manifest.icons : []
  };
}

function createMaracaWebAppManifestReport(plan, copiedAssets = []) {
  const webAppManifest = plan && plan.webAppManifest || createMaracaWebAppManifestPlan(plan || {});
  const copiedByFileName = new Set(copiedAssets.map((asset) => asset.fileName));
  const assets = Array.isArray(webAppManifest.assets) ? webAppManifest.assets.map((asset) => ({
    role: asset.role,
    source: asset.source,
    fileName: asset.fileName,
    sizes: asset.sizes || null,
    type: asset.type || null,
    manifestIcon: asset.manifestIcon === true,
    sourceExists: asset.sourceExists === true,
    copied: copiedByFileName.has(asset.fileName),
    replacementPath: asset.replacementPath || asset.fileName
  })) : [];
  return {
    schema: MARACA_WEB_APP_MANIFEST_REPORT_SCHEMA,
    ok: true,
    status: webAppManifest.enabled ? 'generated' : 'disabled',
    enabled: Boolean(webAppManifest.enabled),
    generated: Boolean(webAppManifest.enabled),
    manifestRef: webAppManifest.manifestRef || './xtend.webmanifest',
    iconDirectory: webAppManifest.iconDirectory || 'icons',
    brandingMode: webAppManifest.brandingMode || 'default-xtend-assets',
    manifest: createMaracaWebManifest({ webAppManifest }),
    manifestIcons: Array.isArray(webAppManifest.manifestIcons) ? webAppManifest.manifestIcons : [],
    htmlLinkHints: Array.isArray(webAppManifest.htmlLinkHints) ? webAppManifest.htmlLinkHints : [],
    assets,
    copiedAssets,
    replacementPaths: Array.isArray(webAppManifest.replacementPaths) ? webAppManifest.replacementPaths : [],
    files: webAppManifest.files || {},
    diagnostics: webAppManifest.diagnostics || [],
    summary: {
      releaseBlocking: false,
      generatedManifest: Boolean(webAppManifest.enabled),
      copiedAssetCount: copiedAssets.length,
      manifestIconCount: Array.isArray(webAppManifest.manifestIcons) ? webAppManifest.manifestIcons.length : 0,
      htmlLinkHintCount: Array.isArray(webAppManifest.htmlLinkHints) ? webAppManifest.htmlLinkHints.length : 0,
      brandingMode: webAppManifest.brandingMode || 'default-xtend-assets'
    }
  };
}

function createMaracaOfflineFallback(plan) {
  const appName = plan && plan.pwa && plan.pwa.manifest && plan.pwa.manifest.name || 'XTend Maraca App';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${appName} Offline</title>
  <style>body{margin:0;font-family:system-ui,sans-serif;background:#f7f9fb;color:#172026;display:grid;min-height:100vh;place-items:center}main{max-width:34rem;padding:2rem}h1{font-size:1.5rem;margin:0 0 .75rem}p{line-height:1.5}</style>
</head>
<body>
  <main>
    <h1>${appName}</h1>
    <p>This generated XTend offline fallback is shown when the app shell cannot be reached from the network or cache.</p>
  </main>
</body>
</html>`;
}

function createMaracaServiceWorkerSource(plan, precacheUrls = []) {
  const pwa = plan && plan.pwa || createMaracaPwaServiceWorkerPlan(plan || {});
  const businessLogicImport = pwa.businessLogicImport || '';
  const offlineFallback = pwa.files && pwa.files.offlineFallback ? createMaracaPwaUrl(path.basename(pwa.files.offlineFallback)) : '';
  return `'use strict';

const XTEND_PWA_SCHEMA = ${JSON.stringify(MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA)};
const XTEND_CACHE_VERSION = ${JSON.stringify(pwa.cacheVersion || 'xtend-maraca-pwa')};
const XTEND_PRECACHE = 'xtend-precache-' + XTEND_CACHE_VERSION;
const XTEND_RUNTIME = 'xtend-runtime-' + XTEND_CACHE_VERSION;
const XTEND_OFFLINE_FALLBACK = ${JSON.stringify(offlineFallback)};
const XTEND_PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};
const XTEND_STATIC_EXTENSIONS = /\\.(?:mjs|js|css|webmanifest|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf)$/i;

/*
 * XTEND SERVICE WORKER BUSINESS LOGIC HOOK
 * Generated network/cache safety lives above and below this hook.
 * Put app-specific cache rules, API policy, auth handling, Background Sync,
 * Push, or offline mutation logic in an imported local script instead of
 * editing this generated file.
 */
const XTEND_BUSINESS_LOGIC_IMPORT = ${JSON.stringify(businessLogicImport)};
if (XTEND_BUSINESS_LOGIC_IMPORT) {
  try {
    importScripts(XTEND_BUSINESS_LOGIC_IMPORT);
  } catch (error) {
    console.warn('[XTend Maraca PWA] business logic import failed', error);
  }
}

function hasSensitiveRequestHeaders(request) {
  return Boolean(request.headers && request.headers.get('authorization'));
}

function isCredentiallessRequest(request) {
  return request && request.credentials === 'omit';
}

function isCacheableResponse(response) {
  if (!response || !response.ok) return false;
  const cacheControl = response.headers && response.headers.get('cache-control');
  return !cacheControl || !/(?:^|,)\\s*(?:no-store|private)\\b/i.test(cacheControl);
}

function sameOrigin(requestUrl) {
  const url = new URL(requestUrl);
  return url.origin === self.location.origin;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCredentiallessRequest(request) && isCacheableResponse(response)) {
    const cache = await caches.open(XTEND_RUNTIME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (XTEND_OFFLINE_FALLBACK) {
      const fallback = await caches.match(XTEND_OFFLINE_FALLBACK);
      if (fallback) return fallback;
    }
    throw error;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(XTEND_PRECACHE)
      .then((cache) => cache.addAll(XTEND_PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('xtend-precache-') || key.startsWith('xtend-runtime-'))
        .filter((key) => key !== XTEND_PRECACHE && key !== XTEND_RUNTIME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (!request || request.method !== 'GET') return;
  if (!sameOrigin(request.url)) return;
  if (hasSensitiveRequestHeaders(request)) return;
  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  if (XTEND_PRECACHE_URLS.includes(url.pathname) || XTEND_PRECACHE_URLS.includes('./' + url.pathname.replace(/^\\//, '')) || XTEND_STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

self.__XTEND_MARACA_PWA_SERVICE_WORKER = Object.freeze({
  schema: XTEND_PWA_SCHEMA,
  cacheVersion: XTEND_CACHE_VERSION,
  cacheMode: ${JSON.stringify(pwa.cacheMode || 'generated-app-shell')},
  offlineEligible: ${JSON.stringify(Boolean(pwa.offlineEligible))},
  businessLogicHook: 'import-script',
  replacesUiCoprocessor: false,
  replacesSsr: false
});
`;
}

function createMaracaPwaReport(plan, bundleFiles = [], precacheUrls = []) {
  const pwa = plan && plan.pwa || createMaracaPwaServiceWorkerPlan(plan || {});
  const webAppManifest = plan && plan.webAppManifest || pwa.webAppManifest || null;
  return {
    schema: MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA,
    ok: true,
    status: pwa.enabled ? 'generated' : 'disabled',
    enabled: Boolean(pwa.enabled),
    generated: Boolean(pwa.enabled),
    strategy: pwa.strategy,
    cacheMode: pwa.cacheMode,
    updateMode: pwa.updateMode,
    cacheVersion: pwa.cacheVersion,
    manifestRef: pwa.manifestRef,
    serviceWorkerRef: pwa.serviceWorkerRef,
    serviceWorkerControlled: false,
    offlineEligible: Boolean(pwa.offlineEligible),
    businessLogicHook: pwa.businessLogicHook,
    businessLogicImport: pwa.businessLogicImport || '',
    files: pwa.files,
    webAppManifest,
    precacheUrls,
    precacheCount: precacheUrls.length,
    bundleFileCount: Array.isArray(bundleFiles) ? bundleFiles.length : 0,
    cssBuild: plan && plan.cssBuild ? {
      provider: plan.cssBuild.resolvedProvider,
      mode: plan.css,
      asset: plan.css === 'external' ? 'xtend.maraca.css' : null,
      evidenceFingerprint: plan.cssBuild.evidence && plan.cssBuild.evidence.fingerprint || null
    } : null,
    runtimeCaching: pwa.runtimeCaching,
    boundaries: pwa.boundaries,
    diagnostics: pwa.diagnostics || [],
    summary: {
      releaseBlocking: false,
      generatedServiceWorker: Boolean(pwa.enabled),
      generatedManifest: Boolean(webAppManifest && webAppManifest.enabled),
      generatedOfflineFallback: Boolean(pwa.enabled && pwa.files && pwa.files.offlineFallback),
      businessLogicHook: pwa.businessLogicHook
    }
  };
}

function createMaracaPwaAssetRecord(filePath, fileName, type = 'asset') {
  return {
    type,
    fileName,
    path: filePath,
    bytes: fs.statSync(filePath).size,
    isEntry: false,
    isDynamicEntry: false,
    imports: [],
    dynamicImports: []
  };
}

function writeMaracaWebAppManifestArtifacts(plan, bundleFiles = []) {
  const webAppManifest = plan && plan.webAppManifest;
  if (!webAppManifest || !webAppManifest.enabled) {
    return {
      report: createMaracaWebAppManifestReport(plan, []),
      files: []
    };
  }
  fs.mkdirSync(path.dirname(webAppManifest.outputs.manifest), { recursive: true });
  fs.mkdirSync(webAppManifest.outputs.iconDirectory, { recursive: true });
  const copiedAssets = [];
  (webAppManifest.assets || []).forEach((asset) => {
    if (!asset || asset.sourceExists !== true) return;
    fs.mkdirSync(path.dirname(asset.outputPath), { recursive: true });
    const sourcePath = path.resolve(asset.sourcePath);
    const outputPath = path.resolve(asset.outputPath);
    if (sourcePath !== outputPath) {
      fs.copyFileSync(sourcePath, outputPath);
    }
    copiedAssets.push({
      role: asset.role,
      source: asset.source,
      fileName: asset.fileName,
      path: asset.outputPath,
      bytes: fs.statSync(asset.outputPath).size,
      type: asset.type || null,
      sizes: asset.sizes || null,
      replacementPath: asset.replacementPath || asset.fileName
    });
  });
  fs.writeFileSync(webAppManifest.outputs.manifest, `${stableJson(createMaracaWebManifest(plan))}\n`);
  const report = createMaracaWebAppManifestReport(plan, copiedAssets);
  writeJson(webAppManifest.outputs.report, report);
  const files = [
    createMaracaPwaAssetRecord(webAppManifest.outputs.manifest, path.basename(webAppManifest.outputs.manifest), 'asset')
  ].concat(copiedAssets.map((asset) => createMaracaPwaAssetRecord(asset.path, asset.fileName, 'asset')));
  files.push(createMaracaPwaAssetRecord(webAppManifest.outputs.report, path.basename(webAppManifest.outputs.report), 'asset'));
  return { report, files };
}

function writeMaracaPwaArtifacts(plan, bundleFiles = []) {
  const pwa = plan && plan.pwa;
  if (!pwa || !pwa.enabled) {
    return {
      report: createMaracaPwaReport(plan, bundleFiles, []),
      files: []
    };
  }
  const precacheUrls = deriveMaracaPwaPrecacheUrls(plan, bundleFiles);
  if (pwa.outputs.offlineFallback) {
    fs.writeFileSync(pwa.outputs.offlineFallback, `${createMaracaOfflineFallback(plan)}\n`);
  }
  fs.writeFileSync(pwa.outputs.serviceWorker, createMaracaServiceWorkerSource(plan, precacheUrls));
  const report = createMaracaPwaReport(plan, bundleFiles, precacheUrls);
  writeJson(pwa.outputs.report, report);
  const files = [
    createMaracaPwaAssetRecord(pwa.outputs.serviceWorker, path.basename(pwa.outputs.serviceWorker))
  ];
  if (pwa.outputs.offlineFallback) {
    files.push(createMaracaPwaAssetRecord(pwa.outputs.offlineFallback, path.basename(pwa.outputs.offlineFallback)));
  }
  files.push(createMaracaPwaAssetRecord(pwa.outputs.report, path.basename(pwa.outputs.report)));
  return { report, files };
}

function createBundleReport(plan, bundleFiles, sizeBudgetReport, options = {}) {
  const repoRoot = plan.rootDir || path.dirname(path.dirname(__filename));
  const entryFile = bundleFiles.find((file) => file.isEntry) || {
    path: plan.outputs.entry,
    fileName: path.basename(plan.outputs.entry),
    bytes: fs.existsSync(plan.outputs.entry) ? fs.statSync(plan.outputs.entry).size : 0
  };
  const totalBytes = bundleFiles.reduce((sum, file) => sum + Number(file.bytes || 0), 0) || entryFile.bytes;
  const kernelFeatureAdoption = plan.kernel && plan.kernel.featureAdoption
    ? plan.kernel.featureAdoption
    : createMaracaKernelFeatureAdoptionReport({
        rootDir: repoRoot,
        enabled: Boolean(plan.kernel && plan.kernel.enabled),
        runtimeModules: plan.runtimeModules || []
      });
  const kernelProductSurface = plan.kernel && plan.kernel.productSurface
    ? plan.kernel.productSurface
    : createMaracaKernelProductSurfaceReport({
        rootDir: repoRoot,
        bootMode: plan.kernel && plan.kernel.bootMode || 'direct'
      });
  const kernelPrewarmWorker = plan.kernel && plan.kernel.prewarmWorker
    ? plan.kernel.prewarmWorker
    : createMaracaPrewarmWorkerRuntimeReport(plan.kernel, plan);
  const kernelPanicRecovery = plan.kernel && plan.kernel.panicRecovery
    ? plan.kernel.panicRecovery
    : createMaracaPanicRecoveryReport({
        rootDir: repoRoot,
        enabled: Boolean(plan.kernel && plan.kernel.enabled),
        runtimeModules: plan.kernel && plan.kernel.runtimeModules || plan.runtimeModules || []
      });
  const kernelTrustedDom = plan.kernel && plan.kernel.trustedDom
    ? plan.kernel.trustedDom
    : createMaracaTrustedDomReport({
        panicRecovery: kernelPanicRecovery
      });
  const kernelPolicyParity = plan.kernel && plan.kernel.policyParity
    ? plan.kernel.policyParity
    : createMaracaPolicyParityReport({
        rootDir: repoRoot,
        enabled: Boolean(plan.kernel && plan.kernel.enabled),
        strict: Boolean(plan.kernel && plan.kernel.strict),
        runtimeModules: plan.kernel && plan.kernel.runtimeModules || plan.runtimeModules || [],
        panicRecovery: kernelPanicRecovery,
        trustedDom: kernelTrustedDom
      });
  const kernelSecurity = plan.kernel && plan.kernel.security
    ? plan.kernel.security
    : {
        schema: 'xtend.maraca.kernel-security-report.v1',
        supported: Boolean(plan.kernel && plan.kernel.enabled),
        status: kernelPolicyParity.ok && kernelPanicRecovery.enabled && kernelTrustedDom.supported ? 'available' : 'degraded',
        panicRecovery: kernelPanicRecovery,
        trustedDom: kernelTrustedDom,
        policyParity: kernelPolicyParity,
        diagnostics: []
      };
  const templateArtifacts = finalizeMaracaTemplateArtifactsReport(
    plan.templateArtifacts || createMaracaTemplateArtifactsReport({
      rootDir: repoRoot,
      status: 'unavailable'
    }),
    bundleFiles,
    repoRoot
  );
  const performance = finalizeMaracaPerformanceReport(
    plan.performance || createMaracaPerformanceReport({
      rootDir: repoRoot,
      status: 'unavailable'
    }),
    bundleFiles,
    repoRoot,
    {
      runtimeExpectedStatus: plan.kernel && plan.kernel.enabled ? 'booted' : 'report-only'
    }
  );
  const productionClosure = createMaracaProductionBundleClosure(plan, sizeBudgetReport, {
    bundleFiles,
    entryFile,
    repoRoot
  });
  const webAppManifestReport = options.webAppManifestReport || createMaracaWebAppManifestReport(plan, []);
  const pwaReport = options.pwaReport || createMaracaPwaReport(plan, bundleFiles, deriveMaracaPwaPrecacheUrls(plan, bundleFiles));
  const serviceBuildReport = options.serviceBuildReport || {
    schema: MARACA_SERVICE_BUILD_REPORT_SCHEMA,
    ok: true,
    status: plan.services && plan.services.enabled ? 'planned' : 'disabled',
    files: [],
    manifest: plan.services && plan.services.manifest || null,
    diagnostics: plan.services && plan.services.diagnostics || []
  };
  const serviceArtifacts = (serviceBuildReport.files || []).filter((filePath) => {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch (_) {
      return false;
    }
  }).map((filePath) => {
    const relative = repoRelative(filePath, repoRoot);
    const target = relative.includes('/server/') || relative.endsWith('.mjs') ? 'node'
      : relative.endsWith('.php-report.json') ? 'php'
      : 'shared';
    return {
      path: relative,
      target,
      bytes: fs.statSync(filePath).size,
      integrity: `sha256:${hashText(fs.readFileSync(filePath))}`
    };
  });

  return {
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    ok: productionClosure.ok && (!sizeBudgetReport || sizeBudgetReport.ok !== false),
    status: productionClosure.ok && (!sizeBudgetReport || sizeBudgetReport.ok !== false) ? 'built' : 'blocked',
    configFingerprint: plan.configFingerprint || null,
    source: plan.source,
    outputDir: repoRelative(plan.outputDir, repoRoot),
    profile: plan.profile,
    lazy: plan.lazy,
    css: plan.css,
    cssBuild: plan.cssBuild || null,
    vendor: plan.vendor,
    componentMode: plan.componentMode,
    stackMode: plan.stackMode,
    target: 'modern-esm',
    services: {
      schema: MARACA_SERVICE_BUILD_REPORT_SCHEMA,
      enabled: Boolean(plan.services && plan.services.enabled),
      ok: serviceBuildReport.ok !== false,
      status: serviceBuildReport.status,
      targets: plan.services && plan.services.targets || [],
      manifest: serviceBuildReport.manifest || plan.services && plan.services.manifest || null,
      files: (serviceBuildReport.files || []).map((filePath) => repoRelative(filePath, repoRoot)),
      diagnostics: serviceBuildReport.diagnostics || [],
      warnings: serviceBuildReport.warnings || [],
      fingerprint: plan.serviceGraphFingerprint || null,
      bytes: {
        client: sizeBudgetReport && sizeBudgetReport.appServices ? sizeBudgetReport.appServices.clientBytes : 0,
        server: sizeBudgetReport && sizeBudgetReport.appServices ? sizeBudgetReport.appServices.serverBytes : 0
      },
      budgets: plan.services && plan.services.budgets || { clientBytes: null, serverBytes: null },
      targetFacts: (plan.services && plan.services.targets || []).map((target) => ({
        target,
        enabled: true,
        isolated: true,
        entry: plan.services && plan.services.entries && (
          target === 'browser' ? plan.services.entries.client && plan.services.entries.client.relative
            : target === 'node' ? plan.services.entries.server && plan.services.entries.server.relative
              : plan.services.entries.php && plan.services.entries.php.relative
        ) || null
      })),
      artifacts: serviceArtifacts,
      integrity: {
        manifestFingerprint: serviceBuildReport.manifest && serviceBuildReport.manifest.fingerprint || plan.services && plan.services.manifest && plan.services.manifest.fingerprint || null,
        serviceGraphFingerprint: plan.serviceGraphFingerprint || null,
        artifactCount: serviceArtifacts.length,
        artifactFingerprints: serviceArtifacts.map((artifact) => artifact.integrity)
      }
    },
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
      dynamicImports: file.dynamicImports,
      modules: file.modules || [],
      appServiceBytes: Number(file.appServiceBytes || 0),
      frameworkBytes: Number(file.frameworkBytes === undefined ? file.bytes || 0 : file.frameworkBytes)
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
    rmtApp: createRmtAppRuntimeReport(plan),
    kernelFeatureAdoption,
    kernelFeatureAdoptionClosure: productionClosure,
    productionClosure,
    templateArtifacts,
    performance,
    panicRecovery: kernelPanicRecovery,
    trustedDom: kernelTrustedDom,
    policyParity: kernelPolicyParity,
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
      bootMode: plan.kernel.bootMode || 'direct',
      enabled: plan.kernel.enabled,
      status: plan.kernel.status,
      planStatus: plan.kernel.status,
      runtimeExpectedStatus: plan.kernel.enabled ? 'booted' : 'disabled',
      supported: plan.kernel.supported,
      artifactSchema: plan.kernel.artifact && plan.kernel.artifact.schema || null,
      recordsSchema: plan.kernel.artifact && plan.kernel.artifact.records && plan.kernel.artifact.records.schema || null,
      runtimeModules: plan.kernel.runtimeModules,
      featureAdoption: kernelFeatureAdoption,
      productSurface: kernelProductSurface,
      prewarmWorker: kernelPrewarmWorker,
      panicRecovery: kernelPanicRecovery,
      trustedDom: kernelTrustedDom,
      policyParity: kernelPolicyParity,
      security: kernelSecurity,
      performanceSummary: performance && performance.summary || null,
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
      workerPrerender: plan.hydration.workerPrerender || plan.hydration.summary && plan.hydration.summary.workerPrerender || null,
      uiCoprocessor: plan.hydration.uiCoprocessor || plan.hydration.summary && plan.hydration.summary.uiCoprocessor || null,
      serverPrerender: plan.hydration.serverPrerender || plan.hydration.summary && plan.hydration.summary.serverPrerender || null,
      summary: plan.hydration.summary,
      diagnostics: plan.hydration.diagnostics
    } : null,
    warmReentry: plan.warmReentry ? {
      schema: plan.warmReentry.schema,
      ok: plan.warmReentry.ok,
      enabled: plan.warmReentry.enabled,
      status: plan.warmReentry.status,
      runtimeExpectedStatus: plan.warmReentry.runtimeExpectedStatus,
      optional: plan.warmReentry.optional,
      supportedFiberKinds: plan.warmReentry.supportedFiberKinds,
      observedFiberKinds: plan.warmReentry.observedFiberKinds,
      backpressurePolicy: plan.warmReentry.backpressurePolicy,
      destroyInvalidation: plan.warmReentry.destroyInvalidation,
      summary: plan.warmReentry.summary,
      diagnostics: plan.warmReentry.diagnostics
    } : null,
    uiCoprocessor: plan.uiCoprocessor || null,
    webAppManifest: webAppManifestReport,
    pwa: pwaReport,
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
    lifecycle: plan.lifecycle ? {
      schema: plan.lifecycle.schema,
      ok: plan.lifecycle.ok,
      status: plan.lifecycle.status,
      strict: plan.lifecycle.strict,
      runtimeExpectedStatus: plan.lifecycle.runtimeExpectedStatus,
      supportedOperations: plan.lifecycle.supportedOperations,
      requiresDestroyChain: plan.lifecycle.requiresDestroyChain,
      surfaceDestroyReleaseCount: plan.lifecycle.surfaceDestroyReleaseCount,
      disposeOnSurfaceDestroyResourceCount: plan.lifecycle.disposeOnSurfaceDestroyResourceCount,
      destroyOnCloseSurfaceCount: plan.lifecycle.destroyOnCloseSurfaceCount,
      sourceToSea: plan.lifecycle.sourceToSea,
      diagnostics: plan.lifecycle.diagnostics
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
  let contractPayloadBytes = 0;
  try {
    contractPayloadBytes = Buffer.byteLength(JSON.stringify({
      orchestration: plan.orchestration && plan.orchestration.artifact || null,
      kernel: plan.kernel && plan.kernel.artifact || null,
      hydration: plan.hydration && plan.hydration.artifact || null,
      validation: plan.validation && plan.validation.artifact || null,
      transitions: plan.transitions && plan.transitions.artifact || null,
      templateArtifacts: plan.templateArtifacts && plan.templateArtifacts.summary || null,
      performance: plan.performance && plan.performance.summary || null
    }));
  } catch (_) {
    contractPayloadBytes = 0;
  }
  const baselineBytes = loaderBytes + selectedBytes + stackBytes + contractPayloadBytes;
  const bundleFiles = Array.isArray(input.bundleFiles) ? input.bundleFiles : [];
  const bundleBytes = Number(input.entryBytes || 0);
  const clientAppServiceBytes = bundleFiles.reduce((sum, file) => sum + Number(file && file.appServiceBytes || 0), 0);
  const frameworkBundleBytes = Math.max(0, bundleBytes - clientAppServiceBytes);
  const serverEntryPath = plan.services && plan.services.outputs && plan.services.outputs.serverEntry || null;
  let serverAppServiceBytes = 0;
  try {
    serverAppServiceBytes = serverEntryPath && fs.existsSync(serverEntryPath) ? fs.statSync(serverEntryPath).size : 0;
  } catch (_) {
    serverAppServiceBytes = 0;
  }
  const serviceBudgets = plan.services && plan.services.budgets || {};
  const clientBudgetBytes = Number(serviceBudgets.clientBytes || 0) || null;
  const serverBudgetBytes = Number(serviceBudgets.serverBytes || 0) || null;
  const clientWithinBudget = clientBudgetBytes === null || clientAppServiceBytes <= clientBudgetBytes;
  const serverWithinBudget = serverBudgetBytes === null || serverAppServiceBytes <= serverBudgetBytes;
  const appServicesWithinBudget = clientWithinBudget && serverWithinBudget;
  const cssBytes = Number(plan.cssBuild && plan.cssBuild.evidence && plan.cssBuild.evidence.bytes || input.cssBytes || 0);
  const cssBudgetBytes = Number(plan.cssBuild && plan.cssBuild.budgetBytes || 0) || null;
  const cssWithinBudget = cssBudgetBytes === null || cssBytes <= cssBudgetBytes;
  const ratio = baselineBytes > 0 ? frameworkBundleBytes / baselineBytes : 1;
  const budgetMode = plan.sizeBudgetMode || 'strict';
  const enforced = plan.profile !== 'debug' && budgetMode === 'strict';
  const frameworkWithinBudget = enforced ? baselineBytes > 0 && frameworkBundleBytes < baselineBytes : true;
  const ok = frameworkWithinBudget && cssWithinBudget && appServicesWithinBudget;

  return {
    schema: MARACA_SIZE_BUDGET_REPORT_SCHEMA,
    ok,
    status: !cssWithinBudget
      ? 'css_over_budget'
      : !appServicesWithinBudget
      ? 'app_services_over_budget'
      : enforced
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
      contractPayloadBytes,
      bytes: baselineBytes
    },
    baselineBytes,
    bundleBytes,
    framework: {
      bytes: frameworkBundleBytes,
      baselineBytes,
      withinBudget: frameworkWithinBudget
    },
    appServices: {
      clientBytes: clientAppServiceBytes,
      clientBudgetBytes,
      clientWithinBudget,
      serverBytes: serverAppServiceBytes,
      serverBudgetBytes,
      serverWithinBudget,
      withinBudget: appServicesWithinBudget
    },
    css: {
      provider: plan.cssBuild && plan.cssBuild.resolvedProvider || DEFAULT_CSS_PROVIDER,
      bytes: cssBytes,
      budgetBytes: cssBudgetBytes,
      withinBudget: cssWithinBudget,
      requestFingerprint: plan.cssBuild && plan.cssBuild.requestFingerprint || null,
      configFingerprint: plan.cssBuild && plan.cssBuild.configFingerprint || null,
      evidenceFingerprint: plan.cssBuild && plan.cssBuild.evidence && plan.cssBuild.evidence.fingerprint || null,
      outputFingerprint: plan.cssBuild && plan.cssBuild.evidence && plan.cssBuild.evidence.outputFingerprint || null,
      sourceFingerprints: plan.cssBuild && plan.cssBuild.evidence && plan.cssBuild.evidence.sourceFingerprints || []
    },
    ratio,
    budgets: {
      modernEsmEntryMustBeSmallerThanBaseline: enforced,
      enforcement: budgetMode,
      frameworkBytes: baselineBytes,
      clientAppServiceBytes: clientBudgetBytes,
      serverAppServiceBytes: serverBudgetBytes
    }
  };
}

function executeNativeCssProviderSync(plan) {
  const cssText = createCssText(plan);
  const artifact = createCssArtifact({
    status: 'ready',
    mode: plan.css,
    fileName: plan.css === 'external' ? 'xtend.maraca.css' : null,
    cssText
  });
  const providerPlan = {
    schema: MARACA_CSS_BUILD_PLAN_SCHEMA,
    status: 'ready',
    provider: DEFAULT_CSS_PROVIDER,
    mode: plan.css,
    steps: ['create-native-css'],
    fingerprint: hashText(stableJson({ provider: DEFAULT_CSS_PROVIDER, request: plan.cssBuild.requestFingerprint }))
  };
  const evidence = createCssBuildEvidence({
    contract: plan.cssBuild.contract,
    request: plan.cssBuild.request,
    plan: providerPlan,
    artifact,
    status: 'ready',
    diagnostics: plan.cssBuild.diagnostics
  });
  plan.cssBuild = {
    ...plan.cssBuild,
    status: 'ready',
    providerPlan,
    artifact: { ...artifact, cssText: undefined },
    evidence,
    lifecycle: ['inspect', 'plan', 'build', 'report', 'dispose']
  };
  return { ok: true, cssText, artifact, evidence };
}

async function executeCssProvider(plan, input, options) {
  const normalized = normalizeOptions(input, options);
  if (plan.cssBuild && plan.cssBuild.resolvedProvider !== normalized.cssProvider) {
    normalized.cssProvider = plan.cssBuild.resolvedProvider;
  }
  const resolution = resolveCssProvider(normalized);
  if (!resolution.implementation) {
    return { ok: false, status: 'blocked', diagnostics: resolution.diagnostics };
  }
  const provider = resolution.resolvedProvider === DEFAULT_CSS_PROVIDER
    ? createNativeMaracaCssProvider({ buildCss: () => createCssText(plan) })
    : resolution.implementation;
  const result = await runCssProviderLifecycle(provider, plan.cssBuild.request);
  plan.cssBuild = {
    ...plan.cssBuild,
    status: result.status,
    contract: result.contract,
    inspection: result.inspection,
    providerPlan: result.plan,
    artifact: result.artifact ? { ...result.artifact, cssText: undefined } : null,
    evidence: result.evidence,
    diagnostics: result.diagnostics,
    lifecycle: result.lifecycle
  };
  if (result.diagnostics.length > 0) plan.diagnostics.push(...result.diagnostics);
  return {
    ...result,
    cssText: result.artifact && result.artifact.cssText || ''
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

  if (plan.services && plan.services.enabled) {
    const diagnostic = {
      code: 'xtend.maraca.services.async_build_required',
      severity: 'error',
      message: 'TypeScript AppServices require buildMaracaBundleAsync() with the Rollup toolchain.'
    };
    plan.diagnostics.push(diagnostic);
    return { schema: MARACA_BUNDLE_REPORT_SCHEMA, ok: false, status: 'service_build_requires_rollup', plan, bundleReport: null, sizeBudgetReport: null };
  }

  fs.mkdirSync(plan.outputDir, { recursive: true });
  if (plan.cssBuild.resolvedProvider !== DEFAULT_CSS_PROVIDER) {
    const diagnostic = {
      code: 'xtend.maraca.css_provider.async_required',
      severity: 'error',
      message: `CSS provider ${plan.cssBuild.resolvedProvider} requires buildMaracaBundleAsync().`
    };
    plan.diagnostics.push(diagnostic);
    return { schema: MARACA_BUNDLE_REPORT_SCHEMA, ok: false, status: 'css_provider_blocked', plan, bundleReport: null, sizeBudgetReport: null };
  }
  const cssResult = executeNativeCssProviderSync(plan);
  const kernelRuntimeAsset = copyKernelRuntimeAsset(plan);
  const kernelResumeRuntimeAsset = copyKernelResumeRuntimeAsset(plan);
  const kernelControllerRuntimeAsset = copyKernelControllerRuntimeAsset(plan);
  const entryPath = plan.outputs.entry;
  const rawSource = createBundleSource(plan, cssResult.cssText);
  const source = plan.profile === 'debug' ? rawSource : minifyLocalEsModule(rawSource);
  fs.writeFileSync(entryPath, `${source}\n`);

  if (plan.css === 'external' && plan.outputs.css) {
    fs.writeFileSync(plan.outputs.css, `${cssResult.cssText}\n`);
  }

  const entryBytes = fs.statSync(entryPath).size;
  const sizeBudgetReport = createMaracaSizeBudgetReport({
    plan,
    entryPath,
    entryBytes
  });
  let bundleFiles = [{
    type: 'chunk',
    fileName: path.basename(entryPath),
    path: entryPath,
    bytes: entryBytes,
    isEntry: true,
    isDynamicEntry: false,
    imports: [],
    dynamicImports: []
  }];
  if (plan.css === 'external' && plan.outputs.css) {
    bundleFiles.push(createMaracaPwaAssetRecord(plan.outputs.css, path.basename(plan.outputs.css)));
  }
  bundleFiles = bundleFiles
    .concat(kernelControllerRuntimeAsset ? [kernelControllerRuntimeAsset] : [])
    .concat(kernelRuntimeAsset ? [kernelRuntimeAsset] : [])
    .concat(kernelResumeRuntimeAsset ? [kernelResumeRuntimeAsset] : []);
  bundleFiles.push(writeMaracaHtmlHost(plan));
  const webAppManifestArtifacts = writeMaracaWebAppManifestArtifacts(plan, bundleFiles);
  bundleFiles = bundleFiles.concat(webAppManifestArtifacts.files);
  const pwaArtifacts = writeMaracaPwaArtifacts(plan, bundleFiles);
  bundleFiles = bundleFiles.concat(pwaArtifacts.files);
  const bundleReport = createBundleReport(plan, bundleFiles, sizeBudgetReport, {
    activeToolchain: 'local-esm-importgraph-fallback',
    webAppManifestReport: webAppManifestArtifacts.report,
    pwaReport: pwaArtifacts.report
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

  const cssResult = await executeCssProvider(plan, input, options);
  if (!cssResult.ok) {
    return {
      schema: MARACA_BUNDLE_REPORT_SCHEMA,
      ok: false,
      status: 'css_provider_failed',
      plan,
      bundleReport: null,
      sizeBudgetReport: null
    };
  }

  fs.mkdirSync(plan.outputDir, { recursive: true });
  const rollupTool = requireOptional('rollup', plan.rootDir);
  const serviceBuildReport = await buildMaracaServiceArtifacts(plan.services, {
    rollupModule: rollupTool.available ? rollupTool.module : null
  });
  if (!serviceBuildReport.ok) {
    return {
      schema: MARACA_BUNDLE_REPORT_SCHEMA,
      ok: false,
      status: 'service_build_failed',
      plan: {
        ...plan,
        diagnostics: plan.diagnostics.concat(serviceBuildReport.diagnostics || [])
      },
      serviceBuildReport,
      bundleReport: null,
      sizeBudgetReport: null
    };
  }
  const kernelRuntimeAsset = copyKernelRuntimeAsset(plan);
  const kernelResumeRuntimeAsset = copyKernelResumeRuntimeAsset(plan);
  const kernelControllerRuntimeAsset = copyKernelControllerRuntimeAsset(plan);
  const rawSource = createBundleSource(plan, cssResult.cssText);
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
    fs.writeFileSync(plan.outputs.css, `${cssResult.cssText}\n`);
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
  if (kernelResumeRuntimeAsset) {
    rollupResult.files.push(kernelResumeRuntimeAsset);
  }
  rollupResult.files.push(writeMaracaHtmlHost(plan));
  const webAppManifestArtifacts = writeMaracaWebAppManifestArtifacts(plan, rollupResult.files);
  rollupResult.files.push(...webAppManifestArtifacts.files);
  const pwaArtifacts = writeMaracaPwaArtifacts(plan, rollupResult.files);
  rollupResult.files.push(...pwaArtifacts.files);

  const entryFile = rollupResult.files.find((file) => file.isEntry) || {
    path: plan.outputs.entry,
    bytes: fs.existsSync(plan.outputs.entry) ? fs.statSync(plan.outputs.entry).size : 0
  };
  const bundleBytes = rollupResult.files.reduce((sum, file) => sum + Number(file.bytes || 0), 0);
  const sizeBudgetReport = createMaracaSizeBudgetReport({
    plan,
    entryPath: entryFile.path,
    entryBytes: bundleBytes,
    bundleFiles: rollupResult.files
  });
  const bundleReport = createBundleReport(plan, rollupResult.files, sizeBudgetReport, {
    activeToolchain: 'rollup-terser',
    warnings: rollupResult.warnings,
    nameCache: rollupResult.nameCache,
    serviceBuildReport,
    webAppManifestReport: webAppManifestArtifacts.report,
    pwaReport: pwaArtifacts.report
  });

  writeJson(plan.outputs.bundleReport, bundleReport);
  writeJson(plan.outputs.sizeBudgetReport, sizeBudgetReport);

  return {
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    ok: bundleReport.ok && sizeBudgetReport.ok,
    status: bundleReport.ok && sizeBudgetReport.ok ? 'built' : 'built_over_budget',
    plan,
    serviceBuildReport,
    bundleReport,
    sizeBudgetReport
  };
}

const MARACA_TUNE_SEMANTIC_KEYS = Object.freeze([
  'services',
  'orchestration',
  'kernel',
  'kernelBootMode',
  'hydration',
  'validation',
  'transitions',
  'componentMode',
  'stackMode',
  'enablePrewarmWorker',
  'enableUiCoprocessor',
  'enablePwa',
  'enableServiceWorker',
  'enableWebAppManifest',
  'allowDynamicComponents',
  'cssProvider',
  'cssInput',
  'cssSources',
  'cssPreflight',
  'cssBudget',
  'cssProviderFallback'
]);

function maracaTuneCandidateId(profile, lazy, css) {
  return `${profile}-${lazy}-${css}`;
}

function maracaTunePreference(candidate) {
  const profilePreference = { production: 0, max: 1 }[candidate.profile];
  const lazyPreference = { route: 0, component: 1, none: 2 }[candidate.lazy];
  const cssPreference = { external: 0, inline: 1 }[candidate.css];
  const profile = profilePreference === undefined ? 9 : profilePreference;
  const lazy = lazyPreference === undefined ? 9 : lazyPreference;
  const css = cssPreference === undefined ? 9 : cssPreference;
  return [profile, lazy, css];
}

function compareMaracaTuneCandidates(left, right) {
  const metrics = ['frameworkBytes', 'appServiceBytes', 'eagerBytes', 'totalBytes', 'eagerRequests', 'chunkCount'];
  for (const metric of metrics) {
    const delta = Number(left.metrics[metric] || 0) - Number(right.metrics[metric] || 0);
    if (delta !== 0) return delta;
  }
  const leftPreference = maracaTunePreference(left);
  const rightPreference = maracaTunePreference(right);
  for (let index = 0; index < leftPreference.length; index += 1) {
    if (leftPreference[index] !== rightPreference[index]) return leftPreference[index] - rightPreference[index];
  }
  return left.id.localeCompare(right.id);
}

function maracaTuneCandidateRecord(result, requested) {
  const report = result && result.bundleReport;
  const files = report && Array.isArray(report.bundleFiles) ? report.bundleFiles : [];
  const diagnostics = result && result.plan && Array.isArray(result.plan.diagnostics) ? result.plan.diagnostics : [];
  const hydrationRecords = result && result.plan && result.plan.hydration
    && result.plan.hydration.artifact && Array.isArray(result.plan.hydration.artifact.records)
    ? result.plan.hydration.artifact.records
    : [];
  const declaredDeferredPolicies = hydrationRecords.filter((record) => {
    const policy = String(record && record.policy || '').toLowerCase();
    return Boolean(record && record.explicitPolicy)
      && !['', 'eager', 'immediate', 'component-load'].includes(policy);
  });
  const declaredPolicyPreserved = requested.lazy !== 'none' || declaredDeferredPolicies.length === 0;
  const activeToolchain = report && report.toolchain && report.toolchain.active || 'unavailable';
  const closureOk = Boolean(report && report.productionClosure && report.productionClosure.ok);
  const sizeBudgetOk = Boolean(result && result.sizeBudgetReport && result.sizeBudgetReport.ok);
  const errorCount = diagnostics.filter((diagnostic) => diagnostic && diagnostic.severity === 'error').length;
  const warningCount = (report && report.toolchain && Array.isArray(report.toolchain.warnings) ? report.toolchain.warnings.length : 0)
    + diagnostics.filter((diagnostic) => diagnostic && diagnostic.severity === 'warning').length;
  const accepted = Boolean(result && result.ok)
    && activeToolchain === 'rollup-terser'
    && closureOk
    && sizeBudgetOk
    && declaredPolicyPreserved
    && diagnostics.length === 0;
  return {
    id: maracaTuneCandidateId(requested.profile, requested.lazy, requested.css),
    profile: requested.profile,
    lazy: requested.lazy,
    css: requested.css,
    accepted,
    status: result && result.status || 'failed',
    reason: activeToolchain !== 'rollup-terser'
      ? 'rollup-terser-required'
      : (!closureOk
        ? 'production-closure-failed'
        : (!sizeBudgetOk
          ? 'size-budget-failed'
          : (!declaredPolicyPreserved
            ? 'declared-lazy-policy-overridden'
            : (diagnostics.length > 0 ? 'diagnostics-failed' : 'accepted')))),
    declaredPolicyPreserved,
    declaredDeferredPolicyCount: declaredDeferredPolicies.length,
    metrics: {
      frameworkBytes: Number(result && result.sizeBudgetReport && result.sizeBudgetReport.framework && result.sizeBudgetReport.framework.bytes || 0),
      appServiceBytes: Number(result && result.sizeBudgetReport && result.sizeBudgetReport.appServices && result.sizeBudgetReport.appServices.clientBytes || 0),
      serverAppServiceBytes: Number(result && result.sizeBudgetReport && result.sizeBudgetReport.appServices && result.sizeBudgetReport.appServices.serverBytes || 0),
      eagerBytes: files.filter((file) => file && file.isDynamicEntry !== true).reduce((sum, file) => sum + Number(file.bytes || 0), 0),
      totalBytes: Number(report && report.bytes || 0),
      cssBytes: Number(result && result.sizeBudgetReport && result.sizeBudgetReport.css && result.sizeBudgetReport.css.bytes || 0),
      eagerRequests: files.filter((file) => file && file.isDynamicEntry !== true).length,
      chunkCount: files.filter((file) => file && file.type === 'chunk').length
    },
    toolchain: activeToolchain,
    warningCount,
    diagnosticCount: diagnostics.length,
    errorCount
  };
}

function createMaracaTuneConfig(input = {}) {
  const base = {
    schema: MARACA_BUILD_CONFIG_SCHEMA,
    source: input.source,
    sourceFingerprint: input.sourceFingerprint,
    serviceGraphFingerprint: input.serviceGraphFingerprint || null,
    output: input.output,
    selected: input.selected,
    locked: input.locked,
    options: input.options,
    toolchain: input.toolchain,
    candidateMatrixFingerprint: input.candidateMatrixFingerprint
  };
  return {
    ...base,
    configFingerprint: hashText(stableJson(base))
  };
}

async function tuneMaracaBuild(input = {}, options = {}) {
  const explicit = normalizeInput(input);
  const rootDir = resolveRootDir(options.rootDir || explicit.rootDir);
  const write = toBoolean(explicit.write);
  const check = toBoolean(explicit.check);
  const requestedConfigPath = explicit.config || explicit.configPath || explicit['build-config'];
  const configPath = path.resolve(rootDir, String(requestedConfigPath || 'maraca.config.json'));
  const existingConfig = fs.existsSync(configPath) ? readJson(configPath) : null;
  const configuredOptions = existingConfig && existingConfig.schema === MARACA_BUILD_CONFIG_SCHEMA && existingConfig.options && typeof existingConfig.options === 'object'
    ? existingConfig.options
    : {};
  const mergedInput = { ...configuredOptions, ...explicit };
  delete mergedInput.config;
  delete mergedInput.configPath;
  delete mergedInput['build-config'];
  delete mergedInput.write;
  delete mergedInput.check;
  const normalized = normalizeOptions(mergedInput, { rootDir });
  const diagnostics = [];

  if (write && check) {
    diagnostics.push({
      code: 'xtend.maraca.tune_mode_conflict',
      severity: 'error',
      message: 'Maraca tune accepts either --write or --check, not both.'
    });
  }
  if (check && !existingConfig) {
    diagnostics.push({
      code: 'xtend.maraca.tune_config_missing',
      severity: 'error',
      message: `Tune config not found: ${configPath}`
    });
  }
  if (typeof normalized.sourceText !== 'string' && !fs.existsSync(normalized.sourcePath)) {
    diagnostics.push({
      code: 'xtend.maraca.tune_source_missing',
      severity: 'error',
      message: `RMT source not found: ${normalized.sourcePath}`
    });
  }
  const toolchain = getMaracaToolchainAvailability(rootDir);
  if (!toolchain.rollup.available || !toolchain.terser.available) {
    diagnostics.push({
      code: 'xtend.maraca.tune_toolchain_unavailable',
      severity: 'error',
      message: 'Maraca tune requires local Rollup and Terser APIs.'
    });
  }
  if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return {
      schema: MARACA_TUNE_REPORT_SCHEMA,
      ok: false,
      status: 'blocked',
      configPath: repoRelative(configPath, rootDir),
      candidates: [],
      diagnostics
    };
  }

  const sourceText = typeof normalized.sourceText === 'string' ? normalized.sourceText : fs.readFileSync(normalized.sourcePath, 'utf8');
  const sourceFingerprint = hashText(sourceText);
  const serviceGraphFingerprint = createMaracaServiceSourceFingerprint(normalized.services, rootDir);
  const outputDir = normalized.outputDir;
  const semanticOptions = {
    services: normalized.services,
    orchestration: normalized.orchestration,
    kernel: normalized.kernel,
    kernelBootMode: normalized.kernelBootMode,
    hydration: normalized.hydration,
    validation: normalized.validation,
    transitions: normalized.transitions,
    componentMode: normalized.componentMode,
    stackMode: normalized.stackMode,
    enablePrewarmWorker: normalized.enablePrewarmWorker,
    enableUiCoprocessor: normalized.enableUiCoprocessor,
    enablePwa: normalized.enablePwa,
    enableServiceWorker: normalized.enableServiceWorker,
    enableWebAppManifest: normalized.enableWebAppManifest,
    allowDynamicComponents: normalized.allowDynamicComponents,
    cssProvider: normalized.cssProvider,
    cssInput: normalized.cssInput,
    cssSources: normalized.cssSources,
    cssPreflight: normalized.cssPreflight,
    cssBudget: normalized.cssBudget,
    cssProviderFallback: normalized.cssProviderFallback
  };
  const candidateDefinitions = [];
  ['production', 'max'].forEach((profile) => {
    ['route', 'component', 'none'].forEach((lazy) => {
      ['inline', 'external'].forEach((css) => candidateDefinitions.push({ profile, lazy, css }));
    });
  });
  const candidateMatrixFingerprint = hashText(stableJson({
    sourceFingerprint,
    serviceGraphFingerprint,
    semanticOptions,
    candidates: candidateDefinitions,
    toolchain: { rollup: toolchain.rollup.version || null, terser: toolchain.terser.version || null }
  }));
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-maraca-tune-'));
  const candidates = [];

  try {
    for (const definition of candidateDefinitions) {
      const candidateOutput = path.join(tempRoot, maracaTuneCandidateId(definition.profile, definition.lazy, definition.css));
      const result = await buildMaracaBundleAsync({
        ...mergedInput,
        ...semanticOptions,
        ...definition,
        source: normalized.source,
        sourceText: normalized.sourceText,
        virtualSourcePath: normalized.source,
        out: candidateOutput,
        sizeBudget: 'strict'
      }, { rootDir });
      candidates.push(maracaTuneCandidateRecord(result, definition));
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  const accepted = candidates.filter((candidate) => candidate.accepted).sort(compareMaracaTuneCandidates);
  const selected = accepted[0] || null;
  if (!selected) {
    diagnostics.push({
      code: 'xtend.maraca.tune_no_candidate',
      severity: 'error',
      message: 'No Maraca tune candidate passed toolchain, closure and size-budget checks.'
    });
  }
  const sourceRef = repoRelative(normalized.sourcePath, rootDir);
  const outputRef = repoRelative(outputDir, rootDir);
  const selectedOptions = selected ? {
    source: sourceRef,
    out: outputRef,
    profile: selected.profile,
    lazy: selected.lazy,
    css: selected.css,
    sizeBudget: 'strict',
    ...semanticOptions
  } : null;
  const config = selected ? createMaracaTuneConfig({
    source: sourceRef,
    sourceFingerprint,
    serviceGraphFingerprint,
    output: outputRef,
    selected: { profile: selected.profile, lazy: selected.lazy, css: selected.css },
    locked: MARACA_TUNE_SEMANTIC_KEYS.reduce((record, key) => {
      record[key] = semanticOptions[key];
      return record;
    }, {}),
    options: selectedOptions,
    toolchain: {
      rollup: toolchain.rollup.version || null,
      terser: toolchain.terser.version || null,
      mode: 'rollup-terser'
    },
    candidateMatrixFingerprint
  }) : null;
  const reportPath = path.join(outputDir, 'xtend.maraca.tune.json');
  let configMatches = existingConfig ? stableJson(existingConfig) === stableJson(config) : false;
  let finalBuild = null;

  if (selected && write) {
    finalBuild = await buildMaracaBundleAsync({ ...selectedOptions, source: normalized.source }, { rootDir });
    if (!finalBuild.ok || !finalBuild.bundleReport || finalBuild.bundleReport.toolchain.active !== 'rollup-terser') {
      diagnostics.push({
        code: 'xtend.maraca.tune_final_build_failed',
        severity: 'error',
        message: 'Selected tune candidate could not be reproduced in the requested output directory.'
      });
    } else {
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      writeJson(configPath, config);
      configMatches = true;
    }
  }

  if (selected && check && !configMatches) {
    diagnostics.push({
      code: 'xtend.maraca.tune_config_drift',
      severity: 'error',
      message: 'Committed Maraca tune config does not match the deterministic candidate selection.'
    });
  }

  const ok = Boolean(selected) && diagnostics.every((diagnostic) => diagnostic.severity !== 'error');
  const report = {
    schema: MARACA_TUNE_REPORT_SCHEMA,
    ok,
    status: ok ? (check ? 'checked' : (write ? 'written' : 'planned')) : 'blocked',
    source: sourceRef,
    sourceFingerprint,
    configPath: repoRelative(configPath, rootDir),
    reportPath: repoRelative(reportPath, rootDir),
    output: outputRef,
    candidateMatrixFingerprint,
    candidateCount: candidates.length,
    acceptedCandidateCount: accepted.length,
    candidates,
    selected: selected ? {
      id: selected.id,
      profile: selected.profile,
      lazy: selected.lazy,
      css: selected.css,
      metrics: selected.metrics
    } : null,
    config,
    configMatches,
    finalBuild: finalBuild && finalBuild.bundleReport ? {
      status: finalBuild.status,
      bytes: finalBuild.bundleReport.bytes,
      entry: finalBuild.bundleReport.entryRelative,
      toolchain: finalBuild.bundleReport.toolchain.active
    } : null,
    diagnostics
  };
  if (ok && write) writeJson(reportPath, report);
  return report;
}

module.exports = {
  MARACA_PACKAGE_SCHEMA,
  MARACA_BUILD_PLAN_SCHEMA,
  MARACA_BUNDLE_REPORT_SCHEMA,
  MARACA_SIZE_BUDGET_REPORT_SCHEMA,
  MARACA_PERFORMANCE_REPORT_SCHEMA,
  MARACA_ORCHESTRATION_PLAN_SCHEMA,
  MARACA_KERNEL_PLAN_SCHEMA,
  MARACA_HYDRATION_PLAN_SCHEMA,
  MARACA_WARM_REENTRY_REPORT_SCHEMA,
  MARACA_PREWARM_WORKER_RUNTIME_SCHEMA,
  MARACA_SUPER_PREWARM_WORKER_EXPERIMENT_SCHEMA,
  MARACA_UI_COPROCESSOR_PLAN_SCHEMA,
  MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA,
  MARACA_WEB_APP_MANIFEST_REPORT_SCHEMA,
  MARACA_PWA_SERVICE_WORKER_PLAN_SCHEMA,
  MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA,
  MARACA_TEMPLATE_ARTIFACTS_REPORT_SCHEMA,
  MARACA_VALIDATION_PLAN_SCHEMA,
  MARACA_TRANSITION_PLAN_SCHEMA,
  MARACA_PRODUCTION_BUNDLE_CLOSURE_SCHEMA,
  MARACA_BUILD_CONFIG_SCHEMA,
  MARACA_TUNE_REPORT_SCHEMA,
  MARACA_APP_SERVICE_MANIFEST_SCHEMA,
  MARACA_SERVICE_BUILD_PLAN_SCHEMA,
  MARACA_SERVICE_BUILD_REPORT_SCHEMA,
  MARACA_COMPONENT_COMMAND_SCHEMA,
  MARACA_COMPONENT_COMMAND_RESULT_SCHEMA,
  COMPONENT_UNKNOWN_CODE,
  COMPONENT_DYNAMIC_CODE,
  DEFAULT_SOURCE,
  createMaracaBuildPlan,
  createMaracaServiceBuildPlan,
  buildMaracaBundle,
  buildMaracaBundleAsync,
  tuneMaracaBuild,
  createMaracaTuneConfig,
  createMaracaKernelFeatureAdoptionReport,
  createMaracaPanicRecoveryReport,
  createMaracaTrustedDomReport,
  createMaracaPolicyParityReport,
  createMaracaTemplateArtifactsReport,
  createMaracaPerformanceReport,
  createMaracaWebAppManifestPlan,
  createMaracaWebAppManifestReport,
  createMaracaPwaServiceWorkerPlan,
  createMaracaPwaReport,
  createMaracaProductionBundleClosure,
  createMaracaSizeBudgetReport,
  invokeMaracaComponentCommand,
  getMaracaToolchainAvailability
};
