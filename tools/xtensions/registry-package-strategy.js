'use strict';

const {
  FORBIDDEN_FRAMEWORK_DEPENDENCIES,
  assertNoFrameworkDependencies
} = require('./host-controller-contract');
const {
  XTENSIONS_MARACA_ARTIFACT_SCHEMA,
  XTENSIONS_MARACA_BUILD_PLAN_SCHEMA,
  XTENSIONS_MARACA_MANIFEST_SCHEMA,
  createMaracaXTensionBuildPlan,
  sha256Value
} = require('./maraca-xtension-manifest');
const {
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA
} = require('./runtime-capability-registry');
const {
  XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
  XTENSIONS_SECURITY_REPORT_SCHEMA,
  createXTensionsSecurityIntegrityGate
} = require('./security-integrity-gate');

const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA = 'xtend.xtensions.registry-package-strategy.v1';
const XTENSIONS_REGISTRY_ENTRY_SCHEMA = 'xtend.xtensions.registry-entry.v1';
const XTENSIONS_REGISTRY_COMPATIBILITY_MATRIX_SCHEMA = 'xtend.xtensions.registry-compatibility-matrix.v1';
const XTENSIONS_REGISTRY_RELEASE_POLICY_SCHEMA = 'xtend.xtensions.registry-release-policy.v1';
const XTENSIONS_REGISTRY_DEPRECATION_POLICY_SCHEMA = 'xtend.xtensions.registry-deprecation-policy.v1';
const XTENSIONS_REGISTRY_REPORT_SCHEMA = 'xtend.xtensions.registry-report.v1';
const XTENSIONS_REGISTRY_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.registry-diagnostic.v1';
const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_MODULE_PATH = 'tools/xtensions/registry-package-strategy.js';
const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_TYPES_PATH = 'tools/xtensions/registry-package-strategy.d.ts';
const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SUITE_PATH = 'tests/xtensions/xtensions_registry_package_strategy_suite.js';
const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_FIXTURE_PATH = 'tests/fixtures/xtensions/registry-package-strategy-valid.json';
const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_CONTRACT_PATH = 'development/XTensions-Registry-and-Package-Strategy-Contract.md';
const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_WORKPACKAGE = 'XTN-13';
const XTENSIONS_REGISTRY_PACKAGE_STRATEGY_PACKAGE_SCRIPT = 'npm run test:xtensions-registry-package-strategy';

const REGISTRY_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.registry.framework_dependency';
const REGISTRY_PACKAGE_NAME_INVALID_CODE = 'xtensions.registry.package_name_invalid';
const REGISTRY_OWNER_MISSING_CODE = 'xtensions.registry.owner_missing';
const REGISTRY_SECURITY_REVIEW_MISSING_CODE = 'xtensions.registry.security_review_missing';
const REGISTRY_COMPATIBILITY_MISSING_CODE = 'xtensions.registry.compatibility_missing';
const REGISTRY_COMPATIBILITY_UNSUPPORTED_CODE = 'xtensions.registry.compatibility_unsupported';
const REGISTRY_DEPRECATION_POLICY_MISSING_CODE = 'xtensions.registry.deprecation_policy_missing';
const REGISTRY_RELEASE_POLICY_INVALID_CODE = 'xtensions.registry.release_policy_invalid';
const REGISTRY_RUNTIME_SOURCE_OF_TRUTH_CODE = 'xtensions.registry.runtime_source_of_truth';
const REGISTRY_GLOBAL_REGISTRY_FORBIDDEN_CODE = 'xtensions.registry.global_registry_forbidden';
const REGISTRY_REMOTE_DISTRIBUTION_BLOCKED_CODE = 'xtensions.registry.remote_distribution_blocked';
const REGISTRY_NPM_SUBPACKAGE_DEFERRED_CODE = 'xtensions.registry.npm_subpackage_deferred';
const REGISTRY_PACKAGED_FRAMEWORK_CODE = 'xtensions.registry.packaged_framework';

const REGISTRY_DISTRIBUTION_MODES = Object.freeze([
  'project-local-manifest',
  'workspace-local-adapter',
  'npm-subpackage',
  'marketplace-entry',
  'remote-artifact'
]);

const REGISTRY_ALLOWED_DISTRIBUTION_MODES = Object.freeze([
  'project-local-manifest',
  'workspace-local-adapter',
  'marketplace-entry'
]);

const REGISTRY_COMPATIBILITY_STATUSES = Object.freeze([
  'supported',
  'deprecated',
  'blocked'
]);

const REGISTRY_DEPRECATION_STATUSES = Object.freeze([
  'active',
  'deprecated',
  'removed'
]);

const REGISTRY_BOUNDARIES = Object.freeze([
  'project-local-manifests-are-primary-distribution',
  'npm-subpackages-are-reserved-and-deferred',
  'marketplace-entries-are-metadata-only',
  'no-second-runtime-source-of-truth',
  'host-local-runtime-registry-remains-authoritative',
  'maraca-manifest-fingerprints-anchor-registry-records',
  'compatibility-and-deprecation-are-gateable',
  'framework-runtimes-remain-external-peer-or-optional',
  'no-vendored-third-party-frameworks-in-registry-packages'
]);

const DEFAULT_PACKAGE_STRATEGY = Object.freeze({
  schema: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA,
  primaryDistribution: 'project-local-manifest',
  packageNamePattern: '@xtend/xtension-*',
  packageNamespace: '@xtend',
  npmSubpackages: 'reserved-deferred',
  marketplaceEntries: 'metadata-only',
  adapterPackaging: 'external-opt-in-peer-harness',
  registryScope: 'project-local',
  registrySourceOfTruth: 'maraca-manifest',
  runtimeSourceOfTruth: 'host-local-runtime-capability-registry',
  allowGlobalRegistry: false,
  allowRemoteArtifacts: false,
  allowNpmSubpackagesByDefault: false,
  requireSecurityReview: true,
  requireCompatibilityMatrix: true,
  requireDeprecationPolicy: true,
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

function createRegistryDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_REGISTRY_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA,
    workpackage: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_WORKPACKAGE,
    severity,
    code,
    message,
    registryId: subject && subject.registryId || null,
    xtensionId: subject && subject.xtensionId || subject && subject.id || null,
    packageName: subject && subject.packageName || null,
    framework: subject && subject.framework || null,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function normalizePackageStrategy(strategy = {}) {
  const source = strategy && typeof strategy === 'object' ? strategy : {};
  return {
    schema: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA,
    primaryDistribution: normalizeString(source.primaryDistribution || DEFAULT_PACKAGE_STRATEGY.primaryDistribution),
    packageNamePattern: normalizeString(source.packageNamePattern || DEFAULT_PACKAGE_STRATEGY.packageNamePattern),
    packageNamespace: normalizeString(source.packageNamespace || DEFAULT_PACKAGE_STRATEGY.packageNamespace),
    npmSubpackages: normalizeString(source.npmSubpackages || DEFAULT_PACKAGE_STRATEGY.npmSubpackages),
    marketplaceEntries: normalizeString(source.marketplaceEntries || DEFAULT_PACKAGE_STRATEGY.marketplaceEntries),
    adapterPackaging: normalizeString(source.adapterPackaging || DEFAULT_PACKAGE_STRATEGY.adapterPackaging),
    registryScope: normalizeString(source.registryScope || DEFAULT_PACKAGE_STRATEGY.registryScope),
    registrySourceOfTruth: normalizeString(source.registrySourceOfTruth || DEFAULT_PACKAGE_STRATEGY.registrySourceOfTruth),
    runtimeSourceOfTruth: normalizeString(source.runtimeSourceOfTruth || DEFAULT_PACKAGE_STRATEGY.runtimeSourceOfTruth),
    allowGlobalRegistry: source.allowGlobalRegistry === true,
    allowRemoteArtifacts: source.allowRemoteArtifacts === true,
    allowNpmSubpackagesByDefault: source.allowNpmSubpackagesByDefault === true,
    requireSecurityReview: source.requireSecurityReview !== false,
    requireCompatibilityMatrix: source.requireCompatibilityMatrix !== false,
    requireDeprecationPolicy: source.requireDeprecationPolicy !== false,
    packageFrameworkDependenciesAllowed: source.packageFrameworkDependenciesAllowed === true,
    vendoredFrameworksAllowed: source.vendoredFrameworksAllowed === true,
    boundaries: REGISTRY_BOUNDARIES.slice()
  };
}

function packageNameIsValid(packageName, strategy) {
  const namespace = strategy.packageNamespace || '@xtend';
  const escapedNamespace = namespace.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`^${escapedNamespace}/xtension-[a-z0-9][a-z0-9-]*$`, 'u').test(packageName);
}

function normalizeDependency(dependency = {}) {
  if (typeof dependency === 'string') {
    return {
      name: normalizeString(dependency),
      versionRange: '',
      classification: 'peer',
      bundled: false,
      packageIncluded: false
    };
  }

  const source = dependency && typeof dependency === 'object' ? dependency : {};
  const rawClassification = normalizeString(source.classification || source.kind || 'peer') || 'peer';
  const classification = rawClassification === 'external-peer' ? 'peer'
    : rawClassification === 'optional-peer' ? 'optional'
      : rawClassification;
  return {
    name: normalizeString(source.name || source.package),
    versionRange: normalizeString(source.versionRange || source.version || source.range),
    classification,
    rawClassification,
    bundled: source.bundled === true || source.vendored === true,
    packageIncluded: source.packageIncluded === true || source.rootDependency === true
  };
}

function dependencyIsForbiddenFramework(dependency) {
  return FORBIDDEN_FRAMEWORK_DEPENDENCIES.some((name) => (
    dependency.name === name || dependency.name.startsWith(`${name}/`)
  ));
}

function normalizeCompatibilityMatrix(matrix = {}) {
  const source = matrix && typeof matrix === 'object' ? matrix : {};
  return {
    schema: XTENSIONS_REGISTRY_COMPATIBILITY_MATRIX_SCHEMA,
    status: normalizeString(source.status || 'supported'),
    xtendVersionRange: normalizeString(source.xtendVersionRange || source.xtend || '^0.3.0'),
    maracaManifestSchema: normalizeString(source.maracaManifestSchema || XTENSIONS_MARACA_MANIFEST_SCHEMA),
    runtimeRegistrySchema: normalizeString(source.runtimeRegistrySchema || XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA),
    securityGateSchema: normalizeString(source.securityGateSchema || XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA),
    hostControllerSchema: normalizeString(source.hostControllerSchema || 'xtend.xtensions.host-controller.v1'),
    notes: normalizeString(source.notes || '')
  };
}

function normalizeDeprecationPolicy(policy = {}) {
  const source = policy && typeof policy === 'object' ? policy : {};
  return {
    schema: XTENSIONS_REGISTRY_DEPRECATION_POLICY_SCHEMA,
    status: normalizeString(source.status || 'active'),
    replacement: normalizeString(source.replacement || ''),
    sunsetVersion: normalizeString(source.sunsetVersion || ''),
    sunsetDate: normalizeString(source.sunsetDate || ''),
    migrationGuide: normalizeString(source.migrationGuide || ''),
    policy: normalizeString(source.policy || 'semver-major-only')
  };
}

function normalizeReleasePolicy(policy = {}, owner = '') {
  const source = policy && typeof policy === 'object' ? policy : {};
  return {
    schema: XTENSIONS_REGISTRY_RELEASE_POLICY_SCHEMA,
    owner: normalizeString(source.owner || owner),
    securityReviewed: source.securityReviewed === true,
    compatibilityReviewed: source.compatibilityReviewed !== false,
    deprecationReviewed: source.deprecationReviewed !== false,
    provenanceRequired: source.provenanceRequired !== false,
    publishApproved: source.publishApproved === true,
    releaseChannel: normalizeString(source.releaseChannel || 'project-local'),
    packagePublishingAllowed: source.packagePublishingAllowed === true
  };
}

function ownerFromEntry(entry = {}) {
  if (typeof entry.owner === 'string') return normalizeString(entry.owner);
  if (entry.owner && typeof entry.owner === 'object') return normalizeString(entry.owner.team || entry.owner.name || entry.owner.id);
  const manifest = entry.manifest && typeof entry.manifest === 'object' ? entry.manifest : {};
  if (typeof manifest.owner === 'string') return normalizeString(manifest.owner);
  if (manifest.owner && typeof manifest.owner === 'object') return normalizeString(manifest.owner.team || manifest.owner.name || manifest.owner.id);
  return normalizeString(entry.securityOwner || entry.maintainer);
}

function normalizeRegistryEntry(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const manifest = source.manifest && typeof source.manifest === 'object' ? source.manifest : {};
  const strategy = normalizePackageStrategy(options.strategy || {});
  const xtensionId = normalizeString(source.xtensionId || source.id || manifest.id || manifest.xtensionId);
  const framework = normalizeString(source.framework || manifest.framework || 'unknown');
  const packageName = normalizeString(source.packageName || `@xtend/xtension-${xtensionId.replace(/^xtension[.-]/u, '').replace(/[^a-zA-Z0-9]+/gu, '-').replace(/^-|-$/gu, '').toLowerCase()}`);
  const owner = ownerFromEntry(source);
  const distribution = normalizeString(source.distribution || source.strategy || strategy.primaryDistribution);
  const dependencies = toArray(source.dependencies || manifest.dependencies).map(normalizeDependency).filter((dependency) => dependency.name);
  const compatibility = normalizeCompatibilityMatrix(source.compatibility || source.compatibilityMatrix);
  const deprecation = normalizeDeprecationPolicy(source.deprecation || source.deprecationPolicy);
  const release = normalizeReleasePolicy(source.release || source.releasePolicy, owner);
  const diagnostics = [];

  const entry = {
    schema: XTENSIONS_REGISTRY_ENTRY_SCHEMA,
    registryId: normalizeString(options.registryId || source.registryId || 'xtensions.project-local.registry'),
    xtensionId,
    packageName,
    distribution,
    framework,
    version: normalizeString(source.version || manifest.version),
    owner,
    sourceOfTruth: normalizeString(source.sourceOfTruth || 'maraca-manifest'),
    runtimeRegistryRef: normalizeString(source.runtimeRegistryRef || 'host-local-runtime-capability-registry'),
    globalRegistry: source.globalRegistry === true,
    manifest,
    manifestFingerprint: normalizeString(source.manifestFingerprint || ''),
    artifactFingerprint: normalizeString(source.artifactFingerprint || ''),
    marketplace: {
      listing: normalizeString(source.marketplace && source.marketplace.listing || 'metadata-only'),
      discoverable: source.marketplace && source.marketplace.discoverable !== false,
      runtimeSource: 'none'
    },
    package: {
      name: packageName,
      namespace: packageName.split('/')[0] || '',
      packageIncluded: source.packageIncluded === true,
      adapterCodeIncluded: source.adapterCodeIncluded === true,
      frameworkRuntimeIncluded: source.frameworkRuntimeIncluded === true,
      frameworkDependenciesAllowed: source.frameworkDependenciesAllowed === true,
      npmPublishDeferred: distribution === 'npm-subpackage' && !strategy.allowNpmSubpackagesByDefault
    },
    dependencies,
    compatibility,
    deprecation,
    release,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };

  validateRegistryEntry(entry, strategy);
  entry.ok = entry.diagnostics.every((diagnostic) => diagnostic.severity !== 'error');
  entry.status = entry.ok ? (entry.deprecation.status === 'deprecated' ? 'deprecated' : 'ready') : 'blocked';
  entry.registryFingerprint = sha256Value({
    xtensionId: entry.xtensionId,
    packageName: entry.packageName,
    distribution: entry.distribution,
    sourceOfTruth: entry.sourceOfTruth,
    runtimeRegistryRef: entry.runtimeRegistryRef,
    compatibility: entry.compatibility,
    deprecation: entry.deprecation,
    release: {
      owner: entry.release.owner,
      securityReviewed: entry.release.securityReviewed,
      releaseChannel: entry.release.releaseChannel
    }
  });
  return entry;
}

function validateRegistryEntry(entry, strategy) {
  if (!packageNameIsValid(entry.packageName, strategy)) {
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      REGISTRY_PACKAGE_NAME_INVALID_CODE,
      `XTension package name "${entry.packageName}" must match ${strategy.packageNamePattern}.`,
      'error',
      { field: 'packageName', packageName: entry.packageName }
    ));
  }

  if (!entry.owner) {
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      REGISTRY_OWNER_MISSING_CODE,
      'XTension registry entries require an owner.',
      'error',
      { field: 'owner' }
    ));
  }

  if (!REGISTRY_DISTRIBUTION_MODES.includes(entry.distribution)) {
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      REGISTRY_RELEASE_POLICY_INVALID_CODE,
      `Unsupported XTension distribution mode "${entry.distribution}".`,
      'error',
      { field: 'distribution', allowed: REGISTRY_DISTRIBUTION_MODES.slice() }
    ));
  } else if (!REGISTRY_ALLOWED_DISTRIBUTION_MODES.includes(entry.distribution)) {
    const code = entry.distribution === 'remote-artifact'
      ? REGISTRY_REMOTE_DISTRIBUTION_BLOCKED_CODE
      : REGISTRY_NPM_SUBPACKAGE_DEFERRED_CODE;
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      code,
      `XTension distribution mode "${entry.distribution}" is not enabled by the default package strategy.`,
      'error',
      { field: 'distribution', distribution: entry.distribution }
    ));
  }

  if (entry.globalRegistry || strategy.allowGlobalRegistry) {
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      REGISTRY_GLOBAL_REGISTRY_FORBIDDEN_CODE,
      'XTensions registry entries must not create a second global runtime registry.',
      'error',
      { field: 'globalRegistry' }
    ));
  }

  if (entry.sourceOfTruth !== 'maraca-manifest' || entry.runtimeRegistryRef !== 'host-local-runtime-capability-registry') {
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      REGISTRY_RUNTIME_SOURCE_OF_TRUTH_CODE,
      'XTensions registry entries must anchor discovery in Maraca manifests and runtime authority in the host-local registry.',
      'error',
      {
        field: 'sourceOfTruth',
        sourceOfTruth: entry.sourceOfTruth,
        runtimeRegistryRef: entry.runtimeRegistryRef
      }
    ));
  }

  if (strategy.requireSecurityReview && !entry.release.securityReviewed) {
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      REGISTRY_SECURITY_REVIEW_MISSING_CODE,
      'XTension registry entry requires security review before distribution.',
      'error',
      { field: 'release.securityReviewed' }
    ));
  }

  if (strategy.requireCompatibilityMatrix && (!entry.compatibility.status || !REGISTRY_COMPATIBILITY_STATUSES.includes(entry.compatibility.status))) {
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      REGISTRY_COMPATIBILITY_MISSING_CODE,
      'XTension registry entry requires a compatibility matrix.',
      'error',
      { field: 'compatibility.status', allowed: REGISTRY_COMPATIBILITY_STATUSES.slice() }
    ));
  } else if (entry.compatibility.status === 'blocked') {
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      REGISTRY_COMPATIBILITY_UNSUPPORTED_CODE,
      'XTension registry compatibility status is blocked.',
      'error',
      { field: 'compatibility.status' }
    ));
  }

  if (strategy.requireDeprecationPolicy && !REGISTRY_DEPRECATION_STATUSES.includes(entry.deprecation.status)) {
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      REGISTRY_DEPRECATION_POLICY_MISSING_CODE,
      'XTension registry entry requires a gateable deprecation policy.',
      'error',
      { field: 'deprecation.status', allowed: REGISTRY_DEPRECATION_STATUSES.slice() }
    ));
  }

  if (entry.deprecation.status === 'deprecated' && !entry.deprecation.replacement && !entry.deprecation.sunsetVersion && !entry.deprecation.sunsetDate) {
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      REGISTRY_DEPRECATION_POLICY_MISSING_CODE,
      'Deprecated XTensions require replacement or sunset metadata.',
      'error',
      { field: 'deprecation' }
    ));
  }

  if (!entry.release.owner || !entry.release.compatibilityReviewed || !entry.release.deprecationReviewed || !entry.release.provenanceRequired) {
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      REGISTRY_RELEASE_POLICY_INVALID_CODE,
      'XTension release policy must include owner, compatibility, deprecation and provenance review.',
      'error',
      { field: 'release' }
    ));
  }

  if (entry.package.frameworkRuntimeIncluded || entry.package.frameworkDependenciesAllowed || entry.package.packageIncluded) {
    entry.diagnostics.push(createRegistryDiagnostic(
      entry,
      REGISTRY_PACKAGED_FRAMEWORK_CODE,
      'XTension registry packages must not include framework runtimes by default.',
      'error',
      { field: 'package' }
    ));
  }

  entry.dependencies.forEach((dependency) => {
    if (dependencyIsForbiddenFramework(dependency) && (dependency.bundled || dependency.packageIncluded || dependency.classification === 'core')) {
      entry.diagnostics.push(createRegistryDiagnostic(
        entry,
        REGISTRY_PACKAGED_FRAMEWORK_CODE,
        `Framework dependency "${dependency.name}" must remain peer or optional and must not be packaged.`,
        'error',
        { field: 'dependencies', dependency }
      ));
    }
  });
}

function assertRegistryPackageStrategyDependencyBoundary(input = {}) {
  const dependencyCheck = assertNoFrameworkDependencies(input);
  return {
    ok: dependencyCheck.ok,
    diagnostics: dependencyCheck.diagnostics.map((diagnostic) => ({
      schema: XTENSIONS_REGISTRY_DIAGNOSTIC_SCHEMA,
      source: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA,
      workpackage: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_WORKPACKAGE,
      severity: 'error',
      code: REGISTRY_FRAMEWORK_DEPENDENCY_CODE,
      message: diagnostic.message,
      registryId: null,
      xtensionId: null,
      packageName: null,
      framework: null,
      field: diagnostic.details && (diagnostic.details.section || diagnostic.details.name) || null,
      metadata: cloneJson(diagnostic.details || {})
    })),
    forbiddenFrameworkDependencies: dependencyCheck.forbiddenFrameworkDependencies
  };
}

function createXTensionsRegistryPackageStrategyReport(input = {}, options = {}) {
  const strategy = normalizePackageStrategy(input.strategy || input.packageStrategy || options.strategy);
  const registryId = normalizeString(input.registryId || input.id || 'xtensions.project-local.registry');
  const entryInputs = toArray(input.entries || input.registryEntries || input.xtensions);
  const entries = entryInputs.map((entry) => normalizeRegistryEntry(entry, {
    ...options,
    registryId,
    strategy
  }));
  const manifests = entries.map((entry) => entry.manifest).filter((manifest) => manifest && Object.keys(manifest).length > 0);
  const maracaPlan = createMaracaXTensionBuildPlan({ xtensions: manifests }, options);
  const securityReport = createXTensionsSecurityIntegrityGate({
    policy: input.securityPolicy || {},
    xtensions: manifests,
    packageManifest: input.packageManifest || options.packageManifest || {},
    sourceText: input.sourceText || options.sourceText || ''
  }, options);
  const dependencyBoundary = assertRegistryPackageStrategyDependencyBoundary({
    packageManifest: input.packageManifest || options.packageManifest || {},
    sourceText: input.sourceText || options.sourceText || ''
  });
  const diagnostics = entries.flatMap((entry) => entry.diagnostics || [])
    .concat(maracaPlan.diagnostics || [])
    .concat(securityReport.diagnostics || [])
    .concat(dependencyBoundary.diagnostics || []);
  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  const status = blockingDiagnostics.length > 0 ? 'blocked' : 'ready';

  return {
    schema: XTENSIONS_REGISTRY_REPORT_SCHEMA,
    strategySchema: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA,
    entrySchema: XTENSIONS_REGISTRY_ENTRY_SCHEMA,
    compatibilityMatrixSchema: XTENSIONS_REGISTRY_COMPATIBILITY_MATRIX_SCHEMA,
    releasePolicySchema: XTENSIONS_REGISTRY_RELEASE_POLICY_SCHEMA,
    deprecationPolicySchema: XTENSIONS_REGISTRY_DEPRECATION_POLICY_SCHEMA,
    diagnosticSchema: XTENSIONS_REGISTRY_DIAGNOSTIC_SCHEMA,
    maracaManifestSchema: XTENSIONS_MARACA_MANIFEST_SCHEMA,
    maracaArtifactSchema: XTENSIONS_MARACA_ARTIFACT_SCHEMA,
    maracaBuildPlanSchema: XTENSIONS_MARACA_BUILD_PLAN_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    securityGateSchema: XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
    securityReportSchema: XTENSIONS_SECURITY_REPORT_SCHEMA,
    workpackage: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_WORKPACKAGE,
    ok: status !== 'blocked',
    status,
    registryId,
    registryScope: strategy.registryScope,
    runtimeSourceOfTruth: strategy.runtimeSourceOfTruth,
    noSecondRuntimeSourceOfTruth: true,
    frameworkCodeRequired: false,
    runtimeExecutionRequired: false,
    packageFrameworkDependenciesAllowed: false,
    vendoredFrameworksAllowed: false,
    strategy,
    entries,
    maracaPlan,
    securityReport,
    dependencyBoundary,
    diagnostics,
    summary: {
      entryCount: entries.length,
      readyCount: entries.filter((entry) => entry.status === 'ready').length,
      deprecatedCount: entries.filter((entry) => entry.status === 'deprecated').length,
      blockedCount: entries.filter((entry) => entry.status === 'blocked').length,
      projectLocalManifestCount: entries.filter((entry) => entry.distribution === 'project-local-manifest').length,
      marketplaceEntryCount: entries.filter((entry) => entry.distribution === 'marketplace-entry').length,
      npmSubpackageCount: entries.filter((entry) => entry.distribution === 'npm-subpackage').length,
      remoteArtifactCount: entries.filter((entry) => entry.distribution === 'remote-artifact').length,
      diagnosticCount: diagnostics.length,
      errorCount: blockingDiagnostics.length,
      frameworks: Array.from(new Set(entries.map((entry) => entry.framework))).sort(),
      packageNames: entries.map((entry) => entry.packageName).sort()
    },
    boundaries: REGISTRY_BOUNDARIES.slice(),
    registryFingerprint: sha256Value({
      registryId,
      strategy,
      entryFingerprints: entries.map((entry) => entry.registryFingerprint),
      maracaFingerprints: maracaPlan.artifacts.map((artifact) => artifact.artifactFingerprint),
      securityFingerprint: securityReport.gateFingerprint
    }),
    timestamp: timestampFromOptions(options)
  };
}

function serializeRegistryPackageStrategyReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

module.exports = {
  DEFAULT_PACKAGE_STRATEGY,
  REGISTRY_ALLOWED_DISTRIBUTION_MODES,
  REGISTRY_BOUNDARIES,
  REGISTRY_COMPATIBILITY_MISSING_CODE,
  REGISTRY_COMPATIBILITY_STATUSES,
  REGISTRY_COMPATIBILITY_UNSUPPORTED_CODE,
  REGISTRY_DEPRECATION_POLICY_MISSING_CODE,
  REGISTRY_DEPRECATION_STATUSES,
  REGISTRY_DISTRIBUTION_MODES,
  REGISTRY_FRAMEWORK_DEPENDENCY_CODE,
  REGISTRY_GLOBAL_REGISTRY_FORBIDDEN_CODE,
  REGISTRY_NPM_SUBPACKAGE_DEFERRED_CODE,
  REGISTRY_OWNER_MISSING_CODE,
  REGISTRY_PACKAGE_NAME_INVALID_CODE,
  REGISTRY_PACKAGED_FRAMEWORK_CODE,
  REGISTRY_RELEASE_POLICY_INVALID_CODE,
  REGISTRY_REMOTE_DISTRIBUTION_BLOCKED_CODE,
  REGISTRY_RUNTIME_SOURCE_OF_TRUTH_CODE,
  REGISTRY_SECURITY_REVIEW_MISSING_CODE,
  XTENSIONS_REGISTRY_COMPATIBILITY_MATRIX_SCHEMA,
  XTENSIONS_REGISTRY_DEPRECATION_POLICY_SCHEMA,
  XTENSIONS_REGISTRY_DIAGNOSTIC_SCHEMA,
  XTENSIONS_REGISTRY_ENTRY_SCHEMA,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_CONTRACT_PATH,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_FIXTURE_PATH,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_MODULE_PATH,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_PACKAGE_SCRIPT,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SUITE_PATH,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_TYPES_PATH,
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_WORKPACKAGE,
  XTENSIONS_REGISTRY_RELEASE_POLICY_SCHEMA,
  XTENSIONS_REGISTRY_REPORT_SCHEMA,
  assertRegistryPackageStrategyDependencyBoundary,
  createRegistryDiagnostic,
  createXTensionsRegistryPackageStrategyReport,
  normalizeCompatibilityMatrix,
  normalizeDeprecationPolicy,
  normalizePackageStrategy,
  normalizeRegistryEntry,
  normalizeReleasePolicy,
  serializeRegistryPackageStrategyReport
};
