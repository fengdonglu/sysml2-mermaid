# Design background

English | [中文](BACKGROUND.zh.md)

This document records the reasoning behind the project's approach, distilled
from an earlier exploration of "how to build a lightest-possible SysML v2
renderer". The raw conversation is kept locally (git-ignored) under
`reference/` for provenance.

## The core idea: text is the source of truth

SysML v2 defines an abstract semantic model; the `.sysml` text and any diagram
are two representations of it. For a lightweight toolkit, the practical stance
is:

- **`.sysml` text is the single source of truth.**
- **Diagrams are a live projection** — recomputed from the text, never
  persisted.
- **No layout persistence, no graphical editing.** This avoids the classic
  "two sources of truth" problem (model + view/layout files that drift apart),
  just as an IDE renders a class diagram from source without storing node
  coordinates.

## Why Mermaid

Mermaid already provides the second half of a rendering pipeline: a node/edge
graph model (`Node`, `Edge`, `Cluster`) and layout engines (dagre, and an ELK
integration). A SysML tool can reuse that and focus on the first half —
understanding `.sysml` text and projecting it into diagrams.

## Diagram-type difficulty ranking

Not all SysML views are equal. Roughly:

- **Easy (node/edge):** Block Definition Diagram (BDD), Requirement diagram,
  State machine, Activity/Swimlane. These map onto Mermaid's generic graph
  model and existing layouts, including subgraphs for swimlanes.
- **Hard:** Internal Block Diagram (IBD) and Parametric diagrams. They need
  port placement, binding connectors, and constraint layout — beyond what a
  generic node/edge engine offers. A dedicated layout step (for example ELK
  with port constraints) is required.

So the MVP starts with the easy views and treats IBD/parametric as a later,
separate piece.

## Where an editor fits

A language server (diagnostics, completion, hover, outline) sits *beside* the
renderer — it consumes the same parser and model. It is not part of the
rendering pipeline, but it is what makes writing `.sysml` pleasant. The same
holds for the VS Code extension, which pairs the language server, syntax
highlighting, and a preview command.

## SysML v2 specifics to keep in mind

- The standard stack is **KerML** (semantic kernel), **SysML v2** (language),
  and the **Systems Modeling API & Services** (repository/CRUD/exchange).
- SysML v2 is far broader than a flowchart language: behavior, requirements,
  parameter constraints, allocations, and viewpoints all matter. A v1 must
  deliberately cover a documented subset rather than claim full conformance.
- The language has a native `view` / `viewpoint` notion, which is a natural
  place to hang "which elements does this diagram show".

## Relationship to OPM/OPL

The sibling project `mermaid-opm` (ISO 19450 OPM/OPL) put this exact approach
into practice at a smaller scale and is the working reference for this repo's
architecture, tooling, and conventions. OPM is a useful warm-up because its
node vocabulary (objects, processes, states) is small; SysML v2's is much
larger, which is why the view layer here carries more weight.
