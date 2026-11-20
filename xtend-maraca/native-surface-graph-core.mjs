// SPDX-License-Identifier: Apache-2.0
const clone = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };


export function createNativeSurfaceGraphProfile(options, scopePort, schema) {
  const { program, createSurfaceGraph, surfaceController, ...graphOptions } = options;
  const contract = scopePort.validateNativeSurfaceScopes(program);
  if (typeof createSurfaceGraph !== 'function' || typeof surfaceController?.apply !== 'function' || typeof surfaceController?.readSnapshot !== 'function')
    throw new TypeError('Native Surface graph3 requires the actual Surface graph and Controller ports.');
  const original = new Map((graphOptions.surfaces || program.surfaces).map(value => [value.id, value]));
  const definitions = new Map(contract.declarations.map(value => [value.surface, value]));
  const managedPanels = new Set(schema === 'xtend.maraca.native-surface-graph.v4'
    ? (program.render.nativeView.bindings || []).filter(binding => binding.tag === 'x-side-panel' && ['side-panel','panel'].includes(original.get(binding.surface)?.kind)).map(binding => binding.surface) : []);
  function nativeRegistration(operation) {
    if (!managedPanels.size || !['registerSurface','register'].includes(operation.operation || operation.type)) return operation;
    const record = operation.args?.[0] || operation.record;
    if (!record || !managedPanels.has(record.metadata?.surfaceId)) return operation;
    // Classic XSidePanel declares these three standard presentation controls in
    // describeSurfaceRecord(). Graph4 grants that same policy only to a captured
    // panel component on its own panel Surface, never to user-provided lists.
    const updated = { ...record, capabilities:[...new Set([...(record.capabilities || []),'pin','unpin','expand'])] };
    return operation.args ? { ...operation,args:[updated,...operation.args.slice(1)] } : { ...operation,record:updated };
  }
  const recordsKey = id => '@rmtx-native:' + id;
  let transaction = null, disposed = false, ownApplyDepth = 0;
  const active = new Map(), retired = new Map(), seenDiagnostics = new WeakSet();
  const read = () => surfaceController.readSnapshot({ includeDestroyed: true });
  const controllerRecord = id => read().surfaces.find(record => record.id === id);
  function observe(snapshot, own = new Set()) {
    for (const diagnostic of snapshot?.diagnostics || []) {
      if (!diagnostic || typeof diagnostic !== 'object' || seenDiagnostics.has(diagnostic)) continue;
      seenDiagnostics.add(diagnostic);
      if (!own.has(diagnostic) && diagnostic.operation === 'destroySurface') retired.delete(diagnostic.surfaceId);
    }
  }
  observe(read());
  const stopObserving = typeof surfaceController.subscribe === 'function' ? surfaceController.subscribe(snapshot => { if (!ownApplyDepth) observe(snapshot); }) : null;
  function current() {
    if (!transaction) return true;
    if (read().version !== transaction.cursor) transaction.superseded = true;
    return !transaction.superseded;
  }
  const controllerPort = new Proxy(Object.create(null), { get(_target, key) {
    const target = surfaceController;
    if (key === 'apply') return (operations, metadata) => {
      if (transaction && !current()) return { ok: false, code: 'rmt.native-surface.superseded', results: [] };
      const before = read().version;
      let result; ownApplyDepth++;
      try { result = target.apply(operations.map(nativeRegistration), metadata); }
      finally { ownApplyDepth--; }
      observe(read(), new Set(result?.diagnostics || []));
      if (transaction && result?.ok !== false) {
        const expected = before + (operations.length ? 1 : 0);
        transaction.cursor = expected; transaction.ownWrites += operations.length ? 1 : 0;
        if (read().version !== expected) transaction.superseded = true;
        if (transaction.superseded) return { ...result, ok: false, code: 'rmt.native-surface.superseded' };
      }
      return result;
    };
    const value = Reflect.get(target, key, target);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
  const transformed = [...original.values()].map(definition => ({ ...definition,
    source: recordsKey(definition.id), repeat: !!definitions.get(definition.id)?.repeat?.length,
    key: '$record.scopeKey', owner: '$record.parentId' }));
  let graph;
  try { graph = createSurfaceGraph({ ...graphOptions, surfaces: transformed, surfaceController: controllerPort }); }
  catch (error) { stopObserving?.(); throw error; }
  if (graph?.schema !== 'xtend.epic18.rmt-surface-resource-graph-runtime.v2') { stopObserving?.(); throw new TypeError('Native Surface graph3 delegates the actual Graph2 instance store.'); }
  function report(status, result, rows, before) {
    return freeze({ schema: 'xtend.rmt.native-surface-graph-materialize.v1', ok: status === 'materialized', status,
      created: result?.created || [], reused: result?.reused || [], retired: transaction?.retired || [], instances: clone(rows),
      authority: { before, after: read().version, ownWrites: transaction?.ownWrites || 0 } });
  }
  function validate(input) { return scopePort.validateNativeSurfaceMaterialization(program, input).instances; }
  function materializeInstances(input, metadata = {}) {
    if (disposed) throw new Error('Native Surface graph is disposed.');
    if (transaction) throw new Error('Native Surface materialization cannot be nested.');
    const requested = validate(input), before = read().version;
    transaction = { cursor: before, ownWrites: 0, superseded: false, retired: [] };
    try {
      const requestedById = new Map(requested.map(row => [row.id, row])), blocked = new Map(), checked = new Set();
      function mayReturn(id) {
        const previous = retired.get(id), authority = controllerRecord(id);
        if (!previous) return false;
        if (authority && (authority.status !== 'destroyed' || authority.generation !== previous.generation
          || authority.destroyReason && authority.destroyReason !== previous.reason)) { retired.delete(id); return false; }
        if (previous.ancestor) {
          const parent = controllerRecord(previous.ancestor.id);
          if (!parent || parent.status === 'destroyed' || parent.generation <= previous.ancestor.generation) return false;
        }
        return true;
      }
      function ancestorFence(row) {
        if (checked.has(row.id)) return blocked.get(row.id);
        checked.add(row.id);
        if (!row.parentId) return null;
        const parent = requestedById.get(row.parentId), inherited = parent && ancestorFence(parent);
        if (inherited) { blocked.set(row.id, inherited); return inherited; }
        const authority = controllerRecord(row.parentId), instance = graph.getSurface(row.parentId);
        if ((authority?.status === 'destroyed' || !authority && instance?.state === 'destroyed') && !mayReturn(row.parentId)) {
          const fence = { id: row.parentId, generation: authority?.generation || instance?.metadata?.generation || 1 };
          blocked.set(row.id, fence); return fence;
        }
        return null;
      }
      const rows = requested.filter(row => !ancestorFence(row)), next = new Map(rows.map(row => [row.id, row]));
      // Foreign provider owners must already have been retired by Maraca before
      // this call. Graph2 owns destruction/resource/event cleanup afterwards.
      for (const [id, old] of [...active].reverse()) {
        if (next.has(id)) continue;
        const authority = controllerRecord(id), instance = graph.getSurface(id);
        if (authority?.status !== 'destroyed' && instance && instance.state !== 'destroyed') {
          const ancestor = blocked.get(id), reason = ancestor ? 'native-ancestor-destroyed' : 'native-surface-left';
          graph.destroySurface(id, { reason });
          if (!current()) return report('superseded', null, rows, before);
          retired.set(id, { generation: authority?.generation || instance.metadata?.generation || 1,
            definition: old.surfaceId, reason, ...(ancestor ? { ancestor } : {}), record: clone(controllerRecord(id) || authority || {}) });
          transaction.retired.push(id);
        }
      }
      const recreate = [];
      for (const row of rows) {
        const previous = retired.get(row.id);
        if (!previous || !mayReturn(row.id)) continue;
        const authority = controllerRecord(row.id);
        // Only a retirement performed by this exact membership projection may
        // authorize a returning key. External Destroy remains terminal.
        const definition = original.get(row.surfaceId), state = definition.initialState || definition.state || 'closed';
        recreate.push({ operation: 'registerSurface', record: { ...previous.record, ...(authority || {}), id: row.id, kind: definition.kind,
          manager: surfaceController.managerId || graphOptions.managerId || 'xtend.surface.manager',
          generation: previous.generation + 1, status: state, open: state === 'open', defaultOpen: state === 'open',
          destroyedAt: null, destroyReason: null, tombstone: null, releasedResources: [], active: false, minimized: false, collapsed: false,
          metadata: { ...(authority?.metadata || {}), surfaceId: row.surfaceId, owner: row.parentId || row.id } } });
      }
      if (recreate.length) {
        const result = controllerPort.apply(recreate, { operation: 'native-surface-repeat-return' });
        if (result?.ok === false || !current()) return report('superseded', null, rows, before);
      }
      const records = { ...(metadata.recordsBySource || {}) };
      for (const id of original.keys()) records[recordsKey(id)] = rows.filter(row => row.surfaceId === id).map(row => ({
        scopeKey: scopePort.nativeSurfaceScopeKey(contract.documentId, row.surfaceId, row.keys),
        parentId: row.parentId || row.id, record: row.record, keys: row.keys
      }));
      const result = graph.materialize(records, { ...metadata, preserveDestroyed: true });
      if (!current()) return report('superseded', result, rows, before);
      active.clear(); rows.forEach(row => active.set(row.id, row));
      recreate.forEach(operation => retired.delete(operation.record.id));
      return report('materialized', result, rows, before);
    } catch (error) {
      if (!current()) return report('superseded', null, requested, before);
      throw error;
    } finally { transaction = null; }
  }
  function project(instance) {
    if (!instance) return instance;
    const source = original.get(instance.surfaceId);
    const row = active.get(instance.id);
    return { ...instance, source: source?.source || '', record: row?.record ?? null,
      ...(row ? { keys: row.keys.slice(), parentId: row.parentId || null } : {}) };
  }
  // Downstream resource leases consume the actual Graph2 and the same
  // authoritative Controller port used by that graph, never a schema cast.
  const resourceGraph = Object.freeze({ surfaceGraph: graph, surfaceController: controllerPort });
  return Object.freeze({ ...graph, schema, resourceGraph,
    materialize() { throw new TypeError('Native graph3 requires materializeInstances with canonical typed rows.'); },
    materializeInstances,
    getSurface(id) { return project(graph.getSurface(id)); },
    listInstances(options) { return graph.listInstances(options).map(project); },
    listSurfaces() { return clone([...original.values()]); },
    dispose() { if (!disposed) { disposed = true; active.clear(); retired.clear(); stopObserving?.(); } return graph.dispose(); } });
}
