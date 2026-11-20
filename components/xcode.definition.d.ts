// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XCodeElement} from './xcode.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xcode.js';
export type XCode = XCodeElement & NativeWritablePropertiesV2<"x-code">;
import type {XCodeConstructor} from './xcode.js';
export declare const XCode: NativeDefinitionConstructorV2<"x-code",XCodeElement> & Omit<XCodeConstructor,'prototype'>;
export default XCode;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
