# 编辑器集成

[English](editor-integration.md) | 中文

## LSP 与 VS Code 扩展

已有 SysML v2 语言服务器与 VS Code 扩展。服务器是 workspace 包 [`packages/lsp`](../../packages/lsp)（发布名 `sysml2-mermaid-lsp`，可执行文件 `sysml-lsp`），提供实时诊断、补全、悬停、文档大纲、跳转定义、重命名与格式化。扩展（`sysml2-mermaid-vscode`，位于 [`packages/vscode-sysml`](../../packages/vscode-sysml)）则增加 `.sysml` 语法高亮、语言客户端以及预览/导出命令。安装与用法见[《VS Code 扩展》](vscode.zh.md)。多文件解析尚未包含；见[路线图](../ROADMAP.zh.md)。

如果你使用其它编辑器，或不想安装该扩展，下面两条路径依然可用：调用 CLI，或从扩展中直接调用库。

## 方案 A：保存时运行 CLI

[`sysml2svg` CLI](cli.zh.md) 会把诊断以 `<severity>: <code> @<line>:<column> <message>` 打印到 stderr，并在存在任何 `error` 时以非零码退出。把它挂到编辑器的保存事件上并展示输出即可。

一个最小的 VS Code 任务：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "SysML check",
      "type": "shell",
      "command": "npx sysml2svg \"${file}\" -o \"${file}.svg\"",
      "problemMatcher": {
        "owner": "sysml",
        "fileLocation": ["relative", "${workspaceFolder}"],
        "pattern": {
          "regexp": "^(error|warning): (\\w[\\w-]*) @(\\d+):(\\d+) (.*)$",
          "severity": 1,
          "code": 2,
          "line": 3,
          "column": 4,
          "message": 5
        }
      }
    }
  ]
}
```

把该任务绑定到 `Run on Save`（或一个 `code --wait` 脚本）即可在每次写入时检查。任何能执行 shell 命令的编辑器都能照此处理。

## 方案 B：从扩展调用 `renderModel`

想要实时体验，就依赖本库并直接读取诊断。解析器从不抛异常，因此可以（防抖后）在每次按键时安全调用：

```ts
import { renderModel } from 'sysml2-mermaid';

const model = renderModel(source);
for (const d of model.diagnostics) {
  // d.severity: 'error' | 'warning' | 'info'
  // d.code:     例如 'unresolved-reference'
  // d.message:  英文可读文本
  // d.line, d.column: 从 1 开始的位置
}
```

把每条诊断映射为标记：

- **Monaco** —— `monaco.editor.setModelMarkers(model, 'sysml', markers)`，使用 `startLineNumber`/`startColumn`/`endLineNumber`/`endColumn`/`severity`（`MarkerSeverity.Error` / `.Warning`）与 `message`。
- **CodeMirror 6** —— 一个 `@codemirror/lint` 源，返回 `{ from, to, severity, message }`；用编辑器的 `state.doc.line(...)` 把行列转换为偏移量。

由于诊断只携带行列（不带长度），可高亮该行剩余部分或单个 token。

## 诊断参考

- `error` —— `unexpected-token`：输入不在支持的子集内。`unsupported-construct`：已识别的关键字被用于不支持的方式。`duplicate-definition`：同一限定名被定义两次。`expected-token` / `expected-name`：缺少必需的词元或名称。`invalid-multiplicity`：数值区间的下界大于上界。`specialization-cycle`：定义传递性地特化自身。
- `warning` —— `unresolved-reference`：类型或关系端点指向缺失的元素（退化为 `«unresolved»` 占位节点）。`type-kind-mismatch`：用法被不兼容的定义类别所类型化。`satisfy-source-not-requirement` / `satisfy-target-is-requirement`：`satisfy` 两端角色颠倒。`verify-target-not-requirement`：`verify` 指向非需求。`connect-endpoint-not-port`：连接器端点指向所属部件没有的端口。

解析器接受的内容见[《SysML 语法》](sysml-syntax.zh.md)。

## 另见

- [VS Code 扩展](vscode.zh.md) —— 语言客户端、其命令与内置的 `sysml2-mermaid-lsp` 服务器。
- [CLI：sysml2svg](cli.zh.md) —— 选项、退出码与诊断。
- [路线图](../ROADMAP.zh.md) —— 当前版本之后的计划。
