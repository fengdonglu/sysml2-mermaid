# Extending

English | [中文](extending.zh.md)

This page walks through the most common extensions. Read
[`AGENTS.md`](../../AGENTS.md) first; it states the conventions every change must
follow: English comments, ESM `.js` import suffixes, a DOM-free render core,
colors taken only from `Theme`, and a parser that never throws.

## Add a new view

A view is a pure function `(model: SysmlModel) => ViewDescription`. Adding one
touches the view layer and, if it introduces new kinds, the render layer.

1. **Name it** — `src/views/types.ts`. Add the name to `VIEW_NAMES` and, if the
   view emits a new kind, to `ViewEdgeKind`.
2. **Write it** — create `src/views/<name>.ts`. Model it on an existing view
   (`bdd.ts` for definitions/features, `requirement.ts` for containment,
   `activity.ts` for groups). Build `ViewNode`s (`label`, `stereotype`, `rows`,
   `ports`, `note`) and `ViewEdge`s (`kind`, `source`, `target`, `label`,
   ports), and optionally `ViewGroup`s.
3. **Register it** — add the function to the `VIEWS` record in
   `src/views/index.ts`; `selectView` then dispatches to it.
4. **Entry points pick it up automatically** — `src/directive.ts` derives the
   `<view>` in a first-line `sysml <view>` directive from `VIEW_NAMES`, and the
   CLI validates `--view` against `VIEW_NAMES`.
5. **Layout** — `src/layout/index.ts` routes views with connectors or ports to
   `ibdLayout` and everything else to `dagreLayout`; no change is needed unless
   the view needs new geometry. Node shapes come from `stereotype` in
   `src/render/shapes.ts`.
6. **Tests and demo** — add `test/views-<name>.spec.ts`, a fixture under
   `test/fixtures/`, a case in `test/samples.spec.ts`, and a
   `demo/samples/NN-name.sysml` plus an entry in `demo/examples.mjs`.

## Add a new edge kind or marker

An edge kind flows through parsing, resolution, the view, and the renderer.

1. **Model** — add the kind to `RelationshipKind` in
   `src/core/model/types.ts`.
2. **Parser** — add a `parse<X>()` method and a `switch` case in
   `src/core/sysml/parse.ts`, emitting the relationship with `addRelationship`.
   For binary or compound endpoints, `validate` resolves `sourceId`/`targetId`
   in `src/core/model/validate.ts` (connector-style feature chains are left to
   the view to resolve).
3. **View** — add the kind to `ViewEdgeKind` in `src/views/types.ts` and emit it
   from the relevant view(s).
4. **Layout** — generic: dagre and the IBD adapter route any node pair, so no
   change is required unless the edge needs custom geometry.
5. **Render** — choose the line style in `src/render/notation.ts` (the `dashed`
   and `dotted` sets), and the start/end markers in `src/render/markers.ts`
   (`markerStart` / `markerEnd`), adding any new glyph to `markerDefs`. Take
   colors only from the `Theme` argument.
6. **Tests** — add parser, view, and render specs.

## Add a theme token

1. **Theme** — `src/render/theme.ts`. Add a field to the `Theme` interface, give
   it a value in `defaultTheme`, and (when Mermaid exposes a matching variable)
   map it in `themeFromMermaid`.
2. **Use it** — read the token from the `Theme` argument in `shapes.ts`,
   `notation.ts`, or `sceneToSvg.ts`. Never hard-code a color: `Theme` is the
   single source of palette truth.

## Add a demo sample

1. Add `demo/samples/NN-name.sysml`; its first line should carry a view
   directive, e.g. `sysml statemachine`.
2. Add an entry to `demo/examples.mjs`: `{ id, title, sample, explanation }`.
3. `test/demo.spec.ts` asserts every example has an existing sample, each sample
   has a view directive, and each parses with no `error` diagnostics; run
   `npm test`.

## Add a parser construct

1. **Lexer** — if the construct introduces punctuation, add it to the token
   tables in `src/core/sysml/tokenize.ts`.
2. **Parser** — add the keyword to the `switch` in `src/core/sysml/parse.ts` and
   a focused `parse<X>()` method, emitting `error` diagnostics with positions
   (via `this.error`) rather than throwing.
3. **Model** — extend `ElementKind` / `RelationshipKind` in
   `src/core/model/types.ts` if the construct is a new element or relation.
4. **Views and render** — project and draw it as described above.

## Where to look

- Lexing, parsing, and diagnostics — `src/core/sysml/`.
- Model and validation — `src/core/model/`.
- View projection — `src/views/`.
- Layout — `src/layout/`.
- SVG generation — `src/render/`.
- Mermaid wiring — `src/mermaid/`.
- Editor integration — `packages/lsp/`, `packages/vscode-sysml/`.

See [Architecture](architecture.md) for how these fit together and
[Build and test](build-and-test.md) for the commands.
