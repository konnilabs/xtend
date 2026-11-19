import {createScopedFixture} from '../scoped-fixture.mjs';
const check=(value,message)=>{if(!value)throw Error(message);};
const waitFor=async (predicate,describe=()=> '')=>{for(let i=0;i<300;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5));}throw Error('Orchestrated provider boundary was not reached. '+describe());};
export async function runOrchestratedRuntimeAcceptance(options){
 let peerLoads=0;const fixture=createScopedFixture({...options,peerWait:()=>{peerLoads++;}}),names=[];
 try{
  fixture.options.initialState={ui:{mount:false,hydrate:false,suspend:false,resume:false,invalidate:false,dispose:false,prewarm:true,recycle:false,detach:false,reattach:false}};
  await fixture.boot();
  check(peerLoads===2&&fixture.requests.length===2&&fixture.contexts.length===0&&fixture.hosts.length===0&&fixture.root.querySelectorAll('article').length===0,'Prewarm loads verified namespaces without invoking provider factories, allocating hosts or mounting DOM');
  names.push('real Composer Prewarm loads provider namespaces and shared peers without factory, host or DOM work');
  await fixture.app.facade.dispatchCommand('ui.replace',{ui:{...fixture.app.facade.model.getState('ui'),mount:true,hydrate:true,prewarm:false}});await fixture.idle();await waitFor(()=>fixture.contexts.length===4&&fixture.root.querySelectorAll('select').length===4,()=>JSON.stringify({contexts:fixture.contexts.length,owners:fixture.root.querySelectorAll('article').length,selects:fixture.root.querySelectorAll('select').length,hosts:fixture.hosts.map(row=>row.host.snapshot()),lifecycle:fixture.app.facade.snapshot().nativeLifecycle}));
  const app=fixture.app.facade,read=id=>structuredClone(app.model.getState(id));
  const ui=async patch=>{await app.dispatchCommand('ui.replace',{ui:{...read('ui'),...patch}});await fixture.idle();};
  const catalog=async items=>{await app.dispatchCommand('catalog.replace',{catalog:{items}});await fixture.idle();};
  const owners=()=>[...fixture.root.querySelectorAll('article')];
  const describe=()=>JSON.stringify({owners:owners().length,selects:fixture.root.querySelectorAll('select').length,contexts:fixture.contexts.length,lifecycle:app.snapshot().nativeLifecycle,controller:app.snapshot().surfaceController?.surfaces?.map(({id,status,generation})=>({id,status,generation}))});
  check(fixture.app.schema==='xtend.maraca.browser-composition-root.v13'&&app.snapshot().schema==='xtend.maraca.plan-runtime.v16','generated Browser13 must use Runtime16');
  const first=owners(),contexts=[...fixture.contexts],identities=contexts.map(c=>JSON.stringify(c.identity.address));
  check(first.length===2&&new Set(identities).size===4,'numeric and textual repeated owner/provider identities must differ');
  check(fixture.requests.every(row=>row.admitted)&&fixture.controllers.length>0,'provider loads must run through real Kernel/Fabric');
  names.push('productive Source7 builds and mounts independent typed native/React/Vue instances through Kernel/Fabric');
  for(const node of first){const header=node.querySelector('x-header');check(header.title===node.querySelector('h2')?.textContent,'captured inherited title property must pass the productive renderer capability boundary');const slot=header?.shadowRoot?.querySelector('slot[name="actions"]');check(slot?.assignedElements()[0]===header.querySelector('button'),'named slot must expose the immediate authored button');check(header.shadowRoot.querySelector('slot[name="title"]').assignedElements()[0]?.tagName==='H2','title must project without a wrapper');}
  names.push('shipped Shadow DOM control receives direct named slot elements');
  const original=read('catalog').items,selects=first.map(node=>[...node.querySelectorAll('select')]);
  await catalog([...original].reverse());check(owners()[0]===first[1]&&owners()[1]===first[0],'reorder must move the same native owner nodes');
  check(fixture.contexts.length===4&&first.every((node,i)=>[...node.querySelectorAll('select')].every((select,j)=>select===selects[i][j])),'reorder must retain provider instances and DOM');
  names.push('reordering stable typed keys preserves native and provider identity');
  first[0].dispatchEvent(new options.document.defaultView.CustomEvent('native-select',{bubbles:true,detail:{__rmtxScopedKeys:{k0:'forged'}}}));
  await waitFor(()=>app.model.getState('capture').kind==='native');check(app.model.getState('capture').productId===1,'native key comes from the trusted scope, never event detail');
  first[1].dispatchEvent(new options.document.defaultView.CustomEvent('native-select',{bubbles:true,detail:{__rmtxScopedKeys:{k0:1}}}));
  await waitFor(()=>app.model.getState('capture').productId==='1');
  names.push('native event key mapping preserves numeric/string types and rejects spoofed detail');
  const count=fixture.contexts.length;await ui({suspend:true});check(owners().includes(first[0])&&fixture.contexts.length===count,'Suspend must retain native and provider lifetimes');
  await ui({suspend:false,resume:true});check(fixture.contexts.length===count&&first[0].querySelector('select')===selects[0][0],'Resume must retain the same framework subtree');
  names.push('Suspend/Resume retain native and framework instances');
  const token=app.getSurfaceBoundary(first[0].getAttribute('data-maraca-surface')).capture();
  await ui({resume:false,detach:true});check(owners().length===0&&!first[0].isConnected,'Detach parks native roots');
  await ui({detach:false,reattach:true});check(owners().includes(first[0])&&first[0].querySelector('select')===selects[0][0]&&fixture.contexts.length===count,'Reattach returns the same native and foreign subtree');
  check(!app.getSurfaceBoundary(first[0].getAttribute('data-maraca-surface')).isCurrent(token),'detached work tokens remain retired');
  names.push('Detach/Reattach restore the same real native and framework DOM');
  const live=owners()[0],boundary=app.getSurfaceBoundary(live.getAttribute('data-maraca-surface')),before=boundary.capture();
  await ui({reattach:false,invalidate:true});check(owners().includes(live)&&!boundary.isCurrent(before),'Invalidate refreshes authority without recreating DOM');
  names.push('Invalidate advances the existing AbortBoundary and retains DOM');
  await ui({invalidate:false,dispose:true});check(owners().length===0,'Dispose retires all content');
  await ui({dispose:false});check(owners().length===0,'Mount true cannot revive terminal content');
  await ui({recycle:true});await waitFor(()=>owners().length===2&&fixture.root.querySelectorAll('select').length===4,describe);
  check(owners().every(node=>!first.includes(node))&&fixture.contexts.length===count+4,'Recycle creates fresh native/provider content');
  names.push('Dispose remains terminal until explicit Recycle recreates content');
  await ui({recycle:false});const beforeRemove=owners(),retired=fixture.contexts.findLast(c=>c.identity.address.declarationId==='product-gallery'&&c.identity.address.keys[0]===1);
  await catalog(original.filter(row=>row.id!==1));check(owners().length===1&&!beforeRemove.find(node=>node.textContent.includes('Numeric'))?.isConnected,'removed keys retire native owners');
  const capture=JSON.stringify(read('capture'));await retired.onEvent({ok:true,direction:'upstream',event:'selectImage',payloadSchema:retired.events.selectImage,payload:{imageId:'back'},source:{hostId:retired.hostId,surfaceId:retired.surfaceId,xtensionId:retired.xtensionId}});await fixture.idle();check(JSON.stringify(read('capture'))===capture,'retired provider cannot write Model');
  await catalog(original);await waitFor(()=>owners().length===2&&fixture.root.querySelectorAll('select').length===4,describe);
  check(owners().some(node=>!beforeRemove.includes(node)),'reintroduced key gets a fresh real lifetime');
  names.push('repeat removal and reentry retire stale providers before creating fresh lifetimes');
  return{passed:true,cases:names.length,names,realReactVueProviders:true,kernelFabricVerified:true,stableTypedAddressesVerified:true,slotsVerified:true,controllerAuthorityVerified:true,staleProviderIntentVerified:true};
 }finally{await fixture.close();}
}
