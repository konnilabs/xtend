import {defineAppServices,service} from '@ccslabs/xtend/maraca/app-services';
export interface CartInput {sku:string;quantity:string;version:string}
export default defineAppServices({
  'shop.ui.shipping':service<{value:string},{text:string}>({kind:'query',target:'local',invoke:({value})=>({text:value==='express'?'Express: nächster Werktag. Alle Angaben sind fiktiv.':'Standard: 2–3 Werktage. Alle Angaben sind fiktiv.'})}),
  'shop.cart.add':service<CartInput,Record<string,unknown>>({kind:'command',target:'server',concurrency:'serial'}),
  'shop.cart.set':service<CartInput,Record<string,unknown>>({kind:'command',target:'server',concurrency:'serial'}),
  'shop.cart.clear':service<{version:string},Record<string,unknown>>({kind:'command',target:'server',concurrency:'serial'}),
  'shop.checkout.save':service<Record<string,string>,Record<string,unknown>>({kind:'command',target:'server',concurrency:'serial'}),
  'shop.payment.attempt':service<Record<string,string>,Record<string,unknown>>({kind:'command',target:'server',concurrency:'serial'}),
  'shop.payment.complete':service<{proof:string},Record<string,unknown>>({kind:'command',target:'server',concurrency:'serial'}),
  'shop.payment.cancel':service<{id:string},Record<string,unknown>>({kind:'command',target:'server',concurrency:'serial'})
});
