// SPDX-License-Identifier: Apache-2.0
// Local extraction provenance and third-party notices: ./NOTICE
'use strict';

// Extracted from xtend-tests src/resources.js: reverse cleanup, abort and generation
// guards. Host-selected synchronous factories replace the demo's fixed workloads.
function createCooperativeResourceScope(options = {}) {
  const entries = new Set();
  const activations = new Set();
  const failures = [];
  let running = false;
  let disposed = false;
  let closing = false;
  let generation = 0;
  const allowed = new Set(options.allowedResources || []);
  const asError = (value) => value instanceof Error ? value : new Error(String(value?.message || value));
  const record = (resource, error) => {
    if (error) failures.push({ resource, message: String(error.message || error) });
    try { options.onRelease?.(resource, error); }
    catch (failure) { failures.push({ resource, message: asError(failure).message }); }
  };
  function releaseActivation(activation) {
    activation.live = false;
    activation.abort.abort();
    // A synchronous factory may unregister itself before returning its cleanup.
    // Keep that activation pending; only the caller can finish its release.
    if (activation.starting || activation.released) return;
    activation.released = true;
    let failure = null;
    try {
      const result = activation.cleanup?.();
      if (result && typeof result.then === 'function') {
        result.catch(() => {});
        throw new TypeError('Resource cleanup must be synchronous.');
      }
    } catch (error) { failure = asError(error); }
    activations.delete(activation);
    record(activation.name, failure);
  }
  function release(entry) {
    const activation = entry.activation;
    if (!activation) return;
    entry.activation = null;
    releaseActivation(activation);
  }
  function activate(entry) {
    if (entry.activation || !entries.has(entry) || !running || closing || disposed) return;
    const activation = { name: entry.name, abort: new AbortController(), live: true, cleanup: null, starting: true, released: false };
    const token = generation;
    entry.activation = activation;
    activations.add(activation);
    const isCurrent = () => activation.live && entry.activation === activation && running && !closing && !disposed && generation === token;
    const context = Object.freeze({
      signal: activation.abort.signal,
      isCurrent,
      guard: (callback) => (...args) => isCurrent() ? callback(...args) : undefined
    });
    try {
      const cleanup = entry.start(context);
      if (typeof cleanup !== 'function') {
        // Observe unsupported async factories, including a late cleanup, without
        // allowing their work to reactivate a stopped generation.
        if (cleanup && typeof cleanup.then === 'function') {
          cleanup.then((late) => { if (typeof late === 'function') late(); }).catch(() => {});
        }
        throw new TypeError('Resource factory must synchronously return a cleanup function.');
      }
      activation.cleanup = cleanup;
      activation.starting = false;
      if (!isCurrent()) {
        if (entry.activation === activation) entry.activation = null;
        releaseActivation(activation);
      }
    } catch (error) {
      activation.live = false;
      activation.abort.abort();
      activation.starting = false;
      activation.released = true;
      activations.delete(activation);
      if (entry.activation === activation) entry.activation = null;
      record(entry.name, asError(error));
      throw error;
    }
  }
  function stop() {
    running = false;
    generation += 1;
    for (const entry of [...entries].reverse()) release(entry);
  }
  function register(name, start) {
    if (disposed) throw new Error('Resource scope is disposed.');
    if (!allowed.has(name)) throw new Error(`Resource "${name}" is not granted by the host.`);
    if (typeof start !== 'function') throw new TypeError('Resource factory must be a function.');
    const entry = { name, start, activation: null };
    entries.add(entry);
    try { if (running) activate(entry); } catch (error) { entries.delete(entry); throw error; }
    return () => { entries.delete(entry); release(entry); };
  }
  return Object.freeze({
    register,
    start() {
      if (closing || disposed || failures.length) throw new Error('Resource scope is closing, disposed or has failed cleanup.');
      if (running) return;
      running = true;
      generation += 1;
      try { for (const entry of entries) activate(entry); }
      catch (error) { stop(); throw error; }
    },
    stop,
    // Passive framework effects may still register while unmount flushes them.
    // Such registrations stay inert and are discarded by final disposal.
    beginShutdown() { if (closing) return; closing = true; stop(); },
    dispose() { if (disposed) return; closing = true; disposed = true; stop(); entries.clear(); },
    snapshot() {
      return { running, closing, disposed, generation, registered: entries.size,
        active: activations.size,
        failures: failures.map((entry) => ({ ...entry })) };
    }
  });
}
module.exports = { createCooperativeResourceScope };
