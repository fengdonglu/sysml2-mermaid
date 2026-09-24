# Roadmap

English | [中文](roadmap.zh.md)

This page tracks what has shipped and what remains, updated from
[`docs/ROADMAP.md`](../ROADMAP.md). The current supported `.sysml` subset and
the five views are documented in the root [`README.md`](../../README.md). The
guiding principle is unchanged: text is the single source of truth and diagrams
are a projection.

## Shipped (through v0.4)

- **Parser** for the documented `.sysml` subset: packages and imports;
  `part def`/`part`, `attribute`, `port def`/`port`, `connection`
  (connect/interface/bind),
  `requirement def`/`requirement` with subjects and constraints, `state def`/
  `state` with `entry`/`do`/`exit` and transitions, `action def`/`action` with
  successions and flows, `enum`, `doc`/`comment`, and multiplicities.
- **Semantic model** (render-agnostic) with reference resolution and base
  validation (`duplicate-definition`, `unresolved-reference`), degrading
  unresolved references to `«unresolved»` placeholders plus warnings.
- **Five views** rendered end to end: **Block Definition Diagrams**,
  **Requirement** diagrams, **Internal Block Diagrams** (ports and connectors),
  **State machines**, and **Activity / Swimlane** diagrams.
- **Layout** via dagre, with a port-aware IBD adapter and compound graphs for
  swimlanes.
- **DOM-free SVG renderer** driven entirely by `Theme`.
- **Entry points**: library API, the `sysml2svg` CLI, and the Mermaid external
  diagram plugin.
- **Language Server** (`packages/lsp`): diagnostics, completion, hover, and
  document symbols.
- **VS Code extension** (`packages/vscode-sysml`): syntax highlighting, the
  language client, the `sysml.preview` webview, and `sysml.exportSvg`.
- **Demo** gallery and playground served by `npm run dev`.

## Next

- **View selection syntax.** Native SysML v2 `view` / `viewpoint` constructs to
  choose which elements a diagram shows, replacing the project-specific
  first-line `sysml <view>` directive.
- **ELK layout.** An alternative to dagre behind the layout dispatcher, for
  graphs dagre lays out poorly; IBD currently uses dagre with explicit port
  anchoring.
- **Systems Modeling API / JSON export.** A standard, interoperable export of
  the parsed model. Today the CLI `--json` writes only a plain
  `{ elements, relationships, diagnostics }` dump.
- **KerML / standard library coverage** beyond the documented subset.
- **Parametric diagram** and constraint/binding relationships.
- **More constructs**: `connection def` / `interface def` / `end` features,
  `allocation`, `item` usages, `abstract`, `alias`, `metadata`, and port
  conjugation (`~T`).
- **Editor features beyond v0.4**: go-to-definition, rename, code actions,
  formatting, and multi-file resolution.

## Not planned

- Full SysML v2 / KerML grammar and semantic conformance levels.
- Graphical editing and persisted layout.
- Simulation, constraint solvers, and multi-user repositories.
- Fixed-renderer support (GitHub Markdown cannot load external plugins) — use
  the `sysml2svg` CLI instead.

To add a view or notation, follow [Extending](extending.md); for the pipeline,
see [Architecture](architecture.md).
