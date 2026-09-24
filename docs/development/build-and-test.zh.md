# 构建与测试

[English](build-and-test.md) | 中文

## 安装

本仓库是一个 npm workspace（根目录加上 `packages/lsp` 与
`packages/vscode-sysml`）。在根目录安装一次即可：

```bash
npm ci
```

## 脚本

| 命令 | 作用 |
| --- | --- |
| `npm run build` | 做类型检查并把包输出到 `dist/`。 |
| `npm test` | 一次性运行根目录的 Vitest 套件（`vitest run`）。 |
| `npm run typecheck` | `tsc --noEmit` —— 只查类型，不产出文件。 |
| `npm run dev` | 通过 `scripts/serve.mjs` 在 3000 端口服务 `demo/` 页面。 |
| `npm run serve` | `npm run dev` 的别名。 |

`npm run build` 执行 `tsc -p tsconfig.build.json && node build.mjs`：

1. `tsc` 把 `src/` 下的每个文件编译进 `dist/`，为包和 CLI 同时产出 JavaScript
   与 `.d.ts` 声明。`tsconfig.build.json` 把构建限制在 `src/`
   （`tsconfig.json` 还包含 `test/`）。
2. `build.mjs` 用 esbuild 把 `src/index.ts` 打包成单个浏览器 ESM 文件，
   并把 `mermaid` 保留为外部依赖。

## 构建产物

| 路径 | 说明 |
| --- | --- |
| `dist/index.js` | 包入口（`main`/`module` 与 `.` 导出）以及 `dist/index.d.ts`。 |
| `dist/cli/cli.js` | `sysml2svg` 可执行文件（`bin` 入口）。 |
| `dist/sysml2-mermaid.mjs` | 打包后的浏览器构建（`./browser` 导出）。 |

demo 会加载 `dist/sysml2-mermaid.mjs`，所以请先运行 `npm run build`，再运行
`npm run dev`。

## 工作区包

每个包都是一个独立的 npm workspace，拥有自己的构建与测试脚本；可以用
`npm --prefix`（或在包目录内）运行。

| 包 | 命令 | 作用 |
| --- | --- | --- |
| `packages/lsp` | `npm --prefix packages/lsp run build` | 先 `tsc --noEmit`，再用 esbuild 把 `src/server.ts` 打包为 `dist/server.js`（bin `sysml-lsp`）。 |
| `packages/lsp` | `npm --prefix packages/lsp test` | 运行 LSP 的 Vitest 套件。 |
| `packages/vscode-sysml` | `npm --prefix packages/vscode-sysml run build` | 先 `tsc --noEmit`，再用 esbuild 把 `src/extension.ts` 打包为 `dist/extension.js`，把 `../lsp/src/server.ts` 打包为 `dist/server.js`。 |
| `packages/vscode-sysml` | `npm --prefix packages/vscode-sysml test` | 运行 VS Code 的 Vitest 套件。 |
| `packages/vscode-sysml` | `npm --prefix packages/vscode-sysml run package:vsix` | 先构建，再执行 `npx @vscode/vsce package --no-dependencies` 生成 VSIX。 |

`lsp` 与 `vscode-sysml` 在各自的 tsconfig/vitest/esbuild 配置中把
`sysml2-mermaid` 别名指向根目录的 `src/index.ts`，因此它们直接针对工作树构建，
无需先发布根包。

## 测试

测试位于 `test/`，在 [Vitest](https://vitest.dev) 下运行；根配置包含
`test/**/*.spec.ts`，环境为 `node`。完整套件：

```bash
npm test
```

单个文件：

```bash
npx vitest run test/parse-declarations.spec.ts
```

按标题运行单个测试（`-t` 匹配测试名）：

```bash
npx vitest run -t "duplicate"
```

迭代时可用 `npx vitest`（监听模式）。

### 按领域划分的 spec

| 领域 | Spec |
| --- | --- |
| 词法与解析 | `parse-lexical`、`parse-declarations`、`parse-relations`、`parse-requirements`、`parse-connections`、`parse-states`、`parse-activities` |
| 模型 | `model-types`、`model-validate` |
| 视图 | `views-bdd`、`views-requirement`、`views-ibd`、`views-statemachine`、`views-activity` |
| 布局 | `layout`、`layout-ibd`、`layout-groups` |
| 渲染 | `render-snapshot`、`render-states`、`render-ibd` |
| 入口 | `public-api`、`directive`、`cli`、`mermaid-integration` |
| 端到端 | `samples`（fixture 位于 `test/fixtures/*.sysml`）、`demo`、`conventions` |

`mermaid-integration.spec.ts` 通过 `// @vitest-environment jsdom` 文档块选择
jsdom 环境。工作区套件还包含 `packages/lsp/test/*.spec.ts`（各特性加一个针对
打包后服务器的冒烟测试）与 `packages/vscode-sysml/test/*.spec.ts`（对扩展源码、
`package.json` 贡献点与语法的静态检查）。

## 约定

本项目采用测试驱动：先写一个失败的测试，再让它通过（见
[`AGENTS.md`](../../AGENTS.md)）。提交前用 `npm run typecheck` 做类型检查，
并遵循 Conventional Commits。

各部分的组织方式见[架构](architecture.zh.md)，添加特性见[扩展](extending.zh.md)。
