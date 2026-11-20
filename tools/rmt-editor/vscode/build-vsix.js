#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const EXTENSION_DIR = __dirname;
const REPO_ROOT = path.resolve(EXTENSION_DIR, '../../..');
const BUILD_ROOT = path.join(EXTENSION_DIR, '.xtend-test-results', 'vscode-vsix-build');
const STAGE_DIR = path.join(BUILD_ROOT, 'stage');
const EXTENSION_STAGE_DIR = path.join(STAGE_DIR, 'extension');
const LEGACY_DEPENDENCY_VSIX = path.join(EXTENSION_DIR, 'xtend-rmt-language-0.0.0-enterprise-readiness.vsix');
const EXPECTED_MCP_VERSION = '0.2.0';

const FILES_TO_STAGE = [
  'extension.js',
  'extension.d.ts',
  'language-configuration.json',
  'rmtx-language-configuration.json',
  'package.json',
  'README.md',
  'XTend-Logo.png'
];

const DIRECTORIES_TO_STAGE = [
  'syntaxes',
  'snippets',
  'templates',
  'icons'
];

const REPO_DIRECTORIES_TO_STAGE = [
  'tools/rmt-language-server',
  'tools/rmt-language',
  'tools/project-index',
  'tools/rmt-linter',
  'tools/xtensions',
  'fabric'
];

const MCP_LOCAL_PACKAGES = new Map([
  ['@ccslabs/xtend-compiler', 'tools'],
  ['@ccslabs/xtend-maraca', 'xtend-maraca'],
  ['@ccslabs/xtend-rmt', 'xtendrmt']
]);

function xmlEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(relativePath) {
  const source = path.join(EXTENSION_DIR, relativePath);
  const target = path.join(EXTENSION_STAGE_DIR, relativePath);
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function copyDir(relativePath) {
  const source = path.join(EXTENSION_DIR, relativePath);
  const target = path.join(EXTENSION_STAGE_DIR, relativePath);
  if (!fs.existsSync(source)) {
    return;
  }
  fs.cpSync(source, target, { recursive: true });
}

function copyRepoDir(relativePath) {
  const source = path.join(REPO_ROOT, relativePath);
  const target = path.join(EXTENSION_STAGE_DIR, relativePath);
  if (!fs.existsSync(source)) {
    return;
  }
  fs.cpSync(source, target, { recursive: true });
}

function packageTarget(root, packageName) {
  return path.join(root, 'node_modules', ...packageName.split('/'));
}

function packageSource(packageName, resolvingFrom = REPO_ROOT) {
  const localSource = MCP_LOCAL_PACKAGES.get(packageName);
  if (localSource) return path.join(REPO_ROOT, localSource);
  // Resolve relative to the actual installed package (including SDK symlinks),
  // so its transitive and nested versions retain Node's own lookup semantics.
  let directory = fs.existsSync(resolvingFrom) ? fs.realpathSync(resolvingFrom) : resolvingFrom;
  for (;;) {
    const candidate = packageTarget(directory, packageName);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  try {
    return path.dirname(require.resolve(`${packageName}/package.json`, { paths: [resolvingFrom, REPO_ROOT] }));
  } catch {
    return packageTarget(REPO_ROOT, packageName);
  }
}

function copyPublishedPackage(sourceRoot, targetRoot) {
  const pkg = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'package.json'), 'utf8'));
  const declaredEntries = Array.isArray(pkg.files) && pkg.files.length > 0
    ? [...pkg.files, 'package.json']
    : fs.readdirSync(sourceRoot).filter((entry) => entry !== 'node_modules');
  const entries = declaredEntries.flatMap((entry) => {
    if (entry === '*.d.ts') return fs.readdirSync(sourceRoot).filter((fileName) => fileName.endsWith('.d.ts'));
    return [entry];
  });
  ensureDir(targetRoot);
  new Set(entries).forEach((entry) => {
    const source = path.join(sourceRoot, entry);
    if (!fs.existsSync(source)) return;
    const target = path.join(targetRoot, entry);
    ensureDir(path.dirname(target));
    fs.cpSync(source, target, { recursive: true });
  });
  return pkg;
}

function stageRuntimePackage(packageName, seen = new Map(), resolvingFrom = REPO_ROOT, parentTarget = EXTENSION_STAGE_DIR) {
  const sourceRoot = packageSource(packageName, resolvingFrom);
  if (!fs.existsSync(path.join(sourceRoot, 'package.json'))) {
    throw new Error(`Missing installed MCP runtime dependency: ${packageName}`);
  }
  const sourceIdentity = fs.realpathSync(sourceRoot);
  const globalSource = seen.get(packageName);
  if (globalSource === sourceIdentity) return;
  const targetRoot = packageTarget(globalSource ? parentTarget : EXTENSION_STAGE_DIR, packageName);
  if (seen.get(targetRoot) === sourceIdentity) return;
  if (!globalSource) seen.set(packageName, sourceIdentity);
  seen.set(targetRoot, sourceIdentity);
  ensureDir(path.dirname(targetRoot));
  fs.rmSync(targetRoot, { recursive: true, force: true });
  const pkg = MCP_LOCAL_PACKAGES.has(packageName)
    ? copyPublishedPackage(sourceRoot, targetRoot)
    : (fs.cpSync(sourceRoot, targetRoot, { recursive: true }), JSON.parse(fs.readFileSync(path.join(sourceRoot, 'package.json'), 'utf8')));
  const optional = new Set(Object.keys(pkg.optionalDependencies || {}));
  for (const dependency of Object.keys({ ...(pkg.dependencies || {}), ...(pkg.optionalDependencies || {}) })) {
    const installed = fs.existsSync(path.join(packageSource(dependency, sourceIdentity), 'package.json'));
    // Local compiler/bundler peers remain optional for read-only MCP operations;
    // an installed external SDK package must have its full required closure.
    if (!installed && (optional.has(dependency) || MCP_LOCAL_PACKAGES.has(packageName))) continue;
    stageRuntimePackage(dependency, seen, sourceIdentity, targetRoot);
  }
}

function stageMcpPackage() {
  const sourceRoot = path.join(REPO_ROOT, 'products', 'xtend-mcp');
  const targetRoot = path.join(EXTENSION_STAGE_DIR, 'products', 'xtend-mcp');
  const pkg = copyPublishedPackage(sourceRoot, targetRoot);
  if (pkg.version !== EXPECTED_MCP_VERSION) {
    throw new Error(`VSIX expects XTend MCP ${EXPECTED_MCP_VERSION}, found ${pkg.version}.`);
  }
  const seen = new Map();
  Object.keys(pkg.dependencies || {}).forEach((dependency) => stageRuntimePackage(dependency, seen));
  const manifest = fs.readFileSync(path.join(targetRoot, 'generated', 'knowledge-manifest.json'));
  const parsedManifest = JSON.parse(manifest.toString('utf8'));
  if (parsedManifest.version !== pkg.version) {
    throw new Error(`XTend MCP package/knowledge version mismatch: ${pkg.version} versus ${parsedManifest.version}.`);
  }
  const docsArtifact = fs.readFileSync(path.join(targetRoot, 'generated', parsedManifest.docs.artifact));
  const docsArtifactSha256 = crypto.createHash('sha256').update(docsArtifact).digest('hex');
  if (docsArtifactSha256 !== parsedManifest.docs.artifactSha256) {
    throw new Error('XTend MCP packaged docs artifact hash does not match its knowledge manifest.');
  }
  return {
    version: pkg.version,
    knowledgeManifestSha256: crypto.createHash('sha256').update(manifest).digest('hex'),
    docsArtifactSha256
  };
}

function readPackage() {
  return JSON.parse(fs.readFileSync(path.join(EXTENSION_DIR, 'package.json'), 'utf8'));
}

function manifestXml(pkg) {
  const categories = Array.isArray(pkg.categories) ? pkg.categories.join(',') : '';
  const tags = ['snippet', 'rmt', 'RMT', 'rmtx', 'RMTX', 'XTendRMT', '__ext_rmt', '__ext_rmtx'].join(',');
  const vscodeEngine = pkg.engines && pkg.engines.vscode ? pkg.engines.vscode : '*';
  const icon = pkg.icon ? `<Icon>extension/${xmlEscape(pkg.icon)}</Icon>` : '';
  const iconAsset = pkg.icon
    ? `<Asset Type="Microsoft.VisualStudio.Services.Icons.Default" Path="extension/${xmlEscape(pkg.icon)}" Addressable="true" />`
    : '';

  return `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="${xmlEscape(pkg.name)}" Version="${xmlEscape(pkg.version)}" Publisher="${xmlEscape(pkg.publisher)}" />
    <DisplayName>${xmlEscape(pkg.displayName || pkg.name)}</DisplayName>
    <Description xml:space="preserve">${xmlEscape(pkg.description || '')}</Description>
    <Tags>${xmlEscape(tags)}</Tags>
    <Categories>${xmlEscape(categories)}</Categories>
    <GalleryFlags>Public</GalleryFlags>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="${xmlEscape(vscodeEngine)}" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="workspace" />
      <Property Id="Microsoft.VisualStudio.Services.GitHubFlavoredMarkdown" Value="true" />
      <Property Id="Microsoft.VisualStudio.Services.Content.Pricing" Value="Free" />
    </Properties>
    ${icon}
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" />
  </Installation>
  <Dependencies />
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true" />
    ${iconAsset}
  </Assets>
</PackageManifest>
`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="application/json" />
  <Default Extension="js" ContentType="application/javascript" />
  <Default Extension="ts" ContentType="application/octet-stream" />
  <Default Extension="md" ContentType="text/markdown" />
  <Default Extension="png" ContentType="image/png" />
  <Default Extension="svg" ContentType="image/svg+xml" />
  <Default Extension="xml" ContentType="application/xml" />
  <Override PartName="/extension.vsixmanifest" ContentType="text/xml" />
</Types>
`;
}

function stageDependencyTree() {
  if (!fs.existsSync(LEGACY_DEPENDENCY_VSIX)) {
    return false;
  }

  if (process.platform === 'win32') {
    const legacyStage = path.join(BUILD_ROOT, 'legacy-vsix');
    ensureDir(legacyStage);
    execFileSync('tar', ['-xf', LEGACY_DEPENDENCY_VSIX, '-C', legacyStage], { cwd: EXTENSION_DIR, stdio: 'pipe' });
    const source = path.join(legacyStage, 'extension', 'node_modules');
    if (fs.existsSync(source)) fs.cpSync(source, path.join(EXTENSION_STAGE_DIR, 'node_modules'), { recursive: true });
    fs.rmSync(legacyStage, { recursive: true, force: true });
  } else {
    execFileSync('unzip', ['-q', LEGACY_DEPENDENCY_VSIX, 'extension/node_modules/*', '-d', STAGE_DIR], {
      cwd: EXTENSION_DIR,
      stdio: 'pipe'
    });
  }
  return fs.existsSync(path.join(EXTENSION_STAGE_DIR, 'node_modules', 'vscode-languageclient'));
}

function stageExtension() {
  fs.rmSync(BUILD_ROOT, { recursive: true, force: true });
  ensureDir(EXTENSION_STAGE_DIR);
  const dependencyTreeStaged = stageDependencyTree();

  FILES_TO_STAGE.forEach(copyFile);
  DIRECTORIES_TO_STAGE.forEach(copyDir);
  REPO_DIRECTORIES_TO_STAGE.forEach(copyRepoDir);
  // Semantic RMTX uses the pinned compiler even when MCP's optional local SDK
  // closure is not installed at the workspace root. Missing TS is a build error.
  stageRuntimePackage('typescript');
  // The RMT format adapter loads its canonical core artifact relative to tools/.
  copyPublishedPackage(path.join(REPO_ROOT, 'xtendrmt'), path.join(EXTENSION_STAGE_DIR, 'xtendrmt'));
  // The staged compiler resolves the shared FastPass validator beside tools/.
  const fastPassTarget = path.join(EXTENSION_STAGE_DIR, 'xtend-maraca', 'fastpass-contract.js');
  ensureDir(path.dirname(fastPassTarget));
  fs.copyFileSync(path.join(REPO_ROOT, 'xtend-maraca', 'fastpass-contract.js'), fastPassTarget);
  const mcpPackage = stageMcpPackage();

  const pkg = readPackage();
  fs.writeFileSync(path.join(STAGE_DIR, 'extension.vsixmanifest'), manifestXml(pkg));
  fs.writeFileSync(path.join(STAGE_DIR, '[Content_Types].xml'), contentTypesXml());

  return { pkg, dependencyTreeStaged, mcpPackage };
}

function packageVsix(outputPath) {
  fs.rmSync(outputPath, { force: true });
  if (process.platform === 'win32') {
    const zipPath = `${outputPath}.zip`;
    fs.rmSync(zipPath, { force: true });
    execFileSync('tar', ['-a', '-cf', zipPath, 'extension', 'extension.vsixmanifest', '[Content_Types].xml'], { cwd: STAGE_DIR, stdio: 'pipe' });
    fs.renameSync(zipPath, outputPath);
  } else {
    execFileSync('zip', ['-qr', outputPath, 'extension', 'extension.vsixmanifest', '[Content_Types].xml'], {
      cwd: STAGE_DIR,
      stdio: 'pipe'
    });
  }
}

function main() {
  const pkg = readPackage();
  const outputArgIndex = process.argv.indexOf('--out');
  const outputName = outputArgIndex >= 0 && process.argv[outputArgIndex + 1]
    ? process.argv[outputArgIndex + 1]
    : `${pkg.name}-${pkg.version}.vsix`;
  const outputPath = path.resolve(EXTENSION_DIR, outputName);
  const result = stageExtension();

  packageVsix(outputPath);

  const stat = fs.statSync(outputPath);
  process.stdout.write(`${JSON.stringify({
    schema: 'xtend.rmt.editor.vscode-local-vsix-build.v1',
    ok: true,
    package: result.pkg.name,
    version: result.pkg.version,
    output: path.relative(EXTENSION_DIR, outputPath),
    bytes: stat.size,
    dependencyTreeStaged: result.dependencyTreeStaged,
    mcpPackage: result.mcpPackage,
    networkRequired: false
  }, null, 2)}\n`);
}

if (require.main === module) {
  main();
}
