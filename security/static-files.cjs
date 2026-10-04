'use strict';
const fs = require('node:fs');
const path = require('node:path');

function resolvePublicFile(root, encodedSuffix) {
  try {
    const suffix = decodeURIComponent(encodedSuffix);
    if (suffix.includes('\0') || path.isAbsolute(suffix) || suffix.includes('\\')) return null;
    const canonicalRoot = fs.realpathSync(root);
    const target = fs.realpathSync(path.resolve(canonicalRoot, suffix));
    const relative = path.relative(canonicalRoot, target);
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
    return fs.statSync(target).isFile() ? target : null;
  } catch (_) { return null; }
}

function streamPublicFile(response, file, headers = {}) {
  let fd;
  try {
    if (!file) throw new Error('Missing static file.');
    fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
    if (!fs.fstatSync(fd).isFile()) throw new Error('Static target must be a regular file.');
  } catch (_) {
    if (fd !== undefined) fs.closeSync(fd);
    response.writeHead(404, {'content-type': 'text/plain; charset=utf-8'});
    response.end('Not found');
    return;
  }
  const source = fs.createReadStream(file, {fd, autoClose: true});
  source.on('error', () => {
    if (response.headersSent) response.destroy();
    else { response.writeHead(404); response.end('Not found'); }
  });
  response.once('close', () => source.destroy());
  response.writeHead(200, headers);
  source.pipe(response);
}

module.exports = {resolvePublicFile, streamPublicFile};
