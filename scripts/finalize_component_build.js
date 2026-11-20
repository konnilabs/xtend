#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const artifacts = [
  {
    source: '.xtend-build/components-ts/x-toggle/x-toggle.js',
    target: 'components/xtoggle.definition.js',
    transform(content) {
      return content.replace(/from '\.\.\/\.\.\/\.\.\/components\//g, "from './");
    }
  },
  {
    source: '.xtend-build/components-ts/x-toggle/x-toggle.d.ts',
    target: 'components/xtoggle.d.ts',
    transform(content) {
      return content
        .replace("from '../../../components/xtend-state.js'", "from './xtend-state.js'")
        .replace("from '../../../components/xtend-public-types'", "from './xtend-public-types'")
        .replace(/from '\.\.\/\.\.\/\.\.\/components\//g, "from './");
    }
  },
  {
    source: '.xtend-build/components-ts/x-surface-manager/surface-state-projection-adapter.js',
    target: 'components/xsurfacemanager-state-projection-adapter.js',
    transform(content) {
      return content;
    }
  },
  {
    source: '.xtend-build/components-ts/x-surface-manager/surface-state-projection-adapter.d.ts',
    target: 'components/xsurfacemanager-state-projection-adapter.d.ts',
    transform(content) {
      return content.replace("from './surface-record'", "from './xsurfacemanager-controller.js'");
    }
  },
  {
    source: '.xtend-build/components-ts/x-surface-manager/surface-host-clock-adapter.js',
    target: 'components/xsurfacemanager-host-clock-adapter.js',
    transform(content) {
      return content;
    }
  },
  {
    source: '.xtend-build/components-ts/x-surface-manager/surface-host-clock-adapter.d.ts',
    target: 'components/xsurfacemanager-host-clock-adapter.d.ts',
    transform(content) {
      return content.replace("from './surface-record'", "from './xsurfacemanager-controller.js'");
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
// The generated TypeScript class is the same pure definition consumed by RMT.
// Keep Classic registration in a separate, stable wrapper rather than replacing
// that wrapper with a second class implementation on the next build.
const bootstrap = "// Classic bootstrap. Native RMT loads the shared pure definition directly.\nimport './xtend-state.js';\nimport { defineManagedComponent } from './native-managed.js';\nimport { XToggle } from \"./xtoggle.definition.js\";\nexport * from \"./xtoggle.definition.js\";\ndefineManagedComponent(\"x-toggle\", XToggle);\n\nexport { default } from \"./xtoggle.definition.js\";\n";
fs.writeFileSync(path.join(rootDir,'components/xtoggle.js'),bootstrap);
copied.push({source:'shared-definition-classic-bootstrap',target:'components/xtoggle.js',bytes:Buffer.byteLength(bootstrap)});
console.log(JSON.stringify({
  schema: 'xtend.typescript.component-build-finalizer.v2',
  ok: true,
  copied
}, null, 2));
