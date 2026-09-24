import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { renderModel } from '../src/index.js';
import { viewFromSource } from '../src/directive.js';

const demoDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'demo');

interface Example { id: string; title: string; sample: string; explanation: string }

async function loadExamples(): Promise<Example[]> {
  // @ts-expect-error - plain JS demo module has no type declarations
  const mod = (await import('../demo/examples.mjs')) as { default: Example[] };
  return mod.default;
}

describe('demo', () => {
  it('ships a gallery and a playground that use the browser bundle', () => {
    for (const file of ['index.html', 'playground.html']) {
      const html = readFileSync(join(demoDir, file), 'utf8');
      expect(html).toContain('../dist/sysml2-mermaid.mjs');
    }
  });

  it('has an example for every sample, and every sample is valid', async () => {
    const examples = await loadExamples();
    expect(examples.length).toBeGreaterThanOrEqual(8);
    const seen = new Set<string>();
    for (const ex of examples) {
      const path = join(demoDir, 'samples', ex.sample);
      expect(existsSync(path), `missing sample ${ex.sample}`).toBe(true);
      seen.add(ex.sample);
      const source = readFileSync(path, 'utf8');
      expect(viewFromSource(source), `${ex.sample} needs a view directive`).toBeTruthy();
      const model = renderModel(source);
      expect(model.diagnostics.filter((d) => d.severity === 'error'), `${ex.sample} has errors`).toEqual([]);
    }
  });
});
