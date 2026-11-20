// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import { defineManagedComponent } from './native-managed.js';
import { XDialog } from "./xdialog.definition.js";
export * from "./xdialog.definition.js";
defineManagedComponent("x-dialog", XDialog);

export { default } from "./xdialog.definition.js";
