const fs = require('fs');
const path = require('path');
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
  XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA
} = require('../../tools/xtensions/host-controller-contract');
const {
  evaluateXTensionSecurity
} = require('../../tools/xtensions/security-integrity-gate');
const {
  normalizeXTensionManifest
} = require('../../tools/xtensions/maraca-xtension-manifest');
const {
  VANILLA_BOUNDARIES,
  VANILLA_DOM_BOUNDARY_MODES,
  VANILLA_FRAMEWORK_DEPENDENCY_CODE,
  VANILLA_LEGACY_REQUIRES_IFRAME_CODE,
  VANILLA_MUTATION_OUTSIDE_ROOT_CODE,
  VANILLA_SANDBOX_UNSAFE_CODE,
  VANILLA_STYLE_BOUNDARY_MODES,
  VANILLA_TRUST_BOUNDARIES,
  XTENSIONS_DOM_BOUNDARY_PACKAGE_SCRIPT,
  XTENSIONS_DOM_BOUNDARY_SCHEMA,
  XTENSIONS_LEGACY_SANDBOX_PACKAGE_SCRIPT,
  XTENSIONS_LEGACY_SANDBOX_SCHEMA,
  XTENSIONS_VANILLA_ADAPTER_CONTRACT_PATH,
  XTENSIONS_VANILLA_ADAPTER_FIXTURE_PATH,
  XTENSIONS_VANILLA_ADAPTER_MODULE_PATH,
  XTENSIONS_VANILLA_ADAPTER_PACKAGE_SCRIPT,
  XTENSIONS_VANILLA_ADAPTER_SCHEMA,
  XTENSIONS_VANILLA_ADAPTER_SUITE_PATH,
  XTENSIONS_VANILLA_ADAPTER_TYPES_PATH,
  XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE,
  XTENSIONS_VANILLA_REPORT_SCHEMA,
  assertVanillaDependencyBoundary,
  createDomBoundaryRecord,
  createFrameworklessVanillaHostAdapter,
  createLegacySandboxRecord,
  createVanillaAdapterContract,
  createVanillaAdapterReport,
  inspectLegacyAssetHtml,
  normalizeVanillaIsolation,
  serializeVanillaAdapterReport
} = require('../../tools/xtensions/vanilla-host-adapter');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function createClock() {
  let tick = 0;
  return () => {
    tick += 1;
    return `2026-06-29T09:15:${String(tick).padStart(2, '0')}Z`;
  };
}

function loadCommon(rootDir) {
  return {
    packageManifest: readJson('package.json', rootDir),
    runner: readText('scripts/run_xtend_tests.js', rootDir),
    backlog: readText(BACKLOG_PATH, rootDir),
    contractDoc: readText(XTENSIONS_VANILLA_ADAPTER_CONTRACT_PATH, rootDir),
    fixture: readJson(XTENSIONS_VANILLA_ADAPTER_FIXTURE_PATH, rootDir),
    moduleText: readText(XTENSIONS_VANILLA_ADAPTER_MODULE_PATH, rootDir),
    typesText: readText(XTENSIONS_VANILLA_ADAPTER_TYPES_PATH, rootDir)
  };
}

function assertCommonFiles(context, rootDir) {
  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, XTENSIONS_VANILLA_ADAPTER_CONTRACT_PATH, rootDir, 'Vanilla XTension contract document exists');
  assertFileExists(context, XTENSIONS_VANILLA_ADAPTER_MODULE_PATH, rootDir, 'Vanilla Host Adapter module exists');
  assertFileExists(context, XTENSIONS_VANILLA_ADAPTER_TYPES_PATH, rootDir, 'Vanilla Host Adapter types exist');
  assertFileExists(context, XTENSIONS_VANILLA_ADAPTER_SUITE_PATH, rootDir, 'Vanilla Host Adapter suite exists');
  assertFileExists(context, XTENSIONS_VANILLA_ADAPTER_FIXTURE_PATH, rootDir, 'Vanilla Host Adapter fixture exists');
  const moduleSyntax = syntaxCheckFile(XTENSIONS_VANILLA_ADAPTER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_VANILLA_ADAPTER_SUITE_PATH, { rootDir, extension: '.js' });
  context.assert(moduleSyntax.ok, `Vanilla Host Adapter module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Vanilla Host Adapter suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
}

function assertPackageWiring(context, common) {
  const packageManifest = common.packageManifest;
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsVanillaHostAdapter;
  context.assert(metadata && metadata.schema === XTENSIONS_VANILLA_ADAPTER_SCHEMA, 'package metadata declares vanilla adapter schema');
  context.assert(metadata && metadata.domBoundarySchema === XTENSIONS_DOM_BOUNDARY_SCHEMA, 'package metadata declares DOM boundary schema');
  context.assert(metadata && metadata.legacySandboxSchema === XTENSIONS_LEGACY_SANDBOX_SCHEMA, 'package metadata declares legacy sandbox schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE, 'package metadata points to XTN-15');
  context.assert(metadata && metadata.module === XTENSIONS_VANILLA_ADAPTER_MODULE_PATH, 'package metadata points to vanilla adapter module');
  context.assert(metadata && metadata.types === XTENSIONS_VANILLA_ADAPTER_TYPES_PATH, 'package metadata points to vanilla adapter types');
  context.assert(metadata && metadata.fixture === XTENSIONS_VANILLA_ADAPTER_FIXTURE_PATH, 'package metadata points to vanilla adapter fixture');
  context.assert(metadata && metadata.suite === XTENSIONS_VANILLA_ADAPTER_SUITE_PATH, 'package metadata points to vanilla adapter suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-vanilla-host-controller xtensions-dom-boundary xtensions-legacy-sandbox-adapter --json', 'package metadata declares combined vanilla local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_VANILLA_ADAPTER_PACKAGE_SCRIPT, 'package metadata declares vanilla host package script');
  context.assert(metadata && metadata.domBoundaryScript === XTENSIONS_DOM_BOUNDARY_PACKAGE_SCRIPT, 'package metadata declares DOM boundary package script');
  context.assert(metadata && metadata.legacySandboxScript === XTENSIONS_LEGACY_SANDBOX_PACKAGE_SCRIPT, 'package metadata declares legacy sandbox package script');
  context.assert(metadata && metadata.sameRealmHardSecurity === false, 'package metadata does not claim same-realm hard security');
  context.assert(metadata && metadata.legacyRequiresIframe === true, 'package metadata requires iframe for legacy global DOM');

  const exportEntry = packageManifest.exports['./xtensions/vanilla-host-adapter'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/vanilla-host-adapter.js', 'package exports vanilla host adapter module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/vanilla-host-adapter.d.ts', 'package exports vanilla host adapter types');
  context.assert(packageManifest.scripts['test:xtensions-vanilla-host-controller'] === 'node scripts/run_xtend_tests.js xtensions-vanilla-host-controller', 'package exposes vanilla host test script');
  context.assert(packageManifest.scripts['test:xtensions-dom-boundary'] === 'node scripts/run_xtend_tests.js xtensions-dom-boundary', 'package exposes DOM boundary test script');
  context.assert(packageManifest.scripts['test:xtensions-legacy-sandbox-adapter'] === 'node scripts/run_xtend_tests.js xtensions-legacy-sandbox-adapter', 'package exposes legacy sandbox test script');
  context.assert(common.runner.includes("id: 'xtensions-vanilla-host-controller'"), 'runner exposes vanilla host controller suite');
  context.assert(common.runner.includes("id: 'xtensions-dom-boundary'"), 'runner exposes DOM boundary suite');
  context.assert(common.runner.includes("id: 'xtensions-legacy-sandbox-adapter'"), 'runner exposes legacy sandbox suite');
  context.assert(common.backlog.includes('| `XTN-15` | P2 | completed | WS14 |'), 'backlog marks XTN-15 completed');
  context.assert(common.backlog.includes('development/XTensions-Vanilla-Host-Adapter-und-Legacy-Sandbox-Contract.md'), 'backlog references vanilla contract');
  context.assert(common.contractDoc.includes('Contract: `xtend.xtensions.vanilla-adapter.v1`'), 'contract document declares vanilla schema');
  context.assert(common.contractDoc.includes('node scripts/run_xtend_tests.js xtensions-vanilla-host-controller xtensions-dom-boundary xtensions-legacy-sandbox-adapter --json'), 'contract document declares combined local gate');
}

function runXTensionsVanillaHostControllerSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-vanilla-host-controller',
    label: 'XTensions Vanilla Host Adapter Contract'
  });
  const common = loadCommon(rootDir);
  const fixture = common.fixture;

  assertCommonFiles(context, rootDir);
  assertPackageWiring(context, common);
  context.assert(fixture.schema === 'xtend.xtensions.vanilla-host-adapter.fixture.v1', 'fixture declares vanilla host adapter fixture schema');
  context.assert(fixture.contract === XTENSIONS_VANILLA_ADAPTER_SCHEMA, 'fixture points to vanilla adapter contract');
  context.assert(fixture.expectedFramework === 'vanilla', 'fixture names vanilla framework');

  const dependencyBoundary = assertVanillaDependencyBoundary({
    packageManifest: common.packageManifest,
    sourceText: `${common.moduleText}\n${common.typesText}`
  });
  context.assert(dependencyBoundary.ok, `vanilla adapter module and types avoid framework dependencies${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badDependencyBoundary = assertVanillaDependencyBoundary({
    sourceText: "import React from 'react'; document.body.innerHTML = '';"
  });
  context.assert(badDependencyBoundary.diagnostics.some((diagnostic) => diagnostic.code === VANILLA_FRAMEWORK_DEPENDENCY_CODE), 'vanilla dependency guard rejects framework imports');
  context.assert(badDependencyBoundary.diagnostics.some((diagnostic) => diagnostic.code === VANILLA_MUTATION_OUTSIDE_ROOT_CODE), 'vanilla dependency guard rejects same-realm global DOM writes');

  const contract = createVanillaAdapterContract();
  context.assert(contract.schema === XTENSIONS_VANILLA_ADAPTER_SCHEMA, 'contract factory exposes vanilla adapter schema');
  context.assert(contract.framework === 'vanilla', 'contract factory is framework-neutral vanilla');
  context.assert(contract.hostNeutral === true, 'contract factory stays host-neutral');
  context.assert(contract.sameRealmHardSecurity === false, 'contract factory does not overclaim same-realm hard security');
  context.assert(contract.legacyRequiresIframe === true, 'contract factory requires iframe sandbox for legacy global DOM');
  assertIncludesAll(context, contract.requiredMethods, ['mount', 'update', 'suspend', 'resume', 'reportError', 'unmount'], 'contract factory names required HostController methods');
  assertIncludesAll(context, contract.domBoundaries, VANILLA_DOM_BOUNDARY_MODES, 'contract factory names DOM boundaries');
  assertIncludesAll(context, contract.styleBoundaries, VANILLA_STYLE_BOUNDARY_MODES, 'contract factory names style boundaries');
  assertIncludesAll(context, contract.trustBoundaries, VANILLA_TRUST_BOUNDARIES, 'contract factory names trust boundaries');
  assertIncludesAll(context, VANILLA_BOUNDARIES, ['same-realm-is-not-hard-security', 'legacy-global-dom-requires-iframe-sandbox'], 'contract boundaries include security distinctions');

  const adapter = createFrameworklessVanillaHostAdapter({
    id: fixture.expectedXtensionId,
    surfaceId: 'surface.vanilla.host',
    clock: createClock()
  });
  const mountResult = adapter.mount({ id: 'vanilla-slot' }, { seed: 'seed-a' }, { isolation: fixture.cooperative.isolation });
  const updateResult = adapter.update({ props: { seed: 'seed-b' }, reason: 'demo-reseed' });
  const suspendResult = adapter.suspend('visibility-hidden');
  const resumeResult = adapter.resume('visibility-visible');
  const errorResult = adapter.reportError(new Error('synthetic vanilla adapter error'), { recoverable: true });
  const unmountResult = adapter.unmount('suite-complete');
  const snapshot = adapter.snapshot();

  context.assert(mountResult.schema === XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA && mountResult.ok === true, 'frameworkless vanilla adapter mounts cooperative widget');
  context.assert(updateResult.ok === true && updateResult.lifecycleRecord.event === 'surface:updated', 'frameworkless vanilla adapter updates through HostController');
  context.assert(suspendResult.ok === true && suspendResult.lifecycleRecord.event === 'surface:suspended', 'frameworkless vanilla adapter suspends');
  context.assert(resumeResult.ok === true && resumeResult.lifecycleRecord.event === 'surface:resumed', 'frameworkless vanilla adapter resumes');
  context.assert(errorResult.status === 'degraded' && errorResult.lifecycleRecord.event === 'surface:error', 'frameworkless vanilla adapter reports degraded errors');
  context.assert(unmountResult.ok === true && unmountResult.cleanupRecords.length === 3, 'frameworkless vanilla adapter unmounts and releases boundary resources');
  context.assert(snapshot.state.destroyed === true && snapshot.lifecycleCount >= 6, 'frameworkless vanilla adapter snapshot records lifecycle');

  const blockedAdapter = createFrameworklessVanillaHostAdapter({
    id: 'xtension.vanilla.blocked',
    surfaceId: 'surface.vanilla.blocked',
    clock: createClock()
  });
  const blockedMount = blockedAdapter.mount({ id: 'blocked-slot' }, {}, { isolation: fixture.unsafeLegacy.isolation });
  context.assert(blockedMount.status === 'policy-blocked' && blockedMount.ok === false, 'frameworkless vanilla adapter policy-blocks same-realm legacy global DOM');

  return context.result({
    schema: XTENSIONS_VANILLA_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_VANILLA_ADAPTER_SCHEMA,
    workpackage: XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE,
    module: XTENSIONS_VANILLA_ADAPTER_MODULE_PATH,
    suite: XTENSIONS_VANILLA_ADAPTER_SUITE_PATH,
    fixture: XTENSIONS_VANILLA_ADAPTER_FIXTURE_PATH,
    lifecycleRecordCount: snapshot.lifecycleCount
  });
}

function runXTensionsDomBoundarySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-dom-boundary',
    label: 'XTensions DOM Boundary Contract'
  });
  const common = loadCommon(rootDir);
  const fixture = common.fixture;

  assertCommonFiles(context, rootDir);
  assertPackageWiring(context, common);

  const cooperativeIsolation = normalizeVanillaIsolation(fixture.cooperative.isolation);
  context.assert(cooperativeIsolation.schema === XTENSIONS_DOM_BOUNDARY_SCHEMA, 'cooperative isolation normalizes with DOM boundary schema');
  context.assert(cooperativeIsolation.ok === true, 'cooperative shadow-root isolation is accepted');
  context.assert(cooperativeIsolation.domBoundary === 'shadow-root', 'cooperative isolation keeps shadow-root DOM boundary');
  context.assert(cooperativeIsolation.trustBoundary === 'same-origin-adapter', 'cooperative isolation keeps same-origin adapter trust');
  context.assert(cooperativeIsolation.hardSecurity === false && cooperativeIsolation.sameRealmHardSecurity === false, 'cooperative isolation does not claim hard security');

  const cooperativeRecord = createDomBoundaryRecord(fixture.cooperative, { clock: createClock() });
  context.assert(cooperativeRecord.ok === true && cooperativeRecord.xtensionId === fixture.cooperative.xtensionId, 'DOM boundary record preserves cooperative identity');
  context.assert(cooperativeRecord.styleBoundary === 'shadow-root', 'DOM boundary record preserves shadow-root style boundary');

  const unsafeLegacyRecord = createDomBoundaryRecord(fixture.unsafeLegacy, { clock: createClock() });
  context.assert(unsafeLegacyRecord.ok === false, 'DOM boundary record blocks legacy global DOM in shadow-root');
  context.assert(unsafeLegacyRecord.diagnostics.some((diagnostic) => diagnostic.code === VANILLA_LEGACY_REQUIRES_IFRAME_CODE), 'legacy same-realm block emits iframe-required diagnostic');

  const unsupportedIsolation = normalizeVanillaIsolation({
    runtimeClass: 'vanilla',
    domBoundary: 'document',
    styleBoundary: 'global'
  });
  context.assert(unsupportedIsolation.ok === false, 'unsupported DOM/style boundary is rejected');
  context.assert(unsupportedIsolation.diagnostics.length >= 2, 'unsupported boundary emits diagnostics');

  const report = createVanillaAdapterReport({
    cooperative: fixture.cooperative,
    legacy: fixture.legacy,
    dependencyBoundary: {
      sourceText: common.moduleText
    },
    legacyHtml: fixture.legacyHtml
  }, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_VANILLA_REPORT_SCHEMA, 'vanilla adapter report emits schema');
  context.assert(report.cooperativeBoundary.ok === true, 'report contains accepted cooperative boundary');
  context.assert(report.legacySandbox.ok === true, 'report contains accepted legacy sandbox');
  context.assert(report.legacyHtmlInspection.iframeSandboxRequired === true, 'report records iframe requirement for legacy HTML');
  context.assert(serializeVanillaAdapterReport(report).includes('"domBoundarySchema"'), 'vanilla report serializes with boundary schema');

  return context.result({
    schema: XTENSIONS_VANILLA_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_VANILLA_ADAPTER_SCHEMA,
    domBoundarySchema: XTENSIONS_DOM_BOUNDARY_SCHEMA,
    workpackage: XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE,
    module: XTENSIONS_VANILLA_ADAPTER_MODULE_PATH,
    suite: XTENSIONS_VANILLA_ADAPTER_SUITE_PATH,
    boundaryModeCount: VANILLA_DOM_BOUNDARY_MODES.length
  });
}

function runXTensionsLegacySandboxAdapterSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-legacy-sandbox-adapter',
    label: 'XTensions Legacy Sandbox Adapter Contract'
  });
  const common = loadCommon(rootDir);
  const fixture = common.fixture;

  assertCommonFiles(context, rootDir);
  assertPackageWiring(context, common);

  const sandboxRecord = createLegacySandboxRecord(fixture.legacy, { clock: createClock() });
  context.assert(sandboxRecord.schema === XTENSIONS_LEGACY_SANDBOX_SCHEMA, 'legacy sandbox record emits schema');
  context.assert(sandboxRecord.ok === true, 'legacy sandbox with allow-scripts only is accepted');
  context.assert(sandboxRecord.iframeAttributes.sandbox === 'allow-scripts', 'legacy sandbox declares allow-scripts only');
  context.assert(sandboxRecord.allowSameOrigin === false, 'legacy sandbox forbids allow-same-origin');
  context.assert(sandboxRecord.topNavigation === false && sandboxRecord.popupNavigation === false, 'legacy sandbox forbids navigation escape');
  context.assert(sandboxRecord.postMessageOnly === true, 'legacy sandbox communicates by postMessage only');

  const unsafeSandboxRecord = createLegacySandboxRecord({
    sandbox: ['allow-scripts', 'allow-same-origin']
  }, { clock: createClock() });
  context.assert(unsafeSandboxRecord.ok === false, 'legacy sandbox rejects allow-same-origin');
  context.assert(unsafeSandboxRecord.diagnostics.some((diagnostic) => diagnostic.code === VANILLA_SANDBOX_UNSAFE_CODE), 'unsafe sandbox emits sandbox diagnostic');

  const legacyHtmlInspection = inspectLegacyAssetHtml(fixture.legacyHtml);
  context.assert(legacyHtmlInspection.ok === false, 'raw legacy HTML requires sanitization');
  context.assert(legacyHtmlInspection.remoteAssetCount >= 1, 'legacy HTML inspector detects remote assets');
  context.assert(legacyHtmlInspection.scriptUrlCount >= 1, 'legacy HTML inspector detects javascript: links');
  context.assert(legacyHtmlInspection.embedCount >= 1, 'legacy HTML inspector detects embed tags');
  context.assert(legacyHtmlInspection.globalDomUsageCount >= 1, 'legacy HTML inspector detects global DOM usage');
  context.assert(legacyHtmlInspection.sameRealmEligible === false, 'legacy HTML is not same-realm eligible');

  const manifest = normalizeXTensionManifest(fixture.legacyManifest, { clock: createClock() });
  context.assert(manifest.ok === true, 'Maraca manifest accepts legacy-local-artifact with sandbox isolation');
  context.assert(manifest.isolation.domBoundary === 'iframe-sandbox', 'Maraca manifest preserves iframe sandbox isolation');
  context.assert(manifest.dependencies.legacyLocalArtifactCount === 1, 'Maraca manifest counts legacy local artifact');
  context.assert(manifest.dependencies.dependencies[0].allowed === true, 'Maraca manifest allows local legacy artifact behind sandbox');

  const securityReport = evaluateXTensionSecurity(fixture.legacyManifest, { clock: createClock() });
  context.assert(securityReport.ok === true, 'security gate accepts local legacy artifact behind sandbox');
  context.assert(securityReport.dependencies[0].classification === 'legacy-local-artifact', 'security gate preserves legacy local artifact classification');

  const unsafeManifest = JSON.parse(JSON.stringify(fixture.legacyManifest));
  unsafeManifest.isolation = fixture.unsafeLegacy.isolation;
  const unsafeSecurityReport = evaluateXTensionSecurity(unsafeManifest, { clock: createClock() });
  context.assert(unsafeSecurityReport.ok === false, 'security gate blocks legacy artifact without iframe sandbox');
  context.assert(unsafeSecurityReport.diagnostics.some((diagnostic) => diagnostic.code === 'xtensions.security.dependency_classification_invalid'), 'security gate emits dependency classification diagnostic for unsafe legacy isolation');

  return context.result({
    schema: XTENSIONS_VANILLA_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_VANILLA_ADAPTER_SCHEMA,
    legacySandboxSchema: XTENSIONS_LEGACY_SANDBOX_SCHEMA,
    workpackage: XTENSIONS_VANILLA_ADAPTER_WORKPACKAGE,
    module: XTENSIONS_VANILLA_ADAPTER_MODULE_PATH,
    suite: XTENSIONS_VANILLA_ADAPTER_SUITE_PATH,
    rawLegacyDiagnosticCount: legacyHtmlInspection.diagnostics.length
  });
}

function printXTensionsVanillaHostControllerReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Vanilla Host Adapter Contract erfolgreich.',
    failureTitle: 'XTensions Vanilla Host Adapter Contract fehlgeschlagen:'
  });
}

function printXTensionsDomBoundaryReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions DOM Boundary Contract erfolgreich.',
    failureTitle: 'XTensions DOM Boundary Contract fehlgeschlagen:'
  });
}

function printXTensionsLegacySandboxAdapterReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Legacy Sandbox Adapter Contract erfolgreich.',
    failureTitle: 'XTensions Legacy Sandbox Adapter Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsDomBoundaryReport,
  printXTensionsLegacySandboxAdapterReport,
  printXTensionsVanillaHostControllerReport,
  runXTensionsDomBoundarySuite,
  runXTensionsLegacySandboxAdapterSuite,
  runXTensionsVanillaHostControllerSuite
};
