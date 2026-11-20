// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XTextarea } from "./xtextarea.definition.js";
export * from "./xtextarea.definition.js";
defineManagedComponent("x-textarea", XTextarea);

export { default } from "./xtextarea.definition.js";
