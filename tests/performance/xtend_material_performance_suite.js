'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { performance } = require('perf_hooks');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { createCssBuildRequest, createNativeMaracaCssProvider, runCssProviderLifecycle } = require('../../xtend-maraca/css-provider');
const { createTailwindCssProvider } = require('../../xtend-maraca-css-tailwind');
const { createTailwindToolchainApi, toolchainInspection } = require('../../xtend-maraca-css-tailwind/toolchain');
const { createMaterialRecipeRegistry } = require('../../xtend-material/recipes');
const {
  XTEND_MATERIAL_BUDGETS,
  XTEND_MATERIAL_PERFORMANCE_REPORT_SCHEMA,
  XTEND_MATERIAL_QUALITY_POLICY_SCHEMA,
  auditXtendMaterialMonkeypatching,
  createXtendMaterialQualityPolicy,
  validateXtendMaterialPerformanceReport
} = require('../../xtend-material/performance-contract');

const FIXTURE_PATH = 'tests/performance/fixtures/xtend-material-performance-reference.json';
const NEGATIVE_FIXTURE_PATH = 'tests/performance/fixtures/xtend-material-monkeypatch-negative.json';
const CONTRACT_PATH = 'development/XTend-Material-Performance-und-Supply-Chain-Contract.md';
const REPORT_PATH = '.xtend-test-results/xtend-material-performance-report.json';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js xtend-material-performance maraca-size-budget supply-chain pack-dry-run --json';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function read(rootDir, relativePath) {
  return fs.readFileSync(path.resolve(rootDir, relativePath));
}

function readJson(rootDir, relativePath) {
  return JSON.parse(read(rootDir, relativePath).toString('utf8'));
}

function protectedHashes(rootDir) {
  return [
    'components/manifest.json',
    'xtendrmt/rmt-runtime.browser.js',
    'xtend-maraca/css-provider.js'
  ].map((file) => ({ file, sha256: sha256(read(rootDir, file)) }));
}

async function buildReferenceApp(rootDir, fixture) {
  const build = async () => {
    const provider = createTailwindCssProvider({ rootDir });
    const started = performance.now();
    const result = await runCssProviderLifecycle(provider, createCssBuildRequest({
      provider: 'tailwind',
      mode: 'external',
      input: fixture.cssInput,
      output: `${fixture.id}.css`,
      profile: 'production',
      minify: true,
      sources: fixture.sources.map((source) => ({ path: source, kind: 'rmt' })),
      sourcePolicy: { root: '.', allow: fixture.sources, automaticDiscovery: false },
      metadata: { preflight: 'disabled' }
    }));
    return { result, durationMs: performance.now() - started };
  };
  const cold = await build();
  const incremental = await build();
  const cssText = cold.result.artifact && cold.result.artifact.cssText || '';
  const registry = createMaterialRecipeRegistry();
  const usedClasses = cold.result.evidence && cold.result.evidence.inventory && cold.result.evidence.inventory.materialClasses || [];
  const unusedClasses = registry.records.map((record) => record.className).filter((className) => !usedClasses.includes(className));
  return {
    id: fixture.id,
    ok: cold.result.ok && incremental.result.ok,
    deterministic: cold.result.artifact.fingerprint === incremental.result.artifact.fingerprint && cssText === incremental.result.artifact.cssText,
    css: { rawBytes: Buffer.byteLength(cssText), gzipBytes: zlib.gzipSync(cssText, { level: 9 }).length, fingerprint: cold.result.artifact.fingerprint },
    build: { coldMs: Number(cold.durationMs.toFixed(3)), incrementalMs: Number(incremental.durationMs.toFixed(3)) },
    inventory: {
      recipeCount: registry.records.length,
      usedRecipeCount: usedClasses.length,
      unusedRecipeCount: unusedClasses.length,
      unusedRecipeRatio: Number((unusedClasses.length / registry.records.length).toFixed(4)),
      usedClasses,
      unusedClasses
    },
    evidence: {
      lifecycle: cold.result.lifecycle,
      candidateCount: cold.result.evidence.candidateCount,
      compileFingerprint: cold.result.evidence.compileFingerprint,
      designKitFingerprint: cold.result.evidence.designKit.stylesFingerprint,
      airGap: cold.result.evidence.airGap,
      supplyChain: cold.result.evidence.supplyChain
    }
  };
}

async function materialPackageDryRun(rootDir) {
  const packages = ['xtend-material', 'xtend-maraca-css-tailwind'];
  const records = [];
  for (const workspace of packages) {
    const manifest = readJson(rootDir, `${workspace}/package.json`);
    const files = ['package.json'].concat(manifest.files || []).sort();
    const expected = files.slice();
    const unexpected = files.filter((file) => /^(?:tests?|development|\.xtend-build|node_modules)\//u.test(file));
    const missing = expected.filter((file) => !fs.existsSync(path.resolve(rootDir, workspace, file)));
    records.push({ workspace, ok: unexpected.length === 0 && missing.length === 0, engine: 'explicit-files-contract', files, unexpected, missing });
  }
  return { ok: records.every((record) => record.ok), records };
}

function supplyChainEvidence(rootDir) {
  const inspection = toolchainInspection();
  const lock = readJson(rootDir, 'package-lock.json');
  const core = readJson(rootDir, 'xtend-material/package.json');
  const adapter = readJson(rootDir, 'xtend-maraca-css-tailwind/package.json');
  const packageEvidence = inspection.packages.map((entry) => {
    const manifest = JSON.parse(fs.readFileSync(path.join(entry.path, 'package.json'), 'utf8'));
    return { name: entry.name, version: entry.version, integrity: entry.integrity, license: manifest.license || null };
  });
  const ok = inspection.status === 'ready'
    && packageEvidence.every((entry) => entry.version === '4.3.2' && /^sha512-/u.test(entry.integrity || '') && entry.license === 'MIT')
    && core.license === 'Apache-2.0' && adapter.license === 'Apache-2.0'
    && core.publishConfig.provenance === true && adapter.publishConfig.provenance === true;
  return {
    ok,
    lockfile: { path: 'package-lock.json', sha256: sha256(Buffer.from(JSON.stringify(lock))) },
    toolchain: { adapter: adapter.version, tailwindcss: inspection.versions.tailwindcss, node: inspection.versions.node },
    packages: packageEvidence,
    provenance: { core: core.publishConfig.provenance, adapter: adapter.publishConfig.provenance },
    licenses: { core: core.license, adapter: adapter.license }
  };
}

function runtimeBoundary(rootDir) {
  const runtimeFiles = ['xtend-loader.js', 'api.js', 'xtend-maraca/index.js', 'xtendrmt/rmt-runtime.browser.js'];
  const offenders = runtimeFiles.filter((file) => /(?:require\s*\(\s*['"](?:tailwindcss|@tailwindcss\/node)|from\s+['"](?:tailwindcss|@tailwindcss\/node))/u.test(read(rootDir, file).toString('utf8')));
  return { files: runtimeFiles, offenders, tailwindBytes: offenders.reduce((bytes, file) => bytes + read(rootDir, file).length, 0) };
}

async function runXtendMaterialPerformanceSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({ id: 'xtend-material-performance', label: 'XTM-11 XTend Material Quality, Performance and Anti-Monkeypatching' });
  const fixture = readJson(rootDir, FIXTURE_PATH);
  const negativeFixture = readJson(rootDir, NEGATIVE_FIXTURE_PATH);
  const before = protectedHashes(rootDir);
  const referenceApps = [];
  for (const app of fixture.referenceApps) referenceApps.push(await buildReferenceApp(rootDir, app));
  const after = protectedHashes(rootDir);
  const toolchainApi = createTailwindToolchainApi();
  const cleanupResult = await toolchainApi.dispose();
  const nativeCss = `${read(rootDir, 'xtend-material/tokens.css').toString('utf8')}\n${read(rootDir, 'xtend-material/styles.css').toString('utf8')}`;
  const nativeResult = await runCssProviderLifecycle(createNativeMaracaCssProvider({ cssText: nativeCss }), createCssBuildRequest({ provider: 'maraca-native', mode: 'external', output: 'xtend.material.native.css' }));
  const auditedPaths = ['xtend-material/index.js', 'xtend-material/recipes.js', 'xtend-material/shell-recipes.js', 'xtend-material/flow-recipes.js', 'xtend-maraca-css-tailwind/index.js', 'xtend-maraca-css-tailwind/toolchain.js', 'xtend-maraca-css-tailwind/source-inventory.js'];
  const monkeypatchAudit = auditXtendMaterialMonkeypatching(auditedPaths.map((file) => ({ path: file, content: read(rootDir, file).toString('utf8'), runtime: false })));
  const negativeAudits = negativeFixture.cases.map((entry) => ({ ...entry, audit: auditXtendMaterialMonkeypatching([{ path: entry.id, content: entry.content, runtime: entry.runtime }]) }));
  const runtime = runtimeBoundary(rootDir);
  const supplyChain = supplyChainEvidence(rootDir);
  const packageDryRun = await materialPackageDryRun(rootDir);
  const cleanup = { ok: cleanupResult.tempFilesRemoved === 0 && cleanupResult.cacheEntriesRemoved === 0, ...cleanupResult };
  const report = {
    schema: XTEND_MATERIAL_PERFORMANCE_REPORT_SCHEMA,
    generatedAt: new Date().toISOString(),
    status: 'measured',
    fixture: FIXTURE_PATH,
    budgets: XTEND_MATERIAL_BUDGETS,
    referenceApps,
    runtime,
    nativeProviderExit: { ok: nativeResult.ok && nativeResult.artifact.cssText.includes('.xtm-app-shell') && !/tailwindcss/u.test(nativeResult.artifact.cssText), provider: nativeResult.contract.id, bytes: nativeResult.artifact.bytes, fingerprint: nativeResult.artifact.fingerprint },
    supplyChain,
    packageDryRun,
    cleanup,
    monkeypatchAudit,
    protectedBoundary: { ok: JSON.stringify(before) === JSON.stringify(after), before, after }
  };
  const validation = validateXtendMaterialPerformanceReport(report);
  report.ok = validation.ok && report.protectedBoundary.ok;
  report.status = report.ok ? 'passed' : 'blocked';
  report.validation = validation;
  const reportTarget = path.resolve(rootDir, REPORT_PATH);
  fs.mkdirSync(path.dirname(reportTarget), { recursive: true });
  fs.writeFileSync(reportTarget, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const policy = createXtendMaterialQualityPolicy();
  const contractDocs = read(rootDir, CONTRACT_PATH).toString('utf8');
  const packageManifest = readJson(rootDir, 'package.json');
  const metadata = packageManifest.xtend && packageManifest.xtend.materialPerformance;

  context.assert(policy.schema === XTEND_MATERIAL_QUALITY_POLICY_SCHEMA && policy.monkeypatchingAllowed === false, 'quality policy is blocking and forbids monkeypatching');
  context.assert(referenceApps.length === 2 && referenceApps.every((app) => app.ok), 'both measured reference apps build successfully');
  referenceApps.forEach((app) => {
    context.assert(app.deterministic, `${app.id}: double build is byte-for-byte deterministic`);
    context.assert(app.css.rawBytes <= XTEND_MATERIAL_BUDGETS.css.rawBytes && app.css.gzipBytes <= XTEND_MATERIAL_BUDGETS.css.gzipBytes, `${app.id}: raw and gzip CSS budgets pass`);
    context.assert(app.build.coldMs <= XTEND_MATERIAL_BUDGETS.build.coldMs && app.build.incrementalMs <= XTEND_MATERIAL_BUDGETS.build.incrementalMs, `${app.id}: cold and incremental build budgets pass`);
    context.assert(app.inventory.unusedRecipeRatio <= XTEND_MATERIAL_BUDGETS.unusedRecipeRatio[app.id], `${app.id}: unused recipe inventory stays inside its measured ceiling`);
    context.assert(app.evidence.airGap.networkAccess === false && app.evidence.airGap.tempFiles === false, `${app.id}: build remains air-gapped and temp-free`);
    context.assert(app.evidence.supplyChain.schema === 'xtend.material.tailwind-supply-chain-evidence.v1' && app.evidence.supplyChain.packages.every((entry) => entry.integrity && entry.license === 'MIT'), `${app.id}: Maraca provider report carries version, integrity, license and provenance evidence`);
  });
  context.assert(runtime.tailwindBytes === 0 && runtime.offenders.length === 0, 'standard XTend and Maraca browser runtimes contain zero Tailwind runtime bytes');
  context.assert(report.nativeProviderExit.ok, 'native CSS provider exit test preserves Material semantic CSS without Tailwind');
  context.assert(supplyChain.ok, 'Tailwind versions, integrity, licenses, lockfile and provenance pass');
  context.assert(packageDryRun.ok, 'Material core and adapter pack dry runs contain only declared files');
  context.assert(cleanup.ok, 'toolchain dispose confirms zero temporary and persistent cache entries');
  context.assert(monkeypatchAudit.ok, 'productive Material and adapter sources pass the anti-monkeypatch audit');
  negativeAudits.forEach((entry) => context.assert(!entry.audit.ok && entry.audit.findings.some((finding) => finding.code === entry.code), `negative monkeypatch fixture ${entry.id} is blocked`));
  context.assert(report.protectedBoundary.ok, 'build does not mutate component, RMT or CSS-provider ownership boundaries');
  context.assert(validation.ok && report.ok, `performance report validates${validation.ok ? '' : `: ${validation.errors.join('; ')}`}`);
  context.assert(contractDocs.includes(XTEND_MATERIAL_PERFORMANCE_REPORT_SCHEMA) && contractDocs.includes('Anti-Monkeypatching'), 'contract documents report schema and anti-monkeypatching policy');
  context.assert(contractDocs.includes(LOCAL_GATE), 'contract documents the complete XTM-11 gate');
  context.assert(metadata && metadata.schema === XTEND_MATERIAL_PERFORMANCE_REPORT_SCHEMA && metadata.localGate === LOCAL_GATE, 'package metadata exposes schema and complete gate');

  return context.result({ report: {
    schema: report.schema,
    referenceApps: referenceApps.map((app) => ({ id: app.id, css: app.css, build: app.build, unusedRecipeRatio: app.inventory.unusedRecipeRatio })),
    tailwindRuntimeBytes: runtime.tailwindBytes,
    deterministicBuilds: referenceApps.every((app) => app.deterministic),
    nativeProviderExit: report.nativeProviderExit.ok,
    monkeypatchFindingCount: monkeypatchAudit.findings.length,
    packageDryRun: packageDryRun.ok,
    supplyChain: supplyChain.ok
  } });
}

function printXtendMaterialPerformanceReport(result) {
  printSuiteReport(result, { successTitle: 'XTM-11 XTend Material Quality Gates erfolgreich.', failureTitle: 'XTM-11 XTend Material Quality Gates fehlgeschlagen:' });
}

async function runXtendMaterialPackDryRunSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({ id: 'pack-dry-run', label: 'XTM-11 Material Package Dry Run' });
  const report = await materialPackageDryRun(rootDir);
  context.assert(report.records.length === 2, 'package dry run covers Material core and Maraca Tailwind adapter');
  report.records.forEach((record) => {
    context.assert(record.engine === 'explicit-files-contract' && record.files.length > 0, `${record.workspace}: explicit files contract resolves the local tarball surface`);
    context.assert(record.unexpected.length === 0, `${record.workspace}: package contains no test, development, cache or node_modules artifacts`);
    context.assert(record.missing.length === 0, `${record.workspace}: package contains every declared public file`);
  });
  context.assert(report.ok, 'Material package surface dry run passes');
  return context.result({ report });
}

function printXtendMaterialPackDryRunReport(result) {
  printSuiteReport(result, { successTitle: 'XTM-11 Material Package Dry Run erfolgreich.', failureTitle: 'XTM-11 Material Package Dry Run fehlgeschlagen:' });
}

module.exports = {
  printXtendMaterialPackDryRunReport,
  printXtendMaterialPerformanceReport,
  runXtendMaterialPackDryRunSuite,
  runXtendMaterialPerformanceSuite
};
