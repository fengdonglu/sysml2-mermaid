# FAQ

English | [中文](faq.zh.md)

## Why Mermaid?

Most models live next to the prose that explains them, and Mermaid is the
de-facto diagram language of Markdown and documentation sites. Its **external
diagram** API lets a project add a new diagram type without forking Mermaid, so
`sysml2-mermaid` can register a diagram type whose fenced block renders wherever
the plugin is loaded. A SysML view is, for the node/edge diagram types, a
directed graph that maps cleanly onto a layout engine.

## Why is layout not persisted?

Layout is derived, not stored, so the same model always produces the same
diagram. There is no separate layout file to keep in sync, and no format,
versioning, or invalidation rules to invent when a model changes. Position is a
pure function of the model (via [dagre](https://github.com/dagrejs/dagre), with
an ELK option on the [roadmap](../ROADMAP.md)). This mirrors the principle that
**`.sysml` text is the only source of truth**; see the
[design background](../design/BACKGROUND.md).

## Why is there no graphical editing?

The tool is a **renderer**, not an editor. Editing needs a canvas, hit-testing,
selection, and undo/redo — essentially a different product. Keeping the source
of truth as **`.sysml` text** makes models diffable, reviewable, and mergeable
in git, and keeps the parser and renderer DOM-free and testable. The
[demo](../../demo/index.html) and [playground](../../demo/playground.html) only
view, edit, and switch between examples.

## Why not implement the full SysML v2 grammar?

SysML v2 is far broader than a flowchart language: behavior, requirements,
parametric constraints, allocations, and viewpoints all matter. Full grammar and
semantic conformance are deliberately **out of scope** — a v1 that claims full
conformance would be neither honest nor maintainable. Instead the parser accepts
a documented `.sysml` subset, never throws, and reports everything else through
diagnostics carrying line and column information. What that subset covers is
listed in the [roadmap](../ROADMAP.md) and described in
[What is SysML v2?](what-is-sysml.md).

## Is there an LSP and a VS Code extension?

Yes. `packages/lsp` is a language server built on the core parser and its
diagnostics, and `packages/vscode-sysml` is a VS Code extension that bundles it,
with syntax highlighting and an SVG preview. The server is editor-agnostic, so
other LSP clients can reuse it.

## How do I render a diagram on GitHub?

GitHub's Markdown renderer does not load third-party Mermaid plugins, so a
fenced SysML block appears as source code, not a diagram. Two options:

- **Pre-render to SVG.** Run the `sysml2svg` CLI on the source, commit the
  result, and embed it:

  ```bash
  npx sysml2svg model.sysml --view bdd -o model.svg
  ```

  Then reference `model.svg` as an image in your Markdown.

- **Render in a host you control** — any page that loads the plugin, such as the
  [demo](../../demo/index.html) or the
  [playground](../../demo/playground.html).

## How is this related to `mermaid-opm`?

[`mermaid-opm`](https://github.com/fengdonglu/mermaid-opm) renders OPM/OPL
(ISO 19450) and is the sibling project this repository mirrors. They share the
same architecture (DOM-free core, `parser → model → layout → render`), the same
entry points (Mermaid plugin, CLI, LSP, VS Code extension), the same tooling,
and the same bilingual-docs convention. The differences are the input language
(`.sysml` versus OPL) and the richer view layer SysML requires; see
[Architecture](../ARCHITECTURE.md).

## How do I contribute?

Read [`AGENTS.md`](../../AGENTS.md) first. In short: TypeScript with ESM, a
DOM-free render core, TDD (write a failing test first), Conventional Commits,
and English as the canonical language for code comments, documentation, and
commit messages — Chinese copies live beside English docs as `*.zh.md` siblings.
Take colors only from the `Theme`, keep the parser non-throwing, and support
exactly the documented `.sysml` subset rather than inventing syntax.
