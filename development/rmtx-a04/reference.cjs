'use strict';
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
function createManifest(framework) {
  const module = `./development/rmtx-a04/providers/${framework}-panel.mjs`;
  return { schema: 'xtend.maraca.xtension-composition-manifest.v1', providers: [{ id: `${framework}-filter`, framework, version: '1.0.0', entry: { module, exportName: 'createPanel' },
    integrity: { sha256: createHash('sha256').update(fs.readFileSync(path.join(root, module))).digest('hex') },
    peers: framework === 'react' ? { react: '18.3.1', 'react-dom': '18.3.1' } : { vue: '3.5.43' } }],
    hosts: [{ declarationId: 'filter-panel', providerId: `${framework}-filter`, ownerSurface: 'filter', capabilityRequirements: {
      schema: 'xtend.xtensions.host-capability-requirements.v1', framework, required: { features: ['kernel.lifecycle', 'fabric.boundary', 'surface.lifecycle', 'work.bounded'], work: ['scan'], events: ['change'] }, optional: { features: ['render.ssr'] }
    } }] };
}
function buildReference(plan, outputDir, framework) {
  return require('../../xtend-maraca/xtension-composition').buildMaracaXTensionComposition({ plan, outputDir, rootDir: root, manifest: createManifest(framework), bindingsRuntime: require('../../tools/xtensions/state-binding') });
}
function createPlan() {
  return require('../../xtend-maraca').createMaracaBuildPlan({ source: 'development/rmtx-a02/repeated-filters.rmt', xtensionBindings: require('../rmtx-a02/repeated-filters').repeatedBindings(),
    orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off' }, { rootDir: root, inspectToolchain: false });
}
module.exports = { createManifest, buildReference, createPlan };
