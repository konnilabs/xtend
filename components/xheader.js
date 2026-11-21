// Native shared-definition closure sha256: 9089dc504c2a7db9c9df56ad5ac3055e39a1bc823bb968c04e43da68a114ea36
// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XHeader } from "./xheader.definition.js";
export * from "./xheader.definition.js";
defineManagedComponent("x-header", XHeader);

export { default } from "./xheader.definition.js";
