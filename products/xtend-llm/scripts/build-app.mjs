import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  PRODUCT_ID,
  PRODUCT_TITLE
} from '../src/main/constants.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(productRoot, '..', '..');
const distRoot = path.join(productRoot, 'dist');
const appName = `${PRODUCT_TITLE}.app`;
const outApp = path.join(distRoot, 'mac', appName);
const require = createRequire(import.meta.url);
const MCP_LOCAL_PACKAGES = new Map([
  ['@ccslabs/xtend-compiler', 'tools'],
  ['@ccslabs/xtend-maraca', 'xtend-maraca'],
  ['@ccslabs/xtend-rmt', 'xtendrmt']
]);

function log(message) {
  console.log(`[xtend-llm-build] ${message}`);
}

function runRmtBuild() {
  const result = spawnSync(process.execPath, [path.join(productRoot, 'scripts', 'rmt-build.mjs')], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 50
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`RMT build failed with status ${result.status}.`);
}

function electronAppRoot() {
  let current = path.resolve(require('electron'));
  while (current !== path.dirname(current)) {
    if (current.endsWith('.app')) return current;
    current = path.dirname(current);
  }
  throw new Error('Could not locate Electron.app from the installed electron package.');
}

function isSameOrInside(filePath, root) {
  const relative = path.relative(path.resolve(root), path.resolve(filePath));
  return relative === '' || Boolean(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function copyPath(source, target, options = {}) {
  const generatedRoots = [
    path.join(productRoot, '.cache'),
    path.join(productRoot, '.xtend-llm-results'),
    distRoot
  ];
  const electronModuleRoot = path.join(productRoot, 'node_modules', 'electron');
  const nodeBinRoot = path.join(productRoot, 'node_modules', '.bin');
  fs.cpSync(source, target, {
    recursive: true,
    dereference: false,
    verbatimSymlinks: true,
    filter(sourcePath) {
      const name = path.basename(sourcePath);
      if (name === '.DS_Store') return false;
      if (options.excludeNodeBin && isSameOrInside(sourcePath, nodeBinRoot)) return false;
      if (options.excludeElectronNodeModule && isSameOrInside(sourcePath, electronModuleRoot)) return false;
      if (options.excludeGenerated && generatedRoots.some((root) => isSameOrInside(sourcePath, root))) return false;
      return true;
    }
  });
}

function packagePath(root, packageName) {
  return path.join(root, ...packageName.split('/'));
}

function mcpPackageSource(packageName) {
  const localSource = MCP_LOCAL_PACKAGES.get(packageName);
  return localSource
    ? path.join(repoRoot, localSource)
    : packagePath(path.join(repoRoot, 'node_modules'), packageName);
}

function copyPublishedPackage(sourceRoot, targetRoot) {
  const pkg = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'package.json'), 'utf8'));
  const declaredEntries = Array.isArray(pkg.files) && pkg.files.length > 0
    ? [...pkg.files, 'package.json']
    : fs.readdirSync(sourceRoot).filter((entry) => entry !== 'node_modules');
  const entries = declaredEntries.flatMap((entry) => (
    entry === '*.d.ts'
      ? fs.readdirSync(sourceRoot).filter((fileName) => fileName.endsWith('.d.ts'))
      : [entry]
  ));
  fs.mkdirSync(targetRoot, { recursive: true });
  new Set(entries).forEach((entry) => {
    const source = path.join(sourceRoot, entry);
    if (!fs.existsSync(source)) return;
    copyPath(source, path.join(targetRoot, entry), { excludeGenerated: false });
  });
  return pkg;
}

function stageMcpRuntimePackage(appNodeModules, packageName, seen = new Set()) {
  if (seen.has(packageName)) return;
  seen.add(packageName);
  const sourceRoot = mcpPackageSource(packageName);
  if (!fs.existsSync(path.join(sourceRoot, 'package.json'))) {
    throw new Error(`Missing installed XTend MCP runtime dependency: ${packageName}`);
  }
  const targetRoot = packagePath(appNodeModules, packageName);
  fs.rmSync(targetRoot, { recursive: true, force: true });
  const pkg = MCP_LOCAL_PACKAGES.has(packageName)
    ? copyPublishedPackage(sourceRoot, targetRoot)
    : (copyPath(sourceRoot, targetRoot, { excludeGenerated: false }), JSON.parse(fs.readFileSync(path.join(sourceRoot, 'package.json'), 'utf8')));
  Object.keys({ ...(pkg.dependencies || {}), ...(pkg.optionalDependencies || {}) })
    .filter((dependency) => fs.existsSync(path.join(mcpPackageSource(dependency), 'package.json')))
    .forEach((dependency) => stageMcpRuntimePackage(appNodeModules, dependency, seen));
}

function stageMcpRuntime(appRoot) {
  const appNodeModules = path.join(appRoot, 'node_modules');
  const sourceRoot = path.join(repoRoot, 'products', 'xtend-mcp');
  const targetRoot = packagePath(appNodeModules, '@ccslabs/xtend-mcp');
  fs.rmSync(targetRoot, { recursive: true, force: true });
  const pkg = copyPublishedPackage(sourceRoot, targetRoot);
  const seen = new Set();
  Object.keys(pkg.dependencies || {}).forEach((dependency) => stageMcpRuntimePackage(appNodeModules, dependency, seen));
  const manifest = fs.readFileSync(path.join(targetRoot, 'generated', 'knowledge-manifest.json'));
  return {
    package: pkg.name,
    version: pkg.version,
    knowledgeManifestSha256: crypto.createHash('sha256').update(manifest).digest('hex')
  };
}

function setPlistValue(plist, key, value) {
  const pattern = new RegExp(`(<key>${key}</key>\\s*<string>)([^<]*)(</string>)`, 'u');
  if (!pattern.test(plist)) return plist;
  return plist.replace(pattern, `$1${value}$3`);
}

function deletePlistKey(plistPath, key) {
  spawnSync('/usr/libexec/PlistBuddy', ['-c', `Delete :${key}`, plistPath], {
    encoding: 'utf8'
  });
}

function updateInfoPlist(appPath) {
  const plistPath = path.join(appPath, 'Contents', 'Info.plist');
  let plist = fs.readFileSync(plistPath, 'utf8');
  plist = setPlistValue(plist, 'CFBundleDisplayName', PRODUCT_TITLE);
  plist = setPlistValue(plist, 'CFBundleName', PRODUCT_TITLE);
  plist = setPlistValue(plist, 'CFBundleExecutable', PRODUCT_TITLE);
  plist = setPlistValue(plist, 'CFBundleIdentifier', `local.${PRODUCT_ID}`);
  plist = setPlistValue(plist, 'LSApplicationCategoryType', 'public.app-category.developer-tools');
  fs.writeFileSync(plistPath, plist);
  deletePlistKey(plistPath, 'ElectronAsarIntegrity');
}

function renameMainExecutable(appPath) {
  const macosRoot = path.join(appPath, 'Contents', 'MacOS');
  const electronExecutable = path.join(macosRoot, 'Electron');
  const productExecutable = path.join(macosRoot, PRODUCT_TITLE);
  if (fs.existsSync(electronExecutable) && electronExecutable !== productExecutable) {
    fs.renameSync(electronExecutable, productExecutable);
  }
}

function removeElectronDefaultApp(resourcesRoot) {
  for (const entry of ['default_app.asar', 'default_app.asar.unpacked']) {
    fs.rmSync(path.join(resourcesRoot, entry), { recursive: true, force: true });
  }
}

function writePackageJson(targetRoot) {
  const sourcePackage = JSON.parse(fs.readFileSync(path.join(productRoot, 'package.json'), 'utf8'));
  const packagedPackage = {
    name: sourcePackage.name,
    version: sourcePackage.version,
    private: true,
    type: 'module',
    main: 'src/main/electron-main.cjs',
    description: sourcePackage.description,
    dependencies: {
      '@ccslabs/xtend-mcp': '0.1.0',
      '@huggingface/transformers': sourcePackage.dependencies['@huggingface/transformers']
    }
  };
  fs.writeFileSync(path.join(targetRoot, 'package.json'), `${JSON.stringify(packagedPackage, null, 2)}\n`);
}

function signAppAdHoc(appPath) {
  if (process.platform !== 'darwin') return;
  const result = spawnSync('codesign', ['--force', '--deep', '--sign', '-', appPath], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`codesign failed with status ${result.status}.`);
}

function main() {
  log('building Maraca bundle');
  runRmtBuild();
  const sourceApp = electronAppRoot();
  log(`using Electron app: ${sourceApp}`);
  fs.rmSync(outApp, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(outApp), { recursive: true });
  copyPath(sourceApp, outApp);
  renameMainExecutable(outApp);
  updateInfoPlist(outApp);

  const resourcesRoot = path.join(outApp, 'Contents', 'Resources');
  removeElectronDefaultApp(resourcesRoot);
  const appRoot = path.join(resourcesRoot, 'app');
  fs.rmSync(appRoot, { recursive: true, force: true });
  fs.mkdirSync(appRoot, { recursive: true });

  for (const entry of ['src', 'site', 'scripts']) {
    copyPath(path.join(productRoot, entry), path.join(appRoot, entry), {
      excludeGenerated: true
    });
  }
  for (const fileName of ['README.md', 'xtend-llm.rmt', 'package-lock.json']) {
    const source = path.join(productRoot, fileName);
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(appRoot, fileName));
  }
  writePackageJson(appRoot);
  copyPath(path.join(productRoot, 'node_modules'), path.join(appRoot, 'node_modules'), {
    excludeElectronNodeModule: true,
    excludeNodeBin: true,
    excludeGenerated: true
  });
  const mcpRuntime = stageMcpRuntime(appRoot);

  const packagedXtendRoot = path.join(outApp, 'Contents', 'xtendrmt');
  fs.rmSync(packagedXtendRoot, { recursive: true, force: true });
  copyPath(path.join(repoRoot, 'xtendrmt'), packagedXtendRoot, {
    excludeGenerated: true
  });

  const manifest = {
    schema: 'xtend-llm.app-build.v1',
    appName: PRODUCT_TITLE,
    appPath: outApp,
    productRoot,
    mcpRuntime,
    builtAt: new Date().toISOString()
  };
  log('ad-hoc signing app bundle');
  signAppAdHoc(outApp);
  fs.writeFileSync(path.join(distRoot, 'mac', 'build-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  log(`built app: ${outApp}`);
}

main();
