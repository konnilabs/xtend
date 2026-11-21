// Native shared-definition closure sha256: fa2189f91e93a575e1b2bfc5565ca6f52b6d86595147361e36431aec2a5d83c9
// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import './xicon.js';
import { defineManagedComponent } from './native-managed.js';
import { XButton } from "./xbutton.definition.js";
export * from "./xbutton.definition.js";
defineManagedComponent("x-button", XButton);

export { default } from "./xbutton.definition.js";
