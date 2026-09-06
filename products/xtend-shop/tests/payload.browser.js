void (async () => {
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const wait=async(fn,label)=>{const deadline=Date.now()+15000;while(!fn()){if(Date.now()>deadline)throw new Error(label);await pause(25);}};
 const assert=(condition,label)=>{if(!condition)throw new Error(label);};
 try {
  await wait(()=>window.XTendPage?.getRuntime(),'Signed resume did not finish');
  const client=window.XTendPage,root=document.getElementById('xtend-page'),header=document.getElementById('store-header');
  assert(root.dataset.rmtResumeStatus==='resumed','Compact data changed the signed resume envelope');
  const docNavigations=performance.getEntriesByType('navigation').length;
  const first=document.querySelector('.store-catalog .store-card-name').textContent;
  assert(!document.querySelector('.detail-page,.checkout-page,.order-confirmation'),'Inactive pages were rendered');
  const pageRequests=window.__STORE_PAGE_REQUESTS__;
  document.querySelector('.pagination a[href*="page=2"]').click();
  await wait(()=>location.search.includes('page=2')&&client.page.props['shop.data'].catalog.page===2,'Pagination did not update through page transport');
  assert(window.XTendPage===client&&document.getElementById('store-header')===header,'Pagination replaced the document or shell');
  assert(performance.getEntriesByType('navigation').length===docNavigations,'Pagination caused a document reload');
  assert(document.querySelector('.store-catalog .store-card-name').textContent!==first,'Pagination retained stale products');
  assert(pageRequests.some(r=>r.url.includes('page=2')&&r.header==='1'&&r.body.schema==='xtend.page-wire.v1'),'Pagination did not negotiate compact fetch transport');
  assert(!client.page.ssr,'Navigation unnecessarily rendered another SSR envelope');
  history.back();await wait(()=>client.page.props['shop.data'].catalog.page===1,'Back did not restore the first result page');
  await client.visit('/produkt/nova-studio-kopfhoerer?sku=TEC-01-2');
  assert(!document.querySelector('.store-hero,.store-catalog,.checkout-page,.order-confirmation'),'Detail navigation retained inactive pages');
  assert(client.page.props['shop.data'].catalog===null,'Detail payload contains a catalog');
  assert(!('shop.name' in client.page.props)&&!('draft' in client.page.props['shop.data']),'Unrelated page exposes checkout data');
  assert(document.getElementById('store-search').value==='', 'Detail search input exposes an unresolved model path');
  assert(!document.getElementById('checkout-name')&&!document.getElementById('pay'),'Inactive checkout controls remain in the DOM');
  document.getElementById('add-cart').click();await wait(()=>client.getRuntime().model.snapshot().states['shop.data'].cart.count===1,'Cart action failed after lazy page materialization');
  await client.visit('/checkout');
  assert(document.getElementById('checkout-name')&&!document.getElementById('pay'),'Checkout should initially mount only contact controls');
  assert(document.querySelectorAll('.checkout-stage').length===1,'Multiple checkout stages were materialized');
  // Authored styles carry the document nonce. Untrusted elements and attributes
  // must remain blocked by the actual response policy, including Shadow DOM.
  const violations=[];const report=e=>violations.push(e.effectiveDirective);window.addEventListener('securitypolicyviolation',report);
  const probe=document.createElement('div');probe.id='untrusted-style-probe';document.body.append(probe);
  const style=document.createElement('style');style.textContent='#untrusted-style-probe{color:rgb(1,2,3)}';document.head.append(style);
  probe.setAttribute('style','background-color:rgb(4,5,6)');
  await pause(120);
  assert(getComputedStyle(probe).color!=='rgb(1, 2, 3)'&&getComputedStyle(probe).backgroundColor!=='rgb(4, 5, 6)','CSP allowed an injected style');
  assert(violations.includes('style-src-elem')&&violations.includes('style-src-attr'),'CSP did not report both blocked injections');
  style.remove();probe.remove();window.removeEventListener('securitypolicyviolation',report);
  window.__STORE_TEST__={ok:true,status:'passed',paginationFetch:true,preservedDocument:true,activeCheckoutStages:1,blockedStyles:violations};
 }catch(error){window.__STORE_TEST__={ok:false,status:'failed',failure:error.message,errors:window.__STORE_PAGE_ERRORS__,requests:window.__STORE_PAGE_REQUESTS__?.map(({url,status,body})=>({url,status,schema:body.schema}))};}
})();
