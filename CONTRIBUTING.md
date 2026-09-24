# Contributing to sysml2-mermaid

English | [中文](CONTRIBUTING.zh.md)

Thanks for your interest in improving `sysml2-mermaid`. This project renders
SysML v2 textual notation into diagrams as a Mermaid external diagram plugin and
ships a `sysml2svg` CLI, a language server, and a VS Code extension.

Please read [`AGENTS.md`](AGENTS.md) first: it is the canonical guide for the
repository layout, coding conventions, and how agents and humans collaborate
here.

## Development setup

Requirements: Node.js 20 or newer.

```bash
npm ci        # install exact dependencies (also links the packages/* workspaces)
npm run build # type-check + bundle (dist/)
npm run dev   # serve the demo at http://localhost:3000
```

The demo loads `dist/sysml2-mermaid.mjs`, so build before opening
`demo/index.html` (or use `npm run dev`, which serves it).

## Tests before implementation (TDD)

This project is developed test-first. Write a failing test that describes the
behavior you want, watch it fail for the expected reason, then write the minimal
code to make it pass. Do not add production code without a failing test.

```bash
npm test                                  # root suite
npm run typecheck                         # tsc --noEmit
npm run build                             # type-check + bundle
npm --prefix packages/lsp test            # language server
npm --prefix packages/vscode-sysml test   # VS Code extension
```

Run the relevant suites before opening a pull request. The parser must not
throw: report problems through diagnostics carrying line/column information.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` a new feature
- `fix:` a bug fix
- `docs:` documentation only
- `test:` tests only
- `refactor:` code change that neither fixes a bug nor adds a feature
- `chore:` build or tooling changes

Keep each commit focused and its subject in the imperative mood.

## Documentation

English is canonical. Chinese translations live beside the English file as a
`*.zh.md` sibling. Write all code comments and documentation in English; only
`*.zh.md` files may contain Chinese. If the two conflict, the English version
wins.

## Pull request checklist

- [ ] The change is covered by tests, and the new tests failed before the fix.
- [ ] `npm run typecheck`, `npm test`, and `npm run build` all pass locally.
- [ ] Comments and docs are in English, with `*.zh.md` copies where relevant.
- [ ] Commit messages follow Conventional Commits.
- [ ] User-facing changes are reflected in `README.md` and the `docs/` tree.
