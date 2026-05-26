const MARACA_INLINE_REGISTRY_SCHEMA = 'xtend.maraca.inline-registry.v1';

function createInlineComponentRegistry(entries = []) {
  const registry = {};
  entries.forEach((entry) => {
    if (!entry || typeof entry.tag !== 'string') return;
    registry[entry.tag] = typeof entry.load === 'function'
      ? entry.load
      : () => Promise.resolve(entry.module || null);
  });
  return Object.freeze(registry);
}

function createPublicNameReservationSet(names = []) {
  return new Set(names.filter((name) => typeof name === 'string' && name.length > 0));
}

function isPublicNameReserved(name, reservations = []) {
  if (typeof name !== 'string' || name.length === 0) return false;
  const set = reservations instanceof Set ? reservations : createPublicNameReservationSet(reservations);
  return set.has(name);
}

module.exports = {
  MARACA_INLINE_REGISTRY_SCHEMA,
  createInlineComponentRegistry,
  createPublicNameReservationSet,
  isPublicNameReserved
};
