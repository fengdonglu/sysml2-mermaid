# 会话交接

[English](SESSION-HANDOFF.md) | 中文

> 目的：把上一轮工作会话的上下文带进本项目，便于在本目录新开 opencode 会话继续工作。

## 缘起

本项目（`sysml2-mermaid`）是在一段长会话的末尾启动的，那段会话完成了它的姊妹项目 **`mermaid-opm`**——一个把 ISO 19450 **OPM/OPL** 渲染为对象-过程图的 Mermaid 外部图插件 + CLI + LSP + VS Code 扩展。该项目已完成（v0.1.0），发布在 GitHub（`fengdonglu/mermaid-opm`），带 CI 流水线、GitHub Pages 演示，以及已发布的 VS Code VSIX。

那段会话的完整原始记录保存在本地（gitignore）：`reference/opencode-session-opm-opl.json`（用 `opencode export` 导出）。更早的 SysML v2 设计讨论也在本地：`reference/yuanbao-sysml2-discussion.txt`。

## `mermaid-opm` 确立的模式（复用对象）

- **文本是唯一真相源；图表是实时投影。** 不持久化布局，不做图形编辑。
- **DOM-free 渲染核心**：`parser → model → layout → render(scene) → SVG 字符串`，所有入口共用。
- **多个薄入口**：Mermaid 外部图插件、CLI（`opm2svg`）、库 API；后期加入语言服务器与 VS Code 扩展。
- **工具链/约定**：TypeScript ESM 且相对导入带 `.js` 后缀、vitest、esbuild、LSP/VS Code 包用 npm workspaces、代码与文档一律英文且以 `*.zh.md` 存中文副本、Conventional Commits、TDD，以及由子智能体驱动的 AI 辅助 "Vibe Coding" 流程。
- **发布**：MIT、`fengdonglu`；CI（构建/测试）、GitHub Pages（演示）、Release 工作流附带 VS Code VSIX。

## `sysml2-mermaid` 已定的决策

- 输入：**SysML v2 文本表示**（`.sysml`）。范围是有文档的子集，绝不覆盖完整语言。
- 路线：与 `mermaid-opm` 相同（Mermaid 插件 + CLI + LSP + VS Code 扩展；文本 SSOT；自动布局；不持久化布局）。
- MVP 图类型（贴合节点/连线）：**BDD**、**需求图**、**状态机**、**活动/泳道**。**IBD** 与 **参数图** 后置（需要端口/约束布局）。
- 仓库：核心为单包 + LSP/VS Code 用 npm workspaces；双语文档；MIT；GitHub 归 `fengdonglu`。

## 立即的下一步

按我们的流程（**brainstorm → spec → plan → 子智能体实现**），下一步是 **brainstorm SysML v2 MVP 的范围**：v0.1 解析器支持哪些 `.sysml` 构造、首批视图各显示什么。然后写设计 spec，再写实现计划，再用 TDD 实现。

## 关于续接会话

`opencode -c` 续接的是**当前目录所属项目**最近的会话，所以在该目录打开它并不会自动续上之前 `mermaid-opm` 的会话。本交接文件（加上 `reference/` 里导出的 JSON）才是携带上下文的正式方式。如果你想载入原始记录，可以试 `opencode import reference/opencode-session-opm-opl.json`。
