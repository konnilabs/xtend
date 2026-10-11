import {createPageResourceCache} from '@ccslabs/xtend/rmt/page-resource-cache';
import {defineAppServices,service} from '@ccslabs/xtend/maraca/app-services';
export function createDemoServices(){
 const cache=createPageResourceCache({ttlMs:60000,maxEntries:2,maxBytes:32768});
 const services=defineAppServices({
  'demo.cache.read':service({kind:'query',target:'local',invoke:({key})=>cache.get(key)}),
  'demo.cache.write':service({kind:'command',target:'local',invoke:({key,value})=>cache.set(key,value)})
 });return {services,cache};
}
