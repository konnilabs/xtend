export function createDiagnostics({ eventTarget, now = () => performance.now() }) {
  if (!eventTarget) throw new TypeError('eventTarget is required');
  let disposed = false;
  const records = [];
  return Object.freeze({
    record(detail) { if (!disposed) records.push(Object.freeze({ ...detail, at: now() })); },
    publish(type = 'xtend-docs-diagnostics') {
      if (!disposed) eventTarget.dispatchEvent(new CustomEvent(type, { detail: records.slice() }));
    },
    snapshot() { return records.slice(); },
    dispose() { if (disposed) return; disposed = true; records.length = 0; }
  });
}
