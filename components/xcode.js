// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XCode } from "./xcode.definition.js";
export * from "./xcode.definition.js";
defineManagedComponent("x-code", XCode);

export { default } from "./xcode.definition.js";
