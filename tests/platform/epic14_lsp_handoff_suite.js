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
  CAPABILITY_MATRIX,
  EPIC14_LSP_HANDOFF_CONTRACT,
  EPIC14_LSP_HANDOFF_DOCS,
  EPIC14_LSP_HANDOFF_LOCAL_GATE,
  EPIC14_LSP_HANDOFF_MODULE,
  EPIC14_LSP_HANDOFF_PACKAGE_SCRIPT,
  EPIC14_LSP_HANDOFF_REPORT_SCHEMA,
  EPIC14_LSP_HANDOFF_SCHEMA,
  EPIC14_LSP_HANDOFF_STATUS,
  EPIC14_LSP_HANDOFF_SUITE,
  EPIC14_LSP_HANDOFF_WORKPACKAGE,
  EPIC14_LSP_HANDOFF_WORKPACKAGE_DOC,
  FOLLOW_UP_EPIC_CANDIDATES,
  KERNEL_BOUNDARY,
  KNOWN_LIMITATIONS,
  createEpic14LspHandoffPlan,
  createEpic14LspHandoffReport,
  validateEpic14LspHandoffPlan
} = require('../../catalog/epic14-lsp-handoff');

const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const REFERENCE_REGISTRY_PATH = 'development/XTend-Dokumentations-und-Demo-Referenzpfade.md';
const SCAFFOLD_CONFIG_PATH = 'xtend-builder/scaffold.config.js';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, entries, label) {
  entries.forEach((entry) => {
    context.assertIncludes(source, entry, `${label} includes ${entry}`);
  });
}

function assertArrayIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function runPlanChecks(context, plan, report) {
  const validation = validateEpic14LspHandoffPlan(plan);
  const capabilityIds = plan.capabilities.map((capability) => capability.id);
  const implemented = plan.capabilities.filter((capability) => capability.status === 'implemented');
  const planned = plan.capabilities.filter((capability) => capability.status === 'planned');

  context.assert(plan.schema === EPIC14_LSP_HANDOFF_SCHEMA, 'Handoff plan exposes stable schema');
  context.assert(plan.reportSchema === EPIC14_LSP_HANDOFF_REPORT_SCHEMA, 'Handoff plan exposes report schema');
  context.assert(plan.workpackage === EPIC14_LSP_HANDOFF_WORKPACKAGE, 'Handoff plan belongs to WP-E14-16');
  context.assert(plan.status === EPIC14_LSP_HANDOFF_STATUS, 'Handoff plan is accepted');
  context.assert(plan.completionState === 'rmt-authoring-tooling-ready', 'Handoff plan accepts RMT authoring tooling readiness');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Handoff plan keeps kernel boundary');
  context.assert(plan.networkRequired === false, 'Handoff plan stays network-free');
  context.assert(validation.schema === EPIC14_LSP_HANDOFF_REPORT_SCHEMA, 'Validator emits report schema');
  context.assert(validation.ok === true, 'Handoff plan validates');
  context.assert(report.ok === true, 'Handoff report passes');
  context.assert(report.localGate === EPIC14_LSP_HANDOFF_LOCAL_GATE, 'Handoff report exposes local gate');
  context.assert(plan.toolingGate === 'npm run test:rmt-tooling', 'Handoff points to RMT tooling release gate');
  context.assert(plan.releaseGate === 'npm run test:release:full:report', 'Handoff keeps global release report gate');
  context.assert(implemented.length >= 8, 'Handoff marks MVP capabilities implemented');
  context.assert(planned.length >= 5, 'Handoff keeps follow-up capabilities planned');
  context.assert(CAPABILITY_MATRIX.length === plan.capabilities.length, 'Catalog capability matrix feeds plan');
  context.assert(KNOWN_LIMITATIONS.length === plan.knownLimitations.length, 'Known limitations feed plan');
  context.assert(FOLLOW_UP_EPIC_CANDIDATES.length === plan.followUpEpicCandidates.length, 'Follow-up candidates feed plan');
  assertArrayIncludesAll(context, capabilityIds, [
    'diagnostics',
    'completion',
    'hover',
    'documentSymbols',
    'definition',
    'codeActions',
    'agentRepairReport',
    'snippets',
    'workspaceSymbols',
    'rename',
    'references',
    'semanticTokens',
    'formatting'
  ], 'Capability matrix');
  assertArrayIncludesAll(context, plan.acceptedContracts, [
    'xtend.rmt.source-model.v1',
    'xtend.rmt.linter.cli.v1',
    'xtend.rmt.language-server.v1',
    'xtend.rmt.ai-agent-repair-report.v1',
    'xtend.epic14.rmt-tooling.v1'
  ], 'Accepted contracts');
}

function runPackageChecks(context, rootDir, plan) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic14LspHandoff;

  context.assert(packageManifest.exports['./catalog/epic14-lsp-handoff'] === './catalog/epic14-lsp-handoff.js', 'Package exports Epic 14 LSP handoff module');
  context.assert(packageManifest.scripts['test:epic14-lsp-handoff'] === 'node scripts/run_xtend_tests.js epic14-lsp-handoff', 'Package exposes Epic 14 LSP handoff test script');
  context.assert(Array.isArray(packageManifest.xtend.releaseGates) && packageManifest.xtend.releaseGates.includes(EPIC14_LSP_HANDOFF_PACKAGE_SCRIPT), 'Release gates include Epic 14 LSP handoff script');
  context.assert(metadata && metadata.schema === EPIC14_LSP_HANDOFF_SCHEMA, 'Package metadata declares LSP handoff schema');
  context.assert(metadata && metadata.reportSchema === EPIC14_LSP_HANDOFF_REPORT_SCHEMA, 'Package metadata declares report schema');
  context.assert(metadata && metadata.workpackage === EPIC14_LSP_HANDOFF_WORKPACKAGE, 'Package metadata points to WP-E14-16');
  context.assert(metadata && metadata.status === EPIC14_LSP_HANDOFF_STATUS, 'Package metadata exposes accepted status');
  context.assert(metadata && metadata.module === EPIC14_LSP_HANDOFF_MODULE, 'Package metadata points to handoff module');
  context.assert(metadata && metadata.contract === EPIC14_LSP_HANDOFF_CONTRACT, 'Package metadata points to handoff contract');
  context.assert(metadata && metadata.suite === EPIC14_LSP_HANDOFF_SUITE, 'Package metadata points to handoff suite');
  context.assert(metadata && metadata.localGate === EPIC14_LSP_HANDOFF_LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === EPIC14_LSP_HANDOFF_PACKAGE_SCRIPT, 'Package metadata exposes package script');
  assertArrayIncludesAll(context, metadata && metadata.implementedCapabilities, reportImplemented(plan), 'Package metadata implemented capabilities');
  assertArrayIncludesAll(context, metadata && metadata.plannedCapabilities, reportPlanned(plan), 'Package metadata planned capabilities');
  context.assert(Array.isArray(metadata && metadata.knownLimitations) && metadata.knownLimitations.includes('formatter-not-released'), 'Package metadata lists formatter limitation');
  context.assert(Array.isArray(metadata && metadata.followUpEpicCandidates) && metadata.followUpEpicCandidates.includes('rmt-dsl-syntax-and-formatter'), 'Package metadata lists formatter follow-up');
  context.assert(metadata && metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps kernel boundary');
  context.assert(metadata && metadata.networkRequired === false, 'Package metadata stays network-free');
}

function reportImplemented(plan) {
  return plan.capabilities.filter((capability) => capability.status === 'implemented').map((capability) => capability.id);
}

function reportPlanned(plan) {
  return plan.capabilities.filter((capability) => capability.status === 'planned').map((capability) => capability.id);
}

function runDocumentationChecks(context, rootDir) {
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const scaffold = readText(SCAFFOLD_CONFIG_PATH, rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const handoff = readText(EPIC14_LSP_HANDOFF_CONTRACT, rootDir);
  const workpackage = readText(EPIC14_LSP_HANDOFF_WORKPACKAGE_DOC, rootDir);
  const languageServerDocs = readText(EPIC14_LSP_HANDOFF_DOCS, rootDir);

  context.assertIncludes(runner, "id: 'epic14-lsp-handoff'", 'Runner registers Epic 14 LSP handoff suite');
  context.assertIncludes(runner, 'node scripts/run_xtend_tests.js epic14-lsp-handoff', 'Runner help references Epic 14 LSP handoff suite');
  context.assertIncludes(scaffold, 'epic14LspHandoff', 'Scaffold config exposes Epic 14 LSP handoff metadata');
  context.assertIncludes(scaffold, EPIC14_LSP_HANDOFF_SCHEMA, 'Scaffold config declares LSP handoff schema');
  context.assertIncludes(epic, '- Status: Completed', 'Epic 14 is completed');
  context.assertIncludes(epic, '| `WP-E14-16` | P2 | completed | WS11 |', 'Epic marks WP-E14-16 completed');
  context.assertIncludes(epic, 'Epic 14 ist abgeschlossen', 'Epic documents closure');
  context.assertIncludes(architecture, 'Implementierungsstand nach `WP-E14-16`', 'Architecture documents WP-E14-16 status');
  context.assertIncludes(architecture, EPIC14_LSP_HANDOFF_SCHEMA, 'Architecture documents LSP handoff schema');
  assertIncludesAll(context, registry, [
    EPIC14_LSP_HANDOFF_MODULE,
    EPIC14_LSP_HANDOFF_CONTRACT,
    EPIC14_LSP_HANDOFF_SUITE
  ], 'Reference registry');
  assertIncludesAll(context, handoff, [
    EPIC14_LSP_HANDOFF_SCHEMA,
    'LSP Capability Matrix',
    'Known Limitations',
    'RMT DSL Syntax, Formatter und Writer API',
    'workspace/symbol',
    'textDocument/rename',
    KERNEL_BOUNDARY
  ], 'Handoff document');
  assertIncludesAll(context, workpackage, [
    'Status: `completed`',
    EPIC14_LSP_HANDOFF_LOCAL_GATE,
    'RMT Tooling ist als naechste Produktreifestufe akzeptiert',
    'Folge-Epic fuer Formatter/DSL-Syntax kann sauber geplant werden'
  ], 'WP-E14-16 workpackage');
  assertIncludesAll(context, languageServerDocs, [
    EPIC14_LSP_HANDOFF_SCHEMA,
    'LSP Capability Matrix',
    'Known Limitations',
    'workspace/symbol',
    'textDocument/rename',
    'textDocument/formatting',
    '../development/XTendRMT-Epic14-Abschluss-und-LSP-Handoff.md'
  ], 'Language Server docs');
}

function runEpic14LspHandoffSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic14-lsp-handoff',
    label: 'Epic 14 LSP Handoff'
  });
  const plan = createEpic14LspHandoffPlan({ rootDir });
  const report = createEpic14LspHandoffReport({ rootDir, plan });
  const moduleSyntax = syntaxCheckFile(EPIC14_LSP_HANDOFF_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC14_LSP_HANDOFF_SUITE, { rootDir, extension: '.js' });

  [
    EPIC14_LSP_HANDOFF_MODULE,
    EPIC14_LSP_HANDOFF_SUITE,
    EPIC14_LSP_HANDOFF_CONTRACT,
    EPIC14_LSP_HANDOFF_WORKPACKAGE_DOC,
    EPIC14_LSP_HANDOFF_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Epic 14 LSP handoff module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 14 LSP handoff suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  runPlanChecks(context, plan, report);
  runPackageChecks(context, rootDir, plan);
  runDocumentationChecks(context, rootDir);

  return context.result({
    report: {
      schema: EPIC14_LSP_HANDOFF_REPORT_SCHEMA,
      workpackage: EPIC14_LSP_HANDOFF_WORKPACKAGE,
      localGate: EPIC14_LSP_HANDOFF_LOCAL_GATE,
      implementedCapabilities: report.implementedCapabilities,
      plannedCapabilities: report.plannedCapabilities,
      knownLimitations: report.knownLimitations
    }
  });
}

function printEpic14LspHandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 LSP Handoff erfolgreich.',
    failureTitle: 'Epic 14 LSP Handoff fehlgeschlagen:'
  });
}

module.exports = {
  printEpic14LspHandoffReport,
  runEpic14LspHandoffSuite
};
