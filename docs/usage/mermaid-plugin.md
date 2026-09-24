# Mermaid plugin

English | [中文](mermaid-plugin.zh.md)

`sysml2-mermaid` registers an **external diagram** with Mermaid. Once registered,
any source whose first line is `sysml` (typically a fenced code block or a
`mermaid.render` string) is rendered as a SysML diagram.

## Register the diagram

```js
import mermaid from 'mermaid';
import { registerSysml } from 'sysml2-mermaid';

mermaid.initialize({ startOnLoad: false }); // before any await
await registerSysml();
```

`registerSysml()` is a thin wrapper around

```js
mermaid.registerExternalDiagrams([sysml], { lazyLoad: false });
```

The `sysml` definition (`{ id, detector, loader }`) is also exported if you need
to pass it to `registerExternalDiagrams` yourself.

After registration, render as usual:

```js
const { svg } = await mermaid.render('d', `
sysml ibd
package Powertrain {
    port def FuelPort;
    part def FuelTank { port tankPort : FuelPort; }
    part def Engine { port enginePort : FuelPort; }
    part def Vehicle {
        part tank : FuelTank;
        part eng : Engine;
        connect tank.tankPort to eng.enginePort;
    }
}
`);
document.querySelector('#diagram').innerHTML = svg;
```

## The `sysml` trigger and the view directive

The detector matches `/^\s*sysml(?:\s|$)/`: the source must **start** with
`sysml` on its own line (leading whitespace allowed). The marker line is not part
of the model; the plugin's parser consumes it.

The view name may follow `sysml` on the same first line:

| First line | View |
| --- | --- |
| `sysml bdd` | Block Definition Diagram |
| `sysml requirement` | Requirement diagram |
| `sysml ibd` | Internal Block Diagram |
| `sysml statemachine` | State machine |
| `sysml activity` | Activity / Swimlane |
| `sysml` | BDD (default) |

An unknown or missing view name falls back to **BDD**.

## `startOnLoad` pitfall

Call `mermaid.initialize({ startOnLoad: false })` **before any `await`**.
Otherwise Mermaid may auto-run on `DOMContentLoaded` before `registerSysml()` has
finished, and every `sysml` block fails with *"No diagram type detected"*. The
pattern is:

```js
mermaid.initialize({ startOnLoad: false }); // first
await registerSysml();                      // then register
```

## Browser bundle and import maps

The published browser bundle (`dist/sysml2-mermaid.mjs`, the `./browser` export)
keeps a **bare** `import('mermaid')` inside `registerSysml()`. Bundlers resolve
that specifier automatically, but a browser loading the file directly cannot.
You must provide an import map (or a bundler alias) that maps `mermaid` to an
ESM build; otherwise `await registerSysml()` throws
`Failed to resolve module specifier "mermaid"`.

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
  import { registerSysml } from './dist/sysml2-mermaid.mjs';

  mermaid.initialize({ startOnLoad: false });
  await registerSysml();
</script>
```

The same import-map requirement applies to the [`demo`](../../demo/index.html).

## Read-only rendering

The plugin is a pure projection: it parses the current source, lays it out, and
draws an SVG. There is no editing, no drag/drop, and no persisted layout — every
render recomputes from the text. Colors come from Mermaid's `themeVariables`
(via `themeFromMermaid`), so a SysML diagram follows the host's Mermaid theme.

## Host requirements and limitations

- Mermaid **>= 11** must be present (it is an optional peer dependency).
- The host must load `sysml2-mermaid` and call `registerSysml()` before rendering
  `sysml` sources.
- In the browser, `mermaid` must be resolvable as an ESM specifier (import map
  or bundler); the plugin's own bundle is `dist/sysml2-mermaid.mjs` (`./browser`).
- External diagrams require the host page to execute third-party JavaScript.
  Fixed renderers such as **GitHub Markdown do not load plugins**, so a `sysml`
  block will not render there. Use the [`sysml2svg` CLI](cli.md) to produce an
  SVG and commit or attach the result instead.
- The plugin renders one view per source; this is exactly the view named on the
  first line (or BDD). See [SysML syntax](sysml-syntax.md) for the supported
  subset and [Getting started](getting-started.md) for the library and CLI.
