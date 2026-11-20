// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XInput } from "./xinput.definition.js";
export * from "./xinput.definition.js";
defineManagedComponent("x-input", XInput);

export { default } from "./xinput.definition.js";
