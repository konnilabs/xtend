'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), zlib = require('node:zlib');
const policyBytes = fs.readFileSync(path.join(__dirname, 'source-bindings.json'));
const bindings = JSON.parse(policyBytes);
const verified = new WeakSet();
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const objectId = (kind, bytes) => crypto.createHash('sha1').update(Buffer.from(`${kind} ${bytes.length}\0`)).update(bytes).digest('hex');
function check(ok, message) { if (!ok) throw Error(message); }
function safePath(value) {
  check(typeof value === 'string' && value && !value.includes('\\') && !value.includes('\0') && !path.posix.isAbsolute(value)
    && value.split('/').every(part => part && part !== '.' && part !== '..'), 'Unsafe artifact path');
  return value;
}
function treeId(entries) {
  const root = new Map();
  for (const item of entries) {
    check(['100644', '100755'].includes(item.mode) && /^[a-f0-9]{40}$/.test(item.gitBlob), 'Unsupported Git tree member');
    const parts = safePath(item.path).split('/'); let node = root;
    for (const part of parts.slice(0, -1)) {
      if (!node.has(part)) node.set(part, new Map());
      check(node.get(part) instanceof Map, 'Ambiguous Git tree path'); node = node.get(part);
    }
    check(!node.has(parts.at(-1)), 'Duplicate Git tree path'); node.set(parts.at(-1), item);
  }
  function encode(node) {
    const rows = [...node].map(([name, value]) => ({ name, mode: value instanceof Map ? '40000' : value.mode,
      id: value instanceof Map ? encode(value) : value.gitBlob, sort: name + (value instanceof Map ? '/' : '') }));
    rows.sort((a, b) => Buffer.compare(Buffer.from(a.sort), Buffer.from(b.sort)));
    return objectId('tree', Buffer.concat(rows.map(row => Buffer.concat([Buffer.from(`${row.mode} ${row.name}\0`), Buffer.from(row.id, 'hex')]))));
  }
  return encode(root);
}
function verifyRepository(repo, expectedSha) {
  check(repo && repo.sha === expectedSha && /^[a-f0-9]{40}$/.test(expectedSha), 'Wrong pinned repository identity');
  const commit = Buffer.from(repo.commit, 'base64');
  check(objectId('commit', commit) === expectedSha, 'Commit object identity mismatch');
  const tree = /^tree ([a-f0-9]{40})\n/.exec(commit.toString('utf8'))?.[1];
  check(tree && tree === repo.tree && treeId(repo.files) === tree, 'Incomplete or altered tracked closure');
}
function tarMembers(archive) {
  const bytes = zlib.gunzipSync(archive, { maxOutputLength: 1024 * 1024 * 1024 });
  const members = new Map(); let offset = 0, ended = false;
  while (offset + 512 <= bytes.length) {
    const header = bytes.subarray(offset, offset + 512); offset += 512;
    if (header.every(byte => byte === 0)) { ended = true; check(bytes.subarray(offset).every(byte => byte === 0), 'Trailing archive content'); break; }
    const string = (start, count) => header.subarray(start, start + count).toString('utf8').replace(/\0.*$/s, '');
    const octal = (start, count) => { const text = string(start, count).trim(); check(/^[0-7]+$/.test(text), 'Invalid tar number'); return parseInt(text, 8); };
    const checksum = octal(148, 8); let sum = 0; for (let i = 0; i < 512; i++) sum += i >= 148 && i < 156 ? 32 : header[i];
    check(sum === checksum && string(257, 5) === 'ustar', 'Invalid tar header');
    check(header[156] === 0 || header[156] === 48, 'Only relative regular archive files are allowed');
    const name = safePath((string(345, 155) ? string(345, 155) + '/' : '') + string(0, 100));
    check(!members.has(name), 'Duplicate archive member');
    const size = octal(124, 12), mode = octal(100, 8);
    check([0o644, 0o755].includes(mode) && offset + size <= bytes.length, 'Invalid archive mode or size');
    members.set(name, { bytes: bytes.subarray(offset, offset + size), mode }); offset += Math.ceil(size / 512) * 512;
  }
  check(ended, 'Truncated archive'); return members;
}
function assertDestinationAncestors(destination) {
  const absolute = path.resolve(destination);
  let current = path.parse(absolute).root;
  for (const segment of path.relative(current, absolute).split(path.sep)) {
    current = path.join(current, segment);
    let stat;
    try { stat = fs.lstatSync(current); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    check(!stat.isSymbolicLink(), 'Symlinked artifact destination ancestor');
    check(stat.isDirectory(), 'Non-directory artifact destination ancestor');
  }
}
function createSourceProvider({ archive, destination, expected }) {
  destination = path.resolve(destination);
  assertDestinationAncestors(destination);
  check(expected && /^[a-f0-9]{64}$/.test(expected.archiveSha256) && /^[a-f0-9]{64}$/.test(expected.manifestSha256), 'Trusted artifact digests required');
  const archiveBytes = fs.readFileSync(archive); check(hash(archiveBytes) === expected.archiveSha256, 'Archive digest mismatch');
  const members = tarMembers(archiveBytes), manifestBytes = members.get('manifest.json')?.bytes;
  check(manifestBytes && hash(manifestBytes) === expected.manifestSha256, 'Manifest digest mismatch');
  const manifest = JSON.parse(manifestBytes);
  check(manifest.format === 1 && manifest.repository === 'konnilabs/xtend' && manifest.demoRepository === 'konnilabs/xtend-demos'
    && manifest.context?.runId === expected.context?.runId && manifest.context?.runAttempt === expected.context?.runAttempt && Object.keys(manifest.context).length === 2, 'Artifact run/repository identity mismatch');
  verifyRepository(manifest.core, expected.coreSha); verifyRepository(manifest.demo, expected.demoSha);
  verifyRepository(manifest.historical, bindings.historicalCoreSha);
  check(['committed', 'local-uncommitted-proposal'].includes(expected.producerMode)
    && manifest.producer?.mode === expected.producerMode, 'Producer trust mode mismatch');
  check(manifest.producer.policySha256 === hash(policyBytes), 'Source-binding policy differs from producer');
  if (expected.producerMode === 'committed') {
    for (const [name, digest] of [['scripts/build-union-source-artifact.py', manifest.producer.implementationSha256],
      ['tools/schema-inventory/source-bindings.json', manifest.producer.policySha256]]) {
      const row = manifest.core.files.find(item => item.path === name);
      check(row && row.sha256 === digest, 'Producer tooling is not bound to expected Core Git objects');
    }
  }
  const index = new Map(), materialized = [];
  function current(owner, repo) {
    for (const row of repo.files) {
      const binding = owner === 'demo' && bindings.bindings.find(item => item.sourcePath === row.path);
      const logicalPath = owner === 'core' ? row.path : binding ? binding.formerPath : '@demo/' + row.path;
      check(!index.has(logicalPath), 'Ambiguous current owner/path mapping');
      const memberPath = `current/${owner}/${row.path}`, member = members.get(memberPath);
      check(member && member.bytes.length === row.bytes && hash(member.bytes) === row.sha256
        && objectId('blob', member.bytes) === row.gitBlob && member.mode === parseInt(row.mode.slice(3), 8), 'Current source integrity mismatch: ' + memberPath);
      const record = { owner, path: row.path, logicalPath, memberPath, sha256: row.sha256, gitBlob: row.gitBlob, bytes: row.bytes, mode: row.mode };
      index.set(logicalPath, record); materialized.push(record);
    }
  }
  current('core', manifest.core); current('demo', manifest.demo);
  const evidence = [];
  for (const binding of bindings.bindings) {
    const row = manifest.historical.files.find(item => item.path === binding.formerPath), old = binding.historical;
    const memberPath = 'evidence/historical/' + binding.formerPath, member = members.get(memberPath);
    check(row && row.gitBlob === old.gitBlob && member && member.bytes.length === old.bytes && hash(member.bytes) === old.sha256
      && objectId('blob', member.bytes) === row.gitBlob && member.mode === parseInt(row.mode.slice(3), 8), 'Historical comparison evidence mismatch');
    evidence.push({ memberPath, owner: 'historical', path: binding.formerPath, bytes: old.bytes, sha256: old.sha256 });
    check(index.get(binding.formerPath)?.owner === 'demo', 'Missing current mapped source');
  }
  const pin = JSON.parse(members.get('current/core/product-demos.lock.json')?.bytes || '{}');
  check(pin.repository === 'https://github.com/konnilabs/xtend-demos.git' && pin.demoSha === expected.demoSha
    && /^[a-f0-9]{40}$/.test(pin.implementationCoreSha), 'Current Core Demo pin mismatch');
  const demoPin = JSON.parse(members.get('current/demo/candidate-source.lock.json')?.bytes || '{}');
  check(demoPin.repository === 'https://github.com/konnilabs/xtend.git' && demoPin.coreSha === pin.implementationCoreSha, 'Paired implementation pin mismatch');
  const allowed = new Set(['manifest.json', ...materialized.map(row => row.memberPath), ...evidence.map(row => row.memberPath)]);
  check(members.size === allowed.size && [...members.keys()].every(name => allowed.has(name)), 'Unexpected artifact member');
  assertDestinationAncestors(destination);
  check(!fs.existsSync(destination), 'Artifact destination must be new'); fs.mkdirSync(destination, { recursive: true });
  for (const [name, member] of members) { const target = path.join(destination, name); assertDestinationAncestors(path.dirname(target)); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, member.bytes, { flag: 'wx', mode: member.mode }); }
  function recheck(row) {
    const target = path.join(destination, row.memberPath), stat = fs.lstatSync(target);
    check(fs.realpathSync(target) === target && fs.realpathSync(destination) === destination, 'Materialized link boundary changed');
    check(stat.isFile() && !stat.isSymbolicLink() && stat.size === row.bytes && hash(fs.readFileSync(target)) === row.sha256, 'Materialized source changed');
    return target;
  }
  const provenance = { coreSha: expected.coreSha, demoSha: expected.demoSha, archiveSha256: expected.archiveSha256,
    manifestSha256: expected.manifestSha256, producer: manifest.producer, context: manifest.context, productiveFiles: materialized.length, historicalProductiveFiles: 0,
    bindings: materialized.map(({ owner, path, logicalPath, sha256, gitBlob }) => ({ owner, sourcePath: path, logicalPath, sha256, gitBlob })) };
  const provider = Object.freeze({
    files() { evidence.forEach(recheck); return materialized.map(row => ({ ...row, absolutePath: recheck(row) })); },
    hasCurrent(relative) { const row = index.get(relative); if (!row) return false; recheck(row); return true; },
    readCurrent(relative) { check(index.has(relative), 'Missing current source'); const row = index.get(relative), bytes = fs.readFileSync(recheck(row)); check(hash(bytes) === row.sha256, 'Current source changed during read'); return bytes; },
    originalPath(relative) { return index.get(relative)?.path || relative; },
    provenance() { return structuredClone(provenance); },
    exportMappings(files, extract) {
      return ['core', 'demo'].flatMap(owner => extract(null, files.filter(file => file.owner === owner)).map(mapping => {
        const exact = materialized.find(row => row.owner === owner && row.path === mapping.target);
        // Expand wildcard exports against the complete owning source list using
        // the existing mapping matcher, with no cross-owner target collision.
        if (exact) return { ...mapping, target: exact.logicalPath };
        if (!mapping.target.includes('*')) return { ...mapping, target: owner === 'core' ? mapping.target : '@demo/' + mapping.target };
        const regex = new RegExp('^' + mapping.target.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.+)') + '$');
        return materialized.filter(row => row.owner === owner && regex.test(row.path)).map(row => {
          let module = mapping.module; for (const match of row.path.match(regex).slice(1)) module = module.replace('*', match);
          return { target: row.logicalPath, module };
        });
      }).flat());
    }
  }); verified.add(provider); return provider;
}
function assertSourceProvider(provider) { check(verified.has(provider), 'Verified manifest-backed source provider required'); }
module.exports = { createSourceProvider, assertSourceProvider };
