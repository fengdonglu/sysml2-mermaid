import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';
import { layout } from '../src/layout/index.js';

const scene = (src: string) => {
  const m = parseSysml('sysml\n' + src);
  validate(m);
  return layout(selectView(m, 'bdd'));
};

const src = 'package P { part def A; part def B :> A; part def C { part b : B; } }';

describe('layout', () => {
  it('positions every node with a positive size', () => {
    const s = scene(src);
    expect(s.nodes.length).toBe(3);
    for (const n of s.nodes) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(n.width).toBeGreaterThan(0);
      expect(n.height).toBeGreaterThan(0);
    }
  });
  it('gives edges routed points', () => {
    const s = scene(src);
    for (const e of s.edges) expect(e.points.length).toBeGreaterThanOrEqual(2);
  });
  it('sizes the scene around its content', () => {
    const s = scene(src);
    expect(s.width).toBeGreaterThan(0);
    expect(s.height).toBeGreaterThan(0);
  });
});
