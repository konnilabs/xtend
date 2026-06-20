'use strict';

const {
  FORBIDDEN_FRAMEWORK_DEPENDENCIES,
  assertNoFrameworkDependencies
} = require('./host-controller-contract');
const {
  XTENSIONS_HOST_CONTROLLER_SCHEMA
} = require('./host-controller-contract');
const {
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
  XTENSIONS_KERNEL_SIGNAL_SCHEMA,
  XTENSIONS_SURFACE_EVENT_SCHEMA
} = require('./signal-bridge-contract');
const {
  XTENSIONS_MARACA_ARTIFACT_SCHEMA,
  XTENSIONS_MARACA_BUILD_PLAN_SCHEMA,
  XTENSIONS_MARACA_MANIFEST_SCHEMA,
  normalizeXTensionManifest,
  sha256Value
} = require('./maraca-xtension-manifest');
const {
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
  XTENSIONS_RUNTIME_LOADING_POLICY_SCHEMA
} = require('./runtime-capability-registry');

const XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA = 'xtend.xtensions.security-integrity-gate.v1';
const XTENSIONS_SECURITY_POLICY_SCHEMA = 'xtend.xtensions.security-policy.v1';
const XTENSIONS_SECURITY_CSP_REQUIREMENTS_SCHEMA = 'xtend.xtensions.security-csp-requirements.v1';
const XTENSIONS_SECURITY_SUPPLY_CHAIN_CLASSIFICATION_SCHEMA = 'xtend.xtensions.security-supply-chain-classification.v1';
const XTENSIONS_SECURITY_MANIFEST_REPORT_SCHEMA = 'xtend.xtensions.security-manifest-report.v1';
const XTENSIONS_SECURITY_REPORT_SCHEMA = 'xtend.xtensions.security-report.v1';
const XTENSIONS_SECURITY_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.security-diagnostic.v1';
const XTENSIONS_SECURITY_INTEGRITY_GATE_MODULE_PATH = 'tools/xtensions/security-integrity-gate.js';
const XTENSIONS_SECURITY_INTEGRITY_GATE_TYPES_PATH = 'tools/xtensions/security-integrity-gate.d.ts';
const XTENSIONS_SECURITY_INTEGRITY_GATE_SUITE_PATH = 'tests/xtensions/xtensions_security_integrity_gate_suite.js';
const XTENSIONS_SECURITY_INTEGRITY_GATE_FIXTURE_PATH = 'tests/fixtures/xtensions/security-integrity-gate-valid.json';
const XTENSIONS_SECURITY_INTEGRITY_GATE_CONTRACT_PATH = 'development/XTensions-Security-CSP-Supply-Chain-Integrity-Gates-Contract.md';
const XTENSIONS_SECURITY_INTEGRITY_GATE_WORKPACKAGE = 'XTN-11';
const XTENSIONS_SECURITY_INTEGRITY_GATE_PACKAGE_SCRIPT = 'npm run test:xtensions-security-integrity-gate';

const SECURITY_OWNER_MISSING_CODE = 'xtensions.security.owner_missing';
const SECURITY_VERSION_MISSING_CODE = 'xtensions.security.version_missing';
const SECURITY_CONTRACT_MISSING_CODE = 'xtensions.security.contract_missing';
const SECURITY_INTEGRITY_MISSING_CODE = 'xtensions.security.integrity_missing';
const SECURITY_INTEGRITY_INVALID_CODE = 'xtensions.security.integrity_invalid';
const SECURITY_CSP_DIRECTIVE_MISSING_CODE = 'xtensions.security.csp_directive_missing';
const SECURITY_CSP_UNSAFE_SOURCE_CODE = 'xtensions.security.csp_unsafe_source';
const SECURITY_CSP_WASM_POLICY_MISSING_CODE = 'xtensions.security.csp_wasm_policy_missing';
const SECURITY_REMOTE_ARTIFACT_BLOCKED_CODE = 'xtensions.security.remote_artifact_blocked';
const SECURITY_CDN_SOURCE_FORBIDDEN_CODE = 'xtensions.security.cdn_source_forbidden';
const SECURITY_CAPABILITY_NOT_ALLOWED_CODE = 'xtensions.security.capability_not_allowed';
const SECURITY_DEPENDENCY_CLASSIFICATION_INVALID_CODE = 'xtensions.security.dependency_classification_invalid';
const SECURITY_PACKAGED_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.security.packaged_framework_dependency';
const SECURITY_FALLBACK_MISSING_CODE = 'xtensions.security.fallback_missing';
const SECURITY_POLICY_DRIFT_CODE = 'xtensions.security.policy_drift';
const SECURITY_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.security.framework_dependency';

const SECURITY_GATE_STATUSES = Object.freeze([
  'ready',
  'blocked',
  'degraded'
]);

const SECURITY_DEPENDENCY_CLASSIFICATIONS = Object.freeze([
  'core',
  'peer',
  'optional',
  'dev/test',
  'remote'
]);

const SECURITY_BLOCKED_DEPENDENCY_CLASSIFICATIONS = Object.freeze([
  'vendored',
  'root-runtime',
  'policy-blocked',
  'bundled'
]);

const SECURITY_REQUIRED_CSP_DIRECTIVES = Object.freeze([
  'scriptSrc',
  'connectSrc',
  'workerSrc',
  'imgSrc'
]);

const SECURITY_GATE_BOUNDARIES = Object.freeze([
  'deny-by-default-capabilities',
  'dynamic-import-requires-sha256-integrity',
  'remote-artifacts-blocked-unless-explicit-policy',
  'local-fixtures-require-no-cdn',
  'framework-runtime-dependencies-remain-peer-or-optional',
  'packaged-or-vendored-frameworks-block-strict-gate',
  'runtime-fallback-required-and-visible',
  'security-owner-version-contract-required',
  'no-framework-code-execution-during-gate'
]);

const DEFAULT_ALLOWED_CAPABILITIES = Object.freeze([
  'host.lifecycle.mount',
  'host.lifecycle.update',
  'host.lifecycle.suspend',
  'host.lifecycle.resume',
  'host.lifecycle.unmount',
  'signal.downstream',
  'event.upstream',
  'loading.dynamic-import',
  'fallback.native-placeholder',
  'fallback.host-error-boundary',
  'diagnostics.emit',
  'scheduler.hints',
  'fabric.lane.default',
  'fabric.lane.interactive',
  'fabric.lane.background',
  'fabric.lane.animation',
  'imperative.host-bridge',
  'render.loop.host-fiber'
]);

const DEFAULT_SECURITY_GATE_POLICY = Object.freeze({
  schema: XTENSIONS_SECURITY_POLICY_SCHEMA,
  strict: true,
  requireOwner: true,
  requireVersion: true,
  requireContract: true,
  requireIntegrity: true,
  requireFallback: true,
  requireCsp: true,
  dynamicImportRequiresIntegrity: true,
  remoteArtifactsAllowed: false,
  allowCdnForLocalFixtures: false,
  denyByDefaultCapabilities: true,
  imageDataSrcAllowed: true,
  wasmUnsafeEvalRequiresDeclaration: true,
  requiredCspDirectives: SECURITY_REQUIRED_CSP_DIRECTIVES.slice(),
  allowedDependencyClassifications: SECURITY_DEPENDENCY_CLASSIFICATIONS.slice(),
  blockedDependencyClassifications: SECURITY_BLOCKED_DEPENDENCY_CLASSIFICATIONS.slice(),
  allowedCapabilities: DEFAULT_ALLOWED_CAPABILITIES.slice(),
  forbiddenFrameworkDependencies: FORBIDDEN_FRAMEWORK_DEPENDENCIES.slice()
});

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableSort(value[key]);
      return result;
    }, {});
  }
  return value;
}

function timestampFromOptions(options = {}) {
  if (options.timestamp) return options.timestamp;
  if (typeof options.clock === 'function') return options.clock();
  return new Date().toISOString();
}

function createSecurityDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_SECURITY_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
    workpackage: XTENSIONS_SECURITY_INTEGRITY_GATE_WORKPACKAGE,
    severity,
    code,
    message,
    xtensionId: subject && (subject.id || subject.xtensionId) || null,
    framework: subject && subject.framework || null,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function normalizeSecurityGatePolicy(policy = {}) {
  const source = policy && typeof policy === 'object' ? policy : {};
  const allowedCapabilities = toArray(source.allowedCapabilities || DEFAULT_SECURITY_GATE_POLICY.allowedCapabilities)
    .map(normalizeString)
    .filter(Boolean);
  const requiredCspDirectives = toArray(source.requiredCspDirectives || DEFAULT_SECURITY_GATE_POLICY.requiredCspDirectives)
    .map(normalizeString)
    .filter(Boolean);
  const allowedDependencyClassifications = toArray(source.allowedDependencyClassifications || DEFAULT_SECURITY_GATE_POLICY.allowedDependencyClassifications)
    .map(normalizeString)
    .filter(Boolean);

  return {
    schema: XTENSIONS_SECURITY_POLICY_SCHEMA,
    strict: source.strict !== false,
    requireOwner: source.requireOwner !== false,
    requireVersion: source.requireVersion !== false,
    requireContract: source.requireContract !== false,
    requireIntegrity: source.requireIntegrity !== false,
    requireFallback: source.requireFallback !== false,
    requireCsp: source.requireCsp !== false,
    dynamicImportRequiresIntegrity: source.dynamicImportRequiresIntegrity !== false,
    remoteArtifactsAllowed: source.remoteArtifactsAllowed === true,
    allowCdnForLocalFixtures: source.allowCdnForLocalFixtures === true,
    denyByDefaultCapabilities: source.denyByDefaultCapabilities !== false,
    imageDataSrcAllowed: source.imageDataSrcAllowed !== false,
    wasmUnsafeEvalRequiresDeclaration: source.wasmUnsafeEvalRequiresDeclaration !== false,
    requiredCspDirectives,
    allowedDependencyClassifications,
    blockedDependencyClassifications: toArray(source.blockedDependencyClassifications || DEFAULT_SECURITY_GATE_POLICY.blockedDependencyClassifications)
      .map(normalizeString)
      .filter(Boolean),
    allowedCapabilities,
    forbiddenFrameworkDependencies: FORBIDDEN_FRAMEWORK_DEPENDENCIES.slice()
  };
}

function ownerFromSource(source = {}) {
  if (typeof source.owner === 'string') return normalizeString(source.owner);
  if (source.owner && typeof source.owner === 'object') {
    return normalizeString(source.owner.team || source.owner.name || source.owner.email);
  }
  if (source.security && typeof source.security === 'object') {
    if (typeof source.security.owner === 'string') return normalizeString(source.security.owner);
    if (source.security.owner && typeof source.security.owner === 'object') {
      return normalizeString(source.security.owner.team || source.security.owner.name || source.security.owner.email);
    }
  }
  return normalizeString(source.maintainer || source.securityOwner || source.reviewOwner);
}

function normalizeEntry(entry = {}) {
  if (typeof entry === 'string') {
    return {
      module: normalizeString(entry),
      dynamicImport: true
    };
  }

  const source = entry && typeof entry === 'object' ? entry : {};
  return {
    module: normalizeString(source.module || source.path || source.entry),
    dynamicImport: source.dynamicImport !== false
  };
}

function normalizeIntegrity(integrity = {}) {
  if (typeof integrity === 'string') {
    return {
      sha256: normalizeString(integrity),
      source: 'declared'
    };
  }

  const source = integrity && typeof integrity === 'object' ? integrity : {};
  return {
    sha256: normalizeString(source.sha256 || source.hash),
    source: normalizeString(source.source || 'declared')
  };
}

function normalizeFallback(fallback = {}) {
  const source = fallback && typeof fallback === 'object' ? fallback : {};
  return {
    mode: normalizeString(source.mode || ''),
    component: normalizeString(source.component || source.ref || ''),
    message: normalizeString(source.message || ''),
    degradedStatus: normalizeString(source.degradedStatus || '')
  };
}

function normalizeCspRequirements(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const csp = source.csp && typeof source.csp === 'object' ? source.csp : {};
  const security = source.security && typeof source.security === 'object' ? source.security : {};
  const entry = normalizeEntry(source.entry);

  return {
    schema: XTENSIONS_SECURITY_CSP_REQUIREMENTS_SCHEMA,
    scriptSrc: toArray(csp.scriptSrc || csp['script-src']).map(normalizeString).filter(Boolean),
    connectSrc: toArray(csp.connectSrc || csp['connect-src']).map(normalizeString).filter(Boolean),
    workerSrc: toArray(csp.workerSrc || csp['worker-src']).map(normalizeString).filter(Boolean),
    styleSrc: toArray(csp.styleSrc || csp['style-src']).map(normalizeString).filter(Boolean),
    imgSrc: toArray(csp.imgSrc || csp['img-src']).map(normalizeString).filter(Boolean),
    fontSrc: toArray(csp.fontSrc || csp['font-src']).map(normalizeString).filter(Boolean),
    dynamicImport: entry.dynamicImport,
    requiresWorker: security.requiresWorker === true || options.requiresWorker === true,
    requiresWasm: security.requiresWasm === true || options.requiresWasm === true,
    localFixtureNoNetwork: security.localFixtureNoNetwork !== false,
    source: cloneJson(csp)
  };
}

function isRemoteSource(value) {
  const normalized = normalizeString(value).toLowerCase();
  return normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized === 'http:'
    || normalized === 'https:';
}

function isCdnSource(value) {
  const normalized = normalizeString(value).toLowerCase();
  return /(?:cdn|unpkg|jsdelivr|cdnjs|skypack|esm\.sh|jspm|cdn-lfs)/u.test(normalized);
}

function dependencyNameIsForbidden(name) {
  const normalized = normalizeString(name);
  return FORBIDDEN_FRAMEWORK_DEPENDENCIES.some((dependency) => (
    normalized === dependency || normalized.startsWith(`${dependency}/`)
  ));
}

function normalizedDependencyClassification(classification) {
  const normalized = normalizeString(classification || 'peer');
  if (normalized === 'external-peer' || normalized === 'host-provided') return 'peer';
  if (normalized === 'optional-peer') return 'optional';
  if (normalized === 'dev' || normalized === 'test') return 'dev/test';
  if (normalized === 'none') return 'core';
  return normalized;
}

function normalizeSupplyChainDependency(dependency = {}) {
  if (typeof dependency === 'string') {
    return {
      schema: XTENSIONS_SECURITY_SUPPLY_CHAIN_CLASSIFICATION_SCHEMA,
      name: normalizeString(dependency),
      versionRange: '',
      classification: 'peer',
      rawClassification: 'peer',
      frameworkDependency: dependencyNameIsForbidden(dependency),
      bundled: false,
      packageIncluded: false,
      allowed: true
    };
  }

  const source = dependency && typeof dependency === 'object' ? dependency : {};
  const rawClassification = normalizeString(source.classification || source.kind || 'peer') || 'peer';
  const classification = normalizedDependencyClassification(rawClassification);
  return {
    schema: XTENSIONS_SECURITY_SUPPLY_CHAIN_CLASSIFICATION_SCHEMA,
    name: normalizeString(source.name || source.package),
    versionRange: normalizeString(source.versionRange || source.version || source.range),
    classification,
    rawClassification,
    frameworkDependency: dependencyNameIsForbidden(source.name || source.package),
    bundled: source.bundled === true || source.vendored === true,
    packageIncluded: source.packageIncluded === true || source.rootDependency === true,
    allowed: true
  };
}

function collectDependencies(source = {}) {
  const dependencies = []
    .concat(toArray(source.dependencies))
    .concat(toArray(source.peerDependencies))
    .concat(toArray(source.optionalDependencies));
  return dependencies.map(normalizeSupplyChainDependency).filter((dependency) => dependency.name);
}

function cspDirectiveValues(csp) {
  return [
    ['scriptSrc', csp.scriptSrc],
    ['connectSrc', csp.connectSrc],
    ['workerSrc', csp.workerSrc],
    ['styleSrc', csp.styleSrc],
    ['imgSrc', csp.imgSrc],
    ['fontSrc', csp.fontSrc]
  ];
}

function cspSourceIsUnsafe(directive, source, csp, policy) {
  const normalized = normalizeString(source).toLowerCase();
  if (!normalized) return false;
  if (normalized === '*' || normalized === 'http:' || normalized === 'https:') return true;
  if (directive === 'scriptSrc' && (normalized === "'unsafe-inline'" || normalized === "'unsafe-eval'")) return true;
  if (directive === 'scriptSrc' && normalized === "'wasm-unsafe-eval'" && policy.wasmUnsafeEvalRequiresDeclaration && !csp.requiresWasm) return true;
  if ((directive === 'scriptSrc' || directive === 'workerSrc' || directive === 'connectSrc') && normalized === 'data:') return true;
  if ((directive === 'scriptSrc' || directive === 'connectSrc') && normalized === 'blob:') return true;
  if (directive === 'imgSrc' && normalized === 'data:' && policy.imageDataSrcAllowed) return false;
  return false;
}

function sourceHasCdn(csp) {
  return cspDirectiveValues(csp).some(([, values]) => values.some(isCdnSource));
}

function hasRemoteCspSource(csp) {
  return cspDirectiveValues(csp).some(([, values]) => values.some(isRemoteSource));
}

function isRemoteCapable(source, csp, dependencies) {
  const entry = normalizeEntry(source.entry);
  const security = source.security && typeof source.security === 'object' ? source.security : {};
  return isRemoteSource(entry.module)
    || security.remoteCapable === true
    || source.remote === true
    || dependencies.some((dependency) => dependency.classification === 'remote')
    || hasRemoteCspSource(csp);
}

function hasExplicitContract(source = {}) {
  return Boolean(source.contract || source.contractSnapshot || source.XTENSION_CONTRACT);
}

function hasRequiredIntegrity(integrity) {
  return /^sha256:[a-f0-9]{64}$/u.test(normalizeString(integrity && integrity.sha256));
}

function evaluateCsp(source, csp, policy, diagnostics) {
  policy.requiredCspDirectives.forEach((directive) => {
    const values = toArray(csp[directive]).filter(Boolean);
    if (values.length === 0) {
      diagnostics.push(createSecurityDiagnostic(
        source,
        SECURITY_CSP_DIRECTIVE_MISSING_CODE,
        `XTension CSP must declare ${directive}.`,
        'error',
        { field: `csp.${directive}`, directive }
      ));
    }
  });

  if (csp.dynamicImport && !csp.scriptSrc.includes("'self'") && !csp.scriptSrc.includes('self')) {
    diagnostics.push(createSecurityDiagnostic(
      source,
      SECURITY_CSP_DIRECTIVE_MISSING_CODE,
      'Dynamic XTension imports require scriptSrc self.',
      'error',
      { field: 'csp.scriptSrc', directive: 'scriptSrc' }
    ));
  }

  if (csp.requiresWorker && !csp.workerSrc.includes("'self'") && !csp.workerSrc.includes('self')) {
    diagnostics.push(createSecurityDiagnostic(
      source,
      SECURITY_CSP_DIRECTIVE_MISSING_CODE,
      'Worker-capable XTensions require workerSrc self.',
      'error',
      { field: 'csp.workerSrc', directive: 'workerSrc' }
    ));
  }

  if (csp.requiresWasm && !csp.scriptSrc.includes("'wasm-unsafe-eval'")) {
    diagnostics.push(createSecurityDiagnostic(
      source,
      SECURITY_CSP_WASM_POLICY_MISSING_CODE,
      'WASM-capable XTensions must explicitly declare wasm-unsafe-eval in scriptSrc.',
      'error',
      { field: 'csp.scriptSrc', directive: 'scriptSrc' }
    ));
  }

  cspDirectiveValues(csp).forEach(([directive, values]) => {
    values.forEach((value) => {
      if (cspSourceIsUnsafe(directive, value, csp, policy)) {
        diagnostics.push(createSecurityDiagnostic(
          source,
          SECURITY_CSP_UNSAFE_SOURCE_CODE,
          `XTension CSP source "${value}" is unsafe for ${directive}.`,
          'error',
          { field: `csp.${directive}`, directive, value }
        ));
      }
    });
  });

  if (!policy.allowCdnForLocalFixtures && csp.localFixtureNoNetwork && sourceHasCdn(csp)) {
    diagnostics.push(createSecurityDiagnostic(
      source,
      SECURITY_CDN_SOURCE_FORBIDDEN_CODE,
      'Local XTension fixtures must not depend on CDN sources.',
      'error',
      { field: 'csp', localFixtureNoNetwork: true }
    ));
  }
}

function evaluateDependencies(source, dependencies, policy, diagnostics) {
  dependencies.forEach((dependency) => {
    const classificationKnown = policy.allowedDependencyClassifications.includes(dependency.classification);
    const classificationBlocked = policy.blockedDependencyClassifications.includes(dependency.rawClassification)
      || policy.blockedDependencyClassifications.includes(dependency.classification);

    if (!classificationKnown || classificationBlocked) {
      dependency.allowed = false;
      diagnostics.push(createSecurityDiagnostic(
        source,
        SECURITY_DEPENDENCY_CLASSIFICATION_INVALID_CODE,
        `Dependency "${dependency.name}" has unsupported XTension security classification "${dependency.rawClassification}".`,
        'error',
        { field: 'dependencies', dependency }
      ));
    }

    if (dependency.frameworkDependency && (dependency.bundled || dependency.packageIncluded || dependency.classification === 'core')) {
      dependency.allowed = false;
      diagnostics.push(createSecurityDiagnostic(
        source,
        SECURITY_PACKAGED_FRAMEWORK_DEPENDENCY_CODE,
        `Framework dependency "${dependency.name}" must remain peer/optional and must not be packaged with XTend.`,
        'error',
        { field: 'dependencies', dependency }
      ));
    }
  });
}

function evaluateCapabilities(source, capabilities, policy, diagnostics) {
  if (!policy.denyByDefaultCapabilities) return;

  capabilities.forEach((capability) => {
    if (!policy.allowedCapabilities.includes(capability)) {
      diagnostics.push(createSecurityDiagnostic(
        source,
        SECURITY_CAPABILITY_NOT_ALLOWED_CODE,
        `XTension capability "${capability}" is not allowed by the deny-by-default security policy.`,
        'error',
        { field: 'capabilities', capability }
      ));
    }
  });
}

function evaluatePolicyDrift(source, diagnostics) {
  const policy = source.policy && typeof source.policy === 'object' ? source.policy : {};
  if (policy.securityGateRequired === false || policy.allowRemoteWithoutReview === true || policy.status === 'blocked') {
    diagnostics.push(createSecurityDiagnostic(
      source,
      SECURITY_POLICY_DRIFT_CODE,
      'XTension manifest policy drifts from the strict security gate.',
      'error',
      { field: 'policy', policy: cloneJson(policy) }
    ));
  }
}

function evaluateXTensionSecurity(input = {}, options = {}) {
  const source = input && input.manifest && typeof input.manifest === 'object' ? input.manifest : input;
  const policy = normalizeSecurityGatePolicy(options.policy || input.securityPolicy || input.policyOverride);
  const normalizedManifest = normalizeXTensionManifest(source, options);
  const owner = ownerFromSource(source);
  const entry = normalizeEntry(source.entry);
  const integrity = normalizeIntegrity(source.integrity);
  const fallback = normalizeFallback(source.fallback);
  const csp = normalizeCspRequirements(source, options);
  const dependencies = collectDependencies(source);
  const remoteCapable = isRemoteCapable(source, csp, dependencies);
  const capabilities = toArray(source.capabilities || source.contract && source.contract.capabilities || source.contractSnapshot && source.contractSnapshot.capabilities || normalizedManifest.capabilities)
    .map(normalizeString)
    .filter(Boolean);
  const diagnostics = [];

  if (policy.requireOwner && !owner) {
    diagnostics.push(createSecurityDiagnostic(
      normalizedManifest,
      SECURITY_OWNER_MISSING_CODE,
      'XTension manifest must declare a security owner.',
      'error',
      { field: 'owner' }
    ));
  }

  if (policy.requireVersion && !normalizedManifest.version) {
    diagnostics.push(createSecurityDiagnostic(
      normalizedManifest,
      SECURITY_VERSION_MISSING_CODE,
      'XTension manifest must declare a version.',
      'error',
      { field: 'version' }
    ));
  }

  if (policy.requireContract && !hasExplicitContract(source)) {
    diagnostics.push(createSecurityDiagnostic(
      normalizedManifest,
      SECURITY_CONTRACT_MISSING_CODE,
      'XTension manifest must declare an explicit contract snapshot.',
      'error',
      { field: 'contract' }
    ));
  }

  if (policy.requireIntegrity && !integrity.sha256) {
    diagnostics.push(createSecurityDiagnostic(
      normalizedManifest,
      SECURITY_INTEGRITY_MISSING_CODE,
      'XTension manifest must declare sha256 integrity.',
      'error',
      { field: 'integrity.sha256' }
    ));
  } else if (policy.requireIntegrity && !hasRequiredIntegrity(integrity)) {
    diagnostics.push(createSecurityDiagnostic(
      normalizedManifest,
      SECURITY_INTEGRITY_INVALID_CODE,
      'XTension integrity must use sha256 plus 64 lowercase hex characters.',
      'error',
      { field: 'integrity.sha256' }
    ));
  }

  if (entry.dynamicImport && policy.dynamicImportRequiresIntegrity && !hasRequiredIntegrity(integrity)) {
    diagnostics.push(createSecurityDiagnostic(
      normalizedManifest,
      SECURITY_INTEGRITY_MISSING_CODE,
      'Dynamic XTension imports require valid sha256 integrity before loading.',
      'error',
      { field: 'entry.dynamicImport' }
    ));
  }

  if (policy.requireCsp) evaluateCsp(normalizedManifest, csp, policy, diagnostics);

  if (remoteCapable && !policy.remoteArtifactsAllowed) {
    diagnostics.push(createSecurityDiagnostic(
      normalizedManifest,
      SECURITY_REMOTE_ARTIFACT_BLOCKED_CODE,
      'Remote-capable XTension artifacts are blocked by the local/package security gate.',
      'error',
      { field: 'entry.module', module: entry.module }
    ));
  }

  evaluateDependencies(normalizedManifest, dependencies, policy, diagnostics);
  evaluateCapabilities(normalizedManifest, capabilities, policy, diagnostics);

  if (policy.requireFallback && (!fallback.mode || !fallback.message)) {
    diagnostics.push(createSecurityDiagnostic(
      normalizedManifest,
      SECURITY_FALLBACK_MISSING_CODE,
      'XTension manifest must declare a visible runtime fallback.',
      'error',
      { field: 'fallback' }
    ));
  }

  evaluatePolicyDrift(source, diagnostics);

  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const status = errorCount > 0 ? 'blocked' : 'ready';

  return {
    schema: XTENSIONS_SECURITY_MANIFEST_REPORT_SCHEMA,
    gateSchema: XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
    policySchema: XTENSIONS_SECURITY_POLICY_SCHEMA,
    cspRequirementsSchema: XTENSIONS_SECURITY_CSP_REQUIREMENTS_SCHEMA,
    supplyChainClassificationSchema: XTENSIONS_SECURITY_SUPPLY_CHAIN_CLASSIFICATION_SCHEMA,
    workpackage: XTENSIONS_SECURITY_INTEGRITY_GATE_WORKPACKAGE,
    ok: status !== 'blocked',
    status,
    xtensionId: normalizedManifest.id,
    framework: normalizedManifest.framework,
    owner,
    version: normalizedManifest.version,
    entry,
    remoteCapable,
    integrity,
    csp,
    capabilities,
    dependencies,
    fallback: {
      ...fallback,
      visible: Boolean(fallback.mode && fallback.message)
    },
    manifestFingerprint: normalizedManifest.manifestFingerprint,
    artifactFingerprint: normalizedManifest.artifactFingerprint,
    securityFingerprint: sha256Value({
      xtensionId: normalizedManifest.id,
      owner,
      version: normalizedManifest.version,
      entry,
      integrity,
      csp,
      capabilities,
      dependencies: dependencies.map((dependency) => ({
        name: dependency.name,
        classification: dependency.classification,
        bundled: dependency.bundled,
        packageIncluded: dependency.packageIncluded
      })),
      fallback
    }),
    diagnostics
  };
}

function assertXTensionsSecurityDependencyBoundary(input = {}) {
  const dependencyCheck = assertNoFrameworkDependencies(input);
  return {
    ok: dependencyCheck.ok,
    diagnostics: dependencyCheck.diagnostics.map((diagnostic) => ({
      schema: XTENSIONS_SECURITY_DIAGNOSTIC_SCHEMA,
      source: XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
      workpackage: XTENSIONS_SECURITY_INTEGRITY_GATE_WORKPACKAGE,
      severity: 'error',
      code: SECURITY_FRAMEWORK_DEPENDENCY_CODE,
      message: diagnostic.message,
      xtensionId: null,
      framework: null,
      field: diagnostic.details && diagnostic.details.section || diagnostic.details && diagnostic.details.name || null,
      metadata: cloneJson(diagnostic.details || {})
    })),
    forbiddenFrameworkDependencies: dependencyCheck.forbiddenFrameworkDependencies
  };
}

function createXTensionsSecurityIntegrityGate(input = {}, options = {}) {
  const policy = normalizeSecurityGatePolicy(input.policy || input.securityPolicy || options.policy);
  const xtensions = toArray(input.xtensions || input.manifests || input.manifest);
  const manifestReports = xtensions.map((manifest) => evaluateXTensionSecurity(manifest, { ...options, policy }));
  const dependencyBoundary = assertXTensionsSecurityDependencyBoundary({
    packageManifest: input.packageManifest || options.packageManifest || {},
    imports: input.imports || options.imports || [],
    sourceText: input.sourceText || options.sourceText || ''
  });
  const diagnostics = manifestReports
    .flatMap((report) => report.diagnostics || [])
    .concat(dependencyBoundary.diagnostics || []);
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const blockedCount = manifestReports.filter((report) => report.status === 'blocked').length;
  const readyCount = manifestReports.filter((report) => report.status === 'ready').length;
  const remoteCapableCount = manifestReports.filter((report) => report.remoteCapable).length;
  const packagedFrameworkDependencyCount = manifestReports.reduce((count, report) => (
    count + report.dependencies.filter((dependency) => (
      dependency.frameworkDependency && (dependency.bundled || dependency.packageIncluded || dependency.classification === 'core')
    )).length
  ), 0);
  const status = errorCount > 0 || blockedCount > 0 || dependencyBoundary.ok === false ? 'blocked' : 'ready';

  return {
    schema: XTENSIONS_SECURITY_REPORT_SCHEMA,
    gateSchema: XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
    policySchema: XTENSIONS_SECURITY_POLICY_SCHEMA,
    cspRequirementsSchema: XTENSIONS_SECURITY_CSP_REQUIREMENTS_SCHEMA,
    supplyChainClassificationSchema: XTENSIONS_SECURITY_SUPPLY_CHAIN_CLASSIFICATION_SCHEMA,
    manifestReportSchema: XTENSIONS_SECURITY_MANIFEST_REPORT_SCHEMA,
    diagnosticSchema: XTENSIONS_SECURITY_DIAGNOSTIC_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    signalBridgeSchema: XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
    kernelSignalSchema: XTENSIONS_KERNEL_SIGNAL_SCHEMA,
    surfaceEventSchema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    maracaManifestSchema: XTENSIONS_MARACA_MANIFEST_SCHEMA,
    maracaArtifactSchema: XTENSIONS_MARACA_ARTIFACT_SCHEMA,
    maracaBuildPlanSchema: XTENSIONS_MARACA_BUILD_PLAN_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    runtimeLoadingPolicySchema: XTENSIONS_RUNTIME_LOADING_POLICY_SCHEMA,
    workpackage: XTENSIONS_SECURITY_INTEGRITY_GATE_WORKPACKAGE,
    ok: status !== 'blocked',
    status,
    strict: policy.strict,
    frameworkCodeRequired: false,
    runtimeExecutionRequired: false,
    localFixtureNetworkRequired: false,
    policy,
    manifestCount: manifestReports.length,
    readyCount,
    blockedCount,
    remoteCapableCount,
    packagedFrameworkDependencyCount,
    reports: manifestReports,
    dependencyBoundary,
    diagnostics,
    summary: {
      manifestCount: manifestReports.length,
      readyCount,
      blockedCount,
      remoteCapableCount,
      diagnosticCount: diagnostics.length,
      errorCount,
      cspDirectiveCount: manifestReports.reduce((count, report) => (
        count + SECURITY_REQUIRED_CSP_DIRECTIVES.filter((directive) => report.csp[directive] && report.csp[directive].length > 0).length
      ), 0),
      capabilityCount: manifestReports.reduce((count, report) => count + report.capabilities.length, 0),
      dependencyCount: manifestReports.reduce((count, report) => count + report.dependencies.length, 0)
    },
    boundaries: SECURITY_GATE_BOUNDARIES.slice(),
    gateFingerprint: sha256Value({
      policy,
      securityFingerprints: manifestReports.map((report) => report.securityFingerprint),
      dependencyBoundaryOk: dependencyBoundary.ok
    }),
    timestamp: timestampFromOptions(options)
  };
}

function serializeXTensionsSecurityIntegrityGateReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

module.exports = {
  DEFAULT_ALLOWED_CAPABILITIES,
  DEFAULT_SECURITY_GATE_POLICY,
  SECURITY_BLOCKED_DEPENDENCY_CLASSIFICATIONS,
  SECURITY_CAPABILITY_NOT_ALLOWED_CODE,
  SECURITY_CDN_SOURCE_FORBIDDEN_CODE,
  SECURITY_CONTRACT_MISSING_CODE,
  SECURITY_CSP_DIRECTIVE_MISSING_CODE,
  SECURITY_CSP_UNSAFE_SOURCE_CODE,
  SECURITY_CSP_WASM_POLICY_MISSING_CODE,
  SECURITY_DEPENDENCY_CLASSIFICATION_INVALID_CODE,
  SECURITY_DEPENDENCY_CLASSIFICATIONS,
  SECURITY_FALLBACK_MISSING_CODE,
  SECURITY_FRAMEWORK_DEPENDENCY_CODE,
  SECURITY_GATE_BOUNDARIES,
  SECURITY_GATE_STATUSES,
  SECURITY_INTEGRITY_INVALID_CODE,
  SECURITY_INTEGRITY_MISSING_CODE,
  SECURITY_OWNER_MISSING_CODE,
  SECURITY_PACKAGED_FRAMEWORK_DEPENDENCY_CODE,
  SECURITY_POLICY_DRIFT_CODE,
  SECURITY_REMOTE_ARTIFACT_BLOCKED_CODE,
  SECURITY_REQUIRED_CSP_DIRECTIVES,
  SECURITY_VERSION_MISSING_CODE,
  XTENSIONS_SECURITY_CSP_REQUIREMENTS_SCHEMA,
  XTENSIONS_SECURITY_DIAGNOSTIC_SCHEMA,
  XTENSIONS_SECURITY_INTEGRITY_GATE_CONTRACT_PATH,
  XTENSIONS_SECURITY_INTEGRITY_GATE_FIXTURE_PATH,
  XTENSIONS_SECURITY_INTEGRITY_GATE_MODULE_PATH,
  XTENSIONS_SECURITY_INTEGRITY_GATE_PACKAGE_SCRIPT,
  XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
  XTENSIONS_SECURITY_INTEGRITY_GATE_SUITE_PATH,
  XTENSIONS_SECURITY_INTEGRITY_GATE_TYPES_PATH,
  XTENSIONS_SECURITY_INTEGRITY_GATE_WORKPACKAGE,
  XTENSIONS_SECURITY_MANIFEST_REPORT_SCHEMA,
  XTENSIONS_SECURITY_POLICY_SCHEMA,
  XTENSIONS_SECURITY_REPORT_SCHEMA,
  XTENSIONS_SECURITY_SUPPLY_CHAIN_CLASSIFICATION_SCHEMA,
  assertXTensionsSecurityDependencyBoundary,
  createSecurityDiagnostic,
  createXTensionsSecurityIntegrityGate,
  evaluateXTensionSecurity,
  normalizeCspRequirements,
  normalizeSecurityGatePolicy,
  normalizeSupplyChainDependency,
  serializeXTensionsSecurityIntegrityGateReport
};
