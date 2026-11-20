// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XCheckbox } from "./xcheckbox.definition.js";
export * from "./xcheckbox.definition.js";
defineManagedComponent("x-checkbox", XCheckbox);

export { default } from "./xcheckbox.definition.js";
