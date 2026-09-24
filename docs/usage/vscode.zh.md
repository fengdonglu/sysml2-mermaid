# VS Code 扩展

[English](vscode.md) | 中文

`sysml2-mermaid-vscode` 为 VS Code 增加 SysML v2 支持：`.sysml` 文件语法高亮、实时诊断、补全、悬停与文档大纲，外加两个渲染当前模型的命令。它内置 [`sysml2-mermaid-lsp`](#语言服务器)语言服务器，并通过 stdio 与之通信。

扩展源码位于 [`packages/vscode-sysml`](../../packages/vscode-sysml/README.md)。

## 安装

扩展**尚未发布到 Marketplace**。在发布之前，从 VSIX 安装：

1. 从仓库中构建并打包：`npm run package:vsix -w sysml2-mermaid-vscode`（该命令会构建扩展并执行 `vsce package`，生成 `sysml2-mermaid-vscode-*.vsix`）。
2. 在 VS Code 中打开命令面板，运行 **Extensions: Install from VSIX…**，选择该文件。
3. 按提示重新加载。

需要 VS Code **1.94** 或更高版本。

## 提供的能力

打开任意 `.sysml` 文件，扩展会随 `sysml` 语言激活并提供：

- **语法高亮**——覆盖 `sysml` 头、存储关键字（`package`、`part`、`requirement`、`state`、`action` 等）、关系关键字（`satisfy`、`connect`、`flow` 等）与注释的 TextMate 语法。
- **诊断**——与 `renderModel().diagnostics` 相同的诊断，随输入实时显示波浪线。
- **补全**——SysML 关键字，以及当前文件中已声明的元素。
- **悬停**——光标处名称的类别、限定名、类型、id 与文档。
- **大纲**——大纲视图中的模型层级。
- **跳转定义**——从名称跳到其定义处。
- **重命名**——重命名元素及其所有出现处。
- **格式化**——重新缩进文档。

诊断默认开启；将 `sysml.diagnostics.enable` 设为 `false` 可关闭。

## 命令

聚焦 `.sysml` 文件时打开命令面板：

- **SysML: Open Preview**（`sysml.preview`）——在编辑器旁的 webview 中把当前文件渲染为图表，并在每次编辑后刷新。
- **SysML: Export SVG**（`sysml.exportSvg`）——渲染当前文件并将 SVG 写入你选择的路径。

两者都使用核心库的 `renderSvg`，因此预览与导出的 SVG 和 CLI、Mermaid 插件的结果一致。视图取自文件首行指令（`sysml <view>`），默认是**块定义图**。

## 设置

| 设置 | 类型 | 默认 | 含义 |
| --- | --- | --- | --- |
| `sysml.diagnostics.enable` | boolean | `true` | 开启或关闭内联诊断。 |
| `sysml.preview.view` | enum | 空 | **SysML: Open Preview** 使用的视图；为空则遵循模型的 `view` / 首行指令。 |

## 语言服务器

扩展以打包文件（`dist/server.js`）形式、通过 stdio 启动 `sysml2-mermaid-lsp` 服务器；在 VS Code 中无需单独安装。该服务器与编辑器无关，作为 workspace 包 [`sysml2-mermaid-lsp`](../../packages/lsp) 提供 `sysml-lsp` 可执行文件，供其它 LSP 客户端复用。

## 尚未包含

本次发布不包含多文件解析与跨工作区重构；见[路线图](../ROADMAP.zh.md)。

## 另见

- [编辑器集成](editor-integration.zh.md) —— 保存时运行 CLI 与库 API 两种替代方案。
- [CLI：sysml2svg](cli.zh.md) —— 编辑器之外的批量转换。
- [诊断参考](editor-integration.zh.md#诊断参考) —— 编辑器显示的 `error` 与 `warning` 代码。
