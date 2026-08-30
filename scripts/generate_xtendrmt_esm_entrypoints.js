const fs = require('fs');
const path = require('path');

const TARGETS = Object.freeze([
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js'
]);

const PRIVATE_INITIALIZER = [
  '/* Private build scope: ESM evaluation never reads or mutates host globals. */',
  'const __XTENDRMT_GLOBAL__ = { AppModules: Object.create(null) };'
].join('\n');
const LOCAL_INITIALIZER = [
  '/* module-local factory registry; AppModules remains the writable compatibility mirror */',
  'const __XTENDRMT_COMPAT_APP_MODULES__ = (',
  '    __XTENDRMT_GLOBAL__.AppModules',
  "    && typeof __XTENDRMT_GLOBAL__.AppModules === 'object'",
  '  ) ? __XTENDRMT_GLOBAL__.AppModules : {};',
  'const __XTENDRMT_MODULE_APP_MODULES__ = {};',
  '__XTENDRMT_GLOBAL__.AppModules = __XTENDRMT_MODULE_APP_MODULES__;'
].join('\n');
const LOCAL_EXPORT = [
  'const AppModules = Object.freeze({ ...__XTENDRMT_MODULE_APP_MODULES__ });',
  'Object.assign(__XTENDRMT_COMPAT_APP_MODULES__, AppModules);',
  '__XTENDRMT_GLOBAL__.AppModules = __XTENDRMT_COMPAT_APP_MODULES__;'
].join('\n');
const PRIVATE_EXPORT = 'const AppModules = Object.freeze({ ...__XTENDRMT_GLOBAL__.AppModules });';

function replaceExactlyOnce(source, current, replacement, target) {
  const first = source.indexOf(current);
  const last = source.lastIndexOf(current);
  if (first < 0 || first !== last) {
    throw new Error(`${target}: expected exactly one canonical ESM wrapper marker: ${current}`);
  }
  return `${source.slice(0, first)}${replacement}${source.slice(first + current.length)}`;
}

function generateEntrypoint(source, target) {
  const text = String(source || '');
  if (text.includes(PRIVATE_INITIALIZER) && text.includes(PRIVATE_EXPORT)) return text;
  const hasLocalInitializer = text.includes(LOCAL_INITIALIZER);
  const hasLocalExport = text.includes(LOCAL_EXPORT);
  if (hasLocalInitializer || hasLocalExport) {
    if (!hasLocalInitializer || !hasLocalExport) {
      throw new Error(`${target}: partial module-local ESM wrapper generation detected`);
    }
    return text.replace(LOCAL_INITIALIZER, PRIVATE_INITIALIZER).replace(LOCAL_EXPORT, PRIVATE_EXPORT);
  }
  throw new Error(`${target}: missing the private ESM factory scope`);
}

function generateXtendRmtEsmEntrypoints(options = {}) {
  const rootDir = path.resolve(options.rootDir || path.resolve(__dirname, '..'));
  const write = options.write !== false;
  const reports = TARGETS.map((target) => {
    const absolutePath = path.join(rootDir, target);
    const previous = fs.readFileSync(absolutePath, 'utf8');
    const next = generateEntrypoint(previous, target);
    const changed = previous !== next;
    if (write && changed) fs.writeFileSync(absolutePath, next);
    return { target, changed };
  });
  return {
    schema: 'xtend.rmt.esm-entrypoint-generation.v1',
    write,
    targets: reports
  };
}

if (require.main === module) {
  const report = generateXtendRmtEsmEntrypoints({
    rootDir: process.cwd(),
    write: !process.argv.includes('--check')
  });
  if (process.argv.includes('--check') && report.targets.some((target) => target.changed)) {
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(report, null, 2));
}

module.exports = {
  generateEntrypoint,
  generateXtendRmtEsmEntrypoints
};
