const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');

function resolveRootDir(options = {}) {
  return options.rootDir || path.resolve(__dirname, '..', '..');
}

function assertPattern(context, content, pattern, message) {
  return context.assertIncludes(content, pattern, message);
}

function assertPatterns(context, content, contracts = []) {
  contracts.forEach((contract) => {
    assertPattern(context, content, contract.pattern, contract.message);
  });
}

function assertAbsentPatterns(context, content, contracts = []) {
  contracts.forEach((contract) => {
    const found = typeof contract.pattern === 'string' ? content.includes(contract.pattern) : contract.pattern.test(content);
    context.assert(!found, contract.message);
  });
}

function includesAny(content, patterns = []) {
  return patterns.some((pattern) => content.includes(pattern));
}

function includesQuoted(content, value) {
  return content.includes(`'${value}'`) || content.includes(`"${value}"`);
}

function localizeDocsPath(docsPath, locale) {
  if (typeof docsPath !== 'string') return docsPath;
  if (docsPath.startsWith(`docs/${locale}/`)) return docsPath;
  if (docsPath.startsWith('docs/components/')) {
    return docsPath.replace('docs/components/', `docs/${locale}/components/`);
  }
  if (docsPath.startsWith('docs/')) {
    return docsPath.replace('docs/', `docs/${locale}/`);
  }
  return docsPath;
}

function assertPublicComponentDocs(context, config, docsDe, docsEn) {
  const headingCandidates = [`# ${config.tag}`, `# ${config.docTitle}`];
  const hasGermanHeading = headingCandidates.some((heading) => docsDe.includes(heading));
  const hasEnglishHeading = headingCandidates.some((heading) => docsEn.includes(heading));

  context.assert(hasGermanHeading, `${config.tag} German documentation is present`);
  context.assert(hasEnglishHeading, `${config.tag} English documentation is present`);
  context.assertIncludes(docsDe, 'xtend-loader.js', `${config.tag} German docs describe loader integration`);
  context.assertIncludes(docsEn, 'xtend-loader.js', `${config.tag} English docs describe loader integration`);
  context.assertIncludes(docsDe, 'components/manifest.json', `${config.tag} German docs reference the component manifest`);
  context.assertIncludes(docsEn, 'components/manifest.json', `${config.tag} English docs reference the component manifest`);
  context.assertIncludes(docsDe, config.tag, `${config.tag} German docs reference the public custom element`);
  context.assertIncludes(docsEn, config.tag, `${config.tag} English docs reference the public custom element`);
}

function runComponentContractSuite(config, options = {}) {
  const rootDir = resolveRootDir(options);
  const context = createSuiteContext({
    id: `component:${config.tag}`,
    label: config.label || `${config.tag} component contract`
  });

  const manifest = readJson('components/manifest.json', rootDir);
  const source = readText(config.sourcePath, rootDir);
  const fixture = readText(config.fixturePath, rootDir);
  const docs = readText(localizeDocsPath(config.docPath, 'de'), rootDir);
  const englishDocs = readText(localizeDocsPath(config.docPath, 'en'), rootDir);
  const syntaxCheck = syntaxCheckFile(config.sourcePath, {
    rootDir,
    extension: config.syntaxExtension || '.js'
  });

  const manifestEntry = manifest[config.tag];
  const manifestEntryIsLocal =
    typeof manifestEntry === 'string' &&
    !manifestEntry.includes('https://cdn.ccs-networks.de') &&
    (
      manifestEntry === `./${config.fileName}` ||
      manifestEntry.includes(`/components/${config.fileName}`)
    );

  context.assert(
    manifestEntryIsLocal,
    `${config.tag} manifest entry points to ${config.fileName}`
  );
  context.assert(syntaxCheck.ok, `${config.tag} source passes syntax check${syntaxCheck.ok ? '' : ` (${syntaxCheck.message})`}`);
  context.assert(
    includesAny(source, [
      `customElements.define('${config.tag}'`,
      `customElements.define("${config.tag}"`
    ]),
    `${config.tag} registers its Custom Element`
  );
  context.assert(
    includesAny(source, [
      "attachShadow({ mode: 'open' })",
      'attachShadow({ mode: "open" })'
    ]),
    `${config.tag} creates open shadow DOM`
  );
  context.assert(fixture.includes(`<${config.tag}`), `${config.tag} fixture contains the component tag`);
  context.assert(fixture.includes(`/components/${config.fileName}`), `${config.tag} fixture loads the repo-local component`);
  context.assert(!fixture.includes('https://cdn.ccs-networks.de'), `${config.tag} fixture has no CDN dependency`);
  assertPublicComponentDocs(context, config, docs, englishDocs);

  (config.observedAttributes || []).forEach((attribute) => {
    context.assert(includesQuoted(source, attribute), `${config.tag} observes or handles ${attribute}`);
  });

  assertPatterns(context, source, config.sourceContracts);
  assertAbsentPatterns(context, source, config.absentSourceContracts);
  assertPatterns(context, fixture, config.fixtureContracts);
  assertAbsentPatterns(context, fixture, config.absentFixtureContracts);

  return context.result({
    tag: config.tag,
    profiles: config.profiles || []
  });
}

function printComponentContractReport(result) {
  printSuiteReport(result, {
    successTitle: `${result.label} erfolgreich.`,
    failureTitle: `${result.label} fehlgeschlagen:`
  });
}

module.exports = {
  assertAbsentPatterns,
  includesAny,
  includesQuoted,
  printComponentContractReport,
  runComponentContractSuite
};
