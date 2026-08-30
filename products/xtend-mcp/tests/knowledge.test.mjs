import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createXtendKnowledgeContext,
  executeRmtKnowledge,
  getXtendDocsCatalog,
  getXtendKnowledgeResource,
  loadXtendKnowledgeBundle,
  searchXtendKnowledge
} from '../src/knowledge.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '..', '..');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

test('hash-checked generated knowledge stays LF-normalized on every Git checkout', () => {
  const attributes = fs.readFileSync(path.join(repoRoot, '.gitattributes'), 'utf8');
  assert.match(
    attributes,
    /^products\/xtend-mcp\/generated\/\*\*\s+text\s+eol=lf$/mu,
    'generated MCP knowledge requires a repository-level LF checkout policy'
  );
});

test('deterministic bundle covers every canonical bilingual Markdown source byte-for-byte', () => {
  const bundle = loadXtendKnowledgeBundle({ noCache: true });
  const menu = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs', 'menu.json'), 'utf8'));
  assert.equal(bundle.manifest.docs.count, 346);
  assert.deepEqual(bundle.manifest.docs.counts, { de: 173, en: 173 });
  assert.equal(bundle.docs.length, 346);
  assert.equal(bundle.manifest.docs.menuEntries, menu.length);
  assert.deepEqual(bundle.manifest.docs.missingMenuDocs, []);

  for (const document of bundle.docs) {
    const source = fs.readFileSync(path.join(repoRoot, document.sourcePath), 'utf8').replace(/\r\n/gu, '\n');
    assert.equal(document.content, source, `${document.sourcePath} content drifted`);
    assert.equal(document.sha256, sha256(source), `${document.sourcePath} hash drifted`);
    assert.equal(getXtendKnowledgeResource(document.uri)?.text, source);
  }

  for (const entry of menu) {
    for (const locale of ['de', 'en']) {
      assert.ok(bundle.docs.some((document) => document.locale === locale && document.slug === entry.slug), `${entry.slug} missing in ${locale}`);
    }
  }
});

test('docs catalogs are stable, cursor-addressable, and converge without duplicates', () => {
  const first = getXtendDocsCatalog('de');
  assert.equal(first.count, 173);
  assert.equal(first.pageCount, 50);
  assert.equal(first.nextCursor, '50');
  assert.equal(first.nextUri, 'xtend://docs/catalog/de?cursor=50');

  const seen = new Set();
  let cursor = '';
  let catalogHash = '';
  do {
    const page = getXtendDocsCatalog('de', {}, { cursor });
    catalogHash ||= page.catalogHash;
    assert.equal(page.catalogHash, catalogHash);
    page.resources.forEach((resource) => {
      assert.equal(resource.locale, 'de');
      assert.match(resource.sourceHash, /^[a-f0-9]{64}$/u);
      assert.ok(!seen.has(resource.uri), `duplicate catalog URI ${resource.uri}`);
      seen.add(resource.uri);
    });
    cursor = page.nextCursor || '';
  } while (cursor);
  assert.equal(seen.size, 173);
});

test('search and formatted contexts retain URI, locale, document type, path, and SHA-256 provenance', async () => {
  const search = searchXtendKnowledge({ query: 'XTend MCP VS Code', locale: 'de', scopes: ['docs'], limit: 6 });
  assert.ok(search.hits.some((hit) => hit.uri === 'xtend://docs/de/xtend-mcp'));
  for (const hit of search.hits) {
    assert.equal(hit.locale, 'de');
    assert.ok(hit.kind);
    assert.ok(hit.sourcePath.startsWith('docs/de/'));
    assert.match(hit.sourceHash, /^[a-f0-9]{64}$/u);
  }
  const context = createXtendKnowledgeContext({ query: 'XTend MCP VS Code', locale: 'de', scopes: ['docs'], maxChars: 5000 });
  assert.match(context.context, /Resource: xtend:\/\/docs\/de\/xtend-mcp/u);
  assert.match(context.context, /docs\/de\/xtend-mcp\.md#sha256:[a-f0-9]{64}/u);

  const rmt = await executeRmtKnowledge({ toolCallId: 'knowledge-provenance', arguments: { query: 'How do I use @surface?', maxRecords: 4 } });
  assert.equal(rmt.toolCallId, 'knowledge-provenance');
  assert.ok(rmt.records.length > 0);
  for (const record of [...rmt.records, ...rmt.recipes]) {
    assert.match(record.resourceUri, /^xtend:\/\/rmt\/kit\/(reference|recipe)\//u);
    assert.equal(record.locale, 'und');
    assert.match(record.documentType, /^rmt-ai-kit-/u);
    assert.match(record.sourceHash, /^[a-f0-9]{64}$/u);
  }
  assert.match(rmt.promptContext, /Resource: xtend:\/\/rmt\/kit\//u);
  assert.match(rmt.promptContext, /sha256:[a-f0-9]{64}/u);
});
