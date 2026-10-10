"use strict";
const fs = require('node:fs');
const path = require('node:path');
const ASSET_ROOTS = new Set(['components', 'xtendrmt', 'xcommand', 'xscaler', 'xtend-material', 'xtend-maraca', 'design-tokens']);
function resolveProductAsset(relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.includes('\\')) throw new Error('Invalid public asset path');
  const parts = relative.split('/');
  if (parts.some(part => part === '..' || part === '.') || !(ASSET_ROOTS.has(parts[0]) || relative === 'xtend.css')) throw new Error('Asset is not a public product asset');
  let target = path.resolve(__dirname, relative);
  if(!fs.existsSync(target)&&parts[0]==='xtend-material'){const material=path.dirname(require.resolve('@xtend-material/core/package.json'));target=path.resolve(material, ...parts.slice(1));}
  if (!fs.existsSync(target)) throw new Error(`Public product asset missing: ${relative}`);
  return target;
}
const {generateEntrypoint} = require('./scripts/generate_xtendrmt_esm_entrypoints.js');
module.exports = {resolveProductAsset, generateEntrypoint};
