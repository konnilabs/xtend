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
  RMT_FORM_VALIDATION_SCHEMA,
  RMT_SURFACE_TRANSITION_SCHEMA,
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
const VALID_MARACA_ORCHESTRATION_FIXTURE = 'tests/rmt-language/fixtures/maraca-orchestration-app.rmt';
const VALID_MARACA_VALIDATION_FIXTURE = 'tests/rmt-language/fixtures/maraca-validation-app.rmt';
const VALID_MARACA_TRANSITIONS_FIXTURE = 'tests/rmt-language/fixtures/maraca-transitions-app.rmt';
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
  assertFileExists(context, VALID_MARACA_ORCHESTRATION_FIXTURE, rootDir, 'Maraca orchestration compiler fixture exists');
  assertFileExists(context, VALID_MARACA_VALIDATION_FIXTURE, rootDir, 'Maraca validation compiler fixture exists');
  assertFileExists(context, VALID_MARACA_TRANSITIONS_FIXTURE, rootDir, 'Maraca transitions compiler fixture exists');
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
  context.assert(primitiveResult.orchestrationArtifacts && primitiveResult.orchestrationArtifacts.schema === RMT_APP_ORCHESTRATION_SCHEMA, 'primitive compile emits app orchestration artifact');
  context.assert(primitiveResult.orchestrationArtifacts.workpackage === RMT_APP_ORCHESTRATION_WORKPACKAGE, 'primitive orchestration artifact declares workpackage');
  context.assert(primitiveResult.coreJson === parseFixture(VALID_PRIMITIVE_FIXTURE, rootDir).coreJson, 'primitive fixture compiles to byte-stable Core JSON');

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
  context.assert(maracaOrchestration.actions.dataSources.some((source) => source.id === 'demo.orchestration.save' && source.kind === 'rest'), 'Maraca orchestration artifact lowers REST datasource placeholder');
  context.assert(maracaOrchestration.events.some((event) => event.action === 'demo.orchestration.save' && event.payloadContract && event.payloadContract.required.includes('label')), 'Maraca orchestration artifact includes typed event bindings');
  context.assert(maracaOrchestration.resources.some((resource) => resource.id === 'demo.orchestration.timer' && resource.owner), 'Maraca orchestration artifact includes owned resources');
  context.assert(maracaOrchestration.portals.some((portal) => portal.id === 'surface.root'), 'Maraca orchestration artifact includes surface portal');
  context.assert(maracaOrchestration.overlays.some((overlay) => overlay.id === 'feedback.toast'), 'Maraca orchestration artifact includes overlay records');
  context.assert(maracaOrchestration.render.mode === 'dom-descriptor' && maracaOrchestration.render.descriptors.length >= 2, 'Maraca orchestration artifact emits DOM render descriptors');
  context.assert(maracaOrchestration.hydration && maracaOrchestration.hydration.schema === 'xtend.rmt.app-hydration-plan.v1', 'Maraca orchestration artifact emits hydration plan');
  context.assert(maracaOrchestration.hydration.records.length >= 2, 'Maraca hydration plan includes lifecycle hydration records');
  context.assert(maracaOrchestration.runtimeGraph && maracaOrchestration.runtimeGraph.schema === 'xtend.rmt.app-runtime-graph.v1', 'Maraca orchestration artifact emits runtime graph');
  context.assert(maracaOrchestration.patchPlan && maracaOrchestration.patchPlan.schema === 'xtend.rmt.app-patch-plan.v1', 'Maraca orchestration artifact emits patch plan');
  context.assert(maracaOrchestration.hostContracts && maracaOrchestration.hostContracts.requiredCapabilities.includes('scheduler.scheduleEndpoint'), 'Maraca orchestration artifact emits host contracts');
  context.assert(maracaOrchestration.telemetry && maracaOrchestration.telemetry.customEvents.includes('xtend-maraca:hydration-start'), 'Maraca orchestration artifact emits telemetry plan');
  const statusDescriptor = maracaOrchestration.render.descriptors.find((descriptor) => descriptor.component === 'x-status');
  const buttonDescriptor = maracaOrchestration.render.descriptors.find((descriptor) => descriptor.component === 'x-button');
  context.assert(statusDescriptor && statusDescriptor.attributes['data-maraca-surface'].op === 'literal', 'Maraca render descriptors keep surface IDs as literals');
  context.assert(statusDescriptor && statusDescriptor.attributes.type === '$model.demo.orchestration.status.tone', 'Maraca status descriptor maps tone to x-status type');
  context.assert(buttonDescriptor && buttonDescriptor.attributes.variant === '$model.demo.orchestration.command.tone', 'Maraca button descriptor maps tone to x-button variant');
  context.assert(maracaOrchestration.css.mode === 'layout-tokens' && maracaOrchestration.css.themeGeneration === false, 'Maraca orchestration artifact emits layout/token CSS plan only');
  context.assert(maracaOrchestration.security.htmlSinks === 'forbidden' && maracaOrchestration.security.shadowRootAccess === false, 'Maraca orchestration artifact declares safety boundaries');
  context.assert(maracaOrchestration.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'), 'Maraca orchestration artifact has no blocking diagnostics');
  context.assert(maracaOrchestration.sourceMap.some((entry) => entry.nodeType === 'RmtActionDeclaration'), 'Maraca orchestration source map includes action records');
  context.assert(maracaOrchestration.sourceMap.some((entry) => entry.nodeType === 'RmtEventBinding'), 'Maraca orchestration source map includes event records');
  context.assert(maracaOrchestration.sourceMap.some((entry) => entry.nodeType === 'RmtSurfaceDeclaration'), 'Maraca orchestration source map includes surface records');

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
  context.assert(maracaTransitionsResult.ok === true, 'Maraca transitions fixture compiles successfully');
  context.assert(maracaTransitions && maracaTransitions.schema === RMT_SURFACE_TRANSITION_SCHEMA, 'Maraca transitions fixture emits surface-transition schema');
  context.assert(maracaTransitions.transitions.length === 2, 'Maraca transitions fixture emits transition records');
  context.assert(maracaTransitions.transitions.some((transition) => transition.effect === 'crossfade' && transition.durationMs === 120), 'Maraca transitions fixture lowers effect and duration');
  context.assert(maracaTransitions.schedulerTargets.every((target) => target.kind === 'surface-transition' && target.operation && target.endpointName), 'Maraca transitions fixture emits scheduler targets');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.kernel.scheduler.fibers.some((fiber) => fiber.kind === 'surface-transition' && fiber.operation === 'operation:xtend.rmt/surface-transition/demo.transitions.contactToIssue'), 'Kernel scheduler includes surface-transition fiber');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.runtimeGraph.edges.some((edge) => edge.kind === 'action-transition-trigger'), 'Runtime graph connects actions to transitions');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.patchPlan.reducers.some((patch) => patch.strategy === 'surface-transition' && patch.transition === 'demo.transitions.contactToIssue'), 'Patch plan marks transition hidden reducers');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.patchPlan.transitions.length === 2, 'Patch plan includes transition patch records');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.hostContracts.requiredCapabilities.includes('surfaceTransition.run'), 'Host contracts include surface transition capability');
  context.assert(maracaTransitionsResult.orchestrationArtifacts.telemetry.customEvents.includes('xtend-maraca:surface-transition-start'), 'Telemetry plan includes transition start event');
  context.assert(maracaTransitions.sourceMap.some((entry) => entry.nodeType === 'RmtTransitionDeclaration'), 'Transition source map points back to declaration records');

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
