const fs = require('node:fs');
const path = require('node:path');

// Contract checks must inspect the class implementation after the legacy entry
// was split. Follow only explicit local definition/core imports, never infer an
// implementation merely because a similarly named file happens to exist.
function readComponentSourceFiles(relativePath, rootDir = path.resolve(__dirname, '../../..')) {
  const componentRoot = path.resolve(rootDir, 'components');
  const visited = new Set();
  const files = [];
  function visit(file) {
    const absolute = path.resolve(file);
    if (absolute !== componentRoot && !absolute.startsWith(componentRoot + path.sep)) throw new Error('Component source reference escapes the components directory');
    if (visited.has(absolute)) return;
    visited.add(absolute);
    const source = fs.readFileSync(absolute, 'utf8');
    files.push({ path: path.relative(rootDir, absolute).split(path.sep).join('/'), source });
    const entryStem = path.basename(absolute).replace(/(?:\.(?:definition|core))?\.js$/u, '');
    const references = source.matchAll(/(?:\b(?:import|export)\s+(?:[^;\n]*?\s+from\s*)?['"]|\bimport\(\s*['"])(\.\.?\/[^'"\n]+(?:\.definition|\.core)\.js)['"]/gu);
    for (const match of references) {
      // A state/service dependency is not the implementation of this component.
      const referenceStem = path.basename(match[1]).replace(/\.(?:definition|core)\.js$/u, '');
      if (referenceStem === entryStem) visit(path.resolve(path.dirname(absolute), match[1]));
    }
  }
  visit(path.resolve(rootDir, relativePath));
  return files;
}

function readComponentSource(relativePath, rootDir) {
  return readComponentSourceFiles(relativePath, rootDir).map((file) => file.source).join('\n');
}

function resolveComponentImplementationPath(relativePath, rootDir = path.resolve(__dirname, '../../..')) {
  const files = readComponentSourceFiles(relativePath, rootDir);
  const implementation = files.find((file) => /\.(?:definition|core)\.js$/u.test(file.path));
  return path.resolve(rootDir, implementation ? implementation.path : relativePath);
}

module.exports = { readComponentSource, readComponentSourceFiles, resolveComponentImplementationPath };
