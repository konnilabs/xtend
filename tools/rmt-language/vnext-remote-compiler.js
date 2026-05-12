'use strict';

const {
  RMT_VNEXT_COMPILER_SCHEMA,
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource,
  serializeRmtVNextCore
} = require('./vnext-compiler');
const {
  RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
  RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
  createRemoteSurfaceManifest
} = require('./vnext-remote-manifest');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
  createEnterpriseSurfaceRegistry
} = require('./vnext-enterprise-registry');
const {
  RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
  createRmtVNextCrossSurfaceEventProtocol
} = require('./vnext-cross-surface-events');
const {
  RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
  RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA,
  createRmtVNextEventGovernanceReport
} = require('./vnext-event-governance');
const {
  RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
  createDegradationReport
} = require('./vnext-degradation');

const RMT_VNEXT_REMOTE_COMPILER_SCHEMA = 'xtend.rmt.vnext-remote-compiler.v1';
const RMT_VNEXT_REMOTE_COMPILER_REPORT_SCHEMA = 'xtend.rmt.vnext-remote-compiler-report.v1';
const RMT_VNEXT_REMOTE_COMPILER_WORKPACKAGE = 'WP-E16-08';
const RMT_VNEXT_REMOTE_COMPILER_MODULE_PATH = 'tools/rmt-language/vnext-remote-compiler.js';
const RMT_VNEXT_REMOTE_COMPILER_SUITE_PATH = 'tests/rmt-language/rmt_vnext_remote_compiler_suite.js';
const RMT_VNEXT_REMOTE_COMPILER_CONTRACT_PATH = 'development/XTendRMT-vNext-Remote-Compiler-Core-Contract.md';
const RMT_VNEXT_REMOTE_COMPILER_WP_PATH = 'development/WP-E16-08-Parser-Compiler-und-Core-Erweiterungen-fuer-Remote-Surfaces-integrieren.md';
const RMT_VNEXT_REMOTE_COMPILER_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-remote-compiler';

const DEFAULT_SHELL_SURFACE_NAME = 'shell.root';
const DEFAULT_SHELL_SURFACE_ID = 'surface:shell.root';
const DEFAULT_SHELL_OWNER = 'shell-platform';
const DEFAULT_SHELL_VERSION = '2.0.0';
const DEFAULT_SHELL_TARGET = 'shell.slot:remote-surfaces';
const DEFAULT_SHELL_SESSION = 'shell.session:current';

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

function capabilityIds(capabilities) {
  return toArray(capabilities).map((capability) => {
    if (typeof capability === 'string') return normalizeString(capability);
    return normalizeString(capability && (capability.id || capability.capability || capability.name));
  }).filter(Boolean);
}

function eventNames(remoteSurface) {
  return toArray(remoteSurface && remoteSurface.events && remoteSurface.events.emits)
    .concat(toArray(remoteSurface && remoteSurface.events && remoteSurface.events.consumes))
    .map((event) => normalizeString(event.event))
    .filter(Boolean);
}

function payloadSchemas(events) {
  return toArray(events).map((event) => normalizeString(event && event.payload && event.payload.schema)).filter(Boolean);
}

function coerceActiveVersion(range) {
  const value = normalizeString(range);
  if (!value) return '1.0.0';
  const match = value.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return value;
  return [
    match[1],
    match[2] || '0',
    match[3] || '0'
  ].join('.');
}

function targetRef(target) {
  if (!target) return '';
  if (typeof target === 'string') return normalizeString(target);
  return normalizeString(target.ref || target.target || target.id || target.name);
}

function exposeToManifestBinding(expose) {
  return {
    lane: normalizeString(expose && expose.lane),
    target: targetRef(expose && expose.target),
    mode: normalizeString(expose && expose.mode || 'mount') || 'mount'
  };
}

function remoteSurfaceToManifestInput(remoteSurface) {
  const remote = remoteSurface.remote || {};
  return {
    manifestId: remoteSurface.manifestId,
    surfaceId: remoteSurface.id,
    name: remoteSurface.name,
    owner: remoteSurface.owner,
    remote: {
      id: remote.id,
      origin: remote.origin,
      versionRange: remote.versionRange,
      integrity: cloneJson(remote.integrity)
    },
    security: cloneJson(remoteSurface.security),
    exposes: toArray(remoteSurface.exposes).map(exposeToManifestBinding),
    capabilities: cloneJson(remoteSurface.capabilities || []),
    adapterBoundary: cloneJson(remoteSurface.adapterBoundary),
    fallback: cloneJson(remoteSurface.fallback)
  };
}

function createRemoteManifestFromCore(remoteSurface, options = {}) {
  return createRemoteSurfaceManifest({
    manifestId: remoteSurface.manifestId,
    surfaces: [remoteSurfaceToManifestInput(remoteSurface)]
  }, options);
}

function collectShellTargets(remoteSurfaces, options = {}) {
  const configured = toArray(options.shellTargets).map(normalizeString).filter(Boolean);
  const exposedTargets = remoteSurfaces
    .flatMap((surface) => toArray(surface.exposes))
    .map((expose) => targetRef(expose.target))
    .filter(Boolean);
  const eventTargets = remoteSurfaces
    .flatMap((surface) => toArray(surface.events && surface.events.consumes))
    .map((event) => event.from && event.from.ref)
    .filter(Boolean);
  return Array.from(new Set(configured.concat(exposedTargets, eventTargets, [DEFAULT_SHELL_TARGET])));
}

function createHostSurfaceRegistry(remoteSurfaces, options = {}) {
  const shellTargets = collectShellTargets(remoteSurfaces, options);
  const laneNames = Array.from(new Set(remoteSurfaces
    .flatMap((surface) => toArray(surface.exposes).map((expose) => normalizeString(expose.lane)).filter(Boolean))
    .concat(['critical'])));

  return {
    schema: 'xtend.rmt.vnext-surface-registry.v1',
    registryId: options.localRegistryId || 'surfaceRegistry:remote-compiler-host',
    status: 'ready',
    ok: true,
    surfaces: [
      {
        surfaceId: DEFAULT_SHELL_SURFACE_ID,
        name: DEFAULT_SHELL_SURFACE_NAME,
        type: 'shell',
        status: 'ready',
        relations: {
          lanes: laneNames.map((name) => ({
            laneId: `lane:shell.root/${name}`,
            name,
            weight: null
          }))
        },
        diagnostics: []
      }
    ],
    diagnostics: [],
    indexes: {
      byName: {
        [DEFAULT_SHELL_SURFACE_NAME]: DEFAULT_SHELL_SURFACE_ID
      }
    }
  };
}

function createEnterpriseInput(coreDocument, remoteManifests, options = {}) {
  const remoteSurfaces = toArray(coreDocument.remoteSurfaces);
  const versions = {
    [DEFAULT_SHELL_SURFACE_NAME]: {
      active: options.shellVersion || DEFAULT_SHELL_VERSION,
      expected: options.shellVersion || DEFAULT_SHELL_VERSION,
      range: options.shellVersion || DEFAULT_SHELL_VERSION
    }
  };
  const owners = {
    [DEFAULT_SHELL_SURFACE_NAME]: {
      kind: 'team',
      id: options.shellOwner || DEFAULT_SHELL_OWNER
    }
  };
  const shellTargets = {
    [DEFAULT_SHELL_SURFACE_NAME]: collectShellTargets(remoteSurfaces, options)
  };

  remoteSurfaces.forEach((surface) => {
    const range = surface.remote && surface.remote.versionRange;
    versions[surface.name] = {
      active: coerceActiveVersion(range),
      expected: range || coerceActiveVersion(range),
      range: range || coerceActiveVersion(range)
    };
    owners[surface.name] = cloneJson(surface.owner);
  });

  return {
    registryId: options.registryId || `enterprise:${coreDocument.manifest.documentId}`,
    surfaceRegistry: options.surfaceRegistry || createHostSurfaceRegistry(remoteSurfaces, options),
    remoteManifests,
    owners: {
      ...owners,
      ...(options.owners || {})
    },
    versions: {
      ...versions,
      ...(options.versions || {})
    },
    shellTargets: {
      ...shellTargets,
      ...(options.enterpriseShellTargets || {})
    }
  };
}

function scopesForRemoteEvent(event, remoteSurface) {
  const scopes = toArray(event && event.scopes).filter(Boolean);
  if (scopes.length > 0) return scopes;
  const lane = normalizeString(event && event.lane);
  const fallback = lane ? [`lane:${lane}`] : [remoteSurface.name];
  return fallback;
}

function hostScopeForRemoteEvent(event, remoteSurface) {
  const fromRef = event && event.from && event.from.ref;
  if (fromRef) return [fromRef];
  const lane = normalizeString(event && event.lane);
  const binding = toArray(remoteSurface.exposes).find((expose) => normalizeString(expose.lane) === lane) || toArray(remoteSurface.exposes)[0];
  const ref = targetRef(binding && binding.target);
  return [ref || DEFAULT_SHELL_TARGET];
}

function createCrossSurfaceEvents(remoteSurfaces) {
  const events = [];
  remoteSurfaces.forEach((remoteSurface) => {
    toArray(remoteSurface.events && remoteSurface.events.emits).forEach((event) => {
      events.push({
        event: event.event,
        owner: cloneJson(event.owner),
        version: event.version || 'v1',
        payload: cloneJson(event.payload),
        bindings: [
          {
            surface: remoteSurface.name,
            direction: 'outbound',
            owner: cloneJson(event.owner),
            payload: cloneJson(event.payload),
            scopes: scopesForRemoteEvent(event, remoteSurface)
          },
          {
            surface: DEFAULT_SHELL_SURFACE_NAME,
            direction: 'inbound',
            owner: cloneJson(event.owner),
            payload: cloneJson(event.payload),
            scopes: hostScopeForRemoteEvent(event, remoteSurface)
          }
        ]
      });
    });

    toArray(remoteSurface.events && remoteSurface.events.consumes).forEach((event) => {
      events.push({
        event: event.event,
        owner: cloneJson(event.owner),
        version: event.version || 'v1',
        payload: cloneJson(event.payload),
        bindings: [
          {
            surface: DEFAULT_SHELL_SURFACE_NAME,
            direction: 'outbound',
            owner: cloneJson(event.owner),
            payload: cloneJson(event.payload),
            scopes: hostScopeForRemoteEvent(event, remoteSurface)
          },
          {
            surface: remoteSurface.name,
            direction: 'inbound',
            owner: cloneJson(event.owner),
            payload: cloneJson(event.payload),
            scopes: scopesForRemoteEvent(event, remoteSurface)
          }
        ]
      });
    });
  });
  return events;
}

function createGovernanceInput(events, options = {}) {
  const ownerCatalog = {};
  const policies = {};

  events.forEach((event) => {
    const ownerId = event.owner && event.owner.id || 'unowned';
    const entry = ownerCatalog[ownerId] || {
      kind: 'team',
      eventPrefixes: [],
      events: [],
      payloadSchemas: []
    };
    entry.events.push(event.event);
    payloadSchemas([event]).forEach((schema) => entry.payloadSchemas.push(schema));
    ownerCatalog[ownerId] = entry;
    policies[event.event] = {
      owner: {
        kind: 'team',
        id: ownerId
      },
      versionOwner: ownerId,
      payloadOwner: ownerId,
      delivery: {
        mode: options.deliveryMode || 'queued',
        ttlMs: options.ttlMs || 30000,
        correlationId: 'required',
        idempotencyKey: 'required',
        sensitivity: options.sensitivity || 'internal',
        crossTeamReview: 'approved'
      }
    };
  });

  Object.keys(ownerCatalog).forEach((ownerId) => {
    ownerCatalog[ownerId].events = Array.from(new Set(ownerCatalog[ownerId].events));
    ownerCatalog[ownerId].payloadSchemas = Array.from(new Set(ownerCatalog[ownerId].payloadSchemas));
  });

  return {
    ownerCatalog,
    policies
  };
}

function createDegradationInput(enterpriseRegistry, remoteSurfaces, options = {}) {
  const policies = {};
  const availableCapabilities = Array.from(new Set(remoteSurfaces.flatMap((surface) => capabilityIds(surface.capabilities))));
  remoteSurfaces.forEach((surface) => {
    const events = eventNames(surface);
    policies[surface.name] = {
      minShellVersion: options.shellVersion || DEFAULT_SHELL_VERSION,
      requiredCapabilities: capabilityIds(surface.capabilities),
      optionalCapabilities: [],
      fallback: cloneJson(surface.fallback),
      eventPolicy: {
        whenDegraded: 'block-unlisted',
        allow: events
      },
      dataSourcePolicy: {
        whenDegraded: 'read-only'
      }
    };
  });

  return {
    enterpriseRegistry,
    policies: {
      ...policies,
      ...(options.degradationPolicies || {})
    },
    shellVersion: options.shellVersion || DEFAULT_SHELL_VERSION,
    availableCapabilities: Array.from(new Set(availableCapabilities.concat(options.availableCapabilities || [])))
  };
}

function createRemoteCompilerCoreBundle(input) {
  return {
    schema: RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_COMPILER_WORKPACKAGE,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    compilerSchema: RMT_VNEXT_COMPILER_SCHEMA,
    remoteManifestSchema: RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
    remoteSurfaceSchema: RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
    enterpriseRegistrySchema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    enterpriseSurfaceSchema: RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
    crossSurfaceEventProtocolSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
    crossSurfaceEventReportSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
    eventGovernancePolicySchema: RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
    eventGovernanceReportSchema: RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA,
    degradationPolicySchema: RMT_VNEXT_DEGRADATION_POLICY_SCHEMA,
    degradationReportSchema: RMT_VNEXT_DEGRADATION_REPORT_SCHEMA,
    document: input.coreDocument,
    remoteManifests: input.remoteManifests,
    enterpriseRegistry: input.enterpriseRegistry,
    crossSurfaceEvents: input.crossSurfaceEventReport,
    eventGovernance: input.eventGovernanceReport,
    degradation: input.degradationReport
  };
}

function compileRmtVNextRemoteSource(input = {}, options = {}) {
  const compilerResult = compileRmtVNextSource(input, options);
  if (!compilerResult.ok) {
    return {
      schema: RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
      workpackage: RMT_VNEXT_REMOTE_COMPILER_WORKPACKAGE,
      ok: false,
      phase: compilerResult.phase,
      status: compilerResult.status,
      compilerResult,
      coreDocument: null,
      coreJson: null,
      diagnostics: compilerResult.diagnostics || []
    };
  }

  const coreDocument = compilerResult.coreDocument;
  const remoteSurfaces = toArray(coreDocument.remoteSurfaces);
  const remoteManifests = remoteSurfaces.map((surface) => createRemoteManifestFromCore(surface, options.remoteManifest));
  const enterpriseRegistry = createEnterpriseSurfaceRegistry(createEnterpriseInput(coreDocument, remoteManifests, options.enterprise || {}));
  const eventInputs = createCrossSurfaceEvents(remoteSurfaces);
  const crossSurfaceEventReport = createRmtVNextCrossSurfaceEventProtocol({
    enterpriseRegistry,
    events: eventInputs,
    shellSessions: [DEFAULT_SHELL_SESSION].concat(options.shellSessions || []),
    shellRoutes: options.shellRoutes || []
  });
  const governanceInput = createGovernanceInput(eventInputs, options.governance || {});
  const eventGovernanceReport = createRmtVNextEventGovernanceReport({
    enterpriseRegistry,
    crossSurfaceEventReport,
    ...governanceInput
  });
  const degradationReport = createDegradationReport(createDegradationInput(enterpriseRegistry, remoteSurfaces, options.degradation || {}));
  const coreBundle = createRemoteCompilerCoreBundle({
    coreDocument,
    remoteManifests,
    enterpriseRegistry,
    crossSurfaceEventReport,
    eventGovernanceReport,
    degradationReport
  });
  const diagnostics = (compilerResult.diagnostics || [])
    .concat(remoteManifests.flatMap((manifest) => manifest.diagnostics || []))
    .concat(enterpriseRegistry.diagnostics || [])
    .concat(crossSurfaceEventReport.diagnostics || [])
    .concat(eventGovernanceReport.diagnostics || [])
    .concat(degradationReport.diagnostics || []);
  const ok = diagnostics.every((diagnostic) => diagnostic.severity !== 'error');

  return {
    schema: RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
    reportSchema: RMT_VNEXT_REMOTE_COMPILER_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_COMPILER_WORKPACKAGE,
    ok,
    phase: 'remote-compile',
    status: ok ? 'compiled' : 'blocked',
    compilerResult,
    coreDocument,
    coreBundle,
    coreJson: serializeRemoteCompilerCore(coreBundle),
    baseCoreJson: serializeRmtVNextCore(coreDocument),
    remoteManifests,
    enterpriseRegistry,
    crossSurfaceEventReport,
    eventGovernanceReport,
    degradationReport,
    diagnostics
  };
}

function serializeRemoteCompilerCore(coreBundle) {
  return `${JSON.stringify(stableSort(coreBundle), null, 2)}\n`;
}

function createRmtVNextRemoteCompiler(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
    reportSchema: RMT_VNEXT_REMOTE_COMPILER_REPORT_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_COMPILER_WORKPACKAGE,
    compileSource: (input = {}, options = {}) => compileRmtVNextRemoteSource(input, {
      ...defaultOptions,
      ...options
    }),
    serializeCore: serializeRemoteCompilerCore
  });
}

module.exports = {
  RMT_VNEXT_REMOTE_COMPILER_CONTRACT_PATH,
  RMT_VNEXT_REMOTE_COMPILER_MODULE_PATH,
  RMT_VNEXT_REMOTE_COMPILER_PACKAGE_SCRIPT,
  RMT_VNEXT_REMOTE_COMPILER_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
  RMT_VNEXT_REMOTE_COMPILER_SUITE_PATH,
  RMT_VNEXT_REMOTE_COMPILER_WORKPACKAGE,
  RMT_VNEXT_REMOTE_COMPILER_WP_PATH,
  compileRmtVNextRemoteSource,
  createRmtVNextRemoteCompiler,
  serializeRemoteCompilerCore
};
