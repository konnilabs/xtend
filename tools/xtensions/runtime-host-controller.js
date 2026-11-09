// SPDX-License-Identifier: Apache-2.0
// Local extraction provenance and third-party notices: ./NOTICE
'use strict';

const { createLifecycleRecord, normalizeHostControllerResult } = require('./host-controller-contract');
const RUNTIME_HOST_CONTROLLER_SCHEMA = 'xtend.xtensions.runtime-host-controller.v2';
const KERNEL_RUNTIME_HOST_CONTROLLER_SCHEMA = 'xtend.xtensions.runtime-host-controller.v3';
const { createKernelWorkScope } = require('./kernel-work-scope');
const { createHostResourceCleanupRecord } = require('./host-resource-cleanup-record');
const { createSurfaceEvent } = require('./signal-bridge-contract');
const { createCooperativeResourceScope } = require('./cooperative-resource-scope');

const owners = new WeakMap();
const clone = (value) => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
const reserved = new Set(['__proto__', 'constructor', 'prototype', 'xtension', 'ref', 'key',
  'dangerouslySetInnerHTML', 'innerHTML', 'outerHTML', 'srcdoc']);
function inspectData(value, seen = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (!value || typeof value !== 'object' || seen.has(value)) throw new TypeError('Payload must be finite, acyclic JSON data.');
  const proto = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && proto !== Object.prototype && proto !== null) throw new TypeError('Payload must not contain DOM, runtime or class instances.');
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || reserved.has(key) || !descriptor.enumerable || !('value' in descriptor)) throw new TypeError('Payload contains a reserved key, symbol or accessor.');
    inspectData(descriptor.value, seen);
  }
  if (value.__v_isReactive === true || value.__v_isReadonly === true || value.__v_isRef === true) throw new TypeError('Vue proxies and refs cannot cross the payload boundary.');
  seen.delete(value);
}
function checkedData(value, inspectPayload) {
  inspectData(value);
  const boundary = inspectPayload(value);
  if (!boundary.ok) throw Object.assign(new Error('Framework payload boundary rejected the input.'), { diagnostics: boundary.diagnostics });
  return freeze(clone(value));
}

// Deliberately small, fail-closed peer range grammar; no package manager or
// framework implementation is imported into the browser lifecycle core.
function peerVersionMatches(version, range) {
  return String(range).split('||').some((part) => {
    const text = part.trim();
    if (text === '*') return true;
    if (/^\d+\.\d+\.\d+$/.test(text)) return version === text;
    const wildcard = text.match(/^(\d+)(?:\.(\d+))?\.x$/);
    if (wildcard) return version.startsWith(wildcard[1] + '.' + (wildcard[2] ? wildcard[2] + '.' : ''));
    const bounded = text.match(/^([~^])(\d+)\.(\d+)\.(\d+)$/);
    if (!bounded) return false;
    const current = version.split('.').map(Number), base = bounded.slice(2).map(Number);
    const greaterOrEqual = current[0] > base[0] || current[0] === base[0] &&
      (current[1] > base[1] || current[1] === base[1] && current[2] >= base[2]);
    if (!greaterOrEqual || current[0] !== base[0]) return false;
    return bounded[1] === '~' || base[0] === 0 ? current[1] === base[1] &&
      (base[0] !== 0 || base[1] !== 0 || current[2] === base[2]) : true;
  });
}

// Retained-instance/Fabric lifecycle extracted from xtend-tests src/controller.js.
// Loading is single-flight and disposal invalidates work both before and after await.
function createRuntimeHostController(options, driver) {
  const framework = driver.framework;
  const ids = Object.freeze({ hostId: options.hostId || `${framework}-host`,
    surfaceId: options.surfaceId || `surface.${framework}`, xtensionId: options.xtensionId || options.id || `xtension.${framework}` });
  const clockOptions = { ...ids, clock: options.clock, lane: driver.kernel === true ? options.kernelWork?.lifecycle?.lane || 'visible' : options.lane || 'visible' };
  const container = options.container;
  const component = options.component;
  const loadRuntime = options.loadRuntime;
  const expectedVersions = freeze(clone(options.expectedVersions || {}));
  const peers = options.peers;
  const boundaryPolicy = driver.normalizeBoundary(clone(options.runtimeBoundary || {}));
  const policy = options.policy || {};
  // Capture host authority at construction; never accept policy from lifecycle data.
  const allowedResources = [...(policy.allowedResources || [])];
  const events = freeze(clone(policy.events || {}));
  const authorize = policy.authorize;
  const validateProps = policy.validateProps;
  const onEvent = options.onEvent;
  const onDiagnostic = options.onDiagnostic;
  const boundaryFactory = options.fabric && typeof options.fabric.createBoundary === 'function' ? options.fabric.createBoundary.bind(options.fabric) : null;
  if (options.fabric && !boundaryFactory) throw new TypeError('Fabric must implement createBoundary.');
  const fabricScope = driver.kernel === true ? options.kernelWork?.scope : ids.surfaceId;
  const boundary = boundaryFactory?.(fabricScope, { source: 'xtension', lane: clockOptions.lane });
  if (driver.kernel === true && !options.fabric) throw new TypeError('Kernel adapters require an explicit Fabric boundary port.');
  if (options.fabric && (!boundary || typeof boundary.run !== 'function')) throw new TypeError('Fabric boundary must implement run.');
  const records = [], cleanupRecords = [], eventRecords = [], diagnostics = [];
  let phase = 'idle', disposed = false, suspended = false, instance = null, props = {};
  let pendingMount = null, disposal = null, queue = Promise.resolve(), sequence = 0, generation = 0;
  let runtimeVersions = null, tearingDown = false, teardownPromise = null, fatalError = null;
  const abort = new AbortController();
  const cancelled = new Promise((resolve) => abort.signal.addEventListener('abort', () => resolve({ cancelled: true }), { once: true }));
  function diagnostic(error, operation) {
    const entry = { code: 'xtensions.runtime.failure-contained', severity: 'error', message: String(error?.message || error),
      details: { ...ids, framework, operation } };
    diagnostics.push(entry);
    try { onDiagnostic?.(clone(entry)); options.fabric?.emitDiagnostic?.({ ...entry, source: 'xtension' }); } catch (_) { /* Diagnostics cannot interrupt teardown. */ }
    return entry;
  }
  function released(resource, error) {
    if (error) { diagnostic(error, `cleanup:${resource}`); return; }
    cleanupRecords.push(createHostResourceCleanupRecord({ ...clockOptions, resource, sequence: cleanupRecords.length + 1 }));
  }
  const resources = createCooperativeResourceScope({ allowedResources, onRelease: released });
  const kernelBoundaries = new Map([[clockOptions.lane, boundary]]);
  const runKernelBoundary = (operation, action, metadata) => {
    if (!kernelBoundaries.has(metadata.kernelLane)) {
      const next = boundaryFactory(fabricScope, { source: 'xtension', lane: metadata.kernelLane });
      if (!next || typeof next.run !== 'function') throw new TypeError('Fabric boundary must implement run.');
      kernelBoundaries.set(metadata.kernelLane, next);
    }
    return kernelBoundaries.get(metadata.kernelLane).run(operation, action, metadata);
  };
  const kernel = driver.kernel === true ? createKernelWorkScope(options.kernelWork, { ...ids, framework }, (error,name) => diagnostic(error,`work:${name}`), runKernelBoundary, name => permit(`work:${name}`,props), () => { if (!disposed) api.unmount('kernel-cancelled'); }) : null;
  function result(operation, status = 'ok', details = {}, errors = []) {
    const lifecycleRecord = createLifecycleRecord(operation, status === 'policy-blocked' ? 'surface:blocked' : status === 'failed' || status === 'degraded' ? 'surface:error' : null,
      { ...clockOptions, status, phase, sequence: ++sequence, payload: details, diagnostics: errors });
    records.push(lifecycleRecord);
    return normalizeHostControllerResult(operation, { status, lifecycleRecord, diagnostics: errors,
      cleanupRecords: operation === 'unmount' ? cleanupRecords : [], metadata: details }, clockOptions);
  }
  function run(operation, action) {
    const invoke = () => boundary ? boundary.run(operation, action) : action();
    const work = () => disposed && kernel ? result(operation, 'skipped', { reason: 'disposed-before-kernel-delivery' }) : kernel ? kernel.runLifecycle(operation, action) : invoke();
    const promise = queue.then(work).catch(async (error) => {
      if (kernel && disposed && error.code !== 'rmt.scheduler.panic_blocked') return result(operation, 'skipped', { reason: 'kernel-lifetime-ended' });
      const entry = diagnostic(error, operation);
      if (kernel && operation !== 'unmount') await api.unmount('kernel-delivery-failure');
      // Instrumentation failures must not prevent terminal cleanup.
      if (operation === 'unmount') await teardown();
      return result(operation, error.policyBlocked ? 'policy-blocked' : 'failed', {}, [entry]);
    });
    queue = promise.then(() => undefined);
    return promise;
  }
  function permit(operation, data) {
    if (authorize && authorize(Object.freeze({ ...ids, framework, operation, props: data })) !== true) throw Object.assign(new Error('Host policy denied the operation.'), { policyBlocked: true });
  }
  function dataProps(value) {
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new TypeError('Props must be a JSON object.');
    const data = checkedData(value, driver.inspectPayload);
    if (validateProps && validateProps(data) !== true) throw new Error('Host props validation rejected the input.');
    return data;
  }
  function startResources(token) {
    const before = resources.snapshot().failures.length;
    resources.start();
    // Resource factories and their cleanup can synchronously reenter the host.
    // Never commit readiness after they disposed or failed this generation.
    if (fatalError) throw fatalError;
    const failures = resources.snapshot().failures.slice(before);
    if (failures.length) throw new Error(`Resource activation cleanup failed: ${failures.map((entry) => entry.message).join('; ')}`);
    return !disposed && generation === token;
  }
  function teardown() {
    if (teardownPromise) return teardownPromise;
    // Defer framework destruction until its current render/commit stack unwinds.
    // This promise is independent of the lifecycle queue and is assigned before
    // any cleanup callback can reenter the controller.
    teardownPromise = Promise.resolve().then(async () => {
      const old = instance;
      instance = null;
      tearingDown = true;
      try {
        if (old) {
          const before = diagnostics.length;
          try {
            await old.destroy();
            if (diagnostics.length === before) released(`${framework}-root`, null);
          } catch (error) { released(`${framework}-root`, error || new Error(String(error))); }
        }
      } finally {
        resources.dispose();
        tearingDown = false;
        suspended = false;
        phase = 'destroyed';
        if (owners.get(container) === api && !diagnostics.some((entry) => entry.details.operation === `cleanup:${framework}-root`)) owners.delete(container);
      }
    });
    resources.beginShutdown();
    return teardownPromise;
  }
  const api = {
    schema: kernel ? KERNEL_RUNTIME_HOST_CONTROLLER_SCHEMA : RUNTIME_HOST_CONTROLLER_SCHEMA,
    apiVersion: kernel ? '3.0.0' : '2.0.0', adapterSchema: `xtend.xtensions.${framework}-runtime-adapter.v${kernel ? 3 : 2}`, framework,
    mount(target = container, initialProps = {}, mountOptions = {}) {
      if (disposed) return Promise.resolve(result('mount', 'failed', { reason: 'already-destroyed' }));
      if (target !== container) return Promise.resolve(result('mount', 'policy-blocked', { reason: 'host-container-mismatch' }));
      if (pendingMount) return pendingMount;
      if (instance) return Promise.resolve(result('mount', 'skipped', { reason: 'already-mounted' }));
      let nextProps;
      try {
        if (owners.has(container) && owners.get(container) !== api) throw new Error('Host container already has a runtime owner.');
        if (!container || container.nodeType !== 1 || container === container.ownerDocument?.body || container === container.ownerDocument?.documentElement || container.childNodes.length) throw new Error('An empty, host-owned DOM element is required; SSR adoption is outside this adapter.');
        if (Object.keys(mountOptions).some((key) => key !== 'lane')) throw new Error('Mount data cannot supply runtime, policy, or hydration authority.');
        if (!boundaryPolicy.ok) throw Object.assign(new Error('Runtime provider boundary rejected.'), { diagnostics: boundaryPolicy.diagnostics });
        nextProps = dataProps(initialProps);
        permit('mount', nextProps);
      } catch (error) { return Promise.resolve(result('mount', 'policy-blocked', {}, error.diagnostics || [diagnostic(error, 'mount')])); }
      owners.set(container, api);
      const token = ++generation;
      phase = 'mounting';
      pendingMount = run('mount', async () => {
        try {
          if (disposed) return result('mount', 'skipped', { reason: 'disposed-during-mount' });
          const loaded = await Promise.race([Promise.resolve().then(() => typeof loadRuntime === 'function' ? loadRuntime(Object.freeze({ signal: abort.signal })) : peers).then((value) => ({ value })), cancelled]);
          if (loaded.cancelled || disposed || generation !== token) return result('mount', 'skipped', { reason: 'disposed-during-mount' });
          // Recheck ownership after the asynchronous provider returns.
          if (container.childNodes.length) throw new Error('Host container changed while loading.');
          const runtime = driver.normalizePeers(loaded.value);
          for (const dependency of boundaryPolicy.dependencies) {
            const actual = runtime.versions[dependency.name];
            if (!actual || !peerVersionMatches(actual, dependency.versionRange)) throw new TypeError(`Runtime dependency range mismatch for ${dependency.name}.`);
          }
          for (const [name, version] of Object.entries(expectedVersions)) {
            if (runtime.versions[name] !== version) throw new TypeError(`Runtime version mismatch for ${name}.`);
          }
          runtimeVersions = runtime.versions;
          if (!component) throw new TypeError('Host component is required.');
          instance = driver.create(runtime, component, container, facade, (error) => tearingDown
            ? diagnostic(error, `cleanup:${framework}-root`) : api.reportError(error, { phase: 'render' }));
          const before = diagnostics.length;
          const rendered = await Promise.race([Promise.resolve(instance.render(nextProps)).then(() => ({ done: true })), cancelled]);
          if (fatalError) throw fatalError;
          if (rendered.cancelled || disposed || generation !== token) { await teardown(); return result('mount', 'skipped', { reason: 'disposed-during-mount' }); }
          if (diagnostics.length !== before) throw new Error('Framework render failed.');
          if (!startResources(token)) { await teardown(); return result('mount', 'skipped', { reason: 'disposed-during-mount' }); }
          props = nextProps;
          phase = 'ready';
          kernel?.activate();
          return result('mount');
        } catch (error) {
          const entry = diagnostic(error, 'mount');
          await api.unmount('mount-failure');
          return result('mount', 'failed', {}, [entry]);
        } finally { pendingMount = null; }
      });
      return pendingMount;
    },
    update(signal = {}) {
      let next;
      try {
        inspectData(signal);
        if (Object.keys(signal).some((key) => !['props', 'payload', 'updateAdapter', 'type'].includes(key))) throw new Error('Only explicit props updates are supported.');
        if (signal.type !== undefined && signal.type !== 'props.update' || signal.updateAdapter !== undefined && signal.updateAdapter !== 'applyPropsUpdate') throw new Error('Unsupported props update operation.');
        if (framework === 'vue' && signal.updateAdapter !== 'applyPropsUpdate' && signal.type !== 'props.update') throw new Error('Vue requires applyPropsUpdate or props.update.');
        next = dataProps(signal.props ?? signal.payload);
        permit('update', next);
      } catch (error) { return Promise.resolve(result('update', 'policy-blocked', {}, error.diagnostics || [diagnostic(error, 'update')])); }
      return run('update', async () => {
        if (disposed || !instance) return result('update', 'failed', { reason: 'not-mounted' });
        if (suspended) return result('update', 'skipped', { reason: 'suspended' });
        const before = diagnostics.length;
        try {
          const rendered = await Promise.race([Promise.resolve(instance.render(next)).then(() => ({ done: true })), cancelled]);
          if (fatalError) throw fatalError;
          if (rendered.cancelled || disposed) { await teardown(); return result('update', 'skipped', { reason: 'disposed-during-update' }); }
          if (diagnostics.length !== before) throw new Error('Framework render failed.');
          props = next; phase = 'active'; return result('update');
        } catch (error) {
          const entry = diagnostic(error, 'update');
          await api.unmount('update-failure');
          return result('update', 'failed', {}, [entry]);
        }
      });
    },
    suspend(reason = 'host-policy') {
      return run('suspend', () => {
        if (disposed || !instance) return result('suspend', 'failed', { reason: 'not-mounted' });
        if (suspended) return result('suspend', 'skipped');
        permit('suspend', props);
        const before = diagnostics.length;
        kernel?.suspend();
        resources.stop();
        if (disposed) return result('suspend', 'skipped', { reason: 'disposed-during-suspend' });
        suspended = true; phase = 'suspended';
        return result('suspend', before === diagnostics.length ? 'ok' : 'degraded', { reason: String(reason) }, diagnostics.slice(before));
      });
    },
    resume(reason = 'host-policy', options = {}) {
      let next;
      try {
        inspectData(options);
        if (Object.keys(options).some((key) => key !== 'props')) throw new TypeError('Resume accepts only replacement props.');
        if (Object.hasOwn(options, 'props')) next = dataProps(options.props);
      } catch (error) { return Promise.resolve(result('resume', 'policy-blocked', {}, error.diagnostics || [diagnostic(error, 'resume')])); }
      return run('resume', async () => {
        if (disposed || !instance) return result('resume', 'failed', { reason: 'not-mounted' });
        if (!suspended) return result('resume', 'skipped');
        if (next) permit('update', next);
        permit('resume', next || props);
        const token = generation;
        kernel?.beginResume();
        try {
          if (next) {
            const before = diagnostics.length;
            const rendered = await Promise.race([Promise.resolve(instance.render(next)).then(() => ({ done: true })), cancelled]);
            if (fatalError) throw fatalError;
            if (rendered.cancelled || disposed) { await teardown(); return result('resume', 'skipped', { reason: 'disposed-during-resume' }); }
            if (diagnostics.length !== before) throw new Error('Framework render failed.');
            props = next;
          }
          if (!startResources(token)) { await teardown(); return result('resume', 'skipped', { reason: 'disposed-during-resume' }); }
          suspended = false; phase = 'active';
          kernel?.activate();
          return result('resume', 'ok', { reason: String(reason) });
        } catch (error) {
          const entry = diagnostic(error, 'resume');
          await api.unmount('resume-failure');
          return result('resume', 'failed', {}, [entry]);
        }
      });
    },
    reportError(error, metadata = {}) {
      if (disposed) return result('reportError', 'skipped', { reason: 'already-destroyed' });
      fatalError = error instanceof Error ? error : new Error(String(error));
      phase = 'destroying';
      const failure = result('reportError', 'failed', { phase: String(metadata.phase || 'runtime') }, [diagnostic(fatalError, 'reportError')]);
      api.unmount('runtime-error');
      return failure;
    },
    unmount(reason = 'host-dispose') {
      if (disposal) return disposal;
      disposed = true; generation += 1; phase = 'destroying';
      kernel?.dispose();
      // Never queue terminal cleanup behind an unresolved render or loader.
      disposal = Promise.resolve().then(() => {
        const action = async () => {
          await teardown();
          const errors = diagnostics.filter((entry) => entry.details.operation.startsWith('cleanup:') || entry.details.operation === 'reportError');
          return result('unmount', errors.length ? 'degraded' : 'ok', { reason: String(reason) }, errors);
        };
        return boundary ? boundary.run('unmount', action) : action();
      }).catch(async (error) => {
        const entry = diagnostic(error, 'unmount');
        await teardown();
        return result('unmount', 'failed', {}, [entry]);
      });
      abort.abort();
      teardown();
      return disposal;
    },
    emit(event = {}) {
      try {
        inspectData(event);
        if (disposed || suspended || !instance || !['ready', 'active'].includes(phase)) throw new Error('Events require an active mounted instance.');
        if (Object.keys(event).some((key) => !['type', 'name', 'payload'].includes(key))) throw new Error('Event input cannot supply policy or source authority.');
        const name = event.type || event.name;
        if (!Object.hasOwn(events, name)) throw new Error('Event is not granted by the host.');
        const payload = checkedData(event.payload || {}, driver.inspectPayload);
        permit('emit', payload);
        const normalized = createSurfaceEvent({ event: name, source: { ...ids, framework }, owner: ids.xtensionId,
          lane: clockOptions.lane, payload, payloadSchema: events[name], trustBoundary: 'same-origin-adapter' }, clockOptions);
        if (!normalized.ok) return normalized;
        eventRecords.push(normalized);
        onEvent?.(clone(normalized));
        return clone(normalized);
      } catch (error) { return { ok: false, diagnostics: error.diagnostics || [diagnostic(error, 'emit')] }; }
    },
    snapshot() { return clone({ ...ids, framework, phase, mounted: !!instance, suspended, disposed, props,
      runtimeVersions, resources: resources.snapshot(), diagnostics, ...(kernel ? { capabilities: kernel.capabilities, kernelWork: kernel.snapshot() } : {}) }); },
    getLifecycleRecords: () => clone(records),
    getCleanupRecords: () => clone(cleanupRecords),
    getEventRecords: () => clone(eventRecords)
  };
  if (kernel) api.getCapabilities = () => kernel.capabilities;
  const facade = Object.freeze({ emit: api.emit, resources: Object.freeze({ register: resources.register }), ...(kernel ? { work: kernel.work } : {}) });
  return Object.freeze(api);
}
module.exports = { RUNTIME_HOST_CONTROLLER_SCHEMA, KERNEL_RUNTIME_HOST_CONTROLLER_SCHEMA, createRuntimeHostController };
