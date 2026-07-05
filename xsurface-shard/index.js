const XSURFACE_SHARD_PACKAGE = '@ccslabs/xtend-xsurface-shard';
const XSURFACE_SHARD_PLAN_SCHEMA = 'xtend.xsurface.shard-plan.v1';
const XSURFACE_SHARD_SNAPSHOT_SCHEMA = 'xtend.xsurface.shard-snapshot.v1';
const XSURFACE_SHARD_HANDOFF_SCHEMA = 'xtend.xsurface.shard-atc-handoff.v1';
const XSURFACE_SHARD_FRAGMENT_SCHEMA = 'xtend.xsurface.shard-stream-fragment.v1';
const XSURFACE_SHARD_SURFACE_SCHEMA = 'xtend.xsurface.shard-surface.v1';
const XSURFACE_SHARD_RECORD_SCHEMA = 'xtend.xsurface.shard.v1';

const XSURFACE_SHARD_SECURITY_BLOCKED_CODE = 'xsurface.shard.security_blocked';
const XSURFACE_SHARD_DEGRADATION_BLOCKED_CODE = 'xsurface.shard.degradation_blocked';
const XSURFACE_SHARD_FALLBACK_MISSING_CODE = 'xsurface.shard.fallback_missing';
const XSURFACE_SHARD_LIFECYCLE_INVALID_TRANSITION_CODE = 'xsurface.shard.lifecycle_invalid_transition';
const XSURFACE_SHARD_NON_SERIALIZABLE_PAYLOAD_CODE = 'xsurface.shard.non_serializable_payload';
const XSURFACE_SHARD_SURFACE_NOT_FOUND_CODE = 'xsurface.shard.surface_not_found';
const XSURFACE_SHARD_SERVER_DISPOSED_CODE = 'xsurface.shard.server_disposed';

const LIFECYCLE_INITIAL_STATE = 'planned';
const LIFECYCLE_ATTACH = 'attached';
const LIFECYCLE_DETACH = 'detached';
const LIFECYCLE_CANCEL = 'cancelled';
const LIFECYCLE_FALLBACK = 'fallback_active';

function toArray(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson(value, fallback = null) {
  if (value == null) return fallback;
  return JSON.parse(JSON.stringify(value));
}

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (!isPlainObject(value)) return value;
  return Object.keys(value).sort().reduce((record, key) => {
    record[key] = stableSort(value[key]);
    return record;
  }, {});
}

function normalizeString(value, fallback = '') {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function safeSegment(value, fallback = 'default') {
  const normalized = normalizeString(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return normalized || fallback;
}

function createDiagnostic(code, message, severity = 'error', extra = {}) {
  return {
    code,
    severity,
    message,
    ...extra
  };
}

function diagnosticIsError(diagnostic) {
  return diagnostic && diagnostic.severity === 'error';
}

function firstErrorDiagnostic(diagnostics) {
  return toArray(diagnostics).find(diagnosticIsError) || null;
}

function normalizeOwner(owner) {
  if (typeof owner === 'string') {
    return { kind: 'team', id: owner, known: owner !== 'default' };
  }
  if (isPlainObject(owner)) {
    const id = normalizeString(owner.id || owner.name || owner.team, 'default');
    return {
      ...cloneJson(owner, {}),
      kind: normalizeString(owner.kind, 'team'),
      id,
      known: owner.known !== false && id !== 'default'
    };
  }
  return { kind: 'team', id: 'default', known: false };
}

function ownerId(owner) {
  return normalizeOwner(owner).id || 'default';
}

function normalizeTargetRef(target) {
  if (typeof target === 'string') return target;
  if (isPlainObject(target)) return normalizeString(target.ref || target.target || target.id, 'default');
  return 'default';
}

function normalizeShellTarget(target) {
  if (typeof target === 'string') {
    return {
      lane: 'default',
      target,
      mode: 'mount'
    };
  }
  if (isPlainObject(target)) {
    return {
      lane: normalizeString(target.lane || target.laneId || target.name, 'default'),
      target: normalizeTargetRef(target.target || target.ref || target),
      mode: normalizeString(target.mode, 'mount')
    };
  }
  return {
    lane: 'default',
    target: 'default',
    mode: 'mount'
  };
}

function collectSurfaceTargets(surface) {
  const targets = []
    .concat(toArray(surface.shellTargets))
    .concat(toArray(surface.shellBindings))
    .concat(toArray(surface.exposes))
    .map(normalizeShellTarget)
    .filter(target => target.target);
  return targets.length > 0 ? targets : [normalizeShellTarget('default')];
}

function normalizeCapabilities(capabilities) {
  return toArray(capabilities).map((capability) => {
    if (typeof capability === 'string') return capability;
    if (isPlainObject(capability)) return normalizeString(capability.id || capability.name || capability.capability);
    return '';
  }).filter(Boolean).sort();
}

function surfaceKey(surface) {
  return normalizeString(surface.enterpriseSurfaceId || surface.surfaceId || surface.id || surface.name, 'unknown');
}

function sourceSurfaceId(surface) {
  return normalizeString(surface.surfaceId || surface.id || surface.enterpriseSurfaceId || surface.name, 'remoteSurface:unknown');
}

function normalizeSurface(surface) {
  const source = cloneJson(surface, {});
  const remote = isPlainObject(source.remote)
    ? cloneJson(source.remote, {})
    : { enabled: source.kind === 'remote' || source.kind === 'remote_surface' };
  const shellTargets = collectSurfaceTargets(source);
  const owner = normalizeOwner(source.owner);
  const primaryShellTarget = shellTargets[0] || normalizeShellTarget('default');
  const fallback = source.fallback || source.fallbackResolution && source.fallbackResolution.fallback || null;

  return {
    sourceRecord: source,
    enterpriseSurfaceId: normalizeString(source.enterpriseSurfaceId, null),
    surfaceId: sourceSurfaceId(source),
    manifestId: normalizeString(source.manifestId || remote.manifestId, null),
    name: normalizeString(source.name || source.id || source.surfaceId, 'remote.surface'),
    kind: normalizeString(source.kind, remote.enabled ? 'remote' : 'remote_surface'),
    owner,
    remote,
    shellTargets,
    primaryShellTarget,
    capabilities: normalizeCapabilities(source.capabilities),
    events: cloneJson(source.events || { emits: [], consumes: [] }, { emits: [], consumes: [] }),
    fallback: cloneJson(fallback, null),
    diagnostics: toArray(source.diagnostics).map(diagnostic => cloneJson(diagnostic, {})),
    status: normalizeString(source.status, 'ready')
  };
}

function surfaceIsRemote(surface) {
  if (!surface || !isPlainObject(surface)) return false;
  if (surface.kind === 'remote' || surface.kind === 'remote_surface') return true;
  if (surface.type === 'remote') return true;
  return Boolean(surface.remote && (surface.remote.enabled || surface.remote.remoteId || surface.remote.id));
}

function collectRemoteSurfaces(input = {}) {
  const records = [];
  const add = surface => {
    if (surfaceIsRemote(surface)) records.push(surface);
  };

  toArray(input.surfaces).forEach(add);
  toArray(input.remoteSurfaces).forEach(add);
  if (input.remoteSurface) add(input.remoteSurface);
  toArray(input.enterpriseRegistry && input.enterpriseRegistry.surfaces).forEach(add);
  toArray(input.registry && input.registry.surfaces).forEach(add);
  toArray(input.document && input.document.remoteSurfaces).forEach(add);
  if (input.document && input.document.remoteSurface) add(input.document.remoteSurface);
  toArray(input.remoteManifest && input.remoteManifest.remoteSurfaces).forEach(add);
  if (input.remoteManifest && input.remoteManifest.remoteSurface) add(input.remoteManifest.remoteSurface);
  toArray(input.remoteManifests).forEach((manifest) => {
    toArray(manifest && manifest.remoteSurfaces).forEach(add);
    if (manifest && manifest.remoteSurface) add(manifest.remoteSurface);
  });

  const seen = new Set();
  return records
    .map(normalizeSurface)
    .filter((surface) => {
      const key = surfaceKey(surface);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => surfaceKey(a).localeCompare(surfaceKey(b)));
}

function addIndexEntry(index, key, value) {
  const normalized = normalizeString(key, null);
  if (normalized) index.set(normalized, value);
}

function createReportIndex(entries) {
  const index = new Map();
  toArray(entries).forEach((entry) => {
    if (!isPlainObject(entry)) return;
    addIndexEntry(index, entry.enterpriseSurfaceId, entry);
    addIndexEntry(index, entry.surfaceId, entry);
    addIndexEntry(index, entry.id, entry);
    addIndexEntry(index, entry.name, entry);
  });
  return index;
}

function findReportEntry(index, surface) {
  return index.get(surface.enterpriseSurfaceId) ||
    index.get(surface.surfaceId) ||
    index.get(surface.name) ||
    null;
}

function createShardId(owner, target) {
  return `xsurface-shard:${safeSegment(owner)}:${safeSegment(target)}`;
}

function createPlanId(input, surfaces) {
  return normalizeString(input.planId || input.shardPlanId, `xsurface-plan:${surfaces.length}:${surfaces.map(surfaceKey).join('|')}`);
}

function createSurfaceDecision(surface, reports) {
  const diagnostics = surface.diagnostics.slice();
  const sourceError = firstErrorDiagnostic(surface.diagnostics);
  const security = findReportEntry(reports.security, surface);
  const degradation = findReportEntry(reports.degradation, surface);
  const securityError = security && (security.status === 'blocked' || firstErrorDiagnostic(security.diagnostics));
  const degradationError = degradation && (degradation.state === 'blocked' || degradation.status === 'blocked' || firstErrorDiagnostic(degradation.diagnostics));
  const degradationState = degradation && normalizeString(degradation.state || degradation.status, null);
  const fallback = cloneJson(
    surface.fallback ||
    degradation && degradation.fallbackResolution && degradation.fallbackResolution.fallback ||
    degradation && degradation.fallback ||
    null,
    null
  );

  if (sourceError || surface.status === 'blocked') {
    diagnostics.push(createDiagnostic(
      XSURFACE_SHARD_DEGRADATION_BLOCKED_CODE,
      `Remote surface ${surface.name} is blocked before shard orchestration.`,
      'error',
      { source: sourceError && sourceError.code || surface.status }
    ));
    return { decision: 'refused', reason: 'source-blocked', fallback, diagnostics, security, degradation, degradationState };
  }

  if (securityError) {
    diagnostics.push(createDiagnostic(
      XSURFACE_SHARD_SECURITY_BLOCKED_CODE,
      `Remote surface ${surface.name} was refused by remote security policy.`,
      'error',
      { source: securityError.code || security.status }
    ));
    return { decision: 'refused', reason: 'security-blocked', fallback, diagnostics, security, degradation, degradationState };
  }

  if (degradationError) {
    diagnostics.push(createDiagnostic(
      XSURFACE_SHARD_DEGRADATION_BLOCKED_CODE,
      `Remote surface ${surface.name} was refused by degradation policy.`,
      'error',
      { source: degradationError.code || degradation.status || degradation.state }
    ));
    return { decision: 'refused', reason: 'degradation-blocked', fallback, diagnostics, security, degradation, degradationState };
  }

  if (degradationState === 'degraded') {
    if (!fallback || !fallback.ref) {
      diagnostics.push(createDiagnostic(
        XSURFACE_SHARD_FALLBACK_MISSING_CODE,
        `Remote surface ${surface.name} is degraded but has no fallback surface.`,
        'error'
      ));
      return { decision: 'refused', reason: 'fallback-missing', fallback, diagnostics, security, degradation, degradationState };
    }
    return { decision: 'degraded', reason: 'degraded-with-fallback', fallback, diagnostics, security, degradation, degradationState };
  }

  if (!fallback || !fallback.ref) {
    diagnostics.push(createDiagnostic(
      XSURFACE_SHARD_FALLBACK_MISSING_CODE,
      `Remote surface ${surface.name} has no fallback surface.`,
      'error'
    ));
    return { decision: 'refused', reason: 'fallback-missing', fallback, diagnostics, security, degradation, degradationState };
  }

  return { decision: 'ready', reason: 'policy-ready', fallback, diagnostics, security, degradation, degradationState };
}

function normalizePlanSurface(surface, reports) {
  const decision = createSurfaceDecision(surface, reports);
  const owner = ownerId(surface.owner);
  const primaryTarget = normalizeShellTarget(surface.primaryShellTarget);
  const primaryShellTarget = primaryTarget.target || 'default';
  const shardId = createShardId(owner, primaryShellTarget);

  return {
    schema: XSURFACE_SHARD_SURFACE_SCHEMA,
    surfaceId: surface.surfaceId,
    enterpriseSurfaceId: surface.enterpriseSurfaceId,
    manifestId: surface.manifestId,
    name: surface.name,
    owner: cloneJson(surface.owner, {}),
    remote: cloneJson(surface.remote, {}),
    shardId,
    primaryShellTarget,
    primaryLane: primaryTarget.lane || 'default',
    shellTargets: cloneJson(surface.shellTargets, []),
    capabilities: surface.capabilities.slice(),
    events: cloneJson(surface.events, { emits: [], consumes: [] }),
    fallback: decision.fallback,
    decision: decision.decision,
    decisionReason: decision.reason,
    securityStatus: decision.security && decision.security.status || null,
    degradationState: decision.degradationState,
    lifecycle: {
      state: LIFECYCLE_INITIAL_STATE
    },
    sourceRecord: cloneJson(surface.sourceRecord, {}),
    diagnostics: decision.diagnostics
  };
}

function compareDecision(a, b) {
  const order = { refused: 3, degraded: 2, ready: 1 };
  return (order[b] || 0) - (order[a] || 0);
}

function summarizeDecision(surfaces) {
  const decisions = surfaces.map(surface => surface.decision).sort(compareDecision);
  return decisions[0] || 'ready';
}

function createShardRecord(shardId, surfaces) {
  const sortedSurfaces = surfaces.slice().sort((a, b) => a.surfaceId.localeCompare(b.surfaceId));
  const first = sortedSurfaces[0] || {};
  return {
    schema: XSURFACE_SHARD_RECORD_SCHEMA,
    shardId,
    ownerId: ownerId(first.owner),
    primaryShellTarget: first.primaryShellTarget || 'default',
    decision: summarizeDecision(sortedSurfaces),
    surfaceCount: sortedSurfaces.length,
    surfaces: sortedSurfaces.map(surface => ({
      surfaceId: surface.surfaceId,
      enterpriseSurfaceId: surface.enterpriseSurfaceId,
      name: surface.name,
      decision: surface.decision,
      lifecycle: cloneJson(surface.lifecycle, { state: LIFECYCLE_INITIAL_STATE })
    })),
    diagnostics: sortedSurfaces.flatMap(surface => surface.diagnostics)
  };
}

function planStatus(surfaces) {
  if (surfaces.some(surface => surface.decision === 'refused')) return 'refused';
  if (surfaces.some(surface => surface.decision === 'degraded')) return 'degraded';
  return 'ready';
}

function createXSurfaceShardPlan(input = {}, options = {}) {
  const surfaces = collectRemoteSurfaces(input);
  const reports = {
    security: createReportIndex(
      toArray(input.remoteSecurityReport && input.remoteSecurityReport.postures)
        .concat(toArray(input.securityReport && input.securityReport.postures))
        .concat(toArray(input.securityPostures))
    ),
    degradation: createReportIndex(
      toArray(input.degradationReport && input.degradationReport.surfaces)
        .concat(toArray(input.degradationSurfaces))
    )
  };
  const planSurfaces = surfaces
    .map(surface => normalizePlanSurface(surface, reports))
    .sort((a, b) => a.shardId.localeCompare(b.shardId) || a.surfaceId.localeCompare(b.surfaceId));
  const shardMap = new Map();
  planSurfaces.forEach((surface) => {
    if (!shardMap.has(surface.shardId)) shardMap.set(surface.shardId, []);
    shardMap.get(surface.shardId).push(surface);
  });
  const shards = Array.from(shardMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([shardId, shardSurfaces]) => createShardRecord(shardId, shardSurfaces));
  const status = planStatus(planSurfaces);
  const diagnostics = planSurfaces.flatMap(surface => surface.diagnostics);

  return {
    schema: XSURFACE_SHARD_PLAN_SCHEMA,
    packageName: XSURFACE_SHARD_PACKAGE,
    planId: createPlanId(input, surfaces),
    generatedAt: options.generatedAt || 'static-local',
    status,
    ok: status !== 'refused',
    surfaceCount: planSurfaces.length,
    shardCount: shards.length,
    decisions: {
      ready: planSurfaces.filter(surface => surface.decision === 'ready').length,
      degraded: planSurfaces.filter(surface => surface.decision === 'degraded').length,
      refused: planSurfaces.filter(surface => surface.decision === 'refused').length
    },
    partitioning: {
      strategy: normalizeString(options.strategy, 'owner-primary-shell-target'),
      defaultShard: 'xsurface-shard:default:default'
    },
    runtimeBoundary: {
      remoteRuntimeExecution: false,
      kernelRemoteExecution: false,
      hostAdapterRequired: true,
      networkRequiredByKernel: false,
      networkRequiredByShardPlan: false
    },
    shards,
    surfaces: planSurfaces,
    diagnostics
  };
}

function partitionXSurfaceShardSurfaces(input = {}, options = {}) {
  return createXSurfaceShardPlan(input, options).shards;
}

function serializeXSurfaceShardPlan(plan) {
  return `${JSON.stringify(stableSort(plan), null, 2)}\n`;
}

function isSerializableValue(value, seen = new Set()) {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') return false;
  if (value === null || typeof value !== 'object') return true;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.every(entry => isSerializableValue(entry, seen));
  return Object.keys(value).every(key => isSerializableValue(value[key], seen));
}

function findPlanSurface(plan, surfaceRef) {
  const ref = typeof surfaceRef === 'string' ? surfaceRef : surfaceRef && (surfaceRef.surfaceId || surfaceRef.enterpriseSurfaceId || surfaceRef.name);
  return toArray(plan && plan.surfaces).find(surface =>
    surface.surfaceId === ref ||
    surface.enterpriseSurfaceId === ref ||
    surface.name === ref
  ) || null;
}

function createXSurfaceAtcHandoff(input = {}, options = {}) {
  const surface = input.surface || input.planSurface || input;
  const diagnostics = toArray(input.diagnostics).concat(toArray(surface && surface.diagnostics)).map(diagnostic => cloneJson(diagnostic, {}));
  const status = normalizeString(input.status || surface.decision, 'ready');
  const action = normalizeString(input.action, 'attach');
  const surfaceId = normalizeString(input.surfaceId || surface.surfaceId, 'remoteSurface:unknown');
  const shardId = normalizeString(input.shardId || surface.shardId, createShardId(ownerId(surface.owner), surface.primaryShellTarget));

  return {
    schema: XSURFACE_SHARD_HANDOFF_SCHEMA,
    handoffId: normalizeString(input.handoffId, `xsurface-handoff:${action}:${surfaceId}`),
    packageName: XSURFACE_SHARD_PACKAGE,
    status,
    ok: status !== 'refused',
    action,
    surfaceId,
    enterpriseSurfaceId: normalizeString(input.enterpriseSurfaceId || surface.enterpriseSurfaceId, null),
    shardId,
    atc: {
      protocol: 'xscaler-atc-compatible',
      sessionId: normalizeString(input.sessionId || options.sessionId, `${shardId}:${surfaceId}`),
      handoffSignal: normalizeString(input.handoffSignal, status === 'degraded' ? 'activate-fallback' : action),
      lifecycleState: normalizeString(input.lifecycleState || input.state, action)
    },
    fallback: cloneJson(input.fallback || surface.fallback || null, null),
    stream: {
      accepted: status !== 'refused',
      fragmentSchema: XSURFACE_SHARD_FRAGMENT_SCHEMA
    },
    runtimeBoundary: {
      remoteRuntimeExecution: false,
      kernelRemoteExecution: false,
      networkRequiredByHandoff: false
    },
    diagnostics
  };
}

function createXSurfaceStreamFragment(input = {}, options = {}) {
  const payload = input.payload == null ? null : input.payload;
  const surfaceId = normalizeString(input.surfaceId, 'remoteSurface:unknown');
  const shardId = normalizeString(input.shardId, 'xsurface-shard:default:default');
  const serializable = isSerializableValue(payload);
  const diagnostics = toArray(input.diagnostics).map(diagnostic => cloneJson(diagnostic, {}));

  if (!serializable) {
    diagnostics.push(createDiagnostic(
      XSURFACE_SHARD_NON_SERIALIZABLE_PAYLOAD_CODE,
      `Stream fragment for ${surfaceId} contains a non-serializable payload.`,
      'error'
    ));
  }
  const ok = serializable && !diagnostics.some(diagnosticIsError);

  return {
    schema: XSURFACE_SHARD_FRAGMENT_SCHEMA,
    fragmentId: normalizeString(input.fragmentId, `xsurface-fragment:${surfaceId}:${Number(input.sequence || 0)}`),
    packageName: XSURFACE_SHARD_PACKAGE,
    status: ok ? 'ready' : 'refused',
    ok,
    type: normalizeString(input.type, 'record'),
    sequence: Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 0,
    surfaceId,
    shardId,
    payload: serializable ? cloneJson(payload, null) : null,
    diagnostics,
    runtimeBoundary: {
      remoteRuntimeExecution: false,
      kernelRemoteExecution: false,
      networkRequiredByFragment: false
    }
  };
}

function createInvalidHandoff(surfaceRef, code, message, action = 'invalid') {
  const surfaceId = typeof surfaceRef === 'string' ? surfaceRef : normalizeString(surfaceRef && surfaceRef.surfaceId, 'remoteSurface:unknown');
  return createXSurfaceAtcHandoff({
    surfaceId,
    action,
    status: 'refused',
    lifecycleState: 'refused',
    diagnostics: [createDiagnostic(code, message, 'error')]
  });
}

function transitionAllowed(from, action, surface) {
  if (action === LIFECYCLE_ATTACH) return [LIFECYCLE_INITIAL_STATE, LIFECYCLE_DETACH, LIFECYCLE_FALLBACK].includes(from);
  if (action === LIFECYCLE_DETACH) return [LIFECYCLE_ATTACH, LIFECYCLE_FALLBACK].includes(from);
  if (action === LIFECYCLE_CANCEL) return [LIFECYCLE_INITIAL_STATE, LIFECYCLE_ATTACH, LIFECYCLE_DETACH, LIFECYCLE_FALLBACK].includes(from);
  if (action === LIFECYCLE_FALLBACK) return [LIFECYCLE_INITIAL_STATE, LIFECYCLE_ATTACH, LIFECYCLE_DETACH].includes(from) && surface && surface.fallback && surface.fallback.ref;
  return false;
}

function createXSurfaceShardServer(options = {}) {
  let disposed = false;
  let currentPlan = createXSurfaceShardPlan(options.input || options.planInput || {}, options);
  const lifecycle = new Map(currentPlan.surfaces.map(surface => [surface.surfaceId, LIFECYCLE_INITIAL_STATE]));
  const fragments = [];
  const serverDiagnostics = [];

  function ensureActive(action) {
    if (!disposed) return null;
    return createInvalidHandoff('remoteSurface:unknown', XSURFACE_SHARD_SERVER_DISPOSED_CODE, 'XSurface shard server has been disposed.', action);
  }

  function setPlan(input = {}, planOptions = {}) {
    const inactive = ensureActive('plan');
    if (inactive) return currentPlan;
    currentPlan = createXSurfaceShardPlan(input, { ...options, ...planOptions });
    lifecycle.clear();
    currentPlan.surfaces.forEach(surface => lifecycle.set(surface.surfaceId, LIFECYCLE_INITIAL_STATE));
    return currentPlan;
  }

  function transition(surfaceRef, action, handoffOptions = {}) {
    const inactive = ensureActive(action);
    if (inactive) return inactive;
    const surface = findPlanSurface(currentPlan, surfaceRef);
    if (!surface) {
      return createInvalidHandoff(surfaceRef, XSURFACE_SHARD_SURFACE_NOT_FOUND_CODE, 'Remote surface is not part of the current XSurface shard plan.', action);
    }
    const from = lifecycle.get(surface.surfaceId) || LIFECYCLE_INITIAL_STATE;
    const fallbackMissing = action === LIFECYCLE_FALLBACK && (!surface.fallback || !surface.fallback.ref);
    if (!transitionAllowed(from, action, surface)) {
      return createInvalidHandoff(
        surface.surfaceId,
        fallbackMissing ? XSURFACE_SHARD_FALLBACK_MISSING_CODE : XSURFACE_SHARD_LIFECYCLE_INVALID_TRANSITION_CODE,
        fallbackMissing
          ? `Remote surface ${surface.name} has no fallback surface.`
          : `Cannot transition ${surface.name} from ${from} to ${action}.`,
        action
      );
    }
    lifecycle.set(surface.surfaceId, action);
    return createXSurfaceAtcHandoff({
      surface,
      action,
      status: action === LIFECYCLE_FALLBACK ? 'degraded' : surface.decision,
      lifecycleState: action,
      handoffSignal: action === LIFECYCLE_FALLBACK ? 'activate-fallback' : action,
      ...handoffOptions
    }, options);
  }

  return Object.freeze({
    plan: setPlan,
    attach: (surfaceRef, handoffOptions = {}) => transition(surfaceRef, LIFECYCLE_ATTACH, handoffOptions),
    detach: (surfaceRef, handoffOptions = {}) => transition(surfaceRef, LIFECYCLE_DETACH, handoffOptions),
    cancel: (surfaceRef, handoffOptions = {}) => transition(surfaceRef, LIFECYCLE_CANCEL, handoffOptions),
    activateFallback: (surfaceRef, handoffOptions = {}) => transition(surfaceRef, LIFECYCLE_FALLBACK, handoffOptions),
    publishFragment: (input = {}, fragmentOptions = {}) => {
      const inactive = ensureActive('publish-fragment');
      if (inactive) return createXSurfaceStreamFragment({
        surfaceId: 'remoteSurface:unknown',
        shardId: 'xsurface-shard:default:default',
        diagnostics: inactive.diagnostics
      });
      const fragment = createXSurfaceStreamFragment(input, { ...options, ...fragmentOptions });
      if (fragment.ok) fragments.push(fragment);
      return fragment;
    },
    snapshot: () => ({
      schema: XSURFACE_SHARD_SNAPSHOT_SCHEMA,
      packageName: XSURFACE_SHARD_PACKAGE,
      status: disposed ? 'disposed' : currentPlan.status,
      ok: !disposed && currentPlan.ok,
      disposed,
      planId: currentPlan.planId,
      shardCount: currentPlan.shardCount,
      surfaceCount: currentPlan.surfaceCount,
      fragmentCount: fragments.length,
      lifecycle: Array.from(lifecycle.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([surfaceId, state]) => ({ surfaceId, state })),
      shards: cloneJson(currentPlan.shards, []),
      diagnostics: serverDiagnostics.concat(currentPlan.diagnostics)
    }),
    dispose: () => {
      disposed = true;
      return {
        schema: XSURFACE_SHARD_SNAPSHOT_SCHEMA,
        packageName: XSURFACE_SHARD_PACKAGE,
        status: 'disposed',
        ok: false,
        disposed: true,
        planId: currentPlan.planId,
        shardCount: currentPlan.shardCount,
        surfaceCount: currentPlan.surfaceCount,
        fragmentCount: fragments.length,
        lifecycle: Array.from(lifecycle.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([surfaceId, state]) => ({ surfaceId, state })),
        shards: cloneJson(currentPlan.shards, []),
        diagnostics: serverDiagnostics
      };
    }
  });
}

module.exports = {
  LIFECYCLE_ATTACH,
  LIFECYCLE_CANCEL,
  LIFECYCLE_DETACH,
  LIFECYCLE_FALLBACK,
  LIFECYCLE_INITIAL_STATE,
  XSURFACE_SHARD_DEGRADATION_BLOCKED_CODE,
  XSURFACE_SHARD_FALLBACK_MISSING_CODE,
  XSURFACE_SHARD_FRAGMENT_SCHEMA,
  XSURFACE_SHARD_HANDOFF_SCHEMA,
  XSURFACE_SHARD_LIFECYCLE_INVALID_TRANSITION_CODE,
  XSURFACE_SHARD_NON_SERIALIZABLE_PAYLOAD_CODE,
  XSURFACE_SHARD_PACKAGE,
  XSURFACE_SHARD_PLAN_SCHEMA,
  XSURFACE_SHARD_RECORD_SCHEMA,
  XSURFACE_SHARD_SECURITY_BLOCKED_CODE,
  XSURFACE_SHARD_SERVER_DISPOSED_CODE,
  XSURFACE_SHARD_SNAPSHOT_SCHEMA,
  XSURFACE_SHARD_SURFACE_NOT_FOUND_CODE,
  XSURFACE_SHARD_SURFACE_SCHEMA,
  createXSurfaceAtcHandoff,
  createXSurfaceShardPlan,
  createXSurfaceShardServer,
  createXSurfaceStreamFragment,
  partitionXSurfaceShardSurfaces,
  serializeXSurfaceShardPlan
};
