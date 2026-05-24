const fs = require('fs');
const os = require('os');
const path = require('path');

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..', '..');
}

function resolveRepoPath(relativePath, rootDir) {
  const resolvedRoot = resolveRootDir(rootDir);
  const primaryPath = path.join(resolvedRoot, relativePath);
  if (fs.existsSync(primaryPath)) return primaryPath;

  const docsMatch = typeof relativePath === 'string' && relativePath.match(/^docs\/(.+\.md)$/);
  if (docsMatch) {
    const localizedPath = path.join(resolvedRoot, 'docs', 'de', docsMatch[1]);
    if (fs.existsSync(localizedPath)) return localizedPath;
  }

  return primaryPath;
}

function readText(relativePath, rootDir) {
  return fs.readFileSync(resolveRepoPath(relativePath, rootDir), 'utf8');
}

function readJson(relativePath, rootDir) {
  return JSON.parse(readText(relativePath, rootDir));
}

function createTempCopyPath(relativePath, extension = '.tmp') {
  return path.join(
    os.tmpdir(),
    `xtend-${relativePath.replace(/[\\/]/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')}${extension}`
  );
}

module.exports = {
  createTempCopyPath,
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
};
