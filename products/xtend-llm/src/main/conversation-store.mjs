import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_CONTEXT_CHAR_BUDGET,
  DEFAULT_SYSTEM_PROMPT
} from './constants.mjs';
import {
  createId,
  sanitizeText
} from './ipc-contract.mjs';
import { stripThinkMarkup } from '../llm/thinking-markup.mjs';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function titleFromText(text) {
  const compact = String(text || '').replace(/\s+/gu, ' ').trim();
  return compact.slice(0, 54) || 'New chat';
}

export class ConversationStore {
  constructor(options = {}) {
    this.filePath = options.filePath;
    this.now = typeof options.now === 'function' ? options.now : () => new Date().toISOString();
    this.systemPrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    this.customInstructions = sanitizeText(options.customInstructions || '', {
      label: 'custom instructions',
      maxLength: 8000,
      required: false
    });
    this.contextCharBudget = options.contextCharBudget || DEFAULT_CONTEXT_CHAR_BUDGET;
    this.state = {
      schema: 'xtend-llm.conversations.v1',
      activeConversationId: '',
      conversations: []
    };
  }

  load() {
    if (!this.filePath || !fs.existsSync(this.filePath)) return this.snapshot();
    const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    if (parsed && parsed.schema === 'xtend-llm.conversations.v1' && Array.isArray(parsed.conversations)) {
      this.state = parsed;
    }
    return this.snapshot();
  }

  save() {
    if (!this.filePath) return;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, `${JSON.stringify(this.state, null, 2)}\n`);
  }

  snapshot() {
    return clone(this.state);
  }

  listConversations() {
    return this.state.conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      messageCount: conversation.messages.length
    }));
  }

  get activeConversation() {
    return this.getConversation(this.state.activeConversationId);
  }

  getConversation(id) {
    return this.state.conversations.find((conversation) => conversation.id === id) || null;
  }

  createConversationRecord(title = 'New chat') {
    const at = this.now();
    const conversation = {
      id: createId('conversation'),
      title,
      createdAt: at,
      updatedAt: at,
      messages: []
    };
    this.state.conversations.unshift(conversation);
    this.state.activeConversationId = conversation.id;
    return conversation;
  }

  createConversation(title = 'New chat') {
    const conversation = this.createConversationRecord(title);
    this.save();
    return clone(conversation);
  }

  ensureConversation(id = '') {
    if (id) {
      const existing = this.getConversation(id);
      if (existing) return existing;
    }
    return this.createConversationRecord();
  }

  selectConversation(id) {
    const conversation = this.getConversation(id);
    if (!conversation) throw new Error('Conversation not found.');
    this.state.activeConversationId = id;
    this.save();
    return clone(conversation);
  }

  deleteConversation(id) {
    const index = this.state.conversations.findIndex((conversation) => conversation.id === id);
    if (index === -1) throw new Error('Conversation not found.');
    const [deleted] = this.state.conversations.splice(index, 1);
    if (this.state.activeConversationId === id) {
      const next = this.state.conversations[Math.min(index, this.state.conversations.length - 1)] || this.state.conversations[0] || null;
      this.state.activeConversationId = next ? next.id : '';
    }
    this.save();
    return {
      deleted: clone(deleted),
      activeConversation: this.activeConversation ? clone(this.activeConversation) : null,
      snapshot: this.snapshot()
    };
  }

  reset() {
    this.state = {
      schema: 'xtend-llm.conversations.v1',
      activeConversationId: '',
      conversations: []
    };
    this.save();
    return this.snapshot();
  }

  setCustomInstructions(value = '') {
    this.customInstructions = sanitizeText(value, {
      label: 'custom instructions',
      maxLength: 8000,
      required: false
    });
  }

  buildSystemPrompt() {
    if (!this.customInstructions) return this.systemPrompt;
    return [
      this.systemPrompt,
      '',
      'Additional user instructions:',
      this.customInstructions
    ].join('\n');
  }

  addUserMessage(conversationId, text) {
    const conversation = this.ensureConversation(conversationId);
    const content = sanitizeText(text, { label: 'message text', maxLength: 16000 });
    const at = this.now();
    const message = {
      id: createId('message'),
      role: 'user',
      content,
      createdAt: at
    };
    conversation.messages.push(message);
    if (!conversation.title || conversation.title === 'New chat') conversation.title = titleFromText(content);
    conversation.updatedAt = at;
    this.state.activeConversationId = conversation.id;
    this.save();
    return { conversation: clone(conversation), message: clone(message) };
  }

  startAssistantMessage(conversationId, jobId) {
    const conversation = this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found.');
    const at = this.now();
    const message = {
      id: createId('message'),
      jobId,
      role: 'assistant',
      content: '',
      status: 'streaming',
      createdAt: at,
      updatedAt: at
    };
    conversation.messages.push(message);
    conversation.updatedAt = at;
    this.save();
    return { conversation: clone(conversation), message: clone(message) };
  }

  appendAssistantDelta(conversationId, jobId, delta) {
    const message = this.findAssistantJob(conversationId, jobId);
    message.content = stripThinkMarkup(`${message.content}${String(delta || '')}`, { streaming: true });
    message.updatedAt = this.now();
    const conversation = this.getConversation(conversationId);
    conversation.updatedAt = message.updatedAt;
    this.save();
    return { conversation: clone(conversation), message: clone(message) };
  }

  completeAssistantMessage(conversationId, jobId, text = '', finishReason = 'stop') {
    const message = this.findAssistantJob(conversationId, jobId);
    if (text) message.content = stripThinkMarkup(text);
    else message.content = stripThinkMarkup(message.content);
    message.status = finishReason === 'canceled' ? 'canceled' : 'complete';
    message.finishReason = finishReason;
    message.updatedAt = this.now();
    const conversation = this.getConversation(conversationId);
    conversation.updatedAt = message.updatedAt;
    this.save();
    return { conversation: clone(conversation), message: clone(message) };
  }

  attachAssistantSources(conversationId, jobId, sources = []) {
    const message = this.findAssistantJob(conversationId, jobId);
    message.sources = Array.isArray(sources) ? clone(sources) : [];
    message.updatedAt = this.now();
    const conversation = this.getConversation(conversationId);
    conversation.updatedAt = message.updatedAt;
    this.save();
    return { conversation: clone(conversation), message: clone(message) };
  }

  failAssistantMessage(conversationId, jobId, error) {
    const message = jobId && conversationId ? this.findAssistantJob(conversationId, jobId) : null;
    const conversation = conversationId ? this.getConversation(conversationId) : null;
    if (message) {
      message.status = 'error';
      message.error = String(error || 'Generation failed.');
      message.updatedAt = this.now();
    }
    if (conversation) conversation.updatedAt = this.now();
    this.save();
    return { conversation: conversation ? clone(conversation) : null, message: message ? clone(message) : null };
  }

  findMessage(conversationId, messageId) {
    const conversation = this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found.');
    const index = conversation.messages.findIndex((entry) => entry.id === messageId);
    if (index === -1) throw new Error('Message not found.');
    return { conversation, message: conversation.messages[index], index };
  }

  findAssistantJob(conversationId, jobId) {
    const conversation = this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found.');
    const message = conversation.messages.find((entry) => entry.role === 'assistant' && entry.jobId === jobId);
    if (!message) throw new Error('Generation job not found.');
    return message;
  }

  regenerateAssistantMessage(conversationId, messageId, options = {}) {
    const { conversation, message, index } = this.findMessage(conversationId, messageId);
    if (message.role !== 'assistant') throw new Error('Only assistant messages can be regenerated.');
    if (message.status === 'streaming') throw new Error('Cannot regenerate a streaming assistant message.');
    const userMessage = conversation.messages
      .slice(0, index)
      .reverse()
      .find((entry) => entry.role === 'user' && String(entry.content || '').trim());
    if (!userMessage) throw new Error('Regeneration requires a preceding user message.');

    const at = this.now();
    const jobId = options.jobId || createId('generation');
    message.jobId = jobId;
    message.content = '';
    message.status = 'streaming';
    message.updatedAt = at;
    message.regeneratedAt = at;
    message.regeneratedFromMessageId = message.id;
    delete message.sources;
    delete message.error;
    delete message.finishReason;
    conversation.updatedAt = at;
    this.state.activeConversationId = conversation.id;
    const promptMessages = this.buildPromptMessages(conversation.id, { beforeMessageId: message.id });
    this.save();
    return {
      conversation: clone(conversation),
      message: clone(message),
      originalPrompt: userMessage.content,
      promptMessages
    };
  }

  buildPromptMessages(conversationId, options = {}) {
    const conversation = this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found.');
    const budget = options.contextCharBudget || this.contextCharBudget;
    const selected = [];
    let used = 0;
    const beforeMessageId = options.beforeMessageId ? String(options.beforeMessageId) : '';
    const upperBound = beforeMessageId
      ? conversation.messages.findIndex((message) => message.id === beforeMessageId)
      : -1;
    if (beforeMessageId && upperBound === -1) throw new Error('Prompt boundary message not found.');
    const sourceMessages = upperBound >= 0 ? conversation.messages.slice(0, upperBound) : conversation.messages;
    const eligible = sourceMessages.filter((message) => message.role === 'user' || message.role === 'assistant');
    for (let index = eligible.length - 1; index >= 0; index -= 1) {
      const message = eligible[index];
      if (message.status === 'streaming' || message.status === 'error') continue;
      const content = String(message.content || '');
      if (!content) continue;
      if (used + content.length > budget && selected.length > 0) break;
      selected.unshift({ role: message.role, content });
      used += content.length;
    }
    if (selected.length && selected[selected.length - 1].role === 'user' && !selected[selected.length - 1].content.includes('/no_think')) {
      selected[selected.length - 1] = {
        ...selected[selected.length - 1],
        content: `${selected[selected.length - 1].content}\n/no_think`
      };
    }
    return [
      { role: 'system', content: this.buildSystemPrompt() },
      ...selected
    ];
  }
}

export default ConversationStore;
