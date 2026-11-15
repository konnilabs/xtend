'use strict';
const path = require('node:path'), fs = require('node:fs');
const reference = require('./two-host-reference.cjs');
const root = path.resolve(__dirname, '../..');
const API_VERSION = '1.0.0';
async function createInput(outputDir) {
  const { lowered, capture } = await reference.prepareCase();
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'providers/catalog.json')));
  const manifest = { schema: 'xtend.maraca.xtension-composition-manifest.v6', providers: capture.providers,
    modules: capture.providers.map(p => ({ module: p.entry.module, sha256: p.integrity.sha256 })),
    interfaces: catalog.interfaces.map(pin => ({ ...pin, providerId: capture.records.find(row => row.interfaceSha256 === pin.sha256).definition.providerId })),
    loading: { provider: 'on-mount', peers: 'shared' }, delivery: { schema: 'xtend.maraca.xtension-delivery-policy.v1', mode: 'same-origin-external-esm' },
    hosts: lowered.hosts.map(host => ({ declarationId: host.declarationId, providerId: host.providerId, ownerSurface: host.ownerSurface, targetSurface: host.targetSurface,
      interfaceVersion: host.interfaceVersion, interfaceSha256: host.interfaceSha256, intents: host.intents,
      capabilityRequirements: { schema: 'xtend.xtensions.host-capability-requirements.v1', framework: host.framework,
        required: { features: ['kernel.lifecycle', 'fabric.boundary', 'surface.lifecycle', 'props.controlled'], events: Object.keys(host.intents), work: ['inspect'] } } })) };
  return { source: 'development/rmtx-a06/two-host.rmt', out: path.resolve(outputDir), profile: 'production', orchestration: 'strict', kernel: 'strict',
    hydration: 'off', validation: 'off', transitions: 'off', pwa: false, services: false, lazy: false, xtensionBindings: lowered.bindings, xtensionComposition: manifest };
}
async function build(outputDir) { return require('../../xtend-maraca').buildMaracaBundleAsync(await createInput(outputDir), { rootDir: root }); }
module.exports = { API_VERSION, createInput, build };
