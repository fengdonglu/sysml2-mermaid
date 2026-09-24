import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { renderModel } from '../src/index.js';
import { viewFromSource } from '../src/directive.js';

const demoDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'demo');
const PAGES = ['index.html', 'index.zh.html', 'playground.html', 'playground.zh.html'];
const REPO = 'https://github.com/fengdonglu/sysml2-mermaid';

interface Example { id: string; title: string; sample: string; explanation: string }

async function loadExamples(suffix: string): Promise<Example[]> {
  const mod = (await import(`../demo/examples${suffix}.mjs`)) as { default: Example[] };
  return mod.default;
}

describe('demo', () => {
  it('ships English and Chinese gallery and playground pages', () => {
    for (const file of PAGES) {
      const html = readFileSync(join(demoDir, file), 'utf8');
      expect(html, file).toContain('../dist/sysml2-mermaid.mjs');
    }
  });

  it('links every page back to the GitHub repository', () => {
    for (const file of PAGES) {
      const html = readFileSync(join(demoDir, file), 'utf8');
      expect(html, file).toContain(REPO);
      expect(html, file).toContain('class="repo-link"');
      expect(html, file).toContain('aria-label="GitHub repository"');
      expect(html, file).toContain('<span>fengdonglu/sysml2-mermaid</span>');
    }
  });

  it('offers a language switch on every page', () => {
    for (const file of PAGES) {
      const html = readFileSync(join(demoDir, file), 'utf8');
      if (file.endsWith('.zh.html')) {
        expect(html, file).toMatch(/hreflang="en"/);
        expect(html, file).toContain(file.replace('.zh.html', '.html'));
      } else {
        expect(html, file).toMatch(/hreflang="zh"/);
        expect(html, file).toContain(file.replace('.html', '.zh.html'));
      }
    }
  });

  for (const suffix of ['', '.zh']) {
    it(`examples${suffix}.mjs has valid samples with view directives`, async () => {
      const examples = await loadExamples(suffix);
      expect(examples.length).toBeGreaterThanOrEqual(8);
      for (const ex of examples) {
        const path = join(demoDir, 'samples', ex.sample);
        expect(existsSync(path), `missing sample ${ex.sample}`).toBe(true);
        const source = readFileSync(path, 'utf8');
        expect(viewFromSource(source), `${ex.sample} needs a view directive`).toBeTruthy();
        const model = renderModel(source);
        expect(model.diagnostics.filter((d) => d.severity !== 'info'), `${ex.sample} has diagnostics`).toEqual([]);
      }
    });
  }
});
