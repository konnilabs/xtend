const {
  DOMAIN_NAMES,
  buildSemanticGraph
} = require('./semantic-graph');

const RMT_DEFINITION_PROVIDER_SCHEMA = 'xtend.rmt.definition-provider.v1';
const RMT_DEFINITION_REPORT_SCHEMA = 'xtend.rmt.definition-report.v1';
const RMT_DEFINITION_TARGET_SCHEMA = 'xtend.rmt.definition-target.v1';
const RMT_DEFINITION_WORKPACKAGE = 'WP-E14-08';
const RMT_DEFINITION_MODULE_PATH = 'tools/rmt-language/definitions.js';
const RMT_DEFINITION_SUITE_PATH = 'tests/rmt-language/rmt_navigation_suite.js';
const RMT_DEFINITION_PACKAGE_SCRIPT = 'npm run test:rmt-navigation';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function createDefinitionTarget(input = {}) {
  const entry = input.entry || null;
  const reference = input.reference || null;
  const domain = input.domain || (entry && entry.domain) || (reference && reference.targetDomain) || null;
  const id = input.id || (entry && entry.id) || (reference && reference.targetId) || null;

  if (!domain || !id) {
    return null;
  }

  return {
    schema: RMT_DEFINITION_TARGET_SCHEMA,
    domain,
    id,
    pointer: input.pointer || (entry && entry.idPointer) || (reference && reference.targetPointer) || null,
    range: input.range || (entry && entry.idRange) || (reference && reference.targetRange) || null,
    recordPointer: input.recordPointer || (entry && entry.pointer) || null,
    recordRange: input.recordRange || (entry && entry.range) || null,
    relationship: reference ? reference.relationship : input.relationship || null,
    sourcePointer: reference ? reference.sourcePointer : input.sourcePointer || null,
    sourceRange: reference ? reference.sourceRange : input.sourceRange || null,
    source: input.source || 'semantic-graph'
  };
}

function createReport(input = {}) {
  const target = input.target || null;

  return {
    schema: RMT_DEFINITION_REPORT_SCHEMA,
    providerSchema: RMT_DEFINITION_PROVIDER_SCHEMA,
    workpackage: RMT_DEFINITION_WORKPACKAGE,
    status: input.status || (target ? 'resolved' : 'unresolved'),
    ok: !!target,
    pointer: input.pointer || null,
    domain: input.domain || null,
    id: input.id || null,
    sourceDomain: input.sourceDomain || null,
    sourceId: input.sourceId || null,
    relationship: input.relationship || null,
    target,
    graphStatus: input.graphStatus || null
  };
}

function buildGraph(input = {}, options = {}) {
  return options.graph || buildSemanticGraph(input, options);
}

function findEntryAtPointer(graph, pointer) {
  const safePointer = normalizeString(pointer);

  if (!safePointer || !graph || !graph.indexes) {
    return null;
  }

  for (const domain of DOMAIN_NAMES) {
    const index = graph.indexes[domain];
    const record = toArray(index && index.records).find((entry) => {
      if (!entry) {
        return false;
      }

      return safePointer === entry.pointer
        || safePointer === entry.idPointer
        || safePointer.startsWith(`${entry.pointer}/`);
    });

    if (record) {
      return record;
    }
  }

  return null;
}

function getRmtDefinition(input = {}, options = {}) {
  const graph = buildGraph(input, options);
  const pointer = normalizeString(options.pointer || input.pointer);
  const domain = normalizeString(options.domain || input.domain);
  const id = normalizeString(options.id || input.id);

  if (!graph || graph.status === 'source_unavailable') {
    return createReport({
      status: 'source_unavailable',
      pointer,
      domain,
      id,
      graphStatus: graph ? graph.status : null
    });
  }

  if (pointer) {
    const reference = graph.findReferenceAtPointer(pointer);
    const definition = graph.getDefinitionForReference(reference);

    if (definition) {
      return createReport({
        status: 'resolved',
        pointer,
        sourceDomain: reference.sourceDomain,
        sourceId: reference.sourceId,
        relationship: reference.relationship,
        target: createDefinitionTarget({
          entry: definition,
          reference
        }),
        graphStatus: graph.status
      });
    }

    const entry = findEntryAtPointer(graph, pointer);
    if (entry && pointer === entry.idPointer) {
      return createReport({
        status: 'resolved',
        pointer,
        domain: entry.domain,
        id: entry.id,
        target: createDefinitionTarget({
          entry,
          source: 'semantic-graph.self'
        }),
        graphStatus: graph.status
      });
    }

    return createReport({
      status: reference ? 'unresolved' : 'not_found',
      pointer,
      sourceDomain: reference ? reference.sourceDomain : null,
      sourceId: reference ? reference.sourceId : null,
      relationship: reference ? reference.relationship : null,
      graphStatus: graph.status
    });
  }

  if (domain && id && typeof graph.getDefinition === 'function') {
    const entry = graph.getDefinition(domain, id);

    return createReport({
      status: entry ? 'resolved' : 'unresolved',
      domain,
      id,
      target: entry ? createDefinitionTarget({
        entry,
        domain,
        id,
        source: 'semantic-graph.direct-lookup'
      }) : null,
      graphStatus: graph.status
    });
  }

  return createReport({
    status: 'not_found',
    pointer,
    domain,
    id,
    graphStatus: graph.status
  });
}

function createRmtDefinitionProvider(defaultOptions = {}) {
  function getDefinition(input = {}, options = {}) {
    return getRmtDefinition(input, {
      ...defaultOptions,
      ...options
    });
  }

  return Object.freeze({
    schema: RMT_DEFINITION_PROVIDER_SCHEMA,
    reportSchema: RMT_DEFINITION_REPORT_SCHEMA,
    targetSchema: RMT_DEFINITION_TARGET_SCHEMA,
    workpackage: RMT_DEFINITION_WORKPACKAGE,
    getDefinition
  });
}

module.exports = {
  RMT_DEFINITION_MODULE_PATH,
  RMT_DEFINITION_PACKAGE_SCRIPT,
  RMT_DEFINITION_PROVIDER_SCHEMA,
  RMT_DEFINITION_REPORT_SCHEMA,
  RMT_DEFINITION_SUITE_PATH,
  RMT_DEFINITION_TARGET_SCHEMA,
  RMT_DEFINITION_WORKPACKAGE,
  createDefinitionTarget,
  createRmtDefinitionProvider,
  getRmtDefinition
};
