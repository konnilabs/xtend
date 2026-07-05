#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const artifacts = [
  {
    source: '.xtend-build/components-ts/x-toggle/x-toggle.js',
    target: 'components/xtoggle.js',
    transform(content) {
      return content.replace("from '../../../components/xstate.js'", "from './xstate.js'");
    }
  },
  {
    source: '.xtend-build/components-ts/x-toggle/x-toggle.d.ts',
    target: 'components/xtoggle.d.ts',
    transform(content) {
      return content
        .replace("from '../../../components/xstate.js'", "from './xstate.js'")
        .replace("from '../../../components/xtend-public-types'", "from './xtend-public-types'");
    }
  }
];

function copyArtifact(record) {
  const sourcePath = path.join(rootDir, record.source);
  const targetPath = path.join(rootDir, record.target);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing TypeScript component build artifact: ${record.source}`);
  }
  const nextContent = `${record.transform(fs.readFileSync(sourcePath, 'utf8')).trimEnd()}\n`;
  fs.writeFileSync(targetPath, nextContent);
  return { source: record.source, target: record.target, bytes: Buffer.byteLength(nextContent) };
}

const copied = artifacts.map(copyArtifact);
console.log(JSON.stringify({
  schema: 'xtend.typescript.component-build-finalizer.v1',
  ok: true,
  copied
}, null, 2));
