# AGENTS.md

Guidance for AI agents and contributors working in this repository.

## Project

`sysml2-mermaid` renders **SysML v2** textual models (`.sysml`) as diagrams. It
is planned as a Mermaid external diagram plugin plus a CLI converter, a Language
Server, and a VS Code extension — mirroring the proven layering of the sibling
project `mermaid-opm` (OPM/OPL).

The project is at an **early scaffolding stage**: the documentation and design
live here first; functional code follows.

## Planned repository layout

- `src/core/` — parsing and semantic model layer for a SysML v2 text subset
  (pure logic, no DOM): tokenizer, parser, model, diagnostics.
- `src/views/` — projects the semantic model into view descriptions (BDD, requirements, state, activity, …).
- `src/layout/` — turns a view description into a laid-out scene (dagre/ELK).
- `src/render/` — DOM-free SVG string generation from a scene plus a theme.
- `src/mermaid/` — Mermaid external diagram integration.
- `src/cli/` — `sysml2svg` command-line entry point.
- `packages/lsp/` — the Language Server (npm workspace).
- `packages/vscode-sysml/` — the VS Code extension (npm workspace).
- `test/` — vitest specs and shared setup.
- `docs/` — user and developer documentation.
- `reference/` — local-only reference material (git-ignored; not published).

## Commands

- `npm run build` — type-check and bundle (`dist/`).
- `npm test` — run the vitest suite.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run dev` — local dev server for the demo.

## Coding conventions

- TypeScript with ESM; use explicit `.js` import suffixes for relative imports.
- Write all code comments and documentation in **English**. Only `*.zh.md`
  files may contain Chinese.
- The render core must be DOM-free: it produces SVG strings and must not touch
  `document`/`window`. DOM access belongs to the Mermaid integration, the LSP's
  VS Code client, and the demo.
- Take colors only from the `Theme`; never hard-code palette values.
- The parser must not throw: report problems through diagnostics carrying
  line/column information.
- TDD is expected: write a failing test first, then make it pass.
- Never invent SysML v2 syntax. Support exactly the documented `.sysml` subset;
  unknown constructs are out of scope until specified.

## Docs conventions

- English is canonical. Chinese copies live beside the English file as
  `*.zh.md` siblings; if the two conflict, English wins.
- Keep design and planning documents under `docs/`.

## Commits

Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`,
`refactor:`, etc.

## Vibe Coding

This project is developed via AI-assisted "Vibe Coding", with agents and humans
collaborating iteratively.
