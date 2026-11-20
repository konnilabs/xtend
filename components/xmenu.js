// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XMenu } from "./xmenu.definition.js";
export * from "./xmenu.definition.js";
defineManagedComponent("x-menu", XMenu);

export { default } from "./xmenu.definition.js";
