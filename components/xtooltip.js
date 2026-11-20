// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XTooltip } from "./xtooltip.definition.js";
export * from "./xtooltip.definition.js";
defineManagedComponent("x-tooltip", XTooltip);

export { default } from "./xtooltip.definition.js";
