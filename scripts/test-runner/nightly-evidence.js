'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { catalog, rootDir, hash, profileIds, profileGroups } = require('./catalog');
const { provenance, verifyExecution, summaryFor } = require('./executor');

const SESSION_PATH = '.xtend-test-results/nightly/session.json';
const ACCEPTANCE_PATH = '.xtend-test-results/nightly/acceptance.json';
const contract = () => catalog.ci['ci-nightly'];
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function safePath(root, relative) {
  const file = path.resolve(root, relative);
  if (!file.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`Artifact escapes project root: ${relative}`);
  const realRoot = fs.realpathSync(root);
  if (fs.existsSync(file) && !fs.realpathSync(file).startsWith(`${realRoot}${path.sep}`)) throw new Error(`Artifact symlink escapes project root: ${relative}`);
  return file;
}

function validPng(bytes) {
  if (!bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return false;
  let offset = 8, header = false, end = false;
  const data = [];
  while (offset + 12 <= bytes.length) {
    const size = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8);
    if (offset + 12 + size > bytes.length) return false;
    let crc = 0xffffffff;
    for (const byte of bytes.subarray(offset + 4, offset + 8 + size)) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    if (((crc ^ 0xffffffff) >>> 0) !== bytes.readUInt32BE(offset + 8 + size)) return false;
    if (type === 'IHDR') { if (offset !== 8 || size !== 13 || !bytes.readUInt32BE(offset + 8) || !bytes.readUInt32BE(offset + 12)) return false; header = true; }
    if (type === 'IDAT') data.push(bytes.subarray(offset + 8, offset + 8 + size));
    offset += size + 12;
    if (type === 'IEND') { end = size === 0 && offset === bytes.length; break; }
  }
  try { return header && end && data.length > 0 && zlib.inflateSync(Buffer.concat(data), { maxOutputLength: 64 * 1024 * 1024 }).length > 0; }
  catch { return false; }
}

function inspectArtifact(definition, options = {}) {
  const root = options.rootDir || rootDir;
  const record = { path: definition.path, exists: false, valid: false, errors: [] };
  try {
    const file = safePath(root, definition.path);
    const stat = fs.statSync(file);
    if (!stat.isFile()) throw new Error('Expected a regular file');
    const bytes = fs.readFileSync(file);
    Object.assign(record, { exists: true, bytes: bytes.length, mtime: stat.mtime.toISOString(), sha256: hash(bytes) });
    if (!bytes.length) throw new Error('Artifact is empty');
    if (options.startedAt && stat.mtimeMs < Date.parse(options.startedAt) - 1000) throw new Error('Artifact predates its producing phase');
    if (definition.kind === 'png') {
      if (!validPng(bytes)) throw new Error('Invalid PNG evidence');
    } else {
      const value = JSON.parse(bytes.toString('utf8'));
      if (definition.kind === 'pack') {
        if (!Array.isArray(value) || value.length !== 1 || !value[0].name || !value[0].version || !value[0].integrity || !value[0].files?.length) throw new Error('Invalid npm package evidence');
      } else {
        if (!value || Array.isArray(value) || typeof value !== 'object' || typeof value.schema !== 'string') throw new Error('Missing report schema');
        if (definition.kind === 'outcome' && value.ok !== true && value.status !== 'passed') throw new Error('Artifact has no positive outcome');
        if (value.ok === false || value.status === 'failed' || value.failedCount > 0 || value.failureCount > 0 || value.errors?.length) throw new Error('Artifact reports failure');
        if (value.schema === 'xtend.test.report.v1') {
          if (!Array.isArray(value.suites) || value.suiteCount !== value.suites.length || value.skippedCount !== 0 || value.suites.some(s=>s.status !== 'passed' || s.exitCode !== 0 || s.failureCount || s.failures?.length || s.skipCount)) throw new Error('Incomplete or negative test coverage');
          if (definition.profile && options.executionReport) {
            const expected = summaryFor(options.executionReport, profileIds(definition.profile));
            if (JSON.stringify(value) !== JSON.stringify(expected)) throw new Error('Report differs from authoritative suite results');
          }
        }
        if (definition.kind === 'execution' && (!value.complete || value.status !== 'passed')) throw new Error('Incomplete execution');
      }
    }
    record.valid = true;
  } catch (error) { record.errors.push(error.message); }
  return record;
}

function validateNightly(options = {}) {
  const root = options.rootDir || rootDir, definition = options.contract || contract();
  const errors = [], outputs = {};
  let session, executionReport, identity;
  try { identity = options.provenance || provenance(); } catch (error) { errors.push(`Provenance: ${error.message}`); }
  try {
    session = options.session || readJson(path.join(root, SESSION_PATH));
    if (session.schema !== 'xtend.ci.nightly-session.v1') errors.push('Invalid nightly session');
    for (const key of ['run','commit','sourceFingerprint','catalogFingerprint','runtime']) if (JSON.stringify(session.identity?.[key]) !== JSON.stringify(identity?.[key])) errors.push(`Nightly provenance mismatch: ${key}`);
    for (const [id, phase] of Object.entries(definition.phases)) {
      const result = session.phases?.[id];
      outputs[id] = result?.status === 'passed' ? 'success' : 'failure';
      if (phase.blocking && (!result?.completedAt || result.status !== 'passed')) errors.push(`${id}: ${result?.errors?.join('; ') || 'missing or incomplete phase'}`);
    }
  } catch (error) { errors.push(`Session: ${error.message}`); }
  try {
    executionReport = options.executionReport || readJson(path.join(root, '.xtend-test-results/xtend-test-execution.json'));
    const verified = verifyExecution({ executionReport, verify: 'ci-nightly', provenance: identity, project: false });
    if (verified.status !== 'passed') errors.push(...verified.errors, 'Required nightly suites failed or are incomplete');
    for (const group of profileGroups('ci-nightly')) {
      const summary = summaryFor(executionReport, profileIds(group));
      outputs[group] = verified.errors.length === 0 && summary.status === 'passed' && !summary.skippedCount ? 'success' : 'failure';
    }
  } catch (error) { errors.push(`Execution: ${error.message}`); }
  const artifacts = definition.artifacts.map(spec => {
    const phase = session?.phases?.[spec.producer];
    const record = inspectArtifact(spec, { rootDir: root, startedAt: phase?.startedAt, executionReport });
    const captured = phase?.artifacts?.find(a=>a.path === spec.path);
    if (!captured?.valid || captured.sha256 !== record.sha256) { record.valid = false; record.errors.push('Artifact missing from phase receipt or changed after capture'); }
    if (!record.valid) errors.push(`${spec.path}: ${record.errors.join('; ')}`);
    return record;
  });
  return { schema: 'xtend.ci.nightly-acceptance.v1', generatedAt: new Date().toISOString(),
    ok: errors.length === 0, complete: Boolean(session) && artifacts.every(a=>a.exists),
    identity: identity || null, executionId: executionReport?.executionId || null, errors, artifacts, outputs };
}

module.exports = { SESSION_PATH, ACCEPTANCE_PATH, contract, safePath, inspectArtifact, validateNightly, validPng };
