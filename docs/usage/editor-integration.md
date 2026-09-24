# Editor integration

English | [中文](editor-integration.zh.md)

## LSP and VS Code extension

A SysML v2 language server and a VS Code extension are available. The server is
the workspace package [`packages/lsp`](../../packages/lsp) (published as
`sysml2-mermaid-lsp`, binary `sysml-lsp`); it provides live diagnostics,
completion, hover, a document outline, go-to-definition, rename, and formatting.
The extension
(`sysml2-mermaid-vscode`, [`packages/vscode-sysml`](../../packages/vscode-sysml))
adds `.sysml` syntax
highlighting, the language client, and the preview/export commands. See the
[VS Code extension](vscode.md) page for install and usage. Multi-file resolution
is not included yet; see the [roadmap](../ROADMAP.md).

If you use another editor, or prefer not to install the extension, the two paths
below still work: shell out to the CLI, or call the library directly from an
extension.

## Option A: run the CLI on save

The [`sysml2svg` CLI](cli.md) prints diagnostics to stderr as
`<severity>: <code> @<line>:<column> <message>` and exits non-zero on any
`error`. Hook it to your editor's save event and surface the output.

A minimal VS Code task:

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

Bind the task to `Run on Save` (or a `code --wait` script) to check on every
write. Any editor that can run a shell command can do the same.

## Option B: call `renderModel` from an extension

For a live experience, depend on the library and read diagnostics directly. The
parser never throws, so this is safe to call on every keystroke (debounced):

```ts
import { renderModel } from 'sysml2-mermaid';

const model = renderModel(source);
for (const d of model.diagnostics) {
  // d.severity: 'error' | 'warning' | 'info'
  // d.code:     e.g. 'unresolved-reference'
  // d.message:  human-readable text (English)
  // d.line, d.column: 1-based position
}
```

Map each diagnostic to a marker:

- **Monaco** — `monaco.editor.setModelMarkers(model, 'sysml', markers)` with
  `startLineNumber`/`startColumn`/`endLineNumber`/`endColumn`/`severity`
  (`MarkerSeverity.Error` / `.Warning`) and `message`.
- **CodeMirror 6** — a `@codemirror/lint` source returning
  `{ from, to, severity, message }`; convert line/column to an offset with the
  editor's `state.doc.line(...)`.

Because a diagnostic carries only line/column (not a length), highlight the rest
of the line or a single token.

## Diagnostics reference

- `error` — `unexpected-token`: the input is not part of the supported subset.
  `unsupported-construct`: a recognized keyword is used in an unsupported way.
  `duplicate-definition`: the same qualified name is defined twice.
  `expected-token` / `expected-name`: a mandatory token or name is missing.
  `invalid-multiplicity`: a numeric range has lower > upper.
  `specialization-cycle`: a definition specializes itself transitively.
- `warning` — `unresolved-reference`: a type or relationship endpoint points at a
  missing element (it degrades to an `«unresolved»` placeholder).
  `type-kind-mismatch`: a usage is typed by an incompatible definition kind.
  `satisfy-source-not-requirement` / `satisfy-target-is-requirement`:
  `satisfy` roles are the wrong way round.
  `verify-target-not-requirement`: `verify` points at a non-requirement.
  `connect-endpoint-not-port`: a connector endpoint names a port the owning part
  does not have.

See [SysML syntax](sysml-syntax.md) for what the parser accepts.

## See also

- [VS Code extension](vscode.md) — the language client, its commands, and the
  bundled `sysml2-mermaid-lsp` server.
- [CLI: sysml2svg](cli.md) — options, exit codes, and diagnostics.
- [Roadmap](../ROADMAP.md) — planned work after the current release.
