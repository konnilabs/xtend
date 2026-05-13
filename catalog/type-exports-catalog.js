const fs = require('fs');
const path = require('path');
const {
  TYPE_EXPORTS_BOUNDARY,
  TYPE_EXPORTS_DECLARATION_BOUNDARY,
  TYPE_EXPORTS_KERNEL_BOUNDARY,
  TYPE_EXPORTS_SCHEMA,
  createTypeExportsPlan
} = require('./type-exports');

const TYPE_EXPORTS_CATALOG_SCHEMA = 'xtend.type-exports.catalog-declarations.v1';
const TYPE_EXPORTS_CATALOG_REPORT_SCHEMA = 'xtend.type-exports.catalog-declarations-report.v1';
const TYPE_EXPORTS_CATALOG_WORKPACKAGE = 'WP-TypeExports-07';
const TYPE_EXPORTS_CATALOG_STATUS = 'accepted-catalog-plan-report-declaration-pattern';
const TYPE_EXPORTS_CATALOG_TARGET = 'catalog-plan-report-types-ready';
const TYPE_EXPORTS_CATALOG_MODULE = 'catalog/type-exports-catalog.js';
const TYPE_EXPORTS_CATALOG_SUITE = 'tests/types/catalog_type_exports_suite.js';
const TYPE_EXPORTS_CATALOG_DOCS = 'docs/xtend-catalog-types.md';
const TYPE_EXPORTS_CATALOG_BACKLOG = 'development/BACKLOG-XTend-TypeExports-und-Public-Declaration-Hardening.md';
const TYPE_EXPORTS_CATALOG_WORKPACKAGE_DOC = 'development/WP-TypeExports-07-Catalog-Declaration-Pattern-fuer-Plan-und-Report-Module-einfuehren.md';
const TYPE_EXPORTS_CATALOG_LOCAL_GATE = 'node scripts/run_xtend_tests.js type-exports-catalog --json';
const TYPE_EXPORTS_CATALOG_PACKAGE_SCRIPT = 'npm run test:type-exports-catalog';
const TYPE_EXPORTS_CATALOG_REPORT_ARTIFACT = '.xtend-test-results/xtend-type-exports-catalog-report.json';
const CATALOG_SHARED_DECLARATION_FILE = 'catalog/catalog-public-types.d.ts';

const CATALOG_PACKAGE_EXPORTS = Object.freeze([
  './catalog/component-catalog-coverage',
  './catalog/component-regression-priority',
  './catalog/component-long-tail-migration',
  './catalog/epic11-enterprise-ux-handoff',
  './catalog/epic10-p0-component-wave',
  './catalog/epic10-existing-component-metadata',
  './catalog/epic10-platform-gates',
  './catalog/epic10-release-handoff',
  './catalog/epic12-rc0-gate-matrix',
  './catalog/epic12-docs-adoption',
  './catalog/epic12-rc0-handoff',
  './catalog/epic13-rc1-readiness',
  './catalog/epic13-release-owner-acceptance',
  './catalog/epic13-conditional-network-evidence',
  './catalog/epic13-package-export-lock',
  './catalog/epic13-known-residual-triage',
  './catalog/epic13-hydration-performance-closure',
  './catalog/epic13-prod-browser-csp-smoke',
  './catalog/epic13-visual-owner-artifact',
  './catalog/epic13-rmt-production-readiness',
  './catalog/epic13-docs-rmt-production-hardening',
  './catalog/epic13-trusted-dom-boundary',
  './catalog/epic13-rc1-migration-notes',
  './catalog/epic14-rmt-tooling',
  './catalog/epic14-lsp-handoff'
]);

const CATALOG_SHARED_TYPE_TOKENS = Object.freeze([
  'XtendCatalogPlan',
  'XtendCatalogReport',
  'XtendCatalogGate',
  'XtendCatalogFactory',
  'XtendCatalogValidator',
  'XtendCatalogDiagnostic'
]);

const CATALOG_REPRESENTATIVE_DECLARATION_TOKENS = Object.freeze({
  'catalog/catalog-public-types.d.ts': ['XtendCatalogPlan', 'XtendCatalogReport', 'XtendCatalogFactory', 'XtendCatalogValidator'],
  'catalog/component-catalog-coverage.d.ts': ['createComponentCatalogCoverageReport', 'validateComponentCatalogCoverageReport'],
  'catalog/epic13-package-export-lock.d.ts': ['createEpic13PackageExportLockPlan', 'createEpic13PackageExportLockReport', 'EXPECTED_EXPORT_KEYS'],
  'catalog/epic14-rmt-tooling.d.ts': ['createEpic14RmtToolingGatePlan', 'createEpic14RmtToolingGateReport', 'validateEpic14RmtToolingGatePlan'],
  'catalog/surface-manager-runtime-release-handoff.d.ts': ['createSurfaceManagerRuntimeReleaseHandoffPlan', 'createSurfaceManagerRuntimeReleaseHandoffReport', 'validateSurfaceManagerRuntimeReleaseHandoffPlan']
});

const FORBIDDEN_CATALOG_DECLARATION_IMPORT_PATTERNS = Object.freeze([
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
  return `${exportKey}.d.ts`;
}

function resolveSourceForExport(exportKey) {
  return `${exportKey}.js`;
}

function resolveDeclarationForSource(sourcePath) {
  return sourcePath.replace(/\.js$/u, '.d.ts');
}

function getCatalogSourceModules(rootDir) {
  const catalogDir = path.join(rootDir, 'catalog');
  return fs.readdirSync(catalogDir)
    .filter((fileName) => fileName.endsWith('.js'))
    .filter((fileName) => !fileName.startsWith('type-exports'))
    .sort()
    .map((fileName) => `catalog/${fileName}`);
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

function classifyCatalogModule(sourcePath, packageExports = CATALOG_PACKAGE_EXPORTS) {
  const fileName = path.basename(sourcePath, '.js');
  const exportKey = `./${sourcePath.replace(/\.js$/u, '')}`;
  const traits = [];
  let family = 'component-catalog';

  if (fileName.startsWith('surface-manager-')) {
    family = 'surface-manager-catalog';
    traits.push('surface-manager');
  } else if (fileName.startsWith('epic')) {
    family = 'epic-catalog';
    traits.push('epic');
  }

  if (/(release|handoff|readiness|package-export-lock|owner-acceptance|migration-notes|known-residual|conditional-network|hydration-performance|prod-browser-csp|visual-owner|rmt-production|trusted-dom)/u.test(fileName)) {
    traits.push('release');
  }
  if (fileName.startsWith('component-')) traits.push('component');
  if (packageExports.includes(exportKey)) traits.push('package-export');
  if (!packageExports.includes(exportKey)) traits.push('internal');

  return {
    sourcePath,
    declarationPath: resolveDeclarationForSource(sourcePath),
    exportKey,
    family,
    traits
  };
}

function createTypeExportsCatalogPlan(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const packageManifest = options.packageManifest || getDefaultPackageManifest();
  const typeExportsPlan = options.typeExportsPlan || createTypeExportsPlan({ rootDir, packageManifest });
  const sourceModules = getCatalogSourceModules(rootDir);
  const catalogFamilies = sourceModules.map((sourcePath) => classifyCatalogModule(sourcePath));
  const declarationFiles = [
    CATALOG_SHARED_DECLARATION_FILE,
    ...sourceModules.map(resolveDeclarationForSource)
  ].map((filePath) => ({
    filePath,
    exists: fileExists(rootDir, filePath),
    size: fileExists(rootDir, filePath) ? fs.statSync(path.join(rootDir, filePath)).size : 0
  }));
  const sharedTypesSource = readText(rootDir, CATALOG_SHARED_DECLARATION_FILE);
  const exportRecords = CATALOG_PACKAGE_EXPORTS.map((exportKey) => {
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
  const declarationImportLines = declarationFiles.flatMap((entry) => {
    const source = readText(rootDir, entry.filePath);
    return source.split('\n')
      .filter((line) => /\bfrom\s+['"]/u.test(line) || /\brequire\(/u.test(line))
      .map((line) => ({ filePath: entry.filePath, line }));
  });
  const forbiddenDeclarationRuntimeImports = declarationImportLines
    .filter((entry) => FORBIDDEN_CATALOG_DECLARATION_IMPORT_PATTERNS.some((pattern) => entry.line.includes(pattern)))
    .map((entry) => `${entry.filePath}:${entry.line.trim()}`);
  const runtimeImportsDeclarationFiles = sourceModules
    .filter((filePath) => readText(rootDir, filePath)
      .split('\n')
      .some((line) => (/^\s*import\b/u.test(line) || /\brequire\(/u.test(line)) && line.includes('.d.ts')));
  const missingRuntimeExportTokens = sourceModules.flatMap((sourcePath) => {
    const declarationPath = resolveDeclarationForSource(sourcePath);
    const declarationSource = readText(rootDir, declarationPath);
    return collectRuntimeExportNames(rootDir, sourcePath)
      .filter((name) => !declarationIncludesRuntimeName(declarationSource, name))
      .map((name) => `${declarationPath}:${name}`);
  });
  const typeExportClassifications = typeExportsPlan.classifications || [];
  const typeExportsMissingDeclarations = CATALOG_PACKAGE_EXPORTS.filter((exportKey) => {
    const classification = typeExportClassifications.find((entry) => entry.exportKey === exportKey);
    return !classification || classification.declarationExists !== true || classification.typeDecision !== 'declaration-ready';
  });
  const familyCounts = catalogFamilies.reduce((counts, entry) => {
    counts[entry.family] = (counts[entry.family] || 0) + 1;
    entry.traits.forEach((trait) => {
      counts[trait] = (counts[trait] || 0) + 1;
    });
    return counts;
  }, {});

  return {
    schema: TYPE_EXPORTS_CATALOG_SCHEMA,
    reportSchema: TYPE_EXPORTS_CATALOG_REPORT_SCHEMA,
    sourceTypeExportsSchema: TYPE_EXPORTS_SCHEMA,
    workpackage: TYPE_EXPORTS_CATALOG_WORKPACKAGE,
    status: TYPE_EXPORTS_CATALOG_STATUS,
    targetReadiness: TYPE_EXPORTS_CATALOG_TARGET,
    generatedAt: options.generatedAt || 'static-local',
    module: TYPE_EXPORTS_CATALOG_MODULE,
    suite: TYPE_EXPORTS_CATALOG_SUITE,
    docs: TYPE_EXPORTS_CATALOG_DOCS,
    backlog: TYPE_EXPORTS_CATALOG_BACKLOG,
    workpackageDocument: TYPE_EXPORTS_CATALOG_WORKPACKAGE_DOC,
    localGate: TYPE_EXPORTS_CATALOG_LOCAL_GATE,
    packageScript: TYPE_EXPORTS_CATALOG_PACKAGE_SCRIPT,
    reportArtifact: TYPE_EXPORTS_CATALOG_REPORT_ARTIFACT,
    boundaries: [
      TYPE_EXPORTS_BOUNDARY,
      TYPE_EXPORTS_KERNEL_BOUNDARY,
      TYPE_EXPORTS_DECLARATION_BOUNDARY
    ],
    packageExports: CATALOG_PACKAGE_EXPORTS.slice(),
    sourceModules,
    catalogFamilies,
    familyCounts,
    declarationFiles,
    sharedDeclarationFile: CATALOG_SHARED_DECLARATION_FILE,
    sharedTypeTokens: CATALOG_SHARED_TYPE_TOKENS.slice(),
    representativeDeclarationTokens: JSON.parse(JSON.stringify(CATALOG_REPRESENTATIVE_DECLARATION_TOKENS)),
    exportRecords,
    missingPackageExports: CATALOG_PACKAGE_EXPORTS.filter((exportKey) => !packageManifest.exports || !packageManifest.exports[exportKey]),
    missingTypesConditions: exportRecords.filter((record) => !record.actualTypes).map((record) => record.exportKey),
    mismatchedTypesConditions: exportRecords.filter((record) => record.actualTypes && !record.hasTypesCondition).map((record) => `${record.exportKey}:${record.actualTypes}`),
    missingRuntimeTargets: exportRecords.filter((record) => !record.runtimeTarget || !record.runtimeTargetMatches).map((record) => record.exportKey),
    missingDeclarationFiles: declarationFiles.filter((entry) => !entry.exists).map((entry) => entry.filePath),
    missingSharedTypeTokens: CATALOG_SHARED_TYPE_TOKENS.filter((token) => !sharedTypesSource.includes(token)),
    missingRepresentativeDeclarationTokens: Object.entries(CATALOG_REPRESENTATIVE_DECLARATION_TOKENS).flatMap(([filePath, tokens]) => {
      const source = readText(rootDir, filePath);
      return tokens.filter((token) => !source.includes(token)).map((token) => `${filePath}:${token}`);
    }),
    missingRuntimeExportTokens,
    forbiddenDeclarationRuntimeImports,
    runtimeImportsDeclarationFiles,
    typeExportsMissingDeclarations,
    runtimeChanged: false,
    nextWorkpackage: 'WP-TypeExports-08'
  };
}

function validateTypeExportsCatalogPlan(plan = createTypeExportsCatalogPlan()) {
  const errors = [];

  if (!plan || plan.schema !== TYPE_EXPORTS_CATALOG_SCHEMA) errors.push(`schema must be ${TYPE_EXPORTS_CATALOG_SCHEMA}`);
  if (!plan || plan.reportSchema !== TYPE_EXPORTS_CATALOG_REPORT_SCHEMA) errors.push(`reportSchema must be ${TYPE_EXPORTS_CATALOG_REPORT_SCHEMA}`);
  if (!plan || plan.sourceTypeExportsSchema !== TYPE_EXPORTS_SCHEMA) errors.push(`sourceTypeExportsSchema must be ${TYPE_EXPORTS_SCHEMA}`);
  if (!plan || plan.workpackage !== TYPE_EXPORTS_CATALOG_WORKPACKAGE) errors.push(`workpackage must be ${TYPE_EXPORTS_CATALOG_WORKPACKAGE}`);
  if (!plan || plan.status !== TYPE_EXPORTS_CATALOG_STATUS) errors.push(`status must be ${TYPE_EXPORTS_CATALOG_STATUS}`);
  if (!plan || plan.targetReadiness !== TYPE_EXPORTS_CATALOG_TARGET) errors.push(`targetReadiness must be ${TYPE_EXPORTS_CATALOG_TARGET}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_BOUNDARY}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_KERNEL_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_KERNEL_BOUNDARY}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_DECLARATION_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_DECLARATION_BOUNDARY}`);
  if (!plan || plan.packageExports.length !== CATALOG_PACKAGE_EXPORTS.length) errors.push('Catalog package export count changed');
  if (!plan || plan.sourceModules.length < CATALOG_PACKAGE_EXPORTS.length) errors.push('Catalog source module count is smaller than package export count');
  if (!plan || !plan.familyCounts || (plan.familyCounts['surface-manager-catalog'] || 0) < 1) errors.push('Catalog families must include SurfaceManager catalogs');
  if (!plan || !plan.familyCounts || (plan.familyCounts['epic-catalog'] || 0) < 1) errors.push('Catalog families must include Epic catalogs');
  if (!plan || !plan.familyCounts || (plan.familyCounts.release || 0) < 1) errors.push('Catalog families must include release catalogs');
  if (!plan || plan.missingPackageExports.length > 0) errors.push(`missing Catalog package exports: ${plan ? plan.missingPackageExports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingTypesConditions.length > 0) errors.push(`missing Catalog types conditions: ${plan ? plan.missingTypesConditions.join(', ') : '<plan missing>'}`);
  if (!plan || plan.mismatchedTypesConditions.length > 0) errors.push(`mismatched Catalog types conditions: ${plan ? plan.mismatchedTypesConditions.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeTargets.length > 0) errors.push(`mismatched Catalog runtime targets: ${plan ? plan.missingRuntimeTargets.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingDeclarationFiles.length > 0) errors.push(`missing Catalog declaration files: ${plan ? plan.missingDeclarationFiles.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingSharedTypeTokens.length > 0) errors.push(`missing shared Catalog type tokens: ${plan ? plan.missingSharedTypeTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRepresentativeDeclarationTokens.length > 0) errors.push(`missing representative Catalog declaration tokens: ${plan ? plan.missingRepresentativeDeclarationTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeExportTokens.length > 0) errors.push(`Catalog declaration files miss runtime exports: ${plan ? plan.missingRuntimeExportTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.forbiddenDeclarationRuntimeImports.length > 0) errors.push(`Catalog declaration files import forbidden runtime surfaces: ${plan ? plan.forbiddenDeclarationRuntimeImports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.runtimeImportsDeclarationFiles.length > 0) errors.push(`Catalog runtime imports declaration files: ${plan ? plan.runtimeImportsDeclarationFiles.join(', ') : '<plan missing>'}`);
  if (!plan || plan.typeExportsMissingDeclarations.length > 0) errors.push(`TypeExports does not see Catalog declarations: ${plan ? plan.typeExportsMissingDeclarations.join(', ') : '<plan missing>'}`);
  if (!plan || plan.runtimeChanged !== false) errors.push('Catalog TypeExports WP must not change runtime code');
  if (!plan || plan.nextWorkpackage !== 'WP-TypeExports-08') errors.push('Catalog TypeExports must hand off to WP-TypeExports-08');

  return {
    schema: TYPE_EXPORTS_CATALOG_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createTypeExportsCatalogReport(options = {}) {
  const plan = options.plan || createTypeExportsCatalogPlan(options);
  const validation = validateTypeExportsCatalogPlan(plan);

  return {
    schema: TYPE_EXPORTS_CATALOG_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    packageExportCount: plan.packageExports.length,
    declarationFileCount: plan.declarationFiles.length,
    sourceModuleCount: plan.sourceModules.length,
    familyCounts: plan.familyCounts,
    nextWorkpackage: plan.nextWorkpackage,
    plan
  };
}

module.exports = {
  CATALOG_PACKAGE_EXPORTS,
  CATALOG_REPRESENTATIVE_DECLARATION_TOKENS,
  CATALOG_SHARED_DECLARATION_FILE,
  CATALOG_SHARED_TYPE_TOKENS,
  TYPE_EXPORTS_CATALOG_BACKLOG,
  TYPE_EXPORTS_CATALOG_DOCS,
  TYPE_EXPORTS_CATALOG_LOCAL_GATE,
  TYPE_EXPORTS_CATALOG_MODULE,
  TYPE_EXPORTS_CATALOG_PACKAGE_SCRIPT,
  TYPE_EXPORTS_CATALOG_REPORT_ARTIFACT,
  TYPE_EXPORTS_CATALOG_REPORT_SCHEMA,
  TYPE_EXPORTS_CATALOG_SCHEMA,
  TYPE_EXPORTS_CATALOG_STATUS,
  TYPE_EXPORTS_CATALOG_SUITE,
  TYPE_EXPORTS_CATALOG_TARGET,
  TYPE_EXPORTS_CATALOG_WORKPACKAGE,
  TYPE_EXPORTS_CATALOG_WORKPACKAGE_DOC,
  classifyCatalogModule,
  collectRuntimeExportNames,
  createTypeExportsCatalogPlan,
  createTypeExportsCatalogReport,
  resolveDeclarationForExport,
  validateTypeExportsCatalogPlan
};
