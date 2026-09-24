# Getting started

English | [中文](getting-started.zh.md)

`sysml2-mermaid` turns **SysML v2** textual models (`.sysml`) into diagrams. Five
views render end to end: **Block Definition Diagrams (BDD)**, **Requirement**
diagrams, **Internal Block Diagrams (IBD)**, **State machines**, and
**Activity / Swimlane** diagrams.

You can use it in four ways:

- as a **Mermaid external diagram plugin** in the browser,
- as the **`sysml2svg` CLI** for batch conversion and CI,
- as a **library** from your own code, or
- inside an **editor** through the language server and the VS Code extension.

## Install

The package is not published to npm yet; build it from a checkout of this
repository:

```bash
git clone https://github.com/fengdonglu/sysml2-mermaid
cd sysml2-mermaid
npm install
npm run build
```

After building, the CLI is `node dist/cli/cli.js` (or the `sysml2svg` bin after
`npm link`), the library entry is `dist/index.js`, and the browser bundle is
`dist/sysml2-mermaid.mjs`. Once published, `npm i sysml2-mermaid mermaid` will
be the install path.

`mermaid` (>= 11) is an optional peer dependency: you only need it for the
plugin. The CLI, the library, and the editor tooling work without it.

## A first model

```sysml
sysml bdd
package Vehicle {
    part def PowerSource;
    part def Engine :> PowerSource {
        attribute power : Real;
    }
    part def Vehicle {
        part engine : Engine;
        part spare : Engine[2];
        ref part operator : Person;
    }
}
```

The first line is an optional marker plus the view to render; `sysml bdd` selects
the Block Definition Diagram, and BDD is the default when no view name is given.
See [SysML syntax](sysml-syntax.md) for the complete supported subset.

## Library API

```ts
import { renderSvg, renderModel, parseSysml, VERSION } from 'sysml2-mermaid';

const svg = renderSvg(source);                    // first-line view, else BDD
const ibd = renderSvg(source, { view: 'ibd' });   // pick a view explicitly
const model = renderModel(source);                // parse + validate

for (const d of model.diagnostics) {
  console.log(d.severity, d.code, d.line, d.column, d.message);
}
```

The main exports are:

| Export | Purpose |
| --- | --- |
| `parseSysml(source)` | Tokenize + parse into a semantic model (no validation). |
| `renderModel(source)` | `parseSysml` + `validate`; the model used by every entry point. |
| `renderSvg(source, { view, theme })` | Render to an SVG string. `view` defaults to the first-line directive, else `bdd`. |
| `VERSION` | The library version string. |
| `selectView`, `layout`, `sceneToSvg` | The individual pipeline stages (model → view → scene → SVG). |
| `defaultTheme`, `themeFromMermaid` | Themes for the DOM-free renderer. |
| `sysml`, `registerSysml` | The Mermaid external diagram definition and its registration helper. |

The render core is **DOM-free**: `renderSvg` produces a string and never touches
`document`/`window`.

## CLI

```bash
npx sysml2svg model.sysml -o model.svg
npx sysml2svg model.sysml --view ibd --json model.json
```

The CLI writes the SVG, prints diagnostics to stderr, and exits non-zero when
the model has any `error`. See [CLI: sysml2svg](cli.md) for options, exit codes,
and examples.

## Mermaid plugin

```js
import mermaid from 'mermaid';
import { registerSysml } from 'sysml2-mermaid';

mermaid.initialize({ startOnLoad: false }); // before any await
await registerSysml();

const { svg } = await mermaid.render('d', source);
document.querySelector('#diagram').innerHTML = svg;
```

Register the external diagram before rendering, and see
[Mermaid plugin](mermaid-plugin.md) for the trigger, host requirements, and
limitations.

## Run the demo

The static gallery in [`demo/index.html`](../../demo/index.html) renders each
example through the Mermaid plugin; the playground in
[`demo/playground.html`](../../demo/playground.html) edits `.sysml` live and
shows the diagram plus diagnostics:

```bash
npm run build
npm run dev
```

- **Gallery** — `http://localhost:3000/demo/index.html`.
- **Playground** — `http://localhost:3000/demo/playground.html`.

The demo loads `dist/sysml2-mermaid.mjs`, so build first.

## Next steps

- [SysML syntax](sysml-syntax.md) — the supported subset, construct by construct.
- [CLI](cli.md) — options, exit codes, and examples.
- [Mermaid plugin](mermaid-plugin.md) — host requirements and limitations.
- [Editor integration](editor-integration.md) — the LSP and VS Code extension,
  plus CLI/library alternatives.
