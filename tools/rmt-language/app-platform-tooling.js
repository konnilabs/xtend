const fs = require('fs');
const path = require('path');
const {
  createRmtParser
} = require('./parser');
const {
  getRmtCompletions
} = require('./completions');
const {
  getRmtHover
} = require('./hover');

const RMT_APP_PLATFORM_TOOLING_SCHEMA = 'xtend.epic18.rmt-app-platform-tooling.v1';
const RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA = 'xtend.epic18.rmt-app-platform-tooling-report.v1';
const RMT_APP_PLATFORM_SCAFFOLD_SCHEMA = 'xtend.epic18.rmt-app-platform-scaffold.v1';
const RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA = 'xtend.epic18.rmt-app-platform-source-map.v1';
const RMT_DOWNSTREAM_NO_MANUAL_HTML_GATE_SCHEMA = 'xtend.mm-rmt.downstream-no-manual-html-gate.v1';
const RMT_APP_PLATFORM_TOOLING_WORKPACKAGE = 'WP-E18-11';
const RMT_APP_PLATFORM_TOOLING_MODULE_PATH = 'tools/rmt-language/app-platform-tooling.js';
const RMT_APP_PLATFORM_TOOLING_SUITE_PATH = 'tests/rmt-language/rmt_app_platform_tooling_suite.js';
const RMT_APP_PLATFORM_TOOLING_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-app-platform-tooling --json';
const RMT_APP_PLATFORM_TOOLING_PACKAGE_SCRIPT = 'npm run test:rmt-app-platform-tooling';

const RMT_APP_PLATFORM_DIAGNOSTIC_CODES = Object.freeze({
  manualHtmlSink: 'rmt.app.no-manual-shell.html-sink',
  unsafeHtmlBoundary: 'rmt.app.unsafe-html.boundary-missing',
  unkeyedRepeat: 'rmt.app.repeat.key.missing',
  untypedEvent: 'rmt.app.event.payload-contract.missing',
  missingResourceOwnership: 'rmt.app.resource.ownership.missing',
  unresolvedResource: 'rmt.app.resource.unresolved',
  unresolvedPortal: 'rmt.app.portal.unresolved',
  unresolvedSurfaceSource: 'rmt.app.surface.source.unresolved'
});
const DOWNSTREAM_HTML_SINK_PATTERN = /\binnerHTML\s*=|\bouterHTML\s*=|\binsertAdjacentHTML\s*\(|\bdocument\.write\s*\(/gu;
const DEFAULT_DOWNSTREAM_HTML_GATE_ALLOWED_FILES = Object.freeze([
  'components/xplayer.js'
]);

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeFilePath(value) {
  return String(value == null ? '' : value).replace(/\\/g, '/');
}

function escapePointerSegment(value) {
  return String(value).replace(/~/g, '~0').replace(/\//g, '~1');
}

function joinPointer(...segments) {
  return `/${segments.map(escapePointerSegment).join('/')}`;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function resourceRefs(value) {
  return toArray(value)
    .map((entry) => typeof entry === 'string' ? entry : normalizeString(entry && entry.id))
    .filter(Boolean);
}

function sourceRange(sourceModel, pointer, target = 'value') {
  if (!sourceModel || !pointer || typeof sourceModel.findJsonPointerRange !== 'function') {
    return sourceModel && typeof sourceModel.lineRange === 'function' ? sourceModel.lineRange(0) : null;
  }
  const pointerRange = sourceModel.findJsonPointerRange(pointer, { target });
  return pointerRange ? pointerRange.range : (typeof sourceModel.lineRange === 'function' ? sourceModel.lineRange(0) : null);
}

function createDiagnostic(context, input = {}) {
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: 'rmt-app-platform-tooling',
    code: input.code,
    ruleId: input.ruleId || 'rmt.app-platform-tooling',
    severity: input.severity || 'error',
    category: input.category || 'app-platform',
    message: input.message || input.code,
    uri: context.sourceModel ? context.sourceModel.uri : null,
    file: context.sourceModel ? context.sourceModel.filePath : null,
    pointer: input.pointer || null,
    range: input.range || sourceRange(context.sourceModel, input.pointer, input.target || 'value'),
    workpackage: RMT_APP_PLATFORM_TOOLING_WORKPACKAGE,
    repair: input.repair || null,
    relatedInformation: input.relatedInformation || []
  };
}

function lineColumnAt(text, index) {
  const lines = String(text || '').slice(0, index).split(/\r?\n/u);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

function shouldAllowManualHtmlFile(filePath, options = {}) {
  const normalized = normalizeFilePath(filePath);
  const allowedFiles = new Set(DEFAULT_DOWNSTREAM_HTML_GATE_ALLOWED_FILES.concat(toArray(options.allowedFiles).map(normalizeFilePath)));
  if (allowedFiles.has(normalized)) return true;
  return toArray(options.allowedPatterns).some((pattern) => {
    if (typeof pattern === 'string') return normalized.includes(pattern);
    return pattern && typeof pattern.test === 'function' ? pattern.test(normalized) : false;
  });
}

function scanDownstreamManualHtmlSinks(text, metadata = {}, options = {}) {
  const filePath = normalizeFilePath(metadata.filePath || metadata.file || 'virtual-downstream.js');
  if (shouldAllowManualHtmlFile(filePath, options)) return [];
  const source = String(text || '');
  const diagnostics = [];
  DOWNSTREAM_HTML_SINK_PATTERN.lastIndex = 0;
  let match = DOWNSTREAM_HTML_SINK_PATTERN.exec(source);
  while (match) {
    const position = lineColumnAt(source, match.index);
    diagnostics.push({
      schema: 'xtend.rmt.linter.diagnostic.v1',
      source: 'rmt-downstream-no-manual-html-gate',
      code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.manualHtmlSink,
      ruleId: 'rmt.downstream.no-manual-html',
      severity: 'error',
      category: 'security',
      message: 'Downstream RMT Shell UI darf keine manuellen HTML-Sinks verwenden.',
      file: filePath,
      range: {
        start: position,
        end: {
          line: position.line,
          column: position.column + match[0].length
        }
      },
      sink: match[0].replace(/\s*$/u, ''),
      repair: {
        kind: 'replace-with-rmt-dom-descriptor',
        title: 'DOM Descriptor, Surface Island oder Trusted-DOM-Boundary verwenden',
        safe: false
      }
    });
    match = DOWNSTREAM_HTML_SINK_PATTERN.exec(source);
  }
  return diagnostics;
}

function createDownstreamNoManualHtmlGate(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_DOWNSTREAM_NO_MANUAL_HTML_GATE_SCHEMA,
    scanText(text, metadata = {}, options = {}) {
      return scanDownstreamManualHtmlSinks(text, metadata, { ...defaultOptions, ...options });
    },
    scanFiles(files = {}, options = {}) {
      return Object.entries(toObject(files)).flatMap(([filePath, text]) => scanDownstreamManualHtmlSinks(text, { filePath }, { ...defaultOptions, ...options }));
    },
    analyze(input = {}, options = {}) {
      return analyzeDownstreamNoManualHtml(input, { ...defaultOptions, ...options });
    }
  });
}

function parseSource(input = {}, options = {}) {
  if (input.document && typeof input.document === 'object') {
    const text = `${JSON.stringify(input.document, null, 2)}\n`;
    const parserResult = createRmtParser(options).parseSource({
      text,
      filePath: input.filePath || input.uri || 'virtual-app-platform.rmt',
      version: input.version || 1
    }, options);
    return {
      ok: true,
      document: input.document,
      sourceModel: parserResult.sourceModel || null,
      diagnostics: []
    };
  }

  let parserInput = input;
  if (
    typeof input.text === 'string'
    && !input.text.trimStart().startsWith('{')
    && typeof input.filePath === 'string'
    && input.filePath.endsWith('.rmt')
  ) {
    const sidecarPath = input.filePath.replace(/\.rmt$/u, '.core.json');
    if (fs.existsSync(sidecarPath)) {
      parserInput = {
        ...input,
        text: fs.readFileSync(sidecarPath, 'utf8'),
        filePath: sidecarPath,
        uri: undefined
      };
    }
  }

  const parserResult = createRmtParser(options).parseSource(parserInput, options);
  if (!parserResult.ok) {
    return {
      ok: false,
      document: null,
      sourceModel: parserResult.sourceModel || null,
      diagnostics: parserResult.diagnostics || []
    };
  }

  return {
    ok: true,
    document: parserResult.rawDocument,
    sourceModel: parserResult.sourceModel || null,
    diagnostics: parserResult.diagnostics || []
  };
}

function idSet(records) {
  return new Set(toArray(records).map((record) => normalizeString(record && record.id)).filter(Boolean));
}

function createIndexes(document) {
  const records = toObject(document.records);
  const recordSources = new Set(Object.keys(records));
  const dataSourceIds = idSet(document.dataSources || document.datasources);
  const stateIds = idSet(document.state || document.states);
  return {
    resources: idSet(document.resources),
    portals: idSet(document.portals),
    surfaces: idSet(document.surfaces),
    overlays: idSet(document.overlays),
    events: idSet(document.events),
    actions: idSet(document.actions),
    dataSources: dataSourceIds,
    state: stateIds,
    recordSources
  };
}

function createToolingGraph(input = {}, options = {}) {
  const parsed = parseSource(input, options);
  const document = parsed.ok && parsed.document && typeof parsed.document === 'object' ? parsed.document : {};
  const listCompletions = (domain) => toArray(document[domain]).map((record, index) => ({
    label: normalizeString(record && record.id) || `${domain}.${index}`,
    insertText: normalizeString(record && record.id) || `${domain}.${index}`,
    detail: `${domain} reference`,
    pointer: joinPointer(domain, index),
    range: sourceRange(parsed.sourceModel, joinPointer(domain, index))
  }));

  return {
    status: parsed.ok ? 'indexed' : 'source_unavailable',
    sourceDocument: document,
    sourceModel: parsed.sourceModel || null,
    manifestHints: toObject(toObject(document.manifest).metadata),
    catalogHints: {},
    listCompletions,
    findReferenceAtPointer() {
      return null;
    },
    getDefinitionForReference() {
      return null;
    }
  };
}

function hasTrustBoundary(record) {
  const security = toObject(record.security);
  const metadata = toObject(record.metadata);
  return Boolean(security.trustBoundary
    || security.trustedDomBoundary
    || metadata.trustBoundary
    || metadata.trustedDomBoundary
    || metadata.sanitizer);
}

function walkHtmlSinks(context, value, pointer, diagnostics) {
  if (typeof value === 'string') {
    if (/\b(root|element|template)\.innerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\b|\bdocument\.write\b/u.test(value)) {
      diagnostics.push(createDiagnostic(context, {
        code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.manualHtmlSink,
        severity: 'error',
        category: 'security',
        message: 'Normale RMT App UI darf keine manuellen HTML-Sinks verwenden.',
        pointer,
        repair: {
          kind: 'replace-with-dom-descriptor',
          title: 'DOM Descriptor oder Component Template statt HTML-Sink verwenden',
          safe: false
        }
      }));
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkHtmlSinks(context, entry, `${pointer}/${index}`, diagnostics));
    return;
  }

  if (!value || typeof value !== 'object') return;

  Object.entries(value).forEach(([key, entry]) => {
    const childPointer = `${pointer}/${escapePointerSegment(key)}`;
    if (/^(innerHTML|outerHTML|insertAdjacentHTML|document\.write)$/u.test(key)) {
      diagnostics.push(createDiagnostic(context, {
        code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.manualHtmlSink,
        severity: 'error',
        category: 'security',
        message: `HTML-Sink "${key}" ist in normaler App-UI nicht erlaubt.`,
        pointer: childPointer,
        repair: {
          kind: 'replace-with-dom-descriptor',
          title: 'Structured Template Node verwenden',
          safe: false
        }
      }));
    }
    walkHtmlSinks(context, entry, childPointer, diagnostics);
  });
}

function collectSourceMapEntries(document, sourceModel) {
  const domains = ['surfaces', 'overlays', 'portals', 'resources', 'events', 'actions', 'dataSources', 'state', 'selectors'];
  return domains.flatMap((domain) => toArray(document[domain]).map((record, index) => {
    const pointer = joinPointer(domain, index);
    return {
      domain,
      id: normalizeString(record && record.id) || `${domain}.${index}`,
      pointer,
      range: sourceRange(sourceModel, pointer),
      capabilities: Object.keys(toObject(record)).sort()
    };
  }));
}

function lintAppPlatformDocument(document, context) {
  const diagnostics = [];
  const indexes = createIndexes(document);
  const ownedResources = new Set();

  walkHtmlSinks(context, {
    components: document.components,
    templates: document.templates,
    surfaces: document.surfaces,
    overlays: document.overlays
  }, '', diagnostics);

  toArray(document.templates).forEach((template, index) => {
    const pointer = joinPointer('templates', index);
    const html = normalizeString(template && (template.html || template.fragment || template.content));
    const mode = normalizeString(template && template.mode);
    if (html && /<\s*[a-z][\s\S]*>/iu.test(html) && mode !== 'html_fragment' && !hasTrustBoundary(template)) {
      diagnostics.push(createDiagnostic(context, {
        code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.unsafeHtmlBoundary,
        severity: 'warning',
        category: 'security',
        message: 'HTML-Inhalt braucht eine explizite Trusted-DOM-Boundary oder muss als DOM Descriptor modelliert werden.',
        pointer
      }));
    }
  });

  toArray(document.surfaces).forEach((surface, index) => {
    const pointer = joinPointer('surfaces', index);
    const sourceId = normalizeString(surface && (surface.source || surface.from));
    const repeated = surface && (surface.repeat === true || sourceId || Array.isArray(surface.records));
    if (repeated && !normalizeString(surface.key || surface.keyPath)) {
      diagnostics.push(createDiagnostic(context, {
        code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.unkeyedRepeat,
        severity: 'error',
        category: 'state',
        message: `Surface "${surface && surface.id ? surface.id : index}" wiederholt Records ohne stabilen key.`,
        pointer
      }));
    }

    if (sourceId && !indexes.recordSources.has(sourceId) && !indexes.dataSources.has(sourceId) && !indexes.state.has(sourceId)) {
      diagnostics.push(createDiagnostic(context, {
        code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.unresolvedSurfaceSource,
        severity: 'warning',
        category: 'references',
        message: `Surface Source "${sourceId}" ist weder records, datasource noch state.`,
        pointer: `${pointer}/source`
      }));
    }

    const portalId = normalizeString(surface && surface.portal);
    if (portalId && !indexes.portals.has(portalId)) {
      diagnostics.push(createDiagnostic(context, {
        code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.unresolvedPortal,
        severity: 'error',
        category: 'references',
        message: `Surface Portal "${portalId}" ist nicht definiert.`,
        pointer: `${pointer}/portal`
      }));
    }

    const refs = resourceRefs(surface && surface.resources);
    refs.forEach((resourceId, resourceIndex) => {
      ownedResources.add(resourceId);
      if (!indexes.resources.has(resourceId)) {
        diagnostics.push(createDiagnostic(context, {
          code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.unresolvedResource,
          severity: 'error',
          category: 'references',
          message: `Surface Resource "${resourceId}" ist nicht definiert.`,
          pointer: `${pointer}/resources/${resourceIndex}`
        }));
      }
    });
    if (refs.length > 0 && !normalizeString(surface.owner || surface.ownerId)) {
      diagnostics.push(createDiagnostic(context, {
        code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.missingResourceOwnership,
        severity: 'warning',
        category: 'lifecycle',
        message: `Surface "${surface && surface.id ? surface.id : index}" nutzt Ressourcen ohne expliziten owner.`,
        pointer,
        repair: {
          kind: 'add-owner-template',
          title: 'owner auf "$instance.id" setzen',
          safe: true
        }
      }));
    }
  });

  toArray(document.overlays).forEach((overlay, index) => {
    const pointer = joinPointer('overlays', index);
    const portalId = normalizeString(overlay && overlay.portal);
    if (portalId && !indexes.portals.has(portalId)) {
      diagnostics.push(createDiagnostic(context, {
        code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.unresolvedPortal,
        severity: 'error',
        category: 'references',
        message: `Overlay Portal "${portalId}" ist nicht definiert.`,
        pointer: `${pointer}/portal`
      }));
    }
    resourceRefs(overlay && overlay.resources).forEach((resourceId, resourceIndex) => {
      ownedResources.add(resourceId);
      if (!indexes.resources.has(resourceId)) {
        diagnostics.push(createDiagnostic(context, {
          code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.unresolvedResource,
          severity: 'error',
          category: 'references',
          message: `Overlay Resource "${resourceId}" ist nicht definiert.`,
          pointer: `${pointer}/resources/${resourceIndex}`
        }));
      }
    });
  });

  toArray(document.actions).forEach((action, index) => {
    resourceRefs(action && action.resources).forEach((resourceId, resourceIndex) => {
      ownedResources.add(resourceId);
      if (!indexes.resources.has(resourceId)) {
        diagnostics.push(createDiagnostic(context, {
          code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.unresolvedResource,
          severity: 'error',
          category: 'references',
          message: `Action Resource "${resourceId}" ist nicht definiert.`,
          pointer: joinPointer('actions', index, 'resources', resourceIndex)
        }));
      }
    });
  });

  toArray(document.events).forEach((event, index) => {
    const pointer = joinPointer('events', index);
    if (normalizeString(event && event.action) && !event.payloadContract && !event.contract) {
      diagnostics.push(createDiagnostic(context, {
        code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.untypedEvent,
        severity: 'error',
        category: 'events',
        message: `Event "${event && event.id ? event.id : index}" routet eine Action ohne Payload Contract.`,
        pointer
      }));
    }
  });

  toArray(document.resources).forEach((resource, index) => {
    const id = normalizeString(resource && resource.id);
    if (id && !ownedResources.has(id) && !normalizeString(resource.owner)) {
      diagnostics.push(createDiagnostic(context, {
        code: RMT_APP_PLATFORM_DIAGNOSTIC_CODES.missingResourceOwnership,
        severity: 'warning',
        category: 'lifecycle',
        message: `Resource "${id}" hat keinen deklarativen Owner und wird von keiner Surface, Action oder Overlay referenziert.`,
        pointer: joinPointer('resources', index)
      }));
    }
  });

  return diagnostics;
}

function analyzeRmtAppPlatformSource(input = {}, options = {}) {
  const parsed = parseSource(input, options);
  const context = {
    sourceModel: parsed.sourceModel
  };
  const parserDiagnostics = toArray(parsed.diagnostics);
  if (!parsed.ok) {
    const summary = {
      totalCount: parserDiagnostics.length,
      errorCount: parserDiagnostics.filter((entry) => entry.severity === 'error').length,
      warningCount: parserDiagnostics.filter((entry) => entry.severity === 'warning').length
    };
    return {
      schema: RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA,
      toolingSchema: RMT_APP_PLATFORM_TOOLING_SCHEMA,
      workpackage: RMT_APP_PLATFORM_TOOLING_WORKPACKAGE,
      status: 'failed',
      ok: false,
      diagnostics: parserDiagnostics,
      summary,
      sourceMap: {
        schema: RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA,
        entries: [],
        totalCount: 0
      }
    };
  }

  const document = parsed.document || {};
  const diagnostics = parserDiagnostics.concat(lintAppPlatformDocument(document, context));
  const sourceMapEntries = collectSourceMapEntries(document, parsed.sourceModel);
  const errorCount = diagnostics.filter((entry) => entry.severity === 'error').length;
  const warningCount = diagnostics.filter((entry) => entry.severity === 'warning').length;
  const summary = {
    totalCount: diagnostics.length,
    errorCount,
    warningCount,
    infoCount: diagnostics.filter((entry) => entry.severity === 'info').length
  };

  return {
    schema: RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA,
    toolingSchema: RMT_APP_PLATFORM_TOOLING_SCHEMA,
    workpackage: RMT_APP_PLATFORM_TOOLING_WORKPACKAGE,
    status: errorCount > 0 ? 'failed' : 'passed',
    ok: errorCount === 0,
    manifest: toObject(toObject(document.manifest).metadata),
    diagnostics,
    summary,
    sourceMap: {
      schema: RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA,
      entries: sourceMapEntries,
      totalCount: sourceMapEntries.length,
      byDomain: sourceMapEntries.reduce((counts, entry) => {
        counts[entry.domain] = (counts[entry.domain] || 0) + 1;
        return counts;
      }, {})
    },
    capabilities: {
      surfaceCount: toArray(document.surfaces).length,
      overlayCount: toArray(document.overlays).length,
      portalCount: toArray(document.portals).length,
      resourceCount: toArray(document.resources).length,
      eventCount: toArray(document.events).length,
      actionCount: toArray(document.actions).length
    }
  };
}

function analyzeDownstreamNoManualHtml(input = {}, options = {}) {
  const files = input.files || input.sources || input;
  const diagnostics = Object.entries(toObject(files)).flatMap(([filePath, text]) => scanDownstreamManualHtmlSinks(text, { filePath }, options));
  const errorCount = diagnostics.filter((entry) => entry.severity === 'error').length;
  return {
    schema: RMT_DOWNSTREAM_NO_MANUAL_HTML_GATE_SCHEMA,
    status: errorCount > 0 ? 'failed' : 'passed',
    ok: errorCount === 0,
    acceptanceNames: ['rmt:check', 'check:syntax'],
    diagnostics,
    summary: {
      totalCount: diagnostics.length,
      errorCount,
      warningCount: diagnostics.filter((entry) => entry.severity === 'warning').length
    }
  };
}

function createRmtAppPlatformScaffoldPlan(input = {}, options = {}) {
  const sourcePath = input.source || input.src || input.filePath || 'app.rmt';
  const analysis = analyzeRmtAppPlatformSource(input, options);
  const baseName = path.posix.basename(String(sourcePath), '.rmt');
  const sourceDir = path.posix.dirname(String(sourcePath));
  const prefix = sourceDir === '.' ? '.xtend-build' : `${sourceDir}/.xtend-build`;
  const diagnosticsPath = `${prefix}/${baseName}.app-platform-diagnostics.json`;
  const sourceMapPath = `${prefix}/${baseName}.app-platform-source-map.json`;
  const reportPath = `${prefix}/${baseName}.app-platform-scaffold.json`;
  const outputs = [
    {
      id: 'diagnostics',
      path: diagnosticsPath,
      kind: 'rmt-app-platform-diagnostics',
      generated: true,
      content: `${JSON.stringify(analysis, null, 2)}\n`
    },
    {
      id: 'source-map',
      path: sourceMapPath,
      kind: 'rmt-app-platform-source-map',
      generated: true,
      content: `${JSON.stringify(analysis.sourceMap, null, 2)}\n`
    },
    {
      id: 'scaffold-report',
      path: reportPath,
      kind: 'rmt-app-platform-scaffold-report',
      generated: true,
      content: ''
    }
  ];
  const report = {
    schema: RMT_APP_PLATFORM_SCAFFOLD_SCHEMA,
    toolingSchema: RMT_APP_PLATFORM_TOOLING_SCHEMA,
    workpackage: RMT_APP_PLATFORM_TOOLING_WORKPACKAGE,
    status: analysis.ok ? 'planned' : 'blocked',
    ok: analysis.ok,
    source: sourcePath,
    localGate: RMT_APP_PLATFORM_TOOLING_LOCAL_GATE,
    generated: {
      diagnostics: diagnosticsPath,
      sourceMap: sourceMapPath,
      report: reportPath
    },
    outputCount: outputs.length,
    diagnosticSummary: analysis.summary,
    sourceMapSummary: {
      totalCount: analysis.sourceMap.totalCount,
      byDomain: analysis.sourceMap.byDomain
    },
    checks: [
      'no-manual-shell-html-sinks',
      'keyed-surface-repeaters',
      'typed-events',
      'resource-ownership',
      'portal-reference-resolution',
      'source-map-for-surface-overlay-resource-events'
    ]
  };
  outputs[2].content = `${JSON.stringify(report, null, 2)}\n`;

  return {
    schema: RMT_APP_PLATFORM_SCAFFOLD_SCHEMA,
    ok: analysis.ok,
    status: report.status,
    source: sourcePath,
    report,
    diagnostics: analysis.diagnostics,
    sourceMap: analysis.sourceMap,
    outputs
  };
}

function getRmtAppPlatformCompletions(input = {}, options = {}) {
  return getRmtCompletions(input, {
    ...options,
    graph: options.graph || createToolingGraph(input, options)
  });
}

function getRmtAppPlatformHover(input = {}, options = {}) {
  return getRmtHover(input, {
    ...options,
    graph: options.graph || createToolingGraph(input, options)
  });
}

module.exports = {
  RMT_APP_PLATFORM_DIAGNOSTIC_CODES,
  RMT_APP_PLATFORM_SCAFFOLD_SCHEMA,
  RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA,
  RMT_APP_PLATFORM_TOOLING_LOCAL_GATE,
  RMT_APP_PLATFORM_TOOLING_MODULE_PATH,
  RMT_APP_PLATFORM_TOOLING_PACKAGE_SCRIPT,
  RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA,
  RMT_APP_PLATFORM_TOOLING_SCHEMA,
  RMT_APP_PLATFORM_TOOLING_SUITE_PATH,
  RMT_APP_PLATFORM_TOOLING_WORKPACKAGE,
  RMT_DOWNSTREAM_NO_MANUAL_HTML_GATE_SCHEMA,
  analyzeDownstreamNoManualHtml,
  analyzeRmtAppPlatformSource,
  createDownstreamNoManualHtmlGate,
  createRmtAppPlatformScaffoldPlan,
  getRmtAppPlatformCompletions,
  getRmtAppPlatformHover,
  lintAppPlatformDocument
};
