import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import vm from 'node:vm';
import fs from 'node:fs';
import {createHtmlSanitizer} from '../../xtendrmt/html-sanitizer.mjs';
import {createRmtNodeSsrAdapter} from '../../xtendrmt/rmt-node-ssr-adapter.js';
import {sanitizeTrustedDomHtml} from '../../security/trusted-dom-policy.mjs';

export const payloads = [
  '<svg/onload=alert(1)>', '<img/src=x/onerror=alert(1)>',
  '<a href="java&#x73;cript:alert(1)">unsafe</a>',
  '<a href="java&Tab;script:alert(1)">unsafe</a>',
  '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">',
  '<style>@import "https://attacker.invalid";</style><p style="background:url(javascript:alert(1))">safe</p>',
  '<a href="unknown:payload">safe</a><template><img onerror=alert(1) src=x></template>'
];

function assertSafe(html) {
  const fragment = JSDOM.fragment(String(html));
  assert.equal(fragment.querySelector('script,svg,math,style,iframe,object,embed,template,form'), null);
  for (const node of fragment.querySelectorAll('*')) for (const attr of node.attributes) {
    assert.ok(!/^on/i.test(attr.name) && !['style','srcdoc','srcset'].includes(attr.name));
    if (['href','src'].includes(attr.name)) assert.ok(!/^(?:javascript|data|vbscript|unknown):/i.test(attr.value.replace(/\s/g, '')));
  }
}

test('browser policy, central policy, kernel delivery variants and reparsed SSR use safe parser results', async () => {
  const window = new JSDOM('').window;
  const sanitize = createHtmlSanitizer(window);
  const adapter = createRmtNodeSsrAdapter();
  for (const payload of payloads) {
    assertSafe(sanitize(payload).html);
    assertSafe(sanitizeTrustedDomHtml(payload, {windowTarget: window}).html);
    const result = await adapter.render({descriptor: {type:'html', trustBoundary:'xtend.security.sanitizing-boundary.v1', html:payload}});
    assertSafe(result.html);
  }
  for (const file of ['rmt-core.esm.js', 'rmt-runtime.esm.js', 'rmt-runtime.browser.js']) {
    const source = fs.readFileSync(new URL(`../../xtendrmt/${file}`, import.meta.url), 'utf8').replace(/^\s*import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];\s*$/gmu, '').replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '');
    const context = vm.createContext({console, setTimeout, clearTimeout, window, document:window.document});
    vm.runInContext(source, context);
    const modules = file.endsWith('.esm.js') ? vm.runInContext('AppModules', context) : context.XTendRMT;
    const purifier = modules.createHtmlSanitizer(window);
    for (const payload of payloads) assertSafe(purifier(payload).html);
  }
  assert.match(String(sanitize('<p>safe <strong>text</strong></p>').html), /<strong>text<\/strong>/);
  assert.equal(createHtmlSanitizer(undefined)('<b>unsafe without parser</b>').ok, false);
  window.close();
});

test('SSR blocks missing boundaries and failed host sanitizers', async () => {
  const adapter = createRmtNodeSsrAdapter();
  assert.equal((await adapter.render({descriptor:{type:'html',html:'<b>unsafe</b>'}})).html, '');
  const result = await adapter.render({descriptor:{type:'html',trustBoundary:'xtend.security.sanitizing-boundary.v1',html:'<b>unsafe</b>'}}, {sanitizeHtmlOutput:() => {throw new Error('failed');}});
  assert.equal(result.html, '');
});
