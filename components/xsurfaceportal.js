// Classic registration uses the shared pure definition.

import { XSurfacePortal } from './xsurfaceportal.definition.js';
import { defineManagedComponent } from './native-managed.js';
export * from './xsurfaceportal.definition.js';
defineManagedComponent('x-surface-portal', XSurfacePortal);
