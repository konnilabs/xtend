import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createPlaygroundRequestCoordinator } from '../../../docs/utils/page/playground-requests.mjs';
import { createRmtKernelScheduler } from '../../../xtendrmt/rmt-kernel-scheduler.js';
import { createRmtBrowserScheduler } from '../../../xtendrmt/rmt-browser-scheduler.js';
const require = createRequire(import.meta.url);
const { createDeterministicHost } = require('../../rmt-language/rmt_kernel_scheduler_suite');
const host = createDeterministicHost();
const kernel = createRmtKernelScheduler({ hostPort: host });
const scheduler = createRmtBrowserScheduler({ scheduler: kernel });
let source = 'a';
const started = [], pending = [], committed = [], errors = [];
const coordinator = createPlaygroundRequestCoordinator({
  scheduler, route: '/docs/de/learn-rmt-playground', getSource: () => source,
  execute(kind, request) {
    started.push({ kind, source: request.source });
    return new Promise(resolve => pending.push({ request, finish: () => { if (request.isCurrent()) committed.push(request.source); resolve(); } }));
  },
  onError: (kind, error) => errors.push(error)
});
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); await host.flushMicrotasks(); };
try {
  coordinator.schedule('diagnostics'); coordinator.schedule('compile');
  await host.advance(160); await flush();
  assert.deepEqual(started, [{ kind: 'diagnostics', source: 'a' }]);
  for (let i = 0; i < 10; i++) {
    source = `edit-${i}`;
    coordinator.schedule('diagnostics'); coordinator.schedule('compile');
    await host.advance(250); await flush();
    assert.equal(coordinator.snapshot().active, 1);
    assert(coordinator.snapshot().pending <= 2);
  }
  await host.advance(300); await flush();
  assert.equal(started.length, 1, 'No overlapping HTTP requests while the first is unresolved');
  pending.shift().finish(); await flush();
  assert.deepEqual(committed, []);
  assert.deepEqual(started[1], { kind: 'compile', source: 'edit-9' });
  pending.shift().finish(); await flush();
  assert.deepEqual(started[2], { kind: 'diagnostics', source: 'edit-9' });
  pending.shift().finish(); await flush();
  assert.deepEqual(committed, ['edit-9', 'edit-9']);
  console.log('passed debounce, bounded burst, stale results and compile priority');
  coordinator.schedule('compile', true); coordinator.schedule('diagnostics', true);
  await host.advance(1); await flush();
  const active = pending.shift();
  assert.equal(started.at(-1).kind, 'compile');
  source = 'preset'; coordinator.invalidate(); coordinator.schedule('compile', true);
  await host.advance(1); await flush();
  assert.equal(active.request.isCurrent(), false);
  coordinator.dispose(); coordinator.dispose();
  assert.equal(active.request.signal.aborted, true);
  active.finish(); await flush();
  assert.equal(started.length, 4);
  assert.deepEqual(errors, []);
  assert.deepEqual(kernel.snapshot().pendingJobIds, []);
  console.log('passed run, preset invalidation, abort and idempotent route disposal');
} finally { coordinator.dispose(); scheduler.dispose(); kernel.dispose(); }
