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
  XTENSIONS_HOST_CONTROLLER_SCHEMA
} = require('../../tools/xtensions/host-controller-contract');
const {
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA
} = require('../../tools/xtensions/signal-bridge-contract');
const {
  createMaracaXTensionBuildPlan
} = require('../../tools/xtensions/maraca-xtension-manifest');
const {
  STATIC_CONTRACT_ACCEPTS_MISSING_CODE,
  STATIC_CONTRACT_CAPABILITY_MISSING_CODE,
  STATIC_CONTRACT_DRIFT_DETECTED_CODE,
  STATIC_CONTRACT_EMITS_MISSING_CODE,
  STATIC_CONTRACT_EXPORT_MISSING_CODE,
  STATIC_CONTRACT_FRAMEWORK_DEPENDENCY_CODE,
  XTENSION_CONTRACT_EXPORT_NAME,
  XTENSIONS_STATIC_AI_AGENT_REPORT_SCHEMA,
  XTENSIONS_STATIC_CONTRACT_DRIFT_SCHEMA,
  XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA,
  XTENSIONS_STATIC_CONTRACT_SCHEMA,
  XTENSIONS_STATIC_DEVTOOLS_PANEL_SCHEMA,
  XTENSIONS_STATIC_INTROSPECTION_CONTRACT_PATH,
  XTENSIONS_STATIC_INTROSPECTION_DRIFT_FIXTURE_PATH,
  XTENSIONS_STATIC_INTROSPECTION_FIXTURE_PATH,
  XTENSIONS_STATIC_INTROSPECTION_MODULE_PATH,
  XTENSIONS_STATIC_INTROSPECTION_NO_EXPORT_FIXTURE_PATH,
  XTENSIONS_STATIC_INTROSPECTION_PACKAGE_SCRIPT,
  XTENSIONS_STATIC_INTROSPECTION_REPORT_SCHEMA,
  XTENSIONS_STATIC_INTROSPECTION_SCHEMA,
  XTENSIONS_STATIC_INTROSPECTION_SOURCE_FIXTURE_PATH,
  XTENSIONS_STATIC_INTROSPECTION_SUITE_PATH,
  XTENSIONS_STATIC_INTROSPECTION_TYPES_PATH,
  XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE,
  XTENSIONS_STATIC_LSP_INDEX_SCHEMA,
  assertStaticIntrospectionDependencyBoundary,
  createContractDriftReport,
  createXTensionsAiAgentReport,
  createXTensionsDevToolsPanel,
  createXTensionsLspIndex,
  createXTensionsStaticContractIndex,
  createXTensionsStaticIntrospectionReport,
  extractXTensionContractFromSource,
  serializeStaticIntrospectionReport
} = require('../../tools/xtensions/static-contract-introspection');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';
const ARCHITECTURE_CONTRACT_PATH = 'development/XTensions-Architecture-and-Threat-Model-Contract.md';
const HOST_CONTROLLER_CONTRACT_PATH = 'development/XTensions-HostController-Lifecycle-Contract.md';
const SIGNAL_BRIDGE_CONTRACT_PATH = 'development/XTensions-Signal-Bridge-and-Event-Governance-Contract.md';
const MARACA_CONTRACT_PATH = 'development/XTensions-Maraca-Manifest-and-Build-Provenance-Contract.md';

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
    return `2026-06-20T03:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function diagnosticCodes(report) {
  return (report.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function runXTensionsStaticIntrospectionSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-static-introspection',
    label: 'XTensions Static Contract Introspection Contract'
  });

  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsStaticIntrospection;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const hostControllerContract = readText(HOST_CONTROLLER_CONTRACT_PATH, rootDir);
  const signalBridgeContract = readText(SIGNAL_BRIDGE_CONTRACT_PATH, rootDir);
  const maracaContract = readText(MARACA_CONTRACT_PATH, rootDir);
  const staticContract = readText(XTENSIONS_STATIC_INTROSPECTION_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_STATIC_INTROSPECTION_FIXTURE_PATH, rootDir);
  const maracaFixture = readJson(fixture.maracaManifestFixture, rootDir);
  const sourceText = readText(XTENSIONS_STATIC_INTROSPECTION_SOURCE_FIXTURE_PATH, rootDir);
  const driftSourceText = readText(XTENSIONS_STATIC_INTROSPECTION_DRIFT_FIXTURE_PATH, rootDir);
  const noExportSourceText = readText(XTENSIONS_STATIC_INTROSPECTION_NO_EXPORT_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_STATIC_INTROSPECTION_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_STATIC_INTROSPECTION_TYPES_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_STATIC_INTROSPECTION_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_STATIC_INTROSPECTION_SUITE_PATH, { rootDir, extension: '.js' });
  const sourceSyntax = syntaxCheckFile(XTENSIONS_STATIC_INTROSPECTION_SOURCE_FIXTURE_PATH, { rootDir, extension: '.mjs' });
  const driftSyntax = syntaxCheckFile(XTENSIONS_STATIC_INTROSPECTION_DRIFT_FIXTURE_PATH, { rootDir, extension: '.mjs' });
  const noExportSyntax = syntaxCheckFile(XTENSIONS_STATIC_INTROSPECTION_NO_EXPORT_FIXTURE_PATH, { rootDir, extension: '.mjs' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, HOST_CONTROLLER_CONTRACT_PATH, rootDir, 'XTensions HostController contract exists');
  assertFileExists(context, SIGNAL_BRIDGE_CONTRACT_PATH, rootDir, 'XTensions Signal Bridge contract exists');
  assertFileExists(context, MARACA_CONTRACT_PATH, rootDir, 'XTensions Maraca contract exists');
  assertFileExists(context, XTENSIONS_STATIC_INTROSPECTION_CONTRACT_PATH, rootDir, 'XTensions static introspection contract exists');
  assertFileExists(context, XTENSIONS_STATIC_INTROSPECTION_MODULE_PATH, rootDir, 'XTensions static introspection module exists');
  assertFileExists(context, XTENSIONS_STATIC_INTROSPECTION_TYPES_PATH, rootDir, 'XTensions static introspection types exist');
  assertFileExists(context, XTENSIONS_STATIC_INTROSPECTION_SUITE_PATH, rootDir, 'XTensions static introspection suite exists');
  assertFileExists(context, XTENSIONS_STATIC_INTROSPECTION_FIXTURE_PATH, rootDir, 'XTensions static introspection fixture exists');
  assertFileExists(context, XTENSIONS_STATIC_INTROSPECTION_SOURCE_FIXTURE_PATH, rootDir, 'XTENSION_CONTRACT source fixture exists');
  assertFileExists(context, XTENSIONS_STATIC_INTROSPECTION_DRIFT_FIXTURE_PATH, rootDir, 'XTENSION_CONTRACT drift fixture exists');
  assertFileExists(context, XTENSIONS_STATIC_INTROSPECTION_NO_EXPORT_FIXTURE_PATH, rootDir, 'no-export source fixture exists');
  context.assert(moduleSyntax.ok, `XTensions static introspection module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions static introspection suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(sourceSyntax.ok, `XTENSION_CONTRACT source fixture syntax passes${sourceSyntax.ok ? '' : ` (${sourceSyntax.message})`}`);
  context.assert(driftSyntax.ok, `XTENSION_CONTRACT drift fixture syntax passes${driftSyntax.ok ? '' : ` (${driftSyntax.message})`}`);
  context.assert(noExportSyntax.ok, `no-export source fixture syntax passes${noExportSyntax.ok ? '' : ` (${noExportSyntax.message})`}`);

  context.assert(metadata && metadata.schema === XTENSIONS_STATIC_INTROSPECTION_SCHEMA, 'package metadata declares static introspection schema');
  context.assert(metadata && metadata.staticContractSchema === XTENSIONS_STATIC_CONTRACT_SCHEMA, 'package metadata declares static contract schema');
  context.assert(metadata && metadata.indexSchema === XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA, 'package metadata declares static contract index schema');
  context.assert(metadata && metadata.lspIndexSchema === XTENSIONS_STATIC_LSP_INDEX_SCHEMA, 'package metadata declares LSP index schema');
  context.assert(metadata && metadata.devtoolsPanelSchema === XTENSIONS_STATIC_DEVTOOLS_PANEL_SCHEMA, 'package metadata declares DevTools panel schema');
  context.assert(metadata && metadata.aiAgentReportSchema === XTENSIONS_STATIC_AI_AGENT_REPORT_SCHEMA, 'package metadata declares AI-Agent report schema');
  context.assert(metadata && metadata.driftReportSchema === XTENSIONS_STATIC_CONTRACT_DRIFT_SCHEMA, 'package metadata declares drift report schema');
  context.assert(metadata && metadata.reportSchema === XTENSIONS_STATIC_INTROSPECTION_REPORT_SCHEMA, 'package metadata declares static introspection report schema');
  context.assert(metadata && metadata.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'package metadata links HostController schema');
  context.assert(metadata && metadata.signalBridgeSchema === XTENSIONS_SIGNAL_BRIDGE_SCHEMA, 'package metadata links Signal Bridge schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE, 'package metadata points to XTN-04');
  context.assert(metadata && metadata.module === XTENSIONS_STATIC_INTROSPECTION_MODULE_PATH, 'package metadata points to static introspection module');
  context.assert(metadata && metadata.types === XTENSIONS_STATIC_INTROSPECTION_TYPES_PATH, 'package metadata points to static introspection types');
  context.assert(metadata && metadata.fixture === XTENSIONS_STATIC_INTROSPECTION_FIXTURE_PATH, 'package metadata points to static introspection fixture');
  context.assert(metadata && metadata.sourceFixture === XTENSIONS_STATIC_INTROSPECTION_SOURCE_FIXTURE_PATH, 'package metadata points to source fixture');
  context.assert(metadata && metadata.driftFixture === XTENSIONS_STATIC_INTROSPECTION_DRIFT_FIXTURE_PATH, 'package metadata points to drift fixture');
  context.assert(metadata && metadata.noExportFixture === XTENSIONS_STATIC_INTROSPECTION_NO_EXPORT_FIXTURE_PATH, 'package metadata points to no-export fixture');
  context.assert(metadata && metadata.contract === XTENSIONS_STATIC_INTROSPECTION_CONTRACT_PATH, 'package metadata points to static introspection contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-static-introspection --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_STATIC_INTROSPECTION_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(metadata && metadata.runtimeExecutionRequired === false, 'package metadata forbids runtime execution');
  context.assert(metadata && metadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');

  const exportEntry = packageManifest.exports['./xtensions/static-introspection-contract'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/static-contract-introspection.js', 'package exports static introspection module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/static-contract-introspection.d.ts', 'package exports static introspection types');
  context.assert(packageManifest.scripts['test:xtensions-static-introspection'] === 'node scripts/run_xtend_tests.js xtensions-static-introspection', 'package exposes static introspection script');
  context.assert(runner.includes("id: 'xtensions-static-introspection'"), 'test runner exposes xtensions-static-introspection suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js xtensions-static-introspection'), 'runner help references static introspection gate');

  context.assert(backlog.includes('| `XTN-04` | P1 | completed | WS4 |'), 'backlog marks XTN-04 completed');
  context.assert(backlog.includes('development/XTensions-Static-Contract-Introspection-Contract.md'), 'backlog references static introspection contract');
  context.assert(architectureContract.includes('frameworkless Contract Stubs'), 'architecture contract keeps frameworkless test boundary');
  context.assert(hostControllerContract.includes('createXTensionHostControllerContract()'), 'HostController contract remains linked');
  context.assert(signalBridgeContract.includes('createSignalBridgeReport()'), 'Signal Bridge contract remains linked');
  context.assert(maracaContract.includes('createMaracaXTensionsBundleReport()'), 'Maraca contract remains linked');
  context.assert(staticContract.includes('XTENSION_CONTRACT'), 'static introspection contract documents static export');
  context.assert(staticContract.includes('kein `import()`'), 'static introspection contract bans runtime imports');
  context.assert(staticContract.includes('node scripts/run_xtend_tests.js xtensions-static-introspection --json'), 'static introspection contract declares local gate');

  context.assert(fixture.schema === 'xtend.xtensions.static-introspection.fixture.v1', 'fixture declares static introspection fixture schema');
  context.assert(fixture.expectedExport === XTENSION_CONTRACT_EXPORT_NAME, 'fixture names expected static export');
  assertIncludesAll(context, fixture.expectedAccepts, ['props.update', 'state.patch', 'command.dispatch'], 'fixture names expected accepts');
  assertIncludesAll(context, fixture.expectedEmits, ['xtension.react.todo.submitted.v1', 'xtension.react.todo.changed.v1'], 'fixture names expected emits');
  assertIncludesAll(context, fixture.expectedCapabilities, ['host.lifecycle.mount', 'host.lifecycle.unmount', 'signal.downstream', 'event.upstream'], 'fixture names expected capabilities');

  const dependencyBoundary = assertStaticIntrospectionDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${sourceText}`
  });
  context.assert(dependencyBoundary.ok, `static introspection sources avoid real framework imports${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badDependencyBoundary = assertStaticIntrospectionDependencyBoundary({
    sourceText: "import React from 'react';"
  });
  context.assert(
    badDependencyBoundary.diagnostics.some((diagnostic) => diagnostic.code === STATIC_CONTRACT_FRAMEWORK_DEPENDENCY_CODE),
    'static introspection dependency guard rejects framework imports'
  );

  const extracted = extractXTensionContractFromSource(sourceText, {
    sourcePath: XTENSIONS_STATIC_INTROSPECTION_SOURCE_FIXTURE_PATH
  });
  context.assert(extracted.ok === true && extracted.contract.schema === XTENSIONS_STATIC_CONTRACT_SCHEMA, 'static extractor reads XTENSION_CONTRACT without execution');
  context.assert(extracted.runtimeExecutionRequired === false, 'static extractor reports no runtime execution');
  context.assert(extracted.contract.id === fixture.expectedXtensionId, 'static extractor keeps xtension id');
  context.assert(extracted.contract.framework === fixture.expectedFramework, 'static extractor keeps framework');
  assertIncludesAll(context, extracted.contract.accepts, fixture.expectedAccepts, 'static extractor keeps accepts');
  assertIncludesAll(context, extracted.contract.emits, fixture.expectedEmits, 'static extractor keeps emits');
  assertIncludesAll(context, extracted.contract.capabilities, fixture.expectedCapabilities, 'static extractor keeps capabilities');
  context.assert(typeof extracted.contract.contractFingerprint === 'string' && extracted.contract.contractFingerprint.startsWith('sha256:'), 'static extractor emits contract fingerprint');

  const maracaPlan = createMaracaXTensionBuildPlan(maracaFixture, { clock: createClock() });
  const maracaArtifactContract = maracaPlan.artifacts[0];
  const index = createXTensionsStaticContractIndex({
    sourceModules: [
      {
        path: XTENSIONS_STATIC_INTROSPECTION_SOURCE_FIXTURE_PATH,
        text: sourceText
      }
    ],
    artifacts: [maracaArtifactContract]
  }, { clock: createClock() });
  context.assert(index.schema === XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA, 'static contract index emits index schema');
  context.assert(index.ok === true && index.status === 'ready', 'static contract index is ready');
  context.assert(index.runtimeExecutionRequired === false, 'static contract index needs no runtime execution');
  context.assert(index.contractCount === 1, 'static contract index de-duplicates source and artifact contracts by id');
  context.assert(index.indexes.byFramework.react.includes(fixture.expectedXtensionId), 'static contract index maps framework');
  context.assert(index.indexes.accepts['props.update'].includes(fixture.expectedXtensionId), 'static contract index maps accepts');
  context.assert(index.indexes.emits['xtension.react.todo.submitted.v1'].includes(fixture.expectedXtensionId), 'static contract index maps emits');
  context.assert(index.indexes.capabilities['host.lifecycle.mount'].includes(fixture.expectedXtensionId), 'static contract index maps capabilities');

  const lspIndex = createXTensionsLspIndex(index);
  context.assert(lspIndex.schema === XTENSIONS_STATIC_LSP_INDEX_SCHEMA, 'LSP index emits schema');
  context.assert(lspIndex.runtimeExecutionRequired === false, 'LSP index needs no runtime execution');
  context.assert(lspIndex.completions.some((item) => item.label === 'props.update'), 'LSP index exposes accepts completion');
  context.assert(lspIndex.completions.some((item) => item.label === 'xtension.react.todo.submitted.v1'), 'LSP index exposes emits completion');
  context.assert(lspIndex.symbols.some((symbol) => symbol.name === fixture.expectedXtensionId), 'LSP index exposes contract symbol');

  const devtoolsPanel = createXTensionsDevToolsPanel(index);
  context.assert(devtoolsPanel.schema === XTENSIONS_STATIC_DEVTOOLS_PANEL_SCHEMA, 'DevTools panel emits schema');
  context.assert(devtoolsPanel.runtimeExecutionRequired === false, 'DevTools panel needs no runtime execution');
  context.assert(devtoolsPanel.summary.frameworks.includes('react'), 'DevTools panel summarizes framework');
  context.assert(devtoolsPanel.rows.some((row) => row.xtensionId === fixture.expectedXtensionId && row.acceptsCount === 3), 'DevTools panel exposes row metrics');

  const driftExtracted = extractXTensionContractFromSource(driftSourceText, {
    sourcePath: XTENSIONS_STATIC_INTROSPECTION_DRIFT_FIXTURE_PATH
  });
  context.assert(driftExtracted.ok === false, 'drift fixture with missing emits/capabilities blocks static extraction');
  const driftCodes = diagnosticCodes(driftExtracted);
  context.assert(driftCodes.includes(STATIC_CONTRACT_EMITS_MISSING_CODE), 'missing emits diagnostic is emitted');
  context.assert(driftCodes.includes(STATIC_CONTRACT_CAPABILITY_MISSING_CODE), 'missing capabilities diagnostic is emitted');

  const driftReport = createContractDriftReport(extracted.contract, driftExtracted.contract || {});
  context.assert(driftReport.schema === XTENSIONS_STATIC_CONTRACT_DRIFT_SCHEMA, 'drift report emits schema');
  context.assert(driftReport.ok === false, 'drift report blocks mismatched source/build contracts');
  context.assert(driftReport.diagnostics.some((diagnostic) => diagnostic.code === STATIC_CONTRACT_DRIFT_DETECTED_CODE), 'drift report emits drift diagnostic');

  const noExport = extractXTensionContractFromSource(noExportSourceText, {
    sourcePath: XTENSIONS_STATIC_INTROSPECTION_NO_EXPORT_FIXTURE_PATH
  });
  context.assert(noExport.ok === false, 'missing XTENSION_CONTRACT blocks source extraction');
  context.assert(diagnosticCodes(noExport).includes(STATIC_CONTRACT_EXPORT_MISSING_CODE), 'missing static export diagnostic is emitted');

  const aiAgentReport = createXTensionsAiAgentReport({
    index,
    driftPairs: [
      {
        left: extracted.contract,
        right: driftExtracted.contract || {}
      }
    ]
  }, { clock: createClock() });
  context.assert(aiAgentReport.schema === XTENSIONS_STATIC_AI_AGENT_REPORT_SCHEMA, 'AI-Agent report emits schema');
  context.assert(aiAgentReport.status === 'repair-required', 'AI-Agent report marks drift as repair-required');
  context.assert(aiAgentReport.repairActions.some((action) => action.diagnosticCode === STATIC_CONTRACT_DRIFT_DETECTED_CODE), 'AI-Agent report includes drift repair action');
  context.assert(aiAgentReport.guidance.some((entry) => entry.includes(XTENSION_CONTRACT_EXPORT_NAME)), 'AI-Agent report guides static export repair');

  const fullReport = createXTensionsStaticIntrospectionReport({
    sourceModules: [
      {
        path: XTENSIONS_STATIC_INTROSPECTION_SOURCE_FIXTURE_PATH,
        text: sourceText
      }
    ],
    artifacts: [maracaArtifactContract]
  }, { clock: createClock() });
  context.assert(fullReport.schema === XTENSIONS_STATIC_INTROSPECTION_REPORT_SCHEMA, 'full static introspection report emits schema');
  context.assert(fullReport.ok === true && fullReport.status === 'ready', 'full static introspection report is ready');
  context.assert(fullReport.runtimeExecutionRequired === false, 'full static introspection report needs no runtime execution');
  context.assert(fullReport.lspIndex.schema === XTENSIONS_STATIC_LSP_INDEX_SCHEMA, 'full report embeds LSP index');
  context.assert(fullReport.devtoolsPanel.schema === XTENSIONS_STATIC_DEVTOOLS_PANEL_SCHEMA, 'full report embeds DevTools panel');
  context.assert(fullReport.aiAgentReport.schema === XTENSIONS_STATIC_AI_AGENT_REPORT_SCHEMA, 'full report embeds AI-Agent report');

  const missingAcceptsReport = createXTensionsStaticIntrospectionReport({
    contracts: [
      {
        schema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
        id: 'xtension.empty',
        framework: 'custom',
        emits: ['xtension.empty.event.v1'],
        capabilities: ['host.lifecycle.mount']
      }
    ]
  }, { clock: createClock() });
  context.assert(missingAcceptsReport.ok === false, 'missing accepts blocks full report');
  context.assert(diagnosticCodes(missingAcceptsReport).includes(STATIC_CONTRACT_ACCEPTS_MISSING_CODE), 'missing accepts diagnostic is emitted');

  const serialized = serializeStaticIntrospectionReport(fullReport);
  const repeat = serializeStaticIntrospectionReport(createXTensionsStaticIntrospectionReport({
    sourceModules: [
      {
        path: XTENSIONS_STATIC_INTROSPECTION_SOURCE_FIXTURE_PATH,
        text: sourceText
      }
    ],
    artifacts: [maracaArtifactContract]
  }, { clock: createClock() }));
  context.assert(serialized === repeat, 'static introspection report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_STATIC_INTROSPECTION_REPORT_SCHEMA, 'serialized static introspection report is parseable JSON');

  return context.result({
    schema: XTENSIONS_STATIC_INTROSPECTION_REPORT_SCHEMA,
    staticContractSchema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
    workpackage: XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE,
    module: XTENSIONS_STATIC_INTROSPECTION_MODULE_PATH,
    suite: XTENSIONS_STATIC_INTROSPECTION_SUITE_PATH,
    fixture: XTENSIONS_STATIC_INTROSPECTION_FIXTURE_PATH,
    contractCount: index.contractCount,
    completionCount: lspIndex.completionCount,
    repairActionCount: aiAgentReport.repairActionCount
  });
}

function printXTensionsStaticIntrospectionReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Static Contract Introspection Contract erfolgreich.',
    failureTitle: 'XTensions Static Contract Introspection Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsStaticIntrospectionReport,
  runXTensionsStaticIntrospectionSuite
};
