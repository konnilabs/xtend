'use strict';

const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA
} = require('./vnext-enterprise-registry');
const {
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
  RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA
} = require('./vnext-degradation');

const RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA = 'xtend.rmt.vnext-remote-security-policy.v1';
const RMT_VNEXT_REMOTE_SECURITY_POSTURE_SCHEMA = 'xtend.rmt.vnext-remote-security-posture.v1';
const RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA = 'xtend.rmt.vnext-remote-security-report.v1';
const RMT_VNEXT_REMOTE_SECURITY_WORKPACKAGE = 'WP-E16-05';
const RMT_VNEXT_REMOTE_SECURITY_MODULE_PATH = 'tools/rmt-language/vnext-remote-security.js';
const RMT_VNEXT_REMOTE_SECURITY_SUITE_PATH = 'tests/rmt-language/rmt_vnext_remote_security_suite.js';
const RMT_VNEXT_REMOTE_SECURITY_CONTRACT_PATH = 'development/XTendRMT-vNext-Remote-Security-Policy-Contract.md';
const RMT_VNEXT_REMOTE_SECURITY_WP_PATH = 'development/WP-E16-05-Remote-Trust-Boundaries-Manifest-Integrity-und-Sandbox-Policies-haerten.md';
const RMT_VNEXT_REMOTE_SECURITY_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-remote-security';

const REMOTE_SECURITY_TRUST_BOUNDARY_MISSING_CODE = 'rmt.vnext.remote_security.trust_boundary_missing';
const REMOTE_SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE = 'rmt.vnext.remote_security.trust_boundary_unknown';
const REMOTE_SECURITY_ORIGIN_NOT_ALLOWED_CODE = 'rmt.vnext.remote_security.origin_not_allowed';
const REMOTE_SECURITY_INTEGRITY_MISSING_CODE = 'rmt.vnext.remote_security.integrity_missing';
const REMOTE_SECURITY_CSP_MISSING_CODE = 'rmt.vnext.remote_security.csp_missing';
const REMOTE_SECURITY_SANDBOX_CONFLICT_CODE = 'rmt.vnext.remote_security.sandbox_conflict';
const REMOTE_SECURITY_CAPABILITY_ESCALATION_CODE = 'rmt.vnext.remote_security.capability_escalation';
const REMOTE_SECURITY_EVENT_PAYLOAD_MISSING_CODE = 'rmt.vnext.remote_security.event_payload_missing';
const REMOTE_SECURITY_DEGRADATION_BLOCKED_CODE = 'rmt.vnext.remote_security.degradation_blocked';

const REMOTE_SECURITY_TRUST_BOUNDARY = 'xtend.security.remote-surface.v1';
const REMOTE_SECURITY_CAPABILITY_MODE = 'deny-by-default';
const REMOTE_SECURITY_ALLOWED_INTEGRITY_ALGORITHMS = Object.freeze(['sha256', 'sha384', 'sha512']);

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
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

function normalizeList(values) {
  return toArray(values).map((value) => {
    if (typeof value === 'string') return normalizeString(value);
    return normalizeString(value && (value.id || value.name || value.capability || value.event || value.payload));
  }).filter(Boolean);
}

function lookupPolicy(policies, surface) {
  const source = policies && typeof policies === 'object' ? policies : {};
  const keys = [
    surface.enterpriseSurfaceId,
    surface.surfaceId,
    surface.name,
    surface.remote && surface.remote.remoteId,
    surface.remote && surface.remote.manifestId
  ].filter(Boolean);

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
  }

  return null;
}

function findDegradationSurface(degradationReport, surface) {
  const surfaces = toArray(degradationReport && degradationReport.surfaces);
  return surfaces.find((entry) => entry.enterpriseSurfaceId === surface.enterpriseSurfaceId || entry.surfaceId === surface.surfaceId || entry.name === surface.name) || null;
}

function createRemoteSecurityDiagnostic(surface, code, message, severity = 'error', metadata = {}) {
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_SECURITY_WORKPACKAGE,
    severity,
    code,
    message,
    enterpriseSurfaceId: surface && surface.enterpriseSurfaceId || null,
    surfaceId: surface && surface.surfaceId || null,
    surfaceName: surface && surface.name || null,
    field: metadata.field || null,
    metadata
  };
}

function normalizeCsp(csp = {}) {
  const source = csp && typeof csp === 'object' ? csp : {};
  return {
    requireTrustedTypes: source.requireTrustedTypes === true,
    defaultSrc: normalizeList(source.defaultSrc || ["'self'"]),
    scriptSrc: normalizeList(source.scriptSrc || ["'self'"]),
    connectSrc: normalizeList(source.connectSrc || ["'self'"]),
    objectSrc: normalizeList(source.objectSrc || ["'none'"])
  };
}

function normalizeSandbox(sandbox = {}) {
  const source = sandbox && typeof sandbox === 'object' ? sandbox : {};
  return {
    mode: normalizeString(source.mode || 'remote-surface-isolated') || 'remote-surface-isolated',
    allowScripts: source.allowScripts === true,
    allowSameOrigin: source.allowSameOrigin === true,
    allowPopups: source.allowPopups === true,
    allowForms: source.allowForms === true
  };
}

function normalizePolicy(policy = {}, surface = {}) {
  const source = policy && typeof policy === 'object' ? policy : {};
  return {
    schema: RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
    trustBoundary: normalizeString(source.trustBoundary || REMOTE_SECURITY_TRUST_BOUNDARY),
    allowedOrigins: normalizeList(source.allowedOrigins),
    allowedIntegrityAlgorithms: normalizeList(source.allowedIntegrityAlgorithms || REMOTE_SECURITY_ALLOWED_INTEGRITY_ALGORITHMS),
    capabilityMode: normalizeString(source.capabilityMode || REMOTE_SECURITY_CAPABILITY_MODE) || REMOTE_SECURITY_CAPABILITY_MODE,
    allowedCapabilities: normalizeList(source.allowedCapabilities),
    csp: normalizeCsp(source.csp),
    sandbox: normalizeSandbox(source.sandbox),
    remoteEventPayloadsRequired: source.remoteEventPayloadsRequired !== false
  };
}

function validateCsp(surface, policy, diagnostics) {
  const csp = policy.csp;
  const origin = surface.remote && surface.remote.origin;
  const hasTrustedTypes = csp.requireTrustedTypes === true;
  const blocksObjects = csp.objectSrc.includes("'none'");
  const hasDefaultSelf = csp.defaultSrc.includes("'self'");
  const connectsOrigin = !origin || csp.connectSrc.includes(origin);

  if (!hasTrustedTypes || !blocksObjects || !hasDefaultSelf || !connectsOrigin) {
    diagnostics.push(createRemoteSecurityDiagnostic(
      surface,
      REMOTE_SECURITY_CSP_MISSING_CODE,
      `Remote surface "${surface.name}" must require Trusted Types, block object-src and constrain remote connections.`,
      'error',
      { field: 'csp', csp: cloneJson(csp) }
    ));
  }
}

function validateSandbox(surface, policy, diagnostics) {
  const sandbox = policy.sandbox;
  if (sandbox.allowScripts || sandbox.allowSameOrigin || sandbox.allowPopups || sandbox.allowForms) {
    diagnostics.push(createRemoteSecurityDiagnostic(
      surface,
      REMOTE_SECURITY_SANDBOX_CONFLICT_CODE,
      `Remote surface "${surface.name}" sandbox must not allow scripts, same-origin, popups or forms by default.`,
      'error',
      { field: 'sandbox', sandbox: cloneJson(sandbox) }
    ));
  }
}

function validateEvents(surface, policy, diagnostics) {
  if (!policy.remoteEventPayloadsRequired) return;
  const events = toArray(surface.events && surface.events.emits).concat(toArray(surface.events && surface.events.consumes));
  events.forEach((event, index) => {
    if (!event || !event.payload) {
      diagnostics.push(createRemoteSecurityDiagnostic(
        surface,
        REMOTE_SECURITY_EVENT_PAYLOAD_MISSING_CODE,
        `Remote event on surface "${surface.name}" must declare a payload schema.`,
        'error',
        { field: `events.${index}` }
      ));
    }
  });
}

function createRemoteSecurityPosture(surface, options = {}) {
  const policy = normalizePolicy(lookupPolicy(options.policies, surface), surface);
  const degradationSurface = findDegradationSurface(options.degradationReport, surface);
  const diagnostics = [];
  const remote = surface.remote || {};
  const integrity = remote.integrity || {};

  if (!remote.trustBoundary) {
    diagnostics.push(createRemoteSecurityDiagnostic(
      surface,
      REMOTE_SECURITY_TRUST_BOUNDARY_MISSING_CODE,
      `Remote surface "${surface.name}" must declare a remote trust boundary.`,
      'error',
      { field: 'remote.trustBoundary' }
    ));
  } else if (remote.trustBoundary !== policy.trustBoundary || remote.trustBoundary !== REMOTE_SECURITY_TRUST_BOUNDARY) {
    diagnostics.push(createRemoteSecurityDiagnostic(
      surface,
      REMOTE_SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE,
      `Remote surface "${surface.name}" uses unsupported trust boundary "${remote.trustBoundary}".`,
      'error',
      { field: 'remote.trustBoundary', expected: REMOTE_SECURITY_TRUST_BOUNDARY }
    ));
  }

  if (!remote.origin || !policy.allowedOrigins.includes(remote.origin)) {
    diagnostics.push(createRemoteSecurityDiagnostic(
      surface,
      REMOTE_SECURITY_ORIGIN_NOT_ALLOWED_CODE,
      `Remote surface "${surface.name}" origin "${remote.origin || 'missing'}" is not allowed.`,
      'error',
      { field: 'remote.origin', allowedOrigins: policy.allowedOrigins }
    ));
  }

  if (!integrity.algorithm || !integrity.digest || !policy.allowedIntegrityAlgorithms.includes(integrity.algorithm)) {
    diagnostics.push(createRemoteSecurityDiagnostic(
      surface,
      REMOTE_SECURITY_INTEGRITY_MISSING_CODE,
      `Remote surface "${surface.name}" must declare allowed manifest integrity.`,
      'error',
      { field: 'remote.integrity', allowedAlgorithms: policy.allowedIntegrityAlgorithms }
    ));
  }

  validateCsp(surface, policy, diagnostics);
  validateSandbox(surface, policy, diagnostics);

  const surfaceCapabilities = normalizeList(surface.capabilities);
  const escalated = surfaceCapabilities.filter((capability) => !policy.allowedCapabilities.includes(capability));
  if (policy.capabilityMode !== REMOTE_SECURITY_CAPABILITY_MODE || escalated.length > 0) {
    diagnostics.push(createRemoteSecurityDiagnostic(
      surface,
      REMOTE_SECURITY_CAPABILITY_ESCALATION_CODE,
      `Remote surface "${surface.name}" has capabilities outside the deny-by-default policy.`,
      'error',
      { field: 'capabilities', capabilityMode: policy.capabilityMode, escalated }
    ));
  }

  validateEvents(surface, policy, diagnostics);

  if (degradationSurface && degradationSurface.state === 'blocked') {
    diagnostics.push(createRemoteSecurityDiagnostic(
      surface,
      REMOTE_SECURITY_DEGRADATION_BLOCKED_CODE,
      `Remote surface "${surface.name}" is blocked by degradation and cannot pass remote security posture.`,
      'error',
      { field: 'degradation.state', state: degradationSurface.state }
    ));
  }

  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';
  return {
    schema: RMT_VNEXT_REMOTE_SECURITY_POSTURE_SCHEMA,
    enterpriseSurfaceId: surface.enterpriseSurfaceId,
    surfaceId: surface.surfaceId,
    name: surface.name,
    owner: cloneJson(surface.owner || null),
    status,
    remote: {
      manifestId: remote.manifestId || null,
      remoteId: remote.remoteId || null,
      origin: remote.origin || null,
      trustBoundary: remote.trustBoundary || null,
      integrity: cloneJson(integrity || null)
    },
    policy,
    csp: policy.csp,
    sandbox: policy.sandbox,
    capabilityMode: policy.capabilityMode,
    allowedCapabilities: policy.allowedCapabilities,
    surfaceCapabilities,
    degradationState: degradationSurface && degradationSurface.state || null,
    kernelBoundary: {
      remoteRuntimeExecution: false,
      hostAdapterRequired: true,
      networkRequiredByKernel: false
    },
    diagnostics
  };
}

function createRmtVNextRemoteSecurityReport(input = {}, options = {}) {
  const enterpriseRegistry = input.enterpriseRegistry || {};
  const remoteSurfaces = toArray(enterpriseRegistry.surfaces).filter((surface) => surface.kind === 'remote' || surface.remote && surface.remote.enabled);
  const postures = remoteSurfaces.map((surface) => createRemoteSecurityPosture(surface, {
    policies: input.policies || {},
    degradationReport: input.degradationReport,
    ...options
  }));
  const diagnostics = postures.flatMap((posture) => posture.diagnostics);
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA,
    policySchema: RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
    postureSchema: RMT_VNEXT_REMOTE_SECURITY_POSTURE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    enterpriseRegistrySchema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    enterpriseSurfaceSchema: RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
    degradationReportSchema: RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
    degradationSurfaceSchema: RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_SECURITY_WORKPACKAGE,
    registryId: enterpriseRegistry.registryId || null,
    status,
    ok: status !== 'blocked',
    remoteSurfaceCount: postures.length,
    blockedRemoteSurfaceIds: postures.filter((posture) => posture.status === 'blocked').map((posture) => posture.enterpriseSurfaceId),
    trustBoundary: REMOTE_SECURITY_TRUST_BOUNDARY,
    capabilityMode: REMOTE_SECURITY_CAPABILITY_MODE,
    postures,
    diagnostics
  };
}

function serializeRemoteSecurityReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

function createRmtVNextRemoteSecurityAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
    reportSchema: RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA,
    postureSchema: RMT_VNEXT_REMOTE_SECURITY_POSTURE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    enterpriseRegistrySchema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    degradationReportSchema: RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_SECURITY_WORKPACKAGE,
    trustBoundary: REMOTE_SECURITY_TRUST_BOUNDARY,
    capabilityMode: REMOTE_SECURITY_CAPABILITY_MODE,
    createReport: (input, options = {}) => createRmtVNextRemoteSecurityReport({
      ...defaultOptions,
      ...input
    }, options),
    serializeReport: serializeRemoteSecurityReport
  });
}

module.exports = {
  REMOTE_SECURITY_ALLOWED_INTEGRITY_ALGORITHMS,
  REMOTE_SECURITY_CAPABILITY_ESCALATION_CODE,
  REMOTE_SECURITY_CAPABILITY_MODE,
  REMOTE_SECURITY_CSP_MISSING_CODE,
  REMOTE_SECURITY_DEGRADATION_BLOCKED_CODE,
  REMOTE_SECURITY_EVENT_PAYLOAD_MISSING_CODE,
  REMOTE_SECURITY_INTEGRITY_MISSING_CODE,
  REMOTE_SECURITY_ORIGIN_NOT_ALLOWED_CODE,
  REMOTE_SECURITY_SANDBOX_CONFLICT_CODE,
  REMOTE_SECURITY_TRUST_BOUNDARY,
  REMOTE_SECURITY_TRUST_BOUNDARY_MISSING_CODE,
  REMOTE_SECURITY_TRUST_BOUNDARY_UNKNOWN_CODE,
  RMT_VNEXT_REMOTE_SECURITY_CONTRACT_PATH,
  RMT_VNEXT_REMOTE_SECURITY_MODULE_PATH,
  RMT_VNEXT_REMOTE_SECURITY_PACKAGE_SCRIPT,
  RMT_VNEXT_REMOTE_SECURITY_POLICY_SCHEMA,
  RMT_VNEXT_REMOTE_SECURITY_POSTURE_SCHEMA,
  RMT_VNEXT_REMOTE_SECURITY_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_SECURITY_SUITE_PATH,
  RMT_VNEXT_REMOTE_SECURITY_WORKPACKAGE,
  RMT_VNEXT_REMOTE_SECURITY_WP_PATH,
  createRmtVNextRemoteSecurityAdapter,
  createRmtVNextRemoteSecurityReport,
  serializeRemoteSecurityReport
};
