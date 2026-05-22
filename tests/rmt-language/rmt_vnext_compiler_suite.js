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
  RMT_FILE_FALLBACK_CODE,
  RMT_VNEXT_COMPILER_MODULE_PATH,
  RMT_VNEXT_COMPILER_PACKAGE_SCRIPT,
  RMT_VNEXT_COMPILER_REPORT_SCHEMA,
  RMT_VNEXT_COMPILER_SCHEMA,
  RMT_VNEXT_COMPILER_SUITE_PATH,
  RMT_VNEXT_COMPILER_WORKPACKAGE,
  RMT_VNEXT_CORE_SCHEMA,
  RMT_VNEXT_PRIMITIVE_LOWERING_SCHEMA,
  RMT_VNEXT_PRIMITIVE_LOWERING_WORKPACKAGE,
  RMT_APP_PLATFORM_RECORDS_SCHEMA,
  RMT_KERNEL_BOUNDARY,
  RMT_KERNEL_RECORDS_SCHEMA,
  compileRmtVNextSource,
  createRmtVNextCompiler,
  serializeRmtVNextCore
} = require('../../tools/rmt-language/vnext-compiler');
const {
  RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES,
  RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_SCHEMA
} = require('../../tools/rmt-language/semantic-graph');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const CORE_CONTRACT_PATH = 'development/XTendRMT-vNext-Core-Format-Contract.md';
const WP_E15_05_PATH = 'development/WP-E15-05-Compiler-DSL-zu-Core-mit-Source-Maps-und-Diagnostics-anbinden.md';
const VALID_MINIMAL_FIXTURE = 'tests/rmt-language/fixtures/vnext-valid-minimal.rmt';
const VALID_COMPLEX_FIXTURE = 'tests/rmt-language/fixtures/vnext-valid-complex.rmt';
const VALID_PRIMITIVE_FIXTURE = 'tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt';
const INVALID_PRIMITIVE_FIXTURE = 'tests/rmt-language/fixtures/vnext-primitives-semantic-invalid.rmt';
const INVALID_CONDITION_CALL_FIXTURE = 'tests/rmt-language/fixtures/vnext-invalid-condition-call.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function parseFixture(relativePath, rootDir) {
  return compileRmtVNextSource({
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir)
  });
}

function assertSourceMapForRecord(context, core, domain, index, message) {
  const record = core[domain] && core[domain][index];
  const sourceRef = record && record.sourceRef;
  const entry = sourceRef && core.sourceMap.find((item) => item.id === sourceRef);
  context.assert(Boolean(entry && entry.corePointer === `/${domain}/${index}`), message);
  context.assert(
    Boolean(entry && entry.range && entry.range.start && entry.range.end),
    `${message} range`
  );
}

function runRmtVNextCompilerSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-compiler',
    label: 'Epic 15 RMT vNext Compiler to Core'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextCompiler;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const coreContract = readText(CORE_CONTRACT_PATH, rootDir);
  const compilerSyntax = syntaxCheckFile(RMT_VNEXT_COMPILER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_COMPILER_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_COMPILER_MODULE_PATH, rootDir, 'vNext compiler module exists');
  assertFileExists(context, RMT_VNEXT_COMPILER_SUITE_PATH, rootDir, 'vNext compiler suite exists');
  assertFileExists(context, WP_E15_05_PATH, rootDir, 'WP-E15-05 workpackage document exists');
  assertFileExists(context, VALID_PRIMITIVE_FIXTURE, rootDir, 'vNext primitive compiler fixture exists');
  assertFileExists(context, INVALID_PRIMITIVE_FIXTURE, rootDir, 'vNext primitive invalid compiler fixture exists');
  context.assert(compilerSyntax.ok, `vNext compiler module syntax passes${compilerSyntax.ok ? '' : ` (${compilerSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext compiler suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_COMPILER_SCHEMA, 'package metadata declares vNext compiler schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_COMPILER_REPORT_SCHEMA, 'package metadata declares vNext compiler report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_COMPILER_WORKPACKAGE, 'package metadata points to WP-E15-05');
  context.assert(metadata && metadata.module === RMT_VNEXT_COMPILER_MODULE_PATH, 'package metadata points to vNext compiler module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_COMPILER_SUITE_PATH, 'package metadata points to vNext compiler suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-compiler --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_COMPILER_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-compiler'] === 'string' ? packageManifest.exports['./rmt-language/vnext-compiler'] : packageManifest.exports['./rmt-language/vnext-compiler'] && packageManifest.exports['./rmt-language/vnext-compiler'].default) === './tools/rmt-language/vnext-compiler.js', 'package exports vNext compiler');
  context.assert(packageManifest.scripts['test:rmt-vnext-compiler'] === 'node scripts/run_xtend_tests.js rmt-vnext-compiler', 'package exposes vNext compiler script');
  context.assert(runner.includes("id: 'rmt-vnext-compiler'"), 'test runner exposes rmt-vnext-compiler suite');
  context.assert(epic.includes('| `WP-E15-05` | P0 | completed | WS1 |'), 'Epic marks WP-E15-05 completed');
  context.assert(
    epic.includes('WP-E15-06` ist `completed`') || epic.includes('| `WP-E15-06` | P1 | completed | WS2 |'),
    'Epic records WP-E15-06 lifecycle handoff'
  );
  context.assert(coreContract.includes('schema: "xtend.rmt.core-format.vnext.v1"'), 'Core contract remains visible');

  const minimalResult = parseFixture(VALID_MINIMAL_FIXTURE, rootDir);
  context.assert(minimalResult.schema === RMT_VNEXT_COMPILER_SCHEMA, 'minimal fixture emits compiler schema');
  context.assert(minimalResult.ok === true, 'minimal fixture compiles successfully');
  context.assert(minimalResult.coreDocument.schema === RMT_VNEXT_CORE_SCHEMA, 'minimal core uses vNext core schema');
  context.assert(minimalResult.coreDocument.kind === 'rmt_document', 'minimal core remains RMT document');
  context.assert(minimalResult.coreDocument.manifest.documentId === 'docs.page', 'minimal manifest documentId derives from template');
  context.assert(minimalResult.coreDocument.templates.length === 1, 'minimal core has one template');
  context.assert(minimalResult.coreDocument.surfaces.length === 1, 'minimal core has one surface');
  context.assert(minimalResult.coreDocument.lanes.length === 1, 'minimal core has one lane');
  context.assert(minimalResult.coreDocument.operations.length === 1, 'minimal core has one operation');
  context.assert(minimalResult.coreDocument.operations[0].op === 'hydrate', 'minimal operation is hydrate');
  assertSourceMapForRecord(context, minimalResult.coreDocument, 'operations', 0, 'minimal operation source map exists');

  const repeatResult = parseFixture(VALID_MINIMAL_FIXTURE, rootDir);
  context.assert(minimalResult.coreJson === repeatResult.coreJson, 'minimal fixture compiles to byte-stable Core JSON');
  context.assert(serializeRmtVNextCore(minimalResult.coreDocument) === minimalResult.coreJson, 'serialize helper matches compiler output');

  const complexResult = parseFixture(VALID_COMPLEX_FIXTURE, rootDir);
  const complex = complexResult.coreDocument;
  context.assert(complexResult.ok === true, 'complex fixture compiles successfully');
  context.assert(complex.imports.length === 1, 'complex core has one import');
  context.assert(complex.templates.length === 1, 'complex core has one template');
  context.assert(complex.surfaces.length === 3, 'complex core has three surfaces');
  context.assert(complex.lanes.length === 4, 'complex core has four lanes');
  context.assert(complex.operations.length === 6, 'complex core has six operations');
  context.assert(complex.slots.length === 1, 'complex core has one slot');
  context.assert(complex.events.length === 1, 'complex core has one event');
  context.assert(complex.dataSources.length === 2, 'complex core has two data sources');
  context.assert(complex.securityPolicies.length === 2, 'complex core has two security policies');
  context.assert(complex.lanes.some((lane) => lane.id === 'lane:docs.page/root/critical' && lane.weight === 10), 'complex core preserves lane weight');
  context.assert(complex.operations.some((operation) => operation.condition && operation.condition.expression.kind === 'binary'), 'complex core compiles condition expression');
  context.assert(complex.operations.some((operation) => operation.kind === 'stream' && operation.source && operation.source.kind === 'sse'), 'complex core compiles stream source');
  context.assert(complex.events[0].action === 'settings.save', 'complex core preserves event action');
  context.assert(complex.securityPolicies.some((policy) => policy.kind === 'trust_boundary'), 'complex core has trust boundary policy');
  context.assert(complex.securityPolicies.some((policy) => policy.kind === 'sanitize' && policy.format === 'html'), 'complex core has sanitize html policy');
  assertSourceMapForRecord(context, complex, 'templates', 0, 'complex template source map exists');
  assertSourceMapForRecord(context, complex, 'surfaces', 0, 'complex surface source map exists');
  assertSourceMapForRecord(context, complex, 'lanes', 0, 'complex lane source map exists');
  assertSourceMapForRecord(context, complex, 'dataSources', 0, 'complex data source source map exists');
  context.assert(
    complex.sourceMap.some((entry) => entry.corePointer.includes('/condition')),
    'complex source map includes inline condition pointer'
  );

  const complexRepeat = parseFixture(VALID_COMPLEX_FIXTURE, rootDir);
  context.assert(complexResult.coreJson === complexRepeat.coreJson, 'complex fixture compiles to byte-stable Core JSON');
  context.assert(JSON.parse(complexResult.coreJson).schema === RMT_VNEXT_CORE_SCHEMA, 'complex Core JSON is parseable');

  const primitiveResult = parseFixture(VALID_PRIMITIVE_FIXTURE, rootDir);
  const primitive = primitiveResult.coreDocument;
  context.assert(primitiveResult.ok === true, 'primitive fixture compiles successfully');
  context.assert(primitiveResult.primitiveLoweringSchema === RMT_VNEXT_PRIMITIVE_LOWERING_SCHEMA, 'primitive compiler result declares lowering schema');
  context.assert(primitiveResult.primitiveLoweringWorkpackage === RMT_VNEXT_PRIMITIVE_LOWERING_WORKPACKAGE, 'primitive compiler result belongs to PRIM-04');
  context.assert(primitiveResult.primitiveSemanticGraph.schema === RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_SCHEMA, 'primitive compile uses PRIM-03 semantic graph');
  context.assert(primitive.states.length === 3, 'primitive core lowers state records');
  context.assert(primitive.selectors.length === 2, 'primitive core lowers selector records');
  context.assert(primitive.dataSources.filter((record) => record.primitive === true).length === 2, 'primitive core lowers datasource records');
  context.assert(primitive.actions.length === 2, 'primitive core lowers action records');
  context.assert(primitive.effects.length === 1, 'primitive core lowers action effects');
  context.assert(primitive.portals.length === 2, 'primitive core lowers portal records');
  context.assert(primitive.overlays.length === 1, 'primitive core lowers overlay records');
  context.assert(primitive.resources.length === 2, 'primitive core lowers resource records');
  context.assert(primitive.surfaces.filter((record) => record.primitive === true).length === 2, 'primitive core lowers surface primitive records');
  context.assert(primitive.events.filter((record) => record.primitive === true).length === 2, 'primitive core lowers direct surface events');
  context.assert(primitive.appPlatform && primitive.appPlatform.schema === RMT_APP_PLATFORM_RECORDS_SCHEMA, 'primitive compile emits App Platform artifact');
  context.assert(primitive.kernelRecords && primitive.kernelRecords.schema === RMT_KERNEL_RECORDS_SCHEMA, 'primitive compile emits Kernel Records artifact');
  context.assert(primitive.kernelRecords.boundary === RMT_KERNEL_BOUNDARY, 'primitive kernel artifact declares host-runtime boundary');
  context.assert(primitive.kernelRecords.schedules.some((record) => record.lane === 'visible'), 'primitive kernel artifact exposes lane schedules');
  context.assert(primitive.kernelRecords.fibers.some((record) => record.op === 'hydrate' && record.source && record.source.kind === 'selector'), 'primitive kernel artifact exposes selector-backed fibers');
  context.assert(primitive.appPlatform.surfaces.some((surface) => surface.id === 'media.player' && surface.repeat && surface.key === 'instance.surfaceId'), 'primitive App Platform artifact preserves keyed surface repeater');
  context.assert(primitive.appPlatform.events.every((event) => event.payloadContract && event.payloadContract.required.length > 0), 'primitive App Platform events preserve payload contracts');
  context.assert(primitive.resources.some((resource) => resource.adapter && resource.adapter.kernelVisible === false), 'primitive host imports stay outside kernel visibility');
  context.assert(primitive.kernelRecords.resourceRecords.every((resource) => !String(JSON.stringify(resource)).includes('@ccslabs/xtend/components')), 'primitive kernel resource records do not expose XTend component imports');
  assertSourceMapForRecord(context, primitive, 'states', 0, 'primitive state source map exists');
  assertSourceMapForRecord(context, primitive, 'actions', 0, 'primitive action source map exists');
  assertSourceMapForRecord(context, primitive, 'events', 0, 'primitive event source map exists');
  context.assert(primitiveResult.primitiveArtifacts && primitiveResult.primitiveArtifacts.sourceMap.length >= 10, 'primitive lowering returns source-map handoff');
  context.assert(primitiveResult.coreJson === parseFixture(VALID_PRIMITIVE_FIXTURE, rootDir).coreJson, 'primitive fixture compiles to byte-stable Core JSON');

  const compiler = createRmtVNextCompiler();
  const fallbackResult = compiler.compileSource({
    text: readText(VALID_MINIMAL_FIXTURE, rootDir),
    filePath: resolveRepoPath('tests/rmt-language/fixtures/vnext-valid-minimal.rmt.json', rootDir)
  });
  context.assert(fallbackResult.ok === true, 'fallback file compiles successfully');
  context.assert(
    fallbackResult.diagnostics.some((diagnostic) => diagnostic.code === RMT_FILE_FALLBACK_CODE),
    'fallback file keeps parser warning in compiler diagnostics'
  );

  const invalidResult = parseFixture(INVALID_CONDITION_CALL_FIXTURE, rootDir);
  context.assert(invalidResult.ok === false, 'invalid source does not compile');
  context.assert(invalidResult.coreDocument === null, 'invalid source has no core document');
  context.assert(invalidResult.diagnostics.some((diagnostic) => diagnostic.severity === 'error'), 'invalid source propagates diagnostics');

  const invalidPrimitiveResult = parseFixture(INVALID_PRIMITIVE_FIXTURE, rootDir);
  context.assert(invalidPrimitiveResult.ok === false, 'invalid primitive source does not lower');
  context.assert(invalidPrimitiveResult.status === 'semantic_error', 'invalid primitive source stops at semantic phase');
  context.assert(invalidPrimitiveResult.coreDocument === null, 'invalid primitive source has no core document');
  context.assert(
    invalidPrimitiveResult.diagnostics.some((diagnostic) => diagnostic.code === RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.unknownReference),
    'invalid primitive source propagates semantic graph diagnostics'
  );

  return context.result({
    schema: RMT_VNEXT_COMPILER_REPORT_SCHEMA,
    compilerSchema: RMT_VNEXT_COMPILER_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_COMPILER_WORKPACKAGE,
    compilerModule: RMT_VNEXT_COMPILER_MODULE_PATH,
    suite: RMT_VNEXT_COMPILER_SUITE_PATH,
    goldenFixtureCount: 3
  });
}

function printRmtVNextCompilerReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Compiler to Core erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Compiler to Core fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextCompilerReport,
  runRmtVNextCompilerSuite
};
