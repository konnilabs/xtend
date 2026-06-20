import path from 'node:path';
import { spawnSync } from 'node:child_process';

const productRoot = path.resolve(new URL('..', import.meta.url).pathname);

const result = spawnSync('npm', [
  'run',
  'test:llm:qwen3-8b',
  '--',
  ...process.argv.slice(2)
], {
  cwd: productRoot,
  encoding: 'utf8',
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: undefined
  }
});

process.exit(result.status ?? 1);
