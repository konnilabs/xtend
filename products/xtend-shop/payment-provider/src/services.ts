import {defineAppServices,service} from '@ccslabs/xtend/maraca/app-services';
export default defineAppServices({
  'demopay.fragments':service<{capability:string},Record<string,unknown>>({kind:'stream',target:'server'}),
  'demopay.authorize':service<{capability:string;method:string},{proof:string}>({kind:'command',target:'server',concurrency:'serial'})
});
