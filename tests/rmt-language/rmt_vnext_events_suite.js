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
  ACTION_INVOKE_CAPABILITY,
  DATA_SOURCE_ADAPTER_MISSING_CODE,
  DATA_SOURCE_KIND_CAPABILITIES,
  DATA_SOURCE_KIND_MISMATCH_CODE,
  DATA_SOURCE_KIND_UNSUPPORTED_CODE,
  DATA_SOURCE_KINDS,
  DATA_SOURCE_OPERATION_REF_MISMATCH_CODE,
  DATA_SOURCE_OWNER_MISSING_CODE,
  DATA_SOURCE_PAYLOAD_SHAPE_MISSING_CODE,
  DATA_SOURCE_UNKNOWN_CODE,
  EVENT_ACTION_ADAPTER_MISSING_CODE,
  EVENT_ACTION_UNKNOWN_CODE,
  EVENT_BINDING_ADAPTER_MISSING_CODE,
  EVENT_BINDING_CAPABILITY,
  EVENT_DUPLICATE_CODE,
  EVENT_OWNER_MISSING_CODE,
  EVENT_PAYLOAD_SHAPE_MISSING_CODE,
  RMT_VNEXT_ACTION_CATALOG_SCHEMA,
  RMT_VNEXT_ACTION_REF_SCHEMA,
  RMT_VNEXT_DATA_SOURCE_CATALOG_SCHEMA,
  RMT_VNEXT_DATA_SOURCE_SCHEMA,
  RMT_VNEXT_EVENT_ACTION_ADAPTER_SCHEMA,
  RMT_VNEXT_EVENT_ACTION_MODULE_PATH,
  RMT_VNEXT_EVENT_ACTION_PACKAGE_SCRIPT,
  RMT_VNEXT_EVENT_ACTION_REPORT_SCHEMA,
  RMT_VNEXT_EVENT_ACTION_SCHEMA,
  RMT_VNEXT_EVENT_ACTION_SUITE_PATH,
  RMT_VNEXT_EVENT_ACTION_WORKPACKAGE,
  RMT_VNEXT_EVENT_BINDING_SCHEMA,
  createEventActionAdapterStub,
  createEventActionContract,
  createRmtVNextEventActionContract,
  normalizeActionCatalog,
  normalizeDataSourceCatalog,
  serializeEventActionContract
} = require('../../tools/rmt-language/vnext-events');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const EVENT_CONTRACT_PATH = 'development/XTendRMT-vNext-Event-Action-DataSource-Contract.md';
const WP_E15_12_PATH = 'development/WP-E15-12-Events-Actions-und-Data-Sources-anbinden.md';
const VALID_EVENTS_FIXTURE = 'tests/rmt-language/fixtures/vnext-events-valid.rmt';
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

function createActionCatalog() {
  return [
    {
      id: 'settings.save',
      payloadShape: {
        type: 'object',
        required: ['formId'],
        properties: {
          formId: 'string',
          dirty: 'boolean'
        }
      },
      resultShape: {
        type: 'object',
        properties: {
          ok: 'boolean'
        }
      }
    },
    {
      id: 'settings.cancel',
      payloadShape: {
        type: 'object',
        properties: {
          reason: 'string'
        }
      }
    }
  ];
}

function createComplexActions() {
  return [
    {
      id: 'settings.save',
      payloadShape: {
        type: 'object',
        properties: {
          formId: 'string'
        }
      }
    }
  ];
}

function createDataSourceCatalog() {
  return [
    {
      id: 'settings.load',
      kind: 'endpoint',
      resultShape: {
        type: 'object',
        properties: {
          settings: 'object'
        }
      }
    },
    {
      id: 'preview.render',
      kind: 'worker',
      resultShape: {
        type: 'object',
        properties: {
          html: 'string'
        }
      }
    },
    {
      id: 'notifications.feed',
      kind: 'sse',
      resultShape: {
        type: 'object',
        properties: {
          id: 'string',
          message: 'string'
        }
      }
    }
  ];
}

function createComplexDataSources() {
  return [
    {
      id: 'settings.load',
      kind: 'endpoint',
      resultShape: {
        type: 'object',
        properties: {
          settings: 'object'
        }
      }
    },
    {
      id: 'docs.feed',
      kind: 'sse',
      resultShape: {
        type: 'object',
        properties: {
          item: 'object'
        }
      }
    }
  ];
}

function createAdapters(capabilityOverrides = null) {
  if (capabilityOverrides) {
    return capabilityOverrides.map((entry) => createEventActionAdapterStub(entry));
  }

  return [
    createEventActionAdapterStub({
      id: 'xtend.event',
      capabilities: [EVENT_BINDING_CAPABILITY]
    }),
    createEventActionAdapterStub({
      id: 'xtend.action',
      capabilities: [ACTION_INVOKE_CAPABILITY]
    }),
    createEventActionAdapterStub({
      id: 'xtend.data.endpoint',
      capabilities: [DATA_SOURCE_KIND_CAPABILITIES.endpoint]
    }),
    createEventActionAdapterStub({
      id: 'xtend.data.sse',
      capabilities: [DATA_SOURCE_KIND_CAPABILITIES.sse]
    }),
    createEventActionAdapterStub({
      id: 'xtend.data.worker',
      capabilities: [DATA_SOURCE_KIND_CAPABILITIES.worker]
    })
  ];
}

function createStrictContract(coreDocument, overrides = {}) {
  return createEventActionContract(coreDocument, {
    actions: createActionCatalog(),
    dataSources: createDataSourceCatalog(),
    adapters: createAdapters(),
    requireKnownActions: true,
    requireKnownDataSources: true,
    strictPayloadShapes: true,
    eventPayloadShapes: {
      submit: {
        type: 'object',
        properties: {
          formId: 'string'
        }
      },
      cancel: {
        type: 'object',
        properties: {
          reason: 'string'
        }
      }
    },
    ...overrides
  });
}

function runRmtVNextEventsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-events',
    label: 'Epic 15 RMT vNext Event, Action and Data Source Contract'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextEvents;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const eventContract = readText(EVENT_CONTRACT_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_EVENT_ACTION_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_EVENT_ACTION_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_EVENT_ACTION_MODULE_PATH, rootDir, 'vNext event/action module exists');
  assertFileExists(context, RMT_VNEXT_EVENT_ACTION_SUITE_PATH, rootDir, 'vNext event/action suite exists');
  assertFileExists(context, WP_E15_12_PATH, rootDir, 'WP-E15-12 workpackage document exists');
  assertFileExists(context, VALID_EVENTS_FIXTURE, rootDir, 'vNext events fixture exists');
  context.assert(moduleSyntax.ok, `vNext event/action module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext event/action suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_EVENT_ACTION_SCHEMA, 'package metadata declares event/action schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.eventBindingSchema === RMT_VNEXT_EVENT_BINDING_SCHEMA, 'package metadata declares event binding schema');
  context.assert(metadata && metadata.actionRefSchema === RMT_VNEXT_ACTION_REF_SCHEMA, 'package metadata declares action ref schema');
  context.assert(metadata && metadata.dataSourceSchema === RMT_VNEXT_DATA_SOURCE_SCHEMA, 'package metadata declares data source schema');
  context.assert(metadata && metadata.actionCatalogSchema === RMT_VNEXT_ACTION_CATALOG_SCHEMA, 'package metadata declares action catalog schema');
  context.assert(metadata && metadata.dataSourceCatalogSchema === RMT_VNEXT_DATA_SOURCE_CATALOG_SCHEMA, 'package metadata declares data source catalog schema');
  context.assert(metadata && metadata.adapterSchema === RMT_VNEXT_EVENT_ACTION_ADAPTER_SCHEMA, 'package metadata declares event/action adapter schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_EVENT_ACTION_REPORT_SCHEMA, 'package metadata declares event/action report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_EVENT_ACTION_WORKPACKAGE, 'package metadata points to WP-E15-12');
  context.assert(metadata && metadata.module === RMT_VNEXT_EVENT_ACTION_MODULE_PATH, 'package metadata points to event/action module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_EVENT_ACTION_SUITE_PATH, 'package metadata points to event/action suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-events --json', 'package metadata declares event/action local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_EVENT_ACTION_PACKAGE_SCRIPT, 'package metadata declares event/action package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-events'] === 'string' ? packageManifest.exports['./rmt-language/vnext-events'] : packageManifest.exports['./rmt-language/vnext-events'] && packageManifest.exports['./rmt-language/vnext-events'].default) === './tools/rmt-language/vnext-events.js', 'package exports vNext event/action contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-events'] === 'node scripts/run_xtend_tests.js rmt-vnext-events', 'package exposes vNext event/action script');
  context.assert(runner.includes("id: 'rmt-vnext-events'"), 'test runner exposes rmt-vnext-events suite');
  context.assert(epic.includes('| `WP-E15-12` | P1 | completed | WS3 |'), 'Epic marks WP-E15-12 completed');
  context.assert(epic.includes('| `WP-E15-13` | P1 | completed | WS4 |'), 'Epic records WP-E15-13 security handoff after event/action contract');
  context.assert(eventContract.includes('schema: "xtend.rmt.vnext-event-action-contract.v1"'), 'Event/action contract document declares schema');

  const actionCatalog = normalizeActionCatalog(createActionCatalog());
  const dataSourceCatalog = normalizeDataSourceCatalog(createDataSourceCatalog());
  context.assert(actionCatalog.schema === RMT_VNEXT_ACTION_CATALOG_SCHEMA, 'action catalog uses action catalog schema');
  context.assert(actionCatalog.count === 2, 'action catalog normalizes two actions');
  context.assert(dataSourceCatalog.schema === RMT_VNEXT_DATA_SOURCE_CATALOG_SCHEMA, 'data source catalog uses data source catalog schema');
  context.assert(dataSourceCatalog.count === 3, 'data source catalog normalizes three data sources');
  assertIncludesAll(context, DATA_SOURCE_KINDS, ['endpoint', 'sse', 'worker'], 'data source kinds');
  assertIncludesAll(context, Object.values(DATA_SOURCE_KIND_CAPABILITIES), ['data.endpoint.fetch', 'data.sse.subscribe', 'data.worker.invoke'], 'data source capabilities');

  const compileResult = compileFixture(VALID_EVENTS_FIXTURE, rootDir);
  const core = compileResult.coreDocument;
  context.assert(compileResult.ok === true, 'events fixture compiles successfully');
  context.assert(core.schema === RMT_VNEXT_CORE_SCHEMA, 'events fixture emits vNext core schema');
  context.assert(core.events.length === 2, 'events fixture compiles two event bindings');
  context.assert(core.dataSources.length === 3, 'events fixture compiles three data sources');
  context.assert(core.dataSources.some((source) => source.kind === 'endpoint'), 'events fixture includes endpoint data source');
  context.assert(core.dataSources.some((source) => source.kind === 'sse'), 'events fixture includes sse data source');
  context.assert(core.dataSources.some((source) => source.kind === 'worker'), 'events fixture includes worker data source');

  const contract = createStrictContract(core);
  context.assert(contract.schema === RMT_VNEXT_EVENT_ACTION_SCHEMA, 'event/action contract emits contract schema');
  context.assert(contract.ok === true, 'event/action contract validates successfully');
  context.assert(contract.status === 'ready', 'event/action contract is ready');
  context.assert(contract.eventCount === 2, 'event/action contract includes two events');
  context.assert(contract.actionBindingCount === 2, 'event/action contract includes two action bindings');
  context.assert(contract.dataSourceCount === 3, 'event/action contract includes three data sources');
  context.assert(contract.events.every((event) => event.schema === RMT_VNEXT_EVENT_BINDING_SCHEMA), 'event bindings use event binding schema');
  context.assert(contract.events.every((event) => event.action.schema === RMT_VNEXT_ACTION_REF_SCHEMA), 'event actions use action ref schema');
  context.assert(contract.dataSources.every((source) => source.schema === RMT_VNEXT_DATA_SOURCE_SCHEMA), 'data sources use data source schema');
  context.assert(contract.events.every((event) => event.declarative === true && event.runtimeEval === false), 'event bindings remain declarative');
  context.assert(contract.dataSources.every((source) => source.declarative === true && source.runtimeEval === false), 'data sources remain declarative capabilities');
  context.assert(contract.events.some((event) => event.event === 'submit' && event.action.resolvedActionId === 'settings.save'), 'submit event binds settings.save action');
  context.assert(contract.events.some((event) => event.event === 'cancel' && event.condition && event.condition.sourceRef), 'conditional event preserves condition ref');
  context.assert(contract.dataSources.some((source) => source.target === 'settings.load' && source.capability === DATA_SOURCE_KIND_CAPABILITIES.endpoint), 'endpoint data source requires endpoint capability');
  context.assert(contract.dataSources.some((source) => source.target === 'notifications.feed' && source.capability === DATA_SOURCE_KIND_CAPABILITIES.sse), 'sse data source requires sse capability');
  context.assert(contract.dataSources.some((source) => source.target === 'preview.render' && source.capability === DATA_SOURCE_KIND_CAPABILITIES.worker), 'worker data source requires worker capability');
  context.assert(contract.byDataSourceKind.endpoint.length === 1 && contract.byDataSourceKind.sse.length === 1 && contract.byDataSourceKind.worker.length === 1, 'data sources are indexed by kind');

  const repeatContract = createStrictContract(compileFixture(VALID_EVENTS_FIXTURE, rootDir).coreDocument);
  context.assert(serializeEventActionContract(contract) === serializeEventActionContract(repeatContract), 'event/action contract serialization is byte-stable');
  context.assert(JSON.parse(serializeEventActionContract(contract)).schema === RMT_VNEXT_EVENT_ACTION_SCHEMA, 'serialized event/action contract is parseable JSON');

  const complexResult = compileFixture(VALID_COMPLEX_FIXTURE, rootDir);
  const complexContract = createEventActionContract(complexResult.coreDocument, {
    actions: createComplexActions(),
    dataSources: createComplexDataSources(),
    adapters: createAdapters(),
    requireKnownActions: true,
    requireKnownDataSources: true,
    strictPayloadShapes: true
  });
  context.assert(complexContract.ok === true, 'complex fixture event/action contract validates successfully');
  context.assert(complexContract.events.some((event) => event.action.resolvedActionId === 'settings.save'), 'complex fixture resolves settings.save action');
  context.assert(complexContract.dataSources.some((source) => source.kind === 'sse' && source.target === 'docs.feed'), 'complex fixture resolves docs.feed sse source');

  const unknownActionCore = cloneJson(core);
  unknownActionCore.events[0].action = 'settings.unknown';
  const unknownActionContract = createStrictContract(unknownActionCore);
  context.assert(unknownActionContract.ok === false, 'unknown actions block event/action contract');
  context.assert(unknownActionContract.diagnostics.some((diagnostic) => diagnostic.code === EVENT_ACTION_UNKNOWN_CODE), 'unknown actions produce diagnostics');

  const unknownDataCore = cloneJson(core);
  unknownDataCore.dataSources[0].target = 'settings.missing';
  const unknownDataContract = createStrictContract(unknownDataCore);
  context.assert(unknownDataContract.ok === false, 'unknown data sources block event/action contract');
  context.assert(unknownDataContract.diagnostics.some((diagnostic) => diagnostic.code === DATA_SOURCE_UNKNOWN_CODE), 'unknown data sources produce diagnostics');

  const kindMismatchContract = createStrictContract(core, {
    dataSources: createDataSourceCatalog().map((source) => source.id === 'settings.load'
      ? { ...source, kind: 'worker' }
      : source)
  });
  context.assert(kindMismatchContract.ok === false, 'data source kind mismatches block event/action contract');
  context.assert(kindMismatchContract.diagnostics.some((diagnostic) => diagnostic.code === DATA_SOURCE_KIND_MISMATCH_CODE), 'data source kind mismatches produce diagnostics');

  const missingActionAdapterContract = createStrictContract(core, {
    adapters: createAdapters([
      { id: 'xtend.event', capabilities: [EVENT_BINDING_CAPABILITY] },
      { id: 'xtend.action', capabilities: [] },
      { id: 'xtend.data.endpoint', capabilities: [DATA_SOURCE_KIND_CAPABILITIES.endpoint] },
      { id: 'xtend.data.sse', capabilities: [DATA_SOURCE_KIND_CAPABILITIES.sse] },
      { id: 'xtend.data.worker', capabilities: [DATA_SOURCE_KIND_CAPABILITIES.worker] }
    ])
  });
  context.assert(missingActionAdapterContract.ok === false, 'missing action adapter capabilities block event/action contract');
  context.assert(missingActionAdapterContract.diagnostics.some((diagnostic) => diagnostic.code === EVENT_ACTION_ADAPTER_MISSING_CODE), 'missing action adapter capabilities produce diagnostics');

  const missingEventAdapterContract = createStrictContract(core, {
    adapters: createAdapters([
      { id: 'xtend.event', capabilities: [] },
      { id: 'xtend.action', capabilities: [ACTION_INVOKE_CAPABILITY] },
      { id: 'xtend.data.endpoint', capabilities: [DATA_SOURCE_KIND_CAPABILITIES.endpoint] },
      { id: 'xtend.data.sse', capabilities: [DATA_SOURCE_KIND_CAPABILITIES.sse] },
      { id: 'xtend.data.worker', capabilities: [DATA_SOURCE_KIND_CAPABILITIES.worker] }
    ])
  });
  context.assert(missingEventAdapterContract.ok === false, 'missing event binding adapter capabilities block event/action contract');
  context.assert(missingEventAdapterContract.diagnostics.some((diagnostic) => diagnostic.code === EVENT_BINDING_ADAPTER_MISSING_CODE), 'missing event binding adapter capabilities produce diagnostics');

  const missingDataAdapterContract = createStrictContract(core, {
    adapters: createAdapters([
      { id: 'xtend.event', capabilities: [EVENT_BINDING_CAPABILITY] },
      { id: 'xtend.action', capabilities: [ACTION_INVOKE_CAPABILITY] },
      { id: 'xtend.data.endpoint', capabilities: [DATA_SOURCE_KIND_CAPABILITIES.endpoint] },
      { id: 'xtend.data.sse', capabilities: [] },
      { id: 'xtend.data.worker', capabilities: [DATA_SOURCE_KIND_CAPABILITIES.worker] }
    ])
  });
  context.assert(missingDataAdapterContract.ok === false, 'missing data source adapter capabilities block event/action contract');
  context.assert(missingDataAdapterContract.diagnostics.some((diagnostic) => diagnostic.code === DATA_SOURCE_ADAPTER_MISSING_CODE), 'missing data source adapter capabilities produce diagnostics');

  const missingPayloadContract = createStrictContract(core, {
    actions: createActionCatalog().map((action) => action.id === 'settings.save'
      ? { id: action.id }
      : action)
  });
  context.assert(missingPayloadContract.ok === false, 'missing action payload shapes block strict event/action contract');
  context.assert(missingPayloadContract.diagnostics.some((diagnostic) => diagnostic.code === EVENT_PAYLOAD_SHAPE_MISSING_CODE), 'missing action payload shapes produce diagnostics');

  const missingSourcePayloadContract = createStrictContract(core, {
    dataSources: createDataSourceCatalog().map((source) => source.id === 'settings.load'
      ? { id: source.id, kind: source.kind }
      : source)
  });
  context.assert(missingSourcePayloadContract.ok === false, 'missing data source result shapes block strict event/action contract');
  context.assert(missingSourcePayloadContract.diagnostics.some((diagnostic) => diagnostic.code === DATA_SOURCE_PAYLOAD_SHAPE_MISSING_CODE), 'missing data source result shapes produce diagnostics');

  const missingOwnerCore = cloneJson(core);
  missingOwnerCore.events[0].ownerOperation = 'operation:missing';
  missingOwnerCore.dataSources[0].ownerOperation = 'operation:missing';
  const missingOwnerContract = createStrictContract(missingOwnerCore);
  context.assert(missingOwnerContract.ok === false, 'missing owners block event/action contract');
  context.assert(missingOwnerContract.diagnostics.some((diagnostic) => diagnostic.code === EVENT_OWNER_MISSING_CODE), 'missing event owners produce diagnostics');
  context.assert(missingOwnerContract.diagnostics.some((diagnostic) => diagnostic.code === DATA_SOURCE_OWNER_MISSING_CODE), 'missing data source owners produce diagnostics');

  const unsupportedKindCore = cloneJson(core);
  unsupportedKindCore.dataSources[0].kind = 'sql';
  const unsupportedKindContract = createStrictContract(unsupportedKindCore);
  context.assert(unsupportedKindContract.ok === false, 'unsupported data source kinds block event/action contract');
  context.assert(unsupportedKindContract.diagnostics.some((diagnostic) => diagnostic.code === DATA_SOURCE_KIND_UNSUPPORTED_CODE), 'unsupported data source kinds produce diagnostics');

  const mismatchCore = cloneJson(core);
  mismatchCore.operations.find((operation) => operation.source && operation.source.ref === mismatchCore.dataSources[0].id).source.ref = 'dataSource:missing';
  const mismatchContract = createStrictContract(mismatchCore);
  context.assert(mismatchContract.ok === false, 'operation data source ref mismatches block event/action contract');
  context.assert(mismatchContract.diagnostics.some((diagnostic) => diagnostic.code === DATA_SOURCE_OPERATION_REF_MISMATCH_CODE), 'operation data source ref mismatches produce diagnostics');

  const duplicateEventCore = cloneJson(core);
  duplicateEventCore.events.push(cloneJson(duplicateEventCore.events[0]));
  const duplicateEventContract = createStrictContract(duplicateEventCore);
  context.assert(duplicateEventContract.ok === false, 'duplicate events block event/action contract');
  context.assert(duplicateEventContract.diagnostics.some((diagnostic) => diagnostic.code === EVENT_DUPLICATE_CODE), 'duplicate events produce diagnostics');

  const factory = createRmtVNextEventActionContract({
    actions: createActionCatalog(),
    dataSources: createDataSourceCatalog(),
    adapters: createAdapters(),
    requireKnownActions: true,
    requireKnownDataSources: true,
    strictPayloadShapes: true
  });
  context.assert(factory.schema === RMT_VNEXT_EVENT_ACTION_SCHEMA, 'factory exposes event/action schema');
  context.assert(factory.eventBindingSchema === RMT_VNEXT_EVENT_BINDING_SCHEMA, 'factory exposes event binding schema');
  context.assert(factory.dataSourceSchema === RMT_VNEXT_DATA_SOURCE_SCHEMA, 'factory exposes data source schema');
  context.assert(factory.createContract(core).ok === true, 'factory creates event/action contract');

  return context.result({
    schema: RMT_VNEXT_EVENT_ACTION_REPORT_SCHEMA,
    eventActionSchema: RMT_VNEXT_EVENT_ACTION_SCHEMA,
    eventBindingSchema: RMT_VNEXT_EVENT_BINDING_SCHEMA,
    actionRefSchema: RMT_VNEXT_ACTION_REF_SCHEMA,
    dataSourceSchema: RMT_VNEXT_DATA_SOURCE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_EVENT_ACTION_WORKPACKAGE,
    eventActionModule: RMT_VNEXT_EVENT_ACTION_MODULE_PATH,
    suite: RMT_VNEXT_EVENT_ACTION_SUITE_PATH,
    eventCount: contract.eventCount,
    dataSourceCount: contract.dataSourceCount
  });
}

function printRmtVNextEventsReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Event, Action and Data Source Contract erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Event, Action and Data Source Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextEventsReport,
  runRmtVNextEventsSuite
};
