'use strict';

const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');
const {
  RMT_VNEXT_EVENT_ACTION_SCHEMA
} = require('./vnext-events');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA
} = require('./vnext-enterprise-registry');

const RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA = 'xtend.rmt.vnext-cross-surface-event-protocol.v1';
const RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA = 'xtend.rmt.vnext-cross-surface-event.v1';
const RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA = 'xtend.rmt.vnext-cross-surface-event-binding.v1';
const RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA = 'xtend.rmt.vnext-cross-surface-event-report.v1';
const RMT_VNEXT_CROSS_SURFACE_EVENT_WORKPACKAGE = 'WP-E16-06';
const RMT_VNEXT_CROSS_SURFACE_EVENT_MODULE_PATH = 'tools/rmt-language/vnext-cross-surface-events.js';
const RMT_VNEXT_CROSS_SURFACE_EVENT_SUITE_PATH = 'tests/rmt-language/rmt_vnext_cross_surface_events_suite.js';
const RMT_VNEXT_CROSS_SURFACE_EVENT_CONTRACT_PATH = 'development/XTendRMT-vNext-Cross-Surface-Event-Protocol-Contract.md';
const RMT_VNEXT_CROSS_SURFACE_EVENT_WP_PATH = 'development/WP-E16-06-Cross-Surface-Event-Protocol-fuer-Lane-und-Shell-Scopes-definieren.md';
const RMT_VNEXT_CROSS_SURFACE_EVENT_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-cross-surface-events';

const CROSS_SURFACE_EVENT_OWNER_MISSING_CODE = 'rmt.vnext.cross_surface_event.owner_missing';
const CROSS_SURFACE_EVENT_VERSION_MISSING_CODE = 'rmt.vnext.cross_surface_event.version_missing';
const CROSS_SURFACE_EVENT_PAYLOAD_MISSING_CODE = 'rmt.vnext.cross_surface_event.payload_missing';
const CROSS_SURFACE_EVENT_DIRECTION_INVALID_CODE = 'rmt.vnext.cross_surface_event.direction_invalid';
const CROSS_SURFACE_EVENT_SCOPE_MISSING_CODE = 'rmt.vnext.cross_surface_event.scope_missing';
const CROSS_SURFACE_EVENT_SCOPE_GLOBAL_FORBIDDEN_CODE = 'rmt.vnext.cross_surface_event.scope_global_forbidden';
const CROSS_SURFACE_EVENT_SCOPE_UNKNOWN_CODE = 'rmt.vnext.cross_surface_event.scope_unknown';
const CROSS_SURFACE_EVENT_SURFACE_UNKNOWN_CODE = 'rmt.vnext.cross_surface_event.surface_unknown';
const CROSS_SURFACE_EVENT_OWNER_CONFLICT_CODE = 'rmt.vnext.cross_surface_event.owner_conflict';
const CROSS_SURFACE_EVENT_PAYLOAD_CONFLICT_CODE = 'rmt.vnext.cross_surface_event.payload_conflict';
const CROSS_SURFACE_EVENT_PAIRING_MISSING_CODE = 'rmt.vnext.cross_surface_event.pairing_missing';
const CROSS_SURFACE_EVENT_DUPLICATE_BINDING_CODE = 'rmt.vnext.cross_surface_event.duplicate_binding';

const CROSS_SURFACE_EVENT_DIRECTIONS = Object.freeze(['outbound', 'inbound']);
const CROSS_SURFACE_EVENT_SCOPE_TYPES = Object.freeze(['surface', 'lane', 'shell.slot', 'shell.route', 'shell.session']);

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

function normalizePayload(payload) {
  if (typeof payload === 'string') {
    return {
      schema: normalizeString(payload),
      shape: null
    };
  }

  const source = payload && typeof payload === 'object' ? payload : {};
  const schema = normalizeString(source.schema || source.id || source.ref || source.payloadSchema);
  const shape = source.shape || source.properties || source.type ? cloneJson(source.shape || {
    type: source.type || 'object',
    required: source.required || [],
    properties: source.properties || {}
  }) : null;
  return {
    schema,
    shape
  };
}

function payloadSignature(payload) {
  const normalized = normalizePayload(payload);
  return JSON.stringify(stableSort(normalized));
}

function createSurfaceIndex(surfaces = []) {
  const byKey = new Map();
  toArray(surfaces).forEach((surface) => {
    [
      surface.enterpriseSurfaceId,
      surface.surfaceId,
      surface.name,
      surface.remote && surface.remote.remoteId,
      surface.remote && surface.remote.manifestId
    ].filter(Boolean).forEach((key) => byKey.set(key, surface));
  });
  return byKey;
}

function createProtocolDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
    workpackage: RMT_VNEXT_CROSS_SURFACE_EVENT_WORKPACKAGE,
    severity,
    code,
    message,
    event: subject && subject.event || null,
    bindingId: subject && subject.bindingId || null,
    enterpriseSurfaceId: subject && subject.enterpriseSurfaceId || null,
    surfaceId: subject && subject.surfaceId || null,
    surfaceName: subject && subject.surfaceName || subject && subject.surface || null,
    direction: subject && subject.direction || null,
    field: metadata.field || null,
    metadata
  };
}

function normalizeScopeEntry(scope) {
  if (typeof scope === 'string') {
    const value = normalizeString(scope);
    if (!value) return null;
    if (value === '*' || value === 'global' || value === 'event.bus') {
      return {
        type: 'global',
        ref: value
      };
    }
    if (value.startsWith('lane:')) {
      return {
        type: 'lane',
        ref: normalizeString(value.slice('lane:'.length))
      };
    }
    if (value.startsWith('shell.slot:')) {
      return {
        type: 'shell.slot',
        ref: value
      };
    }
    if (value.startsWith('shell.route:')) {
      return {
        type: 'shell.route',
        ref: value
      };
    }
    if (value.startsWith('shell.session:')) {
      return {
        type: 'shell.session',
        ref: value
      };
    }
    return {
      type: 'surface',
      ref: value
    };
  }

  const source = scope && typeof scope === 'object' ? scope : {};
  const type = normalizeString(source.type || source.kind);
  return {
    type,
    ref: normalizeString(source.ref || source.id || source.name || source.target || source.lane || source.route || source.session)
  };
}

function normalizeScopes(scopes) {
  return toArray(scopes).map(normalizeScopeEntry).filter(Boolean);
}

function surfaceHasLane(surface, ref) {
  return toArray(surface && surface.lanes).some((lane) => lane && (lane.name === ref || lane.laneId === ref));
}

function surfaceHasShellTarget(surface, ref) {
  return toArray(surface && surface.shellTargets).some((target) => target && target.target === ref);
}

function scopeIsKnown(scope, surface, context) {
  if (!scope || !scope.ref) return false;
  if (scope.type === 'surface') {
    return scope.ref === surface.name || scope.ref === surface.surfaceId || scope.ref === surface.enterpriseSurfaceId || context.surfaceIndex.has(scope.ref);
  }
  if (scope.type === 'lane') return surfaceHasLane(surface, scope.ref);
  if (scope.type === 'shell.slot') return surfaceHasShellTarget(surface, scope.ref) || context.shellTargetIndex.has(scope.ref);
  if (scope.type === 'shell.route') return context.shellRoutes.includes(scope.ref);
  if (scope.type === 'shell.session') return context.shellSessions.includes(scope.ref);
  return false;
}

function normalizeBinding(event, binding, index, context) {
  const source = binding && typeof binding === 'object' ? binding : {};
  const surfaceRef = normalizeString(source.surface || source.surfaceName || source.enterpriseSurfaceId || source.surfaceId);
  const surface = context.surfaceIndex.get(surfaceRef) || null;
  const direction = normalizeString(source.direction);
  const owner = normalizeOwner(source.owner || event.owner);
  const payload = normalizePayload(source.payload || event.payload);
  const scopes = normalizeScopes(source.scopes || source.scope);
  const diagnostics = [];
  const bindingRecord = {
    schema: RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA,
    bindingId: source.bindingId || `${event.event || 'unknown'}:${surfaceRef || 'unknown'}:${direction || index}`,
    event: event.event || null,
    direction,
    owner,
    payload,
    surfaceName: surface && surface.name || surfaceRef || null,
    enterpriseSurfaceId: surface && surface.enterpriseSurfaceId || source.enterpriseSurfaceId || null,
    surfaceId: surface && surface.surfaceId || source.surfaceId || null,
    surfaceKind: surface && surface.kind || null,
    remote: Boolean(surface && surface.remote && surface.remote.enabled),
    scopes,
    shellTargets: surface ? cloneJson(surface.shellTargets || []) : [],
    lanes: surface ? cloneJson(surface.lanes || []) : [],
    diagnostics: []
  };

  if (!surface) {
    diagnostics.push(createProtocolDiagnostic(
      bindingRecord,
      CROSS_SURFACE_EVENT_SURFACE_UNKNOWN_CODE,
      `Cross surface event "${event.event || 'unknown'}" references unknown surface "${surfaceRef || 'missing'}".`,
      'error',
      { field: 'surface', surfaceRef }
    ));
  }

  if (!CROSS_SURFACE_EVENT_DIRECTIONS.includes(direction)) {
    diagnostics.push(createProtocolDiagnostic(
      bindingRecord,
      CROSS_SURFACE_EVENT_DIRECTION_INVALID_CODE,
      `Cross surface event "${event.event || 'unknown'}" has invalid direction "${direction || 'missing'}".`,
      'error',
      { field: 'direction', allowedDirections: CROSS_SURFACE_EVENT_DIRECTIONS.slice() }
    ));
  }

  if (!owner.known) {
    diagnostics.push(createProtocolDiagnostic(
      bindingRecord,
      CROSS_SURFACE_EVENT_OWNER_MISSING_CODE,
      `Cross surface event "${event.event || 'unknown'}" binding must declare an owner.`,
      'error',
      { field: 'owner' }
    ));
  }

  if (!payload.schema) {
    diagnostics.push(createProtocolDiagnostic(
      bindingRecord,
      CROSS_SURFACE_EVENT_PAYLOAD_MISSING_CODE,
      `Cross surface event "${event.event || 'unknown'}" binding must declare a payload schema.`,
      'error',
      { field: 'payload' }
    ));
  }

  if (scopes.length === 0) {
    diagnostics.push(createProtocolDiagnostic(
      bindingRecord,
      CROSS_SURFACE_EVENT_SCOPE_MISSING_CODE,
      `Cross surface event "${event.event || 'unknown'}" binding must declare at least one surface, lane or shell scope.`,
      'error',
      { field: 'scopes' }
    ));
  }

  scopes.forEach((scope) => {
    if (scope.type === 'global' || scope.ref === '*' || scope.ref === 'global' || scope.ref === 'event.bus') {
      diagnostics.push(createProtocolDiagnostic(
        bindingRecord,
        CROSS_SURFACE_EVENT_SCOPE_GLOBAL_FORBIDDEN_CODE,
        `Cross surface event "${event.event || 'unknown'}" must not use an implicit global bus scope.`,
        'error',
        { field: 'scopes', scope }
      ));
      return;
    }

    if (!CROSS_SURFACE_EVENT_SCOPE_TYPES.includes(scope.type) || !scopeIsKnown(scope, surface, context)) {
      diagnostics.push(createProtocolDiagnostic(
        bindingRecord,
        CROSS_SURFACE_EVENT_SCOPE_UNKNOWN_CODE,
        `Cross surface event "${event.event || 'unknown'}" has unresolved scope "${scope.type}:${scope.ref}".`,
        'error',
        { field: 'scopes', scope, allowedScopeTypes: CROSS_SURFACE_EVENT_SCOPE_TYPES.slice() }
      ));
    }
  });

  bindingRecord.status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';
  bindingRecord.diagnostics = diagnostics;
  return bindingRecord;
}

function normalizeEventEntry(entry, context) {
  const source = entry && typeof entry === 'object' ? entry : {};
  const eventName = normalizeString(source.event || source.name || source.id);
  const owner = normalizeOwner(source.owner);
  const payload = normalizePayload(source.payload);
  const version = normalizeString(source.version || source.eventVersion);
  const event = {
    event: eventName,
    owner,
    payload,
    version
  };
  const diagnostics = [];
  const bindings = toArray(source.bindings).map((binding, index) => normalizeBinding(event, binding, index, context));
  const bindingDiagnostics = bindings.flatMap((binding) => binding.diagnostics);
  const ownerIds = Array.from(new Set(bindings.map((binding) => binding.owner && binding.owner.id).filter(Boolean)));
  const payloadSignatures = Array.from(new Set(bindings.map((binding) => payloadSignature(binding.payload)).filter(Boolean)));
  const outboundBindings = bindings.filter((binding) => binding.direction === 'outbound');
  const inboundBindings = bindings.filter((binding) => binding.direction === 'inbound');
  const seenBindings = new Map();

  if (!eventName || eventName === '*') {
    diagnostics.push(createProtocolDiagnostic(
      event,
      CROSS_SURFACE_EVENT_SCOPE_GLOBAL_FORBIDDEN_CODE,
      'Cross surface events must use explicit event names and never wildcard global events.',
      'error',
      { field: 'event' }
    ));
  }

  if (!owner.known) {
    diagnostics.push(createProtocolDiagnostic(
      event,
      CROSS_SURFACE_EVENT_OWNER_MISSING_CODE,
      `Cross surface event "${eventName || 'unknown'}" must declare an owner.`,
      'error',
      { field: 'owner' }
    ));
  }

  if (!version) {
    diagnostics.push(createProtocolDiagnostic(
      event,
      CROSS_SURFACE_EVENT_VERSION_MISSING_CODE,
      `Cross surface event "${eventName || 'unknown'}" must declare an event version.`,
      'error',
      { field: 'version' }
    ));
  }

  if (!payload.schema) {
    diagnostics.push(createProtocolDiagnostic(
      event,
      CROSS_SURFACE_EVENT_PAYLOAD_MISSING_CODE,
      `Cross surface event "${eventName || 'unknown'}" must declare a payload schema.`,
      'error',
      { field: 'payload' }
    ));
  }

  if (ownerIds.some((ownerId) => ownerId !== owner.id)) {
    diagnostics.push(createProtocolDiagnostic(
      event,
      CROSS_SURFACE_EVENT_OWNER_CONFLICT_CODE,
      `Cross surface event "${eventName || 'unknown'}" has binding owners that differ from the event owner.`,
      'error',
      { field: 'owner', eventOwner: owner.id, bindingOwners: ownerIds }
    ));
  }

  if (payloadSignatures.length > 1) {
    diagnostics.push(createProtocolDiagnostic(
      event,
      CROSS_SURFACE_EVENT_PAYLOAD_CONFLICT_CODE,
      `Cross surface event "${eventName || 'unknown'}" has inconsistent payload schemas across bindings.`,
      'error',
      { field: 'payload' }
    ));
  }

  if (outboundBindings.length === 0 || inboundBindings.length === 0) {
    diagnostics.push(createProtocolDiagnostic(
      event,
      CROSS_SURFACE_EVENT_PAIRING_MISSING_CODE,
      `Cross surface event "${eventName || 'unknown'}" must have at least one outbound and one inbound binding.`,
      'error',
      { field: 'bindings', outboundCount: outboundBindings.length, inboundCount: inboundBindings.length }
    ));
  }

  bindings.forEach((binding) => {
    const key = `${binding.event}:${binding.surfaceName}:${binding.direction}`;
    if (seenBindings.has(key)) {
      diagnostics.push(createProtocolDiagnostic(
        binding,
        CROSS_SURFACE_EVENT_DUPLICATE_BINDING_CODE,
        `Cross surface event binding "${key}" is duplicated.`,
        'error',
        { field: 'bindings', duplicateOf: seenBindings.get(key) }
      ));
    } else {
      seenBindings.set(key, binding.bindingId);
    }
  });

  const allDiagnostics = diagnostics.concat(bindingDiagnostics);
  const status = allDiagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';
  return {
    schema: RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA,
    eventId: `crossSurfaceEvent:${eventName || 'unknown'}`,
    event: eventName || null,
    owner,
    version,
    payload,
    status,
    outboundCount: outboundBindings.length,
    inboundCount: inboundBindings.length,
    bindings,
    scopes: uniqueScopes(bindings.flatMap((binding) => binding.scopes)),
    surfaces: Array.from(new Set(bindings.map((binding) => binding.enterpriseSurfaceId).filter(Boolean))),
    directions: {
      outbound: outboundBindings.map((binding) => binding.bindingId),
      inbound: inboundBindings.map((binding) => binding.bindingId)
    },
    diagnostics: allDiagnostics
  };
}

function uniqueScopes(scopes) {
  const seen = new Set();
  const result = [];
  scopes.forEach((scope) => {
    const key = scopeKey(scope);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(scope);
    }
  });
  return result;
}

function scopeKey(scope) {
  if (!scope || !scope.type || !scope.ref) return 'unknown:unknown';
  const prefixed = `${scope.type}:`;
  return String(scope.ref).startsWith(prefixed) ? scope.ref : `${scope.type}:${scope.ref}`;
}

function buildIndexes(enterpriseRegistry, events) {
  const surfaces = toArray(enterpriseRegistry && enterpriseRegistry.surfaces);
  const shellTargetIndex = new Set();
  surfaces.forEach((surface) => {
    toArray(surface.shellTargets).forEach((target) => {
      if (target && target.target) shellTargetIndex.add(target.target);
    });
  });

  const byOwner = {};
  const bySurface = {};
  const byScope = {};
  const byDirection = {};
  events.forEach((event) => {
    const ownerId = event.owner && event.owner.id || 'unowned';
    (byOwner[ownerId] || (byOwner[ownerId] = [])).push(event.eventId);
    event.bindings.forEach((binding) => {
      (bySurface[binding.enterpriseSurfaceId || binding.surfaceName || 'unknown'] || (bySurface[binding.enterpriseSurfaceId || binding.surfaceName || 'unknown'] = [])).push(binding.bindingId);
      (byDirection[binding.direction || 'unknown'] || (byDirection[binding.direction || 'unknown'] = [])).push(binding.bindingId);
      binding.scopes.forEach((scope) => {
        const key = scopeKey(scope);
        (byScope[key] || (byScope[key] = [])).push(binding.bindingId);
      });
    });
  });

  return {
    shellTargetIndex,
    report: {
      byOwner,
      bySurface,
      byScope,
      byDirection
    }
  };
}

function createRmtVNextCrossSurfaceEventProtocol(input = {}, options = {}) {
  const enterpriseRegistry = input.enterpriseRegistry || {};
  const eventsInput = toArray(input.events || input.protocol && input.protocol.events);
  const indexes = buildIndexes(enterpriseRegistry, []);
  const context = {
    surfaceIndex: createSurfaceIndex(enterpriseRegistry.surfaces),
    shellTargetIndex: indexes.shellTargetIndex,
    shellRoutes: toArray(input.shellRoutes || input.protocol && input.protocol.shellRoutes).map(normalizeString).filter(Boolean),
    shellSessions: toArray(input.shellSessions || input.protocol && input.protocol.shellSessions).map(normalizeString).filter(Boolean)
  };
  const events = eventsInput.map((event) => normalizeEventEntry(event, context));
  const reportIndexes = buildIndexes(enterpriseRegistry, events).report;
  const diagnostics = events.flatMap((event) => event.diagnostics);
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
    protocolSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
    eventSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA,
    bindingSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    eventActionSchema: RMT_VNEXT_EVENT_ACTION_SCHEMA,
    enterpriseRegistrySchema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    enterpriseSurfaceSchema: RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
    workpackage: RMT_VNEXT_CROSS_SURFACE_EVENT_WORKPACKAGE,
    protocolId: input.protocolId || input.protocol && input.protocol.protocolId || `crossSurfaceEvents:${enterpriseRegistry.registryId || 'rmt.vnext.document'}`,
    status,
    ok: status !== 'blocked',
    eventCount: events.length,
    bindingCount: events.reduce((count, event) => count + event.bindings.length, 0),
    crossSurfaceEventCount: events.filter((event) => event.surfaces.length > 1).length,
    scopeTypes: CROSS_SURFACE_EVENT_SCOPE_TYPES.slice(),
    directions: CROSS_SURFACE_EVENT_DIRECTIONS.slice(),
    eventBus: {
      mode: 'explicit-scoped-protocol',
      implicitGlobalBusAllowed: false,
      scopedBy: ['surface', 'lane', 'shell.slot', 'shell.route', 'shell.session']
    },
    kernelBoundary: {
      remoteRuntimeExecution: false,
      hostAdapterRequired: true,
      networkRequiredByKernel: false
    },
    indexes: reportIndexes,
    events,
    diagnostics
  };
}

function serializeCrossSurfaceEventProtocol(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

function createRmtVNextCrossSurfaceEventProtocolAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
    reportSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
    eventSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA,
    bindingSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    eventActionSchema: RMT_VNEXT_EVENT_ACTION_SCHEMA,
    enterpriseRegistrySchema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    workpackage: RMT_VNEXT_CROSS_SURFACE_EVENT_WORKPACKAGE,
    scopeTypes: CROSS_SURFACE_EVENT_SCOPE_TYPES,
    directions: CROSS_SURFACE_EVENT_DIRECTIONS,
    createProtocol: (input, options = {}) => createRmtVNextCrossSurfaceEventProtocol({
      ...defaultOptions,
      ...input
    }, options),
    serializeProtocol: serializeCrossSurfaceEventProtocol
  });
}

module.exports = {
  CROSS_SURFACE_EVENT_DIRECTIONS,
  CROSS_SURFACE_EVENT_DIRECTION_INVALID_CODE,
  CROSS_SURFACE_EVENT_DUPLICATE_BINDING_CODE,
  CROSS_SURFACE_EVENT_OWNER_CONFLICT_CODE,
  CROSS_SURFACE_EVENT_OWNER_MISSING_CODE,
  CROSS_SURFACE_EVENT_PAIRING_MISSING_CODE,
  CROSS_SURFACE_EVENT_PAYLOAD_CONFLICT_CODE,
  CROSS_SURFACE_EVENT_PAYLOAD_MISSING_CODE,
  CROSS_SURFACE_EVENT_SCOPE_GLOBAL_FORBIDDEN_CODE,
  CROSS_SURFACE_EVENT_SCOPE_MISSING_CODE,
  CROSS_SURFACE_EVENT_SCOPE_TYPES,
  CROSS_SURFACE_EVENT_SCOPE_UNKNOWN_CODE,
  CROSS_SURFACE_EVENT_SURFACE_UNKNOWN_CODE,
  CROSS_SURFACE_EVENT_VERSION_MISSING_CODE,
  RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_CONTRACT_PATH,
  RMT_VNEXT_CROSS_SURFACE_EVENT_MODULE_PATH,
  RMT_VNEXT_CROSS_SURFACE_EVENT_PACKAGE_SCRIPT,
  RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_SUITE_PATH,
  RMT_VNEXT_CROSS_SURFACE_EVENT_WORKPACKAGE,
  RMT_VNEXT_CROSS_SURFACE_EVENT_WP_PATH,
  createRmtVNextCrossSurfaceEventProtocol,
  createRmtVNextCrossSurfaceEventProtocolAdapter,
  serializeCrossSurfaceEventProtocol
};
