'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  resolveRootDir
} = require('../utils/files');
const {
  buildMaracaBundleAsync
} = require('../../xtend-maraca');
const {
  MARACA_APP_SERVICE_MANIFEST_SCHEMA,
  createMaracaServiceBuildPlan,
  createTypeScriptServiceBuildProvider,
  typecheckServiceEntries,
  writeServiceArtifacts
} = require('../../xtend-maraca/service-build-provider');
const { createRmtAppScaffold } = require('../../xtend-builder/generators/rmt-app');
const { compileRmtVNextSource } = require('../../tools/rmt-language/vnext-compiler');
const { listenXtendDevServer } = require('../../scripts/serve_xtend_dev');
const { detectAvailableEngine, runFixture } = require('../../tools/browser-hypervisor');

const REPO_ROOT = path.resolve(__dirname, '../..');
const SENTINEL = 'XMS_SENTINEL_DO_NOT_LEAK_71ad';
const PHP_SENTINEL = 'XMS_PHP_SENTINEL_DO_NOT_LEAK_52be';

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function linkWorkspaceNodeModules(rootDir, repoRoot = REPO_ROOT) {
  const target = path.join(rootDir, 'node_modules');
  if (!fs.existsSync(target)) fs.symlinkSync(path.join(repoRoot, 'node_modules'), target, 'dir');
}

function readClientEvidence(distDir) {
  const evidence = [];
  function visit(directory) {
    if (!fs.existsSync(directory)) return;
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(distDir, absolute).replace(/\\/gu, '/');
      if (entry.isDirectory()) {
        if (relative !== 'server') visit(absolute);
        return;
      }
      if (/\.(?:mjs|map|json)$/u.test(entry.name)) evidence.push(fs.readFileSync(absolute, 'utf8'));
    });
  }
  visit(distDir);
  return evidence.join('\n');
}

async function runBrowserDump(engine, url, rootDir, fixturePath) {
  const resultKey = '__xtendMaracaAppServicesBrowserResult';
  try {
    const execution = await runFixture({
      rootDir,
      engine,
      fixturePath,
      url,
      resultKey,
      timeoutMs: 45000,
      scripts: [{ script: `(() => { const key = ${JSON.stringify(resultKey)}; Object.defineProperty(window, key, { configurable: true, get() { const text = document.getElementById('result')?.textContent || ''; try { const payload = JSON.parse(text); return { status: 'passed', payload, html: document.documentElement.outerHTML }; } catch (_) { return { status: 'pending' }; } } }); })();` }],
      accept: (result) => result && result.status === 'passed'
    });
    return { status: 0, stdout: execution.result.html, payload: execution.result.payload, stderr: '' };
  } catch (error) {
    return { status: -1, stdout: '', stderr: error.message, error };
  }
}

function runGeneratedCliBuild(appRoot, rootDir) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [
      path.join(rootDir, 'xtend-builder/scaffold.js'),
      'maraca',
      'build',
      '--config',
      'maraca.config.json'
    ], { cwd: appRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), 60000);
    child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    child.stderr.on('data', (chunk) => { stderr += String(chunk); });
    child.once('error', (error) => {
      clearTimeout(timer);
      resolve({ status: -1, stdout, stderr, error });
    });
    child.once('close', (status) => {
      clearTimeout(timer);
      if (status !== 0 && stderr === '') {
        const reportPath = path.join(appRoot, 'dist/xtend.maraca.report.json');
        if (fs.existsSync(reportPath)) {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          stderr = JSON.stringify({
            status: report.status,
            diagnostics: report.diagnostics || [],
            productionClosure: report.productionClosure || null,
            sizeBudget: report.sizeBudget || null
          });
        }
      }
      resolve({ status, stdout, stderr });
    });
  });
}

async function runBrowserSourceToSea(context, appRoot, config) {
  const engine = detectAvailableEngine({ engine: process.env.XTEND_BROWSER_HYPERVISOR_ENGINE || 'chromium' });
  if (!engine) {
    context.skip('AppServices browser source-to-sea smoke skipped because no Hypervisor provider is available');
    return null;
  }
  write(path.join(appRoot, 'src/services.ts'), `
import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';
export default defineAppServices({
  'app.health': service<{ label: string }, { ok: boolean }>({
    kind: 'query',
    target: 'local',
    async invoke(_input, { signal }) {
      signal.throwIfAborted();
      return { ok: true };
    }
  })
});
`);
  const browserOptions = JSON.parse(JSON.stringify(config.options));
  browserOptions.out = 'dist-browser';
  browserOptions.profile = 'debug';
  browserOptions.services.targets = ['browser'];
  browserOptions.services.serverEntry = 'src/browser-smoke-no-server.ts';
  browserOptions.services.phpEntry = 'server/browser-smoke-no-server.php';
  const build = await buildMaracaBundleAsync(browserOptions, { rootDir: appRoot });
  assert.equal(build.ok, true, JSON.stringify(build.plan && build.plan.diagnostics || []));
  const bundleSource = fs.readFileSync(path.join(appRoot, 'dist-browser/xtend.maraca.mjs'), 'utf8');
  assert.doesNotMatch(bundleSource, /bootXtendMaraca\s*\(\s*\{\s*(?:dataSourceAdapters|hostServiceAdapters)/u);
  const compatibilityOptions = JSON.parse(JSON.stringify(browserOptions));
  compatibilityOptions.out = 'dist-browser-compatibility';
  compatibilityOptions.services.strict = false;
  const compatibilityBuild = await buildMaracaBundleAsync(compatibilityOptions, { rootDir: appRoot });
  assert.equal(compatibilityBuild.ok, true, JSON.stringify(compatibilityBuild.plan && compatibilityBuild.plan.diagnostics || []));
  write(path.join(appRoot, 'browser-smoke.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>AppServices browser smoke</title>
<link rel="stylesheet" href="./dist-browser/xtend.maraca.css"></head>
<body><main id="app" data-maraca-root></main><pre id="result">pending</pre>
<script type="module" src="./dist-browser/xtend.maraca.mjs"></script>
<script type="module">
  const output = document.getElementById('result');
  const waitFor = async (read, label) => {
    const end = performance.now() + 12000;
    while (performance.now() < end) {
      const value = read();
      if (value) return value;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error('Timed out waiting for ' + label);
  };
  try {
    const button = await waitFor(() => document.getElementById('app-run-check') || document.querySelector('x-button'), 'button render');
    button.click();
    const renderedText = await waitFor(() => {
      const status = document.getElementById('app-status') || document.querySelector('x-status');
      const text = status && (status.text || status.getAttribute('text') || status.textContent || '');
      return String(text).includes('Check passed.') ? String(text) : '';
    }, 'service-backed state render');
    output.textContent = JSON.stringify({
      schema: 'xtend.maraca.app-services-browser-smoke.v1',
      ok: true,
      checks: { event: true, action: true, service: true, state: true, render: Boolean(renderedText) }
    });
  } catch (error) {
    output.textContent = JSON.stringify({
      schema: 'xtend.maraca.app-services-browser-smoke.v1',
      ok: false,
      error: error && error.message || String(error)
    });
  }
</script></body></html>`);
  write(path.join(appRoot, 'browser-compatibility-smoke.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>AppServices compatibility smoke</title>
<link rel="stylesheet" href="./dist-browser-compatibility/xtend.maraca.css"></head>
<body><main id="app" data-maraca-root></main><pre id="result">pending</pre>
<script>
  window.__collisionDiagnostic = null;
  window.addEventListener('xtend-maraca:diagnostic', (event) => { window.__collisionDiagnostic = event.detail; });
  window.__XTendMaracaAutoBootOptions = {
    dataSourceAdapters: {
      host: {
        invoke() {
          document.body.dataset.manualAdapterInvoked = 'true';
          return { ok: true, owner: 'manual' };
        }
      }
    }
  };
</script>
<script type="module" src="./dist-browser-compatibility/xtend.maraca.mjs"></script>
<script type="module">
  const output = document.getElementById('result');
  const end = performance.now() + 12000;
  while (performance.now() < end && document.body.dataset.manualAdapterInvoked !== 'true') {
    const button = document.getElementById('app-run-check') || document.querySelector('x-button');
    if (button) button.click();
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  const diagnostic = window.__collisionDiagnostic;
  output.textContent = JSON.stringify({
    schema: 'xtend.maraca.app-services-compatibility-smoke.v1',
    ok: document.body.dataset.manualAdapterInvoked === 'true'
      && diagnostic?.severity === 'warning'
      && diagnostic?.details?.winner === 'manual',
    manualAdapterInvoked: document.body.dataset.manualAdapterInvoked === 'true',
    diagnostic
  });
</script></body></html>`);
  write(path.join(appRoot, 'browser-strict-collision-smoke.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>AppServices strict collision smoke</title></head>
<body><main id="app" data-maraca-root></main><pre id="result">pending</pre>
<script>
  window.__collisionDiagnostic = null;
  window.addEventListener('xtend-maraca:diagnostic', (event) => { window.__collisionDiagnostic = event.detail; });
  window.__XTendMaracaAutoBootOptions = {
    dataSourceAdapters: {
      host: {
        invoke() {
          document.body.dataset.manualAdapterInvoked = 'true';
          return { ok: true, owner: 'manual' };
        }
      }
    }
  };
</script>
<script type="module" src="./dist-browser/xtend.maraca.mjs"></script>
<script type="module">
  const output = document.getElementById('result');
  const end = performance.now() + 12000;
  while (performance.now() < end && !window.__collisionDiagnostic) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  const diagnostic = window.__collisionDiagnostic;
  output.textContent = JSON.stringify({
    schema: 'xtend.maraca.app-services-strict-collision-smoke.v1',
    ok: diagnostic?.severity === 'error'
      && diagnostic?.details?.winner === 'none'
      && document.body.dataset.manualAdapterInvoked !== 'true',
    manualAdapterInvoked: document.body.dataset.manualAdapterInvoked === 'true',
    diagnostic
  });
</script></body></html>`);
  let handle = null;
  try {
    handle = await listenXtendDevServer({ rootDir: appRoot, defaultPath: 'browser-smoke.html', port: 0 });
    const browser = await runBrowserDump(engine, `${handle.origin}/browser-smoke.html`, appRoot, 'browser-smoke.html');
    assert.equal(browser.status, 0, browser.error && browser.error.message || browser.stderr);
    const match = /<pre id="result">([^<]+)<\/pre>/u.exec(browser.stdout);
    assert.ok(match, 'browser smoke did not expose its result payload');
    const payload = JSON.parse(match[1].replace(/&quot;/gu, '"').replace(/&amp;/gu, '&'));
    assert.equal(payload.ok, true, payload.error || JSON.stringify(payload));
    assert.deepEqual(payload.checks, { event: true, action: true, service: true, state: true, render: true });
    context.pass('browser proves Event → Action → Service → State → Render without product boot or DOM wiring');
    const compatibilityBrowser = await runBrowserDump(engine, `${handle.origin}/browser-compatibility-smoke.html`, appRoot, 'browser-compatibility-smoke.html');
    assert.equal(compatibilityBrowser.status, 0, compatibilityBrowser.error && compatibilityBrowser.error.message || compatibilityBrowser.stderr);
    const compatibilityMatch = /<pre id="result">([^<]+)<\/pre>/u.exec(compatibilityBrowser.stdout);
    assert.ok(compatibilityMatch, 'compatibility smoke did not expose its result payload');
    const compatibilityPayload = JSON.parse(compatibilityMatch[1].replace(/&quot;/gu, '"').replace(/&amp;/gu, '&'));
    assert.equal(compatibilityPayload.ok, true, JSON.stringify(compatibilityPayload));
    const strictBrowser = await runBrowserDump(engine, `${handle.origin}/browser-strict-collision-smoke.html`, appRoot, 'browser-strict-collision-smoke.html');
    assert.equal(strictBrowser.status, 0, strictBrowser.error && strictBrowser.error.message || strictBrowser.stderr);
    const strictMatch = /<pre id="result">([^<]+)<\/pre>/u.exec(strictBrowser.stdout);
    assert.ok(strictMatch, 'strict collision smoke did not expose its result payload');
    const strictPayload = JSON.parse(strictMatch[1].replace(/&quot;/gu, '"').replace(/&amp;/gu, '&'));
    assert.equal(strictPayload.ok, true, JSON.stringify(strictPayload));
    context.pass('manual adapters win with a warning in compatibility mode and are blocked before invocation in strict mode');
    return payload;
  } catch (error) {
    if (error && (error.code === 'EPERM' || error.code === 'EACCES')) {
      context.skip(`AppServices browser source-to-sea smoke skipped because loopback listen is unavailable (${error.message})`);
      return null;
    }
    throw error;
  } finally {
    if (handle && handle.server) await new Promise((resolve) => handle.server.close(resolve));
  }
}

async function runMaracaAppServicesBuildSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || REPO_ROOT);
  const context = createSuiteContext({
    id: 'maraca-app-services-build',
    label: 'XTend Maraca AppServices Build Source-to-Sea'
  });
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-maraca-services-build-'));
  try {
    assert.equal(MARACA_APP_SERVICE_MANIFEST_SCHEMA, 'xtend.maraca.app-services-manifest.v1');
    const scaffold = createRmtAppScaffold({ rootDir: workspace, out: 'app', server: 'both', write: true });
    assert.equal(scaffold.ok, true);
    const appRoot = path.join(workspace, 'app');
    linkWorkspaceNodeModules(appRoot, rootDir);

    const serverEntry = path.join(appRoot, 'src/server-services.ts');
    const serverSource = fs.readFileSync(serverEntry, 'utf8').replace(
      'correlationId\n      };',
      `correlationId,\n        secret: '${SENTINEL}'\n      };`
    );
    assert.match(serverSource, new RegExp(SENTINEL));
    fs.writeFileSync(serverEntry, serverSource, 'utf8');
    const phpEntry = path.join(appRoot, 'server/server-services.php');
    fs.appendFileSync(phpEntry, `\n// ${PHP_SENTINEL}\n`, 'utf8');

    const config = JSON.parse(fs.readFileSync(path.join(appRoot, 'maraca.config.json'), 'utf8'));
    config.options.profile = 'debug';
    config.options.services.budgets = {
      clientBytes: 5_000_000,
      serverBytes: 500_000
    };
    const result = await buildMaracaBundleAsync(config.options, { rootDir: appRoot });
    assert.equal(result.ok, true, JSON.stringify(result.plan && result.plan.diagnostics || []));
    assert.equal(result.status, 'built');

    const manifest = JSON.parse(fs.readFileSync(path.join(appRoot, 'dist/xtend.maraca.services.json'), 'utf8'));
    assert.equal(manifest.schema, MARACA_APP_SERVICE_MANIFEST_SCHEMA);
    assert.equal(manifest.services.length, 1);
    assert.equal(manifest.services[0].id, 'app.health');
    assert.equal(manifest.services[0].mode, 'invoke');
    assert.equal(manifest.services[0].target, 'server');
    assert.deepEqual(manifest.services[0].implementations, { browser: true, node: true, php: true });
    assert.equal(manifest.services[0].actions[0].id, 'app.runCheck');
    assert.equal(manifest.services[0].actions[0].inputs[0].type, 'string');
    assert.match(manifest.fingerprint, /^[a-f0-9]{64}$/u);

    const expectedOutputs = [
      'dist/xtend.maraca.mjs',
      'dist/xtend.maraca.css',
      'dist/server/xtend.maraca.services.mjs',
      'dist/xtend.maraca.services.d.ts',
      'dist/xtend.maraca.services.php-report.json'
    ];
    expectedOutputs.forEach((relative) => assert.equal(fs.existsSync(path.join(appRoot, relative)), true, relative));
    const generatedTypes = fs.readFileSync(path.join(appRoot, 'dist/xtend.maraca.services.d.ts'), 'utf8');
    assert.match(generatedTypes, /"label": string/u);
    assert.match(generatedTypes, /output: unknown/u);
    assert.doesNotMatch(generatedTypes, /\bany\b/u);
    assert.match(fs.readFileSync(path.join(appRoot, 'dist/server/xtend.maraca.services.mjs'), 'utf8'), new RegExp(SENTINEL));
    const serverSourceMap = path.join(appRoot, 'dist/server/xtend.maraca.services.mjs.map');
    assert.equal(fs.existsSync(serverSourceMap), true);
    assert.doesNotMatch(fs.readFileSync(serverSourceMap, 'utf8'), new RegExp(`${SENTINEL}|${PHP_SENTINEL}`));
    assert.doesNotMatch(readClientEvidence(path.join(appRoot, 'dist')), new RegExp(SENTINEL));
    assert.doesNotMatch(JSON.stringify(result), new RegExp(`${SENTINEL}|${PHP_SENTINEL}`));
    const browserBundle = fs.readFileSync(path.join(appRoot, 'dist/xtend.maraca.mjs'), 'utf8');
    const browserCompositionRuntime = fs.readFileSync(path.join(appRoot, 'dist/runtime/xtend-maraca-browser-composition-runtime.mjs'), 'utf8');
    assert.match(browserBundle, /app\.health/);
    assert.match(browserBundle, /createMaracaBrowserCompositionRoot/u);
    assert.match(browserCompositionRuntime, /createAppServicesPort|app-services-runtime/u);
    assert.doesNotMatch(browserBundle, /server-services\.ts/u);
    assert.ok(result.sizeBudgetReport.appServices.clientBytes > 0);
    assert.ok(result.sizeBudgetReport.appServices.serverBytes > 0);
    assert.equal(result.sizeBudgetReport.appServices.clientBudgetBytes, 5_000_000);
    assert.equal(result.sizeBudgetReport.appServices.serverBudgetBytes, 500_000);
    assert.equal(result.sizeBudgetReport.appServices.withinBudget, true);
    assert.equal(
      result.sizeBudgetReport.framework.bytes
        + result.sizeBudgetReport.microkernel.bytes
        + result.sizeBudgetReport.appServices.clientBytes,
      result.sizeBudgetReport.bundleBytes
    );
    assert.equal(result.bundleReport.services.integrity.manifestFingerprint, manifest.fingerprint);
    assert.match(result.bundleReport.services.integrity.serviceGraphFingerprint, /^[a-f0-9]{64}$/u);
    assert.equal(result.bundleReport.services.integrity.artifactCount, result.bundleReport.services.artifacts.length);
    assert.ok(result.bundleReport.services.artifacts.length >= 4);
    assert.ok(result.bundleReport.services.artifacts.every((artifact) => /^sha256:[a-f0-9]{64}$/u.test(artifact.integrity)));
    assert.equal(result.bundleReport.services.artifacts.some((artifact) => artifact.path.endsWith('server/xtend.maraca.services.mjs.map') && artifact.target === 'node'), true);
    assert.deepEqual(
      result.bundleReport.services.targetFacts.map((entry) => entry.target),
      ['browser', 'node', 'php']
    );
    assert.ok(result.bundleReport.services.targetFacts.every((entry) => entry.isolated === true && typeof entry.entry === 'string'));
    context.pass('one command emits browser CSS/ESM, Node ESM, declarations, manifest and the PHP validation report');
    context.pass('browser bundle, client sourcemaps and reports exclude the server sentinel secret');
    context.pass('JSON results and inventoried Node sourcemaps exclude TypeScript/PHP source secrets');
    context.pass('generated service IDs, modes and known action input shapes are typed without any fallback');
    const generatedCliBuild = await runGeneratedCliBuild(appRoot, rootDir);
    if (generatedCliBuild.status === 0 && !generatedCliBuild.stdout && !generatedCliBuild.stderr) {
      context.skip('generated CLI subprocess evidence skipped because nested process execution is sandboxed');
    } else {
      assert.equal(
        generatedCliBuild.status,
        0,
        generatedCliBuild.error && generatedCliBuild.error.message
          || generatedCliBuild.stderr
          || JSON.stringify(generatedCliBuild)
      );
      assert.match(generatedCliBuild.stdout, /XTend Maraca Build: built/u, JSON.stringify(generatedCliBuild));
      context.pass('the generated project builds all configured targets through its standard Maraca CLI command');
    }

    const compilation = compileRmtVNextSource(fs.readFileSync(path.join(appRoot, 'src/app.rmt'), 'utf8'));
    assert.equal(compilation.ok, true);
    const demands = compilation.appServiceDemands;
    const policyDemands = JSON.parse(JSON.stringify(demands));
    const policyField = {
      name: 'label',
      type: 'string',
      boundary: 'xtend.security.sanitizing-boundary.v1',
      sanitize: 'text'
    };
    policyDemands.services[0].inputPolicy = {
      schema: 'xtend.maraca.app-service-input-policy.v1',
      fields: [policyField]
    };
    policyDemands.services[0].actions[0].inputs[0].inputPolicy = {
      schema: 'xtend.maraca.app-service-input-policy.v1',
      boundary: policyField.boundary,
      sanitize: policyField.sanitize
    };
    const policyOutput = path.join(appRoot, 'dist-policy-provider');
    const policyPlan = createMaracaServiceBuildPlan({
      rootDir: appRoot,
      outputDir: policyOutput,
      demands: policyDemands,
      services: config.options.services
    });
    assert.equal(policyPlan.ok, true, JSON.stringify(policyPlan.diagnostics));
    assert.deepEqual(policyPlan.manifest.services[0].inputPolicy.fields[0], policyField);
    writeServiceArtifacts(policyPlan);
    assert.match(fs.readFileSync(path.join(policyOutput, 'xtend.maraca.services.d.ts'), 'utf8'), /inputPolicy: AppServiceInputPolicy/u);
    const conflictingPolicyDemands = JSON.parse(JSON.stringify(policyDemands));
    conflictingPolicyDemands.services[0].inputPolicy.conflicts = [{ field: 'label', actions: ['app.runCheck'], missing: ['app.runCheck'] }];
    const conflictingPolicyPlan = createMaracaServiceBuildPlan({
      rootDir: appRoot,
      outputDir: path.join(appRoot, 'dist-policy-conflict'),
      demands: conflictingPolicyDemands,
      services: config.options.services
    });
    assert.equal(conflictingPolicyPlan.ok, false);
    assert.equal(conflictingPolicyPlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.services.input_policy_conflict'), true);
    context.pass('RMT input policy is preserved in manifest/types and conflicts block strict service builds');
    const duplicateServiceDemands = JSON.parse(JSON.stringify(policyDemands));
    const duplicateServiceDemand = JSON.parse(JSON.stringify(duplicateServiceDemands.services[0]));
    duplicateServiceDemand.dataSource = `${duplicateServiceDemand.dataSource}.duplicate`;
    duplicateServiceDemand.dataSourceRef = `${duplicateServiceDemand.dataSourceRef || duplicateServiceDemand.dataSource}:duplicate`;
    duplicateServiceDemand.sourceRef = 'src:dataSource:duplicate';
    duplicateServiceDemand.inputPolicy = null;
    duplicateServiceDemand.actions[0].inputs[0].inputPolicy = null;
    duplicateServiceDemands.services.push(duplicateServiceDemand);
    const duplicateServicePlan = createMaracaServiceBuildPlan({
      rootDir: appRoot,
      outputDir: path.join(appRoot, 'dist-duplicate-service-id'),
      demands: duplicateServiceDemands,
      services: config.options.services
    });
    assert.equal(duplicateServicePlan.ok, false);
    assert.equal(duplicateServicePlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.services.duplicate_demand_id' && entry.severity === 'error'), true);
    context.pass('service build fails closed when two datasource demands share one service ID and only one carries the RMT input policy');
    const publicProviderOutput = path.join(appRoot, 'dist-public-provider');
    const publicProvider = createTypeScriptServiceBuildProvider({ rootDir: appRoot });
    const publicProviderPlan = publicProvider.inspect({
      rootDir: appRoot,
      outputDir: publicProviderOutput,
      demands,
      services: config.options.services
    });
    assert.equal(publicProviderPlan.ok, true, JSON.stringify(publicProviderPlan.diagnostics));
    assert.deepEqual(Object.keys(publicProviderPlan.toolchain), ['available', 'version', 'resolved']);
    assert.equal(Object.prototype.hasOwnProperty.call(publicProviderPlan.toolchain, 'module'), false);
    const publicProviderJson = JSON.stringify(publicProviderPlan);
    assert.doesNotMatch(publicProviderJson, /"(?:SyntaxKind|ScriptTarget|DiagnosticCategory)"/u);
    assert.ok(Buffer.byteLength(publicProviderJson, 'utf8') < 100_000, `public provider plan JSON is unexpectedly large: ${Buffer.byteLength(publicProviderJson, 'utf8')} bytes`);
    const publicProviderReport = await publicProvider.build();
    assert.equal(publicProviderReport.ok, true, JSON.stringify(publicProviderReport.diagnostics));
    assert.equal(fs.existsSync(path.join(publicProviderOutput, 'server/xtend.maraca.services.mjs')), true);
    assert.equal(publicProviderReport.files.some((filePath) => filePath.endsWith('server/xtend.maraca.services.mjs.map')), true);
    publicProvider.dispose();
    context.pass('the public TypeScript provider keeps compiler internals private and resolves Rollup for Node builds');
    const insecureRoot = path.join(workspace, 'insecure');
    write(path.join(insecureRoot, 'src/services.ts'), `
import 'node:fs';
import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';
export default defineAppServices({ 'app.health': service({ kind: 'query', target: 'server' }) });
`);
    linkWorkspaceNodeModules(insecureRoot, rootDir);
    const insecurePlan = createMaracaServiceBuildPlan({
      rootDir: insecureRoot,
      outputDir: path.join(insecureRoot, 'dist'),
      demands,
      services: { clientEntry: 'src/services.ts', targets: ['browser'], strict: true }
    });
    assert.equal(insecurePlan.ok, false);
    assert.equal(insecurePlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.services.node_import_in_browser'), true);

    const environmentRoot = path.join(workspace, 'browser-environment');
    write(path.join(environmentRoot, 'src/services.ts'), `
import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';
const secret = import.meta.env.PRIVATE_TOKEN;
export default defineAppServices({
  'app.health': service({ kind: 'query', target: 'local', invoke() { return secret; } })
});
`);
    linkWorkspaceNodeModules(environmentRoot, rootDir);
    const environmentPlan = createMaracaServiceBuildPlan({
      rootDir: environmentRoot,
      outputDir: path.join(environmentRoot, 'dist'),
      demands,
      services: { clientEntry: 'src/services.ts', targets: ['browser'], strict: true }
    });
    assert.equal(environmentPlan.ok, false);
    assert.equal(environmentPlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.services.environment_access_in_browser'), true);

    const missingPlan = createMaracaServiceBuildPlan({
      rootDir: appRoot,
      outputDir: path.join(appRoot, 'dist-missing'),
      demands,
      services: {
        clientEntry: 'src/services.ts',
        serverEntry: 'src/missing-server-services.ts',
        phpEntry: 'server/missing-server-services.php',
        targets: ['browser', 'node', 'php'],
        strict: true
      }
    });
    assert.equal(missingPlan.ok, false);
    assert.equal(missingPlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.services.missing_node_implementation'), true);
    assert.equal(missingPlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.services.missing_php_implementation'), true);

    const mismatchRoot = path.join(workspace, 'mismatch');
    write(path.join(mismatchRoot, 'src/services.ts'), `
import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';
export default defineAppServices({
  'app.health': service({ kind: 'stream', target: 'server' })
});
`);
    linkWorkspaceNodeModules(mismatchRoot, rootDir);
    const mismatchPlan = createMaracaServiceBuildPlan({
      rootDir: mismatchRoot,
      outputDir: path.join(mismatchRoot, 'dist'),
      demands,
      services: { clientEntry: 'src/services.ts', targets: ['browser'], strict: true }
    });
    assert.equal(mismatchPlan.ok, false);
    assert.equal(mismatchPlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.services.mode_mismatch'), true);

    const wrongServerContractRoot = path.join(workspace, 'wrong-server-contract');
    write(path.join(wrongServerContractRoot, 'src/services.ts'), `
import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';
export default defineAppServices({
  'app.health': service({ kind: 'query', target: 'server' })
});
`);
    write(path.join(wrongServerContractRoot, 'src/server-services.ts'), `
import { defineServerServices, service } from '@ccslabs/xtend-maraca/server-services';
export default defineServerServices({
  'app.health': service({ kind: 'stream', target: 'local', async *stream() { yield { ok: false }; } })
});
`);
    write(path.join(wrongServerContractRoot, 'server/server-services.php'), `<?php
return [
  'app.health' => ['stream' => static function (): Generator { yield ['type' => 'complete']; }],
];
`);
    linkWorkspaceNodeModules(wrongServerContractRoot, rootDir);
    const wrongServerContractPlan = createMaracaServiceBuildPlan({
      rootDir: wrongServerContractRoot,
      outputDir: path.join(wrongServerContractRoot, 'dist'),
      demands,
      services: { targets: ['browser', 'node', 'php'], strict: true }
    });
    assert.equal(wrongServerContractPlan.ok, false);
    assert.equal(wrongServerContractPlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.services.node_target_mismatch'), true);
    assert.equal(wrongServerContractPlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.services.node_mode_mismatch'), true);
    assert.equal(wrongServerContractPlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.services.php_mode_mismatch'), true);

    const genericPhpHandlerRoot = path.join(workspace, 'generic-php-handler');
    write(path.join(genericPhpHandlerRoot, 'src/services.ts'), `
import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';
export default defineAppServices({
  'app.health': service({ kind: 'query', target: 'server' })
});
`);
    write(path.join(genericPhpHandlerRoot, 'server/server-services.php'), `<?php
return [
  'app.health' => ['handler' => static fn (): array => ['ok' => true]],
];
`);
    linkWorkspaceNodeModules(genericPhpHandlerRoot, rootDir);
    const genericPhpHandlerPlan = createMaracaServiceBuildPlan({
      rootDir: genericPhpHandlerRoot,
      outputDir: path.join(genericPhpHandlerRoot, 'dist'),
      demands,
      services: { targets: ['browser', 'php'], strict: true }
    });
    assert.equal(genericPhpHandlerPlan.ok, true, JSON.stringify(genericPhpHandlerPlan.diagnostics));

    const handlerlessServerRoot = path.join(workspace, 'handlerless-server-contract');
    write(path.join(handlerlessServerRoot, 'src/services.ts'), `
import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';
export default defineAppServices({
  'app.health': service({ kind: 'query', target: 'server' })
});
`);
    write(path.join(handlerlessServerRoot, 'src/server-services.ts'), `
import { defineServerServices, service } from '@ccslabs/xtend-maraca/server-services';
export default defineServerServices({
  'app.health': service({ kind: 'query', target: 'server' })
});
`);
    write(path.join(handlerlessServerRoot, 'server/server-services.php'), `<?php
return [
  'app.health' => ['cleanup' => static function (): void {}],
];
`);
    linkWorkspaceNodeModules(handlerlessServerRoot, rootDir);
    const handlerlessServerPlan = createMaracaServiceBuildPlan({
      rootDir: handlerlessServerRoot,
      outputDir: path.join(handlerlessServerRoot, 'dist'),
      demands,
      services: { targets: ['browser', 'node', 'php'], strict: true }
    });
    assert.equal(handlerlessServerPlan.ok, false);
    assert.equal(handlerlessServerPlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.services.node_handler_missing'), true);
    assert.equal(handlerlessServerPlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.services.php_handler_missing'), true);

    const brokenRoot = path.join(workspace, 'broken-types');
    write(path.join(brokenRoot, 'src/services.ts'), `
import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';
const broken: string = 7;
export default defineAppServices({
  'app.health': service({ kind: 'query', target: 'server', metadata: { broken } })
});
`);
    linkWorkspaceNodeModules(brokenRoot, rootDir);
    const brokenPlan = createMaracaServiceBuildPlan({
      rootDir: brokenRoot,
      outputDir: path.join(brokenRoot, 'dist'),
      demands,
      services: { clientEntry: 'src/services.ts', targets: ['browser'], strict: true }
    });
    const typeDiagnostics = typecheckServiceEntries(brokenPlan);
    assert.equal(typeDiagnostics.some((entry) => entry.code === 'xtend.maraca.services.typescript_2322'), true);
    assert.equal(typeDiagnostics.some((entry) => entry.details.file === 'src/services.ts' && entry.details.line === 3), true);
    context.pass('strict planning blocks browser Node imports, missing target implementations and mode mismatches');
    context.pass('strict planning rejects wrong-target, wrong-mode and handlerless Node/PHP implementations');
    context.pass('full TypeScript program diagnostics retain source file and line information');
    await runBrowserSourceToSea(context, appRoot, config);
  } catch (error) {
    context.fail(error && error.stack || String(error));
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }

  return context.result({
    schema: 'xtend.maraca.app-services-build-suite-report.v1'
  });
}

function printMaracaAppServicesBuildReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca AppServices Build Source-to-Sea erfolgreich.',
    failureTitle: 'XTend Maraca AppServices Build Source-to-Sea fehlgeschlagen:'
  });
}

if (require.main === module) {
  runMaracaAppServicesBuildSuite().then((result) => {
    printMaracaAppServicesBuildReport(result);
    process.exitCode = result.ok ? 0 : 1;
  }).catch((error) => {
    process.stderr.write(`${error && error.stack || error}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  printMaracaAppServicesBuildReport,
  runMaracaAppServicesBuildSuite
};
