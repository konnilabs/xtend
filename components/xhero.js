// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import './xicon.js';
import { defineManagedComponent } from './native-managed.js';
import { XHero } from "./xhero.definition.js";
export * from "./xhero.definition.js";
defineManagedComponent("x-hero", XHero);

export { default } from "./xhero.definition.js";
