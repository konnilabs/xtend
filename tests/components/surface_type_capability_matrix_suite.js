const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  resolveRootDir
} = require('../utils/files');
const {
  KERNEL_BOUNDARY,
  OVERLAY_KINDS,
  REGION_KINDS,
  SURFACE_TYPE_CAPABILITY_MATRIX_REPORT_SCHEMA,
  SURFACE_TYPE_CAPABILITY_MATRIX_SCHEMA,
  createSurfaceTypeCapabilityMatrix,
  resolveSurfaceTypeCapability,
  surfaceKindToComponentTag,
  surfaceKindToRuntimeType,
  validateSurfaceTypeCapabilityMatrix
} = require('../../catalog/surface-type-capability-matrix');

function assertKind(context, kind, runtimeType, componentTag, slot) {
  const row = resolveSurfaceTypeCapability(kind);
  context.assert(row && row.kind === kind, `${kind}: matrix row exists`);
  context.assert(row && row.runtimeType === runtimeType, `${kind}: runtime type is ${runtimeType}`);
  context.assert(row && row.componentTag === componentTag, `${kind}: component tag is ${componentTag}`);
  context.assert(row && row.managerSlot === slot, `${kind}: manager slot is ${slot}`);
  context.assert(row && row.rmtSyntax === `surface <id> kind ${kind} component ${componentTag}`, `${kind}: modern RMT syntax is explicit`);
  context.assert(row && row.kernelBoundary === KERNEL_BOUNDARY, `${kind}: kernel boundary is stable`);
}

function runSurfaceTypeCapabilityMatrixSuite(options = {}) {
  resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-type-capability-matrix',
    label: 'Surface type capability matrix'
  });
  const matrix = createSurfaceTypeCapabilityMatrix();
  const validation = validateSurfaceTypeCapabilityMatrix(matrix);

  context.assert(matrix.schema === SURFACE_TYPE_CAPABILITY_MATRIX_SCHEMA, 'matrix exposes stable schema');
  context.assert(matrix.reportSchema === SURFACE_TYPE_CAPABILITY_MATRIX_REPORT_SCHEMA, 'matrix exposes stable report schema');
  context.assert(validation.ok === true, 'matrix validates');
  context.assert(matrix.kernelBoundary === KERNEL_BOUNDARY, 'matrix keeps RMT kernel boundary');
  context.assert(matrix.policies.controllerIsSingleRegistry === true, 'SurfaceController remains the single registry');
  context.assert(matrix.policies.rmtKernelImportsXtendTypes === false, 'matrix forbids XTend imports in the RMT kernel');
  context.assert(matrix.policies.genericUiComponent === 'x-surface-region', 'generic app UI uses x-surface-region');
  context.assert(matrix.policies.portalPolicyComponent === 'x-surface-portal', 'portal policies use x-surface-portal');

  assertKind(context, 'window', 'window', 'x-surface-window', 'windows');
  assertKind(context, 'panel', 'side-panel', 'x-side-panel', 'panels');
  assertKind(context, 'side-panel', 'side-panel', 'x-side-panel', 'panels');

  REGION_KINDS.forEach((kind) => {
    assertKind(context, kind, 'region', 'x-surface-region', 'default');
  });
  OVERLAY_KINDS.forEach((kind) => {
    assertKind(context, kind, kind, `x-${kind}`, 'overlays');
  });

  context.assert(surfaceKindToRuntimeType('card') === 'region', 'card kind lowers to region');
  context.assert(surfaceKindToRuntimeType('toast') === 'toast', 'toast kind keeps runtime type');
  context.assert(surfaceKindToComponentTag('lightbox') === 'x-lightbox', 'lightbox maps to x-lightbox');
  context.assert(matrix.rows.some((row) => row.kind === 'overlay-host' && row.portalPolicy === 'clipping-escape'), 'overlay-host maps to clipping escape portal policy');
  context.assert(matrix.rows.some((row) => row.kind === 'toast' && row.portalPolicy === 'toast-region'), 'toast maps to toast-region portal policy');

  return context.result({
    schema: SURFACE_TYPE_CAPABILITY_MATRIX_REPORT_SCHEMA,
    rowCount: matrix.rowCount,
    runtimeTypes: matrix.runtimeTypes
  });
}

function printSurfaceTypeCapabilityMatrixReport(result) {
  printSuiteReport(result, {
    successTitle: 'Surface Type Capability Matrix erfolgreich.',
    failureTitle: 'Surface Type Capability Matrix fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceTypeCapabilityMatrixReport,
  runSurfaceTypeCapabilityMatrixSuite
};

if (require.main === module) {
  const result = runSurfaceTypeCapabilityMatrixSuite();
  printSurfaceTypeCapabilityMatrixReport(result);
  process.exit(result.ok ? 0 : 1);
}
