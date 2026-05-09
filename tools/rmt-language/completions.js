const fs = require('fs');
const path = require('path');
const {
  buildSemanticGraph
} = require('./semantic-graph');

const RMT_COMPLETION_PROVIDER_SCHEMA = 'xtend.rmt.completion-provider.v1';
const RMT_COMPLETION_REPORT_SCHEMA = 'xtend.rmt.completion-report.v1';
const RMT_COMPLETION_ITEM_SCHEMA = 'xtend.rmt.completion-item.v1';
const RMT_COMPLETION_WORKPACKAGE = 'WP-E14-07';
const RMT_COMPLETION_MODULE_PATH = 'tools/rmt-language/completions.js';
const RMT_COMPLETION_SUITE_PATH = 'tests/rmt-language/rmt_completion_suite.js';
const RMT_COMPLETION_PACKAGE_SCRIPT = 'npm run test:rmt-completions';

const TOP_LEVEL_DOMAINS = Object.freeze([
  ['manifest', 'object', 'RMT manifest metadata.'],
  ['adapters', 'array', 'Host-neutral adapter records.'],
  ['components', 'array', 'Component records and XTend custom element bindings.'],
  ['routes', 'array', 'Route records for router adapters.'],
  ['schedules', 'array', 'Scheduler policies and endpoint names.'],
  ['surfaces', 'array', 'Surface records for WindowManager, SidePanel and overlay adapter handoff.'],
  ['templates', 'array', 'Template records and DOM descriptors.'],
  ['diagnostics', 'object', 'Optional diagnostics and gate metadata.'],
  ['extensionSlots', 'object', 'Optional host extension slots.']
]);

const DOMAIN_FIELD_COMPLETIONS = Object.freeze({
  manifest: ['documentId', 'namespace', 'metadata', 'sourceUrl'],
  adapters: ['id', 'kind', 'runtimeSurface', 'providedCapabilities', 'kernelVisible'],
  components: ['id', 'kind', 'adapter', 'tag', 'schedule', 'props', 'attributes', 'slots', 'events', 'hydration', 'metadata'],
  routes: ['id', 'path', 'router', 'component', 'template', 'shell', 'schedule', 'documentTitle', 'metaDescription', 'metadata'],
  schedules: ['id', 'endpointName', 'lane', 'fiber', 'priority', 'budgetMs', 'deadlineMs', 'preferIdle', 'coalesceKey'],
  surfaces: ['id', 'schema', 'type', 'adapter', 'manager', 'component', 'route', 'schedule', 'stateKey', 'defaultOpen', 'active', 'bounds', 'placement', 'mode', 'layer', 'capabilities', 'a11y', 'persistence', 'metadata'],
  templates: ['id', 'mode', 'nodes', 'slots', 'hydration', 'metadata', 'security'],
  routeMetadata: ['title', 'documentTitle', 'titleTemplate', 'metaDescription', 'contentKind', 'announcement', 'a11y'],
  hydrationMetadata: ['endpointHint', 'scheduleRef', 'policy', 'deferUntil']
});

const BUILT_IN_ADAPTER_IDS = Object.freeze([
  ['xtend.component', 'XTend UI component adapter.'],
  ['xtend.xrouter', 'XRouter route adapter.'],
  ['xtend.surface', 'XTend Surface adapter handoff for native surfaces records.'],
  ['rmt.state-scheduler-diagnostics', 'RMT scheduler diagnostics adapter.'],
  ['xtend.fabric-telemetry', 'XTend Fabric telemetry adapter.']
]);

const SCHEDULE_LANES = Object.freeze([
  ['critical', 'Critical blocking work.'],
  ['visible', 'Visible rendering work.'],
  ['user-blocking', 'User blocking interaction work.'],
  ['transition', 'Route or UI transition work.'],
  ['background', 'Background work.'],
  ['idle', 'Idle hydration or deferred work.'],
  ['diagnostics', 'Diagnostics and telemetry work.']
]);

const HYDRATION_POLICIES = Object.freeze([
  ['runtime_render', 'Render at runtime in the host adapter.'],
  ['hydrate_prerendered', 'Hydrate prerendered content.'],
  ['worker_prerender_hydrate', 'Worker prerender with later hydration.'],
  ['server_prerender_hydrate', 'Server prerender with later hydration.'],
  ['prerender_only', 'Prerender without client hydration.'],
  ['managed_subtree', 'Adapter owns a managed subtree.'],
  ['manual', 'Manual hydration policy.'],
  ['none', 'No hydration.']
]);

const TEMPLATE_MODES = Object.freeze([
  ['dom_descriptor', 'Structured DOM descriptor template.'],
  ['html_fragment', 'Trusted HTML fragment template.'],
  ['text', 'Plain text template.']
]);

const SURFACE_TYPES = Object.freeze([
  ['window', 'Movable and resizable workspace window.'],
  ['side-panel', 'Docked, pinned, collapsed or responsive side panel.'],
  ['modal', 'Modal overlay surface in the shared stack.'],
  ['dialog', 'Dialog overlay surface in the shared stack.'],
  ['drawer', 'Drawer overlay surface in the shared stack.']
]);

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueByLabel(items) {
  const seen = new Set();
  const unique = [];

  items.forEach((item) => {
    if (!item || !item.label || seen.has(item.label)) {
      return;
    }

    seen.add(item.label);
    unique.push(item);
  });

  return unique;
}

function sortCompletionItems(items) {
  return uniqueByLabel(items).sort((a, b) => {
    const sortDiff = String(a.sortText || a.label).localeCompare(String(b.sortText || b.label));

    if (sortDiff !== 0) {
      return sortDiff;
    }

    return String(a.label).localeCompare(String(b.label));
  });
}

function createCompletionItem(input = {}) {
  const label = normalizeString(input.label);

  return {
    schema: RMT_COMPLETION_ITEM_SCHEMA,
    label,
    insertText: input.insertText || label,
    kind: input.kind || 'value',
    detail: input.detail || '',
    documentation: input.documentation || '',
    source: input.source || 'rmt-completion-provider',
    targetDomain: input.targetDomain || null,
    pointer: input.pointer || null,
    range: input.range || null,
    sortText: input.sortText || label
  };
}

function createStaticItems(entries, base = {}) {
  return entries.map((entry, index) => {
    const label = Array.isArray(entry) ? entry[0] : entry;
    const documentation = Array.isArray(entry) ? entry[1] : '';

    return createCompletionItem({
      ...base,
      label,
      documentation,
      sortText: `${String(index).padStart(3, '0')}:${label}`
    });
  });
}

function loadComponentManifest(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const manifestPath = options.componentManifestPath || path.resolve(rootDir, 'components/manifest.json');

  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function componentManifestItems(options = {}, graph = null) {
  const manifest = loadComponentManifest(options);
  const graphTags = graph && graph.catalogHints ? graph.catalogHints.componentTags : [];
  const labels = Object.keys(manifest).concat(toArray(graphTags));

  return labels.map((label) => createCompletionItem({
    label,
    kind: 'component-tag',
    detail: 'XTend Component Tag',
    documentation: manifest[label] ? `Manifest module: ${manifest[label]}` : 'Tag aus dem aktiven RMT-Dokument.',
    source: manifest[label] ? 'components/manifest.json' : 'semantic-graph.catalogHints',
    targetDomain: 'components'
  }));
}

function referenceItems(graph, domain, options = {}) {
  if (!graph || typeof graph.listCompletions !== 'function') {
    return [];
  }

  if (domain === 'scheduleEndpoints') {
    return toArray(graph.catalogHints && graph.catalogHints.scheduleEndpoints).map((endpoint) => createCompletionItem({
      label: endpoint,
      kind: 'reference',
      detail: 'Schedule endpointName',
      documentation: 'Endpoint Name aus schedules[*].endpointName.',
      source: 'semantic-graph.catalogHints',
      targetDomain: 'scheduleEndpoints'
    }));
  }

  if (domain === 'routePaths') {
    return toArray(graph.catalogHints && graph.catalogHints.routePaths).map((routePath) => createCompletionItem({
      label: routePath,
      kind: 'value',
      detail: 'Route Path',
      documentation: 'Path aus routes[*].path.',
      source: 'semantic-graph.catalogHints',
      targetDomain: 'routes'
    }));
  }

  return graph.listCompletions(domain, options).map((item) => createCompletionItem({
    label: item.label,
    insertText: item.insertText,
    kind: 'reference',
    detail: item.detail || domain,
    documentation: `Referenz auf ${domain}.`,
    source: 'semantic-graph.indexes',
    targetDomain: domain,
    pointer: item.pointer,
    range: item.range
  }));
}

function inferCompletionContext(input = {}) {
  if (input.context) {
    return input.context;
  }

  const pointer = normalizeString(input.pointer);
  const field = normalizeString(input.field);
  const domain = normalizeString(input.domain);

  if (!pointer && !field && !domain) {
    return 'top-level';
  }

  if (field === 'adapter' || field === 'router' || /\/(adapter|router)$/.test(pointer)) {
    return 'adapter-ids';
  }

  if (field === 'tag' || /\/tag$/.test(pointer)) {
    return 'component-tags';
  }

  if (field === 'component' || field === 'manager' || /\/(component|manager)$/.test(pointer)) {
    return 'component-ids';
  }

  if (field === 'route' || /\/route$/.test(pointer)) {
    return 'route-ids';
  }

  if (field === 'template' || field === 'shell' || /\/(template|shell)$/.test(pointer)) {
    return 'template-ids';
  }

  if (field === 'schedule' || field === 'lazySchedule' || field === 'scheduleRef' || /\/(schedule|lazySchedule|scheduleRef)$/.test(pointer)) {
    return 'schedule-ids';
  }

  if (field === 'endpointHint' || /\/endpointHint$/.test(pointer)) {
    return 'schedule-endpoints';
  }

  if (field === 'lane' || /\/lane$/.test(pointer)) {
    return 'schedule-lanes';
  }

  if (field === 'path' || /\/path$/.test(pointer)) {
    return 'route-paths';
  }

  if ((field === 'type' || /\/type$/.test(pointer)) && (pointer.includes('/surfaces/') || domain === 'surfaces')) {
    return 'surface-types';
  }

  if (field === 'mode' || /\/mode$/.test(pointer)) {
    return pointer.includes('/hydration/') || domain === 'hydration' ? 'hydration-policies' : 'template-modes';
  }

  if (pointer && /^\/?$/.test(pointer)) {
    return 'top-level';
  }

  if (/^\/routes\/\d+(?:\/metadata)?$/.test(pointer) || domain === 'routes') {
    return pointer.includes('/metadata') ? 'route-metadata-fields' : 'route-fields';
  }

  if (/^\/components\/\d+$/.test(pointer) || domain === 'components') {
    return 'component-fields';
  }

  if (/^\/templates\/\d+$/.test(pointer) || domain === 'templates') {
    return 'template-fields';
  }

  if (/^\/schedules\/\d+$/.test(pointer) || domain === 'schedules') {
    return 'schedule-fields';
  }

  if (/^\/surfaces\/\d+$/.test(pointer) || domain === 'surfaces') {
    return 'surface-fields';
  }

  if (/^\/adapters\/\d+$/.test(pointer) || domain === 'adapters') {
    return 'adapter-fields';
  }

  if (domain === 'manifest') {
    return 'manifest-fields';
  }

  return 'top-level';
}

function domainFieldItems(domain, label = domain) {
  return createStaticItems(DOMAIN_FIELD_COMPLETIONS[domain] || [], {
    kind: 'property',
    detail: `${label} field`,
    source: 'rmt-domain-field-catalog'
  });
}

function buildContextItems(graph, context, options = {}) {
  switch (context) {
    case 'top-level':
      return createStaticItems(TOP_LEVEL_DOMAINS, {
        kind: 'property',
        detail: 'RMT top-level domain',
        source: 'rmt-top-level-domain-catalog'
      });
    case 'manifest-fields':
      return domainFieldItems('manifest', 'manifest');
    case 'adapter-fields':
      return domainFieldItems('adapters', 'adapters[*]');
    case 'component-fields':
      return domainFieldItems('components', 'components[*]');
    case 'route-fields':
      return domainFieldItems('routes', 'routes[*]');
    case 'route-metadata-fields':
      return domainFieldItems('routeMetadata', 'routes[*].metadata');
    case 'schedule-fields':
      return domainFieldItems('schedules', 'schedules[*]');
    case 'surface-fields':
      return domainFieldItems('surfaces', 'surfaces[*]');
    case 'template-fields':
      return domainFieldItems('templates', 'templates[*]');
    case 'hydration-metadata-fields':
      return domainFieldItems('hydrationMetadata', 'hydration.metadata');
    case 'adapter-ids':
      return createStaticItems(BUILT_IN_ADAPTER_IDS, {
        kind: 'reference',
        detail: 'Adapter ID',
        source: 'rmt-adapter-catalog',
        targetDomain: 'adapters'
      }).concat(referenceItems(graph, 'adapters', options));
    case 'component-tags':
      return componentManifestItems(options, graph);
    case 'component-ids':
      return referenceItems(graph, 'components', options);
    case 'template-ids':
      return referenceItems(graph, 'templates', options);
    case 'schedule-ids':
      return referenceItems(graph, 'schedules', options);
    case 'route-ids':
      return referenceItems(graph, 'routes', options);
    case 'route-paths':
      return referenceItems(graph, 'routePaths', options);
    case 'schedule-endpoints':
      return referenceItems(graph, 'scheduleEndpoints', options);
    case 'schedule-lanes':
      return createStaticItems(SCHEDULE_LANES, {
        kind: 'enum',
        detail: 'RMT Schedule Lane',
        source: 'rmt-lane-catalog'
      }).concat(toArray(graph && graph.catalogHints && graph.catalogHints.scheduleLanes).map((lane) => createCompletionItem({
        label: lane,
        kind: 'enum',
        detail: 'Schedule Lane aus aktivem Dokument',
        source: 'semantic-graph.catalogHints'
      })));
    case 'surface-types':
      return createStaticItems(SURFACE_TYPES, {
        kind: 'enum',
        detail: 'RMT Surface Type',
        source: 'rmt-surface-type-catalog'
      }).concat(toArray(graph && graph.catalogHints && graph.catalogHints.surfaceTypes).map((surfaceType) => createCompletionItem({
        label: surfaceType,
        kind: 'enum',
        detail: 'Surface Type aus aktivem Dokument',
        source: 'semantic-graph.catalogHints'
      })));
    case 'hydration-policies':
      return createStaticItems(HYDRATION_POLICIES, {
        kind: 'enum',
        detail: 'RMT Hydration Policy',
        source: 'rmt-hydration-policy-catalog'
      });
    case 'template-modes':
      return createStaticItems(TEMPLATE_MODES, {
        kind: 'enum',
        detail: 'RMT Template Mode',
        source: 'rmt-template-mode-catalog'
      });
    default:
      return [];
  }
}

function applyPrefixFilter(items, prefix = '') {
  const safePrefix = normalizeString(prefix);

  if (!safePrefix) {
    return items;
  }

  return items.filter((item) => item.label.startsWith(safePrefix));
}

function createRmtCompletionProvider(defaultOptions = {}) {
  function complete(input = {}, options = {}) {
    const mergedOptions = {
      ...defaultOptions,
      ...options
    };
    const graph = mergedOptions.graph || buildSemanticGraph(input, mergedOptions);
    const context = inferCompletionContext(mergedOptions);
    const prefix = normalizeString(mergedOptions.prefix);
    const items = sortCompletionItems(applyPrefixFilter(buildContextItems(graph, context, {
      ...mergedOptions,
      prefix
    }), prefix));

    return {
      schema: RMT_COMPLETION_REPORT_SCHEMA,
      providerSchema: RMT_COMPLETION_PROVIDER_SCHEMA,
      workpackage: RMT_COMPLETION_WORKPACKAGE,
      status: graph.status === 'source_unavailable' && context !== 'top-level' ? 'source_unavailable' : 'completed',
      ok: true,
      context,
      prefix,
      itemCount: items.length,
      items,
      graphStatus: graph.status,
      manifestHints: graph.manifestHints || {},
      catalogHints: graph.catalogHints || {}
    };
  }

  return Object.freeze({
    schema: RMT_COMPLETION_PROVIDER_SCHEMA,
    reportSchema: RMT_COMPLETION_REPORT_SCHEMA,
    workpackage: RMT_COMPLETION_WORKPACKAGE,
    complete
  });
}

function getRmtCompletions(input = {}, options = {}) {
  return createRmtCompletionProvider(options).complete(input, options);
}

module.exports = {
  BUILT_IN_ADAPTER_IDS,
  DOMAIN_FIELD_COMPLETIONS,
  HYDRATION_POLICIES,
  RMT_COMPLETION_ITEM_SCHEMA,
  RMT_COMPLETION_MODULE_PATH,
  RMT_COMPLETION_PACKAGE_SCRIPT,
  RMT_COMPLETION_PROVIDER_SCHEMA,
  RMT_COMPLETION_REPORT_SCHEMA,
  RMT_COMPLETION_SUITE_PATH,
  RMT_COMPLETION_WORKPACKAGE,
  SCHEDULE_LANES,
  SURFACE_TYPES,
  TEMPLATE_MODES,
  TOP_LEVEL_DOMAINS,
  createCompletionItem,
  createRmtCompletionProvider,
  getRmtCompletions,
  inferCompletionContext,
  loadComponentManifest
};
