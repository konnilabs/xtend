const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');

const RMT_VNEXT_COMPOSITION_SCHEMA = 'xtend.rmt.vnext-composition.v1';
const RMT_VNEXT_SLOT_BINDING_SCHEMA = 'xtend.rmt.vnext-slot-binding.v1';
const RMT_VNEXT_COMPONENT_BINDING_SCHEMA = 'xtend.rmt.vnext-component-binding.v1';
const RMT_VNEXT_COMPONENT_CATALOG_SCHEMA = 'xtend.rmt.vnext-component-catalog.v1';
const RMT_VNEXT_COMPONENT_ADAPTER_SCHEMA = 'xtend.rmt.vnext-component-adapter.v1';
const RMT_VNEXT_COMPOSITION_REPORT_SCHEMA = 'xtend.rmt.vnext-composition-report.v1';
const RMT_VNEXT_COMPOSITION_WORKPACKAGE = 'WP-E15-10';
const RMT_VNEXT_COMPOSITION_MODULE_PATH = 'tools/rmt-language/vnext-composition.js';
const RMT_VNEXT_COMPOSITION_SUITE_PATH = 'tests/rmt-language/rmt_vnext_composition_suite.js';
const RMT_VNEXT_COMPOSITION_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-composition';

const COMPOSITION_SLOT_OWNER_MISSING_CODE = 'rmt.vnext.composition.slot.owner_missing';
const COMPOSITION_SLOT_OPERATION_REF_MISSING_CODE = 'rmt.vnext.composition.slot.operation_ref_missing';
const COMPOSITION_SLOT_OPERATION_SCOPE_MISMATCH_CODE = 'rmt.vnext.composition.slot.operation_scope_mismatch';
const COMPOSITION_SLOT_DUPLICATE_CODE = 'rmt.vnext.composition.slot.duplicate';
const COMPOSITION_COMPONENT_REF_MISSING_CODE = 'rmt.vnext.composition.component.ref_missing';
const COMPOSITION_COMPONENT_UNKNOWN_CODE = 'rmt.vnext.composition.component.unknown';
const COMPOSITION_COMPONENT_ADAPTER_MISSING_CODE = 'rmt.vnext.composition.component.adapter_missing';
const COMPOSITION_COMPONENT_SLOT_UNSUPPORTED_CODE = 'rmt.vnext.composition.component.slot_unsupported';
const COMPOSITION_OPERATION_TARGET_UNSUPPORTED_CODE = 'rmt.vnext.composition.operation.target_unsupported';

const COMPONENT_BINDING_CAPABILITY = 'component.binding';
const COMPONENT_SLOT_CAPABILITY = 'component.slot';
const DEFAULT_COMPONENT_ADAPTER_ID = 'xtend.component';

function cloneRange(range = {}) {
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

function findSourceEntry(coreDocument, sourceRef) {
  const sourceMap = Array.isArray(coreDocument && coreDocument.sourceMap) ? coreDocument.sourceMap : [];
  return sourceMap.find((entry) => entry && entry.id === sourceRef) || null;
}

function createCompositionDiagnostic(coreDocument, subject, code, message, severity = 'error', metadata = {}) {
  const sourceEntry = findSourceEntry(coreDocument, subject && subject.sourceRef);
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_COMPOSITION_SCHEMA,
    workpackage: RMT_VNEXT_COMPOSITION_WORKPACKAGE,
    severity,
    code,
    message,
    operationId: subject && (subject.operationId || subject.ownerOperation || subject.id && String(subject.id).startsWith('operation:') && subject.id) || null,
    slotId: subject && (subject.slotId || subject.id && String(subject.id).startsWith('slot:') && subject.id) || null,
    componentRef: subject && subject.componentRef || null,
    corePointer: sourceEntry && sourceEntry.corePointer ? sourceEntry.corePointer : null,
    sourceRef: subject && subject.sourceRef ? subject.sourceRef : null,
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

function normalizeSlotNames(value, explicit = false) {
  if (Array.isArray(value)) {
    return {
      explicit: true,
      names: uniqueList(value.map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return item.name || item.slot || item.id;
        return null;
      }))
    };
  }

  if (value && typeof value === 'object') {
    return {
      explicit: true,
      names: uniqueList(Object.keys(value))
    };
  }

  return {
    explicit,
    names: []
  };
}

function normalizeComponentEntry(input, fallbackId) {
  const source = input && typeof input === 'object' ? input : {};
  const id = String(source.id || source.componentId || source.tag || fallbackId || '').trim();
  if (!id) return null;

  const publicApiSlots = source.publicApi && normalizeSlotNames(source.publicApi.slots, true);
  const directSlots = Object.prototype.hasOwnProperty.call(source, 'slots')
    ? normalizeSlotNames(source.slots, true)
    : null;
  const rmtSlots = source.rmt && Object.prototype.hasOwnProperty.call(source.rmt, 'slots')
    ? normalizeSlotNames(source.rmt.slots, true)
    : null;
  const selectedSlots = directSlots || publicApiSlots || rmtSlots || normalizeSlotNames(null, false);
  const aliases = uniqueList([]
    .concat(source.aliases || [])
    .concat(source.localAliases || [])
    .concat(source.alias || []));

  return {
    id,
    schema: source.schema || null,
    tag: source.tag || id,
    adapterId: source.adapterId || source.adapter || source.rmt && source.rmt.adapter || DEFAULT_COMPONENT_ADAPTER_ID,
    aliases,
    slots: selectedSlots.names,
    slotsExplicit: selectedSlots.explicit,
    contractRef: source.contractRef || source.schema || 'xtend.component.contract.v2',
    source
  };
}

function normalizeComponentInput(components) {
  if (Array.isArray(components)) return components;
  if (components && Array.isArray(components.components)) return components.components;
  if (!components || typeof components !== 'object') return [];

  return Object.keys(components).map((key) => {
    const value = components[key];
    if (value && typeof value === 'object') {
      return {
        id: value.id || key,
        ...value
      };
    }
    return {
      id: key,
      tag: String(value || key)
    };
  });
}

function normalizeComponentCatalog(components = []) {
  const records = [];
  const byId = new Map();
  const byAlias = new Map();

  normalizeComponentInput(components).forEach((entry, index) => {
    const normalized = normalizeComponentEntry(entry, `component.${index}`);
    if (!normalized) return;

    records.push(normalized);
    byId.set(normalized.id, normalized);
    normalized.aliases.forEach((alias) => {
      if (!byAlias.has(alias)) byAlias.set(alias, normalized.id);
    });
  });

  return {
    schema: RMT_VNEXT_COMPONENT_CATALOG_SCHEMA,
    count: records.length,
    ids: records.map((record) => record.id),
    aliasCount: byAlias.size,
    records,
    byId,
    byAlias
  };
}

function createComponentAdapterStub(input = {}) {
  return {
    schema: RMT_VNEXT_COMPONENT_ADAPTER_SCHEMA,
    id: input.id || input.adapterId || DEFAULT_COMPONENT_ADAPTER_ID,
    kind: input.kind || 'component_adapter',
    capabilities: uniqueList(input.capabilities || input.providedCapabilities || [
      COMPONENT_BINDING_CAPABILITY,
      COMPONENT_SLOT_CAPABILITY
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

function createAdapterCatalog(options = {}) {
  const rawAdapters = Object.prototype.hasOwnProperty.call(options, 'adapters') && options.adapters !== undefined
    ? options.adapters
    : [createComponentAdapterStub()];
  const adapters = normalizeAdapterInput(rawAdapters).map((adapter) => createComponentAdapterStub(adapter));
  const byId = createIndex(adapters);

  return {
    count: adapters.length,
    ids: adapters.map((adapter) => adapter.id),
    records: adapters,
    byId
  };
}

function hasAdapterCapability(adapter, capability) {
  const capabilities = Array.isArray(adapter && adapter.capabilities) ? adapter.capabilities : [];
  return capabilities.includes(capability);
}

function hasSlotCapability(adapter, slotName) {
  return hasAdapterCapability(adapter, COMPONENT_SLOT_CAPABILITY)
    || hasAdapterCapability(adapter, `${COMPONENT_SLOT_CAPABILITY}.${slotName}`);
}

function resolveComponentRef(componentRef, catalog) {
  if (catalog.byId.has(componentRef)) {
    return {
      found: true,
      alias: false,
      component: catalog.byId.get(componentRef),
      resolvedComponentId: componentRef
    };
  }

  if (catalog.byAlias.has(componentRef)) {
    const resolvedComponentId = catalog.byAlias.get(componentRef);
    return {
      found: true,
      alias: true,
      component: catalog.byId.get(resolvedComponentId),
      resolvedComponentId
    };
  }

  return {
    found: false,
    alias: false,
    component: null,
    resolvedComponentId: componentRef || null
  };
}

function copyScope(scope) {
  return scope && typeof scope === 'object' ? { ...scope } : {};
}

function scopesMatch(ownerScope = {}, childScope = {}) {
  return (ownerScope.template || null) === (childScope.template || null)
    && (ownerScope.surface || null) === (childScope.surface || null)
    && (ownerScope.lane || null) === (childScope.lane || null);
}

function createComponentBinding(coreDocument, operation, context) {
  const diagnostics = [];
  const target = operation && operation.target || {};

  if (!target.ref) {
    diagnostics.push(createCompositionDiagnostic(
      coreDocument,
      operation,
      COMPOSITION_COMPONENT_REF_MISSING_CODE,
      `Operation "${operation && operation.id || 'unknown'}" has no component reference target.`
    ));
  }

  if (target.kind && target.kind !== 'ref') {
    diagnostics.push(createCompositionDiagnostic(
      coreDocument,
      operation,
      COMPOSITION_OPERATION_TARGET_UNSUPPORTED_CODE,
      `Operation "${operation && operation.id || 'unknown'}" target kind "${target.kind}" is not supported for component composition.`,
      'error',
      { allowedKind: 'ref' }
    ));
  }

  const resolved = resolveComponentRef(target.ref, context.componentCatalog);
  if (!resolved.found && context.requireKnownComponents) {
    diagnostics.push(createCompositionDiagnostic(
      coreDocument,
      {
        ...operation,
        componentRef: target.ref || null
      },
      COMPOSITION_COMPONENT_UNKNOWN_CODE,
      `Component reference "${target.ref || 'unknown'}" is not present in the vNext component catalog.`,
      'error',
      { knownComponents: context.componentCatalog.ids.slice() }
    ));
  }

  const component = resolved.component;
  const adapterId = component && component.adapterId || context.defaultAdapterId;
  const adapter = context.adapterCatalog.byId.get(adapterId);
  if (!adapter || !hasAdapterCapability(adapter, COMPONENT_BINDING_CAPABILITY)) {
    diagnostics.push(createCompositionDiagnostic(
      coreDocument,
      {
        ...operation,
        componentRef: target.ref || null
      },
      COMPOSITION_COMPONENT_ADAPTER_MISSING_CODE,
      `Component "${resolved.resolvedComponentId || target.ref || 'unknown'}" has no adapter contract with "${COMPONENT_BINDING_CAPABILITY}".`,
      'error',
      { adapterId, requiredCapability: COMPONENT_BINDING_CAPABILITY }
    ));
  }

  return {
    schema: RMT_VNEXT_COMPONENT_BINDING_SCHEMA,
    operationId: operation && operation.id || null,
    operationKind: operation && operation.kind || null,
    lifecycle: operation && operation.op || null,
    componentRef: target.ref || null,
    resolvedComponentId: resolved.resolvedComponentId,
    alias: resolved.alias,
    adapterId,
    adapterContract: adapter ? {
      schema: adapter.schema,
      id: adapter.id,
      capabilities: adapter.capabilities.slice()
    } : null,
    scope: copyScope(operation && operation.scope),
    sourceRef: operation && operation.sourceRef || null,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    diagnostics
  };
}

function createSlotBinding(coreDocument, slot, context) {
  const diagnostics = [];
  const operationRefs = Array.isArray(slot && slot.operationRefs) ? slot.operationRefs.slice() : [];
  const ownerOperation = context.operationIndex.get(slot && slot.ownerOperation);
  const ownerBinding = ownerOperation ? context.componentBindingsByOperation.get(ownerOperation.id) : null;
  const ownerComponent = ownerBinding && ownerBinding.resolvedComponentId
    ? context.componentCatalog.byId.get(ownerBinding.resolvedComponentId)
    : null;
  const adapterId = ownerComponent && ownerComponent.adapterId || ownerBinding && ownerBinding.adapterId || context.defaultAdapterId;
  const adapter = context.adapterCatalog.byId.get(adapterId);
  const childComponentRefs = [];

  if (!ownerOperation) {
    diagnostics.push(createCompositionDiagnostic(
      coreDocument,
      slot,
      COMPOSITION_SLOT_OWNER_MISSING_CODE,
      `Slot "${slot && slot.id || 'unknown'}" references missing owner operation "${slot && slot.ownerOperation || 'unknown'}".`
    ));
  }

  operationRefs.forEach((operationRef) => {
    const operation = context.operationIndex.get(operationRef);
    if (!operation) {
      diagnostics.push(createCompositionDiagnostic(
        coreDocument,
        slot,
        COMPOSITION_SLOT_OPERATION_REF_MISSING_CODE,
        `Slot "${slot && slot.id || 'unknown'}" references missing operation "${operationRef}".`,
        'error',
        { operationRef }
      ));
      return;
    }

    const childBinding = context.componentBindingsByOperation.get(operation.id);
    childComponentRefs.push(childBinding && childBinding.resolvedComponentId || operation.target && operation.target.ref || null);

    if (ownerOperation && !scopesMatch(ownerOperation.scope, operation.scope)) {
      diagnostics.push(createCompositionDiagnostic(
        coreDocument,
        slot,
        COMPOSITION_SLOT_OPERATION_SCOPE_MISMATCH_CODE,
        `Nested operation "${operation.id}" does not share the owner operation scope for slot "${slot.id}".`,
        'error',
        {
          ownerScope: copyScope(ownerOperation.scope),
          operationScope: copyScope(operation.scope)
        }
      ));
    }
  });

  if (ownerComponent && ownerComponent.slotsExplicit && !ownerComponent.slots.includes(slot.name)) {
    diagnostics.push(createCompositionDiagnostic(
      coreDocument,
      slot,
      COMPOSITION_COMPONENT_SLOT_UNSUPPORTED_CODE,
      `Component "${ownerComponent.id}" does not declare slot "${slot.name || 'default'}".`,
      'error',
      {
        componentId: ownerComponent.id,
        slotName: slot.name || null,
        supportedSlots: ownerComponent.slots.slice()
      }
    ));
  }

  if (!adapter || !hasSlotCapability(adapter, slot && slot.name || 'default')) {
    diagnostics.push(createCompositionDiagnostic(
      coreDocument,
      slot,
      COMPOSITION_COMPONENT_ADAPTER_MISSING_CODE,
      `Slot "${slot && slot.name || 'default'}" has no adapter contract capability for slot binding.`,
      'error',
      {
        adapterId,
        requiredCapability: `${COMPONENT_SLOT_CAPABILITY} or ${COMPONENT_SLOT_CAPABILITY}.${slot && slot.name || 'default'}`
      }
    ));
  }

  return {
    schema: RMT_VNEXT_SLOT_BINDING_SCHEMA,
    slotId: slot && slot.id || null,
    name: slot && slot.name || null,
    ownerOperation: slot && slot.ownerOperation || null,
    ownerComponentRef: ownerBinding && ownerBinding.componentRef || ownerOperation && ownerOperation.target && ownerOperation.target.ref || null,
    ownerComponentId: ownerBinding && ownerBinding.resolvedComponentId || null,
    ownerAdapterId: adapterId,
    operationRefs,
    childComponentRefs: childComponentRefs.filter(Boolean),
    nestedOperationCount: operationRefs.length,
    scope: copyScope(ownerOperation && ownerOperation.scope),
    bindingMode: 'orchestration',
    markupMode: 'none',
    sourceRef: slot && slot.sourceRef || null,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    diagnostics
  };
}

function detectDuplicateSlots(coreDocument, slots) {
  const diagnostics = [];
  const seen = new Map();

  slots.forEach((slot) => {
    const key = `${slot && slot.ownerOperation || 'unknown'}:${slot && slot.name || 'default'}`;
    if (seen.has(key)) {
      diagnostics.push(createCompositionDiagnostic(
        coreDocument,
        slot,
        COMPOSITION_SLOT_DUPLICATE_CODE,
        `Slot "${slot && slot.name || 'default'}" is duplicated for owner operation "${slot && slot.ownerOperation || 'unknown'}".`,
        'error',
        { firstSlotId: seen.get(key), duplicateKey: key }
      ));
    } else if (slot && slot.id) {
      seen.set(key, slot.id);
    }
  });

  return diagnostics;
}

function createCompositionGraph(coreDocument, options = {}) {
  const operations = Array.isArray(coreDocument && coreDocument.operations) ? coreDocument.operations : [];
  const slots = Array.isArray(coreDocument && coreDocument.slots) ? coreDocument.slots : [];
  const componentCatalog = normalizeComponentCatalog(options.components || options.componentCatalog || []);
  const adapterCatalog = createAdapterCatalog({
    adapters: Object.prototype.hasOwnProperty.call(options, 'adapters')
      ? options.adapters
      : options.componentAdapters
  });
  const context = {
    componentCatalog,
    adapterCatalog,
    operationIndex: createIndex(operations),
    requireKnownComponents: options.requireKnownComponents === true,
    defaultAdapterId: options.defaultAdapterId || DEFAULT_COMPONENT_ADAPTER_ID,
    componentBindingsByOperation: new Map()
  };
  const componentBindings = operations.map((operation) => createComponentBinding(coreDocument, operation, context));
  componentBindings.forEach((binding) => {
    if (binding.operationId) context.componentBindingsByOperation.set(binding.operationId, binding);
  });

  const slotBindings = slots.map((slot) => createSlotBinding(coreDocument, slot, context));
  const duplicateSlotDiagnostics = detectDuplicateSlots(coreDocument, slots);
  const diagnostics = componentBindings
    .flatMap((binding) => binding.diagnostics)
    .concat(slotBindings.flatMap((binding) => binding.diagnostics))
    .concat(duplicateSlotDiagnostics);
  const byComponent = {};

  componentBindings.forEach((binding) => {
    const componentId = binding.resolvedComponentId || binding.componentRef || 'unknown';
    const list = byComponent[componentId] || (byComponent[componentId] = []);
    list.push(binding.operationId);
  });

  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: RMT_VNEXT_COMPOSITION_SCHEMA,
    coreSchema: coreDocument && coreDocument.schema ? coreDocument.schema : RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_COMPOSITION_WORKPACKAGE,
    status,
    ok: status !== 'blocked',
    compositionId: options.compositionId || `composition:${coreDocument && coreDocument.manifest && coreDocument.manifest.documentId || 'rmt.vnext.document'}`,
    mode: 'component-orchestration',
    markupCoupled: false,
    operationCount: operations.length,
    slotCount: slotBindings.length,
    componentBindingCount: componentBindings.length,
    componentCatalog: {
      schema: componentCatalog.schema,
      count: componentCatalog.count,
      ids: componentCatalog.ids.slice(),
      aliasCount: componentCatalog.aliasCount
    },
    adapterCatalog: {
      count: adapterCatalog.count,
      ids: adapterCatalog.ids.slice()
    },
    byComponent,
    slots: slotBindings,
    componentBindings,
    diagnostics
  };
}

function serializeCompositionGraph(graph) {
  return `${JSON.stringify(graph, null, 2)}\n`;
}

function createRmtVNextCompositionContract(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_COMPOSITION_SCHEMA,
    slotBindingSchema: RMT_VNEXT_SLOT_BINDING_SCHEMA,
    componentBindingSchema: RMT_VNEXT_COMPONENT_BINDING_SCHEMA,
    componentCatalogSchema: RMT_VNEXT_COMPONENT_CATALOG_SCHEMA,
    componentAdapterSchema: RMT_VNEXT_COMPONENT_ADAPTER_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_COMPOSITION_WORKPACKAGE,
    createGraph: (coreDocument, options = {}) => createCompositionGraph(coreDocument, {
      ...defaultOptions,
      ...options
    }),
    serializeGraph: serializeCompositionGraph
  });
}

module.exports = {
  COMPONENT_BINDING_CAPABILITY,
  COMPONENT_SLOT_CAPABILITY,
  COMPOSITION_COMPONENT_ADAPTER_MISSING_CODE,
  COMPOSITION_COMPONENT_REF_MISSING_CODE,
  COMPOSITION_COMPONENT_SLOT_UNSUPPORTED_CODE,
  COMPOSITION_COMPONENT_UNKNOWN_CODE,
  COMPOSITION_OPERATION_TARGET_UNSUPPORTED_CODE,
  COMPOSITION_SLOT_DUPLICATE_CODE,
  COMPOSITION_SLOT_OPERATION_REF_MISSING_CODE,
  COMPOSITION_SLOT_OPERATION_SCOPE_MISMATCH_CODE,
  COMPOSITION_SLOT_OWNER_MISSING_CODE,
  DEFAULT_COMPONENT_ADAPTER_ID,
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
};
