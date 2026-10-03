export function createLocaleService({ storage, navigatorTarget, supported = ['de', 'en'], fallback = 'de' }) {
  let disposed = false;
  const normalize = (value) => supported.includes(String(value || '').toLowerCase().split('-')[0]) ? String(value).toLowerCase().split('-')[0] : fallback;
  return Object.freeze({
    normalize,
    current() { return disposed ? fallback : normalize(storage?.getItem('xtend-docs-locale') || navigatorTarget?.language); },
    persist(locale) { if (!disposed) storage?.setItem('xtend-docs-locale', normalize(locale)); },
    dispose() { disposed = true; }
  });
}
