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
  RMT_APP_ORCHESTRATION_SCHEMA,
  RMT_APP_ORCHESTRATION_WORKPACKAGE,
  RMT_APP_SERVICE_DEMANDS_SCHEMA,
  RMT_COMPONENT_COMMAND_SCHEMA,
  RMT_FORM_VALIDATION_SCHEMA,
  RMT_SURFACE_TRANSITION_SCHEMA,
  RMT_VNEXT_CORE_SCHEMA,
  RMT_VNEXT_PRIMITIVE_LOWERING_SCHEMA,
  RMT_VNEXT_PRIMITIVE_LOWERING_WORKPACKAGE,
  RMT_APP_PLATFORM_RECORDS_SCHEMA,
  RMT_KERNEL_BOUNDARY,
  RMT_KERNEL_RECORDS_SCHEMA,
  compileRmtVNextSource,
  createRmtAppServiceDemands,
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
const VALID_RESUMABILITY_FIXTURE = 'tests/rmt-language/fixtures/vnext-resumability-valid.rmt';
const VALID_PRIMITIVE_FIXTURE = 'tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt';
const VALID_RESPONSIVE_BOUNDS_FIXTURE = 'tests/rmt-language/fixtures/vnext-responsive-bounds-valid.rmt';
const VALID_MARACA_ORCHESTRATION_FIXTURE = 'tests/rmt-language/fixtures/maraca-orchestration-app.rmt';
const VALID_MARACA_VALIDATION_FIXTURE = 'tests/rmt-language/fixtures/maraca-validation-app.rmt';
const VALID_MARACA_TRANSITIONS_FIXTURE = 'tests/rmt-language/fixtures/maraca-transitions-app.rmt';
const VALID_XTEXTAREA_PARITY_FIXTURE = 'tests/rmt-language/fixtures/vnext-xtextarea-parity.rmt';
const VALID_NESTED_LOCAL_PORTALS_FIXTURE = 'tests/rmt-language/fixtures/vnext-nested-local-portals.rmt';
const INVALID_PRIMITIVE_FIXTURE = 'tests/rmt-language/fixtures/vnext-primitives-semantic-invalid.rmt';
const INVALID_CONDITION_CALL_FIXTURE = 'tests/rmt-language/fixtures/vnext-invalid-condition-call.rmt';
const INVALID_RESPONSIVE_BOUNDS_FIXED_STRING_FIXTURE = 'tests/rmt-language/fixtures/vnext-responsive-bounds-fixed-string-invalid.rmt';
const INVALID_RESPONSIVE_BOUNDS_UNQUOTED_FIXTURE = 'tests/rmt-language/fixtures/vnext-responsive-bounds-unquoted-invalid.rmt';
const INVALID_RESPONSIVE_BOUNDS_CSS_FIXTURE = 'tests/rmt-language/fixtures/vnext-responsive-bounds-css-invalid.rmt';
const INVALID_RESPONSIVE_BOUNDS_MODE_FIXTURE = 'tests/rmt-language/fixtures/vnext-responsive-bounds-mode-invalid.rmt';

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
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextCompiler;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const coreContract = readText(CORE_CONTRACT_PATH, rootDir);
  const compilerSyntax = syntaxCheckFile(RMT_VNEXT_COMPILER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_COMPILER_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_COMPILER_MODULE_PATH, rootDir, 'vNext compiler module exists');
  assertFileExists(context, RMT_VNEXT_COMPILER_SUITE_PATH, rootDir, 'vNext compiler suite exists');
  assertFileExists(context, WP_E15_05_PATH, rootDir, 'WP-E15-05 workpackage document exists');
  assertFileExists(context, VALID_PRIMITIVE_FIXTURE, rootDir, 'vNext primitive compiler fixture exists');
  assertFileExists(context, VALID_RESPONSIVE_BOUNDS_FIXTURE, rootDir, 'vNext responsive bounds compiler fixture exists');
  assertFileExists(context, VALID_MARACA_ORCHESTRATION_FIXTURE, rootDir, 'Maraca orchestration compiler fixture exists');
  assertFileExists(context, VALID_MARACA_VALIDATION_FIXTURE, rootDir, 'Maraca validation compiler fixture exists');
  assertFileExists(context, VALID_MARACA_TRANSITIONS_FIXTURE, rootDir, 'Maraca transitions compiler fixture exists');
  assertFileExists(context, VALID_XTEXTAREA_PARITY_FIXTURE, rootDir, 'XTextarea parity compiler fixture exists');
  assertFileExists(context, VALID_NESTED_LOCAL_PORTALS_FIXTURE, rootDir, 'Nested local portals compiler fixture exists');
  assertFileExists(context, INVALID_PRIMITIVE_FIXTURE, rootDir, 'vNext primitive invalid compiler fixture exists');
  assertFileExists(context, INVALID_RESPONSIVE_BOUNDS_FIXED_STRING_FIXTURE, rootDir, 'vNext responsive bounds fixed-string invalid fixture exists');
  assertFileExists(context, INVALID_RESPONSIVE_BOUNDS_UNQUOTED_FIXTURE, rootDir, 'vNext responsive bounds unquoted invalid fixture exists');
  assertFileExists(context, INVALID_RESPONSIVE_BOUNDS_CSS_FIXTURE, rootDir, 'vNext responsive bounds css invalid fixture exists');
  assertFileExists(context, INVALID_RESPONSIVE_BOUNDS_MODE_FIXTURE, rootDir, 'vNext responsive bounds mode invalid fixture exists');
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
  context.assert(runner.hasSuite("rmt-vnext-compiler"), 'test runner exposes rmt-vnext-compiler suite');
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
  context.assert(minimalResult.appServiceDemands && minimalResult.appServiceDemands.schema === RMT_APP_SERVICE_DEMANDS_SCHEMA, 'minimal compile emits app-service demand manifest');
  context.assert(minimalResult.appServiceDemands.services.length === 0, 'minimal compile emits an empty app-service demand list');
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

  const resumability = parseFixture(VALID_RESUMABILITY_FIXTURE, rootDir);
  context.assert(resumability.ok === true, 'resumability fixture compiles successfully');
  context.assert(resumability.coreDocument.operations.some((operation) => operation.op === 'resume'), 'resumability fixture lowers resume lifecycle operation');
  context.assert(resumability.coreDocument.hydrationPolicies.some((policy) => policy.kind === 'resumability' && policy.mode === 'server_prerender_resume'), 'resumability policies lower to core hydration policy records');
  context.assert(resumability.coreDocument.hydrationPolicies.some((policy) => policy.snapshot === 'surface_state'), 'resumability snapshot metadata lowers to core');
  context.assert(resumability.coreDocument.hydrationPolicies.some((policy) => policy.eventReplay === 'intent_queue'), 'resumability event replay metadata lowers to core');
  const resumabilityRecords = resumability.orchestrationArtifacts.hydration.records.filter((record) => record.resumability && record.resumability.requested);
  context.assert(resumabilityRecords.length === 2, 'resumability lowers a typed record for hydrate and resume lifecycle operations');
  context.assert(resumabilityRecords.every((record) => record.explicitPolicy === true), 'resumability counts as an explicit hydration policy');
  context.assert(resumabilityRecords.every((record) => record.resumability.snapshot === 'surface_state'), 'resumability snapshot survives orchestration lowering');
  context.assert(resumabilityRecords.every((record) => record.resumability.eventReplay === 'intent_queue'), 'resumability event replay survives orchestration lowering');
  context.assert(resumabilityRecords.every((record) => record.resumability.integrity === 'signed_manifest'), 'resumability integrity survives orchestration lowering');
  context.assert(resumability.orchestrationArtifacts.hydration.serverResumability.requested === true, 'server resumability capability reports the request');

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
  context.assert(primitiveResult.orchestrationArtifacts && primitiveResult.orchestrationArtifacts.schema === RMT_APP_ORCHESTRATION_SCHEMA, 'primitive compile emits app orchestration artifact');
  context.assert(primitiveResult.orchestrationArtifacts.workpackage === RMT_APP_ORCHESTRATION_WORKPACKAGE, 'primitive orchestration artifact declares workpackage');
  context.assert(primitiveResult.coreJson === parseFixture(VALID_PRIMITIVE_FIXTURE, rootDir).coreJson, 'primitive fixture compiles to byte-stable Core JSON');

  const appServiceSource = `template app.services {
  state app.result type object initial {}

  datasource app.zeta from host "service.zeta" {
    mode stream
    contract ZetaResult
    result records
  }

  datasource app.alpha from host "service.alpha" {
    mode invoke
    contract AlphaResult
    result payload
  }

  action app.watch {
    input cursor string
    effect stream datasource app.zeta
    reduce state.app.result = result.records
  }

  action app.load {
    input zeta string
    input query string {
      trust boundary "xtend.security.sanitizing-boundary.v1"
      sanitize text
    }
    effect fetch datasource app.alpha
    reduce state.app.result = result.payload
  }

  action app.cache {
    effect fetch datasource app.alpha
    reduce state.app.result = result.payload
  }
}`;
  const appServiceResult = compileRmtVNextSource({
    text: appServiceSource,
    filePath: resolveRepoPath('tmp/rmt-vnext-app-services.rmt', rootDir)
  });
  const appServiceDemands = appServiceResult.appServiceDemands;
  const repeatedAppServiceDemands = compileRmtVNextSource({
    text: appServiceSource,
    filePath: resolveRepoPath('tmp/rmt-vnext-app-services.rmt', rootDir)
  }).appServiceDemands;
  const changedContractDemands = compileRmtVNextSource({
    text: appServiceSource.replace('contract AlphaResult', 'contract AlphaResultV2'),
    filePath: resolveRepoPath('tmp/rmt-vnext-app-services.rmt', rootDir)
  }).appServiceDemands;
  const invalidAppServiceMode = compileRmtVNextSource({
    text: appServiceSource.replace('mode invoke', 'mode parallel'),
    filePath: resolveRepoPath('tmp/rmt-vnext-app-services-invalid-mode.rmt', rootDir)
  });
  const missingAppServiceInputPolicy = compileRmtVNextSource({
    text: appServiceSource.replace('      sanitize text\n', ''),
    filePath: resolveRepoPath('tmp/rmt-vnext-app-services-policy-missing.rmt', rootDir)
  });
  const unknownAppServiceInputBoundary = compileRmtVNextSource({
    text: appServiceSource.replace('xtend.security.sanitizing-boundary.v1', 'xtend.security.unknown-boundary.v1'),
    filePath: resolveRepoPath('tmp/rmt-vnext-app-services-policy-boundary-invalid.rmt', rootDir)
  });
  const unknownAppServiceInputSanitizer = compileRmtVNextSource({
    text: appServiceSource.replace('sanitize text', 'sanitize html'),
    filePath: resolveRepoPath('tmp/rmt-vnext-app-services-policy-sanitizer-invalid.rmt', rootDir)
  });
  const conflictingAppServiceInputPolicy = compileRmtVNextSource({
    text: appServiceSource.replace('  action app.cache {', `  action app.loadAgain {
    input query string
    effect fetch datasource app.alpha
    reduce state.app.result = result.payload
  }

  action app.cache {`),
    filePath: resolveRepoPath('tmp/rmt-vnext-app-services-policy-conflict.rmt', rootDir)
  });
  const duplicateAppServiceId = compileRmtVNextSource({
    text: appServiceSource
      .replace('from host "service.zeta"', 'from host "service.alpha"')
      .replace('input cursor string', 'input query string'),
    filePath: resolveRepoPath('tmp/rmt-vnext-app-services-duplicate-id.rmt', rootDir)
  });
  const directAppServiceDemands = createRmtAppServiceDemands(appServiceResult.coreDocument);
  const alphaServiceDemand = appServiceDemands && appServiceDemands.services.find((service) => service.id === 'service.alpha');
  const zetaServiceDemand = appServiceDemands && appServiceDemands.services.find((service) => service.id === 'service.zeta');
  context.assert(appServiceResult.ok === true, 'host app-service fixture compiles successfully');
  context.assert(appServiceDemands && appServiceDemands.schema === RMT_APP_SERVICE_DEMANDS_SCHEMA, 'host datasource emits versioned app-service demand schema');
  context.assert(appServiceDemands && appServiceDemands.sourceDocument.id === 'app.services', 'app-service demand manifest identifies its RMT source document');
  context.assert(appServiceDemands && appServiceDemands.services.map((service) => service.id).join(',') === 'service.alpha,service.zeta', 'app-service demands sort services deterministically by host service ID');
  context.assert(alphaServiceDemand && alphaServiceDemand.dataSource === 'app.alpha' && alphaServiceDemand.mode === 'invoke', 'fetch host datasource emits invoke service demand');
  context.assert(alphaServiceDemand && alphaServiceDemand.contract === 'AlphaResult' && alphaServiceDemand.resultPath === 'payload', 'invoke service demand preserves declared contract and result path');
  context.assert(alphaServiceDemand && alphaServiceDemand.actions.map((action) => action.id).join(',') === 'app.cache,app.load', 'invoke service demand sorts all referencing actions');
  context.assert(alphaServiceDemand && alphaServiceDemand.actions[1].inputs.map((input) => input.name).join(',') === 'query,zeta' && alphaServiceDemand.actions[1].inputs[0].type === 'string', 'referencing action preserves and sorts typed input facts');
  context.assert(alphaServiceDemand && alphaServiceDemand.inputPolicy && alphaServiceDemand.inputPolicy.schema === 'xtend.maraca.app-service-input-policy.v1', 'service demand emits a versioned input policy');
  context.assert(alphaServiceDemand && alphaServiceDemand.inputPolicy.fields[0].name === 'query' && alphaServiceDemand.inputPolicy.fields[0].boundary === 'xtend.security.sanitizing-boundary.v1' && alphaServiceDemand.inputPolicy.fields[0].sanitize === 'text', 'service demand preserves the canonical per-field TrustBoundary');
  context.assert(zetaServiceDemand && zetaServiceDemand.mode === 'stream' && zetaServiceDemand.actions[0].mode === 'stream', 'stream effect emits stream service demand');
  context.assert(invalidAppServiceMode.ok === false && invalidAppServiceMode.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.datasource.mode_invalid'), 'invalid explicit datasource service mode is source-diagnosed');
  context.assert(missingAppServiceInputPolicy.ok === false && missingAppServiceInputPolicy.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.app_service.input_policy_missing' && diagnostic.range), 'partial AppService input policy fails with a source range');
  context.assert(unknownAppServiceInputBoundary.ok === false && unknownAppServiceInputBoundary.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.app_service.input_policy_boundary_unknown' && diagnostic.range), 'unknown AppService input boundary fails with a source range');
  context.assert(unknownAppServiceInputSanitizer.ok === false && unknownAppServiceInputSanitizer.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.app_service.input_policy_sanitize_unknown' && diagnostic.range), 'unsupported AppService input sanitizer fails with a source range');
  context.assert(conflictingAppServiceInputPolicy.ok === false && conflictingAppServiceInputPolicy.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.app_service.input_policy_conflict' && diagnostic.range), 'inconsistent policies for the same service field fail with a source range');
  const duplicateServiceDiagnostic = duplicateAppServiceId.diagnostics.find((diagnostic) => diagnostic.code === 'rmt.vnext.app_service.service_id_conflict');
  context.assert(duplicateAppServiceId.ok === false, 'two datasources cannot own the same AppService ID');
  context.assert(Boolean(duplicateServiceDiagnostic && duplicateServiceDiagnostic.range && duplicateServiceDiagnostic.range.endOffset > duplicateServiceDiagnostic.range.startOffset), 'duplicate AppService ID fails with the conflicting datasource source range');
  context.assert(appServiceDemands && /^[a-f0-9]{64}$/u.test(appServiceDemands.fingerprint), 'app-service demand manifest emits SHA-256 fingerprint');
  context.assert(JSON.stringify(appServiceDemands) === JSON.stringify(repeatedAppServiceDemands), 'app-service demand manifest is byte-stable across repeated compiles');
  context.assert(JSON.stringify(appServiceDemands) === JSON.stringify(directAppServiceDemands), 'public demand factory matches compiler result');
  context.assert(changedContractDemands && changedContractDemands.fingerprint !== appServiceDemands.fingerprint, 'app-service demand fingerprint changes with contract facts');
  context.assert(!appServiceResult.coreJson.includes(RMT_APP_SERVICE_DEMANDS_SCHEMA), 'app-service demand emission leaves serialized Core artifact unchanged');

  const responsiveBoundsResult = parseFixture(VALID_RESPONSIVE_BOUNDS_FIXTURE, rootDir);
  const responsiveSurface = responsiveBoundsResult.coreDocument && responsiveBoundsResult.coreDocument.surfaces.find((surface) => surface.name === 'responsive.window');
  const responsiveDescriptor = responsiveBoundsResult.orchestrationArtifacts && responsiveBoundsResult.orchestrationArtifacts.render.descriptors.find((descriptor) => descriptor.surface === 'responsive.window' || descriptor.component === 'x-surface-window');
  context.assert(responsiveBoundsResult.ok === true, 'responsive bounds fixture compiles successfully');
  context.assert(responsiveSurface && responsiveSurface.bounds.mode === 'responsive', 'responsive bounds core preserves mode');
  context.assert(responsiveSurface && responsiveSurface.bounds.scope === 'viewport', 'responsive bounds core preserves scope');
  context.assert(responsiveSurface && responsiveSurface.bounds.width === 'clamp(20rem, 70vi, 52rem)', 'responsive bounds core preserves CSS width');
  context.assert(responsiveSurface && responsiveSurface.bounds.height === 'min(80dvh, 42rem)', 'responsive bounds core preserves CSS height');
  context.assert(responsiveSurface && responsiveSurface.bounds.minWidth === '18rem', 'responsive bounds core preserves CSS minWidth');
  context.assert(responsiveSurface && responsiveSurface.bounds.maxHeight === '48rem', 'responsive bounds core preserves CSS maxHeight');
  context.assert(responsiveDescriptor && responsiveDescriptor.attributes['bounds-mode'].value === 'responsive', 'responsive bounds descriptor emits bounds-mode');
  context.assert(responsiveDescriptor && responsiveDescriptor.attributes['bounds-scope'].value === 'viewport', 'responsive bounds descriptor emits bounds-scope');
  context.assert(responsiveDescriptor && responsiveDescriptor.attributes['initial-width'].value === 'clamp(20rem, 70vi, 52rem)', 'responsive bounds descriptor emits CSS initial width');
  context.assert(responsiveDescriptor && responsiveDescriptor.attributes['initial-min-width'].value === '18rem', 'responsive bounds descriptor emits CSS initial min width');
  context.assert(responsiveDescriptor && responsiveDescriptor.attributes['initial-max-height'].value === '48rem', 'responsive bounds descriptor emits CSS initial max height');

  const maracaOrchestrationResult = parseFixture(VALID_MARACA_ORCHESTRATION_FIXTURE, rootDir);
  const maracaOrchestration = maracaOrchestrationResult.orchestrationArtifacts;
  context.assert(maracaOrchestrationResult.ok === true, 'Maraca orchestration fixture compiles successfully');
  context.assert(maracaOrchestration && maracaOrchestration.schema === RMT_APP_ORCHESTRATION_SCHEMA, 'Maraca fixture emits app orchestration schema');
  context.assert(maracaOrchestration.runtimeOrder[0] === 'kernel', 'Maraca orchestration runtime order starts with kernel boot');
  context.assert(maracaOrchestration.kernel && maracaOrchestration.kernel.records && maracaOrchestration.kernel.records.schema === RMT_KERNEL_RECORDS_SCHEMA, 'Maraca orchestration artifact includes kernel records');
  context.assert(maracaOrchestration.kernel.scheduler && maracaOrchestration.kernel.scheduler.schedules.length >= 10, 'Maraca orchestration artifact includes detailed kernel scheduler plan with hydration/action/event endpoints');
  context.assert(maracaOrchestration.kernel.scheduler.fibers.length >= 10, 'Maraca orchestration artifact includes detailed kernel fiber plan with hydration/action/event fibers');
  context.assert(maracaOrchestration.kernel.scheduler.fibers.some((fiber) => fiber.op === 'state-change' && fiber.kind === 'orchestration'), 'Kernel scheduler plan includes state-change orchestration fiber');
  context.assert(maracaOrchestration.kernel.scheduler.fibers.some((fiber) => fiber.kind === 'hydration' || fiber.op === 'hydrate'), 'Kernel scheduler plan includes hydration fiber');
  context.assert(maracaOrchestration.kernel.scheduler.fibers.some((fiber) => fiber.kind === 'action' && fiber.target && fiber.target.ref === 'demo.orchestration.save'), 'Kernel scheduler plan includes action-specific fiber');
  context.assert(maracaOrchestration.kernel.scheduler.schedules.every((schedule) => schedule.endpointName && schedule.scope), 'Kernel scheduler schedules have endpoint names and scopes');
  context.assert(maracaOrchestration.kernel.sourceMap.some((entry) => entry.nodeType === 'RmtLaneDeclaration'), 'Kernel source map points back to lane records');
  context.assert(maracaOrchestration.kernel.sourceMap.some((entry) => entry.nodeType === 'RmtLifecycleStatement'), 'Kernel source map points back to lifecycle records');
  context.assert(maracaOrchestration.state.states.length >= 2, 'Maraca orchestration artifact includes state records');
  context.assert(maracaOrchestration.state.selectors.length >= 2, 'Maraca orchestration artifact includes selector records');
  context.assert(maracaOrchestration.state.reducers.some((reducer) => reducer.action === 'demo.orchestration.save' && reducer.state === 'demo.orchestration.status' && reducer.path === 'text' && reducer.value === 'Saved'), 'Maraca orchestration artifact lowers reducer patch plan');
  const unsafeReducerResult = compileRmtVNextSource({
    text: readText(VALID_MARACA_ORCHESTRATION_FIXTURE, rootDir).replace(
      'reduce state.demo.orchestration.status.text = "Saved"',
      'reduce state.demo.orchestration.status.__proto__.xtendPollutedCompiler = "polluted"'
    ),
    filePath: resolveRepoPath(VALID_MARACA_ORCHESTRATION_FIXTURE, rootDir)
  });
  const unsafeReducers = unsafeReducerResult.orchestrationArtifacts && unsafeReducerResult.orchestrationArtifacts.state.reducers || [];
  context.assert(unsafeReducerResult.ok === true, 'Unsafe reducer fixture still compiles without preserving polluted path');
  context.assert(!unsafeReducers.some((reducer) => reducer.path.includes('__proto__') || reducer.path.includes('constructor') || reducer.path.includes('prototype')), 'Compiler drops reducer paths with prototype pollution segments');
  context.assert(maracaOrchestration.actions.dataSources.some((source) => source.id === 'demo.orchestration.save' && source.kind === 'rest'), 'Maraca orchestration artifact lowers REST datasource placeholder');
  context.assert(maracaOrchestration.events.some((event) => event.action === 'demo.orchestration.save' && event.payloadContract && event.payloadContract.required.includes('label')), 'Maraca orchestration artifact includes typed event bindings');
  context.assert(maracaOrchestration.resources.some((resource) => resource.id === 'demo.orchestration.timer' && resource.owner), 'Maraca orchestration artifact includes owned resources');
  context.assert(maracaOrchestration.portals.some((portal) => portal.id === 'surface.root'), 'Maraca orchestration artifact includes surface portal');
  context.assert(maracaOrchestration.overlays.some((overlay) => overlay.id === 'feedback.toast'), 'Maraca orchestration artifact includes overlay records');
  context.assert(maracaOrchestration.render.mode === 'dom-descriptor' && maracaOrchestration.render.descriptors.length >= 2, 'Maraca orchestration artifact emits DOM render descriptors');
  for (const descriptor of maracaOrchestration.render.descriptors) {
    context.assert(!Object.hasOwn(descriptor.styleTokens || {}, 'surface'), `${descriptor.surface}: generated identity does not override the surface theme color`);
    context.assert(descriptor.attributes['data-rmt-surface'].value === descriptor.surface, `${descriptor.surface}: surface identity remains available to navigation and event routing`);
  }
  const themedOrchestration = compileRmtVNextSource({
    text: readText(VALID_MARACA_ORCHESTRATION_FIXTURE, rootDir).replace('initial {', 'initial {\n      viewTemplate { styleTokens { surface "#fbfcf9" } }'),
    filePath: resolveRepoPath(VALID_MARACA_ORCHESTRATION_FIXTURE, rootDir)
  });
  context.assert(themedOrchestration.ok === true, 'Explicit surface color tokens compile');
  context.assert(themedOrchestration.orchestrationArtifacts.render.descriptors.some(descriptor => descriptor.styleTokens.surface === '#fbfcf9'), 'Author-defined surface colors remain available');
  const nestedPortalSource = readText(VALID_NESTED_LOCAL_PORTALS_FIXTURE, rootDir);
  const nestedPortalResult = parseFixture(VALID_NESTED_LOCAL_PORTALS_FIXTURE, rootDir);
  const nestedPortalRoot = nestedPortalResult.orchestrationArtifacts && nestedPortalResult.orchestrationArtifacts.render.root;
  const nestedShellDescriptor = nestedPortalRoot && nestedPortalRoot.children && nestedPortalRoot.children.find((descriptor) => descriptor.surface === 'demo.nested.shell');
  const nestedFormDescriptor = nestedShellDescriptor && nestedShellDescriptor.children && nestedShellDescriptor.children.find((descriptor) => descriptor.surface === 'demo.nested.form');
  const nestedFieldsDescriptor = nestedFormDescriptor && nestedFormDescriptor.children && nestedFormDescriptor.children.find((descriptor) => descriptor.attributes && descriptor.attributes.id === 'demo-nested-fields');
  const nestedEditorDescriptor = nestedFieldsDescriptor && nestedFieldsDescriptor.children && nestedFieldsDescriptor.children.find((descriptor) => descriptor.surface === 'demo.nested.editor');
  const cyclicPortalResult = compileRmtVNextSource({
    text: nestedPortalSource.replace('root "#xtend-maraca-root"', 'root "[data-maraca-surface=\'demo.nested.editor\']"'),
    filePath: resolveRepoPath('tmp/vnext-nested-local-portals-cycle.rmt', rootDir)
  });
  const unresolvedPortalResult = compileRmtVNextSource({
    text: nestedPortalSource.replace('root "#xtend-maraca-root"', 'root "[data-maraca-surface=\'demo.nested.missing\']"'),
    filePath: resolveRepoPath('tmp/vnext-nested-local-portals-unresolved.rmt', rootDir)
  });
  const ambiguousPortalResult = compileRmtVNextSource({
    text: nestedPortalSource.replace('root "#xtend-maraca-root"', 'root "[data-maraca-surface=\'demo.nested.shell\'], [data-maraca-surface=\'demo.nested.form\']"'),
    filePath: resolveRepoPath('tmp/vnext-nested-local-portals-ambiguous.rmt', rootDir)
  });
  context.assert(nestedPortalResult.ok === true, 'Nested local portal fixture compiles successfully');
  context.assert(nestedShellDescriptor && nestedShellDescriptor.attributes['layout-engine'] === '$model.demo.nested.shell.layoutEngine', 'RMT layoutEngine state binds the public layout-engine attribute');
  context.assert(nestedFormDescriptor && nestedFormDescriptor.attributes.slot && nestedFormDescriptor.attributes.slot.value === 'windows', 'Direct x-surface-manager child receives the public windows slot');
  context.assert(nestedFieldsDescriptor && nestedFieldsDescriptor.attributes['data-xtm-slot'] === 'fields', 'Static viewTemplate portal target remains an explicit light-DOM group wrapper');
  context.assert(nestedEditorDescriptor && !nestedEditorDescriptor.attributes.slot, 'Static viewTemplate portal child is compiled into its group wrapper without a manager slot');
  const conditionalTarget = '{ type "element" tag "div" attributes { id "demo-nested-fields" "data-xtm-slot" "fields" } }';
  const conditionalSource = nestedPortalSource.replace(/\{\s*type "element"\s*tag "div"\s*attributes \{ id "demo-nested-fields" "data-xtm-slot" "fields" \}\s*\}/u, `{ type "conditional" test true then ${conditionalTarget} }`);
  const conditionalPortal = compileRmtVNextSource({text:conditionalSource,filePath:resolveRepoPath('tmp/conditional-portal.rmt',rootDir)});
  const conditionalForm = conditionalPortal.orchestrationArtifacts?.render.root.children[0].children.find(node=>node.surface==='demo.nested.form');
  context.assert(conditionalPortal.ok && conditionalForm?.children[0].then.children.some(node=>node.surface==='demo.nested.editor'), 'Conditional portal children remain inside the active branch');
  const duplicateBranch = compileRmtVNextSource({text:conditionalSource.replace(`then ${conditionalTarget}`,`then ${conditionalTarget} else ${conditionalTarget}`),filePath:resolveRepoPath('tmp/duplicate-conditional-portal.rmt',rootDir)});
  context.assert(!duplicateBranch.ok && duplicateBranch.diagnostics.some(item=>item.code==='rmt.app_orchestration.portal_target_ambiguous'), 'Duplicate portal targets across conditional branches fail closed');
  context.assert(cyclicPortalResult.ok === false && cyclicPortalResult.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.app_orchestration.portal_parent_cycle' && diagnostic.severity === 'error'), 'Cyclic local portal parents fail closed');
  context.assert(unresolvedPortalResult.ok === false && unresolvedPortalResult.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.app_orchestration.portal_parent_unresolved' && diagnostic.severity === 'error'), 'Unknown local portal parents fail closed');
  context.assert(ambiguousPortalResult.ok === false && ambiguousPortalResult.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.app_orchestration.portal_parent_ambiguous' && diagnostic.severity === 'error'), 'Ambiguous local portal parents fail closed');
  context.assert(maracaOrchestration.hydration && maracaOrchestration.hydration.schema === 'xtend.rmt.app-hydration-plan.v1', 'Maraca orchestration artifact emits hydration plan');
  context.assert(maracaOrchestration.hydration.records.length >= 2, 'Maraca hydration plan includes lifecycle hydration records');
  context.assert(maracaOrchestration.runtimeGraph && maracaOrchestration.runtimeGraph.schema === 'xtend.rmt.app-runtime-graph.v1', 'Maraca orchestration artifact emits runtime graph');
  context.assert(maracaOrchestration.patchPlan && maracaOrchestration.patchPlan.schema === 'xtend.rmt.app-patch-plan.v1', 'Maraca orchestration artifact emits patch plan');
  context.assert(maracaOrchestration.hostContracts && maracaOrchestration.hostContracts.requiredCapabilities.includes('scheduler.scheduleEndpoint'), 'Maraca orchestration artifact emits host contracts');
  context.assert(maracaOrchestration.telemetry && maracaOrchestration.telemetry.customEvents.includes('xtend-maraca:hydration-start'), 'Maraca orchestration artifact emits telemetry plan');
  const statusDescriptor = maracaOrchestration.render.descriptors.find((descriptor) => descriptor.component === 'x-status');
  const buttonDescriptor = maracaOrchestration.render.descriptors.find((descriptor) => descriptor.component === 'x-button');
  const panelDescriptor = maracaOrchestration.render.descriptors.find((descriptor) => descriptor.component === 'x-side-panel');
  context.assert(statusDescriptor && statusDescriptor.attributes['data-maraca-surface'].op === 'literal', 'Maraca render descriptors keep surface IDs as literals');
  context.assert(statusDescriptor && statusDescriptor.attributes.type === '$model.demo.orchestration.status.tone', 'Maraca status descriptor maps tone to x-status type');
  context.assert(buttonDescriptor && buttonDescriptor.attributes.variant === '$model.demo.orchestration.command.tone', 'Maraca button descriptor maps tone to x-button variant');
  context.assert(panelDescriptor && panelDescriptor.attributes.collapsible === '$model.demo.orchestration.panel.collapsible', 'Maraca side panel descriptor maps collapsible capability');
  context.assert(panelDescriptor && panelDescriptor.attributes.closable === '$model.demo.orchestration.panel.closable', 'Maraca side panel descriptor maps closable capability');
  context.assert(panelDescriptor && panelDescriptor.attributes.pinnable === '$model.demo.orchestration.panel.pinnable', 'Maraca side panel descriptor maps pinnable capability');
  context.assert(maracaOrchestration.css.mode === 'layout-tokens' && maracaOrchestration.css.themeGeneration === false, 'Maraca orchestration artifact emits layout/token CSS plan only');
  context.assert(maracaOrchestration.security.htmlSinks === 'forbidden' && maracaOrchestration.security.shadowRootAccess === false, 'Maraca orchestration artifact declares safety boundaries');
  context.assert(maracaOrchestration.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'), 'Maraca orchestration artifact has no blocking diagnostics');
  context.assert(maracaOrchestration.sourceMap.some((entry) => entry.nodeType === 'RmtActionDeclaration'), 'Maraca orchestration source map includes action records');
  context.assert(maracaOrchestration.sourceMap.some((entry) => entry.nodeType === 'RmtEventBinding'), 'Maraca orchestration source map includes event records');
  context.assert(maracaOrchestration.sourceMap.some((entry) => entry.nodeType === 'RmtSurfaceDeclaration'), 'Maraca orchestration source map includes surface records');

  const textareaParityResult = parseFixture(VALID_XTEXTAREA_PARITY_FIXTURE, rootDir);
  const textareaDescriptor = textareaParityResult.orchestrationArtifacts && textareaParityResult.orchestrationArtifacts.render.descriptors.find((descriptor) => descriptor.component === 'x-textarea');
  const textareaAttributes = textareaDescriptor && textareaDescriptor.attributes || {};
  const textareaSlots = textareaDescriptor && textareaDescriptor.children || [];
  const expectedTextareaBindings = {
    name: '$model.demo.textarea.parity.name',
    value: '$model.demo.textarea.parity.value',
    placeholder: '$model.demo.textarea.parity.placeholder',
    label: '$model.demo.textarea.parity.label',
    required: '$model.demo.textarea.parity.required',
    disabled: '$model.demo.textarea.parity.disabled',
    readonly: '$model.demo.textarea.parity.readonly',
    busy: '$model.demo.textarea.parity.busy',
    invalid: '$model.demo.textarea.parity.invalid',
    rows: '$model.demo.textarea.parity.rows',
    minlength: '$model.demo.textarea.parity.minLength',
    maxlength: '$model.demo.textarea.parity.maxLength',
    density: '$model.demo.textarea.parity.density',
    fill: '$model.demo.textarea.parity.fill',
    'submit-on-enter': '$model.demo.textarea.parity.submitOnEnter',
    'submit-command': '$model.demo.textarea.parity.submitCommand',
    highlight: '$model.demo.textarea.parity.highlight',
    'syntax-highlight': '$model.demo.textarea.parity.syntaxHighlight',
    'line-numbering': '$model.demo.textarea.parity.lineNumbering',
    lang: '$model.demo.textarea.parity.lang',
    language: '$model.demo.textarea.parity.language'
  };
  context.assert(textareaParityResult.ok === true, 'XTextarea parity fixture compiles successfully');
  Object.entries(expectedTextareaBindings).forEach(([attribute, binding]) => {
    context.assert(textareaAttributes[attribute] === binding, `XTextarea descriptor binds ${attribute}`);
  });
  ['label', 'hint', 'error'].forEach((slotName) => {
    context.assert(textareaSlots.some((child) => child && child.attributes && child.attributes.slot && child.attributes.slot.value === slotName && child.text === `$model.demo.textarea.parity.${slotName}`), `XTextarea descriptor materializes ${slotName} slot`);
  });
  ['textarea-changed', 'textarea-invalid', 'textarea-submit'].forEach((eventName) => {
    context.assert(textareaDescriptor && textareaDescriptor.bindings.some((binding) => binding.includes(`/${eventName}/`)), `XTextarea descriptor binds ${eventName}`);
  });

  const componentCommandSource = `template demo.commands {
  action demo.doFocus {
    effect focus selector demo.editor
  }
  action demo.doReset {
    effect reset selector demo.editor
  }
  action demo.capture {
    effect snapshot selector demo.editor
  }
  surface demo.editor kind field component x-textarea {
  }
}`;
  const componentCommandResult = compileRmtVNextSource({
    text: componentCommandSource,
    filePath: resolveRepoPath('tmp/rmt-vnext-component-commands.rmt', rootDir)
  });
  const componentCommandEffects = componentCommandResult.orchestrationArtifacts && componentCommandResult.orchestrationArtifacts.actions.effects || [];
  context.assert(componentCommandResult.ok === true, 'declarative XTextarea component commands compile successfully');
  context.assert(componentCommandEffects.length === 3, 'component command actions lower three orchestration effects');
  context.assert(
    componentCommandEffects.every((effect) => effect.componentCommand && effect.componentCommand.schema === RMT_COMPONENT_COMMAND_SCHEMA),
    'component command effects carry the public component-command schema'
  );
  context.assert(
    componentCommandEffects.map((effect) => effect.command).join(',') === 'focus,reset,snapshot',
    'component command effects preserve the fixed command allowlist'
  );
  context.assert(
    componentCommandEffects.every((effect) => effect.target === 'demo.editor'
      && effect.componentCommand.target.kind === 'surface'
      && effect.componentCommand.target.id === 'demo.editor'
      && effect.componentCommand.target.ref === 'surface:demo.commands/demo.editor'
      && effect.componentCommand.target.component === 'x-textarea'),
    'component command effects resolve selector authoring to a static XTextarea surface target'
  );

  const unknownComponentCommandTarget = compileRmtVNextSource({
    text: `template demo.commands {
  action demo.doFocus {
    effect focus selector demo.missing
  }
  surface demo.editor kind field component x-textarea {
  }
}`,
    filePath: resolveRepoPath('tmp/rmt-vnext-component-command-target-unknown.rmt', rootDir)
  });
  const unknownTargetDiagnostic = unknownComponentCommandTarget.diagnostics.find((diagnostic) => diagnostic.code === 'rmt.vnext.component_command.target_unknown');
  context.assert(unknownComponentCommandTarget.ok === false && unknownComponentCommandTarget.phase === 'semantic', 'unknown component command surface fails before lowering');
  context.assert(Boolean(unknownTargetDiagnostic && unknownTargetDiagnostic.range && unknownTargetDiagnostic.range.endOffset > unknownTargetDiagnostic.range.startOffset), 'unknown component command target diagnostic carries its source range');

  const ineligibleComponentCommandTarget = compileRmtVNextSource({
    text: `template demo.commands {
  action demo.doFocus {
    effect focus selector demo.button
  }
  surface demo.button kind action component x-button {
  }
}`,
    filePath: resolveRepoPath('tmp/rmt-vnext-component-command-target-ineligible.rmt', rootDir)
  });
  const ineligibleTargetDiagnostic = ineligibleComponentCommandTarget.diagnostics.find((diagnostic) => diagnostic.code === 'rmt.vnext.component_command.target_ineligible');
  context.assert(ineligibleComponentCommandTarget.ok === false, 'component command rejects an ineligible surface component');
  context.assert(Boolean(ineligibleTargetDiagnostic && ineligibleTargetDiagnostic.range && ineligibleTargetDiagnostic.range.endOffset > ineligibleTargetDiagnostic.range.startOffset), 'ineligible component command diagnostic carries its target source range');

  const invalidComponentCommand = compileRmtVNextSource({
    text: `template demo.commands {
  action demo.launch {
    effect launch selector demo.editor
  }
  surface demo.editor kind field component x-textarea {
  }
}`,
    filePath: resolveRepoPath('tmp/rmt-vnext-component-command-invalid.rmt', rootDir)
  });
  const invalidCommandDiagnostic = invalidComponentCommand.diagnostics.find((diagnostic) => diagnostic.code === 'rmt.vnext.component_command.command_invalid');
  context.assert(invalidComponentCommand.ok === false, 'arbitrary component method names fail compilation');
  context.assert(Boolean(invalidCommandDiagnostic && invalidCommandDiagnostic.range && invalidCommandDiagnostic.range.endOffset > invalidCommandDiagnostic.range.startOffset), 'invalid component command diagnostic carries its command source range');

  const customSelectorEffect = compileRmtVNextSource({
    text: `template demo.commands {
  action demo.play {
    effect remote-play selector demo.player
  }
  surface demo.player kind media component x-player {
  }
}`,
    filePath: resolveRepoPath('tmp/rmt-vnext-custom-selector-effect.rmt', rootDir)
  });
  const customSelectorEffectRecord = customSelectorEffect.orchestrationArtifacts && customSelectorEffect.orchestrationArtifacts.actions.effects[0];
  context.assert(customSelectorEffect.ok === true, 'selector effects for components outside the component-command contract remain compatible');
  context.assert(customSelectorEffectRecord && customSelectorEffectRecord.kind === 'remote-play' && !customSelectorEffectRecord.componentCommand, 'custom selector effects remain on the generic effect-adapter path');

  const invalidComponentCommandSource = compileRmtVNextSource({
    text: `template demo.commands {
  action demo.doFocus {
    effect focus
  }
  surface demo.editor kind field component x-textarea {
  }
}`,
    filePath: resolveRepoPath('tmp/rmt-vnext-component-command-source-invalid.rmt', rootDir)
  });
  const invalidTargetDiagnostic = invalidComponentCommandSource.diagnostics.find((diagnostic) => diagnostic.code === 'rmt.vnext.component_command.target_invalid');
  context.assert(invalidComponentCommandSource.ok === false, 'component command without selector surface target fails compilation');
  context.assert(Boolean(invalidTargetDiagnostic && invalidTargetDiagnostic.range && invalidTargetDiagnostic.range.endOffset > invalidTargetDiagnostic.range.startOffset), 'invalid component command source diagnostic carries its command source range');

  const maracaValidationResult = parseFixture(VALID_MARACA_VALIDATION_FIXTURE, rootDir);
  const maracaValidation = maracaValidationResult.orchestrationArtifacts && maracaValidationResult.orchestrationArtifacts.validation;
  context.assert(maracaValidationResult.ok === true, 'Maraca validation fixture compiles successfully');
  context.assert(maracaValidation && maracaValidation.schema === RMT_FORM_VALIDATION_SCHEMA, 'Maraca validation fixture emits form-validation schema');
  context.assert(maracaValidation.groups.length === 1, 'Maraca validation fixture emits one validation group');
  context.assert(maracaValidation.fields.length === 2, 'Maraca validation fixture emits field rules');
  context.assert(maracaValidation.fields.some((field) => field.state === 'demo.validation.email' && field.rules.some((rule) => rule.kind === 'email')), 'Maraca validation fixture lowers email rule');
  context.assert(maracaValidation.actionGates.some((gate) => gate.action === 'demo.validation.next' && gate.group === 'demo.validation.contact'), 'Maraca validation fixture emits action gate');
  context.assert(maracaValidation.statePatches.some((patch) => patch.targetState === 'demo.validation.next' && patch.path === 'disabled'), 'Maraca validation fixture emits command disabled patch');
  context.assert(maracaValidation.schedulerTargets.some((target) => target.operation === 'operation:xtend.rmt/validation/demo.validation.contact/demo.validation.next'), 'Maraca validation fixture emits scheduler target');
  context.assert(maracaValidationResult.orchestrationArtifacts.kernel.scheduler.fibers.some((fiber) => fiber.kind === 'validation' && fiber.operation === 'operation:xtend.rmt/validation/demo.validation.contact/demo.validation.next'), 'Kernel scheduler includes validation fiber');
  context.assert(maracaValidationResult.orchestrationArtifacts.runtimeGraph.edges.some((edge) => edge.kind === 'validation-action-gate'), 'Runtime graph connects validation to action gates');
  context.assert(maracaValidationResult.orchestrationArtifacts.patchPlan.validation.some((patch) => patch.targetState === 'demo.validation.next'), 'Patch plan includes validation command patch');
  context.assert(maracaValidationResult.orchestrationArtifacts.hostContracts.requiredCapabilities.includes('formValidation.evaluate'), 'Host contracts include validation capability');
  context.assert(maracaValidation.sourceMap.some((entry) => entry.nodeType === 'RmtValidationDeclaration'), 'Validation source map points back to declaration records');

  const maracaTransitionsResult = parseFixture(VALID_MARACA_TRANSITIONS_FIXTURE, rootDir);
  const maracaTransitions = maracaTransitionsResult.orchestrationArtifacts && maracaTransitionsResult.orchestrationArtifacts.transitions;
  const maracaAnimationEngine = maracaTransitionsResult.orchestrationArtifacts && maracaTransitionsResult.orchestrationArtifacts.animationEngine;
  context.assert(maracaTransitionsResult.ok === true, 'Maraca transitions fixture compiles successfully');
  context.assert(maracaTransitions && maracaTransitions.schema === RMT_SURFACE_TRANSITION_SCHEMA, 'Maraca transitions fixture emits surface-transition schema');
  context.assert(maracaTransitions.transitions.length === 2, 'Maraca transitions fixture emits transition records');
  context.assert(maracaTransitions.transitions.some((transition) => transition.effect === 'crossfade' && transition.durationMs === 120), 'Maraca transitions fixture lowers effect and duration');
  context.assert(maracaTransitions.animationEngine && maracaTransitions.animationEngine.schema === 'xtend.rmt.animation-engine.v1', 'Surface transition compatibility view embeds AnimationEngine artifact');
  context.assert(maracaAnimationEngine && maracaAnimationEngine.schema === 'xtend.rmt.animation-engine.v1', 'Maraca transitions fixture emits AnimationEngine schema');
  context.assert(maracaAnimationEngine.animations.some((animation) => animation.id === 'demo.transitions.motion' && animation.effect === 'pop'), 'AnimationEngine lowers reusable animation preset');
  context.assert(maracaAnimationEngine.transitions.some((transition) => transition.animation === 'demo.transitions.motion' && transition.phasing === 'overlap'), 'AnimationEngine lowers transition animation reference and crossfade overlap phasing');
  context.assert(maracaAnimationEngine.timelines.length >= 1, 'AnimationEngine lowers transition timeline steps');
  context.assert(maracaTransitions.schedulerTargets.every((target) => target.kind === 'surface-transition' && target.operation && target.endpointName), 'Maraca transitions fixture emits scheduler targets');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.kernel.scheduler.fibers.some((fiber) => fiber.kind === 'surface-transition' && fiber.operation === 'operation:xtend.rmt/surface-transition/demo.transitions.contactToIssue'), 'Kernel scheduler includes surface-transition fiber');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.runtimeGraph.edges.some((edge) => edge.kind === 'action-transition-trigger'), 'Runtime graph connects actions to transitions');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.patchPlan.reducers.some((patch) => patch.strategy === 'surface-transition' && patch.transition === 'demo.transitions.contactToIssue'), 'Patch plan marks transition hidden reducers');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.patchPlan.transitions.length === 2, 'Patch plan includes transition patch records');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.hostContracts.requiredCapabilities.includes('surfaceTransition.run'), 'Host contracts include surface transition capability');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.hostContracts.requiredCapabilities.includes('animationEngine.run'), 'Host contracts include AnimationEngine capability');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.telemetry.customEvents.includes('xtend-maraca:surface-transition-start'), 'Telemetry plan includes transition start event');
  context.assert(maracaTransitions.sourceMap.some((entry) => entry.nodeType === 'RmtTransitionDeclaration'), 'Transition source map points back to declaration records');
  context.assert(maracaAnimationEngine.sourceMap.some((entry) => entry.nodeType === 'RmtAnimationDeclaration'), 'AnimationEngine source map points back to animation declaration records');

  const compiler = createRmtVNextCompiler();
  context.assert(compiler.appServiceDemandsSchema === RMT_APP_SERVICE_DEMANDS_SCHEMA, 'compiler factory advertises app-service demand schema');
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

  const invalidFixedBounds = parseFixture(INVALID_RESPONSIVE_BOUNDS_FIXED_STRING_FIXTURE, rootDir);
  context.assert(invalidFixedBounds.ok === false, 'fixed string bounds fixture does not compile cleanly');
  context.assert(invalidFixedBounds.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.surface.bounds.fixed_requires_number'), 'fixed string bounds fixture reports fixed_requires_number');

  const invalidUnquotedBounds = parseFixture(INVALID_RESPONSIVE_BOUNDS_UNQUOTED_FIXTURE, rootDir);
  context.assert(invalidUnquotedBounds.ok === false, 'unquoted responsive bounds fixture does not compile cleanly');
  context.assert(invalidUnquotedBounds.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.surface.bounds.css_value_unquoted'), 'unquoted responsive bounds fixture reports css_value_unquoted');

  const invalidCssBounds = parseFixture(INVALID_RESPONSIVE_BOUNDS_CSS_FIXTURE, rootDir);
  context.assert(invalidCssBounds.ok === false, 'invalid CSS responsive bounds fixture does not compile cleanly');
  context.assert(invalidCssBounds.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.surface.bounds.css_value_invalid'), 'invalid CSS responsive bounds fixture reports css_value_invalid');

  const invalidModeBounds = parseFixture(INVALID_RESPONSIVE_BOUNDS_MODE_FIXTURE, rootDir);
  context.assert(invalidModeBounds.ok === false, 'invalid bounds mode fixture does not compile cleanly');
  context.assert(invalidModeBounds.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.surface.bounds.mode_invalid'), 'invalid bounds mode fixture reports mode_invalid');

  const unsafeOwnerResult = compileRmtVNextSource({
    text: `template unsafe.owner {
  state secret.anchor type object initial {}
  resource leaked.socket kind subscription owner state.secret.anchor {
    source endpoint socket
    dispose on surface.destroy
  }
}`,
    filePath: resolveRepoPath('tmp/rmt-vnext-unsafe-owner.rmt', rootDir)
  });
  context.assert(unsafeOwnerResult.ok === false, 'state-owned primitive resource does not compile');
  context.assert(unsafeOwnerResult.coreDocument === null, 'state-owned primitive resource emits no core document');
  context.assert(
    unsafeOwnerResult.diagnostics.some((diagnostic) => diagnostic.code === RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.ownerMissing),
    'state-owned primitive resource is diagnosed as invalid owner scope'
  );

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
