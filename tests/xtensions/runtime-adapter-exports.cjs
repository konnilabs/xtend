'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA } = require('../../tools/xtensions/host-controller-contract');

function runExportChecks() {
  const root = path.resolve(__dirname, '../..');
  const metadata = require('../../package.json');
  const runtime = {}, all = {};
  for (const framework of ['react', 'vue']) {
    const title = framework[0].toUpperCase() + framework.slice(1);
    for (const kind of ['host', 'runtime']) {
      const subpath = `./xtensions/${framework}-${kind}-adapter`;
      const name = `@ccslabs/xtend/${subpath.slice(2)}`;
      const entry = metadata.exports[subpath];
      assert.equal(entry.default, `./tools/xtensions/${framework}-${kind}-adapter.js`);
      assert.equal(entry.types, `./tools/xtensions/${framework}-${kind}-adapter.d.ts`);
      assert.equal(entry.browser, undefined, 'no alternate API under browser conditions');
      const exports = require(name);
      all[name] = Object.entries(exports).map(([key, value]) => [key, typeof value]).sort();
      if (kind === 'runtime') {
        runtime[framework] = all[name];
        assert.deepEqual(Object.keys(exports).sort(), [`create${title}RuntimeAdapter`, `normalize${title}Peers`]);
        const declaration = fs.readFileSync(path.resolve(root, entry.types), 'utf8');
        const declared = [...declaration.matchAll(/export function (\w+)\(/g)].map((match) => match[1]).sort();
        assert.deepEqual(declared, Object.keys(exports).sort(), 'declarations describe every runtime value export');
        const compiler = require(`@ccslabs/xtend-compiler/xtensions/${framework}-runtime-adapter`);
        assert.equal(compiler[`create${title}RuntimeAdapter`], exports[`create${title}RuntimeAdapter`]);
      } else {
        const adapter = exports[`create${title}HostAdapter`]();
        const initial = adapter.snapshot();
        assert.equal(initial.hostId, `${framework}-host-adapter`);
        assert.equal(initial.surfaceId, `surface.${framework}.adapter`);
        assert.equal(initial.xtensionId, `xtension.${framework}.host-adapter`);
        assert.equal(initial.state.mounted, false);
        for (const method of framework === 'react' ? ['getSchedulingDecisions', 'getRenderRecords', 'getBoundaryRecords'] : ['emit', 'getUpdateRecords', 'getEventRecords', 'getBoundaryRecords']) assert.equal(typeof adapter[method], 'function');
        for (const [operation, args] of [['mount', []], ['update', [{ type: 'props.update', payload: { title: 'legacy' } }]], ['suspend', []], ['resume', []], ['unmount', []]]) {
          const result = adapter[operation](...args);
          assert.equal(typeof result.then, 'undefined', `${framework} ${operation} stays synchronous`);
          assert.equal(result.schema, XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA);
        }
        assert.equal(adapter.snapshot().state.destroyed, true);
      }
    }
  }
  const browserConditions = JSON.parse(execFileSync(process.execPath, ['--conditions=browser', '-e',
    `const names=${JSON.stringify(Object.keys(all))};console.log(JSON.stringify(Object.fromEntries(names.map(name=>[name,Object.entries(require(name)).map(([key,value])=>[key,typeof value]).sort()]))));`
  ], { cwd: root, encoding: 'utf8' }));
  assert.deepEqual(browserConditions, all, 'Node browser condition preserves complete host and runtime exports');
  return { ok: true, runtime, legacySynchronousContracts: true, browserConditionParity: true, declarationExportParity: true };
}

module.exports = { runExportChecks };
