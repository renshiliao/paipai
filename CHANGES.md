# 改动标注（Changes）—— AGPL §5(a) 明示：改了什么、何时改的

改动日期：2026-11-27。改动人：任世燎。
基线：来件原件（发版入库批次 doc_854198075111，解包树与 tar.gz 21 件字节级
一致在案）。改前备份留内部工程档案（不随开源仓）。

## 一、发版仓库改动（本仓形态，2026-11-27 开源发版整理）

| 件 | 改动 | 性质 |
|---|---|---|
| `LICENSE` | GNU AGPL-3.0 官方原文逐字复制，未改动（sha256=0d96a4ff…079abcb0） | 未改动 |
| `README.md` | 发版门面补齐：文书版＋人读版双版、使用守则四条、安装令、定位句（三柱之三·派单模式）、实测留档、未达如实；出处署名 | 文书 |
| `lib/dispatch.js` `server.js` `test/self-test.mjs` `examples/run-all.mjs` | 源文件头加 SPDX 标识行＋署名行（4/4 件） | 头标注 |
| `lib/dispatch.js` | 内部人事代号改角色名（甲方）；内部组织称谓中性化（密钥保管方）；示例 scheme 中性化（`keyref://`）；注释内内部口径引用泛化——逻辑零改 | 文本脱敏 |
| `server.js` `test/self-test.mjs` `examples/run-all.mjs` `mcp-socket.json` | 同上中性化（合成示例值与说明文字），测试判据零改 | 文本脱敏 |
| `COPYRIGHT.md` `CHANGES.md`（新增） | 合规三件补齐 | 新件 |

## 二、口径变更（如实标注）

1. 署名口径：按发版规矩统一署名任世燎（源文件头 SPDX＋COPYRIGHT）。
2. 对外货架名＝派单模式（开源三柱之三）；本件名 dispatch（派单框架）；
   仓名终名（dispatch-playbook／dispatch-mcp）待裁。
3. 「坑账回流」为第④步产品面命名（产品概念词）——与内部行话词表撞词，
   按逐 hit 上下文判定登记放行，改词与否候裁（见入库备料报告待裁一号）。
4. 测试判据零改：自测台断言一字未动（仅合成示例值中性化），脱敏后复跑
   7 绿 0 红（与改前一致，功能零删减）。

## 三、改动文件清单（AGPL §5(c) 整体件声明）

上述全部件作为**单一整体作品**按 AGPL-3.0 授权。逐文件改动标注在各源文件头
（SPDX 行＋本表），日期 2026-11-27。

## 四、2026-11-27 改名（家主拍板）—— 派派 / paipai

同物异名四面并一，产品名统一「派派」（英文 paipai）。本节只动门牌，接口一字未动：

| 面 | 改前 | 改后 |
|---|---|---|
| 产品名（货架卡名/README/网站） | 派单模式／派单框架 | 派派 |
| 仓名（GitHub 仓） | renshiliao/dispatch | renshiliao/paipai（旧链 GitHub 自动跳转） |
| package.json 名／bin 命令 | dispatch-mcp | paipai |
| README 门牌互链行 | github.com/renshiliao/dispatch | github.com/renshiliao/paipai |

**接口即契约，一字未动（改了会破兼容）**：MCP 工具名（`dispatch_register`/`dispatch_assign`/
`dispatch_collect`/`dispatch_pitflow`/`dispatch_list`/`roster_enroll`/`info`/`status`）、
`serverInfo.name='dispatch'`、`mcp-socket.json` 整件（`mcp-cha-zuo/1`、`name: dispatch`、
`dispatch.*` capabilities）、调令 schema `diao-ling/1`、`DISPATCH_DIR`、源文件名
（`lib/dispatch.js`）与全部源件字节零改动。本节改名只动四件门面：`README.md`/
`COPYRIGHT.md`/`package.json`/`CHANGES.md`。改后自测台复跑 7 绿 0 红、示例真跑 exit 0（与改前同）。
上述第二节「仓名终名待裁」一条至本节定案销账。
