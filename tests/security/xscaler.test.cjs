const test = require('node:test');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {createBrowserExternalModuleLoader} = require('../../xscaler/remote-adapter-loader');
const {verifyAdapterBytes} = require('../../xscaler/verify-adapter');
const integrity = (source) => 'sha256-' + createHash('sha256').update(source).digest('base64');

// csf_1e84f759699fec8ea5bf83f1 / xscaler-root-only-sri:
// An unchanged approved root must never admit a mutable dependency graph.
test('a dependency change cannot execute beneath an unchanged approved root (CJS and ESM)', async () => {
  const esm = await import('../../xscaler/remote-adapter-loader.mjs');
  for (const createLoader of [createBrowserExternalModuleLoader, esm.createBrowserExternalModuleLoader]) {
    for (const source of [
      "import './mutable.mjs';",
      "export * as provider from './mutable.mjs';",
      "const later = () => import /* delayed */ ('./mutable.mjs');"
    ]) {
      const descriptor = Object.freeze({
        url: 'https://provider.example/adapter.mjs',
        integrity: integrity(source),
        sessionId: 'closed-graph-regression',
        surfaceId: 'remoteSurface:regression'
      });
      for (const dependency of ['globalThis.provider = "original";', 'globalThis.compromised = true;']) {
        const requests = [];
        let scriptCreations = 0;
        const loader = createLoader({
          documentTarget: {
            createElement() { scriptCreations++; throw new Error('Rejected graphs must not execute'); },
            head: { appendChild() { throw new Error('Rejected graphs must not attach'); } }
          },
          fetch: async (url) => {
            requests.push(url);
            return new Response(url === descriptor.url ? source : dependency);
          }
        });
        await assert.rejects(loader(descriptor), /self-contained/);
        assert.deepEqual(requests, [descriptor.url], 'dependency is never fetched');
        assert.equal(scriptCreations, 0, 'refusal precedes native module graph loading');
      }
    }
  }
});

test('import-like text remains valid in a self-contained artifact', async () => {
  const source = `// import './mutable.mjs';
    const text = "import('./mutable.mjs')";
    const pattern = /import\\(/;
    export { text, pattern };`;
  await verifyAdapterBytes({url: 'https://provider.example/adapter.mjs', integrity: integrity(source)}, {
    fetch: async () => new Response(source)
  });
});

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
