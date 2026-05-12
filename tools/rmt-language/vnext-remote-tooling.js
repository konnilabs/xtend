'use strict';

const {
  createRmtSourceModel
} = require('./source-model');
const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');
const {
  REMOTE_FALLBACK_MISSING_CODE,
  REMOTE_INTEGRITY_MISSING_CODE,
  REMOTE_OWNER_MISSING_CODE,
  REMOTE_ORIGIN_INVALID_CODE,
  REMOTE_ORIGIN_MISSING_CODE,
  REMOTE_VERSION_MISSING_CODE,
  RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
  RMT_VNEXT_REMOTE_SURFACE_SCHEMA
} = require('./vnext-remote-manifest');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA
} = require('./vnext-enterprise-registry');
const {
  RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA
} = require('./vnext-cross-surface-events');
const {
  RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA
} = require('./vnext-event-governance');
const {
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA
} = require('./vnext-degradation');
const {
  RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
  compileRmtVNextRemoteSource
} = require('./vnext-remote-compiler');

const RMT_VNEXT_REMOTE_TOOLING_SCHEMA = 'xtend.rmt.vnext-remote-tooling.v1';
const RMT_VNEXT_REMOTE_TOOLING_REPORT_SCHEMA = 'xtend.rmt.vnext-remote-tooling-report.v1';
const RMT_VNEXT_REMOTE_AGENT_REPORT_SCHEMA = 'xtend.rmt.vnext-remote-agent-report.v1';
const RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE = 'WP-E16-09';
const RMT_VNEXT_REMOTE_TOOLING_MODULE_PATH = 'tools/rmt-language/vnext-remote-tooling.js';
const RMT_VNEXT_REMOTE_TOOLING_SUITE_PATH = 'tests/rmt-language/rmt_vnext_remote_tooling_suite.js';
const RMT_VNEXT_REMOTE_TOOLING_CONTRACT_PATH = 'development/XTendRMT-vNext-Remote-Tooling-Contract.md';
const RMT_VNEXT_REMOTE_TOOLING_WP_PATH = 'development/WP-E16-09-Tooling-LSP-Snippets-und-Agent-Reports-fuer-Enterprise-MFE-erweitern.md';
const RMT_VNEXT_REMOTE_TOOLING_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-remote-tooling';

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

const REMOTE_TOOLING_EVENT_DIRECTION_MISSING_CODE = 'rmt.vnext.remote_tooling.event_direction_missing';
const REMOTE_TOOLING_PAYLOAD_SHAPE_MISSING_CODE = 'rmt.vnext.remote_tooling.payload_shape_missing';

const REMOTE_TOOLING_RULES = Object.freeze([
  {
    id: 'remote-owner-required',
    code: REMOTE_OWNER_MISSING_CODE,
    title: 'Remote Surface Owner',
    field: 'owner'
  },
  {
    id: 'remote-version-required',
    code: REMOTE_VERSION_MISSING_CODE,
    title: 'Remote Surface Version',
    field: 'version'
  },
  {
    id: 'remote-integrity-required',
    code: REMOTE_INTEGRITY_MISSING_CODE,
    title: 'Remote Manifest Integrity',
    field: 'integrity'
  },
  {
    id: 'remote-fallback-required',
    code: REMOTE_FALLBACK_MISSING_CODE,
    title: 'Remote Fallback Surface',
    field: 'fallback'
  },
  {
    id: 'remote-event-direction-required',
    code: REMOTE_TOOLING_EVENT_DIRECTION_MISSING_CODE,
    title: 'Remote Event Direction',
    field: 'direction'
  },
  {
    id: 'remote-event-payload-required',
    code: REMOTE_TOOLING_PAYLOAD_SHAPE_MISSING_CODE,
    title: 'Remote Event Payload Shape',
    field: 'payload'
  }
]);

const REMOTE_KEYWORDS = Object.freeze([
  ['remote surface', 'Remote Surface deklarieren.'],
  ['from remote', 'Remote Manifest oder Package-ID referenzieren.'],
  ['owner team', 'Enterprise Ownership fuer Discoverability setzen.'],
  ['version', 'Erwartete Remote-Version oder Version Range setzen.'],
  ['origin', 'Erlaubte Remote-Origin dokumentieren.'],
  ['integrity sha256', 'Manifest- oder Remote-Artefakt-Integrity setzen.'],
  ['trust boundary', 'Remote Trust Boundary setzen.'],
  ['fallback surface', 'Fallback Surface fuer Degradation angeben.'],
  ['exposes lane', 'Lane explizit an Shell Target binden.'],
  ['emits', 'Outbound Cross Surface Event deklarieren.'],
  ['consumes', 'Inbound Cross Surface Event deklarieren.']
]);

const REMOTE_EVENT_KEYWORDS = Object.freeze([
  ['owner team', 'Event Owner festlegen.'],
  ['direction outbound', 'Event verlaesst die Remote Surface.'],
  ['direction inbound', 'Event kommt in die Remote Surface hinein.'],
  ['lane', 'Event auf eine Lane scopen.'],
  ['from shell.session', 'Event an Shell Session Scope binden.'],
  ['payload', 'Payload Schema deklarieren.']
]);

const REMOTE_SHELL_TARGETS = Object.freeze([
  ['shell.slot', 'Shell Slot Scope fuer sichtbare oder vorladende UI.'],
  ['shell.session', 'Shell Session Scope fuer Identity-/Session-Fakten.'],
  ['shell.route', 'Shell Route Scope fuer Navigation.']
]);

const REMOTE_SNIPPETS = Object.freeze([
  {
    id: 'rmt-vnext-remote-surface',
    label: 'RMT vNext Remote Surface',
    prefix: 'rmt-vnext-remote-surface',
    description: 'Remote Surface mit Owner, Integrity, Fallback, Exposes und Events.',
    body: [
      'remote surface ${1:checkout.cart} from remote "${2:@xtend/checkout-cart}" {',
      '  owner team "${3:checkout-platform}"',
      '  version "${4:^2.4.0}"',
      '  origin "${5:https://cdn.xtend.example}"',
      '  integrity sha256 "${6:sha256-...}"',
      '  trust boundary "xtend.security.remote-surface.v1"',
      '  fallback surface ${7:checkout.cart.fallback}',
      '',
      '  exposes lane ${8|critical,visible,idle,background|} -> shell.slot "${9:sidebar.cart}"',
      '}'
    ]
  },
  {
    id: 'rmt-vnext-remote-event',
    label: 'RMT vNext Remote Event',
    prefix: 'rmt-vnext-remote-event',
    description: 'Remote emits/consumes Event mit Owner, Richtung, Lane und Payload.',
    body: [
      '${1|emits,consumes|} ${2:checkout.cart.updated.v1} {',
      '  owner team "${3:checkout-platform}"',
      '  direction ${4|outbound,inbound|}',
      '  lane ${5|critical,visible,idle,background|}',
      '  payload "${6:xtend.schemas.cartUpdated.v1}"',
      '}'
    ]
  },
  {
    id: 'rmt-vnext-remote-fallback',
    label: 'RMT vNext Remote Fallback',
    prefix: 'rmt-vnext-remote-fallback',
    description: 'Fallback Surface fuer Remote Degradation deklarieren.',
    body: [
      'fallback surface ${1:checkout.cart.fallback}'
    ]
  },
  {
    id: 'rmt-vnext-remote-degradation',
    label: 'RMT vNext Remote Degradation Policy',
    prefix: 'rmt-vnext-remote-degradation',
    description: 'Degradation-relevante Remote-Fakten im Authoring sichtbar machen.',
    body: [
      'fallback surface ${1:checkout.cart.fallback}',
      'exposes lane ${2|critical,visible,idle,background|} -> shell.slot "${3:sidebar.cart}"'
    ]
  }
]);

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function getInputText(input = {}) {
  return typeof input === 'string' ? input : String(input.text || '');
}

function createSourceModel(input = {}) {
  return createRmtSourceModel(typeof input === 'string' ? { text: input } : input);
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function rangeFromNode(node, sourceModel) {
  if (node && node.range) return node.range;
  return sourceModel && sourceModel.lineRange ? sourceModel.lineRange(0) : null;
}

function repairForCode(code) {
  const repairs = {
    [REMOTE_OWNER_MISSING_CODE]: {
      kind: 'insert-snippet',
      title: 'Owner-Klausel einfuegen',
      insertText: 'owner team "${1:team-id}"'
    },
    [REMOTE_VERSION_MISSING_CODE]: {
      kind: 'insert-snippet',
      title: 'Version Range einfuegen',
      insertText: 'version "${1:^1.0.0}"'
    },
    [REMOTE_INTEGRITY_MISSING_CODE]: {
      kind: 'insert-snippet',
      title: 'SHA-Integrity einfuegen',
      insertText: 'integrity sha256 "${1:sha256-...}"'
    },
    [REMOTE_FALLBACK_MISSING_CODE]: {
      kind: 'insert-snippet',
      title: 'Fallback Surface einfuegen',
      insertText: 'fallback surface ${1:surface.fallback}'
    },
    [REMOTE_TOOLING_EVENT_DIRECTION_MISSING_CODE]: {
      kind: 'insert-snippet',
      title: 'Event Direction einfuegen',
      insertText: 'direction ${1|outbound,inbound|}'
    },
    [REMOTE_TOOLING_PAYLOAD_SHAPE_MISSING_CODE]: {
      kind: 'insert-snippet',
      title: 'Payload Schema einfuegen',
      insertText: 'payload "${1:xtend.schemas.event.v1}"'
    }
  };
  return repairs[code] || null;
}

function normalizeDiagnostic(diagnostic = {}, sourceModel = null) {
  const code = diagnostic.code || 'rmt.vnext.remote_tooling.diagnostic';
  const repair = diagnostic.repair || repairForCode(code);
  return {
    schema: diagnostic.schema || RMT_LINTER_DIAGNOSTIC_SCHEMA,
    source: RMT_VNEXT_REMOTE_TOOLING_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE,
    code,
    ruleId: diagnostic.ruleId || `remote.${code}`,
    severity: diagnostic.severity || 'error',
    category: 'remote-tooling',
    message: diagnostic.message || code,
    uri: diagnostic.uri || (sourceModel ? sourceModel.uri : null),
    file: diagnostic.file || (sourceModel ? sourceModel.filePath : null),
    pointer: diagnostic.pointer || null,
    range: diagnostic.range || (sourceModel && sourceModel.lineRange ? sourceModel.lineRange(0) : null),
    repair,
    relatedInformation: diagnostic.relatedInformation || [],
    metadata: diagnostic.metadata || {}
  };
}

function diagnosticKey(diagnostic) {
  const field = diagnostic.field || diagnostic.metadata && diagnostic.metadata.field || '';
  const surface = diagnostic.surfaceId || diagnostic.surfaceName || diagnostic.metadata && diagnostic.metadata.surfaceName || '';
  return [diagnostic.code, diagnostic.message, field, surface].join('|');
}

function dedupeDiagnostics(diagnostics) {
  const seen = new Set();
  const result = [];
  diagnostics.forEach((diagnostic) => {
    const key = diagnosticKey(diagnostic);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(diagnostic);
  });
  return result;
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

function topLevelRemoteSurfaces(ast) {
  if (!ast || !Array.isArray(ast.body)) return [];
  return ast.body.filter((node) => node && node.type === 'RmtRemoteSurfaceDeclaration');
}

function bodyNodes(node, type) {
  return toArray(node && node.body).filter((child) => child && child.type === type);
}

function hasBodyNode(node, type) {
  return bodyNodes(node, type).length > 0;
}

function createAstDiagnostic(node, sourceModel, code, message, metadata = {}) {
  return normalizeDiagnostic({
    code,
    message,
    severity: metadata.severity || 'error',
    range: rangeFromNode(node, sourceModel),
    metadata,
    pointer: metadata.pointer || null
  }, sourceModel);
}

function createAuthoringDiagnostics(ast, sourceModel) {
  const diagnostics = [];

  topLevelRemoteSurfaces(ast).forEach((surface) => {
    bodyNodes(surface, 'RmtRemoteEventClause').forEach((eventNode) => {
      if (!hasBodyNode(eventNode, 'RmtRemoteEventDirectionClause')) {
        diagnostics.push(createAstDiagnostic(
          eventNode,
          sourceModel,
          REMOTE_TOOLING_EVENT_DIRECTION_MISSING_CODE,
          `Remote event "${eventNode.event || 'unknown'}" must declare direction inbound or outbound.`,
          { field: 'direction', event: eventNode.event, surfaceName: surface.name }
        ));
      }

      if (!hasBodyNode(eventNode, 'RmtRemoteEventPayloadClause')) {
        diagnostics.push(createAstDiagnostic(
          eventNode,
          sourceModel,
          REMOTE_TOOLING_PAYLOAD_SHAPE_MISSING_CODE,
          `Remote event "${eventNode.event || 'unknown'}" must declare a payload schema.`,
          { field: 'payload', event: eventNode.event, surfaceName: surface.name }
        ));
      }
    });
  });

  return diagnostics;
}

function createRemoteSurfaceIndex(coreDocument = {}) {
  return toArray(coreDocument.remoteSurfaces).map((surface, index) => ({
    index,
    id: surface.id,
    name: surface.name,
    owner: cloneJson(surface.owner),
    remote: cloneJson(surface.remote),
    fallback: cloneJson(surface.fallback),
    pointer: `/remoteSurfaces/${index}`,
    sourceRef: surface.sourceRef || null
  }));
}

function createShellTargetIndex(enterpriseRegistry = {}) {
  return Object.keys(enterpriseRegistry.indexes && enterpriseRegistry.indexes.byShellTarget || {}).sort().map((target) => ({
    target,
    surfaceIds: enterpriseRegistry.indexes.byShellTarget[target]
  }));
}

function createEventIndex(crossSurfaceEventReport = {}) {
  return toArray(crossSurfaceEventReport.events).map((event) => ({
    event: event.event,
    owner: cloneJson(event.owner),
    version: event.version,
    status: event.status,
    bindingCount: toArray(event.bindings).length,
    scopes: cloneJson(event.scopes || [])
  }));
}

function createDegradationIndex(degradationReport = {}) {
  return toArray(degradationReport.surfaces).map((surface) => ({
    name: surface.name,
    kind: surface.kind,
    state: surface.state,
    fallbackResolved: surface.fallbackResolution && surface.fallbackResolution.resolved === true
  }));
}

function createRemoteIndexes(result = {}) {
  return {
    remoteSurfaces: createRemoteSurfaceIndex(result.coreDocument || {}),
    shellTargets: createShellTargetIndex(result.enterpriseRegistry || {}),
    events: createEventIndex(result.crossSurfaceEventReport || {}),
    degradation: createDegradationIndex(result.degradationReport || {})
  };
}

function createSecuritySummary(result = {}) {
  const manifests = toArray(result.remoteManifests);
  const remoteSurfaces = toArray(result.coreDocument && result.coreDocument.remoteSurfaces);
  const diagnostics = manifests.flatMap((manifest) => toArray(manifest.diagnostics));
  const status = manifests.some((manifest) => manifest.status === 'blocked') || diagnostics.some((diagnostic) => diagnostic.severity === 'error')
    ? 'blocked'
    : 'ready';

  return {
    status,
    trustBoundaries: Array.from(new Set(remoteSurfaces.map((surface) => surface.security && surface.security.trustBoundary).filter(Boolean))),
    capabilityMode: 'deny-by-default',
    hostAdapterRequired: true,
    kernelRemoteExecution: false,
    diagnostics: diagnostics.map((diagnostic) => ({
      code: diagnostic.code,
      severity: diagnostic.severity,
      message: diagnostic.message
    }))
  };
}

function analyzeRmtVNextRemoteToolingSource(input = {}, options = {}) {
  const compileResult = compileRmtVNextRemoteSource(input, options);
  const parserResult = compileResult.compilerResult && compileResult.compilerResult.parserResult;
  const sourceModel = parserResult && parserResult.sourceModel ? parserResult.sourceModel : createSourceModel(input);
  const ast = parserResult && parserResult.ast || null;
  const compilerDiagnostics = dedupeDiagnostics(toArray(compileResult.diagnostics));
  const authoringDiagnostics = createAuthoringDiagnostics(ast, sourceModel);
  const diagnostics = compilerDiagnostics
    .map((diagnostic) => normalizeDiagnostic(diagnostic, sourceModel))
    .concat(authoringDiagnostics);
  const summary = summarizeDiagnostics(diagnostics);
  const indexes = createRemoteIndexes(compileResult);
  const security = createSecuritySummary(compileResult);
  const ok = compileResult.ok === true && summary.errorCount === 0;

  return {
    schema: RMT_VNEXT_REMOTE_TOOLING_SCHEMA,
    reportSchema: RMT_VNEXT_REMOTE_TOOLING_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE,
    languageMode: 'rmt-vnext-remote',
    ok,
    status: ok ? 'ready' : 'blocked',
    phase: compileResult.phase,
    sourceModel,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    remoteCompilerSchema: RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
    remoteManifestSchema: RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
    remoteSurfaceSchema: RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
    enterpriseRegistrySchema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    enterpriseSurfaceSchema: RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
    crossSurfaceEventReportSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
    eventGovernanceReportSchema: RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA,
    degradationReportSchema: RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
    coreDocument: compileResult.coreDocument,
    coreBundle: compileResult.coreBundle || null,
    ast,
    remoteManifests: compileResult.remoteManifests || [],
    enterpriseRegistry: compileResult.enterpriseRegistry || null,
    crossSurfaceEventReport: compileResult.crossSurfaceEventReport || null,
    eventGovernanceReport: compileResult.eventGovernanceReport || null,
    degradationReport: compileResult.degradationReport || null,
    sourceMap: compileResult.coreDocument ? toArray(compileResult.coreDocument.sourceMap) : [],
    indexes,
    security,
    diagnostics,
    diagnosticSummary: summary,
    ruleCount: REMOTE_TOOLING_RULES.length,
    rules: REMOTE_TOOLING_RULES.slice(),
    compileResult
  };
}

function lintRmtVNextRemoteToolingSource(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextRemoteToolingSource(input, options);
  const summary = analysis.diagnosticSummary || summarizeDiagnostics(analysis.diagnostics);
  const status = summary.errorCount > 0 ? 'failed' : 'passed';

  return {
    schema: RMT_LINTER_REPORT_SCHEMA,
    engineSchema: RMT_VNEXT_REMOTE_TOOLING_SCHEMA,
    semanticGraphSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE,
    languageMode: 'rmt-vnext-remote',
    status,
    ok: status === 'passed',
    files: 1,
    providerCapabilities: ['completion', 'hover', 'symbols', 'remote-agent-report'],
    diagnostics: analysis.diagnostics,
    ruleCount: REMOTE_TOOLING_RULES.length,
    rules: REMOTE_TOOLING_RULES.slice(),
    indexes: analysis.indexes,
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
    source: input.source || RMT_VNEXT_REMOTE_TOOLING_SCHEMA,
    targetDomain: input.targetDomain || null,
    pointer: input.pointer || null,
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

function sortItems(items) {
  return items.slice().sort((left, right) => String(left.sortText || left.label).localeCompare(String(right.sortText || right.label)));
}

function inferCompletionContext(pointer, explicitContext) {
  if (explicitContext) return explicitContext;
  if (/\/events(?:\/|$)/u.test(pointer)) return 'remote-events';
  if (/\/exposes(?:\/|$)/u.test(pointer) || /shellTargets/u.test(pointer)) return 'remote-shell-targets';
  if (/\/remoteSurfaces(?:\/|$)/u.test(pointer)) return 'remote-surface-body';
  return 'remote-keywords';
}

function getRmtVNextRemoteToolingCompletions(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextRemoteToolingSource(input, options);
  const pointer = normalizeString(options.pointer || input.pointer);
  const context = inferCompletionContext(pointer, options.context);
  const prefix = normalizeString(options.prefix);
  let items = [];

  if (context === 'remote-event-body') {
    items = staticCompletionItems(REMOTE_EVENT_KEYWORDS, { kind: 'keyword', detail: 'Remote Event Clause' });
  } else if (context === 'remote-shell-targets') {
    items = staticCompletionItems(REMOTE_SHELL_TARGETS, { kind: 'reference', detail: 'Shell Scope' })
      .concat(analysis.indexes.shellTargets.map((entry, index) => createCompletionItem({
        label: entry.target,
        kind: 'reference',
        detail: 'Known Shell Target',
        documentation: `Used by ${entry.surfaceIds.length} surface(s).`,
        sortText: `100:${String(index).padStart(3, '0')}:${entry.target}`
      })));
  } else if (context === 'remote-events') {
    items = analysis.indexes.events.map((event, index) => createCompletionItem({
      label: event.event,
      kind: 'event',
      detail: event.owner && event.owner.id || 'remote event',
      documentation: `Version ${event.version || 'unknown'}, ${event.bindingCount} binding(s).`,
      sortText: `000:${String(index).padStart(3, '0')}:${event.event}`
    }));
  } else if (context === 'remote-snippets') {
    items = REMOTE_SNIPPETS.map((snippet, index) => createCompletionItem({
      label: snippet.label,
      insertText: snippet.body.join('\n'),
      kind: 'snippet',
      detail: snippet.prefix,
      documentation: snippet.description,
      sortText: `${String(index).padStart(3, '0')}:${snippet.label}`
    }));
  } else {
    items = staticCompletionItems(REMOTE_KEYWORDS, { kind: 'keyword', detail: 'Remote Surface Keyword' });
  }

  const filtered = prefix ? items.filter((item) => item.label.startsWith(prefix)) : items;

  return {
    schema: RMT_COMPLETION_REPORT_SCHEMA,
    providerSchema: RMT_COMPLETION_PROVIDER_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE,
    languageMode: 'rmt-vnext-remote',
    status: 'completed',
    ok: true,
    context,
    prefix,
    itemCount: filtered.length,
    items: sortItems(filtered),
    indexes: analysis.indexes
  };
}

function createHover(input = {}) {
  const lines = [input.title, input.documentation, input.detail].filter(Boolean);
  return {
    schema: RMT_HOVER_SCHEMA,
    kind: input.kind || 'remote-surface',
    title: input.title,
    markdown: lines.join('\n\n'),
    contents: lines,
    pointer: input.pointer || null,
    range: input.range || null,
    source: RMT_VNEXT_REMOTE_TOOLING_SCHEMA
  };
}

function sourceMapRange(analysis, pointer) {
  const exact = toArray(analysis.sourceMap).find((entry) => entry.corePointer === pointer);
  return exact && exact.range || null;
}

function getRmtVNextRemoteToolingHover(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextRemoteToolingSource(input, options);
  const pointer = normalizeString(options.pointer || input.pointer);
  const remoteMatch = pointer.match(/^\/remoteSurfaces\/(\d+)/u);
  let hover = null;

  if (remoteMatch) {
    const remote = toArray(analysis.coreDocument && analysis.coreDocument.remoteSurfaces)[Number(remoteMatch[1])];
    if (remote) {
      hover = createHover({
        kind: 'remote-surface',
        title: `Remote Surface: ${remote.name}`,
        documentation: `Owner ${remote.owner && remote.owner.id || 'unowned'} loads ${remote.remote && remote.remote.id || 'unknown'} through a host-owned adapter boundary.`,
        detail: `Fallback: ${remote.fallback && remote.fallback.ref || 'missing'} | Trust Boundary: ${remote.security && remote.security.trustBoundary || 'missing'}`,
        pointer,
        range: sourceMapRange(analysis, `/remoteSurfaces/${Number(remoteMatch[1])}`)
      });
    }
  } else if (pointer.startsWith('/events')) {
    const event = analysis.indexes.events[0];
    if (event) {
      hover = createHover({
        kind: 'remote-event',
        title: `Remote Event: ${event.event}`,
        documentation: `Owner ${event.owner && event.owner.id || 'unowned'}, status ${event.status}.`,
        detail: `${event.bindingCount} binding(s), scopes: ${event.scopes.map((scope) => `${scope.type}:${scope.ref}`).join(', ')}`,
        pointer
      });
    }
  }

  return {
    schema: RMT_HOVER_REPORT_SCHEMA,
    providerSchema: RMT_HOVER_PROVIDER_SCHEMA,
    hoverSchema: RMT_HOVER_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE,
    languageMode: 'rmt-vnext-remote',
    status: hover ? 'found' : 'not_found',
    ok: !!hover,
    pointer,
    hover
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

function getRmtVNextRemoteToolingDocumentSymbols(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextRemoteToolingSource(input, options);
  const remoteSurfaceChildren = analysis.indexes.remoteSurfaces.map((surface) => createDocumentSymbol({
    name: surface.name,
    kind: 'namespace',
    detail: surface.remote && surface.remote.id || surface.id,
    pointer: surface.pointer,
    range: sourceMapRange(analysis, surface.pointer)
  }));
  const eventChildren = analysis.indexes.events.map((event) => createDocumentSymbol({
    name: event.event,
    kind: 'event',
    detail: event.owner && event.owner.id || 'unowned',
    pointer: `/events/${event.event}`
  }));
  const shellTargetChildren = analysis.indexes.shellTargets.map((target) => createDocumentSymbol({
    name: target.target,
    kind: 'interface',
    detail: `${target.surfaceIds.length} surface(s)`,
    pointer: `/shellTargets/${target.target}`
  }));
  const symbols = [
    createDocumentSymbol({
      name: 'remoteSurfaces',
      kind: 'namespace',
      detail: 'Remote Surface Records',
      pointer: '/remoteSurfaces',
      children: remoteSurfaceChildren
    }),
    createDocumentSymbol({
      name: 'crossSurfaceEvents',
      kind: 'namespace',
      detail: 'Remote Event Protocol Records',
      pointer: '/events',
      children: eventChildren
    }),
    createDocumentSymbol({
      name: 'shellTargets',
      kind: 'namespace',
      detail: 'Shell Scope Targets',
      pointer: '/shellTargets',
      children: shellTargetChildren
    })
  ].filter((symbol) => symbol.children.length > 0);

  return {
    schema: RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA,
    providerSchema: RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA,
    symbolSchema: RMT_DOCUMENT_SYMBOL_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE,
    languageMode: 'rmt-vnext-remote',
    status: analysis.ok ? 'completed' : 'blocked',
    ok: analysis.ok,
    symbolCount: symbols.length,
    symbols
  };
}

function createRmtVNextRemoteAgentReport(input = {}, options = {}) {
  const analysis = options.analysis || analyzeRmtVNextRemoteToolingSource(input, options);
  const registry = analysis.enterpriseRegistry || {};
  const degradation = analysis.degradationReport || {};
  const security = analysis.security;

  return {
    schema: RMT_VNEXT_REMOTE_AGENT_REPORT_SCHEMA,
    toolingSchema: RMT_VNEXT_REMOTE_TOOLING_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE,
    status: analysis.ok ? 'ready' : 'needs_attention',
    ok: analysis.ok,
    registry: {
      schema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
      status: registry.status || 'unavailable',
      surfaceCount: registry.surfaceCount || 0,
      remoteSurfaceCount: registry.remoteSurfaceCount || 0,
      ownerIds: registry.discoverability && registry.discoverability.ownerIds || [],
      shellTargets: registry.discoverability && registry.discoverability.shellTargets || []
    },
    security,
    degradation: {
      schema: RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
      status: degradation.status || 'unavailable',
      stateCounts: degradation.stateCounts || {},
      blockedSurfaceIds: degradation.blockedSurfaceIds || [],
      degradedSurfaceIds: degradation.degradedSurfaceIds || []
    },
    diagnostics: analysis.diagnostics,
    repairs: analysis.diagnostics.map((diagnostic) => diagnostic.repair).filter(Boolean),
    handoffHints: analysis.ok
      ? ['Remote Authoring ist reviewbar; naechster Pfad: WP-E16-10 Compatibility oder WP-E16-11 Fixtures.']
      : ['Behebe Owner, Integrity, Fallback, Event Direction und Payload Diagnostics vor Runtime-Handoff.']
  };
}

function createRmtVNextRemoteToolingAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_REMOTE_TOOLING_SCHEMA,
    reportSchema: RMT_VNEXT_REMOTE_TOOLING_REPORT_SCHEMA,
    agentReportSchema: RMT_VNEXT_REMOTE_AGENT_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE,
    analyze: (input = {}, options = {}) => analyzeRmtVNextRemoteToolingSource(input, { ...defaultOptions, ...options }),
    lint: (input = {}, options = {}) => lintRmtVNextRemoteToolingSource(input, { ...defaultOptions, ...options }),
    complete: (input = {}, options = {}) => getRmtVNextRemoteToolingCompletions(input, { ...defaultOptions, ...options }),
    hover: (input = {}, options = {}) => getRmtVNextRemoteToolingHover(input, { ...defaultOptions, ...options }),
    documentSymbols: (input = {}, options = {}) => getRmtVNextRemoteToolingDocumentSymbols(input, { ...defaultOptions, ...options }),
    agentReport: (input = {}, options = {}) => createRmtVNextRemoteAgentReport(input, { ...defaultOptions, ...options })
  });
}

module.exports = {
  REMOTE_KEYWORDS,
  REMOTE_SHELL_TARGETS,
  REMOTE_SNIPPETS,
  REMOTE_TOOLING_EVENT_DIRECTION_MISSING_CODE,
  REMOTE_TOOLING_PAYLOAD_SHAPE_MISSING_CODE,
  REMOTE_TOOLING_RULES,
  RMT_VNEXT_REMOTE_AGENT_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_TOOLING_CONTRACT_PATH,
  RMT_VNEXT_REMOTE_TOOLING_MODULE_PATH,
  RMT_VNEXT_REMOTE_TOOLING_PACKAGE_SCRIPT,
  RMT_VNEXT_REMOTE_TOOLING_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_TOOLING_SCHEMA,
  RMT_VNEXT_REMOTE_TOOLING_SUITE_PATH,
  RMT_VNEXT_REMOTE_TOOLING_WORKPACKAGE,
  RMT_VNEXT_REMOTE_TOOLING_WP_PATH,
  analyzeRmtVNextRemoteToolingSource,
  createRmtVNextRemoteAgentReport,
  createRmtVNextRemoteToolingAdapter,
  getRmtVNextRemoteToolingCompletions,
  getRmtVNextRemoteToolingDocumentSymbols,
  getRmtVNextRemoteToolingHover,
  lintRmtVNextRemoteToolingSource
};
