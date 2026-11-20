// Legacy bootstrap. Managed consumers import the shared definition directly.
import { xtendState } from './xtend-state.definition.js';
export * from './xtend-state.definition.js';

// Classic browser namespace. The package root intentionally does not load this module.
if (typeof window !== 'undefined') {
  window.XTend = window.XTend || {};
  window.XTend.state = xtendState;
}

// UMD-style export for CommonJS/AMD
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { xtendState };
}

// Example usage:
// 1. Als ES Modul: import { xtendState } from './xtend-state.js';
// 2. As a script tag: <script src="xtend-state.js"></script>, then window.XTend.state
