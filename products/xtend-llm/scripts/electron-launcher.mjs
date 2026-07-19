import os from 'node:os';
import { spawn } from 'node:child_process';

export const HOST_RUNTIME_EVIDENCE_ENV = 'XTEND_LLM_HOST_RUNTIME_EVIDENCE';
export const FORWARDED_SIGNALS = Object.freeze(['SIGINT', 'SIGTERM', 'SIGHUP']);

function npmVersionFromEnvironment(environment) {
  const userAgent = String(environment.npm_config_user_agent || '');
  const match = /(?:^|\s)npm\/([^\s]+)/u.exec(userAgent);
  return match ? match[1] : null;
}

export function createHostRuntimeEvidence(options = {}) {
  const versions = options.versions || process.versions;
  const environment = options.environment || process.env;
  return Object.freeze({
    schema: 'xtend-llm.launcher-host-runtime.v1',
    node: versions.node || null,
    npm: npmVersionFromEnvironment(environment),
    modules: versions.modules || null,
    napi: versions.napi || null,
    v8: versions.v8 || null,
    openssl: versions.openssl || null,
    platform: options.platform || process.platform,
    arch: options.arch || process.arch,
    pid: Number.isInteger(options.pid) ? options.pid : process.pid
  });
}

export function createElectronEnvironment(source = process.env, hostRuntime = createHostRuntimeEvidence({ environment: source })) {
  const environment = { ...source };
  delete environment.ELECTRON_RUN_AS_NODE;
  environment[HOST_RUNTIME_EVIDENCE_ENV] = JSON.stringify(hostRuntime);
  return environment;
}

function addSignalHandler(signalSource, signal, handler) {
  try {
    signalSource.on(signal, handler);
    return true;
  } catch {
    return false;
  }
}

export function spawnWithSignalForwarding(options) {
  const executable = String(options.executable || '').trim();
  if (!executable) throw new TypeError('An Electron executable is required.');
  const args = Array.isArray(options.args) ? options.args.map(String) : [];
  const signalSource = options.signalSource || process;
  const spawnImplementation = options.spawnImplementation || spawn;
  const signals = options.signals || FORWARDED_SIGNALS;
  const child = spawnImplementation(executable, args, {
    cwd: options.cwd || process.cwd(),
    env: options.env || createElectronEnvironment(),
    stdio: options.stdio || 'inherit',
    windowsHide: false
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    const handlers = new Map();
    const cleanup = () => {
      for (const [signal, handler] of handlers) signalSource.off(signal, handler);
      handlers.clear();
    };
    const settle = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };

    for (const signal of signals) {
      const handler = () => {
        if (child.exitCode !== null || child.signalCode !== null || child.killed) return;
        try {
          child.kill(signal);
        } catch {
          // The exit/error event remains authoritative when the child races the signal.
        }
      };
      if (addSignalHandler(signalSource, signal, handler)) handlers.set(signal, handler);
    }

    child.once('error', (error) => settle(reject, error));
    child.once('exit', (code, signal) => settle(resolve, {
      code: Number.isInteger(code) ? code : null,
      signal: signal || null
    }));
  });
}

export function mirrorChildExit(result, target = process) {
  if (Number.isInteger(result && result.code)) {
    target.exitCode = result.code;
    return Object.freeze({ mode: 'code', exitCode: result.code });
  }

  const signal = result && result.signal;
  if (!signal) {
    target.exitCode = 1;
    return Object.freeze({ mode: 'fallback', exitCode: 1 });
  }

  const signalNumber = os.constants.signals[signal];
  const fallbackExitCode = Number.isInteger(signalNumber) ? 128 + signalNumber : 1;
  target.exitCode = fallbackExitCode;
  try {
    target.kill(target.pid, signal);
    return Object.freeze({ mode: 'signal', signal, fallbackExitCode });
  } catch {
    return Object.freeze({ mode: 'fallback', signal, exitCode: fallbackExitCode });
  }
}
