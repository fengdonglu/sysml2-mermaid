// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import mermaid from 'mermaid';
import { sysml } from '../src/mermaid/index.js';

beforeAll(async () => {
  mermaid.initialize({ startOnLoad: false });
  await mermaid.registerExternalDiagrams([sysml], { lazyLoad: false });
});

describe('mermaid integration', () => {
  it('detects a sysml diagram', () => {
    expect(sysml.detector('sysml\npackage P { }')).toBe(true);
    expect(sysml.detector('graph TD;')).toBe(false);
  });

  it('renders block names into the svg element', async () => {
    await mermaid.parse('sysml\npackage P { part def Engine; part def Car :> Engine; }');
    const { svg } = await mermaid.render('s2m-test', 'sysml\npackage P { part def Engine; part def Car :> Engine; }');
    expect(svg).toContain('Car');
    expect(svg).toContain('Engine');
  });
});

describe('gallery samples render through mermaid', () => {
  const samplesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'demo', 'samples');
  const samples = readdirSync(samplesDir).filter((f) => f.endsWith('.sysml'));
  for (const file of samples) {
    it(`${file} renders with content`, async () => {
      const source = readFileSync(join(samplesDir, file), 'utf8');
      const id = `g-${file.replace(/[^a-z0-9]/gi, '-')}`;
      const { svg } = await mermaid.render(id, source);
      expect(svg, file).toContain('\u00ab'); // every node draws a stereotype, e.g. «block»
    });
  }
});
