// SPDX-License-Identifier: Apache-2.0
'use strict';
const { data, fields, clone, freeze } = require('./state-binding-contract');
const levels = ['idle', 'normal', 'elevated', 'constrained', 'critical'];
const terminal = new Set(['completed', 'failed', 'cancelled', 'aborted', 'panic_blocked']);

// Application-owned policy. This is admission and cooperative chunking, never
// another execution queue or an authority to change the shared kernel's pressure.
function createWorkBudgetPolicy(input, scheduler, grants) {
  data(input); fields(input, ['schema', 'maxPending', 'work'], 'Work budget');
  if (input.schema !== 'xtend.xtensions.work-budget-policy.v1' || !Number.isSafeInteger(input.maxPending) || input.maxPending < 1 || input.maxPending > 128) throw new TypeError('Work budget requires v1 and a pending limit from 1 to 128.');
  fields(input.work, [...grants.keys()], 'Work budget grants');
  if (Object.keys(input.work).length !== grants.size) throw new TypeError('Every named grant requires its own work budget.');
  const policies = new Map();
  for (const [name, value] of Object.entries(input.work)) {
    fields(value, ['maxPending', 'overflow', 'pressure'], 'Named work budget');
    if (!Number.isSafeInteger(value.maxPending) || value.maxPending < 1 || value.maxPending > input.maxPending || value.overflow !== undefined && !['reject-new', 'replace-oldest'].includes(value.overflow)) throw new TypeError('Invalid named-work pending limit or overflow policy.');
    const pressure = value.pressure === undefined ? {} : value.pressure;
    fields(pressure, levels, 'Work pressure levels');
    for (const limit of Object.values(pressure)) {
      fields(limit, ['admission', 'maxChunkMs'], 'Pressure budget');
      if (limit.admission !== undefined && !['allow', 'reject'].includes(limit.admission) || limit.maxChunkMs !== undefined && (!Number.isFinite(limit.maxChunkMs) || limit.maxChunkMs <= 0 || limit.maxChunkMs > grants.get(name).maxChunkMs)) throw new TypeError('Pressure may only reduce the granted cooperative chunk.');
    }
    policies.set(name, freeze({ overflow: 'reject-new', ...clone(value), pressure: clone(pressure) }));
  }
  if (typeof scheduler.snapshot !== 'function') throw new TypeError('Work budgets require the real kernel pressure snapshot port.');
  const read = scheduler.snapshot.bind(scheduler), maxPending = input.maxPending;
  const reservations = new Set();
  let rejected = 0, replaced = 0, lastDecision = null;
  function pressure() {
    const snapshot = read();
    if (snapshot?.schema !== 'xtend.rmt.kernel-scheduler.v1' || !levels.includes(snapshot.pressureLevel)) throw new TypeError('Invalid kernel pressure snapshot.');
    return snapshot.pressureLevel;
  }
  pressure(); // Reject a missing or incompatible pressure source before mounting.
  function limits(name) {
    const level = pressure(), policy = policies.get(name), limit = policy.pressure[level] || {};
    return { level, admission: limit.admission || 'allow', maxChunkMs: limit.maxChunkMs ?? grants.get(name).maxChunkMs };
  }
  function reject(name, reason, level) {
    rejected++; lastDecision = { name, reason, pressureLevel: level };
    return Object.assign(new Error(`XTension work admission rejected: ${reason}.`), { name: 'WorkAdmissionError', code: 'xtensions.work.admission-rejected', reason });
  }
  function pending(entries) { return [...entries].filter(entry => entry.kind === 'work' && !entry.abort.signal.aborted && (!entry.handle || !terminal.has(entry.handle.status))); }
  return Object.freeze({
    admit(name, entries) {
      const limit = limits(name), policy = policies.get(name);
      if (limit.admission === 'reject') return { error: reject(name, 'kernel-pressure', limit.level) };
      const all = [...pending(entries), ...reservations], own = all.filter(entry => entry.name === name);
      // Replacement never cancels another grant or another host to make room.
      const victim = policy.overflow === 'replace-oldest' && (own.length >= policy.maxPending || all.length >= maxPending) ? own.find(entry => entry.handle) : null;
      if (own.length - (victim ? 1 : 0) >= policy.maxPending || all.length - (victim ? 1 : 0) >= maxPending) return { error: reject(name, 'pending-limit', limit.level) };
      if (victim) { replaced++; lastDecision = { name, reason: 'replace-oldest', pressureLevel: limit.level }; }
      const reservation = { name }; reservations.add(reservation);
      return { limit, victim, release: () => reservations.delete(reservation) };
    },
    start(name) { const limit = limits(name); if (limit.admission === 'reject') throw reject(name, 'kernel-pressure', limit.level); return limit; },
    limits,
    snapshot(entries) { return freeze({ schema: 'xtend.xtensions.work-budget-state.v1', pressureLevel: pressure(), maxPending,
      pending: pending(entries).length + reservations.size, rejected, replaced, lastDecision: clone(lastDecision) }); }
  });
}
module.exports = { createWorkBudgetPolicy };
