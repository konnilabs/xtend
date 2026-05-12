'use strict';

const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA
} = require('./vnext-enterprise-registry');
const {
  RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA
} = require('./vnext-cross-surface-events');

const RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA = 'xtend.rmt.vnext-event-governance-policy.v1';
const RMT_VNEXT_EVENT_GOVERNANCE_EVENT_SCHEMA = 'xtend.rmt.vnext-event-governance-event.v1';
const RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA = 'xtend.rmt.vnext-event-governance-report.v1';
const RMT_VNEXT_EVENT_GOVERNANCE_WORKPACKAGE = 'WP-E16-07';
const RMT_VNEXT_EVENT_GOVERNANCE_MODULE_PATH = 'tools/rmt-language/vnext-event-governance.js';
const RMT_VNEXT_EVENT_GOVERNANCE_SUITE_PATH = 'tests/rmt-language/rmt_vnext_event_governance_suite.js';
const RMT_VNEXT_EVENT_GOVERNANCE_CONTRACT_PATH = 'development/XTendRMT-vNext-Event-Governance-Contract.md';
const RMT_VNEXT_EVENT_GOVERNANCE_WP_PATH = 'development/WP-E16-07-Event-Ownership-Delivery-Policy-und-Governance-Diagnostics-bauen.md';
const RMT_VNEXT_EVENT_GOVERNANCE_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-event-governance';

const EVENT_GOVERNANCE_DELIVERY_POLICY_MISSING_CODE = 'rmt.vnext.event_governance.delivery_policy_missing';
const EVENT_GOVERNANCE_DELIVERY_MODE_INVALID_CODE = 'rmt.vnext.event_governance.delivery_mode_invalid';
const EVENT_GOVERNANCE_TTL_MISSING_CODE = 'rmt.vnext.event_governance.ttl_missing';
const EVENT_GOVERNANCE_CORRELATION_ID_MISSING_CODE = 'rmt.vnext.event_governance.correlation_id_missing';
const EVENT_GOVERNANCE_IDEMPOTENCY_KEY_MISSING_CODE = 'rmt.vnext.event_governance.idempotency_key_missing';
const EVENT_GOVERNANCE_SENSITIVITY_MISSING_CODE = 'rmt.vnext.event_governance.sensitivity_missing';
const EVENT_GOVERNANCE_OWNER_UNKNOWN_CODE = 'rmt.vnext.event_governance.owner_unknown';
const EVENT_GOVERNANCE_VERSION_OWNER_MISMATCH_CODE = 'rmt.vnext.event_governance.version_owner_mismatch';
const EVENT_GOVERNANCE_PAYLOAD_OWNER_MISMATCH_CODE = 'rmt.vnext.event_governance.payload_owner_mismatch';
const EVENT_GOVERNANCE_IMPLICIT_COUPLING_CODE = 'rmt.vnext.event_governance.implicit_coupling';
const EVENT_GOVERNANCE_CROSS_TEAM_REVIEW_MISSING_CODE = 'rmt.vnext.event_governance.cross_team_review_missing';
const EVENT_GOVERNANCE_PROTOCOL_BLOCKED_CODE = 'rmt.vnext.event_governance.protocol_blocked';

const EVENT_GOVERNANCE_DELIVERY_MODES = Object.freeze(['sync', 'queued', 'replayable', 'drop-if-stale']);
const EVENT_GOVERNANCE_SENSITIVITY_LEVELS = Object.freeze(['public', 'internal', 'confidential', 'restricted']);

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

function createSurfaceOwnerIndex(enterpriseRegistry) {
  const bySurfaceId = new Map();
  toArray(enterpriseRegistry && enterpriseRegistry.surfaces).forEach((surface) => {
    const owner = normalizeOwner(surface && surface.owner);
    [
      surface && surface.enterpriseSurfaceId,
      surface && surface.surfaceId,
      surface && surface.name
    ].filter(Boolean).forEach((key) => bySurfaceId.set(key, owner));
  });
  return bySurfaceId;
}

function createOwnerCatalog(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const result = new Map();
  Object.keys(source).forEach((key) => {
    const value = source[key] && typeof source[key] === 'object' ? source[key] : {};
    const owner = normalizeOwner({
      id: value.id || key,
      kind: value.kind || 'team'
    });
    result.set(owner.id, {
      owner,
      eventPrefixes: toArray(value.eventPrefixes).map(normalizeString).filter(Boolean),
      events: toArray(value.events || value.ownedEvents).map(normalizeString).filter(Boolean),
      payloadSchemas: toArray(value.payloadSchemas || value.ownedPayloadSchemas).map(normalizeString).filter(Boolean)
    });
  });
  return result;
}

function lookupPolicy(policies, event) {
  const source = policies && typeof policies === 'object' ? policies : {};
  const keys = [
    event.event,
    event.eventId
  ].filter(Boolean);

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
  }

  return null;
}

function requiresFact(value) {
  return value === true || value === 'required' || value === 'mandatory';
}

function normalizeDeliveryPolicy(policy = {}) {
  const source = policy && typeof policy === 'object' ? policy : {};
  const delivery = source.delivery && typeof source.delivery === 'object' ? source.delivery : source;
  return {
    mode: normalizeString(delivery.mode),
    ttlMs: Number.isFinite(delivery.ttlMs) ? delivery.ttlMs : null,
    correlationId: delivery.correlationId === undefined ? null : delivery.correlationId,
    idempotencyKey: delivery.idempotencyKey === undefined ? null : delivery.idempotencyKey,
    sensitivity: normalizeString(delivery.sensitivity),
    crossTeamReview: normalizeString(delivery.crossTeamReview || source.crossTeamReview),
    ordered: delivery.ordered === true,
    replayable: delivery.replayable === true || normalizeString(delivery.mode) === 'replayable'
  };
}

function normalizeGovernancePolicy(policy = {}, event = {}) {
  const source = policy && typeof policy === 'object' ? policy : {};
  const eventOwner = event.owner && event.owner.id || '';
  return {
    schema: RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
    owner: normalizeOwner(source.owner || event.owner),
    versionOwner: normalizeString(source.versionOwner || eventOwner),
    payloadOwner: normalizeString(source.payloadOwner || eventOwner),
    delivery: normalizeDeliveryPolicy(source),
    source: cloneJson(source)
  };
}

function createGovernanceDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
    workpackage: RMT_VNEXT_EVENT_GOVERNANCE_WORKPACKAGE,
    severity,
    code,
    message,
    event: subject && subject.event || null,
    eventId: subject && subject.eventId || null,
    owner: subject && subject.owner && subject.owner.id || null,
    field: metadata.field || null,
    metadata
  };
}

function eventOwnedBy(catalogEntry, eventName) {
  if (!catalogEntry) return false;
  if (catalogEntry.events.includes(eventName)) return true;
  return catalogEntry.eventPrefixes.some((prefix) => eventName.startsWith(prefix));
}

function payloadOwnedBy(catalogEntry, payloadSchema) {
  if (!catalogEntry) return false;
  return catalogEntry.payloadSchemas.includes(payloadSchema);
}

function createCoupling(event, surfaceOwnerIndex) {
  const producers = event.bindings.filter((binding) => binding.direction === 'outbound');
  const consumers = event.bindings.filter((binding) => binding.direction === 'inbound');
  const surfaceOwnerIds = Array.from(new Set(event.bindings.map((binding) => {
    const owner = surfaceOwnerIndex.get(binding.enterpriseSurfaceId) || surfaceOwnerIndex.get(binding.surfaceName);
    return owner && owner.id || 'unowned';
  }).filter(Boolean)));
  const eventOwnerId = event.owner && event.owner.id || 'unowned';
  return {
    producerSurfaceIds: producers.map((binding) => binding.enterpriseSurfaceId || binding.surfaceName).filter(Boolean),
    consumerSurfaceIds: consumers.map((binding) => binding.enterpriseSurfaceId || binding.surfaceName).filter(Boolean),
    surfaceOwnerIds,
    crossTeam: surfaceOwnerIds.some((ownerId) => ownerId !== eventOwnerId),
    producerCount: producers.length,
    consumerCount: consumers.length,
    bindingCount: event.bindings.length
  };
}

function validateDelivery(eventRecord, policy, diagnostics) {
  const delivery = policy.delivery;
  if (!delivery.mode) {
    diagnostics.push(createGovernanceDiagnostic(
      eventRecord,
      EVENT_GOVERNANCE_DELIVERY_POLICY_MISSING_CODE,
      `Event "${eventRecord.event}" must declare a delivery policy.`,
      'error',
      { field: 'delivery.mode' }
    ));
  } else if (!EVENT_GOVERNANCE_DELIVERY_MODES.includes(delivery.mode)) {
    diagnostics.push(createGovernanceDiagnostic(
      eventRecord,
      EVENT_GOVERNANCE_DELIVERY_MODE_INVALID_CODE,
      `Event "${eventRecord.event}" uses unsupported delivery mode "${delivery.mode}".`,
      'error',
      { field: 'delivery.mode', allowedModes: EVENT_GOVERNANCE_DELIVERY_MODES.slice() }
    ));
  }

  if (!Number.isFinite(delivery.ttlMs) || delivery.ttlMs <= 0) {
    diagnostics.push(createGovernanceDiagnostic(
      eventRecord,
      EVENT_GOVERNANCE_TTL_MISSING_CODE,
      `Event "${eventRecord.event}" must declare a positive TTL.`,
      'error',
      { field: 'delivery.ttlMs' }
    ));
  }

  if (!requiresFact(delivery.correlationId)) {
    diagnostics.push(createGovernanceDiagnostic(
      eventRecord,
      EVENT_GOVERNANCE_CORRELATION_ID_MISSING_CODE,
      `Event "${eventRecord.event}" must require a correlationId.`,
      'error',
      { field: 'delivery.correlationId' }
    ));
  }

  if (!requiresFact(delivery.idempotencyKey)) {
    diagnostics.push(createGovernanceDiagnostic(
      eventRecord,
      EVENT_GOVERNANCE_IDEMPOTENCY_KEY_MISSING_CODE,
      `Event "${eventRecord.event}" must require an idempotencyKey.`,
      'error',
      { field: 'delivery.idempotencyKey' }
    ));
  }

  if (!EVENT_GOVERNANCE_SENSITIVITY_LEVELS.includes(delivery.sensitivity)) {
    diagnostics.push(createGovernanceDiagnostic(
      eventRecord,
      EVENT_GOVERNANCE_SENSITIVITY_MISSING_CODE,
      `Event "${eventRecord.event}" must declare a valid sensitivity level.`,
      'error',
      { field: 'delivery.sensitivity', allowedSensitivity: EVENT_GOVERNANCE_SENSITIVITY_LEVELS.slice() }
    ));
  }
}

function createGovernanceEventRecord(event, context) {
  const policySource = lookupPolicy(context.policies, event);
  const policy = normalizeGovernancePolicy(policySource, event);
  const ownerId = event.owner && event.owner.id || '';
  const ownerCatalogEntry = context.ownerCatalog.get(ownerId);
  const versionOwnerEntry = context.ownerCatalog.get(policy.versionOwner);
  const payloadOwnerEntry = context.ownerCatalog.get(policy.payloadOwner);
  const coupling = createCoupling(event, context.surfaceOwnerIndex);
  const diagnostics = [];
  const eventRecord = {
    schema: RMT_VNEXT_EVENT_GOVERNANCE_EVENT_SCHEMA,
    eventId: event.eventId,
    event: event.event,
    owner: cloneJson(event.owner),
    version: event.version,
    payload: cloneJson(event.payload),
    policy,
    delivery: policy.delivery,
    coupling,
    diagnostics: []
  };

  if (!policySource) {
    diagnostics.push(createGovernanceDiagnostic(
      eventRecord,
      EVENT_GOVERNANCE_DELIVERY_POLICY_MISSING_CODE,
      `Event "${event.event}" must have an explicit governance policy.`,
      'error',
      { field: 'policies' }
    ));
  }

  validateDelivery(eventRecord, policy, diagnostics);

  if (!ownerCatalogEntry || !eventOwnedBy(ownerCatalogEntry, event.event)) {
    diagnostics.push(createGovernanceDiagnostic(
      eventRecord,
      EVENT_GOVERNANCE_OWNER_UNKNOWN_CODE,
      `Event "${event.event}" is not owned by a known governance owner.`,
      'error',
      { field: 'owner', owner: ownerId }
    ));
  }

  if (policy.versionOwner !== ownerId || !eventOwnedBy(versionOwnerEntry, event.event)) {
    diagnostics.push(createGovernanceDiagnostic(
      eventRecord,
      EVENT_GOVERNANCE_VERSION_OWNER_MISMATCH_CODE,
      `Event "${event.event}" version owner must match the event owner and own the event namespace.`,
      'error',
      { field: 'versionOwner', eventOwner: ownerId, versionOwner: policy.versionOwner }
    ));
  }

  if (policy.payloadOwner !== ownerId || !payloadOwnedBy(payloadOwnerEntry, event.payload && event.payload.schema)) {
    diagnostics.push(createGovernanceDiagnostic(
      eventRecord,
      EVENT_GOVERNANCE_PAYLOAD_OWNER_MISMATCH_CODE,
      `Event "${event.event}" payload owner must match the event owner and own the payload schema.`,
      'error',
      { field: 'payloadOwner', eventOwner: ownerId, payloadOwner: policy.payloadOwner }
    ));
  }

  if (coupling.crossTeam && !policy.delivery.crossTeamReview) {
    diagnostics.push(createGovernanceDiagnostic(
      eventRecord,
      EVENT_GOVERNANCE_IMPLICIT_COUPLING_CODE,
      `Event "${event.event}" crosses team boundaries without an explicit cross-team review decision.`,
      'error',
      { field: 'delivery.crossTeamReview', surfaceOwnerIds: coupling.surfaceOwnerIds }
    ));
  } else if (coupling.crossTeam && policy.delivery.crossTeamReview !== 'approved') {
    diagnostics.push(createGovernanceDiagnostic(
      eventRecord,
      EVENT_GOVERNANCE_CROSS_TEAM_REVIEW_MISSING_CODE,
      `Event "${event.event}" crosses team boundaries but cross-team review is not approved.`,
      'error',
      { field: 'delivery.crossTeamReview', value: policy.delivery.crossTeamReview }
    ));
  }

  eventRecord.status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';
  eventRecord.diagnostics = diagnostics;
  return eventRecord;
}

function indexGovernance(events) {
  const byOwner = {};
  const byDeliveryMode = {};
  const bySensitivity = {};
  const crossTeamEvents = [];
  events.forEach((event) => {
    const ownerId = event.owner && event.owner.id || 'unowned';
    (byOwner[ownerId] || (byOwner[ownerId] = [])).push(event.eventId);
    (byDeliveryMode[event.delivery.mode || 'missing'] || (byDeliveryMode[event.delivery.mode || 'missing'] = [])).push(event.eventId);
    (bySensitivity[event.delivery.sensitivity || 'missing'] || (bySensitivity[event.delivery.sensitivity || 'missing'] = [])).push(event.eventId);
    if (event.coupling.crossTeam) crossTeamEvents.push(event.eventId);
  });
  return {
    byOwner,
    byDeliveryMode,
    bySensitivity,
    crossTeamEvents
  };
}

function createRmtVNextEventGovernanceReport(input = {}, options = {}) {
  const crossSurfaceEventReport = input.crossSurfaceEventReport || input.crossSurfaceEvents || {};
  const enterpriseRegistry = input.enterpriseRegistry || {};
  const ownerCatalog = createOwnerCatalog(input.ownerCatalog || input.owners || {});
  const context = {
    policies: input.policies || {},
    ownerCatalog,
    surfaceOwnerIndex: createSurfaceOwnerIndex(enterpriseRegistry),
    strict: options.strict !== false
  };
  const events = toArray(crossSurfaceEventReport.events).map((event) => createGovernanceEventRecord(event, context));
  const diagnostics = events.flatMap((event) => event.diagnostics);

  if (crossSurfaceEventReport.status === 'blocked' || crossSurfaceEventReport.ok === false) {
    diagnostics.push(createGovernanceDiagnostic(
      {
        event: null,
        eventId: crossSurfaceEventReport.protocolId || null,
        owner: null
      },
      EVENT_GOVERNANCE_PROTOCOL_BLOCKED_CODE,
      'Event governance cannot accept a blocked cross surface event protocol.',
      'error',
      { field: 'crossSurfaceEventReport.status', status: crossSurfaceEventReport.status }
    ));
  }

  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';
  return {
    schema: RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA,
    policySchema: RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
    governanceEventSchema: RMT_VNEXT_EVENT_GOVERNANCE_EVENT_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    crossSurfaceEventProtocolSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
    crossSurfaceEventReportSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
    crossSurfaceEventSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA,
    crossSurfaceEventBindingSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA,
    enterpriseRegistrySchema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    enterpriseSurfaceSchema: RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
    workpackage: RMT_VNEXT_EVENT_GOVERNANCE_WORKPACKAGE,
    governanceId: input.governanceId || `eventGovernance:${crossSurfaceEventReport.protocolId || enterpriseRegistry.registryId || 'rmt.vnext.document'}`,
    status,
    ok: status !== 'blocked',
    eventCount: events.length,
    governedEventCount: events.filter((event) => event.status === 'ready').length,
    crossTeamEventCount: events.filter((event) => event.coupling.crossTeam).length,
    deliveryModes: EVENT_GOVERNANCE_DELIVERY_MODES.slice(),
    sensitivityLevels: EVENT_GOVERNANCE_SENSITIVITY_LEVELS.slice(),
    governanceMode: {
      missingDeliveryPolicyBlocks: context.strict,
      crossTeamReviewRequired: true,
      implicitCouplingAllowed: false
    },
    indexes: indexGovernance(events),
    events,
    diagnostics
  };
}

function serializeEventGovernanceReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

function createRmtVNextEventGovernanceAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
    reportSchema: RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA,
    governanceEventSchema: RMT_VNEXT_EVENT_GOVERNANCE_EVENT_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    crossSurfaceEventReportSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
    enterpriseRegistrySchema: RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
    workpackage: RMT_VNEXT_EVENT_GOVERNANCE_WORKPACKAGE,
    deliveryModes: EVENT_GOVERNANCE_DELIVERY_MODES,
    sensitivityLevels: EVENT_GOVERNANCE_SENSITIVITY_LEVELS,
    createReport: (input, options = {}) => createRmtVNextEventGovernanceReport({
      ...defaultOptions,
      ...input
    }, options),
    serializeReport: serializeEventGovernanceReport
  });
}

module.exports = {
  EVENT_GOVERNANCE_CORRELATION_ID_MISSING_CODE,
  EVENT_GOVERNANCE_CROSS_TEAM_REVIEW_MISSING_CODE,
  EVENT_GOVERNANCE_DELIVERY_MODE_INVALID_CODE,
  EVENT_GOVERNANCE_DELIVERY_MODES,
  EVENT_GOVERNANCE_DELIVERY_POLICY_MISSING_CODE,
  EVENT_GOVERNANCE_IDEMPOTENCY_KEY_MISSING_CODE,
  EVENT_GOVERNANCE_IMPLICIT_COUPLING_CODE,
  EVENT_GOVERNANCE_OWNER_UNKNOWN_CODE,
  EVENT_GOVERNANCE_PAYLOAD_OWNER_MISMATCH_CODE,
  EVENT_GOVERNANCE_PROTOCOL_BLOCKED_CODE,
  EVENT_GOVERNANCE_SENSITIVITY_LEVELS,
  EVENT_GOVERNANCE_SENSITIVITY_MISSING_CODE,
  EVENT_GOVERNANCE_TTL_MISSING_CODE,
  EVENT_GOVERNANCE_VERSION_OWNER_MISMATCH_CODE,
  RMT_VNEXT_EVENT_GOVERNANCE_CONTRACT_PATH,
  RMT_VNEXT_EVENT_GOVERNANCE_EVENT_SCHEMA,
  RMT_VNEXT_EVENT_GOVERNANCE_MODULE_PATH,
  RMT_VNEXT_EVENT_GOVERNANCE_PACKAGE_SCRIPT,
  RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
  RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA,
  RMT_VNEXT_EVENT_GOVERNANCE_SUITE_PATH,
  RMT_VNEXT_EVENT_GOVERNANCE_WORKPACKAGE,
  RMT_VNEXT_EVENT_GOVERNANCE_WP_PATH,
  createRmtVNextEventGovernanceAdapter,
  createRmtVNextEventGovernanceReport,
  serializeEventGovernanceReport
};
