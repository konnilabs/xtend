// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto'), { gzipSync } = require('node:zlib');
const SCHEMA = 'xtend.maraca.size-budget-report.v2';
const captures = new WeakMap();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function register(plan, { composition, sourceFiles, bindingsRuntime }) {
  const { validateArtifact } = require('./xtension-composition-contract.mjs');
  validateArtifact(composition.artifact, plan, bindingsRuntime);
  const captured = structuredClone({ composition, sourceFiles });
  const providerPaths = Object.fromEntries(composition.artifact.manifest.providers.map(provider => {
    const file = path.resolve(plan.rootDir, provider.entry.module);
    let physicalPath = file; try { physicalPath = fs.realpathSync(file); } catch (_) {}
    return [provider.id, physicalPath];
  }));
  captures.set(plan, { ...captured, providerPaths, bindingsRuntime });
}
function bindFiles(plan, files) {
  const capture = captures.get(plan);
  if (!capture) throw new TypeError('Missing XTension source capture.');
  capture.outputRoot = fs.realpathSync(plan.outputDir);
  capture.outputs = files.map(file => ({ fileName: file.fileName, path: path.resolve(file.path), appServiceBytes: file.appServiceBytes || 0 }));
}
function apply(plan, legacy, bundleFiles) {
  const capture = captures.get(plan);
  if (!capture?.outputs) throw new TypeError('Integrated size accounting requires the actual regular-build source capture; a serialized plan/report is not build evidence.');
  const { validateArtifact } = require('./xtension-composition-contract.mjs');
  const artifact = validateArtifact(capture.composition.artifact, plan, capture.bindingsRuntime);
  const outputPath = file => path.resolve(plan.rootDir, file.path);
  if (!Array.isArray(bundleFiles) || bundleFiles.length !== capture.outputs.length || bundleFiles.some(file => !capture.outputs.some(expected => expected.fileName === file.fileName && expected.path === outputPath(file) && expected.appServiceBytes === (file.appServiceBytes || 0)))) throw new TypeError('Budget file membership differs from the actual build.');
  if (fs.realpathSync(plan.outputDir) !== capture.outputRoot) throw new TypeError('The output root differs from the actual build.');
  const outputRoot = capture.outputRoot, seen = new Set(), contents = new Map();
  const files = (bundleFiles || []).map(file => {
    if (typeof file.fileName !== 'string' || path.isAbsolute(file.fileName) || file.fileName.split(/[\\/]/u).some(part => !part || part === '..') || seen.has(file.fileName)) throw new TypeError('Size accounting requires unique, relative output files.');
    seen.add(file.fileName);
    const target = fs.realpathSync(outputPath(file)), relative = path.relative(outputRoot, target);
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative) || !fs.statSync(target).isFile()) throw new TypeError('Budgeted output must remain in the actual output directory.');
    const bytes = fs.readFileSync(target);
    if (file.bytes !== bytes.length || !Number.isSafeInteger(file.appServiceBytes || 0) || (file.appServiceBytes || 0) < 0 || (file.appServiceBytes || 0) > bytes.length) throw new TypeError('Budget metadata does not match the emitted file bytes.');
    contents.set(file.fileName, bytes);
    return { fileName: file.fileName, bytes: bytes.length, sha256: hash(bytes) };
  }).sort((a, b) => a.fileName.localeCompare(b.fileName));
  for (const record of capture.composition.files) {
    const file = files.find(file => file.fileName === record.fileName);
    if (!file || file.bytes !== record.bytes || file.sha256 !== record.sha256) throw new TypeError('XTension output differs from its captured build provenance.');
  }
  if (!capture.baseline) {
    const loaderCandidates = [path.resolve(__dirname, '../xtend-loader.js')];
    try { loaderCandidates.push(path.join(path.dirname(require.resolve('@ccslabs/xtend', { paths: [plan.rootDir, __dirname] })), 'xtend-loader.js')); } catch (_) {}
    const loaderPath = loaderCandidates.find(file => fs.existsSync(file));
    if (!loaderPath) throw new TypeError('The comparable legacy loader source is unavailable.');
    const legacyPaths = new Set();
    function uniqueSourceBytes(files) {
      let bytes = 0;
      for (const file of files.filter(Boolean)) {
        const physical = fs.realpathSync(file);
        if (legacyPaths.has(physical)) continue;
        legacyPaths.add(physical); bytes += fs.statSync(physical).size;
      }
      return bytes;
    }
    const loaderBytes = uniqueSourceBytes([loaderPath]);
    const selectedComponentBytes = uniqueSourceBytes(plan.components.selected.map(row => row.absolutePath));
    const stackModuleBytes = uniqueSourceBytes((plan.stackModules || []).map(row => row.absolutePath));
    const contractPayloadBytes = legacy.baseline.contractPayloadBytes;
    const legacyBytes = loaderBytes + selectedComponentBytes + stackModuleBytes + contractPayloadBytes;
    capture.baseline = { loaderBytes, selectedComponentBytes, stackModuleBytes, contractPayloadBytes, legacyBytes, legacyPaths };
  }
  const { loaderBytes, selectedComponentBytes, stackModuleBytes, contractPayloadBytes, legacyBytes, legacyPaths } = capture.baseline;
  const sourceFiles = [], sourcePaths = new Set(), sourceNames = new Set();
  for (const source of capture.sourceFiles) {
    // These facts were captured by the actual platform bundler, before transform.
    if (sourcePaths.has(source.absolutePath) || sourceNames.has(source.source) || !Number.isSafeInteger(source.bytes) || source.bytes < 0 || !/^[a-f0-9]{64}$/u.test(source.sha256)) throw new TypeError('Invalid or duplicate captured platform source.');
    sourcePaths.add(source.absolutePath); sourceNames.add(source.source);
    sourceFiles.push({ source: source.source, bytes: source.bytes, sha256: source.sha256, additional: !legacyPaths.has(source.absolutePath) });
  }
  const graph = ['xtend.maraca.xtension-composition-artifact.v3', 'xtend.maraca.xtension-composition-artifact.v4'].includes(artifact.schema);
  for (const provider of graph ? artifact.modules : artifact.providers) {
    const bytes = contents.get(provider.fileName);
    if (!bytes || hash(bytes) !== (graph ? provider.outputSha256 : provider.sha256)) throw new TypeError('Missing captured provider bytes.');
    const sourcePath = graph ? path.resolve(fs.realpathSync(plan.rootDir), provider.module) : capture.providerPaths[provider.id];
    if (!sourcePaths.has(sourcePath)) {
      sourcePaths.add(sourcePath);
      sourceFiles.push({ source: 'provider/' + (graph ? provider.module.slice(2) : provider.id), bytes: graph ? provider.sourceBytes : bytes.length, sha256: provider.sha256, additional: !legacyPaths.has(sourcePath) });
    }
  }
  sourceFiles.sort((a, b) => a.source.localeCompare(b.source));
  const contract = Buffer.from(JSON.stringify(artifact));
  const sourceBytes = sourceFiles.reduce((sum, row) => sum + row.bytes, 0);
  const additionalSourceBytes = sourceFiles.filter(row => row.additional).reduce((sum, row) => sum + row.bytes, 0);
  const runtimeFiles = files.filter(file => capture.composition.files.some(row => row.fileName === file.fileName));
  const runtimeBytes = runtimeFiles.reduce((sum, file) => sum + file.bytes, 0);
  const runtimeGzipBytes = runtimeFiles.reduce((sum, file) => sum + gzipSync(contents.get(file.fileName), { level: 9 }).length, 0);
  const baselineBytes = legacyBytes + additionalSourceBytes + contract.length;
  const bundleBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const frameworkBytes = Math.max(0, bundleBytes - legacy.appServices.clientBytes - legacy.microkernel.bytes);
  const ownBaseline = sourceBytes + contract.length, ownWithinBudget = runtimeBytes < ownBaseline;
  const enforced = plan.profile !== 'debug' && legacy.mode === 'strict';
  const frameworkWithinBudget = frameworkBytes < baselineBytes;
  const ok = (!enforced || frameworkWithinBudget && ownWithinBudget) && legacy.css.withinBudget && legacy.appServices.withinBudget;
  const status = !legacy.css.withinBudget ? 'css_over_budget' : !legacy.appServices.withinBudget ? 'app_services_over_budget'
    : enforced ? (!ownWithinBudget ? 'xtensions_over_budget' : frameworkWithinBudget ? 'within_budget' : 'over_budget') : legacy.status;
  return { ...legacy, schema: SCHEMA, ok, status, baselineBytes, bundleBytes,
    baseline: { ...legacy.baseline, mode: 'legacy-plus-captured-xtension-sources-and-contract', loaderBytes, selectedComponentBytes, stackModuleBytes, contractPayloadBytes, legacyBytes, xtensionSourceBytes: additionalSourceBytes, xtensionContractBytes: contract.length, bytes: baselineBytes },
    framework: { bytes: frameworkBytes, baselineBytes, withinBudget: frameworkWithinBudget }, ratio: frameworkBytes / baselineBytes,
    budgets: { ...legacy.budgets, frameworkBytes: baselineBytes },
    accounting: { scope: 'listed-bundle-files', metadataIncluded: true, externalFrameworkPeersIncluded: false, files },
    xtensions: { enforced, withinBudget: ownWithinBudget, baselineBytes: ownBaseline, sourceBytes, contractBytes: contract.length, runtimeBytes, runtimeGzipBytes,
      buildEvidenceBytes: files.find(file => file.fileName === 'xtend.xtensions.report.json')?.bytes || 0,
      sourceFingerprint: hash(JSON.stringify({ sourceFiles, contractSha256: hash(contract) })), contractSha256: hash(contract), sourceFiles, runtimeFiles }
  };
}
module.exports = { SCHEMA, register, bindFiles, apply };
