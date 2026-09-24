# 架构

[English](architecture.md) | 中文

## 概述

`sysml2-mermaid` 是一条纯 TypeScript 流水线，把 SysML v2 文本模型（`.sysml`）
转换成 SVG 图。它沿用了姊妹项目 `mermaid-opm` 已验证的分层：与渲染无关的
核心、一个视图投影步骤、一个布局步骤、一个 DOM 无关的渲染器，以及若干轻量
入口。Mermaid 集成以下的全部代码都是 **DOM 无关**的，因此可以在 Node、打包器
或浏览器中原样运行。

## 分层

数据严格单向流动：

```text
.sysml 源文本
   │
   ▼
core/sysml      分词 → 解析                     （文本 → SysmlModel + 诊断）
   │
   ▼
core/model      类型 + 校验                     （SysmlModel，追加诊断）
   │
   ▼
views           selectView                      （SysmlModel → ViewDescription）
   │
   ▼
layout          dagre / 端口感知 IBD            （ViewDescription → Scene）
   │
   ▼
render          shapes + notation + sceneToSvg  （Scene + Theme → SVG 字符串）
```

| 层 | 目录 | 职责 | 依赖 |
| --- | --- | --- | --- |
| SysML | `src/core/sysml/` | `tokenize.ts` 把文本切分为带位置信息的词元；`parse.ts` 构建语义模型；`diagnostics.ts` 定义 `Diagnostic`/`Severity` 结构。 | — |
| Model | `src/core/model/` | `types.ts` 声明 `SysmlModel`、`Element`、`Relationship`、`ElementKind`、`RelationshipKind`；`validate.ts` 解析引用并追加 `duplicate-definition` / `unresolved-reference` 诊断。 | core/sysml |
| Views | `src/views/` | `types.ts` 声明 `ViewDescription`、`ViewNode`、`ViewEdge`、`ViewGroup`、`ViewName`；每种视图一个文件（`bdd.ts`、`requirement.ts`、`ibd.ts`、`statemachine.ts`、`activity.ts`）；`index.ts` 暴露 `selectView`。 | core/model |
| Layout | `src/layout/` | `dagreAdapter.ts` 为节点/边视图运行 dagre（`rankdir: 'TB'`，复合多重图）；`ibdAdapter.ts` 运行 dagre（`rankdir: 'LR'`）并显式锚定端口；`index.ts` 负责分发；`types.ts` 声明 `Scene`/`SceneNode`/`SceneEdge`/`SceneGroup`。 | views、dagre |
| Render | `src/render/` | `theme.ts` 提供全部颜色；`shapes.ts` 绘制节点（以及伪状态形状）；`markers.ts` + `notation.ts` 绘制连线；`sceneToSvg.ts` 组装最终 `<svg>` 字符串。 | layout |

解析器从不抛异常：所有问题都以诊断形式报告，携带 `severity`、`code`、
`message`、`line`、`column`（从 1 开始）。

## 中间表示

三种值类型在层之间传递数据；每层只认识自己的输入与输出形状。

- **`SysmlModel`**（`src/core/model/types.ts`）—— 与渲染无关的语义模型：
  `elements: Map<string, Element>`、`relationships: Relationship[]`、
  `diagnostics: Diagnostic[]`。`Element` 携带 `id`、`kind`、`name`、
  `qualifiedName`、所有权（`ownerId` / `childIds`）、`position`，以及可选的
  `typeRef`/`typeId`、`multiplicity`、`shortName`、`doc`/`comment`。声明式
  关系（`specialization`、`subset`、`redefine`、`dependency`、`satisfy`、
  `verify`、`connect`、`bind`、`transition`、`succession`、`flow`、`perform`）
  会被记录；组合/引用边则由视图推导。
- **`ViewDescription`**（`src/views/types.ts`）—— 与渲染无关的投影：`nodes`
  （含 `label`、`stereotype`、`rows`、`ports`、`note`）、`edges`（含 `kind`、
  `source`、`target`，可选 `label` 与 `sourcePort`/`targetPort`），以及可选的
  `groups`（泳道）。
- **`Scene`**（`src/layout/types.ts`）—— 已布局的 `ViewDescription`：节点获得
  `x`、`y`、`width`、`height`（以及可选的 `portAnchors`），边获得折线 `points`，
  场景携带整体 `width`/`height`。

渲染器只消费 `Scene` 加 `Theme`，从不感知 SysML。

## 渲染核心是 DOM 无关的

`core/`、`views/`、`layout/`、`render/` 从不触碰 `document` 或 `window`。
`sceneToSvg(scene, theme)` 是一个返回 SVG `string` 的纯函数，被库 API、CLI、
Mermaid 插件和 VS Code 预览共用。只有 `src/mermaid/renderer.ts` 会写入宿主元素，
只有 `packages/vscode-sysml` 会读取编辑器文档。

## 五个入口

1. **库 API** —— `src/index.ts` 导出 `renderModel(source)`（解析并校验后的
   `SysmlModel`）、`renderSvg(source, { view, theme })`（SVG `string`），以及更底层
   的 `parseSysml`、`validate`、`selectView`、`layout`、`sceneToSvg`、
   `defaultTheme`、`themeFromMermaid`、`sysml`、`registerSysml` 和 `VERSION`，
   外加模型/视图/场景/主题的 TypeScript 类型。
2. **CLI** —— `src/cli/cli.ts` 实现 `sysml2svg`；编译产物 `dist/cli/cli.js` 是
   `bin` 入口。它读取文件、调用 `renderModel`/`renderSvg`、写出 SVG（可选写出
   JSON 转储）、把诊断打印到 stderr，并在存在任何 `error` 诊断时以 `1` 退出。
3. **Mermaid 外部图插件** —— `src/mermaid/`。`detector.ts` 匹配 `sysml` 前置
   关键字，`db.ts` 保存解析后的模型与主题，`diagram.ts` 装配
   parser/init/renderer/styles，`renderer.ts` 把内部 SVG 注入宿主元素，
   `index.ts` 导出 `sysml` 与 `registerSysml()`。
4. **语言服务器** —— `packages/lsp`（bin `sysml-lsp`）：诊断、补全、悬停与
   文档符号，复用核心解析器。
5. **VS Code 扩展** —— `packages/vscode-sysml`：语法高亮、语言客户端、
   `sysml.preview` webview 与 `sysml.exportSvg` 命令。

## 数据流

1. `renderModel(source)` 调用 `parseSysml`，再调用 `validate`，返回 `SysmlModel`。
2. `renderSvg(source, opts)` 调用 `renderModel`，选择视图
   （`opts.view ?? viewFromSource(source) ?? 'bdd'`），再用
   `sceneToSvg(layout(selectView(model, view)), opts.theme)` 得到 SVG 字符串。
3. Mermaid 渲染器走同一条路径，从 `SysmlDb` 读取模型与主题，然后把字符串的
   内部内容注入 Mermaid 提供的元素。
4. CLI 写出 SVG 字符串（并在 `--json` 时写出
   `{ elements, relationships, diagnostics }` 的简单转储）并报告诊断。

编译与运行见[构建与测试](build-and-test.zh.md)，添加视图或记号见
[扩展](extending.zh.md)。
