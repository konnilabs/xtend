import {createPageClient} from '/runtime/page-client.mjs';
import {createPageForm,createNodePageValidator,createPrecognitionValidator} from '/runtime/page-form.mjs';
import '/runtime/xrouter.js';

const checks = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); checks.push(message); };
const wait = async predicate => { const deadline=Date.now()+8000; while (!predicate()) { if(Date.now()>deadline) throw new Error('Browser state deadline exceeded.'); await new Promise(resolve=>setTimeout(resolve,20)); } };
const initialPage = JSON.parse(document.getElementById('xtend-page-data').textContent);
let downloaded, requests=0;
const verify=async(canonical,integrity)=>{
  const key=await crypto.subtle.importKey('jwk',initialPage.shared.resumePublicKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  const signature=Uint8Array.from(atob(integrity.signature.replace(/-/g,'+').replace(/_/g,'/')),character=>character.charCodeAt(0));
  return {verified:await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,signature,new TextEncoder().encode(canonical))};
};
const client = createPageClient({initialPage,window,encryptHistory:true,resume:{verify},pages:{Known:initialPage.renderArtifact},transition:async update=>{if(document.startViewTransition)await document.startViewTransition(update).updateCallbackDone;else await update();},fetch:(...args)=>{requests++;return fetch(...args);},onDownload:result=>{downloaded=result;}});
window.pageClient = client;
try {
  if(initialPage.ssr?.executionMode==='server_prerender_resume') {
    const root=document.getElementById('xtend-page'),heading=root.querySelector('h1');let resumed;
    client.subscribe(event=>{if(event.type==='resume')resumed=event.result;});
    await client.start();
    assert(resumed?.status==='resumed' && resumed.verified,'signed page resumes with a real ECDSA signature');
    assert(document.getElementById('xtend-page')===root && root.querySelector('h1')===heading,'resume preserves the server DOM and page root');
    const tampered=structuredClone(initialPage);tampered.ssr.resume.integrity.signature='AAAA';let fallback;
    const rejected=createPageClient({initialPage:tampered,window,resume:{verify},links:false});rejected.subscribe(event=>{if(event.type==='resume')fallback=event.result;});
    await rejected.start();assert(fallback?.status==='fallback_hydrated' && !fallback.verified,'tampered page signature falls back through hydration');rejected.dispose();
  } else {
  assert(document.querySelector('h1')?.textContent === 'Login', 'initial HTML is rendered before client startup');
  await client.start();
  const router=document.createElement('x-router');router.setAttribute('mode','history');router.pageClient=client;document.body.append(router);
  await wait(()=>router.hasAttribute('data-xrouter-ready'));
  assert(document.querySelector('h1')?.textContent==='Login' && !router.shadowRoot.textContent.includes('404'), 'attached router preserves the initial SSR page');
  const login = createPageForm({client,defaults:{name:'Alice'},errorBag:'login'});
  await login.submit('/login');
  assert(client.page.page === 'Orders', 'login redirect resolves an authenticated page');
  await wait(()=>client.page.props.statistics === 'Deferred ready');
  assert(client.page.props.statistics === 'Deferred ready', 'deferred data loads after navigation');
  const beforePoll=requests,stopPoll=client.poll(25,{only:['title']});await wait(()=>requests>=beforePoll+2);stopPoll();
  assert(requests>=beforePoll+2,'polling uses selective host data requests');
  const beforeVisible=requests;client.whenVisible(document.querySelector('h1'),{only:['title']});await wait(()=>requests>beforeVisible);
  assert(requests>beforeVisible,'visibility triggers a selective host reload');
  let pending=false;const stopPending=client.subscribe(event=>{if(event.type==='pending')pending=true;});
  await client.visit('/orders',{instant:'Known',placeholder:{title:'Loading'},transition:true});stopPending();
  assert(pending && client.page.page==='Orders','instant placeholder resolves through the authorized host with an optional view transition');
  const layout = document.getElementById('persistent-layout');
  const retained = document.getElementById('layout-input'); retained.value = 'Keep layout input';
  router.navigate('/orders?filter=active');await wait(()=>client.page.url==='/orders?filter=active');
  assert(document.getElementById('persistent-layout') === layout && document.getElementById('layout-input').value === 'Keep layout input', 'declared layout preserves DOM identity and user input');
  assert(document.querySelectorAll('[data-order]').length === 1, 'filter produces matching server and browser list');
  await client.visit('/orders/export');
  assert(downloaded?.filename === 'orders.csv' && (await downloaded.blob.text()).includes('Active order') && client.page.page === 'Orders', 'host download preserves the current page and consumes the streamed file');
  await client.prefetch('/orders/1');
  await client.visit('/orders/1');
  assert(client.page.page === 'Detail' && document.title === 'Order detail', 'prefetched detail navigation updates the page and head');
  assert(document.querySelectorAll('meta[name="description"]').length === 1, 'SSR and browser metadata are deduplicated');
  const validator=(initialPage.shared.testHost==='laravel' ? createPrecognitionValidator : createNodePageValidator)({csrfToken:()=>client.page.csrfToken});
  const form = createPageForm({client,errorBag:'edit',defaults:{name:'x'},validate:validator});
  await form.validate('/orders/1',['name']);
  assert(Boolean(form.state.errors.name),'live validation returns field errors through the host provider');
  const element = document.querySelector('form'); form.bind(element,{action:'/orders/1'});
  await form.submit('/orders/1');
  assert(!form.state.success && Boolean(form.state.errors.name) && form.state.values.name === 'x', 'validation error stays with its form and preserves input');
  assert(document.activeElement?.name === 'name', 'server validation focuses the invalid native control');
  form.set('name','Updated order'); form.set('attachment',new File(['upload contents'],'receipt.txt',{type:'text/plain'}));
  await form.submit('/orders/1');
  assert(form.state.success && client.page.flash.success === 'Saved receipt.txt', 'multipart upload follows host redirect and flash lifecycle');
  assert(form.state.progress?.percentage === 100, 'multipart transport reports upload progress');
  client.remember('edit',{name:'Safe',password:'secret',token:'secret',attachment:new File(['x'],'x')});
  assert(!JSON.stringify(client.remember('edit')).includes('secret'), 'history excludes passwords, tokens and files');
  await client.visit('/orders');
  history.back(); await wait(()=>client.page.page === 'Detail');
  assert(client.page.url === '/orders/1', 'back navigation restores the host page');
  assert(!router.shadowRoot.textContent.includes('404'), 'router and page client do not compete on back navigation');
  await client.visit('/orders/1');
  let mismatch=false; const unsubscribe=client.subscribe(event=>{if(event.type==='version')mismatch=true;});
  await fetch('/test/version',{method:'POST'});
  await client.reload({only:['title']});
  assert(mismatch && client.page.page === 'Detail', 'background deployment mismatch preserves current page');
  await fetch('/test/version',{method:'DELETE'}); unsubscribe();
  const before=client.page.contextKey; await createPageForm({client}).submit('/logout');
  assert(client.page.page==='Login' && client.page.contextKey!==before && client.remember('edit')===null, 'logout invalidates remembered user state');
  form.dispose(); login.dispose(); router.remove();
  }
  window.__XTEND_PAGE_BROWSER__ = {status:'passed',ok:true,checks};
} catch (error) { window.__XTEND_PAGE_BROWSER__ = {status:'failed',ok:false,checks,error:error.stack}; }
finally { client.dispose(); }
