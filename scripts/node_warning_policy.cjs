'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { classifyWarning } = require('./node_warning_policy_classifier.cjs');

const rootDir = path.resolve(__dirname, '..');
const policy = process.env.XTEND_NODE_WARNING_POLICY || 'report';
const reportPath = process.env.XTEND_NODE_WARNING_REPORT
  ? path.resolve(rootDir, process.env.XTEND_NODE_WARNING_REPORT)
  : path.resolve(rootDir, '.xtend-test-results/runtime/xtend-node-warnings.jsonl');

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
  reportPath
};
