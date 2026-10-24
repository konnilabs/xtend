'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function runXRouterPathConsumptionChecks({ rootDir }) {
  const passes = [], failures = [];
  const source = fs.readFileSync(path.join(rootDir, 'components/xrouter.js'), 'utf8');
  const importLine = "import { xtendState } from './xtend-state.js';";
  assert(source.startsWith(importLine), 'Review the component module boundary before testing');
  let XRouter;
  // Exercise the actual class. Only its state import and DOM registration are
  // isolated; matching and SSR methods are neither copied nor reimplemented.
  vm.runInNewContext(source.slice(importLine.length), {
    HTMLElement: class {}, URL, xtendState: {},
    customElements: {
      define(name, ctor) {
        assert(['x-route', 'x-router'].includes(name));
        if (name === 'x-router') XRouter = ctor;
      }
    }
  });
  assert(XRouter, 'Actual router class must register');
  const route = (path, component, extra = {}) => ({
    path, component, ...extra, tagName: 'X-ROUTE',
    getAttribute(name) {
      return this[name] ?? null;
    },
    getAttributeNames() {
      return ['path', 'component', ...Object.keys(extra).filter(k => k !== 'children')];
    },
    children: extra.children || []
  });
  const host = routes => {
    const r = Object.create(XRouter.prototype);
    r._getRoutes = () => routes;
    r._navigateTo = value => r.redirects.push(value);
    r.redirects = [];
    return r;
  };
  const leaf = match => match?.child ? leaf(match.child) : match?.route?.component;
  const check = (name, body) => {
    try {
      body();
      passes.push(name);
    } catch (error) {
      failures.push(name + ': ' + error.message);
    }
  };
  const home = route('/', 'x-home', { title: 'Home' }), detail = route('/detail', 'x-detail', { title: 'Detail' }), fallback = route('*', 'x-missing');
  check('root-first detail route consumes all segments', () => assert.equal(leaf(host([home, detail])._matchRoute('/detail')), 'x-detail'));
  check('exact root remains selectable', () => assert.equal(leaf(host([home, detail])._matchRoute('/')), 'x-home'));
  check('unconsumed leaf suffix cannot match a registered route', () => assert.equal(host([home, detail])._matchRoute('/detail/extra'), null));
  check('unknown path reaches explicit fallback after root', () => assert.equal(leaf(host([home, detail, fallback])._matchRoute('/missing')), 'x-missing'));
  check('capability probe does not claim a fallback as a registered route', () => assert.equal(host([home, fallback])._matchRoute('/missing', null, { includeNotFound: false }), null));
  check('aliases consume the whole path', () => {
    const r = host([home, route('/detail', 'x-detail', { alias: '/info, /about' })]);
    assert.equal(leaf(r._matchRoute('/info')), 'x-detail');
    assert.equal(r._matchRoute('/about/extra'), null);
  });
  check('parameters preserve values and reject unconsumed suffixes', () => {
    const r = host([home, route('/users/:id', 'x-user')]), m = r._matchRoute('/users/42');
    assert.equal(leaf(m), 'x-user');
    assert.equal(m.params.id, '42');
    assert.equal(r._matchRoute('/users/42/extra'), null);
  });
  check('nested root and parameter children preserve the complete chain', () => {
    const r = host([route('/', 'x-layout', { children: [route('/users/:id', 'x-user', { children: [route('/edit', 'x-edit')] })] })]), m = r._matchRoute('/users/42/edit');
    assert.equal(m.route.component, 'x-layout');
    assert.equal(m.child.params.id, '42');
    assert.equal(leaf(m), 'x-edit');
  });
  check('failed nested prefix continues to a complete sibling match', () => {
    const r = host([route('/users', 'x-layout', { children: [route('/edit', 'x-edit')] }), route('/users/help', 'x-help')]);
    assert.equal(leaf(r._matchRoute('/users/help')), 'x-help');
  });
  check('nested fallback remains scoped and can be excluded', () => {
    const r = host([route('/users', 'x-layout', { children: [fallback] })]);
    assert.equal(leaf(r._matchRoute('/users/missing')), 'x-missing');
    assert.equal(r._matchRoute('/users/missing', null, { includeNotFound: false }), null);
  });
  check('redirect fires only after complete path selection', () => {
    const r = host([route('/', 'x-home', { redirect: '/landing' }), detail]);
    assert.equal(leaf(r._matchRoute('/detail')), 'x-detail');
    assert.deepEqual(r.redirects, []);
    assert.equal(r._matchRoute('/'), null);
    assert.deepEqual(r.redirects, ['/landing']);
  });
  check('exact and aliased redirects preserve navigation suppression', () => {
    const r = host([home, route('/old', 'x-old', { alias: '/legacy', redirect: '/detail' })]);
    assert.equal(r._matchRoute('/legacy'), null);
    assert.deepEqual(r.redirects, ['/detail']);
    r.redirects = [];
    assert.equal(r._matchRoute('/old', null, { navigateRedirect: false }), null);
    assert.deepEqual(r.redirects, []);
  });
  check('nested redirect terminates selection instead of falling through to sibling', () => {
    const r = host([route('/users', 'x-users', { children: [route('/old', 'x-old', { redirect: '/new' })] }), route('/users/old', 'x-wrong')]);
    assert.equal(r._matchRoute('/users/old'), null);
    assert.deepEqual(r.redirects, ['/new']);
  });
  check('parent redirect retains precedence for a completely matched nested path', () => {
    const r = host([route('/users', 'x-users', { redirect: '/new', children: [route('/:id', 'x-user')] })]);
    assert.equal(r._matchRoute('/users/42'), null);
    assert.deepEqual(r.redirects, ['/new']);
  });
  check('SSR root-first detail HTML and metadata select the same route', () => {
    const r = XRouter.renderRouteToString('/detail', [home, detail]);
    assert.equal(r.route.component, 'x-detail');
    assert.equal(r.html, '<x-detail></x-detail>');
    assert.equal(r.meta.title, 'Detail');
  });
  check('SSR aliases and parameter stubs consume complete paths', () => {
    const r = route('/users/:id', 'x-user', { alias: '/people/:id', title: 'User' }), m = XRouter.renderRouteToString('/people/42', [home, r]);
    assert.equal(m.params.id, '42');
    assert(m.html.includes('data-params="%7B%22id%22%3A%2242%22%7D"'));
    assert.equal(m.meta.title, 'User');
    assert.equal(XRouter.renderRouteToString('/people/42/extra', [home, r]).route, null);
  });
  check('SSR nested path preserves parent stub and leaf metadata', () => {
    const routes = [route('/', 'x-layout', { title: 'Layout', children: [route('/users/:id', 'x-user', { title: 'User', children: [route('/edit', 'x-edit', { title: 'Edit' })] })] })], m = XRouter.renderRouteToString('/users/42/edit', routes);
    assert(m.html.includes('<x-layout><x-user data-params='));
    assert(m.html.includes('<x-edit></x-edit>'));
    assert.equal(m.meta.title, 'Edit');
  });
  check('SSR failed nested prefix continues to sibling metadata', () => {
    const routes = [route('/users', 'x-users', { children: [route('/edit', 'x-edit')] }), route('/users/help', 'x-help', { title: 'Help' })];
    assert.equal(XRouter.renderRouteToString('/users/help', routes).route.component, 'x-help');
    assert.equal(XRouter.getMetaForPath('/users/help', routes).title, 'Help');
  });
  check('SSR unknown paths preserve explicit fallback and absent metadata', () => {
    const m = XRouter.renderRouteToString('/missing', [home, fallback]);
    assert.equal(m.route.component, 'x-missing');
    assert.equal(Object.keys(m.meta).length, 0);
    assert.equal(XRouter.renderRouteToString('/missing', [home]).route, null);
  });
  check('SSR redirects remain side-effect-free route descriptors', () => {
    const r = route('/old', 'x-old', { redirect: '/new', title: 'Old' }), m = XRouter.renderRouteToString('/old', [home, r]);
    assert.equal(m.route.redirect, '/new');
    assert.equal(m.html, '<x-old></x-old>');
    assert.equal(m.meta.title, 'Old');
  });
  check('SSR scoped fallback does not leak a later sibling metadata', () => {
    const routes = [route('/users', 'x-users', { children: [fallback] }),
      route('/users/help', 'x-help', { title: 'Help' })];
    const result = XRouter.renderRouteToString('/users/help', routes);
    assert.equal(result.route.component, 'x-users');
    assert(result.html.includes('<x-missing></x-missing>'));
    assert.equal(Object.keys(result.meta).length, 0);
  });
  return { ok: failures.length === 0, passes, failures, skips: [] };
}
module.exports = { runXRouterPathConsumptionChecks };
