import {
  createApp,
  createStore,
  readyXTend,
  render,
  schedule,
  type XTendDescriptor
} from '@ccslabs/xtend';

await readyXTend();

interface State {
  count: number;
  profile: { name: string };
}

const app = createApp<State>({ initialState: { count: 0, profile: { name: 'Ada' } } });
const store = createStore<State>({
  states: [
    { id: 'count', type: 'number', initial: 0 },
    { id: 'profile', type: 'object', initial: { name: 'Ada' } }
  ]
});
const descriptor: XTendDescriptor = { type: 'text', text: String(store.getState('count')) };
const root = document.createElement('main');
render(root, descriptor);
schedule(() => app.setState({ count: 1, profile: { name: 'Grace' } }));

// @ts-expect-error unknown state id
store.getState('missing');
// @ts-expect-error count must remain numeric
store.setState('count', 'one');
// @ts-expect-error element descriptors require a tag
const invalidDescriptor: XTendDescriptor = { type: 'element', children: [] };
void invalidDescriptor;
