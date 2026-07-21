import { createApp, createSSRApp, h, reactive } from 'vue';

export function ExceptionQueue(state) {
  return {
    name: 'VueExceptionQueue',
    setup() {
      return () => {
        const props = state.props || {};
        const queue = props.exceptionQueue || [];
        const lanes = props.schedulerLanes || [];
        const activeFibers = lanes.reduce((total, lane) => total + Number(lane.activeFibers || 0), 0);
        return h('div', {
          class: 'vue-exception-queue',
          'data-vue-exception-seed': props.seed || ''
        }, [
          h('div', { class: 'vue-exception-meta' }, [
            h('span', null, `${queue.length} Meldungen`),
            h('b', null, `${activeFibers} Fibers`)
          ]),
          h('ol', { class: 'erp-exception-list' }, queue.map((entry) => h('li', {
            key: entry.id,
            class: {
              'erp-exception-row': true,
              [`is-${entry.severity}`]: true,
              'is-selected': entry.id === props.selectedExceptionId
            },
            'data-xtend-command': 'erp.shell.inspectException',
            'data-exception-id': entry.id,
            tabindex: 0,
            onClick() {
              if (typeof state.emit === 'function') {
                state.emit('erp.vue.exception.selected', {
                  schema: 'xtend.local.vue-exception-queue.selection.v1',
                  seed: props.seed || '',
                  exceptionId: entry.id,
                  code: entry.code
                });
              }
            }
          }, [
            h('span', null, entry.code),
            h('b', null, entry.severity),
            h('small', null, `${entry.ageMinutes} min`),
            h('em', null, entry.owner)
          ])))
        ]);
      };
    }
  };
}

export function createVueExceptionQueue(options = {}) {
  let app = null;
  let container = null;
  const state = reactive({ props: {}, emit: null });
  const lifecycle = [];

  function push(operation, status, metadata = {}) {
    const entry = {
      schema: 'xtend.local.vue-exception-queue.lifecycle.v1',
      framework: 'vue',
      surfaceId: options.surfaceId || 'vue-exception-queue',
      operation,
      status,
      metadata,
      timestamp: new Date().toISOString()
    };
    lifecycle.push(entry);
    if (typeof options.emit === 'function') {
      options.emit(`erp.vue.exception.${operation}`, entry);
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
      app = createApp(ExceptionQueue(state));
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
      app = createSSRApp(ExceptionQueue(state));
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
        schema: 'xtend.local.vue-exception-queue.snapshot.v1',
        seed: state.props.seed || '',
        selectedExceptionId: state.props.selectedExceptionId || '',
        exceptionCount: (state.props.exceptionQueue || []).length,
        lifecycle: lifecycle.slice()
      };
    },
    getLifecycleRecords() {
      return lifecycle.slice();
    }
  };
}
