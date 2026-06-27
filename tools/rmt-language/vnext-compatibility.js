'use strict';

const path = require('path');
const {
  RMT_FORMAT_ADAPTER_SCHEMA,
  parseAndNormalizeRmtSource
} = require('./format-adapter');
const {
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('./vnext-compiler');
const {
  isLikelyRmtVNextSource
} = require('./vnext-tooling');

const RMT_VNEXT_COMPATIBILITY_SCHEMA = 'xtend.rmt.vnext-compatibility-matrix.v1';
const RMT_VNEXT_MIGRATION_REPORT_SCHEMA = 'xtend.rmt.vnext-migration-report.v1';
const RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA = 'xtend.rmt.vnext-roundtrip-report.v1';
const RMT_VNEXT_LEGACY_PROJECTION_SCHEMA = 'xtend.rmt.vnext-legacy-core-projection.v1';
const RMT_VNEXT_COMPATIBILITY_REPORT_SCHEMA = 'xtend.rmt.vnext-compatibility-report.v1';
const RMT_VNEXT_PRIMITIVE_MIGRATION_SCHEMA = 'xtend.rmt.vnext.primitive-migration-preview.v1';
const RMT_VNEXT_PRIMITIVE_MIGRATION_APPLY_PLAN_SCHEMA = 'xtend.rmt.vnext.primitive-migration-apply-plan.v1';
const RMT_VNEXT_COMPATIBILITY_WORKPACKAGE = 'WP-E15-16';
const RMT_VNEXT_PRIMITIVE_MIGRATION_WORKPACKAGE = 'RMT-VNEXT-PRIM-08';
const RMT_VNEXT_COMPATIBILITY_MODULE_PATH = 'tools/rmt-language/vnext-compatibility.js';
const RMT_VNEXT_COMPATIBILITY_SUITE_PATH = 'tests/rmt-language/rmt_vnext_compatibility_suite.js';
const RMT_VNEXT_COMPATIBILITY_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-compatibility';

const MIGRATION_OPT_IN_REQUIRED_CODE = 'rmt.vnext.migration.opt_in_required';
const MIGRATION_LEGACY_PARSE_FAILED_CODE = 'rmt.vnext.migration.legacy_parse_failed';
const MIGRATION_LEGACY_NORMALIZATION_FAILED_CODE = 'rmt.vnext.migration.legacy_normalization_failed';
const MIGRATION_LOSSY_DOMAIN_CODE = 'rmt.vnext.migration.lossy_domain';
const MIGRATION_UNSUPPORTED_DOMAIN_CODE = 'rmt.vnext.migration.unsupported_domain';
const MIGRATION_VNEXT_COMPILE_FAILED_CODE = 'rmt.vnext.migration.vnext_compile_failed';
const MIGRATION_PRIMITIVE_PREVIEW_AVAILABLE_CODE = 'rmt.vnext.primitive_migration.preview_available';
const MIGRATION_PRIMITIVE_COMPILE_FAILED_CODE = 'rmt.vnext.primitive_migration.compile_failed';
const MIGRATION_LEGACY_BACKGROUNDED_CODE = 'rmt.vnext.primitive_migration.legacy_backgrounded';
const ROUNDTRIP_MISMATCH_CODE = 'rmt.vnext.roundtrip.mismatch';

const LEGACY_DOMAINS = Object.freeze([
  'adapters',
  'components',
  'routes',
  'schedules',
  'surfaces',
  'templates'
]);

const APP_PLATFORM_PRIMITIVE_DOMAINS = Object.freeze([
  'state',
  'states',
  'selectors',
  'dataSources',
  'actions',
  'events',
  'portals',
  'overlays',
  'resources',
  'surfaces',
  'records'
]);

const ROUNDTRIP_COMPATIBLE_WARNINGS = Object.freeze([
  'rmt.document.extension.fallback-used',
  MIGRATION_OPT_IN_REQUIRED_CODE,
  MIGRATION_LOSSY_DOMAIN_CODE
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

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableSort(value) {
  if (Array.isArray(value)) {
    return value.map(stableSort);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableSort(value[key]);
      return result;
    }, {});
  }

  return value;
}

function canonicalJson(value) {
  return `${JSON.stringify(stableSort(value), null, 2)}\n`;
}

function semanticRoundtripDocument(document) {
  const cloned = cloneJson(document || {});
  delete cloned.normalization;
  return cloned;
}

function sourceFile(input = {}) {
  return input && input.filePath ? path.normalize(input.filePath) : null;
}

function createCompatibilityDiagnostic(input = {}, base = {}) {
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: 'rmt-vnext-compatibility',
    code: input.code || 'rmt.vnext.compatibility.diagnostic',
    ruleId: input.ruleId || `vnext.compatibility.${input.code || 'diagnostic'}`,
    severity: input.severity || 'warning',
    category: input.category || 'migration',
    message: input.message || input.code || 'RMT vNext compatibility diagnostic',
    uri: input.uri || base.uri || null,
    file: input.file || base.file || null,
    pointer: input.pointer || null,
    range: input.range || null,
    workpackage: RMT_VNEXT_COMPATIBILITY_WORKPACKAGE,
    repair: input.repair || null,
    relatedInformation: input.relatedInformation || [],
    details: input.details || null
  };
}

function normalizeSourceDiagnostic(diagnostic = {}, fallback = {}) {
  return createCompatibilityDiagnostic({
    code: diagnostic.code,
    severity: diagnostic.severity,
    category: diagnostic.category || (diagnostic.severity === 'error' ? 'syntax' : 'compatibility'),
    message: diagnostic.message,
    uri: diagnostic.uri,
    file: diagnostic.file,
    pointer: diagnostic.pointer,
    range: diagnostic.range,
    repair: diagnostic.repair,
    relatedInformation: diagnostic.relatedInformation || []
  }, fallback);
}

function diagnosticSummary(diagnostics) {
  return diagnostics.reduce((summary, diagnostic) => {
    const key = `${diagnostic.severity || 'info'}Count`;
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

function safeIdentifier(value, fallback) {
  const normalized = normalizeString(value)
    .replace(/[^a-zA-Z0-9_.-]+/gu, '.')
    .replace(/^\.+|\.+$/gu, '');
  const candidate = normalized || fallback || 'item';

  return /^[A-Za-z_]/u.test(candidate) ? candidate : `rmt.${candidate}`;
}

function quoteString(value) {
  return JSON.stringify(String(value));
}

function stripDollarPath(value) {
  return normalizeString(value).replace(/\$/gu, '').replace(/^\.+/u, '');
}

function resourceRefs(value) {
  return toArray(value)
    .map((entry) => typeof entry === 'string' ? entry : normalizeString(entry && entry.id))
    .filter(Boolean);
}

function stripKnownDomainPrefix(value) {
  return normalizeString(value).replace(/^(state|selector|datasource|dataSource|action|portal|overlay|resource|surface|component|template)\./u, '');
}

function primitiveName(value, fallback) {
  return safeIdentifier(stripKnownDomainPrefix(value || fallback), fallback);
}

function domainRecords(document, ...domains) {
  for (const domain of domains) {
    if (Array.isArray(document && document[domain])) {
      return document[domain];
    }
  }
  return [];
}

function recordId(record, fallback) {
  return primitiveName(record && record.id, fallback);
}

function primitiveValueLiteral(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return quoteString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const primitiveItems = value.filter((entry) => entry === null || ['string', 'number', 'boolean'].includes(typeof entry));
    return primitiveItems.length === value.length
      ? `[${primitiveItems.map(primitiveValueLiteral).join(', ')}]`
      : '[]';
  }
  return null;
}

function primitiveInitialEntries(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value)
    .map(([key, entry]) => [safeIdentifier(key, 'value'), primitiveValueLiteral(entry)])
    .filter((entry) => entry[1] !== null);
}

function rawAppPlatformDocument(input = {}) {
  if (input.document && typeof input.document === 'object' && !Array.isArray(input.document)) {
    return {
      ok: true,
      document: cloneJson(input.document),
      diagnostics: []
    };
  }

  const text = typeof input.text === 'string' ? input.text : '';
  if (!text.trim().startsWith('{')) {
    return {
      ok: false,
      document: null,
      diagnostics: []
    };
  }

  try {
    return {
      ok: true,
      document: JSON.parse(text),
      diagnostics: []
    };
  } catch (error) {
    return {
      ok: false,
      document: null,
      diagnostics: [createCompatibilityDiagnostic({
        code: MIGRATION_LEGACY_PARSE_FAILED_CODE,
        severity: 'error',
        message: `Legacy App-Platform JSON konnte nicht geparst werden: ${error.message}`
      }, { file: sourceFile(input) })]
    };
  }
}

function isAppPlatformPrimitiveDocument(document) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    return false;
  }

  const schema = normalizeString(document.schema);
  const metadata = toPlainObject(toPlainObject(document.manifest).metadata);
  const marker = [
    schema,
    normalizeString(metadata.contractVersion),
    normalizeString(metadata.toolingContract),
    normalizeString(metadata.stateContract),
    normalizeString(metadata.actionContract),
    normalizeString(metadata.eventContract),
    normalizeString(metadata.surfaceGraphContract)
  ].join(' ');

  if (/rmt-app-platform/u.test(marker)) {
    return true;
  }

  return APP_PLATFORM_PRIMITIVE_DOMAINS.some((domain) => countDomain(document, domain) > 0);
}

function appPlatformDomainCounts(document) {
  return APP_PLATFORM_PRIMITIVE_DOMAINS.reduce((counts, domain) => {
    counts[domain] = countDomain(document, domain);
    return counts;
  }, {});
}

function sourceReferenceForDataSource(dataSource = {}) {
  const kind = normalizeString(dataSource.kind);

  if (kind === 'fixture') {
    const recordsRef = typeof dataSource.records === 'string'
      ? stripDollarPath(dataSource.records).replace(/^records\./u, 'records.')
      : `${recordId(dataSource, 'datasource')}.records`;
    return {
      kind: 'fixture',
      target: safeIdentifier(recordsRef.replace(/^records\.records\./u, 'records.'), 'fixture.records')
    };
  }

  if (kind === 'sse') {
    return {
      kind: 'sse',
      target: dataSource.endpoint || dataSource.url || recordId(dataSource, 'stream')
    };
  }

  if (kind === 'worker') {
    return {
      kind: 'worker',
      target: dataSource.worker || dataSource.module || recordId(dataSource, 'worker')
    };
  }

  if (kind === 'rest' || kind === 'endpoint' || dataSource.endpoint) {
    return {
      kind: 'endpoint',
      target: dataSource.endpoint || dataSource.url || `/${recordId(dataSource, 'endpoint')}`
    };
  }

  return {
    kind: 'fixture',
    target: `${recordId(dataSource, 'datasource')}.records`
  };
}

function sourceReferenceForSelector(selector = {}) {
  const from = normalizeString(selector.from || selector.source || selector.dataSource || selector.datasource);
  if (!from) {
    return {
      kind: 'state',
      target: 'state.empty'
    };
  }
  if (/^datasource[.:]/u.test(from)) {
    return {
      kind: 'datasource',
      target: primitiveName(from, from)
    };
  }
  return {
    kind: 'state',
    target: primitiveName(from, from)
  };
}

function selectSurfaceSource(surface = {}, selectors = [], dataSources = []) {
  const source = normalizeString(surface.source || surface.from);
  const selector = selectors.find((entry) => normalizeString(entry.from) === source)
    || selectors[0];
  if (selector) {
    return {
      kind: 'selector',
      target: recordId(selector, 'selector.items')
    };
  }

  const dataSource = dataSources.find((entry) => recordId(entry, '') === primitiveName(source, source))
    || dataSources[0];
  if (dataSource) {
    return {
      kind: 'datasource',
      target: recordId(dataSource, 'datasource.items')
    };
  }

  return {
    kind: 'state',
    target: 'state.items'
  };
}

function eventPayloadMappings(event = {}) {
  const contract = toPlainObject(event.payloadContract || event.contract);
  const required = toArray(contract.required);
  const payload = toPlainObject(event.payload);
  const keys = required.length > 0 ? required : Object.keys(payload);
  return keys.map((key) => {
    const rawSource = normalizeString(payload[key]);
    const source = rawSource.startsWith('$detail.')
      ? rawSource.slice('$'.length)
      : rawSource.startsWith('$target.')
        ? rawSource.slice('$'.length)
        : `detail.${safeIdentifier(key, 'value')}`;
    return {
      name: safeIdentifier(key, 'value'),
      source: safeIdentifier(source, `detail.${safeIdentifier(key, 'value')}`)
    };
  });
}

function resourceOwnerMap(document) {
  const owners = new Map();
  domainRecords(document, 'surfaces').forEach((surface) => {
    resourceRefs(surface && surface.resources).forEach((resourceId) => {
      const id = primitiveName(resourceId, 'resource');
      if (!owners.has(id)) owners.set(id, { kind: 'surface', id: recordId(surface, 'surface') });
    });
  });
  domainRecords(document, 'overlays').forEach((overlay) => {
    resourceRefs(overlay && overlay.resources).forEach((resourceId) => {
      const id = primitiveName(resourceId, 'resource');
      if (!owners.has(id)) owners.set(id, { kind: 'overlay', id: recordId(overlay, 'overlay') });
    });
  });
  return owners;
}

function createAppPlatformPrimitiveAuthoringDraft(document = {}) {
  const manifest = toPlainObject(document.manifest);
  const metadata = toPlainObject(manifest.metadata);
  const documentId = safeIdentifier(manifest.documentId || manifest.id || metadata.documentId || 'app.platform.migration', 'app.platform.migration');
  const states = domainRecords(document, 'states', 'state');
  const selectors = domainRecords(document, 'selectors');
  const dataSources = domainRecords(document, 'dataSources', 'datasources');
  const actions = domainRecords(document, 'actions');
  const portals = domainRecords(document, 'portals');
  const overlays = domainRecords(document, 'overlays');
  const resources = domainRecords(document, 'resources');
  const surfaces = domainRecords(document, 'surfaces');
  const events = domainRecords(document, 'events');
  const owners = resourceOwnerMap(document);
  const lines = [`template ${documentId} {`];

  states.forEach((state, index) => {
    const id = recordId(state, `state.${index}`);
    const type = safeIdentifier(state.type || state.schema || 'object', 'object');
    const preserve = state.preserve ? ' preserve' : '';
    const initial = Object.prototype.hasOwnProperty.call(state, 'initial') ? state.initial : null;
    const inlineInitial = primitiveValueLiteral(initial);
    const blockInitial = primitiveInitialEntries(initial);
    if (inlineInitial !== null && (initial === null || !initial || typeof initial !== 'object' || Array.isArray(initial))) {
      lines.push(`  state ${id} type ${type}${preserve} initial ${inlineInitial}`);
    } else {
      lines.push(`  state ${id} type ${type}${preserve} {`);
      lines.push('    initial {');
      blockInitial.forEach(([key, value]) => lines.push(`      ${key} ${value}`));
      lines.push('    }');
      lines.push('  }');
    }
    lines.push('');
  });

  selectors.forEach((selector, index) => {
    const id = recordId(selector, `selector.${index}`);
    const source = sourceReferenceForSelector(selector);
    lines.push(`  selector ${id} from ${source.kind} ${source.target} {`);
    toArray(selector.where).forEach((where) => {
      const pathName = safeIdentifier(where.path || 'value', 'value');
      const op = normalizeString(where.op) === 'equals' ? '==' : normalizeString(where.op) || '==';
      const value = primitiveValueLiteral(where.value);
      lines.push(`    where ${pathName} ${op} ${value === null ? 'true' : value}`);
    });
    if (selector.path && selector.compute === 'boolean') {
      lines.push(`    find ${safeIdentifier(selector.path, 'value')} != null`);
    }
    if (selector.sort && selector.sort.by) {
      lines.push(`    sort by ${safeIdentifier(selector.sort.by, 'value')} ${safeIdentifier(selector.sort.direction || 'asc', 'asc')}`);
    }
    lines.push(`    output ${safeIdentifier(selector.output || selector.contract || 'auto', 'auto')}`);
    lines.push('  }');
    lines.push('');
  });

  dataSources.forEach((dataSource, index) => {
    const id = recordId(dataSource, `datasource.${index}`);
    const source = sourceReferenceForDataSource(dataSource);
    const target = source.kind === 'endpoint' || source.kind === 'sse'
      ? quoteString(source.target)
      : safeIdentifier(source.target, `${id}.source`);
    lines.push(`  datasource ${id} from ${source.kind} ${target} {`);
    if (dataSource.method) lines.push(`    method ${quoteString(dataSource.method)}`);
    if (dataSource.contract) lines.push(`    contract ${quoteString(dataSource.contract)}`);
    if (dataSource.resultPath || dataSource.result) lines.push(`    result ${quoteString(dataSource.resultPath || dataSource.result)}`);
    lines.push('  }');
    lines.push('');
  });

  actions.forEach((action, index) => {
    const id = recordId(action, `action.${index}`);
    lines.push(`  action ${id} {`);
    lines.push('    input id string');
    if (action.statusState) lines.push(`    status state.${primitiveName(action.statusState, 'actionStatus')}`);
    if (action.datasource) lines.push(`    effect fetch datasource ${primitiveName(action.datasource, 'items')}`);
    if (action.resultState) lines.push(`    reduce state.${primitiveName(action.resultState, 'result')} = result.records`);
    lines.push(`    emit ${id}.completed with action ${id}`);
    lines.push('  }');
    lines.push('');
  });

  portals.forEach((portal, index) => {
    const id = recordId(portal, `portal.${index}`);
    const root = normalizeString(portal.root || portal.selector || `#${id}`);
    const layer = /toast|modal|overlay|escape|popover|dialog/u.test(`${portal.policy || ''} ${id}`) ? 'overlay' : 'surface';
    lines.push(`  portal ${id} root ${quoteString(root.startsWith('#') ? root : `#${root}`)} layer ${layer}`);
    lines.push('');
  });

  overlays.forEach((overlay, index) => {
    const id = recordId(overlay, `overlay.${index}`);
    const kind = safeIdentifier(overlay.kind || 'overlay', 'overlay');
    const portal = primitiveName(overlay.portal || 'overlay', 'overlay');
    lines.push(`  overlay ${id} kind ${kind} portal ${portal} {`);
    if (overlay.dismissible !== false) lines.push('    escape close topmost');
    lines.push('  }');
    lines.push('');
  });

  resources.forEach((resource, index) => {
    const id = recordId(resource, `resource.${index}`);
    const kind = safeIdentifier(resource.kind || 'resource', 'resource');
    const owner = owners.get(id) || { kind: 'surface', id: surfaces[0] ? recordId(surfaces[0], 'surface.root') : 'root' };
    lines.push(`  resource ${id} kind ${kind} owner ${owner.kind}.${owner.id} {`);
    if (resource.importId || resource.import) lines.push(`    import ${quoteString(resource.importId || resource.import)}`);
    if (resource.source) lines.push(`    source ${safeIdentifier(owner.kind, 'surface')} ${primitiveName(resource.source, owner.id)}`);
    lines.push('    dispose on surface.destroy');
    lines.push('  }');
    lines.push('');
  });

  surfaces.forEach((surface, index) => {
    const id = recordId(surface, `surface.${index}`);
    const kind = safeIdentifier(surface.kind || surface.type || 'surface', 'surface');
    const component = primitiveName(surface.component || surface.template || id, id);
    const source = selectSurfaceSource(surface, selectors, dataSources);
    const repeated = surface.repeat === true || Boolean(surface.source || surface.from);
    lines.push(`  surface ${id} kind ${kind} component ${component} {`);
    if (repeated) lines.push(`    repeat from ${source.kind} ${source.target}`);
    else lines.push(`    source ${source.kind} ${source.target}`);
    if (surface.key || surface.keyPath) lines.push(`    key ${stripDollarPath(surface.key || surface.keyPath)}`);
    if (surface.portal) lines.push(`    portal ${primitiveName(surface.portal, 'app')}`);
    if (surface.bounds) {
      const bounds = toPlainObject(surface.bounds);
      lines.push(`    bounds x ${bounds.x || 0} y ${bounds.y || 0} width ${bounds.width || 320} height ${bounds.height || 240}`);
    }
    resourceRefs(surface.resources).forEach((resourceId) => lines.push(`    destroy releases resource ${primitiveName(resourceId, 'resource')}`));
    lines.push('');
    lines.push('    lane visible weight 70 {');
    lines.push(`      hydrate ${safeIdentifier(component, 'component')} from ${source.kind} ${source.target}`);
    lines.push('    }');
    const ownedEvents = events.filter((event) => primitiveName(event.owner, '') === id);
    ownedEvents.forEach((event) => {
      const action = primitiveName(event.action || 'noop', 'noop');
      const eventName = safeIdentifier(event.event || 'click', 'click');
      const target = event.target ? ` target ${primitiveName(stripDollarPath(event.target), 'target')}` : '';
      lines.push('');
      lines.push(`    on ${eventName}${target} -> action ${action} {`);
      eventPayloadMappings(event).forEach((mapping) => lines.push(`      payload ${mapping.name} from ${mapping.source}`));
      if (event.preventDefault) lines.push('      preventDefault true');
      lines.push('    }');
    });
    lines.push('  }');
    lines.push('');
  });

  lines.push('}');
  return `${lines.join('\n').replace(/\n{3,}/gu, '\n\n')}\n`;
}

function createAppPlatformPrimitiveMigrationPreview(input = {}, options = {}) {
  const parsed = rawAppPlatformDocument(input);
  const diagnostics = toArray(parsed.diagnostics);
  const document = parsed.document;
  const detected = parsed.ok && isAppPlatformPrimitiveDocument(document);

  if (!parsed.ok || !detected) {
    const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'not_app_platform';
    return {
      schema: RMT_VNEXT_PRIMITIVE_MIGRATION_SCHEMA,
      workpackage: RMT_VNEXT_PRIMITIVE_MIGRATION_WORKPACKAGE,
      languageMode: 'unknown',
      detected: false,
      status,
      ok: false,
      source: sourceFile(input),
      authoringDraft: null,
      authoringDraftCompileStatus: null,
      projection: null,
      domainMapping: {},
      legacyAuthoring: {
        role: 'unknown',
        backgrounded: false
      },
      diagnostics,
      ...diagnosticSummary(diagnostics)
    };
  }

  const authoringDraft = createAppPlatformPrimitiveAuthoringDraft(document);
  const compileResult = compileRmtVNextSource({
    text: authoringDraft,
    uri: input.uri,
    filePath: input.filePath
  }, options);

  if (!compileResult.ok) {
    diagnostics.push(createCompatibilityDiagnostic({
      code: MIGRATION_PRIMITIVE_COMPILE_FAILED_CODE,
      severity: 'error',
      message: 'Der App-Platform-Primitive-vNext-Draft konnte nicht kompiliert werden.',
      details: {
        diagnosticCodes: toArray(compileResult.diagnostics).map((diagnostic) => diagnostic.code)
      }
    }, { file: sourceFile(input) }));
  }

  diagnostics.push(createCompatibilityDiagnostic({
    code: MIGRATION_LEGACY_BACKGROUNDED_CODE,
    severity: 'info',
    message: 'Legacy/App-Platform JSON bleibt Compiler-Target und Mirror, nicht primaerer Authoring-Pfad.',
    details: {
      defaultAuthoring: 'rmt-vnext-primitives',
      legacyRole: 'compiler-target'
    }
  }, { file: sourceFile(input) }));

  const summary = diagnosticSummary(diagnostics);
  const status = summary.errorCount > 0 ? 'blocked' : 'preview-ready';
  const coreDocument = compileResult.coreDocument || null;

  return {
    schema: RMT_VNEXT_PRIMITIVE_MIGRATION_SCHEMA,
    workpackage: RMT_VNEXT_PRIMITIVE_MIGRATION_WORKPACKAGE,
    languageMode: 'legacy-app-platform-json',
    detected: true,
    status,
    ok: status === 'preview-ready',
    source: sourceFile(input),
    authoringDraft,
    authoringDraftCompileStatus: compileResult.status,
    projection: coreDocument,
    domainMapping: appPlatformDomainCounts(document),
    appPlatformArtifactSchema: coreDocument && coreDocument.appPlatform && coreDocument.appPlatform.schema || null,
    kernelRecordsSchema: coreDocument && coreDocument.kernelRecords && coreDocument.kernelRecords.schema || null,
    sourceMapSummary: {
      totalCount: coreDocument ? toArray(coreDocument.sourceMap).length : 0
    },
    legacyAuthoring: {
      role: 'compiler-target',
      backgrounded: true,
      mirrorRequired: true
    },
    vNextAuthoring: {
      role: 'default',
      syntax: 'rmt-vnext-primitives'
    },
    diagnostics,
    ...summary
  };
}

function appPlatformPrimitiveMigrationTargetPath(input = {}, options = {}) {
  if (options.targetPath) {
    return path.normalize(options.targetPath);
  }

  const filePath = sourceFile(input);
  if (!filePath) {
    return 'rmt-vnext-primitives-migration.rmt';
  }

  const directory = path.dirname(filePath);
  const basename = path.basename(filePath)
    .replace(/\.rmt\.json$/u, '')
    .replace(/\.json$/u, '')
    .replace(/\.rmt$/u, '');

  return path.join(directory, `${basename}.vnext.rmt`);
}

function createAppPlatformPrimitiveMigrationApplyPlan(input = {}, options = {}) {
  const preview = createAppPlatformPrimitiveMigrationPreview(input, options);
  const diagnostics = toArray(preview.diagnostics);
  const compileReady = preview.authoringDraftCompileStatus === 'compiled' && !!preview.projection;
  const status = !preview.detected
    ? (preview.status === 'blocked' ? 'blocked' : 'report-only')
    : (preview.ok && compileReady ? 'apply-plan-ready' : 'blocked');
  const summary = diagnosticSummary(diagnostics);

  return {
    schema: RMT_VNEXT_PRIMITIVE_MIGRATION_APPLY_PLAN_SCHEMA,
    previewSchema: RMT_VNEXT_PRIMITIVE_MIGRATION_SCHEMA,
    workpackage: RMT_VNEXT_PRIMITIVE_MIGRATION_WORKPACKAGE,
    languageMode: preview.languageMode,
    migrationMode: 'apply-plan',
    detected: preview.detected,
    status,
    ok: status === 'apply-plan-ready',
    source: preview.source,
    targetPath: appPlatformPrimitiveMigrationTargetPath(input, options),
    writePolicy: 'manual-apply-only',
    automaticWrite: false,
    authoringDraft: status === 'apply-plan-ready' ? preview.authoringDraft : null,
    authoringDraftCompileStatus: preview.authoringDraftCompileStatus,
    compileStatus: preview.authoringDraftCompileStatus,
    projection: status === 'apply-plan-ready' ? preview.projection : null,
    domainMapping: preview.domainMapping || {},
    legacyAuthoring: preview.legacyAuthoring,
    vNextAuthoring: preview.vNextAuthoring || {
      role: 'default',
      syntax: 'rmt-vnext-primitives'
    },
    preview,
    diagnostics,
    ...summary
  };
}

function laneForSchedule(document, scheduleId) {
  const schedule = toArray(document.schedules).find((entry) => entry && entry.id === scheduleId);
  return safeIdentifier(schedule && schedule.lane || 'visible', 'visible');
}

function createLegacyAuthoringDraft(document) {
  const manifest = toPlainObject(document.manifest);
  const documentId = safeIdentifier(manifest.documentId || manifest.namespace || 'legacy.document', 'legacy.document');
  const routes = toArray(document.routes);
  const components = toArray(document.components);
  const lines = [`template ${documentId} {`];

  if (routes.length > 0) {
    routes.forEach((route, index) => {
      const surface = safeIdentifier(route.id || `route.${index}`, `route.${index}`);
      const lane = laneForSchedule(document, route.schedule);
      const target = safeIdentifier(route.component || route.template || `route-target.${index}`, `route-target.${index}`);
      lines.push(`  surface ${surface} {`);
      lines.push(`    lane ${lane} {`);
      lines.push(`      mount ${target}`);
      lines.push('    }');
      lines.push('  }');
    });
  } else if (components.length > 0) {
    lines.push('  surface components {');
    components.forEach((component) => {
      const lane = laneForSchedule(document, component.schedule);
      const target = safeIdentifier(component.id, 'component');
      lines.push(`    lane ${lane} {`);
      lines.push(`      mount ${target}`);
      lines.push('    }');
    });
    lines.push('  }');
  } else {
    lines.push('  surface root {');
    lines.push('    lane visible {');
    lines.push('      mount empty-shell');
    lines.push('    }');
    lines.push('  }');
  }

  lines.push('}');
  return `${lines.join('\n')}\n`;
}

function countDomain(document, domain) {
  return toArray(document && document[domain]).length;
}

function createBoundaryDiagnostics(document, base = {}) {
  const diagnostics = [];
  const domains = LEGACY_DOMAINS.reduce((result, domain) => {
    result[domain] = countDomain(document, domain);
    return result;
  }, {});

  if (domains.adapters > 0) {
    diagnostics.push(createCompatibilityDiagnostic({
      code: MIGRATION_LOSSY_DOMAIN_CODE,
      severity: 'warning',
      message: 'Legacy adapters bleiben Host-Contracts und werden nicht automatisch in vNext Authoring umgeschrieben.',
      details: { domain: 'adapters', count: domains.adapters }
    }, base));
  }

  if (domains.routes > 0) {
    diagnostics.push(createCompatibilityDiagnostic({
      code: MIGRATION_LOSSY_DOMAIN_CODE,
      severity: 'warning',
      message: 'Legacy routes werden als Surface/Lifecycle-Preview projiziert; Router-Metadaten bleiben im Migrationsreport.',
      details: { domain: 'routes', count: domains.routes }
    }, base));
  }

  if (domains.components > 0) {
    diagnostics.push(createCompatibilityDiagnostic({
      code: MIGRATION_LOSSY_DOMAIN_CODE,
      severity: 'warning',
      message: 'Legacy Component Props, Attributes, Slots und Events benoetigen bewusstes Adapter-Authoring.',
      details: { domain: 'components', count: domains.components }
    }, base));
  }

  if (domains.templates > 0) {
    diagnostics.push(createCompatibilityDiagnostic({
      code: MIGRATION_LOSSY_DOMAIN_CODE,
      severity: 'warning',
      message: 'Legacy Template Nodes werden nicht automatisch in vNext Orchestrierungs-Syntax serialisiert.',
      details: { domain: 'templates', count: domains.templates }
    }, base));
  }

  const unknownDomains = Object.keys(toPlainObject(document)).filter((domain) => {
    return ![
      'kind',
      'version',
      'manifest',
      'adapters',
      'components',
      'routes',
      'schedules',
      'surfaces',
      'templates',
      'diagnostics',
      'normalization',
      'extensionSlots',
      'metadata'
    ].includes(domain);
  });

  unknownDomains.forEach((domain) => {
    diagnostics.push(createCompatibilityDiagnostic({
      code: MIGRATION_UNSUPPORTED_DOMAIN_CODE,
      severity: 'error',
      message: `Legacy Domain "${domain}" ist nicht Teil der kontrollierten vNext-Migration.`,
      details: { domain }
    }, base));
  });

  return diagnostics;
}

function createLegacyCoreProjection(document) {
  const manifest = cloneJson(toPlainObject(document.manifest));
  const routes = toArray(document.routes);
  const components = toArray(document.components);
  const schedules = toArray(document.schedules);
  const templates = toArray(document.templates);
  const lanes = schedules.map((schedule, index) => ({
    id: `lane:legacy/${safeIdentifier(schedule.id || `schedule.${index}`, `schedule.${index}`)}`,
    name: safeIdentifier(schedule.lane || 'visible', 'visible'),
    scope: {
      surface: 'surface:legacy/root'
    },
    operationRefs: [],
    legacyScheduleRef: schedule.id || null,
    sourceRef: null
  }));
  const fallbackLane = lanes[0] || {
    id: 'lane:legacy/visible',
    name: 'visible',
    scope: {
      surface: 'surface:legacy/root'
    },
    operationRefs: [],
    legacyScheduleRef: null,
    sourceRef: null
  };
  const laneBySchedule = new Map(lanes.map((lane) => [lane.legacyScheduleRef, lane]));
  const surfaces = routes.length > 0 ? routes.map((route, index) => ({
    id: `surface:legacy/${safeIdentifier(route.id || `route.${index}`, `route.${index}`)}`,
    name: safeIdentifier(route.id || `route.${index}`, `route.${index}`),
    kind: 'legacy_route_surface',
    laneRefs: [],
    legacyRouteRef: route.id || null,
    sourceRef: null
  })) : [{
    id: 'surface:legacy/root',
    name: 'root',
    kind: 'legacy_root_surface',
    laneRefs: [fallbackLane.id],
    sourceRef: null
  }];
  const operations = [];

  routes.forEach((route, index) => {
    const lane = laneBySchedule.get(route.schedule) || fallbackLane;
    const surface = surfaces[index] || surfaces[0];
    const operation = {
      id: `operation:legacy/route/${safeIdentifier(route.id || `route.${index}`, `route.${index}`)}`,
      kind: 'lifecycle',
      op: 'mount',
      target: {
        kind: 'ref',
        ref: route.component || route.template || route.id || `route.${index}`
      },
      scope: {
        surface: surface.id,
        lane: lane.id
      },
      legacyRouteRef: route.id || null,
      sourceRef: null
    };
    operations.push(operation);
    lane.operationRefs.push(operation.id);
    if (!surface.laneRefs.includes(lane.id)) surface.laneRefs.push(lane.id);
  });

  if (routes.length === 0) {
    components.forEach((component, index) => {
      const lane = laneBySchedule.get(component.schedule) || fallbackLane;
      const operation = {
        id: `operation:legacy/component/${safeIdentifier(component.id || `component.${index}`, `component.${index}`)}`,
        kind: 'lifecycle',
        op: component.hydration ? 'hydrate' : 'mount',
        target: {
          kind: 'ref',
          ref: component.id || `component.${index}`
        },
        scope: {
          surface: surfaces[0].id,
          lane: lane.id
        },
        legacyComponentRef: component.id || null,
        sourceRef: null
      };
      operations.push(operation);
      lane.operationRefs.push(operation.id);
    });
  }

  return {
    schema: RMT_VNEXT_CORE_SCHEMA,
    projectionSchema: RMT_VNEXT_LEGACY_PROJECTION_SCHEMA,
    kind: 'rmt_vnext_core',
    version: 'vnext',
    manifest: {
      documentId: manifest.documentId || 'legacy.document',
      namespace: manifest.namespace || null,
      legacyVersion: document.version || null,
      migration: {
        strategy: 'legacy-core-projection',
        lossless: false,
        sourceSchema: RMT_FORMAT_ADAPTER_SCHEMA
      }
    },
    imports: [],
    templates: templates.length > 0 ? templates.map((template, index) => ({
      id: `template:${safeIdentifier(template.id || `template.${index}`, `template.${index}`)}`,
      name: safeIdentifier(template.id || `template.${index}`, `template.${index}`),
      mode: 'legacy_projection',
      surfaceRefs: surfaces.map((surface) => surface.id),
      legacyTemplateRef: template.id || null,
      sourceRef: null
    })) : [{
      id: `template:${safeIdentifier(manifest.documentId || 'legacy.document', 'legacy.document')}`,
      name: safeIdentifier(manifest.documentId || 'legacy.document', 'legacy.document'),
      mode: 'legacy_projection',
      surfaceRefs: surfaces.map((surface) => surface.id),
      sourceRef: null
    }],
    surfaces,
    lanes: lanes.length > 0 ? lanes : [fallbackLane],
    operations,
    slots: [],
    events: [],
    dataSources: [],
    securityPolicies: [],
    sourceMap: [],
    legacyDomains: LEGACY_DOMAINS.reduce((result, domain) => {
      result[domain] = countDomain(document, domain);
      return result;
    }, {})
  };
}

function createLegacyRoundtripReport(input = {}, options = {}) {
  const parseResult = parseAndNormalizeRmtSource(input, options);
  const base = {
    uri: parseResult.sourceModel ? parseResult.sourceModel.uri : input.uri || null,
    file: parseResult.sourceModel ? parseResult.sourceModel.filePath : sourceFile(input)
  };
  const diagnostics = toArray(parseResult.diagnostics).map((diagnostic) => normalizeSourceDiagnostic(diagnostic, base));

  if (!parseResult.ok) {
    const failedCode = parseResult.phase === 'syntax'
      ? MIGRATION_LEGACY_PARSE_FAILED_CODE
      : MIGRATION_LEGACY_NORMALIZATION_FAILED_CODE;
    diagnostics.push(createCompatibilityDiagnostic({
      code: failedCode,
      severity: 'error',
      message: parseResult.phase === 'syntax'
        ? 'Legacy RMT JSON konnte nicht geparst werden.'
        : 'Legacy RMT JSON konnte nicht normalisiert werden.'
    }, base));
    return {
      schema: RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA,
      workpackage: RMT_VNEXT_COMPATIBILITY_WORKPACKAGE,
      languageMode: 'legacy-json',
      status: 'blocked',
      ok: false,
      lossless: false,
      parseStatus: parseResult.status,
      normalizedStatus: null,
      serializedLength: 0,
      diagnostics,
      ...diagnosticSummary(diagnostics)
    };
  }

  const serialized = canonicalJson(parseResult.normalizedDocument);
  const repeatResult = parseAndNormalizeRmtSource({
    text: serialized,
    uri: input.uri,
    filePath: input.filePath
  }, options);
  const originalCanonical = canonicalJson(semanticRoundtripDocument(parseResult.normalizedDocument));
  const repeatCanonical = repeatResult.ok ? canonicalJson(semanticRoundtripDocument(repeatResult.normalizedDocument)) : '';
  const lossless = repeatResult.ok && originalCanonical === repeatCanonical;

  if (!lossless) {
    diagnostics.push(createCompatibilityDiagnostic({
      code: ROUNDTRIP_MISMATCH_CODE,
      severity: 'error',
      message: 'Legacy RMT Roundtrip ist nicht stabil auf fachlicher normalisierter JSON-Repraesentation.'
    }, base));
  }

  return {
    schema: RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_COMPATIBILITY_WORKPACKAGE,
    languageMode: 'legacy-json',
    status: lossless ? 'ready' : 'blocked',
    ok: lossless,
    lossless,
    comparisonBoundary: 'semantic-normalized-json-with-normalization-metadata-excluded',
    parseStatus: parseResult.status,
    normalizedStatus: parseResult.normalizedDocument && parseResult.normalizedDocument.normalization
      ? parseResult.normalizedDocument.normalization.status
      : parseResult.status,
    serialized,
    serializedLength: serialized.length,
    diagnostics,
    ...diagnosticSummary(diagnostics)
  };
}

function createMigrationReport(input = {}, options = {}) {
  const migrationMode = options.migrationMode || 'report-only';

  if (isLikelyRmtVNextSource(input, options)) {
    const compileResult = compileRmtVNextSource(input, options);
    const diagnostics = toArray(compileResult.diagnostics).map((diagnostic) => normalizeSourceDiagnostic(diagnostic, {
      file: sourceFile(input)
    }));
    if (!compileResult.ok) {
      diagnostics.push(createCompatibilityDiagnostic({
        code: MIGRATION_VNEXT_COMPILE_FAILED_CODE,
        severity: 'error',
        message: 'vNext Source konnte nicht in Core kompiliert werden.'
      }, { file: sourceFile(input) }));
    }
    const status = compileResult.ok ? 'ready' : 'blocked';
    return {
      schema: RMT_VNEXT_MIGRATION_REPORT_SCHEMA,
      workpackage: RMT_VNEXT_COMPATIBILITY_WORKPACKAGE,
      languageMode: 'vnext',
      migrationRequired: false,
      migrationMode,
      status,
      ok: status === 'ready',
      compatible: compileResult.ok === true,
      roundtrip: null,
      projection: compileResult.coreDocument || null,
      authoringDraft: null,
      boundaries: [],
      diagnostics,
      ...diagnosticSummary(diagnostics)
    };
  }

    const appPlatformPlan = migrationMode === 'apply-plan'
      ? createAppPlatformPrimitiveMigrationApplyPlan(input, options)
      : null;
    const appPlatformPreview = appPlatformPlan ? appPlatformPlan.preview : createAppPlatformPrimitiveMigrationPreview(input, options);
    if (appPlatformPreview.detected) {
    const optInDiagnostics = migrationMode === 'report-only' ? [
      createCompatibilityDiagnostic({
        code: MIGRATION_OPT_IN_REQUIRED_CODE,
        severity: 'warning',
        message: 'Migration bleibt opt-in. Nutze migrationMode "preview", um einen vNext Primitive Authoring-Draft zu erzeugen.'
      }, { file: sourceFile(input) }),
      createCompatibilityDiagnostic({
        code: MIGRATION_PRIMITIVE_PREVIEW_AVAILABLE_CODE,
        severity: 'info',
        message: 'App-Platform JSON kann als RMT vNext Primitive Authoring-Draft gespiegelt werden.',
        details: {
          schema: RMT_VNEXT_PRIMITIVE_MIGRATION_SCHEMA
        }
      }, { file: sourceFile(input) })
    ] : [];
    const diagnostics = optInDiagnostics.concat(appPlatformPreview.diagnostics);
    const summary = diagnosticSummary(diagnostics);
    const status = summary.errorCount > 0
      ? 'blocked'
      : (migrationMode === 'apply-plan' ? appPlatformPlan.status : (migrationMode === 'preview' ? appPlatformPreview.status : 'report-only'));
    return {
      schema: RMT_VNEXT_MIGRATION_REPORT_SCHEMA,
      workpackage: RMT_VNEXT_PRIMITIVE_MIGRATION_WORKPACKAGE,
      languageMode: 'legacy-app-platform-json',
      migrationRequired: true,
      migrationMode,
      status,
      migrationStatus: status,
      ok: status !== 'blocked',
      compatible: status !== 'blocked',
      roundtrip: null,
      projection: appPlatformPreview.projection,
      authoringDraft: migrationMode === 'preview' || migrationMode === 'apply-plan' ? appPlatformPreview.authoringDraft : null,
      authoringDraftCompileStatus: appPlatformPreview.authoringDraftCompileStatus,
      primitiveMigration: appPlatformPreview,
      primitiveMigrationApplyPlan: appPlatformPlan,
      boundaries: [{
        code: MIGRATION_LEGACY_BACKGROUNDED_CODE,
        severity: 'info',
        message: 'App-Platform JSON bleibt Mirror/Target; vNext Primitive ist Authoring-Default.',
        details: appPlatformPreview.legacyAuthoring
      }],
      compatibleWarningCodes: ROUNDTRIP_COMPATIBLE_WARNINGS.concat(MIGRATION_PRIMITIVE_PREVIEW_AVAILABLE_CODE),
      diagnostics,
      ...summary
    };
  }

  const parseResult = parseAndNormalizeRmtSource(input, options);
  const base = {
    uri: parseResult.sourceModel ? parseResult.sourceModel.uri : input.uri || null,
    file: parseResult.sourceModel ? parseResult.sourceModel.filePath : sourceFile(input)
  };
  const sourceDiagnostics = toArray(parseResult.diagnostics).map((diagnostic) => normalizeSourceDiagnostic(diagnostic, base));
  const roundtrip = createLegacyRoundtripReport(input, options);
  const document = parseResult.ok ? parseResult.normalizedDocument : null;
  const boundaryDiagnostics = document ? createBoundaryDiagnostics(document, base) : [];
  const optInDiagnostics = migrationMode === 'report-only' ? [
    createCompatibilityDiagnostic({
      code: MIGRATION_OPT_IN_REQUIRED_CODE,
      severity: 'warning',
      message: 'Migration bleibt opt-in. Nutze migrationMode "preview", um einen vNext Authoring-Draft zu erzeugen.'
    }, base)
  ] : [];
  const diagnostics = sourceDiagnostics.concat(boundaryDiagnostics).concat(optInDiagnostics).concat(roundtrip.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'));
  const projection = document ? createLegacyCoreProjection(document) : null;
  const authoringDraft = document && migrationMode === 'preview' ? createLegacyAuthoringDraft(document) : null;
  const draftCompileResult = authoringDraft ? compileRmtVNextSource({
    text: authoringDraft,
    uri: input.uri,
    filePath: input.filePath
  }, options) : null;

  if (draftCompileResult && !draftCompileResult.ok) {
    diagnostics.push(createCompatibilityDiagnostic({
      code: MIGRATION_VNEXT_COMPILE_FAILED_CODE,
      severity: 'error',
      message: 'Der vNext Authoring-Draft konnte nicht kompiliert werden.',
      details: {
        diagnosticCodes: draftCompileResult.diagnostics.map((diagnostic) => diagnostic.code)
      }
    }, base));
  }

  const summary = diagnosticSummary(diagnostics);
  const status = summary.errorCount > 0 || !roundtrip.ok ? 'blocked' : 'ready';

  return {
    schema: RMT_VNEXT_MIGRATION_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_COMPATIBILITY_WORKPACKAGE,
    languageMode: 'legacy-json',
    migrationRequired: true,
    migrationMode,
    status,
    ok: status === 'ready',
    compatible: status === 'ready',
    roundtrip,
    projection,
    authoringDraft,
    authoringDraftCompileStatus: draftCompileResult ? draftCompileResult.status : null,
    boundaries: boundaryDiagnostics.map((diagnostic) => ({
      code: diagnostic.code,
      severity: diagnostic.severity,
      message: diagnostic.message,
      details: diagnostic.details
    })),
    compatibleWarningCodes: ROUNDTRIP_COMPATIBLE_WARNINGS.slice(),
    diagnostics,
    ...summary
  };
}

function createCompatibilityMatrix(inputs = [], options = {}) {
  const entries = (Array.isArray(inputs) ? inputs : [inputs]).map((entry, index) => {
    const input = typeof entry === 'string'
      ? {
        text: options.readFile ? options.readFile(entry) : '',
        filePath: entry
      }
      : entry;
    const id = input.id || input.filePath || input.uri || `entry.${index}`;
    const report = createMigrationReport(input, options);
    return {
      id,
      languageMode: report.languageMode,
      status: report.status,
      ok: report.ok,
      compatible: report.compatible,
      migrationRequired: report.migrationRequired,
      migrationMode: report.migrationMode,
      roundtripStatus: report.roundtrip ? report.roundtrip.status : null,
      warningCount: report.warningCount,
      errorCount: report.errorCount,
      diagnosticCodes: toArray(report.diagnostics).map((diagnostic) => diagnostic.code),
      report
    };
  });
  const diagnostics = entries.flatMap((entry) => entry.report.diagnostics || []);
  const summary = diagnosticSummary(diagnostics);
  const status = entries.every((entry) => entry.ok) ? 'ready' : 'blocked';

  return {
    schema: RMT_VNEXT_COMPATIBILITY_SCHEMA,
    reportSchema: RMT_VNEXT_COMPATIBILITY_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_COMPATIBILITY_WORKPACKAGE,
    status,
    ok: status === 'ready',
    entryCount: entries.length,
    compatibleCount: entries.filter((entry) => entry.compatible).length,
    blockedCount: entries.filter((entry) => !entry.compatible).length,
    entries,
    diagnostics,
    ...summary
  };
}

function serializeMigrationReport(report) {
  return canonicalJson(report);
}

function createRmtVNextCompatibilityAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_COMPATIBILITY_SCHEMA,
    migrationReportSchema: RMT_VNEXT_MIGRATION_REPORT_SCHEMA,
    roundtripReportSchema: RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA,
    projectionSchema: RMT_VNEXT_LEGACY_PROJECTION_SCHEMA,
    workpackage: RMT_VNEXT_COMPATIBILITY_WORKPACKAGE,
    createMigrationReport: (input = {}, options = {}) => createMigrationReport(input, {
      ...defaultOptions,
      ...options
    }),
    createAppPlatformPrimitiveMigrationPreview: (input = {}, options = {}) => createAppPlatformPrimitiveMigrationPreview(input, {
      ...defaultOptions,
      ...options
    }),
    createAppPlatformPrimitiveMigrationApplyPlan: (input = {}, options = {}) => createAppPlatformPrimitiveMigrationApplyPlan(input, {
      ...defaultOptions,
      ...options
    }),
    createRoundtripReport: (input = {}, options = {}) => createLegacyRoundtripReport(input, {
      ...defaultOptions,
      ...options
    }),
    createCompatibilityMatrix: (inputs = [], options = {}) => createCompatibilityMatrix(inputs, {
      ...defaultOptions,
      ...options
    }),
    serializeMigrationReport
  });
}

module.exports = {
  APP_PLATFORM_PRIMITIVE_DOMAINS,
  LEGACY_DOMAINS,
  MIGRATION_LEGACY_NORMALIZATION_FAILED_CODE,
  MIGRATION_LEGACY_PARSE_FAILED_CODE,
  MIGRATION_LEGACY_BACKGROUNDED_CODE,
  MIGRATION_LOSSY_DOMAIN_CODE,
  MIGRATION_OPT_IN_REQUIRED_CODE,
  MIGRATION_PRIMITIVE_COMPILE_FAILED_CODE,
  MIGRATION_PRIMITIVE_PREVIEW_AVAILABLE_CODE,
  MIGRATION_UNSUPPORTED_DOMAIN_CODE,
  MIGRATION_VNEXT_COMPILE_FAILED_CODE,
  RMT_VNEXT_COMPATIBILITY_MODULE_PATH,
  RMT_VNEXT_COMPATIBILITY_PACKAGE_SCRIPT,
  RMT_VNEXT_COMPATIBILITY_REPORT_SCHEMA,
  RMT_VNEXT_COMPATIBILITY_SCHEMA,
  RMT_VNEXT_COMPATIBILITY_SUITE_PATH,
  RMT_VNEXT_COMPATIBILITY_WORKPACKAGE,
  RMT_VNEXT_LEGACY_PROJECTION_SCHEMA,
  RMT_VNEXT_MIGRATION_REPORT_SCHEMA,
  RMT_VNEXT_PRIMITIVE_MIGRATION_SCHEMA,
  RMT_VNEXT_PRIMITIVE_MIGRATION_APPLY_PLAN_SCHEMA,
  RMT_VNEXT_PRIMITIVE_MIGRATION_WORKPACKAGE,
  RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA,
  ROUNDTRIP_COMPATIBLE_WARNINGS,
  ROUNDTRIP_MISMATCH_CODE,
  createAppPlatformPrimitiveAuthoringDraft,
  createAppPlatformPrimitiveMigrationApplyPlan,
  createAppPlatformPrimitiveMigrationPreview,
  createCompatibilityMatrix,
  createLegacyAuthoringDraft,
  createLegacyCoreProjection,
  createLegacyRoundtripReport,
  createMigrationReport,
  createRmtVNextCompatibilityAdapter,
  serializeMigrationReport
};
