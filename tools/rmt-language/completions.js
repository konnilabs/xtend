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
  ['state', 'array', 'Typed App State records.'],
  ['selectors', 'array', 'Derived selector records.'],
  ['dataSources', 'array', 'Fixture, REST, SSR or host data source records.'],
  ['actions', 'array', 'Declarative action records.'],
  ['effects', 'array', 'Feedback, navigation, focus and lazy import effects.'],
  ['resources', 'array', 'Owned object URL, stream, observer, timer and import resources.'],
  ['events', 'array', 'Declarative event bindings with payload contracts.'],
  ['validations', 'array', 'Form validation groups with field rules and action gates.'],
  ['transitions', 'array', 'Surface transition records with trigger, effect and lane metadata.'],
  ['portals', 'array', 'Generic overlay portal layer definitions.'],
  ['overlays', 'array', 'Tooltip, toast, popover, lightbox, menu and dialog overlay definitions.'],
  ['collectionViews', 'array', 'Owned data-display collection views with item, loading, empty and selection state templates.'],
  ['commandSources', 'array', 'Owned command palette sources that route registered commands through action refs.'],
  ['searchSources', 'array', 'Owned search sources with query state, resource-backed results and active descendant metadata.'],
  ['slots', 'array', 'Named composition slots for app-shell and surface recipes.'],
  ['securityPolicies', 'array', 'Trust-boundary, sanitizing and owner-scoped security policy records.'],
  ['records', 'object', 'Named fixture or SSR record collections.'],
  ['surfaces', 'array', 'Generic keyed Surface Graph records.'],
  ['templates', 'array', 'Template records and DOM descriptors.'],
  ['diagnostics', 'object', 'Optional diagnostics and gate metadata.'],
  ['extensionSlots', 'object', 'Optional host extension slots.'],
  ['sourceMap', 'array', 'Source-to-runtime pointers for contracts, generated artifacts and authoring evidence.']
]);

const DOMAIN_FIELD_COMPLETIONS = Object.freeze({
  manifest: ['documentId', 'namespace', 'metadata', 'sourceUrl'],
  adapters: ['id', 'kind', 'runtimeSurface', 'providedCapabilities', 'kernelVisible'],
  components: ['id', 'kind', 'adapter', 'tag', 'schedule', 'props', 'attributes', 'slots', 'events', 'hydration', 'metadata'],
  routes: ['id', 'path', 'router', 'component', 'template', 'shell', 'schedule', 'documentTitle', 'metaDescription', 'metadata'],
  schedules: ['id', 'endpointName', 'lane', 'fiber', 'priority', 'budgetMs', 'deadlineMs', 'preferIdle', 'coalesceKey'],
  state: ['id', 'type', 'schema', 'initial', 'preserve', 'key', 'field', 'direction', 'metadata'],
  selectors: ['id', 'from', 'source', 'compute', 'output', 'structural', 'filter', 'sort', 'query', 'resultState', 'metadata'],
  dataSources: ['id', 'kind', 'owner', 'endpoint', 'adapter', 'policy', 'records', 'payload', 'resultPath', 'contract', 'metadata'],
  actions: ['id', 'kind', 'datasource', 'target', 'payload', 'policy', 'effect', 'resource', 'resultState', 'loadingState', 'statusState', 'resourceOwner', 'effects', 'resources', 'cancelable', 'metadata'],
  effects: ['id', 'kind', 'target', 'message', 'path', 'severity', 'resource', 'resources', 'adapterRef', 'policy', 'allowedCommands', 'resultState', 'metadata'],
  resources: ['id', 'kind', 'owner', 'source', 'dataSource', 'lifecycle', 'cachePolicy', 'loadingState', 'errorState', 'release', 'importId', 'delayMs', 'metadata'],
  events: ['id', 'kind', 'event', 'target', 'component', 'owner', 'action', 'payload', 'payloadContract', 'governance', 'metadata'],
  validations: ['id', 'mode', 'targets', 'fields', 'includes', 'schedulerTargets', 'metadata'],
  validationFields: ['state', 'rules', 'message', 'component', 'target'],
  validationTargets: ['kind', 'id', 'gate', 'message'],
  transitions: ['id', 'trigger', 'from', 'to', 'effect', 'durationMs', 'easing', 'lane', 'operation', 'endpointName', 'metadata'],
  transitionTriggers: ['kind', 'id'],
  portals: ['id', 'root', 'layer', 'policy', 'focusPolicy', 'pointerPolicy', 'scrollPolicy', 'zIndexStart', 'zStep', 'metadata'],
  overlays: ['id', 'kind', 'portal', 'layer', 'surface', 'resources', 'dismissible', 'singleton', 'focusPolicy', 'escapePolicy', 'pointerPolicy', 'scrollPolicy', 'metadata'],
  collectionViews: ['id', 'source', 'layoutMode', 'key', 'itemTemplate', 'emptyTemplate', 'loadingTemplate', 'errorTemplate', 'selection', 'sorting', 'maxItemsPerFrame', 'virtualization', 'a11y', 'metadata'],
  commandSources: ['id', 'surface', 'trigger', 'shortcut', 'registeredCommands', 'resultState', 'actionRefRequired', 'metadata'],
  registeredCommands: ['id', 'label', 'action', 'disabledState', 'keywords'],
  searchSources: ['id', 'queryState', 'resource', 'selector', 'minQueryLength', 'debounceMs', 'resultTemplate', 'emptyTemplate', 'loadingTemplate', 'activeIndexState', 'selectionState', 'a11y', 'metadata'],
  slots: ['id', 'name', 'surface', 'component', 'template', 'schedule', 'metadata'],
  securityPolicies: ['id', 'kind', 'boundary', 'format', 'sink', 'ownerOperation', 'policy', 'metadata'],
  sourceMap: ['source', 'target', 'domain', 'workpackage', 'evidence'],
  surfaces: ['id', 'schema', 'kind', 'type', 'source', 'repeat', 'key', 'owner', 'portal', 'adapter', 'manager', 'component', 'template', 'route', 'schedule', 'resources', 'bounds', 'placement', 'mode', 'initialState', 'persistent', 'closeReleasesResources', 'destroyOnClose', 'focusPolicy', 'escape', 'stackPolicy', 'metadata'],
  templates: ['id', 'mode', 'renderMode', 'nodes', 'root', 'slots', 'hydration', 'metadata', 'security'],
  routeMetadata: ['title', 'documentTitle', 'titleTemplate', 'metaDescription', 'contentKind', 'announcement', 'a11y'],
  hydrationMetadata: ['endpointHint', 'scheduleRef', 'policy', 'deferUntil', 'resumability', 'resumeSchema']
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
  ['resource', 'Resource or search work.'],
  ['a11y', 'Assistive technology feedback work.'],
  ['background', 'Background work.'],
  ['idle', 'Idle hydration or deferred work.'],
  ['diagnostics', 'Diagnostics and telemetry work.']
]);

const HYDRATION_POLICIES = Object.freeze([
  ['runtime_render', 'Render at runtime in the host adapter.'],
  ['hydrate_prerendered', 'Hydrate prerendered content.'],
  ['worker_prerender_hydrate', 'Worker prerender with later hydration.'],
  ['server_prerender_hydrate', 'Server prerender with later hydration.'],
  ['server_prerender_resume', 'Server prerender with full resumability handoff.'],
  ['worker_prerender_resume', 'Worker prerender with resume payload handoff.'],
  ['prerender_only', 'Prerender without client hydration.'],
  ['managed_subtree', 'Adapter owns a managed subtree.'],
  ['manual', 'Manual hydration policy.'],
  ['none', 'No hydration.']
]);

const VALIDATION_MODES = Object.freeze([
  ['blocking', 'Block target actions until the validation group is valid.']
]);

const VALIDATION_RULES = Object.freeze([
  ['required', 'Field must contain a value.'],
  ['email', 'Field value must be an email address.'],
  ['minLength', 'Field value must contain at least the configured number of characters.'],
  ['maxLength', 'Field value must stay below the configured number of characters.'],
  ['pattern', 'Field value must match the configured pattern.']
]);

const TRANSITION_EFFECTS = Object.freeze([
  ['fade', 'Fade the exiting and entering surfaces.'],
  ['crossfade', 'Crossfade from the outgoing surface group to the incoming surface group.'],
  ['slide-left', 'Slide the new surface group in from the right.'],
  ['slide-right', 'Slide the new surface group in from the left.'],
  ['slide-up', 'Slide the new surface group upward into place.'],
  ['slide-down', 'Slide the new surface group downward into place.'],
  ['scale', 'Scale the surface group during enter and exit.'],
  ['none', 'Use an instant transition without motion.']
]);

const TEMPLATE_MODES = Object.freeze([
  ['dom_descriptor', 'Structured DOM descriptor template.'],
  ['html_fragment', 'Trusted HTML fragment template.'],
  ['text', 'Plain text template.']
]);

const SURFACE_TYPES = Object.freeze([
  ['window', 'Movable and resizable workspace window.'],
  ['panel', 'Dockable or responsive app panel.'],
  ['overlay-host', 'Invisible owner surface for overlay lifecycle.'],
  ['side-panel', 'Docked, pinned, collapsed or responsive side panel.'],
  ['modal', 'Modal overlay surface in the shared stack.'],
  ['dialog', 'Dialog overlay surface in the shared stack.'],
  ['drawer', 'Drawer overlay surface in the shared stack.']
]);

const OVERLAY_KINDS = Object.freeze([
  ['tooltip', 'Viewport-fixed hint overlay.'],
  ['toast', 'Nonmodal feedback overlay.'],
  ['popover', 'Anchored interactive overlay.'],
  ['lightbox', 'Modal media or detail overlay.'],
  ['menu', 'Keyboard navigable menu overlay.'],
  ['dialog', 'Modal or nonmodal dialog overlay.']
]);

const PORTAL_POLICIES = Object.freeze([
  ['stacked', 'Generic stacked app layer.'],
  ['modal', 'Blocks interaction below the portal.'],
  ['nonmodal', 'Allows interaction outside the portal.'],
  ['toast-region', 'Feedback region for transient messages.'],
  ['clipping-escape', 'Viewport layer that escapes clipping containers.']
]);

const RESOURCE_KINDS = Object.freeze([
  ['object-url', 'Object URL resource with revoke cleanup.'],
  ['stream', 'Stream resource with open and close lifecycle.'],
  ['observer', 'Observer resource with disconnect cleanup.'],
  ['timer', 'Timer or idle handle resource.'],
  ['lazy-import', 'Lazy module import resource.']
]);

const EVENT_KINDS = Object.freeze([
  ['dom', 'DOM event binding.'],
  ['custom', 'Custom component event binding.'],
  ['keyboard', 'Keyboard event binding.'],
  ['form', 'Form event binding.'],
  ['surface', 'Surface lifecycle event binding.'],
  ['drop', 'Drag and drop event binding.']
]);

const SURFACE_STATES = Object.freeze([
  ['closed', 'Surface starts closed.'],
  ['open', 'Surface starts open.'],
  ['minimized', 'Surface starts minimized.']
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

function documentIds(graph, domain) {
  const document = graph && graph.sourceDocument && typeof graph.sourceDocument === 'object' ? graph.sourceDocument : {};
  return toArray(document[domain])
    .map((record) => normalizeString(record && record.id))
    .filter(Boolean);
}

function documentReferenceItems(graph, domain, detail) {
  return documentIds(graph, domain).map((id) => createCompletionItem({
    label: id,
    kind: 'reference',
    detail,
    documentation: `Referenz auf ${domain}[*].id.`,
    source: 'rmt-app-platform-document',
    targetDomain: domain
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

  if (field === 'template' || field === 'shell' || field === 'itemTemplate' || field === 'emptyTemplate' || field === 'loadingTemplate' || field === 'errorTemplate' || field === 'resultTemplate' || /\/(template|shell|itemTemplate|emptyTemplate|loadingTemplate|errorTemplate|resultTemplate)$/.test(pointer)) {
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

  if ((field === 'type' || field === 'kind' || /\/(type|kind)$/.test(pointer)) && (pointer.includes('/surfaces/') || domain === 'surfaces')) {
    return 'surface-types';
  }

  if ((field === 'kind' || /\/kind$/.test(pointer)) && (pointer.includes('/overlays/') || domain === 'overlays')) {
    return 'overlay-kinds';
  }

  if ((field === 'kind' || /\/kind$/.test(pointer)) && (pointer.includes('/resources/') || domain === 'resources')) {
    return 'resource-kinds';
  }

  if ((field === 'kind' || /\/kind$/.test(pointer)) && (pointer.includes('/events/') || domain === 'events')) {
    return 'event-kinds';
  }

  if ((field === 'mode' || /\/mode$/.test(pointer)) && (pointer.includes('/validations/') || domain === 'validations')) {
    return 'validation-modes';
  }

  if ((field === 'rules' || /\/rules(?:\/\d+)?$/.test(pointer)) && (pointer.includes('/validations/') || domain === 'validations')) {
    return 'validation-rules';
  }

  if ((field === 'effect' || /\/effect$/.test(pointer)) && (pointer.includes('/transitions/') || domain === 'transitions')) {
    return 'transition-effects';
  }

  if (field === 'portal' || /\/portal$/.test(pointer)) {
    return 'portal-ids';
  }

  if (field === 'resource' || /\/resource$/.test(pointer)) {
    return 'resource-ids';
  }

  if (field === 'selector' || /\/selector$/.test(pointer)) {
    return 'selector-ids';
  }

  if (field === 'surface' || /\/surface$/.test(pointer)) {
    return 'surface-ids';
  }

  if (field === 'action' || /\/action$/.test(pointer)) {
    return 'action-ids';
  }

  if (field === 'resources' || /\/resources(?:\/\d+)?$/.test(pointer)) {
    return 'resource-ids';
  }

  if ((field === 'policy' || /\/policy$/.test(pointer)) && (pointer.includes('/portals/') || domain === 'portals')) {
    return 'portal-policies';
  }

  if ((field === 'initialState' || field === 'state' || /\/(initialState|state)$/.test(pointer)) && (pointer.includes('/surfaces/') || domain === 'surfaces')) {
    return 'surface-states';
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

  if (/^\/portals\/\d+$/.test(pointer) || domain === 'portals') {
    return 'portal-fields';
  }

  if (/^\/overlays\/\d+$/.test(pointer) || domain === 'overlays') {
    return 'overlay-fields';
  }

  if (/^\/resources\/\d+$/.test(pointer) || domain === 'resources') {
    return 'resource-fields';
  }

  if (/^\/events\/\d+$/.test(pointer) || domain === 'events') {
    return 'event-fields';
  }

  if (/^\/validations\/\d+$/.test(pointer) || domain === 'validations') {
    return 'validation-fields';
  }

  if (/^\/validations\/\d+\/fields\/\d+$/.test(pointer) || domain === 'validationFields') {
    return 'validation-field-fields';
  }

  if (/^\/validations\/\d+\/targets\/\d+$/.test(pointer) || domain === 'validationTargets') {
    return 'validation-target-fields';
  }

  if (/^\/transitions\/\d+$/.test(pointer) || domain === 'transitions') {
    return 'transition-fields';
  }

  if (/^\/transitions\/\d+\/trigger$/.test(pointer) || domain === 'transitionTriggers') {
    return 'transition-trigger-fields';
  }

  if (/^\/collectionViews\/\d+$/.test(pointer) || domain === 'collectionViews') {
    return 'collection-view-fields';
  }

  if (/^\/commandSources\/\d+$/.test(pointer) || domain === 'commandSources') {
    return 'command-source-fields';
  }

  if (/^\/commandSources\/\d+\/registeredCommands\/\d+$/.test(pointer) || domain === 'registeredCommands') {
    return 'registered-command-fields';
  }

  if (/^\/searchSources\/\d+$/.test(pointer) || domain === 'searchSources') {
    return 'search-source-fields';
  }

  if (/^\/slots\/\d+$/.test(pointer) || domain === 'slots') {
    return 'slot-fields';
  }

  if (/^\/securityPolicies\/\d+$/.test(pointer) || domain === 'securityPolicies') {
    return 'security-policy-fields';
  }

  if (/^\/sourceMap\/\d+$/.test(pointer) || domain === 'sourceMap') {
    return 'source-map-fields';
  }

  if (/^\/actions\/\d+$/.test(pointer) || domain === 'actions') {
    return 'action-fields';
  }

  if (/^\/dataSources\/\d+$/.test(pointer) || domain === 'dataSources') {
    return 'data-source-fields';
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
    case 'portal-fields':
      return domainFieldItems('portals', 'portals[*]');
    case 'overlay-fields':
      return domainFieldItems('overlays', 'overlays[*]');
    case 'resource-fields':
      return domainFieldItems('resources', 'resources[*]');
    case 'event-fields':
      return domainFieldItems('events', 'events[*]');
    case 'validation-fields':
      return domainFieldItems('validations', 'validations[*]');
    case 'validation-field-fields':
      return domainFieldItems('validationFields', 'validations[*].fields[*]');
    case 'validation-target-fields':
      return domainFieldItems('validationTargets', 'validations[*].targets[*]');
    case 'transition-fields':
      return domainFieldItems('transitions', 'transitions[*]');
    case 'transition-trigger-fields':
      return domainFieldItems('transitionTriggers', 'transitions[*].trigger');
    case 'collection-view-fields':
      return domainFieldItems('collectionViews', 'collectionViews[*]');
    case 'command-source-fields':
      return domainFieldItems('commandSources', 'commandSources[*]');
    case 'registered-command-fields':
      return domainFieldItems('registeredCommands', 'commandSources[*].registeredCommands[*]');
    case 'search-source-fields':
      return domainFieldItems('searchSources', 'searchSources[*]');
    case 'slot-fields':
      return domainFieldItems('slots', 'slots[*]');
    case 'security-policy-fields':
      return domainFieldItems('securityPolicies', 'securityPolicies[*]');
    case 'source-map-fields':
      return domainFieldItems('sourceMap', 'sourceMap[*]');
    case 'action-fields':
      return domainFieldItems('actions', 'actions[*]');
    case 'data-source-fields':
      return domainFieldItems('dataSources', 'dataSources[*]');
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
    case 'surface-ids':
      return referenceItems(graph, 'surfaces', options);
    case 'selector-ids':
      return referenceItems(graph, 'selectors', options);
    case 'action-ids':
      return referenceItems(graph, 'actions', options);
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
    case 'overlay-kinds':
      return createStaticItems(OVERLAY_KINDS, {
        kind: 'enum',
        detail: 'RMT Overlay Kind',
        source: 'rmt-app-platform-overlay-catalog'
      });
    case 'portal-policies':
      return createStaticItems(PORTAL_POLICIES, {
        kind: 'enum',
        detail: 'RMT Portal Policy',
        source: 'rmt-app-platform-portal-catalog'
      });
    case 'resource-kinds':
      return createStaticItems(RESOURCE_KINDS, {
        kind: 'enum',
        detail: 'RMT Resource Kind',
        source: 'rmt-app-platform-resource-catalog'
      });
    case 'event-kinds':
      return createStaticItems(EVENT_KINDS, {
        kind: 'enum',
        detail: 'RMT Event Kind',
        source: 'rmt-app-platform-event-catalog'
      });
    case 'validation-modes':
      return createStaticItems(VALIDATION_MODES, {
        kind: 'enum',
        detail: 'RMT Validation Mode',
        source: 'rmt-validation-mode-catalog'
      });
    case 'validation-rules':
      return createStaticItems(VALIDATION_RULES, {
        kind: 'enum',
        detail: 'RMT Validation Rule',
        source: 'rmt-validation-rule-catalog'
      });
    case 'transition-effects':
      return createStaticItems(TRANSITION_EFFECTS, {
        kind: 'enum',
        detail: 'RMT Surface Transition Effect',
        source: 'rmt-transition-effect-catalog'
      });
    case 'surface-states':
      return createStaticItems(SURFACE_STATES, {
        kind: 'enum',
        detail: 'RMT Surface Initial State',
        source: 'rmt-app-platform-surface-state-catalog'
      });
    case 'portal-ids':
      return documentReferenceItems(graph, 'portals', 'Portal ID');
    case 'resource-ids':
      return documentReferenceItems(graph, 'resources', 'Resource ID');
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
  EVENT_KINDS,
  HYDRATION_POLICIES,
  OVERLAY_KINDS,
  PORTAL_POLICIES,
  RMT_COMPLETION_ITEM_SCHEMA,
  RMT_COMPLETION_MODULE_PATH,
  RMT_COMPLETION_PACKAGE_SCRIPT,
  RMT_COMPLETION_PROVIDER_SCHEMA,
  RMT_COMPLETION_REPORT_SCHEMA,
  RMT_COMPLETION_SUITE_PATH,
  RMT_COMPLETION_WORKPACKAGE,
  RESOURCE_KINDS,
  SCHEDULE_LANES,
  SURFACE_STATES,
  SURFACE_TYPES,
  TEMPLATE_MODES,
  TOP_LEVEL_DOMAINS,
  TRANSITION_EFFECTS,
  VALIDATION_MODES,
  VALIDATION_RULES,
  createCompletionItem,
  createRmtCompletionProvider,
  getRmtCompletions,
  inferCompletionContext,
  loadComponentManifest
};
