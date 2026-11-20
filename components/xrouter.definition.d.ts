export * from './xrouter.js';
import type { XRouterElement } from './xrouter.js';
export interface XRouterManagedElement extends XRouterElement { routes: readonly { path: string; id?: string; title?: string }[]; readonly currentPath: string }
export declare const XRouter: { new(): XRouterManagedElement };
import type { XRouteElement } from './xrouter.js';
export declare const XRoute: { new(): XRouteElement };
export default XRouter;
