'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const policy = process.env.XTEND_NODE_WARNING_POLICY || 'report';
const reportPath = process.env.XTEND_NODE_WARNING_REPORT
  ? path.resolve(rootDir, process.env.XTEND_NODE_WARNING_REPORT)
  : path.resolve(rootDir, '.xtend-test-results/runtime/xtend-node-warnings.jsonl');

function normalized(value) {
  return String(value || '').replaceAll('\\', '/');
}

function safeToken(value, fallback) {
  const token = String(value || '').replace(/[^a-zA-Z0-9_.-]/gu, '').slice(0, 80);
  return token || fallback;
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function classifyWarning(warning) {
  const stack = normalized(warning && warning.stack);
  const normalizedRoot = `${normalized(rootDir)}/`;
  const frames = stack.split('\n').map((line) => line.trim());
  const sourceFrame = frames.find((line) => line.includes(normalizedRoot)) || null;
  const classification = sourceFrame
    ? sourceFrame.includes('/node_modules/') ? 'third-party' : 'project'
    : 'runtime';
  const source = sourceFrame
    ? normalized(path.relative(rootDir, sourceFrame.slice(sourceFrame.indexOf(normalizedRoot) + normalizedRoot.length)))
        .replace(/[):].*$/u, '')
        .slice(0, 240)
    : null;
  return {
    schema: 'xtend.node-warning-record.v1',
    type: 'warning',
    classification,
    name: safeToken(warning && warning.name, 'Warning'),
    code: safeToken(warning && warning.code, 'NO_CODE'),
    source,
    messageFingerprint: fingerprint(warning && warning.message),
    stackFingerprint: fingerprint(stack)
  };
}

function appendRecord(record) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  if (!fs.existsSync(reportPath)) {
    const session = {
      schema: 'xtend.node-warning-evidence.v1',
      type: 'session',
      policy,
      runtime: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    try {
      fs.writeFileSync(reportPath, `${JSON.stringify(session)}\n`, { flag: 'wx' });
    } catch (error) {
      if (!error || error.code !== 'EEXIST') throw error;
    }
  }
  fs.appendFileSync(reportPath, `${JSON.stringify(record)}\n`);
}

if (process.env.XTEND_NODE_WARNING_POLICY) {
  process.on('warning', (warning) => {
    const record = classifyWarning(warning);
    appendRecord(record);
    if (policy === 'project-error' && record.classification === 'project') {
      process.exitCode = 1;
    }
  });
}

module.exports = {
  classifyWarning,
  reportPath
};
