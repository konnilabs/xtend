const scenario=arguments[0];
const paymentScenario=['declined','timeout'].includes(scenario)?scenario:'success';
const root=document.getElementById('xtend-page'),header=document.getElementById('store-header');
const checks=[],frames=[],remote=[],started=performance.now();
const diagnostics=[];
window.addEventListener('xtend-maraca:remote-diagnostic',event=>diagnostics.push(event.detail));
const assert=(condition,message)=>{if(!condition)throw new Error(message);checks.push(message);};
const tab=(element,shiftKey=false)=>{const event=new KeyboardEvent('keydown',{key:'Tab',shiftKey,bubbles:true,composed:true,cancelable:true});element.dispatchEvent(event);return event.defaultPrevented;};
const wait=async(predicate,label,timeout=15000)=>{const deadline=Date.now()+timeout;while(!predicate()){if(Date.now()>=deadline)throw new Error(label+' timed out');await new Promise(resolve=>setTimeout(resolve,50));}};
window.addEventListener('xtend-maraca:remote-surface',event=>remote.push({status:event.detail.status,code:event.detail.code,atc:event.detail.atc?.handoffSignal}));
window.addEventListener('xtend-maraca:remote-frame',event=>frames.push({...event.detail,sections:document.querySelector('#remote-payment-slot')?.shadowRoot?.querySelectorAll('[data-payment-section]').length}));
(async()=>{try{
 await wait(()=>window.XTendPage,'Activation');const client=window.XTendPage,runtime=client.getRuntime();
 const state=()=>runtime.model.snapshot().states;
 assert(root.getAttribute('data-rmt-resume-status')==='resumed','Cryptographically verified resume without fallback');
 const resumeMs=performance.now()-started;
 document.getElementById('store-search').value='Kopfhörer';document.querySelector('form[role=search]').requestSubmit();
 await wait(()=>client.page.props['shop.data'].catalog?.filters.q==='Kopfhörer'&&client.page.props['shop.data'].view==='results','Native GET search navigation');
 assert(document.getElementById('store-header')===header,'Native search keeps the resumed shell');
 await client.visit('/suche?q=Kopfhörer&category=technik&available=1&sort=price-asc');
 assert(client.page.props['shop.data'].catalog.products.length===1,'Search, category and availability filters');
 if(innerWidth<680){
  document.getElementById('open-filters').click();await wait(()=>document.getElementById('filter-drawer').open,'Mobile filter drawer');
  const filters=document.querySelector('#filter-drawer form');filters.querySelector('[name=sort]').value='price-desc';filters.requestSubmit();
  await wait(()=>client.page.props['shop.data'].catalog?.filters.sort==='price-desc'&&state()['shop.filterDrawer'].open===false,'Mobile filter navigation');
  assert(document.getElementById('store-header')===header,'Mobile filters preserve the shell and release the drawer');
 }
 await client.visit('/produkt/nova-studio-kopfhoerer?sku=TEC-01-2');
 assert(document.querySelector('.variant-chip[aria-current=true]')||client.page.props['shop.data'].product.sku==='TEC-01-2','Variant selection');
 document.getElementById('add-cart').click();await wait(()=>state()['shop.data'].cart.count===1,'Cart add');
 assert(document.getElementById('store-header')===header&&document.getElementById('xtend-page')===root,'DOM identity survives navigation and cart action');
 assert(client.getRuntime()===runtime,'One persistent Maraca controller');
 const stale=await fetch('/cart/add',{method:'POST',body:new URLSearchParams({_token:client.page.csrfToken,sku:'TEC-01-2',quantity:'1',version:'0'})});
 assert(stale.status===409,'A stale tab revision cannot apply another cart mutation');
 await client.reload({only:['shop.data']});assert(state()['shop.data'].cart.count===1&&state()['shop.data'].cart.version===1,'Reload reconciles the authoritative cart without duplicate quantities');
 const miniTrigger=document.getElementById('open-mini-cart');miniTrigger.focus();miniTrigger.click();
 await wait(()=>state()['shop.miniCart'].open===true&&document.getElementById('mini-cart').open===true,'Mini cart opening');
 await wait(()=>document.activeElement===document.getElementById('mini-cart'),'Mini cart focus');
 assert(document.querySelector('#mini-cart .mini-cart-line'),'Persistent mini cart receives current cart data');
 const miniClose=document.getElementById('mini-cart').shadowRoot.querySelector('.close');miniClose.focus();
 assert(!tab(miniClose),'Drawer Tab navigation reaches the slotted cart controls');
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(()=>state()['shop.miniCart'].open===false,'Mini cart close event');
 assert(document.activeElement===miniTrigger,'Drawer Escape restores keyboard focus');

 await client.visit('/checkout');assert(state()['shop.data'].cart.count===1,'Laravel persisted cart');
 document.getElementById('next-contact').click();await new Promise(resolve=>setTimeout(resolve,200));
 assert(state()['shop.checkout'].stage==='contact','RMT validation blocks invalid contact data');
 assert(document.activeElement?.id==='checkout-name','Invalid form focuses its first native field');
 for(const [field,value] of Object.entries({name:'Mara Muster',email:'mara@example.test',street:'Demostraße 12',postal:'10115',city:'Berlin'})){
  const input=document.getElementById('checkout-'+field);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));
 }
 const postal=document.getElementById('checkout-postal');postal.value='abcde';postal.dispatchEvent(new Event('input',{bubbles:true}));
 await new Promise(resolve=>setTimeout(resolve,250));document.getElementById('next-contact').click();
 await wait(()=>state()['shop.actionStatus'].status==='error'&&postal.getAttribute('aria-invalid')==='true','Laravel postal validation');
 assert(state()['shop.checkout'].stage==='contact'&&document.activeElement===postal,'Laravel validation returns to the matching RMT field without advancing');
 postal.value='10115';postal.dispatchEvent(new Event('input',{bubbles:true}));
 await new Promise(resolve=>setTimeout(resolve,250));document.getElementById('next-contact').click();await wait(()=>state()['shop.checkout'].stage==='shipping'&&document.getElementById('next-shipping')?.getClientRects().length,'Contact validation');
 document.getElementById('next-shipping').click();await wait(()=>state()['shop.checkout'].stage==='review'&&document.getElementById('payment-scenario')?.getClientRects().length,'Shipping step');
 assert(!document.getElementById('checkout-name')&&state()['shop.name'].value==='Mara Muster','Inactive input controls are released while their values remain in the kernel');
 assert(!JSON.stringify(history.state).includes('mara@example.test')&&!location.href.includes('Demostra'), 'Private checkout data stays out of history and URLs');
 const selector=document.getElementById('payment-scenario');selector.value=paymentScenario;selector.dispatchEvent(new Event('change',{bubbles:true}));
 await wait(()=>state()['shop.scenario'].value===(paymentScenario),'Scenario selection');await wait(()=>document.getElementById('pay').dataset.scenario===(paymentScenario)&&document.getElementById('pay').getClientRects().length>0,'Visible payment action with current scenario');document.getElementById('pay').focus();assert(document.activeElement===document.getElementById('pay'),'The visible payment trigger receives keyboard focus');document.getElementById('pay').click();
 if(['integrity','foreign-patch','interrupted'].includes(scenario)){
  await wait(()=>remote.some(event=>event.status==='failed'),'Rejected remote operation cleanup');
  assert(location.pathname==='/checkout'&&state()['shop.data'].cart.count===1,'Rejected remote input cannot create an order or mutate the cart');
  assert(!document.querySelector('#remote-payment-slot')?.shadowRoot?.childElementCount,'Rejected remote input releases its slot');
  if(scenario!=='interrupted')assert(frames.length===0,'Untrusted surface input cannot commit a frame');
  window.__STORE_TEST__={status:'passed',ok:true,scenario,checks,frames,remote,resumeMs};return;
 }
 await wait(()=>{const button=document.querySelector('#remote-payment-slot')?.shadowRoot?.querySelector('#provider-confirm');return button&&button.getClientRects().length>0;},'Visible streamed confirmation controls');
 const shadow=document.querySelector('#remote-payment-slot').shadowRoot;
 assert(frames.length===3&&frames[0].sections===1,'Streamed controls become usable only after their section arrives');
 const dialog=document.getElementById('payment-dialog'),close=dialog.shadowRoot.querySelector('.xdialog-close');
 close.focus();assert(!tab(close),'Tab can leave the dialog close button for the streamed controls');
 const last=shadow.querySelector('#provider-cancel');last.focus();assert(tab(last)&&dialog.shadowRoot.activeElement===close,'Tab wraps from the streamed surface into its owning dialog');
 assert(tab(close,true)&&shadow.activeElement===last,'Shift-Tab enters the last streamed control');
 const claimed=JSON.parse(atob(state()['shop.paymentAttempt'].capability.split('.')[0].replace(/-/g,'+').replace(/_/g,'/')));assert(claimed.scenario===(paymentScenario),'Payment attempt binds the selected scenario');
 if(scenario==='preview'){
  assert(shadow.querySelectorAll('[data-payment-section]').length===3,'Complete provider surface is visible before authorization');
  window.__STORE_TEST__={status:'passed',ok:true,scenario,checks,frames,remote,resumeMs};return;
 }
 if(scenario==='navigation'){
  await client.visit('/warenkorb');await wait(()=>shadow.childElementCount===0&&state()['shop.paymentDialog'].open===false,'Navigation cancels the remote surface');
  assert(state()['shop.data'].cart.count===1,'Navigation preserves the unpaid cart');
  window.__STORE_TEST__={status:'passed',ok:true,scenario,checks,frames,remote,resumeMs};return;
 }
 if(scenario==='cancel')shadow.querySelector('#provider-cancel').click();
 else if(scenario!=='timeout'){await new Promise(resolve=>setTimeout(resolve,200));shadow.querySelector('#provider-confirm').click();}
 if(scenario==='success'){
  assert(!(window.__STORE_CSP__||[]).length,'Shop and streamed provider styles comply with the document CSP');
  await wait(()=>location.pathname.startsWith('/bestellung/'),'Order completion');
  assert(window.__STORE_DUPLICATE__?.ok,'Concurrent duplicate completion requests return the same order');
  const response=await fetch(location.href);assert(response.ok&&(await response.text()).includes('XT-'),'Confirmation survives a full server reload');
  assert(frames.length===3&&frames[0].sections===1&&frames[2].sections===3,'Three real stream sections alter the displayed structure');
  assert(frames[2].at-frames[0].at>=300,'First provider section arrives before the final frame');
  assert(remote.some(event=>event.status==='attached'&&event.atc==='attach'),'Preflight followed by ATC attach');
 }else{
  await wait(()=>state()['shop.paymentDialog'].open===false,'Failed or cancelled payment cleanup',scenario==='timeout'?35000:15000);
  assert(location.pathname==='/checkout'&&state()['shop.data'].cart.count===1,'Failed payment cannot create an order or clear the cart');
  assert(document.querySelector('#remote-payment-slot')?.shadowRoot?.childElementCount===0,'Remote root releases its resources');
  if(scenario==='cancel'){
   await wait(()=>!dialog.hasAttribute('open'),'Payment dialog closes its rendered surface');
   await wait(()=>document.activeElement===document.getElementById('pay'),'Payment trigger focus (active '+document.activeElement?.id+', prior '+dialog._lastFocusedElement?.id+')');
   assert(true,'Payment cancellation restores focus to its trigger');
  }
 }
 assert(document.documentElement.scrollWidth<=window.innerWidth+1,'Viewport has no horizontal overflow');
 window.__STORE_TEST__={status:'passed',ok:true,scenario,checks,frames,remote,resumeMs};
}catch(error){window.__STORE_TEST__={status:'failed',ok:false,scenario,checks,frames,remote,diagnostics,failure:error.message};}})();
