'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync(path.join(__dirname, '../../../docs/utils/page/route-controller.mjs'), 'utf8');
const declaration = name => source.match(new RegExp('(?:async )?function ' + name + '\\([^]*?\\n\\}', 'u'))[0];
async function main() {
  let resolveBoot, rejectBoot, disposed = 0, current = true;
  const events = [];
  const runtime = { boot: () => new Promise((resolve, reject) => { resolveBoot = resolve; rejectBoot = reject; }), snapshot: () => ({ ready: true }), dispose: () => { disposed++; } };
  const playgroundRoot = {};
  const target = { replaceChildren() {}, closest: () => playgroundRoot, querySelector: () => null };
  const context = {
    createDocsRmtPlaygroundElement: () => ({}), renderDocsRmtPlaygroundMaracaToolbar: () => ({}),
    createMaracaPlanRuntime: () => runtime, docsKernelScheduler: {}, createRmtMaracaViewProjectionAdapter: () => ({}),
    DOCS_RMT_PLAYGROUND_MARACA_RUNTIME_MODULES: [], document: {},
    window: { location: { origin: 'http://localhost' }, dispatchEvent: event => events.push(event) },
    createDocsRmtPlaygroundXUtilsAdapter: () => ({}), CustomEvent: function(name) { this.type = name; }
  };
  const boot = vm.runInNewContext(declaration('bootDocsRmtPlaygroundMaracaPreview') + '\nbootDocsRmtPlaygroundMaracaPreview', context);
  const payload = { ok: true, maraca: { ok: true, plan: {} } };
  let pending = boot(target, payload, {}, () => current);
  current = false; resolveBoot();
  assert.equal(await pending, null); assert.equal(disposed, 1); assert.equal(events.length, 0);
  assert.equal(playgroundRoot.__xtendDocsMaracaPlanRuntime, undefined);
  current = true;
  pending = boot(target, payload, {}, () => current); resolveBoot();
  assert.strictEqual(await pending, runtime); assert.strictEqual(playgroundRoot.__xtendDocsMaracaPlanRuntime, runtime);
  assert.equal(events.length, 1);
  pending = boot(target, payload, {}, () => current); rejectBoot(new Error('boot failed'));
  await assert.rejects(pending, /boot failed/);
  assert.equal(target.__xtendDocsMaracaBootRuntime, null);
  console.log('passed stale boot disposal, current runtime attachment and rejected boot cleanup');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
