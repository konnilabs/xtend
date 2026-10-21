'use strict';
// Read-only availability check. Never installs or launches a browser/driver.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
function executable(file) {try {fs.accessSync(file,fs.constants.X_OK);return fs.statSync(file).isFile();} catch (_) {return false;}}
function first(name, extras) {
  const candidates = [...extras,...String(process.env.PATH || '').split(path.delimiter).filter(Boolean).map(dir=>path.join(dir,name))];
  return candidates.find(executable) || null;
}
const firefox = first('firefox',['/Applications/Firefox.app/Contents/MacOS/firefox',path.join(os.homedir(),'Applications/Firefox.app/Contents/MacOS/firefox')]);
const geckodriver = first('geckodriver',[]);
const report = {platform:process.platform,arch:process.arch,firefox,geckodriver,
  browserExecution:'not-run',linuxSandboxProof:'not-provided',acceptedForRelease:false,
  status:firefox && geckodriver ? 'toolchain-found-but-not-validated' : 'infrastructure-blocked',
  reason:firefox && geckodriver ? 'Validate toolchain provenance and engine/OS sandbox observer before launch' : 'Firefox and/or geckodriver absent; installation requires separate approval'};
console.log(JSON.stringify(report,null,2));
process.exitCode = 2;
