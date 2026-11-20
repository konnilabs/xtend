'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { createNativeDataLiteral } = require('../../xtend-maraca/native-data-literal');
test('Source8 data printer preserves complete JSON values and owns no decoder requirement', () => {
  const shared = { schema: 'a.long.immutable.schema.v1', sourceRef: 'an:exact:compiled:source:reference', fields: ['number', 'string', null, true, 7] };
  const input = { rows: Array.from({ length: 20 }, (_, index) => ({ id: index, declaration: shared, label: '\n</script>\u2028雪' })) };
  const source = createNativeDataLiteral(input), result = vm.runInNewContext('(' + source + ')');
  assert.equal(JSON.stringify(result), JSON.stringify(input));
  assert.ok(Buffer.byteLength(source) < Buffer.byteLength(JSON.stringify(input)) / 2);
  assert.ok(result.rows[0].declaration === result.rows[1].declaration, 'Only identical plain immutable subtrees are shared');
  assert.doesNotMatch(source, /eval|JSON\.parse|DecompressionStream/);
});
test('data printer retains own prototype-named JSON fields and rejects cycles', () => {
  const input = JSON.parse('{"__proto__":{"safe":true},"constructor":"data","array":[0,false,null,"$s0"]}');
  const result = vm.runInNewContext('(' + createNativeDataLiteral(input) + ')');
  assert.equal(JSON.stringify(result), JSON.stringify(input));
  assert.ok(Object.hasOwn(result, '__proto__'));
  const cycle = {}; cycle.self = cycle; assert.throws(() => createNativeDataLiteral(cycle), /circular/);
});

test('Source7 regular native-only emission boots without a companion and keeps equal JSON states independent', async () => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
  const {pathToFileURL} = require('node:url');
  const {JSDOM} = require('jsdom');
  const {buildMaracaBundle} = require('../../xtend-maraca');
  const {createXtendFabric} = require('../../fabric/xtend-fabric');
  const rootDir = path.resolve(__dirname,'../..'), temporary = fs.mkdtempSync(path.join(os.tmpdir(),'xtend-source7-literal-'));
  const initial = {nested:{value:1,description:'the same immutable initial state in both declarations'},labels:Array(12).fill('shared immutable data')};
  const source = `import {RMT,model,input} from '@ccslabs/xtend/rmt-language/rmtx';
    export default <RMT.Program id="literal.isolation">
      <RMT.State id="left" type="object" initial={${JSON.stringify(initial)}}/>
      <RMT.State id="right" type="object" initial={${JSON.stringify(initial)}}/>
      <RMT.Action id="change"><RMT.Input name="value" type="number"/><RMT.Reduce state="left" path="nested.value" value={input.value}/></RMT.Action>
      <RMT.Surface id="owner" component="section"><RMT.View>
        <RMT.Element tag="output" attributes={{id:'left'}}><RMT.Text value={model.left.nested.value}/></RMT.Element>
        <RMT.Element tag="output" attributes={{id:'right'}}><RMT.Text value={model.right.nested.value}/></RMT.Element>
      </RMT.View></RMT.Surface>
    </RMT.Program>`;
  let dom, entry, application;
  const saved = new Map(), json = value => JSON.stringify(value === undefined ? null : value);
  function frozen(value, seen = new Set()) {
    if (!value || typeof value !== 'object' || seen.has(value)) return true;
    seen.add(value); return Object.isFrozen(value) && Object.values(value).every(child=>frozen(child,seen));
  }
  try {
    const built = buildMaracaBundle({sourceText:source,filePath:'tests/maraca/literal-isolation.rmtx',out:path.join(temporary,'build'),
      rmtxSyntaxVersion:'7.0.0',profile:'production',orchestration:'strict',kernel:'strict',hydration:'off',validation:'off',transitions:'off',services:false,pwa:false,lazy:false},{rootDir});
    assert.equal(built.ok,true,built.status+JSON.stringify(built.plan.diagnostics));
    assert.equal(built.plan.schema,'xtend.maraca.build-plan.v11');
    assert.equal(built.plan.xtensionComposition,undefined);
    assert.equal(built.bundleReport.bundleFiles.some(file=>/^xtend\.xtensions-/u.test(file.fileName)),false);
    dom = new JSDOM('<!doctype html><main></main>',{pretendToBeVisual:true,url:'https://xtend.test/literal'});
    for (const key of ['window','document','Node','Element','HTMLElement','SVGElement','navigator','MutationObserver','Event','CustomEvent','customElements','getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) {
      saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
      Object.defineProperty(globalThis,key,{configurable:true,value:['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(key)?dom.window[key].bind(dom.window):dom.window[key]});
    }
    dom.window.__XTendMaracaDisableAutoBoot = true;
    dom.window.matchMedia ||= ()=>({matches:false,addEventListener(){},removeEventListener(){}});
    entry = await import(pathToFileURL(built.plan.outputs.entry).href);
    application = entry.createXtendMaraca();
    const program = entry.MARACA_ORCHESTRATION.artifact, before = json(program);
    assert.equal(program.schema,'xtend.rmt.app-orchestration.v5');
    assert.equal(program.render.nativeView.schema,'xtend.rmt.native-view.v2');
    assert.equal(before,json(built.plan.orchestration.artifact));
    assert.equal(json(application.config.orchestration.artifact),before);
    for (const [name,field] of [['MARACA_KERNEL','kernel'],['MARACA_HYDRATION','hydration'],['MARACA_VALIDATION','validation'],['MARACA_TRANSITIONS','transitions']])
      assert.equal(json(entry[name].artifact),json(built.plan[field].enabled?built.plan[field].artifact:null),field+' must preserve its complete compiled artifact');
    assert.equal(json(application.config.xtensionBindings),json(built.plan.xtensionBindings));
    assert.equal(frozen(program),true);
    const left = program.state.states.find(state=>state.id==='left'), right = program.state.states.find(state=>state.id==='right');
    assert.equal(json(left.initial),json(right.initial));
    assert.ok(left.initial===right.initial,'The actual emitted immutable data shares the equal initial subtree');
    const root = dom.window.document.querySelector('main'), fabric = createXtendFabric();
    await application.boot({root,fabric});
    assert.equal(root.querySelector('#left').textContent,'1');
    assert.equal(root.querySelector('#right').textContent,'1');
    await application.facade.dispatchCommand('change',{value:2});
    await application.facade.whenXTensionsIdle();
    assert.equal(application.facade.model.getState('left').nested.value,2);
    assert.deepEqual(application.facade.model.getState('right'),initial);
    assert.equal(root.querySelector('#left').textContent,'2');
    assert.equal(root.querySelector('#right').textContent,'1');
    assert.equal(json(program),before,'Model commands must not mutate the shared compiled Program');
    assert.equal(frozen(program),true);
  } finally {
    application?.dispose();
    await application?.facade.whenXTensionsIdle();
    entry?.disposeXtendMaraca();
    dom?.window.close();
    for (const [key,descriptor] of saved) if (descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key];
    fs.rmSync(temporary,{recursive:true,force:true});
  }
});
