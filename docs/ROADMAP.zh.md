# 路线图

[English](ROADMAP.md) | 中文

本路线图遵循"文本即唯一真相源，图表是投影"的原则：先从贴合节点-连线图的图类型做起，把需要专门布局的图放到后面。

## MVP（v0.1）

- **解析器**：一个有文档的 `.sysml` 子集——`package`、`part def` / `part`、`attribute`、`port def` / `port`、`connection`、`requirement def` / `requirement`、`state def` / `state`、`action def` / `action`、`enum`、`import`（单文件 + 内置库子集）。
- **语义模型**（与渲染无关）：引用解析 + 基础校验（未定义引用、重复定义）。
- **视图投影**：
  - **BDD** —— 定义/使用及其关系。
  - **需求图** —— 需求及其关系。
  - **状态机图** —— 状态与转移。
  - **活动/泳道图** —— 动作与控制流。
- **布局**用 dagre；**DOM-free SVG 渲染器**。
- **三个入口**：Mermaid 外部图插件、CLI `sysml2svg`、库 API。
- **诊断**带行列号；单测；可执行的文档示例。

## v0.2

- **内部块图（IBD）** —— 端口与连接器；可能改用 ELK 的端口约束而非通用 dagre。
- **参数图** —— 约束/绑定关系。
- **视图选择语法** —— 一小撮 `view`/`viewpoint` 子集，用于选择某张图显示哪些元素。
- **ELK 布局**选项，与 dagre 并存。

## v0.3+

- **语言服务器（LSP）** —— 诊断、补全、悬浮、大纲（复用核心解析器），之后是跳转定义。
- **VS Code 扩展** —— 语法高亮、语言客户端、预览命令。
- **Systems Modeling API / JSON** 模型导出（互操作）。
- 超出 MVP 子集的 **KerML / 标准库** 覆盖。

## 当前明确不做

- 完整 SysML v2 / KerML 语法与符合性等级。
- 图形编辑与布局持久化。
- 仿真、约束求解、多人仓库。

## 与 `mermaid-opm` 的关系

姊妹项目 `mermaid-opm`（OPM/OPL，ISO 19450）已实现相同形态——Mermaid 插件、CLI、LSP、VS Code 扩展——本项目以其架构与约定为参考。
