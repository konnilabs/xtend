import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import {
  createXtendKnowledgeContext,
  executeRmtKnowledge,
  getXtendDocsCatalog,
  getXtendKnowledgeResource,
  getXtendRmtKitRecords,
  loadXtendKnowledgeBundle,
  searchXtendKnowledge
} from './knowledge.mjs';
import {
  applyRmtSafeRepairs,
  createRmtRepairPlan,
  runMaracaPlan,
  runRmtCompileCheck,
  runRmtDiagnostics,
  toolingProvenance
} from './tooling.mjs';

export const XTEND_MCP_VERSION = '0.1.0';
export const XTEND_MCP_RESULT_SCHEMA = 'xtend.mcp.tool-result.v1';
export const XTEND_MCP_INSTRUCTIONS = [
  'Use XTend MCP as the authoritative access layer for XTend documentation and RMT tooling.',
  'When generating RMT source, first retrieve relevant XTend knowledge, then validate the exact proposed source with xtend_rmt_compile_check.',
  'Only describe RMT source as valid when compile_check returns ok=true and status=compiled.',
  'RMT authoring is a textual DSL built from template, state, selector, portal, surface and related operators; compiled/core JSON records are not RMT source.',
  'If knowledge retrieval or validation is unavailable or fails, report that failure and do not invent replacement RMT syntax.'
].join(' ');

const localeSchema = z.enum(['de', 'en', 'all']).default('all');
const scopeSchema = z.enum(['docs', 'rmt-kit']);
const sourceSchema = z.object({
  source: z.string().max(2_000_000).optional().describe('Inline RMT source.'),
  path: z.string().max(4096).optional().describe('Workspace-relative RMT file path.')
}).refine((value) => (typeof value.source === 'string') !== (typeof value.path === 'string'), {
  message: 'Provide exactly one of source or path.'
});

function publicError(error, options = {}) {
  let message = error instanceof Error ? error.message : String(error);
  for (const root of options.workspaceRoots || []) message = message.split(root).join('[workspace]');
  return message.replace(/\u0000/gu, '').slice(0, 1200);
}

function envelope(data, provenance = [], warnings = []) {
  return {
    schemaVersion: '0.1',
    schema: XTEND_MCP_RESULT_SCHEMA,
    data,
    warnings,
    provenance
  };
}

function toolSuccess(data, summary, provenance = [], links = []) {
  const structuredContent = envelope(data, provenance);
  return {
    content: [
      { type: 'text', text: summary },
      ...links.map((link) => ({
        type: 'resource_link',
        uri: link.uri,
        name: link.title || link.name || link.uri,
        description: link.sourcePath || undefined,
        mimeType: link.scope === 'docs' ? 'text/markdown' : 'application/json'
      }))
    ],
    structuredContent
  };
}

function toolFailure(error, options) {
  const message = publicError(error, options);
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
    structuredContent: envelope(null, [], [message])
  };
}

function safeHandler(options, handler) {
  return async (args) => {
    try {
      return await handler(args || {});
    } catch (error) {
      return toolFailure(error, options);
    }
  };
}

function registerKnowledgeResources(server, options) {
  for (const locale of ['de', 'en']) {
    const uri = `xtend://docs/catalog/${locale}`;
    server.registerResource(
      `XTend Docs Catalog (${locale.toUpperCase()})`,
      uri,
      {
        title: `XTend Docs Catalog (${locale.toUpperCase()})`,
        description: `Hash-addressed catalog of canonical XTend ${locale.toUpperCase()} Markdown resources.`,
        mimeType: 'application/json'
      },
      async (resourceUri) => ({
        contents: [{
          uri: resourceUri.href,
          mimeType: 'application/json',
          text: JSON.stringify(getXtendDocsCatalog(locale, options), null, 2)
        }]
      })
    );
  }

  server.registerResource(
    'XTend Docs Catalog Page',
    new ResourceTemplate('xtend://docs/catalog/{locale}{?cursor}', { list: undefined }),
    {
      title: 'XTend Docs Catalog Page',
      description: 'Cursor-addressable page of the canonical bilingual XTend documentation catalog.',
      mimeType: 'application/json'
    },
    async (uri) => {
      const locale = uri.hostname === 'docs' ? uri.pathname.split('/').filter(Boolean)[1] : '';
      if (locale !== 'de' && locale !== 'en') throw new Error(`Unsupported XTend docs locale: ${locale}`);
      const cursor = uri.searchParams.get('cursor') || '';
      if (cursor && !/^\d+$/u.test(cursor)) throw new Error('XTend docs catalog cursor is invalid.');
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(getXtendDocsCatalog(locale, options, { cursor }), null, 2)
        }]
      };
    }
  );

  server.registerResource(
    'XTend Documentation',
    new ResourceTemplate('xtend://docs/{locale}/{slug}', {
      list: async () => ({ resources: getXtendDocsCatalog('all', options, { all: true }).resources })
    }),
    {
      title: 'XTend Documentation',
      description: 'Canonical bilingual XTend Markdown documentation.',
      mimeType: 'text/markdown'
    },
    async (uri) => {
      const resource = getXtendKnowledgeResource(uri.href, options);
      if (!resource) throw new Error(`XTend documentation resource not found: ${uri.href}`);
      return { contents: [{ uri: uri.href, mimeType: resource.mimeType, text: resource.text }] };
    }
  );

  for (const [name, uri, title, mimeType] of [
    ['XTend RMT AI Kit Manifest', 'xtend://rmt/kit/manifest', 'XTend RMT AI Kit Manifest', 'application/json'],
    ['XTend RMT AI Kit Compact', 'xtend://rmt/kit/compact', 'XTend RMT AI Kit Compact', 'text/markdown']
  ]) {
    server.registerResource(name, uri, { title, mimeType }, async (resourceUri) => {
      const resource = getXtendKnowledgeResource(resourceUri.href, options);
      if (!resource) throw new Error(`XTend RMT resource not found: ${resourceUri.href}`);
      return { contents: [{ uri: resourceUri.href, mimeType: resource.mimeType, text: resource.text }] };
    });
  }

  for (const kind of ['reference', 'recipe']) {
    server.registerResource(
      `XTend RMT AI Kit ${kind}`,
      new ResourceTemplate(`xtend://rmt/kit/${kind}/{id}`, {
        list: async () => ({
          resources: getXtendRmtKitRecords(kind, options).map((record) => ({
            uri: `xtend://rmt/kit/${kind}/${encodeURIComponent(record.id)}`,
            name: record.title || record.operator || record.command || record.id,
            title: record.title || record.operator || record.command || record.id,
            description: record.intent || record.description || `${kind} ${record.id}`,
            mimeType: 'application/json'
          }))
        })
      }),
      {
        title: `XTend RMT AI Kit ${kind}`,
        description: `Curated XTendRMT AI Developer Kit ${kind} records.`,
        mimeType: 'application/json'
      },
      async (uri) => {
        const resource = getXtendKnowledgeResource(uri.href, options);
        if (!resource) throw new Error(`XTend RMT ${kind} resource not found: ${uri.href}`);
        return { contents: [{ uri: uri.href, mimeType: resource.mimeType, text: resource.text }] };
      }
    );
  }
}

function promptName(record, index) {
  const id = String(record.id || `recipe_${index + 1}`).replace(/[^a-zA-Z0-9_]+/gu, '_');
  return `xtendRmt_${id}`;
}

function registerKitPrompts(server, options) {
  getXtendRmtKitRecords('recipe', options).forEach((record, index) => {
    server.registerPrompt(
      promptName(record, index),
      {
        title: record.title || record.intent || `XTendRMT Recipe ${index + 1}`,
        description: record.intent || 'Apply a curated XTendRMT AI Developer Kit recipe.',
        argsSchema: z.object({
          task: z.string().max(2000).optional().describe('Optional task-specific context supplied by the user.')
        })
      },
      async ({ task }) => ({
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: [
              record.intent || record.title || 'Apply this XTendRMT recipe.',
              task ? `Task: ${task}` : '',
              record.source ? `\n\`\`\`rmt\n${record.source.trim()}\n\`\`\`` : '',
              Array.isArray(record.steps) && record.steps.length ? `Steps: ${record.steps.join(' ')}` : '',
              Array.isArray(record.commands) && record.commands.length ? `Validate: ${record.commands.join(' ; ')}` : '',
              record.sourceRef ? `Source: xtend://rmt/kit/recipe/${encodeURIComponent(record.id)}` : ''
            ].filter(Boolean).join('\n\n')
          }
        }]
      })
    );
  });
}

function registerKnowledgeTools(server, options) {
  server.registerTool('xtend_knowledge_search', {
    title: 'Search XTend knowledge',
    description: 'First step for XTend/RMT authoring: search canonical Markdown and curated AI Kit records before proposing source.',
    inputSchema: z.object({
      query: z.string().min(1).max(500),
      locale: localeSchema.optional(),
      scopes: z.array(scopeSchema).min(1).max(2).optional(),
      limit: z.number().int().min(1).max(10).default(6),
      domains: z.array(z.string().max(64)).max(6).optional()
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, safeHandler(options, async (args) => {
    const result = searchXtendKnowledge(args, options);
    const provenance = result.hits.map((hit) => ({ uri: hit.uri, sourceHash: hit.sourceHash, sourcePath: hit.sourcePath }));
    return toolSuccess(result, `Found ${result.hitCount} XTend knowledge resources for "${result.query}".`, provenance, result.hits);
  }));

  server.registerTool('xtend_knowledge_context', {
    title: 'Build XTend RAG context',
    description: 'Build bounded, provenance-preserving XTend context. Set scopes to rmt-kit for LLM product parity.',
    inputSchema: z.object({
      query: z.string().min(1).max(500),
      locale: localeSchema.optional(),
      scopes: z.array(scopeSchema).min(1).max(2).optional(),
      limit: z.number().int().min(1).max(10).default(6),
      domains: z.array(z.string().max(64)).max(6).optional(),
      maxChars: z.number().int().min(1000).max(20000).optional(),
      maxRecords: z.number().int().min(1).max(8).optional(),
      includeRecipes: z.boolean().optional()
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, safeHandler(options, async (args) => {
    const rmtOnly = Array.isArray(args.scopes) && args.scopes.length === 1 && args.scopes[0] === 'rmt-kit';
    const result = rmtOnly
      ? await executeRmtKnowledge({ arguments: args }, options)
      : createXtendKnowledgeContext(args, options);
    const hits = result.hits || [...(result.records || []), ...(result.recipes || [])];
    const provenance = hits.map((hit) => ({
      uri: hit.uri || hit.resourceUri || hit.sourceRef || hit.sourceRefs?.[0] || 'xtend://rmt/kit/manifest',
      sourceHash: hit.sourceHash || '',
      sourcePath: hit.sourcePath || hit.sourceRef || hit.sourceRefs?.[0] || ''
    }));
    return toolSuccess(result, `Built bounded XTend knowledge context for "${args.query}".`, provenance);
  }));
}

function registerToolingTools(server, options) {
  server.registerTool('xtend_rmt_diagnostics', {
    title: 'Diagnose XTendRMT source',
    description: 'Run deterministic XTendRMT language diagnostics without executing application code.',
    inputSchema: sourceSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, safeHandler(options, async (args) => {
    const data = await runRmtDiagnostics(args, options);
    return toolSuccess(data, `XTendRMT diagnostics completed with ${data.diagnostics.length} diagnostic(s).`, toolingProvenance('diagnostics', data));
  }));

  server.registerTool('xtend_rmt_compile_check', {
    title: 'Check XTendRMT compilation',
    description: 'Required final validation for generated RMT source. Do not call source valid unless this returns ok=true and status=compiled.',
    inputSchema: sourceSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, safeHandler(options, async (args) => {
    const data = await runRmtCompileCheck(args, options);
    return toolSuccess(data, `XTendRMT compile check completed with status ${data.status}.`, toolingProvenance('compile-check', data));
  }));

  server.registerTool('xtend_maraca_plan', {
    title: 'Plan XTend Maraca build',
    description: 'Create a deterministic Maraca build plan without writing artifacts.',
    inputSchema: sourceSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, safeHandler(options, async (args) => {
    const data = await runMaracaPlan(args, options);
    return toolSuccess(data, `Maraca plan completed with status ${data.status}.`, toolingProvenance('maraca-plan', data));
  }));

  server.registerTool('xtend_rmt_repair_plan', {
    title: 'Plan safe XTendRMT repairs',
    description: 'Produce safe, selectable workspace-edit repairs with source and plan fingerprints.',
    inputSchema: sourceSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, safeHandler(options, async (args) => {
    const { plan } = createRmtRepairPlan(args, options);
    return toolSuccess(plan, `Planned ${plan.safeRepairCount} safe XTendRMT repair(s).`, toolingProvenance('repair-plan', plan));
  }));

  if (options.allowWorkspaceWrite) {
    server.registerTool('xtend_rmt_apply_safe_repairs', {
      title: 'Apply selected safe XTendRMT repairs',
      description: 'Atomically apply selected safe repairs after source and plan fingerprints are revalidated.',
      inputSchema: z.object({
        path: z.string().min(1).max(4096),
        sourceHash: z.string().regex(/^[a-f0-9]{64}$/u),
        planHash: z.string().regex(/^[a-f0-9]{64}$/u),
        repairIds: z.array(z.string().min(1).max(128)).min(1).max(100)
      }),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false }
    }, safeHandler(options, async (args) => {
      const data = await applyRmtSafeRepairs(args, options);
      return toolSuccess(data, `Applied ${data.appliedRepairIds.length} safe XTendRMT repair(s) atomically.`, toolingProvenance('repair-apply', data));
    }));
  }
}

export function createXtendMcpServer(options = {}) {
  loadXtendKnowledgeBundle(options);
  const normalizedOptions = {
    ...options,
    workspaceRoots: Array.isArray(options.workspaceRoots) ? options.workspaceRoots : [],
    allowWorkspaceWrite: options.allowWorkspaceWrite === true
  };
  const server = new McpServer(
    { name: 'XTend MCP', version: XTEND_MCP_VERSION },
    { instructions: XTEND_MCP_INSTRUCTIONS }
  );
  registerKnowledgeResources(server, normalizedOptions);
  registerKitPrompts(server, normalizedOptions);
  registerKnowledgeTools(server, normalizedOptions);
  registerToolingTools(server, normalizedOptions);
  return server;
}

export function createXtendMcpServerFactory(options = {}) {
  return () => createXtendMcpServer(options);
}
