// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XPopoverElement} from './xpopover.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xpopover.js';
export type XPopover = XPopoverElement & NativeWritablePropertiesV2<"x-popover">;
export declare const XPopover: NativeDefinitionConstructorV2<"x-popover",XPopoverElement>;
export default XPopover;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
