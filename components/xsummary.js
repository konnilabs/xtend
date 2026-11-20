// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XSummary } from "./xsummary.definition.js";
export * from "./xsummary.definition.js";
defineManagedComponent("x-summary", XSummary);

export { default } from "./xsummary.definition.js";
