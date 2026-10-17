/** Explicit, bounded, tab-local JSON resources. No persistence or transport. */
export function createPageResourceCache({ttlMs=600000,maxEntries=10,maxBytes=8388608,now=Date.now}={}) {
  for(const [name,value] of Object.entries({ttlMs,maxEntries,maxBytes})) if(!Number.isSafeInteger(value)||value<1) throw new TypeError(`${name} must be a positive integer.`);
  const entries=new Map(),encoder=new TextEncoder();let bytes=0,hits=0,misses=0,evictions=0,expired=0;
  function remove(key){const entry=entries.get(key);if(entry){bytes-=entry.bytes;entries.delete(key);}return !!entry;}
  function prune(){const time=now();for(const [key,entry]of entries)if(entry.expiresAt<=time){remove(key);expired++;}}
  function json(value,seen=new Set(),depth=0){
    if(depth>64)throw new TypeError('Resource nesting exceeds 64 levels.');
    if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return;
    if(typeof value!=='object'||seen.has(value)||(!Array.isArray(value)&&Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null))throw new TypeError('Resources must contain only acyclic JSON data.');
    seen.add(value);
    for(const [name,descriptor]of Object.entries(Object.getOwnPropertyDescriptors(value))){
      if(Array.isArray(value)&&name==='length')continue;
      if(!descriptor.enumerable||!('value'in descriptor)||['__proto__','constructor','prototype'].includes(name))throw new TypeError('Unsafe resource property.');
      json(descriptor.value,seen,depth+1);
    }
    seen.delete(value);
  }
  function key(value){if(typeof value!=='string'||!value||value.length>32768)throw new TypeError('A bounded resource key is required.');return value;}
  return Object.freeze({
    get(name){key(name);prune();const entry=entries.get(name);if(!entry){misses++;return null;}hits++;entries.delete(name);entries.set(name,entry);return JSON.parse(entry.json);},
    set(name,value,settings={}){
      key(name);json(value);const serialized=JSON.stringify(value),size=encoder.encode(serialized).byteLength;
      const lifetime=settings.ttlMs??ttlMs;if(!Number.isSafeInteger(lifetime)||lifetime<1)throw new TypeError('Resource TTL must be positive.');
      const expiresAt=Math.min(now()+Math.min(ttlMs,lifetime),settings.expiresAt??Infinity);
      if(!Number.isFinite(expiresAt))throw new TypeError('Resource expiry must be finite.');
      prune();remove(name);if(size>maxBytes||expiresAt<=now())return false;
      entries.set(name,{json:serialized,bytes:size,expiresAt});bytes+=size;
      while(entries.size>maxEntries||bytes>maxBytes){remove(entries.keys().next().value);evictions++;}return true;
    },
    delete(name){return remove(key(name));},clear(){entries.clear();bytes=0;},
    stats(){prune();return Object.freeze({entries:entries.size,bytes,hits,misses,evictions,expired});}
  });
}
