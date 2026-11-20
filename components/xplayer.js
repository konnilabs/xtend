// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XPlayer } from "./xplayer.definition.js";
export * from "./xplayer.definition.js";
defineManagedComponent("x-player", XPlayer);

export { default } from "./xplayer.definition.js";
