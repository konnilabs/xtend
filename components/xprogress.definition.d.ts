// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XProgressElement} from './xprogress.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xprogress.js';
export type XProgress = XProgressElement & NativeWritablePropertiesV2<"x-progress">;
export declare const XProgress: NativeDefinitionConstructorV2<"x-progress",XProgressElement>;
export default XProgress;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
