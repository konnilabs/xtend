'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parseRmtxSource}=require('../../tools/rmt-language/rmtx-parser');
const {compileRmtxSource}=require('../../tools/rmt-language/rmtx-compiler');
const {getRmtxOperatorProfile}=require('../../tools/rmt-language/rmtx-operator-profiles');
const {lowerRmtxNativeOrchestrationViews}=require('../../tools/rmt-language/rmtx-native-view');
const metadata=require('../../tools/rmt-language/rmtx-native-components');
const options={syntaxVersion:'7.0.0'};
const source=body=>`import {RMT,model,item,input,selectors} from '@ccslabs/xtend/rmt-language/rmtx';
export default <RMT.Program id="native.orchestration">
<RMT.State id="rows" type="collection" initial={[{id:1,title:'Numeric',show:true,children:[{id:'a',title:'A'}]},{id:'1',title:'Text',show:true,children:[]}]}/>
<RMT.State id="ui" type="object" initial={{enabled:true,title:'Title',selected:null}}/>
<RMT.Action id="select"><RMT.Input name="rowId" type="json"/><RMT.Reduce state="ui" path="selected" value={input.rowId}/></RMT.Action>
${body}</RMT.Program>`;
const owner=children=>`<RMT.Surface id="owner"><RMT.View>${children}</RMT.View></RMT.Surface>`;
const accept=(text,opts=options)=>{const result=parseRmtxSource(text,opts);assert.equal(result.ok,true,JSON.stringify(result.diagnostics));return result;};
const reject=(text,opts=options)=>{const result=parseRmtxSource(text,opts);assert.equal(result.ok,false);assert.equal(result.ast,null);return result;};
const compile=text=>{const result=compileRmtxSource(text,options);assert.equal(result.ok,true,JSON.stringify(result.diagnostics));return result;};

test('Source7 is explicit and preserves the closed Source6 operator catalog',()=>{
 const older=getRmtxOperatorProfile('6.0.0'),current=getRmtxOperatorProfile('7.0.0');
 assert.equal(older.apiVersion,'5.0.0');assert.equal(older.schema,'xtend.rmtx.operator-profile.v5');
 assert.equal(current.apiVersion,'6.0.0');assert.equal(current.schema,'xtend.rmtx.operator-profile.v6');
 assert.equal(older.operators.Component,undefined);assert.ok(current.operators.Component);
 reject(source(owner('<RMT.Component tag="x-button"/>')),{syntaxVersion:'6.0.0'});
 reject(source('<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="row"><RMT.View><RMT.Text value={item.title}/></RMT.View></RMT.Surface></RMT.Repeat>'),{syntaxVersion:'6.0.0'});
});

test('Source7 captures all ten own-Surface lifecycle commands with exact repeat and lane context',()=>{
 const operations=['Mount','Hydrate','Suspend','Resume','Invalidate','Dispose','Prewarm','Recycle','Detach','Reattach'];
 const text=source(`<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="row" present={item.show}><RMT.Lane name="idle">${operations.map(op=>`<RMT.${op} target="row" when={item.show}/>`).join('')}</RMT.Lane><RMT.View><RMT.Text value={item.title}/></RMT.View></RMT.Surface></RMT.Repeat>`);
 const parsed=accept(text);assert.equal(parsed.nativeLifecycle.schema,'xtend.rmtx.native-lifecycle.v2');
 assert.deepEqual(parsed.nativeLifecycle.operations.map(row=>row.op),operations.map(op=>op.toLowerCase()));
 for(const row of parsed.nativeLifecycle.operations){assert.equal(row.lane,'idle');assert.deepEqual(row.repeat,parsed.nativeView.views[0].repeat);assert.deepEqual(row.when.path,[{repeat:0},'show']);}
 reject(source('<RMT.Surface id="owner"><RMT.View/><RMT.Lane name="visible"><RMT.Mount target="owner"/><RMT.Mount target="owner"/></RMT.Lane></RMT.Surface>'));
 reject(source('<RMT.Surface id="owner"><RMT.View/><RMT.Lane name="visible"><RMT.Hydrate target="owner"><RMT.Policy/></RMT.Hydrate></RMT.Lane></RMT.Surface>'));
 const defaultGuard=accept(source('<RMT.Surface id="owner"><RMT.View/><RMT.Lane name="visible"><RMT.Mount target="owner"/></RMT.Lane></RMT.Surface>'));
 assert.deepEqual(defaultGuard.nativeLifecycle.operations[0].when,{kind:'literal',value:true});
});

test('Native Surface repeats share one Header2 authority and extend stable typed item scopes',()=>{
 const text=source(`<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="row" present={item.show}><RMT.View><RMT.Text value={item.title}/></RMT.View><RMT.On event="select" action="select" payload={{}} keys={{rowId:0}}/><RMT.Repeat from={item.children} keyBy={item.id}><RMT.Surface id="child"><RMT.View><RMT.Text value={item.title}/></RMT.View></RMT.Surface></RMT.Repeat></RMT.Surface></RMT.Repeat>`);
 const parsed=accept(text),native=lowerRmtxNativeOrchestrationViews(parsed.nativeView);
 assert.equal(native.contract.schema,'xtend.rmt.native-view.v2');
 assert.deepEqual(native.contract.scopes,parsed.nativeView.scopes);assert.equal(parsed.nativeView.scopes[1].parent,'row');
 assert.equal(parsed.nativeView.scopes[1].placement,'nested');assert.equal(parsed.nativeView.views[1].repeat.length,2);
 assert.deepEqual(parsed.nativeView.eventKeys[0].fields,{rowId:0});
 assert.deepEqual(parsed.nativeView.views[1].children[0].value.path,[{repeat:0},'children',{repeat:1},'title']);
 reject(text.replace('keys={{rowId:0}}','keys={{rowId:1}}'));
 reject(text.replace('payload={{}} keys={{rowId:0}}','payload={{rowId:"detail.__rmtxScopedKeys.k0"}}'));
 reject(text.replace('<RMT.Text value={item.title}/>','<RMT.Element tag="div" attributes={{id:"duplicate"}}/>'));
});

test('Public controls capture shipped metadata; named/default slots remain explicit native nodes',()=>{
 const parsed=accept(source(owner(`<RMT.Component tag="x-header" attributes={{title:model.ui.title}}><RMT.Slot name="title"><RMT.Text value={model.ui.title}/></RMT.Slot><RMT.Slot name="actions"><RMT.Element tag="button"><RMT.Text value="First"/></RMT.Element><RMT.Component tag="x-button"><RMT.Text value="Second"/></RMT.Component></RMT.Slot></RMT.Component>`)));
 assert.deepEqual(parsed.nativeView.components.map(row=>row.tag),['x-button','x-header']);
 const nodes=lowerRmtxNativeOrchestrationViews(parsed.nativeView).surfaces.get('owner');
 assert.equal(nodes[0].type,'native-component');assert.deepEqual(nodes[0].slots.map(row=>row.name),['title','actions']);
 assert.deepEqual(nodes[0].slots[1].children.map(row=>row.tag),['button','x-button']);
 assert.deepEqual(nodes[0].slots[1].children[1].slots.map(row=>row.name),['default']);
 assert.equal(nodes[0].slots[1].children[0].attributes?.slot,undefined);
 for(const markup of ['<RMT.Component tag="custom-control"/>','<RMT.Component tag="x-header"><RMT.Text value="implicit"/></RMT.Component>','<RMT.Slot name="title"/>','<RMT.Component tag="x-header"><RMT.Slot name="made-up"/></RMT.Component>','<RMT.Component tag="x-header"><RMT.Slot name="title"/><RMT.Slot name="title"/></RMT.Component>'])reject(source(owner(markup)));
 for(const name of ['slot','style','onclick','innerHTML','outerHTML','textContent','children','srcdoc','__proto__','constructor','data-rmt-surface'])reject(source(owner(`<RMT.Component tag="x-button" attributes={{${JSON.stringify(name)}:'unsafe'}}/>`)));
 reject(source(owner('<RMT.Component tag="x-button" properties={{value:1}}/>')));
 reject(source(owner('<RMT.Element tag="span" attributes={{slot:"title"}}/>')));
});

test('Captured metadata cannot be supplied or widened by a callsite and empty captures need no library lookup',()=>{
 const captured=metadata.getRmtxNativeComponent('x-header');assert.equal(captured.ownership,'shadow');assert.ok(captured.slots.includes('actions'));
 assert.equal(Object.isFrozen(captured),true);assert.deepEqual(metadata.verifyNativeComponentSources([]),[]);
 assert.equal(metadata.verifyNativeComponentSources([captured],{rootDir:path.resolve(__dirname,'../..')})[0].sha256,captured.sha256);
 assert.throws(()=>metadata.validateRmtxNativeComponents([{...captured,attributes:[...captured.attributes,'onclick']}]));
 assert.throws(()=>metadata.validateRmtxNativeComponents([{...captured,slots:[...captured.slots,'injected']}]));
 assert.throws(()=>metadata.validateRmtxNativeComponents([{...captured,sha256:'0'.repeat(64)}]));
 assert.equal(fs.readFileSync(path.resolve(__dirname,'../../components/xheader.js'),'utf8').includes('attachShadow'),true);
});

test('Source7 allows nested native shell scopes and keeps provider roots exclusive',()=>{
 const parsed=accept(source('<RMT.Surface id="shell"><RMT.Surface id="owner"><RMT.View><RMT.Text value="Child"/></RMT.View></RMT.Surface></RMT.Surface>'));
 assert.deepEqual(parsed.nativeView.scopes,[{surface:'owner',parent:'shell',placement:'nested'}]);
 reject(source('<RMT.Surface id="provider"><RMT.XTension id="extension" provider="react-test" owner="outer" lane="visible" props={{}} intents={{}}/><RMT.Surface id="owner"><RMT.View/></RMT.Surface></RMT.Surface>'));
});

test('Complete Source7 backend emits Program5, Header2, plan2 and trusted native event-key joins',()=>{
 const result=compile(source('<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="row"><RMT.Lane name="visible"><RMT.Mount target="row" when={item.show}/><RMT.Suspend target="row" when={!item.show}/></RMT.Lane><RMT.View><RMT.Component tag="x-button"><RMT.Text value={item.title}/></RMT.Component></RMT.View><RMT.On event="select" action="select" payload={{}} keys={{rowId:0}}/></RMT.Surface></RMT.Repeat>'));
 const program=result.orchestrationArtifacts;assert.equal(program.schema,'xtend.rmt.app-orchestration.v5');assert.equal(program.render.nativeView.schema,'xtend.rmt.native-view.v2');
 assert.equal(program.lifecycle.schema,'xtend.rmt.native-lifecycle-plan.v2');assert.equal(program.render.nativeView.eventKeys.length,1);
 assert.equal(program.render.nativeView.eventKeys[0].event,program.events[0].id);assert.equal(result.parserResult.actionProfile.version,'4.0.0');
 assert.equal(result.parserResult.viewProfile.version,'7.0.0');assert.equal(result.parserResult.components.schema,'xtend.rmtx.components.v3');
});

test('Public component field whitelists retain global sink and raw slot defenses',()=>{
 for(const sink of ['innerHTML','outerHTML','srcdoc','textContent','children','style','slot','onchange','data-rmt-surface','data-maraca-surface','constructor','prototype','__proto__']){
  for(const field of ['attributes','properties'])reject(source(owner(`<RMT.Component tag="x-button" ${field}={{"${sink}":"blocked"}}/>`)));
 }
 reject(source(owner('<RMT.Element tag="button" attributes={{slot:"actions"}}/>')));
 reject(source(owner('<RMT.Component tag="x-button" attributes={{label:{nested:true}}}/>')));
 reject(source(owner('<RMT.Component tag="x-button" attributes={{unknown:"value"}}/>')));
 reject(source(owner('<RMT.Component tag="x-button" properties={{value:()=>"escape"}}/>')));
});

test('Captured component source bytes and realpath containment are checked before build execution',()=>{
 const os=require('node:os'),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-rmtx-native-metadata-'));
 const captured=metadata.getRmtxNativeComponent('x-header');
 try{
  fs.mkdirSync(path.join(temporary,'components'));fs.writeFileSync(path.join(temporary,'package.json'),JSON.stringify({name:'@ccslabs/xtend'}));
  fs.writeFileSync(path.join(temporary,'components/manifest.json'),JSON.stringify({'x-header':'./xheader.js'}));
  fs.writeFileSync(path.join(temporary,captured.module),'throw Error("never executed");');
  assert.throws(()=>metadata.verifyNativeComponentSources([captured],{rootDir:temporary}),/bytes/);
  fs.unlinkSync(path.join(temporary,captured.module));fs.symlinkSync(path.resolve(__dirname,'../../components/xheader.js'),path.join(temporary,captured.module));
  assert.throws(()=>metadata.verifyNativeComponentSources([captured],{rootDir:temporary}),/bytes/);
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});

test('Shipped x-header receives direct native slotted elements in source order without universal wrappers',async()=>{
 const {JSDOM}=require('jsdom'),esbuild=require('esbuild');
 const dom=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://xtend.test/'});
 let renderer;
 try{
  dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  const controls=await esbuild.build({stdin:{contents:"import './components/xheader.js';import './components/xbutton.js';",resolveDir:path.resolve(__dirname,'../..')},bundle:true,write:false,format:'iife',platform:'browser',logLevel:'silent'});
  dom.window.eval(controls.outputFiles[0].text);
  const runtime=await esbuild.build({entryPoints:[path.resolve(__dirname,'../../xtendrmt/rmt-dom-descriptor-renderer.js')],bundle:true,write:false,format:'iife',globalName:'RmtRenderer',platform:'browser',logLevel:'silent'});
  dom.window.eval(runtime.outputFiles[0].text);
  const program=compile(source(owner('<RMT.Component tag="x-header"><RMT.Slot name="title"><RMT.Text value={model.ui.title}/></RMT.Slot><RMT.Slot name="actions"><RMT.Element tag="button" attributes={{"data-test":"first"}}><RMT.Text value="First"/></RMT.Element><RMT.Component tag="x-button"><RMT.Text value="Second"/></RMT.Component></RMT.Slot></RMT.Component>'))).orchestrationArtifacts;
  const snapshot={states:Object.fromEntries(program.state.states.map(row=>[row.id,row.initial])),selectors:{}};
  const descriptor=require('../../tools/xtensions/native-surface-projection').materializeNativeSurfaceView(program,snapshot);
  renderer=dom.window.RmtRenderer.createRmtDomDescriptorRenderer({documentTarget:dom.window.document});
  renderer.commit({operation:'replace-children',target:dom.window.document.querySelector('main'),descriptor});
  const header=dom.window.document.querySelector('x-header'),actions=header.shadowRoot.querySelector('slot[name="actions"]');
  assert.deepEqual(Array.from(actions.assignedElements(),node=>node.localName),['button','x-button']);
  assert.equal(actions.assignedElements()[0].textContent,'First');assert.equal(actions.assignedElements()[1].textContent,'Second');
  const title=header.shadowRoot.querySelector('slot[name="title"]');assert.deepEqual(Array.from(title.assignedElements(),node=>node.localName),['span']);assert.equal(title.assignedElements()[0].textContent,'Title');
  snapshot.states.ui={...snapshot.states.ui,title:'Updated'};
  const before=Array.from(actions.assignedElements());renderer.commit({operation:'replace-children',target:dom.window.document.querySelector('main'),descriptor:require('../../tools/xtensions/native-surface-projection').materializeNativeSurfaceView(program,snapshot)});
  const updated=dom.window.document.querySelector('x-header');assert.equal(updated.shadowRoot.querySelector('slot[name="title"]').assignedElements()[0].textContent,'Updated');
  assert.equal(before.length,2);
  const literal='<img src=x onerror="window.__rmtxUnsafe=true">';
  const safe=compile(source(owner('<RMT.Component tag="x-header" attributes={{title:model.ui.title}}/><RMT.Component tag="x-button" attributes={{label:model.ui.title,text:model.ui.title,disabled:true}}/>'))).orchestrationArtifacts;
  const safeSnapshot={states:Object.fromEntries(safe.state.states.map(row=>[row.id,row.initial])),selectors:{}};safeSnapshot.states.ui={...safeSnapshot.states.ui,title:literal};
  renderer.commit({operation:'replace-children',target:dom.window.document.querySelector('main'),descriptor:require('../../tools/xtensions/native-surface-projection').materializeNativeSurfaceView(safe,safeSnapshot)});
  const safeHeader=dom.window.document.querySelector('x-header'),safeButton=dom.window.document.querySelector('x-button');
  assert.equal(safeHeader.shadowRoot.querySelector('.title-fallback').textContent,literal);assert.equal(safeButton.shadowRoot.querySelector('.fallback-label').textContent,literal);
  assert.equal(safeHeader.shadowRoot.querySelectorAll('img').length,0);assert.equal(safeButton.shadowRoot.querySelectorAll('img').length,0);assert.equal(safeButton.shadowRoot.querySelector('button').disabled,true);assert.equal(dom.window.__rmtxUnsafe,undefined);
 }finally{renderer?.dispose?.();dom.window.close();}
});

test('Lexical nested native Surfaces lower to legal flat Classic AST1 with Header2 parent authority',()=>{
 const result=compile(source('<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="row"><RMT.View><RMT.Text value={item.title}/></RMT.View><RMT.Surface id="child"><RMT.View><RMT.Text value={item.title}/></RMT.View></RMT.Surface></RMT.Surface></RMT.Repeat>'));
 const surfaces=result.parserResult.ast.body[0].body.filter(row=>row.type==='RmtSurfaceDeclaration');
 assert.deepEqual(surfaces.map(row=>row.name),['row','child']);assert.equal(surfaces[0].body.some(row=>row.type==='RmtSurfaceDeclaration'),false);
 assert.deepEqual(require('../../tools/rmt-language/classic-ast-contract').validateRmtClassicAst(result.parserResult.ast),[]);
 assert.equal(result.orchestrationArtifacts.render.nativeView.scopes.find(row=>row.surface==='child').parent,'row');
});

test('Source7 CSR lifecycle commands never infer legacy SSR resume or duplicate hydration work',()=>{
 const operations=['Mount','Hydrate','Suspend','Resume','Invalidate','Dispose','Prewarm','Recycle','Detach','Reattach'];
 const result=compile(source(`<RMT.Surface id="owner"><RMT.View><RMT.Text value="Content"/></RMT.View><RMT.Lane name="visible">${operations.map(op=>`<RMT.${op} target="owner"/>`).join('')}</RMT.Lane></RMT.Surface>`));
 assert.equal(result.orchestrationArtifacts.lifecycle.operations.length,10);
 assert.equal(result.orchestrationArtifacts.hydration.records.length,0);
 assert.equal(result.orchestrationArtifacts.hydration.diagnostics.some(row=>row.code==='rmt.app_orchestration.resumability_policy_incomplete'),false);
});


test('Source7 native Views without authored Mount desugar a real CSR default through AST1, source-map and Kernel',()=>{
 const result=compile(source(owner('<RMT.Text value="Automatic"/>'))),program=result.orchestrationArtifacts;
 const operation=program.lifecycle.operations.find(row=>row.ownerSurface==='owner'&&row.op==='mount');
 assert.ok(operation);assert.equal(operation.lane,'visible');assert.deepEqual(operation.when,{kind:'literal',value:true});
 const resolve=pointer=>pointer.slice(1).split('/').reduce((value,key)=>value[key],result.parserResult.ast);
 const statement=resolve(operation.astPointer);assert.equal(statement.type,'RmtLifecycleStatement');assert.equal(statement.op,'mount');assert.equal(statement.target.value,'owner');
 assert.deepEqual(require('../../tools/rmt-language/classic-ast-contract').validateRmtClassicAst(result.parserResult.ast),[]);
 const mappings=result.coreDocument.sourceMap.filter(row=>row.astPointer===operation.astPointer&&row.nodeType==='RmtLifecycleStatement');
 assert.equal(mappings.length,1);assert.equal(mappings[0].id,'src:'+operation.id);
 const coreOperation=result.coreDocument.operations.find(row=>row.id===operation.id);assert.equal(coreOperation.op,'mount');assert.equal(coreOperation.target.ref,'owner');
 const fibers=program.kernel.records.fibers.filter(row=>row.operation===operation.id);assert.equal(fibers.length,1);assert.equal(fibers[0].op,'mount');assert.equal(fibers[0].lane,coreOperation.scope.lane);
 assert.equal(program.hydration.records.length,0,'The default is a CSR Mount, not an SSR hydration record');
});

test('Source7 default Mount keeps nested typed repeat scopes and preserves explicit false admission',()=>{
 const text=source('<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="row"><RMT.View><RMT.Text value={item.title}/></RMT.View><RMT.Repeat from={item.children} keyBy={item.id}><RMT.Surface id="child"><RMT.View><RMT.Text value={item.title}/></RMT.View></RMT.Surface></RMT.Repeat></RMT.Surface></RMT.Repeat>');
 const result=compile(text),operations=result.orchestrationArtifacts.lifecycle.operations;
 assert.equal(operations.length,2);assert.deepEqual(operations.map(row=>row.repeat.length),[1,2]);
 for(const row of operations){assert.equal(row.op,'mount');assert.equal(row.ownerSurface,row.target);assert.deepEqual(row.repeat,result.parserResult.nativeView.views.find(view=>view.surface===row.ownerSurface).repeat);}
 const guarded=compile(source('<RMT.Surface id="owner"><RMT.View/><RMT.Lane name="idle"><RMT.Mount target="owner" when={false}/></RMT.Lane></RMT.Surface>'));
 assert.equal(guarded.orchestrationArtifacts.lifecycle.operations.length,1);assert.equal(guarded.orchestrationArtifacts.lifecycle.operations[0].lane,'idle');assert.deepEqual(guarded.orchestrationArtifacts.lifecycle.operations[0].when,{kind:'literal',value:false});
 const reuse=compile(source('<RMT.Surface id="owner"><RMT.View/><RMT.Lane name="visible"><RMT.Hydrate target="owner" when={true}/></RMT.Lane></RMT.Surface>'));
 const lanes=reuse.parserResult.ast.body[0].body.find(row=>row.type==='RmtSurfaceDeclaration').body.filter(row=>row.type==='RmtLaneDeclaration');assert.equal(lanes.length,1);assert.deepEqual(lanes[0].body.map(row=>row.op),['hydrate','mount']);
 for(const version of ['5.0.0','6.0.0']){const retained=compileRmtxSource(source(owner('<RMT.Text value="Automatic"/>')),{syntaxVersion:version});assert.equal(retained.ok,true,JSON.stringify(retained.diagnostics));assert.equal(retained.coreDocument.operations.length,0);}
});


test('Source7 public control capture excludes existing light-DOM writers and authored host/slot portals',()=>{
 for(const tag of ['x-code','x-menu','x-modal','x-lightbox','x-spinner']){
  assert.throws(()=>metadata.getRmtxNativeComponent(tag),/captured|public|supported|Unknown/i);
  const result=compileRmtxSource(source(owner(`<RMT.Component tag="${tag}"/>`)),options);
  assert.equal(result.ok,false,tag+' requires its own ownership contract');assert.equal(result.orchestrationArtifacts,null);assert.equal(result.coreDocument,null);
 }
 assert.ok(metadata.getRmtxNativeComponent('x-header'));assert.ok(metadata.getRmtxNativeComponent('x-button'));
});


test('Source7 component capability capture is an exact reviewed subset with no inherited/data/ARIA fallthrough',()=>{
 assert.deepEqual(metadata.getRmtxNativeComponentCatalog().components.map(row=>row.tag),['x-button','x-header']);
 const header=metadata.getRmtxNativeComponent('x-header'),button=metadata.getRmtxNativeComponent('x-button');
 assert.deepEqual(header.attributes,['title']);assert.deepEqual(button.attributes,['disabled','label','text']);
 for(const value of [header,button])assert.deepEqual(value.properties,['title']);
 for(const tag of ['x-input','x-form','x-hero','x-radio','x-masonry','x-side-panel','x-tooltip','x-writer','x-alert','x-dialog','x-cards','x-tabs'])reject(source(owner(`<RMT.Component tag="${tag}"/>`)));
 for(const [tag,attribute]of [['x-button','data-label'],['x-button','aria-label'],['x-button','variant'],['x-header','src'],['x-header','menu-modal'],['x-header','menu-mode'],['x-header','class'],['x-header','data-custom'],['x-header','aria-label']])reject(source(owner(`<RMT.Component tag="${tag}" attributes={{"${attribute}":"outside"}}/>`)));
 for(const tag of ['x-button','x-header']){
  reject(source(owner(`<RMT.Component tag="${tag}" properties={{hidden:true}}/>`)));
  const result=compile(source(owner(`<RMT.Component tag="${tag}" properties={{title:model.ui.title}}/>`)));assert.equal(result.ok,true);
 }
 assert.throws(()=>metadata.validateRmtxNativeComponents([{...button,attributes:[...button.attributes,'data-label']}]));
 const contract=require('../../tools/xtensions/native-component-contract');
 assert.equal(contract.nativeComponentSinkAllowed(button,'data-label','attribute'),false);assert.equal(contract.nativeComponentSinkAllowed(header,'aria-label','attribute'),false);
 assert.equal(contract.nativeComponentSinkAllowed(header,'hidden','property'),false);assert.equal(contract.nativeComponentSinkAllowed(header,'title','property'),true);
});


test('a default native Header cannot clear another body modality lease while legacy modal Headers retain their own behavior',async()=>{
 const {JSDOM}=require('jsdom'),esbuild=require('esbuild');const dom=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://xtend.test/',pretendToBeVisual:true});
 try{
  dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  const bundled=await esbuild.build({stdin:{contents:"import './components/xheader.js';",resolveDir:path.resolve(__dirname,'../..')},bundle:true,write:false,format:'iife',platform:'browser',logLevel:'silent'});dom.window.eval(bundled.outputFiles[0].text);
  const document=dom.window.document,key='xtendHeaderMenuModal';document.body.dataset[key]='x-header';
  const defaultHeader=document.createElement('x-header');defaultHeader.setAttribute('title','Source7');assert.equal(document.body.dataset[key],'x-header','A detached default Header has never acquired the foreign body marker');
  document.querySelector('main').append(defaultHeader);assert.equal(document.body.dataset[key],'x-header');defaultHeader.remove();assert.equal(document.body.dataset[key],'x-header','Disconnect cannot clear a marker owned by somebody else');delete document.body.dataset[key];
  const first=document.createElement('x-header');first.id='first-legacy-id';first.setAttribute('menu-mode','fullscreen');first.setAttribute('menu-open','');document.body.append(first);assert.equal(document.body.dataset[key],'first-legacy-id');
  const second=document.createElement('x-header');second.id='second-legacy-id';second.setAttribute('menu-mode','fullscreen');second.setAttribute('menu-open','');document.body.append(second);assert.equal(document.body.dataset[key],'second-legacy-id');
  const sameToken=document.createElement('x-header');sameToken.id=second.id;sameToken._applyMenuModality(false);assert.equal(document.body.dataset[key],'second-legacy-id','Matching ID text cannot authorize a detached default Header to clear the active lease');
  first.toggleMenu(false,{focus:false});assert.equal(document.body.dataset[key],'second-legacy-id','Closing another Header cannot clear the second Header lease');
  second.toggleMenu(false,{focus:false});assert.equal(Object.hasOwn(document.body.dataset,key),false,'The actual modal lease owner can close its own marker');
  second.toggleMenu(true,{focus:false});assert.equal(document.body.dataset[key],'second-legacy-id');document.body.dataset[key]='external-replacement';second.toggleMenu(false,{focus:false});assert.equal(document.body.dataset[key],'external-replacement','A later external body marker is not owned by the old lease');
  first.remove();second.remove();assert.equal(document.body.dataset[key],'external-replacement');
 }finally{dom.window.close();}
});
