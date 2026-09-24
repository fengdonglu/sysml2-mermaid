# Architecture

English | [中文](ARCHITECTURE.zh.md)

`sysml2-mermaid` mirrors the proven layering of `mermaid-opm`: a render-agnostic
core, one layout step, one DOM-free renderer, and several thin entry points.

## Data flow

```
.sysml text (single source of truth)
  │
  ▼  core/parse      tokenize → parse → semantic model + diagnostics (line/col)
semantic model        (elements, relationships, types)
  │
  ▼  views           project the model into a view description
                      (BDD, requirements, state, activity, …)
view description      nodes, edges, groups (renderer-agnostic)
  │
  ▼  layout           dagre / ELK → positioned scene
scene
  │
  ▼  render           scene → SVG string (DOM-free, theme-driven)
SVG
  ├─ entry point A: Mermaid external diagram plugin
  ├─ entry point B: CLI `sysml2svg`
  ├─ entry point C: Language Server (LSP)
  └─ entry point D: VS Code extension (client + preview)
```

## Design principles

1. **Text is the only source of truth.** No layout is persisted; SVG is an
   on-demand projection recomputed from the text.
2. **The render core is DOM-free.** `sceneToSvg(scene): string` is a pure
   function shared by the Mermaid plugin, the CLI, and the VS Code preview.
3. **Views are a selection step.** A SysML model can yield many diagrams; the
   view layer decides which elements a given diagram shows, before layout.
4. **Errors never crash.** The parser reports positioned diagnostics; unresolved
   references degrade to placeholders plus warnings.
5. **Layered so it can grow.** Parsing, the model, view projection, layout, and
   rendering are independent; a new diagram type is a new view + renderer, not a
   rewrite.

## Repository layout

```
src/
  core/      .sysml parsing + semantic model (pure, no DOM)
  views/     model → view description (per diagram type)
  layout/    view → scene (dagre / ELK)
  render/    scene → SVG string (DOM-free, theme-driven)
  mermaid/   Mermaid external diagram integration
  cli/       sysml2svg
packages/
  lsp/       Language Server (npm workspace)
  vscode/    VS Code extension (npm workspace)
test/        vitest specs
docs/        documentation
reference/   local-only reference material (git-ignored)
```

## Why Mermaid

Mermaid already provides the second half of the pipeline — a node/edge graph
model and layout engines (dagre, ELK). A SysML tool can reuse that and focus on
the first half: understanding `.sysml` text and projecting it into diagrams. For
diagram types that are genuinely node/edge (BDD, requirements, state, activity)
this is a very small amount of work; for port/constraint-heavy views (IBD,
parametric) Mermaid's generic graph is not enough and a dedicated layout step is
required.

## Relationship to `mermaid-opm`

`sysml2-mermaid` deliberately reuses the architecture, tooling, and conventions
of `mermaid-opm` (TypeScript ESM, DOM-free render core, `parser → model → layout
→ render`, Mermaid plugin + CLI + LSP + VS Code extension, bilingual docs). The
differences are the input language (`.sysml` vs OPL) and the richer view layer
SysML requires.
