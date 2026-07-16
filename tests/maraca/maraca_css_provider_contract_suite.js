'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  CSS_PROVIDER_BUILD_FAILED_CODE,
  CSS_PROVIDER_INVALID_CODE,
  CSS_PROVIDER_LIFECYCLE,
  MARACA_CSS_ARTIFACT_SCHEMA,
  MARACA_CSS_BUILD_EVIDENCE_SCHEMA,
  MARACA_CSS_BUILD_PLAN_SCHEMA,
  MARACA_CSS_BUILD_REQUEST_SCHEMA,
  MARACA_CSS_DIAGNOSTIC_SCHEMA,
  MARACA_CSS_INSPECTION_SCHEMA,
  MARACA_CSS_LIFECYCLE_RESULT_SCHEMA,
  MARACA_CSS_PROVIDER_SCHEMA,
  createCssBuildRequest,
  createCssProvider,
  createCssProviderContract,
  createDummyCssProvider,
  createNativeMaracaCssProvider,
  runCssProviderLifecycle,
  validateCssBuildRequest,
  validateCssProvider,
  validateCssProviderContract
} = require('../../xtend-maraca/css-provider');
const {
  buildMaracaBundleAsync,
  createMaracaBuildPlan
} = require('../../xtend-maraca');

const CONTRACT_PATH = 'development/XTend-Maraca-CSS-Provider-Contract.md';
const BACKLOG_PATH = 'development/BACKLOG-XTend-Material-Tailwind-CSS-Fast-Path.md';
const MODULE_PATH = 'xtend-maraca/css-provider.js';
const TYPES_PATH = 'xtend-maraca/css-provider.d.ts';
const SUITE_PATH = 'tests/maraca/maraca_css_provider_contract_suite.js';

function readText(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

async function runMaracaCssProviderContractSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'maraca-css-provider',
    label: 'Maraca CSS Provider Contract'
  });
  const contractDoc = readText(rootDir, CONTRACT_PATH);
  const backlog = readText(rootDir, BACKLOG_PATH);
  const types = readText(rootDir, TYPES_PATH);
  const runner = readText(rootDir, 'scripts/run_xtend_tests.js');
  const packageManifest = JSON.parse(readText(rootDir, 'package.json'));
  const maracaManifest = JSON.parse(readText(rootDir, 'xtend-maraca/package.json'));
  const metadata = packageManifest.xtend && packageManifest.xtend.maracaCssProvider;

  [CONTRACT_PATH, BACKLOG_PATH, MODULE_PATH, TYPES_PATH, SUITE_PATH].forEach((relativePath) => {
    context.assert(fs.existsSync(path.join(rootDir, relativePath)), `${relativePath} exists`);
  });

  context.assert(MARACA_CSS_PROVIDER_SCHEMA === 'xtend.maraca.css-provider.v1', 'provider schema is stable');
  context.assert(MARACA_CSS_BUILD_REQUEST_SCHEMA === 'xtend.maraca.css-build-request.v1', 'request schema is stable');
  context.assert(MARACA_CSS_INSPECTION_SCHEMA === 'xtend.maraca.css-provider-inspection.v1', 'inspection schema is stable');
  context.assert(MARACA_CSS_BUILD_PLAN_SCHEMA === 'xtend.maraca.css-build-plan.v1', 'plan schema is stable');
  context.assert(MARACA_CSS_ARTIFACT_SCHEMA === 'xtend.maraca.css-artifact.v1', 'artifact schema is stable');
  context.assert(MARACA_CSS_BUILD_EVIDENCE_SCHEMA === 'xtend.maraca.css-build-evidence.v1', 'evidence schema is stable');
  context.assert(MARACA_CSS_LIFECYCLE_RESULT_SCHEMA === 'xtend.maraca.css-provider-lifecycle-result.v1', 'lifecycle result schema is stable');
  context.assert(MARACA_CSS_DIAGNOSTIC_SCHEMA === 'xtend.maraca.css-provider-diagnostic.v1', 'diagnostic schema is stable');
  context.assert(JSON.stringify(CSS_PROVIDER_LIFECYCLE) === JSON.stringify(['inspect', 'plan', 'build', 'report', 'dispose']), 'provider lifecycle is closed and ordered');

  const contract = createCssProviderContract({
    id: 'fixture-provider',
    version: '1.0.0',
    capabilities: { inline: true, external: true, minify: true, sourceMaps: false },
    sourcePolicy: { explicitSources: true, automaticDiscovery: false, network: false }
  });
  const sameContract = createCssProviderContract({
    sourcePolicy: { network: false, automaticDiscovery: false, explicitSources: true },
    capabilities: { sourceMaps: false, minify: true, external: true, inline: true },
    version: '1.0.0',
    id: 'fixture-provider'
  });
  context.assert(contract.schema === MARACA_CSS_PROVIDER_SCHEMA, 'contract factory emits provider schema');
  context.assert(contract.runtimeBoundary === 'build-time-only', 'contract is build-time-only');
  context.assert(contract.fingerprint === sameContract.fingerprint, 'contract fingerprints are key-order deterministic');
  context.assert(!JSON.stringify(contract).includes('function'), 'contract snapshot contains no lifecycle functions');
  context.assert(validateCssProviderContract(contract).ok, 'valid provider contract passes validation');
  const invalidContract = validateCssProviderContract({ id: 'Invalid Provider', version: '' });
  context.assert(!invalidContract.ok && invalidContract.diagnostics.every((entry) => entry.code === CSS_PROVIDER_INVALID_CODE), 'invalid provider contract emits stable diagnostics');

  const request = createCssBuildRequest({
    provider: 'fixture-provider',
    mode: 'external',
    input: 'app.css',
    output: 'dist/app.css',
    sources: [
      { path: 'app.rmt', kind: 'rmt', fingerprint: 'source-a' },
      'app.css'
    ],
    sourcePolicy: { root: '.', allow: ['app.rmt', 'app.css'], automaticDiscovery: false }
  });
  const sameRequest = createCssBuildRequest({
    sourcePolicy: { automaticDiscovery: false, allow: ['app.rmt', 'app.css'], root: '.' },
    sources: [
      { fingerprint: 'source-a', kind: 'rmt', path: 'app.rmt' },
      'app.css'
    ],
    output: 'dist/app.css',
    input: 'app.css',
    mode: 'external',
    provider: 'fixture-provider'
  });
  context.assert(request.schema === MARACA_CSS_BUILD_REQUEST_SCHEMA, 'request factory emits request schema');
  context.assert(request.fingerprint === sameRequest.fingerprint, 'request fingerprints are key-order deterministic');
  context.assert(request.sourcePolicy.automaticDiscovery === false, 'request defaults to explicit source discovery');
  context.assert(validateCssBuildRequest(request).ok, 'valid request passes validation');
  const badRequest = validateCssBuildRequest({ provider: 'fixture-provider', sources: [{}] });
  context.assert(!badRequest.ok && badRequest.status === 'blocked', 'source without path is blocked');

  const nativeProvider = createNativeMaracaCssProvider({ cssText: ':root{--fixture:1;}' });
  const nativeValidation = validateCssProvider(nativeProvider);
  context.assert(nativeValidation.ok, 'native provider implements the full contract');
  const nativeRequest = createCssBuildRequest({ ...request, provider: 'maraca-native' });
  const nativeResult = await runCssProviderLifecycle(nativeProvider, nativeRequest);
  context.assert(nativeResult.ok && nativeResult.status === 'ready', 'native provider lifecycle succeeds');
  context.assert(JSON.stringify(nativeResult.lifecycle) === JSON.stringify(CSS_PROVIDER_LIFECYCLE), 'native provider executes canonical lifecycle');
  context.assert(nativeResult.inspection.schema === MARACA_CSS_INSPECTION_SCHEMA, 'native provider emits inspection');
  context.assert(nativeResult.plan.schema === MARACA_CSS_BUILD_PLAN_SCHEMA, 'native provider emits plan');
  context.assert(nativeResult.artifact.schema === MARACA_CSS_ARTIFACT_SCHEMA && nativeResult.artifact.bytes > 0, 'native provider emits non-empty CSS artifact');
  context.assert(nativeResult.evidence.schema === MARACA_CSS_BUILD_EVIDENCE_SCHEMA, 'native provider emits build evidence');
  context.assert(!Object.prototype.hasOwnProperty.call(nativeResult.evidence, 'cssText'), 'build evidence excludes CSS content');
  context.assert(nativeResult.evidence.outputFingerprint === nativeResult.artifact.fingerprint, 'evidence links artifact fingerprint');
  context.assert(nativeResult.evidence.sourceFingerprints.length === 2, 'evidence lists declared source fingerprints');

  const dummyState = {};
  const dummyProvider = createDummyCssProvider({ state: dummyState, cssText: '.fixture{display:grid;}' });
  context.assert(validateCssProvider(dummyProvider).ok, 'dummy provider implements the same contract');
  const dummyRequest = createCssBuildRequest({ ...request, provider: 'test-dummy' });
  const dummyResult = await runCssProviderLifecycle(dummyProvider, dummyRequest);
  context.assert(dummyResult.ok, 'dummy provider lifecycle succeeds');
  context.assert(dummyState.inspect === 1 && dummyState.plan === 1 && dummyState.build === 1 && dummyState.report === 1 && dummyState.dispose === 1, 'dummy provider records every lifecycle method exactly once');

  const failureState = {};
  const failingProvider = createDummyCssProvider({ state: failureState, buildError: 'fixture failure' });
  const failureResult = await runCssProviderLifecycle(failingProvider, dummyRequest);
  context.assert(!failureResult.ok && failureResult.status === 'failed', 'provider build error fails lifecycle');
  context.assert(failureResult.diagnostics.some((entry) => entry.code === CSS_PROVIDER_BUILD_FAILED_CODE), 'provider build error emits stable diagnostic');
  context.assert(failureState.dispose === 1, 'dispose runs after provider build failure');

  const unavailableState = {};
  const unavailableProvider = createDummyCssProvider({
    state: unavailableState,
    inspection: { status: 'unavailable', available: false }
  });
  const unavailableResult = await runCssProviderLifecycle(unavailableProvider, dummyRequest);
  context.assert(!unavailableResult.ok && unavailableResult.status === 'unavailable', 'unavailable provider returns explicit unavailable status');
  context.assert(unavailableState.plan === undefined && unavailableState.build === undefined, 'unavailable provider skips plan and build');
  context.assert(unavailableState.report === 1 && unavailableState.dispose === 1, 'unavailable provider still reports evidence and disposes');

  const mismatchResult = await runCssProviderLifecycle(nativeProvider, request);
  context.assert(!mismatchResult.ok && mismatchResult.status === 'blocked', 'provider/request identity mismatch is blocked before inspection');
  context.assert(mismatchResult.diagnostics.some((entry) => entry.code === CSS_PROVIDER_INVALID_CODE), 'provider/request mismatch emits invalid-provider diagnostic');

  const incompleteProvider = createCssProvider({ id: 'incomplete', version: '1' });
  const incompleteValidation = validateCssProvider(incompleteProvider);
  context.assert(!incompleteValidation.ok && incompleteValidation.diagnostics.length === CSS_PROVIDER_LIFECYCLE.length, 'provider missing lifecycle methods is rejected');

  const source = 'tests/rmt-language/fixtures/maraca-known-components.rmt';
  const unknownPlan = createMaracaBuildPlan({ source, cssProvider: 'missing-provider' }, { rootDir });
  context.assert(!unknownPlan.ok && unknownPlan.cssBuild.status === 'blocked', 'unknown provider fails closed during Maraca planning');
  context.assert(unknownPlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.css_provider.unavailable'), 'unknown provider emits stable unavailable diagnostic');
  const fallbackPlan = createMaracaBuildPlan({ source, cssProvider: 'missing-provider', cssProviderFallback: 'native' }, { rootDir });
  context.assert(fallbackPlan.ok && fallbackPlan.cssBuild.resolvedProvider === 'maraca-native', 'explicit native fallback remains buildable');
  context.assert(fallbackPlan.diagnostics.some((entry) => entry.code === 'xtend.maraca.css_provider.fallback'), 'explicit fallback remains visible in diagnostics');

  const integrationRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-maraca-css-provider-'));
  try {
    const integrationProvider = createDummyCssProvider({ cssText: '.xtm-fixture{display:grid;}' });
    const external = await buildMaracaBundleAsync({
      source,
      out: path.join(integrationRoot, 'external'),
      profile: 'debug',
      css: 'external',
      cssProvider: 'test-dummy',
      cssProviderImplementation: integrationProvider,
      cssSources: [source],
      cssPreflight: 'scoped',
      cssBudget: 1024,
      pwa: true
    }, { rootDir });
    context.assert(external.ok, 'dummy provider runs through the asynchronous Maraca build');
    context.assert(external.plan.cssBuild.lifecycle.join(',') === CSS_PROVIDER_LIFECYCLE.join(','), 'Maraca build executes the canonical provider lifecycle before bundling');
    context.assert(external.plan.cssBuild.evidence.schema === MARACA_CSS_BUILD_EVIDENCE_SCHEMA, 'Maraca plan retains provider evidence');
    context.assert(external.bundleReport.cssBuild.evidence.fingerprint === external.plan.cssBuild.evidence.fingerprint, 'bundle report retains CSS evidence fingerprint');
    context.assert(external.sizeBudgetReport.css.bytes === Buffer.byteLength('.xtm-fixture{display:grid;}'), 'size report accounts for provider CSS bytes');
    context.assert(external.sizeBudgetReport.css.requestFingerprint === external.plan.cssBuild.requestFingerprint, 'size report links CSS request fingerprint');
    context.assert(external.sizeBudgetReport.css.sourceFingerprints.some((entry) => entry.fingerprint), 'size report retains CSS source fingerprints');
    context.assert(external.sizeBudgetReport.css.outputFingerprint === external.plan.cssBuild.evidence.outputFingerprint, 'size report retains CSS output fingerprint');
    context.assert(fs.readFileSync(external.plan.outputs.css, 'utf8').trim() === '.xtm-fixture{display:grid;}', 'external mode writes the provider artifact');
    context.assert(external.bundleReport.pwa.precacheUrls.includes('./xtend.maraca.css'), 'PWA precache includes the provider CSS asset');

    const inline = await buildMaracaBundleAsync({
      source,
      out: path.join(integrationRoot, 'inline'),
      profile: 'debug',
      css: 'inline',
      cssProvider: 'test-dummy',
      cssProviderImplementation: createDummyCssProvider({ cssText: '.xtm-fixture{display:grid;}' }),
      cssBudget: 1024
    }, { rootDir });
    context.assert(inline.ok, 'dummy provider supports inline Maraca output');
    context.assert(fs.readFileSync(inline.plan.outputs.entry, 'utf8').includes('.xtm-fixture{display:grid;}'), 'inline mode embeds the provider artifact in the app shell');
    context.assert(inline.plan.cssBuild.evidence.outputFingerprint === external.plan.cssBuild.evidence.outputFingerprint, 'inline and external modes preserve equivalent provider CSS output');
    context.assert(inline.plan.outputs.css === null, 'inline mode emits no standalone CSS asset');

    const overBudget = await buildMaracaBundleAsync({
      source,
      out: path.join(integrationRoot, 'over-budget'),
      profile: 'debug',
      cssProvider: 'test-dummy',
      cssProviderImplementation: createDummyCssProvider({ cssText: '.xtm-fixture{display:grid;}' }),
      cssBudget: 4
    }, { rootDir });
    context.assert(!overBudget.ok && overBudget.sizeBudgetReport.status === 'css_over_budget', 'CSS budget blocks oversized provider output');
  } finally {
    fs.rmSync(integrationRoot, { recursive: true, force: true });
  }

  [
    'export interface CssProviderContract',
    'export interface CssBuildRequest',
    'export interface CssBuildPlan',
    'export interface CssArtifact',
    'export interface CssBuildEvidence',
    'export function runCssProviderLifecycle'
  ].forEach((anchor) => context.assert(types.includes(anchor), `types expose ${anchor}`));
  context.assert(contractDoc.includes('inspect -> plan -> build -> report -> dispose'), 'contract documents canonical lifecycle');
  context.assert(contractDoc.includes('XTM-02 Integration'), 'contract documents the productive integration');
  context.assert(backlog.includes('| `XTM-01` | P0 | completed | WS1 |'), 'backlog marks XTM-01 completed');

  context.assert(maracaManifest.exports['./css-provider'].default === './css-provider.js', 'Maraca package exports CSS provider module');
  context.assert(maracaManifest.exports['./css-provider'].types === './css-provider.d.ts', 'Maraca package exports CSS provider types');
  context.assert(maracaManifest.files.includes('css-provider.js') && maracaManifest.files.includes('css-provider.d.ts'), 'Maraca package publishes CSS provider artifacts');
  context.assert(packageManifest.exports['./maraca/css-provider'].default === './xtend-maraca/css-provider.js', 'root package exports CSS provider module');
  context.assert(packageManifest.exports['./maraca/css-provider'].types === './xtend-maraca/css-provider.d.ts', 'root package exports CSS provider types');
  context.assert(metadata && metadata.schema === MARACA_CSS_PROVIDER_SCHEMA, 'package metadata declares CSS provider schema');
  context.assert(metadata && metadata.status === 'integrated-by-XTM-02', 'package metadata marks XTM-02 integrated');
  context.assert(metadata && metadata.module === MODULE_PATH && metadata.types === TYPES_PATH, 'package metadata links module and types');
  context.assert(metadata && metadata.contract === CONTRACT_PATH && metadata.suite === SUITE_PATH, 'package metadata links contract and suite');
  context.assert(metadata && metadata.integrationWorkpackage === 'XTM-02', 'package metadata declares XTM-02 integration handoff');
  context.assert(packageManifest.scripts['test:maraca-css-provider'] === 'node scripts/run_xtend_tests.js maraca-css-provider', 'package exposes isolated CSS provider gate');
  context.assert(runner.includes("id: 'maraca-css-provider'"), 'test runner exposes CSS provider gate');

  return context.result({
    report: {
      schema: 'xtend.maraca.css-provider-contract-report.v1',
      status: context.failures.length === 0 ? 'accepted' : 'blocked',
      providerSchema: MARACA_CSS_PROVIDER_SCHEMA,
      lifecycle: CSS_PROVIDER_LIFECYCLE.slice(),
      referenceProviders: ['maraca-native', 'test-dummy'],
      integrationWorkpackage: 'XTM-02'
    }
  });
}

function printMaracaCssProviderContractReport(result) {
  printSuiteReport(result, {
    successTitle: 'Maraca CSS Provider contract gate passed.',
    failureTitle: 'Maraca CSS Provider contract gate failed:'
  });
}

if (require.main === module) {
  runMaracaCssProviderContractSuite().then((result) => {
    printMaracaCssProviderContractReport(result);
    if (!result.ok) process.exit(1);
  }).catch((error) => {
    console.error(error && error.stack || error);
    process.exit(1);
  });
}

module.exports = {
  printMaracaCssProviderContractReport,
  runMaracaCssProviderContractSuite
};
