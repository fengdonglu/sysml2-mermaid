# CLI: sysml2svg

English | [中文](cli.zh.md)

`sysml2svg` converts a `.sysml` file into an SVG diagram and prints the parsed
model's diagnostics to stderr.

## Synopsis

```
sysml2svg <input.sysml> [-o out.svg] [--view bdd|requirement|ibd|statemachine|activity] [--view-name NAME] [--layout dagre|elk] [--json out.json]
```

## Options

| Option | Meaning |
| --- | --- |
| `-o <file>` | Write the SVG to `<file>`. Default: the input path with a `.svg` extension (`.sysml` is replaced). |
| `--view <name>` | Choose the view. One of `bdd`, `requirement`, `ibd`, `statemachine`, `activity`. Default: `bdd`. |
| `--view-name <name>` | Render a named `view` (its kind and `expose` / `filter` scope). |
| `--layout <engine>` | `dagre` (default) or `elk`. ELK gives port-aware, orthogonal routing for IBD. |
| `--json <file>` | Additionally write `{ elements, relationships, diagnostics }` as pretty-printed JSON. |

Options may appear in any order after the input file. A value is required for
`-o`, `--view`, and `--json`; a missing value (or one that starts with `-`) is a
usage error.

## Exit codes

- `0` — success. Warnings do **not** affect the exit code.
- `1` — failure: any `error` diagnostic, an unknown view, an unreadable or
  missing input file, or a usage error (missing input, unknown flag, or a missing
  option value).

An unknown flag prints an `error:` line followed by the usage line; a missing
input argument or a missing option value prints only the usage line. An
unreadable or nonexistent input file prints `error: cannot read <file>: <reason>`
with no usage line. All are written to stderr:

```
error: unknown argument: --theme
usage: sysml2svg <input.sysml> [-o out.svg] [--view bdd|requirement|ibd|statemachine|activity] [--view-name NAME] [--layout dagre|elk] [--json out.json]
```

## Diagnostics

Diagnostics are written to stderr, one per line, as:

```
<severity>: <code> @<line>:<column> <message>
```

The parser never throws. Codes include `error` values such as `unexpected-token`,
`unsupported-construct`, and `duplicate-definition`, and the `warning`
`unresolved-reference`. The SVG is written even when diagnostics are present, so
you can inspect the partial render; the exit code still reflects any `error`.

## Examples

Given `model.sysml`:

```sysml
sysml bdd
package Vehicle {
    part def PowerSource;
    part def Engine :> PowerSource;
    part def Vehicle {
        part engine : Engine;
    }
}
```

Convert it to `model.svg` (the default output path):

```bash
npx sysml2svg model.sysml
```

Pick a view and an explicit output path, and also dump the model:

```bash
npx sysml2svg model.sysml --view ibd -o out/diagram.svg --json out/diagram.json
```

Wrap it in a script and fail the build on errors:

```bash
npx sysml2svg model.sysml -o model.svg || exit 1
```

## See also

- [Getting started](getting-started.md) — install and first render.
- [SysML syntax](sysml-syntax.md) — the supported subset.
- [Editor integration](editor-integration.md) — using the CLI for on-save
  diagnostics.
