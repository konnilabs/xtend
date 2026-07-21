const OPENUI5_BOOTSTRAP_ID = 'sap-ui-bootstrap';
const OPENUI5_AUTOCONFIG_ID = 'xtend-openui5-autoconfig';
const OPENUI5_RESOURCE_ROOT = '/dist/xtensions/openui5/resources/';
const OPENUI5_BOOTSTRAP_SRC = `${OPENUI5_RESOURCE_ROOT}ui5loader.js`;
const OPENUI5_AUTOCONFIG_SRC = `${OPENUI5_RESOURCE_ROOT}ui5loader-autoconfig.js`;

let openUi5Promise = null;

function safeText(value) {
  return String(value ?? '');
}

function formatAmount(value, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function normalizeOrders(props = {}) {
  return (props.orders || []).map((order) => ({
    ...order,
    amountText: formatAmount(order.amount, order.currency || props.currency || 'EUR'),
    selected: order.id === props.selectedOrderId
  }));
}

function configureOpenUi5Bootstrap(script) {
  script.dataset.sapUiTheme = 'sap_horizon';
  script.dataset.sapUiLibs = 'sap.m';
  script.dataset.sapUiAsync = 'true';
  script.dataset.sapUiPreload = 'off';
  script.dataset.sapUiVersionedLibCss = 'false';
  script.dataset.sapUiCompatVersion = 'edge';
  script.dataset.sapUiResourceRoots = JSON.stringify({
    'xtend.erp.demo.openui5': '/dist/xtensions/openui5-procurement-worklist/'
  });
}

function configureOpenUi5GlobalConfig() {
  const current = window['sap-ui-config'];
  const config = current && typeof current === 'object' ? current : {};
  window['sap-ui-config'] = {
    ...config,
    theme: 'sap_horizon',
    libs: 'sap.m',
    async: true,
    preload: 'off',
    versionedLibCss: false,
    compatVersion: 'edge',
    resourceRoots: {
      ...(config.resourceRoots || {}),
      'xtend.erp.demo.openui5': '/dist/xtensions/openui5-procurement-worklist/'
    }
  };
}

function configureOpenUi5Loader(sap) {
  if (!sap || !sap.ui || !sap.ui.loader || typeof sap.ui.loader.config !== 'function') return;
  sap.ui.loader.config({
    async: true,
    baseUrl: OPENUI5_RESOURCE_ROOT,
    paths: {
      'xtend/erp/demo/openui5': '/dist/xtensions/openui5-procurement-worklist/'
    }
  });
}

function loadScriptOnce(id, src, configure) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      if (existing.dataset.xtendLoaded === 'true') {
        resolve(existing);
        return;
      }
      existing.addEventListener('load', () => resolve(existing), { once: true });
      existing.addEventListener('error', () => reject(new Error(`OpenUI5 script failed: ${src}`)), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    if (typeof configure === 'function') configure(script);
    script.addEventListener('load', () => {
      script.dataset.xtendLoaded = 'true';
      resolve(script);
    }, { once: true });
    script.addEventListener('error', () => reject(new Error(`OpenUI5 script failed: ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

function waitForOpenUi5Require(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const tick = () => {
      const sap = window.sap;
      if (sap && sap.ui && typeof sap.ui.require === 'function') {
        configureOpenUi5Loader(sap);
        resolve(sap);
        return;
      }
      if (performance.now() - started > timeoutMs) {
        reject(new Error('OpenUI5 loader did not initialize.'));
        return;
      }
      window.setTimeout(tick, 20);
    };
    tick();
  });
}

function waitForOpenUi5Ready() {
  return waitForOpenUi5Require().then((sap) => new Promise((resolve, reject) => {
    sap.ui.require(['sap/ui/core/Core'], (core) => {
      if (core && typeof core.boot === 'function') {
        core.boot();
      }
      if (core && typeof core.isInitialized === 'function' && core.isInitialized()) {
        resolve(sap);
        return;
      }
      if (core && typeof core.attachInit === 'function') {
        core.attachInit(() => resolve(sap));
        return;
      }
      if (core && typeof core.ready === 'function') {
        Promise.resolve(core.ready()).then(() => resolve(sap), reject);
        return;
      }
      resolve(sap);
    }, reject);
  }));
}

function loadOpenUi5() {
  if (window.sap && window.sap.ui && typeof window.sap.ui.require === 'function') {
    return waitForOpenUi5Ready();
  }
  if (openUi5Promise) return openUi5Promise;
  openUi5Promise = new Promise((resolve, reject) => {
    configureOpenUi5GlobalConfig();
    loadScriptOnce(OPENUI5_BOOTSTRAP_ID, OPENUI5_BOOTSTRAP_SRC, configureOpenUi5Bootstrap)
      .then(() => {
        configureOpenUi5Loader(window.sap);
        return loadScriptOnce(OPENUI5_AUTOCONFIG_ID, OPENUI5_AUTOCONFIG_SRC);
      })
      .then(() => waitForOpenUi5Ready())
      .then(resolve, reject);
  });
  return openUi5Promise;
}

function requireOpenUi5Modules(names) {
  return loadOpenUi5().then((sap) => new Promise((resolve, reject) => {
    sap.ui.require(names, (...modules) => resolve(modules), reject);
  }));
}

function createShellIntentEvent(detail) {
  return new CustomEvent('xtend-command', {
    bubbles: true,
    composed: true,
    detail
  });
}

function resultFor(operation, status, options = {}, metadata = {}, cleanupRecords = []) {
  const timestamp = new Date().toISOString();
  return {
    schema: 'xtend.xtensions.host-controller-result.v1',
    operation,
    ok: status === 'mounted' || status === 'ok' || status === 'resumed',
    status,
    hostId: options.hostId || null,
    surfaceId: options.surfaceId || null,
    timestamp,
    lifecycleRecord: {
      schema: 'xtend.local.openui5-procurement-worklist.lifecycle.v1',
      framework: 'openui5',
      surfaceId: options.surfaceId || 'openui5-procurement-worklist',
      operation,
      status,
      metadata,
      timestamp
    },
    cleanupRecords,
    diagnostics: [],
    metadata
  };
}

export function createOpenUi5ProcurementWorklist(options = {}) {
  let container = null;
  let model = null;
  let table = null;
  let toolbar = null;
  let vbox = null;
  let currentProps = {};
  let modelUpdates = 0;
  const lifecycle = [];

  function push(operation, status, metadata = {}, cleanupRecords = []) {
    const result = resultFor(operation, status, options, metadata, cleanupRecords);
    lifecycle.push(result.lifecycleRecord);
    if (typeof options.emit === 'function') {
      options.emit(`erp.openui5.procurement.${operation}`, result.lifecycleRecord);
    }
    return result;
  }

  function modelData(props = currentProps) {
    const orders = normalizeOrders(props);
    return {
      seed: safeText(props.seed),
      company: safeText(props.company),
      fiscalPeriod: safeText(props.fiscalPeriod),
      selectedOrderId: safeText(props.selectedOrderId),
      orderCount: orders.length,
      orders
    };
  }

  function emitSelection(order) {
    if (!order) return;
    if (typeof options.emit === 'function') {
      options.emit('erp.openui5.procurement.selected', {
        schema: 'xtend.local.openui5-procurement.selection.v1',
        seed: currentProps.seed || '',
        orderId: order.id,
        supplier: order.supplier,
        status: order.status
      });
    }
    if (container) {
      container.dispatchEvent(createShellIntentEvent({
        schema: 'xtend.local.openui5-procurement.intent.v1',
        command: 'erp.shell.inspectOpenUi5Order',
        sourceId: 'openui5-procurement-worklist',
        orderId: order.id,
        seed: currentProps.seed || ''
      }));
    }
  }

  async function buildControls() {
    const [
      JSONModel,
      VBox,
      Toolbar,
      Title,
      ToolbarSpacer,
      Button,
      Table,
      Column,
      ColumnListItem,
      Text,
      ObjectStatus
    ] = await requireOpenUi5Modules([
      'sap/ui/model/json/JSONModel',
      'sap/m/VBox',
      'sap/m/Toolbar',
      'sap/m/Title',
      'sap/m/ToolbarSpacer',
      'sap/m/Button',
      'sap/m/Table',
      'sap/m/Column',
      'sap/m/ColumnListItem',
      'sap/m/Text',
      'sap/m/ObjectStatus'
    ]);

    model = new JSONModel(modelData());
    toolbar = new Toolbar({
      content: [
        new Title({ text: '{/company} / {/fiscalPeriod}' }),
        new ToolbarSpacer(),
        new ObjectStatus({ text: '{/orderCount} Bestellungen', state: 'Information' }),
        new Button({
          text: 'Erste Freigabe',
          press: () => emitSelection((model.getProperty('/orders') || [])[0])
        })
      ]
    });
    table = new Table({
      mode: 'SingleSelectMaster',
      includeItemInSelection: true,
      growing: false,
      columns: [
        new Column({ header: new Text({ text: 'Bestellung' }) }),
        new Column({ header: new Text({ text: 'Lieferant' }) }),
        new Column({ header: new Text({ text: 'Werk' }) }),
        new Column({ header: new Text({ text: 'Status' }) }),
        new Column({ hAlign: 'End', header: new Text({ text: 'Wert' }) })
      ],
      items: {
        path: '/orders',
        template: new ColumnListItem({
          type: 'Active',
          selected: '{selected}',
          press(event) {
            const context = event.getSource().getBindingContext();
            emitSelection(context && context.getObject());
          },
          cells: [
            new Text({ text: '{id}' }),
            new Text({ text: '{supplier}' }),
            new Text({ text: '{plant}' }),
            new ObjectStatus({ text: '{status}', state: '{tone}' }),
            new Text({ text: '{amountText}', textAlign: 'End' })
          ]
        })
      }
    });
    vbox = new VBox({
      width: '100%',
      renderType: 'Bare',
      items: [toolbar, table]
    });
    vbox.setModel(model);
    return vbox;
  }

  return {
    schema: 'xtend.xtensions.host-controller.v1',
    async mount(target, initialProps = {}, mountOptions = {}) {
      container = target;
      currentProps = initialProps;
      container.classList.add('sapUiSizeCompact');
      container.dataset.xtensionStatus = 'mounting';
      container.dataset.xtensionFramework = 'openui5';
      container.dataset.openui5Status = 'loading';
      const fallback = container.querySelector('.erp-openui5-fallback');
      if (fallback) {
        fallback.hidden = true;
        fallback.dataset.openui5Status = 'client-hidden';
      }
      const control = await buildControls();
      control.placeAt(container);
      container.dataset.xtensionStatus = 'mounted';
      container.dataset.openui5Status = 'mounted';
      container.dataset.openui5ModelUpdates = String(modelUpdates);
      return push('mount', 'mounted', {
        ...mountOptions,
        loader: OPENUI5_BOOTSTRAP_SRC,
        orderCount: (currentProps.orders || []).length
      });
    },
    async adopt(target, initialProps = {}, resumeContext = {}) {
      container = target;
      currentProps = initialProps;
      container.classList.add('sapUiSizeCompact');
      const control = await buildControls();
      let runtimeZone = container.querySelector('[data-openui5-runtime-zone]');
      if (!runtimeZone) {
        runtimeZone = document.createElement('div');
        runtimeZone.setAttribute('data-openui5-runtime-zone', 'true');
        container.appendChild(runtimeZone);
      }
      control.placeAt(runtimeZone);
      container.dataset.xtensionStatus = 'resumed';
      container.dataset.openui5Status = 'host-activated';
      return { ...push('adopt', 'resumed', resumeContext), status: 'host_activated', nodeIdentityPreserved: true, generation: resumeContext.generation || null };
    },
    update(signal = {}) {
      currentProps = signal.props || signal || currentProps;
      if (model) {
        model.setData(modelData());
        modelUpdates += 1;
      }
      if (container) {
        container.dataset.openui5Status = 'mounted';
        container.dataset.openui5ModelUpdates = String(modelUpdates);
      }
      return push('update', 'ok', {
        seed: currentProps.seed || '',
        reason: signal.reason || 'update',
        modelUpdates
      });
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
      if (container) container.dataset.xtensionStatus = 'degraded';
      return push('reportError', 'degraded', {
        ...metadata,
        message: error && error.message ? error.message : String(error)
      });
    },
    unmount(reason = 'host-dispose') {
      const cleanupRecords = [];
      if (vbox && typeof vbox.destroy === 'function') {
        vbox.destroy();
        cleanupRecords.push({ resource: 'openui5-control-tree', status: 'destroyed' });
      }
      model = null;
      table = null;
      toolbar = null;
      vbox = null;
      if (container) {
        container.dataset.xtensionStatus = 'unmounted';
        container.dataset.openui5Status = 'unmounted';
        container.innerHTML = '';
      }
      return push('unmount', 'ok', { reason }, cleanupRecords);
    },
    snapshot() {
      return {
        schema: 'xtend.local.openui5-procurement-worklist.snapshot.v1',
        seed: currentProps.seed || '',
        selectedOrderId: currentProps.selectedOrderId || '',
        orderCount: (currentProps.orders || []).length,
        modelUpdates,
        lifecycle: lifecycle.slice()
      };
    },
    getLifecycleRecords() {
      return lifecycle.slice();
    }
  };
}
