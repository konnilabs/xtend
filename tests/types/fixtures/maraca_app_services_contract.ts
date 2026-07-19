import {
  createAppServiceRegistry,
  defineAppServices,
  service
} from '../../../xtend-maraca/app-services';
import {
  createNodeAppServiceHost,
  defineServerServices,
  service as serverService
} from '../../../xtend-maraca/server-services';

const services = defineAppServices({
  'app.user': service<{ id: number }, { name: string }>({
    kind: 'query',
    target: 'local',
    async invoke(input) {
      return { name: String(input.id) };
    }
  }),
  'app.feed': service<{ topic: string }, string>({
    kind: 'stream',
    target: 'local',
    async *stream(input) {
      yield input.topic;
    }
  })
});

const registry = createAppServiceRegistry(services);
const result: Promise<{ name: string }> = registry.invoke('app.user', { id: 1 });
const stream: AsyncIterable<{ readonly delta: string | null }> = registry.stream('app.feed', { topic: 'news' });
void result;
void stream;

// @ts-expect-error service input remains strongly typed
registry.invoke('app.user', { id: 'wrong' });
// @ts-expect-error stream ids cannot be invoked
registry.invoke('app.feed', { topic: 'news' });

const serverServices = defineServerServices({
  'server.user': serverService<{ id: number }, { name: string }>({
    kind: 'query',
    async invoke(input) {
      return { name: String(input.id) };
    }
  })
});
const host = createNodeAppServiceHost({ services: serverServices });
void host;
