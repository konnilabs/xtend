function hasRouteTitle(route) {
  const metadata = route && route.metadata && typeof route.metadata === 'object' ? route.metadata : {};

  return Boolean(
    route
      && (
        typeof route.documentTitle === 'string'
        || typeof route.title === 'string'
        || typeof metadata.documentTitle === 'string'
        || typeof metadata.title === 'string'
        || typeof metadata.titleTemplate === 'string'
      )
  );
}

function hasRouteAnnouncement(route) {
  const metadata = route && route.metadata && typeof route.metadata === 'object' ? route.metadata : {};
  const a11y = metadata.a11y && typeof metadata.a11y === 'object' ? metadata.a11y : {};

  return Boolean(
    typeof metadata.announcement === 'string'
      || typeof metadata.routeAnnouncement === 'string'
      || typeof a11y.announcement === 'string'
      || typeof a11y.label === 'string'
  );
}

function isValidRoutePath(value) {
  return typeof value === 'string'
    && value.trim().length > 0
    && (
      value === '*'
      || value.startsWith('/')
      || value.startsWith('#/')
    );
}

function createRoutePolicyRule() {
  return {
    id: 'rmt.route-policy',
    description: 'Validiert Route Paths, SEO-Titel und A11y-Ankuendigungen.',
    defaultSeverity: 'error',
    run(context) {
      const diagnostics = [];

      context.toArray(context.document.routes).forEach((route, index) => {
        const routePointer = context.joinPointer('routes', index);

        if (!isValidRoutePath(route && route.path)) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.route.path.invalid',
            message: `Route "${route && route.id ? route.id : index}" benoetigt einen gueltigen path.`,
            pointer: `${routePointer}/path`
          }));
        }

        if (!hasRouteTitle(route)) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.route.document-title.missing',
            message: `Route "${route && route.id ? route.id : index}" sollte einen Seitentitel fuer SPA/SEO-Rewrites definieren.`,
            pointer: routePointer
          }));
        }

        if (!hasRouteAnnouncement(route)) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.a11y.route-announcement.missing',
            message: `Route "${route && route.id ? route.id : index}" sollte eine A11y-Ankuendigung fuer Screenreader definieren.`,
            pointer: routePointer
          }));
        }
      });

      return diagnostics;
    }
  };
}

module.exports = {
  createRoutePolicyRule
};
