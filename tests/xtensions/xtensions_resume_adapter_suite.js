const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { readJson, resolveRootDir } = require('../utils/files');
const {
  XTENSIONS_RESUME_ADAPTER_SCHEMA,
  XTENSIONS_RESUME_MANIFEST_SCHEMA,
  XTENSIONS_RESUME_RESULT_SCHEMA,
  normalizeXTensionResumeManifest,
  createXTensionResumeAdapter
} = require('../../tools/xtensions/resume-adapter-contract');

function validManifest(overrides = {}) {
  return {
    id: 'erp.react.orders',
    clientEntry: './client.mjs',
    serverEntry: './server.mjs',
    bundleIntegrity: 'sha256-test',
    snapshotSchema: 'erp.react.orders.snapshot.v1',
    adoptionStrategy: 'dom_hydrate',
    ...overrides
  };
}

async function runXTensionsResumeAdapterSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'xtensions-resume-adapter', label: 'XTensions Resume Adapter Contract' });
  const packageManifest = readJson('package.json', rootDir);
  const manifest = normalizeXTensionResumeManifest(validManifest());
  context.assert(manifest.ok === true && manifest.schema === XTENSIONS_RESUME_MANIFEST_SCHEMA, 'complete resume manifest normalizes');
  context.assert(normalizeXTensionResumeManifest(validManifest({ serverEntry: '' })).ok === false, 'resume manifest rejects missing server entry');
  context.assert(normalizeXTensionResumeManifest(validManifest({ adoptionStrategy: 'mount' })).ok === false, 'resume manifest rejects mount as adoption strategy');

  const target = { id: 'existing-node' };
  let adoptedTarget = null;
  const adapter = createXTensionResumeAdapter({
    manifest,
    controller: {
      adopt(node, props, resumeContext) {
        adoptedTarget = node;
        return { status: 'dom_hydrated', generation: resumeContext.generation, nodeIdentityPreserved: true, metadata: { props } };
      }
    },
    hydrate(node) {
      return { generation: 'fallback-1', nodeIdentityPreserved: node === target };
    }
  });
  context.assert(adapter.schema === XTENSIONS_RESUME_ADAPTER_SCHEMA, 'adapter exposes public resume schema');
  const resumed = await adapter.adopt(target, { orderId: 7 }, { generation: 'g-1' });
  context.assert(resumed.schema === XTENSIONS_RESUME_RESULT_SCHEMA && resumed.status === 'resumed', 'DOM hydration adoption normalizes to resumed');
  context.assert(adoptedTarget === target && resumed.nodeIdentityPreserved === true, 'adoption receives and preserves the existing target node');
  const fallback = await adapter.fallbackHydrate(target, {}, {});
  context.assert(fallback.status === 'fallback_hydrated', 'explicit fallback is reported separately from resume');

  const remount = createXTensionResumeAdapter({
    manifest,
    controller: { adopt() { return { status: 'mounted' }; } }
  });
  const remountResult = await remount.adopt(target);
  context.assert(remountResult.status === 'rejected' && remountResult.diagnostics.some((entry) => entry.code === 'xtensions.resume.remount_reported'), 'mounted is never normalized as resumed');
  const missingAdopt = await createXTensionResumeAdapter({ manifest, controller: {} }).adopt(target);
  context.assert(missingAdopt.status === 'rejected', 'controller without adopt fails closed');
  context.assert(packageManifest.exports['./xtensions/resume-adapter-contract'].default === './tools/xtensions/resume-adapter-contract.js', 'package exports resume adapter runtime');
  context.assert(packageManifest.exports['./xtensions/resume-adapter-contract'].types === './tools/xtensions/resume-adapter-contract.d.ts', 'package exports resume adapter types');
  context.assert(packageManifest.scripts['test:xtensions-resume-adapter'] === 'node scripts/run_xtend_tests.js xtensions-resume-adapter', 'package exposes resume adapter gate');
  return context.result({ schema: 'xtend.xtensions.resume-adapter-report.v1' });
}

function printXTensionsResumeAdapterReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Resume Adapter erfolgreich.',
    failureTitle: 'XTensions Resume Adapter fehlgeschlagen:'
  });
}

module.exports = { printXTensionsResumeAdapterReport, runXTensionsResumeAdapterSuite };
