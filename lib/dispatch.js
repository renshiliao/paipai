// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 任世燎
// 派派 · 工单引擎 —— 查册 → 派活 → 收活 → 坑账回流（四步一扇门，每步各有执行账）
// 契约（diao-ling/1 + MCP 扩展）：调令带 {via:'mcp', server, tool, key_ref}；凭证只收 key_ref 零 key 本体（红线）。
// 状态机：建单 → 派活 → 收活 → 完结；坑账回流可从任何状态进（回流后可再派）。
'use strict';
const fs = require('fs');
const path = require('path');

const NOW = () => new Date().toISOString(); // 机器注入，禁手编
const STATUS = ['建单', '派活', '收活', '完结', '回流'];

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

function createDispatch({ dir } = {}) {
  if (!dir) throw new Error('createDispatch: 必须给 dir——自纠：传一个可写目录');
  ensureDir(dir);
  const ordersFile = path.join(dir, '工单库.json');
  const rosterFile = path.join(dir, '花名册.json');
  const dayStamp = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  };
  const ledgerFile = () => path.join(dir, `派单账-${dayStamp()}.jsonl`);

  const readJson = (f, dft) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return dft; } };
  const writeJson = (f, v) => { ensureDir(dir); fs.writeFileSync(f, JSON.stringify(v, null, 2)); };

  function orders() { return readJson(ordersFile, []); }
  function saveOrders(list) { writeJson(ordersFile, list); }
  function roster() { return readJson(rosterFile, []); }
  function saveRoster(list) { writeJson(rosterFile, list); }

  /** 执行账：每步一行 */
  function account(order_id, step, detail) {
    const row = { ts: NOW(), order_id, step, ...detail };
    try { ensureDir(dir); fs.appendFileSync(ledgerFile(), JSON.stringify(row) + '\n'); } catch (e) { /* 账落不下不拖垮 */ }
    return row;
  }

  function getOrder(order_id) {
    const o = orders().find((x) => x.order_id === order_id);
    if (!o) throw new Error(`工单 ${order_id} 不在册——自纠：先 dispatch_register 建单，或 dispatch_list 查在册单号`);
    return o;
  }

  function update(order_id, patch) {
    const list = orders();
    const i = list.findIndex((x) => x.order_id === order_id);
    if (i < 0) throw new Error(`工单 ${order_id} 不在册——自纠：先 dispatch_register`);
    list[i] = { ...list[i], ...patch, updated: NOW() };
    saveOrders(list);
    return list[i];
  }

  // ① 查册 → 建单（capabilities 能力匹配，不匹配如实报「局里无人能办」，不硬凑）
  function register({ task, caller = '甲方', need = [], note = '' } = {}) {
    if (!task) throw new Error('dispatch_register: task 必填——自纠：{"task":"要干的活"}');
    const list = orders();
    const order_id = `w-${dayStamp()}-${String(list.length + 1).padStart(4, '0')}`;
    const matched = roster().filter((w) => (need || []).every((c) => (w.capabilities || []).includes(c)));
    const o = {
      order_id, task, caller, need: need || [], note,
      status: '建单', created: NOW(), updated: NOW(),
      matched_workers: matched.map((w) => w.name),
      steps: [{ step: '查册/建单', at: NOW(), detail: matched.length ? `能力匹配 ${matched.map((w) => w.name).join('/')}` : (need.length ? '局里无人能办（如实，不硬凑）' : '未指定能力，待派') }],
      key_refs: [], deliverables: [], pits: [],
    };
    list.push(o);
    saveOrders(list);
    account(order_id, '查册/建单', { task, caller, need, matched: o.matched_workers });
    return { ok: true, order: o, matched_workers: o.matched_workers, note: matched.length || !need.length ? '在局可派' : '局里无人能办（不硬凑）' };
  }

  // ② 派活（出调令 diao-ling/1 + MCP 扩展；只收 key_ref 零 key 本体）
  function assign(args) {
    const { order_id, worker, tools = [], key_ref = null, instruction = '' } = args || {};
    const o = getOrder(order_id);
    if (o.status !== '建单' && o.status !== '回流') {
      throw new Error(`工单 ${order_id} 现为「${o.status}」，不能再派——自纠：四步一扇门，收活/完结的单要再来先回流或建新单`);
    }
    if (!worker) throw new Error('dispatch_assign: worker 必填——自纠：{"worker":"工具/员工名"}');
    // key 三层分权红线：明文 key 一律拒收，只走 key_ref
    for (const k of Object.keys(args || {})) {
      if (/^(key|token|secret|password|apikey|api_key)$/i.test(k)) {
        throw new Error('密钥不落：只收 key_ref（如 keyref://key/xxx），key 本体归用户/密钥保管方——自纠：把明文钥匙换成 key_ref');
      }
    }
    const 调令 = {
      schema: 'diao-ling/1', order_id, worker, tools,
      via: 'mcp', server: (tools[0] || '').includes('.') ? String(tools[0]).split('.')[0] : null,
      tool: (tools[0] || '').includes('.') ? String(tools[0]).split('.').slice(1).join('.') : (tools[0] || null),
      key_ref, instruction, at: NOW(),
    };
    const o2 = update(order_id, {
      status: '派活', worker, key_refs: key_ref ? [...new Set([...(o.key_refs || []), key_ref])] : o.key_refs,
      steps: [...o.steps, { step: '派活', at: 调令.at, detail: `派给 ${worker}（${tools.join('/') || '无工具'}）` }],
      调令,
    });
    account(order_id, '派活', { worker, tools, key_ref, instruction: String(instruction).slice(0, 200) });
    return { ok: true, order: o2, 调令 };
  }

  // ③ 收活（收活必带件；"已完成"式空手汇报=置信度 0，拒收）
  function collect({ order_id, deliverables = [], confidence = null, evidence = '', conclusion = '' } = {}) {
    const o = getOrder(order_id);
    if (o.status !== '派活') {
      throw new Error(`工单 ${order_id} 现为「${o.status}」，没派过活不能收——自纠：先 dispatch_assign 再收活`);
    }
    if (!Array.isArray(deliverables) || deliverables.length === 0) {
      throw new Error('收活必带件：零件数的「已完成」式汇报置信度 0，拒收——自纠：deliverables 交真产物路径/数据');
    }
    const conf = confidence == null ? 0 : Number(confidence);
    const o2 = update(order_id, {
      status: conf >= 0.6 ? '完结' : '收活',
      deliverables: deliverables.map((d) => (typeof d === 'string' ? { item: d } : d)),
      confidence: conf, evidence, conclusion,
      steps: [...o.steps, { step: '收活', at: NOW(), detail: `${deliverables.length} 件，置信度 ${conf}` }],
    });
    account(order_id, '收活', { count: deliverables.length, confidence: conf, evidence: String(evidence).slice(0, 200) });
    return { ok: true, order: o2, verdict: conf >= 0.6 ? '完结' : '收活待核（置信度<0.6）' };
  }

  // ④ 坑账回流（三杀：杀因/杀根/杀复发——失败 100% 入坑账）
  function pitflow({ order_id, kill_cause, kill_root, kill_prevent, tag = '' } = {}) {
    const o = getOrder(order_id);
    if (!kill_cause || !kill_root || !kill_prevent) {
      throw new Error('坑账三杀缺项：杀因/杀根/杀复发 三样必填——自纠：{"kill_cause":"…","kill_root":"…","kill_prevent":"…"}');
    }
    const pit = { at: NOW(), kill_cause, kill_root, kill_prevent, tag };
    const o2 = update(order_id, {
      status: '回流', pits: [...(o.pits || []), pit],
      steps: [...o.steps, { step: '坑账回流', at: pit.at, detail: `三杀入账（${tag || '无标签'}）` }],
    });
    account(order_id, '坑账回流', { kill_cause, kill_root, kill_prevent, tag });
    return { ok: true, order: o2, pit };
  }

  function list({ status, limit = 50 } = {}) {
    let all = orders();
    if (status) all = all.filter((o) => o.status === status);
    return { ok: true, orders: all.slice(-limit), count: all.length };
  }

  /** 花名册：登记工具/员工卡（name + capabilities），查册用 */
  function enroll({ name, capabilities = [], note = '' } = {}) {
    if (!name) throw new Error('roster_enroll: name 必填——自纠：{"name":"工具名","capabilities":["能力词"]}');
    const list2 = roster().filter((w) => w.name !== name);
    list2.push({ name, capabilities, note, at: NOW() });
    saveRoster(list2);
    account('-', '花名册登记', { name, capabilities });
    return { ok: true, roster: list2 };
  }

  function status() {
    const all = orders();
    const by = {};
    for (const s of STATUS) by[s] = all.filter((o) => o.status === s).length;
    return { ok: true, schema: 'diao-ling/1', orders: all.length, by_status: by, roster: roster().length, ledger: ledgerFile() };
  }

  return { register, assign, collect, pitflow, list, enroll, status, orders, roster, ledgerFile, ordersFile, rosterFile };
}

module.exports = { createDispatch, STATUS };
