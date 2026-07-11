'use strict';

const {
  assertNoFrameworkDependencies
} = require('./host-controller-contract');
const {
  XTENSIONS_MARACA_MANIFEST_SCHEMA,
  sha256Value
} = require('./maraca-xtension-manifest');
const {
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA
} = require('./runtime-capability-registry');
const {
  XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA
} = require('./security-integrity-gate');
const {
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA
} = require('./registry-package-strategy');

const XTENSIONS_ADOPTION_HANDOFF_SCHEMA = 'xtend.xtensions.adoption-handoff.v1';
const XTENSIONS_ADOPTION_DOC_ARTIFACT_SCHEMA = 'xtend.xtensions.adoption-doc-artifact.v1';
const XTENSIONS_ADOPTION_START_PACKAGE_SCHEMA = 'xtend.xtensions.adoption-start-package.v1';
const XTENSIONS_ADOPTION_REPORT_SCHEMA = 'xtend.xtensions.adoption-report.v1';
const XTENSIONS_ADOPTION_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.adoption-diagnostic.v1';
const XTENSIONS_ADOPTION_HANDOFF_MODULE_PATH = 'tools/xtensions/adoption-handoff.js';
const XTENSIONS_ADOPTION_HANDOFF_TYPES_PATH = 'tools/xtensions/adoption-handoff.d.ts';
const XTENSIONS_ADOPTION_HANDOFF_SUITE_PATH = 'tests/xtensions/xtensions_adoption_handoff_suite.js';
const XTENSIONS_ADOPTION_HANDOFF_FIXTURE_PATH = 'tests/fixtures/xtensions/adoption-handoff-valid.json';
const XTENSIONS_ADOPTION_HANDOFF_CONTRACT_PATH = 'development/XTensions-Docs-Migration-Enterprise-Adoption-Handoff-Contract.md';
const XTENSIONS_ADOPTION_HANDOFF_WORKPACKAGE = 'XTN-14';
const XTENSIONS_ADOPTION_HANDOFF_PACKAGE_SCRIPT = 'npm run test:xtensions-adoption-handoff';

const XTENSIONS_AUTHORING_GUIDE_DOC_PATH = 'docs/de/xtensions-authoring-guide.md';
const XTENSIONS_MIGRATION_COEXISTENCE_DOC_PATH = 'docs/de/xtensions-migration-coexistence-guide.md';
const XTENSIONS_SECURITY_CHECKLIST_DOC_PATH = 'docs/de/xtensions-security-checklist.md';
const XTENSIONS_ENTERPRISE_HANDOFF_DOC_PATH = 'development/docs-evidence/legacy-routes/de/xtensions-enterprise-adoption-handoff.md';

const ADOPTION_DOC_MISSING_CODE = 'xtensions.adoption.doc_missing';
const ADOPTION_TOPIC_MISSING_CODE = 'xtensions.adoption.topic_missing';
const ADOPTION_FORCED_MIGRATION_CODE = 'xtensions.adoption.forced_migration';
const ADOPTION_BOUNDARY_MISSING_CODE = 'xtensions.adoption.boundary_missing';
const ADOPTION_START_PACKAGE_MISSING_CODE = 'xtensions.adoption.start_package_missing';
const ADOPTION_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.adoption.framework_dependency';

const ADOPTION_DOC_KINDS = Object.freeze([
  'authoring-guide',
  'migration-coexistence-guide',
  'security-checklist',
  'enterprise-adoption-handoff'
]);

const ADOPTION_START_PACKAGE_IDS = Object.freeze([
  'external-peer-harness-template',
  'enterprise-policy-pilot',
  'registry-metadata-publisher',
  'browser-smoke-harness',
  'remote-artifact-policy'
]);

const ADOPTION_REQUIRED_BOUNDARIES = Object.freeze([
  'opt-in-coexistence-not-forced-migration',
  'native-first-authoring-remains-default',
  'rmt-kernel-stays-framework-agnostic',
  'hostcontroller-is-the-framework-boundary',
  'fabric-signals-route-cross-surface-events',
  'project-local-manifests-are-primary-distribution',
  'framework-runtimes-remain-external-peer-or-optional',
  'no-vendored-third-party-frameworks-in-repo-or-package',
  'security-gate-before-runtime-loading',
  'degraded-xtension-does-not-block-shell'
]);

const DOC_REQUIRED_TOPICS = Object.freeze({
  'authoring-guide': Object.freeze([
    'HostController',
    'Maraca Manifest',
    'Fabric',
    'project-local manifest',
    'external opt-in peer harness',
    'no framework dependency',
    'Fallback'
  ]),
  'migration-coexistence-guide': Object.freeze([
    'opt-in coexistence',
    'no forced migration',
    'React',
    'Vue',
    'native XTend',
    'Custom Hosts',
    'host-local Runtime Capability Registry',
    'degraded'
  ]),
  'security-checklist': Object.freeze([
    'Owner',
    'Version',
    'Contract',
    'SHA256 Integrity',
    'CSP',
    'Fallback',
    'no CDN',
    'external peer',
    'no vendored framework'
  ]),
  'enterprise-adoption-handoff': Object.freeze([
    'XTN-12',
    'XTN-13',
    'Release Handoff',
    'Known Residuals',
    'Startpakete',
    'Ownership',
    'Security Review',
    'Compatibility Matrix'
  ])
});

const FORCED_MIGRATION_PATTERNS = Object.freeze([
  /must migrate all apps/iu,
  /forced migration required/iu,
  /force migration/iu,
  /replace all react/iu,
  /replace all vue/iu,
  /framework runtime in xtend core/iu
]);

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

function createAdoptionDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_ADOPTION_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_ADOPTION_HANDOFF_SCHEMA,
    workpackage: XTENSIONS_ADOPTION_HANDOFF_WORKPACKAGE,
    severity,
    code,
    message,
    docPath: subject && subject.path || null,
    docKind: subject && subject.kind || null,
    startPackageId: subject && subject.id || null,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function normalizeDocText(text) {
  return normalizeString(text).toLowerCase().replace(/\s+/gu, ' ');
}

function topicPresent(text, topic) {
  return normalizeDocText(text).includes(normalizeString(topic).toLowerCase());
}

function normalizeDocArtifact(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const kind = normalizeString(source.kind || source.type);
  const text = normalizeString(source.text || source.content || '');
  const requiredTopics = toArray(source.requiredTopics || DOC_REQUIRED_TOPICS[kind] || [])
    .map(normalizeString)
    .filter(Boolean);
  const diagnostics = [];
  const artifact = {
    schema: XTENSIONS_ADOPTION_DOC_ARTIFACT_SCHEMA,
    workpackage: XTENSIONS_ADOPTION_HANDOFF_WORKPACKAGE,
    kind,
    path: normalizeString(source.path),
    title: normalizeString(source.title),
    audience: normalizeString(source.audience || 'enterprise-adopter'),
    status: normalizeString(source.status || 'ready') || 'ready',
    requiredTopics,
    presentTopics: [],
    missingTopics: [],
    textLength: text.length,
    fingerprint: sha256Value({
      path: source.path,
      kind,
      text
    }),
    diagnostics,
    timestamp: timestampFromOptions(options)
  };

  if (!ADOPTION_DOC_KINDS.includes(kind) || !artifact.path || !text) {
    diagnostics.push(createAdoptionDiagnostic(
      artifact,
      ADOPTION_DOC_MISSING_CODE,
      'XTensions adoption handoff requires a complete documentation artifact.',
      'error',
      { field: 'docs', kind, path: artifact.path, hasText: Boolean(text) }
    ));
  }

  requiredTopics.forEach((topic) => {
    if (topicPresent(text, topic)) {
      artifact.presentTopics.push(topic);
      return;
    }

    artifact.missingTopics.push(topic);
    diagnostics.push(createAdoptionDiagnostic(
      artifact,
      ADOPTION_TOPIC_MISSING_CODE,
      `XTensions adoption document is missing required topic "${topic}".`,
      'error',
      { field: 'requiredTopics', topic }
    ));
  });

  FORCED_MIGRATION_PATTERNS.forEach((pattern) => {
    if (pattern.test(text)) {
      diagnostics.push(createAdoptionDiagnostic(
        artifact,
        ADOPTION_FORCED_MIGRATION_CODE,
        'XTensions adoption docs must describe opt-in coexistence, not forced migration.',
        'error',
        { field: 'text', pattern: String(pattern) }
      ));
    }
  });

  artifact.ok = diagnostics.every((diagnostic) => diagnostic.severity !== 'error');
  return artifact;
}

function normalizeStartPackage(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const packageRecord = {
    schema: XTENSIONS_ADOPTION_START_PACKAGE_SCHEMA,
    workpackage: XTENSIONS_ADOPTION_HANDOFF_WORKPACKAGE,
    id: normalizeString(source.id),
    title: normalizeString(source.title),
    priority: normalizeString(source.priority || 'P2') || 'P2',
    owner: normalizeString(source.owner || 'xtend-platform'),
    status: normalizeString(source.status || 'planned') || 'planned',
    dependsOn: toArray(source.dependsOn).map(normalizeString).filter(Boolean),
    outcomes: toArray(source.outcomes).map(normalizeString).filter(Boolean),
    frameworkDependenciesAllowed: source.frameworkDependenciesAllowed === true,
    vendoredFrameworksAllowed: source.vendoredFrameworksAllowed === true,
    runtimeExecutionRequired: source.runtimeExecutionRequired === true,
    diagnostics: [],
    timestamp: timestampFromOptions(options)
  };

  if (!packageRecord.id || !packageRecord.title || packageRecord.outcomes.length === 0) {
    packageRecord.diagnostics.push(createAdoptionDiagnostic(
      packageRecord,
      ADOPTION_START_PACKAGE_MISSING_CODE,
      'XTensions adoption handoff start package requires id, title and outcomes.',
      'error',
      { field: 'startPackages', id: packageRecord.id }
    ));
  }

  if (packageRecord.frameworkDependenciesAllowed || packageRecord.vendoredFrameworksAllowed || packageRecord.runtimeExecutionRequired) {
    packageRecord.diagnostics.push(createAdoptionDiagnostic(
      packageRecord,
      ADOPTION_FRAMEWORK_DEPENDENCY_CODE,
      'XTensions follow-up start packages must not depend on bundled framework runtimes by default.',
      'error',
      {
        field: 'startPackages.dependencyPolicy',
        frameworkDependenciesAllowed: packageRecord.frameworkDependenciesAllowed,
        vendoredFrameworksAllowed: packageRecord.vendoredFrameworksAllowed,
        runtimeExecutionRequired: packageRecord.runtimeExecutionRequired
      }
    ));
  }

  packageRecord.ok = packageRecord.diagnostics.every((diagnostic) => diagnostic.severity !== 'error');
  packageRecord.fingerprint = sha256Value({
    id: packageRecord.id,
    priority: packageRecord.priority,
    owner: packageRecord.owner,
    outcomes: packageRecord.outcomes
  });
  return packageRecord;
}

function assertAdoptionHandoffDependencyBoundary(input = {}) {
  const dependencyCheck = assertNoFrameworkDependencies(input);
  return {
    ok: dependencyCheck.ok,
    diagnostics: dependencyCheck.diagnostics.map((diagnostic) => ({
      schema: XTENSIONS_ADOPTION_DIAGNOSTIC_SCHEMA,
      source: XTENSIONS_ADOPTION_HANDOFF_SCHEMA,
      workpackage: XTENSIONS_ADOPTION_HANDOFF_WORKPACKAGE,
      severity: 'error',
      code: ADOPTION_FRAMEWORK_DEPENDENCY_CODE,
      message: diagnostic.message,
      docPath: null,
      docKind: null,
      startPackageId: null,
      field: diagnostic.details && (diagnostic.details.section || diagnostic.details.name) || null,
      metadata: cloneJson(diagnostic.details || {})
    })),
    forbiddenFrameworkDependencies: dependencyCheck.forbiddenFrameworkDependencies
  };
}

function createXTensionsAdoptionHandoffReport(input = {}, options = {}) {
  const docs = toArray(input.docs || input.documents).map((doc) => normalizeDocArtifact(doc, options));
  const startPackages = toArray(input.startPackages || input.followUpStartPackages).map((startPackage) => normalizeStartPackage(startPackage, options));
  const boundaries = toArray(input.boundaries || ADOPTION_REQUIRED_BOUNDARIES).map(normalizeString).filter(Boolean);
  const dependencyBoundary = assertAdoptionHandoffDependencyBoundary({
    packageManifest: input.packageManifest || options.packageManifest || {},
    sourceText: input.sourceText || options.sourceText || ''
  });
  const diagnostics = []
    .concat(docs.flatMap((doc) => doc.diagnostics || []))
    .concat(startPackages.flatMap((startPackage) => startPackage.diagnostics || []))
    .concat(dependencyBoundary.diagnostics || []);

  ADOPTION_DOC_KINDS.forEach((kind) => {
    if (!docs.some((doc) => doc.kind === kind && doc.ok)) {
      diagnostics.push(createAdoptionDiagnostic(
        { kind },
        ADOPTION_DOC_MISSING_CODE,
        `XTensions adoption handoff is missing ready doc kind "${kind}".`,
        'error',
        { field: 'docs.kind', kind }
      ));
    }
  });

  ADOPTION_REQUIRED_BOUNDARIES.forEach((boundary) => {
    if (!boundaries.includes(boundary)) {
      diagnostics.push(createAdoptionDiagnostic(
        {},
        ADOPTION_BOUNDARY_MISSING_CODE,
        `XTensions adoption handoff is missing boundary "${boundary}".`,
        'error',
        { field: 'boundaries', boundary }
      ));
    }
  });

  ADOPTION_START_PACKAGE_IDS.forEach((id) => {
    if (!startPackages.some((startPackage) => startPackage.id === id && startPackage.ok)) {
      diagnostics.push(createAdoptionDiagnostic(
        { id },
        ADOPTION_START_PACKAGE_MISSING_CODE,
        `XTensions adoption handoff is missing start package "${id}".`,
        'error',
        { field: 'startPackages.id', id }
      ));
    }
  });

  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  const status = blockingDiagnostics.length > 0 ? 'blocked' : 'ready';

  return {
    schema: XTENSIONS_ADOPTION_REPORT_SCHEMA,
    handoffSchema: XTENSIONS_ADOPTION_HANDOFF_SCHEMA,
    docArtifactSchema: XTENSIONS_ADOPTION_DOC_ARTIFACT_SCHEMA,
    startPackageSchema: XTENSIONS_ADOPTION_START_PACKAGE_SCHEMA,
    diagnosticSchema: XTENSIONS_ADOPTION_DIAGNOSTIC_SCHEMA,
    maracaManifestSchema: XTENSIONS_MARACA_MANIFEST_SCHEMA,
    runtimeRegistrySchema: XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
    securityGateSchema: XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
    registryStrategySchema: XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA,
    workpackage: XTENSIONS_ADOPTION_HANDOFF_WORKPACKAGE,
    ok: status !== 'blocked',
    status,
    optInCoexistence: true,
    nativeFirstDefault: true,
    frameworkAgnosticKernel: true,
    frameworkCodeRequired: false,
    runtimeExecutionRequired: false,
    packageFrameworkDependenciesAllowed: false,
    vendoredFrameworksAllowed: false,
    docs,
    startPackages,
    boundaries,
    dependencyBoundary,
    diagnostics,
    summary: {
      docCount: docs.length,
      readyDocCount: docs.filter((doc) => doc.ok).length,
      startPackageCount: startPackages.length,
      readyStartPackageCount: startPackages.filter((startPackage) => startPackage.ok).length,
      boundaryCount: boundaries.length,
      diagnosticCount: diagnostics.length,
      errorCount: blockingDiagnostics.length,
      docKinds: docs.map((doc) => doc.kind).sort(),
      startPackageIds: startPackages.map((startPackage) => startPackage.id).sort()
    },
    handoffFingerprint: sha256Value({
      docs: docs.map((doc) => doc.fingerprint),
      startPackages: startPackages.map((startPackage) => startPackage.fingerprint),
      boundaries
    }),
    timestamp: timestampFromOptions(options)
  };
}

function serializeAdoptionHandoffReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

module.exports = {
  ADOPTION_BOUNDARY_MISSING_CODE,
  ADOPTION_DOC_KINDS,
  ADOPTION_DOC_MISSING_CODE,
  ADOPTION_FORCED_MIGRATION_CODE,
  ADOPTION_FRAMEWORK_DEPENDENCY_CODE,
  ADOPTION_REQUIRED_BOUNDARIES,
  ADOPTION_START_PACKAGE_IDS,
  ADOPTION_START_PACKAGE_MISSING_CODE,
  ADOPTION_TOPIC_MISSING_CODE,
  DOC_REQUIRED_TOPICS,
  XTENSIONS_ADOPTION_DIAGNOSTIC_SCHEMA,
  XTENSIONS_ADOPTION_DOC_ARTIFACT_SCHEMA,
  XTENSIONS_ADOPTION_HANDOFF_CONTRACT_PATH,
  XTENSIONS_ADOPTION_HANDOFF_FIXTURE_PATH,
  XTENSIONS_ADOPTION_HANDOFF_MODULE_PATH,
  XTENSIONS_ADOPTION_HANDOFF_PACKAGE_SCRIPT,
  XTENSIONS_ADOPTION_HANDOFF_SCHEMA,
  XTENSIONS_ADOPTION_HANDOFF_SUITE_PATH,
  XTENSIONS_ADOPTION_HANDOFF_TYPES_PATH,
  XTENSIONS_ADOPTION_HANDOFF_WORKPACKAGE,
  XTENSIONS_ADOPTION_REPORT_SCHEMA,
  XTENSIONS_ADOPTION_START_PACKAGE_SCHEMA,
  XTENSIONS_AUTHORING_GUIDE_DOC_PATH,
  XTENSIONS_ENTERPRISE_HANDOFF_DOC_PATH,
  XTENSIONS_MIGRATION_COEXISTENCE_DOC_PATH,
  XTENSIONS_SECURITY_CHECKLIST_DOC_PATH,
  assertAdoptionHandoffDependencyBoundary,
  createAdoptionDiagnostic,
  createXTensionsAdoptionHandoffReport,
  normalizeDocArtifact,
  normalizeStartPackage,
  serializeAdoptionHandoffReport
};
