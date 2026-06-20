'use strict';

const crypto = require('crypto');
const {
  FORBIDDEN_FRAMEWORK_DEPENDENCIES,
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
  assertNoFrameworkDependencies
} = require('./host-controller-contract');
const {
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
  XTENSIONS_KERNEL_SIGNAL_SCHEMA,
  XTENSIONS_SURFACE_EVENT_SCHEMA
} = require('./signal-bridge-contract');

const XTENSIONS_MARACA_MANIFEST_SCHEMA = 'xtend.maraca.xtension-manifest.v1';
const XTENSIONS_MARACA_CONTRACT_SNAPSHOT_SCHEMA = 'xtend.maraca.xtension-contract-snapshot.v1';
const XTENSIONS_MARACA_ARTIFACT_SCHEMA = 'xtend.maraca.xtension-artifact.v1';
const XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA = 'xtend.maraca.xtension-build-provenance.v1';
const XTENSIONS_MARACA_BUILD_PLAN_SCHEMA = 'xtend.maraca.xtension-build-plan.v1';
const XTENSIONS_MARACA_BUNDLE_REPORT_SCHEMA = 'xtend.maraca.xtensions-bundle-report.v1';
const XTENSIONS_MARACA_BUNDLE_SECTION_SCHEMA = 'xtend.maraca.xtensions-bundle-section.v1';
const XTENSIONS_MARACA_DEPENDENCY_CLASSIFICATION_SCHEMA = 'xtend.maraca.xtension-dependency-classification.v1';
const XTENSIONS_MARACA_DIAGNOSTIC_SCHEMA = 'xtend.maraca.xtension-diagnostic.v1';
const XTENSIONS_MARACA_MODULE_PATH = 'tools/xtensions/maraca-xtension-manifest.js';
const XTENSIONS_MARACA_TYPES_PATH = 'tools/xtensions/maraca-xtension-manifest.d.ts';
const XTENSIONS_MARACA_SUITE_PATH = 'tests/xtensions/maraca_xtensions_suite.js';
const XTENSIONS_MARACA_CONTRACT_PATH = 'development/XTensions-Maraca-Manifest-and-Build-Provenance-Contract.md';
const XTENSIONS_MARACA_VALID_FIXTURE_PATH = 'tests/fixtures/xtensions/maraca-xtension-manifest-valid.json';
const XTENSIONS_MARACA_MISSING_FIXTURE_PATH = 'tests/fixtures/xtensions/maraca-xtension-manifest-missing.json';
const XTENSIONS_MARACA_POLICY_BLOCKED_FIXTURE_PATH = 'tests/fixtures/xtensions/maraca-xtension-manifest-policy-blocked.json';
const XTENSIONS_MARACA_WORKPACKAGE = 'XTN-03';
const XTENSIONS_MARACA_PACKAGE_SCRIPT = 'npm run test:maraca-xtensions';

const MARACA_XTENSION_MANIFEST_MISSING_CODE = 'xtensions.maraca.manifest_missing';
const MARACA_XTENSION_ID_MISSING_CODE = 'xtensions.maraca.id_missing';
const MARACA_XTENSION_ENTRY_MISSING_CODE = 'xtensions.maraca.entry_missing';
const MARACA_XTENSION_FRAMEWORK_MISSING_CODE = 'xtensions.maraca.framework_missing';
const MARACA_XTENSION_VERSION_MISSING_CODE = 'xtensions.maraca.version_missing';
const MARACA_XTENSION_CONTRACT_MISSING_CODE = 'xtensions.maraca.contract_missing';
const MARACA_XTENSION_LAZY_POLICY_MISSING_CODE = 'xtensions.maraca.lazy_policy_missing';
const MARACA_XTENSION_LAZY_MODE_INVALID_CODE = 'xtensions.maraca.lazy_mode_invalid';
const MARACA_XTENSION_INTEGRITY_MISSING_CODE = 'xtensions.maraca.integrity_missing';
const MARACA_XTENSION_CSP_MISSING_CODE = 'xtensions.maraca.csp_missing';
const MARACA_XTENSION_FALLBACK_MISSING_CODE = 'xtensions.maraca.fallback_missing';
const MARACA_XTENSION_POLICY_BLOCKED_CODE = 'xtensions.maraca.policy_blocked';
const MARACA_XTENSION_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.maraca.framework_dependency';
const MARACA_XTENSION_VENDORED_FRAMEWORK_CODE = 'xtensions.maraca.vendored_framework';

const VALID_XTENSION_LAZY_MODES = Object.freeze(['none', 'explicit', 'route', 'visible', 'idle']);
const VALID_XTENSION_FALLBACK_MODES = Object.freeze(['native-placeholder', 'host-error-boundary', 'skip', 'static-html']);
const VALID_XTENSION_DEPENDENCY_CLASSIFICATIONS = Object.freeze([
  'none',
  'external-peer',
  'optional-peer',
  'host-provided',
  'policy-blocked',
  'vendored',
  'root-runtime'
]);
const BLOCKING_DEPENDENCY_CLASSIFICATIONS = Object.freeze(['vendored', 'root-runtime', 'policy-blocked']);

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

function stableStringify(value) {
  return JSON.stringify(stableSort(value));
}

function sha256Value(value) {
  return `sha256:${crypto.createHash('sha256').update(stableStringify(value)).digest('hex')}`;
}

function timestampFromOptions(options = {}) {
  if (options.timestamp) return options.timestamp;
  if (typeof options.clock === 'function') return options.clock();
  return new Date().toISOString();
}

function dependencyNameIsForbidden(name) {
  const normalized = normalizeString(name);
  return FORBIDDEN_FRAMEWORK_DEPENDENCIES.some((dependency) => (
    normalized === dependency || normalized.startsWith(`${dependency}/`)
  ));
}

function createMaracaXTensionDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_MARACA_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_MARACA_MANIFEST_SCHEMA,
    workpackage: XTENSIONS_MARACA_WORKPACKAGE,
    severity,
    code,
    message,
    xtensionId: subject && subject.id || subject && subject.xtensionId || null,
    framework: subject && subject.framework || null,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function normalizeEntry(entry) {
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

function normalizeLazyPolicy(lazy) {
  if (lazy === true) {
    return {
      mode: 'explicit',
      optIn: true,
      policy: 'manifest-policy',
      prefetch: false,
      preload: false
    };
  }

  if (typeof lazy === 'string') {
    return {
      mode: normalizeString(lazy),
      optIn: normalizeString(lazy) !== 'none',
      policy: normalizeString(lazy) === 'none' ? 'none' : 'manifest-policy',
      prefetch: false,
      preload: false
    };
  }

  const source = lazy && typeof lazy === 'object' ? lazy : {};
  const mode = normalizeString(source.mode || 'none') || 'none';
  return {
    mode,
    optIn: mode === 'none' ? false : source.optIn === true,
    policy: normalizeString(source.policy || (mode === 'none' ? 'none' : '')),
    prefetch: source.prefetch === true,
    preload: source.preload === true
  };
}

function normalizeContractSnapshot(contract = {}) {
  const source = contract && typeof contract === 'object' ? contract : {};
  const snapshot = {
    schema: XTENSIONS_MARACA_CONTRACT_SNAPSHOT_SCHEMA,
    hostControllerSchema: normalizeString(source.hostControllerSchema || source.hostController || XTENSIONS_HOST_CONTROLLER_SCHEMA),
    signalBridgeSchema: normalizeString(source.signalBridgeSchema || source.signalBridge || XTENSIONS_SIGNAL_BRIDGE_SCHEMA),
    kernelSignalSchema: normalizeString(source.kernelSignalSchema || XTENSIONS_KERNEL_SIGNAL_SCHEMA),
    surfaceEventSchema: normalizeString(source.surfaceEventSchema || XTENSIONS_SURFACE_EVENT_SCHEMA),
    accepts: toArray(source.accepts).map(normalizeString).filter(Boolean),
    emits: toArray(source.emits).map(normalizeString).filter(Boolean),
    capabilities: toArray(source.capabilities).map(normalizeString).filter(Boolean),
    source: cloneJson(source)
  };
  snapshot.fingerprint = sha256Value({
    hostControllerSchema: snapshot.hostControllerSchema,
    signalBridgeSchema: snapshot.signalBridgeSchema,
    kernelSignalSchema: snapshot.kernelSignalSchema,
    surfaceEventSchema: snapshot.surfaceEventSchema,
    accepts: snapshot.accepts,
    emits: snapshot.emits,
    capabilities: snapshot.capabilities
  });
  return snapshot;
}

function normalizeCsp(csp = {}) {
  const source = csp && typeof csp === 'object' ? csp : {};
  return {
    scriptSrc: toArray(source.scriptSrc || source['script-src']).map(normalizeString).filter(Boolean),
    connectSrc: toArray(source.connectSrc || source['connect-src']).map(normalizeString).filter(Boolean),
    workerSrc: toArray(source.workerSrc || source['worker-src']).map(normalizeString).filter(Boolean),
    styleSrc: toArray(source.styleSrc || source['style-src']).map(normalizeString).filter(Boolean),
    imgSrc: toArray(source.imgSrc || source['img-src']).map(normalizeString).filter(Boolean)
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

function normalizeDependencyEntry(dependency) {
  if (typeof dependency === 'string') {
    return {
      name: normalizeString(dependency),
      versionRange: '',
      classification: 'external-peer',
      bundled: false,
      packageIncluded: false
    };
  }

  const source = dependency && typeof dependency === 'object' ? dependency : {};
  return {
    name: normalizeString(source.name || source.package),
    versionRange: normalizeString(source.versionRange || source.version || source.range),
    classification: normalizeString(source.classification || source.kind || 'external-peer') || 'external-peer',
    bundled: source.bundled === true || source.vendored === true,
    packageIncluded: source.packageIncluded === true || source.rootDependency === true
  };
}

function classifyXTensionDependencies(manifest = {}) {
  const dependencies = toArray(manifest.dependencies || manifest.peerDependencies).map(normalizeDependencyEntry).filter((entry) => entry.name);
  const diagnostics = [];
  const records = dependencies.map((dependency) => {
    const frameworkDependency = dependencyNameIsForbidden(dependency.name);
    const classificationKnown = VALID_XTENSION_DEPENDENCY_CLASSIFICATIONS.includes(dependency.classification);
    const blocked = dependency.bundled
      || dependency.packageIncluded
      || BLOCKING_DEPENDENCY_CLASSIFICATIONS.includes(dependency.classification)
      || !classificationKnown;
    const record = {
      schema: XTENSIONS_MARACA_DEPENDENCY_CLASSIFICATION_SCHEMA,
      name: dependency.name,
      versionRange: dependency.versionRange,
      classification: classificationKnown ? dependency.classification : 'policy-blocked',
      frameworkDependency,
      bundled: dependency.bundled,
      packageIncluded: dependency.packageIncluded,
      allowed: !blocked
    };

    if (frameworkDependency && blocked) {
      diagnostics.push(createMaracaXTensionDiagnostic(
        manifest,
        MARACA_XTENSION_VENDORED_FRAMEWORK_CODE,
        `Framework dependency "${dependency.name}" must remain external and must not be vendored or packaged.`,
        'error',
        { field: 'dependencies', dependency: record }
      ));
    } else if (!classificationKnown) {
      diagnostics.push(createMaracaXTensionDiagnostic(
        manifest,
        MARACA_XTENSION_POLICY_BLOCKED_CODE,
        `Dependency "${dependency.name}" has unsupported classification "${dependency.classification}".`,
        'error',
        { field: 'dependencies', dependency: record }
      ));
    }

    return record;
  });

  return {
    schema: XTENSIONS_MARACA_DEPENDENCY_CLASSIFICATION_SCHEMA,
    dependencies: records,
    diagnostics,
    dependencyCount: records.length,
    packageDependencyCount: records.filter((record) => record.packageIncluded).length,
    vendoredDependencyCount: records.filter((record) => record.bundled).length,
    externalPeerCount: records.filter((record) => record.classification === 'external-peer').length,
    ok: diagnostics.length === 0 && records.every((record) => record.allowed)
  };
}

function validateManifest(manifest) {
  const diagnostics = [];

  if (!manifest.id) {
    diagnostics.push(createMaracaXTensionDiagnostic(
      manifest,
      MARACA_XTENSION_ID_MISSING_CODE,
      'XTension manifest must declare an id.',
      'error',
      { field: 'id' }
    ));
  }

  if (!manifest.framework) {
    diagnostics.push(createMaracaXTensionDiagnostic(
      manifest,
      MARACA_XTENSION_FRAMEWORK_MISSING_CODE,
      'XTension manifest must declare a framework.',
      'error',
      { field: 'framework' }
    ));
  }

  if (!manifest.version) {
    diagnostics.push(createMaracaXTensionDiagnostic(
      manifest,
      MARACA_XTENSION_VERSION_MISSING_CODE,
      'XTension manifest must declare a version.',
      'error',
      { field: 'version' }
    ));
  }

  if (!manifest.entry.module) {
    diagnostics.push(createMaracaXTensionDiagnostic(
      manifest,
      MARACA_XTENSION_ENTRY_MISSING_CODE,
      'XTension manifest must declare entry.module.',
      'error',
      { field: 'entry.module' }
    ));
  }

  if (!manifest.contractSnapshot.hostControllerSchema || !manifest.contractSnapshot.signalBridgeSchema) {
    diagnostics.push(createMaracaXTensionDiagnostic(
      manifest,
      MARACA_XTENSION_CONTRACT_MISSING_CODE,
      'XTension manifest must declare HostController and Signal Bridge contract schemas.',
      'error',
      { field: 'contract' }
    ));
  }

  if (!VALID_XTENSION_LAZY_MODES.includes(manifest.lazy.mode)) {
    diagnostics.push(createMaracaXTensionDiagnostic(
      manifest,
      MARACA_XTENSION_LAZY_MODE_INVALID_CODE,
      `XTension lazy mode "${manifest.lazy.mode || 'missing'}" is unsupported.`,
      'error',
      { field: 'lazy.mode', allowedModes: VALID_XTENSION_LAZY_MODES.slice() }
    ));
  }

  if (manifest.lazy.mode !== 'none' && (manifest.lazy.optIn !== true || !manifest.lazy.policy)) {
    diagnostics.push(createMaracaXTensionDiagnostic(
      manifest,
      MARACA_XTENSION_LAZY_POLICY_MISSING_CODE,
      'Lazy XTensions must opt in and declare a lazy policy.',
      'error',
      { field: 'lazy' }
    ));
  }

  if (!manifest.integrity.sha256 || !manifest.integrity.sha256.startsWith('sha256:')) {
    diagnostics.push(createMaracaXTensionDiagnostic(
      manifest,
      MARACA_XTENSION_INTEGRITY_MISSING_CODE,
      'XTension manifest must declare sha256 integrity.',
      'error',
      { field: 'integrity.sha256' }
    ));
  }

  if (manifest.csp.scriptSrc.length === 0 || manifest.csp.connectSrc.length === 0) {
    diagnostics.push(createMaracaXTensionDiagnostic(
      manifest,
      MARACA_XTENSION_CSP_MISSING_CODE,
      'XTension manifest must declare CSP scriptSrc and connectSrc requirements.',
      'error',
      { field: 'csp' }
    ));
  }

  if (!VALID_XTENSION_FALLBACK_MODES.includes(manifest.fallback.mode) || !manifest.fallback.message) {
    diagnostics.push(createMaracaXTensionDiagnostic(
      manifest,
      MARACA_XTENSION_FALLBACK_MISSING_CODE,
      'XTension manifest must declare a supported fallback mode and message.',
      'error',
      { field: 'fallback' }
    ));
  }

  if (manifest.policy && manifest.policy.status === 'blocked') {
    diagnostics.push(createMaracaXTensionDiagnostic(
      manifest,
      MARACA_XTENSION_POLICY_BLOCKED_CODE,
      'XTension manifest is blocked by policy.',
      'error',
      { field: 'policy', reason: manifest.policy.reason || 'unspecified' }
    ));
  }

  return diagnostics;
}

function createMissingManifestRecord(reference = {}, options = {}) {
  const subject = {
    id: normalizeString(reference.id || reference.xtensionId || 'missing-xtension'),
    framework: normalizeString(reference.framework || '')
  };
  const diagnostic = createMaracaXTensionDiagnostic(
    subject,
    MARACA_XTENSION_MANIFEST_MISSING_CODE,
    `XTension manifest "${subject.id}" is missing.`,
    'error',
    { field: 'manifest', reference: cloneJson(reference) || {} }
  );

  return {
    schema: XTENSIONS_MARACA_MANIFEST_SCHEMA,
    id: subject.id,
    framework: subject.framework,
    version: '',
    status: 'missing',
    ok: false,
    diagnostics: [diagnostic],
    manifestFingerprint: sha256Value({ missing: subject.id, timestampPolicy: 'stable' }),
    artifactFingerprint: null,
    contractSnapshot: null,
    timestamp: timestampFromOptions(options)
  };
}

function normalizeXTensionManifest(input = {}, options = {}) {
  if (!input || input.missing === true || input.manifest === null) {
    return createMissingManifestRecord(input || {}, options);
  }

  const source = input.manifest && typeof input.manifest === 'object' ? input.manifest : input;
  const entry = normalizeEntry(source.entry);
  const lazy = normalizeLazyPolicy(source.lazy);
  const contractSnapshot = normalizeContractSnapshot(source.contract || source.contractSnapshot);
  const csp = normalizeCsp(source.csp);
  const fallback = normalizeFallback(source.fallback);
  const integrity = normalizeIntegrity(source.integrity);
  const dependencies = classifyXTensionDependencies(source);
  const manifest = {
    schema: XTENSIONS_MARACA_MANIFEST_SCHEMA,
    id: normalizeString(source.id || source.xtensionId),
    name: normalizeString(source.name || source.id || source.xtensionId),
    framework: normalizeString(source.framework),
    version: normalizeString(source.version),
    entry,
    lazy,
    contractSnapshot,
    capabilities: toArray(source.capabilities || contractSnapshot.capabilities).map(normalizeString).filter(Boolean),
    integrity,
    csp,
    fallback,
    dependencies,
    policy: cloneJson(source.policy || {}),
    source: cloneJson(source),
    timestamp: timestampFromOptions(options),
    diagnostics: []
  };
  const manifestDiagnostics = validateManifest(manifest).concat(dependencies.diagnostics);
  manifest.diagnostics = manifestDiagnostics;
  manifest.ok = manifestDiagnostics.every((diagnostic) => diagnostic.severity !== 'error');
  manifest.status = manifest.ok ? 'ready' : (manifestDiagnostics.some((diagnostic) => diagnostic.code === MARACA_XTENSION_POLICY_BLOCKED_CODE || diagnostic.code === MARACA_XTENSION_VENDORED_FRAMEWORK_CODE) ? 'policy-blocked' : 'blocked');
  manifest.manifestFingerprint = sha256Value({
    schema: manifest.schema,
    id: manifest.id,
    framework: manifest.framework,
    version: manifest.version,
    entry: manifest.entry,
    lazy: manifest.lazy,
    contractSnapshotFingerprint: manifest.contractSnapshot.fingerprint,
    capabilities: manifest.capabilities,
    csp: manifest.csp,
    fallback: manifest.fallback,
    dependencies: manifest.dependencies.dependencies.map((dependency) => ({
      name: dependency.name,
      classification: dependency.classification,
      bundled: dependency.bundled,
      packageIncluded: dependency.packageIncluded
    }))
  });
  manifest.artifactFingerprint = sha256Value({
    manifestFingerprint: manifest.manifestFingerprint,
    integrity: manifest.integrity,
    entry: manifest.entry
  });
  return manifest;
}

function createXTensionArtifact(manifest, options = {}) {
  const source = manifest && manifest.schema === XTENSIONS_MARACA_MANIFEST_SCHEMA ? manifest : normalizeXTensionManifest(manifest, options);
  const artifact = {
    schema: XTENSIONS_MARACA_ARTIFACT_SCHEMA,
    xtensionId: source.id,
    framework: source.framework,
    version: source.version,
    status: source.status,
    entry: source.entry ? cloneJson(source.entry) : null,
    lazy: source.lazy ? cloneJson(source.lazy) : null,
    integrity: source.integrity ? cloneJson(source.integrity) : null,
    csp: source.csp ? cloneJson(source.csp) : null,
    fallback: source.fallback ? cloneJson(source.fallback) : null,
    contractSnapshot: source.contractSnapshot ? cloneJson(source.contractSnapshot) : null,
    manifestFingerprint: source.manifestFingerprint,
    artifactFingerprint: source.artifactFingerprint,
    diagnostics: source.diagnostics ? source.diagnostics.map(cloneJson) : [],
    timestamp: timestampFromOptions(options)
  };
  artifact.provenance = createXTensionBuildProvenance(source, artifact, options);
  return artifact;
}

function createXTensionBuildProvenance(manifest, artifact, options = {}) {
  return {
    schema: XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA,
    xtensionId: manifest && manifest.id || null,
    framework: manifest && manifest.framework || null,
    source: 'maraca-xtension-manifest',
    buildId: options.buildId || `xtension:${manifest && manifest.id || 'unknown'}`,
    manifestFingerprint: manifest && manifest.manifestFingerprint || null,
    contractFingerprint: manifest && manifest.contractSnapshot && manifest.contractSnapshot.fingerprint || null,
    artifactFingerprint: artifact && artifact.artifactFingerprint || manifest && manifest.artifactFingerprint || null,
    integrity: manifest && manifest.integrity ? cloneJson(manifest.integrity) : null,
    dependencyClassification: manifest && manifest.dependencies ? cloneJson(manifest.dependencies) : null,
    packageIncluded: false,
    vendoredFrameworksAllowed: false,
    frameworkDependenciesAllowed: false,
    timestamp: timestampFromOptions(options)
  };
}

function createMaracaXTensionBuildPlan(input = {}, options = {}) {
  const manifestInputs = toArray(input.xtensions || input.manifests || input.manifest);
  const manifests = manifestInputs.length > 0
    ? manifestInputs.map((entry) => normalizeXTensionManifest(entry, options))
    : [createMissingManifestRecord({ id: input.requiredXtensionId || 'missing-xtension' }, options)];
  const artifacts = manifests.map((manifest) => createXTensionArtifact(manifest, options));
  const diagnostics = manifests.flatMap((manifest) => manifest.diagnostics || []);
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: XTENSIONS_MARACA_BUILD_PLAN_SCHEMA,
    manifestSchema: XTENSIONS_MARACA_MANIFEST_SCHEMA,
    artifactSchema: XTENSIONS_MARACA_ARTIFACT_SCHEMA,
    provenanceSchema: XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA,
    workpackage: XTENSIONS_MARACA_WORKPACKAGE,
    status,
    ok: status !== 'blocked',
    outDir: normalizeString(input.outDir || input.out || '.xtend-build/maraca/xtensions'),
    manifestCount: manifests.length,
    artifactCount: artifacts.length,
    xtensionIds: manifests.map((manifest) => manifest.id).filter(Boolean),
    manifests,
    artifacts,
    diagnostics
  };
}

function createMaracaXTensionsBundleReport(input = {}, options = {}) {
  const plan = input && input.schema === XTENSIONS_MARACA_BUILD_PLAN_SCHEMA
    ? input
    : createMaracaXTensionBuildPlan(input, options);
  const readyArtifacts = plan.artifacts.filter((artifact) => artifact.status === 'ready');
  const blockedArtifacts = plan.artifacts.filter((artifact) => artifact.status !== 'ready');
  const section = {
    schema: XTENSIONS_MARACA_BUNDLE_SECTION_SCHEMA,
    status: plan.status,
    ok: plan.ok,
    artifactCount: plan.artifactCount,
    readyArtifactCount: readyArtifacts.length,
    blockedArtifactCount: blockedArtifacts.length,
    manifestFingerprints: plan.manifests.map((manifest) => manifest.manifestFingerprint).filter(Boolean),
    artifactFingerprints: plan.artifacts.map((artifact) => artifact.artifactFingerprint).filter(Boolean),
    lazyPolicies: plan.manifests.map((manifest) => ({
      xtensionId: manifest.id,
      mode: manifest.lazy && manifest.lazy.mode || 'missing',
      optIn: manifest.lazy && manifest.lazy.optIn === true,
      policy: manifest.lazy && manifest.lazy.policy || ''
    })),
    dependencyClassifications: plan.manifests.map((manifest) => manifest.dependencies).filter(Boolean),
    artifacts: plan.artifacts.map(cloneJson)
  };

  return {
    schema: XTENSIONS_MARACA_BUNDLE_REPORT_SCHEMA,
    manifestSchema: XTENSIONS_MARACA_MANIFEST_SCHEMA,
    buildPlanSchema: XTENSIONS_MARACA_BUILD_PLAN_SCHEMA,
    sectionSchema: XTENSIONS_MARACA_BUNDLE_SECTION_SCHEMA,
    artifactSchema: XTENSIONS_MARACA_ARTIFACT_SCHEMA,
    provenanceSchema: XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA,
    workpackage: XTENSIONS_MARACA_WORKPACKAGE,
    status: plan.status,
    ok: plan.ok,
    outDir: plan.outDir,
    xtensions: section,
    diagnostics: plan.diagnostics.map(cloneJson),
    timestamp: timestampFromOptions(options)
  };
}

function assertMaracaXTensionDependencyBoundary(input = {}) {
  const frameworkDependencyCheck = assertNoFrameworkDependencies(input);
  const manifestInputs = toArray(input.xtensions || input.manifests || input.manifest);
  const manifestClassifications = manifestInputs.map((manifest) => classifyXTensionDependencies(manifest.manifest || manifest));
  const diagnostics = frameworkDependencyCheck.diagnostics.map((diagnostic) => ({
    ...diagnostic,
    code: MARACA_XTENSION_FRAMEWORK_DEPENDENCY_CODE
  })).concat(manifestClassifications.flatMap((classification) => classification.diagnostics || []));

  return {
    ok: diagnostics.length === 0 && manifestClassifications.every((classification) => classification.ok !== false),
    diagnostics,
    forbiddenFrameworkDependencies: frameworkDependencyCheck.forbiddenFrameworkDependencies,
    manifestClassifications
  };
}

function serializeMaracaXTensionReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

module.exports = {
  BLOCKING_DEPENDENCY_CLASSIFICATIONS,
  MARACA_XTENSION_CONTRACT_MISSING_CODE,
  MARACA_XTENSION_CSP_MISSING_CODE,
  MARACA_XTENSION_ENTRY_MISSING_CODE,
  MARACA_XTENSION_FALLBACK_MISSING_CODE,
  MARACA_XTENSION_FRAMEWORK_DEPENDENCY_CODE,
  MARACA_XTENSION_FRAMEWORK_MISSING_CODE,
  MARACA_XTENSION_ID_MISSING_CODE,
  MARACA_XTENSION_INTEGRITY_MISSING_CODE,
  MARACA_XTENSION_LAZY_MODE_INVALID_CODE,
  MARACA_XTENSION_LAZY_POLICY_MISSING_CODE,
  MARACA_XTENSION_MANIFEST_MISSING_CODE,
  MARACA_XTENSION_POLICY_BLOCKED_CODE,
  MARACA_XTENSION_VENDORED_FRAMEWORK_CODE,
  MARACA_XTENSION_VERSION_MISSING_CODE,
  VALID_XTENSION_DEPENDENCY_CLASSIFICATIONS,
  VALID_XTENSION_FALLBACK_MODES,
  VALID_XTENSION_LAZY_MODES,
  XTENSIONS_MARACA_ARTIFACT_SCHEMA,
  XTENSIONS_MARACA_BUILD_PLAN_SCHEMA,
  XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA,
  XTENSIONS_MARACA_BUNDLE_REPORT_SCHEMA,
  XTENSIONS_MARACA_BUNDLE_SECTION_SCHEMA,
  XTENSIONS_MARACA_CONTRACT_PATH,
  XTENSIONS_MARACA_CONTRACT_SNAPSHOT_SCHEMA,
  XTENSIONS_MARACA_DEPENDENCY_CLASSIFICATION_SCHEMA,
  XTENSIONS_MARACA_DIAGNOSTIC_SCHEMA,
  XTENSIONS_MARACA_MANIFEST_SCHEMA,
  XTENSIONS_MARACA_MISSING_FIXTURE_PATH,
  XTENSIONS_MARACA_MODULE_PATH,
  XTENSIONS_MARACA_PACKAGE_SCRIPT,
  XTENSIONS_MARACA_POLICY_BLOCKED_FIXTURE_PATH,
  XTENSIONS_MARACA_SUITE_PATH,
  XTENSIONS_MARACA_TYPES_PATH,
  XTENSIONS_MARACA_VALID_FIXTURE_PATH,
  XTENSIONS_MARACA_WORKPACKAGE,
  assertMaracaXTensionDependencyBoundary,
  classifyXTensionDependencies,
  createMaracaXTensionBuildPlan,
  createMaracaXTensionDiagnostic,
  createMaracaXTensionsBundleReport,
  createMissingManifestRecord,
  createXTensionArtifact,
  createXTensionBuildProvenance,
  normalizeContractSnapshot,
  normalizeXTensionManifest,
  serializeMaracaXTensionReport,
  sha256Value
};
