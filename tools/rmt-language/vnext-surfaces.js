const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');

const RMT_VNEXT_SURFACE_REGISTRY_SCHEMA = 'xtend.rmt.vnext-surface-registry.v1';
const RMT_VNEXT_SURFACE_SCHEMA = 'xtend.rmt.vnext-surface.v1';
const RMT_VNEXT_SURFACE_REPORT_SCHEMA = 'xtend.rmt.vnext-surface-report.v1';
const RMT_VNEXT_SURFACE_WORKPACKAGE = 'WP-E15-08';
const RMT_VNEXT_SURFACE_MODULE_PATH = 'tools/rmt-language/vnext-surfaces.js';
const RMT_VNEXT_SURFACE_SUITE_PATH = 'tests/rmt-language/rmt_vnext_surface_registry_suite.js';
const RMT_VNEXT_SURFACE_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-surfaces';

const SURFACE_KIND_UNKNOWN_CODE = 'rmt.vnext.surface.kind.unknown';
const SURFACE_ID_DUPLICATE_CODE = 'rmt.vnext.surface.id.duplicate';
const SURFACE_LANE_REF_MISSING_CODE = 'rmt.vnext.surface.lane_ref.missing';
const SURFACE_LANE_SCOPE_MISMATCH_CODE = 'rmt.vnext.surface.lane_ref.scope_mismatch';
const SURFACE_OPERATION_REF_MISSING_CODE = 'rmt.vnext.surface.operation_ref.missing';
const SURFACE_OPERATION_SCOPE_MISMATCH_CODE = 'rmt.vnext.surface.operation_ref.scope_mismatch';
const SURFACE_TEMPLATE_REF_MISSING_CODE = 'rmt.vnext.surface.template_ref.missing';

const SURFACE_TYPE_PROFILES = Object.freeze({
  root: Object.freeze({
    type: 'root',
    family: 'document-root',
    hostRole: 'root-container',
    stack: 'base',
    modal: false,
    portal: false
  }),
  modal: Object.freeze({
    type: 'modal',
    family: 'modal-dialog',
    hostRole: 'overlay-container',
    stack: 'modal',
    modal: true,
    portal: true
  }),
  panel: Object.freeze({
    type: 'panel',
    family: 'side-panel',
    hostRole: 'panel-container',
    stack: 'panel',
    modal: false,
    portal: false
  }),
  overlay: Object.freeze({
    type: 'overlay',
    family: 'floating-overlay',
    hostRole: 'overlay-container',
    stack: 'overlay',
    modal: false,
    portal: true
  }),
  workspace: Object.freeze({
    type: 'workspace',
    family: 'workspace',
    hostRole: 'workspace-container',
    stack: 'workspace',
    modal: false,
    portal: false
  }),
  portal: Object.freeze({
    type: 'portal',
    family: 'portal',
    hostRole: 'portal-container',
    stack: 'portal',
    modal: false,
    portal: true
  })
});

const SURFACE_TYPE_ALIASES = Object.freeze({
  root: 'root',
  app: 'root',
  modal: 'modal',
  dialog: 'modal',
  panel: 'panel',
  'side-panel': 'panel',
  sidepanel: 'panel',
  drawer: 'panel',
  overlay: 'overlay',
  popover: 'overlay',
  tooltip: 'overlay',
  toast: 'overlay',
  workspace: 'workspace',
  workbench: 'workspace',
  portal: 'portal'
});

function listSurfaceTypes() {
  return Object.keys(SURFACE_TYPE_PROFILES);
}

function cloneRange(range = {}) {
  return {
    start: {
      line: range.start && Number.isInteger(range.start.line) ? range.start.line : 0,
      character: range.start && Number.isInteger(range.start.character) ? range.start.character : 0
    },
    end: {
      line: range.end && Number.isInteger(range.end.line) ? range.end.line : 0,
      character: range.end && Number.isInteger(range.end.character) ? range.end.character : 0
    },
    startOffset: Number.isInteger(range.startOffset) ? range.startOffset : 0,
    endOffset: Number.isInteger(range.endOffset) ? range.endOffset : 0
  };
}

function findSourceEntry(coreDocument, sourceRef) {
  const sourceMap = Array.isArray(coreDocument && coreDocument.sourceMap) ? coreDocument.sourceMap : [];
  return sourceMap.find((entry) => entry && entry.id === sourceRef) || null;
}

function createSurfaceDiagnostic(coreDocument, surface, code, message, severity = 'error', metadata = {}) {
  const sourceEntry = findSourceEntry(coreDocument, surface && surface.sourceRef);
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_SURFACE_REGISTRY_SCHEMA,
    workpackage: RMT_VNEXT_SURFACE_WORKPACKAGE,
    severity,
    code,
    message,
    surfaceId: surface && surface.id ? surface.id : null,
    corePointer: sourceEntry && sourceEntry.corePointer ? sourceEntry.corePointer : null,
    sourceRef: surface && surface.sourceRef ? surface.sourceRef : null,
    range: cloneRange(sourceEntry && sourceEntry.range),
    metadata
  };
}

function normalizeSurfaceType(surface = {}) {
  const name = String(surface.name || '').trim();
  const lowered = name.toLowerCase();
  const firstSegment = lowered.split(/[._:/]/).filter(Boolean)[0] || lowered;

  if (surface.kind === 'root' || lowered === 'root') {
    return {
      type: 'root',
      known: true,
      alias: lowered !== 'root',
      rawName: name
    };
  }

  const candidate = SURFACE_TYPE_ALIASES[firstSegment] || SURFACE_TYPE_ALIASES[lowered] || null;
  if (candidate && SURFACE_TYPE_PROFILES[candidate]) {
    return {
      type: candidate,
      known: true,
      alias: firstSegment !== candidate,
      rawName: name
    };
  }

  return {
    type: 'unknown',
    known: false,
    alias: false,
    rawName: name || 'unnamed'
  };
}

function createIndex(records = []) {
  const index = new Map();
  records.forEach((record) => {
    if (record && record.id) index.set(record.id, record);
  });
  return index;
}

function validateTemplateRef(coreDocument, surface, templateIndex) {
  const templateRef = surface && surface.scope && surface.scope.template;
  if (!templateRef) return [];

  if (!templateIndex.has(templateRef)) {
    return [createSurfaceDiagnostic(
      coreDocument,
      surface,
      SURFACE_TEMPLATE_REF_MISSING_CODE,
      `Surface "${surface.id}" references missing template "${templateRef}".`
    )];
  }

  return [];
}

function collectLaneRelations(coreDocument, surface, laneIndex, operationIndex) {
  const diagnostics = [];
  const laneRefs = Array.isArray(surface.laneRefs) ? surface.laneRefs : [];
  const lanes = [];
  const operationRefs = [];

  laneRefs.forEach((laneRef) => {
    const lane = laneIndex.get(laneRef);
    if (!lane) {
      diagnostics.push(createSurfaceDiagnostic(
        coreDocument,
        surface,
        SURFACE_LANE_REF_MISSING_CODE,
        `Surface "${surface.id}" references missing lane "${laneRef}".`
      ));
      return;
    }

    lanes.push({
      laneId: lane.id,
      name: lane.name || null,
      weight: lane.weight === undefined ? null : lane.weight,
      operationRefs: Array.isArray(lane.operationRefs) ? lane.operationRefs.slice() : []
    });

    if (!lane.scope || lane.scope.surface !== surface.id) {
      diagnostics.push(createSurfaceDiagnostic(
        coreDocument,
        surface,
        SURFACE_LANE_SCOPE_MISMATCH_CODE,
        `Lane "${lane.id}" does not point back to surface "${surface.id}".`,
        'error',
        { laneSurface: lane.scope && lane.scope.surface || null }
      ));
    }

    (Array.isArray(lane.operationRefs) ? lane.operationRefs : []).forEach((operationRef) => {
      const operation = operationIndex.get(operationRef);
      operationRefs.push(operationRef);
      if (!operation) {
        diagnostics.push(createSurfaceDiagnostic(
          coreDocument,
          surface,
          SURFACE_OPERATION_REF_MISSING_CODE,
          `Lane "${lane.id}" references missing operation "${operationRef}".`
        ));
        return;
      }

      if (!operation.scope || operation.scope.surface !== surface.id) {
        diagnostics.push(createSurfaceDiagnostic(
          coreDocument,
          surface,
          SURFACE_OPERATION_SCOPE_MISMATCH_CODE,
          `Operation "${operationRef}" does not point back to surface "${surface.id}".`,
          'error',
          { operationSurface: operation.scope && operation.scope.surface || null }
        ));
      }
    });
  });

  return {
    diagnostics,
    lanes,
    operationRefs
  };
}

function createSurfaceRecord(coreDocument, surface, indexes) {
  const typeResult = normalizeSurfaceType(surface);
  const profile = SURFACE_TYPE_PROFILES[typeResult.type] || null;
  const relationResult = collectLaneRelations(coreDocument, surface, indexes.lanes, indexes.operations);
  const diagnostics = [
    ...validateTemplateRef(coreDocument, surface, indexes.templates),
    ...relationResult.diagnostics
  ];

  if (!typeResult.known) {
    diagnostics.push(createSurfaceDiagnostic(
      coreDocument,
      surface,
      SURFACE_KIND_UNKNOWN_CODE,
      `Surface "${typeResult.rawName}" does not map to a known vNext surface type.`,
      'error',
      { allowedTypes: listSurfaceTypes() }
    ));
  }

  return {
    schema: RMT_VNEXT_SURFACE_SCHEMA,
    surfaceId: surface.id,
    name: surface.name || null,
    type: typeResult.type,
    knownType: typeResult.known,
    alias: typeResult.alias,
    sourceRef: surface.sourceRef || null,
    scope: surface.scope ? { ...surface.scope } : {},
    profile: profile ? { ...profile } : null,
    hostBinding: {
      mode: 'host-neutral',
      domCoupled: false,
      hostRole: profile ? profile.hostRole : 'unknown',
      stack: profile ? profile.stack : 'unknown',
      modal: profile ? profile.modal : false,
      portal: profile ? profile.portal : false
    },
    laneRefs: Array.isArray(surface.laneRefs) ? surface.laneRefs.slice() : [],
    laneCount: relationResult.lanes.length,
    operationRefs: relationResult.operationRefs,
    operationCount: relationResult.operationRefs.length,
    relations: {
      template: surface.scope && surface.scope.template || null,
      lanes: relationResult.lanes
    },
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    diagnostics
  };
}

function detectDuplicateSurfaceIds(coreDocument, surfaces) {
  const diagnostics = [];
  const seen = new Map();

  surfaces.forEach((surface) => {
    if (!surface || !surface.id) return;
    if (seen.has(surface.id)) {
      diagnostics.push(createSurfaceDiagnostic(
        coreDocument,
        surface,
        SURFACE_ID_DUPLICATE_CODE,
        `Surface id "${surface.id}" is duplicated in the vNext Core document.`
      ));
    } else {
      seen.set(surface.id, surface);
    }
  });

  return diagnostics;
}

function createSurfaceRegistry(coreDocument, options = {}) {
  const surfaces = Array.isArray(coreDocument && coreDocument.surfaces) ? coreDocument.surfaces : [];
  const indexes = {
    templates: createIndex(Array.isArray(coreDocument && coreDocument.templates) ? coreDocument.templates : []),
    lanes: createIndex(Array.isArray(coreDocument && coreDocument.lanes) ? coreDocument.lanes : []),
    operations: createIndex(Array.isArray(coreDocument && coreDocument.operations) ? coreDocument.operations : [])
  };
  const records = surfaces.map((surface) => createSurfaceRecord(coreDocument, surface, indexes));
  const duplicateDiagnostics = detectDuplicateSurfaceIds(coreDocument, surfaces);
  const diagnostics = records.flatMap((record) => record.diagnostics).concat(duplicateDiagnostics);
  const byType = {};

  records.forEach((record) => {
    const list = byType[record.type] || (byType[record.type] = []);
    list.push(record.surfaceId);
  });

  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: RMT_VNEXT_SURFACE_REGISTRY_SCHEMA,
    coreSchema: coreDocument && coreDocument.schema ? coreDocument.schema : RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_SURFACE_WORKPACKAGE,
    status,
    ok: status !== 'blocked',
    registryId: options.registryId || `surfaces:${coreDocument && coreDocument.manifest && coreDocument.manifest.documentId || 'rmt.vnext.document'}`,
    surfaceCount: records.length,
    laneCount: Array.isArray(coreDocument && coreDocument.lanes) ? coreDocument.lanes.length : 0,
    operationCount: Array.isArray(coreDocument && coreDocument.operations) ? coreDocument.operations.length : 0,
    allowedTypes: listSurfaceTypes(),
    byType,
    surfaces: records,
    diagnostics
  };
}

function serializeSurfaceRegistry(registry) {
  return `${JSON.stringify(registry, null, 2)}\n`;
}

function createRmtVNextSurfaceRegistry(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_SURFACE_REGISTRY_SCHEMA,
    surfaceSchema: RMT_VNEXT_SURFACE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_SURFACE_WORKPACKAGE,
    profiles: SURFACE_TYPE_PROFILES,
    aliases: SURFACE_TYPE_ALIASES,
    createRegistry: (coreDocument, options = {}) => createSurfaceRegistry(coreDocument, {
      ...defaultOptions,
      ...options
    }),
    serializeRegistry: serializeSurfaceRegistry
  });
}

module.exports = {
  RMT_VNEXT_SURFACE_MODULE_PATH,
  RMT_VNEXT_SURFACE_PACKAGE_SCRIPT,
  RMT_VNEXT_SURFACE_REGISTRY_SCHEMA,
  RMT_VNEXT_SURFACE_REPORT_SCHEMA,
  RMT_VNEXT_SURFACE_SCHEMA,
  RMT_VNEXT_SURFACE_SUITE_PATH,
  RMT_VNEXT_SURFACE_WORKPACKAGE,
  SURFACE_ID_DUPLICATE_CODE,
  SURFACE_KIND_UNKNOWN_CODE,
  SURFACE_LANE_REF_MISSING_CODE,
  SURFACE_LANE_SCOPE_MISMATCH_CODE,
  SURFACE_OPERATION_REF_MISSING_CODE,
  SURFACE_OPERATION_SCOPE_MISMATCH_CODE,
  SURFACE_TEMPLATE_REF_MISSING_CODE,
  SURFACE_TYPE_ALIASES,
  SURFACE_TYPE_PROFILES,
  createRmtVNextSurfaceRegistry,
  createSurfaceRegistry,
  listSurfaceTypes,
  normalizeSurfaceType,
  serializeSurfaceRegistry
};
