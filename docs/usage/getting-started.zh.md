# 快速开始

[English](getting-started.md) | 中文

`sysml2-mermaid` 把 **SysML v2** 文本模型（`.sysml`）渲染为图表。五种视图已能端到端渲染：**块定义图（BDD）**、**需求图**、**内部块图（IBD）**、**状态机图**与**活动/泳道图**。

有四种用法：

- 作为浏览器中的 **Mermaid 外部图插件**；
- 作为 **`sysml2svg` 命令行工具**，用于批量转换与 CI；
- 作为**库**，在自有代码中调用；
- 在**编辑器**中经由语言服务器与 VS Code 扩展使用。

## 安装

本包尚未发布到 npm；请从本仓库的检出（checkout）构建：

```bash
git clone https://github.com/fengdonglu/sysml2-mermaid
cd sysml2-mermaid
npm install
npm run build
```

构建后，CLI 为 `node dist/cli/cli.js`（`npm link` 后可用 `sysml2svg` bin），库入口为 `dist/index.js`，浏览器包为 `dist/sysml2-mermaid.mjs`。发布之后，安装方式将是 `npm i sysml2-mermaid mermaid`。

`mermaid`（>= 11）是可选的 peer 依赖：只有使用插件时才需要。CLI、库与编辑器工具本身无需安装它。

## 第一个模型

```sysml
sysml bdd
package Vehicle {
    part def PowerSource;
    part def Engine :> PowerSource {
        attribute power : Real;
    }
    part def Vehicle {
        part engine : Engine;
        part spare : Engine[2];
        ref part operator : Person;
    }
}
```

首行是可选的标记行加上要渲染的视图；`sysml bdd` 选中块定义图，未给出视图名时默认也是 BDD。完整支持的子集见[《SysML 语法》](sysml-syntax.zh.md)。

## 库 API

```ts
import { renderSvg, renderModel, parseSysml, VERSION } from 'sysml2-mermaid';

const svg = renderSvg(source);                    // 用首行视图，否则 BDD
const ibd = renderSvg(source, { view: 'ibd' });   // 显式指定视图
const model = renderModel(source);                // 解析 + 校验

for (const d of model.diagnostics) {
  console.log(d.severity, d.code, d.line, d.column, d.message);
}
```

主要导出：

| 导出 | 用途 |
| --- | --- |
| `parseSysml(source)` | 词法分析 + 解析为语义模型（不校验）。 |
| `renderModel(source)` | `parseSysml` + `validate`；所有入口共用的模型。 |
| `renderSvg(source, { view, theme })` | 渲染为 SVG 字符串。`view` 默认取首行指令，否则为 `bdd`。 |
| `VERSION` | 库版本字符串。 |
| `selectView`、`layout`、`sceneToSvg` | 流水线各阶段（模型 → 视图 → 场景 → SVG）。 |
| `defaultTheme`、`themeFromMermaid` | 供无 DOM 渲染器使用的主题。 |
| `sysml`、`registerSysml` | Mermaid 外部图定义及其注册辅助函数。 |

渲染核心**不依赖 DOM**：`renderSvg` 只产出字符串，绝不触碰 `document` / `window`。

## CLI

```bash
npx sysml2svg model.sysml -o model.svg
npx sysml2svg model.sysml --view ibd --json model.json
```

CLI 写出 SVG，把诊断打印到 stderr，并在模型存在任何 `error` 时以非零码退出。选项、退出码与示例见[《CLI》](cli.zh.md)。

## Mermaid 插件

```js
import mermaid from 'mermaid';
import { registerSysml } from 'sysml2-mermaid';

mermaid.initialize({ startOnLoad: false }); // 必须在任何 await 之前
await registerSysml();

const { svg } = await mermaid.render('d', source);
document.querySelector('#diagram').innerHTML = svg;
```

请在渲染前注册外部图；触发器、宿主要求与限制见[《Mermaid 插件》](mermaid-plugin.zh.md)。

## 运行演示

[`demo/index.html`](../../demo/index.html) 中的静态画廊经由 Mermaid 插件渲染每个示例；[`demo/playground.html`](../../demo/playground.html) 的 Playground 可实时编辑 `.sysml`，并显示图表与诊断：

```bash
npm run build
npm run dev
```

- **画廊** —— `http://localhost:3000/demo/index.html`。
- **Playground** —— `http://localhost:3000/demo/playground.html`。

演示页加载 `dist/sysml2-mermaid.mjs`，请先构建。

## 下一步

- [SysML 语法](sysml-syntax.zh.md) —— 逐条说明支持的子集。
- [CLI](cli.zh.md) —— 选项、退出码与示例。
- [Mermaid 插件](mermaid-plugin.zh.md) —— 宿主要求与限制。
- [编辑器集成](editor-integration.zh.md) —— LSP 与 VS Code 扩展，以及 CLI/库替代方案。
