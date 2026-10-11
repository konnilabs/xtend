/** Compose with createMaracaPageClient/startMaracaPageApplication; no second router. */
export function demoPageResourcePolicy(registry,cache){return {
 async resolve(url,{page,cache:mode,signal}) {
  const target=new URL(url);if(!['/a','/b'].includes(target.pathname))return null;
  const key=JSON.stringify([page.version,page.contextKey,target.href]);
  if(mode==='reload'){cache.delete(key);return null;}
  return registry.invoke('demo.cache.read',{key},{},{signal});
 },
 project(value,{page}){const {ssr,csrfToken,...shell}=page;return {...shell,url:value.url,props:value.props,head:value.head,partial:false,deferred:{},once:{},merge:{},errors:{},flash:{}};},
 clear(){cache.clear();}
};}
