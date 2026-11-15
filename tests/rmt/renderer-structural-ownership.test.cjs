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
    assert.equal(f.api.RMT_DOM_DESCRIPTOR_RENDERER_API_VERSION, '2.1.0');
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
