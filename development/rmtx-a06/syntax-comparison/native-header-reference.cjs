'use strict';
// New opt-in development adapter 1.0.0. Existing A06 APIs/wire contracts stay intact.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const comparison = require('./comparison.cjs');
const NATIVE_HEADER_API_VERSION = '1.0.0';
function attachNativeHeader(variant) {
  const lowered = JSON.parse(JSON.stringify(variant.lowered));
  const view = variant.view;
  if (view?.format !== 1 || view.version !== '1.0.0' || view.profile !== 'closed-product-header' || view.nodes.length !== 1) throw new TypeError('Only the captured closed native header sidecar v1 is supported.');
  const header = view.nodes[0];
  if (header.kind !== 'product-header' || header.id !== 'product-header' || header.element !== 'h1' || header.text?.state !== 'product' || JSON.stringify(header.text.path) !== '["id"]') throw new TypeError('Unsupported native header descriptor.');
  const state = variant.compiled.orchestrationArtifacts.state.states.find(s => s.id === header.text.state);
  if (typeof state?.initial?.id !== 'string') throw new TypeError('Native header must bind an actual string-valued initial Model field.');
  const render = lowered.plan.orchestration.artifact.render;
  const descriptor = { type: 'element', tag: 'h1', key: header.id,
    attributes: { 'data-rmtx-native-header': { op: 'literal', value: header.id } },
    text: { op: 'path', path: '$model.' + [header.text.state,...header.text.path].join('.') } };
  let owners = 0;
  function project(node, count) {
    if (!node || typeof node !== 'object') return node;
    if (Array.isArray(node)) return node.map(n=>project(n,count));
    const next = Object.fromEntries(Object.entries(node).map(([k,v])=>[k,project(v,count)]));
    if (node.surface === lowered.ownerSurface) {
      if (count) owners++;
      if (node.children?.length) throw new TypeError('The closed native header profile requires an empty owner view.');
      next.children=[JSON.parse(JSON.stringify(descriptor))];
    }
    return next;
  }
  render.root = project(render.root,true);
  if (owners !== 1) throw new TypeError('Native header must have exactly one declared owner view.');
  render.descriptors = project(render.descriptors,false);
  // All output fields are part of the existing native descriptor contract; no
  // JavaScript function, new public AST field or runtime source compiler is added.
  return { ...variant, lowered, nativeHeader: {format:1,version:NATIVE_HEADER_API_VERSION,ownerSurface:lowered.ownerSurface,descriptor} };
}
async function prepareNativeHeaderVariants() {
  const variants = await comparison.prepareVariants({
    declarative:fs.readFileSync(path.join(__dirname,'native-header.rmtx'),'utf8'),declarativeFile:'native-header.rmtx',
    classic:fs.readFileSync(path.join(__dirname,'native-header.rmt'),'utf8')
  });
  comparison.compareVariants(variants);
  const declarative=attachNativeHeader(variants.declarative),hybrid=attachNativeHeader(variants.hybrid);
  assert.deepEqual(declarative.lowered.plan.orchestration.artifact.render,hybrid.lowered.plan.orchestration.artifact.render,'Both actual native render plans must match.');
  return {declarative,hybrid};
}
module.exports={NATIVE_HEADER_API_VERSION,attachNativeHeader,prepareNativeHeaderVariants};
