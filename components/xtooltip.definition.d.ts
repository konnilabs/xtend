// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XTooltipElement} from './xtooltip.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xtooltip.js';
export type XTooltip = XTooltipElement & NativeWritablePropertiesV2<"x-tooltip">;
export declare const XTooltip: NativeDefinitionConstructorV2<"x-tooltip",XTooltipElement>;
export default XTooltip;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
