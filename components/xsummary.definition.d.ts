// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XSummaryElement} from './xsummary.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xsummary.js';
export type XSummary = XSummaryElement & NativeWritablePropertiesV2<"x-summary">;
export declare const XSummary: NativeDefinitionConstructorV2<"x-summary",XSummaryElement>;
export default XSummary;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
