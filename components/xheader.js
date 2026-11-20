// Native shared-definition closure sha256: 345a226944c6edc9d585847407950a7a53f81b5f7083243f531f407a4ee3acc6
// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XHeader } from "./xheader.definition.js";
export * from "./xheader.definition.js";
defineManagedComponent("x-header", XHeader);

export { default } from "./xheader.definition.js";
