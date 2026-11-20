// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XTextareaElement} from './xtextarea.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xtextarea.js';
export type XTextarea = XTextareaElement & NativeWritablePropertiesV2<"x-textarea">;
import type {XTextareaConstructor} from './xtextarea.js';
export declare const XTextarea: NativeDefinitionConstructorV2<"x-textarea",XTextareaElement> & Omit<XTextareaConstructor,'prototype'>;
export default XTextarea;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
