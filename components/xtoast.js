// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XToast } from "./xtoast.definition.js";
export * from "./xtoast.definition.js";
defineManagedComponent("x-toast", XToast);

export { default } from "./xtoast.definition.js";
