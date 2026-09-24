# sysml2-mermaid

[English](README.md) | 中文

将 **SysML v2** 文本模型（`.sysml`）渲染为图表——形态为 Mermaid 外部图表插件，另附 CLI 转换器、语言服务器（LSP）与 VS Code 扩展。

> 状态：**v0.5**。五种视图已能从 `.sysml` 文本经库 API、`sysml2svg` CLI（`--view bdd`、`requirement`、`ibd`、`statemachine`、`activity`）与 Mermaid 插件端到端输出 SVG：**块定义图（BDD）**、**需求图**、**内部块图（IBD，含端口与连接器）**、**状态机图**、**活动/泳道图**。另有 **语言服务器**（`packages/lsp`）与 **VS Code 扩展**（`packages/vscode-sysml`），提供诊断、补全、悬浮、大纲、语法高亮与 SVG 预览；并含 **画廊与 Playground** 演示（`npm run dev`）与完整文档（`docs/`）。

## 目标定位

SysML v2 有标准的文本表示（`.sysml`）和明确的抽象语义，但缺少好用的工具包。本项目采用"**文本即唯一真相源，图表是实时投影**"的路线——与姊妹项目 [`mermaid-opm`](https://github.com/fengdonglu/mermaid-opm)（OPM/OPL）已被验证的路线一致：

```
.sysml 文本（唯一真相源）
   │  解析 + 校验
   ▼
语义模型（与渲染无关）
   │  视图选择（某张图显示哪些元素）
   ▼
场景（布局：dagre / ELK）
   │  渲染
   ▼
SVG —— 经由 Mermaid 外部图插件、CLI、编辑器 LSP 或 VS Code
```

不持久化布局、不要求图形编辑：图表每次都由文本重新计算得出。

![sysml2-mermaid 画廊](assets/gallery.svg)

## 视图

同一模型可渲染五种视图：

- **块定义图（BDD）** —— 部件、项及其关系。
- **需求图** —— 需求、满足与验证。
- **内部块图（IBD）** —— 端口与连接器。
- **状态机图** —— 状态、entry/do/exit 与转移。
- **活动/泳道图** —— 动作、控制流与 `perform` 泳道。

## 交付物

- **Mermaid 外部图插件** —— `registerSysml()`，用于 `sysml` 围栏代码块。
- **CLI** —— `sysml2svg model.sysml -o model.svg`（无需浏览器）；`--view`、`--view-name`、`--layout`。
- **库** —— `renderSvg(source, { view, viewName, theme })` 与 `renderSvgAsync(source, { layout: 'elk' })`。
- **语言服务器** —— 诊断、补全、悬浮、大纲、跳转定义、重命名、格式化。
- **VS Code 扩展** —— 语法高亮、语言客户端、预览与导出。

详见 [`docs/ROADMAP.zh.md`](docs/ROADMAP.zh.md) 与 [`docs/ARCHITECTURE.zh.md`](docs/ARCHITECTURE.zh.md)。

## 演示

```bash
npm run build   # 生成浏览器包 dist/sysml2-mermaid.mjs
npm run dev     # 启动 http://localhost:3000
```

- **画廊** —— `http://localhost:3000/demo/index.html`：每个示例经由 Mermaid 插件渲染。
- **Playground** —— `http://localhost:3000/demo/playground.html`：左侧编辑 `.sysml`，选择视图，实时查看图表与诊断。

模型首行可带视图指令（`sysml bdd`、`sysml requirement`、`sysml ibd`、`sysml statemachine`、`sysml activity`）；不带则默认 BDD 视图。

## 文档

- [架构](docs/ARCHITECTURE.zh.md)
- [路线图](docs/ROADMAP.zh.md)
- [设计背景](docs/design/BACKGROUND.zh.md)

## 开发说明

本项目基于 **Vibe Coding**（AI 辅助）开发，由智能体与人类迭代协作。

## 许可证

MIT © fengdonglu
