const fs = require('fs');
const path = require('path');
const {
  createTypeExportsPlan
} = require('./type-exports');

const TYPE_EXPORTS_API_SCHEMA = 'xtend.type-exports.api-declarations.v1';
const TYPE_EXPORTS_API_REPORT_SCHEMA = 'xtend.type-exports.api-declarations-report.v1';
const TYPE_EXPORTS_API_WORKPACKAGE = 'WP-TypeExports-03';
const TYPE_EXPORTS_API_STATUS = 'accepted-core-api-namespace-declarations';
const TYPE_EXPORTS_API_TARGET = 'core-api-namespace-types-ready';
const TYPE_EXPORTS_API_MODULE = 'catalog/type-exports-api.js';
const TYPE_EXPORTS_API_SUITE = 'tests/types/api_type_exports_suite.js';
const TYPE_EXPORTS_API_DOCS = 'docs/xtend-api-types.md';
const TYPE_EXPORTS_API_BACKLOG = 'development/BACKLOG-XTend-TypeExports-und-Public-Declaration-Hardening.md';
const TYPE_EXPORTS_API_WORKPACKAGE_DOC = 'development/WP-TypeExports-03-api-js-und-window-XTend-Namespace-typisieren.md';
const TYPE_EXPORTS_API_LOCAL_GATE = 'node scripts/run_xtend_tests.js type-exports-api --json';
const TYPE_EXPORTS_API_PACKAGE_SCRIPT = 'npm run test:type-exports-api';
const TYPE_EXPORTS_API_REPORT_ARTIFACT = '.xtend-test-results/xtend-type-exports-api-report.json';

const API_DECLARATION_FILES = Object.freeze([
  'api.d.ts'
]);

const API_PACKAGE_EXPORTS = Object.freeze([
  './api'
]);

const API_GLOBALS = Object.freeze([
  'XTend',
  'XTheme',
  'XToast',
  'XAlert',
  'XDialog',
  'XModal',
  'showToast',
  'showAlert',
  'showDialog',
  'showModal'
]);

const XTEND_NAMESPACE_KEYS = Object.freeze([
  'compliance',
  'theme',
  'themeRuntime',
  'toast',
  'alert',
  'dialog',
  'modal'
]);

const API_READY_EVENTS = Object.freeze([
  'xtend-api-ready'
]);

const API_METHOD_TOKENS = Object.freeze([
  'initXTendAPI',
  'getChecklist',
  'getCoreContracts',
  'getThemeTokens',
  'getCurrentTheme',
  'getAvailableThemes',
  'setTheme',
  'loadExternalTheme',
  'registerTheme',
  'removeTheme',
  'getThemeInfo',
  'getAllThemeInfo',
  'hasTheme',
  'getThemeRegistry',
  'listenToSystemTheme',
  'show',
  'success',
  'error',
  'warning',
  'info',
  'clearAll',
  'close'
]);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readRepoText(rootDir, relativePath) {
  try {
    return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
  } catch (_) {
    return '';
  }
}

function findMissingTokens(source, tokens) {
  return tokens.filter((token) => !new RegExp(`\\b${escapeRegExp(token)}\\b`, 'u').test(source));
}

function getPackageExportTypesCondition(packageManifest, exportKey) {
  const entry = packageManifest && packageManifest.exports && packageManifest.exports[exportKey];
  return entry && typeof entry === 'object' && typeof entry.types === 'string' ? entry.types : null;
}

function createTypeExportsApiPlan(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const packageManifest = options.packageManifest || require('../package.json');
  const apiSource = options.apiSource || readRepoText(rootDir, 'api.js');
  const apiDeclarationSource = options.apiDeclarationSource || readRepoText(rootDir, 'api.d.ts');
  const typeExportsPlan = options.typeExportsPlan || createTypeExportsPlan(options);
  const packageTypesConditions = API_PACKAGE_EXPORTS.map((exportKey) => ({
    exportKey,
    types: getPackageExportTypesCondition(packageManifest, exportKey),
    expected: './api.d.ts'
  }));

  return {
    schema: TYPE_EXPORTS_API_SCHEMA,
    reportSchema: TYPE_EXPORTS_API_REPORT_SCHEMA,
    sourceTypeExportsSchema: typeExportsPlan.schema,
    workpackage: TYPE_EXPORTS_API_WORKPACKAGE,
    status: TYPE_EXPORTS_API_STATUS,
    targetReadiness: TYPE_EXPORTS_API_TARGET,
    generatedAt: options.generatedAt || 'static-local',
    module: TYPE_EXPORTS_API_MODULE,
    suite: TYPE_EXPORTS_API_SUITE,
    docs: TYPE_EXPORTS_API_DOCS,
    backlog: TYPE_EXPORTS_API_BACKLOG,
    workpackageDocument: TYPE_EXPORTS_API_WORKPACKAGE_DOC,
    localGate: TYPE_EXPORTS_API_LOCAL_GATE,
    packageScript: TYPE_EXPORTS_API_PACKAGE_SCRIPT,
    reportArtifact: TYPE_EXPORTS_API_REPORT_ARTIFACT,
    declarationFiles: API_DECLARATION_FILES.slice(),
    packageExports: API_PACKAGE_EXPORTS.slice(),
    globals: API_GLOBALS.slice(),
    namespaceKeys: XTEND_NAMESPACE_KEYS.slice(),
    eventNames: API_READY_EVENTS.slice(),
    methodTokens: API_METHOD_TOKENS.slice(),
    packageTypesConditions,
    missingRuntimeGlobals: API_GLOBALS.filter((globalName) => !apiSource.includes(`window.${globalName}`)),
    missingNamespaceAssignments: XTEND_NAMESPACE_KEYS.filter((key) => !apiSource.includes(`window.XTend.${key}`) && !apiSource.includes(`namespace.${key}`)),
    missingRuntimeEvents: API_READY_EVENTS.filter((eventName) => !apiSource.includes(eventName)),
    missingRuntimeMethods: findMissingTokens(apiSource, ['export async function initXTendAPI', ...API_METHOD_TOKENS.filter((token) => token !== 'initXTendAPI')]),
    missingDeclarationTokens: findMissingTokens(apiDeclarationSource, [
      'initXTendAPI',
      'XTendNamespace',
      'XTendComplianceApi',
      'XTendThemeApi',
      'XTendToastApi',
      'XTendAlertApi',
      'XTendDialogApi',
      'XTendModalApi',
      'XTendApiReadyDetail',
      'WindowEventMap',
      ...API_GLOBALS,
      ...XTEND_NAMESPACE_KEYS,
      ...API_READY_EVENTS,
      ...API_METHOD_TOKENS
    ]),
    runtimeImportsDeclarationFiles: apiSource.includes('.d.ts'),
    typeExportsApiDeclarationExists: Boolean(
      typeExportsPlan.classifications.find((entry) => entry.exportKey === './api' && entry.declarationExists === true)
    ),
    nextWorkpackage: 'WP-TypeExports-04'
  };
}

function validateTypeExportsApiPlan(plan = createTypeExportsApiPlan()) {
  const errors = [];
  const badPackageTypesConditions = plan && Array.isArray(plan.packageTypesConditions)
    ? plan.packageTypesConditions.filter((entry) => entry.types !== entry.expected)
    : [];

  if (!plan || plan.schema !== TYPE_EXPORTS_API_SCHEMA) errors.push(`schema must be ${TYPE_EXPORTS_API_SCHEMA}`);
  if (!plan || plan.reportSchema !== TYPE_EXPORTS_API_REPORT_SCHEMA) errors.push(`reportSchema must be ${TYPE_EXPORTS_API_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== TYPE_EXPORTS_API_WORKPACKAGE) errors.push(`workpackage must be ${TYPE_EXPORTS_API_WORKPACKAGE}`);
  if (!plan || plan.status !== TYPE_EXPORTS_API_STATUS) errors.push(`status must be ${TYPE_EXPORTS_API_STATUS}`);
  if (!plan || plan.targetReadiness !== TYPE_EXPORTS_API_TARGET) errors.push(`targetReadiness must be ${TYPE_EXPORTS_API_TARGET}`);
  if (badPackageTypesConditions.length > 0) {
    errors.push(`api package exports without expected types conditions: ${badPackageTypesConditions.map((entry) => entry.exportKey).join(', ')}`);
  }
  if (!plan || plan.missingRuntimeGlobals.length > 0) errors.push(`api.js missing globals: ${plan ? plan.missingRuntimeGlobals.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingNamespaceAssignments.length > 0) errors.push(`api.js missing XTend namespace assignments: ${plan ? plan.missingNamespaceAssignments.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeEvents.length > 0) errors.push(`api.js missing events: ${plan ? plan.missingRuntimeEvents.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeMethods.length > 0) errors.push(`api.js missing runtime methods: ${plan ? plan.missingRuntimeMethods.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingDeclarationTokens.length > 0) errors.push(`api.d.ts missing tokens: ${plan ? plan.missingDeclarationTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.runtimeImportsDeclarationFiles !== false) errors.push('api runtime must not import declaration files');
  if (!plan || plan.typeExportsApiDeclarationExists !== true) errors.push('TypeExports must see api.d.ts as available declaration');
  if (!plan || plan.nextWorkpackage !== 'WP-TypeExports-04') errors.push('next workpackage must be WP-TypeExports-04');

  return {
    schema: TYPE_EXPORTS_API_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createTypeExportsApiReport(options = {}) {
  const plan = options.plan || createTypeExportsApiPlan(options);
  const validation = validateTypeExportsApiPlan(plan);

  return {
    schema: TYPE_EXPORTS_API_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    declarationFiles: plan.declarationFiles,
    packageExports: plan.packageExports,
    globalCount: plan.globals.length,
    namespaceKeyCount: plan.namespaceKeys.length,
    eventNames: plan.eventNames,
    nextWorkpackage: plan.nextWorkpackage,
    plan
  };
}

module.exports = {
  API_DECLARATION_FILES,
  API_GLOBALS,
  API_METHOD_TOKENS,
  API_PACKAGE_EXPORTS,
  API_READY_EVENTS,
  TYPE_EXPORTS_API_BACKLOG,
  TYPE_EXPORTS_API_DOCS,
  TYPE_EXPORTS_API_LOCAL_GATE,
  TYPE_EXPORTS_API_MODULE,
  TYPE_EXPORTS_API_PACKAGE_SCRIPT,
  TYPE_EXPORTS_API_REPORT_ARTIFACT,
  TYPE_EXPORTS_API_REPORT_SCHEMA,
  TYPE_EXPORTS_API_SCHEMA,
  TYPE_EXPORTS_API_STATUS,
  TYPE_EXPORTS_API_SUITE,
  TYPE_EXPORTS_API_TARGET,
  TYPE_EXPORTS_API_WORKPACKAGE,
  TYPE_EXPORTS_API_WORKPACKAGE_DOC,
  XTEND_NAMESPACE_KEYS,
  createTypeExportsApiPlan,
  createTypeExportsApiReport,
  validateTypeExportsApiPlan
};
