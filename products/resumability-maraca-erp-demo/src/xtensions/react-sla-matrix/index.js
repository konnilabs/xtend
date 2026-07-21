import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

function formatValue(cell) {
  if (!cell) return '';
  if (cell.metric === 'sla') return `${cell.value}%`;
  if (cell.metric === 'latency') return `${cell.value} ms`;
  return String(cell.value);
}

export function SlaMatrix({ props, emitSelection }) {
  const loadLab = props.loadLab || { kpiMatrix: [] };
  const cells = loadLab.kpiMatrix || [];
  const warnings = cells.filter((cell) => cell.tone === 'warn').length;
  return React.createElement(
    'div',
    {
      className: 'react-sla-matrix',
      'data-react-sla-seed': props.seed
    },
    React.createElement(
      'div',
      { className: 'react-sla-toolbar' },
      React.createElement('span', null, `${props.company} / ${props.fiscalPeriod}`),
      React.createElement('b', null, `${warnings} Warnungen`)
    ),
    React.createElement(
      'div',
      { className: 'react-sla-grid' },
      cells.map((cell) => React.createElement(
        'div',
        {
          key: cell.id,
          className: `erp-sla-cell ${cell.tone === 'warn' ? 'is-warn' : 'is-ok'}${cell.id === props.selectedKpiId ? ' is-selected' : ''}`,
          'data-xtend-command': 'erp.shell.inspectSlaCell',
          'data-kpi-id': cell.id,
          tabIndex: 0,
          onClick: () => emitSelection(cell)
        },
        React.createElement('span', null, cell.processName),
        React.createElement('b', null, cell.metric),
        React.createElement('strong', null, formatValue(cell))
      ))
    )
  );
}

export function createReactSlaMatrix(options = {}) {
  let root = null;
  let container = null;
  let currentProps = {};
  const lifecycle = [];

  function push(operation, status, metadata = {}) {
    const entry = {
      schema: 'xtend.local.react-sla-matrix.lifecycle.v1',
      framework: 'react',
      surfaceId: options.surfaceId || 'react-sla-matrix',
      operation,
      status,
      metadata,
      timestamp: new Date().toISOString()
    };
    lifecycle.push(entry);
    if (typeof options.emit === 'function') {
      options.emit(`erp.react.sla.${operation}`, entry);
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

  function render() {
    if (!root) return;
    root.render(React.createElement(SlaMatrix, {
      props: currentProps,
      emitSelection(cell) {
        if (typeof options.emit === 'function') {
          options.emit('erp.react.sla.selected', {
            schema: 'xtend.local.react-sla-matrix.selection.v1',
            seed: currentProps.seed || '',
            kpiId: cell.id,
            processId: cell.processId,
            metric: cell.metric
          });
        }
      }
    }));
  }

  return {
    schema: 'xtend.xtensions.host-controller.v1',
    mount(target, initialProps = {}, mountOptions = {}) {
      container = target;
      currentProps = initialProps;
      root = createRoot(container);
      container.dataset.xtensionStatus = 'mounted';
      container.dataset.xtensionFramework = 'react';
      render();
      return push('mount', 'mounted', mountOptions);
    },
    adopt(target, initialProps = {}, resumeContext = {}) {
      container = target;
      currentProps = initialProps;
      root = hydrateRoot(container, React.createElement(SlaMatrix, {
        props: currentProps,
        emitSelection(entry) {
          if (typeof options.emit === 'function') options.emit('erp.react.sla.selected', { id: entry.id, seed: currentProps.seed || '' });
        }
      }));
      container.dataset.xtensionStatus = 'resumed';
      container.dataset.xtensionFramework = 'react';
      return { ...push('adopt', 'resumed', resumeContext), status: 'dom_hydrated', nodeIdentityPreserved: true, generation: resumeContext.generation || null };
    },
    update(signal = {}) {
      currentProps = signal.props || signal || currentProps;
      render();
      return push('update', 'ok', { seed: currentProps.seed || '' });
    },
    suspend(reason = 'host-policy') {
      if (container) container.dataset.xtensionSuspended = 'true';
      return push('suspend', 'ok', { reason });
    },
    resume(reason = 'host-policy') {
      if (container) container.dataset.xtensionSuspended = 'false';
      render();
      return push('resume', 'resumed', { reason });
    },
    reportError(error, metadata = {}) {
      return push('reportError', 'degraded', {
        ...metadata,
        message: error && error.message ? error.message : String(error)
      });
    },
    unmount(reason = 'host-dispose') {
      if (root) root.unmount();
      root = null;
      if (container) container.dataset.xtensionStatus = 'unmounted';
      return push('unmount', 'ok', { reason });
    },
    snapshot() {
      const cells = currentProps.loadLab && currentProps.loadLab.kpiMatrix || [];
      return {
        schema: 'xtend.local.react-sla-matrix.snapshot.v1',
        seed: currentProps.seed || '',
        selectedKpiId: currentProps.selectedKpiId || '',
        cellCount: cells.length,
        warningCount: cells.filter((cell) => cell.tone === 'warn').length,
        lifecycle: lifecycle.slice()
      };
    },
    getLifecycleRecords() {
      return lifecycle.slice();
    }
  };
}
