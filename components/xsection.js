// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XSection } from "./xsection.definition.js";
export * from "./xsection.definition.js";
defineManagedComponent("x-section", XSection);

export { default } from "./xsection.definition.js";
