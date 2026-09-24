import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';

const rels = (src: string) => parseSysml('sysml\n' + src).relationships.map((r) => [r.kind, r.sourceRef, r.targetRef] as const);

describe('parseSysml relations', () => {
  it('classifies definition :> as specialization', () => {
    expect(rels('package P { part def A :> B; }')).toEqual([['specialization', 'P::A', 'B']]);
  });
  it('supports the specializes keyword', () => {
    expect(rels('package P { part def A specializes B; }')).toEqual([['specialization', 'P::A', 'B']]);
  });
  it('classifies feature :> as subset and :>> as redefine', () => {
    expect(rels('package P { part def A { part w : Wheel :> all; } }')).toEqual([['subset', 'P::A::w', 'all']]);
    expect(rels('package P { part def A { part e : Engine :>> eng; } }')).toEqual([['redefine', 'P::A::e', 'eng']]);
  });
  it('supports the subsets and redefines keywords', () => {
    expect(rels('package P { part def A { part w : Wheel subsets all; } }')).toEqual([['subset', 'P::A::w', 'all']]);
    expect(rels('package P { part def A { part e : Engine redefines eng; } }')).toEqual([['redefine', 'P::A::e', 'eng']]);
  });
  it('parses nameless and named dependencies', () => {
    expect(rels('package P { dependency from A to B; }')).toEqual([['dependency', 'A', 'B']]);
    expect(rels('package P { dependency Use from A to B; }')).toEqual([['dependency', 'A', 'B']]);
  });
  it('expands multiple dependency targets', () => {
    expect(rels('package P { dependency from A to B, C; }')).toEqual([
      ['dependency', 'A', 'B'],
      ['dependency', 'A', 'C'],
    ]);
  });
  it('parses range and star multiplicities', () => {
    const m = parseSysml('sysml\npackage P { part def A { part x : T[0..*]; part y : T[*]; part z : T[4..6]; } }');
    expect(m.elements.get('P::A::x')!.multiplicity).toEqual({ lower: '0', upper: '*' });
    expect(m.elements.get('P::A::y')!.multiplicity).toEqual({ lower: '*', upper: '*' });
    expect(m.elements.get('P::A::z')!.multiplicity).toEqual({ lower: '4', upper: '6' });
  });
});
