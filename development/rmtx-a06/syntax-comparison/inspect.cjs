'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const api = require('./comparison.cjs');
const reference = require('../two-host-reference.cjs');
const ts = require('typescript');
const read = name => fs.readFileSync(path.join(__dirname,name),'utf8');
async function inspect() {
  const observations = [], capture = await reference.captureProviders();
  const source = read('declarative.tsx'), view = read('view.tsx'), classic = read('classic.rmt');
  const test = (name, fn) => { fn(); observations.push({ name, passed: true }); };
  const negative = (name, fn, code) => test(name, () => assert.throws(fn, error => error instanceof api.ComparisonDiagnostic && (!code || error.code === code)));
  const a = api.lowerDeclarative(source,capture), b = api.lowerHybrid(classic,view,capture);
  const variants = { declarative: api.createBackendVariant(a,capture,'declarative.lowered.rmt'), hybrid: api.createBackendVariant(b,capture,'classic.rmt') };
  test('independently lowered sources produce equivalent complete backend artifacts, excluding only source-map ranges', () => api.compareVariants(variants));
  test('the source contracts reproduce the independently captured original Two-Host contract', () => {
    assert.deepEqual(a.contract,reference.readContract()); assert.deepEqual(b.contract,reference.readContract());
  });
  test('identical .rmtx and .tsx source bytes produce identical backend semantics through the explicit frontend', () => {
    assert.equal(read('declarative.rmtx'),source);
    const rmtx = api.createBackendVariant(api.lowerDeclarative(read('declarative.rmtx'),capture,'declarative.rmtx'),capture,'declarative.lowered.rmt');
    api.compareVariants({ declarative: rmtx, hybrid: variants.hybrid });
    assert(rmtx.sourceMapping.source.endsWith('.rmtx'));
    assert(rmtx.sourceMapping.virtual.endsWith('.rmtx.tsx'));
  });
  test('import aliases preserve exact intrinsic/model/provider/input symbol identity', () => {
    const renamed = source.replace('RMT, model, input, providers, ProductHeader', 'RMT as Native, model as data, input as params, providers as components, ProductHeader as Header')
      .replaceAll('RMT.','Native.').replaceAll('model.','data.').replaceAll('input.','params.').replaceAll('providers.','components.').replace('<ProductHeader ','<Header ');
    const alias = api.createBackendVariant(api.lowerDeclarative(renamed,capture),capture,'alias.lowered.rmt');
    api.compareVariants({ declarative: alias, hybrid: variants.hybrid });
  });
  test('declarative initial-state edits reach the actual backend, not copied baseline records', () => {
    const changed = api.lowerDeclarative(source.replace("id: 'p1'","id: 'p2'"),capture);
    assert.equal(changed.compiled.orchestrationArtifacts.state.states.find(s => s.name === 'product' || s.id === 'product').initial.id,'p2');
    assert.notDeepEqual(changed.compiled.orchestrationArtifacts.state,a.compiled.orchestrationArtifacts.state);
  });
  test('Classic initial-state edits independently reach the actual hybrid backend', () => {
    const changed = api.lowerHybrid(classic.replace('id "p1"','id "p3"'),view,capture);
    assert.notDeepEqual(changed.compiled.orchestrationArtifacts.state,b.compiled.orchestrationArtifacts.state);
  });
  test('a source presence edit changes the resolved binding artifact', () => {
    const changed = api.createBackendVariant(api.lowerDeclarative(source.replace('presence={model.hosts.gallery}','presence={model.hosts.reviews}'),capture),capture,'changed.lowered.rmt');
    assert.notDeepEqual(changed.lowered.bindings,variants.declarative.lowered.bindings);
  });
  test('a one-sided lane edit breaks differential semantics instead of being normalized away', () => {
    const changed = api.createBackendVariant(api.lowerDeclarative(source.replace('provider={providers.gallery} lane="visible"','provider={providers.gallery} lane="idle"'),capture),capture,'changed.lowered.rmt');
    assert.throws(() => api.compareVariants({declarative:changed,hybrid:variants.hybrid}),assert.AssertionError);
  });
  negative('top-level side effects are rejected without executing author source', () => api.lowerDeclarative('globalThis.__rmtxProbeSideEffect = true;\n'+source,capture),'EX_MODULE');
  test('the rejected top-level effect left no global state', () => assert.equal(globalThis.__rmtxProbeSideEffect,undefined));
  negative('triple-slash references cannot add hidden compiler inputs', () => api.lowerDeclarative('/// <reference path="./hidden.d.ts" />\n'+source,capture),'EX_DIRECTIVE');
  negative('foreign JSX import sources cannot add hidden compiler inputs', () => api.lowerDeclarative(source.replace('@jsxImportSource .','@jsxImportSource ./foreign'),capture),'EX_DIRECTIVE');
  negative('foreign intrinsic imports cannot borrow native authority by name', () => api.lowerDeclarative(source.replace("from './authoring'","from './foreign'"),capture),'EX_IMPORT');
  negative('local lookalike namespace declarations are rejected', () => api.lowerDeclarative('const Fake = {};\n'+source.replaceAll('RMT.','Fake.'),capture),'EX_MODULE');
  negative('method calls in provider props remain unsupported even when TypeScript accepts them', () => api.lowerDeclarative(source.replace('images: model.product.images','images: model.product.images.filter(() => true)'),capture),'EX_REFERENCE');
  negative('spread properties do not hide call-site bindings', () => api.lowerDeclarative(source.replace('images: model.product.images, selectedImageId: model.product.selectedImageId','...{ images: model.product.images, selectedImageId: model.product.selectedImageId }'),capture),'EX_OBJECT');
  negative('hybrid views cannot redeclare scheduler lanes', () => api.lowerHybrid(classic,view.replace('provider={providers.gallery}','provider={providers.gallery} lane="visible"'),capture),'EX_ATTRIBUTE');
  negative('hybrid views cannot introduce Actions', () => api.lowerHybrid(classic,view.replace('<ProductHeader','<RMT.Action id="extra" /><ProductHeader'),capture),'EX_VIEW');
  negative('hybrid host targets must match Classic mount declarations', () => api.lowerHybrid(classic,view.replace('targetSurface="product-gallery-host"','targetSurface="missing-host"'),capture),'EX_TARGET');
  negative('hybrid native owner must exist in Classic', () => api.lowerHybrid(classic,view.replace('ownerSurface="product-details"','ownerSurface="missing-owner"'),capture),'EX_TARGET');
  negative('unknown Action routes fail the real source/binding validation', () => api.createBackendVariant(api.lowerDeclarative(source.replace("action: 'product.selectImage'","action: 'missing.action'"),capture),capture,'bad.lowered.rmt'),'EX_PLAN');
  negative('a native header path missing from actual State cannot borrow its ambient declaration type', () => api.createBackendVariant(api.lowerDeclarative(source.replace("id: 'p1', ", '').replace('productId: model.product.id','productId: model.product.selectedImageId'),capture),capture,'bad.lowered.rmt'),'EX_VIEW_BINDING');
  negative('a non-string native header path cannot borrow its ambient declaration type', () => api.createBackendVariant(api.lowerDeclarative(source.replace("id: 'p1'",'id: 42').replace('productId: model.product.id','productId: model.product.selectedImageId'),capture),capture,'bad.lowered.rmt'),'EX_VIEW_BINDING');
  negative('source inputs must match the checked input handle types', () => api.lowerDeclarative(source.replace('name="imageId" type="string"','name="imageId" type="object"'),capture),'EX_ACTION');
  for (const directive of ['nocheck','ignore','expect-error']) negative('TypeScript '+directive+' cannot suppress profile validation', () => api.lowerDeclarative('// @ts-'+directive+'\n'+source,capture),'EX_DIRECTIVE');
  negative('the closed input profile rejects nested access through a string', () => api.lowerDeclarative(source.replace('value={input.imageId}','value={input.imageId.absent}'),capture),'EX_TYPESCRIPT');
  negative('raw JavaScript callbacks cannot replace declarative child structure', () => api.lowerDeclarative(source.replace('<ProductHeader product={model.product} />','{() => <ProductHeader product={model.product} />}'),capture));
  test('TypeScript errors from a .rmtx source map to the original URI and exact source range', () => {
    const bad = source.replace('images: model.product.images','images: model.product.missing');
    assert.throws(() => api.lowerDeclarative(bad,capture,'bad.rmtx'), error => error.code === 'EX_TYPESCRIPT' && error.typescriptCode === 2339
      && error.file.endsWith('bad.rmtx') && error.virtualFile.endsWith('bad.rmtx.tsx') && bad.slice(error.start,error.start+error.length) === 'missing');
  });
  // Isolated native-renderer proof only: the sidecar is not a new Maraca ABI.
  const { JSDOM } = require('jsdom');
  const { createRmtDomDescriptorRenderer } = await import(pathToFileURL(path.join(api.root,'xtendrmt/rmt-dom-descriptor-renderer.js')));
  const headerTraces = [];
  for (const variant of Object.values(variants)) {
    const dom = new JSDOM('<main></main>'), target = dom.window.document.querySelector('main'), renderer = createRmtDomDescriptorRenderer({documentTarget:dom.window.document});
    try {
      const node = variant.view.nodes[0], trace = [];
      for (const id of ['p1','<b>p2</b>']) {
        const snapshot = { product: { id } };
        const value = node.text.path.reduce((v,k) => v[k],snapshot[node.text.state]);
        renderer.commit({operation:'reconcile-children',target,descriptors:[{type:'element',tag:node.element,key:node.id,text:value}]});
        trace.push({tag:target.firstChild.tagName,text:target.textContent,html:target.innerHTML});
      }
      assert.equal(target.querySelector('b'),null); headerTraces.push(trace);
    } finally { renderer.dispose(); dom.window.close(); }
  }
  test('both closed native header sidecars render equal text through the actual shared renderer, including escaping', () => assert.deepEqual(headerTraces[0],headerTraces[1]));
  const sourceFiles = fs.readdirSync(__dirname).filter(name => /\.(?:cjs|tsx|rmtx|rmt|ts)$/.test(name)).map(name => 'development/rmtx-a06/syntax-comparison/'+name).concat([
    'development/rmtx-a06/two-host.contract.json','development/rmtx-a06/two-host.types.d.ts','development/rmtx-a06/two-host-reference.cjs',
    'tools/rmt-language/classic-compiler.js','tools/rmt-language/classic-parser.js','tools/rmt-language/vnext-compiler.js','xtend-maraca/index.js',
    'tools/xtensions/component-interface.js','tools/xtensions/component-interface-build.js','tools/xtensions/state-binding.js',
    'xtendrmt/rmt-dom-descriptor-renderer.js', ...capture.records.flatMap(record => [record.definition.entry.module,
      'development/rmtx-a06/providers/'+(record.definition.framework==='react'?'react':'vue')+'.interface.json'])
  ]);
  return {format:1,version:api.API_VERSION,stage:'A06-two-host-syntax-comparison',node:process.version,typescript:ts.version,passed:true,checks:observations.length,observations,
    parity:api.compareVariants(variants),sourceRangeNormalization:'Only range fields on source-map records with astPointer/corePointer are excluded; all semantic artifacts remain compared.',
    closedHeaderRendererTrace:headerTraces[0],nativeHeaderMountedByMaraca:false,sourceExecuted:false,productionFrontendImplemented:false,syntaxDecisionMade:false,acceptedForRelease:false,
    loweredClassicSource:a.classicSource,contracts:{declarative:a.contract,hybrid:b.contract},viewSidecar:a.view,
    sources:Object.fromEntries([...new Set(sourceFiles)].sort().map(file=>[file,api.hash(fs.readFileSync(path.join(api.root,file)))]))};
}
if(require.main===module)inspect().then(report=>{
  const text=JSON.stringify(report,null,2)+'\n',file=path.join(__dirname,'comparison-evidence.json');
  if(process.argv.includes('--write'))fs.writeFileSync(file,text);
  if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),text,'Comparison source or toolchain drift');
  console.log(JSON.stringify({passed:report.passed,checks:report.checks,node:report.node,parity:report.parity}));
}).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={inspect};
