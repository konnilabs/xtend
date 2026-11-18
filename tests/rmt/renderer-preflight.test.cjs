'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const apiPromise = import('../../xtendrmt/rmt-dom-descriptor-renderer.js');
async function fixture() {
  const dom = new JSDOM('<main><span>untouched</span></main>');
  const api = await apiPromise, root = dom.window.document.querySelector('main');
  const renderer = api.createRmtDomDescriptorRenderer({ documentTarget: dom.window.document });
  return { dom, root, renderer, close() { renderer.dispose(); dom.window.close(); } };
}
const literal = value => ({ op: 'literal', value });
const request = (root, descriptor) => ({ operation: 'reconcile-children', target: root, descriptors: [descriptor] });
test('shared renderer preflight validates without creating or mutating DOM nodes', async () => {
  const f = await fixture();
  try {
    const before = f.root.firstChild;
    const observer = new f.dom.window.MutationObserver(() => {}); observer.observe(f.root, { subtree: true, childList: true, attributes: true, characterData: true });
    f.dom.window.document.createElement = () => { throw Error('Preflight cannot create elements.'); };
    f.dom.window.document.createTextNode = () => { throw Error('Preflight cannot create text.'); };
    assert.equal(f.renderer.preflight(request(f.root, { type: 'element', tag: 'a', key: literal('link'), attributes: { href: literal('/safe') }, text: literal('safe') })), true);
    assert.equal(f.root.firstChild, before); assert.equal(f.root.textContent, 'untouched'); assert.deepEqual(observer.takeRecords(), []); observer.disconnect();
  } finally { f.close(); }
});
for (const [name, descriptor] of [
  ['unsafe URL', { type: 'element', tag: 'a', attributes: { href: literal('javascript:alert(1)') } }],
  ['unsafe property', { type: 'element', tag: 'div', properties: { innerHTML: literal('<b>bad</b>') } }],
  ['unsafe event attribute', { type: 'element', tag: 'button', attributes: { onclick: literal('bad()') } }],
  ['unsafe tag', { type: 'element', tag: 'iframe' }],
  ['duplicate key', { type: 'fragment', children: [{ type: 'element', tag: 'p', key: literal('same') }, { type: 'element', tag: 'p', key: literal('same') }] }]
]) test('preflight and commit reject the same ' + name + ' before a mutation', async () => {
  const f = await fixture();
  try {
    const input = request(f.root, descriptor), before = f.root.innerHTML; let code;
    assert.throws(() => f.renderer.preflight(input), error => { code = error.code; return !!code; });
    assert.equal(f.root.innerHTML, before);
    assert.throws(() => f.renderer.commit(input), error => error.code === code); assert.equal(f.root.innerHTML, before);
  } finally { f.close(); }
});
