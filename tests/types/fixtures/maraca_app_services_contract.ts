import {
  applyAppServiceInputPolicy,
  type AppServiceInputPolicy,
  type AppServiceInputVerdict,
  createAppServiceRegistry,
  defineAppServices,
  service
} from '../../../xtend-maraca/app-services';
import {
  createNodeAppServiceHost,
  defineServerServices,
  service as serverService
} from '../../../xtend-maraca/server-services';
import {
  createNodeAppHost,
  listenNodeAppHost
} from '../../../xtend-maraca/node-app-host';

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
const inputPolicy: AppServiceInputPolicy = {
  schema: 'xtend.maraca.app-service-input-policy.v1',
  fields: [{
    name: 'text',
    type: 'string',
    boundary: 'xtend.security.sanitizing-boundary.v1',
    sanitize: 'text'
  }]
};
const policyApplication = applyAppServiceInputPolicy({ text: 'line one\r\nline two' }, {
  serviceId: 'app.secure',
  policy: inputPolicy,
  phase: 'browser'
});
const inputVerdict: AppServiceInputVerdict | null = policyApplication.verdict;
void result;
void stream;
void inputVerdict;

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
const appHost = createNodeAppHost({
  services: serverServices,
  rootDir: new URL('file:///tmp/xtend-app/'),
  publicPaths: ['site/', 'dist/'],
  port: 0
});
const listeningHost = listenNodeAppHost({ services: serverServices, port: 0 });
void host;
void appHost;
void listeningHost;
