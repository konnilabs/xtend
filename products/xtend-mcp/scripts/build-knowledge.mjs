#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const defaultOutputRoot = path.join(packageRoot, 'generated');
const docsRoot = path.join(repoRoot, 'docs');
const menuPath = path.join(docsRoot, 'menu.json');
const kitSourceRoot = path.join(repoRoot, 'tools', 'rmt-language', 'generated', 'rmt-ai-developer-kit');
const KIT_FILES = Object.freeze([
  'rmt-ai-kit.compact.md',
  'rmt-ai-kit.guardrails.json',
  'rmt-ai-kit.manifest.json',
  'rmt-ai-kit.prompts.md',
  'rmt-ai-kit.recipes.jsonl',
  'rmt-ai-kit.reference.jsonl'
]);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function titleFromMarkdown(content, fallback) {
  const heading = String(content).match(/^#\s+(.+)$/mu);
  return heading ? heading[1].trim() : fallback;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function markdownFiles(root, prefix = '') {
  return fs.readdirSync(root, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const relative = path.posix.join(prefix, entry.name);
      if (entry.isDirectory()) return markdownFiles(path.join(root, entry.name), relative);
      return entry.isFile() && /\.md$/iu.test(entry.name) ? [relative] : [];
    });
}

function slugify(relativePath) {
  return String(relativePath)
    .replace(/\.md$/iu, '')
    .replace(/[^a-z0-9]+/giu, '-')
    .toLowerCase();
}

function buildDocs(menu) {
  const menuBySlug = new Map(menu.map((entry) => [entry.slug, entry]));
  const documents = [];

  for (const locale of ['de', 'en']) {
    const localeRoot = path.join(docsRoot, locale);
    const files = markdownFiles(localeRoot);

    for (const relativePath of files) {
      const slug = slugify(relativePath);
      const sourcePath = path.posix.join('docs', locale, relativePath);
      const content = fs.readFileSync(path.join(localeRoot, relativePath), 'utf8').replace(/\r\n/gu, '\n');
      const menuEntry = menuBySlug.get(slug) || null;
      const title = menuEntry?.labels?.[locale] || titleFromMarkdown(content, slug);
      documents.push({
        schema: 'xtend.mcp.docs-resource.v1',
        uri: `xtend://docs/${locale}/${slug}`,
        locale,
        slug,
        title,
        sourcePath,
        sha256: sha256(content),
        bytes: Buffer.byteLength(content),
        menu: menuEntry ? {
          id: menuEntry.id || null,
          group: menuEntry.group || null,
          parent: menuEntry.parent || null,
          tier: menuEntry.tier || null,
          rank: Number.isFinite(menuEntry.rank) ? menuEntry.rank : null,
          contentType: menuEntry.contentType || null,
          trunk: menuEntry.trunk || null,
          section: menuEntry.section || null,
          keywords: Array.isArray(menuEntry.keywords?.[locale]) ? menuEntry.keywords[locale] : []
        } : null,
        content
      });
    }
  }

  return documents;
}

function copyKit(outputRoot) {
  const targetRoot = path.join(outputRoot, 'rmt-ai-kit');
  fs.mkdirSync(targetRoot, { recursive: true });
  const hashes = {};

  for (const fileName of KIT_FILES) {
    const source = path.join(kitSourceRoot, fileName);
    if (!fs.existsSync(source)) throw new Error(`Missing AI Developer Kit artifact: ${source}`);
    const content = fs.readFileSync(source);
    fs.writeFileSync(path.join(targetRoot, fileName), content);
    hashes[fileName] = {
      sha256: sha256(content),
      bytes: content.byteLength
    };
  }

  const sourceManifest = readJson(path.join(kitSourceRoot, 'rmt-ai-kit.manifest.json'));
  for (const [fileName, metadata] of Object.entries(sourceManifest.artifacts || {})) {
    const artifactPath = path.join(kitSourceRoot, fileName);
    const canonicalHash = fileName.endsWith('.json')
      ? sha256(JSON.stringify(readJson(artifactPath), null, 2))
      : hashes[fileName]?.sha256;
    if (metadata.sha256 && canonicalHash !== metadata.sha256) {
      throw new Error(`AI Developer Kit hash mismatch for ${fileName}.`);
    }
  }

  return { hashes, sourceManifest };
}

function writeBundle(outputRoot) {
  fs.mkdirSync(outputRoot, { recursive: true });
  const menuText = fs.readFileSync(menuPath, 'utf8').replace(/\r\n/gu, '\n');
  const menu = JSON.parse(menuText);
  const documents = buildDocs(menu);
  const docsJsonl = documents.map((document) => JSON.stringify(document)).join('\n') + '\n';
  fs.writeFileSync(path.join(outputRoot, 'docs.jsonl'), docsJsonl);
  const { hashes: kitArtifacts, sourceManifest } = copyKit(outputRoot);
  const counts = Object.fromEntries(['de', 'en'].map((locale) => [
    locale,
    documents.filter((document) => document.locale === locale).length
  ]));
  const menuSlugs = new Set(menu.map((entry) => entry.slug));
  const missingMenuDocs = documents
    .filter((document) => !menuSlugs.has(document.slug))
    .map((document) => document.sourcePath);
  const missingLocaleFiles = menu.flatMap((entry) => ['de', 'en']
    .filter((locale) => !documents.some((document) => document.locale === locale && document.slug === entry.slug))
    .map((locale) => `docs/${locale}/${entry.slug}.md`));
  if (missingLocaleFiles.length > 0) {
    throw new Error(`Docs menu entries without localized Markdown: ${missingLocaleFiles.join(', ')}`);
  }
  const manifest = {
    schema: 'xtend.mcp.knowledge-manifest.v1',
    version: '0.1.0',
    generatedAt: 'static-local',
    sourceOfTruth: {
      docs: ['docs/de', 'docs/en', 'docs/menu.json'],
      rmtKit: 'tools/rmt-language/generated/rmt-ai-developer-kit',
      retrieval: '@ccslabs/xtend-mcp/knowledge'
    },
    docs: {
      schema: 'xtend.mcp.docs-resource.v1',
      count: documents.length,
      counts,
      menuEntries: menu.length,
      menuSha256: sha256(menuText),
      artifact: 'docs.jsonl',
      artifactSha256: sha256(docsJsonl),
      missingMenuDocs
    },
    rmtKit: {
      version: sourceManifest.version || null,
      kitSchema: sourceManifest.kitSchema || null,
      recordCounts: sourceManifest.recordCounts || {},
      artifacts: kitArtifacts
    }
  };
  fs.writeFileSync(path.join(outputRoot, 'knowledge-manifest.json'), stableJson(manifest));
  return manifest;
}

function listFiles(root, prefix = '') {
  return fs.readdirSync(root, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const relative = path.posix.join(prefix, entry.name);
      return entry.isDirectory() ? listFiles(path.join(root, entry.name), relative) : [relative];
    });
}

function compareDirectories(expectedRoot, actualRoot) {
  const expected = listFiles(expectedRoot);
  const actual = fs.existsSync(actualRoot) ? listFiles(actualRoot) : [];
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error(`Generated knowledge file set drifted. Expected ${expected.join(', ')}, found ${actual.join(', ')}.`);
  }
  for (const relative of expected) {
    const left = fs.readFileSync(path.join(expectedRoot, relative));
    const right = fs.readFileSync(path.join(actualRoot, relative));
    if (!left.equals(right)) throw new Error(`Generated knowledge artifact drifted: ${relative}`);
  }
}

const check = process.argv.includes('--check');
const quiet = process.argv.includes('--quiet');
const outputIndex = process.argv.indexOf('--out');
const explicitOutput = outputIndex >= 0 ? process.argv[outputIndex + 1] : '';
let temporaryRoot = '';
const outputRoot = check
  ? (temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-mcp-knowledge-')))
  : path.resolve(explicitOutput || defaultOutputRoot);

try {
  if (!check) fs.rmSync(outputRoot, { recursive: true, force: true });
  const manifest = writeBundle(outputRoot);
  if (check) compareDirectories(outputRoot, defaultOutputRoot);
  if (!quiet) {
    process.stdout.write(`${JSON.stringify({
      schema: 'xtend.mcp.knowledge-build-result.v1',
      ok: true,
      mode: check ? 'check' : 'write',
      docs: manifest.docs.count,
      locales: manifest.docs.counts,
      rmtReferences: manifest.rmtKit.recordCounts.reference || 0,
      rmtRecipes: manifest.rmtKit.recordCounts.recipes || 0
    }, null, 2)}\n`);
  }
} finally {
  if (temporaryRoot) fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
