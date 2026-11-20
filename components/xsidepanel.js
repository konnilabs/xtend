// Classic registration uses the shared pure definition.
import './xicon.js';
import { XSidePanel } from './xsidepanel.definition.js';
import { defineManagedComponent } from './native-managed.js';
export * from './xsidepanel.definition.js';
defineManagedComponent('x-side-panel', XSidePanel);
