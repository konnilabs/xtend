const fs = require('fs');
const path = require('path');
const {
  createTypeExportsPlan
} = require('./type-exports');

const TYPE_EXPORTS_LOADER_SCHEMA = 'xtend.type-exports.loader-declarations.v1';
const TYPE_EXPORTS_LOADER_REPORT_SCHEMA = 'xtend.type-exports.loader-declarations-report.v1';
const TYPE_EXPORTS_LOADER_WORKPACKAGE = 'WP-TypeExports-02';
const TYPE_EXPORTS_LOADER_STATUS = 'accepted-loader-style-skeleton-declarations';
const TYPE_EXPORTS_LOADER_TARGET = 'loader-style-skeleton-types-ready';
const TYPE_EXPORTS_LOADER_MODULE = 'catalog/type-exports-loader.js';
const TYPE_EXPORTS_LOADER_SUITE = 'tests/types/loader_type_exports_suite.js';
const TYPE_EXPORTS_LOADER_DOCS = 'docs/xtend-loader-types.md';
const TYPE_EXPORTS_LOADER_BACKLOG = 'development/BACKLOG-XTend-TypeExports-und-Public-Declaration-Hardening.md';
const TYPE_EXPORTS_LOADER_WORKPACKAGE_DOC = 'development/WP-TypeExports-02-XTendLoader-StyleRegistry-und-SkeletonLoader-typisieren.md';
const TYPE_EXPORTS_LOADER_LOCAL_GATE = 'node scripts/run_xtend_tests.js type-exports-loader --json';
const TYPE_EXPORTS_LOADER_PACKAGE_SCRIPT = 'npm run test:type-exports-loader';
const TYPE_EXPORTS_LOADER_REPORT_ARTIFACT = '.xtend-test-results/xtend-type-exports-loader-report.json';

const LOADER_DECLARATION_FILES = Object.freeze([
  'xtend-loader.d.ts',
  'xtend-dev.d.ts'
]);

const LOADER_PACKAGE_EXPORTS = Object.freeze([
  '.',
  './loader',
  './legacy-loader'
]);

const LOADER_GLOBALS = Object.freeze([
  'XTendLoader',
  'XTendStyleRegistry',
  'XTendSkeletonLoader',
  '__XTendLoaderBootPromise'
]);

const LOADER_API_METHODS = Object.freeze([
  'verbose',
  'setVerbose',
  'enableVerbose',
  'disableVerbose',
  'getVerboseMode',
  'getVerboseState',
  'isVerbose',
  'ensureRuntimeStyles',
  'defineComponentStyle',
  'adoptStyle',
  'getThemeStylesheetState',
  'createSkeleton',
  'showSkeleton',
  'hideSkeleton',
  'ensureComponent',
  'hydrateTree',
  'initiateXTend'
]);

const STYLE_REGISTRY_METHODS = Object.freeze([
  'ensureRuntimeStyles',
  'ensureDocumentStyle',
  'defineComponentStyle',
  'adopt',
  'adoptStyle',
  'get',
  'getThemeStylesheetState',
  'list'
]);

const SKELETON_LOADER_METHODS = Object.freeze([
  'create',
  'show',
  'hide'
]);

const LOADER_EVENT_NAMES = Object.freeze([
  'xtend-loader-diagnostic',
  'xtend-loader-performance',
  'xtend-loader-tree-hydrated'
]);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractObjectFreezeBlock(source, marker) {
  const start = source.indexOf(marker);
  if (start < 0) return '';
  const braceStart = source.indexOf('{', start);
  if (braceStart < 0) return '';

  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) return source.slice(braceStart, index + 1);
  }
  return '';
}

function blockHasProperty(block, propertyName) {
  const escaped = escapeRegExp(propertyName);
  return new RegExp(`(?:^|[\\s,{])${escaped}\\s*(?::|,|\\(|(?=\\s*(?:\\}|$)))`, 'u').test(block);
}

function findMissingRuntimeProperties(source, marker, properties) {
  const block = extractObjectFreezeBlock(source, marker);
  return properties.filter((propertyName) => !blockHasProperty(block, propertyName));
}

function findMissingDeclarationTokens(declarationSource, tokens) {
  return tokens.filter((token) => !new RegExp(`\\b${escapeRegExp(token)}\\b`, 'u').test(declarationSource));
}

function getPackageExportTypesCondition(packageManifest, exportKey) {
  const entry = packageManifest && packageManifest.exports && packageManifest.exports[exportKey];
  return entry && typeof entry === 'object' && typeof entry.types === 'string' ? entry.types : null;
}

function readRepoText(rootDir, relativePath) {
  try {
    return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
  } catch (_) {
    return '';
  }
}

function createTypeExportsLoaderPlan(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const packageManifest = options.packageManifest || require('../package.json');
  const loaderSource = options.loaderSource || readRepoText(rootDir, 'xtend-loader.js');
  const loaderDeclarationSource = options.loaderDeclarationSource || readRepoText(rootDir, 'xtend-loader.d.ts');
  const legacyDeclarationSource = options.legacyDeclarationSource || readRepoText(rootDir, 'xtend-dev.d.ts');
  const typeExportsPlan = options.typeExportsPlan || createTypeExportsPlan(options);
  const packageTypesConditions = LOADER_PACKAGE_EXPORTS.map((exportKey) => ({
    exportKey,
    types: getPackageExportTypesCondition(packageManifest, exportKey),
    expected: exportKey === './legacy-loader' ? './xtend-dev.d.ts' : './xtend-loader.d.ts'
  }));

  return {
    schema: TYPE_EXPORTS_LOADER_SCHEMA,
    reportSchema: TYPE_EXPORTS_LOADER_REPORT_SCHEMA,
    sourceTypeExportsSchema: typeExportsPlan.schema,
    workpackage: TYPE_EXPORTS_LOADER_WORKPACKAGE,
    status: TYPE_EXPORTS_LOADER_STATUS,
    targetReadiness: TYPE_EXPORTS_LOADER_TARGET,
    generatedAt: options.generatedAt || 'static-local',
    module: TYPE_EXPORTS_LOADER_MODULE,
    suite: TYPE_EXPORTS_LOADER_SUITE,
    docs: TYPE_EXPORTS_LOADER_DOCS,
    backlog: TYPE_EXPORTS_LOADER_BACKLOG,
    workpackageDocument: TYPE_EXPORTS_LOADER_WORKPACKAGE_DOC,
    localGate: TYPE_EXPORTS_LOADER_LOCAL_GATE,
    packageScript: TYPE_EXPORTS_LOADER_PACKAGE_SCRIPT,
    reportArtifact: TYPE_EXPORTS_LOADER_REPORT_ARTIFACT,
    declarationFiles: LOADER_DECLARATION_FILES.slice(),
    packageExports: LOADER_PACKAGE_EXPORTS.slice(),
    globals: LOADER_GLOBALS.slice(),
    loaderApiMethods: LOADER_API_METHODS.slice(),
    styleRegistryMethods: STYLE_REGISTRY_METHODS.slice(),
    skeletonLoaderMethods: SKELETON_LOADER_METHODS.slice(),
    eventNames: LOADER_EVENT_NAMES.slice(),
    packageTypesConditions,
    missingLoaderRuntimeMethods: findMissingRuntimeProperties(loaderSource, 'window.XTendLoader = Object.freeze({', LOADER_API_METHODS),
    missingStyleRegistryRuntimeMethods: findMissingRuntimeProperties(loaderSource, 'const XTendStyleRegistry = Object.freeze({', STYLE_REGISTRY_METHODS),
    missingSkeletonRuntimeMethods: findMissingRuntimeProperties(loaderSource, 'const SkeletonLoader = Object.freeze({', SKELETON_LOADER_METHODS),
    missingDeclarationTokens: findMissingDeclarationTokens(loaderDeclarationSource, [
      'XTendLoaderApi',
      'XTendStyleRegistryApi',
      'XTendSkeletonLoaderApi',
      'XTendLoaderDiagnosticDetail',
      'XTendLoaderPerformanceDetail',
      'XTendHydrateTreeDetail',
      ...LOADER_API_METHODS,
      ...STYLE_REGISTRY_METHODS,
      ...SKELETON_LOADER_METHODS,
      ...LOADER_EVENT_NAMES
    ]),
    legacyDeclarationReexportsLoaderTypes: legacyDeclarationSource.includes("from './xtend-loader'"),
    runtimeImportsDeclarationFiles: loaderSource.includes('.d.ts'),
    bootPathUnchanged: loaderSource.includes("ensureRuntimeStyles({ source: 'loader.evaluate' });") &&
      loaderSource.includes('window.__XTendLoaderBootPromise = initiateXTend();'),
    xtendCssOptionalThemeOnly: loaderDeclarationSource.includes("standardFileName: 'xtend.css'") &&
      loaderDeclarationSource.includes("'optional-host-theme'") &&
      loaderDeclarationSource.includes("'runtime-critical-only'"),
    nextWorkpackage: 'WP-TypeExports-03'
  };
}

function validateTypeExportsLoaderPlan(plan = createTypeExportsLoaderPlan()) {
  const errors = [];
  const badPackageTypesConditions = plan && Array.isArray(plan.packageTypesConditions)
    ? plan.packageTypesConditions.filter((entry) => entry.types !== entry.expected)
    : [];

  if (!plan || plan.schema !== TYPE_EXPORTS_LOADER_SCHEMA) errors.push(`schema must be ${TYPE_EXPORTS_LOADER_SCHEMA}`);
  if (!plan || plan.reportSchema !== TYPE_EXPORTS_LOADER_REPORT_SCHEMA) errors.push(`reportSchema must be ${TYPE_EXPORTS_LOADER_REPORT_SCHEMA}`);
  if (!plan || plan.workpackage !== TYPE_EXPORTS_LOADER_WORKPACKAGE) errors.push(`workpackage must be ${TYPE_EXPORTS_LOADER_WORKPACKAGE}`);
  if (!plan || plan.status !== TYPE_EXPORTS_LOADER_STATUS) errors.push(`status must be ${TYPE_EXPORTS_LOADER_STATUS}`);
  if (!plan || plan.targetReadiness !== TYPE_EXPORTS_LOADER_TARGET) errors.push(`targetReadiness must be ${TYPE_EXPORTS_LOADER_TARGET}`);
  if (badPackageTypesConditions.length > 0) {
    errors.push(`loader package exports without expected types conditions: ${badPackageTypesConditions.map((entry) => entry.exportKey).join(', ')}`);
  }
  if (!plan || plan.missingLoaderRuntimeMethods.length > 0) errors.push(`XTendLoader runtime missing methods: ${plan ? plan.missingLoaderRuntimeMethods.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingStyleRegistryRuntimeMethods.length > 0) errors.push(`XTendStyleRegistry runtime missing methods: ${plan ? plan.missingStyleRegistryRuntimeMethods.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingSkeletonRuntimeMethods.length > 0) errors.push(`XTendSkeletonLoader runtime missing methods: ${plan ? plan.missingSkeletonRuntimeMethods.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingDeclarationTokens.length > 0) errors.push(`xtend-loader.d.ts missing tokens: ${plan ? plan.missingDeclarationTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.legacyDeclarationReexportsLoaderTypes !== true) errors.push('xtend-dev.d.ts must re-export loader types');
  if (!plan || plan.runtimeImportsDeclarationFiles !== false) errors.push('loader runtime must not import declaration files');
  if (!plan || plan.bootPathUnchanged !== true) errors.push('loader boot path must remain unchanged');
  if (!plan || plan.xtendCssOptionalThemeOnly !== true) errors.push('xtend.css must remain an optional theme stylesheet in types');
  if (!plan || plan.nextWorkpackage !== 'WP-TypeExports-03') errors.push('next workpackage must be WP-TypeExports-03');

  return {
    schema: TYPE_EXPORTS_LOADER_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createTypeExportsLoaderReport(options = {}) {
  const plan = options.plan || createTypeExportsLoaderPlan(options);
  const validation = validateTypeExportsLoaderPlan(plan);

  return {
    schema: TYPE_EXPORTS_LOADER_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    declarationFiles: plan.declarationFiles,
    packageExports: plan.packageExports,
    loaderApiMethodCount: plan.loaderApiMethods.length,
    styleRegistryMethodCount: plan.styleRegistryMethods.length,
    skeletonLoaderMethodCount: plan.skeletonLoaderMethods.length,
    eventNames: plan.eventNames,
    nextWorkpackage: plan.nextWorkpackage,
    plan
  };
}

module.exports = {
  LOADER_API_METHODS,
  LOADER_DECLARATION_FILES,
  LOADER_EVENT_NAMES,
  LOADER_GLOBALS,
  LOADER_PACKAGE_EXPORTS,
  SKELETON_LOADER_METHODS,
  STYLE_REGISTRY_METHODS,
  TYPE_EXPORTS_LOADER_BACKLOG,
  TYPE_EXPORTS_LOADER_DOCS,
  TYPE_EXPORTS_LOADER_LOCAL_GATE,
  TYPE_EXPORTS_LOADER_MODULE,
  TYPE_EXPORTS_LOADER_PACKAGE_SCRIPT,
  TYPE_EXPORTS_LOADER_REPORT_ARTIFACT,
  TYPE_EXPORTS_LOADER_REPORT_SCHEMA,
  TYPE_EXPORTS_LOADER_SCHEMA,
  TYPE_EXPORTS_LOADER_STATUS,
  TYPE_EXPORTS_LOADER_SUITE,
  TYPE_EXPORTS_LOADER_TARGET,
  TYPE_EXPORTS_LOADER_WORKPACKAGE,
  TYPE_EXPORTS_LOADER_WORKPACKAGE_DOC,
  createTypeExportsLoaderPlan,
  createTypeExportsLoaderReport,
  validateTypeExportsLoaderPlan
};
