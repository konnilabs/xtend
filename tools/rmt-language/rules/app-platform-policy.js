const {
  lintAppPlatformDocument
} = require('../app-platform-tooling');

function isAppPlatformDocument(document = {}) {
  const metadata = document.manifest && document.manifest.metadata && typeof document.manifest.metadata === 'object'
    ? document.manifest.metadata
    : {};
  const contract = typeof metadata.contractVersion === 'string' ? metadata.contractVersion : '';
  return contract.includes('epic18')
    || Array.isArray(document.portals)
    || Array.isArray(document.overlays)
    || Array.isArray(document.resources)
    || Array.isArray(document.events)
    || Array.isArray(document.actions)
    || Array.isArray(document.dataSources);
}

function createAppPlatformPolicyRule() {
  return {
    id: 'rmt.app-platform-policy',
    description: 'Validiert Epic-18 App-Platform Primitives fuer Surfaces, Portals, Events und Resources.',
    defaultSeverity: 'error',
    run(context) {
      if (!isAppPlatformDocument(context.document)) return [];
      return lintAppPlatformDocument(context.document, {
        sourceModel: context.sourceModel
      }).map((diagnostic) => ({
        ...diagnostic,
        ruleId: 'rmt.app-platform-policy'
      }));
    }
  };
}

module.exports = {
  createAppPlatformPolicyRule,
  isAppPlatformDocument
};
