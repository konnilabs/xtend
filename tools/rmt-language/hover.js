const {
  buildSemanticGraph
} = require('./semantic-graph');
const {
  BUILT_IN_ADAPTER_IDS,
  DOMAIN_FIELD_COMPLETIONS,
  EVENT_KINDS,
  HYDRATION_POLICIES,
  OVERLAY_KINDS,
  PORTAL_POLICIES,
  RESOURCE_KINDS,
  SCHEDULE_LANES,
  SURFACE_STATES,
  SURFACE_TYPES,
  TEMPLATE_MODES,
  TRANSITION_EFFECTS,
  TOP_LEVEL_DOMAINS,
  VALIDATION_MODES,
  VALIDATION_RULES,
  loadComponentManifest
} = require('./completions');
const {
  createDefinitionTarget
} = require('./definitions');

const RMT_HOVER_PROVIDER_SCHEMA = 'xtend.rmt.hover-provider.v1';
const RMT_HOVER_REPORT_SCHEMA = 'xtend.rmt.hover-report.v1';
const RMT_HOVER_SCHEMA = 'xtend.rmt.hover.v1';
const RMT_HOVER_WORKPACKAGE = 'WP-E14-08';
const RMT_HOVER_MODULE_PATH = 'tools/rmt-language/hover.js';
const RMT_HOVER_SUITE_PATH = 'tests/rmt-language/rmt_navigation_suite.js';
const RMT_HOVER_PACKAGE_SCRIPT = 'npm run test:rmt-navigation';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function decodePointerSegment(segment) {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

function parsePointer(pointer) {
  const safePointer = normalizeString(pointer);

  if (!safePointer || safePointer === '/') {
    return [];
  }

  if (!safePointer.startsWith('/')) {
    return null;
  }

  return safePointer.slice(1).split('/').map(decodePointerSegment);
}

function getPointerValue(document, pointer) {
  const segments = parsePointer(pointer);

  if (!segments) {
    return undefined;
  }

  let node = document;

  for (const segment of segments) {
    if (node === null || node === undefined) {
      return undefined;
    }

    if (Array.isArray(node)) {
      if (!/^(0|[1-9]\d*)$/.test(segment)) {
        return undefined;
      }
      node = node[Number(segment)];
      continue;
    }

    if (typeof node === 'object') {
      node = node[segment];
      continue;
    }

    return undefined;
  }

  return node;
}

function rangeForPointer(graph, pointer, target = 'value') {
  const sourceModel = graph && graph.sourceModel;

  if (!sourceModel || typeof sourceModel.findJsonPointerRange !== 'function') {
    return null;
  }

  const pointerRange = sourceModel.findJsonPointerRange(pointer, { target });

  return pointerRange ? pointerRange.range : null;
}

function lookupEntry(entries, label) {
  const safeLabel = normalizeString(label);
  const match = entries.find((entry) => Array.isArray(entry) && entry[0] === safeLabel);

  return match ? {
    label: match[0],
    documentation: match[1] || ''
  } : null;
}

function createHover(input = {}) {
  const title = input.title || input.kind || 'RMT';
  const lines = [title, input.documentation || '', input.detail || ''].filter(Boolean);

  return {
    schema: RMT_HOVER_SCHEMA,
    kind: input.kind || 'value',
    title,
    markdown: lines.join('\n\n'),
    contents: lines,
    pointer: input.pointer || null,
    range: input.range || null,
    target: input.target || null,
    source: input.source || 'rmt-hover-provider'
  };
}

function buildGraph(input = {}, options = {}) {
  return options.graph || buildSemanticGraph(input, options);
}

function createReferenceHover(graph, pointer, reference) {
  const target = graph.getDefinitionForReference(reference);
  const staticAdapter = reference.targetDomain === 'adapters'
    ? lookupEntry(BUILT_IN_ADAPTER_IDS, reference.targetId)
    : null;
  const documentation = [
    `${reference.relationship} reference to ${reference.targetDomain} "${reference.targetId}".`,
    staticAdapter ? staticAdapter.documentation : '',
    reference.resolved ? `Definition: ${reference.targetPointer}` : 'Reference is unresolved.'
  ].filter(Boolean).join('\n');

  return createHover({
    kind: 'reference',
    title: `${reference.targetDomain}: ${reference.targetId}`,
    documentation,
    pointer,
    range: reference.sourceRange || rangeForPointer(graph, pointer),
    target: target ? createDefinitionTarget({
      entry: target,
      reference
    }) : null,
    source: 'semantic-graph.reference'
  });
}

function createStaticHover(graph, pointer, kind, value, catalogEntry, source) {
  return createHover({
    kind,
    title: value,
    documentation: catalogEntry.documentation,
    pointer,
    range: rangeForPointer(graph, pointer),
    source
  });
}

function createComponentTagHover(graph, pointer, value, options = {}) {
  const manifest = loadComponentManifest(options);
  const modulePath = manifest[value] || null;
  const documentation = modulePath
    ? `XTend Component Tag. Manifest module: ${modulePath}`
    : 'XTend Component Tag from the active RMT document.';

  return createHover({
    kind: 'component-tag',
    title: value,
    documentation,
    pointer,
    range: rangeForPointer(graph, pointer),
    source: modulePath ? 'components/manifest.json' : 'semantic-graph.catalogHints'
  });
}

function createTopLevelHover(graph, pointer, domain) {
  const entry = lookupEntry(TOP_LEVEL_DOMAINS, domain);

  if (!entry) {
    return null;
  }

  return createHover({
    kind: 'domain',
    title: domain,
    documentation: entry.documentation,
    pointer,
    range: rangeForPointer(graph, pointer, 'key') || rangeForPointer(graph, pointer),
    source: 'rmt-domain-catalog'
  });
}

function createFieldHover(graph, pointer, field) {
  const domain = (parsePointer(pointer) || [])[0] || '';
  const fieldCatalog = DOMAIN_FIELD_COMPLETIONS[domain] || [];

  if (!fieldCatalog.includes(field)) {
    return null;
  }

  return createHover({
    kind: 'field',
    title: field,
    documentation: `RMT ${domain} field.`,
    pointer,
    range: rangeForPointer(graph, pointer, 'key') || rangeForPointer(graph, pointer),
    source: 'rmt-domain-field-catalog'
  });
}

function inferStaticHover(graph, pointer, options = {}) {
  const segments = parsePointer(pointer) || [];
  const field = segments[segments.length - 1] || '';
  const value = getPointerValue(graph.sourceDocument, pointer);
  const stringValue = normalizeString(value);

  if (!stringValue) {
    return null;
  }

  if (field === 'tag') {
    return createComponentTagHover(graph, pointer, stringValue, options);
  }

  if (field === 'lane') {
    const entry = lookupEntry(SCHEDULE_LANES, stringValue);
    return entry ? createStaticHover(graph, pointer, 'lane', stringValue, entry, 'rmt-lane-catalog') : null;
  }

  if ((field === 'type' || field === 'kind') && pointer.startsWith('/surfaces/')) {
    const entry = lookupEntry(SURFACE_TYPES, stringValue);
    return entry ? createStaticHover(graph, pointer, 'surface-kind', stringValue, entry, 'rmt-surface-type-catalog') : null;
  }

  if (field === 'kind' && pointer.startsWith('/overlays/')) {
    const entry = lookupEntry(OVERLAY_KINDS, stringValue);
    return entry ? createStaticHover(graph, pointer, 'overlay-kind', stringValue, entry, 'rmt-app-platform-overlay-catalog') : null;
  }

  if (field === 'kind' && pointer.startsWith('/resources/')) {
    const entry = lookupEntry(RESOURCE_KINDS, stringValue);
    return entry ? createStaticHover(graph, pointer, 'resource-kind', stringValue, entry, 'rmt-app-platform-resource-catalog') : null;
  }

  if (field === 'kind' && pointer.startsWith('/events/')) {
    const entry = lookupEntry(EVENT_KINDS, stringValue);
    return entry ? createStaticHover(graph, pointer, 'event-kind', stringValue, entry, 'rmt-app-platform-event-catalog') : null;
  }

  if (field === 'policy' && pointer.startsWith('/portals/')) {
    const entry = lookupEntry(PORTAL_POLICIES, stringValue);
    return entry ? createStaticHover(graph, pointer, 'portal-policy', stringValue, entry, 'rmt-app-platform-portal-catalog') : null;
  }

  if ((field === 'initialState' || field === 'state') && pointer.startsWith('/surfaces/')) {
    const entry = lookupEntry(SURFACE_STATES, stringValue);
    return entry ? createStaticHover(graph, pointer, 'surface-state', stringValue, entry, 'rmt-app-platform-surface-state-catalog') : null;
  }

  if (field === 'mode' && pointer.includes('/hydration/')) {
    const entry = lookupEntry(HYDRATION_POLICIES, stringValue);
    return entry ? createStaticHover(graph, pointer, 'hydration-policy', stringValue, entry, 'rmt-hydration-policy-catalog') : null;
  }

  if (field === 'mode' && pointer.startsWith('/validations/')) {
    const entry = lookupEntry(VALIDATION_MODES, stringValue);
    return entry ? createStaticHover(graph, pointer, 'validation-mode', stringValue, entry, 'rmt-validation-mode-catalog') : null;
  }

  if (pointer.startsWith('/validations/') && segments.includes('rules')) {
    const entry = lookupEntry(VALIDATION_RULES, stringValue);
    return entry ? createStaticHover(graph, pointer, 'validation-rule', stringValue, entry, 'rmt-validation-rule-catalog') : null;
  }

  if (field === 'effect' && pointer.startsWith('/transitions/')) {
    const entry = lookupEntry(TRANSITION_EFFECTS, stringValue);
    return entry ? createStaticHover(graph, pointer, 'transition-effect', stringValue, entry, 'rmt-transition-effect-catalog') : null;
  }

  if (field === 'mode' && pointer.startsWith('/templates/')) {
    const entry = lookupEntry(TEMPLATE_MODES, stringValue);
    return entry ? createStaticHover(graph, pointer, 'template-mode', stringValue, entry, 'rmt-template-mode-catalog') : null;
  }

  return null;
}

function getRmtHover(input = {}, options = {}) {
  const graph = buildGraph(input, options);
  const pointer = normalizeString(options.pointer || input.pointer);

  if (!pointer) {
    return {
      schema: RMT_HOVER_REPORT_SCHEMA,
      providerSchema: RMT_HOVER_PROVIDER_SCHEMA,
      hoverSchema: RMT_HOVER_SCHEMA,
      workpackage: RMT_HOVER_WORKPACKAGE,
      status: 'not_found',
      ok: false,
      pointer,
      hover: null,
      graphStatus: graph ? graph.status : null
    };
  }

  if (!graph || graph.status === 'source_unavailable') {
    return {
      schema: RMT_HOVER_REPORT_SCHEMA,
      providerSchema: RMT_HOVER_PROVIDER_SCHEMA,
      hoverSchema: RMT_HOVER_SCHEMA,
      workpackage: RMT_HOVER_WORKPACKAGE,
      status: 'source_unavailable',
      ok: false,
      pointer,
      hover: null,
      graphStatus: graph ? graph.status : null
    };
  }

  const segments = parsePointer(pointer) || [];
  const field = segments[segments.length - 1] || '';
  const reference = graph.findReferenceAtPointer(pointer);
  const hover = reference
    ? createReferenceHover(graph, pointer, reference)
    : inferStaticHover(graph, pointer, options)
      || (segments.length === 1 ? createTopLevelHover(graph, pointer, segments[0]) : null)
      || createFieldHover(graph, pointer, field);

  return {
    schema: RMT_HOVER_REPORT_SCHEMA,
    providerSchema: RMT_HOVER_PROVIDER_SCHEMA,
    hoverSchema: RMT_HOVER_SCHEMA,
    workpackage: RMT_HOVER_WORKPACKAGE,
    status: hover ? 'found' : 'not_found',
    ok: !!hover,
    pointer,
    hover,
    graphStatus: graph.status,
    manifestHints: graph.manifestHints || {},
    catalogHints: graph.catalogHints || {}
  };
}

function createRmtHoverProvider(defaultOptions = {}) {
  function hover(input = {}, options = {}) {
    return getRmtHover(input, {
      ...defaultOptions,
      ...options
    });
  }

  return Object.freeze({
    schema: RMT_HOVER_PROVIDER_SCHEMA,
    reportSchema: RMT_HOVER_REPORT_SCHEMA,
    hoverSchema: RMT_HOVER_SCHEMA,
    workpackage: RMT_HOVER_WORKPACKAGE,
    hover
  });
}

module.exports = {
  RMT_HOVER_MODULE_PATH,
  RMT_HOVER_PACKAGE_SCRIPT,
  RMT_HOVER_PROVIDER_SCHEMA,
  RMT_HOVER_REPORT_SCHEMA,
  RMT_HOVER_SCHEMA,
  RMT_HOVER_SUITE_PATH,
  RMT_HOVER_WORKPACKAGE,
  createRmtHoverProvider,
  getRmtHover
};
