import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const readJson = (p: string) => JSON.parse(readFileSync(join(here, '..', p), 'utf8'));

describe('extension contributions', () => {
  it('registers the sysml language for .sysml', () => {
    const c = readJson('package.json').contributes;
    expect(c.languages[0].id).toBe('sysml');
    expect(c.languages[0].extensions).toContain('.sysml');
    expect(c.commands.map((x: { command: string }) => x.command)).toEqual(['sysml.preview', 'sysml.exportSvg']);
  });
  it('ships a parseable TextMate grammar', () => {
    const g = readJson('syntaxes/sysml.tmLanguage.json');
    expect(g.scopeName).toBe('source.sysml');
    expect(Array.isArray(g.patterns)).toBe(true);
    expect(g.patterns.length).toBeGreaterThan(0);
  });
});
