import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createNoManualUiWiringGate } from '../../../xtendrmt/rmt-app-runtime.js';
import { createXtendLlmAppServer } from '../src/main/app-server.mjs';
import { ConversationStore } from '../src/main/conversation-store.mjs';
import {
  configureExternalNavigation,
  normalizeExternalUrl,
  shouldOpenExternalUrl
} from '../src/main/external-navigation.mjs';
import { SettingsStore } from '../src/main/settings-store.mjs';
import {
  normalizeAttachGenerationSources,
  normalizeCopyText,
  normalizeDeleteConversation,
  normalizeExecuteTool,
  normalizeGenerationDelta,
  normalizeRegenerateAssistantMessage,
  normalizeResetApp,
  normalizeSubmitMessage,
  normalizeUpdateSettings
} from '../src/main/ipc-contract.mjs';
import {
  executeWebSearch,
  normalizeSearxngHtmlResults,
  normalizeSearxngResults
} from '../src/main/tools/web-search.mjs';
import {
  RMT_KNOWLEDGE_RESULT_SCHEMA,
  createRmtKnowledgeIndex,
  executeRmtKnowledge,
  resolveRmtKnowledgeDirectory
} from '../src/main/tools/rmt-knowledge.mjs';
import {
  choosePreferredDtype,
  createModelCachePaths,
  readInstalledModelManifest,
  resolveDefaultUserDataPath,
  safeCachePath,
  validateInstalledModelManifest,
  writeInstalledModelManifest
} from '../src/main/model-cache.mjs';
import {
  BROWSER_EXTERNAL_DATA_ARRAY_BUFFER_LIMIT_BYTES,
  createModelLoadPlan,
  formatUnsupportedModelReport,
  QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER,
  TARGET_MODEL_ID
} from '../src/llm/model-profile.mjs';
import { assessLlmResponseQuality } from '../src/llm/response-quality.mjs';
import {
  createThinkMarkupDeltaFilter,
  stripThinkMarkup
} from '../src/llm/thinking-markup.mjs';
import {
  createCitationSourceMap,
  sourceHostname,
  splitCitationReferences
} from '../src/renderer/citation-source-bridge.mjs';
import {
  normalizeFenceLanguage,
  parseCodeFenceSegments
} from '../src/renderer/code-block-bridge.mjs';
import {
  createRmtCodeHighlighter
} from '../src/renderer/rmt-code-highlighter.mjs';
import {
  parseInlineMarkdown,
  parseMarkdownBlocks
} from '../src/renderer/markdown-format-bridge.mjs';
import { LlmWorkerClient } from '../src/renderer/llm-worker-client.mjs';
import { UiComputeWorkerClient } from '../src/renderer/ui-compute-client.mjs';
import {
  RMT_KNOWLEDGE_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
  buildRmtKnowledgeAugmentedMessages,
  buildSearchAugmentedMessages,
  buildForcedRmtKnowledgeToolCall,
  buildForcedWebSearchToolCall,
  inferSearchLanguage,
  parseToolDecision,
  resolveDeterministicToolCall
} from '../src/renderer/tool-usage-bridge.mjs';

const productRoot = path.resolve(new URL('..', import.meta.url).pathname);
const repoRoot = path.resolve(productRoot, '..', '..');

async function run(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

await run('conversation store creates, persists and trims prompt context', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-test-'));
  const filePath = path.join(tmp, 'conversations.json');
  let tick = 0;
  const store = new ConversationStore({
    filePath,
    contextCharBudget: 80,
    now: () => `2026-06-11T00:00:0${tick += 1}.000Z`
  });
  const created = store.createConversation();
  assert.equal(store.state.activeConversationId, created.id);
  store.addUserMessage(created.id, 'Hello local model');
  const jobId = 'generation-test';
  store.startAssistantMessage(created.id, jobId);
  store.appendAssistantDelta(created.id, jobId, 'Hello ');
  store.appendAssistantDelta(created.id, jobId, 'from XTend');
  store.completeAssistantMessage(created.id, jobId, '', 'stop');
  store.addUserMessage(created.id, 'Remember this follow up');
  const prompt = store.buildPromptMessages(created.id);
  assert.equal(prompt[0].role, 'system');
  assert.equal(prompt.at(-1).role, 'user');
  assert.match(prompt.at(-1).content, /\/no_think/u);
  assert.ok(fs.existsSync(filePath));
  const loaded = new ConversationStore({ filePath });
  loaded.load();
  assert.equal(loaded.state.conversations.length, 1);
});

await run('settings store defaults, validates and persists global app settings', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-settings-'));
  const filePath = path.join(tmp, 'settings.json');
  let tick = 0;
  const store = new SettingsStore({
    filePath,
    now: () => `2026-06-11T00:00:0${tick += 1}.000Z`
  });
  assert.equal(store.load().themeMode, 'automatic');
  const updated = store.update({
    themeMode: 'dark',
    customInstructions: 'Answer with concise implementation notes.'
  });
  assert.equal(updated.themeMode, 'dark');
  assert.equal(updated.customInstructions, 'Answer with concise implementation notes.');
  assert.ok(fs.existsSync(filePath));
  const loaded = new SettingsStore({ filePath });
  loaded.load();
  assert.equal(loaded.snapshot().themeMode, 'dark');
  assert.equal(loaded.snapshot().customInstructions, 'Answer with concise implementation notes.');
  assert.throws(() => normalizeUpdateSettings({ themeMode: 'sepia' }), /theme mode/u);
  assert.throws(() => normalizeUpdateSettings({ customInstructions: 'A'.repeat(8001) }), /8000/u);
  assert.throws(() => normalizeResetApp({ confirm: false }), /confirmation/u);
  assert.equal(normalizeResetApp({ confirm: true }).confirm, true);
  assert.equal(store.reset().themeMode, 'automatic');
  assert.equal(store.snapshot().customInstructions, '');
});

await run('conversation prompt appends custom instructions without replacing default system prompt', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-prompt-settings-'));
  const store = new ConversationStore({
    filePath: path.join(tmp, 'conversations.json'),
    customInstructions: 'Always mention source limitations.'
  });
  const created = store.createConversation();
  store.addUserMessage(created.id, 'Hello');
  const prompt = store.buildPromptMessages(created.id);
  assert.equal(prompt[0].role, 'system');
  assert.match(prompt[0].content, /XTend Local LLM/u);
  assert.match(prompt[0].content, /Additional user instructions:/u);
  assert.match(prompt[0].content, /Always mention source limitations/u);
  store.setCustomInstructions('');
  assert.doesNotMatch(store.buildPromptMessages(created.id)[0].content, /Additional user instructions/u);
});

await run('conversation reset clears chats without touching unrelated model cache files', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-reset-'));
  const cacheFile = path.join(tmp, 'model-cache', 'keep.onnx');
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, 'model');
  const store = new ConversationStore({ filePath: path.join(tmp, 'conversations.json') });
  const conversation = store.createConversation('Reset me');
  store.addUserMessage(conversation.id, 'Delete all chats');
  assert.equal(store.state.conversations.length, 1);
  store.reset();
  assert.equal(store.state.conversations.length, 0);
  assert.equal(store.state.activeConversationId, '');
  assert.equal(fs.readFileSync(cacheFile, 'utf8'), 'model');
});

await run('conversation store persists first message when conversation is implicit', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-implicit-'));
  const filePath = path.join(tmp, 'conversations.json');
  const store = new ConversationStore({ filePath });
  const result = store.addUserMessage('', 'First implicit chat message');
  assert.equal(store.state.conversations.length, 1);
  assert.equal(store.state.activeConversationId, result.conversation.id);
  assert.equal(store.state.conversations[0].messages.length, 1);
  assert.equal(store.state.conversations[0].messages[0].role, 'user');
  const loaded = new ConversationStore({ filePath });
  loaded.load();
  assert.equal(loaded.state.conversations[0].messages[0].content, 'First implicit chat message');
});

await run('conversation store deletes chats and moves active selection', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-delete-chat-'));
  const store = new ConversationStore({ filePath: path.join(tmp, 'conversations.json') });
  const first = store.createConversation('First chat');
  const second = store.createConversation('Second chat');
  assert.equal(store.state.activeConversationId, second.id);
  const result = store.deleteConversation(second.id);
  assert.equal(result.deleted.id, second.id);
  assert.equal(store.state.conversations.length, 1);
  assert.equal(store.state.activeConversationId, first.id);
  store.deleteConversation(first.id);
  assert.equal(store.state.conversations.length, 0);
  assert.equal(store.state.activeConversationId, '');
});

await run('assistant thinking markup is filtered from streaming and stored messages', () => {
  const filter = createThinkMarkupDeltaFilter();
  assert.equal(filter.push('<thi'), '');
  assert.equal(filter.push('nk>private chain'), '');
  assert.equal(filter.push('</thi'), '');
  assert.equal(filter.push('nk>\nThe visible answer.'), 'The visible answer.');
  assert.equal(filter.complete(), 'The visible answer.');
  assert.equal(stripThinkMarkup('Before <think>hidden</think> After'), 'Before  After');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-think-filter-'));
  const store = new ConversationStore({ filePath: path.join(tmp, 'conversations.json') });
  const created = store.createConversation();
  const jobId = 'generation-think-filter';
  store.startAssistantMessage(created.id, jobId);
  store.appendAssistantDelta(created.id, jobId, '<think>hidden</think>The answer is visible.');
  store.completeAssistantMessage(created.id, jobId, '<think>hidden final</think>The final answer.', 'stop');
  assert.equal(store.activeConversation.messages.at(-1).content, 'The final answer.');
});

await run('conversation store persists assistant sources outside prompt context', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-sources-'));
  const filePath = path.join(tmp, 'conversations.json');
  const store = new ConversationStore({ filePath });
  const created = store.createConversation();
  store.addUserMessage(created.id, 'What happened today?');
  const jobId = 'generation-with-sources';
  store.startAssistantMessage(created.id, jobId);
  store.attachAssistantSources(created.id, jobId, [
    {
      index: 1,
      title: 'Current report',
      url: 'https://example.com/current',
      snippet: 'Current sourced context.'
    }
  ]);
  store.completeAssistantMessage(created.id, jobId, 'Answer grounded in sources. [1]', 'stop');

  const loaded = new ConversationStore({ filePath });
  loaded.load();
  const assistant = loaded.activeConversation.messages.at(-1);
  assert.equal(assistant.sources.length, 1);
  assert.equal(assistant.sources[0].title, 'Current report');
  const prompt = loaded.buildPromptMessages(created.id).map((message) => message.content).join('\n');
  assert.match(prompt, /Answer grounded in sources/u);
  assert.doesNotMatch(prompt, /Current sourced context/u);
});

await run('conversation store regenerates assistant messages in place with bounded prompt context', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-regenerate-'));
  let tick = 0;
  const store = new ConversationStore({
    filePath: path.join(tmp, 'conversations.json'),
    now: () => `2026-06-11T00:00:${String(tick += 1).padStart(2, '0')}.000Z`
  });
  const created = store.createConversation();
  store.addUserMessage(created.id, 'First question');
  store.startAssistantMessage(created.id, 'generation-first');
  store.completeAssistantMessage(created.id, 'generation-first', 'First answer', 'stop');
  const target = store.activeConversation.messages.at(-1);
  store.addUserMessage(created.id, 'Later question');
  store.startAssistantMessage(created.id, 'generation-later');
  store.completeAssistantMessage(created.id, 'generation-later', 'Later answer', 'stop');

  const result = store.regenerateAssistantMessage(created.id, target.id, { jobId: 'generation-replacement' });
  const messages = store.activeConversation.messages;
  const regenerated = messages.find((message) => message.id === target.id);
  assert.equal(regenerated.id, target.id);
  assert.equal(regenerated.jobId, 'generation-replacement');
  assert.equal(regenerated.status, 'streaming');
  assert.equal(regenerated.content, '');
  assert.equal(messages.length, 4);
  assert.equal(messages.at(-1).content, 'Later answer');
  assert.equal(result.originalPrompt, 'First question');
  assert.deepEqual(result.promptMessages.map((message) => message.role), ['system', 'user']);
  assert.match(result.promptMessages.at(-1).content, /First question/u);
  assert.doesNotMatch(result.promptMessages.map((message) => message.content).join('\n'), /Later question|Later answer|First answer/u);
  assert.throws(() => store.regenerateAssistantMessage(created.id, messages[0].id), /assistant/u);
  assert.throws(() => store.regenerateAssistantMessage(created.id, target.id), /streaming/u);
});

await run('ipc contracts reject malformed payloads', () => {
  assert.throws(() => normalizeSubmitMessage({ text: '' }), /required/u);
  assert.throws(() => normalizeDeleteConversation('../bad'), /identifier/u);
  assert.equal(normalizeDeleteConversation('conversation-123').conversationId, 'conversation-123');
  assert.throws(() => normalizeGenerationDelta({ conversationId: '../bad', jobId: 'ok', delta: 'x' }), /identifier/u);
  assert.throws(() => normalizeCopyText({ messageId: '../bad', text: 'copy' }), /identifier/u);
  assert.equal(normalizeCopyText({ messageId: 'message-123', text: 'copy me' }).text, 'copy me');
  assert.throws(() => normalizeRegenerateAssistantMessage({ conversationId: 'conversation-123', messageId: '../bad' }), /identifier/u);
  assert.equal(normalizeRegenerateAssistantMessage({
    conversationId: 'conversation-123',
    messageId: 'message-123',
    maxNewTokens: 9000
  }).maxNewTokens, 2048);
  const normalized = normalizeSubmitMessage({ conversationId: '', text: 'hello', maxNewTokens: 9000 });
  assert.equal(normalized.maxNewTokens, 2048);
});

await run('LLM worker client exposes lifecycle telemetry and terminates cleanly', async () => {
  const OriginalWorker = globalThis.Worker;
  const messages = [];
  class FakeWorker {
    constructor(url, options) {
      this.url = url;
      this.options = options;
      this.terminated = false;
    }

    addEventListener(_name, listener) {
      this.listener = listener;
    }

    postMessage(message) {
      messages.push(message);
    }

    terminate() {
      this.terminated = true;
    }
  }

  globalThis.Worker = FakeWorker;
  try {
    const client = new LlmWorkerClient({ fake: true });
    client.generate({ jobId: 'job-worker-test', conversationId: 'conversation-worker-test' });
    assert.deepEqual(client.snapshot().pendingJobs, ['job-worker-test']);
    assert.equal(client.snapshot().fake, true);
    const disposed = client.dispose('unit-test');
    assert.equal(disposed.disposed, true);
    assert.equal(disposed.pendingJobCount, 0);
    assert.equal(client.worker.terminated, true);
    await assert.rejects(() => client.generateOnce({ jobId: 'after-dispose' }), /disposed/u);
    assert.equal(messages.some((message) => message.type === 'generate'), true);
  } finally {
    if (OriginalWorker) globalThis.Worker = OriginalWorker;
    else delete globalThis.Worker;
  }
});

await run('UI compute worker exposes prewarm coprocessor telemetry', async () => {
  const client = new UiComputeWorkerClient({ fake: true });
  const manifest = await client.prewarmSurfaces(['settings-dialog', 'code-bridge'], {
    backpressureLevel: 'high'
  });
  assert.equal(manifest.schema, 'xtend-llm.ui-compute-prewarm.v1');
  assert.equal(manifest.targetCount, 2);
  assert.equal(manifest.entries.every((entry) => entry.fiberKind === 'component.worker_prerender_hydrate'), true);
  const layout = await client.compute('compute.layoutSummary', {
    widgets: [
      { id: 'a', lane: 'visible' },
      { id: 'b', lane: 'background', hidden: true }
    ]
  });
  assert.equal(layout.schema, 'xtend-llm.ui-compute-layout-summary.v1');
  assert.equal(layout.visibleCount, 1);
  const snapshot = client.snapshot();
  assert.equal(snapshot.responsibilities.includes('ui_compute'), true);
  assert.equal(snapshot.excludedResponsibilities.includes('dom_mutation'), true);
  assert.equal(snapshot.completedJobs, 2);
  assert.equal(client.dispose('unit-test').disposed, true);
});

await run('external navigation opens safe off-app links in the system browser', async () => {
  const appOrigin = 'http://127.0.0.1:4123/';

  assert.equal(normalizeExternalUrl('javascript:alert(1)'), '');
  assert.equal(normalizeExternalUrl('file:///etc/passwd'), '');
  assert.equal(shouldOpenExternalUrl(`${appOrigin}build/xtend.maraca.mjs`, appOrigin), '');
  assert.equal(shouldOpenExternalUrl('https://example.com/source', appOrigin), 'https://example.com/source');
  assert.equal(shouldOpenExternalUrl('mailto:hello@example.com', appOrigin), 'mailto:hello@example.com');

  const listeners = new Map();
  const opened = [];
  let windowOpenHandler = null;
  const webContents = {
    setWindowOpenHandler(handler) {
      windowOpenHandler = handler;
    },
    on(name, handler) {
      listeners.set(name, handler);
    }
  };

  configureExternalNavigation(webContents, {
    appOrigin,
    openExternal: async (url) => {
      opened.push(url);
    },
    logger: { warn() {} }
  });

  assert.equal(typeof windowOpenHandler, 'function');
  assert.deepEqual(windowOpenHandler({ url: 'https://example.com/source' }), { action: 'deny' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(opened, ['https://example.com/source']);

  let prevented = false;
  listeners.get('will-navigate')({ preventDefault() { prevented = true; } }, `${appOrigin}local-page`);
  assert.equal(prevented, false);

  listeners.get('will-navigate')({ preventDefault() { prevented = true; } }, 'file:///etc/passwd');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(opened, ['https://example.com/source']);

  prevented = false;
  listeners.get('will-navigate')({ preventDefault() { prevented = true; } }, 'https://news.example/story');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(prevented, true);
  assert.equal(opened.at(-1), 'https://news.example/story');
});

await run('tool IPC contract allows only bounded local tools', () => {
  const normalized = normalizeExecuteTool({
    jobId: 'generation-123',
    conversationId: 'conversation-123',
    toolCall: {
      name: WEB_SEARCH_TOOL_NAME,
      arguments: {
        query: 'latest XTend release',
        maxResults: 99,
        language: 'en-US'
      }
    }
  });
  assert.equal(normalized.name, WEB_SEARCH_TOOL_NAME);
  assert.equal(normalized.arguments.maxResults, 5);
  assert.equal(normalized.arguments.language, 'en-US');
  const rmtKnowledge = normalizeExecuteTool({
    jobId: 'generation-123',
    conversationId: 'conversation-123',
    toolCall: {
      name: RMT_KNOWLEDGE_TOOL_NAME,
      arguments: {
        query: 'How do hydrate and surface work in RMT?',
        maxRecords: 99,
        domains: ['hydrate', 'surface', 'lane', 'selector', 'validation', 'transition', 'extra'],
        includeRecipes: false
      }
    }
  });
  assert.equal(rmtKnowledge.name, RMT_KNOWLEDGE_TOOL_NAME);
  assert.equal(rmtKnowledge.arguments.query, 'How do hydrate and surface work in RMT?');
  assert.equal(rmtKnowledge.arguments.maxRecords, 8);
  assert.deepEqual(rmtKnowledge.arguments.domains, ['hydrate', 'surface', 'lane', 'selector', 'validation', 'transition']);
  assert.equal(rmtKnowledge.arguments.includeRecipes, false);
  assert.throws(() => normalizeExecuteTool({
    name: 'shell',
    arguments: { query: 'nope' }
  }), /Unsupported XTend LLM tool/u);
  assert.throws(() => normalizeExecuteTool({
    name: WEB_SEARCH_TOOL_NAME,
    arguments: { query: '' }
  }), /required/u);
  assert.throws(() => normalizeExecuteTool({
    name: RMT_KNOWLEDGE_TOOL_NAME,
    arguments: { query: '' }
  }), /required/u);
});

await run('source IPC contract keeps only bounded safe http sources', () => {
  const normalized = normalizeAttachGenerationSources({
    jobId: 'generation-123',
    conversationId: 'conversation-123',
    sources: [
      {
        title: 'Safe result',
        url: 'https://example.com/article',
        snippet: 'A'.repeat(700),
        publishedDate: '2026-06-12',
        score: 2.5
      },
      {
        title: 'Unsafe',
        url: 'javascript:alert(1)',
        snippet: 'ignore'
      },
      {
        title: 'Duplicate',
        url: 'https://example.com/article',
        snippet: 'ignore duplicate'
      },
      {
        index: 4,
        title: '',
        url: 'https://news.example.org/story',
        content: 'Fallback snippet'
      }
    ]
  });
  assert.equal(normalized.schema, 'xtend-llm.generation-sources.v1');
  assert.equal(normalized.sources.length, 2);
  assert.equal(normalized.sources[0].index, 1);
  assert.equal(normalized.sources[0].snippet.length, 600);
  assert.equal(normalized.sources[0].score, 2.5);
  assert.equal(normalized.sources[1].index, 4);
  assert.equal(normalized.sources[1].title, 'news.example.org');
  assert.equal(normalized.sources[1].snippet, 'Fallback snippet');
  assert.throws(() => normalizeAttachGenerationSources({
    jobId: '../bad',
    conversationId: 'conversation-123',
    sources: []
  }), /identifier/u);
});

await run('web search tool normalizes SearXNG JSON without leaking unsafe URLs', async () => {
  const rawResults = normalizeSearxngResults({
    results: [
      {
        title: 'Safe result',
        url: 'https://example.com/page',
        content: 'A useful summary.',
        score: '2.5',
        publishedDate: '2026-06-12'
      },
      {
        title: 'Unsafe result',
        url: 'javascript:alert(1)',
        content: 'ignore'
      },
      {
        title: 'Duplicate result',
        url: 'https://example.com/page',
        content: 'ignore duplicate'
      }
    ]
  }, { maxResults: 5 });
  assert.equal(rawResults.length, 1);
  assert.equal(rawResults[0].title, 'Safe result');
  assert.equal(rawResults[0].url, 'https://example.com/page');
  assert.equal(rawResults[0].score, 2.5);

  let requestedUrl = '';
  const response = await executeWebSearch({
    toolCallId: 'tool-call-test',
    arguments: {
      query: 'current qwen3 webgpu',
      maxResults: 2,
      language: 'en-US'
    }
  }, {
    baseUrl: 'https://search.example.test',
    timeoutMs: 1000,
    fetchImpl: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async json() {
          return {
            results: [
              { title: 'A', url: 'https://example.test/a', content: 'Alpha' },
              { title: 'B', url: 'https://example.test/b', content: 'Beta' },
              { title: 'C', url: 'https://example.test/c', content: 'Gamma' }
            ]
          };
        }
      };
    }
  });
  assert.match(requestedUrl, /format=json/u);
  assert.match(requestedUrl, /safesearch=1/u);
  assert.match(requestedUrl, /language=en-US/u);
  assert.equal(response.schema, 'xtend-llm.tool-result.web-search.v1');
  assert.equal(response.results.length, 2);
});

await run('web search tool falls back to SearXNG HTML results when JSON is forbidden', async () => {
  const html = `
    <article class="result result-default category-general">
      <a href="https://www.sportschau.de/fussball/fifa-wm-2026" class="url_header" rel="noreferrer"></a>
      <h3><a href="https://www.sportschau.de/fussball/fifa-wm-2026" rel="noreferrer">
        News, Videos und Spielplan zur WM 2026 | sportschau.de
      </a></h3>
      <p class="content">Hier finden Sie alle Nachrichten zur FIFA <span class="highlight">Fußball-WM</span> 2026.</p>
    </article>
  `;
  const parsed = normalizeSearxngHtmlResults(html, { maxResults: 5 });
  assert.equal(parsed.length, 1);
  assert.match(parsed[0].title, /WM 2026/u);
  assert.match(parsed[0].snippet, /Fußball-WM 2026/u);

  const requestedUrls = [];
  const response = await executeWebSearch({
    toolCallId: 'tool-call-html-test',
    arguments: {
      query: 'ist aktuell Fußball-WM',
      maxResults: 2,
      language: 'de-DE'
    }
  }, {
    baseUrl: 'https://search.example.test',
    timeoutMs: 1000,
    fetchImpl: async (url) => {
      requestedUrls.push(url);
      if (requestedUrls.length === 1) {
        return {
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          async json() {
            throw new Error('forbidden');
          }
        };
      }
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async text() {
          return html;
        }
      };
    }
  });
  assert.match(requestedUrls[0], /format=json/u);
  assert.doesNotMatch(requestedUrls[1], /format=json/u);
  assert.equal(response.transport, 'html');
  assert.equal(response.results.length, 1);
});

await run('RMT knowledge tool retrieves bounded records, recipes and prompt context offline', async () => {
  const result = await executeRmtKnowledge({
    toolCallId: 'tool-call-rmt-test',
    arguments: {
      query: 'How do I use hydrate inside surface lanes in RMT?',
      maxRecords: 4,
      domains: ['hydrate', 'surface'],
      includeRecipes: true
    }
  }, {
    noCache: true
  });
  assert.equal(result.schema, RMT_KNOWLEDGE_RESULT_SCHEMA);
  assert.equal(result.name, RMT_KNOWLEDGE_TOOL_NAME);
  assert.equal(result.records.length <= 4, true);
  assert.equal(result.recipes.length <= 3, true);
  assert.ok(result.records.some((record) => ['operator:hydrate', 'operator:surface', 'operator:lane'].includes(record.id)));
  assert.ok(result.recipes.some((recipe) => recipe.id === 'minimal-rmt-app'));
  assert.match(result.promptContext, /XTEND_RMT_KNOWLEDGE_CONTEXT/u);
  assert.match(result.promptContext, /Do not invent RMT syntax/u);
  assert.match(result.promptContext, /```rmt/u);
  assert.ok(Array.isArray(result.sourceHashes));

  const strict = await executeRmtKnowledge({
    toolCallId: 'tool-call-rmt-strict-test',
    arguments: {
      query: 'Give me a validation transition Maraca strict code example.',
      maxRecords: 6,
      domains: ['validation', 'transition', 'maraca'],
      includeRecipes: true
    }
  }, {
    noCache: true
  });
  assert.ok(strict.records.some((record) => ['operator:validation', 'operator:transition'].includes(record.id)));
  assert.ok(strict.recipes.some((recipe) => recipe.id === 'validation-transition-maraca-strict' || recipe.id === 'maraca-plan-build'));
  assert.match(strict.promptContext, /xt rmt lint <file> --agent/u);
});

await run('RMT knowledge loader honors the environment knowledge directory first', () => {
  const sourceKit = path.join(repoRoot, 'docs', 'ai', 'rmt-ai-developer-kit');
  assert.ok(fs.existsSync(sourceKit), 'RMT AI Developer Kit must exist for product RAG tests');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-rmt-kit-'));
  const tempKit = path.join(tmp, 'kit');
  fs.cpSync(sourceKit, tempKit, { recursive: true });
  const previous = process.env.XTEND_LLM_RMT_KNOWLEDGE_DIR;
  process.env.XTEND_LLM_RMT_KNOWLEDGE_DIR = tempKit;
  try {
    assert.equal(resolveRmtKnowledgeDirectory(), tempKit);
    const index = createRmtKnowledgeIndex();
    assert.equal(index.knowledgeDir, tempKit);
    assert.ok(index.documents.some((document) => document.id === 'operator:hydrate'));
  } finally {
    if (previous === undefined) {
      delete process.env.XTEND_LLM_RMT_KNOWLEDGE_DIR;
    } else {
      process.env.XTEND_LLM_RMT_KNOWLEDGE_DIR = previous;
    }
  }
});

await run('renderer tool bridge parses Qwen tool decisions and builds cited search context', () => {
  const parsed = parseToolDecision([
    '<think>private</think>',
    '<tool_call>{"name":"web_search","arguments":{"query":"Qwen3 WebGPU news","maxResults":8,"language":"auto"}}</tool_call>'
  ].join('\n'));
  assert.equal(parsed.type, 'tool_call');
  assert.equal(parsed.toolCall.arguments.query, 'Qwen3 WebGPU news');
  assert.equal(parsed.toolCall.arguments.maxResults, 5);
  assert.equal(parseToolDecision('<no_tool/>').type, 'none');
  assert.equal(parseToolDecision('<tool_call>{bad json}</tool_call>').type, 'none');
  assert.equal(inferSearchLanguage('Was ist heute aktuell?'), 'de-DE');
  assert.equal(inferSearchLanguage('What happened today?'), 'en-US');

  const messages = buildSearchAugmentedMessages([
    { role: 'system', content: 'system' },
    { role: 'user', content: 'What happened today? /no_think' }
  ], {
    query: 'What happened today?',
    language: 'en-US',
    results: [
      { title: 'Result A', url: 'https://example.com/a', snippet: 'A useful current result.' }
    ]
  });
  assert.equal(messages.at(-1).role, 'user');
  assert.match(messages.at(-1).content, /XTEND_WEB_SEARCH_RESULTS/u);
  assert.match(messages.at(-1).content, /\[1\] Result A/u);
  assert.match(messages.at(-1).content, /Cite/u);
});

await run('renderer tool bridge forces web search for German current-event follow ups', () => {
  const direct = resolveDeterministicToolCall([
    { role: 'system', content: 'system' },
    { role: 'user', content: 'ist aktuell Fußball-WM? /no_think' }
  ], 'ist aktuell Fußball-WM?');
  assert.equal(direct.type, 'tool_call');
  assert.equal(direct.toolCall.name, 'web_search');
  assert.equal(direct.toolCall.arguments.language, 'de-DE');
  assert.match(direct.toolCall.arguments.query, /Fußball-WM/u);

  const followUp = resolveDeterministicToolCall([
    { role: 'system', content: 'system' },
    { role: 'user', content: 'ist aktuell Fußball-WM? /no_think' },
    { role: 'assistant', content: 'Aktuell ist es die Fußball-WM in der Saison 2023/2024.' },
    {
      role: 'user',
      content: 'Hast du ein Websuche-Tool zur Verfügung, um nachzuschauen, ob jetzt gerade Fußball-WM ist? /no_think'
    },
    { role: 'assistant', content: 'Ja, ich habe ein Websuche-Tool.' },
    { role: 'user', content: 'Kannst du dieses anwenden? /no_think' },
    { role: 'assistant', content: 'Ja, ich kann das anwenden.' },
    { role: 'user', content: 'Wende es nun an. /no_think' }
  ], 'Wende es nun an.');
  assert.equal(followUp.type, 'tool_call');
  assert.equal(followUp.reason, 'follow-up');
  assert.equal(followUp.toolCall.arguments.language, 'de-DE');
  assert.match(followUp.toolCall.arguments.query, /Fußball-WM/u);
  assert.doesNotMatch(followUp.toolCall.arguments.query, /Wende es/u);

  const stable = resolveDeterministicToolCall([
    { role: 'user', content: 'How is a div in HTML created? /no_think' }
  ], 'How is a div in HTML created?');
  assert.equal(stable.type, 'none');
});

await run('renderer tool bridge builds forced web search calls from prompt text', () => {
  const forced = buildForcedWebSearchToolCall('Bitte suche aktuelle Nachrichten zur Fußball-WM.');
  assert.equal(forced.type, 'tool_call');
  assert.equal(forced.reason, 'forced');
  assert.equal(forced.toolCall.name, 'web_search');
  assert.equal(forced.toolCall.arguments.language, 'de-DE');
  assert.match(forced.toolCall.arguments.query, /Fußball-WM/u);
  assert.equal(buildForcedWebSearchToolCall('ok').type, 'none');
});

await run('renderer tool bridge routes RMT questions to local knowledge before normal model fallback', () => {
  const direct = resolveDeterministicToolCall([
    { role: 'system', content: 'system' },
    { role: 'user', content: 'Zeig mir ein RMT hydrate surface Beispiel. /no_think' }
  ], 'Zeig mir ein RMT hydrate surface Beispiel.');
  assert.equal(direct.type, 'tool_call');
  assert.equal(direct.toolCall.name, RMT_KNOWLEDGE_TOOL_NAME);
  assert.equal(direct.toolCall.arguments.includeRecipes, true);
  assert.ok(direct.toolCall.arguments.domains.includes('hydrate'));
  assert.ok(direct.toolCall.arguments.domains.includes('surface'));

  const genericSearchRmt = resolveDeterministicToolCall([
    { role: 'user', content: 'Suche mir ein RMT hydrate Beispiel. /no_think' }
  ], 'Suche mir ein RMT hydrate Beispiel.');
  assert.equal(genericSearchRmt.type, 'tool_call');
  assert.equal(genericSearchRmt.toolCall.name, RMT_KNOWLEDGE_TOOL_NAME);

  const followUp = resolveDeterministicToolCall([
    { role: 'user', content: 'Kannst du RMT syntax erklären? /no_think' },
    { role: 'assistant', content: 'Ja, ich kann dafür das RMT knowledge tool verwenden.' },
    { role: 'user', content: 'Wende es nun an. /no_think' }
  ], 'Wende es nun an.');
  assert.equal(followUp.type, 'tool_call');
  assert.equal(followUp.toolCall.name, RMT_KNOWLEDGE_TOOL_NAME);

  const currentWeb = resolveDeterministicToolCall([
    { role: 'user', content: 'Suche online nach den neuesten RMT Release Notes. /no_think' }
  ], 'Suche online nach den neuesten RMT Release Notes.');
  assert.equal(currentWeb.type, 'tool_call');
  assert.equal(currentWeb.toolCall.name, WEB_SEARCH_TOOL_NAME);

  const normal = resolveDeterministicToolCall([
    { role: 'user', content: 'Write a short poem about local development. /no_think' }
  ], 'Write a short poem about local development.');
  assert.equal(normal.type, 'none');

  const forced = buildForcedRmtKnowledgeToolCall('Bitte zeig ein validation transition Beispiel.');
  assert.equal(forced.type, 'tool_call');
  assert.equal(forced.reason, 'forced');
  assert.equal(forced.toolCall.name, RMT_KNOWLEDGE_TOOL_NAME);
  assert.equal(forced.toolCall.arguments.includeRecipes, true);

  const messages = buildRmtKnowledgeAugmentedMessages([
    { role: 'system', content: 'system' },
    { role: 'user', content: 'How do I hydrate? /no_think' }
  ], {
    query: 'hydrate',
    promptContext: [
      'XTEND_RMT_KNOWLEDGE_CONTEXT',
      'Query: hydrate',
      '[R1] hydrate (operator)'
    ].join('\n')
  });
  assert.equal(messages.at(-1).role, 'user');
  assert.match(messages.at(-1).content, /XTEND_RMT_KNOWLEDGE_CONTEXT/u);
  assert.match(messages.at(-1).content, /fenced ```rmt blocks/u);
  assert.match(messages.at(-1).content, /Do not invent RMT syntax/u);
});

await run('model cache helpers choose dtype and prevent traversal', () => {
  assert.equal(choosePreferredDtype(['fp16', 'q4f16']), 'q4f16');
  assert.equal(choosePreferredDtype(['int8']), 'fp32');
  const paths = createModelCachePaths('/tmp/xtend-user-data', 'onnx-community/Qwen3-8B-ONNX');
  assert.match(paths.modelRoot, /onnx-community__Qwen3-8B-ONNX/u);
  assert.throws(() => safeCachePath('/tmp/cache', '../../escape'), /escaped/u);
});

await run('model installer manifests use permanent Electron userData paths', () => {
  const previousUserData = process.env.XTEND_LLM_USER_DATA;
  const previousXdgConfigHome = process.env.XDG_CONFIG_HOME;
  delete process.env.XTEND_LLM_USER_DATA;
  delete process.env.XDG_CONFIG_HOME;
  try {
    assert.equal(
      resolveDefaultUserDataPath('darwin', '/Users/example'),
      '/Users/example/Library/Application Support/XTend Local LLM'
    );
    assert.equal(
      resolveDefaultUserDataPath('linux', '/home/example'),
      '/home/example/.config/XTend Local LLM'
    );
  } finally {
    if (previousUserData === undefined) {
      delete process.env.XTEND_LLM_USER_DATA;
    } else {
      process.env.XTEND_LLM_USER_DATA = previousUserData;
    }
    if (previousXdgConfigHome === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = previousXdgConfigHome;
    }
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-installed-model-'));
  const manifest = {
    schema: 'xtend-llm.installed-models.v1',
    activeModelId: 'onnx-community/Qwen3-0.6B-ONNX',
    userData: tmp,
    cacheRoot: path.join(tmp, 'model-cache'),
    models: {}
  };
  const manifestPath = writeInstalledModelManifest(tmp, manifest);
  assert.equal(manifestPath, createModelCachePaths(tmp).installedManifestPath);
  assert.equal(path.basename(manifestPath), 'installed-models.json');
  assert.deepEqual(readInstalledModelManifest(tmp), manifest);
});

await run('installed model manifests require complete cached weights', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-installed-integrity-'));
  const cacheRoot = path.join(tmp, 'model-cache');
  const modelPath = path.join(cacheRoot, 'onnx-community', 'Qwen3-0.6B-ONNX', 'resolve', 'main', 'onnx', 'model_q4f16.onnx');
  fs.mkdirSync(path.dirname(modelPath), { recursive: true });
  fs.writeFileSync(modelPath, 'abcd');
  const modelId = 'onnx-community/Qwen3-0.6B-ONNX';
  const manifest = {
    schema: 'xtend-llm.installed-models.v1',
    activeModelId: modelId,
    userData: tmp,
    cacheRoot,
    models: {
      [modelId]: {
        files: [
          {
            path: 'onnx/model_q4f16.onnx',
            cachePath: modelPath,
            bytes: 4,
            expectedBytes: 4
          }
        ]
      }
    }
  };
  assert.equal(validateInstalledModelManifest(manifest).ok, true);

  const missingExpected = structuredClone(manifest);
  delete missingExpected.models[modelId].files[0].expectedBytes;
  assert.equal(validateInstalledModelManifest(missingExpected).ok, false);

  const wrongSize = structuredClone(manifest);
  wrongSize.models[modelId].files[0].expectedBytes = 8;
  assert.equal(validateInstalledModelManifest(wrongSize).ok, false);
});

await run('product package exposes model install and app build commands', () => {
  const productPackage = JSON.parse(fs.readFileSync(path.join(productRoot, 'package.json'), 'utf8'));
  assert.equal(productPackage.scripts['model:install'], 'node scripts/model-install.mjs');
  assert.equal(productPackage.scripts['model:install:qwen3-8b'], 'node scripts/model-install.mjs -- --target');
  assert.equal(productPackage.scripts['build:app'], 'node scripts/build-app.mjs');
  assert.equal(productPackage.scripts.build, 'npm run build:app');
  const buildScript = fs.readFileSync(path.join(productRoot, 'scripts', 'build-app.mjs'), 'utf8');
  assert.match(buildScript, /docs', 'ai', 'rmt-ai-developer-kit/u);
  assert.match(buildScript, /knowledge', 'rmt-ai-kit/u);
});

await run('model profile resolves current Qwen3 WebGPU ONNX Runtime layout', () => {
  const tree = [
    'config.json',
    `${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/config.json`,
    `${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/tokenizer.json`,
    `${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/tokenizer_config.json`,
    `${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/model.onnx`,
    `${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/model.onnx.data`
  ].map((pathName) => ({ path: pathName, type: 'file' }));
  const plan = createModelLoadPlan(TARGET_MODEL_ID, tree);
  assert.equal(plan.kind, 'onnxruntime-webgpu-layout');
  assert.equal(plan.pipelineOptions.subfolder, '');
  assert.equal(plan.pipelineOptions.model_file_name, 'model');
  assert.equal(plan.pipelineOptions.session_options.externalData[0].data, 'model.onnx.data');
  assert.match(plan.remotePathTemplate, /onnxruntime\/webgpu\/webgpu-int4-kld-block-32/u);

  const unsupported = createModelLoadPlan('example/missing-model', [{ path: 'README.md' }]);
  assert.equal(unsupported.kind, 'unsupported-layout');
  assert.match(formatUnsupportedModelReport(unsupported), /not loadable/u);
});

await run('model profile rejects browser-oversized Qwen3 external data with explicit report', () => {
  const tree = [
    'config.json',
    `${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/config.json`,
    `${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/tokenizer.json`,
    `${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/tokenizer_config.json`,
    `${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/model.onnx`
  ].map((pathName) => ({ path: pathName, type: 'file' }));
  tree.push({
    path: `${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/model.onnx.data`,
    type: 'file',
    size: BROWSER_EXTERNAL_DATA_ARRAY_BUFFER_LIMIT_BYTES + 1
  });
  const plan = createModelLoadPlan(TARGET_MODEL_ID, tree);
  assert.equal(plan.kind, 'unsupported-layout');
  assert.match(formatUnsupportedModelReport(plan), /Array buffer allocation failed/u);
});

await run('model profile prefers standard Transformers.js dtype assets when present', () => {
  const plan = createModelLoadPlan('example/standard-model', [
    { path: 'onnx/model_quantized.onnx' },
    { path: 'onnx/model_q4f16.onnx' }
  ]);
  assert.equal(plan.kind, 'transformers-js-layout');
  assert.equal(plan.selectedDtype, 'q4f16');
  assert.equal(plan.pipelineOptions.subfolder, 'onnx');
});

await run('LLM response quality accepts meaningful answers and rejects gibberish', () => {
  const meaningful = assessLlmResponseQuality('The answer is 5.', {
    expectedPattern: '\\b(5|five)\\b'
  });
  assert.equal(meaningful.ok, true);
  assert.equal(meaningful.metrics.expectedMatched, true);

  const gibberish = assessLlmResponseQuality('xqz brrr zzzzzzz %%@@@', {
    expectedPattern: '\\b(5|five)\\b'
  });
  assert.equal(gibberish.ok, false);
  assert.ok(gibberish.reasons.length > 0);
});

await run('renderer code bridge parses LLM apostrophe fences for x-code hydration', () => {
  assert.equal(normalizeFenceLanguage('js'), 'javascript');
  assert.equal(normalizeFenceLanguage('rmt-vnext'), 'rmt');
  assert.equal(normalizeFenceLanguage('xtendrmt'), 'rmt');
  const segments = parseCodeFenceSegments([
    'Here is a small example:',
    "'''js",
    "console.log('XTend');",
    "'''",
    'Use it from the app shell.'
  ].join('\n'));
  assert.equal(segments.length, 3);
  assert.equal(segments[0].type, 'text');
  assert.equal(segments[1].type, 'code');
  assert.equal(segments[1].language, 'javascript');
  assert.equal(segments[1].closed, true);
  assert.match(segments[1].code, /console\.log/u);
  assert.equal(segments[2].type, 'text');

  const streaming = parseCodeFenceSegments("'''python\nprint('still streaming')");
  assert.equal(streaming.length, 1);
  assert.equal(streaming[0].type, 'code');
  assert.equal(streaming[0].language, 'python');
  assert.equal(streaming[0].closed, false);

  const prose = parseCodeFenceSegments("It's not a code fence.");
  assert.equal(prose.length, 1);
  assert.equal(prose[0].type, 'text');
});

await run('renderer RMT highlighter emits x-code compatible semantic tokens', () => {
  const highlighter = createRmtCodeHighlighter();
  const highlighted = highlighter.highlight({
    language: 'rmt',
    code: [
      'template ai.login {',
      '  state ai.form type object preserve {',
      '    initial {',
      '      username ""',
      '      remember true',
      '    }',
      '  }',
      '  surface ai.login kind form component x-section {',
      '    lane visible weight 80 {',
      '      hydrate ai.formView from selector ai.form',
      '    }',
      '  }',
      '}'
    ].join('\n')
  });
  assert.equal(highlighted.highlighted, true);
  assert.equal(highlighted.engine, 'xtend-rmt-semantic');
  assert.equal(highlighted.language, 'rmt');
  assert.match(highlighted.html, /token keyword rmt-primitive/u);
  assert.match(highlighted.html, /token keyword rmt-lifecycle/u);
  assert.match(highlighted.html, /token class-name rmt-component/u);
  assert.match(highlighted.html, /token boolean/u);
  assert.equal(highlighter.highlight({ language: 'javascript', code: 'console.log(1)' }), null);
});

await run('renderer markdown bridge parses common LLM formatting without HTML strings', () => {
  const inline = parseInlineMarkdown('Use **bold**, *emphasis*, `code`, ~~old~~ and [XTend](https://example.com).');
  assert.ok(inline.some((token) => token.type === 'strong' && token.children[0].text === 'bold'));
  assert.ok(inline.some((token) => token.type === 'emphasis' && token.children[0].text === 'emphasis'));
  assert.ok(inline.some((token) => token.type === 'code' && token.text === 'code'));
  assert.ok(inline.some((token) => token.type === 'delete' && token.children[0].text === 'old'));
  assert.ok(inline.some((token) => token.type === 'link' && token.href === 'https://example.com/'));

  const unsafe = parseInlineMarkdown('[bad](javascript:alert(1)) remains text');
  assert.equal(unsafe.some((token) => token.type === 'link'), false);

  const blocks = parseMarkdownBlocks([
    '## **Title**',
    '',
    '- **First** item',
    '- `Second` item',
    '',
    '> quoted *text*'
  ].join('\n'));
  assert.equal(blocks[0].type, 'heading');
  assert.equal(blocks[0].depth, 2);
  assert.equal(blocks[1].type, 'list');
  assert.equal(blocks[1].items.length, 2);
  assert.equal(blocks[2].type, 'quote');
});

await run('renderer citation source bridge maps bracket citations to safe sources', () => {
  const sourceMap = createCitationSourceMap([
    {
      index: 1,
      title: 'Primary source',
      url: 'https://www.example.com/article',
      snippet: 'Source summary.'
    },
    {
      index: 2,
      title: 'Unsafe source',
      url: 'javascript:alert(1)'
    },
    {
      index: 4,
      title: 'Later source',
      url: 'https://news.example.org/story'
    }
  ]);
  assert.equal(sourceMap.size, 2);
  assert.equal(sourceMap.get(1).url, 'https://www.example.com/article');
  assert.equal(sourceHostname(sourceMap.get(1).url), 'example.com');
  const tokens = splitCitationReferences('Answer cites [1], skips [2], and cites [4].', sourceMap);
  assert.deepEqual(tokens.map((token) => token.type), ['text', 'citation', 'text', 'citation', 'text']);
  assert.deepEqual(tokens.filter((token) => token.type === 'citation').map((token) => token.index), [1, 4]);
});

await run('Maraca strict build report is present when rmt:build has run', () => {
  const reportPath = path.join(productRoot, 'site', 'build', 'xtend.maraca.report.json');
  if (!fs.existsSync(reportPath)) {
    console.log('skip - build report not present; run npm run rmt:build for bundle assertions');
    return;
  }
  const sourcePath = path.join(productRoot, 'xtend-llm.rmt');
  if (fs.statSync(reportPath).mtimeMs < fs.statSync(sourcePath).mtimeMs) {
    console.log('skip - build report is stale; run npm run rmt:build for bundle assertions');
    return;
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  assert.equal(report.profile, 'production');
  assert.equal(report.orchestration.enabled, true);
  assert.equal(report.kernel.enabled, true);
  assert.equal(report.kernel.productSurface?.bootMode, 'productSurface');
  assert.equal(report.kernel.prewarmWorker?.enabled, true);
  assert.equal(report.hydration.enabled, true);
  assert.equal(report.hydration.serverPrerender?.requested, true);
  assert.equal(report.hydration.serverPrerender?.status, 'supported');
  assert.equal(report.hydration.workerPrerender?.requested, true);
  assert.equal(report.hydration.workerPrerender?.status, 'supported');
  assert.equal(report.validation.enabled, true);
  assert.equal(report.validation.summary?.groupCount || 0, 1);
  assert.equal(report.validation.summary?.fieldCount || 0, 1);
  assert.equal(report.transitions.enabled, true);
  assert.equal(report.templateArtifacts?.trusted, true);
  assert.equal(report.policyParity?.ok, true);
  assert.equal(report.kernelFeatureAdoption?.blockedCount, 0);
  assert.equal(report.productionClosure?.ok, true);
  assert.equal(report.productionClosure?.releaseConstraint?.blocked, false);
  assert.equal(report.productionClosure?.capabilities?.some((capability) => capability.key === 'prerender' && capability.active === true), true);
  assert.ok(report.components.selected.some((component) => component.tag === 'x-code'));
  const bundleFiles = Array.isArray(report.outputs) ? report.outputs : report.bundleFiles;
  assert.ok(bundleFiles.some((entry) => entry.type === 'chunk' && /^chunks\/x-code-[^/]+\.mjs$/u.test(entry.fileName || '')));
  const text = fs.readFileSync(path.join(productRoot, 'site', 'build', 'xtend.maraca.mjs'), 'utf8');
  assert.equal(text.includes('xtend-loader.js'), false);
});

await run('LLM RMT source uses uniform command triggers for public UI events', () => {
  const rmtSource = fs.readFileSync(path.join(productRoot, 'xtend-llm.rmt'), 'utf8');
  assert.equal(/\bon\s+click\b/u.test(rmtSource), false);
  assert.equal(/\bon\s+input-changed\b/u.test(rmtSource), false);
  assert.equal(/\bon\s+textarea-changed\b/u.test(rmtSource), false);
  assert.match(rmtSource, /\bon\s+xtend-command\b/u);
  assert.match(rmtSource, /datasource\s+xtend\.llm\.send\s+from\s+host/u);
  assert.match(rmtSource, /datasource\s+xtend\.llm\.confirmDeleteConversation\s+from\s+host/u);
  assert.match(rmtSource, /datasource\s+xtend\.llm\.copyAssistantMessage\s+from\s+host/u);
  assert.match(rmtSource, /datasource\s+xtend\.llm\.regenerateAssistantMessage\s+from\s+host/u);
  assert.match(rmtSource, /class\s+"xtend-llm-message-actions"/u);
  assert.match(rmtSource, /command\s+"xtend\.llm\.copyAssistantMessage"/u);
  assert.match(rmtSource, /command\s+"xtend\.llm\.regenerateAssistantMessage"/u);
  assert.match(rmtSource, /command\s+"xtend\.llm\.selectSettingsTab"[\s\S]*?event\s+"tab-selected"[\s\S]*?selected\s+"\$detail\.index"/u);
  assert.match(rmtSource, /on\s+tab-selected\s+"#settings-tabs"\s+->\s+action\s+xtend\.llm\.selectSettingsTab[\s\S]*?payload\s+selected\s+from\s+detail\.index/u);
  assert.match(rmtSource, /label\s+"\$model\.xtend\.llm\.settingsDialog\.instructionsTabLabel"/u);
  assert.match(rmtSource, /disabled\s+"\$model\.xtend\.llm\.settingsDialog\.instructionsBusy"/u);
  assert.match(rmtSource, /"aria-disabled"\s+"\$model\.xtend\.llm\.settingsDialog\.instructionsBusy"/u);
  assert.match(rmtSource, /datasource\s+xtend\.llm\.selectSettingsTab\s+from\s+host/u);
  assert.match(rmtSource, /action\s+xtend\.llm\.selectSettingsTab[\s\S]*?reduce\s+state\.xtend\.llm\.settingsDialog\s+=\s+result\.settingsDialog/u);
  assert.match(rmtSource, /state\s+xtend\.llm\.runtimeDiagnostics/u);
  assert.match(rmtSource, /selector\s+xtend\.llm\.runtimeDiagnostics/u);
  assert.match(rmtSource, /datasource\s+xtend\.llm\.readRuntimeDiagnostics\s+from\s+host/u);
  assert.match(rmtSource, /surface\s+xtend\.llm\.runtimeDiagnostics/u);
  assert.match(rmtSource, /hydration\s+mode\s+server_prerender_hydrate/u);
  assert.match(rmtSource, /hydration\s+mode\s+worker_prerender_hydrate/u);
  assert.match(rmtSource, /prewarm\s+settings-dialog/u);
  assert.match(rmtSource, /prewarm\s+runtime-diagnostics/u);
  assert.match(rmtSource, /value\s+"rmt_knowledge"/u);
  assert.match(rmtSource, /label\s+"RMT knowledge"/u);
  assert.match(rmtSource, /surface\s+xtend\.llm\.prompt[\s\S]*?bounds\s+x\s+320\s+y\s+600\s+width\s+888\s+height\s+164/u);
  assert.match(rmtSource, /surface\s+xtend\.llm\.toolMenu[\s\S]*?bounds\s+x\s+340\s+y\s+700\s+width\s+210\s+height\s+44/u);
  assert.match(rmtSource, /surface\s+xtend\.llm\.send[\s\S]*?bounds\s+x\s+1104\s+y\s+700\s+width\s+84\s+height\s+44/u);
});

await run('LLM renderer controller has no product-owned DOM wiring', () => {
  const controllerPath = path.join(productRoot, 'src', 'renderer', 'app-controller.mjs');
  const gate = createNoManualUiWiringGate();
  const diagnostics = gate.scanFiles({
    [controllerPath]: fs.readFileSync(controllerPath, 'utf8')
  });
  assert.deepEqual(diagnostics, []);
});

await run('LLM runtime telemetry bridge exposes RKFA and backpressure snapshots', () => {
  const preloadSource = fs.readFileSync(path.join(productRoot, 'src', 'main', 'preload.cjs'), 'utf8');
  const constantsSource = fs.readFileSync(path.join(productRoot, 'src', 'main', 'constants.mjs'), 'utf8');
  const mainSource = fs.readFileSync(path.join(productRoot, 'src', 'main', 'electron-main.mjs'), 'utf8');
  const controllerSource = fs.readFileSync(path.join(productRoot, 'src', 'renderer', 'app-controller.mjs'), 'utf8');
  assert.match(constantsSource, /telemetrySnapshot:\s+'xtend-llm:telemetry-snapshot'/u);
  assert.match(preloadSource, /telemetry\(\)\s*\{/u);
  assert.match(preloadSource, /copyText\(payload\)\s*\{/u);
  assert.match(preloadSource, /regenerateAssistantMessage\(payload\)\s*\{/u);
  assert.match(mainSource, /createMainTelemetrySnapshot/u);
  assert.match(mainSource, /clipboard\.writeText/u);
  assert.match(mainSource, /regenerateAssistantMessage/u);
  assert.match(mainSource, /productionClosure/u);
  assert.match(controllerSource, /getPerformanceTelemetrySnapshot/u);
  assert.match(controllerSource, /assistantMessageActions/u);
  assert.match(controllerSource, /copyAssistantMessage/u);
  assert.match(controllerSource, /regenerateAssistantMessage/u);
  assert.match(controllerSource, /getPanicRecoverySnapshot/u);
  assert.match(controllerSource, /streamPressureLevel/u);
  assert.match(controllerSource, /UiComputeWorkerClient/u);
  assert.match(controllerSource, /serverPrerenderShell/u);
  assert.match(controllerSource, /settingsSelectedTab:\s*0/u);
  assert.match(controllerSource, /instructionsBusy:\s*Boolean\(state\.modelPreparing\)/u);
  assert.match(controllerSource, /instructionsTabLabel:\s*state\.modelPreparing\s*\?\s*'Instructions \(busy\)'\s*:\s*'Instructions'/u);
  assert.match(controllerSource, /validSettingsTabIndex/u);
  assert.match(controllerSource, /case 'xtend\.llm\.selectSettingsTab'/u);
  assert.doesNotMatch(controllerSource, /selected:\s*0,\n\s*themeMode/u);
  assert.match(controllerSource, /xtend-llm\.telemetry-snapshot\.v1/u);
});

await run('Maraca build report proves LLM UI descriptors and host datasources are RMT-owned', () => {
  const reportPath = path.join(productRoot, 'site', 'build', 'xtend.maraca.report.json');
  if (!fs.existsSync(reportPath)) {
    console.log('skip - build report not present; run npm run rmt:build for RMT ownership assertions');
    return;
  }
  const sourcePath = path.join(productRoot, 'xtend-llm.rmt');
  if (fs.statSync(reportPath).mtimeMs < fs.statSync(sourcePath).mtimeMs) {
    console.log('skip - build report is stale; run npm run rmt:build for RMT ownership assertions');
    return;
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  assert.ok(report.rmtApp, 'build report must include RMT app-runtime descriptor evidence');
  assert.ok(report.components.selected.some((component) => component.tag === 'x-tabs'));
  const descriptorBySurface = new Map(report.rmtApp.descriptors.map((descriptor) => [descriptor.surface, descriptor]));
  const requiredSurfaces = [
    'xtend.llm.toolMenu',
    'xtend.llm.transcript',
    'xtend.llm.conversationList',
    'xtend.llm.settingsDialog',
    'xtend.llm.deleteConversationDialog',
    'xtend.llm.runtimeDiagnostics'
  ];
  requiredSurfaces.forEach((surface) => assert.ok(descriptorBySurface.has(surface), `${surface} descriptor missing`));
  assert.ok(descriptorBySurface.get('xtend.llm.toolMenu').ids.includes('tool-menu-button'));
  assert.ok(descriptorBySurface.get('xtend.llm.toolMenu').commands.includes('xtend.llm.selectTool'));
  assert.ok(descriptorBySurface.get('xtend.llm.toolMenu').classes.includes('xtend-llm-tool-menu-button'));
  assert.ok(descriptorBySurface.get('xtend.llm.toolMenu').classes.includes('xtend-llm-tool-menu-item'));
  assert.ok(descriptorBySurface.get('xtend.llm.toolMenu').primitives.includes('choice-menu'));
  assert.ok(descriptorBySurface.get('xtend.llm.conversationList').classes.includes('xtend-llm-conversation-row'));
  assert.ok(descriptorBySurface.get('xtend.llm.transcript').classes.includes('xtend-llm-message-body'));
  assert.ok(descriptorBySurface.get('xtend.llm.transcript').classes.includes('xtend-llm-message-actions'));
  assert.ok(descriptorBySurface.get('xtend.llm.transcript').commands.includes('xtend.llm.copyAssistantMessage'));
  assert.ok(descriptorBySurface.get('xtend.llm.transcript').commands.includes('xtend.llm.regenerateAssistantMessage'));
  assert.ok(descriptorBySurface.get('xtend.llm.settingsDialog').ids.includes('settings-save'));
  assert.ok(descriptorBySurface.get('xtend.llm.settingsDialog').ids.includes('runtime-diagnostics-refresh'));
  assert.ok(descriptorBySurface.get('xtend.llm.settingsDialog').tags.includes('x-tabs'));
  assert.ok(descriptorBySurface.get('xtend.llm.deleteConversationDialog').ids.includes('delete-conversation-confirm'));

  const dataSources = new Set(report.rmtApp.dataSources.map((source) => `${source.id}:${source.kind}:${source.adapter}`));
  [
    'xtend.llm.bootstrap:host:host',
    'xtend.llm.send:host:host',
    'xtend.llm.cancelGeneration:host:host',
    'xtend.llm.copyAssistantMessage:host:host',
    'xtend.llm.regenerateAssistantMessage:host:host',
    'xtend.llm.saveSettings:host:host',
    'xtend.llm.confirmDeleteConversation:host:host',
    'xtend.llm.selectSettingsTab:host:host',
    'xtend.llm.readRuntimeDiagnostics:host:host'
  ].forEach((entry) => assert.ok(dataSources.has(entry), `${entry} datasource missing`));
  assert.equal(Array.from(dataSources).some((entry) => entry.startsWith('xtend.llm.toggleToolMenu:')), false);
  assert.equal(Array.from(dataSources).some((entry) => entry.startsWith('xtend.llm.selectTool:')), false);
  assert.ok(report.rmtApp.declarationCounts.reducerRecipes >= 2, 'tool picker reducers should be framework-owned recipes');
});

await run('RMT source parses through Maraca plan command', () => {
  const result = spawnSync(process.execPath, [path.join(productRoot, 'scripts', 'rmt-plan.mjs')], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.ok, true);
  assert.equal(plan.profile, 'production');
  assert.equal(plan.orchestration.enabled, true);
  assert.equal(plan.kernel.enabled, true);
  assert.equal(plan.kernelBootMode, 'productSurface');
  assert.equal(plan.hydrationMode, 'prewarm');
  assert.equal(plan.enablePrewarmWorker, true);
  assert.equal(plan.kernel.productSurface?.status, 'selected');
  assert.equal(plan.kernel.prewarmWorker?.enabled, true);
  assert.equal(plan.templateArtifacts?.trusted, true);
  assert.equal(plan.kernelFeatureAdoption?.blockedCount, 0);
  assert.equal(plan.hydration.serverPrerender?.requested, true);
  assert.equal(plan.hydration.workerPrerender?.requested, true);
  const rmtSource = fs.readFileSync(path.join(productRoot, 'xtend-llm.rmt'), 'utf8');
  assert.equal(/validation\s+xtend\.llm\.promptReady/u.test(rmtSource), false);
  assert.equal(/field\s+xtend\.llm\.prompt\s+required/u.test(rmtSource), false);
});

await run('app server serves browser-safe Transformers.js vendor assets', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-llm-server-'));
  const server = createXtendLlmAppServer({
    userData: tmp,
    cacheRoot: path.join(tmp, 'model-cache')
  });
  const baseUrl = await server.listen(0);
  try {
    const shell = await fetch(baseUrl);
    assert.equal(shell.status, 200);
    assert.equal(shell.headers.get('cross-origin-embedder-policy'), 'require-corp');
    const shellHtml = await shell.text();
    assert.match(shellHtml, /wasm-unsafe-eval/u);
    assert.match(shellHtml, /data-maraca-ssr-shell="xtend-llm"/u);
    assert.match(shellHtml, /data-rmt-hydration-mode="server_prerender_hydrate"/u);
    assert.match(shellHtml, /xtend-llm-ssr-hydration/u);
    assert.match(shellHtml, /worker_prerender_hydrate|workerPrewarmTargets/u);
    assert.match(shellHtml, /settings-dialog,delete-conversation-dialog,code-bridge/u);

    const transformers = await fetch(new URL('/vendor/transformers/transformers.min.js', baseUrl));
    assert.equal(transformers.status, 200);
    assert.match(transformers.headers.get('content-type') || '', /text\/javascript/u);
    assert.equal(transformers.headers.get('cross-origin-opener-policy'), 'same-origin');
    assert.ok((await transformers.arrayBuffer()).byteLength > 1024);

    const ort = await fetch(new URL('/vendor/transformers/ort.bundle.min.mjs', baseUrl));
    assert.equal(ort.status, 200);
    assert.match(ort.headers.get('content-type') || '', /text\/javascript/u);
    assert.ok((await ort.arrayBuffer()).byteLength > 1024);

    const harness = await fetch(new URL('/llm-harness', baseUrl));
    assert.equal(harness.status, 200);
    assert.match(await harness.text(), /llm-terminal-harness\.mjs/u);

    const harnessScript = await fetch(new URL('/tests/llm-terminal-harness.mjs', baseUrl));
    assert.equal(harnessScript.status, 200);
    assert.match(await harnessScript.text(), /__xtendLlmTerminalRun/u);
  } finally {
    await server.close();
  }
});
