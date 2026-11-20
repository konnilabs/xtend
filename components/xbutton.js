// Native shared-definition closure sha256: b31d4fc716e7af541e7957fd490147decf8a04b3cb71df37fbab3d461c633259
// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import './xicon.js';
import { defineManagedComponent } from './native-managed.js';
import { XButton } from "./xbutton.definition.js";
export * from "./xbutton.definition.js";
defineManagedComponent("x-button", XButton);

export { default } from "./xbutton.definition.js";
