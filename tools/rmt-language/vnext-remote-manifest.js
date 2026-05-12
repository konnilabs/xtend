'use strict';

const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');

const RMT_VNEXT_REMOTE_MANIFEST_SCHEMA = 'xtend.rmt.vnext-remote-surface-manifest.v1';
const RMT_VNEXT_REMOTE_SURFACE_SCHEMA = 'xtend.rmt.vnext-remote-surface.v1';
const RMT_VNEXT_REMOTE_MANIFEST_REPORT_SCHEMA = 'xtend.rmt.vnext-remote-surface-manifest-report.v1';
const RMT_VNEXT_REMOTE_MANIFEST_WORKPACKAGE = 'WP-E16-02';
const RMT_VNEXT_REMOTE_MANIFEST_MODULE_PATH = 'tools/rmt-language/vnext-remote-manifest.js';
const RMT_VNEXT_REMOTE_MANIFEST_SUITE_PATH = 'tests/rmt-language/rmt_vnext_remote_manifest_suite.js';
const RMT_VNEXT_REMOTE_MANIFEST_CONTRACT_PATH = 'development/XTendRMT-vNext-Remote-Surface-Manifest-Contract.md';
const RMT_VNEXT_REMOTE_MANIFEST_WP_PATH = 'development/WP-E16-02-Remote-Surface-Manifest-und-Core-Contract-definieren.md';
const RMT_VNEXT_REMOTE_MANIFEST_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-remote-manifest';

const REMOTE_OWNER_MISSING_CODE = 'rmt.vnext.remote.owner_missing';
const REMOTE_ID_MISSING_CODE = 'rmt.vnext.remote.id_missing';
const REMOTE_VERSION_MISSING_CODE = 'rmt.vnext.remote.version_missing';
const REMOTE_ORIGIN_MISSING_CODE = 'rmt.vnext.remote.origin_missing';
const REMOTE_ORIGIN_INVALID_CODE = 'rmt.vnext.remote.origin_invalid';
const REMOTE_INTEGRITY_MISSING_CODE = 'rmt.vnext.remote.integrity_missing';
const REMOTE_TRUST_BOUNDARY_MISSING_CODE = 'rmt.vnext.remote.trust_boundary_missing';
const REMOTE_CAPABILITY_IMPLICIT_CODE = 'rmt.vnext.remote.capability_implicit';
const REMOTE_CAPABILITY_MISSING_CODE = 'rmt.vnext.remote.capability_missing';
const REMOTE_ADAPTER_BOUNDARY_MISSING_CODE = 'rmt.vnext.remote.adapter_boundary_missing';
const REMOTE_EXPOSES_MISSING_CODE = 'rmt.vnext.remote.exposes_missing';
const REMOTE_FALLBACK_MISSING_CODE = 'rmt.vnext.remote.fallback_missing';
const REMOTE_RUNTIME_EXECUTION_CODE = 'rmt.vnext.remote.runtime_execution_in_kernel';

const REMOTE_REQUIRED_FACTS = Object.freeze([
  'owner',
  'version',
  'remote',
  'origin',
  'integrity',
  'trustBoundary',
  'allowedCapabilities',
  'adapterBoundary',
  'shellTargets',
  'fallback'
]);

const REMOTE_ALLOWED_INTEGRITY_ALGORITHMS = Object.freeze([
  'sha256',
  'sha384',
  'sha512'
]);

const REMOTE_DEFAULT_TRUST_BOUNDARY = 'xtend.security.remote-surface.v1';
const REMOTE_DEFAULT_CAPABILITY_MODE = 'deny-by-default';

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

function safeIdentifier(value, fallback) {
  const normalized = normalizeString(value)
    .replace(/[^a-zA-Z0-9_.@/-]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return normalized || fallback || 'remote.surface';
}

function manifestIdForSurface(surfaceName) {
  return `remoteManifest:${safeIdentifier(surfaceName, 'remote.surface')}`;
}

function surfaceIdForName(surfaceName) {
  return `remoteSurface:${safeIdentifier(surfaceName, 'remote.surface')}`;
}

function normalizeOwner(owner) {
  if (typeof owner === 'string') {
    return {
      kind: 'team',
      id: normalizeString(owner)
    };
  }

  const source = owner && typeof owner === 'object' ? owner : {};
  return {
    kind: normalizeString(source.kind || source.type || 'team') || 'team',
    id: normalizeString(source.id || source.team || source.name)
  };
}

function normalizeIntegrity(integrity) {
  if (typeof integrity === 'string') {
    const digest = normalizeString(integrity);
    const prefix = digest.split('-')[0];
    return {
      algorithm: REMOTE_ALLOWED_INTEGRITY_ALGORITHMS.includes(prefix) ? prefix : null,
      digest
    };
  }

  const source = integrity && typeof integrity === 'object' ? integrity : {};
  return {
    algorithm: normalizeString(source.algorithm || source.alg),
    digest: normalizeString(source.digest || source.hash || source.value)
  };
}

function normalizeRemote(source = {}) {
  const remoteInput = source.remote && typeof source.remote === 'object' ? source.remote : {};
  const remoteId = typeof source.remote === 'string' ? source.remote : remoteInput.id;
  const integrity = normalizeIntegrity(source.integrity || remoteInput.integrity);

  return {
    id: normalizeString(source.remoteId || remoteId),
    origin: normalizeString(source.origin || remoteInput.origin),
    versionRange: normalizeString(source.versionRange || source.version || remoteInput.versionRange || remoteInput.version),
    integrity,
    manifestRef: normalizeString(source.manifestRef || remoteInput.manifestRef),
    source: cloneJson(source.remote || null)
  };
}

function normalizeShellBinding(entry) {
  if (typeof entry === 'string') {
    return {
      lane: null,
      target: normalizeString(entry)
    };
  }

  const source = entry && typeof entry === 'object' ? entry : {};
  return {
    lane: normalizeString(source.lane),
    target: normalizeString(source.target || source.shellTarget || source.slot),
    mode: normalizeString(source.mode || 'mount') || 'mount'
  };
}

function normalizeCapability(entry) {
  if (typeof entry === 'string') {
    return {
      id: normalizeString(entry),
      mode: 'required'
    };
  }

  const source = entry && typeof entry === 'object' ? entry : {};
  return {
    id: normalizeString(source.id || source.capability || source.name),
    mode: normalizeString(source.mode || 'required') || 'required'
  };
}

function uniqueCapabilities(capabilities) {
  const seen = new Set();
  return capabilities.filter((capability) => {
    if (!capability.id || seen.has(capability.id)) return false;
    seen.add(capability.id);
    return true;
  });
}

function normalizeAdapterBoundary(source) {
  if (typeof source === 'string') {
    return {
      adapterId: normalizeString(source),
      capabilities: [],
      hostOwned: true,
      runtimeLoader: false
    };
  }

  const boundary = source && typeof source === 'object' ? source : {};
  return {
    adapterId: normalizeString(boundary.adapterId || boundary.id || boundary.adapter),
    capabilities: toArray(boundary.capabilities || boundary.allowedCapabilities).map((capability) => {
      if (typeof capability === 'string') return normalizeString(capability);
      return normalizeString(capability && (capability.id || capability.capability));
    }).filter(Boolean),
    hostOwned: boundary.hostOwned !== false,
    runtimeLoader: boundary.runtimeLoader === true || boundary.loadsRemote === true
  };
}

function normalizeSecurity(source) {
  const security = source && typeof source === 'object' ? source : {};
  return {
    trustBoundary: normalizeString(security.trustBoundary || security.boundary),
    capabilityMode: normalizeString(security.capabilityMode || REMOTE_DEFAULT_CAPABILITY_MODE) || REMOTE_DEFAULT_CAPABILITY_MODE,
    sandboxRequired: security.sandboxRequired !== false,
    cspRequired: security.cspRequired !== false
  };
}

function normalizeFallback(fallback) {
  if (typeof fallback === 'string') {
    return {
      kind: 'surface',
      ref: normalizeString(fallback)
    };
  }

  const source = fallback && typeof fallback === 'object' ? fallback : {};
  return {
    kind: normalizeString(source.kind || source.type || 'surface') || 'surface',
    ref: normalizeString(source.ref || source.surface || source.target)
  };
}

function createRemoteManifestDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_MANIFEST_WORKPACKAGE,
    severity,
    code,
    message,
    manifestId: subject && subject.manifestId || null,
    surfaceId: subject && subject.surfaceId || null,
    field: metadata.field || null,
    metadata
  };
}

function isValidOrigin(origin) {
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch (error) {
    return false;
  }
}

function validateRemoteSurfaceRecord(record, options = {}) {
  const diagnostics = [];
  const strict = options.strict !== false;

  if (!record.owner.id) {
    diagnostics.push(createRemoteManifestDiagnostic(
      record,
      REMOTE_OWNER_MISSING_CODE,
      `Remote surface "${record.name}" must declare an owner.`,
      'error',
      { field: 'owner' }
    ));
  }

  if (!record.remote.id) {
    diagnostics.push(createRemoteManifestDiagnostic(
      record,
      REMOTE_ID_MISSING_CODE,
      `Remote surface "${record.name}" must declare a remote id.`,
      'error',
      { field: 'remote.id' }
    ));
  }

  if (!record.remote.versionRange) {
    diagnostics.push(createRemoteManifestDiagnostic(
      record,
      REMOTE_VERSION_MISSING_CODE,
      `Remote surface "${record.name}" must declare a version range.`,
      'error',
      { field: 'remote.versionRange' }
    ));
  }

  if (!record.remote.origin) {
    diagnostics.push(createRemoteManifestDiagnostic(
      record,
      REMOTE_ORIGIN_MISSING_CODE,
      `Remote surface "${record.name}" must declare an origin.`,
      'error',
      { field: 'remote.origin' }
    ));
  } else if (!isValidOrigin(record.remote.origin)) {
    diagnostics.push(createRemoteManifestDiagnostic(
      record,
      REMOTE_ORIGIN_INVALID_CODE,
      `Remote surface "${record.name}" has an invalid origin "${record.remote.origin}".`,
      'error',
      { field: 'remote.origin', origin: record.remote.origin }
    ));
  }

  if (!record.remote.integrity.algorithm || !record.remote.integrity.digest || !REMOTE_ALLOWED_INTEGRITY_ALGORITHMS.includes(record.remote.integrity.algorithm)) {
    diagnostics.push(createRemoteManifestDiagnostic(
      record,
      REMOTE_INTEGRITY_MISSING_CODE,
      `Remote surface "${record.name}" must declare sha256, sha384 or sha512 integrity.`,
      'error',
      { field: 'remote.integrity' }
    ));
  }

  if (!record.security.trustBoundary) {
    diagnostics.push(createRemoteManifestDiagnostic(
      record,
      REMOTE_TRUST_BOUNDARY_MISSING_CODE,
      `Remote surface "${record.name}" must declare a remote trust boundary.`,
      'error',
      { field: 'security.trustBoundary' }
    ));
  }

  if (record.shellBindings.length === 0) {
    diagnostics.push(createRemoteManifestDiagnostic(
      record,
      REMOTE_EXPOSES_MISSING_CODE,
      `Remote surface "${record.name}" must expose at least one lane to the app shell.`,
      'error',
      { field: 'exposes' }
    ));
  } else {
    record.shellBindings.forEach((binding, index) => {
      if (!binding.lane || !binding.target) {
        diagnostics.push(createRemoteManifestDiagnostic(
          record,
          REMOTE_EXPOSES_MISSING_CODE,
          `Remote surface "${record.name}" has an incomplete shell binding.`,
          'error',
          { field: `exposes.${index}` }
        ));
      }
    });
  }

  if (record.capabilities.length === 0) {
    diagnostics.push(createRemoteManifestDiagnostic(
      record,
      REMOTE_CAPABILITY_MISSING_CODE,
      `Remote surface "${record.name}" must declare allowed capabilities.`,
      'error',
      { field: 'capabilities' }
    ));
  }

  if (!record.adapterBoundary.adapterId || record.adapterBoundary.capabilities.length === 0) {
    diagnostics.push(createRemoteManifestDiagnostic(
      record,
      REMOTE_ADAPTER_BOUNDARY_MISSING_CODE,
      `Remote surface "${record.name}" must declare an adapter boundary with explicit capabilities.`,
      'error',
      { field: 'adapterBoundary' }
    ));
  }

  record.capabilities.forEach((capability) => {
    if (!record.adapterBoundary.capabilities.includes(capability.id)) {
      diagnostics.push(createRemoteManifestDiagnostic(
        record,
        REMOTE_CAPABILITY_IMPLICIT_CODE,
        `Capability "${capability.id}" is not allowed by the adapter boundary.`,
        'error',
        { field: 'adapterBoundary.capabilities', capability: capability.id }
      ));
    }
  });

  if (strict && !record.fallback.ref) {
    diagnostics.push(createRemoteManifestDiagnostic(
      record,
      REMOTE_FALLBACK_MISSING_CODE,
      `Remote surface "${record.name}" must declare a fallback surface.`,
      'error',
      { field: 'fallback' }
    ));
  }

  if (record.adapterBoundary.runtimeLoader) {
    diagnostics.push(createRemoteManifestDiagnostic(
      record,
      REMOTE_RUNTIME_EXECUTION_CODE,
      `Remote surface "${record.name}" cannot request runtime loading in the RMT kernel.`,
      'error',
      { field: 'adapterBoundary.runtimeLoader' }
    ));
  }

  return diagnostics;
}

function normalizeSurfaceInput(input = {}) {
  if (input.surface && typeof input.surface === 'object') return input.surface;
  if (input.remoteSurface && typeof input.remoteSurface === 'object') return input.remoteSurface;
  return input;
}

function createRemoteSurfaceRecord(input = {}, options = {}) {
  const source = normalizeSurfaceInput(input);
  const remote = normalizeRemote(source);
  const name = safeIdentifier(source.name || source.surface || source.id || remote.id, 'remote.surface');
  const manifestId = normalizeString(input.manifestId || source.manifestId) || manifestIdForSurface(name);
  const surfaceId = normalizeString(source.surfaceId) || surfaceIdForName(name);
  const capabilities = uniqueCapabilities(toArray(source.capabilities || source.allowedCapabilities).map(normalizeCapability));
  const adapterBoundary = normalizeAdapterBoundary(source.adapterBoundary || source.adapter);
  const record = {
    schema: RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
    manifestId,
    surfaceId,
    name,
    owner: normalizeOwner(source.owner || {
      kind: source.ownerKind,
      id: source.ownerTeam || source.ownerId
    }),
    remote,
    security: normalizeSecurity(source.security || {
      trustBoundary: source.trustBoundary,
      capabilityMode: source.capabilityMode
    }),
    shellBindings: toArray(source.exposes || source.shellBindings).map(normalizeShellBinding),
    capabilities,
    adapterBoundary,
    fallback: normalizeFallback(source.fallback),
    runtime: {
      kernelRemoteExecution: false,
      hostAdapterRequired: true,
      networkRequiredByKernel: false
    },
    status: 'ready',
    diagnostics: []
  };
  record.diagnostics = validateRemoteSurfaceRecord(record, options);
  record.status = record.diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';
  return record;
}

function createRemoteSurfaceManifest(input = {}, options = {}) {
  const surfaceInputs = Array.isArray(input.surfaces)
    ? input.surfaces
    : [normalizeSurfaceInput(input)];
  const remoteSurfaces = surfaceInputs.map((surface) => createRemoteSurfaceRecord({
    ...input,
    surface
  }, options));
  const diagnostics = remoteSurfaces.flatMap((surface) => surface.diagnostics);
  const firstSurface = remoteSurfaces[0] || null;
  const manifestId = normalizeString(input.manifestId) || (firstSurface && firstSurface.manifestId) || 'remoteManifest:empty';
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    remoteSurfaceSchema: RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_MANIFEST_WORKPACKAGE,
    manifestId,
    status,
    ok: status !== 'blocked',
    strict: options.strict !== false,
    requiredFacts: REMOTE_REQUIRED_FACTS.slice(),
    surfaceCount: remoteSurfaces.length,
    remoteSurface: firstSurface,
    remoteSurfaces,
    diagnostics,
    runtimeBoundary: {
      kernelRemoteExecution: false,
      hostAdapterRequired: true,
      networkRequiredByKernel: false
    }
  };
}

function serializeRemoteSurfaceManifest(manifest) {
  return `${JSON.stringify(stableSort(manifest), null, 2)}\n`;
}

function createRmtVNextRemoteManifestAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
    remoteSurfaceSchema: RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_MANIFEST_WORKPACKAGE,
    requiredFacts: REMOTE_REQUIRED_FACTS,
    defaultTrustBoundary: REMOTE_DEFAULT_TRUST_BOUNDARY,
    capabilityMode: REMOTE_DEFAULT_CAPABILITY_MODE,
    createManifest: (input, options = {}) => createRemoteSurfaceManifest(input, {
      ...defaultOptions,
      ...options
    }),
    createRemoteSurface: (input, options = {}) => createRemoteSurfaceRecord(input, {
      ...defaultOptions,
      ...options
    }),
    serializeManifest: serializeRemoteSurfaceManifest
  });
}

module.exports = {
  REMOTE_ADAPTER_BOUNDARY_MISSING_CODE,
  REMOTE_ALLOWED_INTEGRITY_ALGORITHMS,
  REMOTE_CAPABILITY_IMPLICIT_CODE,
  REMOTE_CAPABILITY_MISSING_CODE,
  REMOTE_DEFAULT_CAPABILITY_MODE,
  REMOTE_DEFAULT_TRUST_BOUNDARY,
  REMOTE_EXPOSES_MISSING_CODE,
  REMOTE_FALLBACK_MISSING_CODE,
  REMOTE_ID_MISSING_CODE,
  REMOTE_INTEGRITY_MISSING_CODE,
  REMOTE_ORIGIN_INVALID_CODE,
  REMOTE_ORIGIN_MISSING_CODE,
  REMOTE_OWNER_MISSING_CODE,
  REMOTE_REQUIRED_FACTS,
  REMOTE_RUNTIME_EXECUTION_CODE,
  REMOTE_TRUST_BOUNDARY_MISSING_CODE,
  REMOTE_VERSION_MISSING_CODE,
  RMT_VNEXT_REMOTE_MANIFEST_CONTRACT_PATH,
  RMT_VNEXT_REMOTE_MANIFEST_MODULE_PATH,
  RMT_VNEXT_REMOTE_MANIFEST_PACKAGE_SCRIPT,
  RMT_VNEXT_REMOTE_MANIFEST_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
  RMT_VNEXT_REMOTE_MANIFEST_SUITE_PATH,
  RMT_VNEXT_REMOTE_MANIFEST_WORKPACKAGE,
  RMT_VNEXT_REMOTE_MANIFEST_WP_PATH,
  RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
  createRemoteSurfaceManifest,
  createRemoteSurfaceRecord,
  createRmtVNextRemoteManifestAdapter,
  serializeRemoteSurfaceManifest
};
