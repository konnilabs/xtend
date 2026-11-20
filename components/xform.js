// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XForm } from "./xform.definition.js";
export * from "./xform.definition.js";
defineManagedComponent("x-form", XForm);

export { default } from "./xform.definition.js";
