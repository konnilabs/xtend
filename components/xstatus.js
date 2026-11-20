// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import './xicon.js';
import { defineManagedComponent } from './native-managed.js';
import { XStatus } from "./xstatus.definition.js";
export * from "./xstatus.definition.js";
defineManagedComponent("x-status", XStatus);

export { default } from "./xstatus.definition.js";
