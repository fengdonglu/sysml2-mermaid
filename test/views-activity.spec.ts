import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';

const view = (s: string) => { const m = parseSysml('sysml\n' + s); validate(m); return selectView(m, 'activity'); };

describe('activity view', () => {
  it('creates action nodes and succession edges', () => {
    const v = view('package P { action a; action b; first a then b; }');
    expect(v.nodes.find((n) => n.id === 'P::a')!.stereotype).toBe('action');
    expect(v.edges).toContainEqual(expect.objectContaining({ kind: 'succession', source: 'P::a', target: 'P::b' }));
  });
  it('adds a start node for first start', () => {
    const v = view('package P { action a; first start then a; }');
    expect(v.nodes.some((n) => n.stereotype === 'initial')).toBe(true);
  });
  it('groups performed actions into swimlanes', () => {
    const v = view('package P { part def W; action a; action b; part p : W { perform a; } first a then b; }');
    expect(v.groups && v.groups.length).toBeGreaterThan(0);
    expect(v.groups![0]!.members).toContain('P::a');
  });
});
