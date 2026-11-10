'use strict';
const path = require('node:path'), fs = require('node:fs'), { createHash } = require('node:crypto');
const { createManifest } = require('./reference.cjs');
const root = path.resolve(__dirname, '../..');
function createBuildInput(framework, outputDir, extra = {}) {
  let source = 'development/rmtx-a02/repeated-filters.rmt', bindings = require('../rmtx-a02/repeated-filters').repeatedBindings(), manifest = framework === 'mixed' ? null : createManifest(framework);
  if (framework === 'mixed') {
    source = 'development/rmtx-a02/controlled-filters.rmt'; bindings = JSON.parse(fs.readFileSync(path.join(root, 'development/rmtx-a02/bindings.v1.json')));
    const manifests = ['react', 'vue'].map(kind => createManifest(kind));
    manifest = { schema: manifests[0].schema, providers: [], hosts: [] };
    bindings.bindings.forEach((row, index) => {
      row.binding.address.declarationId = 'mixed-filter-' + index;
      const provider = manifests[index].providers[0], host = manifests[index].hosts[0];
      provider.entry.module = `./development/rmtx-a04/providers/controlled-${provider.framework}-panel.mjs`;
      provider.integrity.sha256 = createHash('sha256').update(fs.readFileSync(path.join(root, provider.entry.module))).digest('hex');
      host.declarationId = row.binding.address.declarationId; host.ownerSurface = row.surface;
      host.capabilityRequirements.required.events = Object.keys(row.binding.intents);
      manifest.providers.push(provider); manifest.hosts.push(host);
    });
  }
  return { source, xtensionBindings: bindings, xtensionComposition: manifest, orchestration: 'strict', kernel: 'strict', hydration: 'off', validation: 'off', transitions: 'off', profile: 'debug', lazy: 'none', out: outputDir, ...extra };
}
async function buildIntegratedReference(framework, outputDir, extra = {}) {
  return require('../../xtend-maraca').buildMaracaBundleAsync(createBuildInput(framework, outputDir, extra), { rootDir: root });
}
module.exports = { createBuildInput, buildIntegratedReference };
