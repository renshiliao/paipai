# 版权声明（Copyright Notice）—— dispatch（派单框架）

Copyright (C) 2026 任世燎。

## 一、许可条款

本仓库按 **GNU Affero General Public License v3**（AGPL-3.0）授权使用、修改、
分发。全文见 `LICENSE`（GNU 官方原文逐字复制，sha256=
0d96a4ff68ad6d4b6f1f30f713b18d5184912ba8dd389f86aa7710db079abcb0）。

- 本程序是自由软件：可再分发/修改，依据 GNU AGPL v3；
- 本程序不带任何担保（适销性/特定用途适用性均不担保），详见 LICENSE §15-16；
- **网络交互条款（AGPL §13）生效**：MCP 网络服务件——任何人修改后通过网络与之
  交互的用户，有权拿到其对应源码。

## 二、开源边界（开源的是结构）

**开源（本仓库=结构白箱）**：工单引擎（状态机「建单→派活→收活→完结／回流」、
调令 diao-ling/1、执行账 JSONL）、花名册能力匹配、收活必带件与置信度口径、
坑账回流三杀（杀因/杀根/杀复发）、MCP Server 封装与插座条目、自测台与真跑示例。

**不开源（任何分发物不含以下内容）**：配套的方法论本体与家内数据件
（内部工法、过程账目、内部档案）——一概不随包；给工人配什么方法，各团队自订。

## 三、第三方件

运行时**零第三方依赖**（Node ≥ 16 标准库）。协议面按 Model Context Protocol
规范手写实现，未使用官方 SDK。net_access=none（不出网）。无遥测；
凭证只收 `key_ref` 指针，零凭据持有。

## 四、署名与改动

改动件均带改动标注（源码头 SPDX 行 + `CHANGES.md`），符合 AGPL §5(a)(b)。
署名格式：

    dispatch
    Copyright (C) 2026 任世燎
    SPDX-License-Identifier: AGPL-3.0-only

## 五、随包说明件

`README.md`（文书版＋人读版＋使用守则四条＋安装令）、`mcp-socket.json`
（插座条目 mcp-cha-zuo/1）、`examples/run-all.mjs`（真跑示例）、
`test/self-test.mjs`（自测台，含 MCP 真跑）。
