// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XToggle } from "./xtoggle.definition.js";
export * from "./xtoggle.definition.js";
defineManagedComponent("x-toggle", XToggle);

export { default } from "./xtoggle.definition.js";
