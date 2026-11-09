// SPDX-License-Identifier: Apache-2.0
'use strict';

const { XTENSION_STATE_BINDING_SCHEMA, validateStateBinding, addressKey, propsFrom, clone, freeze, data, record, typed } = require('./state-binding-contract');
const { XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, validateStateBindingArtifact, materializeStateBindingArtifact } = require('./state-binding-artifact');
const { RUNTIME_HOST_CONTROLLER_SCHEMA, KERNEL_RUNTIME_HOST_CONTROLLER_SCHEMA, GRAPH_RUNTIME_HOST_CONTROLLER_SCHEMA } = require('./runtime-host-controller');
const XTENSION_STATE_BINDING_API_VERSION = '2.2.0';

/** One registry per Model session. Factories and ports are trusted host capabilities. */
function createXTensionStateRegistry({ modelReader, modelCommandPort, commandDispatcher, onDiagnostic } = {}) {
  if (!modelReader || typeof modelReader.snapshot !== 'function' || typeof modelReader.subscribe !== 'function' ||
    (!modelCommandPort || typeof modelCommandPort.apply !== 'function') && (!commandDispatcher || typeof commandDispatcher.dispatch !== 'function')) throw new TypeError('State bindings require Model reader and command ports.');
  if (commandDispatcher && modelCommandPort) throw new TypeError('A binding registry requires one command authority.');
  const entries = new Map();
  let revision = 0, incarnation = 0, closed = false, closing;
  let current = modelReader.snapshot();
  const unsubscribe = modelReader.subscribe((change) => {
    if (closed || change.pending) return;
    // An earlier subscriber may commit again before this notification reaches us.
    // Read the authoritative committed snapshot rather than replay an older event.
    current = modelReader.snapshot(); revision++;
    for (const entry of [...entries.values()]) entry.commit(current, revision);
  });
  if (typeof unsubscribe !== 'function') throw new TypeError('The Model reader must return an unsubscribe function.');

  function bind(input, createHost) {
    if (closed) throw new Error('The state registry is disposed.');
    if (typeof createHost !== 'function') throw new TypeError('A trusted runtime host factory is required.');
    // A new conditional lifetime may be created between Model and public View notification.
    current = modelReader.snapshot();
    const definition = validateStateBinding(input), key = addressKey(definition.address);
    if (entries.has(key)) throw new Error('The XTension instance address is already bound.');
    const identity = freeze({ address: definition.address, key, incarnation: ++incarnation });
    const ids = freeze({ hostId: `state-binding:${key}`, surfaceId: definition.address.documentId, xtensionId: `${key}@${identity.incarnation}` });
    const events = freeze(Object.fromEntries(Object.entries(definition.intents).map(([event, spec]) => [event, spec.payloadSchema])));
    let desired = { props: propsFrom(current, definition), revision }, delivered = null;
    let phase = 'created', queue = Promise.resolve(), scheduled = false, delivering = false, host, disposal, failure = null;
    const diagnostics = [];
    const pendingCommands = new Set(), abort = new AbortController();
    const cancelled = new Promise((resolve) => abort.signal.addEventListener('abort', () => resolve({ status: 'superseded' }), { once: true }));
    const live = () => entries.get(key) === entry && phase !== 'disposed' && phase !== 'failed';
    const snapshot = () => freeze(clone({ identity, phase, desiredRevision: desired.revision, deliveredRevision: delivered?.revision ?? null,
      props: delivered?.props ?? null, diagnostics }));
    function report(error, operation) {
      const item = freeze({ operation, message: String(error?.message || error), identity });
      diagnostics.push(item);
      try { onDiagnostic?.(item); } catch { /* Observers cannot break cleanup or Model commits. */ }
    }
    function dispose(reason = 'host-dispose') {
      if (disposal) return disposal;
      phase = 'disposed'; if (entries.get(key) === entry) entries.delete(key);
      abort.abort();
      // Never wait for an unresolved loader/render in our serial queue.
      disposal = Promise.resolve().then(() => host?.unmount(reason));
      return disposal;
    }
    function fail(error, operation) {
      failure ||= error; report(error, operation);
      dispose('state-binding-failure').catch((cleanupError) => report(cleanupError, 'dispose'));
      phase = 'failed';
    }
    function enqueue(operation, action) {
      const work = queue.then(async () => {
        if (!live()) { if (failure) throw failure; return snapshot(); }
        try { await action(); return snapshot(); }
        catch (error) { if (live()) fail(error, operation); throw error; }
      });
      queue = work.catch(() => {});
      return work;
    }
    function accepted(result) {
      if (!result || result.status !== 'ok') throw new Error(`Runtime host rejected the binding delivery (${result?.status || 'missing result'}).`);
    }
    async function sync() {
      while (live() && phase === 'active' && desired !== delivered) {
        const next = desired;
        // Unrelated Model commits do not cause framework renders or echo events.
        if (!delivered || JSON.stringify(next.props) !== JSON.stringify(delivered.props)) {
          let result;
          delivering = true;
          try { result = await host.update({ type: 'props.update', props: next.props }); }
          finally { delivering = false; }
          if (!live()) return;
          accepted(result);
        }
        delivered = next;
      }
    }
    const entry = {
      dispose,
      async flush() {
        let pending;
        do { pending = queue; await pending; if (host?.schema === GRAPH_RUNTIME_HOST_CONTROLLER_SCHEMA) await host.whenIdle(); } while (queue !== pending);
        if (failure) throw failure;
      },
      commit(model, nextRevision) {
        if (!live()) return;
        try { desired = { props: propsFrom(model, definition), revision: nextRevision }; }
        catch (error) { fail(error, 'commit'); return; }
        if (phase === 'active' && !scheduled) {
          scheduled = true;
          enqueue('commit', async () => { scheduled = false; await sync(); }).catch(() => {});
        }
      }
    };
    entries.set(key, entry);
    function onEvent(event) {
      if (!live() || phase !== 'active' || delivering) return false;
      try {
        const spec = Object.hasOwn(definition.intents, event.event) && definition.intents[event.event];
        if (!spec || event.ok !== true || event.direction !== 'upstream' || event.payloadSchema !== spec.payloadSchema ||
          Object.entries(ids).some(([field, value]) => event.source?.[field] !== value)) throw new TypeError('Intent source or declaration does not match the binding.');
        data(event.payload); record(event.payload, 'Intent payload');
        const keys = Object.keys(spec.fields);
        if (Object.keys(event.payload).length !== keys.length || keys.some((field) => !Object.hasOwn(event.payload, field))) throw new TypeError('Intent payload fields must match the declaration exactly.');
        for (const field of keys) typed(event.payload[field], spec.fields[field], `Intent field ${field}`);
        const commandPayload = clone(event.payload);
        for (const [field, source] of Object.entries(spec.keyFields || {})) commandPayload[field] = definition.address.keys[source.index];
        const metadata = { source: 'xtension-state-binding', identity: clone(identity), event: event.event };
        if (commandDispatcher) {
          const result = commandDispatcher.dispatch(spec.command, commandPayload, metadata,
            Object.freeze({ signal: abort.signal, isCurrent: live }));
          let pending;
          pending = Promise.race([Promise.resolve(result), cancelled]).then((value) => {
            if (live() && value && ['error', 'failed', 'blocked'].includes(value.status)) report(new Error(`Action ${spec.command} returned ${value.status}.`), 'intent');
          }, (error) => { if (live()) report(error, 'intent'); }).finally(() => pendingCommands.delete(pending));
          pendingCommands.add(pending);
        } else modelCommandPort.apply({ operation: 'dispatch', command: spec.command, payload: commandPayload }, metadata);
        return true;
      } catch (error) { report(error, 'intent'); return false; }
    }
    try {
      host = createHost(freeze({ identity, ...ids, events, onEvent }));
      if (!host || ![RUNTIME_HOST_CONTROLLER_SCHEMA, KERNEL_RUNTIME_HOST_CONTROLLER_SCHEMA, GRAPH_RUNTIME_HOST_CONTROLLER_SCHEMA].includes(host.schema) || !(host.schema === RUNTIME_HOST_CONTROLLER_SCHEMA ? /^2\./ : host.schema === KERNEL_RUNTIME_HOST_CONTROLLER_SCHEMA ? /^3\./ : /^4\./).test(host.apiVersion || '') ||
        ['mount', 'update', 'suspend', 'resume', 'unmount'].some((method) => typeof host[method] !== 'function') ||
        host.schema === GRAPH_RUNTIME_HOST_CONTROLLER_SCHEMA && typeof host.whenIdle !== 'function') throw new TypeError('The factory must return a version-matched v2, v3 or v4 runtime host controller.');
    } catch (error) { fail(error, 'createHost'); throw error; }
    return Object.freeze({
      identity,
      snapshot,
      mount(target) {
        return enqueue('mount', async () => {
          if (phase !== 'created') throw new Error('A binding can only be mounted once.');
          phase = 'mounting'; const initial = desired;
          const result = await host.mount(target, initial.props);
          if (!live()) return;
          accepted(result); delivered = initial; phase = 'active'; await sync();
        });
      },
      suspend(reason) {
        return enqueue('suspend', async () => {
          if (phase === 'suspended') return;
          if (phase !== 'active') throw new Error('Suspending requires a mounted binding.');
          phase = 'suspending'; accepted(await host.suspend(reason));
          if (live()) phase = 'suspended';
        });
      },
      resume(reason) {
        return enqueue('resume', async () => {
          if (phase !== 'suspended') throw new Error('Resuming requires a suspended binding.');
          phase = 'resuming'; const next = desired;
          const result = await host.resume(reason, { props: next.props });
          if (!live()) return;
          accepted(result); delivered = next; phase = 'active'; await sync();
        });
      },
      async whenIdle() {
        let pending;
        do { await Promise.all([...pendingCommands]); pending = queue; await pending; if (host?.schema === GRAPH_RUNTIME_HOST_CONTROLLER_SCHEMA) await host.whenIdle(); } while (queue !== pending || pendingCommands.size);
        if (failure) throw failure;
        return snapshot();
      },
      dispose
    });
  }
  return Object.freeze({ apiVersion: XTENSION_STATE_BINDING_API_VERSION, bind, async flush() { await Promise.all([...entries.values()].map((entry) => entry.flush())); }, dispose() {
    if (closing) return closing;
    closed = true; unsubscribe();
    closing = Promise.all([...entries.values()].map((entry) => entry.dispose())).then(() => undefined);
    return closing;
  } });
}

module.exports = { XTENSION_STATE_BINDING_API_VERSION, XTENSION_STATE_BINDING_SCHEMA, XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, validateStateBinding, validateStateBindingArtifact, materializeStateBindingArtifact, createXTensionStateRegistry };
