// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XType } from "./xtype.definition.js";
export * from "./xtype.definition.js";
defineManagedComponent("x-type", XType);

export { default } from "./xtype.definition.js";
