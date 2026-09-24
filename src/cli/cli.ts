#!/usr/bin/env node
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { renderModel, renderSvg, renderSvgAsync, type LayoutEngine } from '../api.js';
import { VIEW_NAMES, type ViewName } from '../views/types.js';

const LAYOUTS: LayoutEngine[] = ['dagre', 'elk'];
const USAGE = 'usage: sysml2svg <input.sysml> [-o out.svg] [--view bdd|requirement|ibd|statemachine|activity] [--view-name NAME] [--layout dagre|elk] [--json out.json]\n';

export async function runCli(argv: string[]): Promise<number> {
  const [input, ...rest] = argv;
  if (!input) { process.stderr.write(USAGE); return 1; }

  let out = input.replace(/\.sysml$/i, '') + '.svg';
  let jsonOut: string | undefined;
  let view = 'bdd';
  let viewName: string | undefined;
  let layoutEngine: LayoutEngine = 'dagre';

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]!;
    if (arg === '-o' || arg === '--json' || arg === '--view' || arg === '--view-name' || arg === '--layout') {
      const value = rest[i + 1];
      if (value === undefined || value.startsWith('-')) { process.stderr.write(USAGE); return 1; }
      if (arg === '-o') out = value;
      else if (arg === '--json') jsonOut = value;
      else if (arg === '--view') view = value;
      else if (arg === '--view-name') viewName = value;
      else layoutEngine = value as LayoutEngine;
      i++;
    } else {
      process.stderr.write(`error: unknown argument: ${arg}\n`);
      process.stderr.write(USAGE);
      return 1;
    }
  }

  if (!VIEW_NAMES.includes(view as ViewName)) { process.stderr.write(`error: unknown view: ${view}\n`); return 1; }
  if (!LAYOUTS.includes(layoutEngine)) { process.stderr.write(`error: unknown layout: ${layoutEngine}\n`); return 1; }

  let source: string;
  try {
    source = readFileSync(input, 'utf8');
  } catch (err) {
    process.stderr.write(`error: cannot read ${input}: ${(err as Error).message}\n`);
    return 1;
  }

  const model = renderModel(source);
  const svg = await renderSvgAsync(source, { view: view as ViewName, viewName, layout: layoutEngine });
  writeFileSync(out, svg, 'utf8');
  if (jsonOut) {
    writeFileSync(jsonOut, JSON.stringify({
      elements: [...model.elements.values()],
      relationships: model.relationships,
      diagnostics: model.diagnostics,
    }, null, 2), 'utf8');
  }

  for (const d of model.diagnostics) {
    process.stderr.write(`${d.severity}: ${d.code} @${d.line}:${d.column} ${d.message}\n`);
  }
  return model.diagnostics.some((d) => d.severity === 'error') ? 1 : 0;
}

if (process.argv[1]) {
  let invoked = process.argv[1];
  try { invoked = realpathSync(process.argv[1]); } catch { /* ignore */ }
  if (import.meta.url === pathToFileURL(invoked).href) {
    runCli(process.argv.slice(2)).then((code) => process.exit(code));
  }
}
