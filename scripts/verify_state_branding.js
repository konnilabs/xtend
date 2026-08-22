const fs = require('fs');
const path = require('path');

const REMOVED_LOWER_BRAND = ['x', 'state'].join('');
const REMOVED_PASCAL_BRAND = ['X', 'State'].join('');
const SCAN_ROOTS = Object.freeze([
  'api.d.ts',
  'api.js',
  'catalog',
  'components',
  'demos',
  'docs',
  'fabric',
  'index.html',
  'package.json',
  'products',
  'scripts',
  'security',
  'src',
  'tests',
  'tools',
  'xcommand',
  'xtend-builder',
  'xtend-loader.js',
  'xtend-maraca',
  'xtend.d.ts',
  'xtend.js',
  'xtendrmt'
]);
const TEXT_EXTENSIONS = Object.freeze(new Set([
  '.cjs', '.css', '.d.ts', '.html', '.js', '.json', '.md', '.mjs', '.php',
  '.rmt', '.ts', '.txt', '.yaml', '.yml'
]));
const ALLOWED_FILES = Object.freeze(new Set([
  'CHANGELOG.md',
  'docs/de/changelog.md',
  'docs/de/migration-0.7-state.md',
  'docs/en/changelog.md',
  'docs/en/migration-0.7-state.md',
  'tests/components/xtend-state.component_suite.js'
]));
const EXCLUDED_PREFIXES = Object.freeze([
  '.git/',
  '.xtend-build/',
  '.xtend-test-results/',
  'development/',
  'node_modules/',
  'products/xtend-mcp/generated/',
  'tests/references/',
  'tests/schemas/'
]);

function normalizePath(value) {
  return String(value || '').split(path.sep).join('/');
}

function isTextFile(relativePath) {
  if (relativePath.endsWith('.d.ts')) return true;
  return TEXT_EXTENSIONS.has(path.extname(relativePath));
}

function isExcluded(relativePath) {
  if (ALLOWED_FILES.has(relativePath)) return true;
  if (EXCLUDED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) return true;
  return relativePath.includes('/site/build/')
    || relativePath.includes('/dist/')
    || relativePath.includes('/node_modules/')
    || relativePath.includes('/.xtend-test-results/');
}

function collectFiles(rootDir, relativePath, files) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) return;
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    const normalized = normalizePath(relativePath);
    if (!isExcluded(normalized) && isTextFile(normalized)) files.push(normalized);
    return;
  }
  fs.readdirSync(absolutePath, { withFileTypes: true }).forEach((entry) => {
    const child = normalizePath(path.join(relativePath, entry.name));
    if (isExcluded(`${child}${entry.isDirectory() ? '/' : ''}`)) return;
    collectFiles(rootDir, child, files);
  });
}

function findRemovedBrand(content) {
  const lowerIndex = content.indexOf(REMOVED_LOWER_BRAND);
  const pascalIndex = content.indexOf(REMOVED_PASCAL_BRAND);
  const indexes = [lowerIndex, pascalIndex].filter((index) => index >= 0);
  return indexes.length ? Math.min(...indexes) : -1;
}

function stripAllowedStorageMigration(content) {
  const storageKey = `${REMOVED_LOWER_BRAND}-data`;
  return String(content).split(storageKey).join('');
}

function lineAt(content, index) {
  return content.slice(0, index).split(/\r?\n/u).length;
}

function verifyStateBranding(options = {}) {
  const rootDir = path.resolve(options.rootDir || path.join(__dirname, '..'));
  const files = [];
  SCAN_ROOTS.forEach((relativePath) => collectFiles(rootDir, relativePath, files));
  const violations = [];

  files.sort().forEach((relativePath) => {
    if (relativePath === 'components/xtend-state.js') return;
    const content = fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
    const scannedContent = relativePath.startsWith('docs/generated/')
      ? stripAllowedStorageMigration(content)
      : content;
    const index = findRemovedBrand(scannedContent);
    if (index >= 0) violations.push(`${relativePath}:${lineAt(content, index)}`);
  });

  const classicPath = path.join(rootDir, 'components/xtend-state.js');
  const classicSource = fs.readFileSync(classicPath, 'utf8');
  const expectedStorageMigration = `const LEGACY_STATE_STORAGE_KEY = '${REMOVED_LOWER_BRAND}-data';`;
  const sanitizedClassicSource = classicSource.replace(expectedStorageMigration, '');
  const classicIndex = findRemovedBrand(sanitizedClassicSource);
  if (!classicSource.includes(expectedStorageMigration) || classicIndex >= 0) {
    violations.push(`components/xtend-state.js:${classicIndex >= 0 ? lineAt(sanitizedClassicSource, classicIndex) : 1}`);
  }

  const removedPaths = [
    path.join('components', `${REMOVED_LOWER_BRAND}.js`),
    path.join('components', `${REMOVED_LOWER_BRAND}.d.ts`),
    path.join('xtendrmt', `rmt-${REMOVED_LOWER_BRAND}-host-adapter.js`),
    path.join('xtendrmt', `rmt-${REMOVED_LOWER_BRAND}-host-adapter.d.ts`)
  ];
  removedPaths.forEach((relativePath) => {
    if (fs.existsSync(path.join(rootDir, relativePath))) violations.push(normalizePath(relativePath));
  });

  return Object.freeze({
    ok: violations.length === 0,
    scannedFileCount: files.length,
    violations: Object.freeze(violations)
  });
}

if (require.main === module) {
  const result = verifyStateBranding();
  if (!result.ok) {
    console.error(`XTend State branding gate failed:\n${result.violations.map((entry) => `- ${entry}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`XTend State branding gate passed (${result.scannedFileCount} files).`);
}

module.exports = { verifyStateBranding };
