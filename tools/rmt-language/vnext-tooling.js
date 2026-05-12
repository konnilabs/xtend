'use strict';

const {
  createRmtSourceModel
} = require('./source-model');
const {
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('./vnext-compiler');

const RMT_VNEXT_TOOLING_SCHEMA = 'xtend.rmt.vnext-tooling-adapter.v1';
const RMT_VNEXT_TOOLING_REPORT_SCHEMA = 'xtend.rmt.vnext-tooling-report.v1';
const RMT_VNEXT_TOOLING_FORMATTER_SCHEMA = 'xtend.rmt.vnext-formatter.v1';
const RMT_VNEXT_TOOLING_WORKPACKAGE = 'WP-E15-15';
const RMT_VNEXT_TOOLING_MODULE_PATH = 'tools/rmt-language/vnext-tooling.js';
const RMT_VNEXT_TOOLING_SUITE_PATH = 'tests/rmt-language/rmt_vnext_tooling_suite.js';
const RMT_VNEXT_TOOLING_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-tooling';

const RMT_LINTER_REPORT_SCHEMA = 'xtend.rmt.linter.report.v1';
const RMT_LINTER_DIAGNOSTIC_SCHEMA = 'xtend.rmt.linter.diagnostic.v1';
const RMT_COMPLETION_REPORT_SCHEMA = 'xtend.rmt.completion-report.v1';
const RMT_COMPLETION_PROVIDER_SCHEMA = 'xtend.rmt.completion-provider.v1';
const RMT_COMPLETION_ITEM_SCHEMA = 'xtend.rmt.completion-item.v1';
const RMT_HOVER_REPORT_SCHEMA = 'xtend.rmt.hover-report.v1';
const RMT_HOVER_PROVIDER_SCHEMA = 'xtend.rmt.hover-provider.v1';
const RMT_HOVER_SCHEMA = 'xtend.rmt.hover.v1';
const RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA = 'xtend.rmt.document-symbols-report.v1';
const RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA = 'xtend.rmt.document-symbols-provider.v1';
const RMT_DOCUMENT_SYMBOL_SCHEMA = 'xtend.rmt.document-symbol.v1';
const RMT_DEFINITION_REPORT_SCHEMA = 'xtend.rmt.definition-report.v1';
const RMT_DEFINITION_PROVIDER_SCHEMA = 'xtend.rmt.definition-provider.v1';
const RMT_DEFINITION_TARGET_SCHEMA = 'xtend.rmt.definition-target.v1';

const VNEXT_COMPLETION_KEYWORDS = Object.freeze([
  ['import', 'Statischen vNext Modulimport deklarieren.'],
  ['template', 'Orchestrierungs-Template starten.'],
  ['remote surface', 'Remote Surface mit Manifest-, Owner- und Fallback-Fakten deklarieren.'],
  ['surface', 'Host-neutrale Surface deklarieren.'],
  ['lane', 'Scheduler Lane innerhalb einer Surface deklarieren.'],
  ['mount', 'Lifecycle Operation mount.'],
  ['hydrate', 'Lifecycle Operation hydrate.'],
  ['update', 'Lifecycle Operation update.'],
  ['unmount', 'Lifecycle Operation unmount.'],
  ['stream', 'Incremental Rendering Stream deklarieren.'],
  ['from', 'Data Source an eine Operation binden.'],
  ['when', 'Deklarative Condition ohne Runtime-Eval.'],
  ['slot', 'Composition Slot deklarieren.'],
  ['on', 'Event Binding deklarieren.'],
  ['action', 'Action Referenz fuer Event Binding.'],
  ['trust boundary', 'Security Trust Boundary setzen.'],
  ['sanitize', 'Sanitize Policy setzen.']
]);

const VNEXT_SOURCE_KINDS = Object.freeze([
  ['endpoint', 'Endpoint-basierte Data Source.'],
  ['sse', 'Server-Sent-Events Stream.'],
  ['worker', 'Worker-basierte Data Source.']
]);

const VNEXT_LANES = Object.freeze([
  ['critical', 'kritische Rendering-Arbeit'],
  ['visible', 'sichtbare Rendering-Arbeit'],
  ['user-blocking', 'User-blocking Interaktion'],
  ['transition', 'Route- oder UI-Transition'],
  ['idle', 'Idle Hydration oder deferred Work'],
  ['background', 'Hintergrundarbeit'],
  ['diagnostics', 'Diagnostics und Telemetry']
]);

const VNEXT_TRUST_BOUNDARIES = Object.freeze([
  ['xtend.security.sanitizing-boundary.v1', 'HTML-/Endpoint-Ergebnisse vor Rendering absichern.'],
  ['xtend.security.streaming-boundary.v1', 'Inkrementelle Stream-Fragmente absichern.'],
  ['xtend.security.worker-boundary.v1', 'Worker-Resultate an Message- und Sanitizing-Grenze binden.'],
  ['xtend.security.remote-surface.v1', 'Remote Surface an eine host-owned Trust Boundary binden.']
]);

const VNEXT_SNIPPETS = Object.freeze([
  {
    id: 'rmt-vnext-template',
    label: 'RMT vNext Template',
    prefix: 'rmt-vnext-template',
    description: 'Native vNext Template/Surface/Lane-Struktur.',
    body: [
      'template ${1:app.page} {',
      '  surface root {',
      '    lane ${2|critical,visible,transition,idle,background,diagnostics|} {',
      '      mount ${3:app-shell}',
      '    }',
      '  }',
      '}'
    ]
  },
  {
    id: 'rmt-vnext-stream',
    label: 'RMT vNext Stream',
    prefix: 'rmt-vnext-stream',
    description: 'Stream mit Data Source, Trust Boundary und Sanitizer.',
    body: [
      'stream ${1:live-feed} from ${2|endpoint,sse,worker|} ${3:feed.live} {',
      '  trust boundary "${4:xtend.security.streaming-boundary.v1}"',
      '  sanitize ${5:html}',
      '}'
    ]
  },
  {
    id: 'rmt-vnext-action',
    label: 'RMT vNext Event Action',
    prefix: 'rmt-vnext-action',
    description: 'Event Binding auf eine referenzielle Action.',
    body: [
      'on ${1:submit} -> action ${2:settings.save}'
    ]
  }
]);

const DOMAIN_CONFIG = Object.freeze({
  templates: { kind: 'template', label: 'Template', childKind: 'template' },
  surfaces: { kind: 'surface', label: 'Surface', childKind: 'namespace' },
  remoteSurfaces: { kind: 'remote-surface', label: 'Remote Surface', childKind: 'namespace' },
  lanes: { kind: 'lane', label: 'Lane', childKind: 'event' },
  operations: { kind: 'operation', label: 'Operation', childKind: 'function' },
  slots: { kind: 'slot', label: 'Slot', childKind: 'namespace' },
  events: { kind: 'event', label: 'Event', childKind: 'event' },
  dataSources: { kind: 'data-source', label: 'Data Source', childKind: 'interface' },
  securityPolicies: { kind: 'security-policy', label: 'Security Policy', childKind: 'key' }
});

const VNEXT_DOMAINS = Object.freeze(Object.keys(DOMAIN_CONFIG));

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function getInputText(input = {}) {
  return typeof input === 'string' ? input : String(input.text || '');
}

function createSourceModel(input = {}) {
  return createRmtSourceModel(typeof input === 'string' ? { text: input } : input);
}

function isLikelyRmtVNextSource(input = {}, options = {}) {
  if (options.languageMode === 'legacy') return false;
  if (options.languageMode === 'vnext') return true;

  const text = getInputText(input);
  const trimmed = text.trimStart();

  if (!trimmed || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return false;
  }

  return /^(?:import|template|surface|remote\s+surface)\b/u.test(trimmed)
    || /(?:^|\n)\s*(?:remote\s+surface|template|surface|lane|mount|hydrate|update|unmount|stream|slot|on\s+\S+\s+->\s+action|trust\s+boundary|sanitize)\b/u.test(text);
}

function sourceRefToRange(sourceMap, sourceRef) {
  const record = toArray(sourceMap).find((entry) => entry && entry.id === sourceRef);
  return record ? record.range : null;
}

function pointerToRange(sourceMap, pointer) {
  const record = toArray(sourceMap).find((entry) => entry && entry.corePointer === pointer);
  return record ? record.range : null;
}

function createIndexRecord(domain, record, index, sourceMap) {
  const pointer = `/${domain}/${index}`;
  const id = normalizeString(record && record.id) || `${domain}:${index}`;
  const sourceRef = record && record.sourceRef || null;
  const range = sourceRefToRange(sourceMap, sourceRef) || pointerToRange(sourceMap, pointer);
  const target = record && record.target && record.target.ref || record && record.target || record && record.name || id;

  return {
    domain,
    index,
    id,
    name: normalizeString(record && record.name) || normalizeString(target) || id,
    detail: describeRecord(domain, record),
    record,
    pointer,
    idPointer: pointer,
    range,
    idRange: range,
    sourceRef
  };
}

function describeRecord(domain, record = {}) {
  if (domain === 'operations') {
    return [record.op || record.kind || 'operation', record.target && record.target.ref].filter(Boolean).join(' ');
  }

  if (domain === 'lanes') {
    return [record.name || 'lane', `${toArray(record.operationRefs).length} operation(s)`].join(' - ');
  }

  if (domain === 'dataSources') {
    return [record.kind || 'source', record.target].filter(Boolean).join(' ');
  }

  if (domain === 'securityPolicies') {
    return [record.kind || 'policy', record.boundary || record.format].filter(Boolean).join(' ');
  }

  if (domain === 'events') {
    return [record.event || 'event', record.action ? `action: ${record.action}` : ''].filter(Boolean).join(' - ');
  }

  if (domain === 'remoteSurfaces') {
    return [record.name || 'remote surface', record.remote && record.remote.id, record.fallback && record.fallback.ref ? `fallback: ${record.fallback.ref}` : 'fallback missing'].filter(Boolean).join(' - ');
  }

  return record.name || record.id || domain;
}

function buildVNextIndexes(coreDocument) {
  const sourceMap = toArray(coreDocument && coreDocument.sourceMap);
  return VNEXT_DOMAINS.reduce((indexes, domain) => {
    const records = toArray(coreDocument && coreDocument[domain])
      .map((record, index) => createIndexRecord(domain, record, index, sourceMap));
    const byId = new Map(records.map((entry) => [entry.id, entry]));

    indexes[domain] = {
      domain,
      records,
      byId,
      ids: records.map((entry) => entry.id)
    };
    return indexes;
  }, {});
}

function createSourceMapSummary(sourceMap) {
  const records = toArray(sourceMap);
  const byNodeType = records.reduce((summary, record) => {
    const key = record && record.nodeType || 'unknown';
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {});

  return {
    totalCount: records.length,
    corePointerCount: records.filter((record) => record && record.corePointer).length,
    astPointerCount: records.filter((record) => record && record.astPointer).length,
    byNodeType
  };
}

function normalizeDiagnostic(diagnostic = {}, sourceModel = null) {
  return {
    schema: diagnostic.schema || RMT_LINTER_DIAGNOSTIC_SCHEMA,
    source: 'rmt-vnext-tooling',
    code: diagnostic.code || 'rmt.vnext.tooling.diagnostic',
    ruleId: diagnostic.ruleId || `vnext.${diagnostic.code || 'diagnostic'}`,
    severity: diagnostic.severity || 'error',
    category: diagnostic.category || 'vnext',
    message: diagnostic.message || diagnostic.code || 'RMT vNext diagnostic',
    uri: diagnostic.uri || (sourceModel ? sourceModel.uri : null),
    file: diagnostic.file || (sourceModel ? sourceModel.filePath : null),
    pointer: diagnostic.pointer || null,
    range: diagnostic.range || (sourceModel && sourceModel.lineRange ? sourceModel.lineRange(0) : null),
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    repair: diagnostic.repair || null,
    relatedInformation: diagnostic.relatedInformation || []
  };
}

function summarizeDiagnostics(diagnostics) {
  return diagnostics.reduce((summary, diagnostic) => {
    const severity = diagnostic.severity || 'info';
    const key = `${severity}Count`;
    summary.totalCount += 1;
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {
    totalCount: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    hintCount: 0
  });
}

function comparePosition(left = {}, right = {}) {
  if ((left.line || 0) !== (right.line || 0)) {
    return (left.line || 0) - (right.line || 0);
  }
  return (left.character || 0) - (right.character || 0);
}

function containsPosition(range, position = {}) {
  if (!range || !range.start || !range.end) return false;
  return comparePosition(position, range.start) >= 0 && comparePosition(position, range.end) <= 0;
}

function rangeSpan(range) {
  if (!range) return Number.MAX_SAFE_INTEGER;
  if (Number.isInteger(range.startOffset) && Number.isInteger(range.endOffset)) {
    return Math.max(0, range.endOffset - range.startOffset);
  }
  return ((range.end.line - range.start.line) * 10000) + (range.end.character - range.start.character);
}

function findRmtVNextPointerAtPosition(analysis, position = {}) {
  const sourceMap = toArray(analysis && analysis.sourceMap);
  const candidates = sourceMap
    .filter((record) => record && record.corePointer && containsPosition(record.range, position))
    .map((record) => ({
      pointer: record.corePointer,
      span: rangeSpan(record.range),
      nodeType: record.nodeType
    }))
    .sort((left, right) => {
      const spanDiff = left.span - right.span;
      return spanDiff !== 0 ? spanDiff : String(left.pointer).localeCompare(String(right.pointer));
    });

  return candidates[0] ? candidates[0].pointer : null;
}

function analyzeRmtVNextToolingSource(input = {}, options = {}) {
  const compileResult = compileRmtVNextSource(input, options);
  const sourceModel = compileResult.parserResult && compileResult.parserResult.sourceModel
    ? compileResult.parserResult.sourceModel
    : createSourceModel(input);
  const coreDocument = compileResult.coreDocument || null;
  const sourceMap = coreDocument ? toArray(coreDocument.sourceMap) : [];
  const diagnostics = toArray(compileResult.diagnostics).map((diagnostic) => normalizeDiagnostic(diagnostic, sourceModel));
  const status = compileResult.ok ? 'indexed' : 'source_unavailable';
  const indexes = coreDocument ? buildVNextIndexes(coreDocument) : buildVNextIndexes({});

  return {
    schema: RMT_VNEXT_TOOLING_SCHEMA,
    reportSchema: RMT_VNEXT_TOOLING_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    coreSchema: coreDocument && coreDocument.schema || RMT_VNEXT_CORE_SCHEMA,
    ok: compileResult.ok === true,
    status,
    graphStatus: status,
    phase: compileResult.phase,
    sourceModel,
    coreDocument,
    sourceDocument: coreDocument,
    ast: compileResult.parserResult && compileResult.parserResult.ast || null,
    sourceMap,
    sourceMapSummary: createSourceMapSummary(sourceMap),
    indexes,
    diagnostics,
    compileResult,
    findPointerAtPosition(position = {}) {
      return findRmtVNextPointerAtPosition(this, position);
    },
    getDefinition(domain, id) {
      const index = this.indexes && this.indexes[domain];
      return index && index.byId ? index.byId.get(id) || null : null;
    }
  };
}

function lintRmtVNextToolingSource(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const diagnostics = toArray(analysis.diagnostics);
  const summary = summarizeDiagnostics(diagnostics);
  const status = summary.errorCount > 0 ? 'failed' : 'passed';

  return {
    schema: RMT_LINTER_REPORT_SCHEMA,
    engineSchema: RMT_VNEXT_TOOLING_SCHEMA,
    semanticGraphSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    status,
    ok: status === 'passed',
    files: 1,
    graphStatus: analysis.graphStatus,
    coreSchema: analysis.coreSchema,
    sourceMapSummary: analysis.sourceMapSummary,
    providerCapabilities: ['completion', 'hover', 'symbols', 'definition', 'format'],
    diagnostics,
    ruleCount: 0,
    rules: [],
    ...summary
  };
}

function createCompletionItem(input = {}) {
  const label = normalizeString(input.label);
  return {
    schema: RMT_COMPLETION_ITEM_SCHEMA,
    label,
    insertText: input.insertText || label,
    kind: input.kind || 'keyword',
    detail: input.detail || '',
    documentation: input.documentation || '',
    source: input.source || 'rmt-vnext-tooling',
    targetDomain: input.targetDomain || null,
    pointer: input.pointer || null,
    range: input.range || null,
    sortText: input.sortText || label
  };
}

function staticCompletionItems(entries, base = {}) {
  return entries.map((entry, index) => createCompletionItem({
    ...base,
    label: entry[0],
    documentation: entry[1] || '',
    sortText: `${String(index).padStart(3, '0')}:${entry[0]}`
  }));
}

function inferCompletionContext(pointer, explicitContext) {
  if (explicitContext) return explicitContext;
  if (/^\/lanes(?:\/|$)/u.test(pointer)) return 'vnext-lanes';
  if (/^\/dataSources(?:\/|$)/u.test(pointer) || /\/source(?:\/|$)/u.test(pointer)) return 'vnext-source-kinds';
  if (/^\/securityPolicies(?:\/|$)/u.test(pointer)) return 'vnext-security';
  if (/^\/operations(?:\/|$)/u.test(pointer)) return 'vnext-operation-keywords';
  return 'vnext-keywords';
}

function sortItems(items) {
  return items.slice().sort((left, right) => String(left.sortText || left.label).localeCompare(String(right.sortText || right.label)));
}

function getRmtVNextToolingCompletions(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const pointer = normalizeString(options.pointer || input.pointer);
  const context = inferCompletionContext(pointer, options.context);
  const prefix = normalizeString(options.prefix);
  let items = [];

  if (context === 'vnext-lanes') {
    items = staticCompletionItems(VNEXT_LANES, { kind: 'enum', detail: 'vNext Scheduler Lane' });
  } else if (context === 'vnext-source-kinds') {
    items = staticCompletionItems(VNEXT_SOURCE_KINDS, { kind: 'enum', detail: 'vNext Data Source Kind' });
  } else if (context === 'vnext-security') {
    items = staticCompletionItems(VNEXT_TRUST_BOUNDARIES, { kind: 'reference', detail: 'vNext Trust Boundary' })
      .concat(createCompletionItem({
        label: 'html',
        kind: 'enum',
        detail: 'Sanitize Format',
        documentation: 'HTML Sanitizing fuer unsichere Stream- oder Endpoint-Flows.'
      }));
  } else if (context === 'vnext-snippets') {
    items = VNEXT_SNIPPETS.map((snippet, index) => createCompletionItem({
      label: snippet.label,
      insertText: snippet.body.join('\n'),
      kind: 'snippet',
      detail: snippet.prefix,
      documentation: snippet.description,
      source: 'rmt-vnext-snippet-catalog',
      sortText: `${String(index).padStart(3, '0')}:${snippet.label}`
    }));
  } else {
    items = staticCompletionItems(VNEXT_COMPLETION_KEYWORDS, { kind: 'keyword', detail: 'vNext Keyword' });
  }

  const filtered = prefix ? items.filter((item) => item.label.startsWith(prefix)) : items;

  return {
    schema: RMT_COMPLETION_REPORT_SCHEMA,
    providerSchema: RMT_COMPLETION_PROVIDER_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    status: analysis.graphStatus === 'source_unavailable' && context !== 'vnext-keywords' ? 'source_unavailable' : 'completed',
    ok: true,
    context,
    prefix,
    itemCount: filtered.length,
    items: sortItems(filtered),
    graphStatus: analysis.graphStatus,
    sourceMapSummary: analysis.sourceMapSummary
  };
}

function createHover(input = {}) {
  const title = input.title || input.kind || 'RMT vNext';
  const lines = [title, input.documentation || '', input.detail || ''].filter(Boolean);
  return {
    schema: RMT_HOVER_SCHEMA,
    kind: input.kind || 'vnext',
    title,
    markdown: lines.join('\n\n'),
    contents: lines,
    pointer: input.pointer || null,
    range: input.range || null,
    target: input.target || null,
    source: 'rmt-vnext-tooling'
  };
}

function findEntryByPointer(analysis, pointer) {
  for (const domain of VNEXT_DOMAINS) {
    const index = analysis.indexes && analysis.indexes[domain];
    const match = toArray(index && index.records).find((entry) => pointer === entry.pointer || pointer.startsWith(`${entry.pointer}/`));
    if (match) return match;
  }
  return null;
}

function getRmtVNextToolingHover(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const pointer = normalizeString(options.pointer || input.pointer);
  const entry = pointer ? findEntryByPointer(analysis, pointer) : null;
  const config = entry ? DOMAIN_CONFIG[entry.domain] : null;
  const hover = entry && config ? createHover({
    kind: config.kind,
    title: `${config.label}: ${entry.name || entry.id}`,
    documentation: entry.detail,
    detail: `Core Pointer: ${entry.pointer}`,
    pointer,
    range: entry.range
  }) : null;

  return {
    schema: RMT_HOVER_REPORT_SCHEMA,
    providerSchema: RMT_HOVER_PROVIDER_SCHEMA,
    hoverSchema: RMT_HOVER_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    status: hover ? 'found' : 'not_found',
    ok: !!hover,
    pointer,
    hover,
    graphStatus: analysis.graphStatus,
    sourceMapSummary: analysis.sourceMapSummary
  };
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

function getRmtVNextToolingDocumentSymbols(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const symbols = VNEXT_DOMAINS
    .filter((domain) => analysis.indexes && analysis.indexes[domain] && analysis.indexes[domain].records.length > 0)
    .map((domain) => {
      const config = DOMAIN_CONFIG[domain];
      return createDocumentSymbol({
        name: domain,
        kind: 'namespace',
        detail: `vNext ${config.label} Records`,
        pointer: `/${domain}`,
        range: toArray(analysis.indexes[domain].records)[0].range,
        children: analysis.indexes[domain].records.map((entry) => createDocumentSymbol({
          name: entry.name || entry.id,
          kind: config.childKind,
          detail: entry.detail,
          pointer: entry.pointer,
          range: entry.range,
          selectionRange: entry.idRange
        }))
      });
    });

  return {
    schema: RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA,
    providerSchema: RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA,
    symbolSchema: RMT_DOCUMENT_SYMBOL_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    status: analysis.ok ? 'completed' : 'source_unavailable',
    ok: analysis.ok,
    symbolCount: symbols.length,
    symbols,
    graphStatus: analysis.graphStatus,
    sourceMapSummary: analysis.sourceMapSummary
  };
}

function definitionTarget(entry, sourcePointer, relationship) {
  if (!entry) return null;
  return {
    schema: RMT_DEFINITION_TARGET_SCHEMA,
    domain: entry.domain,
    id: entry.id,
    pointer: entry.idPointer,
    range: entry.idRange,
    recordPointer: entry.pointer,
    recordRange: entry.range,
    relationship: relationship || null,
    sourcePointer: sourcePointer || null,
    sourceRange: null,
    source: 'rmt-vnext-tooling'
  };
}

function resolveDefinitionEntry(analysis, pointer) {
  const core = analysis.coreDocument || {};
  const segments = pointer.split('/').filter(Boolean);
  const domain = segments[0];
  const index = Number(segments[1]);
  const field = segments[2];
  const record = Number.isInteger(index) ? toArray(core[domain])[index] : null;

  if (!record) return null;

  if (domain === 'operations') {
    if (field === 'scope' && segments[3] === 'lane') return analysis.indexes.lanes.byId.get(record.scope && record.scope.lane) || null;
    if (field === 'scope' && segments[3] === 'surface') return analysis.indexes.surfaces.byId.get(record.scope && record.scope.surface) || null;
    if (field === 'scope' && segments[3] === 'template') return analysis.indexes.templates.byId.get(record.scope && record.scope.template) || null;
    if (field === 'source' || field === 'sourceRef') return analysis.indexes.dataSources.byId.get(record.source && record.source.ref) || null;
    if (field === 'policyRefs') {
      const policyRef = toArray(record.policyRefs)[Number(segments[3])];
      return analysis.indexes.securityPolicies.byId.get(policyRef) || analysis.indexes.slots.byId.get(policyRef) || null;
    }
  }

  if (field === 'ownerOperation') {
    return analysis.indexes.operations.byId.get(record.ownerOperation) || null;
  }

  if (field === 'operationRefs') {
    const operationRef = toArray(record.operationRefs)[Number(segments[3])];
    return analysis.indexes.operations.byId.get(operationRef) || null;
  }

  const selfEntry = analysis.indexes[domain] && analysis.indexes[domain].records[index];
  return selfEntry && (pointer === selfEntry.pointer || pointer === selfEntry.idPointer) ? selfEntry : null;
}

function getRmtVNextToolingDefinition(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const pointer = normalizeString(options.pointer || input.pointer);
  const targetEntry = pointer ? resolveDefinitionEntry(analysis, pointer) : null;
  const target = definitionTarget(targetEntry, pointer, targetEntry ? 'vnext.core-ref' : null);

  return {
    schema: RMT_DEFINITION_REPORT_SCHEMA,
    providerSchema: RMT_DEFINITION_PROVIDER_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    status: target ? 'resolved' : 'not_found',
    ok: !!target,
    pointer,
    domain: targetEntry ? targetEntry.domain : null,
    id: targetEntry ? targetEntry.id : null,
    sourceDomain: pointer ? pointer.split('/').filter(Boolean)[0] || null : null,
    sourceId: null,
    relationship: target ? target.relationship : null,
    target,
    graphStatus: analysis.graphStatus,
    sourceMapSummary: analysis.sourceMapSummary
  };
}

function formatRmtVNextSource(input = {}, options = {}) {
  const text = getInputText(input);
  const analysis = options.analysis || analyzeRmtVNextToolingSource(input, options);
  const formatted = `${text
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/u, ''))
    .join('\n')
    .replace(/\n{3,}/gu, '\n\n')
    .replace(/\s*$/u, '')}\n`;

  return {
    schema: RMT_VNEXT_TOOLING_FORMATTER_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    languageMode: 'vnext',
    status: analysis.ok ? 'formatted' : 'syntax_error',
    ok: analysis.ok,
    strategy: 'conservative-source-preserving',
    changed: formatted !== text,
    text: formatted,
    diagnostics: analysis.ok ? [] : analysis.diagnostics,
    sourceMapSummary: analysis.sourceMapSummary
  };
}

function createRmtVNextToolingAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_TOOLING_SCHEMA,
    reportSchema: RMT_VNEXT_TOOLING_REPORT_SCHEMA,
    formatterSchema: RMT_VNEXT_TOOLING_FORMATTER_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    analyze: (input = {}, options = {}) => analyzeRmtVNextToolingSource(input, { ...defaultOptions, ...options }),
    lint: (input = {}, options = {}) => lintRmtVNextToolingSource(input, { ...defaultOptions, ...options }),
    complete: (input = {}, options = {}) => getRmtVNextToolingCompletions(input, { ...defaultOptions, ...options }),
    hover: (input = {}, options = {}) => getRmtVNextToolingHover(input, { ...defaultOptions, ...options }),
    documentSymbols: (input = {}, options = {}) => getRmtVNextToolingDocumentSymbols(input, { ...defaultOptions, ...options }),
    definition: (input = {}, options = {}) => getRmtVNextToolingDefinition(input, { ...defaultOptions, ...options }),
    format: (input = {}, options = {}) => formatRmtVNextSource(input, { ...defaultOptions, ...options })
  });
}

module.exports = {
  RMT_VNEXT_TOOLING_FORMATTER_SCHEMA,
  RMT_VNEXT_TOOLING_MODULE_PATH,
  RMT_VNEXT_TOOLING_PACKAGE_SCRIPT,
  RMT_VNEXT_TOOLING_REPORT_SCHEMA,
  RMT_VNEXT_TOOLING_SCHEMA,
  RMT_VNEXT_TOOLING_SUITE_PATH,
  RMT_VNEXT_TOOLING_WORKPACKAGE,
  VNEXT_COMPLETION_KEYWORDS,
  VNEXT_LANES,
  VNEXT_SNIPPETS,
  VNEXT_SOURCE_KINDS,
  VNEXT_TRUST_BOUNDARIES,
  analyzeRmtVNextToolingSource,
  createRmtVNextToolingAdapter,
  findRmtVNextPointerAtPosition,
  formatRmtVNextSource,
  getRmtVNextToolingCompletions,
  getRmtVNextToolingDefinition,
  getRmtVNextToolingDocumentSymbols,
  getRmtVNextToolingHover,
  isLikelyRmtVNextSource,
  lintRmtVNextToolingSource
};
