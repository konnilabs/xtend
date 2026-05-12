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
  REMOTE_FALLBACK_MISSING_CODE,
  REMOTE_OWNER_MISSING_CODE,
  RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
  RMT_VNEXT_REMOTE_SURFACE_SCHEMA
} = require('../../tools/rmt-language/vnext-remote-manifest');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA
} = require('../../tools/rmt-language/vnext-enterprise-registry');
const {
  RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA
} = require('../../tools/rmt-language/vnext-cross-surface-events');
const {
  RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA
} = require('../../tools/rmt-language/vnext-event-governance');
const {
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA
} = require('../../tools/rmt-language/vnext-degradation');
const {
  RMT_VNEXT_REMOTE_COMPILER_SCHEMA
} = require('../../tools/rmt-language/vnext-remote-compiler');
const {
  createRmtSnippetCatalog,
  createVsCodeSnippetDocument
} = require('../../tools/rmt-language/snippets');
const {
  RMT_VNEXT_CORE_SCHEMA
} = require('../../tools/rmt-language/vnext-compiler');
const {
  isLikelyRmtVNextSource
} = require('../../tools/rmt-language/vnext-tooling');
const {
  REMOTE_SNIPPETS,
  REMOTE_TOOLING_EVENT_DIRECTION_MISSING_CODE,
  REMOTE_TOOLING_PAYLOAD_SHAPE_MISSING_CODE,
  REMOTE_TOOLING_RULES,
  RMT_VNEXT_REMOTE_AGENT_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_TOOLING_CONTRACT_PATH,
  RMT_VNEXT_REMOTE_TOOLING_MODULE_PATH,
  RMT_VNEXT_REMOTE_TOOLING_PACKAGE_SCRIPT,
  RMT_VNEXT_REMOTE_TOOLING_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_TOOLING_SCHEMA,
  RMT_VNEXT_REMOTE_TOOLING_SUITE_PATH,
  RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE,
  RMT_VNEXT_REMOTE_TOOLING_WP_PATH,
  analyzeRmtVNextRemoteToolingSource,
  createRmtVNextRemoteAgentReport,
  createRmtVNextRemoteToolingAdapter,
  getRmtVNextRemoteToolingCompletions,
  getRmtVNextRemoteToolingDocumentSymbols,
  getRmtVNextRemoteToolingHover,
  lintRmtVNextRemoteToolingSource
} = require('../../tools/rmt-language/vnext-remote-tooling');

const EPIC_16_PATH = 'development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md';
const VALID_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-compiler-valid.rmt';
const INVALID_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-tooling-invalid.rmt';
const SOURCE_SNIPPETS = 'tools/rmt-language/snippets/rmt.code-snippets';
const PACKAGED_SNIPPETS = 'tools/rmt-editor/vscode/snippets/rmt.code-snippets';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function fixtureInput(relativePath, rootDir) {
  return {
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir),
    version: 16
  };
}

function diagnosticCodes(report) {
  return (report.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextRemoteTooling;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_16_PATH, rootDir);
  const contract = readText(RMT_VNEXT_REMOTE_TOOLING_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_VNEXT_REMOTE_TOOLING_WP_PATH, rootDir);

  context.assert(metadata && metadata.schema === RMT_VNEXT_REMOTE_TOOLING_SCHEMA, 'package metadata declares remote tooling schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_REMOTE_TOOLING_REPORT_SCHEMA, 'package metadata declares remote tooling report schema');
  context.assert(metadata && metadata.agentReportSchema === RMT_VNEXT_REMOTE_AGENT_REPORT_SCHEMA, 'package metadata declares remote agent report schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.remoteCompilerSchema === RMT_VNEXT_REMOTE_COMPILER_SCHEMA, 'package metadata declares remote compiler schema');
  context.assert(metadata && metadata.remoteManifestSchema === RMT_VNEXT_REMOTE_MANIFEST_SCHEMA, 'package metadata declares remote manifest schema');
  context.assert(metadata && metadata.remoteSurfaceSchema === RMT_VNEXT_REMOTE_SURFACE_SCHEMA, 'package metadata declares remote surface schema');
  context.assert(metadata && metadata.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'package metadata declares enterprise registry schema');
  context.assert(metadata && metadata.enterpriseSurfaceSchema === RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA, 'package metadata declares enterprise surface schema');
  context.assert(metadata && metadata.crossSurfaceEventReportSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA, 'package metadata declares cross surface event report schema');
  context.assert(metadata && metadata.eventGovernanceReportSchema === RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA, 'package metadata declares event governance report schema');
  context.assert(metadata && metadata.degradationReportSchema === RMT_VNEXT_DEGRADATION_REPORT_SCHEMA, 'package metadata declares degradation report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE, 'package metadata points to WP-E16-09');
  context.assert(metadata && metadata.module === RMT_VNEXT_REMOTE_TOOLING_MODULE_PATH, 'package metadata points to remote tooling module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_REMOTE_TOOLING_SUITE_PATH, 'package metadata points to remote tooling suite');
  context.assert(metadata && metadata.contract === RMT_VNEXT_REMOTE_TOOLING_CONTRACT_PATH, 'package metadata points to remote tooling contract');
  context.assert(metadata && metadata.workpackageDocument === RMT_VNEXT_REMOTE_TOOLING_WP_PATH, 'package metadata points to WP-E16-09 document');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-remote-tooling --json', 'package metadata declares remote tooling local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_REMOTE_TOOLING_PACKAGE_SCRIPT, 'package metadata declares remote tooling package script');
  context.assert(packageManifest.exports['./rmt-language/vnext-remote-tooling'] === './tools/rmt-language/vnext-remote-tooling.js', 'package exports vNext remote tooling');
  context.assert(packageManifest.scripts['test:rmt-vnext-remote-tooling'] === 'node scripts/run_xtend_tests.js rmt-vnext-remote-tooling', 'package exposes vNext remote tooling script');
  context.assert(runner.includes("id: 'rmt-vnext-remote-tooling'"), 'test runner exposes rmt-vnext-remote-tooling suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js rmt-vnext-remote-tooling'), 'runner help references remote tooling gate');
  context.assert(epic.includes('- Status: `completed / Epic 16 Enterprise MFE Release Handoff accepted`'), 'Epic records current E16 accepted status');
  context.assert(epic.includes('| `WP-E16-09` | P1 | completed | WS4 |'), 'Epic marks WP-E16-09 completed');
  context.assert(epic.includes('| `WP-E16-10` | P2 | completed | WS5 |'), 'Epic marks WP-E16-10 completed');
  context.assert(epic.includes('| `WP-E16-11` | P2 | completed | WS5 |'), 'Epic marks WP-E16-11 completed');
  context.assert(contract.includes('schema: "xtend.rmt.vnext-remote-tooling.v1"'), 'contract declares remote tooling schema');
  context.assert(workpackage.includes('WP-E16-09` ist abgeschlossen'), 'workpackage records handoff completion');
}

function runAnalysisAndLintChecks(context, rootDir) {
  const valid = fixtureInput(VALID_FIXTURE, rootDir);
  const invalid = fixtureInput(INVALID_FIXTURE, rootDir);
  const analysis = analyzeRmtVNextRemoteToolingSource(valid, { rootDir });
  const lint = lintRmtVNextRemoteToolingSource(valid, { rootDir, analysis });
  const invalidLint = lintRmtVNextRemoteToolingSource(invalid, { rootDir });
  const invalidCodes = diagnosticCodes(invalidLint);

  context.assert(isLikelyRmtVNextSource('remote surface checkout.cart from remote "@xtend/checkout-cart" {}') === true, 'generic vNext detector recognizes remote surface syntax');
  context.assert(analysis.schema === RMT_VNEXT_REMOTE_TOOLING_SCHEMA, 'remote analysis emits tooling schema');
  context.assert(analysis.ok === true && analysis.status === 'ready', 'valid remote fixture is tooling-ready');
  context.assert(analysis.remoteCompilerSchema === RMT_VNEXT_REMOTE_COMPILER_SCHEMA, 'remote analysis links remote compiler schema');
  context.assert(analysis.indexes.remoteSurfaces.length === 1, 'remote analysis indexes one remote surface');
  context.assert(analysis.indexes.remoteSurfaces[0].name === 'checkout.cart', 'remote analysis indexes remote surface name');
  context.assert(analysis.indexes.shellTargets.some((target) => target.target === 'shell.slot:sidebar.cart'), 'remote analysis indexes shell slot target');
  context.assert(analysis.indexes.events.some((event) => event.event === 'checkout.cart.updated.v1'), 'remote analysis indexes outbound event');
  context.assert(analysis.indexes.events.some((event) => event.event === 'user.session.changed.v1'), 'remote analysis indexes inbound event');
  context.assert(analysis.security.status === 'ready', 'remote analysis reports security ready');
  context.assert(analysis.degradationReport.status === 'full', 'remote analysis reports full degradation state');
  context.assert(lint.status === 'passed' && lint.ruleCount === REMOTE_TOOLING_RULES.length, 'valid remote lint passes with remote rules');
  assertIncludesAll(context, REMOTE_TOOLING_RULES.map((rule) => rule.code), [
    REMOTE_OWNER_MISSING_CODE,
    REMOTE_FALLBACK_MISSING_CODE,
    REMOTE_TOOLING_EVENT_DIRECTION_MISSING_CODE,
    REMOTE_TOOLING_PAYLOAD_SHAPE_MISSING_CODE
  ], 'remote tooling rule registry covers core authoring facts');

  context.assert(invalidLint.status === 'failed', 'invalid remote tooling fixture fails lint');
  assertIncludesAll(context, invalidCodes, [
    REMOTE_OWNER_MISSING_CODE,
    REMOTE_FALLBACK_MISSING_CODE,
    REMOTE_TOOLING_EVENT_DIRECTION_MISSING_CODE,
    REMOTE_TOOLING_PAYLOAD_SHAPE_MISSING_CODE
  ], 'invalid remote tooling fixture reports actionable diagnostics');
  context.assert(invalidLint.diagnostics.some((diagnostic) => diagnostic.repair && diagnostic.repair.insertText.includes('owner team')), 'owner diagnostic includes repair snippet');
  context.assert(invalidLint.diagnostics.some((diagnostic) => diagnostic.repair && diagnostic.repair.insertText.includes('direction')), 'direction diagnostic includes repair snippet');
}

function runProviderChecks(context, rootDir) {
  const input = fixtureInput(VALID_FIXTURE, rootDir);
  const analysis = analyzeRmtVNextRemoteToolingSource(input, { rootDir });
  const bodyCompletions = getRmtVNextRemoteToolingCompletions(input, {
    rootDir,
    analysis,
    pointer: '/remoteSurfaces/0'
  });
  const eventCompletions = getRmtVNextRemoteToolingCompletions(input, {
    rootDir,
    analysis,
    context: 'remote-event-body'
  });
  const shellCompletions = getRmtVNextRemoteToolingCompletions(input, {
    rootDir,
    analysis,
    context: 'remote-shell-targets'
  });
  const eventRefs = getRmtVNextRemoteToolingCompletions(input, {
    rootDir,
    analysis,
    context: 'remote-events'
  });
  const snippetCompletions = getRmtVNextRemoteToolingCompletions(input, {
    rootDir,
    analysis,
    context: 'remote-snippets'
  });
  const hover = getRmtVNextRemoteToolingHover(input, {
    rootDir,
    analysis,
    pointer: '/remoteSurfaces/0'
  });
  const symbols = getRmtVNextRemoteToolingDocumentSymbols(input, {
    rootDir,
    analysis
  });
  const agentReport = createRmtVNextRemoteAgentReport(input, {
    rootDir,
    analysis
  });
  const adapter = createRmtVNextRemoteToolingAdapter({ rootDir });

  context.assert(bodyCompletions.items.some((item) => item.label === 'owner team'), 'remote completions include owner team');
  context.assert(bodyCompletions.items.some((item) => item.label === 'fallback surface'), 'remote completions include fallback surface');
  context.assert(eventCompletions.items.some((item) => item.label === 'direction outbound'), 'remote event completions include outbound direction');
  context.assert(eventCompletions.items.some((item) => item.label === 'payload'), 'remote event completions include payload');
  context.assert(shellCompletions.items.some((item) => item.label === 'shell.slot'), 'remote shell completions include shell.slot');
  context.assert(shellCompletions.items.some((item) => item.label === 'shell.slot:sidebar.cart'), 'remote shell completions include discovered shell target');
  context.assert(eventRefs.items.some((item) => item.label === 'checkout.cart.updated.v1'), 'remote event completions include discovered event');
  context.assert(snippetCompletions.items.some((item) => item.detail === 'rmt-vnext-remote-surface'), 'remote snippet completions include remote surface snippet');
  context.assert(hover.status === 'found' && hover.hover.markdown.includes('Remote Surface: checkout.cart'), 'remote hover explains remote surface');
  context.assert(symbols.symbols.some((symbol) => symbol.name === 'remoteSurfaces'), 'remote symbols include remoteSurfaces namespace');
  context.assert(symbols.symbols.some((symbol) => symbol.name === 'crossSurfaceEvents'), 'remote symbols include cross surface events namespace');
  context.assert(agentReport.schema === RMT_VNEXT_REMOTE_AGENT_REPORT_SCHEMA, 'agent report emits remote agent schema');
  context.assert(agentReport.registry.status === 'ready' && agentReport.registry.remoteSurfaceCount === 1, 'agent report summarizes registry status');
  context.assert(agentReport.security.status === 'ready' && agentReport.security.kernelRemoteExecution === false, 'agent report summarizes security boundary');
  context.assert(agentReport.degradation.status === 'full', 'agent report summarizes degradation status');
  context.assert(adapter.lint(input).status === 'passed', 'remote tooling adapter lints valid fixture');
}

function runSnippetChecks(context, rootDir) {
  const catalog = createRmtSnippetCatalog({ rootDir });
  const generatedSnippets = createVsCodeSnippetDocument({ rootDir });
  const sourceSnippets = readJson(SOURCE_SNIPPETS, rootDir);
  const packagedSnippets = readJson(PACKAGED_SNIPPETS, rootDir);

  context.assert(REMOTE_SNIPPETS.length === 4, 'remote tooling exports four remote snippets');
  context.assert(catalog.snippets.some((snippet) => snippet.id === 'rmt-vnext-remote-surface'), 'snippet catalog includes remote surface snippet');
  context.assert(catalog.snippets.some((snippet) => snippet.id === 'rmt-vnext-remote-event'), 'snippet catalog includes remote event snippet');
  context.assert(catalog.snippets.some((snippet) => snippet.id === 'rmt-vnext-remote-fallback'), 'snippet catalog includes remote fallback snippet');
  context.assert(catalog.snippets.some((snippet) => snippet.id === 'rmt-vnext-remote-degradation'), 'snippet catalog includes remote degradation snippet');
  context.assert(generatedSnippets['RMT vNext Remote Surface'].prefix === 'rmt-vnext-remote-surface', 'generated snippets include remote surface prefix');
  context.assert(sourceSnippets['RMT vNext Remote Surface'].prefix === generatedSnippets['RMT vNext Remote Surface'].prefix, 'source snippets include remote surface prefix');
  context.assert(packagedSnippets['RMT vNext Remote Surface'].prefix === generatedSnippets['RMT vNext Remote Surface'].prefix, 'packaged snippets include remote surface prefix');
  context.assert(JSON.stringify(sourceSnippets) === JSON.stringify(packagedSnippets), 'source and packaged snippets stay in sync');
}

function runRmtVNextRemoteToolingSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-remote-tooling',
    label: 'Epic 16 RMT vNext Remote Tooling'
  });
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_REMOTE_TOOLING_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_REMOTE_TOOLING_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_REMOTE_TOOLING_MODULE_PATH, rootDir, 'remote tooling module exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_TOOLING_SUITE_PATH, rootDir, 'remote tooling suite exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_TOOLING_CONTRACT_PATH, rootDir, 'remote tooling contract exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_TOOLING_WP_PATH, rootDir, 'WP-E16-09 workpackage document exists');
  assertFileExists(context, VALID_FIXTURE, rootDir, 'remote tooling valid fixture exists');
  assertFileExists(context, INVALID_FIXTURE, rootDir, 'remote tooling invalid fixture exists');
  context.assert(moduleSyntax.ok, `remote tooling module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `remote tooling suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runMetadataChecks(context, rootDir);
  runAnalysisAndLintChecks(context, rootDir);
  runProviderChecks(context, rootDir);
  runSnippetChecks(context, rootDir);

  return context.result({
    schema: RMT_VNEXT_REMOTE_TOOLING_REPORT_SCHEMA,
    toolingSchema: RMT_VNEXT_REMOTE_TOOLING_SCHEMA,
    agentReportSchema: RMT_VNEXT_REMOTE_AGENT_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE,
    module: RMT_VNEXT_REMOTE_TOOLING_MODULE_PATH,
    suite: RMT_VNEXT_REMOTE_TOOLING_SUITE_PATH,
    remoteSnippetCount: REMOTE_SNIPPETS.length
  });
}

function printRmtVNextRemoteToolingReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 16 RMT vNext Remote Tooling erfolgreich.',
    failureTitle: 'Epic 16 RMT vNext Remote Tooling fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextRemoteToolingReport,
  runRmtVNextRemoteToolingSuite
};
