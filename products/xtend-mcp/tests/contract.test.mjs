import assert from 'node:assert/strict';
import test from 'node:test';

import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import { createXtendMcpServer } from '../src/server.mjs';

async function connect(options = {}) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createXtendMcpServer(options);
  await server.connect(serverTransport);
  const client = new Client({ name: 'xtend-mcp-contract-tests', version: '0.1.0' });
  await client.connect(clientTransport);
  return {
    client,
    server,
    async close() {
      await client.close();
      await server.close();
    }
  };
}

test('tool input budget counts all nested keys and array entries before schema validation or execution', async (t) => {
  const handle = await connect();
  t.after(() => handle.close());
  let validated = 0;
  let executed = 0;
  handle.server.registerTool('budget_probe', {
    inputSchema: z.object({ values: z.array(z.unknown()).transform((value) => { validated++; return value; }) })
  }, async () => { executed++; return { content: [{ type: 'text', text: 'accepted' }] }; });

  // One object key plus 255 array entries: exactly 256 aggregate elements.
  const accepted = await handle.client.callTool({ name: 'budget_probe', arguments: { values: Array(255).fill(null) } });
  assert.equal(accepted.isError, undefined);
  assert.equal(validated, 1);
  assert.equal(executed, 1);
  for (const args of [
    { values: Array(256).fill(null) },
    { values: [], ignored: Array(255).fill(null) },
    { values: [{ nested: Array(254).fill(null) }] },
    { values: [], ignored: Object.fromEntries(Array.from({ length: 255 }, (_, i) => [`key${i}`, null])) }
  ]) {
    const rejected = await handle.client.callTool({ name: 'budget_probe', arguments: args });
    assert.equal(rejected.isError, true);
    assert.match(rejected.content[0].text, /maximum of 256 elements/u);
    assert.equal(validated, 1, 'oversized input must not reach the schema transform');
    assert.equal(executed, 1, 'oversized input must not reach the tool handler');
  }
  const validAgain = await handle.client.callTool({ name: 'budget_probe', arguments: { values: [] } });
  assert.equal(validAgain.isError, undefined);
  assert.equal(executed, 2);
  const search = await handle.client.callTool({ name: 'xtend_knowledge_search', arguments: { query: 'RMT', scopes: ['docs', 'rmt-kit'], domains: Array(6).fill('repair'), limit: 10 } });
  assert.equal(search.isError, undefined);
  assert.ok((await handle.client.listResources()).resources.length > 0);
  assert.equal((await handle.client.listPrompts()).prompts.length, 6);
});

test('the maximum repair selection reaches existing workspace safeguards within the input budget', async (t) => {
  const handle = await connect({ allowWorkspaceWrite: true });
  t.after(() => handle.close());
  const result = await handle.client.callTool({ name: 'xtend_rmt_apply_safe_repairs', arguments: {
    path: 'missing.rmt', sourceHash: '0'.repeat(64), planHash: '0'.repeat(64),
    repairIds: Array.from({ length: 100 }, (_, i) => `repair-${i}`)
  } });
  assert.equal(result.isError, true);
  assert.match(result.structuredContent.warnings[0], /workspace root/iu);
  assert.doesNotMatch(result.content[0].text, /maximum of 256|Invalid arguments/u);
});

test('MCP initialization publishes versioned resources, templates, six derived prompts, and read-only tools', async (t) => {
  const handle = await connect();
  t.after(() => handle.close());

  const tools = await handle.client.listTools();
  assert.match(handle.client.getInstructions(), /first retrieve relevant XTend knowledge/iu);
  assert.match(handle.client.getInstructions(), /compiled\/core JSON records are not RMT source/iu);
  assert.deepEqual(tools.tools.map((tool) => tool.name), [
    'xtend_knowledge_search',
    'xtend_knowledge_context',
    'xtend_rmt_diagnostics',
    'xtend_rmt_compile_check',
    'xtend_maraca_plan',
    'xtend_rmt_repair_plan'
  ]);
  assert.ok(tools.tools.every((tool) => tool.name !== 'xtend_rmt_apply_safe_repairs'));
  assert.ok(tools.tools.every((tool) => tool.inputSchema && tool.inputSchema.type === 'object'));

  const prompts = await handle.client.listPrompts();
  assert.equal(prompts.prompts.length, 6);
  assert.ok(prompts.prompts.every((prompt) => prompt.name.startsWith('xtendRmt_')));
  const rendered = await handle.client.getPrompt({ name: prompts.prompts[0].name, arguments: { task: 'Create a safe example.' } });
  assert.equal(rendered.messages[0].role, 'user');
  assert.match(rendered.messages[0].content.text, /Create a safe example\./u);

  const templates = await handle.client.listResourceTemplates();
  assert.ok(templates.resourceTemplates.some((entry) => entry.uriTemplate === 'xtend://docs/{locale}/{slug}'));
  assert.ok(templates.resourceTemplates.some((entry) => entry.uriTemplate === 'xtend://docs/catalog/{locale}{?cursor}'));

  const resources = await handle.client.listResources();
  assert.ok(resources.resources.some((resource) => resource.uri === 'xtend://docs/de/xtend-mcp'));
  assert.ok(resources.resources.some((resource) => resource.uri === 'xtend://docs/en/xtend-mcp'));
  assert.ok(resources.resources.some((resource) => resource.uri === 'xtend://rmt/kit/manifest'));
  assert.ok(resources.resources.some((resource) => resource.uri.startsWith('xtend://rmt/kit/recipe/')));
});

test('MCP resources preserve Markdown and support cursor-addressed catalog pages', async (t) => {
  const handle = await connect();
  t.after(() => handle.close());

  const markdown = await handle.client.readResource({ uri: 'xtend://docs/en/xtend-mcp' });
  assert.equal(markdown.contents[0].mimeType, 'text/markdown');
  assert.match(markdown.contents[0].text, /```json[\s\S]*"servers"/u);

  const first = await handle.client.readResource({ uri: 'xtend://docs/catalog/en' });
  const firstPage = JSON.parse(first.contents[0].text);
  assert.equal(firstPage.pageCount, 50);
  assert.equal(firstPage.nextUri, 'xtend://docs/catalog/en?cursor=50');
  const second = await handle.client.readResource({ uri: firstPage.nextUri });
  const secondPage = JSON.parse(second.contents[0].text);
  assert.equal(secondPage.cursor, '50');
  assert.equal(secondPage.pageCount, 50);
  assert.notEqual(secondPage.resources[0].uri, firstPage.resources[0].uri);

  const manifest = await handle.client.readResource({ uri: 'xtend://rmt/kit/manifest' });
  assert.equal(JSON.parse(manifest.contents[0].text).kitSchema, 'xtend.rmt.ai-developer-kit.v1');
});

test('knowledge and source tools return the common structuredContent envelope and bounded schemas', async (t) => {
  const handle = await connect();
  t.after(() => handle.close());

  const search = await handle.client.callTool({
    name: 'xtend_knowledge_search',
    arguments: { query: 'x-button events', locale: 'en', limit: 10 }
  });
  assert.equal(search.isError, undefined);
  assert.equal(search.structuredContent.schemaVersion, '0.1');
  assert.equal(search.structuredContent.schema, 'xtend.mcp.tool-result.v1');
  assert.ok(search.structuredContent.data.hitCount <= 10);
  assert.ok(Array.isArray(search.structuredContent.warnings));
  assert.ok(search.structuredContent.provenance.every((entry) => entry.uri && entry.sourceHash));
  assert.equal(search.content[0].type, 'text');

  const validSource = 'template docs.page {\n  surface root {\n    lane critical {\n      hydrate docs-header\n    }\n  }\n}\n';
  const diagnostics = await handle.client.callTool({
    name: 'xtend_rmt_diagnostics',
    arguments: { source: validSource }
  });
  assert.equal(diagnostics.structuredContent.schemaVersion, '0.1');
  assert.equal(diagnostics.structuredContent.data.schema, 'xtend.mcp.rmt-diagnostics.v1');
  assert.match(diagnostics.structuredContent.data.sourceHash, /^[a-f0-9]{64}$/u);

  const compile = await handle.client.callTool({ name: 'xtend_rmt_compile_check', arguments: { source: validSource } });
  assert.equal(compile.structuredContent.data.schema, 'xtend.mcp.rmt-compile-check.v1');
  assert.equal(compile.structuredContent.data.status, 'compiled');
  const maraca = await handle.client.callTool({ name: 'xtend_maraca_plan', arguments: { source: validSource } });
  assert.equal(maraca.structuredContent.data.schema, 'xtend.mcp.maraca-plan.v1');
  assert.equal(maraca.structuredContent.data.status, 'planned');
  assert.equal(maraca.structuredContent.data.plan.schema, 'xtend.maraca.build-plan.v1');

  const failure = await handle.client.callTool({
    name: 'xtend_rmt_repair_plan',
    arguments: { path: '../outside.rmt' }
  });
  assert.equal(failure.isError, true);
  assert.equal(failure.structuredContent.schemaVersion, '0.1');
  assert.match(failure.structuredContent.warnings[0], /workspace root|required|workspace-relative/iu);
});

test('RMT app-shell authoring retrieves source syntax and compile-checks the exact three-primitive example', async (t) => {
  const handle = await connect();
  t.after(() => handle.close());

  const search = await handle.client.callTool({
    name: 'xtend_knowledge_search',
    arguments: { query: 'Code einer validen RMT App Shell mit 3 Primitives', locale: 'de' }
  });
  const hit = search.structuredContent.data.hits.find((entry) => entry.uri === 'xtend://docs/de/rmt-vnext-component-primitives');
  assert.ok(hit, 'The default six results must contain the canonical component-primitives authoring guide.');
  assert.match(hit.excerpt, /template app\.shell/iu);
  assert.match(hit.excerpt, /kompilierte Core Records.*kein.*\.rmt/isu);

  const resource = await handle.client.readResource({ uri: hit.uri });
  const markdown = resource.contents[0].text;
  const match = markdown.match(/## Minimale App Shell mit drei Primitives[\s\S]*?```rmt\n([\s\S]*?)```/u);
  assert.ok(match, 'The canonical docs must expose the three-primitive RMT source block.');
  const source = `${match[1].trim()}\n`;
  assert.equal((source.match(/^\s*surface\s+/gmu) || []).length, 3);

  const compile = await handle.client.callTool({
    name: 'xtend_rmt_compile_check',
    arguments: { source }
  });
  assert.equal(compile.isError, undefined);
  assert.equal(compile.structuredContent.data.ok, true);
  assert.equal(compile.structuredContent.data.status, 'compiled');
  assert.deepEqual(compile.structuredContent.data.diagnostics, []);
});

test('write-capable server registers the destructive apply tool only after explicit opt-in', async (t) => {
  const handle = await connect({ allowWorkspaceWrite: true });
  t.after(() => handle.close());
  const tools = (await handle.client.listTools()).tools;
  const apply = tools.find((tool) => tool.name === 'xtend_rmt_apply_safe_repairs');
  assert.ok(apply);
  assert.equal(apply.annotations.readOnlyHint, false);
  assert.equal(apply.annotations.destructiveHint, true);
});
