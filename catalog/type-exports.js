const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
  EXPECTED_EXPORT_KEYS
} = require('./epic13-package-export-lock');

const TYPE_EXPORTS_SCHEMA = 'xtend.type-exports.plan.v1';
const TYPE_EXPORTS_REPORT_SCHEMA = 'xtend.type-exports.report.v1';
const TYPE_EXPORTS_CLASSIFICATION_SCHEMA = 'xtend.type-exports.export-classification.v1';
const TYPE_EXPORTS_WORKPACKAGE = 'WP-TypeExports-01';
const TYPE_EXPORTS_STATUS = 'accepted-public-package-entrypoint-type-classification';
const TYPE_EXPORTS_TARGET = 'typed-public-package-surface-classified';
const TYPE_EXPORTS_MODULE = 'catalog/type-exports.js';
const TYPE_EXPORTS_SUITE = 'tests/types/type_exports_suite.js';
const TYPE_EXPORTS_DOCS = 'docs/type-exports.md';
const TYPE_EXPORTS_BACKLOG = 'development/BACKLOG-XTend-TypeExports-und-Public-Declaration-Hardening.md';
const TYPE_EXPORTS_WORKPACKAGE_DOC = 'development/WP-TypeExports-01-Public-Package-Entry-Points-und-types-Conditions-haerten.md';
const TYPE_EXPORTS_LOCAL_GATE = 'node scripts/run_xtend_tests.js type-exports --json';
const TYPE_EXPORTS_PACKAGE_SCRIPT = 'npm run test:type-exports';
const TYPE_EXPORTS_REPORT_ARTIFACT = '.xtend-test-results/xtend-type-exports-report.json';
const TYPE_EXPORTS_BOUNDARY = 'types-only-no-runtime-imports';
const TYPE_EXPORTS_KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const TYPE_EXPORTS_DECLARATION_BOUNDARY = 'declarations-follow-js-runtime-surface';
const TYPE_EXPORTS_DRIFT_REPORT_SCHEMA = 'xtend.type-exports.drift-report.v1';
const TYPE_EXPORTS_RELEASE_WORKPACKAGE = 'WP-TypeExports-09';
const TYPE_EXPORTS_RELEASE_STATUS = 'accepted-productive-type-exports-release-gate';
const TYPE_EXPORTS_RELEASE_TARGET = 'productive-type-exports-release-gate-ready';
const TYPE_EXPORTS_RELEASE_PACKAGE_SCRIPT = 'npm run test:type-exports:release';
const TYPE_EXPORTS_RELEASE_LOCAL_GATE = 'node scripts/run_xtend_tests.js type-exports type-exports-loader type-exports-api type-exports-rmt type-exports-policy type-exports-builder type-exports-catalog type-exports-vendor --report .xtend-test-results/xtend-type-exports-report.json';
const TYPE_EXPORTS_LOCKED_EXPORT_COUNT = 149;
const TYPE_EXPORTS_LOCKED_EXPORT_FINGERPRINT = '3b56f77f9f32b43c04dc3485a5a45a85fa146051676ea9fdbc0bfe0f62def7e9';

const TYPE_EXPORTS_COMPLETED_WORKPACKAGES = Object.freeze([
  'WP-TypeExports-01',
  'WP-TypeExports-02',
  'WP-TypeExports-03',
  'WP-TypeExports-04',
  'WP-TypeExports-05',
  'WP-TypeExports-06',
  'WP-TypeExports-07',
  'WP-TypeExports-08',
  TYPE_EXPORTS_RELEASE_WORKPACKAGE
]);

const TYPE_EXPORTS_RELEASE_GATE_SCRIPTS = Object.freeze([
  TYPE_EXPORTS_PACKAGE_SCRIPT,
  'npm run test:type-exports-loader',
  'npm run test:type-exports-api',
  'npm run test:type-exports-rmt',
  'npm run test:type-exports-policy',
  'npm run test:type-exports-builder',
  'npm run test:type-exports-catalog',
  'npm run test:type-exports-vendor',
  TYPE_EXPORTS_RELEASE_PACKAGE_SCRIPT
]);

const TYPE_EXPORTS_RELEASE_REPORT_ARTIFACTS = Object.freeze([
  TYPE_EXPORTS_REPORT_ARTIFACT,
  '.xtend-test-results/xtend-type-exports-loader-report.json',
  '.xtend-test-results/xtend-type-exports-api-report.json',
  '.xtend-test-results/xtend-type-exports-rmt-report.json',
  '.xtend-test-results/xtend-type-exports-policy-report.json',
  '.xtend-test-results/xtend-type-exports-builder-report.json',
  '.xtend-test-results/xtend-type-exports-catalog-report.json',
  '.xtend-test-results/xtend-type-exports-vendor-report.json'
]);

const TYPE_EXPORTS_RELEASE_DOCS = Object.freeze([
  TYPE_EXPORTS_DOCS,
  'docs/public-component-types.md',
  'docs/typescript-components.md',
  'docs/package-export-lock.md'
]);

const ASSET_EXPORTS = Object.freeze([
  './style.css',
  './manifest',
  './components/manifest.json',
  './design-tokens/themes/enterprise-light',
  './package.json'
]);

const TYPE_EXPORT_GROUPS = Object.freeze([
  {
    id: 'loader',
    priority: 'P0',
    workpackage: 'WP-TypeExports-02',
    exports: ['.', './loader', './legacy-loader'],
    strategy: 'loader-global-and-boot-api-declaration'
  },
  {
    id: 'core-api',
    priority: 'P0',
    workpackage: 'WP-TypeExports-03',
    exports: ['./api'],
    strategy: 'window-xtend-api-declaration'
  },
  {
    id: 'components',
    priority: 'P0',
    workpackage: 'ER-WP-34',
    exports: ['./components/*'],
    prefix: './components',
    strategy: 'component-wildcard-declaration'
  },
  {
    id: 'xcommand',
    priority: 'P0',
    workpackage: 'WP-XCommand-01',
    exports: ['./xcommand'],
    strategy: 'xcommand-kernel-declaration-pack'
  },
  {
    id: 'maraca',
    priority: 'P1',
    workpackage: 'WP-Maraca-01',
    exports: ['./maraca', './maraca/runtime'],
    strategy: 'maraca-package-declaration-pack'
  },
  {
    id: 'xsurface-shard',
    priority: 'P1',
    workpackage: 'WP-XSurfaceShard-01',
    exports: ['./xsurface-shard'],
    strategy: 'xsurface-shard-server-orchestration-declaration-pack'
  },
  {
    id: 'assets',
    priority: 'P0',
    workpackage: TYPE_EXPORTS_WORKPACKAGE,
    exports: ASSET_EXPORTS.slice(),
    strategy: 'types-not-required-for-non-js-assets'
  },
  {
    id: 'rmt-runtime',
    priority: 'P1',
    workpackage: 'WP-TypeExports-04',
    exports: ['./rmt', './rmt/browser', './rmt/dom-descriptor-renderer', './rmt/component-capability-registry', './rmt/state-selector-runtime', './rmt/action-effect-runtime', './rmt/event-routing-runtime', './rmt/form-validation-runtime', './rmt/surface-transition-runtime', './rmt/surface-resource-graph-runtime', './rmt/kernel-orchestration-controller', './rmt/native-shell-runtime', './rmt/node-ssr-adapter'],
    strategy: 'runtime-types-condition-to-rmt-core'
  },
  {
    id: 'rmt-tooling',
    priority: 'P1',
    workpackage: 'WP-TypeExports-04',
    prefixes: ['./rmt-language-server', './rmt-linter', './rmt-editor'],
    strategy: 'rmt-tooling-declaration-pack'
  },
  {
    id: 'rmt-language',
    priority: 'P1',
    workpackage: 'WP-TypeExports-04',
    prefix: './rmt-language',
    strategy: 'rmt-language-declaration-pack'
  },
  {
    id: 'xtensions',
    priority: 'P1',
    workpackage: 'WP-TypeExports-04',
    prefix: './xtensions',
    strategy: 'xtensions-runtime-contract-declaration-pack'
  },
  {
    id: 'fabric',
    priority: 'P1',
    workpackage: 'WP-TypeExports-05',
    prefix: './fabric',
    strategy: 'fabric-policy-declaration-pack'
  },
  {
    id: 'a11y',
    priority: 'P1',
    workpackage: 'WP-TypeExports-05',
    prefix: './a11y',
    strategy: 'a11y-policy-declaration-pack'
  },
  {
    id: 'security',
    priority: 'P1',
    workpackage: 'WP-TypeExports-05',
    prefix: './security',
    strategy: 'security-policy-declaration-pack'
  },
  {
    id: 'builder',
    priority: 'P1',
    workpackage: 'WP-TypeExports-06',
    prefix: './builder',
    strategy: 'builder-and-scaffold-declaration-pack'
  },
  {
    id: 'catalog',
    priority: 'P2',
    workpackage: 'WP-TypeExports-07',
    prefix: './catalog',
    strategy: 'catalog-plan-report-declaration-pattern'
  },
  {
    id: 'design-tokens',
    priority: 'P2',
    workpackage: 'WP-TypeExports-08',
    exports: ['./design-tokens', './design-tokens/xtheme-token-alias-layer'],
    strategy: 'design-token-facade-declaration'
  }
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDefaultPackageManifest() {
  return require('../package.json');
}

function createExportFingerprint(exportKeys = EXPECTED_EXPORT_KEYS) {
  return crypto.createHash('sha256').update(exportKeys.join('\n')).digest('hex');
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

function selectPrimaryTarget(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;
  return value.types || value.import || value.browser || value.default || Object.values(value).find((entry) => typeof entry === 'string') || null;
}

function selectCurrentTypesCondition(value) {
  if (value && typeof value === 'object' && typeof value.types === 'string') return value.types;
  return null;
}

function normalizeDeclarationCandidate(target) {
  if (!target || typeof target !== 'string') return null;
  if (target.endsWith('.d.ts')) return target;
  if (!target.endsWith('.js')) return null;
  return target.replace(/\.esm\.js$/u, '.d.ts').replace(/\.browser\.js$/u, '.d.ts').replace(/\.js$/u, '.d.ts');
}

function toRepoRelative(filePath) {
  return filePath ? filePath.replace(/^\.\//u, '') : null;
}

function fileExists(rootDir, relativePath) {
  if (!relativePath || relativePath.includes('*')) return false;
  return fs.existsSync(path.join(rootDir, toRepoRelative(relativePath)));
}

function listFilesRecursive(directoryPath) {
  if (!fs.existsSync(directoryPath)) return [];

  return fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directoryPath, entry.name);
    return entry.isDirectory() ? listFilesRecursive(absolutePath) : [absolutePath];
  });
}

function wildcardDeclarationExists(rootDir, relativePattern) {
  const normalizedPattern = toRepoRelative(relativePattern);
  const wildcardIndex = normalizedPattern.indexOf('*');
  if (wildcardIndex === -1) return fileExists(rootDir, normalizedPattern);

  const prefix = normalizedPattern.slice(0, wildcardIndex);
  const suffix = normalizedPattern.slice(wildcardIndex + 1);
  const directoryPrefixEnd = prefix.lastIndexOf('/') + 1;
  const scanDirectory = path.join(rootDir, prefix.slice(0, directoryPrefixEnd));
  const filePrefix = prefix.slice(directoryPrefixEnd);

  return listFilesRecursive(scanDirectory).some((absolutePath) => {
    const relativePath = path.relative(scanDirectory, absolutePath).split(path.sep).join('/');
    return relativePath.startsWith(filePrefix) && relativePath.endsWith(suffix);
  });
}

function declarationTargetExists(rootDir, relativePath) {
  if (!relativePath) return false;
  if (relativePath.includes('*')) return wildcardDeclarationExists(rootDir, relativePath);
  return fileExists(rootDir, relativePath);
}

function resolveTypeExportGroup(exportKey) {
  return TYPE_EXPORT_GROUPS.find((group) => {
    if (Array.isArray(group.exports) && group.exports.includes(exportKey)) return true;
    if (Array.isArray(group.prefixes) && group.prefixes.some((prefix) => exportKey === prefix || exportKey.startsWith(`${prefix}/`))) return true;
    if (group.prefix && group.prefix.endsWith('-') && exportKey.startsWith(group.prefix)) return true;
    if (group.prefix && (exportKey === group.prefix || exportKey.startsWith(`${group.prefix}/`))) return true;
    return false;
  }) || null;
}

function resolveProposedTypesCondition(exportKey, target, group) {
  if (ASSET_EXPORTS.includes(exportKey)) return null;
  const currentTypesCondition = selectCurrentTypesCondition(target);
  if (currentTypesCondition) return currentTypesCondition;
  if (exportKey === '.' || exportKey === './loader') return './xtend-loader.d.ts';
  if (exportKey === './legacy-loader') return './xtend-dev.d.ts';
  if (exportKey === './api') return './api.d.ts';
  if (exportKey === './components/*') return './components/*.d.ts';
  if (exportKey === './rmt' || exportKey === './rmt/browser') return './xtendrmt/rmt-core.d.ts';
  if (group && group.id === 'builder' && exportKey === './builder/*') return './xtend-builder/*.d.ts';
  return normalizeDeclarationCandidate(selectPrimaryTarget(target));
}

function resolveTypeDecision(exportKey, proposedTypesCondition, declarationExists, group) {
  if (ASSET_EXPORTS.includes(exportKey)) return 'types-not-required';
  if (proposedTypesCondition && proposedTypesCondition.includes('*') && declarationExists) return 'wildcard-declaration-ready';
  if (declarationExists) return 'declaration-ready';
  if (group) return 'planned-declaration';
  return 'unclassified';
}

function createTypeExportClassification(exportKey, target, options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const group = resolveTypeExportGroup(exportKey);
  const proposedTypesCondition = group ? resolveProposedTypesCondition(exportKey, target, group) : null;
  const currentTypesCondition = selectCurrentTypesCondition(target);
  const targets = collectExportTargets(target);
  const declarationExists = declarationTargetExists(rootDir, proposedTypesCondition);
  const typeDecision = resolveTypeDecision(exportKey, proposedTypesCondition, declarationExists, group);

  return {
    schema: TYPE_EXPORTS_CLASSIFICATION_SCHEMA,
    exportKey,
    group: group ? group.id : 'unclassified',
    priority: group ? group.priority : 'unclassified',
    workpackage: group ? group.workpackage : null,
    strategy: group ? group.strategy : null,
    targets,
    targetCount: targets.length,
    currentTypesCondition,
    hasCurrentTypesCondition: Boolean(currentTypesCondition),
    proposedTypesCondition,
    declarationExists,
    typeDecision,
    typesRequired: typeDecision !== 'types-not-required',
    typesConditionPrepared: typeDecision !== 'unclassified' && (typeDecision === 'types-not-required' || Boolean(proposedTypesCondition)),
    gateDisposition: typeDecision === 'unclassified' ? 'fail-unclassified-public-export' : 'classified'
  };
}

function createTypeExportsPlan(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const packageManifest = options.packageManifest || getDefaultPackageManifest();
  const exportsMap = packageManifest.exports || {};
  const xtendMetadata = packageManifest.xtend || {};
  const releaseChecklist = xtendMetadata.releaseChecklist || {};
  const releaseGates = Array.isArray(xtendMetadata.releaseGates) ? xtendMetadata.releaseGates : [];
  const candidateGates = Array.isArray(releaseChecklist.candidateGates) ? releaseChecklist.candidateGates : [];
  const artifactChecklist = Array.isArray(releaseChecklist.artifactChecklist) ? releaseChecklist.artifactChecklist : [];
  const exportKeys = Object.keys(exportsMap);
  const classifications = exportKeys.map((exportKey) => createTypeExportClassification(exportKey, exportsMap[exportKey], { rootDir }));
  const classifiedExportKeys = classifications.map((entry) => entry.exportKey);
  const missingPackageExports = EXPECTED_EXPORT_KEYS.filter((exportKey) => !exportKeys.includes(exportKey));
  const unexpectedPackageExports = exportKeys.filter((exportKey) => !EXPECTED_EXPORT_KEYS.includes(exportKey));
  const missingTypeClassifications = exportKeys.filter((exportKey) => !classifiedExportKeys.includes(exportKey));
  const unclassifiedExports = classifications.filter((entry) => entry.typeDecision === 'unclassified').map((entry) => entry.exportKey);
  const p0Exports = classifications.filter((entry) => entry.priority === 'P0');
  const p0WithoutTypesDecision = p0Exports
    .filter((entry) => !entry.typesConditionPrepared)
    .map((entry) => entry.exportKey);
  const preparedTypesConditions = classifications
    .filter((entry) => entry.proposedTypesCondition)
    .map((entry) => ({
      exportKey: entry.exportKey,
      types: entry.proposedTypesCondition,
      workpackage: entry.workpackage,
      typeDecision: entry.typeDecision
    }));
  const declarationDrift = classifications
    .filter((entry) => entry.typesRequired && !['declaration-ready', 'wildcard-declaration-ready'].includes(entry.typeDecision))
    .map((entry) => ({
      exportKey: entry.exportKey,
      typeDecision: entry.typeDecision,
      proposedTypesCondition: entry.proposedTypesCondition,
      declarationExists: entry.declarationExists
    }));
  const packageTypesConditionDrift = classifications
    .filter((entry) => entry.hasCurrentTypesCondition && entry.proposedTypesCondition && entry.currentTypesCondition !== entry.proposedTypesCondition)
    .map((entry) => ({
      exportKey: entry.exportKey,
      currentTypesCondition: entry.currentTypesCondition,
      proposedTypesCondition: entry.proposedTypesCondition
    }));
  const missingReleaseGateScripts = TYPE_EXPORTS_RELEASE_GATE_SCRIPTS.filter((script) => !releaseGates.includes(script));
  const missingCandidateGateScripts = TYPE_EXPORTS_RELEASE_GATE_SCRIPTS.filter((script) => !candidateGates.includes(script));
  const requiredArtifactEntries = TYPE_EXPORTS_RELEASE_REPORT_ARTIFACTS.concat([
    TYPE_EXPORTS_BACKLOG,
    TYPE_EXPORTS_WORKPACKAGE_DOC,
    'development/WP-TypeExports-02-XTendLoader-StyleRegistry-und-SkeletonLoader-typisieren.md',
    'development/WP-TypeExports-03-api-js-und-window-XTend-Namespace-typisieren.md',
    'development/WP-TypeExports-04-XTendRMT-Runtime-Browser-und-RMT-Language-Exports-typisieren.md',
    'development/WP-TypeExports-05-Fabric-A11y-und-Security-Policy-APIs-typisieren.md',
    'development/WP-TypeExports-06-Builder-Scaffold-und-Component-Lab-Programm-APIs-typisieren.md',
    'development/WP-TypeExports-07-Catalog-Declaration-Pattern-fuer-Plan-und-Report-Module-einfuehren.md',
    'development/WP-TypeExports-08-Vendor-Utility-Facades-fuer-Prism-Turndown-und-Design-Tokens-ergaenzen.md',
    'development/WP-TypeExports-09-TypeExports-Gate-Drift-Report-und-Docs-Handoff-produktisieren.md',
    TYPE_EXPORTS_DOCS
  ]);
  const missingArtifactChecklistEntries = requiredArtifactEntries.filter((entry) => !artifactChecklist.includes(entry));
  const releaseHandoff = {
    schema: TYPE_EXPORTS_DRIFT_REPORT_SCHEMA,
    workpackage: TYPE_EXPORTS_RELEASE_WORKPACKAGE,
    status: TYPE_EXPORTS_RELEASE_STATUS,
    targetReadiness: TYPE_EXPORTS_RELEASE_TARGET,
    localGate: TYPE_EXPORTS_RELEASE_LOCAL_GATE,
    packageScript: TYPE_EXPORTS_RELEASE_PACKAGE_SCRIPT,
    reportArtifact: TYPE_EXPORTS_REPORT_ARTIFACT,
    packageExportLockGate: 'node scripts/run_xtend_tests.js epic13-package-export-lock --json',
    gateScripts: TYPE_EXPORTS_RELEASE_GATE_SCRIPTS.slice(),
    reportArtifacts: TYPE_EXPORTS_RELEASE_REPORT_ARTIFACTS.slice(),
    docs: TYPE_EXPORTS_RELEASE_DOCS.slice(),
    packageExportLockDocs: 'docs/package-export-lock.md',
    missingReleaseGateScripts,
    missingCandidateGateScripts,
    missingArtifactChecklistEntries,
    releaseOwnerVisible: missingReleaseGateScripts.length === 0
      && missingCandidateGateScripts.length === 0
      && missingArtifactChecklistEntries.length === 0,
    driftReportReady: declarationDrift.length === 0 && packageTypesConditionDrift.length === 0
  };

  return {
    schema: TYPE_EXPORTS_SCHEMA,
    reportSchema: TYPE_EXPORTS_REPORT_SCHEMA,
    classificationSchema: TYPE_EXPORTS_CLASSIFICATION_SCHEMA,
    sourcePackageExportLockSchema: EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
    workpackage: TYPE_EXPORTS_WORKPACKAGE,
    status: TYPE_EXPORTS_STATUS,
    targetReadiness: TYPE_EXPORTS_TARGET,
    generatedAt: options.generatedAt || 'static-local',
    module: TYPE_EXPORTS_MODULE,
    suite: TYPE_EXPORTS_SUITE,
    docs: TYPE_EXPORTS_DOCS,
    backlog: TYPE_EXPORTS_BACKLOG,
    workpackageDocument: TYPE_EXPORTS_WORKPACKAGE_DOC,
    localGate: TYPE_EXPORTS_LOCAL_GATE,
    packageScript: TYPE_EXPORTS_PACKAGE_SCRIPT,
    reportArtifact: TYPE_EXPORTS_REPORT_ARTIFACT,
    boundaries: [
      TYPE_EXPORTS_BOUNDARY,
      TYPE_EXPORTS_KERNEL_BOUNDARY,
      TYPE_EXPORTS_DECLARATION_BOUNDARY
    ],
    lockedExportCount: TYPE_EXPORTS_LOCKED_EXPORT_COUNT,
    lockedExportFingerprint: TYPE_EXPORTS_LOCKED_EXPORT_FINGERPRINT,
    packageExportLockFingerprint: createExportFingerprint(EXPECTED_EXPORT_KEYS),
    packageName: packageManifest.name,
    packageVersion: packageManifest.version,
    exportCount: exportKeys.length,
    expectedExportCount: EXPECTED_EXPORT_KEYS.length,
    expectedExportKeys: EXPECTED_EXPORT_KEYS.slice(),
    packageExportKeys: exportKeys,
    missingPackageExports,
    unexpectedPackageExports,
    missingTypeClassifications,
    unclassifiedExports,
    p0ExportCount: p0Exports.length,
    p0WithoutTypesDecision,
    declarationDrift,
    packageTypesConditionDrift,
    driftReportSchema: TYPE_EXPORTS_DRIFT_REPORT_SCHEMA,
    classificationGroups: clone(TYPE_EXPORT_GROUPS),
    classifications,
    preparedTypesConditions,
    releaseHandoff,
    localGateFailsOnNewUntypedPublicExport: true,
    packageTypesConditionsApplyInFollowUps: true,
    completedWorkpackages: TYPE_EXPORTS_COMPLETED_WORKPACKAGES.slice(),
    nextWorkpackages: []
  };
}

function validateTypeExportsPlan(plan = createTypeExportsPlan()) {
  const errors = [];
  const classifications = plan && Array.isArray(plan.classifications) ? plan.classifications : [];
  const groups = plan && Array.isArray(plan.classificationGroups) ? plan.classificationGroups : [];

  if (!plan || plan.schema !== TYPE_EXPORTS_SCHEMA) errors.push(`schema must be ${TYPE_EXPORTS_SCHEMA}`);
  if (!plan || plan.reportSchema !== TYPE_EXPORTS_REPORT_SCHEMA) errors.push(`reportSchema must be ${TYPE_EXPORTS_REPORT_SCHEMA}`);
  if (!plan || plan.classificationSchema !== TYPE_EXPORTS_CLASSIFICATION_SCHEMA) errors.push(`classificationSchema must be ${TYPE_EXPORTS_CLASSIFICATION_SCHEMA}`);
  if (!plan || plan.sourcePackageExportLockSchema !== EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA) errors.push(`sourcePackageExportLockSchema must be ${EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA}`);
  if (!plan || plan.workpackage !== TYPE_EXPORTS_WORKPACKAGE) errors.push(`workpackage must be ${TYPE_EXPORTS_WORKPACKAGE}`);
  if (!plan || plan.status !== TYPE_EXPORTS_STATUS) errors.push(`status must be ${TYPE_EXPORTS_STATUS}`);
  if (!plan || plan.targetReadiness !== TYPE_EXPORTS_TARGET) errors.push(`targetReadiness must be ${TYPE_EXPORTS_TARGET}`);
  if (!plan || plan.lockedExportCount !== TYPE_EXPORTS_LOCKED_EXPORT_COUNT) errors.push(`lockedExportCount must be ${TYPE_EXPORTS_LOCKED_EXPORT_COUNT}`);
  if (!plan || plan.expectedExportCount !== TYPE_EXPORTS_LOCKED_EXPORT_COUNT) errors.push(`expectedExportCount must stay locked to ${TYPE_EXPORTS_LOCKED_EXPORT_COUNT}`);
  if (!plan || plan.packageExportLockFingerprint !== TYPE_EXPORTS_LOCKED_EXPORT_FINGERPRINT) errors.push('package export lock fingerprint changed; update TypeExports classification first');
  if (!plan || plan.exportCount !== TYPE_EXPORTS_LOCKED_EXPORT_COUNT) errors.push(`package export count must stay locked to ${TYPE_EXPORTS_LOCKED_EXPORT_COUNT}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_BOUNDARY}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_KERNEL_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_KERNEL_BOUNDARY}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_DECLARATION_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_DECLARATION_BOUNDARY}`);
  if (!plan || plan.missingPackageExports.length > 0) errors.push(`missing package exports: ${plan ? plan.missingPackageExports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.unexpectedPackageExports.length > 0) errors.push(`unexpected package exports: ${plan ? plan.unexpectedPackageExports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingTypeClassifications.length > 0) errors.push(`missing type classifications: ${plan ? plan.missingTypeClassifications.join(', ') : '<plan missing>'}`);
  if (!plan || plan.unclassifiedExports.length > 0) errors.push(`unclassified exports: ${plan ? plan.unclassifiedExports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.p0WithoutTypesDecision.length > 0) errors.push(`P0 exports without types decision: ${plan ? plan.p0WithoutTypesDecision.join(', ') : '<plan missing>'}`);
  if (!plan || plan.declarationDrift.length > 0) errors.push(`declaration drift: ${plan ? plan.declarationDrift.map((entry) => entry.exportKey).join(', ') : '<plan missing>'}`);
  if (!plan || plan.packageTypesConditionDrift.length > 0) errors.push(`package types condition drift: ${plan ? plan.packageTypesConditionDrift.map((entry) => entry.exportKey).join(', ') : '<plan missing>'}`);
  if (!plan || !plan.releaseHandoff || plan.releaseHandoff.schema !== TYPE_EXPORTS_DRIFT_REPORT_SCHEMA) errors.push(`release handoff schema must be ${TYPE_EXPORTS_DRIFT_REPORT_SCHEMA}`);
  if (!plan || !plan.releaseHandoff || plan.releaseHandoff.workpackage !== TYPE_EXPORTS_RELEASE_WORKPACKAGE) errors.push(`release handoff workpackage must be ${TYPE_EXPORTS_RELEASE_WORKPACKAGE}`);
  if (!plan || !plan.releaseHandoff || plan.releaseHandoff.status !== TYPE_EXPORTS_RELEASE_STATUS) errors.push(`release handoff status must be ${TYPE_EXPORTS_RELEASE_STATUS}`);
  if (!plan || !plan.releaseHandoff || plan.releaseHandoff.targetReadiness !== TYPE_EXPORTS_RELEASE_TARGET) errors.push(`release handoff target must be ${TYPE_EXPORTS_RELEASE_TARGET}`);
  if (!plan || !plan.releaseHandoff || plan.releaseHandoff.missingReleaseGateScripts.length > 0) errors.push(`release gates miss TypeExports scripts: ${plan && plan.releaseHandoff ? plan.releaseHandoff.missingReleaseGateScripts.join(', ') : '<plan missing>'}`);
  if (!plan || !plan.releaseHandoff || plan.releaseHandoff.missingCandidateGateScripts.length > 0) errors.push(`candidate gates miss TypeExports scripts: ${plan && plan.releaseHandoff ? plan.releaseHandoff.missingCandidateGateScripts.join(', ') : '<plan missing>'}`);
  if (!plan || !plan.releaseHandoff || plan.releaseHandoff.missingArtifactChecklistEntries.length > 0) errors.push(`artifact checklist misses TypeExports artifacts: ${plan && plan.releaseHandoff ? plan.releaseHandoff.missingArtifactChecklistEntries.join(', ') : '<plan missing>'}`);
  if (!plan || !plan.releaseHandoff || plan.releaseHandoff.releaseOwnerVisible !== true) errors.push('TypeExports release handoff must be visible to release owners');
  if (!plan || !plan.releaseHandoff || plan.releaseHandoff.driftReportReady !== true) errors.push('TypeExports release handoff must include a clean drift report');
  if (!plan || !Array.isArray(plan.completedWorkpackages) || !plan.completedWorkpackages.includes(TYPE_EXPORTS_RELEASE_WORKPACKAGE)) errors.push(`completed workpackages must include ${TYPE_EXPORTS_RELEASE_WORKPACKAGE}`);
  if (!plan || !Array.isArray(plan.nextWorkpackages) || plan.nextWorkpackages.length !== 0) errors.push('TypeExports should have no remaining next workpackages after release handoff');
  if (!plan || plan.localGateFailsOnNewUntypedPublicExport !== true) errors.push('local gate must fail on new untyped public export');
  if (!plan || plan.packageTypesConditionsApplyInFollowUps !== true) errors.push('package types conditions must be applied in follow-up declaration WPs');

  groups.forEach((group) => {
    if (!group.id || !group.priority || !group.workpackage || !group.strategy) {
      errors.push(`classification group ${group.id || '<missing>'} is incomplete`);
    }
  });
  classifications.forEach((entry) => {
    if (entry.schema !== TYPE_EXPORTS_CLASSIFICATION_SCHEMA) errors.push(`${entry.exportKey} must expose classification schema`);
    if (!entry.exportKey || !entry.group || !entry.priority || !entry.typeDecision) errors.push(`${entry.exportKey || '<missing>'} has incomplete classification`);
    if (entry.typeDecision !== 'types-not-required' && !entry.proposedTypesCondition) errors.push(`${entry.exportKey} requires a proposed types condition`);
    if (entry.priority === 'P0' && entry.typeDecision === 'unclassified') errors.push(`${entry.exportKey} is P0 but unclassified`);
  });

  return {
    schema: TYPE_EXPORTS_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createTypeExportsReport(options = {}) {
  const plan = options.plan || createTypeExportsPlan(options);
  const validation = validateTypeExportsPlan(plan);
  const decisionCounts = plan.classifications.reduce((counts, entry) => {
    counts[entry.typeDecision] = (counts[entry.typeDecision] || 0) + 1;
    return counts;
  }, {});

  return {
    schema: TYPE_EXPORTS_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    exportCount: plan.exportCount,
    p0ExportCount: plan.p0ExportCount,
    preparedTypesConditionCount: plan.preparedTypesConditions.length,
    unclassifiedExports: plan.unclassifiedExports,
    p0WithoutTypesDecision: plan.p0WithoutTypesDecision,
    declarationDrift: plan.declarationDrift,
    packageTypesConditionDrift: plan.packageTypesConditionDrift,
    decisionCounts,
    releaseHandoff: plan.releaseHandoff,
    nextWorkpackages: plan.nextWorkpackages.slice(),
    plan
  };
}

module.exports = {
  TYPE_EXPORTS_BACKLOG,
  TYPE_EXPORTS_BOUNDARY,
  TYPE_EXPORTS_CLASSIFICATION_SCHEMA,
  TYPE_EXPORTS_DECLARATION_BOUNDARY,
  TYPE_EXPORTS_DRIFT_REPORT_SCHEMA,
  TYPE_EXPORTS_DOCS,
  TYPE_EXPORTS_KERNEL_BOUNDARY,
  TYPE_EXPORTS_LOCAL_GATE,
  TYPE_EXPORTS_LOCKED_EXPORT_COUNT,
  TYPE_EXPORTS_LOCKED_EXPORT_FINGERPRINT,
  TYPE_EXPORTS_MODULE,
  TYPE_EXPORTS_PACKAGE_SCRIPT,
  TYPE_EXPORTS_REPORT_ARTIFACT,
  TYPE_EXPORTS_REPORT_SCHEMA,
  TYPE_EXPORTS_RELEASE_GATE_SCRIPTS,
  TYPE_EXPORTS_RELEASE_LOCAL_GATE,
  TYPE_EXPORTS_RELEASE_PACKAGE_SCRIPT,
  TYPE_EXPORTS_RELEASE_REPORT_ARTIFACTS,
  TYPE_EXPORTS_RELEASE_STATUS,
  TYPE_EXPORTS_RELEASE_TARGET,
  TYPE_EXPORTS_RELEASE_WORKPACKAGE,
  TYPE_EXPORTS_SCHEMA,
  TYPE_EXPORTS_STATUS,
  TYPE_EXPORTS_SUITE,
  TYPE_EXPORTS_TARGET,
  TYPE_EXPORTS_WORKPACKAGE,
  TYPE_EXPORTS_WORKPACKAGE_DOC,
  TYPE_EXPORT_GROUPS,
  createExportFingerprint,
  createTypeExportClassification,
  createTypeExportsPlan,
  createTypeExportsReport,
  validateTypeExportsPlan
};
