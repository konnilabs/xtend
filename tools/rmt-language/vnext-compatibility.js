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
const RMT_VNEXT_COMPATIBILITY_WORKPACKAGE = 'WP-E15-16';
const RMT_VNEXT_COMPATIBILITY_MODULE_PATH = 'tools/rmt-language/vnext-compatibility.js';
const RMT_VNEXT_COMPATIBILITY_SUITE_PATH = 'tests/rmt-language/rmt_vnext_compatibility_suite.js';
const RMT_VNEXT_COMPATIBILITY_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-compatibility';

const MIGRATION_OPT_IN_REQUIRED_CODE = 'rmt.vnext.migration.opt_in_required';
const MIGRATION_LEGACY_PARSE_FAILED_CODE = 'rmt.vnext.migration.legacy_parse_failed';
const MIGRATION_LEGACY_NORMALIZATION_FAILED_CODE = 'rmt.vnext.migration.legacy_normalization_failed';
const MIGRATION_LOSSY_DOMAIN_CODE = 'rmt.vnext.migration.lossy_domain';
const MIGRATION_UNSUPPORTED_DOMAIN_CODE = 'rmt.vnext.migration.unsupported_domain';
const MIGRATION_VNEXT_COMPILE_FAILED_CODE = 'rmt.vnext.migration.vnext_compile_failed';
const ROUNDTRIP_MISMATCH_CODE = 'rmt.vnext.roundtrip.mismatch';

const LEGACY_DOMAINS = Object.freeze([
  'adapters',
  'components',
  'routes',
  'schedules',
  'surfaces',
  'templates'
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
  LEGACY_DOMAINS,
  MIGRATION_LEGACY_NORMALIZATION_FAILED_CODE,
  MIGRATION_LEGACY_PARSE_FAILED_CODE,
  MIGRATION_LOSSY_DOMAIN_CODE,
  MIGRATION_OPT_IN_REQUIRED_CODE,
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
  RMT_VNEXT_ROUNDTRIP_REPORT_SCHEMA,
  ROUNDTRIP_COMPATIBLE_WARNINGS,
  ROUNDTRIP_MISMATCH_CODE,
  createCompatibilityMatrix,
  createLegacyAuthoringDraft,
  createLegacyCoreProjection,
  createLegacyRoundtripReport,
  createMigrationReport,
  createRmtVNextCompatibilityAdapter,
  serializeMigrationReport
};
