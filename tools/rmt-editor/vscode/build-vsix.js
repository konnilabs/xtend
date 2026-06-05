#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const EXTENSION_DIR = __dirname;
const BUILD_ROOT = path.join(EXTENSION_DIR, '.xtend-test-results', 'vscode-vsix-build');
const STAGE_DIR = path.join(BUILD_ROOT, 'stage');
const EXTENSION_STAGE_DIR = path.join(STAGE_DIR, 'extension');
const LEGACY_DEPENDENCY_VSIX = path.join(EXTENSION_DIR, 'xtend-rmt-language-0.0.0-enterprise-readiness.vsix');

const FILES_TO_STAGE = [
  'extension.js',
  'extension.d.ts',
  'language-configuration.json',
  'package.json',
  'README.md',
  'XTend-Logo.png'
];

const DIRECTORIES_TO_STAGE = [
  'syntaxes',
  'snippets',
  'templates'
];

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

function readPackage() {
  return JSON.parse(fs.readFileSync(path.join(EXTENSION_DIR, 'package.json'), 'utf8'));
}

function manifestXml(pkg) {
  const categories = Array.isArray(pkg.categories) ? pkg.categories.join(',') : '';
  const tags = ['snippet', 'rmt', 'RMT', 'XTendRMT', '__ext_rmt'].join(',');
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
  <Default Extension="xml" ContentType="application/xml" />
  <Override PartName="/extension.vsixmanifest" ContentType="text/xml" />
</Types>
`;
}

function stageDependencyTree() {
  if (!fs.existsSync(LEGACY_DEPENDENCY_VSIX)) {
    return false;
  }

  execFileSync('unzip', ['-q', LEGACY_DEPENDENCY_VSIX, 'extension/node_modules/*', '-d', STAGE_DIR], {
    cwd: EXTENSION_DIR,
    stdio: 'pipe'
  });
  return fs.existsSync(path.join(EXTENSION_STAGE_DIR, 'node_modules', 'vscode-languageclient'));
}

function stageExtension() {
  fs.rmSync(BUILD_ROOT, { recursive: true, force: true });
  ensureDir(EXTENSION_STAGE_DIR);
  const dependencyTreeStaged = stageDependencyTree();

  FILES_TO_STAGE.forEach(copyFile);
  DIRECTORIES_TO_STAGE.forEach(copyDir);

  const pkg = readPackage();
  fs.writeFileSync(path.join(STAGE_DIR, 'extension.vsixmanifest'), manifestXml(pkg));
  fs.writeFileSync(path.join(STAGE_DIR, '[Content_Types].xml'), contentTypesXml());

  return { pkg, dependencyTreeStaged };
}

function packageVsix(outputPath) {
  fs.rmSync(outputPath, { force: true });
  execFileSync('zip', ['-qr', outputPath, 'extension', 'extension.vsixmanifest', '[Content_Types].xml'], {
    cwd: STAGE_DIR,
    stdio: 'pipe'
  });
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
    networkRequired: false
  }, null, 2)}\n`);
}

if (require.main === module) {
  main();
}
