// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 任世燎
// 派派 · 真跑示例 —— 四步一扇门走一回（查册→派活→收活→坑账回流）
// 跑法：node examples/run-all.mjs
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createDispatch } = require('../lib/dispatch.js');

const dir = mkdtempSync(join(tmpdir(), 'dispatch-demo-'));
const eng = createDispatch({ dir });

console.log('═══ 派派 真跑示例（四步一扇门）═══\n');

// 花名册登记（查册用）
console.log('① 花名册登记:', eng.enroll({ name: 'time-organ', capabilities: ['time.next_run', 'clock.now'] }).ok ? 'time-organ 入册' : '失败');

// 查册 → 建单
const reg = eng.register({ task: '给定时任务算下次触发时刻', caller: '甲方', need: ['time.next_run'] });
console.log('② 查册→建单:', reg.order.order_id, '|', reg.note, '| 匹配:', reg.matched_workers.join('/') || '（无）');

// 派活（调令：via mcp，凭证只给 key_ref）
const asg = eng.assign({
  order_id: reg.order.order_id, worker: 'time-organ',
  tools: ['time-organ.time_next_run'], key_ref: 'keyref://key/time-ntp',
  instruction: '算定点 08:30 的下一次',
});
console.log('③ 派活→调令:', JSON.stringify(asg.调令, null, 2));

// 收活（必带件 + 置信度 + 证据）
const col = eng.collect({
  order_id: reg.order.order_id,
  deliverables: ['data/next-run.json'], confidence: 0.9,
  evidence: 'time-organ MCP tools/call 真回 2026-11-28T08:30:00+08:00',
  conclusion: '下次触发时刻已算出',
});
console.log('④ 收活:', col.verdict, '| 状态:', col.order.status);

// 坑账回流（三杀）+ 回流后再派
const pit = eng.pitflow({
  order_id: reg.order.order_id,
  kill_cause: 'demo 单收活后发现时区没写清', kill_root: '字段契约缺时区标注', kill_prevent: '契约表加时区字段+自测断言', tag: 'demo',
});
console.log('⑤ 坑账回流:', pit.order.status, '| 三杀在案', pit.order.pits.length, '条');

console.log('\n⑥ 状态总账:', JSON.stringify(eng.status()));
console.log('   执行账:', eng.ledgerFile());
console.log('\n═══ 示例跑完 ═══');
