// Classic registration uses the shared pure definition.
import './xicon.js';
import { XSurfaceWindow } from './xsurfacewindow.definition.js';
import { defineManagedComponent } from './native-managed.js';
export * from './xsurfacewindow.definition.js';
defineManagedComponent('x-surface-window', XSurfaceWindow);
