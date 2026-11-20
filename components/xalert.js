// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XAlert } from "./xalert.definition.js";
export * from "./xalert.definition.js";
defineManagedComponent("x-alert", XAlert);

export { default } from "./xalert.definition.js";
