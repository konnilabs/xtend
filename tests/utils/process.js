const fs = require('fs');
const { spawnSync } = require('child_process');
const {
  createTempCopyPath,
  resolveRepoPath
} = require('./files');

const ESM_STATEMENT_PATTERN = /(^|\n)\s*(import\s+(?:[\w*{]|['"])|export\s+(\{|\*|default|const|let|var|function|class|async))/u;

function inferSyntaxCheckExtension(relativePath, source, requestedExtension) {
  const extension = requestedExtension || '.js';

  if (extension !== '.js') {
    return extension;
  }

  if (/\.mjs$/u.test(relativePath) || /\.esm\.js$/u.test(relativePath)) {
    return '.mjs';
  }

  if (/\.cjs$/u.test(relativePath)) {
    return '.cjs';
  }

  if (/\bimport\.meta\b/u.test(source) || ESM_STATEMENT_PATTERN.test(source)) {
    return '.mjs';
  }

  return extension;
}

function syntaxCheckFile(relativePath, options = {}) {
  const rootDir = options.rootDir;
  const requestedExtension = options.extension || '.js';
  const sourcePath = resolveRepoPath(relativePath, rootDir);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const extension = inferSyntaxCheckExtension(relativePath, source, requestedExtension);
  const tempPath = createTempCopyPath(relativePath, extension);

  fs.writeFileSync(tempPath, source);

  const result = spawnSync(process.execPath, ['--check', tempPath], {
    encoding: 'utf8'
  });

  return {
    ok: result.status === 0,
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
    message: result.stderr.trim() || result.stdout.trim()
  };
}

module.exports = {
  inferSyntaxCheckExtension,
  syntaxCheckFile
};
