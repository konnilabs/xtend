// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XWriter } from "./xwriter.definition.js";
export * from "./xwriter.definition.js";
defineManagedComponent("x-writer", XWriter);

export { default } from "./xwriter.definition.js";
