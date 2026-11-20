// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XDrawer } from "./xdrawer.definition.js";
export * from "./xdrawer.definition.js";
defineManagedComponent("x-drawer", XDrawer);

export { default } from "./xdrawer.definition.js";
