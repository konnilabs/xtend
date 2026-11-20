// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XSpinner } from "./xspinner.definition.js";
export * from "./xspinner.definition.js";
defineManagedComponent("x-spinner", XSpinner);

export { default } from "./xspinner.definition.js";
