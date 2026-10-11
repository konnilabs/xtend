'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { check } = require('./inventory.cjs');
const { digest } = require('./artifact.cjs');
const repository = 'konnilabs/xtend';
const gates = ['full-release-gates', 'rmt-vnext-primitive-gates', 'package-structure', 'conditional-network-evidence',
  'node-native-toolchain-smoke', 'xtend-mcp-vscode-smoke', 'laravel-release-gates', 'product-candidate-canary'];
function verifyNeeds(needs, { sealed = false } = {}) {
  for (const name of [...gates, ...(sealed ? ['release-seal'] : [])]) check(needs?.[name]?.result === 'success', `Required release gate failed or absent: ${name}`);
}
function githubRequest({ token = process.env.GITHUB_TOKEN, request = fetch } = {}) {
  check(typeof token === 'string' && token.length > 0, 'Automatic read-only GitHub workflow token required');
  return async (resource, { raw = false } = {}) => {
    check(resource.startsWith(`/repos/${repository}/actions/`) && !resource.includes('..'), 'Fixed repository Actions API required');
    const response = await request('https://api.github.com' + resource, { redirect: raw ? 'manual' : 'error',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } });
    if (raw) return response;
    check(response.status === 200, `GitHub read failed: HTTP ${response.status}`);
    return response.json();
  };
}
function verifyArtifactMetadata(metadata, run, workflow, { sourceSha, now = Date.now() } = {}) {
  check(Number.isSafeInteger(metadata?.id) && metadata.name === 'xtend-release-sealed' && metadata.expired === false &&
    /^sha256:[a-f0-9]{64}$/.test(metadata.digest || '') && metadata.workflow_run?.head_sha === sourceSha,
    'Invalid, expired, or foreign immutable artifact');
  check(run.id === metadata.workflow_run.id && run.head_sha === sourceSha && run.head_branch === 'main' &&
    run.event === 'workflow_dispatch' && run.repository?.full_name === repository && run.head_repository?.full_name === repository &&
    run.workflow_id === workflow.id && workflow.path === '.github/workflows/xtend-default-gates.yml', 'Artifact producer workflow/source identity mismatch');
  const created = Date.parse(metadata.created_at), expires = Date.parse(metadata.expires_at);
  check(Number.isFinite(created) && Number.isFinite(expires) && created <= now + 1000 && expires > now, 'Invalid artifact lifetime');
  return metadata;
}
async function downloadSealedArtifact({ id, directory, sourceSha, api = githubRequest(), request = fetch }) {
  check(/^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)), 'Exact immutable artifact ID required');
  check(!fs.existsSync(directory), 'Artifact download destination must be fresh');
  const metadata = await api(`/repos/${repository}/actions/artifacts/${id}`);
  const run = await api(`/repos/${repository}/actions/runs/${metadata.workflow_run?.id}`);
  const workflow = await api(`/repos/${repository}/actions/workflows/xtend-default-gates.yml`);
  verifyArtifactMetadata(metadata, run, workflow, { sourceSha });
  const response = await api(`/repos/${repository}/actions/artifacts/${id}/zip`, { raw: true });
  check(response.status === 302, 'Artifact API must return authenticated signed download redirect');
  const location = new URL(response.headers.get('location'));
  check(location.protocol === 'https:' && !location.username && !location.password && !location.port, 'Invalid signed artifact redirect');
  // The bearer token is never forwarded to the storage service.
  const download = await request(location.href, { redirect: 'error' });
  check(download.status === 200, 'Immutable artifact download failed');
  const bytes = Buffer.from(await download.arrayBuffer());
  check(bytes.length > 0 && bytes.length <= 512 * 1024 * 1024 &&
    'sha256:' + crypto.createHash('sha256').update(bytes).digest('hex') === metadata.digest, 'GitHub artifact archive digest mismatch');
  fs.mkdirSync(directory, { recursive: true });
  const zip = directory + '.zip'; fs.writeFileSync(zip, bytes, { flag: 'wx', mode: 0o400 });
  try {
    // Extraction is bounded and rejects paths, duplicates and Unix links.
    execFileSync('python3', ['-c', `import zipfile,sys,pathlib,stat
z=zipfile.ZipFile(sys.argv[1]); out=pathlib.Path(sys.argv[2]); names=set(); total=0
for i in z.infolist():
 p=pathlib.PurePosixPath(i.filename); mode=i.external_attr>>16
 if p.is_absolute() or any(x in ('..','.') for x in p.parts) or '\\\\' in i.filename or any(ord(x)<32 for x in i.filename) or i.filename in names or stat.S_ISLNK(mode): raise ValueError('Unsafe artifact archive entry')
 names.add(i.filename); total+=i.file_size
 if len(names)>100000 or total>1024*1024*1024: raise ValueError('Artifact extraction budget exceeded')
 if i.is_dir(): (out/p).mkdir(parents=True,exist_ok=True)
 else:
  (out/p).parent.mkdir(parents=True,exist_ok=True)
  with (out/p).open('xb') as f: f.write(z.read(i))
`, zip, directory], { timeout: 120000 });
    const receipt = JSON.parse(fs.readFileSync(path.join(directory, 'gate-receipt.json')));
    check(receipt.schema === 'xtend.release.gates.v1' && receipt.sourceSha === sourceSha && receipt.runId === String(run.id) &&
      receipt.repository === repository && receipt.workflow === workflow.path, 'Sealed artifact gate receipt identity mismatch');
    verifyNeeds(receipt.needs);
    const manifestIntegrity = digest(fs.readFileSync(path.join(directory, 'release-manifest.json')));
    check(receipt.manifestIntegrity === manifestIntegrity, 'Sealed artifact receipt hash mismatch');
    return { metadata, receipt, manifestIntegrity };
  } finally { fs.rmSync(zip, { force: true }); }
}
module.exports = { gates, verifyNeeds, githubRequest, verifyArtifactMetadata, downloadSealedArtifact };
