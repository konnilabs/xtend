import {
  afterPaint,
  createApp,
  createStore,
  disposeXTend,
  loadComponent,
  readyXTend,
  getXTendSnapshot,
  render,
  schedule
} from '@ccslabs/xtend';

await readyXTend();

const root = document.querySelector('#app');
const componentRegion = document.querySelector('#component-region');
const runtimeBadge = document.querySelector('#runtime-badge');

const app = createApp({ initialState: { demo: 'ready' } });
const store = createStore({
  states: [{ id: 'state.count', type: 'number', initial: 0 }]
});

function descriptor(count) {
  return {
    type: 'element',
    tag: 'div',
    attributes: { class: 'counter-panel', 'data-demo-state': 'rendered' },
    children: [
      {
        type: 'element',
        tag: 'div',
        attributes: { class: 'metric' },
        children: [
          { type: 'element', tag: 'span', attributes: { class: 'metric-label' }, children: [{ type: 'text', text: 'Scheduled renders' }] },
          { type: 'element', tag: 'strong', attributes: { class: 'metric-value' }, children: [{ type: 'text', text: String(count) }] }
        ]
      },
      {
        type: 'element',
        tag: 'p',
        attributes: { class: 'runtime-copy' },
        children: [{ type: 'text', text: `App ${app.schema} and store ${store.schema} are active.` }]
      },
      {
        type: 'element',
        tag: 'div',
        attributes: { class: 'actions' },
        children: [
          { type: 'element', tag: 'button', attributes: { type: 'button', id: 'increment' }, children: [{ type: 'text', text: 'Schedule +1' }] },
          { type: 'element', tag: 'button', attributes: { type: 'button', id: 'load-component', class: 'secondary' }, children: [{ type: 'text', text: 'Lazy-load x-status' }] }
        ]
      }
    ]
  };
}

function bindActions() {
  root.querySelector('#increment').addEventListener('click', () => {
    schedule(() => {
      const nextCount = store.getState('state.count') + 1;
      store.setState('state.count', nextCount, { source: 'esm-demo' });
      paint();
    }, {
      endpointName: 'demo.counter.increment',
      scope: 'demo.counter',
      timeout: 250
    });
  });

  root.querySelector('#load-component').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Loading…';
    try {
      await loadComponent('x-status', {
        source: 'demos.esm-app',
        manifest: { 'x-status': '/components/xstatus.js' }
      });
      const status = document.createElement('x-status');
      status.setAttribute('type', 'success');
      status.setAttribute('message', 'x-status was loaded through the ESM Registry.');
      componentRegion.replaceChildren(status);
      button.textContent = 'x-status loaded';
    } catch (error) {
      componentRegion.textContent = `Component load failed: ${error.message}`;
      button.disabled = false;
      button.textContent = 'Retry x-status';
    }
  });
}

function paint() {
  render(root, descriptor(store.getState('state.count')));
  bindActions();
}

schedule(paint, {
  endpointName: 'demo.initial-render',
  scope: 'demo.bootstrap',
  timeout: 1
});

afterPaint(() => {
  const kernel = getXTendSnapshot();
  runtimeBadge.textContent = `kernel ${kernel.status}`;
  runtimeBadge.classList.add('ready');
});

window.addEventListener('pagehide', () => disposeXTend(), { once: true });
