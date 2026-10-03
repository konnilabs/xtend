window.__STORE_PAGE_REQUESTS__=[];
window.__STORE_PAGE_ERRORS__=[];
window.addEventListener('xtend-page:error',event=>window.__STORE_PAGE_ERRORS__.push(event.detail));
const originalPageFetch=window.fetch;
window.fetch=async function(...args){
 const response=await originalPageFetch.apply(this,args);
 if(args[1]?.headers?.['X-XTend-Page'])window.__STORE_PAGE_REQUESTS__.push({url:String(args[0]),status:response.status,header:args[1].headers['X-XTend-Page-Wire'],body:await response.clone().json()});
 return response;
};
