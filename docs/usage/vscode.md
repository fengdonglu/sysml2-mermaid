# VS Code extension

English | [中文](vscode.zh.md)

`sysml2-mermaid-vscode` adds SysML v2 support to VS Code: syntax highlighting for
`.sysml` files, live diagnostics, completion, hover, and a document outline, plus
two commands that render the current model. It bundles the
[`sysml2-mermaid-lsp`](#the-language-server) language server and talks to it over
stdio.

The extension source lives in
[`packages/vscode-sysml`](../../packages/vscode-sysml/README.md).

## Install

The extension is **not published to the Marketplace yet**. Until it is, install
it from a VSIX:

1. Build and package it from the repository:
   `npm run package:vsix -w sysml2-mermaid-vscode` (this runs the extension build
   and `vsce package`, producing a `sysml2-mermaid-vscode-*.vsix`).
2. In VS Code, open the Command Palette, run **Extensions: Install from VSIX…**,
   and pick the file.
3. Reload when prompted.

VS Code **1.94** or newer is required.

## What it provides

Open any `.sysml` file; the extension activates on the `sysml` language and
provides:

- **Syntax highlighting** — a TextMate grammar for the `sysml` header, storage
  keywords (`package`, `part`, `requirement`, `state`, `action`, …), relationship
  keywords (`satisfy`, `connect`, `flow`, …), and comments.
- **Diagnostics** — the same diagnostics as `renderModel().diagnostics`,
  squiggled live as you type.
- **Completion** — SysML keywords plus the elements already declared in the open
  file.
- **Hover** — kind, qualified name, type, id, and documentation of the name under
  the cursor.
- **Outline** — the model hierarchy in the Outline view.
- **Go to definition** — jump from a name to the element it declares.
- **Rename** — rename an element and every occurrence of its name.
- **Formatting** — re-indent the document.

Diagnostics are on by default; set `sysml.diagnostics.enable` to `false` to
silence them.

## Commands

Open the Command Palette with a `.sysml` file focused:

- **SysML: Open Preview** (`sysml.preview`) — renders the current file as a
  diagram in a webview beside the editor and refreshes on every edit.
- **SysML: Export SVG** (`sysml.exportSvg`) — renders the current file and writes
  the SVG to a path you choose.

Both use `renderSvg` from the core library, so the preview and the exported SVG
match the CLI and the Mermaid plugin. The view follows the file's first-line
directive (`sysml <view>`), defaulting to the **Block Definition Diagram**.

## Settings

| Setting | Type | Default | Meaning |
| --- | --- | --- | --- |
| `sysml.diagnostics.enable` | boolean | `true` | Turn inline diagnostics on or off. |
| `sysml.preview.view` | enum | empty | View used by **SysML: Open Preview**; empty follows the model's `view` / first-line directive. |

## The language server

The extension launches the `sysml2-mermaid-lsp` server as a bundled file
(`dist/server.js`) over stdio; you do not install it separately for VS Code. The
server is editor-agnostic and ships as the workspace package
[`sysml2-mermaid-lsp`](../../packages/lsp) exposing a `sysml-lsp` binary, so
other LSP clients can reuse it.

## Not included yet

Multi-file resolution and workspace-wide refactoring are not part of this
release; see the [roadmap](../ROADMAP.md).

## See also

- [Editor integration](editor-integration.md) — CLI-on-save and library-API
  alternatives.
- [CLI: sysml2svg](cli.md) — batch conversion outside the editor.
- [Diagnostics reference](editor-integration.md#diagnostics-reference) — the
  `error` and `warning` codes the editor shows.
