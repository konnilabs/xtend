'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');

test('RMTX SSR API1, wire3, port11 and resume4 retain closed typed entrypoints', () => {
  const program = ts.createProgram([path.join(root, 'tests/types/rmtx_ssr_handoff.mts')], {
    noEmit: true, strict: true, skipLibCheck: false, types: [], target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext
  });
  const errors = ts.getPreEmitDiagnostics(program);
  assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, {
    getCurrentDirectory: () => root, getCanonicalFileName: file => file, getNewLine: () => '\n'
  }));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tools/package.json'), 'utf8'));
  const entry = manifest.exports['./xtensions/state-binding-resume'];
  assert.deepEqual(entry, { types: './xtensions/state-binding-resume.d.ts', default: './xtensions/state-binding-resume.js' });
  assert.equal(require('@ccslabs/xtend-compiler/xtensions/state-binding-resume').XTENSION_RMTX_RESUME_STATE_BINDING_API_VERSION, '4.0.0');
  for (const target of Object.values(entry)) assert.equal(fs.statSync(path.resolve(root, 'tools', target)).isFile(), true);
});
