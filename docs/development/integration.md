# Integration

English | [中文](integration.zh.md)

`sysml2-mermaid` ships as an ESM package with two entrypoints:

```json
"exports": {
  ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
  "./browser": "./dist/sysml2-mermaid.mjs"
}
```

The root import is the library and plugin API; the `sysml2svg` CLI is a
separate `bin`. `./browser` is the bundled browser build used by the Mermaid
plugin. `mermaid` is an **optional** peer dependency (`>= 11`): only
`registerSysml()` imports it at runtime.

## Mermaid host version

The Mermaid plugin uses the external-diagram API
(`mermaid.registerExternalDiagrams`, introduced in Mermaid v11). The package
declares `mermaid: ">=11"` as an optional peer dependency and is developed and
tested against Mermaid v12. Bundlers and CDNs therefore need a Mermaid v11 or
newer host.

## Bundlers (Vite, webpack)

Both resolve the bare `mermaid` specifier and the package `exports` map for you.

```js
// Vite or webpack
import { renderSvg, registerSysml } from 'sysml2-mermaid';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false });
await registerSysml();

const svg = renderSvg(
  'sysml\npackage P { part def Engine; part def Car :> Engine; }',
  { view: 'bdd' },
);
```

For the plugin path, initialize Mermaid and register the diagram before the
first render, with auto-run disabled.

## Plain ESM in Node

```js
import { renderModel, renderSvg } from 'sysml2-mermaid';

const svg = renderSvg('sysml\npackage P { part def Engine; part def Car :> Engine; }');
const model = renderModel('sysml\npackage P { part def Engine; }');
console.log(model.diagnostics);
```

Because `registerSysml()` is the only thing that imports `mermaid`, you can
import `sysml2-mermaid` on the server without installing `mermaid`.

## Node / SSR

The render core is DOM-free, so both functions are safe on the server:

- `renderModel(source)` returns the parsed, validated `SysmlModel` (a `Map` of
  elements plus `relationships` and `diagnostics`). It never throws and never
  touches the DOM.
- `renderSvg(source, { view, theme })` returns an SVG **string** you can embed
  in any server-rendered page. When no `view` is given it uses the first-line
  `sysml <view>` directive, falling back to `bdd`.

```js
import { renderSvg } from 'sysml2-mermaid';

const svg = renderSvg(source); // string, no DOM required
```

The CLI relies on the same DOM-free path, so it runs in CI without a browser.

## CDN in the browser

Load the browser bundle directly from a CDN. It keeps a bare
`import('mermaid')`, so provide an import map for `mermaid`:

```html
<script type="importmap">
{
  "imports": {
    "mermaid": "https://cdn.jsdelivr.net/npm/mermaid@12/dist/mermaid.esm.min.mjs"
  }
}
</script>
<script type="module">
  import mermaid from 'mermaid';
  import { registerSysml } from 'https://cdn.jsdelivr.net/npm/sysml2-mermaid/dist/sysml2-mermaid.mjs';

  mermaid.initialize({ startOnLoad: false });
  await registerSysml();
</script>
```

Without the import map, `registerSysml()` throws
`Failed to resolve module specifier "mermaid"`.

## The `mermaid` peer dependency

- Declared as an optional peer dependency (`>= 11`) in `package.json`.
- Required at runtime only by `registerSysml()`; the external-diagram
  definition type-imports `mermaid` only.
- `renderModel`, `renderSvg`, and the `sysml2svg` CLI work without it.

## The CLI

For batch or CI use, install the CLI or run it with `npx`:

```bash
npx sysml2svg model.sysml -o model.svg --view bdd
```

Add `--json out.json` to also write a plain
`{ elements, relationships, diagnostics }` dump.

## Editor integration

- **Language Server** (`packages/lsp`) exposes the `sysml-lsp` binary and speaks
  LSP over stdio; point any language client at it.
- **VS Code extension** (`packages/vscode-sysml`) bundles the client plus the
  server and adds syntax highlighting, the `sysml.preview` webview, and the
  `sysml.exportSvg` command. See
  [`packages/vscode-sysml/README.md`](../../packages/vscode-sysml/README.md).

See [Architecture](architecture.md) for the pipeline and
[Build and test](build-and-test.md) for producing these artifacts.
