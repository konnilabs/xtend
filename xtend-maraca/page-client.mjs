import {createPageClient} from '@ccslabs/xtend/rmt/page-client';
import {pageError} from '@ccslabs/xtend/rmt/page-contract';
import {projectPortableRender} from '@ccslabs/xtend/rmt/portable-render';
import {bindMaracaRemoteSurface} from './remote-surface.mjs';

/** Page transport and history compose with one Maraca model/DOM owner. */
export function createMaracaPageClient(options) {
  const win = options.window || window;
  const root = options.root || win.document.getElementById('xtend-page');
  let composition = null, entry = null, context = null, version = null, sequence = 0, disposed = false;
  const load = options.loadBundle || (url => import(url));
  let client;
  let previousProps = {};
  let remoteBindings = [];
  let activation = Promise.resolve(), activationVersion = 0;
  function queueActivation(page, initial = false, view = {}) {
    const expected = ++activationVersion;
    const isCurrent = () => !disposed && expected === activationVersion && (!view.isCurrent || view.isCurrent());
    const operation = activation.catch(() => {}).then(() => isCurrent() ? activate(page, initial, {...view,isCurrent}) : {});
    activation = operation;
    return operation;
  }
  async function activate(page, initial = false, view = {}) {
    const isCurrent = () => !disposed && (!view.isCurrent || view.isCurrent());
    if (disposed) throw pageError('maraca.page_disposed','The page runtime is disposed.');
    const url = new URL(page.maraca?.entry || '', win.location.origin);
    if (!page.maraca?.entry || url.origin !== win.location.origin) throw pageError('maraca.page_bundle','Pages require a same-origin Maraca bundle.');
    const same = composition && entry === url.href && context === page.contextKey && version === page.version;
    const props = {...page.shared, ...page.props};
    if (same) {
      for (const name of page.renderArtifact.inputs) if (Object.prototype.hasOwnProperty.call(props, name) && JSON.stringify(props[name]) !== JSON.stringify(previousProps[name])) {
        if (!isCurrent()) return {};
        const result = await composition.facade.dispatchStreamPatch({type:'complete', streamId:`page:${++sequence}:${name}`, target:name, value:props[name]});
        if (!result.accepted) throw pageError('maraca.page_projection','The page input update was rejected.');
        // Track every committed input even if a newer navigation interrupts the
        // remaining inputs, so that returning to the prior page restores them.
        previousProps = {...previousProps,[name]:props[name]};
      }
      previousProps = props;
      return {};
    }
    const bundle = await load(url.href);
    if (!isCurrent()) return {};
    if (typeof bundle.createXtendMaraca !== 'function') throw pageError('maraca.page_bundle','The bundle does not expose a composition factory.');
    await Promise.all(remoteBindings.map(binding=>binding.dispose())); remoteBindings=[];
    if (!isCurrent()) return {};
    composition?.dispose('Page context replaced.'); composition = null;
    composition = bundle.createXtendMaraca({windowTarget:win, documentTarget:win.document});
    entry = url.href; context = page.contextKey; version = page.version;
    const model = projectPortableRender(page.renderArtifact, props).model;
    const result = await composition.boot({
      ...options.maraca, root, initialState:model, ssrResponse:initial ? page.ssr : null,
      adoptExisting:initial, verifyResumeEnvelope:options.resume?.verifyResumeEnvelope || options.resume?.verify,
      intentQueue:options.intentQueue || [],
      appServiceHeaders:() => ({'X-CSRF-TOKEN':client.page.csrfToken || '', ...(options.serviceHeaders?.() || {})}),
      navigationAdapter:{navigate:url=>client.visit(typeof url === 'string' ? url : url.url)},
    });
    if (!isCurrent()) { composition?.dispose('Page activation superseded.'); composition=null;return {}; }
    previousProps = props;
    remoteBindings = (options.remoteSurfaces || []).map(binding=>bindMaracaRemoteSurface({runtime:composition.facade,root,client,binding,window:win}));
    return result;
  }
  client = createPageClient({...options, forms:options.forms ?? true, root, activateInitial:page=>queueActivation(page,true), render:(page,view)=>queueActivation(page,false,view)});
  client.subscribe(event=>{
    if(event.type==='pending' && composition && options.navigationAction) void composition.facade.dispatchCommand(options.navigationAction,{url:event.url}).catch(error=>win.dispatchEvent(new CustomEvent('xtend-page:error',{detail:{code:error.code || error.name}})));
  });
  const dispose = client.dispose.bind(client);
  return Object.assign(client, {
    getRuntime:()=>composition?.facade || null,
    dispose() { disposed=true;activationVersion++;remoteBindings.forEach(binding=>void binding.dispose().catch(error=>win.dispatchEvent(new CustomEvent('xtend-maraca:remote-surface',{detail:{status:'cleanup-failed',code:error.code || error.name}}))));remoteBindings=[]; composition?.dispose('Page client disposed.'); composition=null; dispose(); }
  });
}
