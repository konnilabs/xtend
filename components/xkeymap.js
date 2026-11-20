// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XKeymap } from "./xkeymap.definition.js";
export * from "./xkeymap.definition.js";
defineManagedComponent("x-keymap", XKeymap);

export { default } from "./xkeymap.definition.js";
