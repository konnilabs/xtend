// SPDX-License-Identifier: Apache-2.0
import lifecycle from '@ccslabs/xtend-compiler/xtensions/native-lifecycle';
import { createMaracaPlanRuntime } from './plan-runtime.mjs';

export const NATIVE_LIFECYCLE_RUNTIME_API_VERSION = '1.0.0';

/** Private integration; Controller records remain the only Surface authority. */
function createNativeLifecycleIntegration(program, hooks) {
  const plan = lifecycle.validateNativeLifecyclePlan(program);
  const parents = lifecycle.nativeLifecycleParents(program);
  const guarded = new Set(plan.operations.map(operation => operation.ownerSurface));
  const definitions = new Map(program.surfaces.map(surface => [surface.id, surface]));
  const known = new Map();
  let admitted = null;
  const rows = () => hooks.readAuthority()?.surfaces || [];
  const controlled = id => guarded.has(id) || !!parents[id] && controlled(parents[id]);
  const contentRoot = id => guarded.has(id) ? id : parents[id] ? contentRoot(parents[id]) : null;
  const visible = record => record?.status === 'open' && !record.minimized && !record.collapsed;
  function admission(snapshot) {
    const records = new Map(rows().map(record => [String(record.id), record]));
    const restriction = {};
    for (const [id, definition] of definitions) {
      const record = records.get(id);
      if (record && ['destroyed', 'destroying'].includes(record.status) || !record && known.has(id)) { restriction[id] = false; continue; }
      if (controlled(id) && (admitted?.[id] !== true || !hooks.contentExists(contentRoot(id)))) {
        // Re-admitting content cannot implicitly resume a closed owner or parent.
        let current = id;
        while (current) {
          const authority = records.get(current);
          if (authority ? !visible(authority) : definitions.get(current)?.initialState === 'closed') { restriction[id] = false; break; }
          current = parents[current];
        }
      }
    }
    return lifecycle.nativeLifecycleAdmission(program, snapshot, restriction);
  }
  function synchronize(snapshot) {
    const authority = { shellEpoch: hooks.shellEpoch(), version: hooks.readAuthority()?.version };
    const next = admission(snapshot);
    const previous = admitted;
    admitted = next;
    for (const record of rows()) known.set(String(record.id), record.generation);
    for (const [id, allowed] of Object.entries(next)) {
      if (!allowed) hooks.boundary(id).setActive(false, 'lifecycle-content-left');
      else if (previous?.[id] === false) {
        const record = rows().find(record => String(record.id) === id);
        if (visible(record)) hooks.boundary(id).setActive(true, 'lifecycle-content-admitted');
      }
    }
    return authorityCurrent(authority);
  }
  function capture() {
    const scopes = [];
    for (const record of rows()) {
      const boundary = hooks.boundary(String(record.id));
      if (!boundary.disposed) scopes.push({ id: String(record.id), generation: record.generation, boundary, token: boundary.capture() });
    }
    return { shellEpoch: hooks.shellEpoch(), version: hooks.readAuthority()?.version, scopes };
  }
  function authorityCurrent(lease) {
    return !!lease && lease.shellEpoch === hooks.shellEpoch() && lease.version === hooks.readAuthority()?.version;
  }
  function current(lease) {
    if (!authorityCurrent(lease)) return false;
    const records = new Map(rows().map(record => [String(record.id), record]));
    return lease.scopes.every(scope => records.get(scope.id)?.generation === scope.generation
      && hooks.boundary(scope.id) === scope.boundary && !scope.boundary.disposed
      && scope.boundary.capture().epoch === scope.token.epoch);
  }
  function wrapEvents(factory, options) {
    let runtime = null, signature = null, closed = false;
    const refresh = () => {
      if (closed) return runtime;
      const mask = admission(options.modelReader.snapshot());
      const events = options.events.filter(event => event.surface == null || mask[event.surface] !== false);
      const next = JSON.stringify(events.map(event => event.id));
      if (signature !== next) { runtime?.dispose(); runtime = factory({ ...options, events }); signature = next; }
      return runtime;
    };
    refresh();
    return new Proxy({}, { get(_target, key) {
      if (key === 'dispose') return () => { closed = true; return runtime?.dispose(); };
      const value = refresh()[key];
      return typeof value === 'function' ? (...args) => { const current = refresh(); return current[key](...args); } : value;
    } });
  }
  return Object.freeze({ admission, synchronize, capture, current, authorityCurrent,
    wrapEvents,
    allows(id, snapshot) { return id == null || admission(snapshot)[String(id)] !== false; } });
}

const nativeLifecycleRuntimePort = Object.freeze({ NATIVE_LIFECYCLE_RUNTIME_API_VERSION, createNativeLifecycleIntegration });
/** Source6 is explicitly opted in; the old factory never infers this port. */
export function createMaracaNativeLifecycleRuntime(options = {}) {
  const schema = options.plan && Object.getOwnPropertyDescriptor(options.plan, 'schema');
  if (!schema || !Object.hasOwn(schema, 'value') || schema.value !== 'xtend.maraca.build-plan.v10')
    throw new TypeError('The Native lifecycle entry requires an own data Plan10 schema.');
  return createMaracaPlanRuntime({ ...options, nativeLifecycleRuntimePort });
}
export default Object.freeze({ NATIVE_LIFECYCLE_RUNTIME_API_VERSION, createMaracaNativeLifecycleRuntime });
