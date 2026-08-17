import assert from 'node:assert/strict';
import fs from 'node:fs';
import { request as httpRequest } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

import { startXtendMcpHttp } from '../src/transports.mjs';
import {
  applyRmtSafeRepairs,
  createRmtRepairPlan,
  resolveSourceInput
} from '../src/tooling.mjs';

function problemFixture(eol = '\n') {
  return JSON.stringify({
    kind: 'rmt_document',
    version: '1.0',
    adapters: [
      { id: 'xtend.component', kind: 'component_adapter' },
      { id: 'xtend.xrouter', kind: 'router_adapter' }
    ],
    components: [{
      id: 'page.home',
      adapter: 'xtend.component',
      tag: 'x-section',
      schedule: 'missing.schedule',
      metadata: { fabric: { lane: 'urgent' } }
    }],
    routes: [{
      id: 'home',
      path: 'bad',
      router: 'xtend.xrouter',
      component: 'missing.component',
      template: 'missing.template',
      schedule: 'missing.schedule'
    }],
    schedules: [{ id: 'existing.schedule', lane: 'visible' }],
    templates: [{ id: 'tpl.html', mode: 'html_fragment', html: '<script>alert(1)</script>' }]
  }, null, 2).replace(/\n/gu, eol);
}

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-mcp-security-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function rawHttpRequest(url, options = {}) {
  const target = new URL(url);
  return new Promise((resolve, reject) => {
    const request = httpRequest({
      hostname: target.hostname,
      port: target.port,
      path: target.pathname,
      method: options.method || 'POST',
      headers: options.headers || {}
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    request.once('error', reject);
    request.end(options.body || '');
  });
}

test('path tools reject absolute paths, traversal, and symlink escapes', (t) => {
  const root = workspace(t);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-mcp-outside-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'inside.rmt'), problemFixture());
  fs.writeFileSync(path.join(outside, 'outside.rmt'), problemFixture());

  assert.throws(() => resolveSourceInput({ path: path.join(root, 'inside.rmt') }, { workspaceRoots: [root] }), /workspace-relative/u);
  assert.throws(() => resolveSourceInput({ path: '../outside.rmt' }, { workspaceRoots: [root] }), /not found inside an allowed workspace/u);
  assert.throws(() => resolveSourceInput({ source: 'x', path: 'inside.rmt' }, { workspaceRoots: [root] }), /exactly one/u);

  const link = path.join(root, 'escape.rmt');
  try {
    fs.symlinkSync(path.join(outside, 'outside.rmt'), link);
    assert.throws(() => resolveSourceInput({ path: 'escape.rmt' }, { workspaceRoots: [root] }), /not found inside an allowed workspace/u);
  } catch (error) {
    if (error && ['EPERM', 'EACCES'].includes(error.code)) t.diagnostic('Symlink creation is not permitted on this host; escape checks remain covered on symlink-capable hosts.');
    else throw error;
  }
});

test('safe repairs require opt-in and hashes, support partial selection, preserve EOL/mode, and re-diagnose', async (t) => {
  const root = workspace(t);
  const filePath = path.join(root, 'problem.rmt');
  fs.writeFileSync(filePath, problemFixture('\r\n'));
  if (process.platform !== 'win32') fs.chmodSync(filePath, 0o640);
  const options = { workspaceRoots: [root], allowWorkspaceWrite: true };
  const { plan } = createRmtRepairPlan({ path: 'problem.rmt' }, options);
  assert.ok(plan.safeRepairCount > 1);
  assert.ok(plan.repairs.every((repair) => repair.safe === true));
  const selected = plan.repairs.find((repair) => repair.diagnosticCode === 'rmt.fabric.lane.unknown');
  assert.ok(selected);

  await assert.rejects(
    applyRmtSafeRepairs({ path: 'problem.rmt', sourceHash: plan.sourceHash, planHash: plan.planHash, repairIds: [selected.repairId] }, { workspaceRoots: [root] }),
    /Workspace writes are disabled/u
  );
  await assert.rejects(
    applyRmtSafeRepairs({ path: 'problem.rmt', sourceHash: plan.sourceHash, planHash: plan.planHash, repairIds: ['repair-unknown'] }, options),
    /Unknown or unsafe repairId/u
  );

  const beforeMode = fs.statSync(filePath).mode & 0o777;
  const applied = await applyRmtSafeRepairs({
    path: 'problem.rmt',
    sourceHash: plan.sourceHash,
    planHash: plan.planHash,
    repairIds: [selected.repairId]
  }, options);
  const after = fs.readFileSync(filePath, 'utf8');
  assert.equal(applied.status, 'applied');
  assert.deepEqual(applied.appliedRepairIds, [selected.repairId]);
  assert.notEqual(applied.sourceHashBefore, applied.sourceHashAfter);
  assert.match(after, /"lane": "visible"/u);
  assert.match(after, /"schedule": "missing\.schedule"/u, 'partial selection must not apply other repairs');
  assert.ok(!/(?<!\r)\n/u.test(after), 'CRLF line endings must be preserved');
  if (process.platform !== 'win32') assert.equal(fs.statSync(filePath).mode & 0o777, beforeMode);
  assert.equal(applied.diagnostics.schema, 'xtend.mcp.rmt-diagnostics.v1');
  assert.ok(!fs.readdirSync(root).some((name) => name.includes('.xtend-mcp-') && name.endsWith('.tmp')));
});

test('repair application aborts unchanged when the source or plan drifts', async (t) => {
  const root = workspace(t);
  const filePath = path.join(root, 'problem.rmt');
  fs.writeFileSync(filePath, problemFixture());
  const options = { workspaceRoots: [root], allowWorkspaceWrite: true };
  const { plan } = createRmtRepairPlan({ path: 'problem.rmt' }, options);
  fs.appendFileSync(filePath, '\n');
  const drifted = fs.readFileSync(filePath, 'utf8');
  await assert.rejects(applyRmtSafeRepairs({
    path: 'problem.rmt',
    sourceHash: plan.sourceHash,
    planHash: plan.planHash,
    repairIds: [plan.repairs[0].repairId]
  }, options), /Source drift detected/u);
  assert.equal(fs.readFileSync(filePath, 'utf8'), drifted);

  const current = createRmtRepairPlan({ path: 'problem.rmt' }, options).plan;
  await assert.rejects(applyRmtSafeRepairs({
    path: 'problem.rmt',
    sourceHash: current.sourceHash,
    planHash: '0'.repeat(64),
    repairIds: [current.repairs[0].repairId]
  }, options), /Repair plan drift detected/u);
  assert.equal(fs.readFileSync(filePath, 'utf8'), drifted);
});

test('Streamable HTTP stays on loopback and enforces Bearer, Host, and Origin checks', async (t) => {
  const token = 'test-token-with-at-least-24-characters';
  const handle = await startXtendMcpHttp({ token, port: 0 });
  t.after(() => handle.close());
  assert.equal(handle.host, '127.0.0.1');
  assert.ok(handle.port > 0);
  assert.match(handle.url, /^http:\/\/127\.0\.0\.1:\d+\/mcp$/u);

  const health = await fetch(handle.healthUrl);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);

  const unauthorized = await fetch(handle.url, { method: 'POST', headers: { accept: 'application/json, text/event-stream', 'content-type': 'application/json' }, body: '{}' });
  assert.equal(unauthorized.status, 401);
  assert.match(unauthorized.headers.get('www-authenticate') || '', /^Bearer/u);

  const hostileHost = await rawHttpRequest(handle.url, {
    headers: { authorization: `Bearer ${token}`, host: 'attacker.example', accept: 'application/json, text/event-stream', 'content-type': 'application/json' },
    body: '{}'
  });
  assert.equal(hostileHost.status, 403);

  const hostileOrigin = await fetch(handle.url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, origin: 'https://attacker.example', accept: 'application/json, text/event-stream', 'content-type': 'application/json' },
    body: '{}'
  });
  assert.equal(hostileOrigin.status, 403);

  const transport = new StreamableHTTPClientTransport(new URL(handle.url), {
    requestInit: { headers: { authorization: `Bearer ${token}` } }
  });
  const client = new Client({ name: 'xtend-http-contract', version: '0.1.0' });
  await client.connect(transport);
  t.after(() => client.close());
  assert.ok((await client.listTools()).tools.some((tool) => tool.name === 'xtend_knowledge_search'));
});
