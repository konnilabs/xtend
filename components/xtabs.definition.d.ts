// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XTabsElement} from './xtabs.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xtabs.js';
export type XTabs = XTabsElement & NativeWritablePropertiesV2<"x-tabs">;
export declare const XTabs: NativeDefinitionConstructorV2<"x-tabs",XTabsElement>;
export default XTabs;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
export type XTab = HTMLElement;
export declare const XTab: CustomElementConstructor;
