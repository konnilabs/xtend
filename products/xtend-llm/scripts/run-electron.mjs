import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  createElectronEnvironment,
  mirrorChildExit,
  spawnWithSignalForwarding
} from './electron-launcher.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const inputArgs = process.argv.slice(2);
const headlessIndex = inputArgs.indexOf('--xtend-headless');
const headless = headlessIndex !== -1;
if (headless) inputArgs.splice(headlessIndex, 1);
const requireInstalledIndex = inputArgs.indexOf('--xtend-require-installed');
const requireInstalled = requireInstalledIndex !== -1;
if (requireInstalled) inputArgs.splice(requireInstalledIndex, 1);
const executableIndex = inputArgs.indexOf('--xtend-executable');
let executableOverride = null;
if (executableIndex !== -1) {
  executableOverride = inputArgs[executableIndex + 1] || null;
  inputArgs.splice(executableIndex, executableOverride ? 2 : 1);
}

if (!executableOverride && inputArgs.length === 0) {
  console.error('Usage: node scripts/run-electron.mjs [--xtend-headless] [--xtend-require-installed] [--xtend-executable <path>] <app-or-entry> [...args]');
  process.exitCode = 1;
} else {
  try {
    let executable;
    const commandPrefix = [];
    if (executableOverride) {
      executable = path.isAbsolute(executableOverride)
        ? executableOverride
        : path.resolve(productRoot, executableOverride);
    } else if (requireInstalled) {
      try {
        executable = require('electron');
      } catch (error) {
        throw new Error('Electron runtime evidence requires the pinned binary to be installed first. Run npm run runtime:install:electron.', { cause: error });
      }
      if (typeof executable !== 'string') {
        throw new Error(`The installed Electron package did not resolve to an executable: ${String(executable)}`);
      }
    } else {
      const electronPackagePath = require.resolve('electron/package.json');
      const electronCli = path.join(path.dirname(electronPackagePath), 'cli.js');
      if (!fs.existsSync(electronCli)) throw new Error(`The installed Electron CLI is missing: ${electronCli}`);
      executable = process.execPath;
      commandPrefix.push(electronCli);
    }
    if (!fs.existsSync(executable)) throw new Error(`Electron executable does not exist: ${executable}`);
    const electronArgs = [...commandPrefix];
    if (headless) {
      electronArgs.push('--headless=new', '--ozone-platform=headless', '--disable-gpu', '--disable-dev-shm-usage');
      if (typeof process.getuid === 'function' && process.getuid() === 0) electronArgs.push('--no-sandbox');
    }
    electronArgs.push(...inputArgs);
    const result = await spawnWithSignalForwarding({
      executable,
      args: electronArgs,
      cwd: productRoot,
      env: createElectronEnvironment()
    });
    mirrorChildExit(result);
  } catch (error) {
    console.error(error && error.stack ? error.stack : String(error));
    process.exitCode = 1;
  }
}
