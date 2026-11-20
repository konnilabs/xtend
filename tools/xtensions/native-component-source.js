// SPDX-License-Identifier: Apache-2.0
'use strict';
// Node-only build inspection. Does not execute a component or grant DOM rights.
function captureNativeDefinitionClosure(root, module) {
    const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
    const definition = module.replace(/\.js$/, '.definition.js'), seen = new Map(), pending = [definition];
    while (pending.length) {
        const file = pending.pop();
        if (seen.has(file))
            continue;
        const absolute = fs.realpathSync(path.join(root, file)), relative = path.relative(root, absolute).split(path.sep).join('/');
        if (relative.startsWith('../') || path.isAbsolute(relative))
            throw new TypeError('Native shared definition escaped its package.');
        const bytes = fs.readFileSync(absolute);
        seen.set(relative, crypto.createHash('sha256').update(bytes).digest('hex'));
        if (!/\.[cm]?js$/.test(relative))
            continue;
        for (const match of bytes.toString('utf8').matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s*)['"](\.[^'"]+)['"]/g)) {
            const candidate = path.resolve(path.dirname(absolute), match[1]), target = [candidate, candidate + '.js', candidate + '.mjs', candidate + '.cjs', path.join(candidate, 'index.js')].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
            if (!target)
                throw new TypeError('Unresolved shared native component dependency.');
            pending.push(path.relative(root, target).split(path.sep).join('/'));
        }
    }
    const files = [...seen].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([module, sha256]) => ({ module, sha256 }));
    return { definition, files, sha256: crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex') };
}
module.exports = { captureNativeDefinitionClosure };
