'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');

const PRODUCT_ROOT = 'products/maraca-app-services-test-bench';
const PRODUCT_EVIDENCE = `${PRODUCT_ROOT}/.xtend-test-results/maraca-app-services-test-bench-evidence.json`;
const PRODUCT_SCREENSHOT = `${PRODUCT_ROOT}/.xtend-test-results/maraca-app-services-test-bench.png`;
const OWNERSHIP_PATH = `${PRODUCT_ROOT}/.xtend-build/scaffold-ownership.json`;
const REPORT_SCHEMA = 'xtend.maraca-app-services-test-bench-evidence.v1';
const ALLOWED_PRODUCT_CODE_PATHS = new Set([
  'server/index.mjs',
  'src/material-dev-api.mjs',
  'src/material-runtime-host.mjs',
  'src/server-services.ts',
  'src/services.ts'
]);
const PRODUCT_CODE_EXTENSION = /\.(?:cjs|cts|js|jsx|mjs|mts|ts|tsx)$/iu;

function read(rootDir, relativePath) {
  return fs.readFileSync(path.resolve(rootDir, relativePath), 'utf8');
}

function readJson(rootDir, relativePath) {
  return JSON.parse(read(rootDir, relativePath));
}

let commandLogSequence = 0;
function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: options.timeout || 240000
  });
  const logDir = path.resolve(__dirname, '../../.xtend-test-results/nightly/product-commands');
  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(path.join(logDir, `maraca-test-bench-${++commandLogSequence}.log`), `${executable} ${args.join(' ')}\n${result.stdout || ''}\n${result.stderr || ''}`);
  return result;
}

function majorNodeVersion() {
  return Number(/^v(\d+)/u.exec(process.version)?.[1] || 0);
}

function authoredSourceInventory(rootDir) {
  return [
    'src/app.rmt',
    'src/app.css',
    'src/services.ts',
    'src/server-services.ts'
  ].map((relativePath) => ({
    path: relativePath,
    content: read(rootDir, `${PRODUCT_ROOT}/${relativePath}`)
  }));
}

function unexpectedProductCodePaths(files) {
  return files
    .map((entry) => typeof entry === 'string' ? entry : entry && entry.path)
    .filter((relativePath) => typeof relativePath === 'string'
      && PRODUCT_CODE_EXTENSION.test(relativePath)
      && !relativePath.startsWith('test/')
      && !ALLOWED_PRODUCT_CODE_PATHS.has(relativePath))
    .sort();
}

async function runMaracaAppServicesTestBenchSuite(options = {}) {
  const rootDir = path.resolve(options.rootDir || path.join(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-app-services-test-bench',
    label: 'Maraca App Services Test Bench'
  });
  const productDir = path.resolve(rootDir, PRODUCT_ROOT);
  const expectedFiles = [
    'README.md',
    '.xtend-build/scaffold-ownership.json',
    'maraca.config.json',
    'package.json',
    'tsconfig.json',
    'site/index.html',
    'server/index.mjs',
    'src/material-runtime-host.mjs',
    'src/app.rmt',
    'src/app.css',
    'src/services.ts',
    'src/server-services.ts',
    'test/material-app.smoke.test.cjs',
    'test/maraca-app-services-test-bench.catfood.test.cjs'
  ];

  context.assert(fs.existsSync(productDir), 'the CLI-generated test-bench product exists under /products');
  if (!fs.existsSync(productDir)) return context.result({ product: PRODUCT_ROOT });
  expectedFiles.forEach((relativePath) => {
    context.assert(fs.existsSync(path.join(productDir, relativePath)), `product contains ${relativePath}`);
  });
  if (context.failures.length > 0) return context.result({ product: PRODUCT_ROOT });

  const ownership = readJson(rootDir, OWNERSHIP_PATH);
  const ownershipFiles = ownership.files || {};
  context.assert(ownership.schema === 'xtend.scaffold.generated-ownership.v2', 'product uses Scaffold ownership v2');
  ['src/app.rmt', 'src/app.css', 'src/services.ts', 'src/server-services.ts'].forEach((relativePath) => {
    const record = ownershipFiles[`${PRODUCT_ROOT}/${relativePath}`];
    context.assert(record && record.mode === 'seed', `${relativePath} is an author-owned seed`);
  });
  ['site/index.html', 'server/index.mjs', 'src/material-runtime-host.mjs', 'maraca.config.json', 'package.json', 'tsconfig.json'].forEach((relativePath) => {
    const record = ownershipFiles[`${PRODUCT_ROOT}/${relativePath}`];
    context.assert(record && record.mode === 'managed', `${relativePath} remains framework-managed`);
  });

  const authoredSources = authoredSourceInventory(rootDir);
  const authoredRuntime = authoredSources.map((entry) => entry.content).join('\n');
  const forbiddenRuntimePatterns = [
    /<script\b/iu,
    /\bfetch\s*\(/u,
    /\bXMLHttpRequest\b/u,
    /\b(?:document|window)\s*\./u,
    /\b(?:addEventListener|dispatchEvent)\s*\(/u,
    /\bquerySelector(?:All)?\s*\(/u,
    /\bcreateElement\s*\(/u,
    /\binnerHTML\b/u,
    /\bnode:https?\b/u,
    /\bcreateServer\s*\(/u,
    /\blisten\s*\(/u,
    /\bbootXtendMaraca\s*\(/u,
    /\bdataSourceAdapters\b/u,
    /\bhostServiceAdapters\b/u,
    /__XTend|__XTEND/u
  ];
  forbiddenRuntimePatterns.forEach((pattern) => {
    context.assert(!pattern.test(authoredRuntime), `authored product runtime avoids ${pattern}`);
  });

  const allProductFiles = [];
  const walk = (directory) => {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      if (['node_modules', 'dist', '.data', '.xtend-test-results'].includes(entry.name)) return;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolutePath);
      else allProductFiles.push({
        path: path.relative(productDir, absolutePath).replace(/\\/gu, '/'),
        content: fs.readFileSync(absolutePath, 'utf8')
      });
    });
  };
  walk(productDir);
  const allowedSourceFiles = new Set([
    'src/app.rmt',
    'src/app.css',
    'src/services.ts',
    'src/server-services.ts',
    'src/material-runtime-host.mjs',
    'src/material-dev-api.mjs'
  ]);
  const unexpectedSourceFiles = allProductFiles
    .filter((entry) => entry.path.startsWith('src/') && !allowedSourceFiles.has(entry.path))
    .map((entry) => entry.path);
  context.assert(unexpectedSourceFiles.length === 0, `product has no controller or runtime source outside the four seeds and two generated hosts${unexpectedSourceFiles.length ? `: ${unexpectedSourceFiles.join(', ')}` : ''}`);
  const unexpectedProductCode = unexpectedProductCodePaths(allProductFiles);
  context.assert(unexpectedProductCode.length === 0, `product has no executable code extension outside the generated host and official AppService files${unexpectedProductCode.length ? `: ${unexpectedProductCode.join(', ')}` : ''}`);
  const controllerEscapeProbe = unexpectedProductCodePaths([
    ...allProductFiles,
    { path: 'assets/controller.mjs', content: 'fetch("/manual-route")' },
    { path: 'assets/controller.mts', content: 'document.querySelector("main")' }
  ]);
  context.assert(controllerEscapeProbe.includes('assets/controller.mjs') && controllerEscapeProbe.includes('assets/controller.mts'), 'provenance code inventory fails closed for JavaScript and TypeScript module controllers outside src and server');
  context.assert(allProductFiles.filter((entry) => entry.path.endsWith('.html')).every((entry) => entry.path === 'site/index.html'), 'the generated site document is the only product HTML host');
  context.assert(allProductFiles.filter((entry) => entry.path.startsWith('server/')).every((entry) => entry.path === 'server/index.mjs'), 'the generated Node host is the only product server entry');
  const generatedHtmlHost = allProductFiles.find((entry) => entry.path === 'site/index.html');
  context.assert(generatedHtmlHost && !/<script\b(?![^>]*\bsrc=)[^>]*>/iu.test(generatedHtmlHost.content), 'the generated HTML host contains no inline script');
  const sqliteOwners = allProductFiles
    .filter((entry) => entry.path.startsWith('src/') && /node:sqlite|DatabaseSync/u.test(entry.content))
    .map((entry) => entry.path);
  context.assert(sqliteOwners.length === 1 && sqliteOwners[0] === 'src/server-services.ts', 'productive SQLite access is isolated to the official server AppService file');
  const catfoodHarness = allProductFiles.find((entry) => entry.path === 'test/maraca-app-services-test-bench.catfood.test.cjs');
  context.assert(catfoodHarness && /new DatabaseSync\(databasePath,\s*\{\s*readOnly:\s*true\s*\}\)/u.test(catfoodHarness.content), 'the evidence harness inspects SQLite read-only');
  context.assert(catfoodHarness && catfoodHarness.content.includes('whitespaceOnlyStatus') && catfoodHarness.content.includes('overMaxLengthStatus') && catfoodHarness.content.includes('rejectedValidationRowsUnchanged'), 'the evidence harness proves whitespace-only and over-4,000 server requests leave SQLite unchanged');

  const rmt = read(rootDir, `${PRODUCT_ROOT}/src/app.rmt`);
  const css = read(rootDir, `${PRODUCT_ROOT}/src/app.css`);
  const browserServices = read(rootDir, `${PRODUCT_ROOT}/src/services.ts`);
  const serverServices = read(rootDir, `${PRODUCT_ROOT}/src/server-services.ts`);
  const runtimeHost = read(rootDir, `${PRODUCT_ROOT}/src/material-runtime-host.mjs`);
  context.assert(runtimeHost.includes('const expectedSurfaceCount = Number(result && result.surfaceCount)') && runtimeHost.includes('surfaceCount === expectedSurfaceCount') && runtimeHost.includes('surfaceGraphReady') && !/surfaceCount\s*>=\s*\d+/u.test(runtimeHost), 'managed runtime readiness matches the declarative Maraca boot surface graph without a magic minimum');
  context.assert(rmt.includes('component x-textarea') && rmt.includes('on textarea-submit'), 'RMT owns XTextarea rendering and submit orchestration');
  context.assert(
    rmt.includes('layoutEngine "document-flow"')
      && rmt.includes("root \"[data-maraca-surface='maraca.testbench.shell']\"")
      && rmt.includes('root "#testbench-form-fields"')
      && rmt.includes('root "#testbench-form-actions"')
      && rmt.includes('root "#testbench-form-status"'),
    'RMT composes a document-flow app shell and explicit XTM field, action and status group wrappers through local portals'
  );
  context.assert(
    /id "testbench-form-fields" "data-xtm-slot" "fields"/u.test(rmt)
      && /id "testbench-form-actions" "data-xtm-slot" "actions"/u.test(rmt)
      && /id "testbench-form-status" "data-xtm-slot" "status"/u.test(rmt)
      && !/class "xtm-primary-action"/u.test(rmt),
    'structural XTM slot recipes are authored on light-DOM group wrappers instead of component hosts'
  );
  context.assert(rmt.includes('class "xtm-actions"') && rmt.includes('"data-testid" "xtextarea-actions"') && !rmt.includes('surface maraca.testbench.readonlyOn'), 'XTextarea controls share one declarative XTM action container instead of leaf layout classes');
  context.assert(rmt.includes('submitCommand "maraca.testbench.save"'), 'RMT configures the public XTextarea submit command without product DOM code');
  ['focus', 'reset', 'snapshot'].forEach((command) => {
    context.assert(rmt.includes(`effect ${command} selector maraca.testbench.editor`), `RMT invokes the public XTextarea ${command} command declaratively`);
  });
  context.assert(rmt.includes('trust boundary "xtend.security.sanitizing-boundary.v1"') && rmt.includes('sanitize text'), 'save input declares the TrustBoundary in RMT');
  context.assert(rmt.includes('type "repeat"') && rmt.includes('text "$item.text"'), 'database content renders through a structured text repeater');
  context.assert(rmt.includes('maraca.testbench.text.save') && rmt.includes('maraca.testbench.text.list'), 'RMT demands both server AppServices');
  context.assert(!/class "(?:flex|grid|p-\d|m-\d|gap-\d)/u.test(rmt), 'RMT uses semantic XTM classes instead of raw utility authoring');
  context.assert(css.includes('tailwindcss/theme.css') && css.includes('tailwindcss/utilities.css') && !css.includes('preflight.css'), 'CSS remains the imports-only air-gapped XTM/Tailwind build-time input');
  context.assert(browserServices.includes("kind: 'command'") && browserServices.includes("concurrency: 'serial'") && browserServices.includes("kind: 'query'") && browserServices.includes("concurrency: 'latest'"), 'browser service declarations lock command/query concurrency');
  context.assert(serverServices.includes("from 'node:sqlite'") && serverServices.includes('CREATE TABLE IF NOT EXISTS') && serverServices.includes('STRICT'), 'server AppServices own the strict SQLite persistence contract');
  context.assert(serverServices.includes('LIMIT 20') && serverServices.includes('ORDER BY id DESC'), 'server AppServices return the newest twenty entries');

  const cliPath = path.resolve(rootDir, 'xtend-builder/bin/xt');
  const check = run(process.execPath, [cliPath, 'create', 'app', '--runtime', 'maraca', '--design-kit', 'material', '--server', 'node', '--name', 'maraca-app-services-test-bench', '--title', 'Maraca App Services Test Bench', '--out', PRODUCT_ROOT, '--check', '--json'], { cwd: rootDir });
  let checkReport = null;
  try { checkReport = JSON.parse(check.stdout); } catch (_) {}
  context.assert(check.status === 0 && checkReport && checkReport.ok === true && checkReport.status === 'current', `CLI provenance check accepts seeds and verifies managed files${check.stderr ? `: ${check.stderr.trim()}` : ''}`);

  const regeneratedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-maraca-test-bench-provenance-'));
  const regeneratedName = 'maraca-app-services-test-bench';
  try {
    const regeneration = run(process.execPath, [cliPath, 'create', 'app', '--runtime', 'maraca', '--design-kit', 'material', '--server', 'node', '--name', regeneratedName, '--title', 'Maraca App Services Test Bench', '--out', regeneratedName, '--write', '--json'], { cwd: regeneratedRoot });
    let regenerationReport = null;
    try { regenerationReport = JSON.parse(regeneration.stdout); } catch (_) {}
    context.assert(regeneration.status === 0 && regenerationReport && regenerationReport.ok === true, `temporary CLI regeneration succeeds${regeneration.stderr ? `: ${regeneration.stderr.trim()}` : ''}`);
    if (regeneration.status === 0 && regenerationReport && regenerationReport.ok === true) {
      Object.entries(ownershipFiles)
        .filter(([ownedPath, record]) => ownedPath.startsWith(`${PRODUCT_ROOT}/`) && record && record.mode === 'managed')
        .forEach(([ownedPath]) => {
          const relativePath = ownedPath.slice(PRODUCT_ROOT.length + 1);
          const currentContent = fs.readFileSync(path.join(productDir, relativePath));
          const regeneratedContent = fs.readFileSync(path.join(regeneratedRoot, regeneratedName, relativePath));
          context.assert(currentContent.equals(regeneratedContent), `managed ${relativePath} matches a clean temporary CLI regeneration`);
        });
    }
  } finally {
    fs.rmSync(regeneratedRoot, { recursive: true, force: true });
  }

  const productPackage = readJson(rootDir, `${PRODUCT_ROOT}/package.json`);
  context.assert(productPackage.scripts && productPackage.scripts.start === 'npm run build && node server/index.mjs' && productPackage.scripts.serve === 'npm start' && productPackage.scripts['test:catfood'] === 'npm run build && node --test', 'managed start, serve and portable catfood scripts build before using only the generated Node host/test harness');
  context.assert(productPackage.engines && productPackage.engines.node === '>=24', 'product declares the supported Node floor required by node:sqlite');

  const rootPackage = require('../utils/test-catalog').resolveManifestProfiles(readJson(rootDir, 'package.json'));
  const runner = require('../utils/test-catalog').readRunnerCatalog(rootDir);
  const defaultWorkflow = read(rootDir, '.github/workflows/xtend-default-gates.yml');
  const nightlyWorkflow = read(rootDir, '.github/workflows/xtend-nightly-build.yml');
  context.assert(runner.hasSuite('maraca-app-services-test-bench'), 'central test runner registers the product gate');
  context.assert(rootPackage.scripts['test:maraca-app-services-test-bench:report'], 'root package exposes the product evidence report command');
  context.assert(!rootPackage.scripts['test:pr'].includes('maraca-app-services-test-bench') && !rootPackage.scripts['test:release:full'].includes('maraca-app-services-test-bench'), 'product E2E remains outside PR and release gates');
  context.assert(!require('../utils/test-catalog').workflowHasScript(defaultWorkflow, 'test:maraca-app-services-test-bench:report') && require('../utils/test-catalog').workflowHasScript(nightlyWorkflow, 'test:maraca-app-services-test-bench:report'), 'product E2E is wired only into Nightly CI');

  let evidence = null;
  if (majorNodeVersion() < 24) {
    context.skip(`productive node:sqlite evidence requires Node >=24; current runtime is ${process.version}`);
  } else {
    fs.rmSync(path.resolve(rootDir, PRODUCT_EVIDENCE), { force: true });
    fs.rmSync(path.resolve(rootDir, PRODUCT_SCREENSHOT), { force: true });
    const execution = run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'test:catfood', '--prefix', PRODUCT_ROOT], { cwd: rootDir, timeout: 300000 });
    const output = [execution.stdout, execution.stderr].filter(Boolean).join('\n').trim();
    context.assert(execution.status === 0, `product catfood command passes${output && execution.status !== 0 ? `: ${output}` : ''}`);
    context.assert(fs.existsSync(path.resolve(rootDir, PRODUCT_EVIDENCE)), 'product catfood emits redacted JSON evidence');
    context.assert(fs.existsSync(path.resolve(rootDir, PRODUCT_SCREENSHOT)), 'product catfood emits a UI screenshot');
    if (fs.existsSync(path.resolve(rootDir, PRODUCT_EVIDENCE))) {
      evidence = readJson(rootDir, PRODUCT_EVIDENCE);
      context.assert(evidence.schema === REPORT_SCHEMA && evidence.ok === true && evidence.status === 'passed', 'product evidence uses the versioned passing schema');
      context.assert(evidence.trustBoundary && evidence.trustBoundary.browserPreTransport === true && evidence.trustBoundary.serverRevalidation === true, 'evidence proves browser and server TrustBoundary enforcement');
      context.assert(evidence.appServices && evidence.appServices.whitespaceOnlyStatus === 400 && evidence.appServices.whitespaceOnlyCode === 'xtend.maraca.app-service.invalid_request' && evidence.appServices.overMaxLengthStatus === 400 && evidence.appServices.overMaxLengthCode === 'xtend.maraca.app-service.invalid_request' && evidence.appServices.rejectedValidationRowsUnchanged === true, 'evidence proves authoritative empty/max-length validation without persistence side effects');
      context.assert(evidence.persistence && evidence.persistence.restartRecovered === true && evidence.persistence.visibleEntries === 20, 'evidence proves restart persistence and the newest-twenty view');
      context.assert(evidence.provenance && evidence.provenance.manualControllerCount === 0, 'evidence records zero product-local controllers');
    }
  }

  return context.result({
    product: PRODUCT_ROOT,
    evidencePath: PRODUCT_EVIDENCE,
    screenshotPath: PRODUCT_SCREENSHOT,
    evidence
  });
}

function printMaracaAppServicesTestBenchReport(result) {
  printSuiteReport(result, {
    successTitle: 'Maraca App Services Test Bench erfolgreich.',
    failureTitle: 'Maraca App Services Test Bench fehlgeschlagen:'
  });
}

if (require.main === module) {
  runMaracaAppServicesTestBenchSuite().then((result) => {
    printMaracaAppServicesTestBenchReport(result);
    process.exitCode = result.ok ? 0 : 1;
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  PRODUCT_EVIDENCE,
  PRODUCT_ROOT,
  PRODUCT_SCREENSHOT,
  printMaracaAppServicesTestBenchReport,
  runMaracaAppServicesTestBenchSuite
};
