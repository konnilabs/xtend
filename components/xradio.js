// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XRadio } from "./xradio.definition.js";
export * from "./xradio.definition.js";
defineManagedComponent("x-radio", XRadio);

export { default } from "./xradio.definition.js";
