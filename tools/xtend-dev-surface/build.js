'use strict';

const fs = require('fs');
const path = require('path');
const {
  COPY_FILES,
  createDevSurfaceBuildReport
} = require('./extension-skeleton');
const {
  createDevSurfaceHandoffRecord
} = require('./contracts');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const SOURCE_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');
const FILES = COPY_FILES.slice();

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(relativePath) {
  const sourcePath = path.join(SOURCE_DIR, relativePath);
  const targetPath = path.join(DIST_DIR, relativePath);
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
  return path.relative(ROOT_DIR, targetPath);
}

function buildDevSurfaceExtension() {
  ensureDir(DIST_DIR);
  FILES.forEach(copyFile);
  const handoff = createDevSurfaceHandoffRecord();
  fs.writeFileSync(path.join(DIST_DIR, 'handoff.json'), `${JSON.stringify(handoff, null, 2)}\n`);
  const report = createDevSurfaceBuildReport({
    rootDir: ROOT_DIR,
    files: FILES
  });
  fs.writeFileSync(path.join(DIST_DIR, 'build-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  return {
    ...report,
    source: path.relative(ROOT_DIR, SOURCE_DIR),
    dist: path.relative(ROOT_DIR, DIST_DIR)
  };
}

if (require.main === module) {
  const report = buildDevSurfaceExtension();
  console.log(`${JSON.stringify(report, null, 2)}\n`);
}

module.exports = {
  FILES,
  buildDevSurfaceExtension
};
