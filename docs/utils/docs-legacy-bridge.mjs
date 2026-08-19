/**
 * @deprecated Test-only bridge. The production Docs application must not import
 * this module. Remove consumers instead of adding new adapters.
 */
export function installDeprecatedDocsGlobals(target, services) {
  if (!target || !services) throw new TypeError('A target and Docs services are required.');
  Object.defineProperty(target, 'xtendShowToast', { configurable: true, value: services.toast });
  Object.defineProperty(target, 'xtendDocsI18n', { configurable: true, value: Object.freeze({
    normalizeLocale: services.locale.normalize,
    getCurrentLocale: services.locale.current,
    snapshot: services.locale.snapshot
  }) });
  return Object.freeze({
    schema: 'xtend.docs.legacy-bridge.v1',
    deprecated: true,
    dispose() {
      delete target.xtendShowToast;
      delete target.xtendDocsI18n;
    }
  });
}
