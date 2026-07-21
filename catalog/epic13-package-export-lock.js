const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-handoff');
const {
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA,
  EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
  createEpic13ConditionalNetworkEvidencePlan,
  createEpic13ConditionalNetworkEvidenceReport,
  validateEpic13ConditionalNetworkEvidencePlan
} = require('./epic13-conditional-network-evidence');

const EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA = 'xtend.epic13.package-export-lock.v1';
const EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA = 'xtend.epic13.package-export-lock-report.v1';
const EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA = 'xtend.epic13.package-export-surface.v1';
const EPIC13_PACKAGE_DRY_RUN_ARTIFACT_SCHEMA = 'xtend.epic13.package-dry-run-artifact.v1';
const EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE = 'WP-E13-04';
const EPIC13_PACKAGE_EXPORT_LOCK_STATUS = 'accepted-package-export-lock';
const EPIC13_PACKAGE_EXPORT_LOCK_TARGET = 'package-export-lock-ready';
const EPIC13_PACKAGE_EXPORT_LOCK_MODULE = 'catalog/epic13-package-export-lock.js';
const EPIC13_PACKAGE_EXPORT_LOCK_SUITE = 'tests/platform/epic13_package_export_lock_suite.js';
const EPIC13_PACKAGE_EXPORT_LOCK_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_PACKAGE_EXPORT_LOCK_CONTRACT = 'development/XTend-Epic13-Package-Export-Lock-Contract.md';
const EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE_DOC = 'development/WP-E13-04-Package-Dry-Run-Artefakt-und-Export-Surface-Lock-bauen.md';
const EPIC13_PACKAGE_EXPORT_LOCK_DOCS = 'docs/package-export-lock.md';
const EPIC13_PACKAGE_EXPORT_LOCK_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-package-export-lock --json';
const EPIC13_PACKAGE_EXPORT_LOCK_PACKAGE_SCRIPT = 'npm run test:epic13-package-export-lock';
const EPIC13_PACKAGE_EXPORT_LOCK_CAPTURE_SCRIPT = 'npm run pack:dry-run:report';
const PACKAGE_DRY_RUN_COMMAND = 'npm run pack:dry-run';
const PACKAGE_DRY_RUN_JSON_COMMAND = 'npm pack --dry-run --json';
const PACKAGE_DRY_RUN_ARTIFACT = '.xtend-test-results/xtend-pack-dry-run.json';
const PACKAGE_EXPORT_SURFACE_ARTIFACT = '.xtend-test-results/xtend-package-export-surface-lock.json';
const PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT = '.xtend-test-results/xtend-package-export-lock-report.json';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';

const EXPECTED_SCOPED_PACKAGES = Object.freeze([
  '@ccslabs/xtend',
  '@ccslabs/xtend-rmt',
  '@ccslabs/xtend-fabric',
  '@ccslabs/xtend-cli',
  '@ccslabs/xtend-compiler',
  '@ccslabs/xtend-maraca',
  '@ccslabs/xtend-xsurface-shard'
]);

const EXPECTED_EXPORT_KEYS = Object.freeze([
  '.',
  './registry',
  './loader',
  './legacy-loader',
  './api',
  './style.css',
  './manifest',
  './components/manifest.json',
  './maraca',
  './maraca/runtime',
  './maraca/plan-runtime',
  './maraca/css-provider',
  './maraca/app-services',
  './maraca/server-services',
  './maraca/node-app-service-host',
  './maraca/node-app-host',
  './maraca/service-build-provider',
  './xsurface-shard',
  './xscaler',
  './xscaler/protocol',
  './xscaler/remote-adapter-loader',
  './xscaler/app-service-transport',
  './xscaler/schemas/*',
  './components/*',
  './components/xkeymap.js',
  './xcommand',
  './design-tokens',
  './design-tokens/xtheme-token-alias-layer',
  './design-tokens/tailwind/token-bridge',
  './design-tokens/tailwind/theme.css',
  './design-tokens/tailwind/material-theme.css',
  './design-tokens/tailwind/token-matrix',
  './design-tokens/themes/enterprise-light',
  './a11y/screenreader-signals',
  './a11y/motion-contrast-policy',
  './a11y/runtime-a11y-contract',
  './fabric',
  './fabric/rmt-lane-mapping',
  './fabric/hydration-policy',
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
  './catalog/epic13-rc1-gate-matrix-ci-handoff',
  './catalog/epic13-release-report-pack-dry-run-evidence',
  './catalog/epic13-conditional-network-evidence-ci',
  './catalog/epic14-rmt-tooling',
  './catalog/epic14-lsp-handoff',
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
  './rmt-language/super-prewarm-worker-experiment',
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
  './rmt-language/rmt-ai-developer-kit',
  './rmt-language-server',
  './rmt-language-server/protocol',
  './rmt-linter/cli',
  './rmt-linter/reporter',
  './rmt-language/snippets',
  './rmt-editor/vscode',
  './builder/preview/component-lab',
  './builder/preview/component-lab-ux-inspector',
  './builder/typing/component-shell-contract',
  './builder/typing/component-styling-contract',
  './builder/typing/component-network-contract',
  './builder/typing/rmt-shell-authoring-contract',
  './builder/typing/rmt-dsl-authoring-polish',
  './builder/typing/form-controls-ux-contract',
  './builder/typing/feedback-status-ux-contract',
  './builder/typing/navigation-routing-ux-contract',
  './builder/typing/overlay-interaction-ux-contract',
  './builder/typing/layout-display-media-ux-contract',
  './builder/performance/component-ux-performance-contract',
  './rmt',
  './rmt/browser',
  './rmt/browser-scheduler',
  './rmt/dom-descriptor-renderer',
  './rmt/safe-preview',
  './rmt/component-capability-registry',
  './rmt/state-selector-runtime',
  './rmt/action-effect-runtime',
  './rmt/event-routing-runtime',
  './rmt/form-validation-runtime',
  './rmt/animation-engine-runtime',
  './rmt/surface-transition-runtime',
  './rmt/surface-resource-graph-runtime',
  './rmt/kernel-orchestration-controller',
  './rmt/native-shell-runtime',
  './rmt/node-ssr-adapter',
  './compiler/tooling-bridge',
  './xtensions/host-controller-contract',
  './xtensions/signal-bridge-contract',
  './xtensions/maraca-manifest-contract',
  './xtensions/static-introspection-contract',
  './xtensions/runtime-capability-registry',
  './xtensions/react-host-controller-poc',
  './xtensions/vue-host-controller-poc',
  './xtensions/imperative-host-pocs',
  './xtensions/three-render-loop-poc',
  './xtensions/diagnostic-trail',
  './xtensions/security-integrity-gate',
  './xtensions/multi-framework-dashboard-fixture',
  './xtensions/registry-package-strategy',
  './xtensions/adoption-handoff',
  './xtensions/react-host-adapter',
  './xtensions/vue-host-adapter',
  './xtensions/vanilla-host-adapter',
  './xtensions/openui5-host-adapter',
  './xtensions/angular-host-adapter',
  './builder',
  './builder/*',
  './security/manifest-import-policy',
  './security/trusted-dom-policy',
  './security/supply-chain-gate-policy',
  './security/xss-pentest-policy',
  './package.json'
]);

const REQUIRED_PACK_ROOTS = Object.freeze([
  'README.md',
  'CHANGELOG.md',
  'package.json',
  'api.js',
  'xtend.js',
  'xtend.ssr.mjs',
  'xtend-registry.mjs',
  'xtend.d.ts',
  'xtend.ssr.d.ts',
  'xtend-loader.js',
  'xtend-dev.js',
  'xtend.css',
  'a11y',
  'components',
  'fabric',
  'catalog',
  'design-tokens',
  'xtendrmt',
  'xtend-builder',
  'xtend-maraca',
  'xsurface-shard',
  'xscaler',
  'tools',
  'security',
  'docs'
]);

const SURFACE_GROUPS = Object.freeze([
  {
    id: 'registry',
    requiredExports: ['.', './registry'],
    requiredPackRoots: ['xtend.js', 'xtend.ssr.mjs', 'xtend-registry.mjs', 'xtend.d.ts', 'xtend.ssr.d.ts']
  },
  {
    id: 'loader',
    requiredExports: ['./loader', './legacy-loader', './api', './style.css', './manifest', './components/manifest.json'],
    requiredPackRoots: ['xtend-loader.js', 'xtend-dev.js', 'api.js', 'xtend.css', 'components']
  },
  {
    id: 'components',
    requiredExports: ['./components/*', './components/xkeymap.js'],
    requiredPackRoots: ['components']
  },
  {
    id: 'xcommand',
    requiredExports: ['./xcommand', './components/xkeymap.js'],
    requiredPackRoots: ['xcommand', 'components']
  },
  {
    id: 'maraca',
    requiredExports: ['./maraca', './maraca/runtime', './maraca/plan-runtime', './maraca/css-provider', './maraca/app-services', './maraca/server-services', './maraca/node-app-service-host', './maraca/service-build-provider'],
    requiredPackRoots: ['xtend-maraca']
  },
  {
    id: 'xsurface-shard',
    requiredExports: ['./xsurface-shard'],
    requiredPackRoots: ['xsurface-shard']
  },
  {
    id: 'xscaler',
    requiredExports: ['./xscaler', './xscaler/protocol', './xscaler/remote-adapter-loader', './xscaler/app-service-transport', './xscaler/schemas/*'],
    requiredPackRoots: ['xscaler']
  },
  {
    id: 'fabric',
    requiredExports: ['./fabric', './fabric/rmt-lane-mapping', './fabric/hydration-policy'],
    requiredPackRoots: ['fabric']
  },
  {
    id: 'xtendrmt',
    requiredExports: ['./rmt', './rmt/browser', './rmt/browser-scheduler', './rmt/dom-descriptor-renderer', './rmt/safe-preview', './rmt/component-capability-registry', './rmt/state-selector-runtime', './rmt/action-effect-runtime', './rmt/event-routing-runtime', './rmt/form-validation-runtime', './rmt/animation-engine-runtime', './rmt/surface-transition-runtime', './rmt/surface-resource-graph-runtime', './rmt/kernel-orchestration-controller', './rmt/native-shell-runtime', './rmt/node-ssr-adapter'],
    requiredPackRoots: ['xtendrmt']
  },
  {
    id: 'builder',
    requiredExports: [
      './builder',
      './builder/*',
      './builder/preview/component-lab',
      './builder/preview/component-lab-ux-inspector',
      './builder/typing/component-shell-contract',
      './builder/typing/component-styling-contract',
      './builder/typing/component-network-contract',
      './builder/typing/rmt-shell-authoring-contract',
      './builder/typing/rmt-dsl-authoring-polish',
      './builder/typing/form-controls-ux-contract',
      './builder/typing/feedback-status-ux-contract',
      './builder/typing/navigation-routing-ux-contract',
      './builder/typing/overlay-interaction-ux-contract',
      './builder/typing/layout-display-media-ux-contract',
      './builder/performance/component-ux-performance-contract'
    ],
    requiredPackRoots: ['xtend-builder']
  },
  {
    id: 'docs',
    requiredExports: [],
    requiredPackRoots: ['docs']
  },
  {
    id: 'security',
    requiredExports: ['./security/manifest-import-policy', './security/trusted-dom-policy', './security/supply-chain-gate-policy', './security/xss-pentest-policy'],
    requiredPackRoots: ['security']
  },
  {
    id: 'design-tokens',
    requiredExports: ['./design-tokens', './design-tokens/xtheme-token-alias-layer', './design-tokens/themes/enterprise-light', './design-tokens/tailwind/token-bridge', './design-tokens/tailwind/theme.css', './design-tokens/tailwind/material-theme.css', './design-tokens/tailwind/token-matrix'],
    requiredPackRoots: ['design-tokens']
  },
  {
    id: 'catalog',
    requiredExports: [
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
      './catalog/epic13-rc1-gate-matrix-ci-handoff',
      './catalog/epic13-release-report-pack-dry-run-evidence',
      './catalog/epic13-conditional-network-evidence-ci',
      './catalog/epic14-rmt-tooling',
      './catalog/epic14-lsp-handoff'
    ],
    requiredPackRoots: ['catalog']
  },
  {
    id: 'rmt-tooling',
    requiredExports: [
      './compiler/tooling-bridge',
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
      './rmt-language/super-prewarm-worker-experiment',
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
      './rmt-language/rmt-ai-developer-kit',
      './rmt-language-server',
      './rmt-language-server/protocol',
      './rmt-linter/cli',
      './rmt-linter/reporter',
      './rmt-language/snippets',
      './rmt-editor/vscode'
    ],
    requiredPackRoots: ['tools']
  },
  {
    id: 'xtensions',
    requiredExports: [
      './xtensions/host-controller-contract',
      './xtensions/signal-bridge-contract',
      './xtensions/maraca-manifest-contract',
      './xtensions/static-introspection-contract',
      './xtensions/runtime-capability-registry',
      './xtensions/react-host-controller-poc',
      './xtensions/vue-host-controller-poc',
      './xtensions/imperative-host-pocs',
      './xtensions/three-render-loop-poc',
      './xtensions/diagnostic-trail',
      './xtensions/security-integrity-gate',
      './xtensions/multi-framework-dashboard-fixture',
      './xtensions/registry-package-strategy',
      './xtensions/adoption-handoff',
      './xtensions/vanilla-host-adapter',
      './xtensions/openui5-host-adapter',
      './xtensions/angular-host-adapter'
    ],
    requiredPackRoots: ['tools']
  }
]);

const REQUIRED_DOCS = Object.freeze([
  EPIC13_PACKAGE_EXPORT_LOCK_STEERING,
  EPIC13_PACKAGE_EXPORT_LOCK_CONTRACT,
  EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE_DOC,
  EPIC13_PACKAGE_EXPORT_LOCK_DOCS,
  'development/XTend-Epic13-Conditional-Network-Evidence-Contract.md',
  'development/XTend-Release-Checklist-und-SemVer-Policy.md',
  'development/XTend-CI-Gate-Matrix.md',
  'development/XTend-Package-Export-und-Release-Strategie.md',
  'docs/conditional-network-evidence.md',
  'development/docs-evidence/legacy-routes/en/rc1-readiness.md',
  'development/docs-evidence/legacy-routes/en/release-owner-acceptance.md',
  'docs/enterprise-adoption.md'
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function unique(values) {
  return [...new Set(values)];
}

function getDefaultPackageManifest() {
  return require('../package.json');
}

function normalizeTargetPath(target) {
  return target.replace(/^\.\//u, '');
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

function isTargetCoveredByFiles(target, files) {
  if (/^https?:\/\//u.test(target)) return false;
  const normalized = normalizeTargetPath(target);
  const targetPrefix = normalized.includes('*') ? normalized.slice(0, normalized.indexOf('*')) : normalized;

  return files.some((fileRoot) => {
    if (fileRoot.includes('*')) {
      return targetPrefix.startsWith(fileRoot.slice(0, fileRoot.indexOf('*')));
    }

    return targetPrefix === fileRoot || targetPrefix.startsWith(`${fileRoot}/`);
  });
}

function createExportRecord(key, target, files) {
  const targets = collectExportTargets(target);
  const uncoveredTargets = targets.filter((entry) => !isTargetCoveredByFiles(entry, files));
  const externalTargets = targets.filter((entry) => /^https?:\/\//u.test(entry) || entry.includes('cdn.'));

  return {
    schema: EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA,
    key,
    targets,
    targetCount: targets.length,
    coveredByFiles: uncoveredTargets.length === 0,
    uncoveredTargets,
    externalTargets
  };
}

function createSurfaceGroupRecord(group, exportKeys, files) {
  const missingExports = group.requiredExports.filter((entry) => !exportKeys.includes(entry));
  const missingPackRoots = group.requiredPackRoots.filter((entry) => !files.includes(entry));

  return {
    id: group.id,
    requiredExports: group.requiredExports.slice(),
    requiredPackRoots: group.requiredPackRoots.slice(),
    missingExports,
    missingPackRoots,
    ok: missingExports.length === 0 && missingPackRoots.length === 0
  };
}

function createPackageExportSurfaceSnapshot(packageManifest = getDefaultPackageManifest()) {
  const exportsMap = packageManifest.exports || {};
  const declaredFiles = Array.isArray(packageManifest.files) ? packageManifest.files.slice() : [];
  const files = unique([...declaredFiles, 'package.json']);
  const exportKeys = Object.keys(exportsMap);
  const exportRecords = exportKeys.map((key) => createExportRecord(key, exportsMap[key], files));
  const missingExpectedExports = EXPECTED_EXPORT_KEYS.filter((key) => !exportKeys.includes(key));
  const unexpectedExports = exportKeys.filter((key) => !EXPECTED_EXPORT_KEYS.includes(key));
  const missingRequiredPackRoots = REQUIRED_PACK_ROOTS.filter((root) => !files.includes(root));
  const surfaceGroups = SURFACE_GROUPS.map((group) => createSurfaceGroupRecord(group, exportKeys, files));

  return {
    schema: EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA,
    exportKeys,
    exportRecords,
    exportCount: exportKeys.length,
    expectedExportKeys: EXPECTED_EXPORT_KEYS.slice(),
    missingExpectedExports,
    unexpectedExports,
    packageFiles: files,
    requiredPackRoots: REQUIRED_PACK_ROOTS.slice(),
    missingRequiredPackRoots,
    surfaceGroups,
    uncoveredExportTargets: exportRecords.flatMap((record) => record.uncoveredTargets.map((target) => `${record.key}:${target}`)),
    externalExportTargets: exportRecords.flatMap((record) => record.externalTargets.map((target) => `${record.key}:${target}`))
  };
}

function createPackDryRunArtifactSummary(rawArtifact, expectedRoots = REQUIRED_PACK_ROOTS) {
  const parsed = typeof rawArtifact === 'string' ? JSON.parse(rawArtifact) : rawArtifact;
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  const primary = entries[0] || {};
  const files = Array.isArray(primary.files) ? primary.files.map((file) => file.path) : [];
  const presentRequiredRoots = expectedRoots.filter((root) => files.some((filePath) => filePath === root || filePath.startsWith(`${root}/`)));
  const missingRequiredRoots = expectedRoots.filter((root) => !presentRequiredRoots.includes(root));

  return {
    schema: EPIC13_PACKAGE_DRY_RUN_ARTIFACT_SCHEMA,
    id: primary.id || null,
    name: primary.name || null,
    version: primary.version || null,
    filename: primary.filename || null,
    entryCount: primary.entryCount || files.length,
    files,
    fileCount: files.length,
    presentRequiredRoots,
    missingRequiredRoots,
    bundled: Array.isArray(primary.bundled) ? primary.bundled.slice() : []
  };
}

function createEpic13PackageExportLockPlan(options = {}) {
  const packageManifest = options.packageManifest || getDefaultPackageManifest();
  const sourcePlan = options.sourcePlan || createEpic13ConditionalNetworkEvidencePlan(options);
  const sourceValidation = options.sourceValidation || validateEpic13ConditionalNetworkEvidencePlan(sourcePlan);
  const sourceReport = options.sourceReport || createEpic13ConditionalNetworkEvidenceReport({ ...options, plan: sourcePlan });
  const surfaceSnapshot = options.surfaceSnapshot || createPackageExportSurfaceSnapshot(packageManifest);
  const scopedPackages = Array.isArray(packageManifest.scopedPackages) ? packageManifest.scopedPackages : [];
  const scopedPackageNames = scopedPackages.map((entry) => entry && entry.name).filter(Boolean);
  const missingScopedPackages = EXPECTED_SCOPED_PACKAGES.filter((name) => !scopedPackageNames.includes(name));
  const packDryRunArtifact = options.packDryRunArtifact
    ? createPackDryRunArtifactSummary(options.packDryRunArtifact)
    : null;

  return {
    schema: EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
    reportSchema: EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA,
    surfaceSchema: EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA,
    dryRunArtifactSchema: EPIC13_PACKAGE_DRY_RUN_ARTIFACT_SCHEMA,
    workpackage: EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE,
    status: EPIC13_PACKAGE_EXPORT_LOCK_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_PACKAGE_EXPORT_LOCK_MODULE,
    suite: EPIC13_PACKAGE_EXPORT_LOCK_SUITE,
    steeringDocument: EPIC13_PACKAGE_EXPORT_LOCK_STEERING,
    contract: EPIC13_PACKAGE_EXPORT_LOCK_CONTRACT,
    workpackageDocument: EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE_DOC,
    docs: EPIC13_PACKAGE_EXPORT_LOCK_DOCS,
    localGate: EPIC13_PACKAGE_EXPORT_LOCK_LOCAL_GATE,
    packageScript: EPIC13_PACKAGE_EXPORT_LOCK_PACKAGE_SCRIPT,
    captureScript: EPIC13_PACKAGE_EXPORT_LOCK_CAPTURE_SCRIPT,
    sourceSchema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA,
    sourceReportSchema: EPIC13_CONDITIONAL_NETWORK_EVIDENCE_REPORT_SCHEMA,
    sourceStatus: sourcePlan.status,
    sourceValidationOk: sourceValidation.ok,
    sourceReportOk: sourceReport.ok,
    releaseCandidate: 'RC1',
    targetReadiness: EPIC13_PACKAGE_EXPORT_LOCK_TARGET,
    packageName: packageManifest.name,
    packageVersion: packageManifest.version,
    scopedPackages: clone(scopedPackages),
    scopedPackageNames,
    expectedScopedPackages: EXPECTED_SCOPED_PACKAGES.slice(),
    missingScopedPackages,
    packagePrivate: packageManifest.private === false,
    packageDryRunCommand: PACKAGE_DRY_RUN_COMMAND,
    packageDryRunJsonCommand: PACKAGE_DRY_RUN_JSON_COMMAND,
    packageDryRunArtifact: PACKAGE_DRY_RUN_ARTIFACT,
    packageExportSurfaceArtifact: PACKAGE_EXPORT_SURFACE_ARTIFACT,
    packageExportLockReportArtifact: PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT,
    artifactRequiredForRc1: true,
    localGateRequiresNpmPackExecution: false,
    expectedExportKeys: EXPECTED_EXPORT_KEYS.slice(),
    requiredPackRoots: REQUIRED_PACK_ROOTS.slice(),
    surfaceGroups: clone(SURFACE_GROUPS),
    surfaceSnapshot,
    packDryRunArtifact,
    nextDecision: 'rc1-gate-matrix-ci-handoff',
    nextWorkpackage: 'WP-E13-13',
    kernelBoundary: KERNEL_BOUNDARY,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: false
  };
}

function validateEpic13PackageExportLockPlan(plan = createEpic13PackageExportLockPlan()) {
  const errors = [];
  const surface = plan && plan.surfaceSnapshot;
  const groups = surface && Array.isArray(surface.surfaceGroups) ? surface.surfaceGroups : [];

  if (!plan || plan.schema !== EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA) errors.push(`schema must be ${EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA}`);
  if (!plan || plan.reportSchema !== EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA}`);
  if (!plan || plan.surfaceSchema !== EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA) errors.push(`surfaceSchema must be ${EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA}`);
  if (!plan || plan.dryRunArtifactSchema !== EPIC13_PACKAGE_DRY_RUN_ARTIFACT_SCHEMA) errors.push(`dryRunArtifactSchema must be ${EPIC13_PACKAGE_DRY_RUN_ARTIFACT_SCHEMA}`);
  if (!plan || plan.workpackage !== EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE}`);
  if (!plan || plan.status !== EPIC13_PACKAGE_EXPORT_LOCK_STATUS) errors.push(`status must be ${EPIC13_PACKAGE_EXPORT_LOCK_STATUS}`);
  if (!plan || plan.sourceSchema !== EPIC13_CONDITIONAL_NETWORK_EVIDENCE_SCHEMA) errors.push('source schema must be conditional network evidence');
  if (!plan || plan.sourceValidationOk !== true || plan.sourceReportOk !== true) errors.push('source conditional network evidence must validate');
  if (!plan || plan.targetReadiness !== EPIC13_PACKAGE_EXPORT_LOCK_TARGET) errors.push(`targetReadiness must be ${EPIC13_PACKAGE_EXPORT_LOCK_TARGET}`);
  if (!plan || plan.packagePrivate !== true || plan.packagePrivateRequired !== false) errors.push('package must be public-ready for RC1 package lock');
  if (!plan || plan.packageDryRunCommand !== PACKAGE_DRY_RUN_COMMAND) errors.push('package dry run command must remain npm run pack:dry-run');
  if (!plan || plan.captureScript !== EPIC13_PACKAGE_EXPORT_LOCK_CAPTURE_SCRIPT) errors.push('capture script must remain pack:dry-run:report');
  if (!plan || plan.artifactRequiredForRc1 !== true || plan.localGateRequiresNpmPackExecution !== false) errors.push('RC1 artifact is required, but local lock gate must stay static');
  if (!surface || surface.schema !== EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA) errors.push(`surface snapshot must use ${EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA}`);
  if (!surface || surface.exportCount !== EXPECTED_EXPORT_KEYS.length) errors.push(`export count must be locked to ${EXPECTED_EXPORT_KEYS.length}`);
  if (!surface || surface.missingExpectedExports.length > 0) errors.push(`missing expected exports: ${surface ? surface.missingExpectedExports.join(', ') : '<surface missing>'}`);
  if (!surface || surface.unexpectedExports.length > 0) errors.push(`unexpected exports: ${surface ? surface.unexpectedExports.join(', ') : '<surface missing>'}`);
  if (!surface || surface.missingRequiredPackRoots.length > 0) errors.push(`missing package file roots: ${surface ? surface.missingRequiredPackRoots.join(', ') : '<surface missing>'}`);
  if (!surface || surface.uncoveredExportTargets.length > 0) errors.push(`exports outside package files: ${surface ? surface.uncoveredExportTargets.join(', ') : '<surface missing>'}`);
  if (!surface || surface.externalExportTargets.length > 0) errors.push(`external export targets are forbidden: ${surface ? surface.externalExportTargets.join(', ') : '<surface missing>'}`);
  if (!plan || !Array.isArray(plan.scopedPackageNames)) errors.push('root scopedPackages metadata must be present');
  if (!plan || plan.missingScopedPackages.length > 0) errors.push(`missing scoped package metadata: ${plan ? plan.missingScopedPackages.join(', ') : '<plan missing>'}`);
  groups.forEach((group) => {
    if (!group.ok) errors.push(`surface group ${group.id} is incomplete`);
  });
  if (plan && plan.packDryRunArtifact) {
    if (plan.packDryRunArtifact.missingRequiredRoots.length > 0) {
      errors.push(`pack dry run artifact missing roots: ${plan.packDryRunArtifact.missingRequiredRoots.join(', ')}`);
    }
  }
  if (!plan || plan.nextDecision !== 'rc1-gate-matrix-ci-handoff') errors.push('next decision must be RC1 Gate Matrix und CI-Handoff');
  if (!plan || plan.nextWorkpackage !== 'WP-E13-13') errors.push('next workpackage must be WP-E13-13');
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!plan || plan.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!plan || plan.publishAllowed !== false) errors.push('publish must remain blocked');

  return {
    schema: EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13PackageExportLockReport(options = {}) {
  const plan = options.plan || createEpic13PackageExportLockPlan(options);
  const validation = validateEpic13PackageExportLockPlan(plan);

  return {
    schema: EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    plan,
    exportCount: plan.surfaceSnapshot.exportCount,
    packageFileRootCount: plan.surfaceSnapshot.requiredPackRoots.length,
    surfaceGroupCount: plan.surfaceSnapshot.surfaceGroups.length,
    missingExpectedExports: plan.surfaceSnapshot.missingExpectedExports,
    unexpectedExports: plan.surfaceSnapshot.unexpectedExports,
    expectedScopedPackages: plan.expectedScopedPackages,
    scopedPackageNames: plan.scopedPackageNames,
    missingScopedPackages: plan.missingScopedPackages,
    publishAllowed: plan.publishAllowed,
    nextWorkpackage: plan.nextWorkpackage
  };
}

module.exports = {
  EPIC13_PACKAGE_DRY_RUN_ARTIFACT_SCHEMA,
  EPIC13_PACKAGE_EXPORT_LOCK_CAPTURE_SCRIPT,
  EPIC13_PACKAGE_EXPORT_LOCK_CONTRACT,
  EPIC13_PACKAGE_EXPORT_LOCK_DOCS,
  EPIC13_PACKAGE_EXPORT_LOCK_LOCAL_GATE,
  EPIC13_PACKAGE_EXPORT_LOCK_MODULE,
  EPIC13_PACKAGE_EXPORT_LOCK_PACKAGE_SCRIPT,
  EPIC13_PACKAGE_EXPORT_LOCK_REPORT_SCHEMA,
  EPIC13_PACKAGE_EXPORT_LOCK_SCHEMA,
  EPIC13_PACKAGE_EXPORT_LOCK_STATUS,
  EPIC13_PACKAGE_EXPORT_LOCK_STEERING,
  EPIC13_PACKAGE_EXPORT_LOCK_SUITE,
  EPIC13_PACKAGE_EXPORT_LOCK_TARGET,
  EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE,
  EPIC13_PACKAGE_EXPORT_LOCK_WORKPACKAGE_DOC,
  EPIC13_PACKAGE_EXPORT_SURFACE_SCHEMA,
  EXPECTED_EXPORT_KEYS,
  EXPECTED_SCOPED_PACKAGES,
  PACKAGE_DRY_RUN_ARTIFACT,
  PACKAGE_DRY_RUN_COMMAND,
  PACKAGE_DRY_RUN_JSON_COMMAND,
  PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT,
  PACKAGE_EXPORT_SURFACE_ARTIFACT,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  REQUIRED_PACK_ROOTS,
  SURFACE_GROUPS,
  createEpic13PackageExportLockPlan,
  createEpic13PackageExportLockReport,
  createPackDryRunArtifactSummary,
  createPackageExportSurfaceSnapshot,
  validateEpic13PackageExportLockPlan
};
