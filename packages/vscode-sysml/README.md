# sysml2-mermaid for VS Code

VS Code support for **SysML v2** textual notation (`.sysml`), backed by the
[`sysml2-mermaid-lsp`](../lsp) language server.

## Features

- **Syntax highlighting** for `.sysml` files.
- **Diagnostics** — parse and model problems reported inline as you type.
- **Completion** — SysML keywords plus the elements declared in the file.
- **Hover** — kind, qualified name, type, and documentation of an element.
- **Outline** — the model hierarchy in the Outline view.
- **Go to definition**, **rename**, and **formatting**.

## Commands

- **SysML: Open Preview** — render the active `.sysml` file as a diagram in a side panel.
- **SysML: Export SVG** — render the active `.sysml` file to an `.svg` file.

## Requirements

- VS Code 1.94 or newer.

## Settings

- `sysml.diagnostics.enable` (boolean, default `true`) — turn inline diagnostics on or off.
- `sysml.preview.view` (enum, default empty) — which view the preview uses; empty
  follows the model's `view` / first-line directive.

## Notes

- The language server is bundled with the extension; no separate install is needed.
