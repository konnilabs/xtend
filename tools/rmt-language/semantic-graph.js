const {
  parseAndNormalizeRmtSource
} = require('./format-adapter');

const RMT_SEMANTIC_GRAPH_SCHEMA = 'xtend.rmt.semantic-graph.v1';
const RMT_SEMANTIC_GRAPH_REPORT_SCHEMA = 'xtend.rmt.semantic-graph-report.v1';
const RMT_SEMANTIC_GRAPH_WORKPACKAGE = 'WP-E14-04';
const RMT_SEMANTIC_GRAPH_MODULE_PATH = 'tools/rmt-language/semantic-graph.js';
const RMT_SEMANTIC_GRAPH_SUITE_PATH = 'tests/rmt-language/rmt_semantic_graph_suite.js';
const RMT_SEMANTIC_GRAPH_PACKAGE_SCRIPT = 'npm run test:rmt-semantic-graph';

const DOMAIN_NAMES = ['adapters', 'components', 'routes', 'schedules', 'surfaces', 'templates'];
const REFERENCE_DIAGNOSTIC_CODES = {
  adapters: 'rmt.adapter.unknown',
  components: 'rmt.ref.component.unresolved',
  templates: 'rmt.ref.template.unresolved',
  schedules: 'rmt.ref.schedule.unresolved',
  surfaces: 'rmt.ref.surface.unresolved',
  scheduleEndpoints: 'rmt.schedule.endpoint.missing'
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
  RMT_SEMANTIC_GRAPH_MODULE_PATH,
  RMT_SEMANTIC_GRAPH_PACKAGE_SCRIPT,
  RMT_SEMANTIC_GRAPH_REPORT_SCHEMA,
  RMT_SEMANTIC_GRAPH_SCHEMA,
  RMT_SEMANTIC_GRAPH_SUITE_PATH,
  RMT_SEMANTIC_GRAPH_WORKPACKAGE,
  buildSemanticGraph,
  createSemanticDiagnostic,
  escapeJsonPointerSegment,
  joinPointer
};
