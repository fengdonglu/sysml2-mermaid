# Roadmap

English | [中文](ROADMAP.zh.md)

The roadmap follows the "text is the source of truth, diagrams are a projection"
principle. It starts with the diagram types that map cleanly onto node/edge
graphs and defers the ones that need dedicated layout.

## MVP (v0.1)

- **Parser** for a documented `.sysml` subset: packages, `part def` / `part`
  usage, `attribute`, `port def` / `port`, `connection`, `requirement def` /
  `requirement`, `state def` / `state`, `action def` / `action`, `enum`, and
  `import` (single file + built-in library subset).
- **Semantic model** (render-agnostic) with reference resolution and base
  validation (undefined references, duplicate definitions).
- **View projection** for:
  - **BDD** — definitions/usages and their relationships.
  - **Requirement** — requirements and their relationships.
  - **State machine** — states and transitions.
  - **Activity / swimlane** — actions and control flow.
- **Layout** via dagre; **DOM-free SVG renderer**.
- **Three entry points**: Mermaid external diagram plugin, CLI `sysml2svg`,
  and the library API.
- **Diagnostics** with line/column, unit tests, and executable documentation
  examples.

## v0.2

- **Internal Block Diagram (IBD)** — ports and connectors; likely via ELK with
  port constraints rather than generic dagre.
- **Parametric diagram** — constraint/binding relationships.
- **View selection syntax** — a small `view`/`viewpoint` subset to choose which
  elements a diagram shows.
- **ELK layout** option alongside dagre.

## v0.3+

- **Language Server** — diagnostics, completion, hover, outline (reusing the
  core parser), then go-to-definition.
- **VS Code extension** — syntax highlighting, the language client, and a
  preview command.
- **Systems Modeling API / JSON** export of the parsed model (interoperability).
- **KerML / standard library** coverage beyond the MVP subset.

## Explicitly out of scope (for now)

- Full SysML v2 / KerML grammar and semantic conformance levels.
- Graphical editing and persisted layout.
- Simulation, constraint solvers, and multi-user repositories.

## Relationship to `mermaid-opm`

The sibling project `mermaid-opm` (OPM/OPL, ISO 19450) already implements the
same shape — Mermaid plugin, CLI, LSP, and VS Code extension — and serves as the
reference for this project's architecture and conventions.
