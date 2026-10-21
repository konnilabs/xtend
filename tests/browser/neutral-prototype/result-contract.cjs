'use strict';
// Additive observation contract. It neither selects support profiles nor grants
// merge/release authority. Authentication must come from outside the browser.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const {sha256} = require('../../../tools/browser-hypervisor');
const {acceptProduct} = require('./adapter.cjs');
const fixtures = require('./fixture-contracts.json');
const {maintainedScript} = require('./fixture-server.cjs');
const {negativeLifecycle} = require('./qualification.cjs');
const executionProfiles=require('./execution-profile.cjs');
const format = 'xtend.browser-neutral.observation.v2';
const statuses = ['passed', 'failed', 'blocked', 'not-run'];
const nativeRequired = ['dom', 'customElements', 'shadowDom', 'trustedTypes', 'trustedTypesEnforced', 'policyAllowlistEnforced'];
const kinds = ['test-double', 'recorded-artifact', 'live-session'];
const securityLabel = 'maintained sanitizer, TrustedHTML sink and SSR reparse assertions';
const securityContract = {idField:'label', verdictField:'passed', expectedChecks:[securityLabel]};
const aliases = Object.freeze({'preload-order-fetch':'bidi-preload-order-fetch', 'context-isolation':'bidi-context-isolation', 'preload-removal':'bidi-removal',
  'lifecycle-wrong-key':'lifecycle-wrong-key', 'lifecycle-foreign-origin':'lifecycle-foreign-origin'});
const hash = value => sha256(JSON.stringify(value));
const exactKeys = (value, keys, message) => assert.deepEqual(Object.keys(value || {}).sort(), [...keys].sort(), message);
const digest = value => assert(/^[a-f0-9]{64}$/.test(value || ''), 'SHA256 required');
function contractDigest(files) {
  const root = path.resolve(__dirname,'../../..');
  const current = file => sha256(fs.readFileSync(path.join(root,file)));
  const at = file => {
    if (!files) return current(file);
    const value = files.find(row => row.path === file)?.sha256; digest(value); return value;
  };
  // Re-evaluation may use the original controller digests, but its fixture and
  // security assertion definitions must still be identical to this evaluator.
  if (files) for (const file of ['tests/browser/neutral-prototype/fixture-contracts.json',
    'tests/browser/neutral-prototype/fixture-server.cjs','tests/security/browser.test.mjs',
    'tools/browser-hypervisor/index.js',...fixtures.fixtures.map(f => f.path),fixtures.hydrangea.path])
    assert.equal(at(file),current(file),'Recorded assertion dependency changed: '+file);
  for (const entry of [...fixtures.fixtures, fixtures.hydrangea]) assert.equal(sha256(fs.readFileSync(path.resolve(__dirname,'../../..',entry.path))), entry.sha256, 'Reviewed fixture byte mismatch');
  const names=['adapter.cjs','engine-adapters.cjs','qualification.cjs','result-contract.cjs'];
  if(!files || files.some(f=>f.path==='tests/browser/neutral-prototype/execution-profile.cjs'))names.push('execution-profile.cjs');
  return hash({fixtures, security:sha256(maintainedScript()), hypervisor:at('tools/browser-hypervisor/index.js'), sources:Object.fromEntries(
    names.map(file => [file, at('tests/browser/neutral-prototype/'+file)]))});
}
function validateProfile(input,functional=false) {
  exactKeys(input, ['id','engine','browserVersion','driverVersion','browserSha256','driverSha256','os','node','capabilities','transport','sandboxPolicy',...(functional?['purpose']:[])], 'Explicit closed profile required');
  assert(/^[a-z0-9][a-z0-9.-]{0,99}$/.test(input.id || ''), 'Profile ID required');
  assert(['chromium','firefox'].includes(input.engine), 'Reviewed engine adapter required');
  if(functional){
    assert.equal(input.id,executionProfiles.functional);assert.equal(input.purpose,'ci-functional-only');
    assert.equal(input.sandboxPolicy,'disabled');assert.equal(input.engine,'chromium');assert.equal(input.os,'linux');assert(executionProfiles.nodes.includes(input.node),'Pinned functional Node required');
  }else assert.equal(input.sandboxPolicy, 'required', 'Unsandboxed profiles cannot enter this security qualification contract');
  exactKeys(input.transport, ['backend','protocol','adapterSha256'], 'Transport identity separate from engine/binary required');
  assert.equal(input.transport.backend, 'hypervisor-webdriver', 'Unqualified backend');
  assert.equal(input.transport.protocol, input.engine === 'firefox' ? 'webdriver-bidi' : 'webdriver-cdp');
  assert.equal(input.transport.adapterSha256, sha256(fs.readFileSync(path.join(__dirname,'engine-adapters.cjs'))), 'Adapter byte mismatch');
  for (const key of ['browserVersion','driverVersion']) assert(/^\d+(?:\.\d+){1,3}$/.test(input[key] || ''), 'Exact toolchain versions required');
  for (const key of ['browserSha256','driverSha256']) digest(input[key]);
  assert(['linux','darwin'].includes(input.os), 'Explicit implemented OS profile required');
  assert(['24.18.0','26.5.0'].includes(input.node), 'Pinned Node required');
  assert(Array.isArray(input.capabilities), 'Capability contracts required');
  assert.equal(new Set(input.capabilities.map(row => row.id)).size, input.capabilities.length, 'Duplicate capability');
  for (const row of input.capabilities) {
    exactKeys(row, ['id','implementation'], 'Closed capability contract required');
    assert([...nativeRequired,'nativeSanitizer'].includes(row.id), 'Unknown capability');
    // No fallback has been qualified by this package. A future explicit fallback
    // needs its own executed assertion contract, never a native-success alias.
    assert.equal(row.implementation, 'native', 'No reviewed fallback contract in this package');
  }
  assert(nativeRequired.every(id => input.capabilities.some(row => row.id === id)), 'Shared security capability contract cannot be reduced');
  return structuredClone(input);
}
function profile(input){return validateProfile(input);}
function functionalProfile(input){return validateProfile(input,true);}
function sourceIdentity(value) {
  assert(value && typeof value === 'object', 'Discriminated source identity required');
  if (value.type === 'committed') {
    exactKeys(value, ['type','commit'], 'Committed source cannot contain worktree claims');
    assert(/^[a-f0-9]{40}$/.test(value.commit || ''), 'Exact commit required');
  } else {
    assert.equal(value.type,'worktree','Unknown source type');
    exactKeys(value, ['type','baseCommit','patchSha256','worktreeSha256'], 'Complete worktree identity required');
    assert(/^[a-f0-9]{40}$/.test(value.baseCommit || ''), 'Exact base commit required');
    digest(value.patchSha256); digest(value.worktreeSha256);
  }
  return structuredClone(value);
}
function verifyWorktree(raw, origin, proof) {
  exactKeys(proof, ['before','after','patchBytes','receiptBytes','rawBytes','expected'], 'Worktree execution evidence required');
  exactKeys(proof.expected, ['source','receiptSha256','rawReportSha256'], 'Independent local review bindings required');
  assert.deepEqual(sourceIdentity(proof.expected.source),origin.source,'Foreign worktree or base commit');
  for (const key of ['receiptSha256','rawReportSha256']) digest(proof.expected[key]);
  for (const key of ['patchBytes','receiptBytes','rawBytes']) assert(Buffer.isBuffer(proof[key]) && proof[key].length > 0, 'Actual evidence bytes required: '+key);
  assert.equal(sha256(proof.patchBytes),origin.source.patchSha256,'Patch bytes mismatch');
  assert.equal(sha256(proof.receiptBytes),proof.expected.receiptSha256,'Execution receipt bytes mismatch');
  assert.equal(sha256(proof.rawBytes),proof.expected.rawReportSha256,'Raw report bytes mismatch');
  assert.deepEqual(JSON.parse(proof.rawBytes),raw,'Substituted raw observation');
  const source = {baseCommit:origin.source.baseCommit,committedSource:false,patchSha256:origin.source.patchSha256,worktreeSha256:origin.source.worktreeSha256};
  for (const manifest of [proof.before,proof.after]) {
    exactKeys(manifest,[...Object.keys(source),'files'],'Closed source manifest required');
    for (const [key,value] of Object.entries(source)) assert.deepEqual(manifest[key],value,'Source manifest identity mismatch: '+key);
    assert(Array.isArray(manifest.files) && manifest.files.length > 0,'Complete file manifest required');
    const names=manifest.files.map(row => {
      exactKeys(row,['path','sha256'],'Closed file binding required'); digest(row.sha256);
      assert(typeof row.path === 'string' && row.path.length > 0 && !row.path.startsWith('/') && !row.path.includes('\\') && row.path.split('/').every(p => p && p !== '.' && p !== '..'),'Canonical relative source path required');
      return row.path;
    });
    assert.deepEqual(names,[...new Set(names)].sort(),'Unique sorted source files required');
    assert.equal(hash(manifest.files),origin.source.worktreeSha256,'Worktree bytes mismatch');
  }
  assert.deepEqual(proof.before,proof.after,'Source changed during execution');
  const receipt=JSON.parse(proof.receiptBytes);
  assert.deepEqual(receipt.source,source,'Receipt source identity mismatch');
  assert.equal(receipt.kind,'live-session'); assert.equal(receipt.status,'terminal');
  assert.equal(receipt.acceptedForMerge,false); assert.equal(receipt.acceptedForRelease,false);
  assert.equal(receipt.sourceUnchanged,true); assert.equal(receipt.sessionCreationRequests,1);
  assert.deepEqual(receipt.sessionIds,[origin.sessionId]);
  for (const key of ['startedAt','finishedAt']) assert.equal(receipt[key],origin[key],'Execution interval mismatch');
  assert.equal(receipt.node,raw.node.slice(1)); assert.equal(receipt.browserStatus,raw.status);
  assert.equal(receipt.rawReportSha256,proof.expected.rawReportSha256);
  const files=proof.before.files;
  assert(raw.sourceDigests && typeof raw.sourceDigests === 'object','Executed controller source bindings required');
  for (const name of ['adapter.cjs','engine-adapters.cjs','qualification.cjs','result-contract.cjs']) digest(raw.sourceDigests[name]);
  for (const [name,value] of Object.entries(raw.sourceDigests)) {
    assert(/^[a-zA-Z0-9_.-]+$/.test(name),'Invalid controller source name');
    assert.equal(value,files.find(row => row.path === 'tests/browser/neutral-prototype/'+name)?.sha256,'Execution/manifest source mismatch');
  }
  const executedDigest=contractDigest(files);
  assert.equal(origin.contractSha256,executedDigest,'Recorded execution contract mismatch');
  if (origin.kind !== 'recorded-artifact') assert.equal(executedDigest,contractDigest(),'Old controller bytes require explicit recorded-artifact re-evaluation');
}
function provenance(value, {raw,worktreeEvidence} = {}) {
  exactKeys(value, ['repository','source','runId','attempt','sessionId','startedAt','finishedAt','contractSha256','kind'], 'Closed provenance required');
  assert.equal(value.repository, 'konnilabs/xtend');
  sourceIdentity(value.source);
  assert(/^[A-Za-z0-9][A-Za-z0-9.-]{0,99}$/.test(value.runId || ''), 'Run identity required');
  assert(Number.isInteger(value.attempt) && value.attempt > 0, 'Attempt required');
  assert(/^[A-Za-z0-9][A-Za-z0-9.-]{0,99}$/.test(value.sessionId || ''), 'Session identity required');
  const times = ['startedAt','finishedAt'].map(key => { const date = new Date(value[key]); assert(Number.isFinite(date.getTime()) && date.toISOString() === value[key], 'Exact UTC timestamp required'); return date.getTime(); });
  assert(times[1] > times[0], 'Nonempty execution interval required');
  assert(kinds.includes(value.kind), 'Explicit evidence kind required');
  if (value.source.type === 'worktree') verifyWorktree(raw,value,worktreeEvidence);
  else {
    assert.equal(worktreeEvidence,undefined,'Committed provenance cannot substitute worktree evidence');
    assert.equal(value.contractSha256, contractDigest(), 'Stale assertion/adapter source binding');
  }
  return structuredClone(value);
}
function normalizePlatform(driver, host) {
  const allowed = {linux:['linux'],darwin:['mac','darwin']};
  assert(allowed[host]?.includes(driver),'Unknown or conflicting WebDriver platform');
  return host;
}
function status(value) {
  if (['infrastructure-blocked','capability-missing'].includes(value)) return 'blocked';
  assert(statuses.includes(value), 'Unknown result status'); return value;
}
function combine(rows) {
  const values = rows.map(row => row.status);
  return values.includes('failed') ? 'failed' : values.includes('blocked') ? 'blocked' : values.length && values.every(s => s === 'passed') ? 'passed' : 'not-run';
}
function noSkips(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    assert(!(key === 'status' && ['skipped','todo'].includes(item)) && !(['skips','skipped','todo'].includes(key) && (Array.isArray(item) ? item.length : item)), 'Skipped evidence is not execution');
    noSkips(item);
  }
}
function assertions(result, contract, prefix, enclosingStatus) {
  const {idField, verdictField, expectedChecks} = contract;
  const checks = result?.checks || [];
  assert(Array.isArray(checks), 'Assertion list required');
  const ids = checks.map(row => row[idField]);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate assertion evidence');
  assert(ids.every(id => expectedChecks.includes(id)), 'Foreign assertion evidence');
  if (enclosingStatus === 'passed') assert(acceptProduct(result, contract), 'Claimed pass without complete executed assertions');
  return expectedChecks.map(id => {
    const row = checks.find(item => item[idField] === id);
    if (row) assert(typeof row[verdictField] === 'boolean', 'Executed assertion verdict required');
    return {id:prefix+'/'+id, status:!row ? 'not-run' : row[verdictField] ? 'passed' : 'failed', executed:Boolean(row), granularity:prefix === 'security' ? 'composite-scenario' : 'assertion'};
  });
}
function scenarioPassed(name, result) {
  assert(result && typeof result === 'object', 'Executed scenario result required');
  if (name === 'preload-order-fetch') {
    assert.equal(result.status, 'passed'); assert.equal(result.early, true); assert.equal(result.active, 0); assert.equal(result.maxActive, 1);
    assert.equal(result.requests?.length, 3); assert.deepEqual(result.errors, []);
    assert(result.requests.every(r => r.finished >= r.started && r.bytes > 0 && r.sourceHash === 'synthetic'));
  } else if (name === 'context-isolation') { assert.equal(result.absent, true); assert.equal(result.page, true); }
  else if (name === 'preload-removal') assert.equal(result.status, 'absent');
  else if (name === 'lifecycle-wrong-key') { assert.equal(result.rejected, true); assert.equal(result.expectation, 'missing result is rejected'); }
  else {
    const failure = result.product?.checks?.find(row => row.passed === false);
    assert.equal(typeof failure?.details, 'string');
    // Original assertion details contain the foreign loopback asset URL.
    const url = failure.details.match(/http:\/\/127\.0\.0\.1:\d+\/probe\.svg/)?.[0]; assert(url, 'Foreign-origin rejection evidence required');
    negativeLifecycle(result.product, fixtures.fixtures.find(f => f.id === 'lifecycle'), url);
  }
}
function observeWithPurpose(raw, inputProfile, inputProvenance, worktreeEvidence, functional) {
  const p = validateProfile(inputProfile,functional), origin = provenance(inputProvenance,{raw,worktreeEvidence});
  assert(raw && typeof raw === 'object'); noSkips(raw);
  if (origin.source.type === 'worktree') assert.equal(raw.sourceDigests['engine-adapters.cjs'],p.transport.adapterSha256,'Executed adapter/profile byte mismatch');
  assert.equal(raw.acceptedForRelease, false, 'Input cannot grant release authority');
  assert.notEqual(raw.acceptedForMerge,true,'Input cannot grant merge authority');
  if(functional){
    assert.equal(raw.executionProfile,executionProfiles.functional);assert.equal(raw.sandboxEnabled,false);
    assert.equal(raw.acceptedForSecurity,false);assert.equal(raw.sandboxEvidence?.status,'not-provided');
    assert.equal(raw.sandbox,undefined,'Functional evidence cannot claim sandbox proof');
  }else {
    assert.notEqual(raw.sandboxEnabled,false,'Disabled sandbox cannot enter security observation');
    assert.notEqual(raw.executionProfile,executionProfiles.functional,'Functional scope cannot enter security observation');
  }
  assert.equal(raw.node, 'v'+p.node); assert.equal(raw.platform, p.os); assert.equal(raw.engine, p.engine);
  for (const key of ['browserSha256','driverSha256']) assert.equal(raw[key], p[key], 'Toolchain byte mismatch');
  const phases = raw.phases || {};
  exactKeys(phases, ['startup','sandbox','capabilities','product','qualification','sessionCleanup','groupCleanup'], 'Complete phase ledger required');
  const phaseRows = Object.entries(phases).map(([id, row]) => ({id, status:status(row.status)}));
  if(functional)assert.equal(phases.sandbox.status,'not-run','Disabled sandbox must not be recorded as a pass');
  status(raw.status);
  for (const [prior, next] of [['startup',['sandbox','capabilities','product','qualification']], ['sandbox',['capabilities','product','qualification']],
    ['capabilities',['product','qualification']], ['product',['qualification']]]) {
    if (!(functional && prior==='sandbox') && phases[prior].status !== 'passed') assert(next.every(id => phases[id].status === 'not-run'), 'Execution after failed prerequisite');
  }
  let normalizedOs=null;
  if (phases.startup.status === 'passed') {
    assert.equal(raw.identity?.browserName, p.engine === 'chromium' ? 'chrome' : 'firefox');
    assert.equal(raw.identity?.browserVersion, p.browserVersion); normalizedOs=normalizePlatform(raw.identity?.platformName,p.os);
    const version = raw.driverVersion?.match(/^(?:(?:geckodriver|ChromeDriver) )?(\d+(?:\.\d+){1,3})(?: |$)/)?.[1];
    assert.equal(version, p.driverVersion, 'Actual driver version mismatch');
  }
  if (phases.sandbox.status === 'passed') assert.equal(raw.sandbox?.status, 'passed', 'Sandbox observation absent');
  const q = raw.qualification;
  if (q) {
    assert.equal(q.acceptedForRelease, false);
    exactKeys(q.cases, [...Object.values(aliases), ...fixtures.fixtures.map(f => f.id)], 'Complete case ledger required');
    if (q.transport) { assert.equal(q.transport.engine, p.engine); assert.equal(q.transport.protocol, p.transport.protocol); }
    assert.notEqual(phases.qualification.status, 'not-run', 'Unexecuted qualification has results');
    if(functional){assert.equal(q.sandboxObservationStatus,'not-run');assert.deepEqual(q.sandboxObservations,[]);}
  }
  if (phases.product.status === 'not-run') assert(!raw.product, 'Unexecuted product has results');
  const rows = assertions(raw.product, securityContract, 'security', status(phases.product.status));
  for (const f of fixtures.fixtures) {
    const item=q?.cases[f.id];
    if (item?.status === 'not-run') assert(!item.result, 'Unexecuted fixture has assertion results');
    rows.push(...assertions(item?.result, f.assertions, f.id, status(item?.status || 'not-run')));
  }
  for (const [id, legacy] of Object.entries(aliases)) {
    const row = q?.cases[legacy]; const state = status(row?.status || 'not-run');
    if (state === 'passed') scenarioPassed(id, row.result);
    rows.push({id, status:state, executed:Boolean(row?.result) && ['passed','failed'].includes(state), granularity:'scenario'});
  }
  const capabilityRows = p.capabilities.map(c => {
    const value = raw.capabilities?.[c.id]; assert(value === undefined || typeof value === 'boolean', 'Native capability boolean required');
    return {...c, status:value === true ? 'passed' : value === false ? 'blocked' : 'not-run', executed:value !== undefined};
  });
  if (phases.capabilities.status === 'passed') assert.equal(combine(capabilityRows), 'passed', 'Capability pass without native evidence');
  if (phases.qualification.status === 'passed') {
    assert.equal(q?.status, 'passed'); assert.equal(combine(rows), 'passed', 'Qualification lacks required assertions');
    assert(!q.error, 'Qualification controller failed');
    assert.equal(q.preloadCleanup?.status, 'passed'); assert.equal(q.preloadCleanup.remaining, 0);
    assert.equal(q.transportCleanup?.status, 'passed'); assert.equal(q.transportCleanup.closed, true);
    if(!functional){
      assert.equal(q.sandboxObservationStatus, 'passed'); assert(q.sandboxObservations?.length > 0, 'Qualification sandbox observations absent');
      assert(q.sandboxObservations.every(row => row.status === 'passed'), 'Negative sandbox observation cannot become a pass');
    }
  }
  if (phases.groupCleanup.status === 'passed') {
    assert.equal(raw.cleanup?.complete, true); assert.equal(raw.cleanup.groupGone, true); assert.equal(raw.cleanup.childReaped, true);
    assert.deepEqual(raw.cleanup.remaining, []);
  }
  // Retain actual earlier assertion successes, but never infer safety from them.
  const guard={id:'qualification-sandbox-observation',status:status(q?.sandboxObservationStatus || 'not-run')};
  const transportRows=[{id:'qualification-controller',status:q?.error ? 'failed' : q?.transport ? 'passed' : 'not-run'},
    {id:'preload-cleanup',status:status(q?.preloadCleanup?.status || 'not-run')},
    {id:'transport-cleanup',status:status(q?.transportCleanup?.status || 'not-run')}];
  const runnerRows=[...phaseRows.filter(r => !['product','capabilities','qualification'].includes(r.id)),guard,...transportRows];
  const operational=row=>!functional || !['sandbox','qualification-sandbox-observation'].includes(row.id);
  const observedStatus = combine([...phaseRows.filter(operational), ...rows, ...capabilityRows, ...runnerRows.filter(operational)]);
  if (raw.status === 'passed') assert.equal(observedStatus, 'passed', 'Overall pass without full execution');
  if (raw.status === 'failed') assert.notEqual(observedStatus, 'passed', 'Failure cannot be erased');
  const actual = rows.filter(row => row.executed);
  return {format:functional?'xtend.browser-functional.observation.v1':format, profile:p, provenance:origin, rawSha256:hash(raw), status:observedStatus,
    ...(functional?{purpose:'ci-functional-only',sandboxEnabled:false,acceptedForSecurity:false}:{}),
    platformIdentity:{hostRaw:raw.platform,webdriverRaw:raw.identity?.platformName ?? null,normalizedOs},
    evaluation:{mode:origin.kind === 'recorded-artifact' ? 'stored-observation-re-evaluation' : 'observation',contractSha256:contractDigest(),executionContractSha256:origin.contractSha256},
    layers:{core:{status:'not-run', reason:'separate Core/package evidence required'},
      web:{status:combine([...rows, phaseRows.find(r => r.id === 'product'), ...Object.values(q?.cases || {})]), assertions:rows},
      capabilities:{status:combine(capabilityRows), assertions:capabilityRows},
      ...(functional?{browserSandbox:{status:'not-run',enabled:false,evidence:'not-provided'},productSecurity:{status:status(phases.product.status),scope:'sanitizer / Trusted Types / SSR product assertions; not browser sandbox'}}:{}),
      runner:{status:combine(runnerRows.filter(operational)), phases:runnerRows,
        claimBoundary:'bounded external observations only; no continuous lifetime or complete policy proof',
        namespaceIsolation:'not-established-by-this-contract'}},
    coverage:{expected:rows.length, executed:actual.length, passed:actual.filter(r => r.status === 'passed').length,
      failed:actual.filter(r => r.status === 'failed').length, granularAssertions:actual.filter(r => r.granularity === 'assertion').length},
    recognition:functional?{status:'blocked',reason:'CI functional scope with disabled sandbox; no security/merge/release recognition'} :
      origin.source.type === 'worktree' ? {status:'blocked',reason:'uncommitted worktree: local regression only; no merge/release recognition'} :
      {status:'not-evaluated', reason:'independent provenance and profile acceptance required'},
    acceptedForMerge:false, acceptedForRelease:false};
}
function observe(raw,p,origin,proof){return observeWithPurpose(raw,p,origin,proof,false);}
function observeFunctional(raw,p,origin,proof){return observeWithPurpose(raw,p,origin,proof,true);}
function aggregateWithPurpose({profiles, expected, records, authenticatedBindings = []},functional=false) {
  assert(Array.isArray(profiles) && profiles.length > 0, 'Explicit planned profiles required; no default support matrix');
  const key=p=>functional?p.id+'/'+p.node:p.id;
  const plans = profiles.map(p=>validateProfile(p,functional)); assert.equal(new Set(plans.map(key)).size, plans.length, 'Duplicate profile plan');
  if(functional)assert.deepEqual(plans.map(p=>p.node).sort(),[...executionProfiles.nodes].sort(),'Both functional Node lanes required');
  exactKeys(expected, ['repository','source','runId','attempt','kind','contractSha256'], 'Externally supplied campaign identity required');
  sourceIdentity(expected.source);
  assert(Array.isArray(records)); assert.equal(records.length, plans.length, 'Missing or extra profile evidence');
  assert(Array.isArray(authenticatedBindings));
  const seen = new Set(), sessions = new Set(), results = [];
  for (const {observation, raw, worktreeEvidence} of records) {
    const p = plans.find(p => observation?.profile && key(p) === key(observation.profile)); assert(p, 'Foreign profile'); assert(!seen.has(key(p)), 'Duplicate profile evidence'); seen.add(key(p));
    for (const key of Object.keys(expected)) assert.deepEqual(observation.provenance[key], expected[key], 'Foreign or stale campaign evidence: '+key);
    assert(!sessions.has(observation.provenance.sessionId), 'Reused session evidence'); sessions.add(observation.provenance.sessionId);
    assert.deepEqual(observation, (functional?observeFunctional:observe)(raw, p, observation.provenance,worktreeEvidence), 'Altered result, coverage, profile or raw evidence');
    results.push(observation);
  }
  const bound = new Set();
  for (const receipt of authenticatedBindings) {
    exactKeys(receipt, ['profileId','observationSha256','rawSha256'], 'Closed external authentication binding required');
    const item = results.find(r => key(r.profile) === receipt.profileId); assert(item && !bound.has(receipt.profileId), 'Foreign or duplicate authentication binding');
    assert.equal(receipt.observationSha256, hash(item)); assert.equal(receipt.rawSha256, item.rawSha256); bound.add(receipt.profileId);
  }
  const recognition = expected.source.type === 'worktree' ? {status:'blocked',reason:'uncommitted worktree: local regression only; no merge/release recognition'} :
    expected.kind !== 'live-session' ? {status:'blocked', reason:expected.kind+' is not fresh browser qualification'} :
    bound.size !== plans.length ? {status:'blocked', reason:'independent authenticated bindings missing'} :
      {status:'not-evaluated', reason:'profile support and governance decision still required'};
  return {format:functional?'xtend.browser-functional.review.v1':'xtend.browser-neutral.review.v2',
    ...(functional?{purpose:'ci-functional-only',sandboxEnabled:false,sandboxEvidence:'not-provided',acceptedForSecurity:false}:{} ), evidenceKind:expected.kind, claimBoundary:'observation of explicitly planned profiles; not a support matrix',
    status:combine(results), profiles:results.map(r => ({id:key(r.profile), node:r.profile.node,status:r.status, coverage:r.coverage})),
    recognition, acceptedForMerge:false, acceptedForRelease:false};
}
function aggregate(campaign){return aggregateWithPurpose(campaign);}
function aggregateFunctional(campaign){return aggregateWithPurpose(campaign,true);}
module.exports = {format, hash, profile, functionalProfile, provenance, sourceIdentity, normalizePlatform, contractDigest, observe, observeFunctional, aggregate, aggregateFunctional, nativeRequired, securityLabel};
