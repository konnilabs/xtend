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
  RMT_VNEXT_ACCEPTED_CONTRACTS,
  RMT_VNEXT_AUTHORING_GUIDE_PATH,
  RMT_VNEXT_MIGRATION_NOTES_PATH,
  RMT_VNEXT_REFERENCE_CORE_PATH,
  RMT_VNEXT_REFERENCE_DEMO_PATH,
  RMT_VNEXT_RELEASE_CONTRACT_PATH,
  RMT_VNEXT_RELEASE_DOCS,
  RMT_VNEXT_RELEASE_GATE_MATRIX_SCHEMA,
  RMT_VNEXT_RELEASE_GATES,
  RMT_VNEXT_OPTIONAL_RELEASE_GATES,
  RMT_VNEXT_RELEASE_HANDOFF_DOC_PATH,
  RMT_VNEXT_RELEASE_HANDOFF_REPORT_SCHEMA,
  RMT_VNEXT_RELEASE_HANDOFF_SCHEMA,
  RMT_VNEXT_RELEASE_LOCAL_GATE,
  RMT_VNEXT_RELEASE_MODULE_PATH,
  RMT_VNEXT_RELEASE_PACKAGE_SCRIPT,
  RMT_VNEXT_RELEASE_SUITE_PATH,
  RMT_VNEXT_RELEASE_WORKPACKAGE,
  RMT_VNEXT_RELEASE_WORKPACKAGE_PATH,
  createRmtVNextReleaseHandoffAdapter,
  createRmtVNextReleaseHandoffPlan,
  validateRmtVNextReleaseHandoffPlan
} = require('../../tools/rmt-language/vnext-release');
const {
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const REFERENCE_REGISTRY_PATH = 'development/XTend-Dokumentations-und-Demo-Referenzpfade.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, entries, label) {
  entries.forEach((entry) => {
    context.assertIncludes(source, entry, `${label} includes ${entry}`);
  });
}

function runPlanChecks(context, rootDir) {
  const adapter = createRmtVNextReleaseHandoffAdapter({
    readFile: (relativePath) => readText(relativePath, rootDir)
  });
  const plan = createRmtVNextReleaseHandoffPlan();
  const validation = validateRmtVNextReleaseHandoffPlan(plan);
  const report = adapter.createReport({ plan });

  context.assert(plan.schema === RMT_VNEXT_RELEASE_HANDOFF_SCHEMA, 'release handoff plan uses schema');
  context.assert(plan.reportSchema === RMT_VNEXT_RELEASE_HANDOFF_REPORT_SCHEMA, 'release handoff plan declares report schema');
  context.assert(plan.gateMatrixSchema === RMT_VNEXT_RELEASE_GATE_MATRIX_SCHEMA, 'release handoff plan declares gate matrix schema');
  context.assert(plan.workpackage === RMT_VNEXT_RELEASE_WORKPACKAGE, 'release handoff plan belongs to WP-E15-18');
  context.assert(plan.status === 'accepted-vnext-release-handoff', 'release handoff plan is accepted');
  context.assert(plan.targetReadiness === 'rmt-vnext-release-ready', 'release handoff plan marks release readiness');
  context.assert(plan.localGate === RMT_VNEXT_RELEASE_LOCAL_GATE, 'release handoff plan exposes local gate');
  context.assert(plan.packageScript === RMT_VNEXT_RELEASE_PACKAGE_SCRIPT, 'release handoff plan exposes package script');
  RMT_VNEXT_RELEASE_DOCS.forEach((docPath) => {
    context.assert(plan.docs.includes(docPath), `release handoff plan includes ${docPath}`);
  });
  RMT_VNEXT_RELEASE_GATES.forEach((command) => {
    context.assert(plan.gateMatrix.gates.some((gate) => gate.command === command), `release handoff gate matrix includes ${command}`);
  });
  RMT_VNEXT_OPTIONAL_RELEASE_GATES.forEach((command) => {
    context.assert(plan.gateMatrix.optionalGates.some((gate) => gate.command === command && gate.required === false), `release handoff optional gate matrix includes ${command}`);
  });
  context.assert(RMT_VNEXT_ACCEPTED_CONTRACTS.every((contract) => plan.acceptedContracts.includes(contract)), 'release handoff accepts all vNext contracts');
  context.assert(plan.followUpEpicCandidates.length >= 4, 'release handoff names follow-up epics');
  context.assert(plan.networkRequired === false, 'release handoff remains network-free');
  context.assert(plan.kernelBoundary === 'no-rmt-kernel-import-of-host-runtime-types', 'release handoff keeps kernel boundary');
  context.assert(validation.ok === true, 'release handoff plan validates');
  context.assert(report.ok === true, 'release handoff report passes');
  context.assert(report.referenceDemo.coreOutputMatches === true, 'release handoff report verifies reference core output');
}

function runPackageChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextReleaseHandoff;

  context.assert((typeof packageManifest.exports['./rmt-language/vnext-release'] === 'string' ? packageManifest.exports['./rmt-language/vnext-release'] : packageManifest.exports['./rmt-language/vnext-release'] && packageManifest.exports['./rmt-language/vnext-release'].default) === './tools/rmt-language/vnext-release.js', 'package exports vNext release handoff adapter');
  context.assert(packageManifest.scripts['test:rmt-vnext-release'] === 'node scripts/run_xtend_tests.js rmt-vnext-release', 'package exposes vNext release script');
  context.assert(Array.isArray(packageManifest.xtend.releaseGates) && packageManifest.xtend.releaseGates.includes(RMT_VNEXT_RELEASE_PACKAGE_SCRIPT), 'package release gates include vNext release script');
  context.assert(metadata && metadata.schema === RMT_VNEXT_RELEASE_HANDOFF_SCHEMA, 'package metadata declares release handoff schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_RELEASE_HANDOFF_REPORT_SCHEMA, 'package metadata declares release handoff report schema');
  context.assert(metadata && metadata.gateMatrixSchema === RMT_VNEXT_RELEASE_GATE_MATRIX_SCHEMA, 'package metadata declares release gate matrix schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_RELEASE_WORKPACKAGE, 'package metadata declares WP-E15-18 ownership');
  context.assert(metadata && metadata.status === 'accepted-vnext-release-handoff', 'package metadata exposes accepted release status');
  context.assert(metadata && metadata.targetReadiness === 'rmt-vnext-release-ready', 'package metadata exposes release readiness');
  context.assert(metadata && metadata.module === RMT_VNEXT_RELEASE_MODULE_PATH, 'package metadata points to release module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_RELEASE_SUITE_PATH, 'package metadata points to release suite');
  context.assert(metadata && metadata.contract === RMT_VNEXT_RELEASE_CONTRACT_PATH, 'package metadata points to release contract');
  context.assert(metadata && metadata.workpackageDocument === RMT_VNEXT_RELEASE_WORKPACKAGE_PATH, 'package metadata points to WP-E15-18 document');
  context.assert(metadata && metadata.referenceDemo === RMT_VNEXT_REFERENCE_DEMO_PATH, 'package metadata points to reference demo');
  context.assert(metadata && metadata.referenceCoreOutput === RMT_VNEXT_REFERENCE_CORE_PATH, 'package metadata points to reference core output');
  context.assert(metadata && metadata.localGate === RMT_VNEXT_RELEASE_LOCAL_GATE, 'package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_RELEASE_PACKAGE_SCRIPT, 'package metadata exposes package script');
  RMT_VNEXT_RELEASE_DOCS.forEach((docPath) => {
    context.assert(metadata.docs.includes(docPath), `package metadata includes ${docPath}`);
  });
  RMT_VNEXT_RELEASE_GATES.forEach((command) => {
    context.assert(metadata.releaseGateMatrix.includes(command), `package metadata release matrix includes ${command}`);
  });
  RMT_VNEXT_OPTIONAL_RELEASE_GATES.forEach((command) => {
    context.assert(metadata.optionalReleaseGateMatrix.includes(command), `package metadata optional release matrix includes ${command}`);
  });
}

function runReferenceDemoChecks(context, rootDir) {
  const source = readText(RMT_VNEXT_REFERENCE_DEMO_PATH, rootDir);
  const expectedCore = readText(RMT_VNEXT_REFERENCE_CORE_PATH, rootDir);
  const parsedCore = JSON.parse(expectedCore);
  const compileResult = compileRmtVNextSource({
    text: source,
    filePath: resolveRepoPath(RMT_VNEXT_REFERENCE_DEMO_PATH, rootDir)
  });
  const core = compileResult.coreDocument;

  context.assert(compileResult.ok === true, 'reference demo compiles successfully');
  context.assert(compileResult.coreJson === expectedCore, 'reference demo core output is byte-stable');
  context.assert(parsedCore.schema === RMT_VNEXT_CORE_SCHEMA, 'reference core output uses vNext core schema');
  context.assert(core.manifest.documentId === 'xtend.vnext.reference', 'reference demo documentId is stable');
  context.assert(core.imports.length === 1, 'reference demo covers static imports');
  context.assert(core.templates.length === 1, 'reference demo covers templates');
  context.assert(core.surfaces.length === 3, 'reference demo covers multiple surfaces');
  context.assert(core.lanes.length === 4, 'reference demo covers weighted lanes');
  context.assert(core.operations.length === 9, 'reference demo covers lifecycle and streaming operations');
  context.assert(core.slots.length === 3, 'reference demo covers slots');
  context.assert(core.events.length === 2, 'reference demo covers event actions');
  context.assert(core.dataSources.length === 5, 'reference demo covers endpoint, sse and worker data sources');
  context.assert(core.securityPolicies.length === 4, 'reference demo covers trust boundary and sanitize policies');
  context.assert(core.operations.some((operation) => operation.condition), 'reference demo covers conditions');
  context.assert(core.operations.some((operation) => operation.kind === 'stream'), 'reference demo covers streaming');
}

function runDocumentationChecks(context, rootDir) {
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readJson('docs/menu.json', rootDir);
  const authoring = readText(RMT_VNEXT_AUTHORING_GUIDE_PATH, rootDir);
  const migration = readText(RMT_VNEXT_MIGRATION_NOTES_PATH, rootDir);
  const handoffDocs = readText(RMT_VNEXT_RELEASE_HANDOFF_DOC_PATH, rootDir);
  const contract = readText(RMT_VNEXT_RELEASE_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_VNEXT_RELEASE_WORKPACKAGE_PATH, rootDir);
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  ['rmt-vnext-authoring', 'rmt-vnext-migration-notes', 'rmt-vnext-release-handoff'].forEach((slug) => {
    context.assert(docsMenu.some((entry) => entry.slug === slug), `docs menu includes ${slug}`);
  });
  assertIncludesAll(context, docsReadme, [
    'RMT vNext Authoring Guide',
    'RMT vNext Migration Notes',
    'RMT vNext Release contract',
    RMT_VNEXT_REFERENCE_DEMO_PATH,
    RMT_VNEXT_REFERENCE_CORE_PATH
  ], 'Docs README');
  assertIncludesAll(context, authoring, [
    RMT_VNEXT_RELEASE_HANDOFF_SCHEMA,
    'template',
    'surface',
    'lane',
    'when',
    'slot',
    'trust boundary',
    RMT_VNEXT_REFERENCE_DEMO_PATH
  ], 'Authoring guide');
  assertIncludesAll(context, migration, [
    'xtend.rmt.vnext-compatibility-matrix.v1',
    'report-only',
    'preview',
    'rmt.vnext.migration.lossy_domain'
  ], 'Migration notes');
  assertIncludesAll(context, handoffDocs, [
    RMT_VNEXT_RELEASE_HANDOFF_SCHEMA,
    RMT_VNEXT_REFERENCE_DEMO_PATH,
    RMT_VNEXT_REFERENCE_CORE_PATH,
    'rmt-vnext-runtime-adapters',
    'rmt-vnext-formatter-writer'
  ], 'Release handoff docs');
  assertIncludesAll(context, contract, [
    RMT_VNEXT_RELEASE_HANDOFF_SCHEMA,
    RMT_VNEXT_RELEASE_GATE_MATRIX_SCHEMA,
    RMT_VNEXT_REFERENCE_DEMO_PATH,
    'Accepted Residuals'
  ], 'Release contract');
  assertIncludesAll(context, workpackage, [
    'Status: `completed`',
    RMT_VNEXT_RELEASE_LOCAL_GATE,
    RMT_VNEXT_REFERENCE_DEMO_PATH,
    'rmt-vnext-release-ready'
  ], 'WP-E15-18 document');
  assertIncludesAll(context, registry, [
    RMT_VNEXT_RELEASE_HANDOFF_SCHEMA,
    RMT_VNEXT_RELEASE_MODULE_PATH,
    RMT_VNEXT_RELEASE_SUITE_PATH,
    RMT_VNEXT_REFERENCE_DEMO_PATH,
    RMT_VNEXT_REFERENCE_CORE_PATH
  ], 'Reference registry');
  context.assertIncludes(runner, "id: 'rmt-vnext-release'", 'Runner registers vNext release suite');
  context.assertIncludes(runner, 'node scripts/run_xtend_tests.js rmt-vnext-release', 'Runner help references vNext release suite');
  context.assertIncludes(epic, '- Status: `completed / vNext Release Handoff accepted`', 'Epic 15 marks completion');
  context.assertIncludes(epic, '| `WP-E15-18` | P2 | completed | WS6 |', 'Epic marks WP-E15-18 completed');
  context.assertIncludes(epic, 'Epic 15 ist abgeschlossen', 'Epic documents closure');
}

function runRmtVNextReleaseHandoffSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-release',
    label: 'Epic 15 RMT vNext Release Handoff'
  });
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_RELEASE_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_RELEASE_SUITE_PATH, { rootDir, extension: '.js' });

  [
    RMT_VNEXT_RELEASE_MODULE_PATH,
    RMT_VNEXT_RELEASE_SUITE_PATH,
    RMT_VNEXT_RELEASE_CONTRACT_PATH,
    RMT_VNEXT_RELEASE_WORKPACKAGE_PATH,
    RMT_VNEXT_AUTHORING_GUIDE_PATH,
    RMT_VNEXT_MIGRATION_NOTES_PATH,
    RMT_VNEXT_RELEASE_HANDOFF_DOC_PATH,
    RMT_VNEXT_REFERENCE_DEMO_PATH,
    RMT_VNEXT_REFERENCE_CORE_PATH
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });

  context.assert(moduleSyntax.ok, `vNext release module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext release suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  runPlanChecks(context, rootDir);
  runPackageChecks(context, rootDir);
  runReferenceDemoChecks(context, rootDir);
  runDocumentationChecks(context, rootDir);

  return context.result({
    schema: RMT_VNEXT_RELEASE_HANDOFF_REPORT_SCHEMA,
    handoffSchema: RMT_VNEXT_RELEASE_HANDOFF_SCHEMA,
    gateMatrixSchema: RMT_VNEXT_RELEASE_GATE_MATRIX_SCHEMA,
    workpackage: RMT_VNEXT_RELEASE_WORKPACKAGE,
    module: RMT_VNEXT_RELEASE_MODULE_PATH,
    suite: RMT_VNEXT_RELEASE_SUITE_PATH
  });
}

function printRmtVNextReleaseHandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Release Handoff erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Release Handoff fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextReleaseHandoffReport,
  runRmtVNextReleaseHandoffSuite
};
