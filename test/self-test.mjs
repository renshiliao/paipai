// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 任世燎
// 派派 · 自测台 —— 四步一扇门状态机 + key 红线 + MCP 真跑
// 跑法：node test/self-test.mjs（全绿 exit 0）
import { strict as assert } from 'node:assert';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { createDispatch } = require('../lib/dispatch.js');

let pass = 0, fail = 0;
function T(name, fn) {
  return Promise.resolve().then(fn).then(() => { pass += 1; console.log('[PASS]', name); })
    .catch((e) => { fail += 1; console.log('[FAIL]', name, '→', String(e.message || e).slice(0, 200)); });
}

const dir = mkdtempSync(join(tmpdir(), 'dispatch-test-'));
const eng = createDispatch({ dir });

await T('查册→建单：能力匹配/无人能办如实报', () => {
  eng.enroll({ name: 'gh', capabilities: ['git.pr.open'] });
  const r = eng.register({ task: '开 PR', need: ['git.pr.open'] });
  assert.equal(r.matched_workers.includes('gh'), true);
  const r2 = eng.register({ task: '飞天', need: ['飞天'] });
  assert.equal(r2.note.includes('局里无人能办'), true);
});

await T('派活：状态机 + 调令 diao-ling/1 + key_ref', () => {
  const { order } = eng.register({ task: '写文档' });
  const a = eng.assign({ order_id: order.order_id, worker: 'docx', tools: ['docx.write'], key_ref: 'keyref://key/docx' });
  assert.equal(a.order.status, '派活');
  assert.equal(a.调令.schema, 'diao-ling/1');
  assert.equal(a.调令.via, 'mcp');
  assert.equal(a.调令.server, 'docx');
  assert.equal(a.调令.tool, 'write');
});

await T('key 红线：明文 key 拒收（只收 key_ref）', () => {
  const { order } = eng.register({ task: '红线单' });
  assert.throws(() => eng.assign({ order_id: order.order_id, worker: 'x', key: 'ghp_abc123' }), /密钥不落/);
});

await T('收活：零件「已完成」拒收 + 状态机不许跳步', () => {
  const { order } = eng.register({ task: '收活单' });
  // 跳步：没派就收 → 拒
  let err0 = null;
  try { eng.collect({ order_id: order.order_id, deliverables: ['f.md'] }); } catch (e) { err0 = e; }
  assert.ok(err0 instanceof Error && /没派过活/.test(err0.message));
  eng.assign({ order_id: order.order_id, worker: 'w1' });
  // 派了但零件数 → 拒（收活必带件）
  let err = null;
  try { eng.collect({ order_id: order.order_id, deliverables: [] }); } catch (e) { err = e; }
  assert.ok(err instanceof Error && /收活必带件/.test(err.message));
  const c = eng.collect({ order_id: order.order_id, deliverables: ['产物/f.md'], confidence: 0.9, evidence: 'sha256 对账' });
  assert.equal(c.order.status, '完结');
});

await T('坑账回流：三杀缺项拒收，齐了入账', () => {
  const { order } = eng.register({ task: '回流单' });
  assert.throws(() => eng.pitflow({ order_id: order.order_id, kill_cause: 'a' }), /三杀缺项/);
  const p = eng.pitflow({ order_id: order.order_id, kill_cause: '因', kill_root: '根', kill_prevent: '防', tag: '测试' });
  assert.equal(p.order.status, '回流');
  assert.equal(p.order.pits.length, 1);
  // 回流后可再派
  const again = eng.assign({ order_id: order.order_id, worker: 'w2' });
  assert.equal(again.order.status, '派活');
});

await T('执行账：每步各有账行', () => {
  const rows = readFileSync(eng.ledgerFile(), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const steps = new Set(rows.map((r) => r.step));
  assert.ok(steps.has('查册/建单') && steps.has('派活') && steps.has('收活') && steps.has('坑账回流') && steps.has('花名册登记'));
  assert.ok(rows.length >= 8);
});

// ── MCP 真跑 ──
await T('MCP 真跑：initialize → tools/list → 四步走一回', async () => {
  const child = spawn(process.execPath, [join(ROOT, 'server.js')], {
    env: { ...process.env, DISPATCH_DIR: dir }, stdio: ['pipe', 'pipe', 'pipe'],
  });
  const replies = new Map();
  let buf = '';
  child.stdout.on('data', (b) => {
    buf += b.toString();
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      const m = JSON.parse(line);
      if (m.id !== undefined) replies.set(m.id, m);
    }
  });
  const rpc = (method, params, id) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  const wait = (id, ms = 8000) => new Promise((res, rej) => {
    const t0 = Date.now();
    const tick = setInterval(() => {
      if (replies.has(id)) { clearInterval(tick); res(replies.get(id)); }
      else if (Date.now() - t0 > ms) { clearInterval(tick); rej(new Error('RPC 超时 id=' + id)); }
    }, 25);
  });

  rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'self-test', version: '0' } }, 1);
  const init = await wait(1);
  assert.equal(init.result.serverInfo.name, 'dispatch');

  rpc('tools/list', {}, 2);
  const list = await wait(2);
  assert.equal(list.result.tools.length, 8);

  rpc('tools/call', { name: 'dispatch_register', arguments: { task: 'MCP 四步真跑', need: ['mcp'] } }, 3);
  const reg = await wait(3);
  const oid = reg.result.structuredContent.order.order_id;

  rpc('tools/call', { name: 'dispatch_assign', arguments: { order_id: oid, worker: 'demo', tools: ['demo.run'], key_ref: 'keyref://key/demo' } }, 4);
  const asg = await wait(4);
  assert.equal(asg.result.structuredContent.order.status, '派活');

  rpc('tools/call', { name: 'dispatch_collect', arguments: { order_id: oid, deliverables: ['out/report.md'], confidence: 0.8 } }, 5);
  const col = await wait(5);
  assert.equal(col.result.structuredContent.order.status, '完结');

  rpc('tools/call', { name: 'dispatch_collect', arguments: { order_id: oid, deliverables: [] } }, 6);
  const col2 = await wait(6);
  assert.equal(col2.result.isError, true, '零件拒收 fail loudly');

  rpc('tools/call', { name: 'dispatch_assign', arguments: { order_id: oid, worker: 'demo', key: 'sk-secret' } }, 7);
  const keyLeak = await wait(7);
  assert.equal(keyLeak.result.isError, true, '明文 key 拒收');
  assert.ok(!JSON.stringify(keyLeak).includes('sk-secret'), '错误回文零 key 原文');

  child.kill('SIGKILL');
});

rmSync(dir, { recursive: true, force: true });
console.log(`\n=== 派派自测：${pass} 绿 ${fail} 红 ===`);
process.exit(fail ? 1 : 0);
