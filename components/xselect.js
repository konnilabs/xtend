// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XSelect } from "./xselect.definition.js";
export * from "./xselect.definition.js";
defineManagedComponent("x-select", XSelect);

export { default } from "./xselect.definition.js";
