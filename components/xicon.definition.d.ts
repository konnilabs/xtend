// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XIconElement} from './xicon.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xicon.js';
export type XIcon = XIconElement & NativeWritablePropertiesV2<"x-icon">;
export declare const XIcon: NativeDefinitionConstructorV2<"x-icon",XIconElement>;
export default XIcon;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
import type {XIconPack,XIconSourceRecord,XIconResolvedSource,XIconRegistrySnapshot} from './xicon.js';
export declare const X_ICON_REGISTRY_SCHEMA: 'xtend.icon.registry.v1';
export declare const X_ICON_SOURCE_SCHEMA: 'xtend.icon.source.v1';
export declare const X_ICON_STATE_SCHEMA: 'xtend.component.x-icon.state.v1';
export type NativeNormalizedIconPackV2 = Omit<XIconPack,'icons'> & {icons:Map<string,XIconSourceRecord>;aliases:Map<string,string>;label:string;source:string;distribution:string;cdnAllowed:boolean;viewBox:string;metadata:Record<string,unknown>};
export declare function registerIconPack(pack:XIconPack,options?:{prepend?:boolean;default?:boolean}):NativeNormalizedIconPackV2;
export declare const XTendIconRegistry:{schema:'xtend.icon.registry.v1';packs:Map<string,NativeNormalizedIconPackV2>;order:string[];defaultPack:string;register:typeof registerIconPack;resolve(name:string,options?:{pack?:string}):XIconResolvedSource|null;snapshot():XIconRegistrySnapshot};
