// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XMasonry } from "./xmasonry.definition.js";
export * from "./xmasonry.definition.js";
defineManagedComponent("x-masonry", XMasonry);

export { default } from "./xmasonry.definition.js";
