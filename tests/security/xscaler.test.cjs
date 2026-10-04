const test = require('node:test');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {createBrowserExternalModuleLoader} = require('../../xscaler/remote-adapter-loader');
const {verifyAdapterBytes} = require('../../xscaler/verify-adapter');
const integrity = (source) => 'sha256-' + createHash('sha256').update(source).digest('base64');

test('unchanged root with static, re-export or dynamic imports never executes', async () => {
  for (const source of ["import './mutable.mjs';", "export * from './mutable.mjs';", "export {x} from './mutable.mjs';", "function later(){return import('./mutable.mjs');}", "import(`./${name}.mjs`);"]) {
    let attachments = 0;
    const loader = createBrowserExternalModuleLoader({documentTarget:{createElement(){throw Error('must not create script');},head:{appendChild(){attachments++;}}},fetch:async () => new Response(source)});
    await assert.rejects(loader({url:'https://provider.example/adapter.mjs', integrity:integrity(source)}), /self-contained/);
    assert.equal(attachments, 0);
  }
});
test('integrity, syntax, size and cancellation fail closed', async () => {
  const source = 'export const adapter = true;';
  const descriptor = {url:'https://provider.example/adapter.mjs',integrity:integrity(source)};
  await verifyAdapterBytes(descriptor, {fetch:async () => new Response(source)});
  await assert.rejects(verifyAdapterBytes(descriptor, {fetch:async () => new Response(source+'\n// modified')}), /mismatch/);
  await assert.rejects(verifyAdapterBytes(descriptor, {maxAdapterBytes:4,fetch:async () => new Response(source)}), /byte limit/);
  await assert.rejects(verifyAdapterBytes({...descriptor,integrity:integrity('import(')}, {fetch:async () => new Response('import(')}));
  const signal = AbortSignal.abort();
  await assert.rejects(verifyAdapterBytes({...descriptor,signal}, {fetch:async () => new Response(source)}));
});
