// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XCards, XCard } from "./xcards.definition.js";
export * from "./xcards.definition.js";
defineManagedComponent("x-cards", XCards);
defineManagedComponent("x-card", XCard);

export { default } from "./xcards.definition.js";
