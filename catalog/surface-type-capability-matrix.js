const {
  KERNEL_BOUNDARY
} = require('./epic12-rc0-gate-matrix');

const SURFACE_TYPE_CAPABILITY_MATRIX_SCHEMA = 'xtend.surface.type-capability-matrix.v1';
const SURFACE_TYPE_CAPABILITY_MATRIX_REPORT_SCHEMA = 'xtend.surface.type-capability-matrix-report.v1';

const REGION_KINDS = Object.freeze(['root', 'workspace', 'page', 'card', 'list', 'region', 'overlay-host']);
const OVERLAY_KINDS = Object.freeze(['modal', 'dialog', 'drawer', 'popover', 'tooltip', 'toast', 'lightbox', 'menu']);

const SURFACE_TYPE_CAPABILITY_ROWS = Object.freeze([
  Object.freeze({
    kind: 'window',
    runtimeType: 'window',
    componentTag: 'x-surface-window',
    managerSlot: 'windows',
    layer: 'workspace',
    stackPolicy: 'focus-stack',
    layoutEligible: true,
    resourceOwnership: 'surface-instance',
    portalPolicy: 'stacked'
  }),
  Object.freeze({
    kind: 'panel',
    runtimeType: 'side-panel',
    componentTag: 'x-side-panel',
    managerSlot: 'panels',
    layer: 'panel',
    stackPolicy: 'docked-or-overlay-panel',
    layoutEligible: true,
    resourceOwnership: 'surface-instance',
    portalPolicy: 'nonmodal'
  }),
  Object.freeze({
    kind: 'side-panel',
    runtimeType: 'side-panel',
    componentTag: 'x-side-panel',
    managerSlot: 'panels',
    layer: 'panel',
    stackPolicy: 'docked-or-overlay-panel',
    layoutEligible: true,
    resourceOwnership: 'surface-instance',
    portalPolicy: 'nonmodal'
  }),
  ...REGION_KINDS.map((kind) => Object.freeze({
    kind,
    runtimeType: 'region',
    componentTag: 'x-surface-region',
    managerSlot: 'default',
    layer: kind === 'overlay-host' ? 'overlay-host' : 'workspace',
    stackPolicy: kind === 'overlay-host' ? 'portal-host' : 'managed-region',
    layoutEligible: ['workspace', 'page', 'card', 'list', 'region'].includes(kind),
    resourceOwnership: 'surface-instance',
    portalPolicy: kind === 'overlay-host' ? 'clipping-escape' : 'stacked'
  })),
  ...OVERLAY_KINDS.map((kind) => Object.freeze({
    kind,
    runtimeType: kind,
    componentTag: `x-${kind}`,
    managerSlot: 'overlays',
    layer: kind === 'toast' ? 'toast-region' : (kind === 'drawer' ? 'panel-overlay' : 'overlay'),
    stackPolicy: kind === 'toast' ? 'toast-region' : (kind === 'modal' || kind === 'dialog' || kind === 'lightbox' ? 'modal' : 'nonmodal'),
    layoutEligible: false,
    resourceOwnership: 'overlay-instance',
    portalPolicy: kind === 'toast' ? 'toast-region' : (kind === 'popover' || kind === 'tooltip' || kind === 'menu' ? 'clipping-escape' : 'modal')
  }))
]);

const SURFACE_TYPE_CAPABILITY_INDEX = Object.freeze(Object.fromEntries(
  SURFACE_TYPE_CAPABILITY_ROWS.map((row) => [row.kind, row])
));

function withSyntax(row) {
  return Object.freeze({
    schema: SURFACE_TYPE_CAPABILITY_MATRIX_SCHEMA,
    ...row,
    rmtSyntax: `surface <id> kind ${row.kind} component ${row.componentTag}`,
    lowersTo: {
      type: row.runtimeType,
      kind: row.kind,
      component: row.componentTag,
      managerSlot: row.managerSlot,
      portalPolicy: row.portalPolicy
    },
    kernelBoundary: KERNEL_BOUNDARY
  });
}

function listSurfaceTypeCapabilityRows() {
  return SURFACE_TYPE_CAPABILITY_ROWS.map(withSyntax);
}

function resolveSurfaceTypeCapability(kind) {
  const key = String(kind || '').trim().toLowerCase();
  const row = SURFACE_TYPE_CAPABILITY_INDEX[key] || null;
  return row ? withSyntax(row) : null;
}

function surfaceKindToRuntimeType(kind, fallback = 'window') {
  const row = resolveSurfaceTypeCapability(kind);
  return row ? row.runtimeType : fallback;
}

function surfaceKindToComponentTag(kind, fallback = 'x-surface-window') {
  const row = resolveSurfaceTypeCapability(kind);
  return row ? row.componentTag : fallback;
}

function createSurfaceTypeCapabilityMatrix(options = {}) {
  const rows = listSurfaceTypeCapabilityRows();
  return {
    schema: SURFACE_TYPE_CAPABILITY_MATRIX_SCHEMA,
    reportSchema: SURFACE_TYPE_CAPABILITY_MATRIX_REPORT_SCHEMA,
    generatedAt: options.generatedAt || 'static-local',
    rowCount: rows.length,
    runtimeTypes: Array.from(new Set(rows.map((row) => row.runtimeType))),
    regionKinds: REGION_KINDS.slice(),
    overlayKinds: OVERLAY_KINDS.slice(),
    rows,
    policies: {
      additiveCompatibility: true,
      controllerIsSingleRegistry: true,
      rmtKernelImportsXtendTypes: false,
      genericUiComponent: 'x-surface-region',
      portalPolicyComponent: 'x-surface-portal'
    },
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateSurfaceTypeCapabilityMatrix(matrix = createSurfaceTypeCapabilityMatrix()) {
  const errors = [];
  const rows = Array.isArray(matrix && matrix.rows) ? matrix.rows : [];
  const byKind = new Map(rows.map((row) => [row.kind, row]));

  if (!matrix || matrix.schema !== SURFACE_TYPE_CAPABILITY_MATRIX_SCHEMA) errors.push(`schema must be ${SURFACE_TYPE_CAPABILITY_MATRIX_SCHEMA}`);
  if (!matrix || matrix.reportSchema !== SURFACE_TYPE_CAPABILITY_MATRIX_REPORT_SCHEMA) errors.push(`reportSchema must be ${SURFACE_TYPE_CAPABILITY_MATRIX_REPORT_SCHEMA}`);
  ['window', 'panel', 'side-panel', ...REGION_KINDS, ...OVERLAY_KINDS].forEach((kind) => {
    if (!byKind.has(kind)) errors.push(`surface kind missing: ${kind}`);
  });
  REGION_KINDS.forEach((kind) => {
    const row = byKind.get(kind);
    if (!row || row.runtimeType !== 'region') errors.push(`${kind} must lower to region`);
    if (!row || row.componentTag !== 'x-surface-region') errors.push(`${kind} must materialize as x-surface-region`);
  });
  OVERLAY_KINDS.forEach((kind) => {
    const row = byKind.get(kind);
    if (!row || row.runtimeType !== kind) errors.push(`${kind} must keep a matching runtime type`);
    if (!row || row.managerSlot !== 'overlays') errors.push(`${kind} must use overlays slot`);
  });
  rows.forEach((row) => {
    if (!row.rmtSyntax || !row.rmtSyntax.includes(`kind ${row.kind}`) || !row.rmtSyntax.includes(`component ${row.componentTag}`)) {
      errors.push(`${row.kind} must expose modern RMT syntax mapping`);
    }
    if (row.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`${row.kind} must keep kernel boundary`);
  });
  if (!matrix || matrix.policies.controllerIsSingleRegistry !== true) errors.push('SurfaceController must remain the single registry');
  if (!matrix || matrix.policies.rmtKernelImportsXtendTypes !== false) errors.push('RMT kernel must not import XTend types');
  if (!matrix || matrix.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);

  return {
    schema: SURFACE_TYPE_CAPABILITY_MATRIX_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedAt: 'static-local',
    rowCount: rows.length
  };
}

module.exports = {
  KERNEL_BOUNDARY,
  OVERLAY_KINDS,
  REGION_KINDS,
  SURFACE_TYPE_CAPABILITY_MATRIX_REPORT_SCHEMA,
  SURFACE_TYPE_CAPABILITY_MATRIX_SCHEMA,
  SURFACE_TYPE_CAPABILITY_ROWS,
  createSurfaceTypeCapabilityMatrix,
  listSurfaceTypeCapabilityRows,
  resolveSurfaceTypeCapability,
  surfaceKindToComponentTag,
  surfaceKindToRuntimeType,
  validateSurfaceTypeCapabilityMatrix
};
