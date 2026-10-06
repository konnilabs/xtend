'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { catalog, select, canonicalSuite, rootDir } = require('./catalog');
const { detectAvailableEngine, runFixture, findExecutable, providerOptions } = require('../../tools/browser-hypervisor');

function commandProbe(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || `${command} exited ${result.status}`);
  return result.stdout.trim();
}

async function browserProbe(options = {}) {
  const engine = detectAvailableEngine({ engine: options.engine || 'chromium' });
  if (!engine) throw new Error(`Required ${options.engine || 'chromium'} WebDriver is unavailable`);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-nightly-capabilities-'));
  const source = '<!doctype html><title>Nightly capability probe</title><script>window.__xtendNightlyCapabilities={status:"passed",ok:true};</script>';
  const fixture = 'probe.html';
  fs.writeFileSync(path.join(directory, fixture), source);
  const server = http.createServer((_request, response) => { response.setHeader('content-type', 'text/html'); response.end(source); });
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const evidence = await runFixture({ rootDir: directory, fixturePath: fixture, engine,
      url: `http://127.0.0.1:${server.address().port}/${fixture}`, resultKey: '__xtendNightlyCapabilities',
      driverLogPath: path.resolve('.xtend-test-results/nightly/logs/capability-browser-driver.log'),
      timeoutMs: 20000, accept: result => result?.ok === true });
    const provider = providerOptions({});
    return { engine, driver: evidence.driver, driverVersion: evidence.driverVersion, browserVersion: evidence.browserVersion,
      driverPath: provider.webDriverUrl ? null : findExecutable(evidence.driver, provider.driverPath, { explicitOnly: Boolean(provider.driverPath) }),
      endpoint: provider.webDriverUrl ? 'external-driver' : 'local-driver', fixtureTransport: 'loopback', result: evidence.result };
  } finally {
    server.closeAllConnections();
    if (server.listening) await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

// These declarations describe existing executable requirements; they do not
// promote optional browser branches or change advisory/skip policies.
function requirementsFor(options = {}) {
  const profile = options.profile || null;
  // The existing no-argument Nightly phase runs before fixture installation.
  // Only an explicit profile asks for installed profile-specific prerequisites.
  const toolchainOnly = !profile && !options.suiteIds;
  const ids = toolchainOnly ? [] : select({profile, suiteIds: options.suiteIds || []}).map(s=>canonicalSuite(s.id).id);
  const has = list => ids.some(id=>list.includes(id));
  const nightly = toolchainOnly || profile === 'ci-nightly';
  const pathPhp = nightly || has(['rmt-jit-hydrangea','rmt-php-ssr-adapter','rmt-php-app-service-adapter','rmt-reference-docs','rmt-playground-security','docs-php-ssr-prehydration','docs-php-ssr-performance-budget','docs-php-ssr-cls-budget','xscaler-php-preflight-parity','rmt-xscaler-ssr-hydration-parity','maraca-app-services-cross-runtime']);
  const configuredPhp = has(['ssr-pages-php','xtend-shop-php','xtend-shop-browser']) || ids.some(id=>id.startsWith('ssr-pages-laravel'));
  const phpCommands = [...new Set([...(pathPhp ? ['php'] : []),...(configuredPhp ? [process.env.XTEND_PHP_BINARY || 'php'] : [])])];
  const requiredBrowser = nightly || has(['ssr-pages-browser','ssr-pages-laravel-browser','ssr-pages-laravel-browser-matrix','xtend-shop-browser','xtend-material-browser-evidence','xtend-material-catfooding','xtend-material-cli-generated-app']) || (has(['browser']) && Boolean(process.env.XTEND_BROWSER_SMOKE_ENGINE || process.env.XTEND_BROWSER_SMOKE_DRIVER));
  const optionalBrowser = has(['maraca-app-services-build','maraca-kernel-integrity','rmt-vnext-source-to-sea']);
  return {profile, toolchainOnly, ids, php:phpCommands.length > 0, phpCommands, browser:requiredBrowser ? 'required' : optionalBrowser ? 'optional' : 'not-selected',
    sqlite:nightly || has(['project-index']), jsdom:has(['xss-pentest','docs-php-ssr-prehydration','rmt-kernel-trusted-dom-runtime','rmt-kernel-recovery','rmt-kernel-security-regression','epic13-trusted-dom-boundary']), laravel:ids.filter(id=>id.startsWith('ssr-pages-laravel')),
    shop:ids.filter(id=>id.startsWith('xtend-shop-')), advisory:catalog.profiles[profile]?.advisory || [], requireNoSkips:catalog.profiles[profile]?.requireNoSkips || false};
}

const PHP_PROBE = 'if(!extension_loaded("json")||!extension_loaded("openssl")||!is_callable("proc_open")||!is_callable("iconv")){fwrite(STDERR,"PHP requires JSON, OpenSSL, proc_open and iconv");exit(1);}if(bin2hex(iconv("UTF-8","UTF-16BE","a"))!=="0061"){fwrite(STDERR,"PHP iconv conversion failed");exit(1);}echo PHP_VERSION;';

// Synchronous, non-fatal identity capture: missing optional tools are recorded,
// never turned into a global execution requirement. No ini contents are exposed.
function toolchainIdentity(options = {}) {
  const run = options.commandProbe || commandProbe;
  const capture = (command,args) => {try{return {command,available:true,value:run(command,args)};}catch{return {command,available:false};}};
  const phpCode = '$ext=get_loaded_extensions();sort($ext);$files=array_filter(array_merge([php_ini_loaded_file()],explode(",",(string)php_ini_scanned_files())));$ini=[];foreach($files as $f){$f=trim($f);if($f!=="")$ini[$f]=is_file($f)?hash_file("sha256",$f):null;}ksort($ini);echo json_encode(["version"=>PHP_VERSION,"binary"=>PHP_BINARY,"binaryHash"=>hash_file("sha256",PHP_BINARY),"extensions"=>$ext,"ini"=>$ini,"disabled"=>ini_get("disable_functions"),"iconv"=>is_callable("iconv")?bin2hex(iconv("UTF-8","UTF-16BE","a")):null]);';
  const provider = providerOptions({});
  const driver = findExecutable('chromedriver',provider.driverPath,{explicitOnly:Boolean(provider.driverPath)});
  const binary = provider.browserBinary || findExecutable('chromium') || findExecutable('google-chrome');
  const phpCommands = [...new Set(['php',process.env.XTEND_PHP_BINARY].filter(Boolean))];
  const php = phpCommands.map(command=>capture(command,['-r',phpCode]));
  const browser = {endpoint:provider.webDriverUrl || null,driver:driver ? capture(driver,['--version']) : {available:false},binary:binary ? capture(binary,['--version']) : {available:false}};
  const configuration = {PHPRC:process.env.PHPRC || '',PHP_INI_SCAN_DIR:process.env.PHP_INI_SCAN_DIR || '',browser};
  return {php,browser,configurationFingerprint:createHash('sha256').update(JSON.stringify(configuration)).digest('hex')};
}

async function probeCapabilities(options = {}) {
  const run = options.commandProbe || commandProbe;
  const requirements = requirementsFor(options);
  const checks = [];
  const check = async (id, fn, required = true) => {
    try { checks.push({ id, required, ok: true, evidence: await fn() }); }
    catch (error) { checks.push({ id, required, ok: false, error: error.message }); }
  };
  await check('node-and-subprocess', () => run(process.execPath, ['-e', 'if(Number(process.versions.node.split(".")[0])<24)process.exit(1);console.log(process.version)']));
  await check('npm', () => run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version']));
  if (requirements.sqlite) await check('node-sqlite', () => run(process.execPath, ['-e', 'const {DatabaseSync}=require("node:sqlite");const db=new DatabaseSync(":memory:");db.exec("create table probe (ok integer); insert into probe values (1)");if(db.prepare("select ok from probe").get().ok!==1)process.exit(1);db.close();console.log("SQLite read/write available")']));
  for (const command of requirements.phpCommands) await check(command === 'php' ? 'php' : 'configured-php', () => run(command, ['-r', PHP_PROBE]));
  if (requirements.jsdom) await check('jsdom',()=>run(process.execPath,['-e','const {JSDOM}=require("jsdom");const dom=new JSDOM("<p>before</p>");dom.window.document.querySelector("p").textContent="after";if(dom.window.document.querySelector("p").textContent!=="after")process.exit(1);console.log(require("jsdom/package.json").version);dom.window.close();']));
  if (requirements.browser !== 'not-selected') await check('browser-and-loopback', options.browserProbe || (()=>browserProbe({engine:process.env.XTEND_BROWSER_SMOKE_ENGINE || process.env.XTEND_BROWSER_HYPERVISOR_ENGINE || 'chromium'})), requirements.browser === 'required');
  if (requirements.laravel.length) {
    const matrix = requirements.laravel.some(id=>id.endsWith('-matrix'));
    const fixtures = matrix ? ['12','13'].map(v=>process.env[`XTEND_LARAVEL_FIXTURE_${v}`] || path.join(rootDir,'.xtend-test-results/laravel-fixtures',v)) : [process.env.XTEND_LARAVEL_FIXTURE];
    for (const [index,fixture] of fixtures.entries()) await check(`laravel-fixture-${index}`,()=>{
      if (!fixture) throw Error('XTEND_LARAVEL_FIXTURE must name an isolated Composer installation.');
      for (const file of ['composer.lock','vendor/autoload.php','vendor/composer/installed.json','vendor/bin/phpunit','LaravelIntegrationTest.php']) if(!fs.existsSync(path.join(fixture,file)))throw Error(`Missing Laravel prerequisite: ${path.join(fixture,file)}`);
      const lock=JSON.parse(fs.readFileSync(path.join(fixture,'composer.lock'),'utf8'));
      const extensions=[...new Set([...(lock.packages || []),...(lock['packages-dev'] || [])].flatMap(pkg=>Object.keys(pkg.require || {}).filter(key=>key.startsWith('ext-')).map(key=>key.slice(4))))].sort();
      run(process.env.XTEND_PHP_BINARY || 'php',['-r','foreach(json_decode($argv[1],true) as $ext){if(!extension_loaded($ext)){fwrite(STDERR,"Missing PHP extension: ".$ext);exit(1);}}',JSON.stringify(extensions)]);
      return run(process.env.XTEND_PHP_BINARY || 'php',['-r','require $argv[1]; echo Illuminate\\Foundation\\Application::VERSION;',path.join(fixture,'vendor/autoload.php')]);
    });
  }
  if (requirements.shop.length) await check('shop-fixture',()=>{
    const fixture=process.env.XTEND_SHOP_FIXTURE || path.join(rootDir,'products/xtend-shop');
    const files=['scripts/test.cjs','package-lock.json','composer.lock','payment-provider/composer.lock'];
    if(requirements.shop.some(id=>id!=='xtend-shop-contracts'))files.push('vendor/autoload.php');
    for(const file of files)if(!fs.existsSync(path.join(fixture,file)))throw Error(`Missing shop prerequisite: ${path.join(fixture,file)}`);
    require('node:module').createRequire(path.join(fixture,'package.json')).resolve('@ccslabs/xtend/package.json');
    return {fixture};
  });
  return { schema: 'xtend.ci.runner-capabilities.v1', generatedAt: new Date().toISOString(),
    requirements, ok: checks.every(check => !check.required || check.ok), runtime: { node: process.version, platform: process.platform, arch: process.arch,
      image: `${process.env.ImageOS || ''}:${process.env.ImageVersion || ''}` }, checks };
}

if (require.main === module) Promise.resolve().then(()=>{
  const args=process.argv.slice(2);
  if(args.length && (args.length!==2 || args[0]!=='--profile'))throw Error('Usage: capabilities.js [--profile <catalog-profile>]');
  return probeCapabilities(args.length ? {profile:args[1]} : {});
}).then(report => {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}).catch(error => { console.error(error); process.exitCode = 1; });

module.exports = { probeCapabilities, requirementsFor, toolchainIdentity, PHP_PROBE };
