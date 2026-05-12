'use strict';

const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');
const {
  RMT_VNEXT_SURFACE_REGISTRY_SCHEMA,
  createSurfaceRegistry
} = require('./vnext-surfaces');
const {
  RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
  RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
  createRemoteSurfaceManifest
} = require('./vnext-remote-manifest');

const RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA = 'xtend.rmt.vnext-enterprise-surface-registry.v1';
const RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA = 'xtend.rmt.vnext-enterprise-surface.v1';
const RMT_VNEXT_ENTERPRISE_REGISTRY_REPORT_SCHEMA = 'xtend.rmt.vnext-enterprise-surface-registry-report.v1';
const RMT_VNEXT_ENTERPRISE_REGISTRY_WORKPACKAGE = 'WP-E16-03';
const RMT_VNEXT_ENTERPRISE_REGISTRY_MODULE_PATH = 'tools/rmt-language/vnext-enterprise-registry.js';
const RMT_VNEXT_ENTERPRISE_REGISTRY_SUITE_PATH = 'tests/rmt-language/rmt_vnext_enterprise_registry_suite.js';
const RMT_VNEXT_ENTERPRISE_REGISTRY_CONTRACT_PATH = 'development/XTendRMT-vNext-Enterprise-Surface-Registry-Contract.md';
const RMT_VNEXT_ENTERPRISE_REGISTRY_WP_PATH = 'development/WP-E16-03-Enterprise-surface-registry-fuer-Ownership-und-Discoverability-ausbauen.md';
const RMT_VNEXT_ENTERPRISE_REGISTRY_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-enterprise-registry';

const ENTERPRISE_OWNER_MISSING_CODE = 'rmt.vnext.enterprise_registry.owner_missing';
const ENTERPRISE_VERSION_MISSING_CODE = 'rmt.vnext.enterprise_registry.version_missing';
const ENTERPRISE_SHELL_TARGET_MISSING_CODE = 'rmt.vnext.enterprise_registry.shell_target_missing';
const ENTERPRISE_REMOTE_MANIFEST_BLOCKED_CODE = 'rmt.vnext.enterprise_registry.remote_manifest_blocked';
const ENTERPRISE_SURFACE_DUPLICATE_CODE = 'rmt.vnext.enterprise_registry.surface_duplicate';

const ENTERPRISE_SURFACE_KINDS = Object.freeze([
  'local',
  'remote'
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

function createEnterpriseDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_REGISTRY_WORKPACKAGE,
    severity,
    code,
    message,
    enterpriseSurfaceId: subject && subject.enterpriseSurfaceId || null,
    surfaceId: subject && subject.surfaceId || null,
    surfaceName: subject && subject.name || null,
    field: metadata.field || null,
    metadata
  };
}

function normalizeCatalog(catalog = {}) {
  if (!catalog || typeof catalog !== 'object') return {};
  return catalog;
}

function lookupCatalog(catalog, surface) {
  const source = normalizeCatalog(catalog);
  const keys = [
    surface.enterpriseSurfaceId,
    surface.surfaceId,
    surface.name,
    surface.remote && surface.remote.id,
    surface.manifestId
  ].filter(Boolean);

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
  }

  return null;
}

function normalizeOwner(owner) {
  if (typeof owner === 'string') {
    return {
      kind: 'team',
      id: normalizeString(owner),
      known: Boolean(normalizeString(owner))
    };
  }

  const source = owner && typeof owner === 'object' ? owner : {};
  const id = normalizeString(source.id || source.team || source.name);
  return {
    kind: normalizeString(source.kind || source.type || 'team') || 'team',
    id,
    known: Boolean(id)
  };
}

function normalizeVersion(version, fallback = {}) {
  if (typeof version === 'string') {
    return {
      active: normalizeString(version),
      expected: normalizeString(fallback.expected || version),
      range: normalizeString(fallback.range || fallback.versionRange || version),
      status: 'declared'
    };
  }

  const source = version && typeof version === 'object' ? version : {};
  const active = normalizeString(source.active || source.version || fallback.active);
  const expected = normalizeString(source.expected || fallback.expected || fallback.versionRange);
  const range = normalizeString(source.range || source.versionRange || fallback.range || fallback.versionRange || expected);
  return {
    active,
    expected,
    range,
    status: active && (expected || range) ? 'declared' : 'missing'
  };
}

function normalizeShellTarget(entry) {
  if (typeof entry === 'string') {
    return {
      lane: null,
      target: normalizeString(entry),
      mode: 'mount'
    };
  }

  const source = entry && typeof entry === 'object' ? entry : {};
  return {
    lane: normalizeString(source.lane),
    target: normalizeString(source.target || source.shellTarget || source.slot),
    mode: normalizeString(source.mode || 'mount') || 'mount'
  };
}

function normalizeCatalogShellTargets(shellTargets, surface, fallbackTargets = []) {
  const configured = lookupCatalog(shellTargets, surface);
  return toArray(configured || fallbackTargets).map(normalizeShellTarget).filter((target) => target.target);
}

function enterpriseId(kind, surface) {
  return `enterpriseSurface:${kind}:${surface.name || surface.surfaceId || 'unnamed'}`;
}

function createLocalEnterpriseSurface(localSurface, options = {}) {
  const base = {
    enterpriseSurfaceId: enterpriseId('local', localSurface),
    surfaceId: localSurface.surfaceId,
    name: localSurface.name,
    kind: 'local',
    type: localSurface.type,
    status: localSurface.status === 'blocked' ? 'blocked' : 'ready'
  };
  const owner = normalizeOwner(lookupCatalog(options.owners, base));
  const version = normalizeVersion(lookupCatalog(options.versions, base));
  const shellTargets = normalizeCatalogShellTargets(options.shellTargets, base);
  const lanes = toArray(localSurface.relations && localSurface.relations.lanes).map((lane) => ({
    laneId: lane.laneId,
    name: lane.name,
    weight: lane.weight
  }));
  const record = {
    schema: RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
    ...base,
    owner,
    version,
    remote: {
      enabled: false,
      manifestId: null,
      remoteId: null,
      origin: null,
      integrity: null,
      trustBoundary: null,
      status: 'local'
    },
    shellTargets,
    lanes,
    events: {
      emits: toArray(lookupCatalog(options.eventEmits, base)),
      consumes: toArray(lookupCatalog(options.eventConsumes, base))
    },
    dataSources: toArray(lookupCatalog(options.dataSources, base)),
    capabilities: toArray(lookupCatalog(options.capabilities, base)),
    fallback: null,
    discoverability: {
      discoverable: true,
      source: 'local-surface-registry',
      operatorLabel: `${owner.id || 'unowned'}:${localSurface.name}`,
      registryRef: options.surfaceRegistryId || null
    },
    diagnostics: toArray(localSurface.diagnostics)
  };

  if (!owner.known) {
    record.diagnostics.push(createEnterpriseDiagnostic(
      record,
      ENTERPRISE_OWNER_MISSING_CODE,
      `Local surface "${record.name}" must declare an enterprise owner.`,
      'error',
      { field: 'owner' }
    ));
  }

  if (version.status === 'missing') {
    record.diagnostics.push(createEnterpriseDiagnostic(
      record,
      ENTERPRISE_VERSION_MISSING_CODE,
      `Local surface "${record.name}" must declare an active and expected version.`,
      'error',
      { field: 'version' }
    ));
  }

  if (shellTargets.length === 0) {
    record.diagnostics.push(createEnterpriseDiagnostic(
      record,
      ENTERPRISE_SHELL_TARGET_MISSING_CODE,
      `Local surface "${record.name}" must declare at least one shell target.`,
      'error',
      { field: 'shellTargets' }
    ));
  }

  record.status = record.diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : record.status;
  return record;
}

function createRemoteEnterpriseSurface(remoteSurface, manifest, options = {}) {
  const base = {
    enterpriseSurfaceId: enterpriseId('remote', remoteSurface),
    surfaceId: remoteSurface.surfaceId,
    name: remoteSurface.name,
    kind: 'remote',
    type: 'remote',
    manifestId: manifest.manifestId,
    status: remoteSurface.status === 'blocked' || manifest.status === 'blocked' ? 'blocked' : 'ready',
    remote: remoteSurface.remote
  };
  const owner = normalizeOwner(remoteSurface.owner || lookupCatalog(options.owners, base));
  const version = normalizeVersion(lookupCatalog(options.versions, base), {
    expected: remoteSurface.remote && remoteSurface.remote.versionRange,
    versionRange: remoteSurface.remote && remoteSurface.remote.versionRange
  });
  const shellTargets = normalizeCatalogShellTargets(options.shellTargets, base, remoteSurface.shellBindings);
  const record = {
    schema: RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
    ...base,
    owner,
    version,
    remote: {
      enabled: true,
      manifestId: manifest.manifestId,
      remoteId: remoteSurface.remote && remoteSurface.remote.id || null,
      origin: remoteSurface.remote && remoteSurface.remote.origin || null,
      integrity: cloneJson(remoteSurface.remote && remoteSurface.remote.integrity || null),
      trustBoundary: remoteSurface.security && remoteSurface.security.trustBoundary || null,
      status: manifest.status
    },
    shellTargets,
    lanes: shellTargets.map((target) => ({
      laneId: null,
      name: target.lane,
      weight: null
    })).filter((lane) => lane.name),
    events: {
      emits: toArray(lookupCatalog(options.eventEmits, base)),
      consumes: toArray(lookupCatalog(options.eventConsumes, base))
    },
    dataSources: toArray(lookupCatalog(options.dataSources, base)),
    capabilities: toArray(remoteSurface.capabilities).map((capability) => capability.id || capability).filter(Boolean),
    fallback: cloneJson(remoteSurface.fallback || null),
    discoverability: {
      discoverable: true,
      source: 'remote-surface-manifest',
      operatorLabel: `${owner.id || 'unowned'}:${remoteSurface.name}`,
      registryRef: manifest.manifestId
    },
    diagnostics: toArray(remoteSurface.diagnostics).concat(toArray(manifest.diagnostics))
  };

  if (!owner.known) {
    record.diagnostics.push(createEnterpriseDiagnostic(
      record,
      ENTERPRISE_OWNER_MISSING_CODE,
      `Remote surface "${record.name}" must declare an enterprise owner.`,
      'error',
      { field: 'owner' }
    ));
  }

  if (version.status === 'missing') {
    record.diagnostics.push(createEnterpriseDiagnostic(
      record,
      ENTERPRISE_VERSION_MISSING_CODE,
      `Remote surface "${record.name}" must declare an active and expected version.`,
      'error',
      { field: 'version' }
    ));
  }

  if (shellTargets.length === 0) {
    record.diagnostics.push(createEnterpriseDiagnostic(
      record,
      ENTERPRISE_SHELL_TARGET_MISSING_CODE,
      `Remote surface "${record.name}" must declare at least one shell target.`,
      'error',
      { field: 'shellTargets' }
    ));
  }

  if (manifest.status === 'blocked') {
    record.diagnostics.push(createEnterpriseDiagnostic(
      record,
      ENTERPRISE_REMOTE_MANIFEST_BLOCKED_CODE,
      `Remote manifest "${manifest.manifestId}" is blocked and cannot enter the enterprise registry.`,
      'error',
      { field: 'remoteManifest', manifestStatus: manifest.status }
    ));
  }

  record.status = record.diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : record.status;
  return record;
}

function detectDuplicateEnterpriseSurfaces(records) {
  const diagnostics = [];
  const seen = new Map();

  records.forEach((record) => {
    const key = `${record.kind}:${record.name}`;
    if (seen.has(key)) {
      diagnostics.push(createEnterpriseDiagnostic(
        record,
        ENTERPRISE_SURFACE_DUPLICATE_CODE,
        `Enterprise surface "${key}" is duplicated.`,
        'error',
        { duplicateOf: seen.get(key).enterpriseSurfaceId }
      ));
    } else {
      seen.set(key, record);
    }
  });

  return diagnostics;
}

function createIndexes(records) {
  const byKind = {};
  const byOwner = {};
  const byStatus = {};
  const byShellTarget = {};

  records.forEach((record) => {
    (byKind[record.kind] || (byKind[record.kind] = [])).push(record.enterpriseSurfaceId);
    (byStatus[record.status] || (byStatus[record.status] = [])).push(record.enterpriseSurfaceId);
    const ownerId = record.owner && record.owner.id || 'unowned';
    (byOwner[ownerId] || (byOwner[ownerId] = [])).push(record.enterpriseSurfaceId);
    record.shellTargets.forEach((target) => {
      (byShellTarget[target.target] || (byShellTarget[target.target] = [])).push(record.enterpriseSurfaceId);
    });
  });

  return {
    byKind,
    byOwner,
    byStatus,
    byShellTarget
  };
}

function normalizeRemoteManifests(remoteManifests = []) {
  return toArray(remoteManifests).map((entry) => {
    if (entry && entry.schema === RMT_VNEXT_REMOTE_MANIFEST_SCHEMA && Array.isArray(entry.remoteSurfaces)) return entry;
    return createRemoteSurfaceManifest(entry);
  });
}

function createEnterpriseSurfaceRegistry(input = {}, options = {}) {
  const surfaceRegistry = input.surfaceRegistry || createSurfaceRegistry(input.coreDocument || {}, {
    registryId: input.localRegistryId || input.registryId
  });
  const catalogs = {
    owners: input.owners || input.localOwners || {},
    versions: input.versions || {},
    shellTargets: input.shellTargets || {},
    eventEmits: input.eventEmits || {},
    eventConsumes: input.eventConsumes || {},
    dataSources: input.dataSources || {},
    capabilities: input.capabilities || {}
  };
  const localRecords = toArray(surfaceRegistry.surfaces).map((surface) => createLocalEnterpriseSurface(surface, {
    ...catalogs,
    surfaceRegistryId: surfaceRegistry.registryId
  }));
  const remoteManifests = normalizeRemoteManifests(input.remoteManifests || input.remoteManifest || []);
  const remoteRecords = remoteManifests.flatMap((manifest) => toArray(manifest.remoteSurfaces).map((surface) => createRemoteEnterpriseSurface(surface, manifest, catalogs)));
  const records = localRecords.concat(remoteRecords);
  const duplicateDiagnostics = detectDuplicateEnterpriseSurfaces(records);
  const diagnostics = toArray(surfaceRegistry.diagnostics)
    .concat(records.flatMap((record) => record.diagnostics))
    .concat(duplicateDiagnostics);
  const indexes = createIndexes(records);
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    enterpriseSurfaceSchema: RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    surfaceRegistrySchema: RMT_VNEXT_SURFACE_REGISTRY_SCHEMA,
    remoteManifestSchema: RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
    remoteSurfaceSchema: RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_REGISTRY_WORKPACKAGE,
    registryId: input.registryId || `enterprise:${surfaceRegistry.registryId || 'rmt.vnext.document'}`,
    status,
    ok: status !== 'blocked',
    surfaceCount: records.length,
    localSurfaceCount: localRecords.length,
    remoteSurfaceCount: remoteRecords.length,
    ownerCount: Object.keys(indexes.byOwner).filter((owner) => owner !== 'unowned').length,
    shellTargetCount: Object.keys(indexes.byShellTarget).length,
    versionedSurfaceCount: records.filter((record) => record.version.status !== 'missing').length,
    discoverability: {
      mode: 'host-neutral',
      operatorReady: status !== 'blocked',
      surfaceIds: records.map((record) => record.enterpriseSurfaceId),
      ownerIds: Object.keys(indexes.byOwner).filter((owner) => owner !== 'unowned'),
      shellTargets: Object.keys(indexes.byShellTarget)
    },
    indexes,
    surfaces: records,
    diagnostics
  };
}

function serializeEnterpriseSurfaceRegistry(registry) {
  return `${JSON.stringify(stableSort(registry), null, 2)}\n`;
}

function createRmtVNextEnterpriseRegistryAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    enterpriseSurfaceSchema: RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_ENTERPRISE_REGISTRY_WORKPACKAGE,
    surfaceKinds: ENTERPRISE_SURFACE_KINDS,
    createRegistry: (input, options = {}) => createEnterpriseSurfaceRegistry({
      ...defaultOptions,
      ...input
    }, options),
    serializeRegistry: serializeEnterpriseSurfaceRegistry
  });
}

module.exports = {
  ENTERPRISE_OWNER_MISSING_CODE,
  ENTERPRISE_REMOTE_MANIFEST_BLOCKED_CODE,
  ENTERPRISE_SHELL_TARGET_MISSING_CODE,
  ENTERPRISE_SURFACE_DUPLICATE_CODE,
  ENTERPRISE_SURFACE_KINDS,
  ENTERPRISE_VERSION_MISSING_CODE,
  RMT_VNEXT_ENTERPRISE_REGISTRY_CONTRACT_PATH,
  RMT_VNEXT_ENTERPRISE_REGISTRY_MODULE_PATH,
  RMT_VNEXT_ENTERPRISE_REGISTRY_PACKAGE_SCRIPT,
  RMT_VNEXT_ENTERPRISE_REGISTRY_REPORT_SCHEMA,
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_REGISTRY_SUITE_PATH,
  RMT_VNEXT_ENTERPRISE_REGISTRY_WORKPACKAGE,
  RMT_VNEXT_ENTERPRISE_REGISTRY_WP_PATH,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
  createEnterpriseSurfaceRegistry,
  createRmtVNextEnterpriseRegistryAdapter,
  serializeEnterpriseSurfaceRegistry
};
