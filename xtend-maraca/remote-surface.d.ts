import type {XScalerRemoteSurfacePlan} from '@ccslabs/xtend/xscaler/protocol';
import type {XScalerRemoteAdapter} from '@ccslabs/xtend/xscaler/remote-adapter-loader';
import type {MaracaBrowserCompositionRoot,MaracaBrowserFacade} from './browser-composition-runtime.js';
import type {PageClient} from '@ccslabs/xtend/rmt/page-client';
export interface MaracaRemoteSurfaceBinding {
  plan:XScalerRemoteSurfacePlan;adapterUrl:string;preflightPath?:string;slot:string;serviceId:string;
  requestState:string;openState?:string;completeAction:string;errorAction?:string;resultUrl?:string;
  closeAction?:string;cancelAction?:string;
  allowInsecureLoopback?:boolean;capabilities?:string[];failureMessage?:string;
}
export function bindMaracaRemoteSurface(options:{runtime:MaracaBrowserFacade;root:Element;client:PageClient;binding:MaracaRemoteSurfaceBinding;window?:Window}):{snapshot():unknown;dispose():Promise<void>};
export function createMaracaRemoteSurfaceAdapter(configuration:{createComposition():MaracaBrowserCompositionRoot;origin:string;rootId:string;inputState:string;streamState:string;streamService:string;resultState:string;cancelState:string;errorState:string;css?:string}):XScalerRemoteAdapter;
export {registerXScalerRemoteAdapter} from '@ccslabs/xtend/xscaler/remote-adapter-loader';
