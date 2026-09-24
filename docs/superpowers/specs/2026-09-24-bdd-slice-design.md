# Design: BDD vertical slice (v0.1, first slice)

English only (specs follow the sibling `mermaid-opm` convention).

## Status

- Approved for implementation planning.
- Scope: the **first vertical slice** of `sysml2-mermaid` — a
  Block Definition Diagram (BDD) rendered end-to-end from a documented
  `.sysml` subset.

## 1. Context and goal

`sysml2-mermaid` renders SysML v2 textual models (`.sysml`) as diagrams,
mirroring the proven layering of `mermaid-opm`:

```
.sysml text → parse → semantic model → view projection → layout → SVG string
```

The full v0.1 roadmap (four diagram types, three entry points, diagnostics)
is too large for a single spec. This design covers **one vertical slice**: the
BDD path, exercising every layer end to end, so later slices add a view without
touching the core.

**Goal:** given a `.sysml` model using the documented subset, produce a
DOM-free SVG of its BDD, reachable through the library API, the `sysml2svg`
CLI, and the Mermaid external diagram plugin.

## 2. Scope

### In scope

- Parser for the documented `.sysml` subset (section 3).
- Render-agnostic semantic model with reference resolution and diagnostics.
- BDD view projection (section 5).
- dagre layout and DOM-free SVG rendering (sections 6–7).
- Three entry points: library API, CLI, Mermaid plugin (section 8).
- Project scaffolding: `package.json`, TypeScript build, vitest (section 10).

### Out of scope (deferred to later slices)

- Requirement, State machine, and Activity/Swimlane views.
- IBD and Parametric diagrams.
- Native `view` / `viewpoint` selection syntax.
- Language Server and VS Code extension.
- GitHub Pages demo and CI/publish workflows.
- `connection` / `interface` / `bind` connectors, `alias`, `abstract`,
  port conjugation `~T`, `item` usages, `ordered`/`nonunique`, metadata,
  recursive/filter imports, `references`/`crosses`.

## 3. The `.sysml` subset

The subset is deliberately small and mirrors real SysML v2 textual notation.
It was verified against the official SysML v2 BNF and training examples
(`Systems-Modeling/SysML-v2-Release`, `bnf/SysML-textual-bnf.kebnf` and
`sysml/src/training/...`). Constructs outside this subset are reported as
diagnostics, never silently accepted.

### 3.1 Marker line

The first non-blank line must be the bare marker `sysml`. It is a
**project-specific trigger** for the Mermaid detector (analogous to `opm` in
`mermaid-opm`); the parser consumes and ignores it. It is not part of SysML.

### 3.2 Grammar

```sysml
sysml

package 'Vehicle' {
    private import ScalarValues::*;
    private import Parts::Engine;

    // line comments are ignored (not part of the model)

    enum def Color { red; green; blue; }

    attribute def Mass :> Real;
    port def FuelPort;

    part def PowerSource {
        doc /* something that provides power */
        attribute power : Real;
    }

    part def Engine :> PowerSource {
        attribute mass : Mass;
        port fuelPort : FuelPort;
    }

    part def Vehicle {
        attribute mass : Mass;
        part engine : Engine;          // composite (owned, default)
        part spare : Engine[2];        // multiplicity
        ref part operator : Person;    // reference feature (unresolved)
    }

    part def Car :> Vehicle {
        part engine : Engine :>> engine;       // redefine inherited feature `engine`
        part wheels : Wheel[4] subsets parts;  // subset inherited feature `parts`
    }

    dependency from Car to Engine;     // nameless dependency
    dependency Use from Car to Engine; // named dependency (name before `from`)
}
```

Verified construct table:

| Construct | Syntax | Notes |
|---|---|---|
| package | `package Name { ... }` | name may be quoted: `package 'My Package' { }` |
| import | `private import Q::*;`, `private import Q::Name;`, `public import ...` | visibility (`private`/`public`) is required |
| part definition | `part def Name;`, `part def Name :> Super { ... }`, `part def Name specializes Super` | `:>`/`specializes` on a **definition** = sub-classification |
| part usage | `part name : Type;`, `part name : Type[mult];` | default is composite (owns the feature) |
| reference feature | `ref part name : Type;` | `ref` ⇒ `isReference = true`, non-composite |
| feature subsetting | `part name : Type :> other;`, `part name : Type subsets other;` | `:>`/`subsets` on a **feature** = subsetting; `other` is another **feature**, not a type |
| feature redefinition | `part name : Type :>> other;`, `part name : Type redefines other;` | `:>>`/`redefines`, feature only; `other` is the inherited feature being replaced |
| attribute | `attribute def Name;`, `attribute name : Type;` | |
| port | `port def Name;`, `port name : Type;` | |
| enumeration | `enum def Name { lit; ... }` | literal `enum` keyword is optional; not supported here |
| doc | `doc /* text */` | attaches to the enclosing/owning element |
| comment | `comment /* text */`, `comment about Name /* text */` | |
| dependency | `dependency [Name] from A to B;` | name (if any) precedes `from`; nameless form is `dependency from A to B;` |
| multiplicity | `[lower..upper]`, `[n]`, `[*]`, `[0..*]` | `lower` defaults to the upper bound when only one is given |

Semantics of the overloaded `:>` (from the BNF's `SPECIALIZES`/`SUBSETS`
terminals): its meaning depends on whether the left side is a definition or a
feature. The parser records the operator and the enclosing context; the model
resolves it to `specialization` (definition) or `subset` (feature).

### 3.3 Lexical rules

- Identifiers: unquoted (`[A-Za-z_][A-Za-z0-9_]*`) or single-quoted
  (`'...'`, may contain spaces). Qualified names use `::`.
- Comments: `// ...` to end of line (ignored); `/* ... */` as a comment
  element when not preceded by `doc`/`comment`.
- Whitespace is insignificant except as a token separator.
- Every token carries `{ line, column }` (1-based) for diagnostics.

## 4. Semantic model

Render-agnostic; produced by `parse` and completed by `validate`.
Located in `src/core/model/types.ts`.

```ts
export type ElementKind =
  | 'package'
  | 'import'
  | 'part-def' | 'part'
  | 'attribute-def' | 'attribute'
  | 'port-def' | 'port'
  | 'enum-def' | 'enum-literal'
  | 'unresolved';

export interface Position { line: number; column: number }
export interface Multiplicity { lower?: string; upper?: string }

export interface Element {
  id: string;                 // stable id, e.g. qualified name
  kind: ElementKind;
  name: string;
  qualifiedName: string;
  ownerId?: string;           // ownership tree
  childIds: string[];         // owned members, in source order
  position: Position;
  isReference?: boolean;      // `ref part`
  isAbstract?: boolean;       // reserved; always false in this slice
  multiplicity?: Multiplicity;
  typeRef?: string;           // raw type reference text
  typeId?: string;            // resolved element id (undefined if unresolved)
  doc?: string;
  comment?: string;
}

export type RelationshipKind =
  | 'specialization' | 'subset' | 'redefine' | 'dependency';

export interface Relationship {
  id: string;
  kind: RelationshipKind;
  sourceRef: string;          // raw qualified name of the source
  targetRef: string;          // raw qualified name of the target
  sourceId?: string;          // resolved element id (after validate)
  targetId?: string;          // resolved element id (after validate)
  position: Position;
}

export interface SysmlModel {
  elements: Map<string, Element>;   // by id
  relationships: Relationship[];    // declared relations only
  diagnostics: Diagnostic[];
}
```

Key decisions:

- **Declared relations only.** `specialization`, `subset`, `redefine`, and
  `dependency` are recorded by the parser. **Composite** and **reference**
  edges are *derived by the view* from owned `part` usages and their resolved
  types (section 5). This keeps the model canonical and makes the view the
  single place that decides which relations a diagram shows.
- **Imports are parsed, not loaded.** `private import Q::*;` and
  `private import Q::Name;` become `import` elements (recording the target in
  `typeRef`) but no external or built-in library (e.g. `ScalarValues`) is bundled
  in this slice. A name resolves only when it is defined in the same file;
  otherwise it degrades to a placeholder (next bullet). Namespace members brought
  in by an import are matched by simple name if the defining file is the one
  being parsed.
- **Doc and comment are fields, not elements.** `doc /* ... */` sets the
  enclosing element's `doc`; `comment /* ... */` sets the enclosing element's
  `comment`; `comment about X /* ... */` sets it on `X`. They are carried on
  `Element.doc` / `Element.comment` and surface as the view node's `note`.
- **Resolution rules.** A reference resolves first by exact qualified name,
  then by unique simple name, else to a placeholder. Two refinements: a name
  matching both a package and a definition inside that package (e.g. `V` inside
  `package V { part def V; }`) resolves to the **definition**; and a
  subset/redefine target resolves through the source feature's owner's
  specialization chain (so `:>> engine` finds the inherited `engine`).
- **Unresolved references degrade.** A `typeRef` that cannot be resolved
  produces an `unresolved` placeholder element plus a `warning`; the model is
  still complete and renderable.
- `validate` adds diagnostics for: undefined type references, duplicate
  definitions in the same namespace, and malformed relationships.

## 5. View layer

`ViewDescription` (`src/views/types.ts`) is a renderer-agnostic description:

```ts
export interface ViewNode {
  id: string;                 // element id
  kind: ElementKind;
  label: string;              // display name
  stereotype: string;         // e.g. 'block', 'enumeration'
  rows: string[];             // attribute / part / literal rows
  ports: string[];            // border port names
  note?: string;              // doc / comment
}
export interface ViewEdge {
  id: string;
  kind: 'specialization' | 'composition' | 'reference'
      | 'subset' | 'redefine' | 'dependency';
  source: string;
  target: string;
  label?: string;             // multiplicity / name
}
export interface ViewDescription {
  nodes: ViewNode[];
  edges: ViewEdge[];
}
```

`views/bdd.ts` projects a `SysmlModel` into a `ViewDescription` by these rules:

**Nodes** — every definition becomes a block; package-level `part` usages also
become blocks:

| Element | Stereotype |
|---|---|
| `part-def` | `«block»` |
| `enum-def` | `«enumeration»` |
| `attribute-def` | `«valueType»` |
| `port-def` | `«port def»` |
| package-level `part` usage | `«block»` (usage) |

**Node content**

- `rows`: owned `attribute` usages (`name : Type`), owned `part` usages
  (`name : Type`), and enum literals.
- `ports`: owned `port` usages, rendered as small squares on the block border.
- `note`: the element's `doc` or `comment` text.

**Edges**

| Model fact | Edge kind | Notation |
|---|---|---|
| `part def A :> B` (definition `:>` / `specializes`) | `specialization` | solid line, hollow triangle at `B` |
| owned `part p : T` in `A` (composite) | `composition` | solid line, filled diamond at `A` |
| owned `ref part p : T` in `A` | `reference` | solid line, open arrow at `T` |
| feature `part p : T :> q` | `subset` | dashed line between the **owning blocks** of `p` and `q`, labelled `subsets q` |
| feature `part p : T :>> q` | `redefine` | dashed line between the **owning blocks** of `p` and `q`, labelled `redefines q` |
| `dependency [N] from A to B` | `dependency` | dashed line, open arrow at `B` |
| package-level `part x : T` | `reference` | solid line, open arrow at `T` |

Multiplicity from the usage is emitted as the edge label. An unresolved type
yields a placeholder node with stereotype `«unresolved»`, drawn with the theme's
warning styling, plus the `reference`/`composition` edge to it.

**Subset / redefine approximation.** Subsetting and redefinition relate two
*features*, not two types. For a BDD the view maps each feature to its owning
block and draws the edge between those blocks; the source feature's *type* `T`
drives the usual composite edge to `T`. The target feature `q` is resolved by
name (searching the ownership chain, then imports) to its owning block. If `q`
cannot be resolved, the edge degrades to an `«unresolved»` placeholder block
named after the feature, plus a `warning`. The feature names are kept in the
edge label. This is explicitly a v1 approximation of feature-level relations in
a type-level diagram.

## 6. Layout

`src/layout/` turns a `ViewDescription` into a `Scene`. Reuses the
`mermaid-opm` approach:

- `@dagrejs/dagre` with `{ multigraph: true }` (a pair of blocks may have
  several edges), `rankdir: 'TB'`, `nodesep`/`ranksep` and margins.
- Node size derived from label, stereotype, rows, and ports.
- Node and edge geometry written into `SceneNode` / `SceneEdge`, including
  dagre edge `points`.

```ts
export interface SceneNode {
  id: string; kind: ElementKind; label: string; stereotype: string;
  rows: string[]; ports: string[]; note?: string;
  x: number; y: number; width: number; height: number;
}
export interface SceneEdge {
  id: string; kind: ViewEdge['kind']; source: string; target: string;
  points: { x: number; y: number }[]; label?: string;
}
export interface Scene { nodes: SceneNode[]; edges: SceneEdge[]; width: number; height: number }
```

Layout is the only layer that depends on dagre. It knows nothing about SysML.

## 7. Render

`src/render/` produces an SVG **string** and never touches `document`/`window`.

- `theme.ts` — `Theme` interface, `defaultTheme`, `themeFromMermaid(tv)`.
  All colors come from the theme; no hard-coded palette values.
- `shapes.ts` — block rectangle: stereotype + name header, row compartments,
  border port squares, note box.
- `markers.ts` — triangle (hollow/filled), diamond, arrows; `markerDefs`.
- `notation.ts` — edge polyline from `SceneEdge.points` + marker selection.
- `sceneToSvg(scene, theme): string` — composes nodes, markers, and edges into
  a standalone `<svg>` with `viewBox`/`width`/`height`.

Edge kind → notation is a data table, so new views reuse the renderer.

## 8. Entry points

### Library API (`src/index.ts`)

```ts
export const VERSION: string;
export function parseSysml(source: string): SysmlModel;
export function renderModel(source: string): SysmlModel;   // parse + validate
export function renderSvg(source: string, opts?: { view?: 'bdd'; theme?: Theme }): string;
```

### CLI (`src/cli/cli.ts`, binary `sysml2svg`)

```
sysml2svg <input.sysml> [-o out.svg] [--view bdd] [--json out.json]
```

- Defaults `out.svg` beside the input.
- Writes the SVG; with `--json`, also writes `{ elements, relationships, diagnostics }`.
- Prints diagnostics to stderr as `severity: code @line:column message`.
- Exit code `1` if any `error` diagnostic exists, else `0`; the SVG is written
  either way.

### Mermaid plugin (`src/mermaid/`)

Thin adapter, the only place that touches `document`:

- `detector.ts` — `(txt) => /^\s*sysml(?:\s|$)/.test(txt)`.
- `db.ts` — `SysmlDb`: holds source → model, and the theme.
- `diagram.ts` — external diagram definition: `parser.parse` stores the source,
  `init(config)` sets the theme from `config.themeVariables`, `db`, `renderer`,
  `styles`.
- `renderer.ts` — `draw`: read the model from `db`, run `layout(selectView(model,'bdd'))`
  → `sceneToSvg`, then inject the inner SVG into Mermaid's `<svg id>` element.
- `index.ts` — export `sysml: ExternalDiagramDefinition` and
  `registerSysml()` (calls `mermaid.registerExternalDiagrams([sysml])`).
- `styles.ts` — host-side CSS from the theme.

The browser bundle `dist/sysml2-mermaid.mjs` is built with esbuild for use in
the demo/playground; `mermaid` is a peer dependency (optional).

## 9. Diagnostics

```ts
export type Severity = 'error' | 'warning' | 'info';
export interface Diagnostic {
  severity: Severity;
  code: string;            // stable, e.g. 'unresolved-reference'
  message: string;
  line: number;
  column: number;
}
```

- The parser never throws: unexpected input produces an `error` diagnostic and
  recovery continues at the next statement/brace.
- Validation adds `undefined-reference`, `duplicate-definition`, and
  `malformed-relationship`.
- Diagnostics carry 1-based line/column of the offending token.

## 10. Project scaffolding

Mirrors `mermaid-opm`:

- `package.json`: `type: module`, `bin: { "sysml2svg": "./dist/cli/cli.js" }`,
  `exports`, `workspaces: ["packages/*"]`, dependency `@dagrejs/dagre`,
  peer+optional `mermaid >= 11`, dev deps `typescript`, `vitest`, `esbuild`,
  `jsdom`, `mermaid`, `@types/node`.
- `tsconfig.json` (strict, ESM, `.js` import suffixes) and `tsconfig.build.json`.
- `vitest.config.ts`; `test/setup.ts` for jsdom.
- `build.mjs`: `tsc` for the Node build + esbuild for the browser bundle.

## 11. Testing strategy (TDD)

Write failing tests first per module. Specs under `test/`:

| Spec | Covers |
|---|---|
| `parse-lexical.spec.ts` | tokens, positions, comments |
| `parse-declarations.spec.ts` | package, import, part/attribute/port/enum def & usage, doc/comment |
| `parse-relations.spec.ts` | `:>`/`:>>`/`subsets`/`redefines`, dependency, multiplicity |
| `model-validate.spec.ts` | reference resolution, duplicates, unresolved placeholders |
| `views-bdd.spec.ts` | node/edge projection and multiplicities |
| `layout.spec.ts` | scene geometry present, multigraph edges |
| `render-snapshot.spec.ts` | SVG snapshots, no `document` access |
| `cli.spec.ts` | in/out files, `--json`, exit codes |
| `mermaid-integration.spec.ts` | jsdom + real mermaid render; SVG contains block names |
| `samples.spec.ts` | end-to-end fixtures under `test/fixtures/*.sysml` |

Acceptance for the slice:

1. Every fixture parses with zero `error` diagnostics.
2. `renderSvg` produces well-formed SVG containing each block's name.
3. CLI writes the SVG and returns the documented exit code.
4. The Mermaid plugin renders the same model in jsdom.

## 12. Files created

```
src/core/sysml/{tokenize,parse,diagnostics,reserved}.ts
src/core/model/{types,validate}.ts
src/views/{types,bdd,index}.ts
src/layout/{types,dagreAdapter,index}.ts
src/render/{theme,shapes,markers,notation,sceneToSvg}.ts
src/mermaid/{detector,db,diagram,renderer,styles,index}.ts
src/cli/cli.ts
src/index.ts
test/*.spec.ts, test/fixtures/*.sysml, test/setup.ts
package.json, tsconfig.json, tsconfig.build.json, vitest.config.ts, build.mjs
```

## 13. Design principles carried over

1. Text is the single source of truth; no layout is persisted.
2. The render core is DOM-free; only the Mermaid adapter touches the DOM.
3. Views are a selection step between the model and layout.
4. Errors never crash: diagnostics with positions; unresolved refs degrade.
5. A new diagram type is a new view (`views/*.ts`) plus a render table entry,
   not a rewrite.
