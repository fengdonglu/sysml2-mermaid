# sysml2-mermaid documentation

English | [中文](index.zh.md)

`sysml2-mermaid` renders SysML v2 textual models (`.sysml`) as diagrams — a
Mermaid external diagram plugin, plus a `sysml2svg` CLI, a language server, and
a VS Code extension. This page is the entry point to the documentation; the
[README](../README.md) has the project overview and a quick start.

## Usage

How to install, write `.sysml`, and render diagrams.

- [Getting started](usage/getting-started.md) — install, first render, first CLI run.
- [SysML syntax](usage/sysml-syntax.md) — the supported subset, construct by construct.
- [CLI: sysml2svg](usage/cli.md) — options, exit codes, and diagnostics.
- [Mermaid plugin](usage/mermaid-plugin.md) — host requirements and limitations.
- [Editor integration](usage/editor-integration.md) — the LSP, and CLI/library alternatives.
- [VS Code extension](usage/vscode.md) — install, features, and commands.

## Development

For people building on or extending `sysml2-mermaid`.

- [Architecture](development/architecture.md) — layers and data flow.
- [Build and test](development/build-and-test.md) — commands and build outputs.
- [Integration](development/integration.md) — bundlers, Node/SSR, and the CDN.
- [Extending](development/extending.md) — add a view, an edge kind, or a sample.
- [Roadmap](development/roadmap.md) — planned work after the first release.

## About

Background, standards, and common questions.

- [What is SysML v2?](about/what-is-sysml.md) — SysML v2, KerML, and the textual notation.
- [References](about/references.md) — standards, official examples, and related projects.
- [FAQ](about/faq.md) — design questions and rendering on GitHub.

## Project

- [Architecture overview](../docs/ARCHITECTURE.md) and [Roadmap](../docs/ROADMAP.md).
- [Design background](design/BACKGROUND.md).
- [README](../README.md) — overview and quick start.
- [AGENTS.md](../AGENTS.md) — conventions for contributors and AI agents.
- [CONTRIBUTING.md](../CONTRIBUTING.md) — how to contribute.
