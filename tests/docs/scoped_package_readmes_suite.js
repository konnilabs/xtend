const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');

const PACKAGE_ANCHORS = {
  '@ccslabs/xtend': ['xtend-loader.js', '@ccslabs/xtend-xsurface-shard', 'xt maraca build'],
  '@ccslabs/xtend-rmt': ['createRmtAppRuntime', 'createRmtDomDescriptorRenderer', 'createRmtNodeSsrAdapter'],
  '@ccslabs/xtend-fabric': ['createXtendFabric', 'createFabricRmtLaneMapping', 'createHydrationPolicyController'],
  '@ccslabs/xtend-cli': ['component-files', 'rmt-app-platform', 'maraca build'],
  '@ccslabs/xtend-compiler': ['compileRmtVNextSource', 'parseRmtVNextSource', 'xtend-rmt-lint'],
  '@ccslabs/xtend-mcp': ['xtend_knowledge_search', 'xtend_rmt_diagnostics', 'xtend_rmt_apply_safe_repairs'],
  '@ccslabs/xtend-maraca': ['createMaracaBuildPlan', 'buildMaracaBundleAsync', 'tuneMaracaBuild'],
  '@xtend-material/core': ['createXtendMaterialDesignKit', 'createMaterialRecipeRegistry', 'createMaterialMaracaPreset'],
  '@xtend-material/maraca-tailwind': ['createTailwindCssProvider', 'createTailwindToolchainApi', 'createRmtCssSourceInventory'],
  '@ccslabs/xtend-xsurface-shard': ['createXSurfaceShardPlan', 'createXSurfaceShardServer', 'publishFragment()']
};

const ASCII_UMLAUT_PATTERN = /\b(?:fuer|ueber|zurueck|oeffentlich|benoetigt|ungueltig|pruefbar|pruefen|ausfuehrbar)\b/iu;

function splitLanguageSections(text) {
  const englishMarker = '<a id="english"></a>';
  const germanMarker = '<a id="deutsch"></a>';
  const englishIndex = text.indexOf(englishMarker);
  const germanIndex = text.indexOf(germanMarker);
  return {
    englishIndex,
    germanIndex,
    english: englishIndex >= 0 && germanIndex > englishIndex
      ? text.slice(englishIndex, germanIndex)
      : '',
    german: germanIndex >= 0 ? text.slice(germanIndex) : ''
  };
}

function executableCodeBlocks(section) {
  const blocks = [];
  const pattern = /```[^\n]*\n([\s\S]*?)```/gu;
  let match;
  while ((match = pattern.exec(section)) !== null) {
    const executable = match[1]
      .split(/\r?\n/u)
      .filter((line) => !/^\s*#/u.test(line))
      .join('\n')
      .trim();
    blocks.push(executable);
  }
  return blocks;
}

function markdownTargets(text) {
  const targets = [];
  const pattern = /!?\[[^\]]*\]\(([^)]+)\)/gu;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const target = match[1].trim().replace(/^<|>$/gu, '');
    if (!target || target.startsWith('#') || /^(?:https?:|mailto:)/iu.test(target)) continue;
    targets.push(target.split('#')[0]);
  }
  return targets.filter(Boolean);
}

function validateReadmeDocument(input) {
  const text = input.text || '';
  const packageName = input.packageName || '';
  const install = input.install || '';
  const anchors = input.anchors || [];
  const rootDir = input.rootDir || process.cwd();
  const readmePath = input.readmePath || 'README.md';
  const errors = [];
  const sections = splitLanguageSections(text);

  if (!/^# .+\n\n\*\*English \(primary\)\*\* \| \[Deutsch\]\(#deutsch\)/u.test(text)) {
    errors.push('missing canonical English-primary language navigation');
  }
  if (sections.englishIndex < 0 || sections.germanIndex < 0 || sections.englishIndex >= sections.germanIndex) {
    errors.push('English section must appear before German section');
  }
  if (!sections.english.includes('## English')) errors.push('missing English heading');
  if (!sections.german.includes('## Deutsch')) errors.push('missing German heading');
  if (sections.english.length < 500) errors.push('English section is too short');
  if (sections.german.length < 500) errors.push('German section is too short');

  [
    ['English', sections.english],
    ['German', sections.german]
  ].forEach(([label, section]) => {
    if (!section.includes(packageName)) errors.push(`${label} section misses package name ${packageName}`);
    if (!section.includes(install)) errors.push(`${label} section misses install command ${install}`);
    if (!section.includes('test:scoped-package-readmes')) errors.push(`${label} section misses README verification command`);
    anchors.forEach((anchor) => {
      if (!section.includes(anchor)) errors.push(`${label} section misses public anchor ${anchor}`);
    });
  });

  const englishCode = executableCodeBlocks(sections.english);
  const germanCode = executableCodeBlocks(sections.german);
  if (JSON.stringify(englishCode) !== JSON.stringify(germanCode)) {
    errors.push('English and German executable code blocks differ');
  }
  if (ASCII_UMLAUT_PATTERN.test(sections.german)) {
    errors.push('German section contains ASCII umlaut transliteration');
  }

  markdownTargets(text).forEach((target) => {
    const absoluteTarget = path.resolve(rootDir, path.dirname(readmePath), target);
    if (!absoluteTarget.startsWith(rootDir) || !fs.existsSync(absoluteTarget)) {
      errors.push(`missing relative Markdown target ${target}`);
    }
  });

  return errors;
}

function runNegativeValidatorChecks(context, rootDir, validInput) {
  const base = validInput.text;
  const cases = [
    {
      name: 'missing German section',
      text: base.slice(0, base.indexOf('<a id="deutsch"></a>')),
      expected: 'English section must appear before German section'
    },
    {
      name: 'wrong language order',
      text: base.replace('<a id="english"></a>', '<a id="temporary"></a>').replace('<a id="deutsch"></a>', '<a id="english"></a>').replace('<a id="temporary"></a>', '<a id="deutsch"></a>'),
      expected: 'English section must appear before German section'
    },
    {
      name: 'different executable example',
      text: base.replace(/(## Deutsch[\s\S]*?)npm install @ccslabs\/xtend/u, '$1npm install @ccslabs/xtend-drift'),
      expected: 'English and German executable code blocks differ'
    },
    {
      name: 'missing public API anchor',
      text: base.replaceAll(validInput.anchors[0], 'removed-public-anchor'),
      expected: `English section misses public anchor ${validInput.anchors[0]}`
    },
    {
      name: 'broken relative link',
      text: `${base}\n[Broken](./does-not-exist.md)\n`,
      expected: 'missing relative Markdown target ./does-not-exist.md'
    }
  ];

  cases.forEach((entry) => {
    const errors = validateReadmeDocument({ ...validInput, text: entry.text, rootDir });
    context.assert(errors.includes(entry.expected), `Validator rejects ${entry.name}`);
  });
}

function runScopedPackageReadmesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'scoped-package-readmes',
    label: 'Scoped Package bilingual READMEs'
  });
  const rootPackage = readJson('package.json', rootDir);
  const packages = Array.isArray(rootPackage.scopedPackages) ? rootPackage.scopedPackages : [];

  context.assert(packages.length === 10, 'Canonical scoped package inventory contains ten public packages');

  packages.forEach((entry) => {
    const packagePath = entry.path === '.' ? 'package.json' : `${entry.path}/package.json`;
    const readmePath = entry.path === '.' ? 'README.md' : `${entry.path}/README.md`;
    const manifest = readJson(packagePath, rootDir);
    const readme = readText(readmePath, rootDir);
    const anchors = PACKAGE_ANCHORS[entry.name] || [];
    const errors = validateReadmeDocument({
      text: readme,
      packageName: entry.name,
      install: entry.install,
      anchors,
      rootDir,
      readmePath
    });

    context.assert(manifest.name === entry.name, `${entry.name} path resolves to matching package manifest`);
    context.assert(manifest.private === false, `${entry.name} remains public`);
    context.assert(Array.isArray(manifest.files) && manifest.files.includes('README.md'), `${entry.name} explicitly packages README.md`);
    context.assert(errors.length === 0, `${entry.name} README passes bilingual drift validation${errors.length ? ` (${errors.join('; ')})` : ''}`);
  });

  const rootEntry = packages.find((entry) => entry.path === '.');
  runNegativeValidatorChecks(context, rootDir, {
    text: readText('README.md', rootDir),
    packageName: rootEntry.name,
    install: rootEntry.install,
    anchors: PACKAGE_ANCHORS[rootEntry.name],
    readmePath: 'README.md'
  });

  return context.result({
    report: {
      packageCount: packages.length,
      packageNames: packages.map((entry) => entry.name)
    }
  });
}

function printScopedPackageReadmesReport(result) {
  printSuiteReport(result, {
    successTitle: 'Scoped Package README gate passed.',
    failureTitle: 'Scoped Package README gate failed:'
  });
}

module.exports = {
  PACKAGE_ANCHORS,
  executableCodeBlocks,
  markdownTargets,
  printScopedPackageReadmesReport,
  runScopedPackageReadmesSuite,
  splitLanguageSections,
  validateReadmeDocument
};
