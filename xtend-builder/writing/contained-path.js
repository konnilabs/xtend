'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function validateContainedPath(root, target) {
  const canonicalRoot = fs.realpathSync(root);
  const relative = path.relative(canonicalRoot, path.resolve(target));
  if (!relative || path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`)) throw new Error('Scaffold path is outside its canonical project root.');
  let current = canonicalRoot;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    try {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) throw new Error('Scaffold paths must not contain symlinks.');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return target;
}

function atomicContainedWrite(root, target, content) {
  validateContainedPath(root, target);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  validateContainedPath(root, target);
  const parent = fs.statSync(path.dirname(target));
  const originalTarget = fs.existsSync(target) ? fs.lstatSync(target) : null;
  const temp = path.join(path.dirname(target), `.xtend-${crypto.randomBytes(16).toString('hex')}.tmp`);
  let fd;
  try {
    fd = fs.openSync(temp, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | (fs.constants.O_NOFOLLOW || 0), 0o600);
    fs.writeFileSync(fd, content, 'utf8');
    fs.fsyncSync(fd);
    // Preserve mode when replacing an existing regular file.
    const mode = fs.existsSync(target) ? fs.lstatSync(target).mode & 0o777 : 0o666 & ~process.umask();
    fs.fchmodSync(fd, mode);
    validateContainedPath(root, target);
    const currentParent = fs.statSync(path.dirname(target));
    if (parent.dev !== currentParent.dev || parent.ino !== currentParent.ino) throw new Error('Scaffold target directory changed while writing.');
    const currentTarget = fs.existsSync(target) ? fs.lstatSync(target) : null;
    if (Boolean(originalTarget) !== Boolean(currentTarget) || originalTarget && (originalTarget.dev !== currentTarget.dev || originalTarget.ino !== currentTarget.ino || originalTarget.size !== currentTarget.size || originalTarget.mtimeMs !== currentTarget.mtimeMs)) throw new Error('Scaffold target file changed while writing.');
    fs.renameSync(temp, target);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

module.exports = {validateContainedPath, atomicContainedWrite};
