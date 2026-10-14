import {createPageResourceCache} from '@ccslabs/xtend/rmt/page-resource-cache';
import {defineAppServices,service} from '@ccslabs/xtend/maraca/app-services';
interface Resource {url:string;props:Record<string,unknown>;head:unknown[]}
const cache=createPageResourceCache<Resource>({ttlMs:60000,maxEntries:2,maxBytes:32768});
export default defineAppServices({
 'demo.cache.read':service<{key:string},Resource|null>({kind:'query',target:'local',invoke:({key})=>cache.get(key)}),
 'demo.cache.write':service<{key:string;value:Resource},boolean>({kind:'command',target:'local',invoke:({key,value})=>cache.set(key,value)})
});
