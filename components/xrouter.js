// Classic registration uses the shared pure definition.
import './xtend-state.js';
import { XRoute } from './xrouter.definition.js';
defineManagedComponent('x-route', XRoute);
import { XRouter } from './xrouter.definition.js';
import { defineManagedComponent } from './native-managed.js';
export * from './xrouter.definition.js';
defineManagedComponent('x-router', XRouter);
