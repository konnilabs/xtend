'use strict';

const path = require('path');
const {
  RMT_FORMAT_ADAPTER_SCHEMA,
  parseAndNormalizeRmtSource
} = require('./format-adapter');
const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');
const {
  RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
  compileRmtVNextRemoteSource
} = require('./vnext-remote-compiler');
const {
  isLikelyRmtVNextSource
} = require('./vnext-tooling');

const RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA = 'xtend.rmt.vnext-remote-compatibility-matrix.v1';
const RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA = 'xtend.rmt.vnext-remote-migration-report.v1';
const RMT_VNEXT_REMOTE_ROUNDTRIP_REPORT_SCHEMA = 'xtend.rmt.vnext-remote-roundtrip-report.v1';
const RMT_VNEXT_REMOTE_PREVIEW_SCHEMA = 'xtend.rmt.vnext-remote-authoring-preview.v1';
const RMT_VNEXT_REMOTE_COMPATIBILITY_REPORT_SCHEMA = 'xtend.rmt.vnext-remote-compatibility-report.v1';
const RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE = 'WP-E16-10';
const RMT_VNEXT_REMOTE_COMPATIBILITY_MODULE_PATH = 'tools/rmt-language/vnext-remote-compatibility.js';
const RMT_VNEXT_REMOTE_COMPATIBILITY_SUITE_PATH = 'tests/rmt-language/rmt_vnext_remote_compatibility_suite.js';
const RMT_VNEXT_REMOTE_COMPATIBILITY_CONTRACT_PATH = 'development/XTendRMT-vNext-Remote-Surface-Migration-Contract.md';
const RMT_VNEXT_REMOTE_COMPATIBILITY_WP_PATH = 'development/WP-E16-10-Compatibility-Migration-und-Legacy-Surface-Roundtrip-absichern.md';
const RMT_VNEXT_REMOTE_COMPATIBILITY_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-remote-compatibility';

const REMOTE_MIGRATION_REPORT_ONLY_CODE = 'rmt.vnext.remote_migration.report_only';
const REMOTE_MIGRATION_LEGACY_PARSE_FAILED_CODE = 'rmt.vnext.remote_migration.legacy_parse_failed';
const REMOTE_MIGRATION_LEGACY_NORMALIZATION_FAILED_CODE = 'rmt.vnext.remote_migration.legacy_normalization_failed';
const REMOTE_MIGRATION_RUNTIME_FACT_CODE = 'rmt.vnext.remote_migration.runtime_fact';
const REMOTE_MIGRATION_REMOTE_FACT_MISSING_CODE = 'rmt.vnext.remote_migration.remote_fact_missing';
const REMOTE_MIGRATION_PREVIEW_UNSAFE_CODE = 'rmt.vnext.remote_migration.preview_unsafe';
const REMOTE_MIGRATION_SURFACE_MANAGER_BOUNDARY_CODE = 'rmt.vnext.remote_migration.surface_manager_boundary';
const REMOTE_MIGRATION_NATIVE_SURFACE_ROUNDTRIP_CODE = 'rmt.vnext.remote_migration.native_surface_roundtrip';
const REMOTE_MIGRATION_REMOTE_PREVIEW_AVAILABLE_CODE = 'rmt.vnext.remote_migration.preview_available';
const REMOTE_MIGRATION_REMOTE_COMPILE_FAILED_CODE = 'rmt.vnext.remote_migration.remote_compile_failed';
const REMOTE_ROUNDTRIP_MISMATCH_CODE = 'rmt.vnext.remote_roundtrip.mismatch';

const REMOTE_REQUIRED_FACTS = Object.freeze([
  'owner',
  'version',
  'remote',
  'origin',
  'integrity',
  'trustBoundary',
  'fallback',
  'shellTarget'
]);

const REMOTE_COMPATIBLE_WARNINGS = Object.freeze([
  'rmt.document.extension.fallback-used',
  REMOTE_MIGRATION_REPORT_ONLY_CODE,
  REMOTE_MIGRATION_RUNTIME_FACT_CODE,
  REMOTE_MIGRATION_REMOTE_FACT_MISSING_CODE,
  REMOTE_MIGRATION_SURFACE_MANAGER_BOUNDARY_CODE,
  REMOTE_MIGRATION_NATIVE_SURFACE_ROUNDTRIP_CODE,
  REMOTE_MIGRATION_REMOTE_PREVIEW_AVAILABLE_CODE
]);

const RUNTIME_FACT_FIELDS = Object.freeze([
  'active',
  'a11y',
  'bounds',
  'capabilities',
  'defaultLayer',
  'defaultOpen',
  'initialBounds',
  'manager',
  'mode',
  'nativeRecord',
  'persistence',
  'placement',
  'responsive',
  'route',
  'schedule',
  'stackPolicy',
  'stateKey',
  'type'
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
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
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

function createRemoteCompatibilityDiagnostic(input = {}, base = {}) {
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: 'rmt-vnext-remote-compatibility',
    code: input.code || 'rmt.vnext.remote_compatibility.diagnostic',
    ruleId: input.ruleId || `vnext.remote-compatibility.${input.code || 'diagnostic'}`,
    severity: input.severity || 'warning',
    category: input.category || 'remote-migration',
    message: input.message || input.code || 'RMT vNext remote compatibility diagnostic',
    uri: input.uri || base.uri || null,
    file: input.file || base.file || null,
    pointer: input.pointer || null,
    range: input.range || null,
    workpackage: RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE,
    repair: input.repair || null,
    relatedInformation: input.relatedInformation || [],
    details: input.details || null
  };
}

function normalizeSourceDiagnostic(diagnostic = {}, fallback = {}) {
  return createRemoteCompatibilityDiagnostic({
    code: diagnostic.code,
    severity: diagnostic.severity,
    category: diagnostic.category || (diagnostic.severity === 'error' ? 'syntax' : 'compatibility'),
    message: diagnostic.message,
    uri: diagnostic.uri,
    file: diagnostic.file,
    pointer: diagnostic.pointer,
    range: diagnostic.range,
    repair: diagnostic.repair,
    relatedInformation: diagnostic.relatedInformation || [],
    details: diagnostic.details || null
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

function stringLiteral(value) {
  return JSON.stringify(normalizeString(value));
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function laneForSchedule(document, scheduleId) {
  const schedule = toArray(document.schedules).find((entry) => entry && entry.id === scheduleId);
  return safeIdentifier(schedule && schedule.lane || 'critical', 'critical');
}

function parseLegacyInput(input = {}, options = {}) {
  if (input.document && typeof input.document === 'object') {
    return {
      schema: RMT_FORMAT_ADAPTER_SCHEMA,
      ok: true,
      phase: 'normalize',
      status: 'normalized',
      sourceModel: {
        uri: input.uri || null,
        filePath: sourceFile(input)
      },
      rawDocument: cloneJson(input.document),
      normalizedDocument: cloneJson(input.document),
      diagnostics: [],
      formatDiagnostics: [],
      normalizedBy: 'in-memory-document'
    };
  }
  return parseAndNormalizeRmtSource(input, options);
}

function normalizeOwner(owner) {
  if (typeof owner === 'string') {
    return {
      kind: 'team',
      id: normalizeString(owner)
    };
  }
  const source = toPlainObject(owner);
  return {
    kind: normalizeString(source.kind || source.type || 'team') || 'team',
    id: normalizeString(source.id || source.team || source.owner || source.name)
  };
}

function normalizeIntegrity(integrity) {
  if (typeof integrity === 'string') {
    const match = integrity.match(/^(sha256|sha384|sha512)-/u);
    return {
      algorithm: match ? match[1] : 'sha256',
      digest: normalizeString(integrity)
    };
  }
  const source = toPlainObject(integrity);
  return {
    algorithm: normalizeString(source.algorithm || source.alg || source.type || 'sha256') || 'sha256',
    digest: normalizeString(source.digest || source.hash || source.value)
  };
}

function normalizeFallback(fallback) {
  if (typeof fallback === 'string') {
    return {
      kind: 'surface',
      ref: safeIdentifier(fallback, 'remote.fallback')
    };
  }
  const source = toPlainObject(fallback);
  const ref = normalizeString(source.ref || source.surface || source.target);
  return {
    kind: normalizeString(source.kind || source.type || 'surface') || 'surface',
    ref: ref ? safeIdentifier(ref, 'remote.fallback') : ''
  };
}

function firstDefined(...values) {
  return values.find((value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return normalizeString(value) !== '';
    return true;
  });
}

function remoteSourceForCandidate(candidate) {
  const record = toPlainObject(candidate.record);
  const component = toPlainObject(candidate.component);
  const componentMetadata = toPlainObject(component.metadata);
  const recordMetadata = toPlainObject(record.metadata);
  return toPlainObject(
    componentMetadata.remoteSurface ||
    componentMetadata.remote ||
    record.remoteSurface ||
    record.remote ||
    recordMetadata.remoteSurface ||
    recordMetadata.remote
  );
}

function normalizeRemoteFacts(candidate, document) {
  const remote = remoteSourceForCandidate(candidate);
  const record = toPlainObject(candidate.record);
  const component = toPlainObject(candidate.component);
  const owner = normalizeOwner(firstDefined(remote.owner, remote.ownerTeam, remote.team));
  const integrity = normalizeIntegrity(remote.integrity || remote.digest);
  const fallback = normalizeFallback(remote.fallback || remote.fallbackSurface);
  const shellTarget = normalizeString(firstDefined(
    remote.shellTarget,
    remote.target,
    toArray(remote.shellTargets)[0],
    toArray(remote.exposes)[0] && (toArray(remote.exposes)[0].target || toArray(remote.exposes)[0].shellTarget),
    record.shellTarget
  ));
  const lane = safeIdentifier(firstDefined(
    remote.lane,
    toArray(remote.exposes)[0] && toArray(remote.exposes)[0].lane,
    laneForSchedule(document, record.schedule || component.schedule)
  ), 'critical');
  const remoteId = normalizeString(firstDefined(remote.remoteId, remote.remote, remote.package, remote.packageName, remote.id));
  const surfaceName = safeIdentifier(firstDefined(remote.surfaceName, remote.name, record.id, component.id, remoteId), 'remote.surface');
  const facts = {
    owner,
    version: normalizeString(firstDefined(remote.version, remote.versionRange, remote.range)),
    remoteId,
    origin: normalizeString(remote.origin),
    integrity,
    trustBoundary: normalizeString(firstDefined(remote.trustBoundary, remote.boundary, remote.security && remote.security.trustBoundary)),
    fallback,
    shellTarget,
    lane,
    surfaceName
  };
  const missingFacts = [];

  if (!facts.owner.id) missingFacts.push('owner');
  if (!facts.version) missingFacts.push('version');
  if (!facts.remoteId) missingFacts.push('remote');
  if (!facts.origin) missingFacts.push('origin');
  if (!facts.integrity.digest) missingFacts.push('integrity');
  if (!facts.trustBoundary) missingFacts.push('trustBoundary');
  if (!facts.fallback.ref) missingFacts.push('fallback');
  if (!facts.shellTarget) missingFacts.push('shellTarget');

  return {
    ...facts,
    missingFacts,
    safeForPreview: missingFacts.length === 0
  };
}

function collectRuntimeFacts(candidate) {
  const record = toPlainObject(candidate.record);
  const component = toPlainObject(candidate.component);
  const componentAttributes = toPlainObject(component.attributes);
  const componentEvents = toPlainObject(component.events);
  const facts = [];

  RUNTIME_FACT_FIELDS.forEach((field) => {
    if (hasOwn(record, field)) {
      facts.push({
        key: field,
        pointer: `${candidate.pointer}/${field}`
      });
    }
  });

  Object.keys(componentAttributes).forEach((key) => {
    if (/^(active|draggable|initial-|mode|open|placement|position|resizable|surface-id|width)$/u.test(key)) {
      facts.push({
        key: `attributes.${key}`,
        pointer: `${candidate.componentPointer}/attributes/${key}`
      });
    }
  });

  Object.keys(componentEvents).forEach((key) => {
    facts.push({
      key: `events.${key}`,
      pointer: `${candidate.componentPointer}/events/${key}`
    });
  });

  return facts;
}

function collectSurfaceCandidates(document = {}) {
  const candidates = [];
  const components = toArray(document.components);
  const componentById = new Map(components.map((component, index) => [component && component.id, {
    component,
    index
  }]));

  toArray(document.surfaces).forEach((surface, index) => {
    const componentRef = surface && surface.component;
    const componentEntry = componentById.get(componentRef) || {};
    const pointer = `/surfaces/${index}`;
    candidates.push({
      id: normalizeString(surface && surface.id) || `surface.${index}`,
      sourceKind: 'native-surfaces-domain',
      record: surface,
      component: componentEntry.component || null,
      pointer,
      componentPointer: componentEntry.component ? `/components/${componentEntry.index}` : null,
      origin: pointer
    });
  });

  components.forEach((component, index) => {
    const metadata = toPlainObject(component && component.metadata);
    if (metadata.surface) {
      candidates.push({
        id: normalizeString(metadata.surface.id || component.id) || `component.surface.${index}`,
        sourceKind: 'component-metadata-surface',
        record: metadata.surface,
        component,
        pointer: `/components/${index}/metadata/surface`,
        componentPointer: `/components/${index}`,
        origin: `/components/${index}`
      });
    }
    if (metadata.surfaceManager) {
      candidates.push({
        id: normalizeString(component && component.id) || `surface.manager.${index}`,
        sourceKind: 'surface-manager',
        record: metadata.surfaceManager,
        component,
        pointer: `/components/${index}/metadata/surfaceManager`,
        componentPointer: `/components/${index}`,
        origin: `/components/${index}`
      });
    }
  });

  return candidates.map((candidate) => {
    const remoteFacts = normalizeRemoteFacts(candidate, document);
    const runtimeFacts = collectRuntimeFacts(candidate);
    return {
      ...candidate,
      remoteFacts,
      runtimeFacts,
      migratable: candidate.sourceKind !== 'surface-manager' && remoteFacts.safeForPreview,
      runtimeFactCount: runtimeFacts.length
    };
  });
}

function createCandidateDiagnostics(candidates, base, migrationMode) {
  const diagnostics = [];

  candidates.forEach((candidate) => {
    if (candidate.sourceKind === 'surface-manager') {
      diagnostics.push(createRemoteCompatibilityDiagnostic({
        code: REMOTE_MIGRATION_SURFACE_MANAGER_BOUNDARY_CODE,
        severity: 'warning',
        message: 'SurfaceManager-Records bleiben Host-/Runtime-Grenze und werden nicht als Remote Surface Authoring migriert.',
        pointer: candidate.pointer,
        details: {
          candidateId: candidate.id,
          sourceKind: candidate.sourceKind
        }
      }, base));
    }

    if (candidate.runtimeFacts.length > 0) {
      diagnostics.push(createRemoteCompatibilityDiagnostic({
        code: REMOTE_MIGRATION_RUNTIME_FACT_CODE,
        severity: 'warning',
        message: 'Legacy Surface enthaelt Runtime-Fakten, die nicht lossless in Remote Surface Authoring migriert werden.',
        pointer: candidate.pointer,
        details: {
          candidateId: candidate.id,
          sourceKind: candidate.sourceKind,
          runtimeFacts: candidate.runtimeFacts
        }
      }, base));
    }

    if (candidate.sourceKind !== 'surface-manager' && candidate.remoteFacts.missingFacts.length > 0) {
      diagnostics.push(createRemoteCompatibilityDiagnostic({
        code: REMOTE_MIGRATION_REMOTE_FACT_MISSING_CODE,
        severity: 'warning',
        message: 'Legacy Surface enthaelt nicht alle Remote Surface Pflichtfakten fuer eine sichere Preview-Projektion.',
        pointer: candidate.pointer,
        details: {
          candidateId: candidate.id,
          sourceKind: candidate.sourceKind,
          missingFacts: candidate.remoteFacts.missingFacts
        }
      }, base));
    }
  });

  const safeCount = candidates.filter((candidate) => candidate.migratable).length;
  if (safeCount > 0) {
    diagnostics.push(createRemoteCompatibilityDiagnostic({
      code: REMOTE_MIGRATION_REMOTE_PREVIEW_AVAILABLE_CODE,
      severity: 'info',
      message: 'Remote Surface Authoring Preview ist fuer Kandidaten mit expliziten Remote-Fakten verfuegbar.',
      details: {
        safeCandidateCount: safeCount
      }
    }, base));
  }

  if (migrationMode === 'report-only') {
    diagnostics.push(createRemoteCompatibilityDiagnostic({
      code: REMOTE_MIGRATION_REPORT_ONLY_CODE,
      severity: 'warning',
      message: 'Remote Surface Migration bleibt report-only. Nutze migrationMode "preview", um sichere Remote Authoring-Projektionen zu erzeugen.'
    }, base));
  } else if (safeCount === 0) {
    diagnostics.push(createRemoteCompatibilityDiagnostic({
      code: REMOTE_MIGRATION_PREVIEW_UNSAFE_CODE,
      severity: 'error',
      message: 'Remote Surface Preview wurde angefordert, aber kein Kandidat enthaelt die noetigen Remote-, Owner-, Integrity-, Fallback- und ShellTarget-Fakten.',
      details: {
        requiredFacts: REMOTE_REQUIRED_FACTS.slice()
      }
    }, base));
  }

  return diagnostics;
}

function shellTargetSyntax(ref) {
  const value = normalizeString(ref);
  if (value.startsWith('shell.slot:')) return `shell.slot ${stringLiteral(value.slice('shell.slot:'.length))}`;
  if (value === 'shell.session:current') return 'shell.session';
  if (value.startsWith('shell.session:')) return `shell.session ${stringLiteral(value.slice('shell.session:'.length))}`;
  const index = value.indexOf(':');
  if (index > 0) {
    return `${safeIdentifier(value.slice(0, index), 'shell.slot')} ${stringLiteral(value.slice(index + 1))}`;
  }
  return safeIdentifier(value, 'shell.slot');
}

function createRemoteSurfaceAuthoringPreview(candidates) {
  const safeCandidates = candidates.filter((candidate) => candidate.migratable);
  if (safeCandidates.length === 0) return null;

  const lines = [];
  safeCandidates.forEach((candidate, index) => {
    const facts = candidate.remoteFacts;
    if (index > 0) lines.push('');
    lines.push(`remote surface ${facts.surfaceName} from remote ${stringLiteral(facts.remoteId)} {`);
    lines.push(`  owner ${safeIdentifier(facts.owner.kind, 'team')} ${stringLiteral(facts.owner.id)}`);
    lines.push(`  version ${stringLiteral(facts.version)}`);
    lines.push(`  origin ${stringLiteral(facts.origin)}`);
    lines.push(`  integrity ${safeIdentifier(facts.integrity.algorithm, 'sha256')} ${stringLiteral(facts.integrity.digest)}`);
    lines.push(`  trust boundary ${stringLiteral(facts.trustBoundary)}`);
    lines.push(`  fallback surface ${facts.fallback.ref}`);
    lines.push('');
    lines.push(`  exposes lane ${facts.lane} -> ${shellTargetSyntax(facts.shellTarget)}`);
    lines.push('}');
  });

  return `${lines.join('\n')}\n`;
}

function createLegacyRemoteSurfaceRoundtripReport(input = {}, options = {}) {
  const parseResult = parseLegacyInput(input, options);
  const base = {
    uri: parseResult.sourceModel ? parseResult.sourceModel.uri : input.uri || null,
    file: parseResult.sourceModel ? parseResult.sourceModel.filePath : sourceFile(input)
  };
  const diagnostics = toArray(parseResult.diagnostics).map((diagnostic) => normalizeSourceDiagnostic(diagnostic, base));

  if (!parseResult.ok) {
    const failedCode = parseResult.phase === 'syntax'
      ? REMOTE_MIGRATION_LEGACY_PARSE_FAILED_CODE
      : REMOTE_MIGRATION_LEGACY_NORMALIZATION_FAILED_CODE;
    diagnostics.push(createRemoteCompatibilityDiagnostic({
      code: failedCode,
      severity: 'error',
      message: parseResult.phase === 'syntax'
        ? 'Legacy Surface RMT JSON konnte nicht geparst werden.'
        : 'Legacy Surface RMT JSON konnte nicht normalisiert werden.'
    }, base));
    return {
      schema: RMT_VNEXT_REMOTE_ROUNDTRIP_REPORT_SCHEMA,
      workpackage: RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE,
      languageMode: 'legacy-json',
      status: 'blocked',
      ok: false,
      lossless: false,
      parseStatus: parseResult.status,
      normalizedStatus: null,
      serialized: '',
      serializedLength: 0,
      diagnostics,
      ...diagnosticSummary(diagnostics)
    };
  }

  const document = parseResult.normalizedDocument || {};
  const serialized = canonicalJson(document);
  const repeatResult = parseLegacyInput({
    text: serialized,
    uri: input.uri,
    filePath: input.filePath
  }, options);
  const originalCanonical = canonicalJson(semanticRoundtripDocument(document));
  const repeatCanonical = repeatResult.ok ? canonicalJson(semanticRoundtripDocument(repeatResult.normalizedDocument)) : '';
  const lossless = repeatResult.ok && originalCanonical === repeatCanonical;

  if (toArray(document.surfaces).length > 0) {
    diagnostics.push(createRemoteCompatibilityDiagnostic({
      code: REMOTE_MIGRATION_NATIVE_SURFACE_ROUNDTRIP_CODE,
      severity: 'info',
      message: 'Native RMT Surface-Domain wird im Legacy JSON Roundtrip fachlich erhalten.',
      details: {
        surfaceCount: toArray(document.surfaces).length,
        comparisonBoundary: 'semantic-normalized-json-with-normalization-metadata-excluded'
      }
    }, base));
  }

  if (!lossless) {
    diagnostics.push(createRemoteCompatibilityDiagnostic({
      code: REMOTE_ROUNDTRIP_MISMATCH_CODE,
      severity: 'error',
      message: 'Legacy Surface Roundtrip ist nicht stabil auf fachlicher normalisierter JSON-Repraesentation.'
    }, base));
  }

  return {
    schema: RMT_VNEXT_REMOTE_ROUNDTRIP_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE,
    languageMode: 'legacy-json',
    status: lossless ? 'ready' : 'blocked',
    ok: lossless,
    lossless,
    comparisonBoundary: 'semantic-normalized-json-with-normalization-metadata-excluded',
    parseStatus: parseResult.status,
    normalizedStatus: document.normalization ? document.normalization.status : parseResult.status,
    surfaceCount: toArray(document.surfaces).length,
    serialized,
    serializedLength: serialized.length,
    diagnostics,
    ...diagnosticSummary(diagnostics)
  };
}

function createRemoteSurfaceMigrationReport(input = {}, options = {}) {
  const migrationMode = options.migrationMode || 'report-only';

  if (isLikelyRmtVNextSource(input, options)) {
    const compileResult = compileRmtVNextRemoteSource(input, options);
    const diagnostics = toArray(compileResult.diagnostics).map((diagnostic) => normalizeSourceDiagnostic(diagnostic, {
      file: sourceFile(input)
    }));
    if (!compileResult.ok) {
      diagnostics.push(createRemoteCompatibilityDiagnostic({
        code: REMOTE_MIGRATION_REMOTE_COMPILE_FAILED_CODE,
        severity: 'error',
        message: 'Remote vNext Source konnte nicht kompiliert werden.'
      }, { file: sourceFile(input) }));
    }
    const status = compileResult.ok ? 'ready' : 'blocked';
    return {
      schema: RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA,
      workpackage: RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE,
      languageMode: 'rmt-vnext-remote',
      migrationRequired: false,
      migrationMode,
      status,
      ok: status === 'ready',
      compatible: compileResult.ok === true,
      compilerSchema: RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
      coreSchema: RMT_VNEXT_CORE_SCHEMA,
      surfaceCandidates: [],
      roundtrip: null,
      authoringPreview: null,
      authoringPreviewCompileStatus: null,
      remoteSurfaceCount: toArray(compileResult.coreDocument && compileResult.coreDocument.remoteSurfaces).length,
      diagnostics,
      ...diagnosticSummary(diagnostics)
    };
  }

  const parseResult = parseLegacyInput(input, options);
  const base = {
    uri: parseResult.sourceModel ? parseResult.sourceModel.uri : input.uri || null,
    file: parseResult.sourceModel ? parseResult.sourceModel.filePath : sourceFile(input)
  };
  const sourceDiagnostics = toArray(parseResult.diagnostics).map((diagnostic) => normalizeSourceDiagnostic(diagnostic, base));
  const roundtrip = createLegacyRemoteSurfaceRoundtripReport(input, options);

  if (!parseResult.ok) {
    const failedCode = parseResult.phase === 'syntax'
      ? REMOTE_MIGRATION_LEGACY_PARSE_FAILED_CODE
      : REMOTE_MIGRATION_LEGACY_NORMALIZATION_FAILED_CODE;
    const diagnostics = sourceDiagnostics.concat(createRemoteCompatibilityDiagnostic({
      code: failedCode,
      severity: 'error',
      message: parseResult.phase === 'syntax'
        ? 'Legacy Surface RMT JSON konnte nicht geparst werden.'
        : 'Legacy Surface RMT JSON konnte nicht normalisiert werden.'
    }, base));
    return {
      schema: RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA,
      workpackage: RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE,
      languageMode: 'legacy-json',
      migrationRequired: true,
      migrationMode,
      status: 'blocked',
      ok: false,
      compatible: false,
      surfaceCandidates: [],
      roundtrip,
      authoringPreview: null,
      authoringPreviewCompileStatus: null,
      diagnostics,
      ...diagnosticSummary(diagnostics)
    };
  }

  const document = parseResult.normalizedDocument || {};
  const surfaceCandidates = collectSurfaceCandidates(document);
  const candidateDiagnostics = createCandidateDiagnostics(surfaceCandidates, base, migrationMode);
  const authoringDraft = migrationMode === 'preview'
    ? createRemoteSurfaceAuthoringPreview(surfaceCandidates)
    : null;
  const previewCompileResult = authoringDraft
    ? compileRmtVNextRemoteSource({
      text: authoringDraft,
      uri: input.uri,
      filePath: input.filePath
    }, options)
    : null;
  const preview = authoringDraft ? {
    schema: RMT_VNEXT_REMOTE_PREVIEW_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE,
    languageMode: 'rmt-vnext-remote',
    status: previewCompileResult && previewCompileResult.ok ? 'ready' : 'blocked',
    ok: previewCompileResult && previewCompileResult.ok === true,
    source: authoringDraft,
    compileStatus: previewCompileResult ? previewCompileResult.status : null,
    remoteSurfaceCount: previewCompileResult && previewCompileResult.coreDocument
      ? toArray(previewCompileResult.coreDocument.remoteSurfaces).length
      : 0
  } : null;

  const diagnostics = sourceDiagnostics
    .concat(candidateDiagnostics)
    .concat(toArray(roundtrip.diagnostics).filter((diagnostic) => diagnostic.severity === 'error'));

  if (previewCompileResult && !previewCompileResult.ok) {
    diagnostics.push(createRemoteCompatibilityDiagnostic({
      code: REMOTE_MIGRATION_REMOTE_COMPILE_FAILED_CODE,
      severity: 'error',
      message: 'Remote Surface Authoring Preview konnte nicht kompiliert werden.',
      details: {
        diagnosticCodes: toArray(previewCompileResult.diagnostics).map((diagnostic) => diagnostic.code)
      }
    }, base));
  }

  const summary = diagnosticSummary(diagnostics);
  const status = summary.errorCount > 0 || !roundtrip.ok ? 'blocked' : 'ready';

  return {
    schema: RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE,
    languageMode: 'legacy-json',
    migrationRequired: true,
    migrationMode,
    status,
    ok: status === 'ready',
    compatible: status === 'ready',
    compilerSchema: RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    surfaceCandidates: surfaceCandidates.map((candidate) => ({
      id: candidate.id,
      sourceKind: candidate.sourceKind,
      pointer: candidate.pointer,
      origin: candidate.origin,
      migratable: candidate.migratable,
      safeForPreview: candidate.remoteFacts.safeForPreview,
      missingFacts: candidate.remoteFacts.missingFacts,
      runtimeFactCount: candidate.runtimeFactCount,
      runtimeFacts: candidate.runtimeFacts,
      previewName: candidate.remoteFacts.surfaceName
    })),
    roundtrip,
    authoringPreview: preview,
    authoringPreviewCompileStatus: preview ? preview.compileStatus : null,
    boundaries: candidateDiagnostics.map((diagnostic) => ({
      code: diagnostic.code,
      severity: diagnostic.severity,
      message: diagnostic.message,
      details: diagnostic.details
    })),
    compatibleWarningCodes: REMOTE_COMPATIBLE_WARNINGS.slice(),
    diagnostics,
    ...summary
  };
}

function createRemoteCompatibilityMatrix(inputs = [], options = {}) {
  const entries = (Array.isArray(inputs) ? inputs : [inputs]).map((entry, index) => {
    const input = typeof entry === 'string'
      ? {
        text: options.readFile ? options.readFile(entry) : '',
        filePath: entry
      }
      : entry;
    const id = input.id || input.filePath || input.uri || `entry.${index}`;
    const report = createRemoteSurfaceMigrationReport(input, options);
    return {
      id,
      languageMode: report.languageMode,
      status: report.status,
      ok: report.ok,
      compatible: report.compatible,
      migrationRequired: report.migrationRequired,
      migrationMode: report.migrationMode,
      surfaceCandidateCount: report.surfaceCandidates.length,
      previewStatus: report.authoringPreview ? report.authoringPreview.status : null,
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
    schema: RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA,
    reportSchema: RMT_VNEXT_REMOTE_COMPATIBILITY_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE,
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

function serializeRemoteMigrationReport(report) {
  return canonicalJson(report);
}

function createRmtVNextRemoteCompatibilityAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA,
    migrationReportSchema: RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA,
    roundtripReportSchema: RMT_VNEXT_REMOTE_ROUNDTRIP_REPORT_SCHEMA,
    previewSchema: RMT_VNEXT_REMOTE_PREVIEW_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE,
    createMigrationReport: (input = {}, options = {}) => createRemoteSurfaceMigrationReport(input, {
      ...defaultOptions,
      ...options
    }),
    createRoundtripReport: (input = {}, options = {}) => createLegacyRemoteSurfaceRoundtripReport(input, {
      ...defaultOptions,
      ...options
    }),
    createCompatibilityMatrix: (inputs = [], options = {}) => createRemoteCompatibilityMatrix(inputs, {
      ...defaultOptions,
      ...options
    }),
    serializeMigrationReport: serializeRemoteMigrationReport
  });
}

module.exports = {
  REMOTE_COMPATIBLE_WARNINGS,
  REMOTE_MIGRATION_LEGACY_NORMALIZATION_FAILED_CODE,
  REMOTE_MIGRATION_LEGACY_PARSE_FAILED_CODE,
  REMOTE_MIGRATION_NATIVE_SURFACE_ROUNDTRIP_CODE,
  REMOTE_MIGRATION_PREVIEW_UNSAFE_CODE,
  REMOTE_MIGRATION_REMOTE_COMPILE_FAILED_CODE,
  REMOTE_MIGRATION_REMOTE_FACT_MISSING_CODE,
  REMOTE_MIGRATION_REMOTE_PREVIEW_AVAILABLE_CODE,
  REMOTE_MIGRATION_REPORT_ONLY_CODE,
  REMOTE_MIGRATION_RUNTIME_FACT_CODE,
  REMOTE_MIGRATION_SURFACE_MANAGER_BOUNDARY_CODE,
  REMOTE_REQUIRED_FACTS,
  REMOTE_ROUNDTRIP_MISMATCH_CODE,
  RMT_VNEXT_REMOTE_COMPATIBILITY_CONTRACT_PATH,
  RMT_VNEXT_REMOTE_COMPATIBILITY_MODULE_PATH,
  RMT_VNEXT_REMOTE_COMPATIBILITY_PACKAGE_SCRIPT,
  RMT_VNEXT_REMOTE_COMPATIBILITY_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_COMPATIBILITY_SCHEMA,
  RMT_VNEXT_REMOTE_COMPATIBILITY_SUITE_PATH,
  RMT_VNEXT_REMOTE_COMPATIBILITY_WORKPACKAGE,
  RMT_VNEXT_REMOTE_COMPATIBILITY_WP_PATH,
  RMT_VNEXT_REMOTE_MIGRATION_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_PREVIEW_SCHEMA,
  RMT_VNEXT_REMOTE_ROUNDTRIP_REPORT_SCHEMA,
  collectSurfaceCandidates,
  createLegacyRemoteSurfaceRoundtripReport,
  createRemoteCompatibilityMatrix,
  createRemoteSurfaceMigrationReport,
  createRmtVNextRemoteCompatibilityAdapter,
  serializeRemoteMigrationReport
};
