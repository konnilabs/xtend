import {createRmtResumeCaptureAdapter} from '@ccslabs/xtend/rmt/resume-capture-adapter';

/** Generated entries supply build-pinned keys and compiler event records. */
export async function startMaracaPageApplication(configuration) {
  const initialPage = JSON.parse(document.getElementById('xtend-page-data').textContent);
  const root = document.getElementById('xtend-page');
  const capture = createRmtResumeCaptureAdapter({generation:initialPage.ssr?.resume?.generation, now:()=>performance.now()});
  const installed = capture.install(root, (configuration.events || []).map(event=>({...event,selector:event.target})), {
    intercept:true,
    mapPayload(record,event,target) {
      return Object.fromEntries(Object.entries(record.payload || {}).map(([name,path])=> {
        const segments=String(path).replace(/^\$/u,'').split('.');
        let value=segments.shift()==='target' ? target : event;
        for(const segment of segments) { if(['__proto__','constructor','prototype'].includes(segment)) throw new Error('Unsafe event path.'); value=value?.[segment]; }
        return [name,value];
      }));
    }
  });
  // Capture is active before the larger composition runtime is loaded. A bad
  // verification key follows the same single hydration fallback as a bad signature.
  window.dispatchEvent(new CustomEvent('xtend-page:capturing',{detail:{root}}));
  let client;
  try {
  const {createMaracaPageClient} = await import('./page-client.mjs');
  let key;
  try { key = await crypto.subtle.importKey('jwk',configuration.publicKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']); } catch { key = null; }
  const verify = async(canonical, integrity) => {
    if(!key || integrity.keyId!==configuration.publicKey.kid || integrity.algorithm!=='ECDSA-P256-SHA256') return false;
    try {
      const raw=Uint8Array.from(atob(integrity.signature.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
      return {verified:await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,raw,new TextEncoder().encode(canonical))};
    } catch { return false; }
  };
  client = createMaracaPageClient({initialPage,root,resume:{verify},applicationKey:configuration.applicationKey,
    intentQueue:()=>{installed.dispose();return capture.listIntents();}, maraca:configuration.maraca,remoteSurfaces:configuration.remoteSurfaces,navigationAction:configuration.navigationAction});
  client.subscribe(event=>window.dispatchEvent(new CustomEvent('xtend-page:event',{detail:event})));
    await client.start();
    window.XTendPage = client;
    window.dispatchEvent(new CustomEvent('xtend-page:ready',{detail:{client}}));
    window.addEventListener('pagehide',()=>client.dispose(),{once:true});
    return client;
  } catch(error) {
    installed.dispose(); client?.dispose(); window.dispatchEvent(new CustomEvent('xtend-page:error',{detail:{message:error.message,code:error.code}})); throw error;
  }
}
