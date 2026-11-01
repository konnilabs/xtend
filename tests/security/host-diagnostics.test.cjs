'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const diagnostics = require('./host-diagnostics.cjs');
function io(contents) {
  const reads = [];
  return {reads, openSync(file, flags) { assert.equal(flags,'r'); reads.push(file); if (!Object.hasOwn(contents,file)) throw Object.assign(Error(),{code:'EACCES'}); return file; },
    readSync(file, buffer) { return buffer.write(contents[file]); }, closeSync() {},
    readlinkSync() { throw Object.assign(Error(),{code:'ENOENT'}); }};
}
test('host diagnostics allowlist environment and preserve inaccessible data as unknown', () => {
  const fake = io({}); const report = diagnostics.hostSnapshot({ImageOS:'ubuntu24',TOKEN:'must-not-appear',GITHUB_TOKEN:'must-not-appear'},fake);
  assert.equal(report.runner.ImageOS,'ubuntu24'); assert.equal(JSON.stringify(report).includes('must-not-appear'),false);
  assert.equal(report.values['/proc/sys/kernel/apparmor_restrict_unprivileged_userns'].unavailable,'EACCES');
  assert.ok(fake.reads.every(file => !/environ|cmdline/.test(file)));
});
test('process snapshot keeps only diagnostic status fields and never guesses vanished process state', () => {
  const fake = io({'/proc/123/status':'Uid:\t1001 1001 1001 1001\nCapEff:\t00000000\nNoNewPrivs:\t1\nSeccomp:\t2\nSecret:\tredacted'});
  const report = diagnostics.processSnapshot(123,fake); assert.equal(report.status.Seccomp,'2'); assert.equal(report.status.Secret,undefined);
  assert.deepEqual(report.namespaces.pid,{unavailable:'ENOENT'}); assert.equal(diagnostics.processSnapshot(undefined).unavailable,'invalid-or-not-started-pid');
});
test('audit filters require the exact browser PID or binary and omit unrelated fields', () => {
  const lines = [
    {MESSAGE:'apparmor="DENIED" operation="userns_create" pid=123 comm="chrome" secret="must-not-appear"'},
    {MESSAGE:'apparmor="DENIED" operation="userns_create" pid=1234 comm="chrome"'},
    {MESSAGE:'apparmor="DENIED" operation="userns_create" pid=456 exe="/verified/chrome"'},
    {MESSAGE:'unrelated secret="must-not-appear" pid=123'}].map(JSON.stringify).join('\n');
  const report = diagnostics.filterAudit(lines,123,'/verified/chrome'); assert.equal(report.length,2);
  assert.equal(report[0].fields.operation,'"userns_create"'); assert.equal(JSON.stringify(report).includes('must-not-appear'),false);
});
test('audit is bounded read-only journal access and permission failure cannot become success', () => {
  let called = false;
  const report = diagnostics.auditSnapshot({pid:123,binary:'/verified/chrome',startedAt:Date.now()},(command,args,options) => {
    called=true; assert.equal(command,'journalctl'); assert.ok(args.includes('-k')); assert.ok(args.includes('--since'));
    assert.equal(options.timeout,2000); assert.equal(options.maxBuffer,262144);
    return {status:1,stderr:'Permission denied',stdout:'secret'};
  });
  assert.ok(called); assert.deepEqual(report,{unavailable:'journal-exit-1',permissionDenied:true});
  assert.deepEqual(diagnostics.auditSnapshot({pid:123,binary:'/verified/chrome',startedAt:Date.now()},
    () => ({status:0,stderr:'You are currently not seeing messages from other users',stdout:''})),
    {unavailable:'journal-access-or-records-unavailable'});
});
test('optional diagnostics never invoke collection when disabled and catch collection failure', () => {
  const old = process.env.XTEND_SECURITY_HOST_DIAGNOSTICS, log=console.log, rows=[];
  try {
    delete process.env.XTEND_SECURITY_HOST_DIAGNOSTICS;
    diagnostics.emit('disabled',() => { throw Error('must not run'); });
    process.env.XTEND_SECURITY_HOST_DIAGNOSTICS='1'; console.log=value => rows.push(value);
    diagnostics.emit('failure',() => { throw Object.assign(Error('secret'),{code:'EACCES'}); });
    assert.equal(rows.length,1); assert.equal(rows[0].includes('secret'),false); assert.ok(rows[0].includes('EACCES'));
  } finally { console.log=log; if (old===undefined) delete process.env.XTEND_SECURITY_HOST_DIAGNOSTICS; else process.env.XTEND_SECURITY_HOST_DIAGNOSTICS=old; }
});
