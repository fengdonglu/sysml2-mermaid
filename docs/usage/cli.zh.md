# CLI：sysml2svg

[English](cli.md) | 中文

`sysml2svg` 把 `.sysml` 文件转换为 SVG 图表，并把解析模型的诊断打印到 stderr。

## 用法

```
sysml2svg <input.sysml> [-o out.svg] [--view bdd|requirement|ibd|statemachine|activity] [--view-name NAME] [--layout dagre|elk] [--json out.json]
```

## 选项

| 选项 | 含义 |
| --- | --- |
| `-o <file>` | 将 SVG 写入 `<file>`。默认：输入路径把扩展名替换为 `.svg`（`.sysml` 被替换）。 |
| `--view <name>` | 选择视图，取值为 `bdd`、`requirement`、`ibd`、`statemachine`、`activity` 之一。默认 `bdd`。 |
| `--view-name <name>` | 渲染具名 `view`（其类型与 `expose` / `filter` 作用域）。 |
| `--layout <engine>` | `dagre`（默认）或 `elk`。ELK 为 IBD 提供端口感知的正交路由。 |
| `--json <file>` | 额外把 `{ elements, relationships, diagnostics }` 以美化 JSON 写出。 |

选项可在输入文件之后以任意顺序出现。`-o`、`--view`、`--json` 都需要取值；缺少取值（或取值以 `-` 开头）属于用法错误。

## 退出码

- `0` —— 成功。警告**不**影响退出码。
- `1` —— 失败：存在任何 `error` 诊断、视图名未知、输入文件不可读或不存在，或用法错误（缺少输入、未知选项、缺少选项取值）。

未知选项会先打印一行 `error:`，再打印用法行；缺少输入参数或缺少选项取值时只打印用法行。输入文件不可读或不存在时打印 `error: cannot read <file>: <原因>`，且不打印用法行。这些都写入 stderr：

```
error: unknown argument: --theme
usage: sysml2svg <input.sysml> [-o out.svg] [--view bdd|requirement|ibd|statemachine|activity] [--view-name NAME] [--layout dagre|elk] [--json out.json]
```

## 诊断

诊断逐行写入 stderr，格式为：

```
<severity>: <code> @<line>:<column> <message>
```

解析器从不抛异常。会出现的 code 包括 `error` 类的 `unexpected-token`、`unsupported-construct`、`duplicate-definition`，以及 `warning` 类的 `unresolved-reference`。即使存在诊断，SVG 仍会写出，便于查看部分渲染结果；退出码仍反映是否存在 `error`。

## 示例

给定 `model.sysml`：

```sysml
sysml bdd
package Vehicle {
    part def PowerSource;
    part def Engine :> PowerSource;
    part def Vehicle {
        part engine : Engine;
    }
}
```

转换为 `model.svg`（默认输出路径）：

```bash
npx sysml2svg model.sysml
```

指定视图与输出路径，并同时导出模型：

```bash
npx sysml2svg model.sysml --view ibd -o out/diagram.svg --json out/diagram.json
```

在脚本中使用，出错即失败：

```bash
npx sysml2svg model.sysml -o model.svg || exit 1
```

## 另见

- [快速开始](getting-started.zh.md) —— 安装与首次渲染。
- [SysML 语法](sysml-syntax.zh.md) —— 支持的子集。
- [编辑器集成](editor-integration.zh.md) —— 用 CLI 做保存时诊断。
