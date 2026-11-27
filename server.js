#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 任世燎
// paipai MCP Server —— 派派标准接口（mcp-cha-zuo/1 插座契约）
// 查册 → 派活 → 收活 → 坑账回流（四步一扇门，每步各有执行账）；调令 diao-ling/1 + MCP 扩展。
// 契约随身：info|status 自省必备、--json 机器可读（CLI 口）、fail loudly 附自纠、收活必带件、凭证只收 key_ref。
'use strict';
const path = require('path');
const { createDispatch } = require('./lib/dispatch.js');

const SERVER_INFO = { name: 'dispatch', version: '0.1.0', schema: 'diao-ling/1' };
const DATA_DIR = process.env.DISPATCH_DIR || path.join(__dirname, 'data');
const eng = createDispatch({ dir: DATA_DIR });

const TOOLS = [
  { name: 'info', description: '自省：件名/版本/schema/工具清单', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'status', description: '自省：工单各状态计数/花名册/执行账位置', inputSchema: { type: 'object', properties: {}, required: [] } },
  {
    name: 'roster_enroll', description: '花名册登记（工具/员工卡：name+capabilities），查册用',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' }, capabilities: { type: 'array', items: { type: 'string' } }, note: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'dispatch_register', description: '①查册→建单：能力匹配（不匹配如实报「局里无人能办」，不硬凑）',
    inputSchema: {
      type: 'object',
      properties: { task: { type: 'string' }, caller: { type: 'string' }, need: { type: 'array', items: { type: 'string' } }, note: { type: 'string' } },
      required: ['task'],
    },
  },
  {
    name: 'dispatch_assign', description: '②派活：出调令（diao-ling/1 + via:mcp）。凭证只收 key_ref，明文 key 拒收（红线）',
    inputSchema: {
      type: 'object',
      properties: {
        order_id: { type: 'string' }, worker: { type: 'string' },
        tools: { type: 'array', items: { type: 'string' }, description: 'server.tool 形式' },
        key_ref: { type: 'string', description: '如 keyref://key/xxx——只存指针，key 本体不出局' },
        instruction: { type: 'string' },
      },
      required: ['order_id', 'worker'],
    },
  },
  {
    name: 'dispatch_collect', description: '③收活：必带件（零件「已完成」式=置信度 0 拒收），置信度+证据+结论',
    inputSchema: {
      type: 'object',
      properties: {
        order_id: { type: 'string' }, deliverables: { type: 'array', items: { type: 'string' }, description: '真产物路径/数据' },
        confidence: { type: 'number', description: '0-1' }, evidence: { type: 'string' }, conclusion: { type: 'string' },
      },
      required: ['order_id', 'deliverables'],
    },
  },
  {
    name: 'dispatch_pitflow', description: '④坑账回流：三杀（杀因/杀根/杀复发）必填，失败 100% 入账',
    inputSchema: {
      type: 'object',
      properties: { order_id: { type: 'string' }, kill_cause: { type: 'string' }, kill_root: { type: 'string' }, kill_prevent: { type: 'string' }, tag: { type: 'string' } },
      required: ['order_id', 'kill_cause', 'kill_root', 'kill_prevent'],
    },
  },
  {
    name: 'dispatch_list', description: '在册工单（可按状态滤）',
    inputSchema: { type: 'object', properties: { status: { type: 'string' }, limit: { type: 'number' } }, required: [] },
  },
];

async function callTool(name, args = {}) {
  switch (name) {
    case 'info':
      return { ...SERVER_INFO, license: 'AGPL-3.0', mcp_socket: 'mcp-cha-zuo/1', tools: TOOLS.map((t) => t.name), key_policy: '只收 key_ref 零 key 本体（key 三层分权）', net_access: 'none' };
    case 'status':
      return eng.status();
    case 'roster_enroll':
      return eng.enroll(args);
    case 'dispatch_register':
      return eng.register(args);
    case 'dispatch_assign':
      return eng.assign(args);
    case 'dispatch_collect':
      return eng.collect(args);
    case 'dispatch_pitflow':
      return eng.pitflow(args);
    case 'dispatch_list':
      return eng.list(args);
    default:
      throw new Error(`未知工具 ${name}——自纠：tools/list 查在册工具（本件不私加）`);
  }
}

function send(obj) { process.stdout.write(JSON.stringify(obj) + '\n'); }

async function handleRpc(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') {
    return send({ jsonrpc: '2.0', id, result: { protocolVersion: (params && params.protocolVersion) || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: SERVER_INFO.name, version: SERVER_INFO.version } } });
  }
  if (method === 'notifications/initialized' || method === 'notifications/cancelled') return;
  if (id === undefined || id === null) return;
  if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} });
  if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
  if (method === 'tools/call') {
    try {
      const out = await callTool(params && params.name, (params && params.arguments) || {});
      return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out, isError: false } });
    } catch (e) {
      return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: String(e.message || e).slice(0, 500) }], isError: true } });
    }
  }
  return send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}——自纠：本件只认 initialize/tools/list/tools/call/ping` } });
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--json')) {
    const tool = argv.filter((a) => a !== '--json')[0];
    let args = {};
    try { args = JSON.parse(argv.filter((a) => a !== '--json')[1] || '{}'); } catch (e) {
      console.error('参数不是合法 JSON——自纠：node server.js --json dispatch_list "{}"');
      process.exit(1);
    }
    callTool(tool, args).then((out) => console.log(JSON.stringify({ ok: true, tool, out }, null, 2)))
      .catch((e) => { console.log(JSON.stringify({ ok: false, tool, error: String(e.message || e) }, null, 2)); process.exit(1); });
    return;
  }
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      try { handleRpc(JSON.parse(line)); } catch (e) { /* 坏行跳过，fail 不拖垮主循环 */ }
    }
  });
  process.stdin.on('end', () => process.exit(0));
}

main();
