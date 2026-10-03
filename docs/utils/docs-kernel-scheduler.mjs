import { createRmtKernelScheduler } from '../../xtendrmt/rmt-kernel-scheduler.js';

const DOCS_KERNEL_SCHEDULER_KEY = Symbol.for('xtend.docs.kernel-scheduler.v1');
if (!window[DOCS_KERNEL_SCHEDULER_KEY]) {
  Object.defineProperty(window, DOCS_KERNEL_SCHEDULER_KEY, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: createRmtKernelScheduler({ globalTarget: window })
  });
}

export const docsKernelScheduler = window[DOCS_KERNEL_SCHEDULER_KEY];
export default docsKernelScheduler;
