// Classic registration uses the shared pure definition.
import './xtend-state.js';
import { XSurfaceManager } from './xsurfacemanager.definition.js';
import { defineManagedComponent } from './native-managed.js';
export * from './xsurfacemanager.definition.js';
defineManagedComponent('x-surface-manager', XSurfaceManager);
