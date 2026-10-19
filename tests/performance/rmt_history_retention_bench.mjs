// Informational retained-heap benchmark; deterministic retention contracts live in the RMT suites.
// node --expose-gc tests/performance/rmt_history_retention_bench.mjs [--legacy-history | --no-history]
import { createRmtActionEffectRuntime } from '../../xtendrmt/rmt-action-effect-runtime.js';
import { createRmtAppRuntime } from '../../xtendrmt/rmt-app-runtime.js';
const args = process.argv.slice(2);
if (args.some(arg => !['--legacy-history', '--no-history'].includes(arg)) || args.length > 1) {
  throw new Error('Choose at most one of --legacy-history or --no-history.');
}
const mode = args[0] || 'bounded-defaults';
const retention = mode === '--legacy-history'
  ? { historyLimit: Infinity, diagnosticLimit: Infinity, resultDiagnostics: 'history' }
  : mode === '--no-history' ? { historyLimit: 0, diagnosticLimit: 0 } : {};
const action = createRmtActionEffectRuntime({ actions: [{ id: 'bench.tick' }], planningOnly: true, ...retention });
const app = createRmtAppRuntime({ actionRuntime: action, ...retention });
const cells = Array.from({ length: 200 }, (_, i) => ({ key: `cell-${i}`, kind: i % 8, className: `cell piece-${i % 8}` }));
const samples = [];
const started = performance.now();
function sample(commands) {
  if (typeof global.gc === 'function') global.gc();
  const memory = process.memoryUsage();
  const entry = { commands, heapUsedBytes: memory.heapUsed, rssBytes: memory.rss, elapsedMs: Math.round(performance.now() - started) };
  samples.push(entry);
  console.log(JSON.stringify(entry));
}
sample(0);
for (let i = 1; i <= 1200; i++) {
  await app.command('bench.tick', { cells, ms: 20 });
  if (i % 200 === 0) sample(i);
}
console.log(JSON.stringify({ schema: 'xtend.rmt.history-retention-bench.v1', node: process.version, mode, forcedGc: typeof global.gc === 'function', samples }));
