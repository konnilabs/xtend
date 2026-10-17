'use strict';
// One Core receipt envelope. Raw source/consumer reports stay immutable members;
// existing artifact, scanner, gate and GitHub validators retain their duties.
const fs = require('node:fs'), path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const { digest, artifactFile, releaseSetIntegrity } = require('./artifact.cjs');
const { check } = require('./inventory.cjs');
const { PROFILE, EVIDENCE, lanes, gates, coreContract } = require('./profile.cjs');
const { verifyNeeds } = require('./github.cjs');
const { verifyInstalledClosure } = require('../../candidate-integrity.cjs');
const { consumerScopes } = require('./candidates.cjs');
function boundJSON(directory, binding) {
  check(typeof binding?.file === 'string' && /^sha512-[A-Za-z0-9+/]{86}==$/.test(binding.integrity || ''),
    'Exact Core evidence member binding required');
  const bytes = fs.readFileSync(artifactFile(directory, binding.file));
  check(digest(bytes) === binding.integrity, 'Core evidence member digest mismatch');
  return JSON.parse(bytes);
}
function verifyConsumer(report, lock, { artifact, node, now, startedAt, directory, candidateSDKLock }) {
  check(report.schema === 'xtend.release.canary.v1' && report.profile === PROFILE && !Object.hasOwn(report, 'demoSha') &&
    report.ok === true && report.sourceSha === artifact.sourceSha && report.tarballSetIntegrity === releaseSetIntegrity(artifact.manifest) &&
    isDeepStrictEqual(report.toolchain, artifact.toolchain) && report.runtime?.node === node && report.runtime?.npm === artifact.toolchain.npm,
    'Core consumer source/profile/producer-toolchain/runtime mismatch');
  const start = Date.parse(report.startedAt), end = Date.parse(report.finishedAt);
  check(Number.isFinite(start) && Number.isFinite(end) && start <= end && start >= Date.parse(startedAt) &&
    end <= now + 1000 && now - end <= 3600000, 'Core consumer is not fresh at original seal time');
  check(report.lockIntegrity === digest(Buffer.from(JSON.stringify(lock))) && lock.packages?.[''], 'Core raw installed lock binding mismatch');
  check(report.buildEvidenceIntegrity === require('./contracts.cjs').buildCanaryIntegrity(artifact.buildEvidence),
    'Core consumer compact build digest mismatch');
  check(Array.isArray(report.packages) && report.packages.length === artifact.packages.length &&
    new Set(report.packages.map(item => item.name)).size === artifact.packages.length && report.runtimeImports === true,
    'Core consumer package/runtime coverage incomplete');
  for (const entry of artifact.packages) {
    const actual = report.packages.find(item => item.name === entry.name);
    check(actual?.integrity === entry.integrity && ['consumerInstall','entrypoints','types','bin','files'].every(key => actual[key] === true),
      'Core installed consumer missing required check: ' + entry.name);
  }
  const original = boundJSON(directory, artifact.manifest.candidateBinding);
  coreContract(original, require('./profile.cjs').CANDIDATES);
  const [sdkScope, releaseScope] = consumerScopes(artifact, original);
  // Preserve the generic candidate lock validator's metadata, transitive
  // namespace/link rejection and exact closure checks for BOTH installations.
  verifyInstalledClosure(lock, releaseScope.manifest,
    { app: releaseScope.app, registryPackages: releaseScope.registryPackages });
  check(report.resolution === true && report.packages.every(item => item.resolution === true),
    'Selected release live isolated dependency resolution proof missing');
  const sdk = report.candidateSDK;
  check(sdk?.ok === true && sdk.runtimeImports === true && sdk.resolution === true &&
    sdk.lockIntegrity === digest(Buffer.from(JSON.stringify(candidateSDKLock))) &&
    Array.isArray(sdk.packages) && sdk.packages.length === sdkScope.packages.length &&
    new Set(sdk.packages.map(item => item.name)).size === sdkScope.packages.length &&
    isDeepStrictEqual(sdk.registryDependencies, []), 'Independent all-ten installed SDK evidence incomplete');
  verifyInstalledClosure(candidateSDKLock, sdkScope.manifest, { app: sdkScope.app });
  for (const entry of sdkScope.packages) {
    const actual = sdk.packages.find(item => item.name === entry.name);
    check(actual?.integrity === entry.integrity &&
      ['consumerInstall','entrypoints','types','bin','files','resolution'].every(key => actual[key] === true),
      'All-ten SDK candidate lacks real installed checks: ' + entry.name);
  }
  check(sdk.mcpKnowledgeGenerated === true && sdk.mcpKnowledgeChecked === true,
    'All-ten SDK MCP generation/check proof missing');
  check(isDeepStrictEqual(report.registryDependencies, artifact.registryDependencies.map(item => ({...item,consumerInstall:true}))),
    'Core consumer registry closure proof differs from pinned dependency identities');
  if (artifact.order.includes('@ccslabs/xtend-mcp')) check(report.mcpKnowledgeGenerated === true && report.mcpKnowledgeChecked === true,
    'Core MCP generation/check evidence missing');
}
function verifyCoreEvidenceEnvelope(artifact, envelope, { directory, evidenceDirectory = directory, now = Date.parse(envelope.sealedAt) }) {
  coreContract(envelope, EVIDENCE);
  check(envelope.sourceSha === artifact.sourceSha && envelope.repository === 'konnilabs/xtend' &&
    envelope.workflow === '.github/workflows/xtend-default-gates.yml' && /^[1-9][0-9]*$/.test(envelope.context?.runId || '') &&
    /^[1-9][0-9]*$/.test(envelope.context?.runAttempt || '') &&
    Number.isFinite(now) && envelope.sealedAt === new Date(now).toISOString(), 'Core evidence verification-time/source/context mismatch');
  check(envelope.candidateIntegrity === artifact.manifest.candidateBinding.integrity &&
    envelope.buildIntegrity === artifact.manifest.buildEvidence.integrity && envelope.tarballSetIntegrity === artifact.tarballSetIntegrity,
    'Core evidence candidate/build/selected archive binding mismatch');
  verifyNeeds(envelope.needs);
  check(envelope.security?.node==='24.18.0'&&envelope.security.job==='Core security browser (Node 24.18.0)'&&
    envelope.security.report?.file==='core-evidence/security/security-execution.json',
    'Mandatory single Node24 Core browser evidence absent; both package consumer lanes still required');
  check(isDeepStrictEqual(Object.keys(envelope.requiredGates).sort(), [...gates].sort()) &&
    gates.every(name => envelope.requiredGates[name] === 'success'), 'Core required gate mapping missing or changed');
  check(Array.isArray(envelope.lanes) && envelope.lanes.length === lanes.length &&
    new Set(envelope.lanes.map(lane => lane.node)).size === lanes.length, 'Both Core consumer lanes required');
  for (const node of lanes) {
    const lane = envelope.lanes.find(item => item.node === node); check(lane, 'Missing Core runtime lane: ' + node);
    verifyConsumer(boundJSON(evidenceDirectory,lane.consumer),boundJSON(evidenceDirectory,lane.lock),
      { artifact,node,now,startedAt:artifact.manifest.preparedAt,directory,
        candidateSDKLock:boundJSON(evidenceDirectory,lane.candidateSDKLock) });
    const source = boundJSON(evidenceDirectory,lane.sourceReport);
    check(source.format === 2 && source.profile === PROFILE && source.sourceSha === artifact.sourceSha && source.ok === true &&
      source.validation?.valid === true && source.validation.errors?.length === 0 &&
      isDeepStrictEqual(source.productiveSource, envelope.source.provenance), 'Core strict source/projection report mismatch');
    check(source.schemaSuite?.id === 'schema-inventory' && source.schemaSuite.ok === true &&
      Array.isArray(source.schemaSuite.failures) && source.schemaSuite.failures.length === 0 &&
      Array.isArray(source.schemaSuite.skips) && source.schemaSuite.skips.length === 0 &&
      source.schemaSuite.report?.profile === PROFILE &&
      source.inventorySha256 === envelope.source.inventorySha256 && source.policySha256 === envelope.source.policySha256 &&
      source.schemaSuite.report.inventorySha256 === source.inventorySha256 &&
      source.schemaSuite.report.policySha256 === source.policySha256 &&
      isDeepStrictEqual(source.schemaSuite.report.productiveSource, envelope.source.provenance) &&
      isDeepStrictEqual(source.candidateAuthority, envelope.source.candidateAuthority),
      'Full Core schema suite, authority and all negative assertions required; compact scan alone is insufficient');
    check(Date.parse(source.startedAt) >= Date.parse(artifact.manifest.preparedAt) &&
      Date.parse(source.finishedAt) >= Date.parse(source.startedAt) && Date.parse(source.finishedAt) <= now + 1000 &&
      now - Date.parse(source.finishedAt) <= 3600000, 'Core strict source report not fresh at original seal');
  }
  // Authentication and full single-repository source rehydration are required;
  // self-declared successful job status or a matrix aggregate is insufficient.
  require('./core-auth.cjs').verifyStoredAuthentication(envelope,{directory:evidenceDirectory,artifact});
  return envelope;
}
function verifyCoreEvidence(artifact, { directory }) {
  const envelope = boundJSON(directory, artifact.manifest.coreEvidence);
  check(envelope.sealedAt === artifact.manifest.sealedAt, 'Stored Core evidence must retain original sealedAt');
  // Wallclock progress must never refresh old immutable reports. Fresh resume
  // evidence is verified separately by seal(), without changing these bytes.
  return verifyCoreEvidenceEnvelope(artifact,envelope,{directory,now:Date.parse(artifact.manifest.sealedAt)});
}
module.exports = { boundJSON, verifyConsumer, verifyCoreEvidence, verifyCoreEvidenceEnvelope };
