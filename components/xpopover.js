// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import './xicon.js';
import { defineManagedComponent } from './native-managed.js';
import { XPopover } from "./xpopover.definition.js";
export * from "./xpopover.definition.js";
defineManagedComponent("x-popover", XPopover);

export { default } from "./xpopover.definition.js";
