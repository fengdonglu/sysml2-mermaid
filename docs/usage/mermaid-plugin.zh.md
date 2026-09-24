# Mermaid 插件

[English](mermaid-plugin.md) | 中文

`sysml2-mermaid` 向 Mermaid 注册一个**外部图**。注册后，凡是以 `sysml` 为首行的源（通常是围栏代码块，或 `mermaid.render` 的字符串）都会被渲染为 SysML 图表。

## 注册该图

```js
import mermaid from 'mermaid';
import { registerSysml } from 'sysml2-mermaid';

mermaid.initialize({ startOnLoad: false }); // 必须在任何 await 之前
await registerSysml();
```

`registerSysml()` 是对以下调用的薄封装：

```js
mermaid.registerExternalDiagrams([sysml], { lazyLoad: false });
```

`sysml` 定义（`{ id, detector, loader }`）也被导出，便于自行传给 `registerExternalDiagrams`。

注册后照常渲染：

```js
const { svg } = await mermaid.render('d', `
sysml ibd
package Powertrain {
    port def FuelPort;
    part def FuelTank { port tankPort : FuelPort; }
    part def Engine { port enginePort : FuelPort; }
    part def Vehicle {
        part tank : FuelTank;
        part eng : Engine;
        connect tank.tankPort to eng.enginePort;
    }
}
`);
document.querySelector('#diagram').innerHTML = svg;
```

## `sysml` 触发器与视图指令

检测器匹配 `/^\s*sysml(?:\s|$)/`：源必须以单独一行的 `sysml` **开头**（允许前置空白）。标记行不属于模型，由插件的解析器消费。

视图名可以跟在同一首行的 `sysml` 之后：

| 首行 | 视图 |
| --- | --- |
| `sysml bdd` | 块定义图 |
| `sysml requirement` | 需求图 |
| `sysml ibd` | 内部块图 |
| `sysml statemachine` | 状态机图 |
| `sysml activity` | 活动/泳道图 |
| `sysml` | BDD（默认） |

视图名未知或缺失时回退到 **BDD**。

## `startOnLoad` 陷阱

必须在**任何 `await` 之前**调用 `mermaid.initialize({ startOnLoad: false })`。否则 Mermaid 可能在 `DOMContentLoaded` 时、`registerSysml()` 完成之前自动运行，导致每个 `sysml` 块都报 *"No diagram type detected"*。正确模式：

```js
mermaid.initialize({ startOnLoad: false }); // 先
await registerSysml();                      // 后
```

## 浏览器包与 import map

发布的浏览器包（`dist/sysml2-mermaid.mjs`，即 `./browser` 导出）在 `registerSysml()` 内保留了对 `import('mermaid')` 的**裸导入**。打包器会自动解析该 specifier，但浏览器直接加载该文件时无法解析。你必须提供 import map（或打包器别名），把 `mermaid` 映射到某个 ESM 构建；否则 `await registerSysml()` 会抛出 `Failed to resolve module specifier "mermaid"`。

```html
<script type="importmap">
{
  "imports": {
    "mermaid": "https://cdn.jsdelivr.net/npm/mermaid@12/dist/mermaid.esm.min.mjs"
  }
}
</script>
<script type="module">
  import mermaid from 'mermaid';
  import { registerSysml } from './dist/sysml2-mermaid.mjs';

  mermaid.initialize({ startOnLoad: false });
  await registerSysml();
</script>
```

同样的 import map 要求也适用于[演示页](../../demo/index.html)。

## 只读渲染

插件是纯投影：解析当前源、布局、绘制 SVG。它不提供编辑、拖拽，也不持久化布局——每次渲染都由文本重新计算。颜色取自 Mermaid 的 `themeVariables`（经 `themeFromMermaid`），因此 SysML 图表会跟随宿主的 Mermaid 主题。

## 宿主要求与限制

- 必须存在 Mermaid **>= 11**（它是可选的 peer 依赖）。
- 宿主必须在渲染 `sysml` 源之前加载 `sysml2-mermaid` 并调用 `registerSysml()`。
- 在浏览器中，`mermaid` 必须能作为 ESM specifier 被解析（import map 或打包器）；插件自身的包是 `dist/sysml2-mermaid.mjs`（`./browser`）。
- 外部图要求宿主页面执行第三方 JavaScript。像 **GitHub Markdown 这样的固定渲染器不会加载插件**，因此 `sysml` 块在那里无法渲染。请改用 [`sysml2svg` CLI](cli.zh.md) 生成 SVG 再提交或附带。
- 插件对每个源只渲染一个视图，即首行指定的视图（否则 BDD）。支持的子集见[《SysML 语法》](sysml-syntax.zh.md)，库与 CLI 用法见[《快速开始》](getting-started.zh.md)。
