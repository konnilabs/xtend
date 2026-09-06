import {createXScalerRemoteAdapterLoader, registerXScalerRemoteAdapter} from '@ccslabs/xtend/xscaler/remote-adapter-loader';
import {evaluateXScalerPreflight} from '@ccslabs/xtend/xscaler/protocol';
import {createHttpAppServiceTransport} from './app-services.mjs';

const read = (model, path) => String(path).split('.').reduce((value, key) => {
  if (['__proto__','prototype','constructor'].includes(key)) throw new Error('Unsafe remote binding path.');
  return value?.[key];
}, typeof model?.snapshot === 'function' ? model.snapshot().model : model);
const cancelled = () => new DOMException('Remote surface closed.', 'AbortError');
const signals = (...values) => AbortSignal.any(values.filter(Boolean));
const boundedSignal = (signal, milliseconds = 30000) => signals(signal, AbortSignal.timeout(milliseconds));
async function bounded(promise, milliseconds, onTimeout = () => {}) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => { onTimeout(); reject(new DOMException('Remote operation deadline exceeded.', 'TimeoutError')); }, milliseconds);
  })]); } finally { clearTimeout(timer); }
}

/** Bind a declared model request to a preflighted, root-scoped remote adapter. */
export function bindMaracaRemoteSurface({runtime, root, client, binding, window:win = window}) {
  let active = null, disposed = false, previousId = '', unsubscribe, generation = 0;
  const loader = createXScalerRemoteAdapterLoader({
    documentTarget:win.document, registrationTarget:win,
    allowInsecureLoopback:binding.allowInsecureLoopback === true,
    async preflight(input) {
      // Local policy is authoritative even if the provider returns a permissive report.
      const local = evaluateXScalerPreflight(input);
      if (!local.ok) return local;
      const response = await win.fetch(new URL(binding.preflightPath || '/preflight', binding.plan.origin), {
        method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},
        signal:boundedSignal(input.signal),body:JSON.stringify({request:input.request,remoteSurfacePlan:input.remoteSurfacePlan})
      });
      if (!response.ok) throw new Error('Remote preflight HTTP failure.');
      const result = await response.json();
      if (JSON.stringify(result.remoteSurfacePlan) !== JSON.stringify(local.remoteSurfacePlan)) throw new Error('Remote preflight changed the pinned surface plan.');
      return result;
    }
  });
  const publish = detail => win.dispatchEvent(new CustomEvent('xtend-maraca:remote-surface', {detail}));
  async function close(reason, deadline = performance.now() + 5000) {
    const record = active; if (!record) return;
    active = null; record.controller.abort(reason);
    const remaining = () => Math.max(1, deadline-performance.now());
    try { await bounded(loader.cancel(record.sessionId, reason), remaining()); }
    catch (error) { publish({surfaceId:binding.plan.surfaceId,status:'cleanup-failed',code:error.name}); }
    if (binding.cancelAction && !record.completing) {
      try {
        const result = await bounded(runtime.dispatchCommand(binding.cancelAction,{id:record.input.id}),remaining());
        if(result?.ok === false) throw new Error('Host cancellation failed.');
      }
      catch(error) { publish({surfaceId:binding.plan.surfaceId,status:'cleanup-failed',code:error.code || error.name}); }
    }
  }
  async function open(value, expectedGeneration) {
    await close('replaced');
    if (disposed || generation !== expectedGeneration) return;
    const target = root.querySelector(binding.slot);
    if (!target || !root.contains(target)) throw new Error('Remote surface slot is unavailable.');
    const controller = new AbortController();
    const record = {controller, input:value, sessionId:`${binding.plan.surfaceId}:${crypto.randomUUID()}`};
    active = record;
    try {
      const adapterUrl = new URL(binding.adapterUrl);adapterUrl.searchParams.set('xscaler-session',record.sessionId);
      const attached = await bounded(loader.attach({remoteSurfacePlan:binding.plan,adapterUrl:adapterUrl.href,
        sessionId:record.sessionId,hostCapabilities:{allowedOrigins:[binding.plan.origin],capabilities:binding.capabilities || []},
        hostContext:{root:target,applicationRoot:root},nonce:win.document.getElementById('xtend-page-data')?.nonce || ''}),30000,()=>{void loader.cancel(record.sessionId,'attach-timeout');});
      if (active !== record) return;
      publish({surfaceId:binding.plan.surfaceId,status:attached.status,atc:attached.atc});
      if (!attached.ok || attached.status !== 'attached') throw new Error('Remote surface could not be attached.');
      const result = await loader.invoke(record.sessionId, {serviceId:binding.serviceId,input:value,signal:controller.signal});
      if (active !== record || disposed) return;
      record.completing=true;
      const completed = await runtime.dispatchCommand(binding.completeAction, result);
      if (completed?.ok === false || completed?.status === 'failed' || completed?.status === 'error') throw new Error('Host completion was rejected.');
      if (active !== record || disposed) return;
      const destination = binding.resultUrl && read(runtime.model, binding.resultUrl);
      await bounded(loader.detach(record.sessionId, 'completed'),5000); active = null;
      if (destination) await client.visit(destination);
    } catch (error) {
      if (active !== record || disposed) return;
      await close('failed');
      if (binding.errorAction) await runtime.dispatchCommand(binding.errorAction, {message:binding.failureMessage || 'The remote operation could not be completed.'});
      publish({surfaceId:binding.plan.surfaceId,status:'failed',code:error.code || error.name});
    }
  }
  function update() {
    if (disposed) return;
    if (binding.openState && read(runtime.model,binding.openState) === false) { if(!active?.completing){generation++;void close('surface-closed');} return; }
    const value = read(runtime.model,binding.requestState);
    if (!value?.id || value.id === previousId) return;
    previousId = value.id;
    void open(value, ++generation).catch(error => publish({surfaceId:binding.plan.surfaceId,status:'failed',code:error.code || error.name}));
  }
  unsubscribe = runtime.subscribe(update);
  const stopOnNavigation = client.subscribe(event => { if (event.type === 'pending') {
    generation++;
    if (active && !active.completing && binding.closeAction) void runtime.dispatchCommand(binding.closeAction,{id:active.input.id}).catch(error=>publish({surfaceId:binding.plan.surfaceId,status:'cleanup-failed',code:error.code || error.name}));
    void close('navigation');
  } });
  update();
  return {snapshot:()=>loader.snapshot(), async dispose() {const deadline=performance.now()+5000;disposed=true;generation++;unsubscribe();stopOnNavigation();await close('disposed',deadline);await bounded(loader.dispose(),Math.max(1,deadline-performance.now()));}};
}

/** A Maraca composition owns only the supplied shadow-root slot. PHP sends data, never executable patches. */
export function createMaracaRemoteSurfaceAdapter(configuration) {
  const sessions = new Map();
  function entry(context) { const value=sessions.get(context.sessionId); if (!value) throw cancelled();return value; }
  async function dispose(context) {
    const value=sessions.get(context.sessionId); if(!value)return;
    sessions.delete(context.sessionId);value.controller.abort();value.unsubscribe?.();value.composition.dispose();value.transport.dispose();
    value.root.remove();
  }
  return {
    async attach(context) {
      const host=context.hostContext;
      if (!host?.root || !host.applicationRoot?.contains(host.root)) throw new Error('A bounded host slot is required.');
      const shadow=host.root.shadowRoot || host.root.attachShadow({mode:'open'});
      if (shadow.childElementCount) throw new Error('Remote slot already has an owner.');
      const root=host.root.ownerDocument.createElement('div');root.id=configuration.rootId;shadow.append(root);
      if(configuration.css){const sheet=new CSSStyleSheet();sheet.replaceSync(configuration.css);shadow.adoptedStyleSheets=[sheet];}
      const composition=configuration.createComposition();
      const controller=new AbortController();
      const transport=createHttpAppServiceTransport({baseUrl:configuration.origin,credentials:'omit',
        fetch:(url,options)=>fetch(url,{...options,signal:boundedSignal(signals(controller.signal,options.signal))})});
      sessions.set(context.sessionId,{root,composition,controller,transport,unsubscribe:null});
    },
    async invoke(request,context) {
      const record=entry(context), signal=signals(record.controller.signal,context.signal,request.signal);
      let phase='boot';
      try {
      let terminal=false, sequence=0;
      await record.composition.boot({root:record.root,initialState:{[configuration.inputState]:request.input},
        appServiceBaseUrl:configuration.origin,appServiceCredentials:'omit',
        appServiceFetch:(url,options)=>fetch(url,{...options,signal:boundedSignal(signals(signal,options.signal))}),
        appServiceHeaders:()=>({'Authorization':`Bearer ${request.input.capability}`})});
      const runtime=record.composition.facade;
      phase='stream';
      for await (const frame of record.transport.stream({serviceId:configuration.streamService,input:request.input,signal})) {
        signal.throwIfAborted();
        if (terminal || !Number.isInteger(frame.sequence) || frame.sequence <= sequence) throw new Error('Invalid remote stream order.');
        sequence=frame.sequence;
        if(frame.type==='error'||frame.type==='cancelled')throw new Error(frame.error?.message || 'Remote stream cancelled.');
        if(frame.type==='complete'){terminal=true;continue;}
        if(frame.type==='delta') {
          const value=frame.value;
          if(!value || value.target!==configuration.streamState || !value.value || typeof value.value!=='object')throw new Error('Remote patch attempted an undeclared state target.');
          const result=await runtime.dispatchStreamPatch({type:'complete',streamId:`${context.sessionId}:${sequence}`,target:configuration.streamState,value:value.value});
          if(!result.accepted)throw new Error('Remote state patch rejected.');
          record.root.dispatchEvent(new CustomEvent('xtend-maraca:remote-frame',{bubbles:true,composed:true,detail:{sequence,at:performance.now()}}));
        }
      }
      if(!terminal)throw new Error('Remote stream ended without a terminal frame.');
      phase='interaction';
      return await new Promise((resolve,reject)=>{
        const expiration=setTimeout(()=>finish(new DOMException('Payment attempt expired.','TimeoutError')),Math.max(0,request.input.expires*1000-Date.now()));
        const abort=()=>finish(cancelled());
        let settled=false;
        const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(expiration);signal.removeEventListener('abort',abort);record.unsubscribe?.();record.unsubscribe=null;error?reject(error):resolve(result);};
        function check(){
          const value=read(runtime.model,configuration.resultState);
          if(value?.proof)finish(null,{proof:value.proof});
          else if(read(runtime.model,configuration.cancelState))finish(cancelled());
          else if(read(runtime.model,configuration.errorState)?.status==='error')finish(new Error('Remote operation was rejected.'));
        }
        record.unsubscribe=runtime.subscribe(check);signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();else check();
      });
      } catch(error) {
        record.root.dispatchEvent(new CustomEvent('xtend-maraca:remote-diagnostic',{bubbles:true,composed:true,detail:{phase,code:error.code || error.name}}));
        throw error;
      }
    },
    cancel:dispose,detach:dispose,dispose
  };
}
export {registerXScalerRemoteAdapter};
