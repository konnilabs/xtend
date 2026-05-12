const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');

const RMT_VNEXT_EVENT_ACTION_SCHEMA = 'xtend.rmt.vnext-event-action-contract.v1';
const RMT_VNEXT_EVENT_BINDING_SCHEMA = 'xtend.rmt.vnext-event-binding.v1';
const RMT_VNEXT_ACTION_REF_SCHEMA = 'xtend.rmt.vnext-action-ref.v1';
const RMT_VNEXT_DATA_SOURCE_SCHEMA = 'xtend.rmt.vnext-data-source.v1';
const RMT_VNEXT_ACTION_CATALOG_SCHEMA = 'xtend.rmt.vnext-action-catalog.v1';
const RMT_VNEXT_DATA_SOURCE_CATALOG_SCHEMA = 'xtend.rmt.vnext-data-source-catalog.v1';
const RMT_VNEXT_EVENT_ACTION_ADAPTER_SCHEMA = 'xtend.rmt.vnext-event-action-adapter.v1';
const RMT_VNEXT_EVENT_ACTION_REPORT_SCHEMA = 'xtend.rmt.vnext-event-action-report.v1';
const RMT_VNEXT_EVENT_ACTION_WORKPACKAGE = 'WP-E15-12';
const RMT_VNEXT_EVENT_ACTION_MODULE_PATH = 'tools/rmt-language/vnext-events.js';
const RMT_VNEXT_EVENT_ACTION_SUITE_PATH = 'tests/rmt-language/rmt_vnext_events_suite.js';
const RMT_VNEXT_EVENT_ACTION_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-events';

const EVENT_OWNER_MISSING_CODE = 'rmt.vnext.event.owner_missing';
const EVENT_NAME_MISSING_CODE = 'rmt.vnext.event.name_missing';
const EVENT_ACTION_REF_MISSING_CODE = 'rmt.vnext.event.action_ref_missing';
const EVENT_ACTION_UNKNOWN_CODE = 'rmt.vnext.event.action.unknown';
const EVENT_ACTION_ADAPTER_MISSING_CODE = 'rmt.vnext.event.action.adapter_missing';
const EVENT_BINDING_ADAPTER_MISSING_CODE = 'rmt.vnext.event.binding.adapter_missing';
const EVENT_PAYLOAD_SHAPE_MISSING_CODE = 'rmt.vnext.event.payload_shape.missing';
const EVENT_DUPLICATE_CODE = 'rmt.vnext.event.duplicate';
const DATA_SOURCE_OWNER_MISSING_CODE = 'rmt.vnext.data_source.owner_missing';
const DATA_SOURCE_TARGET_MISSING_CODE = 'rmt.vnext.data_source.target_missing';
const DATA_SOURCE_UNKNOWN_CODE = 'rmt.vnext.data_source.unknown';
const DATA_SOURCE_KIND_UNSUPPORTED_CODE = 'rmt.vnext.data_source.kind.unsupported';
const DATA_SOURCE_KIND_MISMATCH_CODE = 'rmt.vnext.data_source.kind.mismatch';
const DATA_SOURCE_ADAPTER_MISSING_CODE = 'rmt.vnext.data_source.adapter_missing';
const DATA_SOURCE_PAYLOAD_SHAPE_MISSING_CODE = 'rmt.vnext.data_source.payload_shape.missing';
const DATA_SOURCE_OPERATION_REF_MISMATCH_CODE = 'rmt.vnext.data_source.operation_ref.mismatch';

const EVENT_BINDING_CAPABILITY = 'event.bind';
const ACTION_INVOKE_CAPABILITY = 'action.invoke';
const DATA_SOURCE_KIND_CAPABILITIES = Object.freeze({
  endpoint: 'data.endpoint.fetch',
  sse: 'data.sse.subscribe',
  worker: 'data.worker.invoke'
});
const DATA_SOURCE_KINDS = Object.freeze(Object.keys(DATA_SOURCE_KIND_CAPABILITIES));
const DEFAULT_EVENT_ADAPTER_ID = 'xtend.event';
const DEFAULT_ACTION_ADAPTER_ID = 'xtend.action';
const DEFAULT_DATA_ADAPTER_IDS = Object.freeze({
  endpoint: 'xtend.data.endpoint',
  sse: 'xtend.data.sse',
  worker: 'xtend.data.worker'
});

function cloneRange(range = {}) {
  range = range || {};
  return {
    start: {
      line: range.start && Number.isInteger(range.start.line) ? range.start.line : 0,
      character: range.start && Number.isInteger(range.start.character) ? range.start.character : 0
    },
    end: {
      line: range.end && Number.isInteger(range.end.line) ? range.end.line : 0,
      character: range.end && Number.isInteger(range.end.character) ? range.end.character : 0
    },
    startOffset: Number.isInteger(range.startOffset) ? range.startOffset : 0,
    endOffset: Number.isInteger(range.endOffset) ? range.endOffset : 0
  };
}

function uniqueList(values = []) {
  const result = [];
  values.forEach((value) => {
    if (value === null || value === undefined) return;
    const normalized = String(value).trim();
    if (normalized && !result.includes(normalized)) result.push(normalized);
  });
  return result;
}

function cloneShape(shape) {
  if (!shape || typeof shape !== 'object') return null;
  return JSON.parse(JSON.stringify(shape));
}

function findSourceEntry(coreDocument, sourceRef) {
  const sourceMap = Array.isArray(coreDocument && coreDocument.sourceMap) ? coreDocument.sourceMap : [];
  return sourceMap.find((entry) => entry && entry.id === sourceRef) || null;
}

function createEventActionDiagnostic(coreDocument, subject, code, message, severity = 'error', metadata = {}) {
  const sourceEntry = findSourceEntry(coreDocument, subject && subject.sourceRef);
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_EVENT_ACTION_SCHEMA,
    workpackage: RMT_VNEXT_EVENT_ACTION_WORKPACKAGE,
    severity,
    code,
    message,
    eventId: subject && (subject.eventId || subject.id && String(subject.id).startsWith('event:') && subject.id) || null,
    dataSourceId: subject && (subject.dataSourceId || subject.id && String(subject.id).startsWith('dataSource:') && subject.id) || null,
    operationId: subject && (subject.operationId || subject.ownerOperation || null) || null,
    actionRef: subject && subject.action || null,
    dataSourceRef: subject && subject.target || null,
    corePointer: sourceEntry && sourceEntry.corePointer ? sourceEntry.corePointer : null,
    sourceRef: subject && subject.sourceRef || null,
    range: cloneRange(sourceEntry && sourceEntry.range),
    metadata
  };
}

function createIndex(records = []) {
  const index = new Map();
  records.forEach((record) => {
    if (record && record.id) index.set(record.id, record);
  });
  return index;
}

function normalizeCatalogInput(input, pluralName) {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input[pluralName])) return input[pluralName];
  if (!input || typeof input !== 'object') return [];

  return Object.keys(input).map((key) => {
    const value = input[key];
    if (value && typeof value === 'object') {
      return {
        id: value.id || key,
        ...value
      };
    }
    return {
      id: key
    };
  });
}

function normalizeActionEntry(input, fallbackId) {
  const source = input && typeof input === 'object' ? input : {};
  const id = String(source.id || source.actionId || fallbackId || '').trim();
  if (!id) return null;

  return {
    id,
    adapterId: source.adapterId || source.adapter || DEFAULT_ACTION_ADAPTER_ID,
    capability: source.capability || ACTION_INVOKE_CAPABILITY,
    payloadShape: cloneShape(source.payloadShape || source.payload || null),
    resultShape: cloneShape(source.resultShape || source.result || null),
    description: source.description || null,
    source
  };
}

function normalizeActionCatalog(actions = []) {
  const records = [];
  const byId = new Map();

  normalizeCatalogInput(actions, 'actions').forEach((entry, index) => {
    const normalized = normalizeActionEntry(entry, `action.${index}`);
    if (!normalized) return;
    records.push(normalized);
    byId.set(normalized.id, normalized);
  });

  return {
    schema: RMT_VNEXT_ACTION_CATALOG_SCHEMA,
    count: records.length,
    ids: records.map((record) => record.id),
    records,
    byId
  };
}

function normalizeDataSourceEntry(input, fallbackId) {
  const source = input && typeof input === 'object' ? input : {};
  const id = String(source.id || source.dataSourceId || source.target || fallbackId || '').trim();
  if (!id) return null;
  const kind = source.kind || source.type || 'endpoint';

  return {
    id,
    kind,
    adapterId: source.adapterId || source.adapter || DEFAULT_DATA_ADAPTER_IDS[kind] || 'xtend.data',
    capability: source.capability || DATA_SOURCE_KIND_CAPABILITIES[kind] || null,
    payloadShape: cloneShape(source.payloadShape || source.requestShape || null),
    resultShape: cloneShape(source.resultShape || source.responseShape || source.payload || null),
    description: source.description || null,
    source
  };
}

function normalizeDataSourceCatalog(dataSources = []) {
  const records = [];
  const byId = new Map();

  normalizeCatalogInput(dataSources, 'dataSources').forEach((entry, index) => {
    const normalized = normalizeDataSourceEntry(entry, `dataSource.${index}`);
    if (!normalized) return;
    records.push(normalized);
    byId.set(normalized.id, normalized);
  });

  return {
    schema: RMT_VNEXT_DATA_SOURCE_CATALOG_SCHEMA,
    count: records.length,
    ids: records.map((record) => record.id),
    records,
    byId
  };
}

function createEventActionAdapterStub(input = {}) {
  return {
    schema: RMT_VNEXT_EVENT_ACTION_ADAPTER_SCHEMA,
    id: input.id || input.adapterId || DEFAULT_EVENT_ADAPTER_ID,
    kind: input.kind || 'event_action_adapter',
    capabilities: uniqueList(input.capabilities || input.providedCapabilities || [
      EVENT_BINDING_CAPABILITY,
      ACTION_INVOKE_CAPABILITY,
      DATA_SOURCE_KIND_CAPABILITIES.endpoint,
      DATA_SOURCE_KIND_CAPABILITIES.sse,
      DATA_SOURCE_KIND_CAPABILITIES.worker
    ]),
    kernelBoundary: input.kernelBoundary || 'no-rmt-kernel-import-of-host-runtime-types'
  };
}

function normalizeAdapterInput(adapters) {
  if (Array.isArray(adapters)) return adapters;
  if (adapters && Array.isArray(adapters.adapters)) return adapters.adapters;
  if (!adapters || typeof adapters !== 'object') return [];

  return Object.keys(adapters).map((key) => ({
    id: key,
    ...(adapters[key] && typeof adapters[key] === 'object' ? adapters[key] : {})
  }));
}

function defaultAdapters() {
  return [
    createEventActionAdapterStub({
      id: DEFAULT_EVENT_ADAPTER_ID,
      capabilities: [EVENT_BINDING_CAPABILITY]
    }),
    createEventActionAdapterStub({
      id: DEFAULT_ACTION_ADAPTER_ID,
      capabilities: [ACTION_INVOKE_CAPABILITY]
    }),
    createEventActionAdapterStub({
      id: DEFAULT_DATA_ADAPTER_IDS.endpoint,
      capabilities: [DATA_SOURCE_KIND_CAPABILITIES.endpoint]
    }),
    createEventActionAdapterStub({
      id: DEFAULT_DATA_ADAPTER_IDS.sse,
      capabilities: [DATA_SOURCE_KIND_CAPABILITIES.sse]
    }),
    createEventActionAdapterStub({
      id: DEFAULT_DATA_ADAPTER_IDS.worker,
      capabilities: [DATA_SOURCE_KIND_CAPABILITIES.worker]
    })
  ];
}

function createAdapterCatalog(options = {}) {
  const rawAdapters = Object.prototype.hasOwnProperty.call(options, 'adapters') && options.adapters !== undefined
    ? options.adapters
    : defaultAdapters();
  const adapters = normalizeAdapterInput(rawAdapters).map((adapter) => createEventActionAdapterStub(adapter));

  return {
    count: adapters.length,
    ids: adapters.map((adapter) => adapter.id),
    records: adapters,
    byId: createIndex(adapters)
  };
}

function hasAdapterCapability(adapter, capability) {
  const capabilities = Array.isArray(adapter && adapter.capabilities) ? adapter.capabilities : [];
  return capabilities.includes(capability);
}

function copyCondition(condition) {
  if (!condition || typeof condition !== 'object') return null;
  return {
    kind: condition.kind || 'condition',
    sourceRef: condition.sourceRef || null,
    expression: condition.expression ? JSON.parse(JSON.stringify(condition.expression)) : null
  };
}

function createActionRefRecord(actionRef, actionRecord, adapter) {
  return {
    schema: RMT_VNEXT_ACTION_REF_SCHEMA,
    ref: actionRef || null,
    resolvedActionId: actionRecord && actionRecord.id || actionRef || null,
    adapterId: actionRecord && actionRecord.adapterId || DEFAULT_ACTION_ADAPTER_ID,
    capability: actionRecord && actionRecord.capability || ACTION_INVOKE_CAPABILITY,
    adapterContract: adapter ? {
      schema: adapter.schema,
      id: adapter.id,
      capabilities: adapter.capabilities.slice()
    } : null,
    payloadShape: cloneShape(actionRecord && actionRecord.payloadShape),
    resultShape: cloneShape(actionRecord && actionRecord.resultShape)
  };
}

function createEventBindingRecord(coreDocument, event, context) {
  const diagnostics = [];
  const operation = context.operationIndex.get(event && event.ownerOperation);

  if (!operation) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      event,
      EVENT_OWNER_MISSING_CODE,
      `Event "${event && event.id || 'unknown'}" references missing owner operation "${event && event.ownerOperation || 'unknown'}".`
    ));
  }

  if (!event || !event.event) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      event,
      EVENT_NAME_MISSING_CODE,
      `Event binding "${event && event.id || 'unknown'}" has no event name.`
    ));
  }

  if (!event || !event.action) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      event,
      EVENT_ACTION_REF_MISSING_CODE,
      `Event binding "${event && event.id || 'unknown'}" has no action reference.`
    ));
  }

  const actionRecord = event && event.action ? context.actionCatalog.byId.get(event.action) : null;
  if (event && event.action && !actionRecord && context.requireKnownActions) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      event,
      EVENT_ACTION_UNKNOWN_CODE,
      `Action reference "${event.action}" is not present in the vNext action catalog.`,
      'error',
      { knownActions: context.actionCatalog.ids.slice() }
    ));
  }

  const eventAdapter = context.adapterCatalog.byId.get(context.eventAdapterId);
  if (!eventAdapter || !hasAdapterCapability(eventAdapter, EVENT_BINDING_CAPABILITY)) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      event,
      EVENT_BINDING_ADAPTER_MISSING_CODE,
      `Event binding "${event && event.event || 'unknown'}" has no adapter contract with "${EVENT_BINDING_CAPABILITY}".`,
      'error',
      { adapterId: context.eventAdapterId, requiredCapability: EVENT_BINDING_CAPABILITY }
    ));
  }

  const actionAdapterId = actionRecord && actionRecord.adapterId || DEFAULT_ACTION_ADAPTER_ID;
  const actionAdapter = context.adapterCatalog.byId.get(actionAdapterId);
  if (!actionAdapter || !hasAdapterCapability(actionAdapter, actionRecord && actionRecord.capability || ACTION_INVOKE_CAPABILITY)) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      event,
      EVENT_ACTION_ADAPTER_MISSING_CODE,
      `Action "${event && event.action || 'unknown'}" has no adapter contract with "${ACTION_INVOKE_CAPABILITY}".`,
      'error',
      { adapterId: actionAdapterId, requiredCapability: ACTION_INVOKE_CAPABILITY }
    ));
  }

  if (context.strictPayloadShapes && actionRecord && !actionRecord.payloadShape) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      event,
      EVENT_PAYLOAD_SHAPE_MISSING_CODE,
      `Action "${actionRecord.id}" has no declared payload shape.`,
      'error',
      { actionId: actionRecord.id }
    ));
  }

  return {
    schema: RMT_VNEXT_EVENT_BINDING_SCHEMA,
    eventId: event && event.id || null,
    event: event && event.event || null,
    ownerOperation: event && event.ownerOperation || null,
    ownerComponentRef: operation && operation.target && operation.target.ref || null,
    action: createActionRefRecord(event && event.action, actionRecord, actionAdapter),
    eventPayloadShape: cloneShape(context.eventPayloadShapes[event && event.event]) || {
      type: 'object',
      additionalProperties: true
    },
    condition: copyCondition(event && event.condition),
    declarative: true,
    runtimeEval: false,
    sourceRef: event && event.sourceRef || null,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    diagnostics
  };
}

function detectDuplicateEvents(coreDocument, events) {
  const diagnostics = [];
  const seen = new Map();

  events.forEach((event) => {
    const key = `${event && event.ownerOperation || 'unknown'}:${event && event.event || 'unknown'}`;
    if (seen.has(key)) {
      diagnostics.push(createEventActionDiagnostic(
        coreDocument,
        event,
        EVENT_DUPLICATE_CODE,
        `Event "${event && event.event || 'unknown'}" is duplicated for owner operation "${event && event.ownerOperation || 'unknown'}".`,
        'error',
        { firstEventId: seen.get(key), duplicateKey: key }
      ));
    } else if (event && event.id) {
      seen.set(key, event.id);
    }
  });

  return diagnostics;
}

function createDataSourceRecord(coreDocument, dataSource, context) {
  const diagnostics = [];
  const operation = context.operationIndex.get(dataSource && dataSource.ownerOperation);
  const catalogRecord = dataSource && dataSource.target ? context.dataSourceCatalog.byId.get(dataSource.target) : null;
  const capability = DATA_SOURCE_KIND_CAPABILITIES[dataSource && dataSource.kind] || null;

  if (!operation) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      dataSource,
      DATA_SOURCE_OWNER_MISSING_CODE,
      `Data source "${dataSource && dataSource.id || 'unknown'}" references missing owner operation "${dataSource && dataSource.ownerOperation || 'unknown'}".`
    ));
  }

  if (!dataSource || !dataSource.target) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      dataSource,
      DATA_SOURCE_TARGET_MISSING_CODE,
      `Data source "${dataSource && dataSource.id || 'unknown'}" has no target reference.`
    ));
  }

  if (!DATA_SOURCE_KINDS.includes(dataSource && dataSource.kind)) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      dataSource,
      DATA_SOURCE_KIND_UNSUPPORTED_CODE,
      `Data source kind "${dataSource && dataSource.kind || 'unknown'}" is not part of the vNext data source contract.`,
      'error',
      { allowedKinds: DATA_SOURCE_KINDS.slice() }
    ));
  }

  if (dataSource && dataSource.target && !catalogRecord && context.requireKnownDataSources) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      dataSource,
      DATA_SOURCE_UNKNOWN_CODE,
      `Data source reference "${dataSource.target}" is not present in the vNext data source catalog.`,
      'error',
      { knownDataSources: context.dataSourceCatalog.ids.slice() }
    ));
  }

  if (catalogRecord && catalogRecord.kind !== dataSource.kind) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      dataSource,
      DATA_SOURCE_KIND_MISMATCH_CODE,
      `Data source "${dataSource.target}" is declared as "${catalogRecord.kind}" but used as "${dataSource.kind}".`,
      'error',
      { expected: catalogRecord.kind, actual: dataSource.kind }
    ));
  }

  const adapterId = catalogRecord && catalogRecord.adapterId || DEFAULT_DATA_ADAPTER_IDS[dataSource && dataSource.kind] || 'xtend.data';
  const adapter = context.adapterCatalog.byId.get(adapterId);
  const requiredCapability = catalogRecord && catalogRecord.capability || capability;
  if (!adapter || !requiredCapability || !hasAdapterCapability(adapter, requiredCapability)) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      dataSource,
      DATA_SOURCE_ADAPTER_MISSING_CODE,
      `Data source "${dataSource && dataSource.target || 'unknown'}" has no adapter contract with "${requiredCapability || 'unknown'}".`,
      'error',
      { adapterId, requiredCapability }
    ));
  }

  if (context.strictPayloadShapes && catalogRecord && !catalogRecord.resultShape) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      dataSource,
      DATA_SOURCE_PAYLOAD_SHAPE_MISSING_CODE,
      `Data source "${catalogRecord.id}" has no declared result shape.`,
      'error',
      { dataSourceId: catalogRecord.id }
    ));
  }

  if (operation && (!operation.source || operation.source.ref !== dataSource.id)) {
    diagnostics.push(createEventActionDiagnostic(
      coreDocument,
      dataSource,
      DATA_SOURCE_OPERATION_REF_MISMATCH_CODE,
      `Operation "${operation.id}" does not point back to data source "${dataSource.id}".`,
      'error',
      { operationSourceRef: operation.source && operation.source.ref || null }
    ));
  }

  return {
    schema: RMT_VNEXT_DATA_SOURCE_SCHEMA,
    dataSourceId: dataSource && dataSource.id || null,
    kind: dataSource && dataSource.kind || null,
    target: dataSource && dataSource.target || null,
    ownerOperation: dataSource && dataSource.ownerOperation || null,
    ownerComponentRef: operation && operation.target && operation.target.ref || null,
    adapterId,
    capability: requiredCapability,
    adapterContract: adapter ? {
      schema: adapter.schema,
      id: adapter.id,
      capabilities: adapter.capabilities.slice()
    } : null,
    payloadShape: cloneShape(catalogRecord && catalogRecord.payloadShape),
    resultShape: cloneShape(catalogRecord && catalogRecord.resultShape),
    declarative: true,
    runtimeEval: false,
    sourceRef: dataSource && dataSource.sourceRef || null,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    diagnostics
  };
}

function createEventActionContract(coreDocument, options = {}) {
  const events = Array.isArray(coreDocument && coreDocument.events) ? coreDocument.events : [];
  const dataSources = Array.isArray(coreDocument && coreDocument.dataSources) ? coreDocument.dataSources : [];
  const operations = Array.isArray(coreDocument && coreDocument.operations) ? coreDocument.operations : [];
  const actionCatalog = normalizeActionCatalog(options.actions || options.actionCatalog || []);
  const dataSourceCatalog = normalizeDataSourceCatalog(options.dataSources || options.dataSourceCatalog || []);
  const adapterCatalog = createAdapterCatalog({
    adapters: Object.prototype.hasOwnProperty.call(options, 'adapters')
      ? options.adapters
      : options.eventActionAdapters
  });
  const context = {
    operationIndex: createIndex(operations),
    actionCatalog,
    dataSourceCatalog,
    adapterCatalog,
    requireKnownActions: options.requireKnownActions === true,
    requireKnownDataSources: options.requireKnownDataSources === true,
    strictPayloadShapes: options.strictPayloadShapes === true,
    eventAdapterId: options.eventAdapterId || DEFAULT_EVENT_ADAPTER_ID,
    eventPayloadShapes: options.eventPayloadShapes || {}
  };
  const eventBindings = events.map((event) => createEventBindingRecord(coreDocument, event, context));
  const dataSourceRecords = dataSources.map((dataSource) => createDataSourceRecord(coreDocument, dataSource, context));
  const duplicateEventDiagnostics = detectDuplicateEvents(coreDocument, events);
  const diagnostics = eventBindings
    .flatMap((event) => event.diagnostics)
    .concat(dataSourceRecords.flatMap((dataSource) => dataSource.diagnostics))
    .concat(duplicateEventDiagnostics);
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';
  const byKind = {};

  dataSourceRecords.forEach((dataSource) => {
    const list = byKind[dataSource.kind || 'unknown'] || (byKind[dataSource.kind || 'unknown'] = []);
    list.push(dataSource.dataSourceId);
  });

  return {
    schema: RMT_VNEXT_EVENT_ACTION_SCHEMA,
    coreSchema: coreDocument && coreDocument.schema ? coreDocument.schema : RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_EVENT_ACTION_WORKPACKAGE,
    status,
    ok: status !== 'blocked',
    contractId: options.contractId || `events:${coreDocument && coreDocument.manifest && coreDocument.manifest.documentId || 'rmt.vnext.document'}`,
    eventCount: eventBindings.length,
    actionBindingCount: eventBindings.length,
    dataSourceCount: dataSourceRecords.length,
    dataSourceKinds: DATA_SOURCE_KINDS.slice(),
    actionCatalog: {
      schema: actionCatalog.schema,
      count: actionCatalog.count,
      ids: actionCatalog.ids.slice()
    },
    dataSourceCatalog: {
      schema: dataSourceCatalog.schema,
      count: dataSourceCatalog.count,
      ids: dataSourceCatalog.ids.slice()
    },
    adapterCatalog: {
      count: adapterCatalog.count,
      ids: adapterCatalog.ids.slice()
    },
    byDataSourceKind: byKind,
    events: eventBindings,
    dataSources: dataSourceRecords,
    diagnostics
  };
}

function serializeEventActionContract(contract) {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

function createRmtVNextEventActionContract(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_EVENT_ACTION_SCHEMA,
    eventBindingSchema: RMT_VNEXT_EVENT_BINDING_SCHEMA,
    actionRefSchema: RMT_VNEXT_ACTION_REF_SCHEMA,
    dataSourceSchema: RMT_VNEXT_DATA_SOURCE_SCHEMA,
    actionCatalogSchema: RMT_VNEXT_ACTION_CATALOG_SCHEMA,
    dataSourceCatalogSchema: RMT_VNEXT_DATA_SOURCE_CATALOG_SCHEMA,
    adapterSchema: RMT_VNEXT_EVENT_ACTION_ADAPTER_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_EVENT_ACTION_WORKPACKAGE,
    dataSourceCapabilities: DATA_SOURCE_KIND_CAPABILITIES,
    createContract: (coreDocument, options = {}) => createEventActionContract(coreDocument, {
      ...defaultOptions,
      ...options
    }),
    serializeContract: serializeEventActionContract
  });
}

module.exports = {
  ACTION_INVOKE_CAPABILITY,
  DATA_SOURCE_ADAPTER_MISSING_CODE,
  DATA_SOURCE_KIND_CAPABILITIES,
  DATA_SOURCE_KIND_MISMATCH_CODE,
  DATA_SOURCE_KIND_UNSUPPORTED_CODE,
  DATA_SOURCE_KINDS,
  DATA_SOURCE_OPERATION_REF_MISMATCH_CODE,
  DATA_SOURCE_OWNER_MISSING_CODE,
  DATA_SOURCE_PAYLOAD_SHAPE_MISSING_CODE,
  DATA_SOURCE_TARGET_MISSING_CODE,
  DATA_SOURCE_UNKNOWN_CODE,
  DEFAULT_ACTION_ADAPTER_ID,
  DEFAULT_DATA_ADAPTER_IDS,
  DEFAULT_EVENT_ADAPTER_ID,
  EVENT_ACTION_ADAPTER_MISSING_CODE,
  EVENT_ACTION_REF_MISSING_CODE,
  EVENT_ACTION_UNKNOWN_CODE,
  EVENT_BINDING_ADAPTER_MISSING_CODE,
  EVENT_BINDING_CAPABILITY,
  EVENT_DUPLICATE_CODE,
  EVENT_NAME_MISSING_CODE,
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
};
