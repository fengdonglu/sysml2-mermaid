import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';

const view = (s: string) => { const m = parseSysml('sysml\n' + s); validate(m); return selectView(m, 'statemachine'); };

describe('state machine view', () => {
  const src = 'package P { state s { state a; state b; transition t first a then b; first start then a; } }';

  it('creates a node per state', () => {
    const v = view(src);
    expect(v.nodes.find((n) => n.id === 'P::s::a')!.stereotype).toBe('state');
  });
  it('creates an initial pseudo-state node', () => {
    const v = view(src);
    expect(v.nodes.some((n) => n.stereotype === 'initial')).toBe(true);
  });
  it('emits transition edges', () => {
    const v = view(src);
    expect(v.edges.filter((e) => e.kind === 'transition').length).toBe(2);
  });
  it('derives containment for nested states', () => {
    const v = view(src);
    expect(v.edges).toContainEqual(expect.objectContaining({ kind: 'contain', source: 'P::s', target: 'P::s::a' }));
  });
});
