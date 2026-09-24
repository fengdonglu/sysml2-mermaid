import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';
import { layout } from '../src/layout/index.js';

describe('activity layout groups', () => {
  it('computes group bounds enclosing their members', () => {
    const m = parseSysml('sysml\npackage P { part def W; action a; action b; part p : W { perform a; } first a then b; }');
    validate(m);
    const s = layout(selectView(m, 'activity'));
    expect(s.groups && s.groups.length).toBe(1);
    const g = s.groups![0]!;
    const a = s.nodes.find((n) => n.id === 'P::a')!;
    expect(g.x).toBeLessThanOrEqual(a.x);
    expect(g.x + g.width).toBeGreaterThanOrEqual(a.x + a.width);
  });
});
