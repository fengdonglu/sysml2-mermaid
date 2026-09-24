# 集成

[English](integration.md) | 中文

`sysml2-mermaid` 以 ESM 包形式发布，带两个入口：

```json
"exports": {
  ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
  "./browser": "./dist/sysml2-mermaid.mjs"
}
```

根导入是库与插件 API；`sysml2svg` CLI 是独立的 `bin`。`./browser` 是 Mermaid
插件使用的打包浏览器构建。`mermaid` 是 **可选** 的 peer 依赖（`>= 11`）：
只有 `registerSysml()` 会在运行时导入它。

## Mermaid 宿主版本

Mermaid 插件使用外部图 API（`mermaid.registerExternalDiagrams`，在 Mermaid v11
引入）。本包把 `mermaid: ">=11"` 声明为可选 peer 依赖，并针对 Mermaid v12 开发
和测试。因此打包器与 CDN 都需要 v11 或更新的 Mermaid 宿主。

## 打包器（Vite、webpack）

两者都会为你解析裸 `mermaid` 说明符和包的 `exports` 映射。

```js
// Vite 或 webpack
import { renderSvg, registerSysml } from 'sysml2-mermaid';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false });
await registerSysml();

const svg = renderSvg(
  'sysml\npackage P { part def Engine; part def Car :> Engine; }',
  { view: 'bdd' },
);
```

走插件路径时，要在首次渲染前初始化 Mermaid 并注册图，同时关闭自动运行。

## Node 中的纯 ESM

```js
import { renderModel, renderSvg } from 'sysml2-mermaid';

const svg = renderSvg('sysml\npackage P { part def Engine; part def Car :> Engine; }');
const model = renderModel('sysml\npackage P { part def Engine; }');
console.log(model.diagnostics);
```

因为只有 `registerSysml()` 会导入 `mermaid`，你可以在服务器上导入
`sysml2-mermaid` 而无需安装 `mermaid`。

## Node / SSR

渲染核心是 DOM 无关的，所以两个函数在服务器上都安全：

- `renderModel(source)` 返回解析并校验后的 `SysmlModel`（元素 `Map` 加上
  `relationships` 与 `diagnostics`）。它从不抛异常，也从不触碰 DOM。
- `renderSvg(source, { view, theme })` 返回一个 SVG **字符串**，可嵌入任何
  服务端渲染的页面。未给出 `view` 时，它使用首行 `sysml <view>` 指令，回退到
  `bdd`。

```js
import { renderSvg } from 'sysml2-mermaid';

const svg = renderSvg(source); // 字符串，不需要 DOM
```

CLI 依赖同一条 DOM 无关的路径，因此在 CI 中无需浏览器即可运行。

## 浏览器中的 CDN

直接从 CDN 加载浏览器构建。它保留了对 `mermaid` 的裸 `import()`，因此需要为
`mermaid` 提供 import map：

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
  import { registerSysml } from 'https://cdn.jsdelivr.net/npm/sysml2-mermaid/dist/sysml2-mermaid.mjs';

  mermaid.initialize({ startOnLoad: false });
  await registerSysml();
</script>
```

没有 import map 时，`registerSysml()` 会抛出
`Failed to resolve module specifier "mermaid"`。

## `mermaid` peer 依赖

- 在 `package.json` 中声明为可选 peer 依赖（`>= 11`）。
- 运行时只有 `registerSysml()` 需要它；外部图定义只对 `mermaid` 做类型导入。
- `renderModel`、`renderSvg` 与 `sysml2svg` CLI 无需它即可工作。

## CLI

用于批量或 CI 时，安装 CLI 或用 `npx` 运行：

```bash
npx sysml2svg model.sysml -o model.svg --view bdd
```

加上 `--json out.json` 还会写出 `{ elements, relationships, diagnostics }`
的简单转储。

## 编辑器集成

- **语言服务器**（`packages/lsp`）暴露 `sysml-lsp` 可执行文件，通过 stdio
  讲 LSP；任何语言客户端都可以指向它。
- **VS Code 扩展**（`packages/vscode-sysml`）打包了客户端与服务器，并加入语法
  高亮、`sysml.preview` webview 与 `sysml.exportSvg` 命令。见
  [`packages/vscode-sysml/README.md`](../../packages/vscode-sysml/README.md)。

流水线见[架构](architecture.zh.md)，如何产出这些产物见
[构建与测试](build-and-test.zh.md)。
