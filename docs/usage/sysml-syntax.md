# SysML syntax

English | [中文](sysml-syntax.zh.md)

This page enumerates exactly the `.sysml` subset that `sysml2-mermaid` understands
today. It follows real SysML v2 textual notation but is deliberately small; the
parser never throws and reports anything outside the subset as a positioned
diagnostic. Anything not listed here is [not supported](#not-supported).

## The marker line

The first line may be the bare marker `sysml`, optionally followed on the same
line by the name of a view:

```sysml
sysml bdd
```

Valid view names are `bdd`, `requirement`, `ibd`, `statemachine`, and `activity`.
The marker line is consumed by the parser and ignored (it is not part of the
model). Without a view name the **BDD** view is used. The marker is optional for
the library and the CLI, but the [Mermaid plugin](mermaid-plugin.md) requires a
source that starts with `sysml`.

## Lexical rules

- **Identifiers** are unquoted (`[A-Za-z_][A-Za-z0-9_]*`) or single-quoted
  (`'My Package'`, spaces allowed).
- **Qualified names** use `::`, e.g. `Parts::Engine`.
- **Feature chains** use `.`, e.g. `tank.tankPort`.
- **Line comments** start with `//` and run to the end of the line; they are
  ignored.
- **Block comments** `/* ... */` are used by `doc` and `comment` (below). A
  block comment that stands alone becomes a comment note on the enclosing
  element.
- **Statements** end with `;`; bodies are wrapped in `{ ... }`. Whitespace is
  otherwise insignificant.
- Every token carries a 1-based line and column for diagnostics.

## Packages and imports

```sysml
package 'My Package' {
    private import ScalarValues::*;
    public import Parts::Engine;
    import Other::Name;
}
package V;
```

- `package Name { ... }` (a body) or `package Name;` (empty).
- The namespace name may be quoted.
- An import is `import Q::*;` or `import Q::Name;`, optionally prefixed with
  `private` or `public`.
- Imports are **parsed, not loaded**: no external or built-in library is bundled.
  A name resolves only when it is defined in the same file; otherwise it degrades
  to an `«unresolved»` placeholder plus a warning.

## Parts, attributes, ports, and enumerations

```sysml
enum def Color { red; green; blue; }

attribute def Mass;
port def FuelPort;

part def Engine {
    attribute power : Real;
    port fuelPort : FuelPort;
}

part engine : Engine;          // usage, owned by its enclosing definition
part spare : Engine[2];        // usage with multiplicity
ref part operator : Person;    // reference feature (non-composite)
```

| Construct | Syntax |
| --- | --- |
| Part definition | `part def Name;`, `part def Name :> Super { ... }` |
| Part usage | `part name : Type;`, `part name : Type[mult];` |
| Reference feature | `ref part name : Type;` |
| Attribute | `attribute def Name;`, `attribute name : Type;` |
| Port | `port def Name;`, `port name : Type;` |
| Enumeration | `enum def Name { lit; lit; ... }` |

Enumeration bodies list literals separated by `;`; a leading `enum` before a
literal is accepted and ignored. A `part` usage inside a definition is a
composite feature (the block owns it); `ref part` marks a non-composite
reference.

## Generalization, composition, and relationships

The operator `:>` (and the keyword `specializes`) is overloaded: on a
**definition** it means sub-classification (generalization); on a **usage** it
means feature subsetting. `:>>` (and `redefines`) is feature redefinition only.

```sysml
part def PowerSource;
part def Engine :> PowerSource { }
part def Car specializes Vehicle { }

part def Vehicle {
    part engine : Engine;        // composite association
    ref part operator : Person;  // plain association
}
part def Car :> Vehicle {
    part engine : Engine :>> engine;       // redefine the inherited feature
    part wheels : Wheel[4] subsets parts;  // subset an inherited feature
}

dependency from Car to Engine;              // nameless dependency
dependency Use from Car to Engine;          // named dependency (name before `from`)
dependency from Car, Truck to Engine;       // comma lists on either side
```

| Model fact | Edge | Notation |
| --- | --- | --- |
| `part def A :> B` / `part def A specializes B` | `specialization` | solid line, hollow triangle at `B` |
| owned `part p : T` in `A` | `composition` | solid line, filled diamond at `A` |
| owned `ref part p : T` in `A` | `reference` | solid line, open arrow at `T` |
| feature `part p : T :> q` / `subsets q` | `subset` | dashed line between the owning blocks, labelled `subsets q` |
| feature `part p : T :>> q` / `redefines q` | `redefine` | dashed line between the owning blocks, labelled `redefines q` |
| `dependency [Name] from A to B` | `dependency` | dashed line, open arrow at `B` |

Multiplicity on the usage (e.g. `[2]`) is drawn as the edge label. An unresolved
type becomes an `«unresolved»` placeholder node plus a warning.

## Requirements

```sysml
requirement def <'1'> MassLimitation :> BaseRequirement {
    doc /* The total mass of a vehicle shall not exceed the limit. */
    subject vehicle : Vehicle;
    require constraint { vehicle.mass <= limit }
    assume constraint { vehicle.fuelMass > 0 }
    require fuelLimit;                 // reference form
    requirement Child;                 // nested requirement (containment)
}

requirement <'UR1.1'> Load : MassLimitation {
    requirement Passengers;
}

satisfy MassLimitation by VehicleDesign;
assert satisfy engineSpecification by VehicleDesign;
assert not satisfy req1 by q;
verify Load;
```

- A **short name** `<'id'>` may precede the declared name; it becomes the
  requirement id and is shown as an `Id:` row.
- `subject name : Type;` declares the requirement subject.
- `require constraint { ... }`, `assume constraint { ... }`, or the reference
  forms `require refName;` / `assume refName;` become constraint rows.
- `doc /* ... */` sets the requirement text (shown as a note).
- A `requirement` nested in another is **containment** (a `contain` edge).
- `[assert] [not] satisfy <req> by <usage>;` draws a `satisfy` edge; `not` marks
  it negated (labelled `not`).
- `verify <req>;` draws a `verify` edge from the enclosing element.
- `dependency` is drawn as in the BDD view.

## Ports and connectors (IBD)

```sysml
package Powertrain {
    port def FuelPort;
    part def FuelTank { port tankPort : FuelPort; }
    part def Engine { port enginePort : FuelPort; }
    part def Vehicle {
        part tank : FuelTank;
        part eng : Engine;
        connect tank.tankPort to eng.enginePort;
        interface : FuelPort connect tank.tankPort to eng.enginePort;
        bind tank.tankPort = eng.enginePort;
    }
}
```

- `connect <chain> to <chain>;` — solid connector.
- `interface [name] [: Type] connect <chain> to <chain>;` and
  `interface <chain> to <chain>;` — dashed connector.
- `bind <chain> = <chain>;` — dotted connector.
- A **feature chain** is a `.`-separated path (`a.b.c`). Each endpoint resolves
  to the owning part plus a port name; a port declared on a part's type is
  inherited by every usage of that type.
- The IBD view shows every `part` usage in the model, each carrying its ports.

## State machines

```sysml
state def DoorStates;

state door : DoorStates {
    state closed;
    state opened;
    entry action initial;
    do providePower;
    exit applyBrake;
    transition open first closed accept OpenSignal if ready do startEngine then opened;
    first start then closed;      // initial pseudo-state → closed
    closed then opened;           // source then target
}

state running parallel { state a; state b; }
```

- `state def Name;` / `state def Name { ... }` and `state name;` /
  `state name : Type { ... }`; states nest.
- `entry`, `do`, and `exit` capture their raw action text as rows
  (`entry action selfTest;`, `do providePower;`, …).
- `parallel` after a state name (and optional type) flags the state as a
  parallel region.
- A transition is
  `transition [name] first <source> [trigger] [guard] [effect] then <target>;`,
  where the trigger/guard/effect text between `first` and `then` is kept as the
  edge label.
- `first <source> then <target>;` and `<source> then <target>;` (inside a state)
  are shorthand transitions. Self-transitions are allowed.
- The names `initial` / `start` as a source and `done` / `terminate` as a target
  produce the `«initial»` and `«final»` pseudo-states. These are conventions,
  not keywords.

## Activities

```sysml
action def Boil { in water : Water; out pasta : Pasta; }
action boil : Boil;
action drain;

first start then boil;          // initial node + succession
boil then drain;                // binary succession
flow of Pasta from boil to drain;
flow from boil to drain;

part def Cook;
part chef : Cook { perform boil; }   // swimlane membership

first start then decide;        // control node, named in a succession
decide then boil;

accept signal; send new Msg() to target; assign x := 0; terminate;
```

- `action def Name { ... }` and `action name : Type;`; `in` / `out` / `inout`
  parameters become rows.
- `first start then <a>;` starts at the implicit `start` node.
- `<a> then <b>;` (and `first <a> then <b>;`) is a succession.
- A bare `then <b>;` continues from the previous node (the last action/state named
  in the body); at the start of a body it continues from `start`.
- `flow [of <payload>] from <a> to <b>;` is an object flow; the payload is the
  edge label.
- `perform [action] <ref>;` inside a part means that part performs the action;
  when any `perform` exists, actions are grouped into **swimlanes** labelled with
  the performing part.
- Control nodes are recognized **by name** when they appear as succession
  endpoints: `start` (initial), `decide` / `merge` (decision diamond), `fork` /
  `join` (bar). They are ordinary references, not keywords.
- `accept`, `send`, `assign`, and `terminate` statements are captured as raw text
  and rendered as action nodes.

## Doc and comment

```sysml
doc /* The engine provides power. */
comment /* A general note. */
comment about Engine /* Refers to a named element. */
```

- `doc /* ... */` attaches text to the enclosing element (rendered as a note).
- `comment /* ... */` attaches to the enclosing element when no target is given.
- `comment about Name /* ... */` attaches to the named element; an unknown target
  is reported as an `unresolved-reference` error.

## Views and viewpoints

A `view` / `viewpoint` subset selects **which elements** a diagram shows. A view
does **not** name a diagram type; the kind comes from its definition's standard
base, and `expose` / `filter` restrict the elements.

```sysml
viewpoint def SystemStructurePerspective;

view def StructureView :> GeneralView {
    filter @Structure;
    render asTreeDiagram;
}

view vehicleView : StructureView {
    expose Vehicle::*;
}
```

- `viewpoint def N { ... }` / `viewpoint n : Def;` — a viewpoint (body parsed as
  requirement text; `frame` / `concern` semantics are not evaluated).
- `view def N [:> Base] { ... }` / `view n : Def { ... }`.
- `expose <ref>;`, `expose <ref>::*;`, `expose <ref>::**;` — restrict to a
  subtree (`*` = direct members, `**` = recursive).
- `filter @Name;` / `filter @A and @B;` — keep only elements annotated with the
  metadata (see below).
- `render <name>;` — the rendering-usage name is recorded (not interpreted).
- **Kind mapping** from the definition's specialization chain:
  `GeneralView` → BDD, `InterconnectionView` → IBD, `ActionFlowView` → activity,
  `StateTransitionView` → state machine, `RequirementView` (a project extension)
  → requirement. The names `bdd` / `ibd` / `activity` / `statemachine` /
  `requirement` also work directly.

Select a named view from the library (`renderSvg(source, { viewName })`) or the
CLI (`sysml2svg model.sysml --view-name vehicleView`). Without `viewName`, a
single `view` in the model is used; otherwise the first-line directive or
`--view` picks the kind.

## Metadata and abstract

```sysml
abstract part def PowerSource;
#Structure part def Engine;

part def Vehicle {
    part engine : Engine { @Structure; }
}
```

- `abstract` before a definition/usage sets `isAbstract` (rendered in italics).
- `#Name` before a definition/usage, or `@Name;` inside a body, annotates the
  element; `filter @Name` uses these annotations.

## Items, aliases, allocations and connections

```sysml
item def Fuel;
item fuel : Fuel;
ref item driver : Person;

alias eng for Engine;              // references may then use `eng`

allocate Tank to Engine;           // rendered as a dashed edge
allocation a1 : LogicalToPhysical allocate Tank to Engine;

connection def Feed { end [1] part a : Tank; end b : Engine; }
connection ps : Feed connect t.out to e.in;

interface def FeedInterface { end supp : OutPort; end cons : InPort; }

part def Engine { in port fuelIn : FuelPort; out port drive : DrivePort; }
```

- `item def` / `item x : T;` / `ref item` — behaves like `part`; an `item def`
  renders as `«item»`.
- `alias X for Y;` — references by `X` resolve to `Y`.
- `allocate A to B;` and `allocation n : Def allocate A to B;` — a dashed
  `allocate` edge in BDD / IBD.
- `connection def N { end ...; }` / `interface def N { end ...; }` render as
  `«connection»` / `«interface»` with their ends as rows; `connection` /
  `interface` usages connect endpoints.
- `in` / `out` / `inout` may prefix `port` / `item` / `part` / `attribute`
  usages; the direction is kept in the displayed name.

## Modifiers, defaults and other declarations

```sysml
variation part def Variant;              // modifiers: variation / individual / ordered / nonunique / snapshot / timeslice / derived
attribute n = 20;                        // default value
attribute m default = 10;
binding ab : AB bind a = b;              // named binding
port p : ~FuelPort;                      // conjugated port type

metadata def M;                          // parsed as «metadata»
class def C { attribute x : Real; }      // KerML-style, parsed as «class»
calc def F;  function def G;  predicate def H;  assoc def R;  struct def S;  datatype def D;

requirement def R { stakeholder s : S; actor a : A; invariant x; }
part def W { exhibit state s : S; }
view v { frame VP; satisfy VP; }
```

- Modifier prefixes are recorded on `Element.modifiers`; `~T` sets
  `isConjugate`; a default value is captured as raw text.
- `metadata`, `concern`, `allocation`, and KerML `class` / `assoc` / `connector`
  / `struct` / `datatype` / `calc` / `function` / `predicate` / `rendering` /
  `expr` declarations parse into `«keyword»` elements (their bodies are parsed).
- `stakeholder` / `actor` / `invariant` appear as requirement rows; `exhibit`,
  `frame`, and `satisfy <viewpoint>` are recorded.

## Control flow and imports

```sysml
// import variants: `all`, recursive `::*::**`, and filter packages `::[expr]`
import all ScalarValues::*;
import Vehicle::*::**;
import Signals::[name];

action txn;
action approve;
action reject;
first txn then decide;
if amount < limit then approve;     // labelled succession from the previous node
else reject;
merge;
succession flow from txn to approve;
while pending;                      // structured bodies are captured as statements
```

- `if <expr> then <ref>;` and `else <ref>;` become labelled successions from the
  previous node.
- A bare `merge;` / `decide;` / `fork;` / `join;` declares a control node that
  successions can reference.
- `while` / `loop` / `for` statements are captured as statement nodes (no body
  semantics).
- N-ary connectors `connect (a, b, c);` (and the same on `connection` /
  `interface`) fan out from the first end.

## Multiplicity

| Syntax | Meaning |
| --- | --- |
| `[n]` | exactly `n` (lower = upper) |
| `[lower..upper]` | a range, e.g. `[1..4]` |
| `[*]` | unbounded (`lower = upper = *`) |
| `[0..*]` | zero to many |

## Not supported

Everything below is outside the supported subset and is reported as a diagnostic
(never silently accepted):

- Full SysML v2 / KerML grammar; standard-library and multi-file resolution.
- Evaluation of `frame` / `concern` / `stakeholder` and `satisfy <viewpoint>`
  conformance; `filter` expressions beyond `@Name` conjunctions; graphical editing
  and persisted layout.
- `references` / `crosses`.
- Parametric and other view families (sequence, geometry, grid, browser); `end`
  multiplicity expansion.
- Evaluation of `variation` / `individual` semantics, KerML expression bodies,
  metadata values, and structured control bodies (`if` / `while` / `for` / `loop`
  semantics).
- `derive` / `trace` / `refine` / `copy` (not SysML v2 keywords); `verification
  def` / `objective` (only bare `verify <ref>;` is parsed).
- Feature redefinition with a value expression (`attribute redefines x = expr;`).
- Requirement subject expressions (`subject = path`); use `subject name : Type;`.
- State trigger algebra beyond raw text, `exhibit`, structured control bodies
  (`if` / `while` / `for` / `loop`); their references only appear via successions.
- ELK layout (IBD uses dagre with explicit port anchoring).
- Go-to-definition, rename, formatting, and multi-file resolution in the LSP.

Run the [`sysml2svg` CLI](cli.md) or call `renderModel()` to see the diagnostics
(`error` / `warning` with codes such as `unresolved-reference`,
`duplicate-definition`, and `unexpected-token`).
