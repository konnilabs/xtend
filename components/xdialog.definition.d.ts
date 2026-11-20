// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XDialogElement} from './xdialog.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xdialog.js';
export type XDialog = XDialogElement & NativeWritablePropertiesV2<"x-dialog">;
export declare const XDialog: NativeDefinitionConstructorV2<"x-dialog",XDialogElement>;
export default XDialog;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
