# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **ELK layout** — an optional `elkjs` backend with port constraints and
  orthogonal routing for IBD: library `renderSvgAsync(source, { layout: 'elk' })`
  and CLI `--layout elk` (dagre stays the default). In the browser bundle ELK is
  a lazy chunk, so dagre-only usage does not download it.
- **Wider coverage** — import variants (`all`, recursive `::*::**`, filter
  `::[expr]`), N-ary connectors `connect (a, b, c)`, control-node declarations
  (`merge` / `decide` / `fork` / `join`), `if` / `else` labelled successions,
  structured `while` / `loop` / `for` captured as statements, and
  `succession flow`.
- **Semantic validation** — checks that report positioned diagnostics:
  `type-kind-mismatch`, `satisfy-source-not-requirement` /
  `satisfy-target-is-requirement`, `verify-target-not-requirement`,
  `connect-endpoint-not-port`, `invalid-multiplicity`, and
  `specialization-cycle`.
- **Parser ease-ins** — modifier prefixes (`variation`, `individual`, `ordered`,
  `nonunique`, `snapshot`, `timeslice`, `derived`), feature default values
  (`= …` / `default = …`), named `binding`, conjugated port types `~T`,
  `metadata` / `concern` / `allocation` / KerML `class` / `assoc` / `connector` /
  `struct` / `datatype` / `calc` / `function` / `predicate` / `rendering` /
  `expr` declarations, `exhibit`, and requirement `stakeholder` / `actor` /
  `invariant`, plus view `frame` / `satisfy <viewpoint>`.
- **Language server** — go-to-definition, rename (with prepare), and document
  formatting, on top of diagnostics, completion, hover, and outline.
- **VS Code** — `sysml.preview.view` setting to choose the preview view.
- **More constructs** — `item def` / `item` / `ref item`, `alias X for Y;`,
  `allocate A to B;` and `allocation ... allocate ...`, `connection def` /
  `interface def` with `end` features, and `in` / `out` / `inout` feature
  directions.

- **View / viewpoint selection** — a small subset of `view` / `viewpoint` with
  `expose`, `filter @Metadata`, and `render`; the diagram kind is derived from
  the view definition's standard base (`GeneralView` → BDD, `InterconnectionView`
  → IBD, `ActionFlowView` → activity, `StateTransitionView` → state machine, and
  the project `RequirementView` → requirement).
- **Metadata annotations** — `#Name` before a definition/usage and `@Name;`
  inside a body.
- **`abstract` prefix** on definitions/usages, rendered in italics.
- Library `renderSvg(source, { viewName })` and CLI `--view-name`.

## [0.1.0] - 2026-09-24

The first release line. Renders SysML v2 textual notation (`.sysml`) as diagrams
through a DOM-free core shared by every entry point.

### Added

- **Core** — tokenizer, recursive-descent parser, semantic model with reference
  resolution and positioned diagnostics (`core/sysml`, `core/model`).
- **Views** — Block Definition Diagrams, Requirement diagrams, Internal Block
  Diagrams (ports and connectors), State machines, and Activity / Swimlane
  diagrams (`views/`).
- **Layout** — dagre, with a port-aware IBD layout and compound clusters for
  swimlanes (`layout/`).
- **Render** — DOM-free SVG generation from a scene plus a theme; block,
  pseudo-state, decision/fork, and group shapes (`render/`).
- **Library API** — `parseSysml`, `renderModel`, `renderSvg(source, { view, theme })`,
  `selectView`, `VERSION`, and the `sysml` Mermaid diagram + `registerSysml()`
  (`src/index.ts`).
- **CLI** — `sysml2svg <input.sysml> [-o out.svg] [--view <view>] [--json out.json]`.
- **Mermaid plugin** — an external diagram triggered by a leading `sysml [view]`
  line; a browser bundle at `dist/sysml2-mermaid.mjs`.
- **Language Server** — diagnostics, completion, hover, and document symbols
  (`packages/lsp`).
- **VS Code extension** — syntax highlighting, the language client, an SVG
  preview, and an export command (`packages/vscode-sysml`).
- **Demo** — a gallery and a playground served by `npm run dev`
  (`demo/`, `scripts/serve.mjs`).
- **Documentation** — usage, development, and about guides in English with
  `*.zh.md` Chinese copies (`docs/`).

[0.1.0]: https://github.com/fengdonglu/sysml2-mermaid/releases/tag/v0.1.0
