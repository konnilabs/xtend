export const WORKBENCH_NAVIGATION_SCHEMA = 'xtend.material.workbench-navigation.v1';

const ROUTES = Object.freeze(['evidence', 'lessons', 'settings']);

export function currentWorkbenchRoute(locationTarget = globalThis.location) {
  const candidate = String(locationTarget && locationTarget.hash || '').replace(/^#/, '');
  return ROUTES.includes(candidate) ? candidate : 'evidence';
}

export function syncWorkbenchNavigation(root = document.getElementById('xtend-material-workbench'), locationTarget = globalThis.location) {
  const route = currentWorkbenchRoute(locationTarget);
  const links = root ? Array.from(root.querySelectorAll('.xtm-navigation-rail [data-route]')) : [];
  links.forEach((link) => {
    if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (root) root.dataset.xtmRoute = route;
  return Object.freeze({ schema: WORKBENCH_NAVIGATION_SCHEMA, route, linkCount: links.length });
}

export function measureWorkbenchNavigation(root = document.getElementById('xtend-material-workbench')) {
  const navigation = root ? root.querySelector('.xtm-navigation-rail') : null;
  const header = root ? root.querySelector('.xtm-top-app-bar') : null;
  const compact = globalThis.innerWidth < 768;
  const navigationStyle = navigation ? getComputedStyle(navigation) : null;
  const navigationRect = navigation ? navigation.getBoundingClientRect() : null;
  const headerRect = header ? header.getBoundingClientRect() : null;
  const visible = compact
    ? Boolean(navigationStyle && navigationStyle.display === 'none')
    : Boolean(navigationRect && headerRect
      && navigationStyle.display !== 'none'
      && navigationRect.width > 0
      && navigationRect.top >= headerRect.bottom - 1
      && navigationRect.bottom <= globalThis.innerHeight + 1);
  if (root) root.dataset.xtmNavigationVisible = String(visible);
  return Object.freeze({ schema: WORKBENCH_NAVIGATION_SCHEMA, compact, visible });
}

function settleWorkbenchNavigation() {
  syncWorkbenchNavigation();
  globalThis.requestAnimationFrame(() => measureWorkbenchNavigation());
}

const initialNavigation = syncWorkbenchNavigation();
globalThis.requestAnimationFrame(() => measureWorkbenchNavigation());
globalThis.addEventListener('hashchange', settleWorkbenchNavigation);

Object.defineProperty(globalThis, '__XTEND_MATERIAL_NAVIGATION__', {
  configurable: true,
  enumerable: false,
  value: Object.freeze({ schema: WORKBENCH_NAVIGATION_SCHEMA, initialNavigation, sync: syncWorkbenchNavigation, measure: measureWorkbenchNavigation })
});
