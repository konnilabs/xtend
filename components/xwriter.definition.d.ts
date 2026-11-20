// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XWriterElement} from './xwriter.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xwriter.js';
export type XWriter = XWriterElement & NativeWritablePropertiesV2<"x-writer">;
export declare const XWriter: NativeDefinitionConstructorV2<"x-writer",XWriterElement>;
export default XWriter;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
