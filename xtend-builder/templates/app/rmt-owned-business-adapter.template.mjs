export function createBusinessAdapters({ model, tools, sources } = {}) {
  return {
    async invoke({ service, payload }) {
      if (service.id === 'app.chat.status') {
        return { ready: true, model: model && model.name || 'local' };
      }
      if (service.id === 'app.chat.tool') {
        return tools && typeof tools.run === 'function' ? tools.run(payload) : { result: null };
      }
      if (service.id === 'app.chat.sources') {
        return sources && typeof sources.search === 'function' ? sources.search(payload) : { sources: [] };
      }
      return { ok: true };
    },
    async stream({ service, payload }, handlers = {}) {
      if (service.id !== 'app.chat.generate') throw new Error(`Unknown stream service ${service.id}`);
      const id = payload.runId || `app-chat-stream:${Date.now()}`;
      handlers.onStart?.({ runId: id });
      handlers.onDelta?.('Hello from the business adapter.');
      handlers.onComplete?.({ runId: id });
      return {
        id,
        cancel(reason = 'cancelled') {
          handlers.onCancel?.({ runId: id, reason });
        }
      };
    }
  };
}
