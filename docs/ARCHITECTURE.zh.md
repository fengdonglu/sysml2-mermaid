# 架构

[English](ARCHITECTURE.md) | 中文

`sysml2-mermaid` 沿用了 `mermaid-opm` 已被验证的分层：与渲染无关的核心、一步布局、一个 DOM-free 渲染器，以及若干薄入口。

## 数据流

```
.sysml 文本（唯一真相源）
  │
  ▼  core/parse      分词 → 解析 → 语义模型 + 诊断（行列号）
语义模型              （元素、关系、类型）
  │
  ▼  views           把模型投影为"视图描述"
                     （BDD、需求、状态、活动……）
视图描述             节点、边、分组（与渲染器无关）
  │
  ▼  layout          dagre / ELK → 带位置的场景
场景
  │
  ▼  render          场景 → SVG 字符串（DOM-free、主题驱动）
SVG
  ├─ 入口 A：Mermaid 外部图插件
  ├─ 入口 B：CLI `sysml2svg`
  ├─ 入口 C：语言服务器（LSP）
  └─ 入口 D：VS Code 扩展（客户端 + 预览）
```

## 设计原则

1. **文本是唯一真相源。** 不持久化布局；SVG 是按需重新计算的投影。
2. **渲染核心 DOM-free。** `sceneToSvg(scene): string` 是纯函数，Mermaid 插件、CLI、VS Code 预览共用。
3. **视图是一层"选择"。** 一个 SysML 模型可产出多张图；视图层在布局前决定某张图显示哪些元素。
4. **错误不崩溃。** 解析器用带位置的诊断报告问题；未解析引用降级为占位并告警。
5. **分层可扩展。** 解析、模型、视图投影、布局、渲染彼此独立；新增图类型 = 新增视图 + 渲染，而非重写。

## 目录结构

```
src/
  core/      .sysml 解析 + 语义模型（纯逻辑，无 DOM）
  views/     模型 → 视图描述（按图类型）
  layout/    视图 → 场景（dagre / ELK）
  render/    场景 → SVG 字符串（DOM-free、主题驱动）
  mermaid/   Mermaid 外部图集成
  cli/       sysml2svg
packages/
  lsp/       语言服务器（npm workspace）
  vscode/    VS Code 扩展（npm workspace）
test/        vitest 测试
docs/        文档
reference/   仅本地参考资料（gitignore，不发布）
```

## 为什么用 Mermaid

Mermaid 已经提供管线的后半段——节点/边图模型与布局引擎（dagre、ELK）。SysML 工具可复用它，把精力放在前半段：理解 `.sysml` 文本并投影为图。对真正是节点/连线的图类型（BDD、需求、状态、活动），工作量很小；对端口/约束密集的图（IBD、参数图），Mermaid 的通用图不够用，需要专门的布局。

## 与 `mermaid-opm` 的关系

`sysml2-mermaid` 有意复用 `mermaid-opm` 的架构、工具链与约定（TypeScript ESM、DOM-free 渲染核心、`parser → model → layout → render`、Mermaid 插件 + CLI + LSP + VS Code 扩展、双语文档）。差别在输入语言（`.sysml` 而非 OPL），以及 SysML 所需的更丰富的视图层。
