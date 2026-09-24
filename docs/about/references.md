# References

English | [中文](references.zh.md)

Sources behind the notation and the `.sysml` subset that `sysml2-mermaid`
implements.

## Standards

- **OMG SysML v2** — *Systems Modeling Language (SysML) Version 2.0*. Object
  Management Group. The standard that defines the language, its abstract syntax,
  and its textual and graphical notations: https://www.omg.org/spec/SysML/2.0/.
- **OMG KerML** — *Kernel Modeling Language (KerML) Version 1.0*. Object
  Management Group. The semantic kernel and expression language that SysML v2 is
  built upon: https://www.omg.org/spec/KerML/1.0/.

## Reference implementation and grammar

- **SysML-v2-Release** — the official SysML v2 / KerML pilot implementation
  repository maintained under the OMG Systems Modeling community:
  https://github.com/Systems-Modeling/SysML-v2-Release. It is the authoritative
  machine-readable source for the language. In particular:
  - `bnf/` — the grammar (BNF) files for KerML and SysML v2, used to align the
    parser with the official textual syntax;
  - `sysml/src/` — the standard library expressed in `.sysml` itself.

## Tools

- **Mermaid** — the diagramming language `sysml2-mermaid` integrates with
  through Mermaid's *external diagram* API: https://mermaid.js.org.
- **mermaid-opm** — the sibling project rendering OPM/OPL (ISO 19450) with the
  same architecture (Mermaid plugin, CLI, LSP, VS Code extension) and the
  working reference for this repository's conventions:
  https://github.com/fengdonglu/mermaid-opm.

## Local reference material

The repository keeps a local `reference/` directory holding the material used
while designing this project. It is **not committed**: `.gitignore` excludes it,
because it is local working material not needed to build or test the project. It
contains discussion records consulted during design — an OPM/OPL session export
and a transcript of a SysML v2 discussion. To consult a cited source, use the
official specification or repository links above.
