# sysml2-mermaid-lsp

Language Server for **SysML v2** textual notation (`.sysml`), used by the
[`sysml2-mermaid`](https://github.com/fengdonglu/sysml2-mermaid) VS Code
extension and reusable by any LSP client.

## Features

- **Diagnostics** — parse, resolution and semantic problems with positions.
- **Completion** — SysML keywords plus the elements declared in the file.
- **Hover** — kind, qualified name, type, id, and documentation.
- **Document symbols** — the model hierarchy for the Outline view.
- **Go to definition**, **rename** (with prepare), and **formatting**.

## Usage

The server speaks LSP over stdio and ships a `sysml-lsp` binary:

```bash
npx sysml-lsp --stdio
```

In VS Code, install **sysml2-mermaid** from the Marketplace; it bundles this
server, so no separate install is needed.

## License

MIT © fengdonglu
