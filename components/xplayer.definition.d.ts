// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XPlayerElement} from './xplayer.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xplayer.js';
export type XPlayer = XPlayerElement & NativeWritablePropertiesV2<"x-player">;
export declare const XPlayer: NativeDefinitionConstructorV2<"x-player",XPlayerElement>;
export default XPlayer;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
