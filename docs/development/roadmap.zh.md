# 路线图

[English](roadmap.md) | 中文

本页记录已交付与待完成的工作，并根据
[`docs/ROADMAP.md`](../ROADMAP.zh.md) 更新。当前支持的 `.sysml` 子集与五种视图记录在
根目录的 [`README.md`](../../README.zh.md) 中。指导原则保持不变：文本是唯一事实
来源，图是对它的投影。

## 已交付（截至 v0.4）

- **解析器**：覆盖文档化的 `.sysml` 子集——包与导入；`part def`/`part`、
  `attribute`、`port def`/`port`、`connection`（connect/interface/bind）、
  带 subject 与 constraint 的 `requirement def`/`requirement`、带
  `entry`/`do`/`exit` 与 transition 的 `state def`/`state`、带 succession 与
  flow 的 `action def`/`action`、`enum`、`doc`/`comment` 以及多重度。
- **语义模型**（与渲染无关）：引用解析与基础校验（`duplicate-definition`、
  `unresolved-reference`），未解析的引用降级为 `«unresolved»` 占位节点并给出
  警告。
- **五种视图**端到端渲染：**块定义图**、**需求图**、**内部块图**（端口与连接
  器）、**状态机**、**活动 / 泳道图**。
- **布局**：基于 dagre，另含端口感知的 IBD 适配器与用于泳道的复合图。
- **DOM 无关的 SVG 渲染器**，完全由 `Theme` 驱动。
- **入口**：库 API、`sysml2svg` CLI、Mermaid 外部图插件。
- **语言服务器**（`packages/lsp`）：诊断、补全、悬停与文档符号。
- **VS Code 扩展**（`packages/vscode-sysml`）：语法高亮、语言客户端、
  `sysml.preview` webview 与 `sysml.exportSvg`。
- **Demo**：由 `npm run dev` 提供的图库与演练场。

## 待完成

- **视图选择语法。** 用 SysML v2 原生的 `view` / `viewpoint` 构造决定一幅图展示
  哪些元素，取代项目特有的首行 `sysml <view>` 指令。
- **ELK 布局。** 在布局分发器背后提供 dagre 之外的替代方案，用于 dagre 布局效果
  不佳的图；IBD 目前使用 dagre 加显式端口锚定。
- **Systems Modeling API / JSON 导出。** 解析模型的标准、可互操作导出。当前 CLI
  的 `--json` 只会写出 `{ elements, relationships, diagnostics }` 的简单转储。
- **KerML / 标准库覆盖**，超出文档化的子集。
- **参数图**以及约束/绑定关系。
- **更多构造**：`connection def` / `interface def` / `end` 特性、`allocation`、
  `item` 用途、`abstract`、`alias`、`metadata`，以及端口共轭（`~T`）。
- **v0.4 之外的编辑器能力**：跳转定义、重命名、代码操作、格式化与多文件解析。

## 不计划

- 完整的 SysML v2 / KerML 文法与语义一致性等级。
- 图形化编辑与持久化布局。
- 仿真、约束求解器与多用户仓库。
- 固定渲染器支持（GitHub Markdown 无法加载外部插件）——请改用 `sysml2svg` CLI。

添加视图或记号请遵循[扩展](extending.zh.md)；流水线见
[架构](architecture.zh.md)。
