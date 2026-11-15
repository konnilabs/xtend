import { createTwoHostCase } from '../two-host-runtime.mjs';

// Acceptance v1.1: records every expectation, including missing lifecycle behavior.
// No additional DOM writer, Model writer, subscriber or source evaluator is used.
export async function runNativeHeaderAcceptance(options) {
  const checks = [], trace = [];
  const check = (name, passed, observed = null) => checks.push({name,passed:passed === true,observed});
  const fixture = () => createTwoHostCase(options);
  const f = fixture();
  try {
    await f.runtime.boot(); await f.idle();
    const header = f.root.querySelector('[data-rmtx-native-header="product-header"]');
    const owner = f.root.querySelector('[data-maraca-surface="product-details"]');
    const gallery = f.latest('product-gallery'), reviews = f.latest('product-reviews');
    const galleryNode = gallery.context.container.querySelector('select'), reviewsNode = reviews.context.container.querySelector('select');
    check('native header is mounted by the actual Maraca renderer within the declared owner',!!header && owner?.contains(header) && header.textContent === 'p1',header?.outerHTML);
    check('native header coexists with two real framework roots and native Kernel/Fabric admission',!!galleryNode && !!reviewsNode && f.kernel.listResources('a06-product-details').length === 2
      && f.hosts.every(entry=>f.fabric.getFibers().some(fiber=>fiber.phase==='mount' && fiber.lane===entry.definition.lane && fiber.metadata?.kernelJobId)));
    await f.runtime.dispatchCommand('product.rename',{imageId:'p2'}); await f.idle();
    check('a compiled rename Action updates the actual Model and native header', f.runtime.model.getState('product').id === 'p2' && header.textContent === 'p2');
    check('native update preserves the header and both framework DOM identities', f.root.querySelector('h1')===header && gallery.context.container.querySelector('select')===galleryNode && reviews.context.container.querySelector('select')===reviewsNode);
    const hostile = '<img src=x onerror="globalThis.__rmtxHeaderExecuted=true">';
    await f.runtime.dispatchCommand('product.rename',{imageId:hostile}); await f.idle();
    check('Model text is rendered as text, including markup-shaped input',header.textContent === hostile && !header.querySelector('img') && !options.document.defaultView.__rmtxHeaderExecuted,header.innerHTML);
    galleryNode.value='back';galleryNode.dispatchEvent(new options.document.defaultView.Event('change',{bubbles:true})); await f.idle();
    reviewsNode.value='rating';reviewsNode.dispatchEvent(new options.document.defaultView.Event('change',{bubbles:true})); await f.idle();
    check('actual React/Vue intents still reach Actions while preserving native header identity and value',f.runtime.model.getState('product').selectedImageId==='back' && f.runtime.model.getState('product').reviewsSort==='rating' && f.root.querySelector('h1')===header && header.textContent===hostile);
    const boundary = f.runtime.getSurfaceBoundary(options.lowered.ownerSurface);
    f.graph.closeSurface(options.lowered.ownerSurface); await f.idle();
    const style=options.document.defaultView.getComputedStyle(owner);
    const hidden=owner.hidden || style.display==='none' || style.visibility==='hidden';
    check('closing the owner invalidates native presentation admission',boundary.active===false);
    check('closing the owner hides its native view without a second view writer',hidden,{hidden:owner.hidden,display:style.display,visibility:style.visibility});
    check('closing the owner suspends both providers without detaching their roots',f.hosts.every(e=>e.host.snapshot().suspended) && gallery.context.container.querySelector('select')===galleryNode && reviews.context.container.querySelector('select')===reviewsNode);
    await f.runtime.dispatchCommand('product.rename',{imageId:'changed-while-closed'});await f.idle();
    check('Model updates while closed retain the hidden native owner and provider roots',owner.hidden && f.root.querySelector('h1')===header && header.textContent==='changed-while-closed' && gallery.context.container.querySelector('select')===galleryNode && reviews.context.container.querySelector('select')===reviewsNode);
    await f.graph.openSurface(options.lowered.ownerSurface);await f.idle();
    check('resume retains the native header and provider identities',boundary.active && f.root.querySelector('h1')===header && gallery.context.container.querySelector('select')===galleryNode && reviews.context.container.querySelector('select')===reviewsNode);
    trace.push({phase:'mounted-updated-resumed',text:header.textContent,selectedImageId:f.runtime.model.getState('product').selectedImageId,reviewsSort:f.runtime.model.getState('product').reviewsSort});
    f.runtime.dispose(); await f.runtime.whenXTensionsIdle();
    check('application runtime disposal clears the native header and releases both provider leases',!f.root.querySelector('h1') && f.kernel.listResources('a06-product-details').length===0);
    let refused=false; try{await f.runtime.dispatchCommand('product.rename',{imageId:'after-dispose'});}catch{refused=true;}
    check('disposed runtime rejects late native updates',refused && !f.root.querySelector('h1'));
  } finally {await f.close();}
  // A separate open owner is necessary: close-before-destroy would mask a stale
  // presentation boundary with the earlier close invalidation.
  const d=fixture();
  try {
    await d.runtime.boot();await d.idle();
    const header=d.root.querySelector('h1'),boundary=d.runtime.getSurfaceBoundary(options.lowered.ownerSurface);
    const token=boundary.capture(),signal=boundary.signal;
    check('destroy scenario captures a genuinely active native owner lifetime',boundary.active && boundary.isCurrent(token));
    d.graph.destroySurface(options.lowered.ownerSurface); await d.idle();
    const graphState=d.graph.getSnapshot().surfaces.find(s=>s.id===options.lowered.ownerSurface)?.state;
    check('destroy revokes both real provider resource leases',graphState==='destroyed' && d.kernel.listResources('a06-product-details').length===0 && d.hosts.every(e=>e.host.snapshot().disposed));
    check('destroy disposes the existing native presentation boundary',boundary.disposed && !boundary.active && signal.aborted,{disposed:boundary.disposed,active:boundary.active,signalAborted:signal.aborted});
    check('destroy removes the native header from its owner view',!header.isConnected,{headerConnected:header.isConnected,graphState});
    const previous=d.runtime.model.getState('product');let result,error;
    try{result=await d.runtime.dispatchCommand('product.rename',{imageId:'late-native-result'},{},{signal,isCurrent:()=>boundary.isCurrent(token)});await d.idle();}catch(e){error=String(e.message||e);}
    const current=d.runtime.model.getState('product');
    check('a command carrying the destroyed native owner lifetime is superseded before any Model or header write',result?.status==='superseded' && JSON.stringify(current)===JSON.stringify(previous) && header.textContent==='p1',
      {status:result?.status??null,error:error??null,modelId:current.id,headerText:header.textContent,oldLifetimeStillCurrent:boundary.isCurrent(token)});
    trace.push({phase:'destroyed-owner',graphState,disposed:boundary.disposed,oldLifetimeCurrent:boundary.isCurrent(token),modelId:current.id,headerConnected:header.isConnected,headerText:header.textContent});
    await d.runtime.dispatchCommand('product.rename',{imageId:'global-after-destroy'});await d.idle();
    check('an unscoped global Model update does not resurrect destroyed native or provider lifetimes',d.runtime.model.getState('product').id==='global-after-destroy' && !d.root.querySelector('h1') && d.kernel.listResources('a06-product-details').length===0 && d.graph.getSnapshot().surfaces.find(s=>s.id===options.lowered.ownerSurface)?.state==='destroyed');
    await d.graph.openSurface(options.lowered.ownerSurface,{recreate:true});
    await d.runtime.dispatchCommand('product.rename',{imageId:'explicitly-recreated'});await d.idle();
    const renewed=d.runtime.getSurfaceBoundary(options.lowered.ownerSurface);
    check('explicit recreate and a new view commit admit a new native owner generation',renewed!==boundary && renewed.active && d.root.querySelector('h1')?.textContent==='explicitly-recreated' && d.root.querySelector('h1')!==header && d.kernel.listResources('a06-product-details').length===2);
    const recreated=d.runtime.model.getState('product');
    const staleAgain=await d.runtime.dispatchCommand('product.rename',{imageId:'old-token-after-recreate'},{},{signal,isCurrent:()=>boundary.isCurrent(token)});await d.idle();
    check('recreation never revives the old generation token',staleAgain?.status==='superseded' && JSON.stringify(d.runtime.model.getState('product'))===JSON.stringify(recreated) && d.root.querySelector('h1')?.textContent==='explicitly-recreated');
    trace.push({phase:'recreated-owner',oldBoundaryDisposed:boundary.disposed,newBoundaryActive:renewed.active,oldLifetimeCurrent:boundary.isCurrent(token),modelId:d.runtime.model.getState('product').id,newHeaderConnected:d.root.querySelector('h1')?.isConnected,oldHeaderConnected:header.isConnected});
  } finally {await d.close();}
  return {format:1,version:'1.1.0',passed:checks.every(c=>c.passed),cases:checks.length,passedCases:checks.filter(c=>c.passed).length,failedCases:checks.filter(c=>!c.passed).length,checks,trace,
    actualMaracaRenderer:true,actualReactVueProviders:true,additionalDomWriter:false,additionalModelWriter:false,sourceExecuted:false,productionFrontendImplemented:false,acceptedForRelease:false};
}
