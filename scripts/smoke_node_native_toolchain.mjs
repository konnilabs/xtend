#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportIndex = process.argv.indexOf('--report');
const reportPath = reportIndex >= 0 && process.argv[reportIndex + 1]
  ? path.resolve(rootDir, process.argv[reportIndex + 1])
  : null;

function versionOf(moduleNamespace) {
  return moduleNamespace.version
    || moduleNamespace.default && moduleNamespace.default.version
    || null;
}

async function run() {
  const checks = [];
  const record = async (id, operation) => {
    const startedAt = Date.now();
    try {
      const facts = await operation();
      checks.push({ id, ok: true, durationMs: Date.now() - startedAt, ...facts });
    } catch (error) {
      checks.push({
        id,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: {
          name: error && error.name || 'Error',
          message: error && error.message || String(error)
        }
      });
    }
  };

  await record('typescript-program-build', async () => {
    const typescript = await import('typescript');
    const api = typescript.default || typescript;
    const fileName = path.join(rootDir, '.xtend-node-native-toolchain-smoke.ts');
    const sourceText = 'export const answer: number = 42;\n';
    const compilerOptions = {
      module: api.ModuleKind.ESNext,
      target: api.ScriptTarget.ES2022,
      moduleResolution: api.ModuleResolutionKind.Bundler,
      noEmitOnError: true,
      strict: true,
      skipLibCheck: true,
      types: []
    };
    const host = api.createCompilerHost(compilerOptions);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (requestedFile, languageVersion, onError, shouldCreateNewSourceFile) => (
      path.resolve(requestedFile) === fileName
        ? api.createSourceFile(fileName, sourceText, languageVersion, true, api.ScriptKind.TS)
        : getSourceFile(requestedFile, languageVersion, onError, shouldCreateNewSourceFile)
    );
    host.fileExists = ((fileExists) => (requestedFile) => path.resolve(requestedFile) === fileName || fileExists(requestedFile))(host.fileExists.bind(host));
    host.readFile = ((readFile) => (requestedFile) => path.resolve(requestedFile) === fileName ? sourceText : readFile(requestedFile))(host.readFile.bind(host));
    const emitted = [];
    host.writeFile = (outputName, contents) => emitted.push({ outputName, contents });
    const program = api.createProgram([fileName], compilerOptions, host);
    const diagnostics = api.getPreEmitDiagnostics(program);
    const emitResult = program.emit();
    if (diagnostics.length > 0 || emitResult.emitSkipped || emitted.length !== 1) {
      const formatted = api.formatDiagnosticsWithColorAndContext([...diagnostics, ...emitResult.diagnostics], {
        getCurrentDirectory: () => rootDir,
        getCanonicalFileName: (name) => name,
        getNewLine: () => '\n'
      });
      throw new Error(`TypeScript Program build failed.\n${formatted}`);
    }
    if (!emitted[0].contents.includes('answer')) throw new Error('TypeScript Program build did not emit the typed fixture.');
    return { version: versionOf(typescript), emittedFiles: emitted.length };
  });

  await record('rollup-native-bundle', async () => {
    const rollupApi = await import('rollup');
    const bundle = await rollupApi.rollup({
      input: '\0xtend-node-runtime-smoke',
      plugins: [{
        name: 'xtend-node-runtime-smoke',
        resolveId(id) {
          return id === '\0xtend-node-runtime-smoke' ? id : null;
        },
        load(id) {
          return id === '\0xtend-node-runtime-smoke' ? 'export const answer = 42;' : null;
        }
      }]
    });
    try {
      const output = await bundle.generate({ format: 'es' });
      const code = output.output[0] && output.output[0].code || '';
      if (!code.includes('answer')) throw new Error('Rollup did not emit the virtual ESM entry.');
      return { version: versionOf(rollupApi), bytes: Buffer.byteLength(code) };
    } finally {
      await bundle.close();
    }
  });

  await record('terser-minify', async () => {
    const terser = await import('terser');
    const result = await terser.minify('function add(left, right) { return left + right; } console.log(add(20, 22));');
    if (!result.code || result.code.length < 8) throw new Error('Terser did not emit minified JavaScript.');
    return { version: versionOf(terser), bytes: Buffer.byteLength(result.code) };
  });

  await record('esbuild-native-transform', async () => {
    const esbuild = await import('esbuild');
    const result = await esbuild.transform('const answer: number = 42', { loader: 'ts', target: 'es2022' });
    if (!result.code.includes('42')) throw new Error('Esbuild did not transform the TypeScript fixture.');
    return { version: versionOf(esbuild), bytes: Buffer.byteLength(result.code) };
  });

  await record('vite-esbuild-bridge', async () => {
    const vite = await import('vite');
    const result = await vite.transformWithEsbuild('export const answer: number = 42', 'native-toolchain-smoke.ts', {
      loader: 'ts',
      target: 'es2022'
    });
    if (!result.code.includes('answer')) throw new Error('Vite did not execute its Esbuild bridge.');
    return { version: versionOf(vite), bytes: Buffer.byteLength(result.code) };
  });

  await record('lightningcss-native-transform', async () => {
    const lightning = await import('lightningcss');
    const api = lightning.transform ? lightning : lightning.default;
    const result = api.transform({
      filename: 'native-toolchain-smoke.css',
      code: Buffer.from('.smoke { color: rgb(255 0 0); }'),
      minify: true
    });
    const code = Buffer.from(result.code || []).toString('utf8');
    if (!code.includes('red') && !code.includes('#f00')) throw new Error('Lightning CSS did not transform the CSS fixture.');
    return { version: versionOf(lightning), bytes: Buffer.byteLength(code) };
  });

  const report = {
    schema: 'xtend.node-native-toolchain-smoke.v1',
    ok: checks.every((check) => check.ok),
    runtime: {
      node: process.version,
      npm: process.env.npm_config_user_agent || null,
      platform: process.platform,
      arch: process.arch,
      modules: process.versions.modules || null,
      napi: process.versions.napi || null,
      v8: process.versions['v8'] || null,
      openssl: process.versions.openssl || null
    },
    checks
  };

  if (reportPath) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}

await run();
