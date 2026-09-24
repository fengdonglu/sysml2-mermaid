# Session handoff

English | [中文](SESSION-HANDOFF.zh.md)

> Purpose: carry the context of the previous working session into this project
> so work can continue in a fresh opencode session opened in this directory.

## Where this came from

This project (`sysml2-mermaid`) was bootstrapped at the end of a long session
that built its sibling project **`mermaid-opm`** — a Mermaid external diagram
plugin + CLI + LSP + VS Code extension that renders ISO 19450 **OPM/OPL** into
Object-Process Diagrams. That project is complete (v0.1.0), published on GitHub
(`fengdonglu/mermaid-opm`), with a CI pipeline, GitHub Pages demo, and a released
VS Code VSIX.

The full raw transcript of that session is kept locally (git-ignored):
`reference/opencode-session-opm-opl.json` (exported with `opencode export`).
The earlier SysML v2 design discussion is also local:
`reference/yuanbao-sysml2-discussion.txt`.

## What `mermaid-opm` established (the pattern to reuse)

- **Text is the single source of truth; diagrams are a live projection.** No
  persisted layout, no graphical editing.
- **DOM-free render core:** `parser → model → layout → render(scene) → SVG string`,
  shared by every entry point.
- **Multiple thin entry points:** a Mermaid external diagram plugin, a CLI
  (`opm2svg`), and a library API; later a language server and a VS Code
  extension.
- **Tooling/conventions:** TypeScript ESM with `.js` import suffixes, vitest,
  esbuild, npm workspaces for the LSP/VS Code packages, English-only code and
  docs with `*.zh.md` Chinese copies, Conventional Commits, TDD, and an
  AI-assisted "Vibe Coding" workflow driven by subagents.
- **Publishing:** MIT, `fengdonglu`; CI (build/test), GitHub Pages (demo),
  Release workflow that attaches the VS Code VSIX.

## Decisions already made for `sysml2-mermaid`

- Input: **SysML v2 textual notation** (`.sysml`). Scope is a documented subset,
  never the full language.
- Approach: the same as `mermaid-opm` (Mermaid plugin + CLI + LSP + VS Code
  extension; text SSOT; auto-layout; no persisted layout).
- MVP diagram types (node/edge friendly): **BDD**, **Requirement**, **State
  machine**, **Activity/Swimlane**. **IBD** and **Parametric** come later
  (they need port/constraint layout).
- Repo: single package core + npm workspaces for `lsp` and `vscode`; bilingual
  docs; MIT; GitHub under `fengdonglu`.

## Immediate next step

Per our workflow (**brainstorm → spec → plan → implement with subagents**), the
next step is to **brainstorm the SysML v2 MVP scope**: which `.sysml` constructs
the v0.1 parser supports, and what each of the first views shows. Then write a
design spec, then an implementation plan, then build with TDD.

## Note on resuming sessions

`opencode -c` continues the last session **of the current directory's project**,
so opening it in this directory will not, by itself, resume the earlier
`mermaid-opm` session. This handoff file (plus the exported JSON in `reference/`)
is the intended way to carry the context over. You can also try
`opencode import reference/opencode-session-opm-opl.json` if you want the raw
transcript loaded.
