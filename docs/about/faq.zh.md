# 常见问题

[English](faq.md) | 中文

## 为什么选择 Mermaid？

大多数模型都与其说明文字放在一起，而 Mermaid 已是 Markdown 与文档站点的实际图表语言。它的**外部图表（external diagram）** API 让项目无需分叉 Mermaid 即可新增图表类型，因此 `sysml2-mermaid` 可以注册一种图表类型，只要加载了插件，其围栏代码块就会渲染出来。对节点/边类图表而言，一个 SysML 视图就是一张能干净映射到布局引擎的有向图。

## 为什么不做布局持久化？

布局是推导出来的，而非存储的，因此同一模型总是产生同一张图。没有需要同步的独立布局文件，也无需在模型变化时发明格式、版本与失效规则。位置是模型的纯函数（经由 [dagre](https://github.com/dagrejs/dagre)，ELK 选项列在[路线图](../ROADMAP.zh.md)中）。这与「**`.sysml` 文本是唯一事实来源**」的原则一致；见[《设计背景》](../design/BACKGROUND.zh.md)。

## 为什么没有图形化编辑？

本工具是**渲染器**，不是编辑器。编辑需要画布、命中测试、选择与撤销/重做——那基本上是另一款产品。把 **`.sysml` 文本**作为唯一事实来源，模型便可在 git 中 diff、评审与合并，同时让解析器与渲染器保持无 DOM 依赖、可测试。[演示页](../../demo/index.html)与[演练场](../../demo/playground.html)只用于查看、编辑与切换示例。

## 为什么不实现完整的 SysML v2 语法？

SysML v2 远不止是一门流程图语言：行为、需求、参数约束、分配（allocation）与视角（viewpoint）都很重要。完整的语法与语义一致性被有意**排除在范围之外**——一个声称完全一致的 v1 既不诚实也不可维护。取而代之，解析器只接受一个有文档记载的 `.sysml` 子集，永不抛出异常，其余一律通过带行列信息的诊断报告。该子集覆盖什么，列在[路线图](../ROADMAP.zh.md)中，并在[《什么是 SysML v2？》](what-is-sysml.zh.md)里说明。

## 现在有 LSP 与 VS Code 扩展了吗？

有。`packages/lsp` 是基于内核解析器及其诊断构建的语言服务器，`packages/vscode-sysml` 是内置它的 VS Code 扩展，提供语法高亮与 SVG 预览。该服务器与编辑器无关，其它 LSP 客户端也可复用。

## 如何在 GitHub 上渲染图？

GitHub 的 Markdown 渲染器不会加载第三方 Mermaid 插件，因此 SysML 围栏代码块会显示为源码而非图。有两种办法：

- **预渲染为 SVG。** 用 `sysml2svg` CLI 处理源码，提交结果并嵌入：

  ```bash
  npx sysml2svg model.sysml --view bdd -o model.svg
  ```

  然后在 Markdown 中以图片引用 `model.svg`。

- **在你能掌控的宿主中渲染**——任何加载了插件的页面，例如[演示页](../../demo/index.html)或[演练场](../../demo/playground.html)。

## 这与 `mermaid-opm` 有什么关系？

[`mermaid-opm`](https://github.com/fengdonglu/mermaid-opm) 用于渲染 OPM/OPL（ISO 19450），是本仓库所对标的姊妹项目。二者共享同一套架构（无 DOM 内核、`解析 → 模型 → 布局 → 渲染`）、相同的入口（Mermaid 插件、CLI、LSP、VS Code 扩展）、相同的工具链，以及相同的双语文档约定。差别在于输入语言（`.sysml` 与 OPL）以及 SysML 所需的更丰富的视图层；见[《架构》](../ARCHITECTURE.zh.md)。

## 如何贡献？

请先阅读 [`AGENTS.md`](../../AGENTS.md)。简要而言：TypeScript 配合 ESM、无 DOM 依赖的渲染内核、TDD（先写失败的测试）、Conventional Commits，以及以英文作为代码注释、文档与提交信息的权威语言——中文副本以 `*.zh.md` 兄弟文件形式与英文文档并列。颜色只能取自 `Theme`，解析器不得抛出异常，只支持有文档记载的 `.sysml` 子集，不得臆造语法。
