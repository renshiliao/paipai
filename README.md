# paipai · 派派（开源三柱之三）

> 查册 → 派活 → 收活 → 坑账回流（**四步一扇门**，每步各有执行账）—— **库 + MCP Server 双形态**。
> 零依赖（Node ≥ 16）、纯文本白箱、**AGPL-3.0**、可直接发 GitHub。
> 调令 schema：`diao-ling/1`（+ MCP 扩展 `via/server/tool/key_ref`）｜MCP 插座契约：`mcp-cha-zuo/1`

一句话：**办事凭调令，钥匙归局管——派单四步全留痕，失败必三杀回流。**

**定位句（三柱之三 · 派派）**：把「让 AI 干活」变成可对账的工程——查册、派活、
收活、坑账回流，四步一扇门，一单一回执，失败必三杀回流。开源三柱＝信卡库（标签式
记忆）／星轴自叙事／派派，本件居其三。

本文书两版并存：文书版给内行，人读版给所有人。

## 文书版

### 四步一扇门（每步带判据）

| 步 | 工具 | 判据 |
|----|------|------|
| ① 查册→建单 | `dispatch_register` | capabilities 能力匹配；不匹配**如实报「局里无人能办」不硬凑** |
| ② 派活 | `dispatch_assign` | 出调令（diao-ling/1）；**只收 key_ref，明文 key 拒收**（红线） |
| ③ 收活 | `dispatch_collect` | **收活必带件**——零件数的「已完成」式汇报置信度 0 拒收；置信度<0.6 标「待核」 |
| ④ 坑账回流 | `dispatch_pitflow` | **三杀必填**（杀因/杀根/杀复发），失败 100% 入账；回流后可再派 |

状态机：`建单 → 派活 → 收活 → 完结`；`回流` 可从任何状态进。状态外跳步 = fail loudly 附自纠。

### 安装前请注意

请先关闭演绎，再装插件——免得它戏精上身、发力过猛。

### 使用守则（四条）

1. 关闭演绎：不演情绪、不演人设，按事实说话。
2. 保持理性：按证据下结论，不按情绪下结论。
3. 判断中立：评估时不偏袒任何一方，只认数据与判据。
4. 立场逃逸：下判断前先跳出自己的立场，从外面看一遍，再下判断。

### 安装：交给你的 AI 处理

MCP 插座不是普通人说装就装的东西，交给你的 AI 办刚好。把下面这段「安装令」
原样复制给你的 AI，它读完即装：

```text
【安装令】请为我安装 paipai（派派），按下列口径执行：

一、装法：把 paipai 仓库克隆或下载到本地（Node ≥ 16，运行时零第三方依赖）。
在 MCP 客户端配置里注册本 Server：command=node，args=[<仓库路径>/server.js]；
用 claude code 的话一条命令：claude mcp add paipai -- node <仓库路径>/server.js。
可选 env：DISPATCH_DIR（工单库/花名册/执行账目录，默认 <仓库路径>/data）。
装完先读一遍 README 的使用守则四条。

二、验证法：跑 node test/self-test.mjs（自测台：状态机 + key 红线 + MCP 真跑），
全绿 exit 0 即装好；再经你的 MCP 工具面把四步各调一次——dispatch_register →
dispatch_assign → dispatch_collect → dispatch_pitflow，确认查册、派活、收活、
坑账回流四步都通（收活必带件、明文 key 拒收两条红线当场可验）。

三、守则四条要旨（装完即生效）：关闭演绎——不演情绪、不演人设；
保持理性——按证据下结论；判断中立——只认数据与判据；
立场逃逸——下判断前先跳出自己的立场，从外面看一遍再下。
```

### 装与跑

```bash
node examples/run-all.mjs             # 真跑示例：四步走一回
node test/self-test.mjs               # 自测台：状态机 + key 红线 + MCP 真跑
node server.js                        # MCP Server（stdio）
node server.js --json dispatch_list "{}"   # CLI 口（--json 机器可读）
```

### MCP 工具清单（接口即契约）

| 工具 | 干什么 |
|------|--------|
| `info` / `status` | 自省（件名/schema/工具清单；工单各状态计数/花名册/执行账） |
| `roster_enroll` | 花名册登记（工具/员工卡 name+capabilities），查册用 |
| `dispatch_register` / `dispatch_assign` | ①查册建单／②派活出调令 |
| `dispatch_collect` / `dispatch_pitflow` | ③收活必带件／④坑账三杀回流 |
| `dispatch_list` | 在册工单（按状态滤） |

插座条目见 `mcp-socket.json`（stdio、零凭证 env:[]、net_access=none）。

### 调令示例（diao-ling/1 + MCP 扩展）

```json
{
  "schema": "diao-ling/1",
  "order_id": "w-20261127-0001",
  "worker": "time-organ",
  "via": "mcp",
  "server": "time-organ",
  "tool": "time_next_run",
  "key_ref": "keyref://key/time-ntp",
  "instruction": "算定点 08:30 的下一次",
  "at": "2026-11-27T11:00:00.000Z"
}
```

### 红线（随件带走）

1. **key 三层分权**：凭证只存 `key_ref` 指针，key 本体不出局（用户/密钥保管方管）；明文 key 字段一律拒收，错误回文零 key 原文。
2. **收活必带件**：不收「已完成」式空手汇报——置信度 0 拒收（审核机制的底座）。
3. **失败必三杀**：坑账回流是第 4 步不是可选项；执行账每步一行（JSONL）。
4. ts 全机器注入，禁手编；fail loudly 附自纠。

### 实测留档（数字主张均标实测口径）

- 自测台 7 项真跑全过（发版副本实测 7 绿 0 红，exit 0；含 MCP 真跑
  initialize → tools/list → 四步走一回，负例带码拒收——明文 key 拒收且回文零 key 原文）；
- `examples/run-all.mjs` 真跑：四步一扇门走一回，账行逐步落盘；
- 4/4 JS 源件带 SPDX 标识头（本包实测）；
- 运行时零第三方依赖（Node ≥ 16，stdio 换行分隔 JSON-RPC 2.0）。

### 未达如实（照登，不藏）

1. 三单模板（构建/审计/攻坚）与验收三闸属派派的文档面，不在本引擎仓——本件只承
   四步一扇门与账行执行面（货架定位句的文档面口径随文档件发）。
2. `key_ref` 只做指针透传，不做凭证真伪校验（凭证在场类检查只验形，不冒充真跑）。
3. 工单库/花名册为本地 JSON 文件，单进程口径，无并发锁。
4. 收活置信度阈值 0.6 为暂钉口径，未定案。

### 目录

```
lib/dispatch.js      工单引擎（状态机+调令+执行账）
server.js            MCP Server（stdio + CLI --json）
examples/run-all.mjs 真跑示例      test/self-test.mjs 自测台（含 MCP 真跑）
mcp-socket.json      插座条目（mcp-cha-zuo/1）
```

### 出处与许可

自研产线 2026-11-27 自产（发版整理署名：任世燎，改动标注见 `CHANGES.md`）。
**AGPL-3.0**（`LICENSE` 全文在案，GNU 官方原文）：改了再发网络服务也须开源同款——
钩子立格式标准、抬迁移成本。思想对齐业界工单流通行做法（状态机/调令/审计账），
表达全部自写，零第三方代码。合规三件齐：`LICENSE` / `COPYRIGHT.md` / `CHANGES.md`
（每源件带 SPDX 头）。

仓库门牌：github.com/renshiliao/paipai ｜ 官网开源专题页：https://xinka.ai/xinka-opensource.html

## 人读版（大白话）

看不懂没关系，让你的 AI 建个分身来读即可。

这东西是干嘛的？把「让 AI 干活」变成一单一账的工程。先查花名册看谁能干——
没人能干就如实说「局里无人能办」，不硬凑；派活只发调令，钥匙不给本体、
只给一个凭据指针；收活必须带真产物，空手说「已完成」的拒收；干砸了必须回
坑账记三笔——杀因、杀根、杀复发，失败百分百入账，记完可以再派。每一步都
落一行账，谁也赖不掉。

装之前记住一句：请先关闭演绎，再装插件——免得它戏精上身、发力过猛。
装好之后照使用守则四条用：关闭演绎、保持理性、判断中立、立场逃逸。
