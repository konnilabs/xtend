const fs = require('fs');
const path = require('path');
const {
  TYPE_EXPORTS_BOUNDARY,
  TYPE_EXPORTS_DECLARATION_BOUNDARY,
  TYPE_EXPORTS_KERNEL_BOUNDARY,
  TYPE_EXPORTS_SCHEMA,
  createTypeExportsPlan
} = require('./type-exports');

const TYPE_EXPORTS_RMT_SCHEMA = 'xtend.type-exports.rmt-declarations.v1';
const TYPE_EXPORTS_RMT_REPORT_SCHEMA = 'xtend.type-exports.rmt-declarations-report.v1';
const TYPE_EXPORTS_RMT_WORKPACKAGE = 'WP-TypeExports-04';
const TYPE_EXPORTS_RMT_STATUS = 'accepted-rmt-runtime-language-declarations';
const TYPE_EXPORTS_RMT_TARGET = 'rmt-runtime-language-types-ready';
const TYPE_EXPORTS_RMT_MODULE = 'catalog/type-exports-rmt.js';
const TYPE_EXPORTS_RMT_SUITE = 'tests/types/rmt_type_exports_suite.js';
const TYPE_EXPORTS_RMT_DOCS = 'docs/type-exports.md';
const TYPE_EXPORTS_RMT_BACKLOG = 'development/BACKLOG-XTend-TypeExports-und-Public-Declaration-Hardening.md';
const TYPE_EXPORTS_RMT_WORKPACKAGE_DOC = 'development/WP-TypeExports-04-XTendRMT-Runtime-Browser-und-RMT-Language-Exports-typisieren.md';
const TYPE_EXPORTS_RMT_LOCAL_GATE = 'node scripts/run_xtend_tests.js type-exports-rmt --json';
const TYPE_EXPORTS_RMT_PACKAGE_SCRIPT = 'npm run test:type-exports-rmt';
const TYPE_EXPORTS_RMT_REPORT_ARTIFACT = '.xtend-test-results/xtend-type-exports-rmt-report.json';
const RMT_SHARED_DECLARATION_FILE = 'tools/rmt-language/rmt-tooling-public-types.d.ts';

const RMT_RUNTIME_PACKAGE_EXPORTS = Object.freeze([
  './rmt',
  './rmt/browser',
  './rmt/dom-descriptor-renderer',
  './rmt/component-capability-registry',
  './rmt/state-selector-runtime',
  './rmt/action-effect-runtime',
  './rmt/event-routing-runtime',
  './rmt/form-validation-runtime',
  './rmt/surface-transition-runtime',
  './rmt/surface-resource-graph-runtime',
  './rmt/kernel-orchestration-controller',
  './rmt/native-shell-runtime',
  './rmt/node-ssr-adapter'
]);

const RMT_TOOLING_PACKAGE_EXPORTS = Object.freeze([
  './rmt-language/source-model',
  './rmt-language/parser',
  './rmt-language/vnext-parser',
  './rmt-language/vnext-compiler',
  './rmt-language/vnext-lifecycle',
  './rmt-language/vnext-scheduler',
  './rmt-language/vnext-surfaces',
  './rmt-language/vnext-conditions',
  './rmt-language/vnext-composition',
  './rmt-language/vnext-import-resolver',
  './rmt-language/vnext-events',
  './rmt-language/vnext-security',
  './rmt-language/kernel-trust-authority',
  './rmt-language/kernel-panic-monitor',
  './rmt-language/kernel-recovery',
  './rmt-language/kernel-escalation',
  './rmt-language/kernel-scheduler-failure',
  './rmt-language/kernel-policy-parity',
  './rmt-language/kernel-security-regression',
  './rmt-language/vnext-streaming',
  './rmt-language/vnext-tooling',
  './rmt-language/vnext-compatibility',
  './rmt-language/vnext-regression',
  './rmt-language/vnext-release',
  './rmt-language/vnext-remote-manifest',
  './rmt-language/vnext-enterprise-registry',
  './rmt-language/vnext-degradation',
  './rmt-language/vnext-remote-security',
  './rmt-language/vnext-cross-surface-events',
  './rmt-language/vnext-event-governance',
  './rmt-language/vnext-remote-compiler',
  './rmt-language/vnext-remote-tooling',
  './rmt-language/vnext-remote-compatibility',
  './rmt-language/vnext-enterprise-fixtures',
  './rmt-language/vnext-enterprise-release',
  './rmt-language/format-adapter',
  './rmt-language/semantic-graph',
  './rmt-language/diagnostics',
  './rmt-language/completions',
  './rmt-language/hover',
  './rmt-language/symbols',
  './rmt-language/definitions',
  './rmt-language/code-actions',
  './rmt-language/app-platform-tooling',
  './rmt-language-server',
  './rmt-language-server/protocol',
  './rmt-linter/cli',
  './rmt-linter/reporter',
  './rmt-language/snippets',
  './rmt-editor/vscode'
]);

const RMT_PACKAGE_EXPORTS = Object.freeze([
  ...RMT_RUNTIME_PACKAGE_EXPORTS,
  ...RMT_TOOLING_PACKAGE_EXPORTS
]);

const RMT_SHARED_TYPE_TOKENS = Object.freeze([
  'RmtToolingDiagnostic',
  'RmtTextEdit',
  'RmtWorkspaceEdit',
  'RmtLanguageServiceReport',
  'RmtJsonRpcMessage'
]);

const RMT_RUNTIME_CORE_TOKENS = Object.freeze([
  'RmtProductManifest',
  'RmtBrowserRuntime',
  'createRmtRuntime',
  'createRmtBrowserRuntime'
]);

const RMT_REPRESENTATIVE_DECLARATION_TOKENS = Object.freeze({
  'tools/rmt-language/source-model.d.ts': ['RmtRange', 'createRmtSourceModel', 'classifyRmtFile'],
  'tools/rmt-language/parser.d.ts': ['RmtParseResult', 'createRmtParser', 'parseRmtSource'],
  'tools/rmt-language/vnext-compiler.d.ts': ['RmtCompileResult', 'createRmtVNextCompiler', 'compileRmtVNextSource'],
  'tools/rmt-language/vnext-tooling.d.ts': ['RmtCompletionItem', 'RmtHover', 'RmtDocumentSymbol', 'getRmtVNextToolingCompletions'],
  'tools/rmt-language/diagnostics.d.ts': ['RmtToolingDiagnostic', 'createRmtLinter', 'lintRmtSource'],
  'tools/rmt-language/app-platform-tooling.d.ts': ['RmtAppPlatformToolingReport', 'analyzeRmtAppPlatformSource', 'createRmtAppPlatformScaffoldPlan'],
  'tools/rmt-language/code-actions.d.ts': ['RmtCodeAction', 'RmtWorkspaceEdit', 'getRmtCodeActions'],
  'tools/rmt-language/kernel-panic-monitor.d.ts': ['RmtKernelPanicMonitor', 'RmtKernelPanicState', 'createKernelPanicMonitor'],
  'tools/rmt-language/kernel-recovery.d.ts': ['RmtKernelRecoveryController', 'RmtKernelRecoveryOutcome', 'createKernelRecoveryController'],
  'tools/rmt-language/kernel-escalation.d.ts': ['RmtKernelEscalationController', 'RmtKernelEscalationEnvelope', 'createKernelEscalationController'],
  'tools/rmt-language/kernel-scheduler-failure.d.ts': ['RmtKernelSchedulerFailureController', 'RmtKernelSchedulerFailureRecord', 'createKernelSchedulerFailureController'],
  'tools/rmt-language/kernel-policy-parity.d.ts': ['RmtKernelPolicyParityController', 'RmtKernelPolicyParityReport', 'createKernelPolicyParityController'],
  'tools/rmt-language/kernel-security-regression.d.ts': ['RmtKernelSecurityRegressionReport', 'RmtKernelSecurityRegressionFixtureSet', 'createKernelSecurityRegressionFixtures'],
  'xtendrmt/rmt-component-capability-registry.d.ts': ['RmtComponentCapabilityRegistry', 'RmtComponentCapability', 'createRmtComponentCapabilityRegistry'],
  'xtendrmt/rmt-kernel-orchestration-controller.d.ts': ['RmtKernelOrchestrationController', 'RmtKernelOrchestrationControllerOptions', 'createRmtKernelOrchestrationController'],
  'xtendrmt/rmt-form-validation-runtime.d.ts': ['RmtFormValidationRuntime', 'RmtFormValidationRuntimeOptions', 'createRmtFormValidationRuntime'],
  'xtendrmt/rmt-surface-transition-runtime.d.ts': ['RmtSurfaceTransitionRuntime', 'RmtSurfaceTransitionRuntimeOptions', 'createRmtSurfaceTransitionRuntime'],
  'xtendrmt/rmt-node-ssr-adapter.d.ts': ['RmtNodeSsrAdapter', 'RmtNodeSsrRenderResult', 'RmtNodeSsrJsonlFrame', 'createRmtNodeSsrAdapter'],
  'tools/rmt-language-server/protocol.d.ts': ['RmtJsonRpcMessage', 'encodeProtocolMessage', 'parseProtocolMessages'],
  'tools/rmt-language-server/server.d.ts': ['RmtLanguageServiceProvider', 'RmtLanguageServer', 'createRmtLanguageServer'],
  'tools/rmt-linter/reporter.d.ts': ['RmtLanguageServiceReport', 'createRmtAgentRepairReport'],
  'tools/rmt-editor/vscode/extension.d.ts': ['activate', 'deactivate', 'resolveServerModule']
});

const FORBIDDEN_DECLARATION_IMPORT_PATTERNS = Object.freeze([
  'components/',
  '../components',
  'xtend-loader',
  'xtend-dev',
  'api.js',
  '../api',
  'fabric/',
  'security/',
  'a11y/'
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
  if (exportKey === './rmt' || exportKey === './rmt/browser') return './xtendrmt/rmt-core.d.ts';
  if (exportKey === './rmt/dom-descriptor-renderer') return './xtendrmt/rmt-dom-descriptor-renderer.d.ts';
  if (exportKey === './rmt/component-capability-registry') return './xtendrmt/rmt-component-capability-registry.d.ts';
  if (exportKey === './rmt/state-selector-runtime') return './xtendrmt/rmt-state-selector-runtime.d.ts';
  if (exportKey === './rmt/action-effect-runtime') return './xtendrmt/rmt-action-effect-runtime.d.ts';
  if (exportKey === './rmt/event-routing-runtime') return './xtendrmt/rmt-event-routing-runtime.d.ts';
  if (exportKey === './rmt/form-validation-runtime') return './xtendrmt/rmt-form-validation-runtime.d.ts';
  if (exportKey === './rmt/surface-transition-runtime') return './xtendrmt/rmt-surface-transition-runtime.d.ts';
  if (exportKey === './rmt/surface-resource-graph-runtime') return './xtendrmt/rmt-surface-resource-graph-runtime.d.ts';
  if (exportKey === './rmt/kernel-orchestration-controller') return './xtendrmt/rmt-kernel-orchestration-controller.d.ts';
  if (exportKey === './rmt/native-shell-runtime') return './xtendrmt/rmt-native-shell-runtime.d.ts';
  if (exportKey === './rmt/node-ssr-adapter') return './xtendrmt/rmt-node-ssr-adapter.d.ts';
  if (exportKey === './rmt-language/snippets') return './tools/rmt-language/snippets/index.d.ts';
  if (exportKey === './rmt-language-server') return './tools/rmt-language-server/server.d.ts';
  if (exportKey === './rmt-language-server/protocol') return './tools/rmt-language-server/protocol.d.ts';
  if (exportKey === './rmt-linter/cli') return './tools/rmt-linter/cli.d.ts';
  if (exportKey === './rmt-linter/reporter') return './tools/rmt-linter/reporter.d.ts';
  if (exportKey === './rmt-editor/vscode') return './tools/rmt-editor/vscode/extension.d.ts';
  return `./tools/${exportKey.slice(2)}.d.ts`;
}

function resolveSourceForExport(exportKey) {
  if (exportKey === './rmt') return './xtendrmt/rmt-runtime.esm.js';
  if (exportKey === './rmt/browser') return './xtendrmt/rmt-runtime.browser.js';
  if (exportKey === './rmt/dom-descriptor-renderer') return './xtendrmt/rmt-dom-descriptor-renderer.js';
  if (exportKey === './rmt/component-capability-registry') return './xtendrmt/rmt-component-capability-registry.js';
  if (exportKey === './rmt/state-selector-runtime') return './xtendrmt/rmt-state-selector-runtime.js';
  if (exportKey === './rmt/action-effect-runtime') return './xtendrmt/rmt-action-effect-runtime.js';
  if (exportKey === './rmt/event-routing-runtime') return './xtendrmt/rmt-event-routing-runtime.js';
  if (exportKey === './rmt/form-validation-runtime') return './xtendrmt/rmt-form-validation-runtime.js';
  if (exportKey === './rmt/surface-transition-runtime') return './xtendrmt/rmt-surface-transition-runtime.js';
  if (exportKey === './rmt/surface-resource-graph-runtime') return './xtendrmt/rmt-surface-resource-graph-runtime.js';
  if (exportKey === './rmt/kernel-orchestration-controller') return './xtendrmt/rmt-kernel-orchestration-controller.js';
  if (exportKey === './rmt/native-shell-runtime') return './xtendrmt/rmt-native-shell-runtime.js';
  if (exportKey === './rmt/node-ssr-adapter') return './xtendrmt/rmt-node-ssr-adapter.js';
  if (exportKey === './rmt-language/snippets') return './tools/rmt-language/snippets/index.js';
  if (exportKey === './rmt-language-server') return './tools/rmt-language-server/server.js';
  if (exportKey === './rmt-language-server/protocol') return './tools/rmt-language-server/protocol.js';
  if (exportKey === './rmt-linter/cli') return './tools/rmt-linter/cli.js';
  if (exportKey === './rmt-linter/reporter') return './tools/rmt-linter/reporter.js';
  if (exportKey === './rmt-editor/vscode') return './tools/rmt-editor/vscode/extension.js';
  return `./tools/${exportKey.slice(2)}.js`;
}

const RMT_DECLARATION_FILES = Object.freeze([
  'xtendrmt/rmt-core.d.ts',
  'xtendrmt/rmt-dom-descriptor-renderer.d.ts',
  'xtendrmt/rmt-component-capability-registry.d.ts',
  'xtendrmt/rmt-state-selector-runtime.d.ts',
  'xtendrmt/rmt-action-effect-runtime.d.ts',
  'xtendrmt/rmt-event-routing-runtime.d.ts',
  'xtendrmt/rmt-form-validation-runtime.d.ts',
  'xtendrmt/rmt-surface-transition-runtime.d.ts',
  'xtendrmt/rmt-surface-resource-graph-runtime.d.ts',
  'xtendrmt/rmt-kernel-orchestration-controller.d.ts',
  'xtendrmt/rmt-native-shell-runtime.d.ts',
  'xtendrmt/rmt-node-ssr-adapter.d.ts',
  RMT_SHARED_DECLARATION_FILE,
  ...RMT_TOOLING_PACKAGE_EXPORTS.map((exportKey) => toRepoRelative(resolveDeclarationForExport(exportKey)))
]);

function extractRuntimeExportNames(sourceText) {
  const names = new Set();
  const object = sourceText.match(/module\.exports\s*=\s*\{([\s\S]*?)\n\};/m);
  if (object) {
    object[1].split('\n').forEach((line) => {
      const property = line.trim().match(/^([A-Za-z_$][\w$]*)\s*[:,]?/u);
      if (property && !['if', 'for', 'return'].includes(property[1])) names.add(property[1]);
    });
  }
  for (const match of sourceText.matchAll(/exports\.([A-Za-z_$][\w$]*)\s*=/gu)) {
    names.add(match[1]);
  }
  return [...names];
}

function createTypeExportsRmtPlan(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const packageManifest = options.packageManifest || getDefaultPackageManifest();
  const typeExportsPlan = options.typeExportsPlan || createTypeExportsPlan({ rootDir, packageManifest });
  const declarationFiles = RMT_DECLARATION_FILES.map((filePath) => ({
    filePath,
    exists: fileExists(rootDir, filePath),
    size: fileExists(rootDir, filePath) ? fs.statSync(path.join(rootDir, filePath)).size : 0
  }));
  const sharedTypesSource = readText(rootDir, RMT_SHARED_DECLARATION_FILE);
  const rmtCoreSource = readText(rootDir, 'xtendrmt/rmt-core.d.ts');
  const exportRecords = RMT_PACKAGE_EXPORTS.map((exportKey) => {
    const expectedTypes = resolveDeclarationForExport(exportKey);
    const runtimeTarget = getRuntimeTarget(packageManifest, exportKey);
    const actualTypes = getTypesCondition(packageManifest, exportKey);
    const entry = packageManifest.exports && packageManifest.exports[exportKey];
    const targets = collectExportTargets(entry);
    return {
      exportKey,
      expectedTypes,
      actualTypes,
      hasTypesCondition: actualTypes === expectedTypes,
      declarationExists: fileExists(rootDir, expectedTypes),
      runtimeTarget,
      expectedRuntimeTarget: resolveSourceForExport(exportKey),
      runtimeTargetMatches: runtimeTarget === resolveSourceForExport(exportKey),
      targets
    };
  });
  const runtimeSources = RMT_PACKAGE_EXPORTS.map((exportKey) => resolveSourceForExport(exportKey));
  const declarationImportLines = RMT_DECLARATION_FILES.flatMap((filePath) => {
    const source = readText(rootDir, filePath);
    return source.split('\n')
      .filter((line) => /\bfrom\s+['"]/u.test(line) || /\brequire\(/u.test(line))
      .map((line) => ({ filePath, line }));
  });
  const forbiddenDeclarationRuntimeImports = declarationImportLines
    .filter((entry) => FORBIDDEN_DECLARATION_IMPORT_PATTERNS.some((pattern) => entry.line.includes(pattern)))
    .map((entry) => `${entry.filePath}:${entry.line.trim()}`);
  const runtimeImportsDeclarationFiles = runtimeSources
    .filter((filePath) => readText(rootDir, filePath)
      .split('\n')
      .some((line) => (/^\s*import\b/u.test(line) || /\brequire\(/u.test(line)) && line.includes('.d.ts')));
  const missingRuntimeExportTokens = RMT_TOOLING_PACKAGE_EXPORTS.flatMap((exportKey) => {
    const sourcePath = resolveSourceForExport(exportKey);
    const declarationPath = toRepoRelative(resolveDeclarationForExport(exportKey));
    const runtimeNames = extractRuntimeExportNames(readText(rootDir, sourcePath));
    const declarationSource = readText(rootDir, declarationPath);
    return runtimeNames
      .filter((name) => !declarationSource.includes(` ${name}:`) && !declarationSource.includes(` ${name};`) && !declarationSource.includes(` ${name}(`))
      .map((name) => `${declarationPath}:${name}`);
  });
  const typeExportClassifications = typeExportsPlan.classifications || [];
  const typeExportsMissingDeclarations = RMT_PACKAGE_EXPORTS
    .filter((exportKey) => {
      const classification = typeExportClassifications.find((entry) => entry.exportKey === exportKey);
      return !classification || classification.declarationExists !== true || classification.typeDecision !== 'declaration-ready';
    });

  return {
    schema: TYPE_EXPORTS_RMT_SCHEMA,
    reportSchema: TYPE_EXPORTS_RMT_REPORT_SCHEMA,
    sourceTypeExportsSchema: TYPE_EXPORTS_SCHEMA,
    workpackage: TYPE_EXPORTS_RMT_WORKPACKAGE,
    status: TYPE_EXPORTS_RMT_STATUS,
    targetReadiness: TYPE_EXPORTS_RMT_TARGET,
    generatedAt: options.generatedAt || 'static-local',
    module: TYPE_EXPORTS_RMT_MODULE,
    suite: TYPE_EXPORTS_RMT_SUITE,
    docs: TYPE_EXPORTS_RMT_DOCS,
    backlog: TYPE_EXPORTS_RMT_BACKLOG,
    workpackageDocument: TYPE_EXPORTS_RMT_WORKPACKAGE_DOC,
    localGate: TYPE_EXPORTS_RMT_LOCAL_GATE,
    packageScript: TYPE_EXPORTS_RMT_PACKAGE_SCRIPT,
    reportArtifact: TYPE_EXPORTS_RMT_REPORT_ARTIFACT,
    boundaries: [
      TYPE_EXPORTS_BOUNDARY,
      TYPE_EXPORTS_KERNEL_BOUNDARY,
      TYPE_EXPORTS_DECLARATION_BOUNDARY
    ],
    packageExports: RMT_PACKAGE_EXPORTS.slice(),
    runtimePackageExports: RMT_RUNTIME_PACKAGE_EXPORTS.slice(),
    toolingPackageExports: RMT_TOOLING_PACKAGE_EXPORTS.slice(),
    declarationFiles,
    sharedDeclarationFile: RMT_SHARED_DECLARATION_FILE,
    sharedTypeTokens: RMT_SHARED_TYPE_TOKENS.slice(),
    runtimeCoreTokens: RMT_RUNTIME_CORE_TOKENS.slice(),
    representativeDeclarationTokens: JSON.parse(JSON.stringify(RMT_REPRESENTATIVE_DECLARATION_TOKENS)),
    exportRecords,
    missingPackageExports: RMT_PACKAGE_EXPORTS.filter((exportKey) => !packageManifest.exports || !packageManifest.exports[exportKey]),
    missingTypesConditions: exportRecords.filter((record) => !record.actualTypes).map((record) => record.exportKey),
    mismatchedTypesConditions: exportRecords.filter((record) => record.actualTypes && !record.hasTypesCondition).map((record) => `${record.exportKey}:${record.actualTypes}`),
    missingRuntimeTargets: exportRecords.filter((record) => !record.runtimeTarget || !record.runtimeTargetMatches).map((record) => record.exportKey),
    missingDeclarationFiles: declarationFiles.filter((entry) => !entry.exists).map((entry) => entry.filePath),
    missingSharedTypeTokens: RMT_SHARED_TYPE_TOKENS.filter((token) => !sharedTypesSource.includes(token)),
    missingRuntimeCoreTokens: RMT_RUNTIME_CORE_TOKENS.filter((token) => !rmtCoreSource.includes(token)),
    missingRepresentativeDeclarationTokens: Object.entries(RMT_REPRESENTATIVE_DECLARATION_TOKENS).flatMap(([filePath, tokens]) => {
      const source = readText(rootDir, filePath);
      return tokens.filter((token) => !source.includes(token)).map((token) => `${filePath}:${token}`);
    }),
    missingRuntimeExportTokens,
    forbiddenDeclarationRuntimeImports,
    runtimeImportsDeclarationFiles,
    typeExportsMissingDeclarations,
    runtimeChanged: false,
    nextWorkpackage: 'WP-TypeExports-05'
  };
}

function validateTypeExportsRmtPlan(plan = createTypeExportsRmtPlan()) {
  const errors = [];

  if (!plan || plan.schema !== TYPE_EXPORTS_RMT_SCHEMA) errors.push(`schema must be ${TYPE_EXPORTS_RMT_SCHEMA}`);
  if (!plan || plan.reportSchema !== TYPE_EXPORTS_RMT_REPORT_SCHEMA) errors.push(`reportSchema must be ${TYPE_EXPORTS_RMT_REPORT_SCHEMA}`);
  if (!plan || plan.sourceTypeExportsSchema !== TYPE_EXPORTS_SCHEMA) errors.push(`sourceTypeExportsSchema must be ${TYPE_EXPORTS_SCHEMA}`);
  if (!plan || plan.workpackage !== TYPE_EXPORTS_RMT_WORKPACKAGE) errors.push(`workpackage must be ${TYPE_EXPORTS_RMT_WORKPACKAGE}`);
  if (!plan || plan.status !== TYPE_EXPORTS_RMT_STATUS) errors.push(`status must be ${TYPE_EXPORTS_RMT_STATUS}`);
  if (!plan || plan.targetReadiness !== TYPE_EXPORTS_RMT_TARGET) errors.push(`targetReadiness must be ${TYPE_EXPORTS_RMT_TARGET}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_BOUNDARY}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_KERNEL_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_KERNEL_BOUNDARY}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_DECLARATION_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_DECLARATION_BOUNDARY}`);
  if (!plan || plan.packageExports.length !== RMT_PACKAGE_EXPORTS.length) errors.push('RMT package export count changed');
  if (!plan || plan.declarationFiles.length !== RMT_DECLARATION_FILES.length) errors.push('RMT declaration file count changed');
  if (!plan || plan.missingPackageExports.length > 0) errors.push(`missing RMT package exports: ${plan ? plan.missingPackageExports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingTypesConditions.length > 0) errors.push(`missing RMT types conditions: ${plan ? plan.missingTypesConditions.join(', ') : '<plan missing>'}`);
  if (!plan || plan.mismatchedTypesConditions.length > 0) errors.push(`mismatched RMT types conditions: ${plan ? plan.mismatchedTypesConditions.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeTargets.length > 0) errors.push(`mismatched RMT runtime targets: ${plan ? plan.missingRuntimeTargets.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingDeclarationFiles.length > 0) errors.push(`missing RMT declaration files: ${plan ? plan.missingDeclarationFiles.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingSharedTypeTokens.length > 0) errors.push(`missing shared RMT type tokens: ${plan ? plan.missingSharedTypeTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeCoreTokens.length > 0) errors.push(`missing RMT core type tokens: ${plan ? plan.missingRuntimeCoreTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRepresentativeDeclarationTokens.length > 0) errors.push(`missing representative RMT declaration tokens: ${plan ? plan.missingRepresentativeDeclarationTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeExportTokens.length > 0) errors.push(`RMT declaration files miss runtime exports: ${plan ? plan.missingRuntimeExportTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.forbiddenDeclarationRuntimeImports.length > 0) errors.push(`RMT declaration files import forbidden UI/runtime surfaces: ${plan ? plan.forbiddenDeclarationRuntimeImports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.runtimeImportsDeclarationFiles.length > 0) errors.push(`RMT runtime imports declaration files: ${plan ? plan.runtimeImportsDeclarationFiles.join(', ') : '<plan missing>'}`);
  if (!plan || plan.typeExportsMissingDeclarations.length > 0) errors.push(`TypeExports does not see RMT declarations: ${plan ? plan.typeExportsMissingDeclarations.join(', ') : '<plan missing>'}`);
  if (!plan || plan.runtimeChanged !== false) errors.push('RMT TypeExports WP must not change runtime code');
  if (!plan || plan.nextWorkpackage !== 'WP-TypeExports-05') errors.push('RMT TypeExports must hand off to WP-TypeExports-05');

  return {
    schema: TYPE_EXPORTS_RMT_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createTypeExportsRmtReport(options = {}) {
  const plan = options.plan || createTypeExportsRmtPlan(options);
  const validation = validateTypeExportsRmtPlan(plan);

  return {
    schema: TYPE_EXPORTS_RMT_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    packageExportCount: plan.packageExports.length,
    declarationFileCount: plan.declarationFiles.length,
    runtimePackageExports: plan.runtimePackageExports,
    toolingPackageExportCount: plan.toolingPackageExports.length,
    sharedTypeTokens: plan.sharedTypeTokens,
    nextWorkpackage: plan.nextWorkpackage,
    plan
  };
}

module.exports = {
  RMT_DECLARATION_FILES,
  RMT_PACKAGE_EXPORTS,
  RMT_REPRESENTATIVE_DECLARATION_TOKENS,
  RMT_RUNTIME_CORE_TOKENS,
  RMT_RUNTIME_PACKAGE_EXPORTS,
  RMT_SHARED_DECLARATION_FILE,
  RMT_SHARED_TYPE_TOKENS,
  RMT_TOOLING_PACKAGE_EXPORTS,
  TYPE_EXPORTS_RMT_BACKLOG,
  TYPE_EXPORTS_RMT_DOCS,
  TYPE_EXPORTS_RMT_LOCAL_GATE,
  TYPE_EXPORTS_RMT_MODULE,
  TYPE_EXPORTS_RMT_PACKAGE_SCRIPT,
  TYPE_EXPORTS_RMT_REPORT_ARTIFACT,
  TYPE_EXPORTS_RMT_REPORT_SCHEMA,
  TYPE_EXPORTS_RMT_SCHEMA,
  TYPE_EXPORTS_RMT_STATUS,
  TYPE_EXPORTS_RMT_SUITE,
  TYPE_EXPORTS_RMT_TARGET,
  TYPE_EXPORTS_RMT_WORKPACKAGE,
  TYPE_EXPORTS_RMT_WORKPACKAGE_DOC,
  createTypeExportsRmtPlan,
  createTypeExportsRmtReport,
  resolveDeclarationForExport,
  validateTypeExportsRmtPlan
};
