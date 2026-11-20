import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body><main id="a"></main><main id="b"></main></body></html>', { url: 'http://localhost/' });
for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'CustomEvent', 'customElements', 'localStorage', 'sessionStorage']) globalThis[name] = dom.window[name];
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
const originalDefine = customElements.define;
const { createManagedNativeServices, createManagedStatePort, NATIVE_SERVICES_SCHEMA, NATIVE_STATE_PORT_SCHEMA } = await import('../../components/native-services.js');
const { xtendState } = await import('../../components/xtend-state.definition.js');
const platformDefinitions = await Promise.all(['xrouter', 'xsidepanel', 'xsurfacemanager', 'xsurfaceportal', 'xsurfaceregion', 'xsurfacewindow'].map((name) => import(`../../components/${name}.definition.js`)));
const { createXtendI18n } = await import('../../components/xtend-i18n.definition.js');
const { createSurfaceController } = require('../../components/xsurfacemanager-controller.js');
const { prepareNativeComponent, disposeNativeComponent } = require('../../tools/xtensions/native-component-managed.js');
const { getRmtxNativeComponentV2 } = require('../../tools/rmt-language/rmtx-native-components-v2.js');

test('pure native imports do not bootstrap globals, CE registration, listeners or i18n patches', () => {
  assert.equal(window.XTend, undefined);
  assert.equal(window.XUtils, undefined);
  assert.equal(window.XTheme, undefined);
  assert.equal(window.xtendI18n, undefined);
  assert.equal(customElements.define, originalDefine);
  for (const tag of ['x-router', 'x-side-panel', 'x-surface-manager', 'x-surface-portal', 'x-surface-region', 'x-surface-window']) assert.equal(customElements.get(tag), undefined);
  assert.equal(xtendState.snapshot().listenerCount, 0);
});

test('managed State reuses the existing adapter with isolated keys and owned cleanup', () => {
  const before = xtendState.snapshot().listenerCount;
  const a = createManagedStatePort({ owner: 'state-a' });
  const b = createManagedStatePort({ owner: 'state-b' });
  const aggregate = createManagedNativeServices({ root: document.getElementById('a'), owner: 'state-schema' });
  assert.equal(NATIVE_STATE_PORT_SCHEMA, 'xtend.native-services.state-port.v1');
  assert.equal(a.schema, NATIVE_STATE_PORT_SCHEMA);
  assert.equal(b.schema, NATIVE_STATE_PORT_SCHEMA);
  assert.equal(aggregate.state.schema, NATIVE_STATE_PORT_SCHEMA);
  assert.equal(aggregate.schema, 'xtend.native-services.port.v1');
  assert.equal(aggregate.schema, NATIVE_SERVICES_SCHEMA);
  assert.ok(aggregate.state.schema !== aggregate.schema);
  assert.equal(aggregate.apiVersion, '1.0.0');
  const methods = ['get', 'set', 'remove', 'batchUpdate', 'subscribe', 'snapshot', 'dispose'].sort();
  assert.deepEqual(Object.keys(a).filter(key => typeof a[key] === 'function').sort(), methods);
  assert.deepEqual(Object.keys(aggregate.state).filter(key => typeof aggregate.state[key] === 'function').sort(), methods);
  aggregate.state.set('retained', 7);
  aggregate.dispose(); aggregate.dispose();
  assert.throws(() => aggregate.state.get('retained'), /disposed/);
  assert.equal(xtendState.snapshot().listenerCount, before);
  const events = [];
  a.subscribe((key, value) => events.push([key, value]), 'value');
  a.set('value', 1); b.set('value', 2);
  a.batchUpdate({ value: 3, other: 4 });
  assert.deepEqual(events, [['value', 1], ['value', 3]]);
  assert.deepEqual(a.snapshot(), { value: 3, other: 4 });
  assert.equal(b.get('value'), 2);
  xtendState.set('foreign-key', 9);
  a.dispose(); a.dispose();
  assert.equal(xtendState.snapshot().listenerCount, before);
  assert.equal(xtendState.get('foreign-key'), 9);
  assert.equal(b.get('value'), 2);
  assert.equal('clear' in b, false);
  assert.throws(() => a.set('value', 5), /disposed/);
  b.dispose();
});

test('managed i18n labels stay data, preserve Light DOM and reject foreign roots', async () => {
  const root = document.getElementById('a');
  const foreign = document.getElementById('b');
  root.innerHTML = '<x-button data-i18n-key="hello"><span>Authored child</span></x-button><p data-i18n-key="hello">Authored text</p>';
  const original = root.innerHTML;
  const i18n = createXtendI18n({ managed: true, root });
  i18n.configure({ labels: { en: { hello: 'Hello', 'x-button.label': 'Replacement' } } });
  assert.equal(i18n.getLabelRecord('hello').value, 'Hello');
  assert.equal(root.innerHTML, original);
  assert.equal(customElements.define, originalDefine);
  assert.throws(() => i18n.applyLabels(foreign), /outside/);
  const outside = document.createElement('x-button'); foreign.append(outside);
  assert.throws(() => i18n.bindComponent(outside), /outside/);
  assert.throws(() => i18n.registerLabels('de', 'https://example.invalid/labels.js'), /captured loader/);
  let resolve;
  i18n.registerLabels('de', () => new Promise((done) => { resolve = done; }));
  const pending = i18n.setLocale('de');
  await Promise.resolve(); await Promise.resolve();
  i18n.dispose();
  resolve({ labels: { hello: 'Hallo' } });
  await assert.rejects(pending, /disposed/);
  assert.equal(root.innerHTML, original);
});

test('scoped Theme uses the shared manager, restores owned values and preserves host writes', () => {
  const root = document.getElementById('a');
  root.replaceChildren(); root.setAttribute('data-theme', 'host-before');
  root.style.setProperty('--foreign-token', 'purple');
  const docTheme = document.documentElement.getAttribute('data-theme');
  const services = createManagedNativeServices({ root, owner: 'theme-a' });
  const theme = services.theme;
  theme.setTheme('dark'); theme.setDensity('compact');
  assert.equal(root.getAttribute('data-theme'), 'dark');
  assert.equal(document.documentElement.getAttribute('data-theme'), docTheme);
  assert.equal(root.style.getPropertyValue('--foreign-token'), 'purple');
  const style = root.querySelector('#xtend-theme-a11y-styles');
  assert.ok(style.textContent.includes('[data-xtend-theme-scope='));
  assert.equal(style.textContent.includes(':root'), false);
  root.setAttribute('data-theme', 'host-after');
  services.dispose(); services.dispose();
  assert.equal(root.getAttribute('data-theme'), 'host-after');
  assert.ok(root.querySelector('style')===null,'Owned theme style must be removed');
  assert.equal(root.style.getPropertyValue('--foreign-token'), 'purple');
  assert.equal(window.XTheme, undefined);
});

test('borrowed services are not disposed, missing transition/platform capabilities fail', async () => {
  let disposed = 0;
  const root = document.getElementById('a');
  let released = 0;
  const services = createManagedNativeServices({ root, owner: 'borrow-a', ports: { theme: { manager: { dispose() { disposed++; } }, root, release() { released++; } } } });
  assert.equal(typeof services.utils.formatNumber(1234), 'string');
  assert.throws(() => services.utils.runUiTransition({ target: document.getElementById('b') }), /outside/);
  assert.throws(() => services.utils.runUiTransition({ target: root }), /missing/);
  assert.throws(() => services.dispatch('surface.bind', {}, {}), /missing/);
  assert.ok(services.theme);
  services.dispose();
  assert.equal(disposed, 0);
  assert.equal(released, 1);
  const invalid = createManagedNativeServices({ root, owner: 'invalid-borrow', ports: { theme: { manager: {}, root: document.documentElement } } });
  assert.throws(() => invalid.theme, /explicit root or document scope lease/);
  invalid.dispose();
});

test('owned Utils effects complete through the actual transition Renderer port and disposal revokes held or late work', async()=>{
  const {createRmtDomDescriptorRenderer}=await import('../../xtendrmt/rmt-dom-descriptor-renderer.js');
  const {createRmtSurfaceTransitionRuntime}=await import('../../xtendrmt/rmt-surface-transition-runtime.js');
  const {XUtils}=await import('../../components/xutils.definition.js');
  const root=document.getElementById('a'),foreign=document.getElementById('b');root.replaceChildren();
  const target=document.createElement('section');root.append(target);
  const renderer=createRmtDomDescriptorRenderer({documentTarget:document});
  const transitions=createRmtSurfaceTransitionRuntime({root,domRenderer:renderer,xUtils:XUtils,strict:true,windowTarget:window});
  const transition={id:'owned-utils-transition',trigger:{kind:'action',id:'utils.effect'},effect:'fade',durationMs:1,easing:'linear',from:[],to:[],interrupt:'replace'};
  const invoke=input=>transitions.applyVisibilityPatch({...input,transition,element:input.target,surface:'owned-utils'});
  const calls=[];let waitForAdmission=null,finishAdmission;
  const services=createManagedNativeServices({root,owner:'actual-utils-effects',ports:{async transition(input){
    calls.push(input);if(waitForAdmission)await waitForAdmission;
    return invoke(input);
  }}});
  const held=services.utils;
  try{
    assert.deepEqual(held.hexToRgb('#fff'),[255,255,255]);assert.equal(held.contrastColor('#ffffff'),'#000');
    assert.equal(held.formatNumber(1234.5,'en-US'),'1,234.5');assert.equal(held.formatDate('2026-11-19T12:00:00Z','de-DE'),'19.11.2026');
    const original={rows:[{key:1}]},copy=held.deepClone(original);assert.deepEqual(copy,original);assert.ok(copy!==original&&copy.rows!==original.rows);
    held.setAria(target,{label:'Owned transition'});assert.equal(target.getAttribute('aria-label'),'Owned transition');
    const foreignLabel=foreign.getAttribute('aria-label');assert.throws(()=>held.setAria(foreign,{label:'Forbidden'}),/outside/);assert.equal(foreign.getAttribute('aria-label'),foreignLabel);
    const foreignSignal=new AbortController();
    const hidden=await held.runUiTransition({target,signal:foreignSignal.signal,previousHidden:false,nextHidden:true});
    assert.equal(hidden.status,'complete');assert.equal(hidden.hidden,true);assert.equal(target.hidden,true);assert.equal(calls.length,1);
    assert.ok(calls[0].target===target,'The actual port receives only the owned original');
    assert.equal(calls[0].signal.aborted,false);
    assert.ok(calls[0].signal!==foreignSignal.signal,'The owner signal must override caller-provided transition authority');
    assert.throws(()=>held.runUiTransition({target:foreign,previousHidden:false,nextHidden:true}),/outside/);
    assert.equal(calls.length,1,'A foreign target must be rejected before port dispatch');
    const shown=await held.runUiTransition({target,previousHidden:true,nextHidden:false});
    assert.equal(shown.status,'complete');assert.equal(shown.hidden,false);assert.equal(target.hidden,false);
    waitForAdmission=new Promise(resolve=>{finishAdmission=resolve;});
    const late=held.runUiTransition({target,previousHidden:false,nextHidden:true});
    const signal=calls.at(-1).signal;assert.ok(signal===calls[0].signal,'All work retains the actual owner lifetime');services.dispose();assert.equal(signal.aborted,true);
    assert.throws(()=>held.runUiTransition({target,previousHidden:false,nextHidden:true}),/disposed/);
    const fresh=createManagedNativeServices({root,owner:'actual-utils-effects',ports:{transition:invoke}});
    try{finishAdmission();assert.equal((await late).status,'superseded');assert.equal(target.hidden,false,'Old late work cannot mutate a fresh owner activation');assert.equal((await fresh.utils.runUiTransition({target,previousHidden:false,nextHidden:true})).hidden,true);}finally{fresh.dispose();}
  }finally{services.dispose();transitions.dispose();renderer.dispose(root);root.replaceChildren();}
});

test('managed Surface region delegates to the real controller and releases once without ancestor writes', () => {
  const root = document.getElementById('a'); root.replaceChildren();
  const { XSurfaceRegion } = platformDefinitions[4];
  customElements.define('x-surface-region', XSurfaceRegion);
  const controller = createSurfaceController({ managerId: 'real-native-manager', stateKey: 'test.surface', xtendState });
  let released = 0; let connected = 0;
  const element = document.createElement('x-surface-region');
  const abort = new AbortController();
  const owner = { documentId: 'platform-test', surfaceId: 'root', generation: 1 };
  let registered = false;
  const services = createManagedNativeServices({ root, owner, ports: { platform: {
    bindSurface(args, lease) {
      assert.equal(args.role, 'x-surface-region'); assert.ok(lease.element === element, 'The private lease must capture the exact Surface region');
      return {
        connect() { connected++; registered = true; controller.registerSurface(element.toSurfaceRecord('real-native-manager')); },
        command(name, args) {
          assert.ok(registered);
          const methods = { open: 'openSurface', close: 'closeSurface', focus: 'focusSurface', update: 'updateSurface', restore: 'restoreSurface' };
          return controller[methods[name]](element.surfaceId, args);
        },
        release() { released++; controller.destroySurface(element.surfaceId); }
      };
    }
  } } });
  prepareNativeComponent(element, { descriptor: getRmtxNativeComponentV2('x-surface-region'), owner, ref: 'region', keys: [], signal: abort.signal, isCurrent: () => !abort.signal.aborted, ports: { dispatch: services.dispatch } });
  element.setAttribute('surface-id', 'owned-region');
  root.append(element);
  assert.equal(connected, 1);
  assert.equal(root.hasAttribute('surface-bounds-container'), false);
  element.openRegion();
  assert.equal(controller.snapshot().surfaces.find((record) => record.id === 'owned-region').status, 'open');
  element.remove(); disposeNativeComponent(element);
  assert.equal(released, 1);
  assert.equal(root.hasAttribute('surface-bounds-container'), false);
  services.dispose();
});
