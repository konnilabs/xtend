import { createApp, createStore, disposeXTend, readyXTend, schedule } from '@ccslabs/xtend';

await readyXTend({ fabric: false });

interface ServerState {
  requestCount: number;
}

const app = createApp<ServerState>({ initialState: { requestCount: 0 } });
const store = createStore<ServerState>({
  states: [{ id: 'requestCount', type: 'number', initial: 0 }]
});
const cancel = schedule(() => {
  store.setState('requestCount', app.getState().requestCount + 1);
});
cancel();
disposeXTend();
