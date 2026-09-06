import type {PageClient, PageClientOptions} from '@ccslabs/xtend/rmt/page-client';
import type {MaracaBrowserCompositionRoot, MaracaBrowserFacade} from './browser-composition-runtime.js';
import type {RmtResumeIntent} from '@ccslabs/xtend/rmt/resume-runtime';
import type {MaracaRemoteSurfaceBinding} from './remote-surface.js';
export interface MaracaPageClientOptions extends Omit<PageClientOptions, 'render' | 'activateInitial'> {
  loadBundle?(url:string):Promise<{createXtendMaraca(options?:Record<string,unknown>):MaracaBrowserCompositionRoot}>;
  maraca?:Readonly<Record<string,unknown>>;
  serviceHeaders?():Record<string,string>;
  navigationAction?:string;
  intentQueue?():RmtResumeIntent[];
  remoteSurfaces?:MaracaRemoteSurfaceBinding[];
}
export interface MaracaPageClient extends PageClient { getRuntime():MaracaBrowserFacade | null }
export function createMaracaPageClient(options:MaracaPageClientOptions):MaracaPageClient;
