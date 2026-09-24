import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSvg } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const docs = join(here, '..', 'docs');
const ZH = '\u4e2d\u6587';

const GROUPS = {
  usage: ['getting-started', 'sysml-syntax', 'cli', 'mermaid-plugin', 'editor-integration', 'vscode'],
  development: ['architecture', 'build-and-test', 'integration', 'extending', 'roadmap'],
  about: ['what-is-sysml', 'references', 'faq'],
};

describe('docs', () => {
  it('every English guide has a Chinese sibling with cross links', () => {
    for (const [group, names] of Object.entries(GROUPS)) {
      for (const name of names) {
        const en = join(docs, group, `${name}.md`);
        const zh = join(docs, group, `${name}.zh.md`);
        expect(existsSync(en), en).toBe(true);
        expect(existsSync(zh), zh).toBe(true);
        expect(readFileSync(en, 'utf8'), en).toContain(`English | [${ZH}](${name}.zh.md)`);
        expect(readFileSync(zh, 'utf8'), zh).toContain(`[English](${name}.md) | ${ZH}`);
      }
    }
  });

  it('README and README.zh.md exist and link to each other', () => {
    const en = readFileSync(join(here, '..', 'README.md'), 'utf8');
    const zh = readFileSync(join(here, '..', 'README.zh.md'), 'utf8');
    expect(en).toContain('README.zh.md');
    expect(zh).toContain('README.md');
  });

  it('every ```sysml example in the guides renders to SVG', () => {
    let blocks = 0;
    for (const [group, names] of Object.entries(GROUPS)) {
      for (const name of names) {
        const file = join(docs, group, `${name}.md`);
        const md = readFileSync(file, 'utf8');
        for (const m of md.matchAll(/```sysml\r?\n([\s\S]*?)```/g)) {
          blocks++;
          expect(renderSvg(m[1]!), file).toContain('<svg');
        }
      }
    }
    expect(blocks).toBeGreaterThan(0);
  });
});
