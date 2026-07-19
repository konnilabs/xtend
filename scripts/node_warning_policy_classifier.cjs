'use strict';

const crypto = require('node:crypto');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

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

module.exports = { classifyWarning };
