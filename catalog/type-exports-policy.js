const fs = require('fs');
const path = require('path');
const {
  TYPE_EXPORTS_BOUNDARY,
  TYPE_EXPORTS_DECLARATION_BOUNDARY,
  TYPE_EXPORTS_KERNEL_BOUNDARY,
  TYPE_EXPORTS_SCHEMA,
  createTypeExportsPlan
} = require('./type-exports');

const TYPE_EXPORTS_POLICY_SCHEMA = 'xtend.type-exports.policy-declarations.v1';
const TYPE_EXPORTS_POLICY_REPORT_SCHEMA = 'xtend.type-exports.policy-declarations-report.v1';
const TYPE_EXPORTS_POLICY_WORKPACKAGE = 'WP-TypeExports-05';
const TYPE_EXPORTS_POLICY_STATUS = 'accepted-fabric-a11y-security-policy-declarations';
const TYPE_EXPORTS_POLICY_TARGET = 'fabric-a11y-security-policy-types-ready';
const TYPE_EXPORTS_POLICY_MODULE = 'catalog/type-exports-policy.js';
const TYPE_EXPORTS_POLICY_SUITE = 'tests/types/policy_type_exports_suite.js';
const TYPE_EXPORTS_POLICY_DOCS = 'docs/xtend-policy-types.md';
const TYPE_EXPORTS_POLICY_BACKLOG = 'development/BACKLOG-XTend-TypeExports-und-Public-Declaration-Hardening.md';
const TYPE_EXPORTS_POLICY_WORKPACKAGE_DOC = 'development/WP-TypeExports-05-Fabric-A11y-und-Security-Policy-APIs-typisieren.md';
const TYPE_EXPORTS_POLICY_LOCAL_GATE = 'node scripts/run_xtend_tests.js type-exports-policy --json';
const TYPE_EXPORTS_POLICY_PACKAGE_SCRIPT = 'npm run test:type-exports-policy';
const TYPE_EXPORTS_POLICY_REPORT_ARTIFACT = '.xtend-test-results/xtend-type-exports-policy-report.json';
const POLICY_SHARED_DECLARATION_FILE = 'fabric/xtend-policy-public-types.d.ts';

const POLICY_PACKAGE_EXPORTS = Object.freeze([
  './fabric',
  './fabric/rmt-lane-mapping',
  './fabric/hydration-policy',
  './a11y/screenreader-signals',
  './a11y/motion-contrast-policy',
  './a11y/runtime-a11y-contract',
  './security/manifest-import-policy',
  './security/trusted-dom-policy',
  './security/supply-chain-gate-policy'
]);

const POLICY_SHARED_TYPE_TOKENS = Object.freeze([
  'XtendPolicyDiagnostic',
  'XtendPolicyReport',
  'XtendFabricFiberInput',
  'XtendA11ySignal',
  'XtendSecurityClassification'
]);

const POLICY_REPRESENTATIVE_DECLARATION_TOKENS = Object.freeze({
  'fabric/xtend-fabric.d.ts': ['XtendFabricApi', 'createXtendFabric', 'emitDiagnostic', 'runFiber', 'createReporterAdapter', 'createRuntimeDiagnosticsBridge'],
  'fabric/rmt-lane-mapping.d.ts': ['XtendFabricRmtLaneMapping', 'XtendRmtScheduleRecord', 'createFabricRmtLaneMapping', 'resolveRmtScheduleForFiber'],
  'fabric/hydration-policy.d.ts': ['XtendHydrationDecision', 'resolveHydrationPolicy', 'createHydrationPolicyController'],
  'a11y/screenreader-signals.d.ts': ['XtendScreenreaderSignalContract', 'XtendA11ySignal', 'createScreenreaderSignalContract'],
  'a11y/motion-contrast-policy.d.ts': ['XtendMotionContrastPolicy', 'validateMotionContrastPolicy'],
  'a11y/runtime-a11y-contract.d.ts': ['XtendRuntimeA11yContract', 'createRuntimeA11yContract', 'validateRuntimeA11yContract'],
  'security/manifest-import-policy.d.ts': ['XtendManifestImportPolicy', 'classifyPolicyUrl', 'normalizeManifest'],
  'security/trusted-dom-policy.d.ts': ['XtendTrustedDomPolicy', 'classifyTrustedDomUse', 'sanitizeTrustedDomHtml'],
  'security/supply-chain-gate-policy.d.ts': ['XtendSupplyChainGatePlan', 'classifyPackageSupplyChain', 'listDependencies']
});

const POLICY_RUNTIME_EXPORTS_BY_SOURCE = Object.freeze({
  'fabric/xtend-fabric.js': [
    'CONTRACTS',
    'BROWSER_NAMESPACE',
    'DEFAULT_LANE_BY_KIND',
    'CANONICAL_LANES',
    'LIFECYCLE_METHODS',
    'LIFECYCLE_PHASES',
    'COMPONENT_FIBER_OPERATION_PROFILES',
    'ROUTE_FIBER_OPERATION_PROFILES',
    'COMPONENT_LIFECYCLE_OPERATIONS',
    'BACKPRESSURE_SCORE_THRESHOLDS',
    'BACKPRESSURE_ACTION_BY_LEVEL',
    'PERFORMANCE_MEASURE_PHASES',
    'PERFORMANCE_MEASURE_NAME_BY_FIBER_KIND',
    'PERFORMANCE_BUDGET_MS_BY_MEASURE',
    'createXtendFabric',
    'createNoopReporter',
    'createReporterAdapter',
    'createConsoleReporter',
    'createTestReporter',
    'normalizeComponentLifecycleTelemetry',
    'summarizeComponentLifecycleTelemetry',
    'normalizeDiagnostic',
    'normalizeDiagnosticCode',
    'normalizeError',
    'normalizeFiber',
    'redactDiagnostic',
    'redactValue'
  ],
  'fabric/rmt-lane-mapping.js': [
    'CONTRACTS',
    'BROWSER_NAMESPACE',
    'RMT_SCHEDULE_LANES',
    'FABRIC_LANES',
    'FABRIC_TO_RMT_LANE',
    'LANE_PROFILES',
    'DEFAULT_LANE_BY_KIND',
    'createFabricRmtLaneMapping',
    'createRmtScheduleRecords',
    'normalizeFabricLaneForRmt',
    'resolveRmtScheduleForFiber'
  ],
  'fabric/hydration-policy.js': [
    'CONTRACTS',
    'BROWSER_NAMESPACE',
    'HYDRATION_POLICIES',
    'HYDRATION_POLICY_IDS',
    'NON_BLOCKING_LANES',
    'resolveHydrationPolicy',
    'createHydrationFiberInput',
    'createHydrationPolicyController',
    'createHydrationScheduleRecords'
  ],
  'a11y/screenreader-signals.js': [
    'CONTRACTS',
    'FABRIC_A11Y_ANNOUNCEMENT',
    'LIVE_REGION_POLICIES',
    'SCREENREADER_SIGNALS_SCHEMA',
    'SCREENREADER_SIGNAL_DEFINITIONS',
    'SCREENREADER_SIGNAL_RECORD_SCHEMA',
    'createScreenreaderSignal',
    'createScreenreaderSignalContract',
    'normalizeLiveRegion',
    'validateScreenreaderSignalContract'
  ],
  'a11y/motion-contrast-policy.js': [
    'CONTRACTS',
    'MOTION_CONTRAST_POLICY_SCHEMA',
    'MOTION_POLICY_SCHEMA',
    'CONTRAST_POLICY_SCHEMA',
    'MOTION_CONTRAST_TEST_SCHEMA',
    'MOTION_MEDIA_QUERY',
    'CONTRAST_MEDIA_QUERY',
    'PROFILE_POLICY_DEFAULTS',
    'SYSTEM_COLOR_TOKENS',
    'FABRIC_A11Y_PREFERENCE',
    'createMotionContrastPolicy',
    'normalizeMotionContrastPolicy',
    'validateMotionContrastPolicy'
  ],
  'a11y/runtime-a11y-contract.js': [
    'RUNTIME_A11Y_CONTRACT_SCHEMA',
    'RUNTIME_A11Y_REPORT_SCHEMA',
    'RUNTIME_A11Y_WORKPACKAGE',
    'RUNTIME_A11Y_CONTRACT_DOC',
    'COMPONENT_SHELL_CONTRACT_SCHEMA',
    'COMPONENT_STYLING_CONTRACT_SCHEMA',
    'A11Y_COMPONENT_CONTRACT_SCHEMA',
    'SCREENREADER_SIGNALS_SCHEMA',
    'MOTION_CONTRAST_POLICY_SCHEMA',
    'RMT_A11Y_AUTHORING_SCHEMA',
    'FABRIC_BOUNDARY_SCHEMA',
    'KERNEL_BOUNDARY',
    'RUNTIME_A11Y_REQUIRED_DOMAINS',
    'RUNTIME_A11Y_PROFILES',
    'RUNTIME_A11Y_REQUIRED_ASSERTIONS',
    'RUNTIME_A11Y_REQUIRED_STATES',
    'RUNTIME_A11Y_KEYBOARD_KEYS',
    'RUNTIME_A11Y_FOCUS_BEHAVIORS',
    'RUNTIME_A11Y_LIVE_REGION_MODES',
    'createRuntimeA11yContract',
    'validateRuntimeA11yContract'
  ],
  'security/manifest-import-policy.js': [
    'ALLOWED_IMPORT_PROTOCOLS',
    'ALLOWED_MANIFEST_EXTENSIONS',
    'ALLOWED_MODULE_EXTENSIONS',
    'CUSTOM_ELEMENT_NAME_PATTERN',
    'IMPORT_POLICY_CONTRACT',
    'LOADER_POLICY_CONTRACT',
    'LOCAL_HOSTS',
    'MANIFEST_IMPORT_GATE_CONTRACT',
    'MANIFEST_POLICY_CONTRACT',
    'REFUSED_PROTOCOLS',
    'RESERVED_BOOTSTRAP_KEYS',
    'classifyManifestRecord',
    'classifyPolicyUrl',
    'createManifestImportPolicy',
    'isAllowedManifestKey',
    'normalizeManifest'
  ],
  'security/trusted-dom-policy.js': [
    'DOM_SINKS',
    'MARKUP_CLASSES',
    'MARKUP_CLASSIFICATION_CONTRACT',
    'PARSEDOWN_DOCS_POLICY',
    'RMT_TEMPLATE_POLICY',
    'SANITIZING_BOUNDARY_CONTRACT',
    'TRUSTED_DOM_SANITIZER_CONTRACT',
    'TRUSTED_DOM_SANITIZER_POLICY',
    'TRUSTED_DOM_POLICY_CONTRACT',
    'TRUSTED_DOM_SINK_CONTRACT',
    'URL_ATTRIBUTE_POLICY',
    'classifyTrustedDomUse',
    'getMarkupClass',
    'getSinkPolicy',
    'getTrustedDomPolicy',
    'isAllowedTrustedDomUrl',
    'sanitizeTrustedDomHtml'
  ],
  'security/supply-chain-gate-policy.js': [
    'DEPENDENCY_AUDIT_GATE_CONTRACT',
    'DEPENDENCY_SECTIONS',
    'LICENSE_POLICY',
    'LICENSE_POLICY_CONTRACT',
    'LOCKFILE_CANDIDATES',
    'RELEASE_SUPPLY_CHAIN_GATE_CONTRACT',
    'SUPPLY_CHAIN_GATE_PLAN_CONTRACT',
    'SUPPLY_CHAIN_GATES',
    'VULNERABILITY_POLICY',
    'VULNERABILITY_POLICY_CONTRACT',
    'classifyPackageSupplyChain',
    'createSupplyChainGatePlan',
    'listDependencies'
  ]
});

const FORBIDDEN_POLICY_DECLARATION_IMPORT_PATTERNS = Object.freeze([
  '.js',
  'components/',
  '../components',
  'xtend-loader',
  'xtend-dev',
  'api.js',
  '../api',
  'xtendrmt/',
  '../xtendrmt',
  'tools/rmt-language',
  '../tools'
]);

function getDefaultPackageManifest() {
  return require('../package.json');
}

function toRepoRelative(filePath) {
  return filePath ? filePath.replace(/^\.\//u, '') : null;
}

function fileExists(rootDir, relativePath) {
  return Boolean(relativePath) && fs.existsSync(path.join(rootDir, toRepoRelative(relativePath)));
}

function readText(rootDir, relativePath) {
  const absolutePath = path.join(rootDir, toRepoRelative(relativePath));
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
}

function collectExportTargets(value, targets = []) {
  if (typeof value === 'string') {
    targets.push(value);
    return targets;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectExportTargets(entry, targets));
  }
  return targets;
}

function getTypesCondition(packageManifest, exportKey) {
  const entry = packageManifest.exports && packageManifest.exports[exportKey];
  return entry && typeof entry === 'object' ? entry.types : null;
}

function getRuntimeTarget(packageManifest, exportKey) {
  const entry = packageManifest.exports && packageManifest.exports[exportKey];
  if (typeof entry === 'string') return entry;
  if (!entry || typeof entry !== 'object') return null;
  return entry.import || entry.browser || entry.default || null;
}

function resolveDeclarationForExport(exportKey) {
  if (exportKey === './fabric') return './fabric/xtend-fabric.d.ts';
  return `${exportKey}.d.ts`;
}

function resolveSourceForExport(exportKey) {
  if (exportKey === './fabric') return './fabric/xtend-fabric.js';
  return `${exportKey}.js`;
}

const POLICY_DECLARATION_FILES = Object.freeze([
  POLICY_SHARED_DECLARATION_FILE,
  ...POLICY_PACKAGE_EXPORTS.map((exportKey) => toRepoRelative(resolveDeclarationForExport(exportKey)))
]);

function createTypeExportsPolicyPlan(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const packageManifest = options.packageManifest || getDefaultPackageManifest();
  const typeExportsPlan = options.typeExportsPlan || createTypeExportsPlan({ rootDir, packageManifest });
  const sharedTypesSource = readText(rootDir, POLICY_SHARED_DECLARATION_FILE);
  const declarationFiles = POLICY_DECLARATION_FILES.map((filePath) => ({
    filePath,
    exists: fileExists(rootDir, filePath),
    size: fileExists(rootDir, filePath) ? fs.statSync(path.join(rootDir, filePath)).size : 0
  }));
  const exportRecords = POLICY_PACKAGE_EXPORTS.map((exportKey) => {
    const expectedTypes = resolveDeclarationForExport(exportKey);
    const runtimeTarget = getRuntimeTarget(packageManifest, exportKey);
    const actualTypes = getTypesCondition(packageManifest, exportKey);
    const entry = packageManifest.exports && packageManifest.exports[exportKey];
    return {
      exportKey,
      expectedTypes,
      actualTypes,
      hasTypesCondition: actualTypes === expectedTypes,
      declarationExists: fileExists(rootDir, expectedTypes),
      runtimeTarget,
      expectedRuntimeTarget: resolveSourceForExport(exportKey),
      runtimeTargetMatches: runtimeTarget === resolveSourceForExport(exportKey),
      targets: collectExportTargets(entry)
    };
  });
  const declarationImportLines = POLICY_DECLARATION_FILES.flatMap((filePath) => {
    const source = readText(rootDir, filePath);
    return source.split('\n')
      .filter((line) => /\bfrom\s+['"]/u.test(line) || /\brequire\(/u.test(line))
      .map((line) => ({ filePath, line }));
  });
  const forbiddenDeclarationRuntimeImports = declarationImportLines
    .filter((entry) => FORBIDDEN_POLICY_DECLARATION_IMPORT_PATTERNS.some((pattern) => entry.line.includes(pattern)))
    .map((entry) => `${entry.filePath}:${entry.line.trim()}`);
  const runtimeImportsDeclarationFiles = POLICY_PACKAGE_EXPORTS
    .map((exportKey) => resolveSourceForExport(exportKey))
    .filter((filePath) => readText(rootDir, filePath)
      .split('\n')
      .some((line) => (/^\s*import\b/u.test(line) || /\brequire\(/u.test(line)) && line.includes('.d.ts')));
  const missingRuntimeExportTokens = Object.entries(POLICY_RUNTIME_EXPORTS_BY_SOURCE).flatMap(([sourcePath, runtimeNames]) => {
    const exportKey = POLICY_PACKAGE_EXPORTS.find((candidate) => toRepoRelative(resolveSourceForExport(candidate)) === sourcePath);
    const declarationPath = exportKey ? toRepoRelative(resolveDeclarationForExport(exportKey)) : sourcePath.replace(/\.js$/u, '.d.ts');
    const declarationSource = readText(rootDir, declarationPath);
    return runtimeNames
      .filter((name) => !declarationSource.includes(` ${name}:`) && !declarationSource.includes(` ${name};`) && !declarationSource.includes(` ${name}(`) && !declarationSource.includes(`function ${name}`))
      .map((name) => `${declarationPath}:${name}`);
  });
  const typeExportClassifications = typeExportsPlan.classifications || [];
  const typeExportsMissingDeclarations = POLICY_PACKAGE_EXPORTS
    .filter((exportKey) => {
      const classification = typeExportClassifications.find((entry) => entry.exportKey === exportKey);
      return !classification || classification.declarationExists !== true || classification.typeDecision !== 'declaration-ready';
    });

  return {
    schema: TYPE_EXPORTS_POLICY_SCHEMA,
    reportSchema: TYPE_EXPORTS_POLICY_REPORT_SCHEMA,
    sourceTypeExportsSchema: TYPE_EXPORTS_SCHEMA,
    workpackage: TYPE_EXPORTS_POLICY_WORKPACKAGE,
    status: TYPE_EXPORTS_POLICY_STATUS,
    targetReadiness: TYPE_EXPORTS_POLICY_TARGET,
    generatedAt: options.generatedAt || 'static-local',
    module: TYPE_EXPORTS_POLICY_MODULE,
    suite: TYPE_EXPORTS_POLICY_SUITE,
    docs: TYPE_EXPORTS_POLICY_DOCS,
    backlog: TYPE_EXPORTS_POLICY_BACKLOG,
    workpackageDocument: TYPE_EXPORTS_POLICY_WORKPACKAGE_DOC,
    localGate: TYPE_EXPORTS_POLICY_LOCAL_GATE,
    packageScript: TYPE_EXPORTS_POLICY_PACKAGE_SCRIPT,
    reportArtifact: TYPE_EXPORTS_POLICY_REPORT_ARTIFACT,
    boundaries: [
      TYPE_EXPORTS_BOUNDARY,
      TYPE_EXPORTS_KERNEL_BOUNDARY,
      TYPE_EXPORTS_DECLARATION_BOUNDARY
    ],
    packageExports: POLICY_PACKAGE_EXPORTS.slice(),
    declarationFiles,
    sharedDeclarationFile: POLICY_SHARED_DECLARATION_FILE,
    sharedTypeTokens: POLICY_SHARED_TYPE_TOKENS.slice(),
    representativeDeclarationTokens: JSON.parse(JSON.stringify(POLICY_REPRESENTATIVE_DECLARATION_TOKENS)),
    exportRecords,
    missingPackageExports: POLICY_PACKAGE_EXPORTS.filter((exportKey) => !packageManifest.exports || !packageManifest.exports[exportKey]),
    missingTypesConditions: exportRecords.filter((record) => !record.actualTypes).map((record) => record.exportKey),
    mismatchedTypesConditions: exportRecords.filter((record) => record.actualTypes && !record.hasTypesCondition).map((record) => `${record.exportKey}:${record.actualTypes}`),
    missingRuntimeTargets: exportRecords.filter((record) => !record.runtimeTarget || !record.runtimeTargetMatches).map((record) => record.exportKey),
    missingDeclarationFiles: declarationFiles.filter((entry) => !entry.exists).map((entry) => entry.filePath),
    missingSharedTypeTokens: POLICY_SHARED_TYPE_TOKENS.filter((token) => !sharedTypesSource.includes(token)),
    missingRepresentativeDeclarationTokens: Object.entries(POLICY_REPRESENTATIVE_DECLARATION_TOKENS).flatMap(([filePath, tokens]) => {
      const source = readText(rootDir, filePath);
      return tokens.filter((token) => !source.includes(token)).map((token) => `${filePath}:${token}`);
    }),
    missingRuntimeExportTokens,
    forbiddenDeclarationRuntimeImports,
    runtimeImportsDeclarationFiles,
    typeExportsMissingDeclarations,
    runtimeChanged: false,
    nextWorkpackage: 'WP-TypeExports-06'
  };
}

function validateTypeExportsPolicyPlan(plan = createTypeExportsPolicyPlan()) {
  const errors = [];

  if (!plan || plan.schema !== TYPE_EXPORTS_POLICY_SCHEMA) errors.push(`schema must be ${TYPE_EXPORTS_POLICY_SCHEMA}`);
  if (!plan || plan.reportSchema !== TYPE_EXPORTS_POLICY_REPORT_SCHEMA) errors.push(`reportSchema must be ${TYPE_EXPORTS_POLICY_REPORT_SCHEMA}`);
  if (!plan || plan.sourceTypeExportsSchema !== TYPE_EXPORTS_SCHEMA) errors.push(`sourceTypeExportsSchema must be ${TYPE_EXPORTS_SCHEMA}`);
  if (!plan || plan.workpackage !== TYPE_EXPORTS_POLICY_WORKPACKAGE) errors.push(`workpackage must be ${TYPE_EXPORTS_POLICY_WORKPACKAGE}`);
  if (!plan || plan.status !== TYPE_EXPORTS_POLICY_STATUS) errors.push(`status must be ${TYPE_EXPORTS_POLICY_STATUS}`);
  if (!plan || plan.targetReadiness !== TYPE_EXPORTS_POLICY_TARGET) errors.push(`targetReadiness must be ${TYPE_EXPORTS_POLICY_TARGET}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_BOUNDARY}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_KERNEL_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_KERNEL_BOUNDARY}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_DECLARATION_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_DECLARATION_BOUNDARY}`);
  if (!plan || plan.packageExports.length !== POLICY_PACKAGE_EXPORTS.length) errors.push('Policy package export count changed');
  if (!plan || plan.declarationFiles.length !== POLICY_DECLARATION_FILES.length) errors.push('Policy declaration file count changed');
  if (!plan || plan.missingPackageExports.length > 0) errors.push(`missing Policy package exports: ${plan ? plan.missingPackageExports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingTypesConditions.length > 0) errors.push(`missing Policy types conditions: ${plan ? plan.missingTypesConditions.join(', ') : '<plan missing>'}`);
  if (!plan || plan.mismatchedTypesConditions.length > 0) errors.push(`mismatched Policy types conditions: ${plan ? plan.mismatchedTypesConditions.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeTargets.length > 0) errors.push(`mismatched Policy runtime targets: ${plan ? plan.missingRuntimeTargets.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingDeclarationFiles.length > 0) errors.push(`missing Policy declaration files: ${plan ? plan.missingDeclarationFiles.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingSharedTypeTokens.length > 0) errors.push(`missing shared Policy type tokens: ${plan ? plan.missingSharedTypeTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRepresentativeDeclarationTokens.length > 0) errors.push(`missing representative Policy declaration tokens: ${plan ? plan.missingRepresentativeDeclarationTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeExportTokens.length > 0) errors.push(`Policy declaration files miss runtime exports: ${plan ? plan.missingRuntimeExportTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.forbiddenDeclarationRuntimeImports.length > 0) errors.push(`Policy declaration files import forbidden runtime surfaces: ${plan ? plan.forbiddenDeclarationRuntimeImports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.runtimeImportsDeclarationFiles.length > 0) errors.push(`Policy runtime imports declaration files: ${plan ? plan.runtimeImportsDeclarationFiles.join(', ') : '<plan missing>'}`);
  if (!plan || plan.typeExportsMissingDeclarations.length > 0) errors.push(`TypeExports does not see Policy declarations: ${plan ? plan.typeExportsMissingDeclarations.join(', ') : '<plan missing>'}`);
  if (!plan || plan.runtimeChanged !== false) errors.push('Policy TypeExports WP must not change runtime code');
  if (!plan || plan.nextWorkpackage !== 'WP-TypeExports-06') errors.push('Policy TypeExports must hand off to WP-TypeExports-06');

  return {
    schema: TYPE_EXPORTS_POLICY_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createTypeExportsPolicyReport(options = {}) {
  const plan = options.plan || createTypeExportsPolicyPlan(options);
  const validation = validateTypeExportsPolicyPlan(plan);

  return {
    schema: TYPE_EXPORTS_POLICY_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    packageExportCount: plan.packageExports.length,
    declarationFileCount: plan.declarationFiles.length,
    sharedTypeTokens: plan.sharedTypeTokens,
    nextWorkpackage: plan.nextWorkpackage,
    plan
  };
}

module.exports = {
  POLICY_DECLARATION_FILES,
  POLICY_PACKAGE_EXPORTS,
  POLICY_REPRESENTATIVE_DECLARATION_TOKENS,
  POLICY_SHARED_DECLARATION_FILE,
  POLICY_SHARED_TYPE_TOKENS,
  TYPE_EXPORTS_POLICY_BACKLOG,
  TYPE_EXPORTS_POLICY_DOCS,
  TYPE_EXPORTS_POLICY_LOCAL_GATE,
  TYPE_EXPORTS_POLICY_MODULE,
  TYPE_EXPORTS_POLICY_PACKAGE_SCRIPT,
  TYPE_EXPORTS_POLICY_REPORT_ARTIFACT,
  TYPE_EXPORTS_POLICY_REPORT_SCHEMA,
  TYPE_EXPORTS_POLICY_SCHEMA,
  TYPE_EXPORTS_POLICY_STATUS,
  TYPE_EXPORTS_POLICY_SUITE,
  TYPE_EXPORTS_POLICY_TARGET,
  TYPE_EXPORTS_POLICY_WORKPACKAGE,
  TYPE_EXPORTS_POLICY_WORKPACKAGE_DOC,
  createTypeExportsPolicyPlan,
  createTypeExportsPolicyReport,
  resolveDeclarationForExport,
  validateTypeExportsPolicyPlan
};
