// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XDrawerElement} from './xdrawer.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xdrawer.js';
export type XDrawer = XDrawerElement & NativeWritablePropertiesV2<"x-drawer">;
export declare const XDrawer: NativeDefinitionConstructorV2<"x-drawer",XDrawerElement>;
export default XDrawer;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
