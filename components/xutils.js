// Legacy bootstrap. The definition entry has no global registration.
import { XUtils } from './xutils.definition.js';
export * from './xutils.definition.js';
if (typeof window !== 'undefined') window.XUtils = XUtils;
