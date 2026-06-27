#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  createComponentCatalogCoverageReport
} = require('../catalog/component-catalog-coverage');

const COMPONENT_DOCS_INVENTORY_SCHEMA = 'xtend.docs.component-inventory.v1';
const COMPONENT_REFERENCE_TIER = 'component-reference';
const LOCALES = Object.freeze(['de', 'en']);

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..');
}

function fileExists(rootDir, relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function readTextIfExists(rootDir, relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
}

function readJson(rootDir, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function quotedStrings(source) {
  const values = [];
  const pattern = /['"]([^'"\n]+)['"]/g;
  let match;
  while ((match = pattern.exec(source))) {
    values.push(match[1]);
  }
  return values;
}

function extractUnionLiterals(source, typeNamePattern) {
  const typePattern = new RegExp(`export\\s+type\\s+\\w*${typeNamePattern}\\w*\\s*=\\s*([^;]+);`, 'g');
  const values = [];
  let match;
  while ((match = typePattern.exec(source))) {
    values.push(...quotedStrings(match[1]));
  }
  return unique(values);
}

function extractObservedAttributes(source) {
  const values = [];
  const observedPattern = /observedAttributes[\s\S]{0,160}?return\s*\[([\s\S]*?)\]/g;
  let match;
  while ((match = observedPattern.exec(source))) {
    values.push(...quotedStrings(match[1]));
  }
  const readonlyPattern = /observedAttributes\s*=\s*\[([\s\S]*?)\]/g;
  while ((match = readonlyPattern.exec(source))) {
    values.push(...quotedStrings(match[1]));
  }
  return unique(values);
}

function extractPublicApiArrays(source, key) {
  const values = [];
  const publicApiPattern = new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'g');
  let match;
  while ((match = publicApiPattern.exec(source))) {
    values.push(...quotedStrings(match[1]));
  }
  return unique(values);
}

function extractCustomEvents(source) {
  const values = [];
  const customEventPattern = /new\s+CustomEvent\(\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = customEventPattern.exec(source))) {
    values.push(match[1]);
  }
  return unique(values);
}

function extractElementMethods(source) {
  const interfacePattern = /export\s+interface\s+\w*Element\s+extends\s+HTMLElement\s*\{([\s\S]*?)\n\}/g;
  const values = [];
  let interfaceMatch;
  while ((interfaceMatch = interfacePattern.exec(source))) {
    const block = interfaceMatch[1];
    const methodPattern = /^\s*([A-Za-z_$][\w$]*)\s*\(([^;]*)\)\s*:\s*([^;]+);/gm;
    let methodMatch;
    while ((methodMatch = methodPattern.exec(block))) {
      const name = methodMatch[1];
      if (name === 'addEventListener') continue;
      values.push(`${name}(${methodMatch[2].trim()})`);
    }
  }
  return unique(values);
}

function extractSlots(source) {
  const values = [];
  const slotElementPattern = /<slot(?:\s+[^>]*name=["']([^"']+)["'][^>]*)?>/g;
  let match;
  while ((match = slotElementPattern.exec(source))) {
    values.push(match[1] || 'default');
  }
  values.push(...extractPublicApiArrays(source, 'slots'));
  return unique(values);
}

function extractParts(source) {
  const values = [];
  const pattern = /part=["']([^"']+)["']/g;
  let match;
  while ((match = pattern.exec(source))) {
    match[1].split(/\s+/).forEach((part) => values.push(part));
  }
  return unique(values);
}

function extractCssVariables(source) {
  const values = [];
  const pattern = /--[a-z0-9-]+/gi;
  let match;
  while ((match = pattern.exec(source))) {
    values.push(match[0]);
  }
  return unique(values);
}

function extractSchemas(source) {
  const values = [];
  const pattern = /xtend\.[a-z0-9.-]+\.v\d+/gi;
  let match;
  while ((match = pattern.exec(source))) {
    values.push(match[0]);
  }
  return unique(values);
}

function extractSchedules(source) {
  const values = [];
  const schedulesPattern = /schedules\s*:\s*\[([\s\S]*?)\]/g;
  let match;
  while ((match = schedulesPattern.exec(source))) {
    values.push(...quotedStrings(match[1]));
  }
  return unique(values);
}

function extractStateKeysFromDocs(markdown) {
  const keys = [];
  const patterns = [
    /State key:\s*`([^`]+)`/gi,
    /State-Key:\s*`([^`]+)`/gi,
    /state key\s+`([^`]+)`/gi,
    /state key\s*:\s*`([^`]+)`/gi
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(markdown))) {
      keys.push(match[1]);
    }
  });
  return unique(keys);
}

function extractUxProfilesFromDocs(markdown) {
  const profiles = [];
  const pattern = /UX profile:\s*`([^`]+)`|UX-Profil:\s*`([^`]+)`/gi;
  let match;
  while ((match = pattern.exec(markdown))) {
    profiles.push(match[1] || match[2]);
  }
  return unique(profiles);
}

function sourceBasenameFromManifestSource(manifestSource) {
  return path.basename(String(manifestSource || '').replace(/^\.\//, ''), path.extname(String(manifestSource || '')));
}

function assertSafeComponentDocsBasename(basename, source) {
  if (!/^[a-z][a-z0-9-]*$/i.test(basename)) {
    throw new Error(`Unsafe component docs basename from ${source}: ${basename}`);
  }
  return basename;
}

function sourceBasenameFromMenuSlug(slug) {
  const basename = String(slug || '').replace(/^components-/, '');
  return assertSafeComponentDocsBasename(basename, 'docs/menu.json slug');
}

function docsPathsForBasename(basename) {
  return {
    de: `docs/de/components/${basename}.md`,
    en: `docs/en/components/${basename}.md`
  };
}

function createComponentDocsInventory(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const menu = readJson(rootDir, 'docs/menu.json');
  const manifest = readJson(rootDir, 'components/manifest.json');
  const coverageReport = createComponentCatalogCoverageReport({ rootDir });
  const coverageByTag = new Map(coverageReport.entries.map((entry) => [entry.tag, entry]));

  const entries = menu
    .filter((entry) => entry.group === 'components' && entry.tier === COMPONENT_REFERENCE_TIER)
    .map((menuEntry) => {
      const tag = menuEntry.label || menuEntry.labels && menuEntry.labels.en;
      const coverage = coverageByTag.get(tag) || null;
      const manifestSource = manifest[tag] || coverage && coverage.manifestSource || '';
      const basename = coverage
        ? sourceBasenameFromManifestSource(coverage.manifestSource)
        : sourceBasenameFromMenuSlug(menuEntry.slug);
      const sourcePath = coverage && coverage.paths ? coverage.paths.source : `components/${sourceBasenameFromManifestSource(manifestSource)}.js`;
      const declarationPath = coverage && coverage.paths ? coverage.paths.types : `components/${basename}.d.ts`;
      const fixturePath = coverage && coverage.paths ? coverage.paths.fixture : `tests/components/fixtures/${basename}.component.html`;
      const docs = docsPathsForBasename(basename);
      const sourceText = readTextIfExists(rootDir, sourcePath);
      const declarationText = readTextIfExists(rootDir, declarationPath);
      const docsEn = readTextIfExists(rootDir, docs.en);
      const docsDe = readTextIfExists(rootDir, docs.de);
      const attributes = unique([
        ...extractUnionLiterals(declarationText, 'AttributeName'),
        ...extractObservedAttributes(sourceText),
        ...extractPublicApiArrays(sourceText, 'attributes')
      ]);
      const events = unique([
        ...extractUnionLiterals(declarationText, 'EventName'),
        ...extractPublicApiArrays(sourceText, 'events'),
        ...extractCustomEvents(sourceText)
      ]);
      const methods = extractElementMethods(declarationText);
      const slots = extractSlots(sourceText);
      const parts = extractParts(sourceText);
      const cssVariables = extractCssVariables(sourceText);
      const schemas = extractSchemas(sourceText);
      const schedules = extractSchedules(sourceText);

      return {
        schema: 'xtend.docs.component-inventory-entry.v1',
        slug: menuEntry.slug,
        tag,
        title: tag,
        basename,
        rank: menuEntry.rank,
        labels: menuEntry.labels,
        docs,
        sourcePath,
        declarationPath,
        fixturePath,
        sourceExists: fileExists(rootDir, sourcePath),
        declarationExists: fileExists(rootDir, declarationPath),
        fixtureExists: fileExists(rootDir, fixturePath),
        manifestSource,
        profiles: coverage ? coverage.profiles : [],
        priority: coverage ? coverage.priority : 'P2',
        status: coverage ? coverage.status : 'documented',
        customElement: coverage ? coverage.customElement : sourceText.includes('customElements.define'),
        attributes,
        events,
        methods,
        slots,
        parts,
        cssVariables,
        schemas,
        schedules,
        stateKeys: unique([
          ...extractStateKeysFromDocs(docsEn),
          ...extractStateKeysFromDocs(docsDe)
        ]),
        uxProfiles: unique([
          ...extractUxProfilesFromDocs(docsEn),
          ...extractUxProfilesFromDocs(docsDe),
          ...schemas.filter((schema) => schema.includes('ux-profile'))
        ])
      };
    });

  return {
    schema: COMPONENT_DOCS_INVENTORY_SCHEMA,
    componentReferenceTier: COMPONENT_REFERENCE_TIER,
    locales: LOCALES.slice(),
    entryCount: entries.length,
    entries
  };
}

function main() {
  const inventory = createComponentDocsInventory();
  process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  COMPONENT_DOCS_INVENTORY_SCHEMA,
  COMPONENT_REFERENCE_TIER,
  createComponentDocsInventory
};
