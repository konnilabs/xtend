const fs = require('fs');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('events');
const { Readable } = require('stream');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  MARACA_APP_SERVICE_REQUEST_SCHEMA,
  MARACA_APP_SERVICE_RESPONSE_SCHEMA,
  AppServiceAbortError,
  createAppServiceRegistry,
  createHttpAppServiceTransport,
  defineAppServices,
  defineServerServices,
  service
} = require('../../xtend-maraca/app-services');
const {
  createNodeAppServiceHost
} = require('../../xtend-maraca/node-app-service-host');
const {
  defineServerServices: defineServerServicesFromEntry,
  service: serverService
} = require('../../xtend-maraca/server-services');
const {
  syncAppServicesEsm
} = require('../../xtend-maraca/sync-app-services-esm');

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function withTimeout(value, milliseconds, message) {
  let timeoutHandle;
  const timeout = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(message)), milliseconds);
  });
  return Promise.race([Promise.resolve(value), timeout]).finally(() => clearTimeout(timeoutHandle));
}

async function collectAsync(iterable) {
  const result = [];
  for await (const value of iterable) result.push(value);
  return result;
}

class FakeNodeResponse extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.headersSent = false;
    this.writableEnded = false;
    this.chunks = [];
  }

  setHeader(name, value) {
    this.headers[String(name).toLowerCase()] = String(value);
  }

  write(chunk) {
    this.headersSent = true;
    this.chunks.push(String(chunk));
    return true;
  }

  end(chunk = '') {
    if (chunk) this.chunks.push(String(chunk));
    this.headersSent = true;
    this.writableEnded = true;
    this.emit('finish');
  }

  body() {
    return this.chunks.join('');
  }
}

function wireRequest(serviceId, kind, input = null) {
  return {
    schema: MARACA_APP_SERVICE_REQUEST_SCHEMA,
    serviceId,
    kind,
    target: 'server',
    invocationId: `client:${serviceId}`,
    correlationId: `correlation:${serviceId}`,
    input
  };
}

async function runDefinitionAssertions(context) {
  const definition = defineAppServices({
    'app.lookup': service({
      kind: 'query',
      target: 'local',
      invoke(input) {
        return input;
      }
    }),
    'app.save': service({
      kind: 'command',
      target: 'local',
      invoke(input) {
        return input;
      }
    }),
    'app.feed': service({
      kind: 'stream',
      target: 'local',
      async *stream() {}
    })
  });

  context.assert(Object.isFrozen(definition) && Object.isFrozen(definition.services), 'service definitions are immutable marker objects');
  context.assert(definition.services['app.lookup'].concurrency === 'latest', 'queries default to latest concurrency');
  context.assert(definition.services['app.save'].concurrency === 'serial', 'commands default to serial concurrency');
  context.assert(definition.services['app.feed'].concurrency === 'latest', 'streams default to latest concurrency');
  context.assert(
    ['kind', 'target', 'concurrency'].every((key) => Object.prototype.hasOwnProperty.call(definition.services['app.lookup'], key)),
    'service markers expose static kind, target and concurrency metadata'
  );
  const serverDefinition = defineServerServicesFromEntry({
    'server.lookup': serverService({
      kind: 'query',
      invoke(input) {
        return input;
      }
    })
  });
  context.assert(serverDefinition.services['server.lookup'].target === 'server', 'server-services entry defaults implementations to the server target');
}

async function runEsmAssertions(context, rootDir) {
  const syncResult = syncAppServicesEsm({
    check: true,
    directory: resolveRepoPath('xtend-maraca', rootDir)
  });
  context.assert(syncResult.ok, 'AppServices ESM implementation is synchronized with the CommonJS source of truth');
  const moduleUrl = `${pathToFileURL(resolveRepoPath('xtend-maraca/app-services.mjs', rootDir)).href}?suite=app-services`;
  const esmApi = await import(moduleUrl);
  const requiredExports = [
    'service',
    'defineAppServices',
    'defineServerServices',
    'createAppServiceRegistry',
    'createHttpAppServiceTransport'
  ];
  context.assert(requiredExports.every((name) => typeof esmApi[name] === 'function'), 'AppServices exposes definition, registry and HTTP transport as native ESM exports');
  const esmDefinition = esmApi.defineAppServices({
    'app.esm': esmApi.service({
      kind: 'query',
      target: 'local',
      invoke() {
        return 'esm';
      }
    })
  });
  const value = await esmApi.createAppServiceRegistry(esmDefinition).invoke('app.esm', null);
  context.assert(value === 'esm', 'native ESM implementation executes without a CommonJS wrapper');
  const serverModuleUrl = `${pathToFileURL(resolveRepoPath('xtend-maraca/server-services.mjs', rootDir)).href}?suite=server-services`;
  const serverApi = await import(serverModuleUrl);
  const serverCommonJsApi = require('../../xtend-maraca/server-services');
  context.assert(
    Object.keys(serverApi).sort().join('|') === Object.keys(serverCommonJsApi).sort().join('|'),
    'server AppServices CommonJS and ESM entries expose the same public names'
  );
  const serverDefinition = serverApi.defineServerServices({
    'server.esm': serverApi.service({
      kind: 'query',
      invoke() {
        return 'server-esm';
      }
    })
  });
  const serverValue = await serverApi.createNodeAppServiceHost({ services: serverDefinition })
    .handleEnvelope(wireRequest('server.esm', 'query'));
  context.assert(serverValue.value === 'server-esm', 'native server ESM entry composes the Node host without CommonJS conversion');
}

async function runRaceAssertions(context) {
  const resolvers = new Map();
  const seenSignals = new Map();
  const definition = defineAppServices({
    'app.search': service({
      kind: 'query',
      target: 'local',
      invoke(input, execution) {
        seenSignals.set(input.term, execution.signal);
        return new Promise((resolve) => resolvers.set(input.term, resolve));
      }
    })
  });
  const registry = createAppServiceRegistry(definition);
  const first = registry.invoke('app.search', { term: 'first' });
  const firstOutcome = first.then(
    (value) => ({ value }),
    (error) => ({ error })
  );
  await Promise.resolve();
  const second = registry.invoke('app.search', { term: 'second' });
  await Promise.resolve();

  context.assert(first.sequence < second.sequence && first.id !== second.id, 'invocations receive monotone unique ids');
  context.assert(first.correlationId !== second.correlationId, 'invocations receive monotone default correlation ids');
  context.assert(seenSignals.get('first') && seenSignals.get('first').aborted === true, 'latest aborts the superseded handler signal');

  resolvers.get('second')({ result: 'second' });
  const secondValue = await second;
  if (resolvers.has('first')) resolvers.get('first')({ result: 'late-first' });
  const stale = await firstOutcome;
  await registry.whenIdle();

  context.assert(secondValue.result === 'second', 'latest resolves the newest invocation');
  context.assert(stale.error && stale.error.code === 'xtend.maraca.app-service.stale', 'latest suppresses a stale result with a stable error code');
  context.assert(registry.listHistory().some((entry) => entry.status === 'stale'), 'registry history records stale suppression');
  registry.dispose();
}

async function runConcurrencyAssertions(context) {
  let serialActive = 0;
  let serialPeak = 0;
  const serialOrder = [];
  let parallelActive = 0;
  let parallelPeak = 0;
  const definition = defineAppServices({
    'app.write': service({
      kind: 'command',
      target: 'local',
      async invoke(input) {
        serialActive += 1;
        serialPeak = Math.max(serialPeak, serialActive);
        serialOrder.push(input.id);
        await delay(5);
        serialActive -= 1;
        return input.id;
      }
    }),
    'app.compare': service({
      kind: 'query',
      target: 'local',
      concurrency: 'parallel',
      async invoke(input) {
        parallelActive += 1;
        parallelPeak = Math.max(parallelPeak, parallelActive);
        await delay(5);
        parallelActive -= 1;
        return input.id;
      }
    })
  });
  const registry = createAppServiceRegistry(definition);
  const serialValues = await Promise.all([
    registry.invoke('app.write', { id: 1 }),
    registry.invoke('app.write', { id: 2 }),
    registry.invoke('app.write', { id: 3 })
  ]);
  const parallelValues = await Promise.all([
    registry.invoke('app.compare', { id: 1 }),
    registry.invoke('app.compare', { id: 2 }),
    registry.invoke('app.compare', { id: 3 })
  ]);
  context.assert(serialPeak === 1 && serialOrder.join(',') === '1,2,3', 'serial commands never overlap and preserve submission order');
  context.assert(serialValues.join(',') === '1,2,3', 'serial commands resolve their own results');
  context.assert(parallelPeak > 1 && parallelValues.length === 3, 'parallel services execute concurrently only when explicitly selected');
  registry.dispose();
}

async function runAbortAssertions(context) {
  let observedSignal = null;
  const definition = defineAppServices({
    'app.long': service({
      kind: 'query',
      target: 'local',
      invoke(_input, execution) {
        observedSignal = execution.signal;
        return new Promise(() => {});
      }
    }),
    'app.timeout': service({
      kind: 'query',
      target: 'local',
      invoke() {
        return new Promise(() => {});
      }
    })
  });
  const registry = createAppServiceRegistry(definition);
  const pending = registry.invoke('app.long', null);
  const pendingOutcome = pending.then(() => null, (error) => error);
  await Promise.resolve();
  registry.dispose('test dispose');
  const disposedError = await pendingOutcome;
  context.assert(observedSignal && observedSignal.aborted, 'registry dispose reaches the handler AbortSignal');
  context.assert(disposedError instanceof AppServiceAbortError && disposedError.code === 'xtend.maraca.app-service.disposed', 'dispose rejects active work with the stable disposed error');

  const timeoutRegistry = createAppServiceRegistry(definition);
  const timeoutError = await timeoutRegistry.invoke('app.timeout', null, { timeoutMs: 5 }).then(() => null, (error) => error);
  context.assert(timeoutError && timeoutError.code === 'xtend.maraca.app-service.timeout', 'per-invocation timeout aborts work without retrying');
  timeoutRegistry.dispose();
}

async function runStreamAssertions(context) {
  let deltaCallbacks = 0;
  let cleanupStarted = false;
  let cleanupFinished = false;
  let releaseCleanup;
  const cleanupBarrier = new Promise((resolve) => { releaseCleanup = resolve; });
  const definition = defineAppServices({
    'app.feed': service({
      kind: 'stream',
      target: 'local',
      async *stream() {
        yield { id: 'delta:a', sequence: 7, type: 'delta', delta: 'a' };
        yield { id: 'delta:a', sequence: 7, type: 'delta', delta: 'duplicate' };
        yield { id: 'delta:b', sequence: 8, type: 'delta', delta: 'b' };
        yield { id: 'delta:stale', sequence: 6, type: 'delta', delta: 'stale' };
        yield { id: 'terminal', sequence: 9, type: 'complete', value: 'done' };
        yield { id: 'late', sequence: 10, type: 'delta', delta: 'late' };
      }
    }),
    'app.cleanup-feed': service({
      kind: 'stream',
      target: 'local',
      async *stream() {
        try {
          yield { id: 'cleanup-terminal', type: 'complete' };
        } finally {
          cleanupStarted = true;
          await cleanupBarrier;
          cleanupFinished = true;
        }
      }
    })
  });
  const registry = createAppServiceRegistry(definition);
  const stream = registry.stream('app.feed', null, {
    onDelta() {
      deltaCallbacks += 1;
    }
  });
  const frames = await collectAsync(stream);
  const terminal = await stream.done;
  await registry.whenIdle();

  context.assert(frames.map((frame) => frame.sequence).join(',') === '1,2,3,4', 'stream output is normalized to a monotone sequence');
  context.assert(frames.filter((frame) => frame.id === 'delta:a').length === 1, 'stream frames are deduplicated by id and input sequence');
  context.assert(!frames.some((frame) => frame.id === 'delta:stale'), 'stream rejects out-of-order input sequences');
  context.assert(deltaCallbacks === 2, 'delta callbacks run exactly once per accepted delta');
  context.assert(terminal.type === 'complete' && frames.filter((frame) => ['complete', 'error', 'cancelled'].includes(frame.type)).length === 1, 'stream produces exactly one terminal frame');
  context.assert(!frames.some((frame) => frame.id === 'late'), 'stream ignores frames after its terminal frame');

  const cleanupStream = registry.stream('app.cleanup-feed');
  await collectAsync(cleanupStream);
  await delay(0);
  let idleSettled = false;
  const idle = registry.whenIdle().then(() => { idleSettled = true; });
  await delay(0);
  context.assert(cleanupStarted && !cleanupFinished && !idleSettled, 'whenIdle remains pending while async stream iterator cleanup is running');
  context.assert(registry.listActive().some((entry) => entry.serviceId === 'app.cleanup-feed'), 'stream remains active until iterator cleanup settles');
  releaseCleanup();
  await idle;
  context.assert(cleanupFinished && !registry.listActive().some((entry) => entry.serviceId === 'app.cleanup-feed'), 'whenIdle observes completed iterator cleanup before releasing the stream lifecycle');
  registry.dispose();
}

async function runStreamRaceAssertions(context) {
  const definition = defineAppServices({
    'app.live': service({
      kind: 'stream',
      target: 'local',
      async *stream(input) {
        yield { id: `delta:${input.id}`, type: 'delta', delta: input.id };
        if (input.id === 'first') await new Promise(() => {});
      }
    })
  });
  const registry = createAppServiceRegistry(definition);
  const first = registry.stream('app.live', { id: 'first' });
  const firstFramesPromise = collectAsync(first);
  await delay(0);
  const second = registry.stream('app.live', { id: 'second' });
  const [firstFrames, secondFrames] = await Promise.all([firstFramesPromise, collectAsync(second)]);
  await registry.whenIdle();
  context.assert(firstFrames.filter((frame) => frame.type === 'cancelled').length === 1, 'a newer latest stream emits one cancelled terminal for a non-cooperative previous iterator');
  context.assert(!firstFrames.some((frame) => frame.type === 'complete'), 'a superseded stream cannot commit completion');
  context.assert(secondFrames.at(-1).type === 'complete', 'the newest latest stream owns the terminal completion');
  context.assert(registry.listActive().length === 0, 'stream supersession releases all registry lifecycle records');
  registry.dispose();
}

async function runTransportAssertions(context) {
  const requests = [];
  const transport = createHttpAppServiceTransport({
    baseUrl: 'https://api.example.test/',
    headers: { Authorization: 'Bearer test' },
    async fetch(url, init) {
      requests.push({ url, init });
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            schema: MARACA_APP_SERVICE_RESPONSE_SCHEMA,
            ok: true,
            value: { name: 'Ada' }
          };
        }
      };
    }
  });
  const signal = new AbortController().signal;
  const value = await transport.invoke({
    serviceId: 'server/user lookup',
    kind: 'query',
    target: 'server',
    input: { id: 1 },
    invocationId: 'client:1',
    correlationId: 'correlation:1',
    signal
  });
  const requestBody = JSON.parse(requests[0].init.body);
  context.assert(requests.length === 1 && requests[0].url.endsWith('/api/xtend/services/server%2Fuser%20lookup'), 'HTTP transport performs one encoded POST without retries');
  context.assert(requestBody.schema === MARACA_APP_SERVICE_REQUEST_SCHEMA && requestBody.input.id === 1, 'HTTP transport emits the versioned JSON request envelope');
  context.assert(value.name === 'Ada' && requests[0].init.headers.Authorization === 'Bearer test', 'HTTP transport unwraps the response and applies host-owned headers');
  transport.dispose();

  const streamTransport = createHttpAppServiceTransport({
    async fetch() {
      const encoder = new TextEncoder();
      const ndjson = encoder.encode([
        '{"schema":"xtend.maraca.app-service-stream-frame.v1","id":"one","type":"delta","delta":"a"}',
        '{"schema":"xtend.maraca.app-service-stream-frame.v1","id":"two","type":"complete","value":"done"}',
        ''
      ].join('\n'));
      return {
        ok: true,
        status: 200,
        body: {
          async *[Symbol.asyncIterator]() {
            for (let index = 0; index < ndjson.byteLength; index += 1) {
              yield ndjson.subarray(index, index + 1);
            }
          }
        }
      };
    }
  });
  const streamFrames = await collectAsync(streamTransport.stream({
    serviceId: 'server.feed',
    kind: 'stream',
    target: 'server',
    input: null,
    invocationId: 'client:2',
    correlationId: 'correlation:2',
    signal
  }));
  context.assert(streamFrames.length === 2 && streamFrames[1].type === 'complete', 'HTTP transport parses byte-fragmented and coalesced NDJSON frames');
  streamTransport.dispose();

  let beforeHeadersSignal = null;
  const beforeHeadersTransport = createHttpAppServiceTransport({
    fetch(_url, init) {
      beforeHeadersSignal = init.signal;
      return new Promise((resolve, reject) => {
        const onAbort = () => reject(init.signal.reason);
        init.signal.addEventListener('abort', onAbort, { once: true });
      });
    }
  });
  const beforeHeadersController = new AbortController();
  const beforeHeadersInvocation = beforeHeadersTransport.invoke({
    serviceId: 'server.abort-before-headers',
    kind: 'query',
    target: 'server',
    signal: beforeHeadersController.signal
  }).then(() => null, (error) => error);
  await Promise.resolve();
  beforeHeadersController.abort(new AppServiceAbortError('fixture abort before headers'));
  const beforeHeadersError = await beforeHeadersInvocation;
  context.assert(
    beforeHeadersSignal && beforeHeadersSignal.aborted
      && beforeHeadersError instanceof AppServiceAbortError,
    'HTTP transport propagates abort before response headers without retrying'
  );
  beforeHeadersTransport.dispose();

  let midBodySignal = null;
  const midBodyTransport = createHttpAppServiceTransport({
    async fetch(_url, init) {
      midBodySignal = init.signal;
      const encoder = new TextEncoder();
      return {
        ok: true,
        status: 200,
        body: {
          async *[Symbol.asyncIterator]() {
            yield encoder.encode('{"schema":"xtend.maraca.app-service-stream-frame.v1","id":"visible","type":"delta","delta":"a"}\n');
            await new Promise((resolve, reject) => {
              if (init.signal.aborted) {
                reject(init.signal.reason);
                return;
              }
              const onAbort = () => reject(init.signal.reason);
              init.signal.addEventListener('abort', onAbort, { once: true });
            });
          }
        }
      };
    }
  });
  const midBodyController = new AbortController();
  const midBodyIterator = midBodyTransport.stream({
    serviceId: 'server.abort-mid-body',
    kind: 'stream',
    target: 'server',
    signal: midBodyController.signal
  })[Symbol.asyncIterator]();
  const firstMidBodyFrame = await midBodyIterator.next();
  midBodyController.abort(new AppServiceAbortError('fixture abort during body'));
  const midBodyError = await midBodyIterator.next().then(() => null, (error) => error);
  context.assert(
    firstMidBodyFrame.value && firstMidBodyFrame.value.id === 'visible'
      && midBodySignal && midBodySignal.aborted
      && midBodyError instanceof AppServiceAbortError,
    'HTTP transport aborts an NDJSON body after headers and preserves already committed frames'
  );
  midBodyTransport.dispose();
}

async function runProxyAssertions(context) {
  const calls = [];
  let disposeCount = 0;
  const transport = {
    schema: 'xtend.maraca.app-service-transport.v1',
    kind: 'test',
    async invoke(request) {
      calls.push(request);
      return { proxied: request.input.id };
    },
    async *stream(request) {
      calls.push(request);
      yield { id: 'remote:start', sequence: 1, type: 'start' };
      yield { id: 'remote:delta', sequence: 2, type: 'delta', delta: request.input.topic };
      yield { id: 'remote:complete', sequence: 3, type: 'complete' };
    },
    dispose() {
      disposeCount += 1;
      return true;
    }
  };
  const definition = defineAppServices({
    'server.user': service({ kind: 'query', target: 'server' }),
    'remote.feed': service({ kind: 'stream', target: 'remote-surface' })
  });
  const registry = createAppServiceRegistry(definition, { transport });
  const result = await registry.invoke('server.user', { id: 7 });
  const frames = await collectAsync(registry.stream('remote.feed', { topic: 'updates' }));
  context.assert(result.proxied === 7 && calls[0].target === 'server', 'registry routes server proxies through the injected transport');
  context.assert(frames.some((frame) => frame.delta === 'updates') && calls[1].target === 'remote-surface', 'registry routes remote-surface streams without executing local code');
  context.assert(frames.filter((frame) => frame.type === 'start').length === 1, 'registry collapses a transport start frame into one local stream start');
  registry.dispose();
  context.assert(disposeCount === 0, 'registry leaves an injected transport host-owned by default');

  const ownedRegistry = createAppServiceRegistry(definition, { transport, disposeTransport: true });
  ownedRegistry.dispose();
  context.assert(disposeCount === 1, 'registry can explicitly own and dispose its transport');
}

async function runNodeHostAssertions(context) {
  const sumExecutions = [];
  const feedExecutions = [];
  const cleanupOrder = [];
  const cleanupErrors = [];
  let disconnectCleanupCount = 0;
  let disconnectSignal = null;
  let resolveDisconnectHandlerStarted;
  const disconnectHandlerStarted = new Promise((resolve) => { resolveDisconnectHandlerStarted = resolve; });
  const definition = defineServerServices({
    'server.sum': service({
      kind: 'command',
      target: 'server',
      invoke(input, execution) {
        sumExecutions.push(execution);
        return { total: input.left + input.right };
      }
    }),
    'server.feed': service({
      kind: 'stream',
      target: 'server',
      async *stream(_input, execution) {
        feedExecutions.push(execution);
        yield { type: 'delta', delta: 'hello' };
      }
    }),
    'server.fail': service({
      kind: 'query',
      target: 'server',
      invoke() {
        throw new Error('sentinel-secret');
      }
    }),
    'server.cleanup': service({
      kind: 'command',
      target: 'server',
      invoke(input, execution) {
        execution.defer(() => {
          cleanupOrder.push(`${input.label}:first`);
          if (input.cleanupFails) throw new Error('cleanup-sentinel-secret');
        });
        execution.defer(async () => {
          cleanupOrder.push(`${input.label}:second:start`);
          await Promise.resolve();
          cleanupOrder.push(`${input.label}:second:end`);
        });
        if (input.fail) throw new Error('handler-failure');
        return { label: input.label };
      }
    }),
    'server.disconnect': service({
      kind: 'stream',
      target: 'server',
      async *stream(_input, execution) {
        disconnectSignal = execution.signal;
        execution.defer(() => { disconnectCleanupCount += 1; });
        resolveDisconnectHandlerStarted();
        yield { type: 'delta', delta: 'before-disconnect' };
        await new Promise(() => {});
      }
    })
  });
  const host = createNodeAppServiceHost({
    services: definition,
    onCleanupError(error, cleanupContext) {
      cleanupErrors.push({ error, cleanupContext });
    }
  });
  const direct = await host.handleEnvelope(wireRequest('server.sum', 'command', { left: 2, right: 3 }));
  context.assert(direct.schema === MARACA_APP_SERVICE_RESPONSE_SCHEMA && direct.value.total === 5, 'Node host executes a server definition without opening a listener');
  context.assert(
    direct.invocationId === 'client:server.sum'
      && direct.correlationId === 'correlation:server.sum'
      && sumExecutions[0].invocationId === direct.invocationId
      && sumExecutions[0].correlationId === direct.correlationId,
    'Node invoke preserves validated wire invocation and correlation ids through the handler and response'
  );
  context.assert(
    /^xtend\.maraca\.app-service\.invocation:\d+$/u.test(sumExecutions[0].executionId)
      && sumExecutions[0].executionId !== sumExecutions[0].invocationId,
    'Node invoke keeps a distinct monotone registry-owned execution id'
  );
  const directFrames = await collectAsync(host.streamEnvelope(wireRequest('server.feed', 'stream')));
  context.assert(directFrames.map((frame) => frame.type).join(',') === 'start,delta,complete', 'Node host exposes the shared streaming lifecycle');
  context.assert(
    feedExecutions[0].invocationId === 'client:server.feed'
      && feedExecutions[0].correlationId === 'correlation:server.feed'
      && directFrames.every((frame) => frame.streamId === 'client:server.feed'
        && frame.invocationId === 'client:server.feed'
        && frame.correlationId === 'correlation:server.feed'),
    'Node stream preserves validated wire identity in its handler and every frame'
  );

  const targetError = await host.handleEnvelope({
    ...wireRequest('server.sum', 'command'),
    target: 'local'
  }).then(() => null, (error) => error);
  const kindError = await host.handleEnvelope({
    ...wireRequest('server.sum', 'command'),
    kind: ''
  }).then(() => null, (error) => error);
  const schemaError = await host.handleEnvelope({
    ...wireRequest('server.sum', 'command'),
    schema: 'xtend.maraca.app-service-request.invalid'
  }).then(() => null, (error) => error);
  context.assert(targetError && targetError.code === 'xtend.maraca.app-service.target_mismatch', 'Node host rejects a request whose target differs from the server service contract');
  context.assert(kindError && kindError.code === 'xtend.maraca.app-service.mode_mismatch', 'Node host rejects a missing or mismatched service kind');
  context.assert(schemaError && schemaError.code === 'xtend.maraca.app-service.invalid_request', 'Node host rejects an unsupported wire-request schema');

  await host.handleEnvelope(wireRequest('server.cleanup', 'command', { label: 'success' }));
  context.assert(
    cleanupOrder.join('|') === 'success:second:start|success:second:end|success:first',
    'Node request scopes await deferred cleanup sequentially in LIFO order after success'
  );
  cleanupOrder.length = 0;
  const cleanupFailure = await host.handleEnvelope(wireRequest('server.cleanup', 'command', {
    label: 'handler-failure',
    fail: true
  })).then(() => null, (error) => error);
  context.assert(cleanupFailure && cleanupFailure.message === 'handler-failure', 'Node direct handler failures remain observable to the host caller');
  context.assert(
    cleanupOrder.join('|') === 'handler-failure:second:start|handler-failure:second:end|handler-failure:first',
    'Node request scopes run deferred cleanup after handler failure'
  );
  cleanupOrder.length = 0;
  const cleanupErrorResult = await host.handleEnvelope(wireRequest('server.cleanup', 'command', {
    label: 'cleanup-failure',
    cleanupFails: true
  }));
  context.assert(cleanupErrorResult.value.label === 'cleanup-failure', 'cleanup failures do not replace a successful service result');
  context.assert(
    cleanupErrors.length === 1
      && cleanupErrors[0].error.message === 'cleanup-sentinel-secret'
      && cleanupErrors[0].cleanupContext.phase === 'cleanup'
      && cleanupErrors[0].cleanupContext.serviceId === 'server.cleanup',
    'cleanup failures are isolated behind the Node host cleanup observer'
  );

  const requestPayload = JSON.stringify(wireRequest('server.sum', 'command', { left: 4, right: 5 }));
  const request = Readable.from([requestPayload]);
  request.method = 'POST';
  request.url = '/api/xtend/services/server.sum';
  const response = new FakeNodeResponse();
  const handled = await host.handle(request, response);
  const payload = JSON.parse(response.body());
  context.assert(handled && response.statusCode === 200 && payload.value.total === 9, 'Node HTTP adapter handles the default POST route');
  context.assert(response.headers['content-type'].includes('application/json'), 'Node invoke responses use the JSON wire content type');
  context.assert(payload.invocationId === 'client:server.sum' && payload.correlationId === 'correlation:server.sum', 'Node HTTP invoke responses preserve the client wire identity');
  const sumHistory = host.registry.listHistory().filter((entry) => entry.serviceId === 'server.sum');
  context.assert(
    sumExecutions.length === 2
      && sumExecutions[0].executionId !== sumExecutions[1].executionId
      && sumHistory.length === 2
      && sumHistory[0].id !== sumHistory[1].id
      && sumHistory[0].sequence < sumHistory[1].sequence
      && sumHistory.every((entry) => entry.invocationId === 'client:server.sum'),
    'reused client invocation ids cannot weaken monotone internal registry execution identity'
  );

  const failureRequest = Readable.from([JSON.stringify(wireRequest('server.fail', 'query'))]);
  failureRequest.method = 'POST';
  failureRequest.url = '/api/xtend/services/server.fail';
  const failureResponse = new FakeNodeResponse();
  await host.handle(failureRequest, failureResponse);
  const failure = JSON.parse(failureResponse.body());
  context.assert(failure.ok === false && !failure.error.message.includes('sentinel-secret'), 'Node host redacts service errors by default');

  const disconnectPayload = JSON.stringify(wireRequest('server.disconnect', 'stream'));
  const disconnectRequest = Readable.from([disconnectPayload]);
  disconnectRequest.method = 'POST';
  disconnectRequest.url = '/api/xtend/services/server.disconnect';
  const disconnectResponse = new FakeNodeResponse();
  let writeCount = 0;
  let resolveBackpressure;
  const backpressure = new Promise((resolve) => { resolveBackpressure = resolve; });
  disconnectResponse.write = function write(chunk) {
    FakeNodeResponse.prototype.write.call(this, chunk);
    writeCount += 1;
    if (writeCount === 2) {
      resolveBackpressure();
      return false;
    }
    return true;
  };
  const disconnectHandling = host.handle(disconnectRequest, disconnectResponse);
  await withTimeout(
    Promise.all([disconnectHandlerStarted, backpressure]),
    500,
    'Node disconnect fixture did not reach handler/backpressure'
  );
  disconnectResponse.emit('close');
  await withTimeout(disconnectHandling, 500, 'Node host remained blocked on response drain after disconnect');
  context.assert(disconnectSignal && disconnectSignal.aborted, 'Node response disconnect aborts the handler signal while waiting for backpressure drain');
  context.assert(disconnectCleanupCount === 1, 'Node response disconnect runs request-scoped cleanup exactly once');

  const unrelated = Readable.from([]);
  unrelated.method = 'POST';
  unrelated.url = '/host-owned/route';
  context.assert(await host.handle(unrelated, new FakeNodeResponse()) === false, 'Node host leaves unrelated backend routes host-owned');
  context.assert(host.dispose() === true && host.dispose() === false, 'Node host disposal is idempotent');

  let externalSignal = null;
  let externalCleanupCount = 0;
  let resolveExternalStarted;
  const externalStarted = new Promise((resolve) => { resolveExternalStarted = resolve; });
  const externalRegistry = createAppServiceRegistry(defineServerServices({
    'server.long': service({
      kind: 'query',
      target: 'server',
      invoke(_input, execution) {
        externalSignal = execution.signal;
        execution.defer(() => { externalCleanupCount += 1; });
        resolveExternalStarted();
        return new Promise(() => {});
      }
    })
  }));
  const externalHost = createNodeAppServiceHost({ registry: externalRegistry });
  const externalInvocation = externalHost.handleEnvelope(wireRequest('server.long', 'query')).then(() => null, (error) => error);
  await withTimeout(externalStarted, 500, 'External Node host fixture handler did not start');
  externalHost.dispose('external host dispose');
  await withTimeout(externalHost.whenDisposed(), 500, 'External Node host request cleanup did not settle on dispose');
  const externalError = await externalInvocation;
  context.assert(externalError && externalError.code === 'xtend.maraca.app-service.disposed', 'Node host dispose aborts direct work even with an externally owned registry');
  context.assert(externalSignal && externalSignal.aborted && externalCleanupCount === 1, 'Node host dispose aborts the handler and awaits request-scoped cleanup exactly once');
  context.assert(externalRegistry.disposed === false, 'Node host does not dispose an externally owned registry');
  externalRegistry.dispose();

  const serverResolvers = new Map();
  const serverSignals = new Map();
  const isolatedHost = createNodeAppServiceHost({
    services: defineServerServices({
      'server.scoped': service({
        kind: 'query',
        target: 'server',
        invoke(input, execution) {
          serverSignals.set(input.client, execution.signal);
          return new Promise((resolve) => serverResolvers.set(input.client, resolve));
        }
      })
    })
  });
  const firstRequest = { ...wireRequest('server.scoped', 'query', { client: 'a' }), invocationId: 'client:a', correlationId: 'correlation:a' };
  const secondRequest = { ...wireRequest('server.scoped', 'query', { client: 'b' }), invocationId: 'client:b', correlationId: 'correlation:b' };
  const firstServerInvocation = isolatedHost.handleEnvelope(firstRequest);
  await Promise.resolve();
  const secondServerInvocation = isolatedHost.handleEnvelope(secondRequest);
  await Promise.resolve();
  context.assert(serverSignals.get('a') && !serverSignals.get('a').aborted, 'Node host scopes latest concurrency so unrelated clients cannot supersede each other');
  serverResolvers.get('a')('a');
  serverResolvers.get('b')('b');
  const isolatedValues = await Promise.all([firstServerInvocation, secondServerInvocation]);
  context.assert(isolatedValues[0].value === 'a' && isolatedValues[1].value === 'b', 'Node host preserves both isolated client results');
  isolatedHost.dispose();
}

function runTypeAssertions(context, rootDir) {
  const declarations = fs.readFileSync(resolveRepoPath('xtend-maraca/app-services.d.ts', rootDir), 'utf8');
  context.assert(!/\bany\b/u.test(declarations), 'AppServices declarations use unknown instead of any');
  const tscPath = resolveRepoPath('node_modules/typescript/bin/tsc', rootDir);
  if (!fs.existsSync(tscPath)) {
    context.skip('TypeScript compile probe skipped because the local TypeScript compiler is unavailable');
    return;
  }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-maraca-app-services-types-'));
  try {
    fs.copyFileSync(resolveRepoPath('xtend-maraca/app-services.d.ts', rootDir), path.join(tempDir, 'app-services.d.ts'));
    fs.writeFileSync(path.join(tempDir, 'probe.ts'), `
import { createAppServiceRegistry, defineAppServices, service } from './app-services';

const services = defineAppServices({
  'app.user': service<{ id: number }, { name: string }>({
    kind: 'query',
    target: 'local',
    async invoke(input) { return { name: String(input.id) }; }
  }),
  'app.feed': service<{ topic: string }, string>({
    kind: 'stream',
    target: 'local',
    async *stream(input) { yield input.topic; }
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
`, 'utf8');
    const result = spawnSync(process.execPath, [tscPath,
      '--noEmit',
      '--strict',
      '--target', 'ES2022',
      '--module', 'CommonJS',
      '--moduleResolution', 'Node',
      '--lib', 'ES2022,DOM',
      path.join(tempDir, 'probe.ts')
    ], { encoding: 'utf8' });
    if (result.error && result.error.code === 'EPERM') {
      context.skip('TypeScript child-process probe skipped because the execution sandbox denies child processes');
      return;
    }
    const compilerMessage = result.error && result.error.message || result.stderr || result.stdout || `tsc exited with status ${result.status}`;
    context.assert(result.status === 0, `AppServices declarations preserve service-id and payload inference${compilerMessage ? ` (${String(compilerMessage).trim()})` : ''}`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function runMaracaAppServicesRuntimeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-app-services-runtime',
    label: 'XTend Maraca AppServices Runtime'
  });

  context.assert(syntaxCheckFile('xtend-maraca/app-services.js', { rootDir }).ok, 'AppServices browser/runtime module passes syntax check');
  context.assert(syntaxCheckFile('xtend-maraca/app-services.mjs', { rootDir }).ok, 'AppServices native ESM module passes syntax check');
  context.assert(syntaxCheckFile('xtend-maraca/node-app-service-host.js', { rootDir }).ok, 'AppServices Node host module passes syntax check');
  context.assert(syntaxCheckFile('xtend-maraca/node-app-service-host.mjs', { rootDir }).ok, 'AppServices native ESM Node host passes syntax check');
  context.assert(syntaxCheckFile('xtend-maraca/server-services.js', { rootDir }).ok, 'AppServices server entry module passes syntax check');
  context.assert(syntaxCheckFile('xtend-maraca/server-services.mjs', { rootDir }).ok, 'AppServices native ESM server entry passes syntax check');
  await runEsmAssertions(context, rootDir);
  await runDefinitionAssertions(context);
  await runRaceAssertions(context);
  await runConcurrencyAssertions(context);
  await runAbortAssertions(context);
  await runStreamAssertions(context);
  await runStreamRaceAssertions(context);
  await runTransportAssertions(context);
  await runProxyAssertions(context);
  await runNodeHostAssertions(context);
  runTypeAssertions(context, rootDir);

  return context.result({
    schema: 'xtend.maraca.app-services-runtime-report.v1'
  });
}

function printMaracaAppServicesRuntimeReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Maraca AppServices Runtime erfolgreich.',
    failureTitle: 'XTend Maraca AppServices Runtime fehlgeschlagen:'
  });
}

if (require.main === module) {
  runMaracaAppServicesRuntimeSuite().then((result) => {
    printMaracaAppServicesRuntimeReport(result);
    process.exitCode = result.ok ? 0 : 1;
  }).catch((error) => {
    console.error(error && error.stack || error);
    process.exitCode = 1;
  });
}

module.exports = {
  printMaracaAppServicesRuntimeReport,
  runMaracaAppServicesRuntimeSuite
};
