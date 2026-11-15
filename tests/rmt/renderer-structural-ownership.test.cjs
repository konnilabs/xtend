'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const modulePromise = import('../../xtendrmt/rmt-dom-descriptor-renderer.js');
const owner = 'surface-resource-graph';
const ownership = {
  owner, mode: 'strict',
  domains: Object.fromEntries(['structure', 'content', 'attributes', 'properties', 'class', 'part', 'styleTokens'].map(domain => [domain, owner]))
};

async function fixture() {
  const dom = new JSDOM('<main id="app"></main>'), document = dom.window.document;
  const api = await modulePromise, renderer = api.createRmtDomDescriptorRenderer({ documentTarget: document });
  const root = document.querySelector('main');
  return { dom, document, root, renderer, api, close() { renderer.dispose(); dom.window.close(); } };
}

function graphRoot(renderer, descriptor = { type: 'element', tag: 'aside', key: 'portal', children: [{ type: 'element', tag: 'input', properties: { value: 'focused' } }] }) {
  return renderer.commit({ operation: 'create-node', descriptor, ownership }).nodes[0];
}

function changedProtectedRoot(records, node) {
  return records.some(record => [...record.removedNodes, ...record.addedNodes].includes(node));
}

test('parent reconciliation retains a trusted owner root, its focused subtree and DOM identity', async () => {
  const f = await fixture();
  try {
    assert.equal(f.api.RMT_DOM_DESCRIPTOR_RENDERER_API_VERSION, '2.2.0');
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [{ type: 'element', tag: 'section', key: 'view', text: 'before' }] });
    const portal = graphRoot(f.renderer); f.root.appendChild(portal);
    const input = portal.querySelector('input'); input.focus();
    const observer = new f.dom.window.MutationObserver(() => {}); observer.observe(f.root, { childList: true });
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [{ type: 'element', tag: 'section', key: 'view', text: 'after' }] });
    assert.equal(f.root.querySelector('aside'), portal); assert.equal(portal.querySelector('input'), input);
    assert.equal(f.document.activeElement, input); assert.equal(f.root.querySelector('section').textContent, 'after');
    assert(!changedProtectedRoot(observer.takeRecords(), portal)); observer.disconnect();
  } finally { f.close(); }
});

test('replace-children leaves foreign owner roots connected instead of replacing or reattaching them', async () => {
  const f = await fixture();
  try {
    const old = f.document.createElement('div'); f.root.appendChild(old);
    const portal = graphRoot(f.renderer); f.root.appendChild(portal); const input = portal.querySelector('input'); input.focus();
    let replacements = 0;
    f.root.replaceChildren = () => { replacements += 1; throw Error('Foreign roots cannot be detached.'); };
    const observer = new f.dom.window.MutationObserver(() => {}); observer.observe(f.root, { childList: true });
    f.renderer.commit({ operation: 'replace-children', target: f.root, descriptor: { type: 'element', tag: 'p', text: 'new view' } });
    assert.equal(replacements, 0); assert.equal(old.parentNode, null); assert.equal(portal.parentNode, f.root);
    assert.equal(f.document.activeElement, input); assert.equal(f.root.querySelector('p').textContent, 'new view');
    assert(!changedProtectedRoot(observer.takeRecords(), portal)); observer.disconnect();
  } finally { f.close(); }
});

test('ordinary DOM and forged source or attribute ownership markers receive no reservation', async () => {
  const f = await fixture();
  try {
    const unknown = f.document.createElement('div'); unknown.setAttribute('data-rmt-owner', owner); unknown.setAttribute('data-rmt-preserve', 'true'); f.root.appendChild(unknown);
    const forged = f.renderer.commit({ operation: 'create-node', descriptor: { type: 'element', tag: 'aside', ownership: { owner }, attributes: { 'data-rmt-owner': owner } }, context: { structuralOwner: owner, ownership } }).nodes[0];
    f.root.appendChild(forged);
    const reserved = graphRoot(f.renderer); f.root.appendChild(reserved); reserved.setAttribute('data-rmt-owner', 'pretend-someone-else');
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] });
    assert.deepEqual([...f.root.childNodes], [reserved]); assert.equal(unknown.parentNode, null); assert.equal(forged.parentNode, null);
  } finally { f.close(); }
});

test('same-owner removal cleans its reservation instead of preserving its own old nodes', async () => {
  const f = await fixture();
  try {
    const portal = graphRoot(f.renderer); f.root.appendChild(portal);
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [], ownership });
    assert.equal(portal.parentNode, null);
    f.root.appendChild(portal);
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] });
    assert.equal(portal.parentNode, null);
  } finally { f.close(); }
});

test('a matching key never lets a parent reuse or patch a different owners node', async () => {
  const f = await fixture();
  try {
    const portal = graphRoot(f.renderer, { type: 'element', tag: 'div', key: 'collision', text: 'graph content' }); f.root.appendChild(portal);
    const result = f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [{ type: 'element', tag: 'div', key: 'collision', text: 'view content' }] });
    assert.equal(portal.textContent, 'graph content'); assert.notEqual(result.nodes[0], portal);
    assert.equal(f.root.children.length, 2); assert.equal(result.nodes[0].textContent, 'view content');
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] });
    assert.deepEqual([...f.root.childNodes], [portal]);
  } finally { f.close(); }
});

test('disposing a node or the renderer releases private reservations', async () => {
  const f = await fixture();
  try {
    const portal = graphRoot(f.renderer); f.root.appendChild(portal); f.renderer.dispose(portal);
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] }); assert.equal(portal.parentNode, null);
    const second = graphRoot(f.renderer); f.root.appendChild(second); f.renderer.dispose();
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] }); assert.equal(second.parentNode, null);
  } finally { f.close(); }
});

test('only returned create-node roots are reserved, not arbitrary descendants moved out of that scope', async () => {
  const f = await fixture();
  try {
    const portal = graphRoot(f.renderer); f.root.appendChild(portal); const child = portal.firstChild; f.root.appendChild(child);
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] });
    assert.deepEqual([...f.root.childNodes], [portal]); assert.equal(child.parentNode, null);
  } finally { f.close(); }
});

test('text replacement and stale-content cleanup preserve another owner root inside a reused element', async () => {
  const f = await fixture();
  try {
    const view = () => ({ type: 'element', tag: 'section', key: 'view' });
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [{ ...view(), text: 'old text' }] });
    const section = f.root.querySelector('section'), portal = graphRoot(f.renderer); section.appendChild(portal); const input = portal.querySelector('input'); input.focus();
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [view()] });
    assert.equal(portal.parentNode, section); assert.equal(f.document.activeElement, input);
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [{ ...view(), text: 'new text' }] });
    assert.equal(portal.parentNode, section); assert.equal(f.document.activeElement, input); assert(section.textContent.includes('new text'));
  } finally { f.close(); }
});

function nestedPortal(f) {
  const wrapper = f.document.createElement('section'), inner = f.document.createElement('div');
  const portal = graphRoot(f.renderer); inner.appendChild(portal); wrapper.appendChild(inner); f.root.appendChild(wrapper);
  const input = portal.querySelector('input'); input.focus();
  return { wrapper, inner, portal, input };
}

test('a parent reconcile retains a native ancestor of a deeply nested private foreign root', async () => {
  const f = await fixture();
  try {
    const { wrapper, inner, portal, input } = nestedPortal(f);
    const ordinary = f.document.createElement('p'); f.root.appendChild(ordinary);
    const observer = new f.dom.window.MutationObserver(() => {}); observer.observe(f.root, { childList: true, subtree: true });
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] });
    assert.deepEqual([...f.root.childNodes], [wrapper]); assert.equal(inner.parentNode, wrapper); assert.equal(portal.parentNode, inner);
    assert.equal(f.document.activeElement, input); assert.equal(ordinary.parentNode, null);
    const records = observer.takeRecords(); assert(!changedProtectedRoot(records, wrapper)); assert(!changedProtectedRoot(records, portal)); observer.disconnect();
  } finally { f.close(); }
});

test('replace-children does not indirectly detach a foreign root through its native ancestor', async () => {
  const f = await fixture();
  try {
    const { wrapper, portal, input } = nestedPortal(f);
    f.root.replaceChildren = () => { throw Error('A protected descendant cannot be detached with its ancestor.'); };
    f.renderer.commit({ operation: 'replace-children', target: f.root, descriptor: { type: 'element', tag: 'p', text: 'replacement' } });
    assert.equal(wrapper.parentNode, f.root); assert(portal.isConnected); assert.equal(f.document.activeElement, input);
    assert.equal(f.root.querySelector('p').textContent, 'replacement');
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] });
    assert.deepEqual([...f.root.childNodes], [wrapper]);
  } finally { f.close(); }
});

test('text replacement and stale native content cleanup preserve a nested foreign branch', async () => {
  const f = await fixture();
  try {
    const view = extra => ({ type: 'element', tag: 'section', key: 'native-owner', ...extra });
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [view({ children: [{ type: 'element', tag: 'p', text: 'old' }] })] });
    const section = f.root.querySelector('section'), inner = f.document.createElement('div'), portal = graphRoot(f.renderer);
    inner.appendChild(portal); section.appendChild(inner); const input = portal.querySelector('input'); input.focus();
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [view({ text: 'new' })] });
    assert.equal(f.root.querySelector('section'), section); assert.equal(inner.parentNode, section); assert.equal(portal.parentNode, inner);
    assert.equal(f.document.activeElement, input); assert(section.textContent.includes('new')); assert.equal(section.querySelector('p'), null);
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [view({})] });
    assert.equal(inner.parentNode, section); assert.equal(portal.parentNode, inner); assert.equal(f.document.activeElement, input);
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] });
    assert.equal(section.parentNode, f.root); assert.equal(portal.parentNode, inner);
  } finally { f.close(); }
});

test('normal native wrapper updates reconcile in place without accumulating protected duplicates', async () => {
  const f = await fixture();
  try {
    const descriptor = value => ({ type: 'element', tag: 'section', key: 'owner:1', children: [{ type: 'element', tag: 'h1', key: 'header', text: value }] });
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [descriptor('first')] });
    const section = f.root.querySelector('section'), header = section.querySelector('h1'), inner = f.document.createElement('div'), portal = graphRoot(f.renderer);
    inner.appendChild(portal); section.appendChild(inner); const input = portal.querySelector('input'); input.focus();
    for (const value of ['second', 'third']) f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [descriptor(value)] });
    assert.equal(f.root.querySelectorAll('section').length, 1); assert.equal(f.root.querySelector('section'), section);
    assert.equal(section.querySelector('h1'), header); assert.equal(header.textContent, 'third'); assert.equal(portal.parentNode, inner); assert.equal(f.document.activeElement, input);
  } finally { f.close(); }
});

test('a new authoritative generation key creates a new wrapper while its old foreign branch stays anchored', async () => {
  const f = await fixture();
  try {
    const descriptor = generation => ({ type: 'element', tag: 'section', key: `owner:${generation}`, children: [{ type: 'element', tag: 'h1', text: `generation ${generation}` }] });
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [descriptor(1)] });
    const old = f.root.querySelector('section'), inner = f.document.createElement('div'), portal = graphRoot(f.renderer);
    inner.appendChild(portal); old.appendChild(inner); const input = portal.querySelector('input'); input.focus();
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [descriptor(2)] });
    const fresh = [...f.root.querySelectorAll('section')].find(section => section !== old);
    assert(fresh); assert.equal(fresh.textContent, 'generation 2'); assert.equal(old.parentNode, f.root); assert.equal(portal.parentNode, inner); assert.equal(f.document.activeElement, input);
    f.renderer.dispose(portal);
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [descriptor(2)] });
    assert.deepEqual([...f.root.childNodes], [fresh]); assert.equal(old.parentNode, null);
  } finally { f.close(); }
});

test('same-owner cleanup and explicit resource disposal release protected native ancestors', async () => {
  const f = await fixture();
  try {
    let nested = nestedPortal(f);
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [], ownership });
    assert.equal(nested.wrapper.parentNode, null);
    nested = nestedPortal(f); f.renderer.dispose(nested.portal);
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] });
    assert.equal(nested.wrapper.parentNode, null);
    const fake = f.document.createElement('section'), fakeRoot = f.document.createElement('aside');
    fakeRoot.setAttribute('data-rmt-owner', owner); fakeRoot.setAttribute('data-rmt-preserve', 'true'); fake.appendChild(fakeRoot); f.root.appendChild(fake);
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] }); assert.equal(fake.parentNode, null);
  } finally { f.close(); }
});

test('private foreign roots inside an open shadow tree protect the native host ancestry', async () => {
  const f = await fixture();
  try {
    const wrapper = f.document.createElement('section'), host = f.document.createElement('div'), shadow = host.attachShadow({ mode: 'open' }), portal = graphRoot(f.renderer);
    shadow.appendChild(portal); wrapper.appendChild(host); f.root.appendChild(wrapper); const input = portal.querySelector('input'); input.focus();
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] });
    assert.equal(wrapper.parentNode, f.root); assert.equal(portal.parentNode, shadow); assert.equal(shadow.activeElement, input);
    f.renderer.dispose(portal); f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] }); assert.equal(wrapper.parentNode, null);
  } finally { f.close(); }
});

test('hide and restore preserve an existing inline display priority within one restore commit', async () => {
  const f = await fixture();
  try {
    const target = f.document.createElement('section'); target.style.setProperty('display', 'grid', 'important'); f.root.appendChild(target);
    f.renderer.commit({ operation: 'merge-element', target, descriptor: { type: 'element', tag: 'section', attributes: { hidden: '', style: { display: 'none' } } } });
    assert.equal(target.style.getPropertyValue('display'), 'none'); assert.equal(target.style.getPropertyPriority('display'), 'important');
    f.renderer.commit({ operation: 'merge-element', target, descriptor: { type: 'element', tag: 'section', attributes: { hidden: false, style: { display: 'grid' } } } });
    assert.equal(target.hasAttribute('hidden'), false); assert.equal(target.style.getPropertyValue('display'), 'grid'); assert.equal(target.style.getPropertyPriority('display'), 'important');
    const ordinary = f.document.createElement('section'); f.root.appendChild(ordinary);
    f.renderer.commit({ operation: 'merge-element', target: ordinary, descriptor: { type: 'element', tag: 'section', attributes: { style: { display: 'grid' } } } });
    assert.equal(ordinary.style.getPropertyPriority('display'), '');
  } finally { f.close(); }
});

test('temporary style-priority preservation does not outlive its commit', async () => {
  const f = await fixture();
  try {
    const target = f.document.createElement('section'); target.style.setProperty('display', 'grid', 'important'); f.root.appendChild(target);
    f.renderer.commit({ operation: 'merge-element', target, descriptor: { type: 'element', tag: 'section', attributes: { hidden: '', style: { display: 'none' } } } });
    f.renderer.commit({ operation: 'merge-element', target, descriptor: { type: 'element', tag: 'section', attributes: { hidden: false } } });
    f.renderer.commit({ operation: 'merge-element', target, descriptor: { type: 'element', tag: 'section', attributes: { style: { display: 'grid' } } } });
    assert.equal(target.style.getPropertyPriority('display'), '');
  } finally { f.close(); }
});

test('a removed native branch retains only its foreign root shell, clearing ordinary native text and controls', async () => {
  const f = await fixture();
  try {
    const wrapper = f.document.createElement('section'), inner = f.document.createElement('article'), header = f.document.createElement('h2'), button = f.document.createElement('button');
    header.textContent = 'retired native header'; button.textContent = 'retired native command';
    inner.appendChild(header); inner.appendChild(button); inner.appendChild(f.document.createTextNode('retired native text'));
    const portal = graphRoot(f.renderer); inner.appendChild(portal); wrapper.appendChild(inner); f.root.appendChild(wrapper);
    const input = portal.querySelector('input'); input.focus();
    const observer = new f.dom.window.MutationObserver(() => {}); observer.observe(f.root, { childList: true, subtree: true });
    f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] });
    assert.equal(wrapper.parentNode, f.root); assert.equal(inner.parentNode, wrapper); assert.deepEqual([...inner.childNodes], [portal]);
    assert.equal(header.parentNode, null); assert.equal(button.parentNode, null); assert.equal(f.document.activeElement, input);
    const mutations = observer.takeRecords(); assert(!changedProtectedRoot(mutations, wrapper)); assert(!changedProtectedRoot(mutations, inner)); assert(!changedProtectedRoot(mutations, portal)); observer.disconnect();
    f.renderer.dispose(portal); f.renderer.commit({ operation: 'reconcile-children', target: f.root, descriptors: [] });
    assert.equal(wrapper.parentNode, null);
  } finally { f.close(); }
});

test('pruning a retained native branch stops at private roots and preserves their own complete subtree', async () => {
  const f = await fixture();
  try {
    const wrapper = f.document.createElement('section'), portal = graphRoot(f.renderer, { type: 'element', tag: 'aside', children: [
      { type: 'element', tag: 'h2', text: 'foreign heading' }, { type: 'element', tag: 'input', properties: { value: 'foreign input' } }
    ] });
    wrapper.appendChild(portal); f.root.appendChild(wrapper); const header = portal.querySelector('h2'), input = portal.querySelector('input'); input.focus();
    f.renderer.commit({ operation: 'replace-children', target: f.root, descriptor: { type: 'element', tag: 'p', text: 'new native view' } });
    assert.equal(portal.parentNode, wrapper); assert.equal(portal.querySelector('h2'), header); assert.equal(header.textContent, 'foreign heading');
    assert.equal(portal.querySelector('input'), input); assert.equal(input.value, 'foreign input'); assert.equal(f.document.activeElement, input);
    assert.equal(f.root.querySelector('p').textContent, 'new native view');
  } finally { f.close(); }
});
