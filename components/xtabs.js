// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XTab, XTabs } from "./xtabs.definition.js";
export * from "./xtabs.definition.js";
defineManagedComponent("x-tab", XTab);
defineManagedComponent("x-tabs", XTabs);

export { default } from "./xtabs.definition.js";
