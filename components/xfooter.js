// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XFooter } from "./xfooter.definition.js";
export * from "./xfooter.definition.js";
defineManagedComponent("x-footer", XFooter);

export { default } from "./xfooter.definition.js";
