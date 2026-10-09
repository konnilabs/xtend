#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
// This runs before npm ci: it must have no project dependency imports.
function check(condition, message) { if (!condition) throw Error(message); }
function resolveNpmCli({ explicit, env = process.env } = {}) {
  let candidate = explicit || env.XTEND_NPM_CLI || env.npm_execpath;
  if (!candidate) {
    const command = (env.PATH || '').split(path.delimiter).filter(directory => path.isAbsolute(directory))
      .map(directory => path.join(directory, 'npm')).find(file => {
        try { fs.accessSync(file, fs.constants.X_OK); return true; } catch { return false; }
      });
    check(command, 'Installed npm command not found on PATH');
    candidate = fs.realpathSync(command);
  }
  check(path.isAbsolute(candidate) && !/[\r\n]/.test(candidate), 'Explicit absolute npm CLI path required');
  const cli = fs.realpathSync(candidate);
  check(path.basename(cli) === 'npm-cli.js' && path.basename(path.dirname(cli)) === 'bin', 'npm command must resolve to the installed npm CLI, not an unverified shell shim');
  const metadata = JSON.parse(fs.readFileSync(path.resolve(path.dirname(cli), '../package.json')));
  check(metadata.name === 'npm' && metadata.version === '11.17.0', 'Installed npm CLI must be the committed npm 11.17.0 pin');
  check(execFileSync(process.execPath, [cli, '--version'], { cwd: os.tmpdir(), env, encoding: 'utf8', timeout: 30000 }).trim() === '11.17.0', 'Installed npm CLI version check failed');
  return cli;
}
function main(args = process.argv.slice(2), env = process.env) {
  check(args.length === 0 || args.length === 1 && args[0] === '--execute', 'Only --execute is supported');
  // Discovery deliberately ignores lifecycle variables: this is the actual
  // command installed by the preceding global npm pin in a clean shell.
  const clean = { ...env }; delete clean.npm_execpath; delete clean.XTEND_NPM_CLI;
  const npmCli = resolveNpmCli({ env: clean });
  if (args[0] === '--execute') {
    check(env.GITHUB_ENV && path.isAbsolute(env.GITHUB_ENV), 'Explicit GITHUB_ENV file required');
    fs.appendFileSync(env.GITHUB_ENV, `XTEND_NPM_CLI=${npmCli}\n`);
  }
  console.log(JSON.stringify({ node: process.versions.node, npm: '11.17.0', npmCli }));
}
if (require.main === module) try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
module.exports = { resolveNpmCli, main };
