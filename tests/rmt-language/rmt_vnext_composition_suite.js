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
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  COMPOSITION_COMPONENT_ADAPTER_MISSING_CODE,
  COMPOSITION_COMPONENT_SLOT_UNSUPPORTED_CODE,
  COMPOSITION_COMPONENT_UNKNOWN_CODE,
  COMPOSITION_OPERATION_TARGET_UNSUPPORTED_CODE,
  COMPOSITION_SLOT_DUPLICATE_CODE,
  COMPOSITION_SLOT_OPERATION_REF_MISSING_CODE,
  COMPOSITION_SLOT_OPERATION_SCOPE_MISMATCH_CODE,
  COMPOSITION_SLOT_OWNER_MISSING_CODE,
  COMPONENT_BINDING_CAPABILITY,
  COMPONENT_SLOT_CAPABILITY,
  RMT_VNEXT_COMPONENT_ADAPTER_SCHEMA,
  RMT_VNEXT_COMPONENT_BINDING_SCHEMA,
  RMT_VNEXT_COMPONENT_CATALOG_SCHEMA,
  RMT_VNEXT_COMPOSITION_MODULE_PATH,
  RMT_VNEXT_COMPOSITION_PACKAGE_SCRIPT,
  RMT_VNEXT_COMPOSITION_REPORT_SCHEMA,
  RMT_VNEXT_COMPOSITION_SCHEMA,
  RMT_VNEXT_COMPOSITION_SUITE_PATH,
  RMT_VNEXT_COMPOSITION_WORKPACKAGE,
  RMT_VNEXT_SLOT_BINDING_SCHEMA,
  createComponentAdapterStub,
  createCompositionGraph,
  createRmtVNextCompositionContract,
  normalizeComponentCatalog,
  serializeCompositionGraph
} = require('../../tools/rmt-language/vnext-composition');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const COMPOSITION_CONTRACT_PATH = 'development/XTendRMT-vNext-Composition-Component-Binding-Contract.md';
const WP_E15_10_PATH = 'development/WP-E15-10-Slots-Composition-und-Component-Binding-integrieren.md';
const VALID_COMPOSITION_FIXTURE = 'tests/rmt-language/fixtures/vnext-composition-valid.rmt';
const VALID_COMPLEX_FIXTURE = 'tests/rmt-language/fixtures/vnext-valid-complex.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function compileFixture(relativePath, rootDir) {
  return compileRmtVNextSource({
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir)
  });
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function createCompositionCatalog() {
  return [
    {
      id: 'app-shell',
      tag: 'x-app-shell',
      aliases: ['shell'],
      adapter: 'xtend.component',
      slots: ['header', 'body', 'actions']
    },
    {
      id: 'app-header',
      tag: 'x-app-header',
      adapter: 'xtend.component',
      slots: []
    },
    {
      id: 'content-card',
      tag: 'x-content-card',
      adapter: 'xtend.component',
      slots: ['body']
    },
    {
      id: 'content-list',
      tag: 'x-content-list',
      adapter: 'xtend.component',
      slots: []
    },
    {
      id: 'action-bar',
      tag: 'x-action-bar',
      adapter: 'xtend.component',
      slots: []
    }
  ];
}

function createComplexCatalog() {
  return [
    { id: 'docs-header', adapter: 'xtend.component', slots: [] },
    { id: 'docs-content', adapter: 'xtend.component', slots: [] },
    { id: 'search-index', adapter: 'xtend.component', slots: [] },
    { id: 'settings-card', adapter: 'xtend.component', slots: ['body'] },
    { id: 'settings-form', adapter: 'xtend.component', slots: [] }
  ];
}

function createAdapter(capabilities = [
  COMPONENT_BINDING_CAPABILITY,
  COMPONENT_SLOT_CAPABILITY
]) {
  return createComponentAdapterStub({
    id: 'xtend.component',
    capabilities
  });
}

function runRmtVNextCompositionSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-composition',
    label: 'Epic 15 RMT vNext Composition and Component Binding Contract'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextComposition;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const compositionContract = readText(COMPOSITION_CONTRACT_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_COMPOSITION_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_COMPOSITION_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_COMPOSITION_MODULE_PATH, rootDir, 'vNext composition module exists');
  assertFileExists(context, RMT_VNEXT_COMPOSITION_SUITE_PATH, rootDir, 'vNext composition suite exists');
  assertFileExists(context, WP_E15_10_PATH, rootDir, 'WP-E15-10 workpackage document exists');
  assertFileExists(context, VALID_COMPOSITION_FIXTURE, rootDir, 'vNext composition fixture exists');
  context.assert(moduleSyntax.ok, `vNext composition module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext composition suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_COMPOSITION_SCHEMA, 'package metadata declares composition schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.slotBindingSchema === RMT_VNEXT_SLOT_BINDING_SCHEMA, 'package metadata declares slot binding schema');
  context.assert(metadata && metadata.componentBindingSchema === RMT_VNEXT_COMPONENT_BINDING_SCHEMA, 'package metadata declares component binding schema');
  context.assert(metadata && metadata.componentCatalogSchema === RMT_VNEXT_COMPONENT_CATALOG_SCHEMA, 'package metadata declares component catalog schema');
  context.assert(metadata && metadata.componentAdapterSchema === RMT_VNEXT_COMPONENT_ADAPTER_SCHEMA, 'package metadata declares component adapter schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_COMPOSITION_REPORT_SCHEMA, 'package metadata declares composition report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_COMPOSITION_WORKPACKAGE, 'package metadata points to WP-E15-10');
  context.assert(metadata && metadata.module === RMT_VNEXT_COMPOSITION_MODULE_PATH, 'package metadata points to composition module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_COMPOSITION_SUITE_PATH, 'package metadata points to composition suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-composition --json', 'package metadata declares composition local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_COMPOSITION_PACKAGE_SCRIPT, 'package metadata declares composition package script');
  context.assert(packageManifest.exports['./rmt-language/vnext-composition'] === './tools/rmt-language/vnext-composition.js', 'package exports vNext composition contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-composition'] === 'node scripts/run_xtend_tests.js rmt-vnext-composition', 'package exposes vNext composition script');
  context.assert(runner.includes("id: 'rmt-vnext-composition'"), 'test runner exposes rmt-vnext-composition suite');
  context.assert(epic.includes('| `WP-E15-10` | P1 | completed | WS3 |'), 'Epic marks WP-E15-10 completed');
  context.assert(epic.includes('| `WP-E15-11` | P1 | completed | WS3 |'), 'Epic records WP-E15-11 import resolver handoff after composition contract');
  context.assert(compositionContract.includes('schema: "xtend.rmt.vnext-composition.v1"'), 'Composition contract document declares schema');

  const catalog = normalizeComponentCatalog(createCompositionCatalog());
  context.assert(catalog.schema === RMT_VNEXT_COMPONENT_CATALOG_SCHEMA, 'component catalog uses vNext catalog schema');
  context.assert(catalog.count === 5, 'component catalog normalizes five components');
  context.assert(catalog.aliasCount === 1, 'component catalog records one local alias');
  assertIncludesAll(context, catalog.ids, ['app-shell', 'app-header', 'content-card', 'content-list', 'action-bar'], 'component catalog ids');
  const adapter = createAdapter();
  context.assert(adapter.schema === RMT_VNEXT_COMPONENT_ADAPTER_SCHEMA, 'component adapter stub exposes adapter schema');
  assertIncludesAll(context, adapter.capabilities, [COMPONENT_BINDING_CAPABILITY, COMPONENT_SLOT_CAPABILITY], 'component adapter capabilities');

  const compileResult = compileFixture(VALID_COMPOSITION_FIXTURE, rootDir);
  context.assert(compileResult.ok === true, 'composition fixture compiles successfully');
  context.assert(compileResult.coreDocument.schema === RMT_VNEXT_CORE_SCHEMA, 'composition fixture emits vNext core schema');
  context.assert(compileResult.coreDocument.operations.length === 5, 'composition fixture compiles five nested operations');
  context.assert(compileResult.coreDocument.slots.length === 4, 'composition fixture compiles four slots');

  const graph = createCompositionGraph(compileResult.coreDocument, {
    components: createCompositionCatalog(),
    adapters: [adapter],
    requireKnownComponents: true
  });
  context.assert(graph.schema === RMT_VNEXT_COMPOSITION_SCHEMA, 'composition graph emits composition schema');
  context.assert(graph.ok === true, 'composition graph validates successfully');
  context.assert(graph.status === 'ready', 'composition graph is ready');
  context.assert(graph.mode === 'component-orchestration' && graph.markupCoupled === false, 'composition graph remains orchestration, not markup');
  context.assert(graph.slotCount === 4, 'composition graph includes four slot bindings');
  context.assert(graph.componentBindingCount === 5, 'composition graph includes five component bindings');
  context.assert(graph.componentCatalog.count === 5 && graph.componentCatalog.aliasCount === 1, 'composition graph summarizes component catalog');
  context.assert(graph.adapterCatalog.count === 1, 'composition graph summarizes adapter catalog');
  context.assert(graph.slots.every((slot) => slot.schema === RMT_VNEXT_SLOT_BINDING_SCHEMA), 'slot bindings use slot binding schema');
  context.assert(graph.componentBindings.every((binding) => binding.schema === RMT_VNEXT_COMPONENT_BINDING_SCHEMA), 'component bindings use component binding schema');
  context.assert(graph.slots.every((slot) => slot.bindingMode === 'orchestration' && slot.markupMode === 'none'), 'slot bindings do not carry HTML markup');
  context.assert(graph.slots.every((slot) => slot.sourceRef && slot.sourceRef.startsWith('src:slot:')), 'slot bindings keep source refs');
  context.assert(graph.componentBindings.every((binding) => binding.sourceRef && binding.sourceRef.startsWith('src:operation:')), 'component bindings keep source refs');
  context.assert(graph.componentBindings.some((binding) => binding.componentRef === 'shell' && binding.resolvedComponentId === 'app-shell' && binding.alias === true), 'component aliases resolve to catalog components');
  context.assert(graph.byComponent['app-shell'].length === 1, 'byComponent index stores app shell operation');
  context.assert(graph.byComponent['content-card'].length === 1, 'byComponent index stores nested content card operation');
  const bodySlot = graph.slots.find((slot) => slot.ownerComponentId === 'app-shell' && slot.name === 'body');
  const nestedBodySlot = graph.slots.find((slot) => slot.ownerComponentId === 'content-card' && slot.name === 'body');
  context.assert(bodySlot && bodySlot.childComponentRefs.includes('content-card'), 'body slot binds nested content card');
  context.assert(nestedBodySlot && nestedBodySlot.childComponentRefs.includes('content-list'), 'nested body slot binds content list');

  const repeatGraph = createCompositionGraph(compileFixture(VALID_COMPOSITION_FIXTURE, rootDir).coreDocument, {
    components: createCompositionCatalog(),
    adapters: [adapter],
    requireKnownComponents: true
  });
  context.assert(serializeCompositionGraph(graph) === serializeCompositionGraph(repeatGraph), 'composition graph serialization is byte-stable');
  context.assert(JSON.parse(serializeCompositionGraph(graph)).schema === RMT_VNEXT_COMPOSITION_SCHEMA, 'serialized composition graph is parseable JSON');

  const complexResult = compileFixture(VALID_COMPLEX_FIXTURE, rootDir);
  const complexGraph = createCompositionGraph(complexResult.coreDocument, {
    components: createComplexCatalog(),
    adapters: [adapter],
    requireKnownComponents: true
  });
  context.assert(complexGraph.ok === true, 'complex fixture composition validates successfully');
  context.assert(complexGraph.slots.some((slot) => slot.ownerComponentId === 'settings-card' && slot.childComponentRefs.includes('settings-form')), 'complex fixture binds settings slot to nested form');

  const missingOwnerCore = cloneJson(compileResult.coreDocument);
  missingOwnerCore.slots[0].ownerOperation = 'operation:missing';
  const missingOwnerGraph = createCompositionGraph(missingOwnerCore, {
    components: createCompositionCatalog(),
    adapters: [adapter],
    requireKnownComponents: true
  });
  context.assert(missingOwnerGraph.ok === false, 'missing slot owners block composition graph');
  context.assert(missingOwnerGraph.diagnostics.some((diagnostic) => diagnostic.code === COMPOSITION_SLOT_OWNER_MISSING_CODE), 'missing slot owners produce diagnostics');

  const missingOperationCore = cloneJson(compileResult.coreDocument);
  missingOperationCore.slots[0].operationRefs.push('operation:missing');
  const missingOperationGraph = createCompositionGraph(missingOperationCore, {
    components: createCompositionCatalog(),
    adapters: [adapter],
    requireKnownComponents: true
  });
  context.assert(missingOperationGraph.ok === false, 'missing nested operation refs block composition graph');
  context.assert(missingOperationGraph.diagnostics.some((diagnostic) => diagnostic.code === COMPOSITION_SLOT_OPERATION_REF_MISSING_CODE), 'missing nested operation refs produce diagnostics');

  const duplicateSlotCore = cloneJson(compileResult.coreDocument);
  duplicateSlotCore.slots.push(cloneJson(duplicateSlotCore.slots[0]));
  const duplicateSlotGraph = createCompositionGraph(duplicateSlotCore, {
    components: createCompositionCatalog(),
    adapters: [adapter],
    requireKnownComponents: true
  });
  context.assert(duplicateSlotGraph.ok === false, 'duplicate slots block composition graph');
  context.assert(duplicateSlotGraph.diagnostics.some((diagnostic) => diagnostic.code === COMPOSITION_SLOT_DUPLICATE_CODE), 'duplicate slots produce diagnostics');

  const mismatchCore = cloneJson(compileResult.coreDocument);
  mismatchCore.operations[1].scope.lane = 'lane:other';
  const mismatchGraph = createCompositionGraph(mismatchCore, {
    components: createCompositionCatalog(),
    adapters: [adapter],
    requireKnownComponents: true
  });
  context.assert(mismatchGraph.ok === false, 'nested operation scope mismatches block composition graph');
  context.assert(mismatchGraph.diagnostics.some((diagnostic) => diagnostic.code === COMPOSITION_SLOT_OPERATION_SCOPE_MISMATCH_CODE), 'nested operation scope mismatches produce diagnostics');

  const unknownComponentCore = cloneJson(compileResult.coreDocument);
  unknownComponentCore.operations[2].target.ref = 'unknown-card';
  const unknownComponentGraph = createCompositionGraph(unknownComponentCore, {
    components: createCompositionCatalog(),
    adapters: [adapter],
    requireKnownComponents: true
  });
  context.assert(unknownComponentGraph.ok === false, 'unknown components block composition graph when catalog validation is required');
  context.assert(unknownComponentGraph.diagnostics.some((diagnostic) => diagnostic.code === COMPOSITION_COMPONENT_UNKNOWN_CODE), 'unknown components produce diagnostics');

  const unsupportedSlotGraph = createCompositionGraph(compileResult.coreDocument, {
    components: createCompositionCatalog().map((component) => component.id === 'app-shell'
      ? { ...component, slots: ['header', 'actions'] }
      : component),
    adapters: [adapter],
    requireKnownComponents: true
  });
  context.assert(unsupportedSlotGraph.ok === false, 'unsupported component slots block composition graph');
  context.assert(unsupportedSlotGraph.diagnostics.some((diagnostic) => diagnostic.code === COMPOSITION_COMPONENT_SLOT_UNSUPPORTED_CODE), 'unsupported component slots produce diagnostics');

  const missingAdapterGraph = createCompositionGraph(compileResult.coreDocument, {
    components: createCompositionCatalog(),
    adapters: [createAdapter([COMPONENT_BINDING_CAPABILITY])],
    requireKnownComponents: true
  });
  context.assert(missingAdapterGraph.ok === false, 'missing slot adapter capability blocks composition graph');
  context.assert(missingAdapterGraph.diagnostics.some((diagnostic) => diagnostic.code === COMPOSITION_COMPONENT_ADAPTER_MISSING_CODE), 'missing adapter capability produces diagnostics');

  const unsupportedTargetCore = cloneJson(compileResult.coreDocument);
  unsupportedTargetCore.operations[0].target.kind = 'inline_code';
  const unsupportedTargetGraph = createCompositionGraph(unsupportedTargetCore, {
    components: createCompositionCatalog(),
    adapters: [adapter],
    requireKnownComponents: true
  });
  context.assert(unsupportedTargetGraph.ok === false, 'unsupported operation target kinds block composition graph');
  context.assert(unsupportedTargetGraph.diagnostics.some((diagnostic) => diagnostic.code === COMPOSITION_OPERATION_TARGET_UNSUPPORTED_CODE), 'unsupported operation target kinds produce diagnostics');

  const factory = createRmtVNextCompositionContract({
    components: createCompositionCatalog(),
    adapters: [adapter],
    requireKnownComponents: true
  });
  context.assert(factory.schema === RMT_VNEXT_COMPOSITION_SCHEMA, 'factory exposes composition schema');
  context.assert(factory.slotBindingSchema === RMT_VNEXT_SLOT_BINDING_SCHEMA, 'factory exposes slot binding schema');
  context.assert(factory.componentBindingSchema === RMT_VNEXT_COMPONENT_BINDING_SCHEMA, 'factory exposes component binding schema');
  context.assert(factory.createGraph(compileResult.coreDocument).ok === true, 'factory creates composition graph');

  return context.result({
    schema: RMT_VNEXT_COMPOSITION_REPORT_SCHEMA,
    compositionSchema: RMT_VNEXT_COMPOSITION_SCHEMA,
    slotBindingSchema: RMT_VNEXT_SLOT_BINDING_SCHEMA,
    componentBindingSchema: RMT_VNEXT_COMPONENT_BINDING_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_COMPOSITION_WORKPACKAGE,
    compositionModule: RMT_VNEXT_COMPOSITION_MODULE_PATH,
    suite: RMT_VNEXT_COMPOSITION_SUITE_PATH,
    slotCount: graph.slotCount,
    componentBindingCount: graph.componentBindingCount
  });
}

function printRmtVNextCompositionReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Composition and Component Binding Contract erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Composition and Component Binding Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextCompositionReport,
  runRmtVNextCompositionSuite
};
