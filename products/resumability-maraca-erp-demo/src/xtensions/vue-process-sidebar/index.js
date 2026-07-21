import { createApp, createSSRApp, h, reactive } from 'vue';

export function ProcessSidebar(state) {
  return {
    name: 'VueProcessSidebar',
    setup() {
      return () => {
        const props = state.props || {};
        const processes = props.processes || [];
        return h('div', {
          class: 'vue-process-sidebar',
          'data-vue-process-seed': props.seed || ''
        }, [
          h('div', { class: 'vue-process-meta' }, [
            h('span', null, `Systemlast ${props.systemLoad || 0}%`),
            h('b', null, `${props.processLatencyMs || 0} ms`)
          ]),
          ...processes.map((process) => h('button', {
            key: process.id,
            type: 'button',
            class: {
              'vue-process-row': true,
              'is-active': process.id === props.activeProcessId
            },
            'data-xtend-command': 'erp.shell.selectProcess',
            'data-process-id': process.id,
            onClick() {
              if (typeof state.emit === 'function') {
                state.emit('erp.vue.process.selected', {
                  schema: 'xtend.local.vue-process-sidebar.selection.v1',
                  seed: props.seed || '',
                  processId: process.id
                });
              }
            }
          }, [
            h('span', null, process.name),
            h('span', null, process.locked ? 'LOCK' : 'OPEN'),
            h('b', null, String(process.queue))
          ]))
        ]);
      };
    }
  };
}

export function createVueProcessSidebar(options = {}) {
  let app = null;
  let container = null;
  const state = reactive({ props: {}, emit: null });
  const lifecycle = [];

  function push(operation, status, metadata = {}) {
    const entry = {
      schema: 'xtend.local.vue-process-sidebar.lifecycle.v1',
      framework: 'vue',
      surfaceId: options.surfaceId || 'vue-process-sidebar',
      operation,
      status,
      metadata,
      timestamp: new Date().toISOString()
    };
    lifecycle.push(entry);
    if (typeof options.emit === 'function') {
      options.emit(`erp.vue.process.${operation}`, entry);
    }
    return {
      schema: 'xtend.xtensions.host-controller-result.v1',
      operation,
      ok: status === 'mounted' || status === 'ok' || status === 'resumed',
      status,
      hostId: options.hostId || null,
      surfaceId: options.surfaceId || null,
      timestamp: entry.timestamp,
      lifecycleRecord: entry,
      cleanupRecords: [],
      diagnostics: [],
      metadata
    };
  }

  return {
    schema: 'xtend.xtensions.host-controller.v1',
    mount(target, initialProps = {}, mountOptions = {}) {
      container = target;
      state.props = initialProps;
      state.emit = options.emit || null;
      app = createApp(ProcessSidebar(state));
      container.innerHTML = '';
      app.mount(container);
      container.dataset.xtensionStatus = 'mounted';
      container.dataset.xtensionFramework = 'vue';
      return push('mount', 'mounted', mountOptions);
    },
    adopt(target, initialProps = {}, resumeContext = {}) {
      container = target;
      state.props = initialProps;
      state.emit = options.emit || null;
      app = createSSRApp(ProcessSidebar(state));
      app.mount(container);
      container.dataset.xtensionStatus = 'resumed';
      container.dataset.xtensionFramework = 'vue';
      return { ...push('adopt', 'resumed', resumeContext), status: 'dom_hydrated', nodeIdentityPreserved: true, generation: resumeContext.generation || null };
    },
    update(signal = {}) {
      state.props = signal.props || signal || state.props;
      return push('update', 'ok', { seed: state.props.seed || '' });
    },
    suspend(reason = 'host-policy') {
      if (container) container.dataset.xtensionSuspended = 'true';
      return push('suspend', 'ok', { reason });
    },
    resume(reason = 'host-policy') {
      if (container) container.dataset.xtensionSuspended = 'false';
      return push('resume', 'resumed', { reason });
    },
    reportError(error, metadata = {}) {
      return push('reportError', 'degraded', {
        ...metadata,
        message: error && error.message ? error.message : String(error)
      });
    },
    unmount(reason = 'host-dispose') {
      if (app) app.unmount();
      app = null;
      if (container) container.dataset.xtensionStatus = 'unmounted';
      return push('unmount', 'ok', { reason });
    },
    snapshot() {
      return {
        schema: 'xtend.local.vue-process-sidebar.snapshot.v1',
        props: state.props,
        lifecycle: lifecycle.slice()
      };
    },
    getLifecycleRecords() {
      return lifecycle.slice();
    }
  };
}
