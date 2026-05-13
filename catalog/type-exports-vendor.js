const fs = require('fs');
const path = require('path');
const {
  TYPE_EXPORTS_BOUNDARY,
  TYPE_EXPORTS_DECLARATION_BOUNDARY,
  TYPE_EXPORTS_KERNEL_BOUNDARY,
  TYPE_EXPORTS_SCHEMA,
  createTypeExportsPlan
} = require('./type-exports');

const TYPE_EXPORTS_VENDOR_SCHEMA = 'xtend.type-exports.vendor-facades.v1';
const TYPE_EXPORTS_VENDOR_REPORT_SCHEMA = 'xtend.type-exports.vendor-facades-report.v1';
const TYPE_EXPORTS_VENDOR_WORKPACKAGE = 'WP-TypeExports-08';
const TYPE_EXPORTS_VENDOR_STATUS = 'accepted-vendor-utility-design-token-facades';
const TYPE_EXPORTS_VENDOR_TARGET = 'vendor-utility-design-token-facades-ready';
const TYPE_EXPORTS_VENDOR_MODULE = 'catalog/type-exports-vendor.js';
const TYPE_EXPORTS_VENDOR_SUITE = 'tests/types/vendor_type_exports_suite.js';
const TYPE_EXPORTS_VENDOR_DOCS = 'docs/xtend-vendor-types.md';
const TYPE_EXPORTS_VENDOR_BACKLOG = 'development/BACKLOG-XTend-TypeExports-und-Public-Declaration-Hardening.md';
const TYPE_EXPORTS_VENDOR_WORKPACKAGE_DOC = 'development/WP-TypeExports-08-Vendor-Utility-Facades-fuer-Prism-Turndown-und-Design-Tokens-ergaenzen.md';
const TYPE_EXPORTS_VENDOR_LOCAL_GATE = 'node scripts/run_xtend_tests.js type-exports-vendor --json';
const TYPE_EXPORTS_VENDOR_PACKAGE_SCRIPT = 'npm run test:type-exports-vendor';
const TYPE_EXPORTS_VENDOR_REPORT_ARTIFACT = '.xtend-test-results/xtend-type-exports-vendor-report.json';

const VENDOR_DECLARATION_FILES = Object.freeze([
  'components/prism.d.ts',
  'components/turndown.d.ts',
  'design-tokens/xtend-design-tokens.d.ts',
  'design-tokens/xtheme-token-alias-layer.d.ts'
]);

const VENDOR_RUNTIME_FILES = Object.freeze([
  'components/prism.js',
  'components/turndown.js',
  'design-tokens/xtend-design-tokens.js',
  'design-tokens/xtheme-token-alias-layer.js'
]);

const VENDOR_PACKAGE_EXPORTS = Object.freeze([
  './design-tokens',
  './design-tokens/xtheme-token-alias-layer'
]);

const VENDOR_WILDCARD_EXPORTS = Object.freeze([
  './components/*'
]);

const VENDOR_JSON_BOUNDARIES = Object.freeze([
  './design-tokens/themes/enterprise-light'
]);

const VENDOR_REPRESENTATIVE_DECLARATION_TOKENS = Object.freeze({
  'components/prism.d.ts': ['export = Prism', 'highlightElement', 'highlightAllUnder', 'TokenStream'],
  'components/turndown.d.ts': ['TurndownService', 'addRule', 'turndown(input', 'Window'],
  'design-tokens/xtend-design-tokens.d.ts': ['XtendDesignTokenContract', 'createXtendDesignTokenContract', 'validateXtendDesignTokenContract', 'XTEND_DESIGN_TOKEN_SCHEMA'],
  'design-tokens/xtheme-token-alias-layer.d.ts': ['XThemeTokenAliasLayer', 'createXThemeTokenAliasLayer', 'validateXThemeTokenAliasLayer', 'XTHEME_TOKEN_ALIAS_LAYER_SCHEMA']
});

const FORBIDDEN_VENDOR_DECLARATION_IMPORT_PATTERNS = Object.freeze([
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

const FORBIDDEN_VENDOR_INTERNAL_TOKENS = Object.freeze([
  'Prism.languages.abap',
  'Prism.languages.powershell',
  'Prism.languages.protobuf',
  'TurndownService.prototype',
  'nodeType ===',
  'renderNode('
]);

function getDefaultPackageManifest() {
  return require('../package.json');
}

function toRepoRelative(filePath) {
  return filePath ? filePath.replace(/^\.\//u, '') : null;
}

function fileExists(rootDir, relativePath) {
  return Boolean(relativePath) && !relativePath.includes('*') && fs.existsSync(path.join(rootDir, toRepoRelative(relativePath)));
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
  if (exportKey === './design-tokens') return './design-tokens/xtend-design-tokens.d.ts';
  if (exportKey === './design-tokens/xtheme-token-alias-layer') return './design-tokens/xtheme-token-alias-layer.d.ts';
  return null;
}

function resolveSourceForExport(exportKey) {
  if (exportKey === './design-tokens') return './design-tokens/xtend-design-tokens.js';
  if (exportKey === './design-tokens/xtheme-token-alias-layer') return './design-tokens/xtheme-token-alias-layer.js';
  return null;
}

function collectRuntimeExportNames(rootDir, sourcePath) {
  const source = readText(rootDir, sourcePath);
  const match = source.match(/module\.exports\s*=\s*[{]([\s\S]*?)\n[}];/u);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((line) => {
      const exportMatch = line.match(/^\s*([A-Za-z_$][\w$]*)\s*,?\s*(?:\/\/.*)?$/u);
      return exportMatch ? exportMatch[1] : null;
    })
    .filter(Boolean);
}

function declarationIncludesRuntimeName(source, name) {
  return source.includes(` ${name}:`)
    || source.includes(` ${name};`)
    || source.includes(` ${name}(`)
    || source.includes(`function ${name}`)
    || source.includes(`const ${name}`)
    || source.includes(` ${name}<`);
}

function getComponentDeclarationGaps(rootDir) {
  const componentDir = path.join(rootDir, 'components');
  return fs.readdirSync(componentDir)
    .filter((fileName) => fileName.endsWith('.js'))
    .filter((fileName) => !fs.existsSync(path.join(componentDir, fileName.replace(/\.js$/u, '.d.ts'))))
    .sort()
    .map((fileName) => `components/${fileName}`);
}

function createTypeExportsVendorPlan(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const packageManifest = options.packageManifest || getDefaultPackageManifest();
  const typeExportsPlan = options.typeExportsPlan || createTypeExportsPlan({ rootDir, packageManifest });
  const declarationFiles = VENDOR_DECLARATION_FILES.map((filePath) => ({
    filePath,
    exists: fileExists(rootDir, filePath),
    size: fileExists(rootDir, filePath) ? fs.statSync(path.join(rootDir, filePath)).size : 0,
    lineCount: readText(rootDir, filePath).split('\n').length
  }));
  const packageExportRecords = VENDOR_PACKAGE_EXPORTS.map((exportKey) => {
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
  const wildcardExportRecords = VENDOR_WILDCARD_EXPORTS.map((exportKey) => ({
    exportKey,
    target: packageManifest.exports && packageManifest.exports[exportKey],
    expectedTarget: './components/*',
    vendorDeclarations: ['components/prism.d.ts', 'components/turndown.d.ts']
  }));
  const jsonBoundaryRecords = VENDOR_JSON_BOUNDARIES.map((exportKey) => ({
    exportKey,
    target: packageManifest.exports && packageManifest.exports[exportKey],
    expectedTarget: './design-tokens/themes/enterprise-light.json',
    typesRequired: false,
    reason: 'json-theme-pack-boundary'
  }));
  const declarationImportLines = VENDOR_DECLARATION_FILES.flatMap((filePath) => {
    const source = readText(rootDir, filePath);
    return source.split('\n')
      .filter((line) => /\bfrom\s+['"]/u.test(line) || /\brequire\(/u.test(line))
      .map((line) => ({ filePath, line }));
  });
  const forbiddenDeclarationRuntimeImports = declarationImportLines
    .filter((entry) => FORBIDDEN_VENDOR_DECLARATION_IMPORT_PATTERNS.some((pattern) => entry.line.includes(pattern)))
    .map((entry) => `${entry.filePath}:${entry.line.trim()}`);
  const runtimeImportsDeclarationFiles = VENDOR_RUNTIME_FILES
    .filter((filePath) => readText(rootDir, filePath)
      .split('\n')
      .some((line) => (/^\s*import\b/u.test(line) || /\brequire\(/u.test(line)) && line.includes('.d.ts')));
  const designTokenDeclarationSource = readText(rootDir, 'design-tokens/xtend-design-tokens.d.ts');
  const missingDesignTokenRuntimeExportTokens = collectRuntimeExportNames(rootDir, 'design-tokens/xtend-design-tokens.js')
    .filter((name) => !declarationIncludesRuntimeName(designTokenDeclarationSource, name))
    .map((name) => `design-tokens/xtend-design-tokens.d.ts:${name}`);
  const missingRepresentativeDeclarationTokens = Object.entries(VENDOR_REPRESENTATIVE_DECLARATION_TOKENS).flatMap(([filePath, tokens]) => {
    const source = readText(rootDir, filePath);
    return tokens.filter((token) => !source.includes(token)).map((token) => `${filePath}:${token}`);
  });
  const forbiddenVendorInternalTokens = VENDOR_DECLARATION_FILES.flatMap((filePath) => {
    const source = readText(rootDir, filePath);
    return FORBIDDEN_VENDOR_INTERNAL_TOKENS
      .filter((token) => source.includes(token))
      .map((token) => `${filePath}:${token}`);
  });
  const largeVendorDeclarations = declarationFiles
    .filter((entry) => entry.lineCount > 140)
    .map((entry) => `${entry.filePath}:${entry.lineCount}`);
  const typeExportClassifications = typeExportsPlan.classifications || [];
  const typeExportsMissingDeclarations = VENDOR_PACKAGE_EXPORTS.filter((exportKey) => {
    const classification = typeExportClassifications.find((entry) => entry.exportKey === exportKey);
    return !classification || classification.declarationExists !== true || classification.typeDecision !== 'declaration-ready';
  });

  return {
    schema: TYPE_EXPORTS_VENDOR_SCHEMA,
    reportSchema: TYPE_EXPORTS_VENDOR_REPORT_SCHEMA,
    sourceTypeExportsSchema: TYPE_EXPORTS_SCHEMA,
    workpackage: TYPE_EXPORTS_VENDOR_WORKPACKAGE,
    status: TYPE_EXPORTS_VENDOR_STATUS,
    targetReadiness: TYPE_EXPORTS_VENDOR_TARGET,
    generatedAt: options.generatedAt || 'static-local',
    module: TYPE_EXPORTS_VENDOR_MODULE,
    suite: TYPE_EXPORTS_VENDOR_SUITE,
    docs: TYPE_EXPORTS_VENDOR_DOCS,
    backlog: TYPE_EXPORTS_VENDOR_BACKLOG,
    workpackageDocument: TYPE_EXPORTS_VENDOR_WORKPACKAGE_DOC,
    localGate: TYPE_EXPORTS_VENDOR_LOCAL_GATE,
    packageScript: TYPE_EXPORTS_VENDOR_PACKAGE_SCRIPT,
    reportArtifact: TYPE_EXPORTS_VENDOR_REPORT_ARTIFACT,
    boundaries: [
      TYPE_EXPORTS_BOUNDARY,
      TYPE_EXPORTS_KERNEL_BOUNDARY,
      TYPE_EXPORTS_DECLARATION_BOUNDARY
    ],
    declarationFiles,
    runtimeFiles: VENDOR_RUNTIME_FILES.slice(),
    packageExports: VENDOR_PACKAGE_EXPORTS.slice(),
    wildcardExports: wildcardExportRecords,
    jsonBoundaries: jsonBoundaryRecords,
    representativeDeclarationTokens: JSON.parse(JSON.stringify(VENDOR_REPRESENTATIVE_DECLARATION_TOKENS)),
    packageExportRecords,
    missingPackageExports: VENDOR_PACKAGE_EXPORTS.filter((exportKey) => !packageManifest.exports || !packageManifest.exports[exportKey]),
    missingTypesConditions: packageExportRecords.filter((record) => !record.actualTypes).map((record) => record.exportKey),
    mismatchedTypesConditions: packageExportRecords.filter((record) => record.actualTypes && !record.hasTypesCondition).map((record) => `${record.exportKey}:${record.actualTypes}`),
    missingRuntimeTargets: packageExportRecords.filter((record) => !record.runtimeTarget || !record.runtimeTargetMatches).map((record) => record.exportKey),
    missingDeclarationFiles: declarationFiles.filter((entry) => !entry.exists).map((entry) => entry.filePath),
    missingRepresentativeDeclarationTokens,
    missingRuntimeExportTokens: missingDesignTokenRuntimeExportTokens,
    componentDeclarationGaps: getComponentDeclarationGaps(rootDir),
    forbiddenDeclarationRuntimeImports,
    runtimeImportsDeclarationFiles,
    forbiddenVendorInternalTokens,
    largeVendorDeclarations,
    typeExportsMissingDeclarations,
    runtimeChanged: false,
    nextWorkpackage: 'WP-TypeExports-09'
  };
}

function validateTypeExportsVendorPlan(plan = createTypeExportsVendorPlan()) {
  const errors = [];

  if (!plan || plan.schema !== TYPE_EXPORTS_VENDOR_SCHEMA) errors.push(`schema must be ${TYPE_EXPORTS_VENDOR_SCHEMA}`);
  if (!plan || plan.reportSchema !== TYPE_EXPORTS_VENDOR_REPORT_SCHEMA) errors.push(`reportSchema must be ${TYPE_EXPORTS_VENDOR_REPORT_SCHEMA}`);
  if (!plan || plan.sourceTypeExportsSchema !== TYPE_EXPORTS_SCHEMA) errors.push(`sourceTypeExportsSchema must be ${TYPE_EXPORTS_SCHEMA}`);
  if (!plan || plan.workpackage !== TYPE_EXPORTS_VENDOR_WORKPACKAGE) errors.push(`workpackage must be ${TYPE_EXPORTS_VENDOR_WORKPACKAGE}`);
  if (!plan || plan.status !== TYPE_EXPORTS_VENDOR_STATUS) errors.push(`status must be ${TYPE_EXPORTS_VENDOR_STATUS}`);
  if (!plan || plan.targetReadiness !== TYPE_EXPORTS_VENDOR_TARGET) errors.push(`targetReadiness must be ${TYPE_EXPORTS_VENDOR_TARGET}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_BOUNDARY}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_KERNEL_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_KERNEL_BOUNDARY}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_DECLARATION_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_DECLARATION_BOUNDARY}`);
  if (!plan || plan.declarationFiles.length !== VENDOR_DECLARATION_FILES.length) errors.push('Vendor declaration file count changed');
  if (!plan || plan.missingPackageExports.length > 0) errors.push(`missing Vendor package exports: ${plan ? plan.missingPackageExports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingTypesConditions.length > 0) errors.push(`missing Vendor types conditions: ${plan ? plan.missingTypesConditions.join(', ') : '<plan missing>'}`);
  if (!plan || plan.mismatchedTypesConditions.length > 0) errors.push(`mismatched Vendor types conditions: ${plan ? plan.mismatchedTypesConditions.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeTargets.length > 0) errors.push(`mismatched Vendor runtime targets: ${plan ? plan.missingRuntimeTargets.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingDeclarationFiles.length > 0) errors.push(`missing Vendor declaration files: ${plan ? plan.missingDeclarationFiles.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRepresentativeDeclarationTokens.length > 0) errors.push(`missing Vendor declaration tokens: ${plan ? plan.missingRepresentativeDeclarationTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeExportTokens.length > 0) errors.push(`Vendor declaration files miss runtime exports: ${plan ? plan.missingRuntimeExportTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.componentDeclarationGaps.length > 0) errors.push(`component JS files without declarations: ${plan ? plan.componentDeclarationGaps.join(', ') : '<plan missing>'}`);
  if (!plan || plan.forbiddenDeclarationRuntimeImports.length > 0) errors.push(`Vendor declarations import forbidden runtime surfaces: ${plan ? plan.forbiddenDeclarationRuntimeImports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.runtimeImportsDeclarationFiles.length > 0) errors.push(`Vendor runtime imports declaration files: ${plan ? plan.runtimeImportsDeclarationFiles.join(', ') : '<plan missing>'}`);
  if (!plan || plan.forbiddenVendorInternalTokens.length > 0) errors.push(`Vendor declarations copy internal implementation tokens: ${plan ? plan.forbiddenVendorInternalTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.largeVendorDeclarations.length > 0) errors.push(`Vendor declarations are too broad: ${plan ? plan.largeVendorDeclarations.join(', ') : '<plan missing>'}`);
  if (!plan || plan.typeExportsMissingDeclarations.length > 0) errors.push(`TypeExports does not see Vendor declarations: ${plan ? plan.typeExportsMissingDeclarations.join(', ') : '<plan missing>'}`);
  if (!plan || !Array.isArray(plan.jsonBoundaries) || !plan.jsonBoundaries.every((entry) => entry.typesRequired === false)) errors.push('Theme JSON boundaries must remain types-not-required');
  if (!plan || plan.runtimeChanged !== false) errors.push('Vendor TypeExports WP must not change runtime code');
  if (!plan || plan.nextWorkpackage !== 'WP-TypeExports-09') errors.push('Vendor TypeExports must hand off to WP-TypeExports-09');

  return {
    schema: TYPE_EXPORTS_VENDOR_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createTypeExportsVendorReport(options = {}) {
  const plan = options.plan || createTypeExportsVendorPlan(options);
  const validation = validateTypeExportsVendorPlan(plan);

  return {
    schema: TYPE_EXPORTS_VENDOR_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    declarationFileCount: plan.declarationFiles.length,
    packageExportCount: plan.packageExports.length,
    componentDeclarationGapCount: plan.componentDeclarationGaps.length,
    nextWorkpackage: plan.nextWorkpackage,
    plan
  };
}

module.exports = {
  TYPE_EXPORTS_VENDOR_BACKLOG,
  TYPE_EXPORTS_VENDOR_DOCS,
  TYPE_EXPORTS_VENDOR_LOCAL_GATE,
  TYPE_EXPORTS_VENDOR_MODULE,
  TYPE_EXPORTS_VENDOR_PACKAGE_SCRIPT,
  TYPE_EXPORTS_VENDOR_REPORT_ARTIFACT,
  TYPE_EXPORTS_VENDOR_REPORT_SCHEMA,
  TYPE_EXPORTS_VENDOR_SCHEMA,
  TYPE_EXPORTS_VENDOR_STATUS,
  TYPE_EXPORTS_VENDOR_SUITE,
  TYPE_EXPORTS_VENDOR_TARGET,
  TYPE_EXPORTS_VENDOR_WORKPACKAGE,
  TYPE_EXPORTS_VENDOR_WORKPACKAGE_DOC,
  VENDOR_DECLARATION_FILES,
  VENDOR_JSON_BOUNDARIES,
  VENDOR_PACKAGE_EXPORTS,
  VENDOR_REPRESENTATIVE_DECLARATION_TOKENS,
  VENDOR_RUNTIME_FILES,
  VENDOR_WILDCARD_EXPORTS,
  createTypeExportsVendorPlan,
  createTypeExportsVendorReport,
  resolveDeclarationForExport,
  resolveSourceForExport,
  validateTypeExportsVendorPlan
};
