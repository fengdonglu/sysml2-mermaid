import { describe, it, expect } from 'vitest';
import { renderSvg } from '../src/index.js';

describe('scoped render', () => {
  it('drops unexposed blocks', () => {
    const src = 'sysml bdd\npackage P { part def A; part def B; view def V :> GeneralView; view v : V { expose P::A; } }';
    const svg = renderSvg(src);
    expect(svg).toContain('A');
    expect(svg).not.toMatch(/block» B/);
  });
});
