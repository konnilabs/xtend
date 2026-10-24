'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { crc32 } = require('node:zlib');
const { hash, profileIds, canonicalSuite } = require('../../scripts/test-runner/catalog');
const { normalizeSuiteResult } = require('../utils/reporting');
const { SCHEMA, verifyExecution, provenance } = require('../../scripts/test-runner/executor');
const { BINDING_SCHEMA, expectedProducer, selectArtifact, readArchive, resolveImportedCi } = require('../../scripts/test-runner/imported-ci');
const { parseArgs } = require('../../scripts/test-runner/cli');

// A real stored ZIP, including CRC and central directory; no network or extra archiver needed.
function archive(entries) {
  const local = [], central = []; let offset = 0;
  for (const [name, value] of entries) {
    const filename = Buffer.from(name), data = Buffer.from(value), crc = crc32(data);
    const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4);
    header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(filename.length, 26);
    const record = Buffer.alloc(46); record.writeUInt32LE(0x02014b50); record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6);
    record.writeUInt32LE(crc, 16); record.writeUInt32LE(data.length, 20); record.writeUInt32LE(data.length, 24);
    record.writeUInt16LE(filename.length, 28); record.writeUInt32LE(offset, 42);
    local.push(header, filename, data); central.push(record, filename); offset += header.length + filename.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

async function runImportedCiRunnerChecks({ check, temp, rootDir }) {
  const env = { GITHUB_EVENT_NAME: 'pull_request', GITHUB_REPOSITORY: 'konnilabs/xtend', GITHUB_WORKFLOW_REF: 'konnilabs/xtend/.github/workflows/xtend-default-gates.yml@refs/pull/112/merge',
    GITHUB_RUN_ID: '38625435006', GITHUB_SHA: 'b'.repeat(40), XTEND_TESTED_SHA: 'a'.repeat(40), XTEND_CI_LANE: 'node-24-lts' };
  await check('Producer records actual checkout; independent PR head rejects missing, invalid or substituted expected SHA', () => {
    const saved = ['GITHUB_RUN_ID','XTEND_CI_LANE','GITHUB_SHA'].map(key => [key,process.env[key]]);
    try {
      process.env.GITHUB_RUN_ID=env.GITHUB_RUN_ID;process.env.XTEND_CI_LANE=env.XTEND_CI_LANE;process.env.GITHUB_SHA=env.GITHUB_SHA;
      const actual=provenance();assert.equal(actual.producer.testedSHA,actual.commit);assert.notEqual(actual.producer.testedSHA,env.GITHUB_SHA);
    } finally { for(const [key,value] of saved){if(value===undefined)delete process.env[key];else process.env[key]=value;} }
    assert.equal(expectedProducer(env).testedSHA,env.XTEND_TESTED_SHA);
    for(const value of [undefined,'','not-a-sha'])assert.throws(()=>expectedProducer({...env,XTEND_TESTED_SHA:value}),/independent tested source SHA/);
    const push=expectedProducer({...env,GITHUB_EVENT_NAME:'push',GITHUB_SHA:'c'.repeat(40),XTEND_TESTED_SHA:'c'.repeat(40)});
    assert.equal(push.testedSHA,'c'.repeat(40));
  });
  const expected = expectedProducer(env);
  const job = { name: expected.jobName, status: 'completed', conclusion: 'success', run_attempt: 2,
    started_at: '2026-10-14T19:48:54Z', completed_at: '2026-10-14T19:54:30Z' };
  const metadata = (id, attempt, created_at) => ({ id, name: `xtend-shared-execution-${expected.lane}-${expected.job}-attempt-${attempt}`,
    created_at, expired: false, digest: `sha256:${'a'.repeat(64)}`, workflow_run: { id: 38625435006 } });
  const old = metadata(11924377674, 1, '2026-10-14T19:45:12Z'), fresh = metadata(11923649729, 2, '2026-10-14T19:54:25Z');
  const binding = selectArtifact({ jobs: [job], artifacts: [old, fresh], expected });
  const ids = profileIds(expected.profile);
  const report = { schema: SCHEMA, executionId: 'actual-producer-execution', profile: expected.profile, producer: binding.producer,
    run: `${env.GITHUB_RUN_ID}:2`, commit: env.XTEND_TESTED_SHA, sourceFingerprint: 'source', catalogFingerprint: 'catalog',
    runtime: { node: 'v24.18.0', platform: 'linux', arch: 'x64', runnerImage: 'producer-image', php: '8.4', browser: 'producer-browser', environmentFingerprint: 'producer-env' },
    startedAt: '2026-10-14T19:49:00Z', completedAt: '2026-10-14T19:54:00Z', complete: true, status: 'passed', expected: ids,
    results: ids.map(id => ({ id, executionId: canonicalSuite(id).id, completedAt: '2026-10-14T19:54:00Z', result: normalizeSuiteResult({ id, ok: true }) })) };
  const current = { run: `${env.GITHUB_RUN_ID}:2`, commit: report.commit, sourceFingerprint: report.sourceFingerprint, catalogFingerprint: report.catalogFingerprint,
    runtime: { node: 'v24.18.0', platform: 'linux', arch: 'x64', runnerImage: 'consumer-image', php: '8.5', browser: 'consumer-browser', environmentFingerprint: 'consumer-env' } };
  const verify = (value = report, bound = binding, consumer = current, bytes = Buffer.from(JSON.stringify(value))) => verifyExecution({ verify: 'rmt-vnext-primitives', executionReport: value,
    importedCi: { ...bound, executionDigest: hash(bytes) }, executionBytes: bytes, provenance: consumer, project: false });
  await check('Imported CI accepts consumer Image/PHP/browser/environment drift and preserves producer provenance', () => {
    const result = verify(); assert.equal(result.status, 'passed', result.errors.join('\n'));
    assert.deepEqual(result.producerRuntime, report.runtime); assert.deepEqual(result.producer, report.producer);
    assert.equal(result.artifact.id, 11923649729);
    assert.equal(verifyExecution({ verify: 'rmt-vnext-primitives', executionReport: report, provenance: current, project: false }).status, 'failed');
  });
  await check('Imported CI rejects commit, source/catalog, lane, exact Node, OS/architecture and producer/run/attempt drift', () => {
    const mutations = [r => { r.commit = 'wrong'; }, r => { r.sourceFingerprint = 'wrong'; }, r => { r.catalogFingerprint = 'wrong'; },
      r => { r.producer.lane = 'node-26-current'; }, r => { r.runtime.node = 'v24.19.0'; }, r => { r.runtime.platform = 'darwin'; }, r => { r.runtime.arch = 'arm64'; },
      r => { r.producer.job = 'wrong'; }, r => { r.producer.repository = 'wrong'; }, r => { r.producer.workflow = 'wrong'; }, r => { r.producer.testedSHA = 'wrong'; },
      r => { r.run = '38625435006:1'; }, r => { r.producer.attempt = '1'; }, r => { r.producer.runId = 'other'; }, r => { r.profile = 'ci-release'; },
      r => { r.startedAt = '2026-10-14T19:38:59Z'; }, r => { r.completedAt = 'invalid'; }, r => { r.complete = false; }, r => { r.status = 'failed'; }];
    for (const mutate of mutations) { const bad = structuredClone(report); mutate(bad); assert.equal(verify(bad).status, 'failed', String(mutate)); }
    assert.equal(verify(report, binding, { ...current, run: 'other:2' }).status, 'failed');
    assert.equal(verify(report, {...binding,producer:{...binding.producer,testedSHA:env.GITHUB_SHA}}).status,'failed');
    assert.equal(verify(report,binding,{...current,commit:env.GITHUB_SHA}).status,'failed');
    assert.equal(verify(report, { ...binding, producerNode: '^24' }).status, 'failed');
    assert.equal(verify(report, { ...binding, artifact: { ...binding.artifact, digest: 'bad' } }).status, 'failed');
  });
  await check('Imported subset cannot hide missing, duplicate, aliased or failed owner suites (including ERP)', () => {
    const outside = ids.find(id => id.includes('erp')); assert(outside, 'ERP must remain required in the producer union');
    for (const mutate of [r => r.results.pop(), r => r.results.push(r.results[0]), r => r.expected.push(r.expected[0]),
      r => { r.results[0].executionId = 'wrong'; }, r => { r.results[0].result.id = 'wrong'; },
      r => { r.results.find(e => e.id === outside).result = normalizeSuiteResult({ id: outside, ok: false }); },
      r => { r.results[0].result = { id: r.results[0].id, status: 'passed', ok: false }; }]) {
      const bad = structuredClone(report); mutate(bad); assert.equal(verify(bad).status, 'failed', String(mutate));
    }
    const bytes = Buffer.from(JSON.stringify(report));
    assert.equal(verifyExecution({ verify: 'rmt-vnext-primitives', executionReport: report, importedCi: { ...binding, executionDigest: 'changed' }, executionBytes: bytes, provenance: current, project: false }).status, 'failed');
  });
  await check('Resolver selects actual rerun, rejects superseded/ambiguous artifacts and ignores rewritten latest attempts', () => {
    assert.equal(binding.artifact.id, 11923649729); assert.equal(binding.producer.attempt, '2');
    assert.throws(() => expectedProducer({ ...env, XTEND_CI_LANE: 'wrong' }));
    const release = expectedProducer({ ...env, GITHUB_EVENT_NAME: 'push' });
    assert.equal(release.job, 'full-release-gates'); assert.equal(release.profile, 'ci-release');
    assert.throws(() => selectArtifact({ jobs: [job], artifacts: [old], expected }), /superseded/);
    assert.throws(() => selectArtifact({ jobs: [job], artifacts: [fresh, { ...fresh, id: 99 }], expected }), /ambiguous/);
    assert.throws(() => selectArtifact({ jobs: [job, job], artifacts: [fresh], expected }), /ambiguous/);
    for (const patch of [{ conclusion: 'failure' }, { status: 'in_progress' }, { started_at: null }]) assert.throws(() => selectArtifact({ jobs: [{ ...job, ...patch }], artifacts: [fresh], expected }));
    for (const patch of [{ id: 0 }, { digest: 'bad' }, { expired: true }, { workflow_run: { id: 1 } }]) assert.throws(() => selectArtifact({ jobs: [job], artifacts: [{ ...fresh, ...patch }], expected }));
    const e26 = expectedProducer({ ...env, XTEND_CI_LANE: 'node-26-current' });
    const inherited = { ...job, name: e26.jobName, id: 116068015190, run_attempt: 2, started_at: '2026-10-14T19:38:59Z', completed_at: '2026-10-14T19:47:17Z' };
    const a26 = { ...metadata(11923793711, 1, '2026-10-14T19:47:12Z'), name: `xtend-shared-execution-${e26.lane}-${e26.job}-attempt-1` };
    const b26 = selectArtifact({ jobs: [inherited], artifacts: [a26], expected: e26 });
    assert.equal(b26.producer.attempt, '1'); assert.equal(b26.artifact.id, 11923793711);
    const r26 = structuredClone(report); Object.assign(r26, { producer: b26.producer, run: `${env.GITHUB_RUN_ID}:1`, startedAt: '2026-10-14T19:39:10Z', completedAt: '2026-10-14T19:47:00Z' }); r26.runtime.node = 'v26.5.0';
    assert.equal(verify(r26, b26).status, 'passed');
    const next = { ...inherited, started_at: job.started_at, completed_at: job.completed_at };
    assert.throws(() => selectArtifact({ jobs: [next], artifacts: [a26], expected: e26 }), /superseded/);
  });
  await check('Resolver verifies real archive digest and binds exactly one extracted execution to immutable artifact ID', async () => {
    const bytes = Buffer.from(JSON.stringify(report)), zip = archive([['xtend-test-execution.json', bytes]]);
    const bound = { ...binding, artifact: { ...binding.artifact, digest: `sha256:${hash(zip)}` } };
    assert.deepEqual(await readArchive(zip, bound), bytes);
    await assert.rejects(readArchive(Buffer.concat([zip, Buffer.from('tampered')]), bound), /digest/);
    for (const entries of [[], [['xtend-test-execution.json', bytes], ['xtend-test-execution.json', bytes]], [['other.json', bytes]]]) {
      const bad = archive(entries); await assert.rejects(readArchive(bad, { ...bound, artifact: { ...bound.artifact, digest: `sha256:${hash(bad)}` } }));
    }
    const directory = path.join(temp, 'imported-output');
    const calls = [];
    const api = endpoint => { calls.push(endpoint); return endpoint.includes('/jobs?') ? JSON.stringify([{ jobs: [job] }]) : endpoint.includes('/artifacts?') ? JSON.stringify([{ artifacts: [old] }, { artifacts: [{ ...fresh, digest: bound.artifact.digest }] }]) : zip; };
    await resolveImportedCi({ env, api, provenance: current, directory });
    assert(calls.includes('/repos/konnilabs/xtend/actions/artifacts/11923649729/zip'));
    const receipt = JSON.parse(fs.readFileSync(path.join(directory, 'imported-ci-binding.json')));
    assert.equal(receipt.schema, BINDING_SCHEMA); assert.equal(receipt.executionDigest, hash(bytes));
    assert.equal(verifyExecution({ verify: 'rmt-vnext-primitives', from: path.join(directory, 'xtend-test-execution.json'), importedCi: path.join(directory, 'imported-ci-binding.json'), provenance: current, project: false }).status, 'passed');
    await assert.rejects(resolveImportedCi({ env, api: () => { throw Error('API unavailable'); }, provenance: current, directory }));
    assert(!fs.existsSync(path.join(directory, 'imported-ci-binding.json'))); assert(!fs.existsSync(path.join(directory, 'xtend-test-execution.json')));
    let jobReads = 0;
    await assert.rejects(resolveImportedCi({ env, provenance: current, directory, api: endpoint => {
      if (endpoint.includes('/jobs?') && ++jobReads > 1) return JSON.stringify([{ jobs: [{ ...job, status: 'in_progress', conclusion: null }] }]);
      return api(endpoint);
    } }), /Latest producer/);
    assert(!fs.existsSync(path.join(directory, 'imported-ci-binding.json')));
  });
  await check('CLI and workflow keep Imported CI explicit and permission scoped to its consumer', () => {
    assert.throws(() => parseArgs(['--imported-ci', 'file']));
    assert.throws(() => parseArgs(['--verify', 'core', '--from', 'report', '--imported-ci', '']));
    assert.equal(parseArgs(['--verify', 'core', '--from', 'report', '--imported-ci', 'binding']).importedCi, 'binding');
    const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/xtend-default-gates.yml'), 'utf8');
    // The Core release jobs already need scoped artifact reads; Imported CI
    // adds only its dedicated consumer. Reject any additional permission site.
    const actionReadJobs = [...workflow.matchAll(/^  ([\w-]+):\n([\s\S]*?)(?=^  [\w-]+:\n|$(?![\s\S]))/gm)]
      .filter(match => match[2].includes('actions: read')).map(match => match[1]).sort();
    assert.deepEqual(actionReadJobs, ['core-installed-consumers', 'core-security-browser', 'npm-publish-latest', 'release-prepare', 'release-seal', 'rmt-vnext-primitive-gates']);
    assert.equal((workflow.match(/actions: read/g) || []).length, actionReadJobs.length);
    const consumer = workflow.split('  rmt-vnext-primitive-gates:\n')[1].split(/\n  [\w-]+:\n/)[0];
    assert(consumer.includes('XTEND_TESTED_SHA: ${{ github.event.pull_request.head.sha || github.sha }}'));
    assert(consumer.includes('actions: read')); assert(consumer.includes('GH_TOKEN: ${{ github.token }}'));
    assert(consumer.includes('run: node scripts/test-runner/imported-ci.js'));
    assert(!consumer.includes('actions/download-artifact@')); assert.equal((consumer.match(/--imported-ci /g) || []).length, 2);
    assert.equal((workflow.match(/name: xtend-shared-execution-.*github.run_attempt/g) || []).length, 2);
    assert(!fs.readFileSync(path.join(rootDir, '.github/workflows/xtend-nightly-build.yml'), 'utf8').includes('--imported-ci'));
  });
}
module.exports = { runImportedCiRunnerChecks };
