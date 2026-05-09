const {
  DOMAIN_NAMES,
  buildSemanticGraph
} = require('./semantic-graph');

const RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA = 'xtend.rmt.document-symbols-provider.v1';
const RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA = 'xtend.rmt.document-symbols-report.v1';
const RMT_DOCUMENT_SYMBOL_SCHEMA = 'xtend.rmt.document-symbol.v1';
const RMT_DOCUMENT_SYMBOLS_WORKPACKAGE = 'WP-E14-08';
const RMT_DOCUMENT_SYMBOLS_MODULE_PATH = 'tools/rmt-language/symbols.js';
const RMT_DOCUMENT_SYMBOLS_SUITE_PATH = 'tests/rmt-language/rmt_navigation_suite.js';
const RMT_DOCUMENT_SYMBOLS_PACKAGE_SCRIPT = 'npm run test:rmt-navigation';

const DOMAIN_DETAILS = Object.freeze({
  adapters: 'Host-neutral adapter records',
  components: 'Component records and XTend custom element bindings',
  routes: 'Router records and route metadata',
  schedules: 'Scheduler endpoint, lane and fiber policies',
  templates: 'Template records and DOM descriptors'
});

const DOMAIN_CHILD_KIND = Object.freeze({
  adapters: 'adapter',
  components: 'component',
  routes: 'route',
  schedules: 'schedule',
  templates: 'template'
});

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildGraph(input = {}, options = {}) {
  return options.graph || buildSemanticGraph(input, options);
}

function rangeForPointer(graph, pointer, target = 'value') {
  const sourceModel = graph && graph.sourceModel;

  if (!sourceModel || typeof sourceModel.findJsonPointerRange !== 'function') {
    return null;
  }

  const pointerRange = sourceModel.findJsonPointerRange(pointer, { target });

  return pointerRange ? pointerRange.range : null;
}

function createDocumentSymbol(input = {}) {
  return {
    schema: RMT_DOCUMENT_SYMBOL_SCHEMA,
    name: input.name || '',
    kind: input.kind || 'value',
    detail: input.detail || '',
    pointer: input.pointer || null,
    range: input.range || null,
    selectionRange: input.selectionRange || input.range || null,
    children: toArray(input.children)
  };
}

function describeRecord(domain, entry) {
  const record = entry && entry.record ? entry.record : {};

  if (domain === 'adapters') {
    return record.kind || 'adapter';
  }

  if (domain === 'components') {
    return [entry.tag || 'component', record.schedule ? `schedule: ${record.schedule}` : '']
      .filter(Boolean)
      .join(' - ');
  }

  if (domain === 'routes') {
    return [entry.path || 'route', record.component ? `component: ${record.component}` : '']
      .filter(Boolean)
      .join(' - ');
  }

  if (domain === 'schedules') {
    return [entry.lane || 'lane', record.endpointName ? `endpoint: ${record.endpointName}` : '']
      .filter(Boolean)
      .join(' - ');
  }

  if (domain === 'templates') {
    return record.mode || 'template';
  }

  return domain;
}

function createDomainSymbol(graph, domain) {
  const index = graph.indexes && graph.indexes[domain];
  const children = toArray(index && index.records)
    .filter((entry) => entry.id)
    .map((entry) => createDocumentSymbol({
      name: entry.id,
      kind: DOMAIN_CHILD_KIND[domain] || 'value',
      detail: describeRecord(domain, entry),
      pointer: entry.idPointer,
      range: entry.range,
      selectionRange: entry.idRange
    }));

  return createDocumentSymbol({
    name: domain,
    kind: 'namespace',
    detail: DOMAIN_DETAILS[domain] || domain,
    pointer: `/${domain}`,
    range: rangeForPointer(graph, `/${domain}`),
    selectionRange: rangeForPointer(graph, `/${domain}`, 'key') || rangeForPointer(graph, `/${domain}`),
    children
  });
}

function getRmtDocumentSymbols(input = {}, options = {}) {
  const graph = buildGraph(input, options);

  if (!graph || graph.status === 'source_unavailable') {
    return {
      schema: RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA,
      providerSchema: RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA,
      symbolSchema: RMT_DOCUMENT_SYMBOL_SCHEMA,
      workpackage: RMT_DOCUMENT_SYMBOLS_WORKPACKAGE,
      status: 'source_unavailable',
      ok: false,
      symbolCount: 0,
      symbols: [],
      graphStatus: graph ? graph.status : null
    };
  }

  const symbols = DOMAIN_NAMES
    .filter((domain) => graph.indexes && graph.indexes[domain])
    .map((domain) => createDomainSymbol(graph, domain));

  return {
    schema: RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA,
    providerSchema: RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA,
    symbolSchema: RMT_DOCUMENT_SYMBOL_SCHEMA,
    workpackage: RMT_DOCUMENT_SYMBOLS_WORKPACKAGE,
    status: 'completed',
    ok: true,
    symbolCount: symbols.length,
    symbols,
    graphStatus: graph.status,
    manifestHints: graph.manifestHints || {},
    catalogHints: graph.catalogHints || {}
  };
}

function createRmtDocumentSymbolsProvider(defaultOptions = {}) {
  function documentSymbols(input = {}, options = {}) {
    return getRmtDocumentSymbols(input, {
      ...defaultOptions,
      ...options
    });
  }

  return Object.freeze({
    schema: RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA,
    reportSchema: RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA,
    symbolSchema: RMT_DOCUMENT_SYMBOL_SCHEMA,
    workpackage: RMT_DOCUMENT_SYMBOLS_WORKPACKAGE,
    documentSymbols
  });
}

module.exports = {
  RMT_DOCUMENT_SYMBOLS_MODULE_PATH,
  RMT_DOCUMENT_SYMBOLS_PACKAGE_SCRIPT,
  RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA,
  RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA,
  RMT_DOCUMENT_SYMBOLS_SUITE_PATH,
  RMT_DOCUMENT_SYMBOLS_SCHEMA: RMT_DOCUMENT_SYMBOL_SCHEMA,
  RMT_DOCUMENT_SYMBOLS_WORKPACKAGE,
  createDocumentSymbol,
  createRmtDocumentSymbolsProvider,
  getRmtDocumentSymbols
};
