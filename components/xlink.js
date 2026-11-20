// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XLink } from "./xlink.definition.js";
export * from "./xlink.definition.js";
defineManagedComponent("x-link", XLink);

export { default } from "./xlink.definition.js";
