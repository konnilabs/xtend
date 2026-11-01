'use strict';
// Optional read-only diagnostics. Nothing here establishes a passing sandbox.
const fs = require('node:fs'), os = require('node:os');
const {spawnSync} = require('node:child_process');
const STATUS_FIELDS = new Set(['Name','Pid','PPid','Uid','Gid','NSpid','CapEff','NoNewPrivs','Seccomp','Seccomp_filters']);
const HOST_FILES = ['/proc/sys/kernel/unprivileged_userns_clone', '/proc/sys/kernel/apparmor_restrict_unprivileged_userns',
  '/proc/sys/user/max_user_namespaces', '/sys/module/apparmor/parameters/enabled', '/sys/kernel/security/lsm'];
function unavailable(error) { return {unavailable: error?.code || error?.name || 'unknown'}; }
function read(file, io = fs) {
  let fd;
  try {
    fd = io.openSync(file, 'r'); const bytes = Buffer.alloc(65537);
    const size = io.readSync(fd, bytes, 0, bytes.length, 0);
    return {value: bytes.subarray(0, Math.min(size, 65536)).toString('utf8').trim(), truncated: size > 65536};
  } catch (error) { return unavailable(error); }
  finally { if (fd !== undefined) try { io.closeSync(fd); } catch {} }
}
function link(file, io = fs) { try { return {value: io.readlinkSync(file)}; } catch (error) { return unavailable(error); } }
function processSnapshot(pid, io = fs) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return {unavailable:'invalid-or-not-started-pid'};
  const raw = read('/proc/' + pid + '/status', io);
  const status = raw.value === undefined ? raw : Object.fromEntries(raw.value.split('\n').filter(line => STATUS_FIELDS.has(line.split(':')[0]))
    .map(line => [line.slice(0,line.indexOf(':')),line.slice(line.indexOf(':')+1).trim()]));
  return {pid, status, executable: link('/proc/' + pid + '/exe', io), lsm: read('/proc/' + pid + '/attr/current', io),
    apparmor: read('/proc/' + pid + '/attr/apparmor/current', io),
    namespaces: Object.fromEntries(['user','pid','net','mnt'].map(name => [name,link('/proc/' + pid + '/ns/' + name, io)]))};
}
function hostSnapshot(env = process.env, io = fs) {
  return {platform: process.platform, architecture: process.arch, kernel: os.release(), osRelease: read('/etc/os-release', io),
    runner: Object.fromEntries(['ImageOS','ImageVersion','RUNNER_OS','RUNNER_ARCH'].map(name => [name,env[name] ?? null])),
    values: Object.fromEntries(HOST_FILES.map(file => [file,read(file, io)])), parent: processSnapshot(process.pid, io)};
}
function filterAudit(text, pid, binary) {
  const rows = [];
  for (const line of String(text).split('\n')) {
    let row; try { row = JSON.parse(line); } catch { continue; }
    const message = row.MESSAGE;
    if (typeof message !== 'string' || !/(apparmor="DENIED"|type=SECCOMP|userns_create)/.test(message)) continue;
    const exactPid = Number.isSafeInteger(pid) && new RegExp('(?:^|\\s)pid=' + pid + '(?:\\s|$)').test(message);
    const exactBinary = typeof binary === 'string' && binary.length > 0 && message.includes('exe="' + binary + '"');
    if (!exactPid && !exactBinary) continue;
    // Only known diagnostic fields; never dump the raw journal or environment.
    const fields = {};
    const allowed = new Set(['type','apparmor','operation','class','profile','name','info','error','requested_mask','denied_mask','pid','comm','exe']);
    for (const match of message.matchAll(/(?:^|\s)([a-zA-Z_]+)=("[^"]*"|[^\s]+)/g)) {
      if (allowed.has(match[1])) fields[match[1]] = match[2].slice(0,1024);
    }
    rows.push({time: row.__REALTIME_TIMESTAMP ?? null, fields});
    if (rows.length === 20) break;
  }
  return rows;
}
function auditSnapshot({pid, binary, startedAt}, run = spawnSync) {
  if (!Number.isFinite(startedAt)) return {unavailable:'missing-launch-time'};
  const args = ['--no-pager','--quiet','--output=json','-k','--since',new Date(startedAt-1000).toISOString(),
    '--until',new Date().toISOString()];
  try {
    const result = run('journalctl', args, {encoding:'utf8',timeout:2000,maxBuffer:262144,windowsHide:true});
    if (result.error || result.status !== 0) return {unavailable: result.error?.code || 'journal-exit-' + result.status,
      permissionDenied: /permission|not permitted|access denied/i.test(result.stderr || '')};
    if (/permission|not permitted|access denied|not seeing messages|no journal files/i.test(result.stderr || ''))
      return {unavailable:'journal-access-or-records-unavailable'};
    return {available:true, matches:filterAudit(result.stdout,pid,binary),
      note:'Only readable kernel records in this launch window matching the browser PID or exact executable; no matches does not prove permission.'};
  } catch (error) { return unavailable(error); }
}
function emit(stage, collect) {
  if (process.env.XTEND_SECURITY_HOST_DIAGNOSTICS !== '1') return;
  let data; try { data = collect(); } catch (error) { data = unavailable(error); }
  console.log('XTEND_SECURITY_HOST_DIAGNOSTIC ' + JSON.stringify({diagnosticVersion:1,stage,recordedAt:new Date().toISOString(),data}));
}
module.exports = {hostSnapshot,processSnapshot,filterAudit,auditSnapshot,emit};
