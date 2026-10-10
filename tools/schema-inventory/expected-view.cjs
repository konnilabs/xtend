'use strict';
const crypto = require('node:crypto');
const ownership = require('./ownership.cjs');
const {assertSourceProvider} = require('./source-provider.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const equal = (a,b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
const check = (condition, message) => { if (!condition) throw Error(message); };
const approved = Object.freeze({
  core: 'd6866aabeda550e577e0871b11242cb263f8bed74420fc5c95797f7703a01e37',
  demo: 'fa24da7838b82c89a1afede37b42fa87ecb0c584093e87847a28b5c35f156547',
  ledger: '40a4e1d38dbf9e64a724d69178803768e6bff22c90c8260f5644916c24e127c8',
  overlay: '6cf0062f99130ff59bb858fbb8c812fa81604f3c4f9a72694c80f010df59f29b',
  authorityBindings: 'b592726800e8a7f4d52e6217fe5aa1c2efd70e8f7907723f4915fa828801589d'
});
// This internal pure assembler consumes EXPECTED records only. The productive
// entry point below authenticates their bytes through a verified source provider.
function assembleExpectedView({core, demo, ledger, selection, authorityBindings, overlay, resolvePath}) {
  check(hash(Buffer.from(JSON.stringify(stable(core)))) === '47a5cfb03b8b3d442039c3410d4fa46ac3944fa04f12729b0252cc416f7a86f1', 'Unreviewed Core expected record mutation');
  check(hash(Buffer.from(JSON.stringify(stable(demo)))) === '3da9857f0f6ef79bb60e048296f3f411719006c79174a33d06468a2def7e2135', 'Unreviewed Demo expected record mutation');
  const preservedLedger = JSON.parse(require('node:zlib').gunzipSync(require('node:fs').readFileSync(require('node:path').join(__dirname,'ownership-ledger.json.gz'))));
  check(equal(ledger,preservedLedger), 'Original expected ledger mutation');
  const localInput = (name, digest) => {
    const bytes = require('node:fs').readFileSync(require('node:path').join(__dirname,name));
    check(hash(bytes) === digest, 'Reviewed local expected input bytes changed: '+name);
    return JSON.parse(bytes);
  };
  check(equal(overlay,localInput('command-lexical-overlay.json',approved.overlay)), 'Reviewed expected overlay input changed');
  check(equal(authorityBindings,localInput('authority-bindings.json',approved.authorityBindings)), 'Reviewed expected authority bindings changed');
  ownership.assertSelection(selection);
  ownership.verifySelectedGovernance(core); ownership.verifySelectedGovernance(demo.governance);
  check(demo.ledgerSha256 === approved.ledger && demo.governanceLedgerSha256 === approved.ledger, 'Expected owner ledger binding changed');
  check(equal(demo.selection, selection), 'Missing or changed Demo selection');
  check(demo.entries.length === selection.length && new Set(demo.entries.map(entry => entry.schemaId)).size === selection.length, 'Missing or duplicate owner record');
  const byId = document => new Map(document.entries.map(entry => [entry.schemaId,entry]));
  const coreMap = byId(core), demoMap = byId(demo), ledgerMap = byId(ledger);
  // Reuse the established owner conservation checks on approved expected records;
  // this does NOT claim that these expected records are observed scan evidence.
  ownership.validateOwner({entries: core.entries}, core, 'core');
  ownership.validateOwner({entries: demo.entries}, demo, 'demo');
  ownership.verifyUnion({entries: core.entries}, {entries: demo.entries});
  for (const familyId of new Set(selection.map(id => ledgerMap.get(id).familyId))) {
    check(equal(core.schemaFamilies.find(f => f.familyId === familyId), ledger.schemaFamilies.find(f => f.familyId === familyId)), 'Historical expected family changed');
  }
  function translate(value, owner, id) {
    if (Array.isArray(value)) return value.map(item => translate(item,owner,id));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => {
      if (key === 'path' && typeof item === 'string') return [key, pathFor(item,owner,id)];
      if (key === 'sourcePaths') return [key,item.map(p => pathFor(p,owner,id))];
      return [key,translate(item,owner,id)];
    }));
    return value;
  }
  function pathFor(source,owner,id) {
    const prefix = 'imports/core/{CORE_SHA}/';
    if (owner === 'demo' && source.startsWith(prefix)) {
      const original = source.slice(prefix.length), binding = authorityBindings.find(b => b.oldSource === original);
      check(binding, 'Unapproved imported authority path');
      return resolvePath('core', original, binding.sourceSha256);
    }
    return resolvePath(owner,source);
  }
  const unique = values => [...new Map(values.map(value => [JSON.stringify(stable(value)),value])).values()].sort((a,b)=>JSON.stringify(stable(a)).localeCompare(JSON.stringify(stable(b))));
  const output = structuredClone(core);
  for (const id of selection) {
    const original = ledgerMap.get(id), c = coreMap.get(id), d = demoMap.get(id);
    check(original && c && d, 'Missing approved owner');
    const projected = [translate(c,'core',id),translate(d,'demo',id)];
    const result = output.entries.find(entry => entry.schemaId === id);
    const usages = new Map();
    for (const entry of projected) for (const usage of entry.usages) {
      const key = JSON.stringify([usage.application,usage.role,usage.visibility]);
      const merged = usages.get(key) || {...usage,sourcePaths:[],interfaceReferences:[]};
      merged.sourcePaths.push(...usage.sourcePaths); merged.interfaceReferences.push(...usage.interfaceReferences); usages.set(key,merged);
    }
    result.usages = ownership.normalizeUsages([...usages.values()].map(usage => ({...usage,sourcePaths:[...new Set(usage.sourcePaths)].sort(),interfaceReferences:unique(usage.interfaceReferences)})));
    const shapes = new Map();
    for (const entry of projected) for (const fingerprint of entry.shapeFingerprints) {
      const prior = shapes.get(fingerprint.hash);
      if (!prior) { shapes.set(fingerprint.hash,structuredClone(fingerprint)); continue; }
      check(equal(prior.shape,fingerprint.shape), 'Conflicting expected shape');
      prior.sourcePaths = [...new Set([...prior.sourcePaths,...fingerprint.sourcePaths])].sort();
      prior.symbols = [...new Set([...prior.symbols,...fingerprint.symbols])].sort();
      prior.evidence = unique([...prior.evidence,...fingerprint.evidence]);
      prior.evidenceTypes = [...new Set(prior.evidence.map(item => item.type))].sort();
      prior.completeness = prior.evidence.every(item => item.completeness === 'complete') ? 'complete' : 'partial';
      prior.authoritative = prior.evidence.some(item => item.authoritative === true);
    }
    result.shapeFingerprints = [...shapes.values()].sort((a,b)=>a.hash.localeCompare(b.hash));
    result.shapePolicy = structuredClone(original.shapePolicy);
    result.shapePolicy.acceptedFingerprints = [...new Set([...original.shapePolicy.acceptedFingerprints,...(id === overlay.schemaId ? overlay.variants.map(v=>v.hash) : [])])].sort();
    const currentCanonicals = projected.map(entry => entry.canonicalDefinition);
    const historical = original.canonicalDefinition;
    const originalOwnerCanonical = entry => entry.canonicalDefinition && {...entry.canonicalDefinition,path:entry.canonicalDefinition.path.replace(/^imports\/core\/\{CORE_SHA\}\//,'')};
    const historicalOwner = [c,d].findIndex(entry => equal(originalOwnerCanonical(entry),historical));
    let canonical = historicalOwner < 0 ? null : structuredClone(currentCanonicals[historicalOwner]);
    if (canonical) {
      check(result.usages.some(u=>u.sourcePaths.includes(canonical.path)), 'Missing historical canonical coverage');
    } else {
      // The only recorded canonical transfer not directly conserved by either
      // owner is this exact previously reviewed Material metadata projection.
      check(id === 'xtend.material.catfooding-report.v1' && equal(original.canonicalDefinition,{definitionType:'object-shape',path:'package.json',role:'producer',symbol:null,visibility:'internal'})
        && equal(d.canonicalDefinition,{path:'migration/source-core-package-metadata.txt',symbol:null,definitionType:'identifier-reference',role:'producer',visibility:'internal'}), 'Unexplained historical canonical projection: '+id+' '+JSON.stringify({historical:original.canonicalDefinition,currentCanonicals}));
      canonical = projected[1].canonicalDefinition;
    }
    result.canonicalDefinition = canonical;
    // Owner-local identifier-only is a fallback, not an additional global kind.
    // Retain the already accepted global classification; never infer it from a scan.
    result.kinds = structuredClone(original.kinds);
    result.status = original.status;
    for (const key of ['familyId','version','lifecycle','aliasOf','replacedBy','replacementDecision','releasedFingerprintSetHash']) check(equal(c[key],original[key]) && equal(d[key],original[key]), 'Expected history conflict: '+key);
  }
  for (const entry of core.entries) if (!selection.includes(entry.schemaId)) check(equal(entry,output.entries.find(item=>item.schemaId===entry.schemaId)), 'Unselected mutation');
  for (const key of Object.keys(core).filter(key=>key!=='entries')) check(equal(core[key],output[key]), 'Global expected governance mutation');
  return output;
}
function createExpectedInventory(provider) {
  assertSourceProvider(provider);
  const provenance = provider.provenance(), byOwner = new Map(provenance.bindings.map(row=>[row.owner+'\0'+row.sourcePath,row]));
  function read(owner,source) { const row=byOwner.get(owner+'\0'+source);check(row,'Missing approved expected owner source');return provider.readCurrent(row.logicalPath); }
  const coreBytes=read('core','tests/schemas/xtend-schema-inventory.json'),demoBytes=read('demo','tests/schemas/ownership-101.json');
  check(hash(coreBytes)===approved.core && hash(demoBytes)===approved.demo,'Unreviewed or tampered expected owner records');
  const ledgerBytes=require('node:zlib').gunzipSync(read('core','tools/schema-inventory/ownership-ledger.json.gz'));
  check(hash(ledgerBytes)===approved.ledger,'Original expected ledger changed');
  return assembleExpectedView({core:JSON.parse(coreBytes),demo:JSON.parse(demoBytes),ledger:JSON.parse(ledgerBytes),selection:JSON.parse(read('core','tools/schema-inventory/selection.json')),authorityBindings:JSON.parse(read('core','tools/schema-inventory/authority-bindings.json')),overlay:JSON.parse(read('core','tools/schema-inventory/command-lexical-overlay.json')),
    resolvePath(owner,source,expectedHash) { const row=byOwner.get(owner+'\0'+source);check(row,'Missing current expected source');if(expectedHash)check(row.sha256===expectedHash,'Imported expected authority source changed');provider.readCurrent(row.logicalPath);return row.logicalPath; }});
}
module.exports={createExpectedInventory,assembleExpectedView};
