'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { buildMaracaBundleAsync, createMaracaBuildPlan } = require('../../xtend-maraca');
const { runCssProviderLifecycle, createCssBuildRequest } = require('../../xtend-maraca/css-provider');
const {
  TAILWIND_ADAPTER_VERSION,
  TAILWIND_PROVIDER_ID,
  TAILWIND_VERSION,
  createTailwindCssProvider
} = require('../../xtend-maraca-css-tailwind');
const {
  DEFAULT_STYLESHEET,
  TAILWIND_COMPILE_RESULT_SCHEMA,
  TAILWIND_TOOLCHAIN_SCHEMA,
  createTailwindToolchainApi,
  toolchainInspection
} = require('../../xtend-maraca-css-tailwind/toolchain');

const PACKAGE_PATH = 'xtend-maraca-css-tailwind/package.json';
const SOURCE_FIXTURE = 'tests/maraca/fixtures/tailwind-provider-source.html';
const CSS_FIXTURE = 'tests/maraca/fixtures/tailwind-provider-input.css';
const RMT_FIXTURE = 'tests/rmt-language/fixtures/maraca-known-components.rmt';
// Harness ceiling only. XTM-11 derives the product CSS budget from measured reference apps.
const HARNESS_CSS_BUDGET = 32768;

async function runMaracaTailwindCssProviderSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({ id: 'maraca-tailwind-css-provider', label: 'Maraca Tailwind CSS Provider' });
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, PACKAGE_PATH), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(rootDir, 'package-lock.json'), 'utf8'));
  const backlog = fs.readFileSync(path.join(rootDir, 'development/BACKLOG-XTend-Material-Tailwind-CSS-Fast-Path.md'), 'utf8');

  context.assert(manifest.name === '@xtend-material/maraca-tailwind', 'adapter uses the accepted scoped package name');
  context.assert(manifest.dependencies.tailwindcss === '4.3.2' && manifest.dependencies['@tailwindcss/node'] === '4.3.2', 'adapter pins the complete Node toolchain exactly');
  context.assert(!manifest.dependencies['@tailwindcss/cli'] && !manifest.dependencies['@tailwindcss/oxide'], 'adapter avoids CLI subprocess and Node-20-only direct scanner dependency');
  context.assert(lock.packages['node_modules/tailwindcss'].version === '4.3.2' && Boolean(lock.packages['node_modules/tailwindcss'].integrity), 'lockfile pins Tailwind with integrity');
  context.assert(lock.packages['node_modules/@tailwindcss/node'].version === '4.3.2' && Boolean(lock.packages['node_modules/@tailwindcss/node'].integrity), 'lockfile pins Tailwind Node API with integrity');
  context.assert(TAILWIND_PROVIDER_ID === 'tailwind' && TAILWIND_VERSION === '4.3.2' && TAILWIND_ADAPTER_VERSION === '0.1.0', 'adapter exports stable provider and version identifiers');

  const inspection = toolchainInspection();
  context.assert(inspection.schema === TAILWIND_TOOLCHAIN_SCHEMA && inspection.status === 'ready', 'local Tailwind toolchain inspection is ready');
  context.assert(inspection.versions.tailwindcss === '4.3.2' && inspection.versions.node === '4.3.2', 'inspection reports exact resolved toolchain versions');
  context.assert(inspection.packages.every((entry) => entry.integrity && entry.integrity.startsWith('sha512-')), 'inspection reports lockfile integrity for every toolchain package');
  context.assert(inspection.airGapped && inspection.networkPolicy === 'forbidden', 'inspection declares the air-gapped network boundary');
  context.assert(inspection.discovery === 'explicit-sources-only' && inspection.preflight === 'disabled', 'inspection disables automatic discovery and Preflight');
  context.assert(inspection.tempFiles === false && inspection.cache === 'memory-only', 'inspection declares deterministic memory-only operation');
  const unavailable = toolchainInspection({ resolve() { throw new Error('fixture toolchain missing'); } });
  context.assert(!unavailable.available && unavailable.status === 'unavailable', 'missing local toolchain is explicitly unavailable');
  const unavailableProvider = createTailwindCssProvider({
    rootDir,
    toolchain: {
      inspect: () => unavailable,
      compile: async () => { throw new Error('compile must not run'); },
      dispose: async () => ({ status: 'disposed' })
    }
  });
  const unavailableProviderResult = await runCssProviderLifecycle(unavailableProvider, createCssBuildRequest({
    provider: 'tailwind',
    mode: 'external',
    metadata: { preflight: 'disabled' }
  }));
  context.assert(!unavailableProviderResult.ok && unavailableProviderResult.status === 'unavailable', 'provider lifecycle exposes missing toolchain without native fallback');

  const api = createTailwindToolchainApi();
  const compileInput = {
    css: DEFAULT_STYLESHEET,
    sourceRoot: rootDir,
    sources: [{ path: 'virtual/low-level-source.html', content: '<main class="grid gap-4 p-6 text-red-500"><button class="rounded-lg font-medium">Fixture</button></main>' }],
    candidates: ['flex'],
    preflight: 'disabled',
    minify: true
  };
  const networkCalls = [];
  const originals = {
    fetch: globalThis.fetch,
    httpRequest: http.request,
    httpsRequest: https.request,
    spawn: childProcess.spawn
  };
  globalThis.fetch = () => { networkCalls.push('fetch'); throw new Error('network forbidden'); };
  http.request = () => { networkCalls.push('http'); throw new Error('network forbidden'); };
  https.request = () => { networkCalls.push('https'); throw new Error('network forbidden'); };
  childProcess.spawn = () => { networkCalls.push('spawn'); throw new Error('subprocess forbidden'); };
  let first;
  let second;
  try {
    first = await api.compile(compileInput);
    second = await api.compile(compileInput);
  } finally {
    globalThis.fetch = originals.fetch;
    http.request = originals.httpRequest;
    https.request = originals.httpsRequest;
    childProcess.spawn = originals.spawn;
  }
  context.assert(networkCalls.length === 0, 'compilation uses no fetch, HTTP, HTTPS or subprocess endpoint');
  context.assert(first.schema === TAILWIND_COMPILE_RESULT_SCHEMA && first.status === 'ready', 'air-gapped API emits the compile result schema');
  context.assert(first.cssText.includes('.grid') && first.cssText.includes('.gap-4') && first.cssText.includes('.text-red-500'), 'explicit source scan generates Tailwind utilities');
  context.assert(!first.cssText.includes('box-sizing:border-box') && !first.cssText.includes('::before'), 'Preflight CSS is absent');
  context.assert(first.outputFingerprint === second.outputFingerprint && first.cssText === second.cssText, 'identical builds are byte-for-byte deterministic');
  context.assert(first.candidates.join(',') === second.candidates.join(',') && first.candidateCount >= 6, 'candidate inventory is deterministic and explicit');
  context.assert(first.dependencies.every((dependency) => dependency.includes('node_modules/tailwindcss')), 'compiler dependencies resolve only from the pinned local Tailwind package');
  context.assert(first.airGap.networkAccess === false && first.airGap.automaticDiscovery === false && first.airGap.tempFiles === false, 'compile evidence records air-gap invariants');
  const dispose = await api.dispose();
  context.assert(dispose.tempFilesRemoved === 0 && dispose.cacheEntriesRemoved === 0, 'dispose confirms that no temp or persistent cache state exists');

  let remoteBlocked = false;
  try {
    await api.compile({ ...compileInput, css: '@import "https://example.invalid/theme.css";' });
  } catch (error) {
    remoteBlocked = error.code === 'xtend.material.tailwind.network_source_blocked';
  }
  context.assert(remoteBlocked, 'remote CSS imports are blocked before compilation');
  let pluginBlocked = false;
  try {
    await api.compile({ ...compileInput, css: '@plugin "./network-capable-plugin.js";' });
  } catch (error) {
    pluginBlocked = error.code === 'xtend.material.tailwind.executable_extension_blocked';
  }
  context.assert(pluginBlocked, 'executable Tailwind plugins are blocked by the air-gapped endpoint');
  let escapeBlocked = false;
  try {
    await api.compile({ ...compileInput, sources: [{ path: '../outside.html' }] });
  } catch (error) {
    escapeBlocked = error.code === 'xtend.maraca.css_provider.source_blocked';
  }
  context.assert(escapeBlocked, 'sources outside the explicit root are blocked');

  const provider = createTailwindCssProvider({ rootDir });
  const providerResult = await runCssProviderLifecycle(provider, createCssBuildRequest({
    provider: 'tailwind',
    mode: 'external',
    input: CSS_FIXTURE,
    output: 'xtend.maraca.css',
    profile: 'production',
    sources: [{ path: SOURCE_FIXTURE, kind: 'content' }],
    sourcePolicy: { root: '.', allow: [SOURCE_FIXTURE], automaticDiscovery: false },
    metadata: { preflight: 'disabled' }
  }));
  context.assert(providerResult.ok && providerResult.lifecycle.join(',') === 'inspect,plan,build,report,dispose', 'Tailwind adapter implements the full Maraca lifecycle');
  context.assert(providerResult.evidence.toolchain.versions.tailwindcss === '4.3.2', 'provider evidence contains Tailwind toolchain version');
  context.assert(providerResult.evidence.adapter.name === '@xtend-material/maraca-tailwind', 'provider evidence identifies the adapter package');
  context.assert(providerResult.evidence.airGap.networkAccess === false && providerResult.evidence.compileFingerprint, 'provider evidence contains air-gap and compiler fingerprints');
  context.assert(providerResult.evidence.designKit.schema === 'xtend.material.design-kit.v1' && providerResult.evidence.designKit.package === '@xtend-material/core', 'provider evidence identifies the XTM-06 design kit');
  context.assert(Boolean(providerResult.evidence.designKit.stylesFingerprint), 'provider evidence fingerprints the native design-kit stylesheet');

  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-maraca-tailwind-suite-'));
  try {
    const buildInput = {
      source: RMT_FIXTURE,
      out: outputRoot,
      profile: 'debug',
      css: 'external',
      cssProvider: 'tailwind',
      cssInput: CSS_FIXTURE,
      cssSources: [SOURCE_FIXTURE],
      cssPreflight: 'disabled',
      cssBudget: HARNESS_CSS_BUDGET,
      pwa: true
    };
    const plan = createMaracaBuildPlan(buildInput, { rootDir });
    context.assert(plan.ok && plan.cssBuild.resolvedProvider === 'tailwind', 'Maraca resolves the installed Tailwind provider by id');
    const build = await buildMaracaBundleAsync(buildInput, { rootDir });
    context.assert(build.ok && build.plan.cssBuild.evidence.toolchain.versions.node === '4.3.2', 'Maraca build executes the local Tailwind Node toolchain');
    context.assert(build.sizeBudgetReport.css.bytes > 0 && build.sizeBudgetReport.css.withinBudget, 'Maraca size report budgets generated Tailwind CSS');
    context.assert(build.bundleReport.pwa.precacheUrls.includes('./xtend.maraca.css'), 'generated Tailwind CSS participates in PWA precache');
    const browserJavaScript = build.bundleReport.bundleFiles
      .filter((file) => file.type === 'chunk')
      .map((file) => fs.readFileSync(path.resolve(rootDir, file.path), 'utf8'))
      .join('\n');
    context.assert(!browserJavaScript.includes('tailwindcss') && !browserJavaScript.includes('@tailwindcss/node'), 'browser chunks contain no Tailwind runtime');
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }

  Object.keys(require.cache)
    .filter((file) => file.includes('xtend-maraca-css-tailwind'))
    .forEach((file) => delete require.cache[file]);
  const nativePlan = createMaracaBuildPlan({ source: RMT_FIXTURE }, { rootDir });
  const adapterReloaded = Object.keys(require.cache).some((file) => file.includes('xtend-maraca-css-tailwind'));
  context.assert(nativePlan.ok && !adapterReloaded, 'standard native Maraca planning does not load the Tailwind adapter');
  context.assert(backlog.includes('| `XTM-03` | P0 | completed | WS2 |'), 'backlog marks XTM-03 completed');

  return context.result({ report: {
    schema: 'xtend.material.maraca-tailwind-provider-report.v1',
    status: context.failures.length === 0 ? 'accepted' : 'blocked',
    provider: TAILWIND_PROVIDER_ID,
    adapterVersion: TAILWIND_ADAPTER_VERSION,
    tailwindVersion: TAILWIND_VERSION,
    airGapped: true
  } });
}

function printMaracaTailwindCssProviderReport(result) {
  printSuiteReport(result, {
    successTitle: 'Maraca Tailwind CSS provider gate passed.',
    failureTitle: 'Maraca Tailwind CSS provider gate failed:'
  });
}

if (require.main === module) {
  runMaracaTailwindCssProviderSuite().then((result) => {
    printMaracaTailwindCssProviderReport(result);
    if (!result.ok) process.exit(1);
  }).catch((error) => {
    console.error(error && error.stack || error);
    process.exit(1);
  });
}

module.exports = { printMaracaTailwindCssProviderReport, runMaracaTailwindCssProviderSuite };
