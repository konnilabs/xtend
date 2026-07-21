import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

function money(value, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function LedgerPanel({ props, emitSelection }) {
  const ledger = props.ledger || { items: [] };
  return React.createElement(
    'div',
    {
      className: 'react-ledger-panel',
      'data-react-ledger-seed': props.seed
    },
    React.createElement(
      'div',
      { className: 'react-ledger-toolbar' },
      React.createElement('span', null, `${props.company} / ${props.fiscalPeriod}`),
      React.createElement('b', null, `${ledger.openItems || 0} offene Posten`)
    ),
    React.createElement(
      'table',
      null,
      React.createElement(
        'thead',
        null,
        React.createElement(
          'tr',
          null,
          React.createElement('th', null, 'Beleg'),
          React.createElement('th', null, 'Konto'),
          React.createElement('th', null, 'Kostenst.'),
          React.createElement('th', { className: 'num' }, 'Soll'),
          React.createElement('th', { className: 'num' }, 'Haben'),
          React.createElement('th', { className: 'num' }, 'Diff.')
        )
      ),
      React.createElement(
        'tbody',
        null,
        (ledger.items || []).map((item) => React.createElement(
          'tr',
          {
            key: item.id,
            className: item.id === props.selectedLedgerItemId ? 'is-selected' : '',
            'data-xtend-command': 'erp.shell.selectLedgerItem',
            'data-ledger-id': item.id,
            tabIndex: 0,
            onClick: () => emitSelection(item)
          },
          React.createElement('td', null, item.id),
          React.createElement('td', null, item.account),
          React.createElement('td', null, item.costCenter),
          React.createElement('td', { className: 'num' }, money(item.debit, props.currency)),
          React.createElement('td', { className: 'num' }, money(item.credit, props.currency)),
          React.createElement('td', { className: `num ${item.variance >= 0 ? 'warn' : 'ok'}` }, money(item.variance, props.currency))
        ))
      )
    )
  );
}

export function createReactLedgerPanel(options = {}) {
  let root = null;
  let container = null;
  let currentProps = {};
  const lifecycle = [];

  function push(operation, status, metadata = {}) {
    const entry = {
      schema: 'xtend.local.react-ledger-panel.lifecycle.v1',
      framework: 'react',
      surfaceId: options.surfaceId || 'react-ledger-panel',
      operation,
      status,
      metadata,
      timestamp: new Date().toISOString()
    };
    lifecycle.push(entry);
    if (typeof options.emit === 'function') {
      options.emit(`erp.react.ledger.${operation}`, entry);
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
    root.render(React.createElement(LedgerPanel, {
      props: currentProps,
      emitSelection(item) {
        if (typeof options.emit === 'function') {
          options.emit('erp.react.ledger.selected', {
            schema: 'xtend.local.react-ledger-panel.selection.v1',
            seed: currentProps.seed || '',
            ledgerId: item.id,
            account: item.account
          });
        }
      }
    }));
  }

  function view() {
    return React.createElement(LedgerPanel, {
      props: currentProps,
      emitSelection(item) {
        if (typeof options.emit === 'function') {
          options.emit('erp.react.ledger.selected', {
            schema: 'xtend.local.react-ledger-panel.selection.v1',
            seed: currentProps.seed || '',
            ledgerId: item.id,
            account: item.account
          });
        }
      }
    });
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
      root = hydrateRoot(container, view());
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
      return {
        schema: 'xtend.local.react-ledger-panel.snapshot.v1',
        props: currentProps,
        selectedLedgerItemId: currentProps.selectedLedgerItemId || '',
        lifecycle: lifecycle.slice()
      };
    },
    getLifecycleRecords() {
      return lifecycle.slice();
    }
  };
}
