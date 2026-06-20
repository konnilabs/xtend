'use strict';

const {
  FORBIDDEN_FRAMEWORK_DEPENDENCIES,
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
  assertNoFrameworkDependencies
} = require('./host-controller-contract');
const {
  XTENSIONS_MARACA_ARTIFACT_SCHEMA,
  XTENSIONS_MARACA_CONTRACT_SNAPSHOT_SCHEMA,
  XTENSIONS_MARACA_MANIFEST_SCHEMA,
  createMaracaXTensionBuildPlan,
  normalizeXTensionManifest,
  sha256Value
} = require('./maraca-xtension-manifest');
const {
  XTENSIONS_STATIC_CONTRACT_SCHEMA,
  normalizeStaticXTensionContract
} = require('./static-contract-introspection');

const XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA = 'xtend.xtensions.runtime-capability-registry.v1';
const XTENSIONS_RUNTIME_HOST_CAPABILITIES_SCHEMA = 'xtend.xtensions.runtime-host-capabilities.v1';
const XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA = 'xtend.xtensions.runtime-adapter-record.v1';
const XTENSIONS_RUNTIME_LOADING_POLICY_SCHEMA = 'xtend.xtensions.runtime-loading-policy.v1';
const XTENSIONS_RUNTIME_CAPABILITY_NEGOTIATION_SCHEMA = 'xtend.xtensions.runtime-capability-negotiation.v1';
const XTENSIONS_RUNTIME_LOAD_DECISION_SCHEMA = 'xtend.xtensions.runtime-load-decision.v1';
const XTENSIONS_RUNTIME_REPORT_SCHEMA = 'xtend.xtensions.runtime-report.v1';
const XTENSIONS_RUNTIME_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.runtime-diagnostic.v1';
const XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_MODULE_PATH = 'tools/xtensions/runtime-capability-registry.js';
const XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_TYPES_PATH = 'tools/xtensions/runtime-capability-registry.d.ts';
const XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SUITE_PATH = 'tests/xtensions/xtensions_runtime_capability_registry_suite.js';
const XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_CONTRACT_PATH = 'development/XTensions-Runtime-Capability-Registry-and-Loading-Policy-Contract.md';
const XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_FIXTURE_PATH = 'tests/fixtures/xtensions/runtime-capability-registry-valid.json';
const XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE = 'XTN-05';
const XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_PACKAGE_SCRIPT = 'npm run test:xtensions-runtime-capability-registry';

const RUNTIME_ADAPTER_MISSING_CODE = 'xtensions.runtime.adapter_missing';
const RUNTIME_CAPABILITY_MISSING_CODE = 'xtensions.runtime.capability_missing';
const RUNTIME_PEER_MISSING_CODE = 'xtensions.runtime.peer_missing';
const RUNTIME_VERSION_INCOMPATIBLE_CODE = 'xtensions.runtime.version_incompatible';
const RUNTIME_POLICY_BLOCKED_CODE = 'xtensions.runtime.policy_blocked';
const RUNTIME_INTEGRITY_MISSING_CODE = 'xtensions.runtime.integrity_missing';
const RUNTIME_FALLBACK_MISSING_CODE = 'xtensions.runtime.fallback_missing';
const RUNTIME_GLOBAL_REGISTRY_FORBIDDEN_CODE = 'xtensions.runtime.global_registry_forbidden';
const RUNTIME_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.runtime.framework_dependency';

const RUNTIME_LOAD_STATUSES = Object.freeze([
  'loaded',
  'skipped',
  'failed',
  'degraded',
  'policy-blocked'
]);

const RUNTIME_REGISTRY_BOUNDARIES = Object.freeze([
  'host-local-registry-only',
  'no-second-global-surface-registry',
  'capability-negotiation-before-mount',
  'adapter-loading-policy-before-dynamic-import',
  'missing-framework-runtime-degrades-not-shell-blocks',
  'framework-dependencies-remain-external-peer-or-host-provided'
]);

const DEFAULT_RUNTIME_HOST_CAPABILITIES = Object.freeze([
  'host.lifecycle.mount',
  'host.lifecycle.unmount',
  'signal.downstream',
  'event.upstream',
  'loading.dynamic-import',
  'fallback.native-placeholder'
]);

const DEFAULT_RUNTIME_LOADING_POLICY = Object.freeze({
  scope: 'host-local',
  allowGlobalRegistry: false,
  dynamicImportRequiresIntegrity: true,
  capabilityNegotiationRequired: true,
  fallbackRequired: true,
  missingRuntimeStrategy: 'degrade-with-fallback',
  packageFrameworkDependenciesAllowed: false,
  vendoredFrameworksAllowed: false
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

function createRuntimeDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_RUNTIME_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    workpackage: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE,
    severity,
    code,
    message,
    xtensionId: subject && (subject.id || subject.xtensionId) || null,
    framework: subject && subject.framework || null,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function normalizeFallback(fallback = {}) {
  const source = fallback && typeof fallback === 'object' ? fallback : {};
  return {
    mode: normalizeString(source.mode || 'native-placeholder'),
    component: normalizeString(source.component || source.ref || ''),
    message: normalizeString(source.message || ''),
    degradedStatus: normalizeString(source.degradedStatus || 'xtension-unavailable')
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

function normalizeEntry(entry = {}) {
  if (typeof entry === 'string') {
    return {
      module: normalizeString(entry),
      exportName: 'default',
      format: 'esm',
      dynamicImport: true
    };
  }

  const source = entry && typeof entry === 'object' ? entry : {};
  return {
    module: normalizeString(source.module || source.path || source.entry),
    exportName: normalizeString(source.exportName || source.export || 'default') || 'default',
    format: normalizeString(source.format || 'esm') || 'esm',
    dynamicImport: source.dynamicImport !== false
  };
}

function normalizeDependencyEntry(dependency = {}) {
  if (typeof dependency === 'string') {
    return {
      name: normalizeString(dependency),
      versionRange: '',
      classification: 'external-peer',
      available: undefined,
      bundled: false,
      packageIncluded: false
    };
  }

  const source = dependency && typeof dependency === 'object' ? dependency : {};
  return {
    name: normalizeString(source.name || source.package),
    versionRange: normalizeString(source.versionRange || source.version || source.range),
    classification: normalizeString(source.classification || source.kind || 'external-peer') || 'external-peer',
    available: source.available,
    bundled: source.bundled === true || source.vendored === true,
    packageIncluded: source.packageIncluded === true || source.rootDependency === true
  };
}

function normalizeRuntimeLoadingPolicy(policy = {}) {
  const source = policy && typeof policy === 'object' ? policy : {};
  return {
    schema: XTENSIONS_RUNTIME_LOADING_POLICY_SCHEMA,
    scope: normalizeString(source.scope || DEFAULT_RUNTIME_LOADING_POLICY.scope) || 'host-local',
    allowGlobalRegistry: source.allowGlobalRegistry === true,
    dynamicImportRequiresIntegrity: source.dynamicImportRequiresIntegrity !== false,
    capabilityNegotiationRequired: source.capabilityNegotiationRequired !== false,
    fallbackRequired: source.fallbackRequired !== false,
    missingRuntimeStrategy: normalizeString(source.missingRuntimeStrategy || DEFAULT_RUNTIME_LOADING_POLICY.missingRuntimeStrategy),
    packageFrameworkDependenciesAllowed: source.packageFrameworkDependenciesAllowed === true,
    vendoredFrameworksAllowed: source.vendoredFrameworksAllowed === true
  };
}

function normalizeProvidedFramework(framework = {}) {
  if (typeof framework === 'string') {
    return {
      name: normalizeString(framework),
      version: '',
      source: 'host-provided',
      available: true
    };
  }

  const source = framework && typeof framework === 'object' ? framework : {};
  return {
    name: normalizeString(source.name || source.framework),
    version: normalizeString(source.version),
    source: normalizeString(source.source || 'host-provided'),
    available: source.available !== false
  };
}

function normalizeRuntimeHostCapabilities(host = {}, options = {}) {
  const source = host && typeof host === 'object' ? host : {};
  const loadingPolicy = normalizeRuntimeLoadingPolicy(source.policy || source.loadingPolicy || options.policy);
  const capabilities = toArray(source.capabilities || DEFAULT_RUNTIME_HOST_CAPABILITIES)
    .map(normalizeString)
    .filter(Boolean);
  const providedFrameworks = toArray(source.providedFrameworks || source.frameworks)
    .map(normalizeProvidedFramework)
    .filter((framework) => framework.name);

  return {
    schema: XTENSIONS_RUNTIME_HOST_CAPABILITIES_SCHEMA,
    hostId: normalizeString(source.hostId || source.id || 'xtend.host.local'),
    surfaceRegistryRef: normalizeString(source.surfaceRegistryRef || 'surface-registry://host-local'),
    scope: 'host-local',
    globalRegistry: false,
    capabilities,
    providedFrameworks,
    loadingPolicy,
    boundaries: RUNTIME_REGISTRY_BOUNDARIES.slice()
  };
}

function normalizeContractLike(contract = {}, options = {}) {
  if (!contract || typeof contract !== 'object') return null;
  if (contract.schema === XTENSIONS_STATIC_CONTRACT_SCHEMA) {
    return normalizeStaticXTensionContract(contract, options);
  }
  return normalizeStaticXTensionContract({
    schema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
    id: contract.id || contract.xtensionId,
    name: contract.name,
    framework: contract.framework,
    version: contract.version,
    hostControllerSchema: contract.hostControllerSchema,
    signalBridgeSchema: contract.signalBridgeSchema,
    kernelSignalSchema: contract.kernelSignalSchema,
    surfaceEventSchema: contract.surfaceEventSchema,
    accepts: contract.accepts,
    emits: contract.emits,
    capabilities: contract.capabilities
  }, options);
}

function adapterRecordFromArtifact(artifact = {}, options = {}) {
  const contractSnapshot = artifact.contractSnapshot || {};
  const contract = normalizeContractLike({
    id: artifact.xtensionId,
    name: artifact.xtensionId,
    framework: artifact.framework,
    version: artifact.version,
    hostControllerSchema: contractSnapshot.hostControllerSchema,
    signalBridgeSchema: contractSnapshot.signalBridgeSchema,
    kernelSignalSchema: contractSnapshot.kernelSignalSchema,
    surfaceEventSchema: contractSnapshot.surfaceEventSchema,
    accepts: contractSnapshot.accepts,
    emits: contractSnapshot.emits,
    capabilities: contractSnapshot.capabilities
  }, { sourceKind: 'runtime-maraca-artifact' });
  const dependencyRecords = artifact.provenance
    && artifact.provenance.dependencyClassification
    && Array.isArray(artifact.provenance.dependencyClassification.dependencies)
    ? artifact.provenance.dependencyClassification.dependencies
    : [];

  return normalizeRuntimeAdapterRecord({
    id: artifact.xtensionId,
    framework: artifact.framework,
    version: artifact.version,
    entry: artifact.entry,
    integrity: artifact.integrity,
    fallback: artifact.fallback,
    lazy: artifact.lazy,
    manifestFingerprint: artifact.manifestFingerprint,
    artifactFingerprint: artifact.artifactFingerprint,
    contract,
    contractSnapshot,
    dependencies: dependencyRecords,
    requiredHostCapabilities: contract.capabilities,
    source: {
      kind: 'maraca-artifact',
      schema: artifact.schema || XTENSIONS_MARACA_ARTIFACT_SCHEMA
    }
  }, options);
}

function normalizeRuntimeAdapterRecord(adapter = {}, options = {}) {
  const source = adapter && typeof adapter === 'object' ? adapter : {};
  const contract = normalizeContractLike(source.contract || source.contractSnapshot || source, {
    sourceKind: source.source && source.source.kind || options.sourceKind || 'runtime-adapter-record'
  });
  const xtensionId = normalizeString(source.id || source.xtensionId || contract && contract.id);
  const framework = normalizeString(source.framework || contract && contract.framework);
  const dependencies = toArray(source.dependencies || source.peerDependencies)
    .map(normalizeDependencyEntry)
    .filter((dependency) => dependency.name);
  const requiredHostCapabilities = toArray(source.requiredHostCapabilities || source.requires || contract && contract.capabilities)
    .map(normalizeString)
    .filter(Boolean);
  const entry = normalizeEntry(source.entry);
  const fallback = normalizeFallback(source.fallback);
  const integrity = normalizeIntegrity(source.integrity);
  const loadingPolicy = normalizeRuntimeLoadingPolicy(source.policy || source.loadingPolicy);
  const record = {
    schema: XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA,
    xtensionId,
    framework,
    version: normalizeString(source.version || contract && contract.version),
    status: normalizeString(source.status || 'ready') || 'ready',
    hostControllerSchema: normalizeString(source.hostControllerSchema || contract && contract.hostControllerSchema || XTENSIONS_HOST_CONTROLLER_SCHEMA),
    entry,
    lazy: cloneJson(source.lazy || {}),
    integrity,
    fallback,
    dependencies,
    contract,
    requiredHostCapabilities,
    manifestFingerprint: normalizeString(source.manifestFingerprint),
    artifactFingerprint: normalizeString(source.artifactFingerprint),
    source: cloneJson(source.source || { kind: options.sourceKind || 'inline-adapter' }),
    loadingPolicy,
    globalRegistry: source.globalRegistry === true || loadingPolicy.scope === 'global',
    diagnostics: []
  };

  record.adapterFingerprint = normalizeString(source.adapterFingerprint) || sha256Value({
    xtensionId: record.xtensionId,
    framework: record.framework,
    version: record.version,
    entry: record.entry,
    requiredHostCapabilities: record.requiredHostCapabilities,
    manifestFingerprint: record.manifestFingerprint,
    artifactFingerprint: record.artifactFingerprint
  });
  return record;
}

function parseVersionParts(version) {
  const match = normalizeString(version).match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/u);
  if (!match) return null;
  return [
    Number(match[1] || 0),
    Number(match[2] || 0),
    Number(match[3] || 0)
  ];
}

function compareVersions(left, right) {
  const leftParts = parseVersionParts(left);
  const rightParts = parseVersionParts(right);
  if (!leftParts || !rightParts) return 0;
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1;
    if (leftParts[index] < rightParts[index]) return -1;
  }
  return 0;
}

function versionSatisfies(version, range) {
  const normalizedRange = normalizeString(range);
  if (!normalizedRange || normalizedRange === '*' || normalizedRange === 'latest') return true;
  const versionParts = parseVersionParts(version);
  const rangeParts = parseVersionParts(normalizedRange);
  if (!versionParts || !rangeParts) return normalizeString(version) === normalizedRange;

  if (normalizedRange.startsWith('^')) {
    return versionParts[0] === rangeParts[0] && compareVersions(version, normalizedRange) >= 0;
  }

  if (normalizedRange.startsWith('~')) {
    return versionParts[0] === rangeParts[0]
      && versionParts[1] === rangeParts[1]
      && compareVersions(version, normalizedRange) >= 0;
  }

  if (normalizedRange.startsWith('>=')) {
    return compareVersions(version, normalizedRange) >= 0;
  }

  return normalizeString(version) === normalizedRange.replace(/^[=v]+/u, '');
}

function frameworkDependencyIsForbidden(name) {
  const normalized = normalizeString(name);
  return FORBIDDEN_FRAMEWORK_DEPENDENCIES.some((dependency) => (
    normalized === dependency || normalized.startsWith(`${dependency}/`)
  ));
}

function providedFrameworkFor(host, name) {
  return (host.providedFrameworks || []).find((framework) => framework.name === name) || null;
}

function hasUsableFallback(adapter) {
  return Boolean(adapter.fallback && adapter.fallback.mode && adapter.fallback.message);
}

function createXTensionsRuntimeCapabilityRegistry(input = {}, options = {}) {
  const host = normalizeRuntimeHostCapabilities(input.host || input.runtimeHost || {}, options);
  const adapters = [];
  const diagnostics = [];

  if (input.globalRegistry === true || host.globalRegistry === true || host.loadingPolicy.scope === 'global') {
    diagnostics.push(createRuntimeDiagnostic(
      host,
      RUNTIME_GLOBAL_REGISTRY_FORBIDDEN_CODE,
      'XTensions runtime capability registry must remain host-local and must not create a second global registry.',
      'error',
      { field: 'registry.scope' }
    ));
  }

  toArray(input.adapters).forEach((adapter) => {
    adapters.push(normalizeRuntimeAdapterRecord(adapter, options));
  });

  toArray(input.contracts).forEach((contract) => {
    adapters.push(normalizeRuntimeAdapterRecord({
      contract,
      requiredHostCapabilities: contract.capabilities,
      source: { kind: 'static-contract' }
    }, { sourceKind: 'static-contract' }));
  });

  toArray(input.manifests).forEach((manifestInput) => {
    const manifest = normalizeXTensionManifest(manifestInput, options);
    const plan = createMaracaXTensionBuildPlan({ xtensions: [manifest] }, options);
    plan.artifacts.forEach((artifact) => adapters.push(adapterRecordFromArtifact(artifact, options)));
    diagnostics.push(...(manifest.diagnostics || []));
  });

  toArray(input.artifacts).forEach((artifact) => {
    adapters.push(adapterRecordFromArtifact(artifact, options));
  });

  const uniqueById = new Map();
  adapters.forEach((adapter) => {
    if (!adapter.xtensionId || !uniqueById.has(adapter.xtensionId)) {
      uniqueById.set(adapter.xtensionId || `anonymous:${uniqueById.size}`, adapter);
    }
  });
  const records = Array.from(uniqueById.values());
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    hostCapabilitiesSchema: XTENSIONS_RUNTIME_HOST_CAPABILITIES_SCHEMA,
    adapterRecordSchema: XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA,
    loadingPolicySchema: XTENSIONS_RUNTIME_LOADING_POLICY_SCHEMA,
    workpackage: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE,
    status,
    ok: status !== 'blocked',
    host,
    scope: 'host-local',
    globalRegistry: false,
    adapterCount: records.length,
    adapters: records,
    indexes: {
      byId: records.reduce((result, adapter) => {
        result[adapter.xtensionId] = adapter.adapterFingerprint;
        return result;
      }, {}),
      byFramework: records.reduce((result, adapter) => {
        const key = adapter.framework || 'unknown';
        result[key] = result[key] || [];
        result[key].push(adapter.xtensionId);
        return result;
      }, {})
    },
    diagnostics,
    registryFingerprint: sha256Value({
      hostId: host.hostId,
      adapterFingerprints: records.map((adapter) => adapter.adapterFingerprint)
    })
  };
}

function negotiateRuntimeCapabilities(adapterInput = {}, hostInput = {}, options = {}) {
  const adapter = adapterInput.schema === XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA
    ? adapterInput
    : normalizeRuntimeAdapterRecord(adapterInput, options);
  const host = hostInput.schema === XTENSIONS_RUNTIME_HOST_CAPABILITIES_SCHEMA
    ? hostInput
    : normalizeRuntimeHostCapabilities(hostInput, options);
  const diagnostics = [];
  const missingCapabilities = adapter.requiredHostCapabilities.filter((capability) => !host.capabilities.includes(capability));
  const peerDiagnostics = [];
  const versionDiagnostics = [];

  missingCapabilities.forEach((capability) => {
    diagnostics.push(createRuntimeDiagnostic(
      adapter,
      RUNTIME_CAPABILITY_MISSING_CODE,
      `Host "${host.hostId}" is missing required XTension capability "${capability}".`,
      'error',
      { field: 'requiredHostCapabilities', capability }
    ));
  });

  adapter.dependencies.forEach((dependency) => {
    const frameworkDependency = frameworkDependencyIsForbidden(dependency.name);
    if (frameworkDependency && (dependency.bundled || dependency.packageIncluded || dependency.classification === 'vendored' || dependency.classification === 'root-runtime')) {
      diagnostics.push(createRuntimeDiagnostic(
        adapter,
        RUNTIME_FRAMEWORK_DEPENDENCY_CODE,
        `Framework dependency "${dependency.name}" must remain external and must not be vendored or packaged.`,
        'error',
        { field: 'dependencies', dependency }
      ));
      return;
    }

    const provided = providedFrameworkFor(host, dependency.name);
    const dependencyAvailable = dependency.available === true || dependency.classification === 'host-provided' || dependency.classification === 'external-peer';
    if (!provided || provided.available === false || dependency.available === false || dependencyAvailable === false) {
      const diagnostic = createRuntimeDiagnostic(
        adapter,
        RUNTIME_PEER_MISSING_CODE,
        `Required peer runtime "${dependency.name}" is not available on host "${host.hostId}".`,
        hasUsableFallback(adapter) ? 'warning' : 'error',
        { field: 'dependencies', dependency }
      );
      diagnostics.push(diagnostic);
      peerDiagnostics.push(diagnostic);
      return;
    }

    if (dependency.versionRange && !versionSatisfies(provided.version, dependency.versionRange)) {
      const diagnostic = createRuntimeDiagnostic(
        adapter,
        RUNTIME_VERSION_INCOMPATIBLE_CODE,
        `Peer runtime "${dependency.name}" version "${provided.version}" does not satisfy "${dependency.versionRange}".`,
        hasUsableFallback(adapter) ? 'warning' : 'error',
        { field: 'dependencies.versionRange', dependency, provided }
      );
      diagnostics.push(diagnostic);
      versionDiagnostics.push(diagnostic);
    }
  });

  const ok = diagnostics.every((diagnostic) => diagnostic.severity !== 'error');
  const degraded = peerDiagnostics.length > 0 || versionDiagnostics.length > 0;

  return {
    schema: XTENSIONS_RUNTIME_CAPABILITY_NEGOTIATION_SCHEMA,
    adapterRecordSchema: XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA,
    hostCapabilitiesSchema: XTENSIONS_RUNTIME_HOST_CAPABILITIES_SCHEMA,
    workpackage: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE,
    ok,
    status: ok ? (degraded ? 'degraded' : 'ready') : 'blocked',
    xtensionId: adapter.xtensionId,
    framework: adapter.framework,
    hostId: host.hostId,
    missingCapabilities,
    missingPeers: peerDiagnostics.map((diagnostic) => diagnostic.metadata.dependency.name),
    versionMismatches: versionDiagnostics.map((diagnostic) => diagnostic.metadata.dependency.name),
    diagnostics
  };
}

function resolveAdapterLoadingPolicy(adapterInput = {}, hostInput = {}, request = {}, options = {}) {
  const adapter = adapterInput.schema === XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA
    ? adapterInput
    : normalizeRuntimeAdapterRecord(adapterInput, options);
  const host = hostInput.schema === XTENSIONS_RUNTIME_HOST_CAPABILITIES_SCHEMA
    ? hostInput
    : normalizeRuntimeHostCapabilities(hostInput, options);
  const policy = normalizeRuntimeLoadingPolicy({
    ...host.loadingPolicy,
    ...(adapter.loadingPolicy || {})
  });
  const diagnostics = [];
  let status = 'loaded';
  let action = 'load-adapter';

  if (request.enabled === false || request.skip === true || adapter.status === 'disabled') {
    return {
      schema: XTENSIONS_RUNTIME_LOAD_DECISION_SCHEMA,
      registrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
      negotiationSchema: XTENSIONS_RUNTIME_CAPABILITY_NEGOTIATION_SCHEMA,
      workpackage: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE,
      ok: true,
      status: 'skipped',
      action: 'skip',
      xtensionId: adapter.xtensionId,
      framework: adapter.framework,
      hostId: host.hostId,
      surfaceId: normalizeString(request.surfaceId || request.targetSurfaceId || ''),
      dynamicImportAllowed: false,
      runtimeExecutionRequired: false,
      fallback: null,
      negotiation: null,
      diagnostics,
      loadToken: sha256Value({ hostId: host.hostId, xtensionId: adapter.xtensionId, reason: 'skipped' }),
      timestamp: timestampFromOptions(options)
    };
  }

  if (adapter.globalRegistry || policy.scope === 'global' || policy.allowGlobalRegistry === true) {
    diagnostics.push(createRuntimeDiagnostic(
      adapter,
      RUNTIME_GLOBAL_REGISTRY_FORBIDDEN_CODE,
      'XTension adapters must register through the host-local Surface/Adapter path, not a global registry.',
      'error',
      { field: 'registry.scope' }
    ));
    status = 'policy-blocked';
    action = 'block';
  }

  if (adapter.status === 'policy-blocked' || request.policyStatus === 'blocked') {
    diagnostics.push(createRuntimeDiagnostic(
      adapter,
      RUNTIME_POLICY_BLOCKED_CODE,
      'XTension adapter loading is blocked by host or manifest policy.',
      'error',
      { field: 'policy.status' }
    ));
    status = 'policy-blocked';
    action = 'block';
  }

  if (adapter.entry.dynamicImport && policy.dynamicImportRequiresIntegrity && !adapter.integrity.sha256) {
    diagnostics.push(createRuntimeDiagnostic(
      adapter,
      RUNTIME_INTEGRITY_MISSING_CODE,
      'Dynamic XTension adapter loading requires sha256 integrity.',
      'error',
      { field: 'integrity.sha256' }
    ));
    if (status !== 'policy-blocked') {
      status = 'failed';
      action = 'render-fallback';
    }
  }

  const negotiation = policy.capabilityNegotiationRequired
    ? negotiateRuntimeCapabilities(adapter, host, options)
    : null;
  if (negotiation) diagnostics.push(...negotiation.diagnostics);

  if (negotiation && negotiation.status === 'degraded' && status === 'loaded') {
    status = 'degraded';
    action = 'render-fallback';
  }

  if (negotiation && negotiation.status === 'blocked' && status === 'loaded') {
    status = hasUsableFallback(adapter) ? 'degraded' : 'failed';
    action = hasUsableFallback(adapter) ? 'render-fallback' : 'fail';
  }

  if ((status === 'degraded' || status === 'failed') && policy.fallbackRequired && !hasUsableFallback(adapter)) {
    diagnostics.push(createRuntimeDiagnostic(
      adapter,
      RUNTIME_FALLBACK_MISSING_CODE,
      'Degraded or failed XTension adapter loading requires a fallback surface.',
      'error',
      { field: 'fallback' }
    ));
    status = 'failed';
    action = 'fail';
  }

  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const ok = status !== 'failed' && status !== 'policy-blocked' && errorCount === 0;

  return {
    schema: XTENSIONS_RUNTIME_LOAD_DECISION_SCHEMA,
    registrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    loadingPolicySchema: XTENSIONS_RUNTIME_LOADING_POLICY_SCHEMA,
    negotiationSchema: XTENSIONS_RUNTIME_CAPABILITY_NEGOTIATION_SCHEMA,
    workpackage: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE,
    ok,
    status,
    action,
    xtensionId: adapter.xtensionId,
    framework: adapter.framework,
    hostId: host.hostId,
    surfaceId: normalizeString(request.surfaceId || request.targetSurfaceId || ''),
    dynamicImportAllowed: status === 'loaded' && adapter.entry.dynamicImport === true,
    runtimeExecutionRequired: false,
    fallback: status === 'degraded' || status === 'failed' ? cloneJson(adapter.fallback) : null,
    negotiation,
    diagnostics,
    loadToken: sha256Value({
      hostId: host.hostId,
      xtensionId: adapter.xtensionId,
      surfaceId: normalizeString(request.surfaceId || request.targetSurfaceId || ''),
      status,
      adapterFingerprint: adapter.adapterFingerprint
    }),
    timestamp: timestampFromOptions(options)
  };
}

function createXTensionsRuntimeReport(input = {}, options = {}) {
  const registry = input.registry && input.registry.schema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA
    ? input.registry
    : createXTensionsRuntimeCapabilityRegistry(input, options);
  const host = registry.host;
  const requestEntries = toArray(input.requests);
  const requests = requestEntries.length > 0
    ? requestEntries
    : registry.adapters.map((adapter) => ({
      xtensionId: adapter.xtensionId,
      surfaceId: `surface:${adapter.xtensionId}`
    }));
  const decisions = requests.map((request) => {
    const adapter = registry.adapters.find((candidate) => candidate.xtensionId === (request.xtensionId || request.id));
    if (!adapter) {
      const diagnostic = createRuntimeDiagnostic(
        request,
        RUNTIME_ADAPTER_MISSING_CODE,
        `XTension adapter "${request.xtensionId || request.id || 'unknown'}" is not registered on host "${host.hostId}".`,
        'error',
        { field: 'requests.xtensionId', request }
      );
      return {
        schema: XTENSIONS_RUNTIME_LOAD_DECISION_SCHEMA,
        registrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
        negotiationSchema: XTENSIONS_RUNTIME_CAPABILITY_NEGOTIATION_SCHEMA,
        workpackage: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE,
        ok: false,
        status: 'failed',
        action: 'fail',
        xtensionId: request.xtensionId || request.id || null,
        framework: null,
        hostId: host.hostId,
        surfaceId: normalizeString(request.surfaceId || ''),
        dynamicImportAllowed: false,
        runtimeExecutionRequired: false,
        fallback: null,
        negotiation: null,
        diagnostics: [diagnostic],
        loadToken: sha256Value({ hostId: host.hostId, request, status: 'missing-adapter' }),
        timestamp: timestampFromOptions(options)
      };
    }
    return resolveAdapterLoadingPolicy(adapter, host, request, options);
  });

  const diagnostics = registry.diagnostics.concat(decisions.flatMap((decision) => decision.diagnostics || []));
  const failedCount = decisions.filter((decision) => decision.status === 'failed').length;
  const policyBlockedCount = decisions.filter((decision) => decision.status === 'policy-blocked').length;
  const degradedCount = decisions.filter((decision) => decision.status === 'degraded').length;
  const loadedCount = decisions.filter((decision) => decision.status === 'loaded').length;
  const skippedCount = decisions.filter((decision) => decision.status === 'skipped').length;
  const appShellBlocked = failedCount > 0 || registry.globalRegistry === true;
  const status = appShellBlocked ? 'blocked' : (degradedCount > 0 || policyBlockedCount > 0 ? 'degraded' : 'ready');

  return {
    schema: XTENSIONS_RUNTIME_REPORT_SCHEMA,
    registrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    adapterRecordSchema: XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA,
    loadingPolicySchema: XTENSIONS_RUNTIME_LOADING_POLICY_SCHEMA,
    loadDecisionSchema: XTENSIONS_RUNTIME_LOAD_DECISION_SCHEMA,
    negotiationSchema: XTENSIONS_RUNTIME_CAPABILITY_NEGOTIATION_SCHEMA,
    workpackage: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE,
    ok: !appShellBlocked,
    status,
    appShellBlocked,
    hostId: host.hostId,
    adapterCount: registry.adapterCount,
    requestCount: requests.length,
    loadedCount,
    skippedCount,
    degradedCount,
    failedCount,
    policyBlockedCount,
    registry,
    decisions,
    diagnostics,
    runtimeExecutionRequired: false,
    timestamp: timestampFromOptions(options)
  };
}

function assertRuntimeCapabilityDependencyBoundary(input = {}) {
  const dependencyCheck = assertNoFrameworkDependencies(input);
  return {
    ok: dependencyCheck.ok,
    diagnostics: dependencyCheck.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      schema: XTENSIONS_RUNTIME_DIAGNOSTIC_SCHEMA,
      source: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
      workpackage: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE,
      code: RUNTIME_FRAMEWORK_DEPENDENCY_CODE
    })),
    forbiddenFrameworkDependencies: dependencyCheck.forbiddenFrameworkDependencies
  };
}

function serializeRuntimeCapabilityRegistryReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

module.exports = {
  DEFAULT_RUNTIME_HOST_CAPABILITIES,
  DEFAULT_RUNTIME_LOADING_POLICY,
  RUNTIME_ADAPTER_MISSING_CODE,
  RUNTIME_CAPABILITY_MISSING_CODE,
  RUNTIME_FALLBACK_MISSING_CODE,
  RUNTIME_FRAMEWORK_DEPENDENCY_CODE,
  RUNTIME_GLOBAL_REGISTRY_FORBIDDEN_CODE,
  RUNTIME_INTEGRITY_MISSING_CODE,
  RUNTIME_LOAD_STATUSES,
  RUNTIME_PEER_MISSING_CODE,
  RUNTIME_POLICY_BLOCKED_CODE,
  RUNTIME_REGISTRY_BOUNDARIES,
  RUNTIME_VERSION_INCOMPATIBLE_CODE,
  XTENSIONS_RUNTIME_ADAPTER_RECORD_SCHEMA,
  XTENSIONS_RUNTIME_CAPABILITY_NEGOTIATION_SCHEMA,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_CONTRACT_PATH,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_FIXTURE_PATH,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_MODULE_PATH,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_PACKAGE_SCRIPT,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SUITE_PATH,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_TYPES_PATH,
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_WORKPACKAGE,
  XTENSIONS_RUNTIME_DIAGNOSTIC_SCHEMA,
  XTENSIONS_RUNTIME_HOST_CAPABILITIES_SCHEMA,
  XTENSIONS_RUNTIME_LOAD_DECISION_SCHEMA,
  XTENSIONS_RUNTIME_LOADING_POLICY_SCHEMA,
  XTENSIONS_RUNTIME_REPORT_SCHEMA,
  assertRuntimeCapabilityDependencyBoundary,
  createRuntimeDiagnostic,
  createXTensionsRuntimeCapabilityRegistry,
  createXTensionsRuntimeReport,
  negotiateRuntimeCapabilities,
  normalizeRuntimeAdapterRecord,
  normalizeRuntimeHostCapabilities,
  normalizeRuntimeLoadingPolicy,
  resolveAdapterLoadingPolicy,
  serializeRuntimeCapabilityRegistryReport,
  versionSatisfies
};
