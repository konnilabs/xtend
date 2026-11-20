// Classic bootstrap. Native RMT loads the shared pure definition directly.
import './xtend-state.js';
import './xicon.js';
import { defineManagedComponent } from './native-managed.js';
import { XCalendar } from "./xcalendar.definition.js";
export * from "./xcalendar.definition.js";
defineManagedComponent("x-calendar", XCalendar);

export { default } from "./xcalendar.definition.js";
