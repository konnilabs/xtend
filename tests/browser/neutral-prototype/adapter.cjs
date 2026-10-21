'use strict';
// Test-only prototype. No launcher, downloads, production dependency or release proof.
const path = require('node:path');
const {requestJson, parseEndpoint} = require('../../../tools/browser-hypervisor');

class MissingCapability extends Error {}
class InfrastructureBlocked extends Error {}
function localUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username || url.password || url.hash) {
    throw Error('Only explicit HTTP IPv4 loopback URLs are accepted');
  }
  return url;
}
function capabilities({engine, binary, version, bidi = false}) {
  if (!path.isAbsolute(binary || '') || !/^\d+(?:\.\d+)+$/.test(version || '')) throw Error('Exact browser binary and version required');
  const names = {firefox:'firefox', chromium:'chrome'};
  if (!names[engine]) throw Error('Engine has no reviewed adapter');
  const vendor = engine === 'firefox' ? 'moz:firefoxOptions' : 'goog:chromeOptions';
  return {capabilities:{alwaysMatch:{browserName:names[engine], browserVersion:version,
    acceptInsecureCerts:false, ...(bidi ? {webSocketUrl:true} : {}), [vendor]:{binary, args:[engine === 'firefox' ? '-headless' : '--headless=new']}}}};
}
const featureProbe = `return {
  dom: typeof document.createElement === 'function',
  customElements: typeof globalThis.customElements?.define === 'function',
  shadowDom: typeof Element.prototype.attachShadow === 'function',
  trustedTypes: typeof globalThis.trustedTypes?.isHTML === 'function',
  nativeSanitizer: typeof globalThis.Sanitizer === 'function' && typeof Element.prototype.setHTML === 'function',
  trustedTypesEnforced: (()=>{try{document.createElement('div').innerHTML='<b>probe</b>';return false;}catch(e){return e.name==='TypeError';}})(),
  policyAllowlistEnforced: (()=>{try{globalThis.trustedTypes.createPolicy('xtend-forbidden-probe',{createHTML:s=>s});return false;}catch(e){return e.name==='TypeError';}})()
};`;
function validContract(contract) {
  return contract && ['passed','ok'].includes(contract.verdictField) && ['label','name'].includes(contract.idField) &&
    Array.isArray(contract.expectedChecks) && contract.expectedChecks.length > 0 &&
    contract.expectedChecks.every(id=>typeof id === 'string' && id.length > 0) &&
    new Set(contract.expectedChecks).size === contract.expectedChecks.length;
}
function acceptProduct(result, contract) {
  if (!validContract(contract) || !result || result.status !== 'passed' || !Array.isArray(result.checks)) return false;
  const {verdictField,idField,expectedChecks} = contract;
  const ids = result.checks.map(row=>row?.[idField]);
  return result.checks.length === expectedChecks.length && new Set(ids).size === ids.length &&
    expectedChecks.every(id=>ids.includes(id)) && result.checks.every(row => row && row[verdictField] === true &&
      !row.skipped && (!row.status || row.status === 'passed')) &&
    !(result.skipped || result.skips || result.summary?.skipped || result.summary?.failed || result.errors?.length);
}
function summarize(phases) {
  const values = Object.values(phases).map(row=>row.status);
  if (values.includes('failed')) return 'failed';
  if (values.every(status=>status === 'passed')) return 'passed';
  if (values.includes('infrastructure-blocked')) return 'infrastructure-blocked';
  if (values.includes('capability-missing')) return 'capability-missing';
  return 'not-provided';
}

// The owner and sandbox adapters are trusted harness components, not fixture input.
// A real Linux Firefox sandbox observer is deliberately NOT fabricated here.
// Missing observers stop product execution. Mocks only demonstrate controller behavior.
async function run({engine, binary, version, endpointUrl, probeUrl, fixtureUrl, resultKey,
  required = ['dom','customElements','shadowDom'], assertions, timeoutMs = 10000, cleanupMs = 1000, owner, sandbox, exercise}) {
  const phases = Object.fromEntries(['startup','sandbox','capabilities','product','sessionCleanup','groupCleanup']
    .map(name=>[name,{status:'not-run'}]));
  const report = {engine, evidenceKind:'prototype-controller-only', acceptedForRelease:false, phases};
  if(exercise)phases.qualification={status:'not-run'};
  let endpoint, sessionId, identity;
  const command = async (method, route, body, cleanup = false) => {
    owner.assertCurrent();
    const value = await requestJson({...endpoint, deadline:Date.now() + (cleanup ? cleanupMs : Math.max(1, deadline-Date.now()))}, method, route, body);
    owner.assertCurrent();
    return value.body.value;
  };
  const deadline = Date.now() + timeoutMs;
  const phase = async (name, action) => {
    try { await action(); phases[name] = {status:'passed'}; return true; }
    catch(error) {
      phases[name] = {status:['startup','sandbox'].includes(name) && error instanceof InfrastructureBlocked ? 'infrastructure-blocked' :
        name === 'capabilities' && error instanceof MissingCapability ? 'capability-missing' : 'failed', reason:error.message};
      return false;
    }
  };
  try {
    if (!await phase('startup',async()=>{
      localUrl(endpointUrl); localUrl(probeUrl); localUrl(fixtureUrl);
      if (new URL(probeUrl).origin !== new URL(fixtureUrl).origin) throw Error('Probe and product origin mismatch');
      if (!/^[A-Za-z_$][\w$]*$/.test(resultKey || '')) throw Error('Exact fixture result key required');
      if (!validContract(assertions)) throw Error('Explicit complete fixture assertion contract required');
      if (!owner || typeof owner.assertCurrent !== 'function' || typeof owner.stop !== 'function') throw Error('Owned process lifecycle required');
      endpoint = parseEndpoint(endpointUrl);
      const ready = await command('GET','/status');
      if (ready?.ready !== true) throw new InfrastructureBlocked('Driver not ready');
      const session = await command('POST','/session',capabilities({engine,binary,version,bidi:Boolean(exercise)}));
      sessionId = session?.sessionId;
      if (typeof sessionId !== 'string' || !/^[\w-]+$/.test(sessionId)) {sessionId = null; throw Error('Invalid session identity');}
      identity = session.capabilities;
      if (identity?.browserName !== (engine === 'firefox' ? 'firefox' : 'chrome') || identity?.browserVersion !== version ||
          identity.acceptInsecureCerts !== false) throw Error('Actual browser identity/security options differ from request');
      report.identity = {browserName:identity.browserName,browserVersion:identity.browserVersion,platformName:identity.platformName};
      await command('POST',`/session/${sessionId}/url`,{url:probeUrl});
    })) return report;
    if (!await phase('sandbox',async()=>{
      if (typeof sandbox?.verify !== 'function') throw new InfrastructureBlocked('Engine/OS sandbox proof unavailable');
      const evidence = await sandbox.verify({identity,sessionId,binary});
      if (evidence?.status !== 'passed') throw new InfrastructureBlocked('Engine/OS sandbox proof not passed');
      report.sandbox = evidence;
    })) return report;
    if (!await phase('capabilities',async()=>{
      report.capabilities = await command('POST',`/session/${sessionId}/execute/sync`,{script:featureProbe,args:[]});
      const missing = required.filter(name=>report.capabilities?.[name] !== true);
      if (missing.length) throw new MissingCapability(missing.join(', '));
    })) return report;
    await phase('product',async()=>{
      await command('POST',`/session/${sessionId}/url`,{url:fixtureUrl});
      while (Date.now() < deadline) {
        report.product = await command('POST',`/session/${sessionId}/execute/sync`,{script:`return window[${JSON.stringify(resultKey)}] || null;`,args:[]});
        if (report.product?.status && report.product.status !== 'pending') break;
        await new Promise(resolve=>setTimeout(resolve,20));
      }
      if (!acceptProduct(report.product,assertions)) throw Error('Product assertions failed, missing, timed out, or skipped');
      const evidence = await sandbox.verify({identity,sessionId,binary});
      if (evidence?.status !== 'passed') throw Error('Sandbox continuity proof failed after product assertions');
    });
    if(exercise && phases.product.status==='passed')await phase('qualification',()=>exercise({
      report,command,identity,sessionId,owner,sandbox,binary,deadline
    }));
    return report;
  } finally {
    await phase('sessionCleanup',async()=>{if(sessionId) await command('DELETE',`/session/${sessionId}`,undefined,true);});
    await phase('groupCleanup',async()=>{
      if (!owner) throw Error('No process ownership evidence');
      const cleanup = await owner.stop();
      report.cleanup = cleanup;
      if (cleanup?.complete !== true) throw Error('Owned process group cleanup incomplete');
    });
    report.status = summarize(phases);
  }
}
module.exports = {capabilities, localUrl, featureProbe, acceptProduct, summarize, run, InfrastructureBlocked};
