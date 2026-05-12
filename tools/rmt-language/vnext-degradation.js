'use strict';

const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA
} = require('./vnext-enterprise-registry');

const RMT_VNEXT_DEGRADATION_POLICY_SCHEMA = 'xtend.rmt.vnext-degradation-policy.v1';
const RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA = 'xtend.rmt.vnext-degradation-surface.v1';
const RMT_VNEXT_DEGRADATION_REPORT_SCHEMA = 'xtend.rmt.vnext-degradation-report.v1';
const RMT_VNEXT_DEGRADATION_WORKPACKAGE = 'WP-E16-04';
const RMT_VNEXT_DEGRADATION_MODULE_PATH = 'tools/rmt-language/vnext-degradation.js';
const RMT_VNEXT_DEGRADATION_SUITE_PATH = 'tests/rmt-language/rmt_vnext_degradation_suite.js';
const RMT_VNEXT_DEGRADATION_CONTRACT_PATH = 'development/XTendRMT-vNext-Degradation-Policy-Contract.md';
const RMT_VNEXT_DEGRADATION_WP_PATH = 'development/WP-E16-04-Versionierung-Compatibility-und-Graceful-Degradation-modellieren.md';
const RMT_VNEXT_DEGRADATION_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-degradation';

const DEGRADATION_FALLBACK_MISSING_CODE = 'rmt.vnext.degradation.fallback_missing';
const DEGRADATION_VERSION_MISMATCH_CODE = 'rmt.vnext.degradation.version_mismatch';
const DEGRADATION_SHELL_VERSION_UNSUPPORTED_CODE = 'rmt.vnext.degradation.shell_version_unsupported';
const DEGRADATION_CAPABILITY_MISSING_CODE = 'rmt.vnext.degradation.capability_missing';
const DEGRADATION_SURFACE_BLOCKED_CODE = 'rmt.vnext.degradation.registry_surface_blocked';
const DEGRADATION_EVENT_RESTRICTED_CODE = 'rmt.vnext.degradation.event_restricted';

const DEGRADATION_STATES = Object.freeze([
  'full',
  'compatible',
  'degraded',
  'blocked'
]);

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

function parseVersion(version) {
  const match = normalizeString(version).match(/^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return null;
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;
  return 0;
}

function sameMajor(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  return Boolean(a && b && a.major === b.major);
}

function satisfiesRange(version, range) {
  const active = normalizeString(version);
  const expected = normalizeString(range);
  if (!expected || !active) return false;
  if (expected === '*') return true;

  if (expected.startsWith('^')) {
    const base = expected.slice(1);
    const comparison = compareVersions(active, base);
    return comparison !== null && sameMajor(active, base) && comparison >= 0;
  }

  if (expected.startsWith('~')) {
    const base = parseVersion(expected.slice(1));
    const parsed = parseVersion(active);
    const comparison = compareVersions(active, expected.slice(1));
    return Boolean(parsed && base && comparison !== null && parsed.major === base.major && parsed.minor === base.minor && comparison >= 0);
  }

  if (expected.startsWith('>=')) {
    const comparison = compareVersions(active, expected.slice(2));
    return comparison !== null && comparison >= 0;
  }

  return active === expected;
}

function isAtLeast(version, minimum) {
  const required = normalizeString(minimum);
  if (!required) return true;
  const result = compareVersions(version, required);
  return result !== null && result >= 0;
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

function normalizeCapabilities(values) {
  return toArray(values).map((value) => {
    if (typeof value === 'string') return normalizeString(value);
    return normalizeString(value && (value.id || value.capability || value.name));
  }).filter(Boolean);
}

function normalizeEventName(event) {
  if (typeof event === 'string') return normalizeString(event);
  return normalizeString(event && (event.event || event.id || event.name));
}

function createDegradationDiagnostic(surface, code, message, severity = 'error', metadata = {}) {
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
    workpackage: RMT_VNEXT_DEGRADATION_WORKPACKAGE,
    severity,
    code,
    message,
    enterpriseSurfaceId: surface && surface.enterpriseSurfaceId || null,
    surfaceId: surface && surface.surfaceId || null,
    surfaceName: surface && surface.name || null,
    field: metadata.field || null,
    recoverable: metadata.recoverable === true,
    metadata
  };
}

function normalizePolicy(policy = {}, surface = {}) {
  const source = policy && typeof policy === 'object' ? policy : {};
  const fallback = source.fallback === undefined ? surface.fallback : source.fallback;
  return {
    schema: RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
    minShellVersion: normalizeString(source.minShellVersion),
    requiredCapabilities: normalizeCapabilities(source.requiredCapabilities),
    optionalCapabilities: normalizeCapabilities(source.optionalCapabilities),
    fallback: fallback ? cloneJson(fallback) : null,
    eventPolicy: source.eventPolicy || {
      whenDegraded: 'block-unlisted',
      allow: []
    },
    dataSourcePolicy: source.dataSourcePolicy || {
      whenDegraded: 'read-only'
    }
  };
}

function createVersionCheck(surface) {
  const active = surface.version && surface.version.active || '';
  const expected = surface.version && (surface.version.expected || surface.version.range) || '';
  const satisfies = satisfiesRange(active, expected);
  const sameMajorVersion = sameMajor(active, expected.replace(/^[^0-9]*/, ''));
  return {
    active,
    expected,
    satisfies,
    sameMajor: sameMajorVersion,
    status: satisfies ? 'matched' : sameMajorVersion ? 'compatible-major' : 'mismatch'
  };
}

function createEventResolution(surface, state, policy) {
  const emits = toArray(surface.events && surface.events.emits).map(normalizeEventName).filter(Boolean);
  const consumes = toArray(surface.events && surface.events.consumes).map(normalizeEventName).filter(Boolean);
  const allEvents = emits.concat(consumes);
  const allowed = normalizeCapabilities(policy.eventPolicy && (policy.eventPolicy.allow || policy.eventPolicy.allowed));
  const restrict = state === 'degraded' || state === 'blocked';
  const blocked = restrict ? allEvents.filter((event) => !allowed.includes(event)) : [];

  return {
    mode: restrict ? policy.eventPolicy.whenDegraded || 'block-unlisted' : 'normal',
    allowed: restrict ? allEvents.filter((event) => allowed.includes(event)) : allEvents,
    blocked
  };
}

function createDataSourceResolution(surface, state, policy) {
  const dataSources = toArray(surface.dataSources);
  return {
    mode: state === 'degraded' || state === 'blocked' ? policy.dataSourcePolicy.whenDegraded || 'read-only' : 'normal',
    count: dataSources.length,
    blocked: state === 'blocked' ? dataSources : []
  };
}

function createDegradationSurface(surface, options = {}) {
  const policy = normalizePolicy(lookupPolicy(options.policies, surface), surface);
  const availableCapabilities = normalizeCapabilities(options.availableCapabilities);
  const version = createVersionCheck(surface);
  const shellVersion = normalizeString(options.shellVersion || '0.0.0');
  const shellSupported = isAtLeast(shellVersion, policy.minShellVersion);
  const missingRequiredCapabilities = policy.requiredCapabilities.filter((capability) => !availableCapabilities.includes(capability));
  const missingOptionalCapabilities = policy.optionalCapabilities.filter((capability) => !availableCapabilities.includes(capability));
  const fallbackResolved = Boolean(policy.fallback && policy.fallback.ref);
  const diagnostics = [];
  let state = 'full';

  if (surface.status === 'blocked') {
    state = 'blocked';
    diagnostics.push(createDegradationDiagnostic(
      surface,
      DEGRADATION_SURFACE_BLOCKED_CODE,
      `Surface "${surface.name}" is already blocked in the enterprise registry.`,
      'error',
      { field: 'status' }
    ));
  }

  if (surface.kind === 'remote' && !fallbackResolved) {
    state = 'blocked';
    diagnostics.push(createDegradationDiagnostic(
      surface,
      DEGRADATION_FALLBACK_MISSING_CODE,
      `Remote surface "${surface.name}" must resolve a fallback before degradation can be safe.`,
      'error',
      { field: 'fallback' }
    ));
  }

  if (!version.satisfies) {
    if (state !== 'blocked') state = fallbackResolved || surface.kind !== 'remote' ? 'degraded' : 'blocked';
    diagnostics.push(createDegradationDiagnostic(
      surface,
      DEGRADATION_VERSION_MISMATCH_CODE,
      `Surface "${surface.name}" active version "${version.active}" does not satisfy "${version.expected}".`,
      'error',
      { field: 'version', recoverable: state !== 'blocked', version }
    ));
  }

  if (!shellSupported) {
    if (state !== 'blocked') state = fallbackResolved || surface.kind !== 'remote' ? 'degraded' : 'blocked';
    diagnostics.push(createDegradationDiagnostic(
      surface,
      DEGRADATION_SHELL_VERSION_UNSUPPORTED_CODE,
      `Surface "${surface.name}" requires shell version "${policy.minShellVersion}" but host is "${shellVersion}".`,
      'error',
      { field: 'minShellVersion', recoverable: state !== 'blocked', minShellVersion: policy.minShellVersion, shellVersion }
    ));
  }

  if (missingRequiredCapabilities.length > 0) {
    if (state !== 'blocked') state = fallbackResolved || surface.kind !== 'remote' ? 'degraded' : 'blocked';
    diagnostics.push(createDegradationDiagnostic(
      surface,
      DEGRADATION_CAPABILITY_MISSING_CODE,
      `Surface "${surface.name}" is missing required capabilities: ${missingRequiredCapabilities.join(', ')}.`,
      'error',
      { field: 'requiredCapabilities', recoverable: state !== 'blocked', missingRequiredCapabilities }
    ));
  }

  if (state === 'full' && missingOptionalCapabilities.length > 0) {
    state = 'compatible';
  }

  const events = createEventResolution(surface, state, policy);
  if (events.blocked.length > 0) {
    diagnostics.push(createDegradationDiagnostic(
      surface,
      DEGRADATION_EVENT_RESTRICTED_CODE,
      `Surface "${surface.name}" has restricted events under degradation: ${events.blocked.join(', ')}.`,
      'warning',
      { field: 'events', blockedEvents: events.blocked }
    ));
  }

  return {
    schema: RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA,
    enterpriseSurfaceId: surface.enterpriseSurfaceId,
    surfaceId: surface.surfaceId,
    name: surface.name,
    kind: surface.kind,
    state,
    owner: cloneJson(surface.owner || null),
    version,
    shell: {
      active: shellVersion,
      min: policy.minShellVersion || null,
      supported: shellSupported
    },
    capabilities: {
      required: policy.requiredCapabilities,
      optional: policy.optionalCapabilities,
      available: availableCapabilities,
      missingRequired: missingRequiredCapabilities,
      missingOptional: missingOptionalCapabilities
    },
    fallbackResolution: {
      required: surface.kind === 'remote' || state === 'degraded' || state === 'blocked',
      resolved: fallbackResolved,
      fallback: policy.fallback || null
    },
    events,
    dataSources: createDataSourceResolution(surface, state, policy),
    diagnostics
  };
}

function createStateCounts(surfaces) {
  return DEGRADATION_STATES.reduce((counts, state) => {
    counts[state] = surfaces.filter((surface) => surface.state === state).length;
    return counts;
  }, {});
}

function reportStatus(counts) {
  if (counts.blocked > 0) return 'blocked';
  if (counts.degraded > 0) return 'degraded';
  if (counts.compatible > 0) return 'compatible';
  return 'full';
}

function createDegradationReport(input = {}, options = {}) {
  const enterpriseRegistry = input.enterpriseRegistry || input.registry || {};
  const surfaces = toArray(enterpriseRegistry.surfaces).map((surface) => createDegradationSurface(surface, {
    policies: input.policies || {},
    shellVersion: input.shellVersion,
    availableCapabilities: input.availableCapabilities || [],
    ...options
  }));
  const diagnostics = surfaces.flatMap((surface) => surface.diagnostics);
  const stateCounts = createStateCounts(surfaces);
  const status = reportStatus(stateCounts);

  return {
    schema: RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
    policySchema: RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
    degradationSurfaceSchema: RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    enterpriseRegistrySchema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    enterpriseSurfaceSchema: RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
    workpackage: RMT_VNEXT_DEGRADATION_WORKPACKAGE,
    registryId: enterpriseRegistry.registryId || null,
    status,
    ok: status !== 'blocked',
    shellVersion: normalizeString(input.shellVersion || '0.0.0'),
    stateCounts,
    surfaceCount: surfaces.length,
    blockedSurfaceIds: surfaces.filter((surface) => surface.state === 'blocked').map((surface) => surface.enterpriseSurfaceId),
    degradedSurfaceIds: surfaces.filter((surface) => surface.state === 'degraded').map((surface) => surface.enterpriseSurfaceId),
    compatibleSurfaceIds: surfaces.filter((surface) => surface.state === 'compatible').map((surface) => surface.enterpriseSurfaceId),
    surfaces,
    diagnostics
  };
}

function serializeDegradationReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

function createRmtVNextDegradationAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
    reportSchema: RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
    degradationSurfaceSchema: RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    enterpriseRegistrySchema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    workpackage: RMT_VNEXT_DEGRADATION_WORKPACKAGE,
    states: DEGRADATION_STATES,
    createReport: (input, options = {}) => createDegradationReport({
      ...defaultOptions,
      ...input
    }, options),
    serializeReport: serializeDegradationReport
  });
}

module.exports = {
  DEGRADATION_CAPABILITY_MISSING_CODE,
  DEGRADATION_EVENT_RESTRICTED_CODE,
  DEGRADATION_FALLBACK_MISSING_CODE,
  DEGRADATION_SHELL_VERSION_UNSUPPORTED_CODE,
  DEGRADATION_STATES,
  DEGRADATION_SURFACE_BLOCKED_CODE,
  DEGRADATION_VERSION_MISMATCH_CODE,
  RMT_VNEXT_DEGRADATION_CONTRACT_PATH,
  RMT_VNEXT_DEGRADATION_MODULE_PATH,
  RMT_VNEXT_DEGRADATION_PACKAGE_SCRIPT,
  RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
  RMT_VNEXT_DEGRADATION_SUITE_PATH,
  RMT_VNEXT_DEGRADATION_SURFACE_SCHEMA,
  RMT_VNEXT_DEGRADATION_WORKPACKAGE,
  RMT_VNEXT_DEGRADATION_WP_PATH,
  createDegradationReport,
  createRmtVNextDegradationAdapter,
  satisfiesRange,
  serializeDegradationReport
};
