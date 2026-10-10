'use strict';
const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { check } = require('./inventory.cjs');
const sri = value => /^sha512-[A-Za-z0-9+/]{86}==$/.test(value || '');
const sha = value => /^[a-f0-9]{40}$/.test(value || '');
const iso = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) &&
  new Date(Date.parse(value)).toISOString() === value;
function buildCommands(mcpKnowledge = true) {
  const commands = [['scripts', 'build:components'], ['scripts', 'build:rmt-esm-entrypoints'], ['scripts', 'build:html-sanitizer']];
  if (mcpKnowledge) commands.push(['node', 'products/xtend-mcp/scripts/build-knowledge.mjs'],
    ['node', 'products/xtend-mcp/scripts/build-knowledge.mjs', '--check', '--quiet']);
  return commands;
}
// Existing consumer meaning: compact JSON.stringify(parsedBuild), NOT raw-file
// SRI and NOT a key-sorted digest. The raw file has its separate manifest SRI.
const buildCanaryIntegrity = build => `sha512-${crypto.createHash('sha512').update(JSON.stringify(build)).digest('base64')}`;
function verifyBuildCommands(build, { mcpSelected }) {
  check(typeof build.mcpKnowledgeGenerated === 'boolean' && typeof build.mcpKnowledgeChecked === 'boolean' &&
    build.mcpKnowledgeGenerated === build.mcpKnowledgeChecked, 'Build knowledge flags must be explicit and consistent');
  check(!mcpSelected || build.mcpKnowledgeGenerated, 'Explicit MCP knowledge generation/check must precede packing');
  check(isDeepStrictEqual(build.commands, buildCommands(build.mcpKnowledgeGenerated)),
    'Production build commands must match the exact ordered build/knowledge contract');
}
function verifyEnvelopePhase(manifest, { phase, requireCanary, packageCount, now = Date.now() }) {
  check(['primitive', 'adapted', 'prepared', 'sealed'].includes(phase), 'Unknown artifact validation phase');
  // Explicit primitive mode supports isolated archive/registry unit fixtures;
  // it is never enrolled as a sealed artifact usable by the publisher.
  if (phase === 'primitive') return false;
  const binding = manifest.candidateBinding;
  check(binding?.file === 'manifest.json' && sri(binding.integrity) && sha(binding.demoSha) &&
    Array.isArray(binding.allPackages) && binding.allPackages.length === packageCount,
    'Production artifact requires the complete original candidate byte binding');
  check(manifest.buildEvidence?.file === 'build.json' && sri(manifest.buildEvidence.integrity),
    'Production artifact requires the original raw build.json SRI');
  check(Array.isArray(manifest.registryDependencies) && Array.isArray(manifest.bootstrapPackages) &&
    new Set(manifest.bootstrapPackages).size === manifest.bootstrapPackages.length &&
    manifest.bootstrapPackages.every(name => manifest.selection?.packages?.includes(name)),
    'Production artifact requires explicit registry/bootstrap fields');
  if (phase === 'adapted') {
    check(!requireCanary && !Object.hasOwn(manifest, 'preparedAt') && !Object.hasOwn(manifest, 'canary') &&
      !Object.hasOwn(manifest, 'sealedAt') && !Object.hasOwn(manifest, 'productEvidence'), 'Adapted artifact phase mismatch');
    return true;
  }
  check(iso(manifest.preparedAt) && Date.parse(manifest.preparedAt) <= now + 1000,
    'Prepared artifact requires a canonical producer timestamp');
  if (phase === 'prepared') {
    check(!Object.hasOwn(manifest, 'sealedAt') && !Object.hasOwn(manifest, 'productEvidence'), 'Prepared artifact contains sealed fields');
  } else {
    check(requireCanary && iso(manifest.sealedAt) && Date.parse(manifest.sealedAt) >= Date.parse(manifest.preparedAt) &&
      Date.parse(manifest.sealedAt) <= now + 1000, 'Sealed artifact phase/timestamp mismatch');
    check(Array.isArray(manifest.productEvidence) && manifest.productEvidence.length === 2 &&
      ['24.18.0', '26.5.0'].every(node => manifest.productEvidence.filter(lane => lane.node === node).length === 1) &&
      manifest.productEvidence.every(lane => typeof lane.file === 'string' && sri(lane.integrity)),
      'Sealed artifact requires both bound product lanes');
  }
  if (requireCanary) check(typeof manifest.canary?.file === 'string' && sri(manifest.canary.integrity), 'Prepared/sealed artifact requires bound canary');
  return true;
}
module.exports = { buildCommands, buildCanaryIntegrity, verifyBuildCommands, verifyEnvelopePhase };
