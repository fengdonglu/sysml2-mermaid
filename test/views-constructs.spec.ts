import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { selectView } from '../src/views/index.js';

const model = (s: string) => { const m = parseSysml('sysml\n' + s); validate(m); return m; };
const bdd = (s: string) => selectView(model(s), 'bdd');

describe('constructs view', () => {
  it('stereotypes items, connections and interfaces', () => {
    const v = bdd('package P { item def Fuel; connection def C { end a : A; } interface def I; }');
    const byId = new Map(v.nodes.map((n) => [n.id, n]));
    expect(byId.get('P::Fuel')!.stereotype).toBe('item');
    expect(byId.get('P::C')!.stereotype).toBe('connection');
    expect(byId.get('P::I')!.stereotype).toBe('interface');
  });
  it('resolves alias references and emits allocate edges', () => {
    const m = model('package P { part def A; part def B; allocate A to B; alias aa for A; part def C { part x : aa; } }');
    expect(m.elements.get('P::C::x')!.typeId).toBe('P::A');
    const v = selectView(m, 'bdd');
    expect(v.edges.some((e) => e.kind === 'allocate')).toBe(true);
  });
});
