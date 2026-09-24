# Build and test

English | [中文](build-and-test.zh.md)

## Install

The repository is an npm workspace (root plus `packages/lsp` and
`packages/vscode-sysml`). Install once from the root:

```bash
npm ci
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks and emits the package into `dist/`. |
| `npm test` | Runs the root Vitest suite once (`vitest run`). |
| `npm run typecheck` | `tsc --noEmit` — types only, no output. |
| `npm run dev` | Serves the `demo/` page via `scripts/serve.mjs` on port 3000. |
| `npm run serve` | Alias for `npm run dev`. |

`npm run build` runs `tsc -p tsconfig.build.json && node build.mjs`:

1. `tsc` compiles every file under `src/` into `dist/`, emitting JavaScript and
   `.d.ts` declarations for both the package and the CLI. `tsconfig.build.json`
   restricts the build to `src/` (`tsconfig.json` also includes `test/`).
2. `build.mjs` uses esbuild to bundle `src/index.ts` into a single browser ESM
   file, leaving `mermaid` external.

## Build outputs

| Path | What it is |
| --- | --- |
| `dist/index.js` | The package entry (`main`/`module` and the `.` export) plus `dist/index.d.ts`. |
| `dist/cli/cli.js` | The `sysml2svg` executable (the `bin` entry). |
| `dist/sysml2-mermaid.mjs` | The bundled browser build (the `./browser` export). |

The demo loads `dist/sysml2-mermaid.mjs`, so run `npm run build` before
`npm run dev`.

## Workspace packages

Each package is an npm workspace with its own build and test scripts; run them
with `npm --prefix` (or from inside the package directory).

| Package | Command | What it does |
| --- | --- | --- |
| `packages/lsp` | `npm --prefix packages/lsp run build` | `tsc --noEmit`, then esbuild bundles `src/server.ts` into `dist/server.js` (bin `sysml-lsp`). |
| `packages/lsp` | `npm --prefix packages/lsp test` | Runs the LSP Vitest suite. |
| `packages/vscode-sysml` | `npm --prefix packages/vscode-sysml run build` | `tsc --noEmit`, then esbuild bundles `src/extension.ts` into `dist/extension.js` and `../lsp/src/server.ts` into `dist/server.js`. |
| `packages/vscode-sysml` | `npm --prefix packages/vscode-sysml test` | Runs the VS Code Vitest suite. |
| `packages/vscode-sysml` | `npm --prefix packages/vscode-sysml run package:vsix` | Runs the build, then `npx @vscode/vsce package --no-dependencies` to produce the VSIX. |

The `lsp` and `vscode-sysml` packages alias `sysml2-mermaid` to the root
`src/index.ts` in their tsconfig/vitest/esbuild configs, so they build against
the working tree without a prior root publish.

## Testing

Tests live in `test/` and run under [Vitest](https://vitest.dev); the root
config includes `test/**/*.spec.ts` with the `node` environment. The full suite:

```bash
npm test
```

A single file:

```bash
npx vitest run test/parse-declarations.spec.ts
```

A single test by title (`-t` matches the test name):

```bash
npx vitest run -t "duplicate"
```

Use `npx vitest` (watch mode) while iterating.

### Specs by area

| Area | Specs |
| --- | --- |
| Lexer and parser | `parse-lexical`, `parse-declarations`, `parse-relations`, `parse-requirements`, `parse-connections`, `parse-states`, `parse-activities` |
| Model | `model-types`, `model-validate` |
| Views | `views-bdd`, `views-requirement`, `views-ibd`, `views-statemachine`, `views-activity` |
| Layout | `layout`, `layout-ibd`, `layout-groups` |
| Render | `render-snapshot`, `render-states`, `render-ibd` |
| Entry points | `public-api`, `directive`, `cli`, `mermaid-integration` |
| End to end | `samples` (fixtures under `test/fixtures/*.sysml`), `demo`, `conventions` |

`mermaid-integration.spec.ts` opts into jsdom with a `// @vitest-environment
jsdom` docblock. The workspace suites add `packages/lsp/test/*.spec.ts`
(features plus a packaged-server smoke test) and
`packages/vscode-sysml/test/*.spec.ts` (static checks on the extension source,
`package.json` contributions, and the grammar).

## Conventions

The project is test-driven: write a failing test first, then make it pass (see
[`AGENTS.md`](../../AGENTS.md)). Type-check with `npm run typecheck` before
committing, and follow Conventional Commits.

See [Architecture](architecture.md) for how the pieces fit together and
[Extending](extending.md) for adding features.
