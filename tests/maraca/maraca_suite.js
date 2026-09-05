const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawnSync } = require('child_process');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  MARACA_BUILD_PLAN_SCHEMA,
  MARACA_BUNDLE_REPORT_SCHEMA,
  MARACA_KERNEL_PLAN_SCHEMA,
  MARACA_HYDRATION_PLAN_SCHEMA,
  MARACA_VALIDATION_PLAN_SCHEMA,
  MARACA_TRANSITION_PLAN_SCHEMA,
  MARACA_TEMPLATE_ARTIFACTS_REPORT_SCHEMA,
  MARACA_PERFORMANCE_REPORT_SCHEMA,
  MARACA_ORCHESTRATION_PLAN_SCHEMA,
  MARACA_SIZE_BUDGET_REPORT_SCHEMA,
  MARACA_WARM_REENTRY_REPORT_SCHEMA,
  MARACA_PREWARM_WORKER_RUNTIME_SCHEMA,
  MARACA_PRODUCTION_BUNDLE_CLOSURE_SCHEMA,
  MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA,
  MARACA_WEB_APP_MANIFEST_REPORT_SCHEMA,
  MARACA_PWA_SERVICE_WORKER_PLAN_SCHEMA,
  MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA,
  MARACA_COMPONENT_COMMAND_SCHEMA,
  MARACA_COMPONENT_COMMAND_RESULT_SCHEMA,
  buildMaracaBundle,
  buildMaracaBundleAsync,
  createMaracaPerformanceReport,
  createMaracaWebAppManifestPlan,
  createMaracaPwaServiceWorkerPlan,
  createMaracaTemplateArtifactsReport,
  createMaracaBuildPlan,
  invokeMaracaComponentCommand
} = require('../../xtend-maraca');
const {
  RMT_KERNEL_SOURCE_ARTIFACT_SCHEMA,
  createRmtKernelSourceArtifact
} = require('../../xtend-builder/generators/rmt-kernel-lab');
const {
  runCliAsync
} = require('../../xtend-builder/lib/cli');
const {
  listenXtendDevServer
} = require('../../scripts/serve_xtend_dev');
const {
  detectAvailableEngine,
  runFixture
} = require('../../tools/browser-hypervisor');
const MARACA_MODULE_PATH = 'xtend-maraca/index.js';
const MARACA_RUNTIME_PATH = 'xtend-maraca/runtime.js';
const MARACA_PACKAGE_PATH = 'xtend-maraca/package.json';
const MARACA_FIXTURE = 'tests/rmt-language/fixtures/maraca-known-components.rmt';
const MARACA_NATIVE_FIXTURE = 'tests/rmt-language/fixtures/maraca-native-html-component.rmt';
const MARACA_UNKNOWN_FIXTURE = 'tests/rmt-language/fixtures/vnext-source-to-sea.rmt';
const MARACA_WARM_REENTRY_FIXTURE = 'tests/rmt-language/fixtures/vnext-lifecycle-valid.rmt';
const MARACA_ORCHESTRATION_FIXTURE = 'tests/rmt-language/fixtures/maraca-orchestration-app.rmt';
const MARACA_ORCHESTRATION_INCOMPLETE_FIXTURE = 'tests/rmt-language/fixtures/maraca-orchestration-incomplete.rmt';
const MARACA_KERNEL_INTEGRITY_FIXTURE = 'tests/rmt-language/fixtures/maraca-kernel-integrity-app.rmt';
const MARACA_VALIDATION_FIXTURE = 'tests/rmt-language/fixtures/maraca-validation-app.rmt';
const MARACA_TRANSITIONS_FIXTURE = 'tests/rmt-language/fixtures/maraca-transitions-app.rmt';
const MARACA_OUT_DIR = '.xtend-build/maraca/source-to-sea';
const MARACA_RMT_OUT_DIR = '.xtend-build/maraca/rmt-command';
const MARACA_ORCHESTRATION_OUT_DIR = '.xtend-build/maraca/orchestration';
const MARACA_KERNEL_ORCHESTRATION_OUT_DIR = '.xtend-build/maraca/kernel-orchestration';
const MARACA_KERNEL_RUNTIME_ASSET = 'runtime/xtendrmt-runtime.esm.mjs';
const MARACA_KERNEL_CONTROLLER_ASSET = 'runtime/xtendrmt-kernel-orchestration-controller.mjs';
const MARACA_KERNEL_SCHEDULER_ASSET = 'runtime/rmt-kernel-scheduler.mjs';
const MARACA_KERNEL_INTEGRITY_OUT_DIR = '.xtend-build/maraca/kernel-integrity';
const MARACA_VALIDATION_OUT_DIR = '.xtend-build/maraca/validation';
const MARACA_TRANSITIONS_OUT_DIR = '.xtend-build/maraca/transitions';
const MARACA_KERNEL_INTEGRITY_BROWSER_TIMEOUT_MS = 90000;
const maracaEsmModuleCache = new Map();
const MARACA_SUITES = [
  'maraca-plan',
  'maraca-bundle',
  'maraca-bundle-report',
  'maraca-app-services-runtime',
  'maraca-app-services-cross-runtime',
  'maraca-node-app-host',
  'xtend-llm-app-services-catfood',
  'maraca-app-services-build',
  'maraca-rmt-source-to-bundle',
  'maraca-orchestration',
  'maraca-kernel-orchestration',
  'maraca-kernel-integrity',
  'maraca-validation',
  'maraca-transitions',
  'maraca-package-exports',
  'maraca-size-budget',
  'maraca-web-app-manifest',
  'maraca-pwa-service-worker'
];

async function importRepoEsmModule(relativePath, rootDir) {
  const absolutePath = resolveRepoPath(relativePath, rootDir);
  const moduleUrl = pathToFileURL(absolutePath).href;
  if (!maracaEsmModuleCache.has(moduleUrl)) {
    maracaEsmModuleCache.set(moduleUrl, import(moduleUrl).then((moduleApi) => moduleApi.default || moduleApi));
  }
  return maracaEsmModuleCache.get(moduleUrl);
}

function createDomCommitHarness() {
  const commits = [];
  const disposals = [];
  const renderer = {
    commit(request) {
      commits.push(request);
      const target = request && request.target;
      const descriptor = request && request.descriptor || {};
      const attributes = descriptor.attributes || {};
      Object.entries(attributes).forEach(([name, value]) => {
        if (name === 'style') {
          Object.entries(value || {}).forEach(([styleName, styleValue]) => {
            if (!target || !target.style) return;
            if (typeof target.style.setProperty === 'function') target.style.setProperty(styleName, styleValue == null ? '' : String(styleValue));
            else target.style[styleName] = styleValue == null ? '' : String(styleValue);
          });
          return;
        }
        if (!target) return;
        if (value === null || value === undefined || value === false) {
          if (typeof target.removeAttribute === 'function') target.removeAttribute(name);
        } else if (typeof target.setAttribute === 'function') {
          target.setAttribute(name, value === true ? '' : String(value));
        }
      });
      return {
        schema: 'xtend.rmt.dom-commit-result.v1',
        operation: request.operation,
        target,
        nodes: target ? [target] : [],
        nodeCount: target ? 1 : 0,
        changed: true,
        structural: false,
        diagnostics: [],
        metadata: {}
      };
    },
    dispose(target, options) {
      disposals.push({ target, options });
    }
  };
  return { renderer, commits, disposals };
}

function loadRmtKernelFeatureAdoptionApi(rootDir) {
  return importRepoEsmModule('xtendrmt/rmt-kernel-feature-adoption-registry.js', rootDir);
}

async function loadRmtKernelOrchestrationControllerApi(rootDir) {
  await loadRmtKernelFeatureAdoptionApi(rootDir);
  return importRepoEsmModule('xtendrmt/rmt-kernel-orchestration-controller.js', rootDir);
}

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function capabilityKeySignature(value) {
  return Array.isArray(value) ? value.join('|') : '';
}

function assertKernelFeatureAdoptionReport(context, report, label, kernelFeatureAdoptionApi) {
  const featureAdoptionSchema = kernelFeatureAdoptionApi && kernelFeatureAdoptionApi.RMT_KERNEL_FEATURE_ADOPTION_SCHEMA;
  const featureAdoptionReportSchema = kernelFeatureAdoptionApi && kernelFeatureAdoptionApi.RMT_KERNEL_FEATURE_ADOPTION_REPORT_SCHEMA;
  const featureAdoptionCapabilityKeys = kernelFeatureAdoptionApi && kernelFeatureAdoptionApi.RMT_KERNEL_FEATURE_ADOPTION_CAPABILITY_KEYS || [];
  context.assert(Boolean(kernelFeatureAdoptionApi), `${label} loads kernel feature adoption registry contract`);
  context.assert(report && report.schema === featureAdoptionReportSchema, `${label} uses kernel feature adoption report schema`);
  context.assert(report && report.contract === featureAdoptionSchema, `${label} references kernel feature adoption contract`);
  context.assert(
    capabilityKeySignature(report && report.capabilityKeys) === capabilityKeySignature(featureAdoptionCapabilityKeys),
    `${label} exposes the shared kernel feature capability keys`
  );
  context.assert(
    report && Array.isArray(report.capabilities) && report.capabilities.length === featureAdoptionCapabilityKeys.length,
    `${label} exposes every kernel feature capability`
  );
  context.assert(
    report && report.capabilities.every((capability) => (
      typeof capability.supported === 'boolean'
      && typeof capability.runtimeRequired === 'boolean'
      && typeof capability.diagnosticsRequired === 'boolean'
      && typeof capability.strictFallbackAllowed === 'boolean'
      && Object.prototype.hasOwnProperty.call(capability, 'prodDefault')
    )),
    `${label} normalizes capability status fields`
  );
}

function assertKernelProductSurfaceReport(context, report, label, expectedBootMode = null) {
  context.assert(report && report.schema === 'xtend.maraca.kernel-product-surface-bootstrap.v1', `${label} uses product-surface bootstrap schema`);
  if (expectedBootMode) {
    context.assert(report && report.bootMode === expectedBootMode, `${label} records ${expectedBootMode} boot mode`);
  }
  context.assert(report && report.supported === true, `${label} reports Product Surface support`);
  context.assert(report && Array.isArray(report.entryPoints) && report.entryPoints.length > 0, `${label} exposes Product Surface entry points`);
  context.assert(report && report.entryPointNames.includes('createRmtRuntime'), `${label} exposes createRmtRuntime entry point`);
  context.assert(report && report.entryPointNames.includes('createRmtCore'), `${label} exposes createRmtCore entry point`);
  context.assert(report && report.runtimeFactories && report.runtimeFactories.createRuntime === true, `${label} exposes runtime factory evidence`);
  context.assert(report && report.runtimeFactories && report.runtimeFactories.createCore === true, `${label} exposes core factory evidence`);
  context.assert(report && report.runtimeFactories && report.runtimeFactories.createPerformanceRuntime === true, `${label} exposes performance runtime factory evidence`);
  context.assert(report && report.optionalCompat && Object.prototype.hasOwnProperty.call(report.optionalCompat, 'browserHostAdapter'), `${label} exposes optional compat snapshot`);
}

function assertTemplateArtifactsReport(context, report, label, expectedDocumentId = 'demo.maraca') {
  context.assert(report && report.schema === MARACA_TEMPLATE_ARTIFACTS_REPORT_SCHEMA, `${label} uses template artifacts report schema`);
  context.assert(report && report.supported === true, `${label} reports kernel Template Artifacts support`);
  context.assert(report && report.status === 'prepared' || report && report.status === 'bundle_embedded', `${label} is prepared`);
  context.assert(report && report.trusted === true, `${label} marks bundled artifacts as trusted`);
  context.assert(report && Array.isArray(report.documentIds) && report.documentIds.includes(expectedDocumentId), `${label} exposes compiler document id`);
  context.assert(report && Array.isArray(report.templateIds) && report.templateIds.includes(`template:${expectedDocumentId}`), `${label} exposes compiler template id`);
  context.assert(report && typeof report.sourceFingerprint === 'string' && report.sourceFingerprint.startsWith('sha256:'), `${label} exposes source fingerprint`);
  context.assert(report && typeof report.artifactBundleFingerprint === 'string' && report.artifactBundleFingerprint.startsWith('fnv1a:'), `${label} exposes artifact bundle fingerprint`);
  context.assert(report && Array.isArray(report.runtimeProfileHints) && report.runtimeProfileHints.includes('browser'), `${label} exposes browser runtime profile hint`);
  context.assert(report && report.runtimeProfileHints.includes('worker_prerender'), `${label} exposes worker prerender runtime profile hint`);
  context.assert(report && report.artifactBundle && report.artifactBundle.kind === 'rmt_template_artifact_bundle', `${label} embeds a kernel-compatible artifact bundle`);
  context.assert(
    report && report.sourceToSea && report.sourceToSea.documentIdsMatchCompiler === true,
    `${label} keeps compiler and artifact document ids aligned`
  );
}

function assertMaracaPerformanceReport(context, report, label, options = {}) {
  const expectedBudgets = ['visible_commit', 'command_turnaround', 'hydration_followup', 'retained_warm_reuse'];
  context.assert(report && report.schema === MARACA_PERFORMANCE_REPORT_SCHEMA, `${label} uses performance report schema`);
  context.assert(report && report.supported === true, `${label} uses the RMT Performance Runtime factory`);
  context.assert(report && report.factory && report.factory.source === 'rmt-runtime', `${label} records the RMT runtime as performance source`);
  context.assert(
    report && expectedBudgets.every((budgetId) => Array.isArray(report.budgetClasses) && report.budgetClasses.includes(budgetId)),
    `${label} exposes canonical XTend performance budget classes`
  );
  context.assert(
    report && report.budgetSnapshot && Array.isArray(report.budgetSnapshot.budgets)
      && expectedBudgets.every((budgetId) => report.budgetSnapshot.budgets.some((budget) => budget.budgetId === budgetId)),
    `${label} evaluates every canonical performance budget`
  );
  context.assert(
    report && Array.isArray(report.budgetProfiles)
      && expectedBudgets.every((budgetId) => report.budgetProfiles.some((profile) => profile.budgetId === budgetId)),
    `${label} exposes Kernel budget profiles`
  );
  context.assert(
    report && Array.isArray(report.budgetMissDiagnostics)
      && report.budgetMissDiagnostics.some((diagnostic) => diagnostic.budgetId === 'command_turnaround' && diagnostic.severity === 'warning' && Array.isArray(diagnostic.violations)),
    `${label} records budget misses as structured diagnostics`
  );
  context.assert(report && report.backpressureProfile && report.backpressureProfile.kind === 'rmt_backpressure_profile', `${label} includes Kernel backpressure profile`);
  context.assert(report && report.ciSummary && report.ciSummary.kind === 'rmt_performance_ci_summary', `${label} includes Kernel CI summary`);
  context.assert(report && report.ciSummary && typeof report.ciSummary.text === 'string' && report.ciSummary.text.includes('XTend Maraca Performance Summary'), `${label} CI summary is release-readable`);
  context.assert(report && report.fileArtifact && report.fileArtifact.kind === 'rmt_performance_file_artifact', `${label} summarizes Kernel file artifact`);
  context.assert(report && report.fileArtifact && report.fileArtifact.artifactType === 'run_report', `${label} file artifact is a run report`);
  context.assert(report && report.baselineComparison && report.baselineComparison.kind === 'rmt_performance_baseline_comparison', `${label} includes baseline comparison`);
  context.assert(report && report.summary && report.summary.violationCount >= 1, `${label} summarizes performance violations`);
  if (options.runtimeExpectedStatus) {
    context.assert(report && report.runtimeExpectedStatus === options.runtimeExpectedStatus, `${label} records ${options.runtimeExpectedStatus} expected runtime status`);
    context.assert(report && report.summary && report.summary.runtimeExpectedStatus === options.runtimeExpectedStatus, `${label} summary mirrors ${options.runtimeExpectedStatus} expected runtime status`);
  }
  if (options.bundleFingerprint) {
    context.assert(report && typeof report.bundleFingerprint === 'string' && report.bundleFingerprint.startsWith('sha256:'), `${label} includes bundle fingerprint`);
  }
}

function assertProductionClosureReport(context, report, label, expectedProfile = 'production') {
  const expectedEnforced = expectedProfile === 'production' || expectedProfile === 'max';
  context.assert(report && report.schema === MARACA_PRODUCTION_BUNDLE_CLOSURE_SCHEMA, `${label} uses production bundle closure schema`);
  context.assert(report && report.ok === true, `${label} marks production closure ready`);
  context.assert(report && report.profile === expectedProfile, `${label} records ${expectedProfile} profile`);
  context.assert(report && report.enforced === expectedEnforced, `${label} records expected enforcement mode`);
  context.assert(report && Array.isArray(report.capabilities) && report.capabilities.length >= 8, `${label} exposes capability matrix`);
  ['kernel', 'lifecycle', 'telemetry', 'performance', 'policyParity', 'prewarmWorker', 'warmReentry', 'prerender'].forEach((key) => {
    const capability = report && report.capabilities.find((entry) => entry.key === key);
    context.assert(Boolean(capability), `${label} includes ${key} capability`);
    context.assert(typeof capability.supported === 'boolean' && typeof capability.active === 'boolean', `${label} ${key} exposes supported/active`);
    context.assert(typeof capability.degraded === 'boolean' && typeof capability.blocked === 'boolean', `${label} ${key} exposes degraded/blocked`);
    context.assert(Array.isArray(capability.diagnostics), `${label} ${key} exposes diagnostics`);
    context.assert(typeof capability.runtimeExpectedStatus === 'string' && capability.runtimeExpectedStatus.length > 0, `${label} ${key} exposes runtime expected status`);
  });
  context.assert(report && report.releaseConstraint && report.releaseConstraint.blocked === false, `${label} release constraint passes`);
  context.assert(report && report.bundleBudget && report.bundleBudget.ok === true, `${label} links bundle budget pass`);
  context.assert(report && report.bundleBudget && report.bundleBudget.runtimeExpectedStatus === 'booted', `${label} links budget to runtime expected status`);
  context.assert(report && report.sourceToSea && typeof report.sourceToSea.sourceFingerprint === 'string' && report.sourceToSea.sourceFingerprint.startsWith('sha256:'), `${label} exposes source fingerprint`);
  context.assert(report && report.sourceToSea && Array.isArray(report.sourceToSea.links) && report.sourceToSea.links.length === report.capabilityCount, `${label} exposes Source-to-Sea capability links`);
  context.assert(report && report.sourceToSea && Array.isArray(report.sourceToSea.tests) && report.sourceToSea.tests.some((entry) => entry.includes('maraca-bundle-report')), `${label} links release tests`);
}

function createCliIo() {
  const stdout = [];
  const stderr = [];
  return {
    stdout: {
      write(value) {
        stdout.push(value);
      }
    },
    stderr: {
      write(value) {
        stderr.push(value);
      }
    },
    readStdout() {
      return stdout.join('');
    },
    readStderr() {
      return stderr.join('');
    }
  };
}

function copyCanonicalKernelSourceCheckout(rootDir) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-maraca-kernel-source-'));
  const sourceManifest = readJson('xtendrmt/kernel/rmt-kernel-sources.json', rootDir);
  const sourcePaths = new Set([
    'xtendrmt/kernel/rmt-kernel-sources.json',
    'xtendrmt/package.json',
    'xtendrmt/rmt-dom-descriptor-renderer.js',
    'xtendrmt/rmt-dom-descriptor-renderer.d.ts'
  ]);
  (sourceManifest.modules || []).forEach((entry) => {
    if (entry && entry.sourcePath) sourcePaths.add(entry.sourcePath);
  });
  Object.values(sourceManifest.bundle || {}).forEach((sourcePath) => {
    if (typeof sourcePath === 'string') sourcePaths.add(sourcePath);
  });
  sourcePaths.forEach((relativePath) => {
    const sourcePath = resolveRepoPath(relativePath, rootDir);
    const targetPath = path.join(tempRoot, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  });
  return tempRoot;
}

function runMaracaKernelSourceIndependenceProbe(rootDir) {
  const tempRoot = copyCanonicalKernelSourceCheckout(rootDir);
  const poisonManifest = JSON.stringify({
    entryPoints: { appModulesFactories: { performanceRuntime: 'createPoisonPerformanceRuntime' } }
  });
  const poisonBrowserRuntime = 'throw new Error("generated browser runtime was used as source");\n';
  const poisonEsmRuntime = 'throw new Error("generated ESM runtime was used as source");\n';
  try {
    fs.writeFileSync(path.join(tempRoot, 'xtendrmt/rmt-manifest.json'), poisonManifest);
    fs.writeFileSync(path.join(tempRoot, 'xtendrmt/rmt-runtime.browser.js'), poisonBrowserRuntime);
    fs.writeFileSync(path.join(tempRoot, 'xtendrmt/rmt-runtime.esm.js'), poisonEsmRuntime);

    const manifestArtifact = createRmtKernelSourceArtifact({
      rootDir: tempRoot,
      artifactPath: 'xtendrmt/rmt-manifest.json'
    });
    const browserArtifact = createRmtKernelSourceArtifact({
      rootDir: tempRoot,
      artifactPath: 'xtendrmt/rmt-runtime.browser.js'
    });
    const esmArtifact = createRmtKernelSourceArtifact({
      rootDir: tempRoot,
      artifactPath: 'xtendrmt/rmt-runtime.esm.js'
    });
    const performanceReport = createMaracaPerformanceReport({ rootDir: tempRoot });
    const outputDir = path.join(tempRoot, 'maraca-output');
    const build = buildMaracaBundle({
      sourceText: readText(MARACA_FIXTURE, rootDir),
      virtualSourcePath: MARACA_FIXTURE,
      out: outputDir,
      profile: 'debug',
      lazy: 'none',
      css: 'inline',
      orchestration: 'strict',
      kernel: 'strict'
    }, { rootDir: tempRoot });
    const runtimeAsset = build.bundleReport && build.bundleReport.bundleFiles.find((entry) => (
      entry.fileName === MARACA_KERNEL_RUNTIME_ASSET
    ));
    const runtimeAssetSource = runtimeAsset
      ? fs.readFileSync(path.join(tempRoot, runtimeAsset.path), 'utf8')
      : '';

    return {
      schema: 'xtend.maraca.kernel-source-independence.v1',
      sourceArtifactSchema: RMT_KERNEL_SOURCE_ARTIFACT_SCHEMA,
      manifestArtifact,
      browserArtifact,
      esmArtifact,
      performanceReport,
      build,
      runtimeAssetSource,
      generatedInputsUnchanged: fs.readFileSync(path.join(tempRoot, 'xtendrmt/rmt-manifest.json'), 'utf8') === poisonManifest
        && fs.readFileSync(path.join(tempRoot, 'xtendrmt/rmt-runtime.browser.js'), 'utf8') === poisonBrowserRuntime
        && fs.readFileSync(path.join(tempRoot, 'xtendrmt/rmt-runtime.esm.js'), 'utf8') === poisonEsmRuntime
    };
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function expectedPackagedEsmSource(source) {
  return String(source || '').replace(
    /(\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"])(\.[^'"]+)\.js(['"])/gu,
    '$1$2.mjs$3'
  );
}

function planFixture(rootDir, overrides = {}) {
  return createMaracaBuildPlan({
    source: MARACA_FIXTURE,
    out: MARACA_OUT_DIR,
    profile: 'production',
    lazy: 'component',
    css: 'inline',
    ...overrides
  }, { rootDir });
}

function buildFixtureAsync(rootDir, overrides = {}) {
  return buildMaracaBundleAsync({
    source: MARACA_FIXTURE,
    out: MARACA_OUT_DIR,
    profile: 'production',
    lazy: 'component',
    css: 'inline',
    ...overrides
  }, { rootDir });
}

function requestText(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      const chunks = [];
      response.setEncoding('utf8');
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({
        statusCode: response.statusCode,
        headers: response.headers,
        body: chunks.join('')
      }));
    });
    request.on('error', reject);
    request.setTimeout(5000, () => {
      request.destroy(new Error(`Timed out requesting ${url}`));
    });
  });
}

function planOrchestrationFixture(rootDir, overrides = {}) {
  return createMaracaBuildPlan({
    source: MARACA_ORCHESTRATION_FIXTURE,
    out: MARACA_ORCHESTRATION_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    ...overrides
  }, { rootDir });
}

function buildOrchestrationFixtureAsync(rootDir, overrides = {}) {
  return buildMaracaBundleAsync({
    source: MARACA_ORCHESTRATION_FIXTURE,
    out: MARACA_ORCHESTRATION_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    ...overrides
  }, { rootDir });
}

function planKernelOrchestrationFixture(rootDir, overrides = {}) {
  return createMaracaBuildPlan({
    source: MARACA_ORCHESTRATION_FIXTURE,
    out: MARACA_KERNEL_ORCHESTRATION_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    ...overrides
  }, { rootDir });
}

function buildKernelOrchestrationFixtureAsync(rootDir, overrides = {}) {
  return buildMaracaBundleAsync({
    source: MARACA_ORCHESTRATION_FIXTURE,
    out: MARACA_KERNEL_ORCHESTRATION_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    ...overrides
  }, { rootDir });
}

function planKernelIntegrityFixture(rootDir, overrides = {}) {
  return createMaracaBuildPlan({
    source: MARACA_KERNEL_INTEGRITY_FIXTURE,
    out: MARACA_KERNEL_INTEGRITY_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'off',
    transitions: 'strict',
    ...overrides
  }, { rootDir });
}

function buildKernelIntegrityFixtureAsync(rootDir, overrides = {}) {
  return buildMaracaBundleAsync({
    source: MARACA_KERNEL_INTEGRITY_FIXTURE,
    out: MARACA_KERNEL_INTEGRITY_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'off',
    transitions: 'strict',
    ...overrides
  }, { rootDir });
}

function planValidationFixture(rootDir, overrides = {}) {
  return createMaracaBuildPlan({
    source: MARACA_VALIDATION_FIXTURE,
    out: MARACA_VALIDATION_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'strict',
    ...overrides
  }, { rootDir });
}

function buildValidationFixtureAsync(rootDir, overrides = {}) {
  return buildMaracaBundleAsync({
    source: MARACA_VALIDATION_FIXTURE,
    out: MARACA_VALIDATION_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'strict',
    ...overrides
  }, { rootDir });
}

function planTransitionFixture(rootDir, overrides = {}) {
  return createMaracaBuildPlan({
    source: MARACA_TRANSITIONS_FIXTURE,
    out: MARACA_TRANSITIONS_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'off',
    transitions: 'strict',
    ...overrides
  }, { rootDir });
}

function buildTransitionFixtureAsync(rootDir, overrides = {}) {
  return buildMaracaBundleAsync({
    source: MARACA_TRANSITIONS_FIXTURE,
    out: MARACA_TRANSITIONS_OUT_DIR,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'off',
    transitions: 'strict',
    ...overrides
  }, { rootDir });
}

function runMaracaPlanSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-plan',
    label: 'XTend Maraca Build Plan'
  });
  const plan = planFixture(rootDir);
  const maxPlan = planFixture(rootDir, { profile: 'max' });
  const changedSourceText = readText(MARACA_FIXTURE, rootDir).replace('text "Ready"', 'text "Ready RKFA-02"');
  const changedTemplatePlan = createMaracaBuildPlan({
    sourceText: changedSourceText,
    virtualSourcePath: MARACA_FIXTURE,
    out: '.xtend-build/maraca/template-artifacts-changed',
    profile: 'production',
    lazy: 'component',
    css: 'inline'
  }, { rootDir });
  const unknownPlan = createMaracaBuildPlan({
    source: MARACA_UNKNOWN_FIXTURE,
    out: MARACA_OUT_DIR,
    profile: 'production',
    lazy: 'component',
    css: 'inline'
  }, { rootDir });
  const allowedUnknownPlan = createMaracaBuildPlan({
    source: MARACA_UNKNOWN_FIXTURE,
    out: MARACA_OUT_DIR,
    allowDynamicComponents: true
  }, { rootDir });
  const unsafeDynamicPlan = createMaracaBuildPlan({
    sourceText: readText(MARACA_FIXTURE, rootDir).replace('component x-status', 'component script'),
    virtualSourcePath: MARACA_FIXTURE,
    out: MARACA_OUT_DIR,
    allowDynamicComponents: true
  }, { rootDir });
  const nativePlan = createMaracaBuildPlan({
    source: MARACA_NATIVE_FIXTURE,
    out: MARACA_OUT_DIR,
    profile: 'production',
    lazy: 'component',
    css: 'external',
    orchestration: 'strict',
    kernel: 'off',
    hydration: 'off',
    validation: 'off',
    transitions: 'off'
  }, { rootDir });
  const orchestrationOffPlan = planFixture(rootDir, { orchestration: 'off' });
  const kernelOffPlan = planFixture(rootDir, { kernel: 'off' });
  const warmReentryPlan = createMaracaBuildPlan({
    source: MARACA_WARM_REENTRY_FIXTURE,
    out: '.xtend-build/maraca/warm-reentry',
    profile: 'debug',
    lazy: 'component',
    css: 'inline',
    allowDynamicComponents: true
  }, { rootDir });
  const kernelSourceIndependence = runMaracaKernelSourceIndependenceProbe(rootDir);
  const maracaGeneratorSource = readText(MARACA_MODULE_PATH, rootDir);

  assertFileExists(context, MARACA_MODULE_PATH, rootDir, 'Maraca module exists');
  assertFileExists(context, MARACA_RUNTIME_PATH, rootDir, 'Maraca runtime helper exists');
  assertFileExists(context, MARACA_FIXTURE, rootDir, 'Maraca known-component fixture exists');
  assertFileExists(context, MARACA_NATIVE_FIXTURE, rootDir, 'Maraca native HTML component fixture exists');
  assertFileExists(context, MARACA_ORCHESTRATION_FIXTURE, rootDir, 'Maraca orchestration fixture exists');
  context.assert(syntaxCheckFile(MARACA_MODULE_PATH, { rootDir, extension: '.js' }).ok, 'Maraca module syntax passes');
  context.assert(syntaxCheckFile(MARACA_RUNTIME_PATH, { rootDir, extension: '.js' }).ok, 'Maraca runtime helper syntax passes');
  context.assert(
    maracaGeneratorSource.includes("assembleRmtSourceArtifact(sourceRoot, 'xtendrmt/rmt-manifest.json')")
      && maracaGeneratorSource.includes("assembleRmtSourceArtifact(sourceRoot, 'xtendrmt/rmt-runtime.browser.js')")
      && maracaGeneratorSource.includes("assembleRmtSourceArtifact(plan.rootDir, 'xtendrmt/rmt-runtime.esm.js')"),
    'Maraca resolves manifest, performance runtime and bundled Kernel runtime through the KernelLab source assembler'
  );
  context.assert(
    kernelSourceIndependence.manifestArtifact.schema === RMT_KERNEL_SOURCE_ARTIFACT_SCHEMA
      && kernelSourceIndependence.manifestArtifact.ok === true
      && kernelSourceIndependence.browserArtifact.ok === true
      && kernelSourceIndependence.esmArtifact.ok === true,
    'KernelLab assembles every Maraca Kernel input from canonical sources in an output-independent checkout'
  );
  context.assert(
    kernelSourceIndependence.manifestArtifact.versionSource === 'source-package'
      && kernelSourceIndependence.manifestArtifact.sourceManifestPath === 'xtendrmt/kernel/rmt-kernel-sources.json',
    'Maraca Kernel artifacts derive version and topology from canonical source metadata'
  );
  context.assert(
    JSON.parse(kernelSourceIndependence.manifestArtifact.content).entryPoints.appModulesFactories.performanceRuntime === 'createRmtPerformanceRuntime',
    'Maraca ignores a poisoned generated RMT manifest'
  );
  context.assert(
    kernelSourceIndependence.performanceReport.supported === true
      && kernelSourceIndependence.performanceReport.factory.name === 'createRmtPerformanceRuntime',
    'Maraca evaluates Performance Runtime from canonical modules when the generated browser runtime is corrupt'
  );
  context.assert(
    kernelSourceIndependence.build.ok === true
      && kernelSourceIndependence.runtimeAssetSource === expectedPackagedEsmSource(kernelSourceIndependence.esmArtifact.content),
    'Maraca packages the exact KernelLab-assembled ESM runtime with only explicit .mjs dependency paths when the generated ESM product is corrupt'
  );
  context.assert(
    kernelSourceIndependence.generatedInputsUnchanged === true,
    'Maraca neither reads as authority nor rewrites poisoned generated RMT products during source assembly'
  );
  context.assert(plan.schema === MARACA_BUILD_PLAN_SCHEMA, 'plan uses Maraca build-plan schema');
  context.assert(plan.ok === true, `known-component plan passes${plan.ok ? '' : ` (${plan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(plan.loader && plan.loader.mode === 'inline-registry', 'plan selects inline registry loader mode');
  context.assert(plan.loader && plan.loader.usesExternalManifest === false, 'plan disables runtime component manifest loading');
  context.assert(plan.loader && plan.loader.usesXtendLoader === false, 'plan does not require the legacy XTend loader');
  context.assert(plan.components.requiredTags.join(',') === 'x-progress,x-status,x-toast', 'plan selects exactly the fixture components');
  context.assert(plan.components.selected.every((entry) => entry.known === true), 'selected components are manifest-backed');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-runtime.esm.js'), 'plan includes the RMT ESM runtime module need');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-event-routing-runtime.js'), 'plan includes the event routing runtime when RMT events exist');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-state-selector-runtime.js'), 'plan includes state selector runtime when selectors exist');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-state-binding-view-projector.js'), 'plan includes the State Binding View projector when selectors exist');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-maraca-view-projection-adapter.js'), 'plan includes the canonical Maraca View projection adapter');
  context.assert(plan.orchestration && plan.orchestration.schema === MARACA_ORCHESTRATION_PLAN_SCHEMA, 'plan records orchestration plan schema');
  context.assert(plan.orchestration && plan.orchestration.mode === 'auto', 'plan defaults orchestration mode to auto');
  context.assert(plan.orchestration && plan.orchestration.enabled === true, 'auto orchestration is enabled for complete primitive Maraca fixture');
  context.assert(plan.orchestration.summary.eventCount === 2, 'auto orchestration summarizes event count');
  context.assert(plan.kernel && plan.kernel.schema === MARACA_KERNEL_PLAN_SCHEMA, 'plan records kernel plan schema');
  context.assert(plan.kernel && plan.kernel.mode === 'auto', 'plan defaults kernel mode to auto');
  context.assert(plan.kernel && plan.kernel.enabled === true, 'auto kernel integration is enabled for complete primitive Maraca fixture');
  context.assert(plan.kernel.summary.scheduleCount >= 1, 'auto kernel integration summarizes schedule count');
  context.assert(plan.kernel.summary.fiberCount >= 1, 'auto kernel integration summarizes fiber count');
  context.assert(plan.warmReentry && plan.warmReentry.schema === MARACA_WARM_REENTRY_REPORT_SCHEMA, 'plan records Warm Reentry report schema');
  context.assert(plan.warmReentry && plan.warmReentry.supported === true, 'plan exposes Warm Reentry as optional supported capability');
  context.assert(plan.warmReentry && plan.warmReentry.backpressurePolicy.critical === 'pause-prewarm', 'plan records critical backpressure prewarm policy');
  context.assert(plan.warmReentry && plan.warmReentry.destroyInvalidation.destroySurfaceInvalidatesPrewarm === true, 'plan records prewarm invalidation on destroySurface');
  context.assert(warmReentryPlan.ok === true, `Warm Reentry fixture plan passes${warmReentryPlan.ok ? '' : ` (${warmReentryPlan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(warmReentryPlan.warmReentry && warmReentryPlan.warmReentry.enabled === true, 'prewarm lifecycle operation activates Warm Reentry report');
  context.assert(warmReentryPlan.warmReentry && warmReentryPlan.warmReentry.operationCount >= 1, 'Warm Reentry report counts prewarm operations');
  context.assert(warmReentryPlan.warmReentry && warmReentryPlan.warmReentry.supportedFiberKinds.includes('surface.prewarm'), 'Warm Reentry report declares surface.prewarm fiber support');
  assertTemplateArtifactsReport(context, plan.templateArtifacts, 'plan templateArtifacts');
  assertMaracaPerformanceReport(context, plan.performance, 'plan performance');
  context.assert(
    plan.kernel.featureAdoption.capabilities.find((capability) => capability.key === 'templateArtifacts').active === true,
    'kernel feature adoption marks Template Artifacts active when trusted artifacts are prepared'
  );
  context.assert(
    plan.kernel.featureAdoption.capabilities.find((capability) => capability.key === 'performanceAdvancedReports').active === true,
    'kernel feature adoption marks Performance Advanced Reports active when budget evidence is prepared'
  );
  context.assert(changedTemplatePlan.ok === true, 'changed source template-artifact plan still passes');
  assertTemplateArtifactsReport(context, changedTemplatePlan.templateArtifacts, 'changed source plan templateArtifacts');
  context.assert(
    changedTemplatePlan.templateArtifacts.sourceFingerprint !== plan.templateArtifacts.sourceFingerprint,
    'template artifact source fingerprint changes when source changes'
  );
  context.assert(
    changedTemplatePlan.templateArtifacts.artifactBundleFingerprint !== plan.templateArtifacts.artifactBundleFingerprint,
    'template artifact bundle fingerprint changes when template source changes'
  );
  context.assert(
    createMaracaTemplateArtifactsReport({
      rootDir,
      sourceText: readText(MARACA_FIXTURE, rootDir),
      coreDocument: plan.templateArtifacts.artifactBundle.documents[0],
      status: 'manual-smoke'
    }).schema === MARACA_TEMPLATE_ARTIFACTS_REPORT_SCHEMA,
    'template artifact report factory is exported for debug gates'
  );
  context.assert(
    createMaracaPerformanceReport({
      rootDir,
      runtimeExpectedStatus: 'report-only'
    }).schema === MARACA_PERFORMANCE_REPORT_SCHEMA,
    'performance report factory is exported for debug gates'
  );
  context.assert(plan.validation && plan.validation.schema === MARACA_VALIDATION_PLAN_SCHEMA, 'plan records validation plan schema');
  context.assert(plan.validation && plan.validation.mode === 'auto', 'plan defaults validation mode to auto');
  context.assert(plan.validation && plan.validation.enabled === false, 'auto validation stays disabled when no validation artifact exists');
  context.assert(plan.transitions && plan.transitions.schema === MARACA_TRANSITION_PLAN_SCHEMA, 'plan records transition plan schema');
  context.assert(plan.transitions && plan.transitions.mode === 'auto', 'plan defaults transition mode to auto');
  context.assert(plan.transitions && plan.transitions.enabled === false, 'auto transitions stay disabled when no transition artifact exists');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-runtime.esm.js'), 'auto kernel integration keeps the RMT kernel runtime module in the runtime graph');
  context.assert(orchestrationOffPlan.ok === true && orchestrationOffPlan.orchestration.enabled === false, 'orchestration off keeps legacy Surface mount plan available');
  context.assert(kernelOffPlan.ok === true && kernelOffPlan.kernel.enabled === false, 'kernel off keeps the non-kernel Maraca build path available');
  context.assert(plan.events.length === 2, 'plan derives public RMT events from the fixture');
  context.assert(plan.lanes.map((lane) => lane.name).sort().join(',') === 'idle,transition,visible', 'plan derives Fabric lane needs');
  context.assert(plan.publicNameReservations.includes('XTendMaraca'), 'plan reserves XTendMaraca public bridge name');
  context.assert(plan.publicNameReservations.includes('x-status') === false, 'component tags stay in component records, not bridge globals');
  context.assert(maxPlan.propertyMangling.enabled === true, 'max profile enables private-property mangling policy');
  context.assert(maxPlan.propertyMangling.reserved.includes('XTendMaraca'), 'max profile keeps public name reservations');
  context.assert(unknownPlan.ok === false, 'unknown component plan fails by default');
  context.assert(unknownPlan.components.unknown.includes('x-detail'), 'unknown plan reports x-detail');
  context.assert(unknownPlan.components.unknown.includes('x-audit'), 'unknown plan reports x-audit');
  context.assert(unknownPlan.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.component_unknown' && diagnostic.severity === 'error'), 'unknown plan emits blocking diagnostics');
  context.assert(allowedUnknownPlan.ok === true, 'unknown component plan can be explicitly allowed');
  context.assert(allowedUnknownPlan.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'), 'allowed dynamic component diagnostics are non-blocking');
  context.assert(unsafeDynamicPlan.ok === false, 'dynamic component opt-in rejects executable native tags');
  context.assert(unsafeDynamicPlan.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.dynamic_component_unsafe_tag' && diagnostic.severity === 'error' && diagnostic.tag === 'script'), 'unsafe dynamic component emits blocking diagnostic for script');
  context.assert(nativePlan.ok === true, `native HTML component plan passes strict orchestration${nativePlan.ok ? '' : ` (${nativePlan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(nativePlan.components.selected.some((entry) => entry.tag === 'img' && entry.native === true && entry.source === 'browser-native-element'), 'native img is selected as a browser-native component');
  context.assert(nativePlan.components.unknown.includes('img') === false, 'native img is not reported as an unknown dynamic component');
  context.assert(nativePlan.orchestration && nativePlan.orchestration.enabled === true, 'strict orchestration accepts native browser components');

  return context.result({
    schema: MARACA_BUILD_PLAN_SCHEMA,
    selectedComponents: plan.components.requiredTags,
    unknownComponents: unknownPlan.components.unknown
  });
}

function printMaracaPlanReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Build Plan erfolgreich.',
    failureTitle: 'XTend Maraca Build Plan fehlgeschlagen:'
  });
}

async function runMaracaBundleSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-bundle',
    label: 'XTend Maraca Bundle'
  });
  const kernelFeatureAdoptionApi = await loadRmtKernelFeatureAdoptionApi(rootDir);
  const result = await buildFixtureAsync(rootDir);
  const entryPath = result.bundleReport && result.bundleReport.entry;
  const reportPath = resolveRepoPath(`${MARACA_OUT_DIR}/xtend.maraca.report.json`, rootDir);
  const sizePath = resolveRepoPath(`${MARACA_OUT_DIR}/xtend.maraca.size.json`, rootDir);
  const entrySource = entryPath && fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const report = fs.existsSync(reportPath) ? readJson(`${MARACA_OUT_DIR}/xtend.maraca.report.json`, rootDir) : null;
  const bundleFiles = report && Array.isArray(report.bundleFiles) ? report.bundleFiles : [];
  const bundleText = bundleFiles
    .map((file) => fs.existsSync(resolveRepoPath(file.path, rootDir)) ? fs.readFileSync(resolveRepoPath(file.path, rootDir), 'utf8') : '')
    .join('\n');
  const appBundleText = bundleFiles
    .filter((file) => file.fileName !== MARACA_KERNEL_RUNTIME_ASSET)
    .map((file) => fs.existsSync(resolveRepoPath(file.path, rootDir)) ? fs.readFileSync(resolveRepoPath(file.path, rootDir), 'utf8') : '')
    .join('\n');

  context.assert(result.schema === MARACA_BUNDLE_REPORT_SCHEMA, 'bundle result uses Maraca bundle-report schema');
  context.assert(result.ok === true, `Maraca bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(Boolean(entryPath && fs.existsSync(entryPath)), 'ESM entry is written');
  context.assert(fs.existsSync(reportPath), 'bundle report is written');
  context.assert(fs.existsSync(sizePath), 'size-budget report is written');
  context.assert(report && report.schema === MARACA_BUNDLE_REPORT_SCHEMA, 'bundle report schema is stable');
  context.assert(report && report.loader && report.loader.mode === 'inline-registry', 'bundle report records inline registry mode');
  context.assert(report && report.orchestration && report.orchestration.enabled === true, 'bundle report records enabled auto orchestration');
  context.assert(report && report.orchestration && report.orchestration.artifactSchema === 'xtend.rmt.app-orchestration.v1', 'bundle report mirrors orchestration artifact schema');
  context.assert(report && report.kernel && report.kernel.enabled === true, 'bundle report records enabled auto kernel integration');
  context.assert(report && report.kernel && report.kernel.recordsSchema === 'xtend.rmt.vnext.kernel-records.v1', 'bundle report mirrors kernel records schema');
  assertKernelFeatureAdoptionReport(context, report && report.kernelFeatureAdoption, 'bundle report kernelFeatureAdoption', kernelFeatureAdoptionApi);
  assertKernelFeatureAdoptionReport(context, report && report.kernel && report.kernel.featureAdoption, 'bundle report kernel.featureAdoption', kernelFeatureAdoptionApi);
  assertProductionClosureReport(context, report && report.productionClosure, 'bundle report productionClosure');
  assertProductionClosureReport(context, report && report.kernelFeatureAdoptionClosure, 'bundle report kernelFeatureAdoptionClosure');
  assertKernelProductSurfaceReport(context, report && report.kernel && report.kernel.productSurface, 'bundle report kernel.productSurface', 'direct');
  context.assert(report && report.panicRecovery && report.panicRecovery.schema === 'xtend.maraca.kernel-panic-recovery-report.v1', 'bundle report exposes Panic/Recovery report');
  context.assert(report && report.panicRecovery && report.panicRecovery.lane === 'diagnostics', 'bundle report routes Panic/Recovery through diagnostics lane');
  context.assert(report && report.panicRecovery && report.panicRecovery.devApis.includes('getPanicRecoverySnapshot'), 'bundle report documents Panic/Recovery snapshot dev API');
  context.assert(report && report.trustedDom && report.trustedDom.schema === 'xtend.maraca.kernel-trusted-dom-report.v1', 'bundle report exposes Trusted DOM report');
  context.assert(report && report.trustedDom && report.trustedDom.verdictSchema === 'xtend.rmt.kernel-trust-verdict.v1', 'bundle report preserves Trust Verdict schema');
  context.assert(report && report.policyParity && report.policyParity.schema === 'xtend.rmt.kernel-policy-parity-report.v1', 'bundle report exposes Policy Parity report');
  context.assert(report && report.policyParity && report.policyParity.ok === true, 'bundle report marks Policy Parity ready');
  context.assert(report && report.policyParity && report.policyParity.driftCount === 0, 'bundle report exposes zero Policy Parity drift');
  context.assert(report && report.policyParity && Array.isArray(report.policyParity.requiredFactories) && report.policyParity.requiredFactories.includes('commitTrustedHtml'), 'bundle report lists Policy Parity required factories');
  context.assert(report && report.kernel && report.kernel.security && report.kernel.security.schema === 'xtend.maraca.kernel-security-report.v1', 'bundle report exposes kernel.security report');
  context.assert(report && report.kernel && report.kernel.security && report.kernel.security.panicRecovery && report.kernel.security.panicRecovery.strictDiagnostics.recoveryOutcome === true, 'bundle report kernel.security separates Recovery Outcome diagnostics');
  context.assert(report && report.kernel && report.kernel.security && report.kernel.security.trustedDom && report.kernel.security.trustedDom.strictDiagnostics.trustVerdict === true, 'bundle report kernel.security separates Trust Verdict diagnostics');
  context.assert(report && report.kernel && report.kernel.security && report.kernel.security.policyParity && report.kernel.security.policyParity.requiredFactories.includes('commitTrustedHtml'), 'bundle report kernel.security includes Policy Parity required factories');
  assertTemplateArtifactsReport(context, report && report.templateArtifacts, 'bundle report templateArtifacts');
  assertMaracaPerformanceReport(context, report && report.performance, 'bundle report performance', {
    runtimeExpectedStatus: 'booted',
    bundleFingerprint: true
  });
  context.assert(
    report && report.hydration && report.hydration.serverPrerender && report.hydration.serverPrerender.schema === 'xtend.maraca.server-prerender-interop.v1',
    'bundle report exposes server prerender interop report'
  );
  context.assert(
    report && report.hydration && report.hydration.serverPrerender && report.hydration.serverPrerender.hydrateResponseCompatible === true,
    'bundle report marks server prerender responses as hydrateResponse compatible'
  );
  context.assert(
    report && report.hydration && report.hydration.serverPrerender && report.hydration.serverPrerender.adapterKinds.some((adapter) => adapter.kind === 'node-ssr' && adapter.supportStatus === 'supported' && adapter.hydrateResponseCompatible === true),
    'bundle report names Node SSR adapter as compatible server prerender provider'
  );
  context.assert(
    report && report.hydration && report.hydration.serverPrerender && report.hydration.serverPrerender.adapterKinds.some((adapter) => adapter.kind === 'php-ssr' && adapter.supportStatus === 'supported' && adapter.hydrateResponseCompatible === true),
    'bundle report names PHP SSR adapter as compatible server prerender provider'
  );
  context.assert(
    report && report.hydration && report.hydration.summary && report.hydration.summary.hydrateResponseCompatible === true,
    'bundle hydration summary mirrors hydrateResponse compatibility'
  );
  context.assert(
    report && report.templateArtifacts && typeof report.templateArtifacts.bundleFingerprint === 'string' && report.templateArtifacts.bundleFingerprint.startsWith('sha256:'),
    'bundle report templateArtifacts exposes final Maraca bundle fingerprint'
  );
  context.assert(
    report && report.templateArtifacts && report.templateArtifacts.registration && report.templateArtifacts.registration.status === 'bundle_embedded',
    'bundle report marks trusted template artifact bundle as embedded for runtime registration'
  );
  context.assert(
    report.kernelFeatureAdoption.capabilities.find((capability) => capability.key === 'templateArtifacts').active === true,
    'bundle report feature adoption marks Template Artifacts active'
  );
  context.assert(
    report.kernelFeatureAdoption.capabilities.find((capability) => capability.key === 'performanceAdvancedReports').active === true,
    'bundle report feature adoption marks Performance Advanced Reports active'
  );
  context.assert(
    report && report.kernel && report.kernel.performanceSummary && report.kernel.performanceSummary.runtimeExpectedStatus === 'booted',
    'bundle report kernel section mirrors performance runtime expected status'
  );
  context.assert(
    capabilityKeySignature(report && report.kernelFeatureAdoption && report.kernelFeatureAdoption.capabilityKeys)
      === capabilityKeySignature(report && report.kernel && report.kernel.featureAdoption && report.kernel.featureAdoption.capabilityKeys),
    'bundle report and kernel section use the same feature adoption capability keys'
  );
  context.assert(report && report.toolchain && report.toolchain.active === 'rollup-terser', 'bundle uses the Rollup/Terser toolchain');
  context.assert(report && report.toolchain && report.toolchain.rollup && report.toolchain.rollup.available === true, 'Rollup is available in Maraca report');
  context.assert(report && report.toolchain && report.toolchain.terser && report.toolchain.terser.available === true, 'Terser is available in Maraca report');
  context.assert(report && report.forbiddenRuntimeDependencies.componentManifestJson === false, 'bundle report rejects component manifest runtime dependency');
  context.assert(!bundleText.includes('components/manifest.json'), 'bundle does not reference the component manifest JSON file');
  context.assert(!bundleText.includes('data-manifest'), 'bundle does not reference a data-manifest attribute');
  context.assert(!bundleText.includes('xtend-loader.js'), 'bundle does not reference the legacy loader file');
  context.assert(bundleFiles.some((file) => file.fileName === MARACA_KERNEL_RUNTIME_ASSET), 'bundle package includes the RMT kernel runtime as an explicit ESM asset');
  context.assert(bundleFiles.some((file) => file.fileName === 'runtime/xtend-maraca-plan-runtime.mjs'), 'bundle package includes the canonical Maraca Plan Runtime asset');
  context.assert(bundleFiles.some((file) => file.fileName === 'runtime/xtend-maraca-browser-composition-runtime.mjs'), 'bundle package includes the canonical Maraca browser composition root');
  context.assert(bundleFiles.some((file) => file.fileName === 'runtime/browser-host-adapter.mjs'), 'bundle package includes the canonical Maraca browser host adapter');
  context.assert(bundleFiles.some((file) => file.fileName.includes('x-status')), 'bundle writes an x-status lazy chunk');
  context.assert(bundleFiles.some((file) => file.fileName.includes('x-toast')), 'bundle writes an x-toast lazy chunk');
  context.assert(bundleFiles.some((file) => file.fileName.includes('x-progress')), 'bundle writes an x-progress lazy chunk');
  context.assert(!appBundleText.includes('x-modal'), 'bundle excludes unused x-modal module from app chunks');
  context.assert(!bundleFiles.some((file) => file.fileName.includes('x-button')), 'bundle excludes unused x-button lazy chunk');
  context.assert(entrySource.includes('window.XTendMaraca'), 'entry exposes the documented XTendMaraca bridge');
  context.assert(entrySource.includes('MARACA_ORCHESTRATION'), 'entry includes orchestration bootstrap metadata');
  context.assert(entrySource.includes('MARACA_TEMPLATE_ARTIFACTS'), 'entry includes template artifact bootstrap metadata');
  context.assert(entrySource.includes('productionClosure'), 'entry includes production closure bootstrap metadata');
  context.assert(appBundleText.includes('xtend-maraca:template-artifacts'), 'host adapter emits guarded template artifact runtime registration telemetry');
  context.assert(appBundleText.includes('__XTendMaracaTemplateArtifactsRegistration'), 'composition root exposes a read-only template artifact registration debug snapshot');
  context.assert(entrySource.includes('import('), 'default lazy build uses native ESM import chunks');
  context.assert(appBundleText.includes('IntersectionObserver'), 'browser host adapter supports viewport-driven lazy component loading');
  context.assert(!entrySource.includes('Promise.all(MARACA_COMPONENTS.map'), 'boot path avoids unconditional eager Promise.all component loading');

  return context.result({
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    entry: entryPath,
    bytes: result.bundleReport && result.bundleReport.bytes
  });
}

function printMaracaBundleReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Bundle erfolgreich.',
    failureTitle: 'XTend Maraca Bundle fehlgeschlagen:'
  });
}

async function runMaracaRmtSourceToBundleSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-rmt-source-to-bundle',
    label: 'XTend Maraca RMT Source-to-Bundle CLI'
  });
  const planIo = createCliIo();
  const buildIo = createCliIo();
  const rmtIo = createCliIo();
  const serveIo = createCliIo();
  const serveHelpIo = createCliIo();
  const planStatus = await runCliAsync(['maraca', 'plan', MARACA_FIXTURE, '--json'], planIo);
  const buildStatus = await runCliAsync([
    'maraca',
    'build',
    MARACA_FIXTURE,
    '--out',
    MARACA_OUT_DIR,
    '--profile',
    'production',
    '--lazy',
    'component',
    '--css',
    'inline',
    '--json'
  ], buildIo);
  const rmtStatus = await runCliAsync([
    'rmt',
    'build',
    MARACA_FIXTURE,
    '--bundle',
    'maraca',
    '--out',
    MARACA_RMT_OUT_DIR,
    '--json'
  ], rmtIo);
  const serveStatus = await runCliAsync([
    'serve',
    '--root',
    resolveRepoPath(MARACA_RMT_OUT_DIR, rootDir),
    '--port',
    '0',
    '--check',
    '--json'
  ], serveIo);
  const serveHelpStatus = await runCliAsync(['serve', '--help'], serveHelpIo);
  const planJson = JSON.parse(planIo.readStdout());
  const buildJson = JSON.parse(buildIo.readStdout());
  const rmtJson = JSON.parse(rmtIo.readStdout());
  const serveJson = JSON.parse(serveIo.readStdout());
  const maracaHostPath = resolveRepoPath(`${MARACA_OUT_DIR}/index.html`, rootDir);
  const rmtHostPath = resolveRepoPath(`${MARACA_RMT_OUT_DIR}/index.html`, rootDir);
  const maracaHost = fs.readFileSync(maracaHostPath, 'utf8');

  context.assert(planStatus === 0, 'xt maraca plan exits successfully');
  context.assert(planJson.schema === MARACA_BUILD_PLAN_SCHEMA && planJson.ok === true, 'xt maraca plan returns JSON build plan');
  context.assert(buildStatus === 0, 'xt maraca build exits successfully');
  context.assert(buildJson.schema === MARACA_BUNDLE_REPORT_SCHEMA && buildJson.ok === true, 'xt maraca build returns JSON bundle result');
  context.assert(rmtStatus === 0, 'xt rmt build --bundle maraca exits successfully');
  context.assert(rmtJson.schema === MARACA_BUNDLE_REPORT_SCHEMA && rmtJson.ok === true, 'xt rmt build --bundle maraca returns JSON bundle result');
  context.assert(fs.existsSync(resolveRepoPath(`${MARACA_RMT_OUT_DIR}/xtend.maraca.mjs`, rootDir)), 'RMT one-step command writes Maraca ESM entry');
  context.assert(fs.existsSync(maracaHostPath) && fs.existsSync(rmtHostPath) && buildJson.plan.outputs.host === maracaHostPath && rmtJson.plan.outputs.host === rmtHostPath, 'both Maraca CLI build paths write the generic HTML host');
  context.assert(maracaHost.includes('id="xtend-maraca-root"') && maracaHost.includes('data-maraca-root') && maracaHost.includes('<script type="module" src="./xtend.maraca.mjs"></script>') && !maracaHost.includes('material'), 'generic HTML host uses only design-neutral Maraca boot contracts');
  context.assert(serveStatus === 0 && serveJson.schema === 'xtend.local-dev-server.v1' && serveJson.ok && serveJson.status === 'checked' && serveJson.defaultPath === 'index.html', 'xt serve accepts a non-Material Maraca output with default options');
  context.assert(serveHelpStatus === 0 && serveHelpIo.readStdout().includes('XTend Local App Server') && serveHelpIo.readStdout().includes('Default: index.html'), 'xt serve exposes its command-specific help');
  context.assert(planIo.readStderr() === '', 'plan command has no stderr output');
  context.assert(buildIo.readStderr() === '', 'build command has no stderr output');
  context.assert(rmtIo.readStderr() === '', 'rmt build command has no stderr output');
  context.assert(serveIo.readStderr() === '', 'serve command has no stderr output');

  return context.result({
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    cliCommands: [
      'xt maraca plan',
      'xt maraca build',
      'xt rmt build --bundle maraca'
    ]
  });
}

function printMaracaRmtSourceToBundleReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca RMT Source-to-Bundle CLI erfolgreich.',
    failureTitle: 'XTend Maraca RMT Source-to-Bundle CLI fehlgeschlagen:'
  });
}

async function runMaracaOrchestrationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-orchestration',
    label: 'XTend Maraca App Orchestration'
  });
  const browserCompositionApi = await importRepoEsmModule('xtend-maraca/browser-composition-runtime.mjs', rootDir);
  const surfaceControllerProvider = Object.freeze({
    createSurfaceController() {
      throw new Error('Composition port identity test must not instantiate the provider.');
    }
  });
  const appRuntimeProvider = Object.freeze({
    createRmtAppRuntime() {
      throw new Error('Composition port identity test must not instantiate the provider.');
    }
  });
  const explicitSurfaceController = Object.freeze({
    apply() {},
    readSnapshot() { return {}; },
    subscribe() { return () => {}; },
    dispose() { return false; }
  });
  const compatibilitySurfaceStateProjection = Object.freeze({
    snapshot() { return {}; }
  });
  const compositionRootTarget = {
    localName: 'main',
    getAttribute() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const compositionDocumentTarget = {
    head: { appendChild() {} },
    body: compositionRootTarget,
    documentElement: compositionRootTarget,
    querySelector() { return null; },
    getElementById() { return null; },
    createElement() {
      return { setAttribute() {} };
    }
  };
  const compositionPlatformTarget = {
    XTendSurfaceController: surfaceControllerProvider
  };
  let capturedRuntimeConfiguration = null;
  let compositionRuntimeCreateCount = 0;
  let compositionRuntimeDisposeCount = 0;
  let releaseCompositionBoot;
  let markCompositionBootStarted;
  const compositionBootGate = new Promise((resolve) => { releaseCompositionBoot = resolve; });
  const compositionBootStarted = new Promise((resolve) => { markCompositionBootStarted = resolve; });
  const compositionRuntime = browserCompositionApi.createMaracaBrowserCompositionRoot({
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    orchestration: { enabled: true, strict: false, mode: 'compatibility', status: 'ready', artifact: {} },
    kernel: { enabled: false, status: 'disabled' },
    hydration: { enabled: false, status: 'disabled' },
    components: [],
    surfaces: [],
    state: {}
  }, {
    platformTarget: compositionPlatformTarget,
    windowTarget: compositionPlatformTarget,
    documentTarget: compositionDocumentTarget,
    runtimeModuleApis: Object.freeze({
      'xtendrmt/rmt-app-runtime.js': appRuntimeProvider
    }),
    createPlanRuntime(runtimeConfiguration) {
      compositionRuntimeCreateCount += 1;
      capturedRuntimeConfiguration = runtimeConfiguration;
      return {
        model: Object.freeze({ snapshot() { return Object.freeze({}); } }),
        async boot() {
          markCompositionBootStarted();
          await compositionBootGate;
          return this.snapshot();
        },
        async dispatchCommand() { return this.snapshot(); },
        async dispatchStreamPatch() { return this.snapshot(); },
        snapshot() {
          return { phase: 'booted', enabled: true, diagnostics: [] };
        },
        subscribe() { return () => {}; },
        dispose() { compositionRuntimeDisposeCount += 1; return true; }
      };
    }
  });
  const compositionRenderer = { commit() { return null; }, dispose() { return false; } };
  const initialCompositionBootPromise = compositionRuntime.boot({
    root: compositionRootTarget,
    domRenderer: compositionRenderer,
    surfaceController: explicitSurfaceController,
    surfaceControllerId: 'demo.surface-controller',
    surfaceStateProjection: compatibilitySurfaceStateProjection,
    registerServiceWorker: false
  });
  await compositionBootStarted;
  const concurrentCompositionBootPromise = compositionRuntime.boot({
    root: compositionRootTarget,
    domRenderer: compositionRenderer,
    registerServiceWorker: false
  });
  releaseCompositionBoot();
  const [initialCompositionBoot, concurrentCompositionBoot] = await Promise.all([
    initialCompositionBootPromise,
    concurrentCompositionBootPromise
  ]);
  const repeatedCompositionBoot = await compositionRuntime.boot({
    root: compositionRootTarget,
    domRenderer: compositionRenderer,
    registerServiceWorker: false
  });
  const loadedCompositionModules = await capturedRuntimeConfiguration.moduleLoaderPort.load();
  context.assert(loadedCompositionModules.app === appRuntimeProvider,
    'browser composition exposes the exact injected ESM App Runtime provider without requiring a global mirror');
  context.assert(loadedCompositionModules.surfaceController === surfaceControllerProvider,
    'browser composition exposes the exact XTendSurfaceController provider through its module-loader port');
  context.assert(capturedRuntimeConfiguration.surfaceController === explicitSurfaceController
    && capturedRuntimeConfiguration.surfaceControllerId === 'demo.surface-controller'
    && capturedRuntimeConfiguration.surfaceStateProjection === compatibilitySurfaceStateProjection,
  'browser composition preserves explicit Surface Controller and compatibility projection ports for Plan Runtime');
  context.assert(initialCompositionBoot.duplicateBootIgnored !== true
    && concurrentCompositionBoot.duplicateBootIgnored === true
    && repeatedCompositionBoot.duplicateBootIgnored === true
    && Object.isFrozen(concurrentCompositionBoot)
    && Object.isFrozen(repeatedCompositionBoot)
    && compositionRuntimeCreateCount === 1
    && compositionRuntimeDisposeCount === 0,
  'browser composition coalesces concurrent and repeated managed boot without replacing the runtime or rematerializing the root');
  compositionRuntime.dispose();

  let releaseDisposedCompositionBoot;
  let signalDisposedCompositionBoot;
  const disposedCompositionBootGate = new Promise((resolve) => { releaseDisposedCompositionBoot = resolve; });
  const disposedCompositionBootStarted = new Promise((resolve) => { signalDisposedCompositionBoot = resolve; });
  const disposedCompositionRuntimeIds = [];
  let disposedCompositionRuntimeCount = 0;
  const disposedCompositionPlatformTarget = {};
  const disposedComposition = browserCompositionApi.createMaracaBrowserCompositionRoot({
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    orchestration: { enabled: true, strict: false, mode: 'compatibility', status: 'ready', artifact: {} },
    kernel: { enabled: false, status: 'disabled' },
    hydration: { enabled: false, status: 'disabled' },
    components: [],
    surfaces: [],
    state: {}
  }, {
    platformTarget: disposedCompositionPlatformTarget,
    windowTarget: disposedCompositionPlatformTarget,
    documentTarget: compositionDocumentTarget,
    createPlanRuntime() {
      disposedCompositionRuntimeCount += 1;
      const runtimeId = disposedCompositionRuntimeCount;
      return {
        model: Object.freeze({ snapshot() { return Object.freeze({}); } }),
        async boot() {
          if (runtimeId === 1) {
            signalDisposedCompositionBoot();
            await disposedCompositionBootGate;
          }
          return this.snapshot();
        },
        async dispatchCommand() { return this.snapshot(); },
        async dispatchStreamPatch() { return this.snapshot(); },
        snapshot() { return { phase: 'ready', enabled: true, diagnostics: [], runtimeId }; },
        subscribe() { return () => {}; },
        dispose() { disposedCompositionRuntimeIds.push(runtimeId); return true; }
      };
    }
  });
  const disposedCompositionRoot = { ...compositionRootTarget };
  const replacementCompositionRoot = { ...compositionRootTarget };
  const staleCompositionBoot = disposedComposition.boot({
    root: disposedCompositionRoot,
    domRenderer: { commit() { return null; }, dispose() { return true; } },
    registerServiceWorker: false
  });
  await disposedCompositionBootStarted;
  const duplicateDisposedCompositionBoot = disposedComposition.boot({
    root: disposedCompositionRoot,
    registerServiceWorker: false
  });
  await Promise.resolve();
  disposedComposition.dispose('Dispose the pending composition boot.');
  let disposedCompositionTimeout;
  const disposedCompositionSettled = await Promise.race([
    Promise.allSettled([staleCompositionBoot, duplicateDisposedCompositionBoot]),
    new Promise((resolve) => { disposedCompositionTimeout = setTimeout(() => resolve(null), 250); })
  ]);
  clearTimeout(disposedCompositionTimeout);
  const replacementCompositionBoot = await disposedComposition.boot({
    root: replacementCompositionRoot,
    domRenderer: { commit() { return null; }, dispose() { return true; } },
    registerServiceWorker: false
  });
  releaseDisposedCompositionBoot();
  await Promise.resolve();
  await Promise.resolve();
  context.assert(Array.isArray(disposedCompositionSettled)
    && disposedCompositionSettled.every((entry) => entry.status === 'rejected'
      && entry.reason && entry.reason.code === 'xtend.maraca.boot_cancelled')
    && replacementCompositionBoot.runtimeId === 2
    && disposedCompositionRuntimeCount === 2
    && disposedCompositionRuntimeIds.filter((runtimeId) => runtimeId === 1).length === 1
    && disposedComposition.facade.model
    && disposedCompositionPlatformTarget.__XTendMaracaResult.runtimeId === 2,
  'disposing a pending composition boot rejects all coalesced callers and isolates a replacement boot from stale completion');
  disposedComposition.dispose();

  let strictCollisionRegistryCreations = 0;
  let strictCollisionTransportCreations = 0;
  const strictCollisionComposition = browserCompositionApi.createMaracaBrowserCompositionRoot({
    schema: MARACA_BUNDLE_REPORT_SCHEMA,
    orchestration: { enabled: false, strict: true, mode: 'strict', status: 'disabled' },
    kernel: { enabled: false, status: 'disabled' },
    hydration: { enabled: false, status: 'disabled' },
    appServices: {
      enabled: true,
      strict: true,
      manifest: { services: [{ id: 'demo.generated-service', target: 'server' }] }
    },
    components: [],
    surfaces: [],
    state: {}
  }, {
    platformTarget: compositionPlatformTarget,
    windowTarget: compositionPlatformTarget,
    documentTarget: compositionDocumentTarget,
    appServiceDefinition: {},
    createAppServiceRegistry() {
      strictCollisionRegistryCreations += 1;
      return {};
    },
    createHttpAppServiceTransport() {
      strictCollisionTransportCreations += 1;
      return {};
    }
  });
  let strictAliasCollision = null;
  try {
    await strictCollisionComposition.boot({
      root: compositionRootTarget,
      serviceAdapters: { 'demo.generated-service': { invoke() {} } }
    });
  } catch (error) {
    strictAliasCollision = error;
  }
  context.assert(strictAliasCollision
    && strictAliasCollision.code === 'xtend.maraca.app_services.manual_adapter_collision'
    && strictCollisionRegistryCreations === 0
    && strictCollisionTransportCreations === 0,
  'strict AppServices detects the serviceAdapters alias collision before creating registry or transport resources');
  const commandCalls = { focus: 0, reset: 0, snapshot: 0, ensured: [], queries: [] };
  const editor = {
    localName: 'x-textarea',
    getAttribute(name) {
      if (name === 'data-maraca-surface') return 'demo.editor';
      if (name === 'data-rmt-component') return 'x-textarea';
      return null;
    },
    focus() {
      commandCalls.focus += 1;
    },
    reset() {
      commandCalls.reset += 1;
    },
    snapshot() {
      commandCalls.snapshot += 1;
      return { value: 'captured', valid: true };
    },
    get shadowRoot() {
      throw new Error('component command runtime must not traverse shadow roots');
    }
  };
  const outsideEditor = {
    localName: 'x-textarea',
    focus() {
      throw new Error('component command escaped its orchestration root');
    }
  };
  const commandRoot = {
    getAttribute() {
      return null;
    },
    querySelectorAll(selector) {
      commandCalls.queries.push(selector);
      return [editor];
    },
    outsideEditor
  };
  const commandFor = (command) => ({
    schema: MARACA_COMPONENT_COMMAND_SCHEMA,
    command,
    target: {
      kind: 'surface',
      id: 'demo.editor',
      ref: 'surface:demo.commands/demo.editor',
      component: 'x-textarea'
    }
  });
  const commandOptions = {
    ensureComponent(component) {
      commandCalls.ensured.push(component);
    }
  };
  const focusCommandResult = await invokeMaracaComponentCommand(commandRoot, commandFor('focus'), commandOptions);
  const resetCommandResult = await invokeMaracaComponentCommand(commandRoot, commandFor('reset'), commandOptions);
  const snapshotCommandResult = await invokeMaracaComponentCommand(commandRoot, commandFor('snapshot'), commandOptions);
  context.assert(focusCommandResult.schema === MARACA_COMPONENT_COMMAND_RESULT_SCHEMA && focusCommandResult.result === null && commandCalls.focus === 1, 'Maraca invokes only the public focus method and returns the component-command result contract');
  context.assert(resetCommandResult.schema === MARACA_COMPONENT_COMMAND_RESULT_SCHEMA && resetCommandResult.result === null && commandCalls.reset === 1, 'Maraca invokes only the public reset method and returns the component-command result contract');
  context.assert(snapshotCommandResult.schema === MARACA_COMPONENT_COMMAND_RESULT_SCHEMA && snapshotCommandResult.result.value === 'captured' && commandCalls.snapshot === 1, 'Maraca exposes the public snapshot result in the component-command result contract');
  context.assert(commandCalls.queries.every((selector) => selector === '[data-maraca-surface]') && commandCalls.ensured.every((component) => component === 'x-textarea'), 'Maraca resolves commands only through the root-scoped static surface registry');
  const componentCommandSource = String(invokeMaracaComponentCommand);
  context.assert(!componentCommandSource.includes('document') && !componentCommandSource.includes('shadowRoot'), 'component command runtime has no document fallback or shadow-root traversal');
  let arbitraryCommandBlocked = false;
  try {
    await invokeMaracaComponentCommand(commandRoot, commandFor('arbitrary'), commandOptions);
  } catch (error) {
    arbitraryCommandBlocked = Boolean(error && error.message && error.message.includes('is not allowed'));
  }
  context.assert(arbitraryCommandBlocked, 'Maraca fail-closes arbitrary component method names');
  let outsideRootBlocked = false;
  try {
    await invokeMaracaComponentCommand({ getAttribute() { return null; }, querySelectorAll() { return []; }, outsideEditor }, commandFor('focus'), commandOptions);
  } catch (error) {
    outsideRootBlocked = Boolean(error && error.message && error.message.includes('not materialized inside the orchestration root'));
  }
  context.assert(outsideRootBlocked, 'Maraca cannot resolve a component command outside its orchestration root');
  const plan = planOrchestrationFixture(rootDir);
  const incompleteStrictPlan = createMaracaBuildPlan({
    source: MARACA_ORCHESTRATION_INCOMPLETE_FIXTURE,
    out: '.xtend-build/maraca/orchestration-incomplete',
    orchestration: 'strict'
  }, { rootDir });
  const result = await buildOrchestrationFixtureAsync(rootDir);
  const entryPath = result.bundleReport && result.bundleReport.entry;
  const reportPath = resolveRepoPath(`${MARACA_ORCHESTRATION_OUT_DIR}/xtend.maraca.report.json`, rootDir);
  const cssPath = resolveRepoPath(`${MARACA_ORCHESTRATION_OUT_DIR}/xtend.maraca.css`, rootDir);
  const planRuntimePath = resolveRepoPath(`${MARACA_ORCHESTRATION_OUT_DIR}/runtime/xtend-maraca-plan-runtime.mjs`, rootDir);
  const compositionRuntimePath = resolveRepoPath(`${MARACA_ORCHESTRATION_OUT_DIR}/runtime/xtend-maraca-browser-composition-runtime.mjs`, rootDir);
  const browserHostAdapterPath = resolveRepoPath(`${MARACA_ORCHESTRATION_OUT_DIR}/runtime/browser-host-adapter.mjs`, rootDir);
  const entrySource = entryPath && fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const cssSource = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
  const planRuntimeSource = fs.existsSync(planRuntimePath) ? fs.readFileSync(planRuntimePath, 'utf8') : '';
  const compositionRuntimeSource = fs.existsSync(compositionRuntimePath) ? fs.readFileSync(compositionRuntimePath, 'utf8') : '';
  const browserHostAdapterSource = fs.existsSync(browserHostAdapterPath) ? fs.readFileSync(browserHostAdapterPath, 'utf8') : '';
  const canonicalPlanRuntimeSource = fs.readFileSync(resolveRepoPath('xtend-maraca/plan-runtime.mjs', rootDir), 'utf8');
  const maracaGeneratorSource = fs.readFileSync(resolveRepoPath('xtend-maraca/index.js', rootDir), 'utf8');
  const mediaEffectSource = fs.readFileSync(resolveRepoPath('xtendrmt/rmt-presentation-effect-adapter.js', rootDir), 'utf8');
  const report = fs.existsSync(reportPath) ? readJson(`${MARACA_ORCHESTRATION_OUT_DIR}/xtend.maraca.report.json`, rootDir) : null;
  const bundleFiles = report && Array.isArray(report.bundleFiles) ? report.bundleFiles : [];
  const cliIo = createCliIo();
  const cliStatus = await runCliAsync([
    'maraca',
    'plan',
    MARACA_ORCHESTRATION_FIXTURE,
    '--orchestration',
    'strict',
    '--json'
  ], cliIo);
  const cliPlan = JSON.parse(cliIo.readStdout());

  context.assert(plan.ok === true, `strict orchestration plan passes${plan.ok ? '' : ` (${plan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(plan.orchestration && plan.orchestration.enabled === true, 'strict orchestration is enabled for complete fixture');
  context.assert(plan.orchestration.summary.schema === 'xtend.rmt.app-orchestration.v1', 'strict plan records compiler orchestration schema');
  context.assert(plan.orchestration.summary.stateCount >= 2, 'strict plan summarizes state graph');
  context.assert(plan.orchestration.summary.actionCount === 1, 'strict plan summarizes action graph');
  context.assert(plan.orchestration.summary.eventCount === 1, 'strict plan summarizes event graph');
  const saveEvent = (plan.events || []).find((event) => event && event.action === 'demo.orchestration.save');
  context.assert(saveEvent && saveEvent.event === 'click' && saveEvent.type === 'click', 'strict plan preserves RMT DOM event type for runtime listener binding');
  context.assert(saveEvent && saveEvent.payload && saveEvent.payload.label === '$target.dataset.label', 'strict plan preserves RMT event payload mappings for runtime routing');
  context.assert(saveEvent && saveEvent.governance && saveEvent.governance.preventDefault === true, 'strict plan preserves RMT event governance for runtime routing');
  context.assert(plan.orchestration.summary.surfaceCount === 3, 'strict plan summarizes surface graph');
  context.assert(plan.kernel && plan.kernel.enabled === true, 'strict orchestration plan enables kernel integration by default');
  context.assert(plan.kernel.summary.recordsSchema === 'xtend.rmt.vnext.kernel-records.v1', 'strict orchestration plan records kernel records schema');
  context.assert(plan.kernel.summary.scheduleCount >= 10, 'strict orchestration plan summarizes detailed kernel schedules including hydration/action/event endpoints');
  context.assert(plan.kernel.summary.fiberCount >= 10, 'strict orchestration plan summarizes detailed kernel fibers including hydration/action/event endpoints');
  context.assert(plan.hydration && plan.hydration.enabled === true, 'strict orchestration plan enables hydration orchestration by default');
  context.assert(plan.hydration && plan.hydration.schema === MARACA_HYDRATION_PLAN_SCHEMA, 'strict orchestration plan records hydration plan schema');
  context.assert(plan.hydration.summary.recordCount >= 2, 'strict orchestration plan summarizes hydration records');
  context.assert(plan.warmReentry && plan.warmReentry.schema === MARACA_WARM_REENTRY_REPORT_SCHEMA, 'strict orchestration plan records Warm Reentry report schema');
  context.assert(plan.warmReentry && plan.warmReentry.backpressurePolicy.critical === 'pause-prewarm', 'strict orchestration plan records critical prewarm backpressure behavior');
  context.assert(plan.warmReentry && plan.warmReentry.destroyInvalidation.destroySurfaceInvalidatesChunks === true, 'strict orchestration plan records chunk invalidation on destroySurface');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-action-effect-runtime.js'), 'strict orchestration requires action runtime module');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-runtime.esm.js'), 'strict orchestration requires kernel runtime module');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-dom-descriptor-renderer.js'), 'strict orchestration requires DOM descriptor renderer module');
  context.assert(plan.runtimeModules.includes('components/xsurfacemanager-controller.js'), 'strict orchestration requires the Surface Controller lifecycle module');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-presentation-effect-adapter.js'), 'strict orchestration requires the PresentationEffectPort adapter module');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-state-binding-view-projector.js'), 'strict orchestration uses the canonical State Binding View projector module');
  context.assert(plan.runtimeModules.includes('xtendrmt/rmt-maraca-view-projection-adapter.js'), 'strict orchestration requires the Maraca View projection adapter module');
  context.assert(plan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-runtime.esm.js'), 'strict plan includes kernel runtime in the bundle graph');
  context.assert(plan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-state-selector-runtime.js'), 'strict plan includes orchestration runtime modules in bundle graph');
  context.assert(plan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-state-binding-view-projector.js'), 'strict plan includes the State Binding View projector in the composition graph');
  context.assert(plan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-maraca-view-projection-adapter.js'), 'strict plan includes the Maraca View projection adapter in the composition graph');
  context.assert(plan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-state-host-adapter.js'), 'strict plan includes the XTend State output adapter in the composition graph');
  context.assert(plan.stackModules.some((entry) => entry.source === 'components/xsurfacemanager-controller.js'), 'strict plan includes the Surface Controller composition port');
  context.assert(plan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-presentation-effect-adapter.js'), 'strict plan includes the presentation adapter in the composition graph');
  context.assert(incompleteStrictPlan.ok === false, 'strict orchestration blocks incomplete graph');
  context.assert(incompleteStrictPlan.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.orchestration_event_contract_missing' || diagnostic.code === 'rmt.vnext.primitive.payload-contract-missing'), 'strict diagnostics include missing payload contract');

  context.assert(result.ok === true, `strict orchestration bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(report && report.orchestration && report.orchestration.enabled === true, 'bundle report includes orchestration telemetry');
  context.assert(report && report.kernel && report.kernel.enabled === true, 'bundle report includes kernel telemetry');
  context.assert(report && report.hydration && report.hydration.enabled === true, 'bundle report includes hydration telemetry');
  context.assert(report && report.warmReentry && report.warmReentry.schema === MARACA_WARM_REENTRY_REPORT_SCHEMA, 'bundle report includes Warm Reentry telemetry');
  context.assert(report && report.warmReentry && report.warmReentry.destroyInvalidation.destroySurfaceInvalidatesPrewarm === true, 'bundle report includes Warm Reentry destroy invalidation contract');
  context.assert(report && report.kernel && report.kernel.summary.scheduleCount >= 10, 'bundle report summarizes detailed kernel schedules including hydration endpoints');
  context.assert(report && report.orchestration && report.orchestration.summary.reducerCount >= 3, 'bundle report summarizes reducer patch plan');
  context.assert(report && report.orchestration && report.orchestration.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'), 'bundle report diagnostics are non-blocking for complete fixture');
  context.assert(entrySource.includes('createMaracaBrowserCompositionRoot') && compositionRuntimeSource.includes('dependencies.createPlanRuntime('), 'thin bundle delegates boot to the canonical composition root and Plan Runtime');
  context.assert(browserHostAdapterSource.includes('function createKernelController'), 'browser host adapter initializes the injected kernel controller port');
  context.assert(browserHostAdapterSource.includes('function createHydrationPort'), 'browser host adapter owns component hydration and viewport observation');
  context.assert(entrySource.includes('MARACA_HYDRATION'), 'bundle embeds hydration plan');
  context.assert(entrySource.includes('MARACA_WARM_REENTRY'), 'bundle embeds Warm Reentry report');
  context.assert(entrySource.includes('XTendMaracaKernelRuntimeModule'), 'bundle imports the RMT kernel runtime module');
  context.assert(entrySource.includes(MARACA_KERNEL_CONTROLLER_ASSET), 'bundle imports reusable kernel orchestration controller asset');
  context.assert(entrySource.includes('xtendrmt/rmt-state-selector-runtime.js'), 'bundle wires state runtime through the explicit runtime-module map');
  context.assert(entrySource.includes('XTendRmtStateHostAdapter'), 'bundle wires the typed XTend State host adapter');
  context.assert(entrySource.includes('xtendrmt/rmt-action-effect-runtime.js'), 'bundle wires action runtime through the explicit runtime-module map');
  context.assert(entrySource.includes('MARACA_RUNTIME_MODULE_APIS')
    && entrySource.includes('"xtendrmt/rmt-app-runtime.js"')
    && entrySource.includes('runtimeModuleApis: MARACA_RUNTIME_MODULE_APIS'),
  'bundle passes canonical ESM Runtime Module namespaces explicitly into the browser composition root');
  context.assert(!entrySource.includes('globalThis.XTendRmtAppRuntime')
    && !entrySource.includes('globalTarget.XTendRmtAppRuntime ='),
  'bundle consumes the App Runtime module namespace without reintroducing a global mirror');
  context.assert(entrySource.includes('xtendrmt/rmt-event-routing-runtime.js'), 'bundle wires event runtime through the explicit runtime-module map');
  context.assert(entrySource.includes('XTendRmtSurfaceResourceGraphRuntime'), 'bundle wires surface runtime');
  context.assert(entrySource.includes('components/xsurfacemanager-controller.js'), 'bundle imports the Surface Controller lifecycle runtime');
  context.assert(entrySource.includes('XTendRmtPresentationEffectAdapter'), 'bundle wires the canonical PresentationEffectPort adapter');
  context.assert(compositionRuntimeSource.includes("runtimeApi('XTendRmtMaracaViewProjectionAdapter')") && compositionRuntimeSource.includes('viewProjectionPort'), 'composition root wires the canonical ViewProjectionPort adapter');
  context.assert(entrySource.includes('XTendRmtDomDescriptorRenderer'), 'bundle wires DOM descriptor renderer');
  context.assert(/import\s*\{\s*createMaracaPlanRuntime\s*\}\s*from\s*["']\.\/runtime\/xtend-maraca-plan-runtime\.mjs["']/u.test(entrySource), 'bundle imports the packaged canonical Maraca Plan Runtime');
  context.assert(bundleFiles.some((file) => file.fileName === 'runtime/xtend-maraca-plan-runtime.mjs'), 'bundle report includes the canonical Maraca Plan Runtime asset');
  context.assert(planRuntimeSource === canonicalPlanRuntimeSource, 'packaged Plan Runtime is copied byte-for-byte from the canonical source');
  context.assert(!entrySource.includes('function createOrchestrationController') && !entrySource.includes('function createHydrationController'), 'bundle contains no second application or hydration controller');
  context.assert((compositionRuntimeSource.match(/dependencies\.createPlanRuntime\(/gu) || []).length === 1
    && compositionRuntimeSource.includes('createRuntimeConfiguration(config, options, host,'),
  'canonical composition root creates the Plan Runtime exactly once from immutable configuration');
  context.assert(compositionRuntimeSource.includes('domRenderer: handles.renderer')
    && compositionRuntimeSource.includes('kernelController: handles.kernel')
    && compositionRuntimeSource.includes("surfaceController: host.runtimeApi('XTendSurfaceController')")
    && compositionRuntimeSource.includes('surfaceController: options.surfaceController || null')
    && compositionRuntimeSource.includes('surfaceControllerId: options.surfaceControllerId')
    && compositionRuntimeSource.includes('surfaceStateProjection: options.surfaceStateProjection || null')
    && compositionRuntimeSource.includes("XTendRmtAppRuntime: Object.freeze(['xtendrmt/rmt-app-runtime.js', 'XTendRmtAppRuntime'])")
    && compositionRuntimeSource.includes('createInjectedRuntimeApis(dependencies)')
    && compositionRuntimeSource.includes('invokeComponentCommand: (record) => host.invokeComponentCommand')
    && compositionRuntimeSource.includes('postCommitEffects: options.postCommitEffects || null'),
  'composition root injects the shared renderer, kernel, Surface Controller, presentation, and additive host hooks');
  context.assert(planRuntimeSource.includes("facade: 'xtend.maraca.scheduled-app-runtime.v1'"), 'canonical Plan Runtime owns the scheduled app-runtime facade');
  context.assert(planRuntimeSource.includes('handleStreamPatch(patchInput, reducerOptions = {})'), 'canonical Plan Runtime owns the scheduled stream lifecycle facade');
  context.assert(planRuntimeSource.includes("'operation:xtend.maraca/orchestration/event'"), 'canonical Plan Runtime schedules app commands on the orchestration event lane');
  context.assert(planRuntimeSource.includes('dispatchStreamPatch(patchInput, metadata = {})'), 'canonical Plan Runtime exposes stream patches only through its application-controller facade');
  context.assert(planRuntimeSource.includes('createStateProjectionPort: stateProjectionFactory')
    && planRuntimeSource.includes('stateProjectionTarget: options.stateProjectionTarget || null')
    && planRuntimeSource.includes("error.code = 'rmt.state.projection-batch-required'"),
  'canonical Plan Runtime injects XTend State only through the typed state projection factory and target');
  context.assert(!planRuntimeSource.includes('getRuntimeAdapters()')
    && !planRuntimeSource.includes('get rawActionRuntime()')
    && !planRuntimeSource.includes('get renderer()')
    && !planRuntimeSource.includes('get appRuntime()'),
  'canonical Plan Runtime does not publish mutable MVC adapter handles');
  context.assert(/const MARACA_COMPONENTS = freezeMaraca(?:Snapshot|Configuration)\(/u.test(entrySource)
    && /const MARACA_ORCHESTRATION = freezeMaraca(?:Snapshot|Configuration)\(/u.test(entrySource)
    && /const MARACA_KERNEL = freezeMaraca(?:Snapshot|Configuration)\(/u.test(entrySource)
    && /const MARACA_VALIDATION = freezeMaraca(?:Snapshot|Configuration)\(/u.test(entrySource)
    && /const MARACA_BOOT_CONFIGURATION = freezeMaraca(?:Snapshot|Configuration)\(\{/u.test(entrySource),
  'generated composition plans and controller configuration are deeply frozen before publication');
  context.assert(compositionRuntimeSource.includes('const result = deepFreeze({')
    && compositionRuntimeSource.includes('bootResult = result;')
    && compositionRuntimeSource.includes("const report = deepFreeze({ schema: 'xtend.maraca.dispose.v1'")
    && !entrySource.includes('window.__XTendMaracaAutoBootError = error'),
  'composition boot, dispose, and generated auto-boot diagnostics expose immutable snapshots instead of mutable runtime values');
  const forbiddenControllerDomPrimitives = [
    /\.querySelector\s*\(/u,
    /\.querySelectorAll\s*\(/u,
    /\.getAttribute\s*\(/u,
    /\.replaceChildren\s*\(/u,
    /\.setAttribute\s*\(/u,
    /\.removeAttribute\s*\(/u,
    /\.innerHTML\b/u,
    /\.outerHTML\b/u,
    /\.insertAdjacentHTML\s*\(/u,
    /\.ownerDocument\b/u,
    /\bCustomEvent\b/u,
    /\.dispatchEvent\s*\(/u,
    /\bstate\.(?:set|setState)\s*\(/u
  ];
  context.assert(forbiddenControllerDomPrimitives.every((pattern) => !pattern.test(planRuntimeSource)),
    'canonical Plan Runtime reaches browser and DOM capabilities only through injected View ports');
  context.assert(entrySource.includes('const XTendMaraca = maracaComposition.facade')
    && compositionRuntimeSource.includes('host.installPublicFacades({')
    && !entrySource.includes('get appRuntime()')
    && !entrySource.includes('get renderer()')
    && !entrySource.includes('attachEvents(commitResult'),
  'generated bootstrap exposes the canonical safe runtime facade itself and no live View adapters');
  context.assert(!entrySource.includes('scheduledAppRuntime = Object.freeze') && !entrySource.includes('rawAppRuntime'), 'generated entry contains no second app-runtime orchestrator or raw bypass handle');
  const generatedCompositionSource = entrySource.slice(entrySource.indexOf('const MARACA_BOOT_CONFIGURATION'));
  context.assert(!/\.querySelectorAll\s*\(/u.test(generatedCompositionSource) && browserHostAdapterSource.includes("querySelectorAll('[data-rmt-component], [data-maraca-surface]')"), 'generated composition shell delegates Surface discovery to the browser host adapter');
  context.assert(browserHostAdapterSource.includes("entry.target.getAttribute('data-rmt-component')"), 'browser host adapter resolves component tags from rendered RMT component attributes');
  context.assert(entrySource.includes('"type": "$model.demo.orchestration.status.tone"'), 'bundle maps RMT tone state onto x-status public type attribute');
  context.assert(entrySource.includes('"variant": "$model.demo.orchestration.command.tone"'), 'bundle maps RMT tone state onto x-button public variant attribute');
  context.assert(entrySource.includes('"collapsible": "$model.demo.orchestration.panel.collapsible"'), 'bundle maps RMT side panel collapsible capability onto x-side-panel public attribute');
  context.assert(entrySource.includes('"closable": "$model.demo.orchestration.panel.closable"'), 'bundle maps RMT side panel close capability onto x-side-panel public attribute');
  context.assert(entrySource.includes('"pinnable": "$model.demo.orchestration.panel.pinnable"'), 'bundle maps RMT side panel pin capability onto x-side-panel public attribute');
  context.assert(compositionRuntimeSource.includes('host.installPublicFacades({') && browserHostAdapterSource.includes('windowTarget.__XTendMaracaOrchestration = values.orchestrationFacade'), 'composition delegates publication of the safe orchestration facade to the host adapter');
  context.assert(compositionRuntimeSource.includes("Object.defineProperty(facadeMembers, 'orchestration'")
    && compositionRuntimeSource.includes('get() { return facade; }'),
  'window.XTendMaraca.orchestration resolves to the same safe MVC facade');
  context.assert(browserHostAdapterSource.includes("readOnlySnapshotHandle(values.kernel, 'xtend.maraca.kernel-snapshot-facade.v1')"), 'host adapter exposes a read-only kernel snapshot handle');
  context.assert(browserHostAdapterSource.includes("readOnlySnapshotHandle(values.hydration, 'xtend.maraca.hydration-snapshot-facade.v1')"), 'host adapter exposes a read-only hydration snapshot handle');
  context.assert(planRuntimeSource.includes('snapshot,') && compositionRuntimeSource.includes('return deepFreeze(clone(runtime.snapshot()))'), 'composition exposes only immutable canonical orchestration snapshots');
  context.assert(entrySource.includes(MARACA_COMPONENT_COMMAND_RESULT_SCHEMA), 'bundle embeds the public component-command result contract');
  context.assert(entrySource.includes('invokeMaracaComponentCommand'), 'bundle owns declarative component-command execution');
  context.assert(entrySource.includes('effect.componentCommand'), 'deferred Maraca effects route compiled component commands through the framework runtime');
  context.assert(planRuntimeSource.includes('affectedSurfaceIds(commandId, reducers, patchPlan, validationStage')
    && planRuntimeSource.includes("operation: 'reconcile-children'")
    && planRuntimeSource.includes('descriptors: Array.isArray(projectedRoot) ? projectedRoot : [projectedRoot]'),
  'canonical Plan Runtime uses one root reconciliation while scoping hydration and post-commit work to affected surfaces');
  context.assert(planRuntimeSource.includes('createActionModelReaderPort')
    && planRuntimeSource.includes("schema: 'xtend.maraca.action-model-reader.v1'")
    && !planRuntimeSource.includes('createActionStateBuffer')
    && !/runtimes\.state\.(?:setState|patchState|dispatch|transaction)\s*\(/u.test(planRuntimeSource),
  'canonical Plan Runtime gives Actions a read-only Model port and commits their operations through one Model command transaction');
  context.assert(planRuntimeSource.includes('materializeSurfaces('), 'canonical Plan Runtime retains Surface Resource Graph materialization');
  const controllerOrdering = [
    ['async function commitCommand', 'materializeSurfaces(prepared.transaction.next', 'stateDomCommit(prepared.commandId'],
    ['async function dispatchStreamPatchNow', 'materializeSurfaces(transaction.next', "stateDomCommit('xtend.stream.patch'"],
    ['async function renderView', 'materializeSurfaces(stateSnapshot', 'const report = fullRender'],
    ['async function boot()', 'materializeSurfaces(initialStateSnapshot', 'let initialCommit']
  ];
  context.assert(controllerOrdering.every(([scope, lifecycleCall, domCall]) => {
    const scopeStart = planRuntimeSource.indexOf(scope);
    const lifecycleIndex = planRuntimeSource.indexOf(lifecycleCall, scopeStart);
    const domIndex = planRuntimeSource.indexOf(domCall, scopeStart);
    return scopeStart >= 0 && lifecycleIndex > scopeStart && domIndex > lifecycleIndex;
  }), 'Surface lifecycle authority succeeds before every command, stream, refresh, or boot DOM projection');
  context.assert(planRuntimeSource.includes("const SYSTEM_REFRESH_COMMAND = 'xtend.system.refresh'")
    && planRuntimeSource.includes('if (commandId === SYSTEM_REFRESH_COMMAND)')
    && !/function render\(metadata = \{\}\) \{[\s\S]*?return renderView\(/u.test(planRuntimeSource)
    && !/function refresh\(metadata = \{\}\) \{[\s\S]*?return renderView\(/u.test(planRuntimeSource),
  'render and refresh compatibility APIs dispatch the canonical system command instead of bypassing the Command Bus');
  context.assert(planRuntimeSource.includes("runtimeFactory(api.surfaceController, 'createSurfaceController')")
    && planRuntimeSource.includes('surfaceControllerFactory')
    && planRuntimeSource.includes('surfaceController,'),
  'canonical Plan Runtime creates and injects one Surface Controller lifecycle authority');
  context.assert(planRuntimeSource.includes('await hydrate(committed.surfaceIds'), 'canonical Plan Runtime hydrates affected component islands once after commit');
  context.assert(!entrySource.includes('syncSurfaceAttributes')
    && !entrySource.includes('patchPlanChangedKeys')
    && !entrySource.includes('hydrateSurfaceComponents')
    && !entrySource.includes('hydrateAll(')
    && !entrySource.includes('createActionStateBuffer')
    && !entrySource.includes('transactionState('),
  'generated entry contains no duplicate state, surface, action, or hydration orchestrator');
  context.assert(!maracaGeneratorSource.includes('function runDefaultRemotePlayEffect')
    && !maracaGeneratorSource.includes('function runDefaultLightboxEffect')
    && !planRuntimeSource.includes("'x-surface-manager'")
    && !planRuntimeSource.includes("'x-player'")
    && !planRuntimeSource.includes("'x-lightbox'")
    && planRuntimeSource.includes('presentationEffectPort.invoke(effect, effectContext)')
    && mediaEffectSource.includes('function runRemotePlay')
    && mediaEffectSource.includes('function runLightbox'),
  'concrete media and lightbox semantics live only behind the canonical PresentationEffectPort');
  context.assert(!entrySource.includes('function createSurfaceElement')
    && !entrySource.includes('function commitMaracaSurfaceState')
    && !entrySource.includes('function stateForSurface')
    && !entrySource.includes('function createStaticMaracaSurfaceDescriptor')
    && entrySource.includes('MARACA_COMPATIBILITY_RENDER_DESCRIPTOR')
    && browserHostAdapterSource.includes('function renderCompatibility')
    && browserHostAdapterSource.includes("operation: 'replace-children'"),
  'compatibility bootstrap passes a build-time descriptor to the host adapter and shared renderer without a runtime Surface projector');
  context.assert(browserHostAdapterSource.includes('function commitRootMetadata')
    && browserHostAdapterSource.includes("operation: 'merge-element'")
    && !/\broot\.(?:setAttribute|removeAttribute|toggleAttribute)\s*\(/u.test(browserHostAdapterSource),
  'SSR, hydration, and resume root metadata are committed through the shared renderer');
  context.assert(!mediaEffectSource.includes('documentRoot') && !mediaEffectSource.includes('document.querySelector'), 'media and lightbox effects resolve targets only inside the registered app/surface root');
  context.assert(!/lightbox\.(?:setAttribute|removeAttribute)\s*\(|lightbox\.style\b/u.test(mediaEffectSource)
    && mediaEffectSource.includes('commitElement(lightbox,'),
  'media and lightbox fallbacks route attribute, URL, and visibility writes through the shared renderer');
  context.assert(mediaEffectSource.includes('domRenderer.isUrlAllowed(value)')
    && mediaEffectSource.indexOf("assertAllowedUrl(detail.src, 'remote-play')") < mediaEffectSource.indexOf('player.applyRmtPlayerCommand'),
  'media effects pass URL-bearing public component calls through the renderer policy first');
  context.assert(compositionRuntimeSource.includes("closeHandle(disposed, 'hydration', hydration)")
    && compositionRuntimeSource.includes("closeHandle(disposed, 'kernel', kernel)")
    && compositionRuntimeSource.includes("closeHandle(disposed, 'renderer', renderer, root || undefined, { clearOwnedDom: false })")
    && compositionRuntimeSource.includes('host.clearPublicFacades()')
    && browserHostAdapterSource.includes("'__XTendMaracaKernel'")
    && compositionRuntimeSource.includes('generation !== attempt.generation')
    && compositionRuntimeSource.includes('cleanupBootAttempt(pendingAttempt, disposed, reason)'),
  'composition root has one fail-safe observer, renderer, kernel, and boot-generation dispose chain');
  const resumeHydrationSource = compositionRuntimeSource.slice(
    compositionRuntimeSource.indexOf('hydrateResponse()'),
    compositionRuntimeSource.indexOf('publishDiagnostic(value)', compositionRuntimeSource.indexOf('hydrateResponse()'))
  );
  context.assert((resumeHydrationSource.match(/attempt\.runtime\.refresh\(/gu) || []).length === 1
    && (resumeHydrationSource.match(/attempt\.hydration\.hydrate\(/gu) || []).length === 1
    && resumeHydrationSource.includes('attempt.runtime && attempt.runtime.refresh'),
  'resume fallback selects either the canonical controller or its injected Component Registry port, never a second hydration controller');
  context.assert(browserHostAdapterSource.includes("runtimeApi('XTendRmtKernelOrchestrationController')")
    && browserHostAdapterSource.includes('controller.boot()'),
  'production kernel scheduling is delegated to the canonical kernel controller port');
  context.assert(entrySource.includes('xtend-maraca:kernel-boot'), 'bundle dispatches kernel boot event');
  context.assert(entrySource.includes('xtend-maraca:kernel-schedule'), 'bundle dispatches kernel schedule event');
  context.assert(compositionRuntimeSource.includes('xtend-maraca:orchestration-boot'), 'composition root dispatches orchestration boot event');
  context.assert(entrySource.includes('xtend-maraca:state-change'), 'bundle dispatches state change event');
  context.assert(entrySource.includes('xtend-maraca:hydration-start'), 'bundle dispatches hydration telemetry');
  context.assert(!/\.innerHTML\s*=/u.test(entrySource), 'bundle entry has no innerHTML assignment sink');
  context.assert(!/\.outerHTML\s*=/u.test(entrySource), 'bundle entry has no outerHTML assignment sink');
  context.assert(!/\.insertAdjacentHTML\s*\(/u.test(entrySource), 'bundle entry has no insertAdjacentHTML sink');
  context.assert(!/document\.write\s*\(/u.test(entrySource), 'bundle entry has no document.write sink');
  context.assert(cssSource.includes('[data-maraca-surface="demo.orchestration.status"]'), 'external CSS includes surface layout selector');
  context.assert(cssSource.includes('--xtend-surface-x:16px'), 'external CSS includes layout token bridge');
  context.assert(!cssSource.includes('--xtend-theme'), 'external CSS avoids full theme generation');
  context.assert(cliStatus === 0, 'xt maraca plan --orchestration strict exits successfully');
  context.assert(cliPlan.orchestration && cliPlan.orchestration.enabled === true, 'CLI returns strict orchestration plan JSON');
  context.assert(cliIo.readStderr() === '', 'strict orchestration CLI plan has no stderr output');

  return context.result({
    schema: MARACA_ORCHESTRATION_PLAN_SCHEMA,
    orchestration: plan.orchestration.summary,
    entry: entryPath
  });
}

function printMaracaOrchestrationReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca App-Orchestrierung erfolgreich.',
    failureTitle: 'XTend Maraca App-Orchestrierung fehlgeschlagen:'
  });
}

async function runMaracaKernelOrchestrationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-kernel-orchestration',
    label: 'XTend Maraca Kernel Orchestration'
  });
  const kernelFeatureAdoptionApi = await loadRmtKernelFeatureAdoptionApi(rootDir);
  const {
    RMT_KERNEL_FEATURE_ADOPTION_CAPABILITY_KEYS,
    createRmtKernelFeatureAdoptionRegistry
  } = kernelFeatureAdoptionApi;
  const {
    createRmtKernelOrchestrationController
  } = await loadRmtKernelOrchestrationControllerApi(rootDir);
  const strictPlan = planKernelOrchestrationFixture(rootDir);
  const productSurfacePlan = planKernelOrchestrationFixture(rootDir, {
    kernelBootMode: 'productSurface',
    out: '.xtend-build/maraca/kernel-orchestration-product-surface'
  });
  const prewarmWorkerPlan = planKernelOrchestrationFixture(rootDir, {
    enablePrewarmWorker: true,
    out: '.xtend-build/maraca/kernel-orchestration-prewarm-worker'
  });
  const kernelOffPlan = planKernelOrchestrationFixture(rootDir, { kernel: 'off' });
  const strictWithoutOrchestration = createMaracaBuildPlan({
    source: MARACA_ORCHESTRATION_FIXTURE,
    out: '.xtend-build/maraca/kernel-strict-without-orchestration',
    orchestration: 'off',
    kernel: 'strict'
  }, { rootDir });
  const strictPolicyDriftPlan = planKernelOrchestrationFixture(rootDir, {
    out: '.xtend-build/maraca/kernel-policy-parity-drift',
    policyParityReports: [{
      schema: 'xtend.rmt.vnext-security-policy-contract.v1',
      diagnostics: [{
        code: 'rmt.vnext.security.sanitize.missing',
        severity: 'error',
        message: 'Unsafe output needs sanitize policy.'
      }]
    }],
    policyParityRuntimeHooks: ['recordTrustVerdict']
  });
  const result = await buildKernelOrchestrationFixtureAsync(rootDir);
  const entryPath = result.bundleReport && result.bundleReport.entry;
  const reportPath = resolveRepoPath(`${MARACA_KERNEL_ORCHESTRATION_OUT_DIR}/xtend.maraca.report.json`, rootDir);
  const kernelRuntimePath = resolveRepoPath(`${MARACA_KERNEL_ORCHESTRATION_OUT_DIR}/${MARACA_KERNEL_RUNTIME_ASSET}`, rootDir);
  const kernelControllerPath = resolveRepoPath(`${MARACA_KERNEL_ORCHESTRATION_OUT_DIR}/${MARACA_KERNEL_CONTROLLER_ASSET}`, rootDir);
  const kernelSchedulerPath = resolveRepoPath(`${MARACA_KERNEL_ORCHESTRATION_OUT_DIR}/${MARACA_KERNEL_SCHEDULER_ASSET}`, rootDir);
  const legacyKernelRuntimePath = resolveRepoPath(`${MARACA_KERNEL_ORCHESTRATION_OUT_DIR}/runtime/xtendrmt-runtime.esm.js`, rootDir);
  const legacyKernelControllerPath = resolveRepoPath(`${MARACA_KERNEL_ORCHESTRATION_OUT_DIR}/runtime/xtendrmt-kernel-orchestration-controller.js`, rootDir);
  const legacyResumeRuntimePath = resolveRepoPath(`${MARACA_KERNEL_ORCHESTRATION_OUT_DIR}/runtime/rmt-resume-runtime.js`, rootDir);
  const entrySource = entryPath && fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const browserHostAdapterSource = readText('xtend-maraca/browser-host-adapter.mjs', rootDir);
  const kernelControllerSource = readText('xtendrmt/rmt-kernel-orchestration-controller.js', rootDir);
  const report = fs.existsSync(reportPath) ? readJson(`${MARACA_KERNEL_ORCHESTRATION_OUT_DIR}/xtend.maraca.report.json`, rootDir) : null;
  const cliIo = createCliIo();
  const cliStatus = await runCliAsync([
    'maraca',
    'plan',
    MARACA_ORCHESTRATION_FIXTURE,
    '--orchestration',
    'strict',
    '--kernel',
    'strict',
    '--json'
  ], cliIo);
  const cliPlan = JSON.parse(cliIo.readStdout());

  context.assert(strictPlan.ok === true, `strict kernel plan passes${strictPlan.ok ? '' : ` (${strictPlan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(strictPlan.kernel && strictPlan.kernel.schema === MARACA_KERNEL_PLAN_SCHEMA, 'strict kernel plan uses kernel plan schema');
  context.assert(strictPlan.kernel && strictPlan.kernel.mode === 'strict', 'strict kernel plan records strict mode');
  context.assert(strictPlan.kernel && strictPlan.kernel.bootMode === 'direct', 'strict kernel plan keeps direct boot as default');
  context.assert(strictPlan.kernel && strictPlan.kernel.enabled === true, 'strict kernel plan enables kernel integration');
  context.assert(strictPlan.kernel.policyParity && strictPlan.kernel.policyParity.ok === true, 'strict kernel plan enables Policy Parity');
  context.assert(strictPlan.kernel.policyParity && strictPlan.kernel.policyParity.driftCount === 0, 'strict kernel plan has no Policy Parity drift');
  context.assert(strictPlan.kernel.policyParity && strictPlan.kernel.policyParity.requiredFactories.includes('commitTrustedHtml'), 'strict kernel plan records Policy Parity required factories');
  context.assert(
    strictPlan.kernel.featureAdoption.capabilities.find((capability) => capability.key === 'policyParity').active === true,
    'strict kernel plan marks Policy Parity feature adoption active'
  );
  context.assert(strictPlan.kernel.prewarmWorker && strictPlan.kernel.prewarmWorker.enabled === false, 'strict kernel plan keeps Prewarm Worker opt-in disabled by default');
  context.assert(prewarmWorkerPlan.ok === true, 'prewarm worker opt-in kernel plan passes');
  context.assert(prewarmWorkerPlan.enablePrewarmWorker === true, 'prewarm worker opt-in is reflected in the build plan');
  context.assert(prewarmWorkerPlan.kernel.prewarmWorker && prewarmWorkerPlan.kernel.prewarmWorker.schema === MARACA_PREWARM_WORKER_RUNTIME_SCHEMA, 'prewarm worker plan records runtime schema');
  context.assert(prewarmWorkerPlan.kernel.prewarmWorker && prewarmWorkerPlan.kernel.prewarmWorker.enabled === true, 'prewarm worker plan enables opt-in runtime capability');
  context.assert(prewarmWorkerPlan.kernel.prewarmWorker && prewarmWorkerPlan.kernel.prewarmWorker.ownership.dom === false, 'prewarm worker plan keeps DOM ownership out of the worker');
  context.assert(
    prewarmWorkerPlan.kernel.featureAdoption.capabilities.find((capability) => capability.key === 'prewarmWorker').active === true,
    'prewarm worker opt-in marks feature adoption active'
  );
  context.assert(productSurfacePlan.ok === true, 'product-surface kernel plan passes');
  context.assert(productSurfacePlan.kernel && productSurfacePlan.kernel.bootMode === 'productSurface', 'product-surface kernel plan records productSurface boot mode');
  assertKernelProductSurfaceReport(context, productSurfacePlan.kernel && productSurfacePlan.kernel.productSurface, 'product-surface kernel plan productSurface', 'productSurface');
  context.assert(
    productSurfacePlan.kernel.summary.scheduleCount === strictPlan.kernel.summary.scheduleCount
      && productSurfacePlan.kernel.summary.fiberCount === strictPlan.kernel.summary.fiberCount
      && productSurfacePlan.kernel.summary.endpointCount === strictPlan.kernel.summary.endpointCount,
    'product-surface kernel plan preserves direct boot scheduler summary'
  );
  context.assert(strictPlan.kernel.summary.scheduleCount >= 10, 'strict kernel plan summarizes detailed schedules including hydration endpoints');
  context.assert(strictPlan.kernel.summary.fiberCount >= 10, 'strict kernel plan summarizes detailed fibers including hydration endpoints');
  context.assert(strictPlan.kernel.summary.endpointCount >= 10, 'strict kernel plan summarizes detailed scheduler endpoints');
  context.assert(strictPlan.kernel.runtimeModules.includes('xtendrmt/rmt-runtime.esm.js'), 'strict kernel plan requires RMT runtime module');
  context.assert(kernelOffPlan.ok === true && kernelOffPlan.kernel.enabled === false, 'kernel off keeps orchestration without kernel available');
  context.assert(strictWithoutOrchestration.ok === false, 'strict kernel blocks when orchestration is disabled');
  context.assert(strictWithoutOrchestration.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.kernel_missing'), 'strict kernel without orchestration reports missing kernel integration precondition');
  context.assert(strictPolicyDriftPlan.ok === false, 'strict kernel blocks Policy Parity drift');
  context.assert(strictPolicyDriftPlan.kernel.policyParity && strictPolicyDriftPlan.kernel.policyParity.ok === false, 'strict Policy Parity report exposes failed status');
  context.assert(strictPolicyDriftPlan.kernel.policyParity && strictPolicyDriftPlan.kernel.policyParity.driftCount >= 1, 'strict Policy Parity report exposes drift count');
  context.assert(strictPolicyDriftPlan.kernel.policyParity && strictPolicyDriftPlan.kernel.policyParity.missingFactories.includes('commitTrustedHtml'), 'strict Policy Parity report exposes missing trust sink factory');
  context.assert(strictPolicyDriftPlan.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.policy_parity.drift'), 'strict Policy Parity drift emits Maraca diagnostic');

  context.assert(result.ok === true, `strict kernel bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(report && report.kernel && report.kernel.enabled === true, 'kernel bundle report records enabled kernel integration');
  context.assert(report && report.kernel && report.kernel.recordsSchema === 'xtend.rmt.vnext.kernel-records.v1', 'kernel bundle report records kernel records schema');
  context.assert(report && report.kernel && report.kernel.prewarmWorker && report.kernel.prewarmWorker.schema === MARACA_PREWARM_WORKER_RUNTIME_SCHEMA, 'kernel bundle report records Prewarm Worker capability');
  context.assert(report && report.kernel && report.kernel.prewarmWorker && report.kernel.prewarmWorker.enabled === false, 'kernel bundle report keeps Prewarm Worker disabled by default');
  context.assert(report && report.kernel && report.kernel.policyParity && report.kernel.policyParity.ok === true, 'kernel bundle report records ready Policy Parity');
  context.assert(report && report.kernel && report.kernel.policyParity && report.kernel.policyParity.requiredFactories.includes('commitTrustedHtml'), 'kernel bundle report records Policy Parity required factories');
  context.assert(report && report.kernel && report.kernel.security && report.kernel.security.panicRecovery && report.kernel.security.panicRecovery.status === 'available', 'kernel bundle report marks Panic/Recovery available');
  context.assert(report && report.kernel && report.kernel.security && report.kernel.security.policyParity && report.kernel.security.policyParity.driftCount === 0, 'kernel bundle report kernel.security records zero Policy Parity drift');
  context.assert(report && report.kernel && report.kernel.security && report.kernel.security.trustedDom && report.kernel.security.trustedDom.status === 'guarded', 'kernel bundle report marks Trusted DOM guarded');
  assertKernelFeatureAdoptionReport(context, strictPlan.kernel.featureAdoption, 'strict kernel plan featureAdoption', kernelFeatureAdoptionApi);
  assertKernelFeatureAdoptionReport(context, report && report.kernelFeatureAdoption, 'kernel bundle report featureAdoption', kernelFeatureAdoptionApi);
  assertKernelFeatureAdoptionReport(context, report && report.kernel && report.kernel.featureAdoption, 'kernel bundle kernel.featureAdoption', kernelFeatureAdoptionApi);
  assertProductionClosureReport(context, report && report.productionClosure, 'kernel bundle report productionClosure', report && report.profile || 'production');
  assertProductionClosureReport(context, report && report.kernelFeatureAdoptionClosure, 'kernel bundle report kernelFeatureAdoptionClosure', report && report.profile || 'production');
  assertKernelProductSurfaceReport(context, strictPlan.kernel.productSurface, 'strict kernel plan productSurface', 'direct');
  assertKernelProductSurfaceReport(context, report && report.kernel && report.kernel.productSurface, 'kernel bundle kernel.productSurface', 'direct');
  context.assert(
    capabilityKeySignature(strictPlan.kernel.featureAdoption.capabilityKeys)
      === capabilityKeySignature(report && report.kernelFeatureAdoption && report.kernelFeatureAdoption.capabilityKeys),
    'kernel plan and bundle report share feature adoption capability keys'
  );
  const rmtManifest = readJson('xtendrmt/rmt-manifest.json', rootDir);
  context.assert(
    rmtManifest.kernelFeatureAdoption
      && capabilityKeySignature(rmtManifest.kernelFeatureAdoption.capabilityKeys) === capabilityKeySignature(RMT_KERNEL_FEATURE_ADOPTION_CAPABILITY_KEYS),
    'RMT manifest records the same kernel feature adoption capability keys'
  );
  const degradedRegistry = createRmtKernelFeatureAdoptionRegistry({
    availableFactories: ['createRmtPerformanceRuntime'],
    activeCapabilities: { performanceAdvancedReports: true }
  }).snapshot();
  context.assert(degradedRegistry.status === 'blocked', 'registry blocks security capabilities when required factories are missing');
  context.assert(
    degradedRegistry.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.rmt.kernel_feature_adoption.unsupported' && diagnostic.capabilityKey === 'policyParity'),
    'registry emits unsupported capability diagnostics instead of silent no-op status'
  );
  context.assert(report && report.bundleFiles && report.bundleFiles.some((file) => file.fileName === MARACA_KERNEL_RUNTIME_ASSET), 'kernel runtime is packaged as an explicit ESM runtime asset');
  context.assert(report && report.bundleFiles && report.bundleFiles.some((file) => file.fileName === MARACA_KERNEL_CONTROLLER_ASSET), 'kernel orchestration controller is packaged as an explicit ESM runtime asset');
  context.assert(report && report.bundleFiles && report.bundleFiles.some((file) => file.fileName === MARACA_KERNEL_SCHEDULER_ASSET), 'kernel scheduler is packaged as an explicit ESM microkernel asset');
  context.assert(fs.existsSync(kernelRuntimePath), 'kernel runtime asset exists in the build package');
  context.assert(fs.existsSync(kernelControllerPath), 'kernel orchestration controller asset exists in the build package');
  context.assert(fs.existsSync(kernelSchedulerPath), 'kernel scheduler microkernel asset exists in the build package');
  context.assert(!fs.existsSync(legacyKernelRuntimePath), 'kernel packaging removes the obsolete typeless .js runtime asset');
  context.assert(!fs.existsSync(legacyKernelControllerPath), 'kernel packaging removes the obsolete typeless .js controller asset');
  context.assert(!fs.existsSync(legacyResumeRuntimePath), 'kernel packaging removes the obsolete typeless .js resume runtime asset');
  const kernelRuntimeImportProbe = spawnSync(process.execPath, [
    '--input-type=module',
    '--eval',
    `await Promise.all([import(${JSON.stringify(`${pathToFileURL(kernelRuntimePath).href}?probe=module-format`)}), import(${JSON.stringify(`${pathToFileURL(kernelControllerPath).href}?probe=module-format`)})])`
  ], {
    cwd: rootDir,
    encoding: 'utf8',
    env: process.env
  });
  context.assert(kernelRuntimeImportProbe.status === 0, `Node imports the packaged kernel runtime and controller${kernelRuntimeImportProbe.status === 0 ? '' : ` (${String(kernelRuntimeImportProbe.stderr || kernelRuntimeImportProbe.error || '').trim()})`}`);
  context.assert(!String(kernelRuntimeImportProbe.stderr || '').includes('MODULE_TYPELESS_PACKAGE_JSON'), 'packaged kernel runtime and controller declare ESM through their .mjs asset names');
  const kernelRuntimeModule = await import(`${pathToFileURL(kernelRuntimePath).href}?suite=maraca-kernel-orchestration`);
  const kernelSchedulerModule = await import(`${pathToFileURL(kernelSchedulerPath).href}?suite=maraca-kernel-orchestration`);
  const browserlessKernelWindowTarget = Object.freeze({});
  const browserlessMissingApis = ['Blob', 'Worker', 'URL.createObjectURL'];
  const kernelHostAdapter = {
    hostKind: 'node_fake_maraca_kernel',
    now: () => 0,
    scheduleTimeout(callback) {
      callback();
      return 0;
    },
    cancelTimeout() {},
    scheduleAnimationFrame(callback) {
      callback(0);
      return 0;
    },
    cancelAnimationFrame() {},
    scheduleIdleCallback(callback) {
      callback({ didTimeout: false, timeRemaining: () => 0 });
      return 0;
    },
    cancelIdleCallback() {},
    createAbortController: () => null,
    createCustomEvent: (name, init = {}) => ({ type: name, detail: init.detail || null })
  };
  const sharedKernelScheduler = kernelSchedulerModule.createRmtKernelScheduler({ hostPort: kernelHostAdapter });
  const kernelCore = kernelRuntimeModule.createRmtCore({ hostAdapter: kernelHostAdapter, scheduler: sharedKernelScheduler, documentTarget: null, windowTarget: browserlessKernelWindowTarget });
  const kernelPerformance = kernelRuntimeModule.createRmtPerformanceRuntime({ hostAdapter: kernelHostAdapter, scheduler: sharedKernelScheduler, documentTarget: null, windowTarget: browserlessKernelWindowTarget });
  const schedulerBridge = kernelRuntimeModule.createRmtStateSchedulerDiagnosticsBridge({
    scheduler: sharedKernelScheduler,
    schedules: strictPlan.kernel.artifact.scheduler.schedules
  });
  const scheduleSmoke = schedulerBridge.scheduleEndpoint(
    strictPlan.kernel.artifact.scheduler.schedules[0].endpointName,
    strictPlan.kernel.artifact.scheduler.schedules[0].scope,
    () => ({ ok: true, status: 'node-smoke' }),
    { schedule: strictPlan.kernel.artifact.scheduler.schedules[0] }
  );
  context.assert(kernelCore && typeof kernelCore.getCapabilities === 'function', 'packaged kernel runtime creates an RMT core instance in the node smoke');
  context.assert(kernelPerformance && typeof kernelPerformance.scheduleEndpoint === 'function', 'packaged kernel runtime creates a performance scheduler in the node smoke');
  context.assert(scheduleSmoke && scheduleSmoke.schema === 'xtend.rmt.kernel-job.v1', 'packaged kernel scheduler bridge returns a kernel JobHandle in the node smoke');
  context.assert(await scheduleSmoke && scheduleSmoke.status === 'completed', 'packaged kernel scheduler bridge executes a scheduled endpoint in the node smoke');
  context.assert(kernelCore.scheduler === sharedKernelScheduler, 'packaged kernel core uses the injected scheduler identity');
  context.assert(schedulerBridge.listScheduledEndpoints().length >= 1, 'packaged kernel scheduler bridge records scheduled endpoints in the node smoke');
  const prewarmRuntimeSmoke = kernelRuntimeModule.createRmtRuntime({
    hostAdapter: kernelHostAdapter,
    scheduler: sharedKernelScheduler,
    documentTarget: null,
    windowTarget: browserlessKernelWindowTarget,
    enablePrewarmWorker: true
  });
  const prewarmRuntimeTopology = prewarmRuntimeSmoke.getPrewarmWorkerTopology();
  context.assert(prewarmRuntimeTopology && prewarmRuntimeTopology.schema === 'xtend.rmt.prewarm-worker-topology.v1', 'packaged kernel runtime exposes Prewarm Worker topology');
  context.assert(prewarmRuntimeTopology.enabled === true, 'packaged kernel runtime honors Prewarm Worker opt-in');
  context.assert(Array.isArray(prewarmRuntimeTopology.missingApis), 'packaged kernel runtime lists Prewarm Worker missing APIs');
  context.assert(
    browserlessMissingApis.every((api) => prewarmRuntimeTopology.missingApis.includes(api))
      && prewarmRuntimeTopology.missingApis.length === browserlessMissingApis.length,
    'packaged kernel runtime resolves browser APIs against the deterministic browserless window target'
  );
  context.assert(!('localStorage' in browserlessKernelWindowTarget), 'browserless kernel smoke never exposes Node global localStorage to the browser runtime');
  context.assert(prewarmRuntimeTopology.excludedResponsibilities.includes('dom_mutation'), 'packaged kernel runtime keeps Prewarm Worker DOM-free');
  const prewarmRuntimeDispose = prewarmRuntimeSmoke.dispose();
  context.assert(prewarmRuntimeDispose && prewarmRuntimeDispose.prewarmWorkerTerminated === true, 'packaged kernel runtime dispose terminates Prewarm Worker path');
  const sourceController = createRmtKernelOrchestrationController({
    kernelApi: kernelRuntimeModule,
    artifact: strictPlan.kernel.artifact,
    plan: strictPlan.kernel,
    hostAdapter: kernelHostAdapter,
    windowTarget: browserlessKernelWindowTarget,
    documentTarget: null
  });
  const sourceControllerSnapshot = sourceController.boot();
  assertKernelFeatureAdoptionReport(context, sourceControllerSnapshot && sourceControllerSnapshot.featureAdoption, 'kernel orchestration controller snapshot featureAdoption', kernelFeatureAdoptionApi);
  context.assert(sourceControllerSnapshot.prewarmWorker && sourceControllerSnapshot.prewarmWorker.schema === 'xtend.rmt.prewarm-worker-topology.v1', 'kernel orchestration controller exposes Prewarm Worker topology schema');
  context.assert(sourceControllerSnapshot.prewarmWorker && sourceControllerSnapshot.prewarmWorker.enabled === false, 'kernel orchestration controller leaves Prewarm Worker disabled by default');
  context.assert(
    capabilityKeySignature(sourceControllerSnapshot && sourceControllerSnapshot.featureAdoption && sourceControllerSnapshot.featureAdoption.capabilityKeys)
      === capabilityKeySignature(report && report.kernelFeatureAdoption && report.kernelFeatureAdoption.capabilityKeys),
    'kernel orchestration snapshot and bundle report share feature adoption capability keys'
  );
  const productSurfaceController = createRmtKernelOrchestrationController({
    kernelApi: kernelRuntimeModule,
    artifact: productSurfacePlan.kernel.artifact,
    plan: productSurfacePlan.kernel,
    hostAdapter: kernelHostAdapter,
    windowTarget: browserlessKernelWindowTarget,
    documentTarget: null
  });
  const productSurfaceSnapshot = productSurfaceController.boot();
  context.assert(productSurfaceSnapshot.bootMode === 'productSurface', 'product-surface controller snapshot records productSurface boot mode');
  context.assert(productSurfaceSnapshot.status === 'booted', 'product-surface controller boots successfully');
  assertKernelProductSurfaceReport(context, productSurfaceSnapshot.productSurface, 'product-surface controller snapshot productSurface', 'productSurface');
  context.assert(
    productSurfaceSnapshot.scheduledEndpoints.length === sourceControllerSnapshot.scheduledEndpoints.length,
    'product-surface boot preserves direct boot scheduled endpoint count'
  );
  context.assert(
    productSurfaceSnapshot.featureAdoption.capabilities.find((capability) => capability.key === 'productSurface').active === true,
    'product-surface boot marks Product Surface capability active'
  );
  const prewarmWorkerController = createRmtKernelOrchestrationController({
    kernelApi: kernelRuntimeModule,
    artifact: prewarmWorkerPlan.kernel.artifact,
    plan: prewarmWorkerPlan.kernel,
    hostAdapter: kernelHostAdapter,
    windowTarget: browserlessKernelWindowTarget,
    documentTarget: null,
    enablePrewarmWorker: true
  });
  const prewarmWorkerSnapshot = prewarmWorkerController.boot();
  context.assert(prewarmWorkerSnapshot.prewarmWorker && prewarmWorkerSnapshot.prewarmWorker.enabled === true, 'prewarm worker controller honors opt-in flag');
  context.assert(prewarmWorkerSnapshot.prewarmWorker && Array.isArray(prewarmWorkerSnapshot.prewarmWorker.missingApis), 'prewarm worker topology lists missing host APIs');
  context.assert(
    prewarmWorkerSnapshot.prewarmWorker
      && browserlessMissingApis.every((api) => prewarmWorkerSnapshot.prewarmWorker.missingApis.includes(api))
      && prewarmWorkerSnapshot.prewarmWorker.missingApis.length === browserlessMissingApis.length,
    'prewarm worker controller keeps browserless host API detection deterministic'
  );
  context.assert(prewarmWorkerSnapshot.prewarmWorker && prewarmWorkerSnapshot.prewarmWorker.excludedResponsibilities.includes('dom_mutation'), 'prewarm worker topology excludes DOM ownership');
  context.assert(
    prewarmWorkerSnapshot.featureAdoption.capabilities.find((capability) => capability.key === 'prewarmWorker').active === true,
    'prewarm worker controller marks feature adoption active'
  );
  context.assert(entrySource.includes('XTendMaracaKernelRuntimeModule') && entrySource.includes(`./${MARACA_KERNEL_RUNTIME_ASSET}`), 'entry imports the packaged kernel runtime asset');
  context.assert(entrySource.includes(`./${MARACA_KERNEL_CONTROLLER_ASSET}`), 'entry imports the reusable kernel orchestration controller asset');
  context.assert(entrySource.includes('createRmtRuntime'), 'entry creates an RMT runtime instance');
  context.assert(entrySource.includes('createRmtCore'), 'entry creates an RMT core instance');
  context.assert(entrySource.includes('createRmtPerformanceRuntime'), 'entry creates a performance runtime instance');
  context.assert(entrySource.includes('createRmtStateSchedulerDiagnosticsBridge'), 'entry creates a scheduler diagnostics bridge');
  context.assert(browserHostAdapterSource.includes('plan,')
    && kernelControllerSource.includes('enablePrewarmWorker: isPrewarmWorkerEnabled()'),
  'browser composition passes the immutable Prewarm Worker plan through the kernel controller port');
  context.assert(browserHostAdapterSource.includes("readOnlySnapshotHandle(values.kernel, 'xtend.maraca.kernel-snapshot-facade.v1')")
    && !entrySource.includes('window.__XTendMaracaKernel ='),
  'browser composition exposes only the read-only kernel snapshot facade');
  context.assert(kernelControllerSource.includes('scheduledEndpoints: listScheduledEndpoints()')
    && browserHostAdapterSource.includes('snapshot: () => freeze(clone(handle.snapshot()))'),
  'scheduled endpoint inspection is available only through immutable kernel snapshots');
  context.assert(entrySource.includes('xtend-maraca:kernel-fiber'), 'entry dispatches kernel fiber telemetry');
  context.assert(!/\.innerHTML\s*=/u.test(entrySource), 'kernel-backed entry has no innerHTML assignment sink');
  context.assert(!/\.outerHTML\s*=/u.test(entrySource), 'kernel-backed entry has no outerHTML assignment sink');
  context.assert(!/\.insertAdjacentHTML\s*\(/u.test(entrySource), 'kernel-backed entry has no insertAdjacentHTML sink');
  context.assert(!/document\.write\s*\(/u.test(entrySource), 'kernel-backed entry has no document.write sink');
  context.assert(cliStatus === 0, 'xt maraca plan --kernel strict exits successfully');
  context.assert(cliPlan.kernel && cliPlan.kernel.enabled === true, 'CLI returns strict kernel plan JSON');
  context.assert(cliIo.readStderr() === '', 'strict kernel CLI plan has no stderr output');

  return context.result({
    schema: MARACA_KERNEL_PLAN_SCHEMA,
    kernel: strictPlan.kernel.summary,
    entry: entryPath
  });
}

function printMaracaKernelOrchestrationReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Kernel-Orchestrierung erfolgreich.',
    failureTitle: 'XTend Maraca Kernel-Orchestrierung fehlgeschlagen:'
  });
}

function isKernelIntegrityBrowserSmokeRequired() {
  return process.env.XTEND_MARACA_KERNEL_INTEGRITY_BROWSER_REQUIRED === '1';
}

function markKernelIntegrityBrowserSmokeUnavailable(context, message) {
  if (isKernelIntegrityBrowserSmokeRequired()) {
    context.fail(message);
    return;
  }
  context.skip(`${message}; set XTEND_MARACA_KERNEL_INTEGRITY_BROWSER_REQUIRED=1 to make it blocking`);
}

function writeKernelIntegritySmokeFixture(rootDir) {
  const fixturePath = resolveRepoPath(`${MARACA_KERNEL_INTEGRITY_OUT_DIR}/kernel-integrity-smoke.html`, rootDir);
  fs.writeFileSync(fixturePath, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Maraca Kernel Integrity Smoke</title>
</head>
<body>
  <div id="xtend-maraca-root" data-maraca-root></div>
  <pre id="result">{"ok":false,"status":"pending"}</pre>
  <script>
    window.__XTendMaracaDisableAutoBoot = true;
  </script>
  <script type="module">
    const result = document.getElementById('result');
    const playCalls = [];
    const fullscreenEvents = [];
    let fullscreenElement = null;
    const media = {
      'video-one': { mediaId: 'video-one', kind: 'video', mediaType: 'video/mp4', src: '/tests/fixtures/kernel-video-one.mp4', title: 'Video One' },
      'audio-one': { mediaId: 'audio-one', kind: 'audio', mediaType: 'audio/mpeg', src: '/tests/fixtures/kernel-audio-one.mp3', title: 'Audio One' },
      'video-two': { mediaId: 'video-two', kind: 'video', mediaType: 'video/mp4', src: '/tests/fixtures/kernel-video-two.mp4', title: 'Video Two' },
      'image-one': { mediaId: 'image-one', kind: 'image', mediaType: 'image/jpeg', src: '/tests/fixtures/kernel-image-one.jpg', title: 'Image One' }
    };
    const basePlayer = {
      id: 'demo-kernel-player',
      label: 'Player',
      title: 'No media',
      subtitle: 'Waiting for media',
      kind: 'video',
      src: '',
      poster: '',
      mediaType: 'video',
      controls: true,
      hidden: true,
      open: false,
      surfaceId: 'demo.kernel.player',
      active: false,
      minimized: false,
      maximized: false,
      draggable: true,
      resizable: true,
      modal: false,
      initialX: 80,
      initialY: 80,
      initialWidth: 640,
      initialHeight: 380,
      tone: 'neutral',
      actions: []
    };
    const closedLightbox = { id: 'demo-kernel-lightbox', title: 'Lightbox', src: '', hidden: true, open: false, tone: 'neutral' };
    const closedPlayer = () => ({ ...basePlayer });
    const playerState = (record) => ({
      ...basePlayer,
      title: record.title,
      subtitle: record.src,
      mediaId: record.mediaId,
      kind: record.kind,
      src: record.src,
      mediaType: record.mediaType,
      hidden: false,
      open: true,
      active: true
    });
    const lightboxState = (record) => ({
      id: 'demo-kernel-lightbox',
      title: record.title,
      src: record.src,
      hidden: false,
      open: true,
      tone: 'neutral',
      surfaceId: 'demo.kernel.lightbox'
    });
    const statusState = (text, tone = 'neutral') => ({ id: 'demo-kernel-status', text, tone });
    function patchFor(actionId, payload = {}) {
      const action = String(actionId || '');
      if (action.endsWith('.play')) {
        const record = media[payload.mediaId] || media['video-one'];
        return { status: statusState('Playing ' + record.title, 'success'), player: playerState(record), lightbox: { ...closedLightbox } };
      }
      if (action.endsWith('.lightbox')) {
        const record = media[payload.mediaId] || media['image-one'];
        return { status: statusState('Lightbox ' + record.title, 'info'), player: closedPlayer(), lightbox: lightboxState(record) };
      }
      if (action.endsWith('.dismiss')) {
        return { status: statusState('Dismissed', 'neutral'), player: closedPlayer(), lightbox: { ...closedLightbox } };
      }
      return { status: statusState('Player closed', 'neutral'), player: closedPlayer(), lightbox: { ...closedLightbox } };
    }
    function write(value) {
      result.textContent = JSON.stringify(value, null, 2);
      document.documentElement.setAttribute('data-kernel-integrity-ok', value.ok ? 'true' : 'false');
    }
    function wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async function waitFor(label, predicate, timeout = 5000) {
      const started = Date.now();
      let last = '';
      while (Date.now() - started < timeout) {
        try {
          const value = predicate();
          if (value) return value;
        } catch (error) {
          last = error && error.message ? error.message : String(error);
        }
        await wait(50);
      }
      throw new Error(label + ' did not settle' + (last ? ': ' + last : ''));
    }
    function surface(id) {
      return document.querySelector('[data-maraca-surface="' + id + '"]');
    }
    function player() {
      const host = surface('demo.kernel.player');
      return host && host.querySelector('x-player') || document.querySelector('x-player');
    }
    function manager() {
      return document.querySelector('x-surface-manager');
    }
    function managerRecord(id) {
      const target = manager();
      const snapshot = target && (typeof target.readSnapshot === 'function' ? target.readSnapshot() : target.snapshot && target.snapshot());
      return snapshot && Array.isArray(snapshot.surfaces) ? snapshot.surfaces.find((entry) => entry.id === id) : null;
    }
    async function run(action, payload = {}) {
      const output = await window.__XTendMaracaOrchestration.dispatchCommand(action, payload, {
        eventId: 'integrity:' + action,
        eventName: 'integrity'
      });
      if (!output || output.status !== 'success') {
        throw new Error('Action ' + action + ' did not return an action success result.');
      }
      return output;
    }
    async function dispatchCommand(action, payload = {}) {
      const output = await window.__XTendMaracaOrchestration.dispatchCommand({
        command: action,
        payload,
        correlationId: 'kernel-integrity-command:' + action
      }, {
        eventName: 'xtend-command'
      });
      if (!output || output.status !== 'success') {
        throw new Error('Command ' + action + ' did not return a command dispatch success result.');
      }
      return output;
    }

    if (window.HTMLMediaElement) {
      HTMLMediaElement.prototype.play = function play() {
        playCalls.push({ src: this.currentSrc || this.src || '', localName: this.localName });
        this.dispatchEvent(new Event('play'));
        this.dispatchEvent(new Event('playing'));
        return Promise.resolve();
      };
      HTMLMediaElement.prototype.pause = function pause() {
        this.dispatchEvent(new Event('pause'));
      };
    }
    if (window.Element) {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreenElement });
      document.exitFullscreen = () => {
        fullscreenElement = null;
        document.dispatchEvent(new Event('fullscreenchange'));
        return Promise.resolve();
      };
      Element.prototype.requestFullscreen = function requestFullscreen() {
        fullscreenElement = this;
        fullscreenEvents.push(this.localName || this.tagName || 'element');
        document.dispatchEvent(new Event('fullscreenchange'));
        return Promise.resolve();
      };
      Element.prototype.webkitRequestFullscreen = Element.prototype.requestFullscreen;
      document.webkitExitFullscreen = document.exitFullscreen;
      Object.defineProperty(document, 'webkitFullscreenElement', { configurable: true, get: () => fullscreenElement });
    }

    try {
      const maraca = await import('./xtend.maraca.mjs');
      const bootOptions = {
        root: document.getElementById('xtend-maraca-root'),
        lazyStrategy: 'eager',
        dataSourceAdapters: {
          host: {
            async invoke({ payload, context }) {
              const actionId = context && context.action && context.action.id || '';
              return { schema: 'xtend.maraca.kernel-integrity-state.v1', state: patchFor(actionId, payload || {}) };
            }
          }
        }
      };
      const boot = await maraca.bootXtendMaraca(bootOptions);
      if (!boot.ok || !window.__XTendMaracaKernel || !window.__XTendMaracaOrchestration) {
        throw new Error('Maraca kernel boot did not expose runtime handles.');
      }
      await customElements.whenDefined('x-surface-manager');
      await customElements.whenDefined('x-surface-window');
      await customElements.whenDefined('x-player');
      await customElements.whenDefined('x-lightbox');

      const firstDispatch = await dispatchCommand('demo.kernel.play', { mediaId: 'video-one' });
      const first = firstDispatch;
      await waitFor('first player src', () => player() && player().getAttribute('src') === media['video-one'].src);
      await waitFor('first player materialized', () => {
        const record = managerRecord('demo.kernel.player');
        return record && record.status === 'open' && record.active === true;
      });

      await run('demo.kernel.closePlayer');
      await waitFor('player closed', () => {
        const record = managerRecord('demo.kernel.player');
        return record && (record.status === 'closed' || record.status === 'minimized' || surface('demo.kernel.player').hasAttribute('hidden'));
      });

      await run('demo.kernel.lightbox', { mediaId: 'image-one' });
      const lightbox = await waitFor('lightbox opened', () => {
        const target = surface('demo.kernel.lightbox');
        return target && target.hasAttribute('open') && target.getAttribute('src') === media['image-one'].src && target;
      });
      if (typeof lightbox.close === 'function') lightbox.close({ source: 'kernel-integrity' });
      await run('demo.kernel.dismiss');
      await waitFor('lightbox dismissed', () => {
        const target = surface('demo.kernel.lightbox');
        return target && !target.hasAttribute('open') && target.hasAttribute('hidden');
      });

      const second = await run('demo.kernel.play', { mediaId: 'audio-one' });
      await waitFor('audio player src', () => player() && player().getAttribute('src') === media['audio-one'].src);
      await waitFor('audio materialized', () => {
        const record = managerRecord('demo.kernel.player');
        return record && record.status === 'open' && record.active === true;
      });

      const fullscreen = player().shadowRoot && player().shadowRoot.querySelector('#fullscreen');
      if (!fullscreen) throw new Error('XPlayer fullscreen control was not rendered.');
      fullscreen.click();
      await waitFor('fullscreen toggled', () => fullscreenEvents.length > 0 && document.fullscreenElement);

      await run('demo.kernel.closePlayer');
      const third = await run('demo.kernel.play', { mediaId: 'video-two' });
      await waitFor('third player src', () => player() && player().getAttribute('src') === media['video-two'].src);

      const kernelSnapshot = window.__XTendMaracaKernel.snapshot();
      const orchestrationSnapshot = window.__XTendMaracaOrchestration.snapshot();
      const hydrationSnapshot = window.__XTendMaracaHydration.snapshot();
      const checks = {
        firstCommandResult: firstDispatch.schema === 'xtend.epic18.rmt-action-result.v1',
        firstActionResult: first.schema === 'xtend.epic18.rmt-action-result.v1',
        secondActionResult: second.schema === 'xtend.epic18.rmt-action-result.v1',
        thirdActionResult: third.schema === 'xtend.epic18.rmt-action-result.v1',
        remotePlayCount: playCalls.length >= 3,
        playerReopenedAfterClose: player().getAttribute('src') === media['video-two'].src,
        lightboxCycle: surface('demo.kernel.lightbox').hasAttribute('hidden') && !surface('demo.kernel.lightbox').hasAttribute('open'),
        fullscreenEvent: fullscreenEvents.length > 0,
        kernelScheduled: kernelSnapshot.enabled === true && kernelSnapshot.scheduledEndpoints.length > 0,
        kernelFibers: kernelSnapshot.fibers.some((entry) => entry.kind === 'action') && kernelSnapshot.fibers.some((entry) => entry.kind === 'state-change'),
        commandEventFiber: kernelSnapshot.fibers.some((entry) => String(entry.fiber || '').includes('/event/')),
        commandActionFiber: kernelSnapshot.fibers.some((entry) => entry.kind === 'action' && String(entry.fiber || '').includes('/action/demo.kernel.play')),
        managedControllerCommitted: orchestrationSnapshot.stateCommitCount >= 5 && orchestrationSnapshot.commitCount >= orchestrationSnapshot.stateCommitCount,
        modelReaderContract: window.__XTendMaracaOrchestration.model.schema === 'xtend.rmt.model-reader.v1',
        publicMvcFacade: !('appRuntime' in window.__XTendMaracaOrchestration)
          && !('renderer' in window.__XTendMaracaOrchestration)
          && !('eventRuntime' in window.__XTendMaracaOrchestration)
          && !('rawActionRuntime' in window.__XTendMaracaOrchestration)
          && Object.isFrozen(boot)
          && Object.isFrozen(boot.orchestration)
          && Object.isFrozen(maraca.MARACA_COMPONENTS)
          && Object.isFrozen(maraca.MARACA_COMPONENTS[0])
          && Object.isFrozen(window.__XTendMaracaOrchestration.model.snapshot())
          && !('scheduleWork' in window.__XTendMaracaKernel)
          && !('hydrateAll' in window.__XTendMaracaHydration)
          && !('publish' in window.__XTendMaracaTelemetry),
        hydrationRecords: Array.isArray(hydrationSnapshot.history)
          && hydrationSnapshot.history.some((entry) => Array.isArray(entry.tags) && entry.tags.includes('x-player'))
          && hydrationSnapshot.history.some((entry) => Array.isArray(entry.tags) && entry.tags.includes('x-lightbox'))
      };
      const firstKernelHandle = window.__XTendMaracaKernel;
      const firstOrchestrationHandle = window.__XTendMaracaOrchestration;
      const firstDispose = maraca.disposeXtendMaraca('kernel-integrity-lifecycle');
      const secondDispose = maraca.disposeXtendMaraca('kernel-integrity-lifecycle-repeat');
      checks.lifecycleDisposed = firstDispose.kernel === true
        && firstDispose.orchestration === true
        && firstKernelHandle.snapshot().status === 'disposed'
        && firstOrchestrationHandle.snapshot().status === 'not_booted';
      checks.lifecycleDebugHandlesCleared = window.__XTendMaracaKernel === null
        && window.__XTendMaracaOrchestration === null
        && window.__XTendMaracaHydration === null
        && window.__XTendMaracaTelemetry === null;
      checks.lifecycleDoubleDispose = ['orchestration', 'resume', 'hydration', 'kernel', 'appServices', 'renderer', 'host']
        .every((key) => secondDispose[key] === false);
      const reboot = await maraca.bootXtendMaraca(bootOptions);
      const rebootAction = await window.__XTendMaracaOrchestration.dispatchCommand('demo.kernel.dismiss', {}, {
        eventId: 'integrity:reboot',
        eventName: 'integrity'
      });
      checks.lifecycleReboot = reboot.ok === true
        && window.__XTendMaracaKernel !== firstKernelHandle
        && window.__XTendMaracaOrchestration
        && window.__XTendMaracaOrchestration.snapshot().phase === 'ready'
        && rebootAction && rebootAction.status === 'success';
      write({
        ok: Object.values(checks).every(Boolean),
        schema: 'xtend.maraca.kernel-integrity.browser-smoke.v1',
        checks,
        debug: {
          firstDispose,
          secondDispose,
          reboot: reboot && { ok: reboot.ok, status: reboot.status },
          rebootAction: rebootAction && { schema: rebootAction.schema, status: rebootAction.status },
          kernelFibers: (kernelSnapshot.fibers || []).map((entry) => ({ kind: entry.kind, fiber: entry.fiber }))
        },
        playCalls,
        fullscreenEvents,
        kernel: kernelSnapshot,
        orchestration: orchestrationSnapshot,
        hydration: hydrationSnapshot
      });
    } catch (error) {
      write({
        ok: false,
        schema: 'xtend.maraca.kernel-integrity.browser-smoke.v1',
        code: error && error.code || null,
        diagnostic: error && error.diagnostic || null,
        error: error && error.stack ? error.stack : String(error)
      });
    }
  </script>
</body>
</html>
`, 'utf8');
  return fixturePath;
}

async function runKernelIntegrityBrowserSmoke(context, rootDir) {
  const engine = detectAvailableEngine({
    engine: process.env.XTEND_BROWSER_HYPERVISOR_ENGINE || 'chromium'
  });
  if (!engine) {
    markKernelIntegrityBrowserSmokeUnavailable(context, 'kernel integrity browser smoke skipped because no Hypervisor provider is available');
    return null;
  }
  const fixturePath = writeKernelIntegritySmokeFixture(rootDir);
  const relativeFixturePath = path.relative(rootDir, fixturePath).replace(/\\/gu, '/');
  let serverHandle = null;
  try {
    serverHandle = await listenXtendDevServer({
      rootDir,
      defaultPath: relativeFixturePath,
      port: 0
    });
    const targetUrl = `${serverHandle.origin}/${relativeFixturePath}`;
    const resultKey = '__xtendMaracaKernelIntegrityResult';
    const browser = await runFixture({
      rootDir,
      engine,
      fixturePath,
      url: targetUrl,
      resultKey,
      timeoutMs: MARACA_KERNEL_INTEGRITY_BROWSER_TIMEOUT_MS,
      scripts: [{
        script: `(() => { const key = ${JSON.stringify(resultKey)}; Object.defineProperty(window, key, { configurable: true, get() { const text = document.getElementById('result')?.textContent || ''; try { const payload = JSON.parse(text); if (payload.status === 'pending' || typeof payload.ok !== 'boolean') return { status: 'pending' }; return { status: payload.ok ? 'passed' : 'failed', payload }; } catch (_) { return { status: 'pending' }; } } }); })();`
      }]
    });
    const payload = browser.result && browser.result.payload;
    if (!payload) {
      context.fail('kernel integrity browser smoke did not expose a result payload');
      return null;
    }
    context.assert(payload.ok === true, `kernel integrity browser smoke passes${payload.ok ? '' : ` (${payload.code ? `${payload.code}: ` : ''}${payload.diagnostic ? `${JSON.stringify(payload.diagnostic)} ` : ''}${payload.error || JSON.stringify({ checks: payload.checks || {}, debug: payload.debug || {} })})`}`);
    if (payload.checks) {
      Object.entries(payload.checks).forEach(([key, value]) => {
        context.assert(value === true, `kernel integrity browser check ${key} passes`);
      });
    }
    return payload;
  } catch (error) {
    const code = error && error.code ? error.code : '';
    const message = error && error.message ? error.message : String(error);
    if ((code === 'EPERM' || code === 'EACCES') && /listen/u.test(message)) {
      markKernelIntegrityBrowserSmokeUnavailable(context, `kernel integrity browser smoke skipped because loopback listen is denied (${message})`);
      return null;
    }
    context.fail(`kernel integrity browser smoke failed (${message})`);
    return null;
  } finally {
    if (serverHandle && serverHandle.server) {
      await new Promise((resolve) => serverHandle.server.close(resolve));
    }
  }
}

async function runMaracaKernelIntegritySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-kernel-integrity',
    label: 'XTend Maraca Kernel Integrity'
  });
  const strictPlan = planKernelIntegrityFixture(rootDir);
  const result = await buildKernelIntegrityFixtureAsync(rootDir);
  const entryPath = result.bundleReport && result.bundleReport.entry;
  const reportPath = resolveRepoPath(`${MARACA_KERNEL_INTEGRITY_OUT_DIR}/xtend.maraca.report.json`, rootDir);
  const controllerPath = resolveRepoPath(`${MARACA_KERNEL_INTEGRITY_OUT_DIR}/${MARACA_KERNEL_CONTROLLER_ASSET}`, rootDir);
  const planRuntimePath = resolveRepoPath(`${MARACA_KERNEL_INTEGRITY_OUT_DIR}/runtime/xtend-maraca-plan-runtime.mjs`, rootDir);
  const browserHostPath = resolveRepoPath(`${MARACA_KERNEL_INTEGRITY_OUT_DIR}/runtime/browser-host-adapter.mjs`, rootDir);
  const entrySource = entryPath && fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const planRuntimeSource = fs.existsSync(planRuntimePath) ? fs.readFileSync(planRuntimePath, 'utf8') : '';
  const browserHostSource = fs.existsSync(browserHostPath) ? fs.readFileSync(browserHostPath, 'utf8') : '';
  const report = fs.existsSync(reportPath) ? readJson(`${MARACA_KERNEL_INTEGRITY_OUT_DIR}/xtend.maraca.report.json`, rootDir) : null;

  context.assert(strictPlan.ok === true, `kernel integrity plan passes${strictPlan.ok ? '' : ` (${strictPlan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(strictPlan.kernel && strictPlan.kernel.enabled === true, 'kernel integrity plan enables strict kernel');
  context.assert(strictPlan.hydration && strictPlan.hydration.enabled === true, 'kernel integrity plan enables strict hydration');
  context.assert(strictPlan.transitions && strictPlan.transitions.enabled === true, 'kernel integrity plan enables strict transitions');
  context.assert(strictPlan.kernel.summary.fiberCount >= 12, 'kernel integrity plan emits action, event, render and hydration fibers');
  const selectedComponents = strictPlan.components && Array.isArray(strictPlan.components.selected)
    ? strictPlan.components.selected
    : [];
  context.assert(selectedComponents.some((entry) => entry.source === 'components/xplayer.js'), 'kernel integrity component graph includes x-player');
  context.assert(selectedComponents.some((entry) => entry.source === 'components/xlightbox.js'), 'kernel integrity component graph includes x-lightbox');
  context.assert(result.ok === true, `kernel integrity bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(report && report.kernel && report.kernel.enabled === true, 'kernel integrity bundle report records enabled kernel');
  context.assert(report && report.hydration && report.hydration.enabled === true, 'kernel integrity bundle report records enabled hydration');
  context.assert(report && report.bundleFiles && report.bundleFiles.some((file) => file.fileName === MARACA_KERNEL_CONTROLLER_ASSET), 'kernel integrity bundle packages the reusable controller');
  context.assert(fs.existsSync(controllerPath), 'kernel integrity controller runtime asset exists');
  context.assert(!planRuntimeSource.includes("'x-player'") && !planRuntimeSource.includes("'x-lightbox'"), 'canonical bundle controller contains no concrete media-component tags');
  context.assert(report && report.stackModules && report.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-presentation-effect-adapter.js'), 'kernel integrity bundle packages the PresentationEffectPort adapter');
  context.assert(
    !entrySource.includes('window.__XTendMaracaKernel')
      && browserHostSource.includes("windowTarget.__XTendMaracaKernel = readOnlySnapshotHandle"),
    'bundle exposes only the read-only kernel snapshot facade through the host adapter'
  );
  context.assert(!/\.innerHTML\s*=/u.test(entrySource), 'kernel integrity entry has no innerHTML assignment sink');
  context.assert(!/\.outerHTML\s*=/u.test(entrySource), 'kernel integrity entry has no outerHTML assignment sink');
  context.assert(!/\.insertAdjacentHTML\s*\(/u.test(entrySource), 'kernel integrity entry has no insertAdjacentHTML sink');
  context.assert(!/document\.write\s*\(/u.test(entrySource), 'kernel integrity entry has no document.write sink');

  const browserSmoke = await runKernelIntegrityBrowserSmoke(context, rootDir);

  return context.result({
    schema: 'xtend.maraca.kernel-integrity.v1',
    kernel: strictPlan.kernel.summary,
    entry: entryPath,
    browserSmoke
  });
}

function printMaracaKernelIntegrityReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Kernel Integrity erfolgreich.',
    failureTitle: 'XTend Maraca Kernel Integrity fehlgeschlagen:'
  });
}

async function runMaracaValidationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-validation',
    label: 'XTend Maraca Form Validation'
  });
  const strictPlan = planValidationFixture(rootDir);
  const validationOffPlan = planValidationFixture(rootDir, { validation: 'off' });
  const strictWithoutArtifact = planOrchestrationFixture(rootDir, { out: '.xtend-build/maraca/validation-missing', validation: 'strict' });
  const result = await buildValidationFixtureAsync(rootDir);
  const entryPath = result.bundleReport && result.bundleReport.entry;
  const reportPath = resolveRepoPath(`${MARACA_VALIDATION_OUT_DIR}/xtend.maraca.report.json`, rootDir);
  const planRuntimePath = resolveRepoPath(`${MARACA_VALIDATION_OUT_DIR}/runtime/xtend-maraca-plan-runtime.mjs`, rootDir);
  const compositionRuntimePath = resolveRepoPath(`${MARACA_VALIDATION_OUT_DIR}/runtime/xtend-maraca-browser-composition-runtime.mjs`, rootDir);
  const entrySource = entryPath && fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const planRuntimeSource = fs.existsSync(planRuntimePath) ? fs.readFileSync(planRuntimePath, 'utf8') : '';
  const compositionRuntimeSource = fs.existsSync(compositionRuntimePath) ? fs.readFileSync(compositionRuntimePath, 'utf8') : '';
  const report = fs.existsSync(reportPath) ? readJson(`${MARACA_VALIDATION_OUT_DIR}/xtend.maraca.report.json`, rootDir) : null;
  const cliIo = createCliIo();
  const cliStatus = await runCliAsync([
    'maraca',
    'plan',
    MARACA_VALIDATION_FIXTURE,
    '--orchestration',
    'strict',
    '--kernel',
    'strict',
    '--hydration',
    'strict',
    '--validation',
    'strict',
    '--json'
  ], cliIo);
  const cliPlan = JSON.parse(cliIo.readStdout());

  context.assert(strictPlan.ok === true, `strict validation plan passes${strictPlan.ok ? '' : ` (${strictPlan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(strictPlan.validation && strictPlan.validation.schema === MARACA_VALIDATION_PLAN_SCHEMA, 'strict validation plan uses validation plan schema');
  context.assert(strictPlan.validation && strictPlan.validation.mode === 'strict', 'strict validation plan records strict mode');
  context.assert(strictPlan.validation && strictPlan.validation.enabled === true, 'strict validation plan enables validation runtime');
  context.assert(strictPlan.validation.summary.groupCount === 1, 'strict validation plan summarizes validation groups');
  context.assert(strictPlan.validation.summary.fieldCount === 2, 'strict validation plan summarizes validation fields');
  context.assert(strictPlan.validation.summary.actionGateCount === 1, 'strict validation plan summarizes action gates');
  context.assert(strictPlan.validation.summary.statePatchCount === 1, 'strict validation plan summarizes command disabled patches');
  context.assert(strictPlan.runtimeModules.includes('xtendrmt/rmt-form-validation-runtime.js'), 'strict validation plan requires form validation runtime module');
  context.assert(strictPlan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-form-validation-runtime.js'), 'strict validation plan includes form validation runtime in the bundle graph');
  context.assert(strictPlan.kernel && strictPlan.kernel.artifact.scheduler.fibers.some((fiber) => fiber.kind === 'validation'), 'strict validation plan has kernel validation fiber');
  context.assert(validationOffPlan.ok === true && validationOffPlan.validation.enabled === false, 'validation off keeps legacy action behavior available');
  context.assert(strictWithoutArtifact.ok === false, 'strict validation blocks when no validation plan exists');
  context.assert(strictWithoutArtifact.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.validation_missing'), 'strict validation without artifact reports validation precondition');

  context.assert(result.ok === true, `strict validation bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(report && report.validation && report.validation.enabled === true, 'bundle report includes validation telemetry');
  context.assert(report && report.validation && report.validation.summary.actionGateCount === 1, 'bundle report summarizes validation action gates');
  context.assert(report && report.validation && report.validation.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'), 'bundle report validation diagnostics are non-blocking');
  context.assert(entrySource.includes('MARACA_VALIDATION'), 'bundle embeds validation plan');
  context.assert(entrySource.includes('xtendrmt/rmt-form-validation-runtime.js'), 'bundle wires form validation runtime through the explicit runtime-module map');
  context.assert(entrySource.includes('createRmtFormValidationEvaluator')
    && entrySource.includes('createRmtFormValidationViewProjector'),
  'bundle creates separate validation evaluator and View projector ports');
  context.assert(compositionRuntimeSource.includes("XTendRmtFormValidationRuntime: Object.freeze(['xtendrmt/rmt-form-validation-runtime.js', 'XTendRmtFormValidationRuntime'])")
    && !entrySource.includes('globalTarget.XTendRmtFormValidationRuntime = api'),
  'bundle injects form validation without materializing a global runtime mirror');
  context.assert(planRuntimeSource.includes('evaluateCommandValidation(commandId, metadata, null, { preflight: true })')
    && planRuntimeSource.includes('function validationSelection(commandId, changedStates = [], options = {})')
    && planRuntimeSource.includes('const revealedValidationFields = new Set()')
    && planRuntimeSource.includes('modelCommandPort.apply(modelOperations')
    && !/runtimes\.state\.(?:setState|patchState|dispatch|transaction)\s*\(/u.test(planRuntimeSource)
    && planRuntimeSource.includes('runtimes.validationViewProjector.prepare(evaluation')
    && planRuntimeSource.includes('runtimes.validationViewProjector.finalize(')
    && planRuntimeSource.includes('const revealedMatches = matches.filter((projection) => projection.revealed !== false)')
    && planRuntimeSource.includes('if (revealedMatches.length)')
    && planRuntimeSource.includes("'textarea-invalid'")
    && planRuntimeSource.includes('metadata: { ...clone(metadata, {}), preserveActiveInputDraft }')
    && planRuntimeSource.includes("operation: 'reconcile-children'")
    && !planRuntimeSource.includes('runtimes.validationViewProjector.project(')
    && !planRuntimeSource.includes('runtimes.validation.apply(validationStage.evaluation'),
  'canonical plan runtime prepares validation once, preserves unrevealed Model-owned state and folds revealed evidence into the atomic Model and DOM commit path');
  context.assert(planRuntimeSource.includes('if (modelOperations.length > 0')
    && planRuntimeSource.includes('const prospectiveSnapshot = {')
    && planRuntimeSource.includes('prospectiveSnapshot,')
    && planRuntimeSource.includes('const changedValidationStates = modelOperations')
    && planRuntimeSource.includes('changedStates: changedValidationStates')
    && planRuntimeSource.includes('states: asRecord(modelSnapshot).states'),
  'canonical plan runtime refreshes validation against the prospective Model state before committing the View projection');
  const browserHostAdapterSource = readText('xtend-maraca/browser-host-adapter.mjs', rootDir);
  context.assert(compositionRuntimeSource.includes('host.installPublicFacades({') && browserHostAdapterSource.includes('windowTarget.__XTendMaracaValidation = freeze(clone(values.validation))'), 'composition delegates immutable validation snapshot publication to the host adapter');
  context.assert(compositionRuntimeSource.includes('validationPlan: config.validation'), 'safe facade exposes the immutable validation plan');
  context.assert(planRuntimeSource.includes('xtend-maraca:validation-blocked'), 'bundle dispatches validation-blocked telemetry');
  context.assert(planRuntimeSource.includes("validationMode: runtimes && runtimes.validationEvaluator ? 'ports'")
    && planRuntimeSource.includes("operation: 'maraca.validation.view-projection.prepare'")
    && planRuntimeSource.includes("operation: 'maraca.validation.view-projection.finalize'"),
  'canonical validation telemetry identifies the typed prepare/commit/finalize port path');
  context.assert(!/\.innerHTML\s*=/u.test(entrySource), 'validation bundle entry has no innerHTML assignment sink');
  context.assert(!/\.outerHTML\s*=/u.test(entrySource), 'validation bundle entry has no outerHTML assignment sink');
  context.assert(!/\.insertAdjacentHTML\s*\(/u.test(entrySource), 'validation bundle entry has no insertAdjacentHTML sink');
  context.assert(!/document\.write\s*\(/u.test(entrySource), 'validation bundle entry has no document.write sink');

  const runtimePath = resolveRepoPath('xtendrmt/rmt-form-validation-runtime.js', rootDir);
  const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
  const directDomWriterPattern = /(?:\.(?:setAttribute|removeAttribute|toggleAttribute)\s*\(|\.style(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])\s*=(?!=)|\.style\.setProperty\s*\()/u;
  context.assert(!directDomWriterPattern.test(runtimeSource), 'Validation runtime source has no direct attribute, property, or style writer');
  context.assert(
    runtimeSource.includes("from './rmt-form-validation-evaluator.js'")
      && runtimeSource.includes("from './rmt-form-validation-view-projector.js'")
      && runtimeSource.includes("from './rmt-form-validation-model-command-adapter.js'"),
    'Validation compatibility runtime delegates to physically separate Model, View and command-port sources'
  );
  context.assert(
    !/\.(?:getState|setState|querySelectorAll|dispatchEvent)\s*\(/u.test(runtimeSource),
    'Validation compatibility composer performs no concrete Model, DOM or event work'
  );
  const validationModule = await import(`${pathToFileURL(runtimePath).href}?suite=maraca-validation-ports`);
  const multiStepValidationPlan = {
    groups: [
      {
        id: 'customer.contact',
        includes: [],
        fields: [{
          state: 'customer.email',
          surface: 'customer.email.surface',
          rules: [{ kind: 'required' }, { kind: 'email' }],
          message: 'Enter a valid email address.'
        }]
      },
      {
        id: 'customer.issue',
        includes: [],
        fields: [{
          state: 'customer.issue.details',
          surface: 'customer.issue.surface',
          rules: [{ kind: 'required' }],
          message: 'Describe the issue.'
        }]
      },
      {
        id: 'customer.submit-ready',
        includes: ['customer.contact', 'customer.issue'],
        fields: []
      }
    ],
    actionGates: [
      { id: 'contact-gate', action: 'customer.next-contact', group: 'customer.contact' },
      { id: 'issue-gate', action: 'customer.next-issue', group: 'customer.issue' },
      { id: 'submit-gate', action: 'customer.submit', group: 'customer.submit-ready' }
    ],
    statePatches: [
      { id: 'contact-patch', group: 'customer.contact', targetState: 'customer.next-contact', path: 'disabled' },
      { id: 'issue-patch', group: 'customer.issue', targetState: 'customer.next-issue', path: 'disabled' },
      { id: 'submit-patch', group: 'customer.submit-ready', targetState: 'customer.submit', path: 'disabled' }
    ]
  };
  const multiStepEvaluator = validationModule.createRmtFormValidationEvaluator({
    validationPlan: multiStepValidationPlan
  });
  const multiStepStates = {
    'customer.email': { value: 'a', field: 'email' },
    'customer.issue.details': { value: '', field: 'details' },
    'customer.next-contact': { disabled: false },
    'customer.next-issue': { disabled: false },
    'customer.submit': { disabled: false }
  };
  const contactGate = multiStepEvaluator.evaluateAction('customer.next-contact', {
    states: multiStepStates,
    report: true,
    reveal: true
  });
  context.assert(contactGate.valid === false
    && contactGate.evaluation.results.length === 1
    && contactGate.evaluation.results[0].group === 'customer.contact'
    && contactGate.evaluation.viewProjection.every((projection) => projection.group === 'customer.contact')
    && contactGate.evaluation.modelOperations.every((operation) => operation.state === 'customer.next-contact'),
  'a multi-step Action gate evaluates and projects only its declared validation group');
  const passiveEvaluation = multiStepEvaluator.evaluate({
    states: multiStepStates,
    report: false,
    reveal: false
  }, ['customer.contact', 'customer.submit-ready']);
  context.assert(passiveEvaluation.valid === false
    && passiveEvaluation.viewProjection.every((projection) => projection.revealed === false),
  'passive field-state evaluation updates validity without revealing current or future-step errors');
  const reactiveEvaluation = multiStepEvaluator.evaluate({
    states: multiStepStates,
    revealedFields: ['customer.email'],
    report: false,
    reveal: false
  }, ['customer.contact', 'customer.submit-ready']);
  const reactiveContactProjection = reactiveEvaluation.viewProjection.find((projection) => projection.target.state === 'customer.email');
  const reactiveIssueProjection = reactiveEvaluation.viewProjection.find((projection) => projection.target.state === 'customer.issue.details');
  context.assert(reactiveContactProjection && reactiveContactProjection.revealed === true
    && reactiveIssueProjection && reactiveIssueProjection.revealed === false,
  'passive re-evaluation keeps attempted fields reactive without revealing untouched fields in the next step');
  const values = {
    'demo.validation.name': { value: '', field: 'name' },
    'demo.validation.email': { value: '', field: 'email' },
    'demo.validation.next': { disabled: true }
  };
  const stateRuntime = {
    getState(id) {
      return values[id];
    },
    setState(id, value) {
      values[id] = value;
    }
  };
  const fakeElements = strictPlan.validation.artifact.fields.map((field) => {
    const attributes = new Map([
      ['data-maraca-surface', field.surface],
      ['data-field', values[field.state] && values[field.state].field || '']
    ]);
    return {
      getAttribute(name) {
        return attributes.get(name) || '';
      },
      setAttribute(name, value) {
        attributes.set(name, value === undefined ? '' : String(value));
      },
      removeAttribute(name) {
        attributes.delete(name);
      },
      hasAttribute(name) {
        return attributes.has(name);
      },
      reportValidity() {
        this.reportCount = (this.reportCount || 0) + 1;
        return false;
      }
    };
  });
  const fakeRoot = {
    querySelectorAll(selector) {
      if (selector === '[data-maraca-surface]' || selector === '[data-field]') return fakeElements;
      return [];
    }
  };
  const splitValidationDom = createDomCommitHarness();
  const splitViewProjector = validationModule.createRmtFormValidationViewProjector({
    root: fakeRoot,
    domRenderer: splitValidationDom.renderer,
    strict: true
  });
  const splitEvaluation = Object.freeze({
    schema: 'xtend.rmt.form-validation-evaluation.v1',
    valid: false,
    viewProjection: Object.freeze(strictPlan.validation.artifact.fields.map((field) => Object.freeze({
      schema: 'xtend.rmt.form-validation-view-projection.v1',
      group: 'demo.validation.contact',
      target: Object.freeze({ surface: field.surface, state: field.state }),
      invalid: true,
      revealed: true,
      report: true,
      message: field.message || 'Invalid'
    })))
  });
  const preparedViewProjection = splitViewProjector.prepare(splitEvaluation, { operation: 'test.prepare' });
  context.assert(Object.isFrozen(preparedViewProjection)
    && Object.isFrozen(preparedViewProjection.projections)
    && preparedViewProjection.projectionCount === strictPlan.validation.artifact.fields.length
    && splitValidationDom.commits.length === 0,
  'split Validation View preparation is immutable and performs no renderer commit');
  const finalizedViewProjection = splitViewProjector.finalize(preparedViewProjection, { operation: 'test.finalize' });
  context.assert(finalizedViewProjection.reportedCount === strictPlan.validation.artifact.fields.length
    && splitValidationDom.commits.length === 0
    && fakeElements.every((element) => element.reportCount === 1),
  'split Validation finalization only invokes native validity reporting after the shared commit');
  splitViewProjector.project(splitEvaluation, { operation: 'test.compatibility-project' });
  context.assert(splitValidationDom.commits.length === strictPlan.validation.artifact.fields.length
    && splitValidationDom.commits.every((request) => request.operation === 'merge-element'),
  'the explicit 0.6 compatibility project API retains its merge-element behavior outside managed Maraca');
  fakeElements.forEach((element) => {
    element.removeAttribute('invalid');
    element.removeAttribute('aria-invalid');
    element.removeAttribute('data-validation-message');
    element.reportCount = 0;
  });
  const validationDom = createDomCommitHarness();
  const validationRuntime = validationModule.createRmtFormValidationRuntime({
    validationPlan: strictPlan.validation.artifact,
    stateRuntime,
    root: fakeRoot,
    domRenderer: validationDom.renderer,
    windowTarget: null
  });
  validationRuntime.refresh({ reason: 'boot' });
  context.assert(fakeElements.every((element) => !element.hasAttribute('invalid')), 'Node validation smoke does not reveal field errors during boot refresh');
  const invalidGate = validationRuntime.validateAction('demo.validation.next', { report: true });
  context.assert(invalidGate.valid === false, 'Node validation smoke blocks invalid action');
  context.assert(values['demo.validation.next'].disabled === true, 'Node validation smoke keeps command disabled while invalid');
  context.assert(fakeElements.some((element) => element.hasAttribute('invalid')), 'Node validation smoke reveals field errors after blocked action gate');
  values['demo.validation.name'] = { value: 'Avery Stone', field: 'name' };
  values['demo.validation.email'] = { value: 'avery@example.com', field: 'email' };
  validationRuntime.refresh({ reason: 'node-smoke' });
  const validGate = validationRuntime.validateAction('demo.validation.next', { report: true });
  context.assert(values['demo.validation.next'].disabled === false, 'Node validation smoke enables command after valid input');
  context.assert(validGate.valid === true, 'Node validation smoke allows valid action');
  context.assert(fakeElements.every((element) => !element.hasAttribute('invalid')), 'Node validation smoke clears revealed field errors after valid input');
  context.assert(validationRuntime.snapshot().actionGateCount === 1, 'Validation runtime snapshot exposes action gate count');
  delete Object.prototype.xtendPollutedValidation;
  strictPlan.validation.artifact.statePatches.push({
    group: 'demo.validation.contact',
    targetState: 'demo.validation.next',
    path: '__proto__.xtendPollutedValidation',
    invalidValue: 'polluted',
    validValue: 'polluted'
  });
  validationRuntime.refresh({ reason: 'unsafe-patch-smoke' });
  context.assert({}.xtendPollutedValidation === undefined && !Object.prototype.hasOwnProperty.call(values['demo.validation.next'], 'xtendPollutedValidation'), 'Validation runtime rejects prototype pollution state patch paths');
  delete Object.prototype.xtendPollutedValidation;
  context.assert(validationDom.commits.length > 0 && validationDom.commits.every((request) => request.operation === 'merge-element'), 'Validation DOM state is applied through merge-element commits');
  context.assert(validationDom.commits.every((request) => request.ownership && request.ownership.owner === 'validation-runtime'), 'Validation commits reserve the validation ownership domain');
  context.assert(!validationRuntime.listDiagnostics().some((entry) => entry.code === 'rmt.dom.shared-renderer-missing'), 'Injected validation renderer avoids compatibility-writer diagnostics');
  const validationDispose = validationRuntime.dispose();
  const validationDisposeAgain = validationRuntime.dispose();
  context.assert(validationDispose.alreadyDisposed === false && validationDisposeAgain.alreadyDisposed === true, 'Validation runtime dispose is idempotent');

  const previousRendererGlobal = globalThis.XTendRmtDomDescriptorRenderer;
  const compatibilityValidationDom = createDomCommitHarness();
  let compatibilityValidationFactoryCalls = 0;
  globalThis.XTendRmtDomDescriptorRenderer = {
    createRmtDomDescriptorRenderer() {
      compatibilityValidationFactoryCalls += 1;
      return compatibilityValidationDom.renderer;
    }
  };
  const compatibilityValidationRuntime = validationModule.createRmtFormValidationRuntime({
    validationPlan: strictPlan.validation.artifact,
    stateRuntime,
    root: fakeRoot,
    documentTarget: {},
    windowTarget: null
  });
  compatibilityValidationRuntime.validateAction('demo.validation.next', { report: true });
  compatibilityValidationRuntime.validateAction('demo.validation.next', { report: true });
  context.assert(compatibilityValidationFactoryCalls === 1, 'Compatibility validation creates exactly one renderer through the global factory');
  context.assert(compatibilityValidationDom.commits.length > 0, 'Compatibility validation writes only through renderer commits');
  context.assert(compatibilityValidationRuntime.listDiagnostics().filter((entry) => entry.code === 'rmt.dom.shared-renderer-missing').length === 1, 'Compatibility validation diagnoses missing injection once');
  compatibilityValidationRuntime.dispose();
  context.assert(compatibilityValidationDom.disposals.length === 1, 'Compatibility validation disposes its owned renderer once');

  globalThis.XTendRmtDomDescriptorRenderer = undefined;
  const unavailableValidationTarget = fakeElements[0];
  const unavailableValidationWasInvalid = unavailableValidationTarget.hasAttribute('invalid');
  const unavailableValidationRuntime = validationModule.createRmtFormValidationRuntime({
    validationPlan: strictPlan.validation.artifact,
    stateRuntime,
    root: fakeRoot,
    documentTarget: {},
    windowTarget: null
  });
  let unavailableValidationError = null;
  try {
    unavailableValidationRuntime.validateAction('demo.validation.next', { report: true });
  } catch (error) {
    unavailableValidationError = error;
  }
  context.assert(unavailableValidationError && unavailableValidationError.code === 'rmt.dom.compatibility-renderer-unavailable', 'Compatibility validation fails closed when the global renderer factory is unavailable');
  context.assert(unavailableValidationTarget.hasAttribute('invalid') === unavailableValidationWasInvalid, 'Unavailable compatibility validation performs no direct DOM mutation');
  context.assert(unavailableValidationRuntime.listDiagnostics().filter((entry) => entry.code === 'rmt.dom.shared-renderer-missing').length === 1, 'Unavailable compatibility validation diagnoses missing injection once');
  globalThis.XTendRmtDomDescriptorRenderer = previousRendererGlobal;

  const strictMissingRendererRuntime = validationModule.createRmtFormValidationRuntime({
    validationPlan: strictPlan.validation.artifact,
    stateRuntime: {
      getState() {
        return { value: '' };
      },
      setState() {}
    },
    root: fakeRoot,
    strict: true,
    windowTarget: null
  });
  let strictMissingRendererError = null;
  try {
    strictMissingRendererRuntime.validateAction('demo.validation.next', { report: true });
  } catch (error) {
    strictMissingRendererError = error;
  }
  context.assert(strictMissingRendererError && strictMissingRendererError.code === 'rmt.dom.shared-renderer-missing', 'Strict validation fails closed before a DOM write without the shared renderer');

  context.assert(cliStatus === 0, 'xt maraca plan --validation strict exits successfully');
  context.assert(cliPlan.validation && cliPlan.validation.enabled === true, 'CLI returns strict validation plan JSON');
  context.assert(cliIo.readStderr() === '', 'strict validation CLI plan has no stderr output');

  return context.result({
    schema: MARACA_VALIDATION_PLAN_SCHEMA,
    validation: strictPlan.validation.summary,
    entry: entryPath
  });
}

function printMaracaValidationReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Form Validation erfolgreich.',
    failureTitle: 'XTend Maraca Form Validation fehlgeschlagen:'
  });
}

async function runMaracaTransitionSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-transitions',
    label: 'XTend Maraca Surface Transitions'
  });
  const strictPlan = planTransitionFixture(rootDir);
  const transitionsOffPlan = planTransitionFixture(rootDir, { transitions: 'off' });
  const strictWithoutArtifact = planOrchestrationFixture(rootDir, { out: '.xtend-build/maraca/transitions-missing', transitions: 'strict' });
  const result = await buildTransitionFixtureAsync(rootDir);
  const entryPath = result.bundleReport && result.bundleReport.entry;
  const reportPath = resolveRepoPath(`${MARACA_TRANSITIONS_OUT_DIR}/xtend.maraca.report.json`, rootDir);
  const entrySource = entryPath && fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const compositionRuntimeSource = readText('xtend-maraca/browser-composition-runtime.mjs', rootDir);
  const planRuntimeSource = readText('xtend-maraca/plan-runtime.mjs', rootDir);
  const report = fs.existsSync(reportPath) ? readJson(`${MARACA_TRANSITIONS_OUT_DIR}/xtend.maraca.report.json`, rootDir) : null;
  const cliIo = createCliIo();
  const cliStatus = await runCliAsync([
    'maraca',
    'plan',
    MARACA_TRANSITIONS_FIXTURE,
    '--orchestration',
    'strict',
    '--kernel',
    'strict',
    '--hydration',
    'strict',
    '--validation',
    'off',
    '--transitions',
    'strict',
    '--json'
  ], cliIo);
  const cliPlan = JSON.parse(cliIo.readStdout());

  context.assert(strictPlan.ok === true, `strict transition plan passes${strictPlan.ok ? '' : ` (${strictPlan.diagnostics.map((d) => d.message).join(', ')})`}`);
  context.assert(strictPlan.transitions && strictPlan.transitions.schema === MARACA_TRANSITION_PLAN_SCHEMA, 'strict transition plan uses transition plan schema');
  context.assert(strictPlan.transitions && strictPlan.transitions.mode === 'strict', 'strict transition plan records strict mode');
  context.assert(strictPlan.transitions && strictPlan.transitions.enabled === true, 'strict transition plan enables transition runtime');
  context.assert(strictPlan.transitions.summary.transitionCount === 2, 'strict transition plan summarizes transition count');
  context.assert(strictPlan.transitions.summary.animationEngineSchema === 'xtend.rmt.animation-engine.v1', 'strict transition plan summarizes AnimationEngine schema');
  context.assert(strictPlan.transitions.summary.animationCount === 1, 'strict transition plan summarizes animation preset count');
  context.assert(strictPlan.transitions.summary.scheduledEndpointCount === 2, 'strict transition plan summarizes transition scheduler endpoints');
  context.assert(strictPlan.runtimeModules.includes('xtendrmt/rmt-animation-engine-runtime.js'), 'strict transition plan requires animation engine runtime module');
  context.assert(strictPlan.runtimeModules.includes('xtendrmt/rmt-surface-transition-runtime.js'), 'strict transition plan requires surface transition runtime module');
  context.assert(strictPlan.runtimeModules.includes('components/xutils.js'), 'strict transition plan requires x-utils effect policy module');
  context.assert(strictPlan.runtimeModules.includes('components/xtend-state.js'), 'strict transition plan requires state mirror module');
  context.assert(strictPlan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-animation-engine-runtime.js'), 'strict transition plan includes animation engine runtime in the bundle graph');
  context.assert(strictPlan.stackModules.some((entry) => entry.source === 'xtendrmt/rmt-surface-transition-runtime.js'), 'strict transition plan includes transition runtime in the bundle graph');
  context.assert(strictPlan.stackModules.some((entry) => entry.source === 'components/xutils.js'), 'strict transition plan includes x-utils in the bundle graph');
  context.assert(strictPlan.stackModules.some((entry) => entry.source === 'components/xtend-state.js'), 'strict transition plan includes state in the bundle graph');
  context.assert(strictPlan.kernel && strictPlan.kernel.artifact.scheduler.fibers.some((fiber) => fiber.kind === 'surface-transition'), 'strict transition plan has kernel surface-transition fibers');
  context.assert(transitionsOffPlan.ok === true && transitionsOffPlan.transitions.enabled === false, 'transitions off keeps legacy attribute-sync behavior available');
  context.assert(strictWithoutArtifact.ok === false, 'strict transitions block when no transition plan exists');
  context.assert(strictWithoutArtifact.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.maraca.transitions_missing'), 'strict transitions without artifact reports transition precondition');

  context.assert(result.ok === true, `strict transition bundle passes${result.ok ? '' : ` (${result.status})`}`);
  context.assert(report && report.transitions && report.transitions.enabled === true, 'bundle report includes transition telemetry');
  context.assert(report && report.transitions && report.transitions.summary.transitionCount === 2, 'bundle report summarizes transition count');
  context.assert(report && report.transitions && report.transitions.summary.animationEngineSchema === 'xtend.rmt.animation-engine.v1', 'bundle report summarizes AnimationEngine schema');
  context.assert(report && report.transitions && report.transitions.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'), 'bundle report transition diagnostics are non-blocking');
  context.assert(entrySource.includes('MARACA_TRANSITIONS'), 'bundle embeds transition plan');
  context.assert(entrySource.includes('XTendRmtAnimationEngineRuntime'), 'bundle wires animation engine runtime');
  context.assert(entrySource.includes('createRmtAnimationEngineRuntime'), 'bundle creates animation engine runtime');
  context.assert(entrySource.includes('XTendRmtSurfaceTransitionRuntime'), 'bundle wires surface transition runtime');
  context.assert(entrySource.includes('createRmtSurfaceTransitionRuntime'), 'bundle creates surface transition runtime');
  context.assert(entrySource.includes('globalTarget.XTendRmtSurfaceTransitionRuntime = api'), 'bundle materializes surface transition runtime global API');
  context.assert(planRuntimeSource.includes('runtimes.transitions.applyVisibilityPatch'), 'canonical Plan Runtime routes hidden patches through transition runtime');
  const browserHostAdapterSource = readText('xtend-maraca/browser-host-adapter.mjs', rootDir);
  context.assert(compositionRuntimeSource.includes('host.installPublicFacades({') && browserHostAdapterSource.includes('windowTarget.__XTendMaracaAnimationEngine = freeze(clone(values.animationEngine))'), 'composition delegates immutable animation-engine snapshot publication to the host adapter');
  context.assert(browserHostAdapterSource.includes('windowTarget.__XTendMaracaTransitions = freeze(clone(values.transitions))'), 'host adapter exposes an immutable transition snapshot bridge');
  context.assert(compositionRuntimeSource.includes('transitionPlan: config.transitions'), 'safe facade exposes the immutable transition plan');
  context.assert(entrySource.includes('xtend-maraca:surface-transition-start'), 'bundle dispatches transition start telemetry');
  context.assert(entrySource.includes('xtend-maraca:surface-transition-complete'), 'bundle dispatches transition complete telemetry');
  context.assert(entrySource.includes('runUiTransition'), 'bundle integrates x-utils transition runner');
  context.assert(entrySource.includes('transitionStatePort'), 'bundle integrates the controller-owned transition telemetry port');
  context.assert(!/\.innerHTML\s*=/u.test(entrySource), 'transition bundle entry has no innerHTML assignment sink');
  context.assert(!/\.outerHTML\s*=/u.test(entrySource), 'transition bundle entry has no outerHTML assignment sink');
  context.assert(!/\.insertAdjacentHTML\s*\(/u.test(entrySource), 'transition bundle entry has no insertAdjacentHTML sink');
  context.assert(!/document\.write\s*\(/u.test(entrySource), 'transition bundle entry has no document.write sink');

  const animationRuntimePath = resolveRepoPath('xtendrmt/rmt-animation-engine-runtime.js', rootDir);
  const animationRuntimeSource = fs.readFileSync(animationRuntimePath, 'utf8');
  const directTransitionDomWriterPattern = /(?:\.(?:setAttribute|removeAttribute|toggleAttribute)\s*\(|\.style(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])\s*=(?!=)|\.style\.setProperty\s*\()/u;
  context.assert(!directTransitionDomWriterPattern.test(animationRuntimeSource), 'Animation runtime source has no direct attribute, property, or style writer');
  const animationModule = await import(`data:text/javascript;base64,${Buffer.from(animationRuntimeSource).toString('base64')}`);
  const runtimePath = resolveRepoPath('xtendrmt/rmt-surface-transition-runtime.js', rootDir);
  const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
  context.assert(!directTransitionDomWriterPattern.test(runtimeSource), 'Transition runtime source has no direct attribute, property, or style writer');
  const transitionModule = await import(`data:text/javascript;base64,${Buffer.from(runtimeSource).toString('base64')}`);
  const attributes = new Map([['data-maraca-surface', 'demo.transitions.contact']]);
  const fakeElement = {
    style: {},
    getAttribute(name) {
      return attributes.get(name) || '';
    },
    setAttribute(name, value) {
      attributes.set(name, value === undefined ? '' : String(value));
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    hasAttribute(name) {
      return attributes.has(name);
    }
  };
  const fakeRoot = {
    querySelectorAll(selector) {
      if (selector === '[data-maraca-surface]') return [fakeElement];
      return [];
    }
  };
  const transitionStateProjections = [];
  const transitionDom = createDomCommitHarness();
  const transitionRuntime = transitionModule.createRmtSurfaceTransitionRuntime({
    transitionPlan: strictPlan.transitions.artifact,
    root: fakeRoot,
    domRenderer: transitionDom.renderer,
    xUtils: {
      runUiTransition(input) {
        return Promise.resolve({ schema: 'xtend.utility.ui-transition-result.v1', status: input.effect === 'none' ? 'fallback' : 'complete' });
      }
    },
    transitionStatePort: {
      apply(projection) {
        transitionStateProjections.push(projection);
      }
    },
    windowTarget: null
  });
  fakeElement.style.opacity = '0';
  fakeElement.style.transform = 'translateX(-16px)';
  fakeElement.style.transition = 'opacity 160ms ease, transform 160ms ease';
  const exitResult = await transitionRuntime.applyVisibilityPatch({
    surface: 'demo.transitions.contact',
    element: fakeElement,
    nextHidden: true,
    previousHidden: false,
    action: 'demo.transitions.next'
  });
  context.assert(exitResult && exitResult.status === 'complete', 'Node transition smoke completes an exit transition');
  context.assert(fakeElement.hasAttribute('hidden'), 'Node transition smoke delays and then applies hidden state');
  context.assert(fakeElement.style.opacity === '' && fakeElement.style.transform === '', 'Node transition smoke clears transient exit animation styles');
  fakeElement.style.opacity = '0';
  fakeElement.style.transform = 'translateX(-16px)';
  fakeElement.style.transition = 'opacity 160ms ease, transform 160ms ease';
  const enterResult = await transitionRuntime.applyVisibilityPatch({
    surface: 'demo.transitions.contact',
    element: fakeElement,
    nextHidden: false,
    previousHidden: true,
    action: 'demo.transitions.back'
  });
  context.assert(enterResult && enterResult.status === 'complete', 'Node transition smoke completes an enter transition');
  context.assert(!fakeElement.hasAttribute('hidden'), 'Node transition smoke removes hidden state before enter transition');
  context.assert(fakeElement.style.opacity === '' && fakeElement.style.transform === '' && fakeElement.style.transition === '', 'Node transition smoke clears stale enter animation styles');
  context.assert(transitionStateProjections.length > 0
    && transitionStateProjections.every((projection) => projection.transition === 'demo.transitions.contactToIssue'
      || projection.transition === 'demo.transitions.issueToContact'),
  'Node transition smoke publishes transition telemetry only through the injected controller port');
  context.assert(transitionRuntime.snapshot().transitionCount === 2, 'Transition runtime snapshot exposes transition count');
  context.assert(transitionRuntime.snapshot().animationEngine && transitionRuntime.snapshot().animationEngine.transitionCount === 2, 'Transition runtime snapshot includes AnimationEngine snapshot');
  context.assert(animationModule.RMT_ANIMATION_ENGINE_RUNTIME_SCHEMA === 'xtend.rmt.animation-engine-runtime.v1', 'AnimationEngine runtime module exports runtime schema');
  context.assert(transitionDom.commits.length > 0 && transitionDom.commits.every((request) => request.operation === 'merge-element'), 'Transition visibility and cleanup are applied through merge-element commits');
  context.assert(transitionDom.commits.every((request) => request.ownership && request.ownership.owner === 'transition-runtime'), 'Transition commits reserve the visibility ownership domain');
  const transitionDispose = transitionRuntime.dispose();
  const transitionDisposeAgain = transitionRuntime.dispose();
  context.assert(transitionDispose.alreadyDisposed === false && transitionDisposeAgain.alreadyDisposed === true, 'Transition runtime dispose is idempotent');

  const animationDom = createDomCommitHarness();
  let resolveAnimationWork = null;
  fakeElement.style.opacity = '1';
  const disposableAnimationRuntime = animationModule.createRmtAnimationEngineRuntime({
    animationPlan: strictPlan.transitions.artifact,
    domRenderer: animationDom.renderer,
    strict: true,
    windowTarget: null,
    xUtils: {
      runUiTransition(input) {
        input.target.style.opacity = '0';
        return new Promise((resolve) => {
          resolveAnimationWork = () => resolve({ schema: 'xtend.utility.ui-transition-result.v1', status: 'complete' });
        });
      }
    }
  });
  const pendingAnimation = disposableAnimationRuntime.runSurfaceTransitionPhase({
    target: fakeElement,
    transition: strictPlan.transitions.artifact.transitions[0],
    phase: 'enter'
  });
  await Promise.resolve();
  const animationDispose = disposableAnimationRuntime.dispose();
  const animationDisposeAgain = disposableAnimationRuntime.dispose();
  resolveAnimationWork();
  const cancelledAnimation = await pendingAnimation;
  context.assert(cancelledAnimation.status === 'cancelled' && fakeElement.style.opacity === '1', 'Animation dispose cancels in-flight work and restores its visibility snapshot through the renderer');
  context.assert(animationDispose.cancelledCount === 1 && animationDisposeAgain.alreadyDisposed === true, 'Animation runtime dispose is idempotent');
  context.assert(animationDom.commits.some((request) => request.ownership && request.ownership.owner === 'transition-runtime'), 'Animation cleanup uses the Transition Runtime visibility owner');
  context.assert(animationDom.commits.every((request) => !Object.prototype.hasOwnProperty.call(request.descriptor.attributes || {}, 'aria-hidden')), 'Animation cleanup never snapshots or restores aria-hidden');
  context.assert(animationDom.commits.every((request) => request.ownership && request.ownership.domains && !Object.prototype.hasOwnProperty.call(request.ownership.domains, 'attributes')), 'Animation cleanup reserves only transition visibility and style ownership');

  const createFakeSurfaceElement = (surfaceId, hidden = false) => {
    const attrs = new Map([['data-maraca-surface', surfaceId]]);
    if (hidden) attrs.set('hidden', '');
    return {
      style: hidden ? { display: 'none' } : {},
      getAttribute(name) {
        return attrs.get(name) || '';
      },
      setAttribute(name, value) {
        attrs.set(name, value === undefined ? '' : String(value));
      },
      removeAttribute(name) {
        attrs.delete(name);
      },
      hasAttribute(name) {
        return attrs.has(name);
      }
    };
  };
  const exitSurface = createFakeSurfaceElement('demo.transitions.contact', false);
  const enterSurface = createFakeSurfaceElement('demo.transitions.issue', true);
  let resolveExitEffect = null;
  let enterEffectStarted = false;
  const delayedRuntime = transitionModule.createRmtSurfaceTransitionRuntime({
    transitionPlan: strictPlan.transitions.artifact,
    root: {
      querySelectorAll(selector) {
        if (selector === '[data-maraca-surface]') return [exitSurface, enterSurface];
        return [];
      }
    },
    domRenderer: createDomCommitHarness().renderer,
    xUtils: {
      runUiTransition(input) {
        if (input.phase === 'exit') {
          return new Promise((resolve) => {
            resolveExitEffect = () => resolve({ schema: 'xtend.utility.ui-transition-result.v1', status: 'complete' });
          });
        }
        enterEffectStarted = true;
        return Promise.resolve({ schema: 'xtend.utility.ui-transition-result.v1', status: 'complete' });
      }
    },
    windowTarget: null
  });
  const delayedExit = delayedRuntime.applyVisibilityPatch({
    surface: 'demo.transitions.contact',
    element: exitSurface,
    nextHidden: true,
    previousHidden: false,
    action: 'demo.transitions.next'
  });
  await Promise.resolve();
  const delayedEnter = delayedRuntime.applyVisibilityPatch({
    surface: 'demo.transitions.issue',
    element: enterSurface,
    nextHidden: false,
    previousHidden: true,
    action: 'demo.transitions.next'
  });
  await Promise.resolve();
  context.assert(!enterSurface.hasAttribute('hidden'), 'Node transition smoke materializes entering crossfade surface while exit runs');
  context.assert(enterEffectStarted === true, 'Node transition smoke overlaps crossfade enter effect with exit');
  resolveExitEffect();
  await delayedExit;
  await delayedEnter;
  context.assert(exitSurface.hasAttribute('hidden'), 'Node transition smoke hides exiting surface after transition');
  context.assert(!enterSurface.hasAttribute('hidden'), 'Node transition smoke keeps entering surface materialized after crossfade exit completes');
  context.assert(enterEffectStarted === true, 'Node transition smoke keeps overlap enter effect recorded after exit completes');
  delayedRuntime.dispose();

  const previousRendererGlobal = globalThis.XTendRmtDomDescriptorRenderer;
  const compatibilityAnimationDom = createDomCommitHarness();
  let compatibilityAnimationFactoryCalls = 0;
  globalThis.XTendRmtDomDescriptorRenderer = {
    createRmtDomDescriptorRenderer() {
      compatibilityAnimationFactoryCalls += 1;
      return compatibilityAnimationDom.renderer;
    }
  };
  let resolveCompatibilityAnimation = null;
  const compatibilityAnimationTarget = createFakeSurfaceElement('demo.transitions.compat-animation', false);
  compatibilityAnimationTarget.ownerDocument = {};
  compatibilityAnimationTarget.style.opacity = '1';
  const compatibilityAnimationRuntime = animationModule.createRmtAnimationEngineRuntime({
    animationPlan: strictPlan.transitions.artifact,
    documentTarget: {},
    windowTarget: null,
    xUtils: {
      runUiTransition(input) {
        input.target.style.opacity = '0';
        return new Promise((resolve) => {
          resolveCompatibilityAnimation = () => resolve({ status: 'complete' });
        });
      }
    }
  });
  const compatibilityAnimationWork = compatibilityAnimationRuntime.runSurfaceTransitionPhase({
    target: compatibilityAnimationTarget,
    transition: strictPlan.transitions.artifact.transitions[0],
    phase: 'enter'
  });
  await Promise.resolve();
  compatibilityAnimationRuntime.dispose();
  resolveCompatibilityAnimation();
  await compatibilityAnimationWork;
  context.assert(compatibilityAnimationFactoryCalls === 1, 'Compatibility AnimationEngine creates exactly one renderer through the global factory');
  context.assert(compatibilityAnimationDom.commits.length === 1, 'Compatibility AnimationEngine cleanup writes only through one renderer commit');
  context.assert(compatibilityAnimationRuntime.listDiagnostics().filter((entry) => entry.code === 'rmt.dom.shared-renderer-missing').length === 1, 'Compatibility AnimationEngine diagnoses missing injection once');
  context.assert(compatibilityAnimationDom.disposals.length === 1, 'Compatibility AnimationEngine disposes its owned renderer once');

  globalThis.XTendRmtDomDescriptorRenderer = undefined;
  const unavailableAnimationTarget = createFakeSurfaceElement('demo.transitions.unavailable-animation', false);
  unavailableAnimationTarget.ownerDocument = {};
  unavailableAnimationTarget.style.opacity = '1';
  const unavailableAnimationRuntime = animationModule.createRmtAnimationEngineRuntime({
    animationPlan: strictPlan.transitions.artifact,
    documentTarget: {},
    windowTarget: null,
    xUtils: {
      runUiTransition(input) {
        input.target.style.opacity = '0';
        return Promise.resolve({ status: 'complete' });
      }
    }
  });
  let unavailableAnimationError = null;
  try {
    await unavailableAnimationRuntime.runSurfaceTransitionPhase({
      target: unavailableAnimationTarget,
      transition: strictPlan.transitions.artifact.transitions[0],
      phase: 'enter'
    });
  } catch (error) {
    unavailableAnimationError = error;
  }
  context.assert(unavailableAnimationError && unavailableAnimationError.code === 'rmt.dom.compatibility-renderer-unavailable', 'Compatibility AnimationEngine fails closed when the global renderer factory is unavailable');
  context.assert(unavailableAnimationTarget.style.opacity === '1', 'Unavailable compatibility AnimationEngine performs no direct DOM mutation');
  context.assert(unavailableAnimationRuntime.listDiagnostics().filter((entry) => entry.code === 'rmt.dom.shared-renderer-missing').length === 1, 'Unavailable compatibility AnimationEngine diagnoses missing injection once');

  const compatibilityTransitionDom = createDomCommitHarness();
  let compatibilityTransitionFactoryCalls = 0;
  globalThis.XTendRmtDomDescriptorRenderer = {
    createRmtDomDescriptorRenderer() {
      compatibilityTransitionFactoryCalls += 1;
      return compatibilityTransitionDom.renderer;
    }
  };
  const compatibilityTransitionTarget = createFakeSurfaceElement('demo.transitions.contact', false);
  compatibilityTransitionTarget.ownerDocument = {};
  const compatibilityTransitionRuntime = transitionModule.createRmtSurfaceTransitionRuntime({
    transitionPlan: strictPlan.transitions.artifact,
    root: {
      ownerDocument: {},
      querySelectorAll() {
        return [compatibilityTransitionTarget];
      }
    },
    documentTarget: {},
    xUtils: {
      runUiTransition() {
        return Promise.resolve({ status: 'complete' });
      }
    },
    windowTarget: null
  });
  await compatibilityTransitionRuntime.applyVisibilityPatch({
    surface: 'demo.transitions.contact',
    element: compatibilityTransitionTarget,
    nextHidden: true,
    previousHidden: false,
    action: 'demo.transitions.next'
  });
  context.assert(compatibilityTransitionFactoryCalls === 1, 'Compatibility transitions create exactly one renderer shared with AnimationEngine');
  context.assert(compatibilityTransitionDom.commits.length > 0, 'Compatibility transitions write only through renderer commits');
  context.assert(compatibilityTransitionRuntime.listDiagnostics().filter((entry) => entry.code === 'rmt.dom.shared-renderer-missing').length === 1, 'Compatibility transitions diagnose missing injection once');
  compatibilityTransitionRuntime.dispose();
  context.assert(compatibilityTransitionDom.disposals.length === 1, 'Compatibility transitions dispose their owned renderer once');

  globalThis.XTendRmtDomDescriptorRenderer = undefined;
  const unavailableTransitionTarget = createFakeSurfaceElement('demo.transitions.contact', false);
  const unavailableTransitionRuntime = transitionModule.createRmtSurfaceTransitionRuntime({
    transitionPlan: strictPlan.transitions.artifact,
    root: {
      ownerDocument: {},
      querySelectorAll() {
        return [unavailableTransitionTarget];
      }
    },
    documentTarget: {},
    xUtils: {
      runUiTransition() {
        return Promise.resolve({ status: 'complete' });
      }
    },
    windowTarget: null
  });
  let unavailableTransitionError = null;
  try {
    await unavailableTransitionRuntime.applyVisibilityPatch({
      surface: 'demo.transitions.contact',
      element: unavailableTransitionTarget,
      nextHidden: true,
      previousHidden: false,
      action: 'demo.transitions.next'
    });
  } catch (error) {
    unavailableTransitionError = error;
  }
  context.assert(unavailableTransitionError && unavailableTransitionError.code === 'rmt.dom.compatibility-renderer-unavailable', 'Compatibility transitions fail closed when the global renderer factory is unavailable');
  context.assert(!unavailableTransitionTarget.hasAttribute('hidden'), 'Unavailable compatibility transitions perform no direct DOM mutation');
  context.assert(unavailableTransitionRuntime.listDiagnostics().filter((entry) => entry.code === 'rmt.dom.shared-renderer-missing').length === 1, 'Unavailable compatibility transitions diagnose missing injection once');
  globalThis.XTendRmtDomDescriptorRenderer = previousRendererGlobal;

  const strictMissingTarget = createFakeSurfaceElement('demo.transitions.contact', false);
  const strictMissingTransitionRuntime = transitionModule.createRmtSurfaceTransitionRuntime({
    transitionPlan: strictPlan.transitions.artifact,
    root: {
      querySelectorAll() {
        return [strictMissingTarget];
      }
    },
    xUtils: {
      runUiTransition() {
        return Promise.resolve({ status: 'complete' });
      }
    },
    strict: true,
    windowTarget: null
  });
  let strictMissingTransitionError = null;
  try {
    await strictMissingTransitionRuntime.applyVisibilityPatch({
      surface: 'demo.transitions.contact',
      element: strictMissingTarget,
      nextHidden: true,
      previousHidden: false,
      action: 'demo.transitions.next'
    });
  } catch (error) {
    strictMissingTransitionError = error;
  }
  context.assert(strictMissingTransitionError && strictMissingTransitionError.code === 'rmt.dom.shared-renderer-missing', 'Strict transitions fail closed before a DOM write without the shared renderer');
  context.assert(!strictMissingTarget.hasAttribute('hidden'), 'Strict transition failure leaves visibility unchanged');

  context.assert(cliStatus === 0, 'xt maraca plan --transitions strict exits successfully');
  context.assert(cliPlan.transitions && cliPlan.transitions.enabled === true, 'CLI returns strict transition plan JSON');
  context.assert(cliIo.readStderr() === '', 'strict transition CLI plan has no stderr output');

  return context.result({
    schema: MARACA_TRANSITION_PLAN_SCHEMA,
    transitions: strictPlan.transitions.summary,
    entry: entryPath
  });
}

function printMaracaTransitionReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Surface Transitions erfolgreich.',
    failureTitle: 'XTend Maraca Surface Transitions fehlgeschlagen:'
  });
}

async function runMaracaWebAppManifestSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-web-app-manifest',
    label: 'XTend Maraca Web App Manifest Assistant'
  });
  const out = '.xtend-build/maraca/web-app-manifest';
  const manifestInput = {
    out,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    webAppManifest: {
      enabled: true,
      name: 'XTend Manifest Fixture',
      shortName: 'Manifest',
      themeColor: '#1f6f78'
    }
  };
  const plan = planFixture(rootDir, manifestInput);
  const aliasPlan = planFixture(rootDir, {
    out: '.xtend-build/maraca/web-app-manifest-alias',
    'web-app-manifest': true
  });
  const manifestAliasPlan = planFixture(rootDir, {
    out: '.xtend-build/maraca/web-app-manifest-short-alias',
    manifest: true
  });
  const pwaPlan = planFixture(rootDir, {
    out: '.xtend-build/maraca/web-app-manifest-pwa',
    pwa: true
  });
  const directPlan = createMaracaWebAppManifestPlan({
    rootDir,
    outputDir: resolveRepoPath('.xtend-build/maraca/web-app-manifest-direct', rootDir),
    webAppManifest: true
  });
  const result = await buildFixtureAsync(rootDir, manifestInput);
  const bundleReport = result.bundleReport || {};
  const report = bundleReport.webAppManifest || {};
  const manifestPath = resolveRepoPath(`${out}/xtend.webmanifest`, rootDir);
  const reportPath = resolveRepoPath(`${out}/xtend.webmanifest.report.json`, rootDir);
  const iconDir = resolveRepoPath(`${out}/icons`, rootDir);
  const iconFiles = [
    'icons/android-chrome-192x192.png',
    'icons/android-chrome-512x512.png',
    'icons/apple-touch-icon.png',
    'icons/favicon-32x32.png',
    'icons/favicon-16x16.png',
    'icons/favicon.ico',
    'icons/logo.svg',
    'icons/XTend-Logo.png'
  ];
  const manifest = fs.existsSync(manifestPath) ? readJson(`${out}/xtend.webmanifest`, rootDir) : null;
  const writtenReport = fs.existsSync(reportPath) ? readJson(`${out}/xtend.webmanifest.report.json`, rootDir) : null;
  const manifestIcons = Array.isArray(manifest && manifest.icons) ? manifest.icons : [];

  context.assert(MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA === 'xtend.maraca.web-app-manifest-plan.v1', 'Web App Manifest plan schema is stable');
  context.assert(MARACA_WEB_APP_MANIFEST_REPORT_SCHEMA === 'xtend.maraca.web-app-manifest-report.v1', 'Web App Manifest report schema is stable');
  context.assert(plan.webAppManifest && plan.webAppManifest.schema === MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA, 'Maraca plan includes Web App Manifest plan');
  context.assert(plan.webAppManifest && plan.webAppManifest.enabled === true, 'Web App Manifest opt-in enables the assistant');
  context.assert(aliasPlan.webAppManifest && aliasPlan.webAppManifest.enabled === true, 'web-app-manifest alias enables Web App Manifest plan');
  context.assert(manifestAliasPlan.webAppManifest && manifestAliasPlan.webAppManifest.enabled === true, 'manifest alias enables Web App Manifest plan');
  context.assert(pwaPlan.webAppManifest && pwaPlan.webAppManifest.enabled === true, 'pwa true auto-enables Web App Manifest plan');
  context.assert(pwaPlan.pwa && pwaPlan.pwa.webAppManifest && pwaPlan.pwa.manifestRef === pwaPlan.webAppManifest.manifestRef, 'PWA Service Worker consumes the shared Manifest plan');
  context.assert(directPlan && directPlan.schema === MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA && directPlan.enabled === true, 'public Web App Manifest plan factory works');

  context.assert(result.ok === true, 'Web App Manifest-enabled Maraca bundle builds');
  context.assert(fs.existsSync(manifestPath), 'Web App Manifest build writes xtend.webmanifest');
  context.assert(fs.existsSync(reportPath), 'Web App Manifest build writes xtend.webmanifest.report.json');
  context.assert(fs.existsSync(iconDir), 'Web App Manifest build creates icons directory');
  iconFiles.forEach((fileName) => {
    context.assert(fs.existsSync(resolveRepoPath(`${out}/${fileName}`, rootDir)), `Web App Manifest build copies ${fileName}`);
  });
  context.assert(manifest && manifest.name === 'XTend Manifest Fixture', 'Generated Web App Manifest keeps configured app name');
  context.assert(manifest && manifest.short_name === 'Manifest', 'Generated Web App Manifest keeps configured short name');
  context.assert(manifest && manifest.start_url === './' && manifest.scope === './', 'Generated Web App Manifest uses mobile-safe start URL and scope');
  context.assert(manifest && manifest.display === 'standalone', 'Generated Web App Manifest declares standalone display');
  context.assert(manifest && manifest.background_color === '#ffffff', 'Generated Web App Manifest uses default background color');
  context.assert(manifest && manifest.theme_color === '#1f6f78', 'Generated Web App Manifest uses configured/default theme color');
  context.assert(manifestIcons.length === 2, 'Generated Web App Manifest declares only mobile manifest icons');
  context.assert(manifestIcons.some((icon) => icon.src === 'icons/android-chrome-192x192.png' && icon.sizes === '192x192' && icon.type === 'image/png' && icon.purpose === 'any'), 'Generated Web App Manifest declares 192px mobile icon');
  context.assert(manifestIcons.some((icon) => icon.src === 'icons/android-chrome-512x512.png' && icon.sizes === '512x512' && icon.type === 'image/png' && icon.purpose === 'any'), 'Generated Web App Manifest declares 512px mobile icon');
  context.assert(report && report.schema === MARACA_WEB_APP_MANIFEST_REPORT_SCHEMA, 'Bundle report embeds Web App Manifest report');
  context.assert(writtenReport && writtenReport.schema === MARACA_WEB_APP_MANIFEST_REPORT_SCHEMA, 'Web App Manifest evidence report uses stable schema');
  context.assert(writtenReport && writtenReport.enabled === true && writtenReport.generated === true, 'Web App Manifest evidence report marks generated assistant');
  context.assert(writtenReport && writtenReport.brandingMode === 'default-xtend-assets', 'Web App Manifest report marks default XTend branding assets');
  context.assert(writtenReport && writtenReport.manifestRef === './xtend.webmanifest', 'Web App Manifest report records manifest ref');
  context.assert(writtenReport && writtenReport.iconDirectory === 'icons', 'Web App Manifest report records icon directory');
  context.assert(writtenReport && writtenReport.replacementPaths.includes('icons/XTend-Logo.png') && writtenReport.replacementPaths.includes('icons/logo.svg'), 'Web App Manifest report names developer replacement paths');
  context.assert(writtenReport && writtenReport.htmlLinkHints.some((hint) => hint.rel === 'apple-touch-icon' && hint.href === 'icons/apple-touch-icon.png'), 'Web App Manifest report exposes Apple touch icon link hint');
  context.assert(writtenReport && writtenReport.htmlLinkHints.some((hint) => hint.href === 'icons/favicon-32x32.png'), 'Web App Manifest report exposes favicon link hints');
  context.assert(Array.isArray(bundleReport.bundleFiles) && bundleReport.bundleFiles.some((file) => file.fileName === 'icons/android-chrome-192x192.png'), 'Bundle file report includes copied manifest icon assets');

  const pwaResult = await buildFixtureAsync(rootDir, {
    out: '.xtend-build/maraca/web-app-manifest-pwa-build',
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    pwa: true
  });
  const pwaPrecache = pwaResult.bundleReport && pwaResult.bundleReport.pwa && pwaResult.bundleReport.pwa.precacheUrls || [];
  context.assert(pwaPrecache.includes('./xtend.webmanifest'), 'PWA Service Worker precache includes shared Web App Manifest');
  context.assert(pwaPrecache.includes('./icons/android-chrome-192x192.png'), 'PWA Service Worker precache includes 192px manifest icon');
  context.assert(pwaPrecache.includes('./icons/android-chrome-512x512.png'), 'PWA Service Worker precache includes 512px manifest icon');

  let serverHandle = null;
  try {
    serverHandle = await listenXtendDevServer({
      rootDir,
      defaultPath: `${out}/xtend.webmanifest`,
      port: 0
    });
    const manifestResponse = await requestText(`${serverHandle.origin}/${out}/xtend.webmanifest`);
    const pngResponse = await requestText(`${serverHandle.origin}/${out}/icons/android-chrome-192x192.png`);
    const icoResponse = await requestText(`${serverHandle.origin}/${out}/icons/favicon.ico`);
    const svgResponse = await requestText(`${serverHandle.origin}/${out}/icons/logo.svg`);
    context.assert(manifestResponse.statusCode === 200, 'Local server serves generated Web App Manifest');
    context.assert(String(manifestResponse.headers['content-type']).includes('application/manifest+json'), 'Local server serves webmanifest with PWA MIME type');
    context.assert(pngResponse.statusCode === 200 && String(pngResponse.headers['content-type']).includes('image/png'), 'Local server serves copied PNG icons with image/png MIME type');
    context.assert(icoResponse.statusCode === 200 && String(icoResponse.headers['content-type']).includes('image/x-icon'), 'Local server serves copied favicon with icon MIME type');
    context.assert(svgResponse.statusCode === 200 && String(svgResponse.headers['content-type']).includes('image/svg+xml'), 'Local server serves copied SVG logo with SVG MIME type');
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (/EACCES|EPERM|listen|denied/iu.test(message)) {
      context.skip(`Web App Manifest local server fixture skipped because loopback listen is denied (${message})`);
    } else {
      context.fail(`Web App Manifest local server fixture failed (${message})`);
    }
  } finally {
    if (serverHandle && serverHandle.server) {
      await new Promise((resolve) => serverHandle.server.close(resolve));
    }
  }

  return context.result({
    schema: MARACA_WEB_APP_MANIFEST_REPORT_SCHEMA,
    webAppManifest: writtenReport
  });
}

function printMaracaWebAppManifestReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Web App Manifest Assistant erfolgreich.',
    failureTitle: 'XTend Maraca Web App Manifest Assistant fehlgeschlagen:'
  });
}

async function runMaracaPwaServiceWorkerSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-pwa-service-worker',
    label: 'XTend Maraca PWA Service Worker Assistant'
  });
  const out = '.xtend-build/maraca/pwa-service-worker';
  const pwaInput = {
    out,
    profile: 'debug',
    lazy: 'component',
    css: 'external',
    pwa: {
      enabled: true,
      name: 'XTend Maraca PWA Fixture',
      shortName: 'Maraca PWA',
      serviceWorker: {
        businessLogicImport: './sw-business-logic.js'
      }
    },
    enableUiCoprocessor: true
  };
  const plan = planFixture(rootDir, pwaInput);
  const aliasPlan = planFixture(rootDir, {
    out: '.xtend-build/maraca/pwa-service-worker-alias',
    'enable-service-worker': true
  });
  const directPlan = createMaracaPwaServiceWorkerPlan({
    rootDir,
    outputDir: resolveRepoPath('.xtend-build/maraca/pwa-direct', rootDir),
    pwa: true
  });
  const result = await buildFixtureAsync(rootDir, pwaInput);
  const bundleReport = result.bundleReport || {};
  const pwaReport = bundleReport.pwa || {};
  const manifestPath = resolveRepoPath(`${out}/xtend.webmanifest`, rootDir);
  const serviceWorkerPath = resolveRepoPath(`${out}/xtend.service-worker.js`, rootDir);
  const offlinePath = resolveRepoPath(`${out}/xtend.offline.html`, rootDir);
  const reportPath = resolveRepoPath(`${out}/xtend.pwa.report.json`, rootDir);
  const entryPath = resolveRepoPath(`${out}/xtend.maraca.mjs`, rootDir);
  const compositionRuntimePath = resolveRepoPath(`${out}/runtime/xtend-maraca-browser-composition-runtime.mjs`, rootDir);
  const browserHostPath = resolveRepoPath(`${out}/runtime/browser-host-adapter.mjs`, rootDir);
  const cssPath = resolveRepoPath(`${out}/xtend.maraca.css`, rootDir);
  const serviceWorker = fs.existsSync(serviceWorkerPath) ? fs.readFileSync(serviceWorkerPath, 'utf8') : '';
  const entry = fs.existsSync(entryPath) ? fs.readFileSync(entryPath, 'utf8') : '';
  const compositionRuntime = fs.existsSync(compositionRuntimePath) ? fs.readFileSync(compositionRuntimePath, 'utf8') : '';
  const browserHost = fs.existsSync(browserHostPath) ? fs.readFileSync(browserHostPath, 'utf8') : '';
  const manifest = fs.existsSync(manifestPath) ? readJson(`${out}/xtend.webmanifest`, rootDir) : null;
  const writtenPwaReport = fs.existsSync(reportPath) ? readJson(`${out}/xtend.pwa.report.json`, rootDir) : null;
  const swSyntax = fs.existsSync(serviceWorkerPath)
    ? syntaxCheckFile(`${out}/xtend.service-worker.js`, { rootDir, extension: '.js' })
    : { ok: false, message: 'missing service worker' };

  context.assert(MARACA_PWA_SERVICE_WORKER_PLAN_SCHEMA === 'xtend.maraca.pwa-service-worker-plan.v1', 'PWA Service Worker plan schema is stable');
  context.assert(MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA === 'xtend.maraca.pwa-service-worker-report.v1', 'PWA Service Worker report schema is stable');
  context.assert(plan.pwa && plan.pwa.schema === MARACA_PWA_SERVICE_WORKER_PLAN_SCHEMA, 'Maraca plan includes PWA Service Worker plan');
  context.assert(plan.webAppManifest && plan.webAppManifest.schema === MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA && plan.webAppManifest.enabled === true, 'PWA Service Worker opt-in enables shared Web App Manifest plan');
  context.assert(plan.pwa && plan.pwa.webAppManifest && plan.pwa.manifestRef === plan.webAppManifest.manifestRef, 'PWA Service Worker references shared Web App Manifest plan');
  context.assert(plan.pwa && plan.pwa.enabled === true, 'PWA Service Worker opt-in enables the assistant');
  context.assert(plan.pwa && plan.pwa.strategy === 'app-shell', 'PWA Service Worker uses app-shell strategy');
  context.assert(plan.pwa && plan.pwa.cacheMode === 'generated-app-shell', 'PWA Service Worker uses generated app-shell cache mode');
  context.assert(plan.pwa && plan.pwa.updateMode === 'prompt', 'PWA Service Worker defaults update mode to prompt');
  context.assert(plan.pwa && plan.pwa.businessLogicHook === 'import-script', 'PWA Service Worker exposes import-script business logic hook');
  context.assert(aliasPlan.pwa && aliasPlan.pwa.enabled === true, 'enable-service-worker alias enables PWA plan');
  context.assert(directPlan && directPlan.schema === MARACA_PWA_SERVICE_WORKER_PLAN_SCHEMA && directPlan.enabled === true, 'public PWA plan factory works');
  context.assert(plan.uiCoprocessor && plan.uiCoprocessor.pwaAttachment && plan.uiCoprocessor.pwaAttachment.engineImplemented === true, 'UI Coprocessor PWA attachment reflects generated PWA engine');
  context.assert(plan.uiCoprocessor.pwaAttachment.cacheVersion === plan.pwa.cacheVersion, 'UI Coprocessor PWA attachment carries cache version');

  context.assert(result.ok === true, 'PWA-enabled Maraca bundle builds');
  context.assert(fs.existsSync(manifestPath), 'PWA build writes xtend.webmanifest');
  context.assert(fs.existsSync(serviceWorkerPath), 'PWA build writes xtend.service-worker.js');
  context.assert(fs.existsSync(offlinePath), 'PWA build writes xtend.offline.html');
  context.assert(fs.existsSync(reportPath), 'PWA build writes xtend.pwa.report.json');
  context.assert(swSyntax.ok, `Generated Service Worker syntax passes${swSyntax.ok ? '' : ` (${swSyntax.message})`}`);
  context.assert(manifest && manifest.display === 'standalone', 'Generated manifest declares standalone display');
  context.assert(manifest && manifest.name === 'XTend Maraca PWA Fixture', 'Generated manifest keeps configured app name');
  context.assert(pwaReport && pwaReport.schema === MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA, 'Bundle report embeds PWA Service Worker report');
  context.assert(writtenPwaReport && writtenPwaReport.schema === MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA, 'PWA evidence report uses stable schema');
  context.assert(writtenPwaReport && writtenPwaReport.enabled === true && writtenPwaReport.generated === true, 'PWA evidence report marks generated assistant');
  context.assert(writtenPwaReport && writtenPwaReport.businessLogicHook === 'import-script', 'PWA evidence records business logic hook');
  context.assert(writtenPwaReport && writtenPwaReport.businessLogicImport === './sw-business-logic.js', 'PWA evidence records business logic import');
  context.assert(writtenPwaReport && writtenPwaReport.webAppManifest && writtenPwaReport.webAppManifest.schema === MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA, 'PWA evidence embeds shared Web App Manifest plan');
  context.assert(writtenPwaReport && writtenPwaReport.precacheUrls.includes('./xtend.webmanifest'), 'PWA precache includes generated manifest');
  context.assert(writtenPwaReport && writtenPwaReport.precacheUrls.includes('./icons/android-chrome-192x192.png'), 'PWA precache includes generated 192px manifest icon');
  context.assert(writtenPwaReport && writtenPwaReport.precacheUrls.includes('./icons/android-chrome-512x512.png'), 'PWA precache includes generated 512px manifest icon');
  context.assert(writtenPwaReport && writtenPwaReport.precacheUrls.includes('./xtend.offline.html'), 'PWA precache includes offline fallback');
  context.assert(writtenPwaReport && writtenPwaReport.precacheUrls.some((entry) => entry.endsWith('.mjs')), 'PWA precache includes Maraca entry/chunks');
  context.assert(fs.existsSync(cssPath) && writtenPwaReport.precacheUrls.some((entry) => entry.endsWith('.css')), 'PWA precache includes external CSS asset');
  context.assert(Array.isArray(bundleReport.bundleFiles) && bundleReport.bundleFiles.some((file) => file.fileName === 'xtend.service-worker.js'), 'Bundle file report includes generated Service Worker asset');
  context.assert(serviceWorker.includes('XTEND SERVICE WORKER BUSINESS LOGIC HOOK'), 'Generated Service Worker includes business logic hook comment');
  context.assert(serviceWorker.includes("importScripts(XTEND_BUSINESS_LOGIC_IMPORT)"), 'Generated Service Worker imports optional business logic script');
  context.assert(serviceWorker.includes("self.addEventListener('install'"), 'Generated Service Worker includes install flow');
  context.assert(serviceWorker.includes("self.addEventListener('activate'"), 'Generated Service Worker includes activate cleanup flow');
  context.assert(serviceWorker.includes("self.addEventListener('fetch'"), 'Generated Service Worker includes fetch flow');
  context.assert(serviceWorker.includes("request.method !== 'GET'"), 'Generated Service Worker avoids non-GET caching');
  context.assert(serviceWorker.includes("request.headers.get('authorization')") && serviceWorker.includes("request.credentials === 'omit'"), 'Generated Service Worker avoids auth and credentialed request caching');
  context.assert(!serviceWorker.includes("request.headers.get('cookie')"), 'Generated Service Worker does not rely on browser-hidden Cookie headers');
  context.assert(!serviceWorker.includes('css|json|webmanifest'), 'Generated Service Worker excludes JSON API responses from default static runtime caching');
  context.assert(serviceWorker.includes('sameOrigin(request.url)'), 'Generated Service Worker stays same-origin by default');
  context.assert(serviceWorker.includes('replacesUiCoprocessor: false') && serviceWorker.includes('replacesSsr: false'), 'Generated Service Worker does not replace SSR or UI Coprocessor');
  context.assert(writtenPwaReport && writtenPwaReport.runtimeCaching.blockedByDefault.includes('api-responses-without-explicit-app-policy'), 'PWA report blocks API caching without explicit policy');
  context.assert(writtenPwaReport && writtenPwaReport.runtimeCaching.blockedByDefault.includes('offline-mutations'), 'PWA report keeps offline mutations out of v1');
  context.assert(
    entry.includes('MARACA_PWA')
      && /pwa\s*:\s*MARACA_PWA/u.test(entry)
      && compositionRuntime.includes('const config = freezeMaracaConfiguration(configuration || {})'),
    'Generated Maraca entry passes an immutable PWA plan to the composition root'
  );
  context.assert(
    entry.includes('MARACA_WEB_APP_MANIFEST')
      && /webAppManifest\s*:\s*MARACA_WEB_APP_MANIFEST/u.test(entry),
    'Generated Maraca entry passes the immutable Web App Manifest plan to the composition root'
  );
  context.assert(
    compositionRuntime.includes('pwaRegistration = await host.registerPwa(options)')
      && browserHost.includes('async function registerPwa(options = {})'),
    'Maraca composition registers the Service Worker through the browser host port at boot'
  );
  context.assert(
    browserHost.includes('windowTarget.__XTendMaracaPwaRegistration = freeze(clone(values.pwaRegistration))'),
    'Browser host exposes only an immutable PWA registration snapshot'
  );
  const browserHostApi = await import(`${pathToFileURL(browserHostPath).href}?suite=maraca-pwa-host-port`);
  const pwaRegistrations = [];
  const pwaHost = browserHostApi.createMaracaBrowserHostAdapter({ pwa: plan.pwa }, {
    platformTarget: {},
    windowTarget: {
      navigator: {
        serviceWorker: {
          async register(url, registrationOptions) {
            pwaRegistrations.push({ url, options: registrationOptions });
            return { scope: registrationOptions.scope };
          }
        }
      }
    },
    documentTarget: null
  });
  const pwaRegistrationResult = await pwaHost.registerPwa();
  context.assert(
    pwaRegistrationResult.registered === true
      && pwaRegistrations.length === 1
      && pwaRegistrations[0].url === plan.pwa.serviceWorker.registrationUrl
      && pwaRegistrations[0].options.scope === plan.pwa.serviceWorker.scope,
    'Browser host registers the generated Service Worker URL and scope from the immutable PWA plan'
  );

  let serverHandle = null;
  try {
    serverHandle = await listenXtendDevServer({
      rootDir,
      defaultPath: `${out}/xtend.webmanifest`,
      port: 0
    });
    const manifestResponse = await requestText(`${serverHandle.origin}/${out}/xtend.webmanifest`);
    const swResponse = await requestText(`${serverHandle.origin}/${out}/xtend.service-worker.js`);
    context.assert(manifestResponse.statusCode === 200, 'Local server serves generated PWA manifest');
    context.assert(String(manifestResponse.headers['content-type']).includes('application/manifest+json'), 'Local server serves manifest with PWA MIME type');
    context.assert(swResponse.statusCode === 200, 'Local server serves generated Service Worker');
    context.assert(String(swResponse.headers['content-type']).includes('text/javascript'), 'Local server serves Service Worker with JavaScript MIME type');
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (/EACCES|EPERM|listen|denied/iu.test(message)) {
      context.skip(`PWA local server fixture skipped because loopback listen is denied (${message})`);
    } else {
      context.fail(`PWA local server fixture failed (${message})`);
    }
  } finally {
    if (serverHandle && serverHandle.server) {
      await new Promise((resolve) => serverHandle.server.close(resolve));
    }
  }

  return context.result({
    schema: MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA,
    pwa: writtenPwaReport
  });
}

function printMaracaPwaServiceWorkerReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca PWA Service Worker Assistant erfolgreich.',
    failureTitle: 'XTend Maraca PWA Service Worker Assistant fehlgeschlagen:'
  });
}

function runMaracaPackageExportsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-package-exports',
    label: 'XTend Maraca Package Exports'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const lockfile = readJson('package-lock.json', rootDir);
  const maracaPackage = readJson(MARACA_PACKAGE_PATH, rootDir);
  const rmtPackage = readJson('xtendrmt/package.json', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const cli = readText('xtend-builder/lib/cli.js', rootDir);
  const defaultWorkflow = readText('.github/workflows/xtend-default-gates.yml', rootDir);
  const nightlyWorkflow = readText('.github/workflows/xtend-nightly-build.yml', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.maraca;
  const appServicesMetadata = packageManifest.xtend && packageManifest.xtend.maracaAppServices;
  const serviceBuildProviderMetadata = packageManifest.xtend && packageManifest.xtend.maracaServiceBuildProvider;
  const scaffoldMetadata = packageManifest.xtend && packageManifest.xtend.rmtAppScaffold;
  const defaultGatesMetadata = packageManifest.xtend && packageManifest.xtend.ciDefaultGates;
  const gateMatrixMetadata = packageManifest.xtend && packageManifest.xtend.ciGateMatrix;

  context.assert(packageManifest.workspaces.includes('xtend-maraca'), 'root package registers xtend-maraca workspace');
  context.assert(packageManifest.files.includes('xtend-maraca'), 'root package includes xtend-maraca package files');
  context.assert(packageManifest.exports['./maraca'] && packageManifest.exports['./maraca'].default === './xtend-maraca/index.js', 'root package exports @ccslabs/xtend/maraca');
  context.assert(packageManifest.exports['./maraca/runtime'] && packageManifest.exports['./maraca/runtime'].default === './xtend-maraca/runtime.js', 'root package exports @ccslabs/xtend/maraca/runtime');
  context.assert(packageManifest.exports['./maraca/plan-runtime'] && packageManifest.exports['./maraca/plan-runtime'].default === './xtend-maraca/plan-runtime.mjs', 'root package exports @ccslabs/xtend/maraca/plan-runtime');
  context.assert(maracaPackage.exports['./plan-runtime'] && maracaPackage.exports['./plan-runtime'].types === './plan-runtime.d.ts', 'Maraca workspace exports the typed plan runtime');
  context.assert(maracaPackage.files.includes('plan-runtime.mjs') && maracaPackage.files.includes('plan-runtime.d.ts'), 'Maraca tarball includes the plan runtime implementation and declarations');
  context.assert(!packageManifest.exports['./maraca/browser-host-adapter'] && !maracaPackage.exports['./browser-host-adapter'], 'mutable Maraca browser host capabilities remain internal to the managed composition root');
  context.assert(packageManifest.exports['./rmt/presentation-effect-adapter']
    && packageManifest.exports['./rmt/presentation-effect-adapter'].types === './xtendrmt/rmt-presentation-effect-adapter.d.ts',
  'root package exports the typed RMT PresentationEffectPort adapter');
  context.assert(rmtPackage.exports['./presentation-effect-adapter']
    && rmtPackage.exports['./presentation-effect-adapter'].default === './rmt-presentation-effect-adapter.js'
    && rmtPackage.files.includes('rmt-presentation-effect-adapter.js')
    && rmtPackage.files.includes('rmt-presentation-effect-adapter.d.ts'),
  'RMT workspace publishes the canonical PresentationEffectPort implementation and declarations');
  context.assert(packageManifest.exports['./rmt/maraca-view-projection-adapter']
    && packageManifest.exports['./rmt/maraca-view-projection-adapter'].types === './xtendrmt/rmt-maraca-view-projection-adapter.d.ts'
    && packageManifest.exports['./rmt/maraca-view-projection-adapter'].default === './xtendrmt/rmt-maraca-view-projection-adapter.js',
  'root package exports the typed Maraca ViewProjectionPort adapter');
  context.assert(rmtPackage.exports['./maraca-view-projection-adapter']
    && rmtPackage.exports['./maraca-view-projection-adapter'].types === './rmt-maraca-view-projection-adapter.d.ts'
    && rmtPackage.exports['./maraca-view-projection-adapter'].default === './rmt-maraca-view-projection-adapter.js'
    && rmtPackage.files.includes('rmt-maraca-view-projection-adapter.js')
    && rmtPackage.files.includes('rmt-maraca-view-projection-adapter.d.ts'),
  'RMT workspace publishes the canonical Maraca ViewProjectionPort implementation and declarations');
  const appServiceSubpaths = [
    {
      root: './maraca/app-services',
      workspace: './app-services',
      files: ['app-services.js', 'app-services.mjs', 'app-services.d.ts']
    },
    {
      root: './maraca/server-services',
      workspace: './server-services',
      files: ['server-services.js', 'server-services.mjs', 'server-services.d.ts']
    },
    {
      root: './maraca/node-app-service-host',
      workspace: './node-app-service-host',
      files: ['node-app-service-host.js', 'node-app-service-host.mjs', 'node-app-service-host.d.ts']
    },
    {
      root: './maraca/node-app-host',
      workspace: './node-app-host',
      files: ['node-app-host.js', 'node-app-host.mjs', 'node-app-host.d.ts']
    },
    {
      root: './maraca/service-build-provider',
      workspace: './service-build-provider',
      files: ['service-build-provider.js', 'service-build-provider.d.ts']
    }
  ];
  appServiceSubpaths.forEach((surface) => {
    const rootExport = packageManifest.exports[surface.root];
    const workspaceExport = maracaPackage.exports[surface.workspace];
    context.assert(rootExport && rootExport.types && rootExport.default, `root package exports the typed ${surface.root} surface`);
    context.assert(workspaceExport && workspaceExport.types && workspaceExport.default, `@ccslabs/xtend-maraca exports the typed ${surface.workspace} subpath`);
    if (surface.files.some((file) => file.endsWith('.mjs'))) {
      context.assert(rootExport && rootExport.import && rootExport.require, `${surface.root} exposes explicit ESM and CommonJS conditions`);
      context.assert(workspaceExport && workspaceExport.import && workspaceExport.require, `${surface.workspace} exposes explicit ESM and CommonJS conditions`);
    }
    surface.files.forEach((file) => {
      context.assert(maracaPackage.files.includes(file), `@ccslabs/xtend-maraca tarball contract includes ${file}`);
      context.assert(fs.existsSync(resolveRepoPath(`xtend-maraca/${file}`, rootDir)), `@ccslabs/xtend-maraca source contains ${file}`);
    });
  });
  const packCache = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-maraca-pack-cache-'));
  try {
    const packResult = spawnSync('npm', ['pack', '--workspace', 'xtend-maraca', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      env: {
        ...process.env,
        npm_config_cache: packCache,
        NPM_CONFIG_CACHE: packCache
      }
    });
    if (packResult.error && packResult.error.code === 'EPERM') {
      context.skip('@ccslabs/xtend-maraca npm pack dry-run skipped because the execution sandbox denies child processes');
    } else {
      context.assert(packResult.status === 0, `@ccslabs/xtend-maraca npm pack dry-run succeeds${packResult.stderr ? ` (${packResult.stderr.trim()})` : ''}`);
      let packFiles = [];
      try {
        const packRecords = JSON.parse(packResult.stdout || '[]');
        packFiles = Array.isArray(packRecords) && packRecords[0] && Array.isArray(packRecords[0].files)
          ? packRecords[0].files.map((entry) => entry.path)
          : [];
      } catch (error) {
        context.fail(`@ccslabs/xtend-maraca npm pack JSON is invalid: ${error.message}`);
      }
      appServiceSubpaths.flatMap((surface) => surface.files).forEach((file) => {
        context.assert(packFiles.includes(file), `@ccslabs/xtend-maraca pack dry-run contains ${file}`);
      });
    }
  } finally {
    fs.rmSync(packCache, { recursive: true, force: true });
  }
  context.assert(packageManifest.scopedPackages.some((entry) => entry.name === '@ccslabs/xtend-maraca' && entry.path === 'xtend-maraca'), 'scoped package metadata includes @ccslabs/xtend-maraca');
  context.assert(maracaPackage.dependencies.rollup && maracaPackage.dependencies.rollup.startsWith('^4.'), 'Maraca package declares Rollup as a real dependency');
  context.assert(maracaPackage.dependencies.terser && maracaPackage.dependencies.terser.startsWith('^5.'), 'Maraca package declares Terser as a real dependency');
  context.assert(!maracaPackage.peerDependencies.rollup, 'Rollup is not left as an optional peer');
  context.assert(!maracaPackage.peerDependencies.terser, 'Terser is not left as an optional peer');
  context.assert(lockfile.packages['xtend-maraca'] && lockfile.packages['xtend-maraca'].name === '@ccslabs/xtend-maraca', 'package-lock tracks xtend-maraca workspace');
  context.assert(lockfile.packages['node_modules/@ccslabs/xtend-maraca'] && lockfile.packages['node_modules/@ccslabs/xtend-maraca'].link === true, 'package-lock tracks xtend-maraca workspace link');
  context.assert(metadata && metadata.schema === 'xtend.maraca.package-metadata.v1', 'package metadata declares Maraca package schema');
  context.assert(metadata && metadata.buildPlanSchema === MARACA_BUILD_PLAN_SCHEMA, 'package metadata declares build-plan schema');
  context.assert(metadata && metadata.bundleReportSchema === MARACA_BUNDLE_REPORT_SCHEMA, 'package metadata declares bundle-report schema');
  context.assert(metadata && metadata.sizeBudgetReportSchema === MARACA_SIZE_BUDGET_REPORT_SCHEMA, 'package metadata declares size-budget schema');
  context.assert(metadata && metadata.kernelPlanSchema === MARACA_KERNEL_PLAN_SCHEMA, 'package metadata declares kernel-plan schema');
  context.assert(metadata && metadata.hydrationPlanSchema === MARACA_HYDRATION_PLAN_SCHEMA, 'package metadata declares hydration-plan schema');
  context.assert(metadata && metadata.warmReentryReportSchema === MARACA_WARM_REENTRY_REPORT_SCHEMA, 'package metadata declares Warm Reentry report schema');
  context.assert(metadata && metadata.prewarmWorkerRuntimeSchema === MARACA_PREWARM_WORKER_RUNTIME_SCHEMA, 'package metadata declares Prewarm Worker runtime schema');
  context.assert(metadata && metadata.webAppManifestPlanSchema === MARACA_WEB_APP_MANIFEST_PLAN_SCHEMA, 'package metadata declares Web App Manifest plan schema');
  context.assert(metadata && metadata.webAppManifestReportSchema === MARACA_WEB_APP_MANIFEST_REPORT_SCHEMA, 'package metadata declares Web App Manifest report schema');
  context.assert(metadata && metadata.pwaServiceWorkerPlanSchema === MARACA_PWA_SERVICE_WORKER_PLAN_SCHEMA, 'package metadata declares PWA Service Worker plan schema');
  context.assert(metadata && metadata.pwaServiceWorkerReportSchema === MARACA_PWA_SERVICE_WORKER_REPORT_SCHEMA, 'package metadata declares PWA Service Worker report schema');
  context.assert(metadata && metadata.validationPlanSchema === MARACA_VALIDATION_PLAN_SCHEMA, 'package metadata declares validation-plan schema');
  context.assert(metadata && metadata.transitionPlanSchema === MARACA_TRANSITION_PLAN_SCHEMA, 'package metadata declares transition-plan schema');
  context.assert(metadata && metadata.templateArtifactsReportSchema === MARACA_TEMPLATE_ARTIFACTS_REPORT_SCHEMA, 'package metadata declares template-artifacts report schema');
  context.assert(metadata && metadata.performanceReportSchema === MARACA_PERFORMANCE_REPORT_SCHEMA, 'package metadata declares performance report schema');
  context.assert(appServicesMetadata && appServicesMetadata.schema === 'xtend.maraca.app-services.v1', 'root xtend metadata declares the AppServices contract');
  context.assert(appServicesMetadata && appServicesMetadata.suiteId === 'maraca-app-services-runtime' && appServicesMetadata.implicitRetries === false, 'AppServices metadata binds the runtime gate and no-retry policy');
  context.assert(appServicesMetadata && appServicesMetadata.suiteIds.includes('maraca-app-services-cross-runtime') && appServicesMetadata.crossRuntimeReportArtifact === '.xtend-test-results/xtend-maraca-app-services-cross-runtime-report.json', 'AppServices metadata binds Node/PHP parity and its report');
  context.assert(appServicesMetadata && appServicesMetadata.suiteIds.includes('xtend-llm-app-services-catfood') && appServicesMetadata.catfoodReportArtifact === 'products/xtend-llm/.xtend-llm-results/app-services-catfood.json', 'AppServices metadata binds XMS-11 product catfood and its evidence');
  context.assert(serviceBuildProviderMetadata && serviceBuildProviderMetadata.schema === 'xtend.maraca.service-build-provider.v1', 'root xtend metadata declares the service build provider');
  context.assert(serviceBuildProviderMetadata && serviceBuildProviderMetadata.suiteId === 'maraca-app-services-build' && serviceBuildProviderMetadata.productionBundler === 'rollup-terser', 'service build provider metadata binds the production build gate');
  context.assert(scaffoldMetadata && scaffoldMetadata.schema === 'xtend.scaffold.app-preset.rmt.v1', 'root xtend metadata declares the provider-neutral RMT app scaffold');
  context.assert(scaffoldMetadata && scaffoldMetadata.suiteId === 'xtend-rmt-app-scaffold' && scaffoldMetadata.materialMode === 'overlay', 'neutral scaffold metadata binds its gate and Material overlay boundary');
  context.assert(packageManifest.scripts['build:maraca'].includes('maraca build'), 'package exposes build:maraca script');
  context.assert(packageManifest.scripts['test:maraca-app-services'].includes('maraca-app-services-runtime maraca-app-services-cross-runtime maraca-node-app-host xtend-llm-app-services-catfood maraca-app-services-build xtend-rmt-app-scaffold'), 'package exposes the focused AppServices MVP gate');
  context.assert(packageManifest.scripts['test:maraca'].includes(MARACA_SUITES.join(' ')), 'package exposes combined Maraca test script');
  const appServicesSuiteIds = ['xtend-rmt-app-scaffold', 'maraca-app-services-runtime', 'maraca-app-services-cross-runtime', 'maraca-node-app-host', 'xtend-llm-app-services-catfood', 'maraca-app-services-build'];
  appServicesSuiteIds.forEach((suiteId) => {
    context.assert(defaultGatesMetadata && defaultGatesMetadata.defaultGate === 'npm run test:report' && runner.hasSuite(suiteId), `default all-suite CI gate executes ${suiteId}`);
    context.assert(gateMatrixMetadata && gateMatrixMetadata.prFastGate.suites.includes(suiteId), `PR gate matrix requires ${suiteId}`);
    context.assert(gateMatrixMetadata && gateMatrixMetadata.fullReleaseGate.suites.includes(suiteId), `release gate matrix requires ${suiteId}`);
    context.assert(packageManifest.scripts['test:pr'].includes(suiteId) && packageManifest.scripts['test:pr:report'].includes(suiteId), `PR scripts execute ${suiteId}`);
    context.assert(packageManifest.scripts['test:release:full'].includes(suiteId) && packageManifest.scripts['test:release:full:report'].includes(suiteId) && packageManifest.scripts['release:report'].includes(suiteId), `release scripts execute ${suiteId}`);
  });
  context.assert(packageManifest.xtend.releaseGates.includes('npm run test:maraca-app-services'), 'release metadata includes the focused AppServices MVP gate');
  context.assert(require("../utils/test-catalog").workflowHasScript(defaultWorkflow, "test:maraca-app-services-cross-runtime:report") && require("../utils/test-catalog").workflowHasScript(defaultWorkflow, "test:xtend-llm-app-services-catfood:report"), 'default CI emits dedicated AppServices parity and product catfood reports');
  context.assert(require("../utils/test-catalog").workflowHasScript(nightlyWorkflow, "test:maraca-app-services-cross-runtime:report") && require("../utils/test-catalog").workflowHasScript(nightlyWorkflow, "test:xtend-llm-app-services-catfood:report"), 'nightly CI emits dedicated AppServices parity and product catfood reports');
  context.assert(defaultWorkflow.includes('products/xtend-llm/.xtend-llm-results/app-services-catfood.json') && nightlyWorkflow.includes('products/xtend-llm/.xtend-llm-results/app-services-catfood.json'), 'default and nightly artifacts retain the product-owned XMS-11 evidence');
  MARACA_SUITES.forEach((suiteId) => {
    context.assert(runner.hasSuite(suiteId), `test runner registers ${suiteId}`);
  });
  context.assert(cli.includes('xt maraca plan app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json'), 'CLI help documents Maraca kernel hydration validation transition orchestration plan command');
  context.assert(cli.includes('xt maraca build app.rmt --out dist --web-app-manifest --json') && cli.includes('xt maraca build app.rmt --out dist --manifest --json'), 'CLI help documents Web App Manifest aliases');
  context.assert(cli.includes('--services-entry <path>') && cli.includes('--server-services-entry <path>') && cli.includes('--php-services-entry <path>'), 'CLI help documents AppServices entry overrides');
  context.assert(cli.includes('xt rmt build app.rmt --bundle maraca --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict'), 'CLI help documents one-step RMT Maraca kernel hydration validation transition orchestration build');

  return context.result({
    schema: 'xtend.maraca.package-exports-report.v1',
    suites: MARACA_SUITES
  });
}

function printMaracaPackageExportsReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Package Exports erfolgreich.',
    failureTitle: 'XTend Maraca Package Exports fehlgeschlagen:'
  });
}

async function runMaracaSizeBudgetSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-size-budget',
    label: 'XTend Maraca Size Budget'
  });
  const result = await buildFixtureAsync(rootDir);
  const debugResult = await buildFixtureAsync(rootDir, {
    out: '.xtend-build/maraca/debug-external',
    profile: 'debug',
    lazy: 'none',
    css: 'external'
  });
  const maxResult = await buildFixtureAsync(rootDir, {
    out: '.xtend-build/maraca/max',
    profile: 'max',
    lazy: 'component',
    css: 'inline'
  });
  const sizeReport = result.sizeBudgetReport;
  const debugCssPath = resolveRepoPath('.xtend-build/maraca/debug-external/xtend.maraca.css', rootDir);
  const debugEntryPath = debugResult.bundleReport && debugResult.bundleReport.entry;
  const debugEntry = debugEntryPath && fs.existsSync(debugEntryPath) ? fs.readFileSync(debugEntryPath, 'utf8') : '';
  const debugBundleFiles = debugResult.bundleReport && Array.isArray(debugResult.bundleReport.bundleFiles)
    ? debugResult.bundleReport.bundleFiles
    : [];
  const maxNameCache = maxResult.bundleReport && maxResult.bundleReport.toolchain && maxResult.bundleReport.toolchain.nameCache;

  context.assert(sizeReport && sizeReport.schema === MARACA_SIZE_BUDGET_REPORT_SCHEMA, 'size report uses Maraca size-budget schema');
  context.assert(sizeReport && sizeReport.ok === true, 'production bundle is smaller than the legacy loader baseline');
  context.assert(sizeReport && sizeReport.bundleBytes > 0, 'size report records bundle bytes');
  context.assert(sizeReport && sizeReport.baselineBytes > sizeReport.bundleBytes, 'size report baseline exceeds bundle bytes');
  context.assert(sizeReport && sizeReport.baseline.loaderBytes > 0, 'size report includes legacy loader baseline bytes');
  context.assert(debugResult.ok === true, 'debug external-CSS build passes');
  context.assert(fs.existsSync(debugCssPath), 'external CSS build writes CSS asset');
  context.assert(debugResult.sizeBudgetReport && debugResult.sizeBudgetReport.status === 'debug_not_enforced', 'debug build records a non-enforced size budget');
  context.assert(debugBundleFiles.every((file) => !file.isDynamicEntry), 'lazy none debug build avoids dynamic component chunks');
  context.assert(!debugEntry.includes('import('), 'lazy none debug build avoids dynamic imports');
  context.assert(maxResult.ok === true, 'max Rollup/Terser build passes');
  context.assert(maxResult.bundleReport && maxResult.bundleReport.toolchain && maxResult.bundleReport.toolchain.nameCache, 'max build persists a Terser name cache');
  context.assert(Boolean(maxNameCache && fs.existsSync(maxNameCache)), 'max build writes the Terser name-cache file');
  context.assert(maxResult.sizeBudgetReport && maxResult.sizeBudgetReport.bundleBytes <= sizeReport.bundleBytes, 'max build is at least as small as production');

  return context.result({
    schema: MARACA_SIZE_BUDGET_REPORT_SCHEMA,
    baselineBytes: sizeReport && sizeReport.baselineBytes,
    bundleBytes: sizeReport && sizeReport.bundleBytes
  });
}

function printMaracaSizeBudgetReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca Size Budget erfolgreich.',
    failureTitle: 'XTend Maraca Size Budget fehlgeschlagen:'
  });
}

module.exports = {
  MARACA_SUITES,
  printMaracaBundleReport,
  printMaracaKernelIntegrityReport,
  printMaracaKernelOrchestrationReport,
  printMaracaOrchestrationReport,
  printMaracaPackageExportsReport,
  printMaracaPlanReport,
  printMaracaPwaServiceWorkerReport,
  printMaracaRmtSourceToBundleReport,
  printMaracaSizeBudgetReport,
  printMaracaTransitionReport,
  printMaracaValidationReport,
  printMaracaWebAppManifestReport,
  runMaracaBundleSuite,
  runMaracaKernelIntegritySuite,
  runMaracaKernelOrchestrationSuite,
  runMaracaOrchestrationSuite,
  runMaracaPackageExportsSuite,
  runMaracaPlanSuite,
  runMaracaPwaServiceWorkerSuite,
  runMaracaRmtSourceToBundleSuite,
  runMaracaSizeBudgetSuite,
  runMaracaTransitionSuite,
  runMaracaValidationSuite,
  runMaracaWebAppManifestSuite
};
