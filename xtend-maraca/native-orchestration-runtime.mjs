// SPDX-License-Identifier: Apache-2.0
import lifecycle from '@ccslabs/xtend-compiler/xtensions/native-orchestration-lifecycle';
import scopes from '@ccslabs/xtend-compiler/xtensions/native-surface-scopes';
import {createMaracaNativeSurfaceGraph} from './native-surface-graph.mjs';
import {createMaracaPlanRuntime} from './plan-runtime.mjs';

export const NATIVE_ORCHESTRATION_RUNTIME_API_VERSION = '2.0.0';
const profile = Object.freeze({programSchema:'xtend.rmt.app-orchestration.v5',compositionArtifactSchema:'xtend.maraca.xtension-composition-artifact.v12',compositionPortSchema:'xtend.maraca.xtension-composition-port.v9',runtimeSchema:'xtend.maraca.plan-runtime.v16',bindingValidator:'validateOrchestratedStateBindingArtifact',registryFactory:'createXTensionOrchestratedStateRegistry',registryMarker:'XTENSION_ORCHESTRATED_STATE_BINDING_API_VERSION',registryVersion:'6.0.0',urlVersion:'5.0.0'});
const declarationTags = program => {
  const result = new Map();
  const walk = (node, owner = null) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {node.forEach(child=>walk(child,owner));return;}
    if (typeof node.surface === 'string') owner=node.surface;
    const tag=node.tag || node.component;
    if (owner && typeof tag === 'string' && tag.includes('-')) {if(!result.has(owner))result.set(owner,new Set());result.get(owner).add(tag);}
    for(const key of ['children','then','else','template','node','child','content','fallback','descriptors','nodes','slots'])walk(node[key],owner);
  };
  walk(program.render.root);return result;
};
function createNativeOrchestrationIntegration(program,hooks) {
  const plan=lifecycle.validateNativeOrchestrationLifecyclePlan(program), definitions=new Map(program.surfaces.map(row=>[row.id,row]));
  const tags=declarationTags(program), states=new Map(), last=new Map(), parked=new Map(), controlLifetimes=new Map(), history=[];
  const explicitHydrate=new Set(plan.operations.filter(row=>row.op==='hydrate').map(row=>row.ownerSurface));
  let disposed=false, materialization=null, lastGraphKey=null, lastGraphReport=null, working=false, pendingAuthorityRefresh=false, rendererRegistryCache=null, rendererRegistrySource=null;
  const platform=()=>hooks.platform(), snapshot=()=>platform().runtimes.state.snapshot();
  const modelStamp=value=>JSON.stringify({states:value.states,selectors:value.selectors||{}});
  const authority=()=>hooks.readAuthority();
  const records=()=>new Map((authority()?.surfaces||[]).map(row=>[String(row.id),row]));
  const visible=row=>row?.status==='open'&&!row.minimized&&!row.collapsed;
  const frame=value=>lifecycle.evaluateNativeOrchestrationLifecyclePlan(plan,value,scopes.materializeNativeSurfaceScopes(program,value));
  const defaultState=row=>({suspended:false,detached:false,disposed:false,hydrated:!explicitHydrate.has(row.surfaceId)});
  const state=row=>states.get(row.id)||defaultState(row);
  const rows=value=>frame(value).scopes.instances;
  function belongsTo(id,owner,list) {
    const index=new Map(list.map(row=>[row.id,row]));let current=id;const seen=new Set();
    while(current!=null&&!seen.has(current)){if(current===owner)return true;seen.add(current);current=index.get(current)?.parentId;}
    return false;
  }
  function eligible(row,list,prospective=false) {
    const current=records(), index=new Map(list.map(value=>[value.id,value]));let id=row.id;const seen=new Set();
    while(id&&!seen.has(id)) {seen.add(id);const record=current.get(id), scope=index.get(id);
      if(record?!visible(record):!(prospective&&!states.has(id)&&definitions.get(scope?.surfaceId)?.initialState!=='closed'))return false;
      id=scope?.parentId;
    }
    return true;
  }
  function mask(value,kind) {
    const evaluated=frame(value), list=evaluated.scopes.instances, restriction=Object.create(null), existing=new Set(platform().boundXTensions.map(row=>row.hostSurface));
    for(const row of list){const retained=[...existing].some(id=>belongsTo(id,row.id,list));let allowed=true,current=row.id,seen=new Set();
      while(current&&!seen.has(current)) {seen.add(current);const currentRow=list.find(item=>item.id===current);if(!currentRow)break;const phase=state(currentRow);
        if(phase.disposed||kind==='content'&&phase.detached)allowed=false;
        if(kind==='activity'&&(phase.suspended||phase.detached||!phase.hydrated))allowed=false;
        if(kind==='binding'&&!retained){
          const commands=evaluated.operations.filter(op=>op.surfaceId===current);
          const willHydrate=commands.some(op=>op.op==='hydrate'&&op.enabled)&&eligible(currentRow,list,true);
          if(phase.suspended||phase.detached||!phase.hydrated&&!willHydrate||commands.some(op=>op.enabled&&(op.op==='dispose'||op.op==='detach'||op.op==='suspend')))allowed=false;
        }
        current=currentRow.parentId;
      }
      const record=records().get(row.id);
      if(record&&['destroyed','destroying'].includes(record.status))allowed=false;
      if(kind==='activity'&&!eligible(row,list))allowed=false;
      if(kind==='content'&&!hooks.contentExists(row.id)&&!eligible(row,list,true))allowed=false;
      restriction[row.id]=allowed;
    }
    return lifecycle.nativeOrchestrationLifecycleAdmission(program,value,restriction);
  }
  function capture(){const current=authority();return{shellEpoch:hooks.shellEpoch(),version:current?.version,scopes:(current?.surfaces||[]).filter(row=>!['destroyed','destroying'].includes(row.status)).map(row=>({id:String(row.id),generation:row.generation,boundary:hooks.boundary(row.id),disposed:hooks.boundary(row.id).disposed,epoch:hooks.boundary(row.id).capture().epoch}))};}
  function authorityCurrent(lease){return!!lease&&!disposed&&lease.shellEpoch===hooks.shellEpoch()&&lease.version===authority()?.version;}
  function current(lease){if(!authorityCurrent(lease))return false;const currentRows=records();return lease.scopes.every(row=>currentRows.get(row.id)?.generation===row.generation&&row.boundary.disposed===row.disposed&&row.boundary.capture().epoch===row.epoch);}
  function synchronize(value){const before=capture(), activity=mask(value,'activity');for(const[id,allowed]of Object.entries(activity)){const boundary=hooks.boundary(id);if(!boundary.disposed)boundary.setActive(allowed,allowed?'orchestration-content-active':'orchestration-content-paused');}return authorityCurrent(before);}
  function scopeBindings(id,list){return platform().boundXTensions.filter(row=>belongsTo(row.hostSurface,id,list)||belongsTo(row.surface,id,list));}
  async function suspendBindings(id,list,reason){for(const row of scopeBindings(id,list)){const phase=row.instance.snapshot().phase;if(phase==='active')await row.instance.suspend(reason);}}
  async function resumeBindings(id,list,reason){const active=mask(snapshot(),'activity');for(const row of scopeBindings(id,list)){if(active[row.hostSurface]===false||active[row.surface]===false)continue;const phase=row.instance.snapshot().phase;if(phase==='suspended')await row.instance.resume(reason);}}
  async function disposeControl(record){if(record.retired)return;record.retired=true;record.controller.abort('native-control-retired');for(const value of record.disposers){if(typeof value==='function')await value();else await value.dispose();}}
  async function disposeControls(id){const values=controlLifetimes.get(id);controlLifetimes.delete(id);for(const value of values?.values()||[])await disposeControl(value);}
  function rememberControls(record,value){if(!value)return;if(Array.isArray(value)){value.forEach(child=>rememberControls(record,child));return;}if(typeof value==='function'||typeof value.dispose==='function')record.disposers.push(value);}
  function ownedControls(row,node){const selected=tags.get(row.surfaceId);return node&&selected?.size?[node,...node.querySelectorAll('*')].filter(target=>selected.has(target.localName)&&target.closest('[data-maraca-surface]')===node):[];}
  function controlsChanged(row,node,targets){const previous=controlLifetimes.get(row.id);return targets.some(target=>!previous?.has(target))||!!previous&&[...previous].some(([target,record])=>record.node!==node||!targets.includes(target));}
  function controlMount(row,list){let scope=row;const seen=new Set();while(scope&&!seen.has(scope.id)){seen.add(scope.id);const operation=plan.operations.find(op=>op.ownerSurface===scope.surfaceId&&op.op==='mount');if(operation)return{operationId:operation.id,op:'mount',lane:operation.lane};scope=list.find(entry=>entry.id===scope.parentId);}throw new TypeError('Implicit native controls require their owning compiled CSR Mount operation.');}
  async function retire(id,list,reason){const p=platform();for(const row of scopeBindings(id,list))p.retireXTension(row,reason);await Promise.all([...p.xtensionRetirements]);for(const row of list.filter(row=>belongsTo(row.id,id,list)))await disposeControls(row.id);}
  function rawNode(id){
    const direct=parked.get(id)?.node||platform().viewProjectionPort.resolveSurface(id);if(direct)return direct;
    for(const record of parked.values())for(const node of [record.node,...record.node.querySelectorAll('[data-maraca-surface]')])if(node.getAttribute('data-maraca-surface')===id)return node;
    return null;
  }
  function detachedWithin(id,list){return list.some(row=>state(row).detached&&belongsTo(id,row.id,list));}
  function destroyedWithin(id,list){const authority=records();return list.some(row=>belongsTo(id,row.id,list)&&(['destroyed','destroying'].includes(authority.get(row.id)?.status)||hooks.boundary(row.id).disposed));}
  function parkNodes(id,list){
    const p=platform(),candidates=list.filter(row=>belongsTo(row.id,id,list)&&!parked.has(row.id)).map(row=>({id:row.id,node:rawNode(row.id)})).filter(row=>row.node&&p.root.contains(row.node));
    const roots=candidates.filter(row=>!candidates.some(parent=>parent!==row&&parent.node.contains(row.node)));
    const entries=roots.map(row=>({...row,parent:row.node.parentNode,next:row.node.nextSibling,fragment:row.node.ownerDocument.createDocumentFragment(),detachedBy:id}));
    for(const record of entries){record.fragment.appendChild(record.node);parked.set(record.id,record);}
  }
  function reattachNodes(id){
    const p=platform(),entries=[...parked].filter(([,record])=>record.detachedBy===id);
    if(entries.some(([,record])=>!record.parent||!p.root.contains(record.parent)&&!entries.some(([,parent])=>parent.node.contains(record.parent))))return false;
    for(const[key,record]of entries.reverse()){record.parent.insertBefore(record.node,record.next?.parentNode===record.parent?record.next:null);parked.delete(key);}return true;
  }
  function clearNode(id,list=materialization?.instances||[]){
    const p=platform(),node=rawNode(id),owned=[...parked].filter(([key,record])=>key!==id&&(record.detachedBy===id||belongsTo(key,id,list)));
    for(const[key,record]of owned){parked.delete(key);p.runtimes.renderer.dispose(record.node);record.node.parentNode?.removeChild(record.node);}
    parked.delete(id);if(node){p.runtimes.renderer.dispose(node);node.parentNode?.removeChild(node);}p.reindexSurfaces();
  }
  function lease(row,list){const parent=row.parentId||null,boundary=hooks.boundary(parent),token=boundary.capture();return{...capture(),scopeId:row.id,generation:records().get(row.id)?.generation,boundary,token,model:modelStamp(snapshot())};}
  function leaseCurrent(value){return authorityCurrent(value)&&records().get(value.scopeId)?.generation===value.generation&&value.boundary.isCurrent(value.token)&&modelStamp(snapshot())===value.model;}
  async function schedule(op,row,list,execute){const token=lease(row,list);if(!leaseCurrent(token)||!eligible(row,list))return false;let accepted=false;
    await platform().scheduleWork(op.op,async context=>{if(!leaseCurrent(token)||!eligible(row,list))return;const result=await execute(token,context);if(result!==false&&leaseCurrent(token)){accepted=true;history.push({operationId:op.operationId,surfaceId:row.id,op:op.op,lane:op.lane,status:'completed'});if(history.length>256)history.shift();}},
      {operation:op.operationId,lane:op.lane,scope:row.id,surfaceId:row.id,source:'rmtx-orchestration'});
    return accepted;
  }
  async function ensureTags(selected,token){const unique=[...new Set(selected)];if(!unique.length)return true;const registry=platform().options.componentRegistry;
    if(typeof registry?.ensureTags!=='function')throw new TypeError('Source7 native controls require their real registry.ensureTags port before DOM creation.');
    await registry.ensureTags(unique);return!token||leaseCurrent(token);
  }
  async function prepareSurfaceMembership(value,metadata={}) {
    const evaluated=frame(value), key=modelStamp(value), p=platform();
    if(lastGraphKey===key&&lastGraphReport&&lastGraphReport.authority?.after===authority()?.version)return lastGraphReport;
    const previous=materialization?.instances||[], next=evaluated.scopes.instances, present=new Set(next.map(row=>row.id));
    const before=capture();
    for(const row of previous.filter(row=>!present.has(row.id))){await retire(row.id,previous,'surface-membership-left');if(!authorityCurrent(before)||modelStamp(snapshot())!==key)return {ok:false,status:'superseded'};clearNode(row.id,previous);states.delete(row.id);for(const op of plan.operations)last.delete(JSON.stringify([op.id,row.keys]));}
    const all=[...next];p.surfaces.splice(0,p.surfaces.length,...all.map(row=>({...definitions.get(row.surfaceId),id:row.id,parentId:row.parentId,repeat:null,key:null,source:null})));
    p.surfaceById.clear();p.presentationParents.clear();for(const row of p.surfaces){p.surfaceById.set(row.id,row);if(row.parentId)p.presentationParents.set(row.id,row.parentId);}
    materialization=evaluated.scopes;
    const report=p.runtimes.surfaceGraph.materializeInstances(evaluated.scopes,{...metadata,recordsBySource:{...value.states,...value.selectors}});
    if(report?.status==='superseded'||report?.ok===false)return report;
    for(const row of next)if(!states.has(row.id))states.set(row.id,defaultState(row));
    lastGraphKey=key;lastGraphReport=report;return report;
  }
  async function beforeCommit(value,metadata={}) {
    if(disposed)return false;const evaluated=frame(value), stamp=modelStamp(value);working=true;
    try{
      const report=await prepareSurfaceMembership(value,metadata);if(report?.status==='superseded'||report?.ok===false||modelStamp(snapshot())!==stamp)return false;
      const list=evaluated.scopes.instances,index=new Map(list.map(row=>[row.id,row]));
      for(const op of evaluated.operations)if(!op.enabled)last.set(op.id,false);
      const priority={prewarm:0,suspend:1,detach:2,dispose:3,recycle:4,reattach:5,resume:6,invalidate:7,hydrate:8};
      const commands=evaluated.operations.filter(op=>op.op!=='mount'&&op.op!=='hydrate'&&op.enabled&&last.get(op.id)!==true).sort((a,b)=>priority[a.op]-priority[b.op]);
      for(const op of commands){const row=index.get(op.surfaceId);if(!row||!eligible(row,list))continue;const phase=states.get(row.id);
        const accepted=await schedule(op,row,list,async(token)=>{
          if(op.op==='prewarm'){if(!await ensureTags([...(tags.get(row.surfaceId)||[])],token))return false;const p=platform(),foreign=p.bindingArtifact?.bindings.some(entry=>entry.ownerSurface===row.surfaceId||entry.surface===row.surfaceId);if(foreign&&typeof p.createXTensionHost?.prewarm!=='function')throw new TypeError('Prewarm requires the captured provider namespace prewarm port.');if(p.createXTensionHost?.prewarm)await p.createXTensionHost.prewarm({surfaceIds:[row.surfaceId],signal:token.boundary.signal,isCurrent:()=>leaseCurrent(token)});}
          else if(op.op==='suspend'){await suspendBindings(row.id,list,'rmtx-suspend');if(!leaseCurrent(token))return;phase.suspended=true;hooks.boundary(row.id).setActive(false,'rmtx-suspend');}
          else if(op.op==='resume'){phase.suspended=false;synchronize(value);await resumeBindings(row.id,list,'rmtx-resume');}
          else if(op.op==='detach'){await suspendBindings(row.id,list,'rmtx-detach');if(!leaseCurrent(token))return;phase.detached=true;parkNodes(row.id,list);hooks.boundary(row.id).setActive(false,'rmtx-detach');platform().reindexSurfaces();}
          else if(op.op==='reattach'){if(!reattachNodes(row.id))return false;phase.detached=false;platform().reindexSurfaces();synchronize(value);await resumeBindings(row.id,list,'rmtx-reattach');}
          else if(op.op==='dispose'||op.op==='recycle'){await retire(row.id,list,'rmtx-'+op.op);if(!leaseCurrent(token))return;hooks.boundary(row.id).invalidate('rmtx-'+op.op);clearNode(row.id,list);if(op.op==='dispose')phase.disposed=true;else{Object.assign(phase,defaultState(row));for(const other of evaluated.operations.filter(item=>item.surfaceId===row.id&&item.id!==op.id))last.delete(other.id);}}
          else if(op.op==='invalidate'){await suspendBindings(row.id,list,'rmtx-invalidate');await disposeControls(row.id);if(!leaseCurrent(token))return;hooks.boundary(row.id).invalidate('rmtx-invalidate');phase.hydrated=!explicitHydrate.has(row.surfaceId);for(const other of evaluated.operations.filter(item=>item.surfaceId===row.id&&item.op==='hydrate'))last.delete(other.id);synchronize(value);await resumeBindings(row.id,list,'rmtx-invalidate');}
        });
        if(accepted)last.set(op.id,true);else if(modelStamp(snapshot())!==stamp)return false;
      }
      const activeContent=mask(value,'content'), currentScopes=rows(value), registryTags=[];
      for(const row of currentScopes)if(activeContent[row.id]===false&&(!detachedWithin(row.id,currentScopes)||destroyedWithin(row.id,currentScopes))&&rawNode(row.id)){
        const destroyed=destroyedWithin(row.id,currentScopes),before=capture();
        if(destroyed)await retire(row.id,currentScopes,'surface-authority-ended');else await disposeControls(row.id);
        if(modelStamp(snapshot())!==stamp||!authorityCurrent(before))return false;
        if(destroyed)clearNode(row.id,currentScopes);
        state(row).hydrated=!explicitHydrate.has(row.surfaceId);for(const op of evaluated.operations.filter(op=>op.surfaceId===row.id&&op.op==='hydrate'))last.delete(op.id);
      }
      for(const row of currentScopes)if(activeContent[row.id]!==false&&eligible(row,currentScopes))registryTags.push(...(tags.get(row.surfaceId)||[]));
      const before=capture();await ensureTags(registryTags);if(!authorityCurrent(before)||modelStamp(snapshot())!==stamp)return false;
      return synchronize(value);
    }finally{working=false;}
  }
  async function hydrate(surfaceIds,metadata={}) {
    const value=snapshot(), evaluated=frame(value),list=evaluated.scopes.instances;
    for(const row of list){
      const declared=evaluated.operations.find(op=>op.surfaceId===row.id&&op.op==='hydrate');
      const pendingCommand=declared?.enabled&&last.get(declared.id)!==true;
      const node=rawNode(row.id),targets=ownedControls(row,node),pendingControls=controlsChanged(row,node,targets);
      if(!pendingCommand&&!pendingControls)continue;
      if(!eligible(row,list)||mask(value,'content')[row.id]===false||state(row).suspended||state(row).detached)continue;
      if(!pendingCommand&&!state(row).hydrated)continue;
      const op=pendingCommand?declared:controlMount(row,list);
      const accepted=await schedule(op,row,list,async(token)=>{const p=platform(),registry=p.options.componentRegistry;
        if(!node||!p.root.contains(node))return false;
        if(targets.length&&typeof registry?.hydrate!=='function')throw new TypeError('Source7 controls require their real scoped CSR hydrate port.');
        let table=controlLifetimes.get(row.id);
        if(!table){table=new Map();controlLifetimes.set(row.id,table);}
        for(const[target,record]of table)if(record.node!==node||!targets.includes(target)){table.delete(target);await disposeControl(record);if(!leaseCurrent(token))return false;}
        for(const target of targets){if(table.has(target))continue;
          const AbortPort=node.ownerDocument?.defaultView?.AbortController||AbortController;
          const record={node,controller:new AbortPort(),hydrating:true,retired:false,disposers:[]};table.set(target,record);
          const controlCurrent=()=>controlLifetimes.get(row.id)===table&&table.get(target)===record&&!record.controller.signal.aborted&&rawNode(row.id)===node&&p.root.contains(target)
            &&(record.hydrating?leaseCurrent(token):mask(snapshot(),'activity')[row.id]!==false);
          const result=await registry.hydrate(target,[target.localName],{...metadata,operation:op.operationId,targets:[target],ownerSurface:row.id,signal:record.controller.signal,isCurrent:controlCurrent,surfaces:[{id:row.id,boundary:hooks.boundary(row.id),signal:record.controller.signal,isCurrent:controlCurrent}]});
          rememberControls(record,result);if(!leaseCurrent(token)){await disposeControls(row.id);return false;}record.hydrating=false;
        }
        state(row).hydrated=true;synchronize(value);await resumeBindings(row.id,list,'rmtx-hydrate');
      });
      if(accepted&&pendingCommand)last.set(declared.id,true);
    }
    synchronize(value);platform().reconcileEvents(null);await platform().mountPresentXTensions();
  }
  function materializeSurfaces(value){if(lastGraphKey!==modelStamp(value)||!lastGraphReport)throw new Error('Source7 scopes require their actual Kernel pre-commit preparation.');return lastGraphReport;}
  function wrapEvents(factory,options) {
    let runtime=null,signature=null,closed=false,identity=0;
    const targets=new WeakMap();
    const targetIdentity=element=>{if(!element)return null;if(!targets.has(element))targets.set(element,++identity);return targets.get(element);};
    const refresh=()=>{
      if(closed)return runtime;
      const value=options.modelReader.snapshot(),activity=mask(value,'activity');
      const materialized=scopes.materializeNativeSurfaceEvents(program,value,activity),byId=new Map(materialized.scopes.map(row=>[row.eventId,row]));
      const attached=materialized.events.map(binding=>{const row=byId.get(binding.id),boundary=row&&hooks.boundary(row.surfaceId),element=options.targetResolver(binding,options.root);return[binding.id,boundary?.capture().epoch,targetIdentity(element)];});
      const next=JSON.stringify([materialized.events,attached]);
      if(signature!==next){
        runtime?.dispose();
        runtime=factory({...options,events:materialized.events,targetResolver(binding,target){
          const element=options.targetResolver(binding,target),scope=byId.get(binding.id);if(!element||!scope)return element;
          const boundary=hooks.boundary(scope.surfaceId),token=boundary.capture(),listeners=new Map();
          return new Proxy(element,{get(object,key){
            if(key==='addEventListener')return(name,callback,settings)=>{const wrapper=event=>{
              if(closed||!boundary.isCurrent(token)||!platform().root.contains(object)||mask(options.modelReader.snapshot(),'activity')[scope.surfaceId]===false)return;
              callback(scopes.scopeNativeEvent(event,scope.keys));
            };listeners.set(callback,wrapper);object.addEventListener(name,wrapper,settings);};
            if(key==='removeEventListener')return(name,callback,settings)=>object.removeEventListener(name,listeners.get(callback)||callback,settings);
            const result=Reflect.get(object,key,object);return typeof result==='function'?result.bind(object):result;
          }});
        }});
        signature=next;
      }
      return runtime;
    };
    refresh();
    return new Proxy({},{get(_target,key){if(key==='dispose')return()=>{closed=true;runtime?.dispose();};const value=refresh()[key];return typeof value==='function'?(...args)=>refresh()[key](...args):value;}});
  }
  return Object.freeze({admission:value=>mask(value,'content'),bindingAdmission:value=>mask(value,'binding'),canMount:entry=>mask(snapshot(),'activity')[entry.hostSurface]!==false,
    synchronize,capture,current,authorityCurrent,wrapEvents,beforeCommit,hydrate,materializeSurfaces,
    rendererRegistry(supplied){if(!rendererRegistryCache||rendererRegistrySource!==supplied){rendererRegistryCache=platform().options.nativeViewRuntimePort.createComponentRegistry(program,supplied);rendererRegistrySource=supplied;}return rendererRegistryCache;},
    allows(id,value){return id==null||mask(value,'content')[String(id)]!==false;},
    retains(id,value){return id==null||mask(value,'binding')[String(id)]!==false;},
    wrapSurfaceFactory:createSurfaceGraph=>options=>createMaracaNativeSurfaceGraph({...options,program,createSurfaceGraph}),
    authorityChanged(){if(working||pendingAuthorityRefresh||disposed)return;pendingAuthorityRefresh=true;queueMicrotask(()=>{pendingAuthorityRefresh=false;if(!disposed&&platform().phase()==='ready')platform().renderView({operation:'maraca.lifecycle.authority'}).catch(platform().onError);});},
    async dispose(){disposed=true;for(const id of controlLifetimes.keys())await disposeControls(id);for(const id of parked.keys())clearNode(id);},
    snapshot(){return{schema:'xtend.rmt.native-orchestration-runtime-state.v1',surfaces:[...states].map(([id,value])=>({id,...value})),operations:history.slice()};}});
}
const nativeLifecycleRuntimePort=Object.freeze({NATIVE_LIFECYCLE_RUNTIME_API_VERSION:'2.0.0',profile,createNativeLifecycleIntegration:createNativeOrchestrationIntegration});
export function createMaracaNativeOrchestrationRuntime(options={}) {
  const schema=options.plan&&Object.getOwnPropertyDescriptor(options.plan,'schema');
  if(!schema||!Object.hasOwn(schema,'value')||schema.value!=='xtend.maraca.build-plan.v11')throw new TypeError('The native orchestration entry requires its own data Plan11 schema.');
  return createMaracaPlanRuntime({...options,nativeLifecycleRuntimePort});
}
export default Object.freeze({NATIVE_ORCHESTRATION_RUNTIME_API_VERSION,createMaracaNativeOrchestrationRuntime});
