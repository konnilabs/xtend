export interface PageResourceCacheOptions { ttlMs?:number; maxEntries?:number; maxBytes?:number; now?:()=>number }
export interface PageResourceCache<T> {
  get(key:string):T|null;
  set(key:string,value:T,options?:{ttlMs?:number;expiresAt?:number}):boolean;
  delete(key:string):boolean;
  clear():void;
  stats():Readonly<{entries:number;bytes:number;hits:number;misses:number;evictions:number;expired:number}>;
}
/** Store only application-selected JSON data; never DOM, SSR/resume envelopes or credentials. */
export function createPageResourceCache<T=unknown>(options?:PageResourceCacheOptions):PageResourceCache<T>;
