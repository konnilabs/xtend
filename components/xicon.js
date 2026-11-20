// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XIcon, XTendIconRegistry, X_ICON_REGISTRY_SCHEMA, registerIconPack, resolveIcon, getIconRegistrySnapshot, createXTendCoreIconPack, createXTendLucideIconPack } from "./xicon.definition.js";
export * from "./xicon.definition.js";
defineManagedComponent("x-icon", XIcon);

globalThis.__xtendIconRegistry = XTendIconRegistry;

if (typeof window !== 'undefined') {
  window.XTend = window.XTend || {};
  window.XTend.icons = {
    schema: X_ICON_REGISTRY_SCHEMA,
    registry: XTendIconRegistry,
    register: registerIconPack,
    resolve: resolveIcon,
    snapshot: getIconRegistrySnapshot,
    createCorePack: createXTendCoreIconPack,
    createLucidePack: createXTendLucideIconPack
  };
}

export { default } from "./xicon.definition.js";
