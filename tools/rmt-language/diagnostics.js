const {
  RMT_FILE_FALLBACK_CODE
} = require('./parser');
const {
  RMT_SEMANTIC_GRAPH_SCHEMA,
  buildSemanticGraph
} = require('./semantic-graph');
const {
  getDefaultRmtLinterRules
} = require('./rules');
const {
  isLikelyRmtVNextSource,
  lintRmtVNextToolingSource
} = require('./vnext-tooling');

const RMT_LINTER_RULE_ENGINE_SCHEMA = 'xtend.rmt.linter.rule-engine.v1';
const RMT_LINTER_REPORT_SCHEMA = 'xtend.rmt.linter.report.v1';
const RMT_LINTER_DIAGNOSTIC_SCHEMA = 'xtend.rmt.linter.diagnostic.v1';
const RMT_LINTER_WORKPACKAGE = 'WP-E14-05';
const RMT_LINTER_DIAGNOSTICS_MODULE_PATH = 'tools/rmt-language/diagnostics.js';
const RMT_LINTER_RULES_DIR = 'tools/rmt-language/rules';
const RMT_LINTER_SUITE_PATH = 'tests/rmt-language/rmt_linter_rules_suite.js';
const RMT_LINTER_PACKAGE_SCRIPT = 'npm run test:rmt-linter-rules';

const SEVERITY_ORDER = {
  error: 0,
  warning: 1,
  info: 2,
  hint: 3
};

const DEFAULT_ALLOWED_TOP_LEVEL_DOMAINS = Object.freeze([
  'kind',
  'version',
  'schema',
  'manifest',
  'adapters',
  'components',
  'routes',
  'schedules',
  'surfaces',
  'portals',
  'overlays',
  'slots',
  'state',
  'states',
  'selectors',
  'dataSources',
  'datasources',
  'actions',
  'effects',
  'resources',
  'events',
  'validations',
  'animations',
  'transitions',
  'collectionViews',
  'commandSources',
  'searchSources',
  'securityPolicies',
  'records',
  'templates',
  'diagnostics',
  'extensionSlots',
  'sourceMap',
  'acceptance',
  'metadata'
]);

const DIAGNOSTIC_CATALOG = Object.freeze({
  'rmt.syntax.invalid-json': {
    severity: 'error',
    category: 'syntax',
    repair: { kind: 'replace-field-value', title: 'JSON-Struktur korrigieren', safe: false }
  },
  'rmt.document.kind.missing': {
    severity: 'error',
    category: 'document',
    repair: { kind: 'add-document-kind', title: 'kind: "rmt_document" ergaenzen', safe: true }
  },
  [RMT_FILE_FALLBACK_CODE]: {
    severity: 'warning',
    category: 'file-policy',
    repair: { kind: 'rename-file-extension', title: 'Datei nach .rmt umbenennen', safe: true }
  },
  'rmt.domain.unknown': {
    severity: 'error',
    category: 'schema',
    repair: { kind: 'replace-field-value', title: 'Unbekannte Top-Level-Domain entfernen oder registrieren', safe: false }
  },
  'rmt.domain.required.missing': {
    severity: 'warning',
    category: 'schema',
    repair: { kind: 'replace-field-value', title: 'Produktive RMT-Domain ergaenzen', safe: true }
  },
  'rmt.id.missing': {
    severity: 'error',
    category: 'identity',
    repair: { kind: 'replace-field-value', title: 'Stabile ID setzen', safe: true }
  },
  'rmt.id.duplicate': {
    severity: 'error',
    category: 'identity',
    repair: { kind: 'replace-field-value', title: 'ID umbenennen oder Referenzen zusammenfuehren', safe: false }
  },
  'rmt.adapter.unknown': {
    severity: 'error',
    category: 'references',
    repair: { kind: 'create-adapter', title: 'Adapter Record anlegen oder ID korrigieren', safe: true }
  },
  'rmt.ref.component.unresolved': {
    severity: 'error',
    category: 'references',
    repair: { kind: 'create-component-stub', title: 'Component Record anlegen oder Ref korrigieren', safe: true }
  },
  'rmt.ref.template.unresolved': {
    severity: 'error',
    category: 'references',
    repair: { kind: 'create-template-stub', title: 'Template Record anlegen oder Ref korrigieren', safe: true }
  },
  'rmt.ref.schedule.unresolved': {
    severity: 'error',
    category: 'references',
    repair: { kind: 'create-schedule', title: 'Schedule Record anlegen oder Ref korrigieren', safe: true }
  },
  'rmt.ref.route.duplicate-path': {
    severity: 'warning',
    category: 'routing',
    repair: { kind: 'replace-field-value', title: 'Route Path eindeutig machen', safe: false }
  },
  'rmt.route.path.invalid': {
    severity: 'error',
    category: 'routing',
    repair: { kind: 'replace-field-value', title: 'Gueltigen Route Path setzen', safe: true }
  },
  'rmt.route.document-title.missing': {
    severity: 'info',
    category: 'seo',
    repair: { kind: 'add-route-title', title: 'Route Title fuer Seitentitel-Rewrite ergaenzen', safe: true }
  },
  'rmt.template.mode.unsupported': {
    severity: 'error',
    category: 'templates',
    repair: { kind: 'replace-field-value', title: 'Template Mode auf dom_descriptor, html_fragment oder text umstellen', safe: true }
  },
  'rmt.template.dom-descriptor.invalid-node': {
    severity: 'error',
    category: 'templates',
    repair: { kind: 'replace-field-value', title: 'DOM Descriptor Node-Shape korrigieren', safe: false }
  },
  'rmt.template.html-fragment.trust-boundary-missing': {
    severity: 'warning',
    category: 'security',
    repair: { kind: 'replace-field-value', title: 'Trusted-DOM-Boundary fuer HTML-Fragment setzen', safe: true }
  },
  'rmt.template.inline-script.refused': {
    severity: 'error',
    category: 'security',
    repair: { kind: 'replace-field-value', title: 'Inline Script aus RMT entfernen', safe: false }
  },
  'rmt.xtend.kernel-boundary.violation': {
    severity: 'error',
    category: 'boundary',
    repair: { kind: 'replace-field-value', title: 'Runtime Import aus RMT-Record entfernen', safe: false }
  },
  'rmt.fabric.lane.unknown': {
    severity: 'warning',
    category: 'fabric',
    repair: { kind: 'replace-field-value', title: 'Bekannte Fabric/RMT Lane nutzen', safe: true }
  },
  'rmt.fabric.lane.conflict': {
    severity: 'warning',
    category: 'fabric',
    repair: { kind: 'replace-field-value', title: 'RMT Schedule und Component Metadata angleichen', safe: true }
  },
  'rmt.hydration.policy.unknown': {
    severity: 'warning',
    category: 'hydration',
    repair: { kind: 'replace-field-value', title: 'Bekannte Hydration Policy nutzen', safe: true }
  },
  'rmt.schedule.endpoint.missing': {
    severity: 'warning',
    category: 'scheduler',
    repair: { kind: 'create-schedule', title: 'Schedule Endpoint ergaenzen', safe: true }
  },
  'rmt.a11y.route-announcement.missing': {
    severity: 'info',
    category: 'a11y',
    repair: { kind: 'add-route-title', title: 'Route Announcement Metadata ergaenzen', safe: true }
  },
  'rmt.deprecated.field.used': {
    severity: 'warning',
    category: 'migration',
    repair: { kind: 'replace-field-value', title: 'Feld auf aktuellen Domain-Contract migrieren', safe: false }
  },
  'rmt.app.no-manual-shell.html-sink': {
    severity: 'error',
    category: 'security',
    repair: { kind: 'replace-with-dom-descriptor', title: 'DOM Descriptor oder Component Template verwenden', safe: false }
  },
  'rmt.app.unsafe-html.boundary-missing': {
    severity: 'warning',
    category: 'security',
    repair: { kind: 'add-trusted-dom-boundary', title: 'Trusted-DOM-Boundary explizit setzen', safe: true }
  },
  'rmt.app.repeat.key.missing': {
    severity: 'error',
    category: 'state',
    repair: { kind: 'add-key', title: 'Stabilen key fuer repeat setzen', safe: true }
  },
  'rmt.app.event.payload-contract.missing': {
    severity: 'error',
    category: 'events',
    repair: { kind: 'add-payload-contract', title: 'Payload Contract fuer Event Binding ergaenzen', safe: true }
  },
  'rmt.app.resource.ownership.missing': {
    severity: 'warning',
    category: 'lifecycle',
    repair: { kind: 'add-owner-template', title: 'Resource Owner deklarieren', safe: true }
  },
  'rmt.app.resource.unresolved': {
    severity: 'error',
    category: 'references',
    repair: { kind: 'create-resource', title: 'Resource Record anlegen oder Referenz korrigieren', safe: true }
  },
  'rmt.app.portal.unresolved': {
    severity: 'error',
    category: 'references',
    repair: { kind: 'create-portal', title: 'Portal Record anlegen oder Referenz korrigieren', safe: true }
  },
  'rmt.app.surface.source.unresolved': {
    severity: 'warning',
    category: 'references',
    repair: { kind: 'create-record-source', title: 'Record Source, DataSource oder State deklarieren', safe: true }
  }
});

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function escapeJsonPointerSegment(segment) {
  return String(segment).replace(/~/g, '~0').replace(/\//g, '~1');
}

function joinPointer(...segments) {
  return `/${segments.map(escapeJsonPointerSegment).join('/')}`;
}

function getCatalogEntry(code) {
  return DIAGNOSTIC_CATALOG[code] || null;
}

function resolveSeverity(code, inputSeverity, severityPolicy = {}) {
  if (severityPolicy[code]) {
    return severityPolicy[code];
  }

  if (inputSeverity) {
    return inputSeverity;
  }

  const catalogEntry = getCatalogEntry(code);
  return catalogEntry ? catalogEntry.severity : 'info';
}

function rangeForPointer(sourceModel, pointer, target = 'value') {
  if (!sourceModel || !pointer || typeof sourceModel.findJsonPointerRange !== 'function') {
    return sourceModel && typeof sourceModel.lineRange === 'function' ? sourceModel.lineRange(0) : null;
  }

  const pointerRange = sourceModel.findJsonPointerRange(pointer, { target });
  return pointerRange ? pointerRange.range : sourceModel.lineRange(0);
}

function cloneRepair(repair) {
  return repair ? {
    ...repair,
    edits: Array.isArray(repair.edits) ? repair.edits.slice() : []
  } : null;
}

function enrichRepair(code, repair, diagnostic = {}) {
  const catalogEntry = getCatalogEntry(code);
  const baseRepair = repair || (catalogEntry && catalogEntry.repair);

  if (!baseRepair) {
    return null;
  }

  const cloned = cloneRepair(baseRepair);

  if (diagnostic.pointer && !cloned.pointer) {
    cloned.pointer = diagnostic.pointer;
  }

  return cloned;
}

function createRuleDiagnostic(context, input = {}) {
  const code = input.code || 'rmt.linter.rule';
  const sourceModel = context.graph ? context.graph.sourceModel : null;
  const catalogEntry = getCatalogEntry(code);
  const severity = resolveSeverity(code, input.severity, context.severityPolicy);

  return {
    schema: RMT_LINTER_DIAGNOSTIC_SCHEMA,
    source: 'rmt-linter',
    code,
    ruleId: input.ruleId || context.ruleId || null,
    severity,
    category: input.category || (catalogEntry && catalogEntry.category) || 'quality',
    message: input.message || code,
    uri: sourceModel ? sourceModel.uri : null,
    file: sourceModel ? sourceModel.filePath : null,
    pointer: input.pointer || null,
    range: input.range || rangeForPointer(sourceModel, input.pointer, input.target || 'value'),
    workpackage: RMT_LINTER_WORKPACKAGE,
    repair: enrichRepair(code, input.repair, input),
    relatedInformation: input.relatedInformation || []
  };
}

function normalizeDiagnostic(diagnostic = {}, context = {}) {
  const code = diagnostic.code || 'rmt.linter.diagnostic';
  const catalogEntry = getCatalogEntry(code);
  const severity = resolveSeverity(code, diagnostic.severity, context.severityPolicy);

  return {
    schema: RMT_LINTER_DIAGNOSTIC_SCHEMA,
    source: diagnostic.source === 'rmt-linter' ? diagnostic.source : 'rmt-linter',
    code,
    ruleId: diagnostic.ruleId || `graph.${code}`,
    severity,
    category: diagnostic.category || (catalogEntry && catalogEntry.category) || 'semantic',
    message: diagnostic.message || code,
    uri: diagnostic.uri || (context.graph && context.graph.sourceModel ? context.graph.sourceModel.uri : null),
    file: diagnostic.file || (context.graph && context.graph.sourceModel ? context.graph.sourceModel.filePath : null),
    pointer: diagnostic.pointer || null,
    range: diagnostic.range || rangeForPointer(context.graph && context.graph.sourceModel, diagnostic.pointer),
    workpackage: RMT_LINTER_WORKPACKAGE,
    repair: enrichRepair(code, diagnostic.repair, diagnostic),
    relatedInformation: diagnostic.relatedInformation || []
  };
}

function createRmtRule(input = {}) {
  if (!input.id || typeof input.run !== 'function') {
    throw new Error('RMT Linter Rule benoetigt id und run(context).');
  }

  return Object.freeze({
    id: input.id,
    description: input.description || input.id,
    defaultSeverity: input.defaultSeverity || null,
    run: input.run
  });
}

function createRuleContext(graph, options = {}, ruleId = null) {
  const document = graph ? graph.sourceDocument || graph.rawDocument || {} : {};

  return {
    graph,
    document,
    sourceModel: graph ? graph.sourceModel : null,
    options,
    ruleId,
    severityPolicy: options.severityPolicy || {},
    allowedTopLevelDomains: options.allowedTopLevelDomains || DEFAULT_ALLOWED_TOP_LEVEL_DOMAINS,
    createDiagnostic(input = {}) {
      return createRuleDiagnostic(this, {
        ...input,
        ruleId: input.ruleId || ruleId
      });
    },
    joinPointer,
    escapeJsonPointerSegment,
    normalizeString,
    toArray,
    toPlainObject
  };
}

function getSeverityRank(severity) {
  return Object.prototype.hasOwnProperty.call(SEVERITY_ORDER, severity) ? SEVERITY_ORDER[severity] : 4;
}

function compareRange(a, b) {
  const aStart = a && a.range && a.range.start ? a.range.start : {};
  const bStart = b && b.range && b.range.start ? b.range.start : {};
  const lineDiff = (aStart.line || 0) - (bStart.line || 0);

  if (lineDiff !== 0) {
    return lineDiff;
  }

  return (aStart.character || 0) - (bStart.character || 0);
}

function sortDiagnostics(diagnostics) {
  return diagnostics.slice().sort((a, b) => {
    const severityDiff = getSeverityRank(a.severity) - getSeverityRank(b.severity);
    if (severityDiff !== 0) {
      return severityDiff;
    }

    const fileDiff = String(a.file || a.uri || '').localeCompare(String(b.file || b.uri || ''));
    if (fileDiff !== 0) {
      return fileDiff;
    }

    const rangeDiff = compareRange(a, b);
    if (rangeDiff !== 0) {
      return rangeDiff;
    }

    const codeDiff = String(a.code || '').localeCompare(String(b.code || ''));
    if (codeDiff !== 0) {
      return codeDiff;
    }

    return String(a.pointer || '').localeCompare(String(b.pointer || ''));
  });
}

function createDiagnosticSummary(diagnostics) {
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

function runRules(graph, rules, options = {}) {
  const diagnostics = [];

  rules.forEach((rule) => {
    const context = createRuleContext(graph, options, rule.id);
    const produced = rule.run(context);

    toArray(produced).forEach((diagnostic) => {
      diagnostics.push(normalizeDiagnostic(diagnostic, {
        graph,
        severityPolicy: options.severityPolicy || {}
      }));
    });
  });

  return diagnostics;
}

function createRmtLinter(defaultOptions = {}) {
  const defaultRules = defaultOptions.rules || getDefaultRmtLinterRules();

  function lint(input = {}, options = {}) {
    const mergedOptions = {
      ...defaultOptions,
      ...options
    };
    const graph = mergedOptions.graph || buildSemanticGraph(input, mergedOptions);
    const rules = mergedOptions.rules || defaultRules;
    const graphDiagnostics = toArray(graph.diagnostics).map((diagnostic) => normalizeDiagnostic(diagnostic, {
      graph,
      severityPolicy: mergedOptions.severityPolicy || {}
    }));
    const ruleDiagnostics = graph.status === 'indexed' ? runRules(graph, rules, mergedOptions) : [];
    const diagnostics = sortDiagnostics(graphDiagnostics.concat(ruleDiagnostics));
    const summary = createDiagnosticSummary(diagnostics);
    const status = summary.errorCount > 0 ? 'failed' : 'passed';

    return {
      schema: RMT_LINTER_REPORT_SCHEMA,
      engineSchema: RMT_LINTER_RULE_ENGINE_SCHEMA,
      semanticGraphSchema: RMT_SEMANTIC_GRAPH_SCHEMA,
      workpackage: RMT_LINTER_WORKPACKAGE,
      status,
      ok: status === 'passed',
      files: 1,
      graphStatus: graph.status,
      manifestHints: graph.manifestHints || {},
      catalogHints: graph.catalogHints || {},
      ruleCount: rules.length,
      rules: rules.map((rule) => ({
        id: rule.id,
        description: rule.description,
        defaultSeverity: rule.defaultSeverity
      })),
      diagnostics,
      ...summary
    };
  }

  return Object.freeze({
    schema: RMT_LINTER_RULE_ENGINE_SCHEMA,
    reportSchema: RMT_LINTER_REPORT_SCHEMA,
    workpackage: RMT_LINTER_WORKPACKAGE,
    rules: defaultRules.slice(),
    lint
  });
}

function lintRmtSource(input = {}, options = {}) {
  if (!options.forceLegacy && isLikelyRmtVNextSource(input, options)) {
    return lintRmtVNextToolingSource(input, options);
  }

  return createRmtLinter(options).lint(input, options);
}

module.exports = {
  DEFAULT_ALLOWED_TOP_LEVEL_DOMAINS,
  DIAGNOSTIC_CATALOG,
  RMT_LINTER_DIAGNOSTIC_SCHEMA,
  RMT_LINTER_DIAGNOSTICS_MODULE_PATH,
  RMT_LINTER_PACKAGE_SCRIPT,
  RMT_LINTER_REPORT_SCHEMA,
  RMT_LINTER_RULES_DIR,
  RMT_LINTER_RULE_ENGINE_SCHEMA,
  RMT_LINTER_SUITE_PATH,
  RMT_LINTER_WORKPACKAGE,
  SEVERITY_ORDER,
  createDiagnosticSummary,
  createRmtLinter,
  createRmtRule,
  createRuleDiagnostic,
  getCatalogEntry,
  lintRmtSource,
  normalizeDiagnostic,
  sortDiagnostics
};
