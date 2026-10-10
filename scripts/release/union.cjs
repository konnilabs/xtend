'use strict';
// A source-evidence consumer, never a package packer or an authorization bypass.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const crypto = require('node:crypto'), { execFileSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const { githubRequest, verifyNeeds } = require('./github.cjs');
const api = require('../../tools/schema-inventory/index.cjs');
const repository = 'konnilabs/xtend', workflowPath = '.github/workflows/xtend-default-gates.yml';
const lanes = ['24.18.0', '26.5.0'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (ok, message) => { if (!ok) throw Error(message); };
const read = file => JSON.parse(fs.readFileSync(file));
const positive = value => /^[1-9][0-9]*$/.test(String(value)) && Number.isSafeInteger(Number(value));
function expectedContext({ sourceSha, demoSha, env = process.env, needs, sealing = true }) {
  check(env.GITHUB_ACTIONS === 'true' && env.GITHUB_REPOSITORY === repository &&
    env.GITHUB_SHA === sourceSha && /^[a-f0-9]{40}$/.test(sourceSha) && /^[a-f0-9]{40}$/.test(demoSha) &&
    positive(env.GITHUB_RUN_ID) && positive(env.GITHUB_RUN_ATTEMPT), 'Union independent source/run/repository identity mismatch');
  check(['push', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME) &&
    /^refs\/heads\/[A-Za-z0-9._/-]+$/.test(env.GITHUB_REF || '') &&
    env.GITHUB_WORKFLOW_REF === repository + '/' + workflowPath + '@' + env.GITHUB_REF,
    'Union requires this workflow and the actual source head, never PR merge/target execution');
  if (sealing) {
    check(env.GITHUB_EVENT_NAME === 'workflow_dispatch' && env.GITHUB_REF === 'refs/heads/main' &&
      env.XTEND_RELEASE_PUBLISH === 'true', 'Union sealing requires explicit trusted main dispatch');
    verifyNeeds(needs);
  }
  const source = needs?.['union-source-artifact'];
  check(source?.result === 'success', 'Union producer failed, missing, cancelled or skipped');
  const outputs = source.outputs;
  check(outputs?.['core-sha'] === sourceSha && outputs['demo-sha'] === demoSha &&
    positive(outputs['artifact-id']) && /^[a-f0-9]{64}$/.test(outputs['archive-sha256'] || '') &&
    /^[a-f0-9]{64}$/.test(outputs['manifest-sha256'] || ''), 'Union producer outputs do not bind independent source/pin');
  return { sourceArtifactId: String(outputs['artifact-id']), expected: { producerMode: 'committed',
    coreSha: sourceSha, demoSha, archiveSha256: outputs['archive-sha256'], manifestSha256: outputs['manifest-sha256'],
    context: { runId: String(env.GITHUB_RUN_ID), runAttempt: String(env.GITHUB_RUN_ATTEMPT) } } };
}
function checkMetadata(metadata, name, context) {
  check(positive(metadata?.id) && metadata.name === name && metadata.expired === false &&
    /^sha256:[a-f0-9]{64}$/.test(metadata.digest || '') &&
    String(metadata.workflow_run?.id) === context.runId && metadata.workflow_run?.head_sha === context.sourceSha,
    'Union artifact metadata/source/run identity mismatch');
}
function checkRun(run, workflow, context) {
  check(String(run?.id) === context.runId && String(run.run_attempt) === context.runAttempt &&
    run.head_sha === context.sourceSha && run.head_branch === 'main' && run.event === 'workflow_dispatch' &&
    run.repository?.full_name === repository && run.head_repository?.full_name === repository &&
    run.workflow_id === workflow?.id && workflow.path === workflowPath,
    'Union producer/consumer workflow run/attempt/repository/head mismatch');
}
function checkJob(jobs, name, context) {
  const found = jobs.filter(job => job.name === name);
  check(found.length === 1 && found[0].status === 'completed' && found[0].conclusion === 'success',
    'Union required job failed, cancelled, skipped or missing: ' + name);
  check(String(found[0].run_id) === context.runId && found[0].head_sha === context.sourceSha,
    'Union job belongs to another run/source: ' + name);
  // Official job schema: run_attempt is optional. The authenticated run and
  // attempts/{attempt}/jobs endpoint bind its origin, even if this field is absent.
  if (Object.hasOwn(found[0], 'run_attempt')) check(Number.isSafeInteger(found[0].run_attempt) &&
    String(found[0].run_attempt) === context.runAttempt, 'Union job contradicts authenticated attempt: ' + name);
  return found[0];
}
function jobsResource(context) {
  return `/repos/${repository}/actions/runs/${context.runId}/attempts/${context.runAttempt}/jobs`;
}
function checkJobsEndpoint(resource, context) {
  check(resource === jobsResource(context), 'Union jobs authentication endpoint/run/attempt mismatch');
}
async function pages(request, resource, field) {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const result = await request(resource + '?per_page=100&page=' + page);
    check(Array.isArray(result?.[field]) && Number.isSafeInteger(result.total_count), 'Malformed Union GitHub list');
    all.push(...result[field]);
    if (all.length >= result.total_count) { check(all.length === result.total_count, 'Inconsistent Union GitHub list'); return all; }
    check(result[field].length > 0, 'Incomplete Union GitHub list');
  }
  throw Error('Union GitHub list exceeds bounded pagination');
}
function extract(zip, directory, filenames) {
  check(!fs.existsSync(directory), 'Union extraction destination must be fresh');
  execFileSync('python3', ['-c', `import zipfile,sys,pathlib,stat,json
z=zipfile.ZipFile(sys.argv[1]); out=pathlib.Path(sys.argv[2]); allowed=set(json.loads(sys.argv[3])); seen=set(); total=0
for i in z.infolist():
 mode=i.external_attr>>16; total+=i.file_size
 if i.filename not in allowed or i.filename in seen or i.is_dir() or stat.S_IFMT(mode) not in (0,stat.S_IFREG) or i.file_size<0 or total>1024*1024*1024: raise ValueError('Unsafe/substituted Union archive member')
 seen.add(i.filename)
if seen!=allowed: raise ValueError('Missing Union archive member')
out.mkdir(parents=True,exist_ok=False)
for i in z.infolist():
 with (out/i.filename).open('xb') as f:f.write(z.read(i))
`, zip, directory, JSON.stringify(filenames)], { timeout: 120000, maxBuffer: 1024 * 1024 });
}
async function download(metadata, file, request, fetchBytes) {
  const response = await request(`/repos/${repository}/actions/artifacts/${metadata.id}/zip`, { raw: true });
  check(response.status === 302, 'Union artifact requires authenticated download redirect');
  const location = new URL(response.headers.get('location'));
  check(location.protocol === 'https:' && !location.username && !location.password && !location.port,
    'Invalid Union storage redirect');
  // No bearer token is forwarded to the storage service.
  const downloaded = await fetchBytes(location.href, { redirect: 'error' });
  check(downloaded.status === 200, 'Union artifact storage read failed');
  const bytes = Buffer.from(await downloaded.arrayBuffer());
  check(bytes.length > 0 && bytes.length <= 512 * 1024 * 1024 && 'sha256:' + hash(bytes) === metadata.digest,
    'Union uploaded archive substitution/digest mismatch');
  fs.writeFileSync(file, bytes, { flag: 'wx' });
}
function verifyLane({ directory, node, expected, sourceArtifactId, provenance, now, startedAt }) {
  const receipt = read(path.join(directory, 'union-lane.json'));
  const reportBytes = fs.readFileSync(path.join(directory, 'union-source-validation.json'));
  check(receipt.format === 1 && receipt.repository === repository && receipt.workflow === workflowPath &&
    receipt.node === node && receipt.coreSha === expected.coreSha && receipt.demoSha === expected.demoSha &&
    isDeepStrictEqual(receipt.context, expected.context) && receipt.sourceArtifactId === sourceArtifactId &&
    receipt.archiveSha256 === expected.archiveSha256 && receipt.manifestSha256 === expected.manifestSha256 &&
    receipt.reportSha256 === hash(reportBytes) && receipt.consumerOutcome === 'success', 'Union lane identity/outcome/digest mismatch');
  const report = JSON.parse(reportBytes), start = Date.parse(report.startedAt), end = Date.parse(report.finishedAt);
  check(report.ok === true && report.validation?.valid === true && Array.isArray(report.validation.errors) &&
    report.validation.errors.length === 0 && isDeepStrictEqual(report.productiveSource, provenance),
    'Union strict validation failed or provenance substituted');
  check(Number.isFinite(start) && Number.isFinite(end) && start <= end &&
    (!startedAt || start >= Date.parse(startedAt)) && end <= now + 1000 && now - end <= 3600000,
    'Union lane not fresh at original verification/seal time');
  return receipt;
}
function verifyBundle({ directory, receipt, sourceSha, demoSha, now, expectedFresh }) {
  const index = read(path.join(directory, 'index.json')), expected = index.expected;
  check(index.format === 1 && index.repository === repository && index.workflow === workflowPath &&
    expected?.producerMode === 'committed' && expected.coreSha === sourceSha && expected.demoSha === demoSha &&
    expected.context?.runId === String(receipt.runId) && positive(expected.context.runAttempt), 'Union sealed proof identity mismatch');
  const outputs = receipt.needs?.['union-source-artifact'];
  check(outputs?.result === 'success' && outputs.outputs?.['artifact-id'] === index.sourceArtifactId &&
    outputs.outputs['core-sha'] === sourceSha && outputs.outputs['demo-sha'] === demoSha &&
    outputs.outputs['archive-sha256'] === expected.archiveSha256 && outputs.outputs['manifest-sha256'] === expected.manifestSha256,
    'Union sealed proof differs from authenticated producer outputs');
  if (expectedFresh) check(isDeepStrictEqual(expected, expectedFresh.expected) && index.sourceArtifactId === expectedFresh.sourceArtifactId,
    'Union current-run proof context mismatch');
  const context = { ...expected.context, sourceSha }; checkRun(index.run, index.workflowMetadata, context);
  checkJobsEndpoint(index.jobsEndpoint, context);
  checkJob(index.jobs, 'Verify pinned union source artifact', context);
  checkMetadata(index.sourceMetadata, 'xtend-union-source-' + context.runId + '-' + context.runAttempt, context);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-union-check-'));
  try {
    const sourceZip = path.join(directory, 'source.zip');
    check('sha256:' + hash(fs.readFileSync(sourceZip)) === index.sourceMetadata.digest, 'Stored Union source archive changed');
    extract(sourceZip, path.join(work, 'producer'), ['sources.tar.gz']);
    const provider = api.createSourceProvider({ archive: path.join(work, 'producer/sources.tar.gz'), destination: path.join(work, 'source'), expected });
    check(Array.isArray(index.lanes) && index.lanes.length === 2 && new Set(index.lanes.map(l => l.node)).size === 2,
      'Both distinct Union consumer lanes required');
    for (const node of lanes) {
      const lane = index.lanes.find(l => l.node === node); check(lane, 'Missing Union consumer lane: ' + node);
      const name = 'xtend-release-union-node-' + node.replaceAll('.', '-') + '-attempt-' + context.runAttempt;
      checkMetadata(lane.metadata, name, context); checkJob(index.jobs, 'Full release gates (Node ' + node + ')', context);
      const zip = path.join(directory, node + '.zip');
      check('sha256:' + hash(fs.readFileSync(zip)) === lane.metadata.digest, 'Stored Union consumer archive changed');
      const target = path.join(work, node); extract(zip, target, ['union-source-validation.json', 'union-lane.json']);
      check(Number.isFinite(Date.parse(index.run.run_started_at)), 'Union authenticated run start required');
      verifyLane({ directory: target, node, expected, sourceArtifactId: index.sourceArtifactId, provenance: provider.provenance(), now,
        startedAt: index.run.run_started_at });
    }
    provider.files(); // recheck after report verification as well
    return index;
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
}
async function verifyFreshUnion({ directory, sourceSha, demoSha, env = process.env, needs = JSON.parse(env.XTEND_RELEASE_NEEDS || '{}'),
  request = githubRequest(), fetchBytes = fetch, now = Date.now() }) {
  const bound = expectedContext({ sourceSha, demoSha, env, needs }), context = { ...bound.expected.context, sourceSha };
  check(!fs.existsSync(directory), 'Fresh Union proof destination required');
  const run = await request(`/repos/${repository}/actions/runs/${context.runId}/attempts/${context.runAttempt}`);
  const workflow = await request(`/repos/${repository}/actions/workflows/xtend-default-gates.yml`); checkRun(run, workflow, context);
  const jobsEndpoint = jobsResource(context);
  const jobs = await pages(request, jobsEndpoint, 'jobs');
  checkJob(jobs, 'Verify pinned union source artifact', context);
  for (const node of lanes) checkJob(jobs, 'Full release gates (Node ' + node + ')', context);
  const sourceMetadata = await request(`/repos/${repository}/actions/artifacts/${bound.sourceArtifactId}`);
  checkMetadata(sourceMetadata, 'xtend-union-source-' + context.runId + '-' + context.runAttempt, context);
  const artifacts = await pages(request, `/repos/${repository}/actions/runs/${context.runId}/artifacts`, 'artifacts');
  const consumers = lanes.map(node => {
    const name = 'xtend-release-union-node-' + node.replaceAll('.', '-') + '-attempt-' + context.runAttempt;
    const matches = artifacts.filter(item => item.name === name); check(matches.length === 1, 'Missing/duplicate authenticated Union artifact: ' + name);
    checkMetadata(matches[0], name, context); return { node, metadata: matches[0] };
  });
  fs.mkdirSync(directory, { recursive: true });
  try {
    await download(sourceMetadata, path.join(directory, 'source.zip'), request, fetchBytes);
    for (const lane of consumers) await download(lane.metadata, path.join(directory, lane.node + '.zip'), request, fetchBytes);
    fs.writeFileSync(path.join(directory, 'index.json'), JSON.stringify({ format: 1, repository, workflow: workflowPath,
      expected: bound.expected, sourceArtifactId: bound.sourceArtifactId, sourceMetadata, run, workflowMetadata: workflow,
      jobsEndpoint, jobs, lanes: consumers }, null, 2) + '\n', { flag: 'wx' });
    return verifyBundle({ directory, sourceSha, demoSha, now, expectedFresh: bound,
      receipt: { runId: context.runId, needs } });
  } catch (error) { fs.rmSync(directory, { recursive: true, force: true }); throw error; }
}
function verifyStoredUnion({ directory, artifact }) {
  const binding = artifact.manifest.unionEvidence;
  check(binding?.file === 'union-evidence/index.json' && /^sha512-[A-Za-z0-9+/]{86}==$/.test(binding.integrity || '') &&
    'sha512-' + crypto.createHash('sha512').update(fs.readFileSync(path.join(directory, binding.file))).digest('base64') === binding.integrity,
    'Union original manifest proof integrity mismatch');
  const receipt = read(path.join(directory, 'gate-receipt.json'));
  check(receipt.sourceSha === artifact.sourceSha && receipt.manifestIntegrity === artifact.manifestIntegrity &&
    receipt.repository === repository && receipt.workflow === workflowPath, 'Union original seal receipt mismatch');
  verifyNeeds(receipt.needs);
  const now = Date.parse(artifact.manifest.sealedAt); check(Number.isFinite(now), 'Union original seal timestamp required');
  return verifyBundle({ directory: path.join(directory, 'union-evidence'), receipt, sourceSha: artifact.sourceSha,
    demoSha: artifact.manifest.candidateBinding.demoSha, now });
}
function recordLane({ archive, expected, reportFile, output, sourceArtifactId, node = process.versions.node, outcome,
  env = process.env, now = Date.now() }) {
  const sourceSha = env.GITHUB_SHA, demoSha = require('../../product-demos.lock.json').demoSha;
  const bound = expectedContext({ sourceSha, demoSha, env, sealing: false, needs: { 'union-source-artifact': { result: env.UNION_PRODUCER_RESULT,
    outputs: { 'core-sha': expected.coreSha, 'demo-sha': expected.demoSha, 'artifact-id': sourceArtifactId,
      'archive-sha256': expected.archiveSha256, 'manifest-sha256': expected.manifestSha256 } } } });
  check(isDeepStrictEqual(expected, bound.expected), 'Union committed producer expectation mismatch');
  check(isDeepStrictEqual(expected.context, { runId: env.GITHUB_RUN_ID, runAttempt: env.GITHUB_RUN_ATTEMPT }) &&
    node === process.versions.node && lanes.includes(node), 'Union record actual runtime/run/attempt mismatch');
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-union-record-'));
  try {
    const provider = api.createSourceProvider({ archive, expected, destination: path.join(work, 'source') });
    const reportBytes = fs.readFileSync(reportFile);
    const value = { format: 1, repository, workflow: workflowPath, coreSha: sourceSha, demoSha, context: expected.context,
      node, sourceArtifactId: String(sourceArtifactId), archiveSha256: expected.archiveSha256,
      manifestSha256: expected.manifestSha256, reportSha256: hash(reportBytes), consumerOutcome: outcome };
    check(path.basename(output) === 'union-lane.json' && path.dirname(output) === path.dirname(reportFile), 'Union evidence co-location required');
    fs.writeFileSync(output, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
    verifyLane({ directory: path.dirname(output), node, expected, sourceArtifactId: String(sourceArtifactId), provenance: provider.provenance(), now });
    return value;
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
}
if (require.main === module) {
  try {
    check(process.argv[2] === 'record', 'Union command: record');
    if (!process.argv.includes('--execute')) console.log(JSON.stringify({ mode: 'dry-run', command: 'record' }));
    else {
      check(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() === process.env.GITHUB_SHA,
        'Union consumer actual checkout head mismatch');
      recordLane({ archive: process.env.XTEND_UNION_ARCHIVE, expected: read(process.env.XTEND_UNION_EXPECTED),
      reportFile: '.xtend-test-results/union-source-validation.json', output: '.xtend-test-results/union-lane.json',
      sourceArtifactId: process.env.XTEND_UNION_ARTIFACT_ID, outcome: process.env.UNION_STRICT_RESULT,
      node: process.env.UNION_NODE_VERSION });
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { expectedContext, checkMetadata, checkRun, checkJob, verifyLane, verifyBundle,
  verifyFreshUnion, verifyStoredUnion, recordLane };
