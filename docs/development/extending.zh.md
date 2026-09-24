# 扩展

[English](extending.md) | 中文

本页介绍最常见的几类扩展。请先读 [`AGENTS.md`](../../AGENTS.md)，它规定了每次
改动都必须遵守的约定：英文注释、ESM 的 `.js` 导入后缀、DOM 无关的渲染核心、
颜色只取自 `Theme`，以及从不抛异常的解析器。

## 新增一个视图

视图是一个纯函数 `(model: SysmlModel) => ViewDescription`。新增视图会触及视图
层；若引入新的种类，还会触及渲染层。

1. **命名** —— `src/views/types.ts`。把名字加入 `VIEW_NAMES`；若视图会产出新的
   边种类，再加入 `ViewEdgeKind`。
2. **编写** —— 新建 `src/views/<name>.ts`。参考已有视图：`bdd.ts`（定义/特性）、
   `requirement.ts`（包含关系）、`activity.ts`（分组）。构建 `ViewNode`
   （`label`、`stereotype`、`rows`、`ports`、`note`）与 `ViewEdge`（`kind`、
   `source`、`target`、`label`、端口），以及可选的 `ViewGroup`。
3. **注册** —— 把函数加入 `src/views/index.ts` 的 `VIEWS` 记录，`selectView`
   随后即可分发到它。
4. **入口自动识别** —— `src/directive.ts` 从 `VIEW_NAMES` 推导首行
   `sysml <view>` 指令中的 `<view>`，CLI 也按 `VIEW_NAMES` 校验 `--view`。
5. **布局** —— `src/layout/index.ts` 把带连接器或端口的视图路由到 `ibdLayout`，
   其余走 `dagreLayout`；除非视图需要新的几何，否则无需改动。节点形状由
   `src/render/shapes.ts` 依据 `stereotype` 选择。
6. **测试与 demo** —— 新增 `test/views-<name>.spec.ts`、在 `test/fixtures/` 下
   添加 fixture、在 `test/samples.spec.ts` 加一个用例，并添加
   `demo/samples/NN-name.sysml` 及 `demo/examples.mjs` 中的条目。

## 新增一种边或记号

一种边种类会流经解析、引用解析、视图和渲染器。

1. **模型** —— 把种类加入 `src/core/model/types.ts` 的 `RelationshipKind`。
2. **解析器** —— 在 `src/core/sysml/parse.ts` 中添加 `parse<X>()` 方法与 `switch`
   分支，用 `addRelationship` 发出该关系。对于二元或复合端点，由
   `src/core/model/validate.ts` 的 `validate` 解析 `sourceId`/`targetId`
   （连接器式的特性链留给视图解析）。
3. **视图** —— 把种类加入 `src/views/types.ts` 的 `ViewEdgeKind`，并在相关视图中
   发出它。
4. **布局** —— 通用：dagre 与 IBD 适配器能路由任意节点对，除非该边需要自定义
   几何，否则无需改动。
5. **渲染** —— 在 `src/render/notation.ts` 中选择线型（`dashed` 与 `dotted`
   集合），在 `src/render/markers.ts` 中选择起点/终点记号
   （`markerStart` / `markerEnd`），并把新图形加入 `markerDefs`。颜色只取自
   `Theme` 参数。
6. **测试** —— 添加解析、视图与渲染的 spec。

## 新增一个主题 token

1. **主题** —— `src/render/theme.ts`。在 `Theme` 接口中加入字段，在
   `defaultTheme` 中给它赋值，并在 Mermaid 暴露对应变量时于 `themeFromMermaid`
   中映射它。
2. **使用** —— 在 `shapes.ts`、`notation.ts` 或 `sceneToSvg.ts` 中从 `Theme`
   参数读取该 token。绝不硬编码颜色：`Theme` 是调色板的唯一事实来源。

## 新增一个示例样本

1. 添加 `demo/samples/NN-name.sysml`；首行应带视图指令，例如
   `sysml statemachine`。
2. 在 `demo/examples.mjs` 中加入条目：`{ id, title, sample, explanation }`。
3. `test/demo.spec.ts` 会断言每个示例都有存在的样本、每个样本都有视图指令、
   且每个样本解析时没有 `error` 诊断；运行 `npm test`。

## 新增一个解析构造

1. **词法** —— 若构造引入标点，把它们加入 `src/core/sysml/tokenize.ts` 的词元表。
2. **解析器** —— 在 `src/core/sysml/parse.ts` 的 `switch` 中加入关键字，并编写
   一个聚焦的 `parse<X>()` 方法，用带位置的 `error` 诊断（经由 `this.error`）
   报告问题，而不是抛异常。
3. **模型** —— 若构造是新的元素或关系，扩展 `src/core/model/types.ts` 中的
   `ElementKind` / `RelationshipKind`。
4. **视图与渲染** —— 按上文所述进行投影与绘制。

## 到哪里看

- 词法、解析与诊断 —— `src/core/sysml/`。
- 模型与校验 —— `src/core/model/`。
- 视图投影 —— `src/views/`。
- 布局 —— `src/layout/`。
- SVG 生成 —— `src/render/`。
- Mermaid 装配 —— `src/mermaid/`。
- 编辑器集成 —— `packages/lsp/`、`packages/vscode-sysml/`。

这些部分如何协作见[架构](architecture.zh.md)，相关命令见
[构建与测试](build-and-test.zh.md)。
