// SPDX-License-Identifier: Apache-2.0
'use strict';
// Structural consumer only. The application owns the real kernel and Surface ports.
const { fields, name, freeze } = require('./state-binding-contract');

function createResourceGraphBinding(input, work, container, identity, callbacks) {
  fields(input, ['kernel', 'surfaceGraph', 'surfaceController', 'surfaceId'], 'XTension resource graph binding');
  const { kernel, surfaceGraph, surfaceController, surfaceId } = input;
  name(surfaceId);
  for (const method of ['hasRoot', 'getRootElement', 'getScheduler', 'listResources', 'attachResource']) {
    if (typeof kernel?.[method] !== 'function') throw new TypeError('Resource binding requires the RMT kernel resource port.');
  }
  if (surfaceGraph?.schema !== 'xtend.epic18.rmt-surface-resource-graph-runtime.v2' || typeof surfaceGraph.getSurface !== 'function' || typeof surfaceGraph.getSnapshot !== 'function' ||
      surfaceController?.schema !== 'xtend.surface.controller.v2' || typeof surfaceController.readSnapshot !== 'function' || typeof surfaceController.subscribe !== 'function') {
    throw new TypeError('Resource binding requires the Surface Graph v2 and its authoritative Surface Controller v2.');
  }
  const { rootId, scope, scheduler } = work;
  const resourceId = `xtension:${scope}`, value = Object.freeze({ ...identity });
  let state = 'detached', handle = null, detach = null, surfaceGeneration = null, rootElement = null;
  function readSurface(snapshot = surfaceController.readSnapshot({ includeDestroyed: true })) {
    const record = snapshot?.surfaces?.find(item => item.id === surfaceId);
    if (!record || !Number.isSafeInteger(record.generation) || record.generation < 1) throw new TypeError('The concrete owning Surface must exist with a generation.');
    return record;
  }
  function verifyRoot() {
    const element = kernel.getRootElement(rootId);
    if (kernel.getScheduler() !== scheduler || !kernel.hasRoot(rootId) || !element ||
        rootElement && rootElement !== element || element !== container && !element.contains?.(container)) {
      throw new TypeError('XTension root, container and scheduler must belong to the same live kernel root.');
    }
    return element;
  }
  function terminate(reason) {
    if (state === 'disposed') return;
    try { dispose(reason); } finally { callbacks.destroy(reason); }
  }
  function observe() {
    if (state === 'disposed') return;
    try {
      // A preceding subscriber may synchronously commit a newer lifecycle.
      // Re-read authority instead of applying the older notification snapshot.
      const record = readSurface();
      if (record.generation !== surfaceGeneration || ['destroying', 'destroyed'].includes(record.status)) return terminate('surface-lifetime-ended');
      const next = record.status === 'open' && !record.minimized && !record.collapsed ? 'active' : 'suspended';
      if (next === state) return;
      state = next;
      if (next === 'suspended') callbacks.pause('surface-inactive');
      else callbacks.resume('surface-active');
    } catch (error) { terminate('surface-owner-unavailable'); }
  }
  function attach() {
    if (state !== 'detached') throw new TypeError('Resource bindings are single-lifetime leases.');
    rootElement = verifyRoot();
    const record = readSurface(), projected = surfaceGraph.getSurface(surfaceId);
    if (surfaceGraph.getSnapshot().disposed || !projected || projected.id !== surfaceId || ['destroying', 'destroyed'].includes(record.status)) throw new TypeError('The owning Surface must be materialized in the injected graph.');
    if (kernel.listResources(rootId).some(item => item.id === resourceId)) throw new TypeError('The kernel resource scope already has an owner.');
    surfaceGeneration = record.generation;
    try {
      const acquired = kernel.attachResource(rootId, resourceId, value, { type: 'xtension-host',
        meta: { ...identity, scope, surfaceId, surfaceGeneration }, destroy: () => terminate('kernel-resource-released') });
      if (!acquired || acquired.getValue?.() !== value || acquired.getRootId?.() !== rootId || acquired.getId?.() !== resourceId || typeof acquired.dispose !== 'function') {
        throw new TypeError('Kernel resource lease does not belong to this XTension.');
      }
      handle = acquired;
      const stop = surfaceController.subscribe(observe);
      if (typeof stop !== 'function') throw new TypeError('Surface subscription must return a disposer.');
      if (state === 'disposed') { stop(); throw new TypeError('Surface owner ended during subscription.'); }
      detach = stop;
      observe(surfaceController.readSnapshot({ includeDestroyed: true }));
      if (state === 'disposed') throw new TypeError('Resource owner ended during attachment.');
    } catch (error) { dispose('attachment-failed'); throw error; }
  }
  function dispose(reason = 'host-dispose') {
    if (state === 'disposed') return;
    state = 'disposed';
    const stop = detach, lease = handle; detach = null; handle = null;
    try { stop?.(); } finally { lease?.dispose(reason); }
  }
  return Object.freeze({ attach, dispose,
    assertCurrent() {
      if (!handle || state === 'disposed') throw new TypeError('XTension resource lease is no longer current.');
      verifyRoot();
      if (surfaceGraph.getSnapshot().disposed) throw new TypeError('Surface graph has been disposed.');
      const record = readSurface();
      if (record.generation !== surfaceGeneration || ['destroying', 'destroyed'].includes(record.status)) throw new TypeError('Surface lifetime has ended.');
    },
    snapshot() { return freeze({ schema: 'xtend.xtensions.resource-graph-binding.v1', rootId, scope, resourceId, surfaceId,
      surfaceGeneration, state, attached: !!handle }); }
  });
}
module.exports = { createResourceGraphBinding };
