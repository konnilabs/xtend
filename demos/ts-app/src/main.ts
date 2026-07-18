import {
  afterPaint,
  createApp,
  createStore,
  disposeXTend,
  loadComponent,
  readyXTend,
  getXTendSnapshot,
  render,
  schedule,
  type XTendDescriptor
} from '@ccslabs/xtend';
import './styles.css';

await readyXTend();

interface DemoState {
  count: number;
  status: 'ready' | 'updating' | 'component-ready';
  componentLoaded: boolean;
}

function requiredElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Missing demo host: ${selector}`);
  return element;
}

const root = requiredElement('#app');
const componentRegion = requiredElement('#component-region');
const runtimeBadge = requiredElement('#runtime-badge');

const app = createApp<DemoState>({
  initialState: { count: 0, status: 'ready', componentLoaded: false }
});

const store = createStore<DemoState>({
  states: [
    { id: 'count', type: 'number', initial: 0 },
    { id: 'status', type: 'string', initial: 'ready' },
    { id: 'componentLoaded', type: 'boolean', initial: false }
  ]
});

function view(state: DemoState): XTendDescriptor {
  return {
    type: 'element',
    tag: 'div',
    attributes: { class: 'counter-panel', 'data-status': state.status },
    children: [
      {
        type: 'element', tag: 'div', attributes: { class: 'metric' }, children: [
          { type: 'element', tag: 'span', attributes: { class: 'metric-label' }, children: [{ type: 'text', text: 'Scheduled renders' }] },
          { type: 'element', tag: 'strong', attributes: { class: 'metric-value' }, children: [{ type: 'text', text: String(state.count) }] }
        ]
      },
      { type: 'element', tag: 'p', attributes: { class: 'runtime-copy' }, children: [{ type: 'text', text: `${app.schema} · ${state.status}` }] },
      {
        type: 'element', tag: 'div', attributes: { class: 'actions' }, children: [
          { type: 'element', tag: 'button', attributes: { type: 'button', id: 'increment' }, children: [{ type: 'text', text: 'Schedule +1' }] },
          { type: 'element', tag: 'button', attributes: { type: 'button', id: 'load-component', class: 'secondary' }, children: [{ type: 'text', text: state.componentLoaded ? 'x-status loaded' : 'Lazy-load x-status' }] }
        ]
      }
    ]
  };
}

function snapshot(): DemoState {
  return {
    count: store.getState('count'),
    status: store.getState('status'),
    componentLoaded: store.getState('componentLoaded')
  };
}

function bindActions(): void {
  root.querySelector<HTMLButtonElement>('#increment')?.addEventListener('click', () => {
    store.setState('status', 'updating');
    schedule(() => {
      store.setState('count', store.getState('count') + 1, { source: 'ts-demo' });
      store.setState('status', 'ready');
      paint();
    }, { endpointName: 'ts-demo.increment', scope: 'ts-demo', timeout: 250 });
  });

  root.querySelector<HTMLButtonElement>('#load-component')?.addEventListener('click', async (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    button.disabled = true;
    button.textContent = 'Loading…';
    try {
      await loadComponent('x-status', {
        source: 'demos.ts-app',
        manifest: { 'x-status': '/xtend-components/xstatus.js' }
      });
      const status = document.createElement('x-status');
      status.setAttribute('type', 'success');
      status.setAttribute('message', 'Loaded through the typed XTend Registry.');
      componentRegion.replaceChildren(status);
      store.setState('componentLoaded', true);
      store.setState('status', 'component-ready');
      paint();
    } catch (error: unknown) {
      componentRegion.textContent = error instanceof Error ? error.message : 'Component loading failed.';
      button.disabled = false;
      button.textContent = 'Retry x-status';
    }
  });
}

function paint(): void {
  render(root, view(snapshot()));
  bindActions();
}

schedule(paint, { endpointName: 'ts-demo.initial-render', scope: 'ts-demo', timeout: 1 });
afterPaint(() => {
  const kernel = getXTendSnapshot();
  runtimeBadge.textContent = `typed kernel ${String(kernel.status)}`;
  runtimeBadge.classList.add('ready');
});
window.addEventListener('pagehide', disposeXTend, { once: true });
