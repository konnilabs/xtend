// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XModal } from "./xmodal.definition.js";
export * from "./xmodal.definition.js";
defineManagedComponent("x-modal", XModal);

export { default } from "./xmodal.definition.js";
