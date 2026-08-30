'use strict';

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { compileRmtVNextSource } = require('../../tools/rmt-language/vnext-compiler');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');

const PRODUCT_PATH = 'products/resumability-maraca-erp-demo';
const REPORT_PATH = '.xtend-test-results/erp-resumability-catfood-report.json';
const REPORT_SCHEMA = 'xtend.rmt.erp-resumability-catfood-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js erp-resumability-catfood --json';

function read(rootDir, relativePath) {
  return fs.readFileSync(path.resolve(rootDir, relativePath), 'utf8');
}

function readJson(rootDir, relativePath) {
  return JSON.parse(read(rootDir, relativePath));
}

function runProductCatfood(productRoot) {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'catfood'], {
      cwd: productRoot,
      env: { ...process.env, XTEND_REQUIRE_BROWSER: '1' }
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), 240000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ status: null, stdout, stderr: `${stderr}\n${error.message}` });
    });
    child.on('close', (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
}

function productFailureTail(productRun) {
  const output = (productRun.stderr.trim() || productRun.stdout.trim())
    .replace(/\u001b\[[0-9;]*m/gu, '')
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-12)
    .join(' | ');
  return output ? output.slice(-1600) : 'process exited without diagnostic output';
}

async function runErpResumabilityCatfoodingSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const productRoot = path.resolve(rootDir, PRODUCT_PATH);
  const context = createSuiteContext({
    id: 'erp-resumability-catfood',
    label: 'RMT ERP Resumability Catfooding'
  });
  const product = readJson(rootDir, `${PRODUCT_PATH}/catfooding.json`);
  const lessons = readJson(rootDir, `${PRODUCT_PATH}/catfooding-lessons.json`);
  const evidence = readJson(rootDir, `${PRODUCT_PATH}/catfooding-evidence.json`);
  const tunedConfig = readJson(rootDir, `${PRODUCT_PATH}/maraca.tuned.config.json`);
  const rootManifest = readJson(rootDir, 'package.json');
  const source = read(rootDir, `${PRODUCT_PATH}/src/rmt/erp-shell.rmt`);
  const serverSource = read(rootDir, `${PRODUCT_PATH}/server/index.mjs`);
  const verificationSource = read(rootDir, `${PRODUCT_PATH}/scripts/verify.mjs`);
  const resumeBridgeSource = read(rootDir, `${PRODUCT_PATH}/src/client/resume-bridge.mjs`);
  const compileResult = compileRmtVNextSource({
    text: source,
    filePath: path.join(productRoot, 'src/rmt/erp-shell.rmt')
  }, { strict: true });
  const hydrationRecords = compileResult.orchestrationArtifacts && compileResult.orchestrationArtifacts.hydration
    && compileResult.orchestrationArtifacts.hydration.records || [];
  const resumeRecords = hydrationRecords.filter((record) => record.mode === 'server_prerender_resume');
  const frameworkLessons = lessons.lessons.filter((lesson) => lesson.classification === 'framework-native');
  const undecidedLessons = lessons.lessons.filter((lesson) => !lesson.decision || !lesson.owner || !lesson.gate);
  const ignore = spawnSync('git', ['check-ignore', '-q', `${PRODUCT_PATH}/package.json`], { cwd: rootDir });
  const productRun = await runProductCatfood(productRoot);
  const manifests = fs.readdirSync(path.join(productRoot, 'dist/xtensions/manifests'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(productRoot, 'dist/xtensions/manifests', file), 'utf8')));
  const report = {
    schema: REPORT_SCHEMA,
    generatedAt: new Date().toISOString(),
    product: PRODUCT_PATH,
    executionMode: product.executionMode,
    compiler: {
      ok: compileResult.ok,
      hydrationRecordCount: hydrationRecords.length,
      resumeRecordCount: resumeRecords.length,
      strictDiagnosticCount: compileResult.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    },
    runtime: {
      envelope: evidence.required.resumeEnvelope,
      signature: evidence.required.signature,
      fallbackCount: evidence.required.hydrationFallbackCount,
      browserGate: productRun.status === 0 && productRun.stdout.includes('Local resumability Maraca ERP demo verification passed.')
    },
    xtensions: {
      count: manifests.length,
      domHydrate: manifests.filter((manifest) => manifest.adoptionStrategy === 'dom_hydrate').length,
      hostActivate: manifests.filter((manifest) => manifest.adoptionStrategy === 'host_activate').length
    },
    tune: tunedConfig.selected,
    lessons: {
      total: lessons.lessons.length,
      frameworkNative: frameworkLessons.length,
      undecided: undecidedLessons.length
    },
    command: LOCAL_GATE,
    productExitCode: productRun.status
  };
  report.ok = compileResult.ok
    && resumeRecords.length > 0
    && productRun.status === 0
    && manifests.length === 8
    && undecidedLessons.length === 0
    && ignore.status === 1;
  report.status = report.ok ? 'passed' : 'blocked';
  fs.mkdirSync(path.dirname(path.resolve(rootDir, REPORT_PATH)), { recursive: true });
  fs.writeFileSync(path.resolve(rootDir, REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  context.assert(ignore.status === 1, 'ERP catfood product is tracked rather than hidden by repository ignore rules');
  context.assert(compileResult.ok && resumeRecords.length === hydrationRecords.length && resumeRecords.length >= 8, 'strict compiler lowers every ERP hydration operation to a complete resume record');
  context.assert(resumeRecords.every((record) => record.explicitPolicy && record.resumability && record.resumability.snapshot && record.resumability.eventReplay && record.resumability.integrity && record.resumability.fallbackMode === 'server_prerender_hydrate'), 'resume lowering retains explicit snapshot, replay, integrity and fallback policy');
  context.assert(product.executionMode === 'server_prerender_resume' && product.fallbackMode === 'server_prerender_hydrate', 'product catalog publishes resume with one explicit hydration fallback');
  context.assert(evidence.required.singleHostActivationVisual === true && product.gates.includes('single-host-activation-visual'), 'catfood evidence requires one visible materialization per host_activate XTension');
  context.assert(tunedConfig.selected.lazy !== 'none' && tunedConfig.locked.hydration === 'strict', 'committed Maraca tune config preserves declared lazy and strict hydration policy');
  context.assert(manifests.length === 8 && manifests.filter((manifest) => manifest.adoptionStrategy === 'dom_hydrate').length === 5 && manifests.filter((manifest) => manifest.adoptionStrategy === 'host_activate').length === 3, 'all eight XTensions publish the fixed adoption matrix');
  context.assert(manifests.every((manifest) => manifest.clientEntry && manifest.serverEntry && manifest.bundleIntegrity && manifest.snapshotSchema && manifest.resume && manifest.resume.mountedIsResume === false), 'every XTension publishes client/server entries, integrity, snapshot and non-mount resume semantics');
  context.assert(frameworkLessons.length >= 3 && undecidedLessons.length === 0 && lessons.frameworkNativeLessonCount === frameworkLessons.length, 'Catfooding lessons are classified, owned and gated upstream');
  context.assert(!serverSource.includes('createResumePayload') && !serverSource.includes('resumeStore') && !serverSource.includes('hardcoded') && !resumeBridgeSource.includes('.innerHTML ='), 'product no longer carries a fake resume store, payload signer or app-owned innerHTML bridge');
  context.assert(serverSource.includes('createRmtNodeSsrAdapter') && serverSource.includes('ECDSA-P256-SHA256') && serverSource.includes('server_prerender_resume'), 'server uses the framework SSR adapter and host-owned P-256 signer');
  const resumeModulePaths = [
    '/xtendrmt/rmt-resume-runtime.js',
    '/xtendrmt/rmt-resume-protocol.js',
    '/xtendrmt/rmt-resume-capture-adapter.js',
    '/xtendrmt/rmt-resume-host-adapter.js',
    '/xtendrmt/rmt-resume-command-adapter.js',
    '/xtendrmt/rmt-resume-command-controller.js'
  ];
  context.assert(resumeModulePaths.every((modulePath) => fs.existsSync(path.resolve(rootDir, modulePath.slice(1)))), 'Resume runtime and all five split Resume module sources exist');
  context.assert(resumeModulePaths.every((modulePath) => serverSource.includes(`'${modulePath}'`)), 'ERP server allowlists the Resume runtime and all five split Resume modules');
  context.assert(resumeModulePaths.every((modulePath) => verificationSource.includes(`'${modulePath}'`)), 'ERP verification probes the Resume runtime and all five split Resume module routes');
  context.assert(verificationSource.includes('const browserVirtualTimeBudgetMs = 15000;') && verificationSource.includes('const browserProcessTimeoutMs = 60000;') && verificationSource.includes('}, browserProcessTimeoutMs);'), 'browser smoke keeps its functional virtual-time budget separate from a CI-safe process watchdog');
  context.assert(productRun.status === 0 && productRun.stdout.includes('"status": "checked"') && productRun.stdout.includes('Local resumability Maraca ERP demo verification passed.'), `build, tune check and browser hypervisor pass${productRun.status === 0 ? '' : `: ${productFailureTail(productRun)}`}`);
  const metadata = rootManifest.xtend && rootManifest.xtend.erpResumabilityCatfooding;
  context.assert(metadata && metadata.schema === REPORT_SCHEMA && metadata.product === PRODUCT_PATH && metadata.localGate === LOCAL_GATE, 'root product catalog exposes the ERP catfood gate and report');
  context.assert(report.ok, 'central ERP resumability catfood report is green');

  return context.result({ report });
}

function printErpResumabilityCatfoodingReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT ERP Resumability Catfooding erfolgreich.',
    failureTitle: 'RMT ERP Resumability Catfooding fehlgeschlagen:'
  });
}

module.exports = {
  printErpResumabilityCatfoodingReport,
  runErpResumabilityCatfoodingSuite
};
