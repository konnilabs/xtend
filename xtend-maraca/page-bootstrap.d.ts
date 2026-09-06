import type {MaracaPageClient} from './page-client.js';
import type {MaracaRemoteSurfaceBinding} from './remote-surface.js';
export function startMaracaPageApplication(configuration:{applicationKey:string;navigationAction?:string;viewTransitions?:boolean; publicKey:JsonWebKey & {kid:string}; events?:Readonly<Record<string,unknown>>[]; maraca?:Readonly<Record<string,unknown>>;remoteSurfaces?:MaracaRemoteSurfaceBinding[]}):Promise<MaracaPageClient>;
