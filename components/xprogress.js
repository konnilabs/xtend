// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XProgress } from "./xprogress.definition.js";
export * from "./xprogress.definition.js";
defineManagedComponent("x-progress", XProgress);

export { default } from "./xprogress.definition.js";
