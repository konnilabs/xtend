// Classic bootstrap retains automatic component labels and state integration.
import { xtendState } from './xtend-state.js';
import { createXtendI18n } from './xtend-i18n.definition.js';
export * from './xtend-i18n.definition.js';
const xtendI18n = createXtendI18n({ stateRuntime: xtendState });
xtendI18n.configure({ apply: false });
xtendI18n.connectState(xtendState);
if (typeof window !== 'undefined') window.xtendI18n = xtendI18n;
if (typeof module !== 'undefined' && module.exports) module.exports = { xtendI18n };
export { xtendI18n };
