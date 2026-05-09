const fs = require('fs');
const { spawnSync } = require('child_process');
const {
  createTempCopyPath,
  resolveRepoPath
} = require('./files');

function syntaxCheckFile(relativePath, options = {}) {
  const rootDir = options.rootDir;
  const extension = options.extension || '.js';
  const sourcePath = resolveRepoPath(relativePath, rootDir);
  const tempPath = createTempCopyPath(relativePath, extension);

  fs.writeFileSync(tempPath, fs.readFileSync(sourcePath, 'utf8'));

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
  syntaxCheckFile
};
