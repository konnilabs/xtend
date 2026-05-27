const {
  parseAndNormalizeRmtSource
} = require('./format-adapter');
const {
  parseRmtVNextSource
} = require('./vnext-parser');

const RMT_SEMANTIC_GRAPH_SCHEMA = 'xtend.rmt.semantic-graph.v1';
const RMT_SEMANTIC_GRAPH_REPORT_SCHEMA = 'xtend.rmt.semantic-graph-report.v1';
const RMT_SEMANTIC_GRAPH_WORKPACKAGE = 'WP-E14-04';
const RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_SCHEMA = 'xtend.rmt.vnext.primitive-semantic-graph.v1';
const RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_WORKPACKAGE = 'RMT-VNEXT-PRIM-03';
const RMT_SEMANTIC_GRAPH_MODULE_PATH = 'tools/rmt-language/semantic-graph.js';
const RMT_SEMANTIC_GRAPH_SUITE_PATH = 'tests/rmt-language/rmt_semantic_graph_suite.js';
const RMT_SEMANTIC_GRAPH_PACKAGE_SCRIPT = 'npm run test:rmt-semantic-graph';

const DOMAIN_NAMES = ['adapters', 'components', 'routes', 'schedules', 'surfaces', 'templates', 'validations', 'transitions'];
const RMT_VNEXT_PRIMITIVE_DOMAIN_NAMES = [
  'states',
  'selectors',
  'dataSources',
  'actions',
  'surfaces',
  'portals',
  'overlays',
  'resources',
  'validations',
  'transitions',
  'events'
];
const REFERENCE_DIAGNOSTIC_CODES = {
  adapters: 'rmt.adapter.unknown',
  components: 'rmt.ref.component.unresolved',
  templates: 'rmt.ref.template.unresolved',
  schedules: 'rmt.ref.schedule.unresolved',
  surfaces: 'rmt.ref.surface.unresolved',
  scheduleEndpoints: 'rmt.schedule.endpoint.missing'
};
const RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES = {
  duplicateId: 'rmt.vnext.primitive.duplicate-id',
  unknownReference: 'rmt.vnext.primitive.unknown-reference',
  ownerMissing: 'rmt.vnext.primitive.owner-missing',
  unkeyedRepeat: 'rmt.vnext.primitive.unkeyed-repeat',
  payloadContractMissing: 'rmt.vnext.primitive.payload-contract-missing',
  stateInitialMissing: 'rmt.vnext.primitive.initial-missing',
  resourceKindMissing: 'rmt.vnext.primitive.resource-kind-missing',
  actionReducerMissing: 'rmt.vnext.primitive.action-reducer-missing',
  effectSourceMissing: 'rmt.vnext.primitive.effect-source-missing',
  unsafeHtml: 'rmt.vnext.primitive.unsafe-html',
  kernelBoundary: 'rmt.vnext.primitive.kernel-boundary',
  validationMessageMissing: 'rmt.vnext.primitive.validation-message-missing'
};
const DUPLICATE_ID_CODE = 'rmt.id.duplicate';
const DUPLICATE_ROUTE_PATH_CODE = 'rmt.ref.route.duplicate-path';
const FABRIC_LANE_CONFLICT_CODE = 'rmt.fabric.lane.conflict';
const KNOWN_FABRIC_LANES = new Set([
  'background',
  'diagnostics',
  'idle',
  'transition',
  'user-blocking',
  'visible'
]);
const RMT_VNEXT_PRIMITIVE_TYPE_TO_DOMAIN = {
  RmtStateDeclaration: 'states',
  RmtSelectorDeclaration: 'selectors',
  RmtDataSourceDeclaration: 'dataSources',
  RmtActionDeclaration: 'actions',
  RmtValidationDeclaration: 'validations',
  RmtTransitionDeclaration: 'transitions',
  RmtSurfaceDeclaration: 'surfaces',
  RmtPortalDeclaration: 'portals',
  RmtOverlayDeclaration: 'overlays',
  RmtResourceDeclaration: 'resources'
};
const RMT_VNEXT_PRIMITIVE_SOURCE_DOMAIN_BY_KIND = {
  action: 'actions',
  datasource: 'dataSources',
  dataSource: 'dataSources',
  overlay: 'overlays',
  portal: 'portals',
  resource: 'resources',
  validation: 'validations',
  transition: 'transitions',
  selector: 'selectors',
  state: 'states',
  surface: 'surfaces'
};
const RMT_VNEXT_EXTERNAL_SOURCE_KINDS = new Set([
  'endpoint',
  'fixture',
  'sse',
  'worker'
]);
const RMT_VNEXT_AST_CHILD_KEYS = [
  'body',
  'attributes',
  'metadata',
  'payload',
  'source',
  'condition',
  'policy',
  'expression',
  'left',
  'right',
  'argument',
  'value',
  'dataType',
  'initial',
  'rules'
];

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeJsonPointerSegment(segment) {
  return String(segment).replace(/~/g, '~0').replace(/\//g, '~1');
}

function joinPointer(...segments) {
  return `/${segments.map(escapeJsonPointerSegment).join('/')}`;
}

function mapPush(map, key, value) {
  if (!map.has(key)) {
    map.set(key, []);
  }
  map.get(key).push(value);
}

function createFallbackRange(sourceModel) {
  if (sourceModel && typeof sourceModel.lineRange === 'function') {
    return sourceModel.lineRange(0);
  }

  return null;
}

function rangeForPointer(sourceModel, pointer, target = 'value') {
  if (!sourceModel || !pointer || typeof sourceModel.findJsonPointerRange !== 'function') {
    return createFallbackRange(sourceModel);
  }

  const pointerRange = sourceModel.findJsonPointerRange(pointer, { target });

  return pointerRange ? pointerRange.range : createFallbackRange(sourceModel);
}

function createSemanticDiagnostic(sourceModel, input = {}) {
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: 'rmt-language',
    code: input.code || 'rmt.semantic.diagnostic',
    severity: input.severity || 'error',
    message: input.message || input.code || 'RMT semantic diagnostic',
    uri: sourceModel ? sourceModel.uri : null,
    file: sourceModel ? sourceModel.filePath : null,
    pointer: input.pointer || null,
    range: input.range || rangeForPointer(sourceModel, input.pointer),
    workpackage: RMT_SEMANTIC_GRAPH_WORKPACKAGE,
    relatedInformation: input.relatedInformation || []
  };
}

function createDomainIndex(domain, records, sourceModel) {
  const byId = new Map();
  const byTag = new Map();
  const byPath = new Map();
  const byEndpointName = new Map();
  const byLane = new Map();
  const duplicates = [];
  const entries = toArray(records).map((record, index) => {
    const id = normalizeString(record && record.id);
    const pointer = joinPointer(domain, index);
    const idPointer = joinPointer(domain, index, 'id');
    const entry = {
      domain,
      index,
      id,
      record,
      pointer,
      idPointer,
      range: rangeForPointer(sourceModel, pointer),
      idRange: rangeForPointer(sourceModel, idPointer),
      tag: normalizeString(record && record.tag),
      path: normalizeString(record && record.path),
      endpointName: normalizeString(record && record.endpointName),
      lane: normalizeString(record && record.lane)
    };

    if (id) {
      if (byId.has(id)) {
        duplicates.push({
          domain,
          id,
          first: byId.get(id),
          duplicate: entry
        });
      } else {
        byId.set(id, entry);
      }
    }

    if (entry.tag) {
      mapPush(byTag, entry.tag, entry);
    }

    if (entry.path) {
      mapPush(byPath, entry.path, entry);
    }

    if (entry.endpointName) {
      mapPush(byEndpointName, entry.endpointName, entry);
    }

    if (entry.lane) {
      mapPush(byLane, entry.lane, entry);
    }

    return entry;
  });

  return {
    domain,
    records: entries,
    byId,
    byTag,
    byPath,
    byEndpointName,
    byLane,
    ids: entries.map((entry) => entry.id).filter(Boolean),
    duplicates
  };
}

function buildDomainIndexes(document, sourceModel) {
  const indexes = {};

  DOMAIN_NAMES.forEach((domain) => {
    indexes[domain] = createDomainIndex(domain, document && document[domain], sourceModel);
  });

  return indexes;
}

function createReferencesIndex() {
  return {
    records: [],
    bySourcePointer: new Map(),
    byTargetId: new Map(),
    unresolved: []
  };
}

function createTargetKey(targetDomain, targetId) {
  return `${targetDomain}:${targetId}`;
}

function resolveTarget(indexes, targetDomain, targetId) {
  if (targetDomain === 'scheduleEndpoints') {
    const matches = indexes.schedules.byEndpointName.get(targetId) || [];

    return matches.length > 0 ? matches[0] : null;
  }

  const index = indexes[targetDomain];

  return index && index.byId ? index.byId.get(targetId) || null : null;
}

function addReference(graphState, input = {}) {
  const targetId = normalizeString(input.targetId);

  if (!targetId) {
    return null;
  }

  const target = resolveTarget(graphState.indexes, input.targetDomain, targetId);
  const targetKey = createTargetKey(input.targetDomain, targetId);
  const reference = {
    sourceDomain: input.sourceDomain,
    sourceId: input.sourceId,
    sourcePointer: input.sourcePointer,
    sourceRange: rangeForPointer(graphState.sourceModel, input.sourcePointer),
    field: input.field,
    relationship: input.relationship,
    targetDomain: input.targetDomain,
    targetId,
    targetKey,
    resolved: !!target,
    target,
    targetPointer: target ? target.idPointer : null,
    targetRange: target ? target.idRange : null
  };

  graphState.references.records.push(reference);
  graphState.references.bySourcePointer.set(reference.sourcePointer, reference);
  mapPush(graphState.references.byTargetId, targetKey, reference);

  if (!reference.resolved) {
    const diagnostic = createSemanticDiagnostic(graphState.sourceModel, {
      code: REFERENCE_DIAGNOSTIC_CODES[input.targetDomain] || 'rmt.ref.unresolved',
      severity: input.severity || 'error',
      message: `${input.targetDomain} Referenz "${targetId}" ist nicht definiert.`,
      pointer: input.sourcePointer
    });
    reference.diagnostic = diagnostic;
    graphState.references.unresolved.push(reference);
    graphState.diagnostics.push(diagnostic);
  }

  return reference;
}

function collectSlotReferences(graphState, source, sourceInfo, pointer) {
  if (!source) {
    return;
  }

  if (Array.isArray(source)) {
    source.forEach((entry, index) => {
      collectSlotReferences(graphState, entry, sourceInfo, `${pointer}/${escapeJsonPointerSegment(index)}`);
    });
    return;
  }

  if (typeof source !== 'object') {
    return;
  }

  if (typeof source.component === 'string') {
    addReference(graphState, {
      ...sourceInfo,
      sourcePointer: `${pointer}/component`,
      field: 'component',
      relationship: `${sourceInfo.sourceDomain}.slot.component`,
      targetDomain: 'components',
      targetId: source.component
    });
  }

  if (typeof source.template === 'string') {
    addReference(graphState, {
      ...sourceInfo,
      sourcePointer: `${pointer}/template`,
      field: 'template',
      relationship: `${sourceInfo.sourceDomain}.slot.template`,
      targetDomain: 'templates',
      targetId: source.template
    });
  }

  if (source.slots) {
    Object.entries(source.slots).forEach(([slotName, slotValue]) => {
      collectSlotReferences(graphState, slotValue, sourceInfo, `${pointer}/slots/${escapeJsonPointerSegment(slotName)}`);
    });
  }

  if (source.children) {
    collectTemplateNodeReferences(graphState, source.children, sourceInfo, `${pointer}/children`);
  }

  if (source.nodes) {
    collectTemplateNodeReferences(graphState, source.nodes, sourceInfo, `${pointer}/nodes`);
  }
}

function collectCommandScheduleReferences(graphState, commands, sourceInfo, pointer) {
  Object.entries(toPlainObject(commands)).forEach(([commandName, command]) => {
    if (command && typeof command === 'object' && typeof command.schedule === 'string') {
      addReference(graphState, {
        ...sourceInfo,
        sourcePointer: `${pointer}/${escapeJsonPointerSegment(commandName)}/schedule`,
        field: 'schedule',
        relationship: `${sourceInfo.sourceDomain}.command.schedule`,
        targetDomain: 'schedules',
        targetId: command.schedule
      });
    }
  });
}

function collectTemplateNodeReferences(graphState, source, sourceInfo, pointer) {
  if (!source) {
    return;
  }

  if (Array.isArray(source)) {
    source.forEach((entry, index) => {
      collectTemplateNodeReferences(graphState, entry, sourceInfo, `${pointer}/${escapeJsonPointerSegment(index)}`);
    });
    return;
  }

  if (typeof source !== 'object') {
    return;
  }

  if (typeof source.component === 'string') {
    addReference(graphState, {
      ...sourceInfo,
      sourcePointer: `${pointer}/component`,
      field: 'component',
      relationship: 'template.node.component',
      targetDomain: 'components',
      targetId: source.component
    });
  }

  if (typeof source.template === 'string') {
    addReference(graphState, {
      ...sourceInfo,
      sourcePointer: `${pointer}/template`,
      field: 'template',
      relationship: 'template.node.template',
      targetDomain: 'templates',
      targetId: source.template
    });
  }

  if (typeof source.schedule === 'string') {
    addReference(graphState, {
      ...sourceInfo,
      sourcePointer: `${pointer}/schedule`,
      field: 'schedule',
      relationship: 'template.node.schedule',
      targetDomain: 'schedules',
      targetId: source.schedule
    });
  }

  if (source.slots) {
    Object.entries(source.slots).forEach(([slotName, slotValue]) => {
      collectSlotReferences(graphState, slotValue, sourceInfo, `${pointer}/slots/${escapeJsonPointerSegment(slotName)}`);
    });
  }

  if (source.children) {
    collectTemplateNodeReferences(graphState, source.children, sourceInfo, `${pointer}/children`);
  }

  if (source.nodes) {
    collectTemplateNodeReferences(graphState, source.nodes, sourceInfo, `${pointer}/nodes`);
  }
}

function collectMetadataReferences(graphState, metadata, sourceInfo, pointer) {
  const safeMetadata = toPlainObject(metadata);

  toArray(safeMetadata.componentRefs).forEach((componentId, index) => {
    if (typeof componentId === 'string') {
      addReference(graphState, {
        ...sourceInfo,
        sourcePointer: `${pointer}/componentRefs/${index}`,
        field: 'componentRefs',
        relationship: `${sourceInfo.sourceDomain}.metadata.componentRef`,
        targetDomain: 'components',
        targetId: componentId
      });
    }
  });

  if (typeof safeMetadata.lazySchedule === 'string') {
    addReference(graphState, {
      ...sourceInfo,
      sourcePointer: `${pointer}/lazySchedule`,
      field: 'lazySchedule',
      relationship: `${sourceInfo.sourceDomain}.metadata.lazySchedule`,
      targetDomain: 'schedules',
      targetId: safeMetadata.lazySchedule
    });
  }
}

function collectHydrationReferences(graphState, hydration, sourceInfo, pointer) {
  const endpointHint = hydration
    && hydration.metadata
    && typeof hydration.metadata.endpointHint === 'string'
    ? hydration.metadata.endpointHint
    : '';

  if (endpointHint) {
    addReference(graphState, {
      ...sourceInfo,
      sourcePointer: `${pointer}/metadata/endpointHint`,
      field: 'endpointHint',
      relationship: `${sourceInfo.sourceDomain}.hydration.endpoint`,
      targetDomain: 'scheduleEndpoints',
      targetId: endpointHint,
      severity: 'warning'
    });
  }
}

function collectComponentReferences(graphState, document) {
  toArray(document.components).forEach((component, index) => {
    const sourceInfo = {
      sourceDomain: 'components',
      sourceId: normalizeString(component.id)
    };
    const pointer = joinPointer('components', index);

    if (typeof component.adapter === 'string') {
      addReference(graphState, {
        ...sourceInfo,
        sourcePointer: `${pointer}/adapter`,
        field: 'adapter',
        relationship: 'component.adapter',
        targetDomain: 'adapters',
        targetId: component.adapter
      });
    }

    if (typeof component.schedule === 'string') {
      addReference(graphState, {
        ...sourceInfo,
        sourcePointer: `${pointer}/schedule`,
        field: 'schedule',
        relationship: 'component.schedule',
        targetDomain: 'schedules',
        targetId: component.schedule
      });
    }

    if (typeof component.template === 'string') {
      addReference(graphState, {
        ...sourceInfo,
        sourcePointer: `${pointer}/template`,
        field: 'template',
        relationship: 'component.template',
        targetDomain: 'templates',
        targetId: component.template
      });
    }

    if (typeof component.shell === 'string') {
      addReference(graphState, {
        ...sourceInfo,
        sourcePointer: `${pointer}/shell`,
        field: 'shell',
        relationship: 'component.shell',
        targetDomain: 'templates',
        targetId: component.shell
      });
    }

    Object.entries(toPlainObject(component.slots)).forEach(([slotName, slotValue]) => {
      collectSlotReferences(graphState, slotValue, sourceInfo, `${pointer}/slots/${escapeJsonPointerSegment(slotName)}`);
    });

    if (component.shell && typeof component.shell === 'object') {
      collectSlotReferences(graphState, component.shell, sourceInfo, `${pointer}/shell`);
    }

    collectCommandScheduleReferences(graphState, component.commands, sourceInfo, `${pointer}/commands`);
    collectMetadataReferences(graphState, component.metadata, sourceInfo, `${pointer}/metadata`);
  });
}

function collectRouteReferences(graphState, document) {
  toArray(document.routes).forEach((route, index) => {
    const sourceInfo = {
      sourceDomain: 'routes',
      sourceId: normalizeString(route.id)
    };
    const pointer = joinPointer('routes', index);

    [
      ['router', 'adapters', 'route.router'],
      ['component', 'components', 'route.component'],
      ['template', 'templates', 'route.template'],
      ['shell', 'templates', 'route.shell'],
      ['schedule', 'schedules', 'route.schedule']
    ].forEach(([field, targetDomain, relationship]) => {
      if (typeof route[field] === 'string') {
        addReference(graphState, {
          ...sourceInfo,
          sourcePointer: `${pointer}/${field}`,
          field,
          relationship,
          targetDomain,
          targetId: route[field]
        });
      }
    });
  });
}

function collectSurfaceReferences(graphState, document) {
  toArray(document.surfaces).forEach((surface, index) => {
    const sourceInfo = {
      sourceDomain: 'surfaces',
      sourceId: normalizeString(surface.id)
    };
    const pointer = joinPointer('surfaces', index);

    [
      ['adapter', 'adapters', 'surface.adapter'],
      ['manager', 'components', 'surface.manager'],
      ['component', 'components', 'surface.component'],
      ['route', 'routes', 'surface.route'],
      ['schedule', 'schedules', 'surface.schedule']
    ].forEach(([field, targetDomain, relationship]) => {
      if (typeof surface[field] === 'string') {
        addReference(graphState, {
          ...sourceInfo,
          sourcePointer: `${pointer}/${field}`,
          field,
          relationship,
          targetDomain,
          targetId: surface[field]
        });
      }
    });
  });
}

function collectTemplateReferences(graphState, document) {
  toArray(document.templates).forEach((template, index) => {
    const sourceInfo = {
      sourceDomain: 'templates',
      sourceId: normalizeString(template.id)
    };
    const pointer = joinPointer('templates', index);

    collectTemplateNodeReferences(graphState, template.nodes, sourceInfo, `${pointer}/nodes`);
    Object.entries(toPlainObject(template.slots)).forEach(([slotName, slotValue]) => {
      collectSlotReferences(graphState, slotValue, sourceInfo, `${pointer}/slots/${escapeJsonPointerSegment(slotName)}`);
    });
    collectMetadataReferences(graphState, template.metadata, sourceInfo, `${pointer}/metadata`);
    collectHydrationReferences(graphState, template.hydration, sourceInfo, `${pointer}/hydration`);
  });
}

function addDuplicateDiagnostics(graphState) {
  DOMAIN_NAMES.forEach((domain) => {
    graphState.indexes[domain].duplicates.forEach((duplicateInfo) => {
      graphState.diagnostics.push(createSemanticDiagnostic(graphState.sourceModel, {
        code: DUPLICATE_ID_CODE,
        severity: 'error',
        message: `${domain} ID "${duplicateInfo.id}" ist mehrfach definiert.`,
        pointer: duplicateInfo.duplicate.idPointer,
        relatedInformation: [{
          message: 'Erste Definition',
          pointer: duplicateInfo.first.idPointer,
          range: duplicateInfo.first.idRange
        }]
      }));
    });
  });

  graphState.indexes.routes.byPath.forEach((entries, routePath) => {
    if (entries.length <= 1) {
      return;
    }

    entries.slice(1).forEach((entry) => {
      graphState.diagnostics.push(createSemanticDiagnostic(graphState.sourceModel, {
        code: DUPLICATE_ROUTE_PATH_CODE,
        severity: 'warning',
        message: `Route Path "${routePath}" ist mehrfach definiert.`,
        pointer: `${entry.pointer}/path`,
        relatedInformation: [{
          message: 'Erste Route mit diesem Path',
          pointer: `${entries[0].pointer}/path`,
          range: rangeForPointer(graphState.sourceModel, `${entries[0].pointer}/path`)
        }]
      }));
    });
  });
}

function addFabricLaneDiagnostics(graphState, document) {
  const knownLanes = new Set(KNOWN_FABRIC_LANES);
  graphState.indexes.schedules.byLane.forEach((entries, lane) => {
    if (entries.length > 0) {
      knownLanes.add(lane);
    }
  });

  toArray(document.components).forEach((component, index) => {
    const fabricLane = component
      && component.metadata
      && component.metadata.fabric
      && typeof component.metadata.fabric.lane === 'string'
      ? component.metadata.fabric.lane
      : '';

    if (!fabricLane) {
      return;
    }

    const pointer = joinPointer('components', index, 'metadata', 'fabric', 'lane');
    const scheduleRef = normalizeString(component.schedule);
    const scheduleEntry = scheduleRef ? graphState.indexes.schedules.byId.get(scheduleRef) : null;

    if (!knownLanes.has(fabricLane)) {
      graphState.diagnostics.push(createSemanticDiagnostic(graphState.sourceModel, {
        code: 'rmt.fabric.lane.unknown',
        severity: 'warning',
        message: `Fabric Lane "${fabricLane}" ist nicht in RMT Schedules bekannt.`,
        pointer
      }));
      return;
    }

    if (scheduleEntry && scheduleEntry.lane && scheduleEntry.lane !== fabricLane) {
      graphState.diagnostics.push(createSemanticDiagnostic(graphState.sourceModel, {
        code: FABRIC_LANE_CONFLICT_CODE,
        severity: 'warning',
        message: `Fabric Lane "${fabricLane}" weicht von RMT Schedule Lane "${scheduleEntry.lane}" ab.`,
        pointer,
        relatedInformation: [{
          message: `Schedule "${scheduleRef}" definiert Lane "${scheduleEntry.lane}".`,
          pointer: `${scheduleEntry.pointer}/lane`,
          range: rangeForPointer(graphState.sourceModel, `${scheduleEntry.pointer}/lane`)
        }]
      }));
    }
  });
}

function buildReferences(graphState, document) {
  collectComponentReferences(graphState, document);
  collectRouteReferences(graphState, document);
  collectSurfaceReferences(graphState, document);
  collectTemplateReferences(graphState, document);
}

function createManifestHints(document) {
  const manifest = toPlainObject(document.manifest);
  const metadata = toPlainObject(manifest.metadata);

  return {
    documentId: normalizeString(manifest.documentId),
    namespace: normalizeString(manifest.namespace),
    contractVersion: normalizeString(metadata.contractVersion),
    workpackage: normalizeString(metadata.workpackage),
    metadata
  };
}

function createCatalogHints(indexes) {
  return {
    componentTags: Array.from(indexes.components.byTag.keys()).sort(),
    routePaths: Array.from(indexes.routes.byPath.keys()).sort(),
    surfaceTypes: indexes.surfaces.records.map((entry) => normalizeString(entry.record && entry.record.type)).filter(Boolean).sort(),
    scheduleLanes: Array.from(indexes.schedules.byLane.keys()).sort(),
    scheduleEndpoints: Array.from(indexes.schedules.byEndpointName.keys()).sort()
  };
}

function createEmptyIndexes() {
  const indexes = {};
  DOMAIN_NAMES.forEach((domain) => {
    indexes[domain] = createDomainIndex(domain, [], null);
  });
  return indexes;
}

function createVNextPrimitiveDiagnostic(sourceModel, input = {}) {
  const node = input.node || null;

  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: 'rmt-language',
    code: input.code || 'rmt.vnext.primitive.diagnostic',
    severity: input.severity || 'error',
    message: input.message || input.code || 'RMT vNext primitive diagnostic',
    uri: sourceModel ? sourceModel.uri : null,
    file: sourceModel ? sourceModel.filePath : null,
    pointer: input.pointer || (node && node.astPointer) || null,
    range: input.range || (node && node.range) || createFallbackRange(sourceModel),
    workpackage: RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_WORKPACKAGE,
    relatedInformation: input.relatedInformation || []
  };
}

function createVNextPrimitiveIndex(domain) {
  return {
    domain,
    records: [],
    byId: new Map(),
    ids: [],
    duplicates: []
  };
}

function createVNextPrimitiveIndexes() {
  const indexes = {};

  RMT_VNEXT_PRIMITIVE_DOMAIN_NAMES.forEach((domain) => {
    indexes[domain] = createVNextPrimitiveIndex(domain);
  });

  return indexes;
}

function primitiveValueToString(value) {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return normalizeString(value);
  }

  if (typeof value !== 'object') {
    return normalizeString(String(value));
  }

  if (Object.prototype.hasOwnProperty.call(value, 'value')) {
    const raw = value.value;
    return raw == null ? '' : normalizeString(String(raw));
  }

  if (Object.prototype.hasOwnProperty.call(value, 'path')) {
    return Array.isArray(value.path) ? normalizeString(value.path.join('.')) : normalizeString(String(value.path));
  }

  return '';
}

function primitiveValueToList(value) {
  if (!value) return [];
  if (value.kind === 'array') {
    return toArray(value.items).map((entry) => primitiveValueToString(entry)).filter(Boolean);
  }
  const single = primitiveValueToString(value);
  return single ? [single] : [];
}

function getPrimitiveAttribute(node, keyword) {
  return toArray(node && node.attributes).find((attribute) => attribute && attribute.keyword === keyword) || null;
}

function getPrimitiveAttributeValue(node, keyword) {
  const attribute = getPrimitiveAttribute(node, keyword);
  return attribute ? primitiveValueToString(attribute.value) : '';
}

function getPrimitiveSourceRef(node) {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (node.type === 'RmtPrimitiveSourceReference') {
    return {
      kind: normalizeString(node.kind),
      targetId: normalizeString(node.value),
      node
    };
  }

  if (node.type === 'RmtSourceClause') {
    return {
      kind: normalizeString(node.kind),
      targetId: normalizeString(node.target),
      node
    };
  }

  if (typeof node.kind === 'string' && typeof node.ref === 'string') {
    return {
      kind: normalizeString(node.kind),
      targetId: normalizeString(node.ref),
      node
    };
  }

  if (typeof node.kind === 'string' && typeof node.value === 'string') {
    return {
      kind: normalizeString(node.kind),
      targetId: normalizeString(node.value),
      node
    };
  }

  return null;
}

function walkVNextPrimitiveAst(node, visitor, state = {}) {
  if (!node || typeof node !== 'object' || typeof node.type !== 'string') {
    return;
  }

  const declarationDomain = RMT_VNEXT_PRIMITIVE_TYPE_TO_DOMAIN[node.type];
  let nextState = declarationDomain
    ? {
      ...state,
      currentDomain: declarationDomain,
      currentId: normalizeString(node.name)
    }
    : state;

  if (node.type === 'RmtSurfaceDeclaration') {
    nextState = {
      ...nextState,
      surface: node
    };
  }

  visitor(node, nextState);

  RMT_VNEXT_AST_CHILD_KEYS.forEach((key) => {
    const value = node[key];

    if (Array.isArray(value)) {
      value.forEach((entry) => walkVNextPrimitiveAst(entry, visitor, nextState));
    } else if (value && typeof value === 'object' && typeof value.type === 'string') {
      walkVNextPrimitiveAst(value, visitor, nextState);
    }
  });
}

function walkVNextPrimitiveDocument(ast, visitor) {
  toArray(ast && ast.body).forEach((entry) => {
    walkVNextPrimitiveAst(entry, visitor, {});
  });
}

function createVNextPrimitiveEntry(domain, node, index, extra = {}) {
  const id = normalizeString(extra.id || node.name);

  return {
    domain,
    index,
    id,
    node,
    pointer: node.astPointer || null,
    idPointer: node.astPointer || null,
    range: node.range || null,
    idRange: node.range || null,
    kind: extra.kind || getPrimitiveAttributeValue(node, 'kind'),
    owner: extra.owner || getPrimitiveAttributeValue(node, 'owner'),
    portal: extra.portal || getPrimitiveAttributeValue(node, 'portal'),
    source: extra.source || getPrimitiveSourceRef(node.source),
    surfaceId: extra.surfaceId || null,
    event: extra.event || null,
    action: extra.action || null
  };
}

function addVNextPrimitiveEntry(graphState, domain, node, extra = {}) {
  const index = graphState.indexes[domain];

  if (!index) {
    return null;
  }

  const entry = createVNextPrimitiveEntry(domain, node, index.records.length, extra);
  index.records.push(entry);

  if (entry.id) {
    if (index.byId.has(entry.id)) {
      const first = index.byId.get(entry.id);
      index.duplicates.push({
        domain,
        id: entry.id,
        first,
        duplicate: entry
      });
      graphState.diagnostics.push(createVNextPrimitiveDiagnostic(graphState.sourceModel, {
        code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.duplicateId,
        severity: 'error',
        message: `${domain} Primitive "${entry.id}" ist mehrfach definiert.`,
        node,
        relatedInformation: [{
          message: 'Erste Definition',
          pointer: first.pointer,
          range: first.range
        }]
      }));
    } else {
      index.byId.set(entry.id, entry);
    }

    index.ids.push(entry.id);
  }

  return entry;
}

function collectVNextPrimitiveDeclarations(graphState, ast) {
  walkVNextPrimitiveDocument(ast, (node, state) => {
    const domain = RMT_VNEXT_PRIMITIVE_TYPE_TO_DOMAIN[node.type];

    if (domain) {
      addVNextPrimitiveEntry(graphState, domain, node);
      return;
    }

    if (node.type === 'RmtEventBinding') {
      const surfaceId = state.surface ? normalizeString(state.surface.name) : '';
      const event = normalizeString(node.event);
      const eventIndex = graphState.indexes.events.records.length + 1;
      const id = normalizeString(surfaceId ? `${surfaceId}.${event}.${eventIndex}` : `${event}.${eventIndex}`);
      addVNextPrimitiveEntry(graphState, 'events', node, {
        id,
        surfaceId,
        event,
        action: normalizeString(node.action)
      });
    }
  });
}

function resolveVNextPrimitiveTarget(indexes, targetDomain, targetId) {
  const index = indexes[targetDomain];

  if (!index || !index.byId) {
    return null;
  }

  return index.byId.get(targetId) || null;
}

function resolveVNextStatePath(indexes, statePath) {
  const normalizedPath = normalizeString(statePath);

  if (!normalizedPath.startsWith('state.')) {
    return null;
  }

  const pathParts = normalizedPath.slice('state.'.length).split('.');

  while (pathParts.length > 0) {
    const candidate = pathParts.join('.');
    const match = resolveVNextPrimitiveTarget(indexes, 'states', candidate);

    if (match) {
      return match;
    }

    pathParts.pop();
  }

  return null;
}

function parseVNextOwnerReference(rawOwner) {
  const owner = normalizeString(rawOwner);

  if (!owner) {
    return null;
  }

  const match = /^([A-Za-z][A-Za-z0-9_-]*)\.(.+)$/.exec(owner);

  if (!match) {
    return {
      kind: '',
      id: owner,
      domain: null
    };
  }

  return {
    kind: match[1],
    id: match[2],
    domain: RMT_VNEXT_PRIMITIVE_SOURCE_DOMAIN_BY_KIND[match[1]] || null
  };
}

function createVNextPrimitiveReferencesIndex() {
  return createReferencesIndex();
}

function addVNextPrimitiveReference(graphState, input = {}) {
  const targetId = normalizeString(input.targetId);

  if (!targetId) {
    return null;
  }

  const target = input.target || resolveVNextPrimitiveTarget(graphState.indexes, input.targetDomain, targetId);
  const sourcePointer = input.sourcePointer || (input.node && input.node.astPointer) || null;
  const targetKey = createTargetKey(input.targetDomain, targetId);
  const reference = {
    sourceDomain: input.sourceDomain,
    sourceId: input.sourceId,
    sourcePointer,
    sourceRange: input.range || (input.node && input.node.range) || null,
    field: input.field,
    relationship: input.relationship,
    targetDomain: input.targetDomain,
    targetId,
    targetKey,
    resolved: !!target,
    target,
    targetPointer: target ? target.pointer : null,
    targetRange: target ? target.range : null
  };

  graphState.references.records.push(reference);

  if (sourcePointer) {
    graphState.references.bySourcePointer.set(sourcePointer, reference);
  }

  mapPush(graphState.references.byTargetId, targetKey, reference);

  if (!reference.resolved) {
    const diagnostic = createVNextPrimitiveDiagnostic(graphState.sourceModel, {
      code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.unknownReference,
      severity: input.severity || 'error',
      message: `${input.targetDomain} Primitive "${targetId}" ist nicht definiert.`,
      node: input.node,
      pointer: sourcePointer
    });
    reference.diagnostic = diagnostic;
    graphState.references.unresolved.push(reference);
    graphState.diagnostics.push(diagnostic);
  }

  return reference;
}

function findVNextSurfaceKey(surface) {
  return toArray(surface && surface.body).find((entry) => entry && entry.type === 'RmtSurfaceKeyClause') || null;
}

function stateHasInitialValue(state) {
  return Boolean(state && state.initial)
    || toArray(state && state.body).some((entry) => entry && entry.type === 'RmtInitialBlock');
}

function actionHasReducerTarget(action) {
  return toArray(action && action.body).some((entry) => {
    if (!entry) {
      return false;
    }

    if (entry.type === 'RmtReducerStatement') {
      return normalizeString(entry.target).startsWith('state.');
    }

    if (entry.type === 'RmtActionResultHandler') {
      return entry.effect
        && entry.effect.kind === 'reduce'
        && /\bstate\./u.test(normalizeString(entry.effect.text));
    }

    return false;
  });
}

function actionNeedsReducerTarget(action) {
  return toArray(action && action.body).some((entry) => entry && [
    'RmtActionInputClause',
    'RmtActionStatusClause',
    'RmtEffectStatement'
  ].includes(entry.type));
}

function listVNextEventPayloadMappings(eventBinding) {
  return toArray(eventBinding && eventBinding.policy && eventBinding.policy.body)
    .filter((entry) => entry && entry.type === 'RmtEventPayloadMapping');
}

function validationFieldHasMessage(fieldClause) {
  return toArray(fieldClause && fieldClause.rules).some((rule) => rule && rule.kind === 'message' && primitiveValueToString(rule.value));
}

function addVNextSourceReference(graphState, input = {}) {
  const sourceRef = getPrimitiveSourceRef(input.sourceRef || input.node);

  if (!sourceRef || !sourceRef.kind || !sourceRef.targetId) {
    return null;
  }

  if (RMT_VNEXT_EXTERNAL_SOURCE_KINDS.has(sourceRef.kind)) {
    return null;
  }

  const targetDomain = RMT_VNEXT_PRIMITIVE_SOURCE_DOMAIN_BY_KIND[sourceRef.kind];

  if (!targetDomain) {
    return null;
  }

  return addVNextPrimitiveReference(graphState, {
    sourceDomain: input.sourceDomain,
    sourceId: input.sourceId,
    sourcePointer: (sourceRef.node && sourceRef.node.astPointer) || (input.node && input.node.astPointer) || null,
    field: input.field || 'source',
    relationship: input.relationship || `${input.sourceDomain}.source`,
    targetDomain,
    targetId: sourceRef.targetId,
    node: sourceRef.node || input.node
  });
}

function addVNextStatePathReference(graphState, input = {}) {
  const stateTarget = resolveVNextStatePath(graphState.indexes, input.targetId);

  if (!stateTarget) {
    return addVNextPrimitiveReference(graphState, {
      ...input,
      targetDomain: 'states'
    });
  }

  return addVNextPrimitiveReference(graphState, {
    ...input,
    targetDomain: 'states',
    targetId: stateTarget.id,
    target: stateTarget
  });
}

function addVNextDestroyResourceReferences(graphState, node, sourceInfo) {
  const tokens = toArray(node && node.tokens);
  const releasesIndex = tokens.indexOf('releases');
  const resourceIndex = tokens.indexOf('resource');

  if (releasesIndex === -1 || resourceIndex === -1 || resourceIndex <= releasesIndex) {
    return;
  }

  const targetId = normalizeString(tokens.slice(resourceIndex + 1).join('').replace(/\s+/g, ''));

  if (!targetId) {
    return;
  }

  addVNextPrimitiveReference(graphState, {
    ...sourceInfo,
    sourcePointer: node.astPointer || null,
    field: 'destroy',
    relationship: `${sourceInfo.sourceDomain}.destroy.resource`,
    targetDomain: 'resources',
    targetId,
    node
  });
}

function addVNextKernelBoundaryDiagnostics(graphState, node) {
  const value = primitiveValueToString(node && node.value);

  if (!/(^|[\/@])(?:kernel|fabric)(?:$|[\/.:-])/i.test(value)) {
    return;
  }

  graphState.diagnostics.push(createVNextPrimitiveDiagnostic(graphState.sourceModel, {
    code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.kernelBoundary,
    severity: 'error',
    message: `Primitive Resource Import "${value}" verletzt die Kernel-/Fabric-Grenze.`,
    node
  }));
}

function addVNextUnsafeHtmlDiagnostics(graphState, node) {
  const text = normalizeString(node && (node.text || node.keyword || node.name));

  if (!/\b(?:innerHTML|unsafeHtml|rawHtml)\b/.test(text)) {
    return;
  }

  graphState.diagnostics.push(createVNextPrimitiveDiagnostic(graphState.sourceModel, {
    code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.unsafeHtml,
    severity: 'error',
    message: 'Primitive UI darf kein unsicheres HTML ohne Trust-Boundary deklarieren.',
    node
  }));
}

function collectVNextPrimitiveReferences(graphState, ast) {
  walkVNextPrimitiveDocument(ast, (node, state) => {
    const currentSurfaceId = state.surface ? normalizeString(state.surface.name) : '';
    const sourceInfo = {
      sourceDomain: state.currentDomain || (state.surface ? 'surfaces' : RMT_VNEXT_PRIMITIVE_TYPE_TO_DOMAIN[node.type]),
      sourceId: state.currentId || currentSurfaceId || normalizeString(node.name)
    };

    if (node.type === 'RmtSelectorDeclaration') {
      addVNextSourceReference(graphState, {
        sourceDomain: 'selectors',
        sourceId: normalizeString(node.name),
        sourceRef: node.source,
        relationship: 'selector.source',
        node
      });
    }

    if (node.type === 'RmtStateDeclaration' && !stateHasInitialValue(node)) {
      graphState.diagnostics.push(createVNextPrimitiveDiagnostic(graphState.sourceModel, {
        code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.stateInitialMissing,
        severity: 'warning',
        message: `State "${node.name}" besitzt keinen initial-Wert.`,
        node
      }));
    }

    if (node.type === 'RmtActionDeclaration' && actionNeedsReducerTarget(node) && !actionHasReducerTarget(node)) {
      graphState.diagnostics.push(createVNextPrimitiveDiagnostic(graphState.sourceModel, {
        code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.actionReducerMissing,
        severity: 'warning',
        message: `Action "${node.name}" besitzt kein Reducer-Ziel.`,
        node
      }));
    }

    if (node.type === 'RmtEffectStatement') {
      if (normalizeString(node.effectKind) === 'fetch' && !getPrimitiveSourceRef(node.source)) {
        graphState.diagnostics.push(createVNextPrimitiveDiagnostic(graphState.sourceModel, {
          code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.effectSourceMissing,
          severity: 'warning',
          message: 'Fetch-Effect besitzt keine datasource-, selector- oder resource-Quelle.',
          node
        }));
      }

      addVNextSourceReference(graphState, {
        ...sourceInfo,
        sourceRef: node.source,
        field: 'effect',
        relationship: `${sourceInfo.sourceDomain}.effect.source`,
        node
      });
    }

    if (node.type === 'RmtReducerStatement' && normalizeString(node.target).startsWith('state.')) {
      addVNextStatePathReference(graphState, {
        ...sourceInfo,
        sourcePointer: node.astPointer || null,
        field: 'reduce',
        relationship: `${sourceInfo.sourceDomain}.reduce.state`,
        targetId: normalizeString(node.target),
        node
      });
    }

    if (node.type === 'RmtEmitStatement') {
      const payloadMappings = toArray(node.payload);

      if (payloadMappings.length === 0) {
        graphState.diagnostics.push(createVNextPrimitiveDiagnostic(graphState.sourceModel, {
          code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.payloadContractMissing,
          severity: 'warning',
          message: `Emit "${node.event}" besitzt keinen Payload Contract.`,
          node
        }));
      }
    }

    if (node.type === 'RmtResourceDeclaration') {
      const kind = getPrimitiveAttributeValue(node, 'kind');
      const ownerAttribute = getPrimitiveAttribute(node, 'owner');
      const owner = primitiveValueToString(ownerAttribute && ownerAttribute.value);
      const ownerRef = parseVNextOwnerReference(owner);

      if (!kind) {
        graphState.diagnostics.push(createVNextPrimitiveDiagnostic(graphState.sourceModel, {
          code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.resourceKindMissing,
          severity: 'warning',
          message: `Resource "${node.name}" besitzt keinen kind.`,
          node
        }));
      }

      if (!ownerRef || !ownerRef.domain || !ownerRef.id) {
        graphState.diagnostics.push(createVNextPrimitiveDiagnostic(graphState.sourceModel, {
          code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.ownerMissing,
          severity: 'error',
          message: `Resource "${node.name}" braucht einen owner mit Surface- oder Overlay-Scope.`,
          node: ownerAttribute || node
        }));
      } else {
        addVNextPrimitiveReference(graphState, {
          sourceDomain: 'resources',
          sourceId: normalizeString(node.name),
          sourcePointer: (ownerAttribute && ownerAttribute.astPointer) || node.astPointer || null,
          field: 'owner',
          relationship: 'resource.owner',
          targetDomain: ownerRef.domain,
          targetId: ownerRef.id,
          node: ownerAttribute || node
        });
      }
    }

    if (node.type === 'RmtResourceSourceClause') {
      addVNextSourceReference(graphState, {
        ...sourceInfo,
        sourceDomain: sourceInfo.sourceDomain || 'resources',
        sourceId: sourceInfo.sourceId,
        field: 'source',
        relationship: `${sourceInfo.sourceDomain || 'resources'}.resource.source`,
        node
      });
    }

    if (node.type === 'RmtResourceImportClause') {
      addVNextKernelBoundaryDiagnostics(graphState, node);
    }

    if (node.type === 'RmtOverlayDeclaration') {
      const portalAttribute = getPrimitiveAttribute(node, 'portal');
      const portal = primitiveValueToString(portalAttribute && portalAttribute.value);

      if (portal) {
        addVNextPrimitiveReference(graphState, {
          sourceDomain: 'overlays',
          sourceId: normalizeString(node.name),
          sourcePointer: (portalAttribute && portalAttribute.astPointer) || node.astPointer || null,
          field: 'portal',
          relationship: 'overlay.portal',
          targetDomain: 'portals',
          targetId: portal,
          node: portalAttribute || node
        });
      }
    }

    if (node.type === 'RmtSurfaceSourceClause') {
      addVNextSourceReference(graphState, {
        ...sourceInfo,
        field: 'source',
        relationship: 'surface.source',
        node
      });
    }

    if (node.type === 'RmtSurfaceRepeatClause') {
      addVNextSourceReference(graphState, {
        ...sourceInfo,
        sourceRef: node.source,
        field: 'repeat',
        relationship: 'surface.repeat.source',
        node
      });

      if (!findVNextSurfaceKey(state.surface)) {
        graphState.diagnostics.push(createVNextPrimitiveDiagnostic(graphState.sourceModel, {
          code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.unkeyedRepeat,
          severity: 'error',
          message: `Surface "${currentSurfaceId || '<anonymous>'}" repeat braucht eine key-Klausel.`,
          node
        }));
      }
    }

    if (node.type === 'RmtSurfacePortalClause') {
      addVNextPrimitiveReference(graphState, {
        ...sourceInfo,
        sourcePointer: node.astPointer || null,
        field: 'portal',
        relationship: 'surface.portal',
        targetDomain: 'portals',
        targetId: normalizeString(node.path),
        node
      });
    }

    if (node.type === 'RmtSurfaceDestroyClause') {
      addVNextDestroyResourceReferences(graphState, node, sourceInfo);
    }

    if (node.type === 'RmtLifecycleStatement') {
      addVNextSourceReference(graphState, {
        ...sourceInfo,
        sourceRef: node.source,
        field: 'lifecycle.source',
        relationship: 'surface.lifecycle.source',
        node
      });
    }

    if (node.type === 'RmtEventBinding') {
      const actionId = normalizeString(node.action);

      if (actionId) {
        addVNextPrimitiveReference(graphState, {
          sourceDomain: 'events',
          sourceId: currentSurfaceId ? `${currentSurfaceId}.${node.event}` : normalizeString(node.event),
          sourcePointer: (node.actionNode && node.actionNode.astPointer) || node.astPointer || null,
          field: 'action',
          relationship: 'event.action',
          targetDomain: 'actions',
          targetId: actionId,
          node: node.actionNode || node
        });

        if (listVNextEventPayloadMappings(node).length === 0) {
          graphState.diagnostics.push(createVNextPrimitiveDiagnostic(graphState.sourceModel, {
            code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.payloadContractMissing,
            severity: 'error',
            message: `Event "${node.event}" routed zu Action "${actionId}" ohne Payload Contract.`,
            node
          }));
        }
      }
    }

    if (node.type === 'RmtValidationTargetClause') {
      addVNextPrimitiveReference(graphState, {
        sourceDomain: 'validations',
        sourceId: sourceInfo.sourceId,
        sourcePointer: (node.targetNode && node.targetNode.astPointer) || node.astPointer || null,
        field: 'target',
        relationship: 'validation.target',
        targetDomain: RMT_VNEXT_PRIMITIVE_SOURCE_DOMAIN_BY_KIND[node.kind] || 'actions',
        targetId: normalizeString(node.target),
        severity: 'warning',
        node: node.targetNode || node
      });
    }

    if (node.type === 'RmtValidationFieldClause') {
      addVNextPrimitiveReference(graphState, {
        sourceDomain: 'validations',
        sourceId: sourceInfo.sourceId,
        sourcePointer: (node.fieldNode && node.fieldNode.astPointer) || node.astPointer || null,
        field: 'field',
        relationship: 'validation.field.state',
        targetDomain: 'states',
        targetId: normalizeString(node.field),
        severity: 'warning',
        node: node.fieldNode || node
      });
      if (!validationFieldHasMessage(node)) {
        graphState.diagnostics.push(createVNextPrimitiveDiagnostic(graphState.sourceModel, {
          code: RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES.validationMessageMissing,
          severity: 'warning',
          message: `Validation Field "${node.field}" besitzt keine message.`,
          node
        }));
      }
    }

    if (node.type === 'RmtTransitionTriggerClause') {
      addVNextPrimitiveReference(graphState, {
        sourceDomain: 'transitions',
        sourceId: sourceInfo.sourceId,
        sourcePointer: (node.targetNode && node.targetNode.astPointer) || node.astPointer || null,
        field: 'trigger',
        relationship: 'transition.trigger',
        targetDomain: RMT_VNEXT_PRIMITIVE_SOURCE_DOMAIN_BY_KIND[node.kind] || 'actions',
        targetId: normalizeString(node.target),
        severity: 'warning',
        node: node.targetNode || node
      });
    }

    if (node.type === 'RmtTransitionFromClause' || node.type === 'RmtTransitionToClause') {
      primitiveValueToList(node.value).forEach((surfaceId) => {
        addVNextPrimitiveReference(graphState, {
          sourceDomain: 'transitions',
          sourceId: sourceInfo.sourceId,
          sourcePointer: node.astPointer || null,
          field: node.type === 'RmtTransitionFromClause' ? 'from' : 'to',
          relationship: node.type === 'RmtTransitionFromClause' ? 'transition.from.surface' : 'transition.to.surface',
          targetDomain: 'surfaces',
          targetId: normalizeString(surfaceId),
          severity: 'warning',
          node
        });
      });
    }

    addVNextUnsafeHtmlDiagnostics(graphState, node);
  });
}

function createVNextPrimitiveCatalogHints(indexes) {
  return {
    stateIds: indexes.states.ids.slice().sort(),
    selectorIds: indexes.selectors.ids.slice().sort(),
    dataSourceIds: indexes.dataSources.ids.slice().sort(),
    actionIds: indexes.actions.ids.slice().sort(),
    surfaceIds: indexes.surfaces.ids.slice().sort(),
    portalIds: indexes.portals.ids.slice().sort(),
    overlayIds: indexes.overlays.ids.slice().sort(),
    resourceIds: indexes.resources.ids.slice().sort(),
    transitionIds: indexes.transitions.ids.slice().sort(),
    eventIds: indexes.events.ids.slice().sort()
  };
}

function buildRmtVNextPrimitiveSemanticGraph(input = {}, options = {}) {
  const parserResult = options.parserResult || parseRmtVNextSource(input, options);
  const sourceModel = parserResult.sourceModel || null;
  const indexes = createVNextPrimitiveIndexes();
  const graphState = {
    sourceModel,
    indexes,
    references: createVNextPrimitiveReferencesIndex(),
    diagnostics: Array.isArray(parserResult.diagnostics) ? parserResult.diagnostics.slice() : []
  };

  if (parserResult.ok && parserResult.ast) {
    collectVNextPrimitiveDeclarations(graphState, parserResult.ast);
    collectVNextPrimitiveReferences(graphState, parserResult.ast);
  }

  function getDomainIndex(domain) {
    return indexes[domain] || null;
  }

  function getById(domain, id) {
    const index = getDomainIndex(domain);
    return index && index.byId ? index.byId.get(id) || null : null;
  }

  function getDefinition(domain, id) {
    return getById(domain, id);
  }

  function getDefinitionForReference(referenceOrPointer) {
    const reference = typeof referenceOrPointer === 'string'
      ? graphState.references.bySourcePointer.get(referenceOrPointer)
      : referenceOrPointer;

    if (!reference || !reference.resolved) {
      return null;
    }

    return reference.target;
  }

  function listDomainIds(domain) {
    const index = getDomainIndex(domain);
    return index ? index.ids.slice() : [];
  }

  function listCompletions(domain, completionOptions = {}) {
    const prefix = normalizeString(completionOptions.prefix);

    return listDomainIds(domain)
      .filter((id) => !prefix || id.startsWith(prefix))
      .map((id) => {
        const entry = getById(domain, id);
        return {
          label: id,
          insertText: id,
          detail: domain,
          kind: 'value',
          targetDomain: domain,
          pointer: entry ? entry.pointer : null,
          range: entry ? entry.range : null
        };
      });
  }

  function listReferencesForTarget(domain, id) {
    return (graphState.references.byTargetId.get(createTargetKey(domain, id)) || []).slice();
  }

  function findReferenceAtPointer(pointer) {
    return graphState.references.bySourcePointer.get(pointer) || null;
  }

  function listDiagnostics(filter = {}) {
    return graphState.diagnostics.filter((diagnostic) => {
      if (filter.severity && diagnostic.severity !== filter.severity) {
        return false;
      }
      if (filter.code && diagnostic.code !== filter.code) {
        return false;
      }
      return true;
    });
  }

  return {
    schema: RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_SCHEMA,
    reportSchema: RMT_SEMANTIC_GRAPH_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_WORKPACKAGE,
    ok: parserResult.ok && listDiagnostics({ severity: 'error' }).length === 0,
    status: parserResult.ok ? 'indexed' : 'source_unavailable',
    sourceModel,
    parserResult,
    ast: parserResult.ast || null,
    catalogHints: createVNextPrimitiveCatalogHints(indexes),
    indexes,
    references: graphState.references,
    diagnostics: graphState.diagnostics,
    getDomainIndex,
    getById,
    getDefinition,
    getDefinitionForReference,
    listDomainIds,
    listCompletions,
    listReferencesForTarget,
    findReferenceAtPointer,
    listDiagnostics
  };
}

function buildSemanticGraph(input = {}, options = {}) {
  const formatResult = options.formatResult || parseAndNormalizeRmtSource(input, options);
  const sourceModel = formatResult.sourceModel || (formatResult.parserResult && formatResult.parserResult.sourceModel) || null;
  const sourceDocument = formatResult.rawDocument || formatResult.normalizedDocument || {};
  const indexes = formatResult.ok ? buildDomainIndexes(sourceDocument, sourceModel) : createEmptyIndexes();
  const graphState = {
    sourceModel,
    indexes,
    references: createReferencesIndex(),
    diagnostics: Array.isArray(formatResult.diagnostics) ? formatResult.diagnostics.slice() : []
  };

  if (formatResult.ok) {
    addDuplicateDiagnostics(graphState);
    buildReferences(graphState, sourceDocument);
    addFabricLaneDiagnostics(graphState, sourceDocument);
  }

  function getDomainIndex(domain) {
    return indexes[domain] || null;
  }

  function getById(domain, id) {
    const index = getDomainIndex(domain);
    return index && index.byId ? index.byId.get(id) || null : null;
  }

  function getDefinition(domain, id) {
    if (domain === 'scheduleEndpoints') {
      const matches = indexes.schedules.byEndpointName.get(id) || [];
      return matches[0] || null;
    }

    return getById(domain, id);
  }

  function getDefinitionForReference(referenceOrPointer) {
    const reference = typeof referenceOrPointer === 'string'
      ? graphState.references.bySourcePointer.get(referenceOrPointer)
      : referenceOrPointer;

    if (!reference || !reference.resolved) {
      return null;
    }

    return reference.target;
  }

  function listDomainIds(domain) {
    const index = getDomainIndex(domain);
    return index ? index.ids.slice() : [];
  }

  function listCompletions(domain, completionOptions = {}) {
    const prefix = normalizeString(completionOptions.prefix);
    const ids = listDomainIds(domain);

    return ids
      .filter((id) => !prefix || id.startsWith(prefix))
      .map((id) => {
        const entry = getById(domain, id);
        return {
          label: id,
          insertText: id,
          detail: domain,
          kind: 'value',
          targetDomain: domain,
          pointer: entry ? entry.idPointer : null,
          range: entry ? entry.idRange : null
        };
      });
  }

  function listReferencesForTarget(domain, id) {
    return (graphState.references.byTargetId.get(createTargetKey(domain, id)) || []).slice();
  }

  function findReferenceAtPointer(pointer) {
    return graphState.references.bySourcePointer.get(pointer) || null;
  }

  function listDiagnostics(filter = {}) {
    return graphState.diagnostics.filter((diagnostic) => {
      if (filter.severity && diagnostic.severity !== filter.severity) {
        return false;
      }
      if (filter.code && diagnostic.code !== filter.code) {
        return false;
      }
      return true;
    });
  }

  return {
    schema: RMT_SEMANTIC_GRAPH_SCHEMA,
    reportSchema: RMT_SEMANTIC_GRAPH_REPORT_SCHEMA,
    workpackage: RMT_SEMANTIC_GRAPH_WORKPACKAGE,
    ok: formatResult.ok && listDiagnostics({ severity: 'error' }).length === 0,
    status: formatResult.ok ? 'indexed' : 'source_unavailable',
    sourceModel,
    formatResult,
    rawDocument: formatResult.rawDocument || null,
    normalizedDocument: formatResult.normalizedDocument || null,
    sourceDocument,
    manifestHints: createManifestHints(sourceDocument),
    catalogHints: createCatalogHints(indexes),
    indexes,
    references: graphState.references,
    diagnostics: graphState.diagnostics,
    getDomainIndex,
    getById,
    getDefinition,
    getDefinitionForReference,
    listDomainIds,
    listCompletions,
    listReferencesForTarget,
    findReferenceAtPointer,
    listDiagnostics
  };
}

module.exports = {
  DOMAIN_NAMES,
  DUPLICATE_ID_CODE,
  DUPLICATE_ROUTE_PATH_CODE,
  FABRIC_LANE_CONFLICT_CODE,
  REFERENCE_DIAGNOSTIC_CODES,
  RMT_VNEXT_PRIMITIVE_DIAGNOSTIC_CODES,
  RMT_VNEXT_PRIMITIVE_DOMAIN_NAMES,
  RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_SCHEMA,
  RMT_VNEXT_PRIMITIVE_SEMANTIC_GRAPH_WORKPACKAGE,
  RMT_SEMANTIC_GRAPH_MODULE_PATH,
  RMT_SEMANTIC_GRAPH_PACKAGE_SCRIPT,
  RMT_SEMANTIC_GRAPH_REPORT_SCHEMA,
  RMT_SEMANTIC_GRAPH_SCHEMA,
  RMT_SEMANTIC_GRAPH_SUITE_PATH,
  RMT_SEMANTIC_GRAPH_WORKPACKAGE,
  buildRmtVNextPrimitiveSemanticGraph,
  buildSemanticGraph,
  createSemanticDiagnostic,
  createVNextPrimitiveDiagnostic,
  escapeJsonPointerSegment,
  joinPointer
};
