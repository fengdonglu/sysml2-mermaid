# What is SysML v2?

English | [中文](what-is-sysml.zh.md)

**Systems Modeling Language version 2 (SysML v2)** is a systems-modeling
language standardized by the Object Management Group (OMG). It replaces
SysML v1 — the UML 2 profile that many systems engineers know — with a new,
formally grounded abstract syntax, a first-class textual notation, and an API
for exchanging models between tools (see [References](references.md)).

SysML v2 describes a system as a set of **definitions** and **usages**: a
`part def` defines a kind of part, and a `part` is a usage of it, in the same way
an `attribute` is a typed feature of its owner. Requirements, ports,
connections, states, and actions follow the same pattern, which is what lets a
single semantic model serve many kinds of diagrams.

## Built on KerML

SysML v2 does not define its semantics from scratch. Its kernel is **KerML**
(*Kernel Modeling Language*), which supplies the core concepts — classifiers,
features, types, and the relationships between them — and the expression
language used for constraints. SysML v2 is, in effect, the systems-engineering
layer built on top of KerML.

## Text-first notation

Alongside the conventional graphical notation, SysML v2 defines a standard
**textual notation** stored in `.sysml` files. A small model looks like this:

```sysml
package VehicleModel {
    part def Vehicle;
    part def Engine;

    part vehicle : Vehicle {
        part engine : Engine;
    }
}
```

The text and the diagram are two projections of one abstract model, not two
separate documents. `sysml2-mermaid` takes the **text as the single source of
truth** and recomputes the diagram from it on demand; nothing about the layout
is stored. This is the same stance as the sibling project
[`mermaid-opm`](https://github.com/fengdonglu/mermaid-opm) takes for OPM/OPL, and
it keeps models diffable and reviewable in version control. See the
[design background](../design/BACKGROUND.md) for the full reasoning.

## What this project implements

`sysml2-mermaid` supports a documented subset of the textual notation and five
views, rendered end to end from `.sysml` text to SVG:

- **Block Definition Diagram (BDD)** — `part def` / `part` definitions, usages,
  and their relationships.
- **Requirement diagram** — `requirement def` / `requirement` and their
  relationships.
- **Internal Block Diagram (IBD)** — parts, `port`s, and `connection`s.
- **State machine** — `state def` / `state` and transitions.
- **Activity / swimlane diagram** — `action def` / `action` and control flow.

A view is selected with a directive on the first line of the model
(`sysml bdd`, `sysml requirement`, `sysml ibd`, `sysml statemachine`,
`sysml activity`); without one, the BDD view is used. Full SysML v2 / KerML
grammar and semantic conformance are explicitly **out of scope**: the parser
accepts exactly the documented `.sysml` subset and reports anything else through
positioned diagnostics.

- [Architecture](../ARCHITECTURE.md) — how text becomes a diagram.
- [Roadmap](../ROADMAP.md) — what is implemented and what is planned.
- [References](references.md) — the standards and repositories behind the
  notation.
