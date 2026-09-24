# Architecture

English | [中文](architecture.zh.md)

## Overview

`sysml2-mermaid` is a pure-TypeScript pipeline that turns SysML v2 textual
models (`.sysml`) into SVG diagrams. It mirrors the proven layering of the
sibling project `mermaid-opm`: a render-agnostic core, a view-projection step,
one layout step, one DOM-free renderer, and several thin entry points.
Everything below the Mermaid integration is **DOM-free**, so it runs unchanged
in Node, in a bundler, or in the browser.

## Layers

Data flows strictly in one direction:

```text
.sysml source
   │
   ▼
core/sysml      tokenize → parse                (text → SysmlModel + diagnostics)
   │
   ▼
core/model      types + validate                (SysmlModel, adds diagnostics)
   │
   ▼
views           selectView                      (SysmlModel → ViewDescription)
   │
   ▼
layout          dagre / port-aware IBD          (ViewDescription → Scene)
   │
   ▼
render          shapes + notation + sceneToSvg  (Scene + Theme → SVG string)
```

| Layer | Directory | Responsibility | Depends on |
| --- | --- | --- | --- |
| SysML | `src/core/sysml/` | `tokenize.ts` splits text into positioned tokens; `parse.ts` builds the semantic model; `diagnostics.ts` defines the `Diagnostic`/`Severity` shape. | — |
| Model | `src/core/model/` | `types.ts` declares `SysmlModel`, `Element`, `Relationship`, `ElementKind`, `RelationshipKind`; `validate.ts` resolves references and adds `duplicate-definition` / `unresolved-reference` diagnostics. | core/sysml |
| Views | `src/views/` | `types.ts` declares `ViewDescription`, `ViewNode`, `ViewEdge`, `ViewGroup`, `ViewName`; one file per view (`bdd.ts`, `requirement.ts`, `ibd.ts`, `statemachine.ts`, `activity.ts`); `index.ts` exposes `selectView`. | core/model |
| Layout | `src/layout/` | `dagreAdapter.ts` runs dagre (`rankdir: 'TB'`, compound multigraph) for node/edge views; `ibdAdapter.ts` runs dagre (`rankdir: 'LR'`) plus explicit port anchoring; `index.ts` dispatches; `types.ts` declares `Scene`/`SceneNode`/`SceneEdge`/`SceneGroup`. | views, dagre |
| Render | `src/render/` | `theme.ts` supplies every color; `shapes.ts` draws nodes (and pseudo-state shapes); `markers.ts` + `notation.ts` draw links; `sceneToSvg.ts` assembles the final `<svg>` string. | layout |

The parser never throws: every problem is reported as a diagnostic carrying
`severity`, `code`, `message`, `line`, and `column` (1-based).

## Intermediate representations

Three value types carry data between layers; each layer knows only its input
and output shape.

- **`SysmlModel`** (`src/core/model/types.ts`) — the render-agnostic semantic
  model: `elements: Map<string, Element>`, `relationships: Relationship[]`, and
  `diagnostics: Diagnostic[]`. An `Element` carries `id`, `kind`, `name`,
  `qualifiedName`, ownership (`ownerId` / `childIds`), `position`, and optional
  `typeRef`/`typeId`, `multiplicity`, `shortName`, `doc`/`comment`. Declared
  relationships (`specialization`, `subset`, `redefine`, `dependency`,
  `satisfy`, `verify`, `connect`, `bind`, `transition`, `succession`, `flow`,
  `perform`) are recorded; composite/reference edges are derived by the views.
- **`ViewDescription`** (`src/views/types.ts`) — a renderer-agnostic projection:
  `nodes` (with `label`, `stereotype`, `rows`, `ports`, `note`), `edges` (with
  `kind`, `source`, `target`, optional `label` and `sourcePort`/`targetPort`),
  and optional `groups` (swimlanes).
- **`Scene`** (`src/layout/types.ts`) — a laid-out `ViewDescription`: nodes gain
  `x`, `y`, `width`, `height` (and optional `portAnchors`), edges gain polyline
  `points`, and the scene carries overall `width`/`height`.

The renderer consumes only a `Scene` plus a `Theme`; it never sees SysML.

## The render core is DOM-free

`core/`, `views/`, `layout/`, and `render/` never touch `document` or `window`.
`sceneToSvg(scene, theme)` is a pure function returning an SVG `string`, shared
by the library API, the CLI, the Mermaid plugin, and the VS Code preview. Only
`src/mermaid/renderer.ts` writes into a host element, and only
`packages/vscode-sysml` reads editor documents.

## Five entry points

1. **Library API** — `src/index.ts` exports `renderModel(source)` (a parsed and
   validated `SysmlModel`), `renderSvg(source, { view, theme })` (an SVG
   `string`), the lower-level `parseSysml`, `validate`, `selectView`, `layout`,
   `sceneToSvg`, `defaultTheme`, `themeFromMermaid`, `sysml`, `registerSysml`,
   and `VERSION`, plus the model/view/scene/theme TypeScript types.
2. **CLI** — `src/cli/cli.ts` implements `sysml2svg`; the compiled
   `dist/cli/cli.js` is the `bin` entry. It reads a file, calls
   `renderModel`/`renderSvg`, writes SVG (and optionally a JSON dump), prints
   diagnostics to stderr, and exits `1` when any `error` diagnostic exists.
3. **Mermaid external diagram plugin** — `src/mermaid/`. `detector.ts` matches
   the `sysml` off-keyword, `db.ts` stores the parsed model and theme,
   `diagram.ts` wires the parser/init/renderer/styles, `renderer.ts` injects the
   inner SVG into the host element, and `index.ts` exports `sysml` and
   `registerSysml()`.
4. **Language Server** — `packages/lsp` (bin `sysml-lsp`): diagnostics,
   completion, hover, and document symbols, reusing the core parser.
5. **VS Code extension** — `packages/vscode-sysml`: syntax highlighting, the
   language client, the `sysml.preview` webview, and the `sysml.exportSvg`
   command.

## Data flow

1. `renderModel(source)` calls `parseSysml`, then `validate`, and returns the
   `SysmlModel`.
2. `renderSvg(source, opts)` calls `renderModel`, chooses the view
   (`opts.view ?? viewFromSource(source) ?? 'bdd'`), then
   `sceneToSvg(layout(selectView(model, view)), opts.theme)`.
3. The Mermaid renderer takes the same path, reading the model and theme from
   `SysmlDb`, then injects the string's inner content into the element Mermaid
   provides.
4. The CLI writes the SVG string (and, with `--json`, a plain
   `{ elements, relationships, diagnostics }` dump) and reports diagnostics.

See [Build and test](build-and-test.md) to compile and run this, and
[Extending](extending.md) to add a view or notation.
